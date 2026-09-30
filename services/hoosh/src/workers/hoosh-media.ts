import {Pool} from 'pg';
import {generateHooshMedia} from '../services/hoosh-media.js';

const databaseUrl=process.env.DATABASE_URL;
if(!databaseUrl)throw new Error('DATABASE_URL must be configured');
const pool=new Pool({connectionString:databaseUrl,max:2,connectionTimeoutMillis:5000,idleTimeoutMillis:30000});
const intervalMs=Math.max(1000,Number(process.env.HOOSH_MEDIA_WORKER_INTERVAL_MS??1000));
const enabled=process.env.HOOSH_MEDIA_WORKER_ENABLED==='true';
const leaseSeconds=Math.max(60,Number(process.env.HOOSH_MEDIA_WORKER_LEASE_SECONDS??1200));
const maxAttempts=Math.max(1,Number(process.env.HOOSH_MEDIA_WORKER_MAX_ATTEMPTS??3));

async function claim(){
 const c=await pool.connect();
 try{
  await c.query('BEGIN');
  await c.query("UPDATE hoosh_media_jobs SET status='queued',lease_until=NULL,error='worker_lease_expired',updated_at=NOW() WHERE status='running' AND (lease_until IS NULL OR lease_until < NOW()) AND attempt_count < $1",[maxAttempts]);
  const q=await c.query<any>("SELECT id,mode,provider,model,prompt,options,attempt_count FROM hoosh_media_jobs WHERE status='queued' AND attempt_count < $1 ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1",[maxAttempts]);
  if(!q.rows[0]){await c.query('ROLLBACK');return null;}
  const r=q.rows[0];
  await c.query("UPDATE hoosh_media_jobs SET status='running',attempt_count=attempt_count+1,lease_until=NOW()+($2::text || ' seconds')::interval,error=NULL,updated_at=NOW() WHERE id=$1",[r.id,leaseSeconds]);
  await c.query('COMMIT');
  return {...r,attempt_count:Number(r.attempt_count)+1};
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{c.release();}
}

async function processOne(){
 const r=await claim(); if(!r)return false;
 try{
  const result=await generateHooshMedia(pool,r.mode,r.model,r.prompt,r.options??{});
  await pool.query("UPDATE hoosh_media_jobs SET status='completed',mime_type=$1,file_name=$2,media_data=$3,text_output=$4,metadata=$5,lease_until=NULL,completed_at=NOW(),updated_at=NOW(),error=NULL WHERE id=$6",[result.mimeType,result.fileName,result.data,result.textOutput??null,JSON.stringify(result.metadata??{}),r.id]);
  const label=r.mode==='video'?'ویدیو':r.mode==='music'?'موسیقی':r.mode==='voice'?'صدا':'تصویر';
  const job=await pool.query<any>("SELECT conversation_id,identity_id FROM hoosh_media_jobs WHERE id=$1",[r.id]);
  if(job.rows[0]?.conversation_id){await pool.query("INSERT INTO hoosh_messages(conversation_id,role,content,metadata) VALUES($1,'assistant',$2,$3)",[job.rows[0].conversation_id,label+" آماده شد.",JSON.stringify({mediaJobId:r.id,mode:r.mode,provider:r.provider,model:r.model})]);await pool.query("UPDATE hoosh_conversations SET updated_at=NOW() WHERE id=$1",[job.rows[0].conversation_id]);}
 }catch(e){
  const message=e instanceof Error?e.message:'MEDIA_GENERATION_FAILED';
  await pool.query("UPDATE hoosh_media_jobs SET status=CASE WHEN attempt_count >= $1 THEN 'failed' ELSE 'queued' END,error=$2,lease_until=NULL,updated_at=NOW(),completed_at=CASE WHEN attempt_count >= $1 THEN NOW() ELSE NULL END WHERE id=$3",[maxAttempts,message,r.id]);
 }
 return true;
}

if(!enabled)console.log('An Hoosh media worker disabled; set HOOSH_MEDIA_WORKER_ENABLED=true to enable');
else{
 console.log(`An Hoosh media worker started; interval=${intervalMs}ms lease=${leaseSeconds}s maxAttempts=${maxAttempts}`);
 const tick=async()=>{try{while(await processOne()){} }catch(e){console.error(e);}};
 await tick();
 const timer=setInterval(tick,intervalMs);
 const shutdown=async()=>{clearInterval(timer);await pool.end();process.exit(0);};
 process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
}
