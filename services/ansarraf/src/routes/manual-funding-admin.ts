import type {FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';

const guard = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const expected = process.env.ANSARRAF_INTERNAL_TOKEN;
  if (!expected || request.headers.authorization !== `Bearer ${expected}`) {
    reply.code(401).send({ error: 'unauthorized' });
  }
};

const normalizePan=(v:unknown)=>typeof v==='string'?v.replace(/\s+/g,''):''; 
const validPan=(v:string)=>/^\d{16}$/.test(v);

async function verifyAnPardazCard(cardNumber:string){
  const base=(process.env.ANPARDAZ_SERVICE_URL??'').replace(/\/$/,'');
  const token=process.env.ANPARDAZ_INTERNAL_TOKEN;
  if(!base||!token)throw new Error('anpardaz_card_verification_not_configured');
  const response=await fetch(base+'/internal/v1/admin/cards/lookup?cardNumber='+encodeURIComponent(cardNumber),{
    headers:{authorization:'Bearer '+token},
    signal:AbortSignal.timeout(Number(process.env.ANPARDAZ_HTTP_TIMEOUT_MS??5000)),
  });
  const body=await response.json().catch(()=>({})) as any;
  if(!response.ok)throw new Error(String(body?.error??`anpardaz_card_verification_http_${response.status}`));
  return Array.isArray(body?.cards)?body.cards as any[]:[];
}

