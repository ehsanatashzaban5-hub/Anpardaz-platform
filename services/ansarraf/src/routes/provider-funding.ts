import type {FastifyInstance,FastifyRequest} from 'fastify';
import type {Pool} from 'pg';
import {ensureCustomer,requireAuth,type AuthClaims} from '../auth.js';
import {createProviderRegistry} from '../providers/index.js';
import {randomUUID} from 'node:crypto';

type R=FastifyRequest&{auth:AuthClaims};
async function ledgerAccount(base:string,token:string,code:string,name:string,type:string,currency:string){
 let r=await fetch(base+'/internal/v1/ledger/accounts/by-code/'+encodeURIComponent(code),{headers:{authorization:'Bearer '+token}});
 if(r.ok)return Number((await r.json() as any).account.id);
 if(r.status!==404)throw new Error('account_lookup_failed');
 r=await fetch(base+'/internal/v1/ledger/accounts',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({accountCode:code,accountName:name,accountType:type,currency})});
 if(r.ok)return Number((await r.json() as any).account.id);
 if(r.status===409){r=await fetch(base+'/internal/v1/ledger/accounts/by-code/'+encodeURIComponent(code),{headers:{authorization:'Bearer '+token}});if(r.ok)return Number((await r.json() as any).account.id);}
 throw new Error('account_create_failed');
}
const admin=async(req:FastifyRequest,reply:any)=>{const a=(req as R).auth;if(!['admin','super_admin','operator'].includes(a.role))return reply.code(403).send({error:'forbidden'});return a;};

