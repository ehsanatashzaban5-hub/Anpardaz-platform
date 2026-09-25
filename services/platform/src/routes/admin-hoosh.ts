import type {FastifyInstance,FastifyRequest} from 'fastify';
import type {Pool} from 'pg';
import {requireAuth,type AuthClaims} from '../auth.js';
import {hasPermission} from '../permissions.js';

type R=FastifyRequest&{auth:AuthClaims};
export function registerAdminHooshRoutes(app:FastifyInstance,pool:Pool){
  app.get('/api/v1/admin/hoosh/overview',{preHandler:requireAuth},async(request,reply)=>{
    const a=request as R;
    if(!(await hasPermission(pool,a.auth,'hoosh.read')))return reply.code(403).send({error:'forbidden'});
    const [users,convs,queue,usage,providers]=await Promise.all([
      pool.query("SELECT COUNT(DISTINCT identity_id)::int count FROM hoosh_conversations"),
      pool.query("SELECT COUNT(*)::int count FROM hoosh_conversations WHERE status='active'"),
      pool.query("SELECT status,COUNT(*)::int count FROM hoosh_requests GROUP BY status ORDER BY status"),
      pool.query("SELECT COUNT(*)::int requests,COALESCE(SUM(input_tokens),0)::bigint input_tokens,COALESCE(SUM(output_tokens),0)::bigint output_tokens,COALESCE(SUM(cost),0)::numeric cost FROM hoosh_usage"),
      pool.query("SELECT name,provider_type,enabled,priority,model_policy FROM ai_providers ORDER BY priority,name")
    ]);
    return {users:users.rows[0],conversations:convs.rows[0],queue:queue.rows,usage:usage.rows[0],providers:providers.rows};
  });
  app.get('/api/v1/admin/hoosh/requests',{preHandler:requireAuth},async(request,reply)=>{
    const a=request as R;
    if(!(await hasPermission(pool,a.auth,'hoosh.read')))return reply.code(403).send({error:'forbidden'});
    const q=await pool.query("SELECT id,identity_id,conversation_id,status,provider,model,requested_model,mode,attempt_count,error,created_at,completed_at FROM hoosh_requests ORDER BY created_at DESC LIMIT 500");
    return {requests:q.rows};
  });
  app.post('/api/v1/admin/hoosh/requests/:id/retry',{preHandler:requireAuth},async(request,reply)=>{
    const a=request as R; if(!(await hasPermission(pool,a.auth,'hoosh.manage')))return reply.code(403).send({error:'forbidden'});
    const id=Number((request.params as any).id); if(!Number.isSafeInteger(id)||id<1)return reply.code(400).send({error:'invalid_request_id'});
    const q=await pool.query("UPDATE hoosh_requests SET status='queued',error=NULL,started_at=NULL,lease_until=NULL,completed_at=NULL,attempt_count=0 WHERE id=$1 AND status IN ('failed','cancelled') RETURNING id,status",[id]);
    if(!q.rows[0])return reply.code(409).send({error:'request_not_retryable'}); return {request:q.rows[0]};
  });
  app.post('/api/v1/admin/hoosh/requests/:id/cancel',{preHandler:requireAuth},async(request,reply)=>{
    const a=request as R; if(!(await hasPermission(pool,a.auth,'hoosh.manage')))return reply.code(403).send({error:'forbidden'});
    const id=Number((request.params as any).id); const q=await pool.query("UPDATE hoosh_requests SET status='cancelled',error='cancelled_by_admin',lease_until=NULL,completed_at=NOW() WHERE id=$1 AND status IN ('queued','running') RETURNING id,status",[id]);
    if(!q.rows[0])return reply.code(409).send({error:'request_not_cancellable'}); return {request:q.rows[0]};
  });
  app.put('/api/v1/admin/hoosh/providers/:name',{preHandler:requireAuth},async(request,reply)=>{
    const a=request as R;
    if(!(await hasPermission(pool,a.auth,'hoosh.manage')))return reply.code(403).send({error:'forbidden'});
    const name=String((request.params as any).name);
    const body=(request.body??{}) as any;
    const allowed=Array.isArray(body.allowedModels)?body.allowedModels.filter((x:any)=>typeof x==='string'&&x.trim()).map((x:string)=>x.trim().slice(0,160)).slice(0,100):null;
    const defaultModel=typeof body.defaultModel==='string'&&body.defaultModel.trim()?body.defaultModel.trim().slice(0,160):null;
    if(!allowed||!defaultModel||!allowed.includes(defaultModel))return reply.code(400).send({error:'invalid_model_policy'});
    const q=await pool.query(
      `UPDATE ai_providers SET model_policy=jsonb_set(jsonb_set(COALESCE(model_policy,'{}'::jsonb),'{allowed_models}',$1::jsonb,true),'{default_model}',to_jsonb($2::text),true) WHERE name=$3 RETURNING name,enabled,priority,model_policy`,
      [JSON.stringify(allowed),defaultModel,name]
    );
    if(!q.rows[0])return reply.code(404).send({error:'provider_not_found'});
    return {provider:q.rows[0]};
  });
  app.post('/api/v1/admin/hoosh/providers/:name/toggle',{preHandler:requireAuth},async(request,reply)=>{
    const a=request as R;
    if(!(await hasPermission(pool,a.auth,'hoosh.manage')))return reply.code(403).send({error:'forbidden'});
    const name=String((request.params as any).name); const enabled=Boolean((request.body as any)?.enabled);
    const q=await pool.query("UPDATE ai_providers SET enabled=$1 WHERE name=$2 RETURNING name,enabled,priority,model_policy",[enabled,name]);
    if(!q.rows[0])return reply.code(404).send({error:'provider_not_found'});
    return {provider:q.rows[0]};
  });
}
