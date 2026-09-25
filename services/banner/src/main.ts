import Fastify,{type FastifyInstance,type FastifyRequest,type FastifyReply} from 'fastify';
import cors from '@fastify/cors';
import {Pool} from 'pg';
import {requireAuth,requireAdminInternal,type AuthClaims} from './auth.js';

type R=FastifyRequest&{auth:AuthClaims};
const app=Fastify({logger:true});
const isProduction=process.env.NODE_ENV==='production';
if(isProduction){for(const name of ['DATABASE_URL','CORS_ORIGIN','IDENTITY_ISSUER','IDENTITY_PUBLIC_KEY_B64','BANNER_INTERNAL_TOKEN']){const value=process.env[name];if(!value||value.includes('CHANGE_ME')||value.includes('your-web-domain.example')||value.includes('BASE64-DER-ED25519-PUBLIC-KEY'))throw new Error('Production environment variable '+name+' must be configured with a real value');}}
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:10,connectionTimeoutMillis:5000,idleTimeoutMillis:30000});
const MAX_MEDIA_BYTES=8*1024*1024;
const allowedMime=new Set(['image/jpeg','image/png','image/webp']);

function auth(req:FastifyRequest){return (req as R).auth;}
async function audit(identityId:string|null,action:string,resourceType:string,resourceId:string|null,metadata:unknown={},requestId?:string){
  await pool.query('INSERT INTO banner_audit_logs(identity_id,action,resource_type,resource_id,request_id,metadata) VALUES($1,$2,$3,$4,$5,$6)',[identityId,action,resourceType,resourceId,requestId??null,metadata]);
}
async function activity(identityId:string,eventType:string,resourceType:string|null,resourceId:string|null,metadata:unknown={},requestId?:string){
  await pool.query('INSERT INTO banner_activity_events(identity_id,event_type,resource_type,resource_id,request_id,metadata) VALUES($1,$2,$3,$4,$5,$6)',[identityId,eventType,resourceType,resourceId,requestId??null,metadata]);
}
async function notify(identityId:string,type:string,title:string,description:string){
  await pool.query('INSERT INTO banner_notifications(identity_id,type,title,description) VALUES($1,$2,$3,$4)',[identityId,type,title,description]);
}

const clean=(v:unknown,max=500)=>typeof v==='string'?v.trim().slice(0,max):'';
const idParam=(v:unknown)=>/^\\d+$/.test(String(v??''))?Number(v):null;

