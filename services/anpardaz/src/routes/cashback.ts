import type {FastifyInstance,FastifyRequest,FastifyReply} from 'fastify';
import type {Pool} from 'pg';
import {ensureCustomer,requireAuth,type AuthClaims} from '../auth.js';

type R=FastifyRequest&{auth:AuthClaims};
const ar=(r:FastifyRequest)=>r as R;
const money=/^(?:0|[1-9]\d{0,19})(?:\.\d{1,18})?$/;
const internal=(req:FastifyRequest)=>{const token=process.env.ANPARDAZ_INTERNAL_TOKEN;return Boolean(token&&req.headers.authorization===`Bearer ${token}`);};

async function accountingPost(pool:Pool,customerId:number,operationId:string,reward:string,currency:string){
  const base=(process.env.ACCOUNTING_SERVICE_URL??'').replace(/\/$/,'');
  const token=process.env.ACCOUNTING_INTERNAL_TOKEN;
  if(!base||!token)throw new Error('accounting_service_not_configured');
  const customer=(await pool.query('SELECT identity_id FROM customers WHERE id=$1',[customerId])).rows[0];
  if(!customer?.identity_id)throw new Error('customer_identity_missing');
  const headers={authorization:`Bearer ${token}`,'content-type':'application/json',accept:'application/json'};
  async function account(code:string,name:string,type:'asset'|'liability'|'expense'|'revenue'){
    const g=await fetch(base+'/internal/v1/ledger/accounts/by-code/'+encodeURIComponent(code),{headers,signal:AbortSignal.timeout(8000)});
    if(g.ok)return(await g.json() as any).account;
    if(g.status!==404)throw new Error('account_lookup_failed');
    const p=await fetch(base+'/internal/v1/ledger/accounts',{method:'POST',headers,body:JSON.stringify({accountCode:code,accountName:name,accountType:type,ownerIdentityId:type==='liability'?customer.identity_id:null,currency}),signal:AbortSignal.timeout(8000)});
    if(p.ok)return(await p.json() as any).account;
    if(p.status===409){const again=await fetch(base+'/internal/v1/ledger/accounts/by-code/'+encodeURIComponent(code),{headers,signal:AbortSignal.timeout(8000)});if(again.ok)return(await again.json() as any).account;}
    throw new Error('account_create_failed');
  }
  const expense=await account(`anpardaz.cashback.expense.${currency}`,'An Pardaz cashback expense','expense');
  const liability=await account(`anpardaz.cashback.customer.${customerId}.liability.${currency}`,`An Pardaz customer ${customerId} cashback liability`,'liability');
  const r=await fetch(base+'/internal/v1/ledger/transactions',{method:'POST',headers,body:JSON.stringify({
    referenceType:'anpardaz_cashback',referenceId:operationId,operationId,idempotencyKey:`anpardaz:cashback:${operationId}`,
    description:'An Pardaz cashback reward accrual',
    entries:[
      {accountId:Number(expense.id),direction:'debit',amount:reward,currency},
      {accountId:Number(liability.id),direction:'credit',amount:reward,currency},
    ],
  }),signal:AbortSignal.timeout(10000)});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(String((data as any)?.error??'cashback_accounting_failed'));
  return String((data as any)?.transaction?.transaction_uuid??(data as any)?.transaction?.id??operationId);
}

async function accrue(pool:Pool,customerId:number,operationId:string,serviceCode:string,baseAmount:string,currency='IRR'){
  if(!money.test(baseAmount)||baseAmount==='0')return null;
  const policy=(await pool.query(
    `SELECT rate_bps FROM cashback_policies
     WHERE service_code=$1 AND currency=$2 AND enabled=TRUE
       AND effective_from<=NOW() AND (effective_to IS NULL OR effective_to>NOW())
     ORDER BY effective_from DESC,id DESC LIMIT 1`,[serviceCode,currency]
  )).rows[0];
  if(!policy||Number(policy.rate_bps)<=0)return null;
  const reward=(await pool.query('SELECT ($1::numeric*$2::numeric/10000)::text reward',[baseAmount,Number(policy.rate_bps)])).rows[0].reward;
  if(!money.test(String(reward))||String(reward)==='0')return null;
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    const existing=(await client.query('SELECT * FROM cashback_rewards WHERE customer_id=$1 AND operation_id=$2 FOR UPDATE',[customerId,operationId])).rows[0];
    if(existing){await client.query('COMMIT');return existing;}
    const rewardRow=(await client.query(
      `INSERT INTO cashback_rewards(customer_id,operation_id,service_code,base_amount,rate_bps,reward_amount,currency,status)
       VALUES($1,$2,$3,$4,$5,$6,$7,'manual_review') RETURNING *`,
      [customerId,operationId,serviceCode,baseAmount,Number(policy.rate_bps),reward,currency]
    )).rows[0];
    await client.query('COMMIT');
    try{
      const ref=await accountingPost(pool,customerId,operationId,reward,currency);
      const posted=(await pool.query(`UPDATE cashback_rewards SET status='accrued',accounting_reference=$1,updated_at=NOW() WHERE id=$2 RETURNING *`,[ref,rewardRow.id])).rows[0];
      return posted;
    }catch(error){
      await pool.query(`UPDATE cashback_rewards SET status='manual_review',metadata=metadata||$1::jsonb,updated_at=NOW() WHERE id=$2`,[JSON.stringify({accountingError:error instanceof Error?error.message:'accounting_failed'}),rewardRow.id]);
      throw error;
    }
  }catch(error){try{await client.query('ROLLBACK')}catch{};throw error}
  finally{client.release();}
}

