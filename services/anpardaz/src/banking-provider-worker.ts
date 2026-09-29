import type { Pool } from 'pg';
import { FintechProvider } from './fintech-provider.js';

async function account(base:string,token:string,code:string,name:string,type:'asset'|'liability',currency:string){
  const h={authorization:'Bearer '+token};
  let r=await fetch(base+'/internal/v1/ledger/accounts/by-code/'+encodeURIComponent(code),{headers:h,signal:AbortSignal.timeout(8000)});
  if(r.ok)return Number((await r.json() as any).account.id);
  if(r.status!==404)throw new Error('account_lookup_failed');
  r=await fetch(base+'/internal/v1/ledger/accounts',{method:'POST',headers:{...h,'content-type':'application/json'},body:JSON.stringify({accountCode:code,accountName:name,accountType:type,currency}),signal:AbortSignal.timeout(8000)});
  if(r.ok)return Number((await r.json() as any).account.id);
  if(r.status===409){r=await fetch(base+'/internal/v1/ledger/accounts/by-code/'+encodeURIComponent(code),{headers:h,signal:AbortSignal.timeout(8000)});if(r.ok)return Number((await r.json() as any).account.id);}
  throw new Error('account_create_failed');
}
async function postLedger(referenceType:string,referenceId:string,operationId:string,customerId:number,providerCode:string,currency:string,amount:string,direction:'debit'|'credit'){
  const base=(process.env.ACCOUNTING_SERVICE_URL??'').replace(/\/$/,'');const token=process.env.ACCOUNTING_INTERNAL_TOKEN;
  if(!base||!token)throw new Error('accounting_service_not_configured');
  const p=await account(base,token,'anpardaz.provider.'+providerCode+'.asset.'+currency,'An Pardaz provider '+providerCode+' '+currency,'asset',currency);
  const c=await account(base,token,'anpardaz.customer.'+customerId+'.liability.'+currency,'An Pardaz customer '+customerId+' '+currency,'liability',currency);
  const entries=direction==='credit'?[{accountId:p,direction:'debit',amount,currency},{accountId:c,direction:'credit',amount,currency}]:[{accountId:c,direction:'debit',amount,currency},{accountId:p,direction:'credit',amount,currency}];
  const r=await fetch(base+'/internal/v1/ledger/transactions',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({referenceType,referenceId,operationId,idempotencyKey:'anpardaz:'+referenceType+':'+referenceId,description:'An Pardaz banking operation '+referenceId,entries}),signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw new Error('accounting_post_failed');
}
function decimal18(v:string){const x=String(v).trim();if(!/^\d+(?:\.\d+)?$/.test(x))throw new Error('invalid_ledger_decimal');const [a,b='']=x.split('.');return BigInt(a)*1000000000000000000n+BigInt((b+'000000000000000000').slice(0,18));}
async function ledgerCustomerBalance(customerId:number,currency:string){
  const base=(process.env.ACCOUNTING_SERVICE_URL??'').replace(/\/$/,'');const token=process.env.ACCOUNTING_INTERNAL_TOKEN;
  if(!base||!token)throw new Error('accounting_service_not_configured');
  const code='anpardaz.customer.'+customerId+'.liability.'+currency;
  const r=await fetch(base+'/internal/v1/ledger/accounts/by-code/'+encodeURIComponent(code),{headers:{authorization:'Bearer '+token},signal:AbortSignal.timeout(8000)});
  if(r.status===404)return '0';
  if(!r.ok)throw new Error('accounting_balance_lookup_failed');
  const id=Number((await r.json() as any)?.account?.id);if(!Number.isSafeInteger(id))throw new Error('accounting_account_invalid');
  const b=await fetch(base+'/internal/v1/ledger/accounts/'+id+'/balance',{headers:{authorization:'Bearer '+token},signal:AbortSignal.timeout(8000)});
  if(!b.ok)throw new Error('accounting_balance_lookup_failed');
  return String((await b.json() as any)?.balance?.balance??'0');
}
async function postInternalTransferLedger(referenceId:string,operationId:string,sourceCustomerId:number,destinationCustomerId:number,currency:string,amount:string){
  const base=(process.env.ACCOUNTING_SERVICE_URL??'').replace(/\/$/,'');const token=process.env.ACCOUNTING_INTERNAL_TOKEN;
  if(!base||!token)throw new Error('accounting_service_not_configured');
  const source=await account(base,token,'anpardaz.customer.'+sourceCustomerId+'.liability.'+currency,'An Pardaz customer '+sourceCustomerId+' '+currency,'liability',currency);
  const destination=await account(base,token,'anpardaz.customer.'+destinationCustomerId+'.liability.'+currency,'An Pardaz customer '+destinationCustomerId+' '+currency,'liability',currency);
  const r=await fetch(base+'/internal/v1/ledger/transactions',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({referenceType:'anpardaz_internal_transfer',referenceId,operationId,idempotencyKey:'anpardaz:anpardaz_internal_transfer:'+referenceId,description:'An Pardaz internal account transfer '+referenceId,entries:[{accountId:source,direction:'debit',amount,currency},{accountId:destination,direction:'credit',amount,currency}]}),signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw new Error('accounting_post_failed');
}

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
async function accountingHold(customerId:number,operationId:string,amount:string,currency:string){
  const base=(process.env.ACCOUNTING_SERVICE_URL??'').replace(/\/$/,'');const token=process.env.ACCOUNTING_INTERNAL_TOKEN;if(!base||!token)throw new Error('accounting_service_not_configured');
  const account=await ledgerAccount(base,token,'anpardaz.customer.'+customerId+'.liability.'+currency,'An Pardaz customer '+customerId+' '+currency,'liability',currency);
  const rr=await fetch(base+'/internal/v1/ledger/holds',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({accountId:account,referenceType:'anpardaz_transfer',referenceId:operationId,amount,currency}),signal:AbortSignal.timeout(10000)});
  const data=await rr.json().catch(()=>({}));if(!rr.ok)throw new Error(String(data?.error??'accounting_hold_failed'));
}
async function accountingHoldAction(operationId:string,action:'capture'|'release'){
  const base=(process.env.ACCOUNTING_SERVICE_URL??'').replace(/\/$/,'');const token=process.env.ACCOUNTING_INTERNAL_TOKEN;if(!base||!token)throw new Error('accounting_service_not_configured');
  const q=await fetch(base+'/internal/v1/ledger/holds/by-reference?referenceType=anpardaz_transfer&referenceId='+encodeURIComponent(operationId),{headers:{authorization:'Bearer '+token},signal:AbortSignal.timeout(8000)});
  if(q.status===404)return false;if(!q.ok)throw new Error('accounting_hold_lookup_failed');
  const data=await q.json() as any;const id=Number(data?.hold?.id);if(!Number.isSafeInteger(id))throw new Error('accounting_hold_invalid');if(String(data?.hold?.status)!=='active')return true;
  const rr=await fetch(base+'/internal/v1/ledger/holds/'+id+'/'+action,{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:'{}',signal:AbortSignal.timeout(8000)});
  if(!rr.ok)throw new Error('accounting_hold_'+action+'_failed');return true;
}

export class BankingProviderWorker{
  private timer:NodeJS.Timeout|undefined;private running=false;
  constructor(private readonly pool:Pool){}
  start(){if(this.timer)return;const ms=Math.max(1000,Number(process.env.BANKING_PROVIDER_WORKER_INTERVAL_MS??5000));void this.tick();this.timer=setInterval(()=>void this.tick(),ms);this.timer.unref();}
  stop(){if(this.timer)clearInterval(this.timer);this.timer=undefined;}
  private async tick(){if(this.running)return;this.running=true;try{for(let i=0;i<10;i++){if(!(await this.processOne()))break;}}catch(e){console.error('banking provider worker failed',e);}finally{this.running=false;}}
  private async processOne(){
    const client=await this.pool.connect();let row:any;
    try{await client.query('BEGIN');row=(await client.query("SELECT id,operation_id,operation_type,attempts FROM banking_provider_outbox WHERE (status='pending' OR (status='processing' AND operation_type<>'card_balance' AND updated_at < NOW()-INTERVAL '120 seconds')) AND next_attempt_at<=NOW() AND attempts<20 ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1")).rows[0];if(!row){await client.query('ROLLBACK');return false;}await client.query("UPDATE banking_provider_outbox SET status='processing',attempts=attempts+1,updated_at=NOW() WHERE id=$1",[row.id]);await client.query('COMMIT');}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
    try{
      if(row.operation_type==='card_balance'){await this.pool.query("UPDATE banking_provider_outbox SET status='manual_review',last_error='card_balance_retry_requires_sensitive_card_input',updated_at=NOW() WHERE id=$1",[row.id]);await this.pool.query("UPDATE card_balance_checks SET status='manual_review',error_code='RETRY_REQUIRES_CARD_INPUT',error_message='Automatic retry is disabled because sensitive card data is not persisted.' WHERE operation_id=$1 AND status IN ('pending','processing')",[row.operation_id]);return true;}
      const provider=new FintechProvider();
      if(row.operation_type==='transfer'){
        let x=(await this.pool.query('SELECT * FROM transfer_requests WHERE operation_id=$1',[row.operation_id])).rows[0];if(!x){await this.fail(row.id,'transfer_not_found');return true;}
        if(['completed','failed','cancelled'].includes(x.status)){await this.pool.query("UPDATE banking_provider_outbox SET status=$2,updated_at=NOW() WHERE id=$1",[row.id,x.status==='completed'?'completed':'failed']);return true;}
        const claimed=(await this.pool.query("UPDATE transfer_requests SET status='processing',updated_at=NOW() WHERE operation_id=$1 AND status='pending' RETURNING *",[row.operation_id])).rows[0];
        if(claimed)x=claimed;
        else{
          x=(await this.pool.query('SELECT * FROM transfer_requests WHERE operation_id=$1',[row.operation_id])).rows[0];
          if(!x){await this.fail(row.id,'transfer_not_found');return true;}
          if(['completed','failed','cancelled','manual_review'].includes(x.status)){
            await this.pool.query("UPDATE banking_provider_outbox SET status=$2,updated_at=NOW() WHERE id=$1",[row.id,x.status==='completed'?'completed':x.status==='cancelled'?'failed':x.status]);return true;
          }
          throw new Error('transfer_state_changed');
        }
        if(x.destination_account_id){
          const destination=(await this.pool.query('SELECT id,customer_id,currency,status FROM accounts WHERE id=$1',[x.destination_account_id])).rows[0];
          if(!destination||destination.status!=='active'||destination.currency!==x.currency){await this.fail(row.id,'invalid_internal_destination');return true;}
          const providerStatus='completed';
          const sourceBalance=await ledgerCustomerBalance(Number(x.customer_id),String(x.currency));
          if(decimal18(sourceBalance)<decimal18(String(x.amount))){
            await this.pool.query("UPDATE transfer_requests SET status='failed',provider_status='failed',provider_error_code='INSUFFICIENT_FUNDS',provider_error_message='insufficient_ledger_balance',updated_at=NOW() WHERE operation_id=$1",[x.operation_id]);
            await this.pool.query("UPDATE banking_provider_outbox SET status='failed',last_error='insufficient_ledger_balance',updated_at=NOW() WHERE id=$1",[row.id]);
            return true;
          }
          await postInternalTransferLedger(String(x.id),x.operation_id,Number(x.customer_id),Number(destination.customer_id),String(x.currency),String(x.amount));
          await this.pool.query("UPDATE transfer_requests SET status='completed',provider_status=$1,provider_metadata=$2,updated_at=NOW() WHERE operation_id=$3",[providerStatus,JSON.stringify({mode:'internal_ledger',destinationAccountId:destination.id}),x.operation_id]);
          await this.pool.query("UPDATE banking_provider_outbox SET status='completed',last_error=NULL,updated_at=NOW() WHERE id=$1",[row.id]);
          return true;
        }
        // Provider completion is a terminal external side effect. If Accounting failed after the provider
        // already completed, retries must reconcile the ledger only and MUST NOT execute the provider again.
        if(String(x.provider_status).toLowerCase()==='completed'){
          await postLedger('anpardaz_transfer',String(x.id),x.operation_id,Number(x.customer_id),String(x.provider_code??'FINTECH'),String(x.currency),String(x.amount),'debit');
          try{
            await accountingHoldAction(x.operation_id,'capture');
          }catch(e){
            await this.pool.query("UPDATE banking_provider_outbox SET status='processing',next_attempt_at=NOW()+INTERVAL '30 seconds',last_error=$2,updated_at=NOW() WHERE id=$1",[row.id,e instanceof Error?e.message:'accounting_hold_capture_failed']);
            return true;
          }
          await this.pool.query("UPDATE transfer_requests SET status='completed',updated_at=NOW() WHERE operation_id=$1",[x.operation_id]);
          await this.pool.query("UPDATE banking_provider_outbox SET status='completed',last_error=NULL,updated_at=NOW() WHERE id=$1",[row.id]);
          return true;
        }
        if(String(x.provider_status).toLowerCase()==='processing' && x.provider_operation_id){
          await this.pool.query("UPDATE transfer_requests SET status='manual_review',updated_at=NOW() WHERE operation_id=$1 AND status='processing'",[x.operation_id]);
          await this.pool.query("UPDATE banking_provider_outbox SET status='manual_review',last_error='provider_operation_requires_reconciliation_without_safe_status_poll',updated_at=NOW() WHERE id=$1",[row.id]);
          return true;
        }
        await accountingHold(Number(x.customer_id),x.operation_id,String(x.amount),String(x.currency));
        const result=await provider.execute({serviceCode:'transfer',operationId:x.operation_id,payload:{amount:String(x.amount),currency:x.currency,destinationExternal:x.destination_external??undefined,description:x.description??undefined,sourceAccountId:String(x.source_account_id)}});
        const status=result.status==='completed'?'completed':result.status==='failed'?'failed':result.status==='manual_review'?'manual_review':'processing';
        await this.pool.query("UPDATE transfer_requests SET status=$1,provider_operation_id=COALESCE($2,provider_operation_id),provider_reference=COALESCE($3,provider_reference),provider_status=$4,provider_error_code=$5,provider_error_message=$6,provider_metadata=$7,updated_at=NOW() WHERE operation_id=$8",[status==='completed'?'processing':status,result.providerOperationId??null,result.externalReference??null,result.status,result.errorCode??null,result.errorMessage??null,JSON.stringify(result.data??{}),x.operation_id]);
        if(status==='completed'){
          await postLedger('anpardaz_transfer',String(x.id),x.operation_id,Number(x.customer_id),String(x.provider_code??'FINTECH'),String(x.currency),String(x.amount),'debit');
          await accountingHoldAction(x.operation_id,'capture');
          await this.pool.query("UPDATE transfer_requests SET status='completed',updated_at=NOW() WHERE operation_id=$1",[x.operation_id]);
          await this.pool.query("UPDATE banking_provider_outbox SET status='completed',last_error=NULL,updated_at=NOW() WHERE id=$1",[row.id]);
        }else if(status==='failed'){
          await accountingHoldAction(x.operation_id,'release');
          await this.pool.query("UPDATE banking_provider_outbox SET status='failed',last_error=$2,updated_at=NOW() WHERE id=$1",[row.id,result.errorMessage??result.errorCode??null]);
        }else if(status==='manual_review'){
          await this.pool.query("UPDATE banking_provider_outbox SET status='manual_review',last_error=$2,updated_at=NOW() WHERE id=$1",[row.id,result.errorMessage??result.errorCode??null]);
        }else {
          await this.pool.query("UPDATE transfer_requests SET status='manual_review',provider_status='manual_review',provider_error_code='PROVIDER_OPERATION_UNCERTAIN',provider_error_message=$1,updated_at=NOW() WHERE operation_id=$2",[result.errorMessage??'Provider returned a non-terminal result without a reconciliation reference',x.operation_id]);
          await this.pool.query("UPDATE banking_provider_outbox SET status='manual_review',last_error=$2,updated_at=NOW() WHERE id=$1",[row.id,result.errorMessage??'provider_operation_uncertain']);
        }
        return true;
      }
      if(row.operation_type==='topup'){
        const x=(await this.pool.query('SELECT * FROM topup_requests WHERE operation_id=$1',[row.operation_id])).rows[0];if(!x){await this.fail(row.id,'topup_not_found');return true;}
        // Same rule for topups: a completed provider side effect must only be reconciled,
        // never executed again because Accounting or the local finalization may have failed.
        if(String(x.provider_status).toLowerCase()==='completed'){
          await postLedger('anpardaz_topup',String(x.id),x.operation_id,Number(x.customer_id),String(x.provider??'FINTECH'),String(x.currency),String(x.amount),'credit');
          await this.pool.query("UPDATE topup_requests SET status='completed',updated_at=NOW() WHERE operation_id=$1",[x.operation_id]);
          await this.pool.query("UPDATE banking_provider_outbox SET status='completed',updated_at=NOW() WHERE id=$1",[row.id]);
          return true;
        }
        const result=await provider.execute({serviceCode:'transfer',operationId:x.operation_id,payload:{amount:String(x.amount),currency:x.currency,sourceAccountId:String(x.account_id),description:'An Pardaz topup'}});
        const status=result.status==='completed'?'completed':result.status==='failed'?'failed':result.status==='manual_review'?'manual_review':'processing';
        await this.pool.query("UPDATE topup_requests SET provider_operation_id=COALESCE($1,provider_operation_id),provider_reference=COALESCE($2,provider_reference),provider_status=$3,provider_error_code=$4,provider_error_message=$5,provider_metadata=$6,status=$7 WHERE operation_id=$8",[result.providerOperationId??null,result.externalReference??null,result.status,result.errorCode??null,result.errorMessage??null,JSON.stringify(result.data??{}),status==='completed'?'processing':status,x.operation_id]);
        if(status==='completed'){
          await postLedger('anpardaz_topup',String(x.id),x.operation_id,Number(x.customer_id),String(x.provider??'FINTECH'),String(x.currency),String(x.amount),'credit');
          await this.pool.query("UPDATE topup_requests SET status='completed',updated_at=NOW() WHERE operation_id=$1",[x.operation_id]);
          await this.pool.query("UPDATE banking_provider_outbox SET status='completed',updated_at=NOW() WHERE id=$1",[row.id]);
        }else if(status==='failed'||status==='manual_review')await this.pool.query("UPDATE banking_provider_outbox SET status=$2,last_error=$3,updated_at=NOW() WHERE id=$1",[row.id,status,result.errorMessage??result.errorCode??null]);
        else await this.pool.query("UPDATE banking_provider_outbox SET status='processing',next_attempt_at=NOW()+INTERVAL '30 seconds',last_error=$2,updated_at=NOW() WHERE id=$1",[row.id,result.errorMessage??null]);
        return true;
      }
      return false;
    }catch(e){const message=e instanceof Error?e.message:'provider_worker_error';await this.pool.query("UPDATE banking_provider_outbox SET status=CASE WHEN attempts>=20 THEN 'manual_review' ELSE 'processing' END,next_attempt_at=NOW()+INTERVAL '30 seconds',last_error=$2,updated_at=NOW() WHERE id=$1",[row.id,message]).catch(()=>{});return true;}
  }
  private async fail(id:number,message:string){await this.pool.query("UPDATE banking_provider_outbox SET status='manual_review',last_error=$2,updated_at=NOW() WHERE id=$1",[id,message]);}
}
