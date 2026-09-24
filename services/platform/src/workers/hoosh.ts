import {Pool} from 'pg';
import {AiGateway} from '../services/ai-gateway.js';

const databaseUrl=process.env.DATABASE_URL;
if(!databaseUrl)throw new Error('DATABASE_URL must be configured');
const pool=new Pool({connectionString:databaseUrl,max:4,connectionTimeoutMillis:5000,idleTimeoutMillis:30000});
const gateway=new AiGateway(pool);
const intervalMs=Math.max(1000,Number(process.env.HOOSH_WORKER_INTERVAL_MS??1000));
const enabled=process.env.HOOSH_WORKER_ENABLED==='true';
const leaseSeconds=Math.max(30,Number(process.env.HOOSH_WORKER_LEASE_SECONDS??120));
const maxAttempts=Math.max(1,Number(process.env.HOOSH_WORKER_MAX_ATTEMPTS??5));

async function claim(){
 const c=await pool.connect();
 try{
  await c.query('BEGIN');
  await c.query(
    "UPDATE hoosh_requests SET status='queued',started_at=NULL,lease_until=NULL,error='worker_lease_expired' WHERE status='running' AND (lease_until IS NULL OR lease_until < NOW()) AND attempt_count < $1",
    [maxAttempts]
  );
  const q=await c.query<any>(
    "SELECT id,identity_id,conversation_id,request_text,requested_model,mode,attempt_count FROM hoosh_requests WHERE status='queued' AND attempt_count < $1 ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1",
    [maxAttempts]
  );
  if(!q.rows[0]){await c.query('ROLLBACK');return null;}
  const r=q.rows[0];
  await c.query(
    "UPDATE hoosh_requests SET status='running',started_at=NOW(),lease_until=NOW()+($2::text || ' seconds')::interval,attempt_count=attempt_count+1,error=NULL WHERE id=$1",
    [r.id,leaseSeconds]
  );
  await c.query('COMMIT');
  return {...r,attempt_count:Number(r.attempt_count)+1};
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{c.release();}
}

async function processOne(){
 const r=await claim();
 if(!r)return false;
 try{
  const history=await pool.query<any>(
    "SELECT role,content FROM hoosh_messages WHERE conversation_id=$1 ORDER BY created_at DESC,id DESC LIMIT 24",
    [r.conversation_id]
  );
  const ordered=history.rows.reverse();
  const context=ordered.map((m:any)=>`${m.role}: ${m.content}`).join('\n\n');
  const prompt=`An Hoosh mode: ${r.mode}. Answer in Persian by default unless the user asks for another language.\nConversation history:\n${context}\n\nLatest user request:\n${r.request_text}`;
  const result=await gateway.execute({
    workflowCode:'hoosh.chat',
    input:prompt,
    requesterIdentityId:r.identity_id,
    sourceType:'hoosh_request',
    sourceId:String(r.id),
    idempotencyKey:`hoosh-request:${r.id}`
  });
  const c=await pool.connect();
  try{
   await c.query('BEGIN');
   const exists=await c.query("SELECT 1 FROM hoosh_messages WHERE conversation_id=$1 AND metadata->>'requestId'=$2 AND role='assistant' LIMIT 1",[r.conversation_id,String(r.id)]);
   if(!exists.rows[0]){
     await c.query('INSERT INTO hoosh_messages(conversation_id,role,content,metadata) VALUES($1,\'assistant\',$2,$3)',[r.conversation_id,result.text,JSON.stringify({provider:result.provider,model:result.model,requestId:r.id,mode:r.mode})]);
     await c.query('INSERT INTO hoosh_usage(identity_id,conversation_id,provider,model,input_tokens,output_tokens,cost,status) VALUES($1,$2,$3,$4,$5,$6,$7,\'completed\')',[r.identity_id,r.conversation_id,result.provider,result.model,result.inputTokens,result.outputTokens,result.cost]);
   }
   await c.query("UPDATE hoosh_requests SET status='completed',provider=$1,model=$2,completed_at=NOW(),started_at=NULL,lease_until=NULL,error=NULL WHERE id=$3",[result.provider,result.model,r.id]);
   await c.query('UPDATE hoosh_conversations SET updated_at=NOW() WHERE id=$1',[r.conversation_id]);
   await c.query('COMMIT');
  }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{c.release();}
 }catch(e){
  const message=e instanceof Error?e.message:'AI_EXECUTION_FAILED';
  await pool.query(
    "UPDATE hoosh_requests SET status=CASE WHEN attempt_count >= $1 THEN 'failed' ELSE 'queued' END,error=$2,completed_at=CASE WHEN attempt_count >= $1 THEN NOW() ELSE NULL END,started_at=NULL,lease_until=NULL WHERE id=$3",
    [maxAttempts,message,r.id]
  );
 }
 return true;
}

if(!enabled)console.log('An Hoosh worker disabled; set HOOSH_WORKER_ENABLED=true to enable');
else{
 console.log(`An Hoosh worker started; interval=${intervalMs}ms lease=${leaseSeconds}s maxAttempts=${maxAttempts}`);
 const tick=async()=>{try{while(await processOne()){} }catch(e){console.error(e);}};
 await tick();
 const timer=setInterval(tick,intervalMs);
 const shutdown=async()=>{clearInterval(timer);await pool.end();process.exit(0);};
 process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
}
