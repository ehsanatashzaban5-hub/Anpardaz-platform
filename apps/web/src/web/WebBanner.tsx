import { useEffect, useMemo, useState } from "react";
import WI from "./WebIcons";
import type { WebPage } from "./types";

const BASE=((import.meta as any).env?.VITE_BANNER_API_URL as string|undefined)?.replace(/\/$/,"")??"";
const FA=(v:unknown)=>String(v??"").replace(/\d/g,d=>"۰۱۲۳۴۵۶۷۸۹"[+d]);
const fmt=(v:number|null,cur="IRR")=>v==null?"توافقی":`${FA(Number(v).toLocaleString())} ${cur==="IRR"?"تومان":cur}`;

async function api(path:string,init:RequestInit={}) {
  const token=localStorage.getItem("anpardaz:accessToken")??"";
  const r=await fetch(BASE+path,{...init,headers:{...(init.body?{"content-type":"application/json"}:{}),...(init.headers??{}),...(token?{authorization:"Bearer "+token}:{})},cache:"no-store"});
  const body=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(String(body?.error??"banner_request_failed"));
  return body;
}
function mediaUrl(id:number|string){return BASE+"/api/v1/banner/media/"+encodeURIComponent(String(id));}
function categoryOptions(categories:any[]){const byParent=new Map<string,any[]>();for(const c of categories){const k=String(c.parent_id??"root");const a=byParent.get(k)??[];a.push(c);byParent.set(k,a);}for(const a of byParent.values())a.sort((x,y)=>Number(x.sort_order)-Number(y.sort_order)||Number(x.id)-Number(y.id));const out:any[]=[];const walk=(parent:string|null,depth=0)=>{for(const c of byParent.get(String(parent??"root"))??[]){out.push({...c,_depth:depth});walk(String(c.id),depth+1);}};walk(null);return out;}
type Listing=any; type Ticket=any; type Conversation=any;

interface Props{onNavigate:(p:WebPage)=>void;isLoggedIn:boolean;onAuthRequired:()=>void;}

