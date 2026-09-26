import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { Pool } from 'pg';
import { ensureCustomer, requireAuth } from '../auth.js';

type Params={id:string}; type CreateAccount={accountType?:'wallet'|'bank'|'settlement';currency?:string};

async function ledgerBalance(customerId:number,currency:string){
  const base=(process.env.ACCOUNTING_SERVICE_URL??'').replace(/\/$/,'');
  const token=process.env.ACCOUNTING_INTERNAL_TOKEN??'';
  if(!base||!token)throw new Error('accounting_service_not_configured');
  const code=`anpardaz.customer.${customerId}.liability.${currency}`;
  const r=await fetch(base+'/internal/v1/ledger/accounts/by-code/'+encodeURIComponent(code),{
    headers:{authorization:'Bearer '+token},signal:AbortSignal.timeout(8000),
  });
  if(r.status===404)return {balance:'0',ledgerAccountId:null};
  if(!r.ok)throw new Error('accounting_balance_lookup_failed');
  const account=(await r.json() as any)?.account;
  if(!account?.id)throw new Error('accounting_account_invalid');
  const b=await fetch(base+'/internal/v1/ledger/accounts/'+encodeURIComponent(String(account.id))+'/balance',{
    headers:{authorization:'Bearer '+token},signal:AbortSignal.timeout(8000),
  });
  if(!b.ok)throw new Error('accounting_balance_lookup_failed');
  const data=(await b.json() as any)?.balance;
  return {balance:String(data?.balance??'0'),ledgerAccountId:Number(account.id)};
}

export function registerAccountRoutes(app:FastifyInstance,pool:Pool){
 app.get('/api/v1/accounts',{preHandler:requireAuth},async(request,reply)=>{
   const auth=(request as FastifyRequest&{auth:any}).auth;
   const customerId=await ensureCustomer(pool,auth);
   const r=await pool.query('SELECT id,account_type,currency,status,created_at FROM accounts WHERE customer_id=$1 ORDER BY created_at DESC',[customerId]);
   try{
     const accounts=await Promise.all(r.rows.map(async account=>({...account,...await ledgerBalance(Number(customerId),String(account.currency))})));
     return {accounts};
   }catch(error){
     request.log.error({error,customerId},'accounting balance lookup failed');
     return reply.code(503).send({error:'accounting_balance_unavailable'});
   }
 });
 app.post<{Body:CreateAccount}>('/api/v1/accounts',{preHandler:requireAuth},async(request,reply)=>{
   const auth=(request as FastifyRequest&{auth:any}).auth;const type=request.body?.accountType,currency=request.body?.currency?.trim().toUpperCase();
   if(!type||!currency||!/^[A-Z]{3}$/.test(currency))return reply.code(400).send({error:'invalid_account'});
   const customerId=await ensureCustomer(pool,auth);
   try{const r=await pool.query('INSERT INTO accounts(customer_id,account_type,currency) VALUES($1,$2,$3) RETURNING id,account_type,currency,status,created_at',[customerId,type,currency]);return reply.code(201).send({account:r.rows[0]});}
   catch(e:any){if(e?.code==='23505')return reply.code(409).send({error:'account_already_exists'});throw e;}
 });
 app.get<{Params:Params}>('/api/v1/accounts/:id/transactions',{preHandler:requireAuth},async(request,reply)=>{
   const auth=(request as FastifyRequest&{auth:any}).auth;const id=Number(request.params.id);
   if(!Number.isSafeInteger(id)||id<=0)return reply.code(400).send({error:'invalid_account_id'});
   const customerId=await ensureCustomer(pool,auth);
   const owner=await pool.query('SELECT id FROM accounts WHERE id=$1 AND customer_id=$2',[id,customerId]);
   if(!owner.rows[0])return reply.code(404).send({error:'account_not_found'});
   const r=await pool.query('SELECT id,transaction_type,amount,currency,status,reference,description,created_at FROM transactions WHERE account_id=$1 ORDER BY created_at DESC LIMIT 100',[id]);
   return {transactions:r.rows};
 });
}