async function registerPublic(app:FastifyInstance){
  app.get('/api/v1/banner/categories',async()=>{const r=await pool.query('SELECT id,parent_id,name,slug,sort_order FROM banner_categories WHERE active=TRUE ORDER BY sort_order,id');return{categories:r.rows};});
  app.get('/api/v1/banner/listings',async(req)=>{
    const q=req.query as {q?:string;categoryId?:string;city?:string;minPrice?:string;maxPrice?:string;page?:string;limit?:string;sort?:string};
    const page=Math.max(1,Number(q.page??1)||1),limit=Math.min(50,Math.max(1,Number(q.limit??20)||20)),offset=(page-1)*limit;
    const where=['l.status=\'published\''],params:any[]=[];
    if(clean(q.q,120)){params.push('%'+clean(q.q,120)+'%');where.push(`(l.title ILIKE $${params.length} OR l.description ILIKE $${params.length})`);}
    if(q.categoryId&&/^\\d+$/.test(q.categoryId)){params.push(Number(q.categoryId));where.push(`l.category_id=$${params.length}`);}
    if(clean(q.city,80)){params.push(clean(q.city,80));where.push(`l.city=$${params.length}`);}
    if(q.minPrice&&/^\\d+(\\.\\d+)?$/.test(q.minPrice)){params.push(q.minPrice);where.push(`l.price >= $${params.length}`);}
    if(q.maxPrice&&/^\\d+(\\.\\d+)?$/.test(q.maxPrice)){params.push(q.maxPrice);where.push(`l.price <= $${params.length}`);}
    const order=q.sort==='price_asc'?'l.price ASC NULLS LAST':q.sort==='price_desc'?'l.price DESC NULLS LAST':'l.created_at DESC';
    const count=await pool.query(`SELECT COUNT(*)::int count FROM banner_listings l WHERE ${where.join(' AND ')}`,params);
    params.push(limit,offset);
    const rows=await pool.query(`SELECT l.id,l.category_id,c.name category_name,l.title,l.description,l.price,l.currency,l.condition,l.city,l.created_at,l.updated_at,l.views,
      EXISTS(SELECT 1 FROM banner_media m WHERE m.listing_id=l.id) has_media
      FROM banner_listings l LEFT JOIN banner_categories c ON c.id=l.category_id WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT $${params.length-1} OFFSET $${params.length}`,params);
    return{listings:rows.rows,page,limit,total:count.rows[0].count};
  });
  app.get('/api/v1/banner/listings/:id',async(req,reply)=>{
    const id=idParam((req.params as any).id); if(!id)return reply.code(400).send({error:'invalid_id'});
    const r=await pool.query('SELECT l.*,c.name category_name FROM banner_listings l LEFT JOIN banner_categories c ON c.id=l.category_id WHERE l.id=$1 AND l.status=\'published\'',[id]);
    if(!r.rows[0])return reply.code(404).send({error:'listing_not_found'});
    await pool.query('UPDATE banner_listings SET views=views+1 WHERE id=$1',[id]);
    const media=await pool.query('SELECT id,mime_type,filename,sort_order FROM banner_media WHERE listing_id=$1 ORDER BY sort_order,id',[id]);
    await audit(null,'view','listing',String(id),{public:true});
    return{listing:{...r.rows[0],views:r.rows[0].views+1},media:media.rows};
  });
  app.get('/api/v1/banner/media/:id',async(req,reply)=>{
    const id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});
    const r=await pool.query('SELECT mime_type,data,filename FROM banner_media WHERE id=$1',[id]);if(!r.rows[0])return reply.code(404).send({error:'media_not_found'});
    reply.header('Content-Type',r.rows[0].mime_type).header('Content-Disposition',`inline; filename="${r.rows[0].filename}"`).send(r.rows[0].data);
  });
}

