import type {FastifyBaseLogger} from 'fastify';
import type {Pool} from 'pg';

export class AccountingOutboxWorker{
  private stopped=false;
  private running=false;
  private timer?:ReturnType<typeof setTimeout>;
  constructor(private readonly pool:Pool,private readonly log:FastifyBaseLogger){}
  start(){if(this.running)return;this.running=true;void this.loop();}
  stop(){this.stopped=true;if(this.timer)clearTimeout(this.timer);}
  private async loop(){
    while(!this.stopped){
      try{const processed=await this.processOne();this.timer=setTimeout(()=>void this.loop(),processed?50:1000);return;}
      catch(error){this.log.error({error},'accounting outbox worker failure');this.timer=setTimeout(()=>void this.loop(),2000);return;}
    }
  }
  private async processOne():Promise<boolean>{
    const client=await this.pool.connect();let row:any;
    try{
      await client.query('BEGIN');
      const q=await client.query(`WITH candidate AS (SELECT id FROM accounting_outbox WHERE (status='pending' AND available_at<=NOW()) OR (status='failed' AND available_at<=NOW()) OR (status='processing' AND processing_started_at<NOW()-INTERVAL '5 minutes') ORDER BY available_at,id FOR UPDATE SKIP LOCKED LIMIT 1) UPDATE accounting_outbox o SET status='processing',processing_started_at=NOW(),attempts=attempts+1 FROM candidate c WHERE o.id=c.id RETURNING o.*`);
      if(!q.rows[0]){await client.query('COMMIT');return false;} row=q.rows[0];await client.query('COMMIT');
    }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
    try{await this.postTrade(row);await this.pool.query(`UPDATE accounting_outbox SET status='posted',processed_at=NOW(),processing_started_at=NULL,last_error=NULL WHERE id=$1 AND status='processing'`,[row.id]);}
    catch(error){const message=error instanceof Error?error.message:'accounting_post_failed';const seconds=Math.min(300,Math.max(1,2**Math.min(Number(row.attempts),8)));await this.pool.query(`UPDATE accounting_outbox SET status='failed',available_at=NOW()+($2::text)::interval,processing_started_at=NULL,last_error=$3 WHERE id=$1 AND status='processing'`,[row.id,seconds+' seconds',message.slice(0,2000)]);this.log.error({outboxId:row.id,attempts:row.attempts,error},'accounting outbox event failed');}
    return true;
  }
  private async postTrade(row:any){
    const p=row.payload??{};
    if(row.event_type==='exchange.provider_trade.settled')return this.postProviderTrade(row,p);
    if(row.event_type==='exchange.withdrawal.settled')return this.postWithdrawal(row,p);
    if(row.event_type!=='exchange.trade.settled')throw new Error('unsupported_accounting_event');const required=['tradeId','buyerCustomerId','sellerCustomerId','baseAssetId','quoteAssetId','quantity','quoteAmount'];
    for(const key of required)if(p[key]===undefined||p[key]===null)throw new Error('missing_outbox_field:'+key);
    const base=await this.asset(Number(p.baseAssetId));const quote=await this.asset(Number(p.quoteAssetId));
    if(base.symbol===quote.symbol)throw new Error('accounting_asset_currency_collision');
    const buyerBase=await this.ensureAccount(Number(p.buyerCustomerId),base.symbol);const sellerBase=await this.ensureAccount(Number(p.sellerCustomerId),base.symbol);const revenueBase=await this.ensureRevenueAccount(base.symbol);
    const buyerQuote=await this.ensureAccount(Number(p.buyerCustomerId),quote.symbol);const sellerQuote=await this.ensureAccount(Number(p.sellerCustomerId),quote.symbol);
    const customerFee=String(p.customerFeeAmount??p.feeAmount??'0');
    const netBase=await this.pool.query('SELECT ($1::numeric-$2::numeric)::text AS amount',[String(p.quantity),customerFee]);
    const sellerDebit=await this.pool.query('SELECT ($1::numeric+$2::numeric)::text AS amount',[String(p.quantity),customerFee]);
    const baseEntries:any[]=String(p.side)==='sell'
      ? [
        {accountId:buyerBase,currency:base.symbol,direction:'credit',amount:String(p.quantity),metadata:{tradeId:p.tradeId,asset:'base'}},
        {accountId:sellerBase,currency:base.symbol,direction:'debit',amount:sellerDebit.rows[0].amount,metadata:{tradeId:p.tradeId,asset:'base'}}
      ]
      : [
        {accountId:buyerBase,currency:base.symbol,direction:'credit',amount:netBase.rows[0].amount,metadata:{tradeId:p.tradeId,asset:'base'}},
        {accountId:sellerBase,currency:base.symbol,direction:'debit',amount:String(p.quantity),metadata:{tradeId:p.tradeId,asset:'base'}}
      ];
    if(customerFee!=='0')baseEntries.push({accountId:revenueBase,currency:base.symbol,direction:'credit',amount:customerFee,metadata:{tradeId:p.tradeId,asset:'base',type:'customer_fee'}});
    await this.postLedger({referenceType:'exchange_trade_base',referenceId:String(p.tradeId),idempotencyKey:row.idempotency_key+':base',description:'Exchange trade '+p.tradeId+' base settlement',entries:baseEntries});
    await this.postLedger({referenceType:'exchange_trade_quote',referenceId:String(p.tradeId),idempotencyKey:row.idempotency_key+':quote',description:'Exchange trade '+p.tradeId+' quote settlement',entries:[{accountId:sellerQuote,currency:quote.symbol,direction:'credit',amount:String(p.quoteAmount),metadata:{tradeId:p.tradeId,asset:'quote'}},{accountId:buyerQuote,currency:quote.symbol,direction:'debit',amount:String(p.quoteAmount),metadata:{tradeId:p.tradeId,asset:'quote'}}]});
  }
  private async postProviderTrade(row:any,p:any){
    const required=['settlementId','providerOrderId','customerId','providerCode','side','baseAssetId','quoteAssetId','quantity','quoteAmount','customerFeeAmount','providerFeeAmount'];
    for(const key of required)if(p[key]===undefined||p[key]===null)throw new Error('missing_provider_outbox_field:'+key);
    const base=await this.asset(Number(p.baseAssetId));
    const quote=await this.asset(Number(p.quoteAssetId));
    const customerBase=await this.ensureAccount(Number(p.customerId),base.symbol);
    const customerQuote=await this.ensureAccount(Number(p.customerId),quote.symbol);
    const providerBase=await this.ensureProviderAssetAccount(String(p.providerCode),base.symbol);
    const providerQuote=await this.ensureProviderAssetAccount(String(p.providerCode),quote.symbol);
    const revenueBase=await this.ensureRevenueAccount(base.symbol);
    const expenseBase=await this.ensureProviderExpenseAccount(String(p.providerCode),base.symbol);
    const customerFee=String(p.customerFeeAmount);
    const providerFee=String(p.providerFeeAmount);
    const quantity=String(p.quantity);
    const quoteAmount=String(p.quoteAmount);
    const netBase=(await this.pool.query('SELECT ($1::numeric-$2::numeric)::text AS amount',[quantity,customerFee])).rows[0].amount;
    const baseEntries:any[]=[];
    if(String(p.side)==='buy'){
      baseEntries.push(
        {accountId:providerBase,currency:base.symbol,direction:'debit',amount:quantity,metadata:{settlementId:p.settlementId,providerOrderId:p.providerOrderId,type:'provider_asset_received'}},
        {accountId:expenseBase,currency:base.symbol,direction:'debit',amount:providerFee,metadata:{settlementId:p.settlementId,providerOrderId:p.providerOrderId,type:'provider_fee'}},
        {accountId:customerBase,currency:base.symbol,direction:'credit',amount:netBase,metadata:{settlementId:p.settlementId,providerOrderId:p.providerOrderId,type:'customer_asset'}},
        {accountId:revenueBase,currency:base.symbol,direction:'credit',amount:customerFee,metadata:{settlementId:p.settlementId,providerOrderId:p.providerOrderId,type:'customer_fee'}},
        {accountId:providerBase,currency:base.symbol,direction:'credit',amount:providerFee,metadata:{settlementId:p.settlementId,providerOrderId:p.providerOrderId,type:'provider_fee_paid'}}
      );
    }else{
      const customerDebit=(await this.pool.query('SELECT ($1::numeric+$2::numeric)::text AS amount',[quantity,customerFee])).rows[0].amount;
      baseEntries.push(
        {accountId:customerBase,currency:base.symbol,direction:'debit',amount:customerDebit,metadata:{settlementId:p.settlementId,providerOrderId:p.providerOrderId,type:'customer_asset_sold'}},
        {accountId:expenseBase,currency:base.symbol,direction:'debit',amount:providerFee,metadata:{settlementId:p.settlementId,providerOrderId:p.providerOrderId,type:'provider_fee'}},
        {accountId:providerBase,currency:base.symbol,direction:'credit',amount:quantity,metadata:{settlementId:p.settlementId,providerOrderId:p.providerOrderId,type:'provider_asset_sold'}},
        {accountId:revenueBase,currency:base.symbol,direction:'credit',amount:customerFee,metadata:{settlementId:p.settlementId,providerOrderId:p.providerOrderId,type:'customer_fee'}},
        {accountId:providerBase,currency:base.symbol,direction:'credit',amount:providerFee,metadata:{settlementId:p.settlementId,providerOrderId:p.providerOrderId,type:'provider_fee_paid'}}
      );
    }
    await this.postLedger({referenceType:'exchange_provider_trade_base',referenceId:String(p.settlementId),idempotencyKey:row.idempotency_key+':base',description:'Provider trade '+p.providerOrderId+' base settlement',entries:baseEntries});
    await this.postLedger({
      referenceType:'exchange_provider_trade_quote',
      referenceId:String(p.settlementId),
      idempotencyKey:row.idempotency_key+':quote',
      description:'Provider trade '+p.providerOrderId+' quote settlement',
      entries:String(p.side)==='buy'
        ? [
          {accountId:customerQuote,currency:quote.symbol,direction:'debit',amount:quoteAmount,metadata:{settlementId:p.settlementId,providerOrderId:p.providerOrderId,type:'customer_quote'}},
          {accountId:providerQuote,currency:quote.symbol,direction:'credit',amount:quoteAmount,metadata:{settlementId:p.settlementId,providerOrderId:p.providerOrderId,type:'provider_quote_spent'}}
        ]
        : [
          {accountId:providerQuote,currency:quote.symbol,direction:'debit',amount:quoteAmount,metadata:{settlementId:p.settlementId,providerOrderId:p.providerOrderId,type:'provider_quote_received'}},
          {accountId:customerQuote,currency:quote.symbol,direction:'credit',amount:quoteAmount,metadata:{settlementId:p.settlementId,providerOrderId:p.providerOrderId,type:'customer_quote'}}
        ]
    });
  }
  private async postWithdrawal(row:any,p:any){
    const required=['withdrawalId','customerId','assetId','assetSymbol','amount','providerCode','providerFeeAmount'];
    for(const key of required)if(p[key]===undefined||p[key]===null)throw new Error('missing_withdrawal_outbox_field:'+key);
    const customer=await this.ensureAccount(Number(p.customerId),String(p.assetSymbol));
    const provider=await this.ensureProviderAssetAccount(String(p.providerCode),String(p.assetSymbol));
    const expense=await this.ensureProviderExpenseAccount(String(p.providerCode),String(p.assetSymbol));
    const amount=String(p.amount);
    const fee=String(p.providerFeeAmount??'0');
    const providerCredit=(await this.pool.query('SELECT ($1::numeric+$2::numeric)::text AS amount',[amount,fee])).rows[0].amount;
    const entries:any[]=[
      {accountId:customer,currency:String(p.assetSymbol),direction:'debit',amount,metadata:{withdrawalId:p.withdrawalId,providerWithdrawalId:p.providerWithdrawalId,type:'customer_withdrawal'}},
      {accountId:provider,currency:String(p.assetSymbol),direction:'credit',amount:providerCredit,metadata:{withdrawalId:p.withdrawalId,providerWithdrawalId:p.providerWithdrawalId,type:'provider_asset_sent'}}
    ];
    if(fee!=='0')entries.splice(1,0,{accountId:expense,currency:String(p.assetSymbol),direction:'debit',amount:fee,metadata:{withdrawalId:p.withdrawalId,providerWithdrawalId:p.providerWithdrawalId,type:'provider_withdrawal_fee'}});
    await this.postLedger({
      referenceType:'exchange_withdrawal',
      referenceId:String(p.withdrawalId),
      idempotencyKey:row.idempotency_key,
      description:'Crypto withdrawal '+p.withdrawalId,
      entries
    });
  }
  private async ensureProviderAssetAccount(providerCode:string,symbol:string){
    const code='ansarraf.provider.'+providerCode+'.asset.'+symbol;
    let r=await this.accountRequest('GET','/internal/v1/ledger/accounts/by-code/'+encodeURIComponent(code));
    if(r.ok)return Number(r.body.account.id);
    if(r.status!==404)throw new Error('provider_asset_account_lookup_failed:'+r.status);
    r=await this.accountRequest('POST','/internal/v1/ledger/accounts',{accountCode:code,accountName:'An Sarraf provider '+providerCode+' '+symbol,accountType:'asset',currency:symbol});
    if(r.ok)return Number(r.body.account.id);
    if(r.status===409){r=await this.accountRequest('GET','/internal/v1/ledger/accounts/by-code/'+encodeURIComponent(code));if(r.ok)return Number(r.body.account.id);}
    throw new Error('provider_asset_account_create_failed:'+r.status);
  }
  private async ensureProviderExpenseAccount(providerCode:string,symbol:string){
    const code='ansarraf.expense.provider_fee.'+providerCode+'.'+symbol;
    let r=await this.accountRequest('GET','/internal/v1/ledger/accounts/by-code/'+encodeURIComponent(code));
    if(r.ok)return Number(r.body.account.id);
    if(r.status!==404)throw new Error('provider_expense_account_lookup_failed:'+r.status);
    r=await this.accountRequest('POST','/internal/v1/ledger/accounts',{accountCode:code,accountName:'An Sarraf provider fee expense '+providerCode+' '+symbol,accountType:'expense',currency:symbol});
    if(r.ok)return Number(r.body.account.id);
    if(r.status===409){r=await this.accountRequest('GET','/internal/v1/ledger/accounts/by-code/'+encodeURIComponent(code));if(r.ok)return Number(r.body.account.id);}
    throw new Error('provider_expense_account_create_failed:'+r.status);
  }
  private async asset(id:number){const r=await this.pool.query('SELECT id,symbol,status FROM assets WHERE id=$1',[id]);if(!r.rows[0]||r.rows[0].status!=='active')throw new Error('accounting_asset_not_active');return r.rows[0];}
  private async ensureRevenueAccount(symbol:string){
    const code='ansarraf.revenue.trading_fee.'+symbol;
    let r=await this.accountRequest('GET','/internal/v1/ledger/accounts/by-code/'+encodeURIComponent(code));
    if(r.ok)return Number(r.body.account.id);
    if(r.status!==404)throw new Error('revenue_account_lookup_failed:'+r.status);
    r=await this.accountRequest('POST','/internal/v1/ledger/accounts',{accountCode:code,accountName:'An Sarraf trading fee revenue '+symbol,accountType:'revenue',currency:symbol});
    if(r.ok)return Number(r.body.account.id);
    if(r.status===409){
      r=await this.accountRequest('GET','/internal/v1/ledger/accounts/by-code/'+encodeURIComponent(code));
      if(r.ok)return Number(r.body.account.id);
    }
    throw new Error('revenue_account_create_failed:'+r.status);
  }
  private async ensureAccount(customerId:number,symbol:string){
    const code='ansarraf.customer.'+customerId+'.asset.'+symbol;
    let r=await this.accountRequest('GET','/internal/v1/ledger/accounts/by-code/'+encodeURIComponent(code));
    if(r.ok)return Number(r.body.account.id);if(r.status!==404)throw new Error('account_lookup_failed:'+r.status);
    r=await this.accountRequest('POST','/internal/v1/ledger/accounts',{accountCode:code,accountName:'An Sarraf customer '+customerId+' '+symbol,accountType:'liability',currency:symbol});
    if(r.ok)return Number(r.body.account.id);
    if(r.status===409){r=await this.accountRequest('GET','/internal/v1/ledger/accounts/by-code/'+encodeURIComponent(code));if(r.ok)return Number(r.body.account.id);}
    throw new Error('account_create_failed:'+r.status);
  }
  private async postLedger(body:any){const r=await this.accountRequest('POST','/internal/v1/ledger/transactions',body);if(!r.ok)throw new Error('ledger_post_failed:'+r.status+':'+JSON.stringify(r.body).slice(0,1000));}
  private async accountRequest(method:string,path:string,body?:unknown){
    const url=process.env.ACCOUNTING_SERVICE_URL;const token=process.env.ACCOUNTING_INTERNAL_TOKEN;if(!url||!token)throw new Error('accounting_service_not_configured');
    const response=await fetch(url.replace(/\/$/,'')+path,{method,headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
    let bodyJson:any={};try{bodyJson=await response.json();}catch{}return{ok:response.ok,status:response.status,body:bodyJson};
  }
}