// آن هوش — AI Operating Platform · An Pardaz Ecosystem
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useBackHandler } from "./backHandler";

// ══════════════════════════════════════════════════════════════════
// ICON SYSTEM — consistent 1.6px stroke, round caps
// ══════════════════════════════════════════════════════════════════
function Ic({ n, s = 20, w = 1.6, fill }: { n: string; s?: number; w?: number; fill?: string }) {
  const p = {
    width: s, height: s, viewBox: "0 0 24 24",
    fill: fill ?? "none", stroke: fill ? "none" : "currentColor",
    strokeWidth: w, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  switch (n) {
    case "video":      return <svg {...p}><path d="M15 10l4.55-2.07A1 1 0 0 1 21 8.85v6.3a1 1 0 0 1-1.45.92L15 14"/><rect x="2" y="7" width="13" height="10" rx="2.5"/></svg>;
    case "image":      return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
    case "music":      return <svg {...p}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
    case "voice":      return <svg {...p}><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="9" y1="22" x2="15" y2="22"/></svg>;
    case "write":      return <svg {...p}><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>;
    case "code":       return <svg {...p}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
    case "translate":  return <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
    case "analyze":    return <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>;
    case "content":    return <svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case "assistant":  return <svg {...p}><path d="M12 3c-4.4 0-8 2.9-8 6.5 0 1.9.9 3.6 2.4 4.8L5 18l4.5-1.5c.8.2 1.6.3 2.5.3 4.4 0 8-2.9 8-6.5S16.4 3 12 3z"/><circle cx="8.5" cy="9.5" r=".7" fill="currentColor" stroke="none"/><circle cx="12" cy="9.5" r=".7" fill="currentColor" stroke="none"/><circle cx="15.5" cy="9.5" r=".7" fill="currentColor" stroke="none"/></svg>;
    case "back":       return <svg {...p}><polyline points="9 18 15 12 9 6"/></svg>;
    case "menu":       return <svg {...p}><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>;
    case "close":      return <svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    case "chevron":    return <svg {...p}><polyline points="6 9 12 15 18 9"/></svg>;
    case "send":       return <svg viewBox="0 0 24 24" width={s} height={s} fill="currentColor"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>;
    case "attach":     return <svg {...p}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>;
    case "mic":        return <svg {...p}><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/></svg>;
    case "plus":       return <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case "deep":       return <svg {...p}><circle cx="12" cy="12" r="2.5"/><path d="M12 1v3.5M12 19.5V23M1 12h3.5M19.5 12H23M4.4 4.4l2.47 2.47M17.13 17.13l2.47 2.47M4.4 19.6l2.47-2.47M17.13 6.87l2.47-2.47"/></svg>;
    case "check":      return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>;
    case "clock":      return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    case "spark":      return <svg {...p}><path d="M13 2L4.09 12.26A1 1 0 0 0 5 14h6l-2 8 8.91-10.26A1 1 0 0 0 17 10h-6z"/></svg>;
    case "folder":     return <svg {...p}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
    case "compass":    return <svg {...p}><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>;
    case "chat":       return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case "search":     return <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
    case "trash":      return <svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
    case "dots":       return <svg {...p}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>;
    case "star":       return <svg {...p}><path d="M12 2L14.9 9.26H22L16.04 13.74L18.9 21L12 16.54L5.1 21L7.96 13.74L2 9.26H9.1L12 2Z"/></svg>;
    case "edit":       return <svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
    case "settings":   return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    default:           return <svg {...p}><circle cx="12" cy="12" r="10"/></svg>;
  }
}

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════
interface AIModel {
  id: string; name: string; provider: string; desc: string;
  capabilities: string[]; providerColor: string;
  badge?: "new" | "pro"; contextWindow?: string;
}
interface CreationMode {
  id: string; label: string; shortDesc: string; iconId: string;
  category: string; placeholder: string;
}
interface Message {
  id: string; role: "user" | "ai"; text: string;
  modelId?: string; ts: Date; thinking?: boolean;
}
interface Conversation {
  id: string; title: string; preview: string;
  messages: Message[]; modelId: string; modeId?: string;
  createdAt: string; updatedAt: string; group: string;
}
interface Project {
  id: string; title: string; description: string;
  modelId: string; modeId?: string; conversationIds: string[];
  createdAt: string; updatedAt: string; accentColor: string;
}

// ══════════════════════════════════════════════════════════════════
// AI MODEL CATALOG — scalable, provider-grouped
// ══════════════════════════════════════════════════════════════════
let AI_MODELS: AIModel[] = [];
let PROVIDERS: string[] = [];
const PROVIDERS = [...new Set(AI_MODELS.map(m => m.provider))];

const CAPABILITY_LABELS: Record<string, string> = {
  "reasoning": "استدلال", "coding": "کد", "vision": "تصویر",
  "image-gen": "تصویرسازی", "video-gen": "ویدیو", "music-gen": "موسیقی",
  "voice": "صدا", "translation": "ترجمه", "doc-analysis": "سند",
  "fast": "سریع", "writing": "نوشتن", "long-context": "متن بلند",
};

// ══════════════════════════════════════════════════════════════════
// CREATION MODES
// ══════════════════════════════════════════════════════════════════
const CREATION_MODES: CreationMode[] = [
  { id:"video",     label:"ساخت ویدیو",       shortDesc:"متن به ویدیو",        iconId:"video",     category:"creative", placeholder:"ویدیوی مورد نظر را توصیف کنید — سبک، مدت، محتوا و رنگ‌بندی..." },
  { id:"image",     label:"ساخت تصویر",       shortDesc:"تصویرسازی هوشمند",   iconId:"image",     category:"creative", placeholder:"تصویر دقیق مورد نظر را توصیف کنید — موضوع، سبک، ترکیب‌بندی..." },
  { id:"music",     label:"ساخت موسیقی",      shortDesc:"خلق صدا و آهنگ",     iconId:"music",     category:"creative", placeholder:"سبک موسیقی، حال و هوا و ابزار مورد نظر را بنویسید..." },
  { id:"voice",     label:"صداگذاری",         shortDesc:"تبدیل متن به صدا",   iconId:"voice",     category:"creative", placeholder:"متنی که باید صداگذاری شود را وارد کنید — لحن و جنسیت صدا..." },
  { id:"write",     label:"نوشتن",            shortDesc:"محتوای حرفه‌ای",     iconId:"write",     category:"text",     placeholder:"موضوع، سبک و طول را مشخص کنید — مقاله، ایمیل، گزارش..." },
  { id:"code",      label:"کدنویسی",          shortDesc:"برنامه‌نویسی",       iconId:"code",      category:"text",     placeholder:"کد مورد نیاز را توضیح دهید — زبان، عملکرد، ورودی و خروجی..." },
  { id:"translate", label:"ترجمه",            shortDesc:"ترجمه تخصصی",       iconId:"translate", category:"text",     placeholder:"متن مورد ترجمه را وارد کنید و زبان مبدأ و مقصد را مشخص کنید..." },
  { id:"analyze",   label:"تحلیل داده",       shortDesc:"بینش و تفسیر",       iconId:"analyze",   category:"data",     placeholder:"داده‌ها، گزارش یا موضوع مورد تحلیل را وارد کنید..." },
  { id:"content",   label:"تولید محتوا",      shortDesc:"شبکه‌های اجتماعی",  iconId:"content",   category:"text",     placeholder:"پلتفرم مقصد، موضوع و لحن محتوا را مشخص کنید..." },
  { id:"assistant", label:"دستیار",           shortDesc:"پرسش و پاسخ",        iconId:"assistant", category:"tool",     placeholder:"سؤال خود را بپرسید یا از دستیار کمک بخواهید..." },
];

const CATEGORIES = [
  { id:"all", label:"همه" }, { id:"creative", label:"خلاقانه" },
  { id:"text", label:"نوشتار" }, { id:"data", label:"داده" }, { id:"tool", label:"ابزار" },
];

// ══════════════════════════════════════════════════════════════════
// DEMO STATIC DATA
// ══════════════════════════════════════════════════════════════════
const DEMO_CONVS: Conversation[] = [];
const DEMO_PROJECTS: Project[] = [];

const AH_TABS: { id:AhTab; label:string; icon:string }[] = [
  { id:"home",     label:"چت",       icon:"chat"    },
  { id:"history",  label:"تاریخچه",  icon:"clock"   },
  { id:"projects", label:"پروژه‌ها", icon:"folder"  },
  { id:"explore",  label:"کشف",      icon:"compass" },
];

// ══════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════════
export default function AnHooshScreen({ onBack }: { onBack: () => void }) {
  const [tab, setTab]               = useState<AhTab>("home");
  const [modelId, setModelId]       = useState("");
  const [showModels, setShowModels] = useState(false);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState("");
  const [deepThink, setDeepThink]   = useState(false);
  const [activeMode, setActiveMode] = useState<CreationMode|null>(null);
  const [filterCat, setFilterCat]   = useState("all");
  const [showNewProj, setShowNewProj] = useState(false);
  const [conversationId, setConversationId] = useState<number|null>(null);
  const [aiError, setAiError] = useState<string|null>(null);
  const platformApi = ((import.meta as any).env?.VITE_PLATFORM_API_URL as string|undefined)?.replace(/\/$/,"") ?? "";
  const hooshApi = useCallback(async (path:string, init:RequestInit={}) => {
    const token=window.localStorage.getItem("anpardaz:accessToken")??"";
    if(!platformApi) throw new Error("anpardaz_api_unconfigured");
    if(!token) throw new Error("auth_required");
    const headers=new Headers(init.headers); headers.set("accept","application/json"); headers.set("authorization",`Bearer ${token}`);
    if(init.body&&!headers.has("content-type")) headers.set("content-type","application/json");
    const res=await fetch(`${platformApi}${path}`,{...init,headers,cache:"no-store"});
    const data=await res.json().catch(()=>({})); if(!res.ok) throw new Error(String(data?.error??"hoosh_request_failed")); return data;
  },[platformApi]);

  useEffect(() => {
    hooshApi("/api/v1/hoosh/models").then((d:any) => {
      const providers=d.providers||[];
      AI_MODELS=providers.flatMap((p:any)=>(p.models||[]).map((id:string)=>({id,name:id,provider:p.id,desc:"مدل فعال آن هوش از تنظیمات سرور",capabilities:[],providerColor:"#8b5cf6"})));
      PROVIDERS=providers.map((p:any)=>p.id);
      if(AI_MODELS[0] && !modelId) setModelId(AI_MODELS[0].id);
      else if(AI_MODELS[0] && !AI_MODELS.some(m=>m.id===modelId)) setModelId(AI_MODELS[0].id);
    }).catch(()=>{});
  }, [hooshApi]);


  // Device back button: close panels first, then exit to main app
  useBackHandler(() => {
    if (showModels) { setShowModels(false); return; }
    if (showNewProj) { setShowNewProj(false); return; }
    onBack();
  });

  const inChat = messages.length > 0;
  const model = AI_MODELS.find(m=>m.id===modelId)!;

  const send = useCallback(async () => {
    const value=input.trim();
    if(!value)return;
    setAiError(null);
    const u: Message = { id:`u${Date.now()}`, role:"user", text:value, ts:new Date() };
    const t: Message = { id:`t${Date.now()}`, role:"ai", text:"", thinking:true, modelId, ts:new Date() };
    setMessages(prev=>[...prev,u,t]); setInput("");
    try {
      let cid=conversationId;
      if(!cid){
        const d=await hooshApi("/api/v1/hoosh/conversations",{method:"POST",body:JSON.stringify({title:value.slice(0,80),model:modelId,mode:activeMode?.id??"chat"})});
        cid=Number(d.conversation.id); setConversationId(cid);
      }
      await hooshApi(`/api/v1/hoosh/conversations/${cid}/messages`,{
        method:"POST",headers:{"Idempotency-Key":`hoosh-mobile-${cid}-${Date.now()}`},
        body:JSON.stringify({content:value,model:modelId,mode:activeMode?.id??"chat"})
      });
      for(let i=0;i<30;i++){
        await new Promise(r=>setTimeout(r,1000));
        const d=await hooshApi(`/api/v1/hoosh/conversations/${cid}`);
        const assistant=(d.messages||[]).filter((m:any)=>m.role==="assistant").at(-1);
        if(assistant){
          setMessages((d.messages||[]).map((m:any)=>({id:String(m.id),role:m.role==="assistant"?"ai":"user",text:m.content,modelId:m.metadata?.model??modelId,ts:new Date(m.created_at)})));
          break;
        }
      }
    }catch(err:any){
      setAiError(err.message);
      setMessages(prev=>prev.filter(m=>!m.thinking));
    }
  },[input,modelId,deepThink,conversationId,hooshApi,activeMode]);
  const newChat = useCallback(()=>{ setMessages([]); setInput(""); setActiveMode(null); setConversationId(null); setAiError(null); setTab("home"); }, []);

  const handleSelectMode = (mode: CreationMode) => {
    if(mode.id==="__clear__"){ setActiveMode(null); return; }
    setActiveMode(prev => prev?.id===mode.id ? null : mode);
  };

  return (
    <>
      <style>{`
        .ah-root{
          /* Deep indigo-navy — premium, not pure black */
          --ah-bg:#0F1020; --ah-surface:#161728; --ah-card:#1C1E30;
          --ah-input:#222438; --ah-border:rgba(100,100,200,0.16);
          --ah-border-acc:rgba(139,92,246,0.28);
          --ah-text:#E8E6F8; --ah-muted:rgba(180,178,230,0.55); --ah-accent:#8b5cf6;
        }
        .light-theme .ah-root{
          --ah-bg:#f5f5fb; --ah-surface:#ffffff; --ah-card:#f0f0f8;
          --ah-input:#e8e8f2; --ah-border:rgba(0,0,0,0.08);
          --ah-border-acc:rgba(139,92,246,0.22);
          --ah-text:#18181e; --ah-muted:rgba(24,24,30,0.44);
        }
        @keyframes ahBounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}
        .ah-scroll::-webkit-scrollbar{width:2px}
        .ah-scroll::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.2);border-radius:2px}
        .ah-noscroll::-webkit-scrollbar{height:0;display:none}
        .ah-noscroll{scrollbar-width:none}
        .ah-ico-btn{background:none;border:none;cursor:pointer;width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;color:var(--ah-muted);transition:background 0.13s}
        .ah-ico-btn:hover{background:rgba(255,255,255,0.06)}
        .ah-send-btn{width:36px;height:36px;border-radius:11px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.14s}
        .ah-send-btn:hover:not(:disabled){transform:scale(1.06)}
        .ah-send-btn:active:not(:disabled){transform:scale(0.95)}
        .ah-send-btn:disabled{cursor:default}
        .ah-deep-btn{display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:9px;cursor:pointer;background:transparent;border:1.5px solid var(--ah-border);color:var(--ah-muted);font-size:11px;font-weight:700;font-family:Vazirmatn;transition:all 0.13s}
        .ah-deep-btn.on{background:rgba(139,92,246,0.14);border-color:rgba(139,92,246,0.4);color:#a78bfa}
        .ah-input-wrap{transition:border-color 0.14s}
        .ah-input-wrap:focus-within{border-color:rgba(139,92,246,0.4)!important}
        .ah-input-wrap textarea{resize:none;scrollbar-width:none}
        .ah-input-wrap textarea::-webkit-scrollbar{width:0}
        .ah-input-wrap textarea:focus{outline:none}
        .ah-input-wrap textarea::placeholder{color:var(--ah-muted)}
        .ah-mode-card:hover{border-color:rgba(139,92,246,0.32)!important;background:rgba(139,92,246,0.07)!important}
        .ah-hist-card:hover{background:rgba(139,92,246,0.06)!important;border-color:rgba(139,92,246,0.22)!important}
        .ah-proj-card:hover{border-color:rgba(139,92,246,0.25)!important}
        .ah-bnav-btn{display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 12px;border:none;cursor:pointer;background:transparent;color:var(--ah-muted);font-size:10px;font-weight:700;font-family:Vazirmatn;transition:color 0.14s;border-radius:12px}
        .ah-bnav-btn.active{color:#a78bfa}
      `}</style>

      <div className="ah-root" dir="rtl" style={{ display:"flex", flexDirection:"column", height:"100%", background:"var(--ah-bg)", fontFamily:"Vazirmatn,sans-serif", position:"relative", overflow:"hidden" }}>

        {/* ── HEADER ── */}
        <header style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 14px", background:"var(--ah-surface)", borderBottom:"1px solid var(--ah-border)", flexShrink:0 }}>
          <button onClick={onBack} style={{ display:"flex",alignItems:"center",gap:4,background:"var(--ah-card)",border:"1px solid var(--ah-border)",borderRadius:11,padding:"6px 10px",cursor:"pointer",color:"var(--ah-muted)",fontSize:11,fontWeight:700,fontFamily:"Vazirmatn",flexShrink:0 }}>
            <Ic n="back" s={13}/><span>آن‌پرداز</span>
          </button>

          {/* Model selector — center, always visible */}
          <button onClick={()=>setShowModels(true)} style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"var(--ah-card)",border:"1px solid var(--ah-border-acc)",borderRadius:14,padding:"8px 12px",cursor:"pointer",transition:"border-color 0.13s" }}>
            <PMark provider={model.provider} size={26}/>
            <span style={{ fontSize:13,fontWeight:800,color:"var(--ah-text)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:130 }}>{model.name}</span>
            <Ic n="chevron" s={13} w={2}/>
          </button>

          {/* New chat (when in chat) */}
          {inChat && (
            <button onClick={newChat} style={{ background:"var(--ah-card)",border:"1px solid var(--ah-border)",borderRadius:11,width:36,height:36,cursor:"pointer",color:"var(--ah-muted)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              <Ic n="plus" s={16}/>
            </button>
          )}
        </header>

        {/* ── Chat mode breadcrumb ── */}
        {inChat && tab==="home" && (
          <div style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 14px",background:"var(--ah-surface)",borderBottom:"1px solid var(--ah-border)",flexShrink:0 }}>
            <button onClick={newChat} style={{ display:"flex",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",color:"var(--ah-muted)",fontSize:11,fontWeight:700,fontFamily:"Vazirmatn",padding:0 }}>
              <Ic n="plus" s={12}/> چت جدید
            </button>
            {activeMode && <>
              <div style={{flex:1,height:1,background:"var(--ah-border)"}}/>
              <span style={{display:"flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.22)",color:"#a78bfa",fontSize:11,fontWeight:700}}>
                <Ic n={activeMode.iconId} s={11}/>{activeMode.label}
              </span>
            </>}
          </div>
        )}

        {/* ── MAIN CONTENT ── */}
        {tab==="home" && (
          inChat
            ? <ChatView messages={messages} input={input} onInputChange={setInput} onSend={send} deepThinking={deepThink} onToggleDeep={()=>setDeepThink(v=>!v)} mode={activeMode}/>
            : <HomeView activeMode={activeMode} onSelectMode={handleSelectMode} onSend={send} input={input} onInputChange={setInput} deepThinking={deepThink} onToggleDeep={()=>setDeepThink(v=>!v)} filterCat={filterCat} onFilterCat={setFilterCat}/>
        )}
        {tab==="history"  && <HistoryView onOpenConv={c=>{setMessages([{id:"demo",role:"ai",text:c.preview,modelId:c.modelId,ts:new Date()}]);setTab("home");}} onNewChat={newChat}/>}
        {tab==="projects" && <ProjectsView onOpenProject={()=>setTab("home")} onNewProject={()=>setShowNewProj(true)}/>}
        {tab==="explore"  && <ExploreView currentModelId={modelId} onSelectModel={id=>{setModelId(id);setTab("home");}}/>}

        {/* ── BOTTOM NAVIGATION ── */}
        <nav style={{ display:"flex",borderTop:"1px solid var(--ah-border)",background:"var(--ah-surface)",flexShrink:0 }}>
          {AH_TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className={`ah-bnav-btn${tab===t.id?" active":""}`} style={{flex:1}}>
              <Ic n={t.icon} s={18} w={tab===t.id?2:1.6}/>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        {/* ── OVERLAYS ── */}
        {showModels   && <ModelSheet current={modelId} onSelect={setModelId} onClose={()=>setShowModels(false)}/>}
        {showNewProj  && <NewProjectSheet modelId={modelId} onClose={()=>setShowNewProj(false)}/>}
      </div>
    </>
  );
}