async function registerPrivate(app:FastifyInstance){
  app.get('/api/v1/banner/me',{preHandler:requireAuth},async(req)=>{const a=auth(req);const r=await pool.query('SELECT identity_id,display_name,phone,city,created_at,updated_at FROM banner_profiles WHERE identity_id=$1',[a.sub]);return{profile:r.rows[0]??{identity_id:a.sub,display_name:null,phone:null,city:null}};});
  app.patch('/api/v1/banner/me',{preHandler:requireAuth},async(req,reply)=>{const a=auth(req),b=(req.body??{}) as any;const display=clean(b.displayName,120),phone=clean(b.phone,30),city=clean(b.city,80);if(!display&&!phone&&!city)return reply.code(400).send({error:'nothing_to_update'});const r=await pool.query(`INSERT INTO banner_profiles(identity_id,display_name,phone,city) VALUES($1,$2,$3,$4) ON CONFLICT(identity_id) DO UPDATE SET display_name=COALESCE(NULLIF($2,''),banner_profiles.display_name),phone=COALESCE(NULLIF($3,''),banner_profiles.phone),city=COALESCE(NULLIF($4,''),banner_profiles.city),updated_at=NOW() RETURNING *`,[a.sub,display,phone,city]);await activity(a.sub,'profile_update','profile',a.sub,{fields:['displayName','phone','city']});return{profile:r.rows[0]};});
  app.get('/api/v1/banner/me/listings',{preHandler:requireAuth},async(req)=>{const a=auth(req);const r=await pool.query('SELECT l.id,l.title,l.status,l.price,l.currency,l.city,l.views,l.created_at,l.updated_at,c.name category_name FROM banner_listings l LEFT JOIN banner_categories c ON c.id=l.category_id WHERE l.identity_id=$1 ORDER BY l.created_at DESC',[a.sub]);return{listings:r.rows};});
  app.post('/api/v1/banner/listings',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),b=(req.body??{}) as any,title=clean(b.title,160),description=clean(b.description,5000),city=clean(b.city,80),condition=clean(b.condition,30),currency=clean(b.currency,3)||'IRR';
    const categoryId=Number(b.categoryId);const price=b.price===null||b.price===undefined||b.price===''?null:Number(b.price);
    if(!title||!description||!Number.isInteger(categoryId)||categoryId<1||price!==null&&(!Number.isFinite(price)||price<0)||!city)return reply.code(400).send({error:'invalid_listing'});
    const cat=await pool.query('SELECT id FROM banner_categories WHERE id=$1 AND active=TRUE',[categoryId]);if(!cat.rows[0])return reply.code(400).send({error:'invalid_category'});
    const r=await pool.query(`INSERT INTO banner_listings(identity_id,category_id,title,description,price,currency,condition,city,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'pending') RETURNING *`,[a.sub,categoryId,title,description,price,currency,condition||'used',city]);
    await activity(a.sub,'listing_created','listing',String(r.rows[0].id),{status:'pending'});await audit(a.sub,'create','listing',String(r.rows[0].id),{status:'pending'});return reply.code(201).send({listing:r.rows[0]});
  });
  app.patch('/api/v1/banner/listings/:id',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});
    const b=(req.body??{}) as any;const fields:{sql:string;v:any}[]=[];for(const [key,col,max] of [['title','title',160],['description','description',5000],['city','city',80],['condition','condition',30]] as const){if(b[key]!==undefined){const v=clean(b[key],max);if(!v)return reply.code(400).send({error:`${key}_invalid`});fields.push({sql:`${col}=$${fields.length+2}`,v});}}
    if(b.price!==undefined){const v=b.price===null||b.price===''?null:Number(b.price);if(v!==null&&(!Number.isFinite(v)||v<0))return reply.code(400).send({error:'price_invalid'});fields.push({sql:`price=$${fields.length+2}`,v});}
    if(!fields.length)return reply.code(400).send({error:'nothing_to_update'});
    const r=await pool.query(`UPDATE banner_listings SET ${fields.map(x=>x.sql).join(',')},updated_at=NOW() WHERE id=$1 AND identity_id=$${fields.length+2} RETURNING *`,[id,...fields.map(x=>x.v),a.sub]);if(!r.rows[0])return reply.code(404).send({error:'listing_not_found'});
    await activity(a.sub,'listing_updated','listing',String(id),{fields:fields.map(x=>x.sql.split('=')[0])});return{listing:r.rows[0]};
  });
  app.delete('/api/v1/banner/listings/:id',{preHandler:requireAuth},async(req,reply)=>{const a=auth(req),id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});const r=await pool.query(`UPDATE banner_listings SET status='deleted',updated_at=NOW() WHERE id=$1 AND identity_id=$2 AND status<>'deleted' RETURNING id`,[id,a.sub]);if(!r.rows[0])return reply.code(404).send({error:'listing_not_found'});await activity(a.sub,'listing_deleted','listing',String(id));return{deleted:true};});
  app.post('/api/v1/banner/listings/:id/media',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});
    const b=(req.body??{}) as {mimeType?:string;filename?:string;dataBase64?:string};if(!allowedMime.has(b.mimeType??'')||typeof b.dataBase64!=='string')return reply.code(400).send({error:'invalid_media'});
    const data=Buffer.from(b.dataBase64,'base64');if(!data.length||data.length>MAX_MEDIA_BYTES)return reply.code(413).send({error:'media_too_large'});
    const owner=await pool.query('SELECT id FROM banner_listings WHERE id=$1 AND identity_id=$2',[id,a.sub]);if(!owner.rows[0])return reply.code(404).send({error:'listing_not_found'});
    const count=await pool.query('SELECT COUNT(*)::int count FROM banner_media WHERE listing_id=$1',[id]);if(count.rows[0].count>=8)return reply.code(400).send({error:'media_limit_reached'});
    const r=await pool.query('INSERT INTO banner_media(listing_id,identity_id,mime_type,filename,data,sort_order) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,mime_type,filename,sort_order',[id,a.sub,b.mimeType,b.filename?.slice(0,180)||'image',data,count.rows[0].count]);
    await activity(a.sub,'media_uploaded','media',String(r.rows[0].id),{listingId:id,mimeType:b.mimeType,size:data.length});return reply.code(201).send({media:r.rows[0]});
  });
  app.delete('/api/v1/banner/media/:id',{preHandler:requireAuth},async(req,reply)=>{const a=auth(req),id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});const r=await pool.query('DELETE FROM banner_media WHERE id=$1 AND identity_id=$2 RETURNING id,listing_id',[id,a.sub]);if(!r.rows[0])return reply.code(404).send({error:'media_not_found'});await activity(a.sub,'media_deleted','media',String(id),{listingId:r.rows[0].listing_id});return{deleted:true};});
  app.post('/api/v1/banner/listings/:id/favorite',{preHandler:requireAuth},async(req,reply)=>{const a=auth(req),id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});const exists=await pool.query('SELECT 1 FROM banner_favorites WHERE identity_id=$1 AND listing_id=$2',[a.sub,id]);if(exists.rows[0]){await pool.query('DELETE FROM banner_favorites WHERE identity_id=$1 AND listing_id=$2',[a.sub,id]);await activity(a.sub,'favorite_removed','listing',String(id));return{favorite:false};}const owner=await pool.query('SELECT 1 FROM banner_listings WHERE id=$1 AND status=\'published\'',[id]);if(!owner.rows[0])return reply.code(404).send({error:'listing_not_found'});await pool.query('INSERT INTO banner_favorites(identity_id,listing_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[a.sub,id]);await activity(a.sub,'favorite_added','listing',String(id));return{favorite:true};});
  app.get('/api/v1/banner/me/favorites',{preHandler:requireAuth},async(req)=>{const a=auth(req);const r=await pool.query('SELECT l.id,l.title,l.price,l.currency,l.city,l.views,l.created_at FROM banner_favorites f JOIN banner_listings l ON l.id=f.listing_id WHERE f.identity_id=$1 ORDER BY f.created_at DESC',[a.sub]);return{listings:r.rows};});
  app.post('/api/v1/banner/listings/:id/inquiries',{preHandler:requireAuth},async(req,reply)=>{const a=auth(req),id=idParam((req.params as any).id),body=clean((req.body as any)?.message,2000);if(!id||!body)return reply.code(400).send({error:'invalid_inquiry'});const l=await pool.query('SELECT identity_id FROM banner_listings WHERE id=$1 AND status=\'published\'',[id]);if(!l.rows[0]||l.rows[0].identity_id===a.sub)return reply.code(404).send({error:'listing_not_found'});const r=await pool.query('INSERT INTO banner_inquiries(listing_id,buyer_identity_id,seller_identity_id,message) VALUES($1,$2,$3,$4) RETURNING *',[id,a.sub,l.rows[0].identity_id,body]);await activity(a.sub,'inquiry_created','inquiry',String(r.rows[0].id),{listingId:id});return reply.code(201).send({inquiry:r.rows[0]});});
  app.get('/api/v1/banner/me/inquiries',{preHandler:requireAuth},async(req)=>{const a=auth(req);const r=await pool.query('SELECT i.*,l.title FROM banner_inquiries i JOIN banner_listings l ON l.id=i.listing_id WHERE i.buyer_identity_id=$1 OR i.seller_identity_id=$1 ORDER BY i.updated_at DESC',[a.sub]);return{inquiries:r.rows};});
  app.post('/api/v1/banner/inquiries/:id/reply',{preHandler:requireAuth},async(req,reply)=>{const a=auth(req),id=idParam((req.params as any).id),body=clean((req.body as any)?.message,2000);if(!id||!body)return reply.code(400).send({error:'invalid_reply'});const r=await pool.query('SELECT * FROM banner_inquiries WHERE id=$1 AND (buyer_identity_id=$2 OR seller_identity_id=$2)',[id,a.sub]);if(!r.rows[0])return reply.code(404).send({error:'inquiry_not_found'});await pool.query('INSERT INTO banner_inquiry_messages(inquiry_id,sender_identity_id,body) VALUES($1,$2,$3)',[id,a.sub,body]);await pool.query('UPDATE banner_inquiries SET status=\'replied\',updated_at=NOW() WHERE id=$1',[id]);await activity(a.sub,'inquiry_reply','inquiry',String(id));return{ok:true};});
  app.get('/api/v1/banner/inquiries/:id',{preHandler:requireAuth},async(req,reply)=>{const a=auth(req),id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});const r=await pool.query('SELECT * FROM banner_inquiries WHERE id=$1 AND (buyer_identity_id=$2 OR seller_identity_id=$2)',[id,a.sub]);if(!r.rows[0])return reply.code(404).send({error:'inquiry_not_found'});const m=await pool.query('SELECT id,sender_identity_id,body,created_at FROM banner_inquiry_messages WHERE inquiry_id=$1 ORDER BY created_at',[id]);return{inquiry:r.rows[0],messages:m.rows};});
  app.get('/api/v1/banner/me/notifications',{preHandler:requireAuth},async(req)=>{
    const a=auth(req);const r=await pool.query('SELECT id,type,title,description,read_at,created_at FROM banner_notifications WHERE identity_id=$1 ORDER BY created_at DESC LIMIT 200',[a.sub]);
    return{notifications:r.rows.map(x=>({...x,read:Boolean(x.read_at)}))};
  });
  app.patch('/api/v1/banner/notifications/:id/read',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});
    const r=await pool.query('UPDATE banner_notifications SET read_at=COALESCE(read_at,NOW()) WHERE id=$1 AND identity_id=$2 RETURNING id,read_at',[id,a.sub]);if(!r.rows[0])return reply.code(404).send({error:'notification_not_found'});return{ok:true};
  });
  app.post('/api/v1/banner/notifications/read-all',{preHandler:requireAuth},async(req)=>{
    const a=auth(req);await pool.query('UPDATE banner_notifications SET read_at=COALESCE(read_at,NOW()) WHERE identity_id=$1 AND read_at IS NULL',[a.sub]);return{ok:true};
  });
  app.get('/api/v1/banner/me/conversations',{preHandler:requireAuth},async(req)=>{
    const a=auth(req);
    const r=await pool.query(`SELECT i.id::text conversation_id,i.listing_id,i.buyer_identity_id,i.seller_identity_id,
      i.created_at,i.updated_at AS last_message_at,
      COALESCE((SELECT m.body FROM banner_inquiry_messages m WHERE m.inquiry_id=i.id ORDER BY m.created_at DESC LIMIT 1),i.message) AS last_message,
      CASE WHEN i.status='closed' THEN 'archived' ELSE 'active' END status
      FROM banner_inquiries i WHERE i.buyer_identity_id=$1 OR i.seller_identity_id=$1 ORDER BY i.updated_at DESC`,[a.sub]);
    return{conversations:r.rows};
  });
  app.get('/api/v1/banner/conversations/:id',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});
    const r=await pool.query('SELECT * FROM banner_inquiries WHERE id=$1 AND (buyer_identity_id=$2 OR seller_identity_id=$2)',[id,a.sub]);if(!r.rows[0])return reply.code(404).send({error:'conversation_not_found'});
    const m=await pool.query('SELECT id::text message_id,sender_identity_id,body,created_at FROM banner_inquiry_messages WHERE inquiry_id=$1 ORDER BY created_at',[id]);
    return{conversation:r.rows[0],messages:m.rows};
  });
  app.post('/api/v1/banner/conversations',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),b=(req.body??{}) as any,id=Number(b.listingId),body=clean(b.message,2000);
    if(!Number.isInteger(id)||id<1||!body)return reply.code(400).send({error:'invalid_conversation'});
    const l=await pool.query('SELECT identity_id FROM banner_listings WHERE id=$1 AND status=\'published\'',[id]);if(!l.rows[0]||l.rows[0].identity_id===a.sub)return reply.code(404).send({error:'listing_not_found'});
    const r=await pool.query('INSERT INTO banner_inquiries(listing_id,buyer_identity_id,seller_identity_id,message) VALUES($1,$2,$3,$4) RETURNING *',[id,a.sub,l.rows[0].identity_id,body]);
    await pool.query('INSERT INTO banner_inquiry_messages(inquiry_id,sender_identity_id,body) VALUES($1,$2,$3)',[r.rows[0].id,a.sub,body]);
    await notify(l.rows[0].identity_id,'message','پیام جدید','برای آگهی شما پیام جدیدی ارسال شده است');
    await activity(a.sub,'conversation_created','inquiry',String(r.rows[0].id),{listingId:id});return reply.code(201).send({conversationId:String(r.rows[0].id),inquiry:r.rows[0]});
  });
  app.post('/api/v1/banner/conversations/:id/messages',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),id=idParam((req.params as any).id),body=clean((req.body as any)?.message,2000);if(!id||!body)return reply.code(400).send({error:'invalid_message'});
    const r=await pool.query('SELECT buyer_identity_id,seller_identity_id FROM banner_inquiries WHERE id=$1 AND (buyer_identity_id=$2 OR seller_identity_id=$2)',[id,a.sub]);if(!r.rows[0])return reply.code(404).send({error:'conversation_not_found'});
    const recipient=r.rows[0].buyer_identity_id===a.sub?r.rows[0].seller_identity_id:r.rows[0].buyer_identity_id;
    const m=await pool.query('INSERT INTO banner_inquiry_messages(inquiry_id,sender_identity_id,body) VALUES($1,$2,$3) RETURNING id::text message_id,sender_identity_id,body,created_at',[id,a.sub,body]);
    await pool.query('UPDATE banner_inquiries SET status=\'replied\',updated_at=NOW() WHERE id=$1',[id]);
    await notify(recipient,'message','پیام جدید','در گفت‌وگوی آن بنر پیام جدیدی دارید');
    await activity(a.sub,'message_sent','inquiry',String(id));return reply.code(201).send({message:m.rows[0]});
  });
  app.get('/api/v1/banner/me/tickets',{preHandler:requireAuth},async(req)=>{const a=auth(req);const r=await pool.query('SELECT id,subject,category,priority,status,created_at,updated_at FROM banner_tickets WHERE identity_id=$1 ORDER BY updated_at DESC',[a.sub]);return{tickets:r.rows};});
  app.post('/api/v1/banner/tickets',{preHandler:requireAuth},async(req,reply)=>{const a=auth(req),b=(req.body??{}) as any,subject=clean(b.subject,160),message=clean(b.message,4000),category=clean(b.category,60)||'general';if(!subject||!message)return reply.code(400).send({error:'subject_and_message_required'});const r=await pool.query('INSERT INTO banner_tickets(identity_id,subject,category) VALUES($1,$2,$3) RETURNING *',[a.sub,subject,category]);await pool.query('INSERT INTO banner_ticket_messages(ticket_id,sender_identity_id,sender_type,body) VALUES($1,$2,\'user\',$3)',[r.rows[0].id,a.sub,message]);await activity(a.sub,'ticket_created','ticket',String(r.rows[0].id),{category});await notify(a.sub,'system','تیکت ثبت شد','تیکت پشتیبانی شما در آن بنر ثبت شد');return reply.code(201).send({ticket:r.rows[0]});});
  app.get('/api/v1/banner/tickets/:id',{preHandler:requireAuth},async(req,reply)=>{const a=auth(req),id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});const r=await pool.query('SELECT * FROM banner_tickets WHERE id=$1 AND identity_id=$2',[id,a.sub]);if(!r.rows[0])return reply.code(404).send({error:'ticket_not_found'});const m=await pool.query('SELECT id,sender_type,body,created_at FROM banner_ticket_messages WHERE ticket_id=$1 ORDER BY created_at',[id]);return{ticket:r.rows[0],messages:m.rows};});
}

