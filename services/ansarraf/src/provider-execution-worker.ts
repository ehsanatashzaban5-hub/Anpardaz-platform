import type {FastifyBaseLogger} from 'fastify';
import type {Pool} from 'pg';
import {createProviderRegistry} from './providers/index.js';
import type {LiquidityProviderAdapter,ProviderOrderResult} from './providers/types.js';
import {settleProviderExecution} from './provider-trade-settlement.js';

export class ProviderExecutionWorker {
  private stopped=false;
  private running=false;
  private timer?:ReturnType<typeof setTimeout>;
  constructor(
    private readonly pool:Pool,
    private readonly log:FastifyBaseLogger,
    private readonly registry=createProviderRegistry()
  ) {}

  start(){if(this.running)return;this.running=true;void this.loop();}
  stop(){this.stopped=true;if(this.timer)clearTimeout(this.timer);}

  private async loop(){
    if(this.stopped)return;
    try{
      const processed=await this.processOne();
      this.timer=setTimeout(()=>void this.loop(),processed?50:1000);
    }catch(error){
      this.log.error({error},'provider execution worker failure');
      this.timer=setTimeout(()=>void this.loop(),2000);
    }
  }

  private async processOne():Promise<boolean>{
    const client=await this.pool.connect();
    let row:any;
    try{
      await client.query('BEGIN');
      const q=await client.query(`
        WITH candidate AS (
          SELECT id
          FROM provider_execution_outbox
          WHERE
            (status='pending' AND available_at<=NOW())
            OR (status='failed' AND available_at<=NOW())
            OR (status='processing' AND processing_started_at<NOW()-INTERVAL '5 minutes')
          ORDER BY available_at,id
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        )
        UPDATE provider_execution_outbox o
        SET status='processing',processing_started_at=NOW(),attempts=attempts+1
        FROM candidate c
        WHERE o.id=c.id
        RETURNING o.*
      `);
      if(!q.rows[0]){
        await client.query('COMMIT');
        return false;
      }
      row=q.rows[0];
      await client.query('COMMIT');
    }catch(error){
      await client.query('ROLLBACK');
      throw error;
    }finally{client.release();}

    try{
      await this.execute(row);
      await this.pool.query(
        `UPDATE provider_execution_outbox
         SET status='posted',processed_at=NOW(),processing_started_at=NULL,last_error=NULL
         WHERE id=$1 AND status='processing'`,
        [row.id]
      );
    }catch(error){
      const message=error instanceof Error?error.message:'provider_execution_failed';
      const seconds=Math.min(300,Math.max(2,2**Math.min(Number(row.attempts),8)));
      await this.pool.query(
        `UPDATE provider_execution_outbox
         SET status='failed',available_at=NOW()+($2::text)::interval,
             processing_started_at=NULL,last_error=$3
         WHERE id=$1 AND status='processing'`,
        [row.id,seconds+' seconds',message.slice(0,2000)]
      );
      this.log.error({outboxId:row.id,attempts:row.attempts,error},'provider execution event failed');
    }
    return true;
  }

  private async execute(row:any){
    const q=await this.pool.query(
      `SELECT po.*,lp.code AS provider_code,lp.status AS provider_status
       FROM provider_orders po
       JOIN liquidity_providers lp ON lp.id=po.provider_id
       WHERE po.id=$1
       FOR UPDATE`,
      [row.provider_order_id]
    );
    if(!q.rows[0])throw new Error('provider_order_not_found');
    const order=q.rows[0];
    if(order.status==='FILLED'||order.status==='CANCELLED'||order.status==='REJECTED')return;

    const adapter=this.registry.get(String(order.provider_code));
    if(!adapter||!this.registry.executionEnabled)throw new Error('provider_execution_not_enabled');
    if(order.provider_status!=='ACTIVE')throw new Error('provider_not_active');

    // An UNKNOWN/timeout state is reconciled by clientOrderId/providerOrderId before any
    // new submission. This prevents duplicate real orders after ambiguous network failures.
    let result:ProviderOrderResult;
    if(order.status==='REQUESTED'){
      try{
        result=await adapter.getOrder(String(order.client_order_id),order.provider_order_id);
        if(result.status==='UNKNOWN')throw new Error('provider_order_not_found_for_reconciliation');
      }catch(error){
        const message=error instanceof Error?error.message:'provider_lookup_failed';
        if(!message.includes('404')&&!message.includes('not_found')&&!message.includes('NOT_FOUND'))throw error;
        result=await adapter.submitOrder({
          clientOrderId:String(order.client_order_id),
          symbol:String(order.symbol),
          side:String(order.side) as 'buy'|'sell',
          orderType:String(order.order_type) as 'market'|'limit',
          quantity:String(order.quantity),
          ...(order.price!==null?{price:String(order.price)}:{})
        });
      }
    }else{
      result=await adapter.getOrder(String(order.client_order_id),order.provider_order_id);
    }

    await this.persistResult(order.id,result);
    if(result.executedQuantity!=='0'&&result.executedQuoteAmount!=='0')
      await settleProviderExecution(this.pool,Number(order.id),result);
  }

  private async persistResult(providerOrderId:number,result:ProviderOrderResult){
    const status=result.status;
    const terminal=status==='FILLED'||status==='CANCELLED'||status==='REJECTED';
    await this.pool.query(
      `UPDATE provider_orders
       SET provider_order_id=COALESCE($2,provider_order_id),
           status=$3,
           executed_quantity=$4,
           executed_quote_amount=$5,
           provider_fee_amount=$6,
           raw_response=$7,
           submitted_at=CASE WHEN $3<>'REQUESTED' THEN COALESCE(submitted_at,NOW()) ELSE submitted_at END,
           executed_at=CASE WHEN $3='FILLED' THEN NOW() ELSE executed_at END,
           last_checked_at=NOW(),
           updated_at=NOW()
       WHERE id=$1`,
      [
        providerOrderId,
        result.providerOrderId,
        status,
        result.executedQuantity,
        result.executedQuoteAmount,
        result.providerFeeAmount,
        JSON.stringify(result.raw??{})
      ]
    );
    if(!terminal && status==='UNKNOWN')throw new Error('provider_order_status_unknown');
  }
}
