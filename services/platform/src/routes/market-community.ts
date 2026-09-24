import type {FastifyInstance,FastifyRequest} from 'fastify';
import type {Pool} from 'pg';
import {ensurePlatformUser,requireAuth,type AuthClaims} from '../auth.js';
import {hasPermission} from '../permissions.js';

type R=FastifyRequest&{auth:AuthClaims};
const a=(r:FastifyRequest)=>r as R;

export function registerMarketCommunityRoutes(app:FastifyInstance,pool:Pool){
  app.get('/api/v1/market/home',async(req)=>{
    const q=req.query as any;
    const limit=Math.min(24,Math.max(4,Number(q.limit)||12));
    const [sections,categories,products,stores]=await Promise.all([
      pool.query("SELECT key,title,subtitle,section_type,query,sort_order FROM market_home_sections WHERE enabled=true ORDER BY sort_order,id"),
      pool.query("SELECT id,parent_id,slug,name,name_fa,icon FROM market_categories WHERE active=true ORDER BY sort_order,id"),
      pool.query(`SELECT p.id,p.title,p.brand,p.description,p.specs,c.slug category_slug,c.name_fa category_name_fa,
        COALESCE(MIN(o.price) FILTER(WHERE s.active=true AND o.availability<>'out_of_stock'),0)::text price_min,
        COUNT(DISTINCT s.id) FILTER(WHERE s.active=true)::int store_count
        FROM market_products p LEFT JOIN market_categories c ON c.id=p.category_id
        LEFT JOIN market_offers o ON o.product_id=p.id LEFT JOIN market_stores s ON s.id=o.store_id
        WHERE p.status='published' GROUP BY p.id,c.id ORDER BY p.updated_at DESC,p.id DESC LIMIT $1`,[limit]),
      pool.query("SELECT id,name,slug,domain,homepage_url,category_hint FROM market_stores WHERE active=true ORDER BY name LIMIT $1",[limit])
    ]);
    return {sections:sections.rows,categories:categories.rows,products:products.rows,stores:stores.rows,generatedAt:new Date().toISOString()};
  });

  // Product review read/write routes live in market-aggregator.ts to avoid duplicate Fastify routes.\n\n  app.post('/api/v1/market/reviews/:id/like',{preHandler:requireAuth},async(req,reply)=>{\n    const uid=await ensurePlatformUser(pool,a(req).auth),id=Number((req.params as any).id);\n    if(!Number.isSafeInteger(id)||id<=0)return reply.code(400).send({error:'invalid_review'});\n    const r=await pool.query("SELECT id FROM market_reviews WHERE id=$1 AND status='published'",[id]);\n    if(!r.rows[0])return reply.code(404).send({error:'review_not_found'});\n    const old=await pool.query("SELECT helpful FROM market_review_votes WHERE review_id=$1 AND user_id=$2",[id,uid]);\n    if(old.rows[0]){await pool.query("DELETE FROM market_review_votes WHERE review_id=$1 AND user_id=$2",[id,uid]);await pool.query("UPDATE market_reviews SET helpful_count=GREATEST(0,helpful_count-1),updated_at=NOW() WHERE id=$1",[id]);return {liked:false};}\n    await pool.query("INSERT INTO market_review_votes(review_id,user_id,helpful) VALUES($1,$2,true)",[id,uid]);\n    await pool.query("UPDATE market_reviews SET helpful_count=helpful_count+1,updated_at=NOW() WHERE id=$1",[id]);\n    return {liked:true};\n  });\n\n  app.get('/api/v1/admin/market/commission-report',{preHandler:requireAuth},async(req,reply)=>{
    const x=a(req);if(!(await hasPermission(pool,x.auth,'operations.read')))return reply.code(403).send({error:'forbidden'});
    const q=req.query as any;
    const from=q.from?new Date(q.from):new Date(Date.now()-30*86400000);
    const to=q.to?new Date(q.to):new Date();
    if(Number.isNaN(from.getTime())||Number.isNaN(to.getTime())||from>=to)return reply.code(400).send({error:'invalid_period'});
    const params:any[]=[from,to];let filter='c.created_at >= $1 AND c.created_at < $2';
    if(q.storeId){params.push(Number(q.storeId));filter+=' AND c.store_id=$'+params.length;}
    const r=await pool.query(`SELECT s.id store_id,s.name store_name,s.domain,
      COUNT(*)::int clickout_count,
      COUNT(*) FILTER(WHERE c.mode='iframe')::int iframe_count,
      COUNT(DISTINCT c.user_id)::int unique_users,
      COUNT(DISTINCT c.product_id)::int unique_products,
      COUNT(*) FILTER(WHERE c.surface='mobile')::int mobile_clickouts,
      COUNT(*) FILTER(WHERE c.surface='web')::int web_clickouts,
      MAX(r.commission_type) commission_type,MAX(r.commission_value) commission_value,
      CASE WHEN MAX(r.commission_type)='fixed' THEN COUNT(*)*MAX(r.commission_value)
           WHEN MAX(r.commission_type)='percent' THEN COUNT(*)*MAX(r.commission_value)/100 ELSE 0 END estimated_commission
      FROM market_clickouts c JOIN market_stores s ON s.id=c.store_id
      LEFT JOIN market_merchant_commission_rules r ON r.store_id=s.id AND r.active=true
        AND r.valid_from<=c.created_at AND (r.valid_to IS NULL OR r.valid_to>c.created_at)
      WHERE ${filter} GROUP BY s.id ORDER BY clickout_count DESC`,params);
    const totals=await pool.query(`SELECT COUNT(*)::int clickouts,COUNT(DISTINCT user_id)::int users,COUNT(DISTINCT product_id)::int products FROM market_clickouts c WHERE ${filter}`,params);
    return {from,to,stores:r.rows,totals:totals.rows[0],note:'clickout is a tracked outbound purchase-intent event; it is not proof that checkout or payment completed.'};
  });

  app.get('/api/v1/admin/market/commission-report.csv',{preHandler:requireAuth},async(req,reply)=>{
    if(!(await hasPermission(pool,a(req).auth,'operations.read')))return reply.code(403).send({error:'forbidden'});
    const q=req.query as any;
    const from=q.from?new Date(q.from):new Date(Date.now()-30*86400000);
    const to=q.to?new Date(q.to):new Date();
    if(Number.isNaN(from.getTime())||Number.isNaN(to.getTime())||from>=to)return reply.code(400).send({error:'invalid_period'});
    const r=await pool.query(`SELECT s.name store_name,s.domain,COUNT(*)::int clickouts,COUNT(DISTINCT c.user_id)::int unique_users,COUNT(DISTINCT c.product_id)::int unique_products,COUNT(*) FILTER(WHERE c.surface='mobile')::int mobile_clickouts,COUNT(*) FILTER(WHERE c.surface='web')::int web_clickouts,MAX(cr.commission_type) commission_type,MAX(cr.commission_value) commission_value,
      CASE WHEN MAX(cr.commission_type)='fixed' THEN COUNT(*)*MAX(cr.commission_value) WHEN MAX(cr.commission_type)='percent' THEN COUNT(*)*MAX(cr.commission_value)/100 ELSE 0 END estimated_commission
      FROM market_clickouts c JOIN market_stores s ON s.id=c.store_id
      LEFT JOIN market_merchant_commission_rules cr ON cr.store_id=s.id AND cr.active=true AND cr.valid_from<=c.created_at AND (cr.valid_to IS NULL OR cr.valid_to>c.created_at)
      WHERE c.created_at >= $1 AND c.created_at < $2 GROUP BY s.id ORDER BY clickouts DESC`,[from,to]);
    const esc=(v:any)=>`"${String(v??'').replace(/"/g,'""')}"`;
    const lines=[
      ['store','domain','clickouts','unique_users','unique_products','mobile_clickouts','web_clickouts','commission_type','commission_value','estimated_commission'].join(','),
      ...r.rows.map((x:any)=>[x.store_name,x.domain,x.clickouts,x.unique_users,x.unique_products,x.mobile_clickouts,x.web_clickouts,x.commission_type??'',x.commission_value??'',x.estimated_commission??0].map(esc).join(','))
    ];
    await pool.query("INSERT INTO market_merchant_report_exports(store_id,from_at,to_at,format,requested_by) VALUES(NULL,$1,$2,'csv',(SELECT id FROM platform_users WHERE identity_id=$3 LIMIT 1))",[from,to,a(req).auth.sub]);
    return reply.header('content-type','text/csv; charset=utf-8').header('content-disposition','attachment; filename="an-market-merchant-report.csv"').send("\uFEFF"+lines.join("\n"));
  });

  app.get('/api/v1/admin/market/reviews',{preHandler:requireAuth},async(req,reply)=>{
    if(!(await hasPermission(pool,a(req).auth,'operations.read')))return reply.code(403).send({error:'forbidden'});
    const status=String((req.query as any)?.status||'pending');
    const allowed=['pending','published','rejected','hidden'];if(!allowed.includes(status))return reply.code(400).send({error:'invalid_status'});
    return {reviews:(await pool.query(`SELECT r.*,p.title product_title,u.email FROM market_reviews r JOIN market_products p ON p.id=r.product_id JOIN platform_users u ON u.id=r.user_id WHERE r.status=$1 ORDER BY r.created_at DESC LIMIT 500`,[status])).rows};
  });

  app.patch('/api/v1/admin/market/reviews/:id',{preHandler:requireAuth},async(req,reply)=>{
    if(!(await hasPermission(pool,a(req).auth,'approvals.write')))return reply.code(403).send({error:'forbidden'});
    const id=Number((req.params as any).id),status=(req.body as any)?.status;
    if(!Number.isSafeInteger(id)||!['pending','published','rejected','hidden'].includes(status))return reply.code(400).send({error:'invalid_review_status'});
    const q=await pool.query("UPDATE market_reviews SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING *",[status,id]);
    if(!q.rows[0])return reply.code(404).send({error:'review_not_found'});
    return {review:q.rows[0]};
  });

  app.patch('/api/v1/admin/market/home/:key',{preHandler:requireAuth},async(req,reply)=>{
    if(!(await hasPermission(pool,a(req).auth,'approvals.write')))return reply.code(403).send({error:'forbidden'});
    const key=String((req.params as any).key||''),b=(req.body??{}) as any;
    if(!key||typeof b.enabled!=='boolean')return reply.code(400).send({error:'invalid_home_section'});
    const q=await pool.query("UPDATE market_home_sections SET enabled=$1,title=COALESCE($2,title),subtitle=COALESCE($3,subtitle),query=COALESCE($4,query),sort_order=COALESCE($5,sort_order),updated_at=NOW() WHERE key=$6 RETURNING *",[b.enabled,typeof b.title==='string'?b.title:null,typeof b.subtitle==='string'?b.subtitle:null,b.query??null,Number.isInteger(b.sortOrder)?b.sortOrder:null,key]);
    if(!q.rows[0])return reply.code(404).send({error:'section_not_found'});
    return {section:q.rows[0]};
  });
}
