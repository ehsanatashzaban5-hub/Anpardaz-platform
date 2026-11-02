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
const vars={"--am-bg":"#F3F8F7","--am-card":"#FFFFFF","--am-text":"#102B2A","--am-muted":"#526B69","--am-faint":"#829895","--am-border":"#D8E6E2","--am-accent":"#087F73","--am-accent2":"#C69A3A","--am-accent-light":"rgba(8,127,115,.10)","--am-accent-border":"rgba(8,127,115,.25)","--am-accent-glow":"rgba(8,127,115,.16)","--am-red":"#B4534B"} as CSSProperties;

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
 const [offers,setOffers]=useState<any[]>(p.offers||[]),[priceHistory,setPriceHistory]=useState(p.priceHistory||[]),[reviews,setReviews]=useState<any[]>([]),[reviewBody,setReviewBody]=useState(""),[reviewRating,setReviewRating]=useState(5),[frame,setFrame]=useState(""),[ai,setAi]=useState(""),[busy,setBusy]=useState(false),[tab,setTab]=useState<"sellers"|"specs"|"history"|"reviews">("sellers"),[activeImage,setActiveImage]=useState(0);
 useEffect(()=>{fetch(API+"/api/v1/market/products/"+encodeURIComponent(p.id),{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>{if(!d)return;if(Array.isArray(d.offers))setOffers(d.offers);if(Array.isArray(d.priceHistory))setPriceHistory(d.priceHistory.map((h:any)=>({price:Number(h.price??h.p??0),capturedAt:String(h.capturedAt??h.captured_at??"")})).filter((h:any)=>h.price>0));}).catch(()=>{})},[p.id]);
 useEffect(()=>{fetch(API+"/api/v1/market/products/"+encodeURIComponent(p.id)+"/reviews").then(r=>r.ok?r.json():null).then(d=>d&&setReviews(d.reviews||[])).catch(()=>{})},[p.id]);
 useEffect(()=>{if(token())void fetch(API+"/api/v1/market/products/"+encodeURIComponent(p.id)+"/view",{method:"POST",headers:{"content-type":"application/json",...auth()},body:JSON.stringify({surface:"web"})})},[p.id]);
 const click=async(o:any)=>{if(!token())return;try{const r=await fetch(API+"/api/v1/market/clickout",{method:"POST",headers:{"content-type":"application/json",...auth()},body:JSON.stringify({offerId:Number(o.id),surface:"web"})});const d=await r.json();if(!r.ok)throw 0;if(d.mode==="iframe")setFrame(d.url);else window.open(d.url,"_blank","noopener,noreferrer")}catch{}};
 const submitReview=async()=>{if(!token()||reviewBody.trim().length<2)return;setBusy(true);try{const r=await fetch(API+"/api/v1/market/products/"+encodeURIComponent(p.id)+"/reviews",{method:"POST",headers:{"content-type":"application/json",...auth()},body:JSON.stringify({rating:reviewRating,body:reviewBody.trim()})});if(r.ok){setReviewBody("");const d=await fetch(API+"/api/v1/market/products/"+encodeURIComponent(p.id)+"/reviews");if(d.ok)setReviews((await d.json()).reviews||[])}}finally{setBusy(false)}};
 const ask=async()=>{if(!ai.trim()||!token())return;setBusy(true);try{const r=await fetch(API+"/api/v1/market/ai/assist",{method:"POST",headers:{"content-type":"application/json",...auth()},body:JSON.stringify({workflowCode:"market.assist",input:ai.trim(),productId:p.id})});const d=await r.json();window.alert(d.output?.text||d.output||"پاسخی دریافت نشد.")}finally{setBusy(false)}};
 return <div className="an-market-root am-product-detail-page" dir="rtl" style={{...vars,minHeight:"100vh",fontFamily:"Vazirmatn,sans-serif",background:"var(--am-bg)",color:"var(--am-text)"}}><div style={{maxWidth:1180,margin:"auto",padding:"0 16px 70px"}}>
  <div className="am-back-row"><button className="am-back-btn" onClick={onBack}>‹</button><div className="am-back-title">جزئیات محصول</div><button className="am-back-btn" onClick={onFav}>{fav?"♥":"♡"}</button></div>
  <Card style={{overflow:"hidden",marginTop:14}}><div className="am-detail-layout">
   <div className="am-detail-gallery"><div className="am-detail-main-image">{p.images[activeImage]?<img src={p.images[activeImage]} alt={p.title+" - تصویر "+(activeImage+1)} />:<span style={{color:"var(--am-muted)"}}>تصویر واقعی موجود نیست</span>}</div>{p.images.length>1&&<div className="am-detail-thumbnails" aria-label="تصاویر محصول">{p.images.map((src,i)=><button type="button" key={src+"-"+i} className={activeImage===i?"active":""} onClick={()=>setActiveImage(i)} aria-label={"نمایش تصویر "+(i+1)}><img src={src} alt="" loading="lazy"/></button>)}</div>}</div>
   <div style={{padding:28}}><div style={{color:"var(--am-accent)",fontWeight:800,fontSize:13}}>{p.brand||p.categoryName}</div><h1 style={{fontSize:24,lineHeight:1.6,margin:"8px 0"}}>{p.title}</h1><p style={{fontSize:13,lineHeight:2,color:"var(--am-muted)"}}>{p.description||"توضیحات واقعی برای این محصول ثبت نشده است."}</p>
    <div className="am-stat-grid" style={{margin:"18px 0"}}>{[["پایین‌ترین قیمت",money(p.priceMin)],["بالاترین قیمت",money(p.priceMax)],["فروشگاه‌ها",fa(p.storeCount)]].map(([a,b])=><div className="am-stat-tile" key={a}><div className="label">{a}</div><div className="value" style={{fontSize:12}}>{b}</div></div>)}</div>
    <div style={{display:"flex",gap:8}}><input value={ai} onChange={e=>setAi(e.target.value)} onKeyDown={e=>e.key==="Enter"&&void ask()} placeholder="از دستیار درباره این محصول بپرس…" style={{flex:1,padding:12,borderRadius:12,border:"1px solid var(--am-border)",fontFamily:"Vazirmatn"}}/><Btn primary disabled={busy||!token()} onClick={()=>void ask()}>{busy?"…":"از دستیار بپرس"}</Btn></div>
   </div></div>
   <div className="am-detail-tab-bar">{[["sellers","فروشگاه‌ها"],["specs","مشخصات"],["history","تاریخچه قیمت"],["reviews","نظرات کاربران"]].map(([id,l])=><button key={id} className={"am-detail-tab"+(tab===id?" active":"")} onClick={()=>setTab(id as any)}>{l}</button>)}</div>
   {tab==="sellers"&&<div style={{padding:20}}>{offers.length===0?<div style={{padding:30,textAlign:"center",color:"var(--am-muted)"}}>هنوز پیشنهاد واقعی ثبت نشده است.</div>:offers.map(o=><div className="am-seller-card" key={o.id} style={{display:"flex",alignItems:"center",gap:14}}><div style={{flex:1}}><b>{o.store_name||"فروشگاه ثبت‌شده"}</b><div style={{fontSize:11,color:"var(--am-muted)",marginTop:4}}>{o.availability==="out_of_stock"?"ناموجود":"موجود"} · {o.store_domain||""}</div></div><strong style={{color:"var(--am-accent)"}}>{money(Number(o.price||0))}</strong><Btn onClick={()=>void click(o)}>{o.iframe_mode==="allowed"?"مشاهده داخل آن مارکت":"ورود به فروشگاه"}</Btn></div>)}</div>}
    {tab==="reviews"&&<div style={{padding:20}}><div style={{display:"grid",gap:10}}>{reviews.length?reviews.map(r=><div key={r.id} className="am-seller-card"><div style={{display:"flex",justifyContent:"space-between",gap:10}}><b>{r.display_name||"کاربر آن پرداز"}</b><span style={{color:"var(--am-accent)"}}>{"★".repeat(Number(r.rating||0))}</span></div><div style={{fontSize:13,lineHeight:2,marginTop:7}}>{r.body}</div></div>):<div style={{color:"var(--am-muted)"}}>هنوز نظر تأییدشده‌ای ثبت نشده است.</div>}<Card style={{padding:14,marginTop:8}}><b>ثبت نظر</b><div style={{display:"flex",gap:6,marginTop:10}}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setReviewRating(n)} style={{border:"1px solid var(--am-border)",background:n<=reviewRating?"var(--am-accent-light)":"var(--am-card)",borderRadius:9,padding:"6px 9px",color:n<=reviewRating?"var(--am-accent)":"var(--am-muted)"}}>★</button>)}</div><textarea value={reviewBody} onChange={e=>setReviewBody(e.target.value)} placeholder={token()?"نظر واقعی خود را بنویسید؛ پس از بررسی منتشر می‌شود.":"برای ثبت نظر وارد حساب آن پرداز شوید."} disabled={!token()} style={{width:"100%",boxSizing:"border-box",minHeight:100,marginTop:10,padding:12,borderRadius:12,border:"1px solid var(--am-border)",fontFamily:"Vazirmatn"}}/><Btn primary disabled={!token()||busy||reviewBody.trim().length<2} onClick={()=>void submitReview()} style={{marginTop:9}}>{busy?"در حال ثبت…":"ثبت نظر"}</Btn></Card></div></div>}{tab==="history"&&<div className="am-history-placeholder"><b>تاریخچه تغییرات قیمت</b>{priceHistory.length>1?<><p>نمودار بر اساس نقاط تاریخچه واقعی برگشتی از سرویس محصول ساخته شده است.</p><div className="am-history-chart" role="img" aria-label="نمودار تاریخچه قیمت">{priceHistory.slice(-30).map((h,i,a)=><div className="am-history-point" key={i} title={h.capturedAt+" — "+money(h.price)}><span style={{height:Math.max(5,Math.round(h.price/Math.max(...a.map(x=>x.price))*100))+"%"}}/><small>{h.capturedAt?new Date(h.capturedAt).toLocaleDateString("fa-IR"):""}</small></div>)}</div><div className="am-history-records">{priceHistory.slice(-10).reverse().map((h,i)=><div key={i}><span>{h.capturedAt?new Date(h.capturedAt).toLocaleString("fa-IR"):"تاریخ ثبت نشده"}</span><b>{money(h.price)}</b></div>)}</div></>:<><p>در حال حاضر برای این محصول داده تاریخی کافی از منبع واقعی دریافت نشده است. با اتصال سرویس تاریخچه قیمت، این بخش به‌صورت خودکار تکمیل می‌شود.</p><div className="am-history-empty">هنوز داده تاریخی قابل نمایش وجود ندارد.</div></>}</div>}{tab==="specs"&&<div style={{padding:20}}>{Object.keys(p.specs).length?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:8}}>{Object.entries(p.specs).map(([k,v])=><div className="am-stat-tile" key={k} style={{textAlign:"right"}}><div className="label">{k}</div><div className="value">{String(v)}</div></div>)}</div>:<div style={{color:"var(--am-muted)"}}>مشخصات واقعی ثبت نشده است.</div>}</div>}
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
 const [home,setHome]=useState<any>(null);
 const [loading,setLoading]=useState(true);
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
 const [supportCategory,setSupportCategory]=useState("product");
 const [supportSubject,setSupportSubject]=useState("");
 const [supportBody,setSupportBody]=useState("");
 const load=async()=>{
  setLoading(true);
  try{
   const url=API+"/api/v1/market/catalog?limit=100"+(search?"&q="+encodeURIComponent(search):"")+(cat!=="all"?"&category="+encodeURIComponent(cat):"");
   const r=await fetch(url,{cache:"no-store"});
   if(!r.ok)throw new Error("catalog");
   const d=await r.json();
   setProducts((d.products||[]).map(mapProduct));
   setError("");
  }catch{setProducts([]);setError("اطلاعات واقعی آن مارکت در دسترس نیست.");}
  finally{setLoading(false);}
 };
 useEffect(()=>{void load();},[search,cat]);
 useEffect(()=>{fetch(API+"/api/v1/market/home?limit=12",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(setHome).catch(()=>{});},[]);
 useEffect(()=>{
  void fetch(API+"/api/v1/market/categories",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>{if(d)setCats(d.categories||[]);}).catch(()=>{});
  if(token()){
   void fetch(API+"/api/v1/market/me/favorites",{headers:auth()}).then(r=>r.ok?r.json():null).then(d=>{if(d)setFavorites(new Set((d.products||[]).map((x:any)=>String(x.id))));}).catch(()=>{});
  }
 },[]);
 useEffect(()=>{
  if(selected)fetch(API+"/api/v1/market/seo?type=product&id="+encodeURIComponent(selected.id)).then(r=>r.ok?r.json():null).then(d=>{
   if(!d?.seo)return;
   document.title=d.seo.title||"آن مارکت";
  }).catch(()=>{});
 },[selected]);
 const roots=cats.filter(c=>!c.parent_id);
 const activeCategory=cats.find(c=>c.slug===cat)||null;
 const childCategories=activeCategory?cats.filter(c=>c.parent_id===activeCategory.id):[];
 const comparedProducts=compare.map(id=>products.find(p=>p.id===id)).filter(Boolean) as Product[];
 const parentCategory=activeCategory?.parent_id?cats.find(c=>c.id===activeCategory.parent_id):null;
 const siblingCategories=parentCategory?cats.filter(c=>c.parent_id===parentCategory.id):roots;
 const loadMe=async(view:string)=>{
  setMeView(view);setMeLoading(true);setMeError("");
  const paths:Record<string,string>={favorites:"/api/v1/market/me/favorites",recent:"/api/v1/market/me/recent",alerts:"/api/v1/market/me/alerts",clickouts:"/api/v1/market/me/clickouts",comparisons:"/api/v1/market/me/comparisons",searches:"/api/v1/market/me/search-history",tickets:"/api/v1/market/me/tickets"};
  try{if(!token())throw new Error("برای مشاهده اطلاعات حساب، ابتدا وارد حساب آن پرداز شوید.");const r=await fetch(API+paths[view],{headers:auth(),cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error("دریافت اطلاعات حساب ناموفق بود.");const key=view==="favorites"||view==="recent"?"products":view;setMeRows(Array.isArray(d[key])?d[key]:[]);}catch(e){setMeRows([]);setMeError(e instanceof Error?e.message:"خطا در دریافت اطلاعات.");}finally{setMeLoading(false);}
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
  const next=compare.includes(id)?compare.filter(i=>i!==id):compare.length<6?[...compare,id]:compare;
  if(next.length===compare.length&&next.includes(id)===compare.includes(id)){setCompareError("حداکثر ۶ محصول را می‌توانید هم‌زمان مقایسه کنید.");return;}
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
   <div className="am-content" style={{padding:"0 16px 14px"}}>
    {(home?.sections||[]).filter((s:any)=>s.section_type==="products").slice(0,3).map((s:any)=><Card key={s.key} style={{padding:14,marginBottom:12}}><b>{s.title}</b><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:8,marginTop:10}}>{(home?.products||[]).filter((p:any)=>!s.product_ids?.length||s.product_ids.map(String).includes(String(p.id))).slice(0,4).map((p:any)=><button key={p.id} onClick={()=>setSelected(mapProduct(p))} style={{border:"1px solid var(--am-border)",background:"var(--am-card)",borderRadius:12,padding:10,textAlign:"right",fontFamily:"Vazirmatn"}}><div style={{fontSize:11,fontWeight:800}}>{p.title}</div><div style={{fontSize:10,color:"var(--am-accent)",marginTop:5}}>{p.price_min>0?money(Number(p.price_min)):"قیمت اعلام نشده"}</div></button>)}</div></Card>)}
    {activeCategory&&<section className="am-subcategory-block"><div className="am-subcategory-heading"><b>{parentCategory?`زیر‌دسته‌های ${parentCategory.name_fa}`:`زیر‌دسته‌های ${activeCategory.name_fa}`}</b><button onClick={()=>setCat(parentCategory?.slug||"all")}>بازگشت به {parentCategory?.name_fa||"همه دسته‌ها"}</button></div><div className="am-subcategory-list">{(parentCategory?siblingCategories:childCategories).map(c=><button key={c.id} className={"am-cat-chip"+(cat===c.slug?" active":"")} onClick={()=>setCat(c.slug)}>{c.name_fa}</button>)}</div></section>}
    {loading?<Card style={{padding:60,textAlign:"center",color:"var(--am-muted)"}}>در حال دریافت محصولات واقعی…</Card>:error?<Card style={{padding:60,textAlign:"center",color:"#DC2626"}}>{error}</Card>:products.length===0?<Card style={{padding:60,textAlign:"center",color:"var(--am-muted)"}}>هنوز محصول واقعی در دیتابیس ثبت نشده است؛ بعد از اتصال فید فروشگاه‌ها این بخش خودکار پر می‌شود.</Card>:<div className="am-product-grid">{products.map(p=><div key={p.id} className="am-product-grid-item"><ProductCard p={p} fav={favorites.has(p.id)} onFav={()=>void toggleFav(p.id)} onOpen={()=>setSelected(p)} selected={compare.includes(p.id)} onCompare={()=>compareToggle(p.id)}/><button className="am-alert-link" onClick={()=>{setAlertProduct(p);setAlertPrice(p.priceMin>0?String(p.priceMin):"");}}>＋ هشدار قیمت</button></div>)}</div>}
   </div>
  </div>}
  {tab==="assistant"&&<div style={{padding:16,maxWidth:980,margin:"auto"}}><Card><div className="am-search-head"><div className="am-ai-avatar">✦</div><div><b>دستیار هوشمند آن مارکت</b><div style={{fontSize:11,color:"var(--am-muted)"}}>بر پایه داده‌های واقعی آن مارکت</div></div></div><div style={{padding:18}}>{compare.length>1&&<div style={{color:"var(--am-accent)",fontSize:12,fontWeight:800,marginBottom:10}}>{fa(compare.length)} محصول برای مقایسه انتخاب شده است.</div>}<textarea value={aiInput} onChange={e=>setAiInput(e.target.value)} placeholder={compare.length>1?"تفاوت این محصولات را بر اساس داده‌های واقعی مقایسه کن…":"درباره محصولات آن مارکت سؤال بپرس…"} style={{width:"100%",boxSizing:"border-box",minHeight:150,padding:14,borderRadius:14,border:"1.5px solid var(--am-border)",fontFamily:"Vazirmatn"}}/><Btn primary disabled={aiBusy||!token()} onClick={()=>void runAi()} style={{marginTop:10}}>{aiBusy?"در حال بررسی…":"ارسال به دستیار"}</Btn>{aiAnswer&&<div className="am-bubble-ai" style={{marginTop:16}}>{aiAnswer}</div>}</div></Card></div>}
  {tab==="categories"&&<div className="am-category-tree">{roots.map(c=><section className="am-category-tree-card" key={c.id}><button className="am-cat-row" onClick={()=>{setCat(c.slug);setTab("home")}}><span className="am-cat-row-icon">⌂</span><span style={{flex:1}}><b>{c.name_fa}</b><small style={{display:"block",color:"var(--am-muted)",marginTop:5}}>{cats.filter(x=>x.parent_id===c.id).length?fa(cats.filter(x=>x.parent_id===c.id).length)+" زیر‌دسته":"مشاهده محصولات این دسته"}</small></span><span>‹</span></button>{cats.filter(x=>x.parent_id===c.id).map(child=><div className="am-category-tree-child" key={child.id}><button onClick={()=>{setCat(child.slug);setTab("home")}}>{child.name_fa}</button>{cats.filter(x=>x.parent_id===child.id).map(grand=><button className="am-category-tree-grandchild" key={grand.id} onClick={()=>{setCat(grand.slug);setTab("home")}}>{grand.name_fa}</button>)}</div>)}</section>)}</div>}
  {tab==="me"&&<div style={{padding:16,maxWidth:980,margin:"auto"}}>
 <div className="am-sh"><div className="am-sh-title">آن مارکت من</div>{meView!=="menu"&&<button className="am-sh-action" onClick={()=>setMeView("menu")}>بازگشت</button>}</div>
 {meView==="menu"?<div className="am-account-grid">{([["favorites","علاقه‌مندی‌ها"],["recent","اخیراً مشاهده‌شده"],["alerts","هشدارهای قیمت"],["clickouts","فعالیت خرید"],["comparisons","مقایسه‌های من"],["searches","تاریخچه جستجو"],["tickets","پشتیبانی و تیکت"]] as const).map(([v,t])=><button key={v} className="am-me-btn" onClick={()=>v==="tickets"?setSupportNotice(true):void loadMe(v)}><span className="am-me-icon">◈</span><b>{t}</b><span style={{marginRight:"auto"}}>‹</span></button>)}</div>:meLoading?<Card style={{padding:32,textAlign:"center"}}>در حال دریافت اطلاعات واقعی…</Card>:meError?<Card style={{padding:20,color:"#B4534B"}}>{meError}</Card>:meRows.length===0?<Card style={{padding:32,textAlign:"center",color:"var(--am-muted)"}}>هنوز داده‌ای برای این بخش ثبت نشده است.</Card>:meRows.map((it:any,i:number)=><Card key={it.id??i} style={{padding:14,marginBottom:9}}><b>{it.title??it.product_title??it.query_text??it.query??it.store_name??it.subject??(meView==="comparisons"?"مقایسه ذخیره‌شده": "فعالیت ثبت‌شده")}</b><div style={{fontSize:11,color:"var(--am-muted)",marginTop:6}}>{it.created_at??it.updated_at??it.last_searched??it.status??""}</div>{meView==="alerts"&&<div style={{fontSize:12,marginTop:6}}>قیمت هدف: {money(Number(it.target_price??it.targetPrice??0))}</div>}{meView==="comparisons"&&<div style={{fontSize:12,marginTop:8,color:"var(--am-muted)"}}>شناسه محصولات: {(Array.isArray(it.items)?it.items.map((x:any)=>x.productId):[]).join("، ")||"محصولی در این مقایسه ثبت نشده است"}</div>}{meView==="searches"&&<div style={{fontSize:12,marginTop:6}}>تعداد نتیجه: {fa(it.result_count??0)} · سطح: {it.surface||"ثبت نشده"}</div>}{meView==="tickets"&&<div style={{fontSize:12,marginTop:6}}>وضعیت درخواست: {it.status||"ثبت‌شده"}</div>}</Card>)}
 </div>}
 {compareOpen&&<div className="am-alert-overlay" onClick={()=>setCompareOpen(false)}><section className="am-compare-dialog" onClick={e=>e.stopPropagation()}><div className="am-dialog-head"><b>مقایسه محصولات</b><div style={{display:"flex",gap:8}}>{compare.length>0&&<button type="button" onClick={()=>{setCompare([]);setCompareError("");}}>پاک‌کردن انتخاب‌ها</button>}<button type="button" onClick={()=>setCompareOpen(false)} aria-label="بستن">×</button></div></div>{compare.length<2?<><p>برای مقایسه، حداقل دو محصول را از کارت‌ها انتخاب کنید.</p><div className="am-compare-selected">{comparedProducts.map(p=><div key={p.id}><span>{p.title}</span><button onClick={()=>compareToggle(p.id)}>حذف</button></div>)}</div></>:<div className="am-compare-table-wrap"><table className="am-compare-table"><thead><tr><th>ویژگی</th>{comparedProducts.map(p=><th key={p.id}>{p.title}</th>)}</tr></thead><tbody>{[["برند",p=>p.brand||"ثبت نشده"],["دسته‌بندی",p=>p.categoryName||"ثبت نشده"],["کمترین قیمت",p=>money(p.priceMin)],["بیشترین قیمت",p=>money(p.priceMax)],["تعداد فروشگاه",p=>fa(p.storeCount)],["تعداد پیشنهاد",p=>fa(p.offerCount)],...Array.from(new Set(comparedProducts.flatMap(p=>Object.keys(p.specs||{})))).map(k=>[k,p=>p.specs?.[k]===undefined||p.specs?.[k]===null||p.specs?.[k]===""?"ثبت نشده":String(p.specs[k])])].map(([label,get]:any)=><tr key={label}><th>{label}</th>{comparedProducts.map(p=><td key={p.id}>{get(p)}</td>)}</tr>)}</tbody></table><p className="am-compare-note">مقایسه بر اساس اطلاعات موجود هر محصول است؛ مشخصات فنی تفصیلی در صفحه محصول قابل مشاهده است.</p></div>}<div className="am-dialog-actions"><Btn onClick={()=>{setCompareOpen(false);setTab("home")}}>بازگشت به محصولات</Btn><Btn primary onClick={()=>{setCompareOpen(false);setTab("assistant")}} disabled={compare.length<2}>پرسش از دستیار درباره مقایسه</Btn></div></section></div>}
 {imageSearchNotice&&<div className="am-alert-overlay" onClick={()=>setImageSearchNotice(false)}><section className="am-alert-dialog" onClick={e=>e.stopPropagation()}><b>جستجوی تصویری</b><p>این قابلیت در نسخه موبایل نیز هنوز به سرویس پردازش تصویر متصل نشده است. برای جلوگیری از نمایش نتیجه ساختگی، فعلاً جستجوی متنی را استفاده کنید.</p><Btn primary onClick={()=>setImageSearchNotice(false)}>متوجه شدم</Btn></section></div>}
 {supportNotice&&<div className="am-alert-overlay" onClick={()=>setSupportNotice(false)}><section className="am-alert-dialog am-support-dialog" onClick={e=>e.stopPropagation()}><b>پشتیبانی آن مارکت</b><p>فرم و دسته‌بندی درخواست آماده است؛ ثبت و پیگیری تیکت پس از اتصال سرویس پشتیبانی فعال خواهد شد.</p><label>موضوع درخواست</label><select value={supportCategory} onChange={e=>setSupportCategory(e.target.value)}><option value="product">محصول و مشخصات</option><option value="price">قیمت و فروشگاه</option><option value="order">پیگیری خرید</option><option value="account">حساب کاربری</option><option value="technical">مشکل فنی</option><option value="other">سایر موارد</option></select><label>عنوان</label><input value={supportSubject} onChange={e=>setSupportSubject(e.target.value)} placeholder="عنوان درخواست"/><label>شرح درخواست</label><textarea value={supportBody} onChange={e=>setSupportBody(e.target.value)} placeholder="توضیحات کامل درخواست را بنویسید…" rows={5}/><div className="am-support-pending">ثبت تیکت تا اتصال API پشتیبانی غیرفعال است؛ اطلاعات این فرم هنوز ارسال یا ذخیره نمی‌شود.</div><div className="am-dialog-actions"><Btn onClick={()=>setSupportNotice(false)}>بستن</Btn><Btn primary disabled={!token()||supportSubject.trim().length<3||supportBody.trim().length<10}>ارسال درخواست (پس از اتصال)</Btn></div></section></div>}
 {alertProduct&&<div className="am-alert-overlay" onClick={()=>setAlertProduct(null)}><div className="am-alert-dialog" onClick={e=>e.stopPropagation()}><b>هشدار قیمت</b><p>{alertProduct.title}</p><label>مبلغ هدف (تومان)</label><input type="number" min="1" value={alertPrice} onChange={e=>setAlertPrice(e.target.value)}/><div style={{display:"flex",gap:8,marginTop:14}}><Btn primary disabled={!token()||!Number(alertPrice)} onClick={()=>void submitPriceAlert()}>ثبت هشدار</Btn><Btn onClick={()=>setAlertProduct(null)}>انصراف</Btn></div>{!token()&&<small>برای ثبت هشدار وارد حساب شوید.</small>}</div></div>}
 </div>;
}
