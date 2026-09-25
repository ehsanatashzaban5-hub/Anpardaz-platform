// ─────────────────────────────────────────────────
// An Pardaz Web Portal — Layout (Header + Footer)
// ─────────────────────────────────────────────────
import { useState, useEffect } from "react";
import WI from "./WebIcons";
import anPardazLogo from "@/imports/ChatGPT_Image_Aug_10__2026__06_38_53_PM__3_.png";
import type { WebPage, UserRole } from "./types";
import { FOOTER_CONFIG } from "./mockData";

// ── Design tokens ────────────────────────────────
export const CSS_VARS = `
  :root{
    --w-bg:#f5f5fb; --w-surface:#ffffff; --w-card:#ffffff;
    --w-card2:#f8f8fc; --w-border:rgba(0,0,0,0.07);
    --w-border2:rgba(0,0,0,0.12); --w-text:#111118;
    --w-muted:rgba(17,17,24,0.52); --w-accent:#7c3aed;
    --w-accent2:#5b21b6; --w-accent-fg:#ffffff;
    --w-success:#059669; --w-danger:#dc2626; --w-warning:#d97706;
    --w-sarraf:#0891b2; --w-market:#d97706; --w-banner:#e8354e;
    --w-hoosh:#7c3aed; --w-financial:#059669;
    --w-hover:rgba(0,0,0,0.04);
    --w-radius:14px; --w-radius-lg:20px; --w-radius-sm:8px;
    --w-shadow:0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04);
    --w-shadow-md:0 4px 12px rgba(0,0,0,0.08),0 12px 32px rgba(0,0,0,0.06);
    --w-shadow-lg:0 8px 24px rgba(0,0,0,0.12),0 24px 64px rgba(0,0,0,0.08);
    --w-font:"Vazirmatn",system-ui,sans-serif;
    --w-header:64px;
  }
  .dark-theme{
    --w-bg:#09090f; --w-surface:#0e0e18; --w-card:#13131f;
    --w-card2:#17172a; --w-border:rgba(255,255,255,0.07);
    --w-border2:rgba(255,255,255,0.13); --w-text:#edecfa;
    --w-hover:rgba(255,255,255,0.04);
    --w-muted:rgba(237,236,250,0.4); --w-accent:#8b5cf6;
    --w-accent2:#7c3aed; --w-shadow:0 1px 3px rgba(0,0,0,0.3),0 4px 16px rgba(0,0,0,0.2);
    --w-shadow-md:0 4px 12px rgba(0,0,0,0.35),0 12px 32px rgba(0,0,0,0.25);
    --w-shadow-lg:0 8px 24px rgba(0,0,0,0.45),0 24px 64px rgba(0,0,0,0.35);
  }
  *,*::before,*::after{box-sizing:border-box;}
  html{scroll-behavior:smooth;}
  body{margin:0;background:var(--w-bg);color:var(--w-text);font-family:var(--w-font);direction:rtl;}
  .w-portal{min-height:100vh;display:flex;flex-direction:column;background:var(--w-bg);color:var(--w-text);}
  .w-main{flex:1;padding-top:var(--w-header);}
  input,textarea,select,button{font-family:var(--w-font);}
  a{color:inherit;text-decoration:none;}
  img{max-width:100%;}
  .w-scroll::-webkit-scrollbar{width:4px;height:4px;}
  .w-scroll::-webkit-scrollbar-thumb{background:var(--w-border2);border-radius:4px;}
  .w-noscroll::-webkit-scrollbar{display:none;}
  .w-noscroll{scrollbar-width:none;}
  button:focus-visible,a:focus-visible{outline:2px solid var(--w-accent);outline-offset:2px;}
  @keyframes wFade{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
  @keyframes wSlide{from{opacity:0;transform:translateX(16px);}to{opacity:1;transform:none;}}
  .w-fade{animation:wFade 0.28s ease both;}
  .w-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:none;cursor:pointer;font-family:var(--w-font);font-weight:700;transition:all 0.15s;border-radius:var(--w-radius-sm);}
  .w-btn-primary{background:var(--w-accent);color:#fff;padding:10px 20px;font-size:14px;}
  .w-btn-primary:hover{background:var(--w-accent2);transform:translateY(-1px);}
  .w-btn-primary:active{transform:none;}
  .w-btn-ghost{background:transparent;color:var(--w-muted);padding:8px 14px;font-size:13px;border:1.5px solid var(--w-border);}
  .w-btn-ghost:hover{background:var(--w-card2);border-color:var(--w-border2);color:var(--w-text);}
  .w-btn-outline{background:transparent;color:var(--w-accent);padding:9px 18px;font-size:13px;border:1.5px solid rgba(124,58,237,0.3);}
  .w-btn-outline:hover{background:rgba(124,58,237,0.07);}
  .w-input{width:100%;padding:10px 14px;background:var(--w-card2);border:1.5px solid var(--w-border);border-radius:var(--w-radius-sm);color:var(--w-text);font-size:14px;font-family:var(--w-font);outline:none;transition:border-color 0.14s;}
  .w-input:focus{border-color:rgba(124,58,237,0.4);}
  .w-input::placeholder{color:var(--w-muted);}
  .w-card{background:var(--w-card);border:1px solid var(--w-border);border-radius:var(--w-radius);box-shadow:var(--w-shadow);}
  .w-divider{height:1px;background:var(--w-border);margin:0;}
  .w-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;}
  .w-badge-new{background:rgba(124,58,237,0.12);color:#7c3aed;}
  .w-badge-pro{background:rgba(217,119,6,0.12);color:#d97706;}
  .w-badge-up{background:rgba(5,150,105,0.12);color:#059669;}
  .w-badge-down{background:rgba(220,38,38,0.1);color:#dc2626;}
  .w-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;}
  .w-btn-muted{background:var(--w-card2);color:var(--w-muted);padding:8px 14px;font-size:13px;border:1px solid var(--w-border);}
  .w-btn-muted:hover{background:var(--w-card);color:var(--w-text);}

  /* ── Desktop-only layout (no mobile overrides) ─── */
  /* The site always renders as a full desktop interface on every device. */
  /* On small screens, the browser will add horizontal scroll. */
  body{min-width:1280px;}
  .w-main{overflow-x:auto;}
  .w-container{max-width:1480px;margin:0 auto;padding:0 20px;}

  /* Platform page headers */
  .w-platform-header{
    display:flex;align-items:center;gap:12px;height:52px;
    background:var(--w-surface);border-bottom:1px solid var(--w-border);
  }

  /* Sidebar */
  .w-sidebar{transition:transform 0.22s,opacity 0.22s;}

  /* Chip/pill row */
  .w-chip-row{display:flex;gap:6px;overflow-x:auto;padding:0 0 4px;scrollbar-width:none;}
  .w-chip-row::-webkit-scrollbar{display:none;}
  .w-chip{
    flex-shrink:0;padding:6px 14px;border-radius:20px;
    border:1px solid var(--w-border);background:var(--w-card2);
    color:var(--w-muted);font-size:12px;font-weight:600;
    cursor:pointer;white-space:nowrap;font-family:var(--w-font);
    transition:all 0.12s;
  }
  .w-chip-active{background:var(--w-accent)!important;color:#fff!important;border-color:var(--w-accent)!important;}

  /* Grids */
  .w-grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;}
  .w-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
  .w-grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
  .w-grid-auto{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;}

  /* Platforms grid */
  .w-platforms-grid{
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(240px,1fr));
    gap:16px;
  }

  /* Market table — desktop grid, mobile cards always hidden */
  .w-market-row-desktop{display:grid;}
  .w-market-row-mobile{display:none!important;}
  .w-crypto-table-desktop{display:block;}
  .w-crypto-table-mobile{display:none!important;}

  /* Trade layout */
  .w-trade-layout{display:flex;flex:1;overflow:hidden;}

  /* Tab scroll */
  .w-tab-row{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;}
  .w-tab-row::-webkit-scrollbar{display:none;}

  /* Text utilities */
  .w-truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

  /* Prevent body scroll when overlay is open */
  .w-no-scroll{overflow:hidden!important;}
`;