export default function WebBanner({onNavigate,isLoggedIn,onAuthRequired}:Props){
  const [section,setSection]=useState<"home"|"favorites"|"messages"|"notifications"|"my-listings"|"account"|"tickets"|"post">("home");
  const [listings,setListings]=useState<Listing[]>([]);
  const [categories,setCategories]=useState<any[]>([]);
  const [favorites,setFavorites]=useState<Set<string>>(new Set());
  const [selected,setSelected]=useState<Listing|null>(null);
  const [query,setQuery]=useState("");
  const [city,setCity]=useState("");
  const [category,setCategory]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [tickets,setTickets]=useState<Ticket[]>([]);
  const [ticket,setTicket]=useState<any|null>(null);
  const [conversations,setConversations]=useState<Conversation[]>([]);
  const [conversation,setConversation]=useState<any|null>(null);
  const [notifications,setNotifications]=useState<any[]>([]);
  const [profile,setProfile]=useState<any|null>(null);
  const [myListings,setMyListings]=useState<Listing[]>([]);const [recentViews,setRecentViews]=useState<Listing[]>([]);

  const loadHome=async()=>{
    setLoading(true);setError("");
    try{
      const q=new URLSearchParams();if(query.trim())q.set("q",query.trim());if(city.trim())q.set("city",city.trim());if(category)q.set("categoryId",category);q.set("limit","100");
      const [l,c]=await Promise.all([api("/api/v1/banner/listings?"+q.toString()),api("/api/v1/banner/categories")]);
      setListings(l.listings??[]);setCategories(c.categories??[]);
      if(isLoggedIn){const f=await api("/api/v1/banner/me/favorites");setFavorites(new Set((f.listings??[]).map((x:any)=>String(x.id))));}
    }catch(e){setError(e instanceof Error?e.message:"خطا در دریافت آگهی‌ها")}finally{setLoading(false)}
  };
  const loadPrivate=async()=>{
    if(!isLoggedIn)return;
    setLoading(true);setError("");
    try{
      const [f,t,n,p,m,ml,rv]=await Promise.all([
        api("/api/v1/banner/me/favorites"),api("/api/v1/banner/me/tickets"),api("/api/v1/banner/me/notifications"),
        api("/api/v1/banner/me"),api("/api/v1/banner/me/conversations"),api("/api/v1/banner/me/listings"),api("/api/v1/banner/me/recent-views")
      ]);
      setFavorites(new Set((f.listings??[]).map((x:any)=>String(x.id))));setTickets(t.tickets??[]);setNotifications(n.notifications??[]);setProfile(p.profile??null);setConversations(m.conversations??[]);setMyListings(ml.listings??[]);setRecentViews(rv.listings??[]);
    }catch(e){setError(e instanceof Error?e.message:"خطا در دریافت اطلاعات حساب")}finally{setLoading(false)}
  };
  useEffect(()=>{void loadHome()},[query,city,category,isLoggedIn]);
  useEffect(()=>{if(isLoggedIn)void loadPrivate()},[isLoggedIn]);

  const filtered=useMemo(()=>listings,[listings]);
  const protectedNav=(s:typeof section)=>{if(!isLoggedIn){onAuthRequired();return;}setSection(s);setSelected(null);};

  const toggleFavorite=async(id:string)=>{
    if(!isLoggedIn){onAuthRequired();return;}
    try{const r=await api("/api/v1/banner/listings/"+encodeURIComponent(id)+"/favorite",{method:"POST"});setFavorites(p=>{const n=new Set(p);r.favorite?n.add(id):n.delete(id);return n;});}catch(e){setError(e instanceof Error?e.message:"favorite_failed")}
  };
  const openListing=async(x:Listing)=>{try{if(isLoggedIn)await api("/api/v1/banner/me/recent-views/"+x.id,{method:"POST",body:"{}"});const d=await api("/api/v1/banner/listings/"+x.id);setSelected({...x,...d.listing,media:d.media??[]});}catch(e){setError(e instanceof Error?e.message:"listing_failed")}};

  const nav=[
    ["home","خانه"],["favorites","علاقه‌مندی‌ها"],["recent","آخرین مشاهده‌ها"],["messages","پیام‌ها"],["notifications","اعلان‌ها"],
    ["my-listings","آگهی‌های من"],["account","حساب کاربری"],["tickets","پشتیبانی"]
  ] as const;

  return <div className="w-fade" dir="rtl" style={{minHeight:"calc(100vh - var(--w-header))"}}>
    <div style={{background:"var(--w-surface)",borderBottom:"1px solid var(--w-border)"}}>
      <div style={{maxWidth:1480,margin:"0 auto",padding:"10px 20px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <button onClick={()=>{setSection("home");setSelected(null)}} style={{display:"flex",alignItems:"center",gap:8,border:0,background:"transparent",cursor:"pointer",fontWeight:900,fontSize:16}}><span style={{width:30,height:30,borderRadius:8,background:"rgba(232,53,78,.12)",display:"grid",placeItems:"center",color:"#e8354e"}}><WI n="banner" s={16}/></span>آن بنر</button>
        <div style={{display:"flex",gap:8,flex:1,minWidth:260}}>
          <input value={query} onChange={e=>setQuery(e.target.value)} onFocus={()=>{setSection("home");setSelected(null)}} className="w-input" placeholder="جستجو در آگهی‌ها..."/>
          <input value={city} onChange={e=>setCity(e.target.value)} className="w-input" style={{maxWidth:160}} placeholder="شهر"/>
          <select value={category} onChange={e=>setCategory(e.target.value)} className="w-input" style={{maxWidth:190}}><option value="">همه دسته‌ها</option>{categoryOptions(categories).map(c=><option key={c.id} value={c.id}>{"— ".repeat(c._depth)}{c.name}</option>)}</select>
        </div>
        <button className="w-btn w-btn-primary" onClick={()=>protectedNav("post")}><WI n="plus" s={14}/> ثبت آگهی</button>
        <button className="w-btn w-btn-ghost" onClick={()=>onNavigate("home")}><WI n="arrow-right" s={14}/> آن پرداز</button>
      </div>
    </div>
    <div style={{maxWidth:1480,margin:"0 auto",padding:"0 20px",display:"flex",gap:18}}>
      <aside style={{width:190,flexShrink:0,paddingTop:14,borderLeft:"1px solid var(--w-border)",minHeight:"calc(100vh - var(--w-header) - 55px)"}}>
        {nav.map(([id,label])=><button key={id} onClick={()=>id==="home"?(setSection("home"),setSelected(null)):protectedNav(id as any)} className={section===id?"w-btn w-btn-primary":"w-btn w-btn-ghost"} style={{width:"100%",justifyContent:"flex-start",marginBottom:7}}>{label}</button>)}
      </aside>
      <main style={{flex:1,minWidth:0,padding:"18px 0 50px"}}>
        {error&&<div className="w-card" style={{padding:12,marginBottom:12,color:"#dc2626"}}>{error}</div>}
        {selected&&<Detail listing={selected} favorite={favorites.has(String(selected.id))} onBack={()=>setSelected(null)} onFavorite={()=>void toggleFavorite(String(selected.id))} isLoggedIn={isLoggedIn} onAuthRequired={onAuthRequired}/>}
        {!selected&&section==="home"&&<Home listings={filtered} loading={loading} favorites={favorites} onOpen={openListing} onFavorite={toggleFavorite}/>}
        {section==="recent"&&<Home listings={recentViews} loading={loading} favorites={favorites} onOpen={openListing} onFavorite={toggleFavorite} title="آخرین مشاهده‌ها"/>}
        {section==="favorites"&&<Home listings={listings.filter(x=>favorites.has(String(x.id)))} loading={loading} favorites={favorites} onOpen={openListing} onFavorite={toggleFavorite} title="علاقه‌مندی‌های من"/>}
        {section==="my-listings"&&<MyListings listings={myListings} onOpen={openListing} onRefresh={loadPrivate}/>}
        {section==="account"&&<Account profile={profile} onRefresh={loadPrivate}/>}
        {section==="notifications"&&<Notifications items={notifications} onRefresh={loadPrivate}/>}
        {section==="messages"&&<Messages conversations={conversations} conversation={conversation} setConversation={setConversation} onRefresh={loadPrivate}/>}
        {section==="tickets"&&<Tickets tickets={tickets} ticket={ticket} setTicket={setTicket} onRefresh={loadPrivate}/>}
        {section==="post"&&<Post categories={categories} onDone={()=>{setSection("my-listings");void loadPrivate()}}/>}
      </main>
    </div>
  </div>;
}

function Home({listings,loading,favorites,onOpen,onFavorite,title="آخرین آگهی‌ها"}:{listings:Listing[];loading:boolean;favorites:Set<string>;onOpen:(x:Listing)=>void;onFavorite:(id:string)=>void;title?:string}){
 return <div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div><h1 style={{margin:0,fontSize:22,fontWeight:900}}>{title}</h1><div style={{fontSize:12,color:"var(--w-muted)",marginTop:5}}>داده‌ها مستقیماً از سرویس آن بنر خوانده می‌شوند.</div></div><span style={{fontSize:12,color:"var(--w-muted)"}}>{FA(listings.length)} آگهی</span></div>
 {loading&&!listings.length?<div className="w-card" style={{padding:30,textAlign:"center"}}>در حال دریافت...</div>:!listings.length?<div className="w-card" style={{padding:40,textAlign:"center"}}>آگهی واقعی برای این فیلتر وجود ندارد.</div>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12}}>{listings.map(x=><div key={x.id} className="w-card" style={{overflow:"hidden"}}>
   <div style={{height:180,background:"var(--w-card2)",display:"grid",placeItems:"center",overflow:"hidden"}}>{x.media_ids?.[0]?<img src={mediaUrl(x.media_ids[0])} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<WI n="banner" s={34}/>}</div>
   <div style={{padding:13}}><div style={{display:"flex",justifyContent:"space-between",gap:8}}><button onClick={()=>onOpen(x)} style={{border:0,background:"transparent",padding:0,cursor:"pointer",textAlign:"right",fontWeight:800,fontSize:14,color:"var(--w-text)"}}>{x.title}</button><button onClick={()=>void onFavorite(String(x.id))} style={{border:0,background:"transparent",cursor:"pointer",color:favorites.has(String(x.id))?"#e8354e":"var(--w-muted)"}}><WI n={favorites.has(String(x.id))?"heartFill":"heart"} s={18}/></button></div><div style={{fontSize:11,color:"var(--w-muted)",marginTop:7}}>{x.category_name??"—"} · {x.city}</div><div style={{fontWeight:900,marginTop:10}}>{fmt(x.price,x.currency)}</div></div>
 </div>)}</div>}
 </div>;
}

