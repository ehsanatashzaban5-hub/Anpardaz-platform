import type { FastifyReply, FastifyRequest } from 'fastify';

type Identity={identity_id:string;email?:string;display_name?:string;role:string;status:string;phone?:string|null};
type AdminRequest=FastifyRequest&{adminIdentity?:Identity};

type Target={base:string;token:string;path:string;forwardIdentity?:boolean};
const base=(name:string, fallback:string)=>(process.env[name]??fallback).replace(/\/$/,'');
const methodHasBody=(m:string)=>!['GET','HEAD'].includes(m);
const query=(request:FastifyRequest)=>request.url.includes('?')?request.url.slice(request.url.indexOf('?')):'';
const encodeTail=(s:string)=>s.split('/').map(encodeURIComponent).join('/');

export function resolveServiceTarget(request:AdminRequest):Target|null{
  const raw=String((request.params as {'*':string})['*']??'').replace(/^\//,'');
  if(!raw.startsWith('ecosystem/')) return null;
  const p=raw.slice('ecosystem/'.length);
  const originalAuth=String(request.headers.authorization??'');
  const id=request.adminIdentity;
  const identityHeaders=Boolean(id);
  const ansarraf=base('ANSARRAF_SERVICE_URL','http://127.0.0.1:4002');
  const anpardaz=base('ANPARDAZ_SERVICE_URL','http://127.0.0.1:4001');
  const banner=base('BANNER_SERVICE_URL','http://127.0.0.1:4005');
  const at=process.env.ANSARRAF_INTERNAL_TOKEN??'';
  const apt=process.env.ANPARDAZ_INTERNAL_TOKEN??'';
  const bt=process.env.BANNER_INTERNAL_TOKEN??'';
  if(p==='ansarraf/kyc' || p.startsWith('ansarraf/kyc/')) return {base:ansarraf,token:at,path:'/internal/v1/admin/'+p.slice('ansarraf/'.length),forwardIdentity:identityHeaders};
  if(p==='ansarraf/withdrawals' || p.startsWith('ansarraf/withdrawals/')){
    const tail=p.slice('ansarraf/withdrawals'.length);
    const internal=['/complete-toman','/reconcile'];
    const isInternal=internal.some(x=>tail.startsWith(x));
    return {base:ansarraf,token:isInternal?at:originalAuth,path:(isInternal?'/internal/v1/admin/withdrawals':'/api/v1/withdrawals')+tail,forwardIdentity:!isInternal};
  }
  if(p==='ansarraf/forex-bot/requests' || p.startsWith('ansarraf/forex-bot/requests/')) return {base:ansarraf,token:at,path:'/internal/v1/admin/'+p.slice('ansarraf/'.length),forwardIdentity:identityHeaders};
  if(p==='ansarraf/security/cases' || p.startsWith('ansarraf/security/cases/')) return {base:ansarraf,token:at,path:'/internal/v1/admin/'+p.slice('ansarraf/'.length),forwardIdentity:identityHeaders};
  if(p==='ansarraf/deposits/manual' || p.startsWith('ansarraf/deposits/manual/')) return {base:ansarraf,token:at,path:'/internal/v1/admin/'+p.slice('ansarraf/'.length),forwardIdentity:identityHeaders};
  if(p==='ansarraf/fees' || p.startsWith('ansarraf/fees/')) return {base:ansarraf,token:at,path:'/internal/v1/admin/'+p.slice('ansarraf/'.length),forwardIdentity:identityHeaders};
  if(p==='anpardaz/cashback/policies' || p.startsWith('anpardaz/cashback/policies/')) return {base:anpardaz,token:apt,path:'/internal/v1/admin/'+p.slice('anpardaz/'.length),forwardIdentity:identityHeaders};
  if(p==='anpardaz/sayad-operations') return {base:anpardaz,token:apt,path:'/internal/v1/admin/sayad/operations',forwardIdentity:identityHeaders};
  if(p==='anpardaz/banking-operations') return {base:anpardaz,token:apt,path:'/internal/v1/admin/banking/operations',forwardIdentity:identityHeaders};
  if(p==='anpardaz/operations') return {base:anpardaz,token:apt,path:'/internal/v1/admin/operations',forwardIdentity:identityHeaders};
  if(p.startsWith('anpardaz/operations/')) return {base:anpardaz,token:apt,path:'/internal/v1/admin/operations/'+encodeTail(p.slice('anpardaz/operations/'.length))+'/trace',forwardIdentity:identityHeaders};
  if(p.startsWith('anpardaz/financial-center/')) return {base:anpardaz,token:apt,path:'/internal/v1/admin/financial-center/'+encodeURIComponent(p.slice('anpardaz/financial-center/'.length)),forwardIdentity:identityHeaders};
  if(p.startsWith('anpardaz/cards/lifecycle/')) return {base:anpardaz,token:apt,path:'/internal/v1/admin/cards/lifecycle/'+encodeURIComponent(p.slice('anpardaz/cards/lifecycle/'.length)),forwardIdentity:identityHeaders};
  if(p==='anpardaz/cards/lookup') return {base:anpardaz,token:apt,path:'/internal/v1/admin/cards/lookup',forwardIdentity:identityHeaders};
  if(p.startsWith('anpardaz/users/')) return {base:anpardaz,token:apt,path:'/internal/v1/admin/users/'+encodeURIComponent(p.slice('anpardaz/users/'.length))+'/summary',forwardIdentity:identityHeaders};
  if(p==='banner/overview') return {base:banner,token:bt,path:'/internal/v1/admin/overview',forwardIdentity:identityHeaders};
  if(p.startsWith('banner/')) return {base:banner,token:bt,path:'/internal/v1/admin/'+p.slice('banner/'.length),forwardIdentity:identityHeaders};
  return null;
}

export async function proxyOwningService(request:AdminRequest,reply:FastifyReply,target:Target){
  if(!target.token) return reply.code(503).send({error:'owning_service_credentials_not_configured'});
  const headers:Record<string,string>={authorization:'Bearer '+target.token,accept:String(request.headers.accept??'application/json')};
  if(target.forwardIdentity&&request.headers.authorization) headers['x-admin-user-authorization']=String(request.headers.authorization);
  if(request.adminIdentity){headers['x-admin-identity']=request.adminIdentity.identity_id;headers['x-admin-role']=request.adminIdentity.role;}
  const contentType=String(request.headers['content-type']??'');
  if(contentType&&!contentType.toLowerCase().startsWith('multipart/form-data')) headers['content-type']=contentType;
  const body=methodHasBody(request.method)?(request.body===undefined||request.body===null?undefined:JSON.stringify(request.body)):undefined;
  const response=await fetch(target.base+target.path+query(request),{method:request.method,headers,body,signal:AbortSignal.timeout(15000)});
  const text=await response.text();
  const responseType=response.headers.get('content-type')??'';
  if(responseType.includes('application/json')){try{return reply.code(response.status).send(JSON.parse(text));}catch{}}
  return reply.code(response.status).type(responseType||'text/plain').send(text);
}
