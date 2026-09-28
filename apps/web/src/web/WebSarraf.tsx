// ─────────────────────────────────────────────────
// An Pardaz Web Portal — An Sarraf (Desktop Exchange)
// Live exchange UI; asset catalog and market state come from backend
// ─────────────────────────────────────────────────
import { useState, useMemo, useCallback, useEffect } from "react";
import WI from "./WebIcons";
import type { WebPage, CryptoAsset, KycStatus, OrderBookEntry } from "./types";
import { useIsMobile } from "./useResponsive";

const ANSARRAF_API_BASE = ((import.meta as any).env?.VITE_ANSARRAF_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const PLATFORM_API_BASE = ((import.meta as any).env?.VITE_PLATFORM_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const getWebToken = () => typeof window !== "undefined" ? window.localStorage.getItem("anpardaz:accessToken") ?? "" : "";

const FA = (s: string | number) => String(s).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]);
const fmtP = (n: number) => !Number.isFinite(n) || n <= 0 ? "—" : n >= 1 ? n.toLocaleString("en-US", { maximumFractionDigits:2 }) : n.toPrecision(4);
const fmtIrt = (n: number) => {
  if (n >= 1_000_000_000) return `${(n/1_000_000_000).toFixed(2)} میلیارد تومان`;
  if (n >= 1_000_000)     return `${(n/1_000_000).toFixed(0)} میلیون تومان`;
  return `${n.toLocaleString("fa-IR")} تومان`;
};
const fmtVol = (n: number) => {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1e12) return `$${(n/1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n/1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n/1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
};
const clr = (n: number) => n >= 0 ? "#10b981" : "#f43f5e";

type SarrafTab = "markets"|"trade-select"|"instant"|"spot"|"margin"|"assets"|"deposit"|"deposit-coin"|"withdraw"|"withdraw-coin"|"orders"|"transactions"|"fees"|"security"|"support"|"guide"|"forexbot";

interface SarrafProps {
  onNavigate: (p: WebPage) => void;
  kycStatus: KycStatus;
  onAuthRequired: () => void;
  isLoggedIn: boolean;
}

const TAB_GROUPS = [
  { label:"بازارها",   items:[{ id:"markets" as SarrafTab,        icon:"sarraf",    label:"بازارها" }] },
  { label:"معاملات",   items:[
    { id:"forexbot" as SarrafTab, icon:"cpu", label:"فارکس بات" },
    { id:"trade-select" as SarrafTab, icon:"swap",      label:"معامله" },
  ]},
  { label:"حساب",      items:[
    { id:"assets" as SarrafTab,       icon:"wallet",    label:"دارایی‌ها" },
    { id:"deposit" as SarrafTab,      icon:"deposit",   label:"واریز تومان" },
    { id:"deposit-coin" as SarrafTab, icon:"download",  label:"واریز رمزارز" },
    { id:"withdraw" as SarrafTab,     icon:"withdraw",  label:"برداشت تومان" },
    { id:"withdraw-coin" as SarrafTab,icon:"upload",    label:"برداشت رمزارز" },
    { id:"orders" as SarrafTab,       icon:"document",  label:"سفارشات" },
    { id:"transactions" as SarrafTab, icon:"history",   label:"تراکنش‌ها" },
  ]},
  { label:"اطلاعات",   items:[
    { id:"fees" as SarrafTab,         icon:"percent",   label:"کارمزدها" },
    { id:"security" as SarrafTab,     icon:"shield",    label:"امنیت" },
    { id:"guide" as SarrafTab,        icon:"play",      label:"راهنما" },
  ]},
  { label:"پشتیبانی",  items:[
    { id:"support" as SarrafTab,      icon:"comment",   label:"تیکت‌ها" },
  ]},
];

function ForexBotTab({ asset }: { asset: CryptoAsset }) {
  const [state,setState]=useState<any>(null),[amount,setAmount]=useState("30"),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const load=useCallback(async()=>{const token=getWebToken();if(!token){setState(null);return;}try{const r=await fetch(ANSARRAF_API_BASE+"/api/v1/forex-bot",{headers:{authorization:"Bearer "+token},cache:"no-store"});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error??"forex_bot_unavailable");setState(d);if(d?.account?.investment_amount)setAmount(String(d.account.investment_amount));setError("");}catch(e){setError(e instanceof Error?e.message:"forex_bot_unavailable");}},[]);
  useEffect(()=>{void load();const id=window.setInterval(()=>void load(),5000);return()=>window.clearInterval(id)},[load]);
  const request=async(action:"activate"|"deactivate")=>{const token=getWebToken();if(!token)return;setBusy(true);setError("");try{const r=await fetch(ANSARRAF_API_BASE+"/api/v1/forex-bot/requests",{method:"POST",headers:{authorization:"Bearer "+token,"content-type":"application/json"},body:JSON.stringify({action,amount:action==="activate"?amount:undefined,idempotencyKey:crypto.randomUUID()})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error??"forex_bot_request_failed");await load();}catch(e){setError(e instanceof Error?e.message:"forex_bot_request_failed");}finally{setBusy(false);}};
  const a=state?.account,status=a?.status??"inactive",pnl=Number(a?.total_pnl??0),events=Array.isArray(state?.pnlEvents)?state.pnlEvents.slice(-24).reverse():[],max=Math.max(1,...events.map((x:any)=>Math.abs(Number(x.amount)||0))),executionAvailable=state?.executionAvailable===true;
  return <div style={{padding:"24px 0",maxWidth:620}}><div className="w-card" style={{padding:22}}><div style={{fontSize:16,fontWeight:900,marginBottom:8}}>فارکس بات آن صراف</div><div style={{fontSize:12,color:"var(--w-muted)",lineHeight:1.9}}>سرمایه‌گذاری هر کاربر حداکثر ۳۰ دلار USDT است. فعال‌سازی و غیرفعال‌سازی فقط پس از تأیید مدیریت انجام می‌شود.</div>{error&&<div style={{marginTop:12,color:"#dc2626",fontSize:11}}>{error}</div>}{!executionAvailable&&<div style={{marginTop:12,padding:10,borderRadius:9,background:"rgba(217,119,6,.08)",color:"#b45309",fontSize:11,lineHeight:1.8}}>موتور اجرای معاملات فارکس و Broker در محیط Production متصل نشده است؛ تا اتصال Provider واقعی، فعال‌سازی ربات و قفل‌کردن سرمایه انجام نمی‌شود.</div>}<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14}}><div style={{padding:12,border:"1px solid var(--w-border)",borderRadius:10}}><div style={{fontSize:10,color:"var(--w-muted)"}}>وضعیت</div><div style={{fontWeight:900,marginTop:5}}>{status==="active"?"فعال":status==="activation_pending"?"در انتظار تأیید فعال‌سازی":status==="deactivation_pending"?"در انتظار تأیید غیرفعال‌سازی":"غیرفعال"}</div></div><div style={{padding:12,border:"1px solid var(--w-border)",borderRadius:10}}><div style={{fontSize:10,color:"var(--w-muted)"}}>سود/زیان ثبت‌شده</div><div dir="ltr" style={{fontWeight:900,marginTop:5,color:pnl>=0?"#059669":"#dc2626"}}>{pnl.toFixed(4)} USDT</div></div></div>{status==="inactive"&&executionAvailable&&<div style={{marginTop:14}}><label style={{fontSize:11,color:"var(--w-muted)"}}>سرمایه‌گذاری USDT (حداکثر ۳۰)</label><input className="w-input" value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal" dir="ltr" style={{marginTop:6}}/><button className="w-btn w-btn-primary" disabled={busy} onClick={()=>void request("activate")} style={{marginTop:8,width:"100%"}}>{busy?"در حال ثبت…":"فعال‌سازی ربات"}</button></div>}{status==="activation_pending"&&<div style={{marginTop:14,fontSize:12,color:"#b45309"}}>درخواست فعال‌سازی ثبت شده و در انتظار تأیید مدیریت است. در صورت رد، مبلغ رزروشده آزاد می‌شود.</div>}{status==="active"&&<button className="w-btn w-btn-ghost" disabled={busy} onClick={()=>void request("deactivate")} style={{marginTop:14,width:"100%"}}>{busy?"در حال ثبت…":"درخواست غیرفعال‌سازی"}</button>}{status==="deactivation_pending"&&<div style={{marginTop:14,fontSize:12,color:"#b45309"}}>درخواست غیرفعال‌سازی در انتظار تصمیم مدیریت است؛ تا آن زمان وضعیت فعلی حفظ می‌شود.</div>}{events.length>0&&<div style={{marginTop:18}}><div style={{fontWeight:800,fontSize:13,marginBottom:8}}>نمودار سود/زیان ثبت‌شده</div><div style={{height:170,border:"1px solid var(--w-border)",borderRadius:10,padding:12,display:"flex",alignItems:"flex-end",gap:5}}>{events.map((x:any,i:number)=>{const v=Number(x.amount)||0;return <div key={x.id??i} title={String(x.reason??"")} style={{flex:1,maxWidth:22,height:Math.max(4,Math.min(100,Math.abs(v)/max*100))+"%",background:v>=0?"#10b981":"#f43f5e",borderRadius:4}}/>})}</div></div>}<div style={{marginTop:12,fontSize:11,color:"var(--w-muted)"}}>وضعیت و P&L فقط از Backend خوانده می‌شوند و عدد پیش‌فرض یا سود ساختگی نمایش داده نمی‌شود.</div></div></div>;
}

function MarketsTab({ assets, search, onSearch, sortBy, onSort, filterFav, onFilterFav, favorites, onToggleFav, onSelectTrade, onSelectDetail, totalCount }: {
  assets: CryptoAsset[]; search: string; onSearch:(s:string)=>void;
  sortBy: "rank"|"price"|"change"|"volume"; onSort:(s:any)=>void;
  filterFav:boolean; onFilterFav:(b:boolean)=>void;
  favorites:Set<string>; onToggleFav:(id:string)=>void;
  onSelectTrade:(a:CryptoAsset)=>void; onSelectDetail:(a:CryptoAsset)=>void;
  totalCount: number;
}) {
  const isMob = useIsMobile(900);
  const [resolution,setResolution]=useState("60"),[candles,setCandles]=useState<any[]>([]),[candleLoading,setCandleLoading]=useState(true),[candleError,setCandleError]=useState("");
  useEffect(()=>{let active=true;const load=async()=>{setCandleLoading(true);setCandleError("");try{const to=Math.floor(Date.now()/1000),from=to-7*24*60*60;const r=await fetch(ANSARRAF_API_BASE+"/api/v1/market-data/candles?symbol="+encodeURIComponent(a.symbol+"/USDT")+"&resolution="+encodeURIComponent(resolution)+"&from="+from+"&to="+to,{cache:"no-store"});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error??"market_candles_unavailable");if(active)setCandles(Array.isArray(d?.candles)?d.candles:[]);}catch(e){if(active){setCandles([]);setCandleError(e instanceof Error?e.message:"market_candles_unavailable");}}finally{if(active)setCandleLoading(false);}};void load();const timer=window.setInterval(()=>void load(),30000);return()=>{active=false;window.clearInterval(timer)}},[a.symbol,resolution]);
  const candlePoints=candles.map((x:any)=>Number(x.close)).filter(Number.isFinite),cMin=candlePoints.length?Math.min(...candlePoints):0,cMax=candlePoints.length?Math.max(...candlePoints):0,cSpan=Math.max(cMax-cMin,1),cPoly=candlePoints.map((v:number,i:number)=>String(candlePoints.length===1?200:i*400/(candlePoints.length-1))+","+String(110-(v-cMin)/cSpan*95)).join(" ");
  return (
    <div>
      {/* Controls bar */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:isMob?"0 0 10px":"0 0 12px", flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:1, minWidth:isMob?120:200, maxWidth:isMob?undefined:320 }}>
          <WI n="search" s={14} style={{ position:"absolute", right:11, top:"50%", transform:"translateY(-50%)", color:"var(--w-muted)", pointerEvents:"none" }}/>
          <input value={search} onChange={e=>onSearch(e.target.value)} placeholder={`جستجو در ${FA(totalCount)} ارز...`} className="w-input" style={{ paddingRight:34 }}/>
        </div>
        <button onClick={()=>onFilterFav(!filterFav)}
          style={{ display:"flex", alignItems:"center", gap:5, padding:isMob?"7px 10px":"8px 14px", borderRadius:8, border:`1px solid ${filterFav?"rgba(251,191,36,0.5)":"var(--w-border)"}`, background:filterFav?"rgba(251,191,36,0.08)":"transparent", color:filterFav?"#f59e0b":"var(--w-muted)", fontSize:12, fontWeight:600, cursor:"pointer" }}>
          <WI n="star" s={13}/> {isMob?"":"علاقه‌مندی‌ها"}
        </button>
        {(["rank","change","volume"] as const).map(s=>(
          <button key={s} onClick={()=>onSort(s)}
            style={{ padding:isMob?"7px 10px":"8px 14px", borderRadius:8, border:`1px solid ${sortBy===s?"rgba(8,145,178,0.4)":"var(--w-border)"}`, background:sortBy===s?"rgba(8,145,178,0.08)":"transparent", color:sortBy===s?"#0891b2":"var(--w-muted)", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            {s==="rank"?"رتبه":s==="change"?"تغییر":"حجم"}
          </button>
        ))}
        {!isMob && <div style={{ fontSize:12, color:"var(--w-muted)", marginRight:"auto" }}>{FA(assets.length)} از {FA(totalCount)} ارز</div>}
      </div>

      {/* Desktop Table */}
      {!isMob && (
        <div style={{ background:"var(--w-card)", border:"1px solid var(--w-border)", borderRadius:12, overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:"40px 1fr 130px 110px 90px 110px 110px 80px", padding:"10px 14px", background:"var(--w-card2)", borderBottom:"1px solid var(--w-border)", fontSize:11, color:"var(--w-muted)", fontWeight:600, gap:8 }}>
            <div>#</div><div>ارز</div><div style={{textAlign:"left"}}>قیمت (USDT)</div>
            <div style={{textAlign:"left"}}>قیمت (تومان)</div><div style={{textAlign:"center"}}>تغییر ۲۴ه</div>
            <div style={{textAlign:"left"}}>حجم ۲۴ه</div><div style={{textAlign:"left"}}>مارکت کپ</div><div style={{textAlign:"center"}}>عملیات</div>
          </div>
          <div style={{ maxHeight:"calc(100vh - var(--w-header) - 200px)", overflowY:"auto" }}>
            {assets.map((a) => (
              <div key={a.id} style={{ display:"grid", gridTemplateColumns:"40px 1fr 130px 110px 90px 110px 110px 80px", padding:"10px 14px", borderBottom:"1px solid var(--w-border)", alignItems:"center", gap:8, cursor:"pointer", transition:"background 0.1s" }}
                onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background="var(--w-hover)"}
                onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background="transparent"}
                onClick={()=>onSelectDetail(a)}
              >
                <div style={{ fontSize:12, color:"var(--w-muted)", display:"flex", alignItems:"center", gap:4 }}>
                  <button onClick={e=>{e.stopPropagation();onToggleFav(a.id);}} style={{ background:"none", border:"none", cursor:"pointer", color:favorites.has(a.id)?"#f59e0b":"var(--w-border)", padding:0, display:"flex" }}>
                    <WI n="star" s={12}/>
                  </button>
                  {FA(a.rank)}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", background:a.logoColor, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:9, fontWeight:900, flexShrink:0 }}>{a.symbol.slice(0,3)}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700 }}>{a.nameFa}</div>
                    <div style={{ fontSize:10, color:"var(--w-muted)" }}>{a.symbol}</div>
                  </div>
                </div>
                <div style={{ fontSize:13, fontWeight:700, fontVariantNumeric:"tabular-nums" }}>${fmtP(a.price)}</div>
                <div style={{ fontSize:11, color:"var(--w-muted)", fontVariantNumeric:"tabular-nums" }}>{FA(Math.round(a.priceIrt/1000).toLocaleString())} ه</div>
                <div style={{ textAlign:"center" }}>
                  <span style={{ fontSize:12, fontWeight:700, color:clr(a.change24h), background:a.change24h>=0?"rgba(16,185,129,0.08)":"rgba(244,63,94,0.08)", padding:"2px 7px", borderRadius:5 }}>
                    {a.change24h>0?"+":""}{a.change24h.toFixed(2)}%
                  </span>
                </div>
                <div style={{ fontSize:11, color:"var(--w-muted)", fontVariantNumeric:"tabular-nums" }}>{fmtVol(a.volume24h)}</div>
                <div style={{ fontSize:11, color:"var(--w-muted)", fontVariantNumeric:"tabular-nums" }}>{fmtVol(a.marketCap)}</div>
                <div style={{ display:"flex", justifyContent:"center" }}>
                  <button onClick={e=>{e.stopPropagation();onSelectTrade(a);}} className="w-btn w-btn-muted" style={{ padding:"4px 12px", fontSize:11, borderRadius:6 }}>معامله</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile card list */}
      {isMob && (
        <div style={{ display:"flex", flexDirection:"column", gap:1, background:"var(--w-card)", border:"1px solid var(--w-border)", borderRadius:12, overflow:"hidden" }}>
          {/* Mobile header */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto auto", padding:"8px 12px", background:"var(--w-card2)", fontSize:10, color:"var(--w-muted)", fontWeight:700, gap:8 }}>
            <div>ارز</div><div style={{textAlign:"left"}}>قیمت</div><div style={{textAlign:"center"}}>تغییر</div>
          </div>
          <div style={{ maxHeight:"calc(100vh - var(--w-header) - 160px)", overflowY:"auto" }}>
            {assets.map((a) => (
              <div key={a.id} style={{ display:"grid", gridTemplateColumns:"1fr auto auto", padding:"11px 12px", borderBottom:"1px solid var(--w-border)", alignItems:"center", gap:8, cursor:"pointer", transition:"background 0.1s" }}
                onClick={()=>onSelectDetail(a)}
              >
                <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                  <div style={{ width:34, height:34, borderRadius:"50%", background:a.logoColor, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:9, fontWeight:900, flexShrink:0 }}>{a.symbol.slice(0,3)}</div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"var(--w-text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{a.nameFa}</div>
                    <div style={{ fontSize:10, color:"var(--w-muted)" }}>{a.symbol}</div>
                  </div>
                </div>
                <div style={{ textAlign:"left" }}>
                  <div style={{ fontSize:13, fontWeight:800, fontVariantNumeric:"tabular-nums" }}>${fmtP(a.price)}</div>
                  <div style={{ fontSize:10, color:"var(--w-muted)" }}>{FA(Math.round(a.priceIrt/1000).toLocaleString())}ه ت</div>
                </div>
                <div style={{ textAlign:"center", minWidth:56 }}>
                  <span style={{ fontSize:11, fontWeight:800, color:clr(a.change24h), background:a.change24h>=0?"rgba(16,185,129,0.1)":"rgba(244,63,94,0.1)", padding:"3px 7px", borderRadius:6, display:"block" }}>
                    {a.change24h>0?"+":""}{a.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Coin Detail ────────────────────────────────────
function CoinDetailView({ asset:a, onBack, onTrade, isFav, onToggleFav }: { asset:CryptoAsset; onBack:()=>void; onTrade:()=>void; isFav:boolean; onToggleFav:()=>void; }) {
  const isMob = useIsMobile(900);
  return (
    <div className="w-fade" style={{ padding:isMob?"12px":undefined }}>
      <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontSize:13, fontWeight:600, marginBottom:16 }}>
        <WI n="arrow-right" s={14}/> بازگشت به بازارها
      </button>
      <div style={{ display:"grid", gridTemplateColumns:isMob?"1fr":"1fr 320px", gap:16 }}>
        <div>
          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
            <div style={{ width:52, height:52, borderRadius:"50%", background:a.logoColor, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:16, fontWeight:900 }}>{a.symbol.slice(0,3)}</div>
            <div>
              <h1 style={{ fontSize:22, fontWeight:900, margin:0 }}>{a.nameFa} <span style={{ fontSize:14, color:"var(--w-muted)", fontWeight:500 }}>({a.symbol})</span></h1>
              <div style={{ display:"flex", gap:10, marginTop:4, alignItems:"center" }}>
                <span style={{ fontSize:20, fontWeight:900 }}>${fmtP(a.price)}</span>
                <span style={{ fontSize:14, fontWeight:700, color:clr(a.change24h) }}>{a.change24h>0?"+":""}{a.change24h.toFixed(2)}%</span>
              </div>
            </div>
            <div style={{ marginRight:"auto", display:"flex", gap:8 }}>
              <button onClick={onToggleFav} className="w-btn w-btn-ghost" style={{ padding:"8px 14px", color:isFav?"#f59e0b":"var(--w-muted)" }}>
                <WI n="star" s={14}/> {isFav ? "حذف از علاقه‌مندی" : "افزودن به علاقه‌مندی"}
              </button>
              <button onClick={onTrade} className="w-btn w-btn-primary" style={{ padding:"9px 20px" }}>
                <WI n="swap" s={14}/> معامله
              </button>
            </div>
          </div>
          <div className="w-card" style={{height:340,padding:14,marginBottom:16,boxSizing:"border-box"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><b style={{fontSize:13}}>نمودار واقعی والکس</b><div style={{display:"flex",gap:4}}>{[["15","۱۵د"],["60","۱س"],["240","۴س"],["1D","۱روز"]].map(([v,l])=><button key={v} onClick={()=>setResolution(v)} className={resolution===v?"w-btn w-btn-primary":"w-btn w-btn-ghost"} style={{padding:"4px 8px",fontSize:10}}>{l}</button>)}</div></div>
            {candleLoading?<div style={{height:285,display:"grid",placeItems:"center",color:"var(--w-muted)",fontSize:12}}>در حال دریافت کندل‌های واقعی…</div>:candleError||!candlePoints.length?<div style={{height:285,display:"grid",placeItems:"center",color:"var(--w-muted)",fontSize:12}}>{candleError?"داده کندل در دسترس نیست.":"برای این بازار داده کندل موجود نیست."}</div>:<svg viewBox="0 0 400 120" preserveAspectRatio="none" style={{width:"100%",height:285,display:"block"}}><polyline points={cPoly} fill="none" stroke="#0891b2" strokeWidth="1.8" vectorEffect="non-scaling-stroke"/></svg>}
          </div>
        </div>
        {/* Stats */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div className="w-card" style={{ padding:"18px" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--w-muted)", marginBottom:12 }}>آمار بازار</div>
            {[
              ["رتبه بازار", `#${FA(a.rank)}`],
              ["بالاترین ۲۴ه", `${fmtP(a.high24h)}`],
              ["پایین‌ترین ۲۴ه", `${fmtP(a.low24h)}`],
              ["حجم ۲۴ه", fmtVol(a.volume24h)],
              ["مارکت کپ", fmtVol(a.marketCap)],
              ["قیمت تومان", fmtIrt(a.priceIrt)],
            ].map(([k,v]) => (
              <div key={k as string} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid var(--w-border)", fontSize:13 }}>
                <span style={{ color:"var(--w-muted)" }}>{k}</span>
                <span style={{ fontWeight:700 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Trade View ─────────────────────────────────────

function TradeView({asset,asks,bids,tradeType,onTradeType,tradeMode,onTradeMode,price,onPrice,amount,onAmount,isLoggedIn,needsKyc,onAuth,assets,onAssetChange,tradeKind="spot",onBack}:{asset:CryptoAsset;asks:any[];bids:any[];tradeType:"buy"|"sell";onTradeType:(x:"buy"|"sell")=>void;tradeMode:"market"|"limit"|"stop-limit";onTradeMode:(x:any)=>void;price:string;onPrice:(x:string)=>void;amount:string;onAmount:(x:string)=>void;isLoggedIn:boolean;needsKyc:boolean;onAuth:()=>void;assets:CryptoAsset[];onAssetChange:(x:CryptoAsset)=>void;tradeKind?:"spot"|"margin";onBack?:()=>void;favorites?:Set<string>;onSelectAsset?:()=>void}) {
 const [balance,setBalance]=useState<Record<string,number>>({}),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
 useEffect(()=>{if(isLoggedIn)void sarrafWalletMap().then(setBalance).catch(()=>{});},[isLoggedIn]);
 const available=tradeType==="buy"?Number(balance.USDT||0):Number(balance[asset.symbol]||0);
 const submit=async()=>{if(!isLoggedIn){onAuth();return;}if(needsKyc){setMsg("احراز هویت برای معامله الزامی است.");return;}if(tradeKind==="margin"){setMsg("معاملات تعهدی تا اتصال کامل API اجرایی واقعی والکس غیرفعال است.");return;}const v=Number(amount),p=Number(price);if(!Number.isFinite(v)||v<=0){setMsg("مقدار معتبر وارد کنید.");return;}if(v>available){setMsg("موجودی قابل استفاده کافی نیست.");return;}if(tradeMode==="limit"&&(!Number.isFinite(p)||p<=0)){setMsg("قیمت لیمیت معتبر وارد کنید.");return;}const live=tradeMode==="limit"?p:asset.price;if(!live||live<=0){setMsg("قیمت زنده در دسترس نیست.");return;}setBusy(true);try{const q=tradeType==="buy"?v/live:v;const r=await sarrafPlaceOrder(asset.symbol,"USDT",tradeType,tradeMode==="limit"?"limit":"market",q,tradeMode==="limit"?p:undefined,tradeType==="buy"?v:undefined);setMsg("سفارش واقعی ثبت شد: "+String(r?.order?.id??"ثبت‌شده"));onAmount("");onPrice("");void sarrafWalletMap().then(setBalance).catch(()=>{});}catch(e){setMsg(e instanceof Error?e.message:"order_failed");}finally{setBusy(false);}};
 return <div style={{display:"flex",flexDirection:"column",minHeight:600}}>{onBack&&<button onClick={onBack} className="w-btn w-btn-ghost" style={{alignSelf:"flex-start",margin:8}}>بازگشت</button>}{tradeKind==="margin"&&<div className="warning-box" style={{margin:12}}>معاملات تعهدی فعلاً اجرا نمی‌شوند. Wallex برای هر بازار min/max risk coefficient و step جداگانه دارد؛ اهرم ثابت نمایش داده نمی‌شود.</div>}<div style={{display:"grid",gridTemplateColumns:"1fr 300px",flex:1}}><div style={{padding:12}}><div className="w-card" style={{padding:12}}><b>دفتر سفارش واقعی</b>{asks.slice(0,10).map((x:any,i:number)=><div key={"a"+i} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:4}}><span>{fmtP(Number(x.price))}</span><span>{String(x.amount)}</span></div>)}{bids.slice(0,10).map((x:any,i:number)=><div key={"b"+i} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:4}}><span>{fmtP(Number(x.price))}</span><span>{String(x.amount)}</span></div>)}</div></div><div style={{borderRight:"1px solid var(--w-border)",padding:14}}><div style={{display:"flex",gap:5}}><button onClick={()=>onTradeType("buy")} className="w-btn w-btn-primary">خرید</button><button onClick={()=>onTradeType("sell")} className="w-btn w-btn-ghost">فروش</button></div><div style={{display:"flex",gap:5,margin:"10px 0"}}><button onClick={()=>onTradeMode("market")} className="w-btn w-btn-ghost">بازار</button><button onClick={()=>onTradeMode("limit")} className="w-btn w-btn-ghost">لیمیت</button></div>{tradeMode==="limit"&&<input className="w-input" value={price} onChange={e=>onPrice(e.target.value)} placeholder="قیمت" inputMode="decimal"/>}<input className="w-input" style={{marginTop:8}} value={amount} onChange={e=>onAmount(e.target.value)} placeholder={tradeType==="buy"?"مبلغ USDT":"مقدار "+asset.symbol} inputMode="decimal"/><div style={{fontSize:11,color:"var(--w-muted)",margin:"8px 0"}}>موجودی: {available} {tradeType==="buy"?"USDT":asset.symbol}</div>{msg&&<div style={{fontSize:11,color:"#b45309",marginBottom:8}}>{msg}</div>}<button disabled={busy||tradeKind==="margin"} onClick={()=>void submit()} className="w-btn w-btn-primary" style={{width:"100%"}}>{busy?"در حال ثبت…":tradeKind==="margin"?"تعهدی غیرفعال":"ثبت سفارش واقعی"}</button></div></div></div>;
}

