import { randomUUID } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';

const guard = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const expected = process.env.ANSARRAF_INTERNAL_TOKEN;
  if (!expected || request.headers.authorization !== `Bearer ${expected}`) reply.code(401).send({ error: 'unauthorized' });
};

const normalizePan=(v:unknown)=>typeof v==='string'?v.replace(/\s+/g,''):'';
const validPan=(v:string)=>/^\d{16}$/.test(v);

async function verifyAnPardazCard(cardNumber:string){
  const base=(process.env.ANPARDAZ_SERVICE_URL??'').replace(/\/$/,'');
  const token=process.env.ANPARDAZ_INTERNAL_TOKEN;
  if(!base||!token)throw new Error('anpardaz_card_verification_not_configured');
  const response=await fetch(base+'/internal/v1/admin/cards/lookup?cardNumber='+encodeURIComponent(cardNumber),{
    headers:{authorization:'Bearer '+token},signal:AbortSignal.timeout(Number(process.env.ANPARDAZ_HTTP_TIMEOUT_MS??5000))
  });
  const body=await response.json().catch(()=>({})) as any;
  if(!response.ok)throw new Error(String(body?.error??`anpardaz_card_verification_http_${response.status}`));
  return Array.isArray(body?.cards)?body.cards as any[]:[];
}

async function accountingAccount(base:string,token:string,code:string,name:string,type:string,currency:string){
  let r=await fetch(base+'/internal/v1/ledger/accounts/by-code/'+encodeURIComponent(code),{headers:{authorization:'Bearer '+token},signal:AbortSignal.timeout(5000)});
  if(r.ok)return Number((await r.json() as any).account.id);
  if(r.status!==404)throw new Error('account_lookup_failed');
  r=await fetch(base+'/internal/v1/ledger/accounts',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({accountCode:code,accountName:name,accountType:type,currency}),signal:AbortSignal.timeout(5000)});
  if(r.ok)return Number((await r.json() as any).account.id);
  if(r.status===409){
    r=await fetch(base+'/internal/v1/ledger/accounts/by-code/'+encodeURIComponent(code),{headers:{authorization:'Bearer '+token},signal:AbortSignal.timeout(5000)});
    if(r.ok)return Number((await r.json() as any).account.id);
  }
  throw new Error('account_create_failed');
}

