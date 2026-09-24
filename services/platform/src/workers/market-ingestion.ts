import { createHash } from "node:crypto";
import { Pool } from "pg";

type Store={id:number;name:string;domain:string;homepage_url:string;verification_status:string};
type Source={id:number;store_id:number;source_type:string;endpoint_url:string;adapter:string|null;mapping:any;etag:string|null;last_modified:string|null};
type Item={id?:string|number;sku?:string;name?:string;title?:string;description?:string;short_description?:string;permalink?:string;price?:string|number;regular_price?:string|number;stock_status?:string;in_stock?:boolean;gtin?:string;ean?:string;upc?:string;mpn?:string;model?:string;prices?:{price?:string;currency_code?:string;currency_minor_unit?:number;regular_price?:string};images?:Array<{src?:string}>;categories?:Array<{id?:number;name?:string}>;brands?:Array<{name?:string}>;attributes?:Array<{name?:string;options?:string[]}>};

const databaseUrl=process.env.DATABASE_URL;
if(!databaseUrl) throw new Error("DATABASE_URL is required");
const pool=new Pool({connectionString:databaseUrl,max:4});
const intervalMs=Math.max(5,Number(process.env.MARKET_SYNC_INTERVAL_MINUTES??30))*60_000;
const maxStores=Math.max(1,Number(process.env.MARKET_SYNC_MAX_STORES??50));
const timeoutMs=Math.max(5000,Number(process.env.MARKET_SYNC_TIMEOUT_MS??15000));
const aiEnabled=process.env.MARKET_CLASSIFICATION_AI!=="false";

const text=(v:unknown)=>typeof v==="string"?v.trim():"";
const num=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)&&n>=0?n:null};
const normalize=(v:string)=>v.normalize("NFKC").toLowerCase().replace(/[يى]/g,"ی").replace(/[ك]/g,"ک").replace(/\s+/g," ").replace(/[^a-z0-9\u0600-\u06ff ]+/g," ").trim().replace(/\s+/g," ");
const tokens=(v:string)=>new Set(normalize(v).split(" ").filter(x=>x.length>1));
const jaccard=(a:Set<string>,b:Set<string>)=>{if(!a.size||!b.size)return 0;let n=0;for(const x of a)if(b.has(x))n++;return n/(a.size+b.size-n)};
const canonical=(item:Item,brand:string)=>{const gtin=text(item.gtin||item.ean||item.upc);if(gtin)return "gtin:"+gtin;const model=text(item.mpn||item.model);return "product:"+normalize(brand)+"|"+normalize(model)+"|"+normalize(text(item.name||item.title));};

async function fetchJson(url:string,headers:Record<string,string>={}){
 const c=new AbortController();const t=setTimeout(()=>c.abort(),timeoutMs);
 try{const r=await fetch(url,{signal:c.signal,headers:{"accept":"application/json","user-agent":"AnPardaz-AnMarketSync/2.0",...headers}});const body=await r.text();if(!r.ok)throw Object.assign(new Error("HTTP "+r.status),{status:r.status});let data:any;try{data=JSON.parse(body)}catch{throw new Error("INVALID_JSON")};return{data,headers:r.headers,hash:createHash("sha256").update(body).digest("hex")};}
 finally{clearTimeout(t)}
}

