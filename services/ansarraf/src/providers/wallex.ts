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

  constructor(private readonly cfg:WallexConfig){
    if(!cfg.baseUrl||!cfg.apiKey)throw new Error('wallex_provider_not_configured');
  }

  private async request(path:string,init:RequestInit={}){
    const response=await fetch(this.cfg.baseUrl.replace(/\/$/,'')+path,{
      ...init,
      headers:{
        accept:'application/json',
        'content-type':'application/json',
        'x-api-key':this.cfg.apiKey,
        ...(init.headers??{})
      },
      signal:AbortSignal.timeout(this.cfg.timeoutMs)
    });
    let body:any={};
    try{body=await response.json();}catch{}
    if(!response.ok)throw new Error('wallex_http_'+response.status+':'+JSON.stringify(body).slice(0,1000));
    return body;
  }

  async getOrderBook(symbol:string){
    const body=await this.request('/v1/depth?symbol='+encodeURIComponent(symbol));
    const data=body?.result??body?.data??body;
    const normalize=(rows:any[])=>rows.map((x:any)=>{
      if(Array.isArray(x))return [text(x[0]),text(x[1])] as [string,string];
      return [text(x?.price),text(x?.quantity)] as [string,string];
    }).filter((x:[string,string])=>x[0]!=='0'&&x[1]!=='0');
    return {bids:normalize(data?.bid??data?.bids??[]),asks:normalize(data?.ask??data?.asks??[]),raw:body};
  }

  async getBalances():Promise<ProviderBalance[]>{
    const body=await this.request('/v1/account/assets');
    const data=body?.result??body?.data??body;
    const rows=Array.isArray(data)?data:(data?.assets??[]);
    return rows.map((x:any)=>({
      asset:String(x.asset??x.symbol??''),
      available:text(x.available??x.free),
      locked:text(x.locked??x.lockedAmount),
      raw:x
    }));
  }

  async submitOrder(request:ProviderOrderRequest):Promise<ProviderOrderResult>{
    const body=await this.request('/v1/account/orders',{
      method:'POST',
      body:JSON.stringify({
        symbol:request.symbol,
        type:request.orderType.toUpperCase(),
        side:request.side.toUpperCase(),
        quantity:request.quantity,
        ...(request.price?{price:request.price}:{}),
        client_id:request.clientOrderId
      })
    });
    return this.mapOrder(body,request.clientOrderId);
  }

  async getOrder(clientOrderId:string,_providerOrderId?:string|null):Promise<ProviderOrderResult>{
    const body=await this.request('/v1/account/orders/'+encodeURIComponent(clientOrderId));
    return this.mapOrder(body,clientOrderId);
  }

  async cancelOrder(clientOrderId:string,_providerOrderId?:string|null):Promise<ProviderOrderResult>{
    const body=await this.request('/v1/account/orders?clientOrderId='+encodeURIComponent(clientOrderId),{method:'DELETE'});
    return this.mapOrder(body,clientOrderId);
  }

  private mapOrder(body:any,clientOrderId:string):ProviderOrderResult{
    const x=body?.result??body?.data??body;
    const fills=Array.isArray(x?.fills)?x.fills:[];
    const fee= x?.fee!==undefined ? x.fee : fills.reduce((sum:any,fill:any)=>sum+Number(fill?.fee??0),0);
    const feeAsset=x?.feeAsset??fills.find((fill:any)=>fill?.feeAsset)?.feeAsset??null;
    return {
      providerOrderId:x?.clientOrderId?String(x.clientOrderId):x?.orderId!==undefined?String(x.orderId):null,
      clientOrderId:String(x?.clientOrderId??clientOrderId),
      status:status(x?.status),
      executedQuantity:text(x?.executedQty),
      executedQuoteAmount:text(x?.executedSum),
      providerFeeAmount:text(fee),
      providerFeeAssetSymbol:feeAsset?String(feeAsset):null,
      raw:body
    };
  }
}
