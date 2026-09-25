import { useEffect, useState } from "react";
import WI from "./WebIcons";

type Settings = {
  theme: "dark" | "light";
  notificationsEnabled: boolean;
  keySoundEnabled: boolean;
  fontScale: number;
  pinEnabled: boolean;
  updatedAt: string;
};

async function requestSettings(path: string, init: RequestInit = {}) {
  const token = window.localStorage.getItem("anpardaz:accessToken") ?? "";
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const base = ((import.meta as any).env?.VITE_ANPARDAZ_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
  if (!base) throw new Error("anpardaz_api_unconfigured");
  const res = await fetch(`${base}${path}`, { ...init, headers, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(String(data?.error ?? "settings_request_failed"));
  return data;
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: () => void; label: string }) {
  return (
    <button aria-label={label} onClick={onChange} style={{ width:52, height:28, borderRadius:14, background:value?"#00b894":"var(--w-card2)", border:"1px solid var(--w-border)", position:"relative", cursor:"pointer" }}>
      <span style={{ position:"absolute", top:3, right:value?3:27, width:20, height:20, borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,.2)", transition:"right .18s" }}/>
    </button>
  );
}

export default function WebSettings({ onNavigate, onThemeChange }: { onNavigate: (p: any) => void; onThemeChange?: (light: boolean) => void }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [pinAction, setPinAction] = useState<"enable"|"change"|"disable"|null>(null);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const applyTheme = (theme: "dark"|"light") => {
    document.documentElement.classList.toggle("dark-theme", theme === "dark");
    document.body.style.background = theme === "dark" ? "#0d0d14" : "#f5f5fb";
  };

  useEffect(() => {
    let active = true;
    requestSettings("/api/v1/user/settings").then(({ settings: s }) => {
      if (!active || !s) return;
      setSettings(s);
      applyTheme(s.theme); onThemeChange?.(s.theme === "light");
      if (s.fontScale === 0) document.documentElement.style.fontSize = "";
      else document.documentElement.style.fontSize = `${100 + s.fontScale * 7}%`;
    }).catch(() => setMessage("دریافت تنظیمات انجام نشد.")).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const patch = async (next: Partial<Settings>) => {
    if (!settings) return;
    setSaving(true); setMessage("");
    try {
      const { settings: saved } = await requestSettings("/api/v1/user/settings", { method:"PATCH", body:JSON.stringify(next) });
      setSettings(saved);
      if (saved.theme) { applyTheme(saved.theme); onThemeChange?.(saved.theme === "light"); }
      if (saved.fontScale === 0) document.documentElement.style.fontSize = "";
      else document.documentElement.style.fontSize = `${100 + saved.fontScale * 7}%`;
    } catch { setMessage("ذخیره تنظیمات انجام نشد."); }
    finally { setSaving(false); }
  };

  const submitPin = async () => {
    if (!pinAction) return;
    if (!/^\d{4}$/.test(newPin) && pinAction !== "disable") { setMessage("رمز جدید باید دقیقاً ۴ رقم باشد."); return; }
    if (pinAction !== "disable" && newPin !== confirmPin) { setMessage("رمزهای جدید یکسان نیستند."); return; }
    if (pinAction !== "enable" && !/^\d{4}$/.test(currentPin)) { setMessage("رمز فعلی باید دقیقاً ۴ رقم باشد."); return; }
    try {
      setSaving(true); setMessage("");
      const path = `/api/v1/user/settings/pin/${pinAction}`;
      const body = pinAction === "enable" ? { newPin } : pinAction === "disable" ? { currentPin } : { currentPin, newPin };
      const data = await requestSettings(path, { method:"POST", body:JSON.stringify(body) });
      setSettings(s => s ? { ...s, pinEnabled: Boolean(data.pinEnabled) } : s);
      setPinAction(null); setCurrentPin(""); setNewPin(""); setConfirmPin("");
    } catch { setMessage("عملیات رمز انجام نشد؛ اطلاعات واردشده را بررسی کنید."); }
    finally { setSaving(false); }
  };

  if (loading) return <div dir="rtl" style={{ maxWidth:760, margin:"60px auto", padding:"0 24px", textAlign:"center", color:"var(--w-muted)" }}>در حال دریافت تنظیمات...</div>;
  if (!settings) return <div dir="rtl" style={{ maxWidth:760, margin:"60px auto", padding:"0 24px", textAlign:"center" }}><p>{message || "تنظیمات در دسترس نیست."}</p><button className="w-btn w-btn-primary" onClick={()=>onNavigate("home")}>بازگشت</button></div>;

  const rows = [
    { icon:"sun", title:`تم ${settings.theme==="light"?"روشن":"تاریک"}`, sub:"ظاهر برنامه در آن پرداز", control:<Toggle value={settings.theme==="light"} label="تغییر تم" onChange={()=>patch({theme:settings.theme==="light"?"dark":"light"})}/> },
    { icon:"bell", title:"اعلان‌ها", sub:settings.notificationsEnabled?"دریافت اعلان‌های مهم فعال است":"اعلان‌های مهم غیرفعال است", control:<Toggle value={settings.notificationsEnabled} label="فعال یا غیرفعال کردن اعلان‌ها" onChange={()=>patch({notificationsEnabled:!settings.notificationsEnabled})}/> },
    { icon:"keyboard", title:"صدای کیبورد", sub:settings.keySoundEnabled?"صدا فعال است":"صدا غیرفعال است", control:<Toggle value={settings.keySoundEnabled} label="فعال یا غیرفعال کردن صدای کیبورد" onChange={()=>patch({keySoundEnabled:!settings.keySoundEnabled})}/> },
  ];

  return (
    <div className="w-fade" dir="rtl" style={{ maxWidth:760, margin:"40px auto 80px", padding:"0 24px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
        <button onClick={()=>onNavigate("home")} style={{ width:40,height:40,borderRadius:12,border:"1px solid var(--w-border)",background:"var(--w-card)",color:"var(--w-text)",cursor:"pointer" }}><WI n="arrow-right" s={18}/></button>
        <div><h1 style={{ fontSize:28, fontWeight:900, margin:0 }}>تنظیمات</h1><p style={{ color:"var(--w-muted)",fontSize:12,margin:"5px 0 0" }}>تنظیمات شخصی شما در حساب آن پرداز ذخیره می‌شود.</p></div>
      </div>

      <div className="w-card" style={{ padding:"4px 22px" }}>
        {rows.map((r,i)=><div key={r.title} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,padding:"18px 0",borderBottom:i<rows.length-1?"1px solid var(--w-border)":"none" }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ width:42,height:42,borderRadius:12,background:"rgba(0,184,148,.1)",display:"flex",alignItems:"center",justifyContent:"center",color:"#00b894" }}><WI n={r.icon} s={19}/></div>
            <div><div style={{fontWeight:800,fontSize:14}}>{r.title}</div><div style={{fontSize:11,color:"var(--w-muted)",marginTop:3}}>{r.sub}</div></div>
          </div>{r.control}
        </div>)}

        <div style={{padding:"20px 0",borderBottom:"1px solid var(--w-border)"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <div style={{width:42,height:42,borderRadius:12,background:"rgba(124,58,237,.1)",display:"flex",alignItems:"center",justifyContent:"center",color:"#7c3aed"}}><WI n="search" s={19}/></div>
            <div><div style={{fontWeight:800,fontSize:14}}>بزرگ‌نمایی</div><div style={{fontSize:11,color:"var(--w-muted)",marginTop:3}}>{settings.fontScale===0?"اندازه پیش‌فرض":`+${settings.fontScale}`}</div></div>
          </div>
          <input aria-label="بزرگ‌نمایی" type="range" min={0} max={10} step={1} value={settings.fontScale} onChange={e=>patch({fontScale:Number(e.target.value)})} style={{width:"100%",accentColor:"#7c3aed"}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--w-muted)",marginTop:5}}><span>پیش‌فرض</span><span>+۱۰</span></div>
        </div>

        <div style={{padding:"20px 0"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <div style={{width:42,height:42,borderRadius:12,background:"rgba(0,184,148,.1)",display:"flex",alignItems:"center",justifyContent:"center",color:"#00b894"}}><WI n="lock" s={19}/></div>
            <div><div style={{fontWeight:800,fontSize:14}}>رمز ۴ رقمی</div><div style={{fontSize:11,color:"var(--w-muted)",marginTop:3}}>{settings.pinEnabled?"فعال":"غیرفعال"}</div></div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {!settings.pinEnabled && <button className="w-btn w-btn-primary" onClick={()=>setPinAction("enable")}>فعال‌سازی رمز</button>}
            {settings.pinEnabled && <><button className="w-btn w-btn-primary" onClick={()=>setPinAction("change")}>تغییر رمز</button><button className="w-btn" onClick={()=>setPinAction("disable")}>غیرفعال کردن</button></>}
          </div>
          {pinAction && <div style={{marginTop:14,padding:14,borderRadius:12,background:"var(--w-card2)",border:"1px solid var(--w-border)",display:"grid",gap:8}}>
            {pinAction!=="enable" && <input className="w-input" inputMode="numeric" maxLength={4} type="password" placeholder="رمز فعلی" value={currentPin} onChange={e=>setCurrentPin(e.target.value.replace(/\D/g,""))}/>}
            {pinAction!=="disable" && <><input className="w-input" inputMode="numeric" maxLength={4} type="password" placeholder="رمز جدید ۴ رقمی" value={newPin} onChange={e=>setNewPin(e.target.value.replace(/\D/g,""))}/><input className="w-input" inputMode="numeric" maxLength={4} type="password" placeholder="تکرار رمز جدید" value={confirmPin} onChange={e=>setConfirmPin(e.target.value.replace(/\D/g,""))}/></>}
            <div style={{display:"flex",gap:8}}><button className="w-btn w-btn-primary" disabled={saving} onClick={submitPin}>{saving?"در حال ذخیره...":"تأیید"}</button><button className="w-btn" onClick={()=>{setPinAction(null);setCurrentPin("");setNewPin("");setConfirmPin("");}}>انصراف</button></div>
          </div>}
        </div>
      </div>

      {message && <div style={{marginTop:14,padding:12,borderRadius:12,background:"rgba(232,81,42,.08)",border:"1px solid rgba(232,81,42,.2)",color:"#e8512a",fontSize:12}}>{message}</div>}
      {saving && <div style={{marginTop:10,fontSize:11,color:"var(--w-muted)"}}>در حال ذخیره در حساب کاربری...</div>}
    </div>
  );
}
