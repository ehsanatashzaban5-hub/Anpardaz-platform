import type {FastifyInstance,FastifyRequest,FastifyReply} from 'fastify';
import type {Pool} from 'pg';
import {randomUUID} from 'node:crypto';
import {ensureCustomer,requireAuth,type AuthClaims} from '../auth.js';
import {decryptSecret,encryptSecret,FinnotechClient,oauthState} from '../finnotech.js';

type R=FastifyRequest&{auth:AuthClaims};
const asR=(r:FastifyRequest)=>r as R;
const idem=(v:unknown)=>typeof v==='string'&&v.length>=8&&v.length<=200;
const nonEmpty=(v:unknown)=>typeof v==='string'&&v.trim().length>0&&v.length<=200;
const path=(name:string)=>{const value=process.env[name]?.trim();if(!value)throw new Error(`${name}_not_configured`);return value;};

function configured(reply:FastifyReply){
  try{return new FinnotechClient();}catch{return void reply.code(503).send({error:'finnotech_not_configured'});}
}

async function connection(pool:Pool,customerId:string,bankCode?:string){
  const r=await pool.query('SELECT * FROM finnotech_connections WHERE customer_id=$1 AND status=\'active\' AND ($2::text IS NULL OR bank_code=$2) ORDER BY id DESC LIMIT 1',[customerId,bankCode??null]);
  return r.rows[0];
}

async function token(pool:Pool,row:any,client:FinnotechClient){
  if(row.access_token_expires_at&&new Date(row.access_token_expires_at).getTime()<Date.now()+30000&&row.refresh_token_enc){
    const refreshed=await client.refresh(decryptSecret(row.refresh_token_enc));
    const access=String((refreshed.access_token as any)?.value??refreshed.access_token??'');
    const refresh=String((refreshed.access_token as any)?.refreshToken??refreshed.refresh_token??'');
    if(!access)throw new Error('finnotech_refresh_missing_access_token');
    const expires=Number((refreshed.access_token as any)?.expiresIn??refreshed.expires_in??3600);
    await pool.query('UPDATE finnotech_connections SET access_token_enc=$1,refresh_token_enc=$2,access_token_expires_at=NOW()+($3::text || \' seconds\')::interval,updated_at=NOW(),last_error=NULL WHERE id=$4',[encryptSecret(access),refresh?encryptSecret(refresh):row.refresh_token_enc,expires,row.id]);
    return access;
  }
  return decryptSecret(row.access_token_enc);
}