export function registerManualFundingAdminRoutes(app:FastifyInstance,pool:Pool){
  app.get('/internal/v1/admin/deposits/manual',{preHandler:guard},async(request,reply)=>{
    const q=(request.query??{}) as any;
    const status=String(q.status??'').trim();
    const cardLast4=String(q.cardLast4??'').trim();
    const where:string[]=[];const args:any[]=[];
    if(status){where.push(`d.status=$${args.length+1}`);args.push(status);}
    if(cardLast4&&/^\d{4}$/.test(cardLast4)){where.push(`d.source_card_last4=$${args.length+1}`);args.push(cardLast4);}
    const sql=`SELECT d.*,c.identity_id,c.email,a.symbol AS asset_symbol
      FROM deposits d JOIN customers c ON c.id=d.customer_id JOIN assets a ON a.id=d.asset_id
      ${where.length?'WHERE '+where.join(' AND '):''}
      ORDER BY d.created_at DESC LIMIT 500`;
    return {deposits:(await pool.query(sql,args)).rows};
  });

  app.post('/internal/v1/admin/deposits/manual/credit',{preHandler:guard},async(request,reply)=>{
    const b=(request.body??{}) as any;
    const cardNumber=normalizePan(b.cardNumber);
    const identityId=String(b.identityId??'').trim();
    const externalReference=String(b.externalReference??'').trim();
    const actorIdentityId=String(request.headers['x-admin-identity']??b.adminActorIdentityId??'').trim();
    const amount=String(b.amount??'').trim();
    if(!validPan(cardNumber))return reply.code(400).send({error:'valid_16_digit_card_number_required'});
    if(!identityId||identityId.length>200)return reply.code(400).send({error:'identity_id_required'});
    if(!externalReference||externalReference.length>200)return reply.code(400).send({error:'external_reference_required'});
    if(!/^\d+(?:\.\d{1,18})?$/.test(amount)||Number(amount)<=0)return reply.code(400).send({error:'invalid_amount'});
    if(!actorIdentityId)return reply.code(400).send({error:'admin_actor_identity_required'});

    const existing=(await pool.query('SELECT id,customer_id,amount,status,external_reference,accounting_operation_id FROM deposits WHERE external_reference=$1 LIMIT 1',[externalReference])).rows[0];
    if(existing)return {deposit:existing,idempotent:true};

    const cards=await verifyAnPardazCard(cardNumber);
    const verified=cards.find((x:any)=>x.identity_id===identityId&&x.registration_status==='verified'&&x.status==='active'&&x.holder_identity_match!==false);
    if(!verified)return reply.code(409).send({error:'verified_card_for_identity_not_found'});

    const customer=(await pool.query('SELECT id,status FROM customers WHERE identity_id=$1 LIMIT 1',[identityId])).rows[0];
    if(!customer)return reply.code(404).send({error:'ansarraf_customer_not_found'});
    if(customer.status!=='active')return reply.code(409).send({error:'customer_inactive'});
    const asset=(await pool.query(`SELECT id,symbol FROM assets WHERE status='active' AND symbol IN ('TMN','IRT','IRR') ORDER BY CASE symbol WHEN 'TMN' THEN 0 WHEN 'IRT' THEN 1 ELSE 2 END LIMIT 1`)).rows[0];
    if(!asset)return reply.code(503).send({error:'toman_asset_not_configured'});

    const operationId='ANSARRAF-TMN-'+crypto.randomUUID();
    const client=await pool.connect();
    try{
      await client.query('BEGIN');
      const wallet=(await client.query(`INSERT INTO wallets(customer_id,asset_id,available_balance,locked_balance)
        VALUES($1,$2,0,0) ON CONFLICT(customer_id,asset_id) DO UPDATE SET available_balance=wallets.available_balance
        RETURNING id,available_balance::text AS available_balance`,[customer.id,asset.id])).rows[0];
      const updated=(await client.query(`UPDATE wallets SET available_balance=available_balance+$1 WHERE id=$2 RETURNING available_balance::text AS available_balance`,[amount,wallet.id])).rows[0];
      const deposit=(await client.query(`INSERT INTO deposits(customer_id,asset_id,amount,network,external_reference,status,funding_source,source_card_last4,source_card_provider_reference,source_card_verified_at,admin_actor_identity_id,accounting_operation_id)
        VALUES($1,$2,$3,'BANK_CARD',$4,'confirmed','manual',$5,$6,NOW(),$7,$8)
        RETURNING id,customer_id,asset_id,amount::text,status,external_reference,source_card_last4,source_card_provider_reference,accounting_operation_id,created_at`,
        [customer.id,asset.id,amount,externalReference,cardNumber.slice(-4),verified.provider_reference??null,actorIdentityId,operationId])).rows[0];
      await client.query('COMMIT');

      const accountingUrl=process.env.ACCOUNTING_SERVICE_URL;
      const accountingToken=process.env.ACCOUNTING_INTERNAL_TOKEN;
      if(!accountingUrl||!accountingToken)throw new Error('accounting_service_not_configured');
      const accountCode='ansarraf.customer.'+customer.id+'.asset.'+asset.symbol;
      const cashCode='ansarraf.cash.bank_toman.'+asset.symbol;
      const ensureAccount=async(code:string,name:string,type:string)=>{
        let rr=await fetch(accountingUrl.replace(/\/$/,'')+'/internal/v1/ledger/accounts/by-code/'+encodeURIComponent(code),{headers:{authorization:'Bearer '+accountingToken},signal:AbortSignal.timeout(5000)});
        if(rr.ok)return Number((await rr.json() as any).account.id);
        if(rr.status!==404)throw new Error('account_lookup_failed');
        rr=await fetch(accountingUrl.replace(/\/$/,'')+'/internal/v1/ledger/accounts',{method:'POST',headers:{authorization:'Bearer '+accountingToken,'content-type':'application/json'},body:JSON.stringify({accountCode:code,accountName:name,accountType:type,currency:asset.symbol}),signal:AbortSignal.timeout(5000)});
        if(rr.ok)return Number((await rr.json() as any).account.id);
        if(rr.status===409){
          rr=await fetch(accountingUrl.replace(/\/$/,'')+'/internal/v1/ledger/accounts/by-code/'+encodeURIComponent(code),{headers:{authorization:'Bearer '+accountingToken},signal:AbortSignal.timeout(5000)});
          if(rr.ok)return Number((await rr.json() as any).account.id);
        }
        throw new Error('account_create_failed');
      };
      const customerAccount=await ensureAccount(accountCode,'An Sarraf customer '+customer.id+' '+asset.symbol,'liability');
      const cashAccount=await ensureAccount(cashCode,'An Sarraf bank cash '+asset.symbol,'asset');
      const ledger=await fetch(accountingUrl.replace(/\/$/,'')+'/internal/v1/ledger/transactions',{method:'POST',headers:{authorization:'Bearer '+accountingToken,'content-type':'application/json'},body:JSON.stringify({
        referenceType:'ansarraf_manual_toman_deposit',referenceId:String(deposit.id),operationId,idempotencyKey:'ansarraf-manual-deposit:'+externalReference,
        description:'Manual bank deposit verified by registered card',
        entries:[
          {accountId:cashAccount,direction:'debit',amount,currency:asset.symbol,metadata:{depositId:deposit.id,cardLast4:cardNumber.slice(-4)}},
          {accountId:customerAccount,direction:'credit',amount,currency:asset.symbol,metadata:{depositId:deposit.id,customerId:customer.id}},
        ]
      }),signal:AbortSignal.timeout(10000)});
      const ledgerBody=await ledger.json().catch(()=>({})) as any;
      if(!ledger.ok)throw new Error(String(ledgerBody?.error??'accounting_post_failed'));
      await pool.query('UPDATE deposits SET accounting_operation_id=$1 WHERE id=$2',[operationId,deposit.id]);
      return {deposit:{...deposit,accounting_operation_id:operationId},wallet:{available_balance:updated.available_balance},accounting:ledgerBody};
    }catch(e){
      try{await client.query('ROLLBACK')}catch{}
      throw e;
    }finally{client.release()}
  });
}