export function registerCashbackRoutes(app:FastifyInstance,pool:Pool){
  app.get('/api/v1/cashback/summary',{preHandler:requireAuth},async(req)=>{
    const customerId=await ensureCustomer(pool,ar(req).auth);
    const rows=(await pool.query(`SELECT
      COALESCE(SUM(CASE WHEN status='accrued' THEN reward_amount ELSE 0 END),0)::text accrued,
      COALESCE(SUM(CASE WHEN status='redeemed' THEN reward_amount ELSE 0 END),0)::text redeemed,
      COALESCE(SUM(CASE WHEN status='reversed' THEN reward_amount ELSE 0 END),0)::text reversed,
      COALESCE(SUM(CASE WHEN status='manual_review' THEN reward_amount ELSE 0 END),0)::text manual_review
      FROM cashback_rewards WHERE customer_id=$1`,[customerId])).rows[0];
    return {summary:rows};
  });
  app.get('/api/v1/cashback/history',{preHandler:requireAuth},async(req)=>{
    const customerId=await ensureCustomer(pool,ar(req).auth);
    const limit=Math.min(Math.max(Number((req.query as any)?.limit??100)||100,1),500);
    const rows=await pool.query(`SELECT id,operation_id,service_code,base_amount::text,reward_amount::text,rate_bps,currency,status,accounting_reference,created_at,updated_at
      FROM cashback_rewards WHERE customer_id=$1 ORDER BY created_at DESC LIMIT $2`,[customerId,limit]);
    return {rewards:rows.rows};
  });
  app.get('/internal/v1/admin/cashback/policies',async(req,reply)=>{
    if(!internal(req))return reply.code(401).send({error:'unauthorized'});
    return {policies:(await pool.query('SELECT * FROM cashback_policies ORDER BY service_code,currency,effective_from DESC')).rows};
  });
  app.post('/internal/v1/admin/cashback/policies',async(req,reply)=>{
    if(!internal(req))return reply.code(401).send({error:'unauthorized'});
    const b=(req.body??{}) as any;
    const serviceCode=String(b.serviceCode??'').trim(),currency=String(b.currency??'IRR').trim().toUpperCase(),rateBps=Number(b.rateBps);
    if(!serviceCode||serviceCode.length>100||!/^[A-Z0-9_]{2,16}$/.test(currency)||!Number.isInteger(rateBps)||rateBps<0||rateBps>10000||typeof b.enabled!=='boolean')return reply.code(400).send({error:'invalid_cashback_policy'});
    if(b.enabled)await pool.query(`UPDATE cashback_policies SET enabled=FALSE,effective_to=COALESCE(effective_to,NOW()) WHERE service_code=$1 AND currency=$2 AND enabled=TRUE AND effective_to IS NULL`,[serviceCode,currency]);
    const row=(await pool.query(`INSERT INTO cashback_policies(service_code,rate_bps,currency,enabled,effective_from) VALUES($1,$2,$3,$4,NOW()) RETURNING *`,[serviceCode,rateBps,currency,b.enabled])).rows[0];
    return reply.code(201).send({policy:row});
  });
  app.post('/internal/v1/cashback/accrue',async(req,reply)=>{
    if(!internal(req))return reply.code(401).send({error:'unauthorized'});
    const b=(req.body??{}) as any,customerId=Number(b.customerId),operationId=String(b.operationId??'').trim(),serviceCode=String(b.serviceCode??'').trim(),baseAmount=String(b.baseAmount??''),currency=String(b.currency??'IRR').trim().toUpperCase();
    if(!Number.isSafeInteger(customerId)||customerId<=0||!operationId||operationId.length>200||!serviceCode||serviceCode.length>100||!/^[A-Z0-9_]{2,16}$/.test(currency)||!money.test(baseAmount)||baseAmount==='0')return reply.code(400).send({error:'invalid_cashback_accrual'});
    try{const reward=await accrue(pool,customerId,operationId,serviceCode,baseAmount,currency);return {reward};}catch(error){req.log.error(error,'cashback accrual failed');return reply.code(503).send({error:'cashback_accrual_failed'});}
  });
}
