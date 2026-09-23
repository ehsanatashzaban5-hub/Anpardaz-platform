import type {FastifyInstance,FastifyRequest} from 'fastify';
import type {Pool} from 'pg';

function authorized(request:FastifyRequest){
  const token=process.env.ANPARDAZ_INTERNAL_TOKEN;
  return Boolean(token&&request.headers.authorization===`Bearer ${token}`);
}

export function registerInternalAdminRoutes(app:FastifyInstance,pool:Pool){
  app.get('/internal/v1/admin/operations',async(request,reply)=>{
    if(!authorized(request))return reply.code(401).send({error:'unauthorized'});
    const q=request.query as {limit?:string;status?:string};
    const limit=Math.min(500,Math.max(1,Number.parseInt(q.limit??'200',10)||200));
    const status=q.status?.trim();
    const rows=await pool.query(
      `SELECT operation_id,service_code,status,provider_code,provider_operation_id,external_reference,
              failure_code,failure_message,created_at,updated_at,completed_at
       FROM fintech_service_operations
       WHERE ($1::text IS NULL OR status=$1)
       ORDER BY created_at DESC LIMIT $2`,
      [status||null,limit],
    );
    return {operations:rows.rows};
  });

  app.get('/internal/v1/admin/users/:identityId/summary',async(request,reply)=>{
    if(!authorized(request))return reply.code(401).send({error:'unauthorized'});
    const identityId=(request.params as {identityId:string}).identityId?.trim();
    if(!identityId||identityId.length>200)return reply.code(400).send({error:'invalid_identity_id'});
    const customer=(await pool.query(
      'SELECT id,identity_id,external_user_id,email,status,created_at,updated_at FROM customers WHERE identity_id=$1 LIMIT 1',[identityId]
    )).rows[0];
    if(!customer)return reply.code(404).send({error:'customer_not_found'});
    const customerId=customer.id;
    const [accounts,cards,transfers,topups,cardBalanceChecks]=await Promise.all([
      pool.query('SELECT id,account_type,currency,status,created_at FROM accounts WHERE customer_id=$1 ORDER BY id',[customerId]),
      pool.query('SELECT id,account_id,last4,status,created_at FROM cards WHERE customer_id=$1 ORDER BY id',[customerId]),
      pool.query('SELECT id,source_account_id,destination_account_id,destination_external,amount,currency,description,status,idempotency_key,operation_id,provider_code,provider_operation_id,provider_reference,provider_status,provider_error_code,provider_error_message,created_at,updated_at FROM transfer_requests WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 200',[customerId]),
      pool.query('SELECT id,account_id,amount,currency,provider,external_reference,status,idempotency_key,operation_id,provider_operation_id,provider_reference,provider_status,provider_error_code,provider_error_message,created_at,updated_at FROM topup_requests WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 200',[customerId]),
      pool.query('SELECT id,operation_id,card_last4,status,balance,currency,provider_reference,created_at,completed_at FROM card_balance_checks WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 200',[customerId]),
    ]);
    return {customer,accounts:accounts.rows,cards:cards.rows,transfers:transfers.rows,topups:topups.rows,cardBalanceChecks:cardBalanceChecks.rows};
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
    const [transfers,topups,serviceOperations,cardBalanceChecks,outbox]=await Promise.all([
      pool.query('SELECT * FROM transfer_requests WHERE operation_id=$1 ORDER BY id',[operationId]),
      pool.query('SELECT * FROM topup_requests WHERE operation_id=$1 ORDER BY id',[operationId]),
      pool.query('SELECT * FROM fintech_service_operations WHERE operation_id=$1 ORDER BY id',[operationId]),
      pool.query('SELECT * FROM card_balance_checks WHERE operation_id=$1 ORDER BY id',[operationId]),
      pool.query('SELECT * FROM banking_provider_outbox WHERE operation_id=$1 ORDER BY id',[operationId]),
    ]);
    if(!transfers.rows.length&&!topups.rows.length&&!serviceOperations.rows.length&&!cardBalanceChecks.rows.length)return reply.code(404).send({error:'operation_not_found'});
    return {operationId,transfers:transfers.rows,topups:topups.rows,serviceOperations:serviceOperations.rows,cardBalanceChecks:cardBalanceChecks.rows,outbox:outbox.rows};
  });
}
