import type {LiquidityProviderAdapter} from './providers/types.js';

export type LiquidityCheck={
  executablePrice:string;
  availableQuantity:string;
  quoteRequired:string;
  slippageBps:string;
};

const num=(v:string)=>Number(v);
const fixed=(v:number)=>v.toFixed(18).replace(/0+$/,'').replace(/\.$/,'');

export async function checkProviderLiquidity(adapter:LiquidityProviderAdapter,args:{
  symbol:string;side:'buy'|'sell';quantity:string;maxSlippageBps:number;
}):Promise<LiquidityCheck>{
  if(args.maxSlippageBps<0||args.maxSlippageBps>5000)throw new Error('invalid_max_slippage');
  const book=await adapter.getOrderBook(args.symbol);
  const levels=args.side==='buy'?book.asks:book.bids;
  let remaining=num(args.quantity),cost=0,filled=0;
  if(!levels.length)throw new Error('provider_orderbook_empty');
  const first=num(levels[0][0]);
  for(const [priceText,sizeText] of levels){
    const price=num(priceText),size=num(sizeText);
    if(!(price>0&&size>0))continue;
    const take=Math.min(remaining,size);
    filled+=take;cost+=take*price;remaining-=take;
    if(remaining<=1e-12)break;
  }
  if(remaining>1e-12)throw new Error('provider_liquidity_insufficient');
  const executable=cost/filled;
  const slippageBps=Math.abs(executable-first)/first*10000;
  if(slippageBps>args.maxSlippageBps)throw new Error('provider_slippage_limit_exceeded');
  return {executablePrice:fixed(executable),availableQuantity:fixed(filled),quoteRequired:fixed(cost),slippageBps:fixed(slippageBps)};
}
