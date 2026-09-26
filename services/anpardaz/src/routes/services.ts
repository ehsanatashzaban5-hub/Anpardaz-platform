import type {FastifyInstance,FastifyRequest,FastifyReply} from 'fastify';
import type {Pool} from 'pg';
import {randomUUID} from 'node:crypto';
import {ensureCustomer,requireAuth,type AuthClaims} from '../auth.js';
import {FintechProvider,type FintechServiceCode,requestFingerprint} from '../fintech-provider.js';

type R=FastifyRequest&{auth:AuthClaims};
const asR=(r:FastifyRequest)=>r as R;
const validId=(v:unknown)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>0;
const idem=(v:unknown)=>typeof v==='string'&&v.length>=8&&v.length<=200;
const allowed=new Set<string>([
  'mobile_charge','internet_package','bill_payment','charity','third_party_insurance',
  'body_insurance','motorcycle_insurance','vehicle_violations','freeway_toll',
  'tehran_traffic','sana','judiciary_bill','property_registration','cashback',
]);


async function ledgerAccount(base:string,token:string,code:string,name:string,type:'asset'|'liability',currency:string){
  const headers={authorization:'Bearer '+token};
  let r=await fetch(base+'/internal/v1/ledger/accounts/by-code/'+encodeURIComponent(code),{headers,signal:AbortSignal.timeout(8000)});
  if(r.ok)return Number((await r.json() as any).account.id);
  if(r.status!==404)throw new Error('account_lookup_failed');
  r=await fetch(base+'/internal/v1/ledger/accounts',{method:'POST',headers:{...headers,'content-type':'application/json'},body:JSON.stringify({accountCode:code,accountName:name,accountType:type,currency}),signal:AbortSignal.timeout(8000)});
  if(r.ok)return Number((await r.json() as any).account.id);
  if(r.status===409){r=await fetch(base+'/internal/v1/ledger/accounts/by-code/'+encodeURIComponent(code),{headers,signal:AbortSignal.timeout(8000)});if(r.ok)return Number((await r.json() as any).account.id);}
  throw new Error('account_create_failed');
}
async function postServiceAccounting(customerId:number,operationId:string,amount:string,currency:string){
  const base=(process.env.ACCOUNTING_SERVICE_URL??'').replace(/\/$/,'');const token=process.env.ACCOUNTING_INTERNAL_TOKEN;if(!base||!token)throw new Error('accounting_service_not_configured');
  const provider=await ledgerAccount(base,token,'anpardaz.provider.FINTECH.asset.'+currency,'An Pardaz fintech provider '+currency,'asset',currency);
  const customer=await ledgerAccount(base,token,'anpardaz.customer.'+customerId+'.liability.'+currency,'An Pardaz customer '+customerId+' '+currency,'liability',currency);
  const r=await fetch(base+'/internal/v1/ledger/transactions',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({referenceType:'anpardaz_service',referenceId:operationId,operationId,idempotencyKey:'anpardaz:service:'+operationId,description:'An Pardaz fintech service settlement',entries:[{accountId:customer,direction:'debit',amount,currency},{accountId:provider,direction:'credit',amount,currency}]}),signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw new Error('accounting_post_failed');
}

function providerOr503(reply:FastifyReply) {
  try { return new FintechProvider(); }
  catch { void reply.code(503).send({error:'fintech_provider_not_configured'}); return null; }
}

export function registerServiceRoutes(app:FastifyInstance,pool:Pool){
  app.get('/api/v1/services/operations',{preHandler:requireAuth},async(req)=>{
    const customerId=await ensureCustomer(pool,asR(req).auth);
    const rows=await pool.query(
      'SELECT * FROM fintech_service_operations WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 200',[customerId],
    );
    return {operations:rows.rows};
  });

  app.get('/api/v1/services/operations/:operationId',{preHandler:requireAuth},async(req,reply)=>{
    const customerId=await ensureCustomer(pool,asR(req).auth);
    const operationId=String((req.params as {operationId:string}).operationId);
    const row=(await pool.query(
      'SELECT * FROM fintech_service_operations WHERE customer_id=$1 AND operation_id=$2 LIMIT 1',[customerId,operationId],
    )).rows[0];
    if(!row)return reply.code(404).send({error:'operation_not_found'});
    return {operation:row};
  });

  app.post('/api/v1/services/:serviceCode',{preHandler:requireAuth},async(req,reply)=>{
    const customerId=await ensureCustomer(pool,asR(req).auth);
    const serviceCode=String((req.params as {serviceCode:string}).serviceCode) as FintechServiceCode;
    if(!allowed.has(serviceCode))return reply.code(400).send({error:'unsupported_service'});
    const body=(req.body??{}) as {idempotencyKey?:string;payload?:Record<string,unknown>};
    if(!idem(body.idempotencyKey)||!body.payload||typeof body.payload!=='object')return reply.code(400).send({error:'invalid_service_request'});
    const fingerprint=requestFingerprint(body.payload);
    const existing=(await pool.query(
      'SELECT * FROM fintech_service_operations WHERE customer_id=$1 AND idempotency_key=$2 LIMIT 1',
      [customerId,body.idempotencyKey],
    )).rows[0];
    if(existing){
      if(existing.request_fingerprint!==fingerprint)return reply.code(409).send({error:'idempotency_key_reused'});
      return {operation:existing,idempotent:true};
    }
    const operationId=`ANPARDAZ-${randomUUID()}`;
    const client=await pool.connect();
    try{
      await client.query('BEGIN');
      const op=await client.query(
        `INSERT INTO fintech_service_operations
          (customer_id,service_code,operation_id,idempotency_key,request_fingerprint,status,request_metadata)
         VALUES($1,$2,$3,$4,$5,'pending',$6)
         RETURNING *`,
        [customerId,serviceCode,operationId,body.idempotencyKey,fingerprint,JSON.stringify({payload:redactedPayload(body.payload)})],
      );
      await client.query(
        `INSERT INTO fintech_provider_outbox(operation_id,event_type) VALUES($1,'provider.execute')`,
        [operationId],
      );
      await client.query('COMMIT');
      return reply.code(202).send({operation:op.rows[0],operationId});
    }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
  });

  app.post('/api/v1/services/:serviceCode/execute/:operationId',{preHandler:requireAuth},async(req,reply)=>{
    const customerId=await ensureCustomer(pool,asR(req).auth);
    const serviceCode=String((req.params as {serviceCode:string}).serviceCode) as FintechServiceCode;
    const operationId=String((req.params as {operationId:string}).operationId);
    const body=(req.body??{}) as {payload?:Record<string,unknown>};
    if(body.payload!==undefined&&(typeof body.payload!=='object'||body.payload===null||Array.isArray(body.payload)))return reply.code(400).send({error:'invalid_service_payload'});
    const op=(await pool.query('SELECT * FROM fintech_service_operations WHERE customer_id=$1 AND operation_id=$2 AND service_code=$3',[customerId,operationId,serviceCode])).rows[0];
    if(!op)return reply.code(404).send({error:'operation_not_found'});
    if(op.status==='completed'||op.status==='failed')return {operation:op,idempotent:true};
    let payload:Record<string,unknown>={};
    try{payload=(body.payload??op.request_metadata?.payload??{}) as Record<string,unknown>;}catch{}
    const provider=providerOr503(reply);if(!provider)return;
    await pool.query("UPDATE fintech_service_operations SET status='processing',provider_code='fintech',updated_at=NOW() WHERE operation_id=$1",[operationId]);
    const result=await provider.execute({serviceCode,operationId,payload});
    let status=result.status;
    let accountingStatus='pending';
    if(status==='completed'){
      const rawAmount=(result.data as any)?.amount??(result.data as any)?.amountPaid??payload.amount;
      const amount=typeof rawAmount==='number'?String(rawAmount):typeof rawAmount==='string'&&/^(?:0|[1-9]\d{0,15})(?:\.\d{1,8})?$/.test(rawAmount)?rawAmount:null;
      if(!amount||amount==='0'){status='manual_review';accountingStatus='failed';}
      else{try{await postServiceAccounting(customerId,operationId,amount,'IRR');accountingStatus='posted';}catch(e){status='manual_review';accountingStatus='failed';}}
    }else if(status==='failed'||status==='manual_review')accountingStatus='failed';
    else accountingStatus='pending';
    const updated=(await pool.query(
      `UPDATE fintech_service_operations
       SET status=$1,provider_operation_id=COALESCE($2,provider_operation_id),
           external_reference=COALESCE($3,external_reference),
           failure_code=$4,failure_message=$5,response_metadata=$6,accounting_status=$7,updated_at=NOW(),
           completed_at=CASE WHEN $1='completed' THEN NOW() ELSE completed_at END
       WHERE operation_id=$8 RETURNING *`,
      [status,result.providerOperationId??null,result.externalReference??null,result.errorCode??null,status==='manual_review'&&accountingStatus==='failed'?'ACCOUNTING_REQUIRED':result.errorMessage??null,JSON.stringify(result.data??{}),accountingStatus,operationId],
    )).rows[0];
    return {operation:updated};
  });
}

function redactedPayload(payload:Record<string,unknown>){
  const out:Record<string,unknown>={};
  for(const [k,v] of Object.entries(payload)){
    out[k]=/password|otp|cvv|cardtoken|api.?key|secret|authorization/i.test(k)?'[REDACTED]':v;
  }
  return out;
}