const FA = (s: string | number) => String(s).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]);

// ── NAV ITEMS ─────────────────────────────────────
interface NavItem { id: WebPage; label: string; icon: string; color?: string; }

const PLATFORM_NAV: NavItem[] = [
  { id:"sarraf",    label:"آن صراف",   icon:"sarraf",   color:"#0891b2" },
  { id:"market",    label:"آن مارکت", icon:"market",   color:"#d97706" },
  { id:"banner",    label:"آن بنر",   icon:"banner",   color:"#e8354e" },
  { id:"hoosh",     label:"آن هوش",   icon:"hoosh",    color:"#7c3aed" },
  { id:"financial", label:"سبد ارز دیجیتال",icon:"financial", color:"#059669" },
];

const CONTENT_NAV: NavItem[] = [
  { id:"news",      label:"اخبار",     icon:"newspaper" },
  { id:"education", label:"آموزش",     icon:"graduation" },
  { id:"video",     label:"مرکز ویدئو",icon:"video" },
];

// ── HEADER ───────────────────────────────────────
interface HeaderProps {
  currentPage: WebPage;
  onNavigate: (p: WebPage) => void;
  userRole: UserRole;
  onAuthClick: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

export function WebHeader({ currentPage, onNavigate, userRole, onAuthClick, darkMode, onToggleDark }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const isGuest = userRole === "guest";
  const isHome = currentPage === "home";

  const nav: React.CSSProperties = {
    position: "fixed", top: 0, right: 0, left: 0, zIndex: 100,
    height: "var(--w-header)",
    background: scrolled || !isHome ? "var(--w-surface)" : "transparent",
    borderBottom: scrolled ? "1px solid var(--w-border)" : "1px solid transparent",
    boxShadow: scrolled ? "var(--w-shadow)" : "none",
    transition: "all 0.22s",
    display: "flex", alignItems: "center",
  };
  const inner: React.CSSProperties = {
    width: "100%", maxWidth: 1280, margin: "0 auto",
    padding: "0 clamp(12px,3vw,24px)", display: "flex", alignItems: "center", gap: 0,
  };

  return (
    <>
      <nav style={nav} role="navigation" aria-label="ناوبری اصلی">
        <div style={inner}>
          {/* Logo */}
          <button onClick={() => onNavigate("home")} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:10, flexShrink:0, padding:0 }}>
            <img src={anPardazLogo} alt="آن پرداز" style={{ height:34, width:"auto", objectFit:"contain", borderRadius:8 }}/>
          </button>

