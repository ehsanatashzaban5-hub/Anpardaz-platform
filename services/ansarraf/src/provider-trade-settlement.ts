import type {Pool} from 'pg';
import {createHash} from 'node:crypto';
import {calculateInternalTradeFee} from './fee-engine.js';
import type {ProviderOrderResult} from './providers/types.js';

const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');

export async function settleProviderExecution(pool:Pool,providerOrderId:number,result:ProviderOrderResult){
  const client=await pool.connect();
  try{
    await client.query('BEGIN');

    const q=await client.query(
      `SELECT po.*,o.customer_id,o.base_asset_id,o.quote_asset_id,o.side AS customer_side,
              ba.symbol AS base_symbol,qa.symbol AS quote_symbol,
              lp.code AS provider_code
       FROM provider_orders po
       JOIN orders o ON o.id=po.customer_order_id
       JOIN assets ba ON ba.id=o.base_asset_id
       JOIN assets qa ON qa.id=o.quote_asset_id
       JOIN liquidity_providers lp ON lp.id=po.provider_id
       WHERE po.id=$1
       FOR UPDATE`,
      [providerOrderId]
    );
    const po=q.rows[0];
    if(!po)throw new Error('provider_order_not_found');

    const regression=await client.query(
      `SELECT
        ($1::numeric >= settled_quantity) AS qty_ok,
        ($2::numeric >= settled_quote_amount) AS quote_ok,
        ($3::numeric >= settled_provider_fee_amount) AS fee_ok`,
      [result.executedQuantity,result.executedQuoteAmount,result.providerFeeAmount]
    );
    if(!regression.rows[0].qty_ok||!regression.rows[0].quote_ok||!regression.rows[0].fee_ok){
      await client.query(
        `UPDATE provider_orders
         SET settlement_status='QUARANTINED',error_code='provider_execution_regression',
             error_message='Provider cumulative execution regressed',updated_at=NOW()
         WHERE id=$1`,
        [providerOrderId]
      );
      await client.query('COMMIT');
      return {settled:false,quarantined:true,reason:'provider_execution_regression'};
    }

    const delta=await client.query(
      `SELECT
        ($1::numeric-$2::numeric)::text AS quantity,
        ($3::numeric-$4::numeric)::text AS quote_amount,
        ($5::numeric-$6::numeric)::text AS provider_fee`,
      [result.executedQuantity,po.settled_quantity,result.executedQuoteAmount,po.settled_quote_amount,result.providerFeeAmount,po.settled_provider_fee_amount]
    );
    const d=delta.rows[0];
    const positive=await client.query(
      `SELECT ($1::numeric>0 AND $2::numeric>0) AS valid`,
      [d.quantity,d.quote_amount]
    );
    if(!positive.rows[0].valid){
      if(result.status==='FILLED'){
        await client.query(
          `UPDATE provider_orders
           SET settlement_status='SETTLED',updated_at=NOW()
           WHERE id=$1`,
          [providerOrderId]
        );
      }else if(result.status==='CANCELLED'||result.status==='REJECTED'){
        const reservation=await client.query(
          "SELECT * FROM wallet_reservations WHERE order_id=$1 AND status='active' FOR UPDATE",
          [po.customer_order_id]
        );
        if(reservation.rows[0]){
          const rr=reservation.rows[0];
          const released=await client.query(
            `UPDATE wallets
             SET locked_balance=locked_balance-$1::numeric,
                 available_balance=available_balance+$1::numeric
             WHERE id=$2 AND locked_balance >= $1::numeric
             RETURNING id`,
            [await client.query('SELECT (amount-consumed_amount)::text AS amount FROM wallet_reservations WHERE id=$1',[rr.id]).then(x=>x.rows[0].amount),rr.wallet_id]
          );
          if(!released.rows[0])throw new Error('provider_cancel_reservation_release_failed');
          await client.query("UPDATE wallet_reservations SET status='released',resolved_at=NOW() WHERE id=$1",[rr.id]);
        }
        await client.query(
          "UPDATE orders SET status='cancelled',reserved_asset_id=NULL,reserved_amount=0 WHERE id=$1",
          [po.customer_order_id]
        );
        await client.query(
          `UPDATE provider_orders SET settlement_status='SETTLED',updated_at=NOW() WHERE id=$1`,
          [providerOrderId]
        );
      }
      await client.query('COMMIT');
      return {settled:false,quarantined:false,reason:'no_new_execution'};
    }

    const price=await client.query(
      'SELECT ($1::numeric/$2::numeric)::text AS value',
      [d.quote_amount,d.quantity]
    );
    const fee=await calculateInternalTradeFee(
      client,
      Number(po.base_asset_id),
      Number(po.quote_asset_id),
      po.customer_side,
      d.quantity,
      price.rows[0].value
    );

    if(fee.feeAssetId!==Number(po.base_asset_id))
      throw new Error('provider_settlement_requires_base_fee_asset');

    if(result.providerFeeAssetSymbol && String(result.providerFeeAssetSymbol).toUpperCase()!==String(po.base_symbol).toUpperCase())
      throw new Error('provider_fee_asset_not_supported_for_settlement');

    const providerFeeAsset=await client.query(
      `SELECT id FROM assets WHERE symbol=$1 AND status='active'`,
      [result.providerFeeAssetSymbol??po.base_symbol]
    );
    if(!providerFeeAsset.rows[0])throw new Error('provider_fee_asset_not_found');

    const providerFeeAssetId=Number(providerFeeAsset.rows[0].id);
    if(providerFeeAssetId!==Number(po.base_asset_id))
      throw new Error('provider_fee_asset_must_match_base');

    const revenue=await client.query(
      `SELECT GREATEST($1::numeric-$2::numeric,0)::text AS amount`,
      [fee.customerFeeAmount,d.providerFee]
    );
    const companyRevenue=revenue.rows[0].amount;

    const wallet=await client.query(
      `SELECT w.*
       FROM wallets w
       WHERE w.customer_id=$1 AND w.asset_id=$2
       FOR UPDATE`,
      [po.customer_id,po.customer_side==='buy'?po.quote_asset_id:po.base_asset_id]
    );
    if(!wallet.rows[0])throw new Error('settlement_wallet_not_found');

    if(po.customer_side==='buy'){
      const check=await client.query(
        'SELECT (locked_balance >= $1::numeric) AS valid',
        [d.quote_amount]
      );
      if(!check.rows[0].valid)throw new Error('provider_buy_quote_reservation_insufficient');

      const debit=await client.query(
        `UPDATE wallets
         SET locked_balance=locked_balance-$1::numeric
         WHERE id=$2 AND locked_balance >= $1::numeric
         RETURNING id`,
        [d.quote_amount,wallet.rows[0].id]
      );
      if(!debit.rows[0])throw new Error('provider_buy_locked_balance_invariant_failed');

      const netBase=await client.query(
        'SELECT ($1::numeric-$2::numeric)::text AS amount',
        [d.quantity,fee.customerFeeAmount]
      );
      if(netBase.rows[0].amount==='0')throw new Error('provider_settlement_zero_customer_credit');

      await client.query(
        `INSERT INTO wallets(customer_id,asset_id,available_balance)
         VALUES($1,$2,$3)
         ON CONFLICT(customer_id,asset_id)
         DO UPDATE SET available_balance=wallets.available_balance+EXCLUDED.available_balance`,
        [po.customer_id,po.base_asset_id,netBase.rows[0].amount]
      );
    }else{
      const totalBase=await client.query(
        'SELECT ($1::numeric+$2::numeric)::text AS amount',
        [d.quantity,fee.customerFeeAmount]
      );
      const check=await client.query(
        'SELECT (locked_balance >= $1::numeric) AS valid',
        [totalBase.rows[0].amount]
      );
      if(!check.rows[0].valid)throw new Error('provider_sell_base_reservation_insufficient');

      const debit=await client.query(
        `UPDATE wallets
         SET locked_balance=locked_balance-$1::numeric
         WHERE id=$2 AND locked_balance >= $1::numeric
         RETURNING id`,
        [totalBase.rows[0].amount,wallet.rows[0].id]
      );
      if(!debit.rows[0])throw new Error('provider_sell_locked_balance_invariant_failed');

      await client.query(
        `INSERT INTO wallets(customer_id,asset_id,available_balance)
         VALUES($1,$2,$3)
         ON CONFLICT(customer_id,asset_id)
         DO UPDATE SET available_balance=wallets.available_balance+EXCLUDED.available_balance`,
        [po.customer_id,po.quote_asset_id,d.quote_amount]
      );
    }

    const operationId='ANSARRAF-PESET-'+hash({
      providerOrderId,
      quantity:d.quantity,
      quoteAmount:d.quote_amount,
      providerFee:d.providerFee
    }).slice(0,40);

    const inserted=await client.query(
      `INSERT INTO provider_trade_settlements
       (provider_order_id,customer_order_id,operation_id,quantity,quote_amount,
        customer_fee_amount,provider_fee_amount,provider_fee_asset_id,
        company_revenue_amount,execution_price,status)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'SETTLED')
       ON CONFLICT(provider_order_id,quantity,quote_amount,provider_fee_amount) DO NOTHING
       RETURNING *`,
      [
        providerOrderId,po.customer_order_id,operationId,d.quantity,d.quote_amount,
        fee.customerFeeAmount,d.provider_fee,providerFeeAssetId,companyRevenue,price.rows[0].value
      ]
    );
    if(!inserted.rows[0]){
      await client.query('ROLLBACK');
      return {settled:false,quarantined:false,reason:'settlement_already_exists'};
    }

    const baseProvenanceAmount=po.customer_side==='buy'
      ? (await client.query('SELECT ($1::numeric-$2::numeric)::text AS amount',[d.quantity,fee.customerFeeAmount])).rows[0].amount
      : (await client.query('SELECT ($1::numeric+$2::numeric)::text AS amount',[d.quantity,fee.customerFeeAmount])).rows[0].amount;
    const quoteDirection=po.customer_side==='buy'?'DEBIT':'CREDIT';
    const baseDirection=po.customer_side==='buy'?'CREDIT':'DEBIT';
    await client.query(
      `INSERT INTO asset_provenance(customer_id,asset_id,direction,amount,source_type,source_id,operation_id,ledger_entry_reference)
       VALUES
       ($1,$2,$3,$4,'PROVIDER_TRADE_SETTLEMENT',$5,$6,$5),
       ($1,$7,$8,$9,'PROVIDER_TRADE_SETTLEMENT',$5,$6,$5)`,
      [po.customer_id,po.base_asset_id,baseDirection,baseProvenanceAmount,String(inserted.rows[0].id),operationId,po.quote_asset_id,quoteDirection,d.quote_amount]
    );

    const targetQty=await client.query(
      `SELECT ($1::numeric+$2::numeric)::text AS value`,
      [po.settled_quantity,d.quantity]
    );
    const targetQuote=await client.query(
      `SELECT ($1::numeric+$2::numeric)::text AS value`,
      [po.settled_quote_amount,d.quote_amount]
    );
    const targetFee=await client.query(
      `SELECT ($1::numeric+$2::numeric)::text AS value`,
      [po.settled_provider_fee_amount,d.provider_fee]
    );

    const full=await client.query(
      'SELECT ($1::numeric >= $2::numeric) AS valid',
      [targetQty.rows[0].value,po.quantity]
    );

    await client.query(
      `UPDATE provider_orders
       SET settled_quantity=$2,settled_quote_amount=$3,settled_provider_fee_amount=$4,
           settlement_status=CASE WHEN $5 THEN 'SETTLED' ELSE 'PARTIAL' END,
           updated_at=NOW()
       WHERE id=$1`,
      [providerOrderId,targetQty.rows[0].value,targetQuote.rows[0].value,targetFee.rows[0].value,full.rows[0].valid]
    );

    await client.query(
      `UPDATE orders
       SET status=CASE WHEN $2 THEN 'filled' ELSE 'partially_filled' END,
           reserved_amount=GREATEST(reserved_amount-$3::numeric,0)
       WHERE id=$1`,
      [po.customer_order_id,full.rows[0].valid,po.customer_side==='buy'?d.quote_amount:(await client.query('SELECT ($1::numeric+$2::numeric)::text AS amount',[d.quantity,fee.customerFeeAmount])).rows[0].amount]
    );

    await client.query(
      `INSERT INTO accounting_outbox(event_type,aggregate_type,aggregate_id,idempotency_key,payload)
       VALUES('exchange.provider_trade.settled','provider_trade_settlement',$1,$2,$3)
       ON CONFLICT(idempotency_key) DO NOTHING`,
      [
        inserted.rows[0].id,
        'ansarraf:provider-settlement:'+inserted.rows[0].id,
        {
          settlementId:inserted.rows[0].id,
          providerOrderId,
          orderId:po.customer_order_id,
          customerId:po.customer_id,
          providerCode:po.provider_code,
          side:po.customer_side,
          baseAssetId:po.base_asset_id,
          quoteAssetId:po.quote_asset_id,
          baseSymbol:po.base_symbol,
          quoteSymbol:po.quote_symbol,
          quantity:d.quantity,
          quoteAmount:d.quote_amount,
          customerFeeAmount:fee.customerFeeAmount,
          providerFeeAmount:d.providerFee,
          providerFeeAssetId,
          companyRevenueAmount:companyRevenue,
          executionPrice:price.rows[0].value,
          operationId
        }
      ]
    );

    await client.query('COMMIT');
    return {settled:true,quarantined:false,settlement:inserted.rows[0]};
  }catch(error){
    await client.query('ROLLBACK');
    throw error;
  }finally{client.release();}
}
