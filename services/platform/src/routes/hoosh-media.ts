import type {FastifyInstance,FastifyRequest} from 'fastify';
import type {Pool} from 'pg';
import {requireAuth,type AuthClaims} from '../auth.js';

type R=FastifyRequest&{auth:AuthClaims}; const req=(x:FastifyRequest)=>x as R;

export function registerHooshMediaRoutes(app:FastifyInstance,pool:Pool){
  app.post('/api/v1/hoosh/media',{preHandler:requireAuth},async(request,reply)=>{
    const a=req(request); const b=(request.body??{}) as any;
    const mode=typeof b.mode==='string'?b.mode.trim():'';
    const model=typeof b.model==='string'?b.model.trim():'';
    const prompt=typeof b.prompt==='string'?b.prompt.trim():'';
    if(!['image','video','music','voice'].includes(mode)||!model||!prompt||prompt.length>20000)return reply.code(400).send({error:'invalid_media_request'});
    const provider=await pool.query<any>("SELECT name,model_policy FROM ai_providers WHERE enabled=true ORDER BY priority ASC");
    const p=provider.rows.find((x:any)=>Array.isArray(x.model_policy?.allowed_models)&&x.model_policy.allowed_models.includes(model));
    const caps=p?.model_policy?.capabilities?.[model];
    if(!p||!Array.isArray(caps)||!caps.includes(mode))return reply.code(400).send({error:'model_capability_not_available'});
    const convId=b.conversationId==null?null:Number(b.conversationId);
    const projectId=b.projectId==null?null:Number(b.projectId);
    if(convId!==null&&!Number.isSafeInteger(convId))return reply.code(400).send({error:'invalid_conversation_id'});
    if(projectId!==null&&!Number.isSafeInteger(projectId))return reply.code(400).send({error:'invalid_project_id'});
    if(convId){const q=await pool.query('SELECT 1 FROM hoosh_conversations WHERE id=$1 AND identity_id=$2',[convId,a.auth.sub]);if(!q.rows[0])return reply.code(404).send({error:'conversation_not_found'});}
    if(projectId){const q=await pool.query('SELECT 1 FROM hoosh_projects WHERE id=$1 AND identity_id=$2',[projectId,a.auth.sub]);if(!q.rows[0])return reply.code(404).send({error:'project_not_found'});}
    const q=await pool.query('INSERT INTO hoosh_media_jobs(identity_id,conversation_id,project_id,mode,provider,model,prompt,options) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,status,mode,provider,model,created_at',[a.auth.sub,convId,projectId,mode,p.name,model,prompt,JSON.stringify(b.options??{})]);
    return reply.code(202).send({job:q.rows[0]});
  });

  app.get('/api/v1/hoosh/media',{preHandler:requireAuth},async(request)=>{
    const a=req(request); const q=await pool.query("SELECT id,conversation_id,project_id,mode,provider,model,status,mime_type,file_name,text_output,metadata,error,created_at,updated_at,completed_at FROM hoosh_media_jobs WHERE identity_id=$1 ORDER BY created_at DESC LIMIT 100",[a.auth.sub]); return {jobs:q.rows};
  });

  app.get('/api/v1/hoosh/media/:id',{preHandler:requireAuth},async(request,reply)=>{
    const a=req(request); const id=Number((request.params as any).id);
    const q=await pool.query("SELECT id,conversation_id,project_id,mode,provider,model,status,mime_type,file_name,text_output,metadata,error,created_at,updated_at,completed_at FROM hoosh_media_jobs WHERE id=$1 AND identity_id=$2",[id,a.auth.sub]);
    if(!q.rows[0])return reply.code(404).send({error:'media_job_not_found'}); return {job:q.rows[0]};
  });

  app.get('/api/v1/hoosh/media/:id/content',{preHandler:requireAuth},async(request,reply)=>{
    const a=req(request); const id=Number((request.params as any).id);
    const q=await pool.query("SELECT mime_type,file_name,media_data FROM hoosh_media_jobs WHERE id=$1 AND identity_id=$2 AND status='completed'",[id,a.auth.sub]);
    if(!q.rows[0]||!q.rows[0].media_data)return reply.code(404).send({error:'media_not_ready'});
    reply.header('Content-Type',q.rows[0].mime_type??'application/octet-stream').header('Content-Disposition',`inline; filename="${q.rows[0].file_name??'media'}"`).header('Cache-Control','private,max-age=3600');
    return reply.send(q.rows[0].media_data);
  });

  app.get('/api/v1/hoosh/profile',{preHandler:requireAuth},async(request)=>{
    const a=req(request); const q=await pool.query('SELECT id,identity_id,email,display_name,avatar_url,role,status FROM platform_users WHERE identity_id=$1',[a.auth.sub]); return {profile:q.rows[0]??null};
  });
  app.put('/api/v1/hoosh/profile',{preHandler:requireAuth},async(request,reply)=>{
    const a=req(request); const b=(request.body??{}) as any;
    const displayName=typeof b.displayName==='string'?b.displayName.trim().slice(0,120):null;
    const avatarUrl=typeof b.avatarUrl==='string'?b.avatarUrl.trim().slice(0,1000):null;
    const q=await pool.query('UPDATE platform_users SET display_name=COALESCE($1,display_name),avatar_url=COALESCE($2,avatar_url) WHERE identity_id=$3 RETURNING id,identity_id,email,display_name,avatar_url,role,status',[displayName,avatarUrl,a.auth.sub]);
    if(!q.rows[0])return reply.code(404).send({error:'profile_not_found'}); return {profile:q.rows[0]};
  });

  app.post('/api/v1/hoosh/tickets',{preHandler:requireAuth},async(request,reply)=>{
    const a=req(request); const b=(request.body??{}) as any; const subject=typeof b.subject==='string'?b.subject.trim().slice(0,200):''; const content=typeof b.content==='string'?b.content.trim().slice(0,10000):'';
    if(!subject||!content)return reply.code(400).send({error:'invalid_ticket'});
    const priority=['low','normal','high','urgent'].includes(b.priority)?b.priority:'normal';
    const c=await pool.connect(); try{await c.query('BEGIN');const t=await c.query('INSERT INTO hoosh_tickets(identity_id,subject,category,priority) VALUES($1,$2,$3,$4) RETURNING id,subject,category,priority,status,created_at,updated_at',[a.auth.sub,subject,typeof b.category==='string'?b.category.slice(0,60):'general',priority]);await c.query('INSERT INTO hoosh_ticket_messages(ticket_id,identity_id,role,content) VALUES($1,$2,\'user\',$3)',[t.rows[0].id,a.auth.sub,content]);await c.query('COMMIT');return reply.code(201).send({ticket:t.rows[0]});}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
  });
  app.get('/api/v1/hoosh/tickets',{preHandler:requireAuth},async(request)=>{const a=req(request);const q=await pool.query("SELECT id,subject,category,priority,status,created_at,updated_at,closed_at FROM hoosh_tickets WHERE identity_id=$1 ORDER BY updated_at DESC LIMIT 100",[a.auth.sub]);return {tickets:q.rows};});
  app.get('/api/v1/hoosh/tickets/:id',{preHandler:requireAuth},async(request,reply)=>{const a=req(request);const id=Number((request.params as any).id);const t=await pool.query('SELECT id,subject,category,priority,status,created_at,updated_at,closed_at FROM hoosh_tickets WHERE id=$1 AND identity_id=$2',[id,a.auth.sub]);if(!t.rows[0])return reply.code(404).send({error:'ticket_not_found'});const m=await pool.query('SELECT id,role,content,created_at FROM hoosh_ticket_messages WHERE ticket_id=$1 ORDER BY created_at,id',[id]);return {ticket:t.rows[0],messages:m.rows};});
  app.post('/api/v1/hoosh/tickets/:id/messages',{preHandler:requireAuth},async(request,reply)=>{const a=req(request);const id=Number((request.params as any).id);const content=typeof (request.body as any)?.content==='string'?(request.body as any).content.trim().slice(0,10000):'';if(!content)return reply.code(400).send({error:'invalid_message'});const t=await pool.query("SELECT id FROM hoosh_tickets WHERE id=$1 AND identity_id=$2 AND status IN ('open','pending')",[id,a.auth.sub]);if(!t.rows[0])return reply.code(404).send({error:'ticket_not_found_or_closed'});await pool.query("INSERT INTO hoosh_ticket_messages(ticket_id,identity_id,role,content) VALUES($1,$2,'user',$3)",[id,a.auth.sub,content]);await pool.query("UPDATE hoosh_tickets SET status='open',updated_at=NOW() WHERE id=$1",[id]);return {ok:true};});
}
