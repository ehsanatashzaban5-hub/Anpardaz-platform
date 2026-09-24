import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';
import { requireAuth, type AuthClaims } from '../auth.js';
import { hasPermission } from '../permissions.js';

type R=FastifyRequest&{auth:AuthClaims};
const auth=(r:FastifyRequest)=>r as R;

export function registerAdminMarketRoutes(app:FastifyInstance,pool:Pool){
  app.get('/api/v1/admin/market/stores',{preHandler:requireAuth},async(req,reply)=>{
    if(!(await hasPermission(pool,auth(req).auth,'operations.read')))return reply.code(403).send({error:'forbidden'});
    const q=await pool.query(`SELECT s.*,COUNT(DISTINCT o.id)::int offer_count,COUNT(DISTINCT o.product_id)::int product_count
      FROM market_stores s LEFT JOIN market_offers o ON o.store_id=s.id
      GROUP BY s.id ORDER BY s.name`);
    return{stores:q.rows};
  });
  app.get('/api/v1/admin/market/sources',{preHandler:requireAuth},async(req,reply)=>{
    if(!(await hasPermission(pool,auth(req).auth,'operations.read')))return reply.code(403).send({error:'forbidden'});
    const q=await pool.query(`SELECT ss.*,s.name store_name,s.domain FROM market_store_sources ss JOIN market_stores s ON s.id=ss.store_id ORDER BY s.name,ss.source_name`);
    return{sources:q.rows};
  });
  app.get('/api/v1/admin/market/sync-runs',{preHandler:requireAuth},async(req,reply)=>{
    if(!(await hasPermission(pool,auth(req).auth,'operations.read')))return reply.code(403).send({error:'forbidden'});
    const q=await pool.query(`SELECT r.*,s.name store_name,ss.source_name FROM market_sync_runs r LEFT JOIN market_stores s ON s.id=r.store_id LEFT JOIN market_store_sources ss ON ss.id=r.source_id ORDER BY r.created_at DESC LIMIT 500`);
    return{runs:q.rows};
  });
  app.get('/api/v1/admin/market/events',{preHandler:requireAuth},async(req,reply)=>{
    if(!(await hasPermission(pool,auth(req).auth,'operations.read')))return reply.code(403).send({error:'forbidden'});
    const q=await pool.query(`SELECT e.*,p.title product_title,s.name store_name,u.email
      FROM market_user_events e LEFT JOIN market_products p ON p.id=e.product_id
      LEFT JOIN market_stores s ON s.id=e.store_id LEFT JOIN platform_users u ON u.id=e.user_id
      ORDER BY e.created_at DESC LIMIT 500`);
    return{events:q.rows};
  });
  app.get('/api/v1/admin/market/tickets',{preHandler:requireAuth},async(req,reply)=>{
    if(!(await hasPermission(pool,auth(req).auth,'operations.read')))return reply.code(403).send({error:'forbidden'});
    const q=await pool.query(`SELECT t.*,u.email,COALESCE(p.title,'') product_title,COALESCE(s.name,'') store_name
      FROM market_tickets t LEFT JOIN platform_users u ON u.id=t.user_id
      LEFT JOIN market_products p ON p.id=t.product_id LEFT JOIN market_stores s ON s.id=t.store_id
      ORDER BY t.updated_at DESC LIMIT 500`);
    return{tickets:q.rows};
  });
  app.get('/api/v1/admin/market/tickets/:id',{preHandler:requireAuth},async(req,reply)=>{
    if(!(await hasPermission(pool,auth(req).auth,'operations.read')))return reply.code(403).send({error:'forbidden'});
    const id=Number((req.params as any).id);
    const t=await pool.query(`SELECT t.*,u.email,p.title product_title,s.name store_name FROM market_tickets t
      LEFT JOIN platform_users u ON u.id=t.user_id LEFT JOIN market_products p ON p.id=t.product_id LEFT JOIN market_stores s ON s.id=t.store_id
      WHERE t.id=$1`,[id]);
    if(!t.rows[0])return reply.code(404).send({error:'ticket_not_found'});
    return{ticket:t.rows[0],messages:(await pool.query('SELECT * FROM market_ticket_messages WHERE ticket_id=$1 ORDER BY created_at',[id])).rows};
  });
  app.post('/api/v1/admin/market/tickets/:id/reply',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req);if(!(await hasPermission(pool,a.auth,'approvals.write')))return reply.code(403).send({error:'forbidden'});
    const id=Number((req.params as any).id),b=(req.body??{}) as any;
    if(!Number.isSafeInteger(id)||typeof b.message!=='string'||!b.message.trim()||b.message.length>10000)return reply.code(400).send({error:'invalid_message'});
    const uid=await pool.query('SELECT id FROM platform_users WHERE identity_id=$1 LIMIT 1',[a.auth.sub]);
    const q=await pool.query(`INSERT INTO market_ticket_messages(ticket_id,author_identity_id,author_user_id,author_type,message)
      VALUES($1,$2,$3,'admin',$4) RETURNING *`,[id,a.auth.sub,uid.rows[0]?.id??null,b.message.trim()]);
    await pool.query("UPDATE market_tickets SET status='answered',updated_at=NOW() WHERE id=$1",[id]);
    return{message:q.rows[0]};
  });
  app.patch('/api/v1/admin/market/tickets/:id',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req);if(!(await hasPermission(pool,a.auth,'approvals.write')))return reply.code(403).send({error:'forbidden'});
    const id=Number((req.params as any).id),status=(req.body as any)?.status;
    if(!Number.isSafeInteger(id)||!['open','pending','answered','closed'].includes(status))return reply.code(400).send({error:'invalid_status'});
    const q=await pool.query('UPDATE market_tickets SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING *',[status,id]);
    if(!q.rows[0])return reply.code(404).send({error:'ticket_not_found'});
    return{ticket:q.rows[0]};
  });
}
