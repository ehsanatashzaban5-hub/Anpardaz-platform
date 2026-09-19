import type {FastifyBaseLogger} from 'fastify';
import type {Pool} from 'pg';
import type {ProviderWithdrawalResult} from './providers/types.js';
import {createProviderRegistry} from './providers/index.js';

export class ProviderWithdrawalWorker{
  private stopped=false;
  private running=false;
  private timer?:ReturnType<typeof setTimeout>;
  constructor(private readonly pool:Pool,private readonly log:FastifyBaseLogger,private readonly registry=createProviderRegistry()){}
  start(){if(this.running)return;this.running=true;void this.loop();}
  stop(){this.stopped=true;if(this.timer)clearTimeout(this.timer);}
  private async loop(){
    if(this.stopped)return;
    try{const processed=await this.processOne();this.timer=setTimeout(()=>void this.loop(),processed?50:1000);}
    catch(error){this.log.error({error},'provider withdrawal worker failure');this.timer=setTimeout(()=>void this.loop(),2000);}
  }
  private async processOne(){
    const client=await this.pool.connect();let row:any;
    try{
      await client.query('BEGIN');
      const q=await client.query(`
        WITH candidate AS (
          SELECT id FROM provider_withdrawal_outbox
          WHERE ((status='pending' OR status='failed') AND available_at<=NOW())
             OR (status='processing' AND processing_started_at<NOW()-INTERVAL '5 minutes')
          ORDER BY available_at,id FOR UPDATE SKIP LOCKED LIMIT 1
        )
        UPDATE provider_withdrawal_outbox o
        SET status='processing',processing_started_at=NOW(),attempts=attempts+1
        FROM candidate c WHERE o.id=c.id RETURNING o.*`);
      if(!q.rows[0]){await client.query('COMMIT');return false;}
      row=q.rows[0];await client.query('COMMIT');
    }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
    try{
      await this.execute(row);
      await this.pool.query("UPDATE provider_withdrawal_outbox SET status='posted',processed_at=NOW(),processing_started_at=NULL,last_error=NULL WHERE id=$1 AND status='processing'",[row.id]);
    }catch(error){
      const message=error instanceof Error?error.message:'provider_withdrawal_failed';
      const terminal=message.startsWith('withdrawal_unknown_after_submission');
      const seconds=Math.min(300,Math.max(2,2**Math.min(Number(row.attempts),8)));
      await this.pool.query(
        `UPDATE provider_withdrawal_outbox
         SET status=$2,available_at=CASE WHEN $2='failed' THEN NOW()+($3::text)::interval ELSE available_at END,
             processing_started_at=NULL,last_error=$4
         WHERE id=$1 AND status='processing'`,
        [row.id,terminal?'failed':'failed',seconds+' seconds',message.slice(0,2000)]);
      this.log.error({outboxId:row.id,attempts:row.attempts,error},'provider withdrawal event failed');
    }
    return true;
  }
  private async execute(row:any){
    const payload=row.payload??{};
    const q=await this.pool.query(
      `SELECT w.*,a.symbol,lp.code AS provider_code,lp.status AS provider_status
       FROM withdrawals w
       JOIN assets a ON a.id=w.asset_id
       LEFT JOIN liquidity_providers lp ON lp.id=w.liquidity_provider_id
       WHERE w.id=$1 FOR UPDATE`,[row.withdrawal_id]);
    const w=q.rows[0];
    if(!w)throw new Error('withdrawal_not_found');
    if(w.approval_status!=='APPROVED')throw new Error('withdrawal_not_approved');
    if(['completed','cancelled'].includes(w.status))return;
    const providerCode=String(w.provider_code??payload.providerCode??'');
    const adapter=this.registry.get(providerCode);
    if(!adapter||!this.registry.executionEnabled)throw new Error('provider_execution_not_enabled');

    let result:ProviderWithdrawalResult;
    if(row.event_type==='provider.withdrawal.submit'){
      if(w.provider_withdrawal_id){
        result=await adapter.getWithdrawal(String(w.provider_withdrawal_id));
      }else{
        try{
          result=await adapter.submitWithdrawal({
            asset:String(w.symbol),
            network:String(w.network),
            amount:String(w.amount),
            destination:String(w.destination),
            memo:w.destination_memo?String(w.destination_memo):null,
            clientWithdrawalId:String(w.operation_id)
          });
        }catch(error){
          const message=error instanceof Error?error.message:'provider_withdrawal_submission_failed';
          if(message.includes('wallex_http_4')||message.includes('wallex_http_422'))
            throw new Error(message);
          throw new Error('withdrawal_unknown_after_submission:'+message);
        }
      }
    }else{
      if(!w.provider_withdrawal_id)throw new Error('withdrawal_provider_id_missing');
      result=await adapter.getWithdrawal(String(w.provider_withdrawal_id));
    }

    if(!result.providerWithdrawalId && result.status!=='FAILED')throw new Error('provider_withdrawal_id_missing');
    await this.persistAndSettle(Number(w.id),result);

    if(result.status==='PROCESSING'){
      await this.pool.query(
        `INSERT INTO provider_withdrawal_outbox(withdrawal_id,event_type,idempotency_key,payload)
         VALUES($1,'provider.withdrawal.poll',$2,$3)
         ON CONFLICT(idempotency_key) DO NOTHING`,
        [w.id,'ansarraf:withdrawal-poll:'+w.id,{withdrawalId:w.id,providerCode}]);
    }
  }
  private async persistAndSettle(withdrawalId:number,result:ProviderWithdrawalResult){
    const client=await this.pool.connect();
    try{
      await client.query('BEGIN');
      const q=await client.query("SELECT * FROM withdrawals WHERE id=$1 FOR UPDATE",[withdrawalId]);
      const w=q.rows[0];if(!w)throw new Error('withdrawal_not_found');
      if(w.provider_withdrawal_id && result.providerWithdrawalId && String(w.provider_withdrawal_id)!==String(result.providerWithdrawalId))
        throw new Error('provider_withdrawal_identity_mismatch');
      await client.query(
        `UPDATE withdrawals
         SET provider_withdrawal_id=COALESCE(provider_withdrawal_id,$2),
             provider_fee_amount=$3,tx_hash=COALESCE($4,tx_hash),
             provider_submitted_at=COALESCE(provider_submitted_at,CASE WHEN $5 IN ('PROCESSING','COMPLETED') THEN NOW() ELSE NULL END),
             provider_completed_at=CASE WHEN $5='COMPLETED' THEN NOW() ELSE provider_completed_at END,
             status=CASE WHEN $5='COMPLETED' THEN 'completed' WHEN $5='FAILED' THEN 'failed' ELSE 'processing' END,
             updated_at=NOW()
         WHERE id=$1`,
        [withdrawalId,result.providerWithdrawalId,result.feeAmount,result.txHash,result.status]);
      const reservation=await client.query("SELECT * FROM withdrawal_reservations WHERE withdrawal_id=$1 AND status='active' FOR UPDATE",[withdrawalId]);
      if(result.status==='FAILED'){
        if(reservation.rows[0]){
          const rr=reservation.rows[0];
          const released=await client.query(
            `UPDATE wallets SET locked_balance=locked_balance-$1::numeric,available_balance=available_balance+$1::numeric
             WHERE id=$2 AND locked_balance >= $1::numeric RETURNING id`,[rr.amount,rr.wallet_id]);
          if(!released.rows[0])throw new Error('withdrawal_failed_release_invariant');
          await client.query("UPDATE withdrawal_reservations SET status='released',resolved_at=NOW() WHERE id=$1",[rr.id]);
        }
        await client.query("UPDATE withdrawals SET approval_status='REJECTED',rejection_reason=COALESCE(rejection_reason,'provider_rejected') WHERE id=$1",[withdrawalId]);
      }else if(result.status==='COMPLETED'){
        if(reservation.rows[0]){
          const rr=reservation.rows[0];
          const captured=await client.query(
            `UPDATE wallets SET locked_balance=locked_balance-$1::numeric
             WHERE id=$2 AND locked_balance >= $1::numeric RETURNING id`,[rr.amount,rr.wallet_id]);
          if(!captured.rows[0])throw new Error('withdrawal_capture_invariant_failed');
          await client.query("UPDATE withdrawal_reservations SET status='captured',resolved_at=NOW() WHERE id=$1",[rr.id]);
        }
        await client.query("UPDATE withdrawals SET completed_at=NOW() WHERE id=$1",[withdrawalId]);
      }
      await client.query(
        `INSERT INTO accounting_outbox(event_type,aggregate_type,aggregate_id,idempotency_key,payload)
         VALUES('exchange.withdrawal.settled','withdrawal',$1,$2,$3)
         ON CONFLICT(idempotency_key) DO NOTHING`,
        [withdrawalId,'ansarraf:withdrawal-settlement:'+withdrawalId,{
          withdrawalId,customerId:w.customer_id,assetId:w.asset_id,assetSymbol:w.symbol,
          amount:w.amount,providerCode:w.provider_code??null,providerWithdrawalId:result.providerWithdrawalId,
          providerFeeAmount:result.feeAmount,txHash:result.txHash,status:result.status,operationId:w.operation_id
        }]);
      await client.query('COMMIT');
    }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
  }
}