function AuthGate({ onAuth }: { onAuth:()=>void }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 24px", textAlign:"center" }}>
      <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(8,145,178,0.1)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16, color:"#0891b2" }}>
        <WI n="lock" s={28}/>
      </div>
      <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>برای ادامه وارد شوید</div>
      <div style={{ fontSize:13, color:"var(--w-muted)", marginBottom:24 }}>این بخش نیاز به احراز هویت دارد</div>
      <button onClick={onAuth} className="w-btn w-btn-primary" style={{ padding:"12px 32px", fontSize:14 }}>
        ورود / ثبت‌نام
      </button>
    </div>
  );
}

// ── Assets Tab ─────────────────────────────────────
function AssetsTab({ assets, wallets, kycStatus, onDeposit, onWithdraw, onDepositCoin, onWithdrawCoin }: { assets:CryptoAsset[]; wallets:any[]; kycStatus:KycStatus; onDeposit:()=>void; onWithdraw:()=>void; onDepositCoin:()=>void; onWithdrawCoin:()=>void; }) {
  const walletMap=new Map(wallets.map((w:any)=>[String(w.symbol).toUpperCase(),Number(w.available_balance??0)+Number(w.locked_balance??0)]));
  const portfolioValue=assets.reduce((sum,a)=>sum+(walletMap.get(a.symbol.toUpperCase())??0)*a.price,0);
  const lockedValue=assets.reduce((sum,a)=>sum+Number(wallets.find((w:any)=>String(w.symbol).toUpperCase()===a.symbol.toUpperCase())?.locked_balance??0)*a.price,0);
  return <div style={{padding:"20px 0"}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}}>
      {[
        {label:"ارزش کل پورتفولیو",value:portfolioValue.toFixed(2)+" USDT",icon:"wallet",color:"#0891b2"},
        {label:"ارزش موجودی قفل‌شده",value:lockedValue.toFixed(2)+" USDT",icon:"shield",color:"#d97706"},
        {label:"دارایی‌های دارای موجودی",value:String(wallets.filter((w:any)=>Number(w.available_balance??0)+Number(w.locked_balance??0)>0).length),icon:"bar-chart",color:"#7c3aed"}
      ].map(x=><div key={x.label} className="w-card" style={{padding:18}}><div style={{display:"flex",gap:10,alignItems:"center"}}><div style={{width:40,height:40,borderRadius:11,background:x.color+"15",display:"flex",alignItems:"center",justifyContent:"center",color:x.color}}><WI n={x.icon} s={20}/></div><div><div style={{fontSize:11,color:"var(--w-muted)"}}>{x.label}</div><div style={{fontSize:18,fontWeight:900,marginTop:2}}>{x.value}</div></div></div></div>)}
    </div>
    <div className="w-card" style={{overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:"1px solid var(--w-border)"}}>
        <div style={{fontSize:14,fontWeight:800}}>دارایی‌های من</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onDeposit} className="w-btn w-btn-primary" style={{padding:"7px 16px",fontSize:12}}><WI n="deposit" s={13}/> واریز تومان</button>
          <button onClick={onDepositCoin} className="w-btn w-btn-ghost" style={{padding:"7px 16px",fontSize:12}}><WI n="download" s={13}/> واریز رمزارز</button>
          <button onClick={onWithdraw} className="w-btn w-btn-ghost" style={{padding:"7px 16px",fontSize:12}}><WI n="withdraw" s={13}/> برداشت تومان</button>
          <button onClick={onWithdrawCoin} className="w-btn w-btn-ghost" style={{padding:"7px 16px",fontSize:12}}><WI n="upload" s={13}/> برداشت رمزارز</button>
        </div>
      </div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr style={{background:"var(--w-card2)",fontSize:11}}>{["ارز","موجودی","ارزش (USDT)","تغییر ۲۴ه","قیمت","عملیات"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"right",color:"var(--w-muted)",fontWeight:600}}>{h}</th>)}</tr></thead>
        <tbody>{assets.map(a=>{
          const bal=walletMap.get(a.symbol.toUpperCase())??0;
          return <tr key={a.id} style={{borderBottom:"1px solid var(--w-border)"}}>
            <td style={{padding:"12px 14px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:28,height:28,borderRadius:"50%",background:a.logoColor,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:9,fontWeight:900}}>{a.symbol.slice(0,3)}</div><div><div style={{fontWeight:700}}>{a.symbol}</div><div style={{fontSize:10,color:"var(--w-muted)"}}>{a.nameFa}</div></div></div></td>
            <td style={{padding:"12px 14px",fontWeight:700}}>{bal.toFixed(8)}</td>
            <td style={{padding:"12px 14px"}}>{a.price>0?(bal*a.price).toFixed(2)+" USDT":"—"}</td>
            <td style={{padding:"12px 14px"}}><span style={{color:clr(a.change24h),fontWeight:700}}>{a.change24h>0?"+":""}{a.change24h.toFixed(2)}%</span></td>
            <td style={{padding:"12px 14px",color:"var(--w-muted)"}}>{a.price>0?"$"+fmtP(a.price):"—"}</td>
            <td style={{padding:"12px 14px"}}><button onClick={()=>onDepositCoin()} className="w-btn w-btn-muted" style={{padding:"3px 10px",fontSize:11,borderRadius:5}}>واریز/برداشت</button></td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  </div>;
}

// ── KYC Gate ───────────────────────────────────────
function KycGate({ kycStatus }: { kycStatus:KycStatus }) {
  return (
    <div style={{ textAlign:"center", padding:"60px 24px" }}>
      <div style={{ width:60, height:60, borderRadius:"50%", background:"rgba(217,119,6,0.1)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", color:"#d97706" }}><WI n="shield" s={26}/></div>
      <div style={{ fontSize:17, fontWeight:800, marginBottom:8 }}>احراز هویت الزامی</div>
      <div style={{ fontSize:13, color:"var(--w-muted)", marginBottom:24 }}>برای واریز و برداشت، ابتدا هویت خود را تأیید کنید.</div>
      {kycStatus==="not_verified" && <button className="w-btn w-btn-primary" style={{ padding:"11px 28px" }}>شروع احراز هویت</button>}
      {(kycStatus==="submitted"||kycStatus==="pending") && <div style={{ padding:"11px 28px", background:"rgba(217,119,6,0.1)", color:"#d97706", borderRadius:9, fontSize:13, fontWeight:700 }}>در حال بررسی...</div>}
    </div>
  );
}

// ── Deposit Toman Tab ──────────────────────────────
function DepositTomanTab({ kycStatus }: { kycStatus:KycStatus }) {
  const [amount,setAmount]=useState(""),[cards,setCards]=useState<any[]>([]),[cardId,setCardId]=useState(""),[assetId,setAssetId]=useState(""),[reference,setReference]=useState(""),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
  useEffect(()=>{const token=getWebToken();if(!token)return;Promise.all([
    fetch(ANSARRAF_API_BASE+"/api/v1/funding/cards",{headers:{authorization:"Bearer "+token}}).then(r=>r.json()),
    fetch(ANSARRAF_API_BASE+"/api/v1/assets").then(r=>r.json())
  ]).then(([cardsBody,assetsBody])=>{setCards(Array.isArray(cardsBody.cards)?cardsBody.cards:[]);const a=(assetsBody.assets??[]).find((x:any)=>x.asset_type==="fiat"&&["TMN","TOMAN","IRR"].includes(String(x.symbol).toUpperCase()));if(a)setAssetId(String(a.id));}).catch(()=>setMsg("اطلاعات حساب برای واریز در دسترس نیست."));},[]);
  if(kycStatus!=="verified")return <KycGate kycStatus={kycStatus}/>;
  const submit=async()=>{const token=getWebToken();if(!token)return;setBusy(true);setMsg("");try{const r=await fetch(ANSARRAF_API_BASE+"/api/v1/deposits",{method:"POST",headers:{authorization:"Bearer "+token,"content-type":"application/json"},body:JSON.stringify({assetId:Number(assetId),amount:amount.replace(/,/g,""),network:"BANK_CARD",sourceCardId:Number(cardId),externalReference:reference.trim()||undefined,idempotencyKey:crypto.randomUUID()})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error??"deposit_failed");setMsg("درخواست واریز ثبت شد و پس از بررسی مدیریت و حسابداری به موجودی اضافه می‌شود.");setAmount("");setReference("");}catch(e){setMsg(e instanceof Error?e.message:"deposit_failed");}finally{setBusy(false);}};
  return <div style={{maxWidth:560,padding:"24px 0"}}><h2 style={{fontSize:18,fontWeight:900,marginBottom:20}}>واریز تومان</h2><div className="w-card" style={{padding:22}}><div style={{fontSize:12,color:"var(--w-muted)",lineHeight:1.9,marginBottom:14}}>واریز تومان در آن صراف به‌صورت ثبت درخواست انجام می‌شود؛ منبع باید کارت بانکی تأییدشده خود کاربر باشد و اعتباردهی نهایی با بررسی مدیریت و حسابداری انجام می‌شود.</div><label style={{fontSize:11,fontWeight:700}}>کارت مبدأ</label><select className="w-input" value={cardId} onChange={e=>setCardId(e.target.value)} style={{marginTop:6}}><option value="">انتخاب کارت تأییدشده</option>{cards.map((card:any)=><option key={card.id} value={card.id}>{card.bankName??"بانک"} · ****{card.last4}</option>)}</select><label style={{fontSize:11,fontWeight:700,display:"block",marginTop:12}}>مبلغ (تومان)</label><input className="w-input" value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9]/g,""))} inputMode="numeric" placeholder="مبلغ واقعی واریز"/><label style={{fontSize:11,fontWeight:700,display:"block",marginTop:12}}>شناسه/مرجع بانکی (اختیاری)</label><input className="w-input" value={reference} onChange={e=>setReference(e.target.value)} placeholder="شماره پیگیری یا مرجع انتقال"/>{msg&&<div style={{marginTop:12,color:"#b45309",fontSize:12,lineHeight:1.8}}>{msg}</div>}<button disabled={busy||!cardId||!assetId||!amount} onClick={()=>void submit()} className="w-btn w-btn-primary" style={{width:"100%",marginTop:14}}>{busy?"در حال ثبت…":"ثبت درخواست واریز"}</button>{cards.length===0&&<div style={{marginTop:10,fontSize:11,color:"var(--w-muted)"}}>ابتدا کارت بانکی خود را از فرایند رسمی ثبت و تأیید کارت اضافه کنید.</div>}</div></div>;
}

// ── Deposit Coin Tab// ── Deposit Coin Tab ───────────────────────────────
function DepositCoinTab({ assets, kycStatus }: { assets:CryptoAsset[]; kycStatus:KycStatus }) {
  const [selAsset,setSelAsset]=useState<CryptoAsset|null>(assets[0]??null),[networks,setNetworks]=useState<string[]>([]),[network,setNetwork]=useState(""),[address,setAddress]=useState<any>(null),[searchCoin,setSearchCoin]=useState(""),[error,setError]=useState("");
  const token=getWebToken();
  useEffect(()=>{if(!selAsset||!token)return;setAddress(null);setError("");fetch(ANSARRAF_API_BASE+"/api/v1/crypto/deposit-networks?asset="+encodeURIComponent(selAsset.symbol),{headers:{authorization:"Bearer "+token}}).then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error??"deposit_networks_unavailable");const ns=Array.isArray(d.networks)?d.networks:[];setNetworks(ns);setNetwork(ns[0]??"");}).catch(e=>setError(e instanceof Error?e.message:"deposit_networks_unavailable"));},[selAsset?.id,token]);
  useEffect(()=>{if(!network||!selAsset||!token)return;fetch(ANSARRAF_API_BASE+"/api/v1/crypto/deposit-address?asset="+encodeURIComponent(selAsset.symbol)+"&network="+encodeURIComponent(network),{headers:{authorization:"Bearer "+token}}).then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error??"deposit_address_unavailable");setAddress(d);}).catch(e=>setError(e instanceof Error?e.message:"deposit_address_unavailable"));},[network,selAsset?.id,token]);
  if(kycStatus!=="verified")return <KycGate kycStatus={kycStatus}/>;
  const filtered=assets.filter(a=>a.symbol.includes(searchCoin.toUpperCase())||a.nameFa.includes(searchCoin)).slice(0,30);
  if(!selAsset)return <div style={{padding:40,color:"var(--w-muted)"}}>ارزی برای نمایش وجود ندارد.</div>;
  return <div style={{display:"flex",gap:20,padding:"24px 0",alignItems:"flex-start"}}><div style={{width:220,flexShrink:0}}><div style={{fontSize:14,fontWeight:800,marginBottom:10}}>انتخاب رمزارز</div><input value={searchCoin} onChange={e=>setSearchCoin(e.target.value)} placeholder="جستجو..." className="w-input" style={{marginBottom:8,fontSize:12}}/><div style={{background:"var(--w-card)",border:"1px solid var(--w-border)",borderRadius:10,overflow:"hidden",maxHeight:360,overflowY:"auto"}}>{filtered.map(a=><div key={a.id} onClick={()=>setSelAsset(a)} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",cursor:"pointer",background:selAsset.id===a.id?"rgba(8,145,178,0.08)":"transparent",borderBottom:"1px solid var(--w-border)"}}><div style={{width:24,height:24,borderRadius:"50%",background:a.logoColor,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:8,fontWeight:900}}>{a.symbol.slice(0,3)}</div><div><div style={{fontSize:12,fontWeight:700}}>{a.symbol}</div><div style={{fontSize:10,color:"var(--w-muted)"}}>{a.nameFa}</div></div></div>)}</div></div><div style={{flex:1,maxWidth:560}}><h2 style={{fontSize:17,fontWeight:900,marginBottom:16}}>واریز {selAsset.symbol}</h2><div className="w-card" style={{padding:22}}><label style={{fontSize:12,fontWeight:700,color:"var(--w-muted)"}}>شبکه</label><div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"8px 0 16px"}}>{networks.map(n=><button key={n} onClick={()=>setNetwork(n)} className={network===n?"w-btn w-btn-primary":"w-btn w-btn-ghost"} style={{padding:"7px 14px"}}>{n}</button>)}</div>{error&&<div style={{color:"#dc2626",fontSize:12,marginBottom:10}}>{error}</div>}<div style={{padding:14,background:"var(--w-card2)",borderRadius:9,wordBreak:"break-all",fontFamily:"monospace",fontSize:12}}>{address?.address??"در حال دریافت آدرس واقعی provider…"}</div>{address?.memo&&<div style={{marginTop:8,fontFamily:"monospace"}}>Memo/Tag: {address.memo}</div>}<button disabled={!address?.address} onClick={()=>address?.address&&navigator.clipboard?.writeText(address.address)} className="w-btn w-btn-ghost" style={{marginTop:8}}>کپی آدرس</button>{address&&!address.safeForAutomaticAttribution&&<div style={{marginTop:12,padding:11,borderRadius:9,background:"rgba(217,119,6,.08)",color:"#b45309",fontSize:11,lineHeight:1.8}}>این آدرس برای اعتباردهی خودکار امن نیست و واریز پس از تطبیق دستی مدیریت انجام می‌شود.</div>}</div></div></div>;
}

// ── Withdraw Toman Tab// ── Withdraw Toman Tab ─────────────────────────────
function WithdrawTomanTab({ kycStatus }: { kycStatus:KycStatus }) {
  const [amount,setAmount]=useState(""),[cards,setCards]=useState<any[]>([]),[assetId,setAssetId]=useState(""),[cardId,setCardId]=useState(""),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
  useEffect(()=>{const token=getWebToken();if(!token)return;Promise.all([fetch(ANSARRAF_API_BASE+"/api/v1/funding/cards",{headers:{authorization:"Bearer "+token}}).then(r=>r.json()),fetch(ANSARRAF_API_BASE+"/api/v1/assets").then(r=>r.json())]).then(([cb,ab])=>{setCards(Array.isArray(cb.cards)?cb.cards:[]);const a=(ab.assets??[]).find((x:any)=>x.asset_type==="fiat"&&["TMN","TOMAN","IRR"].includes(String(x.symbol).toUpperCase()));if(a)setAssetId(String(a.id));}).catch(()=>setMsg("اطلاعات برداشت در دسترس نیست."));},[]);
  if(kycStatus!=="verified")return <KycGate kycStatus={kycStatus}/>;
  const submit=async()=>{const token=getWebToken();if(!token)return;setBusy(true);setMsg("");try{const card=cards.find(x=>String(x.id)===cardId);const r=await fetch(ANSARRAF_API_BASE+"/api/v1/withdrawals",{method:"POST",headers:{authorization:"Bearer "+token,"content-type":"application/json"},body:JSON.stringify({assetId:Number(assetId),amount:amount.replace(/,/g,""),network:"BANK_CARD",destination:"CARD:"+cardId+":"+String(card?.last4??""),destinationCardId:Number(cardId),idempotencyKey:crypto.randomUUID()})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error??"withdrawal_failed");setMsg("درخواست برداشت ثبت شد و برای بررسی و پرداخت مدیریت ارسال شد.");setAmount("");}catch(e){setMsg(e instanceof Error?e.message:"withdrawal_failed");}finally{setBusy(false);}};
  return <div style={{maxWidth:520,padding:"24px 0"}}><h2 style={{fontSize:18,fontWeight:900,marginBottom:20}}>برداشت تومان</h2><div className="w-card" style={{padding:22}}><label style={{fontSize:11,fontWeight:700}}>کارت مقصد</label><select className="w-input" value={cardId} onChange={e=>setCardId(e.target.value)} style={{marginTop:6}}><option value="">انتخاب کارت تأییدشده</option>{cards.map((card:any)=><option key={card.id} value={card.id}>{card.bankName??"بانک"} · ****{card.last4}</option>)}</select><label style={{fontSize:11,fontWeight:700,display:"block",marginTop:12}}>مبلغ (تومان)</label><input value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9]/g,""))} className="w-input" inputMode="numeric" placeholder="مبلغ واقعی"/>{msg&&<div style={{marginTop:12,color:"#b45309",fontSize:12,lineHeight:1.8}}>{msg}</div>}<button disabled={busy||!cardId||!assetId||!amount} onClick={()=>void submit()} className="w-btn w-btn-primary" style={{width:"100%",marginTop:14}}>{busy?"در حال ثبت…":"ثبت درخواست برداشت"}</button>{cards.length===0&&<div style={{marginTop:10,fontSize:11,color:"var(--w-muted)"}}>فقط کارت‌های ثبت‌شده و تأییدشده مالک قابل انتخاب هستند.</div>}</div></div>;
}

