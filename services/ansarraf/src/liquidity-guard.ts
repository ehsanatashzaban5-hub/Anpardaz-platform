import type {LiquidityProviderAdapter} from './providers/types.js';

export type LiquidityCheck={executablePrice:string;availableQuantity:string;quoteRequired:string;slippageBps:string};

// Exact integer arithmetic at 18 decimal places; never use JS Number for money.
const SCALE=1000000000000000000n;
const parse=(v:string)=>{
  if(!/^\d+(?:\.\d{1,18})?$/.test(v))throw new Error('invalid_provider_decimal');
  const [whole,frac='']=v.split('.');
  return BigInt(whole)*SCALE+BigInt((frac+'0'.repeat(18)).slice(0,18));
};
const fmt=(v:bigint)=>{
  const a=v<0n?-v:v;
  const whole=a/SCALE;
  const frac=(a%SCALE).toString().padStart(18,'0').replace(/0+$/,'');
  return (v<0n?'-':'')+(frac?whole+'.'+frac:whole.toString());
};
const mulDiv=(a:bigint,b:bigint,c:bigint)=>a*b/c;

export async function checkProviderLiquidity(adapter:LiquidityProviderAdapter,args:{symbol:string;side:'buy'|'sell';quantity:string;maxSlippageBps:number}):Promise<LiquidityCheck>{
  if(!Number.isInteger(args.maxSlippageBps)||args.maxSlippageBps<0||args.maxSlippageBps>5000)throw new Error('invalid_max_slippage');
  const target=parse(args.quantity);
  if(target<=0n)throw new Error('invalid_liquidity_quantity');
  const book=await adapter.getOrderBook(args.symbol);
  const levels=args.side==='buy'?book.asks:book.bids;
  if(!levels.length)throw new Error('provider_orderbook_empty');
  let remaining=target,filled=0n,quoteCost=0n,firstPrice=0n;
  for(const [priceText,sizeText] of levels){
    const price=parse(priceText),size=parse(sizeText);
    if(price<=0n||size<=0n)continue;
    if(firstPrice===0n)firstPrice=price;
    const take=remaining<size?remaining:size;
    filled+=take; quoteCost+=mulDiv(take,price,SCALE); remaining-=take;
    if(remaining===0n)break;
  }
  if(remaining>0n)throw new Error('provider_liquidity_insufficient');
  const executablePrice=quoteCost*SCALE/filled;
  const delta=executablePrice>firstPrice?executablePrice-firstPrice:firstPrice-executablePrice;
  const slippageBps=delta*10000n/firstPrice;
  if(slippageBps>BigInt(args.maxSlippageBps))throw new Error('provider_slippage_limit_exceeded');
  return {executablePrice:fmt(executablePrice),availableQuantity:fmt(filled),quoteRequired:fmt(quoteCost),slippageBps:fmt(slippageBps)};
}
