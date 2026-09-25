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
  app.patch('/api/v1/admin/market/stores/:id',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req);if(!(await hasPermission(pool,a.auth,'approvals.write')))return reply.code(403).send({error:'forbidden'});
    const id=Number((req.params as any).id),b=(req.body??{}) as any;
    if(!Number.isSafeInteger(id)||id<=0)return reply.code(400).send({error:'invalid_store'});
    if(b.feedType!==undefined&&!['manual','json','xml','rss','api','crawler'].includes(b.feedType))return reply.code(400).send({error:'invalid_feed_type'});
    if(b.iframeMode!==undefined&&!['allowed','blocked','unknown'].includes(b.iframeMode))return reply.code(400).send({error:'invalid_iframe_mode'});
    if(b.verificationStatus!==undefined&&!['pending','verified','blocked','rejected'].includes(b.verificationStatus))return reply.code(400).send({error:'invalid_verification_status'});
    const q=await pool.query(`UPDATE market_stores SET active=COALESCE($1,active),feed_type=COALESCE($2,feed_type),feed_url=COALESCE($3,feed_url),iframe_mode=COALESCE($4,iframe_mode),verification_status=COALESCE($5,verification_status),verified_at=CASE WHEN $5='verified' THEN NOW() WHEN $5 IS NOT NULL THEN NULL ELSE verified_at END,updated_at=NOW() WHERE id=$6 RETURNING id,name,domain,active,feed_type,feed_url,iframe_mode,verification_status,verified_at`,
      [typeof b.active==='boolean'?b.active:null,b.feedType??null,typeof b.feedUrl==='string'?b.feedUrl.trim()||null:null,b.iframeMode??null,b.verificationStatus??null,id]);
    if(!q.rows[0])return reply.code(404).send({error:'store_not_found'});
    return {store:q.rows[0]};
  });

  app.put('/api/v1/admin/market/sources',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req);if(!(await hasPermission(pool,a.auth,'approvals.write')))return reply.code(403).send({error:'forbidden'});
    const b=(req.body??{}) as any,storeId=Number(b.storeId);
    if(!Number.isSafeInteger(storeId)||storeId<=0||typeof b.sourceName!=='string'||!b.sourceName.trim())return reply.code(400).send({error:'invalid_source'});
    if(!['json','xml','rss','api','crawler'].includes(b.sourceType))return reply.code(400).send({error:'invalid_source_type'});
    if(b.endpointUrl!==undefined&&b.endpointUrl!==null){try{const u=new URL(String(b.endpointUrl));if(!['https:','http:'].includes(u.protocol))throw 0;}catch{return reply.code(400).send({error:'invalid_endpoint_url'});}}
    const q=await pool.query(`INSERT INTO market_store_sources(store_id,source_name,source_type,endpoint_url,enabled,mapping,schedule_cron)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT(store_id,source_name) DO UPDATE SET source_type=EXCLUDED.source_type,endpoint_url=EXCLUDED.endpoint_url,enabled=EXCLUDED.enabled,mapping=EXCLUDED.mapping,schedule_cron=EXCLUDED.schedule_cron,updated_at=NOW()
      RETURNING *`,
      [storeId,b.sourceName.trim().slice(0,120),b.sourceType,b.endpointUrl??null,b.enabled!==false,JSON.stringify(b.mapping??{}),typeof b.scheduleCron==='string'?b.scheduleCron.trim().slice(0,120):null]);
    return {source:q.rows[0]};
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
  app.get('/api/v1/admin/market/merchant-report',{preHandler:requireAuth},async(req,reply)=>{
    if(!(await hasPermission(pool,auth(req).auth,'operations.read')))return reply.code(403).send({error:'forbidden'});
    const q=req.query as any;
    const params:any[]=[];const where:string[]=[];
    if(typeof q.from==='string'){params.push(q.from);where.push('e.created_at >= $'+params.length);}
    if(typeof q.to==='string'){params.push(q.to);where.push('e.created_at < $'+params.length);}
    if(q.storeId&&Number.isSafeInteger(Number(q.storeId))){params.push(Number(q.storeId));where.push('e.store_id = $'+params.length);}
    const w=where.length?'WHERE '+where.join(' AND '):'';
    const sql=`SELECT e.store_id,s.name store_name,
      COUNT(*) FILTER(WHERE e.event_type='clickout')::int clickout_count,
      COUNT(DISTINCT e.user_id) FILTER(WHERE e.event_type='clickout')::int unique_users,
      COUNT(DISTINCT e.product_id) FILTER(WHERE e.event_type='clickout')::int unique_products,
      COUNT(*) FILTER(WHERE e.event_type='clickout' AND e.metadata->>'surface'='mobile')::int mobile_clickouts,
      COUNT(*) FILTER(WHERE e.event_type='clickout' AND e.metadata->>'surface'='web')::int web_clickouts,
      COUNT(*) FILTER(WHERE e.event_type='purchase_reported')::int purchases_reported,
      COALESCE(SUM(CASE WHEN e.event_type='purchase_reported' THEN NULLIF(e.metadata->>'amount','')::numeric ELSE 0 END),0)::numeric purchase_amount,
      COALESCE(r.commission_type,'percent') commission_type,
      COALESCE(r.commission_value,0)::numeric commission_value,
      CASE
        WHEN COALESCE(r.commission_type,'percent')='percent'
          THEN COALESCE(SUM(CASE WHEN e.event_type='purchase_reported' THEN NULLIF(e.metadata->>'amount','')::numeric ELSE 0 END),0)*COALESCE(r.commission_value,0)/100
        ELSE COUNT(*) FILTER(WHERE e.event_type='purchase_reported')*COALESCE(r.commission_value,0)
      END::numeric estimated_commission
      FROM market_purchase_events e
      LEFT JOIN market_stores s ON s.id=e.store_id
      LEFT JOIN LATERAL (
        SELECT commission_type,commission_value
        FROM market_merchant_commission_rules rr
        WHERE rr.store_id=e.store_id AND rr.active=true
          AND rr.valid_from<=NOW() AND (rr.valid_to IS NULL OR rr.valid_to>NOW())
        ORDER BY rr.valid_from DESC,rr.id DESC LIMIT 1
      ) r ON TRUE
      ${w}
      GROUP BY e.store_id,s.name,r.commission_type,r.commission_value
      ORDER BY clickout_count DESC`;
    const rows=(await pool.query(sql,params)).rows.map((r:any)=>({
      ...r,
      estimated_commission:String(r.estimated_commission??'0')
    }));
    const totals=rows.reduce((a:any,r:any)=>({
      clickouts:a.clickouts+Number(r.clickout_count||0),
      users:a.users+Number(r.unique_users||0),
      products:a.products+Number(r.unique_products||0),
      purchasesReported:a.purchasesReported+Number(r.purchases_reported||0),
      purchaseAmount:a.purchaseAmount+Number(r.purchase_amount||0),
      estimatedCommission:a.estimatedCommission+Number(r.estimated_commission||0)
    }),{clickouts:0,users:0,products:0,purchasesReported:0,purchaseAmount:0,estimatedCommission:0});
    return{from:q.from??null,to:q.to??null,storeId:q.storeId?Number(q.storeId):null,totals:{...totals,purchaseAmount:String(totals.purchaseAmount),estimatedCommission:String(totals.estimatedCommission)},stores:rows};
  });
}
