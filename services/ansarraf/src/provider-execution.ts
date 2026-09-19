import type {Pool} from 'pg';
import {createHash} from 'node:crypto';
import {calculateInternalTradeFee} from './fee-engine.js';
import {checkProviderLiquidity} from './liquidity-guard.js';
import {createQuoteLock} from './quote-lock.js';
import {createProviderRegistry} from './providers/index.js';

const fp=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');

export async function provisionProviderExecution(pool:Pool,orderId:number){
  const registry=createProviderRegistry();
  if(!registry.executionEnabled)return {enabled:false,created:false};
  const code=(process.env.LIQUIDITY_PROVIDER_CODE??'WALLEX').toUpperCase();
  const adapter=registry.get(code);
  if(!adapter)return {enabled:true,created:false,reason:'provider_not_configured'};

  const maxSlippageBps=Number(process.env.PROVIDER_MAX_SLIPPAGE_BPS??100);
  const quoteTtlSeconds=Math.min(120,Math.max(1,Number(process.env.PROVIDER_QUOTE_TTL_SECONDS??10)));

  const orderResult=await pool.query(
    `SELECT o.*,c.id AS customer_id,ba.symbol AS base_symbol,qa.symbol AS quote_symbol
     FROM orders o
     JOIN customers c ON c.id=o.customer_id
     JOIN assets ba ON ba.id=o.base_asset_id
     JOIN assets qa ON qa.id=o.quote_asset_id
     WHERE o.id=$1`,
    [orderId]
  );
  const order=orderResult.rows[0];
  if(!order)return {enabled:true,created:false,reason:'order_not_found'};
  if(!['open','partially_filled'].includes(order.status))return {enabled:true,created:false,reason:'order_not_open'};

  const existing=await pool.query(
    `SELECT po.* FROM provider_orders po
     WHERE po.customer_order_id=$1
     ORDER BY po.id DESC LIMIT 1`,
    [orderId]
  );
  if(existing.rows[0])return {enabled:true,created:false,reason:'provider_order_already_exists',providerOrder:existing.rows[0]};

  const symbol=String(order.base_symbol)+'/'+String(order.quote_symbol);
  const liquidity=await checkProviderLiquidity(adapter,{
    symbol,
    side:order.side,
    quantity:String(order.quantity),
    maxSlippageBps
  });

  if(order.order_type==='limit'){
    const limit=String(order.price);
    const acceptable=order.side==='buy'
      ? Number(liquidity.executablePrice)<=Number(limit)
      : Number(liquidity.executablePrice)>=Number(limit);
    if(!acceptable)throw new Error('provider_price_outside_customer_limit');
  }

  const client=await pool.connect();
  try{
    await client.query('BEGIN');

    const lockedOrder=await client.query(
      'SELECT * FROM orders WHERE id=$1 FOR UPDATE',[orderId]
    );
    if(!lockedOrder.rows[0]||!['open','partially_filled'].includes(lockedOrder.rows[0].status))
      throw new Error('order_not_open');

    const provider=await client.query(
      `SELECT id FROM liquidity_providers WHERE code=$1 AND status='ACTIVE' FOR UPDATE`,
      [code]
    );
    if(!provider.rows[0])throw new Error('provider_not_active');

    const fee=await calculateInternalTradeFee(
      client,
      Number(order.base_asset_id),
      Number(order.quote_asset_id),
      order.side,
      String(order.quantity),
      String(order.price??liquidity.executablePrice)
    );

    const providerRule=await client.query(
      `SELECT taker_rate,fixed_fee,fee_asset_symbol
       FROM provider_fee_rules
       WHERE provider_code=$1
         AND (market_symbol IS NULL OR market_symbol=$2)
         AND (asset_symbol IS NULL OR asset_symbol=$3)
         AND effective_from<=NOW()
         AND (effective_to IS NULL OR effective_to>NOW())
       ORDER BY
         (CASE WHEN market_symbol IS NOT NULL THEN 1 ELSE 0 END)+
         (CASE WHEN asset_symbol IS NOT NULL THEN 1 ELSE 0 END) DESC,
         effective_from DESC,id DESC
       LIMIT 1`,
      [code,symbol,order.base_symbol]
    );
    const providerFeeRate=String(providerRule.rows[0]?.taker_rate??'0');
    const providerFixed=String(providerRule.rows[0]?.fixed_fee??'0');
    const gross=await client.query(
      'SELECT ($1::numeric*$2::numeric)::text AS amount',
      [String(order.quantity),String(order.price??liquidity.executablePrice)]
    );
    const providerFeeEstimate=await client.query(
      'SELECT (($1::numeric*$2::numeric)+$3::numeric)::text AS amount',
      [gross.rows[0].amount,providerFeeRate,providerFixed]
    );

    const operationId='ANSARRAF-PE-'+fp({
      orderId,
      provider:code,
      quantity:String(order.quantity),
      side:String(order.side)
    }).slice(0,32);
    const clientOrderId='AP-'+String(orderId)+'-'+operationId.slice(-16);

    const quoteLock=await createQuoteLock(client,{
      customerId:Number(order.customer_id),
      orderId,
      providerId:Number(provider.rows[0].id),
      symbol,
      side:order.side,
      quantity:String(order.quantity),
      executablePrice:liquidity.executablePrice,
      customerFee:fee.customerFeeAmount,
      providerFeeEstimate:providerFeeEstimate.rows[0].amount,
      ttlSeconds:quoteTtlSeconds
    });

    const po=await client.query(
      `INSERT INTO provider_orders
       (provider_id,customer_order_id,client_order_id,symbol,side,order_type,quantity,price,status,operation_id,idempotency_key)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,'REQUESTED',$9,$10)
       RETURNING *`,
      [
        provider.rows[0].id,
        orderId,
        clientOrderId,
        symbol,
        order.side,
        order.order_type,
        order.quantity,
        order.order_type==='limit'?order.price:liquidity.executablePrice,
        operationId,
        'provider-execution:'+code+':'+clientOrderId
      ]
    );

    await client.query(
      `INSERT INTO provider_execution_outbox
       (provider_order_id,event_type,idempotency_key,payload)
       VALUES($1,'provider.order.execute',$2,$3)`,
      [
        po.rows[0].id,
        'provider.order.execute:'+po.rows[0].id,
        {
          providerCode:code,
          providerOrderId:po.rows[0].id,
          orderId,
          quoteLockId:quoteLock.id,
          operationId,
          clientOrderId
        }
      ]
    );

    await client.query('COMMIT');
    return {enabled:true,created:true,providerOrder:po.rows[0],quoteLock};
  }catch(error){
    await client.query('ROLLBACK');
    throw error;
  }finally{client.release();}
}
