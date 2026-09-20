import type {FastifyInstance,FastifyRequest,FastifyReply} from 'fastify';
import type {Pool} from 'pg';

function authorized(request:FastifyRequest){
  const token=process.env.ANPARDAZ_INTERNAL_TOKEN;
  return Boolean(token&&request.headers.authorization===`Bearer ${token}`);
}

export function registerInternalAdminRoutes(app:FastifyInstance,pool:Pool){
  app.get('/internal/v1/admin/users/:identityId/summary',async(request,reply)=>{
    if(!authorized(request))return reply.code(401).send({error:'unauthorized'});
    const identityId=(request.params as {identityId:string}).identityId?.trim();
    if(!identityId||identityId.length>200)return reply.code(400).send({error:'invalid_identity_id'});
    const customer=(await pool.query(
      'SELECT id,identity_id,external_user_id,email,status,created_at,updated_at FROM customers WHERE identity_id=$1 LIMIT 1',
      [identityId],
    )).rows[0];
    if(!customer)return reply.code(404).send({error:'customer_not_found'});
    const customerId=customer.id;
    const [accounts,cards,transfers,topups]=await Promise.all([
      pool.query('SELECT id,account_type,currency,status,created_at FROM accounts WHERE customer_id=$1 ORDER BY id',[customerId]),
      pool.query('SELECT id,account_id,last4,status,created_at FROM cards WHERE customer_id=$1 ORDER BY id',[customerId]),
      pool.query('SELECT id,source_account_id,destination_account_id,destination_external,amount,currency,description,status,idempotency_key,operation_id,created_at,updated_at FROM transfer_requests WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 200',[customerId]),
      pool.query('SELECT id,account_id,amount,currency,provider,external_reference,status,idempotency_key,operation_id,created_at,updated_at FROM topup_requests WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 200',[customerId]),
    ]);
    return {customer,accounts:accounts.rows,cards:cards.rows,transfers:transfers.rows,topups:topups.rows};
  });
}
