import type {FastifyInstance,FastifyRequest,FastifyReply} from 'fastify';
import type {Pool} from 'pg';
import {randomUUID} from 'node:crypto';
import {ensureCustomer,requireAuth,type AuthClaims} from '../auth.js';
import {decryptSecret,encryptSecret,FinnotechClient,oauthState} from '../finnotech.js';

type R=FastifyRequest&{auth:AuthClaims};
const asR=(r:FastifyRequest)=>r as R;
const idem=(v:unknown)=>typeof v==='string'&&v.length>=8&&v.length<=200;
const nonEmpty=(v:unknown)=>typeof v==='string'&&v.trim().length>0&&v.length<=200;
const path=(name:string,fallback:string)=>process.env[name]?.trim()||fallback;

function configured(reply:FastifyReply){
  try{return new FinnotechClient();}catch{return void reply.code(503).send({error:'finnotech_not_configured'});}
}

async function connection(pool:Pool,customerId:number,bankCode?:string){
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
    const redirectUri=String((req.query as any)?.redirectUri??process.env.FINNOTECH_REDIRECT_URI??'').trim();
    if(!redirectUri)return reply.code(400).send({error:'finnotech_redirect_uri_required'});
    const client=configured(reply);if(!client)return;
    const state=oauthState(customerId,redirectUri);
    await pool.query('INSERT INTO finnotech_oauth_states(state,customer_id,redirect_uri,expires_at) VALUES($1,$2,$3,NOW()+INTERVAL \'10 minutes\')',[state,customerId,redirectUri]);
    return {authorizationUrl:client.authorizationUrl(state,redirectUri),state};
  });

  app.get('/api/v1/banking/finnotech/callback',async(req,reply)=>{
    const q=req.query as any;const state=String(q?.state??'').trim();const code=String(q?.code??'').trim();
    if(!state||!code)return reply.code(400).send({error:'finnotech_callback_invalid'});
    const s=(await pool.query('DELETE FROM finnotech_oauth_states WHERE state=$1 AND expires_at>NOW() RETURNING *',[state])).rows[0];
    if(!s)return reply.code(400).send({error:'finnotech_oauth_state_invalid_or_expired'});
    const client=configured(reply);if(!client)return;
    const tokenResponse=await client.exchangeCode(code,s.redirect_uri);
    const access=String((tokenResponse.access_token as any)?.value??tokenResponse.access_token??'');
    const refresh=String((tokenResponse.access_token as any)?.refreshToken??tokenResponse.refresh_token??'');
    if(!access)return reply.code(502).send({error:'finnotech_access_token_missing'});
    const expires=Number((tokenResponse.access_token as any)?.expiresIn??tokenResponse.expires_in??3600);
    await pool.query(
      `INSERT INTO finnotech_connections(customer_id,client_id,access_token_enc,refresh_token_enc,access_token_expires_at,scope,status)
       VALUES($1,$2,$3,$4,NOW()+($5::text || ' seconds')::interval,$6,'active')
       ON CONFLICT(customer_id,provider,bank_code) DO UPDATE SET client_id=EXCLUDED.client_id,access_token_enc=EXCLUDED.access_token_enc,refresh_token_enc=EXCLUDED.refresh_token_enc,access_token_expires_at=EXCLUDED.access_token_expires_at,scope=EXCLUDED.scope,status='active',last_error=NULL,updated_at=NOW()`,
      [s.customer_id,process.env.FINNOTECH_CLIENT_ID,encryptSecret(access),refresh?encryptSecret(refresh):null,expires,typeof tokenResponse.scope==='string'?tokenResponse.scope:null]
    );
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
    const result=await client.call(path('FINNOTECH_BALANCE_PATH','/oak/v1/clients/{clientId}/deposits/{deposit}/balance').replace('{clientId}',encodeURIComponent(conn.client_id??process.env.FINNOTECH_CLIENT_ID??'')).replace('{deposit}',encodeURIComponent(account.provider_account_id??'')),access,undefined,'GET');
    return {provider:'FINNOTECH',accountId,bankBalance:result};
  });
}
