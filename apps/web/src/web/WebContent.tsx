// ─────────────────────────────────────────────────
// An Pardaz Web Portal — News + Education + Video
// ─────────────────────────────────────────────────
import { useState, useEffect } from "react";
import WI from "./WebIcons";

import type { WebPage, Article, Video } from "./types";

const FA = (s: string | number) => String(s).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]);
const fmtDur = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

const NEWS_CATS = [
  { id:"all",          label:"همه اخبار",       icon:"newspaper" },
  { id:"crypto-news",  label:"ارزهای دیجیتال",  icon:"zap" },
  { id:"ai-news",      label:"هوش مصنوعی",      icon:"cpu" },
  { id:"tech-news",    label:"تکنولوژی",         icon:"monitor" },
  { id:"product-news", label:"محصولات جدید",     icon:"package" },
];

const EDU_CATS = [
  { id:"all",       label:"همه آموزش‌ها",      icon:"book" },
  { id:"crypto-edu",label:"ارزهای دیجیتال",    icon:"zap" },
  { id:"ai-edu",    label:"هوش مصنوعی",        icon:"cpu" },
  { id:"forex-edu", label:"فارکس",              icon:"trending-up" },
];

const VIDEO_CATS = [
  { id:"all",       label:"همه ویدیوها",       icon:"play" },
  { id:"video-edu", label:"آموزشی",             icon:"book" },
  { id:"video-news",label:"اخبار",              icon:"newspaper" },
];

const LEVEL_LABEL: Record<string, string> = {
  beginner:"مبتدی", intermediate:"متوسط", advanced:"پیشرفته"
};
const LEVEL_COLOR: Record<string, string> = {
  beginner:"#10b981", intermediate:"#d97706", advanced:"#e8354e"
};
const CAT_COLOR: Record<string, string> = {
  "crypto-news":"#f7931a","ai-news":"#7c3aed","tech-news":"#0891b2","product-news":"#059669",
  "crypto-edu":"#f7931a","ai-edu":"#7c3aed","forex-edu":"#0891b2",
  "video-edu":"#7c3aed","video-news":"#f7931a"
};

export type ContentSection = "news" | "education" | "video";

interface Props { section: ContentSection; onNavigate: (p: WebPage) => void; }

