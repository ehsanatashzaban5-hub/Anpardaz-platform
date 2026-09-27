import type {Pool,PoolClient} from 'pg';

export type OperationalFee = {
  amount:string;
  feeAssetId:number|null;
  feeAssetSymbol:string|null;
  netAmount:string;
  percentage:string;
  fixedAmount:string;
  ruleId:number|null;
};

export type TradeFee = {
  customerFeeAmount:string;
  feeAssetId:number|null;
  providerFeeAmount:string;
  providerFeeAssetId:number|null;
  companyRevenueAmount:string;
};

async function calculateRule(
  client:Pool|PoolClient,
  operationType:'trade'|'deposit'|'withdrawal'|'transfer',
  assetSymbol:string,
  marketSymbol:string|null,
  grossAmount:string,
  defaultFeeAssetSymbol:string,
):Promise<{fee:string;rule:any|null}>{
  const q=await client.query(
    `SELECT id,percentage,fixed_amount,min_amount,max_amount,fee_asset_symbol
     FROM customer_fee_rules
     WHERE service='ansarraf' AND operation_type=$1
       AND (market_symbol IS NULL OR market_symbol=$2)
       AND (asset_symbol IS NULL OR asset_symbol=$3)
       AND effective_from<=NOW() AND (effective_to IS NULL OR effective_to>NOW())
     ORDER BY
       (CASE WHEN market_symbol IS NOT NULL THEN 2 ELSE 0 END)+
       (CASE WHEN asset_symbol IS NOT NULL THEN 1 ELSE 0 END) DESC,
       effective_from DESC,id DESC
     LIMIT 1`,
    [operationType,marketSymbol,assetSymbol],
  );
  if(!q.rows[0])return {fee:'0',rule:null};
  const rule=q.rows[0];
  const feeAssetSymbol=String(rule.fee_asset_symbol??defaultFeeAssetSymbol);
  if(feeAssetSymbol!==defaultFeeAssetSymbol)throw new Error('unsupported_customer_fee_asset');
  const fee=await client.query(
    `SELECT LEAST(
       GREATEST(($1::numeric*$2::numeric)+$3::numeric,COALESCE($4::numeric,0)),
       COALESCE($5::numeric,($1::numeric*$2::numeric)+$3::numeric)
     )::text AS amount`,
    [grossAmount,rule.percentage,rule.fixed_amount,rule.min_amount,rule.max_amount],
  );
  return {fee:fee.rows[0].amount,rule};
}

export async function calculateOperationalFee(
  client:Pool|PoolClient,
  operationType:'deposit'|'withdrawal'|'transfer',
  assetId:number,
  grossAmount:string,
  marketSymbol:string|null=null,
):Promise<OperationalFee>{
  const asset=(await client.query(
    "SELECT id,symbol FROM assets WHERE id=$1 AND status='active' LIMIT 1",[assetId]
  )).rows[0];
  if(!asset)throw new Error('fee_asset_not_active');
  const result=await calculateRule(client,operationType,String(asset.symbol),marketSymbol,grossAmount,String(asset.symbol));
  const net=await client.query('SELECT ($1::numeric-$2::numeric)::text AS amount',[grossAmount,result.fee]);
  const valid=await client.query('SELECT ($1::numeric>=0) AS valid',[net.rows[0].amount]);
  if(!valid.rows[0].valid)throw new Error('fee_exceeds_amount');
  return {
    amount:result.fee,
    feeAssetId:result.fee==='0'?null:Number(asset.id),
    feeAssetSymbol:result.fee==='0'?null:String(asset.symbol),
    netAmount:net.rows[0].amount,
    percentage:String(result.rule?.percentage??'0'),
    fixedAmount:String(result.rule?.fixed_amount??'0'),
    ruleId:result.rule?Number(result.rule.id):null,
  };
}

export async function calculateInternalTradeFee(client:Pool|PoolClient,baseAssetId:number,quoteAssetId:number,side:'buy'|'sell',quantity:string,price:string):Promise<TradeFee>{
  const assets=await client.query("SELECT id,symbol FROM assets WHERE id=ANY($1::bigint[]) AND status='active' ORDER BY id",[[baseAssetId,quoteAssetId]]);
  if(assets.rows.length!==2)throw new Error('fee_asset_not_active');
  const base=assets.rows.find((x:any)=>Number(x.id)===baseAssetId);
  const quote=assets.rows.find((x:any)=>Number(x.id)===quoteAssetId);
  if(!base||!quote)throw new Error('fee_asset_not_found');
  const gross=await client.query('SELECT ($1::numeric*$2::numeric)::text AS amount',[quantity,price]);
  const result=await calculateRule(client,'trade',String(base.symbol),String(base.symbol)+'/'+String(quote.symbol),gross.rows[0].amount,String(base.symbol));
  if(!result.rule)return {customerFeeAmount:'0',feeAssetId:null,providerFeeAmount:'0',providerFeeAssetId:null,companyRevenueAmount:'0'};
  const feeAssetSymbol=String(result.rule.fee_asset_symbol??base.symbol);
  if(feeAssetSymbol!==String(base.symbol))throw new Error('unsupported_customer_fee_asset');
  const feeInBase=await client.query(
    `SELECT LEAST(
       GREATEST(($1::numeric*$2::numeric)+$3::numeric,COALESCE($4::numeric,0)),
       COALESCE($5::numeric,($1::numeric*$2::numeric)+$3::numeric)
     )::text AS amount`,
    [quantity,result.rule.percentage,result.rule.fixed_amount,result.rule.min_amount,result.rule.max_amount],
  );
  const feeAmount=feeInBase.rows[0].amount;
  const valid=await client.query('SELECT ($1::numeric>=0 AND $1::numeric<=$2::numeric) AS valid',[feeAmount,quantity]);
  if(!valid.rows[0].valid)throw new Error('customer_fee_exceeds_trade_quantity');
  return {customerFeeAmount:feeAmount,feeAssetId:baseAssetId,providerFeeAmount:'0',providerFeeAssetId:null,companyRevenueAmount:feeAmount};
}
