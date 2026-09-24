// ─────────────────────────────────────────────────
// An Pardaz Web Portal — An Market (Desktop Marketplace)
// Full product marketplace: categories, search, product detail,
// account, orders, favorites, price alerts, AI chatbot, store comparison
// ─────────────────────────────────────────────────
import { useState, useMemo, useRef, useEffect } from "react";
import WI from "./WebIcons";
import { PRODUCT_CATEGORIES } from "./mockData";
import type { WebPage, Product } from "./types";

interface Props { onNavigate: (p: WebPage) => void; }

const FA = (s: string | number) => String(s).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]);
const fmtIRT = (n: number) => `${FA(Math.round(n/10000).toLocaleString())} هزار تومان`;
const fmtUSD = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits:0 })}`;

const MARKET_API=((import.meta as any).env?.VITE_PLATFORM_API_URL as string|undefined)?.replace(/\/$/,"")??"";
let MARKET_PRODUCTS:Product[]=[];

const SORT_OPTIONS = [
  { id:"newest",    label:"جدیدترین" },
  { id:"price-asc", label:"ارزان‌ترین" },
  { id:"price-desc",label:"گران‌ترین" },
  { id:"rating",    label:"بهترین امتیاز" },
];

type MarketSection = "shop"|"favorites"|"orders"|"alerts"|"account"|"tickets"|"ai";

export default function WebMarket({ onNavigate }: Props) {
  const [section, setSection]     = useState<MarketSection>("shop");
  const [selectedCat, setCat]     = useState<string>("all");
  const [search, setSearch]       = useState("");
  const [sortBy, setSortBy]       = useState("newest");
  const [selectedProduct, setProduct] = useState<Product|null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode]   = useState<"grid"|"list">("grid");
  const [cart, setCart]           = useState<string[]>([]);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(()=>{(async()=>{try{const url=MARKET_API+"/api/v1/market/catalog?limit=100"+(search?("&q="+encodeURIComponent(search)):"");const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error("market_catalog_unavailable");const d=await r.json();MARKET_PRODUCTS=(d.products??[]).map((p:any)=>({id:String(p.id),title:p.title??"",titleFa:p.title??"",description:p.description??"",price:Number(p.priceMin??0),originalPrice:Number(p.priceMax??0)>Number(p.priceMin??0)?Number(p.priceMax):undefined,images:(p.media??[]).map((m:any)=>m.url).filter(Boolean).concat((p.offers??[]).map((o:any)=>o.image_url).filter(Boolean)).slice(0,6),category:p.category_slug??"other",subcategory:p.category_name_fa,seller:{id:String(p.offers?.[0]?.store_id??"store"),name:p.offers?.[0]?.store_name??"فروشگاه",nameFa:p.offers?.[0]?.store_name??"فروشگاه",rating:0,reviewCount:0,salesCount:0,isVerified:true,joinedAt:""},rating:0,reviewCount:0,stock:1,sold:0,tags:[],specs:p.specs??{},offers:p.offers??[]}));}catch(e){console.error(e)}})();},[search]);
  useEffect(()=>{const token=localStorage.getItem("anpardaz:accessToken");if(!token)return;(async()=>{try{const r=await fetch(MARKET_API+"/api/v1/market/me/favorites",{headers:{authorization:"Bearer "+token}});if(r.ok){const d=await r.json();setFavorites(new Set((d.products??[]).map((p:any)=>String(p.id))))}}catch{}})()},[]);

  const filtered = useMemo(() => {
    let list = MARKET_PRODUCTS.filter(p =>
      (selectedCat === "all" || p.category === selectedCat) &&
      (search === "" ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.titleFa.includes(search) ||
        p.description.includes(search))
    );
    if (sortBy === "price-asc")  list = [...list].sort((a,b) => a.price - b.price);
    if (sortBy === "price-desc") list = [...list].sort((a,b) => b.price - a.price);
    if (sortBy === "rating")     list = [...list].sort((a,b) => (b.rating||0) - (a.rating||0));
    return list;
  }, [selectedCat, search, sortBy]);

  const toggleFav = (id: string) => { setFavorites(prev => { const s=new Set(prev); s.has(id)?s.delete(id):s.add(id); return s; }); void (async()=>{const token=localStorage.getItem("anpardaz:accessToken")??"";if(!token)return;try{await fetch(MARKET_API+"/api/v1/market/products/"+encodeURIComponent(id)+"/favorite",{method:"POST",headers:{authorization:"Bearer "+token}})}catch{}})(); };
  const addToCart = (id: string) => setCart(prev => [...prev, id]);
  const toggleCompare = (id: string) => setCompareList(prev =>
    prev.includes(id) ? prev.filter(x=>x!==id) : prev.length<3 ? [...prev,id] : prev
  );

  const navItems: {id:MarketSection;icon:string;label:string;badge?:number}[] = [
    { id:"shop",      icon:"market",   label:"فروشگاه" },
    { id:"favorites", icon:"heart",    label:"علاقه‌مندی‌ها" },
    { id:"orders",    icon:"package",  label:"سفارش‌ها", badge:2 },
    { id:"alerts",    icon:"bell",     label:"هشدار قیمت", badge:1 },
    { id:"ai",        icon:"sparkle",  label:"دستیار هوشمند" },
    { id:"account",   icon:"user",     label:"حساب کاربری" },
    { id:"tickets",   icon:"document", label:"پشتیبانی" },
  ];

  if (selectedProduct && section === "shop") {
    return (
      <div dir="rtl">
        <ProductDetail product={selectedProduct} onBack={()=>setProduct(null)} isFav={favorites.has(selectedProduct.id)} onToggleFav={()=>toggleFav(selectedProduct.id)} onAddCart={()=>addToCart(selectedProduct.id)} inCart={cart.includes(selectedProduct.id)} compareList={compareList} onToggleCompare={()=>toggleCompare(selectedProduct.id)}/>
        {compareList.length > 1 && <CompareBar products={MARKET_PRODUCTS.filter(p=>compareList.includes(p.id))} onShow={()=>setShowCompare(true)} onRemove={id=>toggleCompare(id)}/>}
        {showCompare && <ComparePopup products={MARKET_PRODUCTS.filter(p=>compareList.includes(p.id))} onClose={()=>setShowCompare(false)}/>}
      </div>
    );
  }

  return (
    <div className="w-fade" dir="rtl" style={{ minHeight:"calc(100vh - var(--w-header))" }}>
      {/* Platform header */}
      <div style={{ background:"var(--w-surface)", borderBottom:"1px solid var(--w-border)" }}>
        <div style={{ maxWidth:1480, margin:"0 auto", padding:"0 20px", display:"flex", alignItems:"center", gap:12, height:52 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:"rgba(217,119,6,0.12)", border:"1px solid rgba(217,119,6,0.22)", display:"flex", alignItems:"center", justifyContent:"center", color:"#d97706" }}>
              <WI n="market" s={15}/>
            </div>
            <span style={{ fontSize:15, fontWeight:900 }}>آن مارکت</span>
          </div>
          <div style={{ width:1, height:18, background:"var(--w-border)" }}/>
          <div style={{ position:"relative", flex:1, maxWidth:460 }}>
            <WI n="search" s={14} style={{ position:"absolute", right:11, top:"50%", transform:"translateY(-50%)", color:"var(--w-muted)", pointerEvents:"none" }}/>
            <input value={search} onChange={e=>{setSearch(e.target.value);setSection("shop");}} placeholder="جستجو در محصولات..." className="w-input" style={{ paddingRight:34, fontSize:13 }}/>
          </div>
          <div style={{ marginRight:"auto", display:"flex", gap:8, alignItems:"center" }}>
            <button onClick={()=>setSection("ai")} style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(139,92,246,0.1)", border:"1px solid rgba(139,92,246,0.25)", borderRadius:8, padding:"6px 12px", cursor:"pointer", color:"#8b5cf6", fontSize:12, fontWeight:700 }}>
              <WI n="sparkle" s={14}/> دستیار هوشمند
            </button>
            <button style={{ display:"flex", alignItems:"center", gap:4, background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontSize:12, fontWeight:600, position:"relative" }}
              onClick={()=>setSection("orders")}>
              <WI n="package" s={16}/>
              {cart.length > 0 && <span style={{ position:"absolute", top:-5, left:-5, width:15, height:15, borderRadius:"50%", background:"#d97706", color:"#fff", fontSize:9, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900 }}>{cart.length}</span>}
              سبد
            </button>
            <button onClick={()=>onNavigate("home")} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
              <WI n="arrow-right" s={13}/> آن پرداز
            </button>
          </div>
        </div>
      </div>

      <div style={{ display:"flex", maxWidth:1480, margin:"0 auto", width:"100%" }}>
        {/* Left sidebar nav */}
        <aside style={{ width:190, flexShrink:0, borderLeft:"1px solid var(--w-border)", padding:"12px 0", position:"sticky", top:"calc(var(--w-header) + 52px)", height:"calc(100vh - var(--w-header) - 52px)", overflowY:"auto", background:"var(--w-surface)" }}>
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>setSection(item.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:section===item.id?"rgba(217,119,6,0.1)":"transparent", border:"none", cursor:"pointer", color:section===item.id?"#d97706":"var(--w-muted)", fontSize:13, fontWeight:section===item.id?700:500, borderRight:section===item.id?"2px solid #d97706":"2px solid transparent", fontFamily:"Vazirmatn", textAlign:"right", transition:"all 0.12s" }}>
              <WI n={item.icon} s={15}/>{item.label}
              {item.badge && <span style={{ marginRight:"auto", fontSize:10, background:"#d97706", color:"#fff", borderRadius:10, padding:"1px 6px", fontWeight:700 }}>{FA(item.badge)}</span>}
            </button>
          ))}
        </aside>

        {/* Main content */}
        <div style={{ flex:1, padding:"20px", minWidth:0 }}>
          {section === "shop" && (
            <div style={{ display:"flex", gap:20 }}>
              {/* Categories sidebar */}
              <aside style={{ width:200, flexShrink:0 }}>
                <div className="w-card" style={{ padding:"14px", marginBottom:14 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"var(--w-muted)", marginBottom:10 }}>دسته‌بندی‌ها</div>
                  <button onClick={()=>setCat("all")} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"8px 10px", borderRadius:8, border:"none", background:selectedCat==="all"?"rgba(217,119,6,0.1)":"transparent", color:selectedCat==="all"?"#d97706":"var(--w-muted)", fontSize:13, fontWeight:selectedCat==="all"?700:500, cursor:"pointer", fontFamily:"Vazirmatn", textAlign:"right", marginBottom:2, borderLeft:selectedCat==="all"?"2px solid #d97706":"2px solid transparent" }}>
                    <WI n="market" s={14}/> همه محصولات
                    <span style={{ marginRight:"auto", fontSize:11, background:"var(--w-card2)", padding:"1px 6px", borderRadius:4 }}>{FA(MARKET_PRODUCTS.length)}</span>
                  </button>
                  {PRODUCT_CATEGORIES.map(cat => {
                    const count = MARKET_PRODUCTS.filter(p=>p.category===cat.id).length;
                    return (
                      <button key={cat.id} onClick={()=>setCat(cat.id)} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"8px 10px", borderRadius:8, border:"none", background:selectedCat===cat.id?"rgba(217,119,6,0.1)":"transparent", color:selectedCat===cat.id?"#d97706":"var(--w-muted)", fontSize:13, fontWeight:selectedCat===cat.id?700:400, cursor:"pointer", fontFamily:"Vazirmatn", textAlign:"right", marginBottom:2, borderLeft:selectedCat===cat.id?"2px solid #d97706":"2px solid transparent" }}>
                        <WI n={cat.icon} s={14}/> {cat.nameFa}
                        <span style={{ marginRight:"auto", fontSize:11, color:"var(--w-muted)" }}>{FA(count)}</span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ padding:"16px", borderRadius:12, background:"linear-gradient(135deg, rgba(217,119,6,0.12) 0%, rgba(217,119,6,0.04) 100%)", border:"1px solid rgba(217,119,6,0.2)" }}>
                  <WI n="trophy" s={24} style={{ color:"#d97706", marginBottom:8 }}/>
                  <div style={{ fontSize:13, fontWeight:800, marginBottom:4 }}>فروشنده شوید</div>
                  <div style={{ fontSize:11, color:"var(--w-muted)", lineHeight:1.6, marginBottom:10 }}>محصولات خود را در آن مارکت بفروشید</div>
                  <button className="w-btn w-btn-primary" style={{ width:"100%", padding:"8px", fontSize:12, background:"#d97706" }}>شروع کنید</button>
                </div>
              </aside>

              {/* Products */}
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, flexWrap:"wrap" }}>
                  <div style={{ fontSize:13, color:"var(--w-muted)", fontWeight:600 }}>
                    {FA(filtered.length)} محصول {selectedCat !== "all" && `در ${PRODUCT_CATEGORIES.find(c=>c.id===selectedCat)?.nameFa}`}
                  </div>
                  <div style={{ marginRight:"auto", display:"flex", gap:8 }}>
                    <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="w-input" style={{ fontSize:12, padding:"6px 12px", width:"auto" }}>
                      {SORT_OPTIONS.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                    <div style={{ display:"flex", gap:2 }}>
                      {(["grid","list"] as const).map(v=>(
                        <button key={v} onClick={()=>setViewMode(v)} style={{ padding:"7px", borderRadius:7, border:`1px solid ${viewMode===v?"rgba(217,119,6,0.4)":"var(--w-border)"}`, background:viewMode===v?"rgba(217,119,6,0.08)":"transparent", color:viewMode===v?"#d97706":"var(--w-muted)", cursor:"pointer", display:"flex" }}>
                          <WI n={v==="grid"?"filter":"sort"} s={14}/>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {filtered.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"80px 24px", color:"var(--w-muted)" }}>
                    <WI n="search" s={40} style={{ opacity:0.2, marginBottom:12 }}/>
                    <div style={{ fontSize:16, fontWeight:700 }}>محصولی یافت نشد</div>
                    <div style={{ fontSize:12, marginTop:4 }}>جستجو یا دسته‌بندی را تغییر دهید</div>
                  </div>
                ) : viewMode === "grid" ? (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(230px, 1fr))", gap:14 }}>
                    {filtered.map(p => (
                      <ProductCard key={p.id} product={p} isFav={favorites.has(p.id)} onToggleFav={()=>toggleFav(p.id)} onSelect={()=>setProduct(p)} onAddCart={()=>addToCart(p.id)} inCart={cart.includes(p.id)} inCompare={compareList.includes(p.id)} onToggleCompare={()=>toggleCompare(p.id)}/>
                    ))}
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    {filtered.map(p => (
                      <ProductListRow key={p.id} product={p} isFav={favorites.has(p.id)} onToggleFav={()=>toggleFav(p.id)} onSelect={()=>setProduct(p)} onAddCart={()=>addToCart(p.id)} inCart={cart.includes(p.id)}/>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {section === "favorites" && <FavoritesSection favorites={favorites} onSelect={p=>{setProduct(p);setSection("shop");}} onToggleFav={toggleFav} onAddCart={addToCart} cart={cart}/>}
          {section === "orders"    && <OrdersSection cart={cart}/>}
          {section === "alerts"    && <AlertsSection/>}
          {section === "ai"        && <AiSection/>}
          {section === "account"   && <MarketAccount/>}
          {section === "tickets"   && <MarketTickets/>}
        </div>
      </div>

      {compareList.length >= 2 && section==="shop" && !selectedProduct && (
        <CompareBar products={MARKET_PRODUCTS.filter(p=>compareList.includes(p.id))} onShow={()=>setShowCompare(true)} onRemove={id=>toggleCompare(id)}/>
      )}
      {showCompare && <ComparePopup products={MARKET_PRODUCTS.filter(p=>compareList.includes(p.id))} onClose={()=>setShowCompare(false)}/>}
    </div>
  );
}

// ── Product Card (grid) ─────────────────────────────
function ProductCard({ product:p, isFav, onToggleFav, onSelect, onAddCart, inCart, inCompare, onToggleCompare }: {
  product:Product; isFav:boolean; onToggleFav:()=>void;
  onSelect:()=>void; onAddCart:()=>void; inCart:boolean; inCompare?:boolean; onToggleCompare?:()=>void;
}) {
  return (
    <div className="w-card" style={{ overflow:"hidden", cursor:"pointer", transition:"transform 0.12s, box-shadow 0.12s" }}
      onMouseEnter={e=>{ const el = e.currentTarget as HTMLDivElement; el.style.transform="translateY(-3px)"; el.style.boxShadow="0 8px 24px rgba(0,0,0,0.12)"; }}
      onMouseLeave={e=>{ const el = e.currentTarget as HTMLDivElement; el.style.transform="none"; el.style.boxShadow="none"; }}
      onClick={onSelect}
    >
      <div style={{ height:180, background:`linear-gradient(135deg, ${p.images[0] ? "transparent" : "#1c1c2e"} 0%, rgba(217,119,6,0.06) 100%)`, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
        {p.images[0] ? (
          <img src={p.images[0]} alt={p.titleFa} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        ) : (
          <WI n="package" s={50} style={{ opacity:0.15 }}/>
        )}
        <button onClick={e=>{e.stopPropagation();onToggleFav();}} style={{ position:"absolute", top:10, left:10, width:30, height:30, borderRadius:"50%", background:"rgba(0,0,0,0.4)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:isFav?"#d97706":"rgba(255,255,255,0.7)" }}>
          <WI n="heart" s={14}/>
        </button>
        {p.discount && p.discount > 0 && (
          <span style={{ position:"absolute", top:10, right:10, fontSize:10, padding:"3px 8px", borderRadius:5, background:"#d97706", color:"#fff", fontWeight:700 }}>%{p.discount} تخفیف</span>
        )}
      </div>
      <div style={{ padding:"14px" }}>
        <div style={{ fontSize:12, color:"#d97706", fontWeight:600, marginBottom:4 }}>{PRODUCT_CATEGORIES.find(c=>c.id===p.category)?.nameFa}</div>
        <div style={{ fontSize:14, fontWeight:800, marginBottom:4, lineHeight:1.4 }}>{p.titleFa}</div>
        <div style={{ fontSize:11, color:"var(--w-muted)", marginBottom:8, lineHeight:1.5, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{p.description}</div>
        {p.rating && (
          <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:8 }}>
            {[1,2,3,4,5].map(i=>(
              <WI key={i} n={i<=Math.round(p.rating||0)?"star-fill":"star"} s={12} style={{ color:"#f59e0b" }}/>
            ))}
            <span style={{ fontSize:10, color:"var(--w-muted)" }}>({FA(p.reviewCount||0)})</span>
          </div>
        )}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:15, fontWeight:900, color:"#d97706" }}>{fmtIRT(p.price)}</div>
            {p.originalPrice && p.originalPrice > p.price && (
              <div style={{ fontSize:11, color:"var(--w-muted)", textDecoration:"line-through" }}>{fmtIRT(p.originalPrice)}</div>
            )}
          </div>
          <button onClick={e=>{e.stopPropagation();onAddCart();}} disabled={inCart}
            style={{ padding:"8px 14px", borderRadius:8, border:"none", background:inCart?"rgba(16,185,129,0.12)":"rgba(217,119,6,0.12)", color:inCart?"#10b981":"#d97706", fontSize:12, fontWeight:700, cursor:inCart?"default":"pointer", fontFamily:"Vazirmatn", display:"flex", alignItems:"center", gap:4 }}>
            <WI n={inCart?"check":"plus"} s={12}/> {inCart?"اضافه شد":"افزودن"}
          </button>
        </div>
        {onToggleCompare && (
          <button onClick={e=>{e.stopPropagation();onToggleCompare();}} style={{ marginTop:6, width:"100%", padding:"5px 0", border:`1px dashed ${inCompare?"#d97706":"var(--w-border)"}`, borderRadius:7, background:inCompare?"rgba(217,119,6,0.08)":"transparent", color:inCompare?"#d97706":"var(--w-muted)", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"Vazirmatn" }}>
            {inCompare?"✓ در مقایسه":"+ افزودن به مقایسه"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Product List Row ────────────────────────────────
function ProductListRow({ product:p, isFav, onToggleFav, onSelect, onAddCart, inCart }: {
  product:Product; isFav:boolean; onToggleFav:()=>void;
  onSelect:()=>void; onAddCart:()=>void; inCart:boolean;
}) {
  return (
    <div className="w-card" style={{ display:"flex", gap:16, padding:"14px", cursor:"pointer" }} onClick={onSelect}>
      <div style={{ width:100, height:100, borderRadius:10, background:"rgba(217,119,6,0.06)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        {p.images[0] ? (
          <img src={p.images[0]} alt={p.titleFa} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:10 }}/>
        ) : (
          <WI n="package" s={32} style={{ opacity:0.15 }}/>
        )}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:12, color:"#d97706", fontWeight:600, marginBottom:2 }}>{PRODUCT_CATEGORIES.find(c=>c.id===p.category)?.nameFa}</div>
        <div style={{ fontSize:15, fontWeight:800, marginBottom:4 }}>{p.titleFa}</div>
        <div style={{ fontSize:12, color:"var(--w-muted)", marginBottom:6, lineHeight:1.5 }}>{p.description}</div>
        {p.rating && (
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            {[1,2,3,4,5].map(i=>(
              <WI key={i} n={i<=Math.round(p.rating||0)?"star-fill":"star"} s={11} style={{ color:"#f59e0b" }}/>
            ))}
            <span style={{ fontSize:10, color:"var(--w-muted)" }}>({FA(p.reviewCount||0)})</span>
          </div>
        )}
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, justifyContent:"center" }}>
        <div style={{ fontSize:16, fontWeight:900, color:"#d97706" }}>{fmtIRT(p.price)}</div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={e=>{e.stopPropagation();onToggleFav();}} style={{ padding:"6px 10px", borderRadius:7, border:"1px solid var(--w-border)", background:"transparent", color:isFav?"#d97706":"var(--w-muted)", cursor:"pointer", display:"flex" }}>
            <WI n="heart" s={14}/>
          </button>
          <button onClick={e=>{e.stopPropagation();onAddCart();}} disabled={inCart}
            style={{ padding:"6px 14px", borderRadius:7, border:"none", background:inCart?"rgba(16,185,129,0.12)":"rgba(217,119,6,0.12)", color:inCart?"#10b981":"#d97706", fontSize:12, fontWeight:700, cursor:inCart?"default":"pointer", fontFamily:"Vazirmatn", display:"flex", alignItems:"center", gap:4 }}>
            <WI n={inCart?"check":"plus"} s={12}/> {inCart?"اضافه شد":"افزودن"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Product Detail ──────────────────────────────────
function ProductDetail({ product:p, onBack, isFav, onToggleFav, onAddCart, inCart, compareList, onToggleCompare }: {
  product:Product; onBack:()=>void; isFav:boolean; onToggleFav:()=>void; onAddCart:()=>void; inCart:boolean;
  compareList?:string[]; onToggleCompare?:()=>void;
}) {
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [offers,setOffers]=useState<any[]>([]);const[frameUrl,setFrameUrl]=useState("");
  useEffect(()=>{(async()=>{const id=Number(p.id);if(!Number.isSafeInteger(id))return;try{const r=await fetch(MARKET_API+"/api/v1/market/products/"+id);if(r.ok){const d=await r.json();setOffers(d.offers??[])}}catch{}})()},[p.id]);
  const openOffer=async(o:any)=>{try{const token=localStorage.getItem("anpardaz:accessToken")??"";const r=await fetch(MARKET_API+"/api/v1/market/clickout",{method:"POST",headers:{authorization:"Bearer "+token,"content-type":"application/json"},body:JSON.stringify({offerId:Number(o.id),surface:"web"})});const d=await r.json();if(!r.ok)throw new Error();if(d.mode==="iframe")setFrameUrl(d.url);else window.open(d.url,"_blank","noopener,noreferrer")}catch{}};
  const [activeTab, setActiveTab] = useState<"description"|"specs"|"reviews">("description");

  const catName = PRODUCT_CATEGORIES.find(c=>c.id===p.category)?.nameFa;
  const discount = p.originalPrice && p.originalPrice > p.price
    ? Math.round((1 - p.price/p.originalPrice)*100) : 0;

  return (
    <div className="w-fade" dir="rtl" style={{ maxWidth:1200, padding:"20px" }}>
      <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontSize:13, fontWeight:600, marginBottom:20 }}>
        <WI n="arrow-right" s={14}/> بازگشت به فروشگاه
      </button>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:24, marginBottom:24 }}>
        {/* Images */}
        <div>
          <div style={{ height:400, borderRadius:16, background:"rgba(217,119,6,0.04)", border:"1px solid var(--w-border)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10, overflow:"hidden" }}>
            {p.images[activeImg] ? (
              <img src={p.images[activeImg]} alt={p.titleFa} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            ) : (
              <WI n="package" s={80} style={{ opacity:0.1 }}/>
            )}
          </div>
          {p.images.length > 1 && (
            <div style={{ display:"flex", gap:8 }}>
              {p.images.map((img, i) => (
                <button key={i} onClick={()=>setActiveImg(i)} style={{ width:70, height:70, borderRadius:10, border:`2px solid ${activeImg===i?"#d97706":"var(--w-border)"}`, overflow:"hidden", background:"transparent", cursor:"pointer", padding:0, flexShrink:0 }}>
                  {img ? <img src={img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <WI n="image" s={20}/>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div style={{ fontSize:12, color:"#d97706", fontWeight:600, marginBottom:6 }}>{catName}</div>
          <h1 style={{ fontSize:22, fontWeight:900, marginBottom:4, lineHeight:1.4 }}>{p.titleFa}</h1>
          <div style={{ fontSize:14, color:"var(--w-muted)", marginBottom:12 }}>{p.title}</div>
          {p.rating && (
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:14 }}>
              {[1,2,3,4,5].map(i=>(
                <WI key={i} n={i<=Math.round(p.rating||0)?"star-fill":"star"} s={16} style={{ color:"#f59e0b" }}/>
              ))}
              <span style={{ fontSize:13, fontWeight:700 }}>{p.rating.toFixed(1)}</span>
              <span style={{ fontSize:12, color:"var(--w-muted)" }}>({FA(p.reviewCount||0)} نظر)</span>
            </div>
          )}

          {/* Price */}
          <div style={{ padding:"16px", background:"var(--w-card2)", borderRadius:12, marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
              <span style={{ fontSize:24, fontWeight:900, color:"#d97706" }}>{fmtIRT(p.price)}</span>
              {discount > 0 && (
                <span style={{ fontSize:12, padding:"3px 8px", borderRadius:6, background:"rgba(239,68,68,0.12)", color:"#ef4444", fontWeight:700 }}>%{FA(discount)} تخفیف</span>
              )}
            </div>
            {p.originalPrice && discount > 0 && (
              <div style={{ fontSize:13, color:"var(--w-muted)", textDecoration:"line-through" }}>{fmtIRT(p.originalPrice)}</div>
            )}
          </div>

          {/* Quantity + Add to cart */}
          <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:4, background:"var(--w-card2)", borderRadius:9, padding:"4px" }}>
              <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{ width:30, height:30, borderRadius:7, border:"none", background:"transparent", cursor:"pointer", color:"var(--w-muted)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>−</button>
              <span style={{ fontSize:14, fontWeight:800, minWidth:28, textAlign:"center" }}>{FA(qty)}</span>
              <button onClick={()=>setQty(q=>q+1)} style={{ width:30, height:30, borderRadius:7, border:"none", background:"transparent", cursor:"pointer", color:"var(--w-muted)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>+</button>
            </div>
            <button onClick={onAddCart} disabled={inCart} className="w-btn w-btn-primary" style={{ flex:1, padding:"12px", fontSize:14, background:inCart?"var(--w-card2)":undefined, color:inCart?"#10b981":undefined }}>
              <WI n={inCart?"check":"package"} s={16}/> {inCart?"در سبد خرید است":"افزودن به سبد"}
            </button>
            <button onClick={onToggleFav} style={{ width:44, height:44, borderRadius:10, border:"1px solid var(--w-border)", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:isFav?"#d97706":"var(--w-muted)" }}>
              <WI n="heart" s={18}/>
            </button>
          </div>

          {/* Attributes */}
          {p.specs && Object.keys(p.specs).length > 0 && (
            <div style={{ padding:"14px", background:"var(--w-card)", border:"1px solid var(--w-border)", borderRadius:10 }}>
              {Object.entries(p.specs).map(([k,v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", fontSize:12, borderBottom:"1px solid var(--w-border)" }}>
                  <span style={{ color:"var(--w-muted)" }}>{k}</span>
                  <span style={{ fontWeight:700 }}>{v as string}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {offers.length>0&&<div className="w-card" style={{padding:"18px",marginBottom:20}}><div style={{fontSize:15,fontWeight:900,marginBottom:12}}>فروشگاه‌ها و قیمت‌های واقعی</div>{offers.map((o:any)=><div key={o.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid var(--w-border)"}}><div style={{flex:1}}><div style={{fontWeight:800}}>{o.store_name??o.seller_name??"فروشگاه"}</div><div style={{fontSize:11,color:"var(--w-muted)",marginTop:3}}>{o.availability}</div></div><div style={{fontWeight:900,color:"#d97706"}}>{fmtIRT(Number(o.price??0))}</div><button onClick={()=>void openOffer(o)} className="w-btn w-btn-primary" style={{padding:"8px 14px"}}>مشاهده و خرید</button></div>)}</div>}{frameUrl&&<div style={{position:"fixed",inset:0,zIndex:1000,background:"#fff",display:"flex",flexDirection:"column"}}><div style={{height:54,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",borderBottom:"1px solid var(--w-border)"}}><b>فروشگاه</b><button onClick={()=>setFrameUrl("")} className="w-btn w-btn-ghost">بستن</button></div><iframe src={frameUrl} title="فروشگاه اینترنتی" style={{flex:1,border:0}} sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"/></div>}

      {/* Tabs */}
      <div className="w-card" style={{ overflow:"hidden" }}>
        <div style={{ display:"flex", borderBottom:"1px solid var(--w-border)" }}>
          {([["description","توضیحات"],["specs","مشخصات"],["reviews","نظرات"]] as const).map(([t,l]) => (
            <button key={t} onClick={()=>setActiveTab(t)} style={{ padding:"14px 24px", border:"none", background:"transparent", borderBottom:`2px solid ${activeTab===t?"#d97706":"transparent"}`, color:activeTab===t?"#d97706":"var(--w-muted)", fontWeight:activeTab===t?700:400, fontSize:14, cursor:"pointer", fontFamily:"Vazirmatn" }}>{l}</button>
          ))}
        </div>
        <div style={{ padding:"20px" }}>
          {activeTab === "description" && (
            <p style={{ fontSize:14, lineHeight:2, color:"var(--w-text)" }}>{p.description}</p>
          )}
          {activeTab === "specs" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>
              {p.specs && Object.entries(p.specs).map(([k,v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", borderBottom:"1px solid var(--w-border)", fontSize:13 }}>
                  <span style={{ color:"var(--w-muted)" }}>{k}</span>
                  <span style={{ fontWeight:700 }}>{v as string}</span>
                </div>
              ))}
            </div>
          )}
          {activeTab === "reviews" && (
            <div>
              {p.reviewCount && p.reviewCount > 0 ? (
                <div style={{ textAlign:"center", padding:"30px", color:"var(--w-muted)" }}>
                  <div style={{ fontSize:48, fontWeight:900, color:"#d97706", marginBottom:4 }}>{p.rating?.toFixed(1)}</div>
                  <div style={{ display:"flex", justifyContent:"center", gap:4, marginBottom:8 }}>
                    {[1,2,3,4,5].map(i=>(
                      <WI key={i} n={i<=Math.round(p.rating||0)?"star-fill":"star"} s={20} style={{ color:"#f59e0b" }}/>
                    ))}
                  </div>
                  <div style={{ fontSize:13 }}>بر اساس {FA(p.reviewCount)} نظر</div>
                </div>
              ) : (
                <div style={{ textAlign:"center", padding:"40px", color:"var(--w-muted)" }}>
                  <div style={{ fontSize:14 }}>هنوز نظری ثبت نشده است</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Compare Bar (floating) ──────────────────────────
function CompareBar({ products, onShow, onRemove }: { products:Product[]; onShow:()=>void; onRemove:(id:string)=>void }) {
  return (
    <div style={{ position:"fixed", bottom:20, right:"50%", transform:"translateX(50%)", background:"var(--w-card)", border:"1px solid var(--w-border)", borderRadius:14, boxShadow:"0 8px 32px rgba(0,0,0,0.2)", padding:"14px 20px", display:"flex", alignItems:"center", gap:16, zIndex:900, direction:"rtl" }}>
      <div style={{ fontSize:13, fontWeight:700, color:"var(--w-muted)" }}>مقایسه:</div>
      {products.map(p=>(
        <div key={p.id} style={{ display:"flex", alignItems:"center", gap:6, background:"var(--w-card2)", borderRadius:8, padding:"6px 10px" }}>
          <span style={{ fontSize:12, fontWeight:700 }}>{p.titleFa}</span>
          <button onClick={()=>onRemove(p.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", lineHeight:1, padding:0, fontSize:14 }}>×</button>
        </div>
      ))}
      <button onClick={onShow} className="w-btn w-btn-primary" style={{ padding:"8px 18px", background:"#d97706", fontSize:12 }}>مقایسه کن</button>
    </div>
  );
}

// ── Compare Popup ───────────────────────────────────
function ComparePopup({ products, onClose }: { products:Product[]; onClose:()=>void }) {
  const KEYS = ["قیمت","امتیاز","دسته‌بندی","گارانتی","ارسال"];
  const getVal = (p:Product, k:string) => {
    if (k==="قیمت") return fmtIRT(p.price);
    if (k==="امتیاز") return p.rating ? `${p.rating.toFixed(1)} ★` : "—";
    if (k==="دسته‌بندی") return PRODUCT_CATEGORIES.find(c=>c.id===p.category)?.nameFa ?? "—";
    if (k==="گارانتی") return "۱۲ ماه";
    if (k==="ارسال") return "رایگان";
    return "—";
  };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", direction:"rtl" }} onClick={onClose}>
      <div className="w-card" style={{ maxWidth:700, width:"90%", padding:"24px", maxHeight:"80vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:900 }}>مقایسه محصولات</div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontSize:20 }}>×</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:`140px ${products.map(()=>"1fr").join(" ")}`, gap:0 }}>
          <div style={{ padding:"10px", fontWeight:700, fontSize:12 }}></div>
          {products.map(p=>(
            <div key={p.id} style={{ padding:"10px", textAlign:"center", fontWeight:800, fontSize:13, background:"rgba(217,119,6,0.06)", borderRadius:8 }}>{p.titleFa}</div>
          ))}
          {KEYS.map((k,ki)=>(
            [
              <div key={`k-${ki}`} style={{ padding:"12px 10px", fontSize:12, color:"var(--w-muted)", borderTop:"1px solid var(--w-border)", fontWeight:600 }}>{k}</div>,
              ...products.map(p=>(
                <div key={`${p.id}-${ki}`} style={{ padding:"12px 10px", textAlign:"center", fontSize:13, fontWeight:700, borderTop:"1px solid var(--w-border)" }}>{getVal(p,k)}</div>
              ))
            ]
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Favorites Section ───────────────────────────────
function FavoritesSection({ favorites, onSelect, onToggleFav, onAddCart, cart }: { favorites:Set<string>; onSelect:(p:Product)=>void; onToggleFav:(id:string)=>void; onAddCart:(id:string)=>void; cart:string[] }) {
  const favProducts = MARKET_PRODUCTS.filter(p=>favorites.has(p.id));
  return (
    <div>
      <div style={{ fontSize:18, fontWeight:900, marginBottom:20 }}>علاقه‌مندی‌ها ({FA(favProducts.length)})</div>
      {favProducts.length === 0 ? (
        <div style={{ textAlign:"center", padding:"80px", color:"var(--w-muted)" }}>
          <WI n="heart" s={40} style={{ opacity:0.2, marginBottom:12 }}/>
          <div style={{ fontSize:14, fontWeight:700 }}>هنوز محصولی ذخیره نکرده‌اید</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))", gap:14 }}>
          {favProducts.map(p=>(
            <ProductCard key={p.id} product={p} isFav onToggleFav={()=>onToggleFav(p.id)} onSelect={()=>onSelect(p)} onAddCart={()=>onAddCart(p.id)} inCart={cart.includes(p.id)}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Orders Section ──────────────────────────────────
function OrdersSection({cart}:{cart:string[]}){const[orders,setOrders]=useState<any[]>([]);useEffect(()=>{(async()=>{const token=localStorage.getItem("anpardaz:accessToken")??"";if(!token)return;try{const r=await fetch(MARKET_API+"/api/v1/market/me/orders",{headers:{authorization:"Bearer "+token}});if(r.ok){const d=await r.json();setOrders(d.orders??[])}}catch{}})()},[]);return <div><div style={{fontSize:18,fontWeight:900,marginBottom:20}}>فعالیت خرید من</div><div className="w-card" style={{overflow:"hidden"}}>{orders.length===0?<div style={{padding:30,color:"var(--w-muted)",textAlign:"center"}}>سفارش ثبت‌شده‌ای در آن مارکت وجود ندارد.</div>:orders.map((o:any,i:number)=><div key={o.id} style={{display:"flex",gap:16,padding:16,borderBottom:i<orders.length-1?"1px solid var(--w-border)":"none"}}><div style={{flex:1}}>محصول #{o.product_id}<div style={{fontSize:11,color:"var(--w-muted)"}}>عملیات {o.operation_id??"—"} · {o.status}</div></div><b>{fmtIRT(Number(o.unit_price??0))}</b></div>)}</div>{cart.length>0&&<div className="w-card" style={{marginTop:16,padding:16}}>{cart.map(id=><div key={id}>{MARKET_PRODUCTS.find(p=>p.id===id)?.titleFa??id}</div>)}</div>}</div>}

function AlertsSection() {
  const [alerts, setAlerts] = useState([
    { id:"a1", product:"لپ‌تاپ Dell XPS 15", targetPrice:35000000, currentPrice:42000000 },
    { id:"a2", product:"iPhone 15 Pro", targetPrice:50000000, currentPrice:48000000, triggered:true },
  ]);
  const [newProduct, setNewProduct] = useState("");
  const [newPrice, setNewPrice] = useState("");
  return (
    <div style={{ maxWidth:640 }}>
      <div style={{ fontSize:18, fontWeight:900, marginBottom:20 }}>هشدار قیمت</div>
      <div className="w-card" style={{ padding:"20px", marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>هشدار جدید</div>
        <div style={{ display:"flex", gap:10 }}>
          <input value={newProduct} onChange={e=>setNewProduct(e.target.value)} placeholder="نام محصول..." className="w-input" style={{ flex:2 }}/>
          <input value={newPrice} onChange={e=>setNewPrice(e.target.value)} placeholder="قیمت هدف (تومان)" inputMode="numeric" className="w-input" style={{ flex:1 }}/>
          <button onClick={()=>{ if(newProduct&&newPrice){setAlerts(a=>[...a,{id:`a${Date.now()}`,product:newProduct,targetPrice:parseInt(newPrice),currentPrice:parseInt(newPrice)*1.2}]);setNewProduct("");setNewPrice("");}}} className="w-btn w-btn-primary" style={{ padding:"10px 18px", background:"#d97706", whiteSpace:"nowrap" }}>افزودن</button>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {alerts.map(a=>(
          <div key={a.id} className="w-card" style={{ padding:"16px", display:"flex", alignItems:"center", gap:14, borderRight:(a as any).triggered?"3px solid #10b981":"3px solid var(--w-border)" }}>
            <div style={{ width:38, height:38, borderRadius:10, background:(a as any).triggered?"rgba(16,185,129,0.1)":"rgba(217,119,6,0.1)", display:"flex", alignItems:"center", justifyContent:"center", color:(a as any).triggered?"#10b981":"#d97706" }}>
              <WI n="bell" s={17}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700 }}>{a.product}</div>
              <div style={{ fontSize:12, color:"var(--w-muted)", marginTop:2 }}>
                قیمت هدف: <strong>{fmtIRT(a.targetPrice)}</strong> · قیمت کنونی: <strong style={{ color:a.currentPrice<=a.targetPrice?"#10b981":"var(--w-text)" }}>{fmtIRT(a.currentPrice)}</strong>
              </div>
              {(a as any).triggered && <div style={{ fontSize:11, color:"#10b981", fontWeight:700, marginTop:3 }}>✓ قیمت به هدف رسید!</div>}
            </div>
            <button onClick={()=>setAlerts(p=>p.filter(x=>x.id!==a.id))} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", padding:"4px" }}><WI n="trash" s={15}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AI Assistant Section ────────────────────────────
function AiSection(){const[msgs,setMsgs]=useState<{role:"assistant"|"user";text:string}[]>([{role:"assistant",text:"سلام! من دستیار هوشمند آن مارکت هستم. سؤال خریدتان را بپرسید."}]);const[input,setInput]=useState("");const[busy,setBusy]=useState(false);const send=async()=>{const q=input.trim();if(!q||busy)return;setInput("");setMsgs(m=>[...m,{role:"user",text:q}]);setBusy(true);try{const token=localStorage.getItem("anpardaz:accessToken")??"";const r=await fetch(MARKET_API+"/api/v1/market/ai/assist",{method:"POST",headers:{authorization:"Bearer "+token,"content-type":"application/json"},body:JSON.stringify({input:q})});const d=await r.json();if(!r.ok)throw new Error();setMsgs(m=>[...m,{role:"assistant",text:d?.result?.text??"پاسخ دریافت نشد."}]);}catch{setMsgs(m=>[...m,{role:"assistant",text:"دستیار هوشمند در حال حاضر در دسترس نیست."}]);}finally{setBusy(false)}};return <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - var(--w-header) - 100px)"}}><div style={{fontSize:18,fontWeight:900,marginBottom:16}}>دستیار هوشمند خرید</div><div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:12}}>{msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-start":"flex-end"}}><div style={{maxWidth:"75%",padding:"12px 16px",borderRadius:12,background:m.role==="user"?"rgba(217,119,6,0.08)":"var(--w-card2)",fontSize:13,lineHeight:1.7}}>{m.text}</div></div>)}</div><div style={{display:"flex",gap:8,paddingTop:12,borderTop:"1px solid var(--w-border)"}}><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void send()}} placeholder="مثلاً برای یک لپ‌تاپ تا ۵۰ میلیون راهنمایی کن..." className="w-input"/><button onClick={()=>void send()} disabled={busy} className="w-btn w-btn-primary" style={{background:"#8b5cf6"}}>ارسال</button></div></div>}

function MarketAccount() {
  return (
    <div style={{ maxWidth:600 }}>
      <div style={{ fontSize:18, fontWeight:900, marginBottom:20 }}>حساب کاربری</div>
      <div className="w-card" style={{ padding:"22px", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:18 }}>
          <div style={{ width:60, height:60, borderRadius:"50%", background:"rgba(217,119,6,0.1)", display:"flex", alignItems:"center", justifyContent:"center", color:"#d97706", fontSize:22, fontWeight:800 }}>م</div>
          <div>
            <div style={{ fontSize:17, fontWeight:900 }}>محمد احمدی</div>
            <div style={{ fontSize:12, color:"var(--w-muted)" }}>mohammadahmadi@email.com</div>
          </div>
          <button className="w-btn w-btn-ghost" style={{ marginRight:"auto", padding:"7px 16px", fontSize:12 }}>ویرایش</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
          {[["سفارش کل","۱۲","#d97706"],["تکمیل شده","۱۰","#10b981"],["در انتظار","۲","#0891b2"]].map(([l,v,c])=>(
            <div key={l as string} style={{ padding:"12px", background:"var(--w-card2)", borderRadius:10, textAlign:"center" }}>
              <div style={{ fontSize:10, color:"var(--w-muted)", marginBottom:5 }}>{l}</div>
              <div style={{ fontSize:20, fontWeight:900, color:c as string }}>{FA(v as string)}</div>
            </div>
          ))}
        </div>
      </div>
      {[{icon:"bell",title:"هشدارهای قیمت",desc:"مدیریت هشدارهای من"},{icon:"map-pin",title:"آدرس‌های ارسال",desc:"مدیریت آدرس‌ها"},{icon:"shield",title:"تغییر رمز عبور",desc:"امنیت حساب"}].map(item=>(
        <div key={item.title} className="w-card" style={{ padding:"14px 18px", marginBottom:10, display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"rgba(217,119,6,0.08)", display:"flex", alignItems:"center", justifyContent:"center", color:"#d97706" }}>
            <WI n={item.icon} s={17}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700 }}>{item.title}</div>
            <div style={{ fontSize:11, color:"var(--w-muted)" }}>{item.desc}</div>
          </div>
          <WI n="arrow-left" s={13} style={{ color:"var(--w-muted)" }}/>
        </div>
      ))}
    </div>
  );
}

// ── Market Tickets ──────────────────────────────────
function MarketTickets(){const[tickets,setTickets]=useState<any[]>([]);const[view,setView]=useState<"list"|"new">("list");const[subject,setSubject]=useState("");const[body,setBody]=useState("");const[busy,setBusy]=useState(false);const load=async()=>{const token=localStorage.getItem("anpardaz:accessToken")??"";if(!token)return;try{const r=await fetch(MARKET_API+"/api/v1/market/me/tickets",{headers:{authorization:"Bearer "+token}});if(r.ok){const d=await r.json();setTickets(d.tickets??[])}}catch{}};useEffect(()=>{void load()},[]);const send=async()=>{if(!subject.trim()||!body.trim())return;setBusy(true);try{const token=localStorage.getItem("anpardaz:accessToken")??"";const r=await fetch(MARKET_API+"/api/v1/market/tickets",{method:"POST",headers:{authorization:"Bearer "+token,"content-type":"application/json"},body:JSON.stringify({subject,message:body})});if(!r.ok)throw new Error();setSubject("");setBody("");setView("list");await load()}catch{}finally{setBusy(false)}};if(view==="new")return <div><button onClick={()=>setView("list")} className="w-btn w-btn-ghost">بازگشت</button><h2>تیکت جدید</h2><div className="w-card" style={{padding:22,display:"flex",flexDirection:"column",gap:14}}><input value={subject} onChange={e=>setSubject(e.target.value)} className="w-input" placeholder="موضوع"/><textarea value={body} onChange={e=>setBody(e.target.value)} rows={6} className="w-input" placeholder="شرح مشکل..."/><button disabled={busy||!subject.trim()||!body.trim()} onClick={()=>void send()} className="w-btn w-btn-primary">ارسال تیکت</button></div></div>;return <div><div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}><div style={{fontSize:18,fontWeight:900}}>پشتیبانی</div><button onClick={()=>setView("new")} className="w-btn w-btn-primary">تیکت جدید +</button></div><div className="w-card">{tickets.length===0?<div style={{padding:30,textAlign:"center",color:"var(--w-muted)"}}>تیکتی ثبت نشده است.</div>:tickets.map((t:any)=><div key={t.id} style={{padding:14,borderBottom:"1px solid var(--w-border)"}}><b>{t.subject}</b><div style={{fontSize:11,color:"var(--w-muted)"}}>#{t.id} · {t.status} · {t.updated_at}</div></div>)}</div></div>}