export default function WebContent({ section, onNavigate }: Props) {
  const API=(import.meta.env.VITE_PLATFORM_API_URL??"").replace(/\\/$/,"");
  const [liveNews,setLiveNews]=useState<any[]>([]);
  const [liveVideos,setLiveVideos]=useState<any[]>([]);
  const [loadingLive,setLoadingLive]=useState(true);
  const [newsCat,  setNewsCat]  = useState("all");
  const [eduCat,   setEduCat]   = useState("all");
  const [videoCat, setVideoCat] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedVideo,   setSelectedVideo]   = useState<Video | null>(null);
  const [search, setSearch] = useState("");
  useEffect(()=>{let cancelled=false;setLoadingLive(true);Promise.all([
    fetch(API+"/api/v1/news?limit=50",{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject(new Error("news_http"))),
    fetch(API+"/api/v1/content/videos?limit=50",{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject(new Error("video_http")))
  ]).then(([n,v])=>{if(cancelled)return;setLiveNews((n.items??[]).map((a:any)=>({id:String(a.id),type:"news",title:a.title,summary:a.summary??"",body:undefined,category:a.category_slug??"crypto-news",author:{id:"platform",name:a.source_name??"آن پرداز"},publishedAt:a.published_at??"",readingTime:1,views:0,likes:0,comments:0,shares:0,tags:a.keywords??[],hashtags:a.hashtags??[],seo:{title:a.meta_title??a.title,description:a.meta_description??a.summary??"",keywords:a.keywords??[],slug:a.slug,canonicalUrl:a.canonical_url},status:"published"})));setLiveVideos((v.videos??[]).map((x:any)=>({id:String(x.id),title:x.title,description:x.description??"",duration:Number(x.duration_seconds??0),category:x.category_slug??"video-news",author:{id:String(x.created_by??"admin"),name:"آن پرداز"},publishedAt:x.published_at??"",views:0,likes:0,comments:0,shares:0,tags:[],keywords:[],hashtags:x.hashtags??[],seo:{title:x.title,description:x.description??"",keywords:[],slug:String(x.id)},status:"published",videoUrl:API+"/api/v1/content/videos/"+x.id})));}).catch(()=>{if(!cancelled){setLiveNews([]);setLiveVideos([])}}).finally(()=>{if(!cancelled)setLoadingLive(false)});return()=>{cancelled=true}},[API]);

  const filteredNews = liveNews.filter(a =>
    (newsCat === "all" || a.category === newsCat) &&
    (search === "" || a.title.includes(search))
  );
  const filteredEdu = liveNews.filter(a =>
    (eduCat === "all" || a.category === eduCat) &&
    (search === "" || a.title.includes(search))
  );
  const filteredVideo = liveVideos.filter(v =>
    (videoCat === "all" || v.category === videoCat) &&
    (search === "" || v.title.includes(search))
  );

  if (selectedArticle) return <ArticleDetail article={selectedArticle} onBack={()=>setSelectedArticle(null)}/>;
  if (selectedVideo)   return <VideoDetail   video={selectedVideo}     onBack={()=>setSelectedVideo(null)}/>;

  return (
    <div className="w-fade" dir="rtl">
      {/* Platform Header */}
      <div style={{ background:"var(--w-surface)", borderBottom:"1px solid var(--w-border)" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 24px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:16, height:56 }}>
            {section === "news"      && <><div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:28, height:28, borderRadius:8, background:"rgba(8,145,178,0.1)", display:"flex", alignItems:"center", justifyContent:"center", color:"#0891b2" }}><WI n="newspaper" s={14}/></div><div style={{ fontSize:16, fontWeight:900 }}>اخبار</div></div></>}
            {section === "education" && <><div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:28, height:28, borderRadius:8, background:"rgba(124,58,237,0.1)", display:"flex", alignItems:"center", justifyContent:"center", color:"#7c3aed" }}><WI n="book" s={14}/></div><div style={{ fontSize:16, fontWeight:900 }}>آموزش</div></div></>}
            {section === "video"     && <><div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:28, height:28, borderRadius:8, background:"rgba(232,53,78,0.1)", display:"flex", alignItems:"center", justifyContent:"center", color:"#e8354e" }}><WI n="play" s={14}/></div><div style={{ fontSize:16, fontWeight:900 }}>مرکز ویدیو</div></div></>}

            <div style={{ flex:1, maxWidth:360, position:"relative" }}>
              <WI n="search" s={14} style={{ position:"absolute", right:11, top:"50%", transform:"translateY(-50%)", color:"var(--w-muted)", pointerEvents:"none" }}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجو..." className="w-input" style={{ paddingRight:34 }}/>
            </div>
            <button onClick={()=>onNavigate("home")} style={{ marginRight:"auto", background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
              <WI n="arrow-right" s={13}/> بازگشت
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1280, margin:"0 auto", padding:"24px", display:"flex", gap:24, alignItems:"flex-start" }}>
        {/* Category sidebar */}
        <div style={{ width:220, flexShrink:0, display:"flex", flexDirection:"column", gap:6, position:"sticky", top:"calc(var(--w-header) + 80px)" }}>
          {(section === "news" ? NEWS_CATS : section === "education" ? EDU_CATS : VIDEO_CATS).map(c => {
            const active = section==="news" ? newsCat===c.id : section==="education" ? eduCat===c.id : videoCat===c.id;
            return (
              <button key={c.id} onClick={()=>{ section==="news"?setNewsCat(c.id):section==="education"?setEduCat(c.id):setVideoCat(c.id); }}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, border:`1px solid ${active?"rgba(124,58,237,0.3)":"var(--w-border)"}`, background:active?"rgba(124,58,237,0.07)":"transparent", color:active?"#7c3aed":"var(--w-muted)", fontSize:13, fontWeight:active?700:500, cursor:"pointer", textAlign:"right", transition:"all 0.13s", fontFamily:"Vazirmatn" }}>
                <WI n={c.icon} s={15}/>{c.label}
              </button>
            );
          })}
        </div>

        {/* Content grid */}
        <div style={{ flex:1 }}>
          {section === "news" && (
            <>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                <div style={{ fontSize:18, fontWeight:900 }}>آخرین اخبار</div>
                <div style={{ fontSize:12, color:"var(--w-muted)" }}>{FA(filteredNews.length)} خبر</div>
              </div>
              {filteredNews.length === 0 && <EmptyState msg="خبری یافت نشد"/>}
              <div style={{ display:"grid", gap:16 }}>
                {/* Featured article */}
                {filteredNews[0] && (
                  <div className="w-card" style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:0, overflow:"hidden", cursor:"pointer" }}
                    onClick={()=>setSelectedArticle(filteredNews[0])}
                    onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform="translateY(-1px)";(e.currentTarget as HTMLDivElement).style.boxShadow="var(--w-shadow-md)";}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform="none";(e.currentTarget as HTMLDivElement).style.boxShadow="var(--w-shadow)";}}
                  >
                    <div style={{ padding:"24px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 10px", borderRadius:20, background:`${CAT_COLOR[filteredNews[0].category] ?? "#7c3aed"}18`, color:CAT_COLOR[filteredNews[0].category] ?? "#7c3aed" }}>{NEWS_CATS.find(c=>c.id===filteredNews[0].category)?.label}</span>
                        <span style={{ fontSize:11, color:"var(--w-muted)" }}>{filteredNews[0].publishedAt}</span>
                      </div>
                      <h2 style={{ fontSize:20, fontWeight:900, lineHeight:1.4, marginBottom:10 }}>{filteredNews[0].title}</h2>
                      <p style={{ fontSize:13, color:"var(--w-muted)", lineHeight:1.8 }}>{filteredNews[0].summary}</p>
                      <div style={{ marginTop:14, display:"flex", gap:16, fontSize:11, color:"var(--w-muted)" }}>
                        <span style={{ display:"flex", alignItems:"center", gap:4 }}><WI n="eye" s={12}/>{FA(filteredNews[0].views)}</span>
                        <span style={{ display:"flex", alignItems:"center", gap:4 }}><WI n="clock" s={12}/>{FA(filteredNews[0].readingTime)} دقیقه</span>
                      </div>
                    </div>
                    <div style={{ background:`linear-gradient(135deg,${CAT_COLOR[filteredNews[0].category] ?? "#7c3aed"}15,${CAT_COLOR[filteredNews[0].category] ?? "#7c3aed"}05)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <WI n="newspaper" s={72} style={{ color:`${CAT_COLOR[filteredNews[0].category] ?? "#7c3aed"}30` }}/>
                    </div>
                  </div>
                )}
                {/* Rest as grid */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
                  {filteredNews.slice(1).map(a => <ArticleCard key={a.id} article={a} onClick={()=>setSelectedArticle(a)}/>)}
                </div>
              </div>
            </>
          )}

          {section === "education" && (
            <>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                <div style={{ fontSize:18, fontWeight:900 }}>محتوای آموزشی</div>
                <div style={{ fontSize:12, color:"var(--w-muted)" }}>{FA(filteredEdu.length)} آموزش</div>
              </div>
              {filteredEdu.length === 0 && <EmptyState msg="آموزشی یافت نشد"/>}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
                {filteredEdu.map(a => (
                  <div key={a.id} className="w-card" style={{ cursor:"pointer", overflow:"hidden", transition:"all 0.15s" }}
                    onClick={()=>setSelectedArticle(a)}
                    onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)";(e.currentTarget as HTMLDivElement).style.boxShadow="var(--w-shadow-md)";}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform="none";(e.currentTarget as HTMLDivElement).style.boxShadow="var(--w-shadow)";}}
                  >
                    <div style={{ height:130, background:`linear-gradient(135deg,${CAT_COLOR[a.category]??"#7c3aed"}12,${CAT_COLOR[a.category]??"#7c3aed"}04)`, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
                      <WI n="book" s={48} style={{ color:`${CAT_COLOR[a.category]??"#7c3aed"}30` }}/>
                      {a.level && (
                        <span style={{ position:"absolute", top:10, right:10, fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background:`${LEVEL_COLOR[a.level]}18`, color:LEVEL_COLOR[a.level] }}>
                          {LEVEL_LABEL[a.level]}
                        </span>
                      )}
                    </div>
                    <div style={{ padding:"14px" }}>
                      <div style={{ fontSize:13, fontWeight:700, marginBottom:6, lineHeight:1.4 }}>{a.title}</div>
                      <div style={{ fontSize:11, color:"var(--w-muted)", lineHeight:1.6, marginBottom:10 }}>{a.summary}</div>
                      <div style={{ display:"flex", gap:12, fontSize:11, color:"var(--w-muted)" }}>
                        <span style={{ display:"flex", alignItems:"center", gap:3 }}><WI n="clock" s={11}/>{FA(a.readingTime)} دقیقه</span>
                        <span style={{ display:"flex", alignItems:"center", gap:3 }}><WI n="eye" s={11}/>{FA(a.views)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {section === "video" && (
            <>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                <div style={{ fontSize:18, fontWeight:900 }}>مرکز ویدیو</div>
                <div style={{ fontSize:12, color:"var(--w-muted)" }}>{FA(filteredVideo.length)} ویدیو</div>
              </div>
              {filteredVideo.length === 0 && <EmptyState msg="ویدیویی یافت نشد"/>}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
                {filteredVideo.map(v => (
                  <div key={v.id} className="w-card" style={{ cursor:"pointer", overflow:"hidden", transition:"all 0.15s" }}
                    onClick={()=>setSelectedVideo(v)}
                    onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)";(e.currentTarget as HTMLDivElement).style.boxShadow="var(--w-shadow-md)";}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform="none";(e.currentTarget as HTMLDivElement).style.boxShadow="var(--w-shadow)";}}
                  >
                    <div style={{ height:170, background:"linear-gradient(135deg,rgba(232,53,78,0.08),rgba(244,63,94,0.03))", position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <div style={{ width:52, height:52, borderRadius:"50%", background:"rgba(232,53,78,0.85)", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}>
                        <WI n="play" s={22} style={{ color:"#fff", marginRight:-2 }}/>
                      </div>
                      <span style={{ position:"absolute", bottom:8, left:10, background:"rgba(0,0,0,0.6)", color:"#fff", padding:"2px 7px", borderRadius:4, fontSize:11, fontWeight:700 }}>{fmtDur(v.duration)}</span>
                    </div>
                    <div style={{ padding:"14px" }}>
                      <div style={{ fontSize:13, fontWeight:700, marginBottom:6, lineHeight:1.4 }}>{v.title}</div>
                      <div style={{ fontSize:11, color:"var(--w-muted)", marginBottom:10, lineHeight:1.5 }}>{v.description}</div>
                      <div style={{ display:"flex", gap:12, fontSize:11, color:"var(--w-muted)" }}>
                        <span style={{ display:"flex", alignItems:"center", gap:3 }}><WI n="eye" s={11}/>{FA(v.views)}</span>
                        <span style={{ display:"flex", alignItems:"center", gap:3 }}><WI n="heart" s={11}/>{FA(v.likes)}</span>
                        <span style={{ marginRight:"auto" }}>{v.publishedAt}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Article Card ──────────────────────────────────
function ArticleCard({ article: a, onClick }: { article: Article; onClick: ()=>void }) {
  return (
    <div className="w-card" style={{ cursor:"pointer", overflow:"hidden", transition:"all 0.15s" }}
      onClick={onClick}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)";(e.currentTarget as HTMLDivElement).style.boxShadow="var(--w-shadow-md)";}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform="none";(e.currentTarget as HTMLDivElement).style.boxShadow="var(--w-shadow)";}}
    >
      <div style={{ height:120, background:`linear-gradient(135deg,${CAT_COLOR[a.category]??"#7c3aed"}12,${CAT_COLOR[a.category]??"#7c3aed"}04)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <WI n="newspaper" s={40} style={{ color:`${CAT_COLOR[a.category]??"#7c3aed"}25` }}/>
      </div>
      <div style={{ padding:"14px" }}>
        <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background:`${CAT_COLOR[a.category]??"#7c3aed"}15`, color:CAT_COLOR[a.category]??"#7c3aed", display:"inline-block", marginBottom:6 }}>
          {NEWS_CATS.find(c=>c.id===a.category)?.label || a.category}
        </span>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:6, lineHeight:1.4 }}>{a.title}</div>
        <div style={{ fontSize:11, color:"var(--w-muted)", lineHeight:1.6, marginBottom:8 }}>{a.summary}</div>
        <div style={{ display:"flex", gap:12, fontSize:11, color:"var(--w-muted)" }}>
          <span style={{ display:"flex", alignItems:"center", gap:3 }}><WI n="eye" s={11}/>{FA(a.views)}</span>
          <span style={{ marginRight:"auto" }}>{a.publishedAt}</span>
        </div>
      </div>
    </div>
  );
}

