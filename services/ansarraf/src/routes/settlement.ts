import type {FastifyInstance,FastifyRequest} from 'fastify';
import type {Pool} from 'pg';
import {createHash,randomUUID} from 'node:crypto';
import {calculateInternalTradeFee} from '../fee-engine.js';

const validId=(v:unknown)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>0;
const amount=(v:unknown)=>typeof v==='string'&&/^(?:0|[1-9]\d{0,27})(?:\.\d{1,18})?$/.test(v)&&v!=='0'&&!/^0\.0+$/.test(v);
const idem=(v:unknown)=>typeof v==='string'&&v.length>=8&&v.length<=200;

export function registerSettlementRoutes(app:FastifyInstance,pool:Pool){
  app.post('/internal/v1/trades/settle',async(req,reply)=>{
    const token=process.env.ANSARRAF_INTERNAL_TOKEN;
    if(!token||req.headers.authorization!==`Bearer ${token}`)return reply.code(401).send({error:'unauthorized'});

    const b=(req.body??{}) as any;
    if(!validId(b.orderId)||!validId(b.counterpartyOrderId)||b.orderId===b.counterpartyOrderId||
       !amount(b.quantity)||!amount(b.price)||!idem(b.idempotencyKey)||
       (b.feeAmount!==undefined&&!amount(b.feeAmount))||
       (b.feeAssetId!==undefined&&!validId(b.feeAssetId)))
      return reply.code(400).send({error:'invalid_trade_settlement'});

    const client=await pool.connect();
    try{
      await client.query('BEGIN');

      const existing=await client.query(
        'SELECT * FROM trades WHERE settlement_idempotency_key=$1 FOR UPDATE',
        [b.idempotencyKey]
      );
      if(existing.rows[0]){
        await client.query('ROLLBACK');
        return {trade:existing.rows[0],idempotent:true};
      }

      // Lock orders in deterministic ID order to prevent buyer/seller deadlocks.
      const low=Math.min(b.orderId,b.counterpartyOrderId);
      const high=Math.max(b.orderId,b.counterpartyOrderId);
      const oq=await client.query(
        'SELECT * FROM orders WHERE id IN ($1,$2) ORDER BY id FOR UPDATE',
        [low,high]
      );
      if(oq.rows.length!==2)throw new Error('trade_order_not_found');

      const order=oq.rows.find((x:any)=>Number(x.id)===b.orderId);
      const other=oq.rows.find((x:any)=>Number(x.id)===b.counterpartyOrderId);
      if(!order||!other)throw new Error('trade_order_not_found');
      if(!['open','partially_filled'].includes(order.status)||!['open','partially_filled'].includes(other.status))
        throw new Error('trade_order_not_open');
      if(order.base_asset_id!==other.base_asset_id||order.quote_asset_id!==other.quote_asset_id||order.side===other.side)
        throw new Error('invalid_trade_counterparty');
      if(order.customer_id===other.customer_id)
        throw new Error('self_trade_not_allowed');

      // Remaining quantities are calculated by PostgreSQL NUMERIC, never by JS Number.
      const remaining=async(o:any)=>{
        const r=await client.query('SELECT ($1::numeric-COALESCE(SUM(quantity),0))::text AS remaining FROM trades WHERE order_id=$2',[o.quantity,o.id]);
        return r.rows[0].remaining;
      };
      const rem1=await remaining(order),rem2=await remaining(other);
      const q=String(b.quantity);
      const quantityCheck=await client.query(
        'SELECT ($1::numeric > 0 AND $1::numeric <= $2::numeric AND $1::numeric <= $3::numeric) AS valid',[q,rem1,rem2]
      );
      if(!quantityCheck.rows[0].valid)throw new Error('trade_quantity_exceeds_remaining');

      const priceCheck=await client.query(
        `SELECT ($1::numeric > 0 AND ($2::text <> 'limit' OR $1::numeric=$3::numeric) AND ($4::text <> 'limit' OR $1::numeric=$5::numeric)) AS valid`,
        [String(b.price),order.order_type,order.price,other.order_type,other.price]
      );
      if(!priceCheck.rows[0].valid)throw new Error('trade_price_mismatch');

      const buyer=order.side==='buy'?order:other;
      const seller=order.side==='sell'?order:other;
      const calculatedFee=await calculateInternalTradeFee(client,Number(buyer.base_asset_id),Number(buyer.quote_asset_id),buyer.side,q,String(b.price));
      const feeAmount=calculatedFee.customerFeeAmount;
      const feeAssetId=calculatedFee.feeAssetId;
      if(b.feeAmount!==undefined){
        const requestedFee=await client.query('SELECT ($1::numeric=$2::numeric) AS valid',[String(b.feeAmount),feeAmount]);
        if(!requestedFee.rows[0].valid)throw new Error('fee_mismatch');
      }
      if(b.feeAssetId!==undefined && Number(b.feeAssetId)!==Number(feeAssetId??0))throw new Error('fee_asset_mismatch');

      const quote=await client.query('SELECT ($1::numeric*$2::numeric)::text AS amount',[q,String(b.price)]);
      const quoteAmount=quote.rows[0].amount;

      const buyerRes=await client.query(
        'SELECT * FROM wallet_reservations WHERE order_id=$1 AND status=\'active\' FOR UPDATE',[buyer.id]
      );
      const sellerRes=await client.query(
        'SELECT * FROM wallet_reservations WHERE order_id=$1 AND status=\'active\' FOR UPDATE',[seller.id]
      );
      if(!buyerRes.rows[0]||!sellerRes.rows[0])throw new Error('wallet_reservation_missing');
      if(Number(buyerRes.rows[0].asset_id)!==Number(buyer.quote_asset_id))throw new Error('buyer_reservation_asset_mismatch');
      if(Number(sellerRes.rows[0].asset_id)!==Number(seller.base_asset_id))throw new Error('seller_reservation_asset_mismatch');

      // Lock both wallets deterministically.
      const walletIds=[Number(buyerRes.rows[0].wallet_id),Number(sellerRes.rows[0].wallet_id)].sort((a,b)=>a-b);
      const wq=await client.query('SELECT * FROM wallets WHERE id IN ($1,$2) ORDER BY id FOR UPDATE',[walletIds[0],walletIds[1]]);
      if(wq.rows.length!==2)throw new Error('settlement_wallet_not_found');

      const buyerWallet=wq.rows.find((x:any)=>Number(x.id)===Number(buyerRes.rows[0].wallet_id));
      const sellerWallet=wq.rows.find((x:any)=>Number(x.id)===Number(sellerRes.rows[0].wallet_id));
      if(!buyerWallet||!sellerWallet)throw new Error('settlement_wallet_not_found');

      const buyerRemaining=await client.query(
        'SELECT ($1::numeric-$2::numeric)::text AS remaining',[buyerRes.rows[0].amount,buyerRes.rows[0].consumed_amount]
      );
      const sellerRemaining=await client.query(
        'SELECT ($1::numeric-$2::numeric)::text AS remaining',[sellerRes.rows[0].amount,sellerRes.rows[0].consumed_amount]
      );
      const reservationCheck=await client.query(
        'SELECT ($1::numeric >= $2::numeric AND $3::numeric >= $4::numeric) AS valid',
        [buyerRemaining.rows[0].remaining,quoteAmount,sellerRemaining.rows[0].remaining,q]
      );
      if(!reservationCheck.rows[0].valid)throw new Error('reservation_insufficient');

      // Consume locked quote from buyer and locked base from seller.
      // For a sell-side base-asset fee, first top up the locked fee from the seller's available balance.
      if(Number(feeAssetId)===Number(seller.base_asset_id) && feeAmount!=='0'){
        const topped=await client.query(
          'UPDATE wallets SET available_balance=available_balance-$1::numeric,locked_balance=locked_balance+$1::numeric WHERE id=$2 AND available_balance >= $1::numeric RETURNING id',
          [feeAmount,sellerWallet.id]
        );
        if(!topped.rows[0])throw new Error('seller_fee_balance_insufficient');
      }
      const bw=await client.query(
        'UPDATE wallets SET locked_balance=locked_balance-$1 WHERE id=$2 AND locked_balance >= $1 RETURNING id',
        [quoteAmount,buyerWallet.id]
      );
      if(!bw.rows[0])throw new Error('buyer_locked_balance_invariant_failed');
      const sellerLockedDebit=feeAssetId!==null&&Number(feeAssetId)===Number(seller.base_asset_id)
        ? (await client.query('SELECT ($1::numeric+$2::numeric)::text AS amount',[q,feeAmount])).rows[0].amount
        : q;
      const sw=await client.query(
        'UPDATE wallets SET locked_balance=locked_balance-$1 WHERE id=$2 AND locked_balance >= $1 RETURNING id',
        [sellerLockedDebit,sellerWallet.id]
      );
      if(!sw.rows[0])throw new Error('seller_locked_balance_invariant_failed');

      // Deliver assets. Buy-side base fee is taken from the received base asset.
      const buyerBaseFee=order.side==='buy'&&feeAssetId!==null&&Number(feeAssetId)===Number(buyer.base_asset_id)?feeAmount:'0';
      const baseCredit=await client.query('SELECT ($1::numeric-$2::numeric)::text AS amount',[q,buyerBaseFee]);
      const baseCreditCheck=await client.query('SELECT ($1::numeric >= 0) AS valid',[baseCredit.rows[0].amount]);
      if(!baseCreditCheck.rows[0].valid)throw new Error('fee_exceeds_base_fill');

      const bcredit=await client.query(
        'UPDATE wallets SET available_balance=available_balance+$1 WHERE customer_id=$2 AND asset_id=$3 RETURNING id',
        [baseCredit.rows[0].amount,buyer.customer_id,buyer.base_asset_id]
      );
      if(!bcredit.rows[0]){
        await client.query('INSERT INTO wallets(customer_id,asset_id,available_balance) VALUES($1,$2,$3)',[buyer.customer_id,buyer.base_asset_id,baseCredit.rows[0].amount]);
      }
      const scredit=await client.query(
        'UPDATE wallets SET available_balance=available_balance+$1 WHERE customer_id=$2 AND asset_id=$3 RETURNING id',
        [quoteAmount,seller.customer_id,seller.quote_asset_id]
      );
      if(!scredit.rows[0]){
        await client.query('INSERT INTO wallets(customer_id,asset_id,available_balance) VALUES($1,$2,$3)',[seller.customer_id,seller.quote_asset_id,quoteAmount]);
      }

      const operationId='ANSARRAF-TR-'+randomUUID();
      const trade=await client.query(
        'INSERT INTO trades(order_id,counterparty_order_id,quantity,price,fee_amount,fee_asset_id,settlement_status,settlement_idempotency_key,settled_at,operation_id,settlement_source,customer_fee_amount,provider_fee_amount,company_revenue_amount) VALUES($1,$2,$3,$4,$5,$6,\'settled\',$7,NOW(),$8,\'internal_match\',$9,0,0) RETURNING *',
        [order.id,other.id,q,String(b.price),feeAmount,feeAssetId,b.idempotencyKey,operationId,feeAmount]
      );
      const tradeId=String(trade.rows[0].id);
      const buyerProvenanceAmount=baseCredit.rows[0].amount;
      const sellerProvenanceAmount=feeAssetId!==null&&Number(feeAssetId)===Number(seller.base_asset_id)
        ? (await client.query('SELECT ($1::numeric+$2::numeric)::text AS amount',[q,feeAmount])).rows[0].amount
        : q;
      if(sellerProvenanceAmount!==q){
        await client.query('UPDATE wallet_reservations SET amount=amount+$1::numeric WHERE id=$2',[feeAmount,sellerRes.rows[0].id]);
      }
      await client.query(
        `INSERT INTO asset_provenance(customer_id,asset_id,direction,amount,source_type,source_id,operation_id,ledger_entry_reference)
         VALUES
         ($1,$2,'CREDIT',$3,'TRADE',$4,$5,$4),
         ($6,$2,'DEBIT',$7,'TRADE',$4,$5,$4),
         ($8,$9,'CREDIT',$10,'TRADE',$4,$5,$4),
         ($11,$9,'DEBIT',$10,'TRADE',$4,$5,$4)`,
        [buyer.customer_id,buyer.base_asset_id,buyerProvenanceAmount,tradeId,operationId,seller.customer_id,sellerProvenanceAmount,seller.customer_id,buyer.quote_asset_id,quoteAmount,buyer.customer_id]
      );

      // Consume reservation portions. Fully consumed reservations are captured;
      // partially consumed reservations remain active.
      const sellerReservationUse=feeAssetId!==null&&Number(feeAssetId)===Number(seller.base_asset_id)
        ? (await client.query('SELECT ($1::numeric+$2::numeric)::text AS amount',[q,feeAmount])).rows[0].amount
        : q;
      for(const x of [{r:buyerRes.rows[0],used:quoteAmount},{r:sellerRes.rows[0],used:sellerReservationUse}]){
        const upd=await client.query(
          'UPDATE wallet_reservations SET consumed_amount=consumed_amount+$1,status=CASE WHEN consumed_amount+$1>=amount THEN \'captured\' ELSE \'active\' END,resolved_at=CASE WHEN consumed_amount+$1>=amount THEN NOW() ELSE NULL END WHERE id=$2 RETURNING *',
          [x.used,x.r.id]
        );
        if(!upd.rows[0])throw new Error('reservation_update_failed');
      }

      await client.query(
        'INSERT INTO accounting_outbox(event_type,aggregate_type,aggregate_id,idempotency_key,payload) VALUES($1,$2,$3,$4,$5)',
        ['exchange.trade.settled','trade',String(trade.rows[0].id),`ansarraf:trade:${trade.rows[0].id}`,{
          tradeId:trade.rows[0].id,
          orderId:order.id,
          counterpartyOrderId:other.id,
          buyerCustomerId:buyer.customer_id,
          sellerCustomerId:seller.customer_id,
          side:order.side,
          baseAssetId:buyer.base_asset_id,
          quoteAssetId:buyer.quote_asset_id,
          quantity:q,
          price:String(b.price),
          quoteAmount,
          feeAmount,
          feeAssetId,
          operationId,
          customerFeeAmount:feeAmount,
          providerFeeAmount:calculatedFee.providerFeeAmount,
          providerFeeAssetId:calculatedFee.providerFeeAssetId,
          companyRevenueAmount:calculatedFee.companyRevenueAmount
        }]
      );

      // Release any excess reservation when the corresponding order is now fully filled.
      for(const oid of [buyer.id,seller.id]){
        const or=await client.query('SELECT quantity FROM orders WHERE id=$1',[oid]);
        const fr=await client.query('SELECT COALESCE(SUM(quantity),0)::text AS filled FROM trades WHERE order_id=$1',[oid]);
        const fullyFilled=await client.query('SELECT ($1::numeric >= $2::numeric) AS valid',[fr.rows[0].filled,or.rows[0].quantity]);
        if(fullyFilled.rows[0].valid){
          const rr=await client.query('SELECT * FROM wallet_reservations WHERE order_id=$1 AND status=\'active\' FOR UPDATE',[oid]);
          if(rr.rows[0]){
            const unused=await client.query('SELECT (amount-consumed_amount)::text AS amount FROM wallet_reservations WHERE id=$1',[rr.rows[0].id]);
            const unusedPositive=await client.query('SELECT ($1::numeric > 0) AS valid',[unused.rows[0].amount]);
            if(unusedPositive.rows[0].valid){
              const released=await client.query('UPDATE wallets SET locked_balance=locked_balance-$1,available_balance=available_balance+$1 WHERE id=$2 AND locked_balance >= $1 RETURNING id',[unused.rows[0].amount,rr.rows[0].wallet_id]);
              if(!released.rows[0])throw new Error('unused_reservation_release_failed');
            }
            await client.query('UPDATE wallet_reservations SET status=\'released\',resolved_at=NOW() WHERE id=$1',[rr.rows[0].id]);
          }
          await client.query('UPDATE orders SET status=\'filled\',reserved_asset_id=NULL,reserved_amount=0 WHERE id=$1',[oid]);
        }else{
          await client.query('UPDATE orders SET status=\'partially_filled\' WHERE id=$1 AND status=\'open\'',[oid]);
          await client.query('UPDATE orders SET reserved_amount=(SELECT amount-consumed_amount FROM wallet_reservations WHERE order_id=$1 AND status=\'active\') WHERE id=$1',[oid]);
        }
      }

      await client.query('COMMIT');
      return reply.code(201).send({trade:trade.rows[0],idempotent:false});
    }catch(e:any){
      await client.query('ROLLBACK');
      req.log.error(e);
      return reply.code(400).send({error:e instanceof Error?e.message:'trade_settlement_failed'});
    }finally{client.release();}
  });
}