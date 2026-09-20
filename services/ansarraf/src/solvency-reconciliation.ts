import type {Pool} from 'pg';
import type {ProviderBalance,ProviderAdapter} from './providers/types.js';

export async function reconcileSolvency(pool:Pool,provider:ProviderAdapter,runId:number){
  const balances:ProviderBalance[]=await provider.getBalances();
  const providerByAsset=new Map<string,{available:string;locked:string;total:string}>();
  for(const balance of balances){
    const symbol=String(balance.asset).toUpperCase();
    const existing=providerByAsset.get(symbol);
    if(!existing){
      const total=(await pool.query('SELECT ($1::numeric+$2::numeric)::text AS value',[balance.available,balance.locked])).rows[0].value;
      providerByAsset.set(symbol,{available:String(balance.available),locked:String(balance.locked),total:String(total)});
    }else{
      const available=(await pool.query('SELECT ($1::numeric+$2::numeric)::text AS value',[existing.available,balance.available])).rows[0].value;
      const locked=(await pool.query('SELECT ($1::numeric+$2::numeric)::text AS value',[existing.locked,balance.locked])).rows[0].value;
      const total=(await pool.query('SELECT ($1::numeric+$2::numeric)::text AS value',[existing.total,String(balance.available)])).rows[0].value;
      const correctedTotal=(await pool.query('SELECT ($1::numeric+$2::numeric)::text AS value',[total,String(balance.locked)])).rows[0].value;
      providerByAsset.set(symbol,{available,locked,total:correctedTotal});
    }
  }

  const liabilityResponse=await fetch(
    (process.env.ACCOUNTING_SERVICE_URL??'http://localhost:4004').replace(/\/$/,'')+
    '/internal/v1/ledger/accounts/balances?status=active&accountCodePrefix='+encodeURIComponent('ansarraf.customer.')+'&limit=5000',
    {headers:{authorization:'Bearer '+String(process.env.ACCOUNTING_INTERNAL_TOKEN??'')},signal:AbortSignal.timeout(Number(process.env.ACCOUNTING_HTTP_TIMEOUT_MS??5000))}
  );
  const liabilityBody:any=await liabilityResponse.json().catch(()=>({}));
  if(!liabilityResponse.ok)throw new Error('accounting_customer_balances_lookup_failed:'+liabilityResponse.status);

  const liabilities=new Map<string,string>();
  for(const account of liabilityBody.accounts??[]){
    const symbol=String(account.currency).toUpperCase();
    const current=liabilities.get(symbol)??'0';
    liabilities.set(symbol,(await pool.query('SELECT ($1::numeric+$2::numeric)::text AS value',[current,String(account.balance)])).rows[0].value);
  }

  const assets=new Set<string>([...providerByAsset.keys(),...liabilities.keys()]);
  const rows:any[]=[];
  for(const symbol of assets){
    const controlled=providerByAsset.get(symbol)?.total??'0';
    const liability=liabilities.get(symbol)??'0';
    const difference=(await pool.query('SELECT ($1::numeric-$2::numeric)::text AS value',[controlled,liability])).rows[0].value;
    const status=(await pool.query('SELECT $1::numeric >= 0 AS ok',[difference])).rows[0].ok?'OK':'CRITICAL';
    const row=(await pool.query(
      `INSERT INTO solvency_reconciliation_evidence
       (run_id,asset_symbol,controlled_provider_total,customer_liability,coverage_difference,status,coverage_scope,metadata)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT(run_id,asset_symbol) DO UPDATE SET
         controlled_provider_total=EXCLUDED.controlled_provider_total,
         customer_liability=EXCLUDED.customer_liability,
         coverage_difference=EXCLUDED.coverage_difference,
         status=EXCLUDED.status,
         coverage_scope=EXCLUDED.coverage_scope,
         metadata=EXCLUDED.metadata
       RETURNING *`,
      [runId,symbol,controlled,liability,difference,status,'LIQUIDITY_PROVIDER_ONLY',{
        providerCode:process.env.LIQUIDITY_PROVIDER_CODE??'WALLEX',
        independentlyUnverifiedSources:['BLOCKCHAIN','BANK']
      }]
    )).rows[0];
    rows.push(row);
  }
  return {status:rows.some(r=>r.status==='CRITICAL')?'CRITICAL':'OK',rows};
}
