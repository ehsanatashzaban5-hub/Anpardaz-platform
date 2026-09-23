import type {FastifyInstance,FastifyRequest,FastifyReply} from 'fastify';
import type {Pool} from 'pg';
import {createHash,randomUUID} from 'node:crypto';
import {ensureCustomer,requireAuth,type AuthClaims} from '../auth.js';
import {FintechProvider,requestFingerprint} from '../fintech-provider.js';

type R=FastifyRequest&{auth:AuthClaims};
const r=(x:FastifyRequest)=>x as R;
const money=/^(?:0|[1-9]\d{0,15})(?:\.\d{1,8})?$/;
const valid=(v:unknown)=>typeof v==='string'&&money.test(v)&&v!=='0';
const sid=(v:unknown)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>0;
const idem=(v:unknown)=>typeof v==='string'&&v.length>=8&&v.length<=200;
const fp=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');

function providerOr503(reply:FastifyReply){
  try{return new FintechProvider();}
  catch{return void reply.code(503).send({error:'fintech_provider_not_configured'});}
}

function providerStatusToTransferStatus(status:string){
  return status==='completed'?'completed':status==='failed'?'failed':status==='manual_review'?'processing':'processing';
}

export function registerBankingRoutes(app:FastifyInstance,pool:Pool){
  app.get('/api/v1/cards',{preHandler:requireAuth},async(req)=>{
    const c=await ensureCustomer(pool,r(req).auth);
    return {cards:(await pool.query(
      'SELECT id,account_id,last4,status,created_at FROM cards WHERE customer_id=$1 ORDER BY created_at DESC',[c]
    )).rows};
  });

  app.post('/api/v1/cards',{preHandler:requireAuth},async(req,reply)=>{
    const c=await ensureCustomer(pool,r(req).auth),b=(req.body??{}) as any;
    if(!sid(b.accountId)||typeof b.last4!=='string'||!/^\d{4}$/.test(b.last4)||typeof b.cardToken!=='string'||b.cardToken.length<16)
      return reply.code(400).send({error:'invalid_card'});
    const owner=await pool.query('SELECT id FROM accounts WHERE id=$1 AND customer_id=$2',[b.accountId,c]);
    if(!owner.rows[0])return reply.code(404).send({error:'account_not_found'});
    try{
      const x=await pool.query(
        'INSERT INTO cards(customer_id,account_id,card_token,last4) VALUES($1,$2,$3,$4) RETURNING id,account_id,last4,status,created_at',
        [c,b.accountId,b.cardToken,b.last4]
      );
      return reply.code(201).send({card:x.rows[0]});
    }catch(e:any){
      if(e?.code==='23505')return reply.code(409).send({error:'card_already_exists'});
      throw e;
    }
  });

  app.post('/api/v1/cards/balance',{preHandler:requireAuth},async(req,reply)=>{
    const c=await ensureCustomer(pool,r(req).auth),b=(req.body??{}) as any;
    const cardNumber=String(b.cardNumber??'').replace(/\s/g,'');
    if(!/^\d{16}$/.test(cardNumber))return reply.code(400).send({error:'invalid_card_number'});
    if(!idem(b.idempotencyKey))return reply.code(400).send({error:'invalid_idempotency_key'});
    const month=String(b.expiryMonth??'').replace(/\D/g,'');
    const year=String(b.expiryYear??'').replace(/\D/g,'');
    if(!/^\d{2}$/.test(month)||!/^\d{2}$/.test(year)||Number(month)<1||Number(month)>12)
      return reply.code(400).send({error:'invalid_card_expiry'});
    if(!/^\d{3,4}$/.test(String(b.cvv2??'')))return reply.code(400).send({error:'invalid_cvv2'});
    if(!/^\d{4,6}$/.test(String(b.otp??'')))return reply.code(400).send({error:'invalid_otp'});

    const operationId=`ANPARDAZ-CB-${randomUUID()}`;
    const requestFingerprint=fp({cardLast4:cardNumber.slice(-4),expiryMonth:month,expiryYear:year});
    const existing=(await pool.query(
      'SELECT * FROM card_balance_checks WHERE customer_id=$1 AND operation_id=$2',[c,operationId]
    )).rows[0];
    if(existing)return {check:existing,idempotent:true};

    await pool.query(
      `INSERT INTO card_balance_checks(customer_id,operation_id,card_last4,provider_code,status)
       VALUES($1,$2,$3,'FINNOTECH','pending')`,[c,operationId,cardNumber.slice(-4)]
    );
    await pool.query(
      `INSERT INTO banking_provider_outbox(operation_id,operation_type) VALUES($1,'card_balance')`,[operationId]
    );

    const provider=providerOr503(reply);if(!provider)return;
    try{
      const result=await provider.execute({
        serviceCode:'card_balance',operationId,
        payload:{
          card:cardNumber,
          cvv2:String(b.cvv2),
          otp:String(b.otp),
          expiryMonth:month,
          expiryYear:year,
          ...(b.clientId?{clientId:String(b.clientId)}:{})
        }
      });
      const raw=result.data??{};
      const balanceValue=raw.balance??(raw.result as any)?.balance??raw.amount;
      const balance=balanceValue!=null&&/^\d+(?:\.\d+)?$/.test(String(balanceValue))?String(balanceValue):null;
      const updated=(await pool.query(
        `UPDATE card_balance_checks SET status=$1,provider_operation_id=$2,provider_reference=$3,balance=$4,currency='IRR',
         error_code=$5,error_message=$6,response_metadata=$7,completed_at=CASE WHEN $1='completed' THEN NOW() ELSE completed_at END
         WHERE operation_id=$8 RETURNING id,operation_id,card_last4,status,balance,currency,provider_reference,created_at,completed_at`,
        [result.status,result.providerOperationId??null,result.externalReference??null,balance,result.errorCode??null,result.errorMessage??null,JSON.stringify(raw),operationId]
      )).rows[0];
      await pool.query(
        `UPDATE banking_provider_outbox SET status=$1,updated_at=NOW(),attempts=attempts+1,last_error=$2 WHERE operation_id=$3 AND operation_type='card_balance'`,
        [result.status==='completed'?'completed':result.status==='failed'?'failed':result.status==='manual_review'?'manual_review':'processing',result.errorMessage??null,operationId]
      );
      return {check:updated,requestFingerprint};
    }catch(e){
      await pool.query(
        `UPDATE card_balance_checks SET status='manual_review',error_code='PROVIDER_UNAVAILABLE',error_message=$1 WHERE operation_id=$2`,
        [e instanceof Error?e.message:'provider_unavailable',operationId]
      );
      return reply.code(503).send({error:'banking_provider_unavailable',operationId});
    }
  });

  app.get('/api/v1/card-balance-checks',{preHandler:requireAuth},async(req)=>{
    const c=await ensureCustomer(pool,r(req).auth);
    return {checks:(await pool.query(
      'SELECT id,operation_id,card_last4,status,balance,currency,provider_reference,created_at,completed_at FROM card_balance_checks WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 100',[c]
    )).rows};
  });

  app.get('/api/v1/transfers',{preHandler:requireAuth},async(req)=>{
    const c=await ensureCustomer(pool,r(req).auth);
    return {transfers:(await pool.query(
      'SELECT * FROM transfer_requests WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 200',[c]
    )).rows};
  });

  app.post('/api/v1/transfers',{preHandler:requireAuth},async(req,reply)=>{
    const c=await ensureCustomer(pool,r(req).auth),b=(req.body??{}) as any;
    if(!sid(b.sourceAccountId)||!valid(b.amount)||typeof b.currency!=='string'||!/^[A-Z]{3}$/.test(b.currency)||!idem(b.idempotencyKey))
      return reply.code(400).send({error:'invalid_transfer'});
    const hasInternal=sid(b.destinationAccountId);
    const hasExternal=typeof b.destinationExternal==='string'&&b.destinationExternal.trim().length>0;
    if(hasInternal===hasExternal)return reply.code(400).send({error:'exactly_one_destination_required'});

    const own=await pool.query('SELECT id,currency FROM accounts WHERE id=$1 AND customer_id=$2 AND status=\'active\'',[b.sourceAccountId,c]);
    if(!own.rows[0]||own.rows[0].currency!==b.currency)return reply.code(400).send({error:'invalid_source_account'});
    if(hasInternal){
      if(b.destinationAccountId===b.sourceAccountId)return reply.code(400).send({error:'source_destination_same'});
      const dest=await pool.query('SELECT id,currency,status FROM accounts WHERE id=$1',[b.destinationAccountId]);
      if(!dest.rows[0]||dest.rows[0].status!=='active'||dest.rows[0].currency!==b.currency)return reply.code(400).send({error:'invalid_destination_account'});
    }

    const requestFingerprint=fp({
      sourceAccountId:b.sourceAccountId,destinationAccountId:hasInternal?b.destinationAccountId:null,
      destinationExternal:hasExternal?b.destinationExternal.trim():null,amount:b.amount,currency:b.currency,description:b.description?.trim()??null
    });
    const existing=(await pool.query(
      'SELECT * FROM transfer_requests WHERE customer_id=$1 AND idempotency_key=$2',[c,b.idempotencyKey]
    )).rows[0];
    if(existing){
      const existingFingerprint=fp({
        sourceAccountId:existing.source_account_id,destinationAccountId:existing.destination_account_id??null,
        destinationExternal:existing.destination_external??null,amount:existing.amount,currency:existing.currency,description:existing.description??null
      });
      if(existingFingerprint!==requestFingerprint)return reply.code(409).send({error:'idempotency_key_reused'});
      return {transfer:existing,operationId:existing.operation_id,idempotent:true};
    }

    const operationId=randomUUID();
    const x=(await pool.query(
      `INSERT INTO transfer_requests(customer_id,source_account_id,destination_account_id,destination_external,amount,currency,description,idempotency_key,operation_id,provider_code,status)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'FINNOTECH','pending') RETURNING *`,
      [c,b.sourceAccountId,hasInternal?b.destinationAccountId:null,hasExternal?b.destinationExternal.trim():null,b.amount,b.currency,b.description?.trim()??null,b.idempotencyKey,operationId]
    )).rows[0];
    await pool.query(`INSERT INTO banking_provider_outbox(operation_id,operation_type) VALUES($1,'transfer')`,[operationId]);

    await pool.query("UPDATE transfer_requests SET status='processing',updated_at=NOW() WHERE operation_id=$1 AND status='pending'",[operationId]);
    const provider=providerOr503(reply);if(!provider)return;
    try{
      const result=await provider.execute({
        serviceCode:'transfer',operationId,
        payload:{
          amount:String(b.amount),currency:b.currency,
          destinationAccountId:hasInternal?String(b.destinationAccountId):undefined,
          destinationExternal:hasExternal?b.destinationExternal.trim():undefined,
          description:b.description?.trim()??undefined,
          sourceAccountId:String(b.sourceAccountId),
          ...(b.clientId?{clientId:String(b.clientId)}:{}),
          ...(b.nid?{nid:String(b.nid)}:{})
        }
      });
      const updated=(await pool.query(
        `UPDATE transfer_requests
         SET status=$1,provider_operation_id=$2,provider_reference=$3,provider_status=$4,
             provider_error_code=$5,provider_error_message=$6,provider_metadata=$7,updated_at=NOW()
         WHERE operation_id=$8 RETURNING *`,
        [providerStatusToTransferStatus(result.status),result.providerOperationId??null,result.externalReference??null,result.status,result.errorCode??null,result.errorMessage??null,JSON.stringify(result.data??{}),operationId]
      )).rows[0];
      await pool.query(
        `UPDATE banking_provider_outbox SET status=$1,updated_at=NOW(),attempts=attempts+1,last_error=$2 WHERE operation_id=$3 AND operation_type='transfer'`,
        [result.status==='completed'?'completed':result.status==='failed'?'failed':result.status==='manual_review'?'manual_review':'processing',result.errorMessage??null,operationId]
      );
      return reply.code(result.status==='failed'?502:202).send({transfer:updated,operationId});
    }catch(e){
      await pool.query(
        `UPDATE transfer_requests SET status='processing',provider_status='manual_review',provider_error_code='PROVIDER_UNAVAILABLE',provider_error_message=$1,updated_at=NOW() WHERE operation_id=$2`,
        [e instanceof Error?e.message:'provider_unavailable',operationId]
      );
      return reply.code(503).send({error:'banking_provider_unavailable',operationId});
    }
  });

  app.post('/api/v1/transfers/:id/cancel',{preHandler:requireAuth},async(req,reply)=>{
    const c=await ensureCustomer(pool,r(req).auth),id=Number((req.params as any).id);
    const x=await pool.query(`UPDATE transfer_requests SET status='cancelled',updated_at=NOW()
      WHERE id=$1 AND customer_id=$2 AND status='pending' RETURNING *`,[id,c]);
    if(!x.rows[0])return reply.code(404).send({error:'transfer_not_cancellable'});
    return {transfer:x.rows[0]};
  });

  app.get('/api/v1/topups',{preHandler:requireAuth},async(req)=>{
    const c=await ensureCustomer(pool,r(req).auth);
    return {topups:(await pool.query('SELECT * FROM topup_requests WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 200',[c])).rows};
  });

  app.post('/api/v1/topups',{preHandler:requireAuth},async(req,reply)=>{
    const c=await ensureCustomer(pool,r(req).auth),b=(req.body??{}) as any;
    if(!sid(b.accountId)||!valid(b.amount)||typeof b.currency!=='string'||!/^[A-Z]{3}$/.test(b.currency)||!idem(b.idempotencyKey))
      return reply.code(400).send({error:'invalid_topup'});
    const own=await pool.query('SELECT id,currency FROM accounts WHERE id=$1 AND customer_id=$2',[b.accountId,c]);
    if(!own.rows[0]||own.rows[0].currency!==b.currency)return reply.code(400).send({error:'invalid_account'});
    const operationId=randomUUID();
    try{
      const x=await pool.query(
        'INSERT INTO topup_requests(customer_id,account_id,amount,currency,provider,idempotency_key,operation_id) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',
        [c,b.accountId,b.amount,b.currency,b.provider??'FINNOTECH',b.idempotencyKey,operationId]
      );
      return reply.code(202).send({topup:x.rows[0],operationId});
    }catch(e:any){
      if(e?.code==='23505'){
        const x=await pool.query('SELECT * FROM topup_requests WHERE customer_id=$1 AND idempotency_key=$2',[c,b.idempotencyKey]);
        return {topup:x.rows[0],operationId:x.rows[0]?.operation_id??null,idempotent:true};
      }
      throw e;
    }
  });
}
