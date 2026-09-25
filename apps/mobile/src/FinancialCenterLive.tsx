import {useCallback,useEffect,useMemo,useState} from "react";
import {financialApi,type FinancialCard,type FinancialSnapshot} from "./financialApi";

type Props={onBack:()=>void};
const fa=(n:number)=>new Intl.NumberFormat("fa-IR").format(Math.round(n));
const last4=(v:string)=>String(v).replace(/\d/g,d=>"۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
export default function FinancialCenterLive({onBack}:Props){
 const [mode,setMode]=useState<"day"|"month"|"year"|"custom">("month");
 const [cards,setCards]=useState<FinancialCard[]>([]);
 const [selected,setSelected]=useState<number[]>([]);
 const [data,setData]=useState<FinancialSnapshot|null>(null);
 const [loading,setLoading]=useState(true);
 const [syncing,setSyncing]=useState(false);
 const [error,setError]=useState("");
 const [from,setFrom]=useState("");
 const [to,setTo]=useState("");
 const range=useMemo(()=>{const now=new Date();let s=new Date(now);let e=new Date(now);if(mode==="day"){s.setHours(0,0,0,0)}else if(mode==="month"){s=new Date(now.getFullYear(),now.getMonth(),1)}else if(mode==="year"){s=new Date(now.getFullYear(),0,1)}else if(from&&to){s=new Date(from+"T00:00:00");e=new Date(to+"T23:59:59")}return{s,e}},[mode,from,to]);
 const load=useCallback(async()=>{setLoading(true);setError("");try{const c=await financialApi.cards();setCards(c.cards);const active=c.cards.filter(x=>x.audit_enabled).map(x=>x.id);const use=selected.length?selected:active;if(!selected.length)setSelected(active);setData(await financialApi.snapshot(range.s,range.e,use))}catch(e){setError(e instanceof Error?e.message:"دریافت اطلاعات مرکز مالی ناموفق بود")}finally{setLoading(false)}},[range.s.getTime(),range.e.getTime(),selected.join(",")]);
 useEffect(()=>{load()},[load]);
 const toggle=async(id:number)=>{const c=cards.find(x=>x.id===id);if(!c)return;try{await financialApi.access(id,!c.audit_enabled);setSelected(x=>x.filter(v=>v!==id));await load()}catch(e){setError(e instanceof Error?e.message:"تغییر دسترسی ناموفق بود")}};
 const sync=async()=>{setSyncing(true);try{await financialApi.sync();await load()}catch(e){setError(e instanceof Error?e.message:"همگام‌سازی فینوتک ناموفق بود")}finally{setSyncing(false)}};
 const income=Number(data?.summary.find(x=>x.direction==="income")?.total??0);
 const expense=Number(data?.summary.find(x=>x.direction==="expense")?.total??0);
 return <div className="anp-full-page" dir="rtl" style={{background:"var(--bg,#071D2C)"}}>
  <div className="anp-page-header"><button className="back-btn" onClick={onBack}>‹</button><h2 className="subscreen-title">مرکز مالی</h2><button className="back-btn" onClick={sync} disabled={syncing}>↻</button></div>
  <div className="anp-page-body" style={{paddingBottom:40}}>
   <div style={{fontSize:12,color:"#9fb0bc",marginBottom:9}}>کارت‌های بانکی ثبت‌شده و دسترسی حسابرسی</div>
   {cards.length===0?<div style={{padding:18,textAlign:"center",color:"#9fb0bc",border:"1px dashed rgba(255,255,255,.12)",borderRadius:15}}>کارت بانکی ثبت‌شده‌ای وجود ندارد.</div>:
   <div style={{display:"grid",gap:8,marginBottom:14}}>{cards.map(c=><div key={c.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:12,borderRadius:14,background:"rgba(255,255,255,.035)",border:"1px solid rgba(255,255,255,.07)"}}>
    <div><div style={{fontWeight:800}}>کارت •••• {last4(c.last4)}</div><div style={{fontSize:10,color:"#8298a4",marginTop:4}}>{c.currency==="IRR"?"ریال":c.currency} · {c.status==="active"?"فعال":"غیرفعال"}</div></div>
    <button onClick={()=>toggle(c.id)} style={{border:0,borderRadius:18,padding:"7px 10px",fontFamily:"Vazirmatn",fontSize:10,fontWeight:800,background:c.audit_enabled?"rgba(0,214,176,.15)":"rgba(255,255,255,.06)",color:c.audit_enabled?"#00D6B0":"#9fb0bc"}}>{c.audit_enabled?"حسابرسی فعال":"اجازه حسابرسی"}</button>
   </div>)}</div>}
   <div style={{display:"flex",gap:6,marginBottom:12}}>{(["day","month","year","custom"] as const).map(x=><button key={x} onClick={()=>setMode(x)} style={{flex:1,padding:9,borderRadius:10,border:"1px solid rgba(255,255,255,.08)",background:mode===x?"rgba(0,214,176,.15)":"rgba(255,255,255,.03)",color:mode===x?"#00D6B0":"#9fb0bc",fontFamily:"Vazirmatn",fontSize:10,fontWeight:800}}>{x==="day"?"روز":x==="month"?"ماه":x==="year"?"سال":"بازه"}</button>)}</div>
   {mode==="custom"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:12}}><input type="date" value={from} onChange={e=>setFrom(e.target.value)} /><input type="date" value={to} onChange={e=>setTo(e.target.value)} /></div>}
   {error&&<div style={{padding:10,borderRadius:11,background:"rgba(239,68,68,.1)",color:"#fca5a5",fontSize:11,marginBottom:10}}>{error}</div>}
   {loading?<div style={{padding:35,textAlign:"center",color:"#9fb0bc"}}>در حال دریافت اطلاعات واقعی…</div>:data?.transactions.length?<>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:14}}>
     <div style={{padding:11,borderRadius:13,background:"rgba(0,214,176,.07)"}}><small>درآمد</small><strong style={{display:"block",color:"#00D6B0",marginTop:4}}>{fa(income)}</strong></div>
     <div style={{padding:11,borderRadius:13,background:"rgba(239,68,68,.06)"}}><small>هزینه</small><strong style={{display:"block",color:"#f87171",marginTop:4}}>{fa(expense)}</strong></div>
     <div style={{padding:11,borderRadius:13,background:"rgba(255,255,255,.03)"}}><small>خالص</small><strong style={{display:"block",color:income-expense>=0?"#00D6B0":"#f87171",marginTop:4}}>{fa(income-expense)}</strong></div>
    </div>
    <div style={{fontWeight:800,fontSize:13,margin:"10px 0"}}>تراکنش‌های واقعی کارت‌های تحت حسابرسی</div>
    <div style={{display:"grid",gap:6}}>{data.transactions.slice(0,50).map(t=><div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:10,borderRadius:12,background:"rgba(255,255,255,.025)",border:"1px solid rgba(255,255,255,.05)"}}>
      <div><div style={{fontSize:11,fontWeight:700}}>{t.description||t.category||"تراکنش بانکی"}</div><div style={{fontSize:9,color:"#7f949f",marginTop:3}}>کارت •••• {last4(t.last4)} · {t.category}</div></div>
      <b style={{fontSize:11,color:t.direction==="income"?"#00D6B0":"#f87171"}}>{t.direction==="income"?"+":"-"} {fa(Number(t.amount))}</b>
    </div>)}</div>
   </>:<div style={{padding:30,textAlign:"center",borderRadius:15,border:"1px dashed rgba(255,255,255,.1)",color:"#9fb0bc"}}>برای کارت‌های تحت حسابرسی در این بازه تراکنشی وجود ندارد.</div>}
   {syncing&&<div style={{marginTop:12,padding:10,borderRadius:11,textAlign:"center",background:"#0b2738",color:"#00D6B0"}}>در حال دریافت گردش حساب از فینوتک…</div>}
  </div>
 </div>
}