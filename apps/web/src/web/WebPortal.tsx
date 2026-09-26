// ─────────────────────────────────────────────────
// An Pardaz Web Portal — Main Router & Shell
// Guests see homepage immediately — NO auth on load
// ─────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { WebHeader, WebFooter, CSS_VARS } from "./WebLayout";
import WebHome       from "./WebHome";
import WebSarraf     from "./WebSarraf";
import WebMarket     from "./WebMarket";
import WebBanner     from "./WebBanner";
import WebHoosh      from "./WebHooshProduction";
import WebContent, { type ContentSection } from "./WebContent";
import WebSettings from "./WebSettings";
import WebAuthModal, { WebKycModal } from "./WebAuth";
import type { WebPage, UserRole } from "./types";

// ── Simple inline pages for download / about / support ──────────
import WI from "./WebIcons";
import anPardazLogo from "@/imports/ChatGPT_Image_Aug_10__2026__06_38_53_PM__3_.png";

const FA = (s: string | number) => String(s).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]);

function DownloadPage({ onNavigate }: { onNavigate: (p: WebPage) => void }) {
  return (
    <div className="w-fade" dir="rtl" style={{ maxWidth:800, margin:"60px auto", padding:"0 24px", textAlign:"center" }}>
      <img src={anPardazLogo} alt="آن پرداز" style={{ width:80, height:80, objectFit:"contain", marginBottom:24, borderRadius:18 }}/>
      <h1 style={{ fontSize:32, fontWeight:900, marginBottom:10 }}>دانلود اپلیکیشن آن پرداز</h1>
      <p style={{ fontSize:15, color:"var(--w-muted)", lineHeight:1.8, marginBottom:36 }}>
        اپلیکیشن آن پرداز را بر روی گوشی هوشمند خود نصب کنید و به تمام امکانات آن صراف، آن مارکت، آن بنر و آن هوش دسترسی داشته باشید.
      </p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14, maxWidth:600, margin:"0 auto 40px" }}>
        {[
          { icon:"smartphone", label:"بازار (Bazaar)", color:"#7c3aed", desc:"اندروید" },
          { icon:"smartphone", label:"مایکت (Myket)",  color:"#0891b2", desc:"اندروید" },
          { icon:"smartphone", label:"App Store",       color:"#059669", desc:"iOS" },
        ].map(s => (
          <button key={s.label} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, padding:"22px", borderRadius:16, border:"1.5px solid var(--w-border)", background:"var(--w-card)", cursor:"pointer", transition:"all 0.14s" }}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor=s.color;(e.currentTarget as HTMLButtonElement).style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="var(--w-border)";(e.currentTarget as HTMLButtonElement).style.transform="none";}}
          >
            <div style={{ width:48, height:48, borderRadius:14, background:`${s.color}15`, display:"flex", alignItems:"center", justifyContent:"center", color:s.color }}>
              <WI n={s.icon} s={24}/>
            </div>
            <div style={{ fontSize:13, fontWeight:800 }}>{s.label}</div>
            <div style={{ fontSize:11, color:"var(--w-muted)" }}>{s.desc}</div>
          </button>
        ))}
      </div>
      <div style={{ padding:"18px", background:"rgba(124,58,237,0.07)", border:"1px solid rgba(124,58,237,0.18)", borderRadius:12, fontSize:13, color:"var(--w-muted)", lineHeight:1.7 }}>
        نسخه وب پرتال آن پرداز تمام امکانات را در مرورگر شما فراهم می‌کند. اپلیکیشن موبایل تجربه کامل‌تری ارائه می‌دهد.
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="w-fade" dir="rtl" style={{ maxWidth:900, margin:"40px auto", padding:"0 24px" }}>
      <div style={{ textAlign:"center", marginBottom:48 }}>
        <img src={anPardazLogo} alt="آن پرداز" style={{ width:72, height:72, objectFit:"contain", marginBottom:16, borderRadius:16 }}/>
        <h1 style={{ fontSize:30, fontWeight:900, marginBottom:10 }}>درباره آن پرداز</h1>
        <p style={{ fontSize:14, color:"var(--w-muted)", lineHeight:1.9, maxWidth:600, margin:"0 auto" }}>
          آن پرداز یک اکوسیستم جامع مالی و فناوری است که با هدف ارائه خدمات صرافی، بازار، آگهی و هوش مصنوعی در یک پلتفرم یکپارچه فعالیت می‌کند.
        </p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:20, marginBottom:48 }}>
        {[
          { icon:"zap",        title:"آن صراف",   desc:"صرافی حرفه‌ای با نقدینگی بالا و کارمزد رقابتی برای معامله ارزهای دیجیتال",           color:"#0891b2" },
          { icon:"shopping-bag",title:"آن مارکت", desc:"بازار آنلاین برای خرید و فروش محصولات با تضمین کیفیت و پشتیبانی کامل",               color:"#d97706" },
          { icon:"banner",     title:"آن بنر",    desc:"سامانه آگهی و نیازمندی‌های آنلاین برای ارائه آگهی‌های خرید، فروش و خدمات",            color:"#e8354e" },
          { icon:"cpu",        title:"آن هوش",    desc:"فضای کار هوش مصنوعی با دسترسی به مدل‌های پیشرفته از برترین ارائه‌دهندگان جهان",       color:"#7c3aed" },
          { icon:"bar-chart",  title:"مرکز مالی", desc:"اطلاعات مالی جامع، قیمت لحظه‌ای ارزها، نرخ تبدیل و ابزارهای تحلیل سرمایه‌گذاری",    color:"#059669" },
        ].map(p => (
          <div key={p.title} className="w-card" style={{ padding:"22px" }}>
            <div style={{ width:44, height:44, borderRadius:13, background:`${p.color}12`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14, color:p.color }}>
              <WI n={p.icon} s={22}/>
            </div>
            <div style={{ fontSize:15, fontWeight:800, marginBottom:6 }}>{p.title}</div>
            <div style={{ fontSize:12, color:"var(--w-muted)", lineHeight:1.7 }}>{p.desc}</div>
          </div>
        ))}
      </div>
      <div className="w-card" style={{ padding:"24px", textAlign:"center" }}>
        <div style={{ fontSize:13, color:"var(--w-muted)", lineHeight:1.9 }}>
          آن پرداز با رویکرد شفافیت، امنیت و نوآوری در حال توسعه است. تیم ما متشکل از متخصصان فناوری مالی، امنیت اطلاعات و هوش مصنوعی است.
        </div>
      </div>
    </div>
  );
}

