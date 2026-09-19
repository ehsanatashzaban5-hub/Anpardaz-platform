import type {FastifyInstance,FastifyRequest} from 'fastify';
import type {Pool} from 'pg';
import {createHash,randomUUID} from 'node:crypto';
import {ensureCustomer,requireAuth,type AuthClaims} from '../auth.js';
import {provisionProviderExecution} from '../provider-execution.js';
type R=FastifyRequest&{auth:AuthClaims};const r=(x:FastifyRequest)=>x as R;
const dec=/^(?:0|[1-9]\d{0,27})(?:\.\d{1,18})?$/;const amount=(v:unknown)=>typeof v==='string'&&dec.test(v)&&v!=='0'&&!/^0\.0+$/.test(v);const id=(v:unknown)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>0;const idem=(v:unknown)=>typeof v==='string'&&v.length>=8&&v.length<=200;const fp=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');

export function registerTradingRoutes(app:FastifyInstance,pool:Pool){
 app.get('/api/v1/wallets',{preHandler:requireAuth},async(req)=>{
   const customer=await ensureCustomer(pool,r(req).auth);
   const q=await pool.query('SELECT w.id,w.asset_id,a.symbol,a.name,a.asset_type,a.decimals,w.available_balance::text,w.locked_balance::text,(w.available_balance+w.locked_balance)::text AS total_balance FROM wallets w JOIN assets a ON a.id=w.asset_id WHERE w.customer_id=$1 AND a.status=\'active\' ORDER BY a.symbol',[customer]);
   return{wallets:q.rows};
 });
 app.post('/api/v1/orders',{preHandler:requireAuth},async(req,reply)=>{
   const a=r(req),b=(req.body??{}) as any;
   const marketBuyQuote=b.orderType==='market'&&b.side==='buy'?b.quoteAmount:null;
   if(!id(b.baseAssetId)||!id(b.quoteAssetId)||b.baseAssetId===b.quoteAssetId||!['buy','sell'].includes(b.side)||!['market','limit'].includes(b.orderType)||!amount(b.quantity)||(b.orderType==='limit'&&!amount(b.price))||(b.orderType==='market'&&b.price!=null)||(b.orderType==='market'&&b.side==='buy'&&!amount(marketBuyQuote))||!idem(b.idempotencyKey))
     return reply.code(400).send({error:'invalid_order'});
   const customer=await ensureCustomer(pool,a.auth);
   const assets=await pool.query("SELECT id FROM assets WHERE id=ANY($1::bigint[]) AND status='active'",[[b.baseAssetId,b.quoteAssetId]]);
   if(assets.rows.length!==2)return reply.code(400).send({error:'asset_not_available'});
   const requestFingerprint=fp({baseAssetId:b.baseAssetId,quoteAssetId:b.quoteAssetId,side:b.side,orderType:b.orderType,quantity:b.quantity,price:b.price??null,quoteAmount:marketBuyQuote??null});
   const client=await pool.connect();
   try{
     await client.query('BEGIN');
     const existing=await client.query('SELECT * FROM orders WHERE customer_id=$1 AND idempotency_key=$2 FOR UPDATE',[customer,b.idempotencyKey]);
     if(existing.rows[0]){
       const e=existing.rows[0];
       const existingFingerprint=fp({baseAssetId:e.base_asset_id,quoteAssetId:e.quote_asset_id,side:e.side,orderType:e.order_type,quantity:e.quantity,price:e.price??null,quoteAmount:e.market_buy_quote_amount??null});
       if(existingFingerprint!==requestFingerprint){await client.query('ROLLBACK');return reply.code(409).send({error:'idempotency_key_reused'});}
       await client.query('ROLLBACK');return{order:e,idempotent:true};
     }
     const order=await client.query('INSERT INTO orders(customer_id,base_asset_id,quote_asset_id,side,order_type,quantity,price,market_buy_quote_amount,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',[customer,b.baseAssetId,b.quoteAssetId,b.side,b.orderType,b.quantity,b.price??null,marketBuyQuote,b.idempotencyKey]);
     const o=order.rows[0];
     const reserveAssetId=b.side==='sell'?b.baseAssetId:b.quoteAssetId;
     const reserveQuery=b.side==='sell'||b.orderType==='market'?'SELECT $1::numeric AS amount':'SELECT $1::numeric*$2::numeric AS amount';
     const reserveParams=b.side==='sell'?[b.quantity]:(b.orderType==='limit'?[b.quantity,b.price]:[marketBuyQuote]);
     await client.query('INSERT INTO wallets(customer_id,asset_id) VALUES($1,$2) ON CONFLICT(customer_id,asset_id) DO NOTHING',[customer,reserveAssetId]);
     const wallet=await client.query('SELECT id FROM wallets WHERE customer_id=$1 AND asset_id=$2 FOR UPDATE',[customer,reserveAssetId]);
     if(!wallet.rows[0])throw new Error('wallet_not_found');
     const reserved=await client.query(reserveQuery,reserveParams);
     const reserveAmountValue=reserved.rows[0].amount;
     const moved=await client.query('UPDATE wallets SET available_balance=available_balance-$1,locked_balance=locked_balance+$1 WHERE id=$2 AND available_balance >= $1 RETURNING id,available_balance::text,locked_balance::text',[reserveAmountValue,wallet.rows[0].id]);
     if(!moved.rows[0])throw new Error('insufficient_available_balance');
     await client.query('UPDATE orders SET reserved_asset_id=$1,reserved_amount=$2 WHERE id=$3',[reserveAssetId,reserveAmountValue,o.id]);
     await client.query('INSERT INTO wallet_reservations(order_id,wallet_id,asset_id,amount) VALUES($1,$2,$3,$4)',[o.id,wallet.rows[0].id,reserveAssetId,reserveAmountValue]);
     const final=await client.query('SELECT * FROM orders WHERE id=$1',[o.id]);
     await client.query('COMMIT');
     // Match only after the order transaction commits. Settlement performs the authoritative atomic checks.
     const internalToken=process.env.ANSARRAF_INTERNAL_TOKEN;
     if(internalToken){
       const match=await app.inject({method:'POST',url:`/internal/v1/orders/${o.id}/match`,headers:{authorization:`Bearer ${internalToken}`},payload:{maxTrades:100}});
       if(match.statusCode>=400)req.log.warn({orderId:o.id,status:match.statusCode},'post-order matching pass failed');
     }
     const refreshed=await pool.query('SELECT * FROM orders WHERE id=$1',[o.id]);
     let providerExecution:any={enabled:false,created:false};
     if(refreshed.rows[0]&&['open','partially_filled'].includes(refreshed.rows[0].status)){
       try{providerExecution=await provisionProviderExecution(pool,Number(o.id));}
       catch(error){req.log.error({orderId:o.id,error},'provider execution provisioning failed');providerExecution={enabled:true,created:false,reason:'provisioning_failed'};}
     }
     const finalOrder=await pool.query('SELECT * FROM orders WHERE id=$1',[o.id]);
     return reply.code(201).send({order:finalOrder.rows[0],providerExecution});
   }catch(e:any){
     await client.query('ROLLBACK');
     if(e?.code==='23505'){
       const x=await client.query('SELECT * FROM orders WHERE customer_id=$1 AND idempotency_key=$2',[customer,b.idempotencyKey]);
       if(x.rows[0]){
         const existing=x.rows[0];
         const existingFingerprint=fp({baseAssetId:existing.base_asset_id,quoteAssetId:existing.quote_asset_id,side:existing.side,orderType:existing.order_type,quantity:existing.quantity,price:existing.price??null,quoteAmount:existing.market_buy_quote_amount??null});
         if(existingFingerprint!==requestFingerprint)return reply.code(409).send({error:'idempotency_key_reused'});
         return{order:existing,idempotent:true};
       }
     }
     if(e instanceof Error&&e.message==='insufficient_available_balance')return reply.code(409).send({error:'insufficient_available_balance'});
     req.log.error(e);return reply.code(400).send({error:e instanceof Error?e.message:'order_creation_failed'});
   }finally{client.release();}
 });
 app.get('/api/v1/orders',{preHandler:requireAuth},async(req)=>{const customer=await ensureCustomer(pool,r(req).auth);return{orders:(await pool.query('SELECT * FROM orders WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 200',[customer])).rows};});
 app.post('/api/v1/orders/:id/cancel',{preHandler:requireAuth},async(req,reply)=>{
   const customer=await ensureCustomer(pool,r(req).auth),orderId=Number((req.params as any).id);if(!Number.isSafeInteger(orderId)||orderId<=0)return reply.code(400).send({error:'invalid_order_id'});
   const client=await pool.connect();
   try{
     await client.query('BEGIN');
     const order=await client.query('SELECT * FROM orders WHERE id=$1 AND customer_id=$2 FOR UPDATE',[orderId,customer]);
     if(!order.rows[0]||!['open','partially_filled'].includes(order.rows[0].status)){await client.query('ROLLBACK');return reply.code(404).send({error:'cancellable_order_not_found'});}
     const reservation=await client.query("SELECT * FROM wallet_reservations WHERE order_id=$1 AND status='active' FOR UPDATE",[orderId]);
     if(!reservation.rows[0])throw new Error('wallet_reservation_missing');
     const rr=reservation.rows[0];
     const providerOrder=await client.query(
       `SELECT id,status,client_order_id
        FROM provider_orders
        WHERE customer_order_id=$1
          AND status NOT IN ('FILLED','CANCELLED','REJECTED')
        ORDER BY id DESC
        LIMIT 1
        FOR UPDATE`,
       [orderId]
     );
     if(providerOrder.rows[0]){
       const po=providerOrder.rows[0];
       await client.query(
         `UPDATE provider_orders
          SET status='CANCEL_PENDING',updated_at=NOW()
          WHERE id=$1 AND status NOT IN ('FILLED','CANCELLED','REJECTED')`,
         [po.id]
       );
       await client.query(
         `INSERT INTO provider_execution_outbox
          (provider_order_id,event_type,idempotency_key,payload)
          VALUES($1,'provider.order.cancel',$2,$3)
          ON CONFLICT(idempotency_key) DO NOTHING`,
         [
           po.id,
           'provider.order.cancel:'+po.id,
           {providerOrderId:po.id,orderId,clientOrderId:String(po.client_order_id),operationId:'ANSARRAF-CANCEL-'+orderId}
         ]
       );
     }else{
       const released=await client.query('UPDATE wallets SET locked_balance=locked_balance-$1,available_balance=available_balance+$1 WHERE id=$2 AND locked_balance >= $1 RETURNING id',[rr.amount,rr.wallet_id]);
       if(!released.rows[0])throw new Error('wallet_reservation_invariant_failed');
       await client.query("UPDATE wallet_reservations SET status='released',resolved_at=NOW() WHERE id=$1",[rr.id]);
     }
     const x=await client.query("UPDATE orders SET status='cancelled',reserved_asset_id=NULL,reserved_amount=0 WHERE id=$1 RETURNING *",[orderId]);
     await client.query('COMMIT');return{order:x.rows[0]};
   }catch(e){await client.query('ROLLBACK');req.log.error(e);return reply.code(400).send({error:e instanceof Error?e.message:'order_cancellation_failed'});}
   finally{client.release();}
 });
 app.get('/api/v1/orders/:id/trades',{preHandler:requireAuth},async(req)=>{const customer=await ensureCustomer(pool,r(req).auth),orderId=Number((req.params as any).id);return{trades:(await pool.query('SELECT t.* FROM trades t JOIN orders o ON o.id=t.order_id WHERE t.order_id=$1 AND o.customer_id=$2 ORDER BY t.created_at DESC',[orderId,customer])).rows};});
 app.get('/api/v1/trades',{preHandler:requireAuth},async(req)=>{const customer=await ensureCustomer(pool,r(req).auth);return{trades:(await pool.query('SELECT t.*,o.base_asset_id,o.quote_asset_id,o.side FROM trades t JOIN orders o ON o.id=t.order_id WHERE o.customer_id=$1 ORDER BY t.created_at DESC LIMIT 200',[customer])).rows};});
 app.get('/api/v1/deposits',{preHandler:requireAuth},async(req)=>{const customer=await ensureCustomer(pool,r(req).auth);return{deposits:(await pool.query('SELECT d.*,a.symbol,a.name FROM deposits d JOIN assets a ON a.id=d.asset_id WHERE d.customer_id=$1 ORDER BY d.created_at DESC LIMIT 200',[customer])).rows};});
 app.post('/api/v1/deposits',{preHandler:requireAuth},async(req,reply)=>{const customer=await ensureCustomer(pool,r(req).auth),b=(req.body??{}) as any;if(!id(b.assetId)||!amount(b.amount)||typeof b.network!=='string'||!b.network.trim()||b.network.length>50||!idem(b.idempotencyKey))return reply.code(400).send({error:'invalid_deposit'});const requestFingerprint=fp({assetId:b.assetId,amount:b.amount,network:b.network.trim(),externalReference:b.externalReference??null});try{const x=await pool.query('INSERT INTO deposits(customer_id,asset_id,amount,network,external_reference,idempotency_key) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[customer,b.assetId,b.amount,b.network.trim(),b.externalReference??null,b.idempotencyKey]);return reply.code(201).send({deposit:x.rows[0]});}catch(e:any){if(e?.code==='23505'){const x=await pool.query('SELECT * FROM deposits WHERE customer_id=$1 AND idempotency_key=$2',[customer,b.idempotencyKey]);const existing=x.rows[0];if(existing){const existingFingerprint=fp({assetId:existing.asset_id,amount:existing.amount,network:existing.network,externalReference:existing.external_reference??null});if(existingFingerprint!==requestFingerprint)return reply.code(409).send({error:'idempotency_key_reused'});return{deposit:existing,idempotent:true};}}throw e;}});
 app.get('/api/v1/withdrawals',{preHandler:requireAuth},async(req)=>{const customer=await ensureCustomer(pool,r(req).auth);return{withdrawals:(await pool.query('SELECT w.*,a.symbol,a.name FROM withdrawals w JOIN assets a ON a.id=w.asset_id WHERE w.customer_id=$1 ORDER BY w.created_at DESC LIMIT 200',[customer])).rows};});
 app.post('/api/v1/withdrawals',{preHandler:requireAuth},async(req,reply)=>{
   const customer=await ensureCustomer(pool,r(req).auth),b=(req.body??{}) as any;
   if(!id(b.assetId)||!amount(b.amount)||typeof b.network!=='string'||!b.network.trim()||b.network.length>50||typeof b.destination!=='string'||b.destination.length<10||b.destination.length>500||(b.memo!=null&&(typeof b.memo!=='string'||b.memo.length>200))||!idem(b.idempotencyKey))
     return reply.code(400).send({error:'invalid_withdrawal'});
   const requestFingerprint=fp({assetId:b.assetId,amount:b.amount,network:b.network.trim(),destination:b.destination.trim(),memo:b.memo??null});
   const client=await pool.connect();
   try{
     await client.query('BEGIN');
     const existing=await client.query('SELECT * FROM withdrawals WHERE customer_id=$1 AND idempotency_key=$2 FOR UPDATE',[customer,b.idempotencyKey]);
     if(existing.rows[0]){
       const e=existing.rows[0];
       const existingFingerprint=fp({assetId:e.asset_id,amount:e.amount,network:e.network,destination:e.destination,memo:e.destination_memo??null});
       if(existingFingerprint!==requestFingerprint){await client.query('ROLLBACK');return reply.code(409).send({error:'idempotency_key_reused'});}
       await client.query('ROLLBACK');return{withdrawal:e,idempotent:true};
     }
     const asset=await client.query("SELECT id FROM assets WHERE id=$1 AND status='active'",[b.assetId]);
     if(!asset.rows[0])throw new Error('asset_not_available');
     await client.query('INSERT INTO wallets(customer_id,asset_id) VALUES($1,$2) ON CONFLICT(customer_id,asset_id) DO NOTHING',[customer,b.assetId]);
     const wallet=await client.query('SELECT * FROM wallets WHERE customer_id=$1 AND asset_id=$2 FOR UPDATE',[customer,b.assetId]);
     if(!wallet.rows[0])throw new Error('wallet_not_found');
     const moved=await client.query('UPDATE wallets SET available_balance=available_balance-$1,locked_balance=locked_balance+$1 WHERE id=$2 AND available_balance >= $1 RETURNING id',[b.amount,wallet.rows[0].id]);
     if(!moved.rows[0])throw new Error('insufficient_available_balance');
     const operationId='ANSARRAF-WD-'+randomUUID();
     const w=await client.query("INSERT INTO withdrawals(customer_id,asset_id,amount,network,destination,destination_memo,idempotency_key,operation_id,approval_status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'PENDING') RETURNING *",[customer,b.assetId,b.amount,b.network.trim(),b.destination.trim(),b.memo??null,b.idempotencyKey,operationId]);
     await client.query('INSERT INTO withdrawal_reservations(withdrawal_id,wallet_id,asset_id,amount) VALUES($1,$2,$3,$4)',[w.rows[0].id,wallet.rows[0].id,b.assetId,b.amount]);
     await client.query('COMMIT');
     return reply.code(201).send({withdrawal:w.rows[0]});
   }catch(e:any){
     await client.query('ROLLBACK');
     if(e instanceof Error&&e.message==='insufficient_available_balance')return reply.code(409).send({error:'insufficient_available_balance'});
     if(e instanceof Error&&e.message==='asset_not_available')return reply.code(400).send({error:'asset_not_available'});
     req.log.error(e);return reply.code(400).send({error:e instanceof Error?e.message:'withdrawal_creation_failed'});
   }finally{client.release();}
 });
 app.post('/api/v1/withdrawals/:id/approve',{preHandler:requireAuth},async(req,reply)=>{
   const auth=r(req).auth;
   if(!['admin','super_admin','operator'].includes(auth.role))return reply.code(403).send({error:'forbidden'});
   const wid=Number((req.params as any).id);
   if(!Number.isSafeInteger(wid)||wid<=0)return reply.code(400).send({error:'invalid_withdrawal_id'});
   const client=await pool.connect();
   try{
     await client.query('BEGIN');
     const wq=await client.query(
       `SELECT w.*,c.identity_id
        FROM withdrawals w JOIN customers c ON c.id=w.customer_id
        WHERE w.id=$1 FOR UPDATE`,[wid]);
     const w=wq.rows[0];
     if(!w)return reply.code(404).send({error:'withdrawal_not_found'});
     if(w.identity_id===auth.sub)return reply.code(409).send({error:'self_approval_forbidden'});
     if(w.approval_status!=='PENDING'||w.status!=='pending')return reply.code(409).send({error:'withdrawal_not_pending_approval'});
     const asset=await client.query('SELECT symbol FROM assets WHERE id=$1',[w.asset_id]);
     const threshold=process.env.WITHDRAWAL_DUAL_APPROVAL_THRESHOLD;
     const requiresDual=threshold===undefined||threshold===''||threshold==='0'
       ? true
       : Number(w.amount)>=Number(threshold);
     const requiredCount=requiresDual?2:1;
     if(Number(w.approval_required_count)!==requiredCount){
       await client.query('UPDATE withdrawals SET approval_required_count=$2 WHERE id=$1',[wid,requiredCount]);
     }
     const ins=await client.query(
       `INSERT INTO withdrawal_approvals(withdrawal_id,approver_identity_id,decision)
        VALUES($1,$2,'APPROVED')
        ON CONFLICT(withdrawal_id,approver_identity_id) DO NOTHING
        RETURNING id`,[wid,auth.sub]);
     if(!ins.rows[0])return reply.code(409).send({error:'approval_already_recorded'});
     const count=Number((await client.query(
       "SELECT COUNT(*)::int AS count FROM withdrawal_approvals WHERE withdrawal_id=$1 AND decision='APPROVED'",[wid])).rows[0].count);
     if(count>=requiredCount){
       const provider=await client.query("SELECT id FROM liquidity_providers WHERE code=$1 AND status='ACTIVE' FOR UPDATE",[process.env.LIQUIDITY_PROVIDER_CODE??'WALLEX']);
       if(!provider.rows[0])throw new Error('provider_not_active');
       await client.query(
         `UPDATE withdrawals
          SET approval_status='APPROVED',approved_count=$2,approved_by=$3,approved_at=NOW(),
              liquidity_provider_id=$4,status='processing'
          WHERE id=$1`,
         [wid,count,auth.sub,provider.rows[0].id]);
       await client.query(
         `INSERT INTO provider_withdrawal_outbox(withdrawal_id,event_type,idempotency_key,payload)
          VALUES($1,'provider.withdrawal.submit',$2,$3)
          ON CONFLICT(idempotency_key) DO NOTHING`,
         [wid,'ansarraf:withdrawal-submit:'+wid,{withdrawalId:wid,operationId:w.operation_id,providerCode:process.env.LIQUIDITY_PROVIDER_CODE??'WALLEX'}]);
     }else{
       await client.query("UPDATE withdrawals SET approved_count=$2,approval_required_count=$3 WHERE id=$1",[wid,count,requiredCount]);
     }
     const result=await client.query('SELECT * FROM withdrawals WHERE id=$1',[wid]);
     await client.query('COMMIT');
     return{withdrawal:result.rows[0],requiredApprovals:requiredCount,approvedCount:count};
   }catch(e){
     await client.query('ROLLBACK');
     req.log.error(e);
     return reply.code(400).send({error:e instanceof Error?e.message:'withdrawal_approval_failed'});
   }finally{client.release();}
 });
 app.post('/api/v1/withdrawals/:id/reject',{preHandler:requireAuth},async(req,reply)=>{
   const auth=r(req).auth;
   if(!['admin','super_admin','operator'].includes(auth.role))return reply.code(403).send({error:'forbidden'});
   const wid=Number((req.params as any).id);
   const reason=typeof (req.body as any)?.reason==='string'?String((req.body as any).reason).trim().slice(0,1000):'rejected_by_admin';
   if(!Number.isSafeInteger(wid)||wid<=0)return reply.code(400).send({error:'invalid_withdrawal_id'});
   const client=await pool.connect();
   try{
     await client.query('BEGIN');
     const w=await client.query("SELECT w.*,c.identity_id FROM withdrawals w JOIN customers c ON c.id=w.customer_id WHERE w.id=$1 FOR UPDATE",[wid]);
     if(!w.rows[0])throw new Error('withdrawal_not_found');
     if(w.rows[0].identity_id===auth.sub)throw new Error('self_approval_forbidden');
     if(w.rows[0].approval_status!=='PENDING'||w.rows[0].status!=='pending')throw new Error('withdrawal_not_pending_approval');
     const rr=await client.query("SELECT * FROM withdrawal_reservations WHERE withdrawal_id=$1 AND status='active' FOR UPDATE",[wid]);
     if(!rr.rows[0])throw new Error('withdrawal_reservation_missing');
     const released=await client.query(
       `UPDATE wallets SET locked_balance=locked_balance-$1::numeric,available_balance=available_balance+$1::numeric
        WHERE id=$2 AND locked_balance >= $1::numeric RETURNING id`,[rr.rows[0].amount,rr.rows[0].wallet_id]);
     if(!released.rows[0])throw new Error('withdrawal_reservation_release_failed');
     await client.query("UPDATE withdrawal_reservations SET status='released',resolved_at=NOW() WHERE id=$1",[rr.rows[0].id]);
     await client.query("INSERT INTO withdrawal_approvals(withdrawal_id,approver_identity_id,decision,reason) VALUES($1,$2,'REJECTED',$3) ON CONFLICT(withdrawal_id,approver_identity_id) DO UPDATE SET decision='REJECTED',reason=EXCLUDED.reason",[wid,auth.sub,reason]);
     const x=await client.query("UPDATE withdrawals SET approval_status='REJECTED',rejection_reason=$2,status='cancelled',completed_at=NOW() WHERE id=$1 RETURNING *",[wid,reason]);
     await client.query('COMMIT');
     return{withdrawal:x.rows[0]};
   }catch(e){
     await client.query('ROLLBACK');
     return reply.code(400).send({error:e instanceof Error?e.message:'withdrawal_rejection_failed'});
   }finally{client.release();}
 });
 app.post('/api/v1/withdrawals/:id/cancel',{preHandler:requireAuth},async(req,reply)=>{
   const customer=await ensureCustomer(pool,r(req).auth),wid=Number((req.params as any).id);
   if(!Number.isSafeInteger(wid)||wid<=0)return reply.code(400).send({error:'invalid_withdrawal_id'});
   const client=await pool.connect();
   try{
     await client.query('BEGIN');
     const w=await client.query("SELECT * FROM withdrawals WHERE id=$1 AND customer_id=$2 AND status='pending' FOR UPDATE",[wid,customer]);
     if(!w.rows[0]){await client.query('ROLLBACK');return reply.code(404).send({error:'cancellable_withdrawal_not_found'});}
     const reservation=await client.query("SELECT * FROM withdrawal_reservations WHERE withdrawal_id=$1 AND status='active' FOR UPDATE",[wid]);
     if(!reservation.rows[0])throw new Error('withdrawal_reservation_missing');
     const rr=reservation.rows[0];
     const released=await client.query('UPDATE wallets SET locked_balance=locked_balance-$1,available_balance=available_balance+$1 WHERE id=$2 AND locked_balance >= $1 RETURNING id',[rr.amount,rr.wallet_id]);
     if(!released.rows[0])throw new Error('withdrawal_reservation_invariant_failed');
     await client.query("UPDATE withdrawal_reservations SET status='released',resolved_at=NOW() WHERE id=$1",[rr.id]);
     const x=await client.query("UPDATE withdrawals SET status='cancelled' WHERE id=$1 RETURNING *",[wid]);
     await client.query('COMMIT');
     return{withdrawal:x.rows[0]};
   }catch(e){
     await client.query('ROLLBACK');req.log.error(e);return reply.code(400).send({error:e instanceof Error?e.message:'withdrawal_cancellation_failed'});
   }finally{client.release();}
 });

}