          {/* Desktop nav */}
          <div style={{ display:"flex", alignItems:"center", gap:4, marginRight:28, flex:1 }} className="w-desktop-nav">
            {/* Platforms dropdown */}
            <div style={{ position:"relative" }} onMouseEnter={() => setPlatformOpen(true)} onMouseLeave={() => setPlatformOpen(false)}>
              <button className="w-nav-item" style={{ display:"flex", alignItems:"center", gap:5, padding:"8px 12px", background:"none", border:"none", cursor:"pointer", color:PLATFORM_NAV.some(x=>x.id===currentPage)?"var(--w-accent)":"var(--w-muted)", fontSize:14, fontWeight:600, borderRadius:8, transition:"color 0.13s" }}>
                پلتفرم‌ها <WI n="chevron-down" s={13} w={2}/>
              </button>
              {platformOpen && (
                <div style={{ position:"absolute", top:"100%", right:0, background:"var(--w-surface)", border:"1px solid var(--w-border)", borderRadius:var_r(16), boxShadow:"var(--w-shadow-lg)", padding:8, width:220, marginTop:4, zIndex:50 }}>
                  {PLATFORM_NAV.map(item => (
                    <button key={item.id} onClick={() => { onNavigate(item.id); setPlatformOpen(false); }} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 12px", background:currentPage===item.id?`${item.color}12`:"transparent", border:"none", borderRadius:10, cursor:"pointer", color:"var(--w-text)", fontSize:13, fontWeight:600, textAlign:"right", transition:"background 0.12s" }}>
                      <WI n={item.icon} s={16} style={{ color:item.color, flexShrink:0 }}/>{item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content dropdown */}
            <div style={{ position:"relative" }} onMouseEnter={() => setContentOpen(true)} onMouseLeave={() => setContentOpen(false)}>
              <button className="w-nav-item" style={{ display:"flex", alignItems:"center", gap:5, padding:"8px 12px", background:"none", border:"none", cursor:"pointer", color:CONTENT_NAV.some(x=>x.id===currentPage)?"var(--w-accent)":"var(--w-muted)", fontSize:14, fontWeight:600, borderRadius:8, transition:"color 0.13s" }}>
                محتوا <WI n="chevron-down" s={13} w={2}/>
              </button>
              {contentOpen && (
                <div style={{ position:"absolute", top:"100%", right:0, background:"var(--w-surface)", border:"1px solid var(--w-border)", borderRadius:var_r(16), boxShadow:"var(--w-shadow-lg)", padding:8, width:180, marginTop:4, zIndex:50 }}>
                  {CONTENT_NAV.map(item => (
                    <button key={item.id} onClick={() => { onNavigate(item.id); setContentOpen(false); }} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 12px", background:currentPage===item.id?"rgba(124,58,237,0.07)":"transparent", border:"none", borderRadius:10, cursor:"pointer", color:currentPage===item.id?"var(--w-accent)":"var(--w-text)", fontSize:13, fontWeight:600, textAlign:"right", transition:"background 0.12s" }}>
                      <WI n={item.icon} s={16} style={{ flexShrink:0 }}/>{item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => onNavigate("support")} style={{ padding:"8px 12px", background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontSize:14, fontWeight:600, borderRadius:8 }}>پشتیبانی</button>
            <button onClick={() => onNavigate("about")} style={{ padding:"8px 12px", background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontSize:14, fontWeight:600, borderRadius:8 }}>درباره ما</button>
          </div>

          {/* Right controls */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginRight:"auto" }}>
            {/* Dark mode toggle */}
            <button onClick={onToggleDark} style={{ width:36, height:36, borderRadius:10, background:"var(--w-card2)", border:"1px solid var(--w-border)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--w-muted)" }}>
              {darkMode
                ? <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                : <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              }
            </button>

            {/* Download app */}
            <button onClick={() => onNavigate("download")} className="w-btn w-btn-ghost" style={{ fontSize:12, padding:"7px 12px", display:"flex", alignItems:"center", gap:5 }}>
              <WI n="download" s={14}/> دانلود اپ
            </button>

            {/* Auth */}
            {isGuest
              ? <button onClick={onAuthClick} className="w-btn w-btn-primary" style={{ padding:"8px 18px", fontSize:13 }}>ورود / ثبت‌نام</button>
              : (
                <button style={{ width:36, height:36, borderRadius:"50%", background:"var(--w-accent)", border:"none", cursor:"pointer", color:"#fff", fontWeight:800, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <WI n="user" s={18}/>
                </button>
              )
            }

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(v => !v)} style={{ width:36, height:36, borderRadius:10, background:"var(--w-card2)", border:"1px solid var(--w-border)", cursor:"pointer", display:"none", alignItems:"center", justifyContent:"center", color:"var(--w-muted)" }} className="w-mobile-menu-btn">
              <WI n={mobileOpen ? "close" : "menu"} s={18}/>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:99, background:"var(--w-surface)", paddingTop:"var(--w-header)", overflow:"auto" }}>
          <div style={{ padding:"16px 20px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", marginBottom:8, letterSpacing:"0.06em" }}>پلتفرم‌ها</div>
            {PLATFORM_NAV.map(item => (
              <button key={item.id} onClick={() => { onNavigate(item.id); setMobileOpen(false); }} style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"13px 12px", background:"transparent", border:"none", cursor:"pointer", color:"var(--w-text)", fontSize:15, fontWeight:600, textAlign:"right", borderBottom:"1px solid var(--w-border)" }}>
                <WI n={item.icon} s={18} style={{ color:item.color }}/>{item.label}
              </button>
            ))}
            <div style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", margin:"16px 0 8px", letterSpacing:"0.06em" }}>محتوا</div>
            {CONTENT_NAV.map(item => (
              <button key={item.id} onClick={() => { onNavigate(item.id); setMobileOpen(false); }} style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"13px 12px", background:"transparent", border:"none", cursor:"pointer", color:"var(--w-text)", fontSize:15, fontWeight:600, textAlign:"right", borderBottom:"1px solid var(--w-border)" }}>
                <WI n={item.icon} s={18}/>{item.label}
              </button>
            ))}
            <div style={{ marginTop:20, display:"flex", flexDirection:"column", gap:10 }}>
              {isGuest
                ? <button onClick={() => { onAuthClick(); setMobileOpen(false); }} className="w-btn w-btn-primary" style={{ width:"100%", padding:"13px" }}>ورود / ثبت‌نام</button>
                : null
              }
              <button onClick={() => { onNavigate("download"); setMobileOpen(false); }} className="w-btn w-btn-ghost" style={{ width:"100%", padding:"12px" }}>
                <WI n="download" s={16}/> دانلود اپلیکیشن
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width:900px){
          .w-desktop-nav{display:none!important;}
          .w-mobile-menu-btn{display:flex!important;}
        }
      `}</style>
    </>
  );
}

function var_r(n: number) { return `${n}px`; }

// ── FOOTER ───────────────────────────────────────
interface FooterProps { onNavigate: (p: WebPage) => void; }

export function WebFooter({ onNavigate }: FooterProps) {
  const links = [
    { label:"پلتفرم‌ها", items:[
      { label:"آن صراف",   page:"sarraf"    as WebPage },
      { label:"آن مارکت", page:"market"    as WebPage },
      { label:"آن بنر",   page:"banner"    as WebPage },
      { label:"آن هوش",   page:"hoosh"     as WebPage },
      { label:"سبد ارز دیجیتال",page:"financial" as WebPage },
    ]},
    { label:"محتوا", items:[
      { label:"اخبار",      page:"news"      as WebPage },
      { label:"آموزش",      page:"education" as WebPage },
      { label:"مرکز ویدئو", page:"video"     as WebPage },
    ]},
    { label:"شرکت", items:[
      { label:"درباره آن پرداز", page:"about"    as WebPage },
      { label:"تنظیمات",         page:"settings" as WebPage },
      { label:"پشتیبانی",        page:"support"  as WebPage },
      { label:"دانلود اپلیکیشن", page:"download" as WebPage },
    ]},
  ];

  const socials = [
    { icon:"telegram",  url:FOOTER_CONFIG.telegram,  label:"تلگرام" },
    { icon:"instagram", url:FOOTER_CONFIG.instagram, label:"اینستاگرام" },
    { icon:"linkedin",  url:FOOTER_CONFIG.linkedin,  label:"لینکدین" },
    { icon:"youtube",   url:FOOTER_CONFIG.youtube,   label:"یوتیوب" },
    { icon:"twitter",   url:FOOTER_CONFIG.twitter,   label:"توییتر/X" },
  ];

  return (
    <footer style={{ background:"var(--w-surface)", borderTop:"1px solid var(--w-border)", marginTop:80 }}>
      {/* Main footer grid */}
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"clamp(28px,5vw,52px) clamp(16px,3vw,24px) 40px", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:"clamp(24px,4vw,40px)" }}>
        {/* Brand column */}
        <div>
          <button onClick={() => onNavigate("home")} style={{ background:"none", border:"none", cursor:"pointer", padding:0, marginBottom:16 }}>
            <img src={anPardazLogo} alt="آن پرداز" style={{ height:40, width:"auto", objectFit:"contain", borderRadius:10 }}/>
          </button>
          <p style={{ fontSize:13, color:"var(--w-muted)", lineHeight:1.8, marginBottom:20 }}>
            بزرگ‌ترین اکوسیستم مالی و تکنولوژی ایران<br/>
            شرکت دیار آتیه گشا
          </p>
          {/* Socials */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {socials.map(s => (
              <a key={s.icon} href={s.url ?? "#"} target="_blank" rel="noopener noreferrer"
                aria-label={s.label}
                style={{ width:36, height:36, borderRadius:10, background:"var(--w-card2)", border:"1px solid var(--w-border)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--w-muted)", transition:"all 0.14s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--w-accent)"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(124,58,237,0.3)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--w-muted)"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--w-border)"; }}
              >
                <WI n={s.icon} s={16}/>
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {links.map(col => (
          <div key={col.label}>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--w-muted)", marginBottom:14, letterSpacing:"0.06em" }}>{col.label}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {col.items.map(item => (
                <button key={item.page} onClick={() => onNavigate(item.page)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontSize:13, fontWeight:500, textAlign:"right", padding:0, transition:"color 0.13s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--w-accent)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--w-muted)")}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Contact */}
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--w-muted)", marginBottom:14, letterSpacing:"0.06em" }}>تماس</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { icon:"globe",   text:FOOTER_CONFIG.website },
              { icon:"phone",   text:FOOTER_CONFIG.phone },
              { icon:"mail",    text:FOOTER_CONFIG.email },
              { icon:"map-pin", text:FOOTER_CONFIG.address },
            ].filter(x => x.text).map(item => (
              <div key={item.icon} style={{ display:"flex", alignItems:"flex-start", gap:8, color:"var(--w-muted)", fontSize:12 }}>
                <WI n={item.icon} s={14} style={{ marginTop:1, flexShrink:0 }}/>
                <span style={{ lineHeight:1.5 }}>{item.text}</span>
              </div>
            ))}
          </div>

          {/* App download */}
          <div style={{ marginTop:20 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--w-muted)", marginBottom:10, letterSpacing:"0.06em" }}>دانلود اپلیکیشن</div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {[
                { icon:"android", label:"گوگل پلی / بازار / مایکت" },
                { icon:"apple",   label:"App Store" },
              ].map(x => (
                <button key={x.icon} onClick={() => onNavigate("download")} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"var(--w-card2)", border:"1px solid var(--w-border)", borderRadius:9, cursor:"pointer", color:"var(--w-text)", fontSize:12, fontWeight:600 }}>
                  <WI n={x.icon} s={15}/>{x.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop:"1px solid var(--w-border)", padding:"16px clamp(16px,3vw,24px)", maxWidth:1280, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div style={{ fontSize:12, color:"var(--w-muted)" }}>
          © {FA(1403)} آن پرداز — شرکت دیار آتیه گشا — تمامی حقوق محفوظ است
        </div>
        <div style={{ display:"flex", gap:16 }}>
          {["قوانین و مقررات","حریم خصوصی","سلب مسئولیت"].map(t => (
            <button key={t} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontSize:12 }}>{t}</button>
          ))}
        </div>
      </div>
    </footer>
  );
}
