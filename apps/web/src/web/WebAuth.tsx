// ─────────────────────────────────────────────────
// An Pardaz Web Portal — Authentication Modal
// Phone → OTP → done. NEVER shown on initial load.
// Consistent with Version 327 auth concept.
// ─────────────────────────────────────────────────
import { useState, useRef, useEffect } from "react";
import WI from "./WebIcons";
import anPardazLogo from "@/imports/ChatGPT_Image_Aug_10__2026__06_38_53_PM__3_.png";

type AuthStep = "phone" | "otp" | "done";

interface Props {
  onClose: () => void;
  onSuccess: (phone: string) => void;
}

const FA = (s: string | number) => String(s).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]);

export default function WebAuthModal({ onClose, onSuccess }: Props) {
  const [step, setStep]     = useState<AuthStep>("phone");
  const [phone, setPhone]   = useState("");
  const [otp, setOtp]       = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [phoneErr, setPhoneErr]   = useState("");
  const [otpErr, setOtpErr]       = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // countdown for resend
  useEffect(() => {
    if (countdown <= 0) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(timerRef.current!); return 0; } return c - 1; }), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [countdown]);

  const submitPhone = () => {
    if (!/^09\d{9}$/.test(phone)) { setPhoneErr("شماره موبایل معتبر نیست"); return; }
    setPhoneErr("");
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep("otp"); setCountdown(120); otpRefs.current[0]?.focus(); }, 900);
  };

  const submitOtp = () => {
    const code = otp.join("");
    if (code.length < 6) { setOtpErr("کد تأیید ناقص است"); return; }
    setOtpErr("");
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep("done"); setTimeout(() => onSuccess(phone), 800); }, 900);
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[i] = digit;
    setOtp(next);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  };

  // Mask phone for display
  const maskedPhone = phone.length >= 7 ? phone.slice(0, 4) + "***" + phone.slice(-4) : phone;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.58)", backdropFilter:"blur(8px)",
        display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
    >
      <div style={{ width:"100%", maxWidth:420, background:"var(--w-surface)", border:"1px solid var(--w-border)",
        borderRadius:22, boxShadow:"var(--w-shadow-lg)", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ padding:"24px 24px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <img src={anPardazLogo} alt="آن پرداز" style={{ height:32, width:"auto", objectFit:"contain", borderRadius:7 }}/>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:9, background:"var(--w-card2)",
            border:"1px solid var(--w-border)", cursor:"pointer", display:"flex", alignItems:"center",
            justifyContent:"center", color:"var(--w-muted)" }}>
            <WI n="close" s={14}/>
          </button>
        </div>

        <div style={{ padding:"24px" }}>
          {/* ── PHONE STEP ── */}
          {step === "phone" && (
            <>
              <h2 style={{ fontSize:20, fontWeight:900, margin:"0 0 6px" }}>ورود / ثبت‌نام</h2>
              <p style={{ fontSize:13, color:"var(--w-muted)", margin:"0 0 24px", lineHeight:1.7 }}>
                شماره موبایل خود را وارد کنید. اگر حساب ندارید، خودکار ثبت‌نام می‌شوید.
              </p>
              <label style={{ fontSize:12, fontWeight:700, color:"var(--w-muted)", display:"block", marginBottom:6 }}>
                شماره موبایل
              </label>
              <input
                value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g, "")); setPhoneErr(""); }}
                onKeyDown={e => e.key === "Enter" && submitPhone()}
                placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                maxLength={11}
                inputMode="numeric"
                dir="ltr"
                className="w-input"
                style={{ fontSize:16, letterSpacing:"0.06em", textAlign:"left" }}
                autoFocus
              />
              {phoneErr && (
                <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:6, color:"#dc2626", fontSize:12 }}>
                  <WI n="alert" s={13}/>{phoneErr}
                </div>
              )}
              <button
                onClick={submitPhone} disabled={loading || phone.length < 11}
                className="w-btn w-btn-primary"
                style={{ width:"100%", padding:"13px", fontSize:15, marginTop:18, opacity: phone.length < 11 ? 0.55 : 1 }}
              >
                {loading
                  ? <LoadingDots/>
                  : <><WI n="arrow-left" s={16}/> ارسال کد تأیید</>
                }
              </button>
              <p style={{ fontSize:11, color:"var(--w-muted)", textAlign:"center", marginTop:14, lineHeight:1.7 }}>
                با ورود، <span style={{ color:"var(--w-accent)", cursor:"pointer" }}>قوانین و مقررات</span> و{" "}
                <span style={{ color:"var(--w-accent)", cursor:"pointer" }}>حریم خصوصی</span> آن پرداز را می‌پذیرید.
              </p>
            </>
          )}

          {/* ── OTP STEP ── */}
          {step === "otp" && (
            <>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                <button onClick={() => setStep("phone")} style={{ background:"none", border:"none", cursor:"pointer",
                  color:"var(--w-muted)", display:"flex", padding:0 }}>
                  <WI n="arrow-right" s={18}/>
                </button>
                <h2 style={{ fontSize:20, fontWeight:900, margin:0 }}>کد تأیید</h2>
              </div>
              <p style={{ fontSize:13, color:"var(--w-muted)", margin:"0 0 24px", lineHeight:1.7 }}>
                کد ۶ رقمی ارسال‌شده به <strong style={{ color:"var(--w-text)", direction:"ltr", display:"inline-block" }}>{maskedPhone}</strong> را وارد کنید.
              </p>

              {/* OTP boxes — RTL: index 0 is leftmost visually, enter left-to-right */}
              <div style={{ display:"flex", gap:8, justifyContent:"center", direction:"ltr", marginBottom:20 }}>
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    value={d}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKey(i, e)}
                    inputMode="numeric"
                    maxLength={1}
                    style={{ width:46, height:54, textAlign:"center", fontSize:22, fontWeight:800,
                      background:"var(--w-card2)", border:`1.5px solid ${d ? "var(--w-accent)" : "var(--w-border)"}`,
                      borderRadius:11, color:"var(--w-text)", outline:"none", fontFamily:"Vazirmatn",
                      transition:"border-color 0.13s" }}
                  />
                ))}
              </div>

              {otpErr && (
                <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:12, color:"#dc2626", fontSize:12, justifyContent:"center" }}>
                  <WI n="alert" s={13}/>{otpErr}
                </div>
              )}

              <button
                onClick={submitOtp} disabled={loading || otp.join("").length < 6}
                className="w-btn w-btn-primary"
                style={{ width:"100%", padding:"13px", fontSize:15, opacity: otp.join("").length < 6 ? 0.55 : 1 }}
              >
                {loading ? <LoadingDots/> : <><WI n="check" s={16}/> تأیید و ورود</>}
              </button>

              {/* Resend */}
              <div style={{ textAlign:"center", marginTop:14, fontSize:12, color:"var(--w-muted)" }}>
                {countdown > 0
                  ? <>ارسال مجدد کد تا {FA(Math.floor(countdown/60))}:{FA(String(countdown%60).padStart(2,"0"))}</>
                  : <button onClick={() => { setStep("phone"); setOtp(["","","","","",""]); setCountdown(0); }}
                      style={{ background:"none", border:"none", cursor:"pointer", color:"var(--w-accent)", fontSize:12, fontWeight:700, fontFamily:"Vazirmatn" }}>
                      ارسال مجدد کد
                    </button>
                }
              </div>
            </>
          )}

          {/* ── SUCCESS ── */}
          {step === "done" && (
            <div style={{ textAlign:"center", padding:"16px 0" }}>
              <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(5,150,105,0.1)",
                border:"1px solid rgba(5,150,105,0.25)", display:"flex", alignItems:"center",
                justifyContent:"center", margin:"0 auto 16px", color:"#059669" }}>
                <WI n="check-circle" s={32}/>
              </div>
              <div style={{ fontSize:18, fontWeight:900, marginBottom:6 }}>ورود موفق</div>
              <div style={{ fontSize:13, color:"var(--w-muted)" }}>در حال انتقال...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── KYC modal (used by exchange / financial actions) ──
