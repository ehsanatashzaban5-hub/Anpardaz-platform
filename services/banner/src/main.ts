import Fastify,{type FastifyInstance,type FastifyRequest,type FastifyReply} from 'fastify';
import cors from '@fastify/cors';
import {Pool} from 'pg';
import sharp from 'sharp';
import {requireAuth,requireAdminInternal,type AuthClaims} from './auth.js';

type R=FastifyRequest&{auth:AuthClaims};
const app=Fastify({logger:true});
const isProduction=process.env.NODE_ENV==='production';
if(isProduction){for(const name of ['DATABASE_URL','CORS_ORIGIN','IDENTITY_ISSUER','IDENTITY_PUBLIC_KEY_B64','BANNER_INTERNAL_TOKEN']){const value=process.env[name];if(!value||value.includes('CHANGE_ME')||value.includes('your-web-domain.example')||value.includes('BASE64-DER-ED25519-PUBLIC-KEY'))throw new Error('Production environment variable '+name+' must be configured with a real value');}}
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:10,connectionTimeoutMillis:5000,idleTimeoutMillis:30000});
const MAX_MEDIA_BYTES=8*1024*1024;
const allowedMime=new Set(['image/jpeg','image/png','image/webp']);
async function sanitizeImage(data:Buffer,mime:string):Promise<Buffer>{
  if(!allowedMime.has(mime)||data.length===0||data.length>MAX_MEDIA_BYTES) throw new Error('invalid_image_content');
  const image=sharp(data,{limitInputPixels:40_000_000,limitInputChannels:5,failOn:'warning',sequentialRead:true});
  const meta=await image.metadata();
  if(!meta.width||!meta.height||meta.width>10000||meta.height>10000) throw new Error('invalid_image_dimensions');
  const normalized= mime==='image/jpeg'
    ? await image.rotate().jpeg({quality:88,mozjpeg:true}).toBuffer()
    : mime==='image/png'
      ? await image.rotate().png({compressionLevel:9}).toBuffer()
      : await image.rotate().webp({quality:88}).toBuffer();
  if(!normalized.length||normalized.length>MAX_MEDIA_BYTES) throw new Error('normalized_image_too_large');
  return normalized;
}

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
async function accountRestriction(identityId:string,code:string){
  const r=await pool.query(`SELECT restriction_code,ends_at FROM banner_restrictions WHERE identity_id=$1 AND revoked_at IS NULL AND starts_at<=NOW() AND (ends_at IS NULL OR ends_at>NOW()) AND restriction_code IN ('all',$2) ORDER BY created_at DESC LIMIT 1`,[identityId,code]);
  return r.rows[0]??null;
}
async function requireAllowed(identityId:string,code:string){
  const profile=await pool.query('SELECT account_status FROM banner_profiles WHERE identity_id=$1',[identityId]);
  if(profile.rows[0]?.account_status==='banned'||profile.rows[0]?.account_status==='suspended') return false;
  return !(await accountRestriction(identityId,code));
}
async function suggestWithAI(identityId:string,title:string,description:string){
  if(!process.env.BANNER_AI_API_KEY||!process.env.BANNER_AI_BASE_URL) throw new Error('banner_ai_not_configured');
  const cats=await pool.query('SELECT id,parent_id,name,slug FROM banner_categories WHERE active=TRUE ORDER BY sort_order,id');
  const prompt=`آن بنر یک پلتفرم آگهی فارسی است. عنوان و توضیح کاربر را تحلیل کن و فقط از دسته‌بندی‌های داده‌شده یک دسته/زیر‌دسته موجود را انتخاب کن. همچنین اگر از متن قابل استخراج است، فیلدهای فرم مثل condition, price, attributes را پیشنهاد بده. هرگز دسته یا شناسه جدید نساز.
عنوان: ${title}
توضیح: ${description}
دسته‌ها: ${JSON.stringify(cats.rows)}
خروجی فقط JSON با این شکل:
{"categoryId":123,"condition":"new|like-new|good|used|for-parts|null","price":null,"attributes":{},"confidence":0.0}`;
  const response=await fetch(process.env.BANNER_AI_BASE_URL.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+process.env.BANNER_AI_API_KEY},body:JSON.stringify({model:process.env.BANNER_AI_MODEL||'gpt-5-mini',temperature:0,response_format:{type:'json_object'},messages:[{role:'system',content:'Return valid JSON only.'},{role:'user',content:prompt}]})});
  if(!response.ok) throw new Error('banner_ai_provider_error');
  const json:any=await response.json();const raw=String(json?.choices?.[0]?.message?.content??'');
  let out:any;try{out=JSON.parse(raw)}catch{throw new Error('banner_ai_invalid_response')}
  const categoryId=Number(out.categoryId);const cat=cats.rows.find((x:any)=>Number(x.id)===categoryId);
  if(!cat||!cat.parent_id) throw new Error('banner_ai_invalid_subcategory');
  const confidence=Number(out.confidence);if(!Number.isFinite(confidence)||confidence<0||confidence>1) throw new Error('banner_ai_invalid_confidence');
  const attrs=out.attributes&&typeof out.attributes==='object'&&!Array.isArray(out.attributes)?Object.fromEntries(Object.entries(out.attributes).slice(0,40)):{};
  const parent=cats.rows.find((x:any)=>Number(x.id)===Number(cat.parent_id));
  return {categoryId,categoryName:cat.name,categorySlug:cat.slug,parentCategoryId:parent?.id??null,parentCategoryName:parent?.name??null,condition:['new','like-new','good','used','for-parts'].includes(out.condition)?out.condition:null,price:out.price===null||out.price===undefined?null:Number(out.price),attributes:attrs,confidence,model:process.env.BANNER_AI_MODEL||'gpt-5-mini',provider:process.env.BANNER_AI_PROVIDER||'openai'};
}


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
    const rows=await pool.query(`SELECT l.id,l.identity_id,l.category_id,c.name category_name,p.display_name seller_display_name,l.title,l.description,l.price,l.currency,l.condition,l.city,l.contact_enabled,l.chat_enabled,l.created_at,l.updated_at,l.views,
      COALESCE((SELECT json_agg(m.id ORDER BY m.sort_order,m.id) FROM banner_media m WHERE m.listing_id=l.id),'[]'::json) media_ids,l.attributes
      FROM banner_listings l LEFT JOIN banner_categories c ON c.id=l.category_id LEFT JOIN banner_profiles p ON p.identity_id=l.identity_id WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT $${params.length-1} OFFSET $${params.length}`,params);
    return{listings:rows.rows,page,limit,total:count.rows[0].count};
  });
  app.get('/api/v1/banner/listings/:id',async(req,reply)=>{
    const id=idParam((req.params as any).id); if(!id)return reply.code(400).send({error:'invalid_id'});
    const r=await pool.query('SELECT l.*,c.name category_name,p.display_name seller_display_name FROM banner_listings l LEFT JOIN banner_categories c ON c.id=l.category_id LEFT JOIN banner_profiles p ON p.identity_id=l.identity_id WHERE l.id=$1 AND l.status=\'published\'',[id]);
    if(!r.rows[0])return reply.code(404).send({error:'listing_not_found'});
    await pool.query('UPDATE banner_listings SET views=views+1 WHERE id=$1',[id]);
    const media=await pool.query('SELECT id,mime_type,filename,sort_order FROM banner_media WHERE listing_id=$1 ORDER BY sort_order,id',[id]);
    await audit(null,'view','listing',String(id),{public:true});
    return{listing:{...r.rows[0],views:r.rows[0].views+1},media:media.rows};
  });
  app.get('/api/v1/banner/listings/:id/contact',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});if(!(await requireAllowed(a.sub,'contact')))return reply.code(403).send({error:'contact_restricted'});
    const r=await pool.query('SELECT l.identity_id,p.phone FROM banner_listings l LEFT JOIN banner_profiles p ON p.identity_id=l.identity_id WHERE l.id=$1 AND l.status=\'published\'',[id]);
    if(!r.rows[0]||r.rows[0].identity_id===a.sub||r.rows[0].contact_enabled!==true||!r.rows[0].phone)return reply.code(404).send({error:'contact_not_available'});
    await activity(a.sub,'seller_contact_viewed','listing',String(id));await audit(a.sub,'seller_contact_viewed','listing',String(id),{});
    return{phone:r.rows[0].phone};
  });
  app.get('/api/v1/banner/messages/:id/media',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});
    const r=await pool.query(`SELECT m.media_data,m.media_mime FROM banner_inquiry_messages m JOIN banner_inquiries i ON i.id=m.inquiry_id WHERE m.id=$1 AND (i.buyer_identity_id=$2 OR i.seller_identity_id=$2)`,[id,a.sub]);
    if(!r.rows[0]?.media_data)return reply.code(404).send({error:'media_not_found'});
    reply.header('Content-Type',r.rows[0].media_mime??'application/octet-stream').send(r.rows[0].media_data);
  });
  app.get('/api/v1/banner/media/:id',async(req,reply)=>{
    const id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});
    const r=await pool.query('SELECT mime_type,data,filename FROM banner_media WHERE id=$1',[id]);if(!r.rows[0])return reply.code(404).send({error:'media_not_found'});
    reply.header('Content-Type',r.rows[0].mime_type).header('Content-Disposition','inline').send(r.rows[0].data);
  });
}

