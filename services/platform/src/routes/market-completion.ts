import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';
import { ensurePlatformUser, requireAuth, type AuthClaims } from '../auth.js';
import { hasPermission } from '../permissions.js';

type R=FastifyRequest&{auth:AuthClaims};
const auth=(r:FastifyRequest)=>r as R;
const admin=async(pool:Pool,r:FastifyRequest,permission='operations.read')=>hasPermission(pool,auth(r).auth,permission);

export function registerMarketCompletionRoutes(app:FastifyInstance,pool:Pool){
  app.get('/api/v1/market/me/ai-history',{preHandler:requireAuth},async(req)=>{
    const uid=await ensurePlatformUser(pool,auth(req).auth);
    const cs=(await pool.query('SELECT id,workflow_code,title,created_at,updated_at FROM market_ai_conversations WHERE user_id=$1 ORDER BY updated_at DESC LIMIT 50',[uid])).rows;
    const ids=cs.map((x:any)=>Number(x.id));
    const ms=ids.length?(await pool.query('SELECT conversation_id,role,content,product_ids,created_at FROM market_ai_messages WHERE conversation_id=ANY($1::bigint[]) ORDER BY created_at DESC LIMIT 300',[ids])).rows:[];
    return{conversations:cs,messages:ms};
  });

  app.post('/api/v1/market/ai/audit',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),uid=await ensurePlatformUser(pool,a.auth),b=(req.body??{}) as any;
    const productId=Number(b.productId); const storeId=Number(b.storeId);
    if(!Number.isSafeInteger(productId)||productId<=0)return reply.code(400).send({error:'invalid_product'});
    const q=await pool.query(`SELECT p.id,p.title,p.description,p.brand,p.product_type,p.specs,p.source_url,
      p.classification_status,p.classification_confidence,p.match_confidence,p.match_method,
      c.name_fa category_name,
      COALESCE((SELECT json_agg(json_build_object('store',s.name,'domain',s.domain,'price',o.price,'currency',o.currency,'availability',o.availability,'raw',o.raw_metadata) ORDER BY o.price)
        FROM market_offers o JOIN market_stores s ON s.id=o.store_id WHERE o.product_id=p.id AND s.active=true),'[]'::json) offers,
      COALESCE((SELECT json_agg(json_build_object('rating',r.rating,'title',r.title,'body',r.body) ORDER BY r.created_at DESC)
        FROM market_reviews r WHERE r.product_id=p.id AND r.status='published'),'[]'::json) reviews
      FROM market_products p LEFT JOIN market_categories c ON c.id=p.category_id WHERE p.id=$1 AND p.status='published'`,[productId]);
    if(!q.rows[0])return reply.code(404).send({error:'product_not_found'});
    const sourceRows=storeId
      ? (await pool.query('SELECT s.name,s.domain,ss.source_name,ss.source_type,ss.adapter,ss.last_status,ss.last_item_count,ss.last_error FROM market_stores s LEFT JOIN market_store_sources ss ON ss.store_id=s.id WHERE s.id=$1',[storeId])).rows
      : [];
    const input=JSON.stringify({product:q.rows[0],storeSources:sourceRows});
    const result=await app.inject({method:'POST',url:'/api/v1/ai/execute',headers:{authorization:req.headers.authorization??''},payload:{workflowCode:'market.audit',input,sourceType:'market',sourceId:String(productId)}});
    if(result.statusCode>=400)return reply.code(502).send({error:'market_ai_unavailable'});
    const out=result.json() as any;
    await pool.query('INSERT INTO market_activity_log(identity_id,user_id,event_type,product_id,store_id,metadata) VALUES($1,$2,\'ai_audit\',$3,$4,$5)',[a.auth.sub,uid,productId,storeId||null,JSON.stringify({workflowCode:'market.audit'})]);
    return out;
  });

  app.get('/api/v1/market/seo',async(req,reply)=>{
    const q=req.query as any; const type=String(q.type??'home'); const id=q.id?Number(q.id):null;
    if(!['home','category','product','store'].includes(type))return reply.code(400).send({error:'invalid_type'});
    const r=await pool.query('SELECT * FROM market_seo_metadata WHERE entity_type=$1 AND (($2::bigint IS NULL AND entity_id IS NULL) OR entity_id=$2) LIMIT 1',[type,id]);
    if(r.rows[0])return{seo:r.rows[0]};
    if(type==='product'&&id){
      const p=(await pool.query(`SELECT p.id,p.title,p.description,p.brand,c.name_fa category_name FROM market_products p LEFT JOIN market_categories c ON c.id=p.category_id WHERE p.id=$1 AND p.status='published'`,[id])).rows[0];
      if(!p)return reply.code(404).send({error:'not_found'});
      const title=`${p.title} | مقایسه قیمت آن مارکت`;
      const description=String(p.description||`قیمت و پیشنهادهای ${p.title} از فروشگاه‌های واقعی در آن مارکت.`).replace(/<[^>]+>/g,'').slice(0,155);
      const keywords=[p.title,p.brand,p.category_name,'قیمت','مقایسه قیمت','خرید'].filter(Boolean);
      return{seo:{entity_type:type,entity_id:id,canonical_path:`/market/product/${id}`,title,description,keywords,hashtags:keywords.map((x:string)=>'#'+x.replace(/\\s+/g,'')),robots:'index,follow'}};
    }
    if(type==='store'&&id){
      const s=(await pool.query('SELECT id,name,domain,slug FROM market_stores WHERE id=$1 AND active=true',[id])).rows[0];
      if(!s)return reply.code(404).send({error:'not_found'});
      return{seo:{entity_type:type,entity_id:id,canonical_path:`/market/store/${s.slug}`,title:`${s.name} | فروشگاه آن مارکت`,description:`مشاهده پیشنهادهای ${s.name} در آن مارکت.`,keywords:[s.name,'فروشگاه آنلاین','آن مارکت'],hashtags:['#آن_مارکت','#'+s.slug],robots:'index,follow'}};
    }
    if(type==='category'&&id){
      const c=(await pool.query('SELECT id,name_fa,slug FROM market_categories WHERE id=$1 AND active=true',[id])).rows[0];
      if(!c)return reply.code(404).send({error:'not_found'});
      return{seo:{entity_type:type,entity_id:id,canonical_path:`/market/category/${c.slug}`,title:`${c.name_fa} | آن مارکت`,description:`مقایسه محصولات و قیمت‌های ${c.name_fa} از فروشگاه‌های واقعی در آن مارکت.`,keywords:[c.name_fa,'قیمت','مقایسه قیمت'],hashtags:['#آن_مارکت','#'+c.slug],robots:'index,follow'}};
    }
    return{seo:{entity_type:type,entity_id:id,canonical_path:'/market',title:'آن مارکت | مقایسه قیمت فروشگاه‌های واقعی',description:'مقایسه قیمت و پیشنهاد محصولات از فروشگاه‌های واقعی در آن مارکت.',keywords:['آن مارکت','مقایسه قیمت','فروشگاه آنلاین'],hashtags:['#آن_مارکت','#مقایسه_قیمت'],robots:'index,follow'}};
  });

  app.get('/api/v1/market/sitemap.xml',async(_req,reply)=>{
    const base=process.env.PUBLIC_WEB_URL||'https://anpardaz.ir';
    const rows=await pool.query(`SELECT canonical_path,updated_at FROM market_seo_metadata WHERE robots='index,follow'
      UNION ALL SELECT '/market',NOW()
      UNION ALL SELECT '/market/product/'||p.id,NOW() FROM market_products p WHERE p.status='published'
      UNION ALL SELECT '/market/category/'||c.slug,NOW() FROM market_categories c WHERE c.active=true
      UNION ALL SELECT '/market/store/'||s.slug,NOW() FROM market_stores s WHERE s.active=true
      ORDER BY canonical_path LIMIT 50000`);
    const urls=rows.rows.map((r:any)=>`<url><loc>${base.replace(/\/$/,'')}${String(r.canonical_path).startsWith('/')?r.canonical_path:'/'+r.canonical_path}</loc><lastmod>${new Date(r.updated_at).toISOString()}</lastmod></url>`).join('');
    return reply.type('application/xml; charset=utf-8').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
  });

  app.get('/api/v1/market/robots.txt',async(_req,reply)=>{
    const base=process.env.PUBLIC_WEB_URL||'https://anpardaz.ir';
    return reply.type('text/plain; charset=utf-8').send(`User-agent: *\\nAllow: /market\\nSitemap: ${base.replace(/\/$/,'')}/api/v1/market/sitemap.xml\\n`);
  });

  app.get('/api/v1/admin/market/activity',{preHandler:requireAuth},async(req,reply)=>{
    if(!(await admin(pool,req)))return reply.code(403).send({error:'forbidden'});
    const q=req.query as any,limit=Math.min(5000,Math.max(1,Number(q.limit)||500));
    const params:any[]=[];const where:string[]=[];
    if(q.userId&&Number.isSafeInteger(Number(q.userId))){params.push(Number(q.userId));where.push('a.user_id=$'+params.length);}
    if(typeof q.eventType==='string'&&q.eventType){params.push(q.eventType);where.push('a.event_type=$'+params.length);}
    if(typeof q.from==='string'){params.push(q.from);where.push('a.created_at>=$'+params.length);}
    if(typeof q.to==='string'){params.push(q.to);where.push('a.created_at<$'+params.length);}
    params.push(limit);
    const w=where.length?'WHERE '+where.join(' AND '):'';
    return{activities:(await pool.query(`SELECT a.*,u.email,p.title product_title,s.name store_name FROM market_activity_log a LEFT JOIN platform_users u ON u.id=a.user_id LEFT JOIN market_products p ON p.id=a.product_id LEFT JOIN market_stores s ON s.id=a.store_id ${w} ORDER BY a.created_at DESC LIMIT $${params.length}`,params)).rows};
  });

  app.get('/api/v1/admin/market/search-history',{preHandler:requireAuth},async(req,reply)=>{
    if(!(await admin(pool,req)))return reply.code(403).send({error:'forbidden'});
    const limit=Math.min(5000,Math.max(1,Number((req.query as any).limit)||500));
    return{searches:(await pool.query(`SELECT s.*,u.email FROM market_user_searches s LEFT JOIN platform_users u ON u.id=s.user_id ORDER BY s.created_at DESC LIMIT $1`,[limit])).rows};
  });

  app.get('/api/v1/admin/market/readiness',{preHandler:requireAuth},async(req,reply)=>{
    if(!(await admin(pool,req)))return reply.code(403).send({error:'forbidden'});
    const [stores,products,offers,lastSync,ai]=await Promise.all([
      pool.query(`SELECT COUNT(*)::int total,COUNT(*) FILTER(WHERE verification_status='verified')::int verified,COUNT(*) FILTER(WHERE discovery_status='connected')::int connected,COUNT(*) FILTER(WHERE active=true)::int active FROM market_stores`),
      pool.query(`SELECT COUNT(*)::int total,COUNT(*) FILTER(WHERE status='published')::int published FROM market_products`),
      pool.query(`SELECT COUNT(*)::int total,COUNT(*) FILTER(WHERE availability<>'out_of_stock')::int live FROM market_offers`),
      pool.query(`SELECT MAX(completed_at) last_completed_at FROM market_sync_runs WHERE status='succeeded'`),
      pool.query(`SELECT name,enabled,model_policy->>'default_model' default_model,secret_ref FROM ai_providers WHERE name IN ('openai','gemini','openai_compatible') ORDER BY priority`)
    ]);
    return {stores:stores.rows[0],products:products.rows[0],offers:offers.rows[0],lastSync:lastSync.rows[0]?.last_completed_at??null,ai:ai.rows.map((x:any)=>({...x,keyConfigured:Boolean(x.secret_ref&&process.env[x.secret_ref])}))};
  });

  app.get('/api/v1/admin/market/ai-history',{preHandler:requireAuth},async(req,reply)=>{
    if(!(await admin(pool,req)))return reply.code(403).send({error:'forbidden'});
    const limit=Math.min(2000,Math.max(1,Number((req.query as any).limit)||300));
    return{conversations:(await pool.query(`SELECT c.*,u.email,COUNT(m.id)::int message_count FROM market_ai_conversations c LEFT JOIN platform_users u ON u.id=c.user_id LEFT JOIN market_ai_messages m ON m.conversation_id=c.id GROUP BY c.id,u.email ORDER BY c.updated_at DESC LIMIT $1`,[limit])).rows};
  });

  app.post('/api/v1/admin/market/categories',{preHandler:requireAuth},async(req,reply)=>{
    if(!(await admin(pool,req,'approvals.write')))return reply.code(403).send({error:'forbidden'});
    const b=(req.body??{}) as any; const name=String(b.name??'').trim(),nameFa=String(b.nameFa??'').trim(),slug=String(b.slug??'').trim();
    if(!name||!nameFa||!slug)return reply.code(400).send({error:'invalid_category'});
    const parentId=b.parentId?Number(b.parentId):null;
    const q=await pool.query('INSERT INTO market_categories(parent_id,slug,name,name_fa,icon,sort_order,active) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[Number.isSafeInteger(parentId)?parentId:null,slug,name,nameFa,typeof b.icon==='string'?b.icon:null,Number(b.sortOrder)||0,b.active!==false]);
    return reply.code(201).send({category:q.rows[0]});
  });

  app.patch('/api/v1/admin/market/categories/:id',{preHandler:requireAuth},async(req,reply)=>{
    if(!(await admin(pool,req,'approvals.write')))return reply.code(403).send({error:'forbidden'});
    const id=Number((req.params as any).id),b=(req.body??{}) as any;
    if(!Number.isSafeInteger(id)||id<=0)return reply.code(400).send({error:'invalid_category'});
    const q=await pool.query('UPDATE market_categories SET parent_id=COALESCE($1,parent_id),name=COALESCE($2,name),name_fa=COALESCE($3,name_fa),icon=COALESCE($4,icon),sort_order=COALESCE($5,sort_order),active=COALESCE($6,active) WHERE id=$7 RETURNING *',[b.parentId===null?null:(Number.isSafeInteger(Number(b.parentId))?Number(b.parentId):null),typeof b.name==='string'?b.name.trim():null,typeof b.nameFa==='string'?b.nameFa.trim():null,typeof b.icon==='string'?b.icon:null,Number.isFinite(Number(b.sortOrder))?Number(b.sortOrder):null,typeof b.active==='boolean'?b.active:null,id]);
    if(!q.rows[0])return reply.code(404).send({error:'category_not_found'});
    return{category:q.rows[0]};
  });

  app.get('/api/v1/admin/market/product-types',{preHandler:requireAuth},async(req,reply)=>{
    if(!(await admin(pool,req)))return reply.code(403).send({error:'forbidden'});
    return{types:(await pool.query('SELECT t.*,c.name_fa category_name FROM market_product_types t LEFT JOIN market_categories c ON c.id=t.category_id ORDER BY t.sort_order,t.id')).rows};
  });

  app.get('/api/v1/admin/market/categories',{preHandler:requireAuth},async(req,reply)=>{
    if(!(await admin(pool,req)))return reply.code(403).send({error:'forbidden'});
    return{categories:(await pool.query(`SELECT c.*,COUNT(p.id)::int product_count FROM market_categories c LEFT JOIN market_products p ON p.category_id=c.id GROUP BY c.id ORDER BY c.parent_id NULLS FIRST,c.sort_order,c.id`)).rows};
  });

  app.get('/api/v1/admin/market/export/activity.csv',{preHandler:requireAuth},async(req,reply)=>{
    if(!(await admin(pool,req)))return reply.code(403).send({error:'forbidden'});
    const rows=(await pool.query(`SELECT a.id,a.user_id,u.email,a.event_type,a.surface,a.product_id,p.title product_title,a.store_id,s.name store_name,a.operation_id,a.metadata,a.created_at
      FROM market_activity_log a LEFT JOIN platform_users u ON u.id=a.user_id LEFT JOIN market_products p ON p.id=a.product_id LEFT JOIN market_stores s ON s.id=a.store_id ORDER BY a.created_at DESC LIMIT 50000`)).rows;
    const esc=(v:any)=>'"'+String(v??'').replace(/"/g,'""')+'"';
    const csv=['id,user_id,email,event_type,surface,product_id,product_title,store_id,store_name,operation_id,metadata,created_at',...rows.map((r:any)=>[r.id,r.user_id,r.email,r.event_type,r.surface,r.product_id,r.product_title,r.store_id,r.store_name,r.operation_id,JSON.stringify(r.metadata),r.created_at].map(esc).join(','))].join('\n');
    return reply.type('text/csv; charset=utf-8').send(csv);
  });
}
