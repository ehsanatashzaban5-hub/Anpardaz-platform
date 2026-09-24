import {useEffect,useMemo,useState} from "react";
import type {WebPage} from "./types";
import WI from "./WebIcons";

type Props={onNavigate:(p:WebPage)=>void};
type Model={id:string;providerId:string;name:string};
type Conv={id:string;title:string;model?:string;mode?:string;updated_at?:string};
const apiBase=()=>((import.meta.env.VITE_PLATFORM_API_URL||"/api") as string).replace(/\/$/,"");
const token=()=>localStorage.getItem("anpardaz:accessToken")||"";
async function api(path:string,init:RequestInit={}){const t=token();if(!t)throw new Error("AUTH_REQUIRED");const h=new Headers(init.headers);h.set("Authorization",`Bearer ${t}`);h.set("Content-Type","application/json");const r=await fetch(apiBase()+path,{...init,headers:h,cache:"no-store"});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||`HTTP_${r.status}`);return d;}

export default function WebHooshProduction({onNavigate}:Props){
 const [models,setModels]=useState<Model[]>([]),[providers,setProviders]=useState<any[]>([]),[convs,setConvs]=useState<Conv[]>([]),[active,setActive]=useState<any>(null),[input,setInput]=useState(""),[busy,setBusy]=useState(false),[tab,setTab]=useState<"chat"|"history"|"projects"|"models"|"settings">("chat"),[projects,setProjects]=useState<any[]>([]),[error,setError]=useState("");
 const selected=active?.conversation?.model||models[0]?.id||"";
 const load=async()=>{const m=await api("/v1/hoosh/models");const ps=m.providers||[];setProviders(ps);setModels(ps.flatMap((p:any)=>(p.models||[]).map((id:string)=>({id,name:id,providerId:p.id}))));const c=await api("/v1/hoosh/conversations");setConvs(c.conversations||[]);const pr=await api("/v1/hoosh/projects");setProjects(pr.projects||[]);};
 useEffect(()=>{if(token())load().catch(e=>setError(e.message));},[]);
 const open=async(id:string)=>{const d=await api("/v1/hoosh/conversations/"+id);setActive(d);setTab("chat");};
 const create=async()=>{const d=await api("/v1/hoosh/conversations",{method:"POST",body:JSON.stringify({title:"مکالمه جدید",model:models[0]?.id||null,mode:"chat"})});setConvs(x=>[d.conversation,...x]);setActive({conversation:d.conversation,messages:[]});setTab("chat");};
 const send=async()=>{if(!input.trim()||!active||busy)return;const text=input.trim();setInput("");setBusy(true);setError("");try{await api(`/v1/hoosh/conversations/${active.conversation.id}/messages`,{method:"POST",headers:{"Idempotency-Key":`web-hoosh-${active.conversation.id}-${Date.now()}`},body:JSON.stringify({content:text,model:selected,mode:active.conversation.mode||"chat"})});for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,700));const d=await api(`/v1/hoosh/conversations/${active.conversation.id}`);setActive(d);if(d.messages?.at(-1)?.role==="assistant")break;}}catch(e:any){setError(e.message)}finally{setBusy(false)}};
 const filtered=useMemo(()=>convs,[convs]);
 return <div dir="rtl" style={{height:"calc(100vh - var(--w-header))",display:"flex",background:"var(--w-bg)",color:"var(--w-text)",overflow:"hidden"}}>
  <aside style={{width:250,background:"var(--w-surface)",borderLeft:"1px solid var(--w-border)",padding:14,display:"flex",flexDirection:"column",gap:10}}>
   <div style={{display:"flex",alignItems:"center",gap:8,fontWeight:900,fontSize:18,color:"#7c3aed"}}><WI n="hoosh" s={20}/> آن هوش</div>
   <button className="w-btn w-btn-primary" onClick={()=>void create()}><WI n="plus" s={14}/> چت جدید</button>
   {["chat","history","projects","models","settings"].map(x=><button key={x} className="w-btn w-btn-ghost" onClick={()=>setTab(x as any)}>{x==="chat"?"مکالمه":x==="history"?"تاریخچه":x==="projects"?"پروژه‌ها":x==="models"?"مدل‌ها":"تنظیمات"}</button>)}
   <div style={{marginTop:"auto"}}><button className="w-btn w-btn-ghost" onClick={()=>onNavigate("home")}>بازگشت به آن‌پرداز</button></div>
  </aside>
  <main style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
   {error&&<div style={{padding:"8px 14px",background:"rgba(220,38,38,.08)",color:"#dc2626",fontSize:12}}>{error}</div>}
   {tab==="chat"&&<><header style={{padding:16,borderBottom:"1px solid var(--w-border)",display:"flex",justifyContent:"space-between"}}><b>{active?.conversation?.title||"آن هوش"}</b><select value={selected} onChange={e=>active&&setActive({...active,conversation:{...active.conversation,model:e.target.value}})}><option value="">مدل سرور</option>{models.map(m=><option key={m.id} value={m.id}>{m.name} · {m.providerId}</option>)}</select></header><div style={{flex:1,overflowY:"auto",padding:24}}>{!active&&<div style={{textAlign:"center",padding:80,color:"var(--w-muted)"}}>یک مکالمه جدید ایجاد کنید یا از تاریخچه انتخاب کنید.</div>}{active?.messages?.map((m:any)=><div key={m.id} style={{maxWidth:"78%",marginBottom:14,marginRight:m.role==="assistant"?0:"auto",marginLeft:m.role==="assistant"?"auto":0,padding:14,borderRadius:14,background:m.role==="assistant"?"var(--w-card)":"rgba(124,58,237,.1)",border:"1px solid var(--w-border)",whiteSpace:"pre-wrap",lineHeight:1.8}}>{m.content}</div>)}</div><div style={{padding:14,borderTop:"1px solid var(--w-border)",display:"flex",gap:8}}><textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send();}}} placeholder="پیام خود را بنویسید..." style={{flex:1,minHeight:55}}/><button className="w-btn w-btn-primary" disabled={busy} onClick={()=>void send()}>ارسال</button></div></>}
   {tab==="history"&&<section style={{padding:24,overflowY:"auto"}}><h2>تاریخچه مکالمات</h2>{filtered.map(c=><button key={c.id} onClick={()=>void open(String(c.id))} className="w-card" style={{display:"block",width:"100%",textAlign:"right",padding:16,margin:"8px 0",cursor:"pointer"}}><b>{c.title}</b><div style={{fontSize:11,color:"var(--w-muted)",marginTop:5}}>{c.mode||"chat"} · {c.updated_at||""}</div></button>)}{!filtered.length&&<p style={{color:"var(--w-muted)"}}>هنوز مکالمه‌ای ثبت نشده است.</p>}</section>}
   {tab==="projects"&&<section style={{padding:24,overflowY:"auto"}}><h2>پروژه‌ها</h2>{projects.map(p=><div key={p.id} className="w-card" style={{padding:16,margin:"8px 0"}}><b>{p.title}</b><div style={{fontSize:12,color:"var(--w-muted)",marginTop:6}}>{p.description||"بدون توضیح"}</div></div>)}{!projects.length&&<p style={{color:"var(--w-muted)"}}>هنوز پروژه‌ای ثبت نشده است.</p>}</section>}
   {tab==="models"&&<section style={{padding:24,overflowY:"auto"}}><h2>مدل‌های فعال</h2>{providers.map(p=><div key={p.id} className="w-card" style={{padding:16,margin:"8px 0"}}><b>{p.id}</b><div style={{fontSize:12,color:"var(--w-muted)",marginTop:6}}>{(p.models||[]).join(" · ")||"مدل پیش‌فرض سرور"}</div></div>)}</section>}
   {tab==="settings"&&<section style={{padding:24}}><h2>تنظیمات آن هوش</h2><p style={{color:"var(--w-muted)",lineHeight:1.8}}>مدل‌ها و ارائه‌دهندگان از سرور آن هوش خوانده می‌شوند. کلیدهای API هرگز در مرورگر نگهداری نمی‌شوند.</p></section>}
  </main>
 </div>;
}
