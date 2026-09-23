import type {FastifyInstance,FastifyReply,FastifyRequest} from 'fastify';
import type {Pool} from 'pg';
import {randomUUID,createHash} from 'node:crypto';
import {ensureCustomer,requireAuth,type AuthClaims} from '../auth.js';
import {decryptSecret,FinnotechClient} from '../finnotech.js';
import {isFinnotechServiceCode} from '../finnotech-services.js';

type R=FastifyRequest&{auth:AuthClaims};

function redact(value:unknown):unknown{
  if(Array.isArray(value))return value.map(redact);
  if(!value||typeof value!=='object')return value;
  const out:Record<string,unknown>={};
  for(const [k,v] of Object.entries(value as Record<string,unknown>)){
    out[k]=/password|otp|cvv|pin|secret|token|authorization|cardnumber/i.test(k)?'[REDACTED]':redact(v);
  }
  return out;
}
function fingerprint(value:unknown){return createHash('sha256').update(JSON.stringify(redact(value))).digest('hex');}
function idem(v:unknown){return typeof v==='string'&&v.length>=8&&v.length<=200;}
function endpointConfig(code:string){
  const raw=process.env.FINNOTECH_SERVICE_ENDPOINTS_JSON?.trim();
  if(!raw)throw new Error('FINNOTECH_SERVICE_ENDPOINTS_JSON_not_configured');
  let map:Record<string,{path:string;method?:'GET'|'POST'}>;
  try{map=JSON.parse(raw) as Record<string,{path:string;method?:'GET'|'POST'}>;}catch{throw new Error('FINNOTECH_SERVICE_ENDPOINTS_JSON_invalid');}
  const item=map[code];
  if(!item||typeof item.path!=='string'||!item.path.trim())throw new Error(`FINNOTECH_SERVICE_ENDPOINT_NOT_CONFIGURED:${code}`);
  return {path:item.path,method:item.method==='GET'?'GET':'POST'} as const;
}
async function connection(pool:Pool,customerId:number){
  return (await pool.query("SELECT * FROM finnotech_connections WHERE customer_id=$1 AND status='active' ORDER BY id DESC LIMIT 1",[customerId])).rows[0];
}
async function token(pool:Pool,row:any,client:FinnotechClient){
  if(row.access_token_expires_at&&new Date(row.access_token_expires_at).getTime()<Date.now()+30000&&row.refresh_token_enc){
    const refreshed=await client.refresh(decryptSecret(row.refresh_token_enc));
    const access=String((refreshed.access_token as any)?.value??refreshed.access_token??'');
    const refresh=String((refreshed.access_token as any)?.refreshToken??refreshed.refresh_token??'');
    if(!access)throw new Error('finnotech_refresh_missing_access_token');
    const expires=Number((refreshed.access_token as any)?.expiresIn??refreshed.expires_in??3600);
    await pool.query("UPDATE finnotech_connections SET access_token_enc=$1,refresh_token_enc=$2,access_token_expires_at=NOW()+($3::text || ' seconds')::interval,updated_at=NOW(),last_error=NULL WHERE id=$4",
      [require('../finnotech.js').encryptSecret(access),refresh?require('../finnotech.js').encryptSecret(refresh):row.refresh_token_enc,expires,row.id]);
    return access;
  }
  return decryptSecret(row.access_token_enc);
}

export function registerFinnotechServiceRoutes(app:FastifyInstance,pool:Pool){
  app.post('/api/v1/banking/finnotech/services/:serviceCode',{preHandler:requireAuth},async(req,reply)=>{
    const customerId=await ensureCustomer(pool,(req as R).auth);
    const serviceCode=String((req.params as any).serviceCode??'').trim();
    if(!isFinnotechServiceCode(serviceCode))return reply.code(404).send({error:'finnotech_service_not_supported'});
    const body=((req.body??{}) as Record<string,unknown>);
    const idempotencyKey=body.idempotencyKey;
    if(!idem(idempotencyKey))return reply.code(400).send({error:'idempotency_key_required'});
    const payload=Object.fromEntries(Object.entries(body).filter(([k])=>k!=='idempotencyKey'));
    const existing=(await pool.query('SELECT * FROM finnotech_service_operations WHERE customer_id=$1 AND service_code=$2 AND idempotency_key=$3',[customerId,serviceCode,idempotencyKey])).rows[0];
    if(existing)return {operation:existing,idempotent:true};

    const operationId=`ANPARDAZ-FINNO-${randomUUID()}`;
    const fp=fingerprint(payload);
    const inserted=(await pool.query(`INSERT INTO finnotech_service_operations(customer_id,service_code,operation_id,idempotency_key,request_fingerprint,status,request_data)
      VALUES($1,$2,$3,$4,$5,'processing',$6) RETURNING *`,
      [customerId,serviceCode,operationId,idempotencyKey,fp,redact(payload)])).rows[0];

    try{
      const conn=await connection(pool,customerId);
      if(!conn)throw Object.assign(new Error('finnotech_account_not_connected'),{httpStatus:409});
      const client=new FinnotechClient();
      const access=await token(pool,conn,client);
      const cfg=endpointConfig(serviceCode);
      const endpoint=cfg.path
        .replaceAll('{clientId}',encodeURIComponent(String(conn.client_id??process.env.FINNOTECH_CLIENT_ID??'')))
        .replaceAll('{trackId}',encodeURIComponent(operationId))
        .replaceAll('{operationId}',encodeURIComponent(operationId));
      const providerResponse=await client.call(endpoint,access,{...payload,trackId:operationId,operationId},cfg.method);
      const providerStatus=String((providerResponse as any).status??(providerResponse as any).state??'processing').toLowerCase();
      const status=['completed','success','successful','done'].includes(providerStatus)?'completed':
        ['failed','error','rejected'].includes(providerStatus)?'failed':'processing';
      const providerReference=String((providerResponse as any).reference??(providerResponse as any).externalReference??(providerResponse as any).trackId??(providerResponse as any).operationId??'')||null;
      const updated=(await pool.query(`UPDATE finnotech_service_operations
        SET status=$1,provider_reference=$2,provider_status=$3,response_data=$4,updated_at=NOW() WHERE id=$5 RETURNING *`,
        [status,providerReference,providerStatus,redact(providerResponse),inserted.id])).rows[0];
      return {operation:updated,providerResponse:redact(providerResponse)};
    }catch(e:any){
      const httpStatus=Number(e?.httpStatus??0);
      const code=String(e?.code??'FINNOTECH_SERVICE_FAILED');
      const message=e instanceof Error?e.message:'finnotech_service_failed';
      await pool.query(`UPDATE finnotech_service_operations SET status=$1,error_code=$2,error_message=$3,updated_at=NOW() WHERE id=$4`,
        [httpStatus>=500||code==='PROVIDER_UNAVAILABLE'?'manual_review':'failed',code,message.slice(0,500),inserted.id]);
      return reply.code(httpStatus>=400&&httpStatus<500?httpStatus:502).send({error:code,operationId});
    }
  });
}
