import type { FastifyReply, FastifyRequest } from 'fastify';

type Identity={identity_id:string;email?:string;display_name?:string;role:string;status:string;phone?:string|null};
type AdminRequest=FastifyRequest&{adminIdentity?:Identity};
const platformUrl=()=> (process.env.PLATFORM_SERVICE_URL??'http://127.0.0.1:4003').replace(/\/$/,'');
const internalToken=()=>process.env.ADMIN_INTERNAL_TOKEN??'';

export async function requireAdmin(request:AdminRequest,reply:FastifyReply){
  const authorization=String(request.headers.authorization??'');
  if(!authorization.startsWith('Bearer ')) return reply.code(401).send({error:'unauthorized'});
  const identityToken=authorization.slice(7).trim();
  if(!identityToken||identityToken.length>8192) return reply.code(401).send({error:'unauthorized'});
  const r=await fetch(platformUrl()+'/internal/v1/admin/authorize',{
    method:'POST',
    headers:{
      authorization:'Bearer '+internalToken(),
      'content-type':'application/json',
      'x-identity-token':identityToken,
      'x-admin-permission':request.method==='GET'?'admin.read':'admin.write'
    },
    signal:AbortSignal.timeout(5000)
  });
  if(!r.ok){
    if(r.status===403) return reply.code(403).send({error:'forbidden'});
    return reply.code(503).send({error:'identity_service_unavailable'});
  }
  request.adminIdentity=await r.json() as Identity;
}

export async function proxyAdminRequest(request:AdminRequest,reply:FastifyReply){
  const wildcard=String((request.params as {'*':string})['*']??'').replace(/^\//,'');
  if(!wildcard||wildcard.includes('..')||wildcard.includes('\\')) return reply.code(400).send({error:'invalid_admin_path'});
  const target=platformUrl()+'/api/v1/admin/'+wildcard;
  const headers:Record<string,string>={};
  headers.authorization=String(request.headers.authorization??'');
  headers.accept='application/json';
  const contentType=request.headers['content-type'];
  if(typeof contentType==='string') headers['content-type']=contentType;
  const body=request.body===undefined||request.body===null?undefined:JSON.stringify(request.body);
  const r=await fetch(target,{
    method:request.method,
    headers,
    body:['GET','HEAD'].includes(request.method)?undefined:body,
    signal:AbortSignal.timeout(15000)
  });
  const text=await r.text();
  const responseType=r.headers.get('content-type')??'';
  if(responseType.includes('application/json')){
    try{return reply.code(r.status).send(JSON.parse(text));}catch{}
  }
  return reply.code(r.status).type(responseType||'text/plain').send(text);
}