// ── Withdraw Coin Tab// ── Withdraw Coin Tab ──────────────────────────────
function WithdrawCoinTab({ assets, kycStatus }: { assets:CryptoAsset[]; kycStatus:KycStatus }) {
  const [selAsset,setSelAsset]=useState<CryptoAsset|null>(assets[0]??null),[networks,setNetworks]=useState<string[]>([]),[network,setNetwork]=useState(""),[address,setAddress]=useState(""),[memo,setMemo]=useState(""),[wAmount,setWAmount]=useState(""),[balance,setBalance]=useState<Record<string,number>>({}),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
  const token=getWebToken();
  useEffect(()=>{if(!token||!selAsset)return;void sarrafWalletMap().then(setBalance).catch(()=>{});fetch(ANSARRAF_API_BASE+"/api/v1/crypto/deposit-networks?asset="+encodeURIComponent(selAsset.symbol),{headers:{authorization:"Bearer "+token}}).then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error??"networks_unavailable");const ns=Array.isArray(d.networks)?d.networks:[];setNetworks(ns);setNetwork(ns[0]??"");}).catch(e=>setMsg(e instanceof Error?e.message:"networks_unavailable"));},[selAsset?.id,token]);
  if(kycStatus!=="verified")return <KycGate kycStatus={kycStatus}/>;
  if(!selAsset)return <div style={{padding:40,color:"var(--w-muted)"}}>ارزی برای نمایش وجود ندارد.</div>;
  const available=Number(balance[selAsset.symbol]??0);
  const submit=async()=>{if(!token)return;setBusy(true);setMsg("");try{const r=await fetch(ANSARRAF_API_BASE+"/api/v1/withdrawals",{method:"POST",headers:{authorization:"Bearer "+token,"content-type":"application/json"},body:JSON.stringify({assetId:Number(selAsset.id),amount:wAmount,network,destination:address.trim(),memo:memo.trim()||undefined,idempotencyKey:crypto.randomUUID()})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error??"withdrawal_failed");setMsg("درخواست برداشت ثبت شد و پس از کنترل‌های امنیتی و تأیید مدیریت پردازش می‌شود.");setWAmount("");setAddress("");}catch(e){setMsg(e instanceof Error?e.message:"withdrawal_failed");}finally{setBusy(false);}};
  const filtered=assets.filter(a=>a.symbol.includes((address?"": "").toUpperCase())||true).slice(0,30);
  return <div style={{display:"flex",gap:20,padding:"24px 0",alignItems:"flex-start"}}><div style={{width:220,flexShrink:0}}><div style={{fontSize:14,fontWeight:800,marginBottom:10}}>انتخاب رمزارز</div><div style={{background:"var(--w-card)",border:"1px solid var(--w-border)",borderRadius:10,overflow:"hidden",maxHeight:360,overflowY:"auto"}}>{filtered.map(a=><div key={a.id} onClick={()=>setSelAsset(a)} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",cursor:"pointer",background:selAsset.id===a.id?"rgba(8,145,178,0.08)":"transparent",borderBottom:"1px solid var(--w-border)"}}><div style={{width:24,height:24,borderRadius:"50%",background:a.logoColor,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:8,fontWeight:900}}>{a.symbol.slice(0,3)}</div><div><div style={{fontSize:12,fontWeight:700}}>{a.symbol}</div><div style={{fontSize:10,color:"var(--w-muted)"}}>{a.nameFa}</div></div></div>)}</div></div><div style={{flex:1,maxWidth:520}}><h2 style={{fontSize:17,fontWeight:900,marginBottom:16}}>برداشت {selAsset.symbol}</h2><div className="w-card" style={{padding:22}}><label style={{fontSize:11,fontWeight:700}}>شبکه</label><div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"8px 0 14px"}}>{networks.map(n=><button key={n} onClick={()=>setNetwork(n)} className={network===n?"w-btn w-btn-primary":"w-btn w-btn-ghost"} style={{padding:"7px 14px"}}>{n}</button>)}</div><label style={{fontSize:11,fontWeight:700}}>آدرس مقصد</label><input value={address} onChange={e=>setAddress(e.target.value)} placeholder={"آدرس "+selAsset.symbol+" روی "+network} className="w-input" style={{marginTop:6,fontFamily:"monospace"}}/><label style={{fontSize:11,fontWeight:700,display:"block",marginTop:12}}>Memo / Tag (در صورت نیاز شبکه)</label><input value={memo} onChange={e=>setMemo(e.target.value)} className="w-input" style={{marginTop:6,fontFamily:"monospace"}} placeholder="اگر provider برای این شبکه اعلام کرد وارد کنید"/><label style={{fontSize:11,fontWeight:700,display:"block",marginTop:12}}>مقدار</label><input value={wAmount} onChange={e=>setWAmount(e.target.value)} className="w-input" inputMode="decimal" placeholder="مقدار واقعی"/><div style={{fontSize:11,color:"var(--w-muted)",marginTop:7}}>موجودی قابل برداشت: {available.toFixed(8)} {selAsset.symbol}</div>{msg&&<div style={{marginTop:12,color:"#b45309",fontSize:12,lineHeight:1.8}}>{msg}</div>}<button disabled={busy||!network||!address.trim()||!wAmount} onClick={()=>void submit()} className="w-btn w-btn-primary" style={{width:"100%",marginTop:14}}>{busy?"در حال ثبت…":"ثبت درخواست برداشت"}</button></div></div></div>;
}

// ── Orders Tab// ── Orders Tab ─────────────────────────────────────
function OrdersTab({orders}:{orders:any[]}) {
  const [activeTab,setActiveTab]=useState<"open"|"history">("open");
  const rows=activeTab==="open"?orders.filter(o=>["open","partially_filled"].includes(String(o.status))):orders;
  return <div style={{padding:"20px 0"}}>
    <div style={{display:"flex",gap:12,marginBottom:16}}>
      {(["open","history"] as const).map(t=><button key={t} onClick={()=>setActiveTab(t)} className={t===activeTab?"w-btn w-btn-primary":"w-btn w-btn-ghost"} style={{padding:"8px 20px"}}>{t==="open"?"سفارشات باز":"تاریخچه سفارشات"}</button>)}
    </div>
    <div className="w-card" style={{overflow:"auto"}}>
      {rows.length===0?<div style={{padding:60,textAlign:"center",color:"var(--w-muted)"}}>داده‌ای برای نمایش وجود ندارد.</div>:
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr style={{background:"var(--w-card2)"}}>{["شناسه","نوع","مقدار","قیمت","وضعیت","تاریخ"].map(h=><th key={h} style={{padding:10,textAlign:"right"}}>{h}</th>)}</tr></thead><tbody>{rows.map((o:any)=><tr key={o.id} style={{borderBottom:"1px solid var(--w-border)"}}><td style={{padding:10,fontFamily:"monospace"}}>{o.id}</td><td style={{padding:10}}>{o.side==="buy"?"خرید":"فروش"} {o.order_type}</td><td style={{padding:10}}>{String(o.quantity)}</td><td style={{padding:10}}>{o.price?String(o.price):"بازار"}</td><td style={{padding:10}}>{String(o.status)}</td><td style={{padding:10,color:"var(--w-muted)"}}>{new Date(o.created_at).toLocaleString("fa-IR")}</td></tr>)}</tbody></table>}
    </div>
  </div>;
}

// ── Transactions Tab// ── Transactions Tab ───────────────────────────────
function TransactionsTab({ orders, deposits, withdrawals, onSelectTx }: { orders:any[]; deposits:any[]; withdrawals:any[]; onSelectTx:(tx:any)=>void }) {
  const [txType,setTxType]=useState("all");
  const rows=[
    ...orders.map((o:any)=>({type:o.side==="buy"?"خرید":"فروش",amount:String(o.quantity),date:o.created_at,status:String(o.status),txid:"order-"+o.id,color:o.side==="buy"?"#10b981":"#f43f5e",raw:o})),
    ...deposits.map((d:any)=>({type:"واریز",amount:String(d.amount)+" "+String(d.symbol??""),date:d.created_at,status:String(d.status),txid:d.external_reference??("deposit-"+d.id),color:"#0891b2",raw:d})),
    ...withdrawals.map((w:any)=>({type:"برداشت",amount:"-"+String(w.amount)+" "+String(w.symbol??""),date:w.created_at,status:String(w.status),txid:w.external_reference??("withdrawal-"+w.id),color:"#d97706",raw:w}))
  ].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime());
  const filtered=txType==="all"?rows:rows.filter(x=>x.type===txType);
  return <div style={{padding:"20px 0"}}>
    <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
      {["all","خرید","فروش","واریز","برداشت"].map(t=><button key={t} onClick={()=>setTxType(t)} className={txType===t?"w-btn w-btn-primary":"w-btn w-btn-ghost"} style={{padding:"7px 16px",fontSize:12}}>{t==="all"?"همه":t}</button>)}
    </div>
    <div className="w-card" style={{overflow:"auto"}}>
      {filtered.length===0?<div style={{padding:60,textAlign:"center",color:"var(--w-muted)"}}>تراکنشی ثبت نشده است.</div>:
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr style={{background:"var(--w-card2)"}}>{["نوع","مقدار","تاریخ","وضعیت","شناسه","جزئیات"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"right",color:"var(--w-muted)",fontWeight:600,fontSize:11}}>{h}</th>)}</tr></thead><tbody>{filtered.map((tx:any,i:number)=><tr key={tx.txid+"-"+i} style={{borderBottom:"1px solid var(--w-border)"}}><td style={{padding:"12px 14px"}}><span style={{padding:"3px 10px",borderRadius:6,background:tx.color+"15",color:tx.color,fontSize:12,fontWeight:700}}>{tx.type}</span></td><td style={{padding:"12px 14px",fontWeight:800,color:tx.color}}>{tx.amount}</td><td style={{padding:"12px 14px",color:"var(--w-muted)",fontSize:12}}>{new Date(tx.date).toLocaleString("fa-IR")}</td><td style={{padding:"12px 14px"}}>{tx.status}</td><td style={{padding:"12px 14px",fontSize:11,color:"var(--w-muted)",fontFamily:"monospace"}}>{tx.txid}</td><td style={{padding:"12px 14px"}}><button onClick={()=>onSelectTx(tx)} className="w-btn w-btn-muted" style={{padding:"4px 12px",fontSize:11}}>مشاهده</button></td></tr>)}</tbody></table>}
    </div>
  </div>;
}

