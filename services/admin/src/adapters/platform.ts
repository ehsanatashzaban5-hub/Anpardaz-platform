import type {FastifyInstance,FastifyReply,FastifyRequest} from 'fastify';
import {requireAdmin} from '../proxy.js';

type Identity={identity_id:string;email?:string;display_name?:string;role:string;status:string;phone?:string|null};
type AdminRequest=FastifyRequest&{adminIdentity?:Identity};
const env=(name:string,fallback:string)=>(process.env[name]??fallback).replace(/\/$/,'');
const json=async(url:string,token:string,timeout=7000)=>{try{const r=await fetch(url,{headers:{authorization:'Bearer '+token,accept:'application/json'},signal:AbortSignal.timeout(timeout)});const body=await r.json().catch(()=>({}));return{ok:r.ok,status:r.status,body};}catch(e){return{ok:false,status:503,body:{error:e instanceof Error?e.message:'service_unavailable'}}}};

export function registerPlatformAdminAdapters(app:FastifyInstance){
 app.get('/api/v1/admin/ecosystem/health',async(request,reply)=>{
  await requireAdmin(request as AdminRequest,reply,'service_health.read'); if(reply.sent)return;
  const services=[['platform',env('PLATFORM_SERVICE_URL','http://127.0.0.1:4003'),process.env.ADMIN_INTERNAL_TOKEN??''],['ansarraf',env('ANSARRAF_SERVICE_URL','http://127.0.0.1:4002'),process.env.ANSARRAF_INTERNAL_TOKEN??''],['anpardaz',env('ANPARDAZ_SERVICE_URL','http://127.0.0.1:4001'),process.env.ANPARDAZ_INTERNAL_TOKEN??''],['accounting',env('ACCOUNTING_SERVICE_URL','http://127.0.0.1:4004'),process.env.ACCOUNTING_INTERNAL_TOKEN??'']] as const;
  const results=await Promise.all(services.map(async([name,base,token])=>{const h=await json(base+'/health',token);return{service:name,reachable:h.ok,status:h.status,health:h.body}}));
  const degraded=results.some(x=>!x.reachable); return reply.code(degraded?503:200).send({status:degraded?'degraded':'healthy',services:results});
 });
 app.get('/api/v1/admin/ecosystem/users/:identityId',async(request,reply)=>{
  await requireAdmin(request as AdminRequest,reply,'users.read'); if(reply.sent)return;
  const identityId=String((request.params as {identityId:string}).identityId??'').trim(); if(!identityId||identityId.length>200)return reply.code(400).send({error:'invalid_identity_id'});
  const platform=env('PLATFORM_SERVICE_URL','http://127.0.0.1:4003');
  const [user,ansarraf,anpardaz,accounting,banner]=await Promise.all([
   json(platform+'/api/v1/auth/me',String(request.headers.authorization??'').replace(/^Bearer /,'')),
   json(env('ANSARRAF_SERVICE_URL','http://127.0.0.1:4002')+'/internal/v1/admin/users/'+encodeURIComponent(identityId)+'/summary',process.env.ANSARRAF_INTERNAL_TOKEN??''),
   json(env('ANPARDAZ_SERVICE_URL','http://127.0.0.1:4001')+'/internal/v1/admin/users/'+encodeURIComponent(identityId)+'/summary',process.env.ANPARDAZ_INTERNAL_TOKEN??''),
   json(env('ACCOUNTING_SERVICE_URL','http://127.0.0.1:4004')+'/internal/v1/ledger/accounts?ownerIdentityId='+encodeURIComponent(identityId)+'&limit=500',process.env.ACCOUNTING_INTERNAL_TOKEN??''),
   json(env('BANNER_SERVICE_URL','http://127.0.0.1:4005')+'/internal/v1/admin/users/'+encodeURIComponent(identityId)+'/summary',process.env.BANNER_INTERNAL_TOKEN??'')
  ]);
  const current=user.body?.user; if(!current||current.identity_id!==identityId)return reply.code(404).send({error:'user_not_found'});
  return{user:current,services:{ansarraf:ansarraf.ok?ansarraf.body:{unavailable:true,status:ansarraf.status,error:ansarraf.body},anpardaz:anpardaz.ok?anpardaz.body:{unavailable:true,status:anpardaz.status,error:anpardaz.body},accounting:accounting.ok?accounting.body:{unavailable:true,status:accounting.status,error:accounting.body},banner:banner.ok?banner.body:{unavailable:true,status:banner.status,error:banner.body}}};
 });
 app.get('/api/v1/admin/ecosystem/operations/:operationId/trace',async(request,reply)=>{
  await requireAdmin(request as AdminRequest,reply,'operations.read'); if(reply.sent)return;
  const id=String((request.params as {operationId:string}).operationId??'').trim(); if(!id||id.length>200)return reply.code(400).send({error:'invalid_operation_id'});
  const [ansarraf,anpardaz,accounting]=await Promise.all([
   json(env('ANSARRAF_SERVICE_URL','http://127.0.0.1:4002')+'/internal/v1/admin/operations/'+encodeURIComponent(id)+'/trace',process.env.ANSARRAF_INTERNAL_TOKEN??''),
   json(env('ANPARDAZ_SERVICE_URL','http://127.0.0.1:4001')+'/internal/v1/admin/operations/'+encodeURIComponent(id)+'/trace',process.env.ANPARDAZ_INTERNAL_TOKEN??''),
   json(env('ACCOUNTING_SERVICE_URL','http://127.0.0.1:4004')+'/internal/v1/ledger/transactions/by-operation/'+encodeURIComponent(id),process.env.ACCOUNTING_INTERNAL_TOKEN??'')
  ]);
  return{operationId:id,ansarraf:ansarraf.ok?ansarraf.body:{unavailable:true,status:ansarraf.status,error:ansarraf.body},anpardaz:anpardaz.ok?anpardaz.body:{unavailable:true,status:anpardaz.status,error:anpardaz.body},accounting:accounting.ok?accounting.body:{unavailable:true,status:accounting.status,error:accounting.body}};
 });
}
