import type {FastifyInstance,FastifyRequest} from 'fastify';
import type {Pool} from 'pg';

function guard(req:FastifyRequest,reply:any){
  const token=process.env.ANSARRAF_INTERNAL_TOKEN;
  if(!token||req.headers.authorization!==`Bearer ${token}`){reply.code(401).send({error:'unauthorized'});return false;}
  return true;
}

export function registerSecurityAdminRoutes(app:FastifyInstance,pool:Pool){
  app.get('/internal/v1/admin/security/cases',async(req,reply)=>{
    if(!guard(req,reply))return;
    const q=req.query as any;
    const status=typeof q?.status==='string'&&['open','released','rejected'].includes(q.status)?q.status:'open';
    const rows=await pool.query(
      `SELECT f.*,c.identity_id,c.external_user_id,c.email,c.status AS customer_status
         FROM funding_security_cases f
         JOIN customers c ON c.id=f.customer_id
        WHERE f.status=$1
        ORDER BY f.created_at DESC
        LIMIT 500`,[status]);
    return {cases:rows.rows};
  });

  app.post('/internal/v1/admin/security/cases/:id/release',async(req,reply)=>{
    if(!guard(req,reply))return;
    const id=Number((req.params as any)?.id);
    const actor=String(req.headers['x-admin-identity']??'').trim();
    const reason=String((req.body as any)?.reason??'').trim();
    if(!Number.isSafeInteger(id)||id<=0||!actor||actor.length>200||reason.length<3||reason.length>1000)
      return reply.code(400).send({error:'case_id_actor_and_reason_required'});
    const client=await pool.connect();
    try{
      await client.query('BEGIN');
      const c=(await client.query(
        `SELECT f.*,c.status AS customer_status,c.security_hold_reason
           FROM funding_security_cases f
           JOIN customers c ON c.id=f.customer_id
          WHERE f.id=$1 FOR UPDATE`,[id])).rows[0];
      if(!c)throw new Error('security_case_not_found');
      if(c.status!=='open')throw new Error('security_case_not_open');
      await client.query(
        `UPDATE funding_security_cases
            SET status='released',reviewed_by=$2,reviewed_at=NOW(),review_reason=$3
          WHERE id=$1`,[id,actor,reason]);
      await client.query(
        `UPDATE customers
            SET status='active',security_hold_reason=NULL,security_hold_at=NULL,updated_at=NOW()
          WHERE id=$1 AND status='blocked' AND security_hold_reason='RAPID_TOMAN_CRYPTO_CONVERSION'`,[c.customer_id]);
      await client.query('COMMIT');
      return {released:true,caseId:id,customerId:String(c.customer_id),reviewedBy:actor};
    }catch(e){
      await client.query('ROLLBACK');
      return reply.code(400).send({error:e instanceof Error?e.message:'security_case_release_failed'});
    }finally{client.release();}
  });
}
