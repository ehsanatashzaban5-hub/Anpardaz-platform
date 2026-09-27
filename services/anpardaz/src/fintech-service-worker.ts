import type { Pool } from 'pg';
import {createDecipheriv} from 'node:crypto';
import { FintechProvider } from './fintech-provider.js';

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
async function postAccounting(customerId:string,operationId:string,amount:string,currency:string){
  const base=(process.env.ACCOUNTING_SERVICE_URL??'').replace(/\/$/,'');
  const token=process.env.ACCOUNTING_INTERNAL_TOKEN;
  if(!base||!token)throw new Error('accounting_service_not_configured');
  const provider=await ledgerAccount(base,token,'anpardaz.provider.FINTECH.asset.'+currency,'An Pardaz fintech provider '+currency,'asset',currency);
  const customer=await ledgerAccount(base,token,'anpardaz.customer.'+customerId+'.liability.'+currency,'An Pardaz customer '+customerId+' '+currency,'liability',currency);
  const r=await fetch(base+'/internal/v1/ledger/transactions',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({referenceType:'anpardaz_service',referenceId:operationId,operationId,idempotencyKey:'anpardaz:service:'+operationId,description:'An Pardaz fintech service settlement',entries:[{accountId:customer,direction:'debit',amount,currency},{accountId:provider,direction:'credit',amount,currency}]}),signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw new Error('accounting_post_failed');
}
function payloadEncryptionKey(){
  const raw=process.env.FINTECH_PAYLOAD_ENCRYPTION_KEY_B64?.trim();
  if(!raw)throw new Error('FINTECH_PAYLOAD_ENCRYPTION_KEY_B64_not_configured');
  const key=Buffer.from(raw,'base64');
  if(key.length!==32)throw new Error('FINTECH_PAYLOAD_ENCRYPTION_KEY_B64_must_be_32_bytes_base64');
  return key;
}
function decryptProviderPayload(value:string):Record<string,unknown>{
  const [ivB64,tagB64,dataB64]=value.split('.');
  if(!ivB64||!tagB64||!dataB64)throw new Error('invalid_provider_payload_ciphertext');
  const decipher=createDecipheriv('aes-256-gcm',payloadEncryptionKey(),Buffer.from(ivB64,'base64'));
  decipher.setAuthTag(Buffer.from(tagB64,'base64'));
  const raw=Buffer.concat([decipher.update(Buffer.from(dataB64,'base64')),decipher.final()]).toString('utf8');
  const parsed=JSON.parse(raw);
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('invalid_provider_payload');
  return parsed as Record<string,unknown>;
}
export class FintechServiceWorker{
  private timer:NodeJS.Timeout|undefined; private running=false;
  constructor(private readonly pool:Pool){}
  start(){if(this.timer)return;const ms=Math.max(1000,Number(process.env.FINTECH_SERVICE_WORKER_INTERVAL_MS??5000));void this.tick();this.timer=setInterval(()=>void this.tick(),ms);this.timer.unref();}
  stop(){if(this.timer)clearInterval(this.timer);this.timer=undefined;}
  private async tick(){if(this.running)return;this.running=true;try{for(let i=0;i<10;i++){if(!(await this.processOne()))break;}}catch(e){console.error('fintech service worker failed',e);}finally{this.running=false;}}
  private async processOne(){
    const client=await this.pool.connect();let row:any;
    try{
      await client.query('BEGIN');
      row=(await client.query("SELECT id,operation_id,attempts FROM fintech_provider_outbox WHERE (status='pending' OR (status='processing' AND updated_at < NOW()-INTERVAL '120 seconds')) AND next_attempt_at<=NOW() AND attempts<20 ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1")).rows[0];
      if(!row){await client.query('ROLLBACK');return false;}
      const op=(await client.query('SELECT status FROM fintech_service_operations WHERE operation_id=$1 FOR UPDATE',[row.operation_id])).rows[0];
      if(!op){await client.query("UPDATE fintech_provider_outbox SET status='manual_review',last_error='operation_not_found',updated_at=NOW() WHERE id=$1",[row.id]);await client.query('COMMIT');return true;}
      if(['completed','failed','manual_review','reversed'].includes(op.status)){await client.query("UPDATE fintech_provider_outbox SET status=CASE WHEN $2='completed' THEN 'completed' ELSE 'failed' END,updated_at=NOW() WHERE id=$1",[row.id,op.status]);await client.query('COMMIT');return true;}
      await client.query("UPDATE fintech_provider_outbox SET status='processing',attempts=attempts+1,updated_at=NOW() WHERE id=$1",[row.id]);
      await client.query("UPDATE fintech_service_operations SET status='processing',updated_at=NOW() WHERE operation_id=$1 AND status='pending'",[row.operation_id]);
      await client.query('COMMIT');
    }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
    try{
      const op=(await this.pool.query('SELECT * FROM fintech_service_operations WHERE operation_id=$1',[row.operation_id])).rows[0];
      if(!op){await this.fail(row.id,'operation_not_found');return true;}
      const provider=new FintechProvider();
      if(!op.provider_payload_enc){
        await this.pool.query("UPDATE fintech_service_operations SET status='manual_review',accounting_status='failed',failure_code='LEGACY_PAYLOAD_REQUIRES_REVIEW',failure_message='Provider payload was created before encrypted payload storage was enabled',updated_at=NOW() WHERE operation_id=$1",[op.operation_id]);
        await this.pool.query("UPDATE fintech_provider_outbox SET status='manual_review',last_error='LEGACY_PAYLOAD_REQUIRES_REVIEW',updated_at=NOW() WHERE id=$1",[row.id]);
        return true;
      }
      const payload=decryptProviderPayload(String(op.provider_payload_enc));
      const result=await provider.execute({serviceCode:op.service_code,operationId:op.operation_id,payload});
      let status=result.status;
      let accountingStatus=op.accounting_status;
      if(status==='completed'){
        const raw=(result.data as any)?.amount??(result.data as any)?.amountPaid??payload.amount;
        const amount=typeof raw==='number'?String(raw):typeof raw==='string'&&/^(?:0|[1-9]\d{0,15})(?:\.\d{1,8})?$/.test(raw)?raw:null;
        if(!amount||amount==='0'){status='manual_review';accountingStatus='failed';}
        else{try{await postAccounting(String(op.customer_id),op.operation_id,amount,'IRR');accountingStatus='posted';}catch{status='manual_review';accountingStatus='failed';}}
      }else if(status==='failed'||status==='manual_review')accountingStatus='failed';
      else accountingStatus='pending';
      await this.pool.query(`UPDATE fintech_service_operations SET status=$1,provider_operation_id=COALESCE($2,provider_operation_id),external_reference=COALESCE($3,external_reference),failure_code=$4,failure_message=$5,response_metadata=$6,accounting_status=$7,updated_at=NOW(),completed_at=CASE WHEN $1='completed' THEN NOW() ELSE completed_at END WHERE operation_id=$8`,
        [status,result.providerOperationId??null,result.externalReference??null,result.errorCode??null,status==='manual_review'&&accountingStatus==='failed'?'ACCOUNTING_REQUIRED':result.errorMessage??null,JSON.stringify(result.data??{}),accountingStatus,op.operation_id]);
      if(status==='completed')await this.pool.query("UPDATE fintech_provider_outbox SET status='completed',last_error=NULL,updated_at=NOW() WHERE id=$1",[row.id]);
      else if(status==='failed'||status==='manual_review')await this.pool.query("UPDATE fintech_provider_outbox SET status=$2,last_error=$3,updated_at=NOW() WHERE id=$1",[row.id,status,result.errorMessage??result.errorCode??null]);
      else await this.pool.query("UPDATE fintech_provider_outbox SET status='processing',next_attempt_at=NOW()+INTERVAL '30 seconds',last_error=$2,updated_at=NOW() WHERE id=$1",[row.id,result.errorMessage??null]);
      return true;
    }catch(e){const message=e instanceof Error?e.message:'fintech_worker_error';await this.pool.query("UPDATE fintech_provider_outbox SET status=CASE WHEN attempts>=20 THEN 'manual_review' ELSE 'processing' END,next_attempt_at=NOW()+INTERVAL '30 seconds',last_error=$2,updated_at=NOW() WHERE id=$1",[row.id,message]).catch(()=>{});return true;}
  }
  private async fail(id:number,message:string){await this.pool.query("UPDATE fintech_provider_outbox SET status='manual_review',last_error=$2,updated_at=NOW() WHERE id=$1",[id,message]);}
}
