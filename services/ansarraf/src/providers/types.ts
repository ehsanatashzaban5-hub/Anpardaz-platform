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

export type ProviderWithdrawalRequest={
  asset:string;
  network:string;
  amount:string;
  destination:string;
  memo?:string|null;
  clientWithdrawalId:string;
};

export type ProviderDepositEvent={providerEventId:string;asset:string;network:string|null;amount:string;address:string|null;memo:string|null;txHash:string|null;confirmations:number;requiredConfirmations:number;status:string;raw:any};

export type ProviderDepositAddress={asset:string;network:string;address:string;memo:string|null;raw:any};

export type ProviderWithdrawalResult={
  providerWithdrawalId:string|null;
  status:'PROCESSING'|'COMPLETED'|'FAILED'|'UNKNOWN';
  amount:string;
  feeAmount:string;
  txHash:string|null;
  raw:any;
};

export interface LiquidityProviderAdapter{
  readonly code:string;
  getOrderBook(symbol:string):Promise<{bids:Array<[string,string]>;asks:Array<[string,string]>;raw:any}>;
  getBalances():Promise<ProviderBalance[]>;
  submitOrder(request:ProviderOrderRequest):Promise<ProviderOrderResult>;
  getOrder(clientOrderId:string,providerOrderId?:string|null):Promise<ProviderOrderResult>;
  cancelOrder(clientOrderId:string,providerOrderId?:string|null):Promise<ProviderOrderResult>;
  submitWithdrawal(request:ProviderWithdrawalRequest):Promise<ProviderWithdrawalResult>;
  getWithdrawal(providerWithdrawalId:string):Promise<ProviderWithdrawalResult>;
  getDepositAddress(asset:string,network:string):Promise<ProviderDepositAddress>;
  listDeposits(page?:number,perPage?:number):Promise<ProviderDepositEvent[]>;
}
