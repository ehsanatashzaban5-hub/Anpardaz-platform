import {createHash} from 'node:crypto';

function required(name:string){const v=process.env[name]?.trim();if(!v)throw new Error(name+'_not_configured');return v;}
function endpoint(name:string,code:string){const raw=required(name);let map:Record<string,unknown>;try{map=JSON.parse(raw) as Record<string,unknown>}catch{throw new Error(name+'_invalid')};const v=map[code];if(typeof v!=='string'||!v.trim())throw new Error(name+'_endpoint_not_configured:'+code);return v.trim();}
function authHeaders(){const key=required('FINTECH_API_KEY');const h:Record<string,string>={accept:'application/json'};const scheme=process.env.FINTECH_AUTH_SCHEME?.trim();if(scheme)h.authorization=`${scheme} ${key}`;else h[process.env.FINTECH_API_KEY_HEADER?.trim()||'x-api-key']=key;return h;}
function base(){return required('FINTECH_API_BASE_URL').replace(/\/$/,'');}
function resolve(path:string,operationId:string){return path.replace(/\{operationId\}/g,encodeURIComponent(operationId));}
export async function fetchServiceCatalog(serviceCode:string,query:Record<string,string>){
 const url=new URL(resolve(endpoint('FINTECH_CATALOG_ENDPOINTS_JSON',serviceCode),'CATALOG-'+serviceCode),base());
 for(const [k,v] of Object.entries(query))if(v)url.searchParams.set(k,v);
 const r=await fetch(url,{headers:authHeaders(),signal:AbortSignal.timeout(Number(process.env.FINTECH_REQUEST_TIMEOUT_MS??15000))});
 const raw=await r.text();let data:any={};try{data=raw?JSON.parse(raw):{};}catch{data={raw:raw.slice(0,1000)};}
 if(!r.ok)throw new Error(`FINTECH_CATALOG_HTTP_${r.status}`);
 return data;
}
export async function serviceInquiry(serviceCode:string,payload:Record<string,unknown>){
 const operationId='INQUIRY-'+createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0,24);
 const url=new URL(resolve(endpoint('FINTECH_INQUIRY_ENDPOINTS_JSON',serviceCode),operationId),base());
 const h=authHeaders();h['content-type']='application/json';h['x-anpardaz-operation-id']=operationId;
 const r=await fetch(url,{method:'POST',headers:h,body:JSON.stringify(payload),signal:AbortSignal.timeout(Number(process.env.FINTECH_REQUEST_TIMEOUT_MS??15000))});
 const raw=await r.text();let data:any={};try{data=raw?JSON.parse(raw):{};}catch{data={raw:raw.slice(0,1000)};}
 if(!r.ok)throw new Error(`FINTECH_INQUIRY_HTTP_${r.status}`);
 return data;
}
