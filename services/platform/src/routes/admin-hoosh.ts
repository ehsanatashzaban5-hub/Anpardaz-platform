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
  app.post('/api/v1/admin/hoosh/providers/:name/toggle',{preHandler:requireAuth},async(request,reply)=>{
    const a=request as R;
    if(!(await hasPermission(pool,a.auth,'hoosh.manage')))return reply.code(403).send({error:'forbidden'});
    const name=String((request.params as any).name); const enabled=Boolean((request.body as any)?.enabled);
    const q=await pool.query("UPDATE ai_providers SET enabled=$1 WHERE name=$2 RETURNING name,enabled,priority,model_policy",[enabled,name]);
    if(!q.rows[0])return reply.code(404).send({error:'provider_not_found'});
    return {provider:q.rows[0]};
  });
}
