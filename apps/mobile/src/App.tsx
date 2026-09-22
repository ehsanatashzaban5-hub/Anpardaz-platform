function ExchangeChartPage({asset,coin,coins,user,favorites,onToggleFavorite,onBack,onInstant,onUpdate,onPairSelect}:{asset:string;coin:(typeof EX_COINS)[number];coins:typeof EX_COINS;user:UserData;favorites:string[];onToggleFavorite:(symbol:string)=>void;onBack:()=>void;onInstant:(asset:string)=>void;onUpdate:(u:UserData,tx:TxRecord)=>void;onPairSelect:(asset:string)=>void}){const liveRate=Number(coins.find(c=>c.symbol==="USDT")?.price??0);const tvTheme=localStorage.getItem("anp_theme")==="light"?"light":"dark";const [tab,setTab]=useState("آخرین سفارش‌ها"),[pairOpen,setPairOpen]=useState(false),[pairFilter,setPairFilter]=useState<"همه"|"تومان"|"دلار تتر">("تومان"),[pairSearch,setPairSearch]=useState(""),[orderSide,setOrderSide]=useState<"buy"|"sell"|null>(null),[orderType,setOrderType]=useState("قیمت بازار"),[orderAmount,setOrderAmount]=useState(""),[processing,setProcessing]=useState(false),[receipt,setReceipt]=useState<ReceiptData|null>(null);const favorite=favorites.includes(asset);const toggle=()=>onToggleFavorite(asset);const closeOrder=()=>{setOrderSide(null);setOrderAmount("")};const submitOrder=()=>{if(!Number(orderAmount)||!orderSide)return;setReceipt({title:"",status:"failed",detail:"ثبت معامله از این بخش تا اتصال کامل آن به Backend غیرفعال است؛ هیچ معامله ساختگی ثبت نمی‌شود."});};return <div className="chart-trade-page"><header className="protrade-head"><button className="back-btn" onClick={onBack}><Icon name="arrow" size={18}/></button><button className="pair-selector" onClick={()=>setPairOpen(true)}><PairLogos base={asset} baseSize={26} quoteSize={15}/><div className="ps-info"><div className="ps-pair-row"><b>{asset} / TMN</b><svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div><div className="ps-price-row"><span className="ps-price">{fa(Math.round(coin.price))} <small>تومان</small></span><em className={coin.change>=0?"ps-change positive":"ps-change negative"}>{coin.change>=0?"+":""}{faFixed(coin.change,2)}٪</em></div></div></button><button aria-label="افزودن به علاقه‌مندی‌ها" className={favorite?"pair-favorite active":"pair-favorite"} onClick={toggle}>{favorite?"★":"☆"}</button></header><div className="tv-chart-frame"><iframe title={`${asset} chart`} src={`https://www.tradingview.com/widgetembed/?symbol=BINANCE%3A${asset}USDT&interval=60&hidesidetoolbar=0&theme=${tvTheme}&style=1&timezone=Asia%2FTehran&withdateranges=1`} /></div><div className="chart-info-tabs">{["آخرین سفارش‌ها","لیست معامله‌ها","درباره ارز"].map(x=><button key={x} className={tab===x?"active":""} onClick={()=>setTab(x)}>{x}</button>)}</div>{tab==="درباره ارز"?<div className="chart-about"><b>{coin.fa}</b><p>نماد: {asset}</p><p>شبکه‌های پشتیبانی‌شده: {coin.networks.join("، ")}</p><p>قیمت و عمق بازار به‌صورت زنده به‌روزرسانی می‌شود.</p></div>:<div className="book-grid chart-book"><div><h3>فروشندگان</h3>{[1,2,3].map(i=><p className="ask" key={i}>{fa(Math.round(coin.price*(1+i/1000)))}<span>{faFixed(i*.14,4)}</span></p>)}<b className="mid">{fa(Math.round(coin.price))}</b><h3>خریداران</h3>{[1,2,3].map(i=><p className="bid" key={i}>{fa(Math.round(coin.price*(1-i/1000)))}<span>{faFixed(i*.12,4)}</span></p>)}</div><div><h3>{tab}</h3>{[1,2,3,4].map(i=><p key={i}>{toFaDigits(`۱۴:${30+i}`)}<span>{fa(Math.round(coin.price*(1+(i%2?1:-1)/2000)))}</span></p>)}</div></div>}<div className="sticky-trade"><button type="button" className="buy" onClick={()=>setOrderSide("buy")}>خرید</button><button type="button" className="sell" onClick={()=>setOrderSide("sell")}>فروش</button><button type="button" className="instant" onClick={()=>onInstant(asset)}>خرید و فروش آنی</button></div>{orderSide&&<div className="expage" dir="rtl" style={{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:50,overflowY:"auto"}}><div className="expage-header"><button className="back-btn" onClick={closeOrder}><Icon name="arrow" size={20}/></button><h2 className="expage-title">{orderSide==="buy"?"ثبت سفارش خرید":"ثبت سفارش فروش"} {asset}</h2><div style={{width:36}}/></div><div className="expage-body"><div className="chart-order-panel"><span className={orderSide==="buy"?"chart-order-symbol buy":"chart-order-symbol sell"}>{orderSide==="buy"?"خرید":"فروش"}</span><p>قیمت لحظه‌ای <b>{fa(Math.round(coin.price))} تومان</b></p><div className="chart-order-types">{["قیمت ثابت","قیمت بازار","حد ضرر"].map(type=><button type="button" key={type} className={orderType===type?"active":""} onClick={()=>setOrderType(type)}>{type}</button>)}</div>{orderType!=="قیمت بازار"&&<label>قیمت {orderType==="حد ضرر"?"فعال‌سازی":"سفارش"}<input inputMode="decimal" placeholder={fa(Math.round(coin.price))}/></label>}<label>مقدار {asset}<input autoFocus inputMode="decimal" value={toFaDigits(orderAmount)} onChange={e=>setOrderAmount(toLatinDigits(e.target.value).replace(/[^0-9.]/g,""))} placeholder="مقدار را وارد کنید"/></label><div className="chart-order-total"><span>مبلغ تقریبی</span><b>{fa(Math.round((Number(orderAmount)||0)*coin.price))} تومان</b></div><button className={orderSide==="buy"?"chart-order-submit buy":"chart-order-submit sell"} disabled={!Number(orderAmount)||processing} onClick={submitOrder}>{orderSide==="buy"?"ثبت سفارش خرید":"ثبت سفارش فروش"}</button></div></div>{processing&&<AnPardazLoadingOverlay text="در حال ثبت سفارش..."/>}</div>}{pairOpen&&<div className="expage" dir="rtl" style={{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:50,overflowY:"auto"}}><div className="expage-header"><button className="back-btn" onClick={()=>setPairOpen(false)}><Icon name="arrow" size={20}/></button><h2 className="expage-title">انتخاب جفت ارز</h2><div style={{width:36}}/></div><div className="expage-body"><div className="market-filters">{(["همه","تومان","دلار تتر"] as const).map(x=><button className={pairFilter===x?"active":""} onClick={()=>setPairFilter(x)} key={x}>{x}</button>)}</div><div className="exchange-asset-search"><Icon name="search" size={16}/><input value={pairSearch} onChange={e=>setPairSearch(e.target.value)} placeholder="جستجوی ارز"/></div><div className="pair-picker-grid">{coins.filter(c=>(c.symbol+c.fa).toLowerCase().includes(pairSearch.toLowerCase())).flatMap(c=>pairFilter==="همه"?[{c,p:"TMN"},{c,p:"USDT"}]:[{c,p:pairFilter==="تومان"?"TMN":"USDT"}]).filter(({c,p})=>c.symbol!==p).map(({c,p})=><button key={`${c.symbol}${p}`} className="pair-card" onClick={()=>{onPairSelect(c.symbol);setPairOpen(false)}}><PairLogos base={c.symbol} quote={p} baseSize={36} quoteSize={20}/><b>{c.symbol} / {p}</b><small>{p==="TMN"?fa(Math.round(c.price))+" تومان":faFixed(c.price/liveRate,3)+" دلار تتر"}</small><em className={c.change>=0?"pp-up":"pp-down"}>{Number.isFinite(c.change)?(c.change>=0?"+":"")+faFixed(c.change,2)+"٪":"—"}</em></button>)}</div></div></div>}{!orderSide&&!pairOpen&&processing&&<AnPardazLoadingOverlay text="در حال ثبت سفارش..."/>}{receipt&&<TransactionReceipt data={receipt} onClose={()=>setReceipt(null)}/>}</div>}
function MarginChartPage({asset:initAsset,coin:initCoin,coins,user,favorites,onToggleFavorite,onBack,onUpdate,onAssetChange}:{asset:string;coin:(typeof EX_COINS)[number];coins:typeof EX_COINS;user:UserData;favorites:string[];onToggleFavorite:(s:string)=>void;onBack:()=>void;onUpdate:(u:UserData,tx:TxRecord)=>void;onAssetChange:(s:string)=>void}){\n  const liveRate=Number(coins.find(c=>c.symbol==="USDT")?.price??0);
  const tvTheme=localStorage.getItem("anp_theme")==="light"?"light":"dark";
  const [asset,setAsset]=useState(initAsset);
  const [coin,setCoin]=useState(initCoin);
  useEffect(()=>{const c=coins.find(x=>x.symbol===asset);if(c)setCoin(c);},[asset,coins]);
  const [side,setSide]=useState<"long"|"short">("long"),[orderType,setOrderType]=useState("بازار"),[amount,setAmount]=useState(""),[priceInput,setPriceInput]=useState(""),[lev,setLev]=useState(5),[sl,setSl]=useState(""),[marginSubView,setMarginSubView]=useState<null|"confirm"|"pair">(null),[processing,setProcessing]=useState(false),[pairFilter,setPairFilter]=useState<"همه"|"تومان"|"دلار تتر">("تومان"),[pairSearch,setPairSearch]=useState(""),[receipt,setReceipt]=useState<ReceiptData|null>(null),[selectedPct,setSelectedPct]=useState<number|null>(null);  const [liveMarginToman,setLiveMarginToman]=useState(0);useEffect(()=>{let active=true;const load=async()=>{try{const w=await sarrafWalletMap();if(active)setLiveMarginToman(Number(w.TMN??0));}catch{if(active)setLiveMarginToman(0);}};void load();const id=window.setInterval(()=>void load(),5000);return()=>{active=false;window.clearInterval(id)}},[user.uid]);
  const favorite=favorites.includes(asset);
  const price=orderType==="قیمت ثابت"?(Number(priceInput)||coin.price):coin.price;
  const qty=Number(amount)||0,total=price*qty,fee=total*.003,margin=total/lev;
  const liq=side==="long"?price*(1-1/lev*.82):price*(1+1/lev*.82);
  const risk=lev>=20?"زیاد ⚠️":lev>=5?"متوسط":"پایین";
  const percent=(x:number)=>{setAmount(String(liveMarginToman*lev*x/100/price));setSelectedPct(x);};
  const [chartPositions,setChartPositions]=useState<ExPosition[]>([]);
  const closeChartPosition=(_pos:ExPosition,_currentPrice:number)=>{setReceipt({title:"",status:"failed",detail:"بستن موقعیت تا اتصال موتور واقعی Backend غیرفعال است."});};const exec=async()=>{if(mode==="margin"){setConfirm(false);setReceipt({title:"",status:"failed",detail:"معامله تعهدی هنوز به موتور اجرای واقعی Backend متصل نشده است؛ هیچ سفارش یا سود/زیان ساختگی ثبت نمی‌شود."});return}setProcessing(true);try{const type=orderType==="قیمت ثابت"?"limit":"market";const result=await sarrafPlaceOrder(asset,"TMN",side as "buy"|"sell",type,qty,type==="limit"?price:undefined,side==="buy"&&type==="market"?total:undefined);setConfirm(false);setAmount("");setSelectedPct(null);setReceipt({title:"سفارش آن صراف ثبت شد",status:"success",amount:faFixed(qty,6)+" "+asset,destination:"شناسه سفارش: "+String(result?.order?.id??result?.orderId??"—"),detail:"سفارش به Backend ارسال شد و وضعیت آن از تاریخچه واقعی پیگیری می‌شود."});const w=await sarrafWalletMap();setLiveWallets(w);const o=await sarrafOrders();setOrders(o as any);}catch(e){setReceipt({title:"",status:"failed",detail:e instanceof Error?e.message:"ثبت سفارش انجام نشد."});}finally{setProcessing(false)}};;const closePosition=()=>{setReceipt({title:"",status:"failed",detail:"بستن موقعیت تا اتصال کامل به Backend غیرفعال است؛ هیچ P&L محلی ثبت نمی‌شود."});};;const percent=(x:number)=>{setAmount(String((mode==="margin"?exToman*lev:exUsdt)*x/100/price));setSelectedPct(x);};if(picker==="chart"&&mode==="spot")return <ExchangeChartPage asset={asset} coin={coin} coins={coins} user={user} favorites={favorites} onToggleFavorite={onToggleFavorite} onBack={()=>setPicker(false)} onInstant={(next)=>onNavigate("instant",next)} onUpdate={onUpdate} onPairSelect={(next)=>{setAsset(next);onAssetChange(next)}}/>;if(picker==="chart"&&mode==="margin")return <MarginChartPage asset={asset} coin={coin} coins={coins} user={user} favorites={favorites} onToggleFavorite={onToggleFavorite} onBack={()=>setPicker(false)} onUpdate={onUpdate} onAssetChange={(next)=>{setAsset(next);onAssetChange(next)}}/>;return <div className="terminal-page"><header className="terminal-header"><button className="back-btn" onClick={onBack}><Icon name="arrow" size={17}/></button><button className="pair-selector" onClick={()=>setPicker(true)}><PairLogos base={asset} baseSize={26} quoteSize={15}/><div className="ps-info"><div className="ps-pair-row"><b>{asset} / TMN</b><svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div><div className="ps-price-row"><span className="ps-price">{fa(Math.round(coin.price))} <small>تومان</small></span><em className={coin.change>=0?"ps-change positive":"ps-change negative"}>{coin.change>=0?"+":""}{faFixed(coin.change,2)}٪</em></div></div></button><button className="candle-icon" onClick={()=>setPicker("chart" as any)}><i/><i/><i/></button><button aria-label="افزودن به علاقه‌مندی‌ها" className={favorite?"pair-favorite active":"pair-favorite"} onClick={toggleFavorite}>{favorite?"★":"☆"}</button></header><div className="terminal-status"><span>قیمت زنده: {Number.isFinite(coin.price)&&coin.price>0?fa(Math.round(coin.price))+" تومان":"—"}</span><span>دفتر سفارش: داده واقعی هنوز دریافت نشده</span><b>● وضعیت بازار</b></div><main className="terminal-grid"><section className="terminal-book"><h2>خریداران / فروشندگان</h2><div className="book-head"><span>قیمت</span><span>مقدار</span><span>مجموع</span></div><div className="book-sells"><b>دفتر سفارش</b><div className="exchange-empty">دفتر سفارش زنده هنوز از Backend دریافت نشده است.</div></div></section><section className="terminal-form"><div className="terminal-tabs"><button className={side==="buy"||side==="long"?"active buy":""} onClick={()=>setSide(mode==="spot"?"buy":"long")}>{mode==="spot"?"خرید":"خرید (لانگ)"}</button><button className={side==="sell"||side==="short"?"active sell":""} onClick={()=>setSide(mode==="spot"?"sell":"short")}>{mode==="spot"?"فروش":"فروش (شورت)"}</button></div>{mode==="margin"&&<div className="terminal-leverage"><span>اهرم</span>{[1,2,3,5,10,20,50,100].map(x=><button className={lev===x?"active":""} onClick={()=>setLev(x)} key={x}>{x}x</button>)}</div>}<div className="terminal-order-types">{["قیمت ثابت","بازار","حد ضرر"].map(x=><button className={orderType===x?"active":""} onClick={()=>setOrderType(x)} key={x}>{x}</button>)}</div>{orderType!=="بازار"&&<label>قیمت {mode==="margin"?"ورود":""}<input value={toFaDigits(priceInput)} onChange={e=>setPriceInput(toLatinDigits(e.target.value).replace(/[^0-9.]/g,""))} placeholder={fa(Math.round(coin.price))}/></label>}<label>مقدار<input value={toFaDigits(amount)} onChange={e=>setAmount(toLatinDigits(e.target.value).replace(/[^0-9.]/g,""))} placeholder={`${asset} مقدار`}/></label>{mode==="margin"&&<><div className="terminal-risk"><span>وجه تضمین<b>{fa(Math.round(margin))}</b></span><span>لیکویید<b>{fa(Math.round(liq))}</b></span><span>ریسک<b>{lev>=20?"زیاد":"متوسط"}</b></span></div></>}<label>مجموع<input readOnly value={fa(Math.round(total))} placeholder="مجموع"/></label><small>در دسترس: {mode==="spot"?(side==="buy"||side==="long"?`${faFixed(exUsdt,2)} USDT`:`${faFixed(exBase,4)} ${asset}`):`${fa(Math.round(exToman))} تومان`}</small><div className="percent-row">{[25,50,75,100].map(x=><button className={selectedPct===x?"pct-selected":""} onClick={()=>percent(x)} key={x}>{x}٪</button>)}</div><button className={`terminal-submit ${side==="buy"||side==="long"?"buy":"sell"}`} onClick={place}>{mode==="margin"?(side==="long"?"باز کردن لانگ":"باز کردن شورت"):(side==="buy"?"خرید":"فروش")}</button></section></main><section className="recent-trades"><h2>آخرین معامله‌ها</h2><div className="exchange-empty">معاملات اخیر زنده هنوز از Backend دریافت نشده است.</div></section><nav className="terminal-bottom-tabs">{(mode==="spot"?["سفارش‌های باز","سفارش‌های بسته شده","تاریخچه سفارش‌ها","تاریخچه معامله‌ها"]:["موقعیت‌های باز","سفارش‌های باز","تاریخچه موقعیت‌ها","تاریخچه معامله‌ها"]).map(x=><button className={bottom===x?"active":""} onClick={()=>setBottom(x)} key={x}>{x}</button>)}</nav><section className="terminal-bottom-content">{mode==="spot"?(<>{(()=>{const filtered=bottom==="سفارش‌های باز"?orders.filter(o=>o.mode==="spot"&&o.status==="open"):bottom==="سفارش‌های بسته شده"?orders.filter(o=>o.mode==="spot"&&o.status==="filled"):bottom==="تاریخچه سفارش‌ها"?orders.filter(o=>o.mode==="spot"):orders.filter(o=>o.mode==="spot"&&o.status==="filled");const allSpot=filtered;return filtered.length===0?<div className="empty-orders"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".3"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="16" x2="12" y2="16"/></svg><span>{bottom==="سفارش‌های باز"?"سفارش باز وجود ندارد":bottom==="سفارش‌های بسته شده"?"سفارش بسته‌ای یافت نشد":"تاریخچه‌ای یافت نشد"}</span></div>:<div className="orders-table"><div className="orders-head"><span>ارز</span><span>نوع</span><span>قیمت</span><span>مقدار</span><span>وضعیت</span></div>{filtered.map(o=><div key={o.id} className="order-row"><span><b>{o.pair}</b></span><span className={o.side==="buy"?"buy-label":"sell-label"}>{o.side==="buy"?"خرید":"فروش"}</span><span>{fa(Math.round(o.price))}</span><span>{faFixed(o.amount,4)}</span><span className={`order-status ${o.status}`}>{o.status==="filled"?"تکمیل":o.status==="open"?"باز":"لغو"}</span></div>)}</div>})()}</>):(bottom==="موقعیت‌های باز"?positions.length===0?<div className="empty-orders"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".3"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>موقعیت باز وجود ندارد</span></div>:<div className="positions-list">{positions.map(pos=>{const c=coins.find(x=>x.symbol===pos.asset)??coins[0];const pnl=pos.side==="long"?(c.price-pos.entry)*pos.qty*pos.leverage:(pos.entry-c.price)*pos.qty*pos.leverage;const roe=pos.margin>0?pnl/pos.margin*100:0;return <div key={pos.id} className="position-card"><div className="pos-top"><div className="pos-left"><span className={pos.side==="long"?"pos-side long":"pos-side short"}>{pos.side==="long"?"لانگ ↑":"شورت ↓"}</span><b className="pos-pair">{pos.asset}/TMN</b><span className="pos-lev">{pos.leverage}x</span></div><button className="close-pos-btn" onClick={()=>closePosition(pos,c.price)}>بستن موقعیت</button></div><div className="pos-grid"><div><span>قیمت ورود</span><b>{fa(Math.round(pos.entry))}</b></div><div><span>قیمت فعلی</span><b>{fa(Math.round(c.price))}</b></div><div><span>مقدار</span><b>{faFixed(pos.qty,4)}</b></div><div><span>وجه تضمین</span><b>{fa(Math.round(pos.margin))}</b></div><div><span>سود / زیان</span><b className={pnl>=0?"pnl-pos":"pnl-neg"}>{pnl>=0?"+":""}{fa(Math.round(pnl))} ت</b></div><div><span>ROE٪</span><b className={roe>=0?"pnl-pos":"pnl-neg"}>{roe>=0?"+":""}{faFixed(roe,2)}٪</b></div></div></div>})}</div>:<div className="empty-orders"><span>تاریخچه‌ای یافت نشد</span></div>)}</section>{picker===true&&<div className="expage" dir="rtl" style={{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:50}}><div className="expage-header"><button className="back-btn" onClick={()=>setPicker(false)}><Icon name="arrow" size={20}/></button><h2 className="expage-title">انتخاب جفت ارز</h2><div style={{width:36}}/></div><div className="expage-body"><div className="market-filters">{(["همه","تومان","دلار تتر"] as const).map(x=><button key={x} className={pairFilter===x?"active":""} onClick={()=>setPairFilter(x)}>{x}</button>)}</div><div className="exchange-asset-search"><Icon name="search" size={16}/><input value={pairSearch} onChange={e=>setPairSearch(e.target.value)} placeholder="جستجوی ارز"/></div><div className="pair-picker-grid">{coins.filter(c=>(c.symbol+c.fa).toLowerCase().includes(pairSearch.toLowerCase())).flatMap(c=>pairFilter==="همه"?[{c,p:"TMN"},{c,p:"USDT"}]:[{c,p:pairFilter==="تومان"?"TMN":"USDT"}]).filter(({c,p})=>c.symbol!==p).map(({c,p})=><button key={`${c.symbol}${p}`} className="pair-card" onClick={()=>{setAsset(c.symbol);onAssetChange(c.symbol);setPicker(false)}}><PairLogos base={c.symbol} quote={p} baseSize={36} quoteSize={20}/><b>{c.symbol} / {p}</b><small>{p==="TMN"?fa(Math.round(c.price))+" تومان":liveRate>0?faFixed(c.price/liveRate,3):"—"+" دلار تتر"}</small><em className={c.change>=0?"pp-up":"pp-down"}>{Number.isFinite(c.change)?(c.change>=0?"+":"")+faFixed(c.change,2)+"٪":"—"}</em></button>)}</div></div></div>}{confirm&&<div className="expage" dir="rtl" style={{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:50}}><div className="expage-header"><button className="back-btn" onClick={()=>setConfirm(false)}><Icon name="arrow" size={20}/></button><h2 className="expage-title">تأیید سفارش</h2><div style={{width:36}}/></div><div className="expage-body"><div className="exchange-confirm-lines"><div><span>نوع سفارش</span><b>{orderType}</b></div><div><span>نوع معامله</span><b>{side}</b></div><div><span>مقدار</span><b>{faFixed(qty,5)}</b></div><div><span>مجموع</span><b>{fa(Math.round(total+fee))}</b></div></div><div className="confirm-actions"><button className="outline-button" onClick={()=>setConfirm(false)}>انصراف</button><button className="primary-button" onClick={exec} disabled={processing}>تأیید</button></div></div></div>}{processing&&<AnPardazLoadingOverlay text="در حال انجام سفارش..."/>}</div>}
function ExchangeProTrade({mode,initialAsset,user,coins,onBack,onUpdate,onNavigate,onAssetChange,favorites,onToggleFavorite}:{mode:"spot"|"margin";initialAsset:string;user:UserData;coins:typeof EX_COINS;onBack:()=>void;onUpdate:(u:UserData,tx:TxRecord)=>void;onNavigate:(target:"instant",asset:string)=>void;onAssetChange:(asset:string)=>void;favorites:string[];onToggleFavorite:(symbol:string)=>void}){
  const [asset,setAsset]=useState(initialAsset),[side,setSide]=useState<"buy"|"sell">("buy"),[orderType,setOrderType]=useState<"بازار"|"قیمت ثابت">("بازار"),[amount,setAmount]=useState(""),[priceInput,setPriceInput]=useState(""),[processing,setProcessing]=useState(false),[message,setMessage]=useState(""),[bids,setBids]=useState<any[]>([]),[asks,setAsks]=useState<any[]>([]),[liveWallets,setLiveWallets]=useState<Record<string,number>>({});
  const coin=coins.find(c=>c.symbol===asset)??coins[0];
  const livePrice=Number(coin?.price??0), limitPrice=Number(priceInput)||0, executionPrice=orderType==="قیمت ثابت"?limitPrice:livePrice, qty=Number(amount)||0, total=qty*executionPrice, fee=total*0.003;
  const baseBalance=Number(liveWallets[String(asset).toUpperCase()]??0), tomanBalance=Number(liveWallets.TMN??0), favorite=favorites.includes(asset);
  useEffect(()=>{let active=true;const load=async()=>{try{const [w,b]=await Promise.all([sarrafWalletMap(),sarrafOrderBook(asset+"/TMN")]);if(!active)return;setLiveWallets(w);setBids(b.bids.map((x:any)=>Array.isArray(x)?{price:Number(x[0]),amount:Number(x[1])}:{price:Number(x.price),amount:Number(x.amount)}).filter((x:any)=>x.price>0&&x.amount>0));setAsks(b.asks.map((x:any)=>Array.isArray(x)?{price:Number(x[0]),amount:Number(x[1])}:{price:Number(x.price),amount:Number(x.amount)}).filter((x:any)=>x.price>0&&x.amount>0));}catch{if(active){setBids([]);setAsks([]);setLiveWallets({});}}};void load();const id=window.setInterval(()=>void load(),3000);return()=>{active=false;clearInterval(id)}},[asset]);
  const submit=async()=>{setMessage("");if(mode==="margin"){setMessage("معامله تعهدی هنوز API اجرایی واقعی در Backend ندارد؛ برای جلوگیری از نمایش یا ثبت داده ساختگی غیرفعال است.");return;}if(!qty||qty<=0){setMessage("مقدار سفارش را وارد کنید.");return;}if(orderType==="قیمت ثابت"&&(!limitPrice||limitPrice<=0)){setMessage("قیمت سفارش را وارد کنید.");return;}if(!livePrice||livePrice<=0){setMessage("قیمت لحظه‌ای این بازار در دسترس نیست.");return;}if(side==="buy"&&orderType==="بازار"&&total+fee>tomanBalance){setMessage("موجودی تومان کافی نیست.");return;}if(side==="sell"&&qty>baseBalance){setMessage("موجودی "+asset+" کافی نیست.");return;}setProcessing(true);try{const result=await sarrafPlaceOrder(asset,"TMN",side,orderType==="بازار"?"market":"limit",qty,orderType==="قیمت ثابت"?limitPrice:undefined,side==="buy"?total:undefined);setMessage("سفارش واقعی ثبت شد؛ شناسه: "+String(result?.order?.id??result?.orderId??"—"));setAmount("");setPriceInput("");setLiveWallets(await sarrafWalletMap());}catch(e){setMessage(e instanceof Error?e.message:"ثبت سفارش انجام نشد.");}finally{setProcessing(false);}};
  const fmtBook=(v:number)=>v>0?fa(Math.round(v)):"—";
  return <div className="terminal-page"><header className="terminal-header"><button className="back-btn" onClick={onBack}><Icon name="arrow" size={17}/></button><button className="pair-selector" onClick={()=>onAssetChange(asset)}><PairLogos base={asset} quote="TMN" baseSize={26} quoteSize={15}/><div className="ps-info"><div className="ps-pair-row"><b>{asset} / TMN</b></div><div className="ps-price-row"><span className="ps-price">{livePrice>0?fmtBook(livePrice):"—"} <small>تومان</small></span><em className={Number.isFinite(coin.change)&&coin.change>=0?"ps-change positive":"ps-change negative"}>{Number.isFinite(coin.change)?(coin.change>=0?"+":"")+faFixed(coin.change,2)+"٪":"—"}</em></div></div></button><button className={favorite?"pair-favorite active":"pair-favorite"} onClick={()=>onToggleFavorite(asset)}>{favorite?"★":"☆"}</button></header>
    <div className="terminal-status"><span>قیمت زنده: {livePrice>0?fmtBook(livePrice)+" تومان":"—"}</span><span>دفتر سفارش: {bids.length||asks.length?"زنده":"در دسترس نیست"}</span><b>{mode==="margin"?"● تعهدی غیرفعال":"● اتصال Backend"}</b></div>
    <main className="terminal-grid"><section className="terminal-book"><h2>دفتر سفارش</h2><div className="book-head"><span>قیمت</span><span>مقدار</span><span>مجموع</span></div>{asks.length?<div className="book-sells"><b>فروشندگان</b>{asks.slice(0,7).map((l:any,i:number)=><p key={i}><span>{fmtBook(l.price)}</span><span>{faFixed(l.amount,6)}</span><span>{fmtBook(l.price*l.amount)}</span></p>)}</div>:<div className="empty-orders">داده واقعی فروشندگان در دسترس نیست.</div>}<div className="book-mid"><b>{livePrice>0?fmtBook(livePrice):"—"}</b></div>{bids.length?<div className="book-buys"><b>خریداران</b>{bids.slice(0,7).map((l:any,i:number)=><p key={i}><span>{fmtBook(l.price)}</span><span>{faFixed(l.amount,6)}</span><span>{fmtBook(l.price*l.amount)}</span></p>)}</div>:<div className="empty-orders">داده واقعی خریداران در دسترس نیست.</div>}</section>
    <section className="terminal-form"><div className="terminal-tabs"><button className={side==="buy"?"active buy":""} onClick={()=>setSide("buy")}>خرید</button><button className={side==="sell"?"active sell":""} onClick={()=>setSide("sell")}>فروش</button></div>{mode==="margin"&&<div className="warning-box">معامله تعهدی تا ایجاد API اجرایی واقعی Backend غیرفعال است.</div>}<div className="terminal-order-types"><button className={orderType==="قیمت ثابت"?"active":""} onClick={()=>setOrderType("قیمت ثابت")}>قیمت ثابت</button><button className={orderType==="بازار"?"active":""} onClick={()=>setOrderType("بازار")}>بازار</button></div>{orderType==="قیمت ثابت"&&<label>قیمت سفارش<input value={toFaDigits(priceInput)} onChange={e=>setPriceInput(toLatinDigits(e.target.value).replace(/[^0-9.]/g,""))} placeholder={livePrice>0?fa(Math.round(livePrice)):"—"}/></label>}<label>مقدار {asset}<input value={toFaDigits(amount)} onChange={e=>setAmount(toLatinDigits(e.target.value).replace(/[^0-9.]/g,""))} placeholder="مقدار واقعی سفارش"/></label><label>مجموع<input readOnly value={executionPrice>0&&qty>0?fa(Math.round(total)):"—"}/></label><small>موجودی واقعی: {side==="buy"?fa(tomanBalance)+" تومان":faFixed(baseBalance,8)+" "+asset}</small>{message&&<div className="warning-box">{message}</div>}<button className={"terminal-submit "+(side==="buy"?"buy":"sell")} onClick={submit} disabled={processing||mode==="margin"}>{processing?"در حال ثبت…":mode==="margin"?"تعهدی فعلاً غیرفعال":"ثبت سفارش واقعی"}</button></section></main>
    <section className="recent-trades"><h2>آخرین معاملات</h2><div className="empty-orders">تا اتصال feed معاملات واقعی، معامله ساختگی نمایش داده نمی‌شود.</div></section></div>;
}
function ExchangeChartPage({asset,coin,coins,user,favorites,onToggleFavorite,onBack,onInstant,onUpdate,onPairSelect}:{asset:string;coin:(typeof EX_COINS)[number];coins:typeof EX_COINS;user:UserData;favorites:string[];onToggleFavorite:(symbol:string)=>void;onBack:()=>void;onInstant:(asset:string)=>void;onUpdate:(u:UserData,tx:TxRecord)=>void;onPairSelect:(asset:string)=>void}){const tvTheme=localStorage.getItem("anp_theme")==="light"?"light":"dark";return <div className="chart-trade-page"><header className="protrade-head"><button className="back-btn" onClick={onBack}><Icon name="arrow" size={18}/></button><div className="ps-info"><div className="ps-pair-row"><b>{asset} / USDT</b></div><div className="ps-price-row"><span className="ps-price">{coin.price>0?fa(Math.round(coin.price)):"—"} <small>تومان</small></span><em>{Number.isFinite(coin.change)?(coin.change>=0?"+":"")+faFixed(coin.change,2)+"٪":"—"}</em></div></div><button className={favorites.includes(asset)?"pair-favorite active":"pair-favorite"} onClick={()=>onToggleFavorite(asset)}>{favorites.includes(asset)?"★":"☆"}</button></header><div className="tv-chart-frame"><iframe title={asset+" chart"} src={"https://www.tradingview.com/widgetembed/?symbol=BINANCE%3A"+asset+"USDT&interval=60&hidesidetoolbar=0&theme="+tvTheme+"&style=1&timezone=Asia%2FTehran&withdateranges=1"}/></div><div className="chart-about"><b>{coin.fa}</b><p>قیمت و بازار از Backend آن صراف دریافت می‌شود؛ نمودار خارجی فقط برای نمایش تصویری بازار است.</p><p>سفارش‌گذاری از این نمودار تا اتصال مستقیم به feed سفارش همان بازار انجام نمی‌شود.</p></div><button className="primary-button" onClick={()=>onInstant(asset)}>خرید و فروش آنی</button></div>}
function MarginChartPage({asset,coin,onBack}:{asset:string;coin:(typeof EX_COINS)[number];coins?:typeof EX_COINS;user?:UserData;favorites?:string[];onToggleFavorite?:(s:string)=>void;onUpdate?:(u:UserData,tx:TxRecord)=>void;onAssetChange?:(s:string)=>void}){return <div className="chart-trade-page"><header className="protrade-head"><button className="back-btn" onClick={onBack}><Icon name="arrow" size={18}/></button><div className="ps-info"><b>{asset} / TMN</b><div className="ps-price-row"><span className="ps-price">{coin.price>0?fa(Math.round(coin.price)):"—"} <small>تومان</small></span></div></div></header><div className="warning-box" style={{margin:16}}>داده و اجرای معامله تعهدی تا اتصال کامل موتور واقعی Backend غیرفعال است. هیچ دفتر سفارش، قیمت، P&amp;L یا موقعیت ساختگی نمایش داده نمی‌شود.</div></div>}
function CandleChart({price}:{price:number}){return <div className="candle-chart" dir="rtl"><div className="chart-mode"><b>کندل</b><span>{Number.isFinite(price)&&price>0?<>قیمت زنده: {fa(Math.round(price))} تومان</>:<>قیمت زنده در دسترس نیست</>}</span></div><div style={{minHeight:122,display:"grid",placeItems:"center",color:"var(--text-muted)",fontSize:12,padding:20,textAlign:"center"}}>داده کندل تاریخی/زنده هنوز از Backend دریافت نشده است.<br/>هیچ کندل ساختگی نمایش داده نمی‌شود.</div></div>}

function ExchangeDepositFlow({coins,onClose,onToman}:{coins:typeof EX_COINS;onClose:()=>void;onToman:()=>void}){const [asset,setAsset]=useState<string|null>(null),[search,setSearch]=useState("");const coin=coins.find(c=>c.symbol===asset);if(!asset)return <div className="expage" dir="rtl"><div className="expage-header"><button className="back-btn" onClick={onClose}><Icon name="arrow" size={20}/></button><h2 className="expage-title">انتخاب دارایی برای واریز</h2><div style={{width:36}}/></div><div className="expage-body"><button onClick={onToman} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",borderRadius:16,background:"rgba(0,214,176,0.08)",border:"1.5px solid rgba(0,214,176,0.25)",cursor:"pointer",textAlign:"right",fontFamily:"Vazirmatn",color:"var(--text-primary)",width:"100%",boxSizing:"border-box"}}><img src={TMN_FLAG_LOGO} width={42} height={42} style={{borderRadius:"50%",flexShrink:0}} alt="تومان"/><div style={{flex:1}}><div style={{fontWeight:800,fontSize:16}}>تومان</div><div style={{fontSize:12,color:"var(--text-muted)",marginTop:3}}>TMN · واریز بانکی</div></div></button><div style={{fontSize:13,color:"var(--text-muted)",margin:"18px 0 10px",fontWeight:700}}>ارزهای دیجیتال</div><div className="exchange-asset-search"><Icon name="search" size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجوی ارز..."/></div><div style={{display:"flex",flexDirection:"column",gap:7,marginTop:12}}>{coins.filter(c=>(c.symbol+c.fa).toLowerCase().includes(search.toLowerCase())).map(c=><button key={c.symbol} onClick={()=>setAsset(c.symbol)} className="asset-row"><CoinLogo symbol={c.symbol} size={38}/><div style={{flex:1,textAlign:"right"}}><div style={{fontWeight:700,fontSize:15}}>{c.fa}</div><div style={{fontSize:12,color:"var(--text-muted)",marginTop:3}}>{c.symbol}</div></div><Icon name="arrow" size={16}/></button>)}</div></div></div>;return <div className="expage" dir="rtl"><div className="expage-header"><button className="back-btn" onClick={()=>setAsset(null)}><Icon name="arrow" size={20}/></button><h2 className="expage-title">واریز ${coin?.fa??""}</h2><div style={{width:36}}/></div><div className="expage-body"><div className="warning-box"><b>آدرس واریز واقعی در دسترس نیست</b><p>برای جلوگیری از نمایش داده ساختگی، تا زمانی که سرویس کیف پول Backend آدرس واقعی این دارایی و شبکه را صادر نکند، هیچ آدرس، QR، حداقل واریز یا کارمزد ساختگی نمایش داده نمی‌شود.</p></div></div></div>}

// ─── Exchange Screen ──────────────────────────────────────────────────────────
const EX_COINS=[
  // ─── Major / Stablecoin ───────────────────────────────────────────────────
  {symbol:"USDT",fa:"دلار تتر",price:0,change:Number.NaN,networks:["TRC۲۰","ERC۲۰","BEP۲۰"]},
  // ─── Top Layer-1 ─────────────────────────────────────────────────────────
  {symbol:"BTC",fa:"بیت‌کوین",price:0,change:Number.NaN,networks:["Bitcoin"]},
  {symbol:"ETH",fa:"اتریوم",price:0,change:Number.NaN,networks:["ERC۲۰","Arbitrum"]},
  {symbol:"SOL",fa:"سولانا",price:0,change:Number.NaN,networks:["Solana"]},
  {symbol:"BNB",fa:"بایننس کوین",price:0,change:Number.NaN,networks:["BEP۲۰"]},
  {symbol:"XRP",fa:"ریپل",price:0,change:Number.NaN,networks:["XRP Ledger"]},
  {symbol:"ADA",fa:"کاردانو",price:0,change:Number.NaN,networks:["Cardano"]},
  {symbol:"DOGE",fa:"دوج‌کوین",price:0,change:Number.NaN,networks:["Dogecoin"]},
  {symbol:"TON",fa:"تون کوین",price:0,change:Number.NaN,networks:["TON"]},
  {symbol:"AVAX",fa:"اوالانچ",price:0,change:Number.NaN,networks:["Avalanche","ERC۲۰"]},
  {symbol:"SUI",fa:"سوئی",price:0,change:Number.NaN,networks:["Sui"]},
  {symbol:"DOT",fa:"پولکادات",price:0,change:Number.NaN,networks:["Polkadot"]},
  {symbol:"LINK",fa:"چین‌لینک",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"LTC",fa:"لایت‌کوین",price:0,change:Number.NaN,networks:["Litecoin"]},
  {symbol:"TRX",fa:"ترون",price:0,change:Number.NaN,networks:["TRC۲۰"]},
  {symbol:"NEAR",fa:"نیر پروتکل",price:0,change:Number.NaN,networks:["NEAR"]},
  {symbol:"APT",fa:"آپتوس",price:0,change:Number.NaN,networks:["Aptos"]},
  {symbol:"POL",fa:"پل (پالیگان)",price:0,change:Number.NaN,networks:["Polygon","ERC۲۰"]},
  {symbol:"ICP",fa:"اینترنت کامپیوتر",price:0,change:Number.NaN,networks:["ICP"]},
  {symbol:"ETC",fa:"اتریوم کلاسیک",price:0,change:Number.NaN,networks:["ETC"]},
  {symbol:"BCH",fa:"بیت‌کوین کش",price:0,change:Number.NaN,networks:["Bitcoin Cash"]},
  {symbol:"XLM",fa:"استلار",price:0,change:Number.NaN,networks:["Stellar"]},
  {symbol:"ALGO",fa:"الگوریتم",price:0,change:Number.NaN,networks:["Algorand"]},
  {symbol:"XTZ",fa:"تزوس",price:0,change:Number.NaN,networks:["Tezos"]},
  {symbol:"EGLD",fa:"مولتی‌ورس ایکس",price:0,change:Number.NaN,networks:["MultiversX"]},
  {symbol:"FLOW",fa:"فلو",price:0,change:Number.NaN,networks:["Flow"]},
  {symbol:"ONE",fa:"هارمونی",price:0,change:Number.NaN,networks:["Harmony"]},
  // ─── Layer-2 / Scaling ───────────────────────────────────────────────────
  {symbol:"ARB",fa:"آربیتروم",price:0,change:Number.NaN,networks:["Arbitrum"]},
  {symbol:"STRK",fa:"استارک‌نت",price:0,change:Number.NaN,networks:["Starknet"]},
  {symbol:"MNT",fa:"منتل",price:0,change:Number.NaN,networks:["Mantle"]},
  {symbol:"FLR",fa:"فلر",price:0,change:Number.NaN,networks:["Flare","ERC۲۰"]},
  // ─── DeFi ────────────────────────────────────────────────────────────────
  {symbol:"AAVE",fa:"آوه",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"UNI",fa:"یونی‌سواپ",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"CRV",fa:"کرو دائو",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"SNX",fa:"سینتتیکس",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"BAL",fa:"بالانسر",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"YFI",fa:"یرن فایننس",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"1INCH",fa:"وان اینچ",price:0,change:Number.NaN,networks:["ERC۲۰","BEP۲۰"]},
  {symbol:"SUSHI",fa:"سوشی‌سواپ",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"CAKE",fa:"پنکیک‌سواپ",price:0,change:Number.NaN,networks:["BEP۲۰"]},
  {symbol:"CVX",fa:"کانوکس فایننس",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"DYDX",fa:"دی‌وای‌دی‌ایکس",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"RUNE",fa:"ثورچین",price:0,change:Number.NaN,networks:["THORChain"]},
  {symbol:"ONDO",fa:"اوندو",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"OSMO",fa:"اوسموسیس",price:0,change:Number.NaN,networks:["Cosmos"]},
  {symbol:"AERO",fa:"آئرودروم",price:0,change:Number.NaN,networks:["Base"]},
  {symbol:"MORPHO",fa:"مورفو",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"ENA",fa:"اتنا",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  // ─── AI / Data ───────────────────────────────────────────────────────────
  {symbol:"FET",fa:"فچ ای‌آی",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"RENDER",fa:"رندر",price:0,change:Number.NaN,networks:["Solana","ERC۲۰"]},
  {symbol:"GRT",fa:"گراف",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"TAO",fa:"بیتنسور",price:0,change:Number.NaN,networks:["Bittensor"]},
  {symbol:"CGPT",fa:"چین‌جی‌پی‌تی",price:0,change:Number.NaN,networks:["ERC۲۰","BEP۲۰"]},
  {symbol:"KAITO",fa:"کایتو",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  // ─── Oracle / Infrastructure ─────────────────────────────────────────────
  {symbol:"ATOM",fa:"کازماس",price:0,change:Number.NaN,networks:["Cosmos"]},
  {symbol:"PYTH",fa:"پیث نتورک",price:0,change:Number.NaN,networks:["Solana","ERC۲۰"]},
  {symbol:"BAND",fa:"بند پروتکل",price:0,change:Number.NaN,networks:["Cosmos","ERC۲۰"]},
  {symbol:"API3",fa:"ای‌پی‌آی تری",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"NMR",fa:"نومرایر",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"QNT",fa:"کوانت",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  // ─── Gaming / Metaverse ──────────────────────────────────────────────────
  {symbol:"AXS",fa:"اکسی اینفینیتی",price:0,change:Number.NaN,networks:["ERC۲۰","Ronin"]},
  {symbol:"SAND",fa:"سندباکس",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"MANA",fa:"دیسنترالند",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"GALA",fa:"گالا",price:0,change:Number.NaN,networks:["ERC۲۰","BEP۲۰"]},
  {symbol:"IMX",fa:"ایمیوتبل",price:0,change:Number.NaN,networks:["ImmutableX","ERC۲۰"]},
  {symbol:"ENJ",fa:"انجین کوین",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"CHZ",fa:"چیلیز",price:0,change:Number.NaN,networks:["ERC۲۰","Chiliz"]},
  {symbol:"ALICE",fa:"آلیس",price:0,change:Number.NaN,networks:["BEP۲۰","ERC۲۰"]},
  {symbol:"MAGIC",fa:"ترژر",price:0,change:Number.NaN,networks:["Arbitrum","ERC۲۰"]},
  // ─── Layer-1 Privacy / Alternative ──────────────────────────────────────
  {symbol:"XMR",fa:"مونرو",price:0,change:Number.NaN,networks:["Monero"]},
  {symbol:"ZEC",fa:"زی‌کش",price:0,change:Number.NaN,networks:["Zcash"]},
  {symbol:"DASH",fa:"دَش",price:0,change:Number.NaN,networks:["Dash"]},
  {symbol:"FIL",fa:"فایل‌کوین",price:0,change:Number.NaN,networks:["FIL"]},
  {symbol:"HBAR",fa:"هدرا",price:0,change:Number.NaN,networks:["Hedera"]},
  {symbol:"ZEN",fa:"هورایزن",price:0,change:Number.NaN,networks:["Horizen","ERC۲۰"]},
  // ─── Ecosystem / Exchange ────────────────────────────────────────────────
  {symbol:"SEI",fa:"سی",price:0,change:Number.NaN,networks:["Sei"]},
  {symbol:"TIA",fa:"سلستیا",price:0,change:Number.NaN,networks:["Celestia"]},
  {symbol:"JUP",fa:"ژوپیتر",price:0,change:Number.NaN,networks:["Solana"]},
  {symbol:"ORCA",fa:"اورکا",price:0,change:Number.NaN,networks:["Solana"]},
  {symbol:"RAY",fa:"ردیوم",price:0,change:Number.NaN,networks:["Solana"]},
  {symbol:"KAS",fa:"کسپا",price:0,change:Number.NaN,networks:["Kaspa"]},
  {symbol:"OM",fa:"مانترا",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"HYPE",fa:"هایپرلیکوئید",price:0,change:Number.NaN,networks:["Hyperliquid"]},
  {symbol:"EIGEN",fa:"آیگن لیر",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"ETHFI",fa:"اتر فای",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  // ─── Meme / Community ────────────────────────────────────────────────────
  {symbol:"SHIB",fa:"شیبا اینو",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"PEPE",fa:"پپه",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"FLOKI",fa:"فلوکی اینو",price:0,change:Number.NaN,networks:["ERC۲۰","BEP۲۰"]},
  {symbol:"BONK",fa:"بونک",price:0,change:Number.NaN,networks:["Solana"]},
  {symbol:"WIF",fa:"داگ ویف هت",price:0,change:Number.NaN,networks:["Solana"]},
  {symbol:"NOT",fa:"نات‌کوین",price:0,change:Number.NaN,networks:["TON"]},
  {symbol:"HMSTR",fa:"همستر کامبت",price:0,change:Number.NaN,networks:["TON"]},
  {symbol:"CATI",fa:"کتیزن",price:0,change:Number.NaN,networks:["TON"]},
  {symbol:"MAJOR",fa:"میجر",price:0,change:Number.NaN,networks:["TON"]},
  {symbol:"DOGS",fa:"داگز",price:0,change:Number.NaN,networks:["TON"]},
  {symbol:"BOME",fa:"بوک آف میم",price:0,change:Number.NaN,networks:["Solana"]},
  {symbol:"MOG",fa:"ماگ کوین",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"TURBO",fa:"توربو",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"NEIRO",fa:"نیرو",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"PENGU",fa:"پاجی پنگوئن",price:0,change:Number.NaN,networks:["Solana"]},
  {symbol:"MEME",fa:"میم کوین",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  // ─── Other notable ───────────────────────────────────────────────────────
  {symbol:"WLD",fa:"ورلد کوین",price:0,change:Number.NaN,networks:["ERC۲۰","Optimism"]},
  {symbol:"MASK",fa:"ماسک نتورک",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"ZRX",fa:"زیرو ایکس",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"BAT",fa:"بیسیک اتنشن",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"LRC",fa:"لوپرینگ",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"ZIL",fa:"زیلیکا",price:0,change:Number.NaN,networks:["Zilliqa","ERC۲۰"]},
  {symbol:"HOT",fa:"هولو",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"SKL",fa:"اسکیل",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"CELR",fa:"سلر نتورک",price:0,change:Number.NaN,networks:["ERC۲۰","BEP۲۰"]},
  {symbol:"UMA",fa:"اوما",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"LPT",fa:"لایوپیر",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"JASMY",fa:"جسمی",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"AGLD",fa:"ادونچر گلد",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"POLS",fa:"پولکا استارتر",price:0,change:Number.NaN,networks:["ERC۲۰","BEP۲۰"]},
  {symbol:"GMT",fa:"استپ این",price:0,change:Number.NaN,networks:["Solana","ERC۲۰"]},
  {symbol:"APE",fa:"ایپ کوین",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"DEXE",fa:"دکسی",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"PEOPLE",fa:"کانستیتوشن دائو",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"EDU",fa:"اوپن کامپوس",price:0,change:Number.NaN,networks:["ERC۲۰","BEP۲۰"]},
  {symbol:"BTTC",fa:"بیت تورنت",price:0,change:Number.NaN,networks:["TRC۲۰","BEP۲۰"]},
  {symbol:"BICO",fa:"بایکونومی",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"VIRTUAL",fa:"ویرچوال پروتکل",price:0,change:Number.NaN,networks:["Base","ERC۲۰"]},
  {symbol:"KAIA",fa:"کایا",price:0,change:Number.NaN,networks:["Kaia"]},
  {symbol:"SUPER",fa:"سوپرورس",price:0,change:Number.NaN,networks:["ERC۲۰","Solana"]},
  {symbol:"TRB",fa:"تلور",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"MDT",fa:"مژربل دیتا",price:0,change:Number.NaN,networks:["ERC۲۰","BEP۲۰"]},
  {symbol:"JST",fa:"جاست",price:0,change:Number.NaN,networks:["TRC۲۰"]},
  {symbol:"TNSR",fa:"تنسور",price:0,change:Number.NaN,networks:["Solana"]},
  {symbol:"IO",fa:"آی‌او دات نت",price:0,change:Number.NaN,networks:["Solana","ERC۲۰"]},
  // ─── Layer-2 & Scaling (additional) ─────────────────────────────────────
  {symbol:"OP",fa:"اپتیمیزم",price:0,change:Number.NaN,networks:["Optimism","ERC۲۰"]},
  {symbol:"ZK",fa:"زی‌کی‌سینک",price:0,change:Number.NaN,networks:["zkSync"]},
  {symbol:"MANTA",fa:"مانتا نتورک",price:0,change:Number.NaN,networks:["Manta","ERC۲۰"]},
  {symbol:"ALT",fa:"آلت‌لیر",price:0,change:Number.NaN,networks:["ERC۲۰","Arbitrum"]},
  {symbol:"JTO",fa:"جیتو",price:0,change:Number.NaN,networks:["Solana"]},
  {symbol:"RDNT",fa:"ردینت کپیتال",price:0,change:Number.NaN,networks:["Arbitrum","BNB Chain"]},
  {symbol:"NTRN",fa:"نوترون",price:0,change:Number.NaN,networks:["Cosmos"]},
  // ─── DeFi (additional) ───────────────────────────────────────────────────
  {symbol:"MKR",fa:"میکر دائو",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"COMP",fa:"کامپاند",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"LDO",fa:"لیدو",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"PENDLE",fa:"پندل",price:0,change:Number.NaN,networks:["ERC۲۰","Arbitrum"]},
  {symbol:"GMX",fa:"جی‌ام‌ایکس",price:0,change:Number.NaN,networks:["Arbitrum","Avalanche"]},
  {symbol:"BLUR",fa:"بلور",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"FXS",fa:"فرکس شیر",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"LQTY",fa:"لیکوییتی",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"RPL",fa:"راکت پول",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"PERP",fa:"پرپچوال پروتکل",price:0,change:Number.NaN,networks:["Optimism","ERC۲۰"]},
  {symbol:"GNO",fa:"گنوسیس",price:0,change:Number.NaN,networks:["ERC۲۰","Gnosis"]},
  {symbol:"GLM",fa:"گولم",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"OCEAN",fa:"اوشن پروتکل",price:0,change:Number.NaN,networks:["ERC۲۰","BEP۲۰"]},
  {symbol:"BADGER",fa:"بجر",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  // ─── Infrastructure & Oracle (additional) ────────────────────────────────
  {symbol:"ENS",fa:"اتریوم نیم سرویس",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"STX",fa:"استکس",price:0,change:Number.NaN,networks:["Stacks"]},
  {symbol:"ORDI",fa:"اوردی",price:0,change:Number.NaN,networks:["Bitcoin"]},
  {symbol:"STORJ",fa:"استورج",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"ANKR",fa:"انکر",price:0,change:Number.NaN,networks:["ERC۲۰","BEP۲۰"]},
  {symbol:"ID",fa:"اسپیس آی‌دی",price:0,change:Number.NaN,networks:["BNB Chain","ERC۲۰"]},
  {symbol:"GTC",fa:"گیت‌کوین",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"ARPA",fa:"آرپا",price:0,change:Number.NaN,networks:["ERC۲۰","BEP۲۰"]},
  {symbol:"ARKM",fa:"آرکام",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"FLUX",fa:"فلاکس",price:0,change:Number.NaN,networks:["ERC۲۰","BEP۲۰"]},
  {symbol:"RVN",fa:"ریون‌کوین",price:0,change:Number.NaN,networks:["Ravencoin"]},
  {symbol:"POWR",fa:"پاور لجر",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"CTSI",fa:"کارتسی",price:0,change:Number.NaN,networks:["ERC۲۰","BEP۲۰"]},
  // ─── Exchange Tokens ──────────────────────────────────────────────────────
  {symbol:"BGB",fa:"بیت‌گت توکن",price:0,change:Number.NaN,networks:["ERC۲۰","BEP۲۰"]},
  {symbol:"KCS",fa:"کوکوین توکن",price:0,change:Number.NaN,networks:["KCS"]},
  {symbol:"WOO",fa:"وو نتورک",price:0,change:Number.NaN,networks:["ERC۲۰","BEP۲۰"]},
  {symbol:"TWT",fa:"تراست والت توکن",price:0,change:Number.NaN,networks:["BEP۲۰"]},
  {symbol:"CRO",fa:"کرونوس",price:0,change:Number.NaN,networks:["Cronos","ERC۲۰"]},
  {symbol:"OKB",fa:"اوکی‌ایکس توکن",price:0,change:Number.NaN,networks:["ERC۲۰","OKC"]},
  // ─── Alternative Layer-1s ─────────────────────────────────────────────────
  {symbol:"INJ",fa:"اینجکتیو",price:0,change:Number.NaN,networks:["Injective","ERC۲۰"]},
  {symbol:"VET",fa:"وی‌چین",price:0,change:Number.NaN,networks:["VeChain"]},
  {symbol:"KAVA",fa:"کاوا",price:0,change:Number.NaN,networks:["Kava","Cosmos"]},
  {symbol:"CELO",fa:"سلو",price:0,change:Number.NaN,networks:["Celo"]},
  {symbol:"ROSE",fa:"اوسیس نتورک",price:0,change:Number.NaN,networks:["Oasis"]},
  {symbol:"WAVES",fa:"ویوز",price:0,change:Number.NaN,networks:["Waves"]},
  {symbol:"NEO",fa:"نئو",price:0,change:Number.NaN,networks:["Neo"]},
  {symbol:"QTUM",fa:"کوانتوم",price:0,change:Number.NaN,networks:["Qtum"]},
  {symbol:"FTM",fa:"فانتوم",price:0,change:Number.NaN,networks:["Fantom","ERC۲۰","BEP۲۰"]},
  {symbol:"EOS",fa:"ایوس",price:0,change:Number.NaN,networks:["EOS"]},
  {symbol:"HIVE",fa:"هایو",price:0,change:Number.NaN,networks:["Hive"]},
  {symbol:"LSK",fa:"لیسک",price:0,change:Number.NaN,networks:["Lisk"]},
  {symbol:"ARK",fa:"آرک",price:0,change:Number.NaN,networks:["Ark"]},
  {symbol:"IOST",fa:"آی‌اوست",price:0,change:Number.NaN,networks:["IOST"]},
  {symbol:"NULS",fa:"نالس",price:0,change:Number.NaN,networks:["NULS"]},
  {symbol:"DUSK",fa:"داسک",price:0,change:Number.NaN,networks:["ERC۲۰","BEP۲۰"]},
  // ─── Gaming / NFT (additional) ────────────────────────────────────────────
  {symbol:"ILV",fa:"ایلووویوم",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"LOOKS",fa:"لوکس‌رر",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"AUDIO",fa:"اودیوس",price:0,change:Number.NaN,networks:["Solana","ERC۲۰"]},
  {symbol:"TLM",fa:"تلوم",price:0,change:Number.NaN,networks:["BEP۲۰","ERC۲۰","WAX"]},
  {symbol:"PIXEL",fa:"پیکسل",price:0,change:Number.NaN,networks:["Ronin","ERC۲۰"]},
  {symbol:"VOXEL",fa:"ووکسل",price:0,change:Number.NaN,networks:["ERC۲۰","BEP۲۰"]},
  {symbol:"SLP",fa:"اسموث لاو",price:0,change:Number.NaN,networks:["Ronin","ERC۲۰"]},
  // ─── DeFi / DEX (additional) ─────────────────────────────────────────────
  {symbol:"ACH",fa:"الکیمی پی",price:0,change:Number.NaN,networks:["ERC۲۰","BEP۲۰"]},
  {symbol:"OGN",fa:"اوریجین پروتکل",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"UNFI",fa:"یونی‌فای",price:0,change:Number.NaN,networks:["ERC۲۰","BEP۲۰"]},
  {symbol:"PUNDIX",fa:"پوندی‌ایکس",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"REEF",fa:"ریف فایننس",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"CYBER",fa:"سایبرکانکت",price:0,change:Number.NaN,networks:["BNB Chain","ERC۲۰"]},
  {symbol:"HOOK",fa:"هوکد پروتکل",price:0,change:Number.NaN,networks:["BNB Chain"]},
  {symbol:"HFT",fa:"هشفلو",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"CHESS",fa:"ترانچس",price:0,change:Number.NaN,networks:["BEP۲۰","ERC۲۰"]},
  {symbol:"LIT",fa:"لیتنتری",price:0,change:Number.NaN,networks:["ERC۲۰","BEP۲۰"]},
  {symbol:"XVS",fa:"ونوس",price:0,change:Number.NaN,networks:["BEP۲۰"]},
  {symbol:"BAKE",fa:"بیکری سواپ",price:0,change:Number.NaN,networks:["BEP۲۰"]},
  {symbol:"NFP",fa:"ان‌اف‌پرامپت",price:0,change:Number.NaN,networks:["BNB Chain"]},
  {symbol:"ACE",fa:"اندورنس",price:0,change:Number.NaN,networks:["BNB Chain"]},
  {symbol:"LUNC",fa:"لونا کلاسیک",price:0,change:Number.NaN,networks:["Terra Classic"]},
  // ─── Payments & Privacy (additional) ────────────────────────────────────
  {symbol:"CTXC",fa:"کورتکس",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  // ─── Exchange Tokens (additional) ────────────────────────────────────────
  {symbol:"GT",fa:"گیت توکن",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"MX",fa:"ام اکس توکن",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"HT",fa:"هیوبی توکن",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  // ─── Layer-1 (additional) ────────────────────────────────────────────────
  {symbol:"THETA",fa:"تتا نتورک",price:0,change:Number.NaN,networks:["Theta"]},
  {symbol:"TFUEL",fa:"تتا فیول",price:0,change:Number.NaN,networks:["Theta"]},
  {symbol:"DCR",fa:"دیکرد",price:0,change:Number.NaN,networks:["Decred"]},
  {symbol:"XEC",fa:"ای کش",price:0,change:Number.NaN,networks:["eCash"]},
  {symbol:"KSM",fa:"کوساما",price:0,change:Number.NaN,networks:["Kusama"]},
  {symbol:"ONT",fa:"آنتولوژی",price:0,change:Number.NaN,networks:["Ontology"]},
  {symbol:"ELF",fa:"الف",price:0,change:Number.NaN,networks:["ERC۲۰","aelf"]},
  {symbol:"CKB",fa:"سیکی بایت",price:0,change:Number.NaN,networks:["Nervos"]},
  {symbol:"ASTR",fa:"استار نتورک",price:0,change:Number.NaN,networks:["Astar"]},
  {symbol:"CSPR",fa:"کسپر نتورک",price:0,change:Number.NaN,networks:["Casper"]},
  {symbol:"GLMR",fa:"مون بیم",price:0,change:Number.NaN,networks:["Moonbeam"]},
  {symbol:"BTG",fa:"بیت کوین گلد",price:0,change:Number.NaN,networks:["BTG"]},
  {symbol:"CFX",fa:"کانفلاکس",price:0,change:Number.NaN,networks:["Conflux"]},
  {symbol:"KLAY",fa:"کلایتن",price:0,change:Number.NaN,networks:["Klaytn"]},
  {symbol:"ICX",fa:"آیکون",price:0,change:Number.NaN,networks:["ICON"]},
  {symbol:"XDC",fa:"اکس دی سی",price:0,change:Number.NaN,networks:["XDC"]},
  {symbol:"LEO",fa:"لئو",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"PI",fa:"پای نتورک",price:0,change:Number.NaN,networks:["Pi Network"]},
  // ─── Scaling / L2 (additional) ───────────────────────────────────────────
  {symbol:"METIS",fa:"متیس",price:0,change:Number.NaN,networks:["Metis"]},
  {symbol:"MINA",fa:"مینا پروتکل",price:0,change:Number.NaN,networks:["Mina"]},
  {symbol:"ZETA",fa:"زتا چین",price:0,change:Number.NaN,networks:["ZetaChain"]},
  {symbol:"RON",fa:"رونین",price:0,change:Number.NaN,networks:["Ronin"]},
  {symbol:"DYM",fa:"دایمنشن",price:0,change:Number.NaN,networks:["Dymension"]},
  {symbol:"AXL",fa:"اکسلار",price:0,change:Number.NaN,networks:["Axelar"]},
  {symbol:"SAGA",fa:"ساگا",price:0,change:Number.NaN,networks:["Saga"]},
  {symbol:"OMNI",fa:"امنی نتورک",price:0,change:Number.NaN,networks:["Omni"]},
  {symbol:"CORE",fa:"کور دائو",price:0,change:Number.NaN,networks:["Core DAO"]},
  // ─── AI / Data (additional) ──────────────────────────────────────────────
  {symbol:"AR",fa:"آرویو",price:0,change:Number.NaN,networks:["Arweave"]},
  {symbol:"NKN",fa:"ان کی ان",price:0,change:Number.NaN,networks:["NKN"]},
  {symbol:"AIOZ",fa:"آیوز نتورک",price:0,change:Number.NaN,networks:["ERC۲۰","BNB Chain"]},
  {symbol:"AI16Z",fa:"ای آی ۱۶ زد",price:0,change:Number.NaN,networks:["Solana"]},
  {symbol:"TRAC",fa:"اوریجین تریل",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  // ─── DeFi / DEX (additional) ─────────────────────────────────────────────
  {symbol:"ZRO",fa:"لیر زیرو",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"C98",fa:"کوین ۹۸",price:0,change:Number.NaN,networks:["BNB Chain","Solana"]},
  {symbol:"CHR",fa:"کرومیا",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"GAL",fa:"گلکسی",price:0,change:Number.NaN,networks:["BNB Chain","ERC۲۰"]},
  {symbol:"LUNA",fa:"لونا",price:0,change:Number.NaN,networks:["Terra"]},
  {symbol:"VANA",fa:"وانا",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"KNC",fa:"کایبر نتورک",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"BNT",fa:"بنکر",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"RLC",fa:"آی اگزک",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"REN",fa:"رن پروتکل",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"OXT",fa:"ارکید",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"CVC",fa:"سیویک",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"SSV",fa:"اس اس وی نتورک",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"YGG",fa:"ییلد گیلد گیمز",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"SPELL",fa:"اسپل توکن",price:0,change:Number.NaN,networks:["ERC۲۰","Arbitrum"]},
  {symbol:"BANANA",fa:"بنانا گان",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"PYR",fa:"ولکان فورجد",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"MTL",fa:"متال",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"BSW",fa:"بای سواپ",price:0,change:Number.NaN,networks:["BNB Chain"]},
  {symbol:"HIFI",fa:"های‌فای",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"AMP",fa:"امپ",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  // ─── Gaming / NFT (additional) ───────────────────────────────────────────
  {symbol:"WAXP",fa:"واکس",price:0,change:Number.NaN,networks:["WAX"]},
  {symbol:"OMG",fa:"او ام جی",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  // ─── Infrastructure (additional) ─────────────────────────────────────────
  {symbol:"WEMIX",fa:"ومیکس",price:0,change:Number.NaN,networks:["WEMIX"]},
  {symbol:"SFP",fa:"سیف پل",price:0,change:Number.NaN,networks:["BNB Chain","ERC۲۰"]},
  {symbol:"HNT",fa:"هلیوم",price:0,change:Number.NaN,networks:["Solana","HNT"]},
  {symbol:"VTHO",fa:"وتور",price:0,change:Number.NaN,networks:["VeChain"]},
  {symbol:"IOTX",fa:"آیوتکس",price:0,change:Number.NaN,networks:["IoTeX","ERC۲۰"]},
  {symbol:"GRASS",fa:"گرس",price:0,change:Number.NaN,networks:["Solana"]},
  {symbol:"BEAM",fa:"بیم",price:0,change:Number.NaN,networks:["Beam"]},
  {symbol:"GAS",fa:"گس",price:0,change:Number.NaN,networks:["NEO"]},
  {symbol:"AKT",fa:"آکاش نتورک",price:0,change:Number.NaN,networks:["Cosmos"]},
  {symbol:"BORG",fa:"سوییس بورگ",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"CFG",fa:"سنتریفیوژ",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"STRD",fa:"استراید",price:0,change:Number.NaN,networks:["Cosmos"]},
  {symbol:"XCH",fa:"چیا",price:0,change:Number.NaN,networks:["Chia"]},
  {symbol:"POLYX",fa:"پالی مش",price:0,change:Number.NaN,networks:["Polymesh"]},
  {symbol:"REQ",fa:"ریکوئست",price:0,change:Number.NaN,networks:["ERC۲۰","Polygon"]},
  // ─── Meme / Community (additional) ───────────────────────────────────────
  {symbol:"TRUMP",fa:"ترامپ",price:0,change:Number.NaN,networks:["Solana"]},
  {symbol:"BRETT",fa:"برت",price:0,change:Number.NaN,networks:["Base"]},
  {symbol:"PNUT",fa:"پینات",price:0,change:Number.NaN,networks:["Solana"]},
  {symbol:"MEW",fa:"میو کت",price:0,change:Number.NaN,networks:["Solana"]},
  {symbol:"ME",fa:"مجیک ادن",price:0,change:Number.NaN,networks:["Solana"]},
  // ─── Payments (additional) ───────────────────────────────────────────────
  {symbol:"SXP",fa:"سولار",price:0,change:Number.NaN,networks:["BNB Chain","ERC۲۰"]},
  {symbol:"TEL",fa:"تل کوین",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"RSR",fa:"رزرو رایتس",price:0,change:Number.NaN,networks:["ERC۲۰"]},
  {symbol:"WIN",fa:"وین لینک",price:0,change:Number.NaN,networks:["TRON","BNB Chain"]},
  {symbol:"MBL",fa:"مووی بلاک",price:0,change:Number.NaN,networks:["BNB Chain"]},
  {symbol:"RLB",fa:"رولبیت",price:0,change:Number.NaN,networks:["ERC۲۰"]},
];
function CoinLogo({symbol,size=32}:{symbol:string;size?:number}){return <img className="coin-logo" width={size} height={size} src={`https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`} alt={`لوگوی ${symbol}`} onError={e=>{e.currentTarget.style.visibility="hidden"}}/>}
const TMN_LOGO=(()=>{const s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><defs><clipPath id="tc"><circle cx="15" cy="15" r="15"/></clipPath></defs><g clip-path="url(#tc)"><rect y="0" width="30" height="10" fill="#1a7f3c"/><rect y="10" width="30" height="10" fill="#f5f5f5"/><rect y="20" width="30" height="11" fill="#c0392b"/></g><text x="15" y="20" text-anchor="middle" font-size="11" font-weight="900" fill="rgba(0,0,0,0.45)" font-family="sans-serif">T</text></svg>';return`data:image/svg+xml;base64,${btoa(s)}`;})();
function PairLogos({base,quote="TMN",baseSize=26,quoteSize=15}:{base:string;quote?:string;baseSize?:number;quoteSize?:number}){const overlap=Math.round(quoteSize*.55);const qSrc=quote==="TMN"?TMN_LOGO:`https://assets.coincap.io/assets/icons/${quote.toLowerCase()}@2x.png`;return <span style={{display:"inline-flex",alignItems:"flex-end",flexShrink:0,verticalAlign:"middle",direction:"ltr"} as React.CSSProperties}><img className="coin-logo" width={baseSize} height={baseSize} style={{flexShrink:0} as React.CSSProperties} src={`https://assets.coincap.io/assets/icons/${base.toLowerCase()}@2x.png`} alt={base} onError={e=>{(e.currentTarget as HTMLImageElement).style.visibility="hidden"}}/><img width={quoteSize} height={quoteSize} style={{marginLeft:-overlap,flexShrink:0,borderRadius:"50%",display:"block"} as React.CSSProperties} src={qSrc} alt={quote}/></span>}
// ─── Forex Bot Screen ─────────────────────────────────────────────────────────
type BotStatus = "inactive"|"pending"|"active";
interface BotSession{id:string;amount:number;activatedAt:string;deactivatedAt?:string;pnl?:number}
function getBotState(_phone:string):{status:BotStatus;amount:number;activatedAt?:string;lastDeactivatedAt?:string;sessions:BotSession[]}{return{status:"inactive",amount:0,sessions:[]};}
function saveBotState(_phone:string,_s:ReturnType<typeof getBotState>){}

function ForexBotScreen({user,onUpdate,onBack}:{user:UserData;onUpdate:(u:UserData,tx:TxRecord)=>void;onBack:()=>void}){
  const [bs,setBs]=useState(()=>getBotState(user.phone));
  const [amount,setAmount]=useState(bs.amount>0?String(bs.amount):"");
  const [amountErr,setAmountErr]=useState("");
  const [showWarning,setShowWarning]=useState(false);
  const [showCandlePopup,setShowCandlePopup]=useState(bs.status==="pending"||bs.status==="active");
  const [showDeactivateConfirm,setShowDeactivateConfirm]=useState(false);
  const [deactivating,setDeactivating]=useState(false);
  const [tick,setTick]=useState(0);
  const [cooledDown,setCooledDown]=useState(false);
  const [showHelp,setShowHelp]=useState(false);
  const [helpOpen,setHelpOpen]=useState<number|null>(null);
  const [showPdfPopup,setShowPdfPopup]=useState(false);
  const [liveForexWallet,setLiveForexWallet]=useState(0);
  useEffect(()=>{let active=true;const load=async()=>{try{const w=await sarrafWalletMap();if(active)setLiveForexWallet(Number(w.USDT??0));}catch{if(active)setLiveForexWallet(0);}};void load();const id=window.setInterval(()=>void load(),5000);return()=>{active=false;window.clearInterval(id)}},[user.uid]);

  useEffect(()=>{const id=setInterval(()=>setTick(t=>t+1),400);return()=>clearInterval(id);},[]);

  useEffect(()=>{
    if(bs.lastDeactivatedAt){
      const elapsed=Date.now()-new Date(bs.lastDeactivatedAt).getTime();
      setCooledDown(elapsed>=24*60*60*1000);
    } else {
      setCooledDown(true);
    }
  },[bs]);

  const displayUsdt = liveForexWallet;
  const maxAlloc=Math.max(0,displayUsdt-3);
  const allocNum=Number(toLatinDigits(amount))||0;

  const handleActivate=()=>{setAmountErr("اجرای واقعی فارکس‌بات هنوز به Backend متصل نشده است؛ هیچ مبلغی از موجودی کسر نمی‌شود.");};

  const handleDeactivate=()=>{setAmountErr("اجرای واقعی فارکس‌بات هنوز به Backend متصل نشده است؛ هیچ سود یا زیان ساختگی ثبت نمی‌شود.");};

  const totalPnl=bs.sessions.reduce((a,s)=>a+(s.pnl||0),0);
  const cooldownRemaining=bs.lastDeactivatedAt?Math.max(0,24*60*60*1000-(Date.now()-new Date(bs.lastDeactivatedAt).getTime())):0;
  const cooldownHours=Math.ceil(cooldownRemaining/3600000);

  const candles: Array<{h:number;l:number;o:number;c:number;bull:boolean}> = [];

  const faqTopics=[
    {q:"فارکس چیست؟",a:"فارکس (Foreign Exchange) بزرگترین بازار مالی جهان است که در آن ارزهای مختلف کشورها خرید و فروش می‌شوند. حجم روزانه آن به بیش از ۶ تریلیون دلار می‌رسد."},
    {q:"جفت‌ارز چیست؟",a:"جفت ارز دو ارز مختلف است که نسبت تبدیل آن‌ها به یکدیگر را نشان می‌دهد. مثال: EUR/USD که نشان‌دهنده ارزش یورو در برابر دلار آمریکاست."},
    {q:"خرید و فروش (Buy/Sell) چیست؟",a:"در فارکس، خرید (Long) به معنی انتظار افزایش قیمت و فروش (Short) به معنی انتظار کاهش قیمت است. سود از تفاوت قیمت ورود و خروج محاسبه می‌شود."},
    {q:"اهرم (Leverage) چیست؟",a:"اهرم ابزاری است که به شما امکان می‌دهد با سرمایه کمتر، معاملات بزرگتری انجام دهید. اهرم ۱:۱۰۰ یعنی کنترل ۱۰۰ برابر سرمایه واقعی — ریسک را چند برابر می‌کند."},
    {q:"مارجین (Margin) چیست؟",a:"مارجین مقدار سرمایه‌ای است که به عنوان وثیقه برای باز نگه‌داشتن معامله نیاز است. اگر موجودی به زیر حد مارجین برسد، معامله بسته می‌شود."},
    {q:"اسپرد (Spread) چیست؟",a:"اسپرد تفاوت بین قیمت خرید (Ask) و فروش (Bid) است. این تفاوت هزینه اصلی معامله در فارکس بوده و به بروکر تعلق می‌گیرد."},
    {q:"پیپ (Pip) چیست؟",a:"پیپ کوچکترین واحد تغییر قیمت در فارکس است. برای جفت ارزهای اصلی مانند EUR/USD، یک پیپ برابر ۰.۰۰۰۱ است."},
    {q:"لات (Lot Size) چیست؟",a:"لات واحد اندازه‌گیری حجم معامله است. یک لات استاندارد برابر ۱۰۰,۰۰۰ واحد ارز پایه، مینی‌لات ۱۰,۰۰۰ و میکرولات ۱,۰۰۰ واحد است."},
    {q:"حد ضرر (Stop Loss) چیست؟",a:"حد ضرر سفارشی است که معامله را در صورت رسیدن قیمت به سطح مشخص به صورت خودکار می‌بندد تا از زیان بیشتر جلوگیری شود."},
    {q:"هدف سود (Take Profit) چیست؟",a:"هدف سود سطحی است که معامله به صورت خودکار بسته می‌شود و سود شما تثبیت می‌شود. استفاده از آن بخشی از مدیریت ریسک است."},
    {q:"مدیریت ریسک چیست؟",a:"مدیریت ریسک شامل تعیین حد ضرر، محدود کردن حجم معاملات، و تنوع‌بخشی به سبد دارایی است. هرگز بیش از ۲٪ از سرمایه را در یک معامله ریسک نکنید."},
    {q:"استراتژی‌های معاملاتی",a:"رایج‌ترین استراتژی‌ها: اسکالپینگ (معاملات سریع کوتاه‌مدت)، دی‌ترید (معامله روزانه)، سوئینگ ترید (چند روز تا چند هفته)، و پوزیشن ترید (بلندمدت)."},
    {q:"ربات معاملاتی چگونه کار می‌کند؟",a:"ربات فارکس آن‌پرداز بر اساس الگوریتم‌های معاملاتی پیشرفته به صورت خودکار معامله می‌کند. ربات بازار را تحلیل کرده و بهترین نقاط ورود و خروج را شناسایی می‌نماید."},
    {q:"سود و زیان چگونه محاسبه می‌شود؟",a:"سود یا زیان = (قیمت خروج − قیمت ورود) × حجم معامله. برای معاملات فروش، محاسبه برعکس است. کارمزد و اسپرد از سود کسر می‌شود."},
    {q:"نوسانات بازار چه تأثیری دارد؟",a:"نوسانات بالا فرصت‌های سود بیشتر ایجاد می‌کند اما ریسک زیان را نیز افزایش می‌دهد. رویدادهای اقتصادی مانند اعلام نرخ بهره نوسانات شدیدی ایجاد می‌کنند."},
    {q:"ریسک‌های مهم بازار فارکس",a:"معاملات فارکس ریسک بسیار بالایی دارند. ممکن است بخش یا تمام سرمایه تخصیص‌یافته را از دست بدهید. عملکرد گذشته ضمانتی برای نتایج آینده نیست. فقط با سرمایه‌ای که توان از دست دادن آن را دارید معامله کنید."},
  ];

  const completedSessions=bs.sessions.filter(s=>s.deactivatedAt);
  const winSessions=completedSessions.filter(s=>(s.pnl||0)>0);
  const lossSessions=completedSessions.filter(s=>(s.pnl||0)<0);
  const winRate=completedSessions.length?Math.round(winSessions.length/completedSessions.length*100):0;
  const avgGain=winSessions.length?winSessions.reduce((a,s)=>a+(s.pnl||0),0)/winSessions.length:0;
  const avgLoss=lossSessions.length?lossSessions.reduce((a,s)=>a+(s.pnl||0),0)/lossSessions.length:0;

  // Build chart path points from sessions
  const chartSessions=bs.sessions.slice(0,12).reverse();
  const chartPoints=chartSessions.map((s,i)=>({x:i,y:s.pnl||0}));
  const chartW=320,chartH=220,padX=48,padY=24,padB=28;
  const innerW=chartW-padX-14,innerH=chartH-padY-padB;
  const allY=chartPoints.map(p=>p.y);
  const minY=Math.min(0,...allY);const maxY=Math.max(0,...allY,0.01);
  const yRange=maxY-minY||1;
  const toChartX=(i:number)=>padX+i*(innerW/Math.max(chartPoints.length-1,1));
  const toChartY=(v:number)=>padY+innerH*(1-(v-minY)/yRange);
  const zeroY=toChartY(0);
  const linePath=chartPoints.length>1?chartPoints.map((p,i)=>`${i===0?"M":"L"}${toChartX(i).toFixed(1)},${toChartY(p.y).toFixed(1)}`).join(" "):"";
  const areaPath=chartPoints.length>1?`${linePath} L${toChartX(chartPoints.length-1).toFixed(1)},${zeroY.toFixed(1)} L${toChartX(0).toFixed(1)},${zeroY.toFixed(1)} Z`:"";
  const yTicks=[0,0.25,0.5,0.75,1].map(t=>minY+yRange*t);

  return <>
  <div className="subscreen" dir="rtl">
    <div className="subscreen-header">
      <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">ربات فارکس آن‌پرداز</h2>
      <button onClick={()=>setShowHelp(true)} style={{width:36,height:36,borderRadius:10,background:"rgba(0,214,176,0.1)",border:"1px solid rgba(0,214,176,0.25)",color:"var(--accent)",fontSize:16,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>?</button>
    </div>
    <div className="subscreen-body" style={{padding:"0 16px 80px"}}>

      {/* Portfolio hero card */}
      <div style={{borderRadius:22,padding:"22px",marginBottom:16,background:"linear-gradient(135deg,#0a2e1e,#0f5c38,#1a7a55)",color:"#fff",position:"relative",overflow:"hidden",boxShadow:"0 8px 32px rgba(0,180,100,0.22)"}}>
        <div style={{position:"absolute",right:-30,top:-30,width:140,height:140,borderRadius:"50%",background:"rgba(255,255,255,0.04)"}}/>
        <div style={{position:"absolute",left:-20,bottom:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.03)"}}/>
        <div style={{fontSize:11,opacity:0.65,marginBottom:8,letterSpacing:0.5}}>موجودی کل دارایی USDT</div>
        <div style={{fontSize:34,fontWeight:900,marginBottom:2,letterSpacing:-1}}>{faFixed(displayUsdt,2)}<span style={{fontSize:15,opacity:0.7,marginRight:8}}>دلار تتر</span></div>
        <div style={{fontSize:13,opacity:0.55,marginBottom:16}}>{displayUsdt>0?"—":"—"} تومان</div>
        <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
          <div>
            <div style={{fontSize:10,opacity:0.55,marginBottom:3}}>سود/زیان کل</div>
            <div style={{fontSize:17,fontWeight:900,color:totalPnl>=0?"#5fffb0":"#ff7070"}}>{totalPnl>=0?"+":""}{faFixed(totalPnl,2)} USDT</div>
          </div>
          {bs.status!=="inactive"&&<div>
            <div style={{fontSize:10,opacity:0.55,marginBottom:3}}>فعال در ربات</div>
            <div style={{fontSize:17,fontWeight:900,display:"flex",alignItems:"center",gap:5}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:bs.status==="active"?"#00ff88":"#f5c23d",animation:"pulse 1.5s infinite",display:"inline-block",flexShrink:0}}/>
              {faFixed(bs.amount,2)} USDT
            </div>
          </div>}
          <div style={{marginRight:"auto"}}>
            <div style={{fontSize:10,opacity:0.55,marginBottom:4}}>وضعیت</div>
            <div style={{fontSize:13,fontWeight:800,padding:"5px 14px",borderRadius:20,background:bs.status==="active"?"rgba(0,255,136,0.22)":bs.status==="pending"?"rgba(245,194,61,0.2)":"rgba(229,57,53,0.22)",color:bs.status==="active"?"#00ff88":bs.status==="pending"?"#f5c23d":"#ff6b6b",border:`1px solid ${bs.status==="active"?"rgba(0,255,136,0.3)":bs.status==="pending"?"rgba(245,194,61,0.3)":"rgba(229,57,53,0.3)"}`,display:"inline-flex",alignItems:"center",gap:6}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:bs.status==="active"?"#00ff88":bs.status==="pending"?"#f5c23d":"#e53935",display:"inline-block",flexShrink:0}}/>
              {bs.status==="active"?"فعال":bs.status==="pending"?"در انتظار":"غیر فعال"}
            </div>
          </div>
        </div>
      </div>

      {/* Large performance chart with axes */}
      {bs.sessions.length>0&&<div style={{borderRadius:18,padding:"16px 12px 8px",marginBottom:16,background:"var(--card-bg)",border:"1px solid var(--border-color)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,padding:"0 4px"}}>
          <span style={{fontWeight:800,fontSize:15,color:"var(--text-primary)"}}>نمودار عملکرد</span>
          <span style={{fontSize:12,color:"var(--text-muted)"}}>{toFaDigits(String(chartSessions.length))} جلسه</span>
        </div>
        <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{width:"100%",height:220,display:"block"}}>
          <defs>
            <linearGradient id="chartGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={totalPnl>=0?"#00D6B0":"#e53935"} stopOpacity="0.3"/>
              <stop offset="100%" stopColor={totalPnl>=0?"#00D6B0":"#e53935"} stopOpacity="0.02"/>
            </linearGradient>
          </defs>
          {/* Horizontal grid + Y axis labels */}
          {yTicks.map((v,ti)=>{const cy=toChartY(v);return(<g key={ti}>
            <line x1={padX} y1={cy} x2={chartW-14} y2={cy} stroke="rgba(255,255,255,0.06)" strokeWidth={1}/>
            <text x={padX-4} y={cy+4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.35)" fontFamily="monospace">{v===0?"0":v>0?`+${v.toFixed(1)}`:v.toFixed(1)}</text>
          </g>);})}
          {/* Vertical grid lines + X axis labels */}
          {chartPoints.map((_p,i)=>{const cx=toChartX(i);return(<g key={i}>
            <line x1={cx} y1={padY} x2={cx} y2={padY+innerH} stroke="rgba(255,255,255,0.04)" strokeWidth={1}/>
            <text x={cx} y={padY+innerH+padB-6} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)" fontFamily="Vazirmatn">{toFaDigits(String(i+1))}</text>
          </g>);})}
          {/* Zero line */}
          <line x1={padX} y1={zeroY} x2={chartW-14} y2={zeroY} stroke="rgba(255,255,255,0.18)" strokeWidth={1.5} strokeDasharray="5 3"/>
          {/* Area fill */}
          {chartPoints.length>1&&<path d={areaPath} fill="url(#chartGrad2)"/>}
          {/* Line */}
          {chartPoints.length>1&&<path d={linePath} fill="none" stroke={totalPnl>=0?"#00D6B0":"#e53935"} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>}
          {/* Data points with % labels */}
          {chartPoints.map((p,i)=>{const cx=toChartX(i);const cy=toChartY(p.y);const pct=maxY>0?(p.y/maxY*100).toFixed(0):"0";return(<g key={i}>
            <circle cx={cx} cy={cy} r={4} fill={p.y>=0?"#00D6B0":"#e53935"} stroke="var(--card-bg)" strokeWidth={2}/>
            {chartPoints.length<=6&&<text x={cx} y={cy-10} textAnchor="middle" fontSize="9" fill={p.y>=0?"#00D6B0":"#e53935"} fontFamily="monospace">{p.y>=0?"+":""}{pct}٪</text>}
          </g>);})}
          {/* Axis labels */}
          <text x={padX} y={padY+innerH+padB-6} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.25)" fontFamily="Vazirmatn">قدیم</text>
          <text x={chartW-14} y={padY+innerH+padB-6} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.25)" fontFamily="Vazirmatn">جدید</text>
        </svg>
      </div>}

      {/* Stats grid */}
      {bs.sessions.length>0&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        {[
          {label:"تعداد معاملات",val:toFaDigits(String(bs.sessions.length)),svgPath:"M3 3h18v18H3z M3 9h18 M3 15h18 M9 3v18 M15 3v18",color:undefined},
          {label:"معاملات موفق",val:toFaDigits(String(winSessions.length)),svgPath:"M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3",color:"#00D6B0"},
          {label:"معاملات ناموفق",val:toFaDigits(String(lossSessions.length)),svgPath:"M18 6 6 18 M6 6l12 12",color:"#e53935"},
          {label:"نرخ موفقیت",val:`${toFaDigits(String(winRate))}٪`,svgPath:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",color:winRate>=50?"#00D6B0":"#e53935"},
          {label:"میانگین سود",val:avgGain?`+${faFixed(avgGain,2)}`:"—",svgPath:"M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6",color:"#00D6B0"},
          {label:"میانگین زیان",val:avgLoss?`${faFixed(avgLoss,2)}`:"—",svgPath:"M23 18l-9.5-9.5-5 5L1 6 M17 18h6v-6",color:"#e53935"},
        ].map(s=><div key={s.label} style={{borderRadius:14,padding:"14px 14px",background:"var(--card-bg)",border:"1px solid var(--border-color)",display:"flex",flexDirection:"column",gap:6}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.color||"rgba(120,190,210,0.5)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={s.svgPath}/></svg>
          <div style={{fontSize:11,color:"var(--text-muted)"}}>{s.label}</div>
          <div style={{fontSize:17,fontWeight:900,color:s.color||"var(--text-primary)"}}>{s.val}</div>
        </div>)}
      </div>}

      {/* Activation status card */}
      <div style={{borderRadius:18,padding:"18px 20px",marginBottom:16,background:"var(--card-bg)",border:"1px solid var(--border-color)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontWeight:800,fontSize:15,color:"var(--text-primary)"}}>وضعیت ربات</div>
          <div style={{display:"inline-flex",alignItems:"center",gap:7,padding:"7px 16px",borderRadius:20,background:bs.status==="active"?"rgba(0,255,136,0.12)":bs.status==="pending"?"rgba(245,194,61,0.12)":"rgba(229,57,53,0.12)",border:`1.5px solid ${bs.status==="active"?"rgba(0,255,136,0.3)":bs.status==="pending"?"rgba(245,194,61,0.3)":"rgba(229,57,53,0.3)"}`}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:bs.status==="active"?"#00ff88":bs.status==="pending"?"#f5c23d":"#e53935",boxShadow:bs.status!=="inactive"?`0 0 8px ${bs.status==="active"?"#00ff88":"#f5c23d"}`:"none",display:"inline-block",flexShrink:0}}/>
            <span style={{fontSize:13,fontWeight:800,color:bs.status==="active"?"#00ff88":bs.status==="pending"?"#f5c23d":"#e53935"}}>{bs.status==="active"?"فعال":bs.status==="pending"?"در انتظار":"غیر فعال"}</span>
          </div>
        </div>
        {bs.status==="active"&&<div style={{fontSize:13,color:"#00D6B0",marginBottom:4}}>ربات متصل است و در حال انجام معاملات می‌باشد.</div>}
        {bs.status==="inactive"&&<div style={{fontSize:13,color:"#e53935",marginBottom:4}}>ربات غیر فعال است. برای شروع، مقدار USDT تخصیص دهید.</div>}
        {bs.activatedAt&&bs.status!=="inactive"&&<div style={{fontSize:12,color:"var(--text-muted)",marginBottom:4}}>فعال‌سازی: {new Date(bs.activatedAt).toLocaleDateString("fa-IR")} · {new Date(bs.activatedAt).toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit"})}</div>}
        <div style={{fontSize:12,color:"var(--text-muted)",lineHeight:1.8,marginTop:4}}>سود و زیان هر ۲۴ تا ۴۸ ساعت یکبار آپدیت می‌شود.</div>
      </div>

      {/* Activation input (inactive state) */}
      {bs.status==="inactive"&&<div style={{borderRadius:16,padding:"16px",marginBottom:12,background:"var(--card-bg)",border:"1px solid var(--border-color)"}}>
        <label style={{fontSize:13,color:"var(--text-muted)",display:"block",marginBottom:10}}>مقدار USDT جهت تخصیص به ربات</label>
        <div style={{display:"flex",alignItems:"center",gap:8,background:"var(--input-bg)",border:"1.5px solid var(--border-color)",borderRadius:12,padding:"4px 12px",marginBottom:8}}>
          <input style={{flex:1,background:"none",border:"none",outline:"none",color:"var(--text-primary)",fontSize:18,fontFamily:"Vazirmatn",fontWeight:700,padding:"10px 0",textAlign:"left",direction:"ltr"}}
            inputMode="decimal" placeholder="0.00" value={amount}
            onChange={e=>{setAmount(toLatinDigits(e.target.value).replace(/[^0-9.]/g,""));setAmountErr("");}}/>
          <span style={{color:"var(--text-muted)",fontSize:12,flexShrink:0}}>USDT</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:11,color:"var(--text-muted)"}}>حداکثر: {faFixed(maxAlloc,2)} USDT</span>
          <div style={{display:"flex",gap:6}}>{[25,50,75,100].map(p=><button key={p} style={{fontSize:10,padding:"4px 9px",borderRadius:8,border:"1px solid var(--border-color)",background:"var(--card-bg3)",color:"var(--text-secondary)",cursor:"pointer",fontFamily:"Vazirmatn"}} onClick={()=>setAmount(String(Math.floor(maxAlloc*p/100*100)/100))}>{toFaDigits(String(p))}٪</button>)}</div>
        </div>
        {amountErr&&<p className="field-err" style={{marginTop:8}}>{amountErr}</p>}
      </div>}
      {bs.status==="inactive"&&<button
        style={{width:"100%",padding:"16px",borderRadius:14,background:cooledDown?"linear-gradient(135deg,#c62828,#e53935)":"rgba(255,255,255,0.08)",border:"none",color:cooledDown?"#fff":"var(--text-muted)",fontSize:15,fontWeight:800,fontFamily:"Vazirmatn",cursor:cooledDown?"pointer":"not-allowed",marginBottom:12,opacity:cooledDown?1:0.5,transition:"all 0.2s"}}
        onClick={cooledDown?()=>setShowWarning(true):undefined}>
        فعال‌سازی ربات فارکس آن‌پرداز
        {!cooledDown&&<div style={{fontSize:11,marginTop:4,opacity:0.7}}>تا {toFaDigits(String(cooldownHours))} ساعت دیگر قابل فعال‌سازی</div>}
      </button>}
      {bs.status!=="inactive"&&<button
        style={{width:"100%",padding:"14px",borderRadius:14,background:"rgba(0,214,176,0.08)",border:"2px solid rgba(0,214,176,0.3)",color:"var(--accent)",fontSize:14,fontWeight:700,fontFamily:"Vazirmatn",cursor:"pointer",marginBottom:12}}
        onClick={()=>setShowCandlePopup(true)}>مشاهده نمودار زنده ربات ›</button>}

      {/* Trading history */}
      {bs.sessions.length>0&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>تاریخچه معاملات</span>
          <button onClick={()=>setShowPdfPopup(true)}
            style={{fontSize:12,padding:"6px 14px",borderRadius:10,background:"rgba(0,214,176,0.1)",border:"1px solid rgba(0,214,176,0.25)",color:"var(--accent)",cursor:"pointer",fontFamily:"Vazirmatn",fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
            📄 خروجی PDF
          </button>
        </div>
        <div style={{borderRadius:16,overflow:"hidden",border:"1px solid var(--border-color)",marginBottom:16}}>
          {/* Table header */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",padding:"10px 14px",background:"rgba(255,255,255,0.04)",borderBottom:"1px solid var(--border-color)"}}>
            {["ردیف","سرمایه","سود/زیان","تاریخ"].map(h=><span key={h} style={{fontSize:10,fontWeight:700,color:"var(--text-muted)",textAlign:"center"}}>{h}</span>)}
          </div>
          {bs.sessions.slice(0,8).map((s,i)=><div key={s.id} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",padding:"12px 14px",borderBottom:i<Math.min(bs.sessions.length,8)-1?"1px solid var(--border-color)":"none",background:i%2===0?"transparent":"rgba(255,255,255,0.015)"}}>
            <span style={{fontSize:12,color:"var(--text-muted)",textAlign:"center"}}>{toFaDigits(String(i+1))}</span>
            <span style={{fontSize:12,fontWeight:600,color:"var(--text-primary)",textAlign:"center"}}>{faFixed(s.amount,1)}</span>
            <span style={{fontSize:12,fontWeight:800,textAlign:"center",color:s.pnl==null?"#f5c23d":s.pnl>=0?"#00D6B0":"#e53935"}}>
              {s.pnl==null?"⌛":`${s.pnl>=0?"+":""}${faFixed(s.pnl,2)}`}
            </span>
            <span style={{fontSize:10,color:"var(--text-muted)",textAlign:"center"}}>{new Date(s.activatedAt).toLocaleDateString("fa-IR")}</span>
          </div>)}
        </div>
      </>}
    </div>
  </div>
  {showHelp&&<div className="modal-overlay" style={{zIndex:19000}} onClick={()=>setShowHelp(false)}>
    <div className="modal-card" onClick={e=>e.stopPropagation()} style={{maxWidth:400,maxHeight:"85dvh",overflowY:"auto",padding:"24px 20px"}}>
      <div className="modal-handle"/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h3 style={{margin:0,fontSize:17,fontWeight:800}}>راهنمای فارکس</h3>
        <button onClick={()=>setShowHelp(false)} style={{width:32,height:32,borderRadius:10,background:"rgba(255,255,255,0.06)",border:"1px solid var(--border-color)",color:"var(--text-muted)",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
      </div>
      <p style={{fontSize:12,color:"var(--text-muted)",marginBottom:16,lineHeight:1.7}}>پرسش‌های متداول درباره ربات فارکس و بازار ارز خارجی</p>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {faqTopics.map((item,i)=><div key={i} style={{borderRadius:12,border:"1px solid var(--border-color)",overflow:"hidden"}}>
          <button onClick={()=>setHelpOpen(helpOpen===i?null:i)}
            style={{width:"100%",padding:"13px 14px",background:helpOpen===i?"rgba(0,214,176,0.06)":"transparent",border:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",fontFamily:"Vazirmatn",textAlign:"right"}}>
            <span style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",flex:1,textAlign:"right"}}>{item.q}</span>
            <span style={{color:"var(--accent)",fontSize:16,fontWeight:800,marginRight:8,transform:helpOpen===i?"rotate(180deg)":"none",transition:"transform 0.2s",flexShrink:0}}>⌄</span>
          </button>
          {helpOpen===i&&<div style={{padding:"0 14px 13px",fontSize:13,color:"var(--text-muted)",lineHeight:1.9,direction:"rtl",borderTop:"1px solid var(--border-color)"}}>{item.a}</div>}
        </div>)}
      </div>
    </div>
  </div>}
  {showWarning&&<div className="modal-overlay" onClick={()=>setShowWarning(false)}>
    <div className="modal-card" onClick={e=>e.stopPropagation()} style={{maxWidth:360}}>
      <div className="modal-handle"/>
      <div style={{textAlign:"center",marginBottom:16}}>
        <div style={{fontSize:36,marginBottom:8}}>⚠️</div>
        <h3 style={{margin:0,fontSize:17,fontWeight:900}}>هشدار مهم فارکس</h3>
      </div>
      <div style={{fontSize:13,color:"var(--text-muted)",lineHeight:2,marginBottom:20,direction:"rtl"}}>
        {["هرگز تمام سرمایه خود را در بازار فارکس سرمایه‌گذاری نکنید.","معاملات فارکس می‌تواند منجر به از دست رفتن بخش یا تمام سرمایه تخصیص‌یافته شود.","فقط مبلغی را تخصیص دهید که آمادگی ریسک آن را دارید.","عملکرد گذشته ربات تضمینی برای نتایج آینده نیست.","شرایط بازار می‌تواند به سرعت تغییر کند.","مسئولیت پذیرش ریسک‌های ربات معامله‌گر بر عهده کاربر است."].map((w,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:6}}>
          <span style={{color:"#e53935",flexShrink:0,marginTop:2}}>•</span><span>{w}</span>
        </div>)}
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>setShowWarning(false)} style={{flex:1,height:46,borderRadius:12,border:"1px solid var(--border-color)",background:"var(--card-bg2)",color:"var(--text-secondary)",fontSize:14,fontWeight:700,fontFamily:"Vazirmatn",cursor:"pointer"}}>انصراف</button>
        <button onClick={()=>{setShowWarning(false);handleActivate();}} style={{flex:2,height:46,borderRadius:12,border:"none",background:"#00D6B0",color:"#071d2c",fontSize:14,fontWeight:800,fontFamily:"Vazirmatn",cursor:"pointer"}}>پذیرفتم — فعال‌سازی</button>
      </div>
    </div>
  </div>}
  {showCandlePopup&&<div className="modal-overlay" onClick={()=>{}}>
    <div className="modal-card" onClick={e=>e.stopPropagation()} style={{maxWidth:380,maxHeight:"85dvh",overflowY:"auto"}}>
      <div className="modal-handle"/>
      <div style={{textAlign:"center",marginBottom:12}}>
        <h3 style={{margin:0,fontSize:16,fontWeight:900}}>وضعیت ربات فارکس آن‌پرداز</h3>
      </div>
      <div style={{borderRadius:12,background:"var(--card-bg2)",padding:"12px",marginBottom:14,overflow:"hidden"}}>
        <svg viewBox="0 0 240 140" style={{width:"100%",height:140}}>
          {candles.map((c,i)=>{
            const x=i*20+4;const scale=2.5;
            const high=(140-c.h*scale);const low=(140-c.l*scale);
            const open=(140-c.o*scale);const close=(140-c.c*scale);
            return <g key={i}>
              <line x1={x+6} y1={high} x2={x+6} y2={low} stroke={c.bull?"#00D6B0":"#e53935"} strokeWidth={1.5}/>
              <rect x={x} y={Math.min(open,close)} width={12} height={Math.max(2,Math.abs(close-open))} rx={1} fill={c.bull?"#00D6B0":"#e53935"} opacity={0.9}/>
            </g>;
          })}
        </svg>
      </div>
      <div style={{textAlign:"center",marginBottom:14}}>
        <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:6}}>
          بعد از تایید توسط آن‌پرداز، ربات شما با مقدار
          <b style={{color:"var(--accent)",margin:"0 4px"}}>{faFixed(bs.amount,2)} دلار تتر</b>
          شروع به معامله در بازار فارکس می‌کند
        </div>
        <div style={{fontSize:15,fontWeight:900,color:bs.status==="active"?"#00D6B0":"#f5c23d",animation:"pulse 1.5s infinite"}}>
          {bs.status==="active"?"ربات متصل و فعال و در حال ترید است":"در حال تایید اولیه"}
        </div>
        <div style={{fontSize:11,color:"var(--text-muted)",marginTop:8}}>
          سود و زیان ربات هر ۲۴ ساعت یکبار و یا هر ۴۸ ساعت یکبار آپدیت می‌شود
        </div>
      </div>
      <button className="outline-button" style={{width:"100%",marginBottom:8}} onClick={()=>setShowCandlePopup(false)}>بستن</button>
      <button style={{width:"100%",padding:"12px",borderRadius:12,background:"none",border:"1.5px solid #e5393544",color:"#e53935",fontSize:13,fontWeight:700,fontFamily:"Vazirmatn",cursor:"pointer"}}
        onClick={()=>setShowDeactivateConfirm(true)}>
        ربات آن پرداز را غیر فعال می‌کنم
      </button>
    </div>
  </div>}
  {showDeactivateConfirm&&<div className="modal-overlay">
    <div className="modal-card" onClick={e=>e.stopPropagation()} style={{maxWidth:340}}>
      <div className="modal-handle"/>
      <p style={{fontSize:13,color:"var(--text-muted)",lineHeight:1.9,textAlign:"center",marginBottom:20}}>
        آیا از متوقف کردن ربات فارکس آن‌پرداز اطمینان دارید؟ (در هر ۲۴ ساعت فقط یکبار اجازه فعال و غیر فعال کردن ربات را دارید)
      </p>
      <button className="primary-button" style={{width:"100%",marginBottom:8,background:"linear-gradient(135deg,#c62828,#e53935)"}}
        disabled={deactivating} onClick={handleDeactivate}>
        {deactivating?"در حال پردازش...":"متوقف کردن"}
      </button>
      <button className="outline-button" style={{width:"100%"}} onClick={()=>setShowDeactivateConfirm(false)}>انصراف</button>
      {!cooledDown&&bs.status==="inactive"&&<p style={{fontSize:11,color:"var(--text-muted)",textAlign:"center",marginTop:8}}>
        تا {toFaDigits(String(cooldownHours))} ساعت دیگر شما نمی‌توانید از ربات معامله‌گر فارکس آن‌پرداز استفاده کنید
      </p>}
    </div>
  </div>}
  {showPdfPopup&&<div className="modal-overlay" onClick={()=>setShowPdfPopup(false)}><div className="modal-card" onClick={e=>e.stopPropagation()} style={{maxWidth:320,padding:"28px 24px",textAlign:"center"}} dir="rtl">
    <div style={{fontSize:40,marginBottom:12}}>📄</div>
    <h3 style={{fontSize:17,fontWeight:900,marginBottom:10,color:"var(--text-primary)"}}>خروجی گزارش PDF</h3>
    <p style={{fontSize:14,color:"var(--text-muted)",lineHeight:1.9}}>گزارش معاملات ربات فارکس در حال آماده‌سازی است و به زودی به ایمیل شما ارسال خواهد شد.</p>
    <button className="primary-button" style={{marginTop:20,width:"100%"}} onClick={()=>setShowPdfPopup(false)}>متوجه شدم</button>
  </div></div>}
  </>;
}

function WithdrawOtpModal({onConfirm,onClose}:{onConfirm:()=>void;onClose:()=>void}){
  const [emailOtp,setEmailOtp]=useState("");
  const [phoneOtp,setPhoneOtp]=useState("");
  const [secs,setSecs]=useState(60);
  const [expired,setExpired]=useState(false);
  const [verifying,setVerifying]=useState(false);
  const [emailErr,setEmailErr]=useState("");
  const [phoneErr,setPhoneErr]=useState("");
  useEffect(()=>{
    if(expired)return;
    if(secs<=0){setExpired(true);return;}
    const t=setTimeout(()=>setSecs(s=>s-1),1000);
    return()=>clearTimeout(t);
  },[secs,expired]);
  const resend=()=>{setSecs(60);setExpired(false);setEmailOtp("");setPhoneOtp("");setEmailErr("");setPhoneErr("");};
  const verify=()=>{
    if(expired)return;
    let ok=true;
    if(emailOtp.length<4){setEmailErr("کد واردشده صحیح نیست.");ok=false;}
    if(phoneOtp.length<4){setPhoneErr("کد واردشده صحیح نیست.");ok=false;}
    if(!ok)return;
    setVerifying(true);
    setTimeout(()=>{setVerifying(false);onConfirm();},1400);
  };
  const canSubmit=emailOtp.length>=4&&phoneOtp.length>=4&&!expired&&!verifying;
  const mm=String(Math.floor(secs/60)).padStart(2,"0");
  const ss=String(secs%60).padStart(2,"0");
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="otp-modal-card" onClick={e=>e.stopPropagation()} dir="rtl">
        <div className="modal-handle"/>
        <div className="otp-shield-icon">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <path d="M16 3L5 7v10c0 6.6 4.6 12.8 11 14.4C22.4 29.8 27 23.6 27 17V7L16 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
            <path d="M11 16l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="otp-modal-title">تأیید برداشت</h3>
        <p className="otp-modal-desc">برای تکمیل درخواست برداشت، کدهای ارسال‌شده به ایمیل و شماره موبایل خود را وارد کنید.</p>
        <div className="otp-field-group" style={{width:"100%"}}>
          <label className="otp-field-label">کد ارسال‌شده به ایمیل</label>
          <input className={"otp-input"+(emailErr?" otp-input-err":"")} inputMode="numeric" maxLength={6} placeholder="— — — — — —" value={toFaDigits(emailOtp)} onChange={e=>{setEmailOtp(toLatinDigits(e.target.value).replace(/\D/g,""));setEmailErr("");}} disabled={expired||verifying}/>
          {emailErr&&<span className="otp-err-msg">{emailErr}</span>}
        </div>
        <div className="otp-field-group" style={{width:"100%"}}>
          <label className="otp-field-label">کد ارسال‌شده به شماره موبایل</label>
          <input className={"otp-input"+(phoneErr?" otp-input-err":"")} inputMode="numeric" maxLength={6} placeholder="— — — — — —" value={toFaDigits(phoneOtp)} onChange={e=>{setPhoneOtp(toLatinDigits(e.target.value).replace(/\D/g,""));setPhoneErr("");}} disabled={expired||verifying}/>
          {phoneErr&&<span className="otp-err-msg">{phoneErr}</span>}
        </div>
        <div className="otp-timer-row" style={{width:"100%"}}>
          {expired
            ?<span className="otp-expired-txt">زمان وارد کردن کدها به پایان رسیده است.</span>
            :<span className="otp-timer-txt">زمان باقی‌مانده: <b>{toFaDigits(mm+":"+ss)}</b></span>
          }
        </div>
        <button className="primary-button" style={{width:"100%",marginTop:12,opacity:canSubmit?1:0.42}} disabled={!canSubmit} onClick={verify}>
          {verifying?"در حال تأیید...":"تأیید و برداشت"}
        </button>
        {expired&&<button className="outline-button" style={{width:"100%",marginTop:8}} onClick={resend}>ارسال مجدد کد</button>}
        </div>
      </div>
  );
}

// ─── Shared countdown circle ──────────────────────────────────────────────────
function CircleTimer({secs,total,color}:{secs:number;total:number;color:string}){
  const r=22;const circ=2*Math.PI*r;const offset=circ*(1-secs/total);
  return <svg width="56" height="56" style={{display:"block",flexShrink:0,alignSelf:"center"}}>
    <circle cx="28" cy="28" r={r} fill="none" stroke="var(--border-faint)" strokeWidth="3.5"/>
    <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="3.5"
      strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
      transform="rotate(-90 28 28)" style={{transition:"stroke-dashoffset 1s linear"}}/>
    <text x="28" y="33" textAnchor="middle" fontSize="14" fontWeight="800" fill={color} fontFamily="Vazirmatn">{toFaDigits(String(secs))}</text>
  </svg>;
}

// ─── Withdraw Confirm Sheet ────────────────────────────────────────────────────
function WithdrawConfirmSheet({onConfirm,onClose,summary,onHistory}:{onConfirm:()=>void;onClose:()=>void;summary:{amount:string;destination:string};onHistory?:()=>void}){
  const [gaConnected,setGaConnected]=useState(()=>localStorage.getItem("anp_ga_connected")==="1");
  const [stage,setStage]=useState<"setup"|"otp"|"success">(gaConnected?"otp":"setup");
  const [setupStep,setSetupStep]=useState(0);
  const [setupOtp,setSetupOtp]=useState("");
  const [gaSecs,setGaSecs]=useState(60);
  const [smsSecs,setSmsSecs]=useState(120);
  const [gaCode,setGaCode]=useState("");
  const [smsCode,setSmsCode]=useState("");
  const [verifying,setVerifying]=useState(false);
  const SETUP_KEY="ANPX 4K7Z Y3QR MTWL 8J2F BVDP 9NCS KEHR";
  useEffect(()=>{
    if(stage!=="otp")return;
    const t=setInterval(()=>setGaSecs(s=>s<=1?60:s-1),1000);
    return()=>clearInterval(t);
  },[stage]);
  useEffect(()=>{
    if(stage!=="otp")return;
    const t=setInterval(()=>setSmsSecs(s=>Math.max(0,s-1)),1000);
    return()=>clearInterval(t);
  },[stage]);
  const connectGA=()=>{
    if(setupOtp.length<6)return;
    localStorage.setItem("anp_ga_connected","1");
    setGaConnected(true);
    setStage("otp");
  };
  const verify=()=>{
    if(gaCode.length<6||smsCode.length<6||verifying)return;
    setVerifying(true);
    setTimeout(()=>{setVerifying(false);setStage("success");},1400);
  };
  const canSubmit=gaCode.length===6&&smsCode.length===6&&!verifying&&smsSecs>0;
  const gaProgress=(60-gaSecs)/60;
  const smsProgress=(120-smsSecs)/120;
  const setupSteps=[
    {title:"نصب Google Authenticator",desc:"اپلیکیشن Google Authenticator را از App Store یا Google Play دانلود کنید.",icon:"📲"},
    {title:"وارد کردن کلید راه‌اندازی",desc:"در اپلیکیشن «Enter a setup key» را انتخاب کنید و کلید زیر را وارد نمایید.",icon:"🔑"},
    {title:"تأیید اتصال",desc:"کد ۶ رقمی نمایش داده شده در اپلیکیشن را وارد کنید.",icon:"✅"},
  ];
  const handleBack=()=>{if(stage==="setup"&&setupStep>0){setSetupStep(s=>s-1);}else if(stage==="success"){onConfirm();}else{onClose();}};
  useBackHandler(handleBack);
  return (
    <div className="anp-full-page" dir="rtl">
      <div className="anp-page-header">
        <button className="back-btn" onClick={handleBack}><Icon name="arrow" size={20}/></button>
        <h2 className="subscreen-title">{stage==="setup"?"اتصال Google Authenticator":stage==="otp"?"تأیید برداشت":"برداشت موفق"}</h2>
        <div style={{width:36}}/>
      </div>
      <div className="anp-page-body">
        <div className="wcs-sheet" style={{background:"transparent",border:"none",padding:0}}>
        {stage==="setup"&&<>
          <div className="wcs-header">
            <div className="wcs-shield-icon">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M16 3L5 7v10c0 6.6 4.6 12.8 11 14.4C22.4 29.8 27 23.6 27 17V7L16 3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M11 16l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h3 className="wcs-title">اتصال Google Authenticator</h3>
            <p className="wcs-desc">برای افزایش امنیت برداشت، ابتدا Google Authenticator را متصل کنید.</p>
          </div>
          <div className="wcs-steps">
            {setupSteps.map((s,i)=>(
              <div key={i} className={`wcs-step${setupStep===i?" wcs-step--active":setupStep>i?" wcs-step--done":""}`}>
                <div className="wcs-step-num">{setupStep>i?<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>:toFaDigits(String(i+1))}</div>
                <div className="wcs-step-body">
                  <b>{s.title}</b>
                  {(setupStep===i||setupStep>i)&&<span>{s.desc}</span>}
                  {setupStep===1&&i===1&&<div className="wcs-key-box">{SETUP_KEY}</div>}
                  {setupStep===2&&i===2&&<input className="wcs-otp-input" inputMode="numeric" maxLength={6} placeholder="— — — — — —" value={toFaDigits(setupOtp)} onChange={e=>{setSetupOtp(toLatinDigits(e.target.value).replace(/\D/g,""));}} style={{marginTop:8}}/>}
                </div>
              </div>
            ))}
          </div>
          <div className="wcs-actions">
            {setupStep<2?<button className="primary-button" style={{width:"100%"}} onClick={()=>setSetupStep(s=>s+1)}>ادامه</button>:<button className="primary-button" style={{width:"100%",opacity:setupOtp.length>=6?1:0.45}} disabled={setupOtp.length<6} onClick={connectGA}>تأیید و اتصال</button>}
            {setupStep===0&&<button className="outline-button" style={{width:"100%",marginTop:8}} onClick={onClose}>انصراف</button>}
            {setupStep>0&&<button className="outline-button" style={{width:"100%",marginTop:8}} onClick={()=>setSetupStep(s=>s-1)}>بازگشت</button>}
          </div>
        </>}
        {stage==="otp"&&<>
          <div className="wcs-header">
            <div className="wcs-shield-icon wcs-shield-icon--connected">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
            </div>
            <h3 className="wcs-title">تأیید برداشت</h3>
            <p className="wcs-desc">برای تکمیل برداشت، دو کد تأیید را وارد کنید.</p>
          </div>
          <div className="wcs-summary">
            <span className="wcs-sum-label">مبلغ برداشت</span>
            <span className="wcs-sum-amount">{summary.amount}</span>
            <span className="wcs-sum-dest">{summary.destination}</span>
          </div>
          <div className="wcs-otp-block">
            <div className="wcs-otp-row">
              <CircleTimer secs={gaSecs} total={60} color="var(--accent)"/>
              <div className="wcs-otp-field">
                <div className="wcs-otp-label-row">
                  <span className="wcs-otp-label">کد Google Authenticator</span>
                  <span className="wcs-ga-badge">● متصل است</span>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}><input className="wcs-otp-input" style={{flex:1}} type="tel" inputMode="numeric" maxLength={6} placeholder="— — — — — —" value={toFaDigits(gaCode)} onChange={e=>setGaCode(toLatinDigits(e.target.value).replace(/\D/g,"").slice(0,6))} disabled={verifying}/><button type="button" onClick={()=>{navigator.clipboard?.readText().then(t=>{const v=t.trim().replace(/\D/g,"").slice(0,6);if(v)setGaCode(v);}).catch(()=>{});}} style={{flexShrink:0,padding:"12px 14px",borderRadius:10,background:"var(--card-bg2,rgba(0,214,176,0.1))",border:"1px solid rgba(0,214,176,0.3)",color:"var(--accent)",fontFamily:"Vazirmatn",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",minHeight:48}}>چسباندن</button></div>
              </div>
            </div>
            <div className="wcs-otp-divider"/>
            <div className="wcs-otp-row">
              <CircleTimer secs={smsSecs} total={120} color={smsSecs>30?"var(--accent)":"#e85c5c"}/>
              <div className="wcs-otp-field">
                <div className="wcs-otp-label-row">
                  <span className="wcs-otp-label">کد پیامک</span>
                  {smsSecs>0?<span className="wcs-sms-timer">{toFaDigits(String(smsSecs))}ث</span>:<button className="wcs-resend-btn" onClick={()=>setSmsSecs(120)}>ارسال مجدد</button>}
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}><input className="wcs-otp-input" style={{flex:1}} type="tel" inputMode="numeric" maxLength={6} placeholder="— — — — — —" value={toFaDigits(smsCode)} onChange={e=>setSmsCode(toLatinDigits(e.target.value).replace(/\D/g,"").slice(0,6))} disabled={verifying||smsSecs===0}/><button type="button" onClick={()=>{navigator.clipboard?.readText().then(t=>{const v=t.trim().replace(/\D/g,"").slice(0,6);if(v)setSmsCode(v);}).catch(()=>{});}} disabled={verifying||smsSecs===0} style={{flexShrink:0,padding:"12px 14px",borderRadius:10,background:"var(--card-bg2,rgba(0,214,176,0.1))",border:"1px solid rgba(0,214,176,0.3)",color:"var(--accent)",fontFamily:"Vazirmatn",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",minHeight:48,opacity:smsSecs===0?0.4:1}}>چسباندن</button></div>
              </div>
            </div>
          </div>
          <div className="wcs-actions">
            <button className="primary-button" style={{width:"100%",opacity:canSubmit?1:0.42}} disabled={!canSubmit} onClick={verify}>
              {verifying?"در حال تأیید...":"تأیید و انتقال"}
            </button>
          </div>
        </>}
        {stage==="success"&&<>
          <div className="wcs-success">
            <div className="wcs-success-icon">
              <svg width="42" height="42" viewBox="0 0 42 42" fill="none"><circle cx="21" cy="21" r="20" stroke="currentColor" strokeWidth="1.5"/><path d="M13 21l6 6 10-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h3 className="wcs-success-title">برداشت با موفقیت ثبت شد</h3>
            <p className="wcs-success-desc">درخواست شما در صف انجام قرار گرفت و پس از بررسی پردازش خواهد شد.</p>
            <div className="wcs-success-info">
              <span>{summary.amount}</span>
              <span>{summary.destination}</span>
            </div>
            <button className="primary-button" style={{width:"100%",marginTop:8}} onClick={()=>{onConfirm();}}>بازگشت</button>
            {onHistory&&<button className="outline-button" style={{width:"100%",marginTop:10,padding:"14px",fontSize:14,fontWeight:700}} onClick={onHistory}>تاریخچه نقل و انتقالات و معاملات</button>}
          </div>
        </>}
        </div>
      </div>
    </div>
  );
}

function QrScannerOverlay({onClose,onScan}:{onClose:()=>void;onScan:(addr:string)=>void}){
  const videoRef=useRef<HTMLVideoElement>(null);
  const streamRef=useRef<MediaStream|null>(null);
  const rafRef=useRef<number>(0);
  const [camErr,setCamErr]=useState("");
  const [scanState,setScanState]=useState<"scanning"|"found"|"denied">("scanning");
  const [foundAddr,setFoundAddr]=useState("");
  useEffect(()=>{
    let active=true;
    navigator.mediaDevices?.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}}})
      .then(stream=>{
        if(!active){stream.getTracks().forEach(t=>t.stop());return;}
        streamRef.current=stream;
        if(videoRef.current){videoRef.current.srcObject=stream;videoRef.current.play().catch(()=>{});}
        const tryDecode=()=>{
          if(!active)return;
          const v=videoRef.current;
          if(v&&!v.paused&&v.readyState>=2&&"BarcodeDetector" in window){
            const bd=new (window as any).BarcodeDetector({formats:["qr_code"]});
            bd.detect(v).then((codes:any[])=>{
              if(codes.length>0&&active){
                const raw=codes[0].rawValue as string;
                const addr=raw.replace(/^(bitcoin|ethereum|litecoin|ripple|tron|bnb):?/i,"").split("?")[0].trim();
                if(addr.length>10){active=false;setFoundAddr(addr);setScanState("found");return;}
              }
            }).catch(()=>{});
          }
          if(active)rafRef.current=requestAnimationFrame(tryDecode);
        };
        rafRef.current=requestAnimationFrame(tryDecode);
      })
      .catch(e=>{
        if(!active)return;
        if(e.name==="NotAllowedError"||e.name==="PermissionDeniedError")setScanState("denied");
        else setCamErr("دوربین در دسترس نیست");
      });
    return()=>{
      active=false;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t=>t.stop());
    };
  },[]);
  const handleUse=()=>{if(foundAddr)onScan(foundAddr);};
  return <div className="qr-scanner-overlay" dir="rtl">
    <div className="qr-scanner-header">
      <button className="qr-close-btn" onClick={onClose}><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
      <div className="qr-brand"><span className="qr-brand-dot"/>صرافی ارز دیجیتال آن پرداز</div>
    </div>
    {scanState==="denied"?
      <div className="qr-center-msg">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{marginBottom:14}}><circle cx="24" cy="24" r="22" stroke="rgba(255,255,255,0.2)" strokeWidth="2"/><path d="M16 32c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#00CC8F" strokeWidth="2.5" strokeLinecap="round"/><circle cx="24" cy="18" r="4" stroke="#00CC8F" strokeWidth="2.5"/><path d="M14 14l20 20" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"/></svg>
        <p style={{color:"rgba(255,255,255,0.7)",fontSize:14,textAlign:"center",lineHeight:1.8}}>دسترسی به دوربین رد شد.<br/>لطفاً مجوز دوربین را در تنظیمات مرورگر فعال کنید.</p>
        <button className="qr-action-btn" onClick={onClose}>بستن</button>
      </div>
    :scanState==="found"?
      <div className="qr-center-msg">
        <div className="qr-success-ring"><svg width="40" height="40" viewBox="0 0 40 40" fill="none"><polyline points="8,20 17,29 32,12" stroke="#00CC8F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
        <p style={{color:"rgba(255,255,255,0.5)",fontSize:11,margin:"10px 0 4px"}}>آدرس کیف پول شناسایی شد</p>
        <p dir="ltr" style={{color:"#fff",fontSize:12,fontFamily:"monospace",wordBreak:"break-all",background:"rgba(0,204,143,0.12)",border:"1px solid rgba(0,204,143,0.3)",borderRadius:10,padding:"8px 12px",margin:"0 0 18px",maxWidth:280,textAlign:"left"}}>{foundAddr.length>32?foundAddr.slice(0,16)+"…"+foundAddr.slice(-12):foundAddr}</p>
        <div style={{display:"flex",gap:10}}>
          <button className="qr-action-btn secondary" onClick={onClose}>انصراف</button>
          <button className="qr-action-btn" onClick={handleUse}>استفاده از آدرس</button>
        </div>
      </div>
    :
      <>
        <video ref={videoRef} className="qr-video" muted playsInline autoPlay/>
        <div className="qr-frame-container">
          <div className="qr-frame">
            <span className="qr-corner qr-corner--tl"/><span className="qr-corner qr-corner--tr"/>
            <span className="qr-corner qr-corner--bl"/><span className="qr-corner qr-corner--br"/>
            <div className="qr-scan-line"/>
          </div>
        </div>
        <div className="qr-bottom-info">
          {camErr?<p style={{color:"rgba(255,255,255,0.6)",fontSize:13}}>{camErr}</p>:<>
            <p className="qr-instruction">اسکن آدرس در حال انجام است</p>
            <p className="qr-brand-sub">صرافی ارز دیجیتال آن پرداز</p>
          </>}
        </div>
      </>
    }
  </div>;
}

function TomanWithdrawScreen({user,available,onBack,onGoHome,onHistory}:{user:UserData;available:number;onBack:()=>void;onGoHome:()=>void;onHistory?:()=>void}){
  const [selCard,setSelCard]=useState<BankCard|null>(user.cards[0]||null);
  const [showCardPicker,setShowCardPicker]=useState(false);
  const [twAmount,setTwAmount]=useState("");
  const [showOtp,setShowOtp]=useState(false);
  const [err,setErr]=useState("");
  const twAmtNum=parseInt(toLatinDigits(twAmount).replace(/\D/g,""))||0;
  const withdrawValid=!!selCard&&twAmtNum>0&&twAmtNum<=available;
  const fmtCard=(v:string)=>v.replace(/(.{4})(?=.)/g,"$1 ");
  const submit=()=>{
    if(!selCard){setErr("کارت مقصد را انتخاب کنید.");return;}
    if(!twAmount||Number(toLatinDigits(twAmount))<=0){setErr("مبلغ برداشت را وارد کنید.");return;}
    setErr("");setShowOtp(true);
  };
  return <>
    <div className="subscreen" dir="rtl">
      <div className="subscreen-header">
        <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
        <h2 className="subscreen-title">برداشت تومان</h2>
        <div style={{width:36}}/>
      </div>
      <div className="subscreen-body" style={{padding:"0 16px 80px"}}>
        <div className="bform-field" style={{marginBottom:16}}>
          <label className="field-label">واریز به</label>
          <button className="bform-card-select" onClick={()=>setShowCardPicker(true)}>
            {selCard?(
              <div className="bform-card-row">
                <BankLogo bankName={selCard.bank} size={44} rounded={13}/>
                <div className="bform-card-text">
                  <span className="bform-bank-name">{selCard.bank}</span>
                  <span className="bform-card-number" dir="ltr">{toFaDigits(fmtCard(selCard.number))}</span>
                </div>
              </div>
            ):(
              <div className="bform-card-row">
                <div className="bform-bank-dot bform-bank-dot--empty"><Icon name="credit" size={16}/></div>
                <span className="bform-card-placeholder">انتخاب کارت بانکی</span>
              </div>
            )}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div style={{fontSize:13,color:"#e6a817",marginTop:6,padding:"8px 12px",background:"rgba(230,168,23,0.1)",borderRadius:10,border:"1px solid rgba(230,168,23,0.2)"}}>مبلغ قابل برداشت در این صفحه از موجودی واقعی کیف پول آن صراف محاسبه می‌شود.</div>
        </div>
        <div className="bform-field" style={{marginBottom:8}}>
          <label className="field-label">مقدار برداشت به تومان</label>
          <div style={{display:"flex",alignItems:"center",gap:8,background:"var(--input-bg)",border:"1.5px solid var(--border-color)",borderRadius:16,padding:"4px 4px 4px 12px",minHeight:60}}>
            <input style={{flex:1,background:"none",border:"none",outline:"none",color:"var(--text-primary)",fontSize:17,fontFamily:"Vazirmatn",padding:"10px 4px",textAlign:"right",direction:"ltr",minWidth:0}}
              inputMode="numeric" placeholder="مبلغ مورد نظر" value={twAmtNum?fa(twAmtNum):""} onChange={e=>setTwAmount(toLatinDigits(e.target.value).replace(/\D/g,""))}/>
            <button style={{fontSize:11,padding:"8px 12px",borderRadius:12,background:"var(--accent)",color:"#001",border:"none",cursor:"pointer",fontFamily:"Vazirmatn",fontWeight:700,flexShrink:0,whiteSpace:"nowrap",lineHeight:1.3}} onClick={()=>setTwAmount(String(available))}>حداکثر<br/>قابل برداشت</button>
          </div>
          {twAmtNum>0&&<div className="amount-words" style={{marginTop:4}}>{numToFaWords(twAmtNum)} تومان</div>}
          <div style={{fontSize:13,color:"var(--text-muted)",marginTop:6,paddingRight:4}}>موجودی واقعی کیف پول: <strong style={{color:"var(--text-primary)"}}>{fa(available)}</strong> تومان</div>
        </div>
        {err&&<p className="field-err">{err}</p>}
        <div style={{borderRadius:12,padding:"14px",background:"var(--card-bg)",border:"1px solid var(--border-color)",marginTop:8}}>
          <div style={{fontSize:13,color:"var(--text-muted)",lineHeight:2,marginBottom:10}}>ثبت و تسویه برداشت بانکی این مسیر هنوز به سرویس بانکی Backend متصل نشده است؛ تا اتصال آن هیچ برداشت ساختگی یا کسر موجودی محلی انجام نمی‌شود.</div>
          <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",marginBottom:8}}>سیکل‌های پایا (روزهای غیر تعطیل)</div>
          {[["ثبت پیش از ۱۲ ظهر","ساعت ۱۲:۴۵ همان روز"],["ثبت پیش از ۱۸ عصر","ساعت ۱۸:۴۵ همان روز"],["ثبت پس از ساعت ۱۸ عصر","ساعت ۱۲:۴۵ روز کاری بعد"]].map(([a,b])=><div key={a} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--text-muted)",padding:"5px 0",borderBottom:"1px solid var(--border-color)"}}><span>{a}</span><span style={{color:"var(--accent)"}}>{b}</span></div>)}
          <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",margin:"10px 0 6px"}}>سیکل‌های پایا (روزهای تعطیل)</div>
          <div style={{fontSize:12,color:"var(--text-muted)"}}>ساعت ۱۲:۴۵ روز کاری بعد</div>
        </div>
      </div>
      <StickyActionBtn label="درخواست برداشت" onClick={submit} disabled={!withdrawValid}/>
    </div>
    {showOtp&&<WithdrawConfirmSheet summary={{amount:`${fa(twAmtNum)} تومان`,destination:selCard?`${selCard.bank} · ${toFaDigits(fmtCard(selCard.number))}`:"کارت بانکی"}} onConfirm={()=>{setShowOtp(false);onGoHome();}} onClose={()=>setShowOtp(false)} onHistory={onHistory}/>}
    {showCardPicker&&<div className="anp-full-page" dir="rtl">
      <div className="anp-page-header">
        <button className="back-btn" onClick={()=>setShowCardPicker(false)}><Icon name="arrow" size={20}/></button>
        <h2 className="subscreen-title">انتخاب کارت بانکی</h2>
        <div style={{width:36}}/>
      </div>
      <div className="anp-page-body">
        {user.cards.map(c=><button key={c.id} className="bs-card-item" onClick={()=>{setSelCard(c);setShowCardPicker(false);}}>
          <BankLogo bankName={c.bank} size={48} rounded={14}/>
          <div className="bs-card-info">
            <span className="bs-card-bank">{c.bank}</span>
            <span className="bs-card-num" dir="ltr">{toFaDigits(fmtCard(c.number))}</span>
            <span className="bs-card-holder">{c.holderName}</span>
          </div>
          {selCard?.id===c.id&&<Icon name="check" size={18}/>}
        </button>)}
      </div>
    </div>}
  </>;
}

function TomanDepositPage({user,tab,setTab,onBack}:{user:UserData;tab:"card"|"paya";setTab:(t:"card"|"paya")=>void;onBack:()=>void}){
  const [copied,setCopied]=useState<string|null>(null);
  const fmtC=(v:string)=>v.replace(/(.{4})(?=.)/g,"$1-");
  const copyText=async(text:string,key:string)=>{try{await navigator.clipboard?.writeText(text);setCopied(key);setTimeout(()=>setCopied(null),1800)}catch{}};
  const cardNum="6104338761369582";const iban="IR320160000000005260348 17";
  return <div className="subscreen" dir="rtl">
    <div className="subscreen-header">
      <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">واریز تومان</h2>
      <div style={{width:36}}/>
    </div>
    <div className="subscreen-body" style={{overflowY:"auto",padding:"16px 16px 80px"}}>
      <div className="segmented" style={{marginBottom:20}}>
        <button className={tab==="card"?"active":""} onClick={()=>setTab("card")}>کارت به کارت</button>
        <button className={tab==="paya"?"active":""} onClick={()=>setTab("paya")}>پایا (شناسه‌دار)</button>
      </div>
      {tab==="card"&&<>
        <p style={{fontSize:13,color:"var(--text-muted)",marginBottom:18,lineHeight:1.8}}>با استفاده از اطلاعات زیر مبلغ تومانی مورد نظرتان را واریز نمایید.</p>
        {user.cards.length>0&&<div style={{marginBottom:18}}>
          <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:8}}>کارت‌های ثبت‌شده شما (مبدا)</div>
          {user.cards.map(c=><div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:12,background:"var(--card-bg)",border:"1px solid var(--border-color)",marginBottom:8}}>
            <BankLogo bankName={c.bank} size={40} rounded={12}/>
            <div style={{flex:1,textAlign:"right"}}><div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)"}}>{c.bank}</div><div style={{fontSize:12,color:"var(--text-muted)",direction:"ltr",textAlign:"left"}}>{toFaDigits(fmtC(c.number))}</div></div>
          </div>)}
        </div>}
        <div style={{borderRadius:16,background:"var(--card-bg2,var(--card-bg))",border:"1px solid var(--border-color)",padding:"18px 16px",marginBottom:14}}>
          <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:12,fontWeight:600}}>حساب مقصد</div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <span style={{fontSize:22}}>💳</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12,color:"var(--text-muted)"}}>کارت</div>
              <div style={{fontSize:15,fontWeight:800,color:"var(--text-primary)",letterSpacing:1,direction:"ltr",textAlign:"left"}}>{toFaDigits(fmtC(cardNum))}</div>
              <div style={{fontSize:13,color:"var(--text-muted)"}}>بنام شرکت دیار آتیه گشا</div>
            </div>
            <button onClick={()=>copyText(cardNum,"cardNum")} style={{padding:"6px 12px",borderRadius:8,background:"rgba(0,214,176,0.12)",border:"1px solid rgba(0,214,176,0.25)",color:"var(--accent)",fontSize:12,cursor:"pointer",fontFamily:"Vazirmatn"}}>{copied==="cardNum"?"کپی شد ✓":"کپی"}</button>
          </div>
          <div style={{display:"flex",gap:16,marginTop:14,paddingTop:12,borderTop:"1px solid var(--border-color)"}}>
            <div style={{flex:1}}><div style={{fontSize:12,color:"var(--text-muted)"}}>سقف واریز</div><div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",marginTop:3}}>{fa(15000000)} تومان</div></div>
            <div style={{flex:1}}><div style={{fontSize:12,color:"var(--text-muted)"}}>زمان واریز</div><div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",marginTop:3}}>حداکثر در ۱۰ دقیقه</div></div>
          </div>
        </div>
      </>}
      {tab==="paya"&&<>
        <p style={{fontSize:13,color:"var(--text-muted)",marginBottom:18,lineHeight:1.8}}>با استفاده از اطلاعات زیر مبلغ مورد نظرتان را به کیف پول خود در صرافی آن‌پرداز انتقال دهید.</p>
        {user.cards.length>0&&<div style={{marginBottom:18}}>
          <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:8}}>مبدا مجاز</div>
          {user.cards.map(c=><div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:12,background:"var(--card-bg)",border:"1px solid var(--border-color)",marginBottom:8}}>
            <BankLogo bankName={c.bank} size={40} rounded={12}/>
            <div style={{flex:1,textAlign:"right"}}><div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)"}}>{c.bank}</div><div style={{fontSize:12,color:"var(--text-muted)",direction:"ltr",textAlign:"left"}}>{toFaDigits(fmtC(c.number))}</div></div>
          </div>)}
        </div>}
        <div style={{borderRadius:16,background:"var(--card-bg2,var(--card-bg))",border:"1px solid var(--border-color)",padding:"18px 16px",marginBottom:14}}>
          <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:12,fontWeight:600}}>حساب مقصد</div>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:13,color:"var(--text-muted)"}}>شبا</div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
              <div style={{fontSize:13,fontWeight:800,color:"var(--text-primary)",letterSpacing:0.5,direction:"ltr",flex:1}}>{toFaDigits("IR۳۲ ۰۱۶۰ ۰۰۰۰ ۰۰۰۰ ۰۵۲۶ ۰۳۴۸ ۱۷")}</div>
              <button onClick={()=>copyText(iban,"iban")} style={{padding:"6px 12px",borderRadius:8,background:"rgba(0,214,176,0.12)",border:"1px solid rgba(0,214,176,0.25)",color:"var(--accent)",fontSize:12,cursor:"pointer",fontFamily:"Vazirmatn",flexShrink:0}}>{copied==="iban"?"کپی شد ✓":"کپی"}</button>
            </div>
            <div style={{fontSize:13,color:"var(--text-muted)",marginTop:4}}>بنام دیار آتیه گشا</div>
          </div>
          <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid var(--border-color)"}}>
            <div style={{fontSize:13,color:"var(--accent)",fontWeight:700,marginBottom:6}}>شناسه واریز (الزامی)</div>
            <div style={{fontSize:13,color:"var(--text-primary)"}}>کد ملی شما</div>
            <div style={{fontSize:13,color:"var(--accent)",fontWeight:700,marginBottom:6,marginTop:10}}>شرح تراکنش (الزامی)</div>
            <div style={{fontSize:13,color:"var(--text-primary)"}}>هزینه عمومی و امور روزمره</div>
          </div>
        </div>
        <div style={{borderRadius:14,background:"var(--card-bg)",border:"1px solid var(--border-color)",padding:"14px 16px"}}>
          <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:8,fontWeight:600}}>جزییات</div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:13,color:"var(--text-muted)"}}>سقف واریز</span><span style={{fontSize:13,fontWeight:700,color:"var(--text-primary)"}}>بدون محدودیت</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:13,color:"var(--text-muted)"}}>زمان واریز</span><span style={{fontSize:13,fontWeight:700,color:"var(--text-primary)"}}>سیکل‌های پایا</span></div>
        </div>
      </>}
      <div style={{marginTop:16,padding:"14px 16px",borderRadius:14,background:"rgba(245,166,35,0.08)",border:"1px solid rgba(245,166,35,0.2)"}}>
        <div style={{fontSize:13,color:"#f5a623",lineHeight:1.8,fontWeight:600}}>واریز فقط باید توسط کارت بانکی ثبت‌شده در آن‌پرداز انجام شود در غیر این‌صورت عملیات واریز انجام نخواهد شد.</div>
      </div>
    </div>
  </div>;
}

// ─── Crypto Withdrawal Confirm Page ──────────────────────────────────────────
type WithdrawConfirmPageProps={
  withdrawSummary:{amount:string;destination:string;network:string;address:string};
  pendingWithdrawCb:React.MutableRefObject<(()=>void)|null>;
  onBack:()=>void;onDone:()=>void;onGoHome:()=>void;
};
function WithdrawConfirmPage({withdrawSummary,pendingWithdrawCb,onBack,onDone,onGoHome}:WithdrawConfirmPageProps){
  const [gaConnected,setGaConnected]=useState(()=>localStorage.getItem("anp_ga_connected")==="1");
  const [stage,setStage]=useState<"setup"|"otp"|"success">(gaConnected?"otp":"setup");
  const [setupStep,setSetupStep]=useState(0);
  const [setupOtp,setSetupOtp]=useState("");
  const [gaSecs,setGaSecs]=useState(60);
  const [smsSecs,setSmsSecs]=useState(120);
  const [gaCode,setGaCode]=useState("");
  const [smsCode,setSmsCode]=useState("");
  const [verifying,setVerifying]=useState(false);
  const SETUP_KEY="ANPX 4K7Z Y3QR MTWL 8J2F BVDP 9NCS KEHR";
  useEffect(()=>{if(stage!=="otp")return;const t=setInterval(()=>setGaSecs(s=>s<=1?60:s-1),1000);return()=>clearInterval(t);},[stage]);
  useEffect(()=>{if(stage!=="otp")return;const t=setInterval(()=>setSmsSecs(s=>Math.max(0,s-1)),1000);return()=>clearInterval(t);},[stage]);
  const connectGA=()=>{if(setupOtp.length<6)return;localStorage.setItem("anp_ga_connected","1");setGaConnected(true);setStage("otp");};
  const verify=()=>{if(gaCode.length<6||smsCode.length<6||verifying)return;setVerifying(true);setTimeout(()=>{setVerifying(false);setStage("success");},1400);};
  const canSubmit=gaCode.length===6&&smsCode.length===6&&!verifying&&smsSecs>0;
  const setupSteps=[
    {title:"نصب Google Authenticator",desc:"اپلیکیشن Google Authenticator را از App Store یا Google Play دانلود کنید."},
    {title:"وارد کردن کلید راه‌اندازی",desc:"در اپلیکیشن «Enter a setup key» را انتخاب کنید و کلید زیر را وارد نمایید."},
    {title:"تأیید اتصال",desc:"کد ۶ رقمی نمایش داده شده در اپلیکیشن را وارد کنید."},
  ];
  const shortAddr=withdrawSummary.address.length>16?`${withdrawSummary.address.slice(0,8)}...${withdrawSummary.address.slice(-6)}`:"";
  return <div className="expage" dir="rtl">
    <div className="expage-header">
      <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
      <h2 className="expage-title">{stage==="success"?"تأیید موفق":stage==="setup"?"اتصال Google Authenticator":"تأیید برداشت"}</h2>
      <div style={{width:36}}/>
    </div>
    <div className="expage-body">
      {stage==="setup"&&<>
        <div style={{textAlign:"center",padding:"20px 0 16px",borderBottom:"1px solid var(--border-faint)",marginBottom:16}}>
          <div className="wcs-shield-icon" style={{margin:"0 auto 14px"}}><svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M16 3L5 7v10c0 6.6 4.6 12.8 11 14.4C22.4 29.8 27 23.6 27 17V7L16 3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M11 16l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
          <p className="wcs-desc">برای امنیت بیشتر، Google Authenticator را متصل کنید.</p>
        </div>
        <div className="wcs-steps">
          {setupSteps.map((s,i)=>(
            <div key={i} className={`wcs-step${setupStep===i?" wcs-step--active":setupStep>i?" wcs-step--done":""}`}>
              <div className="wcs-step-num">{setupStep>i?<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>:toFaDigits(String(i+1))}</div>
              <div className="wcs-step-body">
                <b>{s.title}</b>
                {(setupStep===i||setupStep>i)&&<span>{s.desc}</span>}
                {setupStep===1&&i===1&&<div className="wcs-key-box">{SETUP_KEY}</div>}
                {setupStep===2&&i===2&&<input className="wcs-otp-input" inputMode="numeric" maxLength={6} placeholder="— — — — — —" value={toFaDigits(setupOtp)} onChange={e=>setSetupOtp(toLatinDigits(e.target.value).replace(/\D/g,""))} style={{marginTop:8}}/>}
              </div>
            </div>
          ))}
        </div>
        <div className="wcs-actions">
          {setupStep<2?<button className="primary-button" style={{width:"100%"}} onClick={()=>setSetupStep(s=>s+1)}>ادامه</button>:<button className="primary-button" style={{width:"100%",opacity:setupOtp.length>=6?1:0.45}} disabled={setupOtp.length<6} onClick={connectGA}>تأیید و اتصال</button>}
        </div>
      </>}
      {stage==="otp"&&<>
        <div className="wcs-confirm-card">
          <div className="wcs-confirm-row">
            <span className="wcs-confirm-label">مبلغ برداشت</span>
            <span className="wcs-confirm-amount">{withdrawSummary.amount}</span>
          </div>
          {withdrawSummary.network&&<><div className="wcs-confirm-sep"/>
          <div className="wcs-confirm-row">
            <span className="wcs-confirm-label">شبکه انتقال</span>
            <span className="wcs-confirm-badge">{withdrawSummary.network}</span>
          </div></>}
          {withdrawSummary.address&&<><div className="wcs-confirm-sep"/>
          <div className="wcs-confirm-addr-row">
            <span className="wcs-confirm-label">آدرس مقصد</span>
            <span className="wcs-confirm-addr" dir="ltr" title={withdrawSummary.address}>{shortAddr||withdrawSummary.address}</span>
          </div></>}
        </div>
        <div className="wcs-otp-block">
          <div className="wcs-otp-row">
            <div className="wcs-otp-field">
              <div className="wcs-otp-label-row">
                <span className="wcs-otp-label">کد Google Authenticator</span>
                <span className="wcs-ga-badge">● متصل است</span>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}><input className="wcs-otp-input" style={{flex:1}} type="tel" inputMode="numeric" maxLength={6} placeholder="— — — — — —" autoComplete="one-time-code" value={toFaDigits(gaCode)} onChange={e=>{const v=toLatinDigits(e.target.value).replace(/\D/g,"").slice(0,6);setGaCode(v);}} disabled={verifying}/><button type="button" onClick={()=>{navigator.clipboard?.readText().then(t=>{const v=t.trim().replace(/\D/g,"").slice(0,6);if(v)setGaCode(v);}).catch(()=>{});}} style={{flexShrink:0,padding:"12px 14px",borderRadius:10,background:"var(--card-bg2,rgba(0,214,176,0.1))",border:"1px solid rgba(0,214,176,0.3)",color:"var(--accent)",fontFamily:"Vazirmatn",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",minHeight:48}}>چسباندن</button></div>
            </div>
            <CircleTimer secs={gaSecs} total={60} color="var(--accent)"/>
          </div>
          <div className="wcs-otp-divider"/>
          <div className="wcs-otp-row">
            <div className="wcs-otp-field">
              <div className="wcs-otp-label-row">
                <span className="wcs-otp-label">کد پیامک</span>
                {smsSecs>0?<span className="wcs-sms-timer">{toFaDigits(String(smsSecs))} ث</span>:<button className="wcs-resend-btn" onClick={()=>setSmsSecs(120)}>ارسال مجدد</button>}
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}><input className="wcs-otp-input" style={{flex:1}} type="tel" inputMode="numeric" maxLength={6} placeholder="— — — — — —" autoComplete="one-time-code" value={toFaDigits(smsCode)} onChange={e=>{const v=toLatinDigits(e.target.value).replace(/\D/g,"").slice(0,6);setSmsCode(v);}} disabled={verifying||smsSecs===0}/><button type="button" onClick={()=>{navigator.clipboard?.readText().then(t=>{const v=t.trim().replace(/\D/g,"").slice(0,6);if(v)setSmsCode(v);}).catch(()=>{});}} disabled={verifying||smsSecs===0} style={{flexShrink:0,padding:"12px 14px",borderRadius:10,background:"var(--card-bg2,rgba(0,214,176,0.1))",border:"1px solid rgba(0,214,176,0.3)",color:"var(--accent)",fontFamily:"Vazirmatn",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",minHeight:48,opacity:smsSecs===0?0.4:1}}>چسباندن</button></div>
            </div>
            <CircleTimer secs={smsSecs} total={120} color={smsSecs>30?"var(--accent)":"#e85c5c"}/>
          </div>
        </div>
        <button className="primary-button" style={{width:"100%",opacity:canSubmit?1:0.42}} disabled={!canSubmit} onClick={verify}>{verifying?"در حال تأیید...":"تأیید و انتقال"}</button>
      </>}
      {stage==="success"&&<div className="wcs-success">
        <div className="wcs-success-icon"><svg width="42" height="42" viewBox="0 0 42 42" fill="none"><circle cx="21" cy="21" r="20" stroke="currentColor" strokeWidth="1.5"/><path d="M13 21l6 6 10-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
        <h3 className="wcs-success-title">برداشت با موفقیت ثبت شد</h3>
        <p className="wcs-success-desc">درخواست شما در صف انجام قرار گرفت و پس از بررسی پردازش خواهد شد.</p>
        <div className="wcs-success-info"><span>{withdrawSummary.amount}</span><span>{withdrawSummary.network&&`شبکه ${withdrawSummary.network}`}</span></div>
        <button className="primary-button" style={{width:"100%",marginTop:8}} onClick={()=>{pendingWithdrawCb.current?.();pendingWithdrawCb.current=null;onDone();}}>مشاهده تاریخچه</button>
        <button className="outline-button" style={{width:"100%",marginTop:8}} onClick={onGoHome}>بازگشت به صرافی</button>
      </div>}
    </div>
  </div>;
}

// ─── Crypto Withdrawal Form ───────────────────────────────────────────────────
type WithdrawPageProps={
  asset:string;network:string;available:number;processing:boolean;
  withdrawAddr:string;setWithdrawAddr:(v:string)=>void;
  withdrawAmt:string;setWithdrawAmt:(v:string)=>void;
  assetSelectEl:ReactNode;networkSelectEl:ReactNode;
  onBack:()=>void;onHistory:()=>void;
  onSubmit:(addr:string,amt:string)=>void;
};
function WithdrawPage({asset,network,available,processing,withdrawAddr,setWithdrawAddr,withdrawAmt,setWithdrawAmt,assetSelectEl,networkSelectEl,onBack,onHistory,onSubmit}:WithdrawPageProps){
  const [showScanner,setShowScanner]=useState(false);
  const [addrCopied,setAddrCopied]=useState(false);
  const videoRef=useRef<HTMLVideoElement>(null);
  const streamRef=useRef<MediaStream|null>(null);
  const doPaste=()=>{
    if(navigator.clipboard?.readText){
      navigator.clipboard.readText().then(t=>{if(t.trim())setWithdrawAddr(t.trim());}).catch(()=>{});
    }
  };
  const doCopy=()=>{
    if(!withdrawAddr)return;
    navigator.clipboard?.writeText(withdrawAddr).then(()=>{setAddrCopied(true);setTimeout(()=>setAddrCopied(false),1800);}).catch(()=>{});
  };
  const openScanner=()=>{
    setShowScanner(true);
    navigator.mediaDevices?.getUserMedia({video:{facingMode:"environment"}}).then(stream=>{
      streamRef.current=stream;
      if(videoRef.current){videoRef.current.srcObject=stream;videoRef.current.play();}
    }).catch(()=>{});
  };
  const closeScanner=()=>{
    streamRef.current?.getTracks().forEach(t=>t.stop());
    streamRef.current=null;
    setShowScanner(false);
  };
  useEffect(()=>()=>{streamRef.current?.getTracks().forEach(t=>t.stop());},[]);
  return <>
    <div className="exchange-page" style={{padding:0}}>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px 0",marginBottom:4}}>
        <button onClick={onBack} style={{width:36,height:36,borderRadius:10,background:"var(--card-bg2)",border:"1px solid var(--border-faint)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="arrow" size={18}/></button>
        <h2 style={{flex:1,textAlign:"center",margin:0,fontSize:16,fontWeight:800,color:"var(--text-primary)"}}>برداشت کوین</h2>
        <button onClick={onHistory} style={{fontSize:11,color:"var(--accent)",background:"none",border:"none",cursor:"pointer",fontFamily:"Vazirmatn",fontWeight:700,whiteSpace:"nowrap"}}>تاریخچه</button>
      </div>
      <div style={{padding:"12px 16px 80px"}}>
        {assetSelectEl}
        {networkSelectEl}
        <div className="exchange-field">
          آدرس مقصد
          <div className="field-input" style={{position:"relative",alignItems:"stretch",flexWrap:"wrap",gap:0,padding:0}}>
            <input
              value={withdrawAddr}
              onChange={e=>setWithdrawAddr(e.target.value)}
              placeholder="آدرس کیف پول مقصد"
              dir="ltr"
              autoComplete="off"
              style={{flex:1,minWidth:0,border:0,background:"transparent",color:"var(--text-primary)",outline:0,fontFamily:"Vazirmatn",fontSize:12,direction:"ltr",textAlign:"left",padding:"12px 10px"}}
            />
            <div style={{display:"flex",alignItems:"center",gap:4,padding:"0 8px 0 0",flexShrink:0}}>
              {withdrawAddr&&<button type="button" onClick={doCopy} style={{border:0,background:addrCopied?"rgba(0,214,176,0.15)":"var(--card-bg3)",borderRadius:7,color:addrCopied?"var(--accent)":"var(--text-secondary)",font:"10px Vazirmatn",padding:"5px 7px",cursor:"pointer",whiteSpace:"nowrap",transition:"all .15s"}}>{addrCopied?"✓ کپی شد":"کپی"}</button>}
              <button type="button" onClick={doPaste} style={{border:0,background:"var(--card-bg3)",borderRadius:7,color:"var(--accent)",font:"10px Vazirmatn",padding:"5px 7px",cursor:"pointer",whiteSpace:"nowrap"}}>چسباندن</button>
              <button type="button" onClick={openScanner} style={{border:0,background:"var(--card-bg3)",borderRadius:7,color:"var(--accent)",font:"10px Vazirmatn",padding:"5px 7px",cursor:"pointer",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:3}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                اسکن
              </button>
            </div>
          </div>
        </div>
        <div className="exchange-field">
          مقدار برداشت
          <div className="field-input">
            <input
              inputMode="decimal"
              value={toFaDigits(withdrawAmt)}
              onChange={e=>setWithdrawAmt(toLatinDigits(e.target.value).replace(/[^0-9.]/g,""))}
              placeholder="مقدار برداشت"
              autoComplete="off"
              style={{flex:1,minWidth:0,border:0,background:"transparent",color:"var(--text-primary)",outline:0,fontFamily:"Vazirmatn",fontSize:15,fontWeight:700}}
            />
            <button type="button" onClick={()=>setWithdrawAmt(String(available))} style={{border:0,background:"var(--card-bg3)",borderRadius:7,color:"var(--accent)",font:"10px Vazirmatn",padding:"6px",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>همه موجودی</button>
          </div>
          <em style={{display:"block",color:"var(--text-muted)",fontSize:10,fontStyle:"normal",marginTop:6}}>موجودی در دسترس: {asset==="USDT"?faFixed(available,0):faFixed(available,4)} {asset==="USDT"?"دلار تتر":asset}</em>
        </div>
        <div className="warning-box subtle"><b>توجه</b><p>از برداشت مستقیم به پلتفرم‌های بین‌المللی خودداری کنید. هنگام استفاده از فیلترشکن آن را خاموش کنید و هرگز به آدرس افراد ناشناس کوین ارسال نکنید.</p></div>
        <button className="primary-button" style={{width:"100%"}} disabled={!network||!withdrawAddr||!withdrawAmt||processing} onClick={()=>onSubmit(withdrawAddr,withdrawAmt)}>درخواست برداشت</button>
      </div>
    </div>
    {showScanner&&<div style={{position:"fixed",inset:0,zIndex:9000,background:"#000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}} dir="rtl">
      <div style={{position:"absolute",top:0,left:0,right:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"env(safe-area-inset-top,0px) 16px 12px",background:"rgba(0,0,0,0.7)",zIndex:1}}>
        <button onClick={closeScanner} style={{border:0,background:"rgba(255,255,255,0.12)",borderRadius:10,color:"#fff",fontFamily:"Vazirmatn",fontSize:13,fontWeight:700,padding:"8px 14px",cursor:"pointer"}}>بستن</button>
        <span style={{color:"rgba(255,255,255,0.7)",fontSize:12,fontFamily:"Vazirmatn"}}>صرافی ارز دیجیتال آن پرداز</span>
      </div>
      <div style={{position:"relative",width:260,height:260,borderRadius:20,overflow:"hidden",border:"2.5px solid var(--accent)"}}>
        <video ref={videoRef} style={{width:"100%",height:"100%",objectFit:"cover"}} playsInline muted/>
        <div style={{position:"absolute",inset:0,display:"grid",gridTemplate:"1fr / 1fr",placeItems:"center",pointerEvents:"none"}}>
          <div style={{width:200,height:200,position:"relative"}}>
            {[{top:0,left:0},{top:0,right:0},{bottom:0,left:0},{bottom:0,right:0}].map((pos,i)=><div key={i} style={{position:"absolute",width:24,height:24,borderColor:"var(--accent)",borderStyle:"solid",borderWidth:0,...(pos.top===0?{borderTopWidth:3}:{borderBottomWidth:3}),...(pos.left===0?{borderLeftWidth:3}:{borderRightWidth:3}),...pos}}/>)}
          </div>
        </div>
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.18)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:180,height:2,background:"rgba(0,204,143,0.7)",animation:"qrScanLine 2s ease-in-out infinite",borderRadius:2}}/>
        </div>
      </div>
      <div style={{marginTop:28,textAlign:"center",padding:"0 32px"}}>
        <p style={{color:"#fff",fontSize:16,fontWeight:700,fontFamily:"Vazirmatn",margin:"0 0 8px"}}>اسکن آدرس در حال انجام است</p>
        <p style={{color:"rgba(255,255,255,0.55)",fontSize:12,fontFamily:"Vazirmatn",margin:0,lineHeight:1.8}}>کیف پول مقصد را روبروی دوربین قرار دهید</p>
      </div>
    </div>}
  </>;
}

function ExchangeScreen({user,onBack,onUpdate,onUpdateUser,transactions,onForexBot}:{user:UserData;onBack:()=>void;onUpdate:(u:UserData,tx:TxRecord)=>void;onUpdateUser?:(u:UserData)=>void;transactions:TxRecord[];onForexBot?:()=>void}){
  type View="home"|"markets"|"trade"|"assets"|"withdraw"|"deposit"|"deposit-select"|"history"|"fees"|"guide"|"instant"|"spot"|"margin"|"spot-chart"|"margin-chart"|"support"|"tickets"|"chat"|"withdraw-select"|"toman-withdraw"|"toman-deposit"|"coin-select"|"network-select"|"withdraw-confirm"|"tx-detail"|"trade-type-select"|"trade-display-select";
  const [view,setView]=useState<View>("home"),[search,setSearch]=useState(""),[marketFilter,setMarketFilter]=useState<"همه"|"تومان"|"دلار تتر">("تومان"),[asset,setAsset]=useState("USDT"),[network,setNetwork]=useState(""),[amount,setAmount]=useState(""),[address,setAddress]=useState(""),[picker,setPicker]=useState<"coin"|"network"|null>(null),[favorite,setFavorite]=useState<string[]>(()=>{const DEFAULTS=["BTC","ETH","SOL","BNB","DOGE"];try{const s=localStorage.getItem(`anp_exchange_favorites_${user.uid}`);if(s===null){localStorage.setItem(`anp_exchange_favorites_${user.uid}`,JSON.stringify(DEFAULTS));return DEFAULTS;}return JSON.parse(s)}catch{return DEFAULTS}}),[selectedAsset,setSelectedAsset]=useState("USDT"),[tradePicker,setTradePicker]=useState(false),[tradeDisplayPicker,setTradeDisplayPicker]=useState<null|"spot"|"margin">(null),[depositOpen,setDepositOpen]=useState(false),[notice,setNotice]=useState(""),[tradeSide,setTradeSide]=useState<"buy"|"sell">("buy"),[tradeAmount,setTradeAmount]=useState(""),[processing,setProcessing]=useState(false),[receipt,setReceipt]=useState<ReceiptData|null>(null),[coins,setCoins]=useState(EX_COINS),[liveWallets,setLiveWallets]=useState<Record<string,number>>({}),[marketUpdated,setMarketUpdated]=useState<Date|null>(null),[feeDetail,setFeeDetail]=useState<string|null>(null),[showWithdrawOtp,setShowWithdrawOtp]=useState(false),[withdrawSummary,setWithdrawSummary]=useState<{amount:string;destination:string;network:string;address:string}>({amount:"",destination:"",network:"",address:""}),[txDetailRecord,setTxDetailRecord]=useState<TxRecord|null>(null),[prevView,setPrevView]=useState<View>("history"),[selReturnView,setSelReturnView]=useState<View>("withdraw"),[balUnit,setBalUnit]=useState<"tmn"|"usdt">("tmn"),[hidden,setHidden]=useState(false),[toDepositTab,setToDepositTab]=useState<"card"|"paya">("card"),[withdrawAddr,setWithdrawAddr]=useState(""),[withdrawAmt,setWithdrawAmt]=useState("");
  const pendingWithdrawCb=useRef<(()=>void)|null>(null); const liveRate=Number(coins.find(c=>c.symbol==="USDT")?.price??0);
  const [kycFlow,setKycFlow]=useState<null|"photo"|"profile"|"anim">(null);
  const [kycPhoto,setKycPhoto]=useState("");
  const [kycProfile,setKycProfile]=useState({name:"",family:"",nationalId:"",birthDate:""});
  const [kycFailed,setKycFailed]=useState(false);
  const [pendingKycDest,setPendingKycDest]=useState<View>("assets");
  const goWithKyc=(dest:View)=>{if(user.kycDone){go(dest);return;}setPendingKycDest(dest);setKycFlow("photo");setKycFailed(false);};
  useEffect(()=>{let active=true;const load=async()=>{try{const r=await fetch(`${ANSARRAF_API_BASE}/api/v1/market-data/quotes`,{signal:AbortSignal.timeout(7000),cache:"no-store"});if(!r.ok)throw new Error("market_data_unavailable");const d=await r.json();const quotes=Array.isArray(d?.quotes)?d.quotes:[];const live=quotes.filter((q:any)=>!q.stale&&Number(q.lastPrice)>0);const bySymbol=new Map<string,any>();for(const q of live){const current=bySymbol.get(q.symbol);if(!current||q.provider==="wallex")bySymbol.set(q.symbol,q);}const tomanRate=Number(bySymbol.get("USDT/TOMAN")?.lastPrice||0);if(active&&tomanRate>0&&_viewRef.current!=="withdraw-confirm"){setCoins(previous=>previous.map(c=>{if(c.symbol==="USDT")return {...c,price:tomanRate};const usdt=bySymbol.get(`${c.symbol}/USDT`);const toman=bySymbol.get(`${c.symbol}/TOMAN`);const price=toman?Number(toman.lastPrice):(usdt?tomanRate*Number(usdt.lastPrice):0);return {...c,price,change:Number.isFinite(Number(usdt?.change24h))?Number(usdt.change24h):c.change,volume:usdt?.volume24h??(c as any).volume};}));setMarketUpdated(new Date());}}catch{/* keep the last verified backend quote; never synthesize a mock price */}};void load();const id=window.setInterval(()=>void load(),5000);return()=>{active=false;window.clearInterval(id)}},[]);
  useEffect(()=>{let active=true;const loadWallets=async()=>{try{const wallet=await sarrafWalletMap();if(active)setLiveWallets(wallet);}catch{if(active)setLiveWallets({});}};void loadWallets();const id=window.setInterval(()=>void loadWallets(),5000);return()=>{active=false;window.clearInterval(id)}},[]);
  const coin=coins.find(c=>c.symbol===asset)??coins[0]; const available=getCryptoBal(user,asset);
  const navBusy=useRef(false);
  const go=(next:View)=>{if(navBusy.current)return;navBusy.current=true;setView(next);setNotice("");setTimeout(()=>{navBusy.current=false},400)};
  const goDetail=(tx:TxRecord,from:View)=>{setTxDetailRecord(tx);setPrevView(from);go('tx-detail');};
  const _viewRef=useRef(view); _viewRef.current=view;
  const _noticeRef=useRef(notice); _noticeRef.current=notice;
  const _pickerRef=useRef(picker); _pickerRef.current=picker;
  useBackHandler(()=>{
    if(_pickerRef.current){setPicker(null);return;}
    if(_noticeRef.current){setNotice("");return;}
    if(_viewRef.current==="trade-display-select"){go("trade-type-select");return;}
    if(_viewRef.current!=="home"){go("home");return;}
    onBack();
  });
  const selectCoin=(s:string)=>{setAsset(s);setSelectedAsset(s);setNetwork("");setPicker(null)};
  const toggleFavorite=(symbol:string)=>setFavorite(current=>{const next=current.includes(symbol)?current.filter(x=>x!==symbol):[...current,symbol];localStorage.setItem(`anp_exchange_favorites_${user.uid}`,JSON.stringify(next));return next});
  const openSelectedTrading=(target:"instant"|"spot"|"margin")=>{if(target==="instant"){go("instant")}else{setTradeDisplayPicker(target);go("trade-display-select")}};
  const addressValue="";
  const ExchangeTopBar=()=><div className="exchange-top"><button onClick={onBack} style={{display:"flex",alignItems:"center",gap:4,background:"rgba(124,58,237,0.1)",border:"1.5px solid rgba(124,58,237,0.25)",borderRadius:20,padding:"6px 12px 6px 10px",cursor:"pointer",fontFamily:"Vazirmatn",fontSize:11,fontWeight:700,color:"#9d71ea",flexShrink:0,whiteSpace:"nowrap"}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>بازگشت به آن‌پرداز</button><div className="exchange-brand"><img src={anPardazLogo} className="exchange-logo-img" alt="آن‌پرداز"/><b>آن صراف</b></div><span className="connection"><i/> {marketUpdated?"نرخ زنده":"در حال اتصال"}</span></div>;
  const ExchangeFooterNav=()=>{
    const NAV_ITEMS:[string,string,JSX.Element][]=[
      ['home','خانه',<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><polyline points="9 21 9 12 15 12 15 21"/></svg>],
      ['markets','بازارها',<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>],
      ['trade','معامله',<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>],
      ['assets','دارایی‌ها',<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M16 12a2 2 0 0 1-2-2H10a2 2 0 0 1-2 2v0a2 2 0 0 1 2 2h4a2 2 0 0 1 2-2v0z"/></svg>],
      ['more','موارد بیشتر',<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="5" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="19" cy="5" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="19" r="1.5"/><circle cx="12" cy="19" r="1.5"/><circle cx="19" cy="19" r="1.5"/></svg>],
    ];
    const activeView=view==='trade-type-select'||view==='trade-display-select'||view==='spot'||view==='margin'||view==='instant'?'trade':view==='deposit'||view==='deposit-select'||view==='withdraw'||view==='withdraw-select'||view==='toman-deposit'||view==='toman-withdraw'||view==='withdraw-confirm'||view==='history'||view==='tx-detail'?'assets':view==='support'||view==='tickets'||view==='chat'?'more':view;
    return <nav className="ex-footer-nav" dir="rtl">
      {NAV_ITEMS.map(([id,label,icon])=>{
        const isActive=activeView===id;
        return <button key={id} className={isActive?"ex-fn-btn active":"ex-fn-btn"} onClick={()=>id==='trade'?go('trade-type-select'):id==='more'?go('support'):go(id as View)} aria-label={label}>
          <span className="ex-fn-icon">{icon}</span>
          <span className="ex-fn-label">{label}</span>
          {isActive&&<span className="ex-fn-pip"/>}
        </button>;
      })}
    </nav>;
  };
  const AssetSelect=({label}:{label:string})=><label className="exchange-field">{label}<button onClick={()=>{setSelReturnView(view);go('coin-select');}}><span className="coin-inline"><CoinLogo symbol={asset} size={24}/><b>{coin.fa}</b><small>{asset}</small></span><span>⌄</span></button></label>;
  const NetworkSelect=()=> <label className="exchange-field">نوع شبکه<button disabled={!asset} onClick={()=>{setSelReturnView(view);go('network-select');}}><span>{network||"شبکه را انتخاب کنید"}</span><span>⌄</span></button>{network&&<em>کارمزد شبکه پس از دریافت از سرویس کیف پول نمایش داده می‌شود.</em>}</label>;
  const Home=()=> <div className="exchange-page"><section className="exchange-hero" style={{position:"relative"}}>{(()=>{const _bs=getBotState(user.phone);const _botOn=_bs.status==="active"||_bs.status==="pending";return <button onClick={()=>onForexBot?.()} className={_botOn?"forex-bot-btn bot-on":"forex-bot-btn"}><svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"><rect x="2" y="4" width="9" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="4.8" cy="7" r=".85" fill="currentColor"/><circle cx="8.2" cy="7" r=".85" fill="currentColor"/><path d="M5 2.5h3M6.5 2.5v1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><path d="M3.2 10l-1.4 1.5M9.8 10l1.4 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg><span>ربات فارکس</span><span className={_botOn?"bot-pill on":"bot-pill"}>{_botOn?"فعال":"غیرفعال"}</span></button>;})()}<div><span className="live-dot"/> وضعیت بازار: آنلاین</div><h1>دارایی دیجیتال، با کنترل کامل</h1><p>با آن‌پرداز، خرید و فروش آنی و مدیریت کوین‌ها ساده و امن است.</p></section><div className="quick-actions">{[['واریز تومان','deposit-info'],['خرید و فروش آنی','instant'],['معاملات اسپات','spot'],['معامله تعهدی','margin'],['ارسال تیکت','tickets'],['چت با پشتیبان','chat'],['کارمزدها','fees'],['راهنمای استفاده','guide']].map(([l,x])=><button key={l} onClick={()=>x==='deposit-info'?go('toman-deposit'):x==='spot'?go('spot'):x==='margin'?go('margin'):x==='instant'?go('instant'):x==='guide'?go('guide'):x==='tickets'?go('tickets'):x==='chat'?go('chat'):x==='support'?go('support'):x==='fees'?go('fees'):setNotice(x)}>{l}</button>)}</div><section className="section-title"><h2>خرید و فروش آنی</h2><button onClick={()=>go('markets')}>همه بازارها</button></section><div className="coin-strip">{coins.slice(0,4).map(c=><button key={c.symbol} onClick={()=>{selectCoin(c.symbol);go('instant')}}><PairLogos base={c.symbol} baseSize={28} quoteSize={16}/><b>{c.fa}</b><small>{c.symbol}/TMN</small><strong>{fa(c.price)} تومان</strong></button>)}</div><section className="section-title"><h2>ارزهای محبوب</h2><button onClick={()=>go("markets")}>مدیریت</button></section>{favorite.length?<div className="favorite-watchlist">{coins.filter(c=>favorite.includes(c.symbol)).map(c=><button className="favorite-watch-card" key={c.symbol} onClick={()=>{selectCoin(c.symbol);go("spot")}}><PairLogos base={c.symbol} baseSize={28} quoteSize={16}/><div><b>{c.symbol} / TMN</b><small>{c.fa}</small></div><strong>{fa(Math.round(c.price))} تومان</strong><em className={c.change>=0?"positive":"negative"}>{Number.isFinite(c.change)?(c.change>=0?"+":"")+faFixed(c.change,2)+"٪":"—"}</em></button>)}</div>:<div className="empty-state">با لمس ستاره کنار هر بازار، ارزهای محبوب شما اینجا نمایش داده می‌شوند.</div>}</div>;
  const MarketRow=({c}:{c:(typeof coins)[number]})=><button className="market-row" onClick={()=>{selectCoin(c.symbol);go('trade-type-select')}}><span className={favorite.includes(c.symbol)?"star on":"star"} onClick={e=>{e.stopPropagation();toggleFavorite(c.symbol)}}>★</span><span className="coin-inline"><CoinLogo symbol={c.symbol}/><b>{c.symbol}</b><small>{c.fa}</small></span><b>{fa(c.price)}</b><span className={c.change>=0?'positive':'negative'}>{c.change>=0?'+':''}{faFixed(c.change,2)}٪</span></button>;
  const Markets=()=>{const rows=coins.filter(c=>(c.symbol+c.fa).toLowerCase().includes(search.toLowerCase())).flatMap(c=>marketFilter==="همه"?[{c,pair:"TMN",price:c.price},{c,pair:"USDT",price:c.symbol==="USDT"?1:(liveRate>0?c.price/liveRate:0)}]:[{c,pair:marketFilter==="تومان"?"TMN":"USDT",price:marketFilter==="تومان"?c.price:(c.symbol==="USDT"?1:(liveRate>0?c.price/liveRate:0))}]).filter(({c,pair})=>c.symbol!==pair);const openPair=(symbol:string)=>{selectCoin(symbol);navBusy.current=false;go('spot')};return <div className="exchange-page markets-pro"><div className="markets-title"><div><h2>بازارها</h2><small>نرخ‌ها به‌صورت زنده به‌روزرسانی می‌شوند</small></div><span className="live-dot"/></div><div className="market-search"><Icon name="search" size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجوی ارز یا جفت‌ارز"/></div><div className="market-filters">{(["همه","تومان","دلار تتر"] as const).map(x=><button type="button" key={x} className={marketFilter===x?"active":""} onClick={()=>setMarketFilter(x)}>{x}</button>)}</div><div className="market-card-grid">{rows.map(({c,pair,price})=>{const vol=Number.isFinite(Number((c as any).volume))&&Number((c as any).volume)>0?fa(Number((c as any).volume)):"—";const isPos=c.change>=0;return <div className="market-card" key={`${c.symbol}-${pair}`} role="button" tabIndex={0} onClick={()=>openPair(c.symbol)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openPair(c.symbol)}}}><div className="mc-top"><div className="mc-logos"><PairLogos base={c.symbol} quote={pair} baseSize={28} quoteSize={17}/></div><div className="mc-pair"><b>{c.symbol} / {pair}</b><small>{c.fa}</small></div><button type="button" aria-label={favorite.includes(c.symbol)?`حذف ${c.symbol} از علاقه‌مندی‌ها`:`افزودن ${c.symbol} به علاقه‌مندی‌ها`} className={favorite.includes(c.symbol)?"mc-star on":"mc-star"} onClick={e=>{e.stopPropagation();toggleFavorite(c.symbol)}}>★</button></div><div className="mc-price">{pair==="TMN"?`${fa(Math.round(price))} تومان`:`${faFixed(price,3)} دلار تتر`}</div><div className="mc-bottom"><span className={isPos?"mc-change positive":"mc-change negative"}>{isPos?"+":""}{faFixed(c.change,2)}٪</span><span className="mc-vol">حجم: {vol}</span></div></div>})} </div></div>};
  const Trade=()=>{
    const units=Number(tradeAmount)||0;
    const price=coin.price;
    const total=units*price;
    const liveBaseBalance=Number(liveWallets[String(asset).toUpperCase()]??0);
    const liveTomanBalance=Number(liveWallets.TMN??0);
    const submitTrade=async()=>{
      if(!units||!Number.isFinite(price)||price<=0){setReceipt({title:"",status:"failed",detail:"مقدار یا قیمت لحظه‌ای بازار در دسترس نیست."});return;}
      if(tradeSide==="buy"&&total>liveTomanBalance){setReceipt({title:"",status:"failed",detail:"موجودی تومان کافی نیست."});return;}
      if(tradeSide==="sell"&&units>liveBaseBalance){setReceipt({title:"",status:"failed",detail:`موجودی ${asset} کافی نیست.`});return;}
      setProcessing(true);setReceipt(null);
      try{
        const result=await sarrafPlaceOrder(asset,"TMN",tradeSide,"market",units,undefined,tradeSide==="buy"?total:undefined);
        setProcessing(false);
        setReceipt({title:"سفارش آنی در آن صراف ثبت شد",amount:`${tradeSide==="buy"?faFixed(units,4):fa(Math.round(total))} ${tradeSide==="buy"?asset:"تومان"}`,detail:`شناسه سفارش: ${String(result?.order?.id??result?.orderId??"—")}`});
        setTradeAmount("");
      }catch(e){setProcessing(false);setReceipt({title:"",status:"failed",detail:e instanceof Error?e.message:"ثبت سفارش انجام نشد."});}
    };
    return <div className="exchange-page"><div className="page-title"><h2>معامله آنی</h2><button onClick={()=>go("markets")}>بازارها</button></div><div className="segmented"><button className={tradeSide==="buy"?"active":""} onClick={()=>setTradeSide("buy")}>خرید</button><button className={tradeSide==="sell"?"active":""} onClick={()=>setTradeSide("sell")}>فروش</button></div><AssetSelect label="دارایی"/><label className="exchange-field">مقدار {asset}<div className="field-input"><input value={toFaDigits(tradeAmount)} inputMode="decimal" onChange={e=>setTradeAmount(toLatinDigits(e.target.value).replace(/[^0-9.]/g,""))} placeholder="مقدار را وارد کنید"/><button onClick={()=>setTradeAmount(tradeSide==="sell"?String(liveBaseBalance):String(Math.floor(liveTomanBalance/Math.max(price,1e-12)*100)/100))}>همه</button></div></label><section className="fee-card"><span>قیمت لحظه‌ای</span><b>{Number.isFinite(price)&&price>0?fa(Math.round(price))+" تومان":"—"}</b><div><span>جمع معامله <strong>{Number.isFinite(total)&&total>0?fa(Math.round(total))+" تومان":"—"}</strong></span></div></section><button className="primary-button" onClick={submitTrade} disabled={processing}>{processing?"در حال ثبت…":tradeSide==="buy"?"خرید آنی":"فروش آنی"}</button><p className="muted-copy">سفارش مستقیماً به Backend آن صراف ارسال می‌شود و نتیجه واقعی بازار ثبت خواهد شد.</p></div>;
  };
  const Assets=()=>{
  const tmnBal=Number(liveWallets.TMN??0);
  const usdtBal=Number(liveWallets.USDT??0);
  const RATE=liveRate;
  const totalTmn=RATE>0?Math.round(tmnBal+usdtBal*RATE):null;
  const totalUsdt=RATE>0?(tmnBal/RATE+usdtBal):null;
  const EyeOpenIcon=()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
  const EyeOffIcon=()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
  const rawBal=balUnit==="tmn"?(totalTmn==null?"—":fa(totalTmn)):(totalUsdt==null?"—":faFixed(totalUsdt,4));
  return <div className="exchange-page" style={{padding:"0 16px"}}>
    {/* Balance card — dark navy with teal accent, fully visible rounded top corners */}
    <section className="assets-balance-card">
      <div className="assets-card-circle assets-card-circle--tl"/>
      <div className="assets-card-circle assets-card-circle--br"/>
      <div style={{position:"relative",zIndex:1}}>
        {/* Top row: label + controls */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <span style={{fontSize:13,color:"rgba(255,255,255,0.55)",fontWeight:600,letterSpacing:0.3}}>کل دارایی‌ها</span>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div className="assets-unit-tabs">
              {([["tmn","تومان"],["usdt","تتر"]] as const).map(([u,label])=><button key={u} onClick={()=>setBalUnit(u)} className={"assets-unit-btn"+(balUnit===u?" active":"")}>{label}</button>)}
            </div>
            <button onClick={()=>setHidden(h=>!h)} className="assets-eye-btn" aria-label={hidden?"نمایش موجودی":"پنهان کردن موجودی"}>
              {hidden?<EyeOffIcon/>:<EyeOpenIcon/>}
            </button>
          </div>
        </div>
        {/* Balance amount — wide flexible center, no clipping */}
        <div style={{textAlign:"center",margin:"0 0 6px"}}>
          {hidden
            ?<span style={{fontSize:26,letterSpacing:8,color:"rgba(255,255,255,0.7)"}}>• • • • •</span>
            :<span className="assets-balance-amount">{rawBal}</span>
          }
          <div style={{fontSize:12,color:"rgba(255,255,255,0.45)",marginTop:5,fontWeight:500}}>{balUnit==="tmn"?"تومان":"USDT"}</div>
        </div>
        {/* Action buttons */}
        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button onClick={()=>goWithKyc('deposit-select')} className="assets-action-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{marginLeft:5}}><path d="M12 5v14M5 12l7 7 7-7"/></svg>
            واریز
          </button>
          <button onClick={()=>goWithKyc('withdraw-select')} className="assets-action-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{marginLeft:5}}><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            برداشت
          </button>
        </div>
      </div>
    </section>
    <div style={{padding:"0 0 16px"}}>
      <section className="section-title" style={{margin:"18px 16px 8px"}}><h2>دارایی‌های شما</h2><button onClick={()=>go('history')}>تاریخچه</button></section>
      <div className="asset-list">
        {/* Toman */}
        <div className="asset-row asset-row-link" style={{background:"var(--card-bg2)",cursor:"pointer"}} role="button" tabIndex={0} onClick={()=>{selectCoin("USDT");go('instant')}} onKeyDown={e=>e.key==="Enter"&&go('instant')}>
          <span className="coin-inline">
            <span style={{width:34,height:34,borderRadius:"50%",background:"rgba(0,214,176,0.12)",border:"1px solid rgba(0,214,176,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🇮🇷</span>
            <b>تومان</b><small>TMN</small>
          </span>
          <span style={{flex:1,textAlign:"center",fontWeight:700,fontSize:15,color:"var(--text-primary)"}}>{hidden?"••••":fa(tmnBal)||"۰"}</span>
          <div className="asset-row-actions" style={{minWidth:"auto"}}>
            <button onClick={e=>{e.stopPropagation();selectCoin("USDT");go('instant')}}>خرید و فروش آنی</button>
          </div>
        </div>
        {coins.map(c=>{
          const bal=Number(liveWallets[String(c.symbol).toUpperCase()]??0);
          const balDisplay=hidden?"••••":(bal>0?faFixed(bal,4):"۰");
          return <div className="asset-row asset-row-link" key={c.symbol} role="button" tabIndex={0} style={{cursor:"pointer"}} onClick={()=>{selectCoin(c.symbol);go('spot')}} onKeyDown={e=>e.key==="Enter"&&go('spot')}>
            <span className="coin-inline"><CoinLogo symbol={c.symbol} size={34}/><b>{c.fa}</b><small>{c.symbol}</small></span>
            <span style={{flex:1,textAlign:"center",fontWeight:700,fontSize:15,color:"var(--text-primary)"}}>{balDisplay}</span>
            <div className="asset-row-actions" style={{minWidth:"auto"}}><button onClick={e=>{e.stopPropagation();selectCoin(c.symbol);go('instant')}}>خرید و فروش آنی</button></div>
          </div>;
        })}
      </div>
    </div>
  </div>;
};
  const Deposit=()=>{
  const [depositAddrCopied,setDepositAddrCopied]=useState(false);
  const copyDepositAddr=()=>{if(!addressValue)return;navigator.clipboard?.writeText(addressValue).then(()=>{setDepositAddrCopied(true);setTimeout(()=>setDepositAddrCopied(false),2000)}).catch(()=>{});};
  return <div className="exchange-page" style={{padding:0}}>
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:"1px solid var(--border-faint)"}}><button onClick={()=>go('deposit-select')} style={{width:36,height:36,borderRadius:10,background:"var(--card-bg2)",border:"1px solid var(--border-faint)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="arrow" size={18}/></button><h2 style={{flex:1,textAlign:"center",margin:0,fontSize:16,fontWeight:800,color:"var(--text-primary)"}}>واریز کوین</h2><div style={{width:36}}/></div>
    <div style={{padding:"16px 16px 80px"}}>
      <div className="warning-box"><b>نکات امنیتی واریز کوین</b><p>آدرس واریز فقط زمانی نمایش داده می‌شود که سرویس کیف پول واقعی آن را برای این حساب و شبکه ارائه کند. از نمایش یا استفاده از آدرس ساختگی خودداری می‌شود.</p></div>
      <AssetSelect label="کوین"/><NetworkSelect/>
      <section className="address-card" style={{textAlign:"right",marginTop:14}}>
        {addressValue ? <>
          <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:8,fontWeight:600,textAlign:"center"}}>آدرس واریز {asset}</div>
          <input readOnly value={addressValue} dir="ltr" lang="en" onClick={e=>(e.target as HTMLInputElement).select()} style={{width:"100%",boxSizing:"border-box",fontFamily:"'Courier New',Courier,monospace",fontSize:12,fontWeight:600,color:"var(--text-primary)",letterSpacing:"0.03em",wordBreak:"break-all",padding:"12px 14px",background:"var(--input-bg)",border:"1px solid var(--border-color)",borderRadius:10,outline:"none",textAlign:"left",direction:"ltr"}}/>
          <button onClick={copyDepositAddr} style={{width:"100%",minHeight:46,padding:"11px",marginTop:10,borderRadius:11,border:"1.5px solid rgba(0,214,176,0.3)",background:"var(--accent-dim,rgba(0,214,176,0.08))",color:"var(--accent,#00D6B0)",fontFamily:"Vazirmatn",fontSize:14,fontWeight:700,cursor:"pointer"}}>{depositAddrCopied?"✓ آدرس کپی شد":"کپی آدرس"}</button>
        </> : <div style={{padding:"24px 14px",textAlign:"center",color:"var(--text-muted)",lineHeight:1.9,fontSize:13}}>آدرس واریز واقعی برای این کوین و شبکه هنوز از سرویس کیف پول دریافت نشده است.<br/><b style={{color:"var(--text-primary)"}}>تا زمان دریافت آدرس، هیچ QR یا آدرس ساختگی نمایش داده نمی‌شود.</b></div>}
      </section>
    </div>
  </div>;
};
  const DepositSelect=()=>{const [depSearch,setDepSearch]=useState("");const filteredCoins=coins.filter(c=>(c.symbol+c.fa).toLowerCase().includes(depSearch.toLowerCase()));return <div className="exchange-page" style={{padding:0}}><div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:"1px solid var(--border-faint)",flexShrink:0}}><button onClick={()=>go('assets')} style={{width:36,height:36,borderRadius:10,background:"var(--card-bg2)",border:"1px solid var(--border-faint)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="arrow" size={18}/></button><h2 style={{flex:1,textAlign:"center",margin:0,fontSize:16,fontWeight:800,color:"var(--text-primary)"}}>واریز — انتخاب دارایی</h2><div style={{width:36}}/></div><div style={{padding:"16px 16px 80px",overflowY:"auto",flex:1}}><button onClick={()=>go('toman-deposit')} style={{display:"flex",alignItems:"center",gap:14,width:"100%",padding:"16px 18px",borderRadius:16,background:"rgba(0,214,176,0.07)",border:"1.5px solid rgba(0,214,176,0.22)",cursor:"pointer",textAlign:"right",fontFamily:"Vazirmatn",color:"var(--text-primary)",transition:"all .15s",marginBottom:16,boxSizing:"border-box"}}><span style={{fontSize:28,flexShrink:0}}>🇮🇷</span><div style={{flex:1}}><div style={{fontWeight:800,fontSize:16,color:"var(--text-primary)"}}>تومان</div><div style={{fontSize:12,color:"var(--text-muted)",marginTop:3}}>TMN · واریز از درگاه بانکی</div></div><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12L10 8 6 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity=".45"/></svg></button><div style={{fontSize:12,color:"var(--text-muted)",marginBottom:10,fontWeight:700}}>ارزهای دیجیتال</div><div style={{display:"flex",alignItems:"center",gap:8,border:"1px solid var(--border-color)",background:"var(--input-bg)",borderRadius:12,padding:"0 12px",marginBottom:14}}><Icon name="search" size={16}/><input value={depSearch} onChange={e=>setDepSearch(e.target.value)} placeholder="جستجوی ارز..." style={{flex:1,border:0,background:"transparent",outline:0,color:"var(--text-primary)",padding:"10px 6px",fontFamily:"Vazirmatn",fontSize:13}}/></div><div style={{display:"flex",flexDirection:"column",gap:7}}>{filteredCoins.map(c=><button key={c.symbol} onClick={()=>{selectCoin(c.symbol);setNetwork("");go('deposit');}} style={{display:"flex",alignItems:"center",gap:13,padding:"13px 16px",borderRadius:14,background:"var(--card-bg)",border:"1px solid var(--border-light)",cursor:"pointer",textAlign:"right",fontFamily:"Vazirmatn",color:"var(--text-primary)",transition:"all .15s",boxSizing:"border-box",width:"100%"}}><CoinLogo symbol={c.symbol} size={38}/><div style={{flex:1}}><div style={{fontWeight:700,fontSize:15,color:"var(--text-primary)"}}>{c.fa}</div><div style={{fontSize:12,color:"var(--text-muted)",marginTop:3}}>{c.symbol}</div></div><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12L10 8 6 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity=".45"/></svg></button>)}</div></div></div>;};
  const handleWithdrawSubmit=(addr:string,amt:string)=>{
    const value=Number(amt);
    if(!Number.isFinite(value)||value<=0){setNotice("مبلغ برداشت نامعتبر است.");return;}
    setAddress(addr);setAmount(amt);
    pendingWithdrawCb.current=async()=>{
      try{
        const assets=await sarrafAssets();
        const assetId=sarrafAssetId(assets,asset);
        const result=await sarrafRequest("/api/v1/withdrawals",{method:"POST",body:JSON.stringify({assetId,amount:String(value),network:network.trim(),destination:addr.trim(),idempotencyKey:crypto.randomUUID()})});
        setNotice(`درخواست برداشت در آن صراف ثبت شد. شناسه: ${String(result?.withdrawal?.id??result?.withdrawalId??"—")}`);
      }catch(e){setNotice(e instanceof Error?e.message:"ثبت برداشت انجام نشد.");}
    };
    setWithdrawSummary({amount:`${toFaDigits(amt)} ${asset==="USDT"?"دلار تتر":asset}`,destination:`شبکه ${network} · ${addr.slice(0,8)}...`,network,address:addr});
    go("withdraw-confirm");
  };
  const History=()=>{const [filter,setFilter]=useState<"همه"|"خرید و فروش"|"واریز"|"برداشت">("همه");const tradeTypeLabel:Record<string,string>={instant:"معاملات آنی",spot:"معاملات اسپات",margin:"معاملات تعهدی",conversion:"تبدیل دارایی",withdraw:"برداشت کوین",deposit:"واریز کوین"};const exchangeTx=transactions.filter(tx=>tx.source==="exchange"||(tx.source==null&&(tx.note?.includes("[صرافی]")||tx.type==="deposit"||tx.type==="withdraw"))).filter(tx=>filter==="همه"||(filter==="خرید و فروش"&&tx.type==="swap")||(filter==="واریز"&&tx.type==="deposit")||(filter==="برداشت"&&tx.type==="withdraw"));const status={done:"موفق",pending:"در حال پردازش",failed:"ناموفق"};return <div className="exchange-page exchange-history"><div className="page-title"><h2>تاریخچه</h2><button onClick={()=>setNotice("خروجی اطلاعات تراکنش‌ها آماده دانلود است.")}>خروجی</button></div><div className="segmented small">{(["همه","خرید و فروش","واریز","برداشت"] as const).map(item=><button key={item} className={filter===item?"active":""} onClick={()=>setFilter(item)}>{item}</button>)}</div>{exchangeTx.length?<div className="exchange-history-list">{exchangeTx.map(tx=><button type="button" key={tx.id} className="exchange-history-row" onClick={()=>goDetail(tx,'history')}><span className={`history-status ${tx.status}`}><i/>{status[tx.status]}</span><div><b>{tx.tradeType?tradeTypeLabel[tx.tradeType]||(tx.note?.split(" · ")[0]||tx.type):tx.note?.split(" · ").slice(0,2).join(" · ")||({swap:"خرید و فروش",deposit:"واریز",withdraw:"برداشت",transfer:"انتقال",service:"خدمات"}[tx.type])}</b><small>{new Date(tx.createdAt).toLocaleDateString("fa-IR")} · {new Date(tx.createdAt).toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit"})}</small></div><strong>{faFixed(tx.amount,tx.fromAsset==="toman"?0:4)} {tx.fromAsset==="toman"?"تومان":tx.fromAsset.toUpperCase()}</strong><em>‹</em></button>)}</div>:<div className="empty-state">هنوز تراکنشی در صرافی ثبت نشده است.</div>}</div>};
  const Fees=()=><div className="exchange-page">
    <h2 style={{fontSize:20,fontWeight:900,marginBottom:20}}>کارمزدها</h2>
    {[
      {level:"سطح ۱",range:"۰ تا ۱۰۰ میلیون تومان",maker:"۰٫۲۵٪",taker:"۰٫۳٪"},
      {level:"سطح ۲",range:"۱۰۰ تا ۵۰۰ میلیون تومان",maker:"۰٫۲٪",taker:"۰٫۲۵٪"},
      {level:"سطح ۳",range:"۵۰۰ میلیون تا ۲ میلیارد تومان",maker:"۰٫۱۵٪",taker:"۰٫۲٪"},
      {level:"سطح ۴",range:"بیش از ۲ میلیارد تومان",maker:"۰٫۱٪",taker:"۰٫۱۵٪"},
    ].map(row=><button key={row.level} className="fee-card" onClick={()=>setFeeDetail(row.level)} style={{display:"block",width:"100%",textAlign:"right",marginBottom:12,cursor:"pointer",padding:"18px 20px",borderRadius:16,background:"var(--card-bg)",border:"1px solid var(--border-color)",boxSizing:"border-box"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <span style={{fontSize:15,fontWeight:800,color:"var(--text-primary)"}}>{row.level}</span>
        <span style={{fontSize:12,color:"var(--text-muted)"}}>{row.range}</span>
      </div>
      <div style={{display:"flex",gap:20}}>
        <span style={{fontSize:14,color:"var(--text-muted)"}}>میکر <strong style={{color:"#00D6B0"}}>{row.maker}</strong></span>
        <span style={{fontSize:14,color:"var(--text-muted)"}}>تیکر <strong style={{color:"#00D6B0"}}>{row.taker}</strong></span>
      </div>
    </button>)}
    <p className="muted-copy" style={{fontSize:13,lineHeight:1.8}}>کارمزد دقیق پیش از ثبت هر سفارش نمایش داده می‌شود. برای اطلاعات بیشتر با پشتیبانی تماس بگیرید.</p>
    {feeDetail&&<div style={{marginTop:8,marginBottom:16,padding:"18px 20px",borderRadius:14,background:"var(--card-bg)",border:"1px solid rgba(0,214,176,0.25)",boxSizing:"border-box"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><h3 style={{margin:0,fontSize:16,fontWeight:900,color:"var(--text-primary)"}}>{feeDetail} — جزئیات کارمزد</h3><button onClick={()=>setFeeDetail(null)} style={{width:28,height:28,borderRadius:8,background:"rgba(255,255,255,0.06)",border:"1px solid var(--border-color)",color:"var(--text-muted)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>✕</button></div><p style={{fontSize:13,color:"var(--text-muted)",lineHeight:1.9,margin:0}}>کارمزد معاملات بر اساس حجم ۳۰ روز گذشته شما محاسبه می‌شود. پس از رسیدن به سطح بالاتر، کارمزد جدید از تراکنش بعدی اعمال خواهد شد.</p></div>}
  </div>;
  const Support=()=>{
    const scIcons:Record<string,ReactNode>={
      tickets:<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2 8l8 5 8-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
      chat:<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 4h14a2 2 0 012 2v7a2 2 0 01-2 2H7l-4 3V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><circle cx="7" cy="9.5" r="1" fill="currentColor"/><circle cx="10" cy="9.5" r="1" fill="currentColor"/><circle cx="13" cy="9.5" r="1" fill="currentColor"/></svg>,
      fees:<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="6.5" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/><circle cx="13.5" cy="13.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M4.5 15.5l11-11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
      guide:<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 4h5.5a3 3 0 013 3v9H6a3 3 0 01-3-3V4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M17 4h-5.5a3 3 0 00-3 3v9H14a3 3 0 003-3V4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>,
    };
    return <div className="exchange-page">
      <h2 style={{fontSize:20,fontWeight:900,marginBottom:20,color:"var(--text-primary)"}}>موارد بیشتر</h2>
      {[
        {label:"ارسال تیکت",sub:"ارسال درخواست پشتیبانی",action:"tickets"},
        {label:"چت با پشتیبان",sub:"پاسخگویی آنی ۲۴/۷",action:"chat"},
        {label:"کارمزدها",sub:"جدول کارمزد معاملات",action:"fees"},
        {label:"راهنمای استفاده",sub:"آموزش سرویس‌های صرافی",action:"guide"},
      ].map(item=><button key={item.action} className="support-card" onClick={()=>go(item.action as View)} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",borderRadius:16,background:"var(--card-bg)",border:"1px solid var(--border-color)",width:"100%",marginBottom:10,cursor:"pointer",textAlign:"right",boxSizing:"border-box"}}>
        <span className="scard-icon">{scIcons[item.action]}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:800,color:"var(--text-primary)",marginBottom:3}}>{item.label}</div>
          <div style={{fontSize:12,color:"var(--text-muted)"}}>{item.sub}</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>)}
    </div>;
  };
  const WithdrawSelect=()=><div className="exchange-page">
    <div className="page-title"><button className="back-btn" onClick={()=>go('home')}><Icon name="arrow" size={18}/></button><h2>انتخاب ارز برداشت</h2></div>
    <div style={{display:"flex",flexDirection:"column",gap:10,padding:"16px 0"}}>
      {/* Toman first */}
      <button className="asset-row" onClick={()=>go('toman-withdraw')} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:14,background:"var(--card-bg)",border:"1px solid var(--border-color)",cursor:"pointer",width:"100%",boxSizing:"border-box"}}>
        <div style={{width:36,height:36,borderRadius:"50%",overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,background:"rgba(0,214,176,0.08)",border:"1px solid rgba(0,214,176,0.15)"}}>🇮🇷</div>
        <div style={{textAlign:"right",flex:1}}><div style={{fontWeight:700,fontSize:14,color:"var(--text-primary)"}}>تومان</div><div style={{fontSize:12,color:"var(--text-muted)"}}>TMN</div></div>
      </button>
      {/* All exchange coins */}
      {coins.map(c=>(
        <button key={c.symbol} className="asset-row" onClick={()=>{selectCoin(c.symbol);go('withdraw')}} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:14,background:"var(--card-bg)",border:"1px solid var(--border-color)",cursor:"pointer",width:"100%",boxSizing:"border-box"}}>
          <CoinLogo symbol={c.symbol} size={36}/>
          <div style={{textAlign:"right",flex:1}}><div style={{fontWeight:700,fontSize:14,color:"var(--text-primary)"}}>{c.fa}</div><div style={{fontSize:12,color:"var(--text-muted)"}}>{c.symbol}</div></div>
        </button>
      ))}
    </div>
  </div>;
  const TradeTypeCard=({icon,title,desc,onClick}:{icon:ReactNode;title:string;desc:string;onClick:()=>void})=><button type="button" onClick={onClick} className="trade-type-btn" style={{display:"flex",alignItems:"flex-start",gap:14,width:"100%",padding:"16px 18px",borderRadius:16,cursor:"pointer",textAlign:"right",marginBottom:10,transition:"all .18s",fontFamily:"Vazirmatn"}} onMouseDown={e=>(e.currentTarget.style.transform="scale(0.98)")} onMouseUp={e=>(e.currentTarget.style.transform="scale(1)")} onTouchStart={e=>(e.currentTarget.style.transform="scale(0.98)")} onTouchEnd={e=>(e.currentTarget.style.transform="scale(1)")}><span className="ttc-icon">{icon}</span><div style={{flex:1}}><div className="ttc-title" style={{fontSize:15,fontWeight:800,marginBottom:4}}>{title}</div><div className="ttc-desc" style={{fontSize:12,lineHeight:1.6}}>{desc}</div></div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(0,214,176,0.6)" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg></button>;
  const DisplayModeCard=({icon,title,desc,onClick}:{icon:ReactNode;title:string;desc:string;onClick:()=>void})=><button type="button" onClick={onClick} className="trade-type-btn" style={{display:"flex",alignItems:"flex-start",gap:14,width:"100%",padding:"18px 18px",borderRadius:16,cursor:"pointer",textAlign:"right",marginBottom:12,transition:"all .18s",fontFamily:"Vazirmatn"}} onMouseDown={e=>(e.currentTarget.style.transform="scale(0.98)")} onMouseUp={e=>(e.currentTarget.style.transform="scale(1)")} onTouchStart={e=>(e.currentTarget.style.transform="scale(0.98)")} onTouchEnd={e=>(e.currentTarget.style.transform="scale(1)")}><span className="ttc-icon">{icon}</span><div style={{flex:1}}><div className="ttc-title" style={{fontSize:15,fontWeight:800,marginBottom:5}}>{title}</div><div className="ttc-desc" style={{fontSize:12,lineHeight:1.7}}>{desc}</div></div></button>;
  const TradeTypeSelectPage=()=><div className="expage" dir="rtl"><div className="expage-header"><button className="back-btn" onClick={()=>go('home')}><Icon name="arrow" size={20}/></button><h2 className="expage-title">انتخاب نوع معامله</h2><div style={{width:36}}/></div><div className="expage-body"><p style={{fontSize:13,color:"var(--text-muted)",marginBottom:18,lineHeight:1.6}}>لطفاً نوع معامله مورد نظر خود را انتخاب کنید.</p><TradeTypeCard icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 2L4 11h6l-2 7 8-10h-6l2-6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round"/></svg>} title="خرید و فروش آنی" desc="خرید یا فروش سریع با قیمت لحظه‌ای بازار" onClick={()=>openSelectedTrading("instant")}/><TradeTypeCard icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="8" width="3" height="9" rx="1" fill="currentColor" opacity="0.85"/><line x1="4.5" y1="5" x2="4.5" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><rect x="8.5" y="4" width="3" height="8" rx="1" fill="currentColor"/><line x1="10" y1="2" x2="10" y2="4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="10" y1="12" x2="10" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><rect x="14" y="9" width="3" height="8" rx="1" fill="currentColor" opacity="0.85"/><line x1="15.5" y1="6" x2="15.5" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>} title="معامله اسپات" desc="معامله حرفه‌ای با سفارش‌گذاری و دفتر سفارشات" onClick={()=>openSelectedTrading("spot")}/><TradeTypeCard icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><line x1="10" y1="3" x2="10" y2="17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><line x1="2" y1="6" x2="18" y2="6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M2 6L.5 11h7L6 6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"/><path d="M18 6l1.5 5h-7L14 6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"/><line x1="7" y1="17" x2="13" y2="17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>} title="معامله تعهدی" desc="معامله با اهرم و امکان کسب سود از رشد یا ریزش بازار" onClick={()=>openSelectedTrading("margin")}/></div></div>;
  const TradeDisplaySelectPage=()=><div className="expage" dir="rtl"><div className="expage-header"><button className="back-btn" onClick={()=>go('trade-type-select')}><Icon name="arrow" size={20}/></button><h2 className="expage-title">انتخاب نوع نمایش {tradeDisplayPicker==="spot"?"معامله اسپات":"معامله تعهدی"}</h2><div style={{width:36}}/></div><div className="expage-body"><p style={{fontSize:13,color:"var(--text-muted)",marginBottom:18,lineHeight:1.6}}>نحوه نمایش محیط {tradeDisplayPicker==="spot"?"معامله اسپات":"معامله تعهدی"} را انتخاب کنید.</p><DisplayModeCard icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><polyline points="2,15 6,9 10,12 14,6 18,8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><line x1="2" y1="18" x2="18" y2="18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/></svg>} title={`${tradeDisplayPicker==="spot"?"معامله اسپات":"معامله تعهدی"} همراه با نمایش نمودار`} desc={`${tradeDisplayPicker==="spot"?"معامله اسپات":"معامله تعهدی"} با نمودار تریدینگ‌ویو و ابزارهای کامل تحلیل`} onClick={()=>{go(tradeDisplayPicker==="spot"?"spot-chart":"margin-chart")}}/><DisplayModeCard icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="3" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.3"/><rect x="2" y="8.5" width="12" height="3" rx="1.5" fill="currentColor" opacity="0.65"/><rect x="2" y="14" width="8" height="3" rx="1.5" fill="currentColor"/><rect x="14" y="3" width="4" height="3" rx="1.5" fill="currentColor" opacity="0.65"/></svg>} title={`${tradeDisplayPicker==="spot"?"معامله اسپات":"معامله تعهدی"} همراه با نمایش لیست سفارش‌ها`} desc={`${tradeDisplayPicker==="spot"?"معامله اسپات":"معامله تعهدی"} با نمایش دفتر سفارشات و اطلاعات بازار`} onClick={()=>{go(tradeDisplayPicker==="spot"?"spot":"margin")}}/></div></div>;
  const CoinSelectPage=()=>{
  const [q,setQ]=useState(search);
  const filtered=coins.filter(c=>(c.symbol+c.fa).toLowerCase().includes(q.toLowerCase()));
  return <div className="expage" dir="rtl">
    <div className="expage-header">
      <button className="back-btn" onClick={()=>go(selReturnView||'withdraw')}><Icon name="arrow" size={20}/></button>
      <h2 className="expage-title">انتخاب کوین</h2>
      <div style={{width:36}}/>
    </div>
    <div className="expage-body">
      <div className="market-search" style={{margin:"0 0 12px"}}>
        <Icon name="search" size={18}/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="جستجوی نام کوین"/>
      </div>
      <div className="picker-list">
        {filtered.map(c=><button key={c.symbol} onClick={()=>{setAsset(c.symbol);setNetwork("");go(selReturnView||'withdraw');}}>
          <CoinLogo symbol={c.symbol}/>
          <span><b>{c.fa}</b><small>{c.symbol}</small></span>
        </button>)}
      </div>
    </div>
  </div>;
};
const NetworkSelectPage=()=>{
  const coin=coins.find(c=>c.symbol===asset)??coins[0];
  return <div className="expage" dir="rtl">
    <div className="expage-header">
      <button className="back-btn" onClick={()=>go(selReturnView||'withdraw')}><Icon name="arrow" size={20}/></button>
      <h2 className="expage-title">انتخاب شبکه</h2>
      <div style={{width:36}}/>
    </div>
    <div className="expage-body">
      <div className="warning-box" style={{marginBottom:12}}>از یکسان بودن شبکه انتخاب‌شده در پلتفرم مبدأ اطمینان حاصل کنید؛ انتخاب شبکه اشتباه باعث از دست‌رفتن سرمایه می‌شود.</div>
      <div className="picker-list">
        {coin.networks.map(n=><button key={n} onClick={()=>{setNetwork(n);go(selReturnView||'withdraw');}}>
          <span><b>{n}</b></span>
          <em>{asset==='USDT'?'۰٫۵ دلار تتر':'۰٫۰۰۰۵ '+asset}</em>
        </button>)}
      </div>
    </div>
  </div>;
};
const TxDetailPage=()=>{
  const tx=txDetailRecord;
  if(!tx)return null;
  const typeLabel:Record<string,string>={swap:"تبدیل دارایی",transfer:"انتقال وجه",deposit:"واریز",withdraw:"برداشت"};
  const tradeTypeTitle:Record<string,string>={instant:"معامله آنی",spot:"معامله اسپات",margin:"معامله تعهدی",conversion:"تبدیل دارایی",withdraw:"برداشت کوین",deposit:"واریز کوین"};
  const statusLabel:Record<string,string>={done:"انجام‌شده",pending:"در انتظار",failed:"ناموفق"};
  const statusColor:Record<string,string>={done:"#00D6B0",pending:"#f5c23d",failed:"#e85c5c"};
  const accentColor=statusColor[tx.status]||"#00D6B0";
  const isDone=tx.status==="done";
  const dt=new Date(tx.createdAt);
  const timeStr=dt.toLocaleDateString("fa-IR")+" · "+dt.toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit"});
  const serviceTitle=tx.type==="service"?(tx.note?.split(" · ")[0]||"خدمات"):null;
  const title=serviceTitle??(tx.tradeType?tradeTypeTitle[tx.tradeType]??(typeLabel[tx.type]??tx.type):typeLabel[tx.type]??tx.type);
  const noteDisplay=tx.note?(serviceTitle&&tx.note.includes(" · ")?tx.note.slice(tx.note.indexOf(" · ")+3):tx.note):null;
  const amountDisplay=tx.type!=="service"?`${faFixed(tx.amount,tx.fromAsset==="toman"?0:2)} ${tx.fromAsset==="toman"?"ریال":"دلار تتر"}`:tx.amount>0?`${fa(Math.round(tx.amount))} ریال`:null;
  const [copied,setCopied]=useState(false);
  const rows=([
    ["شناسه",tx.id],
    ["زمان",timeStr],
    tx.convertedAmount!=null?["معادل",`${tx.toAsset==="usdt"?faFixed(tx.convertedAmount,2):fa(Math.round(tx.convertedAmount))} ${tx.toAsset==="toman"?"ریال":"دلار تتر"}`]:null,
    tx.fee>0?["کارمزد",`${faFixed(tx.fee,2)} دلار تتر`]:null,
    tx.toAddress?["مقصد",tx.toAddress]:null,
    noteDisplay?["جزئیات",noteDisplay]:null,
  ] as ([string,string]|null)[]).filter((x):x is [string,string]=>x!==null);
  const handleCopy=()=>{
    const text=[`آن‌پرداز — ${title}`,`وضعیت: ${statusLabel[tx.status]}`,amountDisplay?`مبلغ: ${amountDisplay}`:"",`زمان: ${timeStr}`,`شناسه: ${tx.id}`,...(tx.toAddress?[`مقصد: ${tx.toAddress}`]:[]),...(noteDisplay?[`جزئیات: ${noteDisplay}`]:[])].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2200);}).catch(()=>{});
  };
  return <div className="expage" dir="rtl">
    <div className="expage-header">
      <button className="back-btn" onClick={()=>go(prevView)}><Icon name="arrow" size={20}/></button>
      <h2 className="expage-title">جزئیات تراکنش</h2>
      <div style={{width:36}}/>
    </div>
    <div className="expage-body">
      <div className="rp-card">
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"24px 22px 20px",textAlign:"center",borderBottom:"1px solid var(--border-faint)"}}>
          <div style={{width:68,height:68,borderRadius:"50%",background:`${accentColor}14`,border:`2px solid ${accentColor}30`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12}}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {isDone?<><polyline points="20 6 9 17 4 12"/></>:tx.status==="pending"?<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>:<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
            </svg>
          </div>
          <div style={{fontSize:15,fontWeight:800,color:"var(--text-primary)",marginBottom:4}}>{title}</div>
          {amountDisplay&&<div style={{fontSize:24,fontWeight:900,color:accentColor,marginTop:4}}>{amountDisplay}</div>}
          <div style={{display:"flex",alignItems:"center",gap:6,background:`${accentColor}18`,border:`1px solid ${accentColor}40`,borderRadius:20,padding:"4px 12px",marginTop:10}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:accentColor}}/>
            <span style={{fontSize:11,fontWeight:700,color:accentColor}}>{statusLabel[tx.status]||tx.status}</span>
          </div>
        </div>
        <div style={{padding:"0 0 4px"}}>
          {rows.map(([k,v],i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"12px 16px",borderBottom:i<rows.length-1?"1px solid var(--border-faint)":"none",gap:12}}>
              <span style={{fontSize:12.5,color:"var(--text-muted)",flexShrink:0,paddingTop:1}}>{k}</span>
              <span style={{fontSize:13,color:"var(--text-primary)",fontWeight:600,textAlign:"left",wordBreak:"break-all",overflowWrap:"anywhere",direction:k==="مقصد"||k==="شناسه"?"ltr":"rtl",maxWidth:"62%",lineHeight:1.5}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",padding:"10px 0 14px",fontSize:11,color:"var(--text-faint)",fontWeight:600}}>آن‌پرداز · رسید رسمی</div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:12}}>
        <button onClick={handleCopy} className="outline-button" style={{flex:1}}>
          {copied?"✓ کپی شد":"کپی رسید"}
        </button>
      </div>
    </div>
  </div>;
};
  if(kycFlow==="photo")return <OnboardPhoto onDone={p=>{setKycPhoto(p);setKycFlow("profile")}} onBack={()=>setKycFlow(null)} initialAccepted={true}/>;
  if(kycFlow==="profile")return <OnboardProfile onDone={d=>{setKycProfile(d);setKycFlow("anim")}} onBack={()=>setKycFlow("photo")} initialData={kycProfile}/>;
  if(kycFlow==="anim")return <VerificationAnimation onSuccess={async()=>{try{await sarrafSubmitKyc({fullName:`${kycProfile.name||user.name} ${kycProfile.family||user.family}`.trim(),nationalId:kycProfile.nationalId||user.nationalId,mobile:user.phone,birthDate:kycProfile.birthDate||user.birthDate});const updated={...user,name:kycProfile.name||user.name,family:kycProfile.family||user.family,nationalId:kycProfile.nationalId||user.nationalId,birthDate:kycProfile.birthDate||user.birthDate,photo:kycPhoto||user.photo,kycDone:true};DB.saveUser(updated);if(onUpdateUser)onUpdateUser(updated);setKycFlow(null);go(pendingKycDest);}catch{setKycFailed(true);}}} onFail={()=>setKycFailed(true)}/>;
  if(kycFailed)return <div className="anp-full-page" dir="rtl" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,padding:24}}><div style={{width:72,height:72,borderRadius:"50%",background:"rgba(239,68,68,0.12)",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div><div style={{fontSize:17,fontWeight:800,color:"var(--text-primary)",textAlign:"center"}}>احراز هویت ناموفق</div><div style={{fontSize:13,color:"var(--text-muted)",textAlign:"center",lineHeight:1.8,maxWidth:300}}>احراز هویت شما ناموفق بود. لطفاً مدارک خود را بررسی کرده و دوباره تلاش کنید.</div><button className="primary-button" onClick={()=>{setKycFailed(false);setKycFlow("photo");}}>تلاش مجدد</button><button className="outline-button" onClick={()=>setKycFailed(false)}>بازگشت به صرافی</button></div>;
  return <div className="subscreen exchange-shell" dir="rtl" style={{display:"flex",flexDirection:"column",height:"100dvh"}}><ExchangeTopBar/><div className="subscreen-body exchange-body" style={{flex:1,overflowY:"auto",paddingBottom:0}}>{view==='home'?<Home/>:view==='spot'?<ExchangeProTrade mode="spot" initialAsset={selectedAsset} user={user} coins={coins} onBack={()=>go('home')} onUpdate={onUpdate} onNavigate={(target,nextAsset)=>{selectCoin(nextAsset);go(target)}} onAssetChange={selectCoin} favorites={favorite} onToggleFavorite={toggleFavorite}/>:view==='margin'?<ExchangeProTrade mode="margin" initialAsset={selectedAsset} user={user} coins={coins} onBack={()=>go('home')} onUpdate={onUpdate} onNavigate={(target,nextAsset)=>{selectCoin(nextAsset);go(target)}} onAssetChange={selectCoin} favorites={favorite} onToggleFavorite={toggleFavorite}/>:view==='spot-chart'?<ExchangeChartPage asset={selectedAsset} coin={coins.find(c=>c.symbol===selectedAsset)??coins[0]} coins={coins} user={user} favorites={favorite} onToggleFavorite={toggleFavorite} onBack={()=>go('home')} onInstant={(a)=>{selectCoin(a);go('instant')}} onUpdate={onUpdate} onPairSelect={(a)=>{selectCoin(a)}}/>:view==='margin-chart'?<MarginChartPage asset={selectedAsset} coin={coins.find(c=>c.symbol===selectedAsset)??coins[0]} coins={coins} user={user} favorites={favorite} onToggleFavorite={toggleFavorite} onBack={()=>go('home')} onUpdate={onUpdate} onAssetChange={selectCoin}/>:view==='instant'?<ExchangeInstantTrade initialAsset={selectedAsset} user={user} coins={coins} onBack={()=>go('home')} onUpdate={onUpdate}/>:view==='fees'?<ExchangeFeesPage onBack={()=>go('home')}/>:view==='guide'?<ExchangeVideoGuide onBack={()=>go('home')}/>:view==='tickets'?<ExchangeSupportCenter onBack={()=>go('home')}/>:view==='chat'?<ExchangeChat onBack={()=>go('home')}/>:view==='markets'?Markets():view==='trade'?<Trade/>:view==='assets'?<Assets/>:view==='deposit'?<Deposit/>:view==='deposit-select'?<DepositSelect/>:view==='withdraw'?<WithdrawPage asset={asset} network={network} available={available} processing={processing} withdrawAddr={withdrawAddr} setWithdrawAddr={setWithdrawAddr} withdrawAmt={withdrawAmt} setWithdrawAmt={setWithdrawAmt} assetSelectEl={<AssetSelect label="نام کوین"/>} networkSelectEl={<NetworkSelect/>} onBack={()=>go("withdraw-select")} onHistory={()=>go("history")} onSubmit={handleWithdrawSubmit}/>:view==='history'?<History/>:view==='withdraw-select'?<WithdrawSelect/>:view==='toman-withdraw'?<TomanWithdrawScreen user={user} available={Number(liveWallets.TMN??0)} onBack={()=>go('withdraw-select')} onGoHome={()=>go('home')} onHistory={()=>go('history')}/>:view==='toman-deposit'?<TomanDepositPage user={user} tab={toDepositTab} setTab={setToDepositTab} onBack={()=>go('assets')}/>:view==='coin-select'?<CoinSelectPage/>:view==='network-select'?<NetworkSelectPage/>:view==='withdraw-confirm'?<WithdrawConfirmPage withdrawSummary={withdrawSummary} pendingWithdrawCb={pendingWithdrawCb} onBack={()=>go("withdraw")} onDone={()=>go("history")} onGoHome={()=>go("home")}/>:view==='tx-detail'?<TxDetailPage/>:view==='trade-type-select'?<TradeTypeSelectPage/>:view==='trade-display-select'?<TradeDisplaySelectPage/>:<Support/>}</div><ExchangeFooterNav/>{notice&&!notice.startsWith("exchange:")&&<div className="exchange-notice"><span>{notice}</span><button onClick={()=>setNotice('')} style={{border:"none",background:"transparent",color:"var(--accent)",fontFamily:"Vazirmatn",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0,padding:"4px 8px"}}>بستن</button></div>}{processing&&<AnPardazLoadingOverlay text="در حال انجام برداشت..."/>}{receipt&&createPortal(<TransactionReceipt data={receipt} onClose={()=>setReceipt(null)}/>,document.body)}</div>;
}


// ─── Modals ───────────────────────────────────────────────────────────────────
function AssetModal({user,rate,onClose}:{user:UserData;rate:number;onClose:()=>void}){
  const total=user.tomanBalance+user.usdtBalance*rate;
  return <div className="receipt-page" dir="rtl">
    <div className="receipt-page-header">
      <button className="back-btn" onClick={onClose}><Icon name="arrow" size={20}/></button>
      <h2 style={{flex:1,textAlign:"center",margin:0,fontSize:16,fontWeight:800,color:"var(--text-primary)"}}>جزئیات دارایی</h2>
      <img src={anPardazLogo} alt="آن‌پرداز" style={{height:22,objectFit:"contain"}}/>
    </div>
    <div className="receipt-page-body">
      <div className="rp-card" style={{background:"var(--card-bg)",borderRadius:20,overflow:"hidden",direction:"rtl",border:"1px solid var(--border-faint)"}}>
        <div style={{padding:"20px 22px",borderBottom:"1px solid var(--border-faint)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderBottom:"1px solid var(--border-faint)"}}><span style={{fontSize:14,color:"var(--text-muted)",fontWeight:600}}>تومان</span><strong style={{fontSize:16,fontWeight:800,color:"var(--text-primary)"}}>{fa(user.tomanBalance)} <small style={{fontSize:12,fontWeight:600}}>تومان</small></strong></div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderBottom:"1px solid var(--border-faint)"}}><span style={{fontSize:14,color:"var(--text-muted)",fontWeight:600}}>دلار تتر</span><div style={{textAlign:"left"}}><strong style={{fontSize:16,fontWeight:800,color:"var(--text-primary)"}}>{faFixed(user.usdtBalance,2)} <small style={{fontSize:12,fontWeight:600}}>USDT</small></strong><div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>≈ {fa(Math.round(user.usdtBalance*rate))} تومان</div></div></div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0 2px"}}><span style={{fontSize:14,color:"var(--text-muted)",fontWeight:700}}>ارزش کل دارایی</span><b style={{fontSize:18,fontWeight:900,color:"#00D6B0"}}>{fa(Math.round(total))} تومان</b></div>
        </div>
      </div>
      <button className="primary-button" onClick={onClose}>بازگشت</button>
    </div>
  </div>;
}

function TxModal({tx,onClose,isHistory=false}:{tx:TxRecord;onClose:()=>void;isHistory?:boolean}){
  const typeLabel:Record<string,string>={swap:"تبدیل دارایی",transfer:"انتقال وجه",deposit:"واریز",withdraw:"برداشت",service:"خدمات"};
  const tradeTypeTitle:Record<string,string>={instant:"معامله آنی",spot:"معامله اسپات",margin:"معامله تعهدی",conversion:"تبدیل دارایی",withdraw:"برداشت کوین",deposit:"واریز کوین"};
  const statusLabel:Record<string,string>={done:"انجام‌شده",pending:"در انتظار",failed:"ناموفق"};
  const isDone=tx.status==="done";
  const isPending=tx.status==="pending";
  const isFailed=tx.status==="failed";
  const [exiting,setExiting]=useState(false);
  const [phase,setPhase]=useState(isHistory?5:0);
  const [captured,setCaptured]=useState(false);
  const [toast,setToast]=useState("");
  const [copyDone,setCopyDone]=useState(false);
  const sheetRef=useRef<HTMLDivElement>(null);
  const cachedPng=useRef<string|null>(null);
  const dt=new Date(tx.createdAt);
  const timeStr=dt.toLocaleDateString("fa-IR")+" · "+dt.toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit"});
  const isCashbackWithdraw=tx.type==="deposit"&&(tx.note||"").startsWith("بازگشت هزینه · برداشت");
  const serviceTitle=tx.type==="service"?(tx.note?.split(" · ")[0]||"خدمات"):isCashbackWithdraw?"برداشت بازگشت هزینه":null;
  const title=serviceTitle??(tx.tradeType?tradeTypeTitle[tx.tradeType]??(typeLabel[tx.type]??tx.type):typeLabel[tx.type]??tx.type);
  const noteDisplay=tx.note?(serviceTitle&&tx.note.includes(" · ")?tx.note.slice(tx.note.indexOf(" · ")+3):tx.note):null;
  const amountDisplay=tx.type!=="service"?`${faFixed(tx.amount,tx.fromAsset==="toman"?0:2)} ${tx.fromAsset==="toman"?"ریال":"دلار تتر"}`:tx.amount>0?`${fa(Math.round(tx.amount))} ریال`:null;
  const isExchange=tx.source==="exchange";

  useEffect(()=>{
    if(isHistory)return;
    const ts=[
      setTimeout(()=>setPhase(1),0),
      setTimeout(()=>setPhase(2),1200),
      setTimeout(()=>setPhase(3),2600),
      setTimeout(()=>setPhase(4),3050),
      setTimeout(()=>setPhase(5),5200),
      setTimeout(()=>{
        if(!sheetRef.current)return;
        import("html-to-image").then(({toPng})=>{
          if(sheetRef.current)toPng(sheetRef.current,{pixelRatio:2}).then(d=>{cachedPng.current=d;}).catch(()=>{});
        }).catch(()=>{});
      },5500),
    ];
    return()=>ts.forEach(clearTimeout);
  },[isHistory]);

  const close=()=>{setExiting(true);setTimeout(onClose,320);};
  const cbNoteParts=isCashbackWithdraw?(tx.note||"").split(" · "):[];
  const cbCard=isCashbackWithdraw?cbNoteParts.find(p=>p.startsWith("کارت:"))?.replace("کارت:","").trim():null;
  const cbTrack=isCashbackWithdraw?cbNoteParts.find(p=>p.startsWith("شناسه:"))?.replace("شناسه:","").trim():null;
  const rows:[string,string][]=[
    ...(amountDisplay?[["مبلغ",amountDisplay] as [string,string]]:[]),
    ...(isCashbackWithdraw&&cbCard?[["کارت مقصد",`**** ${cbCard}`] as [string,string]]:[]),
    ...(tx.convertedAmount!=null&&!isCashbackWithdraw?[["معادل",`${tx.toAsset==="usdt"?faFixed(tx.convertedAmount,2):fa(Math.round(tx.convertedAmount))} ${tx.toAsset==="toman"?"ریال":"دلار تتر"}`] as [string,string]]:[]),
    ...(isExchange&&tx.note?.includes("نرخ")?[["نوع معامله",tx.tradeType?tradeTypeTitle[tx.tradeType]||tx.tradeType:"معامله"] as [string,string]]:[]),
    ["تاریخ و ساعت",timeStr],
    ...(isCashbackWithdraw&&cbTrack?[["شناسه پیگیری",cbTrack] as [string,string]]:[["شناسه تراکنش",tx.id] as [string,string]]),
    ...(tx.fee>0?[["کارمزد",`${faFixed(tx.fee,2)} دلار تتر`] as [string,string]]:[]),
    ...(tx.toAddress&&!isCashbackWithdraw?[["مقصد",tx.toAddress] as [string,string]]:[]),
    ...(!isCashbackWithdraw&&noteDisplay?[["توضیحات",noteDisplay] as [string,string]]:[]),
    ...(isCashbackWithdraw?[["نوع تراکنش","برداشت بازگشت هزینه"] as [string,string]]:[]),
  ];

  const doSave=(url:string)=>{
    const a=document.createElement("a");a.href=url;a.download="رسید-آن‌پرداز.png";
    if(navigator.canShare){fetch(url).then(r=>r.blob()).then(blob=>{const f=new File([blob],"رسید-آن‌پرداز.png",{type:"image/png"});navigator.canShare({files:[f]})?navigator.share({files:[f],title:"رسید آن‌پرداز"}).catch(()=>a.click()):a.click();});}else{a.click();}
    setToast("رسید در گالری ذخیره شد");setTimeout(()=>{setToast("");setCaptured(false);},2500);
  };
  const handleDownload=()=>{
    if(!sheetRef.current||captured)return;
    setCaptured(true);
    if(cachedPng.current){doSave(cachedPng.current);return;}
    import("html-to-image").then(({toPng})=>toPng(sheetRef.current!,{pixelRatio:2}).then(url=>{cachedPng.current=url;doSave(url);}).catch(()=>{setToast("ذخیره ناموفق");setTimeout(()=>{setToast("");setCaptured(false);},2000);})).catch(()=>{setToast("ذخیره ناموفق");setTimeout(()=>{setToast("");setCaptured(false);},2000);});
  };
  const handleShare=()=>{
    const text=[`آن‌پرداز — ${title}`,`وضعیت: ${statusLabel[tx.status]}`,amountDisplay?`مبلغ: ${amountDisplay}`:"",`تاریخ: ${timeStr}`,`شناسه: ${tx.id}`,...(tx.toAddress?[`مقصد: ${tx.toAddress}`]:[])].filter(Boolean).join("\n");
    navigator.share?navigator.share({title:"رسید آن‌پرداز",text}).catch(()=>{}):navigator.clipboard?.writeText(text).catch(()=>{});
  };
  const handleCopy=()=>{
    const rateNote=isExchange&&tx.note?.includes("نرخ")?tx.note.split(" · ").find(p=>p.startsWith("نرخ"))||"":null;
    const lines=["رسید تراکنش","─────────────────",`نوع تراکنش: ${title}`,...(amountDisplay?[`مبلغ: ${toFaDigits(amountDisplay)}`]:[]),...(tx.convertedAmount!=null?[`معادل: ${tx.toAsset==="usdt"?faFixed(tx.convertedAmount,2):fa(Math.round(tx.convertedAmount))} ${tx.toAsset==="toman"?"ریال":"دلار تتر"}`]:[]),...(rateNote?[rateNote]:[]),`وضعیت: ${statusLabel[tx.status]||tx.status}`,`تاریخ و ساعت: ${timeStr}`,`شناسه تراکنش: ${tx.id}`,...(tx.fee>0?[`کارمزد: ${faFixed(tx.fee,2)} دلار تتر`]:[]),...(tx.toAddress?[`مقصد: ${tx.toAddress}`]:[]),...(noteDisplay?[`توضیحات: ${noteDisplay}`]:[]),"─────────────────","آن پرداز پیشرو در خدمات بانکی و دارایی های دیجیتال"];
    navigator.clipboard?.writeText(lines.join("\n")).then(()=>{setCopyDone(true);setToast("رسید کپی شد");setTimeout(()=>{setToast("");setCopyDone(false);},2000);}).catch(()=>{});
  };

  const heroMod=isFailed?" rds-hero-failed":isPending?" rds-hero-pending":"";
  const sepMod=isFailed?" rds-failed":isPending?" rds-pending":"";
  const statusText=statusLabel[tx.status]||tx.status;
  const statusMod=isFailed?" rds-failed":isPending?" rds-pending":"";
  const heroTitle=isFailed?"تراکنش ناموفق بود":isPending?"تراکنش در حال پردازش":title;
  const heroSub=isFailed?"متأسفانه این تراکنش تکمیل نشد":isPending?"تراکنش شما در حال بررسی در شبکه است":"تراکنش با موفقیت تکمیل شد";
  const amountParts=amountDisplay?.match(/^(.*?)\s+(ریال|دلار تتر)$/);

  return(
    <>
      {phase>=1&&phase<=2&&(
        <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:8600}}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{display:"block"}}>
            <path d="M 50 0 L 100 0 L 100 100 L 0 100 L 0 0 L 50 0"
              fill="none" stroke={isDone?"#00CC8F":isPending?"#F5A623":"#E05050"} strokeWidth="3"
              strokeLinecap="round" vectorEffect="non-scaling-stroke" pathLength="1"
              className="rds-sweep-path"/>
          </svg>
        </div>
      )}
      <div className={`rds-screen${exiting?" rds-exiting":""}`} dir="rtl" ref={sheetRef}>
        <div className={`rds-hero${heroMod}`}>
          <div className="rds-topbar">
            <img src={anPardazLogo} alt="آن‌پرداز" className="rds-app-logo"/>
            <h1 className="rds-app-name">آن‌پرداز</h1>
            <button className="rds-close-btn" onClick={close}>بستن</button>
          </div>
          <div className="rds-check-area" style={{position:"relative"}}>
            <div className={`rds-check-container${phase>=2?" rds-check-visible":""}`}>
              <div className={`rds-check-ring${phase>=3?" rds-check-filled":""}`}>
                {isDone?(
                  <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
                    <polyline points="10,24 19,33 36,14" stroke="white" strokeWidth="4.5"
                      strokeLinecap="round" strokeLinejoin="round"
                      pathLength="1" strokeDasharray="1"
                      strokeDashoffset={phase>=2?0:1}
                      style={{transition:phase>=2?"stroke-dashoffset 0.52s ease-out 0.1s":"none"}}/>
                  </svg>
                ):isPending?(
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                ):(
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                )}
              </div>
            </div>
            <ReceiptFireworks active={isDone&&phase>=4&&phase<5}/>
          </div>
          <div className="rds-hero-text" style={{opacity:phase>=2?1:0,transition:"opacity 0.45s ease 0.2s"}}>
            <h2 className="rds-success-title">{heroTitle}</h2>
            <p className="rds-success-sub">{heroSub}</p>
            {amountParts&&(
              <div className="rds-amount-display">
                <span className="rds-amount-value">{toFaDigits(amountParts[1])}</span>
                <span className="rds-amount-unit">{amountParts[2]}</span>
              </div>
            )}
          </div>
        </div>
        <div className={`rds-ticket-sep${sepMod}`}>
          <svg width="100%" height="18" viewBox="0 0 390 18" preserveAspectRatio="none">
            <path d="M0 0 Q9.75 12 19.5 0 Q29.25 12 39 0 Q48.75 12 58.5 0 Q68.25 12 78 0 Q87.75 12 97.5 0 Q107.25 12 117 0 Q126.75 12 136.5 0 Q146.25 12 156 0 Q165.75 12 175.5 0 Q185.25 12 195 0 Q204.75 12 214.5 0 Q224.25 12 234 0 Q243.75 12 253.5 0 Q263.25 12 273 0 Q282.75 12 292.5 0 Q302.25 12 312 0 Q321.75 12 331.5 0 Q341.25 12 351 0 Q360.75 12 370.5 0 Q380.25 12 390 0 L390 18 L0 18 Z" fill="var(--app-bg)"/>
          </svg>
        </div>
        <div className="rds-scroll" style={{opacity:phase>=1?1:0,transition:"opacity 0.55s ease"}}>
          {toast&&<div className="rds-toast">{toast}</div>}
          <div className="rds-status-row">
            <span className={`rds-status-badge${statusMod}`}><span className="rds-status-dot"/>{statusText}</span>
            <span className="rds-tx-type-label">{title}</span>
          </div>
          <div className="rds-info-card">
            {rows.map(([k,v],i)=>{
              const isId=k==="شناسه تراکنش"||k==="مقصد";
              return(
                <div key={i} className="rds-info-row" style={{opacity:phase>=3?1:0,transform:phase>=3?"none":"translateX(10px)",transition:`opacity 0.3s ease ${0.05*i}s,transform 0.3s ease ${0.05*i}s`}}>
                  <span className="rds-info-label">{k}</span>
                  <span className={`rds-info-value${isId?" ltr":""}`}>{v}</span>
                </div>
              );
            })}
          </div>
          <div className="rds-referral-card" style={{opacity:phase>=4?1:0,transition:"opacity 0.5s ease"}}>
            <div className="rds-referral-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="rds-referral-text">
              <div className="rds-referral-title">دوستانتان را دعوت کنید</div>
              <div className="rds-referral-sub">با معرفی آن‌پرداز، هر دو پاداش دریافت کنید</div>
            </div>
            <button className="rds-referral-btn">دعوت</button>
          </div>
          <div className="rds-watermark" style={{marginBottom:10}}>آن‌پرداز · رسید رسمی پرداخت</div>
        </div>
        <div className="rds-action-bar" style={{opacity:phase>=3?1:0,transition:"opacity 0.4s ease 0.5s"}}>
          <div className="rds-action-row-primary">
            <button className="rds-btn-download" onClick={handleDownload} disabled={captured}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {captured?"در حال ذخیره...":"دریافت رسید"}
            </button>
            <button className={`rds-btn-icon${copyDone?" done":""}`} onClick={handleCopy} aria-label="کپی رسید">{copyDone?"✓":"کپی"}</button>
            <button className="rds-btn-icon" onClick={handleShare} aria-label="اشتراک‌گذاری">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>
          </div>
          <button className="rds-support-link" onClick={close}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            سوال دارید؟ تماس با پشتیبانی
          </button>
        </div>
      </div>
    </>
  );
}

function SupportModal({onClose}:{onClose:()=>void}){
  useBackHandler(onClose);
  return <div className="anp-full-page" dir="rtl">
    <div className="anp-page-header">
      <button className="back-btn" onClick={onClose}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">پشتیبانی</h2>
      <div style={{width:36}}/>
    </div>
    <div className="anp-page-body">
      <p style={{fontSize:13,color:"var(--text-muted)",marginBottom:20,textAlign:"center"}}>برای راهنمایی با شماره‌های زیر تماس بگیرید.</p>
      <a href="tel:09375437106" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:"rgba(0,214,176,0.1)",border:"1px solid rgba(0,214,176,0.25)",borderRadius:14,padding:"14px",color:"#00D6B0",textDecoration:"none",marginBottom:12,fontWeight:700,direction:"ltr"}}><Icon name="phone" size={20}/>۰۹۳۷۵۴۳۷۱۰۶</a>
      <a href="tel:09051826963" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:"rgba(0,214,176,0.1)",border:"1px solid rgba(0,214,176,0.25)",borderRadius:14,padding:"14px",color:"#00D6B0",textDecoration:"none",marginBottom:20,fontWeight:700,direction:"ltr"}}><Icon name="phone" size={20}/>۰۹۰۵۱۸۲۶۹۶۳</a>
      <button className="outline-button" style={{width:"100%"}} onClick={onClose}>بازگشت</button>
    </div>
  </div>;
}

function AddCardModal({onAdd,onClose}:{onAdd:(c:BankCard)=>void;onClose:()=>void}){
  const [num,setNum]=useState("");const [bank,setBank]=useState("");const [holder,setHolder]=useState("");const [err,setErr]=useState("");
  const fmt=(v:string)=>v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const detectedBank=detectBank(num.replace(/\s/g,""));
  const save=()=>{if(num.replace(/\s/g,"").length!==16){setErr("شماره کارت باید ۱۶ رقم باشد.");return}if(!bank||!holder){setErr("تمام فیلدها الزامی است.");return}onAdd({id:genId(),number:num.replace(/\s/g,""),bank,holderName:holder})};
  useBackHandler(onClose);
  return <div className="anp-full-page" dir="rtl">
    <div className="anp-page-header">
      <button className="back-btn" onClick={onClose}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">افزودن کارت بانکی</h2>
      <div style={{width:36}}/>
    </div>
    <div className="anp-page-body">
      <div className="bank-card-preview" style={{marginBottom:20}}><span>آن‌پرداز</span><b>{num?toFaDigits(fmt(num)):"•••• •••• •••• ••••"}</b><small>{holder||"نام صاحب کارت"}</small><em>{bank||"نام بانک"}</em></div>
      <div className="fl-grid" style={{marginBottom:16}}>
        <div>
          <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:4,paddingRight:2}}>شماره کارت</div>
          <div className="auth-input-wrap" style={{position:"relative"}}>
            {detectedBank&&<div style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",zIndex:2,pointerEvents:"none"}}><BankLogo bankName={detectedBank} size={28} rounded={7}/></div>}
            <input className="auth-input ltr" style={detectedBank?{paddingRight:44}:undefined} value={toFaDigits(fmt(num))} onChange={e=>{const c=toLatinDigits(e.target.value).replace(/\s/g,"");setNum(c);const d=detectBank(c);if(d&&!bank)setBank(d);}} inputMode="numeric" placeholder="xxxx xxxx xxxx xxxx" dir="ltr"/>
          </div>
        </div>
        <FloatInput label="نام بانک" value={bank} onChange={v=>setBank(v)} dir="rtl"/>
        <FloatInput label="نام صاحب کارت" value={holder} onChange={v=>setHolder(v)} dir="rtl"/>
      </div>
      {err&&<p className="field-err">{err}</p>}
      <button className="primary-button" onClick={save}>ذخیره کارت</button>
      <button className="outline-button" style={{width:"100%",marginTop:8}} onClick={onClose}>انصراف</button>
      </div>
    </div>;
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
function ProfilePage({user,onUpdate,onLogout,lightTheme,setLightTheme}:{user:UserData;onUpdate:(u:UserData)=>void;onLogout:()=>void;lightTheme:boolean;setLightTheme:(v:boolean)=>void}){
  const [modal,setModal]=useState<null|"info"|"addcard"|"addcard-shaparak"|"support"|"settings">(null);
  const [pinModal,setPinModal]=useState<null|"enable"|"change"|"disable">(null);
  const [pinStep,setPinStep]=useState<"enter-current"|"enter-new"|"confirm-new">("enter-current");
  const [pinInput,setPinInput]=useState("");
  const [pinNew,setPinNew]=useState("");
  const [pinError,setPinError]=useState("");
  const handlePinOpen=(mode:"enable"|"change"|"disable")=>{setPinModal(mode);setPinStep(mode==="enable"?"enter-new":"enter-current");setPinInput("");setPinNew("");setPinError("");};
  const handlePinDigit=(d:string)=>{if(pinInput.length<4)setPinInput(p=>{const next=p+d;
    if(next.length===4){
      setTimeout(()=>{
        if(pinModal==="enable"){
          if(pinStep==="enter-new"){setPinNew(next);setPinStep("confirm-new");setPinInput("");}
          else if(pinStep==="confirm-new"){if(next===pinNew){onUpdate({...user,pin:pinNew});DB.saveUser({...user,pin:pinNew});setPinModal(null);}else{setPinError("رمزها یکسان نیستند. دوباره امتحان کن.");setPinStep("enter-new");setPinNew("");setPinInput("");}}
        } else if(pinModal==="change"){
          if(pinStep==="enter-current"){if(next===user.pin){setPinStep("enter-new");setPinInput("");setPinError("");}else{setPinError("رمز اشتباه است.");setPinInput("");}}
          else if(pinStep==="enter-new"){setPinNew(next);setPinStep("confirm-new");setPinInput("");}
          else if(pinStep==="confirm-new"){if(next===pinNew){onUpdate({...user,pin:pinNew});DB.saveUser({...user,pin:pinNew});setPinModal(null);}else{setPinError("رمزها یکسان نیستند.");setPinStep("enter-new");setPinNew("");setPinInput("");}}
        } else if(pinModal==="disable"){
          if(next===user.pin){onUpdate({...user,pin:""});DB.saveUser({...user,pin:""});setPinModal(null);}else{setPinError("رمز اشتباه است.");setPinInput("");}
        }
      },100);
    }
    return next;
  });};
  const pinStepLabel=()=>{
    if(pinModal==="enable")return pinStep==="enter-new"?"رمز جدید ۴ رقمی را وارد کنید":"رمز را تکرار کنید";
    if(pinModal==="change")return pinStep==="enter-current"?"رمز فعلی را وارد کنید":pinStep==="enter-new"?"رمز جدید را وارد کنید":"رمز جدید را تکرار کنید";
    if(pinModal==="disable")return "رمز فعلی را وارد کنید";
    return "";
  };
  const [notifications,setNotifications]=useState(()=>localStorage.getItem(`anp_notifications_${user.uid}`)!=="off");
  const [keySoundEnabled,setKeySoundEnabled]=useState(()=>localStorage.getItem("anp_key_sound")!=="off");
  const defaultSmartNotif={deposit:true,unusual:true,security:true,weekly:false,failed:true};
  const [smartNotif,setSmartNotif]=useState<{deposit:boolean;unusual:boolean;security:boolean;weekly:boolean;failed:boolean}>(()=>{try{return JSON.parse(localStorage.getItem("anp_smart_notif_settings")||"null")||defaultSmartNotif;}catch{return defaultSmartNotif;}});
  const toggleSmartNotif=(key:keyof typeof smartNotif)=>{const next={...smartNotif,[key]:!smartNotif[key]};setSmartNotif(next);localStorage.setItem("anp_smart_notif_settings",JSON.stringify(next));};
  const [fontScale,setFontScaleState]=useState(()=>Number(localStorage.getItem("anp_font_scale")||"0"));
  const [logoutConfirm,setLogoutConfirm]=useState(false);
  const toggleNotifications=()=>setNotifications(v=>{const next=!v;localStorage.setItem(`anp_notifications_${user.uid}`,next?"on":"off");if(next)playChime();return next});
  const toggleKeySound=()=>setKeySoundEnabled(v=>{const next=!v;localStorage.setItem("anp_key_sound",next?"on":"off");return next});
  const setFontScale=(n:number)=>{setFontScaleState(n);localStorage.setItem("anp_font_scale",String(n));const root=document.getElementById("root");if(root)root.style.zoom=n===0?"":String(1+n*0.07);};
  const initials=(user.name?.[0]??"")+(user.family?.[0]??"")||"؟";

  if(modal==="info")return <div className="anp-full-page" dir="rtl"><div className="anp-page-header"><button className="back-btn" onClick={()=>setModal(null)}><Icon name="arrow" size={20}/></button><h2 className="subscreen-title">اطلاعات شخصی</h2><div style={{width:36}}/></div><div className="anp-page-body">{[["نام",user.name||"—"],["نام خانوادگی",user.family||"—"],["کد ملی",user.nationalId?toFaDigits(user.nationalId):"—"],["تاریخ تولد",user.birthDate?toFaDigits(user.birthDate):"—"],["موبایل",toFaDigits(user.phone)],["عضویت",user.registeredAt?new Date(user.registeredAt).toLocaleDateString("fa-IR"):"—"]].map(([k,v])=><div key={k} className="modal-detail"><span>{k}</span><b dir="ltr">{v}</b></div>)}<button className="primary-button" style={{marginTop:20}} onClick={()=>setModal(null)}>بازگشت</button></div></div>;

  if(modal==="addcard")return <div className="anp-full-page" dir="rtl"><div className="anp-page-header"><button className="back-btn" onClick={()=>setModal(null)}><Icon name="arrow" size={20}/></button><h2 className="subscreen-title">کارت‌های بانکی</h2><div style={{width:36}}/></div><div className="anp-page-body">{user.cards.length===0&&<p style={{textAlign:"center",color:"var(--text-faint)",padding:"20px 0"}}>کارتی ثبت نشده است.</p>}{user.cards.map(c=>{const binfo=getBankInfo(c.bank);const bgColor=binfo?.color||"#1d3a2e";return <div key={c.id} style={{borderRadius:18,padding:"18px 20px",marginBottom:12,background:`linear-gradient(135deg,${bgColor}ee,${bgColor}aa)`,color:"#fff",direction:"ltr",position:"relative",overflow:"hidden",minHeight:120,display:"flex",flexDirection:"column",justifyContent:"space-between",boxShadow:"0 4px 20px rgba(0,0,0,0.35)"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>{binfo?.logo?<div style={{width:40,height:40,borderRadius:10,background:"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",backdropFilter:"blur(4px)"}}><img src={binfo.logo} alt={c.bank} style={{width:"80%",height:"80%",objectFit:"contain"}}/></div>:<div style={{width:40,height:40,borderRadius:10,background:"rgba(255,255,255,0.18)"}}/>}<div style={{width:32,height:24,borderRadius:4,background:"linear-gradient(135deg,#d4a94b,#f5dd8a)",opacity:0.85}}/></div><div style={{fontFamily:"Vazirmatn,sans-serif",fontSize:16,letterSpacing:2,color:"rgba(255,255,255,0.95)",textShadow:"0 1px 3px rgba(0,0,0,0.4)",marginTop:12,direction:"ltr"}}>{toFaDigits(c.number.replace(/(.{4})/g,"$1 ").trim())}</div><div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginTop:10}}><div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.9)",fontFamily:"Vazirmatn",direction:"rtl",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>{c.holderName}</div><div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2}}>{c.expM&&c.expY&&<div style={{fontSize:10,opacity:0.65,fontFamily:"Vazirmatn,sans-serif",direction:"ltr"}}>{toFaDigits(c.expM)}/{toFaDigits(c.expY)}</div>}<div style={{fontSize:9,fontWeight:700,opacity:0.5,fontFamily:"Vazirmatn",direction:"rtl",textAlign:"right",lineHeight:1.3}}>ثبت شده در شاپرک<br/>آن پرداز</div></div></div></div>;})}<button className="outline-button" style={{width:"100%",marginBottom:10}} onClick={()=>setModal("addcard-shaparak")}>+ افزودن کارت</button><button className="primary-button" onClick={()=>setModal(null)}>بازگشت</button></div></div>;

  if(modal==="addcard-shaparak")return <ShaparkCardModal onClose={()=>setModal("addcard")}/>;
  if(modal==="support")return <SupportModal onClose={()=>setModal(null)}/>;

  if(pinModal){
    return <div className="anp-full-page" dir="rtl">
      <div className="anp-page-header">
        <button className="back-btn" onClick={()=>setPinModal(null)}><Icon name="arrow" size={20}/></button>
        <h2 className="subscreen-title">{pinModal==="enable"?"فعال‌سازی رمز":pinModal==="change"?"تغییر رمز":"غیرفعال کردن رمز"}</h2>
        <div style={{width:36}}/>
      </div>
      <div className="anp-page-body" style={{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:32,gap:20}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:"rgba(0,214,176,0.12)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#00D6B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)",textAlign:"center"}}>{pinStepLabel()}</div>
        <div style={{display:"flex",gap:14,marginBottom:8}}>
          {[0,1,2,3].map(i=><div key={i} style={{width:16,height:16,borderRadius:"50%",background:pinInput.length>i?"#00D6B0":"var(--border-color)",border:"2px solid",borderColor:pinInput.length>i?"#00D6B0":"var(--border-color)",transition:"all .2s"}}/>)}
        </div>
        {pinError&&<div style={{fontSize:13,color:"#ef4444",textAlign:"center",padding:"8px 16px",background:"rgba(239,68,68,0.08)",borderRadius:10}}>{pinError}</div>}
        <div dir="ltr" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,width:"100%",maxWidth:280}}>
          {["۱","۲","۳","۴","۵","۶","۷","۸","۹","","۰","⌫"].map((d,i)=>(
            <button key={i} onClick={()=>{if(d==="⌫")setPinInput(p=>p.slice(0,-1));else if(d)handlePinDigit(String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));}} disabled={!d} style={{height:60,borderRadius:16,border:"1.5px solid var(--border-color)",background:d?"var(--card-bg2)":"transparent",fontSize:20,fontWeight:700,color:"var(--text-primary)",cursor:d?"pointer":"default",fontFamily:"Vazirmatn",display:"flex",alignItems:"center",justifyContent:"center",opacity:d?1:0}}>
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>;
  }

  if(modal==="settings")return <div className="anp-full-page" dir="rtl"><div className="anp-page-header"><button className="back-btn" onClick={()=>setModal(null)}><Icon name="arrow" size={20}/></button><h2 className="subscreen-title">تنظیمات</h2><div style={{width:36}}/></div><div className="anp-page-body"><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 0",borderBottom:"1px solid var(--border-lighter)"}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:40,height:40,borderRadius:12,background:lightTheme?"rgba(245,194,61,0.15)":"rgba(100,116,139,0.15)",display:"flex",alignItems:"center",justifyContent:"center",color:lightTheme?"#f5c23d":"#64748b"}}><Icon name={lightTheme?"sun":"moon"} size={18}/></div><div><div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>تم {lightTheme?"روشن":"تاریک"}</div><div style={{fontSize:11,color:"var(--text-muted)"}}>تغییر ظاهر برنامه</div></div></div><button onClick={()=>setLightTheme(!lightTheme)} style={{background:"none",border:"none",cursor:"pointer"}}><div style={{width:52,height:28,borderRadius:14,background:lightTheme?"#f5c23d":"#2a2a2a",position:"relative",transition:"background 0.2s",border:"1px solid var(--border-color)"}}><div style={{position:"absolute",top:3,width:22,height:22,borderRadius:"50%",background:"#fff",transition:"all 0.25s",left:lightTheme?27:3,boxShadow:"0 1px 4px rgba(0,0,0,0.25)"}}/></div></button></div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 0",borderBottom:"1px solid var(--border-lighter)"}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:40,height:40,borderRadius:12,background:"rgba(74,158,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"#4a9eff"}}><Icon name="bell" size={18}/></div><div><div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>اعلان‌ها</div><div style={{fontSize:11,color:"var(--text-muted)"}}>دریافت اعلانات مهم</div></div></div><button aria-label="فعال یا غیرفعال کردن اعلان‌ها" onClick={toggleNotifications} style={{width:52,height:28,borderRadius:14,background:notifications?"#00D6B0":"var(--card-bg3)",position:"relative",border:"1px solid var(--border-color)",cursor:"pointer"}}><div style={{position:"absolute",top:3,right:notifications?3:27,width:22,height:22,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.2)",transition:"right .2s"}}/></button></div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 0",borderBottom:"1px solid var(--border-lighter)"}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:40,height:40,borderRadius:12,background:"rgba(0,214,176,0.12)",display:"flex",alignItems:"center",justifyContent:"center",color:"#00D6B0"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8"/></svg></div><div><div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>صدای کیبورد</div><div style={{fontSize:11,color:"var(--text-muted)"}}>{keySoundEnabled?"صدا فعال است":"صدا غیرفعال است"}</div></div></div><button aria-label="فعال یا غیرفعال کردن صدای کیبورد" onClick={toggleKeySound} style={{width:52,height:28,borderRadius:14,background:keySoundEnabled?"#00D6B0":"var(--card-bg3)",position:"relative",border:"1px solid var(--border-color)",cursor:"pointer"}}><div style={{position:"absolute",top:3,right:keySoundEnabled?3:27,width:22,height:22,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.2)",transition:"right .2s"}}/></button></div>
<div style={{padding:"16px 0",borderBottom:"1px solid var(--border-lighter)"}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><div style={{width:40,height:40,borderRadius:12,background:"rgba(0,214,176,0.12)",display:"flex",alignItems:"center",justifyContent:"center",color:"#00D6B0"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>رمز ۴ رقمی</div><div style={{fontSize:11,color:"var(--text-muted)"}}>{user.pin?"فعال — کد امنیتی ورود":"غیرفعال"}</div></div></div>{user.pin?<div style={{display:"flex",gap:8}}><button onClick={()=>handlePinOpen("change")} style={{flex:1,padding:"10px",borderRadius:12,background:"rgba(0,214,176,0.08)",border:"1.5px solid rgba(0,214,176,0.3)",color:"#00D6B0",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Vazirmatn"}}>تغییر رمز</button><button onClick={()=>handlePinOpen("disable")} style={{flex:1,padding:"10px",borderRadius:12,background:"rgba(239,68,68,0.08)",border:"1.5px solid rgba(239,68,68,0.3)",color:"#ef4444",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Vazirmatn"}}>غیرفعال کردن</button></div>:<button onClick={()=>handlePinOpen("enable")} style={{width:"100%",padding:"11px",borderRadius:12,background:"rgba(0,214,176,0.08)",border:"1.5px solid rgba(0,214,176,0.3)",color:"#00D6B0",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Vazirmatn"}}>فعال‌سازی رمز ۴ رقمی</button>}</div>
<div style={{padding:"16px 0",borderBottom:"1px solid var(--border-lighter)"}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><div style={{width:40,height:40,borderRadius:12,background:"rgba(168,85,247,0.12)",display:"flex",alignItems:"center",justifyContent:"center",color:"#a855f7"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg></div><div><div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>بزرگ‌نمایی</div><div style={{fontSize:11,color:"var(--text-muted)"}}>{fontScale===0?"اندازه پیش‌فرض":`+${fontScale} پیکسل`}</div></div></div><div style={{padding:"0 4px"}}><input type="range" min={0} max={10} step={1} value={fontScale} onChange={e=>setFontScale(Number(e.target.value))} style={{width:"100%",accentColor:"#a855f7",cursor:"pointer",height:4}}/><div style={{display:"flex",justifyContent:"space-between",marginTop:6}}><span style={{fontSize:10,color:"var(--text-muted)",fontFamily:"Vazirmatn"}}>پیش‌فرض</span><span style={{fontSize:11,fontWeight:700,color:"#a855f7",fontFamily:"Vazirmatn"}}>+{toFaDigits(String(fontScale))}</span><span style={{fontSize:10,color:"var(--text-muted)",fontFamily:"Vazirmatn"}}>+۱۰</span></div></div></div><div style={{padding:"16px 0",borderBottom:"1px solid var(--border-lighter)"}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><div style={{width:40,height:40,borderRadius:12,background:"rgba(74,158,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",color:"#4a9eff"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><circle cx="19" cy="4" r="3" fill="#4a9eff" stroke="none"/></svg></div><div><div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>اعلان‌های هوشمند</div><div style={{fontSize:11,color:"var(--text-muted)"}}>مدیریت اعلان‌های شخصی‌سازی شده</div></div></div>
{([["deposit","واریز جدید","#34d399"],["unusual","تراکنش غیرعادی","#f5c23d"],["security","هشدار امنیتی","#ef4444"],["weekly","گزارش مالی هفتگی","#a78bfa"],["failed","تراکنش ناموفق","#fb923c"]] as [keyof typeof smartNotif,string,string][]).map(([key,label,color])=><div key={key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0"}}><span style={{fontSize:13,color:"var(--text-secondary)"}}>{label}</span><button onClick={()=>toggleSmartNotif(key)} style={{width:44,height:24,borderRadius:12,background:smartNotif[key]?color:"var(--card-bg3)",position:"relative",border:"1px solid var(--border-color)",cursor:"pointer",flexShrink:0}}><div style={{position:"absolute",top:2,right:smartNotif[key]?2:22,width:20,height:20,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,0.2)",transition:"right .2s"}}/></button></div>)}
</div><button className="primary-button" style={{marginTop:12}} onClick={()=>setModal(null)}>بازگشت</button></div></div>;

  if(logoutConfirm)return <div className="anp-full-page" dir="rtl"><div className="anp-page-header"><button className="back-btn" onClick={()=>setLogoutConfirm(false)}><Icon name="arrow" size={20}/></button><h2 className="subscreen-title">خروج از حساب</h2><div style={{width:36}}/></div><div className="anp-page-body" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,paddingTop:48}}><div style={{width:64,height:64,borderRadius:"50%",background:"rgba(232,81,42,0.12)",border:"1px solid rgba(232,81,42,0.3)",display:"flex",alignItems:"center",justifyContent:"center",color:"#e8512a"}}><Icon name="log-out" size={28}/></div><div style={{fontSize:17,fontWeight:800,color:"var(--text-primary)"}}>خروج از حساب</div><p style={{fontSize:13,color:"var(--text-muted)",textAlign:"center",lineHeight:1.8,margin:0}}>آیا مطمئن هستید که می‌خواهید خارج شوید؟</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,width:"100%",maxWidth:320}}><button style={{height:48,borderRadius:14,border:"1px solid var(--border-color)",background:"var(--card-bg2)",color:"var(--text-secondary)",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Vazirmatn"}} onClick={()=>setLogoutConfirm(false)}>انصراف</button><button style={{height:48,borderRadius:14,border:"none",background:"#e8512a",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Vazirmatn"}} onClick={onLogout}>خروج</button></div></div></div>;

  return <>
    <div style={{flex:1,overflowY:"auto",padding:16}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 0 24px"}}>
        <div style={{width:80,height:80,borderRadius:"50%",background:"linear-gradient(135deg,#00D6B0,#009F8C)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:24,overflow:"hidden",marginBottom:12}}>
          {user.photo?<img src={user.photo} alt="پروفایل" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:initials}
        </div>
        <div style={{fontSize:18,fontWeight:800,color:"var(--text-primary)"}}>{(user.name+" "+user.family).trim()||"کاربر"}</div>
        <div style={{fontSize:12,color:"#00D6B0",display:"flex",alignItems:"center",gap:4,marginTop:4}}><Icon name="check" size={12}/>احراز هویت شده</div>
      </div>
      <div className="profile-menu">
        {[{icon:"user",label:"اطلاعات شخصی",action:"info"},{icon:"credit",label:"کارت‌های بانکی",action:"addcard"},{icon:"settings",label:"تنظیمات",action:"settings"},{icon:"phone",label:"پشتیبانی",action:"support"}].map((item,i)=><button key={item.label} className="profile-menu-item" style={{borderBottom:i<3?"1px solid var(--border-lighter)":"none"}} onClick={()=>setModal(item.action as any)}>
          <div style={{display:"flex",alignItems:"center",gap:12,color:"var(--text-primary)"}}><Icon name={item.icon} size={18}/>{item.label}</div>
          <Icon name="arrow-left" size={16}/>
        </button>)}
        <button className="profile-menu-item danger" style={{borderTop:"1px solid var(--border-lighter)"}} onClick={()=>setLogoutConfirm(true)}>
          <div style={{display:"flex",alignItems:"center",gap:12}}><Icon name="log-out" size={18}/>خروج از حساب</div>
        </button>
      </div>
    </div>
  </>;
}

// ─── Tx Logo Helper ───────────────────────────────────────────────────────────
function getTxLogo(tx:TxRecord,cards:BankCard[]):{img?:string;color:string;letter:string;svgIcon?:ReactNode}{
  const note=tx.note||"";
  if(note.includes("ایرانسل")||note.includes("irancell"))return{img:logoIrancell as string,color:"#1a1a1a",letter:"ا"};
  if(note.includes("همراه اول")||note.includes("mci"))return{img:logoHamrahAval as string,color:"#009870",letter:"ه"};
  if(note.includes("رایتل")||note.includes("rightel"))return{img:logoRightel as string,color:"#9C27B0",letter:"ر"};
  // Bill types
  if(note.includes("قبض آب")||note.includes("آب و فاضلاب"))return{color:"#006aba",letter:"آ",svgIcon:<svg viewBox="0 0 48 48" width={24} height={24}><path d="M24 10C24 10 13 23 13 29C13 35.1 17.9 40 24 40C30.1 40 35 35.1 35 29C35 23 24 10 24 10Z" fill="#fff" opacity="0.9"/></svg>};
  if(note.includes("قبض برق")||note.includes("توزیع برق"))return{color:"#f5a500",letter:"ب",svgIcon:<svg viewBox="0 0 48 48" width={24} height={24}><path d="M27 8L15 26L22 26L19 40L33 22L26 22Z" fill="#cc0000"/></svg>};
  if(note.includes("قبض گاز")||note.includes("شرکت گاز"))return{color:"#003087",letter:"گ",svgIcon:<svg viewBox="0 0 48 48" width={24} height={24}><path d="M24 8C22 12 17 17 17 23C17 29 20 33 24 35C28 33 31 29 31 23C31 17 26 12 24 8Z" fill="#fff" opacity="0.9"/></svg>};
  if(note.includes("قبض مخابرات")||note.includes("مخابرات"))return{color:"#505a64",letter:"م",svgIcon:<svg viewBox="0 0 48 48" width={24} height={24}><circle cx="24" cy="32" r="3" fill="#fff"/><path d="M17 26C17 22.1 20.1 19 24 19C27.9 19 31 22.1 31 26" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M11 21C11 14.4 16.9 9 24 9C31.1 9 37 14.4 37 21" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round"/></svg>};
  if(note.includes("ثبت اسناد")||note.includes("ثبت‌اسناد"))return{color:"#64748b",letter:"ث",svgIcon:<svg viewBox="0 0 48 48" width={24} height={24}><path d="M14 8h20v32H14z" fill="#fff" opacity="0.15"/><path d="M14 8h14l6 6v26H14z" fill="#fff" opacity="0.9"/><path d="M28 8v6h6" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/><line x1="18" y1="20" x2="30" y2="20" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/><line x1="18" y1="25" x2="30" y2="25" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/><line x1="18" y1="30" x2="25" y2="30" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/></svg>};
  if(note.includes("خلافی خودرو")||note.includes("خلافی"))return{color:"#c62828",letter:"خ",svgIcon:<svg viewBox="0 0 48 48" width={24} height={24}><rect x="6" y="20" width="36" height="16" rx="5" fill="#fff" opacity="0.9"/><rect x="12" y="14" width="24" height="10" rx="3" fill="#fff" opacity="0.7"/><circle cx="14" cy="36" r="4" fill="#c62828"/><circle cx="34" cy="36" r="4" fill="#c62828"/><circle cx="14" cy="36" r="2" fill="#fff"/><circle cx="34" cy="36" r="2" fill="#fff"/></svg>};
  if(note.includes("نیکوکاری")||note.includes("خیریه"))return{color:"#e91e8c",letter:"ن",svgIcon:<svg viewBox="0 0 48 48" width={24} height={24}><path d="M24 38C24 38 8 28 8 18C8 13.6 11.6 10 16 10C19 10 21.6 11.6 24 14C26.4 11.6 29 10 32 10C36.4 10 40 13.6 40 18C40 28 24 38 24 38Z" fill="#fff" opacity="0.9"/></svg>};
  if(note.includes("قبض قضائیه")||note.includes("قضایی"))return{color:"#37474f",letter:"ق",svgIcon:<svg viewBox="0 0 36 36" width={24} height={24}><line x1="18" y1="6" x2="18" y2="30" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="11" x2="28" y2="11" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/><line x1="10" y1="11" x2="10" y2="20" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.85"/><line x1="26" y1="11" x2="26" y2="20" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.85"/><path d="M6 20 Q10 23 14 20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><path d="M22 20 Q26 23 30 20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><line x1="14" y1="30" x2="22" y2="30" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/><circle cx="18" cy="6" r="2" fill="#fff" opacity="0.9"/></svg>};
  if(note.includes("ربات فارکس")||note.includes("فارکس"))return{color:"#00695c",letter:"ف"};
  // For transfers/services: find source bank
  if(tx.type==="transfer"||tx.type==="service"){
    // First: use fromCard ID to find the exact source card
    if(tx.fromCard){
      const srcCard=cards.find(c=>c.id===tx.fromCard);
      if(srcCard){const info=getBankInfo(srcCard.bank);if(info)return{img:info.logo,color:info.color,letter:info.abbr};}
    }
    // Second: check user's source card by last 4 digits in note
    const srcCardByNum=cards.find(c=>note.includes(c.number.slice(-4)));
    if(srcCardByNum){const info=getBankInfo(srcCardByNum.bank);if(info)return{img:info.logo,color:info.color,letter:info.abbr};}
    // Third: find bank name in note (e.g. "بانک ملت · ...")
    const bankKeys=Object.keys(BANK_THEME);
    const foundBank=bankKeys.find(k=>note.startsWith(k)||note.includes(" · "+k)||note.includes(k+" · "));
    if(foundBank){const info=BANK_THEME[foundBank];return{img:info.logo,color:info.color,letter:info.abbr};}
    // Fourth: any bank name mention in note
    const anyBank=bankKeys.find(k=>note.includes(k)||note.includes(k.replace("بانک ","")));
    if(anyBank){const info=BANK_THEME[anyBank];return{img:info.logo,color:info.color,letter:info.abbr};}
  }
  if(tx.type==="swap")return{color:"#00D6B0",letter:"ت"};
  if(tx.type==="deposit")return{color:"#2196F3",letter:"و"};
  if(tx.type==="withdraw")return{color:"#FF9800",letter:"ب"};
  return{color:"#536773",letter:"؟"};
}

// ─── Unified Transaction Icon System ─────────────────────────────────────────
function getTxIconData(tx:TxRecord):{id:string;color:string;bg:string}{
  const note=tx.note||"";
  if(tx.type==="deposit"&&note.startsWith("بازگشت هزینه · برداشت"))return{id:"cashback",color:"#f59e0b",bg:"rgba(245,158,11,0.12)"};
  if(tx.type==="deposit")return{id:"deposit",color:"#00D6B0",bg:"rgba(0,214,176,0.12)"};
  if(tx.type==="withdraw")return{id:"withdraw",color:"#fb923c",bg:"rgba(251,146,60,0.12)"};
  if(tx.type==="swap")return{id:"exchange",color:"#a78bfa",bg:"rgba(167,139,250,0.12)"};
  if(note.includes("بسته اینترنت"))
    return{id:"internet",color:"#38bdf8",bg:"rgba(56,189,248,0.12)"};
  if(note.includes("شارژ")||note.includes("ایرانسل")||note.includes("همراه اول")||note.includes("رایتل")||note.includes("irancell")||note.includes("mci"))
    return{id:"charge",color:"#34d399",bg:"rgba(52,211,153,0.12)"};
  if(note.includes("بسته")||note.includes("اینترنت"))
    return{id:"internet",color:"#38bdf8",bg:"rgba(56,189,248,0.12)"};
  if(note.includes("نیکوکاری")||note.includes("خیریه"))
    return{id:"charity",color:"#f472b6",bg:"rgba(244,114,182,0.12)"};
  if(note.includes("بیمه ثالث"))return{id:"third-party-ins",color:"#3b82f6",bg:"rgba(59,130,246,0.12)"};
  if(note.includes("بیمه بدنه"))return{id:"body-ins",color:"#6366f1",bg:"rgba(99,102,241,0.12)"};
  if(note.includes("بیمه موتور"))return{id:"moto-ins",color:"#4a9eff",bg:"rgba(74,158,255,0.12)"};
  if(note.includes("خلافی"))return{id:"violations",color:"#a855f7",bg:"rgba(168,85,247,0.12)"};
  if(note.includes("عوارض آزادراه"))return{id:"freeway",color:"#a855f7",bg:"rgba(168,85,247,0.10)"};
  if(note.includes("طرح ترافیک"))return{id:"tehran-traffic",color:"#9333ea",bg:"rgba(147,51,234,0.12)"};
  if(note.includes("قضائیه")||note.includes("قضایی"))return{id:"judiciary-bill",color:"#64748b",bg:"rgba(100,116,139,0.12)"};
  if(note.includes("ثبت اسناد"))return{id:"property-reg",color:"#64748b",bg:"rgba(100,116,139,0.10)"};
  if(note.includes("قبض"))return{id:"bills",color:"#fb923c",bg:"rgba(251,146,60,0.12)"};
  if(tx.type==="transfer")return{id:"transfer",color:"#4a9eff",bg:"rgba(74,158,255,0.12)"};
  return{id:"bills",color:"#64748b",bg:"rgba(100,116,139,0.12)"};
}

function TxIcon({tx}:{tx:TxRecord}){
  const{id,color,bg}=getTxIconData(tx);
  const s={width:22,height:22,fill:"none",stroke:color,strokeWidth:2,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
  let icon:React.ReactNode=null;
  if(id==="deposit")icon=<svg {...s} viewBox="0 0 24 24"><path d="M12 19V5"/><polyline points="5 12 12 19 19 12"/><path d="M5 21h14"/></svg>;
  else if(id==="withdraw")icon=<svg {...s} viewBox="0 0 24 24"><path d="M12 5v14"/><polyline points="19 12 12 5 5 12"/><path d="M5 21h14"/></svg>;
  else if(id==="cashback")icon=<svg {...s} viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>;
  else icon=<ServiceIcon id={id} color={color} size={22}/>;
  return(
    <div style={{width:44,height:44,borderRadius:14,background:bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      {icon}
    </div>
  );
}

function getTxDescription(tx:TxRecord):string{
  const note=tx.note||"";
  if(tx.type==="deposit"&&note.startsWith("بازگشت هزینه · برداشت"))return "برداشت بازگشت هزینه";
  if(tx.type==="deposit")return "واریز به حساب";
  if(tx.type==="withdraw")return "برداشت از حساب";
  if(tx.type==="swap")return "تبدیل دارایی انجام شد";
  if(note.includes("قبض ایرانسل"))return "قبض ایرانسل پرداخت شد";
  if(note.includes("قبض مخابرات")||note.includes("مخابرات"))return "قبض مخابرات پرداخت شد";
  if(note.includes("شارژ ایرانسل")||note.includes("ایرانسل"))return "سیم کارت شارژ شد";
  if(note.includes("شارژ همراه")||note.includes("همراه اول"))return "سیم کارت شارژ شد";
  if(note.includes("رایتل"))return "سیم کارت شارژ شد";
  if(note.includes("شارژ"))return "سیم کارت شارژ شد";
  if(note.includes("بسته")||note.includes("اینترنت"))return "بسته نت خریداری شد";
  if(note.includes("قبض آب")||note.includes("آب و فاضلاب"))return "قبض آب پرداخت شد";
  if(note.includes("قبض برق")||note.includes("توزیع برق"))return "قبض برق پرداخت شد";
  if(note.includes("قبض گاز")||note.includes("شرکت گاز"))return "قبض گاز پرداخت شد";
  if(note.includes("نیکوکاری")||note.includes("خیریه"))return "نیکوکاری پرداخت شد";
  if(note.includes("بیمه ثالث"))return "بیمه ثالث پرداخت شد";
  if(note.includes("بیمه بدنه"))return "بیمه بدنه پرداخت شد";
  if(note.includes("بیمه موتور"))return "بیمه موتور پرداخت شد";
  if(note.includes("خلافی"))return "خلافی خودرو پرداخت شد";
  if(note.includes("عوارض آزادراه"))return "عوارض آزادراه پرداخت شد";
  if(note.includes("طرح ترافیک"))return "طرح ترافیک پرداخت شد";
  if(note.includes("قضائیه")||note.includes("قضایی"))return "قبض قضائیه پرداخت شد";
  if(note.includes("ثبت اسناد"))return "قبض ثبت اسناد پرداخت شد";
  if(note.includes("قبض"))return "قبض پرداخت شد";
  if(tx.type==="transfer")return "انتقال وجه انجام شد";
  return note.split(" · ")[0]||"خدمات";
}

// ─── History Page ─────────────────────────────────────────────────────────────
function HistoryPage({transactions,cards}:{transactions:TxRecord[];cards:BankCard[]}){
  const [filter,setFilter]=useState("همه");const [selected,setSelected]=useState<TxRecord|null>(null);
  const [cardFilter,setCardFilter]=useState("همه"); // "همه" or a card id
  const [cardPickerOpen,setCardPickerOpen]=useState(false);
  const filters=["همه","انتقال","واریز","خدمات"];const typeMap:Record<string,string>={انتقال:"transfer",واریز:"deposit",خدمات:"service"};
  const allNonExchange=transactions.filter(t=>t.source==="app"||(t.source==null&&!t.note?.includes("[صرافی]")&&!(t.note?.includes("ربات فارکس")&&t.note?.includes("تخصیص"))&&t.source!=="exchange"));
  // Match by exact card id stored in fromCard field
  const cardFiltered=cardFilter==="همه"?allNonExchange:allNonExchange.filter(t=>t.fromCard===cardFilter);
  const filtered=filter==="همه"?cardFiltered:cardFiltered.filter(t=>t.type===typeMap[filter]);
  const typeLabel:Record<string,string>={swap:"تبدیل دارایی",transfer:"انتقال",deposit:"واریز",withdraw:"برداشت",service:"خدمات"};
  const iconMap:Record<string,string>={swap:"swap",transfer:"send",deposit:"plus",withdraw:"send",service:"receipt"};
  const colorMap:Record<string,string>={swap:"#4a9eff",transfer:"#f5a623",deposit:"#00D6B0",withdraw:"#e85c5c",service:"#34d399"};
  const activeCard=cards.find(c=>c.id===cardFilter);
  const cardLabel=activeCard?`${activeCard.bank} ${toFaDigits(activeCard.number.slice(-4))}`:"از تمام کارت‌ها";
  return <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
    <div style={{padding:"14px 16px 8px",flexShrink:0}}>
      <div style={{fontSize:18,fontWeight:800,color:"var(--text-primary)",marginBottom:4}}>تراکنش‌های شما</div>
      <div style={{fontSize:12,color:"var(--text-muted)"}}>پیگیری آسان تمام فعالیت‌ها</div>
    </div>
    {/* Card filter button — only rendered when user has cards */}
    {cards.length>0&&<div style={{padding:"0 16px 6px",flexShrink:0}}>
      <button onClick={()=>setCardPickerOpen(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 14px",borderRadius:12,background:cardFilter!=="همه"?"rgba(0,214,176,0.10)":"var(--card-bg2)",border:`1.5px solid ${cardFilter!=="همه"?"rgba(0,214,176,0.45)":"var(--border-color)"}`,color:cardFilter!=="همه"?"var(--accent)":"var(--text-secondary)",fontFamily:"Vazirmatn",fontSize:13,fontWeight:600,cursor:"pointer",width:"100%",justifyContent:"space-between",boxSizing:"border-box"}}>
        <span style={{display:"flex",alignItems:"center",gap:7}}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          {cardLabel}
        </span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
    </div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,padding:"0 16px 12px",flexShrink:0}}>
      {filters.map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"8px 2px",borderRadius:10,background:filter===f?"#00D6B0":"var(--card-bg)",color:filter===f?"#000":"var(--text-muted)",border:`1px solid ${filter===f?"#00D6B0":"var(--border-color)"}`,cursor:"pointer",fontSize:13,fontWeight:filter===f?700:400,fontFamily:"Vazirmatn"}}>{f}</button>)}
    </div>
    {/* Card picker overlay */}
    {cardPickerOpen&&<div style={{position:"fixed",inset:0,zIndex:300,display:"flex",flexDirection:"column",justifyContent:"flex-end",background:"rgba(0,0,0,0.45)"}} onClick={()=>setCardPickerOpen(false)}>
      <div style={{background:"var(--card-bg)",borderRadius:"20px 20px 0 0",padding:"20px 16px 32px",boxShadow:"0 -4px 32px rgba(0,0,0,0.2)"}} onClick={e=>e.stopPropagation()} dir="rtl">
        <div style={{width:40,height:4,borderRadius:2,background:"var(--border-color)",margin:"0 auto 18px"}}/>
        <div style={{fontSize:15,fontWeight:800,color:"var(--text-primary)",marginBottom:14}}>فیلتر بر اساس کارت</div>
        {[{id:"همه",label:"از تمام کارت‌ها",sub:""} as {id:string;label:string;sub:string},...cards.map(c=>({id:c.id,label:`${c.bank} ${toFaDigits(c.number.slice(-4))}`,sub:c.holderName||""}))].map(opt=>{const active=cardFilter===opt.id;return <button key={opt.id} onClick={()=>{setCardFilter(opt.id);setCardPickerOpen(false);}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"14px 12px",borderRadius:12,marginBottom:6,background:active?"rgba(0,214,176,0.10)":"transparent",border:`1px solid ${active?"rgba(0,214,176,0.4)":"var(--border-faint,rgba(255,255,255,0.06))"}`,color:active?"var(--accent)":"var(--text-primary)",fontFamily:"Vazirmatn",fontSize:14,fontWeight:active?700:500,cursor:"pointer",textAlign:"right",boxSizing:"border-box"}}>
          <span style={{display:"flex",flexDirection:"column",gap:2,textAlign:"right"}}>
            <span>{opt.label}</span>
            {opt.sub&&<span style={{fontSize:11,color:"var(--text-muted)",fontWeight:400}}>{opt.sub}</span>}
          </span>
          {active&&<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>}
        </button>;})}
      </div>
    </div>}
    <div style={{flex:1,overflowY:"auto",padding:"0 16px"}}>
      {filtered.length===0?<p style={{textAlign:"center",color:"var(--text-faint)",padding:"40px 0",fontSize:13}}>تراکنشی یافت نشد.</p>:filtered.map(tx=>{
        const dt=new Date(tx.createdAt);
        const amtColor=tx.type==="deposit"?"#00D6B0":tx.type==="withdraw"?"#fb923c":tx.status==="pending"?"#f5c23d":"var(--text-muted)";
        const amtText=tx.status==="pending"?"در انتظار":(tx.type==="service"||tx.type==="transfer")?<span style={{color:"#34d399",fontSize:12,fontWeight:700}}>موفق ✓</span>:`${faFixed(tx.amount,tx.fromAsset==="toman"?0:2)} ${tx.fromAsset==="toman"?"ریال":"دلار تتر"}`;
        return <div key={tx.id} className="tx-item" onClick={()=>setSelected(tx)}>
          <TxIcon tx={tx}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{getTxDescription(tx)}</div>
            <div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>{dt.toLocaleDateString("fa-IR")} · {dt.toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit"})}</div>
          </div>
          <div style={{textAlign:"left",fontWeight:700,fontSize:13,color:amtColor,flexShrink:0}}>{amtText}</div>
        </div>;
      })}
    </div>
    {selected&&<TxModal tx={selected} onClose={()=>setSelected(null)} isHistory={true}/>}
  </div>;
}

// ─── Card Balance Screen ──────────────────────────────────────────────────────
// ─── Shaparak Card Registration Modal ────────────────────────────────────────
function ShaparkCardModal({onClose}:{onClose:()=>void}){
  useBackHandler(onClose);
  return <div className="anp-full-page" dir="rtl">
    <div className="anp-page-header">
      <button className="back-btn" onClick={onClose}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">افزودن کارت بانکی</h2>
      <div style={{width:36}}/>
    </div>
    <div className="anp-page-body">
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{width:72,height:72,borderRadius:20,background:"rgba(0,214,176,0.12)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}><Icon name="credit" size={32} stroke={1.5}/></div>
        <h3 style={{margin:0,fontSize:19,fontWeight:800,color:"var(--text-primary)"}}>ثبت کارت در شاپرک</h3>
      </div>
      <p style={{fontSize:13,color:"var(--text-muted)",textAlign:"right",lineHeight:2,marginBottom:24,direction:"rtl"}}>
        با توجه به دستورالعمل بانک مرکزی، بانک شما به سامانه هاب شاپرک اضافه گردیده است. لازم است که ابتدا اطلاعات کارت بانکی خود را در این سامانه ثبت کنید. بعد از ثبت می توانید به برنامه آن پرداز بازگردید و تراکنش را ادامه دهید.
      </p>
      <button className="primary-button" style={{width:"100%",marginBottom:10}}
        onClick={()=>window.open("https://tsm.shaparak.ir/cardManagement/enrollment.html?tid=a94a717e-a56e-42c7-b53f-81d2e997d2c1","_blank")}>
        ثبت کارت در شاپرک
      </button>
      <button className="outline-button" style={{width:"100%"}} onClick={onClose}>بازگشت</button>
    </div>
  </div>;
}

// ─── FinField ─────────────────────────────────────────────────────────────────
// Unified payment field: floating RTL label + eye toggle (right) + paste (left).
// Stores Persian digits. 34px large font for weak-eyesight accessibility.
function FinField({label,value,onChange,maxLength,inputRef,onFilled,showPaste=true}:{
  label:string;value:string;onChange:(v:string)=>void;maxLength:number;
  inputRef?:React.RefObject<HTMLInputElement|null>;onFilled?:()=>void;showPaste?:boolean;
}){
  const [focused,setFocused]=useState(false);
  const [shown,setShown]=useState(false);
  const [flash,setFlash]=useState(false);
  const raised=focused||value.length>0;
  const [pasteErr,setPasteErr]=useState(false);
  const handlePaste=async()=>{
    try{
      const t=await navigator.clipboard.readText();
      const v=toFaDigits(toLatinDigits(t).replace(/\D/g,"").slice(0,maxLength));
      onChange(v);
      if(v.length===0)setShown(false);
      setFlash(true);setTimeout(()=>setFlash(false),600);
      if(toLatinDigits(v).length===maxLength&&onFilled)onFilled();
    }catch{
      setPasteErr(true);setTimeout(()=>setPasteErr(false),2000);
    }
  };
  return(
    <div className={`fin-wrap${raised?" fin-raised":""}${focused?" fin-focused":""}`}>
      <label className="fin-label">{label}</label>
      <input ref={inputRef} className="fin-input" dir="ltr"
        type={shown?"text":"password"} inputMode="numeric"
        maxLength={maxLength} autoComplete="new-password" value={value}
        onFocus={()=>setFocused(true)}
        onBlur={()=>setFocused(false)}
        onChange={e=>{
          const v=toFaDigits(toLatinDigits(e.target.value).replace(/\D/g,"").slice(0,maxLength));
          onChange(v);
          if(v.length===0)setShown(false);
          if(toLatinDigits(v).length===maxLength&&onFilled)onFilled();
        }}
        placeholder=""/>
      {value.length>0&&(
        <button type="button" className="fin-eye-btn" onClick={()=>setShown(s=>!s)} tabIndex={-1} aria-label={shown?"پنهان کردن":"نمایش"}>
          {shown?(
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          ):(
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          )}
        </button>
      )}
      {showPaste&&(
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:48,zIndex:3}}>
          <button type="button" className={`fin-paste-btn${flash?" fin-paste-flash":""}`}
            onClick={handlePaste} aria-label="الصاق از کلیپ‌بورد" tabIndex={-1} style={{width:"100%",height:"100%"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          {pasteErr&&<div className="fin-paste-err">دسترسی به کلیپ‌بورد ممکن نیست</div>}
        </div>
      )}
    </div>
  );
}

// ─── FinExpField ───────────────────────────────────────────────────────────────
// Expiry (ماه/سال): floating RTL label, always masked, no eye, no paste. 34px font.
function FinExpField({label,value,onChange,inputRef,maxLength,onFilled}:{
  label:string;value:string;onChange:(v:string)=>void;
  inputRef?:React.RefObject<HTMLInputElement|null>;maxLength:number;onFilled?:()=>void;
}){
  const [focused,setFocused]=useState(false);
  const raised=focused||value.length>0;
  return(
    <div className={`fin-exp-field${raised?" fin-raised":""}${focused?" fin-focused":""}`}>
      <label className="fin-exp-label">{label}</label>
      <input ref={inputRef} className="fin-exp-input" dir="ltr"
        type="password" inputMode="numeric"
        maxLength={maxLength} autoComplete="new-password" value={value}
        onFocus={()=>setFocused(true)}
        onBlur={()=>setFocused(false)}
        onChange={e=>{
          const v=toFaDigits(toLatinDigits(e.target.value).replace(/\D/g,"").slice(0,maxLength));
          onChange(v);
          if(toLatinDigits(v).length===maxLength&&onFilled)onFilled();
        }}
        placeholder=""/>
    </div>
  );
}

function CardBalanceScreen({user,onBack,onDone}:{user:UserData;onBack:()=>void;onDone:()=>void}){
  const [selectedCardId,setSelectedCardId]=useState("");
  const [cardPickerOpen,setCardPickerOpen]=useState(false);
  const [manualNum,setManualNum]=useState("");
  // Sensitive fields stored as Persian digits; browser masks them as • via type="password"
  const [otp,setOtp]=useState("");
  const [cvv2,setCvv2]=useState("");
  const [expM,setExpM]=useState("");
  const [expY,setExpY]=useState("");
  const cvv2Ref=useRef<HTMLInputElement>(null);
  const expMRef=useRef<HTMLInputElement>(null);
  const expYRef=useRef<HTMLInputElement>(null);
  const [processing,setProcessing]=useState(false);
  const [receipt,setReceipt]=useState<ReceiptData|null>(null);
  const [err,setErr]=useState("");
  const [showShaparak,setShowShaparak]=useState(false);

  const selCard=user.cards.find(c=>c.id===selectedCardId);
  const fmtCardInput=(v:string)=>v.replace(/\D/g,"").slice(0,16).replace(/(.{4})(?=.)/g,"$1 ");
  const activeRaw=selCard?selCard.number:manualNum.replace(/\s/g,"");
  const cardBank=activeRaw.length>=4?detectBank(activeRaw):"";

  const resetSensitive=()=>{setOtp("");setCvv2("");setExpM("");setExpY("")};
  const allFilled=activeRaw.length===16&&toLatinDigits(otp).length===5&&toLatinDigits(cvv2).length===3&&toLatinDigits(expM).length===2&&toLatinDigits(expY).length===2;

  const submit=()=>{
    if(activeRaw.length!==16){setErr("لطفاً کارت بانکی را انتخاب کنید.");return}
    if(!otp){setErr("رمز پویا را وارد کنید.");return}
    if(!cvv2){setErr("CVV2 را وارد کنید.");return}
    if(!expM){setErr("ماه انقضا را وارد کنید.");return}
    if(!expY){setErr("سال انقضا را وارد کنید.");return}
    const month=Number(toLatinDigits(expM));
    if(month<1||month>12){setErr("ماه انقضا باید بین ۱ تا ۱۲ باشد.");return}
    setErr("");setProcessing(true);
    setTimeout(()=>{
      setProcessing(false);
      const fake=Math.floor(Math.random()*50000000+5000000);
      resetSensitive();
      setReceipt({title:"موجودی کارت",amount:`${fa(fake)} ریال`,destination:toFaDigits(fmtCard(activeRaw)),status:"success",detail:"موجودی لحظه‌ای با موفقیت دریافت شد."});
    },2500);
  };

  return <>
  <div className="subscreen" dir="rtl">
    <div className="subscreen-header">
      <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">موجودی کارت</h2>
      <div style={{width:36}}/>
    </div>
    <div className="subscreen-body">
      <div className="banking-form cb-form">

        {/* ── انتخاب کارت ── */}
        <button className="cb-card-selector" onClick={()=>setCardPickerOpen(true)} type="button">
            {selCard?(
              <div className="cb-card-sel-inner">
                <BankLogo bankName={selCard.bank} size={38} rounded={11}/>
                <div className="cb-card-sel-text">
                  <span className="cb-card-bank-name">{selCard.bank}</span>
                  <span className="cb-card-num-large" dir="ltr">{toFaDigits(fmtCard(selCard.number))}</span>
                </div>
                <div className="cb-card-sel-chevron">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            ):(
              <div className="cb-card-sel-inner">
                <div className="cb-card-icon-empty">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/></svg>
                </div>
                <span className="cb-card-placeholder-text">انتخاب کارت بانکی</span>
                <div className="cb-card-sel-chevron">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            )}
          </button>

        {/* ── رمز پویا ── */}
        <div className="fin-otp-row">
          <FinField label="رمز پویا" value={otp} onChange={setOtp} maxLength={5}
            onFilled={()=>cvv2Ref.current?.focus()}/>
          <OtpCooldownBtn key={selCard?.number||"none"} onRequest={()=>setErr("")} cardId={selCard?.number} noCard={!selCard}/>
        </div>

        {/* ── CVV2 ── */}
        <FinField label="CVV2" value={cvv2} onChange={setCvv2} maxLength={3}
          inputRef={cvv2Ref} onFilled={()=>expMRef.current?.focus()}/>

        {/* ── تاریخ انقضا ── */}
        <div className="fin-exp-row">
          <FinExpField label="ماه انقضا" value={expM} onChange={setExpM}
            inputRef={expMRef} maxLength={2} onFilled={()=>expYRef.current?.focus()}/>
          <div className="fin-exp-sep">/</div>
          <FinExpField label="سال انقضا" value={expY} onChange={setExpY}
            inputRef={expYRef} maxLength={2}/>
        </div>

        {/* ── Error ── */}
        {err&&(
          <div className="cb-err-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            <span>{err}</span>
          </div>
        )}

        {/* ── Security note ── */}
        <div className="cb-security-note">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span>اطلاعات کارت شما فقط برای استعلام موجودی استفاده می‌شود.</span>
        </div>
      </div>
      <StickyActionBtn label="استعلام موجودی" onClick={submit} disabled={processing||!allFilled} loading={processing} loadingText="در حال استعلام..."/>
    </div>
  </div>

  {cardPickerOpen&&createPortal(
    <div className="bs-overlay" onClick={()=>setCardPickerOpen(false)}>
      <div className="bs-sheet" onClick={e=>e.stopPropagation()}>
        <div className="bs-handle"/>
        <div className="bs-head">
          <span>انتخاب کارت بانکی</span>
          <button className="bs-close" onClick={()=>setCardPickerOpen(false)}><Icon name="x" size={16}/></button>
        </div>
        <div className="bs-body">
          {user.cards.map(c=>(
            <button key={c.id} className={`bs-card-item${selectedCardId===c.id?" active":""}`}
              onClick={()=>{setSelectedCardId(c.id);setCardPickerOpen(false);if(c.expM)setExpM(toFaDigits(c.expM));if(c.expY)setExpY(toFaDigits(c.expY))}}>
              <BankLogo bankName={c.bank} size={48} rounded={14}/>
              <div className="bs-card-info">
                <span className="bs-card-bank">{c.bank}</span>
                <span className="bs-card-holder">{c.holderName}</span>
                <span className="bs-card-num" dir="ltr">{toFaDigits(fmtCard(c.number))}</span>
              </div>
              {selectedCardId===c.id&&<div className="bs-card-check"><Icon name="check" size={16} stroke={2.5}/></div>}
            </button>
          ))}
          <div className="bs-divider"/>
          <button className="outline-button" style={{width:"100%",marginTop:4,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}
            onClick={()=>{setCardPickerOpen(false);setShowShaparak(true)}}>
            <Icon name="plus" size={15}/> اضافه کردن کارت جدید
          </button>
        </div>
      </div>
    </div>,document.body
  )}

  {processing&&<AnPardazLoadingOverlay text="در حال استعلام موجودی..."/>}
  {receipt&&<TransactionReceipt data={receipt} onClose={()=>{setReceipt(null);onDone();}}/>}
  {showShaparak&&<ShaparkCardModal onClose={()=>setShowShaparak(false)}/>}
  </>;
}

// ─── Charge Payment Screen ────────────────────────────────────────────────────
function ChargePaymentScreen({data,user,onUpdate,onBack,onDone}:{data:{phone:string;operator:Operator|null;amount:string;type:"charge"|"internet"};user:UserData;onUpdate:(u:UserData,tx:TxRecord)=>void;onBack:()=>void;onDone:()=>void}){
  const [selectedCard,setSelectedCard]=useState(user.cards[0]?.id??"");const [cardPickerOpen,setCardPickerOpen]=useState(false);
  const [otp,setOtp]=useState("");const [cvv2,setCvv2]=useState("");const [expM,setExpM]=useState("");const [expY,setExpY]=useState("");
  const cvv2Ref=useRef<HTMLInputElement>(null);const expMRef=useRef<HTMLInputElement>(null);const expYRef=useRef<HTMLInputElement>(null);
  const [processing,setProcessing]=useState(false);const [receipt,setReceipt]=useState<ReceiptData|null>(null);const [err,setErr]=useState("");
  const selCard=user.cards.find(c=>c.id===selectedCard);
  const payValid=!!selCard&&toLatinDigits(otp).length===5&&toLatinDigits(cvv2).length===3&&toLatinDigits(expM).length===2&&toLatinDigits(expY).length===2;
  const resetSensitive=()=>{setOtp("");setCvv2("");setExpM("");setExpY("")};
  const pay=()=>{
    if(!otp){setErr("رمز پویا را وارد کنید.");return}
    if(!cvv2){setErr("CVV2 را وارد کنید.");return}
    if(!expM||!expY){setErr("تاریخ انقضا را وارد کنید.");return}
    setErr("");setProcessing(true);
    setTimeout(()=>{
      setProcessing(false);
      const label=data.type==="charge"?"شارژ مستقیم":"بسته اینترنت";
      onUpdate(user,{id:genId(),userId:user.phone,type:"service",fromAsset:"toman",toAsset:"toman",amount:0,fee:0,status:"done",createdAt:new Date().toISOString(),note:`${label} · ${data.operator?.name??""} · ${data.phone} · ${data.amount}`,source:"app"});
      resetSensitive();
      setReceipt({title:data.type==="charge"?"شارژ سیم کارت موفق بود":"خرید بسته اینترنت موفق بود",amount:data.amount,destination:`${data.operator?.name??""}  ${toFaDigits(data.phone)}`,status:"success",detail:"تراکنش با موفقیت پردازش شد."});
    },2500);
  };
  return <>
  <div className="subscreen" dir="rtl">
    <div className="subscreen-header">
      <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">پرداخت</h2>
      <div style={{width:36}}/>
    </div>
    <div className="subscreen-body">
      {/* Summary card */}
      {data.type==="internet"?(()=>{
        // Split "package name — price ریال" into parts
        const sepIdx=data.amount.lastIndexOf(" — ");
        const pkgName=sepIdx>=0?data.amount.slice(0,sepIdx).trim():data.amount;
        const pkgPrice=sepIdx>=0?data.amount.slice(sepIdx+3).trim():"";
        return (
          <div style={{background:"var(--card-bg)",border:"1px solid var(--border-color)",borderRadius:18,overflow:"hidden",marginBottom:8,position:"relative"}}>
            <div style={{height:3,background:"linear-gradient(90deg,#00CC8F,rgba(0,204,143,0.2))"}}/>
            <div style={{padding:"14px 16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                {data.operator&&<OperatorBadge op={data.operator}/>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:16,fontWeight:800,color:"var(--text-primary)"}}>{toFaDigits(data.phone)}</div>
                  <div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>بسته اینترنت</div>
                </div>
              </div>
              <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)",lineHeight:1.65,marginBottom:pkgPrice?12:0,wordBreak:"break-word",overflowWrap:"anywhere"}}>{pkgName}</div>
              {pkgPrice&&<>
                <div style={{height:1,background:"var(--border-faint)",marginBottom:10}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:12,color:"var(--text-muted)"}}>مبلغ قابل پرداخت</div>
                  <div style={{fontSize:17,fontWeight:900,color:"var(--accent)"}}>{toFaDigits(pkgPrice)}</div>
                </div>
              </>}
            </div>
          </div>
        );
      })():(
        <div className="charge-summary-card">
          <div className="charge-summary-op">
            {data.operator&&<OperatorBadge op={data.operator}/>}
            <div>
              <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>{toFaDigits(data.phone)}</div>
              <div style={{fontSize:12,color:"var(--text-muted)"}}>شارژ مستقیم</div>
            </div>
          </div>
          <div className="charge-summary-amount">{toFaDigits(String(data.amount))}</div>
        </div>
      )}

      <div className="banking-form">
        {/* Card selector */}
        <div className="bform-field">
          <label className="field-label">کارت بانکی</label>
          <button className="bform-card-select" onClick={()=>setCardPickerOpen(true)}>
            {selCard?(
              <div className="bform-card-row">
                <BankLogo bankName={selCard.bank} size={44} rounded={13}/>
                <div className="bform-card-text">
                  <span className="bform-bank-name">{selCard.bank}</span>
                  <span className="bform-card-number" dir="ltr">{toFaDigits(fmtCard(selCard.number))}</span>
                </div>
              </div>
            ):(
              <div className="bform-card-row">
                <div className="bform-bank-dot bform-bank-dot--empty"><Icon name="credit" size={16}/></div>
                <span className="bform-card-placeholder">انتخاب کارت بانکی</span>
              </div>
            )}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        </div>

        <div className="fin-otp-row">
          <FinField label="رمز پویا" value={otp} onChange={setOtp} maxLength={5}
            onFilled={()=>cvv2Ref.current?.focus()}/>
          <OtpCooldownBtn key={selCard?.number||"none"} onRequest={()=>setErr("")} cardId={selCard?.number} noCard={!selCard}/>
        </div>
        <FinField label="CVV2" value={cvv2} onChange={setCvv2} maxLength={3}
          inputRef={cvv2Ref} onFilled={()=>expMRef.current?.focus()}/>
        <div className="fin-exp-row">
          <FinExpField label="ماه انقضا" value={expM} onChange={setExpM}
            inputRef={expMRef} maxLength={2} onFilled={()=>expYRef.current?.focus()}/>
          <div className="fin-exp-sep">/</div>
          <FinExpField label="سال انقضا" value={expY} onChange={setExpY}
            inputRef={expYRef} maxLength={2}/>
        </div>
        {err&&<p className="field-err">{err}</p>}
      </div>
      <StickyActionBtn label="پرداخت" onClick={pay} disabled={processing||!payValid} loading={processing} loadingText="در حال پردازش..."/>
    </div>
  </div>
  {processing&&<AnPardazLoadingOverlay text="در حال پردازش پرداخت..."/>}
  {receipt&&<TransactionReceipt data={receipt} onClose={()=>{setReceipt(null);onDone();}}/>}
  {cardPickerOpen&&createPortal(
    <div className="bs-overlay" onClick={()=>setCardPickerOpen(false)}>
      <div className="bs-sheet" onClick={e=>e.stopPropagation()}>
        <div className="bs-handle"/>
        <div className="bs-head">
          <span>انتخاب کارت بانکی</span>
          <button className="bs-close" onClick={()=>setCardPickerOpen(false)}><Icon name="x" size={16}/></button>
        </div>
        <div className="bs-body">
          {user.cards.length===0&&<p className="bs-empty">کارتی ثبت نشده است. ابتدا از پروفایل کارت اضافه کنید.</p>}
          {user.cards.map(c=>(
            <button key={c.id} className={`bs-card-item${selectedCard===c.id?" active":""}`}
              onClick={()=>{setSelectedCard(c.id);setCardPickerOpen(false);if(c.expM)setExpM(toFaDigits(c.expM));if(c.expY)setExpY(toFaDigits(c.expY))}}>
              <BankLogo bankName={c.bank} size={48} rounded={14}/>
              <div className="bs-card-info">
                <span className="bs-card-bank">{c.bank}</span>
                <span className="bs-card-holder">{c.holderName}</span>
                <span className="bs-card-num" dir="ltr">{toFaDigits(fmtCard(c.number))}</span>
              </div>
              {selectedCard===c.id&&<div className="bs-card-check"><Icon name="check" size={16} stroke={2.5}/></div>}
            </button>
          ))}
        </div>
      </div>
    </div>,document.body
  )}
  </>;
}

// ─── Services data ────────────────────────────────────────────────────────────
// Custom SVG illustrations for specific service tiles
function ServiceIllustration({id,color}:{id:string;color:string}){
  const c=color;
  if(id==="exchange")return <svg viewBox="0 0 36 36" width={26} height={26}><rect x="3" y="14" width="6" height="18" rx="1.5" fill={c} opacity="0.9"/><rect x="11" y="8" width="6" height="24" rx="1.5" fill={c}/><rect x="19" y="18" width="6" height="14" rx="1.5" fill={c} opacity="0.6"/><rect x="27" y="4" width="6" height="28" rx="1.5" fill={c} opacity="0.8"/><line x1="3" y1="14" x2="9" y2="8" stroke={c} strokeWidth="1.2" opacity="0.7"/><line x1="11" y1="8" x2="19" y2="18" stroke={c} strokeWidth="1.2" opacity="0.7"/><line x1="19" y1="18" x2="27" y2="4" stroke={c} strokeWidth="1.2" opacity="0.7"/></svg>;
  if(id==="violations")return <svg viewBox="0 0 36 36" width={26} height={26}><rect x="2" y="16" width="32" height="13" rx="4" fill={c} opacity="0.9"/><rect x="7" y="10" width="22" height="10" rx="3" fill={c} opacity="0.7"/><circle cx="9" cy="29" r="3.5" fill={c}/><circle cx="27" cy="29" r="3.5" fill={c}/><circle cx="9" cy="29" r="1.8" fill="#1a1a1a"/><circle cx="27" cy="29" r="1.8" fill="#1a1a1a"/><rect x="13" y="13" width="10" height="5" rx="1.5" fill="rgba(255,255,255,0.35)"/></svg>;
  if(id==="transfer")return <svg viewBox="0 0 36 36" width={26} height={26}><rect x="1" y="7" width="20" height="13" rx="3" fill={c} opacity="0.9"/><rect x="1" y="9" width="20" height="4" fill="rgba(255,255,255,0.25)"/><rect x="3" y="16" width="5" height="2" rx="1" fill="rgba(255,255,255,0.5)"/><rect x="15" y="16" width="16" height="13" rx="3" fill={c} opacity="0.65"/><rect x="15" y="18" width="16" height="4" fill="rgba(255,255,255,0.15)"/><rect x="17" y="25" width="5" height="2" rx="1" fill="rgba(255,255,255,0.4)"/></svg>;
  if(id==="freeway")return <svg viewBox="0 0 36 36" width={26} height={26}><path d="M4 28L18 8L32 28Z" fill="none" stroke={c} strokeWidth="2.5" strokeLinejoin="round" opacity="0.5"/><line x1="18" y1="8" x2="18" y2="28" stroke={c} strokeWidth="2" strokeDasharray="3 2"/><line x1="4" y1="28" x2="32" y2="28" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="8" y1="22" x2="28" y2="22" stroke={c} strokeWidth="1.5" opacity="0.6"/><line x1="11" y1="16" x2="25" y2="16" stroke={c} strokeWidth="1.5" opacity="0.4"/></svg>;
  if(id==="judiciary-bill")return <svg viewBox="0 0 36 36" width={26} height={26}>
    {/* Center pole */}
    <line x1="18" y1="6" x2="18" y2="30" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    {/* Horizontal beam */}
    <line x1="8" y1="11" x2="28" y2="11" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
    {/* Left chain */}
    <line x1="10" y1="11" x2="10" y2="20" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.85"/>
    {/* Right chain */}
    <line x1="26" y1="11" x2="26" y2="20" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.85"/>
    {/* Left pan */}
    <path d="M6 20 Q10 23 14 20" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    {/* Right pan */}
    <path d="M22 20 Q26 23 30 20" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    {/* Base */}
    <line x1="14" y1="30" x2="22" y2="30" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
    {/* Ornament at top */}
    <circle cx="18" cy="6" r="2" fill={c} opacity="0.9"/>
  </svg>;
  if(id==="moto-ins")return <svg viewBox="0 0 36 36" width={26} height={26}><circle cx="9" cy="26" r="5.5" fill="none" stroke={c} strokeWidth="2.5"/><circle cx="27" cy="26" r="5.5" fill="none" stroke={c} strokeWidth="2.5"/><circle cx="9" cy="26" r="2" fill={c} opacity="0.8"/><circle cx="27" cy="26" r="2" fill={c} opacity="0.8"/><path d="M9 20 L14 14 L22 14 L28 20" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 14 L18 8 L24 8" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.75"/><line x1="14" y1="20" x2="28" y2="20" stroke={c} strokeWidth="2.5" strokeLinecap="round"/></svg>;
  if(id==="an-market")return <svg viewBox="0 0 36 36" width={26} height={26}><rect x="4" y="10" width="28" height="20" rx="3.5" fill="none" stroke={c} strokeWidth="2.2"/><path d="M4 16 h28" stroke={c} strokeWidth="1.8" opacity="0.5"/><rect x="10" y="20" width="6" height="7" rx="1.5" fill={c} opacity="0.7"/><rect x="20" y="20" width="6" height="4" rx="1.5" fill={c} opacity="0.45"/><path d="M12 10 Q12 5 18 5 Q24 5 24 10" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round"/></svg>;
  if(id==="an-yab")return <svg viewBox="0 0 36 36" width={26} height={26}><circle cx="16" cy="16" r="8.5" fill="none" stroke={c} strokeWidth="2.5"/><line x1="22" y1="22" x2="30" y2="30" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><path d="M13 13 Q16 10 19 13" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.7"/><circle cx="16" cy="18" r="1.5" fill={c} opacity="0.8"/></svg>;
  if(id==="an-banner")return <svg viewBox="0 0 36 36" width={26} height={26}><rect x="4" y="6" width="28" height="24" rx="4" fill="none" stroke={c} strokeWidth="2.2"/><path d="M4 14h28" stroke={c} strokeWidth="1.6" opacity="0.5"/><rect x="8" y="18" width="8" height="8" rx="2" fill={c} opacity="0.8"/><rect x="20" y="18" width="8" height="4" rx="1.5" fill={c} opacity="0.45"/><rect x="20" y="24" width="5" height="2" rx="1" fill={c} opacity="0.35"/></svg>;
  if(id==="cashback")return <svg viewBox="0 0 36 36" width={26} height={26}><path d="M5 18A13 13 0 1 1 5.5 23" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><polyline points="4 10 4 17 11 17" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><text x="18" y="21" textAnchor="middle" fontSize="10" fontWeight="bold" fill={c} opacity="0.85">%</text></svg>;
  if(id==="an-hoosh")return <svg viewBox="0 0 36 36" width={26} height={26}><path d="M18 4L21 11L29 12L23.5 17.5L24.9 26L18 22.5L11.1 26L12.5 17.5L7 12L15 11L18 4Z" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="18" cy="15" r="3" fill={c} opacity="0.35" stroke={c} strokeWidth="1.4"/></svg>;
  return null;
}

const SERVICES=[
  {id:"card-balance",label:"موجودی کارت",icon:"credit",color:"#00D6B0",bg:"rgba(0,214,176,0.15)",action:"card-balance"},
  {id:"transfer",label:"انتقال وجه",icon:"send",color:"#4a9eff",bg:"rgba(74,158,255,0.15)",action:"transfer"},
  {id:"charge",label:"شارژ",icon:"phone",color:"#34d399",bg:"rgba(52,211,153,0.15)",action:"charge"},
  {id:"internet",label:"بسته اینترنت",icon:"wifi",color:"#38bdf8",bg:"rgba(56,189,248,0.15)",action:"internet"},
  {id:"bills",label:"قبض",icon:"receipt",color:"#fb923c",bg:"rgba(251,146,60,0.15)",action:"bills"},
  {id:"charity",label:"نیکوکاری",icon:"heart",color:"#f472b6",bg:"rgba(244,114,182,0.15)",action:"charity"},
  {id:"third-party-ins",label:"بیمه ثالث",icon:"shield",color:"#3b82f6",bg:"rgba(59,130,246,0.15)",action:"insurance"},
  {id:"body-ins",label:"بیمه بدنه",icon:"car",color:"#6366f1",bg:"rgba(99,102,241,0.15)",action:"insurance-body"},
  {id:"moto-ins",label:"بیمه موتور",icon:"moto",color:"#4a9eff",bg:"rgba(74,158,255,0.12)",action:"insurance-moto"},
  {id:"violations",label:"خلافی خودرو",icon:"info",color:"#a855f7",bg:"rgba(168,85,247,0.12)",action:"violations"},
  {id:"freeway",label:"عوارض آزادراه",icon:"building",color:"#a855f7",bg:"rgba(168,85,247,0.1)",action:"freeway"},
  {id:"tehran-traffic",label:"طرح ترافیک",icon:"camera",color:"#9333ea",bg:"rgba(147,51,234,0.15)",action:"tehran-traffic"},
  {id:"sana",label:"ثبت ثنا",icon:"user",color:"#64748b",bg:"rgba(100,116,139,0.15)",action:"sana"},
  {id:"judiciary-bill",label:"قبض قضائیه",icon:"gavel",color:"#64748b",bg:"rgba(100,116,139,0.12)",action:"judiciary-bill"},
  {id:"property-reg",label:"ثبت اسناد",icon:"file-text",color:"#64748b",bg:"rgba(100,116,139,0.1)",action:"property-reg"},
  {id:"cashback",label:"بازگشت هزینه",icon:"refresh",color:"#00D6B0",bg:"rgba(0,214,176,0.12)",action:"cashback"},
  // Extra services — shown in AllServices, can be added to Home
  {id:"cheque-seyadi",label:"چک صیادی",icon:"file-text",color:"#0891B2",bg:"rgba(8,145,178,0.12)",action:"soon"},
  {id:"social-ins",label:"تامین اجتماعی",icon:"shield",color:"#059669",bg:"rgba(5,150,105,0.12)",action:"soon"},
  {id:"payam-noor",label:"پیام نور",icon:"phone",color:"#D97706",bg:"rgba(217,119,6,0.12)",action:"soon"},
  {id:"credit-score",label:"رتبه اعتباری",icon:"trending-up",color:"#7C3AED",bg:"rgba(124,58,237,0.12)",action:"soon"},
];

// Services shown on Home by default (excludes extra/new services)
const DEFAULT_HOME_SERVICES=["card-balance","transfer","charge","internet","bills","charity","third-party-ins","body-ins","moto-ins","violations","freeway","tehran-traffic","sana","judiciary-bill","property-reg","cashback"];

const PLATFORMS=[
  {id:"an-banner",label:"آن بنر",desc:"بازار آگهی‌های ایران",color:"#E8354E",bg:"linear-gradient(135deg,rgba(232,53,78,0.12),rgba(232,53,78,0.05))",border:"rgba(232,53,78,0.22)",action:"an-banner"},
  {id:"an-market",label:"آن مارکت",desc:"خرید و فروش آنلاین",color:"#D97706",bg:"linear-gradient(135deg,rgba(217,119,6,0.12),rgba(217,119,6,0.05))",border:"rgba(217,119,6,0.22)",action:"an-market"},
  {id:"an-sarraf",label:"آن صراف",desc:"صرافی ارز دیجیتال",color:"#7C3AED",bg:"linear-gradient(135deg,rgba(124,58,237,0.12),rgba(124,58,237,0.05))",border:"rgba(124,58,237,0.22)",action:"exchange"},
  {id:"financial-center",label:"مرکز مالی",desc:"سرمایه‌گذاری و بازارها",color:"#0891B2",bg:"linear-gradient(135deg,rgba(8,145,178,0.12),rgba(8,145,178,0.05))",border:"rgba(8,145,178,0.22)",action:"financial-center"},
  {id:"an-hoosh",label:"آن هوش",desc:"دستیار هوش مصنوعی",color:"#8B5CF6",bg:"linear-gradient(135deg,rgba(139,92,246,0.13),rgba(109,40,217,0.06))",border:"rgba(139,92,246,0.25)",action:"an-hoosh"},
];
const DEFAULT_HOME_PLATFORMS=PLATFORMS.map(p=>p.id);

// ─── ServiceIcon — single source-of-truth for ALL service icon rendering ──────
// Mirrors the home page service grid: ServiceIllustration first, then Icon.
// Use this everywhere a service icon appears (transactions, cashback, lists).
function ServiceIcon({id,color,size=22}:{id:string;color:string;size?:number}){
  const ill=ServiceIllustration({id,color});
  if(ill)return <>{ill}</>;
  const svc=SERVICES.find(s=>s.id===id);
  return <Icon name={svc?.icon??"receipt"} size={size}/>;
}

// ─── User Drawer Modal ────────────────────────────────────────────────────────
function UserDrawerModal({user,onClose,onLogout}:{user:UserData;onClose:()=>void;onLogout:()=>void}){
  const [confirm,setConfirm]=useState(false); const initials=(user.name?.[0]??"")+(user.family?.[0]??"")||"؟";
  useBackHandler(confirm?()=>setConfirm(false):onClose);
  if(confirm)return <div className="anp-full-page" dir="rtl"><div className="anp-page-header"><button className="back-btn" onClick={()=>setConfirm(false)}><Icon name="arrow" size={20}/></button><h2 className="subscreen-title">خروج از حساب</h2><div style={{width:36}}/></div><div className="anp-page-body" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,paddingTop:48}}><div style={{width:64,height:64,borderRadius:"50%",background:"rgba(232,81,42,0.12)",border:"1px solid rgba(232,81,42,0.3)",display:"flex",alignItems:"center",justifyContent:"center",color:"#e8512a"}}><Icon name="log-out" size={26}/></div><div style={{fontSize:17,fontWeight:800,color:"var(--text-primary)"}}>خروج از حساب</div><p style={{fontSize:13,color:"var(--text-muted)",textAlign:"center",lineHeight:1.8}}>آیا مطمئن هستید که می‌خواهید خارج شوید؟</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,width:"100%",maxWidth:320}}><button className="outline-button" onClick={()=>setConfirm(false)}>انصراف</button><button className="primary-button" style={{background:"#e8512a"}} onClick={onLogout}>خروج</button></div></div></div>;
  return <div className="anp-full-page" dir="rtl">
    <div className="anp-page-header">
      <button className="back-btn" onClick={onClose}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">اطلاعات کاربری</h2>
      <div style={{width:36}}/>
    </div>
    <div className="anp-page-body">
      <div className="user-drawer-header" style={{marginBottom:20}}>
        <div className="user-drawer-avatar">{user.photo?<img src={user.photo} alt="پروفایل"/>:initials}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:17,fontWeight:900,color:"var(--text-primary)"}}>{(user.name+" "+user.family).trim()||"کاربر"}</div>
          <div style={{fontSize:12,color:"var(--text-muted)",marginTop:4}}>{toFaDigits(user.phone)}</div>
          <div style={{display:"flex",alignItems:"center",gap:4,marginTop:6,color:"#00D6B0",fontSize:11,fontWeight:700}}><Icon name="check" size={12}/>احراز هویت شده</div>
        </div>
      </div>
      <div className="user-drawer-info-grid" style={{marginBottom:20}}>{user.nationalId&&<div className="user-info-chip"><span>کد ملی</span><b>{toFaDigits(user.nationalId)}</b></div>}{user.birthDate&&<div className="user-info-chip"><span>تاریخ تولد</span><b>{toFaDigits(user.birthDate)}</b></div>}</div>
      <button className="user-drawer-logout" onClick={()=>setConfirm(true)}><Icon name="log-out" size={18}/>خروج از حساب</button>
    </div>
  </div>;
}

// ─── Cashback Service Icons ───────────────────────────────────────────────────
function CashbackSvcIcon({id,color}:{id:string;color:string}){
  const s={width:22,height:22,fill:"none",stroke:color,strokeWidth:2,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
  const icons:Record<string,React.ReactNode>={
    "transfer":<svg {...s} viewBox="0 0 24 24"><path d="M17 3l4 4-4 4"/><path d="M3 7h18"/><path d="M7 21l-4-4 4-4"/><path d="M21 17H3"/></svg>,
    "card-balance":<svg {...s} viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>,
    "charge":<svg {...s} viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="3"/><path d="M12 6v6l3 3"/><circle cx="12" cy="12" r="4" strokeWidth="1.5"/></svg>,
    "internet":<svg {...s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    "bills":<svg {...s} viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    "charity":<svg {...s} viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    "third-party-ins":<svg {...s} viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
    "body-ins":<svg {...s} viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="3"/></svg>,
    "moto-ins":<svg {...s} viewBox="0 0 24 24"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M9 17h6"/><path d="M11 6h3l2 5"/><path d="M5 14l3-8h5"/></svg>,
    "violations":<svg {...s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3"/></svg>,
    "freeway":<svg {...s} viewBox="0 0 24 24"><path d="M3 12h18"/><path d="M3 6l9-3 9 3"/><path d="M3 18l9 3 9-3"/></svg>,
    "tehran-traffic":<svg {...s} viewBox="0 0 24 24"><circle cx="12" cy="6" r="3"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="18" r="3"/><rect x="5" y="2" width="14" height="20" rx="3" strokeWidth="1.5"/></svg>,
    "exchange":<svg {...s} viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  };
  return <>{icons[id]||<svg {...s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>}</>;
}

// ─── Cashback Screen ──────────────────────────────────────────────────────────
function CashbackScreen({user,transactions,onBack,onUpdate}:{user:UserData;transactions:TxRecord[];onBack:()=>void;onUpdate?:(u:UserData,tx:TxRecord)=>void}){
  type CSub="home"|"service-detail"|"complaint";
  const [sub,setSub]=useState<CSub>("home");
  const [selServiceId,setSelServiceId]=useState<string|null>(null);
  const [dateFilter,setDateFilter]=useState<"today"|"week"|"month"|"all">("today");
  const [showInfo,setShowInfo]=useState(false);
  const [showDatePicker,setShowDatePicker]=useState(false);
  const [showPdfModal,setShowPdfModal]=useState(false);
  const [visibleCount,setVisibleCount]=useState(10);
  const [complaintCat,setComplaintCat]=useState("");
  const [complaintText,setComplaintText]=useState("");
  const [complaintSent,setComplaintSent]=useState(false);
  const [blinkTick,setBlinkTick]=useState(true);
  const scrollRef=useRef<HTMLDivElement>(null);
  const [showWithdraw,setShowWithdraw]=useState(false);
  const [wdStep,setWdStep]=useState<"select-card"|"confirm"|"processing"|"done">("select-card");
  const [wdCard,setWdCard]=useState<string>("");
  const [wdTrack,setWdTrack]=useState("");
  useEffect(()=>{const t=setInterval(()=>setBlinkTick(b=>!b),800);return()=>clearInterval(t);},[]);

  const RATE=0.0015;
  const appEligibleTxs=transactions.filter(tx=>(tx.source==="app"||(tx.source==null&&!tx.note?.includes("[صرافی]")))&&(tx.type==="service"||tx.type==="transfer")&&tx.status==="done");
  const totalCashback=appEligibleTxs.reduce((acc,tx)=>acc+Math.round(tx.amount*RATE),0);
  const pendingCashback=appEligibleTxs.slice(0,2).reduce((acc,tx)=>acc+Math.round(tx.amount*RATE),0);

  const getServiceTxs=(id:string):TxRecord[]=>{
    switch(id){
      case "transfer":return appEligibleTxs.filter(tx=>tx.type==="transfer");
      case "charge":return appEligibleTxs.filter(tx=>tx.note?.split(" · ")[0]==="شارژ مستقیم");
      case "internet":return appEligibleTxs.filter(tx=>tx.note?.includes("بسته اینترنت"));
      case "bills":return appEligibleTxs.filter(tx=>tx.note?.startsWith("قبض ")&&!tx.note?.includes("قضائیه")&&!tx.note?.includes("ثبت اسناد"));
      case "charity":return appEligibleTxs.filter(tx=>tx.note?.includes("نیکوکاری"));
      case "violations":return appEligibleTxs.filter(tx=>tx.note?.includes("خلافی خودرو"));
      case "judiciary-bill":return appEligibleTxs.filter(tx=>tx.note?.includes("قبض قضائیه"));
      case "property-reg":return appEligibleTxs.filter(tx=>tx.note?.includes("قبض ثبت اسناد"));
      default:return [];
    }
  };

  const dateFilterLabel:Record<string,string>={today:"امروز",week:"یک هفته",month:"یک ماه",all:"کل زمان"};
  const filterByDate=(txs:TxRecord[]):TxRecord[]=>{
    const now=Date.now();
    if(dateFilter==="today"){const t=new Date().toLocaleDateString("fa-IR");return txs.filter(tx=>new Date(tx.createdAt).toLocaleDateString("fa-IR")===t);}
    if(dateFilter==="week")return txs.filter(tx=>now-new Date(tx.createdAt).getTime()<7*864e5);
    if(dateFilter==="month")return txs.filter(tx=>now-new Date(tx.createdAt).getTime()<30*864e5);
    return txs;
  };

  const selService=SERVICES.find(s=>s.id===selServiceId)||null;

  const ELIGIBLE_IDS=["transfer","charge","internet","bills","charity","third-party-ins","body-ins","moto-ins","violations","freeway","tehran-traffic","card-balance","exchange","sana","judiciary-bill","property-reg"];

  const generatePDF=()=>{
    if(!selService)return;
    const ftxs=filterByDate(getServiceTxs(selService.id));
    const periodTotal=ftxs.reduce((a,tx)=>a+Math.round(tx.amount*RATE),0);
    const rows=ftxs.map(tx=>{const d=new Date(tx.createdAt);const cb=Math.round(tx.amount*RATE);return `<tr><td>${d.toLocaleDateString("fa-IR")}</td><td>${d.toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit"})}</td><td>${fa(tx.amount)}</td><td>+${fa(cb)}</td></tr>`;}).join("");
    const html=`<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="utf-8"><title>گزارش بازگشت هزینه ${selService.label}</title><style>@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap');body{font-family:Vazirmatn,sans-serif;background:#fff;color:#1a1a1a;margin:0;padding:28px}h1{font-size:22px;font-weight:900;color:#00695c;margin-bottom:4px}.sub{font-size:13px;color:#666;margin-bottom:20px}.total-box{background:#f0faf8;border:1px solid #b2dfdb;border-radius:12px;padding:18px;text-align:center;margin-bottom:24px}.tl{font-size:12px;color:#4a9e90;margin-bottom:6px}.ta{font-size:30px;font-weight:900;color:#00695c}table{width:100%;border-collapse:collapse;font-size:13px}thead th{background:#00695c;color:#fff;padding:10px 14px;text-align:right}tbody tr:nth-child(even){background:#f9f9f9}tbody td{padding:9px 14px;border-bottom:1px solid #eee}.disc{margin-top:36px;padding:14px;background:#fff9e6;border:1px solid #ffe082;border-radius:8px;font-size:11px;color:#795548;line-height:2;text-align:center}</style></head><body><h1>گزارش بازگشت هزینه — ${selService.label}</h1><div class="sub">بازه زمانی: ${dateFilterLabel[dateFilter]} · تعداد: ${toFaDigits(String(ftxs.length))}</div><div class="total-box"><div class="tl">مجموع بازگشت هزینه</div><div class="ta">${fa(periodTotal)} تومان</div></div><table><thead><tr><th>تاریخ</th><th>ساعت</th><th>مبلغ هزینه (تومان)</th><th>مبلغ بازگشتی (تومان)</th></tr></thead><tbody>${rows||'<tr><td colspan="4" style="text-align:center;padding:18px;color:#999">تراکنشی یافت نشد</td></tr>'}</tbody></table><div class="disc">این لیست هزینه های بازگشتی مربوط به حساب کاربری شما می باشد ؛ از طرف اپلیکیشن آن پرداز، و صرفا جهت اطلاع شماست و هیچ ارزش دیگری ندارد</div><script>window.onload=()=>setTimeout(()=>window.print(),300);<\/script></body></html>`;
    const w=window.open("","_blank","width=820,height=920");if(w){w.document.write(html);w.document.close();}
    setShowPdfModal(false);
  };

  if(sub==="complaint")return(
    <div className="subscreen" dir="rtl">
      <div className="subscreen-header">
        <button className="back-btn" onClick={()=>setSub("home")}><Icon name="arrow" size={20}/></button>
        <h2 className="subscreen-title">اعتراض</h2>
        <div style={{width:36}}/>
      </div>
      <div className="subscreen-body" style={{padding:"20px 16px 80px"}}>
        {complaintSent?(
          <div style={{textAlign:"center",padding:"48px 20px"}}>
            <div style={{width:72,height:72,borderRadius:"50%",background:"rgba(0,214,176,0.1)",border:"2px solid rgba(0,214,176,0.3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00D6B0" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{fontSize:18,fontWeight:900,color:"#00D6B0",marginBottom:8}}>اعتراض ثبت شد</div>
            <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:6}}>شماره پیگیری: {toFaDigits(String(1000000+Math.floor(Math.random()*9000000)))}</div>
            <p style={{fontSize:13,color:"var(--text-muted)",lineHeight:1.9,marginBottom:24}}>تیم پشتیبانی آن‌پرداز ظرف ۴۸ ساعت کاری بررسی می‌کند.</p>
            <button className="primary-button" style={{width:"100%"}} onClick={()=>{setComplaintSent(false);setComplaintCat("");setComplaintText("");setSub("home")}}>بازگشت</button>
          </div>
        ):(
          <>
            <div style={{background:"var(--card-bg)",borderRadius:16,padding:"16px 20px",border:"1px solid var(--border-color)",marginBottom:14}}>
              <div style={{fontSize:14,fontWeight:800,color:"var(--text-primary)",marginBottom:14}}>موضوع اعتراض</div>
              {["مبلغ بازگشتی اشتباه است","واریز نشده","تراکنش در لیست نیست","مشکل در محاسبه","سایر"].map((cat,ci)=>(
                <button key={cat} onClick={()=>setComplaintCat(cat)} style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"12px 0",background:"none",border:"none",borderBottom:ci<4?"1px solid rgba(120,190,210,0.07)":"none",cursor:"pointer",fontFamily:"Vazirmatn",textAlign:"right"}}>
                  <div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${complaintCat===cat?"#00D6B0":"rgba(120,190,210,0.25)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"border-color 0.15s"}}>
                    {complaintCat===cat&&<div style={{width:11,height:11,borderRadius:"50%",background:"#00D6B0"}}/>}
                  </div>
                  <span style={{fontSize:14,color:"var(--text-primary)"}}>{cat}</span>
                </button>
              ))}
            </div>
            <div style={{background:"var(--card-bg)",borderRadius:16,padding:"16px 20px",border:"1px solid var(--border-color)",marginBottom:16}}>
              <div style={{fontSize:14,fontWeight:800,color:"var(--text-primary)",marginBottom:10}}>توضیحات</div>
              <textarea value={complaintText} onChange={e=>setComplaintText(e.target.value)} placeholder="جزئیات اعتراض خود را بنویسید..." style={{width:"100%",minHeight:100,background:"rgba(0,0,0,0.2)",border:"1px solid var(--border-color)",borderRadius:10,color:"var(--text-primary)",fontFamily:"Vazirmatn",fontSize:13,padding:"12px",boxSizing:"border-box",resize:"none",outline:"none",lineHeight:1.8}}/>
            </div>
            <button className="primary-button" style={{width:"100%"}} disabled={!complaintCat||!complaintText.trim()} onClick={()=>setComplaintSent(true)}>ثبت اعتراض</button>
          </>
        )}
      </div>
    </div>
  );

  if(sub==="service-detail"&&selService){
    const allSvcTxs=getServiceTxs(selService.id);
    const ftxs=filterByDate(allSvcTxs);
    const periodTotal=ftxs.reduce((a,tx)=>a+Math.round(tx.amount*RATE),0);
    const visibleTxs=ftxs.slice(0,visibleCount);
    const hasMore=visibleCount<ftxs.length;
    const onScroll=(e:React.UIEvent<HTMLDivElement>)=>{
      const el=e.currentTarget;
      if(el.scrollHeight-el.scrollTop-el.clientHeight<60&&hasMore)setVisibleCount(c=>c+10);
    };
    return(
      <div className="subscreen" dir="rtl">
        <div className="subscreen-header">
          <button className="back-btn" onClick={()=>{setSub("home");setVisibleCount(10);}}><Icon name="arrow" size={20}/></button>
          <h2 className="subscreen-title" style={{fontSize:15}}>بازگشت هزینه {selService.label}</h2>
          <div style={{width:36}}/>
        </div>
        <div className="subscreen-body" style={{padding:"16px 16px 80px",overflowY:"auto"}} onScroll={onScroll} ref={scrollRef}>
          {/* Date range selector */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <button onClick={()=>setShowDatePicker(true)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 16px",borderRadius:14,background:"var(--card-bg)",border:"1px solid rgba(0,214,176,0.25)",color:"var(--text-primary)",fontFamily:"Vazirmatn",fontSize:13,fontWeight:700,cursor:"pointer"}}>
              <span style={{color:"var(--text-muted)",fontWeight:400,fontSize:12}}>بازه زمانی</span>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{color:"#00D6B0"}}>{dateFilterLabel[dateFilter]}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00D6B0" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
              </div>
            </button>
            <button onClick={()=>setShowPdfModal(true)} style={{padding:"11px 13px",borderRadius:14,background:"rgba(0,214,176,0.06)",border:"1px solid rgba(0,214,176,0.2)",color:"var(--accent)",fontFamily:"Vazirmatn",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              PDF
            </button>
          </div>
          {/* Total amount — centered */}
          <div style={{background:"linear-gradient(150deg,rgba(0,40,30,0.95),rgba(0,30,22,0.98))",border:"1px solid rgba(0,214,176,0.22)",borderRadius:20,padding:"28px 20px",marginBottom:16,textAlign:"center"}}>
            <div style={{fontSize:12,color:"rgba(0,214,176,0.6)",marginBottom:10,letterSpacing:0.3}}>مجموع بازگشت هزینه</div>
            <div style={{fontSize:36,fontWeight:900,color:"#00D6B0",letterSpacing:-1,lineHeight:1}}>{fa(periodTotal)}</div>
            <div style={{fontSize:14,color:"rgba(0,214,176,0.5)",marginTop:6}}>تومان</div>
            <div style={{marginTop:14,fontSize:11,color:"rgba(255,255,255,0.2)"}}>{toFaDigits(String(ftxs.length))} تراکنش · ۰٫۱۵٪ از هر هزینه</div>
          </div>
          {/* Transaction list */}
          {ftxs.length===0?(
            <div style={{textAlign:"center",padding:"48px 20px",color:"var(--text-muted)"}}>
              <div style={{width:72,height:72,borderRadius:"50%",background:"rgba(120,190,210,0.06)",border:"1px solid rgba(120,190,210,0.12)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgba(120,190,210,0.3)" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)",marginBottom:8}}>تراکنشی برای این بازه زمانی وجود ندارد</div>
              <div style={{fontSize:12,color:"var(--text-muted)",lineHeight:1.9}}>بازه زمانی دیگری انتخاب کنید یا از خدمات آن‌پرداز استفاده کنید.</div>
            </div>
          ):(
            <>
              {visibleTxs.map(tx=>{
                const d=new Date(tx.createdAt);
                const cb=Math.round(tx.amount*RATE);
                const label=(tx.note?.split(" · ")[0])||selService.label;
                return(
                  <div key={tx.id} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:"var(--card-bg)",border:"1px solid var(--border-color)",borderRadius:14,marginBottom:8}}>
                    <div style={{width:40,height:40,borderRadius:11,background:selService.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <ServiceIcon id={selService.id} color={selService.color}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</div>
                      <div style={{fontSize:11,color:"var(--text-muted)"}}>{d.toLocaleDateString("fa-IR")} · {d.toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit"})}</div>
                      <div style={{fontSize:10,color:"var(--text-muted)",marginTop:1}}>هزینه: {fa(tx.amount)} ریال</div>
                    </div>
                    <div style={{textAlign:"left",flexShrink:0}}>
                      <div style={{fontSize:16,fontWeight:900,color:"#00D6B0",lineHeight:1}}>+{fa(cb)}</div>
                      <div style={{fontSize:10,color:"rgba(0,214,176,0.5)",marginTop:3}}>تومان</div>
                    </div>
                  </div>
                );
              })}
              {hasMore&&<div style={{textAlign:"center",padding:"14px 0",color:"var(--text-muted)",fontSize:12}}>
                <div style={{display:"inline-flex",alignItems:"center",gap:6}}><div style={{width:16,height:16,border:"2px solid rgba(0,214,176,0.4)",borderTopColor:"#00D6B0",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/> در حال بارگذاری...</div>
              </div>}
            </>
          )}
        </div>
        {/* Date picker modal */}
        {showDatePicker&&createPortal(
          <div className="modal-overlay" dir="rtl">
            <div className="modal-card" style={{borderRadius:0,minHeight:"100dvh",width:"100%",maxWidth:"100%",display:"flex",flexDirection:"column",padding:0}}>
              <div className="modal-page-header"><button className="back-btn" onClick={()=>setShowDatePicker(false)}><Icon name="arrow" size={18}/></button><span>انتخاب بازه زمانی</span><div style={{width:36}}/></div>
              <div style={{padding:"8px 16px",flex:1}}>
              {([["today","امروز"],["week","یک هفته"],["month","یک ماه"],["all","کل زمان"]] as [string,string][]).map(([val,lbl],i,arr)=>(
                <button key={val} onClick={()=>{setDateFilter(val as "today"|"week"|"month"|"all");setVisibleCount(10);setShowDatePicker(false);}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"16px 0",background:"none",border:"none",borderBottom:i<arr.length-1?"1px solid rgba(120,190,210,0.08)":"none",cursor:"pointer",fontFamily:"Vazirmatn",textAlign:"right"}}>
                  <span style={{fontSize:15,color:"var(--text-primary)",fontWeight:dateFilter===val?700:400}}>{lbl}</span>
                  {dateFilter===val&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00D6B0" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
              ))}
              </div>
            </div>
          </div>,document.body
        )}
        {/* PDF modal */}
        {showPdfModal&&createPortal(
          <div className="modal-overlay" dir="rtl">
            <div className="modal-card" style={{borderRadius:0,minHeight:"100dvh",width:"100%",maxWidth:"100%",display:"flex",flexDirection:"column",padding:0}}>
              <div className="modal-page-header"><button className="back-btn" onClick={()=>setShowPdfModal(false)}><Icon name="arrow" size={18}/></button><span>دریافت گزارش PDF</span><div style={{width:36}}/></div>
              <div className="modal-page-body">
                <div style={{width:64,height:64,borderRadius:16,background:"rgba(0,214,176,0.1)",border:"1px solid rgba(0,214,176,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00D6B0" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <p style={{fontSize:13,color:"var(--text-muted)",lineHeight:1.9,textAlign:"center"}}>سرویس: <b style={{color:"var(--text-primary)"}}>{selService.label}</b><br/>بازه: <b style={{color:"var(--text-primary)"}}>{dateFilterLabel[dateFilter]}</b> · {toFaDigits(String(ftxs.length))} تراکنش</p>
                <button className="primary-button" style={{width:"100%",maxWidth:360}} onClick={generatePDF}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{display:"inline",marginLeft:6,verticalAlign:"middle"}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  دانلود PDF
                </button>
                <button className="outline-button" style={{width:"100%",maxWidth:360}} onClick={()=>setShowPdfModal(false)}>انصراف</button>
              </div>
            </div>
          </div>,document.body
        )}
      </div>
    );
  }

  return(
    <div className="subscreen" dir="rtl">
      <div className="subscreen-header">
        <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
        <h2 className="subscreen-title">بازگشت هزینه</h2>
        <button onClick={()=>setShowInfo(true)} style={{width:36,height:36,borderRadius:10,background:"rgba(0,214,176,0.08)",border:"1px solid rgba(0,214,176,0.2)",color:"var(--accent)",fontSize:15,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>؟</button>
      </div>
      <div className="subscreen-body" style={{padding:"20px 16px 80px"}}>
        <div style={{background:"linear-gradient(135deg,#032210,#042d1a)",borderRadius:22,padding:"24px",border:"1px solid rgba(0,214,176,0.2)",marginBottom:16,textAlign:"center"}}>
          <div style={{fontSize:12,color:"rgba(0,214,176,0.65)",marginBottom:10}}>مجموع بازگشت هزینه تاکنون</div>
          <div style={{fontSize:38,fontWeight:900,color:"#00D6B0",marginBottom:4,letterSpacing:-1}}>{fa(totalCashback)} <span style={{fontSize:18,opacity:0.65}}>ریال</span></div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:18}}>معادل ۰٫۱۵٪ از هزینه خدمات بانکی</div>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,215,0,0.07)",borderRadius:12,padding:"10px 18px",border:"1px solid rgba(255,215,0,0.14)"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"#FFD700",opacity:blinkTick?1:0.15,transition:"opacity 0.3s",boxShadow:blinkTick?"0 0 7px #FFD700":"none",flexShrink:0}}/>
            <span style={{fontSize:12,color:"rgba(255,215,0,0.8)"}}>در حال پردازش:</span>
            <span style={{fontSize:14,fontWeight:800,color:"#FFD700"}}>{fa(pendingCashback)} ریال</span>
          </div>
        </div>

        <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:20}}>
          {totalCashback>0&&onUpdate&&<button onClick={()=>{setWdCard(user.cards[0]?.id||"");setWdStep("select-card");setShowWithdraw(true);}} style={{flex:1,padding:"12px 16px",borderRadius:14,background:"linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.08))",border:"1.5px solid rgba(245,158,11,0.35)",color:"#f59e0b",fontFamily:"Vazirmatn",fontSize:14,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,touchAction:"manipulation"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
            برداشت
          </button>}
          <button onClick={()=>setSub("complaint")} style={{flex:1,padding:"12px 16px",borderRadius:14,background:"rgba(0,214,176,0.06)",border:"1px solid rgba(0,214,176,0.2)",color:"var(--accent)",fontFamily:"Vazirmatn",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,touchAction:"manipulation"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            اعتراض
          </button>
        </div>

        <div style={{fontSize:14,fontWeight:800,color:"var(--text-primary)",marginBottom:12}}>انتخاب خدمت</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:8}}>
          {SERVICES.filter(s=>ELIGIBLE_IDS.includes(s.id)).map(svc=>{
            const svcTxs=getServiceTxs(svc.id);
            const svcTotal=svcTxs.reduce((a,tx)=>a+Math.round(tx.amount*RATE),0);
            return(
              <button key={svc.id} onClick={()=>{setSelServiceId(svc.id);setDateFilter("today");setVisibleCount(10);setSub("service-detail");}}
                style={{display:"flex",alignItems:"center",gap:10,background:"var(--card-bg)",border:"1px solid var(--border-color)",borderRadius:14,padding:"13px 14px",cursor:"pointer",fontFamily:"Vazirmatn",textAlign:"right",transition:"border-color 0.15s"}}>
                <div style={{width:40,height:40,borderRadius:11,background:svc.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <ServiceIcon id={svc.id} color={svc.color}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{svc.label}</div>
                  {svcTotal>0
                    ?<div className="cashback-svc-amt-positive" style={{fontSize:11,fontWeight:800,marginTop:2}}>+{fa(svcTotal)}</div>
                    :<div className="cashback-svc-amt-zero" style={{fontSize:10,marginTop:2}}>۰ ریال</div>
                  }
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {showWithdraw&&createPortal(
        <div className="modal-overlay" dir="rtl">
          <div className="modal-card" style={{padding:0,borderRadius:"20px 20px 0 0",position:"fixed",bottom:0,left:0,right:0,maxWidth:"100%",margin:0}} onClick={e=>e.stopPropagation()}>
            {/* Header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 20px 16px",borderBottom:"1px solid var(--border-color)"}}>
              <button onClick={()=>{setShowWithdraw(false);setWdStep("select-card");}} style={{width:32,height:32,borderRadius:10,background:"rgba(255,255,255,0.06)",border:"1px solid var(--border-color)",color:"var(--text-muted)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
              <h3 style={{margin:0,fontSize:16,fontWeight:900,color:"var(--text-primary)"}}>برداشت بازگشت هزینه</h3>
              <div style={{width:32}}/>
            </div>
            <div style={{padding:"20px 20px 32px"}}>
              {wdStep==="select-card"&&(<>
                <div style={{background:"linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.05))",borderRadius:14,padding:"18px",marginBottom:20,textAlign:"center",border:"1px solid rgba(245,158,11,0.2)"}}>
                  <div style={{fontSize:11,color:"rgba(245,158,11,0.8)",marginBottom:6}}>مبلغ قابل برداشت</div>
                  <div style={{fontSize:32,fontWeight:900,color:"#f59e0b",letterSpacing:-1}}>{fa(totalCashback)}</div>
                  <div style={{fontSize:13,color:"rgba(245,158,11,0.6)",marginTop:4}}>ریال</div>
                </div>
                <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)",marginBottom:12}}>انتخاب کارت مقصد</div>
                {user.cards.length===0?<div style={{textAlign:"center",padding:"20px",color:"var(--text-muted)",fontSize:13}}>کارت بانکی ثبت نشده است. از پروفایل کارت اضافه کنید.</div>
                :user.cards.map(card=>(
                  <button key={card.id} onClick={()=>setWdCard(card.id)} style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"14px 16px",borderRadius:14,background:wdCard===card.id?"rgba(245,158,11,0.08)":"var(--card-bg)",border:`1.5px solid ${wdCard===card.id?"rgba(245,158,11,0.5)":"var(--border-color)"}`,cursor:"pointer",fontFamily:"Vazirmatn",textAlign:"right",marginBottom:8}}>
                    <div style={{width:40,height:28,borderRadius:6,background:"linear-gradient(135deg,#2d3748,#1a202c)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <svg width="20" height="14" viewBox="0 0 24 16" fill="none" stroke="#94a3b8" strokeWidth="1.5"><rect x="1" y="1" width="22" height="14" rx="2"/><line x1="1" y1="5" x2="23" y2="5"/></svg>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)"}}>{card.bank}</div>
                      <div style={{fontSize:11,color:"var(--text-muted)"}}>{toFaDigits(card.number.slice(-4))} ****</div>
                    </div>
                    {wdCard===card.id&&<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </button>
                ))}
                {user.cards.length>0&&<button onClick={()=>{if(wdCard)setWdStep("confirm");}} disabled={!wdCard} style={{width:"100%",marginTop:8,padding:"16px",borderRadius:14,background:wdCard?"#f59e0b":"rgba(245,158,11,0.3)",border:"none",color:"#1a1200",fontSize:15,fontWeight:800,fontFamily:"Vazirmatn",cursor:wdCard?"pointer":"not-allowed"}}>ادامه</button>}
              </>)}
              {wdStep==="confirm"&&(()=>{const card=user.cards.find(c=>c.id===wdCard);return(<>
                <div style={{background:"var(--card-bg)",borderRadius:14,padding:"16px",border:"1px solid var(--border-color)",marginBottom:16}}>
                  {[["مبلغ",`${fa(totalCashback)} ریال`],["کارت مقصد",`${card?.bank||""} **** ${toFaDigits(card?.number?.slice(-4)||"")}`],["منبع","بازگشت هزینه آن‌پرداز"]].map(([k,v])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                      <span style={{fontSize:13,color:"var(--text-muted)"}}>{k}</span>
                      <span style={{fontSize:13,fontWeight:700,color:"var(--text-primary)"}}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>setWdStep("select-card")} style={{flex:1,padding:"14px",borderRadius:12,background:"rgba(255,255,255,0.05)",border:"1px solid var(--border-color)",color:"var(--text-muted)",fontFamily:"Vazirmatn",fontSize:14,fontWeight:700,cursor:"pointer"}}>ویرایش</button>
                  <button onClick={()=>{
                    setWdStep("processing");
                    const track=genId().slice(0,10).toUpperCase();
                    setTimeout(()=>{
                      setWdTrack(track);
                      setWdStep("done");
                      const card=user.cards.find(c=>c.id===wdCard);
                      const txRecord:TxRecord={id:genId(),userId:user.phone,type:"deposit",fromAsset:"toman",toAsset:"toman",amount:totalCashback,fee:0,status:"done",createdAt:new Date().toISOString(),source:"app",note:`بازگشت هزینه · برداشت · کارت: ${card?.number?.slice(-4)||""} · شناسه: ${track}`,fromCard:wdCard};
                      onUpdate&&onUpdate({...user,tomanBalance:user.tomanBalance+totalCashback},txRecord);
                    },2200);
                  }} style={{flex:2,padding:"14px",borderRadius:12,background:"#f59e0b",border:"none",color:"#1a1200",fontSize:15,fontWeight:800,fontFamily:"Vazirmatn",cursor:"pointer"}}>تأیید و برداشت</button>
                </div>
              </>);})()}
              {wdStep==="processing"&&<div style={{textAlign:"center",padding:"32px 0"}}>
                <div style={{width:56,height:56,borderRadius:"50%",border:"3px solid rgba(245,158,11,0.2)",borderTopColor:"#f59e0b",margin:"0 auto 16px",animation:"spin 0.8s linear infinite"}}/>
                <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)"}}>در حال پردازش...</div>
              </div>}
              {wdStep==="done"&&<div style={{textAlign:"center",padding:"16px 0"}}>
                <div style={{width:64,height:64,borderRadius:"50%",background:"rgba(245,158,11,0.1)",border:"2px solid rgba(245,158,11,0.35)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{fontSize:18,fontWeight:900,color:"#f59e0b",marginBottom:8}}>برداشت با موفقیت انجام شد</div>
                <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:6}}>{fa(totalCashback)} ریال به کارت شما واریز شد</div>
                <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:20}}>شناسه پیگیری: {toFaDigits(wdTrack)}</div>
                <button onClick={()=>{setShowWithdraw(false);setWdStep("select-card");}} style={{width:"100%",padding:"14px",borderRadius:12,background:"#f59e0b",border:"none",color:"#1a1200",fontSize:15,fontWeight:800,fontFamily:"Vazirmatn",cursor:"pointer"}}>بستن</button>
              </div>}
            </div>
          </div>
        </div>,document.body
      )}
      {showInfo&&createPortal(
        <div className="modal-overlay" onClick={()=>setShowInfo(false)}>
          <div className="modal-card" onClick={e=>e.stopPropagation()} style={{maxWidth:340,padding:"28px 24px"}} dir="rtl">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <h3 style={{margin:0,fontSize:17,fontWeight:900,color:"var(--text-primary)"}}>بازگشت هزینه چیه؟</h3>
              <button onClick={()=>setShowInfo(false)} style={{width:32,height:32,borderRadius:10,background:"rgba(255,255,255,0.06)",border:"1px solid var(--border-color)",color:"var(--text-muted)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>✕</button>
            </div>
            <p style={{fontSize:14,color:"var(--text-muted)",lineHeight:2,marginBottom:18}}>آن‌پرداز بخشی از درآمد حاصل از خدمات مالی را مستقیماً به کاربران برمی‌گرداند — بدون درخواست، بدون پیچیدگی.</p>
            {([
              [<svg key="a" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D6B0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>,"۰٫۱۵٪ از هر تراکنش","به ازای هر خدمت بانکی، ۰٫۱۵٪ مبلغ به حساب شما بازمی‌گردد."],
              [<svg key="b" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D6B0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,"پردازش خودکار","مبالغ بازگشتی بدون نیاز به درخواست، به‌صورت خودکار واریز می‌شوند."],
              [<svg key="c" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D6B0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,"شفاف و قابل ردیابی","تمام تراکنش‌ها را می‌توانید در این بخش مشاهده و بررسی کنید."],
            ] as [React.ReactNode,string,string][]).map(([icon,title,desc])=>(
              <div key={title} style={{display:"flex",gap:12,marginBottom:16}}>
                <div style={{width:40,height:40,borderRadius:11,background:"rgba(0,214,176,0.08)",border:"1px solid rgba(0,214,176,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{icon}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:"var(--text-primary)",marginBottom:3}}>{title}</div>
                  <div style={{fontSize:12,color:"var(--text-muted)",lineHeight:1.7}}>{desc}</div>
                </div>
              </div>
            ))}
            <button className="primary-button" style={{width:"100%",marginTop:4}} onClick={()=>setShowInfo(false)}>متوجه شدم</button>
          </div>
        </div>,document.body
      )}
    </div>
  );
}

// ─── Help System ─────────────────────────────────────────────────────────────
const SVC_GUIDE_INFO:Record<string,{title:string;text:string}>={
  "card-balance":{title:"موجودی کارت",text:"با لمس این دکمه می‌توانید موجودی لحظه‌ای کارت‌های بانکی خود را بررسی کنید."},
  "transfer":{title:"انتقال وجه",text:"برای کارت به کارت سریع و امن از این بخش استفاده کنید."},
  "charge":{title:"شارژ",text:"از این بخش می‌توانید سیم‌کارت خود یا دیگران را به‌راحتی شارژ کنید."},
  "internet":{title:"بسته اینترنت",text:"برای خرید بسته اینترنت تلفن همراه تمام اپراتورها از این بخش استفاده کنید."},
  "bills":{title:"قبض",text:"پرداخت آب، برق، گاز، تلفن و تمام قبض‌ها در یک‌جا."},
  "charity":{title:"نیکوکاری",text:"از این بخش می‌توانید به موسسات خیریه معتبر کمک کنید."},
  "third-party-ins":{title:"بیمه ثالث",text:"بیمه شخص ثالث خودرو را مستقیماً از اینجا استعلام و پرداخت کنید."},
  "body-ins":{title:"بیمه بدنه",text:"خدمات بیمه بدنه خودرو را از این بخش دریافت کنید."},
  "moto-ins":{title:"بیمه موتور",text:"بیمه موتورسیکلت را بدون مراجعه حضوری از اینجا تهیه کنید."},
  "violations":{title:"خلافی خودرو",text:"خلافی‌های ثبت‌شده برای خودروهای شما را استعلام و پرداخت کنید."},
  "freeway":{title:"عوارض آزادراه",text:"عوارض الکترونیکی آزادراه را بدون توقف از اینجا پرداخت کنید."},
  "tehran-traffic":{title:"طرح ترافیک",text:"طرح زوج‌وفرد و محدودیت‌های ترافیکی تهران را از این بخش مدیریت کنید."},
  "sana":{title:"ثبت ثنا",text:"از این بخش می‌توانید اطلاعات ثنا (سیستم ثبت ملی اسناد) خود را ثبت و احراز هویت کنید."},
  "judiciary-bill":{title:"قبض قضایی",text:"پرداخت جریمه‌ها و هزینه‌های مرتبط با قوه قضاییه از این بخش انجام می‌شود."},
  "property-reg":{title:"ثبت اسناد",text:"خدمات ثبت اسناد و هزینه‌های مرتبط با اداره ثبت را از اینجا پرداخت کنید."},
  "credit-score":{title:"رتبه اعتباری",text:"رتبه اعتباری شما میزان اعتماد بانک‌ها و موسسات مالی به شماست. اینجا می‌توانید رتبه خود را بررسی کنید."},
  "cashback":{title:"بازگشت هزینه",text:"بخشی از کارمزدهایی که پیش‌تر در تراکنش‌های مالی خود مانند انتقال وجه، خرید بسته اینترنت و شارژ پرداخت کرده‌اید، از طریق «بازگشت هزینه» به‌صورت خودکار به حساب شما بازگردانده می‌شود."},
  "all-services":{title:"همه خدمات",text:"با لمس این دکمه به فهرست کامل تمام خدمات آن‌پرداز دسترسی دارید. می‌توانید خدمات دلخواه را به صفحه اصلی اضافه کنید."},
  "platform-an-hoosh":{title:"آن هوش",text:"آن هوش دستیار هوش مصنوعی آن‌پرداز است. با استفاده از مدل‌های پیشرفته‌ای مانند ChatGPT، Claude و Gemini، می‌توانید به سؤالات پاسخ بگیرید، متن بنویسید، کد تولید کنید و تحلیل انجام دهید."},
  "platform-an-market":{title:"آن مارکت",text:"آن مارکت یک پلتفرم خرید هوشمند است. دستیار هوش مصنوعی آن به شما کمک می‌کند تا بهترین قیمت را از بین صدها فروشگاه پیدا کرده و با اطمینان خرید کنید."},
  "platform-an-banner":{title:"آن بنر",text:"آن بنر پلتفرم ثبت آگهی رایگان آن‌پرداز است. می‌توانید آگهی رایگان ثبت کنید، محصولات و خدمات خود را معرفی کنید و سریع‌تر به خریداران دسترسی داشته باشید."},
  "platform-financial-center":{title:"مرکز مالی",text:"مرکز مالی داشبورد یکپارچه وضعیت مالی شماست. تمام درآمدها و هزینه‌ها به‌صورت خودکار ثبت و تحلیل می‌شوند؛ حتی خریدهایی که با کارت بانکی در فروشگاه‌ها انجام می‌دهید."},
  "platform-an-sarraf":{title:"آن صراف",text:"آن صراف صرافی دیجیتال آن‌پرداز است. از اینجا می‌توانید ارزهای دیجیتال خود را خرید، فروش و مدیریت کنید. ربات فارکس نیز در داخل همین بخش در دسترس است."},
  "an-market":{title:"آن مارکت",text:"آن مارکت یک پلتفرم خرید هوشمند است. دستیار هوش مصنوعی قیمت‌ها را از صدها فروشگاه مقایسه می‌کند تا بهترین پیشنهاد را پیدا کنید."},
  "an-banner":{title:"آن بنر",text:"آن بنر پلتفرم ثبت آگهی رایگان است. می‌توانید آگهی بدهید و محصولات یا خدمات خود را به دیگران معرفی کنید."},
  "financial-center":{title:"مرکز مالی",text:"مرکز مالی داشبورد یکپارچه وضعیت مالی شماست. تمام درآمدها و هزینه‌ها به‌صورت خودکار ثبت و تحلیل می‌شوند."},
  "exchange":{title:"آن صراف",text:"آن صراف صرافی دیجیتال آن‌پرداز است. خرید، فروش و مدیریت ارزهای دیجیتال در اینجا انجام می‌شود. ربات فارکس نیز در داخل آن صراف در دسترس است."},
};
function buildHomeTourSteps(homeServices:string[],homePlatforms?:string[]){
  const steps:{q:string;title:string;text:string}[]=[
    {q:"[data-help-id='brand']",title:"آن‌پرداز",text:"به صفحه اصلی آن‌پرداز خوش آمدید. از اینجا می‌توانید به تمام خدمات مالی دسترسی داشته باشید."},
    {q:"[data-help-id='help-btn']",title:"راهنمای آن‌پرداز",text:"هر زمان سوال داشتید از این دکمه برای مشاهده راهنمای تعاملی استفاده کنید."},
    {q:"[data-help-id='avatar-btn']",title:"پروفایل",text:"از اینجا می‌توانید اطلاعات حساب کاربری، کارت‌های بانکی و تنظیمات را مدیریت کنید."},
  ];
  for(const sid of homeServices){
    const info=SVC_GUIDE_INFO[sid];
    if(info)steps.push({q:`[data-help-id='svc-${sid}']`,title:info.title,text:info.text});
  }
  // همه خدمات step
  const allSvcInfo=SVC_GUIDE_INFO["all-services"];
  if(allSvcInfo)steps.push({q:"[data-help-id='all-services-btn']",title:allSvcInfo.title,text:allSvcInfo.text});
  // Platform steps in spec order: an-market, an-banner, financial-center, an-sarraf
  const platformOrder=["an-market","an-banner","financial-center","an-sarraf"];
  for(const pid of platformOrder){
    const info=SVC_GUIDE_INFO[`platform-${pid}`];
    if(info)steps.push({q:`[data-help-id='platform-${pid}']`,title:info.title,text:info.text});
  }
  steps.push(
    {q:"[data-help-id='nav-history']",title:"تراکنش‌ها",text:"در این بخش می‌توانید تراکنش‌های انجام‌شده و جزئیات آن‌ها را مشاهده کنید."},
    {q:"[data-help-id='nav-home']",title:"خانه",text:"این صفحه اصلی برنامه است. از هر کجا می‌توانید به اینجا بازگردید."},
    {q:"[data-help-id='nav-profile']",title:"پروفایل",text:"برای مشاهده و مدیریت اطلاعات حساب کاربری خود وارد این بخش شوید."},
  );
  return steps;
}
interface HStep{text:string;voice?:string;query?:string;hint?:string;automs?:number}
interface HGuide{id:string;title:string;icon:React.ReactNode;desc:string;steps:HStep[]}

const HELP_GUIDES:HGuide[]=[
  {id:"general",title:"راهنمای کلی",icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,desc:"آشنایی با صفحه اصلی و خدمات",steps:[
    {text:"به آن‌پرداز خوش آمدید. این آموزش شما را با قسمت‌های مختلف اپلیکیشن آشنا می‌کند.",voice:"به آن‌پرداز خوش آمدید. این آموزش شما را با قسمت‌های مختلف اپلیکیشن آشنا می‌کند.",automs:3500},
    {text:"در بالای صفحه بنرهای اطلاعاتی و تبلیغاتی نمایش داده می‌شوند که با کشیدن انگشت می‌توانید بین آن‌ها جابجا شوید.",voice:"در بالای صفحه بنرهای اطلاعاتی نمایش داده می‌شوند.",query:".app-content"},
    {text:"بخش «خدمات» دسترسی سریع به تمام امکانات بانکی را فراهم می‌کند؛ از انتقال وجه تا قبض، بیمه و بسیاری دیگر.",voice:"بخش خدمات دسترسی سریع به تمام امکانات بانکی را فراهم می‌کند.",query:".services-grid"},
    {text:"با زدن روی هر سرویس وارد آن بخش می‌شوید. مثلاً «انتقال وجه» برای کارت به کارت، یا «قبض» برای پرداخت قبض‌های آب، برق و گاز.",voice:"با زدن روی هر سرویس وارد آن بخش می‌شوید.",query:".service-btn"},
    {text:"«آن مارکت» یک پلتفرم خرید هوشمند است که با دستیار هوش مصنوعی به شما کمک می‌کند بهترین قیمت را در بین صدها فروشگاه پیدا کنید. کافی است بنویسید چه چیزی می‌خواهید!",voice:"آن مارکت یک پلتفرم خرید هوشمند است که با دستیار هوش مصنوعی بهترین قیمت را پیدا می‌کند.",query:"[data-sid='an-market']"},
    {text:"«آن‌یاب» به‌زودی در آن‌پرداز راه‌اندازی می‌شود و امکانات جدیدی برای یافتن خدمات اطراف شما خواهد داشت. این دکمه در حال حاضر غیرفعال است.",voice:"آن‌یاب به‌زودی راه‌اندازی می‌شود.",query:"[data-sid='an-yab']"},
    {text:"دکمه «بازگشت هزینه» نشان می‌دهد چه مقدار از هزینه‌های پرداختی شما توسط آن‌پرداز بازگشت داده شده است.",voice:"دکمه بازگشت هزینه نشان می‌دهد چه مقدار از هزینه‌های پرداختی بازگشت داده شده است."},
    {text:"«تراکنش‌های اخیر» در پایین صفحه آخرین فعالیت‌های مالی شما را نشان می‌دهد.",voice:"تراکنش‌های اخیر در پایین صفحه آخرین فعالیت‌های مالی شما را نشان می‌دهد."},
    {text:"منوی پایین صفحه شامل سه بخش اصلی است: خانه، تراکنش‌ها و پروفایل. می‌توانید هر لحظه بین آن‌ها جابجا شوید.",voice:"منوی پایین صفحه شامل خانه، تراکنش‌ها و پروفایل است.",query:".bottom-nav"},
    {text:"آموزش کلی به پایان رسید. برای یادگیری بیشتر، راهنماهای تخصصی هر بخش را انتخاب کنید.",voice:"آموزش کلی به پایان رسید.",automs:3000},
  ]},
  {id:"transfer",title:"انتقال وجه",icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3l4 4-4 4"/><path d="M3 7h18"/><path d="M7 21l-4-4 4-4"/><path d="M21 17H3"/></svg>,desc:"نحوه انتقال پول بین کارت‌های بانکی",steps:[
    {text:"در این آموزش یاد می‌گیرید چطور وجه منتقل کنید. تمام اطلاعات نمایش‌داده‌شده نمونه آموزشی هستند و هیچ تراکنش واقعی انجام نمی‌شود.",voice:"در این آموزش یاد می‌گیرید چطور وجه منتقل کنید. تمام اطلاعات نمونه آموزشی هستند.",automs:4500},
    {text:"از بخش «خدمات» در صفحه اصلی روی «انتقال وجه» ضربه بزنید تا وارد صفحه انتقال وجه شوید.",voice:"از بخش خدمات روی انتقال وجه ضربه بزنید.",query:".service-btn",hint:"انتقال وجه را انتخاب کنید"},
    {text:"در صفحه انتقال وجه، ابتدا باید کارت بانکی مبدا را انتخاب کنید. روی بخش «انتخاب کارت» در بالای فرم ضربه بزنید.",voice:"ابتدا باید کارت بانکی مبدا را انتخاب کنید.",hint:"کارت مبدا"},
    {text:"از لیست کارت‌های بانکی ثبت‌شده، کارت مورد نظر را انتخاب کنید. اگر کارتی اضافه نکرده‌اید، ابتدا از بخش پروفایل کارت بانکی ثبت کنید.",voice:"از لیست کارت‌های بانکی ثبت‌شده، کارت مورد نظر را انتخاب کنید."},
    {text:"شماره ۱۶ رقمی کارت مقصد را در این فیلد وارد کنید. می‌توانید از دکمه «چسباندن» نیز استفاده کنید. شماره نمونه: ۶۱۰۴‌۳۳۷۷‌۱۲۳۴‌۵۶۷۸",voice:"شماره شانزده رقمی کارت مقصد را وارد کنید.",hint:"فیلد کارت مقصد"},
    {text:"مبلغ مورد نظر را به ریال در فیلد مبلغ وارد کنید. حداقل مبلغ انتقال ۵۰۰٫۰۰۰ ریال است.",voice:"مبلغ مورد نظر را به ریال وارد کنید.",hint:"فیلد مبلغ"},
    {text:"می‌توانید یک توضیح دلخواه اضافه کنید، مثلاً «هزینه اجاره» یا «بدهی». این قسمت اختیاری است.",voice:"می‌توانید یک توضیح دلخواه اضافه کنید."},
    {text:"پس از بررسی اطلاعات، روی «مرحله بعد» ضربه بزنید تا به صفحه تأیید و دریافت رمز پویا بروید.",voice:"روی مرحله بعد ضربه بزنید.",hint:"دکمه مرحله بعد"},
    {text:"در این صفحه باید رمز پویا (OTP) دریافت کنید. روی «رمز پویا» ضربه بزنید، کد پیامک‌شده را وارد کنید و CVV2 کارت را تکمیل کنید.",voice:"رمز پویا دریافت کنید و آن را وارد کنید."},
    {text:"پس از تأیید نهایی، تراکنش انجام شده و رسید آن نمایش داده می‌شود. آموزش انتقال وجه با موفقیت به پایان رسید.",voice:"پس از تأیید نهایی، تراکنش انجام می‌شود.",automs:3500},
  ]},
  {id:"exchange",title:"صرافی دیجیتال",icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,desc:"راهنمای صرافی ارز دیجیتال آن‌پرداز",steps:[
    {text:"به راهنمای صرافی آن‌پرداز خوش آمدید. در این بخش می‌توانید ارزهای دیجیتال را خرید، فروش و مدیریت کنید.",voice:"به راهنمای صرافی آن‌پرداز خوش آمدید.",automs:3500},
    {text:"برای ورود به صرافی، از منوی پایین روی آیکون صرافی (نمودار) ضربه بزنید.",voice:"برای ورود به صرافی، از منوی پایین روی آیکون صرافی ضربه بزنید.",query:".bottom-nav"},
    {text:"در صفحه اصلی صرافی موجودی تومان و دلار تتر شما نمایش داده می‌شود. برای شارژ موجودی از دکمه «افزایش موجودی» استفاده کنید.",voice:"در صفحه اصلی صرافی موجودی تومان و دلار تتر شما نمایش داده می‌شود."},
    {text:"از بخش «بازارها» می‌توانید قیمت لحظه‌ای بیت‌کوین، اتریوم، تتر و ۲۱ ارز دیجیتال دیگر را مشاهده کنید.",voice:"از بخش بازارها می‌توانید قیمت لحظه‌ای ارزهای دیجیتال را مشاهده کنید."},
    {text:"«معامله آنی» ساده‌ترین روش خرید و فروش است. مقدار دلخواه را انتخاب کنید و با یک ضربه معامله کنید.",voice:"معامله آنی ساده‌ترین روش خرید و فروش است."},
    {text:"«معامله اسپات» برای تریدرهای حرفه‌ای است. می‌توانید سفارش قیمت ثابت، قیمت بازار یا حد ضرر ثبت کنید.",voice:"معامله اسپات برای تریدرهای حرفه‌ای است."},
    {text:"«معامله تعهدی» (مارجین) به شما اجازه می‌دهد با اهرم تا ۱۰۰ برابر معامله کنید. این نوع معامله ریسک بسیار بالایی دارد و فقط برای متخصصان مناسب است.",voice:"معامله تعهدی ریسک بسیار بالایی دارد و فقط برای متخصصان مناسب است."},
    {text:"از بخش «واریز» می‌توانید کریپتو به کیف پول صرافی خود واریز کنید. آدرس واریز منحصربه‌فرد شما در اینجا نمایش داده می‌شود.",voice:"از بخش واریز می‌توانید کریپتو به کیف پول خود واریز کنید."},
    {text:"از بخش «برداشت» می‌توانید ارز دیجیتال به کیف پول خارجی ارسال کنید. آدرس مقصد را با دقت کامل وارد کنید، زیرا معاملات بلاک‌چین برگشت‌پذیر نیستند.",voice:"از بخش برداشت می‌توانید ارز دیجیتال به کیف پول خارجی ارسال کنید. آدرس مقصد را با دقت وارد کنید."},
    {text:"تاریخچه معاملات تمام خرید، فروش، واریز و برداشت‌های صرافی شما را با جزئیات کامل نشان می‌دهد. آموزش صرافی به پایان رسید.",voice:"آموزش صرافی به پایان رسید.",automs:3500},
  ]},
  {id:"cashback",title:"بازگشت هزینه",icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>,desc:"سیستم بازگشت بخشی از هزینه‌های پرداختی",steps:[
    {text:"بازگشت هزینه یکی از ویژگی‌های منحصربه‌فرد آن‌پرداز است. آن‌پرداز بخشی از درآمد حاصل از هر تراکنش را مستقیماً به شما برمی‌گرداند.",voice:"بازگشت هزینه یکی از ویژگی‌های منحصربه‌فرد آن‌پرداز است.",automs:4000},
    {text:"برای مشاهده بازگشت هزینه‌های خود، روی دکمه «بازگشت هزینه» در صفحه اصلی ضربه بزنید.",voice:"روی دکمه بازگشت هزینه در صفحه اصلی ضربه بزنید."},
    {text:"در صفحه بازگشت هزینه، مجموع تمام مبالغ برگشتی و مبالغ «در حال پردازش» به صورت مجزا نمایش داده می‌شود.",voice:"مجموع مبالغ برگشتی و مبالغ در حال پردازش نمایش داده می‌شود."},
    {text:"برای هر سرویسی که استفاده کرده‌اید یک کارت جداگانه نمایش داده می‌شود که مجموع مبلغ برگشتی آن سرویس را نشان می‌دهد.",voice:"برای هر سرویس یک کارت جداگانه با مجموع مبلغ برگشتی نمایش داده می‌شود."},
    {text:"با ضربه روی هر کارت سرویس، وارد صفحه جزئیات آن سرویس می‌شوید. در اینجا می‌توانید فیلتر زمانی اعمال کنید.",voice:"با ضربه روی هر کارت سرویس، وارد صفحه جزئیات می‌شوید."},
    {text:"فیلترهای زمانی «امروز»، «یک هفته»، «یک ماه» و «کل زمان» به شما کمک می‌کند تراکنش‌های هر دوره را مجزا ببینید.",voice:"فیلترهای زمانی امروز، یک هفته، یک ماه و کل زمان به شما کمک می‌کند."},
    {text:"از دکمه «دریافت گزارش PDF» می‌توانید گزارش مالی بازگشت هزینه را با تمام جزئیات دانلود کنید.",voice:"از دکمه دریافت گزارش پی دی اف می‌توانید گزارش مالی دانلود کنید."},
    {text:"اگر مبلغ بازگشتی اشتباه است یا تراکنشی در لیست نیست، از دکمه «اعتراض» می‌توانید گزارش دهید. آموزش بازگشت هزینه تمام شد.",voice:"از دکمه اعتراض می‌توانید مغایرت‌ها را گزارش دهید. آموزش بازگشت هزینه تمام شد.",automs:3500},
  ]},
  {id:"forex",title:"ربات فارکس",icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="4"/><path d="M8 12l2 2 4-4"/><circle cx="12" cy="12" r="2" fill="currentColor" strokeWidth="0"/></svg>,desc:"فعال‌سازی و مدیریت ربات معاملاتی فارکس",steps:[
    {text:"ربات فارکس آن‌پرداز به صورت خودکار در بازار فارکس بین‌الملل برای شما معامله می‌کند. توجه داشته باشید که معاملات فارکس ریسک بالایی دارند.",voice:"ربات فارکس آن‌پرداز به صورت خودکار در بازار فارکس برای شما معامله می‌کند.",automs:4000},
    {text:"برای دسترسی به ربات فارکس، از منوی پایین وارد صرافی شوید. سپس در صفحه اصلی صرافی روی دکمه «ربات فارکس» ضربه بزنید.",voice:"از منوی پایین وارد صرافی شوید و روی دکمه ربات فارکس ضربه بزنید.",query:".bottom-nav"},
    {text:"در صفحه ربات، مقدار دلار تتر مورد نظر برای تخصیص به ربات را وارد کنید. حداقل ۳ دلار تتر به عنوان ذخیره نگه داشته می‌شود.",voice:"مقدار دلار تتر مورد نظر برای تخصیص به ربات را وارد کنید."},
    {text:"قبل از فعال‌سازی، حتماً هشدارهای ریسک را مطالعه کنید. سرمایه‌ای تخصیص دهید که آمادگی از دست دادن آن را دارید.",voice:"قبل از فعال‌سازی، هشدارهای ریسک را مطالعه کنید."},
    {text:"پس از تأیید هشدارها، روی «فعال‌سازی ربات فارکس آن‌پرداز» بزنید. ربات ظرف چند دقیقه متصل می‌شود.",voice:"روی فعال‌سازی ربات فارکس بزنید."},
    {text:"پس از فعال‌سازی، نمودار عملکرد با اطلاعات سود و زیان هر جلسه نمایش داده می‌شود. آمار کلی معاملات نیز در کارت‌های آماری قابل مشاهده است.",voice:"پس از فعال‌سازی، نمودار عملکرد و آمار معاملات نمایش داده می‌شود."},
    {text:"برای غیرفعال کردن ربات، روی «مشاهده نمودار زنده ربات» بزنید و دکمه «غیرفعال کردن» را تأیید کنید. سود/زیان نهایی محاسبه و به موجودی شما اضافه می‌شود.",voice:"برای غیرفعال کردن ربات، روی مشاهده نمودار زنده ربات بزنید.",automs:3500},
  ]},
];

function HelpSystem({onClose,userPhone,homeServices,homePlatforms}:{onClose:()=>void;userPhone?:string;homeServices?:string[];homePlatforms?:string[]}){
  // Build steps once at mount using a ref — never rebuilds on prop change, preventing restarts
  const stepsRef=useRef<{q:string;title:string;text:string}[]>([]);
  if(stepsRef.current.length===0){
    stepsRef.current=buildHomeTourSteps(homeServices??[],homePlatforms);
  }
  const STEPS=stepsRef.current;

  const [step,setStep]=useState(0);
  const [hlRect,setHlRect]=useState<{top:number;left:number;width:number;height:number}|null>(null);
  const mountedRef=useRef(true);
  const pendingTimerRef=useRef<ReturnType<typeof setTimeout>|null>(null);

  // Clears any in-flight scroll+measure timer
  const clearPending=()=>{if(pendingTimerRef.current){clearTimeout(pendingTimerRef.current);pendingTimerRef.current=null;}};

  const goTo=useCallback((idx:number,retries=0)=>{
    if(!mountedRef.current)return;
    if(idx<0||idx>=STEPS.length)return;
    clearPending();
    const s=STEPS[idx];
    const el=document.querySelector(s.q) as HTMLElement|null;
    if(!el&&retries<10){
      pendingTimerRef.current=setTimeout(()=>goTo(idx,retries+1),250);
      return;
    }
    // Update step immediately so tooltip content changes right away (no flicker)
    setStep(idx);
    if(!el){setHlRect(null);return;}
    const cs=window.getComputedStyle(el);
    const isFixed=cs.position==="fixed"||!!el.closest(".bottom-nav");
    const measure=()=>{
      if(!mountedRef.current)return;
      const r=el.getBoundingClientRect();
      setHlRect({top:r.top-8,left:r.left-8,width:r.width+16,height:r.height+16});
    };
    if(isFixed){
      pendingTimerRef.current=setTimeout(measure,80);
    } else {
      el.scrollIntoView({behavior:"smooth",block:"center"});
      pendingTimerRef.current=setTimeout(measure,400);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);// intentionally empty — STEPS is stable (ref), goTo must never change

  // Run only once on mount
  useEffect(()=>{
    mountedRef.current=true;
    pendingTimerRef.current=setTimeout(()=>goTo(0),350);
    return()=>{
      mountedRef.current=false;
      clearPending();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);// truly runs once

  const cur=STEPS[step]||STEPS[0];
  const isLast=step===STEPS.length-1;
  const close=useCallback(()=>{
    clearPending();
    const k=userPhone?`anp_tour_done_${userPhone}`:"anp_tour_done";
    localStorage.setItem(k,"1");
    onClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[userPhone,onClose]);
  const next=()=>isLast?close():goTo(step+1);
  const prev=()=>{if(step>0)goTo(step-1);};
  useBackHandler(close);

  const winW=typeof window!=="undefined"?window.innerWidth:390;
  const winH=typeof window!=="undefined"?window.innerHeight:844;
  const PW=284;
  let popStyle:React.CSSProperties={width:PW};
  let arrowDir:"up"|"down"="up";
  let arrowLeft=PW/2-9;

  if(hlRect){
    const tCX=hlRect.left+hlRect.width/2;
    const pl=Math.max(10,Math.min(tCX-PW/2,winW-PW-10));
    arrowLeft=Math.max(12,Math.min(tCX-pl-9,PW-30));
    if(hlRect.top+hlRect.height/2<winH*0.52){
      popStyle={...popStyle,top:hlRect.top+hlRect.height+14,left:pl};arrowDir="up";
    } else {
      popStyle={...popStyle,bottom:winH-hlRect.top+14,left:pl};arrowDir="down";
    }
  } else {
    popStyle={...popStyle,top:winH/2-90,left:winW/2-PW/2};
  }

  return createPortal(<div style={{position:"fixed",inset:0,zIndex:99999,fontFamily:"Vazirmatn"}} dir="rtl">
    {/* Background overlay — always present, never remounted */}
    <div style={{position:"fixed",inset:0,zIndex:1}} onClick={close}/>
    {/* Dark overlay with spotlight cutout */}
    {hlRect
      ?<div style={{position:"fixed",top:hlRect.top,left:hlRect.left,width:hlRect.width,height:hlRect.height,borderRadius:13,boxShadow:"0 0 0 9999px rgba(0,8,20,0.82)",zIndex:2,pointerEvents:"none"}}/>
      :<div style={{position:"fixed",inset:0,background:"rgba(0,8,20,0.82)",zIndex:2,pointerEvents:"none"}}/>}
    {/* Glow border around highlighted element */}
    {hlRect&&<div style={{position:"fixed",top:hlRect.top,left:hlRect.left,width:hlRect.width,height:hlRect.height,borderRadius:13,border:"2.5px solid rgba(0,214,176,0.9)",boxShadow:"0 0 0 4px rgba(0,214,176,0.14),0 0 28px rgba(0,214,176,0.42)",zIndex:3,pointerEvents:"none",animation:"help-glow 1.8s ease-in-out infinite"}}/>}
    {/* Tooltip popup — always mounted, content updates without remounting */}
    <div onClick={e=>e.stopPropagation()} style={{position:"fixed",...popStyle,background:"linear-gradient(150deg,#071D2C 0%,#0b2738 100%)",border:"1px solid rgba(0,214,176,0.28)",borderRadius:18,padding:"14px 16px 13px",zIndex:4,boxShadow:"0 16px 48px rgba(0,0,0,0.7),0 0 0 1px rgba(0,214,176,0.06)"}}>
      {/* Speech bubble arrow */}
      {hlRect&&arrowDir==="up"&&<>
        <div style={{position:"absolute",top:-9,left:arrowLeft,width:0,height:0,borderLeft:"9px solid transparent",borderRight:"9px solid transparent",borderBottom:"9px solid rgba(0,214,176,0.28)"}}/>
        <div style={{position:"absolute",top:-7,left:arrowLeft+1,width:0,height:0,borderLeft:"8px solid transparent",borderRight:"8px solid transparent",borderBottom:"8px solid #071D2C"}}/>
      </>}
      {hlRect&&arrowDir==="down"&&<>
        <div style={{position:"absolute",bottom:-9,left:arrowLeft,width:0,height:0,borderLeft:"9px solid transparent",borderRight:"9px solid transparent",borderTop:"9px solid rgba(0,214,176,0.28)"}}/>
        <div style={{position:"absolute",bottom:-7,left:arrowLeft+1,width:0,height:0,borderLeft:"8px solid transparent",borderRight:"8px solid transparent",borderTop:"8px solid #0b2738"}}/>
      </>}
      {/* Title row */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:"#00D6B0",flexShrink:0,boxShadow:"0 0 6px #00D6B0"}}/>
          <span style={{fontSize:14,fontWeight:800,color:"#00D6B0"}}>{cur.title}</span>
        </div>
        <button onClick={close} title="خروج از راهنما" style={{width:26,height:26,borderRadius:8,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.45)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:13,lineHeight:1,fontFamily:"sans-serif"}}>✕</button>
      </div>
      {/* Progress bar */}
      <div style={{height:2,background:"rgba(255,255,255,0.07)",borderRadius:2,marginBottom:10,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${(step+1)/STEPS.length*100}%`,background:"linear-gradient(90deg,#00D6B0,#00bba0)",transition:"width 0.35s ease",borderRadius:2}}/>
      </div>
      {/* Body text */}
      <p style={{fontSize:13,color:"rgba(244,250,252,0.9)",lineHeight:1.82,margin:"0 0 13px",fontWeight:500}}>{cur.text}</p>
      {/* Controls */}
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <button onClick={prev} disabled={step===0} style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:step===0?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.75)",cursor:step===0?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <button onClick={next} style={{flex:1,height:36,borderRadius:10,background:"linear-gradient(135deg,rgba(0,214,176,0.18),rgba(0,185,160,0.24))",border:"1px solid rgba(0,214,176,0.36)",color:"#00D6B0",cursor:"pointer",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontFamily:"Vazirmatn"}}>
          {isLast?"پایان":"بعدی"}
          {!isLast&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>}
        </button>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",minWidth:32,textAlign:"center",flexShrink:0}}>{toFaDigits(String(step+1))}/{toFaDigits(String(STEPS.length))}</div>
      </div>
    </div>
  </div>,document.body);
}

// ─── Financial Center Screen ──────────────────────────────────────────────────
function FinancialCenterScreen({transactions,onBack,user}:{transactions:TxRecord[];onBack:()=>void;user:UserData}){
  type ViewMode="day"|"month"|"year";
  type SelTxType={id:string;note?:string;type?:string;createdAt:string;isIncome:boolean;isExpense:boolean;isInternal:boolean;category:string;irr:number};
  const [viewMode,setViewMode]=useState<ViewMode>("day");
  const [selDate,setSelDate]=useState(()=>new Date());
  const [selTx,setSelTx]=useState<SelTxType|null>(null);
  useBackHandler(onBack);

  const now=new Date();

  // Classify a transaction into financial impact
  const classify=(tx:TxRecord)=>{
    const irr=tx.fromAsset==="toman"?tx.amount:tx.convertedAmount?tx.convertedAmount:tx.amount;
    if(tx.type==="swap")return{isIncome:false,isExpense:false,isInternal:true,category:"صرافی",irr};
    if(tx.type==="deposit")return{isIncome:true,isExpense:false,isInternal:false,category:"واریز",irr};
    if(tx.type==="withdraw")return{isIncome:false,isExpense:true,isInternal:false,category:"برداشت",irr};
    if(tx.type==="transfer")return{isIncome:false,isExpense:true,isInternal:false,category:"انتقال وجه",irr};
    if(tx.type==="service"){
      const n=(tx.note||"").toLowerCase();
      if(n.includes("شارژ")||n.includes("بسته اینترنت"))return{isIncome:false,isExpense:true,isInternal:false,category:"شارژ",irr};
      if(n.includes("قبض")||n.includes("برق")||n.includes("آب")||n.includes("گاز"))return{isIncome:false,isExpense:true,isInternal:false,category:"قبوض",irr};
      if(n.includes("نیکوکاری"))return{isIncome:false,isExpense:true,isInternal:false,category:"نیکوکاری",irr};
      if(n.includes("خلافی")||n.includes("عوارض")||n.includes("ترافیک"))return{isIncome:false,isExpense:true,isInternal:false,category:"حمل‌ونقل",irr};
      if(n.includes("بیمه"))return{isIncome:false,isExpense:true,isInternal:false,category:"بیمه",irr};
      return{isIncome:false,isExpense:true,isInternal:false,category:"سایر",irr};
    }
    return{isIncome:false,isExpense:false,isInternal:true,category:"سایر",irr};
  };

  const doneTxs=transactions.filter(tx=>tx.status==="done");

  const isInDay=(tx:TxRecord,d:Date)=>{const t=new Date(tx.createdAt);return t.getFullYear()===d.getFullYear()&&t.getMonth()===d.getMonth()&&t.getDate()===d.getDate();};
  const isInMonth=(tx:TxRecord,d:Date)=>{const t=new Date(tx.createdAt);return t.getFullYear()===d.getFullYear()&&t.getMonth()===d.getMonth();};
  const isInYear=(tx:TxRecord,d:Date)=>{const t=new Date(tx.createdAt);return t.getFullYear()===d.getFullYear();};

  const filteredTxs=doneTxs.filter(tx=>viewMode==="day"?isInDay(tx,selDate):viewMode==="month"?isInMonth(tx,selDate):isInYear(tx,selDate));
  const classified=filteredTxs.map(tx=>({...tx,...classify(tx)}));

  const income=classified.filter(x=>x.isIncome).reduce((a,x)=>a+x.irr,0);
  const expense=classified.filter(x=>x.isExpense).reduce((a,x)=>a+x.irr,0);
  const net=income-expense;
  const hasData=income>0||expense>0;

  /* ── Mock data shown when no real transactions exist ── */
  const MOCK_INCOME_VAL=45000000;
  const MOCK_EXPENSE_VAL=28500000;
  const MOCK_NET=MOCK_INCOME_VAL-MOCK_EXPENSE_VAL;
  const MOCK_CAT_TOTALS:Record<string,number>={قبوض:4800000,شارژ:1200000,"انتقال وجه":8500000,بیمه:3200000,حمل‌ونقل:2100000,نیکوکاری:500000,سایر:8200000};
  const MOCK_CHART_YEAR=[
    {label:"فرو",income:38000000,expense:24000000},
    {label:"اسف",income:40000000,expense:27000000},
    {label:"فرو",income:42000000,expense:25500000},
    {label:"خرد",income:39000000,expense:29000000},
    {label:"ارد",income:44000000,expense:26000000},
    {label:"خرد",income:41000000,expense:28000000},
    {label:"تیر",income:43000000,expense:27500000},
    {label:"امر",income:45000000,expense:30000000},
    {label:"شهر",income:47000000,expense:28000000},
    {label:"مهر",income:46000000,expense:29500000},
    {label:"آبا",income:44000000,expense:27000000},
    {label:"آذر",income:45000000,expense:28500000},
  ];
  const MOCK_CHART_MONTH=Array.from({length:30},(_,i)=>({label:String(i+1),income:i===0?45000000:0,expense:[0,3800000,0,0,1200000,0,0,0,8500000,0,0,0,3200000,0,0,2100000,0,0,500000,0,0,0,0,0,4200000,0,0,0,0,4000000][i]||0}));
  const MOCK_TXS=[
    {id:"m1",note:"حقوق ماهانه",isIncome:true,isExpense:false,isInternal:false,category:"واریز",irr:45000000,createdAt:"2026-09-01T09:00:00Z"},
    {id:"m2",note:"قبض برق",isIncome:false,isExpense:true,isInternal:false,category:"قبوض",irr:1800000,createdAt:"2026-09-05T11:00:00Z"},
    {id:"m3",note:"انتقال وجه به همسر",isIncome:false,isExpense:true,isInternal:false,category:"انتقال وجه",irr:8500000,createdAt:"2026-09-08T14:30:00Z"},
    {id:"m4",note:"بیمه تکمیلی",isIncome:false,isExpense:true,isInternal:false,category:"بیمه",irr:3200000,createdAt:"2026-09-10T10:00:00Z"},
    {id:"m5",note:"شارژ سیم‌کارت",isIncome:false,isExpense:true,isInternal:false,category:"شارژ",irr:500000,createdAt:"2026-09-12T09:15:00Z"},
    {id:"m6",note:"خلافی خودرو",isIncome:false,isExpense:true,isInternal:false,category:"حمل‌ونقل",irr:2100000,createdAt:"2026-09-15T16:00:00Z"},
    {id:"m7",note:"نیکوکاری",isIncome:false,isExpense:true,isInternal:false,category:"نیکوکاری",irr:500000,createdAt:"2026-09-18T08:00:00Z"},
    {id:"m8",note:"خرید اینترنتی",isIncome:false,isExpense:true,isInternal:false,category:"سایر",irr:4200000,createdAt:"2026-09-20T19:30:00Z"},
    {id:"m9",note:"قبض آب و گاز",isIncome:false,isExpense:true,isInternal:false,category:"قبوض",irr:3000000,createdAt:"2026-09-22T12:00:00Z"},
    {id:"m10",note:"هزینه‌های روزانه",isIncome:false,isExpense:true,isInternal:false,category:"سایر",irr:4000000,createdAt:"2026-09-25T20:00:00Z"},
  ];

  const isMock=!hasData;
  const healthGood=isMock||(income>=expense);

  // Spending categories
  const CAT_DEFS=[
    {id:"شارژ",color:"#34d399",svg:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>},
    {id:"قبوض",color:"#a78bfa",svg:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>},
    {id:"انتقال وجه",color:"#4a9eff",svg:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a9eff" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>},
    {id:"حمل‌ونقل",color:"#fb923c",svg:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round"><path d="M5 17H3a2 2 0 0 1-2-2V9l3-6h12l3 6v6a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/></svg>},
    {id:"بیمه",color:"#3b82f6",svg:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>},
    {id:"نیکوکاری",color:"#f472b6",svg:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>},
    {id:"برداشت",color:"#f5c23d",svg:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f5c23d" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>},
    {id:"سایر",color:"#94a3b8",svg:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>},
  ];
  const catTotals:Record<string,number>={};
  classified.filter(x=>x.isExpense).forEach(x=>{catTotals[x.category]=(catTotals[x.category]||0)+x.irr;});
  const totalCatExp=Object.values(catTotals).reduce((a,v)=>a+v,0)||1;

  // Navigation
  const isFutureBlocked=(d:Date)=>d>now;
  const navPrev=()=>{
    const d=new Date(selDate);
    if(viewMode==="day")d.setDate(d.getDate()-1);
    else if(viewMode==="month")d.setMonth(d.getMonth()-1);
    else d.setFullYear(d.getFullYear()-1);
    setSelDate(d);
  };
  const navNext=()=>{
    const d=new Date(selDate);
    if(viewMode==="day")d.setDate(d.getDate()+1);
    else if(viewMode==="month")d.setMonth(d.getMonth()+1);
    else d.setFullYear(d.getFullYear()+1);
    if(!isFutureBlocked(d))setSelDate(d);
  };
  const canNext=()=>{
    const d=new Date(selDate);
    if(viewMode==="day")d.setDate(d.getDate()+1);
    else if(viewMode==="month")d.setMonth(d.getMonth()+1);
    else d.setFullYear(d.getFullYear()+1);
    return !isFutureBlocked(d);
  };
  const dateLabel=viewMode==="day"
    ?selDate.toLocaleDateString("fa-IR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})
    :viewMode==="month"
      ?selDate.toLocaleDateString("fa-IR",{year:"numeric",month:"long"})
      :selDate.toLocaleDateString("fa-IR",{year:"numeric"});

  // Chart data builders
  const mkBarData=(count:number,mkDate:(i:number)=>Date,getKey:(d:Date,tx:TxRecord)=>boolean,lbl:(d:Date)=>string)=>{
    return Array.from({length:count},(_,i)=>{
      const d=mkDate(i);
      const m=doneTxs.filter(tx=>getKey(d,tx)).map(tx=>classify(tx));
      return{label:lbl(d),income:m.filter(x=>x.isIncome).reduce((a,x)=>a+x.irr,0),expense:m.filter(x=>x.isExpense).reduce((a,x)=>a+x.irr,0)};
    });
  };

  const chartData=viewMode==="year"
    ?mkBarData(12,i=>new Date(selDate.getFullYear(),i,1),(d,tx)=>isInMonth(tx,d),d=>d.toLocaleDateString("fa-IR",{month:"narrow"}))
    :viewMode==="month"
      ?mkBarData(new Date(selDate.getFullYear(),selDate.getMonth()+1,0).getDate(),i=>new Date(selDate.getFullYear(),selDate.getMonth(),i+1),(d,tx)=>isInDay(tx,d),d=>toFaDigits(String(d.getDate())))
      :mkBarData(7,i=>{const d=new Date(now);d.setDate(now.getDate()-6+i);return d;},(d,tx)=>isInDay(tx,d),d=>d.toLocaleDateString("fa-IR",{weekday:"narrow"}));

  const maxBar=Math.max(...chartData.map(d=>Math.max(d.income,d.expense)),1);

  /* display values — real if hasData, mock otherwise */
  const dispIncome=hasData?income:MOCK_INCOME_VAL;
  const dispExpense=hasData?expense:MOCK_EXPENSE_VAL;
  const dispNet=hasData?net:MOCK_NET;
  const dispCatTotals=hasData?catTotals:MOCK_CAT_TOTALS;
  const dispTotalCatExp=hasData?totalCatExp:Object.values(MOCK_CAT_TOTALS).reduce((a,v)=>a+v,0)||1;
  const dispChartData=hasData?chartData:viewMode==="year"?MOCK_CHART_YEAR:viewMode==="month"?MOCK_CHART_MONTH:MOCK_CHART_YEAR.slice(0,7).map((d,i)=>({label:["ش","ی","د","س","چ","پ","ج"][i],income:i===0?MOCK_INCOME_VAL:0,expense:MOCK_CHART_MONTH[i*4]?.expense||0}));
  const dispMaxBar=Math.max(...dispChartData.map((d:{income:number;expense:number})=>Math.max(d.income,d.expense)),1);
  const dispTxs=hasData?filteredTxs:MOCK_TXS;

  const healthMsg=isMock
    ?"این نمونه داده آموزشی است. با انجام تراکنش‌های واقعی، اطلاعات دقیق شما نمایش داده می‌شود."
    :healthGood
      ?"وضعیت دخل و خرجت خوبه، همین روند رو ادامه بده!"
      :"هزینه‌هات این دوره بیشتر از درآمدت شده؛ بهتره مراقب مخارجت باشی.";

  const cardStyle={background:"var(--card-bg)",border:"1px solid var(--border-color)",borderRadius:18,boxShadow:"0 2px 12px rgba(0,5,20,0.22),0 0 0 1px rgba(120,190,210,0.08)"};

  return <div className="anp-full-page" dir="rtl">
    <div className="anp-page-header">
      <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">مرکز مالی</h2>
      <div style={{width:36}}/>
    </div>

    {/* Transaction detail sheet */}
    {selTx&&(
      <div style={{position:"fixed",inset:0,zIndex:900,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={()=>setSelTx(null)}>
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)"}}/>
        <div style={{position:"relative",background:"var(--card-bg)",borderRadius:"24px 24px 0 0",padding:"24px",zIndex:1,border:"1px solid var(--border-color)",maxHeight:"80vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
          <div style={{width:44,height:4,borderRadius:2,background:"var(--border-color)",margin:"0 auto 20px"}}/>
          {/* Icon + amount */}
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
            <div style={{width:56,height:56,borderRadius:18,background:selTx.isIncome?"rgba(0,214,176,0.12)":selTx.isInternal?"rgba(167,139,250,0.12)":"rgba(251,146,60,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:`1px solid ${selTx.isIncome?"rgba(0,214,176,0.2)":selTx.isInternal?"rgba(167,139,250,0.2)":"rgba(251,146,60,0.2)"}`}}>
              {selTx.isIncome
                ?<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00D6B0" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                :selTx.isInternal
                  ?<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M7 16V4m0 0L3 8m4-4 4 4"/><path d="M17 8v12m0 0 4-4m-4 4-4-4"/></svg>
                  :<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
            </div>
            <div>
              <div style={{fontSize:24,fontWeight:900,color:selTx.isIncome?"#34d399":selTx.isInternal?"#a78bfa":"#fb923c"}}>
                {selTx.isIncome?"+":selTx.isInternal?"↔":"−"}{fa(Math.round(selTx.irr))} <span style={{fontSize:14,fontWeight:500}}>تومان</span>
              </div>
              <div style={{fontSize:13,color:"var(--text-secondary)",marginTop:3}}>{selTx.note||selTx.type||selTx.category}</div>
            </div>
          </div>
          {/* Details */}
          <div style={{...cardStyle,overflow:"hidden",marginBottom:16}}>
            {[
              {label:"دسته‌بندی",val:selTx.category},
              {label:"نوع",val:selTx.isIncome?"درآمد":selTx.isInternal?"داخلی":"هزینه"},
              {label:"تاریخ و ساعت",val:new Date(selTx.createdAt).toLocaleDateString("fa-IR",{year:"numeric",month:"long",day:"numeric"})+" · "+new Date(selTx.createdAt).toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit"})},
              {label:"وضعیت",val:"تکمیل‌شده"},
            ].map((row,i,arr)=>(
              <div key={row.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 16px",borderBottom:i<arr.length-1?"1px solid var(--border-faint)":"none"}}>
                <span style={{fontSize:13,color:"var(--text-muted)"}}>{row.label}</span>
                <span style={{fontSize:13,fontWeight:700,color:"var(--text-primary)"}}>{row.val}</span>
              </div>
            ))}
          </div>
          <button onClick={()=>setSelTx(null)} style={{width:"100%",padding:"15px",background:"var(--card-bg)",border:"1px solid var(--border-color)",borderRadius:14,color:"var(--text-secondary)",fontSize:14,fontFamily:"Vazirmatn",cursor:"pointer",fontWeight:700}}>بستن</button>
        </div>
      </div>
    )}

    <div className="anp-page-body" style={{paddingBottom:100}}>

      {/* Financial health indicator */}
      <div style={{display:"flex",alignItems:"center",gap:12,background:healthGood?"rgba(0,214,176,0.07)":"rgba(239,68,68,0.07)",border:`1px solid ${healthGood?"rgba(0,214,176,0.22)":"rgba(239,68,68,0.22)"}`,borderRadius:20,padding:"14px 16px",marginBottom:14,boxShadow:healthGood?"0 4px 20px rgba(0,214,176,0.08)":"0 4px 20px rgba(239,68,68,0.08)"}}>
        <div style={{width:42,height:42,borderRadius:14,background:healthGood?"rgba(0,214,176,0.15)":"rgba(239,68,68,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:healthGood?"1px solid rgba(0,214,176,0.20)":"1px solid rgba(239,68,68,0.20)"}}>
          {healthGood
            ?<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D6B0" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            :<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:12,fontWeight:800,color:healthGood?"#00D6B0":"#ef4444",marginBottom:4,letterSpacing:"0.02em"}}>{healthGood?"وضعیت مالی سالم":"هشدار مالی"}</div>
          <div style={{fontSize:12,color:"var(--text-secondary)",lineHeight:1.75}}>{healthMsg}</div>
        </div>
      </div>

      {/* View mode tabs */}
      <div style={{display:"flex",gap:4,marginBottom:12,background:"var(--card-bg)",padding:"5px",borderRadius:16,border:"1px solid var(--border-color)",boxShadow:"0 1px 6px rgba(0,5,20,0.15)"}}>
        {(["day","month","year"] as ViewMode[]).map(m=>(
          <button key={m} onClick={()=>setViewMode(m)} style={{flex:1,padding:"10px 4px",borderRadius:12,border:"none",background:viewMode===m?"rgba(0,214,176,0.16)":"transparent",color:viewMode===m?"#00D6B0":"var(--text-muted)",fontSize:12,fontWeight:700,fontFamily:"Vazirmatn",cursor:"pointer",transition:"all 0.2s",boxShadow:viewMode===m?"0 2px 8px rgba(0,214,176,0.15)":"none"}}>
            {m==="day"?"روزانه":m==="month"?"ماهانه":"سالانه"}
          </button>
        ))}
      </div>

      {/* Date navigator */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,...cardStyle,padding:"10px 14px"}}>
        <button onClick={navPrev} style={{background:"none",border:"none",cursor:"pointer",color:"var(--accent)",padding:4,display:"flex"}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <div style={{fontSize:12,fontWeight:700,color:"var(--text-primary)",textAlign:"center",flex:1,padding:"0 8px"}}>{dateLabel}</div>
        <button onClick={navNext} disabled={!canNext()} style={{background:"none",border:"none",cursor:canNext()?"pointer":"default",color:canNext()?"var(--accent)":"var(--text-faint)",padding:4,display:"flex"}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>

      {/* Summary row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
        {[
          {label:"درآمد",val:dispIncome,color:"#34d399",bg:"rgba(52,211,153,0.08)"},
          {label:"هزینه",val:dispExpense,color:"#fb923c",bg:"rgba(251,146,60,0.08)"},
          {label:"خالص",val:dispNet,color:dispNet>=0?"#00D6B0":"#ef4444",bg:dispNet>=0?"rgba(0,214,176,0.08)":"rgba(239,68,68,0.08)"},
        ].map(item=>(
          <div key={item.label} style={{...cardStyle,padding:"14px 8px",textAlign:"center",background:item.bg}}>
            <div style={{fontSize:10,fontWeight:600,color:"var(--text-muted)",marginBottom:6,letterSpacing:"0.02em"}}>{item.label}</div>
            <div style={{fontSize:12,fontWeight:800,color:item.color,lineHeight:1.3}}>{fa(Math.abs(item.val))}</div>
            {isMock&&<div style={{fontSize:8,color:"var(--text-faint)",marginTop:3}}>نمونه</div>}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{...cardStyle,padding:"16px 12px 12px",marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{fontSize:13,fontWeight:800,color:"var(--text-primary)"}}>نمودار مالی</div>
            {isMock&&<span style={{fontSize:9,background:"rgba(0,214,176,0.12)",color:"#00D6B0",borderRadius:8,padding:"2px 8px",fontWeight:700,border:"1px solid rgba(0,214,176,0.18)"}}>نمونه</span>}
          </div>
          <div style={{display:"flex",gap:12}}>
            <span style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"var(--text-secondary)"}}><span style={{width:8,height:8,borderRadius:3,background:"rgba(0,214,176,0.85)",display:"inline-block"}}/>درآمد</span>
            <span style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"var(--text-secondary)"}}><span style={{width:8,height:8,borderRadius:3,background:"rgba(251,146,60,0.85)",display:"inline-block"}}/>هزینه</span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"flex-end",gap:2,height:96,overflowX:"auto",paddingBottom:2}}>
          {dispChartData.map((d:{label:string;income:number;expense:number},i:number)=>(
            <div key={i} style={{flex:1,minWidth:viewMode==="month"?10:8,display:"flex",flexDirection:"column",alignItems:"center",gap:1,height:"100%",justifyContent:"flex-end"}}>
              <div style={{width:"100%",display:"flex",flexDirection:"column",gap:1,justifyContent:"flex-end",height:"100%"}}>
                {d.income>0&&<div style={{width:"100%",height:`${Math.max(3,Math.round(d.income/dispMaxBar*80))}px`,background:"linear-gradient(180deg,#00D6B0,rgba(0,214,176,0.4))",borderRadius:"4px 4px 0 0",transition:"height 0.4s cubic-bezier(.22,1,.36,1)"}}/>}
                {d.expense>0&&<div style={{width:"100%",height:`${Math.max(3,Math.round(d.expense/dispMaxBar*80))}px`,background:"linear-gradient(180deg,#fb923c,rgba(251,146,60,0.4))",borderRadius:d.income>0?"0":"4px 4px 0 0",transition:"height 0.4s cubic-bezier(.22,1,.36,1)"}}/>}
              </div>
              <div style={{fontSize:7,color:"var(--text-faint)",whiteSpace:"nowrap",marginTop:3,overflow:"hidden",maxWidth:"100%",textAlign:"center"}}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* "درآمدم کجا رفت" */}
      {(dispExpense>0)&&(
        <div style={{...cardStyle,padding:"16px",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:800,color:"var(--text-primary)"}}>درآمدم کجا رفت؟</div>
            {isMock&&<span style={{fontSize:9,background:"rgba(251,146,60,0.12)",color:"#fb923c",borderRadius:6,padding:"2px 7px",fontWeight:700}}>نمونه</span>}
          </div>
          {CAT_DEFS.map(c=>{
            const amt=dispCatTotals[c.id]||0;
            if(amt===0)return null;
            const pct=Math.round(amt/dispTotalCatExp*100);
            return <div key={c.id} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"var(--text-secondary)"}}>{c.svg}{c.id}</span>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:10,color:"var(--text-muted)"}}>{fa(Math.round(amt))} ت</span>
                  <span style={{fontSize:10,fontWeight:800,color:c.color}}>{toFaDigits(String(pct))}٪</span>
                </div>
              </div>
              <div style={{height:6,borderRadius:3,background:"var(--border-color)",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${c.color},${c.color}99)`,borderRadius:3,transition:"width .5s cubic-bezier(.22,1,.36,1)"}}/>
              </div>
            </div>;
          })}
        </div>
      )}

      {/* Transactions */}
      <div style={{marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <div style={{fontSize:13,fontWeight:800,color:"var(--text-primary)"}}>تراکنش‌ها</div>
          {isMock&&<span style={{fontSize:9,background:"rgba(74,158,255,0.12)",color:"#4a9eff",borderRadius:6,padding:"2px 7px",fontWeight:700}}>نمونه</span>}
        </div>
        {dispTxs.length===0?(
          <div style={{...cardStyle,padding:"28px",textAlign:"center",color:"var(--text-faint)",fontSize:12}}>هیچ تراکنشی در این بازه وجود ندارد</div>
        ):(isMock?MOCK_TXS:filteredTxs.slice(0,30)).map((tx:typeof MOCK_TXS[0]|TxRecord)=>{
          const cl=isMock?(tx as typeof MOCK_TXS[0]):classify(tx as TxRecord);
          const catDef=CAT_DEFS.find(c=>c.id===cl.category);
          const d=new Date((tx as {createdAt:string}).createdAt);
          const txCl={...(tx as {id:string;note?:string;type?:string;createdAt:string}),...cl};
          return <div key={(tx as {id:string}).id} onClick={()=>setSelTx(txCl)} style={{display:"flex",alignItems:"center",gap:12,...cardStyle,padding:"13px 14px",marginBottom:8,cursor:"pointer"}}>
            <div style={{width:42,height:42,borderRadius:14,background:cl.isIncome?"rgba(0,214,176,0.12)":cl.isInternal?"rgba(167,139,250,0.12)":"rgba(251,146,60,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:`1px solid ${cl.isIncome?"rgba(0,214,176,0.18)":cl.isInternal?"rgba(167,139,250,0.18)":"rgba(251,146,60,0.18)"}`}}>
              {cl.isIncome
                ?<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00D6B0" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                :cl.isInternal
                  ?<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M7 16V4m0 0L3 8m4-4 4 4"/><path d="M17 8v12m0 0 4-4m-4 4-4-4"/></svg>
                  :(catDef?.svg||<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/></svg>)}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{(tx as {note?:string}).note||(tx as {type:string}).type}</div>
              <div style={{fontSize:10,color:"var(--text-muted)",marginTop:3}}>{d.toLocaleDateString("fa-IR")} · {d.toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit"})}</div>
            </div>
            <div style={{flexShrink:0,textAlign:"left"}}>
              <div style={{fontSize:13,fontWeight:800,color:cl.isIncome?"#34d399":cl.isInternal?"#a78bfa":"#fb923c"}}>
                {cl.isIncome?"+":cl.isInternal?"↔":"−"}{fa(Math.round(cl.irr))}
              </div>
              <div style={{fontSize:9,color:"var(--text-faint)",marginTop:2}}>تومان</div>
            </div>
          </div>;
        })}
      </div>

      {/* Auto-tracking message */}
      <div style={{background:"rgba(0,214,176,0.05)",border:"1px solid rgba(0,214,176,0.16)",borderRadius:20,padding:"18px",marginBottom:12,boxShadow:"0 4px 20px rgba(0,214,176,0.07)"}}>
        <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
          <div style={{width:36,height:36,borderRadius:12,background:"rgba(0,214,176,0.12)",border:"1px solid rgba(0,214,176,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00D6B0" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:800,color:"#00D6B0",marginBottom:6,letterSpacing:"0.02em"}}>ردیابی خودکار مالی</div>
            <div style={{fontSize:12,color:"var(--text-secondary)",lineHeight:1.85}}>تمام ورود و خروج‌های پولی شما، حتی اگر در فروشگاهی با کارت بانکی خود خرید کنید یا در هر مکان دیگری پولی پرداخت یا دریافت کنید، و همچنین اگر در صرافی ارز دیجیتال پولی به دست آورید یا از دست بدهید، به‌صورت کاملاً خودکار در این صفحه محاسبه و تحلیل می‌شود.</div>
          </div>
        </div>
      </div>

      {/* Data sources */}
      <div style={{...cardStyle,padding:"14px 16px"}}>
        <div style={{fontSize:12,fontWeight:800,color:"var(--text-primary)",marginBottom:10}}>منابع تراکنش خودکار</div>
        {[
          {svg:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,text:"تراکنش‌های بانکی و کارت"},
          {svg:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,text:"خرید با کارت در POS و فروشگاه‌ها"},
          {svg:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,text:"پرداخت‌های آنلاین و درگاه"},
          {svg:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,text:"صرافی و ارزهای دیجیتال (USDT، BTC، ETH)"},
          {svg:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,text:"قبوض، شارژ، اینترنت و خدمات"},
        ].map((item,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<4?"1px solid var(--border-faint)":"none"}}>
            <span style={{display:"flex",alignItems:"center"}}>{item.svg}</span>
            <span style={{fontSize:11,color:"var(--text-secondary)",flex:1}}>{item.text}</span>
            <span style={{fontSize:9,color:"rgba(0,214,176,0.7)",background:"rgba(0,214,176,0.08)",borderRadius:5,padding:"2px 6px"}}>خودکار</span>
          </div>
        ))}
      </div>

    </div>
  </div>;
}

// ─── AN MARKET ─────────────────────────────────────────────────────────────────
type AnView=
  |{t:"home"}|{t:"assistant"}|{t:"chat";q:string}|{t:"product";pid:string}
  |{t:"cats"}|{t:"cat";cid:string}|{t:"sub";cid:string;sid:string}
  |{t:"me"}|{t:"me-orders"}|{t:"me-tickets"}|{t:"me-fav"}|{t:"me-alerts"}
  |{t:"me-recent"}|{t:"me-compare"}|{t:"me-city"}|{t:"me-support"}|{t:"me-reg"}|{t:"me-panel"};

interface AnProduct{id:string;title:string;brand:string;catId:string;subId:string;img:string;specs:Record<string,string>;priceMin:number;priceMax:number;storeCount:number;desc:string;tags:string[];rating:number;reviews:number;ph:{d:string;p:number}[];}
interface AnOffer{sid:string;price:number;ship:string;warranty:string;inStock:boolean;upd:string;}
interface CompareState{active:boolean;selectedIds:string[];minimized:boolean;}
const ANS:{[k:string]:{n:string;sc:number}}={
  digi:{n:"دیجی‌کالا",sc:4.7},emalls:{n:"ایمالز",sc:4.3},technolife:{n:"تکنولایف",sc:4.5},
  novingate:{n:"نوین‌گیت",sc:4.1},pichak:{n:"پیچک",sc:3.8},tajhiz:{n:"تجهیزکو",sc:4.2},
  computex:{n:"کامپیوتکس",sc:4.0},shopnet:{n:"شاپ‌نت",sc:3.7},digistore:{n:"دیجی‌استور",sc:4.4},
  mobileplus:{n:"موبایل‌پلاس",sc:4.2},gadgetland:{n:"گجت‌لند",sc:4.1},phoneshop:{n:"فون‌شاپ",sc:3.9},
  techbazar:{n:"تک‌بازار",sc:4.3},arianstore:{n:"آریان‌استور",sc:4.0},bazarpc:{n:"بازار کامپیوتر",sc:3.6},
  persiashop:{n:"پرشیاشاپ",sc:4.1},digitalplus:{n:"دیجیتال‌پلاس",sc:4.4},eshop:{n:"ای‌شاپ",sc:3.8},
  mobileking:{n:"موبایل‌کینگ",sc:4.2},techcenter:{n:"تک‌سنتر",sc:4.0},shopazar:{n:"شاپ‌آذر",sc:3.7},
  computershop:{n:"کامپیوترشاپ",sc:4.3},netshop:{n:"نت‌شاپ",sc:4.1},gadgethouse:{n:"گجت‌هاوس",sc:3.9},
  digifix:{n:"دیجی‌فیکس",sc:4.5},techworld:{n:"تک‌ورلد",sc:4.2},mobilemart:{n:"موبایل‌مارت",sc:4.0},
  emarket:{n:"ای‌مارکت",sc:3.8},persiantech:{n:"پرشین‌تک",sc:4.1},cityshop:{n:"سیتی‌شاپ",sc:4.3},
  techpro:{n:"تک‌پرو",sc:4.0},megashop:{n:"مگاشاپ",sc:3.9},istore:{n:"آی‌استور",sc:4.6},
  smartshop:{n:"اسمارت‌شاپ",sc:4.2},digitalcity:{n:"دیجیتال‌سیتی",sc:4.1},
};
const ANS_KEYS=Object.keys(ANS);
function mkAnOffers(base:number,count:number):AnOffer[]{
  const ship=["ارسال رایگان","ارسال رایگان","ارسال رایگان","۱۵ هزار تومان","۲۰ هزار تومان","۲۵ هزار تومان","۳۰ هزار تومان","۳۵ هزار تومان","۴۰ هزار تومان","۴۵ هزار تومان"];
  const war=["گارانتی ۱۸ ماهه","گارانتی ۱۲ ماهه","گارانتی ۱۲ ماهه","یک‌ساله","گارانتی ۱۸ ماهه"];
  return ANS_KEYS.slice(0,Math.min(count,ANS_KEYS.length)).map((sid,i)=>({
    sid,price:Math.round(base*(1+i*0.011+(i%3)*0.003)),
    ship:ship[Math.min(i,ship.length-1)],
    warranty:war[i%war.length],inStock:i<count-2,
    upd:`${i*2+1} دقیقه پیش`,
  }));
}
const AN_PRODS:AnProduct[]=[
  {id:"asus-vb15",title:"لپ‌تاپ ایسوس VivoBook 15 X1502ZA — Core i5 512GB",brand:"ASUS",catId:"laptop",subId:"laptop-student",img:"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop&auto=format",specs:{"پردازنده":"Intel Core i5-1235U","رم":"16GB DDR4","حافظه":"512GB SSD","صفحه‌نمایش":"15.6″ FHD IPS","گرافیک":"Intel Iris Xe","وزن":"1.7 کیلوگرم","باتری":"تا ۷ ساعت","سیستم‌عامل":"Windows 11"},priceMin:57500000,priceMax:64000000,storeCount:32,desc:"لپ‌تاپ سبک و مناسب دانشجویان با 512 گیگ حافظه",tags:["دانشجویی","سبک","اینتل"],rating:4.3,reviews:2840,ph:[{d:"۳۰ روز",p:59e6},{d:"۲۰ روز",p:58e6},{d:"۱۰ روز",p:57.5e6},{d:"امروز",p:57.5e6}]},
  {id:"macbook-m2",title:"لپ‌تاپ اپل MacBook Air M2 — 13.6 اینچ 8GB",brand:"Apple",catId:"laptop",subId:"laptop-macbook",img:"https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop&auto=format",specs:{"تراشه":"Apple M2 8-core","رم":"8GB Unified Memory","حافظه":"256GB SSD","صفحه‌نمایش":"13.6″ Liquid Retina","GPU":"10-core","وزن":"1.24 کیلوگرم","باتری":"تا ۱۸ ساعت"},priceMin:89000000,priceMax:105000000,storeCount:18,desc:"سبک‌ترین لپ‌تاپ اپل با تراشه M2 و باتری استثنایی",tags:["اپل","M2","طراحی"],rating:4.8,reviews:5420,ph:[{d:"۶۰ روز",p:95e6},{d:"۳۰ روز",p:92e6},{d:"امروز",p:89e6}]},
  {id:"lenovo-ip5",title:"لپ‌تاپ لنوو IdeaPad 5 — Ryzen 5 8GB 256GB",brand:"Lenovo",catId:"laptop",subId:"laptop-student",img:"https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=300&fit=crop&auto=format",specs:{"پردازنده":"AMD Ryzen 5 5625U","رم":"8GB DDR4","حافظه":"256GB SSD","صفحه‌نمایش":"15.6″ IPS FHD","گرافیک":"AMD Radeon","وزن":"1.68 کیلوگرم"},priceMin:42000000,priceMax:48500000,storeCount:24,desc:"لپ‌تاپ اقتصادی AMD برای استفاده روزانه و دانشگاه",tags:["دانشجویی","AMD","مقرون‌به‌صرفه"],rating:4.2,reviews:1923,ph:[{d:"۳۰ روز",p:43.5e6},{d:"امروز",p:42e6}]},
  {id:"hp-pav15",title:"لپ‌تاپ اچ‌پی Pavilion 15 — i7 16GB گرافیک MX570",brand:"HP",catId:"laptop",subId:"laptop-office",img:"https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=300&fit=crop&auto=format",specs:{"پردازنده":"Intel Core i7-1255U","رم":"16GB DDR4","حافظه":"1TB SSD","صفحه‌نمایش":"15.6″ FHD IPS","گرافیک":"NVIDIA MX570 2GB","سیستم‌عامل":"Windows 11"},priceMin:68000000,priceMax:76000000,storeCount:20,desc:"لپ‌تاپ اداری با گرافیک اختصاصی و رم ۱۶ گیگ",tags:["اداری","i7","گرافیک‌دار"],rating:4.4,reviews:1245,ph:[{d:"۳۰ روز",p:71e6},{d:"امروز",p:68e6}]},
  {id:"asus-rog-g16",title:"لپ‌تاپ گیمینگ ایسوس ROG Zephyrus G16 — RTX4060",brand:"ASUS ROG",catId:"laptop",subId:"laptop-gaming",img:"https://images.unsplash.com/photo-1593640408182-31c228c6f4b7?w=400&h=300&fit=crop&auto=format",specs:{"پردازنده":"Intel Core i9-13900H","رم":"16GB DDR5","حافظه":"1TB PCIe 4.0","صفحه‌نمایش":"16″ QHD 240Hz","گرافیک":"NVIDIA RTX 4060 8GB","وزن":"1.85 کیلوگرم"},priceMin:112000000,priceMax:128000000,storeCount:10,desc:"لپ‌تاپ گیمینگ با RTX 4060 و صفحه QHD 240Hz",tags:["گیمینگ","RTX4060","240Hz"],rating:4.6,reviews:785,ph:[{d:"۳۰ روز",p:120e6},{d:"امروز",p:112e6}]},
  {id:"iphone15pm",title:"گوشی اپل iPhone 15 Pro Max — 256GB تیتانیوم",brand:"Apple",catId:"mobile",subId:"mobile-iphone",img:"https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&h=300&fit=crop&auto=format",specs:{"تراشه":"Apple A17 Pro","رم":"8GB","حافظه":"256GB","صفحه‌نمایش":"6.7″ Super Retina XDR","دوربین":"48MP Pro سه‌گانه","باتری":"4422mAh","سیستم‌عامل":"iOS 17"},priceMin:142000000,priceMax:162000000,storeCount:22,desc:"پرچم‌دار اپل با تراشه A17 Pro و قاب تیتانیوم",tags:["پرمیوم","فیلمبرداری","آیفون"],rating:4.9,reviews:8920,ph:[{d:"۹۰ روز",p:158e6},{d:"۶۰ روز",p:152e6},{d:"۳۰ روز",p:145e6},{d:"امروز",p:142e6}]},
  {id:"s24ultra",title:"گوشی سامسونگ Galaxy S24 Ultra — 256GB S Pen",brand:"Samsung",catId:"mobile",subId:"mobile-samsung",img:"https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=300&fit=crop&auto=format",specs:{"پردازنده":"Snapdragon 8 Gen 3","رم":"12GB","حافظه":"256GB","صفحه‌نمایش":"6.8″ Dynamic AMOLED 2X 120Hz","دوربین":"200MP چهارگانه","باتری":"5000mAh","S Pen":"دارد"},priceMin:132000000,priceMax:148000000,storeCount:19,desc:"فلاگشیپ سامسونگ با قلم S Pen و دوربین ۲۰۰ مگاپیکسل",tags:["پرمیوم","S Pen","200MP"],rating:4.7,reviews:6340,ph:[{d:"۹۰ روز",p:145e6},{d:"امروز",p:132e6}]},
  {id:"galaxy-a54",title:"گوشی سامسونگ Galaxy A54 5G — 8GB 256GB",brand:"Samsung",catId:"mobile",subId:"mobile-mid",img:"https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=300&fit=crop&auto=format",specs:{"پردازنده":"Exynos 1380","رم":"8GB","حافظه":"256GB","صفحه‌نمایش":"6.4″ Super AMOLED 120Hz","دوربین":"50MP سه‌گانه","باتری":"5000mAh","شارژ":"25W"},priceMin:18500000,priceMax:22000000,storeCount:30,desc:"میان‌رده قوی سامسونگ با دوربین عالی و باتری ۵۰۰۰",tags:["5G","میان‌رده","AMOLED"],rating:4.3,reviews:3870,ph:[{d:"۳۰ روز",p:21e6},{d:"امروز",p:18.5e6}]},
  {id:"samsung-tv65",title:"تلویزیون سامسونگ 65 اینچ QLED 4K — Q80C",brand:"Samsung",catId:"av",subId:"av-tv",img:"https://images.unsplash.com/photo-1593359677879-a4bb92f4834c?w=400&h=300&fit=crop&auto=format",specs:{"اندازه":"65 اینچ","تکنولوژی":"QLED","رزولوشن":"4K UHD","پردازنده":"Quantum Processor 4K","HDR":"HDR10+","سیستم‌عامل":"Tizen","پورت‌ها":"4×HDMI, 3×USB"},priceMin:58000000,priceMax:69000000,storeCount:15,desc:"تلویزیون QLED با پردازنده کوانتومی و کیفیت تصویر عالی",tags:["QLED","4K","65اینچ"],rating:4.5,reviews:2145,ph:[{d:"۳۰ روز",p:63e6},{d:"امروز",p:58e6}]},
  {id:"sony-wh1000xm5",title:"هدفون بی‌سیم سونی WH-1000XM5 — حذف نویز",brand:"Sony",catId:"av",subId:"av-headphone",img:"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop&auto=format",specs:{"اتصال":"Bluetooth 5.2","حذف‌نویز":"30dB ANC","باتری":"30 ساعت","میکروفون":"8 میکروفون","کدک":"LDAC, AAC","وزن":"250 گرم"},priceMin:12800000,priceMax:15500000,storeCount:28,desc:"بهترین هدفون حذف‌نویز با کیفیت صدای حرفه‌ای",tags:["حذف‌نویز","سونی","بلوتوث"],rating:4.8,reviews:4210,ph:[{d:"۳۰ روز",p:14.5e6},{d:"امروز",p:12.8e6}]},
  {id:"apple-watch-s9",title:"ساعت هوشمند اپل Watch Series 9 — 45mm",brand:"Apple",catId:"mobile",subId:"mobile-watch",img:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop&auto=format",specs:{"تراشه":"S9 SiP","صفحه‌نمایش":"LTPO OLED Always-On","اندازه":"45mm","مقاومت":"WR50","باتری":"تا 18 ساعت","GPS":"دارد","سلامت":"ECG، SpO2"},priceMin:24000000,priceMax:28500000,storeCount:14,desc:"ساعت هوشمند اپل با قابلیت‌های پیشرفته سلامت",tags:["اپل","سلامت","ورزشی"],rating:4.7,reviews:3150,ph:[{d:"۶۰ روز",p:27e6},{d:"امروز",p:24e6}]},
  {id:"samsung-rf23",title:"یخچال فریزر سامسونگ RF23 — 660 لیتری Family Hub",brand:"Samsung",catId:"appliance",subId:"appliance-fridge",img:"https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&h=300&fit=crop&auto=format",specs:{"ظرفیت":"660 لیتر","نوع":"فرنچ دور","کلاس انرژی":"A++","No-Frost":"دارد","کمپرسور":"Digital Inverter","صفحه‌نمایش":"Family Hub 21.5″"},priceMin:72000000,priceMax:84000000,storeCount:12,desc:"یخچال هوشمند فرنچ دور با صفحه Family Hub",tags:["هوشمند","فرنچ‌دور","اینورتر"],rating:4.4,reviews:987,ph:[{d:"۳۰ روز",p:78e6},{d:"امروز",p:72e6}]},
  {id:"lg-washing",title:"ماشین لباسشویی ال‌جی 8 کیلو — F4WV308S اینورتر",brand:"LG",catId:"appliance",subId:"appliance-washing",img:"https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&h=300&fit=crop&auto=format",specs:{"ظرفیت":"8 کیلوگرم","موتور":"TrueStream Direct Drive","کلاس انرژی":"A+++","دور":"1400 دور","برنامه‌ها":"14 برنامه","نوع بارگذاری":"از جلو","وزن":"66 کیلوگرم"},priceMin:28500000,priceMax:34000000,storeCount:18,desc:"ماشین لباسشویی اینورتر با موتور مستقیم و کلاس A+++",tags:["اینورتر","کم‌مصرف","بدون‌تسمه"],rating:4.5,reviews:1640,ph:[{d:"۶۰ روز",p:32e6},{d:"۳۰ روز",p:30e6},{d:"امروز",p:28.5e6}]},
  {id:"dyson-v15",title:"جاروبرقی بی‌سیم دایسون V15 Detect Absolute",brand:"Dyson",catId:"appliance",subId:"appliance-vacuum",img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format",specs:{"نوع":"بی‌سیم","باتری":"60 دقیقه","قدرت مکش":"240 AW","فیلتر":"HEPA","تشخیص ذرات":"لیزر","وزن":"3.1 کیلوگرم","سطح":"تمام سطوح"},priceMin:38000000,priceMax:45000000,storeCount:9,desc:"جاروبرقی بی‌سیم با تشخیص ذرات لیزری و فیلتر HEPA",tags:["بی‌سیم","HEPA","لیزر"],rating:4.7,reviews:823,ph:[{d:"۶۰ روز",p:42e6},{d:"امروز",p:38e6}]},
  {id:"airpods-pro",title:"ایرپاد پرو Apple AirPods Pro 2nd Gen",brand:"Apple",catId:"mobile",subId:"mobile-earphone",img:"https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=400&h=300&fit=crop&auto=format",specs:{"نوع":"In-Ear بی‌سیم","حذف‌نویز":"فعال ANC","شفافیت":"حالت Transparency","باتری":"30 ساعت (با کیس)","تراشه":"H2","مقاومت":"IP54","اتصال":"Bluetooth 5.3"},priceMin:11500000,priceMax:13800000,storeCount:25,desc:"ایرپاد پرو نسل دوم با حذف نویز پیشرفته و تراشه H2",tags:["اپل","حذف‌نویز","بی‌سیم"],rating:4.8,reviews:5710,ph:[{d:"۶۰ روز",p:13e6},{d:"۳۰ روز",p:12e6},{d:"امروز",p:11.5e6}]},
  {id:"galaxy-tab-s9",title:"تبلت سامسونگ Galaxy Tab S9 — 256GB WiFi",brand:"Samsung",catId:"mobile",subId:"mobile-tablet",img:"https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop&auto=format",specs:{"پردازنده":"Snapdragon 8 Gen 2","رم":"8GB","حافظه":"256GB","صفحه‌نمایش":"11″ Dynamic AMOLED 2X 120Hz","S Pen":"دارد","باتری":"8400mAh","مقاومت":"IP68"},priceMin:49000000,priceMax:56000000,storeCount:14,desc:"تبلت پریمیوم سامسونگ با S Pen و صفحه AMOLED 120Hz",tags:["S Pen","تبلت","AMOLED"],rating:4.6,reviews:1280,ph:[{d:"۳۰ روز",p:53e6},{d:"امروز",p:49e6}]},
  {id:"canon-r50",title:"دوربین بدون آینه کانن EOS R50 — کیت 18-45",brand:"Canon",catId:"av",subId:"av-camera",img:"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop&auto=format",specs:{"سنسور":"24.2MP APS-C CMOS","پردازنده":"DIGIC X","فوکوس":"Dual Pixel II AF","فیلم":"4K 30fps","تثبیت":"IS دیجیتال","صفحه":"3″ لمسی گردان","وزن":"375 گرم"},priceMin:32000000,priceMax:38000000,storeCount:11,desc:"دوربین بدون آینه سبک و هوشمند برای عکاسان مبتدی و میان‌رده",tags:["بدون‌آینه","کانن","4K"],rating:4.5,reviews:672,ph:[{d:"۳۰ روز",p:35e6},{d:"امروز",p:32e6}]},
  {id:"bosch-drill",title:"دریل بوش GSB 185-LI — 18 ولت بدون برس",brand:"Bosch",catId:"tool",subId:"tool-power",img:"https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop&auto=format",specs:{"ولتاژ":"18V","موتور":"بدون جاروبک","گشتاور":"55 نیوتون متر","سرعت":"2 دنده","باتری":"2Ah Li-Ion","وزن":"1.4 کیلوگرم","فنچر":"4cm"},priceMin:6800000,priceMax:8500000,storeCount:16,desc:"دریل پیچ‌گوشتی بوش 18 ولت با موتور بی‌جاروبک",tags:["بوش","18V","بدون‌برس"],rating:4.6,reviews:445,ph:[{d:"۳۰ روز",p:7.5e6},{d:"امروز",p:6.8e6}]},
  {id:"samsung-tv43",title:"تلویزیون سامسونگ 43 اینچ Crystal 4K — AU7000",brand:"Samsung",catId:"av",subId:"av-tv",img:"https://images.unsplash.com/photo-1593359677879-a4bb92f4834c?w=400&h=300&fit=crop&auto=format",specs:{"اندازه":"43 اینچ","تکنولوژی":"Crystal UHD","رزولوشن":"4K UHD","پردازنده":"Crystal Processor 4K","HDR":"HDR10+","سیستم‌عامل":"Tizen","پورت‌ها":"3×HDMI, 2×USB"},priceMin:18500000,priceMax:23000000,storeCount:22,desc:"تلویزیون Crystal 4K سامسونگ با پردازنده کریستال",tags:["Crystal","4K","43اینچ"],rating:4.3,reviews:3120,ph:[{d:"۳۰ روز",p:21e6},{d:"امروز",p:18.5e6}]},
];
const AN_OFFERS:Record<string,AnOffer[]>={};
AN_PRODS.forEach(p=>{AN_OFFERS[p.id]=mkAnOffers(p.priceMin,p.storeCount);});

// Extended mock product database
const MOCK_BRANDS_BY_CAT:Record<string,string[]>={
  mobile:["سامسونگ","اپل","شیائومی","هوآوی","وان‌پلاس","ریلمی","اوپو","نوکیا","موتورولا","سونی"],
  laptop:["ASUS","Lenovo","HP","Dell","Acer","MSI","Apple","Razer","Huawei","Samsung"],
  appliance:["سامسونگ","ال‌جی","بوش","آریستون","آبسال","اسنوا","امرسان","هایر","پاناسونیک","دایو"],
  av:["سامسونگ","سونی","ال‌جی","شارپ","هایسنس","TCL","پاناسونیک","فیلیپس","JBL","بوز"],
  fashion:["زارا","اچ‌اند‌ام","مانگو","لویی","برشکا","پول‌اند‌بر","دیزل","لی‌کوپر","لاکوست","نایک"],
  beauty:["نیوآ","گارنیه","لورآل","پنتن","داو","آوون","ویشی","لاروش‌پوزه","سواو","بایودرما"],
  sport:["نایک","آدیداس","پوما","ریباک","آندرآرمور","نیو‌بالانس","سالومون","مرل","هد","ویلسون"],
  car:["بوش","NGK","کاسترول","موبیل","شل","توتال","مان","فیلیپس","گارمین","پایونیر"],
  health:["فیلیپس","اومرون","بیورر","برون","مدیسانا","پاناسونیک","وتامیکس","پولار","گارمین","ویترا"],
  tool:["بوش","دوالت","ماکیتا","استنلی","هیلتی","میلواکی","رایوبی","بلک‌اند‌دکر","مترابو","AEG"],
  toy:["لگو","پلی‌موبیل","هات‌ویلز","ماتل","هزبرو","مگا‌بلاکس","کینکس","فیشر‌پرایس","برادر","تامی"],
};
const MOCK_PREFIXES:Record<string,string[]>={
  mobile:["گوشی هوشمند","گوشی موبایل","تلفن همراه"],
  laptop:["لپ‌تاپ","نوت‌بوک","رایانه قابل حمل"],
  appliance:["لوازم خانگی","دستگاه خانگی","تجهیزات خانه"],
  av:["تلویزیون","هدفون","اسپیکر","دوربین"],
  fashion:["پوشاک","لباس","کفش","کیف"],
  beauty:["محصول مراقبتی","کرم","شامپو","لوسیون"],
  sport:["تجهیزات ورزشی","کفش ورزشی","پوشاک ورزشی"],
  car:["لوازم خودرو","روغن موتور","تایر"],
  health:["تجهیزات پزشکی","دستگاه سلامت","مکمل"],
  tool:["ابزار برقی","ابزار دستی","دریل","پیچ‌گوشتی"],
  toy:["اسباب‌بازی","بازی فکری","پازل","بلوک"],
};
const UNSPLASH_IDS=["1496181133206-80ce9b88a853","1517336714731-489689fd1ca8","1588872657578-7efd1f1555ed","1505740420928-5e560c06d30e","1593359677879-a4bb92f4834c","1558618666-fcd25c85cd64","1572536147248-ac59a8abfa4b","1544244015-0df4b3ffc6b0"];
interface AnCat{id:string;title:string;subcats:{id:string;title:string;pids:string[]}[];}
const AN_CATS:AnCat[]=[
  {id:"mobile",title:"موبایل و کالای دیجیتال",subcats:[{id:"mobile-iphone",title:"آیفون",pids:["iphone15pm"]},{id:"mobile-samsung",title:"سامسونگ",pids:["s24ultra","galaxy-a54"]},{id:"mobile-mid",title:"میان‌رده",pids:["galaxy-a54"]},{id:"mobile-watch",title:"ساعت هوشمند",pids:["apple-watch-s9"]},{id:"mobile-tablet",title:"تبلت",pids:["galaxy-tab-s9"]},{id:"mobile-earphone",title:"ایرپاد و هندزفری",pids:["airpods-pro"]},{id:"mobile-acc",title:"لوازم جانبی موبایل",pids:[]}]},
  {id:"laptop",title:"لپ‌تاپ، کامپیوتر، اداری",subcats:[{id:"laptop-gaming",title:"لپ‌تاپ گیمینگ",pids:["asus-rog-g16"]},{id:"laptop-office",title:"لپ‌تاپ اداری",pids:["hp-pav15"]},{id:"laptop-student",title:"لپ‌تاپ دانشجویی",pids:["asus-vb15","lenovo-ip5"]},{id:"laptop-macbook",title:"مک‌بوک",pids:["macbook-m2"]},{id:"laptop-2in1",title:"لپ‌تاپ ۲در۱",pids:[]},{id:"laptop-desktop",title:"کامپیوتر دسکتاپ",pids:[]},{id:"laptop-printer",title:"پرینتر و اسکنر",pids:[]},{id:"laptop-monitor",title:"مانیتور",pids:[]}]},
  {id:"hypermarket",title:"هایپرمارکت",subcats:[{id:"hyper-food",title:"مواد غذایی",pids:[]},{id:"hyper-cleaning",title:"مواد شستشو",pids:[]},{id:"hyper-kitchen",title:"لوازم آشپزخانه",pids:[]},{id:"hyper-beverage",title:"نوشیدنی",pids:[]},{id:"hyper-hygiene",title:"بهداشت شخصی",pids:[]}]},
  {id:"appliance",title:"لوازم خانگی",subcats:[{id:"appliance-fridge",title:"یخچال و فریزر",pids:["samsung-rf23"]},{id:"appliance-washing",title:"ماشین لباسشویی",pids:["lg-washing"]},{id:"appliance-vacuum",title:"جاروبرقی",pids:["dyson-v15"]},{id:"appliance-cooker",title:"اجاق گاز",pids:[]},{id:"appliance-dishwash",title:"ماشین ظرفشویی",pids:[]},{id:"appliance-small",title:"لوازم برقی کوچک",pids:[]}]},
  {id:"fashion",title:"مد و پوشاک",subcats:[{id:"fashion-men",title:"پوشاک مردانه",pids:[]},{id:"fashion-women",title:"پوشاک زنانه",pids:[]},{id:"fashion-shoes",title:"کفش و کتانی",pids:[]},{id:"fashion-bag",title:"کیف و کوله",pids:[]},{id:"fashion-watch",title:"ساعت مچی",pids:[]},{id:"fashion-sunglasses",title:"عینک آفتابی",pids:[]}]},
  {id:"beauty",title:"زیبایی و بهداشت",subcats:[{id:"beauty-skin",title:"مراقبت پوست",pids:[]},{id:"beauty-hair",title:"مراقبت مو",pids:[]},{id:"beauty-perfume",title:"عطر و ادکلن",pids:[]},{id:"beauty-makeup",title:"آرایشی",pids:[]},{id:"beauty-device",title:"دستگاه‌های زیبایی",pids:[]}]},
  {id:"av",title:"صوتی و تصویری",subcats:[{id:"av-tv",title:"تلویزیون",pids:["samsung-tv65"]},{id:"av-headphone",title:"هدفون و هدست",pids:["sony-wh1000xm5"]},{id:"av-speaker",title:"اسپیکر",pids:[]},{id:"av-camera",title:"دوربین عکاسی",pids:["canon-r50"]},{id:"av-projector",title:"پروجکتور",pids:[]},{id:"av-gaming-audio",title:"صدا برای گیمینگ",pids:[]}]},
  {id:"car",title:"خودرو و وسایل نقلیه",subcats:[{id:"car-acc",title:"لوازم خودرو",pids:[]},{id:"car-elec",title:"الکترونیک خودرو",pids:[]},{id:"car-tire",title:"لاستیک و رینگ",pids:[]},{id:"car-oil",title:"روغن و مایعات",pids:[]}]},
  {id:"health",title:"سلامت و پزشکی",subcats:[{id:"health-device",title:"تجهیزات پزشکی",pids:[]},{id:"health-supp",title:"مکمل‌ها",pids:[]},{id:"health-dental",title:"دهان و دندان",pids:[]},{id:"health-eyes",title:"بینایی",pids:[]}]},
  {id:"culture",title:"فرهنگی و هنری",subcats:[{id:"culture-book",title:"کتاب",pids:[]},{id:"culture-music",title:"موسیقی",pids:[]},{id:"culture-art",title:"لوازم هنری",pids:[]},{id:"culture-stationary",title:"لوازم‌التحریر",pids:[]}]},
  {id:"sport",title:"ورزش و تناسب اندام",subcats:[{id:"sport-fitness",title:"تجهیزات بدنسازی",pids:[]},{id:"sport-outdoor",title:"ورزش‌های بیرونی",pids:[]},{id:"sport-clothing",title:"پوشاک ورزشی",pids:[]},{id:"sport-cycling",title:"دوچرخه و اسکوتر",pids:[]},{id:"sport-swimming",title:"شنا و آب‌بازی",pids:[]}]},
  {id:"toy",title:"اسباب‌بازی و سرگرمی",subcats:[{id:"toy-board",title:"بازی‌های فکری",pids:[]},{id:"toy-console",title:"کنسول بازی",pids:[]},{id:"toy-gaming",title:"لوازم گیمینگ",pids:[]},{id:"toy-remote",title:"کنترلی و ربات",pids:[]},{id:"toy-puzzle",title:"پازل و معما",pids:[]}]},
  {id:"kids",title:"کودک و نوزاد",subcats:[{id:"kids-clothing",title:"پوشاک کودک",pids:[]},{id:"kids-toy",title:"اسباب‌بازی کودک",pids:[]},{id:"kids-stroller",title:"کالسکه و خواب",pids:[]},{id:"kids-feeding",title:"تغذیه نوزاد",pids:[]}]},
  {id:"building",title:"تجهیزات ساختمان",subcats:[{id:"building-paint",title:"رنگ و پوشش",pids:[]},{id:"building-tile",title:"کاشی و سرامیک",pids:[]},{id:"building-plumb",title:"لوله‌کشی",pids:[]},{id:"building-elec",title:"تجهیزات برقی ساختمان",pids:[]}]},
  {id:"tool",title:"ابزارآلات",subcats:[{id:"tool-hand",title:"ابزار دستی",pids:[]},{id:"tool-power",title:"ابزار برقی",pids:["bosch-drill"]},{id:"tool-garden",title:"ابزار باغبانی",pids:[]},{id:"tool-measure",title:"اندازه‌گیری",pids:[]}]},
  {id:"travel",title:"لوازم سفر و کمپینگ",subcats:[{id:"travel-bag",title:"چمدان و کیف سفر",pids:[]},{id:"travel-camp",title:"کمپینگ و طبیعت‌گردی",pids:[]},{id:"travel-climb",title:"کوهنوردی",pids:[]},{id:"travel-acc",title:"لوازم جانبی سفر",pids:[]}]},
  {id:"pet",title:"تجهیزات نگهداری حیوانات",subcats:[{id:"pet-dog",title:"سگ",pids:[]},{id:"pet-cat",title:"گربه",pids:[]},{id:"pet-bird",title:"پرنده",pids:[]},{id:"pet-fish",title:"آکواریوم و ماهی",pids:[]}]},
  {id:"industrial",title:"تجهیزات صنعتی",subcats:[{id:"ind-safety",title:"ایمنی و حفاظت",pids:[]},{id:"ind-machine",title:"ماشین‌آلات",pids:[]},{id:"ind-elec",title:"الکترونیک صنعتی",pids:[]}]},
  {id:"gold",title:"ارز و طلا",subcats:[{id:"gold-coin",title:"سکه و طلا",pids:[]},{id:"gold-jewel",title:"جواهرات",pids:[]},{id:"gold-silver",title:"نقره",pids:[]}]},
  {id:"storeEquip",title:"لوازم فروشگاهی",subcats:[{id:"store-display",title:"دیسپلی و قفسه",pids:[]},{id:"store-pos",title:"دستگاه‌های فروشگاهی",pids:[]},{id:"store-pack",title:"بسته‌بندی",pids:[]}]},
  {id:"other",title:"سایر دسته‌ها",subcats:[{id:"other-office",title:"لوازم اداری",pids:[]},{id:"other-gift",title:"هدایا و تبلیغات",pids:[]},{id:"other-misc",title:"متفرقه",pids:[]}]},
];
function generateMockProds():AnProduct[]{
  const results:AnProduct[]=[];
  let counter=1000;
  const cats=AN_CATS.filter(c=>c.id!=="other"&&c.id!=="gold"&&c.id!=="storeEquip");
  cats.forEach(cat=>{
    const brands=MOCK_BRANDS_BY_CAT[cat.id]||["برند نامشخص"];
    const prefixes=MOCK_PREFIXES[cat.id]||["محصول"];
    cat.subcats.forEach((sub,si)=>{
      const itemsPerSub=Math.max(2,Math.floor(40/cat.subcats.length));
      for(let i=0;i<itemsPerSub&&results.length<1000;i++){
        const brand=brands[(counter+i)%brands.length];
        const prefix=prefixes[si%prefixes.length];
        const modelNum=counter;
        const basePrice=(5+(counter%95))*1000000;
        const storeCount=3+(counter%47);
        counter++;
        results.push({
          id:`mock-${modelNum}`,
          title:`${prefix} ${brand} مدل ${modelNum}`,
          brand,
          catId:cat.id,
          subId:sub.id,
          img:`https://images.unsplash.com/photo-${UNSPLASH_IDS[counter%8]}?w=400&h=300&fit=crop&auto=format`,
          specs:{"مدل":`${brand} ${modelNum}`,"دسته‌بندی":sub.title},
          priceMin:basePrice,
          priceMax:Math.round(basePrice*1.15),
          storeCount,
          desc:`${prefix} ${brand} با کیفیت بالا در دسته ${sub.title}`,
          tags:[brand,cat.title.split(" ")[0],sub.title.split(" ")[0]],
          rating:parseFloat((3.5+(counter%15)/10).toFixed(1)),
          reviews:10+(counter*7)%9990,
          ph:[{d:"۳۰ روز",p:Math.round(basePrice*1.08)},{d:"امروز",p:basePrice}],
        });
      }
    });
  });
  return results;
}
const ALL_MOCK_PRODS:AnProduct[]=[...AN_PRODS,...generateMockProds()];
function anSearch(q:string):AnProduct[]{
  const lq=q.toLowerCase().replace(/‌/g," ").replace(/\s+/g," ");
  return ALL_MOCK_PRODS.filter(p=>{
    const text=(p.title+" "+p.brand+" "+p.tags.join(" ")+" "+p.desc).toLowerCase();
    return lq.split(" ").some(w=>w.length>1&&text.includes(w));
  });
}
function getAnCatProds(catId:string,limit=20):AnProduct[]{
  return ALL_MOCK_PRODS.filter(p=>p.catId===catId).slice(0,limit);
}
function sortOffers(offers:AnOffer[],mode:"price"|"rating"|"avail"):AnOffer[]{
  const s=[...offers];
  if(mode==="price")s.sort((a,b)=>a.price-b.price);
  else if(mode==="rating")s.sort((a,b)=>(ANS[b.sid]?.sc||3)-(ANS[a.sid]?.sc||3));
  else s.sort((a,b)=>(b.inStock?1:0)-(a.inStock?1:0));
  return s;
}
function getAiComment(q:string,p:AnProduct):string{
  const ql=q.toLowerCase();
  // Price budget check
  const budgetMatch=ql.match(/(\d[\d,]+)\s*(میلیون|م)/);
  if(budgetMatch){
    const budget=parseInt(budgetMatch[1].replace(/,/g,""))*1000000;
    if(p.priceMin<=budget&&p.priceMin>=budget*0.8)return`این مدل با قیمت ${fa(p.priceMin)} تومان دقیقاً در محدوده بودجه شما قرار دارد.`;
    if(p.priceMin<budget*0.8)return`این مدل حدود ${fa(budget-p.priceMin)} تومان زیر سقف بودجه شماست — ارزش خرید بالاتری دارد.`;
    if(p.priceMin>budget)return`این مدل کمی بالاتر از بودجه شماست، اما ممکن است ارزشش را داشته باشد.`;
  }
  // Gaming
  if(ql.includes("گیمینگ")&&p.specs["گرافیک"])return`با گرافیک ${p.specs["گرافیک"]} این لپ‌تاپ گزینه مناسبی برای گیمینگ است. صفحه ${p.specs["صفحه‌نمایش"]||""} تجربه بصری خوبی ارائه می‌دهد.`;
  // Student
  if((ql.includes("دانشگاه")||ql.includes("دانشجو"))&&p.specs["وزن"])return`وزن ${p.specs["وزن"]} حمل روزانه را آسان می‌کند. باتری ${p.specs["باتری"]||"مناسب"} برای یک روز کلاس کافی است.`;
  // Office/work
  if((ql.includes("اداری")||ql.includes("کاری"))&&p.specs["رم"])return`رم ${p.specs["رم"]} با حافظه ${p.specs["حافظه"]||""} برای مالتی‌تسکینگ اداری کافی است.`;
  // Photo/video
  if((ql.includes("عکاسی")||ql.includes("فیلم")||ql.includes("دوربین"))&&p.specs["دوربین"])return`دوربین ${p.specs["دوربین"]} برای ثبت لحظات با کیفیت بالا مناسب است.`;
  // Wireless
  if(ql.includes("بی‌سیم")||ql.includes("وایرلس")){if(p.specs["باتری"])return`با باتری ${p.specs["باتری"]} استقلال خوبی از شارژر دارید.`;}
  // Apple brand preference
  if(ql.includes("اپل")||ql.includes("apple"))return`${p.brand} این مدل را با اکوسیستم iOS/macOS یکپارچه کرده. اگر از سایر محصولات اپل استفاده می‌کنید، سازگاری عالی خواهید داشت.`;
  // Samsung brand preference
  if(ql.includes("سامسونگ"))return`این محصول سامسونگ در ${toFaDigits(String(p.storeCount))} فروشگاه موجود است و با امتیاز ${toFaDigits(String(p.rating))} از ۵ بازخورد مثبتی داشته.`;
  // Price drop indicator
  if(p.ph.length>1&&p.ph[p.ph.length-1].p<p.ph[0].p){
    const drop=Math.round((p.ph[0].p-p.ph[p.ph.length-1].p)/p.ph[0].p*100);
    return`قیمت این محصول اخیراً ${toFaDigits(String(drop))}٪ کاهش یافته — فرصت مناسبی برای خرید است.`;
  }
  // Multi-store comparison
  if(p.storeCount>=20)return`این محصول در ${toFaDigits(String(p.storeCount))} فروشگاه موجود است. مقایسه قیمت فروشگاه‌ها می‌تواند تا ${fa(p.priceMax-p.priceMin)} تومان صرفه‌جویی داشته باشد.`;
  // High rating
  if(p.rating>=4.7)return`با امتیاز ${toFaDigits(String(p.rating))} از ۵ و ${toFaDigits(String(p.reviews))} نظر، این محصول از نظر رضایت کاربران در رده بالا قرار دارد.`;
  return`از ${fa(p.priceMin)} تومان در ${toFaDigits(String(p.storeCount))} فروشگاه موجود است. مشخصات کامل را قبل از خرید بررسی کنید.`;
}
function AnStars({r}:{r:number}){return<span className="am-stars">{"★".repeat(Math.floor(r))}{"☆".repeat(5-Math.floor(r))}</span>;}
function AnProductCard({p,onPress}:{p:AnProduct;onPress:(pid:string)=>void}){
  const drop=p.ph.length>1&&p.ph[p.ph.length-1].p<p.ph[0].p?Math.round((p.ph[0].p-p.ph[p.ph.length-1].p)/p.ph[0].p*100):0;
  return(
    <button onClick={()=>onPress(p.id)} className="am-product-card" style={{display:"flex",flexDirection:"column"}}>
      {drop>0&&<span className="am-badge-drop">↓{toFaDigits(String(drop))}٪</span>}
      <div className="am-product-card-img">
        <img src={p.img} alt={p.title} style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/>
      </div>
      <div className="am-product-card-body" style={{flex:1}}>
        <div style={{fontSize:11,fontWeight:600,color:"var(--am-muted)",marginBottom:4}}>{p.brand}</div>
        <div style={{fontSize:13,fontWeight:700,color:"var(--am-text)",lineHeight:1.55,marginBottom:8,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{p.title}</div>
        <div style={{marginBottom:6}}><span className="am-price">از {fa(p.priceMin)}</span><span className="am-price-unit">تومان</span></div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <AnStars r={p.rating}/>
          <span style={{fontSize:10,color:"var(--am-muted)"}}>{toFaDigits(String(p.storeCount))} فروشگاه</span>
        </div>
      </div>
    </button>
  );
}
function AnSH({title,action,onAction}:{title:string;action?:string;onAction?:()=>void}){
  return(
    <div className="am-sh">
      <div className="am-sh-title">{title}</div>
      {action&&<button onClick={onAction} className="am-sh-action">{action} ←</button>}
    </div>
  );
}
function AnCatSvg({cid,sz=20}:{cid:string;sz?:number}){
  const p={width:sz,height:sz,fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
  const m:Record<string,React.ReactNode>={
    mobile:<svg {...p} viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="3"/><path d="M12 18h.01"/></svg>,
    laptop:<svg {...p} viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M0 21h24M8 17l-2 4M16 17l2 4"/></svg>,
    av:<svg {...p} viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
    appliance:<svg {...p} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M6 9h4M8 6v6M15 9h3M15 12h3"/></svg>,
    hypermarket:<svg {...p} viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
    fashion:<svg {...p} viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
    beauty:<svg {...p} viewBox="0 0 24 24"><path d="M12 2a5 5 0 0 0-5 5v1H5l-1 14h16L19 8h-2V7a5 5 0 0 0-5-5z"/></svg>,
    sport:<svg {...p} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>,
    health:<svg {...p} viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3 6 12H2"/></svg>,
    car:<svg {...p} viewBox="0 0 24 24"><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h12l4 4v4a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17" r="2.5"/><circle cx="17.5" cy="17" r="2.5"/></svg>,
    kids:<svg {...p} viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg>,
    toy:<svg {...p} viewBox="0 0 24 24"><rect x="5" y="8" width="14" height="12" rx="2"/><path d="M8 8V5a4 4 0 0 1 8 0v3"/></svg>,
    other:<svg {...p} viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg>,
    culture:<svg {...p} viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
    building:<svg {...p} viewBox="0 0 24 24"><rect x="2" y="3" width="9" height="18" rx="1"/><rect x="13" y="9" width="9" height="12" rx="1"/><path d="M6 7h1M6 11h1M15 13h1M15 17h1"/></svg>,
    tool:<svg {...p} viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
    travel:<svg {...p} viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6M9 17h6M10 9h4"/></svg>,
    pet:<svg {...p} viewBox="0 0 24 24"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.558 2.344-2.828"/><path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.558-2.344-2.828"/><path d="M8 14v.5M16 14v.5M11.25 16.25h1.5L12 17z"/><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306"/></svg>,
    industrial:<svg {...p} viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M12 12v4M10 14h4"/></svg>,
    gold:<svg {...p} viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2.5"/><path d="M9 3.5h6M9 20.5h6"/></svg>,
    storeEquip:<svg {...p} viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  };
  return <>{m[cid]||m["other"]}</>;
}
function getProductStrengths(p:AnProduct):string[]{
  const s:string[]=[];
  if(p.rating>=4.5)s.push(`امتیاز بالای ${toFaDigits(String(p.rating))} از ۵ — رضایت کاربران عالی است`);
  if(p.storeCount>=20)s.push(`موجود در ${toFaDigits(String(p.storeCount))} فروشگاه — رقابت قیمتی بالا`);
  if(p.specs["باتری"])s.push(`باتری ${p.specs["باتری"]} — عمر مناسب`);
  if(p.specs["وزن"])s.push(`وزن ${p.specs["وزن"]} — قابل حمل و سبک`);
  if(p.ph.length>1&&p.ph[p.ph.length-1].p<p.ph[0].p)s.push("روند قیمتی نزولی — فرصت خوبی برای خرید");
  if(s.length===0)s.push("در دسته‌بندی خود گزینه مناسبی محسوب می‌شود");
  return s.slice(0,3);
}
function getProductWeaknesses(p:AnProduct):string[]{
  const w:string[]=[];
  if(p.rating<4.3)w.push("بازخورد کاربران متوسط است — بررسی نظرات توصیه می‌شود");
  if(p.storeCount<5)w.push("تعداد فروشگاه‌های کم — گزینه‌های قیمتی محدود");
  if(p.priceMax-p.priceMin>p.priceMin*0.15)w.push("اختلاف قیمت بین فروشگاه‌ها زیاد است — مقایسه دقیق ضروری است");
  if(w.length===0)w.push("در حال حاضر نقطه ضعف مشخصی شناسایی نشده است");
  return w.slice(0,2);
}
function AnProductMiniCard({p,onPress,compareMode,compareSelected,onCompareToggle}:{
  p:AnProduct;onPress:(pid:string)=>void;
  compareMode?:boolean;compareSelected?:boolean;onCompareToggle?:(pid:string)=>void;
}){
  const drop=p.ph.length>1&&p.ph[p.ph.length-1].p<p.ph[0].p?Math.round((p.ph[0].p-p.ph[p.ph.length-1].p)/p.ph[0].p*100):0;
  return(
    <button onClick={()=>{if(compareMode){if(onCompareToggle)onCompareToggle(p.id);}else{onPress(p.id);}}}
      className={`am-mini-card${compareSelected?" compare-sel":""}`}
      style={{opacity:compareMode&&!compareSelected?0.55:1}}>
      {drop>0&&<span className="am-badge-drop">↓{toFaDigits(String(drop))}٪</span>}
      {compareSelected&&<div className="am-check-badge">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
      </div>}
      <div className="am-mini-card-img">
        <img src={p.img} alt={p.title} style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/>
      </div>
      <div className="am-mini-card-body">
        <div style={{fontSize:10,fontWeight:600,color:"var(--am-muted)",marginBottom:4}}>{p.brand}</div>
        <div style={{fontSize:12,fontWeight:700,color:"var(--am-text)",lineHeight:1.55,marginBottom:7,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{p.title}</div>
        <div style={{marginBottom:5}}><span className="am-price" style={{fontSize:13}}>از {fa(p.priceMin)}</span><span className="am-price-unit"> ت</span></div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <AnStars r={p.rating}/>
          <span style={{fontSize:9,color:"var(--am-muted)"}}>{toFaDigits(String(p.storeCount))} فروشگاه</span>
        </div>
      </div>
    </button>
  );
}
function AnCarousel({title,products,onProduct,onMore,compareMode,compareSelected,onCompareToggle}:{
  title:string;products:AnProduct[];onProduct:(pid:string)=>void;onMore:()=>void;
  compareMode?:boolean;compareSelected?:string[];onCompareToggle?:(pid:string)=>void;
}){
  if(products.length===0)return null;
  return(
    <div className="am-carousel-wrap">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,padding:"0 16px"}}>
        <div className="am-sh-title">{title}</div>
        <button onClick={onMore} className="am-sh-action">همه موارد ←</button>
      </div>
      <div className="am-carousel-row">
        {products.slice(0,15).map(p=><AnProductMiniCard key={p.id} p={p} onPress={onProduct} compareMode={compareMode} compareSelected={compareSelected?.includes(p.id)} onCompareToggle={onCompareToggle}/>)}
        <button onClick={onMore} className="am-more-btn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          <span>همه موارد</span>
        </button>
      </div>
    </div>
  );
}
function AnSearchResultCard({p,onPress,aiComment,compareMode,compareSelected,onCompareToggle}:{
  p:AnProduct;onPress:(pid:string)=>void;aiComment?:string;
  compareMode?:boolean;compareSelected?:boolean;onCompareToggle?:(pid:string)=>void;
}){
  const drop=p.ph.length>1&&p.ph[p.ph.length-1].p<p.ph[0].p?Math.round((p.ph[0].p-p.ph[p.ph.length-1].p)/p.ph[0].p*100):0;
  const specEntries=Object.entries(p.specs).slice(0,3);
  return(
    <button onClick={()=>compareMode?onCompareToggle?.(p.id):onPress(p.id)}
      className={`am-result-card${compareSelected?" compare-sel":""}`}>
      {compareSelected&&<div className="am-check-badge" style={{position:"absolute",top:12,left:12}}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
      </div>}
      {drop>0&&<span className="am-badge-drop-inv">↓{toFaDigits(String(drop))}٪</span>}
      <img src={p.img} alt={p.title} className="am-result-img" loading="lazy"/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:11,fontWeight:700,color:"var(--am-accent)",marginBottom:2}}>{p.brand}</div>
        <div style={{fontSize:14,fontWeight:800,color:"var(--am-text)",lineHeight:1.5,marginBottom:6,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{p.title}</div>
        <div style={{marginBottom:5}}><span className="am-price" style={{fontSize:15}}>از {fa(p.priceMin)}</span><span className="am-price-unit"> تومان</span></div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
          <AnStars r={p.rating}/>
          <span style={{fontSize:11,color:"var(--am-muted)"}}>{toFaDigits(String(p.storeCount))} فروشگاه</span>
          {drop>0&&<span style={{fontSize:10,background:"rgba(239,68,68,0.08)",color:"#DC2626",borderRadius:6,padding:"2px 7px",fontWeight:700}}>↓{toFaDigits(String(drop))}٪ کاهش قیمت</span>}
          {p.storeCount>=20&&<span style={{fontSize:10,background:"rgba(10,158,140,0.08)",color:"var(--am-accent)",borderRadius:6,padding:"2px 7px",fontWeight:700}}>رقابت قیمتی</span>}
        </div>
        {specEntries.length>0&&(
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:aiComment?7:0}}>
            {specEntries.map(([k,v])=>(
              <span key={k} style={{fontSize:10,background:"var(--am-bg)",color:"var(--am-muted)",borderRadius:6,padding:"2px 8px",border:"1px solid var(--am-border)"}}>{k}: {v}</span>
            ))}
          </div>
        )}
        {aiComment&&<div className="am-ai-comment" style={{marginTop:6}}>{aiComment}</div>}
      </div>
    </button>
  );
}
interface ChatMsg{role:"user"|"ai";text:string;pids?:string[]}

function AnMarketHome({onProduct,onCat,onGoCats,onSearch,compareMode,compareSelected,onCompareToggle,onBack}:{
  onProduct:(pid:string)=>void;onCat:(cid:string)=>void;onGoCats:()=>void;onSearch:(q:string)=>void;
  compareMode?:boolean;compareSelected?:string[];onCompareToggle?:(pid:string)=>void;onBack?:()=>void;
}){
  const [searchQ,setSearchQ]=useState("");
  const [imgPreview,setImgPreview]=useState<string|null>(null);
  const [imgName,setImgName]=useState<string|null>(null);
  const fileRef=useRef<HTMLInputElement>(null);

  const handleSearch=()=>{
    if(imgName){const q=`__img__${imgName}`;setImgPreview(null);setImgName(null);setSearchQ("");onSearch(q);return;}
    const q=searchQ.trim();if(q){setSearchQ("");onSearch(q);}
  };
  const handleImgChange=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    setImgName(file.name);
    const reader=new FileReader();
    reader.onload=(ev)=>setImgPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    if(fileRef.current)fileRef.current.value="";
  };;

  /* ── Category data ── */
  const CATS_DISPLAY=[
    {id:"mobile",label:"موبایل و دیجیتال",path:"M12 18h.01M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z"},
    {id:"laptop",label:"لپ‌تاپ و کامپیوتر",path:"M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 0 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 0-2-2V9m0 0h18"},
    {id:"hypermarket",label:"هایپرمارکت",path:"M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0"},
    {id:"appliance",label:"لوازم خانگی",path:"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10"},
    {id:"fashion",label:"مد و پوشاک",path:"M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"},
    {id:"beauty",label:"زیبایی و بهداشت",path:"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"},
    {id:"av",label:"صوتی و تصویری",path:"M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"},
    {id:"car",label:"خودرو",path:"M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2 M17 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M7 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"},
    {id:"health",label:"سلامت و پزشکی",path:"M22 12h-4l-3 9L9 3l-3 9H2"},
    {id:"culture",label:"فرهنگ و هنر",path:"M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"},
    {id:"sport",label:"ورزش",path:"M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zM2.5 12.5h19M12 2.5C9.5 8 9.5 16 12 22M12 2.5c2.5 5.5 2.5 13.5 0 19"},
    {id:"toy",label:"اسباب‌بازی",path:"M9 19V6l12-3v13 M9 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M21 16a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"},
    {id:"kids",label:"کودک و نوزاد",path:"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75"},
    {id:"building",label:"ساختمان",path:"M2 20h20 M4 20V10l8-6 8 6v10"},
    {id:"tool",label:"ابزارآلات",path:"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"},
    {id:"travel",label:"سفر و کمپینگ",path:"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"},
    {id:"pet",label:"حیوانات خانگی",path:"M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5 M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.45-2.344-2.5 M8 14v.5 M16 14v.5 M11.25 16.25h1.5L12 17l-.75-.75z M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 22 12 22s8-3.272 8-7.444c0-1.1-.2-2.2-.5-3.2"},
    {id:"industrial",label:"صنعتی",path:"M12 22V12 M12 12L2 7l10-5 10 5-10 5z M2 17l10 5 10-5 M2 12l10 5 10-5"},
    {id:"gold",label:"ارز و طلا",path:"M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"},
    {id:"storeEquip",label:"لوازم فروشگاهی",path:"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10"},
    {id:"other",label:"سایر دسته‌ها",path:"M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 16v-4 M12 8h.01"},
  ];

  /* ── Product data ── */
  const deals=ALL_MOCK_PRODS.filter(p=>p.ph.length>1&&p.ph[p.ph.length-1].p<p.ph[0].p);
  const topRated=[...ALL_MOCK_PRODS].sort((a,b)=>b.rating-a.rating).slice(0,30);
  const mostCompared=[...ALL_MOCK_PRODS].sort((a,b)=>b.storeCount-a.storeCount).slice(0,30);
  const budget=ALL_MOCK_PRODS.filter(p=>p.priceMin<15000000).slice(0,30);
  const highValue=[...ALL_MOCK_PRODS].sort((a,b)=>b.reviews-a.reviews).slice(0,30);
  const mostReviewed=[...ALL_MOCK_PRODS].sort((a,b)=>b.reviews-a.reviews).slice(5,35);

  const TRENDING=["لپ‌تاپ ایسوس","گوشی سامسونگ","تلویزیون ۵۵ اینچ","هدفون بی‌سیم","یخچال سامسونگ","دوربین کانن","ایرپاد اپل","ربات جارو","ماشین ظرفشویی","تبلت سامسونگ","مانیتور گیمینگ","کفش اسپرت","ساعت هوشمند","دستبند فیتنس","کتری هوشمند"];

  /* Auto-scroll ref for price-drop deals */
  const dealsScrollRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const el=dealsScrollRef.current;
    if(!el)return;
    let paused=false;
    const pause=()=>{paused=true;};
    const resume=()=>{setTimeout(()=>{paused=false;},1800);};
    el.addEventListener("touchstart",pause,{passive:true});
    el.addEventListener("touchend",resume,{passive:true});
    el.addEventListener("mouseenter",pause);
    el.addEventListener("mouseleave",resume);
    const iv=setInterval(()=>{
      if(paused||!el)return;
      const maxScroll=el.scrollWidth-el.clientWidth;
      if(maxScroll<=0)return;
      if(el.scrollLeft>=maxScroll-2){el.scrollLeft=0;return;}
      el.scrollLeft+=1.2;
    },16);
    return()=>{clearInterval(iv);el.removeEventListener("touchstart",pause);el.removeEventListener("touchend",resume);el.removeEventListener("mouseenter",pause);el.removeEventListener("mouseleave",resume);};
  },[deals.length]);

  return(
    <div style={{paddingBottom:110}}>

      {/* ─── Search Hero ─── */}
      <div style={{background:"var(--am-card)",borderBottom:"1px solid var(--am-border)",padding:"18px 16px 16px",boxShadow:"0 2px 12px rgba(10,25,41,0.05)"}}>
        {/* Brand row */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <div style={{width:42,height:42,borderRadius:14,background:"var(--am-accent)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 4px 16px rgba(10,158,140,0.28), 0 1px 4px rgba(10,158,140,0.16)"}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:17,fontWeight:900,color:"var(--am-text)",letterSpacing:"-0.01em"}}>آن مارکت</div>
            <div style={{fontSize:11,color:"var(--am-muted)"}}>مقایسه قیمت از صدها فروشگاه معتبر</div>
          </div>
          {onBack&&(
            <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:5,background:"var(--am-card)",border:"1px solid var(--am-border)",borderRadius:20,padding:"5px 12px 5px 10px",cursor:"pointer",fontFamily:"Vazirmatn",fontSize:11,fontWeight:700,color:"var(--am-text2)",boxShadow:"var(--am-shadow)",flexShrink:0,whiteSpace:"nowrap" as const}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--am-muted)" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              بازگشت به آن‌پرداز
            </button>
          )}
        </div>

        {/* Main search box */}
        <div style={{background:"var(--am-card)",borderRadius:18,border:"1.5px solid rgba(100,140,180,0.22)",boxShadow:"0 2px 12px rgba(10,25,41,0.08)",overflow:"hidden",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",padding:"4px 10px 4px 14px",gap:8}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--am-muted)" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              value={searchQ}
              onChange={e=>setSearchQ(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")handleSearch();}}
              placeholder="جستجو در بیش از ۱ میلیون محصول..."
              className="am-home-search"
            />
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handleImgChange}/>
            {imgPreview&&(
              <div style={{position:"relative",flexShrink:0}}>
                <img src={imgPreview} alt="تصویر انتخابی" style={{width:32,height:32,borderRadius:8,objectFit:"cover",border:"1.5px solid var(--am-accent)"}}/>
                <button onClick={()=>{setImgPreview(null);setImgName(null);}} style={{position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:"var(--am-accent)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",padding:0}}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            )}
            <button onClick={()=>fileRef.current?.click()} title="جستجوی تصویری" style={{width:36,height:36,borderRadius:10,background:imgPreview?"rgba(10,158,140,0.08)":"var(--am-bg)",border:`1.5px solid ${imgPreview?"var(--am-accent)":"var(--am-border)"}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:imgPreview?"var(--am-accent)":"var(--am-muted)",flexShrink:0}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </button>
            <button onClick={handleSearch} style={{height:38,padding:"0 16px",borderRadius:12,background:searchQ.trim()?"var(--am-accent)":"var(--am-bg)",border:`1.5px solid ${searchQ.trim()?"var(--am-accent)":"var(--am-border)"}`,color:searchQ.trim()?"#FFFFFF":"var(--am-muted)",fontSize:13,fontWeight:800,fontFamily:"Vazirmatn",cursor:"pointer",flexShrink:0,transition:"all .15s",display:"flex",alignItems:"center",gap:6}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              جستجو
            </button>
          </div>
        </div>

        {/* Compare button — glowing brown lamp effect */}
        <button onClick={()=>onCompareToggle?.("__mode__")} style={{display:"flex",alignItems:"center",gap:8,width:"100%",marginBottom:12,padding:"11px 18px",background:compareMode?"linear-gradient(135deg,#92400e,#b45309)":"linear-gradient(135deg,rgba(180,83,9,0.06),rgba(217,119,6,0.04))",border:`1.8px solid ${compareMode?"#b45309":"rgba(180,83,9,0.35)"}`,borderRadius:14,cursor:"pointer",fontFamily:"Vazirmatn",color:compareMode?"#FFFFFF":"#92400e",fontSize:13,fontWeight:800,boxShadow:compareMode?"0 0 20px rgba(180,83,9,0.45),0 0 8px rgba(217,119,6,0.3)":"0 0 10px rgba(180,83,9,0.12)",animation:compareMode?"none":"compare-glow 2s ease-in-out infinite",transition:"all .25s"}}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg>
          {compareMode?"مقایسه فعال است":"مقایسه کن"}
          {compareMode&&compareSelected&&compareSelected.length>0&&<span style={{background:"rgba(255,255,255,0.25)",borderRadius:8,padding:"1px 8px",fontSize:11,marginRight:"auto"}}>{compareSelected.length} محصول</span>}
          {!compareMode&&<span style={{marginRight:"auto",fontSize:11,opacity:0.65,fontWeight:600}}>قیمت محصولات را با هم مقایسه کنید</span>}
          <span style={{width:10,height:10,borderRadius:"50%",background:compareMode?"rgba(255,255,255,0.8)":"#d97706",boxShadow:compareMode?"0 0 8px rgba(255,255,255,0.8)":"0 0 8px rgba(217,119,6,0.9)",animation:"compare-lamp 1.5s ease-in-out infinite",flexShrink:0}}/>
        </button>

        {/* Trending searches — infinite auto-scroll marquee */}
        <div className="am-marquee-wrap" style={{paddingBottom:2}}>
          <div className="am-marquee-track">
            {[...TRENDING,...TRENDING].map((t,i)=>(
              <button key={i} onClick={()=>onSearch(t)} className="am-trending-pill" style={{flexShrink:0}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--am-accent)" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Category shortcuts ─── */}
      <div style={{background:"var(--am-card)",borderBottom:"1px solid var(--am-border)",paddingTop:14,paddingBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 16px",marginBottom:10}}>
          <div style={{fontSize:13,fontWeight:800,color:"var(--am-text)"}}>دسته‌بندی‌ها</div>
          <button onClick={onGoCats} style={{fontSize:12,fontWeight:700,color:"var(--am-accent)",background:"none",border:"none",cursor:"pointer",fontFamily:"Vazirmatn"}}>همه دسته‌ها ←</button>
        </div>
        <div style={{overflowX:"auto",display:"flex",paddingRight:16,paddingLeft:8,scrollbarWidth:"none" as const,gap:4}}>
          {CATS_DISPLAY.map(cat=>(
            <button key={cat.id} onClick={()=>onCat(cat.id)} className="am-cat-chip">
              <div className="am-cat-chip-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={cat.path}/></svg>
              </div>
              <span className="am-cat-chip-label">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Product sections ─── */}
      <div style={{paddingTop:8}}>

        {/* 1. Special offers banner */}
        {deals.length>0&&(
          <div style={{margin:"8px 16px 0",borderRadius:18,overflow:"hidden",background:"linear-gradient(135deg,var(--am-accent),#076B5F)",padding:"18px",marginBottom:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              <div style={{fontSize:15,fontWeight:900,color:"#FFFFFF"}}>کاهش قیمت اخیر</div>
              <div style={{marginRight:"auto",fontSize:11,color:"rgba(255,255,255,0.8)"}}>{toFaDigits(String(deals.length))} محصول</div>
            </div>
            <div ref={dealsScrollRef} style={{overflowX:"auto",display:"flex",gap:10,scrollbarWidth:"none" as const,marginBottom:0}}>
              {deals.slice(0,16).map(p=>{
                const drop=Math.round((p.ph[0].p-p.ph[p.ph.length-1].p)/p.ph[0].p*100);
                return(
                  <button key={p.id} onClick={()=>onProduct(p.id)} style={{flexShrink:0,width:120,background:"rgba(255,255,255,0.12)",borderRadius:14,padding:"10px",border:"1px solid rgba(255,255,255,0.2)",cursor:"pointer",fontFamily:"Vazirmatn",textAlign:"right"}}>
                    <div style={{width:"100%",aspectRatio:"1",borderRadius:10,overflow:"hidden",background:"rgba(255,255,255,0.1)",marginBottom:8}}>
                      <img src={p.img} alt={p.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    </div>
                    <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.9)",lineHeight:1.4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",marginBottom:6}}>{p.title.split(" ").slice(0,4).join(" ")}</div>
                    <div style={{fontSize:12,fontWeight:900,color:"#FFFFFF"}}>{fa(p.priceMin)} <span style={{fontSize:9}}>ت</span></div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.7)",textDecoration:"line-through",marginTop:1}}>{fa(p.ph[0].p)}</div>
                    <div style={{display:"inline-block",background:"rgba(255,255,255,0.25)",borderRadius:6,padding:"2px 7px",fontSize:9,color:"#FFFFFF",fontWeight:800,marginTop:4}}>↓{toFaDigits(String(drop))}٪</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Most compared */}
        <AnCarousel title="بیشترین مقایسه‌شده‌ها" products={mostCompared} onProduct={onProduct} onMore={()=>onSearch("پرمقایسه‌ترین محصولات")} compareMode={compareMode} compareSelected={compareSelected} onCompareToggle={onCompareToggle}/>

        {/* 3. Top rated */}
        <AnCarousel title="بهترین امتیاز کاربران" products={topRated} onProduct={onProduct} onMore={()=>onSearch("محصولات با بهترین امتیاز کاربران")} compareMode={compareMode} compareSelected={compareSelected} onCompareToggle={onCompareToggle}/>

        {/* 4. Mobile */}
        {(()=>{const prods=getAnCatProds("mobile",30);return prods.length>0?<AnCarousel title="موبایل و کالای دیجیتال" products={prods} onProduct={onProduct} onMore={()=>onCat("mobile")} compareMode={compareMode} compareSelected={compareSelected} onCompareToggle={onCompareToggle}/>:null;})()}

        {/* 5. Laptop */}
        {(()=>{const prods=getAnCatProds("laptop",30);return prods.length>0?<AnCarousel title="لپ‌تاپ و کامپیوتر" products={prods} onProduct={onProduct} onMore={()=>onCat("laptop")} compareMode={compareMode} compareSelected={compareSelected} onCompareToggle={onCompareToggle}/>:null;})()}

        {/* 6. High value banner */}
        <div style={{margin:"4px 16px 10px",background:"rgba(99,102,241,0.05)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:14,padding:"13px 16px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:12,background:"rgba(99,102,241,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:800,color:"var(--am-text)"}}>ارزش خرید بالا</div>
            <div style={{fontSize:11,color:"var(--am-muted)"}}>بیشترین رضایت در برابر قیمت</div>
          </div>
        </div>
        <AnCarousel title="ارزش خرید بالا" products={highValue} onProduct={onProduct} onMore={()=>onSearch("محصولات ارزش خرید بالا")} compareMode={compareMode} compareSelected={compareSelected} onCompareToggle={onCompareToggle}/>

        {/* 7. Appliance */}
        {(()=>{const prods=getAnCatProds("appliance",30);return prods.length>0?<AnCarousel title="لوازم خانگی محبوب" products={prods} onProduct={onProduct} onMore={()=>onCat("appliance")} compareMode={compareMode} compareSelected={compareSelected} onCompareToggle={onCompareToggle}/>:null;})()}

        {/* 8. Budget */}
        <AnCarousel title="محصولات اقتصادی" products={budget} onProduct={onProduct} onMore={()=>onSearch("محصولات اقتصادی با قیمت مناسب")} compareMode={compareMode} compareSelected={compareSelected} onCompareToggle={onCompareToggle}/>

        {/* 9. AV */}
        {(()=>{const prods=getAnCatProds("av",30);return prods.length>0?<AnCarousel title="صوتی و تصویری" products={prods} onProduct={onProduct} onMore={()=>onCat("av")} compareMode={compareMode} compareSelected={compareSelected} onCompareToggle={onCompareToggle}/>:null;})()}

        {/* 10. Beauty */}
        {(()=>{const prods=getAnCatProds("beauty",30);return prods.length>0?<AnCarousel title="زیبایی و بهداشت" products={prods} onProduct={onProduct} onMore={()=>onCat("beauty")} compareMode={compareMode} compareSelected={compareSelected} onCompareToggle={onCompareToggle}/>:null;})()}

        {/* 11. Most reviewed */}
        <AnCarousel title="پرنظرترین محصولات" products={mostReviewed} onProduct={onProduct} onMore={()=>onSearch("پرنظرترین و پرامتیازترین محصولات")} compareMode={compareMode} compareSelected={compareSelected} onCompareToggle={onCompareToggle}/>

        {/* 12. Fashion */}
        {(()=>{const prods=getAnCatProds("fashion",30);return prods.length>0?<AnCarousel title="مد و پوشاک" products={prods} onProduct={onProduct} onMore={()=>onCat("fashion")} compareMode={compareMode} compareSelected={compareSelected} onCompareToggle={onCompareToggle}/>:null;})()}

        {/* 13. Sport */}
        {(()=>{const prods=getAnCatProds("sport",30);return prods.length>0?<AnCarousel title="ورزش و تناسب اندام" products={prods} onProduct={onProduct} onMore={()=>onCat("sport")} compareMode={compareMode} compareSelected={compareSelected} onCompareToggle={onCompareToggle}/>:null;})()}

        {/* 14. Health */}
        {(()=>{const prods=getAnCatProds("health",30);return prods.length>0?<AnCarousel title="سلامت و پزشکی" products={prods} onProduct={onProduct} onMore={()=>onCat("health")} compareMode={compareMode} compareSelected={compareSelected} onCompareToggle={onCompareToggle}/>:null;})()}

        {/* 15. Travel */}
        {(()=>{const prods=getAnCatProds("travel",30);return prods.length>0?<AnCarousel title="سفر و کمپینگ" products={prods} onProduct={onProduct} onMore={()=>onCat("travel")} compareMode={compareMode} compareSelected={compareSelected} onCompareToggle={onCompareToggle}/>:null;})()}

        {/* 16. Hypermarket */}
        {(()=>{const prods=getAnCatProds("hypermarket",30);return prods.length>0?<AnCarousel title="هایپرمارکت" products={prods} onProduct={onProduct} onMore={()=>onCat("hypermarket")} compareMode={compareMode} compareSelected={compareSelected} onCompareToggle={onCompareToggle}/>:null;})()}

        {/* 17. Toy */}
        {(()=>{const prods=getAnCatProds("toy",30);return prods.length>0?<AnCarousel title="اسباب‌بازی و سرگرمی" products={prods} onProduct={onProduct} onMore={()=>onCat("toy")} compareMode={compareMode} compareSelected={compareSelected} onCompareToggle={onCompareToggle}/>:null;})()}

        {/* 18. Car */}
        {(()=>{const prods=getAnCatProds("car",30);return prods.length>0?<AnCarousel title="خودرو و لوازم" products={prods} onProduct={onProduct} onMore={()=>onCat("car")} compareMode={compareMode} compareSelected={compareSelected} onCompareToggle={onCompareToggle}/>:null;})()}

        {/* 19. Culture */}
        {(()=>{const prods=getAnCatProds("culture",30);return prods.length>0?<AnCarousel title="فرهنگ و هنر" products={prods} onProduct={onProduct} onMore={()=>onCat("culture")} compareMode={compareMode} compareSelected={compareSelected} onCompareToggle={onCompareToggle}/>:null;})()}

        {/* 20. Kids */}
        {(()=>{const prods=getAnCatProds("kids",30);return prods.length>0?<AnCarousel title="کودک و نوزاد" products={prods} onProduct={onProduct} onMore={()=>onCat("kids")} compareMode={compareMode} compareSelected={compareSelected} onCompareToggle={onCompareToggle}/>:null;})()}

        {/* 21. Gold */}
        {(()=>{const prods=getAnCatProds("gold",30);return prods.length>0?<AnCarousel title="ارز و طلا" products={prods} onProduct={onProduct} onMore={()=>onCat("gold")} compareMode={compareMode} compareSelected={compareSelected} onCompareToggle={onCompareToggle}/>:null;})()}

      </div>

      {/* ─── Bottom discovery button ─── */}
      <div style={{padding:"12px 16px 16px"}}>
        <button onClick={onGoCats} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:12,padding:"18px",background:"var(--am-card)",border:"1.5px solid var(--am-border)",borderRadius:18,cursor:"pointer",fontFamily:"Vazirmatn",color:"var(--am-muted)",fontSize:14,fontWeight:800,boxShadow:"var(--am-shadow)"}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--am-accent)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
          <span>پیدا نشد؟ جستجو در دسته‌بندی‌ها</span>
        </button>
      </div>

    </div>
  );
}
function AnAssistantChat({onProduct,compareMode,compareSelected,onCompareToggle,onBack}:{
  onProduct:(pid:string)=>void;
  compareMode?:boolean;compareSelected?:string[];onCompareToggle?:(pid:string)=>void;
  onBack?:()=>void;
}){
  const [msgs,setMsgs]=useState<{id:string;role:"user"|"ai";text:string;img?:string}[]>([
    {id:"init",role:"ai",text:"سلام! من دستیار هوشمند خرید آن مارکت هستم. بگو چه محصولی می‌خوای — بودجه‌ات، کاربردت، برند مورد علاقه‌ات — من از صدها فروشگاه بهترین گزینه‌ها رو برات پیدا می‌کنم."}
  ]);
  const [input,setInput]=useState("");
  const [thinking,setThinking]=useState(false);
  const [showResults,setShowResults]=useState(false);
  const [results,setResults]=useState<AnProduct[]>([]);
  const [lastQ,setLastQ]=useState("");
  const [copied,setCopied]=useState<string|null>(null);
  const scrollRef=useRef<HTMLDivElement>(null);
  const fileRef=useRef<HTMLInputElement>(null);

  const scrollToBottom=()=>setTimeout(()=>{if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight;},80);

  const copyMsg=(id:string,text:string)=>{
    navigator.clipboard.writeText(text).catch(()=>{});
    setCopied(id);setTimeout(()=>setCopied(null),1500);
  };

  const AI_REPLIES=[
    (q:string,n:number)=>`${toFaDigits(String(n))} محصول پیدا کردم که به درخواست شما نزدیک هستن. برای مقایسه یا دیدن جزئیات، دکمه «نمایش نتایج» رو بزن.`,
    (q:string,n:number)=>`برای «${q}» تعداد ${toFaDigits(String(n))} گزینه پیدا کردم. می‌تونم بر اساس بودجه یا ویژگی خاصی فیلتر کنم؟`,
    (_q:string,n:number)=>`نتایج آماده‌ست! ${toFaDigits(String(n))} محصول از فروشگاه‌های معتبر پیدا شد. اطلاعات بر اساس داده‌های موجود در آن مارکت است و ممکن است کامل یا به‌روز نباشد.`,
  ];

  const sendMsg=()=>{
    const txt=input.trim();if(!txt||thinking)return;
    const uid=Date.now().toString();
    setMsgs(p=>[...p,{id:uid,role:"user",text:txt}]);
    setInput("");setThinking(true);setLastQ(txt);
    scrollToBottom();
    setTimeout(()=>{
      const found=anSearch(txt).slice(0,30);
      setResults(found);
      const replyFn=AI_REPLIES[Math.floor(Math.random()*AI_REPLIES.length)];
      const reply=found.length>0?replyFn(txt,found.length):`برای این درخواست نتیجه دقیقی پیدا نشد. می‌تونی جزئیات بیشتری بدی یا کلمات دیگری امتحان کنی؟`;
      setMsgs(p=>[...p,{id:(Date.now()+1).toString(),role:"ai",text:reply}]);
      setThinking(false);setShowResults(false);
      scrollToBottom();
    },1400);
  };

  const newChat=()=>{
    setMsgs([{id:"init2",role:"ai",text:"گفتگوی جدید شروع شد. چه محصولی می‌خوای؟"}]);
    setInput("");setThinking(false);setShowResults(false);setResults([]);setLastQ("");
  };

  const handleImg=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0];if(!f)return;
    const uid=Date.now().toString();
    const url=URL.createObjectURL(f);
    setMsgs(p=>[...p,{id:uid,role:"user",text:"[تصویر پیوست شد]",img:url}]);
    setThinking(true);scrollToBottom();
    setTimeout(()=>{
      setMsgs(p=>[...p,{id:(Date.now()+1).toString(),role:"ai",text:"تصویر رو دریافت کردم. می‌تونم محصولات مشابه رو برات پیدا کنم. محصول مورد نظرت رو کمی توضیح بده تا دقیق‌تر جستجو کنم."}]);
      setThinking(false);scrollToBottom();
    },1200);
    e.target.value="";
  };

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",paddingBottom:0}}>
      {/* Top bar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px 10px",background:"var(--am-card)",borderBottom:"1px solid var(--am-border)",flexShrink:0,gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
          <div style={{width:36,height:36,borderRadius:11,background:"var(--am-accent)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/></svg>
          </div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:15,fontWeight:900,color:"var(--am-text)"}}>دستیار هوشمند</div>
            <div style={{fontSize:11,color:"#22C55E",fontWeight:600}}>● آنلاین</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <button onClick={newChat} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 14px",background:"var(--am-bg)",border:"1.5px solid var(--am-border)",borderRadius:11,cursor:"pointer",fontFamily:"Vazirmatn",color:"var(--am-muted)",fontSize:12,fontWeight:700}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            گفتگوی جدید
          </button>
          {onBack&&<button onClick={onBack} style={{display:"flex",alignItems:"center",gap:5,background:"rgba(10,158,140,0.07)",border:"1px solid rgba(10,158,140,0.2)",borderRadius:20,padding:"6px 12px 6px 10px",cursor:"pointer",fontFamily:"Vazirmatn",fontSize:11,fontWeight:700,color:"var(--am-accent)",flexShrink:0,whiteSpace:"nowrap"}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            بازگشت به آن‌پرداز
          </button>}
        </div>
      </div>

      {/* Scrollable chat history */}
      <div ref={scrollRef} style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:14,minHeight:0}}>
        {msgs.map(m=>(
          <div key={m.id} style={{display:"flex",flexDirection:m.role==="ai"?"row":"row-reverse",gap:10,alignItems:"flex-start"}}>
            {m.role==="ai"&&(
              <div style={{width:32,height:32,borderRadius:10,background:"var(--am-accent)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/></svg>
              </div>
            )}
            <div style={{maxWidth:"78%",position:"relative"}}>
              {m.img&&<img src={m.img} alt="پیوست" style={{width:"100%",maxWidth:200,borderRadius:12,display:"block",marginBottom:6,objectFit:"cover"}}/>}
              <div style={{
                background:m.role==="ai"?"var(--am-card2)":"var(--am-accent)",
                border:m.role==="ai"?"1.5px solid var(--am-border)":"none",
                borderRadius:m.role==="ai"?"4px 16px 16px 16px":"16px 4px 16px 16px",
                padding:"12px 14px",
                fontSize:14,color:m.role==="ai"?"var(--am-text)":"#FFFFFF",
                lineHeight:1.75,fontWeight:500,
                boxShadow:m.role==="ai"?"var(--am-shadow)":"none",
                direction:"rtl",
              }}>
                {m.text}
              </div>
              <button
                onClick={()=>copyMsg(m.id,m.text)}
                title="کپی"
                style={{
                  position:"absolute",bottom:-8,right:m.role==="ai"?8:undefined,left:m.role==="user"?8:undefined,
                  width:24,height:24,borderRadius:8,
                  background:copied===m.id?"#22C55E":"var(--am-card)",
                  border:"1px solid var(--am-border)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,0.08)",
                  transition:"background .2s",
                }}
              >
                {copied===m.id
                  ?<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  :<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                }
              </button>
            </div>
          </div>
        ))}
        {thinking&&(
          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
            <div style={{width:32,height:32,borderRadius:10,background:"var(--am-accent)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/></svg>
            </div>
            <div style={{background:"var(--am-card)",border:"1.5px solid var(--am-border)",borderRadius:"4px 16px 16px 16px",padding:"14px 16px",boxShadow:"var(--am-shadow)"}}>
              <div style={{display:"flex",gap:5}}>
                {[0,1,2].map(i=><div key={i} className="am-typing-dot" style={{animation:`pulse 1.2s ${i*0.2}s ease-in-out infinite`}}/>)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div style={{flexShrink:0,background:"var(--am-card)",borderTop:"1.5px solid var(--am-border)",padding:"12px 14px"}}>
        <div style={{background:"var(--am-bg)",borderRadius:16,border:"1.5px solid var(--am-border)",overflow:"hidden"}}>
          <textarea
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}}}
            rows={2}
            placeholder="پیام خود را بنویسید..."
            disabled={thinking}
            style={{width:"100%",border:"none",outline:"none",padding:"14px 14px 8px",fontSize:14,fontFamily:"Vazirmatn",color:"var(--am-text)",resize:"none",direction:"rtl",lineHeight:1.7,background:"transparent",boxSizing:"border-box",display:"block"}}
          />
          <div style={{display:"flex",alignItems:"center",padding:"6px 10px 10px",gap:8}}>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleImg}/>
            <button onClick={()=>fileRef.current?.click()} title="پیوست تصویر" style={{width:36,height:36,borderRadius:10,background:"none",border:"1.5px solid var(--am-border)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--am-muted)",flexShrink:0}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </button>
            <div style={{flex:1}}/>
            <button
              onClick={sendMsg}
              disabled={!input.trim()||thinking}
              style={{width:38,height:38,borderRadius:11,background:input.trim()&&!thinking?"var(--am-accent)":"var(--am-bg)",border:`1.5px solid ${input.trim()&&!thinking?"var(--am-accent)":"var(--am-border)"}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:input.trim()&&!thinking?"pointer":"default",flexShrink:0,transition:"all .15s"}}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim()&&!thinking?"#FFFFFF":"var(--am-muted)"} strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>

        {/* Show results button */}
        {results.length>0&&!thinking&&(
          <button
            onClick={()=>setShowResults(v=>!v)}
            style={{marginTop:10,width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"13px",background:showResults?"var(--am-accent)":"var(--am-accent-light)",border:`2px solid var(--am-accent)`,borderRadius:14,cursor:"pointer",fontFamily:"Vazirmatn",color:showResults?"#FFFFFF":"var(--am-accent)",fontSize:14,fontWeight:900,transition:"all .15s"}}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            {showResults?"پنهان کردن نتایج":`نمایش نتایج دستیار هوشمند (${toFaDigits(String(results.length))} محصول)`}
          </button>
        )}
      </div>

      {/* Results panel */}
      {showResults&&results.length>0&&(
        <div style={{flexShrink:0,borderTop:"1.5px solid var(--am-border)",maxHeight:"50vh",overflowY:"auto",background:"var(--am-bg)"}}>
          <div style={{padding:"16px 16px 8px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"var(--am-accent)"}}/>
            <span style={{fontSize:15,fontWeight:900,color:"var(--am-text)"}}>مواردی که دستیار برات پیدا کرد</span>
            <span style={{marginRight:"auto",fontSize:12,color:"var(--am-muted)"}}>{toFaDigits(String(results.length))} محصول</span>
          </div>
          <div style={{padding:"0 16px 8px"}}>
            <button onClick={()=>onCompareToggle?.("__mode__")} className={`am-compare-btn${compareMode?" active":""}`} style={{marginBottom:10}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg>
              {compareMode?`مقایسه فعال — ${compareSelected?.length||0} انتخابی`:"مقایسه محصولات"}
              {compareMode&&<span className="am-pulse-dot"/>}
            </button>
            {results.map(p=>(
              <AnSearchResultCard key={p.id} p={p} onPress={onProduct} aiComment={getAiComment(lastQ,p)} compareMode={compareMode} compareSelected={compareSelected?.includes(p.id)} onCompareToggle={onCompareToggle}/>
            ))}
            <div style={{padding:"12px 0",textAlign:"center",fontSize:11,color:"var(--am-muted)",lineHeight:1.7}}>اطلاعات بر اساس داده‌های موجود در آن مارکت و منابع قابل‌دسترسی است و ممکن است کامل یا به‌روز نباشد.</div>
          </div>
        </div>
      )}
    </div>
  );
}
function AnChatPage({q,onProduct,compareMode,compareSelected,onCompareToggle}:{
  q:string;onProduct:(pid:string)=>void;
  compareMode?:boolean;compareSelected?:string[];onCompareToggle?:(pid:string)=>void;
}){
  const [thinking,setThinking]=useState(true);
  const [sort,setSort]=useState<"relevance"|"price-asc"|"price-desc"|"rating">("relevance");
  const [showFilters,setShowFilters]=useState(false);
  const [selectedBrands,setSelectedBrands]=useState<string[]>([]);
  const [visibleCount,setVisibleCount]=useState(10);
  const sentinelRef=useRef<HTMLDivElement>(null);

  const rawResults=useMemo(()=>anSearch(q),[q]);
  const brands=useMemo(()=>[...new Set(rawResults.map(p=>p.brand))].slice(0,12),[rawResults]);

  const results=useMemo(()=>{
    let r=rawResults.length>0?rawResults:ALL_MOCK_PRODS.slice(0,30);
    if(selectedBrands.length>0) r=r.filter(p=>selectedBrands.includes(p.brand));
    if(sort==="price-asc")r=[...r].sort((a,b)=>a.priceMin-b.priceMin);
    else if(sort==="price-desc")r=[...r].sort((a,b)=>b.priceMin-a.priceMin);
    else if(sort==="rating")r=[...r].sort((a,b)=>b.rating-a.rating);
    return r;
  },[rawResults,sort,selectedBrands]);

  useEffect(()=>{const t=setTimeout(()=>setThinking(false),1200);return()=>clearTimeout(t);},[q]);
  useEffect(()=>setVisibleCount(10),[results]);

  useEffect(()=>{
    const el=sentinelRef.current;if(!el)return;
    const obs=new IntersectionObserver(entries=>{if(entries[0].isIntersecting)setVisibleCount(v=>Math.min(v+10,results.length));});
    obs.observe(el);return()=>obs.disconnect();
  },[results]);

  const sortLabels:{[k:string]:string}={"relevance":"مرتبط‌ترین","price-asc":"ارزان‌ترین","price-desc":"گران‌ترین","rating":"بهترین امتیاز"};
  const hasResults=rawResults.length>0;

  const isImgSearch=q.startsWith("__img__");
  const imgFileName=isImgSearch?q.slice(7):"";
  const displayQ=isImgSearch?"جستجوی تصویری":q;

  return(
    <div>
      <div style={{padding:"12px 16px",borderBottom:"1px solid var(--am-border)",background:"var(--am-card)"}}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {isImgSearch?(
            <div style={{flex:1,display:"flex",alignItems:"center",gap:10,background:"var(--am-bg)",borderRadius:12,padding:"9px 14px"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--am-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              <div>
                <div style={{fontSize:13,fontWeight:800,color:"var(--am-text)"}}>{displayQ}</div>
                <div style={{fontSize:11,color:"var(--am-muted)"}}>{imgFileName}</div>
              </div>
            </div>
          ):(
            <div style={{flex:1,background:"var(--am-bg)",borderRadius:12,padding:"11px 14px",fontSize:14,color:"var(--am-text)",fontFamily:"Vazirmatn",direction:"rtl",lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical",overflow:"hidden",fontWeight:600}}>{displayQ}</div>
          )}
          <button onClick={()=>onProduct("__back__")} style={{flexShrink:0,padding:"9px 16px",background:"var(--am-accent-light)",border:"1.5px solid var(--am-accent-border)",borderRadius:11,color:"var(--am-accent)",fontSize:13,fontFamily:"Vazirmatn",cursor:"pointer",fontWeight:800}}>ویرایش</button>
        </div>
      </div>

      <div style={{padding:"10px 16px",borderBottom:"1px solid var(--am-border)",background:"var(--am-card)"}}>
        <div style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:2,scrollbarWidth:"none"} as React.CSSProperties}>
          <button onClick={()=>setShowFilters(v=>!v)} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 15px",background:showFilters?"var(--am-accent-light)":"var(--am-bg)",border:`1.5px solid ${showFilters?"var(--am-accent-border)":"var(--am-border)"}`,borderRadius:20,cursor:"pointer",fontFamily:"Vazirmatn",color:showFilters?"var(--am-accent)":"var(--am-muted)",fontSize:13,fontWeight:700,flexShrink:0,whiteSpace:"nowrap"}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            فیلتر{selectedBrands.length>0?` (${toFaDigits(String(selectedBrands.length))})` :""}
          </button>
          {(["relevance","price-asc","price-desc","rating"] as const).map(s=>(
            <button key={s} onClick={()=>setSort(s)} style={{padding:"9px 15px",background:sort===s?"var(--am-accent-light)":"var(--am-bg)",border:`1.5px solid ${sort===s?"var(--am-accent-border)":"var(--am-border)"}`,borderRadius:20,cursor:"pointer",fontFamily:"Vazirmatn",color:sort===s?"var(--am-accent)":"var(--am-muted)",fontSize:13,fontWeight:sort===s?800:600,flexShrink:0,whiteSpace:"nowrap"}}>{sortLabels[s]}</button>
          ))}
        </div>
        {showFilters&&brands.length>0&&(
          <div style={{marginTop:10,padding:"13px 14px",background:"var(--am-bg)",borderRadius:14}}>
            <div style={{fontSize:13,fontWeight:700,color:"var(--am-text)",marginBottom:9}}>برند</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {brands.map(b=>(
                <button key={b} onClick={()=>setSelectedBrands(prev=>prev.includes(b)?prev.filter(x=>x!==b):[...prev,b])} style={{padding:"6px 13px",borderRadius:20,background:selectedBrands.includes(b)?"var(--am-accent-light)":"var(--am-card2)",border:`1.5px solid ${selectedBrands.includes(b)?"var(--am-accent-border)":"var(--am-border)"}`,color:selectedBrands.includes(b)?"var(--am-accent)":"var(--am-muted)",fontSize:12,fontFamily:"Vazirmatn",cursor:"pointer",fontWeight:selectedBrands.includes(b)?700:500}}>{b}</button>
              ))}
            </div>
            {selectedBrands.length>0&&<button onClick={()=>setSelectedBrands([])} style={{marginTop:9,fontSize:12,color:"var(--am-muted)",background:"none",border:"none",cursor:"pointer",fontFamily:"Vazirmatn"}}>پاک کردن فیلترها</button>}
          </div>
        )}
      </div>

      <div style={{padding:"16px 16px 100px"}}>
        <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:18}}>
          <div style={{width:36,height:36,borderRadius:11,background:"var(--am-accent-light)",border:"1.5px solid var(--am-accent-border)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--am-accent)" strokeWidth="2" strokeLinecap="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/></svg>
          </div>
          <div style={{flex:1,background:"var(--am-card)",border:"1px solid var(--am-border)",borderRadius:"4px 18px 18px 18px",padding:"14px 16px",boxShadow:"var(--am-shadow)"}}>
            {thinking?(
              <div style={{display:"flex",gap:5,alignItems:"center"}}>
                {[0,1,2].map(i=><div key={i} className="am-typing-dot" style={{animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
                <span style={{fontSize:13,color:"var(--am-muted)",marginRight:8}}>دارم دنبال بهترین گزینه‌ها می‌گردم...</span>
              </div>
            ):(
              <div>
                <div style={{fontSize:14,color:"var(--am-text)",fontWeight:700,marginBottom:5}}>
                  {hasResults?`${toFaDigits(String(rawResults.length))} محصول پیدا کردم.`:"نتیجه دقیقی پیدا نشد، اما این‌ها رو پیشنهاد می‌دم:"}
                </div>
                <div style={{fontSize:12,color:"var(--am-muted)",lineHeight:1.8}}>
                  {hasResults?"این‌ها گزینه‌هایی هستند که به چیزی که می‌خواهی نزدیک‌ترند.":"عبارت دیگری امتحان کن یا از دسته‌بندی‌ها جستجو کن."}
                </div>
              </div>
            )}
          </div>
        </div>

        <button onClick={()=>onCompareToggle?.("__mode__")} className={`am-compare-btn${compareMode?" active":""}`} style={{marginBottom:16}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg>
          {compareMode?`مقایسه فعال — ${compareSelected?.length||0} محصول`:"برام مقایسه کن"}
          {compareMode&&<span className="am-pulse-dot"/>}
        </button>

        {!thinking&&(
          <div>
            <AnSH title={hasResults?"همه نتایج":"پیشنهادهای آن مارکت"}/>
            {results.slice(0,visibleCount).map(p=>(
              <AnSearchResultCard key={p.id} p={p} onPress={onProduct} aiComment={getAiComment(q,p)} compareMode={compareMode} compareSelected={compareSelected?.includes(p.id)} onCompareToggle={onCompareToggle}/>
            ))}
            {visibleCount<results.length&&(
              <div ref={sentinelRef} style={{padding:"20px",textAlign:"center"}}>
                <div style={{display:"flex",justifyContent:"center",gap:7}}>
                  {[0,1,2].map(i=><div key={i} className="am-typing-dot" style={{animation:`pulse 1.2s ${i*0.15}s infinite`}}/>)}
                </div>
                <div style={{fontSize:12,color:"var(--am-muted)",marginTop:8}}>در حال بارگذاری موارد بیشتر...</div>
              </div>
            )}
            {visibleCount>=results.length&&results.length>0&&(
              <div style={{textAlign:"center",padding:"20px",fontSize:12,color:"var(--am-muted)"}}>همه {toFaDigits(String(results.length))} محصول نمایش داده شد</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
function AnPriceSparkline({ph}:{ph:{d:string;p:number}[]}){
  if(ph.length<2)return null;
  const prices=ph.map(x=>x.p);
  const min=Math.min(...prices);
  const max=Math.max(...prices);
  const range=max-min||1;
  const W=260,H=52;
  const pts=prices.map((p,i)=>{
    const x=i/(prices.length-1)*W;
    const y=H-((p-min)/range)*(H-8)-4;
    return`${x},${y}`;
  }).join(" ");
  const firstCoords=pts.split(" ")[0].split(",");
  const lastCoords=pts.split(" ").slice(-1)[0].split(",");
  const lastX=Number(lastCoords[0]);
  const lastY=Number(lastCoords[1]);
  const isDown=prices[prices.length-1]<prices[0];
  const color=isDown?"#10B981":"#F59E0B";
  return(
    <div style={{overflowX:"auto",paddingBottom:4}}>
      <svg width={W} height={H+16} style={{display:"block"}}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={Number(firstCoords[0])} cy={Number(firstCoords[1])} r="3" fill={color} opacity="0.4"/>
        <circle cx={lastX} cy={lastY} r="4" fill={color}/>
        {ph.map((x,i)=>{
          const px=i/(prices.length-1)*W;
          return<text key={i} x={px} y={H+14} textAnchor="middle" fontSize="9" fill="#9DB4C0" fontFamily="Vazirmatn">{x.d}</text>;
        })}
      </svg>
    </div>
  );
}
function AnProductDetail({pid,onProduct,onSearch,onBack}:{pid:string;onProduct:(pid:string)=>void;onSearch:(q:string)=>void;onBack:()=>void}){
  const p=ALL_MOCK_PRODS.find(x=>x.id===pid);
  const [tab,setTab]=useState<"sellers"|"specs"|"reviews"|"similar">("sellers");
  const [alert,setAlert]=useState(false);
  const [fav,setFav]=useState(false);
  const [sellerSort,setSellerSort]=useState<"price"|"rating"|"avail">("price");
  const [imgIdx,setImgIdx]=useState(0);
  const [showZoom,setShowZoom]=useState(false);
  const [aiInput,setAiInput]=useState("");
  const offers=AN_OFFERS[pid]||(p?mkAnOffers(p.priceMin,p.storeCount):[]);
  useBackHandler(onBack);
  if(!p)return<div style={{padding:24,textAlign:"center",color:"var(--am-muted)"}}>محصول یافت نشد<br/><button onClick={onBack} style={{marginTop:16,padding:"10px 24px",background:"var(--am-accent)",border:"none",borderRadius:12,cursor:"pointer",fontFamily:"Vazirmatn",fontWeight:700,color:"#FFFFFF"}}>بازگشت</button></div>;

  const sortedOffers=sortOffers(offers,sellerSort);
  const avg=Math.round(sortedOffers.reduce((a,o)=>a+o.price,0)/(sortedOffers.length||1));
  const similar=ALL_MOCK_PRODS.filter(x=>x.catId===p.catId&&x.id!==p.id).slice(0,8);
  const cheaper=ALL_MOCK_PRODS.filter(x=>x.catId===p.catId&&x.priceMin<p.priceMin&&x.id!==p.id).sort((a,b)=>a.priceMin-b.priceMin).slice(0,4);
  const pricier=ALL_MOCK_PRODS.filter(x=>x.catId===p.catId&&x.priceMin>p.priceMin&&x.id!==p.id&&x.rating>=p.rating).sort((a,b)=>a.priceMin-b.priceMin).slice(0,3);
  const strengths=getProductStrengths(p);
  const weaknesses=getProductWeaknesses(p);
  const drop=p.ph.length>1&&p.ph[p.ph.length-1].p<p.ph[0].p?Math.round((p.ph[0].p-p.ph[p.ph.length-1].p)/p.ph[0].p*100):0;
  const TABS=([["sellers","فروشگاه‌ها"],["specs","مشخصات"],["reviews","نظرات"],["similar","گزینه‌ها"]] as const);
  // Simulate 4 gallery images using same URL with different crops
  const galleryImgs=[p.img,`${p.img.split("?")[0]}?w=600&h=600&fit=crop&q=80&crop=center`,`${p.img.split("?")[0]}?w=600&h=600&fit=crop&q=80&crop=top`,`${p.img.split("?")[0]}?w=600&h=600&fit=crop&q=80&crop=bottom`];

  return(
    <div style={{paddingBottom:100}}>
      {/* ─── Image gallery ─── */}
      <div style={{background:"var(--am-bg)",position:"relative"}}>
        <div style={{width:"100%",aspectRatio:"1",background:"var(--am-bg)",overflow:"hidden",position:"relative",cursor:"pointer"}} onClick={()=>setShowZoom(true)}>
          <img src={galleryImgs[imgIdx]} alt={p.title} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} loading="eager"/>
          {drop>0&&<div style={{position:"absolute",top:14,right:14,background:"#DC2626",color:"#fff",fontSize:12,fontWeight:800,borderRadius:10,padding:"6px 14px"}}>↓{toFaDigits(String(drop))}٪ کاهش قیمت</div>}
          <div style={{position:"absolute",bottom:14,left:14,background:"rgba(0,0,0,0.5)",color:"#fff",fontSize:11,fontWeight:700,borderRadius:8,padding:"5px 11px",backdropFilter:"blur(4px)"}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{display:"inline",verticalAlign:"middle",marginLeft:4}}><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            بزرگ‌نمایی
          </div>
          <div style={{position:"absolute",top:14,left:14,display:"flex",gap:5}}>
            <button onClick={e=>{e.stopPropagation();setFav(v=>!v);}} style={{width:36,height:36,borderRadius:10,background:"var(--am-card)",border:"1px solid var(--am-border)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:fav?"#DB2777":"var(--am-muted)"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={fav?"#DB2777":"none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          </div>
        </div>
        {/* Thumbnails */}
        <div style={{display:"flex",gap:8,padding:"10px 16px",background:"var(--am-card)",borderBottom:"1px solid var(--am-border)"}}>
          {galleryImgs.map((img,i)=>(
            <button key={i} onClick={()=>setImgIdx(i)} style={{width:60,height:60,borderRadius:10,overflow:"hidden",border:`2px solid ${imgIdx===i?"var(--am-accent)":"var(--am-border)"}`,padding:0,cursor:"pointer",flexShrink:0,background:"var(--am-bg)"}}>
              <img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {showZoom&&(
        <div onClick={()=>setShowZoom(false)} style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.94)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <button onClick={()=>setShowZoom(false)} style={{position:"absolute",top:16,right:16,width:40,height:40,borderRadius:12,background:"rgba(255,255,255,0.12)",border:"none",color:"#fff",fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          <img src={galleryImgs[imgIdx]} alt={p.title} style={{maxWidth:"95vw",maxHeight:"90vh",objectFit:"contain",borderRadius:12}}/>
          <div style={{position:"absolute",bottom:24,left:"50%",transform:"translateX(-50%)",display:"flex",gap:8}}>
            {galleryImgs.map((_,i)=>(
              <button key={i} onClick={e=>{e.stopPropagation();setImgIdx(i);}} style={{width:i===imgIdx?24:8,height:8,borderRadius:4,background:i===imgIdx?"#FFFFFF":"rgba(255,255,255,0.35)",border:"none",cursor:"pointer",transition:"all .2s",padding:0}}/>
            ))}
          </div>
        </div>
      )}

      {/* ─── Product info ─── */}
      <div style={{background:"var(--am-card)",borderBottom:"1px solid var(--am-border)",padding:"20px 18px 18px"}}>
        <div style={{fontSize:13,color:"var(--am-accent)",fontWeight:700,marginBottom:4}}>{p.brand}</div>
        <h1 style={{fontSize:19,fontWeight:900,color:"var(--am-text)",lineHeight:1.5,margin:"0 0 10px"}}>{p.title}</h1>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <AnStars r={p.rating}/>
          <span style={{fontSize:12,color:"var(--am-muted)"}}>{toFaDigits(String(p.rating))} از ۵ · {toFaDigits(String(p.reviews))} نظر کاربران</span>
        </div>
        <div className="am-stat-grid">
          {([["پایین‌ترین قیمت",fa(p.priceMin)+" ت","var(--am-accent)"],["میانگین قیمت",fa(avg)+" ت","var(--am-text)"],["تعداد فروشگاه",toFaDigits(String(sortedOffers.length))+" فروشگاه","var(--am-text)"]] as [string,string,string][]).map(([l,v,clr])=>(
            <div key={l} className="am-stat-tile">
              <div className="label">{l}</div>
              <div className="value" style={{color:clr,fontSize:13}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button onClick={()=>setAlert(v=>!v)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"13px",background:alert?"var(--am-accent)":"var(--am-bg)",border:`1.5px solid ${alert?"var(--am-accent)":"var(--am-border)"}`,borderRadius:13,cursor:"pointer",fontFamily:"Vazirmatn",color:alert?"#FFFFFF":"var(--am-muted)",fontSize:13,fontWeight:700,transition:"all .15s"}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {alert?"هشدار فعال است":"هشدار کاهش قیمت"}
          </button>
          <button onClick={()=>setFav(v=>!v)} style={{width:52,display:"flex",alignItems:"center",justifyContent:"center",background:fav?"rgba(219,39,119,0.07)":"var(--am-bg)",border:`1.5px solid ${fav?"rgba(219,39,119,0.3)":"var(--am-border)"}`,borderRadius:13,cursor:"pointer",color:fav?"#DB2777":"var(--am-muted)",transition:"all .15s"}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={fav?"#DB2777":"none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
      </div>

      {/* ─── AI Analysis ─── */}
      <div style={{padding:"18px 16px",borderBottom:"1px solid var(--am-border)",background:"var(--am-card)"}}>
        <AnSH title="تحلیل دستیار هوشمند"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div className="am-str-card pos">
            <div className="am-str-head">نقاط قوت</div>
            {strengths.map((s,i)=>(
              <div key={i} className="am-str-item">
                <span className="am-str-icon" style={{color:"#059669"}}>✓</span>
                <span style={{fontSize:12,color:"var(--am-muted)",lineHeight:1.65}}>{s}</span>
              </div>
            ))}
          </div>
          <div className="am-str-card neg">
            <div className="am-str-head">نکات مهم</div>
            {weaknesses.map((s,i)=>(
              <div key={i} className="am-str-item">
                <span className="am-str-icon" style={{color:"#D97706"}}>!</span>
                <span style={{fontSize:12,color:"var(--am-muted)",lineHeight:1.65}}>{s}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{fontSize:10,color:"var(--am-faint)",lineHeight:1.8}}>این اطلاعات بر اساس داده‌های موجود است و ممکن است کامل یا به‌روز نباشد. ما فقط از لحاظ فنی اطلاعات را بررسی می‌کنیم.</div>
      </div>

      {/* ─── Price History ─── */}
      {p.ph.length>1&&(
        <div style={{padding:"18px 16px",borderBottom:"1px solid var(--am-border)",background:"var(--am-card)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <AnSH title="سابقه قیمت"/>
            {drop>0&&<span style={{fontSize:11,background:"rgba(16,185,129,0.1)",color:"#059669",borderRadius:8,padding:"4px 10px",fontWeight:700}}>↓{toFaDigits(String(drop))}٪ کاهش</span>}
          </div>
          <AnPriceSparkline ph={p.ph}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
            <span style={{fontSize:11,color:"var(--am-muted)"}}>کمترین: {fa(Math.min(...p.ph.map(x=>x.p)))} ت</span>
            <span style={{fontSize:11,color:"var(--am-muted)"}}>بیشترین: {fa(Math.max(...p.ph.map(x=>x.p)))} ت</span>
          </div>
          <button onClick={()=>setAlert(v=>!v)} style={{width:"100%",marginTop:12,padding:"11px",background:alert?"var(--am-accent)":"rgba(10,158,140,0.06)",border:`1.5px solid ${alert?"var(--am-accent)":"rgba(10,158,140,0.25)"}`,borderRadius:12,color:alert?"#FFFFFF":"var(--am-accent)",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Vazirmatn",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {alert?"هشدار قیمت فعال است":"هشدار کاهش قیمت بگذار"}
          </button>
        </div>
      )}

      {/* ─── Ask assistant ─── */}
      <div style={{padding:"14px 16px",borderBottom:"1px solid var(--am-border)",background:"rgba(10,158,140,0.03)"}}>
        <div style={{fontSize:12,fontWeight:800,color:"var(--am-accent)",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/></svg>
          از دستیار بپرس
        </div>
        <div style={{display:"flex",gap:8}}>
          <input value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&aiInput.trim()){onSearch(aiInput.trim());setAiInput("");}}} placeholder="مثلاً: مدلی با باتری بهتر پیشنهاد بده..." style={{flex:1,background:"var(--am-card)",border:"1.5px solid var(--am-border)",borderRadius:12,padding:"11px 14px",color:"var(--am-text)",fontSize:13,fontFamily:"Vazirmatn",outline:"none",direction:"rtl"}}/>
          <button onClick={()=>{if(aiInput.trim()){onSearch(aiInput.trim());setAiInput("");}}} style={{padding:"0 16px",background:"var(--am-accent)",border:"none",borderRadius:12,color:"#FFFFFF",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"Vazirmatn",flexShrink:0}}>ارسال</button>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="am-detail-tab-bar">
        {TABS.map(([k,lbl])=>(
          <button key={k} onClick={()=>setTab(k)} className={`am-detail-tab${tab===k?" active":""}`}>{lbl}</button>
        ))}
      </div>

      <div style={{padding:"16px 16px"}}>
        {/* ─── Sellers tab ─── */}
        {tab==="sellers"&&(
          <>
            <div style={{display:"flex",gap:7,marginBottom:16,flexWrap:"wrap"}}>
              {([["price","ارزان‌ترین"],["rating","معتبرترین"],["avail","فقط موجود"]] as const).map(([s,l])=>(
                <button key={s} onClick={()=>setSellerSort(s)} style={{padding:"9px 16px",borderRadius:20,background:sellerSort===s?"var(--am-accent-light)":"var(--am-bg)",border:`1.5px solid ${sellerSort===s?"var(--am-accent-border)":"var(--am-border)"}`,color:sellerSort===s?"var(--am-accent)":"var(--am-muted)",fontSize:13,fontFamily:"Vazirmatn",cursor:"pointer",fontWeight:sellerSort===s?700:500}}>{l}</button>
              ))}
            </div>
            <AnSH title={`${toFaDigits(String(sortedOffers.length))} فروشگاه — مقایسه قیمت‌ها`}/>
            {sortedOffers.map((o,i)=>{
              const store=ANS[o.sid]||{n:o.sid,sc:4.0};
              const best=i===0&&sellerSort==="price";
              const priceDiff=o.price-p.priceMin;
              return(
                <div key={o.sid} className={`am-seller-card${best?" best":""}`}>
                  {best&&<div className="am-best-badge">کمترین قیمت</div>}
                  <div style={{marginTop:best?10:0}}>
                    {/* Store header */}
                    <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
                      <div style={{width:48,height:48,borderRadius:12,background:best?"rgba(10,158,140,0.1)":"var(--am-bg)",border:`1px solid ${best?"rgba(10,158,140,0.2)":"var(--am-border)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:18}}>
                        🏪
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:15,fontWeight:800,color:"var(--am-text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{store.n}</div>
                        <div style={{display:"flex",alignItems:"center",gap:5,marginTop:3}}>
                          <span style={{fontSize:12,color:"#F59E0B",fontWeight:700}}>★ {toFaDigits(String(store.sc))}</span>
                          <span style={{fontSize:11,color:"var(--am-muted)"}}>· بر اساس داده‌های موجود</span>
                        </div>
                      </div>
                      <div style={{textAlign:"left",flexShrink:0}}>
                        <div style={{fontSize:17,fontWeight:900,color:best?"var(--am-accent)":"var(--am-text)"}}>{fa(o.price)}</div>
                        <div style={{fontSize:10,color:"var(--am-muted)",textAlign:"left"}}>تومان</div>
                        {priceDiff>0&&<div style={{fontSize:10,color:"#F59E0B",fontWeight:600}}>+{fa(priceDiff)}</div>}
                      </div>
                    </div>
                    {/* Tags */}
                    <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                      {o.inStock
                        ?<span style={{fontSize:11,background:"rgba(16,185,129,0.1)",color:"#059669",borderRadius:7,padding:"4px 10px",fontWeight:700}}>✓ موجود</span>
                        :<span style={{fontSize:11,background:"rgba(245,158,11,0.1)",color:"#D97706",borderRadius:7,padding:"4px 10px",fontWeight:700}}>ناموجود</span>}
                      {o.warranty&&<span style={{fontSize:11,background:"var(--am-bg)",color:"var(--am-muted)",borderRadius:7,padding:"4px 10px",border:"1px solid var(--am-border)"}}>{o.warranty}</span>}
                      {o.ship&&<span style={{fontSize:11,background:"var(--am-bg)",color:"var(--am-muted)",borderRadius:7,padding:"4px 10px",border:"1px solid var(--am-border)"}}>{o.ship}</span>}
                    </div>
                    {o.inStock&&(
                      <button style={{width:"100%",padding:"13px",background:"var(--am-accent)",border:"none",borderRadius:12,color:"#FFFFFF",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"Vazirmatn",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        مشاهده و خرید
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ─── Specs tab ─── */}
        {tab==="specs"&&(
          <div>
            <AnSH title="مشخصات فنی کامل"/>
            {Object.entries(p.specs).map(([k,v],i)=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 0",borderBottom:"1px solid var(--am-border)",background:i%2===0?"transparent":"rgba(10,158,140,0.02)"}}>
                <span style={{fontSize:13,color:"var(--am-muted)",fontWeight:500}}>{k}</span>
                <span style={{fontSize:13,fontWeight:700,color:"var(--am-text)",textAlign:"left",maxWidth:"60%",wordBreak:"break-word"}}>{v}</span>
              </div>
            ))}
            <div style={{marginTop:16,padding:"13px 14px",background:"var(--am-bg)",borderRadius:14,border:"1px solid var(--am-border)"}}>
              <div style={{fontSize:11,color:"var(--am-muted)",lineHeight:1.85}}>مشخصات فنی بر اساس اطلاعات موجود و ممکن است کامل یا به‌روز نباشد. برای اطلاعات دقیق‌تر به سایت رسمی برند مراجعه کنید.</div>
            </div>
          </div>
        )}

        {/* ─── Reviews tab ─── */}
        {tab==="reviews"&&(
          <>
            <div style={{marginBottom:20}}>
              <div style={{display:"flex",gap:16,alignItems:"center",background:"rgba(10,158,140,0.04)",borderRadius:16,padding:"16px",marginBottom:18,border:"1px solid var(--am-border)"}}>
                <div style={{textAlign:"center",flexShrink:0}}>
                  <div style={{fontSize:42,fontWeight:900,color:"var(--am-accent)",lineHeight:1}}>{toFaDigits(String(p.rating))}</div>
                  <AnStars r={p.rating}/>
                  <div style={{fontSize:11,color:"var(--am-muted)",marginTop:4}}>{toFaDigits(String(p.reviews))} نظر</div>
                </div>
                <div style={{flex:1}}>
                  {([5,4,3,2,1]).map(star=>{
                    const pct=Math.max(5,Math.round((p.rating/5)*(star/5)*100*(1+Math.random()*0.3)));
                    return(
                      <div key={star} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                        <span style={{fontSize:11,color:"var(--am-muted)",width:12,textAlign:"center"}}>{star}</span>
                        <span style={{fontSize:10,color:"#F59E0B"}}>★</span>
                        <div style={{flex:1,height:6,background:"var(--am-bg)",borderRadius:3,overflow:"hidden"}}>
                          <div style={{width:`${Math.min(100,pct)}%`,height:"100%",background:star>=4?"#10B981":star===3?"#F59E0B":"#EF4444",borderRadius:3}}/>
                        </div>
                        <span style={{fontSize:10,color:"var(--am-muted)",width:28}}>{toFaDigits(String(Math.min(100,pct)))}٪</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <AnSH title="رضایت بر اساس معیارها"/>
              {([["کیفیت ساخت",Math.min(99,Math.round(p.rating/5*90)+10)],["عملکرد",Math.min(99,Math.round(p.rating/5*85)+15)],["ارزش خرید",Math.min(99,60+(p.storeCount%30))],["طراحی",Math.min(99,Math.round(p.rating/5*80)+18)],["باتری / پایداری",Math.min(99,55+(p.reviews%40))],["خدمات پس از فروش",Math.min(99,48+(p.storeCount*2%40))]] as [string,number][]).map(([label,val])=>(
                <div key={label} style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:13,color:"var(--am-muted)"}}>{label}</span>
                    <span style={{fontSize:13,fontWeight:700,color:"var(--am-text)"}}>{toFaDigits(String(val))}٪</span>
                  </div>
                  <div className="am-progress-track"><div className="am-progress-fill" style={{width:`${val}%`}}/></div>
                </div>
              ))}
            </div>
            <div style={{padding:"14px",background:"var(--am-bg)",borderRadius:14,border:"1px solid var(--am-border)"}}>
              <div style={{fontSize:11,color:"var(--am-muted)",lineHeight:1.9}}>اطلاعات رضایت کاربران بر اساس بازخوردهای {toFaDigits(String(p.reviews))} کاربر جمع‌آوری شده است. این اطلاعات ممکن است کامل یا به‌روز نباشد.</div>
            </div>
          </>
        )}

        {/* ─── Alternatives tab ─── */}
        {tab==="similar"&&(
          <>
            {cheaper.length>0&&(
              <div style={{marginBottom:22}}>
                <AnSH title="مدل‌های ارزان‌تر"/>
                {cheaper.map(sp=>{
                  const diff=Math.round((p.priceMin-sp.priceMin)/p.priceMin*100);
                  return(
                    <button key={sp.id} onClick={()=>onProduct(sp.id)} style={{display:"flex",gap:14,alignItems:"center",width:"100%",background:"var(--am-card)",border:"1px solid var(--am-border)",borderRadius:16,padding:"14px",marginBottom:10,cursor:"pointer",fontFamily:"Vazirmatn",textAlign:"right",boxShadow:"var(--am-shadow)"}}>
                      <img src={sp.img} alt={sp.title} style={{width:60,height:60,borderRadius:12,objectFit:"cover",flexShrink:0}} loading="lazy"/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:"var(--am-text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sp.title}</div>
                        <div style={{fontSize:12,color:"var(--am-muted)",marginTop:3}}>{sp.brand}</div>
                        <div style={{fontSize:13,color:"var(--am-accent)",fontWeight:800,marginTop:5}}>{fa(sp.priceMin)} تومان</div>
                      </div>
                      <div style={{textAlign:"center",flexShrink:0}}>
                        <span style={{fontSize:11,background:"rgba(16,185,129,0.1)",color:"#059669",borderRadius:8,padding:"4px 10px",fontWeight:700,display:"block",whiteSpace:"nowrap"}}>↓{toFaDigits(String(diff))}٪</span>
                        <span style={{fontSize:10,color:"var(--am-muted)",marginTop:4,display:"block"}}>ارزان‌تر</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {pricier.length>0&&(
              <div style={{marginBottom:22}}>
                <AnSH title="گزینه‌های با ارزش خرید بالاتر"/>
                {pricier.map(sp=>{
                  const diff=Math.round((sp.priceMin-p.priceMin)/p.priceMin*100);
                  return(
                    <button key={sp.id} onClick={()=>onProduct(sp.id)} style={{display:"flex",gap:14,alignItems:"center",width:"100%",background:"var(--am-card)",border:"1px solid var(--am-border)",borderRadius:16,padding:"14px",marginBottom:10,cursor:"pointer",fontFamily:"Vazirmatn",textAlign:"right",boxShadow:"var(--am-shadow)"}}>
                      <img src={sp.img} alt={sp.title} style={{width:60,height:60,borderRadius:12,objectFit:"cover",flexShrink:0}} loading="lazy"/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:"var(--am-text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sp.title}</div>
                        <div style={{fontSize:12,color:"var(--am-muted)",marginTop:3}}>{sp.brand}</div>
                        <div style={{fontSize:13,color:"var(--am-text)",fontWeight:800,marginTop:5}}>{fa(sp.priceMin)} تومان</div>
                      </div>
                      <div style={{textAlign:"center",flexShrink:0}}>
                        <span style={{fontSize:11,background:"rgba(245,158,11,0.1)",color:"#D97706",borderRadius:8,padding:"4px 10px",fontWeight:700,display:"block",whiteSpace:"nowrap"}}>+{toFaDigits(String(diff))}٪</span>
                        <span style={{fontSize:10,color:"var(--am-muted)",marginTop:4,display:"block"}}>امکانات بیشتر</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {similar.length>0&&(
              <div>
                <AnSH title="محصولات مشابه"/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {similar.map(sp=><AnProductMiniCard key={sp.id} p={sp} onPress={onProduct}/>)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
function AnCatPage({onCat,onSub,onSearch}:{onCat:(cid:string)=>void;onSub:(cid:string,sid:string)=>void;onSearch:(q:string)=>void}){
  const [q,setQ]=useState("");
  void onSub;
  const filtered=q.trim()
    ?AN_CATS.filter(c=>c.title.includes(q.trim())||c.subcats.some(s=>s.title.includes(q.trim())))
    :AN_CATS;
  const CAT_COLORS:Record<string,string>={
    mobile:"#3B82F6",laptop:"#8B5CF6",hypermarket:"#F59E0B",appliance:"#EF4444",
    fashion:"#EC4899",beauty:"#A855F7",av:"#6366F1",car:"#F97316",
    health:"#10B981",culture:"#0EA5E9",sport:"#84CC16",toy:"#FB923C",
    kids:"#F472B6",building:"#78716C",tool:"#64748B",travel:"#14B8A6",
    pet:"#A3E635",industrial:"#94A3B8",gold:"#EAB308",storeEquip:"#6B7280",other:"#9CA3AF",
  };
  return(
    <div style={{paddingBottom:100}}>
      {/* Search */}
      <div style={{padding:"14px 16px",background:"var(--am-card)",borderBottom:"1px solid var(--am-border)",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",gap:10,alignItems:"center",background:"var(--am-bg)",border:"1.5px solid var(--am-border)",borderRadius:16,padding:"12px 16px"}}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--am-accent)" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&q.trim())onSearch(q.trim());}} placeholder="جستجو در دسته‌بندی‌ها..." style={{flex:1,background:"none",border:"none",outline:"none",color:"var(--am-text)",fontSize:15,fontFamily:"Vazirmatn",direction:"rtl"}}/>
          {q&&<button onClick={()=>setQ("")} style={{background:"none",border:"none",color:"var(--am-faint)",cursor:"pointer",fontSize:20,lineHeight:1,padding:0}}>×</button>}
        </div>
      </div>
      {/* Category list */}
      <div style={{padding:"14px 16px"}}>
        {filtered.map(cat=>{
          const color=CAT_COLORS[cat.id]||"#6B7280";
          const totalProds=getAnCatProds(cat.id,999).length;
          return(
            <button key={cat.id} onClick={()=>onCat(cat.id)} className="am-cat-row">
              <div className="am-cat-row-icon" style={{background:`${color}14`,color}}>
                <AnCatSvg cid={cat.id} sz={24}/>
              </div>
              <div style={{flex:1,textAlign:"right"}}>
                <div style={{fontSize:15,fontWeight:700,color:"var(--am-text)",lineHeight:1.3}}>{cat.title}</div>
                <div style={{fontSize:12,color:"var(--am-muted)",marginTop:3}}>
                  {toFaDigits(String(cat.subcats.length))} زیرگروه
                  {totalProds>0&&<> · {toFaDigits(String(totalProds))}+ محصول</>}
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--am-faint)" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}
function AnCatDetailPage({cid,onSub,onBack}:{cid:string;onSub:(cid:string,sid:string)=>void;onBack:()=>void}){
  const cat=AN_CATS.find(c=>c.id===cid);
  if(!cat)return<div style={{padding:24,textAlign:"center",color:"var(--am-muted)"}}>دسته‌بندی یافت نشد<br/><button onClick={onBack} style={{marginTop:16,padding:"11px 22px",background:"var(--am-accent)",border:"none",borderRadius:12,cursor:"pointer",fontFamily:"Vazirmatn",fontWeight:700,color:"#FFFFFF"}}>بازگشت</button></div>;
  const catProds=getAnCatProds(cid,999);
  return(
    <div style={{paddingBottom:100}}>
      {/* Hero banner */}
      <div style={{background:"linear-gradient(135deg,rgba(10,158,140,0.08),rgba(10,158,140,0.03))",borderBottom:"1px solid var(--am-border)",padding:"18px 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <div style={{width:46,height:46,borderRadius:13,background:"rgba(10,158,140,0.1)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--am-accent)"}}>
            <AnCatSvg cid={cid} sz={22}/>
          </div>
          <div>
            <div style={{fontSize:17,fontWeight:900,color:"var(--am-text)"}}>{cat.title}</div>
            <div style={{fontSize:12,color:"var(--am-muted)",marginTop:2}}>{toFaDigits(String(cat.subcats.length))} زیرگروه · {toFaDigits(String(catProds.length))}+ محصول</div>
          </div>
        </div>
      </div>
      {/* Subcategory list */}
      <div style={{padding:"14px 16px"}}>
        <div style={{fontSize:13,fontWeight:700,color:"var(--am-muted)",marginBottom:12}}>زیرگروه‌ها</div>
        {cat.subcats.map(sub=>{
          const cnt=catProds.filter(p=>p.subId===sub.id).length+sub.pids.length;
          return(
            <button key={sub.id} onClick={()=>onSub(cid,sub.id)} className="am-subcat-row">
              <div style={{width:8,height:8,borderRadius:"50%",background:"var(--am-accent)",flexShrink:0,opacity:0.6}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:700,color:"var(--am-text)"}}>{sub.title}</div>
                <div style={{fontSize:12,color:"var(--am-muted)",marginTop:2}}>{cnt>0?`${toFaDigits(String(cnt))} محصول`:"مشاهده محصولات"}</div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--am-faint)" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}
function AnSubDetailPage({cid,sid,onProduct,onSearch,compareMode,compareSelected,onCompareToggle}:{
  cid:string;sid:string;onProduct:(pid:string)=>void;onSearch?:(q:string)=>void;
  compareMode?:boolean;compareSelected?:string[];onCompareToggle?:(pid:string)=>void;
}){
  const cat=AN_CATS.find(c=>c.id===cid);
  const sub=cat?.subcats.find(s=>s.id===sid);
  const [sort,setSort]=useState<"relevance"|"price-asc"|"price-desc"|"rating">("relevance");
  const rawProds=ALL_MOCK_PRODS.filter(p=>p.subId===sid||(sub?.pids||[]).includes(p.id));
  const prods=useMemo(()=>{
    let r=[...rawProds];
    if(sort==="price-asc")r.sort((a,b)=>a.priceMin-b.priceMin);
    else if(sort==="price-desc")r.sort((a,b)=>b.priceMin-a.priceMin);
    else if(sort==="rating")r.sort((a,b)=>b.rating-a.rating);
    return r;
  },[rawProds,sort]);
  if(rawProds.length===0)return(
    <div style={{padding:"48px 24px",textAlign:"center"}}>
      <div style={{fontSize:40,marginBottom:16}}>🔍</div>
      <div style={{fontSize:16,fontWeight:700,color:"var(--am-text)",marginBottom:8}}>محصولی یافت نشد</div>
      <div style={{fontSize:13,color:"var(--am-muted)",lineHeight:1.7}}>در این دسته‌بندی محصولی موجود نیست. از دستیار هوشمند بپرسید.</div>
      {onSearch&&<button onClick={()=>onSearch(sub?.title||"")} style={{marginTop:20,padding:"13px 24px",background:"var(--am-accent)",border:"none",borderRadius:13,color:"#FFFFFF",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"Vazirmatn"}}>جستجو با دستیار</button>}
    </div>
  );
  const sortLabels={"relevance":"مرتبط‌ترین","price-asc":"ارزان‌ترین","price-desc":"گران‌ترین","rating":"بهترین امتیاز"};
  return(
    <div style={{paddingBottom:120}}>
      {/* Compare button */}
      {prods.length>=2&&(
        <div style={{padding:"12px 16px",background:"var(--am-card)",borderBottom:"1px solid var(--am-border)"}}>
          <button onClick={()=>onCompareToggle?.("__mode__")} className={`am-compare-btn${compareMode?" active":""}`}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg>
            {compareMode?`مقایسه فعال — ${compareSelected?.length||0} محصول انتخابی`:"برام مقایسه کن"}
            {compareMode&&<span className="am-pulse-dot"/>}
          </button>
        </div>
      )}
      {/* Sort bar */}
      <div className="am-filter-bar">
        {(["relevance","price-asc","price-desc","rating"] as const).map(s=>(
          <button key={s} onClick={()=>setSort(s)} className={`am-filter-btn${sort===s?" active":""}`}>{sortLabels[s]}</button>
        ))}
      </div>
      {/* Count */}
      <div style={{padding:"12px 16px 4px",background:"var(--am-bg)"}}>
        <span style={{fontSize:13,color:"var(--am-muted)",fontWeight:600}}>{toFaDigits(String(prods.length))} محصول</span>
      </div>
      {/* Products */}
      <div style={{padding:"8px 16px"}}>
        {prods.map(p=>(
          <AnSearchResultCard key={p.id} p={p} onPress={onProduct} aiComment={getAiComment(sub?.title||"",p)} compareMode={compareMode} compareSelected={compareSelected?.includes(p.id)} onCompareToggle={onCompareToggle}/>
        ))}
      </div>
    </div>
  );
}
function AnTicketsSubPage({onBack}:{onBack:()=>void}){
  type TMsg={from:"me"|"support";text:string;date:string};
  type TTicket={id:string;sub:string;cat:string;date:string;status:string;open:boolean;priority:"بالا"|"متوسط"|"پایین";msgs:TMsg[]};
  const STATUS_COLORS:Record<string,string>={"باز":"#3B82F6","در حال بررسی":"#F59E0B","پاسخ داده شد":"#10B981","بسته شده":"#6B7280","در انتظار بررسی":"#8B5CF6"};
  const [selected,setSelected]=useState<string|null>(null);
  const [reply,setReply]=useState("");
  const [showNew,setShowNew]=useState(false);
  const [newSub,setNewSub]=useState("");
  const [newMsg,setNewMsg]=useState("");
  const [newCat,setNewCat]=useState("مشکل سفارش");
  const [tickets,setTickets]=useState<TTicket[]>([
    {id:"TKT-۰۰۱",sub:"مشکل در تحویل سفارش",cat:"مشکل سفارش",date:"۱۴۰۳/۰۶/۱۲",status:"در حال بررسی",open:true,priority:"بالا",msgs:[
      {from:"me",text:"سفارشم هنوز نرسیده. لطفاً پیگیری کنید.",date:"۱۴۰۳/۰۶/۱۰"},
      {from:"support",text:"با عرض پوزش، سفارش شما در مرحله ارسال است و تا ۲ روز آینده تحویل داده می‌شود.",date:"۱۴۰۳/۰۶/۱۱"},
    ]},
    {id:"TKT-۰۰۲",sub:"استعلام گارانتی محصول",cat:"سوال فنی",date:"۱۴۰۳/۰۵/۲۰",status:"پاسخ داده شد",open:false,priority:"متوسط",msgs:[
      {from:"me",text:"گارانتی محصولم چقدر است؟",date:"۱۴۰۳/۰۵/۱۹"},
      {from:"support",text:"گارانتی این محصول ۱۸ ماه از تاریخ خرید است.",date:"۱۴۰۳/۰۵/۲۰"},
    ]},
    {id:"TKT-۰۰۳",sub:"مشکل در پرداخت",cat:"مشکل پرداخت",date:"۱۴۰۳/۰۴/۰۵",status:"بسته شده",open:false,priority:"بالا",msgs:[
      {from:"me",text:"پرداختم ناموفق شد ولی پول کسر شد.",date:"۱۴۰۳/۰۴/۰۴"},
      {from:"support",text:"وجه کسر شده ظرف ۷۲ ساعت به حساب شما بازمی‌گردد.",date:"۱۴۰۳/۰۴/۰۵"},
    ]},
  ]);
  useBackHandler(()=>{if(selected){setSelected(null);}else if(showNew){setShowNew(false);}else onBack();});

  const selectedTicket=tickets.find(t=>t.id===selected);

  if(showNew){
    return(
      <div style={{paddingBottom:100}}>
        <div style={{background:"var(--am-card)",borderBottom:"1px solid var(--am-border)",padding:"16px"}}>
          <div style={{fontSize:16,fontWeight:900,color:"var(--am-text)"}}>ثبت تیکت جدید</div>
          <div style={{fontSize:12,color:"var(--am-muted)",marginTop:3}}>مشکل یا سوال خود را توضیح دهید</div>
        </div>
        <div style={{padding:"16px"}}>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:"var(--am-muted)",marginBottom:8}}>دسته‌بندی مشکل</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {["مشکل سفارش","مشکل پرداخت","سوال فنی","گارانتی","مرجوعی","سایر"].map(cat=>(
                <button key={cat} onClick={()=>setNewCat(cat)} style={{padding:"9px 16px",borderRadius:11,background:newCat===cat?"var(--am-accent)":"var(--am-bg)",border:`1.5px solid ${newCat===cat?"var(--am-accent)":"var(--am-border)"}`,color:newCat===cat?"#FFFFFF":"var(--am-muted)",fontSize:13,fontFamily:"Vazirmatn",fontWeight:newCat===cat?800:500,cursor:"pointer"}}>{cat}</button>
              ))}
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:"var(--am-muted)",marginBottom:8}}>موضوع</div>
            <input value={newSub} onChange={e=>setNewSub(e.target.value)} placeholder="موضوع مشکل یا سوال..." style={{width:"100%",background:"var(--am-card)",border:"1.5px solid var(--am-border)",borderRadius:12,padding:"14px 16px",color:"var(--am-text)",fontSize:14,fontFamily:"Vazirmatn",direction:"rtl",outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:12,fontWeight:700,color:"var(--am-muted)",marginBottom:8}}>شرح مشکل</div>
            <textarea value={newMsg} onChange={e=>setNewMsg(e.target.value)} rows={6} placeholder="مشکل یا سوال خود را با جزئیات کامل توضیح دهید..." style={{width:"100%",background:"var(--am-card)",border:"1.5px solid var(--am-border)",borderRadius:12,padding:"14px 16px",resize:"none",color:"var(--am-text)",fontSize:14,fontFamily:"Vazirmatn",direction:"rtl",outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setShowNew(false)} style={{flex:1,padding:"14px",background:"var(--am-bg)",border:"1.5px solid var(--am-border)",borderRadius:13,color:"var(--am-muted)",fontSize:14,fontFamily:"Vazirmatn",cursor:"pointer",fontWeight:700}}>انصراف</button>
            <button onClick={()=>{if(!newSub.trim()||!newMsg.trim())return;const id=`TKT-${String(Date.now()).slice(-3)}`;setTickets(prev=>[{id,sub:newSub.trim(),cat:newCat,date:"۱۴۰۳/۰۶/۱۶",status:"باز",open:true,priority:"متوسط" as const,msgs:[{from:"me" as const,text:newMsg.trim(),date:"۱۴۰۳/۰۶/۱۶"}]},...prev]);setNewSub("");setNewMsg("");setShowNew(false);}} style={{flex:2,padding:"14px",background:"var(--am-accent)",border:"none",borderRadius:13,color:"#FFFFFF",fontSize:14,fontFamily:"Vazirmatn",cursor:"pointer",fontWeight:900}}>ارسال تیکت</button>
          </div>
        </div>
      </div>
    );
  }

  if(selected&&selectedTicket){
    const sc=STATUS_COLORS[selectedTicket.status]||"#6B7280";
    return(
      <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
        <div style={{background:"var(--am-card)",borderBottom:"1px solid var(--am-border)",padding:"14px 16px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <button onClick={()=>setSelected(null)} style={{width:36,height:36,borderRadius:11,background:"var(--am-bg)",border:"1.5px solid var(--am-border)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--am-text)",flexShrink:0}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:800,color:"var(--am-text)"}}>{selectedTicket.sub}</div>
              <div style={{fontSize:11,color:"var(--am-muted)",marginTop:2}}>{selectedTicket.id} · {selectedTicket.cat} · {selectedTicket.date}</div>
            </div>
            <span style={{fontSize:11,background:`${sc}14`,color:sc,borderRadius:9,padding:"5px 12px",fontWeight:700,flexShrink:0}}>{selectedTicket.status}</span>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
          {selectedTicket.msgs.map((m,i)=>(
            <div key={i} style={{display:"flex",flexDirection:m.from==="me"?"row-reverse":"row",gap:10,alignItems:"flex-start"}}>
              <div style={{width:32,height:32,borderRadius:10,background:m.from==="me"?"var(--am-accent)":"var(--am-bg)",border:"1.5px solid var(--am-border)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:10,fontWeight:700,color:m.from==="me"?"#FFFFFF":"var(--am-muted)"}}>
                {m.from==="me"?"من":"پش"}
              </div>
              <div style={{maxWidth:"78%"}}>
                <div style={{background:m.from==="me"?"var(--am-accent)":"var(--am-card2)",border:m.from==="me"?"none":"1.5px solid var(--am-border)",borderRadius:m.from==="me"?"4px 16px 16px 16px":"16px 4px 16px 16px",padding:"12px 14px",boxShadow:"var(--am-shadow)"}}>
                  <div style={{fontSize:13,color:m.from==="me"?"#FFFFFF":"var(--am-text)",lineHeight:1.7,direction:"rtl"}}>{m.text}</div>
                </div>
                <div style={{fontSize:10,color:"var(--am-faint)",marginTop:4,textAlign:m.from==="me"?"left":"right"}}>{m.date}</div>
              </div>
            </div>
          ))}
        </div>
        {selectedTicket.open&&(
          <div style={{flexShrink:0,padding:"12px 16px",background:"var(--am-card)",borderTop:"1px solid var(--am-border)"}}>
            <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
              <textarea value={reply} onChange={e=>setReply(e.target.value)} rows={2} placeholder="پاسخ خود را بنویسید..." style={{flex:1,background:"var(--am-bg)",border:"1.5px solid var(--am-border)",borderRadius:12,padding:"12px 14px",resize:"none",color:"var(--am-text)",fontSize:13,fontFamily:"Vazirmatn",direction:"rtl",outline:"none"}}/>
              <button onClick={()=>{if(!reply.trim())return;const now="۱۴۰۳/۰۶/۱۶";setTickets(prev=>prev.map(t=>t.id===selected?{...t,msgs:[...t.msgs,{from:"me" as const,text:reply.trim(),date:now}]}:t));setReply("");}} style={{width:44,height:44,borderRadius:12,background:"var(--am-accent)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return(
    <div style={{paddingBottom:100}}>
      <div style={{padding:"16px",background:"var(--am-card)",borderBottom:"1px solid var(--am-border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:16,fontWeight:900,color:"var(--am-text)"}}>تیکت‌های پشتیبانی</div>
          <div style={{fontSize:12,color:"var(--am-muted)",marginTop:2}}>{toFaDigits(String(tickets.filter(t=>t.open).length))} تیکت باز</div>
        </div>
        <button onClick={()=>setShowNew(true)} style={{display:"flex",alignItems:"center",gap:8,padding:"11px 18px",background:"var(--am-accent)",border:"none",borderRadius:12,color:"#FFFFFF",fontSize:13,fontFamily:"Vazirmatn",cursor:"pointer",fontWeight:800}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          تیکت جدید
        </button>
      </div>
      <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
        {tickets.map(t=>{
          const sc=STATUS_COLORS[t.status]||"#6B7280";
          return(
            <button key={t.id} onClick={()=>setSelected(t.id)} style={{display:"block",width:"100%",background:"var(--am-card)",border:"1.5px solid var(--am-border)",borderRadius:16,padding:"16px",cursor:"pointer",fontFamily:"Vazirmatn",textAlign:"right",boxShadow:"var(--am-shadow)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{flex:1,marginLeft:10}}>
                  <div style={{fontSize:14,fontWeight:800,color:"var(--am-text)",lineHeight:1.4}}>{t.sub}</div>
                  <div style={{fontSize:11,color:"var(--am-muted)",marginTop:3}}>{t.id} · {t.cat}</div>
                </div>
                <span style={{fontSize:11,background:`${sc}14`,color:sc,borderRadius:9,padding:"5px 11px",fontWeight:700,flexShrink:0}}>{t.status}</span>
              </div>
              <div style={{borderTop:"1px solid var(--am-border)",paddingTop:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:11,color:"var(--am-muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"70%"}}>{t.msgs[t.msgs.length-1].text.slice(0,45)}…</span>
                <span style={{fontSize:10,color:"var(--am-faint)",flexShrink:0,marginRight:8}}>{t.date}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


function AnCitySubPage({onBack}:{onBack:()=>void}){
  void onBack;
  const PROVINCES:{name:string;cities:string[]}[]=[
    {name:"تهران",cities:["تهران","کرج","ری","شهریار","اسلامشهر","پاکدشت","ورامین","دماوند","فیروزکوه","ملارد","نظرآباد"]},
    {name:"اصفهان",cities:["اصفهان","کاشان","خمینی‌شهر","نجف‌آباد","زاینده‌رود","شاهین‌شهر","فلاورجان","آران و بیدگل","گلپایگان","تیران و کرون"]},
    {name:"خراسان رضوی",cities:["مشهد","نیشابور","سبزوار","قوچان","کاشمر","گناباد","فریمان","تربت حیدریه","تربت جام","رشتخوار"]},
    {name:"فارس",cities:["شیراز","مرودشت","جهرم","فسا","لار","آباده","داراب","اقلید","نورآباد ممسنی","کازرون"]},
    {name:"آذربایجان شرقی",cities:["تبریز","مراغه","مرند","بناب","اهر","میانه","ملکان","سراب","شبستر","هشترود"]},
    {name:"خوزستان",cities:["اهواز","آبادان","خرمشهر","دزفول","ماهشهر","بهبهان","اندیمشک","ایذه","شوش","رامهرمز"]},
    {name:"مازندران",cities:["ساری","بابل","آمل","قائم‌شهر","نوشهر","چالوس","بابلسر","تنکابن","جویبار","رامسر"]},
    {name:"البرز",cities:["کرج","فردیس","گوهردشت","هشتگرد","نظرآباد","ساوجبلاغ","طالقان"]},
    {name:"گیلان",cities:["رشت","انزلی","لاهیجان","لنگرود","صومعه‌سرا","شفت","رودبار","تالش","فومن","آستانه"]},
    {name:"کرمان",cities:["کرمان","زاهدان","جیرفت","بم","رفسنجان","سیرجان","بردسیر","شهربابک","انار","زرند"]},
    {name:"گلستان",cities:["گرگان","گنبد کاووس","علی‌آباد","کردکوی","آزادشهر","مینودشت","بندر ترکمن"]},
    {name:"همدان",cities:["همدان","ملایر","نهاوند","تویسرکان","اسدآباد","بهار","رزن","کبودرآهنگ"]},
    {name:"کرمانشاه",cities:["کرمانشاه","اسلام‌آباد غرب","هرسین","سنقر","صحنه","کنگاور","سرپل ذهاب"]},
    {name:"آذربایجان غربی",cities:["ارومیه","خوی","مهاباد","بوکان","میاندوآب","سلماس","نقده","پیرانشهر"]},
    {name:"سیستان و بلوچستان",cities:["زاهدان","زابل","خاش","ایرانشهر","چابهار","سراوان","نیکشهر"]},
    {name:"قم",cities:["قم"]},
    {name:"سمنان",cities:["سمنان","شاهرود","دامغان","گرمسار","ایوانکی","آرادان"]},
    {name:"بوشهر",cities:["بوشهر","گناوه","دیلم","خارک","کنگان","جم"]},
    {name:"زنجان",cities:["زنجان","ابهر","خرمدره","قیدار","ایجرود","ماه‌نشان"]},
    {name:"مرکزی",cities:["اراک","ساوه","خمین","محلات","شازند","آشتیان","تفرش"]},
    {name:"قزوین",cities:["قزوین","تاکستان","آبیک","بوئین‌زهرا","الموت"]},
    {name:"اردبیل",cities:["اردبیل","مشگین‌شهر","پارس‌آباد","خلخال","بیله‌سوار","نمین","سرعین"]},
    {name:"یزد",cities:["یزد","میبد","اردکان","ابرکوه","تفت","بافق","مهریز"]},
    {name:"ایلام",cities:["ایلام","دهلران","مهران","آبدانان","دره‌شهر","شیروان","ایوان"]},
    {name:"لرستان",cities:["خرم‌آباد","بروجرد","کوهدشت","الیگودرز","دورود","ازنا","نورآباد"]},
    {name:"چهارمحال و بختیاری",cities:["شهرکرد","بروجن","فارسان","اردل","لردگان","اردال"]},
    {name:"کهگیلویه و بویراحمد",cities:["یاسوج","دهدشت","سی‌سخت","دوگنبدان","بهمئی"]},
    {name:"خراسان شمالی",cities:["بجنورد","شیروان","اسفراین","مانه و سملقان","جاجرم"]},
    {name:"خراسان جنوبی",cities:["بیرجند","قاین","فردوس","طبس","سربیشه","بشرویه"]},
    {name:"هرمزگان",cities:["بندرعباس","بندرلنگه","قشم","کیش","میناب","حاجی‌آباد"]},
  ];
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState(()=>localStorage.getItem("anp_am_city")||"تهران");
  const [tab,setTab]=useState<"search"|"map">("search");
  const [expandedProvince,setExpandedProvince]=useState<string|null>("تهران");
  const selectCity=(city:string)=>{setSelected(city);localStorage.setItem("anp_am_city",city);};

  const allCities=PROVINCES.flatMap(p=>p.cities);
  const filtered=search.trim()
    ?allCities.filter(c=>c.includes(search.trim()))
    :[];

  const IranMapSVG=()=>(
    <svg viewBox="0 0 400 320" style={{width:"100%",maxHeight:280}} xmlns="http://www.w3.org/2000/svg">
      {/* Simplified Iran shape */}
      <path d="M180 20 L200 18 L220 22 L245 30 L265 35 L280 30 L295 40 L310 55 L320 70 L330 90 L335 110 L340 130 L338 150 L330 165 L315 175 L300 185 L290 200 L280 215 L270 230 L255 240 L240 250 L225 258 L210 265 L200 270 L185 268 L170 260 L155 248 L140 235 L125 220 L110 205 L95 195 L80 185 L70 175 L60 160 L55 145 L50 130 L52 110 L58 92 L68 75 L80 60 L95 50 L110 42 L125 35 L140 28 L155 22 L170 20 Z" fill="rgba(10,158,140,0.08)" stroke="var(--am-accent)" strokeWidth="1.5" strokeLinejoin="round"/>
      {/* Province dots */}
      {[
        {name:"تهران",x:218,y:105},{name:"اصفهان",x:195,y:150},{name:"مشهد",x:295,y:75},
        {name:"شیراز",x:185,y:210},{name:"تبریز",x:110,y:60},{name:"اهواز",x:130,y:175},
        {name:"کرمان",x:250,y:190},{name:"رشت",x:165,y:72},{name:"قم",x:205,y:120},
        {name:"اردبیل",x:115,y:48},{name:"کرمانشاه",x:110,y:120},{name:"ارومیه",x:88,y:58},
        {name:"زاهدان",x:295,y:220},{name:"سمنان",x:245,y:100},{name:"یزد",x:232,y:170},
        {name:"بوشهر",x:168,y:230},{name:"گرگان",x:258,y:65},{name:"بیرجند",x:285,y:158},
        {name:"بندرعباس",x:230,y:255},{name:"ایلام",x:100,y:140},{name:"زنجان",x:145,y:78},
        {name:"خرم‌آباد",x:130,y:148},{name:"شهرکرد",x:168,y:168},{name:"همدان",x:145,y:108},
        {name:"اراک",x:168,y:122},{name:"قزوین",x:172,y:88},{name:"یاسوج",x:158,y:198},
      ].map(city=>(
        <g key={city.name} onClick={()=>selectCity(city.name)} style={{cursor:"pointer"}}>
          <circle cx={city.x} cy={city.y} r={city.name===selected?7:4} fill={city.name===selected?"var(--am-accent)":"rgba(10,158,140,0.5)"} stroke={city.name===selected?"#FFFFFF":"transparent"} strokeWidth="1.5"/>
          <text x={city.x} y={city.y-10} textAnchor="middle" fontSize="7" fill={city.name===selected?"var(--am-accent)":"var(--am-muted)"} fontFamily="Vazirmatn" fontWeight={city.name===selected?"800":"400"}>{city.name}</text>
        </g>
      ))}
      {/* Caspian Sea label */}
      <text x="165" y="45" textAnchor="middle" fontSize="7" fill="rgba(99,102,241,0.6)" fontFamily="Vazirmatn">دریای خزر</text>
      {/* Persian Gulf label */}
      <text x="165" y="285" textAnchor="middle" fontSize="7" fill="rgba(99,102,241,0.6)" fontFamily="Vazirmatn">خلیج فارس</text>
    </svg>
  );

  return(
    <div style={{paddingBottom:100}}>
      {/* Current city card */}
      <div style={{background:"linear-gradient(135deg,rgba(10,158,140,0.1),rgba(10,158,140,0.03))",borderBottom:"1px solid var(--am-border)",padding:"18px 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:46,height:46,borderRadius:13,background:"var(--am-accent)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:"var(--am-muted)",fontWeight:600}}>شهر فعلی شما</div>
            <div style={{fontSize:20,fontWeight:900,color:"var(--am-accent)",marginTop:2}}>{selected}</div>
            <div style={{fontSize:11,color:"var(--am-muted)",marginTop:2,lineHeight:1.5}}>قیمت‌ها، موجودی و هزینه ارسال بر اساس این شهر نمایش داده می‌شود</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",background:"var(--am-card)",borderBottom:"1px solid var(--am-border)"}}>
        {([["search","جستجوی شهر"],["map","نقشه ایران"]] as const).map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"14px",background:"none",border:"none",borderBottom:`2.5px solid ${tab===t?"var(--am-accent)":"transparent"}`,color:tab===t?"var(--am-accent)":"var(--am-muted)",fontFamily:"Vazirmatn",fontSize:14,fontWeight:tab===t?800:500,cursor:"pointer",transition:"all .15s"}}>{l}</button>
        ))}
      </div>

      {tab==="search"&&(
        <div style={{padding:"14px 16px"}}>
          {/* Search input */}
          <div style={{display:"flex",gap:10,alignItems:"center",background:"var(--am-card)",border:"1.5px solid var(--am-border)",borderRadius:16,padding:"13px 16px",marginBottom:16,boxShadow:"var(--am-shadow)"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--am-accent)" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="نام شهر را جستجو کنید..." style={{flex:1,background:"none",border:"none",outline:"none",color:"var(--am-text)",fontSize:15,fontFamily:"Vazirmatn",direction:"rtl"}}/>
            {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"var(--am-faint)",cursor:"pointer",fontSize:20,lineHeight:1,padding:0}}>×</button>}
          </div>

          {search.trim()?(
            /* Search results */
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {filtered.length===0
                ?<div style={{textAlign:"center",padding:"32px",color:"var(--am-muted)",fontSize:14}}>شهری با این نام یافت نشد</div>
                :filtered.map(city=>(
                  <button key={city} onClick={()=>selectCity(city)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",textAlign:"right",background:city===selected?"var(--am-accent-light)":"var(--am-card)",border:`1.5px solid ${city===selected?"var(--am-accent)":"var(--am-border)"}`,borderRadius:13,padding:"15px 16px",cursor:"pointer",fontFamily:"Vazirmatn",fontSize:14,color:city===selected?"var(--am-accent)":"var(--am-text)",fontWeight:city===selected?800:500,boxShadow:"var(--am-shadow)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>
                      {city}
                    </div>
                    {city===selected&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--am-accent)" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>}
                  </button>
                ))
              }
            </div>
          ):(
            /* Province accordion */
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {PROVINCES.filter((p,i,arr)=>arr.findIndex(q=>q.name===p.name)===i).map(prov=>(
                <div key={prov.name} style={{background:"var(--am-card)",border:`1.5px solid ${expandedProvince===prov.name?"var(--am-accent)":"var(--am-border)"}`,borderRadius:14,overflow:"hidden",boxShadow:"var(--am-shadow)"}}>
                  <button onClick={()=>setExpandedProvince(expandedProvince===prov.name?null:prov.name)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"14px 16px",background:"none",border:"none",cursor:"pointer",fontFamily:"Vazirmatn",color:expandedProvince===prov.name?"var(--am-accent)":"var(--am-text)",fontWeight:700,fontSize:14}}>
                    <span>{prov.name}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{transform:expandedProvince===prov.name?"rotate(-90deg)":"rotate(0deg)",transition:"transform .2s"}}><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  {expandedProvince===prov.name&&(
                    <div style={{borderTop:"1px solid var(--am-border)",display:"flex",flexWrap:"wrap",gap:6,padding:"12px 14px"}}>
                      {prov.cities.map(city=>(
                        <button key={city} onClick={()=>selectCity(city)} style={{padding:"8px 14px",borderRadius:10,background:city===selected?"var(--am-accent)":"var(--am-bg)",border:`1px solid ${city===selected?"var(--am-accent)":"var(--am-border)"}`,color:city===selected?"#FFFFFF":"var(--am-text)",fontSize:13,fontFamily:"Vazirmatn",fontWeight:city===selected?800:500,cursor:"pointer"}}>
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab==="map"&&(
        <div style={{padding:"16px"}}>
          <div style={{background:"var(--am-card)",border:"1px solid var(--am-border)",borderRadius:18,padding:"16px",boxShadow:"var(--am-shadow)",marginBottom:14}}>
            <div style={{fontSize:12,color:"var(--am-muted)",marginBottom:10,textAlign:"center"}}>روی هر شهر تپ کنید تا انتخاب شود</div>
            <IranMapSVG/>
          </div>
          <div style={{background:"rgba(10,158,140,0.06)",border:"1px solid rgba(10,158,140,0.2)",borderRadius:14,padding:"13px 16px",textAlign:"center"}}>
            <div style={{fontSize:13,color:"var(--am-muted)"}}>شهر انتخابی:</div>
            <div style={{fontSize:18,fontWeight:900,color:"var(--am-accent)",marginTop:4}}>{selected}</div>
          </div>
        </div>
      )}

      {/* Confirm button */}
      <div style={{padding:"0 16px 16px",position:"sticky",bottom:80}}>
        <button style={{width:"100%",padding:"16px",background:"var(--am-accent)",border:"none",borderRadius:16,color:"#FFFFFF",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"Vazirmatn",boxShadow:"0 4px 16px rgba(10,158,140,0.3)"}}>
          تأیید — {selected}
        </button>
      </div>
    </div>
  );
}


function AnMeSubPage({view,onProduct,onBack}:{view:AnView;onProduct:(pid:string)=>void;onBack:()=>void}){
  useBackHandler(onBack);
  const [selOrder,setSelOrder]=useState<null|{id:string;date:string;status:string;sc:string;product:string;price:number;qty:number;seller:string;orderNum:string;img:string}>(null);
  const MOCK_ORDERS=[
    {id:"ORD-۱۲۳۴",date:"۱۴۰۳/۰۶/۱۵",status:"تحویل داده شده",sc:"#10B981",product:"لپ‌تاپ ایسوس VivoBook 15",price:57500000,qty:1,seller:"دیجی‌کالا",orderNum:"#DK-8821",img:"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&h=200&fit=crop"},
    {id:"ORD-۱۲۳۳",date:"۱۴۰۳/۰۵/۲۸",status:"در حال ارسال",sc:"#3B82F6",product:"هدفون سونی WH-1000XM5",price:12800000,qty:1,seller:"تکنولایف",orderNum:"#TL-5503",img:"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop"},
    {id:"ORD-۱۲۳۲",date:"۱۴۰۳/۰۵/۱۰",status:"تحویل داده شده",sc:"#10B981",product:"گوشی Galaxy A54",price:18500000,qty:1,seller:"ایمالز",orderNum:"#IM-3317",img:"https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=200&h=200&fit=crop"},
    {id:"ORD-۱۲۳۱",date:"۱۴۰۳/۰۴/۰۲",status:"در انتظار ارسال",sc:"#F59E0B",product:"ماوس لاجیتک MX Master 3",price:4200000,qty:2,seller:"دیجی‌کالا",orderNum:"#DK-7703",img:"https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200&h=200&fit=crop"},
    {id:"ORD-۱۲۳۰",date:"۱۴۰۳/۰۳/۱۸",status:"لغو شده",sc:"#EF4444",product:"کیبورد مکانیکال Keychron K2",price:3800000,qty:1,seller:"پی‌استور",orderNum:"#PS-2201",img:"https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=200&h=200&fit=crop"},
  ];
  const MOCK_ALERTS=[
    {pid:"iphone15pm",title:"آیفون ۱۵ پرو مکس ۲۵۶ گیگ",target:135000000,current:142000000,enabled:true,lastUpdate:"دیروز",img:"https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=200&h=200&fit=crop"},
    {pid:"macbook-m2",title:"مک‌بوک ایر M2 ۸ گیگ",target:85000000,current:89000000,enabled:true,lastUpdate:"۳ روز پیش",img:"https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&h=200&fit=crop"},
    {pid:"samsung-tv65",title:"تلویزیون سامسونگ ۶۵ اینچ UHD",target:52000000,current:58000000,enabled:false,lastUpdate:"امروز",img:"https://images.unsplash.com/photo-1593359677879-a4bb92f4834c?w=200&h=200&fit=crop"},
    {pid:"dyson-v15",title:"جاروبرقی دایسون V15 Detect",target:32000000,current:34500000,enabled:true,lastUpdate:"۱ ساعت پیش",img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop"},
  ];
  const [alertStates,setAlertStates]=useState<Record<string,boolean>>(()=>Object.fromEntries(MOCK_ALERTS.map(a=>[a.pid,a.enabled])));
  const favProds=AN_PRODS.slice(0,6);
  const recentProds=AN_PRODS.slice(2,10);
  const compareProds=AN_PRODS.slice(0,3);
  const wrap=(content:React.ReactNode)=>(
    <div style={{paddingBottom:100}}>{content}</div>
  );

  if(view.t==="me-orders")return wrap(
    <div style={{padding:"14px 16px",position:"relative"}}>
      {/* Order detail overlay */}
      {selOrder&&(
        <div style={{position:"fixed",inset:0,zIndex:800,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={()=>setSelOrder(null)}>
          <div style={{background:"rgba(0,0,0,0.5)",position:"absolute",inset:0}}/>
          <div style={{position:"relative",background:"var(--am-card)",borderRadius:"24px 24px 0 0",padding:"24px",zIndex:1,maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:44,height:4,borderRadius:2,background:"var(--am-border)",margin:"0 auto 20px",flexShrink:0}}/>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
              <img src={selOrder.img} alt={selOrder.product} style={{width:72,height:72,borderRadius:14,objectFit:"cover",flexShrink:0,border:"1px solid var(--am-border)"}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:800,color:"var(--am-text)",lineHeight:1.4,marginBottom:6}}>{selOrder.product}</div>
                <div style={{display:"inline-block",background:`${selOrder.sc}14`,border:`1px solid ${selOrder.sc}40`,borderRadius:8,padding:"4px 10px",fontSize:12,fontWeight:700,color:selOrder.sc}}>{selOrder.status}</div>
              </div>
            </div>
            {/* Details grid */}
            <div style={{background:"var(--am-bg)",borderRadius:16,overflow:"hidden",marginBottom:16}}>
              {[
                {label:"شماره سفارش",val:selOrder.orderNum},
                {label:"فروشگاه",val:selOrder.seller},
                {label:"تاریخ ثبت",val:selOrder.date},
                {label:"تعداد",val:toFaDigits(String(selOrder.qty))+" عدد"},
                {label:"مبلغ کل",val:fa(selOrder.price*selOrder.qty)+" تومان"},
              ].map((row,i,arr)=>(
                <div key={row.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 16px",borderBottom:i<arr.length-1?"1px solid var(--am-border)":"none"}}>
                  <span style={{fontSize:13,color:"var(--am-muted)"}}>{row.label}</span>
                  <span style={{fontSize:13,fontWeight:700,color:"var(--am-text)"}}>{row.val}</span>
                </div>
              ))}
            </div>
            {/* Timeline */}
            <div style={{fontSize:13,fontWeight:800,color:"var(--am-text)",marginBottom:12}}>وضعیت سفارش</div>
            <div style={{position:"relative",paddingRight:24,marginBottom:20}}>
              <div style={{position:"absolute",right:8,top:6,bottom:6,width:2,background:"var(--am-border)"}}/>
              {[
                {label:"ثبت سفارش",done:true,date:selOrder.date},
                {label:"تأیید و پردازش",done:selOrder.status!=="در انتظار ارسال"&&selOrder.status!=="لغو شده",date:""},
                {label:"ارسال",done:selOrder.status==="تحویل داده شده"||selOrder.status==="در حال ارسال",date:""},
                {label:"تحویل",done:selOrder.status==="تحویل داده شده",date:""},
              ].map((step,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:14,position:"relative"}}>
                  <div style={{width:16,height:16,borderRadius:"50%",background:step.done?selOrder.sc:"var(--am-border)",flexShrink:0,marginTop:2,border:`2px solid ${step.done?selOrder.sc:"var(--am-border)"}`,position:"relative",zIndex:1}}/>
                  <div>
                    <div style={{fontSize:13,fontWeight:step.done?700:400,color:step.done?"var(--am-text)":"var(--am-muted)"}}>{step.label}</div>
                    {step.date&&<div style={{fontSize:11,color:"var(--am-muted)",marginTop:2}}>{step.date}</div>}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={()=>setSelOrder(null)} style={{width:"100%",padding:"15px",background:"var(--am-bg)",border:"1.5px solid var(--am-border)",borderRadius:14,color:"var(--am-muted)",fontSize:14,fontFamily:"Vazirmatn",cursor:"pointer",fontWeight:700}}>بستن</button>
          </div>
        </div>
      )}
      <div style={{fontSize:16,fontWeight:900,color:"var(--am-text)",marginBottom:4}}>خریدهای من</div>
      <div style={{fontSize:12,color:"var(--am-muted)",marginBottom:16}}>{toFaDigits(String(MOCK_ORDERS.length))} سفارش</div>
      {MOCK_ORDERS.map(o=>(
        <div key={o.id} style={{background:"var(--am-card)",border:"1.5px solid var(--am-border)",borderRadius:18,marginBottom:14,overflow:"hidden",boxShadow:"var(--am-shadow)"}}>
          {/* Status bar */}
          <div style={{padding:"10px 16px",background:`${o.sc}0A`,borderBottom:"1px solid var(--am-border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,fontWeight:800,color:o.sc}}>{o.status}</span>
            <span style={{fontSize:11,color:"var(--am-muted)"}}>{o.orderNum}</span>
          </div>
          {/* Product row */}
          <div style={{padding:"14px 16px",display:"flex",gap:14,alignItems:"flex-start"}}>
            <div style={{width:72,height:72,borderRadius:13,overflow:"hidden",flexShrink:0,background:"var(--am-bg)"}}>
              <img src={o.img} alt={o.product} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:800,color:"var(--am-text)",lineHeight:1.4,marginBottom:5}}>{o.product}</div>
              <div style={{fontSize:12,color:"var(--am-muted)",marginBottom:4}}>فروشگاه: {o.seller}</div>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{fontSize:15,fontWeight:900,color:"var(--am-accent)"}}>{fa(o.price)} تومان</div>
                <div style={{fontSize:11,color:"var(--am-muted)"}}>× {toFaDigits(String(o.qty))}</div>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div style={{padding:"10px 16px",borderTop:"1px solid var(--am-border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:11,color:"var(--am-muted)"}}>{o.date}</span>
            <button onClick={()=>setSelOrder(o)} style={{padding:"8px 16px",background:"var(--am-accent-light)",border:"1px solid var(--am-accent-border)",borderRadius:10,color:"var(--am-accent)",fontSize:12,fontFamily:"Vazirmatn",cursor:"pointer",fontWeight:700}}>جزئیات سفارش</button>
          </div>
        </div>
      ))}
    </div>
  );

  if(view.t==="me-fav")return wrap(
    <div style={{padding:"14px 16px"}}>
      <div style={{fontSize:16,fontWeight:900,color:"var(--am-text)",marginBottom:16}}>علاقه‌مندی‌ها</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {favProds.map(p=>(
          <button key={p.id} onClick={()=>onProduct(p.id)} style={{background:"var(--am-card)",border:"1.5px solid var(--am-border)",borderRadius:16,overflow:"hidden",cursor:"pointer",padding:0,fontFamily:"Vazirmatn",textAlign:"right",boxShadow:"var(--am-shadow)"}}>
            <div style={{width:"100%",aspectRatio:"1",background:"var(--am-bg)",overflow:"hidden"}}>
              <img src={p.img} alt={p.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            </div>
            <div style={{padding:"10px 11px 12px"}}>
              <div style={{fontSize:10,color:"var(--am-accent)",fontWeight:700,marginBottom:3}}>{p.brand}</div>
              <div style={{fontSize:12,fontWeight:700,color:"var(--am-text)",lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",marginBottom:6}}>{p.title}</div>
              <div style={{fontSize:13,fontWeight:900,color:"var(--am-accent)"}}>از {fa(p.priceMin)}<span style={{fontSize:10,fontWeight:400}}> ت</span></div>
              <div style={{fontSize:10,color:"var(--am-muted)",marginTop:2}}>{toFaDigits(String(p.storeCount))} فروشگاه</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  if(view.t==="me-alerts")return wrap(
    <div style={{padding:"14px 16px"}}>
      <div style={{fontSize:16,fontWeight:900,color:"var(--am-text)",marginBottom:4}}>هشدارهای قیمت</div>
      <div style={{fontSize:12,color:"var(--am-muted)",marginBottom:16}}>{toFaDigits(String(MOCK_ALERTS.filter(a=>alertStates[a.pid]).length))} هشدار فعال</div>
      {MOCK_ALERTS.map(a=>{
        const diff=a.current-a.target;
        const pct=Math.round(diff/a.target*100);
        const achieved=diff<=0;
        return(
          <div key={a.pid} style={{background:"var(--am-card)",border:`1.5px solid ${achieved?"rgba(16,185,129,0.3)":"var(--am-border)"}`,borderRadius:18,marginBottom:14,overflow:"hidden",boxShadow:"var(--am-shadow)"}}>
            <div style={{display:"flex",gap:14,padding:"14px 16px",alignItems:"flex-start"}}>
              <div style={{width:66,height:66,borderRadius:13,overflow:"hidden",flexShrink:0,background:"var(--am-bg)"}}>
                <img src={a.img} alt={a.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div style={{fontSize:13,fontWeight:800,color:"var(--am-text)",lineHeight:1.4,flex:1,marginLeft:8}}>{a.title}</div>
                  <button onClick={()=>setAlertStates(p=>({...p,[a.pid]:!p[a.pid]}))} style={{width:38,height:22,borderRadius:11,background:alertStates[a.pid]?"var(--am-accent)":"var(--am-bg)",border:`1.5px solid ${alertStates[a.pid]?"var(--am-accent)":"var(--am-border)"}`,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:alertStates[a.pid]?"flex-end":"flex-start",padding:"2px 3px",transition:"all .15s"}}>
                    <div style={{width:16,height:16,borderRadius:"50%",background:"var(--am-card)",boxShadow:"0 1px 3px rgba(0,0,0,0.15)"}}/>
                  </button>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
                  <span style={{color:"var(--am-muted)"}}>قیمت هدف</span>
                  <span style={{fontWeight:700,color:"var(--am-text)"}}>{fa(a.target)} ت</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
                  <span style={{color:"var(--am-muted)"}}>قیمت فعلی</span>
                  <span style={{fontWeight:800,color:achieved?"#10B981":"#F59E0B"}}>{fa(a.current)} ت</span>
                </div>
              </div>
            </div>
            <div style={{padding:"10px 16px",borderTop:"1px solid var(--am-border)",display:"flex",justifyContent:"space-between",alignItems:"center",background:achieved?"rgba(16,185,129,0.04)":"transparent"}}>
              {achieved
                ?<span style={{fontSize:12,fontWeight:800,color:"#10B981"}}>هشدار فعال شد — قیمت به هدف رسید</span>
                :<span style={{fontSize:11,color:"var(--am-muted)"}}>بالاتر از هدف: +{fa(diff)} ت (+{toFaDigits(String(pct))}٪)</span>
              }
              <span style={{fontSize:10,color:"var(--am-faint)"}}>{a.lastUpdate}</span>
            </div>
          </div>
        );
      })}
      <button style={{width:"100%",padding:"16px",background:"rgba(10,158,140,0.06)",border:"2px dashed rgba(10,158,140,0.3)",borderRadius:16,color:"var(--am-accent)",fontSize:14,fontFamily:"Vazirmatn",cursor:"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        افزودن هشدار قیمت جدید
      </button>
    </div>
  );

  if(view.t==="me-recent")return wrap(
    <div style={{padding:"14px 16px"}}>
      <div style={{fontSize:16,fontWeight:900,color:"var(--am-text)",marginBottom:16}}>اخیراً مشاهده‌شده</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {recentProds.map(p=>(
          <button key={p.id} onClick={()=>onProduct(p.id)} style={{background:"var(--am-card)",border:"1.5px solid var(--am-border)",borderRadius:16,overflow:"hidden",cursor:"pointer",padding:0,fontFamily:"Vazirmatn",textAlign:"right",boxShadow:"var(--am-shadow)"}}>
            <div style={{width:"100%",aspectRatio:"1",background:"var(--am-bg)",overflow:"hidden"}}>
              <img src={p.img} alt={p.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            </div>
            <div style={{padding:"10px 11px 12px"}}>
              <div style={{fontSize:10,color:"var(--am-accent)",fontWeight:700,marginBottom:3}}>{p.brand}</div>
              <div style={{fontSize:12,fontWeight:700,color:"var(--am-text)",lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",marginBottom:6}}>{p.title}</div>
              <div style={{fontSize:13,fontWeight:900,color:"var(--am-accent)"}}>از {fa(p.priceMin)}<span style={{fontSize:10,fontWeight:400}}> ت</span></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  if(view.t==="me-compare")return wrap(
    <div style={{padding:"14px 16px"}}>
      <div style={{fontSize:16,fontWeight:900,color:"var(--am-text)",marginBottom:4}}>مقایسه‌های من</div>
      <div style={{fontSize:12,color:"var(--am-muted)",marginBottom:16}}>مقایسه‌های ذخیره‌شده</div>
      <div style={{background:"var(--am-card)",border:"1.5px solid var(--am-border)",borderRadius:18,padding:"16px",boxShadow:"var(--am-shadow)"}}>
        <div style={{fontSize:13,fontWeight:700,color:"var(--am-muted)",marginBottom:14}}>مقایسه اخیر — {toFaDigits(String(compareProds.length))} محصول</div>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${compareProds.length},1fr)`,gap:12}}>
          {compareProds.map(p=>(
            <button key={p.id} onClick={()=>onProduct(p.id)} style={{background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:"Vazirmatn",textAlign:"right"}}>
              <div style={{width:"100%",aspectRatio:"1",borderRadius:11,overflow:"hidden",background:"var(--am-bg)"}}>
                <img src={p.img} alt={p.title} style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/>
              </div>
              <div style={{fontSize:11,fontWeight:700,color:"var(--am-text)",marginTop:8,lineHeight:1.4}}>{p.title.split("—")[0].slice(0,30)}</div>
              <div style={{fontSize:12,color:"var(--am-accent)",fontWeight:800,marginTop:3}}>از {fa(p.priceMin)}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if(view.t==="me-tickets")return <AnTicketsSubPage onBack={onBack}/>;
  if(view.t==="me-city")return <AnCitySubPage onBack={onBack}/>;

  if(view.t==="me-support")return wrap(
    <div style={{padding:"14px 16px"}}>
      <div style={{fontSize:16,fontWeight:900,color:"var(--am-text)",marginBottom:4}}>مرکز پشتیبانی</div>
      <div style={{fontSize:12,color:"var(--am-muted)",marginBottom:18}}>چطور می‌توانیم کمک کنیم؟</div>
      {/* Quick help options */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
        {[
          {label:"راهنمای خرید",desc:"چطور خرید کنم",icon:"M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zM11 11V7h2v4h4v2h-4v4h-2v-4H7v-2h4z",color:"#10B981"},
          {label:"راهنمای سفارش",desc:"پیگیری ارسال",icon:"M5 8h14M5 8a2 2 0 1 0 0-4h14a2 2 0 1 0 0 4M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8m-9 4h4",color:"#F59E0B"},
        ].map(item=>(
          <button key={item.label} style={{background:"var(--am-card)",border:"1.5px solid var(--am-border)",borderRadius:16,padding:"16px",cursor:"pointer",fontFamily:"Vazirmatn",textAlign:"right",boxShadow:"var(--am-shadow)"}}>
            <div style={{width:40,height:40,borderRadius:12,background:`${item.color}14`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="1.8" strokeLinecap="round"><path d={item.icon}/></svg>
            </div>
            <div style={{fontSize:13,fontWeight:800,color:"var(--am-text)"}}>{item.label}</div>
            <div style={{fontSize:11,color:"var(--am-muted)",marginTop:3}}>{item.desc}</div>
          </button>
        ))}
      </div>
      {/* FAQ */}
      <div style={{fontSize:13,fontWeight:800,color:"var(--am-text)",marginBottom:12}}>سوالات متداول</div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
        {[
          {q:"چطور سفارش بدم؟",a:"در هر صفحه محصول روی «مشاهده و خرید» کلیک کنید و به فروشگاه مورد نظر هدایت می‌شوید."},
          {q:"چطور هشدار قیمت بسازم؟",a:"در صفحه محصول روی «هشدار قیمت» کلیک کنید و قیمت هدف را تنظیم کنید."},
          {q:"آیا مرجوعی امکان‌پذیر است؟",a:"مرجوعی بر اساس قوانین فروشگاه مربوطه انجام می‌شود. آن مارکت یک پلتفرم مقایسه قیمت است."},
          {q:"چطور قیمت‌ها آپدیت می‌شوند؟",a:"قیمت‌ها به صورت منظم از فروشگاه‌های عضو دریافت می‌شوند و ممکن است با تأخیر همراه باشند."},
          {q:"چطور با پشتیبانی تماس بگیرم؟",a:"از طریق ثبت تیکت یا تماس با ۰۲۱-۱۲۳۴۵۶۷۸ (شنبه تا پنجشنبه ۹ تا ۱۸)."},
        ].map((item,i)=>(
          <div key={i} style={{background:"var(--am-card)",border:"1.5px solid var(--am-border)",borderRadius:14,padding:"14px 16px",boxShadow:"var(--am-shadow)"}}>
            <div style={{fontSize:13,fontWeight:700,color:"var(--am-text)",marginBottom:7}}>{item.q}</div>
            <div style={{fontSize:12,color:"var(--am-muted)",lineHeight:1.7}}>{item.a}</div>
          </div>
        ))}
      </div>
      {/* Contact box */}
      <div style={{background:"rgba(10,158,140,0.05)",border:"1.5px solid rgba(10,158,140,0.2)",borderRadius:18,padding:"18px"}}>
        <div style={{fontSize:14,fontWeight:800,color:"var(--am-accent)",marginBottom:6}}>تماس مستقیم با پشتیبانی</div>
        <div style={{fontSize:12,color:"var(--am-muted)",marginBottom:6,lineHeight:1.6}}>۰۲۱-۱۲۳۴۵۶۷۸ · شنبه تا پنجشنبه ۹ تا ۱۸</div>
        <div style={{fontSize:12,color:"var(--am-muted)",lineHeight:1.6}}>برای ثبت تیکت از بخش «تیکت‌های من» در منوی حساب استفاده کنید.</div>
      </div>
    </div>
  );

  if(view.t==="me-reg")return wrap(
    <div style={{paddingBottom:20}}>
      {/* Hero */}
      <div style={{background:"var(--am-card2)",padding:"28px 20px 24px",borderBottom:"1px solid var(--am-border)"}}>
        <div style={{width:56,height:56,borderRadius:16,background:"var(--am-accent)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16,boxShadow:"0 4px 16px rgba(10,158,140,0.3)"}}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <div style={{fontSize:22,fontWeight:900,color:"var(--am-text)",marginBottom:8}}>فروشگاه خود را در آن مارکت ثبت کنید</div>
        <div style={{fontSize:13,color:"var(--am-muted)",lineHeight:1.8}}>به شبکه‌ای از صدها فروشگاه معتبر بپیوندید و محصولات خود را به میلیون‌ها کاربر ارائه دهید.</div>
      </div>
      {/* Benefits */}
      <div style={{padding:"20px 16px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
          {[
            {icon:"M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z",label:"مدیریت محصولات",desc:"لیست، ویرایش، موجودی"},
            {icon:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",label:"سفارش و پرداخت",desc:"مدیریت آسان سفارشات"},
            {icon:"M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z",label:"گزارش فروش",desc:"تحلیل و آمار"},
            {icon:"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",label:"پشتیبانی فروشنده",desc:"تیم اختصاصی"},
          ].map(b=>(
            <div key={b.label} style={{background:"var(--am-card)",border:"1.5px solid var(--am-border)",borderRadius:16,padding:"16px",boxShadow:"var(--am-shadow)"}}>
              <div style={{width:36,height:36,borderRadius:10,background:"rgba(10,158,140,0.08)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--am-accent)" strokeWidth="1.8" strokeLinecap="round"><path d={b.icon}/></svg>
              </div>
              <div style={{fontSize:12,fontWeight:800,color:"var(--am-text)",marginBottom:3}}>{b.label}</div>
              <div style={{fontSize:10,color:"var(--am-muted)"}}>{b.desc}</div>
            </div>
          ))}
        </div>
        {/* Form */}
        <div style={{fontSize:15,fontWeight:900,color:"var(--am-text)",marginBottom:16}}>اطلاعات فروشگاه</div>
        {[{label:"نام فروشگاه",ph:"مثلاً: فروشگاه نوین الکترونیک"},{label:"شماره تماس",ph:"۰۲۱-XXXXXXXX"},{label:"ایمیل",ph:"info@mystore.com"},{label:"نوع کسب‌وکار",ph:"فروشگاه آنلاین / حضوری / هر دو"},{label:"آدرس",ph:"استان، شهر، خیابان..."},{label:"کد اقتصادی / شناسه ملی",ph:"۱۰..."}].map(f=>(
          <div key={f.label} style={{marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:700,color:"var(--am-muted)",marginBottom:7}}>{f.label}</div>
            <input placeholder={f.ph} style={{width:"100%",background:"var(--am-card)",border:"1.5px solid var(--am-border)",borderRadius:13,padding:"14px 16px",color:"var(--am-text)",fontSize:14,fontFamily:"Vazirmatn",outline:"none",direction:"rtl",boxSizing:"border-box"}}/>
          </div>
        ))}
        <button style={{width:"100%",padding:"17px",background:"var(--am-accent)",border:"none",borderRadius:16,color:"#FFFFFF",fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"Vazirmatn",marginTop:12,boxShadow:"0 4px 16px rgba(10,158,140,0.3)"}}>ادامه ثبت‌نام فروشگاه</button>
        <div style={{fontSize:11,color:"var(--am-muted)",textAlign:"center",marginTop:12,lineHeight:1.6}}>با ثبت‌نام، با قوانین و مقررات آن مارکت موافقت می‌کنید</div>
      </div>
    </div>
  );

  if(view.t==="me-panel")return wrap(
    <div style={{padding:"14px 16px"}}>
      {/* Store header */}
      <div style={{background:"var(--am-card2)",border:"1px solid var(--am-accent-border)",borderRadius:18,padding:"20px",marginBottom:18,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:100,height:100,borderRadius:"50%",background:"radial-gradient(circle,var(--am-accent-glow) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,position:"relative"}}>
          <div style={{width:50,height:50,borderRadius:14,background:"var(--am-accent-light)",border:"1px solid var(--am-accent-border)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--am-accent)" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          </div>
          <div>
            <div style={{fontSize:17,fontWeight:900,color:"var(--am-text)"}}>فروشگاه نمونه</div>
            <div style={{fontSize:12,color:"var(--am-muted)",marginTop:2}}>امتیاز: ۴.۶ ★</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,position:"relative"}}>
          {[["۲۳م","فروش"],["۷","سفارش"],["۴۳","محصول"]].map(([v,l])=>(
            <div key={l} style={{background:"var(--am-card)",border:"1px solid var(--am-border)",borderRadius:12,padding:"10px 6px",textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:900,color:"var(--am-accent)"}}>{v}</div>
              <div style={{fontSize:10,color:"var(--am-muted)",marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Modules */}
      <div style={{fontSize:13,fontWeight:700,color:"var(--am-muted)",marginBottom:12}}>ماژول‌های مدیریت</div>
      <div style={{background:"var(--am-card)",border:"1px solid var(--am-border)",borderRadius:16,overflow:"hidden",boxShadow:"var(--am-shadow)"}}>
        {[
          {label:"محصولات من",desc:"مدیریت موجودی و لیست",icon:"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",color:"#3B82F6"},
          {label:"سفارشات",desc:"مشاهده و پردازش سفارشات",icon:"M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2",color:"#10B981"},
          {label:"مدیریت قیمت‌ها",desc:"تنظیم و آپدیت قیمت",icon:"M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",color:"#F59E0B"},
          {label:"گزارش‌های فروش",desc:"تحلیل درآمد و سود",icon:"M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10",color:"#8B5CF6"},
          {label:"تیکت‌های فروش",desc:"پشتیبانی مشتریان",icon:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",color:"#EC4899"},
          {label:"اطلاعات فروشگاه",desc:"پروفایل و مشخصات",icon:"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",color:"#14B8A6"},
        ].map(item=>(
          <button key={item.label} className="am-me-list-btn">
            <div className="am-me-list-icon" style={{background:`${item.color}14`,color:item.color}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:"var(--am-text)"}}>{item.label}</div>
              <div style={{fontSize:11,color:"var(--am-muted)",marginTop:2}}>{item.desc}</div>
            </div>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--am-faint)" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        ))}
      </div>
    </div>
  );

  return wrap(<div style={{textAlign:"center",padding:"48px 24px",color:"var(--am-muted)",fontSize:14}}>محتوای این بخش در حال توسعه است.</div>);
}

function ComparisonPopup({ids,onClose,onMinimize,minimized,onProduct}:{ids:string[];onClose:()=>void;onMinimize:()=>void;minimized:boolean;onProduct:(pid:string)=>void}){
  const prods=ids.map(id=>ALL_MOCK_PRODS.find(p=>p.id===id)).filter(Boolean) as AnProduct[];
  if(ids.length===0)return null;
  const winner=prods.reduce((best,p)=>p.rating>best.rating?p:best,prods[0]);
  if(minimized){
    return(
      <div style={{position:"fixed",bottom:70,left:0,right:0,zIndex:200,padding:"0 16px"}}>
        <div style={{background:"var(--am-card)",border:"1.5px solid var(--am-accent)",borderRadius:18,padding:"14px 18px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 8px 32px rgba(10,158,140,0.2)"}}>
          <div style={{width:36,height:36,borderRadius:10,background:"rgba(10,158,140,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--am-accent)" strokeWidth="2" strokeLinecap="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:"var(--am-accent)",marginBottom:2}}>حالت مقایسه فعال</div>
            <div style={{fontSize:11,color:"var(--am-muted)"}}>{toFaDigits(String(ids.length))} محصول انتخابی</div>
          </div>
          <button onClick={onMinimize} style={{padding:"8px 16px",background:"var(--am-accent)",border:"none",borderRadius:10,color:"#FFFFFF",fontSize:12,fontFamily:"Vazirmatn",cursor:"pointer",fontWeight:700}}>مشاهده</button>
          <button onClick={onClose} style={{padding:"8px 12px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,color:"#ef4444",fontSize:12,fontFamily:"Vazirmatn",cursor:"pointer",fontWeight:700}}>بستن</button>
        </div>
      </div>
    );
  }
  return(
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",flexDirection:"column",background:"var(--am-bg)"}}>
      <div className="am-popup-header">
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:800,color:"var(--am-text)"}}>مقایسه محصولات</div>
          <div style={{fontSize:12,color:"var(--am-muted)",marginTop:2}}>ما فقط از لحاظ فنی برات مقایسه می‌کنیم.</div>
        </div>
        <button onClick={onMinimize} style={{padding:"8px 16px",background:"rgba(10,158,140,0.08)",border:"1.5px solid rgba(10,158,140,0.25)",borderRadius:11,color:"var(--am-accent)",fontSize:13,fontFamily:"Vazirmatn",cursor:"pointer",fontWeight:700}}>کوچک‌تر</button>
        <button onClick={onClose} style={{width:38,height:38,borderRadius:11,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#ef4444"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
        {winner&&(
          <div style={{background:"linear-gradient(135deg,rgba(10,158,140,0.07),rgba(10,158,140,0.03))",border:"1.5px solid rgba(10,158,140,0.2)",borderRadius:18,padding:"18px",marginBottom:18}}>
            <div style={{fontSize:12,fontWeight:800,color:"var(--am-accent)",marginBottom:10}}>پیشنهاد دستیار هوشمند</div>
            <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:12}}>
              <img src={winner.img} alt={winner.title} style={{width:60,height:60,borderRadius:12,objectFit:"cover",flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:800,color:"var(--am-text)",lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{winner.title}</div>
                <div style={{fontSize:13,color:"var(--am-accent)",fontWeight:700,marginTop:4}}>از {fa(winner.priceMin)} تومان</div>
              </div>
              <div style={{flexShrink:0,textAlign:"center",background:"var(--am-card)",borderRadius:12,padding:"8px 12px",border:"1px solid var(--am-border)"}}>
                <div style={{fontSize:10,color:"var(--am-muted)"}}>امتیاز</div>
                <div style={{fontSize:18,fontWeight:900,color:"var(--am-accent)"}}>{toFaDigits(String(winner.rating))}</div>
              </div>
            </div>
            <div style={{fontSize:12,color:"var(--am-muted)",lineHeight:1.8}}>از نظر امتیاز کاربران ({toFaDigits(String(winner.rating))} از ۵) و موجودی در {toFaDigits(String(winner.storeCount))} فروشگاه، این مدل پیشنهاد دستیار هوشمند است.</div>
          </div>
        )}
        <div style={{fontSize:13,fontWeight:700,color:"var(--am-muted)",marginBottom:14}}>{toFaDigits(String(prods.length))} محصول در مقایسه</div>
        <div style={{overflowX:"auto",marginBottom:18}}>
          <div style={{display:"flex",gap:12,minWidth:prods.length*176+"px"}}>
            {prods.map(p=>(
              <div key={p.id} style={{width:164,flexShrink:0,background:"var(--am-card)",border:`1.5px solid ${p.id===winner?.id?"rgba(10,158,140,0.4)":"var(--am-border)"}`,borderRadius:16,overflow:"hidden",boxShadow:"var(--am-shadow)"}}>
                {p.id===winner?.id&&<div style={{padding:"5px",background:"var(--am-accent)",textAlign:"center",fontSize:10,fontWeight:800,color:"#FFFFFF"}}>پیشنهاد دستیار</div>}
                <button onClick={()=>onProduct(p.id)} style={{display:"block",width:"100%",background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:"Vazirmatn",textAlign:"right"}}>
                  <img src={p.img} alt={p.title} style={{width:"100%",height:116,objectFit:"cover"}} loading="lazy"/>
                  <div style={{padding:"12px"}}>
                    <div style={{fontSize:12,fontWeight:700,color:"var(--am-text)",lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{p.title}</div>
                    <div style={{fontSize:14,fontWeight:800,color:"var(--am-accent)",marginTop:6}}>{fa(p.priceMin)}<span style={{fontSize:10,fontWeight:400}}> ت</span></div>
                  </div>
                </button>
                {[["امتیاز",`${toFaDigits(String(p.rating))} / ۵`],["فروشگاه‌ها",toFaDigits(String(p.storeCount))],["نظرات",toFaDigits(String(p.reviews))]].map(([k,v])=>(
                  <div key={k} style={{padding:"7px 12px",borderTop:"1px solid var(--am-border)",display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:11,color:"var(--am-muted)"}}>{k}</span>
                    <span style={{fontSize:11,fontWeight:700,color:"var(--am-text)"}}>{v}</span>
                  </div>
                ))}
                {Object.entries(p.specs).slice(0,3).map(([k,v])=>(
                  <div key={k} style={{padding:"6px 12px",borderTop:"1px solid var(--am-border)",display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:10,color:"var(--am-muted)",flexShrink:0,maxWidth:"45%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{k}</span>
                    <span style={{fontSize:10,fontWeight:600,color:"var(--am-text)",maxWidth:"50%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"left"}}>{v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:"14px 16px",background:"rgba(10,158,140,0.04)",borderRadius:14,border:"1px solid var(--am-border)"}}>
          <div style={{fontSize:11,color:"var(--am-muted)",lineHeight:1.8}}>این مقایسه بر اساس داده‌های فنی موجود است. اطلاعات ممکن است کامل یا به‌روز نباشد.</div>
        </div>
      </div>
    </div>
  );
}
function AnMarketMe({onPush}:{onPush:(v:AnView)=>void}){
  const MAIN_ITEMS:[string,AnView,string,string,string][]=[
    ["خریدهای من",{t:"me-orders"},"M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z","#3B82F6","یک سفارش در حال ارسال"],
    ["تیکت‌های من",{t:"me-tickets"},"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z","#8B5CF6","۱ تیکت باز"],
    ["علاقه‌مندی‌ها",{t:"me-fav"},"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z","#EC4899","۶ محصول ذخیره‌شده"],
    ["هشدارهای قیمت",{t:"me-alerts"},"M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0","#F59E0B","۳ هشدار فعال"],
    ["اخیراً مشاهده‌شده",{t:"me-recent"},"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z","#6366F1","۸ محصول مشاهده‌شده"],
    ["مقایسه‌های من",{t:"me-compare"},"M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z","#10B981","۱ مقایسه ذخیره‌شده"],
  ];
  const STORE_ITEMS:[string,AnView,string,string][]=[
    ["ثبت‌نام فروشگاه",{t:"me-reg"},"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z","#F97316"],
    ["پنل فروشگاه",{t:"me-panel"},"M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z","#14B8A6"],
  ];
  const SUPPORT_ITEMS:[string,AnView,string,string][]=[
    ["شهر من",{t:"me-city"},"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z","#84CC16"],
    ["پشتیبانی",{t:"me-support"},"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6 19.79 19.79 0 0 1 1.61 5 2 2 0 0 1 3.6 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 10.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17.92","#6B7280"],
  ];
  const listSection=(items:[string,AnView,string,string][])=>(
    <div style={{background:"var(--am-card)",border:"1px solid var(--am-border)",borderRadius:16,overflow:"hidden",boxShadow:"var(--am-shadow)"}}>
      {items.map(([label,view,iconPath,color])=>(
        <button key={label} onClick={()=>onPush(view)} className="am-me-list-btn">
          <div className="am-me-list-icon" style={{background:`${color}14`,color}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={iconPath}/></svg>
          </div>
          <div style={{flex:1,fontSize:15,fontWeight:700,color:"var(--am-text)"}}>{label}</div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--am-faint)" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      ))}
    </div>
  );
  const listSectionFull=(items:[string,AnView,string,string,string][])=>(
    <div style={{background:"var(--am-card)",border:"1px solid var(--am-border)",borderRadius:16,overflow:"hidden",boxShadow:"var(--am-shadow)"}}>
      {items.map(([label,view,iconPath,color,desc])=>(
        <button key={label} onClick={()=>onPush(view)} className="am-me-list-btn">
          <div className="am-me-list-icon" style={{background:`${color}14`,color}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={iconPath}/></svg>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:700,color:"var(--am-text)"}}>{label}</div>
            <div style={{fontSize:12,color:"var(--am-muted)",marginTop:2}}>{desc}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--am-faint)" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      ))}
    </div>
  );
  return(
    <div style={{paddingBottom:100}}>
      {/* Profile banner */}
      <div className="am-me-profile">
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
          <div style={{width:60,height:60,borderRadius:"50%",background:"var(--am-accent-light)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"2px solid var(--am-accent-border)"}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--am-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7"/></svg>
          </div>
          <div>
            <div style={{fontSize:18,fontWeight:900,color:"var(--am-text)"}}>کاربر آن مارکت</div>
            <div style={{fontSize:13,color:"var(--am-text2)",marginTop:3}}>خوش آمدید به مارکت من</div>
          </div>
        </div>
        {/* Quick stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {[["۳","خرید"],["۶","علاقه‌مندی"],["۳","هشدار قیمت"]].map(([v,l])=>(
            <div key={l} style={{background:"var(--am-card)",border:"1px solid var(--am-border)",borderRadius:12,padding:"12px 8px",textAlign:"center",boxShadow:"var(--am-shadow)"}}>
              <div style={{fontSize:22,fontWeight:900,color:"var(--am-accent)"}}>{toFaDigits(v)}</div>
              <div style={{fontSize:11,color:"var(--am-muted)",marginTop:3}}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Activity section */}
      <div className="am-section-header">فعالیت‌های من</div>
      <div style={{padding:"0 16px"}}>{listSectionFull(MAIN_ITEMS)}</div>
      {/* Store section */}
      <div className="am-section-header">فروشگاه</div>
      <div style={{padding:"0 16px"}}>{listSection(STORE_ITEMS)}</div>
      {/* Support section */}
      <div className="am-section-header">پشتیبانی و تنظیمات</div>
      <div style={{padding:"0 16px"}}>{listSection(SUPPORT_ITEMS)}</div>
    </div>
  );
}
function AnMarketScreen({onBack,user,lightTheme}:{onBack:()=>void;user:UserData;lightTheme?:boolean}){
  const [anStack,setAnStack]=useState<AnView[]>([{t:"home"}]);
  const [compare,setCompare]=useState<CompareState>({active:false,selectedIds:[],minimized:false});
  const [catSheet,setCatSheet]=useState<{level:{cid?:string;sid?:string}[];open:boolean}>({level:[],open:false});
  const cur=anStack[anStack.length-1];
  const anPush=(v:AnView)=>setAnStack(p=>[...p,v]);
  const anPop=()=>{if(anStack.length>1)setAnStack(p=>p.slice(0,-1));else onBack();};
  useBackHandler(()=>{
    if(catSheet.open){
      if(catSheet.level.length>1)setCatSheet(p=>({...p,level:p.level.slice(0,-1)}));
      else setCatSheet({level:[],open:false});
      return;
    }
    anPop();
  });
  const ct=cur.t as string;
  const activeTab=(catSheet.open||ct==="cat"||ct==="sub")?"cats":(ct==="me"||(ct!=="home"&&ct!=="assistant"&&ct!=="chat"&&ct!=="product"&&ct!=="cats"&&ct!=="cat"&&ct!=="sub"))?"me":(ct==="assistant"||ct==="chat")?"assistant":"home";
  const handleCompareToggle=(pid:string)=>{
    if(pid==="__mode__"){setCompare(prev=>({...prev,active:!prev.active,selectedIds:prev.active?[]:prev.selectedIds}));return;}
    setCompare(prev=>{const sel=prev.selectedIds.includes(pid)?prev.selectedIds.filter(id=>id!==pid):[...prev.selectedIds,pid];return {...prev,selectedIds:sel};});
  };
  const getTitle=()=>{
    if(cur.t==="chat")return "نتایج جستجو";
    if(cur.t==="product")return "جزئیات محصول";
    if(cur.t==="cat"){const c=AN_CATS.find(x=>x.id===(cur as {t:"cat";cid:string}).cid);return c?.title||"دسته‌بندی";}
    if(cur.t==="sub"){const v=cur as {t:"sub";cid:string;sid:string};const cat=AN_CATS.find(x=>x.id===v.cid);const sub=cat?.subcats.find(s=>s.id===v.sid);return sub?.title||"محصولات";}
    if(cur.t==="me-orders")return "خریدهای من";
    if(cur.t==="me-tickets")return "تیکت‌های من";
    if(cur.t==="me-fav")return "علاقه‌مندی‌ها";
    if(cur.t==="me-alerts")return "هشدارهای قیمت";
    if(cur.t==="me-recent")return "اخیراً مشاهده‌شده";
    if(cur.t==="me-compare")return "مقایسه‌های من";
    if(cur.t==="me-city")return "شهر من";
    if(cur.t==="me-support")return "پشتیبانی";
    if(cur.t==="me-reg")return "ثبت‌نام فروشگاه";
    if(cur.t==="me-panel")return "پنل فروشگاه";
    return "آن مارکت";
  };
  const isInner=anStack.length>1;
  void user;

  const AM_NAV_TABS=[
    {id:"home" as const,label:"خانه",icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>},
    {id:"assistant" as const,label:"دستیار هوشمند",icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/></svg>},
    {id:"cats" as const,label:"دسته‌بندی‌ها",icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>},
    {id:"me" as const,label:"آن مارکت من",icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>},
  ] as const;

  const BackToPardazBtn=()=>(
    <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:5,background:"var(--am-card)",border:"1px solid var(--am-border)",borderRadius:20,padding:"5px 12px 5px 10px",cursor:"pointer",fontFamily:"Vazirmatn",fontSize:11,fontWeight:700,color:"var(--am-text2)",boxShadow:"var(--am-shadow)",flexShrink:0,whiteSpace:"nowrap" as const}}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--am-muted)" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      بازگشت به آن‌پرداز
    </button>
  );

  return(
    <div className={`an-market-root${lightTheme?"":" dark-theme"}`} style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",position:"relative"}}>

      {/* Back button strip — for tabs without their own header (cats / me) */}
      {!isInner&&(cur.t==="cats"||cur.t==="me")&&(
        <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",padding:"12px 16px 8px",flexShrink:0,borderBottom:"1px solid var(--am-border)"}}>
          <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:5,background:"var(--am-card)",border:"1px solid var(--am-border)",borderRadius:20,padding:"5px 12px 5px 10px",cursor:"pointer",fontFamily:"Vazirmatn",fontSize:11,fontWeight:700,color:"var(--am-text2)",boxShadow:"var(--am-shadow)",whiteSpace:"nowrap" as const}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--am-muted)" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            بازگشت به آن‌پرداز
          </button>
        </div>
      )}

      {/* Header — inner page title only */}
      {isInner&&(
        <div className="am-header" style={{flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",padding:"14px 16px 10px",gap:12}}>
            <button onClick={anPop} style={{width:38,height:38,borderRadius:12,background:"var(--am-bg)",border:"1.5px solid var(--am-border)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--am-text)",flexShrink:0}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <div style={{flex:1,fontSize:15,fontWeight:800,color:"var(--am-text)",textAlign:"center"}}>{getTitle()}</div>
            <BackToPardazBtn/>
          </div>
        </div>
      )}
      {compare.active&&compare.selectedIds.length>=2&&(
        <div style={{padding:"10px 16px",borderBottom:"1px solid var(--am-border)",display:"flex",alignItems:"center",gap:10,background:"rgba(10,158,140,0.05)",flexShrink:0}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--am-accent)" strokeWidth="2" strokeLinecap="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg>
          <span style={{fontSize:12,color:"var(--am-accent)",fontWeight:700,flex:1}}>{toFaDigits(String(compare.selectedIds.length))} محصول انتخابی برای مقایسه</span>
          <button onClick={()=>setCompare(p=>({...p,minimized:false}))} style={{padding:"7px 16px",background:"var(--am-accent)",border:"none",borderRadius:10,color:"#FFFFFF",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"Vazirmatn"}}>مشاهده مقایسه</button>
        </div>
      )}

      {/* Content area */}
      <div style={{flex:1,overflowY:cur.t==="assistant"?"hidden":"auto",overflowX:"hidden",display:cur.t==="assistant"?"flex":"block",flexDirection:cur.t==="assistant"?"column":"row",minHeight:0}}>
        {cur.t==="home"&&<AnMarketHome onProduct={pid=>anPush({t:"product",pid})} onCat={cid=>{setCatSheet({level:[{cid}],open:true});}} onGoCats={()=>setCatSheet({level:[{}],open:true})} onSearch={q=>anPush({t:"chat",q})} compareMode={compare.active} compareSelected={compare.selectedIds} onCompareToggle={handleCompareToggle} onBack={!isInner?onBack:undefined}/>}
        {cur.t==="assistant"&&<AnAssistantChat onProduct={pid=>anPush({t:"product",pid})} compareMode={compare.active} compareSelected={compare.selectedIds} onCompareToggle={handleCompareToggle} onBack={!isInner?onBack:undefined}/>}
        {cur.t==="chat"&&<AnChatPage q={(cur as {t:"chat";q:string}).q} onProduct={pid=>{if(pid==="__back__"){anPop();return;}anPush({t:"product",pid});}} compareMode={compare.active} compareSelected={compare.selectedIds} onCompareToggle={handleCompareToggle}/>}
        {cur.t==="product"&&<AnProductDetail pid={(cur as {t:"product";pid:string}).pid} onProduct={pid=>anPush({t:"product",pid})} onSearch={q=>anPush({t:"chat",q})} onBack={anPop}/>}
        {cur.t==="cats"&&<AnCatPage onCat={cid=>anPush({t:"cat",cid})} onSub={(cid,sid)=>anPush({t:"sub",cid,sid})} onSearch={q=>anPush({t:"chat",q})}/>}
        {cur.t==="cat"&&<AnCatDetailPage cid={(cur as {t:"cat";cid:string}).cid} onSub={(cid,sid)=>anPush({t:"sub",cid,sid})} onBack={anPop}/>}
        {cur.t==="sub"&&<AnSubDetailPage cid={(cur as {t:"sub";cid:string;sid:string}).cid} sid={(cur as {t:"sub";cid:string;sid:string}).sid} onProduct={pid=>anPush({t:"product",pid})} onSearch={q=>anPush({t:"chat",q})} compareMode={compare.active} compareSelected={compare.selectedIds} onCompareToggle={handleCompareToggle}/>}
        {cur.t==="me"&&<AnMarketMe onPush={anPush}/>}
        {(cur.t==="me-orders"||cur.t==="me-tickets"||cur.t==="me-fav"||cur.t==="me-alerts"||cur.t==="me-recent"||cur.t==="me-compare"||cur.t==="me-city"||cur.t==="me-support"||cur.t==="me-reg"||cur.t==="me-panel")&&<AnMeSubPage view={cur} onProduct={pid=>anPush({t:"product",pid})} onBack={anPop}/>}
      </div>

      {compare.active&&compare.selectedIds.length>=2&&(
        <ComparisonPopup ids={compare.selectedIds} minimized={compare.minimized} onMinimize={()=>setCompare(p=>({...p,minimized:!p.minimized}))} onClose={()=>setCompare({active:false,selectedIds:[],minimized:false})} onProduct={pid=>anPush({t:"product",pid})}/>
      )}

      {/* Category Bottom Sheet */}
      {catSheet.open&&(
        <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={()=>setCatSheet({level:[],open:false})}>
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)"}}/>
          <div style={{position:"relative",background:"var(--am-bg,#fff)",borderRadius:"20px 20px 0 0",height:"75%",display:"flex",flexDirection:"column",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
            {/* Drag handle */}
            <div style={{display:"flex",justifyContent:"center",paddingTop:10,paddingBottom:6,flexShrink:0}}>
              <div style={{width:40,height:4,borderRadius:2,background:"var(--am-border,#e0e0e0)"}}/>
            </div>
            {/* Sheet header */}
            <div style={{display:"flex",alignItems:"center",padding:"8px 16px 12px",gap:10,borderBottom:"1px solid var(--am-border)",flexShrink:0}}>
              {catSheet.level.length>1&&(
                <button onClick={()=>setCatSheet(p=>({...p,level:p.level.slice(0,-1)}))} style={{width:36,height:36,borderRadius:10,background:"var(--am-bg)",border:"1.5px solid var(--am-border)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--am-text)",flexShrink:0}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
              )}
              <div style={{fontSize:15,fontWeight:800,color:"var(--am-text)",flex:1}}>
                {catSheet.level.length>1&&catSheet.level[catSheet.level.length-1].cid
                  ?AN_CATS.find(c=>c.id===catSheet.level[catSheet.level.length-1].cid)?.title||"دسته‌بندی"
                  :"دسته‌بندی‌ها"}
              </div>
              <button onClick={()=>setCatSheet({level:[],open:false})} style={{width:36,height:36,borderRadius:10,background:"var(--am-bg)",border:"1.5px solid var(--am-border)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--am-muted)"}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {/* Search + list */}
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",padding:"10px 16px 0"}}>
              <CatSheetSearch level={catSheet.level} onNavigate={(cid,sid)=>{
                if(sid){setCatSheet({level:[],open:false});anPush({t:"sub",cid,sid});}
                else{setCatSheet(p=>({...p,level:[...p.level,{cid}]}));}
              }}/>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <nav className="am-footer-nav">
        {AM_NAV_TABS.map(tab=>(
          <button key={tab.id} onClick={()=>{
            if(tab.id==="cats"){setCatSheet({level:[{}],open:true});return;}
            setAnStack([{t:tab.id} as AnView]);
          }} className={`am-footer-tab${activeTab===tab.id?" active":""}`}>
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

const CAT_ICONS:Record<string,React.ReactElement>={
  mobile:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5"/></svg>,
  laptop:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="13" rx="2"/><path d="M2 20h20"/></svg>,
  hypermarket:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  appliance:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/><path d="M12 9V5M12 19v-4M5 12H9M15 12h4"/></svg>,
  fashion:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.13z"/></svg>,
  beauty:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  av:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>,
  car:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h10l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/></svg>,
  health:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>,
  culture:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  sport:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24"/></svg>,
  toy:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 7V5a4 4 0 0 0-8 0v2"/></svg>,
  kids:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 21v-2a6 6 0 0 1 12 0v2"/></svg>,
  food:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
};
function getCatIcon(id:string):React.ReactElement{return CAT_ICONS[id]||<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>;}

function CatSheetSearch({level,onNavigate}:{level:{cid?:string;sid?:string}[];onNavigate:(cid:string,sid?:string)=>void}){
  const [q,setQ]=useState("");
  const curLevel=level[level.length-1]||{};
  const curCat=curLevel.cid?AN_CATS.find(c=>c.id===curLevel.cid):null;
  const isRoot=!curLevel.cid;
  const filtered=isRoot
    ?(q.trim()?AN_CATS.filter(c=>c.title.includes(q.trim())||c.subcats.some(s=>s.title.includes(q.trim()))):AN_CATS)
    :(curCat?curCat.subcats.filter(s=>!q.trim()||s.title.includes(q.trim())):[]);
  return(
    <>
      <div style={{display:"flex",alignItems:"center",background:"var(--am-card2)",borderRadius:12,padding:"9px 14px",gap:8,border:"1.5px solid var(--am-border)"}}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--am-muted)" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder={isRoot?"جستجو در دسته‌بندی‌ها...":"جستجو در زیردسته‌ها..."} style={{flex:1,border:"none",background:"transparent",fontFamily:"Vazirmatn",fontSize:13,color:"var(--am-text)",outline:"none"}}/>
        {q&&<button onClick={()=>setQ("")} style={{border:"none",background:"none",cursor:"pointer",color:"#aaa",padding:0,display:"flex"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>}
      </div>
      <div style={{overflowY:"auto",flex:1,padding:"8px 0 80px"}}>
        <div style={{display:"flex",flexDirection:"column",gap:2}}>
          {isRoot?filtered.map(cat=>(
            <button key={cat.id} onClick={()=>onNavigate(cat.id)}
              style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:12,background:"transparent",border:"none",cursor:"pointer",fontFamily:"Vazirmatn",textAlign:"right",width:"100%",color:"var(--am-text)",fontSize:14,fontWeight:600,transition:"background .15s"}}>
              <span style={{width:40,height:40,borderRadius:12,background:"var(--am-accent-light)",border:"1.5px solid var(--am-accent-border)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--am-accent)",flexShrink:0}}>
                {getCatIcon(cat.id)}
              </span>
              <span style={{flex:1}}>{cat.title}</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--am-muted)" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          )):filtered.map(sub=>(
            <button key={sub.id} onClick={()=>onNavigate(curLevel.cid!,sub.id)}
              style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:12,background:"transparent",border:"none",cursor:"pointer",fontFamily:"Vazirmatn",textAlign:"right",width:"100%",color:"var(--am-text)",fontSize:14,fontWeight:600}}>
              <span style={{flex:1}}>{sub.title}</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--am-muted)" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}


// ─── All Services Screen ───────────────────────────────────────────────────────
function AllServicesScreen({onBack,onServiceTap,homeServices,setHomeServices,homePlatforms,setHomePlatforms,showCashback,setShowCashback}:{onBack:()=>void;onServiceTap:(id:string,label:string)=>void;homeServices:string[];setHomeServices:(v:string[])=>void;homePlatforms:string[];setHomePlatforms:(v:string[])=>void;showCashback:boolean;setShowCashback:(v:boolean)=>void}){
  const notOnHome=SERVICES.filter(s=>!homeServices.includes(s.id));
  const platformsNotOnHome=PLATFORMS.filter(p=>!homePlatforms.includes(p.id));
  const addSvcToHome=(id:string)=>setHomeServices([...homeServices,id]);
  const addPlatToHome=(id:string)=>setHomePlatforms([...homePlatforms,id]);
  const plusBtn=(onClick:(e:React.MouseEvent)=>void)=>(
    <span role="button" onPointerDown={e=>e.stopPropagation()} onClick={onClick}
      style={{position:"absolute",top:-12,left:-12,width:44,height:44,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:2,userSelect:"none"}}>
      <span style={{width:30,height:30,borderRadius:"50%",background:"#00D6B0",color:"#031522",fontSize:20,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 10px rgba(0,214,176,0.5)",lineHeight:1}}>+</span>
    </span>
  );
  useBackHandler(onBack);
  return <div className="anp-full-page" dir="rtl">
    <div className="anp-page-header">
      <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">همه خدمات</h2>
      <div style={{width:36}}/>
    </div>
    <div className="anp-page-body">
      {/* — Services section — */}
      <div style={{fontSize:13,fontWeight:700,color:"var(--text-muted)",marginBottom:12}}>خدمات</div>
      {notOnHome.length>0||!showCashback?(
        <div className="services-grid" style={{marginBottom:24}}>
          {notOnHome.map(s=>{
            const ill=ServiceIllustration({id:s.id,color:s.color});
            return <div key={s.id} style={{position:"relative"}}>
              <button className="service-btn" style={{width:"100%",opacity:s.action==="soon"?0.8:1}} onClick={()=>onServiceTap(s.action,s.label)}>
                <div className="service-icon" style={{background:s.bg,color:s.color}}>{ill||<Icon name={s.icon} size={22}/>}</div>
                <span className="service-label">{s.label}</span>
              </button>
              {s.action==="soon"&&<span style={{position:"absolute",bottom:-5,left:-4,background:"rgba(124,58,237,0.9)",color:"#fff",fontSize:8,fontWeight:800,fontFamily:"Vazirmatn",padding:"1px 6px",borderRadius:8,pointerEvents:"none",whiteSpace:"nowrap",letterSpacing:0.2,boxShadow:"0 1px 6px rgba(124,58,237,0.45)",lineHeight:"16px",zIndex:2}}>بزودی</span>}
              {s.action!=="soon"&&plusBtn(e=>{e.stopPropagation();addSvcToHome(s.id);})}
            </div>;
          })}
          {/* Cashback restore item */}
          {!showCashback&&(
            <div style={{position:"relative"}}>
              <button className="service-btn" style={{width:"100%"}} onClick={()=>{setShowCashback(true);}}>
                <div className="service-icon" style={{background:"rgba(0,214,176,0.12)",color:"#00D6B0"}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00D6B0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
                </div>
                <span className="service-label">بازگشت هزینه</span>
              </button>
              {plusBtn(e=>{e.stopPropagation();setShowCashback(true);})}
            </div>
          )}
        </div>
      ):(
        <div style={{background:"var(--card-bg)",border:"1px solid var(--border-color)",borderRadius:14,padding:"16px",textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:13,color:"var(--text-muted)"}}>همه خدمات در صفحه اصلی هستند</div>
        </div>
      )}
      {/* — Platforms not on Home — (no section title per spec) */}
      {platformsNotOnHome.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {platformsNotOnHome.map(p=>(
            <div key={p.id} style={{position:"relative"}}>
              <button onClick={()=>onServiceTap(p.action,p.label)} style={{width:"100%",background:p.bg,border:`1.5px solid ${p.border}`,borderRadius:14,padding:"14px 10px",cursor:"pointer",fontFamily:"Vazirmatn",display:"flex",flexDirection:"column",alignItems:"center",gap:4,boxSizing:"border-box",textAlign:"center"}}>
                <div style={{fontSize:13,fontWeight:800,color:p.color}}>{p.label}</div>
                <div style={{fontSize:11,color:"var(--text-muted)",lineHeight:1.4}}>{p.desc}</div>
              </button>
              {plusBtn(e=>{e.stopPropagation();addPlatToHome(p.id);})}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>;
}

// ─── Camera Card Scan Modal ───────────────────────────────────────────────────
function CameraCardScanModal({onClose,onDetect}:{onClose:()=>void;onDetect:(num:string)=>void}){
  const videoRef=useRef<HTMLVideoElement>(null);
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const streamRef=useRef<MediaStream|null>(null);
  const [phase,setPhase]=useState<"camera"|"captured"|"result">("camera");
  const [loading,setLoading]=useState(false);
  const [detectedNum,setDetectedNum]=useState("");
  const [capturedImg,setCapturedImg]=useState("");
  const [camErr,setCamErr]=useState("");

  useEffect(()=>{
    (async()=>{
      try{
        const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:false});
        streamRef.current=s;
        if(videoRef.current){videoRef.current.srcObject=s;videoRef.current.play();}
      }catch{setCamErr("دسترسی به دوربین امکان‌پذیر نیست. لطفاً مجوز دوربین را فعال کنید.");}
    })();
    return()=>{streamRef.current?.getTracks().forEach(t=>t.stop());};
  },[]);

  const capture=()=>{
    const v=videoRef.current;const c=canvasRef.current;
    if(!v||!c)return;
    c.width=v.videoWidth||320;c.height=v.videoHeight||240;
    const ctx=c.getContext("2d");if(!ctx)return;
    ctx.drawImage(v,0,0);
    setCapturedImg(c.toDataURL("image/jpeg",0.8));
    streamRef.current?.getTracks().forEach(t=>t.stop());
    setPhase("captured");setLoading(true);
    setTimeout(()=>{setLoading(false);setPhase("result");setDetectedNum("");},1500);
  };

  useBackHandler(onClose);
  return createPortal(<div style={{position:"fixed",inset:0,background:"#000",zIndex:1000,display:"flex",flexDirection:"column",fontFamily:"Vazirmatn",direction:"rtl"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px",background:"rgba(0,0,0,0.8)",color:"#fff"}}>
      <h2 style={{margin:0,fontSize:16,fontWeight:700}}>اسکن کارت</h2>
      <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#fff",padding:4}}><Icon name="x" size={22}/></button>
    </div>
    {camErr?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{textAlign:"center",color:"#fff"}}>
        <div style={{fontSize:14,lineHeight:1.8,marginBottom:20}}>{camErr}</div>
        <button onClick={onClose} className="primary-button">بستن</button>
      </div>
    </div>:<>
      <div style={{flex:1,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
        {phase==="camera"&&<video ref={videoRef} style={{width:"100%",height:"100%",objectFit:"cover"}} playsInline muted autoPlay/>}
        {(phase==="captured"||phase==="result")&&capturedImg&&<img src={capturedImg} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>}
        {/* Viewfinder */}
        {phase==="camera"&&<div style={{position:"absolute",width:"80%",maxWidth:340,height:120,border:"2px solid rgba(0,214,176,0.8)",borderRadius:12,boxShadow:"0 0 0 1000px rgba(0,0,0,0.4)"}}>
          <div style={{position:"absolute",top:-1,right:-1,width:20,height:20,borderTop:"3px solid #00D6B0",borderRight:"3px solid #00D6B0",borderRadius:"0 4px 0 0"}}/>
          <div style={{position:"absolute",top:-1,left:-1,width:20,height:20,borderTop:"3px solid #00D6B0",borderLeft:"3px solid #00D6B0",borderRadius:"4px 0 0 0"}}/>
          <div style={{position:"absolute",bottom:-1,right:-1,width:20,height:20,borderBottom:"3px solid #00D6B0",borderRight:"3px solid #00D6B0",borderRadius:"0 0 4px 0"}}/>
          <div style={{position:"absolute",bottom:-1,left:-1,width:20,height:20,borderBottom:"3px solid #00D6B0",borderLeft:"3px solid #00D6B0",borderRadius:"0 0 0 4px"}}/>
        </div>}
        {loading&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{textAlign:"center",color:"#fff"}}>
            <div style={{width:40,height:40,border:"3px solid rgba(0,214,176,0.3)",borderTop:"3px solid #00D6B0",borderRadius:"50%",margin:"0 auto 12px",animation:"spin 1s linear infinite"}}/>
            <div style={{fontSize:13}}>در حال تحلیل...</div>
          </div>
        </div>}
      </div>
      <canvas ref={canvasRef} style={{display:"none"}}/>
      <div style={{padding:"20px 16px",background:"rgba(0,0,0,0.9)"}}>
        {phase==="camera"&&<>
          <p style={{color:"rgba(255,255,255,0.6)",fontSize:12,textAlign:"center",marginBottom:16,lineHeight:1.7}}>از شماره کارت عکس بگیرید{"\n"}ما شماره کارت را برایتان وارد می‌کنیم.</p>
          <button onClick={capture} style={{width:"100%",background:"var(--accent)",border:"none",borderRadius:14,padding:"15px",color:"#031522",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"Vazirmatn"}}>گرفتن عکس</button>
        </>}
        {phase==="result"&&<>
          <p style={{color:"rgba(255,255,255,0.7)",fontSize:12,textAlign:"center",marginBottom:12}}>شماره کارت تشخیص داده نشد — لطفاً به صورت دستی وارد کنید</p>
          <input dir="ltr" value={detectedNum} onChange={e=>setDetectedNum(toLatinDigits(e.target.value).replace(/\D/g,"").slice(0,16))} placeholder="شماره کارت ۱۶ رقمی" inputMode="numeric" maxLength={16} style={{width:"100%",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:10,padding:"12px",color:"#fff",fontSize:16,fontFamily:"Vazirmatn",textAlign:"center",letterSpacing:"0.15em",outline:"none",boxSizing:"border-box",marginBottom:12}}/>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{streamRef.current=null;setPhase("camera");setCapturedImg("");setDetectedNum("");(async()=>{try{const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:false});streamRef.current=s;if(videoRef.current){videoRef.current.srcObject=s;videoRef.current.play();}}catch{}})();}} className="outline-button" style={{flex:1,color:"#fff",borderColor:"rgba(255,255,255,0.3)"}}>دوباره</button>
            <button onClick={()=>{if(detectedNum.length===16)onDetect(detectedNum);else if(detectedNum.length>0)onDetect(detectedNum);}} disabled={!detectedNum} className="primary-button" style={{flex:1,opacity:detectedNum?1:0.4}}>تأیید</button>
          </div>
        </>}
      </div>
    </>}
  </div>,document.body);
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [appState,setAppState]=useState<AppState>("splash");
  const [pendingPhone,setPendingPhone]=useState("");const [pendingCode,setPendingCode]=useState("");const [pendingDevCode,setPendingDevCode]=useState<string|undefined>();
  const [user,setUser]=useState<UserData|null>(null);
  const [tab,setTab]=useState<MainTab>("home");
  const [subPage,setSubPage]=useState<SubPage>(null);
  const [rate,setRate]=useState(0);const [rateLoading,setRateLoading]=useState(true);
  const [showBal,setShowBal]=useState(true);
  const [assetModal,setAssetModal]=useState(false);
  const [transactions,setTransactions]=useState<TxRecord[]>([]);
  const [selectedTx,setSelectedTx]=useState<TxRecord|null>(null);
  const [menuOpen,setMenuOpen]=useState(false);
  const [showGlobalHelp,setShowGlobalHelp]=useState(false);
  const [showExitDialog,setShowExitDialog]=useState(false);
  const [pendingTour,setPendingTour]=useState(false);
  const [homeSkeleton,setHomeSkeleton]=useState(true);
  const [chargePayData,setChargePayData]=useState<{phone:string;operator:Operator|null;amount:string;type:"charge"|"internet"}|null>(null);
  const [chargePayOrigin,setChargePayOrigin]=useState<SubPage>("charge");
  const [charityPayData,setCharityPayData]=useState<{orgId:string;orgName:string;amount:string}|null>(null);
  const [billsPayData,setBillsPayData]=useState<{billType:string;billName:string;billIcon:string;amount:string;inputVal:string;ownerName:string}|null>(null);
  const [violationsPayData,setViolationsPayData]=useState<{plate:string;amount:string;ownerName:string}|null>(null);
  const [serviceName,setServiceName]=useState("");
  const [lightTheme,setLightThemeState]=useState(()=>localStorage.getItem("anp_theme")==="light");
  const [insuranceTab,setInsuranceTab]=useState<"third-party"|"body"|"motorcycle">("third-party");
  const [systemNotice,setSystemNotice]=useState("");
  const [homeSlide,setHomeSlide]=useState(0);
  const [homeSliderPaused,setHomeSliderPaused]=useState(false);
  const internetStateRef=useRef<{phone:string;step:InternetStep}|null>(null);
  const [homeEditMode,setHomeEditMode]=useState(false);
  const [homeServices,setHomeServices]=useState<string[]>(()=>DEFAULT_HOME_SERVICES);
  const [homePlatforms,setHomePlatforms]=useState<string[]>(()=>DEFAULT_HOME_PLATFORMS);
  const [showCashback,setShowCashback]=useState(true);
  const longPressTimerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
  const longPressActivatedRef=useRef(false);
  const touchStartPosRef=useRef<{x:number;y:number}|null>(null);
  const hasScrolledRef=useRef(false);
  const dragSrcRef=useRef<string|null>(null);
  const touchDragIdRef=useRef<string|null>(null);
  const [dragOverId,setDragOverId]=useState<string|null>(null);
  const svcGridRef=useRef<HTMLDivElement>(null);
  const prevRectsRef=useRef<Record<string,DOMRect>>({});
  const [confettiItems,setConfettiItems]=useState<{id:number;x:number;y:number;color:string;cx:number;cy:number}[]>([]);

  const setLightTheme=(v:boolean)=>{setLightThemeState(v);localStorage.setItem("anp_theme",v?"light":"dark")};
  useEffect(()=>{document.body.classList.toggle("light-theme",lightTheme)},[lightTheme]);

  // Long-press handlers for service buttons — 600ms, touch-slop aware
  const startLongPress=(id:string,e:React.TouchEvent|React.MouseEvent)=>{
    longPressActivatedRef.current=false;
    hasScrolledRef.current=false;
    const pos='touches' in e
      ?{x:e.touches[0].clientX,y:e.touches[0].clientY}
      :{x:(e as React.MouseEvent).clientX,y:(e as React.MouseEvent).clientY};
    touchStartPosRef.current=pos;
    if(homeEditMode){
      // already in edit mode: start a touch drag immediately
      touchDragIdRef.current=id;
      dragSrcRef.current=id;
      e.preventDefault();
    } else {
      longPressTimerRef.current=setTimeout(()=>{longPressActivatedRef.current=true;touchDragIdRef.current=id;dragSrcRef.current=id;setHomeEditMode(true);},600);
    }
  };
  const moveLongPress=(e:React.TouchEvent)=>{
    if(!touchStartPosRef.current)return;
    const touch=e.touches[0];
    const dx=touch.clientX-touchStartPosRef.current.x;
    const dy=touch.clientY-touchStartPosRef.current.y;
    if(homeEditMode&&touchDragIdRef.current){
      // handle touch drag: find element under touch point
      e.preventDefault();
      const el=document.elementFromPoint(touch.clientX,touch.clientY);
      const btn=el?.closest("[data-sid]") as HTMLElement|null;
      const overId=btn?.dataset.sid||null;
      if(overId&&overId!==touchDragIdRef.current){setDragOverId(overId);}
      return;
    }
    if(Math.sqrt(dx*dx+dy*dy)>10){
      hasScrolledRef.current=true;
      if(longPressTimerRef.current){clearTimeout(longPressTimerRef.current);longPressTimerRef.current=null;longPressActivatedRef.current=false;}
    }
  };
  const endPress=(e:React.MouseEvent|React.TouchEvent,svc:{id:string;action:string;label:string})=>{
    if(longPressTimerRef.current){clearTimeout(longPressTimerRef.current);longPressTimerRef.current=null;}
    if(homeEditMode&&touchDragIdRef.current&&dragOverId){
      // commit touch-based reorder
      const src=touchDragIdRef.current;
      const over=dragOverId;
      setHomeServices(prev=>{
        const next=[...prev];
        const si=next.indexOf(src);const oi=next.indexOf(over);
        if(si>=0&&oi>=0){next.splice(si,1);next.splice(oi,0,src);}
        if(user)localStorage.setItem(`anp_home_services_${user.uid}`,JSON.stringify(next));
        return next;
      });
    } else if(!longPressActivatedRef.current&&!hasScrolledRef.current&&!homeEditMode&&svc.action!=="disabled"){
      handleService(svc.action,svc.label);
    }
    touchDragIdRef.current=null;
    dragSrcRef.current=null;
    setDragOverId(null);
    longPressActivatedRef.current=false;
    hasScrolledRef.current=false;
    touchStartPosRef.current=null;
  };
  const cancelLongPress=()=>{
    if(longPressTimerRef.current){clearTimeout(longPressTimerRef.current);longPressTimerRef.current=null;}
    touchDragIdRef.current=null;
    longPressActivatedRef.current=false;
    hasScrolledRef.current=false;
    touchStartPosRef.current=null;
  };

  function playPopSound(){
    try{
      const ctx=new AudioContext();
      const osc=ctx.createOscillator();
      const gain=ctx.createGain();
      osc.connect(gain);gain.connect(ctx.destination);
      osc.type="sine";
      osc.frequency.setValueAtTime(600,ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900,ctx.currentTime+0.08);
      gain.gain.setValueAtTime(0.3,ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.25);
      osc.start();osc.stop(ctx.currentTime+0.25);
    }catch{}
  }

  const removeService=(id:string,e?:React.MouseEvent)=>{
    const next=homeServices.filter(sid=>sid!==id);
    setHomeServices(next);if(user)localStorage.setItem(`anp_home_services_${user.uid}`,JSON.stringify(next));
    playPopSound();
    const colors=["#00D6B0","#4a9eff","#f472b6","#fb923c","#a78bfa","#34d399","#f5c23d","#e85c5c"];
    const cx=e?e.clientX:window.innerWidth/2;
    const cy=e?e.clientY:window.innerHeight/2;
    const particles=Array.from({length:12},(_,i)=>({
      id:Date.now()+i,x:cx,y:cy,
      color:colors[i%colors.length],
      cx:(Math.random()-0.5)*120,
      cy:(Math.random()-1.5)*100,
    }));
    setConfettiItems(particles);
    setTimeout(()=>setConfettiItems([]),900);
  };

  // Preview services order during drag
  const previewServices=useMemo(()=>{
    const src=dragSrcRef.current;
    if(!src||!dragOverId||src===dragOverId)return homeServices;
    const si=homeServices.indexOf(src);const di=homeServices.indexOf(dragOverId);
    if(si<0||di<0)return homeServices;
    const next=[...homeServices];const[m]=next.splice(si,1);next.splice(di,0,m);
    return next;
  },[homeServices,dragOverId]);

  // FLIP animation when preview order changes
  useLayoutEffect(()=>{
    const grid=svcGridRef.current;if(!grid)return;
    const newRects:Record<string,DOMRect>={};
    grid.querySelectorAll<HTMLElement>('[data-sid]').forEach(el=>{
      const id=el.dataset.sid!;
      newRects[id]=el.getBoundingClientRect();
      const prev=prevRectsRef.current[id];
      if(prev){
        const dx=prev.left-newRects[id].left,dy=prev.top-newRects[id].top;
        if(Math.abs(dx)>0.5||Math.abs(dy)>0.5){
          el.style.transition='none';el.style.transform=`translate(${dx}px,${dy}px)`;
          requestAnimationFrame(()=>requestAnimationFrame(()=>{
            el.style.transition='transform 0.3s cubic-bezier(0.4,0,0.2,1)';el.style.transform='none';
          }));
        }
      }
    });
    prevRectsRef.current=newRects;
  },[previewServices]);

  // Font scale: apply persisted value on mount
  useEffect(()=>{
    const saved=Number(localStorage.getItem("anp_font_scale")||"0");
    if(saved>0){const root=document.getElementById("root");if(root)root.style.zoom=String(1+saved*0.07);}
  },[]);

  // Keyboard sound
  useEffect(()=>{
    let ctx:AudioContext|null=null;
    const getCtx=()=>{if(!ctx)ctx=new (window.AudioContext||(window as any).webkitAudioContext)();return ctx;};
    const playClick=()=>{
      if(localStorage.getItem("anp_key_sound")==="off")return;
      try{
        const c=getCtx();const g=c.createGain();const o=c.createOscillator();
        g.gain.setValueAtTime(0.07,c.currentTime);g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+0.045);
        o.frequency.setValueAtTime(1200,c.currentTime);o.frequency.exponentialRampToValueAtTime(800,c.currentTime+0.04);
        o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+0.05);
      }catch{}
    };
    const onKey=(e:KeyboardEvent)=>{
      const el=document.activeElement;
      if(!(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement))return;
      if(e.key.length===1||e.key==="Backspace"||e.key==="Delete")playClick();
    };
    document.addEventListener("keydown",onKey);
    return()=>document.removeEventListener("keydown",onKey);
  },[]);

  // Elastic surface deformation — scaleY stretches cards/buttons/rounded panels
  useEffect(()=>{
    let startY=0;
    let scrollEl:HTMLElement|null=null;
    let atTopStart=false;
    let pulling=false;
    const getScrollParent=(el:Element|null):HTMLElement|null=>{
      if(!el||el===document.body)return null;
      const s=window.getComputedStyle(el);
      if(/(auto|scroll)/.test(s.overflowY)&&(el as HTMLElement).scrollHeight>(el as HTMLElement).clientHeight+2)return el as HTMLElement;
      return getScrollParent(el.parentElement);
    };
    const onStart=(e:TouchEvent)=>{
      startY=e.touches[0].clientY;
      // Only apply effect on the home tab's app-content scroll container
      if(_tabRef.current!=="home"){scrollEl=null;return;}
      const candidate=getScrollParent(e.target as Element);
      scrollEl=candidate?.classList.contains("app-content")?candidate:null;
      if(scrollEl){
        atTopStart=scrollEl.scrollTop<=0;
      }
      pulling=false;
    };
    const onMove=(e:TouchEvent)=>{
      if(!scrollEl)return;
      const dy=e.touches[0].clientY-startY;
      const atTop=scrollEl.scrollTop<=0;
      const atBottom=scrollEl.scrollTop+scrollEl.clientHeight>=scrollEl.scrollHeight-2;
      const goingDown=dy>0;
      const goingUp=dy<0;
      if((atTop&&goingDown&&dy>6)||(atBottom&&goingUp&&dy<-6)){
        pulling=true;
        const raw=Math.abs(dy);
        // logarithmic damping — feels elastic, resists hard pulls
        const damped=Math.log1p(raw)*10;
        const maxStretch=55;
        const stretch=Math.min(damped,maxStretch);
        const h=scrollEl.clientHeight||1;
        // scaleY stretches the entire surface including cards/buttons/rounded corners
        const scaleY=1+stretch/h;
        const origin=atTop?"top center":"bottom center";
        scrollEl.style.transform=`scaleY(${scaleY.toFixed(4)})`;
        scrollEl.style.transformOrigin=origin;
        scrollEl.style.transition="none";
        scrollEl.style.willChange="transform";
      }
    };
    const onEnd=()=>{
      if(pulling&&scrollEl){
        const el=scrollEl;
        el.style.transition="transform 0.46s cubic-bezier(0.18,1.2,0.4,1)";
        el.style.transform="scaleY(1)";
        const cleanup=()=>{
          el.style.transform="";
          el.style.transition="";
          el.style.transformOrigin="";
          el.style.willChange="";
        };
        el.addEventListener("transitionend",cleanup,{once:true});
        setTimeout(cleanup,600);
      }
      pulling=false;
      scrollEl=null;
    };
    document.addEventListener("touchstart",onStart,{passive:true});
    document.addEventListener("touchmove",onMove,{passive:true});
    document.addEventListener("touchend",onEnd);
    document.addEventListener("touchcancel",onEnd);
    return()=>{
      document.removeEventListener("touchstart",onStart);
      document.removeEventListener("touchmove",onMove);
      document.removeEventListener("touchend",onEnd);
      document.removeEventListener("touchcancel",onEnd);
    };
  },[]);

  useEffect(()=>{const t=setTimeout(()=>{const phone=DB.currentPhone();if(phone){const u=DB.getUser(phone);if(u){setUser(u);setTransactions(DB.getTx(phone));const hs=localStorage.getItem(`anp_home_services_${u.uid}`);if(hs){try{const p=JSON.parse(hs);if(Array.isArray(p)){// Migrate: ensure all DEFAULT_HOME_SERVICES are present (add missing ones)
              const merged=[...p,...DEFAULT_HOME_SERVICES.filter(id=>!p.includes(id))];
              // Also remove credit-score if present (replaced by cashback)
              const cleaned=merged.filter(id=>id!=="credit-score");
              if(cleaned.length!==p.length||cleaned.some((id,i)=>id!==merged[i])){localStorage.setItem(`anp_home_services_${u.uid}`,JSON.stringify(cleaned));}
              setHomeServices(cleaned);}}catch{}}const hp=localStorage.getItem(`anp_home_platforms_${u.uid}`);if(hp){try{const p=JSON.parse(hp);if(Array.isArray(p))setHomePlatforms(p);}catch{}}if(localStorage.getItem(`anp_show_cashback_${u.uid}`)===`false`)setShowCashback(false);setAppState("ready");return}}setAppState("login")},2200);return()=>clearTimeout(t)},[]);
  useEffect(()=>{if(appState==="ready"){const t=setTimeout(()=>setHomeSkeleton(false),5000);return()=>clearTimeout(t)}},[appState]);
  useEffect(()=>{let active=true;const load=async()=>{const r=await fetchUSDTRate();if(!active)return;setRate(r??0);setRateLoading(false)};void load();const iv=setInterval(()=>{void fetchUSDTRate().then(r=>{if(active&&r!=null)setRate(r)})},5000);return()=>{active=false;clearInterval(iv)}},[]);
  useEffect(()=>{if(homeSliderPaused)return;const t=setInterval(()=>setHomeSlide(s=>(s+1)%3),5000);return()=>clearInterval(t);},[homeSliderPaused]);
  // Auto-start tour once after first successful registration + verification
  useEffect(()=>{
    if(!pendingTour||appState!=="ready"||!user||subPage!==null||tab!=="home")return;
    const tourKey=`anp_tour_done_${user.phone}`;
    if(localStorage.getItem(tourKey)){setPendingTour(false);return;}
    // Hide skeleton first so all data-help-id elements are rendered, then start tour
    setHomeSkeleton(false);
    let tid:ReturnType<typeof setTimeout>;
    const raf=requestAnimationFrame(()=>{
      tid=setTimeout(()=>{setShowGlobalHelp(true);setPendingTour(false);},900);
    });
    return()=>{cancelAnimationFrame(raf);clearTimeout(tid);};
  },[pendingTour,appState,user,subPage,tab]);
  useEffect(()=>{const original=window.alert;window.alert=(message?:unknown)=>{const node=document.createElement("div");node.className="native-notice";node.innerHTML=`<div class="native-notice-card"><img src="${anPardazLogo}" alt="آن‌پرداز"><h3>پیام آن‌پرداز</h3><p>${String(message??"")}</p><button>متوجه شدم</button></div>`;node.querySelector("button")?.addEventListener("click",()=>node.remove());document.body.append(node)};return()=>{window.alert=original}},[]);
  useEffect(()=>{
    const normalize=(root:Node)=>{const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node:Text|null;while(node=walker.nextNode() as Text|null){const parent=node.parentElement;if(!parent||["INPUT","TEXTAREA","SCRIPT","STYLE"].includes(parent.tagName))continue;const next=toFaDigits(node.nodeValue||"");if(next!==node.nodeValue)node.nodeValue=next}};
    normalize(document.body);const observer=new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(normalize)));observer.observe(document.body,{childList:true,subtree:true});return()=>observer.disconnect();
  },[]);

  // Refs for back handler (avoids stale closures in popstate listener)
  const _appStateRef=useRef(appState);_appStateRef.current=appState;
  const _showHelpRef=useRef(showGlobalHelp);_showHelpRef.current=showGlobalHelp;
  const _menuOpenRef=useRef(menuOpen);_menuOpenRef.current=menuOpen;
  const _subPageRef=useRef(subPage);_subPageRef.current=subPage;
  const _tabRef=useRef(tab);_tabRef.current=tab;
  const _chargePayRef=useRef(chargePayData);_chargePayRef.current=chargePayData;
  const _chargePayOriginRef=useRef(chargePayOrigin);_chargePayOriginRef.current=chargePayOrigin;
  const _showExitDialogRef=useRef(showExitDialog);_showExitDialogRef.current=showExitDialog;

  useEffect(()=>{
    // Ensure there is always a sentinel history entry so back-press stays in the app
    window.history.pushState({_anp:1},"");
    const handle=()=>{
      if(_appStateRef.current!=="ready"){return;} // don't intercept during onboarding
      // Always re-push so next back-press is also intercepted
      window.history.pushState({_anp:1},"");
      // Dismiss exit dialog if open
      if(_showExitDialogRef.current){setShowExitDialog(false);return;}
      // Innermost screen handler wins
      if(_ANP_BACK.length>0){_ANP_BACK[_ANP_BACK.length-1]();return;}
      // App-level: close modals then navigate up
      if(_showHelpRef.current){setShowGlobalHelp(false);return;}
      if(_menuOpenRef.current){setMenuOpen(false);return;}
      const sp=_subPageRef.current;
      if(sp!==null){
        if(sp==="bills-payment")setSubPage("bills");
        else if(sp==="violations-payment")setSubPage("violations");
        else if(sp==="charity-payment")setSubPage("charity");
        else if(sp==="charge-payment")setSubPage(_chargePayOriginRef.current);
        else if(sp==="forex-bot")setSubPage("exchange");
        else setSubPage(null);
        return;
      }
      if(_tabRef.current!=="home"){setTab("home");return;}
      // At root AnPardaz home: show exit confirmation dialog
      setShowExitDialog(true);
    };
    window.addEventListener("popstate",handle);
    return()=>window.removeEventListener("popstate",handle);
  },[]);

  const updateUser=useCallback((u:UserData)=>{DB.saveUser(u);setUser(u)},[]);
  const updateWithTx=useCallback((u:UserData,tx:TxRecord)=>{const txs=[tx,...transactions];DB.saveUser(u);DB.saveTx(u.phone,txs);setUser(u);setTransactions(txs);if(localStorage.getItem(`anp_notifications_${u.uid}`)!=="off")playChime()},[transactions]);

  const handleVerified=(phone:string)=>{DB.setCurrentPhone(phone);const existing=DB.getUser(phone);if(existing){setUser(existing);setTransactions(DB.getTx(phone));const hs=localStorage.getItem(`anp_home_services_${existing.uid}`);if(hs){try{const p=JSON.parse(hs);if(Array.isArray(p))setHomeServices(p);}catch{}}const hp=localStorage.getItem(`anp_home_platforms_${existing.uid}`);if(hp){try{const p=JSON.parse(hp);if(Array.isArray(p))setHomePlatforms(p);}catch{}}setShowCashback(localStorage.getItem(`anp_show_cashback_${existing.uid}`)!=="false");setAppState(existing.pin?"unlock-pin":"ready")}else{const uid=_genUid();const newUser:UserData={uid,name:"",family:"",nationalId:"",birthDate:"",phone,photo:"",pin:"",tomanBalance:0,usdtBalance:0,cryptoBalances:{},cards:[],registeredAt:new Date().toISOString()};DB.saveUser(newUser);DB.setCurrentPhone(phone);setUser(newUser);setTransactions([]);setHomeServices(DEFAULT_HOME_SERVICES);setPendingTour(true);setAppState("ready")}};
  const handleLogout=()=>{DB.setCurrentPhone("");setUser(null);setTransactions([]);setHomeServices(DEFAULT_HOME_SERVICES);setHomePlatforms(DEFAULT_HOME_PLATFORMS);setShowCashback(true);setTab("home");setSubPage(null);setAppState("login")};

  const [obPhoto,setObPhoto]=useState("");
  const [obProfile,setObProfile]=useState({name:"",family:"",nationalId:"",birthDate:""});
  const [pendingPin,setPendingPin]=useState("");
  const [obLegalAccepted,setObLegalAccepted]=useState(false);

  if(appState==="splash")return <SplashScreen/>;
  if(appState==="login")return <PhoneLogin onSend={(p,c,d)=>{setPendingPhone(p);setPendingCode(c);setPendingDevCode(d);setAppState("otp")}}/>;
  if(appState==="otp")return <OTPVerify phone={pendingPhone} correctCode={pendingCode} devCode={pendingDevCode} onVerified={handleVerified} onBack={()=>setAppState("login")}/>;
  if(appState==="onboard-photo")return <OnboardPhoto onDone={p=>{setObPhoto(p);setObLegalAccepted(true);setAppState("onboard-profile")}} onBack={()=>setAppState("otp")} initialAccepted={obLegalAccepted}/>;
  if(appState==="onboard-profile")return <OnboardProfile onDone={d=>{setObProfile(d);setAppState("onboard-pin")}} onBack={()=>setAppState("onboard-photo")} initialData={obProfile}/>;
  if(appState==="unlock-pin"&&user)return <PinUnlock user={user} onVerified={()=>setAppState("ready")}/>;
  if(appState==="onboard-pin")return <OnboardPin onDone={pin=>{setPendingPin(pin);setAppState("verify-anim")}} onSkip={()=>{setPendingPin("");setAppState("verify-anim")}} onBack={()=>setAppState("onboard-profile")}/>;
  if(appState==="verify-anim")return <VerificationAnimation onSuccess={()=>{const u:UserData={uid:_genUid(),...obProfile,phone:pendingPhone,photo:obPhoto,pin:pendingPin,tomanBalance:0,usdtBalance:0,cryptoBalances:{},cards:[{id:"card-melat-1",number:"6104338761369582",bank:"بانک ملت",holderName:obProfile.name+" "+obProfile.family}],registeredAt:new Date().toISOString()};DB.saveUser(u);DB.setCurrentPhone(u.phone);setUser(u);setTransactions([]);setHomeServices(SERVICES.slice(0,8).map(s=>s.id));setHomeSkeleton(false);setAppState("ready");setPendingTour(true);}} onFail={()=>{setPendingPin("");setAppState("onboard-pin")}}/>;
  if(!user)return null;

  const initials=(user.name?.[0]??"")+(user.family?.[0]??"")||"؟";
  const recentTx=transactions.filter(tx=>tx.source!=="exchange"&&!tx.note?.includes("[صرافی]")&&!(tx.note?.includes("ربات فارکس")&&tx.note?.includes("تخصیص"))).slice(0,3);
  const lt=lightTheme?" light-theme":"";

  const handleService=(action:string,label:string)=>{
    setMenuOpen(false);
    if(action==="transfer"){setTab("home");setSubPage("transfer")}
    else if(action==="exchange"){setTab("home");setSubPage("exchange")}
    else if(action==="tether-swap"){setTab("home");setSubPage("tether-swap")}
    else if(action==="charge"){setTab("home");setSubPage("charge")}
    else if(action==="internet"){setTab("home");setSubPage("internet")}
    else if(action==="bills"){setTab("home");setSubPage("bills")}
    else if(action==="car-services"){setTab("home");setSubPage("car-services")}
    else if(action==="violations"){setTab("home");setSubPage("violations")}
    else if(action==="freeway"){setTab("home");setSubPage("freeway")}
    else if(action==="tehran-traffic"){setTab("home");setSubPage("tehran-traffic")}
    else if(action==="insurance"){setInsuranceTab("third-party");setTab("home");setSubPage("insurance")}
    else if(action==="insurance-body"){setInsuranceTab("body");setTab("home");setSubPage("insurance")}
    else if(action==="insurance-moto"){setInsuranceTab("motorcycle");setTab("home");setSubPage("insurance")}
    else if(action==="sana"){setTab("home");setSubPage("sana")}
    else if(action==="judiciary-bill"){setTab("home");setSubPage("judiciary-bill")}
    else if(action==="property-reg"){setTab("home");setSubPage("property-reg")}
    else if(action==="charity"){setTab("home");setSubPage("charity")}
    else if(action==="card-balance"){setTab("home");setSubPage("card-balance")}
    else if(action==="cashback"){setTab("home");setSubPage("cashback")}
    else if(action==="financial-center"){setTab("home");setSubPage("financial-center")}
    else if(action==="an-market"){setSubPage("an-market");}
    else if(action==="an-banner"){setSubPage("an-banner");}
    else if(action==="an-hoosh"){setSubPage("an-hoosh");}
    else if(action==="all-services"){setTab("home");setSubPage("all-services")}
    else if(action==="soon")setSystemNotice("این خدمت به‌زودی در دسترس خواهد بود.")
    else if(action==="deposit")setSystemNotice("درگاه واریز به‌زودی فعال می‌شود. به محض فعال‌سازی، از همین بخش اطلاع‌رسانی می‌کنیم.")
    else{setServiceName(label);setTab("home");setSubPage("service")}
  };

  const SNAV=()=><nav className="bottom-nav">{([{id:"history",label:"تراکنش‌ها",icon:"chart"},{id:"home",label:"خانه",icon:"home"},{id:"profile",label:"پروفایل",icon:"user"}] as {id:MainTab;label:string;icon:string}[]).map(n=><button key={n.id} data-help-id={`nav-${n.id}`} onClick={()=>{setSubPage(null);setTab(n.id)}} className={tab===n.id?"active":""}><Icon name={n.icon}/><span>{n.label}</span></button>)}</nav>;

  const goBack=()=>setSubPage(null);
  const goHome=()=>{setSubPage(null);setTab("home")};
  if(subPage==="transfer")return <div key="transfer" className={`app${lt} app-slide`} dir="rtl"><TransferScreen user={user} rate={rate} onUpdate={updateWithTx} transactions={transactions} onBack={goBack} onDone={goHome}/><SNAV/></div>;
  if(subPage==="tether-swap")return <div key="tether-swap" className={`app${lt} app-slide`} dir="rtl"><TetherSwapScreen user={user} rate={rate} onUpdate={updateWithTx} onBack={goBack}/><SNAV/></div>;
  if(subPage==="exchange")return <div key="exchange" className={`app${lt} app-slide`} dir="rtl"><ExchangeScreen user={user} onBack={goBack} onUpdate={updateWithTx} onUpdateUser={updateUser} transactions={transactions} onForexBot={()=>setSubPage("forex-bot")}/></div>;
  if(subPage==="forex-bot")return <div key="forex-bot" className={`app${lt} app-slide`} dir="rtl"><ForexBotScreen user={user} onUpdate={updateWithTx} onBack={()=>setSubPage("exchange")}/></div>;
  if(subPage==="charge")return <div key="charge" className={`app${lt} app-slide`} dir="rtl"><ChargeScreen type="charge" user={user!} onUpdate={updateWithTx} onBack={goBack} onGoToPayment={d=>{setChargePayData(d);setChargePayOrigin("charge");setSubPage("charge-payment")}}/><SNAV/></div>;
  if(subPage==="internet")return <div key="internet" className={`app${lt} app-slide`} dir="rtl" style={{position:"relative"}}><InternetPackageScreen user={user!} onUpdate={updateWithTx} onBack={()=>{internetStateRef.current=null;goBack();}} onGoToPayment={d=>{setChargePayData(d);setChargePayOrigin("internet");setSubPage("charge-payment")}} initialState={internetStateRef.current} onBeforeNavigate={s=>{internetStateRef.current=s;}}/><SNAV/></div>;
  if(subPage==="service")return <div key="service" className={`app${lt} app-slide`} dir="rtl"><ServiceScreen name={serviceName} onBack={goBack}/><SNAV/></div>;
  if(subPage==="bills")return <div key="bills" className={`app${lt} app-slide`} dir="rtl"><BillsScreen onBack={goBack} onGoToPayment={d=>{setBillsPayData(d);setSubPage("bills-payment")}}/><SNAV/></div>;
  if(subPage==="bills-payment")return <div key="bills-payment" className={`app${lt} app-slide`} dir="rtl"><BillsPaymentScreen data={billsPayData!} user={user!} onUpdate={updateWithTx} onBack={()=>setSubPage("bills")} onDone={goHome}/><SNAV/></div>;
  if(subPage==="car-services")return <div key="car-services" className={`app${lt} app-slide`} dir="rtl"><CarServicesScreen onBack={goBack}/><SNAV/></div>;
  if(subPage==="violations")return <div key="violations" className={`app${lt} app-slide`} dir="rtl"><ViolationsScreen onBack={goBack} onGoToPayment={d=>{setViolationsPayData(d);setSubPage("violations-payment")}}/><SNAV/></div>;
  if(subPage==="violations-payment")return <div key="violations-payment" className={`app${lt} app-slide`} dir="rtl"><ViolationsPaymentScreen data={violationsPayData!} user={user!} onUpdate={updateWithTx} onBack={()=>setSubPage("violations")} onDone={goHome}/><SNAV/></div>;
  if(subPage==="freeway")return <div key="freeway" className={`app${lt} app-slide`} dir="rtl"><FreewayScreen onBack={goBack}/><SNAV/></div>;
  if(subPage==="tehran-traffic")return <div key="tehran-traffic" className={`app${lt} app-slide`} dir="rtl"><TrafficScreen onBack={goBack}/><SNAV/></div>;
  if(subPage==="insurance")return <div key="insurance" className={`app${lt} app-slide`} dir="rtl"><InsuranceScreen initialTab={insuranceTab} user={user!} onUpdate={updateWithTx} onBack={goBack}/><SNAV/></div>;
  if(subPage==="sana")return <div key="sana" className={`app${lt} app-slide`} dir="rtl"><SanaScreen onBack={goBack}/><SNAV/></div>;
  if(subPage==="judiciary-bill")return <div key="judiciary-bill" className={`app${lt} app-slide`} dir="rtl"><JudiciaryBillScreen user={user!} onUpdate={updateWithTx} onBack={goBack} onDone={goHome}/><SNAV/></div>;
  if(subPage==="property-reg")return <div key="property-reg" className={`app${lt} app-slide`} dir="rtl"><PropertyRegBillScreen user={user!} onUpdate={updateWithTx} onBack={goBack} onDone={goHome}/><SNAV/></div>;
  if(subPage==="charity")return <div key="charity" className={`app${lt} app-slide`} dir="rtl"><CharityScreen onBack={goBack} onGoToPayment={d=>{setCharityPayData(d);setSubPage("charity-payment")}}/><SNAV/></div>;
  if(subPage==="charity-payment")return <div key="charity-payment" className={`app${lt} app-slide`} dir="rtl"><CharityPaymentScreen data={charityPayData!} user={user!} onUpdate={updateWithTx} onBack={()=>setSubPage("charity")} onDone={goHome}/><SNAV/></div>;
  if(subPage==="card-balance")return <div key="card-balance" className={`app${lt} app-slide`} dir="rtl"><CardBalanceScreen user={user!} onBack={goBack} onDone={goHome}/><SNAV/></div>;
  if(subPage==="charge-payment")return <div key="charge-payment" className={`app${lt} app-slide`} dir="rtl"><ChargePaymentScreen data={chargePayData!} user={user!} onUpdate={updateWithTx} onBack={()=>setSubPage(chargePayOrigin)} onDone={goHome}/><SNAV/></div>;
  if(subPage==="cashback")return <div key="cashback" className={`app${lt} app-slide`} dir="rtl"><CashbackScreen user={user!} transactions={transactions} onBack={goBack} onUpdate={(u,tx)=>{setUser(u);const newTxs=[tx,...transactions];setTransactions(newTxs);if(u)DB.saveTx(u.phone,newTxs);DB.saveUser(u);}}/><SNAV/></div>;
  if(subPage==="financial-center")return <div key="financial-center" className={`app${lt} app-slide`} dir="rtl"><FinancialCenterScreen transactions={transactions} onBack={goBack} user={user}/><SNAV/></div>;
  if(subPage==="an-market")return(
    <div key="an-market" className={`app${lt} app-slide`} dir="rtl" style={{display:"flex",flexDirection:"column",height:"100dvh",overflow:"hidden"}}>
      <AnMarketScreen onBack={goBack} user={user!} lightTheme={lightTheme}/>
    </div>
  );
  if(subPage==="an-banner")return(
    <div key="an-banner" className={`app${lt} app-slide`} dir="rtl" style={{display:"flex",flexDirection:"column",height:"100dvh",overflow:"hidden"}}>
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <AnBannerScreen onBack={goBack} userId={user!.uid} lightTheme={lightTheme}/>
      </div>
    </div>
  );
  if(subPage==="an-hoosh")return(
    <div key="an-hoosh" className={`app${lt} app-slide`} dir="rtl" style={{display:"flex",flexDirection:"column",height:"100dvh",overflow:"hidden"}}>
      <AnHooshScreen onBack={goBack}/>
    </div>
  );
  if(subPage==="all-services")return <div key="all-services" className={`app${lt} app-slide`} dir="rtl"><AllServicesScreen onBack={goBack} onServiceTap={(action,label)=>{setSubPage(null);handleService(action,label)}} homeServices={homeServices} setHomeServices={v=>{setHomeServices(v);if(user)localStorage.setItem(`anp_home_services_${user.uid}`,JSON.stringify(v));}} homePlatforms={homePlatforms} setHomePlatforms={v=>{setHomePlatforms(v);if(user)localStorage.setItem(`anp_home_platforms_${user.uid}`,JSON.stringify(v));}} showCashback={showCashback} setShowCashback={v=>{setShowCashback(v);if(user)localStorage.setItem(`anp_show_cashback_${user.uid}`,String(v));}}/><SNAV/></div>;

  return <div className={`app${lightTheme?" light-theme":""}`} dir="rtl">
    <header className="app-header">
      <div className="brand" data-help-id="brand">
        <img className="brand-logo" src={anPardazLogo} alt="لوگوی آن‌پرداز"/>
        <span>آن‌پرداز</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <button onClick={()=>setShowGlobalHelp(true)} aria-label="راهنما" data-help-id="help-btn" style={{width:36,height:36,borderRadius:11,background:"rgba(0,214,176,0.08)",border:"1px solid rgba(0,214,176,0.22)",color:"var(--accent)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
        </button>
        <button className="header-notif-btn" onClick={()=>setMenuOpen(true)} aria-label="اطلاعات کاربری" data-help-id="avatar-btn">
          <div className="header-avatar-mini">
            {user.photo?<img src={user.photo} alt=""/>:<span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:60,fontSize:10,fontWeight:700}}>{(user.name||"").trim()||"؟"}</span>}
          </div>
        </button>
      </div>
      {menuOpen&&<UserDrawerModal user={user} onClose={()=>setMenuOpen(false)} onLogout={()=>{setMenuOpen(false);handleLogout()}} />}
      {showGlobalHelp&&<HelpSystem onClose={()=>setShowGlobalHelp(false)} userPhone={user?.phone} homeServices={homeServices} homePlatforms={homePlatforms}/>}
      {showExitDialog&&(
        <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"flex-end",justifyContent:"center",direction:"rtl"}} onClick={()=>setShowExitDialog(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"var(--card-bg)",borderRadius:"24px 24px 0 0",padding:"28px 24px 40px",width:"100%",maxWidth:430,fontFamily:"Vazirmatn,sans-serif"}}>
            <div style={{width:40,height:4,borderRadius:2,background:"rgba(128,128,128,0.3)",margin:"0 auto 24px"}}/>
            <div style={{fontSize:17,fontWeight:800,color:"var(--text-primary)",textAlign:"center",marginBottom:8}}>خروج از آن‌پرداز</div>
            <div style={{fontSize:13,color:"var(--text-secondary)",textAlign:"center",marginBottom:28,lineHeight:1.8}}>آیا می‌خواهید از آن‌پرداز خارج شوید؟</div>
            <div style={{display:"flex",gap:12}}>
              <button onClick={()=>setShowExitDialog(false)} style={{flex:1,height:52,borderRadius:14,background:"rgba(128,128,128,0.12)",border:"1px solid var(--border-color)",color:"var(--text-primary)",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"Vazirmatn,sans-serif"}}>انصراف</button>
              <button onClick={()=>{setShowExitDialog(false);window.history.go(-1);}} style={{flex:1,height:52,borderRadius:14,background:"#e8512a",border:"none",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"Vazirmatn,sans-serif"}}>خروج</button>
            </div>
          </div>
        </div>
      )}
    </header>

    <div className="app-content" key={tab}>
      {tab==="home"&&<div style={{padding:"0 16px 16px"}}>
        {/* Full-page skeleton when loading */}
        {homeSkeleton&&(
          <div style={{pointerEvents:"none"}}>
            {/* Slider skeleton */}
            <div style={{borderRadius:18,overflow:"hidden",marginBottom:16,height:160,background:"var(--border-color)",animation:"skel-pulse 1.4s ease-in-out infinite"}}/>
            {/* Services label skeleton */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{width:50,height:12,borderRadius:4,background:"var(--border-color)"}}/>
            </div>
            {/* Services grid skeleton */}
            <div className="services-grid">
              {Array.from({length:homeServices.length+1}).map((_,i)=>(
                <div key={i} className="home-service-btn" style={{pointerEvents:"none"}}>
                  <div className="svc-icon-wrap skel-icon" style={{width:36,height:36,borderRadius:10,background:"var(--border-color)"}}/>
                  <div className="skel-label" style={{width:48,height:10,borderRadius:4,background:"var(--border-color)",marginTop:4}}/>
                </div>
              ))}
            </div>
            {/* Platforms skeleton */}
            <div style={{marginTop:20,marginBottom:4}}>
              <div style={{width:60,height:12,borderRadius:4,background:"var(--border-color)",marginBottom:10}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {Array.from({length:Math.min(homePlatforms.length,4)}).map((_,i)=>(
                  <div key={i} style={{height:68,borderRadius:14,background:"var(--border-color)"}}/>
                ))}
              </div>
            </div>
            {/* Cashback skeleton */}
            {showCashback&&<div style={{height:72,borderRadius:16,background:"var(--border-color)",marginTop:14,marginBottom:14}}/>}
            {/* Recent tx skeleton */}
            <div style={{height:1,background:"var(--border-faint)",margin:"24px 4px 24px",borderRadius:1,opacity:0.4}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,marginTop:0}}>
              <div style={{width:100,height:14,borderRadius:4,background:"var(--border-color)"}}/>
              <div style={{width:40,height:12,borderRadius:4,background:"var(--border-color)"}}/>
            </div>
            {Array.from({length:3}).map((_,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid var(--border-faint)"}}>
                <div style={{width:40,height:40,borderRadius:12,background:"var(--border-color)",flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{width:"60%",height:12,borderRadius:4,background:"var(--border-color)",marginBottom:6}}/>
                  <div style={{width:"40%",height:10,borderRadius:4,background:"var(--border-color)"}}/>
                </div>
                <div style={{width:60,height:12,borderRadius:4,background:"var(--border-color)"}}/>
              </div>
            ))}
          </div>
        )}

        {/* Promotional Slider */}
        <div style={{position:"relative",borderRadius:18,overflow:"hidden",marginBottom:16,userSelect:"none",display:homeSkeleton?"none":"block"}}
          onTouchStart={e=>{(e.currentTarget as HTMLDivElement).dataset.tx=String(e.touches[0].clientX)}}
          onTouchEnd={e=>{const sx=Number((e.currentTarget as HTMLDivElement).dataset.tx||0);const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>40){setHomeSlide(s=>(s+(dx<0?1:-1)+3)%3);setHomeSliderPaused(true);setTimeout(()=>setHomeSliderPaused(false),8000)}}}>
          {/* Slide track with CSS transition */}
          <div style={{display:"flex",width:"300%",transform:`translateX(${(2-homeSlide)*100/3}%)`,transition:"transform 0.6s cubic-bezier(0.4,0,0.2,1)"}}>
            {/* Slide 0: original green banner */}
            <div style={{width:"33.333%",flexShrink:0,minHeight:160,background:"linear-gradient(135deg,#031a26 0%,#053040 45%,#012a20 100%)",padding:"22px 20px 20px",boxSizing:"border-box",display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
              <div style={{fontSize:11,color:"rgba(0,214,176,0.85)",marginBottom:8,display:"flex",alignItems:"center",gap:6,fontWeight:700}}><span className="live-dot-sm"/>خدمات مالی یکپارچه</div>
              <h1 style={{fontSize:17,fontWeight:900,color:"#F4FAFC",lineHeight:1.55,marginBottom:8}}>آن‌پرداز؛ دروازه هوشمند شما به دنیای پرداخت، سرمایه‌گذاری و بازارهای مالی</h1>
              <p style={{fontSize:12,color:"rgba(255,255,255,0.55)",lineHeight:1.65,marginBottom:10}}>مدیریت دارایی، ارز دیجیتال، فارکس و خدمات مالی روزمره در یک پلتفرم یکپارچه و امن</p>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {["خدمات مالی","ارز دیجیتال","فارکس","درآمد ارزی"].map(p=><span key={p} style={{background:"rgba(0,214,176,0.12)",border:"1px solid rgba(0,214,176,0.22)",borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700,color:"rgba(0,214,176,0.85)"}}>{p}</span>)}
              </div>
            </div>
            {/* Slide 1: support banner */}
            <div style={{width:"33.333%",flexShrink:0,minHeight:160}}>
              <img src={slide2Img} alt="اعتماد شما، اولویت ماست" style={{width:"100%",height:"100%",minHeight:160,objectFit:"cover",display:"block"}}/>
            </div>
            {/* Slide 2: cashback banner */}
            <div style={{width:"33.333%",flexShrink:0,minHeight:160}}>
              <img src={slide3Img} alt="بازگشت هزینه‌های خدمات بانکی" style={{width:"100%",height:"100%",minHeight:160,objectFit:"cover",display:"block"}}/>
            </div>
          </div>
          {/* Dot indicators */}
          <div style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",display:"flex",gap:6,zIndex:3}}>
            {[0,1,2].map(i=><button key={i} onClick={()=>{setHomeSlide(i);setHomeSliderPaused(true);setTimeout(()=>setHomeSliderPaused(false),8000)}} style={{width:homeSlide===i?20:6,height:6,borderRadius:3,background:homeSlide===i?"#00D6B0":"rgba(255,255,255,0.4)",border:"none",cursor:"pointer",padding:0,transition:"all 0.35s ease"}}/>)}
          </div>
        </div>

        {/* Services Grid */}
        {!homeSkeleton&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:13,fontWeight:700,color:"var(--text-muted)"}}>خدمات</div>
          {homeEditMode&&<div style={{fontSize:11,color:"var(--text-faint)"}}>برای خروج، بیرون از خدمات بزنید</div>}
        </div>}
        {/* Transparent overlay exits edit mode on outside tap */}
        {homeEditMode&&<div style={{position:"fixed",inset:0,zIndex:5}} onPointerDown={()=>{setHomeEditMode(false);setDragOverId(null);}}/>}
        {!homeSkeleton&&(
          <div className="services-grid" ref={svcGridRef} style={{position:"relative",zIndex:homeEditMode?6:undefined}}>
            {previewServices.map((sid)=>{
              const s=SERVICES.find(x=>x.id===sid);if(!s)return null;
              const ill=ServiceIllustration({id:s.id,color:s.color});
              const isDragSrc=dragSrcRef.current===s.id;
              const isDragOver=dragOverId===s.id;
              return (
                <button
                  key={s.id}
                  data-sid={s.id}
                  className={`home-service-btn${homeEditMode?" edit-mode":""}${isDragSrc?" drag-src":""}${isDragOver&&!isDragSrc?" drag-over":""}`}
                  data-help-id={`svc-${s.id}`}
                  onTouchStart={(e)=>startLongPress(s.id,e)}
                  onTouchMove={moveLongPress}
                  onTouchEnd={(e)=>endPress(e,s)}
                  onMouseDown={(e)=>startLongPress(s.id,e)}
                  onMouseUp={(e)=>endPress(e,s)}
                  onMouseLeave={cancelLongPress}
                  draggable={homeEditMode}
                  onDragStart={homeEditMode?()=>{dragSrcRef.current=s.id;}:undefined}
                  onDragEnter={homeEditMode?()=>{if(dragSrcRef.current&&dragSrcRef.current!==s.id)setDragOverId(s.id);}:undefined}
                  onDragOver={homeEditMode?(e)=>{e.preventDefault();}:undefined}
                  onDragEnd={homeEditMode?()=>{dragSrcRef.current=null;setDragOverId(null);}:undefined}
                  onDrop={homeEditMode?()=>{
                    setHomeServices(prev=>{
                      const srcId=dragSrcRef.current;if(!srcId||srcId===s.id)return prev;
                      const srcIdx=prev.indexOf(srcId);const dstIdx=prev.indexOf(s.id);
                      if(srcIdx<0||dstIdx<0)return prev;
                      const next=[...prev];const[m]=next.splice(srcIdx,1);next.splice(dstIdx,0,m);
                      if(user)localStorage.setItem(`anp_home_services_${user.uid}`,JSON.stringify(next));
                      return next;
                    });
                    dragSrcRef.current=null;setDragOverId(null);
                  }:undefined}
                  style={{cursor:"pointer",position:"relative"}}
                >
                  {homeEditMode&&(
                    <span role="button" className="svc-remove-btn" onPointerDown={e=>e.stopPropagation()} onClick={(e)=>{e.stopPropagation();removeService(s.id,e);}}>×</span>
                  )}
                  <span className="svc-icon-wrap" style={{color:s.color}}>{ill||<Icon name={s.icon} size={22}/>}</span>
                  <span className="svc-label">{s.label}</span>
                </button>
              );
            })}
            {/* همه خدمات — always last, not draggable */}
            <button className="home-service-btn all-svcs-btn" data-help-id="all-services-btn" style={{zIndex:homeEditMode?7:undefined}} onClick={()=>{setHomeEditMode(false);setSubPage("all-services");}}>
              <span className="svc-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="5" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="19" cy="5" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="19" r="1.5"/><circle cx="12" cy="19" r="1.5"/><circle cx="19" cy="19" r="1.5"/></svg>
              </span>
              <span className="svc-label">همه خدمات</span>
            </button>
          </div>
        )}

        {/* ── Platforms Section ── */}
        {!homeSkeleton&&homePlatforms.length>0&&(
          <div style={{marginTop:20,marginBottom:4}}>
            <div style={{fontSize:13,fontWeight:700,color:"var(--text-muted)",marginBottom:10}}>پلتفرم‌ها</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {homePlatforms.map(pid=>{
                const p=PLATFORMS.find(x=>x.id===pid);if(!p)return null;
                return (
                  <div key={p.id} style={{position:"relative"}}>
                    <button onClick={()=>handleService(p.action,p.label)}
                      data-help-id={`platform-${p.id}`}
                      style={{width:"100%",background:p.bg,border:`1.5px solid ${p.border}`,borderRadius:14,padding:"14px 10px",cursor:"pointer",fontFamily:"Vazirmatn",display:"flex",flexDirection:"column",alignItems:"center",gap:4,boxSizing:"border-box",textAlign:"center"}}>
                      <div style={{fontSize:14,fontWeight:800,color:p.color}}>{p.label}</div>
                      <div style={{fontSize:11,color:"var(--text-muted)",lineHeight:1.4,textAlign:"center"}}>{p.desc}</div>
                    </button>
                    {homeEditMode&&(
                      <span role="button"
                        onPointerDown={e=>e.stopPropagation()}
                        onClick={e=>{e.stopPropagation();const next=homePlatforms.filter(x=>x!==p.id);setHomePlatforms(next);if(user)localStorage.setItem(`anp_home_platforms_${user.uid}`,JSON.stringify(next));}}
                        style={{position:"absolute",top:-6,right:-6,width:22,height:22,borderRadius:"50%",background:"#e85c5c",border:"2px solid var(--card-bg)",color:"#fff",fontSize:14,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:8,lineHeight:1}}>×</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Confetti particles */}
        {confettiItems.map(p=>(
          <div key={p.id} className="confetti-particle" style={{left:p.x,top:p.y,background:p.color,"--cx":`${p.cx}px`,"--cy":`${p.cy}px`} as React.CSSProperties}/>
        ))}

        {/* Cashback Full-Width Button — only shown when cashback is NOT in the services grid */}
        {!homeSkeleton&&showCashback&&!homeServices.includes("cashback")&&(()=>{const totalCb=transactions.filter(tx=>tx.type==="service"&&tx.status==="done").reduce((a,tx)=>a+Math.round(tx.amount*0.0015),0);return(
          <div style={{position:"relative",marginBottom:14,marginTop:homePlatforms.length>0?8:0}}>
            <button data-help-id="cashback-btn" className="anp-cashback-btn" onClick={()=>setSubPage("cashback")} style={{display:"flex",alignItems:"center",width:"100%",background:"linear-gradient(135deg,rgba(0,214,176,0.07),rgba(0,214,176,0.03))",border:"1px solid rgba(0,214,176,0.18)",borderRadius:16,padding:"14px 18px",cursor:"pointer",fontFamily:"Vazirmatn",touchAction:"manipulation",gap:14,boxSizing:"border-box"}}>
              <div style={{width:44,height:44,borderRadius:13,background:"rgba(0,214,176,0.12)",border:"1px solid rgba(0,214,176,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00D6B0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
              </div>
              <div style={{flex:1,textAlign:"right"}}>
                <div style={{fontSize:15,fontWeight:800,color:"#00D6B0",marginBottom:2}}>بازگشت هزینه</div>
                <div className="anp-cashback-sub" style={{fontSize:11,color:"rgba(255,255,255,0.38)"}}>مجموع: {fa(totalCb)} ریال</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(0,214,176,0.35)" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            {homeEditMode&&(
              <span role="button"
                onPointerDown={e=>e.stopPropagation()}
                onClick={e=>{e.stopPropagation();setShowCashback(false);if(user)localStorage.setItem(`anp_show_cashback_${user.uid}`,"false");}}
                style={{position:"absolute",top:-6,right:-6,width:22,height:22,borderRadius:"50%",background:"#e85c5c",border:"2px solid var(--card-bg)",color:"#fff",fontSize:14,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:8,lineHeight:1}}>×</span>
            )}
          </div>
        )})()}

        {/* Recent Transactions */}
        {!homeSkeleton&&<><div style={{height:1,background:"var(--border-faint)",margin:"0 4px 24px",borderRadius:1,opacity:0.5}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,marginTop:0}}>
          <div style={{fontSize:15,fontWeight:800,color:"var(--text-primary)"}}>تراکنش‌های اخیر</div>
          <button style={{background:"none",border:"none",color:"#00D6B0",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"Vazirmatn"}} onClick={()=>setTab("history")}>همه <Icon name="arrow" size={16}/></button>
        </div>
        {recentTx.length===0?<p style={{color:"var(--text-faint)",textAlign:"center",padding:"24px 0",fontSize:13}}>هنوز تراکنشی انجام نشده است.</p>:recentTx.map(tx=>{
          const dt=new Date(tx.createdAt);
          const amtColor=tx.type==="deposit"?"#00D6B0":tx.type==="withdraw"?"#fb923c":tx.status==="pending"?"#f5c23d":"var(--text-muted)";
          const amtDisplay=tx.status==="pending"?"در انتظار":(tx.type==="service"||tx.type==="transfer")?<span style={{color:"#34d399",fontSize:12,fontWeight:700}}>موفق ✓</span>:`${faFixed(tx.amount,tx.fromAsset==="toman"?0:2)} ${tx.fromAsset==="toman"?"ریال":"دلار تتر"}`;
          return <div key={tx.id} className="tx-item" onClick={()=>setSelectedTx(tx)}>
            <TxIcon tx={tx}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{getTxDescription(tx)}</div>
              <div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>{dt.toLocaleDateString("fa-IR")}</div>
            </div>
            <div style={{fontWeight:700,fontSize:13,color:amtColor,flexShrink:0}}>{amtDisplay}</div>
          </div>;
        })}</>}
      </div>}

      {tab==="history"&&<HistoryPage transactions={transactions} cards={user.cards}/>}
      {tab==="profile"&&<ProfilePage user={user} onUpdate={updateUser} onLogout={handleLogout} lightTheme={lightTheme} setLightTheme={setLightTheme}/>}
    </div>

    <nav className="bottom-nav">
      {([{id:"history",label:"تراکنش‌ها",icon:"chart"},{id:"home",label:"خانه",icon:"home"},{id:"profile",label:"پروفایل",icon:"user"}] as {id:MainTab;label:string;icon:string}[]).map(n=>
        <button key={n.id} onClick={()=>setTab(n.id)} className={tab===n.id?"active":""}>
          <Icon name={n.icon}/><span>{n.label}</span>
        </button>
      )}
    </nav>

    {assetModal&&<AssetModal user={user} rate={rate} onClose={()=>setAssetModal(false)}/>}
    {selectedTx&&<TxModal tx={selectedTx} onClose={()=>setSelectedTx(null)} isHistory={true}/>}
    {systemNotice&&<div className="receipt-page" dir="rtl"><div className="receipt-page-header"><button className="back-btn" onClick={()=>setSystemNotice("")}><Icon name="arrow" size={20}/></button><h2 style={{flex:1,textAlign:"center",margin:0,fontSize:16,fontWeight:800,color:"var(--text-primary)"}}>اطلاعیه</h2><img src={anPardazLogo} alt="آن‌پرداز" style={{height:22,objectFit:"contain"}}/></div><div className="receipt-page-body"><div style={{padding:"24px 20px",borderRadius:18,background:"var(--card-bg)",border:"1px solid var(--border-faint)",textAlign:"center",marginTop:20}}><div style={{width:64,height:64,borderRadius:"50%",background:"rgba(245,166,35,0.12)",border:"2px solid rgba(245,166,35,0.3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div><p style={{fontSize:14,color:"var(--text-muted)",lineHeight:1.8,margin:"0 0 20px"}}>{systemNotice}</p><button className="primary-button" onClick={()=>setSystemNotice("")}>متوجه شدم</button></div></div></div>}
  </div>;
}
