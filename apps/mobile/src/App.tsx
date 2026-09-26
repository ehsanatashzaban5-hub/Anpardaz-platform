import { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { _ANP_BACK, useBackHandler } from "./backHandler";
import AnBannerScreen from "./AnBanner";
import AnHooshScreen from "./AnHoosh";
import FinancialCenterLive from "./FinancialCenterLive";
import {financialApi} from "./financialApi";
import anPardazLogo from "@/imports/ChatGPT_Image_Aug_10__2026__06_38_53_PM__3_.png";
import logoHekmat from "@/imports/Bank-Hekmat-Iranian-Logo.png";
import logoMehr from "@/imports/Bank-Mehr-Iran.png";
import logoHamrahAval from "@/imports/Hamrahe_Aval__2_.png";
import logoIrancell from "@/imports/_wp-content_uploads_2023_12_MTNI-Logo-Yellow-FA-1024-563.png";
import logoAnsar from "@/imports/bank-ansar.png";
import logoKarafarin from "@/imports/bank-karafarin-3.png";
import logoParsian from "@/imports/bank-parsian.png";
import logoRefah from "@/imports/bank-refah.png";
import logoRightel from "@/imports/new-logo4.png";
import logoSarmayeh from "@/imports/bank-sarmayeh.png";
import logoShahr from "@/imports/bank-shahr.png";
import logoTejarat from "@/imports/bank-tejarat.png";
import logoSanatMadan from "@/imports/Sanat-va-madan.png";
import logoMeli from "@/imports/bank-meli__2_.png";
import logoMelal from "@/imports/Melal-Credit-Institution-Logo.png";
import logoToseeTaavon from "@/imports/Tosee-Taavon-Bank-Logo.png";
import logoDi from "@/imports/bank-ayandeh.png";
import logoIranZamin from "@/imports/bank-iranzamin.png";
import logoKeshavarzi from "@/imports/Bank-Keshavarzi-Logo.png";
import logoMaskan from "@/imports/bank-maskan.png";
import logoResalat from "@/imports/bank-resalat.png";
import logoSepah from "@/imports/bank-sepah.png";
import slide2Img from "@/imports/ChatGPT_Image_Aug_26__2026__03_51_21_PM-1.png";
import slide3Img from "@/imports/ChatGPT_Image_Aug_26__2026__03_27_20_PM.png";
import logoGardeshgari from "@/imports/gardeshgari.png";
import logoToseeSaderat from "@/imports/Export-Development-Bank-of-Iran-Logo.png";
import billImgHamrah from "@/imports/67ea208c-b6ea-4a03-9408-156cfa836850.png";
import billImgIrancell from "@/imports/8bd188ae-0d5a-41e2-b9e2-719e1850fb93.png";
import billImgAb from "@/imports/ecad70dc-ed5e-4c95-aac7-cf369ea9d460.png";
import billImgBrq from "@/imports/cb91bb35-cad8-4893-afb8-7256a27ae26e.png";
import billImgMakhab from "@/imports/db7f952b-560e-4108-962f-40b21acd1fde.png";
import charityLogoKomite from "@/imports/bd981266-0952-497e-adc2-6979c25929dd.png";
import charityLogoRedCrescent from "@/imports/50ee0495-3e4f-4701-97e0-f37994adb0e1.png";
import charityLogoChildren from "@/imports/3bea6472-d221-4630-b1c2-ad7882ba4659.png";
import charityLogoBarekat from "@/imports/fea9ea50-c987-4daf-a63c-fc8720539963.png";
import charityLogoEnvironment from "@/imports/39de94f2-ebfb-499f-8225-90f5f5c90ad7-1.png";
import billImgGaz from "@/imports/dfbca881-b660-417c-b45e-7e5ab1120d16.png";
import logoPostBank from "@/imports/postbank.png";
import logoMellat from "@/imports/bank-mellat.png";

// ─── Config ───────────────────────────────────────────────────────────────────
const liveRate = 0;
const ANSARRAF_API_BASE = ((import.meta as any).env?.VITE_ANSARRAF_API_URL as string | undefined)?.replace(/\/$/,"") ?? "";
const ANPARDAZ_API_BASE = ((import.meta as any).env?.VITE_ANPARDAZ_API_URL as string | undefined)?.replace(/\/$/,"") ?? "";
const KAVENEGAR_KEY = "";
const ANMARKET_PLATFORM_API_BASE=((import.meta as any).env?.VITE_PLATFORM_API_URL as string|undefined)?.replace(/\/$/,"")??"";

// ─── Types ────────────────────────────────────────────────────────────────────
type AppState = "splash" | "login" | "otp" | "unlock-pin" | "onboard-photo" | "onboard-profile" | "onboard-pin" | "verify-anim" | "ready";
type MainTab = "home" | "history" | "profile";
type SubPage = null | "transfer" | "tether-swap" | "exchange" | "charge" | "internet" | "bills" | "car-services" | "violations" | "freeway" | "tehran-traffic" | "insurance" | "sana" | "judiciary-bill" | "property-reg" | "charity" | "service" | "card-balance" | "charge-payment" | "charity-payment" | "bills-payment" | "violations-payment" | "forex-bot" | "cashback" | "financial-center" | "all-services" | "an-market" | "an-banner" | "an-hoosh";

interface UserData {
  uid: string;   // unique stable ID; never changes after creation
  phone: string; name: string; family: string; nationalId: string;
  birthDate: string; photo: string; pin: string;
  tomanBalance: number; usdtBalance: number;
  cryptoBalances: Record<string, number>;
  cards: BankCard[]; registeredAt: string;
  kycDone?: boolean;
}
interface BankCard { id: string; number: string; bank: string; holderName: string; expM?: string; expY?: string; }
interface TxRecord {
  id: string; userId: string;
  type: "deposit" | "withdraw" | "swap" | "transfer" | "service";
  fromAsset: string; toAsset: string;
  amount: number; convertedAmount?: number; fee: number;
  status: "pending" | "done" | "failed"; createdAt: string;
  toAddress?: string; fromCard?: string; note?: string;
  source?: "app" | "exchange"; tradeType?: string;
}
interface ExOrder {
  id: string; pair: string; side: "buy" | "sell";
  price: number; amount: number; total: number;
  status: "open" | "filled" | "cancelled"; createdAt: string;
  mode?: "spot" | "margin";
}
interface ExPosition {
  id: string; asset: string; side: "long" | "short";
  entry: number; qty: number; leverage: number; margin: number; fee: number; openedAt: string;
}
type ExAsset = "toman" | "USDT" | "BTC" | "ETH" | "BNB" | "SOL" | "DOGE" | "ADA";
type ExWallet = Record<ExAsset, number>;

// ─── Exchange Constants ────────────────────────────────────────────────────────
const EX_PAIRS = [
  "BTC/USDT","ETH/USDT","BNB/USDT","XRP/USDT","ADA/USDT","SOL/USDT",
  "AVAX/USDT","DOT/USDT","MATIC/USDT","LINK/USDT","UNI/USDT","ATOM/USDT",
  "LTC/USDT","ETC/USDT","DOGE/USDT","TRX/USDT","NEAR/USDT","ALGO/USDT",
  "VET/USDT","SHIB/USDT","APE/USDT","OP/USDT","ARB/USDT","INJ/USDT",
  "SUI/USDT","PEPE/USDT","WIF/USDT","JUP/USDT",
  "BTC/TOMAN","ETH/TOMAN","USDT/TOMAN","BNB/TOMAN","SOL/TOMAN","DOGE/TOMAN",
];
const INITIAL_PRICES: Record<string, number> = {};
const TV_SYMBOLS: Record<string,string> = {
  "BTC/USDT":"BINANCE:BTCUSDT","ETH/USDT":"BINANCE:ETHUSDT",
  "BNB/USDT":"BINANCE:BNBUSDT","XRP/USDT":"BINANCE:XRPUSDT",
  "ADA/USDT":"BINANCE:ADAUSDT","SOL/USDT":"BINANCE:SOLUSDT",
  "AVAX/USDT":"BINANCE:AVAXUSDT","DOT/USDT":"BINANCE:DOTUSDT",
  "MATIC/USDT":"BINANCE:MATICUSDT","LINK/USDT":"BINANCE:LINKUSDT",
  "UNI/USDT":"BINANCE:UNIUSDT","ATOM/USDT":"BINANCE:ATOMUSDT",
  "LTC/USDT":"BINANCE:LTCUSDT","ETC/USDT":"BINANCE:ETCUSDT",
  "DOGE/USDT":"BINANCE:DOGEUSDT","TRX/USDT":"BINANCE:TRXUSDT",
  "NEAR/USDT":"BINANCE:NEARUSDT","ALGO/USDT":"BINANCE:ALGOUSDT",
  "VET/USDT":"BINANCE:VETUSDT","SHIB/USDT":"BINANCE:SHIBUSDT",
  "APE/USDT":"BINANCE:APEUSDT","OP/USDT":"BINANCE:OPUSDT",
  "ARB/USDT":"BINANCE:ARBUSDT","INJ/USDT":"BINANCE:INJUSDT",
  "SUI/USDT":"BINANCE:SUIUSDT","PEPE/USDT":"BINANCE:PEPEUSDT",
  "WIF/USDT":"BINANCE:WIFUSDT","JUP/USDT":"BINANCE:JUPUSDT",
  "USDT/TOMAN":"NOBITEX:USDTIRT","BTC/TOMAN":"NOBITEX:BTCIRT",
  "ETH/TOMAN":"NOBITEX:ETHIRT","BNB/TOMAN":"NOBITEX:BNBIRT",
  "SOL/TOMAN":"NOBITEX:SOLIRT","DOGE/TOMAN":"NOBITEX:DOGEIRT",
};

// ─── Storage ──────────────────────────────────────────────────────────────────
function _genUid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
const DB = {
  getUser:(p:string):UserData|null=>{
    try{
      const raw=JSON.parse(localStorage.getItem(`anp_user_${p}`)??"null");
      if(!raw)return null;
      const u:UserData={uid:"",cryptoBalances:{},...raw};
      // Backfill uid for users registered before this field existed
      if(!u.uid){u.uid="uid_"+p.replace(/[^0-9]/g,"");localStorage.setItem(`anp_user_${p}`,JSON.stringify(u));}
      return u;
    }catch{return null}
  },
  saveUser:(u:UserData)=>localStorage.setItem(`anp_user_${u.phone}`,JSON.stringify(u)),
  currentPhone:()=>localStorage.getItem("anp_current")??"",
  setCurrentPhone:(p:string)=>localStorage.setItem("anp_current",p),
  getTx:(p:string):TxRecord[]=>{try{return JSON.parse(localStorage.getItem(`anp_tx_${p}`)??"[]")}catch{return[]}},
  saveTx:(p:string,t:TxRecord[])=>localStorage.setItem(`anp_tx_${p}`,JSON.stringify(t)),
  userExists:(p:string)=>!!localStorage.getItem(`anp_user_${p}`),
  // Exchange data — ALL keyed by uid so different users never share wallet/orders/positions
  getExWallet:(_uid:string):ExWallet=>({toman:0,USDT:0,BTC:0,ETH:0,BNB:0,SOL:0,DOGE:0,ADA:0}),saveExWallet:(_uid:string,_w:ExWallet)=>undefined,getExOrders:(_uid:string):ExOrder[]=>[],saveExOrders:(_uid:string,_o:ExOrder[])=>undefined,getExPositions:(_uid:string):ExPosition[]=>[],saveExPositions:(_uid:string,_p:ExPosition[])=>undefined,
};

// ─── Operator Detection ───────────────────────────────────────────────────────
const OPERATORS = {
  mci:      {id:"mci",      name:"همراه اول", color:"#f5a623", textColor:"#fff",    logo:logoHamrahAval as string},
  irancell: {id:"irancell", name:"ایرانسل",   color:"#FFD700", textColor:"#071D2C", logo:logoIrancell as string},
  rightel:  {id:"rightel",  name:"رایتل",      color:"#9C27B0", textColor:"#fff",    logo:logoRightel as string},
} as const;
type OperatorId = keyof typeof OPERATORS;
type Operator = (typeof OPERATORS)[OperatorId];
function detectOperator(phone:string):Operator|null{
  const n=phone.replace(/^0/,"").slice(0,3);
  const map:Record<string,OperatorId>={
    "910":"mci","911":"mci","912":"mci","913":"mci","914":"mci","915":"mci",
    "916":"mci","917":"mci","918":"mci","919":"mci","990":"mci","991":"mci",
    "992":"mci","932":"mci","931":"mci",
    "930":"irancell","933":"irancell","935":"irancell","936":"irancell",
    "937":"irancell","938":"irancell","939":"irancell","901":"irancell",
    "902":"irancell","903":"irancell","904":"irancell","905":"irancell","941":"irancell",
    "920":"rightel","921":"rightel","922":"rightel",
  };
  const id=map[n];return id?OPERATORS[id]:null;
}
function OperatorBadge({op,size="md"}:{op:Operator;size?:"sm"|"md"}){
  const pad=size==="sm"?"4px 8px":"6px 12px";const fs=size==="sm"?11:13;const imgSz=size==="sm"?18:22;
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,background:op.color+"22",border:`1.5px solid ${op.color}66`,borderRadius:20,padding:pad,fontSize:fs,fontWeight:700,fontFamily:"Vazirmatn",flexShrink:0,color:"var(--text-primary)"} as React.CSSProperties}>
    <img src={op.logo} alt={op.name} style={{width:imgSz,height:imgSz,objectFit:"contain",flexShrink:0}} decoding="async"/>
    {op.name}
  </span>;
}
function BankLogo({bankName,size=42,rounded=12}:{bankName:string;size?:number;rounded?:number}){
  const info=getBankInfo(bankName);
  if(info?.logo){
    return <div style={{width:size,height:size,borderRadius:rounded,overflow:"hidden",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"1px solid rgba(0,0,0,0.08)"}}>
      <img src={info.logo} alt={bankName} style={{width:"80%",height:"80%",objectFit:"contain"}} decoding="async"/>
    </div>;
  }
  return <div style={{width:size,height:size,borderRadius:rounded,background:info?.color||"#2d6b4a",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:size*0.38,fontFamily:"Vazirmatn",flexShrink:0}}>
    {bankName.slice(0,1)}
  </div>;
}

// ─── API ──────────────────────────────────────────────────────────────────────
async function fetchUSDTRate():Promise<number|null>{
  try{const r=await fetch(`${ANSARRAF_API_BASE}/api/v1/market-data/quotes?symbol=USDT/TOMAN`,{signal:AbortSignal.timeout(7000),cache:"no-store"});if(!r.ok)throw new Error("market_data_unavailable");const d=await r.json();const live=d?.quotes?.filter((q:any)=>!q.stale&&Number(q.lastPrice)>0);const preferred=live?.find((q:any)=>q.provider==="wallex")??live?.[0];return preferred?Number(preferred.lastPrice):null;}catch{return null}
}
type SarrafAssetRecord={id:number|string;symbol:string;status?:string};async function anpardazRequest(path:string,init:RequestInit={}){const token=window.localStorage.getItem("anpardaz:accessToken")??"";if(!ANPARDAZ_API_BASE)throw new Error("anpardaz_api_unconfigured");const headers=new Headers(init.headers);headers.set("accept","application/json");if(token)headers.set("authorization",`Bearer ${token}`);if(init.body&&!headers.has("content-type"))headers.set("content-type","application/json");const res=await fetch(`${ANPARDAZ_API_BASE}${path}`,{...init,headers,cache:"no-store"});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(String(data?.error??"anpardaz_request_failed"));return data;}
type UserSettings={theme:"dark"|"light";notificationsEnabled:boolean;keySoundEnabled:boolean;fontScale:number;pinEnabled:boolean;updatedAt:string};
async function userSettingsRequest(path:string,init:RequestInit={}){
  const token=window.localStorage.getItem("anpardaz:accessToken")??"";
  if(!ANPARDAZ_API_BASE)throw new Error("anpardaz_api_unconfigured");
  const headers=new Headers(init.headers);
  headers.set("accept","application/json");
  if(token)headers.set("authorization",`Bearer ${token}`);
  if(init.body&&!headers.has("content-type"))headers.set("content-type","application/json");
  const res=await fetch(`${ANPARDAZ_API_BASE}${path}`,{...init,headers,cache:"no-store"});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(String(data?.error??"user_settings_request_failed"));
  return data as {settings?:UserSettings;pinEnabled?:boolean};
}

async function anpardazCards():Promise<BankCard[]>{
  const d=await anpardazRequest("/api/v1/cards");
  return Array.isArray(d?.cards)?d.cards.map((x:any)=>({id:String(x.id),number:String(x.number??"•••• "+String(x.last4??"")),bank:String(x.bank_name??"بانک"),holderName:String(x.holder_name??""),registrationStatus:String(x.registration_status??"verified")})): [];
}
async function anpardazDeleteCard(cardId:string){return anpardazRequest("/api/v1/cards/"+encodeURIComponent(cardId),{method:"DELETE"});}
async function ansarrafVerifiedProfile(){return sarrafRequest("/api/v1/kyc/profile");}
async function startShaparakCardRegistration():Promise<{sessionId:string;authorizationUrl:string}>{
  return anpardazRequest("/api/v1/cards/registration/start",{method:"POST"});
}
async function shaparakRegistrationStatus(sessionId:string){
  return anpardazRequest("/api/v1/cards/registration/"+encodeURIComponent(sessionId));
}
async function anpardazCardBalance(cardNumber:string,otp:string,cvv2:string,expiryMonth:string,expiryYear:string){return anpardazRequest("/api/v1/cards/balance",{method:"POST",body:JSON.stringify({cardNumber,otp,cvv2,expiryMonth,expiryYear,idempotencyKey:crypto.randomUUID()})});}
async function anpardazTransfer(destinationExternal:string,amount:number,currency:string,description:string){return anpardazRequest("/api/v1/transfers",{method:"POST",body:JSON.stringify({destinationExternal,amount:String(amount),currency,description,idempotencyKey:crypto.randomUUID()})});}
async function sarrafRequest(path:string,init:RequestInit={}){const token=window.localStorage.getItem("anpardaz:accessToken")??"";if(!ANSARRAF_API_BASE)throw new Error("ansarraf_api_unconfigured");const headers=new Headers(init.headers);headers.set("accept","application/json");if(token)headers.set("authorization",`Bearer ${token}`);if(init.body&&!headers.has("content-type"))headers.set("content-type","application/json");const r=await fetch(`${ANSARRAF_API_BASE}${path}`,{...init,headers,cache:"no-store"});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(String(data?.error??"ansarraf_request_failed"));return data;}async function sarrafAssets():Promise<SarrafAssetRecord[]>{const d=await sarrafRequest("/api/v1/assets");return Array.isArray(d?.assets)?d.assets:[]}function sarrafAssetId(assets:SarrafAssetRecord[],symbol:string){const aliases=symbol==="TMN"?["TMN","TOMAN","IRT","IRR"]:symbol==="USDT"?["USDT"]:[symbol];const a=assets.find(x=>aliases.includes(String(x.symbol).toUpperCase())&&x.status!=="disabled");if(!a)throw new Error(`asset_not_available:${symbol}`);return a.id;}async function sarrafPlaceOrder(baseSymbol:string,quoteSymbol:string,side:"buy"|"sell",orderType:"market"|"limit",quantity:number,price?:number,quoteAmount?:number){const assets=await sarrafAssets();const body:any={baseAssetId:sarrafAssetId(assets,baseSymbol),quoteAssetId:sarrafAssetId(assets,quoteSymbol),side,orderType,quantity:String(quantity),idempotencyKey:crypto.randomUUID()};if(orderType==="limit")body.price=String(price);else if(side==="buy")body.quoteAmount=String(quoteAmount??0);return sarrafRequest("/api/v1/orders",{method:"POST",body:JSON.stringify(body)});}async function sarrafWalletMap():Promise<Record<string,number>>{const d=await sarrafRequest("/api/v1/wallets");const out:Record<string,number>={};for(const w of d?.wallets??[])out[String(w.symbol).toUpperCase()]=Number(w.available_balance??0);return out;}async function sarrafOrders():Promise<any[]>{const d=await sarrafRequest("/api/v1/orders");return Array.isArray(d?.orders)?d.orders:[]}
async function sarrafOrderBook(symbol:string){const d=await sarrafRequest(`/api/v1/orderbook?symbol=${encodeURIComponent(symbol)}&limit=20`);return {bids:Array.isArray(d?.bids)?d.bids:[],asks:Array.isArray(d?.asks)?d.asks:[]};}
async function sarrafSubmitKyc(payload:{fullName:string;nationalId:string;mobile:string;birthDate:string}){return sarrafRequest("/api/v1/kyc",{method:"POST",body:JSON.stringify(payload)});}

async function sendOTP(phone:string,code:string):Promise<{ok:boolean;devCode?:string}>{
  if(!KAVENEGAR_KEY)return{ok:false,devCode:code};
  try{const url=`https://api.kavenegar.com/v1/${KAVENEGAR_KEY}/sms/send.json`;const body=new URLSearchParams({receptor:phone,message:`کد تأیید آن‌پرداز: ${code}`,sender:"10004346"});const r=await fetch(url,{method:"POST",body});const d=await r.json();return{ok:d.return?.status===200}}catch{return{ok:false,devCode:code}}
}

// ─── Utilities ────────────────────────────────────────────────────────────────
const toFaDigits=(value:string)=>value.replace(/[0-9]/g,d=>"۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
const toLatinDigits=(value:string)=>value.replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
function normalizeIranianPhone(tel:string):string{
  const d=toLatinDigits(tel).replace(/[\s\-().]/g,"");
  if(d.startsWith("+98"))return "0"+d.slice(3);
  if(d.startsWith("0098"))return "0"+d.slice(4);
  if(d.startsWith("98")&&d.length===12)return "0"+d.slice(2);
  return d;
}
const fa=(v:number|string)=>new Intl.NumberFormat("fa-IR").format(Number(v));
const faFixed=(v:number,d=4)=>new Intl.NumberFormat("fa-IR",{minimumFractionDigits:d,maximumFractionDigits:d}).format(v);
function genOTP(){return String(Math.floor(100000+Math.random()*900000))}
function genId(){return"TX"+Date.now().toString(36).toUpperCase()}

// ─── Mobile Back-Button Stack ──────────────────────────────────────────────────
// Screens push a handler when mounted; the topmost handler wins on back-press.

// ─── FloatInput — RTL floating-label input ────────────────────────────────────
function FloatInput({label,value,onChange,type="text",inputMode,dir="rtl",maxLength,readOnly,autoFocus,onFocus,onBlur,className,style,suffix,multiline}:{label:string;value:string;onChange?:(v:string)=>void;type?:string;inputMode?:React.HTMLAttributes<HTMLInputElement>["inputMode"];dir?:"rtl"|"ltr";maxLength?:number;readOnly?:boolean;autoFocus?:boolean;onFocus?:()=>void;onBlur?:()=>void;className?:string;style?:React.CSSProperties;suffix?:string;multiline?:boolean}){
  const hasVal=value.length>0;
  const sharedProps={className:`fl-input${dir==="ltr"?" ltr":""}${className?" "+className:""}`,value,onChange:onChange?((e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>onChange(e.target.value)):undefined,readOnly,maxLength,dir,placeholder:" ",autoFocus,onFocus,onBlur};
  return(
    <div className={`fl-wrap${hasVal?" fl-has-value":""}${suffix?" fl-has-suffix":""}${multiline?" fl-multiline":""}`} style={style}>
      {multiline
        ?<textarea {...sharedProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>} rows={3}/>
        :<input {...sharedProps as React.InputHTMLAttributes<HTMLInputElement>} type={type} inputMode={inputMode} style={suffix?{paddingLeft:suffix.length*10+16}:undefined}/>
      }
      {suffix&&<span className="fl-suffix">{suffix}</span>}
      <label className="fl-label">{label}</label>
    </div>
  );
}

// ─── Contacts picker (Contact Picker API → Capacitor → fallback) ──────────────
async function pickContactPhone():Promise<string|null>{
  // Standard Contact Picker API (Chrome Android 80+, Edge Android)
  const cm=(navigator as any).contacts;
  if(cm&&typeof cm.select==="function"){
    try{
      const res=await cm.select(["tel"],{multiple:false});
      const tel=res?.[0]?.tel?.[0];
      if(tel)return normalizeIranianPhone(String(tel));
      return null; // user cancelled
    }catch{return null;}
  }
  // Capacitor native Contacts plugin (if installed)
  const cap=(window as any).Capacitor;
  if(cap?.isNativePlatform?.()){
    try{
      const plugin=cap.Plugins?.Contacts;
      if(plugin){
        const perm=await plugin.requestPermissions?.().catch(()=>null);
        if(!perm||perm.contacts==="granted"||perm.contacts==="prompt"){
          const res=await plugin.pickContact?.().catch(()=>null);
          const tel=res?.contact?.phones?.[0]?.number;
          if(tel)return normalizeIranianPhone(String(tel));
          return null;
        }
      }
    }catch{/* plugin not available */}
  }
  // Last resort: use a hidden <input type="tel"> to trigger native phone picker
  return new Promise(resolve=>{
    const inp=document.createElement("input");
    inp.type="tel";inp.style.cssText="position:fixed;opacity:0;pointer-events:none;top:0;left:0;width:1px;height:1px";
    document.body.appendChild(inp);
    let done=false;
    const finish=(v:string|null)=>{if(done)return;done=true;document.body.removeChild(inp);resolve(v)};
    inp.addEventListener("change",()=>finish(inp.value?normalizeIranianPhone(inp.value):null));
    inp.addEventListener("blur",()=>setTimeout(()=>finish(inp.value?normalizeIranianPhone(inp.value):null),300));
    inp.focus();inp.click();
    setTimeout(()=>finish(null),30000);
  });
}

const getCryptoBal=(u:UserData,sym:string)=>sym==="USDT"?u.usdtBalance:(u.cryptoBalances?.[sym]??0);
const withCryptoBal=(u:UserData,sym:string,amt:number):UserData=>sym==="USDT"?{...u,usdtBalance:amt}:{...u,cryptoBalances:{...(u.cryptoBalances??{}),[sym]:amt}};
function isBSCAddress(s:string){return/^0x[0-9a-fA-F]{40}$/.test(s.trim())}
function isTRC20Address(s:string){return/^T[A-Za-z1-9]{33}$/.test(s.trim())}
function isIranPhone(s:string){return/^09[0-9]{9}$/.test(toLatinDigits(s).trim())}
function playChime(){try{const c=new AudioContext();[523,659,784,1047].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=f;o.type="sine";g.gain.setValueAtTime(0,c.currentTime+i*0.11);g.gain.linearRampToValueAtTime(0.15,c.currentTime+i*0.11+0.03);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.11+0.42);o.start(c.currentTime+i*0.11);o.stop(c.currentTime+i*0.11+0.5)})}catch{}}
function numToFaWords(n:number):string{
  if(!n||isNaN(n))return"";
  const ONES=["","یک","دو","سه","چهار","پنج","شش","هفت","هشت","نه","ده","یازده","دوازده","سیزده","چهارده","پانزده","شانزده","هفده","هجده","نوزده"];
  const TENS=["","","بیست","سی","چهل","پنجاه","شصت","هفتاد","هشتاد","نود"];
  const H=["","صد","دویست","سیصد","چهارصد","پانصد","ششصد","هفتصد","هشتصد","نهصد"];
  function u3(x:number):string{if(x===0)return"";const pts:string[]=[];if(x>=100){pts.push(H[Math.floor(x/100)]);x%=100}if(x>0){if(x<20)pts.push(ONES[x]);else{if(Math.floor(x/10))pts.push(TENS[Math.floor(x/10)]);if(x%10)pts.push(ONES[x%10])}}return pts.join(" و ")}
  const parts:string[]=[];
  const b=Math.floor(n/1_000_000_000);if(b){parts.push(u3(b)+" میلیارد");n%=1_000_000_000}
  const m=Math.floor(n/1_000_000);if(m){parts.push(u3(m)+" میلیون");n%=1_000_000}
  const k=Math.floor(n/1_000);if(k){parts.push(u3(k)+" هزار");n%=1_000}
  if(n)parts.push(u3(n));
  return parts.join(" و ");
}
function fmtCard(n:string){return n.replace(/(.{4})/g,"$1 ").trim()}
function fmtPrice(p:number):string{if(p>=1000)return fa(Math.round(p));if(p>=1)return faFixed(p,4);if(p>=0.001)return faFixed(p,6);return faFixed(p,8)}

// ─── Icon ─────────────────────────────────────────────────────────────────────
function Icon({name,size=22,stroke=1.8}:{name:string;size?:number;stroke?:number}){
  const P:Record<string,ReactNode>={
    bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    eye:<><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></>,
    "eye-off":<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>,
    sun:<><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
    moon:<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
    plus:<path d="M12 5v14M5 12h14"/>,
    send:<><path d="m21 3-7 18-4-8-7-4 18-6Z"/><path d="m10 13 4-4"/></>,
    swap:<><path d="M7 7h12l-3-3M17 17H5l3 3"/></>,
    receipt:<><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/></>,
    home:<><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><path d="M9 21v-6h6v6"/></>,
    chart:<><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-6"/></>,
    user:<><circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 3.4-6 8-6s7.2 2 8 6"/></>,
    arrow:<path d="m14 6-6 6 6 6"/>,
    "arrow-left":<path d="m10 18 6-6-6-6"/>,
    check:<path d="m5 12 4 4L19 6"/>,
    clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    camera:<><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>,
    shield:<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    info:<><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></>,
    lock:<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    x:<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    credit:<><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
    phone:<><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.55 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></>,
    question:<><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></>,
    wallet:<><path d="M4 7a2 2 0 0 1 2-2h12v14H6a2 2 0 0 1-2-2V7Z"/><path d="M18 9h3v7h-3a2 2 0 0 1 0-4h3"/></>,
    chevron:<path d="m9 18 6-6-6-6"/>,
    delete:<path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/>,
    menu:<><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></>,
    wifi:<><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></>,
    car:<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><path d="m6 7 2-4h8l2 4"/></>,
    "shield-check":<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></>,
    "file-text":<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></>,
    gavel:<><path d="M14 13 8.5 7.5"/><path d="m4.5 20.5 3-3"/><path d="M10.5 7.5 6.5 3.5a1.41 1.41 0 0 0-2 2L8.5 9.5"/><path d="M14 13l4 4a1.41 1.41 0 0 1-2 2l-4-4"/></>,
    building:<><rect x="2" y="2" width="20" height="20"/><path d="M9 22v-4h6v4M2 9h20M2 15h20M9 2v20M15 2v20"/></>,
    "trending-up":<><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/></>,
    settings:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    "log-out":<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    search:<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    contacts:<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    deposit:<><path d="M12 22V12"/><path d="m7 17 5 5 5-5"/><path d="M20 6H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z"/></>,
    heart:<><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>,
    moto:<><path d="M5 17H3a2 2 0 0 1-2-2v-2h9M9 5v8"/><circle cx="15" cy="17" r="3"/><circle cx="5" cy="17" r="3"/><path d="M9 5H6l-3 5M15 7h5l2 5M17 7l-2 5"/></>,
    upload:<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{P[name]??<circle cx="12" cy="12" r="10"/>}</svg>;
}

// ─── Shared Brand Loader ──────────────────────────────────────────────────────
// Single reusable component — same animation at any size.
// size=104 → full overlay; size=28 → inside a button.
function BrandLoader({size=104}:{size?:number}){
  const r=size/100;
  const border=(n:number)=>Math.max(1.5,Math.round(n*r));
  return <span style={{position:"relative",width:size,height:size,display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0} as React.CSSProperties}>
    <span style={{position:"absolute",inset:0,borderRadius:"50%",border:`${border(3)}px solid transparent`,borderTopColor:"#00D6B0",borderRightColor:"rgba(0,214,176,0.35)",animation:"procSpin 1.1s linear infinite"} as React.CSSProperties}/>
    <span style={{position:"absolute",inset:Math.round(14*r),borderRadius:"50%",border:`${border(2)}px solid transparent`,borderBottomColor:"rgba(0,214,176,0.6)",borderLeftColor:"rgba(0,214,176,0.18)",animation:"procSpin 0.72s linear infinite reverse"} as React.CSSProperties}/>
    {size>=60&&<span style={{position:"absolute",inset:-Math.round(8*r),borderRadius:"50%",background:"radial-gradient(circle,rgba(0,214,176,0.18) 0%,transparent 65%)",animation:"procGlow 2s ease-in-out infinite"} as React.CSSProperties}/>}
    <img src={anPardazLogo} style={{width:Math.round(62*r),height:Math.round(62*r),borderRadius:Math.round(18*r),objectFit:"contain",position:"relative",zIndex:1} as React.CSSProperties} alt="آن‌پرداز"/>
  </span>
}
function AnPardazLoadingOverlay({text="در حال پردازش...",badge}:{text?:string;badge?:React.ReactNode}){
  return createPortal(<div className="proc-overlay"><BrandLoader size={104}/>{badge&&<div style={{marginTop:14,marginBottom:-4}}>{badge}</div>}<div className="proc-text" style={{marginTop:8}}>{text}</div></div>, document.body);
}

type ReceiptData = { title:string; amount?:string; destination?:string; status?:"success"|"failed"; detail?:string };
// ── Receipt design system helpers ──

function parseDescGroups(detail:string):[string,string][]|null{
  if(!detail||!detail.includes(" · "))return null;
  const parts=detail.split(" · ").map(s=>s.trim()).filter(Boolean);
  if(parts.length<2)return null;
  const phoneIdx=parts.findIndex(p=>/^[۰0]?[۹9][\d۰-۹]{9,10}$/.test(p.replace(/[\s\-]/g,"")));
  const amountIdx=parts.findIndex(p=>/ریال|تومان/.test(p));
  if(phoneIdx>=0&&parts.length>=3){
    const g:[string,string][]=[];
    if(phoneIdx>0)g.push(["ارائه‌دهنده",parts[0]]);
    const pkg=parts.slice(1,phoneIdx).join(" · ");
    if(pkg)g.push(["بسته",pkg]);
    g.push(["شماره همراه",parts[phoneIdx]]);
    if(amountIdx>=0&&amountIdx!==phoneIdx)g.push(["مبلغ",parts[amountIdx]]);
    return g.length>=2?g:null;
  }
  return null;
}

function ReceiptFireworks({active}:{active:boolean}){
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    if(!active)return;
    const cv=ref.current;if(!cv)return;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    cv.width=cv.offsetWidth*dpr;cv.height=cv.offsetHeight*dpr;
    const ctx=cv.getContext("2d")!;ctx.scale(dpr,dpr);
    const W=cv.offsetWidth,H=cv.offsetHeight,cx=W/2,cy=H/2;
    type P={x:number;y:number;vx:number;vy:number;r:number;c:string;a:number;d:number};
    const clrs=["#00CC8F","#00E5A0","#33FFB5","#80FFD8","#FFFFFF","#B3FFEA"];
    const ps:P[]=[];
    for(let b=0;b<9;b++){
      const ang=(b/9)*Math.PI*2-Math.PI/2,dist=50+(b%2)*22;
      const bx=cx+Math.cos(ang)*dist,by=cy+Math.sin(ang)*dist;
      for(let i=0;i<10;i++){
        const a=Math.random()*Math.PI*2,spd=1.2+Math.random()*3.5;
        ps.push({x:bx,y:by,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-0.5,r:1.2+Math.random()*2.8,c:clrs[Math.floor(Math.random()*clrs.length)],a:1,d:0.011+Math.random()*0.015});
      }
      for(let i=0;i<4;i++){
        const a=Math.random()*Math.PI*2;
        ps.push({x:bx,y:by,vx:Math.cos(a)*(4+Math.random()*5),vy:Math.sin(a)*(4+Math.random()*5),r:0.7,c:"#FFFFFF",a:1,d:0.02+Math.random()*0.02});
      }
    }
    let raf:number;
    const frame=()=>{
      ctx.clearRect(0,0,W,H);let alive=false;
      for(const p of ps){
        if(p.a<=0)continue;alive=true;
        p.x+=p.vx;p.y+=p.vy;p.vy+=0.07;p.vx*=0.97;p.vy*=0.97;p.a-=p.d;
        ctx.save();ctx.globalAlpha=Math.max(0,p.a);ctx.fillStyle=p.c;
        if(p.r>1.5){ctx.shadowColor=p.c;ctx.shadowBlur=5;}
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.restore();
      }
      if(alive)raf=requestAnimationFrame(frame);
    };
    raf=requestAnimationFrame(frame);
    return()=>cancelAnimationFrame(raf);
  },[active]);
  return active?<canvas ref={ref} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:10}}/>:null;
}

function TransactionReceipt({data,onClose}:{data:ReceiptData;onClose:()=>void}){
  const isFailed=data.status==="failed";
  const isPending=false;
  const [exiting,setExiting]=useState(false);
  const [phase,setPhase]=useState(0);
  const [captured,setCaptured]=useState(false);
  const [toast,setToast]=useState("");
  const [copyDone,setCopyDone]=useState(false);
  const sheetRef=useRef<HTMLDivElement>(null);
  const cachedPng=useRef<string|null>(null);
  const trackId=useRef(toFaDigits(String(Date.now()).slice(-8))).current;
  const timeStr=useRef(new Intl.DateTimeFormat("fa-IR",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date())).current;

  useEffect(()=>{
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
  },[]);

  const close=()=>{setExiting(true);setTimeout(onClose,320);};
  const descGroups=parseDescGroups(data.detail||"");
  const rows:[string,string][]=[
    ...(data.destination?[["مقصد/مبدا",data.destination] as [string,string]]:[]),
    ["تاریخ و ساعت",timeStr],
    ["کد پیگیری",trackId],
    ...(!descGroups&&data.detail?[["توضیحات",data.detail] as [string,string]]:[]),
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
    const txt=[`آن‌پرداز — ${data.title}`,`وضعیت: ${isFailed?"ناموفق":isPending?"در انتظار":"موفق"}`,data.amount?`مبلغ: ${data.amount}`:"",`تاریخ: ${timeStr}`,`کد پیگیری: ${trackId}`].filter(Boolean).join("
");
    navigator.share?navigator.share({title:"رسید آن‌پرداز",text:txt}).catch(()=>{}):navigator.clipboard?.writeText(txt).catch(()=>{});
  };
  const handleCopy=()=>{
    const lines=["رسید تراکنش","─────────────────",...(data.title?[`نوع تراکنش: ${data.title}`]:[]),...(data.amount?[`مبلغ: ${toFaDigits(data.amount)}`]:[]),...(data.destination?[`مقصد/مبدا: ${data.destination}`]:[]),`وضعیت: ${isFailed?"ناموفق":isPending?"در انتظار":"موفق"}`,`تاریخ و ساعت: ${timeStr}`,`کد پیگیری: ${trackId}`,...(data.detail?[`توضیحات: ${data.detail}`]:[]),"─────────────────","آن پرداز پیشرو در خدمات بانکی و دارایی های دیجیتال"];
    navigator.clipboard?.writeText(lines.join("
")).then(()=>{setCopyDone(true);setToast("رسید کپی شد");setTimeout(()=>{setToast("");setCopyDone(false);},2000);}).catch(()=>{});
  };

  const heroMod=isFailed?" rds-hero-failed":isPending?" rds-hero-pending":"";
  const sepMod=isFailed?" rds-failed":isPending?" rds-pending":"";
  const statusText=isFailed?"ناموفق":isPending?"در انتظار":"موفق";
  const statusMod=isFailed?" rds-failed":isPending?" rds-pending":"";
  const heroTitle=isFailed?"تراکنش ناموفق بود":isPending?"تراکنش در حال پردازش":"تراکنش با موفقیت انجام شد";
  const heroSub=isFailed?"متأسفانه این تراکنش تکمیل نشد، لطفاً دوباره تلاش کنید":isPending?"تراکنش شما در حال بررسی در شبکه بانکی است":"تراکنش شما با موفقیت در شبکه بانکی تأیید شد";
  const amountStr=data.amount?data.amount.replace(/\s*ریال\s*$/,"").trim():null;

  return(
    <>
      {/* Border sweep overlay — fires animation on mount */}
      {phase>=1&&phase<=2&&(
        <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:8600}}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{display:"block"}}>
            <path d="M 50 0 L 100 0 L 100 100 L 0 100 L 0 0 L 50 0"
              fill="none" stroke="#00CC8F" strokeWidth="3" strokeLinecap="round"
              vectorEffect="non-scaling-stroke" pathLength="1"
              className="rds-sweep-path"/>
          </svg>
        </div>
      )}
      {/* Main receipt screen */}
      <div className={`rds-screen${exiting?" rds-exiting":""}`} dir="rtl" ref={sheetRef}>
        {/* Hero */}
        <div className={`rds-hero${heroMod}`}>
          <div className="rds-topbar">
            <img src={anPardazLogo} alt="آن‌پرداز" className="rds-app-logo"/>
            <h1 className="rds-app-name">آن‌پرداز</h1>
            <button className="rds-close-btn" onClick={close}>بستن</button>
          </div>
          <div className="rds-check-area" style={{position:"relative"}}>
            <div className={`rds-check-container${phase>=2?" rds-check-visible":""}`}>
              <div className={`rds-check-ring${phase>=3?" rds-check-filled":""}`}>
                {!isFailed&&!isPending?(
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
            <ReceiptFireworks active={phase>=4&&phase<5}/>
          </div>
          <div className="rds-hero-text" style={{opacity:phase>=2?1:0,transition:"opacity 0.45s ease 0.2s"}}>
            <h2 className="rds-success-title">{heroTitle}</h2>
            <p className="rds-success-sub">{heroSub}</p>
            {amountStr&&(
              <div className="rds-amount-display">
                <span className="rds-amount-value">{toFaDigits(amountStr)}</span>
                <span className="rds-amount-unit">ریال</span>
              </div>
            )}
          </div>
        </div>
        {/* Wavy separator */}
        <div className={`rds-ticket-sep${sepMod}`}>
          <svg width="100%" height="18" viewBox="0 0 390 18" preserveAspectRatio="none">
            <path d="M0 0 Q9.75 12 19.5 0 Q29.25 12 39 0 Q48.75 12 58.5 0 Q68.25 12 78 0 Q87.75 12 97.5 0 Q107.25 12 117 0 Q126.75 12 136.5 0 Q146.25 12 156 0 Q165.75 12 175.5 0 Q185.25 12 195 0 Q204.75 12 214.5 0 Q224.25 12 234 0 Q243.75 12 253.5 0 Q263.25 12 273 0 Q282.75 12 292.5 0 Q302.25 12 312 0 Q321.75 12 331.5 0 Q341.25 12 351 0 Q360.75 12 370.5 0 Q380.25 12 390 0 L390 18 L0 18 Z" fill="var(--app-bg)"/>
          </svg>
        </div>
        {/* Scroll area */}
        <div className="rds-scroll" style={{opacity:phase>=1?1:0,transition:"opacity 0.55s ease"}}>
          {toast&&<div className="rds-toast">{toast}</div>}
          <div className="rds-status-row">
            <span className={`rds-status-badge${statusMod}`}><span className="rds-status-dot"/>{statusText}</span>
            {data.title&&<span className="rds-tx-type-label">{data.title}</span>}
          </div>
          <div className="rds-info-card">
            {rows.map(([k,v],i)=>(
              <div key={i} className="rds-info-row" style={{opacity:phase>=3?1:0,transform:phase>=3?"none":"translateX(10px)",transition:`opacity 0.3s ease ${0.05*i}s,transform 0.3s ease ${0.05*i}s`}}>
                <span className="rds-info-label">{k}</span>
                <span className={`rds-info-value${k==="کد پیگیری"?" ltr":""}`}>{v}</span>
              </div>
            ))}
          </div>
          {descGroups&&(
            <div className="rds-desc-card" style={{opacity:phase>=3?1:0,transition:"opacity 0.4s ease 0.2s"}}>
              <div className="rds-desc-header"><span className="rds-desc-header-label">جزئیات سرویس</span></div>
              {descGroups.map(([k,v],i)=>(
                <div key={i} className="rds-desc-row" style={{opacity:phase>=3?1:0,transition:`opacity 0.3s ease ${0.06+0.05*i}s`}}>
                  <span className="rds-desc-label">{k}</span>
                  <span className="rds-desc-value">{v}</span>
                </div>
              ))}
            </div>
          )}
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
        {/* Action bar */}
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

// ─── Bill Icon Components ─────────────────────────────────────────────────────
const BILL_IMG_MAP:Record<string,string>={
  hamrah: billImgHamrah as string,
  irancell: billImgIrancell as string,
  water: billImgAb as string,
  electric: billImgBrq as string,
  makhab: billImgMakhab as string,
  gas: billImgGaz as string,
};
function BillIcon({type,size=64}:{type:string;size?:number}){
  const icons:Record<string,{bg:string;fg:string;svg:React.ReactNode}>={
    hamrah:{
      bg:"#00853e",fg:"#fff",
      svg:<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* SIM card silhouette */}
        <rect x="16" y="12" width="24" height="32" rx="4" fill="#fff" opacity="0.15"/>
        <rect x="20" y="18" width="16" height="20" rx="2" fill="#fff" opacity="0.9"/>
        <rect x="22" y="22" width="12" height="12" rx="1.5" fill="#00853e"/>
        {/* signal bars */}
        <rect x="23" y="27" width="2.5" height="4" rx="1" fill="#fff"/>
        <rect x="26.5" y="25" width="2.5" height="6" rx="1" fill="#fff"/>
        <rect x="30" y="23" width="2.5" height="8" rx="1" fill="#fff"/>
      </svg>,
    },
    irancell:{
      bg:"#f5c800",fg:"#1a1200",
      svg:<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* SIM card */}
        <rect x="16" y="12" width="24" height="32" rx="4" fill="#1a1200" opacity="0.12"/>
        <rect x="20" y="18" width="16" height="20" rx="2" fill="#1a1200" opacity="0.85"/>
        <rect x="22" y="22" width="12" height="12" rx="1.5" fill="#f5c800"/>
        {/* signal bars */}
        <rect x="23" y="27" width="2.5" height="4" rx="1" fill="#1a1200"/>
        <rect x="26.5" y="25" width="2.5" height="6" rx="1" fill="#1a1200"/>
        <rect x="30" y="23" width="2.5" height="8" rx="1" fill="#1a1200"/>
      </svg>,
    },
    makhab:{
      bg:"#6b3fa0",fg:"#fff",
      svg:<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* telephone handset */}
        <path d="M20 18C20 18 18 22 18 28C18 34 20 38 20 38L24 34C24 34 22.5 31 22.5 28C22.5 25 24 22 24 22L20 18Z" fill="#fff" opacity="0.9"/>
        <path d="M36 18C36 18 38 22 38 28C38 34 36 38 36 38L32 34C32 34 33.5 31 33.5 28C33.5 25 32 22 32 22L36 18Z" fill="#fff" opacity="0.9"/>
        <circle cx="28" cy="28" r="5" fill="#fff" opacity="0.95"/>
        {/* WiFi waves */}
        <path d="M22 21C22 21 24.5 18.5 28 18.5C31.5 18.5 34 21 34 21" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
        <path d="M19 17C19 17 22.5 13.5 28 13.5C33.5 13.5 37 17 37 17" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.35"/>
      </svg>,
    },
    water:{
      bg:"#0277bd",fg:"#fff",
      svg:<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M28 12C28 12 16 25 16 32C16 39 21.4 44 28 44C34.6 44 40 39 40 32C40 25 28 12 28 12Z" fill="#fff" opacity="0.95"/>
        <path d="M28 12C28 12 16 25 16 32C16 39 21.4 44 28 44" fill="#fff" opacity="0.0"/>
        {/* inner highlight */}
        <path d="M24 30C23 27 24 23 26 21" stroke="#0277bd" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
      </svg>,
    },
    gas:{
      bg:"#e65100",fg:"#fff",
      svg:<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* flame */}
        <path d="M28 42C28 42 18 36 18 27C18 20 23 15 28 12C28 12 25 18 28 22C31 18 34 14 34 14C34 14 38 20 38 27C38 36 28 42 28 42Z" fill="#fff" opacity="0.95"/>
        <path d="M28 42C28 42 22 37 22 30C22 25 25 22 28 20C28 20 26 24 28 26.5C30 24 31.5 21 31.5 21C31.5 21 34 25 34 30C34 37 28 42 28 42Z" fill="#e65100" opacity="0.5"/>
      </svg>,
    },
    electric:{
      bg:"#e6a800",fg:"#1a1000",
      svg:<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* lightning bolt */}
        <path d="M31 12L18 30H28L25 44L38 24H28Z" fill="#1a1000" opacity="0.88"/>
      </svg>,
    },
  };
  const icon=icons[type];
  if(!icon){
    return <div style={{width:size,height:size,borderRadius:"22%",background:"var(--card-bg2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.35,color:"var(--text-muted)",flexShrink:0}}>؟</div>;
  }
  const scaled=Math.round(size*0.88);
  return(
    <div style={{width:size,height:size,borderRadius:Math.round(size*0.26),background:icon.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>
      <div style={{width:scaled,height:scaled,display:"flex",alignItems:"center",justifyContent:"center"}}>{icon.svg}</div>
    </div>
  );
}
function _BillIconLegacy_unused({type}:{type:string}){
  const d={bg:"#888",content:<text x="24" y="30" textAnchor="middle" fontSize="18" fill="white">؟</text>};
  return <svg viewBox="0 0 48 48" width={56} height={56} style={{display:"block",borderRadius:14}}>
    <rect width={48} height={48} rx={14} fill={d.bg}/>
    {d.content}
  </svg>;
}

// ─── Splash ───────────────────────────────────────────────────────────────────
function SplashScreen(){
  return <div className="splash-screen">
    <div className="splash-content">
      <div className="splash-logo-wrap">
        <div className="splash-glow" style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:0}}/>
        <img className="splash-logo-image" src={anPardazLogo} alt="لوگوی آن‌پرداز" style={{position:"relative",zIndex:2}} decoding="sync" fetchPriority="high"/>
        <div className="splash-logo-ring r1"/><div className="splash-logo-ring r2"/>
      </div>
      <div className="splash-name">
        <div className="splash-title">آن‌پرداز</div>
        <div className="splash-sub">نقل و انتقال آنی پول و دارایی های دیجیتال</div>
      </div>
    </div>
    <div className="splash-dots"><span/><span/><span/></div>
  </div>;
}

// ─── Privacy & Terms Full-Screen Page ────────────────────────────────────────
function PrivacyPage({onClose}:{onClose:()=>void}){
  const sections=[
    {id:"intro",title:null,body:[
      "این صفحه مربوط به شرکت «دیار آتیه گشا» است که از این پس در این متن با عنوان «دیار آتیه گشا»، «ما» یا «اپلیکیشن ما» از آن یاد می‌شود. ما خود را متعهد به حفاظت از حریم خصوصی کاربران و صیانت از اطلاعات آنها می‌دانیم.",
      "این ضوابط نحوه جمع‌آوری، استفاده، نگهداری و حفاظت از اطلاعات کاربران را توضیح می‌دهد. با استفاده از خدمات اپلیکیشن، کاربر تأیید می‌کند که این قوانین و ضوابط را مطالعه کرده و با آنها موافقت دارد.",
      "ما تلاش می‌کنیم اطلاعات لازم را به‌صورت شفاف در اختیار کاربران قرار دهیم تا بتوانند درباره استفاده از خدمات و اطلاعاتی که در اختیار اپلیکیشن قرار می‌دهند، تصمیم آگاهانه بگیرند.",
    ]},
    {id:"collection",title:"جمع‌آوری و استفاده از اطلاعات",body:[
      "برای ارائه خدمات سریع‌تر، دقیق‌تر و امن‌تر، ممکن است برخی اطلاعاتی را که کاربر مستقیماً در اپلیکیشن وارد می‌کند جمع‌آوری و پردازش کنیم.",
      "اطلاعاتی که دریافت می‌شود متناسب با نوع خدمت مورد استفاده خواهد بود و برای ارائه، تکمیل، پشتیبانی، امنیت و بهبود خدمات مورد استفاده قرار می‌گیرد.",
      "این اطلاعات ممکن است شامل نام و نام خانوادگی، شماره تلفن همراه، اطلاعات هویتی، اطلاعات مربوط به تراکنش‌ها و سایر اطلاعات مورد نیاز برای ارائه خدمات باشد.",
    ]},
    {id:"perms",title:"مجوزهای مورد نیاز",body:[
      "بسته به نوع خدماتی که کاربر استفاده می‌کند، ممکن است اپلیکیشن درخواست دسترسی به برخی امکانات دستگاه را داشته باشد.",
    ],items:[
      {label:"مخاطبین",text:"در برخی خدمات، کاربر ممکن است بتواند برای مخاطبین خود خدماتی مانند شارژ یا بسته اینترنت خریداری کند. در صورت استفاده از چنین قابلیتی، دسترسی به مخاطبین دستگاه ممکن است مورد نیاز باشد."},
      {label:"مکان",text:"در صورت ارائه خدماتی که به موقعیت جغرافیایی کاربر نیاز دارند، ممکن است دسترسی به موقعیت مکانی درخواست شود."},
      {label:"دوربین",text:"در برخی خدمات مانند اسکن اطلاعات، بارکد یا QR Code ممکن است دسترسی به دوربین مورد نیاز باشد."},
      {label:"عکس، رسانه و فایل",text:"در خدماتی که نیاز به بارگذاری مدارک، تصاویر یا فایل دارند، ممکن است دسترسی به تصاویر و فایل‌های دستگاه درخواست شود."},
    ],footer:"هر مجوز متناسب با نیاز همان خدمت درخواست خواهد شد."},
    {id:"security",title:"امنیت اطلاعات",body:[
      "ما تلاش می‌کنیم اطلاعات کاربران را با استفاده از اقدامات امنیتی مناسب محافظت کنیم.",
      "اطلاعات در زیرساخت‌های امن نگهداری شده و دسترسی به اطلاعات تا حد امکان محدود و کنترل‌شده خواهد بود.",
      "اطلاعات حساس کاربران با استفاده از روش‌های امنیتی مناسب محافظت می‌شوند.",
      "کاربر نیز موظف است اطلاعات ورود، رمزها و سایر اطلاعات امنیتی حساب خود را در اختیار اشخاص دیگر قرار ندهد.",
    ]},
    {id:"logdata",title:"اطلاعات رخدادها (Log Data)",body:[
      "در هنگام استفاده از اپلیکیشن، ممکن است برای شناسایی خطاها، بررسی مشکلات فنی، افزایش امنیت و بهبود عملکرد سرویس، برخی اطلاعات فنی مربوط به رخدادها ثبت شود.",
      "این اطلاعات ممکن است شامل شناسه دستگاه، سیستم‌عامل و نسخه آن، مدل دستگاه، آدرس IP، تاریخ و زمان رخداد و اطلاعات فنی مرتبط با سرویس مورد استفاده باشد.",
    ]},
    {id:"improve",title:"استفاده از اطلاعات برای بهبود خدمات",body:[
      "ممکن است برخی داده‌های غیرحساس و اطلاعات مربوط به نحوه استفاده از خدمات، برای تحلیل عملکرد سرویس‌ها و شناخت بهتر نیازهای کاربران مورد استفاده قرار گیرد.",
      "هدف از این کار، بهبود کیفیت، امنیت، عملکرد و تجربه کاربری خدمات است.",
      "در صورت استفاده از سرویس‌ها یا ابزارهای شخص ثالث، نحوه پردازش اطلاعات تابع ضوابط و سیاست‌های مربوط به آنها نیز خواهد بود.",
    ]},
    {id:"financial",title:"خدمات مالی و تراکنش‌ها",body:[
      "برای ارائه برخی خدمات مالی، پرداختی و صرافی، ممکن است مطابق الزامات قانونی و مقررات مراجع ذی‌صلاح، اطلاعات هویتی، بانکی، پرداختی و تراکنشی کاربر دریافت و پردازش شود.",
      "این اطلاعات برای احراز هویت، انجام تراکنش، کنترل‌های امنیتی، جلوگیری از سوءاستفاده و رعایت الزامات قانونی مورد استفاده قرار می‌گیرد.",
      "سوابق تراکنش‌ها ممکن است مطابق الزامات قانونی و عملیاتی برای مدت مورد نیاز نگهداری شوند.",
    ]},
    {id:"kyc",title:"احراز هویت",body:[
      "برای استفاده از برخی خدمات، ممکن است احراز هویت کاربر الزامی باشد.",
      "اطلاعات مورد نیاز برای احراز هویت، متناسب با نوع خدمت و الزامات قانونی دریافت و بررسی خواهد شد.",
      "در صورت عدم تکمیل یا تأیید احراز هویت، ممکن است دسترسی به برخی خدمات محدود شود.",
    ]},
    {id:"minors",title:"حریم خصوصی کودکان و نوجوانان",body:[
      "خدمات این اپلیکیشن برای استفاده افراد واجد شرایط قانونی و مطابق مقررات مربوطه طراحی شده است.",
      "در صورت مشخص شدن استفاده غیرمجاز افراد فاقد شرایط لازم، ممکن است دسترسی به حساب محدود یا متوقف شود.",
    ]},
    {id:"updates",title:"اطلاع‌رسانی و به‌روزرسانی قوانین",body:[
      "با توجه به توسعه خدمات و تغییر الزامات قانونی یا فنی، ممکن است این قوانین و ضوابط در آینده به‌روزرسانی شوند.",
      "نسخه جدید قوانین پس از انتشار در همین بخش در دسترس کاربران قرار خواهد گرفت.",
      "ادامه استفاده از خدمات پس از اعمال تغییرات، مطابق مقررات، به منزله پذیرش نسخه به‌روزشده خواهد بود.",
    ]},
    {id:"rights",title:"حقوق کاربر",body:[
      "کاربر می‌تواند در خصوص نحوه استفاده از خدمات، اطلاعات مربوط به حساب و مسائل مرتبط با حریم خصوصی خود از طریق راه‌های ارتباطی رسمی شرکت درخواست اطلاعات یا پشتیبانی کند.",
      "درخواست‌های کاربران مطابق قوانین و مقررات قابل اجرا بررسی خواهند شد.",
    ]},
  ] as const;
  return <div className="privacy-page" dir="rtl">
    <header className="privacy-header">
      <button className="privacy-close-btn" onClick={onClose} aria-label="بستن"><Icon name="x" size={20}/></button>
      <div className="privacy-header-title">
        <img src={anPardazLogo} alt="آن‌پرداز" className="privacy-logo"/>
        <h1>قوانین فعالیت و ضوابط حریم خصوصی</h1>
      </div>
    </header>
    <div className="privacy-body">
      <div className="privacy-badge">شرکت دیار آتیه گشا</div>
      {sections.map(s=><section key={s.id} className="privacy-section">
        {s.title&&<h2 className="privacy-section-title">{s.title}</h2>}
        {"body" in s&&(s as any).body.map((p:string,i:number)=><p key={i} className="privacy-para">{p}</p>)}
        {"items" in s&&(s as any).items&&<ul className="privacy-items">{(s as any).items.map((it:any,i:number)=><li key={i}><b>{it.label}:</b> {it.text}</li>)}</ul>}
        {"footer" in s&&(s as any).footer&&<p className="privacy-para privacy-footer-note">{(s as any).footer}</p>}
      </section>)}
      <section className="privacy-section privacy-contact">
        <h2 className="privacy-section-title">تماس با ما</h2>
        <div className="privacy-contact-grid">
          <div><span>شرکت</span><b>دیار آتیه گشا</b></div>
          <div><span>نام سایت</span><b>آن پرداز</b></div>
          <div><span>وب‌سایت</span><b dir="ltr">Anpardaz.ir</b></div>
          <div><span>ایمیل</span><b dir="ltr">info@Anpardaz.ir</b></div>
        </div>
      </section>
      <p className="privacy-update-note">آخرین به‌روزرسانی: ۱۴۰۴</p>
    </div>
  </div>;
}

// ─── Phone Login ──────────────────────────────────────────────────────────────
function PhoneLogin({onSend}:{onSend:(p:string,c:string,d?:string)=>void}){
  const [phone,setPhone]=useState("");const [loading,setLoading]=useState(false);const [err,setErr]=useState("");const [showPrivacy,setShowPrivacy]=useState(false);
  const submit=async()=>{const p=phone.trim();if(!isIranPhone(p)){setErr("شماره موبایل معتبر نیست.");return;}setErr("");setLoading(true);const code=genOTP();const res=await sendOTP(p,code);setLoading(false);onSend(p,code,res.devCode)};
  if(showPrivacy)return <PrivacyPage onClose={()=>setShowPrivacy(false)}/>;
  return <div className="auth-screen" dir="rtl">
    <div className="auth-logo-area">
      <img className="auth-logo-image" src={anPardazLogo} alt="لوگوی آن‌پرداز" decoding="sync" fetchPriority="high"/>
      <div style={{marginTop:12,textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,color:"#F4FAFC"}}>آن‌پرداز</div><div style={{fontSize:11,color:"#00D6B0",marginTop:4,lineHeight:1.5}}>نقل و انتقال آنی پول و دارایی های دیجیتال</div></div>
    </div>
    <div className="auth-card">
      <h2 style={{fontSize:18,fontWeight:800,color:"#F4FAFC",marginBottom:8}}>ورود به حساب</h2>
      <p style={{fontSize:13,color:"#888",marginBottom:20}}>شماره موبایل خود را وارد کنید. کد تأیید برایتان پیامک می‌شود.</p>
      <label style={{fontSize:13,color:"#aaa",display:"block",marginBottom:6}}>شماره موبایل</label>
      <div className={`auth-input-wrap ${err?"error":""}`}>
        <input className="auth-input ltr" value={toFaDigits(phone)} onChange={e=>setPhone(toLatinDigits(e.target.value))} placeholder="شماره موبایل" inputMode="tel" maxLength={11} dir="ltr" onKeyDown={e=>e.key==="Enter"&&submit()}/>
      </div>
      {err&&<p className="field-err">{err}</p>}
      <button className="primary-button" style={{marginTop:20}} onClick={submit} disabled={loading}>{loading?"در حال ارسال...":"دریافت کد تأیید"}</button>
      <button className="privacy-link-btn" onClick={()=>setShowPrivacy(true)}>پذیرش قوانین فعالیت و ضوابط حریم خصوصی</button>
    </div>
  </div>;
}

// ─── OTP Verify ───────────────────────────────────────────────────────────────
function OTPVerify({phone,correctCode,devCode,onVerified,onBack}:{phone:string;correctCode:string;devCode?:string;onVerified:(p:string)=>void;onBack?:()=>void}){
  const [digits,setDigits]=useState<string[]>(Array(6).fill(""));
  const [err,setErr]=useState("");
  const [resendLeft,setResendLeft]=useState(120);
  const refs=useRef<(HTMLInputElement|null)[]>([]);
  useEffect(()=>{if(resendLeft<=0)return;const t=setTimeout(()=>setResendLeft(v=>v-1),1000);return()=>clearTimeout(t)},[resendLeft]);
  const code=digits.join("");
  const doVerify=(d:string[])=>{
    const c=d.join("");
    if(c===correctCode){onVerified(phone);}
    else if(c.length===6){setErr("کد واردشده صحیح نیست؛ دوباره تلاش کنید.");}
  };
  const write=(i:number,v:string)=>{
    const d=toLatinDigits(v).replace(/\D/g,"");
    if(!d)return;
    const n=[...digits];
    d.slice(0,6-i).split("").forEach((x,j)=>{n[i+j]=x});
    setDigits(n);
    setErr("");
    const nextIdx=Math.min(5,i+d.length);
    refs.current[nextIdx]?.focus();
    doVerify(n);
  };
  const handleKeyDown=(i:number,e:React.KeyboardEvent<HTMLInputElement>)=>{
    if(e.key==="Backspace"){
      e.preventDefault();
      if(digits[i]){
        const n=[...digits];n[i]="";setDigits(n);setErr("");
      } else if(i>0){
        const n=[...digits];n[i-1]="";setDigits(n);setErr("");
        refs.current[i-1]?.focus();
      }
    } else if(e.key==="Enter"){
      doVerify(digits);
    }
  };
  return <div className="auth-screen" dir="rtl"><div className="auth-logo-area"><img className="auth-logo-image" src={anPardazLogo} alt="لوگوی آن‌پرداز"/></div><div className="auth-card">
    {onBack&&<button className="auth-back-btn" onClick={onBack}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>بازگشت</button>}
    <div className="auth-kicker">ورود امن</div><h2>کد تأیید</h2><p>کد شش‌رقمی ارسال‌شده به <b>{phone.replace(/\d/g,d=>"۰۱۲۳۴۵۶۷۸۹"[+d])}</b> را وارد کنید.</p>
    {devCode&&<div className="dev-code">حالت آزمایشی · کد ورود: <b>{devCode.replace(/\d/g,d=>"۰۱۲۳۴۵۶۷۸۹"[+d])}</b></div>}
    <div className="otp-boxes" dir="ltr">{digits.map((d,i)=><input key={i} ref={el=>{refs.current[i]=el}} value={d?"۰۱۲۳۴۵۶۷۸۹"[+d]:""} inputMode="numeric" aria-label={`رقم ${fa(i+1)} کد تأیید`} onChange={e=>write(i,e.target.value)} onKeyDown={e=>handleKeyDown(i,e)}/>)}</div>
    {err&&<p className="field-err">{err}</p>}<button className="primary-button" disabled={code.length!==6} onClick={()=>doVerify(digits)}>تأیید و ادامه</button><p className="auth-resend">{resendLeft>0?`ارسال دوباره کد تا ${fa(Math.ceil(resendLeft/60))} دقیقه دیگر`:<button onClick={()=>setResendLeft(120)}>ارسال دوباره کد</button>}</p>
  </div></div>;
}

function OnboardPhoto({onDone,onBack,initialAccepted}:{onDone:(p:string)=>void;onBack?:()=>void;initialAccepted?:boolean}){
  const [legal,setLegal]=useState(!initialAccepted),[scrolled,setScrolled]=useState(false),[accepted,setAccepted]=useState(initialAccepted||false),[recording,setRecording]=useState(false),[videoReady,setVideoReady]=useState(false),[cardReady,setCardReady]=useState(false),[preview,setPreview]=useState(""),[err,setErr]=useState("");
  const live=useRef<HTMLVideoElement>(null), recorder=useRef<MediaRecorder|null>(null), streamRef=useRef<MediaStream|null>(null), chunks=useRef<Blob[]>([]), videoFile=useRef<HTMLInputElement>(null), cardFile=useRef<HTMLInputElement>(null);
  useEffect(()=>()=>streamRef.current?.getTracks().forEach(track=>track.stop()),[]);
  const start=async()=>{try{setErr("");const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"user"},width:{ideal:720},height:{ideal:960}},audio:true});streamRef.current=stream;chunks.current=[];setRecording(true);requestAnimationFrame(async()=>{if(live.current){live.current.srcObject=stream;await live.current.play().catch(()=>setErr("نمایش دوربین آغاز نشد؛ مجوز دوربین را بررسی کنید."))}const r=new MediaRecorder(stream);recorder.current=r;r.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data)};r.onstop=()=>{setVideoReady(chunks.current.length>0);stream.getTracks().forEach(t=>t.stop());streamRef.current=null};r.start(300)})}catch{setErr("دسترسی دوربین یا میکروفن فعال نیست. لطفاً مجوزها را تأیید کنید یا ویدیو را بارگذاری کنید.")}};
  const stop=()=>{if(live.current&&live.current.videoWidth){const c=document.createElement("canvas");c.width=live.current.videoWidth;c.height=live.current.videoHeight;c.getContext("2d")?.drawImage(live.current,0,0);setPreview(c.toDataURL("image/jpeg",.75))}recorder.current?.stop();setRecording(false)};
  const content=<><h2 style={{fontSize:18,fontWeight:800,color:"var(--text-primary)",margin:"0 0 12px"}}>قوانین و شرایط استفاده از آن‌پرداز</h2><p style={{fontSize:15,lineHeight:1.9,color:"var(--text-secondary)",marginBottom:14}}>آن‌پرداز یک ابزار مدیریت مالی و دارایی دیجیتال است. افتتاح حساب و استفاده از خدمات، به معنی پذیرش این شرایط است.</p><h3 style={{fontSize:16,fontWeight:800,color:"var(--text-primary)",margin:"18px 0 8px"}}>احراز هویت و مسئولیت کاربر</h3><p style={{fontSize:15,lineHeight:1.9,color:"var(--text-secondary)",margin:"0 0 10px"}}>کاربر متعهد است اطلاعات هویتی، شماره همراه، کارت بانکی و مدارک خود را صحیح، متعلق به خود و به‌روز وارد کند. استفاده از حساب شخص دیگر، ارائه مدرک جعلی یا هرگونه تلاش برای دورزدن احراز هویت ممنوع است.</p><h3 style={{fontSize:16,fontWeight:800,color:"var(--text-primary)",margin:"18px 0 8px"}}>امنیت حساب</h3><p style={{fontSize:15,lineHeight:1.9,color:"var(--text-secondary)",margin:"0 0 10px"}}>حفظ رمز، کد تأیید و دسترسی دستگاه بر عهده کاربر است. آن‌پرداز هرگز رمز یا کد یک‌بارمصرف را از طریق تماس یا پیام درخواست نمی‌کند. در صورت مشاهده فعالیت مشکوک، خدمات می‌تواند موقتاً محدود شود.</p><h3 style={{fontSize:16,fontWeight:800,color:"var(--text-primary)",margin:"18px 0 8px"}}>تراکنش‌ها و دارایی دیجیتال</h3><p style={{fontSize:15,lineHeight:1.9,color:"var(--text-secondary)",margin:"0 0 10px"}}>کاربر پیش از تأیید هر انتقال باید مقصد، شبکه، مبلغ و کارمزد را بررسی کند. تراکنش‌های ثبت‌شده در شبکه بلاک‌چین پس از تأیید قابل بازگشت نیستند.</p><h3 style={{fontSize:16,fontWeight:800,color:"var(--text-primary)",margin:"18px 0 8px"}}>حریم خصوصی و مقررات</h3><p style={{fontSize:15,lineHeight:1.9,color:"var(--text-secondary)",margin:"0 0 10px"}}>اطلاعات فقط برای ارائه خدمات، کنترل تقلب و اجرای تکالیف قانونی پردازش می‌شود. آن‌پرداز در چارچوب قوانین جمهوری اسلامی ایران و الزامات مبارزه با پول‌شویی عمل می‌کند.</p><h3 style={{fontSize:16,fontWeight:800,color:"var(--text-primary)",margin:"18px 0 8px"}}>محدودیت‌ها</h3><p style={{fontSize:15,lineHeight:1.9,color:"var(--text-secondary)",margin:"0 0 10px"}}>استفاده از خدمات برای فعالیت غیرقانونی، پول‌شویی، تأمین مالی اقدامات ممنوع یا ایجاد اختلال در سامانه ممنوع است.</p><p style={{fontSize:14,lineHeight:1.9,color:"var(--text-muted)",marginTop:14}}>با ادامه این مسیر، اعلام می‌کنید که متن را به‌طور کامل مطالعه کرده و آن را می‌پذیرید.</p></>;
  return <><div className="auth-screen" dir="rtl"><div className="auth-card verification-card">
    {onBack&&<button className="auth-back-btn" onClick={onBack}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>بازگشت</button>}
    <div className="auth-kicker">مرحله ۱ از ۳ · احراز هویت</div>
    <h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",margin:"0 0 10px"}}>تأیید هویت تصویری</h2>
    <p style={{fontSize:15,color:"var(--text-muted)",lineHeight:1.8,marginBottom:16}}>متن تعهد را با صدای واضح بخوانید و در حین ضبط به دوربین نگاه کنید.</p>
    <div className="camera-stage">{recording?<><video ref={live} muted playsInline className="video-preview"/><div className="recording-badge"><i/> در حال ضبط</div></>:preview?<img src={preview} alt="پیش‌نمایش ویدیو"/>:<div className="camera-placeholder"><Icon name="camera" size={35}/><span style={{fontSize:13}}>پس از شروع ضبط، تصویر دوربین اینجا دیده می‌شود.</span></div>}<div className="pledge-overlay" style={{fontSize:13,lineHeight:2}}>«من … نام و نام خانوادگی … با اطلاع کامل از قوانین نرم‌افزار آن‌پرداز، حساب کاربری خود را افتتاح می‌کنم.»</div></div>
    <div className="verify-row" style={{paddingTop:16}}>
      <div><b style={{fontSize:15}}>ویدیوی تعهد</b><span style={{fontSize:13}}>{videoReady?"✓ ویدیو دریافت شد":"ضبط یا بارگذاری الزامی"}</span></div>
      {!videoReady?<button className="outline-button" style={{fontSize:14,padding:"10px 16px"}} onClick={recording?stop:start}>{recording?"پایان و ثبت ویدیو":"شروع ضبط ویدیو"}</button>:<span className="verify-ok">✓</span>}
    </div>
    <input ref={videoFile} type="file" accept="video/*" hidden onChange={e=>{if(e.target.files?.[0]){setVideoReady(true);setPreview("")}}}/>
    {!videoReady&&!recording&&<button className="outline-button" style={{width:"100%",marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:14,padding:"12px"}} onClick={()=>videoFile.current?.click()}><Icon name="upload" size={16}/> آپلود ویدئو</button>}
    <div className="verify-row">
      <div><b style={{fontSize:15}}>تصویر کارت ملی</b><span style={{fontSize:13}}>{cardReady?"✓ مدرک دریافت شد":"بارگذاری تصویر الزامی"}</span></div>
      <button className="outline-button" style={{fontSize:14,padding:"10px 16px"}} onClick={()=>cardFile.current?.click()}>{cardReady?"تغییر":"انتخاب فایل"}</button>
    </div>
    <input ref={cardFile} type="file" accept="image/*" hidden onChange={e=>{if(e.target.files?.[0])setCardReady(true)}}/>
    {err&&<p className="field-err" style={{fontSize:14}}>{err}</p>}
    <button className="primary-button" style={{marginTop:16,fontSize:15,padding:"15px"}} disabled={!accepted||!videoReady||!cardReady} onClick={()=>onDone(preview||"")}>ادامه</button>
  </div></div>
  {legal&&<div className="receipt-page" dir="rtl">
    <div className="receipt-page-header">
      <button className="back-btn" onClick={()=>setLegal(false)}><Icon name="arrow" size={20}/></button>
      <h2 style={{flex:1,textAlign:"center",fontSize:17,fontWeight:800}}>پیش از ادامه، قوانین را بخوانید</h2>
      <div style={{width:36}}/>
    </div>
    <div className="receipt-page-body">
      <div className="legal-modal">
        <div className="modal-head"><span style={{fontSize:12}}>مطالعه تا انتها الزامی است</span></div>
        <div className="legal-copy" style={{fontSize:15,lineHeight:1.9}} onScroll={e=>{const el=e.currentTarget;if(el.scrollTop+el.clientHeight>=el.scrollHeight-8)setScrolled(true)}}>{content}</div>
        <label className="legal-check" style={{fontSize:14}}><input type="checkbox" disabled={!scrolled} checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>قوانین و شرایط را خواندم و می‌پذیرم.</span></label>
        <button className="primary-button" style={{margin:"0 16px 16px",fontSize:15,padding:"14px"}} disabled={!accepted} onClick={()=>setLegal(false)}>پذیرش و ادامه</button>
      </div>
    </div>
  </div>}
  </>;
}

function OnboardProfile({onDone,onBack,initialData}:{onDone:(d:{name:string;family:string;nationalId:string;birthDate:string})=>void;onBack?:()=>void;initialData?:{name:string;family:string;nationalId:string;birthDate:string}}){
  const parseDate=(bd:string)=>{if(!bd)return{y:"۱۳۷۰",m:"۰۱",day:"۰۱"};const parts=bd.split("/");return{y:parts[0]||"۱۳۷۰",m:parts[1]||"۰۱",day:parts[2]||"۰۱"}};
  const [d,setD]=useState({name:initialData?.name||"",family:initialData?.family||"",nationalId:initialData?.nationalId||"",birthDate:initialData?.birthDate||""});
  const [err,setErr]=useState("");
  const initParsed=parseDate(initialData?.birthDate||"");
  const [date,setDate]=useState(initParsed);
  const [picker,setPicker]=useState<"y"|"m"|"day"|null>(null);
  const years=Array.from({length:90},(_,i)=>toFaDigits(String(1320+i)));
  const two=(n:number)=>toFaDigits(String(n).padStart(2,"0"));
  const title=picker==="y"?"انتخاب سال":picker==="m"?"انتخاب ماه":"انتخاب روز";
  const options=picker==="y"?years:picker==="m"?Array.from({length:12},(_,i)=>two(i+1)):Array.from({length:31},(_,i)=>two(i+1));
  const confirm=()=>{if(!d.name||!d.family||d.nationalId.length!==10){setErr("نام، نام خانوادگی و کد ملی ده‌رقمی الزامی است.");return}onDone({...d,birthDate:`${date.y}/${date.m}/${date.day}`})};
  return <><div className="auth-screen" dir="rtl" style={{justifyContent:"center",minHeight:"100dvh"}}>
    <div className="auth-card" style={{margin:"16px",padding:"24px 20px"}}>
      {onBack&&<button className="auth-back-btn" onClick={onBack}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>بازگشت</button>}
      <div className="auth-kicker" style={{fontSize:13,marginBottom:10}}>مرحله ۲ از ۳</div>
      <h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",margin:"0 0 20px"}}>اطلاعات شخصی</h2>
      <div className="form-stack" style={{gap:16}}>
        <label style={{fontSize:14,color:"var(--text-secondary)",display:"block",fontWeight:600}}>نام
          <input style={{marginTop:8,fontSize:16,padding:"13px 14px",borderRadius:14,width:"100%",boxSizing:"border-box",border:"1.5px solid var(--border-color)",background:"var(--input-bg)",color:"var(--text-primary)",outline:"none",fontFamily:"Vazirmatn"}} value={d.name} onChange={e=>setD(p=>({...p,name:e.target.value}))}/>
        </label>
        <label style={{fontSize:14,color:"var(--text-secondary)",display:"block",fontWeight:600}}>نام خانوادگی
          <input style={{marginTop:8,fontSize:16,padding:"13px 14px",borderRadius:14,width:"100%",boxSizing:"border-box",border:"1.5px solid var(--border-color)",background:"var(--input-bg)",color:"var(--text-primary)",outline:"none",fontFamily:"Vazirmatn"}} value={d.family} onChange={e=>setD(p=>({...p,family:e.target.value}))}/>
        </label>
        <label style={{fontSize:14,color:"var(--text-secondary)",display:"block",fontWeight:600}}>کد ملی
          <input
            style={{marginTop:8,fontSize:20,padding:"13px 14px",borderRadius:14,width:"100%",boxSizing:"border-box",border:"1.5px solid var(--border-color)",background:"var(--input-bg)",color:"var(--text-primary)",outline:"none",fontFamily:"Vazirmatn",letterSpacing:4,direction:"ltr",textAlign:"center"}}
            value={toFaDigits(d.nationalId)}
            inputMode="numeric"
            maxLength={10}
            dir="ltr"
            onKeyDown={e=>{const ok=["Backspace","Delete","Tab","ArrowLeft","ArrowRight","Home","End"];if(ok.includes(e.key)||e.ctrlKey||e.metaKey)return;if(!/^[0-9۰-۹]$/.test(e.key)){e.preventDefault();return}if(d.nationalId.length>=10)e.preventDefault();}}
            onChange={e=>{const v=toLatinDigits(e.target.value).replace(/\D/g,"").slice(0,10);setD(p=>({...p,nationalId:v}))}}
          />
        </label>
      </div>
      <label style={{marginTop:22,display:"block",marginBottom:0,fontSize:14,color:"var(--text-secondary)",fontWeight:600}}>تاریخ تولد
        <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr 1fr",gap:10,marginTop:10}}>
          <button type="button" style={{border:"1.5px solid var(--border-color)",background:"var(--input-bg)",borderRadius:14,color:"var(--text-primary)",padding:"13px 8px",fontFamily:"Vazirmatn",fontSize:18,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}} onClick={()=>setPicker("y")}>{date.y}<small style={{fontSize:11,color:"var(--text-muted)",fontWeight:400}}>سال</small></button>
          <button type="button" style={{border:"1.5px solid var(--border-color)",background:"var(--input-bg)",borderRadius:14,color:"var(--text-primary)",padding:"13px 8px",fontFamily:"Vazirmatn",fontSize:18,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}} onClick={()=>setPicker("m")}>{date.m}<small style={{fontSize:11,color:"var(--text-muted)",fontWeight:400}}>ماه</small></button>
          <button type="button" style={{border:"1.5px solid var(--border-color)",background:"var(--input-bg)",borderRadius:14,color:"var(--text-primary)",padding:"13px 8px",fontFamily:"Vazirmatn",fontSize:18,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}} onClick={()=>setPicker("day")}>{date.day}<small style={{fontSize:11,color:"var(--text-muted)",fontWeight:400}}>روز</small></button>
        </div>
      </label>
      {err&&<p className="field-err" style={{fontSize:14,marginTop:12}}>{err}</p>}
      <button className="primary-button" style={{marginTop:28,fontSize:15,padding:"15px"}} onClick={confirm}>ادامه</button>
    </div>
  </div>
  {picker&&<div className="receipt-page" dir="rtl">
    <div className="receipt-page-header">
      <button className="back-btn" onClick={()=>setPicker(null)}><Icon name="arrow" size={20}/></button>
      <h2 style={{flex:1,textAlign:"center",fontSize:17,fontWeight:800}}>{title}</h2>
      <div style={{width:36}}/>
    </div>
    <div className="receipt-page-body">
      <div className="date-option-grid" style={{paddingTop:16,paddingBottom:20}}>
        {options.map(v=><button key={v} style={{fontSize:15,padding:"12px 4px",borderRadius:12,fontWeight:600,fontFamily:"Vazirmatn",border:"1px solid var(--border-color)",background:date[picker!]===v?"var(--accent)":"var(--card-bg2)",color:date[picker!]===v?"#000":"var(--text-primary)",cursor:"pointer"}} className={date[picker!]===v?"active":""} onClick={()=>{setDate(p=>({...p,[picker!]:v}));setPicker(null)}}>{v}</button>)}
      </div>
    </div>
  </div>}
  </>;
}


// ─── Onboard PIN ──────────────────────────────────────────────────────────────
function OnboardPin({onDone,onSkip,onBack}:{onDone:(pin:string)=>void;onSkip?:()=>void;onBack?:()=>void}){
  const [step,setStep]=useState<"enter"|"confirm">("enter");const [first,setFirst]=useState("");const [cur,setCur]=useState("");const [err,setErr]=useState("");
  const tap=(d:string)=>{const next=cur+d;if(next.length>4)return;setCur(next);if(next.length===4){setTimeout(()=>{if(step==="enter"){setFirst(next);setCur("");setStep("confirm");setErr("")}else{if(next===first)onDone(next);else{setErr("رمزها یکسان نیستند.");setFirst("");setCur("");setStep("enter")}}},150)}};
  const del=()=>setCur(p=>p.slice(0,-1));
  const KEYS=["1","2","3","4","5","6","7","8","9","","0","del"];
  const FA_DIG:Record<string,string>={"1":"۱","2":"۲","3":"۳","4":"۴","5":"۵","6":"۶","7":"۷","8":"۸","9":"۹","0":"۰"};
  return <div className="auth-screen" dir="rtl" style={{justifyContent:"center",alignItems:"center",minHeight:"100dvh"}}>
    <div className="auth-card pin-card" style={{margin:"16px",width:"100%",maxWidth:380,boxSizing:"border-box"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        {onBack?<button className="auth-back-btn" style={{margin:0}} onClick={()=>{setStep("enter");setFirst("");setCur("");setErr("");onBack()}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>بازگشت</button>:<div/>}
        {onSkip&&<button onClick={onSkip} style={{background:"none",border:"none",color:"var(--text-muted)",fontSize:13,cursor:"pointer",fontFamily:"Vazirmatn",padding:"4px 8px",textDecoration:"underline"}}>رد کردن</button>}
      </div>
      <div style={{fontSize:13,color:"#00D6B0",fontWeight:700,marginBottom:10}}>مرحله ۳ از ۳</div>
      <div style={{display:"flex",justifyContent:"center",marginBottom:14,color:"#00D6B0"}}><Icon name="lock" size={36}/></div>
      <h2 style={{fontSize:22,fontWeight:900,color:"#F4FAFC",textAlign:"center",marginBottom:8}}>{step==="enter"?"رمز ۴ رقمی بسازید":"تأیید رمز"}</h2>
      <p style={{fontSize:14,color:"var(--text-muted)",textAlign:"center",lineHeight:1.7,marginBottom:4}}>{step==="enter"?"یک رمز ۴ رقمی برای ورود به حساب انتخاب کنید":"رمز انتخابی خود را دوباره وارد کنید"}</p>
      <div style={{display:"flex",justifyContent:"center",gap:16,margin:"22px 0"}}>
        {[0,1,2,3].map(i=><div key={i} style={{width:16,height:16,borderRadius:"50%",background:cur.length>i?"#00D6B0":"rgba(120,190,210,0.2)",transition:"background 0.2s",boxShadow:cur.length>i?"0 0 12px rgba(0,214,176,0.5)":"none"}}/>)}
      </div>
      {err&&<p className="field-err" style={{textAlign:"center",fontSize:14,marginBottom:10}}>{err}</p>}
      <div dir="ltr" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginTop:4}}>
        {KEYS.map((k,i)=>k===""?<div key={i}/>:k==="del"?<button key={i} style={{height:68,borderRadius:16,background:"#071D2C",border:"1px solid rgba(120,190,210,0.15)",cursor:"pointer",color:"#F4FAFC",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={del}><Icon name="delete" size={22}/></button>:<button key={i} style={{height:68,borderRadius:16,background:"#071D2C",border:"1px solid rgba(120,190,210,0.15)",cursor:"pointer",color:"#F4FAFC",fontSize:28,fontWeight:700,fontFamily:"Vazirmatn"}} onClick={()=>tap(k)}>{FA_DIG[k]}</button>)}
      </div>
    </div>
  </div>;
}

// ─── Verification Animation ───────────────────────────────────────────────────
function VerificationAnimation({onSuccess,onFail}:{onSuccess:()=>void;onFail:()=>void}){
  const [phase,setPhase]=useState<"loading"|"success"|"fail">("loading");
  const [count,setCount]=useState(6);
  const [fadeOut,setFadeOut]=useState(false);

  useEffect(()=>{
    if(phase!=="loading")return;
    if(count<=0){
      setPhase("success");
      setTimeout(()=>{
        setFadeOut(true);
        setTimeout(()=>onSuccess(),700);
      },2000);
      return;
    }
    const t=setTimeout(()=>setCount(c=>c-1),1000);
    return()=>clearTimeout(t);
  },[count,phase]);

  return(
    <div style={{position:"fixed",inset:0,background:"#020e18",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",opacity:fadeOut?0:1,transition:"opacity 0.7s ease"}} dir="rtl">
      {phase==="loading"&&(
        <div style={{position:"relative",width:120,height:120}}>
          <svg width={120} height={120} viewBox="0 0 120 120" style={{position:"absolute",inset:0}}>
            <circle cx={60} cy={60} r={52} fill="none" stroke="rgba(0,214,176,0.12)" strokeWidth={7}/>
            <circle cx={60} cy={60} r={52} fill="none" stroke="#00D6B0" strokeWidth={7}
              strokeDasharray={`${2*Math.PI*52*0.72} ${2*Math.PI*52*0.28}`}
              strokeLinecap="round"
              style={{transformOrigin:"50% 50%",animation:"spinVerify 1.2s linear infinite"}}/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,fontWeight:900,color:"#00D6B0",fontFamily:"Vazirmatn"}}>{toFaDigits(String(count))}</div>
        </div>
      )}
      {phase==="success"&&(
        <div style={{width:120,height:120,animation:"fadeInScale 0.35s ease forwards"}}>
          <svg width={120} height={120} viewBox="0 0 120 120">
            <circle cx={60} cy={60} r={52} fill="none" stroke="rgba(0,214,176,0.18)" strokeWidth={5}/>
            <circle cx={60} cy={60} r={52} fill="none" stroke="#00D6B0" strokeWidth={5}
              strokeDasharray={`${2*Math.PI*52}`}
              strokeDashoffset={0}
              style={{animation:"circleIn 0.5s ease forwards"}}/>
            <polyline points="34,62 52,80 86,42" fill="none" stroke="#00D6B0" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round"
              style={{animation:"checkDraw 0.6s ease 0.4s forwards",strokeDasharray:72,strokeDashoffset:72}}/>
          </svg>
        </div>
      )}
      {phase==="fail"&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:24,padding:32}}>
          <div style={{width:120,height:120}}>
            <svg width={120} height={120} viewBox="0 0 120 120">
              <circle cx={60} cy={60} r={52} fill="none" stroke="rgba(229,57,53,0.2)" strokeWidth={5}/>
              <circle cx={60} cy={60} r={52} fill="none" stroke="#e53935" strokeWidth={5}/>
              <line x1={40} y1={40} x2={80} y2={80} stroke="#e53935" strokeWidth={7} strokeLinecap="round"/>
              <line x1={80} y1={40} x2={40} y2={80} stroke="#e53935" strokeWidth={7} strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:18,fontWeight:900,color:"#e53935",marginBottom:8}}>احراز هویت تایید نشد</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.45)",marginBottom:24}}>لطفاً مراحل تنظیم رمز را دوباره انجام دهید</div>
            <button className="primary-button" style={{background:"#e53935",minWidth:200}} onClick={onFail}>تلاش مجدد</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PinUnlock({user,onVerified}:{user:UserData;onVerified:()=>void}){
  const [pin,setPin]=useState(""),[error,setError]=useState(""),[support,setSupport]=useState(false);
  const tap=(digit:string)=>{const next=pin+digit;if(next.length>4)return;setPin(next);setError("");if(next.length===4)setTimeout(()=>{if(next===pinEnabled)onVerified();else{setPin("");setError("رمز امنیتی صحیح نیست. دوباره تلاش کنید.")}},150)};
  const keys=["1","2","3","4","5","6","7","8","9","","0","del"];
  return <div className="auth-screen" dir="rtl"><div className="auth-card pin-card pin-unlock-card"><img src={anPardazLogo} alt="آن‌پرداز" className="pin-logo"/><div style={{display:"flex",justifyContent:"center",marginBottom:12,color:"#00D6B0"}}><Icon name="lock" size={32}/></div><h2>رمز امنیتی را وارد کنید</h2><p>برای ورود به حساب {toFaDigits(user.phone)}، رمز ۴ رقمی خود را وارد کنید.</p><div style={{display:"flex",justifyContent:"center",gap:16,margin:"20px 0"}}>{[0,1,2,3].map(i=><div key={i} style={{width:16,height:16,borderRadius:"50%",background:pin.length>i?"#00D6B0":"rgba(120,190,210,0.2)",transition:"background 0.2s"}}/>)}</div>{error&&<p className="field-err" style={{textAlign:"center"}}>{error}</p>}<div dir="ltr" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>{keys.map((key,i)=>key===""?<div key={i}/>:key==="del"?<button key={i} onClick={()=>setPin(v=>v.slice(0,-1))} style={{height:68,borderRadius:16,background:"#071D2C",border:"1px solid rgba(120,190,210,0.15)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#F4FAFC"}}><Icon name="delete" size={22}/></button>:<button key={i} onClick={()=>tap(key)} style={{height:68,borderRadius:16,background:"#071D2C",border:"1px solid rgba(120,190,210,0.15)",fontSize:28,fontWeight:700,fontFamily:"Vazirmatn",color:"#F4FAFC",cursor:"pointer"}}>{toFaDigits(key)}</button>)}</div><button className="forgot-pin" onClick={()=>setSupport(true)}>رمز خود را فراموش کرده‌اید؟</button></div>{support&&<div className="receipt-page" dir="rtl"><div className="receipt-page-header"><button className="back-btn" onClick={()=>setSupport(false)}><Icon name="arrow" size={20}/></button><h2 style={{flex:1,textAlign:"center",fontSize:17,fontWeight:800}}>بازیابی رمز امنیتی</h2><div style={{width:36}}/></div><div className="receipt-page-body" style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"40px 24px"}}><img src={anPardazLogo} alt="آن‌پرداز" style={{width:64,height:64,borderRadius:16,marginBottom:20}}/><h3 style={{marginBottom:12}}>بازیابی رمز امنیتی</h3><p style={{textAlign:"center",lineHeight:1.8,marginBottom:8}}>برای غیرفعال کردن رمز فراموش‌شده، با پشتیبانی آن‌پرداز تماس بگیرید.</p><div style={{fontSize:18,fontWeight:900,color:"#00D6B0",letterSpacing:2,margin:"12px 0",fontFamily:"Vazirmatn",direction:"ltr"}}>۰۹۳۷۵۴۳۷۱۰۶</div><button className="primary-button" style={{marginTop:16,width:"100%"}} onClick={()=>setSupport(false)}>متوجه شدم</button></div></div>}</div>;
}

// ─── Bank detection by card prefix ───────────────────────────────────────────
// 6-digit BINs (spec-provided) take priority; 4-digit prefixes as fallback
const BANK_BIN6:Record<string,string>={
  "627412":"بانک اقتصاد نوین",
  "504706":"بانک شهر",
  "627381":"بانک انصار",
  "603769":"بانک صادرات",
  "505785":"بانک ایران زمین",
  "627961":"بانک صنعت و معدن",
  "622106":"بانک پارسیان","639194":"بانک پارسیان","627884":"بانک پارسیان",
  "606373":"بانک مهر ایران",
  "639599":"بانک قوامین",
  "627488":"بانک کارآفرین","502910":"بانک کارآفرین",
  "639347":"بانک پاسارگاد","502229":"بانک پاسارگاد",
  "603770":"بانک کشاورزی",
  "636214":"بانک آینده",
  "505416":"بانک گردشگری",
  "627753":"بانک تجارت",
  "502908":"توسعه تعاون",
  "636795":"بانک مرکزی",
  "628023":"بانک مسکن",
  "627648":"توسعه صادرات","207177":"توسعه صادرات",
  "610433":"بانک ملت","991975":"بانک ملت",
  "636949":"بانک حکمت ایرانیان",
  "502938":"بانک دی",
  "603799":"بانک ملی",
  "589463":"بانک رفاه",
  "606256":"اعتباری ملل",
  "621986":"بانک سامان",
  "639370":"مهر اقتصاد",
  "589210":"بانک سپه",
  "627760":"پست بانک",
  "639607":"بانک سرمایه",
  "628157":"مؤسسه اعتباری توسعه",
  "639346":"بانک سینا",
  "505801":"مؤسسه اعتباری کوثر",
  "6399":"بانک رسالت",
};
const BANK_PREFIX:Record<string,string>={
  "6037":"بانک ملی","6036":"بانک ملی",
  "6219":"بانک سامان",
  "6104":"بانک رفاه","6105":"بانک رفاه",
  "5894":"بانک سپه","5895":"بانک سپه",
  "6228":"بانک پاسارگاد","5022":"بانک پاسارگاد",
  "5028":"بانک پارسیان","6221":"بانک پارسیان","6223":"بانک پارسیان",
  "6274":"بانک اقتصاد نوین","6063":"بانک اقتصاد نوین","5606":"بانک اقتصاد نوین",
  "6362":"بانک ایران زمین",
  "9891":"بانک تجارت","6280":"بانک تجارت","5892":"بانک تجارت",
  "5859":"توسعه صادرات",
  "6276":"بانک صادرات","6279":"بانک صادرات",
  "6369":"بانک ملت","6379":"بانک ملت",
  "6273":"بانک مسکن",
  "6395":"بانک قوامین",
  "9101":"پست بانک",
  "6034":"بانک کشاورزی","6033":"بانک کشاورزی",
  "6392":"بانک سینا",
  "6270":"بانک کارآفرین","6271":"بانک کارآفرین","6272":"بانک کارآفرین",
  "6397":"بانک سرمایه",
  "6393":"بانک حکمت ایرانیان",
  "6378":"بانک دی",
  "5041":"بانک شهر",
  "5057":"بانک گردشگری",
  "6381":"توسعه تعاون",
  "6394":"بانک مهر ایران",
  "6277":"بانک انصار",
  "6399":"بانک رسالت",
  "6064":"بانک صنعت و معدن",
};
type BankInfo={color:string;textColor:string;logo?:string;abbr:string};
const BANK_THEME:Record<string,BankInfo>={
  "بانک ملی":              {color:"#003d82",textColor:"#fff",logo:logoMeli,abbr:"ملی"},
  "بانک سامان":            {color:"#039be5",textColor:"#fff",abbr:"سام"},
  "بانک رفاه":             {color:"#3949AB",textColor:"#fff",logo:logoRefah,abbr:"رفاه"},
  "بانک سپه":              {color:"#37474F",textColor:"#fff",logo:logoSepah,abbr:"سپه"},
  "بانک پاسارگاد":         {color:"#1565C0",textColor:"#fff",abbr:"پاس"},
  "بانک پارسیان":          {color:"#5D4037",textColor:"#fff",logo:logoParsian,abbr:"پار"},
  "بانک اقتصاد نوین":      {color:"#1a237e",textColor:"#fff",abbr:"اقن"},
  "بانک ایران زمین":       {color:"#7B1FA2",textColor:"#fff",logo:logoIranZamin,abbr:"ایز"},
  "بانک تجارت":            {color:"#2b3990",textColor:"#fff",logo:logoTejarat,abbr:"تجا"},
  "توسعه صادرات":          {color:"#1b5e20",textColor:"#fff",logo:logoToseeSaderat,abbr:"تصد"},
  "بانک صادرات":           {color:"#1565C0",textColor:"#fff",abbr:"صاد"},
  "بانک ملت":              {color:"#c62828",textColor:"#fff",logo:logoMellat,abbr:"ملت"},
  "بانک مسکن":             {color:"#E8521A",textColor:"#fff",logo:logoMaskan,abbr:"مسکن"},
  "بانک قوامین":           {color:"#1565C0",textColor:"#fff",abbr:"قوا"},
  "پست بانک":              {color:"#2e7d32",textColor:"#fff",logo:logoPostBank,abbr:"پست"},
  "بانک کشاورزی":          {color:"#2e7d32",textColor:"#fff",logo:logoKeshavarzi,abbr:"کشا"},
  "بانک سینا":             {color:"#0288d1",textColor:"#fff",abbr:"سینا"},
  "بانک کارآفرین":         {color:"#1a9a4a",textColor:"#fff",logo:logoKarafarin,abbr:"کار"},
  "بانک سرمایه":           {color:"#1e3a5f",textColor:"#fff",logo:logoSarmayeh,abbr:"سرم"},
  "بانک حکمت ایرانیان":   {color:"#1565C0",textColor:"#fff",logo:logoHekmat,abbr:"حکم"},
  "بانک دی":               {color:"#009688",textColor:"#fff",logo:logoDi,abbr:"دی"},
  "بانک شهر":              {color:"#e53935",textColor:"#fff",logo:logoShahr,abbr:"شهر"},
  "بانک گردشگری":          {color:"#c62828",textColor:"#fff",logo:logoGardeshgari,abbr:"گرد"},
  "توسعه تعاون":           {color:"#00897B",textColor:"#fff",logo:logoToseeTaavon,abbr:"تتع"},
  "بانک مهر ایران":        {color:"#2e7d32",textColor:"#fff",logo:logoMehr,abbr:"مهر"},
  "بانک انصار":            {color:"#8b0000",textColor:"#fff",logo:logoAnsar,abbr:"انص"},
  "بانک رسالت":            {color:"#0097A7",textColor:"#fff",logo:logoResalat,abbr:"رسا"},
  "بانک صنعت و معدن":      {color:"#B8972E",textColor:"#fff",logo:logoSanatMadan,abbr:"صم"},
  "اعتباری ملل":           {color:"#1565C0",textColor:"#fff",logo:logoMelal,abbr:"ملل"},
  "بانک آینده":            {color:"#6A1B9A",textColor:"#fff",abbr:"آین"},
  "مهر اقتصاد":            {color:"#388E3C",textColor:"#fff",abbr:"مهر"},
  "مؤسسه اعتباری توسعه":  {color:"#1565C0",textColor:"#fff",abbr:"توس"},
  "مؤسسه اعتباری کوثر":   {color:"#7B1FA2",textColor:"#fff",abbr:"کوث"},
};
function getBankInfo(name:string):BankInfo|undefined{
  if(!name)return undefined;
  const direct=BANK_THEME[name];if(direct)return direct;
  const key=Object.keys(BANK_THEME).find(k=>name.includes(k.replace("بانک ",""))||k.includes(name));
  return key?BANK_THEME[key]:undefined;
}
function detectBank(num:string):string{
  const n=num.replace(/\s/g,"");
  return BANK_BIN6[n.slice(0,6)]||BANK_PREFIX[n.slice(0,4)]||"";
}

// ─── Clipboard Icon Button ────────────────────────────────────────────────────
function PasteIconBtn({onPaste,filter}:{onPaste:(v:string)=>void;filter?:(v:string)=>string}){
  const [flash,setFlash]=useState(false);
  const handle=async()=>{
    try{
      const t=await navigator.clipboard.readText();
      onPaste(filter?filter(t.trim()):t.trim());
      setFlash(true);setTimeout(()=>setFlash(false),500);
    }catch{}
  };
  return <button type="button" className={`paste-icon-btn${flash?" flash":""}`} onClick={handle} aria-label="الصاق از کلیپ‌بورد">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  </button>;
}

// ─── OTP Cooldown Button ─────────────────────────────────────────────────────
function OtpCooldownBtn({onRequest,cardId,noCard}:{onRequest:()=>void;cardId?:string;noCard?:boolean}){
  const storageKey=cardId?`anp_otp_cd_${cardId}`:"";
  const getInitialCd=()=>{if(!storageKey)return 0;try{const ts=Number(localStorage.getItem(storageKey)||0);if(!ts)return 0;const elapsed=Math.floor((Date.now()-ts)/1000);const remaining=40-elapsed;return remaining>0?remaining:0;}catch{return 0;}};
  const [cd,setCd]=useState(getInitialCd);
  const [showNoCard,setShowNoCard]=useState(false);
  const r=9,circ=2*Math.PI*r;
  const handle=()=>{
    if(cd>0)return;
    if(noCard){setShowNoCard(true);setTimeout(()=>setShowNoCard(false),3000);return;}
    onRequest();
    if(storageKey)localStorage.setItem(storageKey,String(Date.now()));
    setCd(40);
  };
  useEffect(()=>{
    if(cd<=0)return;
    const t=setTimeout(()=>setCd(c=>c-1),1000);
    return()=>clearTimeout(t);
  },[cd]);
  return(
    <>
      <button type="button" className={`otp-request-btn${cd>0?" otp-cooldown":""}`}
        onClick={handle} aria-label="درخواست رمز پویا"
        style={{display:"flex",alignItems:"center",justifyContent:"center",userSelect:"none",pointerEvents:"auto",cursor:cd>0?"default":"pointer",minWidth:88,minHeight:44}}>
        {cd>0?(
          <span className="otp-cd-wrap">
            <svg width="22" height="22" viewBox="0 0 22 22" style={{flexShrink:0}}>
              <circle cx="11" cy="11" r={r} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="2.5"/>
              <circle cx="11" cy="11" r={r} fill="none" stroke="rgba(255,255,255,0.88)" strokeWidth="2.5"
                strokeDasharray={circ}
                strokeDashoffset={circ*(1-cd/40)}
                strokeLinecap="round"
                transform="rotate(-90 11 11)"
                style={{transition:"stroke-dashoffset 0.95s linear"} as React.CSSProperties}/>
            </svg>
            <span className="otp-cd-num">{cd}</span>
          </span>
        ):<span>رمز پویا</span>}
      </button>
      {showNoCard&&<div style={{margin:"12px 16px",padding:"16px",borderRadius:14,background:"rgba(255,140,0,0.1)",border:"1px solid rgba(255,140,0,0.3)",color:"var(--text-primary)",display:"flex",alignItems:"flex-start",gap:12,direction:"rtl"}}>
        <span style={{flex:1,fontSize:14,lineHeight:1.7}}>لطفا ابتدا کارت بانکی مورد نظر خود را انتخاب کنید</span>
        <button onClick={()=>setShowNoCard(false)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:18,lineHeight:1}}>✕</button>
      </div>}
    </>
  );
}

// ─── Animated Card Input ──────────────────────────────────────────────────────
const CARD_SAMPLE="۶۱۰۴ ۶۶۴۳ ۷۶۴۴ ۷۸۹۷";
function AnimatedCardInput({value,onChange,className,style,...rest}:{value:string;onChange:(v:string)=>void;className?:string;style?:React.CSSProperties;[k:string]:unknown}){
  const [tick,setTick]=useState(0);
  const {placeholder:customPlaceholder,...restStripped}=rest as {placeholder?:string;[k:string]:unknown};
  useEffect(()=>{
    if(value){setTick(0);return;}
    if(tick>=CARD_SAMPLE.length)return;
    // Delay start of card animation when a custom hint placeholder is provided
    const delay=tick===0&&customPlaceholder?2800:90;
    const t=setTimeout(()=>setTick(n=>n+1),delay);
    return()=>clearTimeout(t);
  },[tick,value,customPlaceholder]);
  useEffect(()=>{if(!value)setTick(0);},[value]);
  return <input {...restStripped as object}
    className={`${className||""} card-anim-input`}
    style={style}
    value={value}
    onChange={e=>onChange(e.target.value)}
    placeholder={tick>0?CARD_SAMPLE.slice(0,tick):(customPlaceholder||"شماره کارت")}
  />;
}

// ─── Global Sticky Action Button ─────────────────────────────────────────────
function StickyActionBtn({label,onClick,disabled,loading,loadingText}:{
  label:string;onClick:()=>void;disabled?:boolean;loading?:boolean;loadingText?:string;noBleed?:boolean;
}){
  return createPortal(
    <div className="sab-fixed-portal">
      <button className="sab-btn" onClick={onClick} disabled={disabled||loading} aria-disabled={disabled||loading}>
        {loading?(
          <span className="sab-loading">
            <svg className="sab-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            {loadingText||"در حال پردازش..."}
          </span>
        ):label}
      </button>
    </div>,
    document.body
  );
}

// ─── Destination Card Picker Screen ──────────────────────────────────────────
interface DestCard {id:string;number:string;bank:string;holderName:string}
function getDestCards(phone:string):DestCard[]{
  try{
    const stored=JSON.parse(localStorage.getItem(`anp_dest_cards_${phone}`)??"null");
    if(Array.isArray(stored)&&stored.length>0)return stored;
    // seed sample cards
    const seed:DestCard[]=[
      {id:"dc1",number:"6037997599887766",bank:"بانک ملی",holderName:"علی احمدی"},
      {id:"dc2",number:"6104338700112233",bank:"بانک ملت",holderName:"مریم رضایی"},
      {id:"dc3",number:"5892101234567890",bank:"بانک سپه",holderName:"حسین کریمی"},
      {id:"dc4",number:"6274129876543210",bank:"بانک اقتصاد نوین",holderName:"زهرا محمدی"},
    ];
    localStorage.setItem(`anp_dest_cards_${phone}`,JSON.stringify(seed));
    return seed;
  }catch{return[]}
}
function saveDestCards(phone:string,cards:DestCard[]){try{localStorage.setItem(`anp_dest_cards_${phone}`,JSON.stringify(cards))}catch{}}

function CardPickerScreen({phone,onSelect,onBack}:{phone:string;onSelect:(card:DestCard)=>void;onBack:()=>void}){
  const [cards,setCards]=useState<DestCard[]>(()=>getDestCards(phone));
  const [nameSearch,setNameSearch]=useState("");
  const [numInput,setNumInput]=useState("");
  const [showCameraScan,setShowCameraScan]=useState(false);
  const [deleteConfirmId,setDeleteConfirmId]=useState<string|null>(null);
  const fmtCardInput=(v:string)=>v.replace(/\D/g,"").slice(0,16).replace(/(.{4})(?=.)/g,"$1 ");

  const rawNum=toLatinDigits(numInput).replace(/\D/g,"");
  const manualBank=rawNum.length>=4?detectBank(rawNum):"";

  const filtered=cards.filter(c=>{
    const n=nameSearch.trim();
    const byName=!n||c.holderName.includes(n);
    const byNum=!rawNum||c.number.includes(rawNum);
    return byName&&byNum;
  });

  const doDelete=(id:string)=>{
    const next=cards.filter(c=>c.id!==id);
    setCards(next);saveDestCards(phone,next);
    setDeleteConfirmId(null);
  };

  const useManual=()=>{
    if(rawNum.length===16){
      onSelect({id:"manual-"+rawNum,number:rawNum,bank:manualBank||"کارت بانکی",holderName:""});
    }
  };

  useBackHandler(onBack);

  return (
    <div className="subscreen" dir="rtl" style={{display:"flex",flexDirection:"column",height:"100%",background:"var(--subscreen-bg)"}}>

      {/* ── Header ── */}
      <div className="subscreen-header" style={{flexShrink:0}}>
        <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
        <h2 className="subscreen-title">انتخاب کارت مقصد</h2>
        <div style={{width:36}}/>
      </div>

      {/* ── Search fields ── */}
      <div style={{padding:"12px 16px 0",flexShrink:0,display:"flex",flexDirection:"column",gap:10}}>

        {/* Name search — large bold text */}
        <div style={{display:"flex",alignItems:"center",gap:10,background:"var(--input-bg)",border:"1.5px solid var(--border-color)",borderRadius:14,padding:"13px 16px"}}>
          <Icon name="search" size={18}/>
          <input
            style={{flex:1,background:"none",border:"none",outline:"none",color:"var(--text-primary)",fontSize:17,fontWeight:700,fontFamily:"Vazirmatn",direction:"rtl",minWidth:0}}
            placeholder="جستجو بر اساس نام"
            value={nameSearch}
            onChange={e=>setNameSearch(e.target.value)}
          />
          {nameSearch&&(
            <button onClick={()=>setNameSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",padding:0,flexShrink:0,display:"flex",alignItems:"center"}}>
              <Icon name="x" size={16}/>
            </button>
          )}
        </div>

        {/* Card number input — large bold digits */}
        <div style={{display:"flex",alignItems:"center",gap:10,background:"var(--input-bg)",border:`1.5px solid ${rawNum.length===16?"var(--accent)":"var(--border-color)"}`,borderRadius:14,padding:"13px 16px",transition:"border-color .2s"}}>
          {manualBank
            ?<BankLogo bankName={manualBank} size={28} rounded={8}/>
            :<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/></svg>
          }
          <input
            dir="ltr"
            style={{flex:1,background:"none",border:"none",outline:"none",color:"var(--text-primary)",fontSize:19,fontWeight:800,fontFamily:"Vazirmatn",letterSpacing:"0.08em",textAlign:"right",minWidth:0}}
            placeholder="شماره کارت"
            inputMode="numeric"
            maxLength={19}
            value={toFaDigits(fmtCardInput(numInput))}
            onChange={e=>{const v=toLatinDigits(e.target.value).replace(/\D/g,"").slice(0,16);setNumInput(v)}}
          />
          {numInput?<button onClick={()=>setNumInput("")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",padding:0,flexShrink:0,display:"flex",alignItems:"center"}}><Icon name="x" size={16}/></button>
          :<button onClick={()=>setShowCameraScan(true)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--accent)",padding:4,flexShrink:0,display:"flex",alignItems:"center"}} title="اسکن کارت">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </button>}
        </div>
        {showCameraScan&&<CameraCardScanModal onClose={()=>setShowCameraScan(false)} onDetect={num=>{setNumInput(num);setShowCameraScan(false);}}/>}

        {/* Use manual card — appears only when 16 digits are typed */}
        {rawNum.length===16&&(
          <button onClick={useManual} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(0,214,176,0.08)",border:"1.5px solid rgba(0,214,176,0.28)",borderRadius:14,padding:"13px 16px",cursor:"pointer",fontFamily:"Vazirmatn",transition:"all .15s"}}>
            <span style={{fontSize:16,fontWeight:700,color:"var(--accent)"}}>استفاده از این شماره کارت</span>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {manualBank&&<BankLogo bankName={manualBank} size={28} rounded={8}/>}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round"><path d="m9 18-6-6 6-6"/></svg>
            </div>
          </button>
        )}
      </div>

      {/* ── Section label ── */}
      <div style={{padding:"14px 16px 6px",flexShrink:0}}>
        <span style={{fontSize:13,color:"var(--text-muted)",fontWeight:700}}>
          {nameSearch||rawNum?"نتایج جستجو":"کارت‌های قبلی"}
        </span>
      </div>

      {/* ── Saved card list ── */}
      <div style={{flex:1,overflowY:"auto",padding:"0 16px 40px",scrollbarWidth:"none"}}>
        {filtered.length===0?(
          <div style={{textAlign:"center",padding:"52px 20px",color:"var(--text-muted)"}}>
            <div style={{width:60,height:60,borderRadius:18,background:"var(--card-bg2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
              <Icon name="credit" size={28}/>
            </div>
            <div style={{fontSize:15,fontWeight:700,marginBottom:8,color:"var(--text-secondary)"}}>
              {nameSearch||rawNum?"کارتی یافت نشد":"کارتی ذخیره نشده"}
            </div>
            <div style={{fontSize:13,color:"var(--text-faint)",lineHeight:1.8}}>
              {nameSearch||rawNum?"جستجوی دیگری امتحان کنید":"شماره کارت را وارد کنید"}
            </div>
          </div>
        ):filtered.map(c=>{
          const isDeleting=deleteConfirmId===c.id;
          return (
            <div key={c.id} style={{marginBottom:12}}>
              {/* Card row */}
              <div
                onClick={()=>!isDeleting&&onSelect(c)}
                style={{display:"flex",alignItems:"center",gap:12,background:"var(--card-bg)",border:"1.5px solid var(--border-color)",borderRadius:16,padding:"14px 14px",cursor:"pointer",transition:"all .18s",userSelect:"none",WebkitUserSelect:"none" as any}}>
                <BankLogo bankName={c.bank} size={48} rounded={14}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:15,fontWeight:800,color:"var(--text-primary)",marginBottom:4}}>{c.holderName||"—"}</div>
                  <div style={{fontSize:14,fontWeight:700,color:"var(--text-secondary)",direction:"ltr",textAlign:"right",letterSpacing:"0.06em"}}>{toFaDigits(fmtCard(c.number))}</div>
                  <div style={{fontSize:12,color:"rgba(0,214,176,0.7)",marginTop:4}}>{c.bank}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8,flexShrink:0}}>
                  {/* Text-label delete button */}
                  <button
                    onClick={e=>{e.stopPropagation();setDeleteConfirmId(c.id)}}
                    style={{background:"rgba(232,81,42,0.08)",border:"1px solid rgba(232,81,42,0.22)",borderRadius:10,padding:"5px 12px",cursor:"pointer",color:"#e8512a",fontSize:13,fontWeight:700,fontFamily:"Vazirmatn",flexShrink:0,lineHeight:1.4}}>
                    حذف
                  </button>
                </div>
              </div>

              {/* Inline delete confirmation */}
              {isDeleting&&(
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(232,81,42,0.07)",border:"1px solid rgba(232,81,42,0.2)",borderRadius:12,padding:"12px 16px",marginTop:6,gap:10}}>
                  <span style={{fontSize:14,color:"#e8512a",fontFamily:"Vazirmatn",fontWeight:700}}>حذف این کارت؟</span>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>setDeleteConfirmId(null)} style={{background:"var(--card-bg2)",border:"1px solid var(--border-color)",borderRadius:10,padding:"7px 16px",color:"var(--text-secondary)",fontSize:13,fontFamily:"Vazirmatn",cursor:"pointer",fontWeight:700}}>انصراف</button>
                    <button onClick={()=>doDelete(c.id)} style={{background:"#e8512a",border:"none",borderRadius:10,padding:"7px 16px",color:"#fff",fontSize:13,fontFamily:"Vazirmatn",cursor:"pointer",fontWeight:800}}>حذف شود</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Bottom hint ── */}
      <div style={{flexShrink:0,padding:"10px 16px max(20px,env(safe-area-inset-bottom))",background:"linear-gradient(to top,var(--app-bg) 75%,transparent)",textAlign:"center"}}>
        <span style={{fontSize:12,color:"var(--text-muted)"}}>برای انتخاب کارت، روی آن ضربه بزنید</span>
      </div>

    </div>
  );
}

// ─── Transfer Screen ──────────────────────────────────────────────────────────
type TransferSource="toman"|"usdt"|string;
function TetherSwapScreen({user,rate,onUpdate,onBack}:{user:UserData;rate:number;onUpdate:(u:UserData,tx:TxRecord)=>void;onBack:()=>void}){
  const [from,setFrom]=useState<"toman"|"usdt">("toman"),[amount,setAmount]=useState(""),[err,setErr]=useState(""),[processing,setProcessing]=useState(false),[receipt,setReceipt]=useState<ReceiptData|null>(null); const to=from==="toman"?"usdt":"toman";const num=parseFloat(toLatinDigits(amount))||0;const result=rate>0?(from==="toman"?num/rate:num*rate):0;
  const swapTomanNum=from==="toman"?Math.floor(num):0;
  const submit=()=>{if(rate<=0){setErr("نرخ لحظه‌ای تتر در دسترس نیست؛ لطفاً چند لحظه بعد دوباره تلاش کنید.");return}if(!num){setErr("مبلغ تبدیل را وارد کنید.");return}if(from==="toman"&&num>user.tomanBalance){setErr("موجودی تومان کافی نیست.");return}if(from==="usdt"&&num>user.usdtBalance){setErr("موجودی دلار تتر کافی نیست.");return}setProcessing(true);setTimeout(()=>{const next:UserData={...user,tomanBalance:from==="toman"?user.tomanBalance-num:user.tomanBalance+result,usdtBalance:from==="usdt"?user.usdtBalance-num:user.usdtBalance+result};onUpdate(next,{id:genId(),userId:user.phone,type:"swap",fromAsset:from,toAsset:to,amount:num,convertedAmount:result,fee:0,status:"done",createdAt:new Date().toISOString(),source:"app",tradeType:"conversion"});playChime();setProcessing(false);setReceipt({title:"تبدیل با موفقیت انجام شد",amount:`${to==="toman"?fa(Math.round(result)):faFixed(result,2)} ${to==="toman"?"تومان":"دلار تتر"}`,detail:"نرخ لحظه‌ای در رسید ثبت شد."});setAmount("");setErr("")},3000)};
  return <><div className="subscreen" dir="rtl"><div className="subscreen-header"><button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button><h2 className="subscreen-title">تبدیل دلار تتر</h2><div style={{width:36}}/></div><div className="subscreen-body">
    <div className="swap-segment">
      <button className={from==="toman"?"active":""} onClick={()=>setFrom("toman")}>
        <span className="swap-seg-coins"><span className="seg-coin seg-tmn">ت</span><svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 5.5h9M6.5 2l3.5 3.5-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg><span className="seg-coin seg-usdt">$</span></span>
        <span>تومان به تتر</span>
      </button>
      <button className={from==="usdt"?"active":""} onClick={()=>setFrom("usdt")}>
        <span className="swap-seg-coins"><span className="seg-coin seg-usdt">$</span><svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 5.5h9M6.5 2l3.5 3.5-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg><span className="seg-coin seg-tmn">ت</span></span>
        <span>تتر به تومان</span>
      </button>
    </div>
    <div style={{marginBottom:from==="toman"&&swapTomanNum>0?4:0}}>
    <div className="exchange-input"><label style={{minWidth:"max-content",whiteSpace:"nowrap",paddingLeft:10}}>پرداخت می‌کنم</label><div className="currency-chip">{from==="toman"?"تومان":"دلار تتر"}</div><input value={from==="toman"?(swapTomanNum?fa(swapTomanNum):""):toFaDigits(amount)} onChange={e=>setAmount(toLatinDigits(e.target.value).replace(/[^0-9.]/g,""))} inputMode="decimal" dir="ltr" placeholder="" aria-label="مبلغ تبدیل"/></div>
    {from==="toman"&&swapTomanNum>0&&<div className="amount-words" style={{marginRight:16,marginBottom:4}}>{numToFaWords(swapTomanNum)} تومان</div>}
    </div><div className="swap-midline"><Icon name="swap" size={17}/></div><div className="exchange-input destination"><label style={{minWidth:"max-content",whiteSpace:"nowrap",paddingLeft:10}}>دریافت می‌کنم</label><div className="currency-chip">{to==="toman"?"تومان":"دلار تتر"}</div><output>{num?(to==="toman"?fa(Math.round(result)):faFixed(result,2)):""}</output></div><div className="rate-row" style={{marginTop:12}}><span>نرخ لحظه‌ای</span><b>{fa(Math.round(rate))} تومان</b></div>{err&&<p className="field-err">{err}</p>}
    <StickyActionBtn label="تأیید تبدیل" onClick={submit} disabled={processing||!num} loading={processing} loadingText="در حال تبدیل..."/>
    </div></div>{processing&&<AnPardazLoadingOverlay text="در حال تبدیل دارایی..."/>}{receipt&&<TransactionReceipt data={receipt} onClose={()=>setReceipt(null)}/>}</>;
}


function SayadScreen({onBack}:{onBack:()=>void}){
  const [mode,setMode]=useState<"inquiry"|"register"|"accept"|"reject"|"transfer"|"cancel">("inquiry");
  const [sayadId,setSayadId]=useState("");
  const [amount,setAmount]=useState("");
  const [dueDate,setDueDate]=useState("");
  const [recipientNationalId,setRecipientNationalId]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [result,setResult]=useState<any>(null);
  const labels={inquiry:"استعلام چک",register:"ثبت چک",accept:"تأیید دریافت",reject:"رد چک",transfer:"انتقال چک",cancel:"لغو چک"};
  const submit=async()=>{
    const id=toLatinDigits(sayadId).replace(/\D/g,"");
    const nid=toLatinDigits(recipientNationalId).replace(/\D/g,"");
    if(id.length!==16){setError("شناسه صیادی باید ۱۶ رقم باشد.");return}
    if(mode==="register"&&(!amount||!/^[0-9]+(\\.[0-9]+)?$/.test(toLatinDigits(amount))||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dueDate))){setError("مبلغ و تاریخ سررسید را کامل و صحیح وارد کنید.");return}
    if(mode==="transfer"&&nid.length!==10){setError("کد ملی گیرنده باید ۱۰ رقم باشد.");return}
    setBusy(true);setError("");setResult(null);
    try{
      const body:any={sayadId:id,idempotencyKey:crypto.randomUUID()};
      if(mode==="register"){body.amount=toLatinDigits(amount);body.dueDate=dueDate}
      if(mode==="transfer")body.recipientNationalId=nid;
      const data=await anpardazRequest("/api/v1/banking/sayad/"+mode,{method:"POST",body:JSON.stringify(body)});
      setResult(data?.operation??data);
    }catch(e){setError(e instanceof Error?e.message:"عملیات چک صیادی انجام نشد")}
    finally{setBusy(false)}
  };
  return <div className="anp-full-page" dir="rtl">
    <div className="anp-page-header"><button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button><h2 className="subscreen-title">چک صیادی</h2><div style={{width:36}}/></div>
    <div className="anp-page-body">
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:18}}>
        {(Object.keys(labels) as Array<keyof typeof labels>).map(k=><button key={k} className={mode===k?"primary-button":"outline-button"} onClick={()=>{setMode(k);setError("");setResult(null)}} style={{padding:"10px 6px",fontSize:11}}>{labels[k]}</button>)}
      </div>
      <div className="anp-card" style={{padding:16}}>
        <label className="field-label">شناسه صیادی ۱۶ رقمی</label>
        <input className="anp-input" inputMode="numeric" dir="ltr" value={sayadId} onChange={e=>setSayadId(toFaDigits(e.target.value.replace(/\\D/g,"").slice(0,16)))} placeholder="•••• •••• •••• ••••"/>
        {mode==="register"&&<><label className="field-label" style={{marginTop:14}}>مبلغ</label><input className="anp-input" inputMode="decimal" dir="ltr" value={amount} onChange={e=>setAmount(toFaDigits(e.target.value.replace(/[^0-9.]/g,"")))} placeholder="مبلغ به ریال"/><label className="field-label" style={{marginTop:14}}>تاریخ سررسید</label><input className="anp-input" dir="ltr" value={dueDate} onChange={e=>setDueDate(e.target.value.replace(/[^0-9-]/g,"").slice(0,10))} placeholder="YYYY-MM-DD"/></>}
        {mode==="transfer"&&<><label className="field-label" style={{marginTop:14}}>کد ملی گیرنده</label><input className="anp-input" inputMode="numeric" dir="ltr" value={recipientNationalId} onChange={e=>setRecipientNationalId(toFaDigits(e.target.value.replace(/\\D/g,"").slice(0,10)))} placeholder="••••••••••"/></>}
        {error&&<div className="field-err" style={{marginTop:10}}>{error}</div>}
        <button className="primary-button" onClick={submit} disabled={busy} style={{width:"100%",marginTop:18}}>{busy?"در حال ارسال…":labels[mode]}</button>
      </div>
      {result&&<div className="anp-card" style={{padding:16,marginTop:14}}>
        <div style={{fontWeight:900,fontSize:15}}>نتیجه عملیات</div>
        <div style={{fontSize:12,color:"var(--text-muted)",marginTop:6}}>کد عملیات: <span dir="ltr">{String(result.operation_id??result.operationId??"—")}</span></div>
        <pre style={{whiteSpace:"pre-wrap",overflow:"auto",fontSize:11,marginTop:12}}>{JSON.stringify(result,null,2)}</pre>
      </div>}
      <div style={{fontSize:11,color:"var(--text-muted)",lineHeight:1.8,marginTop:14}}>عملیات مستقیماً از سرویس آن پرداز ثبت و قابل پیگیری است؛ هیچ وضعیت یا نتیجه ساختگی در این صفحه تولید نمی‌شود.</div>
    </div>
  </div>;
}

function TransferScreen({user,onUpdate,transactions,onBack,onDone}:{user:UserData;rate:number;onUpdate:(u:UserData,tx:TxRecord)=>void;transactions:TxRecord[];onBack:()=>void;onDone:()=>void}){
  const [step,setStep]=useState<1|2>(1);
  // Step 1 state
  const [srcCardId,setSrcCardId]=useState("");
  const [destRaw,setDestRaw]=useState("");
  const [destCard,setDestCard]=useState<{number:string;bank:string;holderName:string}|null>(null);
  const [destDropOpen,setDestDropOpen]=useState(false);
  const [destPickerOpen,setDestPickerOpen]=useState(false);
  const [amount,setAmount]=useState("");
  const [note,setNote]=useState("");
  const [srcPickerOpen,setSrcPickerOpen]=useState(false);
  const [step1Err,setStep1Err]=useState("");
  // Step 2 state
  const [otp,setOtp]=useState("");const [cvv2,setCvv2]=useState("");
  const [expM,setExpM]=useState("");const [expY,setExpY]=useState("");
  const cvv2Ref=useRef<HTMLInputElement>(null);const expMRef=useRef<HTMLInputElement>(null);const expYRef=useRef<HTMLInputElement>(null);
  const [processing,setProcessing]=useState(false);const [receipt,setReceipt]=useState<ReceiptData|null>(null);
  const [step2Err,setStep2Err]=useState("");
  const fmtCardInput=(v:string)=>v.replace(/\D/g,"").slice(0,16).replace(/(.{4})(?=.)/g,"$1 ");
  const srcCard=user.cards.find(c=>c.id===srcCardId);
  const destClean=destRaw.replace(/\s/g,"");
  const destBank=destClean.length>=4?detectBank(destClean):"";
  const amountNum=parseInt(toLatinDigits(amount).replace(/,/g,""))||0;

  // History suggestions from past transactions
  const destSuggestions=useMemo(()=>{
    const q=destClean;
    const seen=new Set<string>();
    const base=transactions.filter(t=>t.type==="transfer"&&t.toAddress&&t.toAddress!=="exchange_wallet");
    if(q.length===0){
      // Show recent unique transfer destinations when field is focused and empty
      return base.map(t=>t.toAddress!).filter(a=>{if(seen.has(a))return false;seen.add(a);return true}).slice(0,4);
    }
    if(q.length<2&&!/[؀-ۿ]/.test(q))return[];
    return base.filter(t=>{
      const addr=t.toAddress!;
      if(addr.includes(q))return true;
      const bank=detectBank(addr)||"";
      if(bank&&q.length>=2&&bank.includes(q))return true;
      return false;
    }).map(t=>t.toAddress!).filter(a=>{if(seen.has(a))return false;seen.add(a);return true}).slice(0,4);
  },[destClean,transactions]);

  const step1Valid=!!srcCard&&destClean.length===16&&amountNum>0;
  const goNext=()=>{
    if(!srcCard){setStep1Err("کارت مبدا را انتخاب کنید.");return}
    if(destClean.length!==16){setStep1Err("شماره کارت مقصد ۱۶ رقمی باشد.");return}
    if(!amountNum){setStep1Err("مبلغ انتقال را وارد کنید.");return}
    setStep1Err("");setStep(2);
  };

  const step2Valid=toLatinDigits(otp).length===5&&toLatinDigits(cvv2).length===3&&toLatinDigits(expM).length===2&&toLatinDigits(expY).length===2;
  const transfer=()=>{
    if(!otp){setStep2Err("رمز پویا را وارد کنید.");return}
    if(!cvv2){setStep2Err("CVV2 را وارد کنید.");return}
    if(!expM||!expY){setStep2Err("تاریخ انقضا را وارد کنید.");return}
    if(!srcCard){setStep2Err("کارت مبدا در آن پرداز ثبت نشده است.");return}
    setStep2Err("");setProcessing(true);
    anpardazTransfer(destClean,amountNum,"IRR",note).then((result)=>{
      const tr=result?.transfer;const status=String(tr?.status??"processing");
      const tx:TxRecord={id:String(tr?.id??tr?.operation_id??genId()),userId:user.phone,type:"transfer",fromAsset:"toman",toAsset:"toman",amount:amountNum,fee:0,status:status==="completed"?"done":status==="failed"?"failed":"pending",createdAt:String(tr?.created_at??new Date().toISOString()),toAddress:destClean,fromCard:srcCard.id,note:`${srcCard.bank||""} · ${note||"انتقال وجه"} · ${srcCard.number.slice(-4)}`,source:"app"};
      onUpdate(user,tx);playChime();setProcessing(false);
      setReceipt({title:status==="completed"?"انتقال با موفقیت انجام شد":status==="failed"?"انتقال ناموفق بود":"انتقال در حال پردازش است",amount:`${fa(amountNum)} ریال`,destination:toFaDigits(fmtCard(destClean)),status:status==="completed"?"success":status==="failed"?"failed":"pending",detail:`کد عملیات: ${String(tr?.operation_id??result?.operationId??"—")}`});
    }).catch((e)=>{setProcessing(false);setStep2Err(e instanceof Error?e.message:"انتقال وجه انجام نشد")});
  };

  // ── Destination Card Picker — true full-page replacement ──
  if(step===1&&destPickerOpen) return <CardPickerScreen phone={user.phone} onSelect={c=>{setDestRaw(c.number);setDestCard({number:c.number,bank:c.bank,holderName:c.holderName});setDestPickerOpen(false)}} onBack={()=>setDestPickerOpen(false)}/>;

  // ── STEP 1 ──
  if(step===1) return <>
    <div className="subscreen" dir="rtl">
      <div className="subscreen-header">
        <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
        <h2 className="subscreen-title">انتقال وجه</h2>
        <div style={{width:36}}/>
      </div>
      <div className="subscreen-body">
        <div className="banking-form">

          {/* Source card */}
          <div className="bform-field">
            <button className="cb-card-selector" onClick={()=>setSrcPickerOpen(true)} type="button">
              {srcCard?(
                <div className="cb-card-sel-inner">
                  <BankLogo bankName={srcCard.bank} size={38} rounded={11}/>
                  <div className="cb-card-sel-text">
                    <span className="cb-card-bank-name">{srcCard.bank}</span>
                    <span className="cb-card-num-large" dir="ltr">{toFaDigits(fmtCard(srcCard.number))}</span>
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
                  <span className="cb-card-placeholder-text">انتخاب کارت مبدا</span>
                  <div className="cb-card-sel-chevron">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              )}
            </button>
          </div>

          {/* Destination card */}
          <div className="bform-field">
            <button className="cb-card-selector" onClick={()=>setDestPickerOpen(true)} type="button">
              {destClean.length===16&&destCard?(
                <div className="cb-card-sel-inner">
                  {destCard.bank&&<BankLogo bankName={destCard.bank} size={38} rounded={11}/>}
                  <div className="cb-card-sel-text">
                    {destCard.bank&&<span className="cb-card-bank-name">{destCard.bank}</span>}
                    <span className="cb-card-num-large" dir="ltr">{toFaDigits(fmtCard(destClean))}</span>
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
                  <span className="cb-card-placeholder-text">انتخاب کارت مقصد</span>
                  <div className="cb-card-sel-chevron">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              )}
            </button>
          </div>

          {/* Amount */}
          <div className="bform-field">
            <FloatInput label="مبلغ" value={amountNum?fa(amountNum):""} onChange={v=>{const n=toLatinDigits(v).replace(/[^0-9]/g,"");setAmount(n)}} inputMode="numeric" dir="ltr" suffix="ریال"/>
            {amountNum>0&&<div className="amount-words">معادل {numToFaWords(Math.floor(amountNum/10))} تومان</div>}
          </div>

          {/* Note */}
          <div className="bform-field">
            <FloatInput label="توضیحات (اختیاری)" value={note} onChange={v=>setNote(v)} dir="rtl" multiline/>
          </div>

          {step1Err&&<p className="field-err">{step1Err}</p>}
        </div>
        <StickyActionBtn label="مرحله بعد" onClick={goNext} disabled={!step1Valid}/>
      </div>
    </div>

    {/* Source card picker — inline page */}
    {srcPickerOpen&&<div className="receipt-page" dir="rtl">
      <div className="receipt-page-header">
        <button className="back-btn" onClick={()=>setSrcPickerOpen(false)}><Icon name="arrow" size={20}/></button>
        <h2 style={{flex:1,textAlign:"center",fontSize:17,fontWeight:800}}>انتخاب کارت مبدا</h2>
        <div style={{width:36}}/>
      </div>
      <div className="receipt-page-body">
        {user.cards.length===0&&<p className="bs-empty">کارتی ثبت نشده. از پروفایل کارت اضافه کنید.</p>}
        {user.cards.map(c=>(
          <button key={c.id} className={`bs-card-item${srcCardId===c.id?" active":""}`}
            onClick={()=>{setSrcCardId(c.id);setSrcPickerOpen(false);if(c.expM)setExpM(toFaDigits(c.expM));if(c.expY)setExpY(toFaDigits(c.expY))}}>
            <BankLogo bankName={c.bank} size={48} rounded={14}/>
            <div className="bs-card-info">
              <span className="bs-card-bank">{c.bank}</span>
              <span className="bs-card-holder">{c.holderName}</span>
              <span className="bs-card-num" dir="ltr">{toFaDigits(fmtCard(c.number))}</span>
            </div>
            {srcCardId===c.id&&<div className="bs-card-check"><Icon name="check" size={16} stroke={2.5}/></div>}
          </button>
        ))}
      </div>
    </div>}
  </>;

  // ── STEP 2 (confirm + pay) ──
  return <>
    <div className="subscreen" dir="rtl">
      <div className="subscreen-header">
        <button className="back-btn" onClick={()=>setStep(1)}><Icon name="arrow" size={20}/></button>
        <h2 className="subscreen-title">تأیید انتقال</h2>
        <div style={{width:36}}/>
      </div>
      <div className="subscreen-body">
        {/* Summary cards row */}
        <div className="tr-summary-row">
          <div className="tr-summary-card">
            <div className="tr-summary-label">از مبدا</div>
            <BankLogo bankName={srcCard?.bank||""} size={48} rounded={14}/>
            <div className="tr-summary-bank">{srcCard?.bank||"—"}</div>
            <div className="tr-summary-num" dir="ltr">{toFaDigits(fmtCard(srcCard?.number||""))}</div>
          </div>
          <div className="tr-summary-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </div>
          <div className="tr-summary-card">
            <div className="tr-summary-label">به مقصد</div>
            <BankLogo bankName={destBank} size={48} rounded={14}/>
            <div className="tr-summary-bank">{destBank||"کارت"}</div>
            <div className="tr-summary-num" dir="ltr">{toFaDigits(fmtCard(destClean))}</div>
          </div>
        </div>

        {/* Amount */}
        <div className="tr-amount-block">
          <div className="tr-amount-label">مبلغ انتقال</div>
          <div className="tr-amount-value">{fa(amountNum)}<span>ریال</span></div>
          <div className="amount-words" style={{textAlign:"center",marginTop:4}}>{fa(amountNum)} ریال · معادل {numToFaWords(Math.floor(amountNum/10))} تومان</div>
        </div>

        <div className="banking-form">
          {/* OTP */}
          <div className="fin-otp-row">
            <FinField label="رمز پویا" value={otp} onChange={setOtp} maxLength={5}
              onFilled={()=>cvv2Ref.current?.focus()}/>
            <OtpCooldownBtn key={srcCard?.number||"none"} onRequest={()=>setStep2Err("")} cardId={srcCard?.number} noCard={!srcCard}/>
          </div>

          {/* CVV2 */}
          <FinField label="CVV2" value={cvv2} onChange={setCvv2} maxLength={3}
            inputRef={cvv2Ref} onFilled={()=>expMRef.current?.focus()}/>

          {/* Expiry */}
          <div className="fin-exp-row">
            <FinExpField label="ماه انقضا" value={expM} onChange={setExpM}
              inputRef={expMRef} maxLength={2} onFilled={()=>expYRef.current?.focus()}/>
            <div className="fin-exp-sep">/</div>
            <FinExpField label="سال انقضا" value={expY} onChange={setExpY}
              inputRef={expYRef} maxLength={2}/>
          </div>

          {step2Err&&<p className="field-err">{step2Err}</p>}
        </div>
        <StickyActionBtn label="انتقال" onClick={transfer} disabled={processing||!step2Valid} loading={processing} loadingText="در حال انتقال..."/>
      </div>
    </div>
    {processing&&<AnPardazLoadingOverlay text="در حال انتقال وجه..."/>}
    {receipt&&<TransactionReceipt data={receipt} onClose={()=>{setReceipt(null);onDone();}}/>}
  </>;
}


// ─── Internet Package Screens (Irancell + MCI) ────────────────────────────────
type IrancellPkg={id:string;name:string;dur:string;durFilter:"روزانه"|"هفتگی"|"پانزده روزه"|"ماهانه"|"سه ماهه"|"چهار ماهه";type:"internet"|"call";price:string;info?:string;special?:boolean};
const _IC_PKGS:IrancellPkg[]=[
  // هفتگی — اینترنت
  {id:"w1",name:"هفتگی ۲۰۰ مگ",dur:"هفتگی",durFilter:"هفتگی",type:"internet",price:"۸۱,۹۰۰"},
  {id:"w2",name:"هفتگی ۷۵۰ مگ",dur:"هفتگی",durFilter:"هفتگی",type:"internet",price:"۱۵۷,۴۰۰",special:true},
  {id:"w3",name:"هفتگی ۱.۵ گیگ",dur:"هفتگی",durFilter:"هفتگی",type:"internet",price:"۲۰۶,۷۰۰"},
  {id:"w4",name:"هفتگی ۲.۵ گیگ",dur:"هفتگی",durFilter:"هفتگی",type:"internet",price:"۲۴۶,۶۰۰",special:true},
  {id:"w5",name:"هفتگی ۴ گیگ",dur:"هفتگی",durFilter:"هفتگی",type:"internet",price:"۳۰۴,۴۰۰"},
  // ۱۵ روزه — اینترنت
  {id:"f1",name:"۱۵ روزه ۴۰۰ مگ",dur:"پانزده روزه",durFilter:"پانزده روزه",type:"internet",price:"۱۳۳,۷۰۰",info:"مدت زمان بسته ۱۵ روز می‌باشد"},
  {id:"f2",name:"۷۵۰ مگ ۱۵ روزه",dur:"پانزده روزه",durFilter:"پانزده روزه",type:"internet",price:"۱۷۰,۷۰۰",info:"مدت زمان بسته ۱۵ روز می‌باشد"},
  {id:"f3",name:"بسته ۱.۵ گیگ ۱۵ روزه",dur:"پانزده روزه",durFilter:"پانزده روزه",type:"internet",price:"۲۱۸,۱۰۰",info:"مدت زمان بسته ۱۵ روز می‌باشد",special:true},
  {id:"f4",name:"بسته ۲.۵ گیگ ۱۵ روزه",dur:"پانزده روزه",durFilter:"پانزده روزه",type:"internet",price:"۲۷۵,۰۰۰",info:"مدت زمان بسته ۱۵ روز می‌باشد"},
  {id:"f5",name:"بسته ۵.۵ گیگ ۱۵ روزه",dur:"پانزده روزه",durFilter:"پانزده روزه",type:"internet",price:"۳۱۳,۰۰۰",info:"مدت زمان بسته ۱۵ روز می‌باشد",special:true},
  // ماهانه — اینترنت
  {id:"m0",name:"ماهانه ۱ گیگ",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۱۹۹,۱۰۰"},
  {id:"m1",name:"۸ گیگ اینترنت ۳۰ روزه",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۵۶۹,۰۰۰",special:true},
  {id:"m2",name:"۸ گیگ اینترنت ۳۰ روزه",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۵۷۳,۰۰۰"},
  {id:"m3",name:"۸ گیگ اینترنت ۳۰ روزه",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۶۸۷,۰۰۰"},
  {id:"m4",name:"۱۵ گیگ اینترنت ۷ روزه",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۸۲۸,۰۰۰"},
  {id:"m5",name:"۳ گیگ اینترنت ۳۰ روزه",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۸۵۴,۰۰۰"},
  {id:"m6",name:"۱ گیگ اینترنت ۳۰ روزه",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۹۸۷,۰۰۰"},
  // سه ماهه
  {id:"t1",name:"۴۵ گیگ سه ماهه",dur:"سه ماهه",durFilter:"سه ماهه",type:"internet",price:"۳,۴۵۸,۰۰۰",special:true},
  {id:"t2",name:"۶۰ گیگ سه ماهه",dur:"سه ماهه",durFilter:"سه ماهه",type:"internet",price:"۴,۶۵۵,۰۰۰"},
  {id:"t3",name:"۸۰ گیگ سه ماهه",dur:"سه ماهه",durFilter:"سه ماهه",type:"internet",price:"۶,۱۳۵,۰۰۰"},
  // چهار ماهه
  {id:"q1",name:"۱۰۰ گیگ چهار ماهه",dur:"چهار ماهه",durFilter:"چهار ماهه",type:"internet",price:"۷,۵۵۰,۰۰۰"},
  // مکالمه — call
  {id:"c1",name:"بسته یکماهه ۱۰۰ دقیقه‌ای داخل شبکه",dur:"ماهانه",durFilter:"ماهانه",type:"call",price:"۷۷,۷۴۰"},
  {id:"c2",name:"بسته یکماهه ۲۰۰ دقیقه‌ای داخل شبکه",dur:"ماهانه",durFilter:"ماهانه",type:"call",price:"۱۴۴,۰۴۰"},
  {id:"c3",name:"بسته یکماهه ۴۰۰ دقیقه‌ای داخل شبکه",dur:"ماهانه",durFilter:"ماهانه",type:"call",price:"۲۶۶,۷۶۰"},
  {id:"c4",name:"بسته یکماهه ۸۰۰ دقیقه‌ای داخل شبکه",dur:"ماهانه",durFilter:"ماهانه",type:"call",price:"۴۹۴,۰۰۰"},
];
const _IC_DUR_FILTERS=["روزانه","هفتگی","۱۵ روزه","ماهانه","سه ماهه","پیشنهاد ویژه"] as const;

// shared sub-components for both operator screens
function _PkgChipBtn({label,active,onClick}:{label:string;active:boolean;onClick:()=>void}){
  return <button onClick={onClick} className={`anp-chip-btn${active?" anp-chip-btn--active":""}`} style={{flexShrink:0,display:"flex",alignItems:"center",gap:4,padding:"7px 14px",borderRadius:22,border:`1.5px solid ${active?"#00D6B0":"var(--border-color,rgba(255,255,255,0.1))"}`,background:active?"rgba(0,214,176,0.13)":"var(--card-bg2,rgba(255,255,255,0.04))",color:active?"#00D6B0":"var(--text-secondary)",fontSize:12,fontFamily:"Vazirmatn",cursor:"pointer",whiteSpace:"nowrap",transition:"all .15s",fontWeight:active?700:400}}>
    {label}
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 5l3 3 3-3"/></svg>
  </button>;
}
function _DurChipBtn({label,active,onClick}:{label:string;active:boolean;onClick:()=>void}){
  return <button onClick={onClick} className={`anp-dur-chip${active?" anp-dur-chip--active":""}`} style={{flexShrink:0,padding:"7px 14px",borderRadius:22,border:`1.5px solid ${active?"#00D6B0":"var(--border-color,rgba(255,255,255,0.1))"}`,background:active?"rgba(0,214,176,0.13)":"var(--card-bg2,rgba(255,255,255,0.04))",color:active?"#00D6B0":"var(--text-secondary)",fontSize:12,fontFamily:"Vazirmatn",cursor:"pointer",whiteSpace:"nowrap",transition:"all .15s",fontWeight:active?700:400}}>{label}</button>;
}
function _SortSheet({sortBy,setSortBy,onClose}:{sortBy:string|null;setSortBy:(v:"price-asc"|"price-desc"|null)=>void;onClose:()=>void}){
  return <>
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:200}}/>
    <div style={{position:"fixed",bottom:0,right:0,left:0,background:"var(--card-bg2,#131e27)",borderRadius:"22px 22px 0 0",padding:"20px 16px 40px",zIndex:201,fontFamily:"Vazirmatn",direction:"rtl"}}>
      <div style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,0.15)",margin:"0 auto 20px"}}/>
      <div style={{fontSize:15,fontWeight:800,color:"var(--text-primary)",marginBottom:16}}>مرتب‌سازی</div>
      {([["price-asc","قیمت: کمترین به بیشترین"],["price-desc","قیمت: بیشترین به کمترین"]] as [string,string][]).map(([key,label])=>(
        <button key={key} onClick={()=>{setSortBy(key as "price-asc"|"price-desc");onClose();}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",background:sortBy===key?"rgba(0,214,176,0.1)":"transparent",border:`1px solid ${sortBy===key?"rgba(0,214,176,0.3)":"rgba(255,255,255,0.08)"}`,borderRadius:12,padding:"13px 14px",marginBottom:8,cursor:"pointer",color:sortBy===key?"#00D6B0":"var(--text-primary)",fontSize:13,fontFamily:"Vazirmatn",textAlign:"right"}}>
          {label}{sortBy===key&&<svg width="14" height="14" viewBox="0 0 14 14"><path d="M2.5 7l3 3 6-6" stroke="#00D6B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
        </button>
      ))}
      {sortBy&&<button onClick={()=>{setSortBy(null);onClose();}} style={{width:"100%",background:"none",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"12px",marginTop:4,cursor:"pointer",color:"var(--text-muted)",fontSize:12,fontFamily:"Vazirmatn"}}>حذف مرتب‌سازی</button>}
    </div>
  </>;
}

// ─── Irancell Postpaid Package View ──────────────────────────────────────────
function IrancellPkgView({phone,simType,onBack,onGoToPayment}:{phone:string;simType:"postpaid"|"prepaid";onBack:()=>void;onGoToPayment:(d:{phone:string;operator:Operator|null;amount:string;type:"internet"})=>void}){
  const [durFilter,setDurFilter]=useState<string|null>(null);
  const [pkgType,setPkgType]=useState<"internet"|"call"|null>(null);
  const [sortBy,setSortBy]=useState<"price-asc"|"price-desc"|null>(null);
  const [selId,setSelId]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [showSort,setShowSort]=useState(false);
  const [showType,setShowType]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setLoading(false),900);return()=>clearTimeout(t);},[]);
  const operator=OPERATORS.irancell;
  const filtered=_IC_PKGS.filter(p=>{
    if(durFilter==="پیشنهاد ویژه")return p.special===true;
    if(durFilter==="۱۵ روزه")return p.durFilter==="پانزده روزه";
    if(durFilter)return p.durFilter===durFilter;
    if(pkgType)return p.type===pkgType;
    return true;
  }).sort((a,b)=>{if(!sortBy)return 0;const pa=parseFloat(a.price.replace(/[^0-9]/g,""));const pb=parseFloat(b.price.replace(/[^0-9]/g,""));return sortBy==="price-asc"?pa-pb:pb-pa;});
  const selPkg=_IC_PKGS.find(p=>p.id===selId)??null;
  const buy=()=>{if(!selPkg)return;onGoToPayment({phone,operator,amount:`${selPkg.name} — ${selPkg.price} ریال`,type:"internet"});};
  const IcCard=({p}:{p:IrancellPkg})=>{const isSel=selId===p.id;const volMatch=p.name.match(/[\d.]+\s*(?:گیگ(?:ابایت)?|مگ(?:ابایت)?|GB|MB)/i);const volLabel=volMatch?volMatch[0]:null;return <button onClick={()=>setSelId(isSel?null:p.id)} className={`anp-ic-card${isSel?" anp-ic-card--sel":""}`} style={{display:"flex",alignItems:"center",width:"100%",background:isSel?"rgba(0,214,176,0.1)":"var(--card-bg,rgba(255,255,255,0.05))",border:`1.5px solid ${isSel?"#00D6B0":"var(--border-light,rgba(255,255,255,0.09))"}`,borderRadius:18,padding:"16px 14px",cursor:"pointer",textAlign:"right",marginBottom:10,transition:"all .15s",fontFamily:"Vazirmatn",position:"relative",boxSizing:"border-box",boxShadow:isSel?"0 0 0 3px rgba(0,214,176,0.1)":"none"}}>
    {p.special&&<div style={{position:"absolute",top:-1,right:14,background:"rgba(0,214,176,0.18)",border:"1px solid rgba(0,214,176,0.4)",color:"#00D6B0",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:"0 0 8px 8px",fontFamily:"Vazirmatn"}}>پیشنهاد ویژه</div>}
    <div style={{flex:1,paddingTop:p.special?6:0,minWidth:0}}>
      {volLabel&&<div style={{fontSize:20,fontWeight:900,color:"var(--text-primary)",lineHeight:1.2,marginBottom:3,textAlign:"right"}}>{volLabel}</div>}
      <div style={{fontSize:volLabel?12:14,fontWeight:volLabel?600:800,color:volLabel?"var(--text-secondary)":"var(--text-primary)",marginBottom:4,textAlign:"right",lineHeight:1.4}}>{p.name}</div>
      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:"var(--text-muted)",background:"var(--card-bg2,rgba(255,255,255,0.07))",padding:"2px 8px",borderRadius:6,border:"1px solid var(--border-faint,rgba(255,255,255,0.06))"}}>{p.dur}</span>
        {p.type==="call"&&<span style={{fontSize:11,color:"rgba(200,160,255,0.85)",background:"rgba(160,100,255,0.1)",padding:"2px 8px",borderRadius:6}}>مکالمه</span>}
        {p.info&&<span style={{fontSize:11,color:"var(--text-muted)",lineHeight:1.4}}>{p.info}</span>}
      </div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,marginRight:10}}>
      <div style={{textAlign:"left"}}><div style={{fontSize:15,fontWeight:900,color:"#00D6B0",direction:"ltr",whiteSpace:"nowrap"}}>{p.price}</div><div style={{fontSize:10,color:"rgba(0,214,176,0.6)",marginTop:1,textAlign:"left"}}>ریال</div></div>
      <div style={{width:28,height:28,borderRadius:"50%",background:isSel?"#00D6B0":"transparent",border:`2px solid ${isSel?"#00D6B0":"var(--border-color,rgba(255,255,255,0.25))"}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",flexShrink:0}}>
        {isSel&&<svg width="13" height="13" viewBox="0 0 14 14"><path d="M2.5 7l3 3 6-6" stroke="#071d2c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
      </div>
    </div>
  </button>;};
  return <>
  <div className="subscreen" dir="rtl" style={{display:"flex",flexDirection:"column",height:"100%",position:"relative"}}>
    <div className="subscreen-header" style={{flexShrink:0}}>
      <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">{simType==="prepaid"?"اینترنت ایرانسل اعتباری":"اینترنت ایرانسل دائمی"}</h2>
      <div style={{width:36}}/>
    </div>
    <div style={{flexShrink:0,overflowX:"auto",display:"flex",gap:8,padding:"10px 14px",scrollbarWidth:"none",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
      <_PkgChipBtn label="مرتب‌سازی" active={sortBy!==null} onClick={()=>setShowSort(true)}/>
      <_PkgChipBtn label={pkgType==="call"?"مکالمه":pkgType==="internet"?"اینترنت":"نوع بسته"} active={pkgType!==null} onClick={()=>setShowType(true)}/>
      {_IC_DUR_FILTERS.map(f=><_DurChipBtn key={f} label={f} active={durFilter===f} onClick={()=>setDurFilter(durFilter===f?null:f)}/>)}
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"14px 14px 320px",scrollbarWidth:"none"}}>
      {loading?([1,2,3,4,5].map(i=><div key={i} style={{height:78,borderRadius:18,background:"rgba(255,255,255,0.05)",marginBottom:10,animation:"pulse 1.4s ease-in-out infinite",animationDelay:`${i*0.1}s`}}/>)):filtered.length===0?(<div style={{textAlign:"center",padding:"60px 20px",fontFamily:"Vazirmatn"}}><div style={{margin:"0 auto 14px",width:56,height:56,borderRadius:18,background:"rgba(0,214,176,0.07)",border:"1px solid rgba(0,214,176,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(0,214,176,0.5)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div><div style={{fontSize:15,fontWeight:700,color:"var(--text-secondary)",marginBottom:6}}>بسته‌ای موجود نیست</div><div style={{fontSize:12,color:"var(--text-muted)"}}>بسته‌ای در این دسته موجود نیست</div></div>):(filtered.map(p=><IcCard key={p.id} p={p}/>))}
    </div>
    {selPkg&&<div className="sab-pkg-preview"><span className="sab-pkg-preview-name">{selPkg.name}</span><span className="sab-pkg-preview-price">{selPkg.price} <span>ریال</span></span></div>}
    <StickyActionBtn label="همین بسته را می‌خرم" onClick={buy} disabled={!selId} noBleed/>
  </div>
  {showSort&&<_SortSheet sortBy={sortBy} setSortBy={setSortBy} onClose={()=>setShowSort(false)}/>}
  {showType&&<>
    <div onClick={()=>setShowType(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:200}}/>
    <div style={{position:"fixed",bottom:0,right:0,left:0,background:"var(--card-bg2,#131e27)",borderRadius:"22px 22px 0 0",padding:"20px 16px 40px",zIndex:201,fontFamily:"Vazirmatn",direction:"rtl"}}>
      <div style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,0.15)",margin:"0 auto 20px"}}/>
      <div style={{fontSize:15,fontWeight:800,color:"var(--text-primary)",marginBottom:16}}>نوع بسته</div>
      {([["internet","اینترنت"],["call","مکالمه"]] as [string,string][]).map(([key,label])=>{
        const isAct=pkgType===key;
        return <button key={key} onClick={()=>{setPkgType(pkgType===key?null:key as "internet"|"call");setDurFilter(null);setShowType(false);}} style={{display:"flex",alignItems:"center",gap:12,width:"100%",background:isAct?"rgba(0,214,176,0.1)":"transparent",border:`1px solid ${isAct?"rgba(0,214,176,0.3)":"rgba(255,255,255,0.08)"}`,borderRadius:12,padding:"13px 14px",marginBottom:8,cursor:"pointer",color:isAct?"#00D6B0":"var(--text-primary)",fontSize:13,fontFamily:"Vazirmatn",textAlign:"right"}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isAct?"#00D6B0":"rgba(255,255,255,0.5)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{key==="internet"?<><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill={isAct?"#00D6B0":"rgba(255,255,255,0.5)"} stroke="none"/></>:<><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.5 16z"/></>}</svg>
          <span style={{flex:1}}>{label}</span>
          {isAct&&<svg width="14" height="14" viewBox="0 0 14 14"><path d="M2.5 7l3 3 6-6" stroke="#00D6B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
        </button>;
      })}
    </div>
  </>}
  </>;
}

// ─── MCI (Hamrah Aval) Prepaid Package Screen ─────────────────────────────────
type MciPkg={id:string;name:string;dur:string;durFilter:string;type:"internet"|"call"|"sms";price:string;desc?:string;badge?:"recent"|"special"};
const _MCI_SPECIAL:MciPkg[]=[
  {id:"sp1",name:"آلفا+ ۱ ماهه ۵ گیگ",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۴۴۷,۶۰۰",badge:"recent"},
  {id:"sp2",name:"۵۰ گیگ یک ماهه",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۳,۸۳۵,۰۰۰",badge:"special"},
  {id:"sp3",name:"بسته ۳۰ روزه ۶ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۵۳۳,۹۰۰",badge:"special"},
];
const _MCI_PKGS:MciPkg[]=[
  // روزانه
  {id:"da1",name:"بسته ۱ روزه ۵۰۰ مگابایت",dur:"روزانه",durFilter:"روزانه",type:"internet",price:"۹۲,۸۰۰"},
  {id:"da2",name:"بسته ۱ روزه ۷۵۰ مگابایت",dur:"روزانه",durFilter:"روزانه",type:"internet",price:"۱۱۱,۸۰۰"},
  {id:"da3",name:"بسته ۱ روزه ۱ گیگ",dur:"روزانه",durFilter:"روزانه",type:"internet",price:"۱۲۱,۳۰۰"},
  {id:"da4",name:"بسته ۱ روزه ۲ گیگابایت",dur:"روزانه",durFilter:"روزانه",type:"internet",price:"۱۵۹,۳۰۰"},
  // هفتگی
  {id:"wk1",name:"بسته ۷ روزه ۲۰۰ مگابایت",dur:"هفتگی",durFilter:"هفتگی",type:"internet",price:"۸۱,۹۰۰"},
  {id:"wk2",name:"بسته ۷ روزه ۳۰۰ مگابایت",dur:"هفتگی",durFilter:"هفتگی",type:"internet",price:"۱۰۴,۲۰۰"},
  {id:"wk3",name:"بسته ۷ روزه ۵۰۰ مگابایت",dur:"هفتگی",durFilter:"هفتگی",type:"internet",price:"۱۳۲,۷۰۰"},
  {id:"wk4",name:"بسته ۷ روزه ۷۵۰ مگ",dur:"هفتگی",durFilter:"هفتگی",type:"internet",price:"۱۵۷,۲۰۰"},
  {id:"wk5",name:"بسته ۷ روزه ۱.۵ گیگ",dur:"هفتگی",durFilter:"هفتگی",type:"internet",price:"۲۰۶,۷۰۰"},
  {id:"wk6",name:"بسته ۷ روزه ۲.۵ گیگ",dur:"هفتگی",durFilter:"هفتگی",type:"internet",price:"۲۴۶,۶۰۰"},
  // سه روزه
  {id:"td1",name:"۳ روزه ۱۵۰ مگابایت",dur:"سه روزه",durFilter:"سه روزه",type:"internet",price:"۶۱,۲۰۰"},
  {id:"td2",name:"۳ روزه ۲۵۰ مگابایت",dur:"سه روزه",durFilter:"سه روزه",type:"internet",price:"۸۳,۴۰۰"},
  {id:"td3",name:"۳ روزه ۴۰۰ مگابایت",dur:"سه روزه",durFilter:"سه روزه",type:"internet",price:"۱۰۰,۵۰۰"},
  {id:"td4",name:"۳ روزه ۷۵۰ مگ",dur:"سه روزه",durFilter:"سه روزه",type:"internet",price:"۱۲۷,۰۰۰"},
  {id:"td5",name:"۳ روزه ۱.۵ گیگ",dur:"سه روزه",durFilter:"سه روزه",type:"internet",price:"۱۷۰,۷۰۰"},
  {id:"td6",name:"بسته پیامک همراهی",dur:"سه روزه",durFilter:"سه روزه",type:"sms",price:"۱۶,۹۰۰",desc:"بسته پیامک همراهی سه روزه با ۹۰ پیامک (فارسی و انگلیسی)"},
  // پانزده روزه
  {id:"fd1",name:"۷۵۰ مگ ۱۵ روزه",dur:"پانزده روزه",durFilter:"پانزده روزه",type:"internet",price:"۱۷۰,۷۰۰"},
  {id:"fd2",name:"۱.۵ گیگ ۱۵ روزه",dur:"پانزده روزه",durFilter:"پانزده روزه",type:"internet",price:"۲۱۸,۱۰۰"},
  {id:"fd3",name:"۲.۵ گیگ ۱۵ روزه",dur:"پانزده روزه",durFilter:"پانزده روزه",type:"internet",price:"۲۷۵,۰۰۰"},
  // ماهانه
  {id:"mn1",name:"آلفا+ ۱ ماهه ۵ گیگ",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۴۴۷,۶۰۰",badge:"recent"},
  {id:"mn2",name:"بسته ۳۰ روزه ۶ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۵۳۳,۹۰۰",badge:"special"},
  {id:"mn3",name:"بسته مکالمه همراهی",dur:"ماهانه",durFilter:"ماهانه",type:"call",price:"۲۱۰,۰۰۰",desc:"بسته مکالمه همراهی ۳۰ روزه ۶۰۰ دقیقه"},
  {id:"mn4",name:"بسته اینترنت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۱,۶۲۸,۴۰۰",desc:"بسته اینترنت همراهی، ۳۰ روزه، ۳۰ گیگابایت"},
  {id:"mn5",name:"۵۰ گیگ یک ماهه",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۳,۸۳۵,۰۰۰",badge:"special"},
  {id:"mn6",name:"بسته اینترنت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۲,۸۰۰,۰۰۰",desc:"بسته اینترنت همراهی، ۳۰ روزه، ۵۰ گیگابایت"},
  {id:"mn7",name:"بسته اینترنت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۳,۱۵۰,۰۰۰",desc:"بسته اینترنت همراهی، ۳۰ روزه، ۶۰ گیگابایت"},
  // سه ماهه
  {id:"tm1",name:"سه ماهه ۴۵ گیگ",dur:"سه ماهه",durFilter:"سه ماهه",type:"internet",price:"۳,۴۵۸,۰۰۰"},
  {id:"tm2",name:"۶۰ گیگ سه ماهه",dur:"سه ماهه",durFilter:"سه ماهه",type:"internet",price:"۴,۶۰۵,۰۰۰"},
  {id:"tm3",name:"۸۰ گیگ سه ماهه",dur:"سه ماهه",durFilter:"سه ماهه",type:"internet",price:"۶,۱۳۵,۰۰۰"},
];
const _MCI_DUR_FILTERS=["روزانه","هفتگی","سه روزه","پانزده روزه","ماهانه","سه ماهه"];

function MciPrepaidInternetScreen({phone,simType,onBack,onGoToPayment}:{phone:string;simType:"postpaid"|"prepaid";onBack:()=>void;onGoToPayment:(d:{phone:string;operator:Operator|null;amount:string;type:"internet"})=>void}){
  const [durFilter,setDurFilter]=useState<string|null>(null);
  const [pkgType,setPkgType]=useState<"internet"|"call"|"sms"|null>(null);
  const [sortBy,setSortBy]=useState<"price-asc"|"price-desc"|null>(null);
  const [selId,setSelId]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [showSort,setShowSort]=useState(false);
  const [showType,setShowType]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setLoading(false),1000);return()=>clearTimeout(t);},[]);
  const operator=OPERATORS.mci;

  const allPkgs=[..._MCI_PKGS];
  const filtered=(durFilter||pkgType?allPkgs.filter(p=>{
    const durOk=!durFilter||p.durFilter===durFilter;
    const typeOk=!pkgType||p.type===pkgType;
    return durOk&&typeOk;
  }):allPkgs).sort((a,b)=>{if(!sortBy)return 0;const pa=parseFloat(a.price.replace(/[^0-9]/g,""));const pb=parseFloat(b.price.replace(/[^0-9]/g,""));return sortBy==="price-asc"?pa-pb:pb-pa;});

  const selPkg=[..._MCI_SPECIAL,..._MCI_PKGS].find(p=>p.id===selId)??null;
  const buy=()=>{if(!selPkg)return;onGoToPayment({phone,operator,amount:`${selPkg.name} — ${selPkg.price} ریال`,type:"internet"});};

  const Badge=({type}:{type:"recent"|"special"})=>type==="recent"?null:<span style={{display:"inline-flex",alignItems:"center",padding:"2px 9px",borderRadius:8,fontSize:10,fontWeight:700,fontFamily:"Vazirmatn",background:"rgba(0,214,176,0.12)",color:"#00D6B0",border:"1px solid rgba(0,214,176,0.3)"}}>پیشنهاد آن‌پرداز</span>;

  const MciCard=({p,showSpecialSection}:{p:MciPkg;showSpecialSection?:boolean})=>{
    const isSel=selId===p.id;
    const volMatch=(p.name+" "+(p.desc||"")).match(/[\d.]+\s*(?:گیگ(?:ابایت)?|مگ(?:ابایت)?|GB|MB)/i);
    const volLabel=volMatch?volMatch[0]:null;
    const durLabel=p.dur;
    return <button onClick={()=>setSelId(isSel?null:p.id)} className={`anp-mci-card${isSel?" anp-mci-card--sel":""}`} style={{display:"flex",alignItems:"center",width:"100%",background:isSel?"rgba(0,214,176,0.1)":"var(--card-bg)",border:`1.5px solid ${isSel?"#00D6B0":"var(--border-light,rgba(255,255,255,0.09))"}`,borderRadius:20,padding:"15px 14px",cursor:"pointer",textAlign:"right",marginBottom:10,transition:"all .15s",fontFamily:"Vazirmatn",boxSizing:"border-box",position:"relative",boxShadow:isSel?"0 0 0 3px rgba(0,214,176,0.1)":"none"}}>
      {/* Right: text */}
      <div style={{flex:1,minWidth:0}}>
        {volLabel&&<div style={{fontSize:20,fontWeight:900,color:"var(--text-primary)",lineHeight:1.2,marginBottom:3,textAlign:"right"}}>{volLabel}</div>}
        <div style={{fontSize:volLabel?12:15,fontWeight:volLabel?600:800,color:volLabel?"var(--text-secondary)":"var(--text-primary)",marginBottom:4,lineHeight:1.4,textAlign:"right"}}>{p.name}</div>
        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:"var(--text-muted)",background:"var(--card-bg2,rgba(255,255,255,0.07))",padding:"2px 8px",borderRadius:5}}>{durLabel}</span>
          {p.type==="call"&&<span style={{fontSize:10,color:"rgba(180,140,255,0.85)",background:"rgba(140,100,255,0.12)",padding:"1px 7px",borderRadius:5}}>مکالمه</span>}
          {p.type==="sms"&&<span style={{fontSize:10,color:"rgba(250,180,50,0.9)",background:"rgba(250,180,50,0.1)",padding:"1px 7px",borderRadius:5}}>پیامک</span>}
        </div>
        {p.desc&&!volLabel&&<div style={{fontSize:11,color:"var(--text-muted)",lineHeight:1.55,marginTop:4}}>{p.desc}</div>}
        {p.badge&&<div style={{marginTop:4}}><Badge type={p.badge}/></div>}
      </div>
      {/* Left: price + radio indicator */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",justifyContent:"center",flexShrink:0,marginRight:12,gap:8}}>
        <div style={{textAlign:"left"}}>
          <div style={{fontSize:15,fontWeight:900,color:"#00D6B0",direction:"ltr",whiteSpace:"nowrap"}}>{p.price}</div>
          <div style={{fontSize:10,color:"rgba(0,214,176,0.5)",textAlign:"left"}}>ریال</div>
        </div>
        <div style={{width:24,height:24,borderRadius:"50%",background:isSel?"#00D6B0":"transparent",border:`2px solid ${isSel?"#00D6B0":"var(--border-color,rgba(255,255,255,0.3))"}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",flexShrink:0}}>
          {isSel&&<svg width="12" height="12" viewBox="0 0 14 14"><path d="M2.5 7l3 3 6-6" stroke="#071d2c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
        </div>
      </div>
    </button>;
  };

  const showSpecial=!durFilter&&!pkgType;

  return <>
  <div className="subscreen anp-pkg-screen" dir="rtl" style={{display:"flex",flexDirection:"column",height:"100%",position:"relative",background:"#111"}}>
    {/* Header */}
    <div className="anp-pkg-header" style={{display:"flex",alignItems:"center",padding:"0 16px",height:64,borderBottom:"1px solid rgba(255,255,255,0.07)",flexShrink:0,background:"#111",position:"sticky",top:0,zIndex:10}}>
      <button onClick={onBack} className="anp-pkg-back" style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.07)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l6-6-6-6"/></svg>
      </button>
      <h2 className="anp-pkg-title" style={{flex:1,textAlign:"center",fontSize:17,fontWeight:800,color:"#fff",fontFamily:"Vazirmatn",margin:0}}>{simType==="postpaid"?"اینترنت همراه اول دائمی":"اینترنت همراه اول اعتباری"}</h2>
      <div style={{width:36}}/>
    </div>

    {/* Filter bar */}
    <div className="anp-pkg-filters" style={{flexShrink:0,overflowX:"auto",display:"flex",gap:8,padding:"10px 14px",scrollbarWidth:"none",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
      <_PkgChipBtn label="مرتب‌سازی" active={sortBy!==null} onClick={()=>setShowSort(true)}/>
      <_PkgChipBtn label={pkgType?"نوع: "+{internet:"اینترنت",call:"مکالمه",sms:"پیامک"}[pkgType]:"نوع بسته"} active={pkgType!==null} onClick={()=>setShowType(true)}/>
      {_MCI_DUR_FILTERS.map(f=><_DurChipBtn key={f} label={f} active={durFilter===f} onClick={()=>setDurFilter(durFilter===f?null:f)}/>)}
    </div>

    {/* Scrollable list */}
    <div className="anp-pkg-list" style={{flex:1,overflowY:"auto",padding:"14px 14px 320px",scrollbarWidth:"none",background:"#111"}}>
      {loading?([1,2,3,4,5].map(i=><div key={i} style={{height:82,borderRadius:20,background:"rgba(255,255,255,0.05)",marginBottom:10,animation:"pulse 1.4s ease-in-out infinite",animationDelay:`${i*0.1}s`}}/>)):(
        <>
          {/* پیشنهادات ویژه */}
          {showSpecial&&<>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{fontSize:14,fontWeight:800,color:"var(--text-primary)",fontFamily:"Vazirmatn"}}>پیشنهادات ویژه</span>
              <div style={{flex:1,height:1,background:"var(--border-faint,rgba(255,255,255,0.08))"}}/>
            </div>
            {_MCI_SPECIAL.map(p=><MciCard key={p.id} p={p} showSpecialSection/>)}
            <div style={{display:"flex",alignItems:"center",gap:8,margin:"14px 0 10px"}}>
              <span style={{fontSize:14,fontWeight:800,color:"var(--text-primary)",fontFamily:"Vazirmatn"}}>همه بسته‌ها</span>
              <div style={{flex:1,height:1,background:"var(--border-faint,rgba(255,255,255,0.08))"}}/>
              <span style={{fontSize:11,color:"var(--text-muted)",fontFamily:"Vazirmatn"}}>{_MCI_PKGS.length} بسته</span>
            </div>
          </>}
          {/* All / filtered packages */}
          {filtered.length===0?(<div style={{textAlign:"center",padding:"60px 20px",fontFamily:"Vazirmatn"}}><div style={{margin:"0 auto 14px",width:54,height:54,borderRadius:18,background:"rgba(0,214,176,0.07)",border:"1px solid rgba(0,214,176,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(0,214,176,0.5)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div><div style={{fontSize:15,fontWeight:700,color:"rgba(255,255,255,0.55)",marginBottom:6}}>بسته‌ای موجود نیست</div><div style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>بسته‌ای در این دسته موجود نیست</div></div>):(filtered.map(p=><MciCard key={p.id} p={p}/>))}
        </>
      )}
    </div>
    {selPkg&&<div className="sab-pkg-preview"><span className="sab-pkg-preview-name">{selPkg.name}</span><span className="sab-pkg-preview-price">{selPkg.price} <span>ریال</span></span></div>}
    <StickyActionBtn label="همین بسته را می‌خرم" onClick={buy} disabled={!selId} noBleed/>
  </div>
  {showSort&&<_SortSheet sortBy={sortBy} setSortBy={setSortBy} onClose={()=>setShowSort(false)}/>}
  {showType&&<>
    <div onClick={()=>setShowType(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:200}}/>
    <div className="anp-filter-sheet" style={{position:"fixed",bottom:0,right:0,left:0,background:"#1a1a1a",borderRadius:"22px 22px 0 0",padding:"20px 16px 40px",zIndex:201,fontFamily:"Vazirmatn",direction:"rtl"}}>
      <div className="anp-filter-sheet-handle" style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,0.15)",margin:"0 auto 20px"}}/>
      <div className="anp-filter-sheet-title" style={{fontSize:15,fontWeight:800,color:"#fff",marginBottom:16}}>نوع بسته</div>
      {([["internet","اینترنت"],["call","مکالمه"],["sms","پیامک"]] as [string,string][]).map(([key,label])=>{
        const isAct=pkgType===key;
        const icPath=key==="internet"?<><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill={isAct?"#00D6B0":"rgba(255,255,255,0.5)"} stroke="none"/></>:key==="call"?<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.5 16z"/>:<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>;
        return <button key={key} className={`anp-filter-btn${isAct?" anp-filter-btn-active":""}`} onClick={()=>{setPkgType(pkgType===key?null:key as "internet"|"call"|"sms");setDurFilter(null);setShowType(false);}} style={{display:"flex",alignItems:"center",gap:12,width:"100%",background:isAct?"rgba(0,214,176,0.1)":"transparent",border:`1px solid ${isAct?"rgba(0,214,176,0.3)":"rgba(255,255,255,0.08)"}`,borderRadius:12,padding:"13px 14px",marginBottom:8,cursor:"pointer",color:isAct?"#00D6B0":"#fff",fontSize:13,fontFamily:"Vazirmatn",textAlign:"right"}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isAct?"#00D6B0":"rgba(255,255,255,0.5)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icPath}</svg>
          <span style={{flex:1}}>{label}</span>
          {isAct&&<svg width="14" height="14" viewBox="0 0 14 14"><path d="M2.5 7l3 3 6-6" stroke="#00D6B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
        </button>;
      })}
    </div>
  </>}
  </>;
}

// ─── Rightel Prepaid Package Screen ──────────────────────────────────────────
type RightelPkg={id:string;name:string;dur:string;durFilter:string;type:"internet"|"call"|"sms"|"roaming"|"combo";price:string;desc?:string;badge?:"recent"|"special"};
const _RT_SPECIAL:RightelPkg[]=[
  {id:"rs1",name:"۳۰روزه ۳ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۳۳۸,۴۰۰",badge:"recent"},
  {id:"rs2",name:"۳۰ روزه ۵۰ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۲,۹۰۰,۰۰۰",badge:"special"},
  {id:"rs3",name:"۳۰ روزه ۲۵ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۱,۵۱۰,۰۰۰",badge:"special"},
];
const _RT_PKGS:RightelPkg[]=[
  // روزانه
  {id:"rd1",name:"روزانه ۱۰۰ مگ",dur:"روزانه",durFilter:"روزانه",type:"internet",price:"۳۸,۲۰۰"},
  {id:"rd2",name:"۱ روزه ۳۰۰ مگابایت",dur:"روزانه",durFilter:"روزانه",type:"internet",price:"۶۹,۳۰۰"},
  {id:"rd3",name:"۱ روزه ۵۰۰ مگابایت",dur:"روزانه",durFilter:"روزانه",type:"internet",price:"۸۷,۷۰۰"},
  {id:"rd4",name:"۱ روزه ۱ گیگابایت",dur:"روزانه",durFilter:"روزانه",type:"internet",price:"۱۱۷,۵۰۰"},
  {id:"rd5",name:"۱ روزه ۳ گیگابایت",dur:"روزانه",durFilter:"روزانه",type:"internet",price:"۱۷۹,۸۰۰"},
  // سه روزه
  {id:"r3d1",name:"۳ روزه ۱۵۰ مگابایت",dur:"سه روزه",durFilter:"سه روزه",type:"internet",price:"۶۱,۴۰۰"},
  {id:"r3d2",name:"۳ روزه ۱ گیگابایت",dur:"سه روزه",durFilter:"سه روزه",type:"internet",price:"۱۵۴,۳۰۰"},
  {id:"r3d3",name:"۳ روزه ۳ گیگابایت",dur:"سه روزه",durFilter:"سه روزه",type:"internet",price:"۲۲۵,۱۰۰"},
  // هفتگی
  {id:"rw1",name:"۷ روزه ۵۰۰ مگابایت",dur:"هفتگی",durFilter:"هفتگی",type:"internet",price:"۱۳۰,۲۰۰"},
  {id:"rw2",name:"۷ روزه ۱ گیگابایت",dur:"هفتگی",durFilter:"هفتگی",type:"internet",price:"۱۷۹,۸۰۰"},
  {id:"rw3",name:"۷ روزه ۳ گیگابایت",dur:"هفتگی",durFilter:"هفتگی",type:"internet",price:"۲۶۳,۳۰۰"},
  {id:"rw4",name:"۷ روزه ۶ گیگابایت",dur:"هفتگی",durFilter:"هفتگی",type:"internet",price:"۳۵۸,۲۰۰"},
  // پانزده روزه
  {id:"rf1",name:"۱۵ روزه (۱.۵ گیگابایت)",dur:"پانزده روزه",durFilter:"پانزده روزه",type:"internet",price:"۲۰۸,۱۰۰"},
  {id:"rf2",name:"۱۵ روزه ۵ گیگابایت",dur:"پانزده روزه",durFilter:"پانزده روزه",type:"internet",price:"۳۳۸,۴۰۰"},
  // ماهانه اینترنت
  {id:"rm1",name:"۳۰ روزه ۱ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۱۸۶,۹۰۰"},
  {id:"rm2",name:"۳۰ روزه ۲ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۲۵۴,۸۰۰"},
  {id:"rm3",name:"۳۰روزه ۳ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۳۳۸,۴۰۰",badge:"recent"},
  {id:"rm4",name:"۳۰ روزه ۴ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۳۷۶,۶۰۰"},
  {id:"rm5",name:"ماهانه ۵ گیگ",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۴۱۴,۸۰۰"},
  {id:"rm6",name:"۳۰ روزه ۷ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۵۲۳,۰۰۰"},
  {id:"rm7",name:"۳۰ روزه ۸ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۵۸۴,۰۰۰"},
  {id:"rm8",name:"۳۰ روزه ۱۵ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۹۹۹,۰۰۰"},
  {id:"rm9",name:"۳۰ روزه ۲۵ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۱,۵۱۰,۰۰۰",badge:"special"},
  {id:"rm10",name:"۳۰ روزه ۵۰ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۲,۹۰۰,۰۰۰",badge:"special"},
  // دو ماهه
  {id:"r2m1",name:"۶۰ روزه ۳۵ گیگابایت",dur:"دو ماهه",durFilter:"دو ماهه",type:"internet",price:"۲,۶۶۰,۰۰۰"},
  // سه ماهه
  {id:"r3m1",name:"۹۰ روزه ۴۵ گیگابایت",dur:"سه ماهه",durFilter:"سه ماهه",type:"internet",price:"۳,۳۳۰,۰۰۰"},
  {id:"r3m2",name:"۹۰ روزه ۶۰ گیگابایت",dur:"سه ماهه",durFilter:"سه ماهه",type:"internet",price:"۴,۳۳۰,۰۰۰"},
  // یک ساله
  {id:"ry1",name:"۳۶۵ روزه ۱۵۰ گیگابایت",dur:"یک ساله",durFilter:"یک ساله",type:"internet",price:"۸,۸۵۰,۰۰۰"},
  {id:"ry2",name:"۳۶۵ روزه ۳۰۰ گیگابایت",dur:"یک ساله",durFilter:"یک ساله",type:"internet",price:"۱۶,۹۰۰,۰۰۰"},
  // پیامک
  {id:"rsms1",name:"۳۰ روزه ۲۰۰ پیامک درون و برون شبکه",dur:"ماهانه",durFilter:"ماهانه",type:"sms",price:"۴۴,۰۰۰"},
  {id:"rsms2",name:"۳۰ روزه ۵۰۰ پیامک درون و برون شبکه",dur:"ماهانه",durFilter:"ماهانه",type:"sms",price:"۱۰۰,۰۰۰"},
  {id:"rsms3",name:"۳۰ روزه ۱۰۰۰ پیامک درون و برون شبکه",dur:"ماهانه",durFilter:"ماهانه",type:"sms",price:"۱۷۰,۰۰۰"},
  {id:"rsms4",name:"۳۰ روزه ۲۰۰ پیامک",dur:"ماهانه",durFilter:"ماهانه",type:"sms",price:"۴۵,۰۰۰"},
  {id:"rsms5",name:"۱ ماهه ۵۰۰ پیامک فارسی-انگلیسی",dur:"ماهانه",durFilter:"ماهانه",type:"sms",price:"۱۳۳,۵۰۰"},
  // مکالمه
  {id:"rcl1",name:"۱۵۰ دقیقه تماس صوتی درون و برون شبکه ۳۰ روزه",dur:"ماهانه",durFilter:"ماهانه",type:"call",price:"۹۸,۰۰۰"},
  {id:"rcl2",name:"۳۰ روزه ۵۰۰ دقیقه مکالمه درون شبکه",dur:"ماهانه",durFilter:"ماهانه",type:"call",price:"۲۲۴,۰۰۰"},
  {id:"rcl3",name:"۵۰۰ دقیقه تماس صوتی درون و برون شبکه ۳۰ روزه",dur:"ماهانه",durFilter:"ماهانه",type:"call",price:"۳۲۰,۰۰۰"},
  {id:"rcl4",name:"۳۰ روزه ۱۰۰۰ دقیقه مکالمه درون شبکه",dur:"ماهانه",durFilter:"ماهانه",type:"call",price:"۳۹۰,۰۰۰"},
  // رومینگ
  {id:"rro1",name:"عراق ۱۰۰ مگابایت ۷ روزه",dur:"هفتگی",durFilter:"هفتگی",type:"roaming",price:"۹۹۰,۰۰۰",desc:"رومینگ عراق"},
  {id:"rro2",name:"عراق ۳۵۰ مگابایت ۷ روزه",dur:"هفتگی",durFilter:"هفتگی",type:"roaming",price:"۳,۳۰۰,۰۰۰",desc:"رومینگ عراق"},
  {id:"rro3",name:"عراق ۷۵۰ مگابایت ۷ روزه",dur:"هفتگی",durFilter:"هفتگی",type:"roaming",price:"۶,۵۰۰,۰۰۰",desc:"رومینگ عراق"},
];
const _RT_DUR_FILTERS=["روزانه","هفتگی","ماهانه","سه ماهه","یک ساله"];
const _RT_TYPE_OPTS:[string,string,string,string][]=[["internet","اینترنت","📶",""],["call","مکالمه","📞",""],["sms","پیامک","💬",""],["roaming","رومینگ","🌍",""]];
const _RT_SORT_OPTS:[string,string][]=[["price-asc","ارزان‌ترین"],["price-desc","گران‌ترین"],["special","پیشنهادی"],["popular","محبوب‌ترین"]];

// ─── Rightel Postpaid data ────────────────────────────────────────────────────
const _RT_POST_SPECIAL:RightelPkg[]=[
  {id:"ps1",name:"۳۰ روزه ۲۵ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۱,۵۱۰,۰۰۰",badge:"special"},
  {id:"ps2",name:"۳۰ روزه ۵۰ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۲,۹۰۰,۰۰۰",badge:"special"},
];
const _RT_POST_PKGS:RightelPkg[]=[
  // ماهانه — اینترنت
  {id:"pm1",name:"۳۰ روزه ۱ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۱۸۶,۹۰۰"},
  {id:"pm2",name:"۳۰ روزه ۲ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۲۵۴,۸۰۰"},
  {id:"pm3",name:"۳۰ روزه ۳ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۳۳۸,۴۰۰"},
  {id:"pm4",name:"۳۰ روزه ۴ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۳۷۶,۶۰۰"},
  {id:"pm5",name:"ماهانه ۵ گیگ",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۴۱۴,۸۰۰"},
  {id:"pm6",name:"۳۰ روزه ۷ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۵۲۳,۰۰۰"},
  {id:"pm7",name:"۳۰ روزه ۸ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۵۸۴,۰۰۰"},
  {id:"pm8",name:"۳۰ روزه ۱۰ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۶۹۹,۰۰۰"},
  {id:"pm9",name:"۳۰ روزه ۱۵ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۹۹۹,۰۰۰"},
  {id:"pm10",name:"۳۰ روزه ۲۵ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۱,۵۱۰,۰۰۰",badge:"special"},
  {id:"pm11",name:"۳۰ روزه ۵۰ گیگابایت",dur:"ماهانه",durFilter:"ماهانه",type:"internet",price:"۲,۹۰۰,۰۰۰",badge:"special"},
  // دو ماهه
  {id:"pb1",name:"۶۰ روزه ۳۵ گیگابایت",dur:"دو ماهه",durFilter:"دو ماهه",type:"internet",price:"۲,۶۶۰,۰۰۰"},
  // سه ماهه
  {id:"pt1",name:"۹۰ روزه ۴۵ گیگابایت",dur:"سه ماهه",durFilter:"سه ماهه",type:"internet",price:"۳,۳۳۰,۰۰۰"},
  {id:"pt2",name:"۹۰ روزه ۶۰ گیگابایت",dur:"سه ماهه",durFilter:"سه ماهه",type:"internet",price:"۴,۳۳۰,۰۰۰"},
  // شش ماهه
  {id:"ph1",name:"۱۸۰ روزه ۵۰ گیگابایت",dur:"شش ماهه",durFilter:"شش ماهه",type:"internet",price:"۳,۵۰۰,۰۰۰"},
  {id:"ph2",name:"۱۸۰ روزه ۸۰ گیگابایت",dur:"شش ماهه",durFilter:"شش ماهه",type:"internet",price:"۵,۳۰۰,۰۰۰"},
  // یک ساله
  {id:"py1",name:"۳۶۵ روزه ۱۵۰ گیگابایت",dur:"یک ساله",durFilter:"یک ساله",type:"internet",price:"۸,۸۵۰,۰۰۰"},
  {id:"py2",name:"۳۶۵ روزه ۳۰۰ گیگابایت",dur:"یک ساله",durFilter:"یک ساله",type:"internet",price:"۱۶,۹۰۰,۰۰۰"},
  // پانزده روزه
  {id:"pf1",name:"۱۵ روزه (۱.۵ گیگابایت)",dur:"پانزده روزه",durFilter:"پانزده روزه",type:"internet",price:"۲۰۸,۱۰۰"},
  {id:"pf2",name:"۱۵ روزه ۳ گیگابایت",dur:"پانزده روزه",durFilter:"پانزده روزه",type:"internet",price:"۳۰۱,۶۰۰"},
  {id:"pf3",name:"۱۵ روزه ۵ گیگابایت",dur:"پانزده روزه",durFilter:"پانزده روزه",type:"internet",price:"۳۳۸,۴۰۰"},
  // هفتگی — اینترنت
  {id:"pw1",name:"۷ روزه ۵۰۰ مگابایت",dur:"هفتگی",durFilter:"هفتگی",type:"internet",price:"۱۳۰,۲۰۰"},
  {id:"pw2",name:"۷ روزه ۱ گیگابایت",dur:"هفتگی",durFilter:"هفتگی",type:"internet",price:"۱۷۹,۸۰۰"},
  {id:"pw3",name:"۷ روزه ۳ گیگابایت",dur:"هفتگی",durFilter:"هفتگی",type:"internet",price:"۲۶۳,۳۰۰"},
  {id:"pw4",name:"۷ روزه ۶ گیگابایت",dur:"هفتگی",durFilter:"هفتگی",type:"internet",price:"۳۵۸,۲۰۰"},
  // سه روزه
  {id:"p3d1",name:"۳ روزه ۱۵۰ مگابایت",dur:"سه روزه",durFilter:"سه روزه",type:"internet",price:"۶۱,۴۰۰"},
  {id:"p3d2",name:"۳ روزه ۱ گیگابایت",dur:"سه روزه",durFilter:"سه روزه",type:"internet",price:"۱۵۴,۳۰۰"},
  {id:"p3d3",name:"۳ روزه ۳ گیگابایت",dur:"سه روزه",durFilter:"سه روزه",type:"internet",price:"۲۲۵,۱۰۰"},
  // روزانه
  {id:"pd1",name:"روزانه ۱۰۰ مگ",dur:"روزانه",durFilter:"روزانه",type:"internet",price:"۳۸,۲۰۰"},
  {id:"pd2",name:"۱ روزه ۳۰۰ مگابایت",dur:"روزانه",durFilter:"روزانه",type:"internet",price:"۶۹,۳۰۰"},
  {id:"pd3",name:"۱ روزه ۵۰۰ مگابایت",dur:"روزانه",durFilter:"روزانه",type:"internet",price:"۸۷,۷۰۰"},
  {id:"pd4",name:"۱ روزه ۱ گیگابایت",dur:"روزانه",durFilter:"روزانه",type:"internet",price:"۱۱۷,۵۰۰"},
  {id:"pd5",name:"۱ روزه ۳ گیگابایت",dur:"روزانه",durFilter:"روزانه",type:"internet",price:"۱۷۹,۸۰۰"},
  // پیامک
  {id:"psms1",name:"۳۰ روزه ۲۰۰ پیامک درون و برون شبکه",dur:"ماهانه",durFilter:"ماهانه",type:"sms",price:"۴۰,۰۰۰"},
  {id:"psms2",name:"۳۰ روزه ۵۰۰ پیامک درون و برون شبکه",dur:"ماهانه",durFilter:"ماهانه",type:"sms",price:"۹۰,۰۰۰"},
  {id:"psms3",name:"۳۰ روزه ۱۰۰۰ پیامک درون و برون شبکه",dur:"ماهانه",durFilter:"ماهانه",type:"sms",price:"۱۶۰,۰۰۰"},
  {id:"psms4",name:"۱ ماهه ۲۰۰ پیامک فارسی-انگلیسی",dur:"ماهانه",durFilter:"ماهانه",type:"sms",price:"۴۰,۰۰۰"},
  // مکالمه
  {id:"pcl1",name:"۱۵۰ دقیقه تماس صوتی درون و برون شبکه ۳۰ روزه",dur:"ماهانه",durFilter:"ماهانه",type:"call",price:"۹۸,۰۰۰"},
  {id:"pcl2",name:"۳۰ روزه ۵۰۰ دقیقه مکالمه درون شبکه",dur:"ماهانه",durFilter:"ماهانه",type:"call",price:"۲۲۴,۰۰۰"},
  {id:"pcl3",name:"۵۰۰ دقیقه تماس صوتی درون و برون شبکه ۳۰ روزه",dur:"ماهانه",durFilter:"ماهانه",type:"call",price:"۳۲۰,۰۰۰"},
  {id:"pcl4",name:"۳۰ روزه ۱۰۰۰ دقیقه مکالمه درون شبکه",dur:"ماهانه",durFilter:"ماهانه",type:"call",price:"۳۹۰,۰۰۰"},
  // ترکیبی
  {id:"pcb1",name:"۳۰ دقیقه مکالمه + ۲۰ پیامک ۷ روزه",dur:"هفتگی",durFilter:"هفتگی",type:"combo",price:"۷,۰۹۰,۰۰۰",desc:"۲۰ پیامک"},
  // رومینگ
  {id:"pro1",name:"عراق ۱۰۰ مگابایت ۷ روزه",dur:"هفتگی",durFilter:"هفتگی",type:"roaming",price:"۹۹۰,۰۰۰",desc:"عراق ۱۰۰ مگابایت ۷ روزه"},
  {id:"pro2",name:"عراق ۳۵۰ مگابایت ۷ روزه",dur:"هفتگی",durFilter:"هفتگی",type:"roaming",price:"۳,۳۰۰,۰۰۰",desc:"عراق ۳۵۰ مگابایت ۷ روزه"},
  {id:"pro3",name:"عراق ۷۵۰ مگابایت ۷ روزه",dur:"هفتگی",durFilter:"هفتگی",type:"roaming",price:"۶,۵۰۰,۰۰۰",desc:"عراق ۷۵۰ مگابایت ۷ روزه"},
];
const _RT_POST_DUR_FILTERS=["روزانه","هفتگی","سه روزه","پانزده روزه","ماهانه","دو ماهه","سه ماهه","شش ماهه","یک ساله"];
const _RT_POST_TYPE_OPTS:[string,string,string][]=[["internet","اینترنت","📶"],["call","مکالمه","📞"],["sms","پیامک","💬"],["combo","ترکیبی","📦"],["roaming","رومینگ","🌍"]];

function RightelPostpaidInternetScreen({phone,onBack,onGoToPayment}:{phone:string;user?:UserData;onUpdate?:(u:UserData,tx:TxRecord)=>void;onBack:()=>void;onGoToPayment:(d:{phone:string;operator:Operator|null;amount:string;type:"internet"})=>void}){
  const [durFilter,setDurFilter]=useState<string|null>(null);
  const [typeFilter,setTypeFilter]=useState<string|null>(null);
  const [sortBy,setSortBy]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [showSort,setShowSort]=useState(false);
  const [showType,setShowType]=useState(false);
  const [selId,setSelId]=useState<string|null>(null);
  useEffect(()=>{const t=setTimeout(()=>setLoading(false),900);return()=>clearTimeout(t);},[]);

  const filtered=[..._RT_POST_PKGS].filter(p=>{
    if(durFilter&&p.durFilter!==durFilter)return false;
    if(typeFilter&&p.type!==typeFilter)return false;
    return true;
  }).sort((a,b)=>{
    const pa=()=>parseFloat(a.price.replace(/[^0-9]/g,""));
    const pb=()=>parseFloat(b.price.replace(/[^0-9]/g,""));
    if(sortBy==="price-asc")return pa()-pb();
    if(sortBy==="price-desc")return pb()-pa();
    if(sortBy==="special")return (b.badge?1:0)-(a.badge?1:0);
    return 0;
  });
  const showSpecial=!durFilter&&!typeFilter;
  const selPkg=[..._RT_POST_PKGS,..._RT_POST_SPECIAL].find(p=>p.id===selId)??null;

  const typeLabels:{[k:string]:string}={internet:"اینترنت",call:"مکالمه",sms:"پیامک",roaming:"رومینگ",combo:"ترکیبی"};
  const typeColors:{[k:string]:[string,string]}={internet:["rgba(0,214,176,0.12)","rgba(0,214,176,0.75)"],call:["rgba(160,100,255,0.12)","rgba(180,140,255,0.85)"],sms:["rgba(250,180,50,0.12)","rgba(250,180,50,0.9)"],combo:["rgba(100,200,120,0.12)","rgba(120,220,140,0.85)"],roaming:["rgba(100,160,255,0.12)","rgba(100,200,255,0.85)"]};

  const TypePill=({t}:{t:string})=>{const [bg,color]=typeColors[t]??["rgba(255,255,255,0.08)","rgba(255,255,255,0.5)"];return <span style={{fontSize:10,background:bg,color,padding:"1px 7px",borderRadius:6,fontFamily:"Vazirmatn"}}>{typeLabels[t]??t}</span>;};

  const RTBadge2=({type}:{type:"recent"|"special"})=>type==="recent"?null:<span style={{display:"inline-flex",padding:"2px 9px",borderRadius:8,fontSize:10,fontWeight:700,fontFamily:"Vazirmatn",background:"rgba(0,214,176,0.12)",color:"#00D6B0",border:"1px solid rgba(0,214,176,0.3)"}}>پیشنهاد آن‌پرداز</span>;

  const PostCard=({p}:{p:RightelPkg})=>{const isSel=selId===p.id;const volMatch=(p.name+" "+(p.desc||"")).match(/[\d.]+\s*(?:گیگ(?:ابایت)?|مگ(?:ابایت)?|GB|MB)/i);const volLabel=volMatch?volMatch[0]:null;return <button onClick={()=>setSelId(isSel?null:p.id)} className={`anp-rt-card${isSel?" anp-rt-card--sel":""}`} style={{display:"flex",alignItems:"center",width:"100%",background:isSel?"rgba(0,214,176,0.1)":"var(--card-bg)",border:`1.5px solid ${isSel?"#00D6B0":"var(--border-light,rgba(255,255,255,0.09))"}`,borderRadius:22,padding:"16px 14px",cursor:"pointer",textAlign:"right",marginBottom:10,transition:"all .15s",fontFamily:"Vazirmatn",boxSizing:"border-box",boxShadow:isSel?"0 0 0 3px rgba(0,214,176,0.1)":"none"}}>
    <div style={{flex:1,minWidth:0}}>
      {volLabel&&<div style={{fontSize:20,fontWeight:900,color:"var(--text-primary)",lineHeight:1.2,marginBottom:2,textAlign:"right"}}>{volLabel}</div>}
      <div style={{fontSize:volLabel?12:15,fontWeight:volLabel?600:800,color:volLabel?"var(--text-secondary)":"var(--text-primary)",marginBottom:4,lineHeight:1.4,textAlign:"right"}}>{p.name}</div>
      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:"var(--text-muted)",background:"var(--card-bg2,rgba(255,255,255,0.07))",padding:"2px 8px",borderRadius:5}}>{p.dur}</span>
        <TypePill t={p.type}/>
      </div>
      {p.desc&&!volLabel&&<div style={{fontSize:11,color:"var(--text-muted)",marginTop:4,lineHeight:1.5}}>{p.desc}</div>}
      {p.badge&&<div style={{marginTop:4}}><RTBadge2 type={p.badge}/></div>}
    </div>
    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",justifyContent:"center",flexShrink:0,marginRight:12,gap:8}}>
      <div style={{textAlign:"left"}}><div style={{fontSize:15,fontWeight:900,color:"#00D6B0",direction:"ltr",whiteSpace:"nowrap"}}>{p.price}</div><div style={{fontSize:10,color:"rgba(0,214,176,0.5)",textAlign:"left",marginTop:1}}>ریال</div></div>
      <div style={{width:24,height:24,borderRadius:"50%",background:isSel?"#00D6B0":"transparent",border:`2px solid ${isSel?"#00D6B0":"var(--border-color,rgba(255,255,255,0.3))"}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",flexShrink:0}}>
        {isSel&&<svg width="12" height="12" viewBox="0 0 14 14"><path d="M2.5 7l3 3 6-6" stroke="#071d2c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
      </div>
    </div>
  </button>;};

  return <>
  <div className="subscreen anp-pkg-screen" dir="rtl" style={{display:"flex",flexDirection:"column",height:"100%",position:"relative",background:"#111"}}>
    {/* Header */}
    <div className="anp-pkg-header" style={{display:"flex",alignItems:"center",padding:"0 14px",height:64,borderBottom:"1px solid rgba(255,255,255,0.07)",flexShrink:0,background:"#111"}}>
      <button onClick={onBack} className="anp-pkg-back" style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.07)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l6-6-6-6"/></svg>
      </button>
      <h2 className="anp-pkg-title" style={{flex:1,textAlign:"center",fontSize:16,fontWeight:800,color:"#fff",fontFamily:"Vazirmatn",margin:0}}>اینترنت رایتل دائمی</h2>
      <div className="anp-pkg-simtype-badge" style={{padding:"4px 10px",background:"rgba(0,214,176,0.12)",border:"1px solid rgba(0,214,176,0.35)",borderRadius:10,fontSize:11,fontWeight:700,color:"#00D6B0",fontFamily:"Vazirmatn",flexShrink:0}}>دائمی</div>
    </div>

    {/* Filter bar */}
    <div className="anp-pkg-filters" style={{flexShrink:0,overflowX:"auto",display:"flex",gap:8,padding:"10px 14px",scrollbarWidth:"none",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
      <_PkgChipBtn label="مرتب‌سازی" active={sortBy!==null} onClick={()=>setShowSort(true)}/>
      <_PkgChipBtn label={typeFilter?typeLabels[typeFilter]??"نوع بسته":"نوع بسته"} active={typeFilter!==null} onClick={()=>setShowType(true)}/>
      {_RT_POST_DUR_FILTERS.map(f=><_DurChipBtn key={f} label={f} active={durFilter===f} onClick={()=>setDurFilter(durFilter===f?null:f)}/>)}
    </div>

    {/* Package list */}
    <div className="anp-pkg-list" style={{flex:1,overflowY:"auto",padding:"14px 14px 320px",scrollbarWidth:"none",background:"#111"}}>
      {loading?([1,2,3,4,5].map(i=><div key={i} style={{height:82,borderRadius:22,background:"rgba(255,255,255,0.05)",marginBottom:10,animation:"pulse 1.4s ease-in-out infinite",animationDelay:`${i*0.1}s`}}/>)):(
        <>
          {showSpecial&&<>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{fontSize:14,fontWeight:800,color:"var(--text-primary)",fontFamily:"Vazirmatn"}}>پیشنهادات ویژه</span>
              <div style={{flex:1,height:1,background:"var(--border-faint,rgba(255,255,255,0.08))"}}/>
            </div>
            {_RT_POST_SPECIAL.map(p=><PostCard key={p.id} p={p}/>)}
            <div style={{display:"flex",alignItems:"center",gap:8,margin:"14px 0 10px"}}>
              <span style={{fontSize:14,fontWeight:800,color:"var(--text-primary)",fontFamily:"Vazirmatn"}}>همه بسته‌ها</span>
              <div style={{flex:1,height:1,background:"var(--border-faint,rgba(255,255,255,0.08))"}}/>
              <span style={{fontSize:11,color:"var(--text-muted)",fontFamily:"Vazirmatn"}}>{_RT_POST_PKGS.length} بسته</span>
            </div>
          </>}
          {filtered.length===0?<div style={{textAlign:"center",padding:"60px 20px",fontFamily:"Vazirmatn"}}><div style={{margin:"0 auto 14px",width:54,height:54,borderRadius:18,background:"rgba(0,214,176,0.07)",border:"1px solid rgba(0,214,176,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(0,214,176,0.5)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div><div style={{fontSize:15,fontWeight:700,color:"rgba(255,255,255,0.55)",marginBottom:6}}>بسته‌ای موجود نیست</div><div style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>فیلتر را تغییر دهید</div></div>:filtered.map(p=><PostCard key={p.id} p={p}/>)}
        </>
      )}
    </div>

    {selPkg&&<div className="sab-pkg-preview"><span className="sab-pkg-preview-name">{selPkg.name}</span><span className="sab-pkg-preview-price">{selPkg.price} <span>ریال</span></span></div>}
    <StickyActionBtn label="همین بسته را می‌خرم" onClick={()=>selPkg&&onGoToPayment({phone,operator:OPERATORS.rightel,amount:`${selPkg.name} — ${selPkg.price} ریال`,type:"internet"})} disabled={!selPkg} noBleed/>
  </div>

  {/* Sort sheet */}
  {showSort&&<>
    <div onClick={()=>setShowSort(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200}}/>
    <div style={{position:"fixed",bottom:0,right:0,left:0,background:"#1a1a1a",borderRadius:"22px 22px 0 0",padding:"20px 16px 40px",zIndex:201,fontFamily:"Vazirmatn",direction:"rtl"}}>
      <div style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,0.15)",margin:"0 auto 20px"}}/>
      <div style={{fontSize:15,fontWeight:800,color:"#fff",marginBottom:16}}>مرتب‌سازی</div>
      {_RT_SORT_OPTS.map(([key,label])=><button key={key} onClick={()=>{setSortBy(sortBy===key?null:key);setShowSort(false);}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",background:sortBy===key?"rgba(0,214,176,0.1)":"transparent",border:`1px solid ${sortBy===key?"rgba(0,214,176,0.3)":"rgba(255,255,255,0.08)"}`,borderRadius:12,padding:"13px 14px",marginBottom:8,cursor:"pointer",color:sortBy===key?"#00D6B0":"#fff",fontSize:13,fontFamily:"Vazirmatn",textAlign:"right"}}>
        {label}{sortBy===key&&<svg width="14" height="14" viewBox="0 0 14 14"><path d="M2.5 7l3 3 6-6" stroke="#00D6B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
      </button>)}
    </div>
  </>}

  {/* Type filter sheet */}
  {showType&&<>
    <div onClick={()=>setShowType(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200}}/>
    <div className="anp-filter-sheet" style={{position:"fixed",bottom:0,right:0,left:0,background:"#1a1a1a",borderRadius:"22px 22px 0 0",padding:"20px 16px 40px",zIndex:201,fontFamily:"Vazirmatn",direction:"rtl"}}>
      <div className="anp-filter-sheet-handle" style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,0.15)",margin:"0 auto 20px"}}/>
      <div className="anp-filter-sheet-title" style={{fontSize:15,fontWeight:800,color:"#fff",marginBottom:16}}>نوع بسته</div>
      {_RT_POST_TYPE_OPTS.map(([key,label])=>{const isAct=typeFilter===key;const pkgIconPath=(k:string)=>k==="internet"?<><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill={isAct?"#00D6B0":"rgba(255,255,255,0.5)"} stroke="none"/></>:k==="call"?<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.5 16z"/>:k==="sms"?<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>:k==="combo"?<><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>:<><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>;return <button key={key} className={`anp-filter-btn${isAct?" anp-filter-btn-active":""}`} onClick={()=>{setTypeFilter(typeFilter===key?null:key);setDurFilter(null);setShowType(false);}} style={{display:"flex",alignItems:"center",gap:12,width:"100%",background:isAct?"rgba(0,214,176,0.1)":"transparent",border:`1px solid ${isAct?"rgba(0,214,176,0.3)":"rgba(255,255,255,0.08)"}`,borderRadius:12,padding:"13px 14px",marginBottom:8,cursor:"pointer",color:isAct?"#00D6B0":"#fff",fontSize:13,fontFamily:"Vazirmatn",textAlign:"right"}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isAct?"#00D6B0":"rgba(255,255,255,0.5)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{pkgIconPath(key)}</svg>
          <span style={{flex:1}}>{label}</span>
          {isAct&&<svg width="14" height="14" viewBox="0 0 14 14"><path d="M2.5 7l3 3 6-6" stroke="#00D6B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
        </button>;})}
    </div>
  </>}
  </>;
}

// Generic SIM type selection — shared across all operators
function SimTypeScreen({phone,operator,onBack,onSelect}:{phone:string;operator:Operator;onBack:()=>void;onSelect:(t:"postpaid"|"prepaid")=>void}){
  const [chosen,setChosen]=useState<"postpaid"|"prepaid"|null>(null);
  const col=operator.id==="mci"?"#009856":operator.color;
  const colRgb=operator.id==="mci"?"0,152,86":col==="#9C27B0"?"156,39,176":col==="#FFD700"?"255,215,0":"0,188,212";
  return <div className="subscreen" dir="rtl">
    <div className="subscreen-header">
      <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">نوع سیم‌کارت</h2>
      <div style={{width:36}}/>
    </div>
    <div className="subscreen-body">
      <div className="anp-simtype-phone-info" style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:`rgba(${colRgb},0.08)`,border:`1px solid rgba(${colRgb},0.2)`,borderRadius:14,marginBottom:24}}>
        <OperatorBadge op={operator} size="sm"/>
        <div>
          <div style={{fontSize:15,fontWeight:800,color:"var(--text-primary)",fontFamily:"Vazirmatn"}}>{toFaDigits(phone)}</div>
          <div className="anp-simtype-op-name" style={{fontSize:11,color:`rgba(${colRgb},0.9)`,fontFamily:"Vazirmatn",marginTop:1}}>{operator.name}</div>
        </div>
      </div>
      <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)",fontFamily:"Vazirmatn",marginBottom:14,textAlign:"right"}}>نوع سیم‌کارت خود را انتخاب کنید</div>
      {(["postpaid","prepaid"] as const).map(t=>{
        const isPrepaid=t==="prepaid";const isChosen=chosen===t;
        return <button key={t} className={`anp-simtype-btn${isChosen?" anp-simtype-btn--chosen":""}`} onClick={()=>setChosen(t)} style={{display:"flex",alignItems:"center",gap:14,width:"100%",background:isChosen?`rgba(${colRgb},0.1)`:"var(--card-bg)",border:`2px solid ${isChosen?col:"var(--border-color)"}`,borderRadius:18,padding:"18px 16px",marginBottom:12,cursor:"pointer",textAlign:"right",transition:"all .2s",fontFamily:"Vazirmatn",boxSizing:"border-box"}}>
          <div className={`anp-simtype-icon${isChosen?" anp-simtype-icon--chosen":""}`} style={{width:46,height:46,borderRadius:14,background:isChosen?`rgba(${colRgb},0.18)`:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background .2s"}}>
            {isPrepaid
              ? <svg className="anp-simtype-svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isChosen?col:"rgba(255,255,255,0.55)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><path d="M6 15h4"/><path d="M14 15h4"/></svg>
              : <svg className="anp-simtype-svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isChosen?col:"rgba(255,255,255,0.55)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="3"/><path d="M9 22v-3h6v3"/><circle cx="12" cy="7" r="1.2" fill={isChosen?col:"rgba(255,255,255,0.55)"} stroke="none"/><path d="M9 12h6"/><path d="M9 16h4"/></svg>}
          </div>
          <div style={{flex:1}}>
            <div className="anp-simtype-label" style={{fontSize:16,fontWeight:800,color:isChosen?col:"var(--text-primary)",marginBottom:3}}>{isPrepaid?"اعتباری":"دائمی"}</div>
            <div style={{fontSize:12,color:"var(--text-muted)"}}>{isPrepaid?"بسته‌های مناسب سیم‌کارت اعتباری":"بسته‌های مناسب سیم‌کارت دائمی"}</div>
          </div>
          <div className={`anp-simtype-radio${isChosen?" anp-simtype-radio--chosen":""}`} style={{width:22,height:22,borderRadius:11,border:`2px solid ${isChosen?col:"rgba(255,255,255,0.2)"}`,background:isChosen?col:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .2s"}}>
            {isChosen&&<svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
          </div>
        </button>;
      })}
      <StickyActionBtn label="ادامه" onClick={()=>chosen&&onSelect(chosen)} disabled={!chosen}/>
    </div>
  </div>;
}
function RightelSimTypeScreen({phone,operator,onBack,onSelect}:{phone:string;operator:Operator;onBack:()=>void;onSelect:(t:"postpaid"|"prepaid")=>void}){
  return <SimTypeScreen phone={phone} operator={operator} onBack={onBack} onSelect={onSelect}/>;
}

function RightelPrepaidInternetScreen({phone,onBack,onGoToPayment}:{phone:string;user?:UserData;onUpdate?:(u:UserData,tx:TxRecord)=>void;onBack:()=>void;onGoToPayment:(d:{phone:string;operator:Operator|null;amount:string;type:"internet"})=>void}){
  const [durFilter,setDurFilter]=useState<string|null>(null);
  const [typeFilter,setTypeFilter]=useState<string|null>(null);
  const [sortBy,setSortBy]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [showSort,setShowSort]=useState(false);
  const [showType,setShowType]=useState(false);
  const [selId,setSelId]=useState<string|null>(null);
  useEffect(()=>{const t=setTimeout(()=>setLoading(false),900);return()=>clearTimeout(t);},[]);

  const filtered=[..._RT_PKGS].filter(p=>{
    if(durFilter&&p.durFilter!==durFilter)return false;
    if(typeFilter&&p.type!==typeFilter)return false;
    return true;
  }).sort((a,b)=>{
    if(sortBy==="price-asc"||sortBy==="ارزان‌ترین"){const pa=parseFloat(a.price.replace(/[^0-9]/g,""));const pb=parseFloat(b.price.replace(/[^0-9]/g,""));return pa-pb;}
    if(sortBy==="price-desc"||sortBy==="گران‌ترین"){const pa=parseFloat(a.price.replace(/[^0-9]/g,""));const pb=parseFloat(b.price.replace(/[^0-9]/g,""));return pb-pa;}
    if(sortBy==="special"||sortBy==="پیشنهادی")return (b.badge?1:0)-(a.badge?1:0);
    return 0;
  });
  const showSpecial=!durFilter&&!typeFilter;
  const selPkg=[..._RT_PKGS,..._RT_SPECIAL].find(p=>p.id===selId)??null;

  const RTBadge=({type}:{type:"recent"|"special"})=>type==="recent"?null:<span style={{display:"inline-flex",padding:"2px 9px",borderRadius:8,fontSize:10,fontWeight:700,fontFamily:"Vazirmatn",background:"rgba(0,214,176,0.12)",color:"#00D6B0",border:"1px solid rgba(0,214,176,0.3)"}}>پیشنهاد آن‌پرداز</span>;

  const TypeTag=({t}:{t:RightelPkg["type"]})=>{
    const cfg:{[k:string]:[string,string]}={internet:["rgba(0,214,176,0.12)","rgba(0,214,176,0.7)"],call:["rgba(160,100,255,0.12)","rgba(180,140,255,0.85)"],sms:["rgba(250,180,50,0.12)","rgba(250,180,50,0.9)"],roaming:["rgba(100,160,255,0.12)","rgba(100,200,255,0.85)"]};
    const labels:{[k:string]:string}={internet:"اینترنت",call:"مکالمه",sms:"پیامک",roaming:"رومینگ"};
    const [bg,color]=cfg[t]??["rgba(255,255,255,0.08)","rgba(255,255,255,0.5)"];
    return <span style={{fontSize:10,background:bg,color,padding:"1px 7px",borderRadius:6,fontFamily:"Vazirmatn"}}>{labels[t]??t}</span>;
  };

  const RTCard=({p}:{p:RightelPkg})=>{const isSel=selId===p.id;const volMatch=(p.name+" "+(p.desc||"")).match(/[\d.]+\s*(?:گیگ(?:ابایت)?|مگ(?:ابایت)?|GB|MB)/i);const volLabel=volMatch?volMatch[0]:null;return <button onClick={()=>setSelId(isSel?null:p.id)} className={`anp-rt-card${isSel?" anp-rt-card--sel":""}`} style={{display:"flex",alignItems:"center",width:"100%",background:isSel?"rgba(0,214,176,0.1)":"var(--card-bg)",border:`1.5px solid ${isSel?"#00D6B0":"var(--border-light,rgba(255,255,255,0.09))"}`,borderRadius:22,padding:"16px 14px",cursor:"pointer",textAlign:"right",marginBottom:10,transition:"all .15s",fontFamily:"Vazirmatn",boxSizing:"border-box",position:"relative",boxShadow:isSel?"0 0 0 3px rgba(0,214,176,0.1)":"none"}}>
    <div style={{flex:1,minWidth:0}}>
      {volLabel&&<div style={{fontSize:20,fontWeight:900,color:"var(--text-primary)",lineHeight:1.2,marginBottom:2,textAlign:"right"}}>{volLabel}</div>}
      <div style={{fontSize:volLabel?12:15,fontWeight:volLabel?600:800,color:volLabel?"var(--text-secondary)":"var(--text-primary)",marginBottom:4,lineHeight:1.4,textAlign:"right"}}>{p.name}</div>
      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:"var(--text-muted)",background:"var(--card-bg2,rgba(255,255,255,0.07))",padding:"2px 8px",borderRadius:5}}>{p.dur}</span>
        <TypeTag t={p.type}/>
      </div>
      {p.desc&&!volLabel&&<div style={{fontSize:11,color:"var(--text-muted)",marginTop:4,lineHeight:1.5}}>{p.desc}</div>}
      {p.badge&&<div style={{marginTop:4}}><RTBadge type={p.badge}/></div>}
    </div>
    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",justifyContent:"center",flexShrink:0,marginRight:12,gap:8}}>
      <div style={{textAlign:"left"}}>
        <div style={{fontSize:15,fontWeight:900,color:"#00D6B0",direction:"ltr",whiteSpace:"nowrap"}}>{p.price}</div>
        <div style={{fontSize:10,color:"rgba(0,214,176,0.5)",textAlign:"left",marginTop:1}}>ریال</div>
      </div>
      <div style={{width:24,height:24,borderRadius:"50%",background:isSel?"#00D6B0":"transparent",border:`2px solid ${isSel?"#00D6B0":"var(--border-color,rgba(255,255,255,0.3))"}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",flexShrink:0}}>
        {isSel&&<svg width="12" height="12" viewBox="0 0 14 14"><path d="M2.5 7l3 3 6-6" stroke="#071d2c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
      </div>
    </div>
  </button>;};

  return <>
  <div className="subscreen anp-pkg-screen" dir="rtl" style={{display:"flex",flexDirection:"column",height:"100%",position:"relative",background:"#111"}}>
    {/* Header */}
    <div className="anp-pkg-header" style={{display:"flex",alignItems:"center",padding:"0 14px",height:64,borderBottom:"1px solid rgba(255,255,255,0.07)",flexShrink:0,background:"#111"}}>
      <button onClick={onBack} className="anp-pkg-back" style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.07)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l6-6-6-6"/></svg>
      </button>
      <h2 className="anp-pkg-title" style={{flex:1,textAlign:"center",fontSize:16,fontWeight:800,color:"#fff",fontFamily:"Vazirmatn",margin:0}}>اینترنت رایتل اعتباری</h2>
      {/* Sim type badge */}
      <div className="anp-pkg-simtype-badge" style={{padding:"4px 10px",background:"rgba(156,39,176,0.15)",border:"1px solid rgba(156,39,176,0.35)",borderRadius:10,fontSize:11,fontWeight:700,color:"#ce93d8",fontFamily:"Vazirmatn",flexShrink:0}}>اعتباری</div>
    </div>

    {/* Filter bar */}
    <div className="anp-pkg-filters" style={{flexShrink:0,overflowX:"auto",display:"flex",gap:8,padding:"10px 14px",scrollbarWidth:"none",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
      <_PkgChipBtn label="مرتب‌سازی" active={sortBy!==null} onClick={()=>setShowSort(true)}/>
      <_PkgChipBtn label={typeFilter?{internet:"اینترنت",call:"مکالمه",sms:"پیامک",roaming:"رومینگ"}[typeFilter]??"نوع بسته":"نوع بسته"} active={typeFilter!==null} onClick={()=>setShowType(true)}/>
      {_RT_DUR_FILTERS.map(f=><_DurChipBtn key={f} label={f} active={durFilter===f} onClick={()=>setDurFilter(durFilter===f?null:f)}/>)}
    </div>

    {/* List */}
    <div className="anp-pkg-list" style={{flex:1,overflowY:"auto",padding:"14px 14px 320px",scrollbarWidth:"none",background:"#111"}}>
      {loading?([1,2,3,4,5].map(i=><div key={i} style={{height:82,borderRadius:22,background:"rgba(255,255,255,0.05)",marginBottom:10,animation:"pulse 1.4s ease-in-out infinite",animationDelay:`${i*0.1}s`}}/>)):(
        <>
          {showSpecial&&<>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{fontSize:14,fontWeight:800,color:"var(--text-primary)",fontFamily:"Vazirmatn"}}>پیشنهادات ویژه</span>
              <div style={{flex:1,height:1,background:"var(--border-faint,rgba(255,255,255,0.08))"}}/>
            </div>
            {_RT_SPECIAL.map(p=><RTCard key={p.id} p={p}/>)}
            <div style={{display:"flex",alignItems:"center",gap:8,margin:"14px 0 10px"}}>
              <span style={{fontSize:14,fontWeight:800,color:"var(--text-primary)",fontFamily:"Vazirmatn"}}>همه بسته‌ها</span>
              <div style={{flex:1,height:1,background:"var(--border-faint,rgba(255,255,255,0.08))"}}/>
              <span style={{fontSize:11,color:"var(--text-muted)",fontFamily:"Vazirmatn"}}>{_RT_PKGS.length} بسته</span>
            </div>
          </>}
          {filtered.length===0?<div style={{textAlign:"center",padding:"60px 20px",fontFamily:"Vazirmatn"}}><div style={{margin:"0 auto 14px",width:54,height:54,borderRadius:18,background:"rgba(0,214,176,0.07)",border:"1px solid rgba(0,214,176,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(0,214,176,0.5)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div><div style={{fontSize:15,fontWeight:700,color:"rgba(255,255,255,0.55)",marginBottom:6}}>بسته‌ای موجود نیست</div><div style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>فیلتر را تغییر دهید</div></div>:filtered.map(p=><RTCard key={p.id} p={p}/>)}
        </>
      )}
    </div>

    {selPkg&&<div className="sab-pkg-preview"><span className="sab-pkg-preview-name">{selPkg.name}</span><span className="sab-pkg-preview-price">{selPkg.price} <span>ریال</span></span></div>}
    <StickyActionBtn label="همین بسته را می‌خرم" onClick={()=>selPkg&&onGoToPayment({phone,operator:OPERATORS.rightel,amount:`${selPkg.name} — ${selPkg.price} ریال`,type:"internet"})} disabled={!selPkg} noBleed/>
  </div>

  {/* Sort bottom sheet */}
  {showSort&&<>
    <div onClick={()=>setShowSort(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200}}/>
    <div style={{position:"fixed",bottom:0,right:0,left:0,background:"#1a1a1a",borderRadius:"22px 22px 0 0",padding:"20px 16px 40px",zIndex:201,fontFamily:"Vazirmatn",direction:"rtl"}}>
      <div style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,0.15)",margin:"0 auto 20px"}}/>
      <div style={{fontSize:15,fontWeight:800,color:"#fff",marginBottom:16}}>مرتب‌سازی</div>
      {_RT_SORT_OPTS.map(([key,label])=><button key={key} onClick={()=>{setSortBy(sortBy===key?null:key);setShowSort(false);}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",background:sortBy===key?"rgba(0,214,176,0.1)":"transparent",border:`1px solid ${sortBy===key?"rgba(0,214,176,0.3)":"rgba(255,255,255,0.08)"}`,borderRadius:12,padding:"13px 14px",marginBottom:8,cursor:"pointer",color:sortBy===key?"#00D6B0":"#fff",fontSize:13,fontFamily:"Vazirmatn",textAlign:"right"}}>
        {label}{sortBy===key&&<svg width="14" height="14" viewBox="0 0 14 14"><path d="M2.5 7l3 3 6-6" stroke="#00D6B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
      </button>)}
    </div>
  </>}

  {/* Type filter bottom sheet */}
  {showType&&<>
    <div onClick={()=>setShowType(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200}}/>
    <div className="anp-filter-sheet" style={{position:"fixed",bottom:0,right:0,left:0,background:"#1a1a1a",borderRadius:"22px 22px 0 0",padding:"20px 16px 40px",zIndex:201,fontFamily:"Vazirmatn",direction:"rtl"}}>
      <div className="anp-filter-sheet-handle" style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,0.15)",margin:"0 auto 20px"}}/>
      <div className="anp-filter-sheet-title" style={{fontSize:15,fontWeight:800,color:"#fff",marginBottom:16}}>نوع بسته</div>
      {_RT_TYPE_OPTS.map(([key,label])=>{const isAct=typeFilter===key;const rtIconPath=(k:string)=>k==="internet"?<><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill={isAct?"#00D6B0":"rgba(255,255,255,0.5)"} stroke="none"/></>:k==="call"?<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.5 16z"/>:k==="sms"?<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>:<><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>;return <button key={key} className={`anp-filter-btn${isAct?" anp-filter-btn-active":""}`} onClick={()=>{setTypeFilter(typeFilter===key?null:key);setDurFilter(null);setShowType(false);}} style={{display:"flex",alignItems:"center",gap:12,width:"100%",background:isAct?"rgba(0,214,176,0.1)":"transparent",border:`1px solid ${isAct?"rgba(0,214,176,0.3)":"rgba(255,255,255,0.08)"}`,borderRadius:12,padding:"13px 14px",marginBottom:8,cursor:"pointer",color:isAct?"#00D6B0":"#fff",fontSize:13,fontFamily:"Vazirmatn",textAlign:"right"}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isAct?"#00D6B0":"rgba(255,255,255,0.5)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{rtIconPath(key)}</svg>
          <span style={{flex:1}}>{label}</span>
          {isAct&&<svg width="14" height="14" viewBox="0 0 14 14"><path d="M2.5 7l3 3 6-6" stroke="#00D6B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
        </button>;})}
    </div>
  </>}
  </>;
}

// ─── Internet Package Router (phone input → operator screen) ──────────────────
type InternetStep="phone"|"irancell-simtype"|"irancell-postpaid"|"irancell-prepaid"|"mci-simtype"|"mci-postpaid"|"mci-prepaid"|"rightel-simtype"|"rightel-prepaid"|"rightel-postpaid";
function InternetPackageScreen({user,onUpdate,onBack,onGoToPayment,initialState,onBeforeNavigate}:{user:UserData;onUpdate:(u:UserData,tx:TxRecord)=>void;onBack:()=>void;onGoToPayment:(d:{phone:string;operator:Operator|null;amount:string;type:"internet"})=>void;initialState?:{phone:string;step:InternetStep}|null;onBeforeNavigate?:(state:{phone:string;step:InternetStep})=>void}){
  const [phone,setPhone]=useState(initialState?.phone??"");
  const [step,setStep]=useState<InternetStep>(initialState?.step??"phone");
  const operator=phone.length>=4?detectOperator(phone):null;
  const wrapGoToPayment=(d:{phone:string;operator:Operator|null;amount:string;type:"internet"})=>{
    onBeforeNavigate?.({phone,step});
    onGoToPayment(d);
  };
  const proceed=()=>{
    if(!isIranPhone(phone))return;
    if(operator?.id==="irancell"){setStep("irancell-simtype");return;}
    if(operator?.id==="rightel"){setStep("rightel-simtype");return;}
    setStep("mci-simtype");
  };
  if(step==="irancell-simtype"&&operator)return <SimTypeScreen phone={phone} operator={operator} onBack={()=>setStep("phone")} onSelect={t=>setStep(t==="prepaid"?"irancell-prepaid":"irancell-postpaid")}/>;
  if(step==="irancell-postpaid")return <IrancellPkgView phone={phone} simType="postpaid" onBack={()=>setStep("irancell-simtype")} onGoToPayment={wrapGoToPayment}/>;
  if(step==="irancell-prepaid")return <IrancellPkgView phone={phone} simType="prepaid" onBack={()=>setStep("irancell-simtype")} onGoToPayment={wrapGoToPayment}/>;
  if(step==="mci-simtype"&&operator)return <SimTypeScreen phone={phone} operator={operator} onBack={()=>setStep("phone")} onSelect={t=>setStep(t==="prepaid"?"mci-prepaid":"mci-postpaid")}/>;
  if(step==="mci-postpaid")return <MciPrepaidInternetScreen phone={phone} simType="postpaid" onBack={()=>setStep("mci-simtype")} onGoToPayment={wrapGoToPayment}/>;
  if(step==="mci-prepaid")return <MciPrepaidInternetScreen phone={phone} simType="prepaid" onBack={()=>setStep("mci-simtype")} onGoToPayment={wrapGoToPayment}/>;
  if(step==="rightel-simtype"&&operator)return <SimTypeScreen phone={phone} operator={operator} onBack={()=>setStep("phone")} onSelect={t=>setStep(t==="prepaid"?"rightel-prepaid":"rightel-postpaid")}/>;
  if(step==="rightel-prepaid")return <RightelPrepaidInternetScreen phone={phone} onBack={()=>setStep("rightel-simtype")} onGoToPayment={wrapGoToPayment}/>;
  if(step==="rightel-postpaid")return <RightelPostpaidInternetScreen phone={phone} onBack={()=>setStep("rightel-simtype")} onGoToPayment={wrapGoToPayment}/>;
  return <div className="subscreen" dir="rtl">
    <div className="subscreen-header">
      <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">خرید بسته اینترنت</h2>
      <div style={{width:36}}/>
    </div>
    <div className="subscreen-body">
      <div style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:6}}>
          <button style={{background:"none",border:"none",color:"#00D6B0",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"Vazirmatn"}} onClick={async()=>{const p=await pickContactPhone();if(p)setPhone(p)}}><Icon name="contacts" size={14}/> از مخاطبین</button>
        </div>
        <FloatInput label="شماره موبایل" value={toFaDigits(phone)} onChange={v=>setPhone(toLatinDigits(v))} inputMode="tel" maxLength={11} dir="ltr"/>
        {operator&&<div style={{marginTop:8,display:"flex",alignItems:"center",gap:8}}><OperatorBadge op={operator} size="sm"/><span style={{fontSize:12,color:"var(--text-secondary)",fontFamily:"Vazirmatn"}}>{operator.name} — شناسایی شد</span></div>}
      </div>
      <StickyActionBtn label="مشاهده بسته‌ها" onClick={proceed} disabled={!isIranPhone(phone)}/>
    </div>
  </div>;
}

// ─── Charge/Internet Screen ───────────────────────────────────────────────────
function ChargeScreen({type,user,onUpdate,onBack,onGoToPayment}:{type:"charge"|"internet";user:UserData;onUpdate:(u:UserData,tx:TxRecord)=>void;onBack:()=>void;onGoToPayment?:(d:{phone:string;operator:Operator|null;amount:string;type:"charge"|"internet"})=>void}){
  const [phone,setPhone]=useState("");const [amount,setAmount]=useState("");const [errModal,setErrModal]=useState("");const [processing,setProcessing]=useState(false);const [receipt,setReceipt]=useState<ReceiptData|null>(null);
  const operator=phone.length>=4?detectOperator(phone):null;
  const chargeAmt=parseInt(toLatinDigits(amount).replace(/\D/g,""))||0;
  const packages=type==="internet"?["۱ گیگ — ۷ روز — ۱۵,۰۰۰ ریال","۲ گیگ — ۱۵ روز — ۲۸,۰۰۰ ریال","۳ گیگ — ۳۰ روز — ۳۸,۰۰۰ ریال","۵ گیگ — ۳۰ روز — ۵۵,۰۰۰ ریال","۸ گیگ — ۳۰ روز — ۸۰,۰۰۰ ریال","۱۲ گیگ — ۳۰ روز — ۱۱۰,۰۰۰ ریال","۲۰ گیگ — ۳۰ روز — ۱۵۰,۰۰۰ ریال","۳۰ گیگ — ۳۰ روز — ۲۱۵,۰۰۰ ریال","۵۰ گیگ — ۳۰ روز — ۳۴۰,۰۰۰ ریال","نامحدود — ۳۰ روز — ۳۵۰,۰۰۰ ریال"]:["۱۰,۰۰۰ ریال","۲۰,۰۰۰ ریال","۵۰,۰۰۰ ریال","۱۰۰,۰۰۰ ریال","۲۰۰,۰۰۰ ریال","۵۰۰,۰۰۰ ریال"];
  const submit=()=>{
    if(!isIranPhone(phone)){setErrModal("شماره موبایل معتبر وارد کنید.");return}
    if(!amount){setErrModal(type==="internet"?"لطفاً بسته اینترنت مورد نظر را انتخاب کنید.":"لطفاً مبلغ یا شارژ مورد نظر را انتخاب کنید.");return}
    if(onGoToPayment){onGoToPayment({phone,operator,amount,type});return}
    setProcessing(true);
    setTimeout(()=>{
      setProcessing(false);
      const label=type==="charge"?"شارژ مستقیم":"بسته اینترنت";
      onUpdate(user,{id:genId(),userId:user.phone,type:"service",fromAsset:"toman",toAsset:"toman",amount:0,fee:0,status:"done",createdAt:new Date().toISOString(),note:`${label} · ${operator?.name??""} · ${phone} · ${amount}`,source:"app"});
      setReceipt({title:type==="charge"?"شارژ سیم کارت موفق بود":"خرید بسته اینترنت موفق بود",amount,destination:`${operator?.name??""}  ${toFaDigits(phone)}`,detail:`${label} با موفقیت ارسال شد.`});
      setPhone("");setAmount("");
    },2500);
  };
  const overlayText=type==="charge"?`در حال شارژ سیم کارت شماره ${toFaDigits(phone)} ...`:`در حال خرید بسته اینترنت برای شماره ${toFaDigits(phone)} ...`;
  return <>
  <div className="subscreen" dir="rtl">
    <div className="subscreen-header">
      <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">{type==="charge"?"شارژ مستقیم":"بسته اینترنت"}</h2>
      <div style={{width:36}}/>
    </div>
    <div className="subscreen-body">
      <div style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:6}}>
          <button style={{background:"none",border:"none",color:"#00D6B0",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"Vazirmatn"}} onClick={async()=>{const p=await pickContactPhone();if(p)setPhone(p)}}><Icon name="contacts" size={14}/> از مخاطبین</button>
        </div>
        <FloatInput label="شماره موبایل" value={toFaDigits(phone)} onChange={v=>setPhone(toLatinDigits(v))} inputMode="tel" maxLength={11} dir="ltr"/>
        {operator&&<div style={{marginTop:6,display:"flex",alignItems:"center",gap:6}}><OperatorBadge op={operator} size="sm"/><span style={{fontSize:11,color:"var(--text-muted)",fontFamily:"Vazirmatn"}}>شناسایی شد</span></div>}
      </div>
      <label className="field-label">انتخاب {type==="charge"?"مبلغ":"بسته"}</label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
        {packages.map(p=><button key={p} className={`pkg-btn ${amount===p?"active":""}`} onClick={()=>setAmount(p)}>{p}</button>)}
      </div>
      {type==="charge"&&<div style={{marginBottom:chargeAmt>0?6:16}}>
        <FloatInput label="مبلغ دلخواه" value={chargeAmt?fa(chargeAmt):""} onChange={v=>setAmount(toLatinDigits(v).replace(/[^0-9]/g,""))} inputMode="numeric" dir="ltr" suffix="ریال"/>
        {chargeAmt>0&&<div className="amount-words">معادل {numToFaWords(Math.floor(chargeAmt/10))} تومان</div>}
      </div>}
      <StickyActionBtn label="تأیید" onClick={submit} disabled={processing||!isIranPhone(phone)||!amount} loading={processing} loadingText="در حال پردازش..."/>
    </div>
  </div>
  {processing&&<AnPardazLoadingOverlay text={overlayText} badge={operator&&<OperatorBadge op={operator}/>}/>}
  {receipt&&<TransactionReceipt data={receipt} onClose={()=>setReceipt(null)}/>}
  {errModal&&<div style={{margin:"12px 16px",padding:"16px",borderRadius:14,background:"rgba(232,81,42,0.1)",border:"1px solid rgba(232,81,42,0.3)",color:"var(--text-primary)",display:"flex",alignItems:"flex-start",gap:12,direction:"rtl"}}>
    <span style={{flex:1,fontSize:14,lineHeight:1.7}}>{errModal}</span>
    <button onClick={()=>setErrModal("")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:18,lineHeight:1}}>✕</button>
  </div>}
  </>;
}

// ─── Bills Screen ─────────────────────────────────────────────────────────────
function BillsScreen({onBack,onGoToPayment}:{onBack:()=>void;onGoToPayment:(d:{billType:string;billName:string;billIcon:string;amount:string;inputVal:string;ownerName:string})=>void}){
  const [selected,setSelected]=useState<string>("hamrah");
  const [inputVal,setInputVal]=useState("");
  const [titleVal,setTitleVal]=useState("");
  const [loading,setLoading]=useState(false);
  const [processing,setProcessing]=useState(false);
  const [result,setResult]=useState<string|null>(null);
  const [billErrModal,setBillErrModal]=useState("");
  const [phoneErr,setPhoneErr]=useState("");

  const types=[
    {id:"hamrah",name:"همراه اول",usePhone:true,inputLabel:"شماره اشتراک",example:"تلفن همراه خودم",hint:"تنها امکان استعلام قبض‌های همراه اول و خطوط ترابرد شده به همراه اول وجود دارد.",color:"#009870"},
    {id:"gas",name:"گاز",usePhone:false,inputLabel:"شماره اشتراک",example:"قبض گاز منزل",hint:null,color:"#003087"},
    {id:"electric",name:"برق",usePhone:false,inputLabel:"شناسه قبض",example:"قبض برق شرکت",hint:null,color:"#f5a500"},
    {id:"makhab",name:"مخابرات",usePhone:false,inputLabel:"شماره اشتراک",example:"تلفن ثابت منزل",hint:null,color:"#505a64"},
    {id:"irancell",name:"ایرانسل",usePhone:true,inputLabel:"شماره اشتراک",example:"تلفن همراه خودم",hint:"تنها امکان استعلام قبض‌های ایرانسل و خطوط ترابرد شده به ایرانسل وجود دارد.",color:"#cc9900"},
    {id:"water",name:"آب",usePhone:false,inputLabel:"شناسه قبض",example:"قبض آب منزل",hint:null,color:"#006aba"},
  ];

  const sel=types.find(t=>t.id===selected);

  // Normalize raw input: handles 09XX, +989XX, 00989XX, 989XX → 09XX
  const normalizePhone=(raw:string)=>{
    const d=toLatinDigits(raw).replace(/\D/g,"");
    if(d.startsWith("00989"))return "0"+d.slice(4);
    if(d.startsWith("989"))return "0"+d.slice(2);
    return d;
  };

  const handlePhoneChange=(raw:string)=>{
    const normalized=normalizePhone(raw).slice(0,11);
    setInputVal(normalized);
    if(phoneErr&&normalized.length<11)setPhoneErr("");
  };

  const validatePhone=()=>{
    if(!inputVal){setPhoneErr("شماره همراه را وارد کنید.");return false;}
    if(!isIranPhone(inputVal)){setPhoneErr("شماره موبایل معتبر نیست. فرمت صحیح: ۰۹XXXXXXXXX");return false;}
    setPhoneErr("");return true;
  };

  const inquire=()=>{
    if(sel?.usePhone){
      if(!validatePhone())return;
    } else {
      if(!inputVal.trim()){setBillErrModal(`لطفاً ${sel?.inputLabel} را وارد کنید.`);return;}
    }
    setProcessing(true);
    setTimeout(()=>{
      setProcessing(false);
      onGoToPayment({billType:selected,billName:sel?.name??"قبض",billIcon:selected,amount:"۱۲۰٬۰۰۰",inputVal,ownerName:titleVal||"مشترک"});
    },2000);
  };

  const switchBill=(id:string)=>{
    setSelected(id);setInputVal("");setTitleVal("");setResult(null);setPhoneErr("");
  };

  return <>
  {processing&&<AnPardazLoadingOverlay text="در حال استعلام قبض..."/>}
  <div className="subscreen" dir="rtl" style={{display:"flex",flexDirection:"column"}}>
    <div className="subscreen-header">
      <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">پرداخت قبض</h2>
      <div style={{width:36}}/>
    </div>
    <div className="subscreen-body" style={{overflowY:"auto"}}>
      {/* Bill category grid — 2 rows × 3 columns */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
        {types.map(t=>{
          const isSel=selected===t.id;
          return(
            <button key={t.id} onClick={()=>switchBill(t.id)} style={{
              display:"flex",flexDirection:"column",alignItems:"center",gap:10,
              background:isSel?`${t.color}0d`:"rgba(255,255,255,0.03)",
              border:`1.5px solid ${isSel?t.color:"rgba(255,255,255,0.08)"}`,
              borderRadius:18,cursor:"pointer",
              padding:"16px 8px 12px",
              transition:"border-color .18s,background .18s",
              boxSizing:"border-box",
            }}>
              <BillIcon type={t.id} size={48}/>
              <span style={{fontSize:12,color:isSel?t.color:"var(--text-secondary)",fontWeight:isSel?700:500,fontFamily:"Vazirmatn",textAlign:"center",lineHeight:1.3,width:"100%"}}>{t.name}</span>
            </button>
          );
        })}
      </div>

      {/* Form — always showing for selected bill */}
      {sel&&<div style={{animation:"slideUp 0.25s ease"}}>
        <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)",marginBottom:14,lineHeight:1.6}}>
          {sel.usePhone
            ?"شماره موبایل خود را به همراه عنوان قبض مورد نظر وارد کنید"
            :`${sel.inputLabel} خود را به همراه عنوان قبض مورد نظر وارد کنید`}
        </div>

        {/* Phone input */}
        {sel.usePhone?(
          <div style={{marginBottom:10}}>
            <div style={{
              background:"var(--card-bg)",
              borderRadius:16,
              border:`1.5px solid ${phoneErr?"#e8512a":inputVal.length===11&&isIranPhone(inputVal)?"rgba(0,214,176,0.55)":"var(--border-color)"}`,
              overflow:"hidden",
              transition:"border-color .2s",
              boxShadow:phoneErr?"0 0 0 3px rgba(232,81,42,0.1)":inputVal.length===11&&isIranPhone(inputVal)?"0 0 0 3px rgba(0,214,176,0.08)":"none",
            }}>
              <div style={{display:"flex",alignItems:"center",padding:"4px 10px 4px 10px",gap:8}}>
                <button onClick={async()=>{const p=await pickContactPhone();if(p){const n=normalizePhone(p).slice(0,11);setInputVal(n);setPhoneErr("");}}} style={{background:"var(--card-bg3)",border:"1.5px solid var(--border-color)",borderRadius:10,padding:"8px 12px",cursor:"pointer",color:"var(--text-muted)",fontSize:11,fontWeight:700,fontFamily:"Vazirmatn",flexShrink:0,display:"flex",alignItems:"center",gap:4,transition:"all .15s"}}><Icon name="contacts" size={13}/> مخاطبین</button>
                <input
                  style={{
                    flex:1,
                    background:"none",
                    border:"none",
                    outline:"none",
                    color:phoneErr?"#e8512a":inputVal.length===11&&isIranPhone(inputVal)?"#00D6B0":"var(--text-primary)",
                    fontSize:26,
                    fontWeight:700,
                    fontFamily:"Vazirmatn",
                    padding:"14px 6px",
                    letterSpacing:"0.06em",
                    direction:"ltr",
                    textAlign:"right",
                    transition:"color .2s",
                  }}
                  value={toFaDigits(inputVal)}
                  onKeyDown={e=>{
                    const ok=["Backspace","Delete","Tab","ArrowLeft","ArrowRight","Home","End"];
                    if(ok.includes(e.key)||e.ctrlKey||e.metaKey)return;
                    if(e.key==="+"&&inputVal.length===0)return;
                    if(!/^[0-9۰-۹]$/.test(e.key)){e.preventDefault();return;}
                    if(inputVal.length>=11){e.preventDefault();return;}
                  }}
                  onChange={e=>handlePhoneChange(e.target.value)}
                  onBlur={()=>{if(inputVal.length>0&&inputVal.length<11)setPhoneErr("شماره موبایل ناقص است. ۱۱ رقم وارد کنید.");else if(inputVal.length===11&&!isIranPhone(inputVal))setPhoneErr("شماره موبایل معتبر نیست. فرمت صحیح: ۰۹XXXXXXXXX");}}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  inputMode="tel"
                  maxLength={14}
                />
              </div>
            </div>
            {/* Validation row */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6,padding:"0 4px"}}>
              {phoneErr
                ?<span style={{fontSize:12,color:"#e8512a",fontWeight:600,display:"flex",alignItems:"center",gap:4}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {phoneErr}
                  </span>
                :inputVal.length===11&&isIranPhone(inputVal)
                  ?<span style={{fontSize:12,color:"#00D6B0",fontWeight:600,display:"flex",alignItems:"center",gap:4}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6"/></svg>
                      شماره معتبر است
                    </span>
                  :<span style={{fontSize:12,color:"var(--text-muted)"}}>فرمت: ۰۹XXXXXXXXX</span>
              }
              <span style={{fontSize:12,color:inputVal.length===11?"#00D6B0":"var(--text-muted)",fontWeight:inputVal.length===11?700:400,fontVariantNumeric:"tabular-nums"}}>
                {toFaDigits(String(inputVal.length))}/۱۱
              </span>
            </div>
          </div>
        ):(
          <FloatInput label={sel.inputLabel} value={toFaDigits(inputVal)} onChange={v=>setInputVal(toLatinDigits(v).replace(/\D/g,""))} inputMode="numeric" dir="rtl" style={{marginBottom:10}}/>
        )}

        {/* Title input */}
        <div style={{marginBottom:sel.hint?12:16}}>
          <FloatInput label="عنوان قبض" value={titleVal} onChange={v=>setTitleVal(v)} dir="rtl"/>
          <div style={{marginTop:4,fontSize:11,color:"var(--text-muted)",paddingRight:4}}>مثال: {sel.example}</div>
        </div>

        {/* Hint box */}
        {sel.hint&&<div style={{background:"rgba(0,214,176,0.07)",border:"1px solid rgba(0,214,176,0.2)",borderRadius:12,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"flex-start",gap:8}}>
          <button style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",flexShrink:0,padding:0,lineHeight:1}} onClick={()=>{}}>✕</button>
          <div style={{fontSize:12,color:"var(--text-secondary)",lineHeight:1.6}}>{sel.hint}</div>
        </div>}

        {result&&<div style={{fontSize:13,color:"#00D6B0",textAlign:"center",padding:"12px",background:"rgba(0,214,176,0.1)",borderRadius:12,marginBottom:16,border:"1px solid rgba(0,214,176,0.2)"}}>{result}</div>}
      </div>}
      <StickyActionBtn label="استعلام و پرداخت" onClick={inquire} disabled={processing||!inputVal.trim()} loading={processing} loadingText="در حال استعلام..."/>
    </div>
  </div>
  {billErrModal&&<div style={{margin:"12px 16px",padding:"16px",borderRadius:14,background:"rgba(232,81,42,0.1)",border:"1px solid rgba(232,81,42,0.3)",color:"var(--text-primary)",display:"flex",alignItems:"flex-start",gap:12,direction:"rtl"}}>
    <span style={{flex:1,fontSize:14,lineHeight:1.7}}>{billErrModal}</span>
    <button onClick={()=>setBillErrModal("")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:18,lineHeight:1}}>✕</button>
  </div>}
  </>;
}

// ─── Insurance Screen ─────────────────────────────────────────────────────────
function InsuranceScreen({initialTab,user,onUpdate,onBack}:{initialTab:"third-party"|"body"|"motorcycle";user:UserData;onUpdate:(u:UserData,tx:TxRecord)=>void;onBack:()=>void}){
  const [tab,setTab]=useState<"third-party"|"body"|"motorcycle">(initialTab);
  const [plateNum,setPlateNum]=useState(["","","",""]);
  const plateSeg0Ref=useRef<HTMLInputElement>(null);
  const plateSeg1Ref=useRef<HTMLInputElement>(null);
  const plateSeg2Ref=useRef<HTMLInputElement>(null);
  const plateSeg3Ref=useRef<HTMLInputElement>(null);
  // Focus first plate segment on page mount (after slide-in animation)
  useEffect(()=>{const t=setTimeout(()=>plateSeg0Ref.current?.focus(),300);return()=>clearTimeout(t);},[]);
  // Re-focus first plate segment whenever the insurance tab changes (not motorcycle)
  useEffect(()=>{if(tab==="motorcycle")return;const t=setTimeout(()=>plateSeg0Ref.current?.focus(),80);return()=>clearTimeout(t);},[tab]);
  const [hasPrev,setHasPrev]=useState<string|null>(null);
  const [ownership,setOwnership]=useState<string|null>(null);
  const [motoType,setMotoType]=useState("");
  const [motoYear,setMotoYear]=useState("");
  const [motoColor,setMotoColor]=useState("");
  const [motoPicker,setMotoPicker]=useState<"type"|"year"|"color"|null>(null);
  const [submitted,setSubmitted]=useState(false);
  const [showComingSoon,setShowComingSoon]=useState(false);
  const processing=false;
  const confirmSubmit=()=>{setShowComingSoon(true)};

  const updatePlate=(i:number,v:string)=>{const p=[...plateNum];p[i]=v;setPlateNum(p)};

  const plateSegmentInput=<div className="plate-input-wrap" style={{marginBottom:16}}>
    <div className="plate-ir-badge">
      <span style={{fontSize:14}}>🇮🇷</span>
      <span>ایران</span>
    </div>
    <input ref={plateSeg0Ref} className="plate-segment" value={toFaDigits(plateNum[0])} onChange={e=>{const v=toLatinDigits(e.target.value).replace(/\D/g,"").slice(0,2);updatePlate(0,v);if(v.length===2)plateSeg1Ref.current?.focus()}} placeholder="00" maxLength={2} inputMode="numeric" style={{maxWidth:48}}/>
    <input ref={plateSeg1Ref} className="plate-segment" value={plateNum[1]} onChange={e=>{const v=e.target.value.slice(0,1);updatePlate(1,v);if(v.length===1)plateSeg2Ref.current?.focus()}} placeholder="ب" maxLength={1} style={{maxWidth:36}}/>
    <input ref={plateSeg2Ref} className="plate-segment" value={toFaDigits(plateNum[2])} onChange={e=>{const v=toLatinDigits(e.target.value).replace(/\D/g,"").slice(0,3);updatePlate(2,v);if(v.length===3)plateSeg3Ref.current?.focus()}} placeholder="000" maxLength={3} inputMode="numeric" style={{maxWidth:56}}/>
    <input ref={plateSeg3Ref} className="plate-segment" value={toFaDigits(plateNum[3])} onChange={e=>updatePlate(3,toLatinDigits(e.target.value).replace(/\D/g,"").slice(0,2))} placeholder="00" maxLength={2} inputMode="numeric" style={{maxWidth:48}}/>
  </div>;

  const tabs=[
    {id:"third-party",label:"شخص ثالث",icon:"shield"},
    {id:"body",label:"بیمه بدنه",icon:"car"},
    {id:"motorcycle",label:"موتورسیکلت",icon:"moto"},
  ] as const;

  const plateComplete=plateNum[0].length===2&&plateNum[1].length===1&&plateNum[2].length===3&&plateNum[3].length===2;
  const insDisabled=submitted||(tab==="third-party"?(!plateComplete||!ownership):tab==="body"?(!plateComplete||!hasPrev):(!motoType||!motoYear||!motoColor));

  return <><div className="subscreen" dir="rtl">
    <div className="subscreen-header">
      <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">آسان بیمه</h2>
      <div style={{width:36}}/>
    </div>
    <div className="ins-tabs">
      {tabs.map(t=><button key={t.id} className={`ins-tab ${tab===t.id?"active":""}`} onClick={()=>{setTab(t.id);setSubmitted(false)}}>
        <Icon name={t.icon} size={20}/>
        {t.label}
      </button>)}
    </div>
    <div className="subscreen-body">
      {tab==="third-party"&&<>
        <div style={{color:"#4a9eff",fontWeight:700,fontSize:15,marginBottom:16}}>خرید بیمه شخص ثالث</div>
        <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:10}}>پلاک خودرو</div>
        {plateSegmentInput}
        {!submitted&&<>
          <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",marginBottom:12}}>
            خودرو در مدت بیمه‌نامه قبلی تغییر مالکیت (تعویض پلاک) داشته؟
          </div>
          <div style={{display:"flex",gap:10,marginBottom:16}}>
            {([["yes","بله","تغییر مالکیت داشته"],["no","خیر","تغییر مالکیت نداشته"]] as const).map(([v,title,sub])=>
              <button key={v} onClick={()=>setOwnership(v)} className={`ins-option-btn ${ownership===v?"selected":""}`}>
                <div style={{fontSize:15,fontWeight:800}}>{title}</div>
                <div style={{fontSize:11,opacity:0.7,textAlign:"center",lineHeight:1.4}}>{sub}</div>
                <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${ownership===v?"#4a9eff":"var(--border-color)"}`,display:"flex",alignItems:"center",justifyContent:"center",marginTop:4}}>
                  {ownership===v&&<div style={{width:8,height:8,borderRadius:"50%",background:"#4a9eff"}}/>}
                </div>
              </button>
            )}
          </div>
          <div style={{textAlign:"center",fontSize:12,color:"var(--text-muted)",marginBottom:8}}>یا</div>
          <button style={{width:"100%",background:"none",border:"none",color:"#00D6B0",fontSize:13,cursor:"pointer",fontFamily:"Vazirmatn",padding:"8px 0"}}>انتخاب پلاک از لیست خودروها ←</button>
        </>}
        {submitted&&<div style={{textAlign:"center",padding:"24px 0",color:"#00D6B0"}}><Icon name="check" size={56}/><div style={{marginTop:12,fontSize:15,fontWeight:700,color:"var(--text-primary)"}}>درخواست استعلام ارسال شد</div><div style={{fontSize:13,color:"var(--text-muted)",marginTop:8}}>کارشناس بیمه با شما تماس خواهد گرفت</div></div>}
      </>}

      {tab==="body"&&<>
        <div style={{color:"#4a9eff",fontWeight:700,fontSize:15,marginBottom:16}}>خرید بیمه بدنه</div>
        <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:10}}>پلاک خودرو</div>
        {plateSegmentInput}
        {!submitted&&<>
          <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",marginBottom:12}}>آیا خودرو سابقه بیمه بدنه دارد؟</div>
          {[["yes","بله، دارای سابقه بیمه بدنه است"],["no","خیر، سابقه بیمه بدنه ندارد"],["new","خودرو صفر کیلومتر است"]].map(([v,label])=>
            <button key={v} onClick={()=>setHasPrev(v)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",background:"var(--card-bg)",border:`1px solid ${hasPrev===v?"#4a9eff":"var(--border-color)"}`,borderRadius:12,padding:"14px 16px",color:hasPrev===v?"#4a9eff":"var(--text-primary)",cursor:"pointer",fontFamily:"Vazirmatn",fontSize:13,marginBottom:8,transition:"all 0.2s"}}>
              {label}
              <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${hasPrev===v?"#4a9eff":"var(--border-color)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {hasPrev===v&&<div style={{width:8,height:8,borderRadius:"50%",background:"#4a9eff"}}/>}
              </div>
            </button>
          )}
          <div style={{textAlign:"center",fontSize:12,color:"var(--text-muted)",marginBottom:8,marginTop:8}}>یا</div>
          <button style={{width:"100%",background:"none",border:"none",color:"#00D6B0",fontSize:13,cursor:"pointer",fontFamily:"Vazirmatn",padding:"8px 0"}}>انتخاب پلاک از لیست خودروها ←</button>
        </>}
        {submitted&&<div style={{textAlign:"center",padding:"24px 0",color:"#00D6B0"}}><Icon name="check" size={56}/><div style={{marginTop:12,fontSize:15,fontWeight:700,color:"var(--text-primary)"}}>درخواست ارسال شد</div></div>}
      </>}

      {tab==="motorcycle"&&<>
        <div style={{color:"#4a9eff",fontWeight:700,fontSize:15,marginBottom:4}}>خرید بیمه شخص ثالث موتورسیکلت</div>
        <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:16}}>خرید بیمه‌نامه برای موتورسیکلت‌های <b style={{color:"var(--text-primary)"}}>شخصی</b> امکان‌پذیر است.</div>
        {([['type','نوع موتورسیکلت',motoType],['year','سال ساخت',motoYear],['color','رنگ موتورسیکلت',motoColor]] as const).map(([key,label,val])=>
          <button key={key} className="moto-select" onClick={()=>setMotoPicker(key)}><span style={{color:val?"var(--text-primary)":"var(--text-muted)"}}>{val||label}</span><span>⌄</span></button>
        )}
        {motoPicker&&<div className="receipt-page" dir="rtl"><div className="receipt-page-header"><button className="back-btn" onClick={()=>setMotoPicker(null)}><Icon name="arrow" size={20}/></button><h2 style={{flex:1,textAlign:"center",fontSize:17,fontWeight:800}}>{motoPicker==='type'?'نوع موتورسیکلت':motoPicker==='year'?'سال ساخت':'رنگ موتورسیکلت'}</h2><div style={{width:36}}/></div><div className="receipt-page-body"><div className="picker-list">{(motoPicker==='type'?['اسکوتر','موتور شهری','موتور مسابقه‌ای','موتور سنگین']:motoPicker==='year'?Array.from({length:30},(_,i)=>toFaDigits(String(1405-i))):['مشکی','سفید','قرمز','آبی','نقره‌ای','زرد']).map(option=><button key={option} onClick={()=>{if(motoPicker==='type')setMotoType(option);else if(motoPicker==='year')setMotoYear(option);else setMotoColor(option);setMotoPicker(null)}}><span><b>{option}</b></span></button>)}</div></div></div>}
        {submitted&&<div style={{textAlign:"center",padding:"16px 0",color:"#00D6B0"}}><Icon name="check" size={48}/><div style={{marginTop:8,fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>درخواست ارسال شد</div></div>}
        <div className="ins-help-bar">
          <div><div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)"}}>درخواست کمک</div><div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>سوالات متداول و تماس تلفنی</div></div>
          <div style={{width:32,height:32,borderRadius:"50%",background:"#4a9eff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="question" size={16}/></div>
        </div>
      </>}
      {!submitted&&<StickyActionBtn label="تایید اطلاعات" onClick={confirmSubmit} disabled={insDisabled}/>}
    </div>
  </div>
  {showComingSoon&&<div className="receipt-page" dir="rtl">
    <div className="receipt-page-header">
      <button className="back-btn" onClick={()=>setShowComingSoon(false)}><Icon name="arrow" size={20}/></button>
      <h2 style={{flex:1,textAlign:"center",fontSize:17,fontWeight:800}}>به‌زودی</h2>
      <div style={{width:36}}/>
    </div>
    <div className="receipt-page-body" style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"40px 24px",textAlign:"center"}}>
      <div style={{width:72,height:72,borderRadius:22,background:"linear-gradient(135deg,rgba(74,158,255,0.15),rgba(74,158,255,0.05))",border:"1px solid rgba(74,158,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:36}}>🛡️</div>
      <div style={{fontSize:17,fontWeight:800,color:"var(--text-primary)",marginBottom:12}}>به‌زودی</div>
      <div style={{fontSize:14,color:"var(--text-secondary)",lineHeight:1.8,marginBottom:24}}>
        سرویس های مربوط به بیمه نامه ها به زودی توسط تیم فنی آن پرداز در دسترس قرار می گیرند.
      </div>
      <button className="primary-button" style={{background:"#4a9eff",width:"100%"}} onClick={()=>setShowComingSoon(false)}>متوجه شدم</button>
    </div>
  </div>}
  </>;
}

// ─── Bills Payment Screen ─────────────────────────────────────────────────────
function BillsPaymentScreen({data,user,onUpdate,onBack,onDone}:{data:{billType:string;billName:string;billIcon:string;amount:string;inputVal:string;ownerName:string};user:UserData;onUpdate:(u:UserData,tx:TxRecord)=>void;onBack:()=>void;onDone:()=>void}){
  const [selectedCard,setSelectedCard]=useState(user.cards[0]?.id??"");
  const [cardPickerOpen,setCardPickerOpen]=useState(false);
  const [otp,setOtp]=useState("");const [cvv2,setCvv2]=useState("");
  const [expM,setExpM]=useState("");const [expY,setExpY]=useState("");
  const cvv2Ref=useRef<HTMLInputElement>(null);const expMRef=useRef<HTMLInputElement>(null);const expYRef=useRef<HTMLInputElement>(null);
  const [processing,setProcessing]=useState(false);
  const [receipt,setReceipt]=useState<ReceiptData|null>(null);
  const [err,setErr]=useState("");
  const selCard=user.cards.find(c=>c.id===selectedCard);
  const payValid=!!selCard&&toLatinDigits(otp).length===5&&toLatinDigits(cvv2).length===3&&toLatinDigits(expM).length===2&&toLatinDigits(expY).length===2;
  const resetSensitive=()=>{setOtp("");setCvv2("");setExpM("");setExpY("")};
  const pay=()=>{
    if(!otp){setErr("رمز پویا را وارد کنید.");return}
    if(!cvv2){setErr("CVV2 را وارد کنید.");return}
    if(!expM||!expY){setErr("تاریخ انقضا را وارد کنید.");return}
    setErr("");setProcessing(true);
    setTimeout(()=>{
      setProcessing(false);resetSensitive();
      onUpdate(user,{id:genId(),userId:user.phone,type:"service",fromAsset:"toman",toAsset:"toman",amount:0,fee:0,status:"done",createdAt:new Date().toISOString(),note:`قبض ${data.billName} · ${data.inputVal}`,source:"app"});
      setReceipt({title:"پرداخت قبض با موفقیت انجام شد",amount:`${data.amount} ریال`,destination:data.billName,status:"success",detail:`مشترک: ${data.ownerName}`});
    },2500);
  };
  return <>
  {processing&&<AnPardazLoadingOverlay text="در حال پردازش پرداخت..."/>}
  {receipt&&<TransactionReceipt data={receipt} onClose={()=>{setReceipt(null);onDone();}}/>}
  <div className="subscreen" dir="rtl">
    <div className="subscreen-header">
      <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">پرداخت قبض</h2>
      <div style={{width:36}}/>
    </div>
    <div className="subscreen-body">
      <div className="charge-summary-card" style={{marginBottom:16}}>
        <div className="charge-summary-op">
          <BillIcon type={data.billType} size={56}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:800,color:"var(--text-primary)"}}>{data.billName}</div>
            <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2}}>{data.ownerName} · {toFaDigits(data.inputVal)}</div>
          </div>
        </div>
        <div className="charge-summary-amount">{toFaDigits(String(data.amount))} ریال</div>
      </div>
      <div className="banking-form">
        <div className="bform-field">
          <label className="field-label">کارت بانکی</label>
          <button className="bform-card-select" onClick={()=>setCardPickerOpen(true)}>
            {selCard?(<div className="bform-card-row"><BankLogo bankName={selCard.bank} size={44} rounded={13}/><div className="bform-card-text"><span className="bform-bank-name">{selCard.bank}</span><span className="bform-card-number" dir="ltr">{toFaDigits(fmtCard(selCard.number))}</span></div></div>):(<div className="bform-card-row"><div className="bform-bank-dot bform-bank-dot--empty"><Icon name="credit" size={16}/></div><span className="bform-card-placeholder">انتخاب کارت بانکی</span></div>)}
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
  {cardPickerOpen&&<div className="receipt-page" dir="rtl">
    <div className="receipt-page-header">
      <button className="back-btn" onClick={()=>setCardPickerOpen(false)}><Icon name="arrow" size={20}/></button>
      <h2 style={{flex:1,textAlign:"center",fontSize:17,fontWeight:800}}>انتخاب کارت</h2>
      <div style={{width:36}}/>
    </div>
    <div className="receipt-page-body">
      {user.cards.length===0&&<p className="bs-empty">کارتی ثبت نشده است.</p>}
      {user.cards.map(c=>(
        <button key={c.id} className={`bs-card-item${selectedCard===c.id?" active":""}`} onClick={()=>{setSelectedCard(c.id);setCardPickerOpen(false);if(c.expM)setExpM(toFaDigits(c.expM));if(c.expY)setExpY(toFaDigits(c.expY))}}>
          <BankLogo bankName={c.bank} size={48} rounded={14}/>
          <div className="bs-card-info"><span className="bs-card-bank">{c.bank}</span><span className="bs-card-holder">{c.holderName}</span><span className="bs-card-num" dir="ltr">{toFaDigits(fmtCard(c.number))}</span></div>
          {selectedCard===c.id&&<div className="bs-card-check"><Icon name="check" size={16} stroke={2.5}/></div>}
        </button>
      ))}
    </div>
  </div>}
  </>;
}

// ─── Violations Screen ────────────────────────────────────────────────────────
const PLATE_LETTERS="الف ب پ ت ث ج چ ح خ د ذ ر ز ژ س ش ص ض ط ظ ع غ ف ق ک گ ل م ن و ه ی".split(" ");
function ViolationsScreen({onBack,onGoToPayment}:{onBack:()=>void;onGoToPayment?:(d:{plate:string;amount:string;ownerName:string})=>void}){
  const [part1,setPart1]=useState(""); // 2 digits
  const [letter,setLetter]=useState("ب"); // 1 letter
  const [part2,setPart2]=useState(""); // 3 digits
  const [province,setProvince]=useState(""); // 2 digits
  const [letterOpen,setLetterOpen]=useState(false);
  const part1Ref=useRef<HTMLInputElement>(null);
  const letterBtnRef=useRef<HTMLButtonElement>(null);
  const part2Ref=useRef<HTMLInputElement>(null);
  const provinceRef=useRef<HTMLInputElement>(null);
  // Focus first plate segment on page mount (after slide-in animation)
  useEffect(()=>{const t=setTimeout(()=>part1Ref.current?.focus(),300);return()=>clearTimeout(t);},[]);
  const [loading,setLoading]=useState(false);
  const [processing,setProcessing]=useState(false);
  const [result,setResult]=useState<string|null>(null);
  const [errModal,setErrModal]=useState("");

  const inquire=()=>{
    if(!part1||!part2||!province){setErrModal("لطفاً پلاک خودرو را کامل وارد کنید.");return}
    setProcessing(true);
    setTimeout(()=>{
      setProcessing(false);
      const plateStr=`${toFaDigits(part1)} ${letter} ${toFaDigits(part2)} | ${toFaDigits(province)}`;
      onGoToPayment?.({plate:plateStr,amount:"۳۶۰٬۰۰۰",ownerName:"محمد رضایی"});
    },2000);
  };

  return <>
  {processing&&<AnPardazLoadingOverlay text="در حال استعلام خلافی..."/>}
  <div className="subscreen" dir="rtl">
    <div className="subscreen-header">
      <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">خلافی خودرو</h2>
      <div style={{width:36}}/>
    </div>
    <div className="subscreen-body">
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:"rgba(168,85,247,0.15)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:32}}>🚦</div>
        <div style={{fontSize:16,fontWeight:800,color:"var(--text-primary)"}}>پرداخت خلافی خودرو</div>
        <div style={{fontSize:12,color:"var(--text-muted)",marginTop:4}}>شماره پلاک خودرو را وارد کنید</div>
      </div>

      {/* Iranian License Plate */}
      <div className="iran-plate" dir="ltr">
        <div className="plate-iran-badge">
          <div style={{fontSize:14}}>🇮🇷</div>
          <div style={{fontSize:8,fontWeight:900,letterSpacing:1.5}}>I.R.IRAN</div>
        </div>
        <div className="plate-main">
          <input ref={part1Ref} className="plate-input p2" value={toFaDigits(part1)} onKeyDown={e=>{const ok=["Backspace","Delete","Tab","ArrowLeft","ArrowRight"];if(ok.includes(e.key)||e.ctrlKey)return;if(!/^[0-9۰-۹]$/.test(e.key)){e.preventDefault();return}if(part1.length>=2)e.preventDefault()}} onChange={e=>{const v=toLatinDigits(e.target.value).replace(/\D/g,"").slice(0,2);setPart1(v);if(v.length===2)letterBtnRef.current?.focus()}} placeholder="۰۰" inputMode="numeric"/>
          <button ref={letterBtnRef} type="button" className="plate-letter-btn" onClick={()=>setLetterOpen(!letterOpen)}>{letter}</button>
          <input ref={part2Ref} className="plate-input p3" value={toFaDigits(part2)} onKeyDown={e=>{const ok=["Backspace","Delete","Tab","ArrowLeft","ArrowRight"];if(ok.includes(e.key)||e.ctrlKey)return;if(!/^[0-9۰-۹]$/.test(e.key)){e.preventDefault();return}if(part2.length>=3)e.preventDefault()}} onChange={e=>{const v=toLatinDigits(e.target.value).replace(/\D/g,"").slice(0,3);setPart2(v);if(v.length===3)provinceRef.current?.focus()}} placeholder="۰۰۰" inputMode="numeric"/>
        </div>
        <div className="plate-separator"/>
        <input ref={provinceRef} className="plate-input p2 plate-province" value={toFaDigits(province)} onKeyDown={e=>{const ok=["Backspace","Delete","Tab","ArrowLeft","ArrowRight"];if(ok.includes(e.key)||e.ctrlKey)return;if(!/^[0-9۰-۹]$/.test(e.key)){e.preventDefault();return}if(province.length>=2)e.preventDefault()}} onChange={e=>{const v=toLatinDigits(e.target.value).replace(/\D/g,"").slice(0,2);setProvince(v)}} placeholder="۰۰" inputMode="numeric"/>
      </div>

      {/* Letter picker */}
      {letterOpen&&<div className="plate-letter-picker">
        {PLATE_LETTERS.map(l=><button key={l} className={letter===l?"active":""} onClick={()=>{setLetter(l);setLetterOpen(false);setTimeout(()=>part2Ref.current?.focus(),50)}}>{l}</button>)}
      </div>}

      {result&&<div style={{fontSize:13,color:"#00D6B0",textAlign:"center",padding:"12px",background:"rgba(0,214,176,0.1)",borderRadius:12,marginBottom:16,border:"1px solid rgba(0,214,176,0.2)"}}>{result}</div>}
      <StickyActionBtn label="استعلام خلافی" onClick={inquire} disabled={processing||!part1||!part2||!province} loading={processing} loadingText="در حال استعلام..."/>
    </div>
  </div>
  {errModal&&<div style={{margin:"12px 16px",padding:"16px",borderRadius:14,background:"rgba(232,81,42,0.1)",border:"1px solid rgba(232,81,42,0.3)",color:"var(--text-primary)",display:"flex",alignItems:"flex-start",gap:12,direction:"rtl"}}>
    <span style={{flex:1,fontSize:14,lineHeight:1.7}}>{errModal}</span>
    <button onClick={()=>setErrModal("")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:18,lineHeight:1}}>✕</button>
  </div>}
  </>;
}

// ─── Freeway Toll Screen ──────────────────────────────────────────────────────
function FreewayScreen({onBack}:{onBack:()=>void}){
  const [autoPayEnabled,setAutoPayEnabled]=useState(true);
  const [editMode,setEditMode]=useState(false);
  const [part1,setPart1]=useState("24"); // 2 digits
  const [letter,setLetter]=useState("م");
  const [part2,setPart2]=useState("615"); // 3 digits
  const [province,setProvince]=useState("19"); // 2 digits
  const [letterOpen,setLetterOpen]=useState(false);
  const [saved,setSaved]=useState(true);
  const plateDisplay=`${toFaDigits(part1)} ${letter} ${toFaDigits(part2)} | ${toFaDigits(province)}`;
  const saveChanges=()=>{setSaved(true);setEditMode(false)};
  return <div className="subscreen" dir="rtl">
    <div className="subscreen-header">
      <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">عوارض آزادراهی</h2>
      <div style={{width:36}}/>
    </div>
    <div className="subscreen-body">
      <div style={{textAlign:"center",marginBottom:16}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:"rgba(168,85,247,0.15)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:32}}>🛣️</div>
        <div style={{fontSize:16,fontWeight:800,color:"var(--text-primary)"}}>عوارض آزادراه</div>
      </div>
      <div style={{background:"var(--card-bg)",borderRadius:14,padding:"14px 16px",marginBottom:12,border:"1px solid var(--border-color)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:editMode?12:12}}>
          <div style={{fontSize:12,color:"var(--text-muted)"}}>خودرو سواری</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {!editMode&&<>
              <div style={{background:"#1a4fa0",borderRadius:6,padding:"4px 8px",display:"flex",flexDirection:"column",alignItems:"center",color:"#fff",fontSize:9,fontWeight:700}}><div>🇮🇷</div><div>ایران</div></div>
              <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",direction:"ltr"}}>{plateDisplay}</div>
            </>}
            <button onClick={()=>setEditMode(!editMode)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--accent)",fontSize:12,fontFamily:"Vazirmatn",fontWeight:700}}>{editMode?"انصراف":"ویرایش پلاک"}</button>
          </div>
        </div>
        {editMode&&<>
          <div className="iran-plate" dir="ltr" style={{marginBottom:8}}>
            <div className="plate-iran-badge">
              <div style={{fontSize:14}}>🇮🇷</div>
              <div style={{fontSize:8,fontWeight:900,letterSpacing:1.5}}>I.R.IRAN</div>
            </div>
            <div className="plate-main">
              <input className="plate-input p2" value={toFaDigits(part1)} onChange={e=>{const v=toLatinDigits(e.target.value).replace(/\D/g,"").slice(0,2);setPart1(v)}} placeholder="۰۰" inputMode="numeric" maxLength={2}/>
              <button type="button" className="plate-letter-btn" onClick={()=>setLetterOpen(!letterOpen)}>{letter}</button>
              <input className="plate-input p3" value={toFaDigits(part2)} onChange={e=>{const v=toLatinDigits(e.target.value).replace(/\D/g,"").slice(0,3);setPart2(v)}} placeholder="۰۰۰" inputMode="numeric" maxLength={3}/>
            </div>
            <div className="plate-separator"/>
            <input className="plate-input p2 plate-province" value={toFaDigits(province)} onChange={e=>{const v=toLatinDigits(e.target.value).replace(/\D/g,"").slice(0,2);setProvince(v)}} placeholder="۰۰" inputMode="numeric" maxLength={2}/>
          </div>
          {letterOpen&&<div className="plate-letter-picker" style={{marginBottom:8}}>{PLATE_LETTERS.map(l=><button key={l} className={letter===l?"active":""} onClick={()=>{setLetter(l);setLetterOpen(false)}}>{l}</button>)}</div>}
          <button className="primary-button" style={{marginTop:4}} onClick={saveChanges}>ذخیره پلاک</button>
        </>}
        {!editMode&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginTop:8}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",marginBottom:4}}>پرداخت خودکار عوارض آزادراه</div>
            <div style={{fontSize:11,color:"var(--text-muted)",lineHeight:1.6}}>با فعال کردن این گزینه، پرداخت خودکار از کیف پول آن‌پرداز انجام می‌گیرد.</div>
          </div>
          <button onClick={()=>setAutoPayEnabled(p=>!p)} style={{background:"none",border:"none",cursor:"pointer",flexShrink:0}}>
            <div style={{width:44,height:24,borderRadius:12,background:autoPayEnabled?"#00D6B0":"var(--card-bg3)",position:"relative",transition:"background 0.2s"}}>
              <div style={{position:"absolute",top:2,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"all 0.2s",left:autoPayEnabled?22:2}}/>
            </div>
          </button>
        </div>}
      </div>
      {!editMode&&<div style={{background:"var(--card-bg)",borderRadius:14,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",border:"1px solid var(--border-color)"}}>
        <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>مبلغ قابل پرداخت</div>
        <div style={{fontSize:14,fontWeight:800,color:"#00D6B0"}}>بدون بدهی</div>
      </div>}
    </div>
  </div>;
}

// ─── Tehran Traffic Screen ────────────────────────────────────────────────────
function TrafficScreen({onBack}:{onBack:()=>void}){
  const [autoPayEnabled,setAutoPayEnabled]=useState(false);
  const [editMode,setEditMode]=useState(false);
  const [part1,setPart1]=useState("24");
  const [letter,setLetter]=useState("م");
  const [part2,setPart2]=useState("615");
  const [province,setProvince]=useState("19");
  const [letterOpen,setLetterOpen]=useState(false);
  const plateDisplay=`${toFaDigits(part1)} ${letter} ${toFaDigits(part2)} | ${toFaDigits(province)}`;
  const saveChanges=()=>setEditMode(false);
  return <div className="subscreen" dir="rtl">
    <div className="subscreen-header">
      <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">طرح ترافیک</h2>
      <div style={{width:36}}/>
    </div>
    <div className="subscreen-body">
      <div style={{textAlign:"center",marginBottom:16}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:"rgba(168,85,247,0.15)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:32}}>📷</div>
        <div style={{fontSize:16,fontWeight:800,color:"var(--text-primary)",marginBottom:4}}>پرداخت بدهی طرح ترافیک</div>
        <div style={{fontSize:13,color:"var(--text-muted)"}}>مجموع بدهی: <span style={{color:"#00D6B0",fontWeight:700}}>بدون بدهی</span></div>
      </div>
      <div style={{background:"var(--card-bg)",borderRadius:14,padding:"14px 16px",marginBottom:12,border:"1px solid var(--border-color)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:editMode?12:0}}>
          <div style={{fontSize:12,color:"var(--text-muted)"}}>خودرو سواری</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {!editMode&&<>
              <div style={{background:"#1a4fa0",borderRadius:6,padding:"4px 8px",display:"flex",flexDirection:"column",alignItems:"center",color:"#fff",fontSize:9,fontWeight:700}}><div>🇮🇷</div><div>ایران</div></div>
              <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",direction:"ltr"}}>{plateDisplay}</div>
            </>}
            <button onClick={()=>setEditMode(!editMode)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--accent)",fontSize:12,fontFamily:"Vazirmatn",fontWeight:700}}>{editMode?"انصراف":"ویرایش پلاک"}</button>
          </div>
        </div>
        {editMode&&<>
          <div className="iran-plate" dir="ltr" style={{marginBottom:8}}>
            <div className="plate-iran-badge">
              <div style={{fontSize:14}}>🇮🇷</div>
              <div style={{fontSize:8,fontWeight:900,letterSpacing:1.5}}>I.R.IRAN</div>
            </div>
            <div className="plate-main">
              <input className="plate-input p2" value={toFaDigits(part1)} onChange={e=>{const v=toLatinDigits(e.target.value).replace(/\D/g,"").slice(0,2);setPart1(v)}} placeholder="۰۰" inputMode="numeric" maxLength={2}/>
              <button type="button" className="plate-letter-btn" onClick={()=>setLetterOpen(!letterOpen)}>{letter}</button>
              <input className="plate-input p3" value={toFaDigits(part2)} onChange={e=>{const v=toLatinDigits(e.target.value).replace(/\D/g,"").slice(0,3);setPart2(v)}} placeholder="۰۰۰" inputMode="numeric" maxLength={3}/>
            </div>
            <div className="plate-separator"/>
            <input className="plate-input p2 plate-province" value={toFaDigits(province)} onChange={e=>{const v=toLatinDigits(e.target.value).replace(/\D/g,"").slice(0,2);setProvince(v)}} placeholder="۰۰" inputMode="numeric" maxLength={2}/>
          </div>
          {letterOpen&&<div className="plate-letter-picker" style={{marginBottom:8}}>{PLATE_LETTERS.map(l=><button key={l} className={letter===l?"active":""} onClick={()=>{setLetter(l);setLetterOpen(false)}}>{l}</button>)}</div>}
          <button className="primary-button" style={{marginTop:4}} onClick={saveChanges}>ذخیره پلاک</button>
        </>}
        {!editMode&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginTop:8}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",marginBottom:4}}>پرداخت خودکار طرح ترافیک</div>
            <div style={{fontSize:11,color:"var(--text-muted)",lineHeight:1.6}}>با فعال کردن این گزینه، پرداخت طرح ترافیک به‌صورت خودکار از کیف پول آن‌پرداز انجام می‌گیرد.</div>
          </div>
          <button onClick={()=>setAutoPayEnabled(p=>!p)} style={{background:"none",border:"none",cursor:"pointer",flexShrink:0}}>
            <div style={{width:44,height:24,borderRadius:12,background:autoPayEnabled?"#00D6B0":"var(--card-bg3)",position:"relative",transition:"background 0.2s"}}>
              <div style={{position:"absolute",top:2,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"all 0.2s",left:autoPayEnabled?22:2}}/>
            </div>
          </button>
        </div>}
      </div>
    </div>
  </div>;
}

// ─── Violations Payment Screen ────────────────────────────────────────────────
function ViolationsPaymentScreen({data,user,onUpdate,onBack,onDone}:{data:{plate:string;amount:string;ownerName:string};user:UserData;onUpdate:(u:UserData,tx:TxRecord)=>void;onBack:()=>void;onDone:()=>void}){
  const [selectedCard,setSelectedCard]=useState(user.cards[0]?.id??"");
  const [cardPickerOpen,setCardPickerOpen]=useState(false);
  const [otp,setOtp]=useState("");const [cvv2,setCvv2]=useState("");
  const [expM,setExpM]=useState("");const [expY,setExpY]=useState("");
  const cvv2Ref=useRef<HTMLInputElement>(null);const expMRef=useRef<HTMLInputElement>(null);const expYRef=useRef<HTMLInputElement>(null);
  const [processing,setProcessing]=useState(false);
  const [receipt,setReceipt]=useState<ReceiptData|null>(null);
  const [err,setErr]=useState("");
  const selCard=user.cards.find(c=>c.id===selectedCard);
  const payValid=!!selCard&&toLatinDigits(otp).length===5&&toLatinDigits(cvv2).length===3&&toLatinDigits(expM).length===2&&toLatinDigits(expY).length===2;
  const resetSensitive=()=>{setOtp("");setCvv2("");setExpM("");setExpY("")};
  const pay=()=>{
    if(!otp){setErr("رمز پویا را وارد کنید.");return}
    if(!cvv2){setErr("CVV2 را وارد کنید.");return}
    if(!expM||!expY){setErr("تاریخ انقضا را وارد کنید.");return}
    setErr("");setProcessing(true);
    setTimeout(()=>{
      setProcessing(false);resetSensitive();
      onUpdate(user,{id:genId(),userId:user.phone,type:"service",fromAsset:"toman",toAsset:"toman",amount:0,fee:0,status:"done",createdAt:new Date().toISOString(),note:`خلافی خودرو · ${data.plate}`,source:"app"});
      setReceipt({title:"پرداخت خلافی با موفقیت انجام شد",amount:`${data.amount} ریال`,destination:`پلاک ${data.plate}`,status:"success",detail:`مالک: ${data.ownerName}`});
    },2500);
  };
  return <>
  {processing&&<AnPardazLoadingOverlay text="در حال پردازش پرداخت..."/>}
  {receipt&&<TransactionReceipt data={receipt} onClose={()=>{setReceipt(null);onDone();}}/>}
  <div className="subscreen" dir="rtl">
    <div className="subscreen-header">
      <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">پرداخت خلافی</h2>
      <div style={{width:36}}/>
    </div>
    <div className="subscreen-body">
      <div className="charge-summary-card" style={{marginBottom:16}}>
        <div className="charge-summary-op">
          <div style={{width:44,height:44,borderRadius:12,background:"rgba(168,85,247,0.15)",border:"1px solid rgba(168,85,247,0.25)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:24}}>🚦</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:800,color:"var(--text-primary)"}}>خلافی خودرو</div>
            <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2,direction:"ltr",textAlign:"right"}}>{data.plate}</div>
            <div style={{fontSize:12,color:"var(--text-muted)"}}>{data.ownerName}</div>
          </div>
        </div>
        <div className="charge-summary-amount">{toFaDigits(String(data.amount))} ریال</div>
      </div>
      <div className="banking-form">
        <div className="bform-field">
          <label className="field-label">کارت بانکی</label>
          <button className="bform-card-select" onClick={()=>setCardPickerOpen(true)}>
            {selCard?(<div className="bform-card-row"><BankLogo bankName={selCard.bank} size={44} rounded={13}/><div className="bform-card-text"><span className="bform-bank-name">{selCard.bank}</span><span className="bform-card-number" dir="ltr">{toFaDigits(fmtCard(selCard.number))}</span></div></div>):(<div className="bform-card-row"><div className="bform-bank-dot bform-bank-dot--empty"><Icon name="credit" size={16}/></div><span className="bform-card-placeholder">انتخاب کارت بانکی</span></div>)}
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
  {cardPickerOpen&&<div className="receipt-page" dir="rtl">
    <div className="receipt-page-header">
      <button className="back-btn" onClick={()=>setCardPickerOpen(false)}><Icon name="arrow" size={20}/></button>
      <h2 style={{flex:1,textAlign:"center",fontSize:17,fontWeight:800}}>انتخاب کارت</h2>
      <div style={{width:36}}/>
    </div>
    <div className="receipt-page-body">
      {user.cards.length===0&&<p className="bs-empty">کارتی ثبت نشده است.</p>}
      {user.cards.map(c=>(
        <button key={c.id} className={`bs-card-item${selectedCard===c.id?" active":""}`} onClick={()=>{setSelectedCard(c.id);setCardPickerOpen(false);if(c.expM)setExpM(toFaDigits(c.expM));if(c.expY)setExpY(toFaDigits(c.expY))}}>
          <BankLogo bankName={c.bank} size={48} rounded={14}/>
          <div className="bs-card-info"><span className="bs-card-bank">{c.bank}</span><span className="bs-card-holder">{c.holderName}</span><span className="bs-card-num" dir="ltr">{toFaDigits(fmtCard(c.number))}</span></div>
          {selectedCard===c.id&&<div className="bs-card-check"><Icon name="check" size={16} stroke={2.5}/></div>}
        </button>
      ))}
    </div>
  </div>}
  </>;
}

// ─── Car Services Hub ─────────────────────────────────────────────────────────
function CarServicesScreen({onBack}:{onBack:()=>void}){
  const [inner,setInner]=useState<null|"violations"|"freeway"|"traffic">(null);
  if(inner==="violations")return <ViolationsScreen onBack={()=>setInner(null)}/>;
  if(inner==="freeway")return <FreewayScreen onBack={()=>setInner(null)}/>;
  if(inner==="traffic")return <TrafficScreen onBack={()=>setInner(null)}/>;
  const plate="۲۴ | ۶۱۵ م ۱۹";
  const services=[
    {label:"عوارض آزادراهی",sub:"",status:"بدون بدهی",statusColor:"#00D6B0",icon:"🛣️",action:"freeway" as const},
    {label:"خلافی خودرو",sub:"",status:"استعلام",statusColor:"#f5c23d",icon:"🚦",action:"violations" as const},
    {label:"طرح ترافیک تهران",sub:"ویژه تهران",status:"بدون بدهی",statusColor:"#00D6B0",icon:"📷",action:"traffic" as const},
  ];
  return <div className="subscreen" dir="rtl">
    <div className="subscreen-header">
      <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">خدمات خودرویی</h2>
      <div style={{width:36}}/>
    </div>
    <div className="subscreen-body">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>وسیله‌های نقلیه</div>
        <button style={{background:"none",border:"none",color:"#00D6B0",fontSize:13,cursor:"pointer",fontFamily:"Vazirmatn",display:"flex",alignItems:"center",gap:4}}><Icon name="plus" size={14}/> افزودن</button>
      </div>
      <div style={{background:"var(--card-bg)",borderRadius:14,padding:"14px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12,border:"1px solid var(--border-color)"}}>
        <div style={{background:"#1a4fa0",borderRadius:8,padding:"8px 12px",display:"flex",flexDirection:"column",alignItems:"center",color:"#fff",fontSize:10,fontWeight:700,flexShrink:0}}>
          <div>🇮🇷</div><div>ایران</div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:800,color:"var(--text-primary)",direction:"ltr"}}>{plate}</div>
          <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2}}>خودرو سواری</div>
        </div>
      </div>
      <div style={{fontSize:12,color:"var(--text-muted)",textAlign:"center",padding:"8px 0",marginBottom:12,borderTop:"1px solid var(--border-lighter)",borderBottom:"1px solid var(--border-lighter)"}}>خدمات پرطرفدار</div>
      {services.map(s=><button key={s.label} onClick={()=>setInner(s.action)} style={{display:"flex",alignItems:"center",width:"100%",background:"var(--card-bg)",border:"1px solid var(--border-light)",borderRadius:14,padding:"14px 16px",marginBottom:10,cursor:"pointer",color:"var(--text-primary)",textAlign:"right",transition:"background 0.15s"}}>
        <div style={{fontSize:24,width:44,height:44,borderRadius:12,background:"rgba(167,85,247,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginLeft:12}}>{s.icon}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>{s.label}</div>
          {s.sub&&<div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>{s.sub}</div>}
        </div>
        <div style={{background:`${s.statusColor}25`,borderRadius:8,padding:"4px 10px",fontSize:11,color:s.statusColor,marginLeft:8,flexShrink:0}}>{s.status}</div>
        <Icon name="arrow" size={16}/>
      </button>)}
      <div style={{marginTop:8}}>
        <div style={{textAlign:"center"}}><button style={{background:"none",border:"none",color:"#00D6B0",fontSize:12,cursor:"pointer",fontFamily:"Vazirmatn"}}>مدیریت پلاک‌ها ←</button></div>
      </div>
    </div>
  </div>;
}

// ─── Sana Registration Screen ─────────────────────────────────────────────────
function SanaScreen({onBack}:{onBack:()=>void}){
  const [nationalId,setNationalId]=useState("");const [phone,setPhone]=useState("");const [done,setDone]=useState(false);const [processing,setProcessing]=useState(false);const [errModal,setErrModal]=useState("");
  const submit=()=>{if(!nationalId||!phone){setErrModal("تمام فیلدها الزامی است.");return}setProcessing(true);setTimeout(()=>{setProcessing(false);setDone(true)},3000)};
  return <>
  {processing&&<AnPardazLoadingOverlay text="در حال ثبت اطلاعات..."/>}
  <div className="subscreen" dir="rtl">
    <div className="subscreen-header">
      <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">ثبت ثنا</h2>
      <div style={{width:36}}/>
    </div>
    <div className="subscreen-body">
      {done?<div style={{textAlign:"center",padding:"32px 16px",display:"flex",flexDirection:"column",alignItems:"center"}}>
        <div style={{width:88,height:88,borderRadius:"50%",background:"linear-gradient(135deg,rgba(0,214,176,0.15),rgba(0,214,176,0.05))",border:"2px solid rgba(0,214,176,0.4)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20,animation:"successPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both"}}>
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="#00D6B0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{animation:"checkDraw 0.6s ease 0.2s both"} as React.CSSProperties}><path d="M8 22l10 10 18-18"/></svg>
        </div>
        <div style={{fontSize:18,fontWeight:900,color:"var(--text-primary)",marginBottom:12}}>درخواست ثبت شد</div>
        <div style={{fontSize:14,color:"var(--text-secondary)",lineHeight:1.85,textAlign:"center",background:"var(--card-bg)",border:"1px solid var(--border-color)",borderRadius:16,padding:"16px 20px"}}>
          جهت تکمیل ثبت نام ثنای خود، در کمتر از یکساعت، همکاران دفاتر خدمات قضایی با شما تماس خواهند گرفت.
        </div>
        <button className="outline-button" style={{marginTop:24,width:"100%"}} onClick={()=>setDone(false)}>بازگشت</button>
      </div>:<>
        <div style={{background:"var(--card-bg)",borderRadius:14,padding:"14px 16px",marginBottom:20,borderRight:"3px solid #64748b",border:"1px solid var(--border-color)"}}>
          <div style={{fontSize:13,color:"#94a3b8",fontWeight:700,marginBottom:2}}>سامانه ثنا</div>
          <div style={{fontSize:11,color:"var(--text-muted)"}}>ثبت‌نام در سامانه خدمات قضایی الکترونیک ایران</div>
        </div>
        <div style={{marginBottom:16}}>
          <FloatInput label="کد ملی" value={toFaDigits(nationalId)} onChange={v=>setNationalId(toLatinDigits(v).replace(/\D/g,"").slice(0,10))} inputMode="numeric" dir="rtl" maxLength={10}/>
        </div>
        <div style={{marginBottom:20}}>
          <FloatInput label="شماره موبایل" value={toFaDigits(phone)} onChange={v=>setPhone(toLatinDigits(v))} inputMode="tel" dir="rtl" maxLength={11}/>
        </div>
        <StickyActionBtn label="ثبت‌نام" onClick={submit} disabled={!nationalId||!phone||processing} loading={processing} loadingText="در حال ثبت..."/>
      </>}
    </div>
  </div>
  {errModal&&createPortal(<div className="modal-overlay"><div className="modal-card" dir="rtl"><div className="modal-page-header"><button className="back-btn" onClick={()=>setErrModal("")}><Icon name="arrow" size={18}/></button><span>خطا</span><div style={{width:36}}/></div><div className="modal-page-body"><div style={{width:64,height:64,borderRadius:18,background:"rgba(232,81,42,0.12)",border:"2px solid rgba(232,81,42,0.3)",display:"flex",alignItems:"center",justifyContent:"center",color:"#e8512a",fontSize:28}}>!</div><div style={{fontSize:14,color:"var(--text-secondary)",lineHeight:1.7,maxWidth:360}}>{errModal}</div><button className="primary-button" style={{background:"#e8512a",width:"100%",maxWidth:360}} onClick={()=>setErrModal("")}>متوجه شدم</button></div></div></div>, document.body)}
  </>;
}

// ─── Judiciary Bill Screen ────────────────────────────────────────────────────
function JudiciaryBillScreen({user,onUpdate,onBack,onDone}:{user:UserData;onUpdate:(u:UserData,tx:TxRecord)=>void;onBack:()=>void;onDone:()=>void}){
  const [billId,setBillId]=useState("");
  const [inquiryDone,setInquiryDone]=useState(false);
  const [inquiryAmount]=useState("۴۵۰٬۰۰۰");
  const [processing,setProcessing]=useState(false);
  const [errModal,setErrModal]=useState("");
  // payment fields
  const [selectedCard,setSelectedCard]=useState(user.cards[0]?.id??"");
  const [cardPickerOpen,setCardPickerOpen]=useState(false);
  const [otp,setOtp]=useState("");const [cvv2,setCvv2]=useState("");
  const [expM,setExpM]=useState("");const [expY,setExpY]=useState("");
  const cvv2Ref=useRef<HTMLInputElement>(null);const expMRef=useRef<HTMLInputElement>(null);const expYRef=useRef<HTMLInputElement>(null);
  const [payErr,setPayErr]=useState("");
  const [receipt,setReceipt]=useState<ReceiptData|null>(null);
  const selCard=user.cards.find(c=>c.id===selectedCard);
  const payValid=!!selCard&&toLatinDigits(otp).length===5&&toLatinDigits(cvv2).length===3&&toLatinDigits(expM).length===2&&toLatinDigits(expY).length===2;
  const resetSensitive=()=>{setOtp("");setCvv2("");setExpM("");setExpY("")};

  const inquire=()=>{
    if(!billId.trim()){setErrModal("شناسه دریافت وجه را وارد کنید.");return}
    setProcessing(true);
    setTimeout(()=>{setProcessing(false);setInquiryDone(true)},2000);
  };

  const pay=()=>{
    if(!otp){setPayErr("رمز پویا را وارد کنید.");return}
    if(!cvv2){setPayErr("CVV2 را وارد کنید.");return}
    if(!expM||!expY){setPayErr("تاریخ انقضا را وارد کنید.");return}
    setPayErr("");setProcessing(true);
    setTimeout(()=>{
      setProcessing(false);resetSensitive();
      onUpdate(user,{id:genId(),userId:user.phone,type:"service",fromAsset:"toman",toAsset:"toman",amount:0,fee:0,status:"done",createdAt:new Date().toISOString(),note:`قبض قضائیه · ${billId}`,source:"app"});
      setReceipt({title:"پرداخت قبض با موفقیت انجام شد",amount:`${inquiryAmount} ریال`,destination:"قوه قضائیه",status:"success"});
    },2500);
  };

  return <>
  {processing&&<AnPardazLoadingOverlay text={inquiryDone?"در حال پردازش پرداخت...":"در حال استعلام..."}/>}
  <div className="subscreen" dir="rtl">
    <div className="subscreen-header">
      <button className="back-btn" onClick={()=>{if(inquiryDone)setInquiryDone(false);else onBack();}}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">قبض قوه قضائیه</h2>
      <div style={{width:36}}/>
    </div>
    {!inquiryDone&&<div className="subscreen-body">
      <div style={{background:"var(--card-bg)",borderRadius:14,padding:"14px 16px",marginBottom:16,border:"1px solid var(--border-color)",borderRight:"3px solid #f5c23d"}}>
        <div style={{fontSize:13,color:"#f5c23d",fontWeight:700,marginBottom:4}}>قوه قضائیه</div>
        <div style={{fontSize:12,color:"var(--text-muted)"}}>کد تله‌پرداز: ۲۰۰۰۰۰۱</div>
      </div>
      <p style={{fontSize:13,color:"var(--text-secondary)",marginBottom:12}}>شناسه دریافت وجه خود را وارد نمایید.</p>
      <FloatInput label="شناسه دریافت وجه" value={toFaDigits(billId)} onChange={v=>setBillId(toLatinDigits(v).replace(/\D/g,""))} inputMode="numeric" style={{marginBottom:16}}/>
      <StickyActionBtn label="استعلام" onClick={inquire} disabled={toLatinDigits(billId).length<5} loading={processing} loadingText="در حال استعلام..."/>
    </div>}
    {inquiryDone&&<div className="subscreen-body">
      <div className="charge-summary-card" style={{marginBottom:16}}>
        <div className="charge-summary-op">
          <div style={{width:44,height:44,borderRadius:12,background:"rgba(245,194,61,0.15)",border:"1px solid rgba(245,194,61,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:22}}>⚖️</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:800,color:"var(--text-primary)"}}>قوه قضائیه</div>
            <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2}}>شناسه: {toFaDigits(billId)}</div>
          </div>
        </div>
        <div className="charge-summary-amount">{inquiryAmount} ریال</div>
      </div>
      <div className="banking-form">
        <div className="bform-field">
          <label className="field-label">کارت بانکی</label>
          <button className="bform-card-select" onClick={()=>setCardPickerOpen(true)}>
            {selCard?(<div className="bform-card-row"><BankLogo bankName={selCard.bank} size={44} rounded={13}/><div className="bform-card-text"><span className="bform-bank-name">{selCard.bank}</span><span className="bform-card-number" dir="ltr">{toFaDigits(fmtCard(selCard.number))}</span></div></div>):(<div className="bform-card-row"><div className="bform-bank-dot bform-bank-dot--empty"><Icon name="credit" size={16}/></div><span className="bform-card-placeholder">انتخاب کارت بانکی</span></div>)}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        </div>
        <div className="fin-otp-row">
          <FinField label="رمز پویا" value={otp} onChange={setOtp} maxLength={5}
            onFilled={()=>cvv2Ref.current?.focus()}/>
          <OtpCooldownBtn key={selCard?.number||"none"} onRequest={()=>setPayErr("")} cardId={selCard?.number} noCard={!selCard}/>
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
        {payErr&&<p className="field-err">{payErr}</p>}
      </div>
      <StickyActionBtn label="پرداخت" onClick={pay} disabled={processing||!payValid} loading={processing} loadingText="در حال پردازش..."/>
    </div>}
  </div>
  {receipt&&<TransactionReceipt data={receipt} onClose={()=>{setReceipt(null);onDone();}}/>}
  {cardPickerOpen&&<div className="receipt-page" dir="rtl">
    <div className="receipt-page-header">
      <button className="back-btn" onClick={()=>setCardPickerOpen(false)}><Icon name="arrow" size={20}/></button>
      <h2 style={{flex:1,textAlign:"center",fontSize:17,fontWeight:800}}>انتخاب کارت</h2>
      <div style={{width:36}}/>
    </div>
    <div className="receipt-page-body">
      {user.cards.length===0&&<p className="bs-empty">کارتی ثبت نشده است.</p>}
      {user.cards.map(c=>(
        <button key={c.id} className={`bs-card-item${selectedCard===c.id?" active":""}`} onClick={()=>{setSelectedCard(c.id);setCardPickerOpen(false);if(c.expM)setExpM(toFaDigits(c.expM));if(c.expY)setExpY(toFaDigits(c.expY))}}>
          <BankLogo bankName={c.bank} size={48} rounded={14}/>
          <div className="bs-card-info"><span className="bs-card-bank">{c.bank}</span><span className="bs-card-holder">{c.holderName}</span><span className="bs-card-num" dir="ltr">{toFaDigits(fmtCard(c.number))}</span></div>
          {selectedCard===c.id&&<div className="bs-card-check"><Icon name="check" size={16} stroke={2.5}/></div>}
        </button>
      ))}
    </div>
  </div>}
  {errModal&&<div style={{margin:"12px 16px",padding:"16px",borderRadius:14,background:"rgba(232,81,42,0.1)",border:"1px solid rgba(232,81,42,0.3)",color:"var(--text-primary)",display:"flex",alignItems:"flex-start",gap:12,direction:"rtl"}}>
    <span style={{flex:1,fontSize:14,lineHeight:1.7}}>{errModal}</span>
    <button onClick={()=>setErrModal("")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:18,lineHeight:1}}>✕</button>
  </div>}
  </>;
}

// ─── Property Registration Bill Screen ────────────────────────────────────────
function PropertyRegBillScreen({user,onUpdate,onBack,onDone}:{user:UserData;onUpdate:(u:UserData,tx:TxRecord)=>void;onBack:()=>void;onDone:()=>void}){
  const [billId,setBillId]=useState("");
  const [inquiryDone,setInquiryDone]=useState(false);
  const [inquiryAmount]=useState("۳۸۰٬۰۰۰");
  const [processing,setProcessing]=useState(false);
  const [errModal,setErrModal]=useState("");
  const [selectedCard,setSelectedCard]=useState(user.cards[0]?.id??"");
  const [cardPickerOpen,setCardPickerOpen]=useState(false);
  const [otp,setOtp]=useState("");const [cvv2,setCvv2]=useState("");
  const [expM,setExpM]=useState("");const [expY,setExpY]=useState("");
  const cvv2Ref=useRef<HTMLInputElement>(null);const expMRef=useRef<HTMLInputElement>(null);const expYRef=useRef<HTMLInputElement>(null);
  const [payErr,setPayErr]=useState("");
  const [receipt,setReceipt]=useState<ReceiptData|null>(null);
  const selCard=user.cards.find(c=>c.id===selectedCard);
  const payValid=!!selCard&&toLatinDigits(otp).length===5&&toLatinDigits(cvv2).length===3&&toLatinDigits(expM).length===2&&toLatinDigits(expY).length===2;
  const resetSensitive=()=>{setOtp("");setCvv2("");setExpM("");setExpY("")};

  const inquire=()=>{
    if(!billId.trim()){setErrModal("شناسه دریافت وجه را وارد کنید.");return}
    setProcessing(true);
    setTimeout(()=>{setProcessing(false);setInquiryDone(true)},2000);
  };

  const pay=()=>{
    if(!otp){setPayErr("رمز پویا را وارد کنید.");return}
    if(!cvv2){setPayErr("CVV2 را وارد کنید.");return}
    if(!expM||!expY){setPayErr("تاریخ انقضا را وارد کنید.");return}
    setPayErr("");setProcessing(true);
    setTimeout(()=>{
      setProcessing(false);resetSensitive();
      onUpdate(user,{id:genId(),userId:user.phone,type:"service",fromAsset:"toman",toAsset:"toman",amount:0,fee:0,status:"done",createdAt:new Date().toISOString(),note:`قبض ثبت اسناد · ${billId}`,source:"app"});
      setReceipt({title:"پرداخت قبض با موفقیت انجام شد",amount:`${inquiryAmount} ریال`,destination:"ثبت اسناد و املاک",status:"success"});
    },2500);
  };

  return <>
  {processing&&<AnPardazLoadingOverlay text={inquiryDone?"در حال پردازش پرداخت...":"در حال استعلام..."}/>}
  <div className="subscreen" dir="rtl">
    <div className="subscreen-header">
      <button className="back-btn" onClick={()=>{if(inquiryDone)setInquiryDone(false);else onBack();}}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">قبض ثبت اسناد و املاک</h2>
      <div style={{width:36}}/>
    </div>
    {!inquiryDone&&<div className="subscreen-body">
      <div style={{background:"var(--card-bg)",borderRadius:14,padding:"14px 16px",marginBottom:16,border:"1px solid var(--border-color)",borderRight:"3px solid #94a3b8"}}>
        <div style={{fontSize:13,color:"#94a3b8",fontWeight:700,marginBottom:4}}>ثبت اسناد و املاک</div>
        <div style={{fontSize:12,color:"var(--text-muted)"}}>کد تله‌پرداز: ۲۰۰۰۰۱۲</div>
      </div>
      <p style={{fontSize:13,color:"var(--text-secondary)",marginBottom:12}}>شناسه دریافت وجه خود را وارد نمایید.</p>
      <FloatInput label="شناسه دریافت وجه" value={toFaDigits(billId)} onChange={v=>setBillId(toLatinDigits(v).replace(/\D/g,""))} inputMode="numeric" style={{marginBottom:16}}/>
      <StickyActionBtn label="استعلام" onClick={inquire} disabled={toLatinDigits(billId).length<5} loading={processing} loadingText="در حال استعلام..."/>
    </div>}
    {inquiryDone&&<div className="subscreen-body">
      <div className="charge-summary-card" style={{marginBottom:16}}>
        <div className="charge-summary-op">
          <div style={{width:44,height:44,borderRadius:12,background:"rgba(148,163,184,0.15)",border:"1px solid rgba(148,163,184,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:22}}>📄</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:800,color:"var(--text-primary)"}}>ثبت اسناد و املاک</div>
            <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2}}>شناسه: {toFaDigits(billId)}</div>
          </div>
        </div>
        <div className="charge-summary-amount">{inquiryAmount} ریال</div>
      </div>
      <div className="banking-form">
        <div className="bform-field">
          <label className="field-label">کارت بانکی</label>
          <button className="bform-card-select" onClick={()=>setCardPickerOpen(true)}>
            {selCard?(<div className="bform-card-row"><BankLogo bankName={selCard.bank} size={44} rounded={13}/><div className="bform-card-text"><span className="bform-bank-name">{selCard.bank}</span><span className="bform-card-number" dir="ltr">{toFaDigits(fmtCard(selCard.number))}</span></div></div>):(<div className="bform-card-row"><div className="bform-bank-dot bform-bank-dot--empty"><Icon name="credit" size={16}/></div><span className="bform-card-placeholder">انتخاب کارت بانکی</span></div>)}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        </div>
        <div className="fin-otp-row">
          <FinField label="رمز پویا" value={otp} onChange={setOtp} maxLength={5}
            onFilled={()=>cvv2Ref.current?.focus()}/>
          <OtpCooldownBtn key={selCard?.number||"none"} onRequest={()=>setPayErr("")} cardId={selCard?.number} noCard={!selCard}/>
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
        {payErr&&<p className="field-err">{payErr}</p>}
      </div>
      <StickyActionBtn label="پرداخت" onClick={pay} disabled={processing||!payValid} loading={processing} loadingText="در حال پردازش..."/>
    </div>}
  </div>
  {receipt&&<TransactionReceipt data={receipt} onClose={()=>{setReceipt(null);onDone();}}/>}
  {cardPickerOpen&&<div className="receipt-page" dir="rtl">
    <div className="receipt-page-header">
      <button className="back-btn" onClick={()=>setCardPickerOpen(false)}><Icon name="arrow" size={20}/></button>
      <h2 style={{flex:1,textAlign:"center",fontSize:17,fontWeight:800}}>انتخاب کارت</h2>
      <div style={{width:36}}/>
    </div>
    <div className="receipt-page-body">
      {user.cards.length===0&&<p className="bs-empty">کارتی ثبت نشده است.</p>}
      {user.cards.map(c=>(
        <button key={c.id} className={`bs-card-item${selectedCard===c.id?" active":""}`} onClick={()=>{setSelectedCard(c.id);setCardPickerOpen(false);if(c.expM)setExpM(toFaDigits(c.expM));if(c.expY)setExpY(toFaDigits(c.expY))}}>
          <BankLogo bankName={c.bank} size={48} rounded={14}/>
          <div className="bs-card-info"><span className="bs-card-bank">{c.bank}</span><span className="bs-card-holder">{c.holderName}</span><span className="bs-card-num" dir="ltr">{toFaDigits(fmtCard(c.number))}</span></div>
          {selectedCard===c.id&&<div className="bs-card-check"><Icon name="check" size={16} stroke={2.5}/></div>}
        </button>
      ))}
    </div>
  </div>}
  {errModal&&<div style={{margin:"12px 16px",padding:"16px",borderRadius:14,background:"rgba(232,81,42,0.1)",border:"1px solid rgba(232,81,42,0.3)",color:"var(--text-primary)",display:"flex",alignItems:"flex-start",gap:12,direction:"rtl"}}>
    <span style={{flex:1,fontSize:14,lineHeight:1.7}}>{errModal}</span>
    <button onClick={()=>setErrModal("")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:18,lineHeight:1}}>✕</button>
  </div>}
  </>;
}

// ─── Charity Org Logo ─────────────────────────────────────────────────────────
const _CHARITY_LOGOS:{[id:string]:string}={
  "red-crescent":charityLogoRedCrescent,
  "komite":charityLogoKomite,
  "children":charityLogoChildren,
  "environment":charityLogoEnvironment,
  "barekat":charityLogoBarekat,
};
function CharityLogo({id}:{id:string}){
  const src=_CHARITY_LOGOS[id];
  if(src)return <img src={src} alt={id} width="48" height="48" decoding="sync" style={{objectFit:"contain",width:"100%",height:"100%"}}/>;
  return <svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="#555"/><text x="24" y="30" textAnchor="middle" fill="white" fontSize="18">؟</text></svg>;
}

// ─── Charity Screen ───────────────────────────────────────────────────────────
function CharityScreen({onBack,onGoToPayment}:{onBack:()=>void;onGoToPayment:(data:{orgId:string;orgName:string;amount:string})=>void}){
  const [selected,setSelected]=useState<string|null>(null);const [amount,setAmount]=useState("");const [errModal,setErrModal]=useState("");
  const charityAmt=parseInt(toLatinDigits(amount).replace(/\D/g,""))||0;
  const orgs=[
    {id:"red-crescent",name:"هلال احمر",desc:"کمک به آسیب‌دیدگان حوادث"},
    {id:"komite",name:"کمیته امداد امام خمینی",desc:"حمایت از نیازمندان"},
    {id:"children",name:"انجمن حمایت از کودکان",desc:"کمک به کودکان بی‌سرپرست"},
    {id:"environment",name:"سازمان محیط زیست",desc:"کمک به حفظ طبیعت"},
    {id:"barekat",name:"بنیاد برکت",desc:"توانمندسازی محرومان"},
  ];
  const presets=["۱۰,۰۰۰ ریال","۵۰,۰۰۰ ریال","۱۰۰,۰۰۰ ریال","۵۰۰,۰۰۰ ریال"];
  const donate=()=>{if(!selected){setErrModal("لطفاً یک سازمان خیریه انتخاب کنید.");return}if(!amount){setErrModal("مبلغ کمک را انتخاب یا وارد کنید.");return}onGoToPayment({orgId:selected!,orgName:orgs.find(o=>o.id===selected)!.name,amount})};
  return <>
  <div className="subscreen" dir="rtl">
    <div className="subscreen-header"><button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button><h2 className="subscreen-title">نیکوکاری</h2><div style={{width:36}}/></div>
    <div className="subscreen-body" style={{overflowY:"auto"}}>
      <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)",marginBottom:12}}>انتخاب سازمان خیریه</div>
      {orgs.map(org=><button key={org.id} onClick={()=>setSelected(selected===org.id?null:org.id)} style={{display:"flex",alignItems:"center",gap:12,width:"100%",background:selected===org.id?"rgba(0,214,176,0.08)":"var(--card-bg)",border:`1px solid ${selected===org.id?"#00D6B0":"var(--border-color)"}`,borderRadius:14,padding:"12px 14px",marginBottom:8,cursor:"pointer",color:"var(--text-primary)",textAlign:"right",transition:"all 0.2s",boxShadow:selected===org.id?"0 0 16px rgba(0,214,176,0.2)":"none"}}>
        <div style={{flexShrink:0,borderRadius:12,overflow:"hidden",width:48,height:48}}><CharityLogo id={org.id}/></div>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)"}}>{org.name}</div>
          <div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>{org.desc}</div>
        </div>
        {selected===org.id&&<div style={{color:"#00D6B0",flexShrink:0}}><Icon name="check" size={18}/></div>}
      </button>)}
      <div style={{marginTop:8}}>
        <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)",marginBottom:12}}>مبلغ کمک</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          {presets.map(p=><button key={p} onClick={()=>setAmount(p)} className={`pkg-btn ${amount===p?"active":""}`}>{p}</button>)}
        </div>
        <FloatInput label="یا مبلغ دلخواه را وارد کنید" value={charityAmt?fa(charityAmt):""} onChange={v=>setAmount(toLatinDigits(v).replace(/[^0-9]/g,""))} inputMode="numeric" dir="ltr" suffix="ریال" style={{marginBottom:charityAmt>0?4:16}}/>
        {charityAmt>0&&<div className="amount-words" style={{marginBottom:16}}>معادل {numToFaWords(Math.floor(charityAmt/10))} تومان</div>}
        <StickyActionBtn label="اهدای کمک 🤲" onClick={donate} disabled={!selected||!amount}/>
      </div>
    </div>
  </div>
  {errModal&&<div style={{margin:"12px 16px",padding:"16px",borderRadius:14,background:"rgba(232,81,42,0.1)",border:"1px solid rgba(232,81,42,0.3)",color:"var(--text-primary)",display:"flex",alignItems:"flex-start",gap:12,direction:"rtl"}}>
    <span style={{flex:1,fontSize:14,lineHeight:1.7}}>{errModal}</span>
    <button onClick={()=>setErrModal("")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:18,lineHeight:1}}>✕</button>
  </div>}
  </>;
}

// ─── Charity Payment Screen ────────────────────────────────────────────────────
function CharityPaymentScreen({data,user,onUpdate,onBack,onDone}:{data:{orgId:string;orgName:string;amount:string};user:UserData;onUpdate:(u:UserData,tx:TxRecord)=>void;onBack:()=>void;onDone:()=>void}){
  const [selectedCard,setSelectedCard]=useState(user.cards[0]?.id??"");
  const [cardPickerOpen,setCardPickerOpen]=useState(false);
  const [otp,setOtp]=useState("");const [cvv2,setCvv2]=useState("");
  const [expM,setExpM]=useState("");const [expY,setExpY]=useState("");
  const cvv2Ref=useRef<HTMLInputElement>(null);const expMRef=useRef<HTMLInputElement>(null);const expYRef=useRef<HTMLInputElement>(null);
  const [processing,setProcessing]=useState(false);
  const [receipt,setReceipt]=useState<ReceiptData|null>(null);
  const [err,setErr]=useState("");
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
      resetSensitive();
      onUpdate(user,{id:genId(),userId:user.phone,type:"service",fromAsset:"toman",toAsset:"toman",amount:0,fee:0,status:"done",createdAt:new Date().toISOString(),note:`نیکوکاری · ${data.orgName} · ${data.amount}`,source:"app"});
      setReceipt({title:"کمک شما با موفقیت ثبت شد",amount:data.amount,destination:data.orgName,status:"success",detail:"با سپاس از نیکوکاری شما. کمک شما به دست نیازمندان می‌رسد."});
    },2500);
  };
  return <>
  <div className="subscreen" dir="rtl">
    <div className="subscreen-header">
      <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">پرداخت کمک</h2>
      <div style={{width:36}}/>
    </div>
    <div className="subscreen-body">
      {/* Charity info box */}
      <div className="charge-summary-card charity-summary-card">
        <div className="charge-summary-op">
          <div style={{width:48,height:48,borderRadius:14,overflow:"hidden",flexShrink:0}}><CharityLogo id={data.orgId}/></div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:800,color:"var(--text-primary)",whiteSpace:"normal",lineHeight:1.4}}>{data.orgName}</div>
            <div style={{fontSize:12,color:"var(--text-muted)",marginTop:3}}>کمک داوطلبانه</div>
          </div>
        </div>
        <div className="charge-summary-amount">{toFaDigits(data.amount.replace(/[^0-9]/g,""))&&`${toFaDigits(data.amount.replace(/[^0-9]/g,""))} ریال`||data.amount}</div>
      </div>

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
  {cardPickerOpen&&<div className="receipt-page" dir="rtl">
    <div className="receipt-page-header">
      <button className="back-btn" onClick={()=>setCardPickerOpen(false)}><Icon name="arrow" size={20}/></button>
      <h2 style={{flex:1,textAlign:"center",fontSize:17,fontWeight:800}}>انتخاب کارت</h2>
      <div style={{width:36}}/>
    </div>
    <div className="receipt-page-body">
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
  </div>}
  </>;
}

// ─── Service Placeholder Screen ───────────────────────────────────────────────
function ServiceScreen({name,onBack}:{name:string;onBack:()=>void}){
  return <div className="subscreen" dir="rtl">
    <div className="subscreen-header">
      <button className="back-btn" onClick={onBack}><Icon name="arrow" size={20}/></button>
      <h2 className="subscreen-title">{name}</h2>
      <div style={{width:36}}/>
    </div>
    <div className="subscreen-body" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:300}}>
      <div style={{color:"var(--text-muted)",marginBottom:16}}><Icon name="clock" size={56}/></div>
      <div style={{fontSize:18,fontWeight:700,color:"var(--text-muted)",marginBottom:8}}>به‌زودی</div>
      <div style={{fontSize:13,color:"var(--text-faint)",textAlign:"center"}}>{name} در حال توسعه است.</div>
    </div>
  </div>;
}

type SupportTicket={id:string;subject:string;category:string;priority:string;body:string;status:string;createdAt:string;updatedAt:string;unread?:boolean;messages:{from:"user"|"agent";text:string;at:string;attachment?:string}[]};
function ExchangePopup({children,onClose,onBack}:{children:ReactNode;onClose:()=>void;onBack?:()=>void}){useBackHandler(onBack||onClose);return <div className="exchange-page-view" dir="rtl"><div className="exchange-page-view-header"><button className="exchange-page-back-btn" onClick={onBack||onClose} aria-label="بازگشت"><Icon name="arrow" size={18}/></button><img src={anPardazLogo} alt="لوگوی صرافی آن‌پرداز" style={{height:30,objectFit:"contain",borderRadius:9}}/><button className="exchange-popup-close" onClick={onClose}>بستن</button></div><div className="exchange-page-view-body">{children}</div></div>}
function ExchangeSupportCenter({onBack}:{onBack:()=>void}){return <div className="exchange-support-page"><div className="exchange-support-head"><button className="back-btn" onClick={onBack}><Icon name="arrow" size={18}/></button><div><b>مرکز پشتیبانی آن صراف</b><small>سرویس پشتیبانی</small></div><img src={anPardazLogo} alt="آن‌پرداز"/></div><div className="exchange-empty" style={{padding:24,textAlign:"center",lineHeight:1.9}}>سامانه تیکت هنوز به Backend پشتیبانی متصل نشده است؛ برای جلوگیری از ثبت یا نمایش اطلاعات ساختگی، این بخش فعلاً غیرفعال است.</div></div>}
function ExchangeChat({onBack}:{onBack:()=>void}){return <div className="exchange-chat"><div className="exchange-support-head"><button className="back-btn" onClick={onBack}><Icon name="arrow" size={18}/></button><div><b>چت با پشتیبانی</b><small>سرویس پشتیبانی</small></div><img src={anPardazLogo} alt="آن‌پرداز"/></div><div className="exchange-empty" style={{padding:24,textAlign:"center",lineHeight:1.9}}>چت زنده تا اتصال Backend پشتیبانی فعال نشده است؛ هیچ پاسخ، وضعیت آنلاین یا پیام ساختگی نمایش داده نمی‌شود.</div></div>}
function ExchangeFeesPage({onBack}:{onBack:()=>void}){const [kind,setKind]=useState("خرید سریع"),[amount,setAmount]=useState(""),[calculated,setCalculated]=useState<number|null>(null),[faq,setFaq]=useState<string|null>(null),[showKindPicker,setShowKindPicker]=useState(false);const feeRate=kind==="انتقال داخلی"||kind.includes("واریز")?0:((kind==="خرید سریع"||kind==="فروش سریع") ? .004 : .003);const calc=()=>setCalculated((Number(toLatinDigits(amount))||0)*feeRate);const FeeTable=({headers,rows}:{headers:string[];rows:string[][]})=><div className="fee-table"><div className="fee-tr">{headers.map(h=><b key={h}>{h}</b>)}</div>{rows.map((r,i)=><div className="fee-tr" key={i}>{r.map((c,j)=><span key={j}>{c}</span>)}</div>)}</div>;return <div className="exchange-content-page"><header className="exchange-content-head"><button className="back-btn" onClick={onBack}><Icon name="arrow" size={18}/></button><div><h1>کارمزدها</h1><p>تمامی کارمزدهای صرافی به صورت شفاف در این صفحه نمایش داده می‌شوند.</p></div><img src={anPardazLogo} alt="صرافی آن‌پرداز"/></header><section className="exchange-section"><h2>کارمزد معاملات</h2><FeeTable headers={["حجم معاملات ۳۰ روز اخیر","کارمزد سفارش‌گذار (Maker)","کارمزد سفارش‌بردار (Taker)"]} rows={[["کمتر از ۵۰ میلیون تومان","0.35%","0.40%"],["۵۰ تا ۲۰۰ میلیون تومان","0.30%","0.35%"],["۲۰۰ تا ۵۰۰ میلیون تومان","0.25%","0.30%"],["۵۰۰ میلیون تا ۱ میلیارد تومان","0.20%","0.25%"],["بیشتر از ۱ میلیارد تومان","0.15%","0.20%"]]}/><p className="fee-note">با افزایش حجم معاملات، کارمزد شما کاهش خواهد یافت.</p></section><section className="fee-split"><div className="exchange-section"><h2>کارمزد واریز تومان</h2><p>واریز تومان به صرافی کاملاً رایگان است.</p><span className="free-badge">بدون کارمزد</span></div><div className="exchange-section"><h2>کارمزد واریز تتر</h2><p>واریز تتر به صرافی بدون کارمزد است.</p><span className="free-badge">بدون کارمزد</span></div><div className="exchange-section"><h2>انتقال داخلی</h2><p>انتقال دارایی بین کاربران آن‌پرداز کاملاً رایگان است.</p><span className="free-badge">رایگان</span></div></section><section className="exchange-section"><h2>کارمزد برداشت تومان</h2><p>کارمزد برداشت تومان مطابق قوانین شبکه بانکی محاسبه می‌شود.</p><FeeTable headers={["مبلغ برداشت","کارمزد"]} rows={[["تا ۶۰۰ هزار تومان","1٪"],["۶۰۰ هزار تا ۲۰ میلیون تومان","۶,۰۰۰ تومان"],["بیش از ۲۰ میلیون تومان","۰.۰۱٪ مبلغ تراکنش (حداکثر ۷,۵۰۰ تومان)"]]}/></section><section className="exchange-section"><h2>کارمزد برداشت تتر</h2><FeeTable headers={["شبکه","کارمزد برداشت","حداقل برداشت"]} rows={[["TRC20","1 USDT","10 USDT"],["BEP20","0.5 USDT","10 USDT"],["ERC20","5 USDT","20 USDT"]]}/></section><section className="exchange-section"><h2>کارمزد خرید و فروش سریع</h2><div className="fee-line"><span>کارمزد خرید سریع: <b>0.40٪</b></span><span>کارمزد فروش سریع: <b>0.40٪</b></span></div><p className="fee-note">کارمزد قبل از ثبت نهایی سفارش به شما نمایش داده خواهد شد.</p></section><section className="exchange-section calculator"><h2>محاسبه‌گر کارمزد</h2><div style={{marginBottom:4}}><div className="fee-kind-label" style={{fontSize:12,marginBottom:6,fontWeight:600}}>نوع معامله</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{["خرید سریع","فروش سریع","معامله اسپات","واریز تومان","انتقال داخلی"].map(x=><button key={x} className={kind===x?"fee-kind-btn selected":"fee-kind-btn"} onClick={()=>{setKind(x);setCalculated(null);}} style={{padding:"8px 14px",borderRadius:10,cursor:"pointer",fontFamily:"Vazirmatn",fontSize:13,fontWeight:kind===x?700:500}}>{x}</button>)}</div></div><input value={toFaDigits(amount)} onChange={e=>setAmount(toLatinDigits(e.target.value).replace(/[^0-9.]/g,""))} inputMode="decimal" placeholder="مبلغ معامله (تومان)"/><button className="primary-button" onClick={calc}>محاسبه کارمزد</button>{calculated!==null&&<div className="calculator-result"><div><span>کارمزد</span><b>{fa(Math.round(calculated))} تومان</b></div><div><span>مبلغ نهایی پرداختی</span><b>{fa(Math.round((Number(amount)||0)+calculated))} تومان</b></div><div><span>مبلغ نهایی دریافتی</span><b>{fa(Math.round((Number(amount)||0)-calculated))} تومان</b></div></div>}</section><section className="exchange-section faq"><h2>سؤالات متداول</h2>{[["کارمزد معاملات چگونه محاسبه می‌شود؟","کارمزد هر سفارش براساس حجم معاملات ۳۰ روز اخیر و نوع سفارش محاسبه می‌شود."],["چگونه می‌توانم کارمزد کمتری پرداخت کنم؟","با افزایش حجم معاملات ماهانه، سطح کارمزدی شما به‌صورت خودکار کاهش می‌یابد."],["کارمزد برداشت تتر چقدر است؟","کارمزد برداشت به شبکه انتخابی بستگی دارد و پیش از تأیید نمایش داده می‌شود."],["آیا واریز تومان کارمزد دارد؟","خیر، واریز تومان به صرافی آن‌پرداز رایگان است."]].map(([q,a])=><button key={q} onClick={()=>setFaq(faq===q?null:q)}><b>{q}</b><span>{faq===q?"−":"+"}</span>{faq===q&&<p>{a}</p>}</button>)}</section></div>}
function ExchangeVideoGuide({onBack}:{onBack:()=>void}){const videoRef=useRef<HTMLVideoElement>(null),[playing,setPlaying]=useState(false),[position,setPosition]=useState(()=>Number(localStorage.getItem("anp_exchange_video_position")||0)),[duration,setDuration]=useState(0),[volume,setVolume]=useState(.8),[muted,setMuted]=useState(false),[error,setError]=useState(false),[askResume,setAskResume]=useState(Number(localStorage.getItem("anp_exchange_video_position")||0)>0);const source="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";const fmt=(n:number)=>`${String(Math.floor(n/60)).padStart(2,"0")}:${String(Math.floor(n%60)).padStart(2,"0")}`;const seek=(v:number)=>{const el=videoRef.current;if(el){el.currentTime=Math.max(0,Math.min(duration,v));setPosition(el.currentTime)}};const toggle=()=>{const el=videoRef.current;if(!el)return;if(el.paused){el.play().then(()=>setPlaying(true)).catch(()=>setError(true))}else{el.pause();setPlaying(false)}};return <div className="exchange-content-page video-guide"><header className="exchange-content-head"><button className="back-btn" onClick={()=>{localStorage.setItem("anp_exchange_video_position",String(position));onBack()}}><Icon name="arrow" size={18}/></button><div><h1>راهنمای استفاده</h1><p>برای آشنایی با امکانات صرافی، ویدئوی آموزشی زیر را مشاهده کنید.</p></div><img src={anPardazLogo} alt="صرافی آن‌پرداز"/></header>{askResume&&<div style={{margin:"0 0 14px",padding:"16px",borderRadius:14,background:"rgba(0,214,176,0.07)",border:"1px solid rgba(0,214,176,0.2)",direction:"rtl"}}><div style={{fontSize:14,fontWeight:700,color:"#00D6B0",marginBottom:12}}>ادامه مشاهده از آخرین موقعیت؟</div><div className="confirm-actions"><button className="outline-button" onClick={()=>{seek(0);setAskResume(false)}}>شروع از ابتدا</button><button className="primary-button" onClick={()=>setAskResume(false)}>ادامه</button></div></div>}<section className="video-shell">{source?<video ref={videoRef} src={source} onLoadedMetadata={e=>{setDuration(e.currentTarget.duration);seek(position)}} onTimeUpdate={e=>{setPosition(e.currentTarget.currentTime);localStorage.setItem("anp_exchange_video_position",String(e.currentTarget.currentTime))}} onEnded={()=>setPlaying(false)} onError={()=>setError(true)}/>:<div className="video-placeholder"><Icon name="chart" size={48}/><b>ویدئوی آموزشی به‌زودی بارگذاری می‌شود</b><small>این بخش برای جایگزینی آسان فایل ویدئو آماده است.</small></div>}{error&&<div className="video-error">خطا در بارگذاری ویدئو <button onClick={()=>{setError(false);videoRef.current?.load()}}>تلاش مجدد</button></div>}<div className="video-controls"><button onClick={()=>seek(position-10)}>−۱۰</button><button className="video-play" onClick={toggle}>{playing?"Pause":"Play"}</button><button onClick={()=>seek(position+10)}>+۱۰</button><input type="range" min="0" max={duration||1} value={position} onChange={e=>seek(Number(e.target.value))}/><span>{fmt(position)} / {fmt(duration)}</span><button onClick={()=>{setMuted(!muted);if(videoRef.current)videoRef.current.muted=!muted}}>{muted?"🔇":"🔊"}</button><input className="volume" type="range" min="0" max="1" step=".05" value={volume} onChange={e=>{const v=Number(e.target.value);setVolume(v);if(videoRef.current)videoRef.current.volume=v}}/><button onClick={()=>videoRef.current?.requestFullscreen?.()}>⛶</button></div></section><button className="outline-button video-close" onClick={onBack}>بستن</button></div>}

const TMN_FLAG_LOGO=(()=>{const s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><defs><clipPath id="tc"><circle cx="15" cy="15" r="15"/></clipPath></defs><g clip-path="url(#tc)"><rect y="0" width="30" height="10" fill="#1a7f3c"/><rect y="10" width="30" height="10" fill="#f5f5f5"/><rect y="20" width="30" height="11" fill="#c0392b"/></g></svg>';return`data:image/svg+xml;base64,${btoa(s)}`;})();
function ExchangeInstantTrade({initialAsset,user,coins,onBack,onUpdate}:{initialAsset:string;user:UserData;coins:typeof EX_COINS;onBack:()=>void;onUpdate:(u:UserData,tx:TxRecord)=>void}){
  const [side,setSide]=useState<"buy"|"sell">("buy");
  const [asset,setAsset]=useState(initialAsset);
  const [quote,setQuote]=useState<"TMN"|"USDT">("TMN");
  const [amount,setAmount]=useState("");
  const [instView,setInstView]=useState<"main"|"coin-picker"|"confirm"|"receipt">("main");
  const [picker,setPicker]=useState(false);
  const [pickerSearch,setPickerSearch]=useState("");
  const [processing,setProcessing]=useState(false);
  const [result,setResult]=useState<ReceiptData|null>(null);
  const [error,setError]=useState(""); const [liveWallets,setLiveWallets]=useState<Record<string,number>>({}); useEffect(()=>{let active=true;const load=async()=>{try{const w=await sarrafWalletMap();if(active)setLiveWallets(w);}catch{}};void load();const id=window.setInterval(()=>void load(),5000);return()=>{active=false;clearInterval(id)}},[]);

  const selected=coins.find(c=>c.symbol===asset)??coins[0];
  // In buy mode: amount = quote currency (TMN or USDT). In sell mode: amount = base coin.
  const rawAmt=Number(amount)||0;
  const liveUsdtToman=Number(coins.find(c=>c.symbol==="USDT")?.price??0); const priceInQuote=quote==="USDT"?(liveUsdtToman>0?selected.price/liveUsdtToman:0):selected.price;
  const quoteSpent=side==="buy"?rawAmt:rawAmt*priceInQuote;
  const baseUnits=side==="buy"?rawAmt/Math.max(priceInQuote,1e-12):rawAmt;
  const feeRate=.003;
  const fee=quoteSpent*feeRate;
  const quoteBalance=quote==="TMN"?Number(liveWallets.TMN??0):Number(liveWallets.USDT??0);
  const baseBalance=Number(liveWallets[String(asset).toUpperCase()]??0);
  const instantTomanNum=side==="buy"&&quote==="TMN"?Math.floor(rawAmt):0;
  const quoteLabel=quote==="TMN"?"تومان":"USDT";
  const fmtQ=(v:number)=>quote==="TMN"?fa(Math.round(v)):faFixed(v,4);
  const avStr=side==="buy"?(quote==="TMN"?`${fa(quoteBalance)} تومان`:`${faFixed(quoteBalance,4)} USDT`):`${faFixed(baseBalance,6)} ${asset}`;

  const switchQuote=(q:"TMN"|"USDT")=>{if(asset==="USDT"&&q==="USDT")return;setQuote(q);setAmount("");};
  const usePercent=(p:number)=>{if(side==="buy")setAmount(String(Math.floor(quoteBalance*p/100*1e4)/1e4));else setAmount(String(Math.floor(baseBalance*p/100*1e8)/1e8));};
  const place=()=>{if(!rawAmt){setError("مقدار معامله را وارد کنید.");return}if(side==="buy"&&quoteSpent+fee>quoteBalance){setError(`موجودی ${quoteLabel} کافی نیست.`);return}if(side==="sell"&&baseUnits>baseBalance){setError(`موجودی ${asset} کافی نیست.`);return}setInstView("confirm");};
  const execute=async()=>{setInstView("main");setProcessing(true);setError("");try{const buying=side==="buy";const result=await sarrafPlaceOrder(asset,quote==="TMN"?"TMN":"USDT",buying?"buy":"sell","market",baseUnits,undefined,quoteSpent);setProcessing(false);setResult({title:"سفارش آنی در آن صراف ثبت شد",amount:`${buying?faFixed(baseUnits,4):fmtQ(quoteSpent)} ${buying?asset:quoteLabel}`,destination:`شناسه سفارش: ${String(result?.order?.id??result?.orderId??"—")}`,detail:"موجودی و کارمزد از حساب واقعی آن صراف محاسبه می‌شوند."});setAmount("");}catch(e){setProcessing(false);setError(e instanceof Error?e.message:"ثبت سفارش انجام نشد.");}};

  if(instView==="coin-picker") return <div className="expage" dir="rtl"><div className="expage-header"><button className="back-btn" onClick={()=>{setInstView("main");setPickerSearch("")}}><Icon name="arrow" size={20}/></button><h2 className="expage-title">انتخاب ارز</h2><div style={{width:36}}/></div><div className="expage-body"><div className="exchange-asset-search" style={{marginBottom:12}}><Icon name="search" size={17}/><input autoFocus value={pickerSearch} onChange={e=>setPickerSearch(e.target.value)} placeholder="جستجوی نام یا نماد ارز" style={{fontSize:14,padding:"13px 8px"}}/></div><div className="exchange-asset-list" style={{gap:3}}>{coins.filter(c=>(c.symbol+c.fa).toLowerCase().includes(pickerSearch.toLowerCase())).map(c=>{const isSel=asset===c.symbol;return <button key={c.symbol} onClick={()=>{setAsset(c.symbol);if(c.symbol==="USDT")setQuote("TMN");setInstView("main");setAmount("");}} style={{padding:"13px 10px",borderRadius:13,background:isSel?"rgba(0,214,176,0.1)":"transparent",border:`1px solid ${isSel?"rgba(0,214,176,0.3)":"rgba(120,190,210,0.08)"}`,marginBottom:2}}><CoinLogo symbol={c.symbol} size={42}/><span style={{display:"grid",gap:4,flex:1}}><b style={{fontSize:15,fontWeight:700,color:isSel?"#00D6B0":"var(--text-primary)"}}>{c.fa}</b><small style={{fontSize:12,fontWeight:700,color:isSel?"rgba(0,214,176,0.75)":"var(--text-muted)",letterSpacing:"0.04em"}}>{c.symbol}</small></span>{isSel&&<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00D6B0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" strokeOpacity=".25"/><polyline points="8 12 11 15 16 9"/></svg>}</button>;})}</div></div></div>;

  if(instView==="confirm") return <div className="expage" dir="rtl"><div className="expage-header"><button className="back-btn" onClick={()=>setInstView("main")}><Icon name="arrow" size={20}/></button><h2 className="expage-title">تأیید سفارش</h2><div style={{width:36}}/></div><div className="expage-body"><div className="exchange-confirm-lines" style={{marginBottom:24}}><div><span>جفت‌ارز</span><b>{asset} / {quote}</b></div><div><span>نوع عملیات</span><b>{side==="buy"?"خرید":"فروش"}</b></div><div><span>مقدار {asset}</span><b>{faFixed(baseUnits,6)}</b></div><div><span>قیمت لحظه‌ای</span><b>{fmtQ(priceInQuote)} {quoteLabel}</b></div><div><span>کارمزد</span><b>{fmtQ(fee)} {quoteLabel}</b></div><div><span>مبلغ {side==="buy"?"پرداختی":"دریافتی"}</span><b>{fmtQ(side==="buy"?quoteSpent+fee:quoteSpent-fee)} {quoteLabel}</b></div></div><div className="confirm-actions"><button className="outline-button" onClick={()=>setInstView("main")}>انصراف</button><button className="primary-button" onClick={execute}>تأیید و ثبت سفارش</button></div></div>{processing&&<AnPardazLoadingOverlay text="در حال انجام معامله آنی..."/>}</div>;

  return <div className="instant-page">
    <header className="instant-head">
      <button className="back-btn" onClick={onBack}><Icon name="arrow" size={18}/></button>
      <h1>خرید و فروش آنی</h1>
      <button className="instant-help" onClick={()=>{setError("در خرید و فروش آنی، سفارش شما با قیمت لحظه‌ای بازار و در سریع‌ترین زمان ممکن انجام می‌شود.")}}>؟</button>
    </header>

    {/* Pair selector bar */}
    <div className="instant-pair-bar">
      <button className="instant-asset-pill" onClick={()=>{setPickerSearch("");setInstView("coin-picker")}}>
        <CoinLogo symbol={asset} size={20}/>
        <span>{selected.fa}</span>
        <small>{asset}</small>
        <em>⌄</em>
      </button>
      <span className="pair-sep">/</span>
      <div className="instant-quote-tabs">
        <button className={quote==="TMN"?"active":""} onClick={()=>switchQuote("TMN")}>تومان</button>
        <button className={quote==="USDT"&&asset!=="USDT"?"active":""} disabled={asset==="USDT"} onClick={()=>switchQuote("USDT")}>USDT</button>
      </div>
    </div>

    <div className="instant-tabs">
      <button className={side==="buy"?"active buy":""} onClick={()=>{setSide("buy");setAmount("")}}>خرید</button>
      <button className={side==="sell"?"active sell":""} onClick={()=>{setSide("sell");setAmount("")}}>فروش</button>
    </div>

    {/* Payment card */}
    <section className="instant-card">
      <span className="instant-label">{side==="buy"?"پرداخت می‌کنم":"می‌فروشم"}</span>
      {side==="buy"
        ? <><div className="instant-input">{quote==="TMN"?<img src={TMN_FLAG_LOGO} width={31} height={31} style={{borderRadius:"50%",flexShrink:0}} alt="تومان"/>:<CoinLogo symbol="USDT" size={20}/>}<input value={quote==="TMN"?(instantTomanNum?fa(instantTomanNum):""):toFaDigits(amount)} onChange={e=>setAmount(toLatinDigits(e.target.value).replace(/[^0-9.]/g,""))} placeholder="مبلغ را وارد کنید" inputMode="decimal" dir="ltr"/><b>{quoteLabel}</b></div>{instantTomanNum>0&&<div className="amount-words" style={{marginTop:4,marginRight:2}}>{numToFaWords(instantTomanNum)} تومان</div>}</>
        : <div className="instant-input"><CoinLogo symbol={asset} size={22}/><input value={toFaDigits(amount)} onChange={e=>setAmount(toLatinDigits(e.target.value).replace(/[^0-9.]/g,""))} placeholder={`مقدار ${asset} را وارد کنید`} inputMode="decimal" dir="ltr"/><b>{asset}</b></div>}
      {side==="sell"&&rawAmt>0&&<div style={{fontSize:12,color:"#8facba",textAlign:"right",marginTop:2,paddingRight:4}}>{fmtQ(quoteSpent)} {quoteLabel}</div>}
      <small>موجودی قابل استفاده: {avStr}</small>
      <div className="percent-row">{[25,50,75,100].map(p=><button key={p} onClick={()=>usePercent(p)}>{toFaDigits(String(p))}٪</button>)}</div>
    </section>

    {/* Receive card */}
    <section className="instant-card receive">
      <span className="instant-label">دریافت می‌کنم</span>
      {side==="buy"
        ? <><button className="asset-select" onClick={()=>{setPickerSearch("");setInstView("coin-picker")}}><span><CoinLogo symbol={asset} size={26}/><b>{selected.fa}</b><small>{asset}</small></span><span>⌄</span></button><output>{faFixed(baseUnits,6)} {asset}</output></>
        : <><div className="instant-input readonly">{quote==="TMN"?<img src={TMN_FLAG_LOGO} width={31} height={31} style={{borderRadius:"50%",flexShrink:0}} alt="تومان"/>:<CoinLogo symbol="USDT" size={20}/>}<b>{fmtQ(quoteSpent-fee||0)}</b><span>{quoteLabel}</span></div></>}
    </section>

    <section className="instant-market">
      <div><span>قیمت لحظه‌ای</span><b>{fmtQ(priceInQuote)} {quoteLabel}</b></div>
      <span className="pair-label">{asset} / {quote}</span>
    </section>
    <section className="instant-fee"><span>کارمزد <b>۰٫۳۰٪</b></span><b>{fmtQ(fee)} {quoteLabel}</b></section>

    {error&&<div style={{margin:"0 0 12px",padding:"14px 16px",borderRadius:12,background:"rgba(232,92,92,0.1)",border:"1px solid rgba(232,92,92,0.3)",display:"flex",alignItems:"center",gap:10,direction:"rtl"}}><span style={{flex:1,fontSize:13,color:"#e85c5c",fontWeight:600}}>{error}</span><button onClick={()=>setError("")} style={{width:24,height:24,borderRadius:8,background:"rgba(232,92,92,0.15)",border:"none",color:"#e85c5c",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:12}}>✕</button></div>}
    <button className={`instant-submit ${side}`} onClick={place}>{side==="buy"?"خرید":"فروش"} {asset}</button>

    {processing&&<AnPardazLoadingOverlay text="در حال انجام معامله آنی..."/>}
    {result&&<TransactionReceipt data={result} onClose={()=>setResult(null)}/>}
  </div>;
}

function ExchangeChartPage({asset,coin,coins,user,favorites,onToggleFavorite,onBack,onInstant,onUpdate,onPairSelect}:{asset:string;coin:(typeof EX_COINS)[number];coins:typeof EX_COINS;user:UserData;favorites:string[];onToggleFavorite:(symbol:string)=>void;onBack:()=>void;onInstant:(asset:string)=>void;onUpdate:(u:UserData,tx:TxRecord)=>void;onPairSelect:(asset:string)=>void}){const tvTheme=localStorage.getItem("anp_theme")==="light"?"light":"dark";return <div className="chart-trade-page"><header className="protrade-head"><button className="back-btn" onClick={onBack}><Icon name="arrow" size={18}/></button><div className="ps-info"><div className="ps-pair-row"><b>{asset} / TMN</b></div><div className="ps-price-row"><span className="ps-price">{coin.price>0?fa(Math.round(coin.price)):"—"} <small>تومان</small></span><em>{Number.isFinite(coin.change)?(coin.change>=0?"+":"")+faFixed(coin.change,2)+"٪":"—"}</em></div></div><button className={favorites.includes(asset)?"pair-favorite active":"pair-favorite"} onClick={()=>onToggleFavorite(asset)}>{favorites.includes(asset)?"★":"☆"}</button></header><div className="tv-chart-frame"><iframe title={asset+" chart"} src={"https://www.tradingview.com/widgetembed/?symbol=BINANCE%3A"+asset+"USDT&interval=60&hidesidetoolbar=0&theme="+tvTheme+"&style=1&timezone=Asia%2FTehran&withdateranges=1"}/></div><div className="chart-about"><b>{coin.fa}</b><p>قیمت بازار از Backend آن صراف دریافت می‌شود؛ نمودار خارجی فقط نمایش تصویری بازار است.</p><p>دفتر سفارش و سفارش‌گذاری این صفحه داده ساختگی ندارد و از بخش معامله واقعی استفاده می‌کند.</p></div><button className="primary-button" onClick={()=>onInstant(asset)}>خرید و فروش آنی</button></div>}
function MarginChartPage({asset,coin,onBack,coins,user,favorites,onToggleFavorite,onUpdate,onAssetChange}:{asset:string;coin:(typeof EX_COINS)[number];onBack:()=>void;coins?:typeof EX_COINS;user?:UserData;favorites?:string[];onToggleFavorite?:(s:string)=>void;onUpdate?:(u:UserData,tx:TxRecord)=>void;onAssetChange?:(s:string)=>void}){return <div className="chart-trade-page"><header className="protrade-head"><button className="back-btn" onClick={onBack}><Icon name="arrow" size={18}/></button><div className="ps-info"><b>{asset} / TMN</b><div className="ps-price-row"><span className="ps-price">{coin.price>0?fa(Math.round(coin.price)):"—"} <small>تومان</small></span></div></div></header><div className="warning-box" style={{margin:16}}>داده و اجرای معامله تعهدی تا اتصال کامل موتور واقعی Backend غیرفعال است. هیچ دفتر سفارش، قیمت، P&amp;L یا موقعیت ساختگی نمایش داده نمی‌شود.</div></div>}
function ExchangeProTrade({mode,initialAsset,user,coins,onBack,onUpdate,onNavigate,onAssetChange,favorites,onToggleFavorite}:{mode:"spot"|"margin";initialAsset:string;user:UserData;coins:typeof EX_COINS;onBack:()=>void;onUpdate:(u:UserData,tx:TxRecord)=>void;onNavigate:(target:"instant",asset:string)=>void;onAssetChange:(asset:string)=>void;favorites:string[];onToggleFavorite:(symbol:string)=>void}){
  const [asset,setAsset]=useState(initialAsset),[side,setSide]=useState<"buy"|"sell">("buy"),[orderType,setOrderType]=useState<"بازار"|"قیمت ثابت">("بازار"),[amount,setAmount]=useState(""),[priceInput,setPriceInput]=useState(""),[processing,setProcessing]=useState(false),[message,setMessage]=useState(""),[bids,setBids]=useState<any[]>([]),[asks,setAsks]=useState<any[]>([]),[liveWallets,setLiveWallets]=useState<Record<string,number>>({});
  const coin=coins.find(c=>c.symbol===asset)??coins[0]; const livePrice=Number(coin?.price??0),limitPrice=Number(priceInput)||0,executionPrice=orderType==="قیمت ثابت"?limitPrice:livePrice,qty=Number(amount)||0,total=qty*executionPrice,fee=total*0.003; const baseBalance=Number(liveWallets[String(asset).toUpperCase()]??0),tomanBalance=Number(liveWallets.TMN??0),favorite=favorites.includes(asset);
  useEffect(()=>{let active=true;const load=async()=>{try{const [w,b]=await Promise.all([sarrafWalletMap(),sarrafOrderBook(asset+"/TMN")]);if(!active)return;setLiveWallets(w);setBids(b.bids.map((x:any)=>Array.isArray(x)?{price:Number(x[0]),amount:Number(x[1])}:{price:Number(x.price),amount:Number(x.amount)}).filter((x:any)=>x.price>0&&x.amount>0));setAsks(b.asks.map((x:any)=>Array.isArray(x)?{price:Number(x[0]),amount:Number(x[1])}:{price:Number(x.price),amount:Number(x.amount)}).filter((x:any)=>x.price>0&&x.amount>0));}catch{if(active){setBids([]);setAsks([]);setLiveWallets({});}}};void load();const id=window.setInterval(()=>void load(),3000);return()=>{active=false;clearInterval(id)}},[asset]);
  const submit=async()=>{setMessage("");if(mode==="margin"){setMessage("معامله تعهدی هنوز API اجرایی واقعی در Backend ندارد؛ برای جلوگیری از نمایش یا ثبت داده ساختگی غیرفعال است.");return;}if(!qty||qty<=0){setMessage("مقدار سفارش را وارد کنید.");return;}if(orderType==="قیمت ثابت"&&(!limitPrice||limitPrice<=0)){setMessage("قیمت سفارش را وارد کنید.");return;}if(!livePrice||livePrice<=0){setMessage("قیمت لحظه‌ای این بازار در دسترس نیست.");return;}if(side==="buy"&&orderType==="بازار"&&total+fee>tomanBalance){setMessage("موجودی تومان کافی نیست.");return;}if(side==="sell"&&qty>baseBalance){setMessage("موجودی "+asset+" کافی نیست.");return;}setProcessing(true);try{const result=await sarrafPlaceOrder(asset,"TMN",side,orderType==="بازار"?"market":"limit",qty,orderType==="قیمت ثابت"?limitPrice:undefined,side==="buy"?total:undefined);setMessage("سفارش واقعی ثبت شد؛ شناسه: "+String(result?.order?.id??result?.orderId??"—"));setAmount("");setPriceInput("");setLiveWallets(await sarrafWalletMap());}catch(e){setMessage(e instanceof Error?e.message:"ثبت سفارش انجام نشد.");}finally{setProcessing(false);}};
  const fmtBook=(v:number)=>v>0?fa(Math.round(v)):"—";
  return <div className="terminal-page"><header className="terminal-header"><button className="back-btn" onClick={onBack}><Icon name="arrow" size={17}/></button><button className="pair-selector" onClick={()=>onAssetChange(asset)}><PairLogos base={asset} quote="TMN" baseSize={26} quoteSize={15}/><div className="ps-info"><div className="ps-pair-row"><b>{asset} / TMN</b></div><div className="ps-price-row"><span className="ps-price">{livePrice>0?fmtBook(livePrice):"—"} <small>تومان</small></span><em>{Number.isFinite(coin.change)?(coin.change>=0?"+":"")+faFixed(coin.change,2)+"٪":"—"}</em></div></div></button><button className={favorite?"pair-favorite active":"pair-favorite"} onClick={()=>onToggleFavorite(asset)}>{favorite?"★":"☆"}</button></header><div className="terminal-status"><span>قیمت زنده: {livePrice>0?fmtBook(livePrice)+" تومان":"—"}</span><span>دفتر سفارش: {bids.length||asks.length?"زنده":"در دسترس نیست"}</span><b>{mode==="margin"?"● تعهدی غیرفعال":"● اتصال Backend"}</b></div><main className="terminal-grid"><section className="terminal-book"><h2>دفتر سفارش</h2><div className="book-head"><span>قیمت</span><span>مقدار</span><span>مجموع</span></div>{asks.length?<div className="book-sells"><b>فروشندگان</b>{asks.slice(0,7).map((l:any,i:number)=><p key={i}><span>{fmtBook(l.price)}</span><span>{faFixed(l.amount,6)}</span><span>{fmtBook(l.price*l.amount)}</span></p>)}</div>:<div className="empty-orders">داده واقعی فروشندگان در دسترس نیست.</div>}<div className="book-mid"><b>{livePrice>0?fmtBook(livePrice):"—"}</b></div>{bids.length?<div className="book-buys"><b>خریداران</b>{bids.slice(0,7).map((l:any,i:number)=><p key={i}><span>{fmtBook(l.price)}</span><span>{faFixed(l.amount,6)}</span><span>{fmtBook(l.price*l.amount)}</span></p>)}</div>:<div className="empty-orders">داده واقعی خریداران در دسترس نیست.</div>}</section><section className="terminal-form"><div className="terminal-tabs"><button className={side==="buy"?"active buy":""} onClick={()=>setSide("buy")}>خرید</button><button className={side==="sell"?"active sell":""} onClick={()=>setSide("sell")}>فروش</button></div>{mode==="margin"&&<div className="warning-box">معامله تعهدی تا ایجاد API اجرایی واقعی Backend غیرفعال است.</div>}<div className="terminal-order-types"><button className={orderType==="قیمت ثابت"?"active":""} onClick={()=>setOrderType("قیمت ثابت")}>قیمت ثابت</button><button className={orderType==="بازار"?"active":""} onClick={()=>setOrderType("بازار")}>بازار</button></div>{orderType==="قیمت ثابت"&&<label>قیمت سفارش<input value={toFaDigits(priceInput)} onChange={e=>setPriceInput(toLatinDigits(e.target.value).replace(/[^0-9.]/g,""))} placeholder={livePrice>0?fa(Math.round(livePrice)):"—"}/></label>}<label>مقدار {asset}<input value={toFaDigits(amount)} onChange={e=>setAmount(toLatinDigits(e.target.value).replace(/[^0-9.]/g,""))} placeholder="مقدار واقعی سفارش"/></label><label>مجموع<input readOnly value={executionPrice>0&&qty>0?fa(Math.round(total)):"—"}/></label><small>موجودی واقعی: {side==="buy"?fa(tomanBalance)+" تومان":faFixed(baseBalance,8)+" "+asset}</small>{message&&<div className="warning-box">{message}</div>}<button className={"terminal-submit "+(side==="buy"?"buy":"sell")} onClick={submit} disabled={processing||mode==="margin"}>{processing?"در حال ثبت…":mode==="margin"?"تعهدی فعلاً غیرفعال":"ثبت سفارش واقعی"}</button></section></main><section className="recent-trades"><h2>آخرین معاملات</h2><div className="empty-orders">تا اتصال feed معاملات واقعی، معامله ساختگی نمایش داده نمی‌شود.</div></section></div>;
}
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
  useEffect(()=>{let active=true;const load=async()=>{try{const r=await fetch(`${ANSARRAF_API_BASE}/api/v1/market-data/quotes`,{signal:AbortSignal.timeout(7000),cache:"no-store"});if(!r.ok)throw new Error("market_data_unavailable");const d=await r.json();const quotes=Array.isArray(d?.quotes)?d.quotes:[];const live=quotes.filter((q:any)=>q.provider==="wallex"&&!q.stale&&Number(q.lastPrice)>0);const bySymbol=new Map<string,any>();for(const q of live)bySymbol.set(q.symbol,q);const tomanRate=Number(bySymbol.get("USDT/TOMAN")?.lastPrice||0);if(active&&tomanRate>0&&_viewRef.current!=="withdraw-confirm"){setCoins(previous=>previous.map(c=>{if(c.symbol==="USDT")return {...c,price:tomanRate};const usdt=bySymbol.get(`${c.symbol}/USDT`);const toman=bySymbol.get(`${c.symbol}/TOMAN`);const price=toman?Number(toman.lastPrice):(usdt?tomanRate*Number(usdt.lastPrice):0);return {...c,price,change:Number.isFinite(Number(usdt?.change24h))?Number(usdt.change24h):c.change,volume:usdt?.volume24h??(c as any).volume};}));setMarketUpdated(new Date());}}catch{/* keep the last verified backend quote; never synthesize a mock price */}};void load();const id=window.setInterval(()=>void load(),5000);return()=>{active=false;window.clearInterval(id)}},[]);
  useEffect(()=>{let active=true;const loadWallets=async()=>{try{const wallet=await sarrafWalletMap();if(active)setLiveWallets(wallet);}catch{if(active)setLiveWallets({});}};void loadWallets();const id=window.setInterval(()=>void loadWallets(),5000);return()=>{active=false;window.clearInterval(id)}},[]);
  const coin=coins.find(c=>c.symbol===asset)??coins[0]; const available=Number(liveWallets[String(asset).toUpperCase()]??0);
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
    const text=[`آن‌پرداز — ${title}`,`وضعیت: ${statusLabel[tx.status]}`,amountDisplay?`مبلغ: ${amountDisplay}`:"",`زمان: ${timeStr}`,`شناسه: ${tx.id}`,...(tx.toAddress?[`مقصد: ${tx.toAddress}`]:[]),...(noteDisplay?[`جزئیات: ${noteDisplay}`]:[])].filter(Boolean).join("
");
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
    const text=[`آن‌پرداز — ${title}`,`وضعیت: ${statusLabel[tx.status]}`,amountDisplay?`مبلغ: ${amountDisplay}`:"",`تاریخ: ${timeStr}`,`شناسه: ${tx.id}`,...(tx.toAddress?[`مقصد: ${tx.toAddress}`]:[])].filter(Boolean).join("
");
    navigator.share?navigator.share({title:"رسید آن‌پرداز",text}).catch(()=>{}):navigator.clipboard?.writeText(text).catch(()=>{});
  };
  const handleCopy=()=>{
    const rateNote=isExchange&&tx.note?.includes("نرخ")?tx.note.split(" · ").find(p=>p.startsWith("نرخ"))||"":null;
    const lines=["رسید تراکنش","─────────────────",`نوع تراکنش: ${title}`,...(amountDisplay?[`مبلغ: ${toFaDigits(amountDisplay)}`]:[]),...(tx.convertedAmount!=null?[`معادل: ${tx.toAsset==="usdt"?faFixed(tx.convertedAmount,2):fa(Math.round(tx.convertedAmount))} ${tx.toAsset==="toman"?"ریال":"دلار تتر"}`]:[]),...(rateNote?[rateNote]:[]),`وضعیت: ${statusLabel[tx.status]||tx.status}`,`تاریخ و ساعت: ${timeStr}`,`شناسه تراکنش: ${tx.id}`,...(tx.fee>0?[`کارمزد: ${faFixed(tx.fee,2)} دلار تتر`]:[]),...(tx.toAddress?[`مقصد: ${tx.toAddress}`]:[]),...(noteDisplay?[`توضیحات: ${noteDisplay}`]:[]),"─────────────────","آن پرداز پیشرو در خدمات بانکی و دارایی های دیجیتال"];
    navigator.clipboard?.writeText(lines.join("
")).then(()=>{setCopyDone(true);setToast("رسید کپی شد");setTimeout(()=>{setToast("");setCopyDone(false);},2000);}).catch(()=>{});
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
  const [pinCurrent,setPinCurrent]=useState("");
  const [pinError,setPinError]=useState("");
  const [pinEnabled,setPinEnabled]=useState(false);
  const [verifiedProfile,setVerifiedProfile]=useState<{fullName:string;nationalId:string;mobile:string;birthDate:string|null;verifiedAt:string|null}|null>(null);
  const [deletingCard,setDeletingCard]=useState<string|null>(null);
  const handlePinOpen=(mode:"enable"|"change"|"disable")=>{setPinModal(mode);setPinStep(mode==="enable"?"enter-new":"enter-current");setPinInput("");setPinNew("");setPinCurrent("");setPinError("");};
  const handlePinDigit=(d:string)=>{if(pinInput.length<4)setPinInput(p=>{const next=p+d;
    if(next.length===4){
      setTimeout(async()=>{
        if(pinModal==="enable"){
          if(pinStep==="enter-new"){setPinNew(next);setPinStep("confirm-new");setPinInput("");}
          else if(pinStep==="confirm-new"){
            if(next===pinNew){
              try{await userSettingsRequest("/api/v1/user/settings/pin/enable",{method:"POST",body:JSON.stringify({newPin:pinNew})});setPinEnabled(true);setPinModal(null);}
              catch{setPinError("ذخیره رمز انجام نشد. دوباره تلاش کنید.");setPinInput("");}
            }else{setPinError("رمزها یکسان نیستند. دوباره امتحان کن.");setPinStep("enter-new");setPinNew("");setPinInput("");}
          }
        }else if(pinModal==="change"){
          if(pinStep==="enter-current"){setPinCurrent(next);setPinStep("enter-new");setPinInput("");setPinError("");}
          else if(pinStep==="enter-new"){setPinNew(next);setPinStep("confirm-new");setPinInput("");}
          else if(pinStep==="confirm-new"){
            if(next===pinNew){
              try{await userSettingsRequest("/api/v1/user/settings/pin/change",{method:"POST",body:JSON.stringify({currentPin:pinCurrent,newPin:pinNew})});setPinEnabled(true);setPinModal(null);}
              catch{setPinError("رمز فعلی یا رمز جدید معتبر نیست.");setPinInput("");}
            }else{setPinError("رمزها یکسان نیستند.");setPinStep("enter-new");setPinNew("");setPinInput("");}
          }
        }else if(pinModal==="disable"){
          try{await userSettingsRequest("/api/v1/user/settings/pin/disable",{method:"POST",body:JSON.stringify({currentPin:next})});setPinEnabled(false);setPinModal(null);}
          catch{setPinError("رمز فعلی نادرست است یا غیرفعال‌سازی انجام نشد.");setPinInput("");}
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
  const persistSettings=async(patch:Partial<UserSettings>)=>{
    try{await userSettingsRequest("/api/v1/user/settings",{method:"PATCH",body:JSON.stringify(patch)});}
    catch{setPinError("ذخیره تنظیمات انجام نشد. اتصال سرور را بررسی کنید.");}
  };
  useEffect(()=>{
    let active=true;
    const load=async()=>{
      try{
        const {settings}=await userSettingsRequest("/api/v1/user/settings");
        if(!active||!settings)return;
        setNotifications(settings.notificationsEnabled);
        setKeySoundEnabled(settings.keySoundEnabled);
        setFontScaleState(settings.fontScale);
        setPinEnabled(settings.pinEnabled);
        try{const k=await ansarrafVerifiedProfile();if(active)setVerifiedProfile(k?.verified&&k?.profile?k.profile:null);}catch{if(active)setVerifiedProfile(null);}
        localStorage.setItem(`anp_notifications_${user.uid}`,settings.notificationsEnabled?"on":"off");
        localStorage.setItem("anp_key_sound",settings.keySoundEnabled?"on":"off");
        localStorage.setItem("anp_font_scale",String(settings.fontScale));
        const root=document.getElementById("root");
        if(root)root.style.zoom=settings.fontScale===0?"":String(1+settings.fontScale*0.07);
      }catch{}
    };
    void load();
    return()=>{active=false};
  },[user.uid]);
  const toggleNotifications=()=>setNotifications(v=>{const next=!v;localStorage.setItem(`anp_notifications_${user.uid}`,next?"on":"off");if(next)playChime();void persistSettings({notificationsEnabled:next});return next});
  const loadFinancialNotifications=useCallback(async()=>{
    try{const r=await financialApi.notifications();setFinancialNotifications(r.notifications??[]);setFinancialUnread(Number(r.unreadCount??0));}catch{}
  },[]);
  useEffect(()=>{void loadFinancialNotifications();const t=window.setInterval(()=>void loadFinancialNotifications(),60000);return()=>window.clearInterval(t)},[loadFinancialNotifications,user.uid]);
  const openFinancialNotifications=async()=>{setShowFinancialNotifications(true);await loadFinancialNotifications();};
  const readFinancialNotification=async(id:number)=>{try{await financialApi.readNotification(id);setFinancialNotifications(xs=>xs.map(x=>x.id===id?{...x,read_at:new Date().toISOString()}:x));setFinancialUnread(n=>Math.max(0,n-1));}catch{}};

  const toggleKeySound=()=>setKeySoundEnabled(v=>{const next=!v;localStorage.setItem("anp_key_sound",next?"on":"off");void persistSettings({keySoundEnabled:next});return next});
  const setFontScale=(n:number)=>{setFontScaleState(n);localStorage.setItem("anp_font_scale",String(n));const root=document.getElementById("root");if(root)root.style.zoom=n===0?"":String(1+n*0.07);void persistSettings({fontScale:n});};
  const initials=(user.name?.[0]??"")+(user.family?.[0]??"")||"؟";

  if(modal==="info")return <div className="anp-full-page" dir="rtl"><div className="anp-page-header"><button className="back-btn" onClick={()=>setModal(null)}><Icon name="arrow" size={20}/></button><h2 className="subscreen-title">اطلاعات شخصی</h2><div style={{width:36}}/></div><div className="anp-page-body">{[["نام",verifiedProfile?.fullName?.split(" ").slice(0,-1).join(" ")||"—"],["نام خانوادگی",verifiedProfile?.fullName?.split(" ").slice(-1).join(" ")||"—"],["کد ملی",verifiedProfile?.nationalId?toFaDigits(verifiedProfile.nationalId):"—"],["تاریخ تولد",verifiedProfile?.birthDate?toFaDigits(verifiedProfile.birthDate):"—"],["موبایل",verifiedProfile?.mobile?toFaDigits(verifiedProfile.mobile):"—"],["عضویت",user.registeredAt?new Date(user.registeredAt).toLocaleDateString("fa-IR"):"—"]].map(([k,v])=><div key={k} className="modal-detail"><span>{k}</span><b dir="ltr">{v}</b></div>)}{!verifiedProfile&&<p style={{fontSize:12,color:"var(--text-muted)",lineHeight:1.8,textAlign:"center",marginTop:14}}>اطلاعات هویتی پس از تکمیل و تأیید احراز هویت آن صراف در این بخش نمایش داده می‌شود.</p>}<button className="primary-button" style={{marginTop:20}} onClick={()=>setModal(null)}>بازگشت</button></div></div>;

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
<div style={{padding:"16px 0",borderBottom:"1px solid var(--border-lighter)"}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><div style={{width:40,height:40,borderRadius:12,background:"rgba(0,214,176,0.12)",display:"flex",alignItems:"center",justifyContent:"center",color:"#00D6B0"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>رمز ۴ رقمی</div><div style={{fontSize:11,color:"var(--text-muted)"}}>{pinEnabled?"فعال — کد امنیتی ورود":"غیرفعال"}</div></div></div>{pinEnabled?<div style={{display:"flex",gap:8}}><button onClick={()=>handlePinOpen("change")} style={{flex:1,padding:"10px",borderRadius:12,background:"rgba(0,214,176,0.08)",border:"1.5px solid rgba(0,214,176,0.3)",color:"#00D6B0",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Vazirmatn"}}>تغییر رمز</button><button onClick={()=>handlePinOpen("disable")} style={{flex:1,padding:"10px",borderRadius:12,background:"rgba(239,68,68,0.08)",border:"1.5px solid rgba(239,68,68,0.3)",color:"#ef4444",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Vazirmatn"}}>غیرفعال کردن</button></div>:<button onClick={()=>handlePinOpen("enable")} style={{width:"100%",padding:"11px",borderRadius:12,background:"rgba(0,214,176,0.08)",border:"1.5px solid rgba(0,214,176,0.3)",color:"#00D6B0",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Vazirmatn"}}>فعال‌سازی رمز ۴ رقمی</button>}</div>
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
        <div style={{fontSize:12,color:verifiedProfile?"#00D6B0":"var(--text-muted)",display:"flex",alignItems:"center",gap:4,marginTop:4}}>{verifiedProfile?<><Icon name="check" size={12}/>احراز هویت شده</>:<>احراز هویت نشده</>}</div>
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
function ShaparkCardModal({onClose,onRegistered}:{onClose:()=>void;onRegistered?:()=>void}){
  const [busy,setBusy]=useState(false);
  const [sessionId,setSessionId]=useState("");
  const [status,setStatus]=useState<"idle"|"pending"|"verified"|"rejected"|"error">("idle");
  const [message,setMessage]=useState("");
  const timer=useRef<ReturnType<typeof setInterval>|null>(null);
  useBackHandler(onClose);
  useEffect(()=>()=>{if(timer.current)clearInterval(timer.current)},[]);
  const poll=(id:string)=>{
    if(timer.current)clearInterval(timer.current);
    timer.current=setInterval(async()=>{
      try{
        const d=await shaparakRegistrationStatus(id);const st=String(d?.registration?.status??"pending");
        if(st==="verified"||st==="rejected"||st==="expired"||st==="cancelled"||st==="error"){
          if(timer.current)clearInterval(timer.current);
          if(st==="verified"){setStatus("verified");setMessage("کارت با تأیید شاپرک به‌صورت خودکار در آن‌پرداز ثبت شد.");localStorage.removeItem("anp:shaparak:registrationSession");window.dispatchEvent(new Event("anp-cards-updated"));onRegistered?.();}
          else {setStatus(st==="rejected"?"rejected":"error");setMessage(st==="rejected"?"ثبت کارت توسط سرویس تأیید نشد.":"فرایند ثبت کارت کامل نشد.");}
        }
      }catch{}
    },2000);
  };
  const start=async()=>{
    setBusy(true);setMessage("");
    try{
      const r=await startShaparakCardRegistration();setSessionId(r.sessionId);localStorage.setItem("anp:shaparak:registrationSession",r.sessionId);setStatus("pending");poll(r.sessionId);
      window.location.href=r.authorizationUrl;
    }catch(e){setStatus("error");setMessage(e instanceof Error?e.message:"اتصال به فرایند ثبت کارت برقرار نشد.");}
    finally{setBusy(false)}
  };
  return <div className="anp-full-page" dir="rtl">
    <div className="anp-page-header"><button className="back-btn" onClick={onClose}><Icon name="arrow" size={20}/></button><h2 className="subscreen-title">افزودن کارت بانکی</h2><div style={{width:36}}/></div>
    <div className="anp-page-body">
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{width:72,height:72,borderRadius:20,background:"rgba(0,214,176,0.12)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}><Icon name="credit" size={32} stroke={1.5}/></div>
        <h3 style={{margin:0,fontSize:19,fontWeight:800,color:"var(--text-primary)"}}>ثبت کارت بانکی</h3>
      </div>
      <p style={{fontSize:13,color:"var(--text-muted)",textAlign:"right",lineHeight:2,marginBottom:24}}>برای امنیت، ثبت کارت از مسیر تأیید مالکیت کارت انجام می‌شود. شماره کامل کارت در آن‌پرداز ذخیره نمی‌شود؛ پس از تأیید، فقط اطلاعات لازم و شناسه امن کارت نگهداری خواهد شد.</p>
      {message&&<div style={{padding:12,borderRadius:12,background:status==="verified"?"rgba(0,214,176,.1)":"rgba(239,68,68,.08)",color:status==="verified"?"#00D6B0":"#fca5a5",fontSize:12,lineHeight:1.8,marginBottom:12}}>{message}</div>}
      {sessionId&&<div style={{fontSize:10,color:"var(--text-faint)",marginBottom:12}}>شناسه پیگیری: <span dir="ltr">{sessionId}</span></div>}
      {status!=="verified"&&<button className="primary-button" style={{width:"100%",marginBottom:10}} onClick={start} disabled={busy}>{busy?"در حال آماده‌سازی…":"ادامه و ثبت کارت"}</button>}
      <button className="outline-button" style={{width:"100%"}} onClick={onClose}>{status==="verified"?"بستن":"انصراف"}</button>
    </div>
  </div>;
}

// ─── FinField
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
    anpardazCardBalance(activeRaw,toLatinDigits(otp),toLatinDigits(cvv2),toLatinDigits(expM),toLatinDigits(expY)).then((result)=>{
      const check=result?.check;const status=String(check?.status??"processing");const balance=check?.balance;
      resetSensitive();setProcessing(false);
      setReceipt({title:status==="completed"?"موجودی کارت":status==="failed"?"استعلام موجودی ناموفق بود":"استعلام موجودی در حال پردازش است",amount:balance!=null?`${fa(balance)} ریال`:undefined,destination:toFaDigits(fmtCard(activeRaw)),status:status==="completed"?"success":status==="failed"?"failed":"pending",detail:balance!=null?"موجودی واقعی از سرویس بانکی دریافت شد.":"وضعیت استعلام از سرویس بانکی ثبت شد."});
    }).catch((e)=>{setProcessing(false);setErr(e instanceof Error?e.message:"استعلام موجودی انجام نشد")});
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
  {id:"cheque-seyadi",label:"چک صیادی",icon:"file-text",color:"#0891B2",bg:"rgba(8,145,178,0.12)",action:"sayad"},
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

interface AnProduct{id:string;title:string;brand:string;catId:string;subId:string;img:string;specs:Record<string,string>;priceMin:number;priceMax:number;storeCount:number;desc:string;tags:string[];rating:number;reviews:number;ph:{d:string;p:number}[];media?:string[];}
interface AnOffer{sid:string;price:number;ship:string;warranty:string;inStock:boolean;upd:string;storeName?:string;offerId?:number;productUrl?:string;iframeMode?:"allowed"|"blocked"|"unknown";}
interface CompareState{active:boolean;selectedIds:string[];minimized:boolean;}
let MARKET_PRODUCTS:AnProduct[]=[];
function anSearch(q:string):AnProduct[]{
  const lq=q.toLowerCase().replace(/‌/g," ").replace(/\s+/g," ");
  return MARKET_PRODUCTS.filter(p=>{
    const text=(p.title+" "+p.brand+" "+p.tags.join(" ")+" "+p.desc).toLowerCase();
    return lq.split(" ").some(w=>w.length>1&&text.includes(w));
  });
}
function getAnCatProds(catId:string,limit=20):AnProduct[]{
  return MARKET_PRODUCTS.filter(p=>p.catId===catId).slice(0,limit);
}
function sortOffers(offers:AnOffer[],mode:"price"|"rating"|"avail"):AnOffer[]{
  const s=[...offers];
  if(mode==="price")s.sort((a,b)=>a.price-b.price);
  else if(mode==="rating")s.sort((a,b)=>0);
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
  const deals=MARKET_PRODUCTS.filter(p=>p.ph.length>1&&p.ph[p.ph.length-1].p<p.ph[0].p);
  const topRated=[...MARKET_PRODUCTS].sort((a,b)=>b.rating-a.rating).slice(0,30);
  const mostCompared=[...MARKET_PRODUCTS].sort((a,b)=>b.storeCount-a.storeCount).slice(0,30);
  const budget=MARKET_PRODUCTS.filter(p=>p.priceMin<15000000).slice(0,30);
  const highValue=[...MARKET_PRODUCTS].sort((a,b)=>b.reviews-a.reviews).slice(0,30);
  const mostReviewed=[...MARKET_PRODUCTS].sort((a,b)=>b.reviews-a.reviews).slice(5,35);

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

  const sendMsg=async()=>{
    const txt=input.trim();if(!txt||thinking)return;
    const uid=Date.now().toString();setMsgs(p=>[...p,{id:uid,role:"user",text:txt}]);setInput("");setThinking(true);setLastQ(txt);scrollToBottom();
    try{
      const token=localStorage.getItem("anpardaz:accessToken")??"";
      const r=await fetch(ANMARKET_PLATFORM_API_BASE+"/api/v1/market/ai/assist",{method:"POST",headers:{authorization:"Bearer "+token,"content-type":"application/json"},body:JSON.stringify({input:txt})});
      const d=await r.json();if(!r.ok)throw new Error(d?.error??"ai_unavailable");
      const text=d?.result?.text??d?.result?.output??d?.result?.content??"پاسخ هوش مصنوعی دریافت نشد.";
      const found=anSearch(txt).slice(0,30);setResults(found);
      setMsgs(p=>[...p,{id:(Date.now()+1).toString(),role:"ai",text:String(text)}]);setShowResults(found.length>0);
    }catch{setMsgs(p=>[...p,{id:(Date.now()+1).toString(),role:"ai",text:"دستیار هوشمند در حال حاضر در دسترس نیست."}]);setShowResults(false)}
    finally{setThinking(false);scrollToBottom()}
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
    setThinking(false);
    setMsgs(p=>[...p,{id:(Date.now()+1).toString(),role:"ai",text:"جستجوی تصویری هنوز به سرویس پردازش تصویر متصل نشده است. برای جلوگیری از پاسخ ساختگی، فعلاً توضیح متنی محصول را وارد کنید."}]);
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
    let r=rawResults.length>0?rawResults:MARKET_PRODUCTS.slice(0,30);
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
  const p=MARKET_PRODUCTS.find(x=>x.id===pid);
  const [remoteOffers,setRemoteOffers]=useState<AnOffer[]>([]);
  useEffect(()=>{(async()=>{try{const base=ANMARKET_PLATFORM_API_BASE;const r=await fetch(base+"/api/v1/market/products/"+encodeURIComponent(pid));if(!r.ok)return;const d=await r.json();setRemoteOffers((d.offers??[]).map((o:any)=>({sid:String(o.store_id??o.id),offerId:Number(o.id),storeName:o.store_name??o.seller_name??"فروشگاه",price:Number(o.price??0),ship:o.shipping_cost?String(o.shipping_cost):"",warranty:"",inStock:o.availability!=="out_of_stock",upd:o.updated_at??"",productUrl:o.product_url??o.seller_url??"",iframeMode:o.iframe_mode??"unknown"})));}catch{}})()},[pid]);
  const [tab,setTab]=useState<"sellers"|"specs"|"reviews"|"similar">("sellers");
  const [alert,setAlert]=useState(false);
  const [fav,setFav]=useState(false);
  const [sellerSort,setSellerSort]=useState<"price"|"rating"|"avail">("price");
  const [imgIdx,setImgIdx]=useState(0);
  const [showZoom,setShowZoom]=useState(false);
  const [aiInput,setAiInput]=useState("");
  const offers=remoteOffers;
  useBackHandler(onBack);
  useEffect(()=>{let active=true;(async()=>{try{const token=localStorage.getItem("anpardaz:accessToken")??"";const favRes=await fetch(ANMARKET_PLATFORM_API_BASE+"/api/v1/market/me/favorites",{headers:{authorization:"Bearer "+token}});void fetch(ANMARKET_PLATFORM_API_BASE+"/api/v1/market/products/"+encodeURIComponent(pid)+"/view",{method:"POST",headers:{authorization:"Bearer "+token,"content-type":"application/json"},body:JSON.stringify({surface:"mobile"})});if(active&&favRes.ok){const d=await favRes.json();setFav((d.products??[]).some((x:any)=>String(x.id)===String(pid)));}}catch{}})();return()=>{active=false}},[pid]);
  if(!p)return<div style={{padding:24,textAlign:"center",color:"var(--am-muted)"}}>محصول یافت نشد<br/><button onClick={onBack} style={{marginTop:16,padding:"10px 24px",background:"var(--am-accent)",border:"none",borderRadius:12,cursor:"pointer",fontFamily:"Vazirmatn",fontWeight:700,color:"#FFFFFF"}}>بازگشت</button></div>;

  const sortedOffers=sortOffers(offers,sellerSort);
  const avg=Math.round(sortedOffers.reduce((a,o)=>a+o.price,0)/(sortedOffers.length||1));
  const similar=MARKET_PRODUCTS.filter(x=>x.catId===p.catId&&x.id!==p.id).slice(0,8);
  const cheaper=MARKET_PRODUCTS.filter(x=>x.catId===p.catId&&x.priceMin<p.priceMin&&x.id!==p.id).sort((a,b)=>a.priceMin-b.priceMin).slice(0,4);
  const pricier=MARKET_PRODUCTS.filter(x=>x.catId===p.catId&&x.priceMin>p.priceMin&&x.id!==p.id&&x.rating>=p.rating).sort((a,b)=>a.priceMin-b.priceMin).slice(0,3);
  const strengths=getProductStrengths(p);
  const weaknesses=getProductWeaknesses(p);
  const [frameUrl,setFrameUrl]=useState("");
  const openOffer=async(o:AnOffer)=>{if(!o.offerId)return;try{const token=localStorage.getItem("anpardaz:accessToken")??"";const r=await fetch(ANMARKET_PLATFORM_API_BASE+"/api/v1/market/clickout",{method:"POST",headers:{authorization:"Bearer "+token,"content-type":"application/json"},body:JSON.stringify({offerId:o.offerId,surface:"mobile"})});const d=await r.json();if(!r.ok)throw new Error();if(d.mode==="iframe")setFrameUrl(d.url);else window.open(d.url,"_blank","noopener,noreferrer")}catch{setFrameUrl("")}};
  const drop=p.ph.length>1&&p.ph[p.ph.length-1].p<p.ph[0].p?Math.round((p.ph[0].p-p.ph[p.ph.length-1].p)/p.ph[0].p*100):0;
  const TABS=([["sellers","فروشگاه‌ها"],["specs","مشخصات"],["reviews","نظرات"],["similar","گزینه‌ها"]] as const);
  // Simulate 4 gallery images using same URL with different crops
  const galleryImgs=(p.media&&p.media.length?p.media:[p.img]).filter(Boolean).slice(0,8);

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
            <button onClick={e=>{e.stopPropagation();void (async()=>{const token=localStorage.getItem("anpardaz:accessToken")??"";try{const r=await fetch(ANMARKET_PLATFORM_API_BASE+"/api/v1/market/products/"+encodeURIComponent(pid)+"/favorite",{method:"POST",headers:{authorization:"Bearer "+token}});const d=await r.json();if(r.ok)setFav(Boolean(d.favorite));}catch{}})();}} style={{width:36,height:36,borderRadius:10,background:"var(--am-card)",border:"1px solid var(--am-border)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:fav?"#DB2777":"var(--am-muted)"}}>
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
              const store={n:o.storeName??o.sid,sc:0};
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
                      <button onClick={()=>void openOffer(o)} style={{width:"100%",padding:"13px",background:"var(--am-accent)",border:"none",borderRadius:12,color:"#FFFFFF",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"Vazirmatn",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
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
  const rawProds=MARKET_PRODUCTS.filter(p=>p.subId===sid||p.catId===cid||(sub?.pids||[]).includes(p.id));
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
  type Ticket={id:number;subject:string;status:string;priority:string;updated_at:string;created_at:string};
  const [tickets,setTickets]=useState<Ticket[]>([]);const[selected,setSelected]=useState<Ticket|null>(null);const[messages,setMessages]=useState<any[]>([]);const[subject,setSubject]=useState("");const[message,setMessage]=useState("");const[reply,setReply]=useState("");const[loading,setLoading]=useState(true);const[sending,setSending]=useState(false);
  const token=()=>localStorage.getItem("anpardaz:accessToken")??"";
  const load=async()=>{setLoading(true);try{const r=await fetch(ANMARKET_PLATFORM_API_BASE+"/api/v1/market/me/tickets",{headers:{authorization:"Bearer "+token()}});if(r.ok){const d=await r.json();setTickets(d.tickets??[])}}catch{}finally{setLoading(false)}};
  useEffect(()=>{void load()},[]);
  const open=async(t:Ticket)=>{setSelected(t);try{const r=await fetch(ANMARKET_PLATFORM_API_BASE+"/api/v1/market/me/tickets/"+t.id,{headers:{authorization:"Bearer "+token()}});if(r.ok){const d=await r.json();setMessages(d.messages??[])}}catch{}};
  const sendReply=async()=>{if(!selected||!reply.trim()||sending||selected.status==="closed")return;setSending(true);try{const r=await fetch(ANMARKET_PLATFORM_API_BASE+"/api/v1/market/me/tickets/"+selected.id+"/messages",{method:"POST",headers:{authorization:"Bearer "+token(),"content-type":"application/json"},body:JSON.stringify({message:reply.trim()})});if(r.ok){setReply("");await open(selected);await load()}}catch{}finally{setSending(false)}};
  const create=async()=>{if(!subject.trim()||!message.trim())return;setSending(true);try{const r=await fetch(ANMARKET_PLATFORM_API_BASE+"/api/v1/market/tickets",{method:"POST",headers:{authorization:"Bearer "+token(),"content-type":"application/json"},body:JSON.stringify({subject:subject.trim(),message:message.trim()})});if(r.ok){setSubject("");setMessage("");await load()}}catch{}finally{setSending(false)}};
  useBackHandler(()=>{if(selected){setSelected(null);setMessages([])}else onBack()});
  if(selected)return <div style={{display:"flex",flexDirection:"column",height:"100%"}}><div style={{padding:"14px 16px",background:"#fff",borderBottom:"1px solid var(--am-border)",display:"flex",gap:10,alignItems:"center"}}><button onClick={()=>{setSelected(null);setMessages([]);setReply("")}} style={{background:"none",border:"none",fontSize:22}}>‹</button><div style={{fontWeight:900}}>{selected.subject}<div style={{fontSize:10,color:"var(--am-muted)",marginTop:3}}>#{selected.id} · {selected.status}</div></div></div><div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:10}}>{messages.map((m,i)=><div key={i} style={{alignSelf:m.author_type==="user"?"flex-start":"flex-end",maxWidth:"80%",padding:12,borderRadius:14,background:m.author_type==="user"?"var(--am-accent)":"#fff",color:m.author_type==="user"?"#fff":"var(--am-text)",border:"1px solid var(--am-border)"}}>{m.message}</div>)}</div>{selected.status!=="closed"&&<div style={{padding:12,background:"#fff",borderTop:"1px solid var(--am-border)"}}><textarea value={reply} onChange={e=>setReply(e.target.value)} placeholder="پاسخ شما..." rows={3} style={{width:"100%",boxSizing:"border-box",padding:10,border:"1px solid var(--am-border)",borderRadius:10,fontFamily:"Vazirmatn",resize:"vertical"}}/><button disabled={sending||!reply.trim()} onClick={()=>void sendReply()} style={{width:"100%",marginTop:8,padding:12,border:0,borderRadius:10,background:"var(--am-accent)",color:"#fff",fontFamily:"Vazirmatn",fontWeight:800}}>{sending?"در حال ارسال...":"ارسال پاسخ"}</button></div>}</div>;
  return <div style={{paddingBottom:110}}><div style={{padding:"16px",background:"#fff",borderBottom:"1px solid var(--am-border)"}}><div style={{fontSize:17,fontWeight:900}}>تیکت‌های پشتیبانی</div><div style={{fontSize:12,color:"var(--am-muted)",marginTop:4}}>ثبت و پیگیری مستقیم در سیستم پشتیبانی آن مارکت</div></div><div style={{padding:16}}>{loading?<div style={{padding:30,textAlign:"center",color:"var(--am-muted)"}}>در حال دریافت...</div>:tickets.map(t=><button key={t.id} onClick={()=>void open(t)} style={{width:"100%",textAlign:"right",background:"#fff",border:"1px solid var(--am-border)",borderRadius:14,padding:14,marginBottom:10,fontFamily:"Vazirmatn"}}><div style={{fontWeight:800}}>{t.subject}</div><div style={{fontSize:11,color:"var(--am-muted)",marginTop:5}}>#{t.id} · {t.status} · {t.updated_at}</div></button>)}{!loading&&tickets.length===0&&<div style={{padding:24,textAlign:"center",color:"var(--am-muted)"}}>تیکتی ثبت نشده است.</div>}<div style={{marginTop:18,background:"#fff",border:"1px solid var(--am-border)",borderRadius:16,padding:16}}><div style={{fontWeight:900,marginBottom:10}}>تیکت جدید</div><input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="موضوع" style={{width:"100%",boxSizing:"border-box",padding:12,border:"1px solid var(--am-border)",borderRadius:10,marginBottom:10,fontFamily:"Vazirmatn"}}/><textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="شرح مشکل یا سؤال" rows={5} style={{width:"100%",boxSizing:"border-box",padding:12,border:"1px solid var(--am-border)",borderRadius:10,fontFamily:"Vazirmatn",resize:"vertical"}}/><button disabled={sending||!subject.trim()||!message.trim()} onClick={()=>void create()} style={{width:"100%",marginTop:10,padding:13,border:0,borderRadius:11,background:"var(--am-accent)",color:"#fff",fontFamily:"Vazirmatn",fontWeight:800}}>{sending?"در حال ارسال...":"ثبت تیکت"}</button></div></div></div>;
}
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
          <p style={{color:"rgba(255,255,255,0.6)",fontSize:12,textAlign:"center",marginBottom:16,lineHeight:1.7}}>از شماره کارت عکس بگیرید{"
"}ما شماره کارت را برایتان وارد می‌کنیم.</p>
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
  const [showFinancialNotifications,setShowFinancialNotifications]=useState(false);
  const [financialNotifications,setFinancialNotifications]=useState<any[]>([]);
  const [financialUnread,setFinancialUnread]=useState(0);
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

  const setLightTheme=(v:boolean)=>{
    setLightThemeState(v);
    localStorage.setItem("anp_theme",v?"light":"dark");
    void userSettingsRequest("/api/v1/user/settings",{method:"PATCH",body:JSON.stringify({theme:v?"light":"dark"})}).catch(()=>{});
  };
  useEffect(()=>{document.body.classList.toggle("light-theme",lightTheme)},[lightTheme]);
  useEffect(()=>{const p=new URLSearchParams(window.location.search);if(p.get("card_registration")==="verified"){setSystemNotice("کارت بانکی با موفقیت در آن‌پرداز ثبت و تأیید شد.");window.dispatchEvent(new Event("anp-cards-updated"));const clean=window.location.pathname+window.location.hash;window.history.replaceState({},document.title,clean)}},[]);

  useEffect(()=>{
    if(!user)return;
    let active=true;
    void userSettingsRequest("/api/v1/user/settings").then(({settings})=>{
      if(!active||!settings)return;
      setLightThemeState(settings.theme==="light");
      localStorage.setItem("anp_theme",settings.theme);
      const root=document.getElementById("root");
      if(root)root.style.zoom=settings.fontScale===0?"":String(1+settings.fontScale*0.07);
    }).catch(()=>{});
    return()=>{active=false};
  },[user?.uid]);

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
  if(appState==="verify-anim")return <VerificationAnimation onSuccess={()=>{const u:UserData={uid:_genUid(),...obProfile,phone:pendingPhone,photo:obPhoto,pin:pendingPin,tomanBalance:0,usdtBalance:0,cryptoBalances:{},cards:[],registeredAt:new Date().toISOString()};DB.saveUser(u);DB.setCurrentPhone(u.phone);setUser(u);setTransactions([]);setHomeServices(SERVICES.slice(0,8).map(s=>s.id));setHomeSkeleton(false);setAppState("ready");setPendingTour(true);}} onFail={()=>{setPendingPin("");setAppState("onboard-pin")}}/>;
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
    else if(action==="sayad"){setTab("home");setSubPage("sayad")}
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
  if(subPage==="sayad")return <div key="sayad" className={`app${lt} app-slide`} dir="rtl"><SayadScreen onBack={goBack}/><SNAV/></div>;
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
  if(subPage==="financial-center")return <div key="financial-center" className={`app${lt} app-slide`} dir="rtl"><FinancialCenterLive onBack={goBack}/><SNAV/></div>;
function ComparisonPopup({ids,onClose,onMinimize,minimized,onProduct}:{ids:string[];onClose:()=>void;onMinimize:()=>void;minimized:boolean;onProduct:(pid:string)=>void}){
  const prods=ids.map(id=>MARKET_PRODUCTS.find(p=>p.id===id)).filter(Boolean) as AnProduct[];
  const [aiText,setAiText]=useState("");
  useEffect(()=>{if(prods.length<2)return;void (async()=>{try{const token=localStorage.getItem("anpardaz:accessToken")??"";const input=JSON.stringify(prods.map(p=>({id:p.id,title:p.title,brand:p.brand,priceMin:p.priceMin,priceMax:p.priceMax,specs:p.specs,storeCount:p.storeCount})));const r=await fetch(ANMARKET_PLATFORM_API_BASE+"/api/v1/market/ai/assist",{method:"POST",headers:{authorization:"Bearer "+token,"content-type":"application/json"},body:JSON.stringify({workflowCode:"market.compare",input:"مقایسه فنی و خرید این محصولات فقط بر اساس داده‌های ارائه‌شده؛ چیزی را حدس نزن و عدم قطعیت را صریح بگو. "+input,compareIds:ids})});const d=await r.json();if(r.ok)setAiText(d?.result?.text??"");}catch{}})()},[ids.join(",")]);
  if(minimized)return <div style={{position:"fixed",bottom:70,left:12,right:12,zIndex:300,background:"var(--am-card)",border:"1px solid var(--am-accent-border)",borderRadius:16,padding:12,display:"flex",gap:8,alignItems:"center",boxShadow:"0 8px 30px rgba(0,0,0,.15)"}}><b style={{flex:1,fontSize:12}}>مقایسه {toFaDigits(String(prods.length))} محصول</b><button onClick={onMinimize} style={{background:"var(--am-accent)",color:"#fff",border:0,borderRadius:9,padding:"8px 14px",fontFamily:"Vazirmatn"}}>مشاهده</button><button onClick={onClose} style={{background:"none",border:0,color:"var(--am-muted)"}}>×</button></div>;
  return <div style={{position:"fixed",inset:0,zIndex:300,background:"var(--am-bg)",overflowY:"auto",padding:16}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><b style={{fontSize:17,flex:1}}>مقایسه محصولات</b><button onClick={onMinimize}>کوچک</button><button onClick={onClose}>×</button></div>
    {aiText&&<div style={{background:"var(--am-card)",border:"1px solid var(--am-accent-border)",borderRadius:16,padding:14,marginBottom:14}}><div style={{fontWeight:800,color:"var(--am-accent)",marginBottom:7}}>تحلیل دستیار هوشمند</div><div style={{fontSize:12,lineHeight:1.9,whiteSpace:"pre-wrap"}}>{aiText}</div></div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10}}>{prods.map(p=><button key={p.id} onClick={()=>onProduct(p.id)} style={{textAlign:"right",background:"var(--am-card)",border:"1px solid var(--am-border)",borderRadius:14,padding:12,fontFamily:"Vazirmatn"}}><img src={p.img} alt="" style={{width:"100%",aspectRatio:1,objectFit:"cover",borderRadius:10}}/><div style={{fontWeight:800,fontSize:12,marginTop:8}}>{p.title}</div><div style={{color:"var(--am-accent)",fontWeight:900,marginTop:5}}>{fa(p.priceMin)} تومان</div><div style={{fontSize:10,color:"var(--am-muted)",marginTop:4}}>{toFaDigits(String(p.storeCount))} فروشگاه</div></button>)}</div>
  </div>;
}
function AnMarketMe({onPush}:{onPush:(v:AnView)=>void}){
  const items:[string,AnView,string][]=[
    ["خریدهای من",{t:"me-orders"},"فعالیت خروج به فروشگاه‌ها"],
    ["تیکت‌های پشتیبانی",{t:"me-tickets"},"پیگیری مستقیم با آن مارکت"],
    ["علاقه‌مندی‌ها",{t:"me-fav"},"محصولات ذخیره‌شده"],
    ["هشدارهای قیمت",{t:"me-alerts"},"هشدارهای ثبت‌شده"],
    ["اخیراً مشاهده‌شده",{t:"me-recent"},"تاریخچه مشاهده"],
    ["مقایسه‌های من",{t:"me-compare"},"مقایسه‌های ذخیره‌شده"],
  ];
  return <div style={{padding:16}}><div style={{fontSize:18,fontWeight:900,marginBottom:5}}>آن مارکت من</div><div style={{fontSize:12,color:"var(--am-muted)",marginBottom:16}}>اطلاعات واقعی حساب و فعالیت شما</div>{items.map(([t,v,d])=><button key={t} onClick={()=>onPush(v)} style={{width:"100%",textAlign:"right",background:"var(--am-card)",border:"1px solid var(--am-border)",borderRadius:15,padding:15,marginBottom:10,fontFamily:"Vazirmatn"}}><div style={{fontWeight:800}}>{t}</div><div style={{fontSize:11,color:"var(--am-muted)",marginTop:4}}>{d}</div></button>)}</div>;
}
function AnMeSubPage({view,onProduct,onBack}:{view:AnView;onProduct:(pid:string)=>void;onBack:()=>void}){
  const [items,setItems]=useState<any[]>([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{let active=true;(async()=>{try{const token=localStorage.getItem("anpardaz:accessToken")??"";const map:any={"me-fav":"/api/v1/market/me/favorites","me-recent":"/api/v1/market/me/recent","me-alerts":"/api/v1/market/me/alerts","me-orders":"/api/v1/market/me/clickouts","me-compare":"/api/v1/market/me/comparisons"};const u=map[(view as any).t];if(!u){setLoading(false);return;}const r=await fetch(ANMARKET_PLATFORM_API_BASE+u,{headers:{authorization:"Bearer "+token},cache:"no-store"});const d=await r.json();if(active){const k=(view as any).t;setItems(d.products??d.alerts??d.clickouts??d.comparisons??[]);setLoading(false);}}catch{if(active){setItems([]);setLoading(false);}}})();return()=>{active=false}},[(view as any).t]);
  useBackHandler(onBack);
  const t=(view as any).t as string;
  if(t==="me-tickets"||t==="me-support")return <AnTicketsSubPage onBack={onBack}/>;
  const title:string=t==="me-orders"?"فعالیت خرید":t==="me-fav"?"علاقه‌مندی‌ها":t==="me-alerts"?"هشدارهای قیمت":t==="me-recent"?"اخیراً مشاهده‌شده":t==="me-compare"?"مقایسه‌های من":"آن مارکت من";
  return <div style={{padding:16}}><div style={{fontSize:17,fontWeight:900,marginBottom:14}}>{title}</div>{loading?<div style={{padding:30,textAlign:"center",color:"var(--am-muted)"}}>در حال دریافت...</div>:items.length===0?<div style={{padding:30,textAlign:"center",color:"var(--am-muted)"}}>داده‌ای ثبت نشده است.</div>:items.map((it:any,i:number)=>{const pid=String(it.id??it.product_id??it.productId??"");const p=MARKET_PRODUCTS.find(x=>x.id===pid);return <button key={i} onClick={()=>p&&onProduct(p.id)} style={{width:"100%",textAlign:"right",background:"var(--am-card)",border:"1px solid var(--am-border)",borderRadius:14,padding:13,marginBottom:9,fontFamily:"Vazirmatn"}}>{p&&<img src={p.img} alt="" style={{width:52,height:52,objectFit:"cover",borderRadius:10,float:"right",marginLeft:10}}/>}<div style={{fontWeight:800,fontSize:12}}>{it.title??it.product_title??it.store_name??it.subject??"فعالیت آن مارکت"}</div><div style={{fontSize:11,color:"var(--am-muted)",marginTop:5}}>{it.status??it.mode??it.updated_at??it.created_at??""}</div></button>})}</div>;
}
function AnMarketScreen({onBack,user,lightTheme}:{onBack:()=>void;user:UserData;lightTheme?:boolean}){
  const [anStack,setAnStack]=useState<AnView[]>([{t:"home"}]);
  const [compare,setCompare]=useState<CompareState>({active:false,selectedIds:[],minimized:false});
  const [catSheet,setCatSheet]=useState<{level:{cid?:string;sid?:string}[];open:boolean}>({level:[],open:false});
  const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  const cur=anStack[anStack.length-1];
  const anPush=(v:AnView)=>setAnStack(p=>[...p,v]);
  const anPop=()=>{if(anStack.length>1)setAnStack(p=>p.slice(0,-1));else onBack();};
  useBackHandler(()=>{if(catSheet.open){if(catSheet.level.length>1)setCatSheet(p=>({...p,level:p.level.slice(0,-1)}));else setCatSheet({level:[],open:false});return;}anPop();});
  useEffect(()=>{let active=true;(async()=>{try{
    if(!ANMARKET_PLATFORM_API_BASE)throw new Error("market_api_unconfigured");
    const pages=await Promise.all([1,2,3,4,5].map(page=>fetch(ANMARKET_PLATFORM_API_BASE+"/api/v1/market/catalog?limit=100&page="+page,{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject(new Error("catalog_failed")))));
    const rows=pages.flatMap((d:any)=>Array.isArray(d?.products)?d.products:[]);
    const catMap:Record<string,string>={"mobile-digital":"mobile","laptop-computer":"laptop","home-appliance":"appliance","supermarket":"hypermarket","beauty-health":"beauty","audio-video":"av","automotive":"car","baby-kids":"kids","books-culture":"culture","tools-industrial":"industrial","travel-camping":"travel","pet":"pet","office":"office","jewelry-gold":"gold","other":"other"};
    MARKET_PRODUCTS=rows.map((p:any)=>{const media=(p.media??[]).map((m:any)=>m.url).filter(Boolean);const imgs=media.concat((p.offers??[]).map((o:any)=>o.image_url).filter(Boolean));return{id:String(p.id),title:p.title??"",brand:p.brand??"",catId:catMap[p.category_slug]??"other",subId:p.category_slug??"other",img:imgs[0]??"",specs:p.specs??{},priceMin:Number(p.priceMin??0),priceMax:Number(p.priceMax??0),storeCount:Number(p.storeCount??0),desc:p.description??"",tags:[],rating:0,reviews:0,ph:[],media:imgs.slice(0,8)} as AnProduct;});
    if(active){setError("");setLoading(false);}
  }catch{if(active){MARKET_PRODUCTS=[];setError("اطلاعات واقعی آن مارکت در دسترس نیست.");setLoading(false);}}})();return()=>{active=false}},[]);
  const handleCompareToggle=(pid:string)=>{if(pid==="__mode__"){setCompare(p=>({...p,active:!p.active,selectedIds:p.active?[]:p.selectedIds}));return;}setCompare(p=>p.selectedIds.includes(pid)?({...p,selectedIds:p.selectedIds.filter(x=>x!==pid)}):p.selectedIds.length<6?({...p,selectedIds:[...p.selectedIds,pid]}):p);};
  const ct=cur.t as string; const activeTab=(catSheet.open||ct==="cat"||ct==="sub")?"cats":(ct==="me"||ct.startsWith("me-"))?"me":(ct==="assistant"||ct==="chat")?"assistant":"home";
  return <div className={`an-market-root${lightTheme?"":" dark-theme"}`} style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",position:"relative"}}>
    {loading&&<div style={{padding:"10px 16px",background:"var(--am-card)",color:"var(--am-muted)",fontSize:12,textAlign:"center"}}>در حال دریافت محصولات واقعی آن مارکت...</div>}
    {error&&<div style={{padding:"10px 16px",background:"rgba(239,68,68,.06)",color:"#DC2626",fontSize:12,textAlign:"center"}}>{error}</div>}
    <div style={{display:"flex",gap:8,padding:"10px 12px",borderBottom:"1px solid var(--am-border)",background:"var(--am-card)",flexShrink:0}}>
      {(["home","assistant","cats","me"] as const).map(t=><button key={t} onClick={()=>{if(t==="home")setAnStack([{t:"home"}]);else if(t==="assistant")setAnStack([{t:"assistant"}]);else if(t==="cats")setCatSheet({level:[{}],open:true});else setAnStack([{t:"me"}]);}} style={{flex:1,padding:"9px 5px",borderRadius:10,border:"1px solid var(--am-border)",background:activeTab===t?"var(--am-accent-light)":"var(--am-bg)",color:activeTab===t?"var(--am-accent)":"var(--am-muted)",fontFamily:"Vazirmatn",fontWeight:800,fontSize:11}}>{t==="home"?"خانه":t==="assistant"?"دستیار هوشمند":t==="cats"?"دسته‌بندی‌ها":"آن مارکت من"}</button>)}
    </div>
    <div style={{flex:1,overflowY:cur.t==="assistant"?"hidden":"auto",overflowX:"hidden"}}>
      {cur.t==="home"&&<AnMarketHome onProduct={pid=>anPush({t:"product",pid})} onCat={cid=>setCatSheet({level:[{cid}],open:true})} onGoCats={()=>setCatSheet({level:[{}],open:true})} onSearch={q=>anPush({t:"chat",q})} compareMode={compare.active} compareSelected={compare.selectedIds} onCompareToggle={handleCompareToggle} onBack={onBack}/>}
      {cur.t==="assistant"&&<AnAssistantChat onProduct={pid=>anPush({t:"product",pid})} compareMode={compare.active} compareSelected={compare.selectedIds} onCompareToggle={handleCompareToggle} onBack={onBack}/>}
      {cur.t==="chat"&&<AnChatPage q={(cur as {t:"chat";q:string}).q} onProduct={pid=>pid==="__back__"?anPop():anPush({t:"product",pid})} compareMode={compare.active} compareSelected={compare.selectedIds} onCompareToggle={handleCompareToggle}/>}
      {cur.t==="product"&&<AnProductDetail pid={(cur as {t:"product";pid:string}).pid} onProduct={pid=>anPush({t:"product",pid})} onSearch={q=>anPush({t:"chat",q})} onBack={anPop}/>}
      {cur.t==="cats"&&<AnCatPage onCat={cid=>anPush({t:"cat",cid})} onSub={(cid,sid)=>anPush({t:"sub",cid,sid})} onSearch={q=>anPush({t:"chat",q})}/>}
      {cur.t==="cat"&&<AnCatDetailPage cid={(cur as {t:"cat";cid:string}).cid} onSub={(cid,sid)=>anPush({t:"sub",cid,sid})} onBack={anPop}/>}
      {cur.t==="sub"&&<AnSubDetailPage cid={(cur as {t:"sub";cid:string;sid:string}).cid} sid={(cur as {t:"sub";cid:string;sid:string}).sid} onProduct={pid=>anPush({t:"product",pid})} onSearch={q=>anPush({t:"chat",q})} compareMode={compare.active} compareSelected={compare.selectedIds} onCompareToggle={handleCompareToggle}/>}
      {cur.t==="me"&&<AnMarketMe onPush={anPush}/>}
      {cur.t.startsWith("me-")&&<AnMeSubPage view={cur as any} onProduct={pid=>anPush({t:"product",pid})} onBack={anPop}/>}
    </div>
    {compare.active&&compare.selectedIds.length>=2&&<ComparisonPopup ids={compare.selectedIds} minimized={compare.minimized} onMinimize={()=>setCompare(p=>({...p,minimized:!p.minimized}))} onClose={()=>setCompare({active:false,selectedIds:[],minimized:false})} onProduct={pid=>anPush({t:"product",pid})}/>}
    {catSheet.open&&<div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"flex-end"}} onClick={()=>setCatSheet({level:[],open:false})}><div style={{position:"relative",width:"100%",maxHeight:"75%",background:"var(--am-bg,#fff)",borderRadius:"20px 20px 0 0",padding:16,overflowY:"auto"}} onClick={e=>e.stopPropagation()}><AnCatPage onCat={cid=>{setCatSheet({level:[{cid}],open:false});anPush({t:"cat",cid})}} onSub={(cid,sid)=>{setCatSheet({level:[],open:false});anPush({t:"sub",cid,sid})}} onSearch={q=>{setCatSheet({level:[],open:false});anPush({t:"chat",q})}}/></div></div>}
  </div>;
}

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
        <button onClick={()=>void openFinancialNotifications()} aria-label="اعلان‌های مالی" data-help-id="financial-notifications-btn" style={{position:"relative",width:36,height:36,borderRadius:11,background:"rgba(0,214,176,0.08)",border:"1px solid rgba(0,214,176,0.22)",color:"var(--accent)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Icon name="bell" size={17}/>{financialUnread>0&&<span style={{position:"absolute",top:-4,right:-4,minWidth:16,height:16,padding:"0 4px",borderRadius:9,background:"#ef4444",color:"#fff",fontSize:9,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",boxSizing:"border-box"}}>{financialUnread>99?"99+":financialUnread}</span>}
        </button>
        <button className="header-notif-btn" onClick={()=>setMenuOpen(true)} aria-label="اطلاعات کاربری" data-help-id="avatar-btn">
          <div className="header-avatar-mini">
            {user.photo?<img src={user.photo} alt=""/>:<span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:60,fontSize:10,fontWeight:700}}>{(user.name||"").trim()||"؟"}</span>}
          </div>
        </button>
      </div>
      {menuOpen&&<UserDrawerModal user={user} onClose={()=>setMenuOpen(false)} onLogout={()=>{setMenuOpen(false);handleLogout()}} />}{showFinancialNotifications&&<div onClick={()=>setShowFinancialNotifications(false)} style={{position:"fixed",inset:0,zIndex:1200,background:"rgba(0,0,0,.42)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"72px 14px 20px"}}><div onClick={e=>e.stopPropagation()} dir="rtl" style={{width:"min(430px,100%)",maxHeight:"72vh",overflow:"auto",borderRadius:20,background:"var(--card-bg,#102535)",border:"1px solid var(--border-faint)",boxShadow:"0 20px 60px rgba(0,0,0,.35)"}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:"1px solid var(--border-faint)"}}><b>اعلان‌های مالی</b><button onClick={()=>setShowFinancialNotifications(false)} style={{border:0,background:"transparent",color:"var(--text-muted)",fontSize:20}}>×</button></div>
  {financialNotifications.length===0?<div style={{padding:28,textAlign:"center",color:"var(--text-muted)",fontSize:12}}>اعلان مالی جدیدی وجود ندارد.</div>:<div style={{display:"grid",gap:1}}>{financialNotifications.map(n=><button key={n.id} onClick={()=>void readFinancialNotification(Number(n.id))} style={{textAlign:"right",border:0,borderBottom:"1px solid var(--border-faint)",background:n.read_at?"transparent":"rgba(0,214,176,.06)",color:"var(--text-primary)",padding:"13px 16px",fontFamily:"Vazirmatn",cursor:"pointer"}}><div style={{fontWeight:800,fontSize:12}}>{n.title}</div><div style={{fontSize:11,color:"var(--text-muted)",lineHeight:1.7,marginTop:3}}>{n.body}</div><div style={{fontSize:9,color:"var(--text-faint)",marginTop:4}}>{n.created_at?new Date(n.created_at).toLocaleString("fa-IR"):""}</div></button>)}</div>}
</div></div>}
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
