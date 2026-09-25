import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import WI from "./WebIcons";
import type { WebPage, AiModel, Chat, AiProject } from "./types";
import { useIsMobile } from "./useResponsive";

interface HooshProps { onNavigate: (p: WebPage) => void; }
type Tab = "home" | "history" | "projects" | "explore" | "account";

type Mode = {
  id: string;
  label: string;
  shortDesc: string;
  icon: string;
  category: "creative" | "text" | "data" | "tool";
  placeholder: string;
};

const MODES: Mode[] = [
  { id:"video", label:"ساخت ویدیو", shortDesc:"متن به ویدیو", icon:"video", category:"creative", placeholder:"ویدیوی مورد نظر را توصیف کنید — سبک، مدت، محتوا و رنگ‌بندی..." },
  { id:"image", label:"ساخت تصویر", shortDesc:"تصویرسازی هوشمند", icon:"image", category:"creative", placeholder:"تصویر دقیق مورد نظر را توصیف کنید — موضوع، سبک و ترکیب‌بندی..." },
  { id:"music", label:"ساخت موسیقی", shortDesc:"خلق صدا و آهنگ", icon:"music", category:"creative", placeholder:"سبک موسیقی، حال‌وهوا و ابزار مورد نظر را بنویسید..." },
  { id:"voice", label:"صداگذاری", shortDesc:"تبدیل متن به صدا", icon:"mic", category:"creative", placeholder:"متنی که باید صداگذاری شود را وارد کنید — لحن و جنس صدا..." },
  { id:"write", label:"نوشتن", shortDesc:"محتوای حرفه‌ای", icon:"write", category:"text", placeholder:"موضوع، سبک و طول را مشخص کنید — مقاله، ایمیل یا گزارش..." },
  { id:"code", label:"کدنویسی", shortDesc:"برنامه‌نویسی", icon:"code", category:"text", placeholder:"کد مورد نیاز را توضیح دهید — زبان، عملکرد، ورودی و خروجی..." },
  { id:"translate", label:"ترجمه", shortDesc:"ترجمه تخصصی", icon:"translate", category:"text", placeholder:"متن مورد ترجمه را وارد کنید و زبان مبدأ و مقصد را مشخص کنید..." },
  { id:"analyze", label:"تحلیل داده", shortDesc:"بینش و تفسیر", icon:"chart", category:"data", placeholder:"داده‌ها، گزارش یا موضوع مورد تحلیل را وارد کنید..." },
  { id:"content", label:"تولید محتوا", shortDesc:"شبکه‌های اجتماعی", icon:"sparkle", category:"text", placeholder:"پلتفرم مقصد، موضوع و لحن محتوا را مشخص کنید..." },
  { id:"assistant", label:"دستیار", shortDesc:"پرسش و پاسخ", icon:"assistant", category:"tool", placeholder:"سؤال خود را بپرسید یا از دستیار کمک بخواهید..." },
];

const CATEGORIES = [
  ["all","همه"], ["creative","خلاقانه"], ["text","نوشتار"], ["data","داده"], ["tool","ابزار"],
] as const;

const providerColors: Record<string,string> = {
  openai:"#10A37F", gemini:"#4285F4", anthropic:"#C4956A", xai:"#e5e7eb", openai_compatible:"#8b5cf6"
};

