import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { WebPage } from "./types";

interface Props { onNavigate: (p: WebPage) => void; }
type Tab="home"|"assistant"|"categories"|"me";
type Product={id:string;title:string;brand:string;description:string;specs:Record<string,unknown>;categorySlug:string;categoryName:string;images:string[];priceMin:number;priceMax:number;storeCount:number;offerCount:number;offers:any[];priceHistory:{price:number;capturedAt:string}[]};
type Category={id:number;slug:string;name:string;name_fa:string;parent_id:number|null};

const env = (import.meta as any).env as Record<string, unknown> | undefined;
const API = String(env?.VITE_MARKET_API_URL ?? env?.VITE_PLATFORM_API_URL ?? "").replace(/\/$/, "");
const token=()=>localStorage.getItem("anpardaz:accessToken")||"";
const auth=()=>token()?{authorization:"Bearer "+token()}:{};
const fa=(v:unknown)=>String(v??"").replace(/\d/g,d=>"۰۱۲۳۴۵۶۷۸۹"[+d]);
const money=(v:number)=>v>0?fa(Math.round(v).toLocaleString("en-US"))+" تومان":"قیمت اعلام نشده";
const vars={"--am-bg":"#F8FAFC","--am-card":"#FFFFFF","--am-text":"#17212B","--am-muted":"#64748B","--am-faint":"#94A3B8","--am-border":"#E2E8F0","--am-accent":"#0891B2","--am-accent2":"#D4A64A","--am-accent-light":"rgba(8,145,178,.09)","--am-accent-border":"rgba(8,145,178,.24)","--am-accent-glow":"rgba(8,145,178,.14)","--am-red":"#DC5252"} as CSSProperties;

function Card({children,style}:{children:ReactNode;style?:CSSProperties}){return <div style={{background:"var(--am-card)",border:"1px solid var(--am-border)",borderRadius:18,boxShadow:"0 2px 12px rgba(10,25,41,.06)",...style}}>{children}</div>}
function Btn({children,onClick,primary=false,disabled=false,style}:{children:ReactNode;onClick?:()=>void;primary?:boolean;disabled?:boolean;style?:CSSProperties}){return <button disabled={disabled} onClick={onClick} style={{border:"1px solid "+(primary?"var(--am-accent)":"var(--am-border)"),background:primary?"var(--am-accent)":"var(--am-card)",color:primary?"#fff":"var(--am-text)",borderRadius:12,padding:"10px 14px",fontFamily:"Vazirmatn",fontWeight:800,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.55:1,...style}}>{children}</button>}
function mapProduct(p:any):Product{const images=[...(p.media||[]).map((m:any)=>m.url).filter(Boolean),...(p.offers||[]).map((o:any)=>o.image_url).filter(Boolean)].slice(0,8);return{id:String(p.id),title:p.title||"",brand:p.brand||"",description:p.description||"",specs:p.specs||{},categorySlug:p.category_slug||"",categoryName:p.category_name_fa||p.category_name||"",images,priceMin:Number(p.priceMin||0),priceMax:Number(p.priceMax||0),storeCount:Number(p.storeCount||0),offerCount:Number(p.offerCount||0),offers:p.offers||[],priceHistory:Array.isArray(p.priceHistory)?p.priceHistory.map((h:any)=>({price:Number(h.price??h.p??0),capturedAt:String(h.capturedAt??h.captured_at??"")})).filter((h:any)=>h.price>0):[]}}