export function registerProviderFundingRoutes(app:FastifyInstance,pool:Pool){
  const registry=createProviderRegistry();
  app.get('/api/v1/funding/cards',{preHandler:requireAuth},async(req,reply)=>{
    const identityId=String((req as R).auth.sub);
    const base=(process.env.ANPARDAZ_SERVICE_URL??'').replace(/\/$/,'');
    const token=process.env.ANPARDAZ_INTERNAL_TOKEN;
    if(!base||!token)return reply.code(503).send({error:'anpardaz_card_verification_not_configured'});
    const response=await fetch(base+'/internal/v1/admin/cards/lookup?identityId='+encodeURIComponent(identityId),{headers:{authorization:'Bearer '+token},signal:AbortSignal.timeout(Number(process.env.ANPARDAZ_HTTP_TIMEOUT_MS??5000))});
    const body=await response.json().catch(()=>({})) as any;
    if(!response.ok)return reply.code(503).send({error:'anpardaz_card_lookup_failed'});
    const cards=(Array.isArray(body.cards)?body.cards:[]).filter((card:any)=>card.registration_status==='verified'&&card.status==='active'&&card.holder_identity_match===true)
      .map((card:any)=>({id:Number(card.id),last4:String(card.last4),bankName:card.bank_name??null,provider:card.provider??null}));
    return {cards};
  });

  app.get('/api/v1/crypto/deposit-networks',{preHandler:requireAuth},async(req,reply)=>{
    const symbol=String((req.query as any)?.asset??'').trim().toUpperCase();
    if(!/^[A-Z0-9]{2,20}$/.test(symbol))return reply.code(400).send({error:'crypto_asset_required'});
    const asset=(await pool.query("SELECT id,symbol FROM assets WHERE symbol=$1 AND asset_type='crypto' AND status='active'",[symbol])).rows[0];
    if(!asset)return reply.code(404).send({error:'crypto_asset_not_available'});
    const providerCode=(process.env.LIQUIDITY_PROVIDER_CODE??'WALLEX').toUpperCase();
    const provider=(await pool.query("SELECT id FROM liquidity_providers WHERE code=$1 AND status='ACTIVE'",[providerCode])).rows[0];
    if(!provider)return reply.code(503).send({error:'provider_not_active'});
    const adapter=registry.get(providerCode);if(!adapter)return reply.code(503).send({error:'provider_not_configured'});
    const networks=await adapter.listDepositNetworks(symbol);
    return {provider:providerCode,asset:symbol,networks};
  });
  app.get('/api/v1/crypto/deposit-address',{preHandler:requireAuth},async(req,reply)=>{
    const customer=await ensureCustomer(pool,(req as R).auth);const q=req.query as any;const symbol=String(q.asset??'').trim().toUpperCase();const network=String(q.network??'').trim();
    if(!/^[A-Z0-9]{2,20}$/.test(symbol)||!network)return reply.code(400).send({error:'asset_and_network_required'});
    const asset=(await pool.query("SELECT id,symbol FROM assets WHERE symbol=$1 AND asset_type='crypto' AND status='active'",[symbol])).rows[0];if(!asset)return reply.code(400).send({error:'crypto_asset_not_available'});
    const providerCode=(process.env.LIQUIDITY_PROVIDER_CODE??'WALLEX').toUpperCase(),provider=(await pool.query("SELECT id FROM liquidity_providers WHERE code=$1 AND status='ACTIVE'",[providerCode])).rows[0];if(!provider)return reply.code(503).send({error:'provider_not_active'});
    const adapter=registry.get(providerCode);if(!adapter)return reply.code(503).send({error:'provider_not_configured'});
    const address=await adapter.getDepositAddress(symbol,network);if(!address.address)return reply.code(503).send({error:'provider_deposit_address_unavailable'});
    const others=(await pool.query("SELECT customer_id,memo FROM provider_deposit_addresses WHERE provider_id=$1 AND asset_id=$2 AND network=$3 AND address=$4 AND status='ACTIVE' AND customer_id<>$5",[provider.id,asset.id,network,address.address,customer])).rows;
    const memoIsUnique=Boolean(address.memo)&&others.every((x:any)=>String(x.memo??'')!==String(address.memo));
    const safe=others.length===0||memoIsUnique;
    const row=(await pool.query(`INSERT INTO provider_deposit_addresses(provider_id,customer_id,asset_id,network,address,memo,provider_reference)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT(provider_id,customer_id,asset_id,network) DO UPDATE SET address=EXCLUDED.address,memo=EXCLUDED.memo,provider_reference=EXCLUDED.provider_reference,status='ACTIVE'
      RETURNING *`,[provider.id,customer,asset.id,network,address.address,address.memo??null,null])).rows[0];
    return{provider:providerCode,address:row.address,memo:row.memo,network,safeForAutomaticAttribution:safe,requiresAdminReview:!safe,message:safe?'این آدرس در حال حاضر برای این کاربر قابل تطبیق است؛ اعتباردهی فقط پس از تأیید شبکه انجام می‌شود.':'این آدرس بین چند کاربر مشترک است؛ تا زمانی که شناسه اختصاصی و قابل‌اعتماد (آدرس اختصاصی یا memo/tag یکتا) نداشته باشیم، تراکنش به‌صورت خودکار به موجودی هیچ کاربری اضافه نمی‌شود و باید مدیر آن را تطبیق دهد.'};
  });

  app.get('/api/v1/admin/crypto-deposits',{preHandler:requireAuth},async(req,reply)=>{
    const a=await admin(req,reply);if(!a)return;
    return{deposits:(await pool.query(`SELECT e.*,c.identity_id,c.email,a.symbol FROM provider_deposit_events e LEFT JOIN customers c ON c.id=e.customer_id LEFT JOIN assets a ON a.id=e.asset_id ORDER BY e.detected_at DESC LIMIT 500`)).rows};
  });

  app.post('/api/v1/admin/crypto-deposits/:id/approve',{preHandler:requireAuth},async(req,reply)=>{
    const a=await admin(req,reply);if(!a)return;
    const id=Number((req.params as any).id),customerId=Number((req.body as any)?.customerId);
    if(!Number.isSafeInteger(id)||id<=0||!Number.isSafeInteger(customerId)||customerId<=0)return reply.code(400).send({error:'event_and_customer_required'});
    const client=await pool.connect();
    try{
      await client.query('BEGIN');
      const e=(await client.query('SELECT e.*,a.symbol FROM provider_deposit_events e JOIN assets a ON a.id=e.asset_id WHERE e.id=$1 FOR UPDATE',[id])).rows[0];
      if(!e)throw new Error('deposit_event_not_found');
      if(!['confirmed','manual_review','detected'].includes(e.status))throw new Error('deposit_event_not_approvable');
      if(e.customer_id&&Number(e.customer_id)!==customerId)throw new Error('deposit_customer_mismatch');
      const op='ANSARRAF-CRYPTO-DEP-'+randomUUID();
      await client.query('INSERT INTO wallets(customer_id,asset_id,available_balance,locked_balance) VALUES($1,$2,0,0) ON CONFLICT(customer_id,asset_id) DO NOTHING',[customerId,e.asset_id]);
      await client.query(`UPDATE provider_deposit_events SET customer_id=$2,status='accounting_pending',confirmed_at=COALESCE(confirmed_at,NOW()) WHERE id=$1`,[id,customerId]);
      await client.query(`INSERT INTO accounting_outbox(event_type,aggregate_type,aggregate_id,idempotency_key,payload)
        VALUES('exchange.crypto_deposit.settled','provider_deposit', $1, $2, $3::jsonb)
        ON CONFLICT(idempotency_key) DO NOTHING`,
        [String(id),'ansarraf:crypto-deposit:'+id,JSON.stringify({eventId:id,operationId:op,customerId,assetId:Number(e.asset_id),assetSymbol:String(e.symbol),amount:String(e.amount)})]);
      await client.query('COMMIT');
      return{approved:true,eventId:id,customerId,operationId:op,status:'accounting_pending'};
    }catch(error){
      await client.query('ROLLBACK');
      return reply.code(400).send({error:error instanceof Error?error.message:'crypto_deposit_approval_failed'});
    }finally{client.release();}
  });
}