// ── Transaction Detail View// ── Transaction Detail View ────────────────────────
function TxDetailView({ tx, onBack }: { tx:any; onBack:()=>void }) {
  const [copied,setCopied]=useState(false);
  const copyReceipt=async()=>{
    const text=[String(tx.type??""),String(tx.amount??""),String(tx.status??""),String(tx.txid??""),String(tx.date??"")].join(" · ");
    try{await navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),1500);}catch{}
  };
  return (
    <div style={{ padding:"24px 0", maxWidth:500 }}>
      <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontSize:13, fontWeight:600, marginBottom:20 }}>
        <WI n="arrow-right" s={14}/> بازگشت به تراکنش‌ها
      </button>
      <div className="w-card" style={{ padding:"28px" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:`${tx.color}15`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", color:tx.color }}>
            <WI n={tx.type==="خرید"?"trending-up":tx.type==="فروش"?"trending-down":tx.type==="واریز"?"deposit":"withdraw"} s={28}/>
          </div>
          <div style={{ fontSize:22, fontWeight:900, color:tx.color }}>{tx.amount}</div>
          <div style={{ fontSize:13, color:"var(--w-muted)", marginTop:4 }}>{tx.type} — {tx.date}</div>
        </div>
        {[["وضعیت",tx.status],["شناسه تراکنش",tx.txid],["کارمزد",tx.fee!=null?String(tx.fee):"—"],["زمان ثبت",tx.date]].map(([k,v])=>(
          <div key={k as string} style={{ display:"flex", justifyContent:"space-between", padding:"12px 0", borderBottom:"1px solid var(--w-border)", fontSize:13 }}>
            <span style={{ color:"var(--w-muted)" }}>{k}</span>
            <span style={{ fontWeight:700, fontFamily:k==="شناسه تراکنش"?"monospace":undefined }}>{v}</span>
          </div>
        ))}
        <div style={{ display:"flex", gap:8, marginTop:20 }}>
          <button onClick={()=>void copyReceipt()} className="w-btn w-btn-ghost" style={{ flex:1, padding:"10px" }}><WI n="copy" s={14}/> {copied?"کپی شد":"کپی اطلاعات تراکنش"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Fees Tab ───────────────────────────────────────
function FeesTab() {
  const [data,setData]=useState<any>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
  useEffect(()=>{let active=true;const load=async()=>{const token=getWebToken();if(!token){if(active){setData(null);setLoading(false)}return}try{const r=await fetch(ANSARRAF_API_BASE+"/api/v1/fees",{headers:{authorization:"Bearer "+token,accept:"application/json"},cache:"no-store"});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error??"fee_rules_unavailable");if(active){setData(d);setError("");}}catch(e){if(active)setError(e instanceof Error?e.message:"fee_rules_unavailable")}finally{if(active)setLoading(false)}};void load();const id=window.setInterval(()=>{if(active)void load()},15000);return()=>{active=false;clearInterval(id)}},[]);
  const customerRules=Array.isArray(data?.customerRules)?data.customerRules:[],providerRules=Array.isArray(data?.providerRules)?data.providerRules:[];
  const pct=(v:any)=>{const n=Number(v);return Number.isFinite(n)?(n*100).toLocaleString("fa-IR",{maximumFractionDigits:6})+"٪":"—";};
  const money=(v:any)=>{const n=Number(v);return Number.isFinite(n)?n.toLocaleString("fa-IR",{maximumFractionDigits:8}):"—";};
  const opLabel=(v:string)=>({trade:"معامله",deposit:"واریز",withdrawal:"برداشت",transfer:"انتقال"} as any)[v]??v;
  return <div style={{padding:"24px 0"}}>
    <div style={{fontSize:18,fontWeight:900,marginBottom:8}}>کارمزدهای واقعی آن صراف</div>
    <div style={{fontSize:11,color:"var(--w-muted)",marginBottom:18,lineHeight:1.8}}>تنظیمات فعال از Backend خوانده می‌شود و هر تغییر مدیر حداکثر طی چند ثانیه در این صفحه منعکس می‌شود.</div>
    {error&&<div className="w-card" style={{padding:14,color:"#b45309",marginBottom:12}}>{error}</div>}
    {loading?<div className="w-card" style={{padding:22,color:"var(--w-muted)"}}>در حال دریافت قوانین کارمزد...</div>:<>
      <div className="w-card" style={{overflow:"hidden",marginBottom:16}}>
        <div style={{padding:14,fontWeight:800,borderBottom:"1px solid var(--w-border)"}}>کارمزد کاربران</div>
        {customerRules.length===0?<div style={{padding:18,color:"var(--w-muted)",fontSize:12}}>هیچ قانون فعالی ثبت نشده است.</div>:
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr style={{background:"var(--w-card2)"}}>{["عملیات","بازار","دارایی","درصد","ثابت","حداقل","حداکثر","ارز کارمزد"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"right",color:"var(--w-muted)",fontWeight:600,fontSize:10}}>{h}</th>)}</tr></thead>
          <tbody>{customerRules.map((x:any)=><tr key={x.id} style={{borderBottom:"1px solid var(--w-border)"}}><td style={{padding:"10px 12px",fontWeight:700}}>{opLabel(x.operation_type)}</td><td style={{padding:"10px 12px"}}>{x.market_symbol??"همه"}</td><td style={{padding:"10px 12px"}}>{x.asset_symbol??"همه"}</td><td style={{padding:"10px 12px"}}>{pct(x.percentage)}</td><td style={{padding:"10px 12px"}}>{money(x.fixed_amount)}</td><td style={{padding:"10px 12px"}}>{x.min_amount==null?"—":money(x.min_amount)}</td><td style={{padding:"10px 12px"}}>{x.max_amount==null?"—":money(x.max_amount)}</td><td style={{padding:"10px 12px"}}>{x.fee_asset_symbol??"—"}</td></tr>)}</tbody>
        </table>}
      </div>
      <div className="w-card" style={{overflow:"hidden"}}><div style={{padding:14,fontWeight:800,borderBottom:"1px solid var(--w-border)"}}>کارمزد Provider</div>{providerRules.length===0?<div style={{padding:18,color:"var(--w-muted)",fontSize:12}}>هیچ قانون کارمزد Provider فعال ثبت نشده است.</div>:<table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr style={{background:"var(--w-card2)"}}>{["Provider","بازار","سمت","Maker","Taker","مبلغ ثابت","دارایی"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"right",color:"var(--w-muted)",fontWeight:600,fontSize:10}}>{h}</th>)}</tr></thead><tbody>{providerRules.map((x:any)=><tr key={x.id} style={{borderBottom:"1px solid var(--w-border)"}}><td style={{padding:"10px 12px"}}>{x.provider_code}</td><td style={{padding:"10px 12px"}}>{x.market_symbol??"همه بازارها"}</td><td style={{padding:"10px 12px"}}>{x.side??"همه"}</td><td style={{padding:"10px 12px"}}>{pct(x.maker_rate)}</td><td style={{padding:"10px 12px"}}>{pct(x.taker_rate)}</td><td style={{padding:"10px 12px"}}>{money(x.fixed_fee)}</td><td style={{padding:"10px 12px"}}>{x.fee_asset_symbol??"—"}</td></tr>)}</tbody></table>}</div>
    </>}
  </div>;
}
function SecurityTab() {
  const [kyc,setKyc]=useState<string>("loading");
  useEffect(()=>{
    let active=true;
    const token=getWebToken();
    if(!token){setKyc("unauthenticated");return;}
    fetch(ANSARRAF_API_BASE+"/api/v1/kyc",{headers:{authorization:"Bearer "+token,accept:"application/json"},cache:"no-store"})
      .then(r=>r.ok?r.json():Promise.reject(new Error("kyc_status_unavailable")))
      .then(d=>{if(active)setKyc(String(d?.kyc?.status??"unverified"));})
      .catch(()=>{if(active)setKyc("unavailable")});
    return()=>{active=false};
  },[]);
  const label=kyc==="verified"?"تأییدشده":kyc==="pending"?"در انتظار بررسی":kyc==="rejected"?"ردشده":kyc==="unverified"?"تأیید نشده":kyc==="loading"?"در حال دریافت…":"در دسترس نیست";
  return (
    <div style={{padding:"24px 0",maxWidth:650}}>
      <div style={{fontSize:18,fontWeight:900,marginBottom:8}}>امنیت حساب</div>
      <div style={{fontSize:12,color:"var(--w-muted)",lineHeight:1.8,marginBottom:18}}>
        این بخش فقط وضعیت‌هایی را نمایش می‌دهد که Backend آن صراف واقعاً ارائه می‌کند؛ هیچ وضعیت امنیتی ساختگی یا «فعال» فرضی نمایش داده نمی‌شود.
      </div>
      <div className="w-card" style={{padding:18,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:800}}>وضعیت احراز هویت</div>
        <div style={{marginTop:8,fontSize:13,color:kyc==="verified"?"#059669":kyc==="rejected"?"#dc2626":"var(--w-muted)"}}>{label}</div>
      </div>
      <div className="w-card" style={{padding:18}}>
        <div style={{fontSize:13,fontWeight:800,marginBottom:8}}>کنترل‌های امنیتی حساب</div>
        <div style={{fontSize:12,color:"var(--w-muted)",lineHeight:1.9}}>
          ۲FA مستقل، کد ضد‌فیشینگ و مدیریت دستگاه‌های آن صراف هنوز Backend اجرایی اختصاصی ندارند؛ بنابراین کنترل نمایشی یا وضعیت جعلی برای آن‌ها ارائه نمی‌شود.
          این قابلیت‌ها در ممیزی امنیتی جداگانه باید با احراز هویت، ذخیره‌سازی امن و lifecycle واقعی پیاده‌سازی شوند.
        </div>
      </div>
    </div>
  );
}
// ── Trade Select Tab ───────────────────────────────

