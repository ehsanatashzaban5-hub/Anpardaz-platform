// ─────────────────────────────────────────────────
// An Pardaz Web Portal — An Hoosh (AI Creation Platform)
// Full platform: 22 models, 10 modes, projects, explore
// ─────────────────────────────────────────────────
import { useState, useRef, useEffect, useMemo } from "react";
import WI from "./WebIcons";
import { AI_MODELS, AI_PROVIDERS } from "./mockData";
import type { WebPage, AiModel, Chat, AiProject } from "./types";
import { useIsMobile } from "./useResponsive";

interface HooshProps { onNavigate: (p: WebPage) => void; }

type HView = "chat" | "explore" | "projects" | "settings";

type CreationMode = {
  id: string; icon: string; label: string; labelFa: string; color: string;
  promptFa: string;
};

const MODES: CreationMode[] = [
  { id:"chat",        icon:"comment",    label:"Chat",        labelFa:"مکالمه",         color:"#0891b2", promptFa:"یک مکالمه هوشمند..." },
  { id:"code",        icon:"code",       label:"Code",        labelFa:"کدنویسی",         color:"#7c3aed", promptFa:"یک تابع پایتون برای..." },
  { id:"write",       icon:"write",      label:"Write",       labelFa:"نوشتاری",         color:"#059669", promptFa:"یک مقاله درباره..." },
  { id:"image-desc",  icon:"image",      label:"Vision",      labelFa:"تحلیل تصویر",     color:"#d97706", promptFa:"این تصویر را توضیح بده..." },
  { id:"translate",   icon:"translate",  label:"Translate",   labelFa:"ترجمه",           color:"#e8354e", promptFa:"این متن را به فارسی ترجمه کن..." },
  { id:"summarize",   icon:"document",   label:"Summarize",   labelFa:"خلاصه‌سازی",      color:"#0891b2", promptFa:"این متن را خلاصه کن..." },
  { id:"research",    icon:"search",     label:"Research",    labelFa:"تحقیق",           color:"#7c3aed", promptFa:"درباره این موضوع تحقیق کن..." },
  { id:"math",        icon:"cpu",        label:"Math",        labelFa:"ریاضیات",         color:"#059669", promptFa:"این مسئله ریاضی را حل کن..." },
  { id:"audio",       icon:"mic",        label:"Audio",       labelFa:"صدا",             color:"#d97706", promptFa:"این صدا را متن کن..." },
  { id:"create",      icon:"sparkle",    label:"Create",      labelFa:"خلق محتوا",       color:"#e8354e", promptFa:"یک داستان کوتاه بنویس..." },
];

const THINKING_MSGS = [
  "در حال پردازش درخواست شما...",
  "در حال تحلیل اطلاعات...",
  "در حال تولید پاسخ...",
  "در حال بهینه‌سازی نتیجه...",
];

