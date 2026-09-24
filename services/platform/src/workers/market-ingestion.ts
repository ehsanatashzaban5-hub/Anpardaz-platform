import { Pool } from "pg";

type Store={id:number;name:string;domain:string;homepage_url:string};
type Item={id?:string|number;name?:string;title?:string;description?:string;short_description?:string;sku?:string;permalink?:string;price?:string|number;regular_price?:string|number;stock_status?:string;in_stock?:boolean;gtin?:string;ean?:string;upc?:string;mpn?:string;model?:string;prices?:{price?:string;currency_code?:string;currency_minor_unit?:number;regular_price?:string};images?:Array<{src?:string}>;categories?:Array<{id?:number;name?:string}>;brands?:Array<{name?:string}>;attributes?:Array<{name?:string;options?:string[]}>};

const databaseUrl=process.env.DATABASE_URL;
if(!databaseUrl) throw new Error("DATABASE_URL is required");
const pool=new Pool({connectionString:databaseUrl,max:4});
const intervalMs=Math.max(5,Number(process.env.MARKET_SYNC_INTERVAL_MINUTES??30))*60_000;
const maxStores=Math.max(1,Number(process.env.MARKET_SYNC_MAX_STORES??50));
const timeoutMs=Math.max(5000,Number(process.env.MARKET_SYNC_TIMEOUT_MS??15000));

const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
const text=(v:unknown)=>typeof v==="string"?v.trim():"";
const num=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)&&n>=0?n:null};
const normalize=(v:string)=>v.normalize("NFKC").toLowerCase().replace(/[يى]/g,"ی").replace(/[ك]/g,"ک").replace(/\s+/g," ").replace(/[^a-z0-9\u0600-\u06ff ]+/g," ").trim().replace(/\s+/g," ");
const canonical=(item:Item,brand:string)=>{const gtin=text(item.gtin||item.ean||item.upc);if(gtin)return "gtin:"+gtin;const model=text(item.mpn||item.model);const base=normalize(text(item.name||item.title));return "name:"+normalize(brand)+"|"+normalize(model)+"|"+base;};

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

async function resolveCategory(item:Item){
 const sourceKeys=[...(item.categories??[]).flatMap(c=>[text(c.name),normalize(text(c.name))]).filter(Boolean)];
 if(!sourceKeys.length)return null;
 const q=await pool.query(`SELECT category_id FROM market_category_aliases WHERE active=true AND source_key=ANY($1::text[]) ORDER BY priority ASC LIMIT 1`,[sourceKeys]);
 if(q.rows[0])return q.rows[0].category_id;
 const fallback=await pool.query(`SELECT c.id FROM market_categories c WHERE c.parent_id IS NULL AND lower(c.name)||' '||lower(c.name_fa) ILIKE $1 LIMIT 1`,["%"+sourceKeys[0]+"%"]);
 return fallback.rows[0]?.id??null;
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
     const brand=text(item.brands?.[0]?.name);
     const key=canonical(item,brand);
     const minor=Number.isInteger(item.prices?.currency_minor_unit)?Number(item.prices?.currency_minor_unit):0;
     const rawPrice=item.prices?.price??item.price??item.regular_price;
     const basePrice=num(rawPrice);
     const price=basePrice===null?null:basePrice/Math.pow(10,minor);
     const currency=(text(item.prices?.currency_code)||"IRR").toUpperCase().slice(0,3);
     const img=text(item.images?.[0]?.src);
     const specs:Record<string,string>={};
     for(const a of item.attributes??[])if(text(a.name)&&Array.isArray(a.options))specs[text(a.name)]=a.options.map(String).join("، ");
     const categoryId=await resolveCategory(item);
     const product=await pool.query(`INSERT INTO market_products(title,description,category_id,canonical_key,brand,condition,specs,source_url,source_type,status,normalized_title,gtin,mpn,model,updated_at)
       VALUES($1,$2,$3,$4,$5,'new',$6,$7,'store_feed','published',$8,$9,$10,$11,NOW())
       ON CONFLICT(canonical_key) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,category_id=COALESCE(EXCLUDED.category_id,market_products.category_id),brand=EXCLUDED.brand,specs=EXCLUDED.specs,source_url=EXCLUDED.source_url,normalized_title=EXCLUDED.normalized_title,gtin=COALESCE(EXCLUDED.gtin,market_products.gtin),mpn=COALESCE(EXCLUDED.mpn,market_products.mpn),model=COALESCE(EXCLUDED.model,market_products.model),status='published',updated_at=NOW()
       RETURNING id`,[title,text(item.short_description||item.description),categoryId,key,brand,JSON.stringify(specs),text(item.permalink),normalize(title),text(item.gtin||item.ean||item.upc)||null,text(item.mpn)||null,text(item.model)||null]);
     const productId=product.rows[0].id;
     if(img)await pool.query(`INSERT INTO market_media(product_id,url,sort_order) VALUES($1,$2,0) ON CONFLICT DO NOTHING`,[productId,img]);
     if(price!==null){
       const availability=item.stock_status==="outofstock"||item.in_stock===false?"out_of_stock":"in_stock";
       await pool.query(`INSERT INTO market_offers(product_id,store_id,external_product_id,price,currency,availability,product_url,image_url,raw_metadata,last_seen_at,updated_at)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
         ON CONFLICT(store_id,external_product_id) DO UPDATE SET product_id=EXCLUDED.product_id,price=EXCLUDED.price,currency=EXCLUDED.currency,availability=EXCLUDED.availability,product_url=EXCLUDED.product_url,image_url=EXCLUDED.image_url,raw_metadata=EXCLUDED.raw_metadata,last_seen_at=NOW(),updated_at=NOW()`,[productId,store.id,String(item.id??item.sku??key),price,currency,availability,text(item.permalink),img,JSON.stringify(item)]);
     }
     upserted++;
   }
   await pool.query(`UPDATE market_sync_runs SET status='succeeded',completed_at=NOW(),discovered_count=$1,upserted_count=$2,error_count=$3 WHERE id=$4`,[items.length,upserted,errors,runId]);
   await pool.query(`UPDATE market_stores SET last_sync_at=NOW(),last_sync_status='succeeded',last_sync_error=NULL,updated_at=NOW() WHERE id=$1`,[store.id]);
 }catch(e){
   const msg=e instanceof Error?e.message:String(e);
   await pool.query(`UPDATE market_sync_runs SET status='failed',completed_at=NOW(),error_count=1,error_summary=$1 WHERE id=$2`,[msg.slice(0,1000),runId]);
   await pool.query(`UPDATE market_stores SET last_sync_at=NOW(),last_sync_status='failed',last_sync_error=$1,updated_at=NOW() WHERE id=$2`,[msg.slice(0,1000),store.id]);
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