export function registerManualFundingAdminRoutes(app:FastifyInstance,pool:Pool){
  app.get('/internal/v1/admin/deposits/manual',{preHandler:guard},async(request)=>{
    const q=(request.query??{}) as any;const status=String(q.status??'').trim();const cardLast4=String(q.cardLast4??'').trim();
    const where:string[]=[];const args:any[]=[];
    if(status){where.push(`d.status=$${args.length+1}`);args.push(status)}
    if(/^\d{4}$/.test(cardLast4)){where.push(`d.source_card_last4=$${args.length+1}`);args.push(cardLast4)}
    const sql=`SELECT d.*,c.identity_id,c.email,a.symbol AS asset_symbol FROM deposits d JOIN customers c ON c.id=d.customer_id JOIN assets a ON a.id=d.asset_id ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY d.created_at DESC LIMIT 500`;
    return {deposits:(await pool.query(sql,args)).rows};
  });

  app.post('/internal/v1/admin/deposits/manual/credit',{preHandler:guard},async(request,reply)=>{
    const b=(request.body??{}) as any;
    const cardNumber=normalizePan(b.cardNumber),identityId=String(b.identityId??'').trim(),externalReference=String(b.externalReference??'').trim();
    const actorIdentityId=String(request.headers['x-admin-identity']??b.adminActorIdentityId??'').trim(),amount=String(b.amount??'').trim();
    if(!validPan(cardNumber))return reply.code(400).send({error:'valid_16_digit_card_number_required'});
    if(!identityId||identityId.length>200)return reply.code(400).send({error:'identity_id_required'});
    if(!externalReference||externalReference.length>200)return reply.code(400).send({error:'external_reference_required'});
    if(!/^\d+(?:\.\d{1,18})?$/.test(amount)||Number(amount)<=0)return reply.code(400).send({error:'invalid_amount'});
    if(!actorIdentityId)return reply.code(400).send({error:'admin_actor_identity_required'});

    const existing=(await pool.query('SELECT id,customer_id,amount,status,external_reference,accounting_operation_id FROM deposits WHERE external_reference=$1 LIMIT 1',[externalReference])).rows[0];
    if(existing&&existing.status==='confirmed')return {deposit:existing,idempotent:true};

    const cards=await verifyAnPardazCard(cardNumber);
    const verified=cards.find((x:any)=>x.identity_id===identityId&&x.registration_status==='verified'&&x.status==='active'&&x.holder_identity_match!==false);
    if(!verified)return reply.code(409).send({error:'verified_card_for_identity_not_found'});

    const customer=(await pool.query('SELECT id,status FROM customers WHERE identity_id=$1 LIMIT 1',[identityId])).rows[0];
    if(!customer)return reply.code(404).send({error:'ansarraf_customer_not_found'});
    if(customer.status!=='active')return reply.code(409).send({error:'customer_inactive'});
    const asset=(await pool.query(`SELECT id,symbol FROM assets WHERE status='active' AND symbol IN ('TMN','IRT','IRR') ORDER BY CASE symbol WHEN 'TMN' THEN 0 WHEN 'IRT' THEN 1 ELSE 2 END LIMIT 1`)).rows[0];
    if(!asset)return reply.code(503).send({error:'toman_asset_not_configured'});

    const operationId=String(existing?.accounting_operation_id??('ANSARRAF-TMN-'+randomUUID()));
    const accountingUrl=process.env.ACCOUNTING_SERVICE_URL?.replace(/\/$/,'');const accountingToken=process.env.ACCOUNTING_INTERNAL_TOKEN;
    if(!accountingUrl||!accountingToken)return reply.code(503).send({error:'accounting_service_not_configured'});

    let depositId=Number(existing?.id??0);
    if(!depositId){
      const q=await pool.query(`INSERT INTO deposits(customer_id,asset_id,amount,network,external_reference,status,funding_source,source_card_last4,source_card_provider_reference,source_card_verified_at,admin_actor_identity_id,accounting_operation_id)
        VALUES($1,$2,$3,'BANK_CARD',$4,'pending','manual',$5,$6,NOW(),$7,$8)
        ON CONFLICT(external_reference) DO UPDATE SET updated_at=COALESCE(deposits.updated_at,NOW())
        RETURNING id`,[customer.id,asset.id,amount,externalReference,cardNumber.slice(-4),verified.provider_reference??null,actorIdentityId,operationId]);
      depositId=Number(q.rows[0].id);
    }

    const customerAccount=await accountingAccount(accountingUrl,accountingToken,'ansarraf.customer.'+customer.id+'.asset.'+asset.symbol,'An Sarraf customer '+customer.id+' '+asset.symbol,'liability',asset.symbol);
    const cashAccount=await accountingAccount(accountingUrl,accountingToken,'ansarraf.cash.bank_toman.'+asset.symbol,'An Sarraf bank cash '+asset.symbol,'asset',asset.symbol);
    const ledger=await fetch(accountingUrl+'/internal/v1/ledger/transactions',{method:'POST',headers:{authorization:'Bearer '+accountingToken,'content-type':'application/json'},body:JSON.stringify({
      referenceType:'ansarraf_manual_toman_deposit',referenceId:String(depositId),operationId,idempotencyKey:'ansarraf-manual-deposit:'+externalReference,
      description:'Manual bank deposit verified by registered card',
      entries:[
        {accountId:cashAccount,direction:'debit',amount,currency:asset.symbol,metadata:{depositId,cardLast4:cardNumber.slice(-4)}},
        {accountId:customerAccount,direction:'credit',amount,currency:asset.symbol,metadata:{depositId,customerId:customer.id}}
      ]
    }),signal:AbortSignal.timeout(10000)});
    const ledgerBody=await ledger.json().catch(()=>({})) as any;
    if(!ledger.ok)return reply.code(502).send({error:'accounting_post_failed',detail:ledgerBody?.error??null});

    const client=await pool.connect();
    try{
      await client.query('BEGIN');
      const wallet=(await client.query(`INSERT INTO wallets(customer_id,asset_id,available_balance,locked_balance) VALUES($1,$2,0,0)
        ON CONFLICT(customer_id,asset_id) DO UPDATE SET available_balance=wallets.available_balance RETURNING id`,[customer.id,asset.id])).rows[0];
      const updated=(await client.query('UPDATE wallets SET available_balance=available_balance+$1 WHERE id=$2 RETURNING available_balance::text AS available_balance',[amount,wallet.id])).rows[0];
      const d=(await client.query(`UPDATE deposits SET status='confirmed',accounting_operation_id=$1,admin_actor_identity_id=$2 WHERE id=$3 AND status IN ('pending','confirmed') RETURNING id,customer_id,asset_id,amount::text,status,external_reference,source_card_last4,source_card_provider_reference,accounting_operation_id,created_at`,[operationId,actorIdentityId,depositId])).rows[0];
      if(!d)throw new Error('deposit_not_found');
      await client.query('COMMIT');
      return {deposit:d,wallet:{available_balance:updated.available_balance},accounting:ledgerBody};
    }catch(e){await client.query('ROLLBACK').catch(()=>undefined);throw e}finally{client.release()}
  });
}
