import { Pool } from "pg";

const databaseUrl=process.env.DATABASE_URL;
if(!databaseUrl) throw new Error("DATABASE_URL is required");
const pool=new Pool({connectionString:databaseUrl,max:6});
const intervalMs=Math.max(15,Number(process.env.MARKET_DISCOVERY_INTERVAL_MINUTES??120))*60_000;
const timeoutMs=Math.max(5000,Number(process.env.MARKET_DISCOVERY_TIMEOUT_MS??12000));
const ua="AnPardaz-AnMarketDiscovery/1.0";

async function get(url:string){
  const c=new AbortController();const t=setTimeout(()=>c.abort(),timeoutMs);
  try{
    const r=await fetch(url,{signal:c.signal,redirect:"follow",headers:{
      accept:"application/json,application/xml,text/xml,text/html;q=0.9,*/*;q=0.1",
      "user-agent":ua
    }});
    return {ok:r.ok,status:r.status,url:r.url,text:await r.text()};
  } finally { clearTimeout(t); }
}

function robotsAllows(body:string,target:string){
  if(!body) return true;
  const lines=body.split(/\r?\n/).map(x=>x.trim());
  let applies=false; const blocked:string[]=[];
  for(const line of lines){
    if(!line||line.startsWith("#")) continue;
    const [k,v]=line.split(":",2).map(x=>x.trim());
    if(k?.toLowerCase()==="user-agent"){
      applies=v==="*"||v.toLowerCase()==="anpardaz-anmarketdiscovery";
      continue;
    }
    if(applies&&k?.toLowerCase()==="disallow"&&v) blocked.push(v);
  }
  try{
    const path=new URL(target).pathname;
    return !blocked.some(x=>x.trim()==="/" || (x.trim()&&path.startsWith(x.trim())));
  }catch{return false;}
}

async function connectStore(store:any){
  await pool.query("UPDATE market_stores SET discovery_status='checking',discovery_error=NULL,last_checked_at=NOW() WHERE id=$1",[store.id]);
  const base=String(store.homepage_url).replace(/\/$/,"");
  try{
    const rb=await get(base+"/robots.txt");
    const robotText=rb.ok?rb.text:"";
    const candidates=[
      ["woocommerce_store_api","json",base+"/wp-json/wc/store/v1/products?per_page=5",{}],
      ["shopify_products_json","json",base+"/products.json?limit=5",{}],
      ["sitemap_jsonld","crawler",base+"/sitemap.xml",{maxUrls:300}]
    ];
    for(const [adapter,type,url,mapping] of candidates){
      if(!robotsAllows(robotText,String(url))) continue;
      const response=await get(String(url));
      if(!response.ok) continue;
      let valid=false;
      if(adapter==="woocommerce_store_api"){
        try{const data=JSON.parse(response.text);valid=Array.isArray(data)&&data.length>0;}catch{}
      }else if(adapter==="shopify_products_json"){
        try{const data=JSON.parse(response.text);valid=Array.isArray(data?.products)&&data.products.length>0;}catch{}
      }else{
        valid=/<(?:urlset|sitemapindex)\b/i.test(response.text);
      }
      if(!valid) continue;

      const sql="INSERT INTO market_store_sources(store_id,source_name,source_type,endpoint_url,adapter,mapping,enabled,auth_required) VALUES($1,$2,$3,$4,$5,$6,true,false) ON CONFLICT(store_id,source_name) DO UPDATE SET endpoint_url=EXCLUDED.endpoint_url,adapter=EXCLUDED.adapter,mapping=EXCLUDED.mapping,enabled=true,updated_at=NOW()";
      await pool.query(sql,[store.id,"auto-"+adapter,type,url,JSON.stringify(mapping)]);
      await pool.query("UPDATE market_stores SET verification_status='verified',active=true,feed_type=$1,discovery_status='connected',discovery_method=$2,verified_at=COALESCE(verified_at,NOW()),feed_verified_at=NOW(),updated_at=NOW() WHERE id=$3",[type,adapter,store.id]);
      return;
    }
    throw new Error("NO_PUBLIC_CATALOG_SOURCE");
  }catch(e){
    const message=e instanceof Error?e.message:String(e);
    await pool.query("UPDATE market_stores SET discovery_status=$1,discovery_error=$2,last_checked_at=NOW(),updated_at=NOW() WHERE id=$3",[message==="ROBOTS_BLOCKED"?"blocked":"failed",message.slice(0,500),store.id]);
  }
}

async function main(){
  while(true){
    const batch=Math.max(1,Number(process.env.MARKET_DISCOVERY_BATCH??25));
    const stores=(await pool.query(
      "SELECT id,name,domain,homepage_url FROM market_stores WHERE verification_status IN ('unverified','pending') AND discovery_status IN ('not_checked','failed') ORDER BY id LIMIT $1",
      [batch]
    )).rows;
    for(const store of stores) await connectStore(store);
    await new Promise(resolve=>setTimeout(resolve,intervalMs));
  }
}
main().catch(async e=>{console.error(e);await pool.end();process.exit(1)});