function TradeSelectTab({asset,onInstant,onSpot,onMargin,isLoggedIn,onAuth}:{asset:CryptoAsset;onInstant:()=>void;onSpot:()=>void;onMargin:()=>void;isLoggedIn:boolean;onAuth:()=>void}) {
 const cards=[
  {id:"instant",label:"خرید/فروش لحظه‌ای",desc:"معامله واقعی از طریق Backend و موجودی واقعی.",onClick:isLoggedIn?onInstant:onAuth,color:"#059669",badge:"فعال"},
  {id:"spot",label:"معامله اسپات",desc:"سفارش بازار یا لیمیت با دفتر سفارش واقعی.",onClick:onSpot,color:"#0891b2",badge:"فعال"},
  {id:"margin",label:"معامله تعهدی",desc:"تا اتصال کامل API اجرایی Margin والکس غیرفعال است؛ اهرم ساختگی نداریم.",onClick:isLoggedIn?onMargin:onAuth,color:"#7c3aed",badge:"غیرفعال"}
 ];
 return <div style={{padding:"32px 0"}}><h2 style={{fontSize:22,fontWeight:900}}>انتخاب نوع معامله</h2><p style={{color:"var(--w-muted)"}}>{asset.symbol}/USDT · قیمت زنده: {asset.price>0?fmtP(asset.price):"—"}</p><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>{cards.map(x=><button key={x.id} onClick={x.onClick} className="w-card" style={{padding:22,textAlign:"right",cursor:"pointer"}}><div style={{fontSize:16,fontWeight:900}}>{x.label}</div><div style={{fontSize:12,color:"var(--w-muted)",margin:"10px 0"}}>{x.desc}</div><span style={{fontSize:10,color:x.color}}>{x.badge}</span></button>)}</div></div>;
}


