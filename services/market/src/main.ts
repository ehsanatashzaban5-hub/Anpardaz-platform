const isProduction=process.env.NODE_ENV==="production";if(isProduction){const v=process.env.MARKET_INTERNAL_TOKEN;if(!v||v.length<32||v.includes("CHANGE_ME"))throw new Error("MARKET_INTERNAL_TOKEN_must_be_configured");}
import Fastify from"fastify";import cors from"@fastify/cors";import{Pool}from"pg";import{registerMarketAggregatorRoutes}from"./routes/market-aggregator.js";import{registerMarketCommunityRoutes}from"./routes/market-community.js";import{registerMarketCompletionRoutes}from"./routes/market-completion.js";import{registerMarketDataRoutes}from"./routes/market-data.js";import{registerAdminMarketRoutes}from"./routes/admin-market.js";
const app=Fastify({logger:true,trustProxy:process.env.TRUST_PROXY==="true"});const pool=new Pool({connectionString:process.env.DATABASE_URL,max:10,connectionTimeoutMillis:5000,idleTimeoutMillis:30000});
await app.register(cors,{origin:process.env.CORS_ORIGIN?.split(",").map(x=>x.trim()).filter(Boolean)??true});
app.get("/health",async()=>({service:"market",status:"ok"}));app.get("/health/db",async()=>{await pool.query("SELECT 1");return{service:"market",database:"ok"}});
(app as any).marketPool=pool;
registerMarketAggregatorRoutes(app,pool);registerMarketCommunityRoutes(app,pool);registerMarketCompletionRoutes(app,pool);registerMarketDataRoutes(app,pool);registerAdminMarketRoutes(app,pool);
const shutdown=async()=>{await app.close();await pool.end()};process.on("SIGTERM",shutdown);process.on("SIGINT",shutdown);await app.listen({host:"0.0.0.0",port:Number(process.env.PORT??4007)});
