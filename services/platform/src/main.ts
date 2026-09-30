import Fastify from 'fastify';import cors from '@fastify/cors';import {Pool} from 'pg';import {registerAuthRoutes,requireAuth,ensurePlatformUser,verifyIdentityToken,type AuthClaims} from './auth.js';import {NewsRepository} from './repositories/news-repository.js';import {NewsService} from './services/news-service.js';import {registerContentRoutes} from './routes/content.js';import {registerForumRoutes} from './routes/forum.js';import {registerAdminRoutes} from './routes/admin.js';import {registerAdminSettingsRoutes} from './routes/admin-settings.js';import {registerControlPlaneRoutes} from './routes/control-plane.js';import {registerModerationRoutes} from './routes/moderation.js';import {registerAdminForumRoutes} from './routes/admin-forum.js';import {registerOperationsRoutes} from './routes/operations.js';import {registerAiRoutes} from './routes/ai.js';import {registerUserSettingsRoutes} from './routes/user-settings.js';import {registerSupportRoutes} from './routes/support.js';
import {hasPermission} from './permissions.js';import {registerContentManagementRoutes} from './routes/content-management.js';
import {AiGateway} from './services/ai-gateway.js';
import {ContentPipeline} from './services/content-pipeline.js';import {iranIpDecision,requireIranIpInProduction} from '@anpardaz/ip-region-policy';
const isProduction=process.env.NODE_ENV==='production';let contentPipeline:ContentPipeline|undefined;const requiredProduction=['DATABASE_URL','CORS_ORIGIN','IDENTITY_ISSUER','IDENTITY_PRIVATE_KEY_B64','GUEST_INTERACTION_SECRET','ADMIN_INTERNAL_TOKEN','ANSARRAF_SERVICE_URL','ANPARDAZ_SERVICE_URL','ACCOUNTING_SERVICE_URL','ANSARRAF_INTERNAL_TOKEN','ACCOUNTING_INTERNAL_TOKEN','ANPARDAZ_INTERNAL_TOKEN','BANNER_SERVICE_URL','BANNER_INTERNAL_TOKEN','IP_GEOLOCATION_URL_TEMPLATE'];if(isProduction&&process.env.TRUST_PROXY!=='true')throw new Error('Production service must trust the configured HTTPS reverse proxy for client IP extraction');if(isProduction&&process.env.IP_POLICY_ALLOW_PRIVATE_NETWORKS==='true')throw new Error('Production IP policy must not allow private-network bypasses');if(isProduction){for(const name of requiredProduction){const value=process.env[name];if(!value||value.length<32||value.includes('CHANGE_ME')||value.includes('your-web-domain.example')||value.includes('BASE64-DER-ED25519-PRIVATE-KEY')||value.includes('GENERATE_A_LONG_RANDOM_SECRET')||value.includes('generate-a-long-random-secret'))throw new Error(`Production environment variable ${name} must be configured with a real value`);}}
if(isProduction&&process.env.PHONE_OTP_ENABLED==='true'){for(const name of ['OTP_HASH_SECRET','KAVENEGAR_API_KEY','KAVENEGAR_SENDER']){const value=process.env[name];if(!value||value.includes('CHANGE_ME'))throw new Error('Production phone OTP configuration is incomplete');}if(String(process.env.OTP_HASH_SECRET).length<32)throw new Error('Production OTP_HASH_SECRET must be at least 32 characters');}const trustProxy=process.env.TRUST_PROXY==='true';const app=Fastify({logger:true,trustProxy});const port=Number(process.env.PORT??4003);const databaseUrl=process.env.DATABASE_URL;const pool=databaseUrl?new Pool({connectionString:databaseUrl,max:10,connectionTimeoutMillis:5000,idleTimeoutMillis:30000}):null;if(!pool)app.log.warn('DATABASE_URL is not configured');const corsOrigins=process.env.CORS_ORIGIN?.split(',').map(v=>v.trim()).filter(Boolean)??['http://localhost:5173'];if(isProduction&&corsOrigins.some(v=>v==='*'||v.startsWith('http://localhost')||v.startsWith('http://127.0.0.1')))throw new Error('Production CORS_ORIGIN must not allow localhost or wildcard origins');await app.register(cors,{origin:corsOrigins});app.addHook('onSend',async(_r,reply)=>{reply.header('X-Content-Type-Options','nosniff');reply.header('Referrer-Policy','strict-origin-when-cross-origin');reply.header('X-Frame-Options','DENY');reply.header('X-DNS-Prefetch-Control','off');reply.header('Permissions-Policy','camera=(),microphone=(),geolocation=()');reply.header('Cache-Control','no-store');if(isProduction)reply.header('Strict-Transport-Security','max-age=31536000; includeSubDomains');});

