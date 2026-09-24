import type {FastifyInstance,FastifyRequest} from 'fastify';
import type {Pool} from 'pg';
import {requireAuth,type AuthClaims,ensurePlatformUser} from '../auth.js';
import {hasPermission} from '../permissions.js';
import {AiGateway} from '../services/ai-gateway.js';

type R=FastifyRequest&{auth:AuthClaims}; const ar=(x:FastifyRequest)=>x as R;
const clean=(v:unknown,max:number)=>typeof v==='string'?v.trim().slice(0,max):'';

export function registerHooshRoutes(app:FastifyInstance,pool:Pool){
 const gateway=new AiGateway(pool);
 app.get('/api/v1/hoosh/me',{preHandler:requireAuth},async(req,reply)=>{
   const a=ar(req), uid=await ensurePlatformUser(pool,a.auth);
   const [u,c,p,t]=await Promise.all([
     pool.query('SELECT id,identity_id,email,display_name,profile_photo_id,role,status,created_at FROM platform_users WHERE id=$1',[uid]),
     pool.query(`SELECT id,title,model,status,created_at,updated_at FROM hoosh_conversations WHERE identity_id=$1 ORDER BY updated_at DESC LIMIT 100`,[a.auth.sub]),
     pool.query(`SELECT id,title,description,model_id,mode_id,accent_color,status,created_at,updated_at FROM hoosh_projects WHERE identity_id=$1 ORDER BY updated_at DESC LIMIT 100`,[a.auth.sub]),
     pool.query(`SELECT id,subject,status,priority,category,conversation_id,created_at,updated_at FROM hoosh_tickets WHERE identity_id=$1 ORDER BY updated_at DESC LIMIT 100`,[a.auth.sub])
   ]);
   const usage=await pool.query(`SELECT COALESCE(SUM(input_tokens),0)::bigint input_tokens,COALESCE(SUM(output_tokens),0)::bigint output_tokens,COALESCE(SUM(cost),0)::numeric cost,COUNT(*)::int requests FROM hoosh_usage WHERE identity_id=$1`,[a.auth.sub]);
   return {user:u.rows[0],conversations:c.rows,projects:p.rows,tickets:t.rows,usage:usage.rows[0]};
 });
 app.get('/api/v1/hoosh/conversations/:id',{preHandler:requireAuth},async(req,reply)=>{
   const a=ar(req),id=Number((req.params as any).id);
   if(!Number.isSafeInteger(id)||id<=0)return reply.code(400).send({error:'invalid_conversation'});
   const c=await pool.query('SELECT id,title,model,status,created_at,updated_at FROM hoosh_conversations WHERE id=$1 AND identity_id=$2',[id,a.auth.sub]);
   if(!c.rows[0])return reply.code(404).send({error:'conversation_not_found'});
   const m=await pool.query('SELECT id,role,content,metadata,created_at FROM hoosh_messages WHERE conversation_id=$1 ORDER BY created_at,id',[id]);
   return {conversation:c.rows[0],messages:m.rows};
 });
 app.post('/api/v1/hoosh/conversations',{preHandler:requireAuth},async(req,reply)=>{
   const a=ar(req),b=(req.body??{}) as any,title=clean(b.title,160)||'مکالمه جدید',model=clean(b.modelId,150)||null;
   const q=await pool.query('INSERT INTO hoosh_conversations(identity_id,title,model) VALUES($1,$2,$3) RETURNING *',[a.auth.sub,title,model]);
   return {conversation:q.rows[0]};
 });
 app.post('/api/v1/hoosh/chat',{preHandler:requireAuth},async(req,reply)=>{
   const a=ar(req),b=(req.body??{}) as any,input=clean(b.input,20000),modelId=clean(b.modelId,150)||undefined;
   if(!input)return reply.code(400).send({error:'invalid_input'});
   let conversationId=Number(b.conversationId);
   if(!Number.isSafeInteger(conversationId)||conversationId<=0){
     const c=await pool.query('INSERT INTO hoosh_conversations(identity_id,title,model) VALUES($1,$2,$3) RETURNING id',[a.auth.sub,input.slice(0,80),modelId??null]);
     conversationId=Number(c.rows[0].id);
   }else{
     const own=await pool.query('SELECT id FROM hoosh_conversations WHERE id=$1 AND identity_id=$2',[conversationId,a.auth.sub]);
     if(!own.rows[0])return reply.code(404).send({error:'conversation_not_found'});
   }
   await pool.query('INSERT INTO hoosh_messages(conversation_id,role,content,metadata) VALUES($1,\'user\',$2,$3)',[conversationId,input,JSON.stringify({modeId:clean(b.modeId,80)||null})]);
   try{
     const result=await gateway.execute({workflowCode:'hoosh.chat',input,modelId,requesterIdentityId:a.auth.sub,sourceType:'hoosh',sourceId:String(conversationId),idempotencyKey:clean(b.idempotencyKey,200)||undefined});
     const m=await pool.query('INSERT INTO hoosh_messages(conversation_id,role,content,metadata) VALUES($1,\'assistant\',$2,$3) RETURNING id,role,content,metadata,created_at',[conversationId,result.text,JSON.stringify({provider:result.provider,model:result.model})]);
     await pool.query('INSERT INTO hoosh_usage(identity_id,conversation_id,provider,model,input_tokens,output_tokens,cost,status) VALUES($1,$2,$3,$4,$5,$6,$7,\'completed\')',[a.auth.sub,conversationId,result.provider,result.model,result.inputTokens,result.outputTokens,result.cost]);
     await pool.query('UPDATE hoosh_conversations SET model=COALESCE($1,model),updated_at=NOW() WHERE id=$2',[result.model,conversationId]);
     return {conversationId,message:m.rows[0],result};
   }catch(e){
     await pool.query('INSERT INTO hoosh_usage(identity_id,conversation_id,provider,model,status) VALUES($1,$2,$3,$4,\'failed\')',[a.auth.sub,null,null,modelId??null]).catch(()=>{});
     return reply.code(502).send({error:'ai_provider_failure'});
   }
 });
 app.get('/api/v1/hoosh/projects',{preHandler:requireAuth},async(req)=>{const a=ar(req);const q=await pool.query(`SELECT p.id,p.title,p.description,p.model_id,p.mode_id,p.accent_color,p.status,p.created_at,p.updated_at,COALESCE(array_agg(pc.conversation_id) FILTER(WHERE pc.conversation_id IS NOT NULL),'{}') chat_ids FROM hoosh_projects p LEFT JOIN hoosh_project_conversations pc ON pc.project_id=p.id WHERE p.identity_id=$1 AND p.status='active' GROUP BY p.id ORDER BY p.updated_at DESC`,[a.auth.sub]);return{projects:q.rows};});
 app.post('/api/v1/hoosh/projects',{preHandler:requireAuth},async(req,reply)=>{const a=ar(req),b=(req.body??{}) as any,title=clean(b.title,160);if(!title)return reply.code(400).send({error:'invalid_title'});const q=await pool.query('INSERT INTO hoosh_projects(identity_id,title,description,model_id,mode_id,accent_color) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[a.auth.sub,title,clean(b.description,1000)||null,clean(b.modelId,150)||null,clean(b.modeId,80)||null,clean(b.accentColor,30)||null]);return{project:q.rows[0]};});
 app.post('/api/v1/hoosh/projects/:id/conversations',{preHandler:requireAuth},async(req,reply)=>{const a=ar(req),id=Number((req.params as any).id),conversationId=Number((req.body as any)?.conversationId);if(!Number.isSafeInteger(id)||!Number.isSafeInteger(conversationId))return reply.code(400).send({error:'invalid_reference'});const own=await pool.query('SELECT id FROM hoosh_projects WHERE id=$1 AND identity_id=$2',[id,a.auth.sub]);const conv=await pool.query('SELECT id FROM hoosh_conversations WHERE id=$1 AND identity_id=$2',[conversationId,a.auth.sub]);if(!own.rows[0]||!conv.rows[0])return reply.code(404).send({error:'not_found'});await pool.query('INSERT INTO hoosh_project_conversations(project_id,conversation_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[id,conversationId]);return{ok:true};});
 app.get('/api/v1/hoosh/tickets/:id',{preHandler:requireAuth},async(req,reply)=>{const a=ar(req),id=Number((req.params as any).id);const t=await pool.query('SELECT * FROM hoosh_tickets WHERE id=$1 AND identity_id=$2',[id,a.auth.sub]);if(!t.rows[0])return reply.code(404).send({error:'ticket_not_found'});const m=await pool.query('SELECT * FROM hoosh_ticket_messages WHERE ticket_id=$1 ORDER BY created_at',[id]);return{ticket:t.rows[0],messages:m.rows};});
 app.post('/api/v1/hoosh/tickets',{preHandler:requireAuth},async(req,reply)=>{const a=ar(req),b=(req.body??{}) as any,subject=clean(b.subject,200),message=clean(b.message,10000);if(subject.length<3||!message)return reply.code(400).send({error:'invalid_ticket'});const client=await pool.connect();try{await client.query('BEGIN');const t=await client.query('INSERT INTO hoosh_tickets(identity_id,subject,priority,category,conversation_id) VALUES($1,$2,$3,$4,$5) RETURNING *',[a.auth.sub,subject,['low','normal','high','urgent'].includes(b.priority)?b.priority:'normal',clean(b.category,80)||'general',Number.isSafeInteger(Number(b.conversationId))?Number(b.conversationId):null]);await client.query('INSERT INTO hoosh_ticket_messages(ticket_id,author_identity_id,author_type,message) VALUES($1,$2,\'user\',$3)',[t.rows[0].id,a.auth.sub,message]);await client.query('COMMIT');return{ticket:t.rows[0]};}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}});
 app.patch('/api/v1/hoosh/tickets/:id',{preHandler:requireAuth},async(req,reply)=>{const a=ar(req),id=Number((req.params as any).id),subject=clean((req.body as any)?.subject,200);if(!subject)return reply.code(400).send({error:'invalid_subject'});const q=await pool.query('UPDATE hoosh_tickets SET subject=$1,updated_at=NOW() WHERE id=$2 AND identity_id=$3 RETURNING *',[subject,id,a.auth.sub]);if(!q.rows[0])return reply.code(404).send({error:'ticket_not_found'});return{ticket:q.rows[0]};});
 app.get('/api/v1/admin/hoosh/overview',{preHandler:requireAuth},async(req,reply)=>{
   const a=ar(req);if(!(await hasPermission(pool,a.auth,'ai.runs.read')))return reply.code(403).send({error:'forbidden'});
   const [providers,workflows,runs,users,tickets]=await Promise.all([
     pool.query('SELECT id,name,provider_type,base_url,enabled,priority,model_policy,secret_ref FROM ai_providers ORDER BY priority,name'),
     pool.query('SELECT id,code,description,enabled,require_human_review,provider_policy FROM ai_workflows ORDER BY code'),
     pool.query('SELECT r.id,w.code workflow,p.name provider,r.status,r.model,r.input_tokens,r.output_tokens,r.cost,r.error_code,r.error_message,r.started_at,r.completed_at,r.created_at FROM ai_execution_runs r LEFT JOIN ai_workflows w ON w.id=r.workflow_id LEFT JOIN ai_providers p ON p.id=r.provider_id ORDER BY r.created_at DESC LIMIT 500'),
     pool.query('SELECT COUNT(DISTINCT identity_id)::int users,COUNT(*)::int conversations FROM hoosh_conversations'),
     pool.query('SELECT status,COUNT(*)::int count FROM hoosh_tickets GROUP BY status ORDER BY status')
   ]);
   return{providers:providers.rows.map(x=>({...x,secret_ref:x.secret_ref?'configured':'not_configured'})),workflows:workflows.rows,runs:runs.rows,usage:users.rows[0],tickets:tickets.rows};
 });
 app.get('/api/v1/admin/hoosh/tickets',{preHandler:requireAuth},async(req,reply)=>{const a=ar(req);if(!(await hasPermission(pool,a.auth,'operations.read')))return reply.code(403).send({error:'forbidden'});const q=await pool.query('SELECT t.*,u.email FROM hoosh_tickets t LEFT JOIN platform_users u ON u.identity_id=t.identity_id ORDER BY t.updated_at DESC LIMIT 500');return{tickets:q.rows};});
 app.get('/api/v1/admin/hoosh/tickets/:id',{preHandler:requireAuth},async(req,reply)=>{const a=ar(req);if(!(await hasPermission(pool,a.auth,'operations.read')))return reply.code(403).send({error:'forbidden'});const id=Number((req.params as any).id);const t=await pool.query('SELECT t.*,u.email FROM hoosh_tickets t LEFT JOIN platform_users u ON u.identity_id=t.identity_id WHERE t.id=$1',[id]);if(!t.rows[0])return reply.code(404).send({error:'ticket_not_found'});const m=await pool.query('SELECT * FROM hoosh_ticket_messages WHERE ticket_id=$1 ORDER BY created_at',[id]);return{ticket:t.rows[0],messages:m.rows};});
 app.post('/api/v1/admin/hoosh/tickets/:id/reply',{preHandler:requireAuth},async(req,reply)=>{const a=ar(req);if(!(await hasPermission(pool,a.auth,'approvals.write')))return reply.code(403).send({error:'forbidden'});const id=Number((req.params as any).id),message=clean((req.body as any)?.message,10000);if(!Number.isSafeInteger(id)||!message)return reply.code(400).send({error:'invalid_message'});const q=await pool.query('INSERT INTO hoosh_ticket_messages(ticket_id,author_identity_id,author_type,message) VALUES($1,$2,\'admin\',$3) RETURNING *',[id,a.auth.sub,message]);await pool.query("UPDATE hoosh_tickets SET status='answered',updated_at=NOW() WHERE id=$1",[id]);return{message:q.rows[0]};});
 app.patch('/api/v1/admin/hoosh/tickets/:id',{preHandler:requireAuth},async(req,reply)=>{const a=ar(req);if(!(await hasPermission(pool,a.auth,'approvals.write')))return reply.code(403).send({error:'forbidden'});const id=Number((req.params as any).id),status=(req.body as any)?.status;if(!Number.isSafeInteger(id)||!['open','pending','answered','closed'].includes(status))return reply.code(400).send({error:'invalid_status'});const q=await pool.query('UPDATE hoosh_tickets SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING *',[status,id]);if(!q.rows[0])return reply.code(404).send({error:'ticket_not_found'});return{ticket:q.rows[0]};});
 app.patch('/api/v1/admin/hoosh/providers/:id',{preHandler:requireAuth},async(req,reply)=>{const a=ar(req);if(!(await hasPermission(pool,a.auth,'approvals.write')))return reply.code(403).send({error:'forbidden'});const id=Number((req.params as any).id),enabled=(req.body as any)?.enabled;if(typeof enabled!=='boolean')return reply.code(400).send({error:'invalid_enabled'});const q=await pool.query('UPDATE ai_providers SET enabled=$1 WHERE id=$2 RETURNING id,name,enabled,priority,model_policy',[enabled,id]);if(!q.rows[0])return reply.code(404).send({error:'provider_not_found'});return{provider:q.rows[0]};});
 app.patch('/api/v1/admin/hoosh/workflows/:id',{preHandler:requireAuth},async(req,reply)=>{const a=ar(req);if(!(await hasPermission(pool,a.auth,'approvals.write')))return reply.code(403).send({error:'forbidden'});const id=Number((req.params as any).id),enabled=(req.body as any)?.enabled;if(typeof enabled!=='boolean')return reply.code(400).send({error:'invalid_enabled'});const q=await pool.query('UPDATE ai_workflows SET enabled=$1 WHERE id=$2 RETURNING id,code,enabled,require_human_review,provider_policy',[enabled,id]);if(!q.rows[0])return reply.code(404).send({error:'workflow_not_found'});return{workflow:q.rows[0]};});
}
