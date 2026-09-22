// ─────────────────────────────────────────────────
// An Pardaz Web Portal — An Sarraf (Desktop Exchange)
// Full professional exchange: 293 assets, all tabs
// ─────────────────────────────────────────────────
import { useState, useMemo, useCallback, useEffect } from "react";
import WI from "./WebIcons";
import type { WebPage, CryptoAsset, KycStatus, OrderBookEntry } from "./types";
import { useIsMobile } from "./useResponsive";

const ANSARRAF_API_BASE = ((import.meta as any).env?.VITE_ANSARRAF_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

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
const fmtChange = (n: number) => Number.isFinite(n) ? `${n > 0 ? "+" : ""}${n.toFixed(2)}%` : "—";
const fmtMaybe = (n: number, formatter: (v:number)=>string) => Number.isFinite(n) ? formatter(n) : "—";

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
  const [liveAssets, setLiveAssets] = useState<CryptoAsset[]>([]);
  const [selectedAsset, setAsset]   = useState<CryptoAsset|null>(null);
  const [search, setSearch]         = useState("");
  const [sortBy, setSortBy]         = useState<"rank"|"price"|"change"|"volume">("rank");
  const [filterFav, setFilterFav]   = useState(false);
  const [favorites, setFavorites]   = useState<Set<string>>(new Set());
  const [tradeType, setTradeType]   = useState<"buy"|"sell">("buy");
  const [tradeMode, setTradeMode]   = useState<"market"|"limit">("market");
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

  const logoColor = (symbol: string) => { let h = 0; for (const ch of symbol) h = (h * 31 + ch.charCodeAt(0)) % 360; return `hsl(${h} 55% 42%)`; };

  useEffect(() => {
    let active = true;
    const loadMarkets = async () => {
      try {
        const [assetResponse, quoteResponse] = await Promise.all([
          fetch(`${ANSARRAF_API_BASE}/api/v1/assets`, { signal: AbortSignal.timeout(7000), cache: "no-store" }),
          fetch(`${ANSARRAF_API_BASE}/api/v1/market-data/quotes`, { signal: AbortSignal.timeout(7000), cache: "no-store" }),
        ]);
        if (!assetResponse.ok || !quoteResponse.ok) throw new Error("market_data_unavailable");
        const assetBody = await assetResponse.json();
        const quoteBody = await quoteResponse.json();
        const rows = Array.isArray(assetBody?.assets) ? assetBody.assets : [];
        const quotes = Array.isArray(quoteBody?.quotes) ? quoteBody.quotes.filter((q: any) => q.provider === "wallex" && !q.stale && Number(q.lastPrice) > 0) : [];
        const bySymbol = new Map<string, any>();
        for (const q of quotes) {
          const current = bySymbol.get(q.symbol);
          if (!current || q.provider === "wallex") bySymbol.set(q.symbol, q);
        }
        const tomanRate = Number(bySymbol.get("USDT/TOMAN")?.lastPrice || 0);
        const mapped: CryptoAsset[] = rows.map((row: any) => {
          const symbol = String(row.symbol).toUpperCase();
          const usdt = bySymbol.get(`${symbol}/USDT`);
          const toman = bySymbol.get(`${symbol}/TOMAN`);
          const price = symbol === "USDT" ? tomanRate : Number(usdt?.lastPrice || 0);
          const priceIrt = symbol === "USDT" ? tomanRate : Number(toman?.lastPrice || (price > 0 && tomanRate > 0 ? price * tomanRate : 0));
          return {
            id: String(row.id), symbol, name: String(row.name), nameFa: String(row.name), logoUrl: undefined,
            logoColor: logoColor(symbol), price, priceIrt,
            change24h: Number(usdt?.change24h ?? toman?.change24h ?? Number.NaN),
            volume24h: Number(usdt?.volume24h ?? toman?.volume24h ?? Number.NaN),
            marketCap: Number.NaN,
            high24h: Number(usdt?.high24h ?? toman?.high24h ?? Number.NaN),
            low24h: Number(usdt?.low24h ?? toman?.low24h ?? Number.NaN),
            rank: 0,
          };
        }).filter((asset: CryptoAsset) => Number.isFinite(asset.price) && asset.price > 0);
        if (!active) return;
        setLiveAssets(mapped);
        setAsset(previous => previous ? (mapped.find(a => a.id === previous.id) ?? mapped[0] ?? null) : (mapped[0] ?? null));
      } catch {
        if (active) setLiveAssets(previous => previous);
      }
    };
    void loadMarkets();
    const id = window.setInterval(() => void loadMarkets(), 5000);
    return () => { active = false; window.clearInterval(id); };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const token = window.localStorage.getItem("anpardaz:accessToken") ?? "";
    if (!token) return;
    let active = true;
    const loadAccount = async () => {
      try {
        const headers = { authorization: `Bearer ${token}` };
        const [walletR, orderR, tradeR, depositR, withdrawalR, kycR] = await Promise.all([
          fetch(`${ANSARRAF_API_BASE}/api/v1/wallets`, { headers, cache:"no-store" }),
          fetch(`${ANSARRAF_API_BASE}/api/v1/orders`, { headers, cache:"no-store" }),
          fetch(`${ANSARRAF_API_BASE}/api/v1/trades`, { headers, cache:"no-store" }),
          fetch(`${ANSARRAF_API_BASE}/api/v1/deposits`, { headers, cache:"no-store" }),
          fetch(`${ANSARRAF_API_BASE}/api/v1/withdrawals`, { headers, cache:"no-store" }),
          fetch(`${ANSARRAF_API_BASE}/api/v1/kyc`, { headers, cache:"no-store" }),
        ]);
        if (!active) return;
        if (walletR.ok) setWallets((await walletR.json()).wallets ?? []);
        if (orderR.ok) setOrders((await orderR.json()).orders ?? []);
        if (depositR.ok) setDeposits((await depositR.json()).deposits ?? []);
        if (withdrawalR.ok) setWithdrawals((await withdrawalR.json()).withdrawals ?? []);
        if (kycR.ok) {
          const status = String((await kycR.json()).kyc?.status ?? "").toUpperCase();
          setBackendKycStatus(status === "VERIFIED" || status === "APPROVED" ? "verified" : status === "ADMIN_REVIEW" || status === "PROVIDER_CHECKING" || status === "SUBMITTED" ? "pending" : status ? "not_verified" : null);
        }
        void tradeR;
      } catch {
        // Protected account views stay empty when the backend is unavailable; no demo data is inserted.
      }
    };
    void loadAccount();
    const id = window.setInterval(() => void loadAccount(), 5000);
    return () => { active = false; window.clearInterval(id); };
  }, [isLoggedIn]);

  const filtered = useMemo(() => {
    let list = liveAssets.filter(a =>
      (!filterFav || favorites.has(a.id)) &&
      (search === "" ||
        a.symbol.toLowerCase().includes(search.toLowerCase()) ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.nameFa.includes(search))
    );
    if (sortBy === "price")   list = [...list].sort((a,b) => b.price - a.price);

    return list;
  }, [liveAssets, search, filterFav, favorites, sortBy]);

  const toggleFav = useCallback((id: string) => {
    setFavorites(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }, []);

  const selectAndTrade = (a: CryptoAsset) => { setAsset(a); setTab("trade-select"); };

  const needsLogin = !isLoggedIn;
  const effectiveKycStatus = backendKycStatus ?? kycStatus;
  const needsKyc   = isLoggedIn && effectiveKycStatus !== "verified";

  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [recentTrades, setRecentTrades] = useState<{ price:number; amount:number; side:"buy"|"sell"; time:string }[]>([]);

  useEffect(() => {
    if (!selectedAsset) return;
    let active = true;
    const loadBook = async () => {
      try {
        const symbol = `${selectedAsset.symbol}/USDT`;
      const [bookResponse, tradesResponse] = await Promise.all([
          fetch(`${ANSARRAF_API_BASE}/api/v1/orderbook?symbol=${encodeURIComponent(symbol)}&limit=20`, { signal: AbortSignal.timeout(5000), cache: "no-store" }),
          fetch(`${ANSARRAF_API_BASE}/api/v1/market-data/trades?symbol=${encodeURIComponent(symbol)}&limit=20`, { signal: AbortSignal.timeout(5000), cache: "no-store" }),
        ]);
        if (!bookResponse.ok) throw new Error("orderbook_unavailable");
        const book = await bookResponse.json();
        const trades = tradesResponse.ok ? await tradesResponse.json() : null;
        if (!active) return;
        setBids(Array.isArray(book?.bids) ? book.bids.map((x:any)=>({ price:Number(x.price), amount:Number(x.amount), total:Number(x.total) })) : []);
        setAsks(Array.isArray(book?.asks) ? book.asks.map((x:any)=>({ price:Number(x.price), amount:Number(x.amount), total:Number(x.total) })) : []);
        setRecentTrades(Array.isArray(trades?.trades) ? trades.trades.map((x:any)=>({ price:Number(x.price), amount:Number(x.quantity), side:x.side === "sell" ? "sell" : "buy", time:new Date(x.created_at).toLocaleTimeString("fa-IR",{minute:"2-digit",second:"2-digit"}) })) : []);
      } catch {
        if (active) { setBids([]); setAsks([]); setRecentTrades([]); }
      }
    };
    void loadBook();
    const id = window.setInterval(() => void loadBook(), 3000);
    return () => { active = false; window.clearInterval(id); };
  }, [selectedAsset?.symbol]);

  if (!selectedAsset) return <div dir="rtl" style={{ minHeight:"60vh", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--w-muted)" }}>در حال دریافت بازارهای واقعی آن صراف…</div>;

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
              {liveAssets.slice(0,5).map(a => (
                <div key={a.id} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, cursor:"pointer" }} onClick={()=>{setAsset(a);setTab("trade-select");}}>
                  <span style={{ fontWeight:700, color:"var(--w-muted)" }}>{a.symbol}/USDT</span>
                  <span style={{ fontWeight:900 }}>${fmtP(a.price)}</span>
                  <span style={{ color:clr(a.change24h), fontWeight:700, fontSize:11 }}>{fmtChange(a.change24h)}</span>
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
                  <span style={{ color:Number.isFinite(a.change24h)?clr(a.change24h):"var(--w-muted)", fontWeight:700, fontSize:10 }}>{fmtChange(a.change24h)}</span>
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
            <InstantTradeTab asset={selectedAsset} onBack={()=>setTab("trade-select")} isLoggedIn={isLoggedIn} onAuth={onAuthRequired}/>
          )}
          {/* ── Spot Trade ── */}
          {tab === "spot" && (
            <div style={{ display:"flex", gap:0, height:"calc(100vh - var(--w-header) - 52px)" }}>
              <TradeView
                asset={selectedAsset} asks={asks} bids={bids}
                recentTrades={recentTrades}
                tradeType={tradeType} onTradeType={setTradeType}
                tradeMode={tradeMode} onTradeMode={setTradeMode}
                price={price} onPrice={setPrice}
                amount={amount} onAmount={setAmount}
                isLoggedIn={isLoggedIn} needsKyc={needsKyc}
                onAuth={onAuthRequired}
                onSelectAsset={()=>setTab("markets")}
                assets={liveAssets.slice(0,20)} onAssetChange={setAsset}
                wallets={wallets}
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
                wallets={wallets}
                recentTrades={recentTrades}
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
        {(["price"] as const).map(s=>(
          <button key={s} onClick={()=>onSort(s)}
            style={{ padding:isMob?"7px 10px":"8px 14px", borderRadius:8, border:`1px solid ${sortBy===s?"rgba(8,145,178,0.4)":"var(--w-border)"}`, background:sortBy===s?"rgba(8,145,178,0.08)":"transparent", color:sortBy===s?"#0891b2":"var(--w-muted)", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            {s==="price"?"قیمت":"قیمت"}
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
                  {a.rank > 0 ? FA(a.rank) : "—"}
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
                    {fmtChange(a.change24h)}
                  </span>
                </div>
                <div style={{ fontSize:11, color:"var(--w-muted)", fontVariantNumeric:"tabular-nums" }}>{fmtMaybe(a.volume24h, fmtVol)}</div>
                <div style={{ fontSize:11, color:"var(--w-muted)", fontVariantNumeric:"tabular-nums" }}>{fmtMaybe(a.marketCap, fmtVol)}</div>
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
              ["رتبه بازار", a.rank > 0 ? `#${FA(a.rank)}` : "—"],
              ["بالاترین ۲۴ه", Number.isFinite(a.high24h) ? `${fmtP(a.high24h)}` : "—"],
              ["پایین‌ترین ۲۴ه", Number.isFinite(a.low24h) ? `${fmtP(a.low24h)}` : "—"],
              ["حجم ۲۴ه", fmtMaybe(a.volume24h, fmtVol)],
              ["مارکت کپ", fmtMaybe(a.marketCap, fmtVol)],
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
                <span style={{ fontWeight:700 }}>${fmtP(a.price)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Trade View ─────────────────────────────────────
function TradeView({ asset, asks, bids, recentTrades, wallets, tradeType, onTradeType, tradeMode, onTradeMode, price, onPrice, amount, onAmount, isLoggedIn, needsKyc, onAuth, onSelectAsset, assets, onAssetChange, favorites, onToggleFav, tradeKind = "spot", onBack }: {
  asset: CryptoAsset; asks: any[]; bids: any[]; recentTrades: { price:number; amount:number; side:"buy"|"sell"; time:string }[]; wallets:any[];
  tradeType:"buy"|"sell"; onTradeType:(t:"buy"|"sell")=>void;
  tradeMode:"market"|"limit"; onTradeMode:(m:"market"|"limit")=>void;
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
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const balanceSymbol = tradeType === "buy" ? "USDT" : asset.symbol.toUpperCase();
  const wallet = wallets.find(w => String(w.symbol).toUpperCase() === balanceSymbol);
  const availableBalance = Number(wallet?.available_balance ?? 0);
  const submitOrder = async () => {
    if (!isLoggedIn) return onAuth();
    if (tradeKind === "margin") { setSubmitMessage("معاملات تعهدی هنوز در بک‌اند آن صراف فعال نشده است."); return; }
    if (needsKyc) { setSubmitMessage("برای ثبت سفارش ابتدا احراز هویت را تکمیل کنید."); return; }
    const qty = Number(amount);
    const limitPrice = Number(price);
    if (!Number.isFinite(qty) || qty <= 0) { setSubmitMessage("مقدار سفارش را وارد کنید."); return; }
    if (tradeMode === "limit" && (!Number.isFinite(limitPrice) || limitPrice <= 0)) { setSubmitMessage("قیمت سفارش را وارد کنید."); return; }
    const quoteAsset = assets.find(a => a.symbol.toUpperCase() === "USDT");
    if (!quoteAsset) { setSubmitMessage("دارایی USDT در حساب صراف پیدا نشد."); return; }
    const marketPrice = Number(asset.price);
    if (tradeType === "buy" && tradeMode === "market" && (!Number.isFinite(marketPrice) || marketPrice <= 0)) { setSubmitMessage("قیمت لحظه‌ای این بازار در دسترس نیست."); return; }
    const body:any = {
      baseAssetId: Number(asset.id), quoteAssetId: Number(quoteAsset.id), side: tradeType,
      orderType: tradeMode, quantity: qty.toString(),
      ...(tradeMode === "limit" ? { price: limitPrice.toString() } : tradeType === "buy" ? { quoteAmount: (qty * marketPrice).toString() } : {}),
      idempotencyKey: crypto.randomUUID(),
    };
    setSubmitting(true); setSubmitMessage("");
    try {
      const token = window.localStorage.getItem("anpardaz:accessToken") ?? "";
      const response = await fetch(`${ANSARRAF_API_BASE}/api/v1/orders`, { method:"POST", headers:{ authorization:`Bearer ${token}`, "content-type":"application/json" }, body:JSON.stringify(body) });
      const result = await response.json().catch(()=>({}));
      if (!response.ok) throw new Error(result?.error ?? "order_failed");
      onAmount(""); onPrice(""); setSubmitMessage("سفارش با موفقیت در آن صراف ثبت شد.");
    } catch (error) {
      const map:any = { insufficient_available_balance:"موجودی کافی نیست.", invalid_order:"اطلاعات سفارش نامعتبر است.", kyc_required:"احراز هویت لازم است." };
      setSubmitMessage(map[(error as Error).message] ?? "ثبت سفارش انجام نشد.");
    } finally { setSubmitting(false); }
  };
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
              <span style={{ fontSize:10, color:clr(a.change24h), fontWeight:700 }}>{fmtChange(a.change24h)}</span>
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
          <span style={{ fontSize:13, fontWeight:700, color:Number.isFinite(asset.change24h)?clr(asset.change24h):"var(--w-muted)" }}>{asset.change24h>0?"+":""}{asset.change24h.toFixed(2)}%</span>
          {!isMob && [["بالا","high24h"],["پایین","low24h"],["حجم","volume24h"]].map(([l,k]) => (
            <div key={k} style={{ marginRight:8 }}>
              <div style={{ fontSize:10, color:"var(--w-muted)" }}>{l} ۲۴ه</div>
              <div style={{ fontSize:11, fontWeight:700 }}>{k==="volume24h"?fmtVol((asset as any)[k]):Number.isFinite(Number((asset as any)[k])) ? `${fmtP(Number((asset as any)[k]))}` : "—"}</div>
            </div>
          ))}
        </div>
        {/* Chart */}
        <div style={{ height:260, background:"var(--w-card)", borderBottom:"1px solid var(--w-border)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
<div style={{ height:"100%", width:"100%", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--w-muted)", fontSize:12 }}>نمودار تاریخی هنوز از API آن صراف ارائه نمی‌شود.</div>
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
            {(["market","limit"] as const).map(m=>(
              <button key={m} onClick={()=>onTradeMode(m)} style={{ flex:1, padding:"5px 4px", borderRadius:6, border:"none", background:tradeMode===m?"var(--w-card)":"transparent", color:tradeMode===m?"var(--w-text)":"var(--w-muted)", fontWeight:tradeMode===m?700:400, fontSize:11, cursor:"pointer", fontFamily:"Vazirmatn", boxShadow:tradeMode===m?"var(--w-shadow)":"none" }}>
                {m==="market"?"بازار":"لیمیت"}
              </button>
            ))}
          </div>
          {/* Balance */}
          {isLoggedIn && (
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--w-muted)", marginBottom:12 }}>
              <span>موجودی:</span>
              <span style={{ fontWeight:700 }}>{Number.isFinite(availableBalance) ? `${availableBalance.toFixed(8)} ${balanceSymbol}` : `0 ${balanceSymbol}`}</span>
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
              <button key={p} onClick={()=>onAmount(((parseFloat(p)/100)*availableBalance).toFixed(8))} style={{ padding:"5px", borderRadius:6, border:"1px solid var(--w-border)", background:"transparent", color:"var(--w-muted)", fontSize:11, cursor:"pointer", fontFamily:"Vazirmatn", transition:"all 0.1s" }}
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
            <button onClick={submitOrder} disabled={submitting} className="w-btn w-btn-primary" style={{ width:"100%", padding:"12px", fontSize:14, background:tradeType==="buy"?"#10b981":"#f43f5e", opacity:submitting?0.65:1 }}>
              {submitting ? "در حال ثبت..." : tradeType==="buy"?`خرید ${asset.symbol}`:`فروش ${asset.symbol}`}
            </button>
          )}
        </div>
        {/* Recent trades */}
        <div style={{ padding:"14px", borderTop:"1px solid var(--w-border)", marginTop:"auto" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--w-muted)", marginBottom:8 }}>آخرین معاملات</div>
          {recentTrades.length===0 ? (
            <div style={{ padding:"18px 8px", textAlign:"center", color:"var(--w-muted)", fontSize:11 }}>هنوز معامله‌ای برای این بازار ثبت نشده است.</div>
          ) : recentTrades.map((trade,i)=>(
            <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", fontSize:10, padding:"4px 0", borderBottom:"1px solid var(--w-border)", color:"var(--w-muted)" }}>
              <span style={{ color:trade.side==="buy"?"#10b981":"#f43f5e" }}>{fmtP(trade.price)}</span>
              <span style={{ textAlign:"center" }}>{trade.amount.toFixed(6)}</span>
              <span style={{ textAlign:"left" }}>{trade.time}</span>
            </div>
          ))}        </div>
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
function AssetsTab({ assets, wallets, kycStatus, onDeposit, onWithdraw, onDepositCoin, onWithdrawCoin }: { assets:CryptoAsset[]; wallets:any[]; kycStatus:KycStatus; onDeposit:()=>void; onWithdraw:()=>void; onDepositCoin:()=>void; onWithdrawCoin:()=>void; }) {
  const walletBySymbol = new Map(wallets.map(w => [String(w.symbol).toUpperCase(), w]));
  const portfolioValue = wallets.reduce((sum,w) => sum + Number(w.total_balance ?? (Number(w.available_balance ?? 0) + Number(w.locked_balance ?? 0))) * (assets.find(a => a.symbol.toUpperCase() === String(w.symbol).toUpperCase())?.price ?? 0), 0);
  return (
    <div style={{ padding:"20px 0" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
        {[
          { label:"ارزش کل پورتفولیو", value:`$${portfolioValue.toFixed(2)}`, icon:"wallet", color:"#0891b2" },
          { label:"تعداد دارایی‌ها", value:FA(wallets.length), icon:"trending-up", color:"#10b981" },
          { label:"وضعیت داده", value:wallets.length ? "زنده" : "در انتظار ورود", icon:"bar-chart", color:"#7c3aed" },
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
            {assets.filter(a => walletBySymbol.has(a.symbol.toUpperCase())).map(a => {
              const wallet = walletBySymbol.get(a.symbol.toUpperCase());
              const bal = Number(wallet?.total_balance ?? (Number(wallet?.available_balance ?? 0) + Number(wallet?.locked_balance ?? 0)));
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
            {wallets.length === 0 && <tr><td colSpan={5} style={{ padding:"40px", textAlign:"center", color:"var(--w-muted)" }}>هنوز موجودی واقعی از حساب شما دریافت نشده است.</td></tr>}
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
function DepositTomanTab({ kycStatus }: { kycStatus:KycStatus }) { if (kycStatus !== "verified") return <KycGate kycStatus={kycStatus}/>; return <div className="w-card" style={{maxWidth:560,padding:24,marginTop:24}}><h2 style={{fontSize:18,fontWeight:900,marginBottom:10}}>واریز تومان</h2><p style={{fontSize:13,color:"var(--w-muted)",lineHeight:1.8,margin:0}}>در Backend فعلی آن صراف، درگاه پرداخت تومان و حساب بانکی/شبا برای واریز کاربر فعال نشده است. تا زمان اتصال سرویس پرداخت، هیچ شماره حساب، شبا، سقف یا موجودی آزمایشی نمایش داده نمی‌شود.</p></div>; }

// ── Deposit Coin Tab ───────────────────────────────
function DepositCoinTab({ assets, kycStatus }: { assets:CryptoAsset[]; kycStatus:KycStatus }) { if (kycStatus !== "verified") return <KycGate kycStatus={kycStatus}/>; return <div className="w-card" style={{maxWidth:560,padding:24,marginTop:24}}><h2 style={{fontSize:18,fontWeight:900,marginBottom:10}}>واریز رمزارز</h2><p style={{fontSize:13,color:"var(--w-muted)",lineHeight:1.8,margin:0}}>آدرس واریز واقعی از Backend/Provider فعلی صادر نمی‌شود. تا زمان فعال شدن سرویس آدرس کیف پول، آدرس نمونه یا ساختگی نمایش داده نمی‌شود.</p></div>; }

// ── Withdraw Toman Tab ─────────────────────────────
function WithdrawTomanTab({ kycStatus }: { kycStatus:KycStatus }) { if (kycStatus !== "verified") return <KycGate kycStatus={kycStatus}/>; return <div className="w-card" style={{maxWidth:520,padding:24,marginTop:24}}><h2 style={{fontSize:18,fontWeight:900,marginBottom:10}}>برداشت تومان</h2><p style={{fontSize:13,color:"var(--w-muted)",lineHeight:1.8,margin:0}}>برداشت تومان در Backend فعلی آن صراف به سرویس بانکی متصل نشده است؛ بنابراین فرم ثبت برداشت یا شماره کارت مقصد فعال نیست.</p></div>; }

// ── Withdraw Coin Tab ──────────────────────────────
function WithdrawCoinTab({ assets, kycStatus }: { assets:CryptoAsset[]; kycStatus:KycStatus }) {
  const [selAsset,setSelAsset]=useState(assets[0]);
  const [network,setNetwork]=useState("");
  const [address,setAddress]=useState("");
  const [wAmount,setWAmount]=useState("");
  const [step,setStep]=useState<"form"|"confirm"|"done">("form");
  const [otp,setOtp]=useState("");
  const [searchCoin,setSearchCoin]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const [message,setMessage]=useState("");
  if(kycStatus!=="verified")return <KycGate kycStatus={kycStatus}/>;
  const NETS:Record<string,string[]>={BTC:["BTC"],ETH:["ERC20"],BNB:["BEP20"],SOL:["SOL"],USDT:["TRC20","ERC20","BEP20"],default:["TRC20","ERC20","BEP20"]};
  const nets=NETS[selAsset.symbol]||NETS.default;
  const filtered=assets.filter(a=>a.symbol.includes(searchCoin.toUpperCase())||a.nameFa.includes(searchCoin)).slice(0,30);
  const submit=async()=>{
    if(otp.length!==6)return;
    setSubmitting(true);setMessage("");
    try{
      const token=window.localStorage.getItem("anpardaz:accessToken")??"";
      const response=await fetch(ANSARRAF_API_BASE+"/api/v1/withdrawals",{method:"POST",headers:{authorization:"Bearer "+token,"content-type":"application/json"},body:JSON.stringify({assetId:selAsset.id,amount:wAmount.trim(),network:network.trim(),destination:address.trim(),idempotencyKey:crypto.randomUUID()})});
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result?.error??"withdrawal_failed");
      setStep("done");
    }catch(error){
      const errors:any={insufficient_available_balance:"موجودی کافی نیست.",kyc_required:"احراز هویت لازم است.",asset_not_available:"این دارایی در آن صراف فعال نیست.",invalid_withdrawal:"اطلاعات برداشت نامعتبر است."};
      setMessage(errors[(error as Error).message]??"ثبت برداشت انجام نشد.");
    }finally{setSubmitting(false);}
  };
  if(step==="done")return <div style={{textAlign:"center",padding:"60px 24px"}}><div style={{width:64,height:64,borderRadius:"50%",background:"rgba(16,185,129,0.12)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",color:"#10b981"}}><WI n="check" s={30}/></div><div style={{fontSize:18,fontWeight:900,marginBottom:8}}>درخواست برداشت ثبت شد</div><div style={{fontSize:13,color:"var(--w-muted)",lineHeight:1.8,marginBottom:24}}>درخواست شما در Backend آن صراف ثبت شده و مطابق فرآیند تأیید و ارسال بررسی می‌شود.</div><button onClick={()=>{setStep("form");setAddress("");setWAmount("");setOtp("");setMessage("");}} className="w-btn w-btn-ghost">برداشت جدید</button></div>;
  if(step==="confirm")return <div style={{maxWidth:460,padding:"40px 0",margin:"0 auto"}}><div className="w-card" style={{padding:28}}><div style={{fontSize:16,fontWeight:900,marginBottom:14}}>تأیید درخواست برداشت</div><div style={{display:"grid",gap:9,fontSize:13,marginBottom:18}}><div>دارایی: <b>{selAsset.symbol}</b></div><div>شبکه: <b>{network}</b></div><div>مبلغ: <b>{wAmount}</b></div><div style={{wordBreak:"break-all"}}>مقصد: <b>{address}</b></div><div style={{color:"var(--w-muted)"}}>کارمزد شبکه از سرویس کیف پول دریافت می‌شود و مقدار ساختگی نمایش داده نمی‌شود.</div></div><input value={otp} onChange={e=>setOtp(e.target.value.replace(/\\D/g,"").slice(0,6))} maxLength={6} className="w-input" style={{textAlign:"center",fontSize:22,letterSpacing:7}} inputMode="numeric" placeholder="کد ۶ رقمی تأیید"/>{message&&<div style={{color:"#dc2626",fontSize:12,marginTop:9}}>{message}</div>}<div style={{display:"flex",gap:8,marginTop:16}}><button onClick={()=>setStep("form")} className="w-btn w-btn-ghost" style={{flex:1}}>بازگشت</button><button onClick={submit} disabled={otp.length!==6||submitting} className="w-btn w-btn-primary" style={{flex:1,opacity:otp.length===6&&!submitting?1:.5}}>{submitting?"در حال ثبت…":"تأیید و ثبت برداشت"}</button></div></div></div>;
  return <div style={{display:"flex",gap:20,padding:"24px 0",alignItems:"flex-start"}}><div style={{width:220,flexShrink:0}}><div style={{fontSize:14,fontWeight:800,marginBottom:10}}>انتخاب رمزارز</div><input value={searchCoin} onChange={e=>setSearchCoin(e.target.value)} placeholder="جستجو..." className="w-input" style={{marginBottom:8,fontSize:12}}/><div style={{background:"var(--w-card)",border:"1px solid var(--w-border)",borderRadius:10,overflow:"hidden",maxHeight:360,overflowY:"auto"}}>{filtered.map(a=><div key={a.id} onClick={()=>{setSelAsset(a);const ns=NETS[a.symbol]||NETS.default;setNetwork(ns[0]);}} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",cursor:"pointer",background:selAsset.id===a.id?"rgba(8,145,178,0.08)":"transparent",borderBottom:"1px solid var(--w-border)"}}><div style={{width:24,height:24,borderRadius:"50%",background:a.logoColor,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:8,fontWeight:900,flexShrink:0}}>{a.symbol.slice(0,3)}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:700}}>{a.nameFa}</div><div style={{fontSize:10,color:"var(--w-muted)"}}>{a.symbol}</div></div></div>)}</div></div><div style={{flex:1,maxWidth:520}}><div className="w-card" style={{padding:20}}><h3 style={{margin:"0 0 16px",fontSize:17,fontWeight:900}}>برداشت {selAsset.symbol}</h3><label style={{fontSize:11,fontWeight:700,color:"var(--w-muted)"}}>شبکه</label><select value={network} onChange={e=>setNetwork(e.target.value)} className="w-input" style={{margin:"6px 0 14px"}}>{nets.map(n=><option key={n} value={n}>{n}</option>)}</select><label style={{fontSize:11,fontWeight:700,color:"var(--w-muted)"}}>آدرس مقصد</label><input value={address} onChange={e=>setAddress(e.target.value)} placeholder={"آدرس "+selAsset.symbol+" روی "+network} className="w-input" style={{fontFamily:"monospace",fontSize:12,margin:"6px 0 14px"}}/><label style={{fontSize:11,fontWeight:700,color:"var(--w-muted)"}}>مقدار ({selAsset.symbol})</label><input value={wAmount} onChange={e=>setWAmount(e.target.value)} placeholder="مقدار واقعی برداشت" className="w-input" style={{margin:"6px 0 14px"}} inputMode="decimal"/><div style={{padding:"10px 12px",background:"var(--w-card2)",borderRadius:9,fontSize:12,marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"var(--w-muted)"}}>کارمزد شبکه</span><b>—</b></div><div style={{fontSize:11,color:"var(--w-muted)",marginTop:5}}>کارمزد فقط پس از دریافت از سرویس کیف پول نمایش داده می‌شود.</div></div><div style={{padding:"10px 12px",background:"rgba(220,38,38,0.06)",borderRadius:9,fontSize:11,color:"#dc2626",marginBottom:12}}>آدرس را با دقت بررسی کنید. تراکنش‌های ارز دیجیتال برگشت‌پذیر نیستند.</div>{message&&<div style={{color:"#dc2626",fontSize:12,marginBottom:10}}>{message}</div>}<button disabled={!address.trim()||!wAmount.trim()||!network} onClick={()=>setStep("confirm")} className="w-btn w-btn-primary" style={{padding:"12px",opacity:address.trim()&&wAmount.trim()&&network?1:.5}}>ادامه و تأیید</button></div></div></div>;
}
// ── Orders Tab ─────────────────────────────────────
function OrdersTab({ orders }: { orders:any[] }) {
  const [activeTab, setActiveTab] = useState<"open"|"history">("open");
  const rows = orders.filter(o => activeTab === "open" ? ["open","partially_filled"].includes(o.status) : !["open","partially_filled"].includes(o.status));
  return (
    <div style={{ padding:"20px 0" }}>
      <div style={{ display:"flex", gap:12, marginBottom:16 }}>
        {(["open","history"] as const).map(t => (
          <button key={t} onClick={()=>setActiveTab(t)} style={{ padding:"8px 20px", borderRadius:8, border:`1px solid ${activeTab===t?"rgba(8,145,178,0.4)":"var(--w-border)"}`, background:activeTab===t?"rgba(8,145,178,0.08)":"transparent", color:activeTab===t?"#0891b2":"var(--w-muted)", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"Vazirmatn" }}>
            {t==="open"?"سفارشات باز":"تاریخچه سفارشات"}
          </button>
        ))}
      </div>
      <div className="w-card" style={{ overflow:"hidden" }}>
        {rows.length === 0 ? (
          <div style={{ padding:"60px", textAlign:"center", color:"var(--w-muted)" }}>
            <WI n="document" s={40} style={{ opacity:0.2, marginBottom:12 }}/>
            <div style={{ fontSize:14, fontWeight:700 }}>{activeTab==="open"?"سفارش باز وجود ندارد":"تاریخچه‌ای یافت نشد"}</div>
            <div style={{ fontSize:12, marginTop:4 }}>این بخش فقط سفارش‌های واقعی حساب شما را نمایش می‌دهد.</div>
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead><tr style={{ background:"var(--w-card2)" }}>{["شناسه","بازار","سمت","نوع","مقدار","قیمت","وضعیت","تاریخ"].map(h=><th key={h} style={{ padding:"10px 12px", textAlign:"right", color:"var(--w-muted)" }}>{h}</th>)}</tr></thead>
              <tbody>{rows.map(o => (
                <tr key={o.id} style={{ borderBottom:"1px solid var(--w-border)" }}>
                  <td style={{ padding:"10px 12px", fontFamily:"monospace" }}>{o.id}</td>
                  <td style={{ padding:"10px 12px" }}>{o.base_asset_id}/{o.quote_asset_id}</td>
                  <td style={{ padding:"10px 12px", color:o.side==="buy"?"#10b981":"#f43f5e" }}>{o.side==="buy"?"خرید":"فروش"}</td>
                  <td style={{ padding:"10px 12px" }}>{o.order_type}</td>
                  <td style={{ padding:"10px 12px" }}>{o.quantity}</td>
                  <td style={{ padding:"10px 12px" }}>{o.price ?? "بازار"}</td>
                  <td style={{ padding:"10px 12px" }}>{o.status}</td>
                  <td style={{ padding:"10px 12px" }}>{new Date(o.created_at).toLocaleString("fa-IR")}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Transactions Tab ───────────────────────────────
function TransactionsTab({ orders, deposits, withdrawals, onSelectTx }: { orders:any[]; deposits:any[]; withdrawals:any[]; onSelectTx:(tx:any)=>void }) {
  const [txType, setTxType] = useState("all");
  const TXNS = [
    ...orders.map(o => ({ type:o.side==="buy"?"خرید":"فروش", amount:String(o.quantity), date:new Date(o.created_at).toLocaleDateString("fa-IR"), status:String(o.status), txid:String(o.id), color:o.side==="buy"?"#10b981":"#f43f5e" })),
    ...deposits.map(d => ({ type:"واریز", amount:String(d.amount), date:new Date(d.created_at).toLocaleDateString("fa-IR"), status:String(d.status), txid:String(d.id), color:"#0891b2" })),
    ...withdrawals.map(w => ({ type:"برداشت", amount:String(w.amount), date:new Date(w.created_at).toLocaleDateString("fa-IR"), status:String(w.status), txid:String(w.operation_id ?? w.id), color:"#d97706" })),
  ];
  const filtered = txType === "all" ? TXNS : TXNS.filter(t => t.type === txType);
  return (
    <div style={{ padding:"20px 0" }}>
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {["all","خرید","فروش","واریز","برداشت"].map(t=>(
          <button key={t} onClick={()=>setTxType(t)} className="w-btn w-btn-muted" style={{ padding:"7px 16px", borderColor:txType===t?"rgba(8,145,178,0.4)":"var(--w-border)", color:txType===t?"#0891b2":"var(--w-muted)" }}>{t==="all"?"همه":t}</button>
        ))}
      </div>
      <div className="w-card" style={{ overflow:"hidden" }}>
        {filtered.length===0 ? (
          <div style={{ padding:"60px", textAlign:"center", color:"var(--w-muted)" }}>هنوز تراکنش واقعی برای این حساب ثبت نشده است.</div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead><tr style={{ background:"var(--w-card2)" }}>{["نوع","مقدار","تاریخ","وضعیت","شناسه","جزئیات"].map(h=><th key={h} style={{ padding:"10px 14px", textAlign:"right", color:"var(--w-muted)", fontSize:11 }}>{h}</th>)}</tr></thead>
            <tbody>{filtered.map((tx,i)=>(
              <tr key={tx.txid+"-"+i} style={{ borderBottom:"1px solid var(--w-border)", cursor:"pointer" }} onClick={()=>onSelectTx(tx)}>
                <td style={{ padding:"12px 14px" }}><span style={{ padding:"3px 10px", borderRadius:6, background:`${tx.color}15`, color:tx.color, fontSize:12, fontWeight:700 }}>{tx.type}</span></td>
                <td style={{ padding:"12px 14px", fontWeight:800, color:tx.color }}>{tx.amount}</td>
                <td style={{ padding:"12px 14px" }}>{tx.date}</td>
                <td style={{ padding:"12px 14px" }}>{tx.status}</td>
                <td style={{ padding:"12px 14px", fontFamily:"monospace", fontSize:11 }}>{tx.txid}</td>
                <td style={{ padding:"12px 14px" }}>مشاهده</td>
              </tr>
            ))}</tbody>
          </table>
        )}
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
  return (
    <div style={{ padding:"24px 0", maxWidth:640 }}>
      <div style={{ fontSize:18, fontWeight:900, marginBottom:20 }}>کارمزدها</div>
      <div className="w-card" style={{ padding:"22px" }}>
        <div style={{ fontSize:13, fontWeight:800, marginBottom:8 }}>کارمزد واقعی حساب</div>
        <div style={{ fontSize:12, color:"var(--w-muted)", lineHeight:1.9 }}>
          نرخ کارمزد این حساب باید از تنظیمات واقعی بک‌اند و ارائه‌دهنده دریافت شود. هیچ نرخ یا سطح VIP ساختگی در رابط نمایش داده نمی‌شود.
        </div>
      </div>
    </div>
  );
}

// ── Security Tab ───────────────────────────────────
function SecurityTab() {
  return (
    <div style={{ padding:"24px 0", maxWidth:640 }}>
      <div style={{ fontSize:18, fontWeight:900, marginBottom:20 }}>امنیت حساب</div>
      <div className="w-card" style={{ padding:"22px" }}>
        <div style={{ fontSize:13, fontWeight:800, marginBottom:8 }}>مدیریت امنیت</div>
        <div style={{ fontSize:12, color:"var(--w-muted)", lineHeight:1.9 }}>
          وضعیت ۲FA، دستگاه‌ها و تنظیمات ضد فیشینگ تا زمان اتصال سرویس امنیت حساب از بک‌اند نمایش داده نمی‌شود.
        </div>
      </div>
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
    { id:"margin", label:"معامله تعهدی", sublabel:"مارجین", icon:"trending-up", color:"#7c3aed", desc:"API اجرایی معاملات تعهدی هنوز در بک‌اند آن صراف فعال نشده است.", badge:"فعلاً غیرفعال", onClick: ()=>{} },
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
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const estimated = side === "buy" ? (parseFloat(amount)||0)/asset.price : (parseFloat(amount)||0)*asset.price;
  const submit = async () => {
    if (!isLoggedIn) return onAuth();
    const input = Number(amount);
    if (!Number.isFinite(input) || input <= 0 || !Number.isFinite(asset.price) || asset.price <= 0) { setMessage("مقدار معامله معتبر نیست."); return; }
    const token = window.localStorage.getItem("anpardaz:accessToken") ?? "";
    if (!token) return onAuth();
    setSubmitting(true); setMessage("");
    try {
      const headers = { authorization:"Bearer " + token, "content-type":"application/json" };
      const [assetsR, kycR] = await Promise.all([
        fetch(ANSARRAF_API_BASE + "/api/v1/assets", { headers, cache:"no-store" }),
        fetch(ANSARRAF_API_BASE + "/api/v1/kyc", { headers, cache:"no-store" }),
      ]);
      const assetsBody = await assetsR.json().catch(()=>({}));
      const kycBody = await kycR.json().catch(()=>({}));
      const status = String(kycBody?.kyc?.status ?? "").toUpperCase();
      if (status && !["VERIFIED","APPROVED"].includes(status)) { setMessage("برای معامله ابتدا احراز هویت را تکمیل و تأیید کنید."); return; }
      const rows = Array.isArray(assetsBody?.assets) ? assetsBody.assets : [];
      const quote = rows.find((x:any) => String(x.symbol).toUpperCase() === "USDT");
      if (!quote) throw new Error("quote_asset_unavailable");
      const quantity = side === "buy" ? input / asset.price : input;
      const body:any = { baseAssetId:Number(asset.id), quoteAssetId:Number(quote.id), side, orderType:"market", quantity:quantity.toString(), idempotencyKey:crypto.randomUUID() };
      if (side === "buy") body.quoteAmount = input.toString();
      const response = await fetch(ANSARRAF_API_BASE + "/api/v1/orders", { method:"POST", headers, body:JSON.stringify(body) });
      const result = await response.json().catch(()=>({}));
      if (!response.ok) { const errors:any={insufficient_available_balance:"موجودی کافی نیست.",kyc_required:"احراز هویت لازم است.",invalid_order:"اطلاعات سفارش نامعتبر است."}; throw new Error(errors[result?.error] ?? "ثبت معامله انجام نشد."); }
      setDone(true);
    } catch (error) { setMessage((error as Error).message === "quote_asset_unavailable" ? "دارایی USDT در صراف در دسترس نیست." : ((error as Error).message || "ثبت معامله انجام نشد.")); }
    finally { setSubmitting(false); }
  };
  if (done) return (
    <div style={{ padding:"60px 24px", textAlign:"center", maxWidth:400, margin:"0 auto" }}>
      <div style={{ width:72, height:72, borderRadius:"50%", background:"rgba(16,185,129,0.12)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", color:"#10b981", fontSize:40 }}>✓</div>
      <div style={{ fontSize:22, fontWeight:900, marginBottom:8 }}>{side==="buy"?"خرید ثبت شد":"فروش ثبت شد"}</div>
      <div style={{ fontSize:14, color:"var(--w-muted)", marginBottom:6 }}>{amount} {side==="buy"?"USDT":asset.symbol}</div>
      <div style={{ fontSize:14, fontWeight:800, marginBottom:24 }}>سفارش واقعی در بک‌اند آن صراف ثبت شد.</div>
      <div style={{ display:"flex", gap:8, justifyContent:"center" }}><button onClick={()=>{setDone(false);setAmount("");}} className="w-btn w-btn-ghost">معامله جدید</button><button onClick={onBack} className="w-btn w-btn-primary">بازگشت</button></div>
    </div>
  );
  return (
    <div style={{ padding:"32px 0", maxWidth:440 }}>
      <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:"var(--w-muted)", fontSize:13, marginBottom:20 }}><WI n="arrow-right" s={13}/> انتخاب نوع معامله</button>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}><div style={{ width:44, height:44, borderRadius:"50%", background:asset.logoColor, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:13 }}>{asset.symbol.slice(0,3)}</div><div><div style={{ fontSize:16, fontWeight:900 }}>{asset.nameFa} ({asset.symbol})</div><div style={{ fontSize:13, fontWeight:800, color:clr(asset.change24h) }}>{Number.isFinite(asset.change24h) ? (asset.change24h>0?"+":"") + asset.change24h.toFixed(2) + "%" : "—"} · ${fmtP(asset.price)}</div></div></div>
      <div className="w-card" style={{ padding:"24px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", background:"var(--w-card2)", borderRadius:10, padding:3, marginBottom:20 }}><button onClick={()=>{setSide("buy");setMessage("")}} style={{ padding:"10px", borderRadius:8, border:"none", background:side==="buy"?"#10b981":"transparent", color:side==="buy"?"#fff":"var(--w-muted)", fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"Vazirmatn" }}>خرید {asset.symbol}</button><button onClick={()=>{setSide("sell");setMessage("")}} style={{ padding:"10px", borderRadius:8, border:"none", background:side==="sell"?"#f43f5e":"transparent", color:side==="sell"?"#fff":"var(--w-muted)", fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"Vazirmatn" }}>فروش {asset.symbol}</button></div>
        <div style={{ marginBottom:14 }}><div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--w-muted)", marginBottom:6 }}><span>{side==="buy"?"پرداخت می‌کنید":"می‌فروشید"}</span><span>موجودی از حساب واقعی دریافت می‌شود</span></div><div style={{ position:"relative" }}><input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" className="w-input" style={{ paddingLeft:56, fontSize:16 }} inputMode="decimal"/><span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:13, fontWeight:700, color:"var(--w-muted)" }}>{side==="buy"?"USDT":asset.symbol}</span></div></div>
        {amount && <div style={{ padding:"12px 14px", background:"var(--w-card2)", borderRadius:9, marginBottom:16 }}><div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4 }}><span style={{ color:"var(--w-muted)" }}>{side==="buy"?"دریافت می‌کنید":"معادل USDT"}</span><span style={{ fontWeight:800 }}>{estimated.toFixed(side==="buy"?6:2)} {side==="buy"?asset.symbol:"USDT"}</span></div><div style={{ fontSize:11, color:"var(--w-muted)" }}>قیمت بازار: ${fmtP(asset.price)} · کارمزد طبق تنظیمات واقعی حساب</div></div>}
        {message && <div style={{ padding:"10px 12px", background:"rgba(244,63,94,0.08)", color:"#f43f5e", borderRadius:8, fontSize:12, marginBottom:12 }}>{message}</div>}
        {!isLoggedIn ? <button onClick={onAuth} className="w-btn w-btn-primary" style={{ width:"100%", padding:"13px", background:side==="buy"?"#10b981":"#f43f5e" }}><WI n="lock" s={15}/> ورود برای معامله</button> : <button disabled={!amount || submitting} onClick={submit} className="w-btn w-btn-primary" style={{ width:"100%", padding:"13px", background:side==="buy"?"#10b981":"#f43f5e", opacity:amount && !submitting?1:0.5, fontSize:15 }}>{submitting ? "در حال ثبت..." : (side==="buy"?"خرید ":"فروش ") + asset.symbol}</button>}
      </div>
    </div>
  );
}
// ── Support Tab ────────────────────────────────────
function SupportTab({ isLoggedIn, onAuth }: { isLoggedIn:boolean; onAuth:()=>void }) { if(!isLoggedIn)return <div style={{padding:"60px 20px",textAlign:"center"}}><h2>پشتیبانی آن صراف</h2><p style={{color:"var(--w-muted)"}}>برای دسترسی وارد حساب شوید.</p><button className="w-btn w-btn-primary" onClick={onAuth}>ورود</button></div>; return <div className="w-card" style={{maxWidth:640,padding:24,marginTop:24}}><h2 style={{fontSize:18,fontWeight:900,marginBottom:10}}>پشتیبانی آن صراف</h2><p style={{fontSize:13,color:"var(--w-muted)",lineHeight:1.8,margin:0}}>سامانه تیکت/چت پشتیبانی آن صراف هنوز به Backend پشتیبانی متصل نشده است. برای جلوگیری از ثبت یا پاسخ ساختگی، این بخش تا اتصال سرویس واقعی غیرفعال است.</p></div>; }

function ForexBotTab({ asset:_asset }: { asset:CryptoAsset }) { return <div className="w-card" style={{maxWidth:640,padding:24,marginTop:24}}><h2 style={{fontSize:18,fontWeight:900,marginBottom:10}}>فارکس بات</h2><p style={{fontSize:13,color:"var(--w-muted)",lineHeight:1.8,margin:0}}>Execution واقعی Forex Bot و ثبت سود/زیان در Backend آن صراف فعلاً وجود ندارد؛ تا زمان ساخت API اجرایی، این بخش فعال نیست و هیچ معامله یا سود ساختگی نمایش داده نمی‌شود.</p></div>; }