// ── Article Detail ────────────────────────────────
function ArticleDetail({ article: a, onBack }: { article: Article; onBack: ()=>void }) {
  return (
    <div className="w-fade" dir="rtl" style={{ maxWidth:780, margin:"0 auto", padding:"24px" }}>
      <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontSize:13, fontWeight:600, marginBottom:20 }}>
        <WI n="arrow-right" s={14}/> بازگشت
      </button>
      <span style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20, background:`${CAT_COLOR[a.category]??"#7c3aed"}15`, color:CAT_COLOR[a.category]??"#7c3aed", display:"inline-block", marginBottom:12 }}>
        {NEWS_CATS.find(c=>c.id===a.category)?.label || EDU_CATS.find(c=>c.id===a.category)?.label || a.category}
      </span>
      <h1 style={{ fontSize:26, fontWeight:900, lineHeight:1.4, marginBottom:14 }}>{a.title}</h1>
      <div style={{ display:"flex", gap:16, fontSize:12, color:"var(--w-muted)", marginBottom:20, flexWrap:"wrap" }}>
        <span style={{ display:"flex", alignItems:"center", gap:4 }}><WI n="user" s={12}/>{a.author.name}</span>
        <span style={{ display:"flex", alignItems:"center", gap:4 }}><WI n="calendar" s={12}/>{a.publishedAt}</span>
        <span style={{ display:"flex", alignItems:"center", gap:4 }}><WI n="clock" s={12}/>{FA(a.readingTime)} دقیقه مطالعه</span>
        <span style={{ display:"flex", alignItems:"center", gap:4 }}><WI n="eye" s={12}/>{FA(a.views)} بازدید</span>
      </div>
      <div style={{ height:320, background:`linear-gradient(135deg,${CAT_COLOR[a.category]??"#7c3aed"}12,${CAT_COLOR[a.category]??"#7c3aed"}04)`, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:24, border:"1px solid var(--w-border)" }}>
        <WI n="newspaper" s={80} style={{ color:`${CAT_COLOR[a.category]??"#7c3aed"}20` }}/>
      </div>
      <div style={{ fontSize:15, lineHeight:2, color:"var(--w-text)" }}>
        <p style={{ marginBottom:16 }}>{a.summary}</p>
        <div style={{ marginBottom:16, whiteSpace:"pre-wrap" }}>{a.body || "متن کامل این مطلب در حال بارگذاری است."}</div>
        <p style={{ marginBottom:16 }}>آن پرداز با ارائه محتوای تخصصی در حوزه ارزهای دیجیتال، هوش مصنوعی و فناوری مالی، به کاربران خود کمک می‌کند تا تصمیمات آگاهانه‌تری بگیرند.</p>
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:20 }}>
        {a.tags.map(t => <span key={t} style={{ fontSize:11, padding:"3px 10px", borderRadius:20, background:"var(--w-card2)", border:"1px solid var(--w-border)", color:"var(--w-muted)" }}>#{t}</span>)}
      </div>
    </div>
  );
}