async function registerPrivate(app:FastifyInstance){
  app.get('/api/v1/banner/me',{preHandler:requireAuth},async(req)=>{const a=auth(req);if(a.phone)await pool.query(`INSERT INTO banner_profiles(identity_id,phone) VALUES($1,$2) ON CONFLICT(identity_id) DO UPDATE SET phone=COALESCE(NULLIF(banner_profiles.phone,''),EXCLUDED.phone),updated_at=NOW()`,[a.sub,a.phone]);const r=await pool.query(`SELECT identity_id,display_name,phone,city,account_status,violation_count,restriction_flags,restriction_reason,restricted_until,created_at,updated_at,CASE WHEN avatar_data IS NOT NULL THEN 'data:'||COALESCE(avatar_mime,'image/jpeg')||';base64,'||encode(avatar_data,'base64') END avatar_data_url FROM banner_profiles WHERE identity_id=$1`,[a.sub]);return{profile:r.rows[0]??{identity_id:a.sub,display_name:null,phone:null,city:null}};});
  app.patch('/api/v1/banner/me',{preHandler:requireAuth},async(req,reply)=>{const a=auth(req),b=(req.body??{}) as any;const display=clean(b.displayName,120),phone=clean(a.phone,30),city=clean(b.city,80);const avatarMime=allowedMime.has(b.avatarMime)?b.avatarMime:null;const avatarData=typeof b.avatarBase64==='string'&&avatarMime?Buffer.from(b.avatarBase64,'base64'):null;if(avatarData&&avatarData.length>2*1024*1024)return reply.code(413).send({error:'avatar_too_large'});if(!display&&!phone&&!city&&!avatarData)return reply.code(400).send({error:'nothing_to_update'});const r=await pool.query(`INSERT INTO banner_profiles(identity_id,display_name,phone,city,avatar_data,avatar_mime) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(identity_id) DO UPDATE SET display_name=COALESCE(NULLIF($2,''),banner_profiles.display_name),phone=COALESCE(NULLIF($3,''),banner_profiles.phone),city=COALESCE(NULLIF($4,''),banner_profiles.city),avatar_data=COALESCE($5,banner_profiles.avatar_data),avatar_mime=COALESCE($6,banner_profiles.avatar_mime),updated_at=NOW() RETURNING identity_id,display_name,phone,city,created_at,updated_at,CASE WHEN avatar_data IS NOT NULL THEN 'data:'||COALESCE(avatar_mime,'image/jpeg')||';base64,'||encode(avatar_data,'base64') END avatar_data_url`,[a.sub,display,phone,city,avatarData,avatarMime]);await activity(a.sub,'profile_update','profile',a.sub,{fields:['displayName','phone','city']});return{profile:r.rows[0]};});
  app.get('/api/v1/banner/me/listings',{preHandler:requireAuth},async(req)=>{const a=auth(req);const r=await pool.query('SELECT l.id,l.title,l.status,l.moderation_reason,l.price,l.currency,l.city,l.contact_enabled,l.chat_enabled,l.views,l.created_at,l.updated_at,c.name category_name FROM banner_listings l LEFT JOIN banner_categories c ON c.id=l.category_id WHERE l.identity_id=$1 ORDER BY l.created_at DESC',[a.sub]);return{listings:r.rows};});
  app.post('/api/v1/banner/ai/suggest',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),b=(req.body??{}) as any,title=clean(b.title,160),description=clean(b.description,200);
    if(!title||!description)return reply.code(400).send({error:'title_and_description_required'});
    if(description.length>200)return reply.code(400).send({error:'description_too_long',max:200});
    try{
      const suggestion=await suggestWithAI(a.sub,title,description);
      const r=await pool.query('INSERT INTO banner_ai_suggestions(identity_id,title_input,description_input,suggested_category_id,suggested_attributes,suggested_condition,suggested_price,model,provider) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',[a.sub,title,description,suggestion.categoryId,suggestion.attributes,suggestion.condition,suggestion.price,suggestion.model,suggestion.provider]);
      await activity(a.sub,'ai_listing_suggestion','listing',null,{suggestionId:r.rows[0].id,categoryId:suggestion.categoryId,confidence:suggestion.confidence});
      return{suggestion:{...suggestion,id:r.rows[0].id}};
    }catch(e:any){const code=String(e?.message??'banner_ai_failed');return reply.code(code==='banner_ai_not_configured'?503:502).send({error:code});}
  });
  app.post('/api/v1/banner/listings',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),b=(req.body??{}) as any,title=clean(b.title,160),description=clean(b.description,200),city=clean(b.city,80),currency=clean(b.currency,3)||'IRR';
    if(!(await requireAllowed(a.sub,'listing')))return reply.code(403).send({error:'listing_restricted'});
    if(!title||!description||description.length>200||!city)return reply.code(400).send({error:description.length>200?'description_too_long':'invalid_listing',max:200});
    let suggestion:any=null;
    try{
      if(b.aiSuggestionId){const q=await pool.query('SELECT * FROM banner_ai_suggestions WHERE id=$1 AND identity_id=$2',[Number(b.aiSuggestionId),a.sub]);if(q.rows[0])suggestion=q.rows[0];}
      if(!suggestion){
        const ai=await suggestWithAI(a.sub,title,description);
        const q=await pool.query('INSERT INTO banner_ai_suggestions(identity_id,title_input,description_input,suggested_category_id,suggested_attributes,suggested_condition,suggested_price,model,provider) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',[a.sub,title,description,ai.categoryId,ai.attributes,ai.condition,ai.price,ai.model,ai.provider]);suggestion=q.rows[0];
      }
    }catch(e:any){return reply.code(String(e?.message)==='banner_ai_not_configured'?503:502).send({error:String(e?.message??'banner_ai_failed')});}
    const categoryId=Number(b.categoryId??suggestion.suggested_category_id),price=b.price!==undefined&&b.price!==null&&b.price!==''?Number(b.price):suggestion.suggested_price??null,condition=clean(b.condition,30)||suggestion.suggested_condition||'used';
    const attributes=typeof b.attributes==='object'&&b.attributes&&!Array.isArray(b.attributes)?Object.fromEntries(Object.entries(b.attributes).slice(0,40)):suggestion.suggested_attributes??{};const contactEnabled=b.contactEnabled===true,chatEnabled=b.chatEnabled===true;if(!contactEnabled&&!chatEnabled)return reply.code(400).send({error:'contact_or_chat_required'});
    if(!Number.isInteger(categoryId)||categoryId<1||JSON.stringify(attributes).length>20000||price!==null&&(!Number.isFinite(price)||price<0))return reply.code(400).send({error:'invalid_listing'});
    const cat=await pool.query('SELECT id FROM banner_categories WHERE id=$1 AND active=TRUE',[categoryId]);if(!cat.rows[0])return reply.code(400).send({error:'invalid_category'});
    const r=await pool.query(`INSERT INTO banner_listings(identity_id,category_id,title,description,price,currency,condition,city,attributes,ai_suggestion,contact_enabled,chat_enabled,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending') RETURNING *`,[a.sub,categoryId,title,description,price,currency,condition,city,attributes,suggestion,contactEnabled,chatEnabled]);
    await activity(a.sub,'listing_created','listing',String(r.rows[0].id),{status:'pending',aiSuggestionId:suggestion.id});await notify(a.sub,'system','آگهی ثبت شد','آگهی شما با موفقیت ثبت شد و برای تأیید مدیریت در صف بررسی قرار گرفت.');await audit(a.sub,'create','listing',String(r.rows[0].id),{status:'pending',aiSuggestionId:suggestion.id});return reply.code(201).send({listing:r.rows[0]});
  });
  app.patch('/api/v1/banner/listings/:id',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});if(!(await requireAllowed(a.sub,'listing')))return reply.code(403).send({error:'listing_restricted'});
    const b=(req.body??{}) as any;const current=await pool.query('SELECT contact_enabled,chat_enabled FROM banner_listings WHERE id=$1 AND identity_id=$2',[id,a.sub]);if(!current.rows[0])return reply.code(404).send({error:'listing_not_found'});const nextContact=b.contactEnabled===undefined?Boolean(current.rows[0].contact_enabled):Boolean(b.contactEnabled),nextChat=b.chatEnabled===undefined?Boolean(current.rows[0].chat_enabled):Boolean(b.chatEnabled);if(!nextContact&&!nextChat)return reply.code(400).send({error:'contact_or_chat_required'});const fields:{sql:string;v:any}[]=[];for(const [key,col,max] of [['title','title',160],['description','description',200],['city','city',80],['condition','condition',30]] as const){if(b[key]!==undefined){const v=clean(b[key],max);if(!v)return reply.code(400).send({error:`${key}_invalid`});fields.push({sql:`${col}=$${fields.length+2}`,v});}}
    if(b.contactEnabled!==undefined)fields.push({sql:`contact_enabled=${fields.length+2}`,v:Boolean(b.contactEnabled)});if(b.chatEnabled!==undefined)fields.push({sql:`chat_enabled=${fields.length+2}`,v:Boolean(b.chatEnabled)});if(b.price!==undefined){const v=b.price===null||b.price===''?null:Number(b.price);if(v!==null&&(!Number.isFinite(v)||v<0))return reply.code(400).send({error:'price_invalid'});fields.push({sql:`price=${fields.length+2}`,v});}
    if(b.attributes!==undefined){const attrs=typeof b.attributes==='object'&&b.attributes&&!Array.isArray(b.attributes)?Object.fromEntries(Object.entries(b.attributes).slice(0,40)):{};if(JSON.stringify(attrs).length>20000)return reply.code(400).send({error:'invalid_attributes'});fields.push({sql:`attributes=${fields.length+2}`,v:attrs});}
    if(b.status!==undefined){if(!['paused','pending'].includes(String(b.status)))return reply.code(400).send({error:'status_invalid'});fields.push({sql:`status=${fields.length+2}`,v:String(b.status)});}
    if(!fields.length)return reply.code(400).send({error:'nothing_to_update'});
    const r=await pool.query(`UPDATE banner_listings SET ${fields.map(x=>x.sql).join(',')},updated_at=NOW() WHERE id=$1 AND identity_id=$${fields.length+2} RETURNING *`,[id,...fields.map(x=>x.v),a.sub]);if(!r.rows[0])return reply.code(404).send({error:'listing_not_found'});
    await activity(a.sub,'listing_updated','listing',String(id),{fields:fields.map(x=>x.sql.split('=')[0])});return{listing:r.rows[0]};
  });
  app.delete('/api/v1/banner/listings/:id',{preHandler:requireAuth},async(req,reply)=>{const a=auth(req),id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});const r=await pool.query(`UPDATE banner_listings SET status='deleted',updated_at=NOW() WHERE id=$1 AND identity_id=$2 AND status<>'deleted' RETURNING id`,[id,a.sub]);if(!r.rows[0])return reply.code(404).send({error:'listing_not_found'});await activity(a.sub,'listing_deleted','listing',String(id));return{deleted:true};});
  app.post('/api/v1/banner/listings/:id/media',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});
    const b=(req.body??{}) as {mimeType?:string;filename?:string;dataBase64?:string};if(!allowedMime.has(b.mimeType??'')||typeof b.dataBase64!=='string')return reply.code(400).send({error:'invalid_media'});
    const raw=Buffer.from(b.dataBase64,'base64');if(!raw.length||raw.length>MAX_MEDIA_BYTES)return reply.code(413).send({error:'media_too_large'});let data:Buffer;try{data=await sanitizeImage(raw,b.mimeType??'');}catch(e:any){return reply.code(String(e?.message)==='normalized_image_too_large'?413:400).send({error:String(e?.message??'invalid_image_content')});}
    const owner=await pool.query('SELECT id FROM banner_listings WHERE id=$1 AND identity_id=$2',[id,a.sub]);if(!owner.rows[0])return reply.code(404).send({error:'listing_not_found'});
    const count=await pool.query('SELECT COUNT(*)::int count FROM banner_media WHERE listing_id=$1',[id]);if(count.rows[0].count>=8)return reply.code(400).send({error:'media_limit_reached'});
    const r=await pool.query('INSERT INTO banner_media(listing_id,identity_id,mime_type,filename,data,sort_order) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,mime_type,filename,sort_order',[id,a.sub,b.mimeType,clean(String(b.filename??'image').replace(/[\\/\r\n\0]/g,'_'),120)||'image',data,count.rows[0].count]);
    await activity(a.sub,'media_uploaded','media',String(r.rows[0].id),{listingId:id,mimeType:b.mimeType,size:data.length});return reply.code(201).send({media:r.rows[0]});
  });
  app.delete('/api/v1/banner/media/:id',{preHandler:requireAuth},async(req,reply)=>{const a=auth(req),id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});const r=await pool.query('DELETE FROM banner_media WHERE id=$1 AND identity_id=$2 RETURNING id,listing_id',[id,a.sub]);if(!r.rows[0])return reply.code(404).send({error:'media_not_found'});await activity(a.sub,'media_deleted','media',String(id),{listingId:r.rows[0].listing_id});return{deleted:true};});
  app.post('/api/v1/banner/listings/:id/favorite',{preHandler:requireAuth},async(req,reply)=>{const a=auth(req),id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});if(!(await requireAllowed(a.sub,'favorite')))return reply.code(403).send({error:'favorite_restricted'});const exists=await pool.query('SELECT 1 FROM banner_favorites WHERE identity_id=$1 AND listing_id=$2',[a.sub,id]);if(exists.rows[0]){await pool.query('DELETE FROM banner_favorites WHERE identity_id=$1 AND listing_id=$2',[a.sub,id]);await activity(a.sub,'favorite_removed','listing',String(id));return{favorite:false};}const owner=await pool.query('SELECT 1 FROM banner_listings WHERE id=$1 AND status=\'published\'',[id]);if(!owner.rows[0])return reply.code(404).send({error:'listing_not_found'});await pool.query('INSERT INTO banner_favorites(identity_id,listing_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[a.sub,id]);await activity(a.sub,'favorite_added','listing',String(id));await notify(owner.rows[0].identity_id,'favorite','افزوده شدن به علاقه‌مندی','آگهی شما به علاقه‌مندی‌های یک کاربر افزوده شد');return{favorite:true};});
  app.post('/api/v1/banner/me/recent-views/:id',{preHandler:requireAuth},async(req,reply)=>{const a=auth(req),id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});const exists=await pool.query('SELECT 1 FROM banner_listings WHERE id=$1 AND status=\'published\'',[id]);if(!exists.rows[0])return reply.code(404).send({error:'listing_not_found'});await pool.query('INSERT INTO banner_recent_views(identity_id,listing_id,viewed_at,view_count) VALUES($1,$2,NOW(),1) ON CONFLICT(identity_id,listing_id) DO UPDATE SET viewed_at=NOW(),view_count=banner_recent_views.view_count+1',[a.sub,id]);await activity(a.sub,'listing_viewed','listing',String(id));return{ok:true};});
  app.get('/api/v1/banner/me/recent-views',{preHandler:requireAuth},async(req)=>{const a=auth(req);const r=await pool.query('SELECT l.id,l.title,l.price,l.currency,l.city,l.status,l.views,rv.viewed_at,rv.view_count,c.name category_name FROM banner_recent_views rv JOIN banner_listings l ON l.id=rv.listing_id LEFT JOIN banner_categories c ON c.id=l.category_id WHERE rv.identity_id=$1 ORDER BY rv.viewed_at DESC LIMIT 100',[a.sub]);return{listings:r.rows};});  app.get('/api/v1/banner/me/favorites',{preHandler:requireAuth},async(req)=>{const a=auth(req);const r=await pool.query('SELECT l.id,l.title,l.price,l.currency,l.city,l.views,l.created_at FROM banner_favorites f JOIN banner_listings l ON l.id=f.listing_id WHERE f.identity_id=$1 ORDER BY f.created_at DESC',[a.sub]);return{listings:r.rows};});
  app.post('/api/v1/banner/listings/:id/inquiries',{preHandler:requireAuth},async(req,reply)=>{const a=auth(req),id=idParam((req.params as any).id),body=clean((req.body as any)?.message,2000);if(!id||!body)return reply.code(400).send({error:'invalid_inquiry'});if(!(await requireAllowed(a.sub,'chat')))return reply.code(403).send({error:'chat_restricted'});const l=await pool.query('SELECT identity_id,chat_enabled FROM banner_listings WHERE id=$1 AND status=\'published\'',[id]);if(!l.rows[0]||l.rows[0].identity_id===a.sub)return reply.code(404).send({error:'listing_not_found'});if(l.rows[0].chat_enabled!==true)return reply.code(403).send({error:'chat_disabled'});const r=await pool.query('INSERT INTO banner_inquiries(listing_id,buyer_identity_id,seller_identity_id,message) VALUES($1,$2,$3,$4) RETURNING *',[id,a.sub,l.rows[0].identity_id,body]);await activity(a.sub,'inquiry_created','inquiry',String(r.rows[0].id),{listingId:id});return reply.code(201).send({inquiry:r.rows[0]});});
  app.get('/api/v1/banner/me/inquiries',{preHandler:requireAuth},async(req)=>{const a=auth(req);const r=await pool.query('SELECT i.*,l.title FROM banner_inquiries i JOIN banner_listings l ON l.id=i.listing_id WHERE i.buyer_identity_id=$1 OR i.seller_identity_id=$1 ORDER BY i.updated_at DESC',[a.sub]);return{inquiries:r.rows};});
  app.post('/api/v1/banner/inquiries/:id/reply',{preHandler:requireAuth},async(req,reply)=>{const a=auth(req),id=idParam((req.params as any).id),body=clean((req.body as any)?.message,2000);if(!id||!body)return reply.code(400).send({error:'invalid_reply'});const r=await pool.query('SELECT i.*,l.chat_enabled FROM banner_inquiries i JOIN banner_listings l ON l.id=i.listing_id WHERE i.id=$1 AND (i.buyer_identity_id=$2 OR i.seller_identity_id=$2)',[id,a.sub]);if(!r.rows[0])return reply.code(404).send({error:'inquiry_not_found'});if(r.rows[0].chat_enabled!==true)return reply.code(403).send({error:'chat_disabled'});await pool.query('INSERT INTO banner_inquiry_messages(inquiry_id,sender_identity_id,body) VALUES($1,$2,$3)',[id,a.sub,body]);await pool.query('UPDATE banner_inquiries SET status=\'replied\',updated_at=NOW() WHERE id=$1',[id]);await activity(a.sub,'inquiry_reply','inquiry',String(id));return{ok:true};});
  app.get('/api/v1/banner/inquiries/:id',{preHandler:requireAuth},async(req,reply)=>{const a=auth(req),id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});const r=await pool.query('SELECT * FROM banner_inquiries WHERE id=$1 AND (buyer_identity_id=$2 OR seller_identity_id=$2)',[id,a.sub]);if(!r.rows[0])return reply.code(404).send({error:'inquiry_not_found'});const m=await pool.query('SELECT id,sender_identity_id,body,created_at FROM banner_inquiry_messages WHERE inquiry_id=$1 ORDER BY created_at',[id]);return{inquiry:r.rows[0],messages:m.rows};});
  app.post('/api/v1/banner/listings/:id/report',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),id=idParam((req.params as any).id),b=(req.body??{}) as any,reason=clean(b.reason,120),description=clean(b.description,1000);
    if(!id||!reason)return reply.code(400).send({error:'report_reason_required'});
    const listing=await pool.query('SELECT identity_id FROM banner_listings WHERE id=$1 AND status=\'published\'',[id]);
    if(!listing.rows[0])return reply.code(404).send({error:'listing_not_found'});
    if(listing.rows[0].identity_id===a.sub)return reply.code(400).send({error:'cannot_report_own_listing'});
    try{
      const r=await pool.query('INSERT INTO banner_reports(reporter_identity_id,listing_id,reason,description) VALUES($1,$2,$3,$4) RETURNING *',[a.sub,id,reason,description||null]);
      await pool.query('INSERT INTO banner_violation_reports(reporter_identity_id,reported_identity_id,listing_id,reason,description) VALUES($1,$2,$3,$4,$5)',[a.sub,listing.rows[0].identity_id,id,reason,description||null]);
      await activity(a.sub,'listing_reported','listing',String(id),{reportId:r.rows[0].id,reason});await audit(a.sub,'report','listing',String(id),{reason});
      return reply.code(201).send({report:r.rows[0]});
    }catch(e:any){if(e?.code==='23505')return reply.code(409).send({error:'report_already_exists'});throw e;}
  });
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
      bp.display_name buyer_display_name,sp.display_name seller_display_name,
      CASE WHEN bp.avatar_data IS NOT NULL THEN 'data:'||COALESCE(bp.avatar_mime,'image/jpeg')||';base64,'||encode(bp.avatar_data,'base64') END buyer_avatar_data_url,
      CASE WHEN sp.avatar_data IS NOT NULL THEN 'data:'||COALESCE(sp.avatar_mime,'image/jpeg')||';base64,'||encode(sp.avatar_data,'base64') END seller_avatar_data_url,
      i.created_at,i.updated_at AS last_message_at,
      COALESCE((SELECT m.body FROM banner_inquiry_messages m WHERE m.inquiry_id=i.id ORDER BY m.created_at DESC LIMIT 1),i.message) AS last_message,
      CASE WHEN i.status='closed' THEN 'archived' ELSE 'active' END status
      FROM banner_inquiries i
      LEFT JOIN banner_profiles bp ON bp.identity_id=i.buyer_identity_id
      LEFT JOIN banner_profiles sp ON sp.identity_id=i.seller_identity_id
      WHERE i.buyer_identity_id=$1 OR i.seller_identity_id=$1 ORDER BY i.updated_at DESC`,[a.sub]);
    return{conversations:r.rows};
  });
  app.get('/api/v1/banner/conversations/:id',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});
    const r=await pool.query('SELECT * FROM banner_inquiries WHERE id=$1 AND (buyer_identity_id=$2 OR seller_identity_id=$2)',[id,a.sub]);if(!r.rows[0])return reply.code(404).send({error:'conversation_not_found'});
    const m=await pool.query('SELECT id::text message_id,sender_identity_id,body,message_type,media_mime,offer_amount,created_at FROM banner_inquiry_messages WHERE inquiry_id=$1 ORDER BY created_at',[id]);
    return{conversation:r.rows[0],messages:m.rows};
  });
  app.post('/api/v1/banner/conversations',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),b=(req.body??{}) as any,id=Number(b.listingId),body=clean(b.message,2000);if(!(await requireAllowed(a.sub,'chat')))return reply.code(403).send({error:'chat_restricted'});
    if(!Number.isInteger(id)||id<1)return reply.code(400).send({error:'invalid_conversation'});
    const l=await pool.query('SELECT identity_id,chat_enabled FROM banner_listings WHERE id=$1 AND status=\'published\'',[id]);if(!l.rows[0]||l.rows[0].identity_id===a.sub)return reply.code(404).send({error:'listing_not_found'});if(l.rows[0].chat_enabled!==true)return reply.code(403).send({error:'chat_disabled'});
    const r=await pool.query('INSERT INTO banner_inquiries(listing_id,buyer_identity_id,seller_identity_id,message) VALUES($1,$2,$3,$4) RETURNING *',[id,a.sub,l.rows[0].identity_id,body||'']);
    if(body){await pool.query('INSERT INTO banner_inquiry_messages(inquiry_id,sender_identity_id,body) VALUES($1,$2,$3)',[r.rows[0].id,a.sub,body]);await notify(l.rows[0].identity_id,'message','پیام جدید','برای آگهی شما پیام جدیدی ارسال شده است');}
    await activity(a.sub,'conversation_created','inquiry',String(r.rows[0].id),{listingId:id});return reply.code(201).send({conversationId:String(r.rows[0].id),inquiry:r.rows[0]});
  });
  app.post('/api/v1/banner/conversations/:id/messages',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),id=idParam((req.params as any).id),b=(req.body??{}) as any,body=clean(b.message,2000),type=['text','image','offer','sticker','voice'].includes(b.type)?b.type:'text';if(!id||(type==='text'&&!body))return reply.code(400).send({error:'invalid_message'});if(!(await requireAllowed(a.sub,'message')))return reply.code(403).send({error:'message_restricted'});
    const r=await pool.query('SELECT buyer_identity_id,seller_identity_id,l.chat_enabled FROM banner_inquiries i JOIN banner_listings l ON l.id=i.listing_id WHERE i.id=$1 AND (buyer_identity_id=$2 OR seller_identity_id=$2)',[id,a.sub]);if(!r.rows[0])return reply.code(404).send({error:'conversation_not_found'});
    if(r.rows[0].chat_enabled!==true)return reply.code(403).send({error:'chat_disabled'});const recipient=r.rows[0].buyer_identity_id===a.sub?r.rows[0].seller_identity_id:r.rows[0].buyer_identity_id;
    const rawMedia=typeof b.mediaBase64==='string'&&b.mediaBase64?Buffer.from(b.mediaBase64,'base64'):null;if(rawMedia&&rawMedia.length>MAX_MEDIA_BYTES)return reply.code(413).send({error:'media_too_large'});let media:Buffer|null=null;if(rawMedia){if(type!=='image'||!allowedMime.has(String(b.mediaMime??'')))return reply.code(400).send({error:'image_only_media_required'});try{media=await sanitizeImage(rawMedia,String(b.mediaMime));}catch(e:any){return reply.code(String(e?.message)==='normalized_image_too_large'?413:400).send({error:String(e?.message??'invalid_image_content')});}}const m=await pool.query('INSERT INTO banner_inquiry_messages(inquiry_id,sender_identity_id,body,message_type,media_data,media_mime,offer_amount) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id::text message_id,sender_identity_id,body,message_type,media_mime,offer_amount,created_at',[id,a.sub,body,type,media,b.mediaMime??null,b.offerAmount??null]);
    await pool.query('UPDATE banner_inquiries SET status=\'replied\',updated_at=NOW() WHERE id=$1',[id]);
    await notify(recipient,'message','پیام جدید','در گفت‌وگوی آن بنر پیام جدیدی دارید');
    await activity(a.sub,'message_sent','inquiry',String(id));return reply.code(201).send({message:m.rows[0]});
  });
  app.get('/api/v1/banner/me/tickets',{preHandler:requireAuth},async(req)=>{const a=auth(req);const r=await pool.query('SELECT id,subject,category,priority,status,created_at,updated_at FROM banner_tickets WHERE identity_id=$1 ORDER BY updated_at DESC',[a.sub]);return{tickets:r.rows};});
  app.post('/api/v1/banner/tickets',{preHandler:requireAuth},async(req,reply)=>{const a=auth(req),b=(req.body??{}) as any,subject=clean(b.subject,160),message=clean(b.message,4000),category=clean(b.category,60)||'general';if(!subject||!message)return reply.code(400).send({error:'subject_and_message_required'});const r=await pool.query('INSERT INTO banner_tickets(identity_id,subject,category) VALUES($1,$2,$3) RETURNING *',[a.sub,subject,category]);await pool.query('INSERT INTO banner_ticket_messages(ticket_id,sender_identity_id,sender_type,body) VALUES($1,$2,\'user\',$3)',[r.rows[0].id,a.sub,message]);await activity(a.sub,'ticket_created','ticket',String(r.rows[0].id),{category});await notify(a.sub,'system','تیکت ثبت شد','تیکت پشتیبانی شما در آن بنر ثبت شد');await pool.query('INSERT INTO banner_admin_alerts(alert_type,identity_id,title,description,threshold) VALUES($1,$2,$3,$4,$5)',['ticket',a.sub,'تیکت جدید آن بنر','یک تیکت جدید برای بررسی مدیریت ثبت شد.',null]);return reply.code(201).send({ticket:r.rows[0]});});
  app.post('/api/v1/banner/tickets/:id/reply',{preHandler:requireAuth},async(req,reply)=>{
    const a=auth(req),id=idParam((req.params as any).id),body=clean((req.body as any)?.message,4000);if(!id||!body)return reply.code(400).send({error:'invalid_reply'});
    const owner=await pool.query('SELECT identity_id FROM banner_tickets WHERE id=$1 AND identity_id=$2',[id,a.sub]);if(!owner.rows[0])return reply.code(404).send({error:'ticket_not_found'});
    const m=await pool.query('INSERT INTO banner_ticket_messages(ticket_id,sender_identity_id,sender_type,body) VALUES($1,$2,\'user\',$3) RETURNING *',[id,a.sub,body]);
    await pool.query('UPDATE banner_tickets SET status=\'open\',updated_at=NOW() WHERE id=$1',[id]);await activity(a.sub,'ticket_reply','ticket',String(id));await audit(a.sub,'ticket_reply','ticket',String(id),{});return{message:m.rows[0]};
  });
  app.get('/api/v1/banner/tickets/:id',{preHandler:requireAuth},async(req,reply)=>{const a=auth(req),id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});const r=await pool.query('SELECT * FROM banner_tickets WHERE id=$1 AND identity_id=$2',[id,a.sub]);if(!r.rows[0])return reply.code(404).send({error:'ticket_not_found'});const m=await pool.query('SELECT id,sender_type,body,created_at FROM banner_ticket_messages WHERE ticket_id=$1 ORDER BY created_at',[id]);return{ticket:r.rows[0],messages:m.rows};});
}

async function registerInternal(app:FastifyInstance){
  app.get('/internal/v1/admin/alerts',{preHandler:requireAdminInternal},async(req)=>{
    const q=req.query as any,limit=Math.min(500,Math.max(1,Number(q.limit??200)||200));
    const r=await pool.query('SELECT * FROM banner_admin_alerts WHERE resolved_at IS NULL ORDER BY created_at DESC LIMIT $1',[limit]);return{alerts:r.rows};
  });
  app.patch('/internal/v1/admin/alerts/:id',{preHandler:requireAdminInternal},async(req,reply)=>{
    const id=idParam((req.params as any).id),b=(req.body??{}) as any;if(!id||!b.adminIdentityId)return reply.code(400).send({error:'invalid_alert'});
    const r=await pool.query('UPDATE banner_admin_alerts SET resolved_at=NOW(),resolved_by=$2 WHERE id=$1 RETURNING *',[id,b.adminIdentityId]);if(!r.rows[0])return reply.code(404).send({error:'alert_not_found'});return{alert:r.rows[0]};
  });
  app.get('/internal/v1/admin/templates',{preHandler:requireAdminInternal},async()=>{const r=await pool.query('SELECT * FROM banner_admin_message_templates ORDER BY id');return{templates:r.rows};});
  app.post('/internal/v1/admin/templates',{preHandler:requireAdminInternal},async(req,reply)=>{
    const b=(req.body??{}) as any;if(!clean(b.title,160)||!clean(b.body,4000)||!b.adminIdentityId)return reply.code(400).send({error:'invalid_template'});
    const r=await pool.query('INSERT INTO banner_admin_message_templates(title,body,restriction_code,duration_hours,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$5) RETURNING *',[clean(b.title,160),clean(b.body,4000),['none','chat','favorite','listing','message','contact','all'].includes(b.restrictionCode)?b.restrictionCode:'none',b.durationHours?Number(b.durationHours):null,b.adminIdentityId]);return{template:r.rows[0]};
  });
  app.patch('/internal/v1/admin/templates/:id',{preHandler:requireAdminInternal},async(req,reply)=>{
    const id=idParam((req.params as any).id),b=(req.body??{}) as any;if(!id||!b.adminIdentityId)return reply.code(400).send({error:'invalid_template'});
    const r=await pool.query('UPDATE banner_admin_message_templates SET title=COALESCE(NULLIF($1,\'\'),title),body=COALESCE(NULLIF($2,\'\'),body),restriction_code=COALESCE($3,restriction_code),duration_hours=$4,active=COALESCE($5,active),updated_by=$6,updated_at=NOW() WHERE id=$7 RETURNING *',[clean(b.title,160),clean(b.body,4000),b.restrictionCode??null,b.durationHours===undefined?null:Number(b.durationHours),b.active,b.adminIdentityId,id]);if(!r.rows[0])return reply.code(404).send({error:'template_not_found'});return{template:r.rows[0]};
  });
  app.post('/internal/v1/admin/users/:identityId/message',{preHandler:requireAdminInternal},async(req,reply)=>{
    const identity=String((req.params as any).identityId),b=(req.body??{}) as any;if(!b.adminIdentityId)return reply.code(400).send({error:'admin_identity_required'});
    let title=clean(b.title,160),body=clean(b.body,4000),template:any=null;if(b.templateId){const q=await pool.query('SELECT * FROM banner_admin_message_templates WHERE id=$1 AND active=TRUE',[Number(b.templateId)]);template=q.rows[0];}
    if(template){title=title||template.title;body=body||template.body;}
    if(!title||!body)return reply.code(400).send({error:'message_required'});
    let restrictionId:any=null;
    if(template?.restriction_code&&template.restriction_code!=='none'){
      const dur=template.duration_hours?Number(template.duration_hours):null;
      const q=await pool.query('INSERT INTO banner_restrictions(identity_id,restriction_code,reason,source_report_count,created_by,ends_at) VALUES($1,$2,$3,(SELECT violation_count FROM banner_profiles WHERE identity_id=$1),$4,$5) RETURNING *',[identity,template.restriction_code,body,b.adminIdentityId,dur?new Date(Date.now()+dur*3600000):null]);restrictionId=q.rows[0].id;
      await pool.query('UPDATE banner_profiles SET account_status=CASE WHEN account_status=\'banned\' THEN account_status ELSE \'restricted\' END,restriction_flags=restriction_flags || jsonb_build_object($2,true),restriction_reason=$3,restricted_until=$4,updated_at=NOW() WHERE identity_id=$1',[identity,template.restriction_code,body,dur?new Date(Date.now()+dur*3600000):null]);
    }
    const m=await pool.query('INSERT INTO banner_user_messages(identity_id,sender_admin_identity_id,title,body,template_id,restriction_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[identity,b.adminIdentityId,title,body,template?.id??null,restrictionId]);
    await notify(identity,'system',title,body);await audit(b.adminIdentityId,'admin_user_message','user',identity,{templateId:template?.id??null,restrictionId});return{message:m.rows[0],restrictionId};
  });
  app.post('/internal/v1/admin/users/:identityId/restrict',{preHandler:requireAdminInternal},async(req,reply)=>{
    const identity=String((req.params as any).identityId),b=(req.body??{}) as any,code=['chat','favorite','listing','message','contact','all'].includes(b.restrictionCode)?b.restrictionCode:null;if(!code||!b.adminIdentityId)return reply.code(400).send({error:'invalid_restriction'});
    const ends=b.durationHours?new Date(Date.now()+Number(b.durationHours)*3600000):null;const r=await pool.query('INSERT INTO banner_restrictions(identity_id,restriction_code,reason,source_report_count,created_by,ends_at) VALUES($1,$2,$3,(SELECT violation_count FROM banner_profiles WHERE identity_id=$1),$4,$5) RETURNING *',[identity,code,clean(b.reason,1000)||'محدودیت مدیریتی',b.adminIdentityId,ends]);
    await pool.query('UPDATE banner_profiles SET account_status=CASE WHEN account_status=\'banned\' THEN account_status ELSE \'restricted\' END,restriction_flags=restriction_flags || jsonb_build_object($2,true),restriction_reason=$3,restricted_until=$4,updated_at=NOW() WHERE identity_id=$1',[identity,code,clean(b.reason,1000)||'محدودیت مدیریتی',ends]);await notify(identity,'system','محدودیت حساب',clean(b.reason,1000)||'یک محدودیت مدیریتی برای حساب شما اعمال شد');await audit(b.adminIdentityId,'admin_restrict_user','user',identity,{restrictionId:r.rows[0].id,code});return{restriction:r.rows[0]};
  });
  app.post('/internal/v1/admin/users/:identityId/ban',{preHandler:requireAdminInternal},async(req,reply)=>{
    const identity=String((req.params as any).identityId),b=(req.body??{}) as any;if(!b.adminIdentityId)return reply.code(400).send({error:'admin_identity_required'});
    const r=await pool.query('UPDATE banner_profiles SET account_status=\'banned\',restriction_flags=jsonb_set(restriction_flags,\'{all}\',\'true\'::jsonb,true),restriction_reason=$2,restricted_until=NULL,updated_at=NOW() WHERE identity_id=$1 RETURNING *',[identity,clean(b.reason,1000)||'مسدودسازی دائمی توسط مدیریت']);if(!r.rows[0])return reply.code(404).send({error:'profile_not_found'});
    await notify(identity,'system','مسدودسازی حساب',r.rows[0].restriction_reason);await audit(b.adminIdentityId,'admin_ban_user','user',identity,{permanent:true});return{profile:r.rows[0]};
  });
  app.post('/internal/v1/admin/users/:identityId/unrestrict',{preHandler:requireAdminInternal},async(req,reply)=>{
    const identity=String((req.params as any).identityId),b=(req.body??{}) as any;
    if(!b.adminIdentityId)return reply.code(400).send({error:'admin_identity_required'});
    const r=await pool.query('UPDATE banner_restrictions SET revoked_at=NOW(),revoked_by=$2 WHERE identity_id=$1 AND revoked_at IS NULL RETURNING id',[identity,b.adminIdentityId]);
    const active=await pool.query("SELECT 1 FROM banner_restrictions WHERE identity_id=$1 AND revoked_at IS NULL AND starts_at<=NOW() AND (ends_at IS NULL OR ends_at>NOW()) LIMIT 1",[identity]);
    const p=active.rows[0]
      ? await pool.query("UPDATE banner_profiles SET account_status='restricted',updated_at=NOW() WHERE identity_id=$1 RETURNING *",[identity])
      : await pool.query("UPDATE banner_profiles SET account_status='active',restriction_flags='{}'::jsonb,restriction_reason=NULL,restricted_until=NULL,updated_at=NOW() WHERE identity_id=$1 AND account_status<>'banned' RETURNING *",[identity]);
    if(!p.rows[0])return reply.code(404).send({error:'profile_not_found'});
    await notify(identity,'system','رفع محدودیت حساب','محدودیت‌های فعال حساب شما توسط مدیریت رفع شد.');
    await audit(b.adminIdentityId,'admin_unrestrict_user','user',identity,{revokedCount:r.rowCount??0});
    return{profile:p.rows[0],revokedCount:r.rowCount??0};
  });
  app.get('/internal/v1/admin/overview',{preHandler:requireAdminInternal},async()=>{const [l,p,t,u,a,rp]=await Promise.all([pool.query("SELECT COUNT(*)::int count FROM banner_listings WHERE status='published'"),pool.query("SELECT COUNT(*)::int count FROM banner_listings WHERE status='pending'"),pool.query("SELECT COUNT(*)::int count FROM banner_tickets WHERE status NOT IN ('resolved','closed')"),pool.query("SELECT COUNT(DISTINCT identity_id)::int count FROM banner_activity_events"),pool.query("SELECT COUNT(*)::int count FROM banner_audit_logs"),pool.query("SELECT COUNT(*)::int count FROM banner_reports WHERE status='pending'")]);return{publishedListings:l.rows[0].count,pendingListings:p.rows[0].count,openTickets:t.rows[0].count,activeUsers:u.rows[0].count,auditEvents:a.rows[0].count,pendingReports:rp.rows[0].count};});
  app.get('/internal/v1/admin/listings',{preHandler:requireAdminInternal},async(req)=>{const q=req.query as any,limit=Math.min(200,Math.max(1,Number(q.limit??100)||100));const r=await pool.query('SELECT id,identity_id,category_id,title,description,price,currency,condition,city,status,views,created_at,updated_at FROM banner_listings ORDER BY created_at DESC LIMIT $1',[limit]);return{listings:r.rows};});
  app.patch('/internal/v1/admin/listings/:id/status',{preHandler:requireAdminInternal},async(req,reply)=>{const id=idParam((req.params as any).id),b=(req.body??{}) as any;if(!id||!['pending','published','rejected','paused','sold','archived','deleted'].includes(b.status))return reply.code(400).send({error:'invalid_status'});const r=await pool.query('UPDATE banner_listings SET status=$1,moderation_reason=$2,updated_at=NOW() WHERE id=$3 RETURNING *',[b.status,clean(b.reason,1000)||null,id]);if(!r.rows[0])return reply.code(404).send({error:'listing_not_found'});await audit(b.actorIdentityId??null,'admin_listing_status','listing',String(id),{status:b.status,reason:b.reason??null});await notify(r.rows[0].identity_id,'system','وضعیت آگهی تغییر کرد','وضعیت آگهی شما به '+b.status+' تغییر کرد');return{listing:r.rows[0]};});
  app.get('/internal/v1/admin/tickets',{preHandler:requireAdminInternal},async(req)=>{const q=req.query as any,limit=Math.min(200,Math.max(1,Number(q.limit??100)||100));const r=await pool.query('SELECT id,identity_id,subject,category,priority,status,assigned_admin_identity_id,created_at,updated_at FROM banner_tickets ORDER BY updated_at DESC LIMIT $1',[limit]);return{tickets:r.rows};});
  app.get('/internal/v1/admin/tickets/:id',{preHandler:requireAdminInternal},async(req,reply)=>{const id=idParam((req.params as any).id);if(!id)return reply.code(400).send({error:'invalid_id'});const r=await pool.query('SELECT * FROM banner_tickets WHERE id=$1',[id]);if(!r.rows[0])return reply.code(404).send({error:'ticket_not_found'});const m=await pool.query('SELECT id,sender_type,sender_identity_id,body,created_at FROM banner_ticket_messages WHERE ticket_id=$1 ORDER BY created_at',[id]);return{ticket:r.rows[0],messages:m.rows};});
  app.post('/internal/v1/admin/tickets/:id/reply',{preHandler:requireAdminInternal},async(req,reply)=>{const id=idParam((req.params as any).id),b=(req.body??{}) as any,body=clean(b.message,4000);if(!id||!body||!b.adminIdentityId)return reply.code(400).send({error:'invalid_reply'});const r=await pool.query('INSERT INTO banner_ticket_messages(ticket_id,sender_identity_id,sender_type,body,internal) VALUES($1,$2,\'admin\',$3,FALSE) RETURNING *',[id,b.adminIdentityId,body]);await pool.query('UPDATE banner_tickets SET status=\'pending\',assigned_admin_identity_id=$2,updated_at=NOW() WHERE id=$1',[id,b.adminIdentityId]);await audit(b.adminIdentityId,'admin_ticket_reply','ticket',String(id),{});const owner=await pool.query('SELECT identity_id FROM banner_tickets WHERE id=$1',[id]);if(owner.rows[0])await notify(owner.rows[0].identity_id,'support-reply','پاسخ پشتیبانی','پشتیبانی آن بنر به تیکت شما پاسخ داد');return{message:r.rows[0]};});
  app.patch('/internal/v1/admin/tickets/:id',{preHandler:requireAdminInternal},async(req,reply)=>{const id=idParam((req.params as any).id),b=(req.body??{}) as any;if(!id||!['open','pending','resolved','closed'].includes(b.status))return reply.code(400).send({error:'invalid_status'});const r=await pool.query('UPDATE banner_tickets SET status=$1,assigned_admin_identity_id=COALESCE($2,assigned_admin_identity_id),updated_at=NOW() WHERE id=$3 RETURNING *',[b.status,b.adminIdentityId??null,id]);if(!r.rows[0])return reply.code(404).send({error:'ticket_not_found'});await audit(b.adminIdentityId??'00000000-0000-0000-0000-000000000000','admin_ticket_status','ticket',String(id),{status:b.status});return{ticket:r.rows[0]};});
  app.get('/internal/v1/admin/reports',{preHandler:requireAdminInternal},async(req)=>{
    const q=req.query as any,limit=Math.min(500,Math.max(1,Number(q.limit??200)||200));
    const r=await pool.query('SELECT r.*,l.title,l.identity_id listing_owner_identity_id FROM banner_reports r JOIN banner_listings l ON l.id=r.listing_id ORDER BY r.created_at DESC LIMIT $1',[limit]);return{reports:r.rows};
  });
  app.patch('/internal/v1/admin/reports/:id',{preHandler:requireAdminInternal},async(req,reply)=>{
    const id=idParam((req.params as any).id),b=(req.body??{}) as any;
    if(!id||!['pending','reviewed','resolved','rejected'].includes(b.status)||!b.adminIdentityId)return reply.code(400).send({error:'invalid_report_update'});
    const r=await pool.query(`UPDATE banner_reports SET status=$1,updated_at=NOW() WHERE id=$2 AND status='pending' RETURNING *`,[b.status,id]);
    if(!r.rows[0])return reply.code(404).send({error:'report_not_found_or_already_reviewed'});
    if(b.status==='resolved'||b.status==='rejected'){
      await pool.query('UPDATE banner_violation_reports SET status=$1,reviewed_at=NOW(),reviewed_by=$2 WHERE listing_id=(SELECT listing_id FROM banner_reports WHERE id=$3)',[b.status==='resolved'?'confirmed':'dismissed',b.adminIdentityId,id]);
    }
    if(b.status==='resolved'){
      const owner=await pool.query('SELECT l.identity_id FROM banner_reports br JOIN banner_listings l ON l.id=br.listing_id WHERE br.id=$1',[id]);
      if(owner.rows[0]){
        const v=await pool.query('UPDATE banner_profiles SET violation_count=violation_count+1,updated_at=NOW() WHERE identity_id=$1 RETURNING violation_count',[owner.rows[0].identity_id]);
        const count=Number(v.rows[0]?.violation_count??0);
        if(count===20||count===40) await pool.query('INSERT INTO banner_admin_alerts(alert_type,identity_id,title,description,threshold) VALUES(\'violation-threshold\',$1,$2,$3,$4)',[owner.rows[0].identity_id,'هشدار تعداد تخلفات','تعداد تخلفات تأییدشده کاربر به '+count+' رسید.',count]);
      }
    }
    await audit(b.adminIdentityId,'admin_report_status','report',String(id),{status:b.status});return{report:r.rows[0]};
  });
  app.get('/internal/v1/admin/activity',{preHandler:requireAdminInternal},async(req)=>{const q=req.query as any,limit=Math.min(1000,Math.max(1,Number(q.limit??500)||500)),identity=clean(q.identityId,80);const params:any[]=[];let where='';if(identity){params.push(identity);where='WHERE identity_id=$1';}params.push(limit);const r=await pool.query(`SELECT * FROM banner_activity_events ${where} ORDER BY occurred_at DESC LIMIT $${params.length}`,params);return{activities:r.rows};});
  app.get('/internal/v1/admin/audit',{preHandler:requireAdminInternal},async(req)=>{const q=req.query as any,limit=Math.min(1000,Math.max(1,Number(q.limit??500)||500)),identity=clean(q.identityId,80);const params:any[]=[];let where='';if(identity){params.push(identity);where='WHERE identity_id=$1 OR actor_identity_id=$1';}params.push(limit);const r=await pool.query(`SELECT * FROM banner_audit_logs ${where} ORDER BY created_at DESC LIMIT $${params.length}`,params);return{audit:r.rows};});
  app.get('/internal/v1/admin/users/:identityId/export',{preHandler:requireAdminInternal},async(req,reply)=>{
    const identity=String((req.params as any).identityId),q=req.query as any,format=q.format==='csv'?'csv':'json',actor=clean(q.actorIdentityId,80);
    if(!actor)return reply.code(400).send({error:'actor_identity_required'});
    const [profile,listings,tickets,inquiries,messages,activityRows,auditRows,violations]=await Promise.all([
      pool.query('SELECT * FROM banner_profiles WHERE identity_id=$1',[identity]),
      pool.query('SELECT * FROM banner_listings WHERE identity_id=$1 ORDER BY created_at',[identity]),
      pool.query('SELECT * FROM banner_tickets WHERE identity_id=$1 ORDER BY created_at',[identity]),
      pool.query('SELECT * FROM banner_inquiries WHERE buyer_identity_id=$1 OR seller_identity_id=$1 ORDER BY created_at',[identity]),
      pool.query('SELECT m.* FROM banner_inquiry_messages m JOIN banner_inquiries i ON i.id=m.inquiry_id WHERE i.buyer_identity_id=$1 OR i.seller_identity_id=$1 ORDER BY m.created_at',[identity]),
      pool.query('SELECT * FROM banner_activity_events WHERE identity_id=$1 ORDER BY occurred_at',[identity]),
      pool.query('SELECT * FROM banner_audit_logs WHERE identity_id=$1 OR actor_identity_id=$1 ORDER BY created_at',[identity]),
      pool.query('SELECT * FROM banner_violation_reports WHERE reported_identity_id=$1 OR reporter_identity_id=$1 ORDER BY created_at',[identity])
    ]);
    await pool.query('INSERT INTO banner_user_history_exports(identity_id,requested_by,format) VALUES($1,$2,$3)',[identity,actor,format]);await audit(actor,'history_export','user',identity,{format});
    const data={profile:profile.rows,listings:listings.rows,tickets:tickets.rows,inquiries:inquiries.rows,messages:messages.rows,activity:activityRows.rows,audit:auditRows.rows,violations:violations.rows};
    if(format==='json')return data;
    const rows:[string,unknown][]=[['profile',profile.rows],['listings',listings.rows],['tickets',tickets.rows],['inquiries',inquiries.rows],['messages',messages.rows],['activity',activityRows.rows],['audit',auditRows.rows],['violations',violations.rows]];
    const csv=rows.map(([k,v])=>k+'\n'+JSON.stringify(v).replace(/\n/g,' ')).join('\n');reply.header('Content-Type','text/csv; charset=utf-8').header('Content-Disposition',`attachment; filename="an-banner-user-${identity}.csv"`).send(csv);
  });
  app.get('/internal/v1/admin/users/:identityId/summary',{preHandler:requireAdminInternal},async(req)=>{const identity=String((req.params as any).identityId);const [p,l,t,a,act,rs,msgs,chatMsgs,viol]=await Promise.all([pool.query('SELECT * FROM banner_profiles WHERE identity_id=$1',[identity]),pool.query('SELECT id,title,status,price,currency,city,views,created_at,updated_at FROM banner_listings WHERE identity_id=$1 ORDER BY created_at DESC LIMIT 200',[identity]),pool.query('SELECT id,subject,status,priority,created_at,updated_at FROM banner_tickets WHERE identity_id=$1 ORDER BY updated_at DESC LIMIT 100',[identity]),pool.query('SELECT * FROM banner_audit_logs WHERE identity_id=$1 OR actor_identity_id=$1 ORDER BY created_at DESC LIMIT 200',[identity]),pool.query('SELECT * FROM banner_activity_events WHERE identity_id=$1 ORDER BY occurred_at DESC LIMIT 500',[identity]),pool.query('SELECT * FROM banner_restrictions WHERE identity_id=$1 ORDER BY created_at DESC LIMIT 100',[identity]),pool.query('SELECT id,title,body,created_at FROM banner_user_messages WHERE identity_id=$1 ORDER BY created_at DESC LIMIT 100',[identity]),pool.query('SELECT m.* FROM banner_inquiry_messages m JOIN banner_inquiries i ON i.id=m.inquiry_id WHERE i.buyer_identity_id=$1 OR i.seller_identity_id=$1 ORDER BY m.created_at DESC LIMIT 2000',[identity]),pool.query('SELECT * FROM banner_violation_reports WHERE reported_identity_id=$1 ORDER BY created_at DESC LIMIT 200',[identity])]);return{profile:p.rows[0]??null,listings:l.rows,tickets:t.rows,audit:a.rows,activity:act.rows,restrictions:rs.rows,messages:msgs.rows,chatMessages:chatMsgs.rows,violations:viol.rows};});
}

app.get('/health',async()=>({service:'banner',status:'ok'}));
app.get('/health/db',async(_r,reply)=>{try{const r=await pool.query<{version:string}>('SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1');return{service:'banner',database:'ok',migration:r.rows[0]?.version??null};}catch{return reply.code(503).send({service:'banner',database:'unavailable'});}});
const origins=process.env.CORS_ORIGIN?.split(',').map(x=>x.trim()).filter(Boolean)??['http://localhost:5173'];await app.register(cors,{origin:origins});
await registerPublic(app);await registerPrivate(app);await registerInternal(app);
const shutdown=async()=>{await app.close();await pool.end()};process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
await app.listen({host:'0.0.0.0',port:Number(process.env.PORT??4005)});
