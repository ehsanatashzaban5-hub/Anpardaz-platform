// ─────────────────────────────────────────────────
// An Pardaz Web Portal — An Sarraf (Desktop Exchange)
// Full professional exchange: 293 assets, all tabs
// ─────────────────────────────────────────────────
import { useState, useMemo, useCallback } from "react";
import WI from "./WebIcons";
import { CRYPTO_ASSETS } from "./mockData";
import type { WebPage, CryptoAsset, KycStatus } from "./types";
import { useIsMobile } from "./useResponsive";

const FA = (s: string | number) => String(s).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]);
const fmtP = (n: number) => n >= 1 ? n.toLocaleString("en-US", { maximumFractionDigits:2 }) : n.toPrecision(4);
const fmtIrt = (n: number) => {
  if (n >= 1_000_000_000) return `${(n/1_000_000_000).toFixed(2)} میلیارد تومان`;
  if (n >= 1_000_000)     return `${(n/1_000_000).toFixed(0)} میلیون تومان`;
  return `${n.toLocaleString("fa-IR")} تومان`;
};
const fmtVol = (n: number) => {
  if (n >= 1e12) return `$${(n/1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n/1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n/1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
};
const clr = (n: number) => n >= 0 ? "#10b981" : "#f43f5e";

type SarrafTab = "markets"|"trade-select"|"instant"|"spot"|"margin"|"assets"|"deposit"|"deposit-coin"|"withdraw"|"withdraw-coin"|"orders"|"transactions"|"fees"|"security"|"support"|"guide"|"forexbot";

interface SarrafProps {
  onNavigate: (p: WebPage) => void;
  kycStatus: KycStatus;
  onAuthRequired: () => void;
  isLoggedIn: boolean;
}

const TAB_GROUPS = [
  { label:"بازارها",   items:[{ id:"markets" as SarrafTab,        icon:"sarraf",    label:"بازارها" }] },
  { label:"معاملات",   items:[
    { id:"trade-select" as SarrafTab, icon:"swap",      label:"معامله" },
    { id:"forexbot" as SarrafTab,     icon:"cpu",       label:"فارکس بات" },
  ]},
  { label:"حساب",      items:[
    { id:"assets" as SarrafTab,       icon:"wallet",    label:"دارایی‌ها" },
    { id:"deposit" as SarrafTab,      icon:"deposit",   label:"واریز تومان" },
    { id:"deposit-coin" as SarrafTab, icon:"download",  label:"واریز رمزارز" },
    { id:"withdraw" as SarrafTab,     icon:"withdraw",  label:"برداشت تومان" },
    { id:"withdraw-coin" as SarrafTab,icon:"upload",    label:"برداشت رمزارز" },
    { id:"orders" as SarrafTab,       icon:"document",  label:"سفارشات" },
    { id:"transactions" as SarrafTab, icon:"history",   label:"تراکنش‌ها" },
  ]},
  { label:"اطلاعات",   items:[
    { id:"fees" as SarrafTab,         icon:"percent",   label:"کارمزدها" },
    { id:"security" as SarrafTab,     icon:"shield",    label:"امنیت" },
    { id:"guide" as SarrafTab,        icon:"play",      label:"راهنما" },
  ]},
  { label:"پشتیبانی",  items:[
    { id:"support" as SarrafTab,      icon:"comment",   label:"تیکت‌ها" },
  ]},
];

export default function WebSarraf({ onNavigate, kycStatus, onAuthRequired, isLoggedIn }: SarrafProps) {
  const [tab, setTab]               = useState<SarrafTab>("markets");
  const [selectedAsset, setAsset]   = useState<CryptoAsset>(CRYPTO_ASSETS[0]);
  const [search, setSearch]         = useState("");
  const [sortBy, setSortBy]         = useState<"rank"|"price"|"change"|"volume">("rank");
  const [filterFav, setFilterFav]   = useState(false);
  const [favorites, setFavorites]   = useState<Set<string>>(new Set(["btc","eth","sol","bnb","usdt"]));
  const [tradeType, setTradeType]   = useState<"buy"|"sell">("buy");
  const [tradeMode, setTradeMode]   = useState<"market"|"limit"|"stop-limit">("market");
  const [price, setPrice]           = useState("");
  const [amount, setAmount]         = useState("");
  const [coinDetail, setCoinDetail] = useState<CryptoAsset|null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<null|{type:string;amount:string;date:string;status:string;txid:string}>(null);
  const isMobile = useIsMobile(900);

  const filtered = useMemo(() => {
    let list = CRYPTO_ASSETS.filter(a =>
      (!filterFav || favorites.has(a.id)) &&
      (search === "" ||
        a.symbol.toLowerCase().includes(search.toLowerCase()) ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.nameFa.includes(search))
    );
    if (sortBy === "price")   list = [...list].sort((a,b) => b.price - a.price);
    if (sortBy === "change")  list = [...list].sort((a,b) => b.change24h - a.change24h);
    if (sortBy === "volume")  list = [...list].sort((a,b) => b.volume24h - a.volume24h);
    return list;
  }, [search, filterFav, favorites, sortBy]);

  const toggleFav = useCallback((id: string) => {
    setFavorites(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }, []);

  const selectAndTrade = (a: CryptoAsset) => { setAsset(a); setTab("trade-select"); };

  const needsLogin = !isLoggedIn;
  const needsKyc   = isLoggedIn && kycStatus !== "verified";

  const asks = useMemo(() => Array.from({length:12}, (_,i) => ({
    price: selectedAsset.price * (1 + (i+1)*0.0005 + Math.random()*0.0003),
    amount: +(Math.random()*3+0.05).toFixed(4),
    total:  0,
  })), [selectedAsset.id]);
  const bids = useMemo(() => Array.from({length:12}, (_,i) => ({
    price: selectedAsset.price * (1 - (i+1)*0.0005 - Math.random()*0.0003),
    amount: +(Math.random()*3+0.05).toFixed(4),
    total:  0,
  })), [selectedAsset.id]);

  const PROTECTED_TABS: SarrafTab[] = ["assets","deposit","deposit-coin","withdraw","withdraw-coin","orders","transactions","security","forexbot"];
  const PROTECTED = PROTECTED_TABS.includes(tab);

  const navItems = TAB_GROUPS.flatMap(g => g.items);

  const handleTabSelect = (id: SarrafTab) => {
    if (PROTECTED_TABS.includes(id) && needsLogin) {
      onAuthRequired(); return;
    }
    setTab(id);
    setDrawerOpen(false);
  };

  const SidebarContent = () => (
    <>
      {TAB_GROUPS.map(g => (
        <div key={g.label} style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"var(--w-muted)", padding:"0 14px 4px", textTransform:"uppercase", letterSpacing:0.5 }}>{g.label}</div>
          {g.items.map(item => (
            <button key={item.id} onClick={()=>handleTabSelect(item.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:tab===item.id?"rgba(8,145,178,0.1)":"transparent", border:"none", cursor:"pointer", color:tab===item.id?"#0891b2":"var(--w-muted)", fontSize:14, fontWeight:tab===item.id?700:500, borderRight:tab===item.id?"2px solid #0891b2":"2px solid transparent", fontFamily:"Vazirmatn", textAlign:"right", transition:"all 0.12s" }}>
              <WI n={item.icon} s={15}/>{item.label}
            </button>
          ))}
        </div>
      ))}
    </>
  );

  return (
    <div className="w-fade" dir="rtl" style={{ minHeight:"calc(100vh - var(--w-header))", display:"flex", flexDirection:"column" }}>
      {/* Mobile drawer overlay */}
      {isMobile && drawerOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:300, display:"flex" }}>
          <div onClick={()=>setDrawerOpen(false)} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)" }}/>
          <div style={{ position:"relative", width:260, background:"var(--w-surface)", borderLeft:"1px solid var(--w-border)", height:"100%", overflowY:"auto", paddingTop:16, zIndex:1 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 14px 12px", borderBottom:"1px solid var(--w-border)", marginBottom:8 }}>
              <span style={{ fontSize:16, fontWeight:900, color:"#0891b2" }}>آن صراف</span>
              <button onClick={()=>setDrawerOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontSize:20, lineHeight:1 }}>×</button>
            </div>
            <SidebarContent/>
          </div>
        </div>
      )}

      {/* Platform header bar */}
      <div style={{ background:"var(--w-surface)", borderBottom:"1px solid var(--w-border)" }}>
        <div style={{ maxWidth:1480, margin:"0 auto", padding:isMobile?"0 12px":"0 20px", display:"flex", alignItems:"center", gap:isMobile?8:12, height:isMobile?48:52 }}>
          {/* Mobile hamburger */}
          {isMobile && (
            <button onClick={()=>setDrawerOpen(true)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--w-text)", padding:"4px 2px", display:"flex", alignItems:"center" }}>
              <WI n="menu" s={20}/>
            </button>
          )}
          {/* Brand */}
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:"rgba(8,145,178,0.12)", border:"1px solid rgba(8,145,178,0.22)", display:"flex", alignItems:"center", justifyContent:"center", color:"#0891b2" }}>
              <WI n="sarraf" s={14}/>
            </div>
            <span style={{ fontSize:isMobile?14:15, fontWeight:900 }}>آن صراف</span>
          </div>
          {!isMobile && <div style={{ width:1, height:18, background:"var(--w-border)" }}/>}
          {/* Live tickers — hidden on very small mobile */}
          {!isMobile && (
            <div style={{ display:"flex", gap:20, overflow:"hidden" }}>
              {CRYPTO_ASSETS.slice(0,5).map(a => (
                <div key={a.id} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, cursor:"pointer" }} onClick={()=>{setAsset(a);setTab("trade-select");}}>
                  <span style={{ fontWeight:700, color:"var(--w-muted)" }}>{a.symbol}/USDT</span>
                  <span style={{ fontWeight:900 }}>${fmtP(a.price)}</span>
                  <span style={{ color:clr(a.change24h), fontWeight:700, fontSize:11 }}>{a.change24h>0?"+":""}{a.change24h.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          )}
          {isMobile && (
            <div style={{ flex:1, display:"flex", gap:12, overflow:"hidden" }}>
              {CRYPTO_ASSETS.slice(0,2).map(a => (
                <div key={a.id} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, cursor:"pointer", flexShrink:0 }} onClick={()=>{setAsset(a);setTab("trade-select");}}>
                  <span style={{ fontWeight:700, color:"var(--w-muted)" }}>{a.symbol}</span>
                  <span style={{ fontWeight:900 }}>${fmtP(a.price)}</span>
                  <span style={{ color:clr(a.change24h), fontWeight:700, fontSize:10 }}>{a.change24h>0?"+":""}{a.change24h.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginRight:"auto", display:"flex", gap:8, alignItems:"center" }}>
            {!isLoggedIn && (
              <button onClick={onAuthRequired} className="w-btn w-btn-primary" style={{ padding:isMobile?"5px 10px":"6px 16px", fontSize:isMobile?11:12 }}>
                {isMobile ? "ورود" : <><WI n="user" s={13}/> ورود / ثبت‌نام</>}
              </button>
            )}
            {!isMobile && (
              <button onClick={()=>onNavigate("home")} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                <WI n="arrow-right" s={13}/> آن پرداز
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex:1, display:"flex", maxWidth:1480, margin:"0 auto", width:"100%", padding:isMobile?"0":"0 20px", gap:0, paddingBottom:isMobile?64:0 }}>
        {/* Desktop left sidebar — navigation */}
        <aside style={{ width:200, flexShrink:0, borderLeft:"1px solid var(--w-border)", paddingTop:12, position:"sticky", top:"calc(var(--w-header) + 52px)", height:"calc(100vh - var(--w-header) - 52px)", overflowY:"auto", background:"var(--w-surface)" }}>
          <SidebarContent/>
        </aside>

        {/* Main content */}
        <div style={{ flex:1, overflow:"hidden", minWidth:0 }}>
          {/* ── Markets ── */}
          {tab === "markets" && (
            <div style={{ padding:"16px 0" }}>
              {coinDetail ? (
                <CoinDetailView asset={coinDetail} onBack={()=>setCoinDetail(null)} onTrade={()=>{setAsset(coinDetail);setCoinDetail(null);setTab("trade-select");}} isFav={favorites.has(coinDetail.id)} onToggleFav={()=>toggleFav(coinDetail.id)}/>
              ) : (
                <MarketsTab
                  assets={filtered} search={search} onSearch={setSearch}
                  sortBy={sortBy} onSort={setSortBy}
                  filterFav={filterFav} onFilterFav={setFilterFav}
                  favorites={favorites} onToggleFav={toggleFav}
                  onSelectTrade={selectAndTrade}
                  onSelectDetail={setCoinDetail}
                  totalCount={CRYPTO_ASSETS.length}
                />
              )}
            </div>
          )}
          {/* ── Trade Type Selection ── */}
          {tab === "trade-select" && (
            <TradeSelectTab
              asset={selectedAsset}
              onInstant={()=>setTab("instant")}
              onSpot={()=>setTab("spot")}
              onMargin={()=>setTab("margin")}
              isLoggedIn={isLoggedIn}
              onAuth={onAuthRequired}
            />
          )}
          {/* ── Instant Trade ── */}
          {tab === "instant" && (
            <InstantTradeTab asset={selectedAsset} onBack={()=>setTab("trade-select")} isLoggedIn={isLoggedIn} onAuth={onAuthRequired}/>
          )}
          {/* ── Spot Trade ── */}
          {tab === "spot" && (
            <div style={{ display:"flex", gap:0, height:"calc(100vh - var(--w-header) - 52px)" }}>
              <TradeView
                asset={selectedAsset} asks={asks} bids={bids}
                tradeType={tradeType} onTradeType={setTradeType}
                tradeMode={tradeMode} onTradeMode={setTradeMode}
                price={price} onPrice={setPrice}
                amount={amount} onAmount={setAmount}
                isLoggedIn={isLoggedIn} needsKyc={needsKyc}
                onAuth={onAuthRequired}
                onSelectAsset={()=>setTab("markets")}
                assets={CRYPTO_ASSETS.slice(0,20)} onAssetChange={setAsset}
                favorites={favorites} onToggleFav={toggleFav}
                tradeKind="spot"
                onBack={()=>setTab("trade-select")}
              />
            </div>
          )}
          {/* ── Margin Trade ── */}
          {tab === "margin" && (
            <div style={{ display:"flex", gap:0, height:"calc(100vh - var(--w-header) - 52px)" }}>
              <TradeView
                asset={selectedAsset} asks={asks} bids={bids}
                tradeType={tradeType} onTradeType={setTradeType}
                tradeMode={tradeMode} onTradeMode={setTradeMode}
                price={price} onPrice={setPrice}
                amount={amount} onAmount={setAmount}
                isLoggedIn={isLoggedIn} needsKyc={needsKyc}
                onAuth={onAuthRequired}
                onSelectAsset={()=>setTab("markets")}
                assets={CRYPTO_ASSETS.slice(0,20)} onAssetChange={setAsset}
                favorites={favorites} onToggleFav={toggleFav}
                tradeKind="margin"
                onBack={()=>setTab("trade-select")}
              />
            </div>
          )}
          {/* ── Protected tabs gate ── */}
          {PROTECTED && needsLogin && (
            <AuthGate onAuth={onAuthRequired}/>
          )}
          {tab === "assets" && isLoggedIn && (
            <AssetsTab assets={CRYPTO_ASSETS.slice(0,12)} kycStatus={kycStatus} onDeposit={()=>setTab("deposit")} onWithdraw={()=>setTab("withdraw")} onDepositCoin={()=>setTab("deposit-coin")} onWithdrawCoin={()=>setTab("withdraw-coin")}/>
          )}
          {tab === "deposit" && isLoggedIn && (
            <DepositTomanTab kycStatus={kycStatus}/>
          )}
          {tab === "deposit-coin" && isLoggedIn && (
            <DepositCoinTab assets={CRYPTO_ASSETS} kycStatus={kycStatus}/>
          )}
          {tab === "withdraw" && isLoggedIn && (
            <WithdrawTomanTab kycStatus={kycStatus}/>
          )}
          {tab === "withdraw-coin" && isLoggedIn && (
            <WithdrawCoinTab assets={CRYPTO_ASSETS} kycStatus={kycStatus}/>
          )}
          {tab === "orders" && isLoggedIn && (
            <OrdersTab/>
          )}
          {tab === "transactions" && isLoggedIn && (
            selectedTx
              ? <TxDetailView tx={selectedTx} onBack={()=>setSelectedTx(null)}/>
              : <TransactionsTab onSelectTx={setSelectedTx}/>
          )}
          {tab === "fees" && (
            <FeesTab/>
          )}
          {tab === "security" && isLoggedIn && (
            <SecurityTab/>
          )}
          {tab === "support" && (
            <SupportTab isLoggedIn={isLoggedIn} onAuth={onAuthRequired}/>
          )}
          {tab === "guide" && (
            <GuideTab/>
          )}
          {tab === "forexbot" && isLoggedIn && (
            <ForexBotTab asset={selectedAsset}/>
          )}
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      {isMobile && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:200, background:"var(--w-surface)", borderTop:"1px solid var(--w-border)", display:"flex", height:64, alignItems:"stretch" }}>
          {navItems.slice(0,5).map(item => (
            <button key={item.id} onClick={()=>handleTabSelect(item.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, background:"none", border:"none", cursor:"pointer", color:tab===item.id?"#0891b2":"var(--w-muted)", fontFamily:"Vazirmatn", transition:"color 0.12s", padding:"4px 0" }}>
              <WI n={item.icon} s={tab===item.id?22:19}/>
              <span style={{ fontSize:10, fontWeight:tab===item.id?800:500 }}>{item.label}</span>
            </button>
          ))}
          <button onClick={()=>setDrawerOpen(true)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontFamily:"Vazirmatn" }}>
            <WI n="menu" s={19}/>
            <span style={{ fontSize:10, fontWeight:500 }}>بیشتر</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Markets Tab ────────────────────────────────────
function MarketsTab({ assets, search, onSearch, sortBy, onSort, filterFav, onFilterFav, favorites, onToggleFav, onSelectTrade, onSelectDetail, totalCount }: {
  assets: CryptoAsset[]; search: string; onSearch:(s:string)=>void;
  sortBy: "rank"|"price"|"change"|"volume"; onSort:(s:any)=>void;
  filterFav:boolean; onFilterFav:(b:boolean)=>void;
  favorites:Set<string>; onToggleFav:(id:string)=>void;
  onSelectTrade:(a:CryptoAsset)=>void; onSelectDetail:(a:CryptoAsset)=>void;
  totalCount: number;
}) {
  const isMob = useIsMobile(900);
  return (
    <div>
      {/* Controls bar */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:isMob?"0 0 10px":"0 0 12px", flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:1, minWidth:isMob?120:200, maxWidth:isMob?undefined:320 }}>
          <WI n="search" s={14} style={{ position:"absolute", right:11, top:"50%", transform:"translateY(-50%)", color:"var(--w-muted)", pointerEvents:"none" }}/>
          <input value={search} onChange={e=>onSearch(e.target.value)} placeholder={`جستجو در ${FA(totalCount)} ارز...`} className="w-input" style={{ paddingRight:34 }}/>
        </div>
        <button onClick={()=>onFilterFav(!filterFav)}
          style={{ display:"flex", alignItems:"center", gap:5, padding:isMob?"7px 10px":"8px 14px", borderRadius:8, border:`1px solid ${filterFav?"rgba(251,191,36,0.5)":"var(--w-border)"}`, background:filterFav?"rgba(251,191,36,0.08)":"transparent", color:filterFav?"#f59e0b":"var(--w-muted)", fontSize:12, fontWeight:600, cursor:"pointer" }}>
          <WI n="star" s={13}/> {isMob?"":"علاقه‌مندی‌ها"}
        </button>
        {(["rank","change","volume"] as const).map(s=>(
          <button key={s} onClick={()=>onSort(s)}
            style={{ padding:isMob?"7px 10px":"8px 14px", borderRadius:8, border:`1px solid ${sortBy===s?"rgba(8,145,178,0.4)":"var(--w-border)"}`, background:sortBy===s?"rgba(8,145,178,0.08)":"transparent", color:sortBy===s?"#0891b2":"var(--w-muted)", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            {s==="rank"?"رتبه":s==="change"?"تغییر":"حجم"}
          </button>
        ))}
        {!isMob && <div style={{ fontSize:12, color:"var(--w-muted)", marginRight:"auto" }}>{FA(assets.length)} از {FA(totalCount)} ارز</div>}
      </div>

      {/* Desktop Table */}
      {!isMob && (
        <div style={{ background:"var(--w-card)", border:"1px solid var(--w-border)", borderRadius:12, overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:"40px 1fr 130px 110px 90px 110px 110px 80px", padding:"10px 14px", background:"var(--w-card2)", borderBottom:"1px solid var(--w-border)", fontSize:11, color:"var(--w-muted)", fontWeight:600, gap:8 }}>
            <div>#</div><div>ارز</div><div style={{textAlign:"left"}}>قیمت (USDT)</div>
            <div style={{textAlign:"left"}}>قیمت (تومان)</div><div style={{textAlign:"center"}}>تغییر ۲۴ه</div>
            <div style={{textAlign:"left"}}>حجم ۲۴ه</div><div style={{textAlign:"left"}}>مارکت کپ</div><div style={{textAlign:"center"}}>عملیات</div>
          </div>
          <div style={{ maxHeight:"calc(100vh - var(--w-header) - 200px)", overflowY:"auto" }}>
            {assets.map((a) => (
              <div key={a.id} style={{ display:"grid", gridTemplateColumns:"40px 1fr 130px 110px 90px 110px 110px 80px", padding:"10px 14px", borderBottom:"1px solid var(--w-border)", alignItems:"center", gap:8, cursor:"pointer", transition:"background 0.1s" }}
                onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background="var(--w-hover)"}
                onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background="transparent"}
                onClick={()=>onSelectDetail(a)}
              >
                <div style={{ fontSize:12, color:"var(--w-muted)", display:"flex", alignItems:"center", gap:4 }}>
                  <button onClick={e=>{e.stopPropagation();onToggleFav(a.id);}} style={{ background:"none", border:"none", cursor:"pointer", color:favorites.has(a.id)?"#f59e0b":"var(--w-border)", padding:0, display:"flex" }}>
                    <WI n="star" s={12}/>
                  </button>
                  {FA(a.rank)}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", background:a.logoColor, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:9, fontWeight:900, flexShrink:0 }}>{a.symbol.slice(0,3)}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700 }}>{a.nameFa}</div>
                    <div style={{ fontSize:10, color:"var(--w-muted)" }}>{a.symbol}</div>
                  </div>
                </div>
                <div style={{ fontSize:13, fontWeight:700, fontVariantNumeric:"tabular-nums" }}>${fmtP(a.price)}</div>
                <div style={{ fontSize:11, color:"var(--w-muted)", fontVariantNumeric:"tabular-nums" }}>{FA(Math.round(a.priceIrt/1000).toLocaleString())} ه</div>
                <div style={{ textAlign:"center" }}>
                  <span style={{ fontSize:12, fontWeight:700, color:clr(a.change24h), background:a.change24h>=0?"rgba(16,185,129,0.08)":"rgba(244,63,94,0.08)", padding:"2px 7px", borderRadius:5 }}>
                    {a.change24h>0?"+":""}{a.change24h.toFixed(2)}%
                  </span>
                </div>
                <div style={{ fontSize:11, color:"var(--w-muted)", fontVariantNumeric:"tabular-nums" }}>{fmtVol(a.volume24h)}</div>
                <div style={{ fontSize:11, color:"var(--w-muted)", fontVariantNumeric:"tabular-nums" }}>{fmtVol(a.marketCap)}</div>
                <div style={{ display:"flex", justifyContent:"center" }}>
                  <button onClick={e=>{e.stopPropagation();onSelectTrade(a);}} className="w-btn w-btn-muted" style={{ padding:"4px 12px", fontSize:11, borderRadius:6 }}>معامله</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile card list */}
      {isMob && (
        <div style={{ display:"flex", flexDirection:"column", gap:1, background:"var(--w-card)", border:"1px solid var(--w-border)", borderRadius:12, overflow:"hidden" }}>
          {/* Mobile header */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto auto", padding:"8px 12px", background:"var(--w-card2)", fontSize:10, color:"var(--w-muted)", fontWeight:700, gap:8 }}>
            <div>ارز</div><div style={{textAlign:"left"}}>قیمت</div><div style={{textAlign:"center"}}>تغییر</div>
          </div>
          <div style={{ maxHeight:"calc(100vh - var(--w-header) - 160px)", overflowY:"auto" }}>
            {assets.map((a) => (
              <div key={a.id} style={{ display:"grid", gridTemplateColumns:"1fr auto auto", padding:"11px 12px", borderBottom:"1px solid var(--w-border)", alignItems:"center", gap:8, cursor:"pointer", transition:"background 0.1s" }}
                onClick={()=>onSelectDetail(a)}
              >
                <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                  <div style={{ width:34, height:34, borderRadius:"50%", background:a.logoColor, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:9, fontWeight:900, flexShrink:0 }}>{a.symbol.slice(0,3)}</div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"var(--w-text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{a.nameFa}</div>
                    <div style={{ fontSize:10, color:"var(--w-muted)" }}>{a.symbol}</div>
                  </div>
                </div>
                <div style={{ textAlign:"left" }}>
                  <div style={{ fontSize:13, fontWeight:800, fontVariantNumeric:"tabular-nums" }}>${fmtP(a.price)}</div>
                  <div style={{ fontSize:10, color:"var(--w-muted)" }}>{FA(Math.round(a.priceIrt/1000).toLocaleString())}ه ت</div>
                </div>
                <div style={{ textAlign:"center", minWidth:56 }}>
                  <span style={{ fontSize:11, fontWeight:800, color:clr(a.change24h), background:a.change24h>=0?"rgba(16,185,129,0.1)":"rgba(244,63,94,0.1)", padding:"3px 7px", borderRadius:6, display:"block" }}>
                    {a.change24h>0?"+":""}{a.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Coin Detail ────────────────────────────────────
function CoinDetailView({ asset:a, onBack, onTrade, isFav, onToggleFav }: { asset:CryptoAsset; onBack:()=>void; onTrade:()=>void; isFav:boolean; onToggleFav:()=>void; }) {
  const isMob = useIsMobile(900);
  return (
    <div className="w-fade" style={{ padding:isMob?"12px":undefined }}>
      <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontSize:13, fontWeight:600, marginBottom:16 }}>
        <WI n="arrow-right" s={14}/> بازگشت به بازارها
      </button>
      <div style={{ display:"grid", gridTemplateColumns:isMob?"1fr":"1fr 320px", gap:16 }}>
        <div>
          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
            <div style={{ width:52, height:52, borderRadius:"50%", background:a.logoColor, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:16, fontWeight:900 }}>{a.symbol.slice(0,3)}</div>
            <div>
              <h1 style={{ fontSize:22, fontWeight:900, margin:0 }}>{a.nameFa} <span style={{ fontSize:14, color:"var(--w-muted)", fontWeight:500 }}>({a.symbol})</span></h1>
              <div style={{ display:"flex", gap:10, marginTop:4, alignItems:"center" }}>
                <span style={{ fontSize:20, fontWeight:900 }}>${fmtP(a.price)}</span>
                <span style={{ fontSize:14, fontWeight:700, color:clr(a.change24h) }}>{a.change24h>0?"+":""}{a.change24h.toFixed(2)}%</span>
              </div>
            </div>
            <div style={{ marginRight:"auto", display:"flex", gap:8 }}>
              <button onClick={onToggleFav} className="w-btn w-btn-ghost" style={{ padding:"8px 14px", color:isFav?"#f59e0b":"var(--w-muted)" }}>
                <WI n="star" s={14}/> {isFav ? "حذف از علاقه‌مندی" : "افزودن به علاقه‌مندی"}
              </button>
              <button onClick={onTrade} className="w-btn w-btn-primary" style={{ padding:"9px 20px" }}>
                <WI n="swap" s={14}/> معامله
              </button>
            </div>
          </div>
          {/* Chart placeholder */}
          <div style={{ height:340, background:"var(--w-card)", border:"1px solid var(--w-border)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8, marginBottom:16, position:"relative", overflow:"hidden" }}>
            <svg viewBox="0 0 400 120" style={{ position:"absolute", bottom:0, left:0, width:"100%", opacity:0.6 }}>
              <defs>
                <linearGradient id={`cg${a.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0891b2" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#0891b2" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d="M0,80 L30,70 L60,75 L90,50 L120,55 L150,35 L180,40 L210,25 L240,30 L270,15 L300,20 L330,10 L360,18 L400,8 L400,120 L0,120Z" fill={`url(#cg${a.id})`}/>
              <path d="M0,80 L30,70 L60,75 L90,50 L120,55 L150,35 L180,40 L210,25 L240,30 L270,15 L300,20 L330,10 L360,18 L400,8" fill="none" stroke="#0891b2" strokeWidth="2"/>
            </svg>
            <div style={{ zIndex:1, textAlign:"center", color:"var(--w-muted)", fontSize:13 }}>
              <WI n="bar-chart" s={28} style={{ marginBottom:4, opacity:0.3 }}/>
              <div>نمودار قیمت — اتصال به API</div>
            </div>
          </div>
        </div>
        {/* Stats */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div className="w-card" style={{ padding:"18px" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--w-muted)", marginBottom:12 }}>آمار بازار</div>
            {[
              ["رتبه بازار", `#${FA(a.rank)}`],
              ["بالاترین ۲۴ه", `$${fmtP(a.high24h)}`],
              ["پایین‌ترین ۲۴ه", `$${fmtP(a.low24h)}`],
              ["حجم ۲۴ه", fmtVol(a.volume24h)],
              ["مارکت کپ", fmtVol(a.marketCap)],
              ["قیمت تومان", fmtIrt(a.priceIrt)],
            ].map(([k,v]) => (
              <div key={k as string} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid var(--w-border)", fontSize:13 }}>
                <span style={{ color:"var(--w-muted)" }}>{k}</span>
                <span style={{ fontWeight:700 }}>{v}</span>
              </div>
            ))}
          </div>
          <div className="w-card" style={{ padding:"16px" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--w-muted)", marginBottom:10 }}>قیمت در شبکه‌ها</div>
            {["TRC20","ERC20","BEP20"].map(net => (
              <div key={net} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", fontSize:12, borderBottom:"1px solid var(--w-border)" }}>
                <span style={{ color:"var(--w-muted)" }}>{net}</span>
                <span style={{ fontWeight:700 }}>${fmtP(a.price*(1+Math.random()*0.001))}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Trade View ─────────────────────────────────────
function TradeView({ asset, asks, bids, tradeType, onTradeType, tradeMode, onTradeMode, price, onPrice, amount, onAmount, isLoggedIn, needsKyc, onAuth, onSelectAsset, assets, onAssetChange, favorites, onToggleFav, tradeKind = "spot", onBack }: {
  asset: CryptoAsset; asks: any[]; bids: any[];
  tradeType:"buy"|"sell"; onTradeType:(t:"buy"|"sell")=>void;
  tradeMode:"market"|"limit"|"stop-limit"; onTradeMode:(m:any)=>void;
  price:string; onPrice:(s:string)=>void;
  amount:string; onAmount:(s:string)=>void;
  isLoggedIn:boolean; needsKyc:boolean; onAuth:()=>void;
  onSelectAsset:()=>void;
  assets: CryptoAsset[]; onAssetChange:(a:CryptoAsset)=>void;
  favorites: Set<string>; onToggleFav:(id:string)=>void;
  tradeKind?: "spot"|"margin";
  onBack?: ()=>void;
}) {
  const [leverage, setLeverage] = useState(1);
  const maxAsk = Math.max(...asks.map(a=>a.price));
  const minBid = Math.min(...bids.map(b=>b.price));
  const estimatedTotal = tradeMode==="market" ? asset.price*(parseFloat(amount)||0) : (parseFloat(price)||0)*(parseFloat(amount)||0);
  const isMob = useIsMobile(900);

  return (
    <div style={{ display:"flex", flex:1, gap:0, height:isMob?"auto":"100%", overflow:isMob?"visible":"hidden", flexDirection:isMob?"column":"row" }}>
      {/* Asset sidebar — hidden on mobile */}
      <div style={{ width:200, borderLeft:"1px solid var(--w-border)", borderRight:"1px solid var(--w-border)", display:isMob?"none":"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"10px 8px", borderBottom:"1px solid var(--w-border)" }}>
          <input placeholder="جستجو..." className="w-input" style={{ fontSize:11, padding:"6px 10px" }}/>
        </div>
        <div style={{ flex:1, overflowY:"auto" }}>
          {assets.map(a => (
            <div key={a.id} onClick={()=>onAssetChange(a)} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px", cursor:"pointer", background:asset.id===a.id?"rgba(8,145,178,0.08)":"transparent", borderBottom:"1px solid var(--w-border)", transition:"background 0.1s" }}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:a.logoColor, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:8, fontWeight:900, flexShrink:0 }}>{a.symbol.slice(0,2)}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:700, color:asset.id===a.id?"#0891b2":"var(--w-text)" }}>{a.symbol}/USDT</div>
                <div style={{ fontSize:10, color:"var(--w-muted)" }}>${fmtP(a.price)}</div>
              </div>
              <span style={{ fontSize:10, color:clr(a.change24h), fontWeight:700 }}>{a.change24h>0?"+":""}{a.change24h.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart + order book */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:isMob?"visible":"hidden" }}>
        {/* Asset header */}
        <div style={{ padding:isMob?"10px 12px":"12px 16px", borderBottom:"1px solid var(--w-border)", display:"flex", alignItems:"center", gap:isMob?10:14, flexWrap:isMob?"wrap":"nowrap" }}>
          {onBack && (
            <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", display:"flex", alignItems:"center", gap:4, fontSize:12, fontWeight:600 }}>
              <WI n="arrow-right" s={13}/> {tradeKind==="margin"?"تعهدی":"اسپات"}
            </button>
          )}
          <div style={{ width:36, height:36, borderRadius:"50%", background:asset.logoColor, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:11, fontWeight:900, flexShrink:0 }}>{asset.symbol.slice(0,3)}</div>
          <div>
            <div style={{ fontSize:14, fontWeight:900 }}>{asset.symbol}/USDT</div>
            <div style={{ fontSize:10, color:"var(--w-muted)" }}>{asset.nameFa}</div>
          </div>
          <div style={{ fontSize:isMob?18:22, fontWeight:900 }}>${fmtP(asset.price)}</div>
          <span style={{ fontSize:13, fontWeight:700, color:clr(asset.change24h) }}>{asset.change24h>0?"+":""}{asset.change24h.toFixed(2)}%</span>
          {!isMob && [["بالا","high24h"],["پایین","low24h"],["حجم","volume24h"]].map(([l,k]) => (
            <div key={k} style={{ marginRight:8 }}>
              <div style={{ fontSize:10, color:"var(--w-muted)" }}>{l} ۲۴ه</div>
              <div style={{ fontSize:11, fontWeight:700 }}>{k==="volume24h"?fmtVol((asset as any)[k]):`$${fmtP((asset as any)[k])}`}</div>
            </div>
          ))}
        </div>
        {/* Chart */}
        <div style={{ height:260, background:"var(--w-card)", borderBottom:"1px solid var(--w-border)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
          <svg viewBox="0 0 600 180" style={{ position:"absolute", bottom:0, left:0, width:"100%", height:"100%" }}>
            <defs>
              <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0891b2" stopOpacity="0.2"/>
                <stop offset="100%" stopColor="#0891b2" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d="M0,140 L40,130 L80,135 L120,100 L160,90 L200,70 L240,75 L280,55 L320,50 L360,35 L400,30 L440,20 L480,25 L520,15 L560,10 L600,5 L600,180 L0,180Z" fill="url(#chartFill)"/>
            <path d="M0,140 L40,130 L80,135 L120,100 L160,90 L200,70 L240,75 L280,55 L320,50 L360,35 L400,30 L440,20 L480,25 L520,15 L560,10 L600,5" fill="none" stroke="#0891b2" strokeWidth="1.5"/>
          </svg>
          <div style={{ position:"absolute", bottom:4, left:8, display:"flex", gap:4 }}>
            {["۱ه","۴ه","۱ر","۱ه","۱هف","۱م"].map(tf=>(
              <button key={tf} style={{ padding:"2px 8px", borderRadius:4, border:"none", background:"rgba(8,145,178,0.1)", color:"#0891b2", fontSize:10, fontWeight:700, cursor:"pointer" }}>{tf}</button>
            ))}
          </div>
        </div>
        {/* Order Book */}
        <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 1fr", overflowY:"auto", gap:0 }}>
          {/* Asks */}
          <div style={{ borderLeft:"1px solid var(--w-border)" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", padding:"6px 10px", background:"var(--w-card2)", fontSize:10, color:"var(--w-muted)", fontWeight:600 }}>
              <span>قیمت (USDT)</span><span style={{textAlign:"center"}}>مقدار</span><span style={{textAlign:"left"}}>جمع</span>
            </div>
            {asks.map((ask,i) => (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", padding:"4px 10px", fontSize:11, borderBottom:"1px solid var(--w-border)", position:"relative" }}>
                <div style={{ position:"absolute", left:0, top:0, bottom:0, width:`${Math.min(100, ask.amount*20)}%`, background:"rgba(244,63,94,0.06)", zIndex:0 }}/>
                <span style={{ color:"#f43f5e", fontWeight:700, zIndex:1 }}>{fmtP(ask.price)}</span>
                <span style={{ textAlign:"center", color:"var(--w-muted)", zIndex:1 }}>{ask.amount.toFixed(4)}</span>
                <span style={{ textAlign:"left", color:"var(--w-muted)", zIndex:1 }}>{(ask.price*ask.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
          {/* Bids */}
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", padding:"6px 10px", background:"var(--w-card2)", fontSize:10, color:"var(--w-muted)", fontWeight:600 }}>
              <span>قیمت (USDT)</span><span style={{textAlign:"center"}}>مقدار</span><span style={{textAlign:"left"}}>جمع</span>
            </div>
            {bids.map((bid,i) => (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", padding:"4px 10px", fontSize:11, borderBottom:"1px solid var(--w-border)", position:"relative" }}>
                <div style={{ position:"absolute", left:0, top:0, bottom:0, width:`${Math.min(100, bid.amount*20)}%`, background:"rgba(16,185,129,0.06)", zIndex:0 }}/>
                <span style={{ color:"#10b981", fontWeight:700, zIndex:1 }}>{fmtP(bid.price)}</span>
                <span style={{ textAlign:"center", color:"var(--w-muted)", zIndex:1 }}>{bid.amount.toFixed(4)}</span>
                <span style={{ textAlign:"left", color:"var(--w-muted)", zIndex:1 }}>{(bid.price*bid.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order form */}
      <div style={{ width:isMob?"100%":280, borderRight:isMob?"none":"1px solid var(--w-border)", borderTop:isMob?"1px solid var(--w-border)":"none", display:"flex", flexDirection:"column", overflowY:"auto" }}>
        <div style={{ padding:"14px 14px 0" }}>
          {/* Buy/Sell toggle */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", background:"var(--w-card2)", borderRadius:9, padding:3, marginBottom:12 }}>
            <button onClick={()=>onTradeType("buy")} style={{ padding:"8px", borderRadius:7, border:"none", background:tradeType==="buy"?"#10b981":"transparent", color:tradeType==="buy"?"#fff":"var(--w-muted)", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"Vazirmatn", transition:"all 0.14s" }}>خرید</button>
            <button onClick={()=>onTradeType("sell")} style={{ padding:"8px", borderRadius:7, border:"none", background:tradeType==="sell"?"#f43f5e":"transparent", color:tradeType==="sell"?"#fff":"var(--w-muted)", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"Vazirmatn", transition:"all 0.14s" }}>فروش</button>
          </div>
          {/* Mode tabs */}
          <div style={{ display:"flex", gap:4, marginBottom:14 }}>
            {(["market","limit","stop-limit"] as const).map(m=>(
              <button key={m} onClick={()=>onTradeMode(m)} style={{ flex:1, padding:"5px 4px", borderRadius:6, border:"none", background:tradeMode===m?"var(--w-card)":"transparent", color:tradeMode===m?"var(--w-text)":"var(--w-muted)", fontWeight:tradeMode===m?700:400, fontSize:11, cursor:"pointer", fontFamily:"Vazirmatn", boxShadow:tradeMode===m?"var(--w-shadow)":"none" }}>
                {m==="market"?"بازار":m==="limit"?"لیمیت":"استاپ"}
              </button>
            ))}
          </div>
          {/* Balance */}
          {isLoggedIn && (
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--w-muted)", marginBottom:12 }}>
              <span>موجودی:</span>
              <span style={{ fontWeight:700 }}>{tradeType==="buy"?"0.00 USDT":`0.00 ${asset.symbol}`}</span>
            </div>
          )}
          {/* Price input (for limit) */}
          {tradeMode !== "market" && (
            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:11, color:"var(--w-muted)", display:"block", marginBottom:4, fontWeight:600 }}>قیمت (USDT)</label>
              <div style={{ position:"relative" }}>
                <input value={price} onChange={e=>onPrice(e.target.value)} placeholder={fmtP(asset.price)} className="w-input" style={{ paddingLeft:40 }} inputMode="decimal"/>
                <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:11, color:"var(--w-muted)", fontWeight:700 }}>USDT</span>
              </div>
            </div>
          )}
          {/* Amount input */}
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:11, color:"var(--w-muted)", display:"block", marginBottom:4, fontWeight:600 }}>مقدار ({asset.symbol})</label>
            <div style={{ position:"relative" }}>
              <input value={amount} onChange={e=>onAmount(e.target.value)} placeholder="0.00" className="w-input" style={{ paddingLeft:40 }} inputMode="decimal"/>
              <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:11, color:"var(--w-muted)", fontWeight:700 }}>{asset.symbol}</span>
            </div>
          </div>
          {/* Percent buttons */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:4, marginBottom:12 }}>
            {["25%","50%","75%","100%"].map(p=>(
              <button key={p} onClick={()=>onAmount(String(((parseFloat(p)/100)*(tradeType==="buy"?1000:0.5)).toFixed(4)))} style={{ padding:"5px", borderRadius:6, border:"1px solid var(--w-border)", background:"transparent", color:"var(--w-muted)", fontSize:11, cursor:"pointer", fontFamily:"Vazirmatn", transition:"all 0.1s" }}
                onMouseEnter={e=>(e.currentTarget.style.borderColor="var(--w-accent)")}
                onMouseLeave={e=>(e.currentTarget.style.borderColor="var(--w-border)")}
              >{p}</button>
            ))}
          </div>
          {/* Margin leverage slider */}
          {tradeKind === "margin" && (
            <div style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <label style={{ fontSize:11, color:"var(--w-muted)", fontWeight:600 }}>اهرم (Leverage)</label>
                <span style={{ fontSize:14, fontWeight:900, color:"#f59e0b" }}>×{FA(leverage)}</span>
              </div>
              <input type="range" min={1} max={10} value={leverage} onChange={e=>setLeverage(+e.target.value)}
                style={{ width:"100%", accentColor:"#f59e0b" }}
              />
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--w-muted)", marginTop:3 }}>
                <span>×۱</span><span>×۵</span><span>×۱۰</span>
              </div>
              <div style={{ marginTop:8, padding:"8px 10px", background:"rgba(245,158,11,0.08)", borderRadius:8, fontSize:11, color:"#d97706" }}>
                قیمت تسویه: <strong>${fmtP(tradeType==="buy" ? asset.price*(1-0.9/leverage) : asset.price*(1+0.9/leverage))}</strong>
              </div>
            </div>
          )}
          {/* Total */}
          <div style={{ padding:"10px 12px", background:"var(--w-card2)", borderRadius:9, marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
              <span style={{ color:"var(--w-muted)" }}>جمع کل</span>
              <span style={{ fontWeight:700 }}>{estimatedTotal>0?`$${estimatedTotal.toFixed(2)}`:"—"}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginTop:4 }}>
              <span style={{ color:"var(--w-muted)" }}>کارمزد (۰.۱%)</span>
              <span style={{ color:"var(--w-muted)" }}>{estimatedTotal>0?`$${(estimatedTotal*0.001).toFixed(4)}`:"—"}</span>
            </div>
          </div>
          {/* CTA */}
          {!isLoggedIn ? (
            <button onClick={onAuth} className="w-btn w-btn-primary" style={{ width:"100%", padding:"12px", fontSize:14, background:tradeType==="buy"?"#10b981":"#f43f5e" }}>
              <WI n="lock" s={15}/> ورود برای معامله
            </button>
          ) : needsKyc ? (
            <button className="w-btn w-btn-primary" style={{ width:"100%", padding:"12px", fontSize:13, background:"#d97706" }}>
              <WI n="shield" s={15}/> تأیید هویت برای معامله
            </button>
          ) : (
            <button className="w-btn w-btn-primary" style={{ width:"100%", padding:"12px", fontSize:14, background:tradeType==="buy"?"#10b981":"#f43f5e" }}>
              {tradeType==="buy"?`خرید ${asset.symbol}`:`فروش ${asset.symbol}`}
            </button>
          )}
        </div>
        {/* Recent trades */}
        <div style={{ padding:"14px", borderTop:"1px solid var(--w-border)", marginTop:"auto" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", marginBottom:8 }}>آخرین معاملات</div>
          {Array.from({length:8},(_,i)=>{
            const side = Math.random()>0.5?"buy":"sell";
            return (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", fontSize:10, padding:"3px 0", borderBottom:"1px solid var(--w-border)", color:"var(--w-muted)" }}>
                <span style={{ color:side==="buy"?"#10b981":"#f43f5e" }}>{fmtP(asset.price*(1+(Math.random()-0.5)*0.002))}</span>
                <span style={{ textAlign:"center" }}>{(Math.random()*2+0.01).toFixed(4)}</span>
                <span style={{ textAlign:"left" }}>{`${Math.floor(Math.random()*59)+1}ث`}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Auth Gate ──────────────────────────────────────
function AuthGate({ onAuth }: { onAuth:()=>void }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 24px", textAlign:"center" }}>
      <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(8,145,178,0.1)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16, color:"#0891b2" }}>
        <WI n="lock" s={28}/>
      </div>
      <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>برای ادامه وارد شوید</div>
      <div style={{ fontSize:13, color:"var(--w-muted)", marginBottom:24 }}>این بخش نیاز به احراز هویت دارد</div>
      <button onClick={onAuth} className="w-btn w-btn-primary" style={{ padding:"12px 32px", fontSize:14 }}>
        ورود / ثبت‌نام
      </button>
    </div>
  );
}

// ── Assets Tab ─────────────────────────────────────
function AssetsTab({ assets, kycStatus, onDeposit, onWithdraw, onDepositCoin, onWithdrawCoin }: { assets:CryptoAsset[]; kycStatus:KycStatus; onDeposit:()=>void; onWithdraw:()=>void; onDepositCoin:()=>void; onWithdrawCoin:()=>void; }) {
  const portfolioValue = assets.reduce((sum,a) => sum + a.price * (Math.random()*0.5), 0);
  return (
    <div style={{ padding:"20px 0" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
        {[
          { label:"ارزش کل پورتفولیو", value:`$${portfolioValue.toFixed(2)}`, icon:"wallet", color:"#0891b2" },
          { label:"تغییر امروز", value:"+$124.50", icon:"trending-up", color:"#10b981" },
          { label:"سود/زیان کل", value:"+$2,840", icon:"bar-chart", color:"#7c3aed" },
        ].map(c => (
          <div key={c.label} className="w-card" style={{ padding:"18px" }}>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <div style={{ width:40, height:40, borderRadius:11, background:`${c.color}15`, display:"flex", alignItems:"center", justifyContent:"center", color:c.color }}>
                <WI n={c.icon} s={20}/>
              </div>
              <div>
                <div style={{ fontSize:11, color:"var(--w-muted)" }}>{c.label}</div>
                <div style={{ fontSize:18, fontWeight:900, marginTop:2 }}>{c.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="w-card" style={{ overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", borderBottom:"1px solid var(--w-border)" }}>
          <div style={{ fontSize:14, fontWeight:800 }}>دارایی‌های من</div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={onDeposit} className="w-btn w-btn-primary" style={{ padding:"7px 16px", fontSize:12 }}><WI n="deposit" s={13}/> واریز تومان</button>
            <button onClick={onDepositCoin} className="w-btn w-btn-ghost" style={{ padding:"7px 16px", fontSize:12 }}><WI n="download" s={13}/> واریز رمزارز</button>
            <button onClick={onWithdraw} className="w-btn w-btn-ghost" style={{ padding:"7px 16px", fontSize:12 }}><WI n="withdraw" s={13}/> برداشت تومان</button>
            <button onClick={onWithdrawCoin} className="w-btn w-btn-ghost" style={{ padding:"7px 16px", fontSize:12 }}><WI n="upload" s={13}/> برداشت رمزارز</button>
          </div>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ background:"var(--w-card2)", fontSize:11 }}>
              {["ارز","موجودی","ارزش (USDT)","تغییر ۲۴ه","قیمت","عملیات"].map(h=>(
                <th key={h} style={{ padding:"10px 14px", textAlign:"right", color:"var(--w-muted)", fontWeight:600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map(a => {
              const bal = parseFloat((Math.random()*2).toFixed(6));
              return (
                <tr key={a.id} style={{ borderBottom:"1px solid var(--w-border)" }}>
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", background:a.logoColor, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:9, fontWeight:900 }}>{a.symbol.slice(0,3)}</div>
                      <div>
                        <div style={{ fontWeight:700 }}>{a.symbol}</div>
                        <div style={{ fontSize:10, color:"var(--w-muted)" }}>{a.nameFa}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"12px 14px", fontWeight:700 }}>{bal.toFixed(4)}</td>
                  <td style={{ padding:"12px 14px" }}>${(bal*a.price).toFixed(2)}</td>
                  <td style={{ padding:"12px 14px" }}><span style={{ color:clr(a.change24h), fontWeight:700 }}>{a.change24h>0?"+":""}{a.change24h.toFixed(2)}%</span></td>
                  <td style={{ padding:"12px 14px", color:"var(--w-muted)" }}>${fmtP(a.price)}</td>
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button className="w-btn w-btn-muted" style={{ padding:"3px 10px", fontSize:11, borderRadius:5 }}>معامله</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── KYC Gate ───────────────────────────────────────
function KycGate({ kycStatus }: { kycStatus:KycStatus }) {
  return (
    <div style={{ textAlign:"center", padding:"60px 24px" }}>
      <div style={{ width:60, height:60, borderRadius:"50%", background:"rgba(217,119,6,0.1)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", color:"#d97706" }}><WI n="shield" s={26}/></div>
      <div style={{ fontSize:17, fontWeight:800, marginBottom:8 }}>احراز هویت الزامی</div>
      <div style={{ fontSize:13, color:"var(--w-muted)", marginBottom:24 }}>برای واریز و برداشت، ابتدا هویت خود را تأیید کنید.</div>
      {kycStatus==="not_verified" && <button className="w-btn w-btn-primary" style={{ padding:"11px 28px" }}>شروع احراز هویت</button>}
      {(kycStatus==="submitted"||kycStatus==="pending") && <div style={{ padding:"11px 28px", background:"rgba(217,119,6,0.1)", color:"#d97706", borderRadius:9, fontSize:13, fontWeight:700 }}>در حال بررسی...</div>}
    </div>
  );
}

// ── Deposit Toman Tab ──────────────────────────────
function DepositTomanTab({ kycStatus }: { kycStatus:KycStatus }) {
  const [method, setMethod] = useState<"card"|"bank">("card");
  if (kycStatus !== "verified") return <KycGate kycStatus={kycStatus}/>;
  return (
    <div style={{ maxWidth:560, padding:"24px 0" }}>
      <h2 style={{ fontSize:18, fontWeight:900, marginBottom:20 }}>واریز تومان</h2>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
        {[{ id:"card", label:"کارت بانکی (شاپرک)", icon:"credit-card", desc:"واریز آنی تا ۵۰ میلیون تومان" },
          { id:"bank", label:"انتقال بانکی (پایا/ساتنا)", icon:"deposit", desc:"واریز تا ۵۰۰ میلیون تومان" }
        ].map(m => (
          <button key={m.id} onClick={()=>setMethod(m.id as any)} className="w-card" style={{ padding:"18px", textAlign:"right", border:`2px solid ${method===m.id?"rgba(8,145,178,0.5)":"var(--w-border)"}`, background:method===m.id?"rgba(8,145,178,0.05)":"var(--w-card)", cursor:"pointer" }}>
            <div style={{ fontSize:24, marginBottom:8 }}><WI n={m.icon} s={24} style={{ color:"#0891b2" }}/></div>
            <div style={{ fontSize:13, fontWeight:800, marginBottom:4 }}>{m.label}</div>
            <div style={{ fontSize:11, color:"var(--w-muted)" }}>{m.desc}</div>
          </button>
        ))}
      </div>
      {method === "card" && (
        <div className="w-card" style={{ padding:"22px" }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>واریز با کارت بانکی</div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", display:"block", marginBottom:5 }}>مبلغ (تومان)</label>
            <input className="w-input" placeholder="مثال: ۵,۰۰۰,۰۰۰" inputMode="numeric"/>
          </div>
          <div style={{ padding:"10px 12px", background:"var(--w-card2)", borderRadius:8, fontSize:12, color:"var(--w-muted)", marginBottom:14 }}>
            کارت‌های عضو شبکه شتاب قابل استفاده هستند. سقف تراکنش روزانه: ۵۰ میلیون تومان
          </div>
          <button className="w-btn w-btn-primary" style={{ width:"100%", padding:"12px" }}>انتقال به درگاه پرداخت</button>
        </div>
      )}
      {method === "bank" && (
        <div className="w-card" style={{ padding:"22px" }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>اطلاعات حساب بانکی</div>
          {[["شماره حساب","6219861034567890"],["شماره شبا","IR120570028080010840901200"]].map(([l,v])=>(
            <div key={l} style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:"var(--w-muted)", marginBottom:4 }}>{l}</div>
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"var(--w-card2)", border:"1px solid var(--w-border)", borderRadius:8, padding:"10px 14px" }}>
                <span style={{ flex:1, fontFamily:"monospace", fontSize:13, letterSpacing:1 }}>{v}</span>
                <button style={{ background:"none", border:"none", cursor:"pointer", color:"#0891b2", fontSize:11, fontWeight:700 }}><WI n="copy" s={12}/> کپی</button>
              </div>
            </div>
          ))}
          <div style={{ padding:"10px 12px", background:"rgba(8,145,178,0.07)", borderRadius:8, fontSize:12, color:"#0891b2", marginTop:8 }}>
            در توضیحات انتقال، شناسه کاربری خود را ذکر کنید. واریز پایا ۲-۳ ساعت کاری اعمال می‌شود.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Deposit Coin Tab ───────────────────────────────
function DepositCoinTab({ assets, kycStatus }: { assets:CryptoAsset[]; kycStatus:KycStatus }) {
  const [selAsset, setSelAsset] = useState(assets[0]);
  const [network, setNetwork] = useState<"TRC20"|"ERC20"|"BEP20"|"BTC"|"SOL">("TRC20");
  const [searchCoin, setSearchCoin] = useState("");
  if (kycStatus !== "verified") return <KycGate kycStatus={kycStatus}/>;
  const ADDR: Record<string,string> = { TRC20:"TXqz8fR2mQAYn12r4Yp8HktZL42QvWmT9P", ERC20:"0x71C7656EC7ab88b098defB751B7401B5f6d8976F", BEP20:"bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2", BTC:"bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", SOL:"7KqpRwzkB7zRJpNLbRthXm6kHcDLFXPQ3JZvyCoMGxkV" };
  const NETS: Record<string,string[]> = { BTC:["BTC"], ETH:["ERC20"], BNB:["BEP20"], SOL:["SOL"], USDT:["TRC20","ERC20","BEP20"], USDC:["ERC20","BEP20"], default:["TRC20","ERC20","BEP20"] };
  const nets = NETS[selAsset.symbol] || NETS.default;
  const filtered = assets.filter(a => a.symbol.includes(searchCoin.toUpperCase()) || a.nameFa.includes(searchCoin)).slice(0,30);
  return (
    <div style={{ display:"flex", gap:20, padding:"24px 0", alignItems:"flex-start" }}>
      <div style={{ width:220, flexShrink:0 }}>
        <div style={{ fontSize:14, fontWeight:800, marginBottom:10 }}>انتخاب رمزارز</div>
        <input value={searchCoin} onChange={e=>setSearchCoin(e.target.value)} placeholder="جستجو..." className="w-input" style={{ marginBottom:8, fontSize:12 }}/>
        <div style={{ background:"var(--w-card)", border:"1px solid var(--w-border)", borderRadius:10, overflow:"hidden", maxHeight:360, overflowY:"auto" }}>
          {filtered.map(a => (
            <div key={a.id} onClick={()=>{setSelAsset(a);const ns=NETS[a.symbol]||NETS.default;setNetwork(ns[0] as any);}} style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 12px", cursor:"pointer", background:selAsset.id===a.id?"rgba(8,145,178,0.08)":"transparent", borderBottom:"1px solid var(--w-border)", transition:"background 0.1s" }}>
              <div style={{ width:24, height:24, borderRadius:"50%", background:a.logoColor, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:8, fontWeight:900, flexShrink:0 }}>{a.symbol.slice(0,3)}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700 }}>{a.symbol}</div>
                <div style={{ fontSize:10, color:"var(--w-muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.nameFa}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex:1, maxWidth:560 }}>
        <h2 style={{ fontSize:17, fontWeight:900, marginBottom:16 }}>واریز {selAsset.symbol}</h2>
        <div className="w-card" style={{ padding:"22px" }}>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:700, color:"var(--w-muted)", display:"block", marginBottom:8 }}>شبکه</label>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {nets.map((n:string)=>(
                <button key={n} onClick={()=>setNetwork(n as any)} style={{ padding:"7px 16px", borderRadius:8, border:`1.5px solid ${network===n?"rgba(8,145,178,0.5)":"var(--w-border)"}`, background:network===n?"rgba(8,145,178,0.08)":"transparent", color:network===n?"#0891b2":"var(--w-muted)", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"Vazirmatn" }}>{n}</button>
              ))}
            </div>
          </div>
          <div style={{ display:"flex", gap:20, marginBottom:16, alignItems:"flex-start" }}>
            <div style={{ width:120, height:120, borderRadius:12, background:"var(--w-card2)", border:"1px solid var(--w-border)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <WI n="qr-code" s={44} style={{ opacity:0.25 }}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", marginBottom:6 }}>آدرس واریز ({network})</div>
              <div style={{ background:"var(--w-card2)", border:"1px solid var(--w-border)", borderRadius:9, padding:"11px", fontSize:11, wordBreak:"break-all", fontFamily:"monospace", letterSpacing:0.3 }}>{ADDR[network] || ADDR.TRC20}</div>
              <button className="w-btn w-btn-ghost" style={{ marginTop:8, padding:"6px 12px", fontSize:11 }}><WI n="copy" s={12}/> کپی آدرس</button>
            </div>
          </div>
          <div style={{ padding:"11px 14px", background:"rgba(217,119,6,0.07)", border:"1px solid rgba(217,119,6,0.18)", borderRadius:9, fontSize:12, color:"#d97706", lineHeight:1.7 }}>
            فقط {selAsset.symbol} را روی شبکه {network} ارسال کنید. ارسال توکن‌های دیگر موجب از دست رفتن دارایی می‌شود.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Withdraw Toman Tab ─────────────────────────────
function WithdrawTomanTab({ kycStatus }: { kycStatus:KycStatus }) {
  const [amount, setAmount] = useState("");
  const [card, setCard] = useState("");
  if (kycStatus !== "verified") return <KycGate kycStatus={kycStatus}/>;
  return (
    <div style={{ maxWidth:520, padding:"24px 0" }}>
      <h2 style={{ fontSize:18, fontWeight:900, marginBottom:20 }}>برداشت تومان</h2>
      <div className="w-card" style={{ padding:"22px" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", display:"block", marginBottom:5 }}>شماره کارت مقصد</label>
            <input value={card} onChange={e=>setCard(e.target.value)} placeholder="۱۶ رقم شماره کارت" className="w-input" maxLength={16} inputMode="numeric" style={{ fontFamily:"monospace", letterSpacing:2 }}/>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", display:"block", marginBottom:5 }}>مبلغ (تومان)</label>
            <div style={{ position:"relative" }}>
              <input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="حداقل ۱۰۰,۰۰۰ تومان" className="w-input" inputMode="numeric"/>
            </div>
          </div>
          <div style={{ padding:"10px 12px", background:"var(--w-card2)", borderRadius:9, fontSize:12 }}>
            {[["موجودی قابل برداشت","۳,۲۵۰,۰۰۰ تومان"],["کارمزد برداشت","رایگان"],["زمان واریز","فوری (ساعات اداری)"]].map(([k,v])=>(
              <div key={k as string} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ color:"var(--w-muted)" }}>{k}</span><span style={{ fontWeight:700 }}>{v}</span>
              </div>
            ))}
          </div>
          <button disabled={!card||!amount} className="w-btn w-btn-primary" style={{ padding:"12px", opacity:card&&amount?1:0.5 }}>
            <WI n="withdraw" s={15}/> درخواست برداشت تومان
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Withdraw Coin Tab ──────────────────────────────
function WithdrawCoinTab({ assets, kycStatus }: { assets:CryptoAsset[]; kycStatus:KycStatus }) {
  const [selAsset, setSelAsset] = useState(assets[0]);
  const [network, setNetwork] = useState<string>("TRC20");
  const [address, setAddress] = useState("");
  const [wAmount, setWAmount] = useState("");
  const [step, setStep] = useState<"form"|"otp"|"done">("form");
  const [otp, setOtp] = useState("");
  const [searchCoin, setSearchCoin] = useState("");
  if (kycStatus !== "verified") return <KycGate kycStatus={kycStatus}/>;
  const NETS: Record<string,string[]> = { BTC:["BTC"], ETH:["ERC20"], BNB:["BEP20"], SOL:["SOL"], USDT:["TRC20","ERC20","BEP20"], default:["TRC20","ERC20","BEP20"] };
  const nets = NETS[selAsset.symbol] || NETS.default;
  const feeMap: Record<string,string> = { TRC20:"1 USDT", ERC20:"5 USDT", BEP20:"0.5 USDT", BTC:"0.0001 BTC", SOL:"0.01 SOL" };
  const filtered = assets.filter(a => a.symbol.includes(searchCoin.toUpperCase()) || a.nameFa.includes(searchCoin)).slice(0,30);
  if (step === "done") return (
    <div style={{ textAlign:"center", padding:"60px 24px" }}>
      <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(16,185,129,0.12)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", color:"#10b981" }}><WI n="check" s={30}/></div>
      <div style={{ fontSize:18, fontWeight:900, marginBottom:8 }}>درخواست ثبت شد</div>
      <div style={{ fontSize:13, color:"var(--w-muted)", marginBottom:24 }}>برداشت {wAmount} {selAsset.symbol} در صف پردازش قرار گرفت.</div>
      <button onClick={()=>{setStep("form");setAddress("");setWAmount("");setOtp("");}} className="w-btn w-btn-ghost">برداشت جدید</button>
    </div>
  );
  if (step === "otp") return (
    <div style={{ maxWidth:400, padding:"40px 0", margin:"0 auto" }}>
      <div className="w-card" style={{ padding:"28px", textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>📱</div>
        <div style={{ fontSize:16, fontWeight:900, marginBottom:8 }}>تأیید دو مرحله‌ای</div>
        <div style={{ fontSize:12, color:"var(--w-muted)", marginBottom:20 }}>کد ۶ رقمی ارسال شده به شماره موبایل خود را وارد کنید</div>
        <input value={otp} onChange={e=>setOtp(e.target.value)} maxLength={6} className="w-input" style={{ textAlign:"center", fontSize:24, letterSpacing:8, fontFamily:"monospace" }} inputMode="numeric" placeholder="------"/>
        <div style={{ display:"flex", gap:8, marginTop:16 }}>
          <button onClick={()=>setStep("form")} className="w-btn w-btn-ghost" style={{ flex:1 }}>بازگشت</button>
          <button onClick={()=>setStep("done")} disabled={otp.length!==6} className="w-btn w-btn-primary" style={{ flex:1, opacity:otp.length===6?1:0.5 }}>تأیید</button>
        </div>
      </div>
    </div>
  );
  return (
    <div style={{ display:"flex", gap:20, padding:"24px 0", alignItems:"flex-start" }}>
      <div style={{ width:220, flexShrink:0 }}>
        <div style={{ fontSize:14, fontWeight:800, marginBottom:10 }}>انتخاب رمزارز</div>
        <input value={searchCoin} onChange={e=>setSearchCoin(e.target.value)} placeholder="جستجو..." className="w-input" style={{ marginBottom:8, fontSize:12 }}/>
        <div style={{ background:"var(--w-card)", border:"1px solid var(--w-border)", borderRadius:10, overflow:"hidden", maxHeight:360, overflowY:"auto" }}>
          {filtered.map(a => (
            <div key={a.id} onClick={()=>{setSelAsset(a);const ns=NETS[a.symbol]||NETS.default;setNetwork(ns[0]);}} style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 12px", cursor:"pointer", background:selAsset.id===a.id?"rgba(8,145,178,0.08)":"transparent", borderBottom:"1px solid var(--w-border)" }}>
              <div style={{ width:24, height:24, borderRadius:"50%", background:a.logoColor, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:8, fontWeight:900, flexShrink:0 }}>{a.symbol.slice(0,3)}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700 }}>{a.symbol}</div>
                <div style={{ fontSize:10, color:"var(--w-muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.nameFa}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex:1, maxWidth:520 }}>
        <h2 style={{ fontSize:17, fontWeight:900, marginBottom:16 }}>برداشت {selAsset.symbol}</h2>
        <div className="w-card" style={{ padding:"22px" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", display:"block", marginBottom:8 }}>شبکه</label>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {nets.map((n:string)=>(
                  <button key={n} onClick={()=>setNetwork(n)} style={{ padding:"7px 16px", borderRadius:8, border:`1.5px solid ${network===n?"rgba(8,145,178,0.5)":"var(--w-border)"}`, background:network===n?"rgba(8,145,178,0.08)":"transparent", color:network===n?"#0891b2":"var(--w-muted)", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"Vazirmatn" }}>{n}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", display:"block", marginBottom:5 }}>آدرس مقصد</label>
              <input value={address} onChange={e=>setAddress(e.target.value)} placeholder={`آدرس ${selAsset.symbol} روی ${network}`} className="w-input" style={{ fontFamily:"monospace", fontSize:12 }}/>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", display:"block", marginBottom:5 }}>مقدار ({selAsset.symbol})</label>
              <div style={{ position:"relative" }}>
                <input value={wAmount} onChange={e=>setWAmount(e.target.value)} placeholder="0.00" className="w-input" style={{ paddingLeft:50 }} inputMode="decimal"/>
                <button onClick={()=>setWAmount("0.5")} style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", fontSize:11, fontWeight:700, color:"#0891b2", background:"none", border:"none", cursor:"pointer" }}>MAX</button>
              </div>
            </div>
            <div style={{ padding:"10px 12px", background:"var(--w-card2)", borderRadius:9, fontSize:12 }}>
              {[["کارمزد شبکه",feeMap[network]||"—"],["دریافتی",wAmount?`${Math.max(0,parseFloat(wAmount)-0.001).toFixed(4)} ${selAsset.symbol}`:"—"]].map(([k,v])=>(
                <div key={k as string} style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <span style={{ color:"var(--w-muted)" }}>{k}</span><span style={{ fontWeight:700 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ padding:"10px 12px", background:"rgba(220,38,38,0.06)", borderRadius:9, fontSize:11, color:"#dc2626" }}>
              آدرس را با دقت بررسی کنید. تراکنش‌های ارز دیجیتال برگشت‌پذیر نیستند.
            </div>
            <button disabled={!address||!wAmount} onClick={()=>setStep("otp")} className="w-btn w-btn-primary" style={{ padding:"12px", opacity:address&&wAmount?1:0.5 }}>
              <WI n="withdraw" s={15}/> ادامه و تأیید
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Orders Tab ─────────────────────────────────────
function OrdersTab() {
  const [activeTab, setActiveTab] = useState<"open"|"history">("open");
  return (
    <div style={{ padding:"20px 0" }}>
      <div style={{ display:"flex", gap:12, marginBottom:16 }}>
        {(["open","history"] as const).map(t => (
          <button key={t} onClick={()=>setActiveTab(t)} style={{ padding:"8px 20px", borderRadius:8, border:`1px solid ${activeTab===t?"rgba(8,145,178,0.4)":"var(--w-border)"}`, background:activeTab===t?"rgba(8,145,178,0.08)":"transparent", color:activeTab===t?"#0891b2":"var(--w-muted)", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"Vazirmatn" }}>
            {t==="open"?"سفارشات باز":"تاریخچه سفارشات"}
          </button>
        ))}
      </div>
      <div className="w-card" style={{ padding:"60px", textAlign:"center", color:"var(--w-muted)" }}>
        <WI n="document" s={40} style={{ opacity:0.2, marginBottom:12 }}/>
        <div style={{ fontSize:14, fontWeight:700 }}>{activeTab==="open"?"سفارش باز وجود ندارد":"تاریخچه‌ای یافت نشد"}</div>
        <div style={{ fontSize:12, marginTop:4 }}>سفارشات خود را از بخش معاملات ثبت کنید</div>
      </div>
    </div>
  );
}

// ── Transactions Tab ───────────────────────────────
function TransactionsTab({ onSelectTx }: { onSelectTx:(tx:any)=>void }) {
  const [txType, setTxType] = useState("all");
  const TXNS = [
    { type:"خرید", amount:"+0.0321 BTC", date:"۱۴۰۳/۰۸/۲۲", status:"موفق", txid:"abc1234...9ef0", color:"#10b981" },
    { type:"فروش", amount:"-1.5 ETH", date:"۱۴۰۳/۰۸/۲۰", status:"موفق", txid:"def5678...1ab2", color:"#f43f5e" },
    { type:"واریز", amount:"+50,000,000 ت", date:"۱۴۰۳/۰۸/۱۸", status:"موفق", txid:"paya-00012345", color:"#0891b2" },
    { type:"برداشت", amount:"-200 USDT", date:"۱۴۰۳/۰۸/۱۶", status:"در انتظار", txid:"trc20xyz...abc", color:"#d97706" },
    { type:"خرید", amount:"+500 USDT", date:"۱۴۰۳/۰۸/۱۵", status:"موفق", txid:"bsc3456...7def", color:"#10b981" },
    { type:"واریز", amount:"+0.05 BTC", date:"۱۴۰۳/۰۸/۱۲", status:"موفق", txid:"btcnet...xyz", color:"#0891b2" },
    { type:"فروش", amount:"-100 SOL", date:"۱۴۰۳/۰۸/۱۰", status:"موفق", txid:"solana...pqr", color:"#f43f5e" },
    { type:"برداشت", amount:"-20,000,000 ت", date:"۱۴۰۳/۰۸/۰۸", status:"موفق", txid:"card-00098765", color:"#d97706" },
  ];
  const filtered = txType === "all" ? TXNS : TXNS.filter(t => t.type === txType);
  return (
    <div style={{ padding:"20px 0" }}>
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {["all","خرید","فروش","واریز","برداشت"].map(t=>(
          <button key={t} onClick={()=>setTxType(t)} style={{ padding:"7px 16px", borderRadius:8, border:`1px solid ${txType===t?"rgba(8,145,178,0.4)":"var(--w-border)"}`, background:txType===t?"rgba(8,145,178,0.08)":"transparent", color:txType===t?"#0891b2":"var(--w-muted)", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"Vazirmatn" }}>
            {t==="all"?"همه":t}
          </button>
        ))}
        <button style={{ marginRight:"auto", background:"none", border:"1px solid var(--w-border)", borderRadius:8, padding:"7px 14px", fontSize:12, cursor:"pointer", color:"var(--w-muted)", fontFamily:"Vazirmatn" }}>
          <WI n="download" s={12}/> خروجی اکسل
        </button>
      </div>
      <div className="w-card" style={{ overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ background:"var(--w-card2)" }}>
              {["نوع","مقدار","تاریخ","وضعیت","شناسه","جزئیات"].map(h=>(
                <th key={h} style={{ padding:"10px 14px", textAlign:"right", color:"var(--w-muted)", fontWeight:600, fontSize:11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx,i)=>(
              <tr key={i} style={{ borderBottom:"1px solid var(--w-border)", cursor:"pointer", transition:"background 0.1s" }}
                onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background="var(--w-hover)"}
                onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background="transparent"}
              >
                <td style={{ padding:"12px 14px" }}>
                  <span style={{ padding:"3px 10px", borderRadius:6, background:`${tx.color}15`, color:tx.color, fontSize:12, fontWeight:700 }}>{tx.type}</span>
                </td>
                <td style={{ padding:"12px 14px", fontWeight:800, color:tx.color }}>{tx.amount}</td>
                <td style={{ padding:"12px 14px", color:"var(--w-muted)", fontSize:12 }}>{tx.date}</td>
                <td style={{ padding:"12px 14px" }}>
                  <span style={{ padding:"2px 8px", borderRadius:5, background:tx.status==="موفق"?"rgba(16,185,129,0.1)":"rgba(217,119,6,0.1)", color:tx.status==="موفق"?"#10b981":"#d97706", fontSize:11, fontWeight:700 }}>{tx.status}</span>
                </td>
                <td style={{ padding:"12px 14px", fontSize:11, color:"var(--w-muted)", fontFamily:"monospace" }}>{tx.txid}</td>
                <td style={{ padding:"12px 14px" }}>
                  <button onClick={()=>onSelectTx(tx)} className="w-btn w-btn-muted" style={{ padding:"4px 12px", fontSize:11, borderRadius:6 }}>مشاهده</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Transaction Detail View ────────────────────────
function TxDetailView({ tx, onBack }: { tx:any; onBack:()=>void }) {
  return (
    <div style={{ padding:"24px 0", maxWidth:500 }}>
      <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontSize:13, fontWeight:600, marginBottom:20 }}>
        <WI n="arrow-right" s={14}/> بازگشت به تراکنش‌ها
      </button>
      <div className="w-card" style={{ padding:"28px" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:`${tx.color}15`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", color:tx.color }}>
            <WI n={tx.type==="خرید"?"trending-up":tx.type==="فروش"?"trending-down":tx.type==="واریز"?"deposit":"withdraw"} s={28}/>
          </div>
          <div style={{ fontSize:22, fontWeight:900, color:tx.color }}>{tx.amount}</div>
          <div style={{ fontSize:13, color:"var(--w-muted)", marginTop:4 }}>{tx.type} — {tx.date}</div>
        </div>
        {[["وضعیت",tx.status],["شناسه تراکنش",tx.txid],["کارمزد","—"],["زمان ثبت",tx.date]].map(([k,v])=>(
          <div key={k as string} style={{ display:"flex", justifyContent:"space-between", padding:"12px 0", borderBottom:"1px solid var(--w-border)", fontSize:13 }}>
            <span style={{ color:"var(--w-muted)" }}>{k}</span>
            <span style={{ fontWeight:700, fontFamily:k==="شناسه تراکنش"?"monospace":undefined }}>{v}</span>
          </div>
        ))}
        <div style={{ display:"flex", gap:8, marginTop:20 }}>
          <button className="w-btn w-btn-ghost" style={{ flex:1, padding:"10px" }}><WI n="copy" s={14}/> کپی رسید</button>
          <button className="w-btn w-btn-ghost" style={{ flex:1, padding:"10px" }}><WI n="download" s={14}/> دانلود PDF</button>
        </div>
      </div>
    </div>
  );
}

// ── Fees Tab ───────────────────────────────────────
function FeesTab() {
  const tiers = [
    { label:"عادی",    vol:"کمتر از ۵۰۰ دلار",   maker:"۰.۱۵٪",  taker:"۰.۱۸٪" },
    { label:"VIP 1",   vol:"۵۰۰ تا ۵۰۰۰",       maker:"۰.۱۲٪",  taker:"۰.۱۵٪" },
    { label:"VIP 2",   vol:"۵۰۰۰ تا ۵۰۰۰۰",     maker:"۰.۱۰٪",  taker:"۰.۱۲٪" },
    { label:"VIP 3",   vol:"۵۰۰۰۰ تا ۵۰۰۰۰۰",   maker:"۰.۰۸٪",  taker:"۰.۱۰٪" },
    { label:"Market Maker",vol:"+۵۰۰,۰۰۰",       maker:"۰.۰۰٪",  taker:"۰.۰۵٪" },
  ];
  return (
    <div style={{ padding:"24px 0" }}>
      <div style={{ fontSize:18, fontWeight:900, marginBottom:20 }}>جدول کارمزدها</div>
      <div className="w-card" style={{ overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ background:"var(--w-card2)" }}>
              {["سطح","حجم ۳۰ روزه (USDT)","کارمزد Maker","کارمزد Taker"].map(h=>(
                <th key={h} style={{ padding:"12px 16px", textAlign:"right", color:"var(--w-muted)", fontWeight:600, fontSize:11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tiers.map((t,i) => (
              <tr key={i} style={{ borderBottom:"1px solid var(--w-border)", background:i===0?"rgba(8,145,178,0.04)":"transparent" }}>
                <td style={{ padding:"12px 16px", fontWeight:700 }}>{t.label}{i===0&&<span style={{ fontSize:10, marginRight:6, background:"rgba(8,145,178,0.1)", color:"#0891b2", padding:"2px 6px", borderRadius:4 }}>سطح شما</span>}</td>
                <td style={{ padding:"12px 16px" }}>{t.vol}</td>
                <td style={{ padding:"12px 16px", color:"#10b981", fontWeight:700 }}>{t.maker}</td>
                <td style={{ padding:"12px 16px", color:"#f43f5e", fontWeight:700 }}>{t.taker}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Security Tab ───────────────────────────────────
function SecurityTab() {
  return (
    <div style={{ padding:"24px 0", maxWidth:580 }}>
      <div style={{ fontSize:18, fontWeight:900, marginBottom:20 }}>امنیت حساب</div>
      {[
        { title:"تأیید دو مرحله‌ای (۲FA)", desc:"با Google Authenticator یا پیامک امنیت حساب را بالا ببرید", status:"فعال نشده", color:"#f43f5e", icon:"shield" },
        { title:"ضد فیشینگ", desc:"یک کد شخصی انتخاب کنید که در همه ایمیل‌های آن صراف نمایش داده شود", status:"تنظیم نشده", color:"#d97706", icon:"lock" },
        { title:"مدیریت دستگاه‌ها", desc:"مشاهده و مدیریت دستگاه‌هایی که وارد حساب شما شده‌اند", status:"۱ دستگاه", color:"#059669", icon:"device" },
      ].map(item => (
        <div key={item.title} className="w-card" style={{ padding:"18px", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:11, background:`${item.color}15`, display:"flex", alignItems:"center", justifyContent:"center", color:item.color }}>
              <WI n={item.icon} s={20}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700 }}>{item.title}</div>
              <div style={{ fontSize:11, color:"var(--w-muted)", marginTop:2 }}>{item.desc}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:11, color:item.color, fontWeight:700 }}>{item.status}</span>
              <button className="w-btn w-btn-ghost" style={{ padding:"6px 14px", fontSize:12 }}>تنظیم</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Trade Select Tab ───────────────────────────────
function TradeSelectTab({ asset, onInstant, onSpot, onMargin, isLoggedIn, onAuth }: {
  asset: CryptoAsset; onInstant:()=>void; onSpot:()=>void; onMargin:()=>void;
  isLoggedIn:boolean; onAuth:()=>void;
}) {
  const cards = [
    { id:"instant", label:"خرید/فروش لحظه‌ای", sublabel:"لحظه‌ای", icon:"swap", color:"#059669", desc:"خرید یا فروش آنی با قیمت بازار. ساده‌ترین روش معامله.", badge:"پیشنهادی", onClick: isLoggedIn ? onInstant : onAuth },
    { id:"spot", label:"معامله اسپات", sublabel:"اسپات", icon:"bar-chart", color:"#0891b2", desc:"معامله با دفتر سفارشات کامل. بازار، لیمیت و استاپ-لیمیت.", badge:"حرفه‌ای", onClick: onSpot },
    { id:"margin", label:"معامله تعهدی", sublabel:"مارجین", icon:"trending-up", color:"#7c3aed", desc:"معامله با اهرم تا ×۱۰. امکان Long و Short با استفاده از وام.", badge:"ریسک بالا", onClick: isLoggedIn ? onMargin : onAuth },
  ];
  return (
    <div style={{ padding:"32px 0" }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:900, marginBottom:6 }}>انتخاب نوع معامله</div>
        <div style={{ fontSize:13, color:"var(--w-muted)" }}>جفت ارز انتخاب شده: <strong style={{ color:"var(--w-text)" }}>{asset.symbol}/USDT</strong> — قیمت فعلی: <strong>${fmtP(asset.price)}</strong></div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
        {cards.map(c => (
          <button key={c.id} onClick={c.onClick} className="w-card" style={{ padding:"28px 22px", textAlign:"right", cursor:"pointer", border:`2px solid transparent`, transition:"all 0.18s" }}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.border=`2px solid ${c.color}40`;(e.currentTarget as HTMLButtonElement).style.background=`${c.color}06`;}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.border="2px solid transparent";(e.currentTarget as HTMLButtonElement).style.background="var(--w-card)";}}
          >
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
              <div style={{ width:52, height:52, borderRadius:15, background:`${c.color}15`, display:"flex", alignItems:"center", justifyContent:"center", color:c.color }}>
                <WI n={c.icon} s={26}/>
              </div>
              <span style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20, background:`${c.color}15`, color:c.color }}>{c.badge}</span>
            </div>
            <div style={{ fontSize:17, fontWeight:900, marginBottom:6 }}>{c.label}</div>
            <div style={{ fontSize:12, color:"var(--w-muted)", lineHeight:1.6, marginBottom:20 }}>{c.desc}</div>
            <div style={{ display:"flex", alignItems:"center", gap:6, color:c.color, fontSize:13, fontWeight:700 }}>
              ورود به {c.sublabel} <WI n="arrow-left" s={14}/>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Instant Trade Tab ──────────────────────────────
function InstantTradeTab({ asset, onBack, isLoggedIn, onAuth }: { asset:CryptoAsset; onBack:()=>void; isLoggedIn:boolean; onAuth:()=>void }) {
  const [side, setSide] = useState<"buy"|"sell">("buy");
  const [amount, setAmount] = useState("");
  const [done, setDone] = useState(false);
  const estimated = side === "buy" ? (parseFloat(amount)||0)/asset.price : (parseFloat(amount)||0)*asset.price;
  if (done) return (
    <div style={{ padding:"60px 24px", textAlign:"center", maxWidth:400, margin:"0 auto" }}>
      <div style={{ width:72, height:72, borderRadius:"50%", background:"rgba(16,185,129,0.12)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", color:"#10b981", fontSize:40 }}>✓</div>
      <div style={{ fontSize:22, fontWeight:900, marginBottom:8 }}>{side==="buy"?"خرید موفق":"فروش موفق"}</div>
      <div style={{ fontSize:14, color:"var(--w-muted)", marginBottom:6 }}>{amount} {side==="buy"?"USDT":asset.symbol}</div>
      <div style={{ fontSize:14, fontWeight:800, marginBottom:24 }}>{estimated.toFixed(side==="buy"?6:2)} {side==="buy"?asset.symbol:"USDT"} دریافت شد</div>
      <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
        <button onClick={()=>{setDone(false);setAmount("");}} className="w-btn w-btn-ghost">معامله جدید</button>
        <button onClick={onBack} className="w-btn w-btn-primary">بازگشت</button>
      </div>
    </div>
  );
  return (
    <div style={{ padding:"32px 0", maxWidth:440 }}>
      <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontSize:13, marginBottom:20 }}>
        <WI n="arrow-right" s={13}/> انتخاب نوع معامله
      </button>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
        <div style={{ width:44, height:44, borderRadius:"50%", background:asset.logoColor, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:13 }}>{asset.symbol.slice(0,3)}</div>
        <div>
          <div style={{ fontSize:16, fontWeight:900 }}>{asset.nameFa} ({asset.symbol})</div>
          <div style={{ fontSize:13, fontWeight:800, color:clr(asset.change24h) }}>${fmtP(asset.price)} <span style={{ fontSize:11 }}>{asset.change24h>0?"+":""}{asset.change24h.toFixed(2)}%</span></div>
        </div>
      </div>
      <div className="w-card" style={{ padding:"24px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", background:"var(--w-card2)", borderRadius:10, padding:3, marginBottom:20 }}>
          <button onClick={()=>setSide("buy")} style={{ padding:"10px", borderRadius:8, border:"none", background:side==="buy"?"#10b981":"transparent", color:side==="buy"?"#fff":"var(--w-muted)", fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"Vazirmatn" }}>خرید {asset.symbol}</button>
          <button onClick={()=>setSide("sell")} style={{ padding:"10px", borderRadius:8, border:"none", background:side==="sell"?"#f43f5e":"transparent", color:side==="sell"?"#fff":"var(--w-muted)", fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"Vazirmatn" }}>فروش {asset.symbol}</button>
        </div>
        <div style={{ marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--w-muted)", marginBottom:6 }}>
            <span>{side==="buy"?"پرداخت می‌کنید":"می‌فروشید"}</span>
            <span>موجودی: {side==="buy"?"0.00 USDT":`0.00 ${asset.symbol}`}</span>
          </div>
          <div style={{ position:"relative" }}>
            <input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" className="w-input" style={{ paddingLeft:56, fontSize:16 }} inputMode="decimal"/>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:13, fontWeight:700, color:"var(--w-muted)" }}>{side==="buy"?"USDT":asset.symbol}</span>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:16 }}>
          {["25%","50%","75%","همه"].map(p=>(
            <button key={p} style={{ padding:"6px", borderRadius:7, border:"1px solid var(--w-border)", background:"transparent", color:"var(--w-muted)", fontSize:12, cursor:"pointer", fontFamily:"Vazirmatn" }}>{p}</button>
          ))}
        </div>
        {amount && (
          <div style={{ padding:"12px 14px", background:"var(--w-card2)", borderRadius:9, marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4 }}>
              <span style={{ color:"var(--w-muted)" }}>{side==="buy"?"دریافت می‌کنید":"معادل USDT"}</span>
              <span style={{ fontWeight:800 }}>{estimated.toFixed(side==="buy"?6:2)} {side==="buy"?asset.symbol:"USDT"}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--w-muted)" }}>
              <span>قیمت</span><span>${fmtP(asset.price)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--w-muted)" }}>
              <span>کارمزد (۰.۱٪)</span><span>{side==="buy"?`$${(parseFloat(amount)*0.001).toFixed(4)}`:`${(parseFloat(amount)*0.001).toFixed(6)} ${asset.symbol}`}</span>
            </div>
          </div>
        )}
        {!isLoggedIn ? (
          <button onClick={onAuth} className="w-btn w-btn-primary" style={{ width:"100%", padding:"13px", background:side==="buy"?"#10b981":"#f43f5e" }}>
            <WI n="lock" s={15}/> ورود برای معامله
          </button>
        ) : (
          <button disabled={!amount} onClick={()=>setDone(true)} className="w-btn w-btn-primary" style={{ width:"100%", padding:"13px", background:side==="buy"?"#10b981":"#f43f5e", opacity:amount?1:0.5, fontSize:15 }}>
            {side==="buy"?`خرید ${asset.symbol}`:`فروش ${asset.symbol}`}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Support Tab ────────────────────────────────────
function SupportTab({ isLoggedIn, onAuth }: { isLoggedIn:boolean; onAuth:()=>void }) {
  const [view, setView] = useState<"list"|"new"|"chat">("list");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState([
    { from:"support", text:"سلام! به پشتیبانی آن صراف خوش آمدید. چطور می‌توانم کمک کنم؟", time:"۱۰:۳۰" },
  ]);
  const TICKETS = [
    { id:"TK-1042", subject:"مشکل در برداشت USDT", status:"در انتظار پاسخ", date:"۱۴۰۳/۰۸/۲۲", color:"#d97706" },
    { id:"TK-1038", subject:"سؤال درباره کارمزد", status:"پاسخ داده شده", date:"۱۴۰۳/۰۸/۱۸", color:"#10b981" },
    { id:"TK-1025", subject:"احراز هویت رد شد", status:"بسته شده", date:"۱۴۰۳/۰۸/۱۰", color:"var(--w-muted)" },
  ];
  if (!isLoggedIn) return (
    <div style={{ textAlign:"center", padding:"60px 24px" }}>
      <WI n="comment" s={40} style={{ opacity:0.2, marginBottom:16 }}/>
      <div style={{ fontSize:16, fontWeight:800, marginBottom:8 }}>ورود برای مشاهده تیکت‌ها</div>
      <button onClick={onAuth} className="w-btn w-btn-primary" style={{ padding:"10px 24px", marginTop:8 }}>ورود / ثبت‌نام</button>
    </div>
  );
  if (view === "chat") return (
    <div style={{ padding:"20px 0", display:"flex", flexDirection:"column", height:"calc(100vh - var(--w-header) - 100px)" }}>
      <button onClick={()=>setView("list")} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontSize:13, marginBottom:16 }}>
        <WI n="arrow-right" s={13}/> بازگشت
      </button>
      <div className="w-card" style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"14px 16px", borderBottom:"1px solid var(--w-border)", fontSize:14, fontWeight:800 }}>چت با پشتیبانی</div>
        <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>
          {messages.map((m,i)=>(
            <div key={i} style={{ display:"flex", gap:10, marginBottom:14, justifyContent:m.from==="user"?"flex-start":"flex-end" }}>
              {m.from==="support" && <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(8,145,178,0.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#0891b2", fontSize:12, fontWeight:800 }}>پ</div>}
              <div style={{ maxWidth:"70%", padding:"10px 14px", borderRadius:12, background:m.from==="user"?"rgba(124,58,237,0.08)":"var(--w-card2)", fontSize:13 }}>
                {m.text}
                <div style={{ fontSize:10, color:"var(--w-muted)", marginTop:4, textAlign:"left" }}>{m.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding:"12px 16px", borderTop:"1px solid var(--w-border)", display:"flex", gap:8 }}>
          <input value={chatMsg} onChange={e=>setChatMsg(e.target.value)} placeholder="پیام خود را بنویسید..." className="w-input" style={{ flex:1 }}
            onKeyDown={e=>{if(e.key==="Enter"&&chatMsg.trim()){setMessages(p=>[...p,{from:"user",text:chatMsg.trim(),time:"اکنون"}]);setChatMsg("");setTimeout(()=>setMessages(p=>[...p,{from:"support",text:"پیام شما دریافت شد. کارشناسان ما به زودی پاسخ خواهند داد.",time:"اکنون"}]),1500);}}}
          />
          <button onClick={()=>{if(!chatMsg.trim())return;setMessages(p=>[...p,{from:"user",text:chatMsg.trim(),time:"اکنون"}]);setChatMsg("")}} className="w-btn w-btn-primary" style={{ padding:"10px 18px" }}><WI n="send" s={15}/></button>
        </div>
      </div>
    </div>
  );
  if (view === "new") return (
    <div style={{ padding:"24px 0", maxWidth:560 }}>
      <button onClick={()=>setView("list")} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontSize:13, marginBottom:20 }}>
        <WI n="arrow-right" s={13}/> بازگشت به تیکت‌ها
      </button>
      <h2 style={{ fontSize:18, fontWeight:900, marginBottom:20 }}>تیکت جدید</h2>
      <div className="w-card" style={{ padding:"22px", display:"flex", flexDirection:"column", gap:14 }}>
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", display:"block", marginBottom:5 }}>موضوع</label>
          <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="موضوع مشکل یا سؤال خود را بنویسید" className="w-input"/>
        </div>
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", display:"block", marginBottom:5 }}>دسته‌بندی</label>
          <select className="w-input" style={{ appearance:"none" }}>
            {["واریز و برداشت","معاملات","احراز هویت","امنیت","سایر"].map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", display:"block", marginBottom:5 }}>توضیحات</label>
          <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="مشکل خود را با جزئیات توضیح دهید..." className="w-input" rows={5} style={{ resize:"vertical" }}/>
        </div>
        <button disabled={!subject||!body} onClick={()=>setView("list")} className="w-btn w-btn-primary" style={{ padding:"12px", opacity:subject&&body?1:0.5 }}>
          ارسال تیکت
        </button>
      </div>
    </div>
  );
  return (
    <div style={{ padding:"20px 0" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:16, fontWeight:900 }}>تیکت‌های پشتیبانی</div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>setView("chat")} className="w-btn w-btn-ghost" style={{ padding:"8px 16px", fontSize:12 }}><WI n="comment" s={13}/> چت زنده</button>
          <button onClick={()=>setView("new")} className="w-btn w-btn-primary" style={{ padding:"8px 16px", fontSize:12 }}>تیکت جدید +</button>
        </div>
      </div>
      <div className="w-card" style={{ overflow:"hidden" }}>
        {TICKETS.map((t,i) => (
          <div key={t.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderBottom:i<TICKETS.length-1?"1px solid var(--w-border)":"none", cursor:"pointer", transition:"background 0.1s" }}
            onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background="var(--w-hover)"}
            onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background="transparent"}
          >
            <div style={{ width:36, height:36, borderRadius:10, background:`${t.color}15`, display:"flex", alignItems:"center", justifyContent:"center", color:t.color, flexShrink:0 }}>
              <WI n="comment" s={17}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700 }}>{t.subject}</div>
              <div style={{ fontSize:11, color:"var(--w-muted)", marginTop:2 }}>{t.id} · {t.date}</div>
            </div>
            <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:`${t.color}15`, color:t.color }}>{t.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Guide Tab ──────────────────────────────────────
function GuideTab() {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(35);
  const VIDEOS = [
    { title:"آشنایی با آن صراف", duration:"۵:۳۲", done:true },
    { title:"نحوه واریز و برداشت", duration:"۸:۱۵", done:true },
    { title:"معامله اسپات برای مبتدیان", duration:"۱۲:۴۰", done:false },
    { title:"معامله تعهدی (مارجین)", duration:"۱۵:۲۲", done:false },
    { title:"فارکس بات: تنظیمات", duration:"۹:۵۸", done:false },
    { title:"امنیت حساب و ۲FA", duration:"۶:۱۰", done:false },
  ];
  return (
    <div style={{ padding:"24px 0", display:"flex", gap:24, alignItems:"flex-start" }}>
      <div style={{ flex:1 }}>
        <div className="w-card" style={{ overflow:"hidden", marginBottom:16 }}>
          <div style={{ height:320, background:"#0a0a12", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", cursor:"pointer" }} onClick={()=>setPlaying(!playing)}>
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,rgba(8,145,178,0.15),rgba(124,58,237,0.1))" }}/>
            {!playing ? (
              <div style={{ width:72, height:72, borderRadius:"50%", background:"rgba(255,255,255,0.15)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <WI n="play" s={32} style={{ color:"#fff", marginRight:-4 }}/>
              </div>
            ) : (
              <div style={{ display:"flex", gap:4 }}>
                {[...Array(3)].map((_,i)=><div key={i} style={{ width:4, height:24+i*8, background:"#0891b2", borderRadius:2, animation:`pulse ${0.8+i*0.2}s ease-in-out infinite alternate` }}/>)}
              </div>
            )}
            <div style={{ position:"absolute", bottom:12, right:16, fontSize:13, color:"rgba(255,255,255,0.8)", fontWeight:700 }}>معامله اسپات برای مبتدیان</div>
          </div>
          <div style={{ padding:"14px 16px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <span style={{ fontSize:11, color:"var(--w-muted)" }}>۳:۵۲ / ۱۲:۴۰</span>
              <div style={{ flex:1, height:4, background:"var(--w-card2)", borderRadius:4, overflow:"hidden", cursor:"pointer" }}
                onClick={e=>{ const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect(); setProgress(((e.clientX-r.left)/r.width)*100); }}>
                <div style={{ height:"100%", width:`${progress}%`, background:"#0891b2", transition:"width 0.1s" }}/>
              </div>
              <button onClick={()=>setPlaying(!playing)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)" }}>
                <WI n={playing?"pause":"play"} s={16}/>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div style={{ width:280 }}>
        <div style={{ fontSize:14, fontWeight:800, marginBottom:12 }}>فهرست دروس</div>
        <div className="w-card" style={{ overflow:"hidden" }}>
          {VIDEOS.map((v,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderBottom:i<VIDEOS.length-1?"1px solid var(--w-border)":"none", cursor:"pointer", background:i===2?"rgba(8,145,178,0.06)":"transparent" }}>
              <div style={{ width:28, height:28, borderRadius:8, background:v.done?"rgba(16,185,129,0.12)":i===2?"rgba(8,145,178,0.12)":"var(--w-card2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:v.done?"#10b981":i===2?"#0891b2":"var(--w-muted)" }}>
                {v.done ? <WI n="check" s={13}/> : <WI n="play" s={12}/>}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:v.done||i===2?700:500, color:i===2?"#0891b2":"var(--w-text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.title}</div>
                <div style={{ fontSize:10, color:"var(--w-muted)", marginTop:1 }}>{v.duration}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Forex Bot Tab ──────────────────────────────────
function ForexBotTab({ asset }: { asset:CryptoAsset }) {
  const [active, setActive] = useState(false);
  const [investAmount, setInvestAmount] = useState("1000");
  const SESSIONS = [
    { date:"۱۴۰۳/۰۸/۲۲", pair:"BTC/USDT", trades:FA(14), pnl:"+$۸۲.۵۰", pnlPct:"+۸.۲٪", color:"#10b981" },
    { date:"۱۴۰۳/۰۸/۲۱", pair:"ETH/USDT", trades:FA(9), pnl:"+$۳۴.۲۰", pnlPct:"+۳.۴٪", color:"#10b981" },
    { date:"۱۴۰۳/۰۸/۲۰", pair:"SOL/USDT", trades:FA(11), pnl:"-$۱۵.۸۰", pnlPct:"-۱.۶٪", color:"#f43f5e" },
    { date:"۱۴۰۳/۰۸/۱۹", pair:"BNB/USDT", trades:FA(7), pnl:"+$۵۶.۱۰", pnlPct:"+۵.۶٪", color:"#10b981" },
  ];
  return (
    <div style={{ padding:"24px 0" }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:24 }}>
        {[["سود کل","$۱۵۷.۰۰","#10b981"],["معاملات امروز",FA(14),"#0891b2"],["وضعیت بات",active?"فعال":"غیرفعال",active?"#10b981":"#f43f5e"]].map(([l,v,c])=>(
          <div key={l as string} className="w-card" style={{ padding:"18px" }}>
            <div style={{ fontSize:11, color:"var(--w-muted)", marginBottom:6 }}>{l}</div>
            <div style={{ fontSize:20, fontWeight:900, color:c as string }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:20, alignItems:"flex-start" }}>
        <div style={{ flex:1 }}>
          <div className="w-card" style={{ padding:"22px", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:900 }}>فارکس بات آن صراف</div>
                <div style={{ fontSize:12, color:"var(--w-muted)", marginTop:2 }}>معامله خودکار با هوش مصنوعی</div>
              </div>
              <button onClick={()=>setActive(!active)} style={{ width:52, height:28, borderRadius:14, border:"none", cursor:"pointer", background:active?"#10b981":"var(--w-card2)", transition:"all 0.22s", position:"relative" }}>
                <div style={{ width:20, height:20, borderRadius:"50%", background:"#fff", position:"absolute", top:4, transition:"right 0.22s", right:active?28:4, boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }}/>
              </button>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", display:"block", marginBottom:5 }}>سرمایه اختصاصی (USDT)</label>
              <div style={{ position:"relative" }}>
                <input value={investAmount} onChange={e=>setInvestAmount(e.target.value)} className="w-input" inputMode="decimal"/>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", display:"block", marginBottom:5 }}>جفت ارز</label>
                <select className="w-input" style={{ appearance:"none" }}>
                  {["BTC/USDT","ETH/USDT","SOL/USDT","BNB/USDT"].map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", display:"block", marginBottom:5 }}>استراتژی</label>
                <select className="w-input" style={{ appearance:"none" }}>
                  {["DCA","Grid","Scalp","Trend"].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ padding:"10px 12px", background:active?"rgba(16,185,129,0.08)":"var(--w-card2)", borderRadius:9, fontSize:12, color:active?"#10b981":"var(--w-muted)" }}>
              {active ? "✓ بات در حال معامله است. آخرین فعالیت ۲ دقیقه پیش" : "بات غیرفعال است. سوئیچ را روشن کنید تا شروع شود."}
            </div>
          </div>
        </div>
        <div style={{ width:340 }}>
          <div style={{ fontSize:14, fontWeight:800, marginBottom:12 }}>تاریخچه سشن‌ها</div>
          <div className="w-card" style={{ overflow:"hidden" }}>
            {SESSIONS.map((s,i)=>(
              <div key={i} style={{ padding:"12px 14px", borderBottom:i<SESSIONS.length-1?"1px solid var(--w-border)":"none" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700 }}>{s.pair}</div>
                    <div style={{ fontSize:10, color:"var(--w-muted)" }}>{s.date} · {s.trades} معامله</div>
                  </div>
                  <div style={{ textAlign:"left" }}>
                    <div style={{ fontSize:14, fontWeight:900, color:s.color }}>{s.pnl}</div>
                    <div style={{ fontSize:11, color:s.color }}>{s.pnlPct}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
