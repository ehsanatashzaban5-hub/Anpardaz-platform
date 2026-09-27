// ─────────────────────────────────────────────────
// An Pardaz Web Portal — An Sarraf (Desktop Exchange)
// Live exchange UI; asset catalog and market state come from backend
// ─────────────────────────────────────────────────
import { useState, useMemo, useCallback, useEffect } from "react";
import WI from "./WebIcons";
import type { WebPage, CryptoAsset, KycStatus, OrderBookEntry } from "./types";
import { useIsMobile } from "./useResponsive";

const ANSARRAF_API_BASE = ((import.meta as any).env?.VITE_ANSARRAF_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const PLATFORM_API_BASE = ((import.meta as any).env?.VITE_PLATFORM_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const getWebToken = () => typeof window !== "undefined" ? window.localStorage.getItem("anpardaz:accessToken") ?? "" : "";

const FA = (s: string | number) => String(s).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]);
const fmtP = (n: number) => !Number.isFinite(n) || n <= 0 ? "—" : n >= 1 ? n.toLocaleString("en-US", { maximumFractionDigits:2 }) : n.toPrecision(4);
const fmtIrt = (n: number) => {
  if (n >= 1_000_000_000) return `${(n/1_000_000_000).toFixed(2)} میلیارد تومان`;
  if (n >= 1_000_000)     return `${(n/1_000_000).toFixed(0)} میلیون تومان`;
  return `${n.toLocaleString("fa-IR")} تومان`;
};
const fmtVol = (n: number) => {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1e12) return `$${(n/1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n/1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n/1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
};
const clr = (n: number) => n >= 0 ? "#10b981" : "#f43f5e";

type SarrafTab = "markets"|"trade-select"|"instant"|"spot"|"margin"|"assets"|"deposit"|"deposit-coin"|"withdraw"|"withdraw-coin"|"orders"|"transactions"|"fees"|"security"|"support"|"guide";

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

export default function WebSarraf({ onNavigate, kycStatus: initialKycStatus, onAuthRequired, isLoggedIn }: SarrafProps) {
  const [tab, setTab]               = useState<SarrafTab>("markets");
  const [liveAssets, setLiveAssets] = useState<CryptoAsset[]>([]);
  const [selectedAsset, setAsset]   = useState<CryptoAsset>({ id:"", symbol:"", name:"", nameFa:"", logoColor:"#0891b2", price:0, priceIrt:0, change24h:0, volume24h:0, marketCap:0, high24h:0, low24h:0, rank:0 });
  const [search, setSearch]         = useState("");
  const [sortBy, setSortBy]         = useState<"rank"|"price"|"change"|"volume">("rank");
  const [filterFav, setFilterFav]   = useState(false);
  const [favorites, setFavorites]   = useState<Set<string>>(new Set());
  const [tradeType, setTradeType]   = useState<"buy"|"sell">("buy");
  const [tradeMode, setTradeMode]   = useState<"market"|"limit"|"stop-limit">("market");
  const [price, setPrice]           = useState("");
  const [amount, setAmount]         = useState("");
  const [coinDetail, setCoinDetail] = useState<CryptoAsset|null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [wallets, setWallets] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [backendKycStatus, setBackendKycStatus] = useState<KycStatus | null>(null);
  const isMobile = useIsMobile(900);

  useEffect(() => {
    if (!isLoggedIn) return;
    const token = getWebToken();
    if (!token) return;
    let active = true;
    const headers = { authorization: `Bearer ${token}` };
    const loadAccount = async () => {
      try {
        const [walletR, orderR, depositR, withdrawalR, kycR] = await Promise.all([
          fetch(`${ANSARRAF_API_BASE}/api/v1/wallets`, { headers, cache: "no-store" }),
          fetch(`${ANSARRAF_API_BASE}/api/v1/orders`, { headers, cache: "no-store" }),
          fetch(`${ANSARRAF_API_BASE}/api/v1/deposits`, { headers, cache: "no-store" }),
          fetch(`${ANSARRAF_API_BASE}/api/v1/withdrawals`, { headers, cache: "no-store" }),
          fetch(`${ANSARRAF_API_BASE}/api/v1/kyc`, { headers, cache: "no-store" }),
        ]);
        if (!active) return;
        if (walletR.ok) setWallets((await walletR.json()).wallets ?? []);
        if (orderR.ok) setOrders((await orderR.json()).orders ?? []);
        if (depositR.ok) setDeposits((await depositR.json()).deposits ?? []);
        if (withdrawalR.ok) setWithdrawals((await withdrawalR.json()).withdrawals ?? []);
        if (kycR.ok) {
          const status = (await kycR.json()).kyc?.status;
          if (status === "VERIFIED" || status === "verified") setBackendKycStatus("verified");
          else if (status === "PENDING" || status === "pending" || status === "SUBMITTED" || status === "submitted") setBackendKycStatus("pending");
          else if (status) setBackendKycStatus("not_verified");
        }
      } catch {
        // Protected account data remains empty rather than being replaced with demo data.
      }
    };
    void loadAccount();
    const id = window.setInterval(() => void loadAccount(), 5000);
    return () => { active = false; window.clearInterval(id); };
  }, [isLoggedIn]);

  const effectiveKycStatus = backendKycStatus ?? initialKycStatus;

  useEffect(() => {
    let active = true;
    const loadAssets = async () => {
      try {
        const r = await fetch(ANSARRAF_API_BASE + "/api/v1/assets", { cache: "no-store" });
        if (!r.ok) throw new Error("assets_unavailable");
        const rows = (await r.json()).assets ?? [];
        const mapped: CryptoAsset[] = rows
          .filter((x:any) => String(x.assetType ?? x.asset_type ?? "crypto").toLowerCase() === "crypto")
          .map((x:any, i:number) => ({
            id:String(x.id), symbol:String(x.symbol).toUpperCase(), name:String(x.name ?? x.symbol),
            nameFa:String(x.nameFa ?? x.name ?? x.symbol), logoUrl:x.logoUrl ?? undefined,
            logoColor:String(x.logoColor ?? "#0891b2"), price:0, priceIrt:0,
            change24h:0, volume24h:0, marketCap:0, high24h:0, low24h:0, rank:Number(x.rank ?? i+1)
          }));
        if (!active) return;
        setLiveAssets(mapped);
        setAsset(prev => prev.symbol ? (mapped.find(a=>a.symbol===prev.symbol) ?? prev) : (mapped[0] ?? prev));
      } catch {
        if (active) setLiveAssets([]);
      }
    };
    void loadAssets();
    const id = window.setInterval(() => void loadAssets(), 30000);
    return () => { active = false; window.clearInterval(id); };
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const r = await fetch(`${ANSARRAF_API_BASE}/api/v1/market-data/quotes`, { signal: AbortSignal.timeout(7000), cache: "no-store" });
        if (!r.ok) throw new Error("market_data_unavailable");
        const d = await r.json();
        const quotes = Array.isArray(d?.quotes) ? d.quotes : [];
        const live = quotes.filter((q: any) => !q.stale && Number(q.lastPrice) > 0);
        const bySymbol = new Map<string, any>();
        for (const q of live) {
          const current = bySymbol.get(q.symbol);
          if (!current || q.provider === "wallex") bySymbol.set(q.symbol, q);
        }
        const tomanRate = Number(bySymbol.get("USDT/TOMAN")?.lastPrice || 0);
        if (!active) return;
        setLiveAssets(previous => previous.map(a => {
          if (a.symbol === "USDT") {
             const q=bySymbol.get("USDT/TOMAN");
             return { ...a, price: tomanRate, priceIrt: tomanRate, change24h:Number(q?.change24h??q?.change_percent??q?.change??0)||0, volume24h:Number(q?.volume24h??q?.volume_24h??q?.volume??0)||0, high24h:Number(q?.high24h??q?.high_24h??q?.high??0)||0, low24h:Number(q?.low24h??q?.low_24h??q?.low??0)||0 };
           }
          const usdt = bySymbol.get(`${a.symbol}/USDT`);
          const toman = bySymbol.get(`${a.symbol}/TOMAN`);
          const price = usdt ? Number(usdt.lastPrice) : 0;
          const priceIrt = toman ? Number(toman.lastPrice) : (price > 0 && tomanRate > 0 ? price * tomanRate : 0);
          const change=usdt?.change24h??usdt?.change_percent??usdt?.change??0;
           const volume=usdt?.volume24h??usdt?.volume_24h??usdt?.volume??0;
           const marketCap=usdt?.marketCap??usdt?.market_cap??0;
           const high=usdt?.high24h??usdt?.high_24h??usdt?.high??0;
           const low=usdt?.low24h??usdt?.low_24h??usdt?.low??0;
           return { ...a, price, priceIrt, change24h:Number(change)||0, volume24h:Number(volume)||0, marketCap:Number(marketCap)||0, high24h:Number(high)||0, low24h:Number(low)||0 };
        }));
      } catch {
        // Keep verified backend data already rendered; never synthesize a mock quote.
      }
    };
    void load();
    const id = window.setInterval(() => void load(), 5000);
    return () => { active = false; window.clearInterval(id); };
  }, []);

  useEffect(() => {
    const next = liveAssets.find(a => a.id === selectedAsset.id);
    if (next) setAsset(next);
  }, [liveAssets, selectedAsset.id]);

  const filtered = useMemo(() => {
    let list = liveAssets.filter(a =>
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
  const needsKyc   = isLoggedIn && effectiveKycStatus !== "verified";

  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [recentTrades, setRecentTrades] = useState<{ price:number; amount:number; side:"buy"|"sell"; time:string }[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!selectedAsset.symbol) return;
      try {
        const symbol = `${selectedAsset.symbol}/USDT`;
        const [bookResponse, tradesResponse] = await Promise.all([
          fetch(`${ANSARRAF_API_BASE}/api/v1/orderbook?symbol=${encodeURIComponent(symbol)}&limit=20`, { signal: AbortSignal.timeout(5000), cache: "no-store" }),
          fetch(`${ANSARRAF_API_BASE}/api/v1/market-data/trades?symbol=${encodeURIComponent(symbol)}&limit=20`, { signal: AbortSignal.timeout(5000), cache: "no-store" }),
        ]);
        if (!bookResponse.ok) throw new Error("orderbook_unavailable");
        const d = await bookResponse.json();
        const td = tradesResponse.ok ? await tradesResponse.json() : null;
        if (!active) return;
        setBids(Array.isArray(d?.bids) ? d.bids.map((x: any) => ({ price: Number(x.price), amount: Number(x.amount), total: Number(x.total) })) : []);
        setAsks(Array.isArray(d?.asks) ? d.asks.map((x: any) => ({ price: Number(x.price), amount: Number(x.amount), total: Number(x.total) })) : []);
        setRecentTrades(Array.isArray(td?.trades) ? td.trades.map((x: any) => ({ price: Number(x.price), amount: Number(x.quantity), side: x.side === "buy" ? "buy" : "sell", time: new Date(x.created_at).toLocaleTimeString("fa-IR", { minute: "2-digit", second: "2-digit" }) })) : []);
      } catch {
        if (active) { setBids([]); setAsks([]); setRecentTrades([]); }
      }
    };
    void load();
    const id = window.setInterval(() => void load(), 3000);
    return () => { active = false; window.clearInterval(id); };
  }, [selectedAsset.symbol]);  const PROTECTED_TABS: SarrafTab[] = ["assets","deposit","deposit-coin","withdraw","withdraw-coin","orders","transactions","security"];
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
              {liveAssets.slice(0,5).map(a => (
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
              {liveAssets.slice(0,2).map(a => (
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
                  totalCount={liveAssets.length}
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
            <InstantTradeTab asset={selectedAsset} onBack={()=>setTab("trade-select")} isLoggedIn={isLoggedIn} onAuth={onAuthRequired} kycStatus={effectiveKycStatus}/>
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
                assets={liveAssets.slice(0,20)} onAssetChange={setAsset}
                recentTrades={recentTrades}
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
                assets={liveAssets.slice(0,20)} onAssetChange={setAsset}
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
            <AssetsTab assets={liveAssets.slice(0,12)} wallets={wallets} kycStatus={effectiveKycStatus} onDeposit={()=>setTab("deposit")} onWithdraw={()=>setTab("withdraw")} onDepositCoin={()=>setTab("deposit-coin")} onWithdrawCoin={()=>setTab("withdraw-coin")}/>
          )}
          {tab === "deposit" && isLoggedIn && (
            <DepositTomanTab kycStatus={effectiveKycStatus}/>
          )}
          {tab === "deposit-coin" && isLoggedIn && (
            <DepositCoinTab assets={liveAssets} kycStatus={effectiveKycStatus}/>
          )}
          {tab === "withdraw" && isLoggedIn && (
            <WithdrawTomanTab kycStatus={effectiveKycStatus}/>
          )}
          {tab === "withdraw-coin" && isLoggedIn && (
            <WithdrawCoinTab assets={liveAssets} kycStatus={effectiveKycStatus}/>
          )}
          {tab === "orders" && isLoggedIn && (
            <OrdersTab orders={orders}/>
          )}
          {tab === "transactions" && isLoggedIn && (
            selectedTx
              ? <TxDetailView tx={selectedTx} onBack={()=>setSelectedTx(null)}/>
              : <TransactionsTab orders={orders} deposits={deposits} withdrawals={withdrawals} onSelectTx={setSelectedTx}/>
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

