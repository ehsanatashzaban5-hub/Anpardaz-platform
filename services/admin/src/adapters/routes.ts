import type {FastifyInstance,FastifyReply,FastifyRequest} from 'fastify';
import {proxyOwningService,resolveServiceTarget} from './service-proxy.js';
import {requireAdmin} from '../proxy.js';

type AdminRequest=FastifyRequest&{adminIdentity?:{identity_id:string;email?:string;display_name?:string;role:string;status:string;phone?:string|null}};


function permissionFor(request:AdminRequest):string{
  const raw=String((request.params as {'*':string})['*']??'').replace(/^\//,'');
  const p=raw.slice('ecosystem/'.length);
  const write=request.method!=='GET'&&request.method!=='HEAD';
  if(p.startsWith('ansarraf/fees')) return 'ansarraf_fees.write';
  if(p.startsWith('ansarraf/kyc/')) return 'approvals.write';
  if(p==='ansarraf/kyc') return 'users.read';
  if(p.startsWith('ansarraf/withdrawals/')) return p.endsWith('/reconcile')?'reconciliation.write':'approvals.write';
  if(p==='ansarraf/withdrawals') return 'operations.read';
  if(p.startsWith('ansarraf/forex-bot/requests/')) return 'approvals.write';
  if(p==='ansarraf/forex-bot/requests') return 'operations.read';
  if(p.startsWith('ansarraf/security/cases/')) return 'approvals.write';
  if(p==='ansarraf/security/cases') return 'operations.read';
  if(p==='ansarraf/deposits/manual/credit') return 'approvals.write';
  if(p==='ansarraf/deposits/manual') return 'operations.read';
  if(p.startsWith('anpardaz/cashback/policies')) return write?'operations.write':'operations.read';
  if(p==='anpardaz/sayad-operations'||p==='anpardaz/banking-operations'||p==='anpardaz/operations'||p.startsWith('anpardaz/operations/')) return 'operations.read';
  if(p.startsWith('anpardaz/financial-center/')||p.startsWith('anpardaz/cards/lifecycle/')||p==='anpardaz/cards/lookup'||p.startsWith('anpardaz/users/')) return 'users.read';
  if(p==='banner/overview'||p.startsWith('banner/')&&request.method==='GET') return 'banner.read';
  if(p.startsWith('banner/')) return 'banner.write';
  return write?'admin.write':'admin.read';
}

export function registerOwningServiceAdminRoutes(app:FastifyInstance){
  app.route({method:['GET','POST','PUT','PATCH','DELETE'],url:'/api/v1/admin/ecosystem/*',preHandler:async(request,reply)=>{
    await requireAdmin(request as AdminRequest,reply,permissionFor(request as AdminRequest));
    if(reply.sent)return;
    const target=resolveServiceTarget(request as AdminRequest);
    if(!target)return reply.code(404).send({error:'admin_route_not_found'});
    return undefined;
  },handler:async(request,reply)=>{
    const target=resolveServiceTarget(request as AdminRequest);
    if(!target)return reply.code(404).send({error:'admin_route_not_found'});
    return proxyOwningService(request as AdminRequest,reply,target);
  }});
}
