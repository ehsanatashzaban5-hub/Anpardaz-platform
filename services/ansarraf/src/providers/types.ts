export type ProviderOrderStatus='REQUESTED'|'SUBMITTED'|'PARTIALLY_FILLED'|'FILLED'|'CANCEL_PENDING'|'CANCELLED'|'REJECTED'|'UNKNOWN';

export type ProviderOrderRequest={
  clientOrderId:string;
  symbol:string;
  side:'buy'|'sell';
  orderType:'market'|'limit';
  quantity:string;
  price?:string;
};

export type ProviderOrderResult={
  providerOrderId:string|null;
  clientOrderId:string;
  status:ProviderOrderStatus;
  executedQuantity:string;
  executedQuoteAmount:string;
  providerFeeAmount:string;
  providerFeeAssetSymbol:string|null;
  raw:any;
};

export type ProviderBalance={asset:string;available:string;locked:string;raw:any};

export interface LiquidityProviderAdapter{
  readonly code:string;
  getOrderBook(symbol:string):Promise<{bids:Array<[string,string]>;asks:Array<[string,string]>;raw:any}>;
  getBalances():Promise<ProviderBalance[]>;
  submitOrder(request:ProviderOrderRequest):Promise<ProviderOrderResult>;
  getOrder(clientOrderId:string,providerOrderId?:string|null):Promise<ProviderOrderResult>;
  cancelOrder(clientOrderId:string,providerOrderId?:string|null):Promise<ProviderOrderResult>;
}