app.addHook('onSend',async(_request,reply)=>{reply.header('X-Content-Type-Options','nosniff');reply.header('X-Frame-Options','DENY');reply.header('Referrer-Policy','no-referrer');reply.header('Permissions-Policy','camera=(),microphone=(),geolocation=()');if(process.env.NODE_ENV==='production')reply.header('Strict-Transport-Security','max-age=31536000; includeSubDomains');});app.get('/health',async()=>({service:'platform',status:'ok'}));app.get('/health/db',async(_r,reply)=>{if(!pool)return reply.code(503).send({service:'platform',database:'not-configured'});try{const x=await pool.query<{version:string}>('SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1');return{service:'platform',database:'ok',migration:x.rows[0]?.version??null};}catch{return reply.code(503).send({service:'platform',database:'unavailable'});}});app.get('/api/v1/status',async()=>({service:'platform',apiVersion:'v1',status:'ready'}));
app.post('/internal/v1/identity/introspect',async(request,reply)=>{
  const authorization=String(request.headers.authorization??'');
  const serviceToken=authorization.startsWith('Bearer ')?authorization.slice(7):'';
  const allowedTokens=[process.env.ANPARDAZ_INTERNAL_TOKEN,process.env.ANSARRAF_INTERNAL_TOKEN,process.env.BANNER_INTERNAL_TOKEN,process.env.ADMIN_INTERNAL_TOKEN].filter(Boolean);
  if(!serviceToken||!allowedTokens.includes(serviceToken))return reply.code(401).send({error:'unauthorized'});
  const token=String(request.headers['x-identity-token']??'');
  const claims=verifyIdentityToken(token);
  if(!claims)return reply.code(401).send({error:'unauthorized'});
  const u=await pool?.query('SELECT identity_id,email,display_name,role,status,phone FROM platform_users WHERE identity_id=$1 LIMIT 1',[claims.sub]);
  if(!u?.rows[0]||u.rows[0].status!=='active')return reply.code(401).send({error:'unauthorized'});
  return {user:u.rows[0]};
});app.addHook('onRequest',async(request,reply)=>{
 if(request.url.startsWith('/internal/v1/admin/')){
   const gatewayToken=String(request.headers['x-admin-gateway-token']??'');
   if(!gatewayToken||gatewayToken!==process.env.ADMIN_INTERNAL_TOKEN)return reply.code(404).send({error:'not_found'});
 }
});
app.addHook('onRequest',async(request,reply)=>{if(request.url.startsWith('/api/v1/')&&!request.url.startsWith('/api/v1/access/region'))await requireIranIpInProduction(request,reply);});app.get('/api/v1/access/region',async(request)=>{const d=await iranIpDecision(request);return{allowed:d.allowed,countryCode:d.countryCode,source:d.source};});app.post('/internal/v1/admin/authorize',async(request,reply)=>{
 const token=String(request.headers.authorization??'').startsWith('Bearer ')?String(request.headers.authorization).slice(7):'';
 if(!token||token!==process.env.ADMIN_INTERNAL_TOKEN)return reply.code(401).send({error:'unauthorized'});
 const identityToken=String(request.headers['x-identity-token']??'');
 const claims=verifyIdentityToken(identityToken);
 if(!claims)return reply.code(401).send({error:'unauthorized'});
 const permission=String(request.headers['x-admin-permission']??'admin.read');
 if(!/^[a-z][a-z0-9_.-]{1,127}$/.test(permission))return reply.code(400).send({error:'invalid_permission'});
 const u=await pool?.query('SELECT identity_id,email,display_name,role,status FROM platform_users WHERE identity_id=$1 LIMIT 1',[claims.sub]);
 const user=u?.rows[0];
 if(!user||user.status!=='active')return reply.code(401).send({error:'unauthorized'});
 const roles=new Set(['admin','super_admin','operator','editor','moderator','support']);
 if(!roles.has(String(user.role)))return reply.code(403).send({error:'forbidden'});
 if(permission==='admin.write'&&String(user.role)==='support')return reply.code(403).send({error:'forbidden'});
 if(permission!=='admin.read'&&permission!=='admin.write'){
   const allowed=await hasPermission(pool!,{sub:claims.sub} as AuthClaims,permission);
   if(!allowed)return reply.code(403).send({error:'forbidden'});
 }
 return {identity_id:user.identity_id,email:user.email,display_name:user.display_name,role:user.role,status:user.status};
});


