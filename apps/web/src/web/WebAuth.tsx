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
const ANSARRAF_API_BASE = ((import.meta as any).env?.VITE_ANSARRAF_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

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


export function WebKycModal({ onClose, currentStatus }: { onClose:()=>void; currentStatus:"not_verified"|"pending"|"verified"|"submitted" }) {
  const [fullName,setFullName]=useState("");
  const [nationalId,setNationalId]=useState("");
  const [mobile,setMobile]=useState("");
  const [birthDate,setBirthDate]=useState("");
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState("");
  const submit=async()=>{
    if(!fullName.trim()||!/^[0-9]{10}$/.test(nationalId)||!/^(?:09)[0-9]{9}$/.test(mobile)){setMessage("نام، کد ملی ۱۰ رقمی و موبایل معتبر لازم است.");return;}
    setLoading(true);setMessage("");
    try{
      const token=typeof window!=="undefined"?window.localStorage.getItem("anpardaz:accessToken")??"":"";
      const r=await fetch(`${ANSARRAF_API_BASE}/api/v1/kyc/submit`,{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${token}`},body:JSON.stringify({fullName,nationalId,mobile,birthDate:birthDate||undefined})});
      const body=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(body?.error==="kyc_provider_not_configured"?"سرویس احراز هویت صراف هنوز به ارائه‌دهنده متصل نشده است.":body?.error??"ارسال احراز هویت ناموفق بود.");
      setMessage("اطلاعات احراز هویت ثبت شد و برای بررسی ارسال شد.");
    }catch(e){setMessage(e instanceof Error?e.message:"ارسال احراز هویت ناموفق بود.");}finally{setLoading(false);}
  };
  if(currentStatus==="verified")return <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,zIndex:600,background:"rgba(0,0,0,.58)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div className="w-card" style={{width:"100%",maxWidth:430,padding:28,textAlign:"center"}}><WI n="check" s={32} style={{color:"#10b981"}}/><h3>احراز هویت تأیید شده است</h3><button onClick={onClose} className="w-btn w-btn-primary">بستن</button></div></div>;
  return <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,zIndex:600,background:"rgba(0,0,0,.58)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div className="w-card" style={{width:"100%",maxWidth:460,padding:24}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}><div><div style={{fontSize:17,fontWeight:900}}>احراز هویت آن صراف</div><div style={{fontSize:11,color:"var(--w-muted)",marginTop:3}}>اطلاعات شما به‌صورت رمزنگاری‌شده در سرویس صراف ثبت می‌شود.</div></div><button onClick={onClose} style={{width:32,height:32,borderRadius:9,border:"1px solid var(--w-border)",background:"var(--w-card2)",cursor:"pointer"}}>×</button></div>
      {[["نام و نام خانوادگی",fullName,setFullName,"text"],["کد ملی",nationalId,setNationalId,"text"],["شماره موبایل",mobile,setMobile,"tel"]].map(([label,value,setter,type])=><div key={String(label)} style={{marginBottom:11}}><label style={{display:"block",fontSize:11,fontWeight:700,color:"var(--w-muted)",marginBottom:5}}>{label}</label><input className="w-input" value={String(value)} onChange={e=>(setter as any)(e.target.value)} type={String(type)} dir="ltr"/></div>)}
      <div style={{marginBottom:14}}><label style={{display:"block",fontSize:11,fontWeight:700,color:"var(--w-muted)",marginBottom:5}}>تاریخ تولد (اختیاری)</label><input className="w-input" value={birthDate} onChange={e=>setBirthDate(e.target.value)} type="date" dir="ltr"/></div>
      {message&&<div style={{padding:"9px 11px",borderRadius:9,background:"var(--w-card2)",color:"var(--w-muted)",fontSize:11,lineHeight:1.8,marginBottom:12}}>{message}</div>}
      <button onClick={submit} disabled={loading} className="w-btn w-btn-primary" style={{width:"100%",padding:11,opacity:loading?.65:1}}>{loading?"در حال ارسال...":"ارسال برای بررسی"}</button>
    </div>
  </div>;
}
