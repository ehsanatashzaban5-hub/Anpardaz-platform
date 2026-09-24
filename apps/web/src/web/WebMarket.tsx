import { useEffect, useMemo, useState } from "react";
import type { WebPage } from "./types";

interface Props { onNavigate: (p: WebPage) => void; }
type Tab = "home"|"assistant"|"categories"|"me";
type Product = {
  id:string; title:string; brand:string; description:string; specs:Record<string,unknown>;
  categorySlug:string; categoryName:string; images:string[]; priceMin:number; priceMax:number;
  storeCount:number; offerCount:number; offers:any[];
};
type Category = {id:number;slug:string;name:string;name_fa:string;parent_id:number|null;icon?:string|null};

const API=((import.meta as any).env?.VITE_PLATFORM_API_URL as string|undefined)?.replace(/\/$/,"")||"";
const fa=(v:unknown)=>String(v??"").replace(/\d/g,d=>"۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
const money=(v:number)=>v>0?fa(Math.round(v).toLocaleString("en-US"))+" تومان":"قیمت اعلام نشده";
const token=()=>localStorage.getItem("anpardaz:accessToken")||"";
const auth=()=>token()?{authorization:"Bearer "+token()}:{};
const icon=(name:string,size=20)=>({name,size});

function Card({children,style}:{children:React.ReactNode;style?:React.CSSProperties}){
  return <div style={{background:"var(--am-card,#fff)",border:"1px solid var(--am-border,#e5e7eb)",borderRadius:18,boxShadow:"0 8px 28px rgba(15,23,42,.05)",...style}}>{children}</div>;
}
function Btn({children,onClick,active=false,primary=false,disabled=false}:{children:React.ReactNode;onClick?:()=>void;active?:boolean;primary?:boolean;disabled?:boolean}){
  return <button disabled={disabled} onClick={onClick} style={{border:"1px solid "+(primary||active?"#0a9e8c":"var(--am-border,#e5e7eb)"),background:primary?"#0a9e8c":active?"rgba(10,158,140,.09)":"var(--am-bg,#f8fafc)",color:primary?"#fff":active?"#087d70":"var(--am-text,#172033)",borderRadius:12,padding:"10px 14px",fontFamily:"Vazirmatn",fontWeight:800,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.55:1}}>{children}</button>;
}
function ProductCard({p,fav,onFav,onOpen,onCompare,selected}:{p:Product;fav:boolean;onFav:()=>void;onOpen:()=>void;onCompare:()=>void;selected:boolean}){
  return <Card style={{overflow:"hidden",height:"100%",display:"flex",flexDirection:"column"}}>
    <div style={{position:"relative",aspectRatio:"1.15",background:"var(--am-bg,#f8fafc)",cursor:"pointer"}} onClick={onOpen}>
      {p.images[0]?<img src={p.images[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/>:<div style={{height:"100%",display:"grid",placeItems:"center",color:"var(--am-muted,#94a3b8)",fontSize:42}}>▧</div>}
      <button aria-label="علاقه‌مندی" onClick={e=>{e.stopPropagation();onFav()}} style={{position:"absolute",top:10,left:10,width:36,height:36,borderRadius:11,border:"1px solid rgba(255,255,255,.8)",background:"rgba(255,255,255,.9)",color:fav?"#db2777":"#64748b",fontSize:19,cursor:"pointer"}}>{fav?"♥":"♡"}</button>
      <button onClick={e=>{e.stopPropagation();onCompare()}} style={{position:"absolute",top:10,right:10,border:"1px solid rgba(255,255,255,.8)",background:selected?"#0a9e8c":"rgba(255,255,255,.92)",color:selected?"#fff":"#334155",borderRadius:10,padding:"6px 9px",fontFamily:"Vazirmatn",fontSize:10,fontWeight:800,cursor:"pointer"}}>{selected?"✓ مقایسه":"مقایسه"}</button>
    </div>
    <div style={{padding:14,display:"flex",flexDirection:"column",gap:7,flex:1}}>
      <div style={{fontSize:11,color:"#0a9e8c",fontWeight:800}}>{p.brand||p.categoryName}</div>
      <div onClick={onOpen} style={{fontSize:14,fontWeight:900,lineHeight:1.65,cursor:"pointer"}}>{p.title}</div>
      <div style={{fontSize:11,color:"var(--am-muted,#64748b)"}}>{fa(p.storeCount)} فروشگاه · {fa(p.offerCount)} پیشنهاد</div>
      <div style={{marginTop:"auto",fontSize:16,fontWeight:900,color:"#0a9e8c"}}>{money(p.priceMin)}</div>
    </div>
  </Card>;
}
function ProductDetail({p,onBack,onFav,fav}:{p:Product;onBack:()=>void;onFav:()=>void;fav:boolean}){
  const [offers,setOffers]=useState<any[]>(p.offers||[]);
  const [frame,setFrame]=useState("");
  const [ai,setAi]=useState("");
  const [busy,setBusy]=useState(false);
  useEffect(()=>{if(offers.length)return;(async()=>{const r=await fetch(API+"/api/v1/market/products/"+p.id);if(r.ok){const d=await r.json();setOffers(d.offers||[])}})()},[p.id]);
  const openOffer=async(o:any)=>{try{const r=await fetch(API+"/api/v1/market/clickout",{method:"POST",headers:{"content-type":"application/json",...auth()},body:JSON.stringify({offerId:Number(o.id),surface:"web"})});const d=await r.json();if(!r.ok)throw new Error();if(d.mode==="iframe")setFrame(d.url);else window.open(d.url,"_blank","noopener,noreferrer")}catch{}};
  const ask=async()=>{if(!ai.trim())return;setBusy(true);try{const r=await fetch(API+"/api/v1/market/ai/assist",{method:"POST",headers:{"content-type":"application/json",...auth()},body:JSON.stringify({workflowCode:"market.assist",input:ai.trim(),productId:p.id})});const d=await r.json();alert(d.output?.text||d.output||"پاسخ دستیار آماده نشد.");}finally{setBusy(false)}};
  useEffect(()=>{if(token())void fetch(API+"/api/v1/market/products/"+p.id+"/view",{method:"POST",headers:{"content-type":"application/json",...auth()},body:JSON.stringify({surface:"web"})})},[p.id]);
  return <div dir="rtl" style={{maxWidth:1180,margin:"0 auto",padding:22}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><Btn onClick={onBack}>← بازگشت</Btn><Btn onClick={onFav}>{fav?"♥ حذف از علاقه‌مندی":"♡ افزودن به علاقه‌مندی"}</Btn></div>
    <Card style={{padding:22}}>
      <div style={{display:"grid",gridTemplateColumns:"minmax(0,1.1fr) minmax(320px,.9fr)",gap:26}}>
        <div><div style={{aspectRatio:"1.15",background:"var(--am-bg,#f8fafc)",borderRadius:16,overflow:"hidden"}}>{p.images[0]?<img src={p.images[0]} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:<div style={{height:"100%",display:"grid",placeItems:"center"}}>تصویر موجود نیست</div>}</div></div>
        <div><div style={{color:"#0a9e8c",fontWeight:800,fontSize:12}}>{p.brand}</div><h1 style={{fontSize:25,lineHeight:1.55,margin:"6px 0 12px"}}>{p.title}</h1><div style={{fontSize:13,color:"var(--am-muted,#64748b)",lineHeight:2}}>{p.description||"توضیحات محصول از منبع واقعی فروشگاه دریافت نشده است."}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,margin:"18px 0"}}>{[["کمترین قیمت",money(p.priceMin)],["بیشترین قیمت",money(p.priceMax)],["فروشگاه‌ها",fa(p.storeCount)]].map(x=><div key={x[0]} style={{padding:12,borderRadius:12,background:"var(--am-bg,#f8fafc)",border:"1px solid var(--am-border,#e5e7eb)"}}><div style={{fontSize:10,color:"var(--am-muted,#64748b)"}}>{x[0]}</div><b style={{display:"block",marginTop:5,fontSize:12}}>{x[1]}</b></div>)}</div>
          <div style={{display:"flex",gap:8}}><input value={ai} onChange={e=>setAi(e.target.value)} onKeyDown={e=>e.key==="Enter"&&void ask()} placeholder="از دستیار درباره این محصول بپرس…" style={{flex:1,padding:"11px 13px",borderRadius:12,border:"1px solid var(--am-border,#e5e7eb)",fontFamily:"Vazirmatn",direction:"rtl"}}/><Btn primary disabled={busy} onClick={()=>void ask()}>{busy?"…":"از دستیار بپرس"}</Btn></div>
        </div>
      </div>
      <div style={{marginTop:28}}><h3>فروشگاه‌ها و قیمت‌های واقعی</h3>{offers.length===0?<div style={{padding:22,color:"var(--am-muted,#64748b)"}}>برای این محصول هنوز پیشنهاد فروشگاهی ثبت نشده است.</div>:offers.map(o=><div key={o.id} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 0",borderBottom:"1px solid var(--am-border,#e5e7eb)"}}><div style={{flex:1}}><b>{o.store_name||"فروشگاه"}</b><div style={{fontSize:11,color:"var(--am-muted,#64748b)",marginTop:3}}>{o.availability==="out_of_stock"?"ناموجود":"موجود"} · {o.store_domain||""}</div></div><strong>{money(Number(o.price||0))}</strong><Btn onClick={()=>void openOffer(o)}>{o.iframe_mode==="allowed"?"مشاهده داخل آن مارکت":"ورود به فروشگاه"}</Btn></div>)}</div>
    </Card>
    {frame&&<div onClick={()=>setFrame("")} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(2,6,23,.7)",padding:"4vh 4vw"}}><div onClick={e=>e.stopPropagation()} style={{height:"92vh",background:"#fff",borderRadius:18,overflow:"hidden"}}><div style={{height:48,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 14px"}}><b>فروشگاه</b><Btn onClick={()=>setFrame("")}>بستن</Btn></div><iframe src={frame} title="store" style={{width:"100%",height:"calc(100% - 48px)",border:0}}/></div></div>}
  </div>;
}
export default function WebMarket({onNavigate:_onNavigate}:Props){
  const [tab,setTab]=useState<Tab>("home"),[products,setProducts]=useState<Product[]>([]),[cats,setCats]=useState<Category[]>([]);
  const [query,setQuery]=useState(""),[search,setSearch]=useState(""),[cat,setCat]=useState("all"),[selected,setSelected]=useState<Product|null>(null);
  const [favorites,setFavorites]=useState<Set<string>>(new Set()),[compare,setCompare]=useState<string[]>([]);
  const [loading,setLoading]=useState(true),[error,setError]=useState("");
  const [me,setMe]=useState<any>({}),[ticket,setTicket]=useState(""),[ticketList,setTicketList]=useState<any[]>([]);
  const load=async()=>{setLoading(true);try{const url=API+"/api/v1/market/catalog?limit=100"+(search?"&q="+encodeURIComponent(search):"")+(cat!=="all"?"&category="+encodeURIComponent(cat):"");const r=await fetch(url);if(!r.ok)throw new Error();const d=await r.json();setProducts((d.products||[]).map((p:any)=>({id:String(p.id),title:p.title||"",brand:p.brand||"",description:p.description||"",specs:p.specs||{},categorySlug:p.category_slug||"",categoryName:p.category_name_fa||p.category_name||"",images:(p.media||[]).map((m:any)=>m.url).filter(Boolean).concat((p.offers||[]).map((o:any)=>o.image_url).filter(Boolean)).slice(0,8),priceMin:Number(p.priceMin||0),priceMax:Number(p.priceMax||0),storeCount:Number(p.storeCount||0),offerCount:Number(p.offerCount||0),offers:p.offers||[]})));setError("")}catch{setProducts([]);setError("اطلاعات واقعی آن مارکت در دسترس نیست.")}finally{setLoading(false)}};
  useEffect(()=>{void load()},[search,cat]);
  useEffect(()=>{(async()=>{try{const [c,f]=await Promise.all([fetch(API+"/api/v1/market/categories"),token()?fetch(API+"/api/v1/market/me/favorites",{headers:auth()}):Promise.resolve(null)]);if(c.ok)setCats((await c.json()).categories||[]);if(f&&f.ok){const d=await f.json();setFavorites(new Set((d.products||[]).map((x:any)=>String(x.id))))}}catch{}})()},[]);
  useEffect(()=>{if(tab==="me"&&token())void fetch(API+"/api/v1/market/me/tickets",{headers:auth()}).then(r=>r.ok?r.json():null).then(d=>d&&setTicketList(d.tickets||[]))},[tab]);
  const roots=cats.filter(c=>!c.parent_id);
  const visible=useMemo(()=>products,[products]);
  const toggleFav=async(id:string)=>{if(!token())return;const r=await fetch(API+"/api/v1/market/products/"+id+"/favorite",{method:"POST",headers:auth()});if(r.ok){const d=await r.json();setFavorites(s=>{const n=new Set(s);d.favorite?n.add(id):n.delete(id);return n})}};
  const nav=(t:Tab)=><button onClick={()=>setTab(t)} style={{flex:1,padding:"11px 8px",borderRadius:12,border:"1px solid "+(tab===t?"#0a9e8c":"var(--am-border,#e5e7eb)"),background:tab===t?"rgba(10,158,140,.09)":"transparent",color:tab===t?"#087d70":"var(--am-muted,#64748b)",fontFamily:"Vazirmatn",fontWeight:900}}>{t==="home"?"خانه":t==="assistant"?"دستیار هوشمند":t==="categories"?"دسته‌بندی‌ها":"آن مارکت من"}</button>;
  if(selected)return <ProductDetail p={selected} onBack={()=>setSelected(null)} fav={favorites.has(selected.id)} onFav={()=>void toggleFav(selected.id)}/>;
  return <div className="an-market-root" dir="rtl" style={{minHeight:"100%",background:"var(--am-bg,#f8fafc)",color:"var(--am-text,#172033)",fontFamily:"Vazirmatn"}}>
    <div style={{maxWidth:1280,margin:"0 auto",padding:"18px 22px 70px"}}>
      <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,marginBottom:14}}><div><div style={{fontSize:25,fontWeight:950}}>آن مارکت</div><div style={{fontSize:12,color:"var(--am-muted,#64748b)",marginTop:4}}>مقایسه هوشمند محصولات و پیشنهادهای واقعی فروشگاه‌ها</div></div><div style={{display:"flex",gap:8}}><Btn>تعداد فروشگاه‌ها: {fa(roots.length? "": "")}</Btn></div></header>
      <div style={{display:"flex",gap:8,marginBottom:16}}>{nav("home")}{nav("assistant")}{nav("categories")}{nav("me")}</div>
      {tab==="home"&&<><div style={{display:"flex",gap:8,marginBottom:16}}><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&setSearch(query.trim())} placeholder="جستجوی محصول، برند یا مدل…" style={{flex:1,padding:"13px 16px",borderRadius:14,border:"1px solid var(--am-border,#e5e7eb)",background:"var(--am-card,#fff)",fontFamily:"Vazirmatn",fontSize:13}}/><Btn primary onClick={()=>setSearch(query.trim())}>جستجو</Btn></div>
        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:18}}><Btn active={cat==="all"} onClick={()=>setCat("all")}>همه</Btn>{roots.map(c=><Btn key={c.id} active={cat===c.slug} onClick={()=>setCat(c.slug)}>{c.name_fa}</Btn>)}</div>
        {loading?<div style={{padding:60,textAlign:"center"}}>در حال دریافت محصولات واقعی…</div>:error?<div style={{padding:60,textAlign:"center",color:"#dc2626"}}>{error}</div>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:14}}>{visible.map(p=><ProductCard key={p.id} p={p} fav={favorites.has(p.id)} onFav={()=>void toggleFav(p.id)} onOpen={()=>setSelected(p)} selected={compare.includes(p.id)} onCompare={()=>setCompare(x=>x.includes(p.id)?x.filter(i=>i!==p.id):x.length<6?[...x,p.id]:x)}/>)}</div>}
        {compare.length>1&&<div style={{position:"fixed",bottom:18,right:18,left:18,zIndex:20}}><Card style={{padding:12,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}><b>{fa(compare.length)} محصول برای مقایسه</b><Btn primary onClick={()=>setTab("assistant")}>مقایسه با دستیار</Btn></Card></div>}
      </>}
      {tab==="assistant"&&<Card style={{padding:22,maxWidth:850,margin:"20px auto"}}><h2 style={{marginTop:0}}>دستیار هوشمند آن مارکت</h2><p style={{color:"var(--am-muted,#64748b)",lineHeight:2}}>درباره محصولات جستجو کنید یا از بین محصولات انتخاب‌شده مقایسه بگیرید. پاسخ فقط بر پایه داده‌های واقعی موجود در آن مارکت ساخته می‌شود.</p><textarea id="market-ai-input" placeholder="مثلاً برای یک لپ‌تاپ مناسب برنامه‌نویسی چه گزینه‌هایی دارم؟" style={{width:"100%",minHeight:140,padding:14,borderRadius:14,border:"1px solid var(--am-border,#e5e7eb)",fontFamily:"Vazirmatn",direction:"rtl"}}/><div style={{marginTop:10}}><Btn primary onClick={async()=>{const el=document.getElementById("market-ai-input") as HTMLTextAreaElement|null;const input=el?.value.trim();if(!input)return;const r=await fetch(API+"/api/v1/market/ai/assist",{method:"POST",headers:{"content-type":"application/json",...auth()},body:JSON.stringify({workflowCode:compare.length>1?"market.compare":"market.assist",input,compareIds:compare})});const d=await r.json();alert(d.output?.text||d.output||"پاسخی دریافت نشد.")}}>ارسال به دستیار</Btn></div></Card>}
      {tab==="categories"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:12}}>{roots.map(c=><Card key={c.id} style={{padding:18,cursor:"pointer"}} onClick={()=>setCat(c.slug)}><div style={{fontSize:14,fontWeight:900}}>{c.name_fa}</div><div style={{fontSize:11,color:"var(--am-muted,#64748b)",marginTop:6}}>مشاهده محصولات این دسته</div></Card>)}</div>}
      {tab==="me"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:14}}><Card style={{padding:18}}><h3>علاقه‌مندی‌ها</h3><p style={{color:"var(--am-muted,#64748b)"}}>{fa(favorites.size)} محصول ذخیره شده</p></Card><Card style={{padding:18}}><h3>مقایسه‌های انتخاب‌شده</h3><p style={{color:"var(--am-muted,#64748b)"}}>{fa(compare.length)} محصول</p></Card><Card style={{padding:18}}><h3>پشتیبانی</h3><textarea value={ticket} onChange={e=>setTicket(e.target.value)} placeholder="موضوع و پیام تیکت…" style={{width:"100%",minHeight:100,padding:10,borderRadius:10,border:"1px solid var(--am-border,#e5e7eb)",fontFamily:"Vazirmatn"}}/><Btn primary onClick={async()=>{if(!token()||!ticket.trim())return;const r=await fetch(API+"/api/v1/market/tickets",{method:"POST",headers:{"content-type":"application/json",...auth()},body:JSON.stringify({subject:"پشتیبانی آن مارکت",message:ticket})});if(r.ok){setTicket("");const d=await fetch(API+"/api/v1/market/me/tickets",{headers:auth()});if(d.ok)setTicketList((await d.json()).tickets||[])}}}>ثبت تیکت</Btn><div style={{marginTop:12}}>{ticketList.slice(0,5).map(t=><div key={t.id} style={{padding:"8px 0",borderBottom:"1px solid var(--am-border,#e5e7eb)",fontSize:12}}>{t.subject} · {t.status}</div>)}</div></Card></div>}
    </div>
  </div>;
}
