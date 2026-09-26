import type {FastifyInstance,FastifyRequest} from 'fastify';
import type {Pool} from 'pg';
import multipart from '@fastify/multipart';
import {requireAuth,type AuthClaims} from '../auth.js';

type R=FastifyRequest&{auth:AuthClaims};
const permitted=async(pool:Pool,id:string,p:string)=>Boolean((await pool.query(`SELECT EXISTS(SELECT 1 FROM admin_permissions ap JOIN platform_users u ON u.role=ap.role WHERE u.identity_id=$1 AND (ap.permission='*' OR ap.permission=$2)) ok`,[id,p])).rows[0]?.ok);
const admin=async(pool:Pool,req:FastifyRequest,reply:any,p:string)=>{const a=(req as R).auth;if(!a||!(await permitted(pool,a.sub,p))){await reply.code(403).send({error:'forbidden'});return null;}return a;};

export async function registerContentManagementRoutes(app:FastifyInstance,pool:Pool){
  await app.register(multipart,{limits:{fileSize:Number(process.env.CONTENT_VIDEO_MAX_BYTES??268435456),files:1}});
  app.get('/api/v1/content/videos',async(req,reply)=>{
    const q=req.query as any;const limit=Math.min(50,Math.max(1,Number(q.limit)||20));
    const rows=await pool.query(`SELECT id,title,description,mime_type,file_name,byte_size,duration_seconds,category_slug,hashtags,published_at,created_at
      FROM content_videos WHERE status='published' ORDER BY published_at DESC NULLS LAST LIMIT $1`,[limit]);
    return {videos:rows.rows};
  });
  app.get('/api/v1/content/videos/:id',async(req,reply)=>{
    const id=Number((req.params as any).id);if(!Number.isSafeInteger(id)||id<=0)return reply.code(400).send({error:'invalid_video_id'});
    const row=(await pool.query('SELECT * FROM content_videos WHERE id=$1 AND status=\'published\'',[id])).rows[0];if(!row)return reply.code(404).send({error:'video_not_found'});
    reply.header('Content-Type',row.mime_type);reply.header('Content-Disposition',`inline; filename*=UTF-8''${encodeURIComponent(row.file_name)}`);reply.header('Cache-Control','public,max-age=3600');return reply.send(row.bytes);
  });
  app.get('/api/v1/admin/content/policies',{preHandler:requireAuth},async(req,reply)=>{const a=await admin(pool,req,reply,'content.write');if(!a)return;return{policies:(await pool.query('SELECT * FROM content_publication_policies ORDER BY category_slug')).rows};});
  app.put('/api/v1/admin/content/policies/:category',{preHandler:requireAuth},async(req,reply)=>{
    const a=await admin(pool,req,reply,'content.write');if(!a)return;
    const category=String((req.params as any).category??'').trim();const b=(req.body??{}) as any;
    if(!category||!Number.isInteger(Number(b.dailyLimit))||Number(b.dailyLimit)<0||Number(b.dailyLimit)>500)return reply.code(400).send({error:'invalid_policy'});
    const r=await pool.query(`INSERT INTO content_publication_policies(category_slug,daily_limit,auto_publish,require_review,source_language_policy,updated_by)
      VALUES($1,$2,$3,$4,$5,(SELECT id FROM platform_users WHERE identity_id=$6))
      ON CONFLICT(category_slug) DO UPDATE SET daily_limit=EXCLUDED.daily_limit,auto_publish=EXCLUDED.auto_publish,require_review=EXCLUDED.require_review,source_language_policy=EXCLUDED.source_language_policy,updated_by=EXCLUDED.updated_by,updated_at=NOW()
      RETURNING *`,[category,Number(b.dailyLimit),b.autoPublish===true,b.requireReview!==false,String(b.sourceLanguagePolicy??'translate_then_rewrite'),a.sub]);
    return{policy:r.rows[0]};
  });
  app.get('/api/v1/admin/content/pipeline',{preHandler:requireAuth},async(req,reply)=>{const a=await admin(pool,req,reply,'content.read');if(!a)return;const [runs,ingest,ai]=await Promise.all([pool.query('SELECT * FROM content_pipeline_runs ORDER BY started_at DESC LIMIT 30'),pool.query('SELECT i.*,s.name source_name,s.category FROM content_ingestion_items i JOIN content_sources s ON s.id=i.source_id ORDER BY i.received_at DESC LIMIT 200'),pool.query(`SELECT r.id,r.status,r.model,r.provider_id,r.source_type,r.source_id,r.error_message,r.created_at,r.completed_at,p.name provider FROM ai_execution_runs r LEFT JOIN ai_providers p ON p.id=r.provider_id WHERE r.source_type='content_ingestion' ORDER BY r.created_at DESC LIMIT 200`)]);return{runs:runs.rows,ingestion:ingest.rows,aiRuns:ai.rows};});
  app.get('/api/v1/admin/content/videos',{preHandler:requireAuth},async(req,reply)=>{const a=await admin(pool,req,reply,'content.read');if(!a)return;return{videos:(await pool.query('SELECT id,title,description,mime_type,file_name,byte_size,duration_seconds,category_slug,hashtags,status,published_at,created_at,updated_at FROM content_videos ORDER BY created_at DESC LIMIT 200')).rows};});
  app.post('/api/v1/admin/content/videos',{preHandler:requireAuth},async(req,reply)=>{
    const a=await admin(pool,req,reply,'content.write');if(!a)return;
    const parts=req.parts();let title='',description='',category='video-news',hashtags:string[]=[];let file:any=null;
    for await(const part of parts as any){if(part.type==='file'){file=part;}else if(part.fieldname==='title')title=String(part.value??'');else if(part.fieldname==='description')description=String(part.value??'');else if(part.fieldname==='category')category=String(part.value??'video-news');else if(part.fieldname==='hashtags')hashtags=String(part.value??'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,50);}
    if(!title.trim()||!file)return reply.code(400).send({error:'title_and_video_required'});
    if(!String(file.mimetype??'').startsWith('video/'))return reply.code(400).send({error:'video_file_required'});
    const bytes=await file.toBuffer();if(!bytes.length)return reply.code(400).send({error:'empty_video'});
    const user=(await pool.query('SELECT id FROM platform_users WHERE identity_id=$1',[a.sub])).rows[0]?.id;
    const r=await pool.query(`INSERT INTO content_videos(title,description,mime_type,file_name,bytes,byte_size,category_slug,hashtags,created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,title,status,created_at`,[title.trim(),description.trim()||null,file.mimetype,String(file.filename??'video'),bytes,bytes.length,category,hashtags,user??null]);
    return reply.code(201).send({video:r.rows[0]});
  });
  app.patch('/api/v1/admin/content/videos/:id/status',{preHandler:requireAuth},async(req,reply)=>{
    const a=await admin(pool,req,reply,'content.write');if(!a)return;const id=Number((req.params as any).id),status=String((req.body as any)?.status??'');if(!Number.isSafeInteger(id)||!['draft','published','archived'].includes(status))return reply.code(400).send({error:'invalid_video_status'});
    const r=await pool.query(`UPDATE content_videos SET status=$1,published_at=CASE WHEN $1='published' THEN COALESCE(published_at,NOW()) ELSE published_at END,updated_at=NOW() WHERE id=$2 RETURNING id,status,published_at`,[status,id]);if(!r.rows[0])return reply.code(404).send({error:'video_not_found'});return{video:r.rows[0]};
  });
}