function SupportPage({ isLoggedIn, onAuthRequired }: { isLoggedIn: boolean; onAuthRequired: () => void }) {
  const [subject, setSubject]   = useState("");
  const [message, setMessage]   = useState("");
  const [sent, setSent]         = useState(false);

  const FAQS = [
    { q:"چطور حساب کاربری ایجاد کنم؟", a:"از طریق دکمه «ورود / ثبت‌نام» در بالای صفحه اقدام کنید. کافی است شماره موبایل خود را وارد کنید." },
    { q:"KYC چیست و چرا لازم است؟", a:"تأیید هویت (KYC) برای استفاده از خدمات صرافی آن صراف الزامی است و امنیت همه کاربران را تضمین می‌کند." },
    { q:"چه روش‌های پرداختی پشتیبانی می‌شود؟", a:"در آن مارکت از کارت بانکی پشتیبانی می‌شود. در آن صراف انتقال ارز دیجیتال امکان‌پذیر است." },
    { q:"آیا اطلاعاتم امن است؟", a:"بله. آن پرداز از رمزنگاری پیشرفته و استانداردهای امنیتی بین‌المللی برای حفاظت از داده‌های کاربران استفاده می‌کند." },
  ];

  return (
    <div className="w-fade" dir="rtl" style={{ maxWidth:900, margin:"40px auto", padding:"0 24px" }}>
      <div style={{ textAlign:"center", marginBottom:36 }}>
        <h1 style={{ fontSize:28, fontWeight:900, marginBottom:8 }}>پشتیبانی</h1>
        <p style={{ fontSize:13, color:"var(--w-muted)" }}>پاسخ سوالات خود را در اینجا بیابید یا تیکت ارسال کنید</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, alignItems:"start" }}>
        {/* FAQ */}
        <div>
          <div style={{ fontSize:15, fontWeight:800, marginBottom:14 }}>سوالات متداول</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {FAQS.map((f, i) => (
              <div key={i} className="w-card" style={{ padding:"16px" }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:6, display:"flex", alignItems:"flex-start", gap:8 }}>
                  <WI n="help-circle" s={15} style={{ color:"#7c3aed", flexShrink:0, marginTop:1 }}/>{f.q}
                </div>
                <div style={{ fontSize:12, color:"var(--w-muted)", lineHeight:1.7, paddingRight:23 }}>{f.a}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Ticket form */}
        <div className="w-card" style={{ padding:"22px" }}>
          <div style={{ fontSize:15, fontWeight:800, marginBottom:16 }}>ارسال تیکت</div>
          {sent ? (
            <div style={{ textAlign:"center", padding:"30px 0" }}>
              <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(5,150,105,0.1)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", color:"#059669" }}>
                <WI n="check" s={26}/>
              </div>
              <div style={{ fontSize:15, fontWeight:800, marginBottom:6 }}>تیکت ارسال شد</div>
              <div style={{ fontSize:12, color:"var(--w-muted)" }}>تیم پشتیبانی ما تا ۲۴ ساعت پاسخ خواهند داد.</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:"var(--w-muted)", display:"block", marginBottom:5 }}>موضوع</label>
                <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="موضوع تیکت..." className="w-input"/>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:"var(--w-muted)", display:"block", marginBottom:5 }}>پیام</label>
                <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={5} placeholder="مشکل یا سوال خود را شرح دهید..." className="w-input" style={{ resize:"vertical" }}/>
              </div>
              <button onClick={async()=>{if(!isLoggedIn){onAuthRequired();return;}if(!subject||!message||busy)return;setBusy(true);setError("");try{const token=localStorage.getItem("anpardaz:accessToken")??"";const base=((import.meta as any).env?.VITE_PLATFORM_API_URL as string|undefined)?.replace(/\/$/,"")??"";const r=await fetch(base+"/api/v1/support/tickets",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${token}`},body:JSON.stringify({subject,message})});if(!r.ok)throw new Error("ارسال تیکت ناموفق بود.");setSent(true);setSubject("");setMessage("");}catch(e){setError(e instanceof Error?e.message:"ارسال تیکت ناموفق بود.")}finally{setBusy(false)}}} disabled={!subject||!message||busy} className="w-btn w-btn-primary" style={{ padding:"11px", opacity:subject&&message&&!busy?1:0.5 }}>
                <WI n="send" s={15}/> {busy?"در حال ارسال…":"ارسال تیکت"}
              </button>
              {error && <div style={{fontSize:12,color:"#e8354e"}}>{error}</div>}
              {!isLoggedIn && <div style={{fontSize:11,color:"var(--w-muted)"}}>برای ثبت تیکت ابتدا وارد حساب کاربری شوید.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Portal Component ─────────────────────────
export default function WebPortal() {
  const [page,     setPage]     = useState<WebPage>("home");
  const [showAuth, setShowAuth] = useState(false);
  const [showKyc,  setShowKyc]  = useState(false);
  const [showFirstVisit, setShowFirstVisit] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(() => localStorage.getItem("anpardaz:web:role") === "user" ? "user" : "guest");
  const [darkMode, setDarkMode] = useState(true);

  // Scroll to top on page change
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page]);

  useEffect(() => {
    if (userRole === "guest") return;
    const token = localStorage.getItem("anpardaz:accessToken");
    if (!token) return;
    const base = ((import.meta as any).env?.VITE_ANPARDAZ_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
    if (!base) return;
    void fetch(`${base}/api/v1/user/settings`, { headers: { accept: "application/json", authorization: `Bearer ${token}` }, cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.settings?.theme) setDarkMode(d.settings.theme !== "light"); })
      .catch(() => {});
  }, [userRole]);

  // First-visit notice: shown once per browser and never forced again after dismissal.
  useEffect(() => {
    try {
      if (window.localStorage.getItem("anpardaz:web:first-visit-notice") !== "dismissed") {
        setShowFirstVisit(true);
      }
    } catch {
      setShowFirstVisit(true);
    }
  }, []);

  const dismissFirstVisit = useCallback(() => {
    try { window.localStorage.setItem("anpardaz:web:first-visit-notice", "dismissed"); } catch { /* storage unavailable */ }
    setShowFirstVisit(false);
  }, []);

  // Apply dark/light to body for background continuity
  useEffect(() => {
    document.body.style.background = darkMode ? "#0d0d14" : "#f5f5fb";
  }, [darkMode]);

  const handleNavigate = useCallback((p: WebPage) => {
    // These pages require login
    const protected_: WebPage[] = ["sarraf-trade","sarraf-assets","sarraf-deposit","sarraf-withdraw","market-orders","banner-post","kyc","settings"];
    if (protected_.includes(p) && userRole === "guest") {
      setShowAuth(true);
      return;
    }
    setPage(p);
  }, [userRole]);

  const handleAuthRequired = useCallback(() => {
    setShowAuth(true);
  }, []);

  const handleAuthSuccess = useCallback((accessToken: string, email: string) => {
    localStorage.setItem("anpardaz:accessToken", accessToken);
    localStorage.setItem("anpardaz:web:email", email);
    localStorage.setItem("anpardaz:web:role", "user");
    setUserRole("user");
    setShowAuth(false);
  }, []);

  const isLoggedIn = userRole !== "guest" && Boolean(localStorage.getItem("anpardaz:accessToken"));

  // Which section for WebContent
  const contentSection: ContentSection =
    page === "education" ? "education" :
    page === "video"     ? "video"     : "news";

  return (
    <div
      className={darkMode ? "dark-theme" : ""}
      style={{ minHeight:"100vh", background:"var(--w-bg)", color:"var(--w-text)", fontFamily:"Vazirmatn, sans-serif", direction:"rtl" }}
    >
      <style>{CSS_VARS}</style>
      <style>{`
        .w-fade { animation: wFadeIn 0.22s ease; }
        @keyframes wFadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        .w-card {
          background: var(--w-card);
          border: 1px solid var(--w-border);
          border-radius: 14px;
          box-shadow: var(--w-shadow);
          transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
        }
        .w-card2 { background: var(--w-card2); }
        .w-input {
          width: 100%; padding: 9px 12px; border: 1.5px solid var(--w-border);
          border-radius: 9px; background: var(--w-card); color: var(--w-text);
          font-family: Vazirmatn, sans-serif; font-size: 13px; outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .w-input:focus { border-color: var(--w-accent); }
        .w-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 9px; border: none;
          font-family: Vazirmatn, sans-serif; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all 0.14s; white-space: nowrap;
        }
        .w-btn-primary { background: var(--w-accent); color: #fff; }
        .w-btn-primary:hover { filter: brightness(1.08); }
        .w-btn-ghost { background: transparent; color: var(--w-text); border: 1.5px solid var(--w-border); }
        .w-btn-ghost:hover { background: var(--w-hover); }
        .w-btn-muted { background: var(--w-card2); color: var(--w-muted); }
        .w-btn-muted:hover { background: var(--w-hover); }
        [dir="rtl"] select { text-align: right; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--w-border2); border-radius: 4px; }
      `}</style>

      <WebHeader
        currentPage={page}
        onNavigate={handleNavigate}
        userRole={userRole}
        onAuthClick={() => setShowAuth(true)}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(d => !d)}
      />

      <main style={{ paddingTop:"var(--w-header)" }}>
        {page === "home" && (
          <WebHome onNavigate={handleNavigate}/>
        )}
        {(page === "sarraf" || page === "sarraf-markets" || page === "sarraf-trade" ||
          page === "sarraf-assets" || page === "sarraf-deposit" || page === "sarraf-withdraw") && (
          <WebSarraf
            onNavigate={handleNavigate}
            isLoggedIn={isLoggedIn}
            kycStatus={userRole === "kyc_verified" ? "verified" : userRole === "kyc_pending" ? "pending" : "not_verified"}
            onAuthRequired={handleAuthRequired}
          />
        )}
        {(page === "market" || page === "market-product" || page === "market-category" || page === "market-orders") && (
          <WebMarket onNavigate={handleNavigate}/>
        )}
        {(page === "banner" || page === "banner-detail" || page === "banner-post") && (
          <WebBanner
            onNavigate={handleNavigate}
            isLoggedIn={isLoggedIn}
            onAuthRequired={handleAuthRequired}
          />
        )}
        {page === "hoosh" && (
          <WebHoosh onNavigate={handleNavigate}/>
        )}
        {(page === "news" || page === "news-article" || page === "education" ||
          page === "education-article" || page === "video" || page === "video-detail") && (
          <WebContent section={contentSection} onNavigate={handleNavigate}/>
        )}
        {page === "download" && (
          <DownloadPage onNavigate={handleNavigate}/>
        )}
        {page === "about" && (
          <AboutPage/>
        )}
        {page === "support" && (
          <SupportPage isLoggedIn={isLoggedIn} onAuthRequired={handleAuthRequired}/>
        )}
      </main>

      <WebFooter onNavigate={handleNavigate}/>

      {showFirstVisit && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="اطلاعیه بازدید اول"
          onClick={dismissFirstVisit}
          style={{
            position:"fixed", inset:0, zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center",
            padding:"24px", background:"rgba(0,0,0,0.42)", backdropFilter:"blur(6px)",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position:"relative", width:"min(460px,100%)", padding:"34px 30px 28px", textAlign:"center",
              background:"var(--w-card)", color:"var(--w-text)", border:"1px solid var(--w-border)",
              borderRadius:22, boxShadow:"var(--w-shadow-lg)", animation:"wFirstVisitIn .22s ease both",
            }}
          >
            <button
              type="button"
              onClick={dismissFirstVisit}
              aria-label="بستن"
              style={{
                position:"absolute", top:12, left:12, width:34, height:34, borderRadius:10,
                border:"1px solid var(--w-border)", background:"var(--w-card2)", color:"var(--w-muted)",
                cursor:"pointer", fontSize:20, lineHeight:1,
              }}
            >×</button>
            <div style={{
              width:58, height:58, margin:"0 auto 18px", borderRadius:17,
              display:"flex", alignItems:"center", justifyContent:"center",
              background:"rgba(124,58,237,0.10)", border:"1px solid rgba(124,58,237,0.18)",
            }}>
              <WI n="sparkle" s={27} style={{ color:"var(--w-accent)" }}/>
            </div>
            <div style={{ fontSize:"clamp(18px,3vw,22px)", fontWeight:900, lineHeight:1.8 }}>
              در حال تکمیل آن پرداز هستیم:
            </div>
            <button
              type="button"
              onClick={dismissFirstVisit}
              className="w-btn w-btn-primary"
              style={{ marginTop:24, minWidth:132, padding:"10px 22px" }}
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}
      <style>{`@keyframes wFirstVisitIn { from { opacity:0; transform:translateY(10px) scale(.98); } to { opacity:1; transform:none; } }`}</style>

      {/* Auth modal — rendered ONLY when explicitly requested */}
      {showAuth && (
        <WebAuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* KYC modal — rendered ONLY when explicitly requested */}
      {showKyc && (
        <WebKycModal
          onClose={() => setShowKyc(false)}
          currentStatus="not_verified"
        />
      )}
    </div>
  );
}
