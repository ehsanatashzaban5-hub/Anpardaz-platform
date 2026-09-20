import {reconcileSolvency} from './solvency-reconciliation.js';
import type {FastifyBaseLogger} from 'fastify';
import type {Pool} from 'pg';
import {createProviderRegistry} from './providers/index.js';

export class ProviderReconciliationWorker{
  private stopped=false;
  private running=false;
  private timer?:ReturnType<typeof setTimeout>;
  constructor(private readonly pool:Pool,private readonly log:FastifyBaseLogger,private readonly registry=createProviderRegistry()){}
  start(){if(this.running)return;this.running=true;void this.loop();}
  stop(){this.stopped=true;if(this.timer)clearTimeout(this.timer);}
  private async loop(){
    if(this.stopped)return;
    try{await this.run();}catch(error){this.log.error({error},'provider reconciliation failed');}
    this.timer=setTimeout(()=>void this.loop(),Number(process.env.PROVIDER_RECONCILIATION_INTERVAL_MS??60000));
  }
  async run(){
    const providerCode=(process.env.LIQUIDITY_PROVIDER_CODE??'WALLEX').toUpperCase();
    const adapter=this.registry.get(providerCode);
    if(!adapter)return {status:'SKIPPED',reason:'provider_not_configured'};
    const run=(await this.pool.query(
      "INSERT INTO reconciliation_runs(scope,provider_code,status) VALUES('PROVIDER_BALANCE',$1,'RUNNING') RETURNING id",[providerCode])).rows[0];
    let overall:'OK'|'WARNING'|'CRITICAL'='OK';
    let checkedAssets=0;
    let mismatchCount=0;
    let criticalCount=0;
    try{
      const balances=await adapter.getBalances();
      const tolerance=process.env.PROVIDER_RECONCILIATION_TOLERANCE??'0.00000001';
      const providerSymbols=new Set<string>();
      for(const b of balances){
        checkedAssets++;
        const symbol=String(b.asset).toUpperCase();
        providerSymbols.add(symbol);
        const providerTotal=(await this.pool.query('SELECT ($1::numeric+$2::numeric)::text AS value',[b.available,b.locked])).rows[0].value;
        const accountCode='ansarraf.provider.'+providerCode+'.asset.'+symbol;
        const response=await this.accountingRequest('GET','/internal/v1/ledger/accounts/by-code/'+encodeURIComponent(accountCode));
        if(response.status===404){
          overall='CRITICAL';
          mismatchCount++;
          criticalCount++;
          await this.pool.query(
            `INSERT INTO provider_balance_reconciliations
             (run_id,provider_code,asset_symbol,provider_available,provider_locked,provider_total,status)
             VALUES($1,$2,$3,$4,$5,$6,'MISSING_ACCOUNT')`,
            [run.id,providerCode,symbol,b.available,b.locked,providerTotal]);
          continue;
        }
        if(!response.ok)throw new Error('accounting_account_lookup_failed:'+response.status);
        const accountId=Number(response.body.account.id);
        const balanceResponse=await this.accountingRequest('GET','/internal/v1/ledger/accounts/'+accountId+'/balance');
        if(!balanceResponse.ok)throw new Error('accounting_balance_lookup_failed:'+balanceResponse.status);
        const accountingBalance=String(balanceResponse.body.balance.balance);
        const diff=(await this.pool.query('SELECT ($1::numeric-$2::numeric)::text AS value',[providerTotal,accountingBalance])).rows[0].value;
        const magnitude=String((await this.pool.query('SELECT ABS($1::numeric)::text AS value',[diff])).rows[0].value);
        const status=magnitude==='0'||(await this.pool.query('SELECT $1::numeric <= $2::numeric AS ok',[magnitude,tolerance])).rows[0].ok?'OK':'CRITICAL';
        if(status==='CRITICAL'){
          overall='CRITICAL';
          mismatchCount++;
          criticalCount++;
        }
        await this.pool.query(
          `INSERT INTO provider_balance_reconciliations
           (run_id,provider_code,asset_symbol,provider_available,provider_locked,provider_total,accounting_balance,difference,status)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [run.id,providerCode,symbol,b.available,b.locked,providerTotal,accountingBalance,diff,status]);
      }
      const prefix='ansarraf.provider.'+providerCode+'.asset.';
      const accountResponse=await this.accountingRequest(
        'GET',
        '/internal/v1/ledger/accounts?status=active&accountCodePrefix='+encodeURIComponent(prefix)+'&limit=500'
      );
      if(!accountResponse.ok)throw new Error('accounting_provider_accounts_lookup_failed:'+accountResponse.status);
      for(const account of accountResponse.body.accounts??[]){
        const accountCode=String(account.account_code);
        const symbol=accountCode.slice(prefix.length).toUpperCase();
        if(!symbol||providerSymbols.has(symbol))continue;
        checkedAssets++;
        const balanceResponse=await this.accountingRequest('GET','/internal/v1/ledger/accounts/'+Number(account.id)+'/balance');
        if(!balanceResponse.ok)throw new Error('accounting_balance_lookup_failed:'+balanceResponse.status);
        const accountingBalance=String(balanceResponse.body.balance.balance);
        const diff=(await this.pool.query(
          'SELECT (0::numeric-$1::numeric)::text AS value',
          [accountingBalance]
        )).rows[0].value;
        const magnitude=String((await this.pool.query('SELECT ABS($1::numeric)::text AS value',[diff])).rows[0].value);
        const status=(await this.pool.query(
          'SELECT $1::numeric <= $2::numeric AS ok',
          [magnitude,tolerance]
        )).rows[0].ok?'OK':'CRITICAL';
        if(status==='CRITICAL'){
          overall='CRITICAL';
          mismatchCount++;
          criticalCount++;
        }
        await this.pool.query(
          `INSERT INTO provider_balance_reconciliations
           (run_id,provider_code,asset_symbol,provider_available,provider_locked,provider_total,accounting_balance,difference,status)
           VALUES($1,$2,$3,0,0,0,$4,$5,$6)`,
          [run.id,providerCode,symbol,accountingBalance,diff,status]
        );
      }

      const solvency=await reconcileSolvency(this.pool,adapter,Number(run.id));
      if(solvency.status==='CRITICAL'){
        overall='CRITICAL';
        criticalCount++;
        mismatchCount++;
      }

      // Cross-check customer wallet liabilities against the Accounting liability ledger.
      // Provider reconciliation alone cannot prove that customer balances and the ledger agree.
      const customerWallets=await this.pool.query(
        `SELECT a.symbol,
                COALESCE(SUM(w.available_balance+w.locked_balance),0)::text AS wallet_total
         FROM wallets w
         JOIN assets a ON a.id=w.asset_id
         GROUP BY a.symbol`
      );
      const customerPrefix='ansarraf.customer.';
      const liabilityResponse=await this.accountingRequest(
        'GET',
        '/internal/v1/ledger/accounts/balances/by-currency?status=active&accountCodePrefix='+encodeURIComponent(customerPrefix)
      );
      if(!liabilityResponse.ok)throw new Error('accounting_customer_balances_lookup_failed:'+liabilityResponse.status);
      const accountingBySymbol=new Map<string,string>();
      for(const account of liabilityResponse.body.balances??[]){
        const symbol=String(account.currency).toUpperCase();
        accountingBySymbol.set(symbol,String(account.balance));
      }
      const symbols=new Set<string>([
        ...customerWallets.rows.map(x=>String(x.symbol).toUpperCase()),
        ...accountingBySymbol.keys()
      ]);
      for(const symbol of symbols){
        checkedAssets++;
        const walletTotal=String(customerWallets.rows.find(x=>String(x.symbol).toUpperCase()===symbol)?.wallet_total??'0');
        const accountingTotal=String(accountingBySymbol.get(symbol)??'0');
        const diff=String((await this.pool.query(
          'SELECT ($1::numeric-$2::numeric)::text AS value',[walletTotal,accountingTotal]
        )).rows[0].value);
        const magnitude=String((await this.pool.query('SELECT ABS($1::numeric)::text AS value',[diff])).rows[0].value);
        const status=(await this.pool.query(
          'SELECT $1::numeric <= $2::numeric AS ok',[magnitude,tolerance]
        )).rows[0].ok?'OK':'CRITICAL';
        if(status==='CRITICAL'){
          overall='CRITICAL';
          mismatchCount++;
          criticalCount++;
        }
        await this.pool.query(
          `INSERT INTO customer_balance_reconciliations
           (run_id,asset_symbol,wallet_total,accounting_liability,difference,status)
           VALUES($1,$2,$3,$4,$5,$6)`,
          [run.id,symbol,walletTotal,accountingTotal,diff,status]
        );
      }

      await this.pool.query(
        "UPDATE reconciliation_runs SET status=$2,completed_at=NOW(),metadata=$3 WHERE id=$1",
        [run.id,overall,{checkedAssets,mismatchCount,criticalCount}]
      );
      return {status:overall,runId:run.id};
    }catch(error){
      await this.pool.query("UPDATE reconciliation_runs SET status='FAILED',completed_at=NOW(),error_message=$2 WHERE id=$1",[run.id,String(error instanceof Error?error.message:error).slice(0,2000)]);
      throw error;
    }
  }
  private async accountingRequest(method:string,path:string){
    const base=(process.env.ACCOUNTING_SERVICE_URL??'http://localhost:4004').replace(/\/$/,'');
    const token=process.env.ACCOUNTING_INTERNAL_TOKEN;
    if(!token)throw new Error('ACCOUNTING_INTERNAL_TOKEN_missing');
    const response=await fetch(base+path,{method,headers:{accept:'application/json',authorization:'Bearer '+token},signal:AbortSignal.timeout(Number(process.env.ACCOUNTING_HTTP_TIMEOUT_MS??5000))});
    let body:any={};try{body=await response.json();}catch{}
    return {ok:response.ok,status:response.status,body};
  }
}