function InstantTradeTab({asset,onBack,isLoggedIn,onAuth,kycStatus}:{asset:CryptoAsset;onBack:()=>void;isLoggedIn:boolean;onAuth:()=>void;kycStatus:KycStatus}) {
 const [side,setSide]=useState<"buy"|"sell">("buy"),[amount,setAmount]=useState(""),[balance,setBalance]=useState<Record<string,number>>({}),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
 useEffect(()=>{if(isLoggedIn)void sarrafWalletMap().then(setBalance).catch(()=>{});},[isLoggedIn]);
 const available=side==="buy"?Number(balance.USDT||0):Number(balance[asset.symbol]||0);
 const submit=async()=>{if(!isLoggedIn){onAuth();return;}if(kycStatus!=="verified"){setMsg("احراز هویت برای معامله الزامی است.");return;}const v=Number(amount);if(!Number.isFinite(v)||v<=0||v>available){setMsg("مقدار نامعتبر یا موجودی ناکافی است.");return;}if(!asset.price||asset.price<=0){setMsg("قیمت زنده در دسترس نیست.");return;}setBusy(true);try{const r=await sarrafPlaceOrder(asset.symbol,"USDT",side,"market",side==="buy"?v/asset.price:v,undefined,side==="buy"?v:undefined);setMsg("سفارش واقعی ثبت شد: "+String(r?.order?.id??"ثبت‌شده"));setAmount("");void sarrafWalletMap().then(setBalance).catch(()=>{});}catch(e){setMsg(e instanceof Error?e.message:"order_failed");}finally{setBusy(false);}};
 return <div style={{padding:"24px 0",maxWidth:500}}><button onClick={onBack} className="w-btn w-btn-ghost">بازگشت</button><div className="w-card" style={{padding:22,marginTop:12}}><h2>معامله آنی {asset.symbol}</h2><div style={{color:"var(--w-muted)",fontSize:12}}>قیمت زنده: {asset.price>0?fmtP(asset.price):"—"} USDT</div><div style={{display:"flex",gap:5,margin:"14px 0"}}><button onClick={()=>setSide("buy")} className="w-btn w-btn-primary">خرید</button><button onClick={()=>setSide("sell")} className="w-btn w-btn-ghost">فروش</button></div><input className="w-input" value={amount} onChange={e=>setAmount(e.target.value)} placeholder={side==="buy"?"مبلغ USDT":"مقدار "+asset.symbol} inputMode="decimal"/><div style={{fontSize:11,color:"var(--w-muted)",margin:"8px 0"}}>موجودی: {available} {side==="buy"?"USDT":asset.symbol}</div>{msg&&<div style={{fontSize:11,color:"#b45309"}}>{msg}</div>}<button disabled={busy} onClick={()=>void submit()} className="w-btn w-btn-primary" style={{width:"100%",marginTop:12}}>{busy?"در حال ثبت…":"ثبت معامله واقعی"}</button></div></div>;
}

function SupportTab({ isLoggedIn, onAuth }: { isLoggedIn:boolean; onAuth:()=>void }) {
  const [tickets,setTickets]=useState<any[]>([]),[selected,setSelected]=useState<any>(null),[subject,setSubject]=useState(""),[body,setBody]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const load=useCallback(async()=>{if(!isLoggedIn)return;const token=getWebToken();if(!token)return;try{const r=await fetch(PLATFORM_API_BASE+"/api/v1/support/tickets",{headers:{authorization:"Bearer "+token},cache:"no-store"});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error??"support_unavailable");setTickets(Array.isArray(d.tickets)?d.tickets:[]);setError("");}catch(e){setError(e instanceof Error?e.message:"support_unavailable");}},[isLoggedIn]);
  useEffect(()=>{void load();},[load]);
  const openTicket=async(id:number)=>{const token=getWebToken();if(!token)return;const r=await fetch(PLATFORM_API_BASE+"/api/v1/support/tickets/"+id,{headers:{authorization:"Bearer "+token}});const d=await r.json().catch(()=>({}));if(r.ok)setSelected(d);};
  const create=async()=>{if(!subject.trim()||!body.trim())return;setBusy(true);try{const token=getWebToken();const r=await fetch(PLATFORM_API_BASE+"/api/v1/support/tickets",{method:"POST",headers:{authorization:"Bearer "+token,"content-type":"application/json"},body:JSON.stringify({subject,message:body})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error??"ticket_creation_failed");setSubject("");setBody("");await load();setSelected({ticket:d.ticket,messages:[]});}catch(e){setError(e instanceof Error?e.message:"ticket_creation_failed");}finally{setBusy(false);}};
  const send=async()=>{if(!selected?.ticket?.id||!message.trim())return;setBusy(true);try{const token=getWebToken();const r=await fetch(PLATFORM_API_BASE+"/api/v1/support/tickets/"+selected.ticket.id+"/messages",{method:"POST",headers:{authorization:"Bearer "+token,"content-type":"application/json"},body:JSON.stringify({message})});if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d?.error??"support_message_failed");}setMessage("");await openTicket(selected.ticket.id);}catch(e){setError(e instanceof Error?e.message:"support_message_failed");}finally{setBusy(false);}};
  if(!isLoggedIn)return <div style={{textAlign:"center",padding:60}}><WI n="comment" s={40} style={{opacity:.2,marginBottom:16}}/><div style={{fontSize:16,fontWeight:800}}>ورود برای مشاهده تیکت‌ها</div><button onClick={onAuth} className="w-btn w-btn-primary" style={{marginTop:12}}>ورود / ثبت‌نام</button></div>;
  if(selected && selected.ticket?.id!==0)return <div style={{padding:"20px 0",maxWidth:700}}><button onClick={()=>setSelected(null)} className="w-btn w-btn-ghost">بازگشت</button><div className="w-card" style={{marginTop:12,padding:18}}><div style={{fontWeight:900}}>{selected.ticket.subject}</div><div style={{fontSize:11,color:"var(--w-muted)",marginTop:4}}>{selected.ticket.status}</div><div style={{marginTop:18}}>{(selected.messages??[]).map((m:any)=><div key={m.id} style={{padding:10,marginBottom:8,borderRadius:9,background:"var(--w-card2)"}}><div>{m.message}</div><div style={{fontSize:10,color:"var(--w-muted)",marginTop:4}}>{new Date(m.created_at).toLocaleString("fa-IR")} · {m.sender_role}</div></div>)}</div>{selected.ticket.status!=="closed"&&<div style={{display:"flex",gap:8,marginTop:12}}><input value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void send()}} className="w-input" placeholder="پیام خود را بنویسید..."/><button disabled={busy||!message.trim()} onClick={()=>void send()} className="w-btn w-btn-primary">ارسال</button></div>}</div></div>;
  return <div style={{padding:"20px 0",maxWidth:700}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><div style={{fontSize:16,fontWeight:900}}>تیکت‌های پشتیبانی</div><button onClick={()=>setSelected({ticket:{id:0,subject:"تیکت جدید",status:"new"},messages:[]})} className="w-btn w-btn-primary">تیکت جدید +</button></div>{error&&<div style={{color:"#dc2626",fontSize:12,marginBottom:10}}>{error}</div>}{tickets.map((t:any)=><button key={t.id} onClick={()=>void openTicket(t.id)} className="w-card" style={{width:"100%",display:"flex",justifyContent:"space-between",padding:14,marginBottom:8,textAlign:"right",border:"1px solid var(--w-border)",cursor:"pointer"}}><span><b>{t.subject}</b><div style={{fontSize:11,color:"var(--w-muted)",marginTop:4}}>{t.status} · {new Date(t.updated_at).toLocaleString("fa-IR")}</div></span><span>›</span></button>)}{tickets.length===0&&<div style={{padding:40,textAlign:"center",color:"var(--w-muted)"}}>هنوز تیکتی ندارید.</div>}{selected?.ticket?.id===0&&<div className="w-card" style={{padding:18,marginTop:12}}><input value={subject} onChange={e=>setSubject(e.target.value)} className="w-input" placeholder="موضوع"/><textarea value={body} onChange={e=>setBody(e.target.value)} className="w-input" rows={5} style={{marginTop:8}} placeholder="شرح مشکل"/><button disabled={busy||!subject.trim()||!body.trim()} onClick={()=>void create()} className="w-btn w-btn-primary" style={{marginTop:10,width:"100%"}}>ارسال تیکت</button></div>}</div>;
}

