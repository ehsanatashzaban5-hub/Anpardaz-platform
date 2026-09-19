import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Pool } from 'pg';
import { requireAuth, ensureCustomer } from './auth.js';
import { MarketDataService } from './market-data.js';
import { registerMarketRoutes } from './routes/markets.js';
import { registerTradingRoutes } from './routes/trading.js';
import { registerSettlementRoutes } from './routes/settlement.js';
import { registerMatchingRoutes } from './routes/matching.js';
import { AccountingOutboxWorker } from './accounting-outbox.js';
import { ProviderExecutionWorker } from './provider-execution-worker.js';
import { ProviderWithdrawalWorker } from './provider-withdrawal-worker.js';
import { ProviderReconciliationWorker } from './provider-reconciliation.js';

const isProduction=process.env.NODE_ENV==='production';
const requiredProduction=['DATABASE_URL','CORS_ORIGIN','IDENTITY_SERVICE_URL','IDENTITY_ISSUER','IDENTITY_PUBLIC_KEY_B64','ANSARRAF_INTERNAL_TOKEN','ACCOUNTING_SERVICE_URL','ACCOUNTING_INTERNAL_TOKEN'];
if(isProduction){for(const name of requiredProduction){const value=process.env[name];if(!value||value.includes('CHANGE_ME')||value.includes('your-web-domain.example')||value.includes('your-domain.example')||value.includes('BASE64-DER-ED25519-PUBLIC-KEY'))throw new Error(`Production environment variable ${name} must be configured with a real value`);}}

const app=Fastify({logger:true});
app.setErrorHandler((error,_request,reply)=>{if(error instanceof Error&&error.message==='customer_inactive')return reply.code(403).send({error:'customer_inactive'});app.log.error(error);return reply.code(500).send({error:'internal_server_error'});});
const port=Number(process.env.PORT??4002);
const databaseUrl=process.env.DATABASE_URL;
const pool=databaseUrl?new Pool({connectionString:databaseUrl,max:10,connectionTimeoutMillis:5000,idleTimeoutMillis:30000}):null;
const marketData=pool?new MarketDataService(pool):null;
const accountingOutbox=pool?new AccountingOutboxWorker(pool,app.log):null;
const providerExecution=pool?new ProviderExecutionWorker(pool,app.log):null;
const providerWithdrawal=pool?new ProviderWithdrawalWorker(pool,app.log):null;
const providerReconciliation=pool?new ProviderReconciliationWorker(pool,app.log):null;
if(!pool)app.log.warn('DATABASE_URL is not configured; database endpoints will be unavailable');
const corsOrigins=process.env.CORS_ORIGIN?.split(',').map(v=>v.trim()).filter(Boolean)??['http://localhost:5173'];
if(isProduction&&corsOrigins.some(v=>v==='*'||v.startsWith('http://localhost')||v.startsWith('http://127.0.0.1')))throw new Error('Production CORS_ORIGIN must not allow localhost or wildcard origins');
await app.register(cors,{origin:corsOrigins});
app.addHook('onSend',async(_request,reply)=>{reply.header('X-Content-Type-Options','nosniff');reply.header('Referrer-Policy','strict-origin-when-cross-origin');reply.header('X-Frame-Options','DENY');reply.header('Cache-Control','no-store');});
app.get('/health',async()=>({service:'ansarraf',status:'ok'}));
app.get('/health/db',async(_r,reply)=>{if(!pool)return reply.code(503).send({service:'ansarraf',database:'not-configured'});try{const r=await pool.query<{version:string}>('SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1');return{service:'ansarraf',database:'ok',migration:r.rows[0]?.version??null};}catch{return reply.code(503).send({service:'ansarraf',database:'unavailable'});}});
app.get('/health/market-data',async(_r,reply)=>{if(!marketData)return reply.code(503).send({service:'ansarraf',marketData:'not-configured'});const health=marketData.health();const down=Object.values(health).filter(v=>v.status==='down').length;return reply.code(down===3?503:200).send({service:'ansarraf',marketData:down===0?'healthy':'degraded',providers:health});});
app.get('/api/v1/status',async()=>({service:'ansarraf',apiVersion:'v1',status:'ready',marketData:marketData?'enabled':'disabled'}));
if(pool){registerMarketRoutes(app,pool,marketData);registerTradingRoutes(app,pool);registerSettlementRoutes(app,pool);registerMatchingRoutes(app,pool);app.get('/api/v1/auth/me',{preHandler:requireAuth},async(request)=>{const auth=(request as typeof request&{auth:any}).auth;const id=await ensureCustomer(pool,auth);const r=await pool.query('SELECT id,identity_id,external_user_id,email,status FROM customers WHERE id=$1',[id]);return r.rows[0]?{user:r.rows[0]}:{error:'user_not_found'};});if(marketData)await marketData.start().catch(error=>app.log.error({error},'market data initial refresh failed'));if(accountingOutbox)accountingOutbox.start();if(providerExecution)providerExecution.start();if(providerWithdrawal)providerWithdrawal.start();if(providerReconciliation)providerReconciliation.start();}
const shutdown=async()=>{marketData?.stop();accountingOutbox?.stop();providerExecution?.stop();providerWithdrawal?.stop();providerReconciliation?.stop();await app.close();await pool?.end();};
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
await app.listen({host:'0.0.0.0',port});
