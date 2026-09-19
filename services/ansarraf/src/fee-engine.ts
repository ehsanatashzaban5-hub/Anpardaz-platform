import type {Pool,PoolClient} from 'pg';

export type TradeFee = {
  customerFeeAmount:string;
  feeAssetId:number|null;
  providerFeeAmount:string;
  providerFeeAssetId:number|null;
  companyRevenueAmount:string;
};

export async function calculateInternalTradeFee(client:Pool|PoolClient,baseAssetId:number,quoteAssetId:number,side:'buy'|'sell',quantity:string,price:string):Promise<TradeFee>{
  const assets=await client.query('SELECT id,symbol FROM assets WHERE id=ANY($1::bigint[]) AND status=\'active\' ORDER BY id',[[baseAssetId,quoteAssetId]]);
  if(assets.rows.length!==2)throw new Error('fee_asset_not_active');
  const base=assets.rows.find((x:any)=>Number(x.id)===baseAssetId);
  const quote=assets.rows.find((x:any)=>Number(x.id)===quoteAssetId);
  if(!base||!quote)throw new Error('fee_asset_not_found');
  const gross=await client.query('SELECT ($1::numeric*$2::numeric)::text AS amount',[quantity,price]);
  const feeRule=await client.query('SELECT percentage,fixed_amount,min_amount,max_amount,fee_asset_symbol FROM customer_fee_rules WHERE service=\'ansarraf\' AND operation_type=\'trade\' AND (market_symbol IS NULL OR market_symbol=$1) AND (asset_symbol IS NULL OR asset_symbol=$2) AND effective_from<=NOW() AND (effective_to IS NULL OR effective_to>NOW()) ORDER BY (CASE WHEN market_symbol IS NOT NULL THEN 1 ELSE 0 END)+(CASE WHEN asset_symbol IS NOT NULL THEN 1 ELSE 0 END) DESC,effective_from DESC,id DESC LIMIT 1',[base.symbol+'/'+quote.symbol,base.symbol]);
  if(!feeRule.rows[0])return {customerFeeAmount:'0',feeAssetId:null,providerFeeAmount:'0',providerFeeAssetId:null,companyRevenueAmount:'0'};
  const r=feeRule.rows[0];
  const feeAssetSymbol=r.fee_asset_symbol??base.symbol;
  if(feeAssetSymbol!==base.symbol)throw new Error('unsupported_customer_fee_asset');
  const fee=await client.query('SELECT LEAST(GREATEST(($1::numeric*$2::numeric)+$3::numeric,COALESCE($4::numeric,0)),COALESCE($5::numeric,($1::numeric*$2::numeric)+$3::numeric))::text AS amount',[gross.rows[0].amount,r.percentage,r.fixed_amount,r.min_amount,r.max_amount]);
  const feeAmount=fee.rows[0].amount;
  const valid=await client.query('SELECT ($1::numeric>=0 AND $1::numeric<=$2::numeric) AS valid',[feeAmount,quantity]);
  if(!valid.rows[0].valid)throw new Error('customer_fee_exceeds_trade_quantity');
  return {customerFeeAmount:feeAmount,feeAssetId:baseAssetId,providerFeeAmount:'0',providerFeeAssetId:null,companyRevenueAmount:feeAmount};
}