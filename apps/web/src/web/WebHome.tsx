// ─────────────────────────────────────────────────
// An Pardaz Web Portal — Homepage
// ─────────────────────────────────────────────────
import { useEffect, useState } from "react";
import WI from "./WebIcons";
import type { WebPage } from "./types";

const FA = (s: string | number) => String(s).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]);
const fmt = (n: number) => n >= 1_000_000_000 ? `${(n/1_000_000_000).toFixed(1)}B` : n >= 1_000_000 ? `${(n/1_000_000).toFixed(0)}M` : n >= 1_000 ? `${(n/1_000).toFixed(0)}K` : String(n);
const fmtPrice = (n: number) => n.toLocaleString("en-US");

// ── Platform cards ────────────────────────────────
const PLATFORMS = [
  { id:"sarraf", label:"آن صراف", desc:"خرید و فروش رمزارز با زیرساخت واقعی.", icon:"sarraf", color:"#0891b2", grad:"linear-gradient(135deg,rgba(8,145,178,0.12),rgba(6,182,212,0.05))", border:"rgba(8,145,178,0.22)" },
  { id:"market", label:"آن مارکت", desc:"بازار آنلاین محصولات فناوری و دیجیتال.", icon:"market", color:"#d97706", grad:"linear-gradient(135deg,rgba(217,119,6,0.12),rgba(245,158,11,0.05))", border:"rgba(217,119,6,0.22)" },
  { id:"banner", label:"آن بنر", desc:"سامانه آگهی‌های ایران.", icon:"banner", color:"#e8354e", grad:"linear-gradient(135deg,rgba(232,53,78,0.12),rgba(244,63,94,0.05))", border:"rgba(232,53,78,0.22)" },
  { id:"hoosh", label:"آن هوش", desc:"پلتفرم هوش مصنوعی و تولید محتوا.", icon:"hoosh", color:"#7c3aed", grad:"linear-gradient(135deg,rgba(124,58,237,0.12),rgba(139,92,246,0.05))", border:"rgba(124,58,237,0.22)" },
];

// ── Feature categories (homepage discovery) ───────
const FEATURES = [
  { title:"اخبار ایران", icon:"newspaper", color:"#0891b2", cat:"iran-news" },
  { title:"اخبار ارزهای دیجیتال", icon:"sarraf", color:"#0891b2", cat:"crypto" },
  { title:"اخبار هوش مصنوعی", icon:"hoosh", color:"#7c3aed", cat:"ai" },
  { title:"اخبار تکنولوژی", icon:"cpu", color:"#6366f1", cat:"tech" },
  { title:"اخبار محصولات جدید", icon:"package", color:"#d97706", cat:"product" },
  { title:"آموزش ارزهای دیجیتال", icon:"graduation", color:"#0891b2", cat:"edu" },
  { title:"آموزش هوش مصنوعی", icon:"sparkle", color:"#7c3aed", cat:"edu-ai" },
  { title:"آموزش فارکس", icon:"chart-line", color:"#059669", cat:"forex" },
  { title:"مرکز ویدئو", icon:"play-circle", color:"#e8354e", cat:"video" },
] as const;

interface HomeProps { onNavigate: (p: WebPage) => void; }