function Detail({listing,favorite,onBack,onFavorite,isLoggedIn,onAuthRequired}:{listing:Listing;favorite:boolean;onBack:()=>void;onFavorite:()=>void;isLoggedIn:boolean;onAuthRequired:()=>void}){
 const [message,setMessage]=useState("");const [sent,setSent]=useState(false);const [phone,setPhone]=useState("");const [reported,setReported]=useState(false);
 const send=async()=>{if(!isLoggedIn){onAuthRequired();return;}if(!message.trim())return;try{await api("/api/v1/banner/conversations",{method:"POST",body:JSON.stringify({listingId:Number(listing.id),message:message.trim()})});setMessage("");setSent(true);}catch(e){setSent(false)}};
 const contact=async()=>{if(!isLoggedIn){onAuthRequired();return;}try{const r=await api("/api/v1/banner/listings/"+listing.id+"/contact");setPhone(r.phone??"")}catch{}};
 const report=async()=>{if(!isLoggedIn){onAuthRequired();return;}const reason=window.prompt("دلیل گزارش تخلف");if(!reason?.trim())return;try{await api("/api/v1/banner/listings/"+listing.id+"/report",{method:"POST",body:JSON.stringify({reason:reason.trim()})});setReported(true)}catch{}};
 const share=async()=>{const url=window.location.href;if(navigator.share)await navigator.share({title:listing.title,url}).catch(()=>{});else await navigator.clipboard?.writeText(url)};
 return <div><button className="w-btn w-btn-ghost" onClick={onBack}>بازگشت</button><div style={{display:"grid",gridTemplateColumns:"minmax(0,1.4fr) minmax(300px,.8fr)",gap:18,marginTop:12}}>
   <div className="w-card" style={{overflow:"hidden"}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:6,padding:6}}>{(listing.media??[]).map((m:any)=><img key={m.id} src={mediaUrl(m.id)} alt="" style={{width:"100%",height:220,objectFit:"cover",borderRadius:10}}/>)}{!(listing.media??[]).length&&<div style={{height:220,display:"grid",placeItems:"center"}}><WI n="banner" s={42}/></div>}</div><div style={{padding:18}}><h1 style={{margin:"0 0 10px",fontSize:24}}>{listing.title}</h1><p style={{lineHeight:1.9,color:"var(--w-muted)"}}>{listing.description}</p><div style={{fontSize:20,fontWeight:900,marginTop:15}}>{fmt(listing.price,listing.currency)}</div><div style={{fontSize:12,color:"var(--w-muted)",marginTop:8}}>{listing.category_name} · {listing.city} · {listing.condition}</div></div></div>
   <div className="w-card" style={{padding:18,height:"fit-content"}}><div style={{fontWeight:900}}>فروشنده</div><div style={{marginTop:10}}>{listing.seller_display_name??"کاربر آن بنر"}</div><div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:12}}><button className="w-btn w-btn-ghost" onClick={()=>void share()}>اشتراک‌گذاری</button><button className="w-btn w-btn-ghost" onClick={()=>void contact()}>نمایش تماس</button></div>{phone&&<div style={{marginTop:9,fontWeight:800,direction:"ltr",textAlign:"right"}}>{phone}</div>}<button className="w-btn w-btn-ghost" onClick={onFavorite} style={{marginTop:12}}><WI n={favorite?"heartFill":"heart"} s={15}/> {favorite?"حذف از علاقه‌مندی":"افزودن به علاقه‌مندی"}</button><textarea className="w-input" rows={5} value={message} onChange={e=>setMessage(e.target.value)} placeholder="پیام به فروشنده" style={{marginTop:14}}/><button className="w-btn w-btn-primary" onClick={()=>void send()} style={{marginTop:8,width:"100%",justifyContent:"center"}}>ارسال پیام</button><button className="w-btn w-btn-ghost" onClick={()=>void report()} disabled={reported} style={{marginTop:7,width:"100%",justifyContent:"center"}}>{reported?"گزارش ارسال شد":"گزارش تخلف"}</button>{sent&&<div style={{color:"#059669",fontSize:12,marginTop:8}}>پیام در سرویس آن بنر ثبت شد.</div>}</div>
 </div></div>;
}

