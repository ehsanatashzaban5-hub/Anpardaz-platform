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

  app.get('/internal/v1/admin/banking/operations',async(request,reply)=>{
    if(!authorized(request))return reply.code(401).send({error:'unauthorized'});
    const q=request.query as {status?:string;limit?:string}; const limit=Math.min(Math.max(Number(q.limit??500)||500,1),2000);
    const rows=await pool.query(`SELECT t.*,c.identity_id,c.email FROM transfer_requests t JOIN customers c ON c.id=t.customer_id WHERE ($1::text IS NULL OR t.status=$1) ORDER BY t.created_at DESC LIMIT $2`,[q.status?.trim()||null,limit]);
    return {operations:rows.rows};
  });

  app.get('/internal/v1/admin/operations/:operationId/trace',async(request,reply)=>{
    if(!authorized(request))return reply.code(401).send({error:'unauthorized'});
    const operationId=(request.params as {operationId:string}).operationId?.trim();
    if(!operationId||operationId.length>200)return reply.code(400).send({error:'invalid_operation_id'});
    const [transfers,topups,serviceOperations]=await Promise.all([
      pool.query('SELECT * FROM transfer_requests WHERE operation_id=$1 ORDER BY id',[operationId]),
      pool.query('SELECT * FROM topup_requests WHERE operation_id=$1 ORDER BY id',[operationId]),
      pool.query('SELECT * FROM fintech_service_operations WHERE operation_id=$1 ORDER BY id',[operationId]),
    ]);
    if(!transfers.rows.length&&!topups.rows.length&&!serviceOperations.rows.length)return reply.code(404).send({error:'operation_not_found'});
    return {operationId,transfers:transfers.rows,topups:topups.rows,serviceOperations:serviceOperations.rows};
  });
}