export function WebKycModal({ onClose, currentStatus }: { onClose: () => void; currentStatus: string }) {
  const [step, setStep] = useState<"info"|"national"|"photo"|"done">("info");
  const [nationalId, setNationalId] = useState("");
  const [birthDate, setBirthDate]   = useState("");

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.58)", backdropFilter:"blur(8px)",
        display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <div style={{ width:"100%", maxWidth:480, background:"var(--w-surface)", border:"1px solid var(--w-border)",
        borderRadius:22, boxShadow:"var(--w-shadow-lg)", overflow:"hidden" }}>

        {/* Progress bar */}
        <div style={{ height:3, background:"var(--w-border)" }}>
          <div style={{ height:"100%", background:"var(--w-accent)", width: step==="info"?"25%":step==="national"?"50%":step==="photo"?"75%":"100%", transition:"width 0.3s" }}/>
        </div>

        <div style={{ padding:"24px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <h2 style={{ fontSize:18, fontWeight:900, margin:0 }}>احراز هویت</h2>
            <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, background:"var(--w-card2)",
              border:"1px solid var(--w-border)", cursor:"pointer", display:"flex", alignItems:"center",
              justifyContent:"center", color:"var(--w-muted)" }}>
              <WI n="close" s={13}/>
            </button>
          </div>

          {step === "info" && (
            <>
              <div style={{ padding:"16px", background:"rgba(8,145,178,0.07)", border:"1px solid rgba(8,145,178,0.18)", borderRadius:12, marginBottom:20, fontSize:13, color:"var(--w-text)", lineHeight:1.8 }}>
                <strong>برای معامله در آن صراف</strong> نیاز به احراز هویت دارید.<br/>
                مدارک مورد نیاز: کد ملی، تاریخ تولد، تصویر کارت ملی
              </div>
              {[
                { icon:"shield",      label:"اطلاعات هویتی",   desc:"کد ملی و تاریخ تولد" },
                { icon:"document",    label:"بارگذاری مدرک",   desc:"تصویر کارت ملی" },
                { icon:"check-circle",label:"بررسی و تأیید",   desc:"۱ تا ۳ روز کاری" },
              ].map((s, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:"rgba(124,58,237,0.1)",
                    border:"1px solid rgba(124,58,237,0.2)", display:"flex", alignItems:"center",
                    justifyContent:"center", color:"var(--w-accent)", flexShrink:0 }}>
                    <WI n={s.icon} s={16}/>
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700 }}>{s.label}</div>
                    <div style={{ fontSize:11, color:"var(--w-muted)" }}>{s.desc}</div>
                  </div>
                </div>
              ))}
              <button onClick={()=>setStep("national")} className="w-btn w-btn-primary" style={{ width:"100%", padding:"12px", fontSize:14, marginTop:12 }}>
                <WI n="arrow-left" s={16}/> شروع احراز هویت
              </button>
            </>
          )}

          {step === "national" && (
            <>
              <p style={{ fontSize:13, color:"var(--w-muted)", marginBottom:20 }}>اطلاعات شناسنامه‌ای خود را وارد کنید.</p>
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, fontWeight:700, color:"var(--w-muted)", display:"block", marginBottom:6 }}>کد ملی</label>
                <input value={nationalId} onChange={e=>setNationalId(e.target.value.replace(/\D/g,""))} maxLength={10}
                  placeholder="۱۰ رقم" inputMode="numeric" dir="ltr" className="w-input" style={{ textAlign:"left" }}/>
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:12, fontWeight:700, color:"var(--w-muted)", display:"block", marginBottom:6 }}>تاریخ تولد</label>
                <input value={birthDate} onChange={e=>setBirthDate(e.target.value)} placeholder="مثال: ۱۳۷۰/۰۱/۱۵"
                  className="w-input"/>
              </div>
              <button onClick={()=>setStep("photo")} disabled={nationalId.length<10||!birthDate}
                className="w-btn w-btn-primary" style={{ width:"100%", padding:"12px", fontSize:14, opacity:nationalId.length<10||!birthDate?0.5:1 }}>
                مرحله بعد
              </button>
            </>
          )}

          {step === "photo" && (
            <>
              <p style={{ fontSize:13, color:"var(--w-muted)", marginBottom:20 }}>تصویر واضح کارت ملی (رو و پشت) بارگذاری کنید.</p>
              {["تصویر روی کارت ملی","تصویر پشت کارت ملی","سلفی با کارت ملی"].map(l => (
                <div key={l} style={{ display:"flex", alignItems:"center", gap:10, padding:"14px", background:"var(--w-card2)",
                  border:"1.5px dashed var(--w-border2)", borderRadius:12, cursor:"pointer", marginBottom:10,
                  color:"var(--w-muted)", fontSize:13 }}>
                  <WI n="upload" s={18}/>
                  {l}
                </div>
              ))}
              <button onClick={()=>setStep("done")} className="w-btn w-btn-primary" style={{ width:"100%", padding:"12px", fontSize:14, marginTop:8 }}>
                ارسال برای بررسی
              </button>
            </>
          )}

          {step === "done" && (
            <div style={{ textAlign:"center", padding:"16px 0" }}>
              <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(217,119,6,0.1)",
                border:"1px solid rgba(217,119,6,0.25)", display:"flex", alignItems:"center",
                justifyContent:"center", margin:"0 auto 16px", color:"#d97706" }}>
                <WI n="clock" s={32}/>
              </div>
              <div style={{ fontSize:18, fontWeight:900, marginBottom:8 }}>در انتظار بررسی</div>
              <div style={{ fontSize:13, color:"var(--w-muted)", lineHeight:1.7, marginBottom:20 }}>
                مدارک شما دریافت شد و ظرف ۱ تا ۳ روز کاری بررسی خواهد شد.
              </div>
              <button onClick={onClose} className="w-btn w-btn-ghost" style={{ padding:"10px 24px" }}>بستن</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <span style={{ display:"inline-flex", gap:4, alignItems:"center" }}>
      {[0,1,2].map(i => (
        <span key={i} style={{ width:6, height:6, borderRadius:"50%", background:"rgba(255,255,255,0.8)",
          animation:`wDot 1s ${i*0.2}s ease-in-out infinite`, display:"inline-block" }}/>
      ))}
      <style>{`@keyframes wDot{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>
    </span>
  );
}
