import { Pool } from 'pg';
import { MarketDataService, NobitexAdapter, TabdealAdapter, WallexAdapter } from '../services/market-data.js';

const databaseUrl=process.env.DATABASE_URL;
if(!databaseUrl)throw new Error('DATABASE_URL is required');
const intervalMs=Math.max(Number(process.env.MARKET_DATA_INTERVAL_MS??30000),10000);
const symbols=(process.env.MARKET_DATA_SYMBOLS??'BTC-USDT,ETH-USDT,BTC-IRT,ETH-IRT').split(',').map(v=>v.trim().toUpperCase()).filter(Boolean);
const pool=new Pool({connectionString:databaseUrl,max:5,connectionTimeoutMillis:5000,idleTimeoutMillis:30000});
const service=new MarketDataService(pool,[new WallexAdapter(),new NobitexAdapter(),new TabdealAdapter()]);
let running=false;
const tick=async()=>{if(running)return;running=true;try{await service.ingest(symbols);}catch(error){console.error('market-data-worker',error);}finally{running=false;}};
await tick();
const timer=setInterval(tick,intervalMs);
const shutdown=async()=>{clearInterval(timer);await pool.end();process.exit(0)};
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