async function registerInternal(app:FastifyInstance){
  app.get('/internal/v1/admin/overview',{preHandler:requireAdminInternal},async()=>{const [l,p,t,u,a]=await Promise.all([pool.query("SELECT COUNT(*)::int count FROM banner_listings WHERE status='published'"),pool.query("SELECT COUNT(*)::int count FROM banner_listings WHERE status='pending'"),pool.query("SELECT COUNT(*)::int count FROM banner_tickets WHERE status NOT IN ('resolved','closed')"),pool.query("SELECT COUNT(DISTINCT identity_id)::int count FROM banner_activity_events"),pool.query("SELECT COUNT(*)::int count FROM banner_audit_logs")]);return{publishedListings:l.rows[0].count,pendingListings:p.rows[0].count,openTickets:t.rows[0].count,activeUsers:u.rows[0].count,auditEvents:a.rows[0].count};});
  app.get('/internal/v1/admin/listings',{preHandler:requireAdminInternal},async(req)=>{const q=req.query as any,limit=Math.min(200,Math.max(1,Number(q.limit??100)||100));const r=await pool.query('SELECT id,identity_id,category_id,title,description,price,currency,condition,city,status,views,created_at,updated_at FROM banner_listings ORDER BY created_at DESC LIMIT $1',[limit]);return{listings:r.rows};});
  app.patch('/internal/v1/admin/listings/:id/status',{preHandler:requireAdminInternal},async(req,reply)=>{const id=idParam((req.params as any).id),b=(req.body??{}) as any;if(!id||!['pending','published','rejected','paused','sold','archived','deleted'].includes(b.status))return reply.code(400).send({error:'invalid_status'});const r=await pool.query('UPDATE banner_listings SET status=$1,moderation_reason=$2,updated_at=NOW() WHERE id=$3 RETURNING *',[b.status,clean(b.reason,1000)||null,id]);if(!r.rows[0])return reply.code(404).send({error:'listing_not_found'});await audit(b.actorIdentityId??null,'admin_listing_status','listing',String(id),{status:b.status,reason:b.reason??null});await notify(r.rows[0].identity_id,'system','وضعیت آگهی تغییر کرد','وضعیت آگهی شما به '+b.status+' تغییر کرد');return{listing:r.rows[0]};});
  app.get('/internal/v1/admin/tickets',{preHandler:requireAdminInternal},async(req)=>{const q=req.query as any,limit=Math.min(200,Math.max(1,Number(q.limit??100)||100));const r=await pool.query('SELECT id,identity_id,subject,category,priority,status,assigned_admin_identity_id,created_at,updated_at FROM banner_tickets ORDER BY updated_at DESC LIMIT $1',[limit]);return{tickets:r.rows};});
  app.get('/internal/v1/admin/tickets/:id',{preHandler:requireAdminInternal},async(req,reply)=>{const id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});const r=await pool.query('SELECT * FROM banner_tickets WHERE id=$1',[id]);if(!r.rows[0])return reply.code(404).send({error:'ticket_not_found'});const m=await pool.query('SELECT id,sender_type,sender_identity_id,body,created_at FROM banner_ticket_messages WHERE ticket_id=$1 ORDER BY created_at',[id]);return{ticket:r.rows[0],messages:m.rows};});
  app.post('/internal/v1/admin/tickets/:id/reply',{preHandler:requireAdminInternal},async(req,reply)=>{const id=idParam((req.params as any).id),b=(req.body??{}) as any,body=clean(b.message,4000);if(!id||!body||!b.adminIdentityId)return reply.code(400).send({error:'invalid_reply'});const r=await pool.query('INSERT INTO banner_ticket_messages(ticket_id,sender_identity_id,sender_type,body,internal) VALUES($1,$2,\'admin\',$3,FALSE) RETURNING *',[id,b.adminIdentityId,body]);await pool.query('UPDATE banner_tickets SET status=\'pending\',assigned_admin_identity_id=$2,updated_at=NOW() WHERE id=$1',[id,b.adminIdentityId]);await audit(b.adminIdentityId,'admin_ticket_reply','ticket',String(id),{});const owner=await pool.query('SELECT identity_id FROM banner_tickets WHERE id=$1',[id]);if(owner.rows[0])await notify(owner.rows[0].identity_id,'support-reply','پاسخ پشتیبانی','پشتیبانی آن بنر به تیکت شما پاسخ داد');return{message:r.rows[0]};});
  app.patch('/internal/v1/admin/tickets/:id',{preHandler:requireAdminInternal},async(req,reply)=>{const id=idParam((req.params as any).id),b=(req.body??{}) as any;if(!id||!['open','pending','resolved','closed'].includes(b.status))return reply.code(400).send({error:'invalid_status'});const r=await pool.query('UPDATE banner_tickets SET status=$1,assigned_admin_identity_id=COALESCE($2,assigned_admin_identity_id),updated_at=NOW() WHERE id=$3 RETURNING *',[b.status,b.adminIdentityId??null,id]);if(!r.rows[0])return reply.code(404).send({error:'ticket_not_found'});await audit(b.adminIdentityId??'00000000-0000-0000-0000-000000000000','admin_ticket_status','ticket',String(id),{status:b.status});return{ticket:r.rows[0]};});
  app.get('/internal/v1/admin/activity',{preHandler:requireAdminInternal},async(req)=>{const q=req.query as any,limit=Math.min(1000,Math.max(1,Number(q.limit??500)||500)),identity=clean(q.identityId,80);const params:any[]=[];let where='';if(identity){params.push(identity);where='WHERE identity_id=$1';}params.push(limit);const r=await pool.query(`SELECT * FROM banner_activity_events ${where} ORDER BY occurred_at DESC LIMIT $${params.length}`,params);return{activities:r.rows};});
  app.get('/internal/v1/admin/audit',{preHandler:requireAdminInternal},async(req)=>{const q=req.query as any,limit=Math.min(1000,Math.max(1,Number(q.limit??500)||500)),identity=clean(q.identityId,80);const params:any[]=[];let where='';if(identity){params.push(identity);where='WHERE identity_id=$1 OR actor_identity_id=$1';}params.push(limit);const r=await pool.query(`SELECT * FROM banner_audit_logs ${where} ORDER BY created_at DESC LIMIT $${params.length}`,params);return{audit:r.rows};});
  app.get('/internal/v1/admin/users/:identityId/summary',{preHandler:requireAdminInternal},async(req)=>{const identity=String((req.params as any).identityId);const [p,l,t,a,act]=await Promise.all([pool.query('SELECT * FROM banner_profiles WHERE identity_id=$1',[identity]),pool.query('SELECT id,title,status,price,currency,city,views,created_at,updated_at FROM banner_listings WHERE identity_id=$1 ORDER BY created_at DESC LIMIT 200',[identity]),pool.query('SELECT id,subject,status,priority,created_at,updated_at FROM banner_tickets WHERE identity_id=$1 ORDER BY updated_at DESC LIMIT 100',[identity]),pool.query('SELECT * FROM banner_audit_logs WHERE identity_id=$1 OR actor_identity_id=$1 ORDER BY created_at DESC LIMIT 200',[identity]),pool.query('SELECT * FROM banner_activity_events WHERE identity_id=$1 ORDER BY occurred_at DESC LIMIT 500',[identity])]);return{profile:p.rows[0]??null,listings:l.rows,tickets:t.rows,audit:a.rows,activity:act.rows};});
}

app.get('/health',async()=>({service:'banner',status:'ok'}));
app.get('/health/db',async(_r,reply)=>{try{const r=await pool.query<{version:string}>('SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1');return{service:'banner',database:'ok',migration:r.rows[0]?.version??null};}catch{return reply.code(503).send({service:'banner',database:'unavailable'});}});
const origins=process.env.CORS_ORIGIN?.split(',').map(x=>x.trim()).filter(Boolean)??['http://localhost:5173'];await app.register(cors,{origin:origins});
await registerPublic(app);await registerPrivate(app);await registerInternal(app);
const shutdown=async()=>{await app.close();await pool.end()};process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
await app.listen({host:'0.0.0.0',port:Number(process.env.PORT??4005)});
