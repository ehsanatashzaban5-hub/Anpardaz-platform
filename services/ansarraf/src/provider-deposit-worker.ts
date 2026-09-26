import type {FastifyBaseLogger} from 'fastify';import type {Pool} from 'pg';import {createProviderRegistry} from './providers/index.js';
export class ProviderDepositWorker{
 private timer?:ReturnType<typeof setTimeout>;private stopped=false;private running=false;
 constructor(private readonly pool:Pool,private readonly log:FastifyBaseLogger,private readonly registry=createProviderRegistry()){}
 start(){if(this.running)return;this.running=true;void this.loop();}
 stop(){this.stopped=true;if(this.timer)clearTimeout(this.timer);}
 private async loop(){if(this.stopped)return;try{await this.run();}catch(error){this.log.error({error},'provider crypto deposit sync failed');}this.timer=setTimeout(()=>void this.loop(),Number(process.env.PROVIDER_DEPOSIT_SYNC_INTERVAL_MS??60000));}
 async run(){
  const code=(process.env.LIQUIDITY_PROVIDER_CODE??'WALLEX').toUpperCase(),provider=(await this.pool.query("SELECT id FROM liquidity_providers WHERE code=$1 AND status='ACTIVE'",[code])).rows[0];const adapter=this.registry.get(code);if(!provider||!adapter)return{status:'SKIPPED'};
  const events=await adapter.listDeposits(1,100);let detected=0;
  for(const e of events){
   const asset=(await this.pool.query("SELECT id FROM assets WHERE symbol=$1 AND asset_type='crypto' AND status='active'",[e.asset])).rows[0];if(!asset)continue;
   const candidates=(await this.pool.query("SELECT customer_id,memo FROM provider_deposit_addresses WHERE provider_id=$1 AND asset_id=$2 AND network=$3 AND address=$4 AND status='ACTIVE'",[provider.id,asset.id,e.network??'',e.address??''])).rows;
   let customerId:number|null=null;
   if(e.memo&&candidates.length){customerId=candidates.find((x:any)=>String(x.memo??'')===String(e.memo))?.customer_id??null;}
   else if(candidates.length===1)customerId=Number(candidates[0].customer_id);
   const status=Number(e.confirmations)>=Number(e.requiredConfirmations)?(customerId?'confirmed':'manual_review'):'detected';
   await this.pool.query(`INSERT INTO provider_deposit_events(provider_id,customer_id,asset_id,provider_event_id,asset_symbol,network,amount,address,memo,tx_hash,confirmations,required_confirmations,status,raw_payload,confirmed_at)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,CASE WHEN $13='confirmed' THEN NOW() ELSE NULL END)
    ON CONFLICT(provider_id,provider_event_id) DO UPDATE SET customer_id=COALESCE(provider_deposit_events.customer_id,EXCLUDED.customer_id),confirmations=EXCLUDED.confirmations,required_confirmations=EXCLUDED.required_confirmations,status=CASE WHEN provider_deposit_events.status='credited' THEN 'credited' ELSE EXCLUDED.status END,raw_payload=EXCLUDED.raw_payload,confirmed_at=COALESCE(provider_deposit_events.confirmed_at,EXCLUDED.confirmed_at)`,
    [provider.id,customerId,asset.id,e.providerEventId,e.asset,e.network,e.amount,e.address,e.memo,e.txHash,e.confirmations,e.requiredConfirmations,status,e.raw]);
   detected++;
  }
  return{status:'OK',detected};
 }
}