import type {FastifyInstance,FastifyReply,FastifyRequest} from 'fastify';
import {proxyOwningService,resolveServiceTarget} from './service-proxy.js';

type AdminRequest=FastifyRequest&{adminIdentity?:{identity_id:string;email?:string;display_name?:string;role:string;status:string;phone?:string|null}};

export function registerOwningServiceAdminRoutes(app:FastifyInstance){
  app.route({method:['GET','POST','PUT','PATCH','DELETE'],url:'/api/v1/admin/ecosystem/*',preHandler:async(request,reply)=>{
    const target=resolveServiceTarget(request as AdminRequest);
    if(!target)return reply.code(404).send({error:'admin_route_not_found'});
    return undefined;
  },handler:async(request,reply)=>{
    const target=resolveServiceTarget(request as AdminRequest);
    if(!target)return reply.code(404).send({error:'admin_route_not_found'});
    return proxyOwningService(request as AdminRequest,reply,target);
  }});
}