function ProductCard({p,fav,onFav,onOpen,selected,onCompare}:{p:Product;fav:boolean;onFav:()=>void;onOpen:()=>void;selected:boolean;onCompare:()=>void}){
 return <div className="am-product-card-shell">
  <button type="button" onClick={onOpen} className="am-product-card" style={{display:"flex",flexDirection:"column",height:"100%",width:"100%",textAlign:"right",background:"var(--am-card)",border:"1px solid var(--am-border)",padding:0,color:"var(--am-text)",fontFamily:"Vazirmatn",cursor:"pointer"}}>
   <div className="am-product-card-img">{p.images[0]?<img src={p.images[0]} alt={p.title} loading="lazy"/>:<div style={{height:"100%",display:"grid",placeItems:"center",color:"var(--am-faint)",fontSize:38}}>▧</div>}</div>
   <div className="am-product-card-body" style={{flex:1,padding:"10px 12px"}}><div style={{fontSize:11,fontWeight:700,color:"var(--am-accent)"}}>{p.brand||p.categoryName}</div><div style={{fontSize:13,fontWeight:800,lineHeight:1.6,margin:"5px 0 7px",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{p.title}</div><div className="am-price">{money(p.priceMin)}</div><div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--am-muted)",marginTop:6}}><span>{fa(p.storeCount)} فروشگاه</span><span>{fa(p.offerCount)} پیشنهاد</span></div></div>
  </button>
  <div className="am-product-card-actions">
   <button type="button" aria-label={fav?"حذف از علاقه‌مندی‌ها":"افزودن به علاقه‌مندی‌ها"} onClick={onFav} className={fav?"active":""}>{fav?"♥":"♡"}</button>
   <button type="button" onClick={onCompare} className={selected?"active":""}>{selected?"✓ انتخاب شد":"مقایسه"}</button>
  </div>
 </div>
}

function ProductDetail({p,onBack,fav,onFav}:{p:Product;onBack:()=>void;fav:boolean;onFav:()=>void}){
 const [offers,setOffers]=useState<any[]>(p.offers||[]),[priceHistory,setPriceHistory]=useState(p.priceHistory||[]),[reviews,setReviews]=useState<any[]>([]),[reviewBody,setReviewBody]=useState(""),[reviewRating,setReviewRating]=useState(5),[frame,setFrame]=useState(""),[ai,setAi]=useState(""),[aiAnswer,setAiAnswer]=useState(""),[aiError,setAiError]=useState(""),[busy,setBusy]=useState(false),[tab,setTab]=useState<"sellers"|"specs"|"history"|"reviews">("sellers"),[activeImage,setActiveImage]=useState(0);
 useEffect(()=>{fetch(API+"/api/v1/market/products/"+encodeURIComponent(p.id),{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>{if(!d)return;if(Array.isArray(d.offers))setOffers(d.offers);if(Array.isArray(d.priceHistory))setPriceHistory(d.priceHistory.map((h:any)=>({price:Number(h.price??h.p??0),capturedAt:String(h.capturedAt??h.captured_at??"")})).filter((h:any)=>h.price>0));}).catch(()=>{})},[p.id]);
 useEffect(()=>{fetch(API+"/api/v1/market/products/"+encodeURIComponent(p.id)+"/reviews").then(r=>r.ok?r.json():null).then(d=>d&&setReviews(d.reviews||[])).catch(()=>{})},[p.id]);
 useEffect(()=>{if(token())void fetch(API+"/api/v1/market/products/"+encodeURIComponent(p.id)+"/view",{method:"POST",headers:{"content-type":"application/json",...auth()},body:JSON.stringify({surface:"web"})})},[p.id]);
 const click=async(o:any)=>{if(!token())return;try{const r=await fetch(API+"/api/v1/market/clickout",{method:"POST",headers:{"content-type":"application/json",...auth()},body:JSON.stringify({offerId:Number(o.id),surface:"web"})});const d=await r.json();if(!r.ok)throw 0;if(d.mode==="iframe")setFrame(d.url);else window.open(d.url,"_blank","noopener,noreferrer")}catch{}};
 const submitReview=async()=>{if(!token()||reviewBody.trim().length<3)return;setBusy(true);try{const r=await fetch(API+"/api/v1/market/products/"+encodeURIComponent(p.id)+"/reviews",{method:"POST",headers:{"content-type":"application/json",...auth()},body:JSON.stringify({rating:reviewRating,body:reviewBody.trim()})});if(r.ok){setReviewBody("");const d=await fetch(API+"/api/v1/market/products/"+encodeURIComponent(p.id)+"/reviews");if(d.ok)setReviews((await d.json()).reviews||[])}}finally{setBusy(false)}};
 const ask=async()=>{if(!ai.trim())return;if(!token()){setAiError("برای استفاده از دستیار هوشمند ابتدا وارد حساب آن پرداز شوید.");return;}setBusy(true);setAiError("");setAiAnswer("");try{const r=await fetch(API+"/api/v1/market/ai/assist",{method:"POST",headers:{"content-type":"application/json",...auth()},body:JSON.stringify({workflowCode:"market.assist",input:ai.trim(),productId:p.id})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error==="market_ai_unavailable"?"دستیار هوشمند موقتاً در دسترس نیست.":"دریافت پاسخ از دستیار ناموفق بود.");const raw=d.result?.text??d.output?.text??d.output??d.text??"";const answer=typeof raw==="string"?raw:JSON.stringify(raw);if(!answer.trim())throw new Error("پاسخی از دستیار دریافت نشد.");setAiAnswer(answer);}catch(e){setAiError(e instanceof Error?e.message:"خطا در ارتباط با دستیار هوشمند.");}finally{setBusy(false)}};
 return <div className="an-market-root am-product-detail-page" dir="rtl" style={{...vars,minHeight:"100vh",fontFamily:"Vazirmatn,sans-serif",background:"var(--am-bg)",color:"var(--am-text)"}}><div style={{maxWidth:1180,margin:"auto",padding:"0 16px 70px"}}>
  <div className="am-back-row"><button className="am-back-btn" onClick={onBack}>‹</button><div className="am-back-title">جزئیات محصول</div><button className="am-back-btn" onClick={onFav}>{fav?"♥":"♡"}</button></div>
  <Card style={{overflow:"hidden",marginTop:14}}><div className="am-detail-layout">
   <div className="am-detail-gallery"><div className="am-detail-main-image">{p.images[activeImage]?<img src={p.images[activeImage]} alt={p.title+" - تصویر "+(activeImage+1)} />:<span style={{color:"var(--am-muted)"}}>تصویر واقعی موجود نیست</span>}</div>{p.images.length>1&&<div className="am-detail-thumbnails" aria-label="تصاویر محصول">{p.images.map((src,i)=><button type="button" key={src+"-"+i} className={activeImage===i?"active":""} onClick={()=>setActiveImage(i)} aria-label={"نمایش تصویر "+(i+1)}><img src={src} alt="" loading="lazy"/></button>)}</div>}</div>
   <div style={{padding:28}}><div style={{color:"var(--am-accent)",fontWeight:800,fontSize:13}}>{p.brand||p.categoryName}</div><h1 style={{fontSize:24,lineHeight:1.6,margin:"8px 0"}}>{p.title}</h1><p style={{fontSize:13,lineHeight:2,color:"var(--am-muted)"}}>{p.description||"توضیحات واقعی برای این محصول ثبت نشده است."}</p>
    <div className="am-stat-grid" style={{margin:"18px 0"}}>{[["پایین‌ترین قیمت",money(p.priceMin)],["بالاترین قیمت",money(p.priceMax)],["فروشگاه‌ها",fa(p.storeCount)]].map(([a,b])=><div className="am-stat-tile" key={a}><div className="label">{a}</div><div className="value" style={{fontSize:12}}>{b}</div></div>)}</div>
    <div style={{display:"grid",gap:8}}><div style={{display:"flex",gap:8}}><input value={ai} onChange={e=>{setAi(e.target.value);setAiError("");}} onKeyDown={e=>e.key==="Enter"&&void ask()} placeholder="از دستیار درباره این محصول بپرس…" style={{flex:1,minWidth:0,padding:12,borderRadius:12,border:"1px solid var(--am-border)",fontFamily:"Vazirmatn"}}/><Btn primary disabled={busy||!ai.trim()} onClick={()=>void ask()}>{busy?"در حال بررسی…":"از دستیار بپرس"}</Btn></div>{aiError&&<div role="alert" style={{fontSize:12,color:"var(--am-red)"}}>{aiError}</div>}{aiAnswer&&<div role="status" aria-live="polite" style={{padding:13,borderRadius:12,background:"var(--am-accent-light)",border:"1px solid var(--am-accent-border)",fontSize:13,lineHeight:2,whiteSpace:"pre-wrap"}}>{aiAnswer}</div>}</div>
   </div></div>
   <div className="am-detail-tab-bar">{[["sellers","فروشگاه‌ها"],["specs","مشخصات"],["history","تاریخچه قیمت"],["reviews","نظرات کاربران"]].map(([id,l])=><button key={id} className={"am-detail-tab"+(tab===id?" active":"")} onClick={()=>setTab(id as any)}>{l}</button>)}</div>
   {tab==="sellers"&&<div style={{padding:20}}>{offers.length===0?<div style={{padding:30,textAlign:"center",color:"var(--am-muted)"}}>هنوز پیشنهاد واقعی ثبت نشده است.</div>:offers.map(o=><div className="am-seller-card" key={o.id} style={{display:"flex",alignItems:"center",gap:14}}><div style={{flex:1}}><b>{o.store_name||"فروشگاه ثبت‌شده"}</b><div style={{fontSize:11,color:"var(--am-muted)",marginTop:4}}>{o.availability==="out_of_stock"?"ناموجود":"موجود"} · {o.store_domain||""}</div></div><strong style={{color:"var(--am-accent)"}}>{money(Number(o.price||0))}</strong><Btn onClick={()=>void click(o)}>{o.iframe_mode==="allowed"?"مشاهده داخل آن مارکت":"ورود به فروشگاه"}</Btn></div>)}</div>}
    {tab==="reviews"&&<div style={{padding:20}}><div style={{display:"grid",gap:10}}>{reviews.length?reviews.map(r=><div key={r.id} className="am-seller-card"><div style={{display:"flex",justifyContent:"space-between",gap:10}}><b>{r.display_name||"کاربر آن پرداز"}</b><span style={{color:"var(--am-accent)"}}>{"★".repeat(Number(r.rating||0))}</span></div><div style={{fontSize:13,lineHeight:2,marginTop:7}}>{r.body}</div></div>):<div style={{color:"var(--am-muted)"}}>هنوز نظر تأییدشده‌ای ثبت نشده است.</div>}<Card style={{padding:14,marginTop:8}}><b>ثبت نظر</b><div style={{display:"flex",gap:6,marginTop:10}}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setReviewRating(n)} style={{border:"1px solid var(--am-border)",background:n<=reviewRating?"var(--am-accent-light)":"var(--am-card)",borderRadius:9,padding:"6px 9px",color:n<=reviewRating?"var(--am-accent)":"var(--am-muted)"}}>★</button>)}</div><textarea value={reviewBody} onChange={e=>setReviewBody(e.target.value)} placeholder={token()?"نظر واقعی خود را حداقل در ۳ نویسه بنویسید؛ پس از بررسی منتشر می‌شود.":"برای ثبت نظر وارد حساب آن پرداز شوید."} disabled={!token()} style={{width:"100%",boxSizing:"border-box",minHeight:100,marginTop:10,padding:12,borderRadius:12,border:"1px solid var(--am-border)",fontFamily:"Vazirmatn"}}/><Btn primary disabled={!token()||busy||reviewBody.trim().length<3} onClick={()=>void submitReview()} style={{marginTop:9}}>{busy?"در حال ثبت…":"ثبت نظر"}</Btn></Card></div></div>}{tab==="history"&&<div className="am-history-placeholder"><b>تاریخچه تغییرات قیمت</b>{priceHistory.length>1?<><p>نمودار بر اساس نقاط تاریخچه واقعی برگشتی از سرویس محصول ساخته شده است.</p><div className="am-history-chart" role="img" aria-label="نمودار تاریخچه قیمت">{priceHistory.slice(-30).map((h,i,a)=><div className="am-history-point" key={i} title={h.capturedAt+" — "+money(h.price)}><span style={{height:Math.max(5,Math.round(h.price/Math.max(...a.map(x=>x.price))*100))+"%"}}/><small>{h.capturedAt?new Date(h.capturedAt).toLocaleDateString("fa-IR"):""}</small></div>)}</div><div className="am-history-records">{priceHistory.slice(-10).reverse().map((h,i)=><div key={i}><span>{h.capturedAt?new Date(h.capturedAt).toLocaleString("fa-IR"):"تاریخ ثبت نشده"}</span><b>{money(h.price)}</b></div>)}</div></>:<><p>در حال حاضر برای این محصول داده تاریخی کافی از منبع واقعی دریافت نشده است. با اتصال سرویس تاریخچه قیمت، این بخش به‌صورت خودکار تکمیل می‌شود.</p><div className="am-history-empty">هنوز داده تاریخی قابل نمایش وجود ندارد.</div></>}</div>}{tab==="specs"&&<div style={{padding:20}}>{Object.keys(p.specs).length?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:8}}>{Object.entries(p.specs).map(([k,v])=><div className="am-stat-tile" key={k} style={{textAlign:"right"}}><div className="label">{k}</div><div className="value">{String(v)}</div></div>)}</div>:<div style={{color:"var(--am-muted)"}}>مشخصات واقعی ثبت نشده است.</div>}</div>}
  </Card>
 </div>{frame&&<div onClick={()=>setFrame("")} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(2,6,23,.72)",padding:"4vh 4vw"}}><div onClick={e=>e.stopPropagation()} style={{height:"92vh",background:"#fff",borderRadius:18,overflow:"hidden"}}><div style={{height:50,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 14px"}}><b>فروشگاه</b><Btn onClick={()=>setFrame("")}>بستن</Btn></div><iframe src={frame} title="فروشگاه" style={{width:"100%",height:"calc(100% - 50px)",border:0}}/></div></div>}</div>
}

