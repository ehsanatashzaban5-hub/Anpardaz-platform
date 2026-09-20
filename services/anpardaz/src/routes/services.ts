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
    const op=(await pool.query('SELECT * FROM fintech_service_operations WHERE customer_id=$1 AND operation_id=$2 AND service_code=$3',[customerId,operationId,serviceCode])).rows[0];
    if(!op)return reply.code(404).send({error:'operation_not_found'});
    if(op.status==='completed'||op.status==='failed')return {operation:op,idempotent:true};
    let payload:Record<string,unknown>={};
    try{payload=(op.request_metadata?.payload??{}) as Record<string,unknown>;}catch{}
    const provider=providerOr503(reply);if(!provider)return;
    await pool.query("UPDATE fintech_service_operations SET status='processing',provider_code='fintech',updated_at=NOW() WHERE operation_id=$1",[operationId]);
    const result=await provider.execute({serviceCode,operationId,payload});
    const status=result.status;
    const updated=(await pool.query(
      `UPDATE fintech_service_operations
       SET status=$1,provider_operation_id=COALESCE($2,provider_operation_id),
           external_reference=COALESCE($3,external_reference),
           failure_code=$4,failure_message=$5,response_metadata=$6,updated_at=NOW(),
           completed_at=CASE WHEN $1='completed' THEN NOW() ELSE completed_at END
       WHERE operation_id=$7 RETURNING *`,
      [status,result.providerOperationId??null,result.externalReference??null,result.errorCode??null,result.errorMessage??null,JSON.stringify(result.data??{}),operationId],
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
