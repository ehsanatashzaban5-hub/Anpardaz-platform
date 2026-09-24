import { Pool } from "pg";

type Store={id:number;name:string;domain:string;homepage_url:string};
type Item={id?:string|number;name?:string;title?:string;description?:string;short_description?:string;sku?:string;permalink?:string;price?:string|number;regular_price?:string|number;stock_status?:string;images?:Array<{src?:string}>;categories?:Array<{id?:number;name?:string}>;brands?:Array<{name?:string}>;attributes?:Array<{name?:string;options?:string[]}>};

const databaseUrl=process.env.DATABASE_URL;
if(!databaseUrl) throw new Error("DATABASE_URL is required");
const pool=new Pool({connectionString:databaseUrl,max:4});
const intervalMs=Math.max(5,Number(process.env.MARKET_SYNC_INTERVAL_MINUTES??30))*60_000;
const maxStores=Math.max(1,Number(process.env.MARKET_SYNC_MAX_STORES??50));
const timeoutMs=Math.max(5000,Number(process.env.MARKET_SYNC_TIMEOUT_MS??15000));

const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
const text=(v:unknown)=>typeof v==="string"?v.trim():"";
const num=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)&&n>=0?n:null};
const canonical=(domain:string,external:string|number,title:string)=>`store:${domain.toLowerCase()}:${String(external||title).toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g,"-").slice(0,180)}`;
const categorySlug=(item:Item)=>text(item.categories?.[0]?.name).toLowerCase();

async function fetchJson(url:string){
 const c=new AbortController(); const t=setTimeout(()=>c.abort(),timeoutMs);
 try{const r=await fetch(url,{signal:c.signal,headers:{"accept":"application/json","user-agent":"AnPardaz-AnMarketSync/1.0"}});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.json();}
 finally{clearTimeout(t)}
}

async function ensureSource(store:Store){
 const endpoint=`https://${store.domain}/wp-json/wc/store/v1/products?per_page=100`;
 const q=await pool.query(`INSERT INTO market_store_sources(store_id,source_name,source_type,endpoint_url,enabled,mapping)
 VALUES($1,'woocommerce-store-api','api',$2,true,$3)
 ON CONFLICT(store_id,source_name) DO UPDATE SET endpoint_url=EXCLUDED.endpoint_url,updated_at=NOW()
 RETURNING id,endpoint_url`,[store.id,endpoint,JSON.stringify({adapter:"woocommerce-store-api"})]);
 return q.rows[0];
}

async function syncStore(store:Store){
 const source=await ensureSource(store);
 const run=await pool.query(`INSERT INTO market_sync_runs(store_id,source_id,status,started_at) VALUES($1,$2,'running',NOW()) RETURNING id`,[store.id,source.id]);
 const runId=run.rows[0].id;
 try{
   const data=await fetchJson(source.endpoint_url);
   const items:Array<Item>=Array.isArray(data)?data:Array.isArray(data?.products)?data.products:Array.isArray(data?.items)?data.items:[];
   let upserted=0,errors=0;
   for(const item of items){
     const title=text(item.name||item.title); if(!title)continue;
     const external=String(item.id??item.sku??title);
     const key=canonical(store.domain,external,title);
     const price=num(item.price??item.regular_price);
     const img=text(item.images?.[0]?.src);
     const specs:Record<string,string>={};
     for(const a of item.attributes??[])if(text(a.name)&&Array.isArray(a.options))specs[text(a.name)]=a.options.map(String).join("، ");
     const product=await pool.query(`INSERT INTO market_products(title,description,category_id,canonical_key,brand,condition,specs,source_url,source_type,status,updated_at)
       VALUES($1,$2,NULL,$3,$4,'new',$5,$6,'store_feed','published',NOW())
       ON CONFLICT(canonical_key) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,brand=EXCLUDED.brand,specs=EXCLUDED.specs,source_url=EXCLUDED.source_url,status='published',updated_at=NOW()
       RETURNING id`,[title,text(item.short_description||item.description),key,text(item.brands?.[0]?.name),JSON.stringify(specs),text(item.permalink)]);
     const productId=product.rows[0].id;
     if(img)await pool.query(`INSERT INTO market_media(product_id,url,sort_order) VALUES($1,$2,0)
       ON CONFLICT DO NOTHING`,[productId,img]);
     if(price!==null){
       const availability=item.stock_status==="outofstock"?"out_of_stock":"in_stock";
       await pool.query(`INSERT INTO market_offers(product_id,store_id,external_product_id,price,currency,availability,product_url,image_url,raw_metadata,last_seen_at,updated_at)
         VALUES($1,$2,$3,$4,'IRR',$5,$6,$7,$8,NOW(),NOW())
         ON CONFLICT DO NOTHING`,[productId,store.id,external,price,availability,text(item.permalink),img,JSON.stringify(item)]);
     }
     upserted++;
   }
   await pool.query(`UPDATE market_sync_runs SET status='succeeded',completed_at=NOW(),discovered_count=$1,upserted_count=$2,error_count=$3 WHERE id=$4`,[items.length,upserted,errors,runId]);
   await pool.query(`UPDATE market_stores SET last_sync_at=NOW(),last_sync_status='succeeded',last_sync_error=NULL,last_checked_at=NOW(),updated_at=NOW() WHERE id=$1`,[store.id]);
   return {store:store.name,status:"succeeded",items:items.length,upserted};
 }catch(e){
   const msg=e instanceof Error?e.message:String(e);
   await pool.query(`UPDATE market_sync_runs SET status='failed',completed_at=NOW(),error_count=1,error_summary=$1 WHERE id=$2`,[msg.slice(0,1000),runId]);
   await pool.query(`UPDATE market_stores SET last_sync_at=NOW(),last_sync_status='failed',last_sync_error=$1,last_checked_at=NOW(),updated_at=NOW() WHERE id=$2`,[msg.slice(0,1000),store.id]);
   return {store:store.name,status:"failed",error:msg};
 }
}

async function main(){
 while(true){
  const q=await pool.query<Store>(`SELECT id,name,domain,homepage_url FROM market_stores WHERE active=true ORDER BY last_sync_at NULLS FIRST,id LIMIT $1`,[maxStores]);
  for(const store of q.rows){await syncStore(store);await sleep(250);}
  await sleep(intervalMs);
 }
}
main().catch(async e=>{console.error(e);await pool.end();process.exit(1)});