export default function WebMarket({onNavigate:_onNavigate}:Props){
 const [tab,setTab]=useState<Tab>("home");
 const [products,setProducts]=useState<Product[]>([]);
 const [cats,setCats]=useState<Category[]>([]);
 const [search,setSearch]=useState("");
 const [q,setQ]=useState("");
 const [cat,setCat]=useState("all");
 const [selected,setSelected]=useState<Product|null>(null);
 const [favorites,setFavorites]=useState<Set<string>>(new Set());
 const [compare,setCompare]=useState<string[]>([]);
 const [compareCache,setCompareCache]=useState<Record<string,Product>>({});
 const [loading,setLoading]=useState(true);
 const [page,setPage]=useState(1);
 const [hasMore,setHasMore]=useState(false);
 const [error,setError]=useState("");
 const [aiInput,setAiInput]=useState("");
 const [aiAnswer,setAiAnswer]=useState("");
 const [aiBusy,setAiBusy]=useState(false);
 const [meView,setMeView]=useState("menu"); const [meRows,setMeRows]=useState<any[]>([]); const [meLoading,setMeLoading]=useState(false); const [meError,setMeError]=useState("");
 const [alertProduct,setAlertProduct]=useState<Product|null>(null); const [alertPrice,setAlertPrice]=useState("");
 const [compareOpen,setCompareOpen]=useState(false);
 const [compareError,setCompareError]=useState("");
 const [imageSearchNotice,setImageSearchNotice]=useState(false);
 const [supportNotice,setSupportNotice]=useState(false);
 const [supportSubject,setSupportSubject]=useState("");
 const [supportBody,setSupportBody]=useState(""); const [supportBusy,setSupportBusy]=useState(false); const [supportError,setSupportError]=useState("");
 const [selectedTicket,setSelectedTicket]=useState<any|null>(null); const [ticketMessages,setTicketMessages]=useState<any[]>([]); const [ticketReply,setTicketReply]=useState(""); const [ticketBusy,setTicketBusy]=useState(false);
 const load=async()=>{
  setLoading(true);setPage(1);setHasMore(false);setProducts([]);
  try{
   const url=API+"/api/v1/market/catalog?limit=100&page=1"+(search?"&q="+encodeURIComponent(search):"")+(cat!=="all"?"&category="+encodeURIComponent(cat):"");
   const r=await fetch(url,{cache:"no-store"});
   if(!r.ok)throw new Error("catalog");
   const d=await r.json();const rows=Array.isArray(d.products)?d.products:[];
   setProducts(rows.map(mapProduct));setHasMore(rows.length===100);setError("");
  }catch{setProducts([]);setHasMore(false);setError("اطلاعات واقعی آن مارکت در دسترس نیست.");}
  finally{setLoading(false);}
 };
 const loadMore=async()=>{
  if(loading||!hasMore)return;setLoading(true);
  try{
   const next=page+1,url=API+"/api/v1/market/catalog?limit=100&page="+next+(search?"&q="+encodeURIComponent(search):"")+(cat!=="all"?"&category="+encodeURIComponent(cat):"");
   const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error("catalog");
   const d=await r.json();const rows=Array.isArray(d.products)?d.products:[];
   setProducts(current=>[...current,...rows.map(mapProduct)]);setPage(next);setHasMore(rows.length===100);setError("");
  }catch{setError("دریافت ادامه فهرست محصولات ناموفق بود.");setHasMore(false);}
  finally{setLoading(false);}
 };
 useEffect(()=>{void load();},[search,cat]);
 useEffect(()=>{
  void fetch(API+"/api/v1/market/categories",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>{if(d)setCats(d.categories||[]);}).catch(()=>{});
  if(token()){
   void fetch(API+"/api/v1/market/me/favorites",{headers:auth()}).then(r=>r.ok?r.json():null).then(d=>{if(d)setFavorites(new Set((d.products||[]).map((x:any)=>String(x.id))));}).catch(()=>{});
  }
 },[]);
 useEffect(()=>{
  document.title=selected?(`${selected.title} | آن مارکت`):"آن مارکت";
  return ()=>{document.title="آن مارکت";};
 },[selected]);
 const roots=cats.filter(c=>!c.parent_id);
 const activeCategory=cats.find(c=>c.slug===cat)||null;
 const childCategories=activeCategory?cats.filter(c=>c.parent_id===activeCategory.id):[];
 const comparedProducts=compare.map(id=>products.find(p=>p.id===id)||compareCache[id]).filter(Boolean) as Product[];
 const parentCategory=activeCategory?.parent_id?cats.find(c=>c.id===activeCategory.parent_id):null;
 const siblingCategories=parentCategory?cats.filter(c=>c.parent_id===parentCategory.id):roots;
 const loadMe=async(view:string)=>{
  setMeView(view);setMeLoading(true);setMeError("");
  const paths:Record<string,string>={favorites:"/api/v1/market/me/favorites",recent:"/api/v1/market/me/recent",alerts:"/api/v1/market/me/alerts",clickouts:"/api/v1/market/me/clickouts",comparisons:"/api/v1/market/me/comparisons",searches:"/api/v1/market/me/search-history",tickets:"/api/v1/market/me/tickets"};
  try{if(!token())throw new Error("برای مشاهده اطلاعات حساب، ابتدا وارد حساب آن پرداز شوید.");const r=await fetch(API+paths[view],{headers:auth(),cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error("دریافت اطلاعات حساب ناموفق بود.");const key=view==="favorites"||view==="recent"?"products":view;setMeRows(Array.isArray(d[key])?d[key]:[]);}catch(e){setMeRows([]);setMeError(e instanceof Error?e.message:"خطا در دریافت اطلاعات.");}finally{setMeLoading(false);}
 };
 const openTicket=async(ticket:any)=>{
  if(!token())return;
  setTicketBusy(true);setMeError("");
  try{const r=await fetch(API+"/api/v1/market/me/tickets/"+encodeURIComponent(String(ticket.id)),{headers:auth(),cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error("دریافت جزئیات تیکت ناموفق بود.");setSelectedTicket(d.ticket||ticket);setTicketMessages(Array.isArray(d.messages)?d.messages:[]);setTicketReply("");}
  catch(e){setMeError(e instanceof Error?e.message:"خطا در دریافت تیکت.");}
  finally{setTicketBusy(false);}
 };
 const sendTicketReply=async()=>{
  if(!selectedTicket||!ticketReply.trim()||ticketBusy||selectedTicket.status==="closed")return;
  setTicketBusy(true);setMeError("");
  try{const r=await fetch(API+"/api/v1/market/me/tickets/"+encodeURIComponent(String(selectedTicket.id))+"/messages",{method:"POST",headers:{"content-type":"application/json",...auth()},body:JSON.stringify({message:ticketReply.trim()})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error==="ticket_closed"?"این تیکت بسته شده است.":"ارسال پاسخ تیکت ناموفق بود.");setTicketReply("");await openTicket(selectedTicket);void loadMe("tickets");}
  catch(e){setMeError(e instanceof Error?e.message:"ارسال پاسخ انجام نشد.");}
  finally{setTicketBusy(false);}
 };
 const submitSupportTicket=async()=>{
   if(!token()){setSupportError("برای ثبت درخواست ابتدا وارد حساب آن پرداز شوید.");return;}
   if(supportSubject.trim().length<3||supportBody.trim().length<10){setSupportError("عنوان حداقل ۳ و شرح درخواست حداقل ۱۰ نویسه باشد.");return;}
   setSupportBusy(true);setSupportError("");
   try{const r=await fetch(API+"/api/v1/market/tickets",{method:"POST",headers:{"content-type":"application/json",...auth()},body:JSON.stringify({subject:supportSubject.trim(),message:supportBody.trim(),priority:"normal"})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"ثبت تیکت ناموفق بود.");setSupportNotice(false);setSupportSubject("");setSupportBody("");setMeView("tickets");setTab("me");void loadMe("tickets");}catch(e){setSupportError(e instanceof Error?e.message:"خطا در ثبت تیکت.");}finally{setSupportBusy(false);}
  };
  const submitPriceAlert=async()=>{
  if(!alertProduct||!token())return;const target=Number(alertPrice);if(!Number.isFinite(target)||target<=0)return;
  try{const r=await fetch(API+"/api/v1/market/me/alerts",{method:"POST",headers:{"content-type":"application/json",...auth()},body:JSON.stringify({productId:Number(alertProduct.id),targetPrice:target})});if(!r.ok)throw new Error();setAlertProduct(null);setAlertPrice("");void loadMe("alerts");setTab("me");}catch{setMeError("ثبت هشدار قیمت انجام نشد.");}
 };

 const toggleFav=async(id:string)=>{
  if(!token())return;
  const r=await fetch(API+"/api/v1/market/products/"+encodeURIComponent(id)+"/favorite",{method:"POST",headers:auth()});
  if(r.ok){const d=await r.json();setFavorites(s=>{const n=new Set(s);d.favorite?n.add(id):n.delete(id);return n;});}
 };
 const compareToggle=(id:string)=>{
  const removing=compare.includes(id);
  const next=removing?compare.filter(i=>i!==id):compare.length<6?[...compare,id]:compare;
  if(next.length===compare.length&&next.includes(id)===compare.includes(id)){setCompareError("حداکثر ۶ محصول را می‌توانید هم‌زمان مقایسه کنید.");return;}
  if(removing)setCompareCache(current=>{const copy={...current};delete copy[id];return copy;});
  else{const product=products.find(p=>p.id===id);if(product)setCompareCache(current=>({...current,[id]:product}));}
  setCompareError("");setCompare(next);
  if(next.length>=2&&token())fetch(API+"/api/v1/market/me/comparisons",{method:"POST",headers:{"content-type":"application/json",...auth()},body:JSON.stringify({productIds:next,title:"مقایسه آن مارکت"})}).catch(()=>{});
 };
 const runAi=async()=>{
  if(!aiInput.trim()||!token())return;
  setAiBusy(true);
  try{
   const r=await fetch(API+"/api/v1/market/ai/assist",{method:"POST",headers:{"content-type":"application/json",...auth()},body:JSON.stringify({workflowCode:compare.length>1?"market.compare":"market.assist",input:aiInput.trim(),compareIds:compare})});
   const d=await r.json();
   setAiAnswer(d.output?.text||d.output||"پاسخی دریافت نشد.");
  }catch{setAiAnswer("ارتباط با دستیار برقرار نشد.");}
  finally{setAiBusy(false);}
 };
 if(selected)return <ProductDetail p={selected} onBack={()=>setSelected(null)} fav={favorites.has(selected.id)} onFav={()=>void toggleFav(selected.id)}/>;
 return <div className="an-market-root" dir="rtl" style={vars}>
  <div className="am-header">
   <div className="am-header-inner" style={{padding:"18px 16px 14px",maxWidth:1280,margin:"auto"}}>
    <div className="am-brand-row" style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
     <div style={{width:44,height:44,borderRadius:14,background:"var(--am-accent)",display:"grid",placeItems:"center",color:"#fff",fontSize:22}}>⌂</div>
     <div style={{flex:1}}><div style={{fontSize:20,fontWeight:900}}>آن مارکت</div><div style={{fontSize:11,color:"var(--am-muted)",marginTop:3}}>مقایسه قیمت از فروشگاه‌های واقعی</div></div>
     <div style={{fontSize:11,fontWeight:800,color:"var(--am-accent)",background:"var(--am-accent-light)",padding:"9px 12px",borderRadius:12}}>{fa(roots.length)} دسته اصلی</div>
    </div>
    <div className="am-search-hero">
     <div style={{display:"flex",alignItems:"center",gap:8}}>
      <button type="button" className="am-image-search" onClick={()=>setImageSearchNotice(true)} aria-label="جستجوی تصویری" title="جستجوی تصویری">▧</button>
      <span style={{fontSize:20,color:"var(--am-muted)"}}>⌕</span>
      <input className="am-home-search" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&setSearch(q.trim())} placeholder="جستجو در محصولات واقعی…"/>
      <Btn primary onClick={()=>setSearch(q.trim())}>جستجو</Btn>
     </div>
    </div>
   </div>
   <div className="am-tabs">
    <button className={"am-tab"+(tab==="home"?" active":"")} onClick={()=>setTab("home")}>خانه</button>
    <button className={"am-tab"+(tab==="assistant"?" active":"")} onClick={()=>setTab("assistant")}>دستیار هوشمند</button>
    <button className={"am-tab"+(tab==="categories"?" active":"")} onClick={()=>setTab("categories")}>دسته‌بندی‌ها</button>
    <button className={"am-tab"+(tab==="me"?" active":"")} onClick={()=>setTab("me")}>آن مارکت من</button>
   </div>
  </div>
  {tab==="home"&&<div>
   <div className="am-category-strip" style={{display:"flex",overflowX:"auto",gap:8,padding:"14px 16px 8px"}}>
    {roots.map(c=><button key={c.id} className="am-cat-chip" onClick={()=>setCat(c.slug)}><span className="am-cat-chip-label">{c.name_fa}</span></button>)}
   </div>
   <div className="am-compare-bar" style={{margin:"6px 16px 14px",border:"1px solid var(--am-accent-border)",borderRadius:16}}>
    <button className={"am-compare-btn"+(compare.length>0?" active":"")} onClick={()=>setCompareOpen(true)}><span>▦</span>{compare.length>1?"مشاهده مقایسه":"انتخاب محصولات برای مقایسه"}{compare.length>0&&<span>{fa(compare.length)} محصول</span>}</button>
   </div>
   {compareError&&<div role="alert" style={{maxWidth:1240,margin:"0 auto 10px",padding:"8px 14px",color:"var(--am-red)",fontSize:12,fontWeight:700}}>{compareError}</div>}
   <div className="am-content" style={{padding:"0 16px 14px"}}>
    {activeCategory&&<section className="am-subcategory-block"><div className="am-subcategory-heading"><b>{parentCategory?`زیر‌دسته‌های ${parentCategory.name_fa}`:`زیر‌دسته‌های ${activeCategory.name_fa}`}</b><button onClick={()=>setCat(parentCategory?.slug||"all")}>بازگشت به {parentCategory?.name_fa||"همه دسته‌ها"}</button></div><div className="am-subcategory-list">{(parentCategory?siblingCategories:childCategories).map(c=><button key={c.id} className={"am-cat-chip"+(cat===c.slug?" active":"")} onClick={()=>setCat(c.slug)}>{c.name_fa}</button>)}</div></section>}
    {loading?<Card style={{padding:60,textAlign:"center",color:"var(--am-muted)"}}>در حال دریافت محصولات واقعی…</Card>:error?<Card style={{padding:60,textAlign:"center",color:"#DC2626"}}>{error}</Card>:products.length===0?<Card style={{padding:60,textAlign:"center",color:"var(--am-muted)"}}>هنوز محصول واقعی در دیتابیس ثبت نشده است؛ بعد از اتصال فید فروشگاه‌ها این بخش خودکار پر می‌شود.</Card>:<><div className="am-product-grid">{products.map(p=><div key={p.id} className="am-product-grid-item"><ProductCard p={p} fav={favorites.has(p.id)} onFav={()=>void toggleFav(p.id)} onOpen={()=>setSelected(p)} selected={compare.includes(p.id)} onCompare={()=>compareToggle(p.id)}/><button className="am-alert-link" onClick={()=>{setAlertProduct(p);setAlertPrice(p.priceMin>0?String(p.priceMin):"");}}>＋ هشدار قیمت</button></div>)}</div>{hasMore&&<div style={{display:"flex",justifyContent:"center",padding:"18px 0 28px"}}><Btn primary disabled={loading} onClick={()=>void loadMore()}>{loading?"در حال دریافت…":"نمایش محصولات بیشتر"}</Btn></div>}</>}
   </div>
  </div>}
  {tab==="assistant"&&<div style={{padding:16,maxWidth:980,margin:"auto"}}><Card><div className="am-search-head"><div className="am-ai-avatar">✦</div><div><b>دستیار هوشمند آن مارکت</b><div style={{fontSize:11,color:"var(--am-muted)"}}>بر پایه داده‌های واقعی آن مارکت</div></div></div><div style={{padding:18}}>{compare.length>1&&<div style={{color:"var(--am-accent)",fontSize:12,fontWeight:800,marginBottom:10}}>{fa(compare.length)} محصول برای مقایسه انتخاب شده است.</div>}<textarea value={aiInput} onChange={e=>setAiInput(e.target.value)} placeholder={compare.length>1?"تفاوت این محصولات را بر اساس داده‌های واقعی مقایسه کن…":"درباره محصولات آن مارکت سؤال بپرس…"} style={{width:"100%",boxSizing:"border-box",minHeight:150,padding:14,borderRadius:14,border:"1.5px solid var(--am-border)",fontFamily:"Vazirmatn"}}/><Btn primary disabled={aiBusy||!token()} onClick={()=>void runAi()} style={{marginTop:10}}>{aiBusy?"در حال بررسی…":"ارسال به دستیار"}</Btn>{aiAnswer&&<div className="am-bubble-ai" style={{marginTop:16}}>{aiAnswer}</div>}</div></Card></div>}
  {tab==="categories"&&<div className="am-category-tree">{roots.map(c=><section className="am-category-tree-card" key={c.id}><button className="am-cat-row" onClick={()=>{setCat(c.slug);setTab("home")}}><span className="am-cat-row-icon">⌂</span><span style={{flex:1}}><b>{c.name_fa}</b><small style={{display:"block",color:"var(--am-muted)",marginTop:5}}>{cats.filter(x=>x.parent_id===c.id).length?fa(cats.filter(x=>x.parent_id===c.id).length)+" زیر‌دسته":"مشاهده محصولات این دسته"}</small></span><span>‹</span></button>{cats.filter(x=>x.parent_id===c.id).map(child=><div className="am-category-tree-child" key={child.id}><button onClick={()=>{setCat(child.slug);setTab("home")}}>{child.name_fa}</button>{cats.filter(x=>x.parent_id===child.id).map(grand=><button className="am-category-tree-grandchild" key={grand.id} onClick={()=>{setCat(grand.slug);setTab("home")}}>{grand.name_fa}</button>)}</div>)}</section>)}</div>}
  {tab==="me"&&<div style={{padding:16,maxWidth:980,margin:"auto"}}>
 <div className="am-sh"><div className="am-sh-title">آن مارکت من</div>{meView!=="menu"&&<button className="am-sh-action" onClick={()=>{setMeView("menu");setSelectedTicket(null);setTicketMessages([]);setMeError("");}}>بازگشت</button>}</div>
 {meView==="menu"?<div className="am-account-grid">{([["favorites","علاقه‌مندی‌ها"],["recent","اخیراً مشاهده‌شده"],["alerts","هشدارهای قیمت"],["clickouts","فعالیت خرید"],["comparisons","مقایسه‌های من"],["searches","تاریخچه جستجو"],["tickets","پشتیبانی و تیکت"]] as const).map(([v,t])=><button key={v} className="am-me-btn" onClick={()=>v==="tickets"?void loadMe("tickets"):void loadMe(v)}><span className="am-me-icon">◈</span><b>{t}</b><span style={{marginRight:"auto"}}>‹</span></button>)}</div>:meView==="tickets"?<div>
  <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}><Btn primary onClick={()=>{setSupportError("");setSupportNotice(true);}}>＋ ثبت تیکت جدید</Btn></div>
  {selectedTicket?<Card style={{padding:16,marginBottom:12}}>
   <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><b style={{flex:1}}>{selectedTicket.subject}</b><span style={{fontSize:11,color:"var(--am-muted)"}}>#{fa(selectedTicket.id)} · {selectedTicket.status==="closed"?"بسته":"باز"}</span><Btn onClick={()=>{setSelectedTicket(null);setTicketMessages([]);setTicketReply("");}}>بازگشت به فهرست</Btn></div>
   <div style={{display:"grid",gap:9,marginBottom:14}}>{ticketMessages.map((m:any,i:number)=><div key={m.id??i} style={{justifySelf:m.author_type==="user"?"start":"end",maxWidth:"88%",padding:12,borderRadius:13,background:m.author_type==="user"?"var(--am-accent-light)":"var(--am-card)",border:"1px solid var(--am-border)",whiteSpace:"pre-wrap",lineHeight:1.9}}>{m.message}<div style={{fontSize:10,color:"var(--am-muted)",marginTop:5}}>{m.created_at?new Date(m.created_at).toLocaleString("fa-IR"):""}</div></div>)}</div>
   {selectedTicket.status!=="closed"?<><textarea value={ticketReply} onChange={e=>setTicketReply(e.target.value)} rows={3} placeholder="پاسخ شما..." style={{width:"100%",boxSizing:"border-box",padding:12,borderRadius:12,border:"1px solid var(--am-border)",fontFamily:"Vazirmatn",resize:"vertical"}}/><Btn primary disabled={ticketBusy||ticketReply.trim().length<1} onClick={()=>void sendTicketReply()} style={{marginTop:8}}>{ticketBusy?"در حال ارسال…":"ارسال پاسخ"}</Btn></>:<div style={{color:"var(--am-muted)",fontSize:12}}>این تیکت بسته شده و امکان ارسال پاسخ ندارد.</div>}
  </Card>:ticketBusy?<Card style={{padding:24,textAlign:"center"}}>در حال دریافت تیکت…</Card>:meLoading?<Card style={{padding:24,textAlign:"center"}}>در حال دریافت اطلاعات واقعی…</Card>:meError?<Card style={{padding:16,color:"#B4534B"}}>{meError}</Card>:meRows.length===0?<Card style={{padding:28,textAlign:"center",color:"var(--am-muted)"}}>هنوز تیکتی ثبت نشده است.</Card>:meRows.map((it:any,i:number)=><button key={it.id??i} onClick={()=>void openTicket(it)} style={{width:"100%",textAlign:"right",background:"var(--am-card)",border:"1px solid var(--am-border)",borderRadius:14,padding:14,marginBottom:9,fontFamily:"Vazirmatn",cursor:"pointer"}}><b>{it.subject||"تیکت پشتیبانی"}</b><div style={{fontSize:11,color:"var(--am-muted)",marginTop:6}}>#{fa(it.id)} · {it.status==="closed"?"بسته":"باز"} · {it.updated_at?new Date(it.updated_at).toLocaleString("fa-IR"):""}</div></button>)}
 </div>:meLoading?<Card style={{padding:32,textAlign:"center"}}>در حال دریافت اطلاعات واقعی…</Card>:meError?<Card style={{padding:20,color:"#B4534B"}}>{meError}</Card>:meRows.length===0?<Card style={{padding:32,textAlign:"center",color:"var(--am-muted)"}}>هنوز داده‌ای برای این بخش ثبت نشده است.</Card>:meRows.map((it:any,i:number)=><Card key={it.id??i} style={{padding:14,marginBottom:9}}><b>{it.title??it.product_title??it.query_text??it.query??it.store_name??it.subject??(meView==="comparisons"?"مقایسه ذخیره‌شده": "فعالیت ثبت‌شده")}</b><div style={{fontSize:11,color:"var(--am-muted)",marginTop:6}}>{it.created_at??it.updated_at??it.last_searched??it.status??""}</div>{meView==="alerts"&&<div style={{fontSize:12,marginTop:6}}>قیمت هدف: {money(Number(it.target_price??it.targetPrice??0))}</div>}{meView==="tickets"&&<div style={{fontSize:12,marginTop:6,color:"var(--am-muted)"}}>وضعیت: {it.status||"ثبت‌شده"} · اولویت: {it.priority||"عادی"}</div>}{meView==="comparisons"&&<div style={{fontSize:12,marginTop:8,color:"var(--am-muted)"}}>شناسه محصولات: {(Array.isArray(it.items)?it.items.map((x:any)=>x.productId):[]).join("، ")||"محصولی در این مقایسه ثبت نشده است"}</div>}{meView==="searches"&&<div style={{fontSize:12,marginTop:6}}>تعداد نتیجه: {fa(it.result_count??0)} · سطح: {it.surface||"ثبت نشده"}</div>}{meView==="tickets"&&<div style={{fontSize:12,marginTop:6}}>وضعیت درخواست: {it.status||"ثبت‌شده"}</div>}</Card>)}
 </div>}
 {compareOpen&&<div className="am-alert-overlay" onClick={()=>setCompareOpen(false)}><section className="am-compare-dialog" onClick={e=>e.stopPropagation()}><div className="am-dialog-head"><b>مقایسه محصولات</b><div style={{display:"flex",gap:8}}>{compare.length>0&&<button type="button" onClick={()=>{setCompare([]);setCompareCache({});setCompareError("");}}>پاک‌کردن انتخاب‌ها</button>}<button type="button" onClick={()=>setCompareOpen(false)} aria-label="بستن">×</button></div></div>{compare.length<2?<><p>برای مقایسه، حداقل دو محصول را از کارت‌ها انتخاب کنید.</p><div className="am-compare-selected">{comparedProducts.map(p=><div key={p.id}><span>{p.title}</span><button onClick={()=>compareToggle(p.id)}>حذف</button></div>)}</div></>:<div className="am-compare-table-wrap"><table className="am-compare-table"><thead><tr><th>ویژگی</th>{comparedProducts.map(p=><th key={p.id}>{p.title}</th>)}</tr></thead><tbody>{[["برند",(p:Product)=>p.brand||"ثبت نشده"],["دسته‌بندی",(p:Product)=>p.categoryName||"ثبت نشده"],["کمترین قیمت",(p:Product)=>money(p.priceMin)],["بیشترین قیمت",(p:Product)=>money(p.priceMax)],["تعداد فروشگاه",(p:Product)=>fa(p.storeCount)],["تعداد پیشنهاد",(p:Product)=>fa(p.offerCount)]].map((row:any)=><tr key={row.label||row[0]}><th>{row.label||row[0]}</th>{comparedProducts.map(p=><td key={p.id}>{(row.get||row[1])(p)}</td>)}</tr>)}</tbody></table><p className="am-compare-note">مقایسه بر اساس اطلاعات موجود هر محصول است؛ مشخصات فنی تفصیلی در صفحه محصول قابل مشاهده است.</p></div>}<div className="am-dialog-actions"><Btn onClick={()=>{setCompareOpen(false);setTab("home")}}>بازگشت به محصولات</Btn><Btn primary onClick={()=>{setCompareOpen(false);setTab("assistant")}} disabled={compare.length<2}>پرسش از دستیار درباره مقایسه</Btn></div></section></div>}
 {imageSearchNotice&&<div className="am-alert-overlay" onClick={()=>setImageSearchNotice(false)}><section className="am-alert-dialog" onClick={e=>e.stopPropagation()}><b>جستجوی تصویری</b><p>این قابلیت در نسخه موبایل نیز هنوز به سرویس پردازش تصویر متصل نشده است. برای جلوگیری از نمایش نتیجه ساختگی، فعلاً جستجوی متنی را استفاده کنید.</p><Btn primary onClick={()=>setImageSearchNotice(false)}>متوجه شدم</Btn></section></div>}
 {supportNotice&&<div className="am-alert-overlay" onClick={()=>setSupportNotice(false)}><section className="am-alert-dialog am-support-dialog" onClick={e=>e.stopPropagation()}><b>پشتیبانی آن مارکت</b><p>درخواست شما در سامانه پشتیبانی آن مارکت ثبت می‌شود و از بخش «پشتیبانی و تیکت» قابل پیگیری است.</p><label>عنوان</label><input value={supportSubject} onChange={e=>setSupportSubject(e.target.value)} placeholder="عنوان درخواست"/><label>شرح درخواست</label><textarea value={supportBody} onChange={e=>setSupportBody(e.target.value)} placeholder="توضیحات کامل درخواست را بنویسید…" rows={5}/>{supportError&&<div role="alert" style={{color:"var(--am-red)",fontSize:12}}>{supportError}</div>}<div className="am-dialog-actions"><Btn onClick={()=>setSupportNotice(false)}>بستن</Btn><Btn primary disabled={supportBusy||!token()||supportSubject.trim().length<3||supportBody.trim().length<10} onClick={()=>void submitSupportTicket()}>{supportBusy?"در حال ثبت…":"ثبت درخواست"}</Btn></div>{!token()&&<small>برای ثبت درخواست ابتدا وارد حساب شوید.</small>}</section></div>}
 {alertProduct&&<div className="am-alert-overlay" onClick={()=>setAlertProduct(null)}><div className="am-alert-dialog" onClick={e=>e.stopPropagation()}><b>هشدار قیمت</b><p>{alertProduct.title}</p><label>مبلغ هدف (تومان)</label><input type="number" min="1" value={alertPrice} onChange={e=>setAlertPrice(e.target.value)}/><div style={{display:"flex",gap:8,marginTop:14}}><Btn primary disabled={!token()||!Number(alertPrice)} onClick={()=>void submitPriceAlert()}>ثبت هشدار</Btn><Btn onClick={()=>setAlertProduct(null)}>انصراف</Btn></div>{!token()&&<small>برای ثبت هشدار وارد حساب شوید.</small>}</div></div>}
 </div>;
}