function MyListings({listings,onOpen,onRefresh}:{listings:Listing[];onOpen:(x:Listing)=>void;onRefresh:()=>void}){
 const change=async(id:string,status:string)=>{try{await api("/api/v1/banner/listings/"+id,{method:"PATCH",body:JSON.stringify({status})});onRefresh()}catch{}};
 const remove=async(id:string)=>{if(!window.confirm("آیا از حذف این آگهی مطمئن هستید؟"))return;try{await api("/api/v1/banner/listings/"+id,{method:"DELETE"});onRefresh()}catch{}};
 return <div><h2 style={{fontSize:20}}>آگهی‌های من</h2>{!listings.length?<div className="w-card" style={{padding:30}}>هنوز آگهی‌ای ثبت نکرده‌اید.</div>:<div style={{display:"grid",gap:10}}>{listings.map(x=><div key={x.id} className="w-card" style={{padding:14,display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}><div><button onClick={()=>onOpen(x)} style={{border:0,background:"transparent",cursor:"pointer",fontWeight:800}}>{x.title}</button><div style={{fontSize:11,color:"var(--w-muted)",marginTop:5}}>{x.status} · {x.city} · {fmt(x.price,x.currency)}</div></div><div style={{display:"flex",gap:6}}>{x.status==="pending"&&<span style={{fontSize:11}}>در انتظار تأیید</span>}{x.status==="published"&&<button className="w-btn w-btn-ghost" onClick={()=>void change(String(x.id),"paused")}>توقف</button>}{x.status==="paused"&&<button className="w-btn w-btn-primary" onClick={()=>void change(String(x.id),"published")}>انتشار مجدد</button>}<button className="w-btn w-btn-ghost" onClick={()=>void remove(String(x.id))}>حذف</button></div></div>)}</div>}</div>;
}

function Account({profile,onRefresh}:{profile:any;onRefresh:()=>void}){
 const [name,setName]=useState(profile?.display_name??"");const [phone,setPhone]=useState(profile?.phone??"");const [city,setCity]=useState(profile?.city??"");const [saved,setSaved]=useState(false);
 useEffect(()=>{setName(profile?.display_name??"");setPhone(profile?.phone??"");setCity(profile?.city??"")},[profile]);
 const save=async()=>{try{await api("/api/v1/banner/me",{method:"PATCH",body:JSON.stringify({displayName:name,phone,city})});setSaved(true);onRefresh()}catch{}};
 return <div className="w-card" style={{padding:22,maxWidth:650}}><h2 style={{marginTop:0}}>حساب کاربری آن بنر</h2><div style={{display:"grid",gap:12}}><input className="w-input" value={name} onChange={e=>setName(e.target.value)} placeholder="نام نمایشی"/><input className="w-input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="شماره موبایل" dir="ltr"/><input className="w-input" value={city} onChange={e=>setCity(e.target.value)} placeholder="شهر"/><button className="w-btn w-btn-primary" onClick={()=>void save()}>ذخیره</button>{saved&&<span style={{fontSize:12,color:"#059669"}}>ذخیره شد.</span>}</div></div>;
}

function Notifications({items,onRefresh}:{items:any[];onRefresh:()=>void}){
 const read=async(id:number)=>{await api("/api/v1/banner/notifications/"+id+"/read",{method:"PATCH",body:"{}"});onRefresh()};
 const all=async()=>{await api("/api/v1/banner/notifications/read-all",{method:"POST",body:"{}"});onRefresh()};
 return <div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2>اعلان‌ها</h2><button className="w-btn w-btn-ghost" onClick={()=>void all()}>همه خوانده شد</button></div>{!items.length?<div className="w-card" style={{padding:30}}>اعلانی وجود ندارد.</div>:items.map(n=><div key={n.id} className="w-card" style={{padding:13,marginBottom:8,cursor:n.read?"default":"pointer"}} onClick={()=>!n.read&&void read(n.id)}><b>{n.title}</b><div style={{fontSize:12,color:"var(--w-muted)",marginTop:5}}>{n.description}</div><div style={{fontSize:10,color:"var(--w-muted)",marginTop:6}}>{n.created_at}</div></div>)}</div>;
}

function Messages({conversations,conversation,setConversation,onRefresh}:{conversations:Conversation[];conversation:any;setConversation:(x:any)=>void;onRefresh:()=>void}){
 const [text,setText]=useState("");
 const open=async(id:string)=>{try{setConversation(await api("/api/v1/banner/conversations/"+id))}catch{}};
 const send=async()=>{if(!conversation?.conversation?.id||!text.trim())return;await api("/api/v1/banner/conversations/"+conversation.conversation.id+"/messages",{method:"POST",body:JSON.stringify({message:text.trim()})});setText("");setConversation(await api("/api/v1/banner/conversations/"+conversation.conversation.id));onRefresh()};
 if(conversation)return <div><button className="w-btn w-btn-ghost" onClick={()=>setConversation(null)}>بازگشت</button><div className="w-card" style={{padding:15,marginTop:10}}><h3>{conversation.conversation.message||"گفت‌وگو"}</h3><div style={{display:"grid",gap:8}}>{(conversation.messages??[]).map((m:any)=><div key={m.message_id} style={{padding:9,borderRadius:9,background:"var(--w-card2)"}}>{m.body}</div>)}</div><textarea className="w-input" value={text} onChange={e=>setText(e.target.value)} placeholder="پیام" style={{marginTop:10}}/><button className="w-btn w-btn-primary" onClick={()=>void send()} style={{marginTop:7}}>ارسال</button></div></div>;
 return <div><h2>پیام‌ها</h2>{!conversations.length?<div className="w-card" style={{padding:30}}>گفت‌وگویی وجود ندارد.</div>:conversations.map(c=><button key={c.conversation_id} className="w-btn w-btn-ghost" onClick={()=>void open(c.conversation_id)} style={{width:"100%",justifyContent:"space-between",marginBottom:7}}><span>{c.last_message||"گفت‌وگو"} · آگهی #{c.listing_id}</span><span>{c.last_message_at}</span></button>)}</div>;
}

function Tickets({tickets,ticket,setTicket,onRefresh}:{tickets:Ticket[];ticket:any;setTicket:(x:any)=>void;onRefresh:()=>void}){
 const [subject,setSubject]=useState("");const [message,setMessage]=useState("");const [reply,setReply]=useState("");
 const open=async(id:number)=>{try{setTicket(await api("/api/v1/banner/tickets/"+id))}catch{}};
 const create=async()=>{if(!subject.trim()||!message.trim())return;await api("/api/v1/banner/tickets",{method:"POST",body:JSON.stringify({subject:subject.trim(),message:message.trim()})});setSubject("");setMessage("");onRefresh()};
 const send=async()=>{if(!ticket?.ticket?.id||!reply.trim())return;await api("/api/v1/banner/tickets/"+ticket.ticket.id+"/reply",{method:"POST",body:JSON.stringify({message:reply.trim()})});setReply("");setTicket(await api("/api/v1/banner/tickets/"+ticket.ticket.id));onRefresh()};
 return <div><h2>پشتیبانی آن بنر</h2><div className="w-card" style={{padding:16,marginBottom:14}}><input className="w-input" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="موضوع"/><textarea className="w-input" value={message} onChange={e=>setMessage(e.target.value)} placeholder="شرح مشکل" rows={4} style={{marginTop:8}}/><button className="w-btn w-btn-primary" onClick={()=>void create()} style={{marginTop:8}}>ثبت تیکت</button></div>{ticket?<div className="w-card" style={{padding:16,marginBottom:12}}><button className="w-btn w-btn-ghost" onClick={()=>setTicket(null)}>بستن</button><h3>{ticket.ticket.subject}</h3>{(ticket.messages??[]).map((m:any)=><div key={m.id} style={{padding:8,borderBottom:"1px solid var(--w-border)"}}>{m.sender_type} · {m.body}</div>)}<textarea className="w-input" value={reply} onChange={e=>setReply(e.target.value)} placeholder="پاسخ" rows={3} style={{marginTop:10}}/><button className="w-btn w-btn-primary" onClick={()=>void send()} style={{marginTop:7}}>ارسال پاسخ</button></div>:null}{tickets.map(t=><button key={t.id} className="w-btn w-btn-ghost" onClick={()=>void open(t.id)} style={{width:"100%",justifyContent:"space-between",marginBottom:7}}><span>#{t.id} · {t.subject}</span><span>{t.status}</span></button>)}</div>;
}

function Post({categories,onDone}:{categories:any[];onDone:()=>void}){
 const [categoryId,setCategoryId]=useState("");const [title,setTitle]=useState("");const [contactEnabled,setContactEnabled]=useState(true);const [chatEnabled,setChatEnabled]=useState(true);const [description,setDescription]=useState("");const [price,setPrice]=useState("");const [condition,setCondition]=useState("used");const [city,setCity]=useState("");const [files,setFiles]=useState<File[]>([]);const [busy,setBusy]=useState(false);const [err,setErr]=useState("");const [aiSuggestionId,setAiSuggestionId]=useState<number|null>(null);const [aiInfo,setAiInfo]=useState("");
 const suggest=async()=>{if(!title.trim()||!description.trim()||description.length>200)return;setBusy(true);setErr("");try{const r=await api("/api/v1/banner/ai/suggest",{method:"POST",body:JSON.stringify({title:title.trim(),description:description.trim()})});const x=r.suggestion;setAiSuggestionId(Number(x.id));setCategoryId(String(x.categoryId));if(x.condition)setCondition(x.condition);if(x.price!==null&&x.price!==undefined&&!price)setPrice(String(x.price));setAiInfo("دسته‌بندی و اطلاعات اولیه توسط هوش مصنوعی پیشنهاد شد؛ قبل از ثبت می‌توانید اصلاح کنید.")}catch(e){setErr(e instanceof Error?e.message:"banner_ai_failed")}finally{setBusy(false)}};
 const submit=async()=>{if(!title.trim()||!description.trim()||description.length>200||!city.trim())return;setBusy(true);setErr("");try{let suggestionId=aiSuggestionId;if(!suggestionId){const r=await api("/api/v1/banner/ai/suggest",{method:"POST",body:JSON.stringify({title:title.trim(),description:description.trim()})});suggestionId=Number(r.suggestion.id);setCategoryId(String(r.suggestion.categoryId));if(r.suggestion.condition)setCondition(r.suggestion.condition);if(r.suggestion.price!==null&&!price)setPrice(String(r.suggestion.price));}const x=await api("/api/v1/banner/listings",{method:"POST",body:JSON.stringify({categoryId:categoryId?Number(categoryId):undefined,aiSuggestionId:suggestionId,title:title.trim(),description:description.trim(),price:price?Number(price):null,condition,city:city.trim(),currency:"IRR",contactEnabled,chatEnabled})});for(const f of files.slice(0,8)){const data=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(",")[1]??"");r.onerror=()=>reject(r.error);r.readAsDataURL(f)});await api("/api/v1/banner/listings/"+x.listing.id+"/media",{method:"POST",body:JSON.stringify({mimeType:f.type,filename:f.name,dataBase64:data})})}onDone()}catch(e){setErr(e instanceof Error?e.message:"ثبت آگهی ناموفق بود")}finally{setBusy(false)}};
 return <div className="w-card" style={{padding:22,maxWidth:760}}><h2>ثبت آگهی</h2><div style={{display:"grid",gap:10}}><select className="w-input" value={categoryId} onChange={e=>setCategoryId(e.target.value)}><option value="">دسته‌بندی پس از تحلیل هوش مصنوعی</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><input className="w-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="عنوان آگهی"/><textarea className="w-input" value={description} onChange={e=>setDescription(e.target.value.slice(0,200))} maxLength={200} rows={5} placeholder="حداکثر ۲۰۰ کاراکتر؛ جزئیات دقیق آگهی را بنویسید"/><div style={{fontSize:11,color:description.length>=200?"#dc2626":"var(--w-muted)",textAlign:"left"}}>{description.length}/200</div><button className="w-btn w-btn-ghost" onClick={()=>void suggest()} disabled={busy||!title.trim()||!description.trim()}>تحلیل هوش مصنوعی</button>{aiInfo&&<div style={{fontSize:12,color:"#059669"}}>{aiInfo}</div>}<input className="w-input" value={price} onChange={e=>setPrice(e.target.value)} placeholder="قیمت به ریال" inputMode="numeric"/><select className="w-input" value={condition} onChange={e=>setCondition(e.target.value)}><option value="new">نو</option><option value="like-new">در حد نو</option><option value="good">خوب</option><option value="used">کارکرده</option><option value="for-parts">قطعات</option></select><input className="w-input" value={city} onChange={e=>setCity(e.target.value)} placeholder="شهر"/><div style={{display:"flex",gap:14,flexWrap:"wrap",fontSize:12}}><label><input type="checkbox" checked={contactEnabled} onChange={e=>setContactEnabled(e.target.checked)}/> تماس تلفنی</label><label><input type="checkbox" checked={chatEnabled} onChange={e=>setChatEnabled(e.target.checked)}/> پیام و چت</label></div><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>setFiles(Array.from(e.target.files??[]).slice(0,8))}/>{err&&<div style={{color:"#dc2626",fontSize:12}}>{err}</div>}<button className="w-btn w-btn-primary" onClick={()=>void submit()} disabled={busy||!title.trim()||!description.trim()||description.length>200}>{busy?"در حال تحلیل/ثبت...":"ثبت آگهی برای بررسی"}</button></div></div>;
}