export function registerFinnotechBankingRoutes(app:FastifyInstance,pool:Pool){
  app.get('/api/v1/banking/finnotech/authorize',{preHandler:requireAuth},async(req,reply)=>{
    const customerId=await ensureCustomer(pool,asR(req).auth);
    const redirectUri=String(process.env.FINNOTECH_REDIRECT_URI??'').trim();
    if(!redirectUri)return reply.code(503).send({error:'finnotech_redirect_uri_not_configured'});
    const client=configured(reply);if(!client)return;
    const state=oauthState();
    await pool.query('INSERT INTO finnotech_oauth_states(state,customer_id,redirect_uri,expires_at) VALUES($1,$2,$3,NOW()+INTERVAL \'10 minutes\')',[state,customerId,redirectUri]);
    return {authorizationUrl:client.authorizationUrl(state,redirectUri),state};
  });

  app.get('/api/v1/banking/finnotech/callback',async(req,reply)=>{
    const q=req.query as any;const state=String(q?.state??'').trim();const code=String(q?.code??'').trim();
    if(!state||!code)return reply.code(400).send({error:'finnotech_callback_invalid'});
    const s=(await pool.query('SELECT * FROM finnotech_oauth_states WHERE state=$1 AND expires_at>NOW()',[state])).rows[0];
    if(!s)return reply.code(400).send({error:'finnotech_oauth_state_invalid_or_expired'});
    const client=configured(reply);if(!client)return;
    let tokenResponse;
    try{
      tokenResponse=await client.exchangeCode(code,s.redirect_uri);
    }catch{
      return reply.code(502).send({error:'finnotech_token_exchange_failed'});
    }
    await pool.query('DELETE FROM finnotech_oauth_states WHERE state=$1',[state]);
    const access=String((tokenResponse.access_token as any)?.value??tokenResponse.access_token??'');
    const refresh=String((tokenResponse.access_token as any)?.refreshToken??tokenResponse.refresh_token??'');
    if(!access)return reply.code(502).send({error:'finnotech_access_token_missing'});
    const expires=Number((tokenResponse.access_token as any)?.expiresIn??tokenResponse.expires_in??3600);
    const existing=(await pool.query('SELECT id FROM finnotech_connections WHERE customer_id=$1 AND provider=\'FINNOTECH\' AND bank_code IS NULL ORDER BY id DESC LIMIT 1',[s.customer_id])).rows[0];
    if(existing){
      await pool.query(`UPDATE finnotech_connections SET client_id=$1,access_token_enc=$2,refresh_token_enc=$3,access_token_expires_at=NOW()+($4::text || ' seconds')::interval,scope=$5,status='active',last_error=NULL,updated_at=NOW() WHERE id=$6`,[process.env.FINNOTECH_CLIENT_ID,encryptSecret(access),refresh?encryptSecret(refresh):null,expires,typeof tokenResponse.scope==='string'?tokenResponse.scope:null,existing.id]);
    }else{
      await pool.query(`INSERT INTO finnotech_connections(customer_id,client_id,access_token_enc,refresh_token_enc,access_token_expires_at,scope,status) VALUES($1,$2,$3,$4,NOW()+($5::text || ' seconds')::interval,$6,'active')`,[s.customer_id,process.env.FINNOTECH_CLIENT_ID,encryptSecret(access),refresh?encryptSecret(refresh):null,expires,typeof tokenResponse.scope==='string'?tokenResponse.scope:null]);
    }
    return reply.redirect(process.env.FINNOTECH_POST_AUTH_REDIRECT??'/');
  });

  app.get('/api/v1/banking/accounts/:accountId/balance',{preHandler:requireAuth},async(req,reply)=>{
    const customerId=await ensureCustomer(pool,asR(req).auth);
    const accountId=Number((req.params as any).accountId);if(!Number.isSafeInteger(accountId))return reply.code(400).send({error:'invalid_account_id'});
    const account=(await pool.query('SELECT * FROM accounts WHERE id=$1 AND customer_id=$2 AND status=\'active\'',[accountId,customerId])).rows[0];
    if(!account)return reply.code(404).send({error:'account_not_found'});
    const conn=await connection(pool,customerId);if(!conn)return reply.code(409).send({error:'finnotech_account_not_connected'});
    const client=configured(reply);if(!client)return;
    const access=await token(pool,conn,client);
    if(!conn.provider_account_id && !account.provider_account_id)return reply.code(409).send({error:'provider_account_not_linked'});
    const template=path('FINNOTECH_BALANCE_PATH');
    const endpoint=template.replace('{clientId}',encodeURIComponent(conn.client_id??process.env.FINNOTECH_CLIENT_ID??'')).replace('{deposit}',encodeURIComponent(account.provider_account_id??conn.provider_account_id??''));
    const result=await client.call(endpoint,access,undefined,'GET');
    return {provider:'FINNOTECH',accountId,bankBalance:result};
  });

  app.get('/api/v1/banking/accounts/:accountId/statement',{preHandler:requireAuth},async(req,reply)=>{
    const customerId=await ensureCustomer(pool,asR(req).auth); const accountId=Number((req.params as any).accountId);
    const account=(await pool.query('SELECT * FROM accounts WHERE id=$1 AND customer_id=$2 AND status=\'active\'',[accountId,customerId])).rows[0];
    if(!account)return reply.code(404).send({error:'account_not_found'});
    const conn=await connection(pool,customerId); if(!conn)return reply.code(409).send({error:'finnotech_account_not_connected'});
    if(!conn.provider_account_id && !account.provider_account_id)return reply.code(409).send({error:'provider_account_not_linked'});
    const client=configured(reply);if(!client)return;
    const access=await token(pool,conn,client); const endpoint=path('FINNOTECH_STATEMENT_PATH').replace('{clientId}',encodeURIComponent(conn.client_id??'')).replace('{deposit}',encodeURIComponent(account.provider_account_id??conn.provider_account_id??''));
    return {provider:'FINNOTECH',accountId,statement:await client.call(endpoint,access,undefined,'GET')};
  });

  app.post('/api/v1/banking/transfers',{preHandler:requireAuth},async(req,reply)=>{
    const customerId=await ensureCustomer(pool,asR(req).auth); const b=(req.body??{}) as any;
    if(!Number.isSafeInteger(Number(b.sourceAccountId))||!idem(b.idempotencyKey)||typeof b.amount!=='string'||typeof b.destination!=='string')return reply.code(400).send({error:'invalid_transfer'});
    const source=(await pool.query('SELECT * FROM accounts WHERE id=$1 AND customer_id=$2 AND status=\'active\'',[Number(b.sourceAccountId),customerId])).rows[0];
    if(!source)return reply.code(404).send({error:'source_account_not_found'});
    const existing=(await pool.query('SELECT * FROM transfer_requests WHERE customer_id=$1 AND idempotency_key=$2',[customerId,b.idempotencyKey])).rows[0];
    if(existing)return {transfer:existing,idempotent:true};
    const conn=await connection(pool,customerId);if(!conn)return reply.code(409).send({error:'finnotech_account_not_connected'});
    if(!conn.provider_account_id && !source.provider_account_id)return reply.code(409).send({error:'provider_account_not_linked'});
    const operationId=`ANPARDAZ-BANK-${randomUUID()}`;
    let inserted;
    try{
      inserted=(await pool.query(`INSERT INTO transfer_requests(customer_id,source_account_id,destination_external,amount,currency,idempotency_key,operation_id,provider_code,status) VALUES($1,$2,$3,$4,$5,$6,$7,'FINNOTECH','processing') RETURNING *`,[customerId,source.id,b.destination,b.amount,source.currency,b.idempotencyKey,operationId])).rows[0];
    }catch(e:any){
      if(e?.code==='23505'){
        const concurrent=(await pool.query('SELECT * FROM transfer_requests WHERE customer_id=$1 AND idempotency_key=$2',[customerId,b.idempotencyKey])).rows[0];
        if(concurrent)return {transfer:concurrent,idempotent:true};
      }
      throw e;
    }
    await pool.query(`INSERT INTO banking_provider_outbox(operation_id,operation_type) VALUES($1,'transfer')`,[operationId]);
    const client=configured(reply);if(!client)return; 
    try{
      const access=await token(pool,conn,client); const endpoint=path('FINNOTECH_TRANSFER_PATH').replace('{clientId}',encodeURIComponent(conn.client_id??'')).replace('{deposit}',encodeURIComponent(source.provider_account_id??conn.provider_account_id??''));
      const result=await client.call(endpoint,access,{amount:b.amount,destination:b.destination,description:typeof b.description==='string'?b.description:null,operationId},'POST');
      const providerOperationId=String((result.providerOperationId as any)??(result.operationId as any)??(result.trackId as any)??'');
      const externalReference=String((result.reference as any)??(result.externalReference as any)??(result.traceId as any)??'')||null;
      const status=String((result.status as any)??'processing').toLowerCase();
      const finalStatus=['completed','success','successful'].includes(status)?'completed':['failed','error','rejected'].includes(status)?'failed':'processing';
      const updated=(await pool.query(`UPDATE transfer_requests SET status=$1,provider_operation_id=$2,external_reference=$3,provider_status=$4,updated_at=NOW() WHERE id=$5 RETURNING *`,[finalStatus,providerOperationId||null,externalReference,status,inserted.id])).rows[0];
      return {transfer:updated,providerResponse:result};
    }catch(e){
      const error=e as Error&{code?:string;data?:unknown};
      await pool.query(`UPDATE transfer_requests SET status='processing',provider_status='manual_review',provider_error_code=$1,provider_error_message=$2,updated_at=NOW() WHERE id=$3`,[error.code??'PROVIDER_UNCERTAIN',error.message.slice(0,500),inserted.id]);
      await pool.query(`UPDATE banking_provider_outbox SET status='manual_review',attempts=attempts+1,last_error=$1,updated_at=NOW() WHERE operation_id=$2 AND operation_type='transfer'`,[error.message.slice(0,500),operationId]);
      return reply.code(503).send({error:'finnotech_transfer_outcome_uncertain',operationId});
    }
  });
}
