import type {LiquidityProviderAdapter,ProviderBalance,ProviderOrderRequest,ProviderOrderResult,ProviderOrderStatus} from './types.js';

type WallexConfig={baseUrl:string;apiKey:string;timeoutMs:number};
const text=(v:any)=>v===undefined||v===null?'0':String(v);
const status=(value:any):ProviderOrderStatus=>{
  const s=String(value??'').toUpperCase();
  if(['FILLED','DONE','COMPLETED'].includes(s))return 'FILLED';
  if(['PARTIALLY_FILLED','PARTIAL'].includes(s))return 'PARTIALLY_FILLED';
  if(['CANCELED','CANCELLED'].includes(s))return 'CANCELLED';
  if(['REJECTED','FAILED'].includes(s))return 'REJECTED';
  if(['NEW','OPEN','ACTIVE'].includes(s))return 'SUBMITTED';
  return 'UNKNOWN';
};

export class WallexAdapter implements LiquidityProviderAdapter{
  readonly code='WALLEX';
  constructor(private readonly cfg:WallexConfig){if(!cfg.baseUrl||!cfg.apiKey)throw new Error('wallex_provider_not_configured');}
  private async request(path:string,init:RequestInit={}){
    const response=await fetch(this.cfg.baseUrl.replace(/\/$/,'')+path,{...init,headers:{accept:'application/json','content-type':'application/json',authorization:'Bearer '+this.cfg.apiKey,...(init.headers??{})},signal:AbortSignal.timeout(this.cfg.timeoutMs)});
    let body:any={};try{body=await response.json();}catch{}
    if(!response.ok)throw new Error('wallex_http_'+response.status+':'+JSON.stringify(body).slice(0,500));
    return body;
  }
  async getOrderBook(symbol:string){
    const body=await this.request('/v1/depth?symbol='+encodeURIComponent(symbol));
    const data=body?.result??body?.data??body;
    return {bids:(data?.bids??[]).map((x:any)=>[text(x[0]),text(x[1])]),asks:(data?.asks??[]).map((x:any)=>[text(x[0]),text(x[1])]),raw:body};
  }
  async getBalances():Promise<ProviderBalance[]>{
    const body=await this.request('/v1/account/assets'); const data=body?.result??body?.data??body; const rows=Array.isArray(data)?data:(data?.assets??[]);
    return rows.map((x:any)=>({asset:String(x.asset??x.symbol??''),available:text(x.available??x.free),locked:text(x.locked??x.lockedAmount),raw:x}));
  }
  async submitOrder(request:ProviderOrderRequest):Promise<ProviderOrderResult>{
    const body=await this.request('/v1/account/orders',{method:'POST',body:JSON.stringify({symbol:request.symbol,side:request.side,type:request.orderType,quantity:request.quantity,...(request.price?{price:request.price}:{}),client_id:request.clientOrderId})});
    return this.mapOrder(body,request.clientOrderId);
  }
  async getOrder(clientOrderId:string,providerOrderId?:string|null):Promise<ProviderOrderResult>{
    const query=providerOrderId?'?id='+encodeURIComponent(providerOrderId):'?client_id='+encodeURIComponent(clientOrderId);
    const body=await this.request('/v1/account/order'+query); return this.mapOrder(body,clientOrderId);
  }
  async cancelOrder(clientOrderId:string,providerOrderId?:string|null):Promise<ProviderOrderResult>{
    const body=await this.request('/v1/account/orders',{method:'DELETE',body:JSON.stringify({...providerOrderId?{id:providerOrderId}:{client_id:clientOrderId}})});
    return this.mapOrder(body,clientOrderId);
  }
  private mapOrder(body:any,clientOrderId:string):ProviderOrderResult{
    const x=body?.result??body?.data??body;
    return {providerOrderId:x?.id!==undefined?String(x.id):x?.order_id!==undefined?String(x.order_id):null,clientOrderId,status:status(x?.status),executedQuantity:text(x?.executedQty??x?.executed_quantity??x?.filledQuantity),executedQuoteAmount:text(x?.executedQuoteAmount??x?.executed_quote_amount),providerFeeAmount:text(x?.fee??x?.feeAmount??x?.fee_amount),providerFeeAssetSymbol:x?.feeAsset??x?.fee_asset??null,raw:body};
  }
}