export default function WebHoosh({ onNavigate }: HooshProps) {
  const [view, setView]           = useState<HView>("chat");
  const [models, setModels]       = useState<AiModel[]>(AI_MODELS);
  const [selectedModel, setMod]   = useState<AiModel>(models[0]);
  const [mode, setMode]           = useState<CreationMode>(MODES[0]);
  const [chats, setChats]         = useState<Chat[]>([]);\n  const [projects, setProjects]   = useState<AiProject[]>([]);
  const [activeChat, setActiveChat] = useState<Chat>({id:`chat${Date.now()}`,title:"مکالمه جدید",preview:"",modelId:models[0]?.id||"gpt-5.6-luna",messages:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
  const [input, setInput]         = useState("");
  const [thinking, setThinking]   = useState(false);
  const [sidebarOpen, setSidebar] = useState(true);
  const [modelPanelOpen, setModelPanel] = useState(true);
  const [searchChat, setSearchChat] = useState("");
  const [providerFilter, setProvFilter] = useState<string>("all");
  const textRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile(900);
  const API=((import.meta as any).env?.VITE_PLATFORM_API_URL as string|undefined)?.replace(/\\/$/,"")||"";
  const accessToken=localStorage.getItem("anpardaz:accessToken")||"";
  useEffect(()=>{(async()=>{try{const h=await fetch(API+"/api/v1/hoosh/me",{headers:accessToken?{authorization:"Bearer "+accessToken}:{}});const hd=await h.json();if(h.ok){setChats((hd.conversations??[]).map((c:any)=>({id:String(c.id),title:c.title||"مکالمه",preview:"",modelId:c.model||"gpt-5.6-luna",messages:[],createdAt:c.created_at,updatedAt:c.updated_at})));setProjects((hd.projects??[]).map((p:any)=>({id:String(p.id),title:p.title,description:p.description||"",modelId:p.model_id||"",chatIds:(p.chat_ids??[]).map(String),accentColor:p.accent_color||"#7c3aed",createdAt:p.created_at,updatedAt:p.updated_at})));}const r=await fetch(API+"/api/v1/ai/models",{headers:accessToken?{authorization:"Bearer "+accessToken}:{}});const d=await r.json();if(r.ok&&Array.isArray(d.models)&&d.models.length){setModels(d.models);setMod(d.models[0]);}}catch{}})();},[]);


  const filteredChats = useMemo(() =>
    chats.filter(c => searchChat === "" || c.title.includes(searchChat) || c.messages.some(m => m.content.includes(searchChat)))
  , [chats, searchChat]);

  const filteredModels = useMemo(() =>
    models.filter(m => providerFilter === "all" || m.providerId === providerFilter)
  , [providerFilter]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [activeChat.messages, thinking]);

  const sendMessage = async () => {
    const text=input.trim();
    if(!text || thinking || !selectedModel) return;
    setInput("");
    const now=new Date().toISOString();
    const userMsg={id:`u${Date.now()}`,role:"user" as const,content:text,createdAt:now};
    const updatedChat={...activeChat,messages:[...activeChat.messages,userMsg],modelId:selectedModel.id};
    setActiveChat(updatedChat);setChats(prev=>prev.some(c=>c.id===updatedChat.id)?prev.map(c=>c.id===updatedChat.id?updatedChat:c):[updatedChat,...prev]);setThinking(true);
    try{
      const r=await fetch(API+"/api/v1/hoosh/chat",{method:"POST",headers:{"content-type":"application/json",...(accessToken?{authorization:"Bearer "+accessToken}:{})},body:JSON.stringify({conversationId:/^\\d+$/.test(activeChat.id)?Number(activeChat.id):undefined,input:text,modelId:selectedModel.id,modeId:mode.id})});
      const d=await r.json();if(!r.ok)throw new Error(d?.error||"AI_PROVIDER_FAILURE");
      const aiMsg={id:String(d?.message?.id||("a"+Date.now())),role:"assistant" as const,content:d?.result?.text||"پاسخی دریافت نشد.",createdAt:d?.message?.created_at||new Date().toISOString(),modelId:d?.result?.model||selectedModel.id};
      const finalChat={...updatedChat,id:String(d.conversationId||updatedChat.id),messages:[...updatedChat.messages,aiMsg],preview:aiMsg.content.slice(0,120),updatedAt:new Date().toISOString()};
      setActiveChat(finalChat);setChats(prev=>prev.map(c=>c.id===finalChat.id?finalChat:c));
    }catch{
      const aiMsg={id:`e${Date.now()}`,role:"assistant" as const,content:"مدل انتخاب‌شده در حال حاضر از طریق سرور آن پرداز در دسترس نیست.",createdAt:new Date().toISOString(),modelId:selectedModel.id};
      const finalChat={...updatedChat,messages:[...updatedChat.messages,aiMsg],preview:aiMsg.content.slice(0,120),updatedAt:new Date().toISOString()};
      setActiveChat(finalChat);setChats(prev=>prev.map(c=>c.id===finalChat.id?finalChat:c));
    }finally{setThinking(false);}
  };

  const newChat = () => {
    const nc: Chat = {
      id:`chat${Date.now()}`, title:"مکالمه جدید", preview:"", modelId:selectedModel.id,
      messages:[], createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(),
    };
    setChats(prev => [nc, ...prev]);
    setActiveChat(nc);
    setView("chat");
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="w-fade" dir="rtl" style={{ height:"calc(100vh - var(--w-header))", display:"flex", overflow:"hidden", position:"relative" }}>
      {/* ── Left Sidebar ── */}
      {(!isMobile && sidebarOpen) && (
        <aside style={{ width:240, flexShrink:0, background:"var(--w-surface)", borderLeft:"1px solid var(--w-border)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"14px 12px 10px", borderBottom:"1px solid var(--w-border)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <div style={{ width:30, height:30, borderRadius:9, background:"rgba(124,58,237,0.12)", border:"1px solid rgba(124,58,237,0.22)", display:"flex", alignItems:"center", justifyContent:"center", color:"#7c3aed" }}>
                <WI n="hoosh" s={15}/>
              </div>
              <span style={{ fontSize:15, fontWeight:900 }}>آن هوش</span>
              <button onClick={()=>onNavigate("home")} style={{ marginRight:"auto", background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", display:"flex" }}>
                <WI n="arrow-right" s={14}/>
              </button>
            </div>
            <button onClick={newChat} className="w-btn w-btn-primary" style={{ width:"100%", padding:"9px", fontSize:13, gap:6, background:"#7c3aed" }}>
              <WI n="plus" s={14}/> مکالمه جدید
            </button>
          </div>

          {/* View tabs */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:2, padding:"8px" }}>
            {([["chat","comment","چت"],["explore","compass","کاوش"],["projects","folder","پروژه"],["settings","settings","تنظیم"]] as [HView,string,string][]).map(([v,ic,lb]) => (
              <button key={v} onClick={()=>setView(v)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"7px 4px", borderRadius:8, border:"none", background:view===v?"rgba(124,58,237,0.12)":"transparent", color:view===v?"#7c3aed":"var(--w-muted)", cursor:"pointer", fontSize:10, fontWeight:view===v?700:400, fontFamily:"Vazirmatn" }}>
                <WI n={ic} s={16}/>{lb}
              </button>
            ))}
          </div>

          {view === "chat" && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ padding:"0 8px 6px" }}>
                <input value={searchChat} onChange={e=>setSearchChat(e.target.value)} placeholder="جستجوی مکالمه..." className="w-input" style={{ fontSize:11, padding:"6px 10px" }}/>
              </div>
              <div style={{ flex:1, overflowY:"auto", padding:"0 4px" }}>
                {filteredChats.length === 0 && (
                  <div style={{ textAlign:"center", padding:"20px", color:"var(--w-muted)", fontSize:12 }}>مکالمه‌ای یافت نشد</div>
                )}
                {filteredChats.map(c => (
                  <button key={c.id} onClick={async()=>{if(/^\\d+$/.test(c.id)){try{const rr=await fetch(API+"/api/v1/hoosh/conversations/"+c.id,{headers:accessToken?{authorization:"Bearer "+accessToken}:{}});const dd=await rr.json();if(rr.ok&&dd.conversation){setActiveChat({id:String(dd.conversation.id),title:dd.conversation.title,preview:dd.messages?.at(-1)?.content?.slice(0,120)||"",modelId:dd.conversation.model||models[0]?.id||"gpt-5.6-luna",messages:(dd.messages??[]).map((m:any)=>({id:String(m.id),role:m.role==="assistant"?"assistant":"user",content:m.content,createdAt:m.created_at,modelId:dd.conversation.model})),createdAt:dd.conversation.created_at,updatedAt:dd.conversation.updated_at});setView("chat");}}catch{}}else setView("chat");}} style={{ display:"block", width:"100%", padding:"9px 10px", borderRadius:8, border:"none", background:activeChat.id===c.id?"rgba(124,58,237,0.1)":"transparent", cursor:"pointer", textAlign:"right", marginBottom:2, fontFamily:"Vazirmatn" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:activeChat.id===c.id?"#7c3aed":"var(--w-text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.title}</div>
                    <div style={{ fontSize:10, color:"var(--w-muted)", marginTop:2 }}>{c.messages.length} پیام · {models.find(m=>m.id===c.modelId)?.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {view === "explore" && (
            <div style={{ flex:1, overflowY:"auto", padding:"4px 8px" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", padding:"6px 4px" }}>ارائه‌دهندگان</div>
              <button onClick={()=>setProvFilter("all")} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"8px", borderRadius:8, border:`1.5px solid ${providerFilter==="all"?"rgba(124,58,237,0.4)":"transparent"}`, background:providerFilter==="all"?"rgba(124,58,237,0.08)":"transparent", cursor:"pointer", fontFamily:"Vazirmatn", marginBottom:4 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"var(--w-text)" }}>همه ({models.length} مدل)</div>
              </button>
              {AI_PROVIDERS.map(prov => (
                <button key={prov.id} onClick={()=>setProvFilter(prov.id)} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"8px", borderRadius:8, border:`1.5px solid ${providerFilter===prov.id?"rgba(124,58,237,0.4)":"transparent"}`, background:providerFilter===prov.id?"rgba(124,58,237,0.08)":"transparent", cursor:"pointer", marginBottom:4, fontFamily:"Vazirmatn" }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:prov.color+"20", border:`1px solid ${prov.color}30`, display:"flex", alignItems:"center", justifyContent:"center", color:prov.color, fontSize:11, fontWeight:900, flexShrink:0 }}>{prov.name.slice(0,2)}</div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"var(--w-text)" }}>{prov.name}</div>
                    <div style={{ fontSize:10, color:"var(--w-muted)" }}>{models.filter(m=>m.providerId===prov.id).length} مدل</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {view === "projects" && (
            <div style={{ flex:1, overflowY:"auto", padding:"4px 8px" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", padding:"6px 4px" }}>پروژه‌های من</div>
              {DEMO_PROJECTS.map(proj => (
                <div key={proj.id} style={{ padding:"10px", borderRadius:10, border:"1px solid var(--w-border)", marginBottom:8, background:"var(--w-card)", cursor:"pointer" }}>
                  <div style={{ fontSize:12, fontWeight:700, marginBottom:2 }}>{proj.title}</div>
                  <div style={{ fontSize:10, color:"var(--w-muted)" }}>{proj.chatIds.length} چت</div>
                </div>
              ))}
            </div>
          )}
          {view === "settings" && (
            <div style={{ flex:1, overflowY:"auto", padding:"4px 12px" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", padding:"8px 0 6px" }}>تنظیمات مدل</div>
              {[["دما (Temperature)","0.7"],["حداکثر توکن","4096"],["زبان پاسخ","فارسی"]].map(([l,v])=>(
                <div key={l as string} style={{ marginBottom:10 }}>
                  <label style={{ fontSize:11, color:"var(--w-muted)", display:"block", marginBottom:4 }}>{l}</label>
                  <input defaultValue={v as string} className="w-input" style={{ fontSize:12, padding:"6px 10px" }}/>
                </div>
              ))}
            </div>
          )}
        </aside>
      )}

      {/* ── Main Area ── */}
      <main style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:"var(--w-bg)" }}>
        {/* Header */}
        <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--w-border)", display:"flex", alignItems:"center", gap:10, background:"var(--w-surface)", flexShrink:0 }}>
          <button onClick={()=>setSidebar(!sidebarOpen)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", display:"flex", padding:4, borderRadius:6 }}>
            <WI n="menu" s={18}/>
          </button>
          <div style={{ display:"flex", gap:4, overflowX:"auto", scrollbarWidth:"none" }}>
            {MODES.map(m => (
              <button key={m.id} onClick={()=>setMode(m)} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:8, border:`1px solid ${mode.id===m.id?m.color+"60":"var(--w-border)"}`, background:mode.id===m.id?m.color+"12":"transparent", color:mode.id===m.id?m.color:"var(--w-muted)", fontSize:12, fontWeight:mode.id===m.id?700:400, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"Vazirmatn", transition:"all 0.12s", flexShrink:0 }}>
                <WI n={m.icon} s={13}/>
                {m.labelFa}
              </button>
            ))}
          </div>
          <button onClick={()=>setModelPanel(!modelPanelOpen)} style={{ marginRight:"auto", display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:8, border:"1px solid var(--w-border)", background:"var(--w-card)", color:"var(--w-text)", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"Vazirmatn", flexShrink:0 }}>
            <div style={{ width:16, height:16, borderRadius:4, background:(AI_PROVIDERS.find(p=>p.id===selectedModel.providerId)?.color||"#888")+"20", display:"flex", alignItems:"center", justifyContent:"center", color:AI_PROVIDERS.find(p=>p.id===selectedModel.providerId)?.color||"#888", fontSize:8, fontWeight:900 }}>
              {selectedModel.providerId.slice(0,1).toUpperCase()}
            </div>
            {selectedModel.name}
            <WI n="chevron-down" s={12}/>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
          {view === "explore" ? (
            <ExploreView models={filteredModels} selectedModel={selectedModel} onSelect={m=>{setMod(m);setView("chat");}} providerFilter={providerFilter}/>
          ) : view === "projects" ? (
            <ProjectsView projects={projects}/>
          ) : (
            <>
              {activeChat.messages.length === 0 && (
                <EmptyState mode={mode} onSuggest={s=>{setInput(s); textRef.current?.focus();}}/>
              )}
              {activeChat.messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} modelName={msg.modelId ? models.find(m=>m.id===msg.modelId)?.name : undefined}/>
              ))}
              {thinking && <ThinkingIndicator/>}
              <div ref={messagesEndRef}/>
            </>
          )}
        </div>

        {/* Input */}
        {(view === "chat" || view === "settings") && (
          <div style={{ padding:"12px 20px 16px", borderTop:"1px solid var(--w-border)", background:"var(--w-surface)", flexShrink:0 }}>
            <div style={{ display:"flex", gap:10, alignItems:"flex-end", background:"var(--w-card)", border:"1px solid var(--w-border)", borderRadius:14, padding:"10px 14px" }}>
              <button style={{ background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", display:"flex", flexShrink:0 }}>
                <WI n="attach" s={18}/>
              </button>
              <textarea
                ref={textRef}
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={mode.promptFa}
                rows={1}
                style={{ flex:1, background:"transparent", border:"none", outline:"none", resize:"none", color:"var(--w-text)", fontSize:13, fontFamily:"Vazirmatn", lineHeight:1.6, maxHeight:160, overflowY:"auto" }}
                onInput={e=>{ const t = e.currentTarget; t.style.height="auto"; t.style.height=`${Math.min(t.scrollHeight,160)}px`; }}
              />
              <button onClick={sendMessage} disabled={!input.trim()||thinking}
                style={{ width:36, height:36, borderRadius:10, border:"none", background:input.trim()&&!thinking?"#7c3aed":"var(--w-card2)", color:input.trim()&&!thinking?"#fff":"var(--w-muted)", display:"flex", alignItems:"center", justifyContent:"center", cursor:input.trim()&&!thinking?"pointer":"default", flexShrink:0, transition:"all 0.12s" }}>
                <WI n="send" s={16}/>
              </button>
            </div>
            <div style={{ textAlign:"center", fontSize:10, color:"var(--w-muted)", marginTop:6 }}>
              {selectedModel.name} · آن هوش می‌تواند اشتباه کند. اطلاعات مهم را تأیید کنید.
            </div>
          </div>
        )}
      </main>

      {/* ── Model Panel (desktop) ── */}
      {!isMobile && modelPanelOpen && (
        <aside style={{ width:260, flexShrink:0, background:"var(--w-surface)", borderRight:"1px solid var(--w-border)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"14px 14px 10px", borderBottom:"1px solid var(--w-border)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:800 }}>انتخاب مدل</div>
              <button onClick={()=>setModelPanel(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", display:"flex" }}><WI n="close" s={14}/></button>
            </div>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              <button onClick={()=>setProvFilter("all")} style={{ padding:"3px 10px", borderRadius:6, border:"none", background:providerFilter==="all"?"rgba(124,58,237,0.12)":"var(--w-card2)", color:providerFilter==="all"?"#7c3aed":"var(--w-muted)", fontSize:11, fontWeight:providerFilter==="all"?700:400, cursor:"pointer", fontFamily:"Vazirmatn" }}>همه</button>
              {AI_PROVIDERS.map(prov=>(
                <button key={prov.id} onClick={()=>setProvFilter(prov.id)} style={{ padding:"3px 10px", borderRadius:6, border:"none", background:providerFilter===prov.id?prov.color+"20":"var(--w-card2)", color:providerFilter===prov.id?prov.color:"var(--w-muted)", fontSize:11, fontWeight:providerFilter===prov.id?700:400, cursor:"pointer", fontFamily:"Vazirmatn" }}>{prov.name}</button>
              ))}
            </div>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"8px" }}>
            {filteredModels.map(m => {
              const prov = AI_PROVIDERS.find(p=>p.id===m.providerId);
              const isSelected = selectedModel.id === m.id;
              return (
                <button key={m.id} onClick={()=>setMod(m)} style={{ display:"block", width:"100%", padding:"10px 12px", borderRadius:10, border:`1.5px solid ${isSelected?"rgba(124,58,237,0.5)":"transparent"}`, background:isSelected?"rgba(124,58,237,0.08)":"transparent", cursor:"pointer", textAlign:"right", marginBottom:4, fontFamily:"Vazirmatn", transition:"all 0.1s" }}
                  onMouseEnter={e=>{if(!isSelected)(e.currentTarget as HTMLButtonElement).style.background="var(--w-hover)"}}
                  onMouseLeave={e=>{if(!isSelected)(e.currentTarget as HTMLButtonElement).style.background="transparent"}}
                >
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:28, height:28, borderRadius:8, background:(prov?.color||"#888")+"20", border:`1px solid ${(prov?.color||"#888")}30`, display:"flex", alignItems:"center", justifyContent:"center", color:prov?.color||"#888", fontSize:10, fontWeight:900, flexShrink:0 }}>
                      {m.providerId.slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:isSelected?"#7c3aed":"var(--w-text)" }}>{m.name}</span>
                        {m.badge && (
                          <span style={{ fontSize:9, padding:"1px 5px", borderRadius:4, background:m.badge==="pro"?"rgba(124,58,237,0.12)":m.badge==="new"?"rgba(16,185,129,0.12)":"rgba(251,191,36,0.12)", color:m.badge==="pro"?"#7c3aed":m.badge==="new"?"#10b981":"#f59e0b", fontWeight:700 }}>{m.badge.toUpperCase()}</span>
                        )}
                      </div>
                      <div style={{ fontSize:10, color:"var(--w-muted)", marginTop:1 }}>{m.contextWindow} · {prov?.name}</div>
                    </div>
                    {isSelected && <WI n="check" s={14} style={{ color:"#7c3aed", flexShrink:0 }}/>}
                  </div>
                  <div style={{ fontSize:10, color:"var(--w-muted)", marginTop:5, lineHeight:1.5 }}>{m.descFa}</div>
                  <div style={{ display:"flex", gap:4, marginTop:5, flexWrap:"wrap" }}>
                    {m.capabilities.map(cap => (
                      <span key={cap} style={{ fontSize:9, padding:"1px 6px", borderRadius:4, background:"var(--w-card2)", color:"var(--w-muted)", border:"1px solid var(--w-border)" }}>{cap}</span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      )}
    </div>
  );
}

function EmptyState({ mode, onSuggest }: { mode: CreationMode; onSuggest:(s:string)=>void; }) {
  const suggestions: Record<string, string[]> = {
    chat:      ["سلام! یک سؤال دارم","روز خوب. کمکم کن","درباره خودت توضیح بده"],
    code:      ["یک تابع پایتون برای مرتب‌سازی","API با Node.js و Express","الگوریتم جستجوی باینری"],
    write:     ["یک مقاله درباره هوش مصنوعی","ایمیل حرفه‌ای رسمی","توضیحات محصول برای فروشگاه"],
    translate: ["این جمله را ترجمه کن","معادل فارسی این اصطلاح","ترجمه رسمی این سند"],
    summarize: ["این مقاله را خلاصه کن","نکات کلیدی این متن","بهترین بخش‌های این گزارش"],
    research:  ["تاریخچه بلاکچین","مقایسه مدل‌های هوش مصنوعی","وضعیت بازار ارز دیجیتال"],
    math:      ["معادله درجه دوم","ماتریس معکوس","مسئله احتمال"],
    create:    ["داستان کوتاه درباره آینده","شعر درباره طبیعت","طرح داستانی برای رمان"],
  };
  const sugs = suggestions[mode.id] || ["شروع کن","کمکم کن","سؤال دارم"];

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", textAlign:"center", padding:"40px 24px" }}>
      <div style={{ width:64, height:64, borderRadius:20, background:`${mode.color}15`, border:`1.5px solid ${mode.color}30`, display:"flex", alignItems:"center", justifyContent:"center", color:mode.color, marginBottom:16 }}>
        <WI n={mode.icon} s={30}/>
      </div>
      <h2 style={{ fontSize:20, fontWeight:900, marginBottom:6 }}>{mode.labelFa}</h2>
      <p style={{ fontSize:13, color:"var(--w-muted)", marginBottom:28, maxWidth:360, lineHeight:1.7 }}>
        با آن هوش در حالت {mode.labelFa} شروع کنید. از مدل‌های پیشرفته AI برای بهترین نتیجه استفاده می‌شود.
      </p>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center", maxWidth:500 }}>
        {sugs.map(s => (
          <button key={s} onClick={()=>onSuggest(s)} style={{ padding:"9px 16px", borderRadius:10, border:"1px solid var(--w-border)", background:"var(--w-card)", color:"var(--w-text)", fontSize:12, cursor:"pointer", fontFamily:"Vazirmatn", transition:"border-color 0.12s" }}
            onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.borderColor=mode.color+"60"}
            onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.borderColor="var(--w-border)"}
          >{s}</button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ msg, modelName }: { msg: { role:string; content:string; createdAt:string }; modelName?:string }) {
  const isUser = msg.role === "user";
  const isCode = msg.content.startsWith("```");
  return (
    <div style={{ display:"flex", justifyContent:isUser?"flex-start":"flex-end", marginBottom:16, gap:10, alignItems:"flex-start" }}>
      {!isUser && (
        <div style={{ width:30, height:30, borderRadius:9, background:"rgba(124,58,237,0.12)", border:"1px solid rgba(124,58,237,0.22)", display:"flex", alignItems:"center", justifyContent:"center", color:"#7c3aed", flexShrink:0, marginTop:2 }}>
          <WI n="hoosh" s={14}/>
        </div>
      )}
      <div style={{ maxWidth:"72%", display:"flex", flexDirection:"column", alignItems:isUser?"flex-start":"flex-end" }}>
        {!isUser && modelName && (
          <div style={{ fontSize:10, color:"var(--w-muted)", marginBottom:4, fontWeight:600 }}>{modelName}</div>
        )}
        <div style={{ padding:isCode?"14px 16px":"12px 16px", borderRadius:isUser?"14px 14px 14px 4px":"14px 14px 4px 14px", background:isUser?"rgba(124,58,237,0.1)":"var(--w-card)", border:`1px solid ${isUser?"rgba(124,58,237,0.2)":"var(--w-border)"}`, fontSize:13, lineHeight:1.7, color:"var(--w-text)", direction:"rtl", textAlign:"right", whiteSpace:"pre-wrap", fontFamily:isCode?"monospace":"Vazirmatn" }}>
          {msg.content}
        </div>
        <div style={{ fontSize:10, color:"var(--w-muted)", marginTop:4 }}>
          {new Date(msg.createdAt).toLocaleTimeString("fa-IR")}
        </div>
      </div>
      {isUser && (
        <div style={{ width:30, height:30, borderRadius:"50%", background:"rgba(124,58,237,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>
          <WI n="user" s={14} style={{ color:"#7c3aed" }}/>
        </div>
      )}
    </div>
  );
}

function ThinkingIndicator() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i+1)%THINKING_MSGS.length), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16, gap:10, alignItems:"center" }}>
      <div style={{ width:30, height:30, borderRadius:9, background:"rgba(124,58,237,0.12)", display:"flex", alignItems:"center", justifyContent:"center", color:"#7c3aed", flexShrink:0 }}>
        <WI n="hoosh" s={14}/>
      </div>
      <div style={{ padding:"10px 16px", borderRadius:14, background:"var(--w-card)", border:"1px solid var(--w-border)", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ display:"flex", gap:4 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#7c3aed", opacity:0.6 }}/>
          ))}
        </div>
        <span style={{ fontSize:12, color:"var(--w-muted)" }}>{THINKING_MSGS[idx]}</span>
      </div>
    </div>
  );
}

function ExploreView({ models, selectedModel, onSelect, providerFilter }: { models: AiModel[]; selectedModel: AiModel; onSelect:(m:AiModel)=>void; providerFilter:string; }) {
  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontSize:20, fontWeight:900, marginBottom:6 }}>کاوش مدل‌های هوش مصنوعی</h2>
        <p style={{ fontSize:13, color:"var(--w-muted)" }}>
          {providerFilter === "all" ? `${models.length} مدل از ۸ ارائه‌دهنده پیشرو` : `${models.length} مدل از ${AI_PROVIDERS.find(p=>p.id===providerFilter)?.name}`}
        </p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:14 }}>
        {models.map(m => {
          const prov = AI_PROVIDERS.find(p=>p.id===m.providerId);
          const isSel = selectedModel.id === m.id;
          return (
            <div key={m.id} onClick={()=>onSelect(m)} style={{ padding:"18px", borderRadius:14, border:`1.5px solid ${isSel?"rgba(124,58,237,0.5)":"var(--w-border)"}`, background:isSel?"rgba(124,58,237,0.06)":"var(--w-card)", cursor:"pointer", transition:"all 0.12s" }}
              onMouseEnter={e=>{if(!isSel)(e.currentTarget as HTMLDivElement).style.borderColor="rgba(124,58,237,0.3)"}}
              onMouseLeave={e=>{if(!isSel)(e.currentTarget as HTMLDivElement).style.borderColor="var(--w-border)"}}
            >
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:(prov?.color||"#888")+"20", border:`1.5px solid ${(prov?.color||"#888")}30`, display:"flex", alignItems:"center", justifyContent:"center", color:prov?.color||"#888", fontSize:12, fontWeight:900, flexShrink:0 }}>
                  {m.providerId.slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:14, fontWeight:800 }}>{m.name}</span>
                    {m.badge && (
                      <span style={{ fontSize:9, padding:"2px 6px", borderRadius:5, background:m.badge==="pro"?"rgba(124,58,237,0.12)":m.badge==="new"?"rgba(16,185,129,0.12)":"rgba(251,191,36,0.12)", color:m.badge==="pro"?"#7c3aed":m.badge==="new"?"#10b981":"#f59e0b", fontWeight:700 }}>{m.badge.toUpperCase()}</span>
                    )}
                    {isSel && <WI n="check-circle" s={14} style={{ color:"#7c3aed" }}/>}
                  </div>
                  <div style={{ fontSize:11, color:"var(--w-muted)" }}>{prov?.name} · {m.contextWindow}</div>
                </div>
              </div>
              <p style={{ fontSize:12, color:"var(--w-muted)", lineHeight:1.6, marginBottom:10 }}>{m.descFa}</p>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                {m.capabilities.map(cap => (
                  <span key={cap} style={{ fontSize:10, padding:"2px 7px", borderRadius:5, background:"var(--w-card2)", color:"var(--w-muted)", border:"1px solid var(--w-border)" }}>{cap}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectsView() {
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:900, marginBottom:4 }}>پروژه‌های من</h2>
          <p style={{ fontSize:13, color:"var(--w-muted)" }}>فایل‌ها، خروجی‌ها و ورک‌فلوهای هوش مصنوعی</p>
        </div>
        <button className="w-btn w-btn-primary" style={{ padding:"9px 18px", fontSize:13, background:"#7c3aed" }}>
          <WI n="plus" s={14}/> پروژه جدید
        </button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
        {DEMO_PROJECTS.map(proj => (
          <div key={proj.id} className="w-card" style={{ padding:"20px", cursor:"pointer", transition:"transform 0.1s" }}
            onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)"}
            onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.transform="none"}
          >
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:"rgba(124,58,237,0.12)", display:"flex", alignItems:"center", justifyContent:"center", color:"#7c3aed" }}>
                <WI n="folder" s={20}/>
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:800 }}>{proj.title}</div>
                <div style={{ fontSize:11, color:"var(--w-muted)" }}>{proj.chatIds.length} چت</div>
              </div>
            </div>
            <div style={{ fontSize:12, color:"var(--w-muted)", lineHeight:1.6, marginBottom:12 }}>{proj.description}</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"var(--w-card2)", border:"1px solid var(--w-border)", color:"var(--w-muted)" }}>{proj.chatIds.length} مکالمه</span>
              <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:proj.accentColor+"20", border:`1px solid ${proj.accentColor}30`, color:proj.accentColor }}>{models.find(m=>m.id===proj.modelId)?.name || proj.modelId}</span>
            </div>
          </div>
        ))}
        <div style={{ padding:"20px", borderRadius:14, border:"2px dashed var(--w-border)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, cursor:"pointer", minHeight:160, color:"var(--w-muted)", transition:"border-color 0.12s" }}
          onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.borderColor="rgba(124,58,237,0.4)"}
          onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.borderColor="var(--w-border)"}
        >
          <WI n="plus" s={28} style={{ opacity:0.3 }}/>
          <div style={{ fontSize:13, fontWeight:600 }}>پروژه جدید</div>
        </div>
      </div>
    </div>
  );
}