// ── Video Detail ──────────────────────────────────
function VideoDetail({ video: v, onBack }: { video: Video; onBack: ()=>void }) {
  return (
    <div className="w-fade" dir="rtl" style={{ maxWidth:1000, margin:"0 auto", padding:"24px" }}>
      <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontSize:13, fontWeight:600, marginBottom:20 }}>
        <WI n="arrow-right" s={14}/> بازگشت به مرکز ویدیو
      </button>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:24, alignItems:"start" }}>
        <div>
          {/* Video player placeholder */}
          <div style={{ aspectRatio:"16/9", background:"#09090f", borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16, position:"relative", overflow:"hidden" }}>{v.videoUrl ? <video controls playsInline src={v.videoUrl} style={{width:"100%",height:"100%",objectFit:"contain"}} /> : null}
            <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(232,53,78,0.85)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <WI n="play" s={28} style={{ color:"#fff", marginRight:-4 }}/>
            </div>
            <div style={{ position:"absolute", bottom:12, left:12, right:12, display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ flex:1, height:3, background:"rgba(255,255,255,0.2)", borderRadius:4 }}><div style={{ width:"30%", height:"100%", background:"#e8354e", borderRadius:4 }}/></div>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.7)" }}>{fmtDur(v.duration)}</span>
            </div>
          </div>
          <h1 style={{ fontSize:20, fontWeight:900, marginBottom:10 }}>{v.title}</h1>
          <div style={{ display:"flex", gap:16, fontSize:12, color:"var(--w-muted)", marginBottom:14, flexWrap:"wrap" }}>
            <span style={{ display:"flex", alignItems:"center", gap:4 }}><WI n="user" s={12}/>{v.author.name}</span>
            <span style={{ display:"flex", alignItems:"center", gap:4 }}><WI n="calendar" s={12}/>{v.publishedAt}</span>
            <span style={{ display:"flex", alignItems:"center", gap:4 }}><WI n="eye" s={12}/>{FA(v.views)}</span>
            <span style={{ display:"flex", alignItems:"center", gap:4 }}><WI n="heart" s={12}/>{FA(v.likes)}</span>
          </div>
          <div style={{ fontSize:13, color:"var(--w-muted)", lineHeight:1.8 }}>{v.description}</div>
        </div>
        {/* Related videos */}
        <div>
          <div style={{ fontSize:13, fontWeight:800, marginBottom:12 }}>ویدیوهای مرتبط</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[].map(rv => (
              <div key={rv.id} style={{ display:"flex", gap:10, cursor:"pointer", padding:"8px", borderRadius:10, border:"1px solid transparent" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background="var(--w-hover)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background="transparent";}}
              >
                <div style={{ width:90, height:58, background:"#09090f", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <WI n="play" s={18} style={{ color:"rgba(255,255,255,0.4)" }}/>
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, lineHeight:1.4 }}>{rv.title}</div>
                  <div style={{ fontSize:10, color:"var(--w-muted)", marginTop:4 }}>{fmtDur(rv.duration)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div style={{ textAlign:"center", padding:"60px 0", color:"var(--w-muted)" }}>
      <WI n="search" s={40} style={{ marginBottom:12, opacity:0.3 }}/>
      <div style={{ fontSize:15, fontWeight:700 }}>{msg}</div>
    </div>
  );
}