function mappedItems(data:any,mapping:any):Item[]{
 const path=typeof mapping?.itemsPath==="string"?mapping.itemsPath:"";
 const root=path.split(".").filter(Boolean).reduce((v:any,k:string)=>v?.[k],data);
 const raw=Array.isArray(root)?root:Array.isArray(data)?data:Array.isArray(data?.products)?data.products:Array.isArray(data?.items)?data.items:[];
 return raw.map((x:any)=>({
   id:x?.[mapping?.idField||"id"],sku:x?.[mapping?.skuField||"sku"],
   name:x?.[mapping?.titleField||"name"]??x?.title,title:x?.title,
   description:x?.[mapping?.descriptionField||"description"],short_description:x?.short_description,
   permalink:x?.[mapping?.urlField||"permalink"]??x?.url,
   price:x?.[mapping?.priceField||"price"],regular_price:x?.regular_price,
   stock_status:x?.stock_status,in_stock:x?.in_stock,
   gtin:x?.[mapping?.gtinField||"gtin"]??x?.ean,mpn:x?.[mapping?.mpnField||"mpn"],model:x?.[mapping?.modelField||"model"],
   images:Array.isArray(x?.images)?x.images.map((i:any)=>({src:i?.src??i?.url})):[],
   categories:Array.isArray(x?.categories)?x.categories.map((c:any)=>({id:c?.id,name:c?.name})):[],
   brands:Array.isArray(x?.brands)?x.brands.map((b:any)=>({name:b?.name??b})):[],
   attributes:Array.isArray(x?.attributes)?x.attributes.map((a:any)=>({name:a?.name,options:a?.options})):[],
   prices:x?.prices
 }));
}

async function resolveCategory(item:Item,store:Store){
 const sourceKeys=[...(item.categories??[]).flatMap(c=>[text(c.name),normalize(text(c.name))]).filter(Boolean)];
 if(sourceKeys.length){
   const q=await pool.query(`SELECT category_id FROM market_category_aliases WHERE active=true AND source_key=ANY($1::text[]) ORDER BY priority ASC LIMIT 1`,[sourceKeys]);
   if(q.rows[0])return{categoryId:Number(q.rows[0].category_id),method:"alias",confidence:0.95};
 }
 const hint=normalize(store.domain+" "+store.name);
 const q=await pool.query(`SELECT id FROM market_categories WHERE active=true AND (slug=ANY($1::text[]) OR normalize_text(name_fa)=ANY($1::text[])) LIMIT 1`,[[]]);
 void hint; void q;
 return{categoryId:null,method:"review",confidence:0};
}

async function matchProduct(item:Item,brand:string,normalizedTitle:string){
 const gtin=text(item.gtin||item.ean||item.upc);
 if(gtin){const q=await pool.query("SELECT id FROM market_products WHERE gtin=$1 LIMIT 1",[gtin]);if(q.rows[0])return{productId:Number(q.rows[0].id),method:"gtin",confidence:1};}
 const model=text(item.mpn||item.model);
 if(model&&brand){const q=await pool.query("SELECT id FROM market_products WHERE lower(coalesce(brand,''))=$1 AND (lower(coalesce(mpn,''))=$2 OR lower(coalesce(model,''))=$2) LIMIT 1",[normalize(brand),normalize(model)]);if(q.rows[0])return{productId:Number(q.rows[0].id),method:"brand_model",confidence:.98};}
 const q=await pool.query("SELECT id,normalized_title,brand,model FROM market_products WHERE status='published' AND normalized_title IS NOT NULL ORDER BY updated_at DESC LIMIT 250",[ ]);
 let best:{id:number;score:number}|null=null;const nt=tokens(normalizedTitle);
 for(const row of q.rows){const score=jaccard(nt,tokens(String(row.normalized_title)));if(normalize(brand)&&normalize(String(row.brand??""))===normalize(brand))best=score>(best?.score??0)?{id:Number(row.id),score:Math.min(1,score+.12)}:best;else best=score>(best?.score??0)?{id:Number(row.id),score}:best;}
 return best&&best.score>=.92?{productId:best.id,method:"title_similarity",confidence:best.score}:null;
}