// ── Guide Tab// ── Guide Tab ──────────────────────────────────────
function GuideTab() {
  const [videos,setVideos]=useState<any[]>([]);
  const [selected,setSelected]=useState<any|null>(null);
  const [error,setError]=useState("");
  const API=PLATFORM_API_BASE;
  useEffect(()=>{
    let active=true;
    (async()=>{
      try{
        const r=await fetch(API+"/api/v1/content/videos?limit=20&category=sarraf-guide",{cache:"no-store"});
        const d=await r.json().catch(()=>({}));
        if(!r.ok)throw new Error(d?.error??"guide_unavailable");
        const rows=Array.isArray(d?.videos)?d.videos:[];
        if(active){setVideos(rows);setSelected(rows[0]??null);setError("");}
      }catch(e){if(active){setVideos([]);setSelected(null);setError(e instanceof Error?e.message:"guide_unavailable");}}
    })();
    return()=>{active=false};
  },[API]);
  const videoUrl=selected?.id?API+"/api/v1/content/videos/"+encodeURIComponent(String(selected.id)):"";
  const duration=(n:any)=>Number.isFinite(Number(n))&&Number(n)>0?new Date(Number(n)*1000).toISOString().slice(14,19):"";
  return (
    <div style={{padding:"24px 0",display:"flex",gap:24,alignItems:"flex-start"}}>
      <div style={{flex:1}}>
        <div className="w-card" style={{overflow:"hidden",marginBottom:16}}>
          {selected&&videoUrl?(
            <video key={selected.id} src={videoUrl} controls preload="metadata" style={{width:"100%",display:"block",background:"#0a0a12",maxHeight:520}}/>
          ):(
            <div style={{minHeight:320,display:"flex",alignItems:"center",justifyContent:"center",background:"#0a0a12",color:"var(--w-muted)",padding:30,textAlign:"center"}}>
              {error?"راهنمای ویدئویی در حال حاضر در دسترس نیست.":"هنوز ویدئوی آموزشی منتشر نشده است."}
            </div>
          )}
          {selected&&<div style={{padding:"14px 16px"}}>
            <div style={{fontSize:15,fontWeight:900}}>{selected.title}</div>
            {selected.description&&<div style={{fontSize:12,color:"var(--w-muted)",lineHeight:1.8,marginTop:6}}>{selected.description}</div>}
            {duration(selected.duration_seconds)&&<div style={{fontSize:10,color:"var(--w-muted)",marginTop:6}}>مدت: {duration(selected.duration_seconds)}</div>}
          </div>}
        </div>
      </div>
      <div style={{width:280}}>
        <div style={{fontSize:14,fontWeight:800,marginBottom:12}}>فهرست دروس</div>
        <div className="w-card" style={{overflow:"hidden"}}>
          {videos.length===0?<div style={{padding:20,color:"var(--w-muted)",fontSize:12,lineHeight:1.8}}>ویدئوی آموزشی واقعی برای این بخش منتشر نشده است.</div>:
          videos.map((v:any,i:number)=>(
            <button key={v.id} onClick={()=>setSelected(v)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"12px 14px",border:0,borderBottom:i<videos.length-1?"1px solid var(--w-border)":"none",cursor:"pointer",background:selected?.id===v.id?"rgba(8,145,178,0.06)":"transparent",textAlign:"right",fontFamily:"Vazirmatn",color:"var(--w-text)"}}>
              <div style={{width:28,height:28,borderRadius:8,background:"rgba(8,145,178,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#0891b2"}}><WI n="play" s={12}/></div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:selected?.id===v.id?700:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.title}</div>
                {duration(v.duration_seconds)&&<div style={{fontSize:10,color:"var(--w-muted)",marginTop:1}}>{duration(v.duration_seconds)}</div>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Forex Bot Tab ──────────────────────────────────

export default function WebSarraf({ onNavigate, kycStatus: initialKycStatus, onAuthRequired, isLoggedIn }: SarrafProps) {
  const [tab, setTab]               = useState<SarrafTab>("markets");
  const [liveAssets, setLiveAssets] = useState<CryptoAsset[]>([]);
  const [selectedAsset, setAsset]   = useState<CryptoAsset>({ id:"", symbol:"", name:"", nameFa:"", logoColor:"#0891b2", price:0, priceIrt:0, change24h:0, volume24h:0, marketCap:0, high24h:0, low24h:0, rank:0 });
  const [search, setSearch]         = useState("");
  const [sortBy, setSortBy]         = useState<"rank"|"price"|"change"|"volume">("rank");
  const [filterFav, setFilterFav]   = useState(false);
  const [favorites, setFavorites]   = useState<Set<string>>(new Set());
  const [tradeType, setTradeType]   = useState<"buy"|"sell">("buy");
  const [tradeMode, setTradeMode]   = useState<"market"|"limit"|"stop-limit">("market");
  const [price, setPrice]           = useState("");
  const [amount, setAmount]         = useState("");
  const [coinDetail, setCoinDetail] = useState<CryptoAsset|null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [wallets, setWallets] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [backendKycStatus, setBackendKycStatus] = useState<KycStatus | null>(null);
  const isMobile = useIsMobile(900);

  useEffect(() => {
    if (!isLoggedIn) return;
    const token = getWebToken();
    if (!token) return;
    let active = true;
    const headers = { authorization: `Bearer ${token}` };
    const loadAccount = async () => {
      try {
        const [walletR, orderR, depositR, withdrawalR, kycR] = await Promise.all([
          fetch(`${ANSARRAF_API_BASE}/api/v1/wallets`, { headers, cache: "no-store" }),
          fetch(`${ANSARRAF_API_BASE}/api/v1/orders`, { headers, cache: "no-store" }),
          fetch(`${ANSARRAF_API_BASE}/api/v1/deposits`, { headers, cache: "no-store" }),
          fetch(`${ANSARRAF_API_BASE}/api/v1/withdrawals`, { headers, cache: "no-store" }),
          fetch(`${ANSARRAF_API_BASE}/api/v1/kyc`, { headers, cache: "no-store" }),
        ]);
        if (!active) return;
        if (walletR.ok) setWallets((await walletR.json()).wallets ?? []);
        if (orderR.ok) setOrders((await orderR.json()).orders ?? []);
        if (depositR.ok) setDeposits((await depositR.json()).deposits ?? []);
        if (withdrawalR.ok) setWithdrawals((await withdrawalR.json()).withdrawals ?? []);
        if (kycR.ok) {
          const status = (await kycR.json()).kyc?.status;
          if (status === "VERIFIED" || status === "verified") setBackendKycStatus("verified");
          else if (status === "PENDING" || status === "pending" || status === "SUBMITTED" || status === "submitted") setBackendKycStatus("pending");
          else if (status) setBackendKycStatus("not_verified");
        }
      } catch {
        // Protected account data remains empty rather than being replaced with demo data.
      }
    };
    void loadAccount();
    const id = window.setInterval(() => void loadAccount(), 5000);
    return () => { active = false; window.clearInterval(id); };
  }, [isLoggedIn]);

  const effectiveKycStatus = backendKycStatus ?? initialKycStatus;

  useEffect(() => {
    let active = true;
    const loadAssets = async () => {
      try {
        const r = await fetch(ANSARRAF_API_BASE + "/api/v1/assets", { cache: "no-store" });
        if (!r.ok) throw new Error("assets_unavailable");
        const rows = (await r.json()).assets ?? [];
        const mapped: CryptoAsset[] = rows
          .filter((x:any) => String(x.assetType ?? x.asset_type ?? "crypto").toLowerCase() === "crypto")
          .map((x:any, i:number) => ({
            id:String(x.id), symbol:String(x.symbol).toUpperCase(), name:String(x.name ?? x.symbol),
            nameFa:String(x.nameFa ?? x.name ?? x.symbol), logoUrl:x.logoUrl ?? undefined,
            logoColor:String(x.logoColor ?? "#0891b2"), price:0, priceIrt:0,
            change24h:0, volume24h:0, marketCap:0, high24h:0, low24h:0, rank:Number(x.rank ?? i+1)
          }));
        if (!active) return;
        setLiveAssets(mapped);
        setAsset(prev => prev.symbol ? (mapped.find(a=>a.symbol===prev.symbol) ?? prev) : (mapped[0] ?? prev));
      } catch {
        if (active) setLiveAssets([]);
      }
    };
    void loadAssets();
    const id = window.setInterval(() => void loadAssets(), 30000);
    return () => { active = false; window.clearInterval(id); };
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const r = await fetch(`${ANSARRAF_API_BASE}/api/v1/market-data/quotes`, { signal: AbortSignal.timeout(7000), cache: "no-store" });
        if (!r.ok) throw new Error("market_data_unavailable");
        const d = await r.json();
        const quotes = Array.isArray(d?.quotes) ? d.quotes : [];
        const live = quotes.filter((q: any) => !q.stale && Number(q.lastPrice) > 0);
        const bySymbol = new Map<string, any>();
        for (const q of live) {
          const current = bySymbol.get(q.symbol);
          if (!current || q.provider === "wallex") bySymbol.set(q.symbol, q);
        }
        const tomanRate = Number(bySymbol.get("USDT/TOMAN")?.lastPrice || 0);
        if (!active) return;
        setLiveAssets(previous => previous.map(a => {
          if (a.symbol === "USDT") {
             const q=bySymbol.get("USDT/TOMAN");
             return { ...a, price: tomanRate, priceIrt: tomanRate, change24h:Number(q?.change24h??q?.change_percent??q?.change??0)||0, volume24h:Number(q?.volume24h??q?.volume_24h??q?.volume??0)||0, high24h:Number(q?.high24h??q?.high_24h??q?.high??0)||0, low24h:Number(q?.low24h??q?.low_24h??q?.low??0)||0 };
           }
          const usdt = bySymbol.get(`${a.symbol}/USDT`);
          const toman = bySymbol.get(`${a.symbol}/TOMAN`);
          const price = usdt ? Number(usdt.lastPrice) : 0;
          const priceIrt = toman ? Number(toman.lastPrice) : (price > 0 && tomanRate > 0 ? price * tomanRate : 0);
          const change=usdt?.change24h??usdt?.change_percent??usdt?.change??0;
           const volume=usdt?.volume24h??usdt?.volume_24h??usdt?.volume??0;
           const marketCap=usdt?.marketCap??usdt?.market_cap??0;
           const high=usdt?.high24h??usdt?.high_24h??usdt?.high??0;
           const low=usdt?.low24h??usdt?.low_24h??usdt?.low??0;
           return { ...a, price, priceIrt, change24h:Number(change)||0, volume24h:Number(volume)||0, marketCap:Number(marketCap)||0, high24h:Number(high)||0, low24h:Number(low)||0 };
        }));
      } catch {
        // Keep verified backend data already rendered; never synthesize a mock quote.
      }
    };
    void load();
    const id = window.setInterval(() => void load(), 5000);
    return () => { active = false; window.clearInterval(id); };
  }, []);

  useEffect(() => {
    const next = liveAssets.find(a => a.id === selectedAsset.id);
    if (next) setAsset(next);
  }, [liveAssets, selectedAsset.id]);

  const filtered = useMemo(() => {
    let list = liveAssets.filter(a =>
      (!filterFav || favorites.has(a.id)) &&
      (search === "" ||
        a.symbol.toLowerCase().includes(search.toLowerCase()) ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.nameFa.includes(search))
    );
    if (sortBy === "price")   list = [...list].sort((a,b) => b.price - a.price);
    if (sortBy === "change")  list = [...list].sort((a,b) => b.change24h - a.change24h);
    if (sortBy === "volume")  list = [...list].sort((a,b) => b.volume24h - a.volume24h);
    return list;
  }, [search, filterFav, favorites, sortBy]);

  const toggleFav = useCallback((id: string) => {
    setFavorites(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }, []);

  const selectAndTrade = (a: CryptoAsset) => { setAsset(a); setTab("trade-select"); };

  const needsLogin = !isLoggedIn;
  const needsKyc   = isLoggedIn && effectiveKycStatus !== "verified";

  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [recentTrades, setRecentTrades] = useState<{ price:number; amount:number; side:"buy"|"sell"; time:string }[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!selectedAsset.symbol) return;
      try {
        const symbol = `${selectedAsset.symbol}/USDT`;
        const [bookResponse, tradesResponse] = await Promise.all([
          fetch(`${ANSARRAF_API_BASE}/api/v1/orderbook?symbol=${encodeURIComponent(symbol)}&limit=20`, { signal: AbortSignal.timeout(5000), cache: "no-store" }),
          fetch(`${ANSARRAF_API_BASE}/api/v1/market-data/trades?symbol=${encodeURIComponent(symbol)}&limit=20`, { signal: AbortSignal.timeout(5000), cache: "no-store" }),
        ]);
        if (!bookResponse.ok) throw new Error("orderbook_unavailable");
        const d = await bookResponse.json();
        const td = tradesResponse.ok ? await tradesResponse.json() : null;
        if (!active) return;
        setBids(Array.isArray(d?.bids) ? d.bids.map((x: any) => ({ price: Number(x.price), amount: Number(x.amount), total: Number(x.total) })) : []);
        setAsks(Array.isArray(d?.asks) ? d.asks.map((x: any) => ({ price: Number(x.price), amount: Number(x.amount), total: Number(x.total) })) : []);
        setRecentTrades(Array.isArray(td?.trades) ? td.trades.map((x: any) => ({ price: Number(x.price), amount: Number(x.quantity), side: x.side === "buy" ? "buy" : "sell", time: new Date(x.created_at).toLocaleTimeString("fa-IR", { minute: "2-digit", second: "2-digit" }) })) : []);
      } catch {
        if (active) { setBids([]); setAsks([]); setRecentTrades([]); }
      }
    };
    void load();
    const id = window.setInterval(() => void load(), 3000);
    return () => { active = false; window.clearInterval(id); };
  }, [selectedAsset.symbol]);  const PROTECTED_TABS: SarrafTab[] = ["assets","deposit","deposit-coin","withdraw","withdraw-coin","orders","transactions","security","forexbot"];
  const PROTECTED = PROTECTED_TABS.includes(tab);

  const navItems = TAB_GROUPS.flatMap(g => g.items);

  const handleTabSelect = (id: SarrafTab) => {
    if (PROTECTED_TABS.includes(id) && needsLogin) {
      onAuthRequired(); return;
    }
    setTab(id);
    setDrawerOpen(false);
  };

  const SidebarContent = () => (
    <>
      {TAB_GROUPS.map(g => (
        <div key={g.label} style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"var(--w-muted)", padding:"0 14px 4px", textTransform:"uppercase", letterSpacing:0.5 }}>{g.label}</div>
          {g.items.map(item => (
            <button key={item.id} onClick={()=>handleTabSelect(item.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:tab===item.id?"rgba(8,145,178,0.1)":"transparent", border:"none", cursor:"pointer", color:tab===item.id?"#0891b2":"var(--w-muted)", fontSize:14, fontWeight:tab===item.id?700:500, borderRight:tab===item.id?"2px solid #0891b2":"2px solid transparent", fontFamily:"Vazirmatn", textAlign:"right", transition:"all 0.12s" }}>
              <WI n={item.icon} s={15}/>{item.label}
            </button>
          ))}
        </div>
      ))}
    </>
  );

  return (
    <div className="w-fade" dir="rtl" style={{ minHeight:"calc(100vh - var(--w-header))", display:"flex", flexDirection:"column" }}>
      {/* Mobile drawer overlay */}
      {isMobile && drawerOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:300, display:"flex" }}>
          <div onClick={()=>setDrawerOpen(false)} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)" }}/>
          <div style={{ position:"relative", width:260, background:"var(--w-surface)", borderLeft:"1px solid var(--w-border)", height:"100%", overflowY:"auto", paddingTop:16, zIndex:1 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 14px 12px", borderBottom:"1px solid var(--w-border)", marginBottom:8 }}>
              <span style={{ fontSize:16, fontWeight:900, color:"#0891b2" }}>آن صراف</span>
              <button onClick={()=>setDrawerOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontSize:20, lineHeight:1 }}>×</button>
            </div>
            <SidebarContent/>
          </div>
        </div>
      )}

      {/* Platform header bar */}
      <div style={{ background:"var(--w-surface)", borderBottom:"1px solid var(--w-border)" }}>
        <div style={{ maxWidth:1480, margin:"0 auto", padding:isMobile?"0 12px":"0 20px", display:"flex", alignItems:"center", gap:isMobile?8:12, height:isMobile?48:52 }}>
          {/* Mobile hamburger */}
          {isMobile && (
            <button onClick={()=>setDrawerOpen(true)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--w-text)", padding:"4px 2px", display:"flex", alignItems:"center" }}>
              <WI n="menu" s={20}/>
            </button>
          )}
          {/* Brand */}
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:"rgba(8,145,178,0.12)", border:"1px solid rgba(8,145,178,0.22)", display:"flex", alignItems:"center", justifyContent:"center", color:"#0891b2" }}>
              <WI n="sarraf" s={14}/>
            </div>
            <span style={{ fontSize:isMobile?14:15, fontWeight:900 }}>آن صراف</span>
          </div>
          {!isMobile && <div style={{ width:1, height:18, background:"var(--w-border)" }}/>}
          {/* Live tickers — hidden on very small mobile */}
          {!isMobile && (
            <div style={{ display:"flex", gap:20, overflow:"hidden" }}>
              {liveAssets.slice(0,5).map(a => (
                <div key={a.id} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, cursor:"pointer" }} onClick={()=>{setAsset(a);setTab("trade-select");}}>
                  <span style={{ fontWeight:700, color:"var(--w-muted)" }}>{a.symbol}/USDT</span>
                  <span style={{ fontWeight:900 }}>${fmtP(a.price)}</span>
                  <span style={{ color:clr(a.change24h), fontWeight:700, fontSize:11 }}>{a.change24h>0?"+":""}{a.change24h.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          )}
          {isMobile && (
            <div style={{ flex:1, display:"flex", gap:12, overflow:"hidden" }}>
              {liveAssets.slice(0,2).map(a => (
                <div key={a.id} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, cursor:"pointer", flexShrink:0 }} onClick={()=>{setAsset(a);setTab("trade-select");}}>
                  <span style={{ fontWeight:700, color:"var(--w-muted)" }}>{a.symbol}</span>
                  <span style={{ fontWeight:900 }}>${fmtP(a.price)}</span>
                  <span style={{ color:clr(a.change24h), fontWeight:700, fontSize:10 }}>{a.change24h>0?"+":""}{a.change24h.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginRight:"auto", display:"flex", gap:8, alignItems:"center" }}>
            {!isLoggedIn && (
              <button onClick={onAuthRequired} className="w-btn w-btn-primary" style={{ padding:isMobile?"5px 10px":"6px 16px", fontSize:isMobile?11:12 }}>
                {isMobile ? "ورود" : <><WI n="user" s={13}/> ورود / ثبت‌نام</>}
              </button>
            )}
            {!isMobile && (
              <button onClick={()=>onNavigate("home")} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                <WI n="arrow-right" s={13}/> آن پرداز
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex:1, display:"flex", maxWidth:1480, margin:"0 auto", width:"100%", padding:isMobile?"0":"0 20px", gap:0, paddingBottom:isMobile?64:0 }}>
        {/* Desktop left sidebar — navigation */}
        <aside style={{ width:200, flexShrink:0, borderLeft:"1px solid var(--w-border)", paddingTop:12, position:"sticky", top:"calc(var(--w-header) + 52px)", height:"calc(100vh - var(--w-header) - 52px)", overflowY:"auto", background:"var(--w-surface)" }}>
          <SidebarContent/>
        </aside>

        {/* Main content */}
        <div style={{ flex:1, overflow:"hidden", minWidth:0 }}>
          {/* ── Markets ── */}
          {tab === "markets" && (
            <div style={{ padding:"16px 0" }}>
              {coinDetail ? (
                <CoinDetailView asset={coinDetail} onBack={()=>setCoinDetail(null)} onTrade={()=>{setAsset(coinDetail);setCoinDetail(null);setTab("trade-select");}} isFav={favorites.has(coinDetail.id)} onToggleFav={()=>toggleFav(coinDetail.id)}/>
              ) : (
                <MarketsTab
                  assets={filtered} search={search} onSearch={setSearch}
                  sortBy={sortBy} onSort={setSortBy}
                  filterFav={filterFav} onFilterFav={setFilterFav}
                  favorites={favorites} onToggleFav={toggleFav}
                  onSelectTrade={selectAndTrade}
                  onSelectDetail={setCoinDetail}
                  totalCount={liveAssets.length}
                />
              )}
            </div>
          )}
          {/* ── Trade Type Selection ── */}
          {tab === "trade-select" && (
            <TradeSelectTab
              asset={selectedAsset}
              onInstant={()=>setTab("instant")}
              onSpot={()=>setTab("spot")}
              onMargin={()=>setTab("margin")}
              isLoggedIn={isLoggedIn}
              onAuth={onAuthRequired}
            />
          )}
          {/* ── Instant Trade ── */}
          {tab === "instant" && (
            <InstantTradeTab asset={selectedAsset} onBack={()=>setTab("trade-select")} isLoggedIn={isLoggedIn} onAuth={onAuthRequired} kycStatus={effectiveKycStatus}/>
          )}
          {/* ── Spot Trade ── */}
          {tab === "spot" && (
            <div style={{ display:"flex", gap:0, height:"calc(100vh - var(--w-header) - 52px)" }}>
              <TradeView
                asset={selectedAsset} asks={asks} bids={bids}
                tradeType={tradeType} onTradeType={setTradeType}
                tradeMode={tradeMode} onTradeMode={setTradeMode}
                price={price} onPrice={setPrice}
                amount={amount} onAmount={setAmount}
                isLoggedIn={isLoggedIn} needsKyc={needsKyc}
                onAuth={onAuthRequired}
                onSelectAsset={()=>setTab("markets")}
                assets={liveAssets.slice(0,20)} onAssetChange={setAsset}
                recentTrades={recentTrades}
                favorites={favorites} onToggleFav={toggleFav}
                tradeKind="spot"
                onBack={()=>setTab("trade-select")}
              />
            </div>
          )}
          {/* ── Margin Trade ── */}
          {tab === "margin" && (
            <div style={{ display:"flex", gap:0, height:"calc(100vh - var(--w-header) - 52px)" }}>
              <TradeView
                asset={selectedAsset} asks={asks} bids={bids}
                tradeType={tradeType} onTradeType={setTradeType}
                tradeMode={tradeMode} onTradeMode={setTradeMode}
                price={price} onPrice={setPrice}
                amount={amount} onAmount={setAmount}
                isLoggedIn={isLoggedIn} needsKyc={needsKyc}
                onAuth={onAuthRequired}
                onSelectAsset={()=>setTab("markets")}
                assets={liveAssets.slice(0,20)} onAssetChange={setAsset}
                favorites={favorites} onToggleFav={toggleFav}
                tradeKind="margin"
                onBack={()=>setTab("trade-select")}
              />
            </div>
          )}
          {tab === "forexbot" && isLoggedIn && (
            <ForexBotTab asset={selectedAsset}/>
          )}
          {/* ── Protected tabs gate ── */}
          {PROTECTED && needsLogin && (
            <AuthGate onAuth={onAuthRequired}/>
          )}
          {tab === "assets" && isLoggedIn && (
            <AssetsTab assets={liveAssets.slice(0,12)} wallets={wallets} kycStatus={effectiveKycStatus} onDeposit={()=>setTab("deposit")} onWithdraw={()=>setTab("withdraw")} onDepositCoin={()=>setTab("deposit-coin")} onWithdrawCoin={()=>setTab("withdraw-coin")}/>
          )}
          {tab === "deposit" && isLoggedIn && (
            <DepositTomanTab kycStatus={effectiveKycStatus}/>
          )}
          {tab === "deposit-coin" && isLoggedIn && (
            <DepositCoinTab assets={liveAssets} kycStatus={effectiveKycStatus}/>
          )}
          {tab === "withdraw" && isLoggedIn && (
            <WithdrawTomanTab kycStatus={effectiveKycStatus}/>
          )}
          {tab === "withdraw-coin" && isLoggedIn && (
            <WithdrawCoinTab assets={liveAssets} kycStatus={effectiveKycStatus}/>
          )}
          {tab === "orders" && isLoggedIn && (
            <OrdersTab orders={orders}/>
          )}
          {tab === "transactions" && isLoggedIn && (
            selectedTx
              ? <TxDetailView tx={selectedTx} onBack={()=>setSelectedTx(null)}/>
              : <TransactionsTab orders={orders} deposits={deposits} withdrawals={withdrawals} onSelectTx={setSelectedTx}/>
          )}
          {tab === "fees" && (
            <FeesTab/>
          )}
          {tab === "security" && isLoggedIn && (
            <SecurityTab/>
          )}
          {tab === "support" && (
            <SupportTab isLoggedIn={isLoggedIn} onAuth={onAuthRequired}/>
          )}
          {tab === "guide" && (
            <GuideTab/>
          )}
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      {isMobile && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:200, background:"var(--w-surface)", borderTop:"1px solid var(--w-border)", display:"flex", height:64, alignItems:"stretch" }}>
          {navItems.slice(0,5).map(item => (
            <button key={item.id} onClick={()=>handleTabSelect(item.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, background:"none", border:"none", cursor:"pointer", color:tab===item.id?"#0891b2":"var(--w-muted)", fontFamily:"Vazirmatn", transition:"color 0.12s", padding:"4px 0" }}>
              <WI n={item.icon} s={tab===item.id?22:19}/>
              <span style={{ fontSize:10, fontWeight:tab===item.id?800:500 }}>{item.label}</span>
            </button>
          ))}
          <button onClick={()=>setDrawerOpen(true)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontFamily:"Vazirmatn" }}>
            <WI n="menu" s={19}/>
            <span style={{ fontSize:10, fontWeight:500 }}>بیشتر</span>
          </button>
        </div>
      )}
    </div>
  );
}

