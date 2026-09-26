import type {FastifyInstance,FastifyRequest,FastifyReply} from 'fastify';
import type {Pool} from 'pg';
import {ensureCustomer,requireAuth,type AuthClaims} from '../auth.js';

type R=FastifyRequest&{auth:AuthClaims};
const auth=(req:FastifyRequest)=> (req as R).auth;

export function registerCustomerProfileRoutes(app:FastifyInstance,pool:Pool){
  app.get('/api/v1/customer/profile',{preHandler:requireAuth},async(req,reply)=>{
    const c=await ensureCustomer(pool,auth(req));
    const row=(await pool.query('SELECT id,phone,first_name,last_name,national_id,birth_date FROM customers WHERE id=$1',[c])).rows[0];
    if(!row)return reply.code(404).send({error:'customer_not_found'});
    return {profile:row};
  });
  app.patch('/api/v1/customer/profile',{preHandler:requireAuth},async(req,reply)=>{
    const c=await ensureCustomer(pool,auth(req));
    const b=(req.body??{}) as any;
    const first=typeof b.firstName==='string'?b.firstName.trim():undefined;
    const last=typeof b.lastName==='string'?b.lastName.trim():undefined;
    const national=typeof b.nationalId==='string'?b.nationalId.replace(/\s/g,''):undefined;
    const birth=typeof b.birthDate==='string'?b.birthDate.trim():undefined;
    const phone=typeof b.phone==='string'?b.phone.replace(/[\s\-().]/g,''):undefined;
    if(first!==undefined&&(first.length<1||first.length>100)||last!==undefined&&(last.length<1||last.length>100)||national!==undefined&&!/^\d{10}$/.test(national)||phone!==undefined&&!/^09\d{9}$/.test(phone)||birth!==undefined&&!/^\d{4}-\d{2}-\d{2}$/.test(birth))return reply.code(400).send({error:'invalid_profile'});
    try{
      const row=(await pool.query(`UPDATE customers SET
        phone=COALESCE($2,phone),first_name=COALESCE($3,first_name),last_name=COALESCE($4,last_name),
        national_id=COALESCE($5,national_id),birth_date=COALESCE($6::date,birth_date)
        WHERE id=$1 RETURNING id,phone,first_name,last_name,national_id,birth_date`,
        [c,phone??null,first??null,last??null,national??null,birth??null])).rows[0];
      return {profile:row};
    }catch(e:any){
      if(e?.code==='23505')return reply.code(409).send({error:'profile_value_already_in_use'});
      if(e?.code==='22007')return reply.code(400).send({error:'invalid_birth_date'});
      throw e;
    }
  });
}
