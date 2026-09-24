import type { FastifyInstance, FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { ensurePlatformUser, requireAuth, type AuthClaims } from '../auth.js';

type R=FastifyRequest&{auth:AuthClaims};
const auth=(r:FastifyRequest)=>r as R;
const page=(q:any)=>{const p=Math.max(1,Number(q.page)||1),l=Math.min(100,Math.max(1,Number(q.limit)||24));return[p,l,(p-1)*l];};
const surface=(v:any)=>v==='mobile'||v==='admin'?'mobile':v==='web'?'web':'web';

export function registerMarketAggregatorRoutes(app:FastifyInstance,pool:Pool){
  app.get('/api/v1/market/catalog',async(req)=>{
    const q=req.query as any; const [p,l,o]=page(q);
    const params:any[]=[]; const where:string[]=["p.status='published'"];
    if(q.q){params.push('%'+String(q.q).trim().replace(/[%_]/g,'')+'%');where.push('(p.title ILIKE $'+params.length+' OR COALESCE(p.description,\'\') ILIKE $'+params.length+' OR COALESCE(p.brand,\'\') ILIKE $'+params.length+')');}
    if(q.category){params.push(String(q.category));where.push('c.slug=$'+params.length);}
    const lim=params.length+1, off=params.length+2; params.push(l,o);
    const r=await pool.query(`SELECT p.id,p.title,p.description,p.brand,p.condition,p.specs,p.source_url,
      c.slug category_slug,c.name category_name,c.name_fa category_name_fa,
      COALESCE(MIN(o.price) FILTER(WHERE o.availability<>'out_of_stock'),0)::text price_min,
      COALESCE(MAX(o.price) FILTER(WHERE o.availability<>'out_of_stock'),0)::text price_max,
      COUNT(DISTINCT o.store_id)::int store_count,
      COUNT(o.id)::int offer_count
      FROM market_products p
      LEFT JOIN market_categories c ON c.id=p.category_id
      LEFT JOIN market_offers o ON o.product_id=p.id
      WHERE ${where.join(' AND ')}
      GROUP BY p.id,c.id ORDER BY p.updated_at DESC,p.id DESC LIMIT $${lim} OFFSET $${off}`,params);
    const ids=r.rows.map((x:any)=>Number(x.id));
    let media:any[]=[]; let offers:any[]=[];
    if(ids.length){
      const [m,o]=await Promise.all([
        pool.query('SELECT id,product_id,url,sort_order FROM market_media WHERE product_id=ANY($1::bigint[]) ORDER BY product_id,sort_order,id',[ids]),
        pool.query(`SELECT o.id,o.product_id,o.store_id,o.price,o.currency,o.availability,o.shipping_cost,o.product_url,o.image_url,o.updated_at,s.name store_name,s.domain store_domain,s.iframe_mode FROM market_offers o LEFT JOIN market_stores s ON s.id=o.store_id WHERE o.product_id=ANY($1::bigint[]) ORDER BY o.product_id,o.price,o.id`,[ids]),
      ]);
      media=m.rows; offers=o.rows;
    }
    const mediaBy=new Map<number,any[]>(),offersBy=new Map<number,any[]>();
    for(const m of media){const a=mediaBy.get(Number(m.product_id))??[];a.push(m);mediaBy.set(Number(m.product_id),a);}
    for(const o of offers){const a=offersBy.get(Number(o.product_id))??[];a.push(o);offersBy.set(Number(o.product_id),a);}
    return{products:r.rows.map((x:any)=>({...x,priceMin:x.price_min,priceMax:x.price_max,storeCount:x.store_count,offerCount:x.offer_count,media:mediaBy.get(Number(x.id))??[],offers:offersBy.get(Number(x.id))??[]})),pagination:{page:p,limit:l}};
  });

  app.get('/api/v1/market/categories',async()=>({categories:(await pool.query(`SELECT id,parent_id,slug,name,name_fa,icon,sort_order FROM market_categories WHERE active=true ORDER BY sort_order,id`)).rows}));

  app.get('/api/v1/market/stores',async()=>({stores:(await pool.query(`SELECT id,name,slug,domain,homepage_url,category_hint,iframe_mode,active FROM market_stores WHERE active=true ORDER BY name`)).rows}));

  app.get('/api/v1/market/stores/:id/frame',async(req,reply)=>{
    const id=Number((req.params as any).id);
    const r=await pool.query('SELECT id,name,homepage_url,iframe_mode,active FROM market_stores WHERE id=$1',[id]);
    if(!r.rows[0])return reply.code(404).send({error:'store_not_found'});
    if(!r.rows[0].active)return reply.code(410).send({error:'store_inactive'});
    if(r.rows[0].iframe_mode!=='allowed')return reply.code(409).send({error:'iframe_not_allowed',mode:r.rows[0].iframe_mode});
    return{store:r.rows[0]};
  });

  app.post('/api/v1/market/events',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),uid=await ensurePlatformUser(pool,a.auth),b=(req.body??{}) as any;
    if(typeof b.eventType!=='string'||b.eventType.length<2||b.eventType.length>80)return reply.code(400).send({error:'invalid_event'});
    const operationId=typeof b.operationId==='string'&&b.operationId.length>0?b.operationId:randomUUID();
    await pool.query(`INSERT INTO market_user_events(identity_id,user_id,event_type,surface,product_id,offer_id,store_id,metadata,operation_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[a.auth.sub,uid,b.eventType,surface(b.surface),b.productId??null,b.offerId??null,b.storeId??null,JSON.stringify(b.metadata??{}),operationId]);
    return{operationId};
  });

  app.post('/api/v1/market/clickout',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),uid=await ensurePlatformUser(pool,a.auth),b=(req.body??{}) as any;
    const offerId=Number(b.offerId); if(!Number.isSafeInteger(offerId)||offerId<=0)return reply.code(400).send({error:'invalid_offer'});
    const o=await pool.query(`SELECT o.id,o.product_id,o.store_id,o.product_url,o.seller_url,s.homepage_url,s.iframe_mode,s.active
      FROM market_offers o LEFT JOIN market_stores s ON s.id=o.store_id WHERE o.id=$1`,[offerId]);
    if(!o.rows[0]||o.rows[0].active===false)return reply.code(404).send({error:'offer_not_found'});
    const row=o.rows[0],url=row.product_url||row.seller_url||row.homepage_url;
    if(!url)return reply.code(409).send({error:'offer_destination_missing'});
    const operationId=randomUUID(),mode=row.iframe_mode==='allowed'?'iframe':'external';
    await pool.query(`INSERT INTO market_clickouts(identity_id,user_id,product_id,offer_id,store_id,surface,destination_url,mode,session_id,operation_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[a.auth.sub,uid,row.product_id,row.id,row.store_id,surface(b.surface),url,mode,b.sessionId??null,operationId]);
    await pool.query(`INSERT INTO market_purchase_events(identity_id,user_id,product_id,offer_id,store_id,event_type,metadata)
      VALUES($1,$2,$3,$4,$5,'clickout',$6)`,[a.auth.sub,uid,row.product_id,row.id,row.store_id,JSON.stringify({mode,surface:surface(b.surface)})]);
    return{operationId,url,mode};
  });

  app.get('/api/v1/market/products/:id',async(req,reply)=>{
    const id=Number((req.params as any).id);
    if(!Number.isSafeInteger(id)||id<=0)return reply.code(400).send({error:'invalid_id'});
    const p=await pool.query(`SELECT p.id,p.title,p.description,p.brand,p.condition,p.specs,p.source_url,p.updated_at,
      c.slug category_slug,c.name category_name,c.name_fa category_name_fa
      FROM market_products p LEFT JOIN market_categories c ON c.id=p.category_id
      WHERE p.id=$1 AND p.status='published' LIMIT 1`,[id]);
    if(!p.rows[0])return reply.code(404).send({error:'product_not_found'});
    const [media,offers]=await Promise.all([
      pool.query(`SELECT id,url,sort_order FROM market_media WHERE product_id=$1 ORDER BY sort_order,id`,[id]),
      pool.query(`SELECT o.id,o.store_id,o.price,o.currency,o.availability,o.shipping_cost,o.product_url,o.image_url,o.updated_at,
        s.name store_name,s.domain store_domain,s.iframe_mode,s.homepage_url
        FROM market_offers o LEFT JOIN market_stores s ON s.id=o.store_id
        WHERE o.product_id=$1 AND (s.active IS TRUE OR s.id IS NULL)
        ORDER BY o.price,o.id`,[id])
    ]);
    return{product:p.rows[0],media:media.rows,offers:offers.rows};
  });

  app.get('/api/v1/market/me/favorites',{preHandler:requireAuth},async(req)=>{
    const uid=await ensurePlatformUser(pool,auth(req).auth);
    return{products:(await pool.query(`SELECT p.*,c.slug category_slug,c.name_fa category_name_fa FROM market_favorites f JOIN market_products p ON p.id=f.product_id LEFT JOIN market_categories c ON c.id=p.category_id WHERE f.user_id=$1 ORDER BY f.created_at DESC`,[uid])).rows};
  });

  app.get('/api/v1/market/me/clickouts',{preHandler:requireAuth},async(req)=>{
    const uid=await ensurePlatformUser(pool,auth(req).auth);
    return{clickouts:(await pool.query(`SELECT c.id,c.operation_id,c.product_id,c.offer_id,c.store_id,c.mode,c.destination_url,c.created_at,s.name store_name,p.title product_title
      FROM market_clickouts c LEFT JOIN market_stores s ON s.id=c.store_id LEFT JOIN market_products p ON p.id=c.product_id
      WHERE c.user_id=$1 ORDER BY c.created_at DESC LIMIT 100`,[uid])).rows};
  });

  app.get('/api/v1/market/me/tickets',{preHandler:requireAuth},async(req)=>{
    const uid=await ensurePlatformUser(pool,auth(req).auth);
    return{tickets:(await pool.query('SELECT * FROM market_tickets WHERE user_id=$1 ORDER BY updated_at DESC',[uid])).rows};
  });

  app.post('/api/v1/market/tickets',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),uid=await ensurePlatformUser(pool,a.auth),b=(req.body??{}) as any;
    if(typeof b.subject!=='string'||b.subject.trim().length<3||b.subject.length>200||typeof b.message!=='string'||b.message.trim().length<1||b.message.length>10000)return reply.code(400).send({error:'invalid_ticket'});
    const operationId=randomUUID();
    const client=await pool.connect();
    try{await client.query('BEGIN');
      const t=await client.query(`INSERT INTO market_tickets(user_id,subject,priority,product_id,offer_id,store_id,order_id,operation_id)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[uid,b.subject.trim(),['low','normal','high','urgent'].includes(b.priority)?b.priority:'normal',b.productId??null,b.offerId??null,b.storeId??null,b.orderId??null,operationId]);
      await client.query(`INSERT INTO market_ticket_messages(ticket_id,author_identity_id,author_user_id,author_type,message)
        VALUES($1,$2,$3,'user',$4)`,[t.rows[0].id,a.auth.sub,uid,b.message.trim()]);
      await client.query('COMMIT'); return reply.code(201).send({ticket:t.rows[0],operationId});
    }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
  });

  app.get('/api/v1/market/me/tickets/:id',{preHandler:requireAuth},async(req,reply)=>{
    const uid=await ensurePlatformUser(pool,auth(req).auth),id=Number((req.params as any).id);
    const t=await pool.query('SELECT * FROM market_tickets WHERE id=$1 AND user_id=$2',[id,uid]);
    if(!t.rows[0])return reply.code(404).send({error:'ticket_not_found'});
    return{ticket:t.rows[0],messages:(await pool.query('SELECT * FROM market_ticket_messages WHERE ticket_id=$1 ORDER BY created_at',[id])).rows};
  });

  app.post('/api/v1/market/products/:id/view',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),uid=await ensurePlatformUser(pool,a.auth),id=Number((req.params as any).id);
    if(!Number.isSafeInteger(id)||id<=0)return reply.code(400).send({error:'invalid_id'});
    const exists=await pool.query("SELECT 1 FROM market_products WHERE id=$1 AND status<>'archived' LIMIT 1",[id]);
    if(!exists.rows[0])return reply.code(404).send({error:'product_not_found'});
    await pool.query('INSERT INTO market_recent_views(identity_id,user_id,product_id) VALUES($1,$2,$3)',[a.auth.sub,uid,id]);
    await pool.query("INSERT INTO market_user_events(identity_id,user_id,event_type,surface,product_id,metadata) VALUES($1,$2,'view',$3,$4,$5)",[a.auth.sub,uid,surface((req.body as any)?.surface),id,JSON.stringify({source:'product_view'})]);
    return{ok:true};
  });

  app.get('/api/v1/market/me/recent',{preHandler:requireAuth},async(req)=>{
    const uid=await ensurePlatformUser(pool,auth(req).auth);
    return{products:(await pool.query("SELECT DISTINCT ON (p.id) p.*,c.slug category_slug,c.name_fa category_name_fa FROM market_recent_views v JOIN market_products p ON p.id=v.product_id LEFT JOIN market_categories c ON c.id=p.category_id WHERE v.user_id=$1 ORDER BY p.id,v.viewed_at DESC LIMIT 100",[uid])).rows};
  });

  app.get('/api/v1/market/me/alerts',{preHandler:requireAuth},async(req)=>{
    const uid=await ensurePlatformUser(pool,auth(req).auth);
    return{alerts:(await pool.query("SELECT a.*,p.title,p.description,p.brand FROM market_price_alerts a JOIN market_products p ON p.id=a.product_id WHERE a.user_id=$1 ORDER BY a.updated_at DESC",[uid])).rows};
  });

  app.post('/api/v1/market/me/alerts',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),uid=await ensurePlatformUser(pool,a.auth),b=(req.body??{}) as any,id=Number(b.productId),target=Number(b.targetPrice);
    if(!Number.isSafeInteger(id)||id<=0||!Number.isFinite(target)||target<=0)return reply.code(400).send({error:'invalid_alert'});
    const q=await pool.query("INSERT INTO market_price_alerts(identity_id,user_id,product_id,target_price,currency) VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id,product_id) DO UPDATE SET target_price=EXCLUDED.target_price,enabled=true,updated_at=NOW() RETURNING *",[a.auth.sub,uid,id,target,String(b.currency??'IRR').slice(0,3)]);
    return{alert:q.rows[0]};
  });

  app.delete('/api/v1/market/me/alerts/:productId',{preHandler:requireAuth},async(req)=>{
    const uid=await ensurePlatformUser(pool,auth(req).auth),id=Number((req.params as any).productId);
    await pool.query('DELETE FROM market_price_alerts WHERE user_id=$1 AND product_id=$2',[uid,id]); return{deleted:true};
  });

  app.get('/api/v1/market/me/comparisons',{preHandler:requireAuth},async(req)=>{
    const uid=await ensurePlatformUser(pool,auth(req).auth);
    return{comparisons:(await pool.query("SELECT c.id,c.title,c.created_at,c.updated_at,COALESCE(json_agg(json_build_object('productId',i.product_id,'position',i.position) ORDER BY i.position) FILTER(WHERE i.product_id IS NOT NULL),'[]'::json) items FROM market_saved_comparisons c LEFT JOIN market_saved_comparison_items i ON i.comparison_id=c.id WHERE c.user_id=$1 GROUP BY c.id ORDER BY c.updated_at DESC",[uid])).rows};
  });

  app.post('/api/v1/market/me/comparisons',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),uid=await ensurePlatformUser(pool,a.auth),b=(req.body??{}) as any,ids=Array.isArray(b.productIds)?b.productIds.map(Number).filter((n:number)=>Number.isSafeInteger(n)&&n>0).slice(0,6):[];
    if(ids.length<2)return reply.code(400).send({error:'at_least_two_products_required'});
    const client=await pool.connect();
    try{await client.query('BEGIN');const q=await client.query('INSERT INTO market_saved_comparisons(identity_id,user_id,title) VALUES($1,$2,$3) RETURNING *',[a.auth.sub,uid,typeof b.title==='string'&&b.title.trim()?b.title.trim().slice(0,120):'مقایسه ذخیره‌شده']);for(let i=0;i<ids.length;i++)await client.query('INSERT INTO market_saved_comparison_items(comparison_id,product_id,position) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[q.rows[0].id,ids[i],i]);await client.query('COMMIT');return reply.code(201).send({comparison:q.rows[0],productIds:ids});}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
  });

  app.post('/api/v1/market/products/:id/favorite',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),uid=await ensurePlatformUser(pool,a.auth),id=Number((req.params as any).id);
    if(!Number.isSafeInteger(id)||id<=0)return reply.code(400).send({error:'invalid_id'});
    const exists=await pool.query("SELECT 1 FROM market_products WHERE id=$1 AND status='published' LIMIT 1",[id]);
    if(!exists.rows[0])return reply.code(404).send({error:'product_not_found'});
    const existing=await pool.query('SELECT 1 FROM market_favorites WHERE user_id=$1 AND product_id=$2',[uid,id]);
    const favorite=existing.rows.length===0;
    if(favorite) await pool.query('INSERT INTO market_favorites(user_id,product_id) VALUES($1,$2)',[uid,id]);
    else await pool.query('DELETE FROM market_favorites WHERE user_id=$1 AND product_id=$2',[uid,id]);
    await pool.query("INSERT INTO market_user_events(identity_id,user_id,event_type,product_id,metadata) VALUES($1,$2,$3,$4,$5)",[a.auth.sub,uid,favorite?'favorite_added':'favorite_removed',id,JSON.stringify({surface:'web_or_mobile'})]);
    return{favorite};
  });

  app.get('/api/v1/market/me/activity',{preHandler:requireAuth},async(req)=>{
    const uid=await ensurePlatformUser(pool,auth(req).auth);
    const [clickouts,purchases,events]=await Promise.all([
      pool.query("SELECT c.*,p.title product_title,s.name store_name FROM market_clickouts c LEFT JOIN market_products p ON p.id=c.product_id LEFT JOIN market_stores s ON s.id=c.store_id WHERE c.user_id=$1 ORDER BY c.created_at DESC LIMIT 100",[uid]),
      pool.query("SELECT e.*,p.title product_title,s.name store_name FROM market_purchase_events e LEFT JOIN market_products p ON p.id=e.product_id LEFT JOIN market_stores s ON s.id=e.store_id WHERE e.user_id=$1 ORDER BY e.created_at DESC LIMIT 100",[uid]),
      pool.query("SELECT * FROM market_user_events WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200",[uid])
    ]);
    return{clickouts:clickouts.rows,purchases:purchases.rows,events:events.rows};
  });

  app.post('/api/v1/market/ai/assist',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),b=(req.body??{}) as any;
    if(typeof b.input!=='string'||!b.input.trim()||b.input.length>12000)return reply.code(400).send({error:'invalid_ai_input'});
    const workflowCode=b.workflowCode==='market.compare'?'market.compare':'market.assist';
    const result=await app.inject({method:'POST',url:'/api/v1/ai/execute',headers:{authorization:req.headers.authorization??''},payload:{
      workflowCode,input:b.input,sourceType:'market',sourceId:String(b.productId??b.compareIds?.join(',')??'')
    }});
    if(result.statusCode>=400)return reply.code(502).send({error:'market_ai_unavailable'});
    return result.json();
  });
}
