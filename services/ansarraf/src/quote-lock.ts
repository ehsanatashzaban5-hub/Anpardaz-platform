import type {Pool,PoolClient} from 'pg';

export async function consumeQuoteLock(client:PoolClient,lockId:number,customerId:number,operationId:string){
  const q=await client.query(
    `UPDATE quote_locks
       SET status='CONSUMED',consumed_at=NOW(),consumed_by_operation_id=$1
     WHERE id=$2 AND customer_id=$3 AND status='ACTIVE' AND expires_at>NOW()
     RETURNING *`,
    [operationId,lockId,customerId]
  );
  if(!q.rows[0])throw new Error('quote_lock_unavailable_or_expired');
  return q.rows[0];
}

export async function expireQuoteLocks(pool:Pool){
  const r=await pool.query(
    `UPDATE quote_locks SET status='EXPIRED'
      WHERE status='ACTIVE' AND expires_at<=NOW()
      RETURNING id`
  );
  return r.rowCount??0;
}

export async function createQuoteLock(client:PoolClient,args:{
  customerId:number;orderId:number;providerId:number;symbol:string;side:'buy'|'sell';
  quantity:string;executablePrice:string;customerFee:string;providerFeeEstimate:string;ttlSeconds:number;
}){
  if(args.ttlSeconds<1||args.ttlSeconds>120)throw new Error('invalid_quote_lock_ttl');
  const existing=await client.query(
    `SELECT * FROM quote_locks WHERE order_id=$1 AND status='ACTIVE' FOR UPDATE`,
    [args.orderId]
  );
  if(existing.rows[0])throw new Error('active_quote_lock_exists');
  const r=await client.query(
    `INSERT INTO quote_locks(customer_id,order_id,provider_id,symbol,side,quantity,executable_price,customer_fee,provider_fee_estimate,expires_at)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()+($10::text||' seconds')::interval)
     RETURNING *`,
    [args.customerId,args.orderId,args.providerId,args.symbol,args.side,args.quantity,args.executablePrice,args.customerFee,args.providerFeeEstimate,args.ttlSeconds]
  );
  return r.rows[0];
}