async function syncSource(store:Store,source:Source){
 if(store.verification_status!=="verified")return;
 if(!source.endpoint_url)return;
 const run=await pool.query("INSERT INTO market_sync_runs(store_id,source_id,status,started_at) VALUES($1,$2,'running',NOW()) RETURNING id",[store.id,source.id]);
 const runId=Number(run.rows[0].id);let discovered=0,upserted=0,errors=0;
 try{
   const headers:Record<string,string>={};if(source.etag)headers["if-none-match"]=source.etag;if(source.last_modified)headers["if-modified-since"]=source.last_modified;
   const fetched=await fetchJson(source.endpoint_url,headers);const items=mappedItems(fetched.data,source.mapping);discovered=items.length;
   const categories=(await pool.query("SELECT id,slug,name_fa FROM market_categories WHERE active=true ORDER BY sort_order,id")).rows;
   const seen=new Set<number>();
   for(const item of items){
     try{
       const title=text(item.name||item.title);if(!title)continue;
       const brand=text(item.brands?.[0]?.name);const normalizedTitle=normalize(title);const key=canonical(item,brand);
       const minor=Number.isInteger(item.prices?.currency_minor_unit)?Number(item.prices?.currency_minor_unit):0;
       const rawPrice=item.prices?.price??item.price??item.regular_price;const basePrice=num(rawPrice);const price=basePrice===null?null:basePrice/Math.pow(10,minor);
       const currency=(text(item.prices?.currency_code)||"IRR").toUpperCase().slice(0,3);
       const img=text(item.images?.[0]?.src);const specs:Record<string,string>={};for(const a of item.attributes??[])if(text(a.name)&&Array.isArray(a.options))specs[text(a.name)]=a.options.map(String).join("، ");
       const cls=await resolveCategory(item,store);
       let productId:number;
       const matched=await matchProduct(item,brand,normalizedTitle);
       if(matched){
         productId=matched.productId;
         await pool.query(`UPDATE market_products SET category_id=COALESCE($1,category_id),brand=COALESCE(NULLIF($2,''),brand),specs=CASE WHEN $3::jsonb='{}'::jsonb THEN specs ELSE $3::jsonb END,source_url=COALESCE(NULLIF($4,''),source_url),normalized_title=$5,gtin=COALESCE($6,gtin),mpn=COALESCE($7,mpn),model=COALESCE($8,model),classification_status=CASE WHEN $1 IS NULL THEN classification_status ELSE 'rule' END,classification_confidence=CASE WHEN $1 IS NULL THEN classification_confidence ELSE $9 END,match_confidence=$10,match_method=$11,updated_at=NOW() WHERE id=$12`,
           [cls.categoryId,brand,JSON.stringify(specs),text(item.permalink),normalizedTitle,text(item.gtin||item.ean||item.upc)||null,text(item.mpn)||null,text(item.model)||null,cls.confidence,matched.confidence,matched.method,productId]);
       }else{
         const ins=await pool.query(`INSERT INTO market_products(title,description,category_id,canonical_key,brand,condition,specs,source_url,source_type,status,normalized_title,gtin,mpn,model,classification_status,classification_confidence,match_confidence,match_method,updated_at)
           VALUES($1,$2,$3,$4,$5,'new',$6,$7,'store_feed','published',$8,$9,$10,$11,$12,$13,$14,$15,NOW())
           ON CONFLICT(canonical_key) WHERE canonical_key IS NOT NULL DO UPDATE SET updated_at=NOW()
           RETURNING id`,[title,text(item.short_description||item.description),cls.categoryId,key,brand,JSON.stringify(specs),text(item.permalink),normalizedTitle,text(item.gtin||item.ean||item.upc)||null,text(item.mpn)||null,text(item.model)||null,cls.categoryId?"rule":"review",cls.confidence,null,null]);
         productId=Number(ins.rows[0].id);
       }
       if(cls.categoryId)await pool.query("INSERT INTO market_category_classifications(product_id,category_id,method,confidence,evidence) VALUES($1,$2,$3,$4,$5)",[productId,cls.categoryId,cls.method,cls.confidence,JSON.stringify({store:store.domain,source:source.id})]);
       if(img)await pool.query("INSERT INTO market_media(product_id,url,sort_order) VALUES($1,$2,0) ON CONFLICT DO NOTHING",[productId,img]);
       if(price!==null){
         const availability=item.stock_status==="outofstock"||item.in_stock===false?"out_of_stock":"in_stock";
         const ext=String(item.id??item.sku??key);
         await pool.query(`INSERT INTO market_offers(product_id,store_id,external_product_id,price,currency,availability,product_url,image_url,raw_metadata,last_seen_at,updated_at)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
           ON CONFLICT(store_id,external_product_id) WHERE external_product_id IS NOT NULL DO UPDATE SET product_id=EXCLUDED.product_id,price=EXCLUDED.price,currency=EXCLUDED.currency,availability=EXCLUDED.availability,product_url=EXCLUDED.product_url,image_url=EXCLUDED.image_url,raw_metadata=EXCLUDED.raw_metadata,last_seen_at=NOW(),updated_at=NOW()`,
           [productId,store.id,ext,price,currency,availability,text(item.permalink),img,JSON.stringify(item)]);
         seen.add(productId);
       }
       upserted++;
     }catch(e){
       errors++;await pool.query("INSERT INTO market_ingestion_errors(store_id,source_id,sync_run_id,external_product_id,error_code,message,payload) VALUES($1,$2,$3,$4,$5,$6,$7)",[store.id,source.id,runId,String(item.id??item.sku??""),"ITEM_UPSERT_FAILED",e instanceof Error?e.message:"unknown",JSON.stringify(item).slice(0,5000)]);
     }
   }
   await pool.query("UPDATE market_store_sources SET last_status='succeeded',last_completed_at=NOW(),last_error=NULL,last_http_status=200,last_item_count=$1,etag=$2,last_modified=$3,last_content_hash=$4,updated_at=NOW() WHERE id=$5",[discovered,fetched.headers.get("etag"),fetched.headers.get("last-modified"),fetched.hash,source.id]);
   await pool.query("UPDATE market_sync_runs SET status='succeeded',completed_at=NOW(),discovered_count=$1,upserted_count=$2,error_count=$3 WHERE id=$4",[discovered,upserted,errors,runId]);
   await pool.query("UPDATE market_stores SET last_sync_at=NOW(),last_sync_status='succeeded',last_sync_error=NULL,updated_at=NOW() WHERE id=$1",[store.id]);
 }catch(e){
   const msg=e instanceof Error?e.message:String(e);const status=(e as any)?.status??null;
   await pool.query("UPDATE market_store_sources SET last_status='failed',last_completed_at=NOW(),last_error=$1,last_http_status=$2,updated_at=NOW() WHERE id=$3",[msg.slice(0,1000),status,source.id]);
   await pool.query("UPDATE market_sync_runs SET status='failed',completed_at=NOW(),error_count=1,error_summary=$1 WHERE id=$2",[msg.slice(0,1000),runId]);
   await pool.query("UPDATE market_stores SET last_sync_at=NOW(),last_sync_status='failed',last_sync_error=$1,updated_at=NOW() WHERE id=$2",[msg.slice(0,1000),store.id]);
 }
}

async function main(){
 while(true){
   const stores=(await pool.query<Store>(`SELECT id,name,domain,homepage_url,verification_status FROM market_stores WHERE active=true AND verification_status='verified' ORDER BY last_sync_at NULLS FIRST,id LIMIT $1`,[maxStores])).rows;
   for(const store of stores){
     const sources=(await pool.query<Source>("SELECT id,store_id,source_type,endpoint_url,adapter,mapping,etag,last_modified FROM market_store_sources WHERE store_id=$1 AND enabled=true AND endpoint_url IS NOT NULL ORDER BY id",[store.id])).rows;
     for(const source of sources)await syncSource(store,source);
   }
   await new Promise(r=>setTimeout(r,intervalMs));
 }
}
main().catch(async e=>{console.error(e);await pool.end();process.exit(1)});