const iconForProvider = (providerId:string) => providerId==="openai" ? "AI" : providerId==="gemini" ? "G" : providerId==="anthropic" ? "A" : providerId==="xai" ? "𝕏" : "AI";
const fa = (v:unknown) => String(v ?? "").replace(/\\d/g,d=>"۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

function ProviderMark({ model, size=34 }: { model?: AiModel; size?: number }) {
  const c=providerColors[model?.providerId??""]??"#8b5cf6";
  return <div style={{width:size,height:size,borderRadius:Math.round(size*.28),background:c+"18",border:"1px solid "+c+"35",color:c,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:size*.34,flexShrink:0}}>{iconForProvider(model?.providerId??"")}</div>;
}

function TicketComposer({ api, token, onCreated }: { api:string; token:string; onCreated:(ticket:any)=>void }) {
  const [subject,setSubject]=useState(""); const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
  const submit=async()=>{if(!subject.trim()||!message.trim()||busy)return;setBusy(true);try{
    const r=await fetch(api+"/api/v1/hoosh/tickets",{method:"POST",headers:{"content-type":"application/json",...(token?{authorization:"Bearer "+token}:{})},body:JSON.stringify({subject:subject.trim(),message:message.trim()})});
    const d=await r.json(); if(!r.ok) throw new Error(d?.error||"ticket_failed"); onCreated(d.ticket); setSubject("");setMessage("");
  }finally{setBusy(false)}};
  return <div style={{display:"grid",gap:8}}>
    <input className="w-input" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="موضوع تیکت"/>
    <textarea className="w-input" value={message} onChange={e=>setMessage(e.target.value)} placeholder="پیام خود را بنویسید..." rows={4} style={{resize:"vertical"}}/>
    <button className="w-btn w-btn-primary" onClick={()=>void submit()} disabled={busy||!subject.trim()||!message.trim()} style={{background:"#7c3aed"}}>{busy?"در حال ارسال…":"ارسال تیکت"}</button>
  </div>;
}

export default function WebHoosh({ onNavigate }: HooshProps) {
  const mobile=useIsMobile(900);
  const API=((import.meta as any).env?.VITE_PLATFORM_API_URL as string|undefined)?.replace(/\\/$/,"")||"";
  const token=localStorage.getItem("anpardaz:accessToken")||"";
  const [tab,setTab]=useState<Tab>("home");
  const [models,setModels]=useState<AiModel[]>([]);
  const [selected,setSelected]=useState<AiModel|null>(null);
  const [mode,setMode]=useState<Mode|null>(null);
  const [category,setCategory]=useState("all");
  const [input,setInput]=useState("");
  const [messages,setMessages]=useState<any[]>([]);
  const [conversationId,setConversationId]=useState<number|null>(null);
  const [conversations,setConversations]=useState<Chat[]>([]);
  const [projects,setProjects]=useState<AiProject[]>([]);
  const [user,setUser]=useState<any>(null);
  const [usage,setUsage]=useState<any>(null);
  const [tickets,setTickets]=useState<any[]>([]);
  const [showModels,setShowModels]=useState(false);
  const [search,setSearch]=useState("");
  const [provider,setProvider]=useState("all");
  const [thinking,setThinking]=useState(false);
  const [newProject,setNewProject]=useState(false);
  const [projectTitle,setProjectTitle]=useState("");
  const [projectDesc,setProjectDesc]=useState("");
  const [error,setError]=useState("");

  useEffect(()=>{let alive=true;(async()=>{try{
    const headers=token?{authorization:"Bearer "+token}:{};
    const [h,m]=await Promise.all([fetch(API+"/api/v1/hoosh/me",{headers}),fetch(API+"/api/v1/ai/models",{headers})]);
    const hd=await h.json(); const md=await m.json();
    if(!alive)return;
    if(h.ok){setUser(hd.user);setUsage(hd.usage);setTickets(hd.tickets??[]);
      setConversations((hd.conversations??[]).map((c:any)=>({id:String(c.id),title:c.title||"مکالمه",preview:"",modelId:c.model||"",messages:[],createdAt:c.created_at,updatedAt:c.updated_at})));
      setProjects((hd.projects??[]).map((p:any)=>({id:String(p.id),title:p.title,description:p.description||"",modelId:p.model_id||"",chatIds:(p.chat_ids??[]).map(String),accentColor:p.accent_color||"#7c3aed",createdAt:p.created_at,updatedAt:p.updated_at})));
    }
    if(m.ok&&Array.isArray(md.models)){const list=md.models.map((x:any)=>({id:x.id,name:x.name,providerId:x.providerId,descFa:x.descFa||x.desc||"",capabilities:Array.isArray(x.capabilities)?x.capabilities:[],contextWindow:x.contextWindow,badge:x.badge,isAvailable:x.isAvailable!==false}));setModels(list);setSelected(list[0]??null);}
  }catch(e){if(alive)setError(e instanceof Error?e.message:"خطا در اتصال به آن هوش");}})();return()=>{alive=false};},[API,token]);

  const providers=useMemo(()=>Array.from(new Map(models.map(m=>[m.providerId,m])).values()),[models]);
  const filteredModels=useMemo(()=>models.filter(m=>(provider==="all"||m.providerId===provider)&&(!search||m.name.toLowerCase().includes(search.toLowerCase())||m.descFa.includes(search))),[models,provider,search]);
  const filteredModes=useMemo(()=>category==="all"?MODES:MODES.filter(m=>m.category===category),[category]);

  const send=async()=>{const text=input.trim();if(!text||thinking)return;setInput("");setError("");
    const local={id:"u"+Date.now(),role:"user",text,createdAt:new Date().toISOString(),modelId:selected?.id};setMessages(x=>[...x,local]);setThinking(true);
    try{const r=await fetch(API+"/api/v1/hoosh/chat",{method:"POST",headers:{"content-type":"application/json",...(token?{authorization:"Bearer "+token}:{})},body:JSON.stringify({conversationId:conversationId||undefined,input:text,modelId:selected?.id,modeId:mode?.id})});
      const d=await r.json();if(!r.ok)throw new Error(d?.error||"AI_PROVIDER_FAILURE");setConversationId(Number(d.conversationId)||null);
      setMessages(x=>[...x,{id:String(d.message?.id||"a"+Date.now()),role:"assistant",text:d.result?.text||"پاسخی دریافت نشد.",createdAt:d.message?.created_at||new Date().toISOString(),modelId:d.result?.model||selected?.id}]);
      if(d.conversationId&&!conversations.some(c=>c.id===String(d.conversationId)))setConversations(x=>[{id:String(d.conversationId),title:text.slice(0,70),preview:d.result?.text?.slice(0,120)||"",modelId:d.result?.model||selected?.id||"",messages:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},...x]);
    }catch(e){setMessages(x=>[...x,{id:"e"+Date.now(),role:"assistant",text:"مدل انتخاب‌شده از طریق سرور آن پرداز در دسترس نیست.",createdAt:new Date().toISOString()}]);setError(e instanceof Error?e.message:"AI_PROVIDER_FAILURE");}
    finally{setThinking(false);}
  };

  const newChat=()=>{setMessages([]);setConversationId(null);setInput("");setMode(null);setTab("home");setError("");};
  const openConversation=async(c:Chat)=>{try{const r=await fetch(API+"/api/v1/hoosh/conversations/"+c.id,{headers:token?{authorization:"Bearer "+token}:{}});const d=await r.json();if(!r.ok)throw new Error(d?.error);setConversationId(Number(c.id));setMessages((d.messages??[]).map((m:any)=>({id:String(m.id),role:m.role==="assistant"?"assistant":"user",text:m.content,createdAt:m.created_at,modelId:m.metadata?.model||c.modelId})));setSelected(models.find(m=>m.id===d.conversation?.model)||selected);setTab("home");}catch(e){setError(e instanceof Error?e.message:"خطا در بارگذاری مکالمه");}};

  const createProject=async()=>{if(!projectTitle.trim())return;const r=await fetch(API+"/api/v1/hoosh/projects",{method:"POST",headers:{"content-type":"application/json",...(token?{authorization:"Bearer "+token}:{})},body:JSON.stringify({title:projectTitle.trim(),description:projectDesc.trim(),modelId:selected?.id})});const d=await r.json();if(r.ok&&d.project){const p=d.project;setProjects(x=>[{id:String(p.id),title:p.title,description:p.description||"",modelId:p.model_id||"",chatIds:[],accentColor:p.accent_color||"#7c3aed",createdAt:p.created_at,updatedAt:p.updated_at},...x]);setProjectTitle("");setProjectDesc("");setNewProject(false);}};

  const navItems:[Tab,string,string][]=[["home","chat","چت"],["history","clock","تاریخچه"],["projects","folder","پروژه‌ها"],["explore","compass","کشف"],["account","user","حساب من"]];

  const shellStyle:React.CSSProperties={height:"calc(100vh - var(--w-header))",minHeight:560,display:"flex",direction:"rtl",background:"var(--w-bg)",color:"var(--w-text)",overflow:"hidden"};
  const panelStyle:React.CSSProperties={background:"var(--w-surface)",border:"1px solid var(--w-border)",borderRadius:20};
  const modeCard=(m:Mode)=><button key={m.id} onClick={()=>{setMode(mode?.id===m.id?null:m);setInput("");}} style={{textAlign:"right",padding:16,borderRadius:16,border:"1px solid "+(mode?.id===m.id?"rgba(139,92,246,.45)":"var(--w-border)"),background:mode?.id===m.id?"rgba(139,92,246,.09)":"var(--w-card)",color:"var(--w-text)",cursor:"pointer",fontFamily:"Vazirmatn",display:"flex",alignItems:"center",gap:12}}><span style={{width:38,height:38,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(139,92,246,.1)",color:"#a78bfa"}}><WI n={m.icon} s={19}/></span><span><b style={{display:"block",fontSize:13}}>{m.label}</b><small style={{color:"var(--w-muted)"}}>{m.shortDesc}</small></span></button>;

  return <div className="w-fade" style={shellStyle}>
    {!mobile&&<aside style={{width:270,flexShrink:0,borderLeft:"1px solid var(--w-border)",background:"var(--w-surface)",display:"flex",flexDirection:"column",padding:14,gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:6}}>
        <div style={{width:42,height:42,borderRadius:14,background:"rgba(139,92,246,.12)",border:"1px solid rgba(139,92,246,.25)",display:"flex",alignItems:"center",justifyContent:"center",color:"#a78bfa"}}><WI n="hoosh" s={22}/></div>
        <div><div style={{fontWeight:900,fontSize:16}}>آن هوش</div><div style={{fontSize:10,color:"var(--w-muted)"}}>پلتفرم هوش مصنوعی آن پرداز</div></div>
      </div>
      <button onClick={newChat} className="w-btn w-btn-primary" style={{background:"#7c3aed",borderColor:"#7c3aed"}}><WI n="plus" s={15}/> مکالمه جدید</button>
      <div style={{display:"grid",gap:4}}>
        {navItems.map(([id,ic,label])=><button key={id} onClick={()=>setTab(id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",border:0,borderRadius:11,background:tab===id?"rgba(139,92,246,.12)":"transparent",color:tab===id?"#a78bfa":"var(--w-muted)",fontFamily:"Vazirmatn",fontWeight:tab===id?800:600,cursor:"pointer",textAlign:"right"}}><WI n={ic} s={17}/>{label}</button>)}
      </div>
      <div style={{height:1,background:"var(--w-border)",margin:"2px 0"}}/>
      <div style={{fontSize:11,fontWeight:800,color:"var(--w-muted)",padding:"0 5px"}}>مدل فعال</div>
      {selected&&<button onClick={()=>setShowModels(true)} style={{display:"flex",alignItems:"center",gap:9,padding:10,borderRadius:13,border:"1px solid var(--w-border)",background:"var(--w-card)",cursor:"pointer",color:"var(--w-text)",fontFamily:"Vazirmatn",textAlign:"right"}}><ProviderMark model={selected} size={32}/><span style={{overflow:"hidden"}}><b style={{fontSize:11,display:"block",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{selected.name}</b><small style={{fontSize:9,color:"var(--w-muted)"}}>{selected.providerId}</small></span></button>}
      <div style={{flex:1,overflow:"auto"}}>{tab==="history"&&conversations.slice(0,30).map(c=><button key={c.id} onClick={()=>void openConversation(c)} style={{width:"100%",textAlign:"right",padding:9,border:0,borderRadius:9,background:"transparent",color:"var(--w-text)",fontFamily:"Vazirmatn",cursor:"pointer"}}><div style={{fontSize:11,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.title}</div><div style={{fontSize:9,color:"var(--w-muted)",marginTop:3}}>{c.updatedAt?new Date(c.updatedAt).toLocaleDateString("fa-IR"):""}</div></button>)}</div>
      <button onClick={()=>onNavigate("home")} style={{border:0,background:"transparent",color:"var(--w-muted)",fontFamily:"Vazirmatn",cursor:"pointer",padding:8,textAlign:"right"}}>بازگشت به آن پرداز ←</button>
    </aside>}

    <main style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",position:"relative"}}>
      <header style={{height:64,flexShrink:0,display:"flex",alignItems:"center",gap:10,padding:"0 18px",borderBottom:"1px solid var(--w-border)",background:"var(--w-surface)"}}>
        <button onClick={()=>onNavigate("home")} className="w-btn w-btn-ghost" style={{padding:"7px 10px"}}><WI n="arrow-right" s={14}/> آن‌پرداز</button>
        <div style={{flex:1,textAlign:"center",fontWeight:900,fontSize:15}}>آن هوش</div>
        <button onClick={()=>setShowModels(true)} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 10px",borderRadius:12,border:"1px solid var(--w-border)",background:"var(--w-card)",color:"var(--w-text)",fontFamily:"Vazirmatn",cursor:"pointer",maxWidth:220}}>{selected&&<ProviderMark model={selected} size={26}/>}<span style={{fontSize:11,fontWeight:800,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{selected?.name||"انتخاب مدل"}</span><WI n="chevron-down" s={13}/></button>
      </header>

      <div style={{flex:1,minHeight:0,overflow:"hidden"}}>
        {tab==="home"&&<div style={{height:"100%",display:"flex",flexDirection:"column",maxWidth:1100,margin:"0 auto",width:"100%"}}>
          {messages.length===0?<div style={{flex:1,overflow:"auto",padding:mobile?"24px 14px 100px":"42px 28px 120px"}}>
            <div style={{maxWidth:820,margin:"0 auto",textAlign:"center"}}>
              <div style={{width:68,height:68,borderRadius:22,margin:"0 auto 14px",background:"rgba(139,92,246,.1)",border:"1px solid rgba(139,92,246,.2)",display:"flex",alignItems:"center",justifyContent:"center",color:"#a78bfa"}}><WI n="hoosh" s={34}/></div>
              <h1 style={{margin:"0 0 7px",fontSize:mobile?23:30,fontWeight:950}}>چطور می‌تونم کمکت کنم؟</h1>
              <p style={{margin:"0 auto 28px",fontSize:12,color:"var(--w-muted)"}}>آن هوش، مرکز مکالمه، خلق محتوا، کدنویسی، تحلیل و کار با مدل‌های مختلف هوش مصنوعی.</p>
              <div style={{display:"flex",justifyContent:"center",gap:6,flexWrap:"wrap",marginBottom:22}}>{CATEGORIES.map(([id,l])=><button key={id} onClick={()=>setCategory(id)} style={{padding:"6px 12px",borderRadius:20,border:"1px solid "+(category===id?"rgba(139,92,246,.4)":"var(--w-border)"),background:category===id?"rgba(139,92,246,.1)":"var(--w-card)",color:category===id?"#a78bfa":"var(--w-muted)",fontFamily:"Vazirmatn",fontSize:10,cursor:"pointer"}}>{l}</button>)}</div>
              <div style={{display:"grid",gridTemplateColumns:mobile?"1fr 1fr":"repeat(3,1fr)",gap:9}}>{filteredModes.map(modeCard)}</div>
            </div>
          </div>:<div style={{flex:1,overflow:"auto",padding:mobile?"18px 12px 110px":"26px 32px 120px"}}>{messages.map(m=><div key={m.id} style={{maxWidth:820,margin:"0 auto 18px",display:"flex",gap:10,flexDirection:m.role==="user"?"row":"row-reverse",justifyContent:"flex-start"}}><div style={{maxWidth:"82%",padding:"12px 14px",borderRadius:16,background:m.role==="user"?"rgba(139,92,246,.1)":"var(--w-card)",border:"1px solid "+(m.role==="user"?"rgba(139,92,246,.18)":"var(--w-border)"),lineHeight:1.9,fontSize:13,whiteSpace:"pre-wrap"}}>{m.text}</div></div>)}{thinking&&<div style={{maxWidth:820,margin:"0 auto",fontSize:11,color:"var(--w-muted)"}}>در حال پردازش…</div>}</div>}
          <div style={{padding:mobile?"10px 10px 12px":"12px 22px 18px",borderTop:"1px solid var(--w-border)",background:"var(--w-surface)"}}>
            <div style={{maxWidth:820,margin:"0 auto"}}>
              {mode&&<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:7,fontSize:10,color:"#a78bfa"}}><WI n={mode.icon} s={13}/>{mode.label}<button onClick={()=>setMode(null)} style={{marginRight:"auto",border:0,background:"transparent",color:"var(--w-muted)",cursor:"pointer"}}>×</button></div>}
              <div style={{display:"flex",alignItems:"flex-end",gap:7,padding:8,borderRadius:17,border:"1px solid var(--w-border)",background:"var(--w-card)"}}>
                <button className="w-btn w-btn-ghost" style={{padding:8}} title="پیوست"><WI n="paperclip" s={17}/></button>
                <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send();}}} placeholder={mode?.placeholder||"پیام خود را بنویسید..."} rows={1} className="w-input" style={{flex:1,border:0,background:"transparent",resize:"none",minHeight:38,padding:"9px 4px",fontSize:13}}/>
                <button onClick={()=>void send()} disabled={!input.trim()||thinking||!selected} style={{width:38,height:38,borderRadius:12,border:0,background:input.trim()&&!thinking?"#7c3aed":"var(--w-card2)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:input.trim()&&!thinking?"pointer":"default"}}><WI n="send" s={17}/></button>
              </div>
              {error&&<div style={{fontSize:10,color:"#dc2626",marginTop:5}}>{error}</div>}
            </div>
          </div>
        </div>}

        {tab==="history"&&<section style={{height:"100%",overflow:"auto",padding:mobile?"18px 12px":"28px",maxWidth:1000,margin:"0 auto"}}>
          <h2 style={{margin:"0 0 6px"}}>تاریخچه مکالمات</h2><p style={{fontSize:11,color:"var(--w-muted)",marginTop:0}}>تمام مکالمات از سرور آن هوش خوانده می‌شوند.</p>
          <div style={{display:"grid",gap:8,marginTop:18}}>{conversations.length?conversations.map(c=><button key={c.id} onClick={()=>void openConversation(c)} style={{...panelStyle,textAlign:"right",padding:14,border:0,cursor:"pointer",fontFamily:"Vazirmatn"}}><b>{c.title}</b><div style={{fontSize:10,color:"var(--w-muted)",marginTop:5}}>{c.updatedAt?new Date(c.updatedAt).toLocaleString("fa-IR"):""} · {c.modelId||"مدل نامشخص"}</div></button>):<div style={{color:"var(--w-muted)",fontSize:12}}>هنوز مکالمه‌ای ثبت نشده است.</div>}</div>
        </section>}

        {tab==="projects"&&<section style={{height:"100%",overflow:"auto",padding:mobile?"18px 12px":"28px",maxWidth:1000,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div><h2 style={{margin:"0 0 6px"}}>پروژه‌های من</h2><p style={{fontSize:11,color:"var(--w-muted)",marginTop:0}}>پروژه‌ها و مکالمات مرتبط با آن‌ها روی سرور ذخیره می‌شوند.</p></div><button className="w-btn w-btn-primary" onClick={()=>setNewProject(true)} style={{background:"#7c3aed"}}><WI n="plus" s={14}/> پروژه جدید</button></div>
          <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(2,1fr)",gap:10,marginTop:18}}>{projects.map(p=><div key={p.id} style={{...panelStyle,padding:16}}><div style={{fontWeight:900}}>{p.title}</div><div style={{fontSize:11,color:"var(--w-muted)",marginTop:6,lineHeight:1.7}}>{p.description||"بدون توضیح"}</div><div style={{fontSize:10,color:"var(--w-muted)",marginTop:10}}>{fa(p.chatIds.length)} مکالمه</div></div>)}</div>
          {newProject&&<div style={{position:"fixed",inset:0,zIndex:50,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:18}}><div style={{...panelStyle,width:"min(480px,100%)",padding:20}}><h3 style={{marginTop:0}}>پروژه جدید</h3><input className="w-input" value={projectTitle} onChange={e=>setProjectTitle(e.target.value)} placeholder="نام پروژه"/><textarea className="w-input" value={projectDesc} onChange={e=>setProjectDesc(e.target.value)} placeholder="توضیح پروژه" rows={4} style={{marginTop:8,resize:"vertical"}}/><div style={{display:"flex",gap:8,marginTop:10}}><button className="w-btn w-btn-primary" onClick={()=>void createProject()} style={{background:"#7c3aed"}}>ایجاد</button><button className="w-btn w-btn-ghost" onClick={()=>setNewProject(false)}>انصراف</button></div></div></div>}
        </section>}

        {tab==="explore"&&<section style={{height:"100%",overflow:"auto",padding:mobile?"18px 12px":"28px",maxWidth:1050,margin:"0 auto"}}>
          <h2 style={{margin:"0 0 6px"}}>کشف مدل‌ها</h2><p style={{fontSize:11,color:"var(--w-muted)",marginTop:0}}>{fa(models.length)} مدل قابل استفاده بر اساس تنظیمات واقعی سرور.</p>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",margin:"15px 0"}}><button onClick={()=>setProvider("all")} className="w-btn w-btn-ghost">همه</button>{providers.map(m=><button key={m.providerId} onClick={()=>setProvider(m.providerId)} className="w-btn w-btn-ghost">{m.providerId}</button>)}</div>
          <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(2,1fr)",gap:10}}>{filteredModels.map(m=><button key={m.id} onClick={()=>{setSelected(m);setShowModels(false);setTab("home")}} style={{...panelStyle,padding:15,textAlign:"right",cursor:"pointer",color:"var(--w-text)",fontFamily:"Vazirmatn"}}><div style={{display:"flex",alignItems:"center",gap:10}}><ProviderMark model={m}/><div style={{minWidth:0}}><b style={{display:"block"}}>{m.name}</b><span style={{fontSize:10,color:"var(--w-muted)"}}>{m.providerId} · {m.contextWindow||"—"}</span></div></div><div style={{fontSize:11,color:"var(--w-muted)",lineHeight:1.7,marginTop:9}}>{m.descFa}</div><div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:8}}>{m.capabilities.slice(0,5).map(c=><span key={c} style={{fontSize:9,padding:"2px 6px",borderRadius:9,background:"rgba(139,92,246,.08)",color:"#a78bfa"}}>{c}</span>)}</div></button>)}</div>
        </section>}

        {tab==="account"&&<section style={{height:"100%",overflow:"auto",padding:mobile?"18px 12px":"28px",maxWidth:850,margin:"0 auto"}}>
          <h2 style={{margin:"0 0 5px"}}>حساب کاربری آن هوش</h2><p style={{fontSize:11,color:"var(--w-muted)",marginTop:0}}>تیکت فقط یک بخش از فضای کاربری آن هوش است.</p>
          <div style={{...panelStyle,padding:16,marginTop:14}}><b style={{fontSize:15}}>{user?.display_name||user?.email||"حساب متصل به آن پرداز"}</b><div style={{fontSize:10,color:"var(--w-muted)",marginTop:5}}>{user?.email||"حساب احراز هویت‌شده آن پرداز"}</div></div>
          <div style={{display:"grid",gridTemplateColumns:mobile?"repeat(3,1fr)":"repeat(3,160px)",gap:8,marginTop:10}}>{[["درخواست",usage?.requests??0],["ورودی",usage?.input_tokens??0],["خروجی",usage?.output_tokens??0]].map(([l,v])=><div key={String(l)} style={{...panelStyle,padding:12,textAlign:"center"}}><div style={{fontSize:10,color:"var(--w-muted)"}}>{l}</div><b>{fa(v)}</b></div>)}</div>
          <div style={{...panelStyle,padding:16,marginTop:10}}><h3 style={{marginTop:0}}>پشتیبانی و تیکت</h3><TicketComposer api={API} token={token} onCreated={t=>setTickets(x=>[t,...x])}/></div>
          <div style={{marginTop:18,fontWeight:900}}>تیکت‌های من</div><div style={{display:"grid",gap:8,marginTop:8}}>{tickets.map(t=><div key={t.id} style={{...panelStyle,padding:12}}><b style={{fontSize:12}}>{t.subject}</b><div style={{fontSize:10,color:"var(--w-muted)",marginTop:5}}>{t.status} · {t.updated_at?new Date(t.updated_at).toLocaleString("fa-IR"):""}</div></div>)}</div>
        </section>}
      </div>

      {mobile&&<nav style={{display:"flex",borderTop:"1px solid var(--w-border)",background:"var(--w-surface)",flexShrink:0}}>{navItems.map(([id,ic,label])=><button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"7px 3px",border:0,background:"transparent",color:tab===id?"#a78bfa":"var(--w-muted)",fontFamily:"Vazirmatn",fontSize:9,fontWeight:800,cursor:"pointer"}}><WI n={ic} s={18}/><div>{label}</div></button>)}</nav>}

      {showModels&&<div onClick={e=>{if(e.target===e.currentTarget)setShowModels(false)}} style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,.72)",backdropFilter:"blur(8px)",display:"flex",alignItems:mobile?"flex-end":"center",justifyContent:"center",padding:mobile?0:20}}>
        <div style={{width:mobile?"100%":"min(760px,100%)",maxHeight:"88vh",display:"flex",flexDirection:"column",background:"var(--w-surface)",border:"1px solid var(--w-border)",borderRadius:mobile?"22px 22px 0 0":20,overflow:"hidden"}}>
          <div style={{padding:16,borderBottom:"1px solid var(--w-border)",display:"flex",alignItems:"center",gap:10}}><div style={{flex:1}}><b>مدل هوش مصنوعی</b><div style={{fontSize:10,color:"var(--w-muted)",marginTop:3}}>{fa(models.length)} مدل از {fa(providers.length)} ارائه‌دهنده</div></div><button className="w-btn w-btn-ghost" onClick={()=>setShowModels(false)}>×</button></div>
          <div style={{padding:10,display:"flex",gap:6}}><input className="w-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجو در مدل‌ها..."/><select className="w-input" value={provider} onChange={e=>setProvider(e.target.value)} style={{maxWidth:170}}><option value="all">همه</option>{providers.map(p=><option key={p.providerId} value={p.providerId}>{p.providerId}</option>)}</select></div>
          <div style={{overflow:"auto",padding:"0 10px 14px",display:"grid",gap:7}}>{filteredModels.map(m=><button key={m.id} onClick={()=>{setSelected(m);setShowModels(false)}} style={{display:"flex",alignItems:"center",gap:10,padding:11,borderRadius:13,border:"1px solid "+(selected?.id===m.id?"rgba(139,92,246,.4)":"var(--w-border)"),background:selected?.id===m.id?"rgba(139,92,246,.08)":"var(--w-card)",color:"var(--w-text)",fontFamily:"Vazirmatn",textAlign:"right",cursor:"pointer"}}><ProviderMark model={m} size={34}/><span style={{flex:1,minWidth:0}}><b style={{display:"block",fontSize:12}}>{m.name}</b><span style={{display:"block",fontSize:9,color:"var(--w-muted)",marginTop:3}}>{m.descFa}</span></span><span style={{fontSize:9,color:"#a78bfa"}}>{m.providerId}</span></button>)}</div>
        </div>
      </div>}
    </main>
  </div>;
}
