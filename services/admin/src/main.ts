import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { requireAdmin, proxyAdminRequest, proxyAdminMultipart, adminLogin, adminPermissionForPath } from './proxy.js';
import { requireIranIpInProduction } from '@anpardaz/ip-region-policy';
import { registerOwningServiceAdminRoutes } from './adapters/routes.js';
import { registerPlatformAdminAdapters } from './adapters/platform.js';

const production = process.env.NODE_ENV === 'production';
const required = [
  'PLATFORM_SERVICE_URL','ADMIN_INTERNAL_TOKEN','IP_GEOLOCATION_URL_TEMPLATE',
  'ANSARRAF_SERVICE_URL','ANSARRAF_INTERNAL_TOKEN',
  'ANPARDAZ_SERVICE_URL','ANPARDAZ_INTERNAL_TOKEN',
  'BANNER_SERVICE_URL','BANNER_INTERNAL_TOKEN',
  'ACCOUNTING_SERVICE_URL','ACCOUNTING_INTERNAL_TOKEN'
];
if (production) {
  if (process.env.TRUST_PROXY !== 'true') throw new Error('Production admin service must trust the configured HTTPS reverse proxy');
  if (process.env.IP_POLICY_ALLOW_PRIVATE_NETWORKS === 'true') throw new Error('Production admin service must not allow private-network bypasses');
  for (const name of required) {
    const value = process.env[name];
    if (!value || value.includes('CHANGE_ME')) throw new Error('Production environment variable '+name+' must be configured with a real value');
    if (name.endsWith('_INTERNAL_TOKEN') && value.length < 32) throw new Error('Production internal service token '+name+' is too short');
    if (name.endsWith('_SERVICE_URL')) { const u=new URL(value); if (!['http:','https:'].includes(u.protocol)) throw new Error('Production service URL '+name+' must use HTTP(S)'); }
  }
}
const app = Fastify({ logger: true, trustProxy: process.env.TRUST_PROXY === 'true' });
const origins = process.env.CORS_ORIGIN?.split(',').map(v=>v.trim()).filter(Boolean) ?? ['http://localhost:5174'];
if (production && origins.some(v=>v==='*' || v.startsWith('http://localhost') || v.startsWith('http://127.0.0.1'))) {
  throw new Error('Production CORS_ORIGIN must not allow localhost or wildcard origins');
}
await app.register(cors,{origin:origins});
await app.register(multipart,{limits:{fileSize:Number(process.env.ADMIN_MAX_UPLOAD_BYTES??50*1024*1024),files:1,fields:10}});
app.addHook('onRequest',async(request,reply)=>{
  if(request.url.startsWith('/api/v1/admin/')) await requireIranIpInProduction(request,reply);
});
app.addHook('onSend',async(_request,reply)=>{
  reply.header('X-Content-Type-Options','nosniff');
  reply.header('X-Frame-Options','DENY');
  reply.header('Referrer-Policy','no-referrer');
  reply.header('Permissions-Policy','camera=(),microphone=(),geolocation=()');
  reply.header('Cache-Control','no-store');
  if(production) reply.header('Strict-Transport-Security','max-age=31536000; includeSubDomains');
});
app.get('/health',async()=>({service:'admin',status:'ok'}));
app.get('/api/v1/status',async()=>({service:'admin',apiVersion:'v1',status:'ready'}));
app.post('/api/v1/admin/auth/login',async(request,reply)=>adminLogin(request.body,reply));
app.get('/api/v1/admin/auth/me',{preHandler:async(request,reply)=>requireAdmin(request,reply)},async(request)=>({user:(request as typeof request & {adminIdentity?:unknown}).adminIdentity}));

registerPlatformAdminAdapters(app);
registerOwningServiceAdminRoutes(app);

app.post('/api/v1/admin/content/videos',{
  preHandler:async(request,reply)=>requireAdmin(request,reply,'content.write')
},async(request,reply)=>proxyAdminMultipart(request as any,reply));

app.route({
  method:['GET','POST','PUT','PATCH','DELETE'],
  url:'/api/v1/admin/*',
  preHandler:async(request,reply)=>requireAdmin(request,reply,adminPermissionForPath(String((request.params as {'*':string})['*']??''),request.method)),
  handler:async(request,reply)=>proxyAdminRequest(request,reply)
});
const shutdown=async()=>{await app.close();};
process.on('SIGTERM',shutdown);
process.on('SIGINT',shutdown);
await app.listen({host:'0.0.0.0',port:Number(process.env.PORT??4006)});
