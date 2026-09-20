// An Pardaz Web Portal — production identity authentication modal.
import { useState } from "react";
import WI from "./WebIcons";
import anPardazLogo from "@/imports/ChatGPT_Image_Aug_10__2026__06_38_53_PM__3_.png";

type Mode = "login" | "register";

interface Props {
  onClose: () => void;
  onSuccess: (accessToken: string, email: string) => void;
}

const API_BASE = ((import.meta as any).env?.VITE_PLATFORM_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export default function WebAuthModal({ onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("ایمیل معتبر وارد کنید.");
      return;
    }
    if (password.length < 10 || password.length > 128) {
      setError("رمز عبور باید حداقل ۱۰ کاراکتر باشد.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register";
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password, ...(mode === "register" ? { displayName: displayName.trim() || undefined } : {}) }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || typeof body?.accessToken !== "string") {
        const messages: Record<string, string> = {
          invalid_credentials: "ایمیل یا رمز عبور صحیح نیست.",
          email_already_registered: "این ایمیل قبلاً ثبت شده است.",
          too_many_requests: "تعداد تلاش‌ها زیاد است؛ کمی بعد دوباره امتحان کنید.",
        };
        throw new Error(messages[body?.error] ?? "ورود به حساب انجام نشد.");
      }
      onSuccess(body.accessToken, cleanEmail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ارتباط با سرویس احراز هویت برقرار نشد.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.58)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
    >
      <div style={{ width:"100%", maxWidth:440, background:"var(--w-surface)", border:"1px solid var(--w-border)", borderRadius:22, boxShadow:"var(--w-shadow-lg)", overflow:"hidden" }}>
        <div style={{ padding:"22px 24px 18px", borderBottom:"1px solid var(--w-border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <img src={anPardazLogo} alt="آن پرداز" style={{ height:34, width:"auto", objectFit:"contain", borderRadius:7 }}/>
            <div>
              <div style={{ fontSize:16, fontWeight:900 }}>حساب آن پرداز</div>
              <div style={{ fontSize:11, color:"var(--w-muted)", marginTop:2 }}>احراز هویت یکپارچه اکوسیستم</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="بستن" style={{ width:32, height:32, borderRadius:9, background:"var(--w-card2)", border:"1px solid var(--w-border)", cursor:"pointer", color:"var(--w-muted)", fontSize:20 }}>×</button>
        </div>

        <div style={{ padding:"24px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, padding:4, background:"var(--w-card2)", borderRadius:10, marginBottom:20 }}>
            {(["login","register"] as Mode[]).map(m => (
              <button key={m} onClick={()=>{setMode(m);setError("");}} style={{ border:"none", borderRadius:8, padding:"9px", cursor:"pointer", fontFamily:"var(--w-font)", fontSize:12, fontWeight:800, background:mode===m?"var(--w-surface)":"transparent", color:mode===m?"var(--w-text)":"var(--w-muted)", boxShadow:mode===m?"var(--w-shadow)":"none" }}>
                {m==="login"?"ورود":"ثبت‌نام"}
              </button>
            ))}
          </div>

          {mode==="register" && (
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", display:"block", marginBottom:5 }}>نام نمایشی</label>
              <input value={displayName} onChange={e=>setDisplayName(e.target.value)} className="w-input" placeholder="نام شما" autoComplete="name"/>
            </div>
          )}

          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", display:"block", marginBottom:5 }}>ایمیل</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} className="w-input" placeholder="you@example.com" inputMode="email" autoComplete="email" dir="ltr"/>
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", display:"block", marginBottom:5 }}>رمز عبور</label>
            <input value={password} onChange={e=>setPassword(e.target.value)} className="w-input" placeholder="حداقل ۱۰ کاراکتر" type="password" autoComplete={mode==="login"?"current-password":"new-password"} dir="ltr"/>
          </div>

          {error && (
            <div style={{ marginBottom:14, padding:"10px 12px", borderRadius:10, background:"rgba(220,38,38,0.08)", border:"1px solid rgba(220,38,38,0.18)", color:"var(--w-danger)", fontSize:12, lineHeight:1.7 }}>
              {error}
            </div>
          )}

          <button onClick={submit} disabled={loading} className="w-btn w-btn-primary" style={{ width:"100%", padding:"12px", opacity:loading?0.65:1 }}>
            {loading ? "در حال اتصال..." : mode==="login" ? "ورود به حساب" : "ایجاد حساب"}
            {!loading && <WI n="arrow-left" s={15}/>}
          </button>

          <div style={{ marginTop:16, padding:"10px 12px", background:"rgba(8,145,178,0.06)", border:"1px solid rgba(8,145,178,0.15)", borderRadius:10, fontSize:11, color:"var(--w-muted)", lineHeight:1.8 }}>
            ورود سایت از همان سرویس هویت مشترک پلتفرم استفاده می‌کند؛ توکن حساب برای اتصال امن آن صراف، حساب کاربری و عملیات مالی استفاده می‌شود.
          </div>
        </div>
      </div>
    </div>
  );
}