app.post('/internal/v1/admin/audit-event',async(request,reply)=>{
 const token=String(request.headers.authorization??'').startsWith('Bearer ')?String(request.headers.authorization).slice(7):'';
 if(!token||token!==process.env.ADMIN_INTERNAL_TOKEN)return reply.code(401).send({error:'unauthorized'});
 const b=(request.body??{}) as {identityId?:string;action?:string;resourceType?:string;resourceId?:string|null;reason?:string;metadata?:unknown};
 const identityId=String(b.identityId??request.headers['x-admin-identity']??'').trim();
 const action=String(b.action??'').trim(),resourceType=String(b.resourceType??'').trim();
 if(!identityId||!action||!resourceType||action.length>200||resourceType.length>100)return reply.code(400).send({error:'invalid_audit_event'});
 await pool?.query(`INSERT INTO admin_action_requests(actor_user_id,action,resource_type,resource_id,reason,status,metadata,completed_at) SELECT id,$2,$3,$4,$5,'completed',$6,NOW() FROM platform_users WHERE identity_id=$1`,[identityId,action,resourceType,b.resourceId??null,String(b.reason??'Admin action'),b.metadata??{}]);
 return {recorded:true};
});

if(pool){app.decorate('platformPool',pool);registerAuthRoutes(app,pool);const news=new NewsService(new NewsRepository(pool));app.get('/api/v1/auth/me',{preHandler:requireAuth},async(request)=>{const a=(request as typeof request&{auth:AuthClaims}).auth,id=await ensurePlatformUser(pool,a),x=await pool.query('SELECT id,identity_id,email,display_name,role,status FROM platform_users WHERE id=$1',[id]);return x.rows[0]?{user:x.rows[0]}:{error:'user_not_found'};});app.get<{Querystring:{page?:string;limit?:string;category?:string}}>('/api/v1/news',async(request,reply)=>{try{return await news.list(Number.parseInt(request.query.page??'1',10)||1,Number.parseInt(request.query.limit??'20',10)||20,request.query.category?.trim()||null);}catch(e){request.log.error(e);return reply.code(503).send({error:'database_unavailable'});}});app.get('/api/v1/news/:slug',async(request,reply)=>{const slug=String((request.params as any).slug??'').trim();if(!slug)return reply.code(400).send({error:'invalid_slug'});const r=await pool.query("SELECT id,title,slug,summary,body,category_slug,source_url,source_name,meta_title,meta_description,keywords,hashtags,canonical_url,published_at FROM news_articles WHERE slug=$1 AND status='published' LIMIT 1",[slug]);if(!r.rows[0])return reply.code(404).send({error:'news_not_found'});return{article:r.rows[0]};});registerContentRoutes(app,pool);registerForumRoutes(app,pool);registerAdminRoutes(app,pool);registerAdminSettingsRoutes(app,pool);registerControlPlaneRoutes(app,pool);registerModerationRoutes(app,pool);registerAdminForumRoutes(app,pool);registerOperationsRoutes(app,pool);registerAiRoutes(app,pool);registerUserSettingsRoutes(app,pool);registerSupportRoutes(app,pool);await registerContentManagementRoutes(app,pool);
  registerContentEngagementRoutes(app,pool);contentPipeline=new ContentPipeline(pool,new AiGateway(pool));contentPipeline.start();}
const shutdown=async()=>{contentPipeline?.stop();await app.close();await pool?.end()};process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);await app.listen({host:'0.0.0.0',port});