export default function WebHome({ onNavigate }: HomeProps) {
  const API=(import.meta.env.VITE_PLATFORM_API_URL??"").replace(/\/$/,"");
  const [news,setNews]=useState<any[]>([]);
  const [education,setEducation]=useState<any[]>([]);
  const [videos,setVideos]=useState<any[]>([]);
  const [assets,setAssets]=useState<any[]>([]);
  useEffect(()=>{
    let active=true;
    Promise.all([
      fetch(API+"/api/v1/news?limit=6",{cache:"no-store"}).then(r=>r.ok?r.json():{items:[]}),
      fetch(API+"/api/v1/news?limit=3&category=education",{cache:"no-store"}).then(r=>r.ok?r.json():{items:[]}),
      fetch(API+"/api/v1/content/videos?limit=4",{cache:"no-store"}).then(r=>r.ok?r.json():{videos:[]}),
      fetch((((import.meta.env as any).VITE_ANSARRAF_API_URL??"") as string).replace(/\/$/,"")+"/api/v1/market-data/quotes",{cache:"no-store"}).then(r=>r.ok?r.json():{quotes:[]})
    ]).then(([n,e,v,q])=>{if(!active)return;setNews(n.items??[]);setEducation(e.items??[]);setVideos(v.videos??[]);setAssets(q.quotes??q.items??[])}).catch(()=>{});
    return()=>{active=false};
  },[API]);
  return (
    <div className="w-fade" style={{ direction:"rtl" }}>

      {/* ── HERO ──────────────────────────────────── */}
      <section style={{ position:"relative", overflow:"hidden", background:"var(--w-surface)", paddingBottom:80 }}>
        {/* Background glow */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-200, right:-100, width:800, height:800, borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,0.09) 0%,transparent 65%)" }}/>
          <div style={{ position:"absolute", top:100, left:-200, width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(8,145,178,0.07) 0%,transparent 65%)" }}/>
          {/* grid pattern */}
          <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(var(--w-border) 1px,transparent 1px),linear-gradient(90deg,var(--w-border) 1px,transparent 1px)", backgroundSize:"48px 48px", opacity:0.5 }}/>
        </div>

        <div style={{ maxWidth:1280, margin:"0 auto", padding:"clamp(40px,8vw,80px) clamp(16px,3vw,24px) 40px", position:"relative" }}>
          {/* Badge */}
          <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
            <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:20, background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.25)", color:"var(--w-accent)", fontSize:12, fontWeight:700 }}>
              <WI n="sparkle" s={12}/> اکوسیستم مالی و تکنولوژی ایران
            </span>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize:"clamp(28px,5vw,56px)", fontWeight:900, textAlign:"center", lineHeight:1.25, margin:"0 auto 20px", maxWidth:800, background:"linear-gradient(135deg,var(--w-text) 40%,var(--w-accent))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
            پیشرفته‌ترین پلتفرم مالی و هوش مصنوعی ایران
          </h1>
          <p style={{ fontSize:"clamp(14px,2vw,18px)", color:"var(--w-muted)", textAlign:"center", maxWidth:640, margin:"0 auto 40px", lineHeight:1.8 }}>
            آن پرداز — از صرافی دیجیتال تا هوش مصنوعی، از بازار آنلاین تا آگهی‌های سراسری. یک اکوسیستم کامل برای زندگی دیجیتال.
          </p>

          {/* CTA */}
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", marginBottom:60 }}>
            <button onClick={() => onNavigate("sarraf")} className="w-btn w-btn-primary" style={{ padding:"13px 28px", fontSize:15, borderRadius:12 }}>
              <WI n="sarraf" s={18}/> شروع معامله
            </button>
            <button onClick={() => onNavigate("hoosh")} className="w-btn w-btn-outline" style={{ padding:"13px 28px", fontSize:15, borderRadius:12 }}>
              <WI n="sparkle" s={18}/> امتحان آن هوش
            </button>
            <button onClick={() => onNavigate("download")} className="w-btn w-btn-ghost" style={{ padding:"13px 24px", fontSize:15, borderRadius:12 }}>
              <WI n="download" s={18}/> دانلود اپلیکیشن
            </button>
          </div>

          {/* Live ticker */}
          <div style={{ background:"var(--w-card)", border:"1px solid var(--w-border)", borderRadius:14, padding:"12px 20px", display:"flex", gap:0, overflowX:"auto" }} className="w-noscroll">
            {assets.slice(0,8).map((a, i) => (
              <div key={a.id} style={{ flexShrink:0, padding:"4px 20px", borderLeft: i < 7 ? "1px solid var(--w-border)" : "none", display:"flex", flexDirection:"column", alignItems:"center", gap:2, minWidth:90 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)" }}>{a.symbol}</div>
                <div style={{ fontSize:13, fontWeight:800, color:"var(--w-text)" }}>${fmtPrice(a.price)}</div>
                <div style={{ fontSize:11, fontWeight:700, color: a.change24h >= 0 ? "#059669" : "#dc2626" }}>
                  {a.change24h >= 0 ? "+" : ""}{a.change24h.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORMS ──────────────────────────────── */}
      <section style={{ maxWidth:1280, margin:"0 auto", padding:"clamp(40px,6vw,64px) clamp(16px,3vw,24px)" }}>
        <SectionHeader title="پلتفرم‌های آن پرداز" subtitle="پنج اکوسیستم قدرتمند، یک تجربه یکپارچه" />
        <div className="w-platforms-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:16 }}>
          {PLATFORMS.map(p => (
            <button key={p.id} onClick={() => onNavigate(p.id as WebPage)} className="w-platform-card" style={{ display:"flex", flexDirection:"column", padding:"24px", borderRadius:18, background:p.grad, border:`1px solid ${p.border}`, cursor:"pointer", textAlign:"right", transition:"all 0.18s", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:-24, left:-24, width:120, height:120, borderRadius:"50%", background:`radial-gradient(circle,${p.color}18 0%,transparent 70%)`, pointerEvents:"none" }}/>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <div style={{ padding:"10px", borderRadius:12, background:`${p.color}14`, border:`1px solid ${p.color}28`, color:p.color }}>
                  <WI n={p.icon} s={22}/>
                </div>
                <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:`${p.color}14`, color:p.color, border:`1px solid ${p.color}28` }}>{p.stats}</span>
              </div>
              <div style={{ fontSize:18, fontWeight:900, color:"var(--w-text)", marginBottom:8 }}>{p.label}</div>
              <div style={{ fontSize:13, color:"var(--w-muted)", lineHeight:1.65, flex:1 }}>{p.desc}</div>
              <div style={{ marginTop:16, display:"flex", alignItems:"center", gap:4, color:p.color, fontSize:12, fontWeight:700 }}>
                ورود به {p.label} <WI n="chevron-left" s={13} w={2}/>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── MARKET INDICES ──────────────────────────── */}
      <section style={{ background:"var(--w-surface)", padding:"clamp(24px,4vw,40px) 0", borderTop:"1px solid var(--w-border)", borderBottom:"1px solid var(--w-border)" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 clamp(16px,3vw,24px)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"var(--w-muted)" }}>شاخص‌های جهانی</div>
            <button onClick={() => onNavigate("sarraf")} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--w-accent)", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:4 }}>
              سبد ارز دیجیتال <WI n="chevron-left" s={12} w={2}/>
            </button>
          </div>
          <div style={{ display:"flex", gap:16, overflowX:"auto" }} className="w-noscroll">
            {[] .map((idx: any) => (
              <div key={idx.name} style={{ flexShrink:0, padding:"16px 20px", background:"var(--w-card2)", border:"1px solid var(--w-border)", borderRadius:12, minWidth:160 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", marginBottom:6 }}>{idx.nameFa}</div>
                <div style={{ fontSize:18, fontWeight:900, color:"var(--w-text)", marginBottom:4 }}>
                  {idx.name === "USD/IRR" ? FA(idx.value.toLocaleString()) : idx.value.toLocaleString()}
                </div>
                <div style={{ fontSize:12, fontWeight:700, color: idx.changePercent >= 0 ? "#059669" : "#dc2626", display:"flex", alignItems:"center", gap:3 }}>
                  <WI n={idx.changePercent >= 0 ? "trending-up" : "trending-down"} s={12}/>
                  {idx.changePercent >= 0 ? "+" : ""}{idx.changePercent.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CRYPTO TOP 10 ────────────────────────────── */}
      <section style={{ maxWidth:1280, margin:"0 auto", padding:"clamp(32px,5vw,64px) clamp(16px,3vw,24px)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
          <SectionHeader title="برترین رمزارزها" subtitle="قیمت لحظه‌ای بازار" compact/>
          <button onClick={() => onNavigate("sarraf")} className="w-btn w-btn-outline" style={{ padding:"8px 16px", fontSize:12 }}>
            همه رمزارزها <WI n="chevron-left" s={13}/>
          </button>
        </div>
        {/* Desktop table */}
        <div className="w-card w-crypto-table-desktop" style={{ overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:"var(--w-card2)" }}>
                {["رتبه","نام","قیمت","تغییر ۲۴ ساعت","حجم ۲۴ ساعت","ارزش بازار","معامله"].map(h => (
                  <th key={h} style={{ padding:"12px 16px", textAlign:"right", fontWeight:700, color:"var(--w-muted)", fontSize:11, letterSpacing:"0.03em", borderBottom:"1px solid var(--w-border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assets.slice(0,10).map((a, i) => (
                <tr key={a.id} onClick={() => onNavigate("sarraf")} style={{ borderBottom:"1px solid var(--w-border)", cursor:"pointer", transition:"background 0.12s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--w-card2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding:"14px 16px", color:"var(--w-muted)", fontWeight:600 }}>{FA(i+1)}</td>
                  <td style={{ padding:"14px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:"50%", background:`${a.logoColor}18`, border:`1.5px solid ${a.logoColor}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:a.logoColor }}>{a.symbol.slice(0,2)}</div>
                      <div>
                        <div style={{ fontWeight:800, color:"var(--w-text)" }}>{a.name}</div>
                        <div style={{ fontSize:11, color:"var(--w-muted)" }}>{a.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"14px 16px", fontWeight:800, fontVariantNumeric:"tabular-nums" }}>${fmtPrice(a.price)}</td>
                  <td style={{ padding:"14px 16px" }}>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:3, padding:"3px 8px", borderRadius:6, background: a.change24h >= 0 ? "rgba(5,150,105,0.1)" : "rgba(220,38,38,0.1)", color: a.change24h >= 0 ? "#059669" : "#dc2626", fontWeight:700, fontSize:12 }}>
                      <WI n={a.change24h >= 0 ? "trending-up" : "trending-down"} s={11}/>{a.change24h >= 0 ? "+" : ""}{a.change24h.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ padding:"14px 16px", color:"var(--w-muted)" }}>${fmt(a.volume24h)}</td>
                  <td style={{ padding:"14px 16px", color:"var(--w-muted)" }}>${fmt(a.marketCap)}</td>
                  <td style={{ padding:"14px 16px" }}>
                    <button onClick={e => { e.stopPropagation(); onNavigate("sarraf"); }} className="w-btn w-btn-primary" style={{ padding:"6px 14px", fontSize:11, borderRadius:7 }}>معامله</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile card list */}
        <div className="w-crypto-table-mobile" style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {assets.slice(0,10).map((a, i) => (
            <button key={a.id} onClick={() => onNavigate("sarraf")} className="w-card" style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", border:"1px solid var(--w-border)", cursor:"pointer", textAlign:"right", width:"100%" }}>
              <div style={{ fontSize:12, color:"var(--w-muted)", fontWeight:700, width:20, flexShrink:0 }}>{FA(i+1)}</div>
              <div style={{ width:36, height:36, borderRadius:"50%", background:`${a.logoColor}18`, border:`1.5px solid ${a.logoColor}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:a.logoColor, flexShrink:0 }}>{a.symbol.slice(0,2)}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:800, color:"var(--w-text)" }}>{a.nameFa}</div>
                <div style={{ fontSize:11, color:"var(--w-muted)" }}>{a.symbol}</div>
              </div>
              <div style={{ textAlign:"left" }}>
                <div style={{ fontSize:13, fontWeight:800, fontVariantNumeric:"tabular-nums" }}>${fmtPrice(a.price)}</div>
                <div style={{ fontSize:11, fontWeight:700, color: a.change24h >= 0 ? "#059669" : "#dc2626" }}>{a.change24h >= 0 ? "+" : ""}{a.change24h.toFixed(2)}%</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── CONTENT HUB ─────────────────────────────── */}
      <section style={{ background:"var(--w-card2)", borderTop:"1px solid var(--w-border)", borderBottom:"1px solid var(--w-border)", padding:"64px 0" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 24px" }}>
          <SectionHeader title="مرکز محتوا" subtitle="آخرین اخبار، آموزش و ویدیو از دنیای ارز دیجیتال، هوش مصنوعی و تکنولوژی" />
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12, marginTop:32 }}>
            {FEATURES.map(f => (
              <button key={f.title} onClick={() => onNavigate(f.cat.startsWith("edu") || f.cat === "forex" ? "education" : f.cat === "video" ? "video" : "news")} style={{ padding:"20px 16px", background:"var(--w-card)", border:"1px solid var(--w-border)", borderRadius:14, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:10, transition:"all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = `${f.color}40`; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "var(--w-shadow-md)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--w-border)"; (e.currentTarget as HTMLButtonElement).style.transform = "none"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
              >
                <div style={{ width:44, height:44, borderRadius:12, background:`${f.color}14`, border:`1px solid ${f.color}28`, display:"flex", alignItems:"center", justifyContent:"center", color:f.color }}>
                  <WI n={f.icon} s={20}/>
                </div>
                <div style={{ fontSize:12, fontWeight:700, color:"var(--w-text)", textAlign:"center", lineHeight:1.4 }}>{f.title}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── LATEST NEWS ──────────────────────────────── */}
      <section style={{ maxWidth:1280, margin:"0 auto", padding:"64px 24px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32 }}>
          <SectionHeader title="آخرین اخبار" subtitle="" compact/>
          <button onClick={() => onNavigate("news")} className="w-btn w-btn-outline" style={{ padding:"8px 16px", fontSize:12 }}>
            همه اخبار <WI n="chevron-left" s={13}/>
          </button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:20 }}>
          {news.map((a:any) => (
            <ArticleCard key={a.id} article={a} onNavigate={onNavigate}/>
          ))}
        </div>
      </section>

      {/* ── EDUCATION PREVIEW ────────────────────────── */}
      <section style={{ background:"var(--w-surface)", borderTop:"1px solid var(--w-border)", padding:"64px 0" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 24px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32 }}>
            <SectionHeader title="آخرین آموزش‌ها" subtitle="" compact/>
            <button onClick={() => onNavigate("education")} className="w-btn w-btn-outline" style={{ padding:"8px 16px", fontSize:12 }}>
              همه آموزش‌ها <WI n="chevron-left" s={13}/>
            </button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:20 }}>
            {education.map((a:any) => (
              <ArticleCard key={a.id} article={a} onNavigate={onNavigate}/>
            ))}
          </div>
        </div>
      </section>

      {/* ── VIDEO PREVIEW ────────────────────────────── */}
      <section style={{ maxWidth:1280, margin:"0 auto", padding:"64px 24px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32 }}>
          <SectionHeader title="مرکز ویدئو" subtitle="" compact/>
          <button onClick={() => onNavigate("video")} className="w-btn w-btn-outline" style={{ padding:"8px 16px", fontSize:12 }}>
            همه ویدیوها <WI n="chevron-left" s={13}/>
          </button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
          {videos.map((v:any) => (
            <VideoCard key={v.id} video={v} onNavigate={onNavigate}/>
          ))}
        </div>
      </section>

      {/* ── AN HOOSH PROMO ─────────────────────────── */}
      <section style={{ background:"linear-gradient(135deg,rgba(124,58,237,0.08) 0%,rgba(109,40,217,0.04) 100%)", borderTop:"1px solid rgba(124,58,237,0.12)", borderBottom:"1px solid rgba(124,58,237,0.12)", padding:"72px 0" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 24px", display:"flex", alignItems:"center", gap:48, flexWrap:"wrap" }}>
          <div style={{ flex:"0 0 auto", width:80, height:80, borderRadius:22, background:"rgba(124,58,237,0.12)", border:"1px solid rgba(124,58,237,0.25)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--w-accent)" }}>
            <WI n="sparkle" s={38}/>
          </div>
          <div style={{ flex:1, minWidth:280 }}>
            <div style={{ fontSize:"clamp(20px,3vw,32px)", fontWeight:900, color:"var(--w-text)", marginBottom:12 }}>آن هوش — پلتفرم هوش مصنوعی</div>
            <div style={{ fontSize:"clamp(13px,2vw,16px)", color:"var(--w-muted)", lineHeight:1.8, maxWidth:600 }}>
              با ۲۲ مدل پیشرفته از OpenAI، Anthropic، Google، Meta، Mistral و Qwen — بسازید، بنویسید، طراحی کنید.
            </div>
          </div>
          <button onClick={() => onNavigate("hoosh")} className="w-btn w-btn-primary" style={{ padding:"14px 32px", fontSize:15, borderRadius:12, flexShrink:0 }}>
            <WI n="sparkle" s={18}/> امتحان رایگان
          </button>
        </div>
      </section>

      {/* ── APP DOWNLOAD ─────────────────────────────── */}
      <section style={{ maxWidth:1280, margin:"0 auto", padding:"72px 24px" }}>
        <div style={{ background:"var(--w-card)", border:"1px solid var(--w-border)", borderRadius:24, padding:"48px", textAlign:"center", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(var(--w-border) 1px,transparent 1px),linear-gradient(90deg,var(--w-border) 1px,transparent 1px)", backgroundSize:"40px 40px", opacity:0.4 }}/>
          <div style={{ position:"relative" }}>
            <div style={{ fontSize:"clamp(20px,3vw,32px)", fontWeight:900, marginBottom:12 }}>اپلیکیشن آن پرداز را دانلود کنید</div>
            <div style={{ fontSize:14, color:"var(--w-muted)", marginBottom:36, maxWidth:500, margin:"0 auto 36px" }}>
              کامل‌ترین تجربه آن پرداز در موبایل. همه پلتفرم‌ها در یک اپلیکیشن.
            </div>
            <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              {[
                { icon:"android", label:"Google Play",  sub:"دریافت از" },
                { icon:"android", label:"بازار",        sub:"دریافت از" },
                { icon:"android", label:"مایکت",        sub:"دریافت از" },
                { icon:"apple",   label:"App Store",    sub:"دریافت از" },
              ].map(x => (
                <button key={x.label} onClick={() => onNavigate("download")} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 22px", background:"var(--w-text)", border:"none", borderRadius:12, cursor:"pointer", color:"var(--w-surface)", minWidth:140 }}>
                  <WI n={x.icon} s={22}/>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:10, opacity:0.65 }}>{x.sub}</div>
                    <div style={{ fontSize:14, fontWeight:800 }}>{x.label}</div>
                  </div>
                </button>
              ))}
              <button onClick={() => window.location.reload()} style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 22px", background:"var(--w-card2)", border:"1.5px solid var(--w-border2)", borderRadius:12, cursor:"pointer", color:"var(--w-text)", fontWeight:700, fontSize:13 }}>
                <WI n="globe" s={20}/> ادامه در وب
              </button>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .w-platform-card:hover{transform:translateY(-3px);box-shadow:var(--w-shadow-md);}
      `}</style>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────

function SectionHeader({ title, subtitle, compact }: { title:string; subtitle:string; compact?:boolean }) {
  return (
    <div style={{ marginBottom: compact ? 0 : 32 }}>
      <h2 style={{ fontSize:"clamp(18px,3vw,26px)", fontWeight:900, color:"var(--w-text)", margin:"0 0 8px" }}>{title}</h2>
      {subtitle && <p style={{ fontSize:14, color:"var(--w-muted)", margin:0, lineHeight:1.6 }}>{subtitle}</p>}
    </div>
  );
}

const CAT_LABELS: Record<string,string> = {
  "crypto-news":"اخبار کریپتو","ai-news":"اخبار هوش مصنوعی","tech-news":"اخبار تکنولوژی",
  "product-news":"محصولات","crypto-edu":"آموزش کریپتو","ai-edu":"آموزش AI","forex-edu":"آموزش فارکس",
};
const CAT_COLORS: Record<string,string> = {
  "crypto-news":"#0891b2","ai-news":"#7c3aed","tech-news":"#6366f1",
  "product-news":"#d97706","crypto-edu":"#0891b2","ai-edu":"#7c3aed","forex-edu":"#059669",
};

function ArticleCard({ article, onNavigate }: { article:import("./types").Article; onNavigate:(p:WebPage)=>void }) {
  const cat = article.category;
  const color = CAT_COLORS[cat] ?? "#7c3aed";
  return (
    <button onClick={() => onNavigate(article.type === "news" ? "news" : "education")} className="w-card" style={{ display:"flex", flexDirection:"column", padding:0, overflow:"hidden", cursor:"pointer", textAlign:"right", transition:"all 0.15s", border:"1px solid var(--w-border)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "var(--w-shadow-md)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "none"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "var(--w-shadow)"; }}
    >
      {/* Thumbnail placeholder */}
      <div style={{ height:160, background:`linear-gradient(135deg,${color}16,${color}08)`, borderBottom:"1px solid var(--w-border)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
        <WI n={cat.includes("ai")?"sparkle":cat.includes("crypto")?"sarraf":cat.includes("forex")?"chart-line":"newspaper"} s={40} style={{ color:`${color}50` }}/>
        <span style={{ position:"absolute", top:12, right:12, background:`${color}14`, color, border:`1px solid ${color}28`, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>
          {CAT_LABELS[cat] ?? cat}
        </span>
        {article.level && (
          <span style={{ position:"absolute", top:12, left:12, background:"rgba(0,0,0,0.08)", color:"var(--w-muted)", padding:"3px 8px", borderRadius:6, fontSize:10, fontWeight:600 }}>
            {article.level === "beginner" ? "مبتدی" : article.level === "intermediate" ? "متوسط" : "پیشرفته"}
          </span>
        )}
      </div>
      <div style={{ padding:"18px 18px 14px" }}>
        <h3 style={{ fontSize:15, fontWeight:800, color:"var(--w-text)", lineHeight:1.4, margin:"0 0 8px" }}>{article.title}</h3>
        <p style={{ fontSize:12, color:"var(--w-muted)", lineHeight:1.6, margin:"0 0 14px", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{article.summary}</p>
        <div style={{ display:"flex", alignItems:"center", gap:12, fontSize:11, color:"var(--w-muted)" }}>
          <span style={{ display:"flex", alignItems:"center", gap:4 }}><WI n="clock" s={12}/>{article.readingTime} دقیقه</span>
          <span style={{ display:"flex", alignItems:"center", gap:4 }}><WI n="eye" s={12}/>{FA(article.views)}</span>
          <span style={{ display:"flex", alignItems:"center", gap:4 }}><WI n="heart" s={12}/>{FA(article.likes)}</span>
          <span style={{ marginRight:"auto", fontSize:11 }}>{article.publishedAt}</span>
        </div>
      </div>
    </button>
  );
}

function VideoCard({ video, onNavigate }: { video:import("./types").Video; onNavigate:(p:WebPage)=>void }) {
  const mins = Math.floor(video.duration / 60);
  const secs = video.duration % 60;
  const dur = `${FA(mins)}:${FA(String(secs).padStart(2,"0"))}`;
  return (
    <button onClick={() => onNavigate("video")} className="w-card" style={{ display:"flex", flexDirection:"column", padding:0, overflow:"hidden", cursor:"pointer", textAlign:"right", transition:"all 0.15s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "var(--w-shadow-md)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "none"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "var(--w-shadow)"; }}
    >
      <div style={{ height:160, background:"linear-gradient(135deg,rgba(232,53,78,0.12),rgba(220,38,38,0.06))", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ width:52, height:52, borderRadius:"50%", background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", backdropFilter:"blur(4px)" }}>
          <WI n="play" s={22}/>
        </div>
        <span style={{ position:"absolute", bottom:10, left:10, background:"rgba(0,0,0,0.65)", color:"#fff", padding:"2px 8px", borderRadius:5, fontSize:11, fontWeight:700, fontVariantNumeric:"tabular-nums" }}>{dur}</span>
      </div>
      <div style={{ padding:"14px 14px 12px" }}>
        <h3 style={{ fontSize:13, fontWeight:800, color:"var(--w-text)", lineHeight:1.45, margin:"0 0 8px" }}>{video.title}</h3>
        <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:11, color:"var(--w-muted)" }}>
          <span style={{ display:"flex", alignItems:"center", gap:3 }}><WI n="eye" s={11}/>{FA(video.views)}</span>
          <span style={{ display:"flex", alignItems:"center", gap:3 }}><WI n="heart" s={11}/>{FA(video.likes)}</span>
          <span style={{ marginRight:"auto" }}>{video.publishedAt}</span>
        </div>
      </div>
    </button>
  );
}
