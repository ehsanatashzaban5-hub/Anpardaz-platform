import type { FastifyReply, FastifyRequest } from 'fastify';

type Identity={identity_id:string;email?:string;display_name?:string;role:string;status:string;phone?:string|null};
type AdminRequest=FastifyRequest&{adminIdentity?:Identity};
const platformUrl=()=> (process.env.PLATFORM_SERVICE_URL??'http://127.0.0.1:4003').replace(/\/$/,'');
const internalToken=()=>process.env.ADMIN_INTERNAL_TOKEN??'';

export async function requireAdmin(request:AdminRequest,reply:FastifyReply,permission?:string){
  const authorization=String(request.headers.authorization??'');
  if(!authorization.startsWith('Bearer ')) return reply.code(401).send({error:'unauthorized'});
  const identityToken=authorization.slice(7).trim();
  if(!identityToken||identityToken.length>8192) return reply.code(401).send({error:'unauthorized'});
  const r=await fetch(platformUrl()+'/internal/v1/admin/authorize',{
    method:'POST',
    headers:{authorization:'Bearer '+internalToken(),'x-admin-gateway-token':internalToken(),'content-type':'application/json','x-identity-token':identityToken,'x-admin-permission':'content.write'??(request.method==='GET'?'admin.read':'admin.write')},
    signal:AbortSignal.timeout(5000)
  });
  if(!r.ok){
    if(r.status===403) return reply.code(403).send({error:'forbidden'});
    return reply.code(503).send({error:'identity_service_unavailable'});
  }
  request.adminIdentity=await r.json() as Identity;
}

export async function adminLogin(body: unknown, reply: FastifyReply) {
  const r=await fetch(platformUrl()+'/api/v1/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(5000)});
  const data=await r.json().catch(()=>({error:'authentication_failed'}));
  if(!r.ok) return reply.code(r.status).send(data);
  const token=String((data as {accessToken?:string}).accessToken??'');
  if(!token) return reply.code(502).send({error:'authentication_failed'});
  const check=await fetch(platformUrl()+'/internal/v1/admin/authorize',{
    method:'POST',
    headers:{authorization:'Bearer '+internalToken(),'x-admin-gateway-token':internalToken(),'content-type':'application/json','x-identity-token':token,'x-admin-permission':'admin.read'},
    signal:AbortSignal.timeout(5000)
  });
  if(!check.ok) return reply.code(403).send({error:'admin_access_required'});
  return reply.send(data);
}

export async function proxyAdminMultipart(request:AdminRequest,reply:FastifyReply){
  const wildcard=String((request.params as {'*':string})['*']??'').replace(/^\//,'');
  if(wildcard!=='content/videos') return reply.code(404).send({error:'unsupported_multipart_admin_path'});
  const parts=request.parts();
  const form=new FormData();
  for await (const part of parts){
    if(part.type==='file'){
      const bytes=await part.toBuffer();
      const fileBuffer=new ArrayBuffer(bytes.byteLength);
      new Uint8Array(fileBuffer).set(bytes);
      form.append(part.fieldname,new Blob([fileBuffer],{type:part.mimetype}),part.filename);
    }else{
      form.append(part.fieldname,String(part.value));
    }
  }
  const r=await fetch(platformUrl()+'/internal/v1/admin/content/videos',{
    method:'POST',
    headers:{authorization:String(request.headers.authorization??''),'x-admin-gateway-token':internalToken(),accept:'application/json','x-admin-permission':permission},
    body:form,signal:AbortSignal.timeout(30000)
  });
  const text=await r.text(); const type=r.headers.get('content-type')??'';
  if(type.includes('application/json')){try{return reply.code(r.status).send(JSON.parse(text));}catch{}}
  return reply.code(r.status).type(type||'text/plain').send(text);
}


export function adminPermissionForPath(wildcard:string,method:string):string{
  const p=wildcard.replace(/^\/+/, '');
  const write=!['GET','HEAD'].includes(method);
  if(p==='overview') return 'users.read';
  if(p.startsWith('content/')) return p==='content/policies'&&write?'content.write':p.startsWith('content/policies/')&&write?'content.write':p==='content/pipeline'||p==='content/videos'?'content.read':p.startsWith('content/videos/')?'content.write':'content.read';
  if(p.startsWith('hoosh/tickets')) return write?'hoosh.support.manage':'hoosh.support.read';
  if(p.startsWith('hoosh/requests')) return write?'hoosh.manage':'hoosh.read';
  if(p.startsWith('hoosh/providers')) return 'hoosh.manage';
  if(p.startsWith('market/')) return write?'content.write':'content.read';
  if(p.startsWith('support/tickets')) return write?'support.write':'support.read';
  if(p.startsWith('moderation/')) return write?'content.moderate':'content.read';
  if(p.startsWith('settings')) return 'settings.write';
  if(p.startsWith('maintenance')) return 'maintenance.write';
  if(p.startsWith('approvals')) return write?'approvals.write':'approvals.read';
  if(p.startsWith('reconciliation-runs')) return write?'reconciliation.write':'reconciliation.read';
  if(p==='service-health') return 'service_health.read';
  if(p.startsWith('news')) return write?'content.write':'content.read';
  if(p.startsWith('banner')) return write?'content.write':'content.read';
  if(p.startsWith('forum')) return write?'content.moderate':'content.read';
  return write?'admin.write':'admin.read';
}

export async function proxyAdminRequest(request:AdminRequest,reply:FastifyReply){
  const permission=adminPermissionForPath(String((request.params as {'*':string})['*']??''),request.method);
  const wildcard=String((request.params as {'*':string})['*']??'').replace(/^\//,'');
  if(!wildcard||wildcard.includes('..')||wildcard.includes('\\')) return reply.code(400).send({error:'invalid_admin_path'});
  const target=platformUrl()+'/internal/v1/admin/'+wildcard;
  const headers:Record<string,string>={authorization:String(request.headers.authorization??''),'x-admin-gateway-token':internalToken(),accept:'application/json'};
  const contentType=String(request.headers['content-type']??'');
  if(contentType) headers['content-type']=contentType;
  if(contentType.toLowerCase().startsWith('multipart/form-data')) return reply.code(415).send({error:'multipart_not_supported_for_admin_path'});
  const body=request.body===undefined||request.body===null?undefined:JSON.stringify(request.body);
  const r=await fetch(target,{method:request.method,headers,body:['GET','HEAD'].includes(request.method)?undefined:body,signal:AbortSignal.timeout(15000)});
  const text=await r.text(); const responseType=r.headers.get('content-type')??'';
  if(responseType.includes('application/json')){try{return reply.code(r.status).send(JSON.parse(text));}catch{}}
  return reply.code(r.status).type(responseType||'text/plain').send(text);
}
