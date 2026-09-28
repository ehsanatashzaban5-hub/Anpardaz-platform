import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';
import { ensurePlatformUser, requireAuth, type AuthClaims } from '../auth.js';
import { hasPermission } from '../permissions.js';
type R=FastifyRequest&{auth:AuthClaims};
const deny=(reply:any)=>reply.code(403).send({error:'forbidden'});
async function audit(pool:Pool,r:R,action:string,type:string,id:string|null,metadata:unknown={}){await pool.query("INSERT INTO audit_logs(identity_id,actor_type,actor_identity_id,action,resource_type,resource_id,metadata) VALUES($1,'admin',$1,$2,$3,$4,$5)",[r.auth.sub,action,type,id,metadata]);}
export function registerControlPlaneRoutes(app:FastifyInstance,pool:Pool){
 app.get('/api/v1/notifications',{preHandler:requireAuth},async(req)=>{const r=req as R;const rows=await pool.query('SELECT * FROM notifications WHERE identity_id=$1 ORDER BY created_at DESC LIMIT 100',[r.auth.sub]);return{notifications:rows.rows};});
 app.post('/api/v1/admin/notifications',{preHandler:requireAuth},async(req,reply)=>{const r=req as R;if(!(await hasPermission(pool,r.auth,'notifications.write')))return deny(reply);const b=(req.body??{}) as {identityId?:string;channel?:string;type?:string;title?:string;body?:string;data?:unknown};if(!b.identityId||!b.title||!b.body||!['in_app','push','sms','email'].includes(b.channel??''))return reply.code(400).send({error:'invalid_notification'});const n=await pool.query('INSERT INTO notifications(identity_id,channel,type,title,body,data) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[b.identityId,b.channel,b.type??'admin',b.title,b.body,b.data??{}]);await audit(pool,r,'notification_create','notification',String(n.rows[0].id));return reply.code(201).send({notification:n.rows[0]});});
 app.get('/api/v1/admin/market-data/sources',{preHandler:requireAuth},async(req,reply)=>{const r=req as R;if(!(await hasPermission(pool,r.auth,'service_health.read')))return deny(reply);const rows=await pool.query('SELECT s.*,h.status,h.last_success_at,h.last_failure_at,h.consecutive_failures,h.last_error FROM market_data_sources s LEFT JOIN market_data_health h ON h.source_id=s.id ORDER BY s.priority,s.name');return{sources:rows.rows};});
 app.get('/api/v1/admin/ai/providers',{preHandler:requireAuth},async(req,reply)=>{const r=req as R;if(!(await hasPermission(pool,r.auth,'ai.providers.read')))return deny(reply);const rows=await pool.query('SELECT id,name,provider_type,base_url,enabled,priority,model_policy,secret_ref,created_at,updated_at FROM ai_providers ORDER BY priority,name');return{providers:rows.rows};});
}
