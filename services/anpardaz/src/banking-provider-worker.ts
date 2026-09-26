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
export class BankingProviderWorker{
  private timer:NodeJS.Timeout|undefined;private running=false;
  constructor(private readonly pool:Pool){}
  start(){if(this.timer)return;const ms=Math.max(1000,Number(process.env.BANKING_PROVIDER_WORKER_INTERVAL_MS??5000));void this.tick();this.timer=setInterval(()=>void this.tick(),ms);this.timer.unref();}
  stop(){if(this.timer)clearInterval(this.timer);this.timer=undefined;}
  private async tick(){if(this.running)return;this.running=true;try{for(let i=0;i<10;i++){if(!(await this.processOne()))break;}}catch(e){console.error('banking provider worker failed',e);}finally{this.running=false;}}
  private async processOne(){
    const client=await this.pool.connect();let row:any;
    try{await client.query('BEGIN');row=(await client.query("SELECT id,operation_id,operation_type,attempts FROM banking_provider_outbox WHERE (status='pending' OR (status='processing' AND updated_at < NOW()-INTERVAL '30 seconds')) AND next_attempt_at<=NOW() AND attempts<20 ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1")).rows[0];if(!row){await client.query('ROLLBACK');return false;}await client.query("UPDATE banking_provider_outbox SET status='processing',attempts=attempts+1,updated_at=NOW() WHERE id=$1",[row.id]);await client.query('COMMIT');}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
    try{
      if(row.operation_type==='card_balance'){await this.pool.query("UPDATE banking_provider_outbox SET status='manual_review',last_error='card_balance_retry_requires_sensitive_card_input',updated_at=NOW() WHERE id=$1",[row.id]);await this.pool.query("UPDATE card_balance_checks SET status='manual_review',error_code='RETRY_REQUIRES_CARD_INPUT',error_message='Automatic retry is disabled because sensitive card data is not persisted.' WHERE operation_id=$1 AND status IN ('pending','processing')",[row.operation_id]);return true;}
      const provider=new FintechProvider();
      if(row.operation_type==='transfer'){
        const x=(await this.pool.query('SELECT * FROM transfer_requests WHERE operation_id=$1',[row.operation_id])).rows[0];if(!x){await this.fail(row.id,'transfer_not_found');return true;}
        if(['completed','failed','cancelled'].includes(x.status)){await this.pool.query("UPDATE banking_provider_outbox SET status=$2,updated_at=NOW() WHERE id=$1",[row.id,x.status==='completed'?'completed':'failed']);return true;}
        const result=await provider.execute({serviceCode:'transfer',operationId:x.operation_id,payload:{amount:String(x.amount),currency:x.currency,destinationAccountId:x.destination_account_id?String(x.destination_account_id):undefined,destinationExternal:x.destination_external??undefined,description:x.description??undefined,sourceAccountId:String(x.source_account_id)}});
        const status=result.status==='completed'?'completed':result.status==='failed'?'failed':result.status==='manual_review'?'manual_review':'processing';
        await this.pool.query("UPDATE transfer_requests SET status=$1,provider_operation_id=COALESCE($2,provider_operation_id),provider_reference=COALESCE($3,provider_reference),provider_status=$4,provider_error_code=$5,provider_error_message=$6,provider_metadata=$7,updated_at=NOW() WHERE operation_id=$8",[status,result.providerOperationId??null,result.externalReference??null,result.status,result.errorCode??null,result.errorMessage??null,JSON.stringify(result.data??{}),x.operation_id]);
        if(status==='completed'){await postLedger('anpardaz_transfer',String(x.id),x.operation_id,Number(x.customer_id),String(x.provider_code??'FINTECH'),String(x.currency),String(x.amount),'debit');await this.pool.query("UPDATE banking_provider_outbox SET status='completed',last_error=NULL,updated_at=NOW() WHERE id=$1",[row.id]);}
        else if(status==='failed'||status==='manual_review')await this.pool.query("UPDATE banking_provider_outbox SET status=$2,last_error=$3,updated_at=NOW() WHERE id=$1",[row.id,status,result.errorMessage??result.errorCode??null]);
        else await this.pool.query("UPDATE banking_provider_outbox SET status='processing',next_attempt_at=NOW()+INTERVAL '30 seconds',last_error=$2,updated_at=NOW() WHERE id=$1",[row.id,result.errorMessage??null]);
        return true;
      }
      if(row.operation_type==='topup'){
        const x=(await this.pool.query('SELECT * FROM topup_requests WHERE operation_id=$1',[row.operation_id])).rows[0];if(!x){await this.fail(row.id,'topup_not_found');return true;}
        const result=await provider.execute({serviceCode:'transfer',operationId:x.operation_id,payload:{amount:String(x.amount),currency:x.currency,sourceAccountId:String(x.account_id),description:'An Pardaz topup'}});
        const status=result.status==='completed'?'completed':result.status==='failed'?'failed':result.status==='manual_review'?'manual_review':'processing';
        await this.pool.query("UPDATE topup_requests SET provider_operation_id=COALESCE($1,provider_operation_id),provider_reference=COALESCE($2,provider_reference),provider_status=$3,provider_error_code=$4,provider_error_message=$5,provider_metadata=$6 WHERE operation_id=$7",[result.providerOperationId??null,result.externalReference??null,result.status,result.errorCode??null,result.errorMessage??null,JSON.stringify(result.data??{}),x.operation_id]);
        if(status==='completed'){await postLedger('anpardaz_topup',String(x.id),x.operation_id,Number(x.customer_id),String(x.provider??'FINTECH'),String(x.currency),String(x.amount),'credit');await this.pool.query("UPDATE banking_provider_outbox SET status='completed',updated_at=NOW() WHERE id=$1",[row.id]);}
        else if(status==='failed'||status==='manual_review')await this.pool.query("UPDATE banking_provider_outbox SET status=$2,last_error=$3,updated_at=NOW() WHERE id=$1",[row.id,status,result.errorMessage??result.errorCode??null]);
        else await this.pool.query("UPDATE banking_provider_outbox SET status='processing',next_attempt_at=NOW()+INTERVAL '30 seconds',last_error=$2,updated_at=NOW() WHERE id=$1",[row.id,result.errorMessage??null]);
        return true;
      }
      return false;
    }catch(e){const message=e instanceof Error?e.message:'provider_worker_error';await this.pool.query("UPDATE banking_provider_outbox SET status=CASE WHEN attempts>=20 THEN 'manual_review' ELSE 'processing' END,next_attempt_at=NOW()+INTERVAL '30 seconds',last_error=$2,updated_at=NOW() WHERE id=$1",[row.id,message]).catch(()=>{});return true;}
  }
  private async fail(id:number,message:string){await this.pool.query("UPDATE banking_provider_outbox SET status='manual_review',last_error=$2,updated_at=NOW() WHERE id=$1",[id,message]);}
}
