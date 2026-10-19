import { useEffect, useState } from "react";
import anPardazLogo from "@/imports/ChatGPT_Image_Aug_10__2026__06_38_53_PM__3_.png";

type InfoPanel = "about" | "contact" | null;

const ANDROID_URL = (import.meta.env.VITE_ANDROID_DOWNLOAD_URL ?? "").trim();
const IOS_URL = (import.meta.env.VITE_IOS_DOWNLOAD_URL ?? "").trim();

export default function WebPortal() {
  const [panel, setPanel] = useState<InfoPanel>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const openDownload = (url: string) => {
    if (!url) {
      setNotice("لینک دانلود این نسخه هنوز تنظیم نشده است.");
      window.setTimeout(() => setNotice(""), 3500);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="ap-landing" dir="rtl">
      <style>{styles}</style>
      <header className="ap-header">
        <a className="ap-brand" href="#home" aria-label="صفحه اصلی آن‌پرداز">
          <img src={anPardazLogo} alt="لوگوی آن‌پرداز" />
          <span>آن‌پرداز</span>
        </a>
        <nav className="ap-nav" aria-label="منوی اصلی">
          <button type="button" onClick={() => setPanel("about")}>درباره ما</button>
          <button type="button" onClick={() => setPanel("contact")}>تماس با ما</button>
        </nav>
      </header>

      <main id="home" className="ap-main">
        <div className="ap-orb ap-orb-one" aria-hidden="true" />
        <div className="ap-orb ap-orb-two" aria-hidden="true" />
        <section className="ap-hero" aria-labelledby="ap-title">
          <div className="ap-mark">
            <img src={anPardazLogo} alt="" />
          </div>
          <div className="ap-eyebrow"><span /> دنیای خدمات، در یک اپلیکیشن</div>
          <h1 id="ap-title">همه‌چیز، <span>یک‌جا.</span></h1>
          <p className="ap-intro">
            با آن‌پرداز، ساده‌تر و یکپارچه‌تر به خدمات دیجیتال خود دسترسی داشته باشید.
          </p>
          <div className="ap-downloads" aria-label="دانلود اپلیکیشن">
            <button className="ap-download ap-download-primary" type="button" onClick={() => openDownload(ANDROID_URL)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5 5.4 1M17 3.5 18.6 1M4 9h16M6 5h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-1v3h-2v-3H9v3H7v-3H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /></svg>
              <span><small>دریافت اپلیکیشن</small><strong>دانلود نسخه اندروید</strong></span>
              <b aria-hidden="true">←</b>
            </button>
            <button className="ap-download ap-download-secondary" type="button" onClick={() => openDownload(IOS_URL)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.7 12.8c0-2.1 1.7-3.1 1.8-3.2a4 4 0 0 0-3.2-1.7c-1.4-.1-2.7.8-3.4.8s-1.8-.8-3-.8a4.5 4.5 0 0 0-3.8 2.3c-1.6 2.8-.4 7 1.1 9.2.7 1.1 1.6 2.3 2.7 2.2 1.1 0 1.5-.7 2.9-.7s1.8.7 3 .7 2-.9 2.7-2.1a9 9 0 0 0 1.2-2.4 3.7 3.7 0 0 1-2-4.3ZM14.5 6.5A4 4 0 0 0 15.4 3a4.2 4.2 0 0 0-2.8 1.5 3.8 3.8 0 0 0-.9 3.4 3.5 3.5 0 0 0 2.8-1.4Z" /></svg>
              <span><small>دریافت اپلیکیشن</small><strong>نسخه iOS</strong></span>
              <b aria-hidden="true">←</b>
            </button>
          </div>
          <p className="ap-note">تجربه‌ای ساده، سریع و یکپارچه</p>
        </section>
      </main>

      {notice && <div className="ap-toast" role="status">{notice}</div>}

      {panel && (
        <div className="ap-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setPanel(null); }}>
          <section className="ap-dialog" role="dialog" aria-modal="true" aria-labelledby="ap-dialog-title">
            <button className="ap-close" type="button" onClick={() => setPanel(null)} aria-label="بستن">×</button>
            <img className="ap-dialog-logo" src={anPardazLogo} alt="" />
            {panel === "about" ? (
              <>
                <h2 id="ap-dialog-title">درباره آن‌پرداز</h2>
                <p>آن‌پرداز با هدف یکپارچه‌سازی خدمات دیجیتال در یک تجربه ساده و قابل‌دسترس توسعه می‌یابد؛ تا کاربران بتوانند خدمات موردنیاز خود را از یک مسیر روشن و منظم دنبال کنند.</p>
              </>
            ) : (
              <>
                <h2 id="ap-dialog-title">تماس با ما</h2>
                <p>برای پرسش‌ها و پیشنهادهای خود با تیم آن‌پرداز در ارتباط باشید.</p>
                <a className="ap-email" href="mailto:info@anpardaz.ir">info@anpardaz.ir</a>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800;900&display=swap');
  .ap-landing{--ap-ink:#f4fbfa;--ap-muted:#9cb3b8;--ap-bg:#06171d;--ap-teal:#35dfc0;min-height:100vh;min-height:100svh;background:var(--ap-bg);color:var(--ap-ink);font-family:"Vazirmatn",system-ui,sans-serif;position:relative;overflow:hidden}
  .ap-landing *{box-sizing:border-box}
  .ap-header{height:84px;max-width:1240px;margin:0 auto;padding:0 32px;display:flex;align-items:center;justify-content:space-between;position:relative;z-index:2;border-bottom:1px solid rgba(204,238,236,.09)}
  .ap-brand{display:inline-flex;align-items:center;gap:11px;color:var(--ap-ink);text-decoration:none;font-size:19px;font-weight:800;letter-spacing:-.5px}
  .ap-brand img{width:38px;height:38px;object-fit:contain;border-radius:10px}
  .ap-nav{display:flex;align-items:center;gap:8px}
  .ap-nav button{font:500 14px "Vazirmatn",system-ui,sans-serif;color:#c5d6d7;background:transparent;border:0;border-radius:9px;padding:10px 15px;cursor:pointer;transition:color .2s,background .2s}
  .ap-nav button:hover{color:#fff;background:rgba(255,255,255,.06)}
  .ap-main{min-height:calc(100svh - 84px);display:grid;place-items:center;position:relative;padding:54px 24px 76px;isolation:isolate}
  .ap-main:before{content:"";position:absolute;inset:0;z-index:-2;opacity:.2;background-image:linear-gradient(rgba(128,194,194,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(128,194,194,.08) 1px,transparent 1px);background-size:64px 64px;mask-image:radial-gradient(ellipse at center,#000 0%,transparent 74%)}
  .ap-main:after{content:"";position:absolute;width:min(800px,90vw);height:430px;top:15%;left:50%;transform:translateX(-50%);z-index:-1;background:radial-gradient(ellipse,rgba(17,167,145,.16),transparent 68%);pointer-events:none}
  .ap-orb{position:absolute;border:1px solid rgba(53,223,192,.14);border-radius:50%;pointer-events:none;z-index:-1}
  .ap-orb-one{width:420px;height:420px;left:-230px;top:17%;box-shadow:0 0 0 46px rgba(53,223,192,.018),0 0 0 92px rgba(53,223,192,.014)}
  .ap-orb-two{width:300px;height:300px;right:-180px;bottom:5%;box-shadow:0 0 0 36px rgba(53,223,192,.018),0 0 0 72px rgba(53,223,192,.012)}
  .ap-hero{width:min(100%,780px);text-align:center;position:relative;animation:ap-enter .65s cubic-bezier(.2,.7,.2,1) both}
  .ap-mark{width:78px;height:78px;margin:0 auto 27px;display:grid;place-items:center;border:1px solid rgba(91,224,198,.25);border-radius:24px;background:linear-gradient(145deg,rgba(53,223,192,.14),rgba(255,255,255,.025));box-shadow:0 18px 70px rgba(0,0,0,.18),inset 0 1px rgba(255,255,255,.1)}
  .ap-mark img{width:53px;height:53px;object-fit:contain;border-radius:13px}
  .ap-eyebrow{display:inline-flex;align-items:center;gap:9px;color:#a7c5c7;font-size:13px;font-weight:600;letter-spacing:.1px;margin-bottom:17px}
  .ap-eyebrow span{width:7px;height:7px;background:var(--ap-teal);border-radius:50%;box-shadow:0 0 16px rgba(53,223,192,.8)}
  .ap-hero h1{font-size:clamp(43px,7vw,78px);line-height:1.18;letter-spacing:-2.8px;font-weight:900;margin:0;color:#f5fbfa}
  .ap-hero h1 span{color:var(--ap-teal);text-shadow:0 0 48px rgba(53,223,192,.12)}
  .ap-intro{font-size:clamp(15px,2vw,18px);line-height:2;color:#a8bec1;max-width:510px;margin:20px auto 34px;font-weight:400}
  .ap-downloads{display:flex;justify-content:center;gap:13px;flex-wrap:wrap}
  .ap-download{min-width:238px;min-height:72px;display:flex;align-items:center;gap:13px;text-align:right;padding:13px 16px;border-radius:15px;cursor:pointer;font-family:"Vazirmatn",system-ui,sans-serif;transition:transform .2s,border-color .2s,background .2s,box-shadow .2s}
  .ap-download:hover{transform:translateY(-3px)}
  .ap-download:focus-visible,.ap-nav button:focus-visible,.ap-close:focus-visible{outline:2px solid var(--ap-teal);outline-offset:4px}
  .ap-download svg{width:25px;height:25px;flex-shrink:0;fill:none;stroke:currentColor;stroke-width:1.55;stroke-linecap:round;stroke-linejoin:round}
  .ap-download-secondary svg{fill:currentColor;stroke:none}
  .ap-download span{display:flex;flex-direction:column;gap:2px;flex:1}
  .ap-download small{font-size:11px;font-weight:500;opacity:.72}
  .ap-download strong{font-size:14px;font-weight:800;white-space:nowrap}
  .ap-download b{font-size:19px;font-weight:500;opacity:.65;transition:transform .2s}
  .ap-download:hover b{transform:translateX(-3px)}
  .ap-download-primary{background:var(--ap-teal);color:#06201e;border:1px solid var(--ap-teal);box-shadow:0 8px 30px rgba(53,223,192,.12)}
  .ap-download-primary:hover{background:#61ecd2;box-shadow:0 12px 34px rgba(53,223,192,.2)}
  .ap-download-secondary{background:rgba(255,255,255,.035);color:#eff9f7;border:1px solid rgba(204,238,236,.19)}
  .ap-download-secondary:hover{background:rgba(255,255,255,.07);border-color:rgba(53,223,192,.4)}
  .ap-note{font-size:12px;color:#718e93;margin:27px 0 0;letter-spacing:.2px}
  .ap-toast{position:fixed;z-index:20;bottom:24px;left:50%;transform:translateX(-50%);max-width:calc(100vw - 32px);padding:12px 18px;background:#102c31;border:1px solid rgba(53,223,192,.3);border-radius:12px;color:#e7f8f5;font-size:13px;box-shadow:0 10px 40px rgba(0,0,0,.3);text-align:center}
  .ap-overlay{position:fixed;inset:0;z-index:30;display:grid;place-items:center;padding:20px;background:rgba(1,10,13,.72);backdrop-filter:blur(10px)}
  .ap-dialog{position:relative;width:min(100%,460px);padding:36px 32px 32px;text-align:center;border:1px solid rgba(175,224,220,.15);border-radius:22px;background:#0b2027;box-shadow:0 28px 100px rgba(0,0,0,.4);animation:ap-enter .22s ease both}
  .ap-close{position:absolute;top:13px;left:15px;width:34px;height:34px;border:0;border-radius:10px;background:rgba(255,255,255,.06);color:#d5e8e6;font-size:25px;line-height:1;cursor:pointer}
  .ap-dialog-logo{width:52px;height:52px;object-fit:contain;border-radius:12px;margin-bottom:12px}
  .ap-dialog h2{font-size:22px;margin:0 0 12px;font-weight:800}
  .ap-dialog p{font-size:14px;line-height:2;color:#a8bec1;margin:0}
  .ap-email{display:inline-block;margin-top:15px;color:var(--ap-teal);font-size:15px;font-weight:700;text-decoration:none;border-bottom:1px solid rgba(53,223,192,.35);padding-bottom:3px}
  @keyframes ap-enter{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @media(min-width:601px) and (max-width:900px){.ap-header{height:78px;padding:0 28px}.ap-main{min-height:calc(100svh - 78px);padding:58px 34px 72px}.ap-hero{width:min(100%,700px)}.ap-mark{width:74px;height:74px;margin-bottom:25px}.ap-hero h1{font-size:clamp(58px,8vw,72px)}.ap-intro{max-width:490px;font-size:17px;margin:19px auto 32px}.ap-downloads{gap:12px}.ap-download{min-width:220px;padding:12px 14px}.ap-orb-one{left:-280px}.ap-orb-two{right:-230px}}\n  @media(max-width:600px){.ap-header{height:72px;padding:0 18px}.ap-brand{font-size:17px;gap:8px}.ap-brand img{width:32px;height:32px}.ap-nav{gap:0}.ap-nav button{font-size:12px;padding:9px 8px}.ap-main{min-height:calc(100svh - 72px);padding:48px 20px 58px}.ap-mark{width:68px;height:68px;border-radius:20px;margin-bottom:24px}.ap-mark img{width:46px;height:46px}.ap-hero h1{letter-spacing:-1.7px}.ap-intro{margin:17px auto 27px}.ap-downloads{flex-direction:column;align-items:stretch;width:min(100%,340px);margin:0 auto}.ap-download{width:100%;min-width:0}.ap-dialog{padding:34px 22px 26px}.ap-orb-one{left:-330px}.ap-orb-two{right:-250px}}
  @media(prefers-reduced-motion:reduce){.ap-hero,.ap-dialog{animation:none}.ap-download,.ap-nav button{transition:none}}
`;
