// آن هوش — AI Operating Platform · An Pardaz Ecosystem
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useBackHandler } from "./backHandler";

// ══════════════════════════════════════════════════════════════════
// ICON SYSTEM — consistent 1.6px stroke, round caps
// ══════════════════════════════════════════════════════════════════
function Ic({ n, s = 20, w = 1.6, fill }: { n: string; s?: number; w?: number; fill?: string }) {
  const p = {
    width: s, height: s, viewBox: "0 0 24 24",
    fill: fill ?? "none", stroke: fill ? "none" : "currentColor",
    strokeWidth: w, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  switch (n) {
    case "video":      return <svg {...p}><path d="M15 10l4.55-2.07A1 1 0 0 1 21 8.85v6.3a1 1 0 0 1-1.45.92L15 14"/><rect x="2" y="7" width="13" height="10" rx="2.5"/></svg>;
    case "image":      return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
    case "music":      return <svg {...p}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
    case "voice":      return <svg {...p}><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="9" y1="22" x2="15" y2="22"/></svg>;
    case "write":      return <svg {...p}><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>;
    case "code":       return <svg {...p}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
    case "translate":  return <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
    case "analyze":    return <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>;
    case "content":    return <svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case "assistant":  return <svg {...p}><path d="M12 3c-4.4 0-8 2.9-8 6.5 0 1.9.9 3.6 2.4 4.8L5 18l4.5-1.5c.8.2 1.6.3 2.5.3 4.4 0 8-2.9 8-6.5S16.4 3 12 3z"/><circle cx="8.5" cy="9.5" r=".7" fill="currentColor" stroke="none"/><circle cx="12" cy="9.5" r=".7" fill="currentColor" stroke="none"/><circle cx="15.5" cy="9.5" r=".7" fill="currentColor" stroke="none"/></svg>;
    case "back":       return <svg {...p}><polyline points="9 18 15 12 9 6"/></svg>;
    case "menu":       return <svg {...p}><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>;
    case "close":      return <svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    case "chevron":    return <svg {...p}><polyline points="6 9 12 15 18 9"/></svg>;
    case "send":       return <svg viewBox="0 0 24 24" width={s} height={s} fill="currentColor"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>;
    case "attach":     return <svg {...p}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>;
    case "mic":        return <svg {...p}><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/></svg>;
    case "plus":       return <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case "deep":       return <svg {...p}><circle cx="12" cy="12" r="2.5"/><path d="M12 1v3.5M12 19.5V23M1 12h3.5M19.5 12H23M4.4 4.4l2.47 2.47M17.13 17.13l2.47 2.47M4.4 19.6l2.47-2.47M17.13 6.87l2.47-2.47"/></svg>;
    case "check":      return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>;
    case "clock":      return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    case "spark":      return <svg {...p}><path d="M13 2L4.09 12.26A1 1 0 0 0 5 14h6l-2 8 8.91-10.26A1 1 0 0 0 17 10h-6z"/></svg>;
    case "folder":     return <svg {...p}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
    case "compass":    return <svg {...p}><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>;
    case "chat":       return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case "search":     return <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
    case "trash":      return <svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
    case "dots":       return <svg {...p}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>;
    case "star":       return <svg {...p}><path d="M12 2L14.9 9.26H22L16.04 13.74L18.9 21L12 16.54L5.1 21L7.96 13.74L2 9.26H9.1L12 2Z"/></svg>;
    case "edit":       return <svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
    case "settings":   return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    default:           return <svg {...p}><circle cx="12" cy="12" r="10"/></svg>;
  }
}

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════
interface AIModel {
  id: string; name: string; provider: string; desc: string;
  capabilities: string[]; providerColor: string;
  badge?: "new" | "pro"; contextWindow?: string;
}
interface CreationMode {
  id: string; label: string; shortDesc: string; iconId: string;
  category: string; placeholder: string;
}
interface Message {
  id: string; role: "user" | "ai"; text: string;
  modelId?: string; ts: Date; thinking?: boolean;
}
interface Conversation {
  id: string; title: string; preview: string;
  messages: Message[]; modelId: string; modeId?: string;
  createdAt: string; updatedAt: string; group: string;
}
interface Project {
  id: string; title: string; description: string;
  modelId: string; modeId?: string; conversationIds: string[];
  createdAt: string; updatedAt: string; accentColor: string;
}

// ══════════════════════════════════════════════════════════════════
// AI MODEL CATALOG — scalable, provider-grouped
// ══════════════════════════════════════════════════════════════════
const AI_MODELS: AIModel[] = [
  // ── OpenAI ──
  { id:"gpt-4o-mini",       name:"GPT-4o Mini",         provider:"OpenAI",    desc:"سریع و مقرون‌به‌صرفه — مناسب کارهای روزانه و پرحجم",               providerColor:"#10A37F", capabilities:["fast","translation","writing"] },
  { id:"gpt-4o",            name:"GPT-4o",              provider:"OpenAI",    desc:"پیشرفته برای پاسخ دقیق، تحلیل تصویر و سند، کدنویسی",               providerColor:"#10A37F", capabilities:["vision","coding","doc-analysis","writing","translation"], contextWindow:"128K" },
  { id:"o3",                name:"o3",                  provider:"OpenAI",    desc:"مدل استدلالی پیشرفته — مناسب ریاضیات و مسائل پیچیده",               providerColor:"#10A37F", capabilities:["reasoning","coding"], badge:"new", contextWindow:"200K" },
  { id:"o4-mini",           name:"o4-mini",             provider:"OpenAI",    desc:"استدلال سریع با هزینه پایین — بهترین ترکیب قدرت و سرعت",            providerColor:"#10A37F", capabilities:["reasoning","fast","coding"], badge:"new" },
  // ── Anthropic ──
  { id:"claude-haiku",      name:"Claude Haiku 3.5",    provider:"Anthropic", desc:"سریع‌ترین مدل کلود — مناسب کارهای ساده و پرتکرار",                  providerColor:"#C4956A", capabilities:["fast","writing","translation"] },
  { id:"claude-sonnet",     name:"Claude Sonnet 5",     provider:"Anthropic", desc:"توازن ایده‌آل هوش و سرعت — بهترین انتخاب روزانه",                   providerColor:"#C4956A", capabilities:["coding","writing","vision","reasoning"], contextWindow:"200K" },
  { id:"claude-opus",       name:"Claude Opus 5",       provider:"Anthropic", desc:"بهترین برای کدنویسی پیچیده، تحقیق عمیق و پروژه‌های بزرگ",           providerColor:"#C4956A", capabilities:["coding","reasoning","doc-analysis","writing"], badge:"pro", contextWindow:"200K" },
  // ── Google ──
  { id:"gemini-flash",      name:"Gemini 2.0 Flash",    provider:"Google",    desc:"سریع و کارآمد برای حجم بالا با کیفیت قابل‌قبول",                    providerColor:"#4285F4", capabilities:["fast","vision","translation"], badge:"new" },
  { id:"gemini-flash-think",name:"Gemini Flash Thinking",provider:"Google",   desc:"استدلال گام‌به‌گام با سرعت فلش — ترکیب منحصربه‌فرد",                providerColor:"#4285F4", capabilities:["reasoning","fast"], badge:"new" },
  { id:"gemini-pro",        name:"Gemini 2.5 Pro",      provider:"Google",    desc:"ایده‌آل برای تحقیق، داده‌های چندمرحله‌ای و تحلیل سند",               providerColor:"#4285F4", capabilities:["reasoning","vision","doc-analysis","coding"], contextWindow:"1M" },
  // ── xAI ──
  { id:"grok-3-mini",       name:"Grok 3 Mini",         provider:"xAI",       desc:"سریع و اقتصادی — دسترسی محدود به اینترنت",                          providerColor:"#E0E0E0", capabilities:["fast","writing"] },
  { id:"grok-3",            name:"Grok 3",              provider:"xAI",       desc:"دسترسی به اینترنت زنده — اخبار و اطلاعات لحظه‌ای",                  providerColor:"#E0E0E0", capabilities:["reasoning","vision","doc-analysis"], badge:"new" },
  // ── DeepSeek ──
  { id:"deepseek-v3",       name:"DeepSeek V3",         provider:"DeepSeek",  desc:"قدرتمند در کدنویسی و پاسخ‌های دقیق فنی — متن‌باز",                 providerColor:"#4FACFE", capabilities:["coding","writing","fast"] },
  { id:"deepseek-r2",       name:"DeepSeek R2",         provider:"DeepSeek",  desc:"استدلال عمیق در ریاضیات، علوم و برنامه‌نویسی",                      providerColor:"#4FACFE", capabilities:["reasoning","coding"], contextWindow:"128K" },
  // ── Meta ──
  { id:"llama-4-scout",     name:"Llama 4 Scout",       provider:"Meta",      desc:"آخرین نسل مدل‌های متن‌باز متا — چندمدالی با کانتکست بلند",         providerColor:"#0668E1", capabilities:["vision","coding","fast"], badge:"new", contextWindow:"10M" },
  { id:"llama-3.3-70b",     name:"Llama 3.3 70B",       provider:"Meta",      desc:"مدل ۷۰ میلیارد پارامتری متن‌باز — عالی برای استقرار شخصی",         providerColor:"#0668E1", capabilities:["coding","writing","reasoning"] },
  // ── Mistral ──
  { id:"mistral-large",     name:"Mistral Large 2",     provider:"Mistral",   desc:"مدل چندزبانه پیشرفته — قوی در کدنویسی و استدلال",                   providerColor:"#FF7000", capabilities:["coding","reasoning","writing","translation"], contextWindow:"128K" },
  { id:"codestral",         name:"Codestral",           provider:"Mistral",   desc:"تخصصی کدنویسی — پشتیبانی از ۸۰+ زبان برنامه‌نویسی",               providerColor:"#FF7000", capabilities:["coding"], contextWindow:"256K" },
  { id:"mistral-small",     name:"Mistral Small 3.1",   provider:"Mistral",   desc:"سریع و مقرون‌به‌صرفه با کیفیت بالا — ایده‌آل API",                  providerColor:"#FF7000", capabilities:["fast","writing","translation"] },
  // ── Qwen ──
  { id:"qwen-max",          name:"Qwen 2.5 Max",        provider:"Qwen",      desc:"قوی‌ترین مدل علی‌بابا — چندزبانه و چندمدالی",                      providerColor:"#1677FF", capabilities:["coding","reasoning","writing","vision"], contextWindow:"1M" },
  { id:"qwq-32b",           name:"QwQ 32B",             provider:"Qwen",      desc:"مدل استدلالی قدرتمند با ۳۲ میلیارد پارامتر",                        providerColor:"#1677FF", capabilities:["reasoning","coding","writing"] },
  { id:"qwen-coder",        name:"Qwen 2.5 Coder",      provider:"Qwen",      desc:"تخصصی کدنویسی — بهترین در تکمیل کد و دیباگ",                       providerColor:"#1677FF", capabilities:["coding"], contextWindow:"128K" },
];

const PROVIDERS = [...new Set(AI_MODELS.map(m => m.provider))];

const CAPABILITY_LABELS: Record<string, string> = {
  "reasoning": "استدلال", "coding": "کد", "vision": "تصویر",
  "image-gen": "تصویرسازی", "video-gen": "ویدیو", "music-gen": "موسیقی",
  "voice": "صدا", "translation": "ترجمه", "doc-analysis": "سند",
  "fast": "سریع", "writing": "نوشتن", "long-context": "متن بلند",
};

// ══════════════════════════════════════════════════════════════════
// CREATION MODES
// ══════════════════════════════════════════════════════════════════
const CREATION_MODES: CreationMode[] = [
  { id:"video",     label:"ساخت ویدیو",       shortDesc:"متن به ویدیو",        iconId:"video",     category:"creative", placeholder:"ویدیوی مورد نظر را توصیف کنید — سبک، مدت، محتوا و رنگ‌بندی..." },
  { id:"image",     label:"ساخت تصویر",       shortDesc:"تصویرسازی هوشمند",   iconId:"image",     category:"creative", placeholder:"تصویر دقیق مورد نظر را توصیف کنید — موضوع، سبک، ترکیب‌بندی..." },
  { id:"music",     label:"ساخت موسیقی",      shortDesc:"خلق صدا و آهنگ",     iconId:"music",     category:"creative", placeholder:"سبک موسیقی، حال و هوا و ابزار مورد نظر را بنویسید..." },
  { id:"voice",     label:"صداگذاری",         shortDesc:"تبدیل متن به صدا",   iconId:"voice",     category:"creative", placeholder:"متنی که باید صداگذاری شود را وارد کنید — لحن و جنسیت صدا..." },
  { id:"write",     label:"نوشتن",            shortDesc:"محتوای حرفه‌ای",     iconId:"write",     category:"text",     placeholder:"موضوع، سبک و طول را مشخص کنید — مقاله، ایمیل، گزارش..." },
  { id:"code",      label:"کدنویسی",          shortDesc:"برنامه‌نویسی",       iconId:"code",      category:"text",     placeholder:"کد مورد نیاز را توضیح دهید — زبان، عملکرد، ورودی و خروجی..." },
  { id:"translate", label:"ترجمه",            shortDesc:"ترجمه تخصصی",       iconId:"translate", category:"text",     placeholder:"متن مورد ترجمه را وارد کنید و زبان مبدأ و مقصد را مشخص کنید..." },
  { id:"analyze",   label:"تحلیل داده",       shortDesc:"بینش و تفسیر",       iconId:"analyze",   category:"data",     placeholder:"داده‌ها، گزارش یا موضوع مورد تحلیل را وارد کنید..." },
  { id:"content",   label:"تولید محتوا",      shortDesc:"شبکه‌های اجتماعی",  iconId:"content",   category:"text",     placeholder:"پلتفرم مقصد، موضوع و لحن محتوا را مشخص کنید..." },
  { id:"assistant", label:"دستیار",           shortDesc:"پرسش و پاسخ",        iconId:"assistant", category:"tool",     placeholder:"سؤال خود را بپرسید یا از دستیار کمک بخواهید..." },
];

const CATEGORIES = [
  { id:"all", label:"همه" }, { id:"creative", label:"خلاقانه" },
  { id:"text", label:"نوشتار" }, { id:"data", label:"داده" }, { id:"tool", label:"ابزار" },
];

// ══════════════════════════════════════════════════════════════════
// DEMO STATIC DATA
// ══════════════════════════════════════════════════════════════════
const DEMO_CONVS: Conversation[] = [
  { id:"c1", title:"تحلیل بازار کریپتو Q3 1403",         preview:"بیت‌کوین در هفته جاری با فشار فروش مواجه شد...",          messages:[], modelId:"gemini-pro",   modeId:"analyze",   createdAt:"1403/06/15", updatedAt:"1403/06/15", group:"today" },
  { id:"c2", title:"اسکریپت تبلیغاتی برند پوشاک",        preview:"بسیار خوب! اسکریپت ۳۰ ثانیه‌ای آماده شد...",             messages:[], modelId:"claude-sonnet",modeId:"write",     createdAt:"1403/06/14", updatedAt:"1403/06/14", group:"yesterday" },
  { id:"c3", title:"API پرداخت با Python",                preview:"import requests\nbase_url = 'https://api.example.com'...", messages:[], modelId:"claude-opus",  modeId:"code",      createdAt:"1403/06/13", updatedAt:"1403/06/13", group:"yesterday" },
  { id:"c4", title:"ترجمه قرارداد همکاری",               preview:"این قرارداد بین طرف اول و طرف دوم منعقد می‌گردد...",      messages:[], modelId:"gpt-4o",       modeId:"translate", createdAt:"1403/06/10", updatedAt:"1403/06/10", group:"week" },
  { id:"c5", title:"طراحی معماری میکروسرویس",            preview:"برای سیستم شما معماری event-driven پیشنهاد می‌شود...",   messages:[], modelId:"claude-opus",  modeId:"code",      createdAt:"1403/06/08", updatedAt:"1403/06/08", group:"week" },
  { id:"c6", title:"پیش‌نویس پروپوزال سرمایه‌گذاری",    preview:"خلاصه اجرایی: این طرح با هدف ورود به بازار...",          messages:[], modelId:"gpt-4o",       modeId:"write",     createdAt:"1403/06/01", updatedAt:"1403/06/01", group:"older" },
  { id:"c7", title:"تحلیل رقبا — بازار نرم‌افزاری",     preview:"در این تحلیل رقبا به ۵ شرکت اصلی بازار پرداخته...",     messages:[], modelId:"gemini-pro",   modeId:"analyze",   createdAt:"1403/05/28", updatedAt:"1403/05/28", group:"older" },
];

const DEMO_PROJECTS: Project[] = [
  { id:"p1", title:"راه‌اندازی فروشگاه اینترنتی", description:"طراحی، کدنویسی و بازاریابی پلتفرم فروش آنلاین",    modelId:"claude-opus",  modeId:"code",    conversationIds:["c3","c5"], createdAt:"1403/06/01", updatedAt:"1403/06/15", accentColor:"#7c3aed" },
  { id:"p2", title:"کمپین تبلیغاتی پاییز ۱۴۰۳",  description:"تولید محتوا و اسکریپت برای کمپین فصلی برند",      modelId:"claude-sonnet",modeId:"content",  conversationIds:["c2"],      createdAt:"1403/05/20", updatedAt:"1403/06/14", accentColor:"#0891b2" },
  { id:"p3", title:"گزارش تحلیل بازار مالی",      description:"تحلیل عمیق وضعیت بازار رمزارز و فرصت‌های سرمایه‌گذاری", modelId:"gemini-pro", modeId:"analyze", conversationIds:["c1","c7"], createdAt:"1403/05/10", updatedAt:"1403/06/15", accentColor:"#059669" },
];

const GROUP_LABELS: Record<string, string> = { today:"امروز", yesterday:"دیروز", week:"هفته گذشته", older:"قدیمی‌تر" };
const AI_REPLIES = [
  "درکت می‌کنم. بر اساس اطلاعاتی که ارائه دادی، بهترین رویکرد این است که ابتدا موضوع را به اجزای اصلی تقسیم کنیم. با تحلیل دقیق هر بخش می‌توانیم به راه‌حل جامع‌تری برسیم. آیا جزئیات بیشتری داری؟",
  "پرسش جالبی است. این موضوع چند وجه مهم دارد که باید در نظر گرفت. اول از همه، زمینه و هدف نهایی اهمیت زیادی دارد. بگذار گام‌به‌گام پیش برویم تا بهترین پاسخ را بیابیم.",
  "البته! آماده‌ام کمک کنم. برای بهترین نتیجه چند نکته کلیدی وجود دارد که باید در نظر گرفت. بر اساس درخواست شما، پیشنهادم این است که...",
];

// ══════════════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════════════
const FA = (s: string) => s.replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]);
const ftime = (d: Date) => FA(`${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")}`);
const randReply = () => AI_REPLIES[Math.floor(Math.random() * AI_REPLIES.length)];

// ══════════════════════════════════════════════════════════════════
// PROVIDER MARK
// ══════════════════════════════════════════════════════════════════
function PMark({ provider, size = 36 }: { provider: string; size?: number }) {
  const r = Math.round(size * 0.28);
  const icons: Record<string, React.ReactNode> = {
    OpenAI: <svg width={size*0.52} height={size*0.52} viewBox="0 0 24 24" fill="#10A37F"><path d="M22.28 9.28a5.76 5.76 0 0 0-.5-4.73 5.84 5.84 0 0 0-6.28-2.8 5.76 5.76 0 0 0-4.32-1.75 5.83 5.83 0 0 0-5.57 4.04 5.76 5.76 0 0 0-3.85 2.8 5.84 5.84 0 0 0 .72 6.84 5.76 5.76 0 0 0 .49 4.73 5.84 5.84 0 0 0 6.28 2.8A5.76 5.76 0 0 0 12.81 24a5.83 5.83 0 0 0 5.56-4.04 5.76 5.76 0 0 0 3.85-2.8 5.84 5.84 0 0 0-.94-7.88z"/></svg>,
    Anthropic: <svg width={size*0.5} height={size*0.5} viewBox="0 0 24 24" fill="#C4956A"><path d="M13.83 3.5h3.6L24 20.5h-3.6l-6.57-17zm-3.66 0H6.57L0 20.5h3.6l6.57-17z"/></svg>,
    Google: <svg width={size*0.52} height={size*0.52} viewBox="0 0 24 24" fill="none"><path d="M12 2L14 9.5H22L15.5 14L18 21.5L12 17L6 21.5L8.5 14L2 9.5H10L12 2Z" fill="url(#gg-u)"/><defs><linearGradient id="gg-u" x1="0" y1="0" x2="24" y2="24"><stop stopColor="#4285F4"/><stop offset=".4" stopColor="#9B72CB"/><stop offset=".7" stopColor="#D96570"/><stop offset="1" stopColor="#F9C400"/></linearGradient></defs></svg>,
    xAI: <svg width={size*0.46} height={size*0.46} viewBox="0 0 24 24" fill="#E0E0E0"><path d="M18.24 2.25h3.31L14 12.26l7.55 9.49H18.17l-5.21-6.82-5.96 6.82H3.69l8.02-9.17L4.2 2.25h3.37l4.71 6.23 5.96-6.23z"/></svg>,
    DeepSeek: <svg width={size*0.52} height={size*0.52} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#4FACFE" strokeWidth="1.6"/><path d="M7 12a5 5 0 0 1 5-5 5 5 0 0 1 5 5" stroke="#4FACFE" strokeWidth="1.6" fill="none" strokeLinecap="round"/><circle cx="12" cy="16" r="2" fill="#4FACFE"/></svg>,
    Meta: <svg width={size*0.52} height={size*0.52} viewBox="0 0 24 24" fill="none"><path d="M2 8.5c0-1.38.7-2.6 1.75-3.3C5.07 4.29 6.85 4 8.5 4c1.65 0 3.43.29 4.75 1.2A5.5 5.5 0 0 1 15 8.5c0 1.65-.75 3.1-1.85 4.12C11.92 13.63 10.28 14.5 8.5 14.5S5.08 13.63 3.85 12.62A5.5 5.5 0 0 1 2 8.5z" stroke="#0668E1" strokeWidth="1.6"/><path d="M22 8.5c0-1.38-.7-2.6-1.75-3.3C18.93 4.29 17.15 4 15.5 4c-.55 0-1.1.04-1.6.13" stroke="#0668E1" strokeWidth="1.6" strokeLinecap="round"/><path d="M9 20l3-6 3 6" stroke="#0668E1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    Mistral: <svg width={size*0.52} height={size*0.52} viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="5" height="5" rx="1" fill="#FF7000"/><rect x="9" y="4" width="5" height="5" rx="1" fill="#FF7000" opacity=".7"/><rect x="16" y="4" width="6" height="5" rx="1" fill="#FF7000" opacity=".4"/><rect x="2" y="11" width="5" height="5" rx="1" fill="#FF7000" opacity=".7"/><rect x="9" y="11" width="5" height="5" rx="1" fill="#FF7000" opacity=".5"/><rect x="2" y="18" width="5" height="4" rx="1" fill="#FF7000" opacity=".4"/></svg>,
    Qwen: <svg width={size*0.52} height={size*0.52} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#1677FF" strokeWidth="1.6"/><path d="M8 9a4 4 0 0 1 8 0v3a4 4 0 0 1-8 0V9z" stroke="#1677FF" strokeWidth="1.5" fill="rgba(22,119,255,0.15)"/><path d="M9 17l-2 3M15 17l2 3" stroke="#1677FF" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  };
  const bgs: Record<string, string> = {
    OpenAI:"#0d1a14", Anthropic:"#1a120a", Google:"#0a0f1a", xAI:"#111111",
    DeepSeek:"#070d1a", Meta:"#060e1f", Mistral:"#1a0d00", Qwen:"#050d1a",
  };
  return (
    <div style={{ width:size, height:size, borderRadius:r,
      background:bgs[provider]??"#141420",
      border:"1px solid rgba(255,255,255,0.09)",
      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      {icons[provider] ?? <span style={{color:"#a78bfa",fontWeight:800,fontSize:size*0.3}}>{provider[0]}</span>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODEL SELECTOR SHEET — searchable, provider-filtered
// ══════════════════════════════════════════════════════════════════
function ModelSheet({ current, onSelect, onClose }: { current:string; onSelect:(id:string)=>void; onClose:()=>void }) {
  const [q, setQ] = useState("");
  const [prov, setProv] = useState("all");
  const filtered = useMemo(() => AI_MODELS.filter(m =>
    (prov === "all" || m.provider === prov) &&
    (q === "" || m.name.toLowerCase().includes(q.toLowerCase()) || m.desc.includes(q))
  ), [q, prov]);

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{
      position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.72)",backdropFilter:"blur(8px)",
      display:"flex",flexDirection:"column",justifyContent:"flex-end",
    }}>
      <div style={{background:"var(--ah-surface)",borderRadius:"22px 22px 0 0",borderTop:"1px solid var(--ah-border)",maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Handle */}
        <div style={{padding:"12px 0 0",display:"flex",justifyContent:"center",flexShrink:0}}>
          <div style={{width:38,height:4,borderRadius:2,background:"var(--ah-border)"}}/>
        </div>
        {/* Header */}
        <div style={{padding:"12px 18px 10px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:"var(--ah-text)"}}>مدل هوش مصنوعی</div>
            <div style={{fontSize:11,color:"var(--ah-muted)",marginTop:1}}>{FA(String(AI_MODELS.length))} مدل از {FA(String(PROVIDERS.length))} ارائه‌دهنده</div>
          </div>
          <button onClick={onClose} style={{background:"var(--ah-card)",border:"1px solid var(--ah-border)",borderRadius:10,width:32,height:32,cursor:"pointer",color:"var(--ah-muted)",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="close" s={14}/></button>
        </div>
        {/* Search */}
        <div style={{padding:"0 16px 8px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,background:"var(--ah-card)",border:"1px solid var(--ah-border)",borderRadius:12,padding:"8px 12px"}}>
            <Ic n="search" s={15} w={1.8}/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="جستجو در مدل‌ها..."
              style={{flex:1,background:"none",border:"none",color:"var(--ah-text)",fontSize:13,fontFamily:"Vazirmatn",outline:"none"}}/>
            {q && <button onClick={()=>setQ("")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--ah-muted)",display:"flex",padding:0}}><Ic n="close" s={14}/></button>}
          </div>
        </div>
        {/* Provider tabs */}
        <div style={{display:"flex",gap:6,padding:"0 14px 10px",overflowX:"auto",flexShrink:0}} className="ah-noscroll">
          {["all",...PROVIDERS].map(p=>(
            <button key={p} onClick={()=>setProv(p)} style={{
              padding:"5px 12px",borderRadius:20,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,
              background:prov===p?"rgba(139,92,246,0.15)":"transparent",
              border:prov===p?"1.5px solid rgba(139,92,246,0.4)":"1.5px solid var(--ah-border)",
              color:prov===p?"#c4b5fd":"var(--ah-muted)",fontSize:11,fontWeight:700,fontFamily:"Vazirmatn",
            }}>{p==="all"?"همه":p}</button>
          ))}
        </div>
        {/* Model list */}
        <div style={{overflowY:"auto",padding:"0 14px 32px"}} className="ah-scroll">
          {filtered.length === 0
            ? <div style={{textAlign:"center",padding:"32px 0",color:"var(--ah-muted)",fontSize:13}}>نتیجه‌ای یافت نشد</div>
            : filtered.map(m => {
              const active = m.id === current;
              return (
                <button key={m.id} onClick={()=>{onSelect(m.id);onClose();}} style={{
                  width:"100%",display:"flex",alignItems:"center",gap:14,padding:"12px 10px",marginBottom:3,
                  background:active?"rgba(139,92,246,0.1)":"transparent",
                  border:active?"1.5px solid rgba(139,92,246,0.3)":"1.5px solid transparent",
                  borderRadius:16,cursor:"pointer",textAlign:"right",transition:"all 0.13s",
                }}>
                  <PMark provider={m.provider} size={44}/>
                  <div style={{flex:1,textAlign:"right"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,justifyContent:"flex-end",flexWrap:"wrap"}}>
                      {m.badge==="pro" && <span style={{fontSize:9,fontWeight:800,padding:"2px 6px",borderRadius:5,background:"rgba(251,191,36,0.15)",color:"#fbbf24",letterSpacing:"0.05em"}}>PRO</span>}
                      {m.badge==="new" && <span style={{fontSize:9,fontWeight:800,padding:"2px 6px",borderRadius:5,background:"rgba(139,92,246,0.15)",color:"#a78bfa"}}>جدید</span>}
                      {m.contextWindow && <span style={{fontSize:9,color:"var(--ah-muted)",padding:"2px 6px",background:"var(--ah-card)",borderRadius:5,border:"1px solid var(--ah-border)"}}>{m.contextWindow}</span>}
                      <span style={{fontSize:13,fontWeight:800,color:"var(--ah-text)"}}>{m.name}</span>
                    </div>
                    <div style={{fontSize:11,color:"var(--ah-muted)",lineHeight:1.6,marginBottom:5}}>{m.desc}</div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
                      {m.capabilities.slice(0,4).map(c=>(
                        <span key={c} style={{fontSize:9,padding:"1px 6px",borderRadius:10,background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.15)",color:"rgba(167,139,250,0.8)"}}>{CAPABILITY_LABELS[c]??c}</span>
                      ))}
                    </div>
                  </div>
                  {active && <div style={{color:"#8b5cf6",flexShrink:0}}><Ic n="check" s={18}/></div>}
                </button>
              );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TYPING INDICATOR
// ══════════════════════════════════════════════════════════════════
function Dots() {
  return <div style={{display:"flex",gap:4,padding:"6px 2px",alignItems:"center"}}>
    {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#7c3aed",animation:`ahBounce 1.2s ${i*0.18}s ease-in-out infinite`}}/>)}
  </div>;
}

// ══════════════════════════════════════════════════════════════════
// MESSAGE BUBBLE
// ══════════════════════════════════════════════════════════════════
function Bubble({ msg }: { msg: Message }) {
  const m = AI_MODELS.find(x=>x.id===msg.modelId);
  const user = msg.role === "user";
  return (
    <div style={{display:"flex",flexDirection:user?"row":"row-reverse",alignItems:"flex-end",gap:8,padding:"3px 0"}}>
      {!user && (
        <div style={{width:28,height:28,borderRadius:8,flexShrink:0,background:`${m?.providerColor??"#8b5cf6"}14`,border:`1px solid ${m?.providerColor??"#8b5cf6"}28`,display:"flex",alignItems:"center",justifyContent:"center",color:m?.providerColor??"#8b5cf6"}}>
          <Ic n="star" s={12}/>
        </div>
      )}
      <div style={{maxWidth:"80%",background:user?"linear-gradient(135deg,#7c3aed,#5b21b6)":"var(--ah-card)",borderRadius:user?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"11px 14px",color:user?"#fff":"var(--ah-text)",fontSize:14,lineHeight:1.72,boxShadow:user?"0 4px 16px rgba(124,58,237,0.2)":"none",border:user?"none":"1px solid var(--ah-border)"}}>
        {msg.thinking ? <Dots/> : msg.text}
        {!msg.thinking && <div style={{fontSize:10,color:user?"rgba(255,255,255,0.5)":"var(--ah-muted)",marginTop:6,textAlign:"left"}}>{ftime(msg.ts)}</div>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// INPUT BAR
// ══════════════════════════════════════════════════════════════════
function InputBar({ value, onChange, onSend, placeholder, deepThinking, onToggleDeep, compact=false }:
  { value:string; onChange:(v:string)=>void; onSend:()=>void; placeholder:string; deepThinking:boolean; onToggleDeep:()=>void; compact?:boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const grow = () => { if(!ref.current)return; ref.current.style.height="auto"; ref.current.style.height=Math.min(ref.current.scrollHeight,120)+"px"; };
  return (
    <div className="ah-input-wrap" style={{background:"var(--ah-input)",border:"1.5px solid var(--ah-border-acc)",borderRadius:20,padding:compact?"10px 12px":"13px 14px 10px"}}>
      <textarea ref={ref} value={value}
        onChange={e=>{onChange(e.target.value);grow();}}
        onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();onSend();}}}
        onInput={grow}
        placeholder={placeholder} rows={compact?1:2}
        style={{width:"100%",background:"none",border:"none",resize:"none",color:"var(--ah-text)",fontSize:14,fontFamily:"Vazirmatn",lineHeight:1.65,maxHeight:120,minHeight:compact?20:38,overflowY:"auto"}}
      />
      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8}}>
        <button className="ah-ico-btn"><Ic n="attach" s={17}/></button>
        <button className="ah-ico-btn"><Ic n="mic" s={17}/></button>
        <button onClick={onToggleDeep} className={`ah-deep-btn${deepThinking?" on":""}`}>
          <Ic n="deep" s={13}/> تفکر عمیق
        </button>
        <div style={{flex:1}}/>
        <button onClick={onSend} disabled={!value.trim()} className="ah-send-btn" style={{
          background:value.trim()?"linear-gradient(135deg,#7c3aed,#5b21b6)":"var(--ah-border)",
          color:value.trim()?"#fff":"var(--ah-muted)",
        }}><Ic n="send" s={15}/></button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HOME VIEW — creation platform main screen
// ══════════════════════════════════════════════════════════════════
function HomeView({ activeMode, onSelectMode, onSend, input, onInputChange, deepThinking, onToggleDeep, filterCat, onFilterCat }:
  { activeMode:CreationMode|null; onSelectMode:(m:CreationMode)=>void;
    onSend:()=>void; input:string; onInputChange:(v:string)=>void;
    deepThinking:boolean; onToggleDeep:()=>void; filterCat:string; onFilterCat:(c:string)=>void }) {
  const filtered = filterCat==="all" ? CREATION_MODES : CREATION_MODES.filter(m=>m.category===filterCat);
  return (
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}} className="ah-scroll">
      {/* Hero */}
      <div style={{padding:"28px 22px 16px",textAlign:"center",position:"relative"}}>
        <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:280,height:160,borderRadius:"50%",background:"radial-gradient(ellipse,rgba(139,92,246,0.12) 0%,transparent 68%)",pointerEvents:"none"}}/>
        <div style={{width:48,height:48,borderRadius:16,margin:"0 auto 14px",background:"linear-gradient(135deg,rgba(139,92,246,0.18),rgba(109,40,217,0.06))",border:"1px solid rgba(139,92,246,0.25)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2L14.9 9.26H22L16.04 13.74L18.9 21L12 16.54L5.1 21L7.96 13.74L2 9.26H9.1L12 2Z" stroke="url(#hg1)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="hg1" x1="2" y1="2" x2="22" y2="21"><stop stopColor="#c4b5fd"/><stop offset="1" stopColor="#7c3aed"/></linearGradient></defs></svg>
        </div>
        <h1 style={{fontSize:"clamp(17px,4vw,21px)",fontWeight:900,margin:"0 0 7px",lineHeight:1.35,background:"linear-gradient(135deg,#ededfa 30%,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
          با آن هوش چه می‌خواهید بسازید؟
        </h1>
        <p style={{fontSize:12,color:"var(--ah-muted)",lineHeight:1.7,margin:0}}>از ساخت تصویر تا تحلیل داده — با بهترین مدل‌های هوش مصنوعی</p>
      </div>
      {/* Input */}
      <div style={{padding:"0 16px 16px"}}>
        <InputBar value={input} onChange={onInputChange} onSend={onSend} placeholder={activeMode?.placeholder??"بنویسید، بسازید، تحلیل کنید..."} deepThinking={deepThinking} onToggleDeep={onToggleDeep}/>
        {activeMode && (
          <div style={{marginTop:10,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <span style={{fontSize:11,color:"var(--ah-muted)"}}>حالت:</span>
            <span style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,background:"rgba(139,92,246,0.12)",border:"1px solid rgba(139,92,246,0.28)",color:"#a78bfa",fontSize:11,fontWeight:700}}>
              <Ic n={activeMode.iconId} s={12}/>{activeMode.label}
              <button onClick={()=>onSelectMode({...activeMode,id:"__clear__"})} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(167,139,250,0.6)",padding:0,display:"flex",marginRight:2}}><Ic n="close" s={10}/></button>
            </span>
          </div>
        )}
      </div>
      {/* Category filter */}
      <div style={{padding:"0 16px 8px"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,overflowX:"auto",paddingBottom:2}} className="ah-noscroll">
          <span style={{fontSize:10,color:"var(--ah-muted)",whiteSpace:"nowrap",marginLeft:2,fontWeight:600,opacity:0.7}}>شروع کنید با</span>
          {CATEGORIES.map(c=>(
            <button key={c.id} onClick={()=>onFilterCat(c.id)} style={{
              padding:"5px 12px",borderRadius:20,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,
              background:filterCat===c.id?"rgba(139,92,246,0.15)":"transparent",
              border:filterCat===c.id?"1.5px solid rgba(139,92,246,0.4)":"1.5px solid var(--ah-border)",
              color:filterCat===c.id?"#c4b5fd":"var(--ah-muted)",fontSize:11,fontWeight:700,fontFamily:"Vazirmatn",transition:"all 0.13s",
            }}>{c.label}</button>
          ))}
        </div>
      </div>
      {/* Mode grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,padding:"4px 16px 24px"}}>
        {filtered.map(mode=>{
          const active = activeMode?.id===mode.id;
          return (
            <button key={mode.id} onClick={()=>onSelectMode(mode)} className="ah-mode-card" style={{
              display:"flex",flexDirection:"column",alignItems:"flex-start",padding:"14px",borderRadius:16,cursor:"pointer",
              background:active?"rgba(139,92,246,0.11)":"var(--ah-card)",
              border:active?"1.5px solid rgba(139,92,246,0.38)":"1.5px solid var(--ah-border)",
              textAlign:"right",transition:"all 0.15s",position:"relative",overflow:"hidden",
            }}>
              {active && <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:"radial-gradient(circle,rgba(139,92,246,0.16) 0%,transparent 70%)",pointerEvents:"none"}}/>}
              <div style={{color:active?"#a78bfa":"var(--ah-muted)",marginBottom:10,transition:"color 0.13s"}}><Ic n={mode.iconId} s={20}/></div>
              <div style={{fontSize:12,fontWeight:800,color:"var(--ah-text)",marginBottom:2,lineHeight:1.3}}>{mode.label}</div>
              <div style={{fontSize:10,color:"var(--ah-muted)"}}>{mode.shortDesc}</div>
            </button>
          );
        })}
      </div>
      <div style={{padding:"0 20px 20px",fontSize:10,color:"var(--ah-muted)",textAlign:"center",lineHeight:1.7}}>هوش مصنوعی ممکن است اشتباه کند. اطلاعات مهم را بررسی کنید.</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// CHAT VIEW
// ══════════════════════════════════════════════════════════════════
function ChatView({ messages, input, onInputChange, onSend, deepThinking, onToggleDeep, mode }:
  { messages:Message[]; input:string; onInputChange:(v:string)=>void; onSend:()=>void; deepThinking:boolean; onToggleDeep:()=>void; mode:CreationMode|null }) {
  const bot = useRef<HTMLDivElement>(null);
  useEffect(()=>{ bot.current?.scrollIntoView({behavior:"smooth"}); },[messages]);
  return (
    <>
      <div style={{flex:1,overflowY:"auto",padding:"14px 16px",display:"flex",flexDirection:"column",gap:4}} className="ah-scroll">
        {messages.map(m=><Bubble key={m.id} msg={m}/>)}
        <div ref={bot}/>
      </div>
      <div style={{padding:"10px 14px 16px",borderTop:"1px solid var(--ah-border)",background:"var(--ah-surface)",flexShrink:0}}>
        <InputBar value={input} onChange={onInputChange} onSend={onSend} placeholder={mode?.placeholder??"پیام بعدی را بنویسید..."} deepThinking={deepThinking} onToggleDeep={onToggleDeep} compact/>
        <div style={{fontSize:10,color:"var(--ah-muted)",textAlign:"center",marginTop:7,lineHeight:1.6}}>هوش مصنوعی ممکن است اشتباه کند. اطلاعات مهم را بررسی کنید.</div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// HISTORY VIEW
// ══════════════════════════════════════════════════════════════════
function HistoryView({ onOpenConv, onNewChat }: { onOpenConv:(c:Conversation)=>void; onNewChat:()=>void }) {
  const [q, setQ] = useState("");
  const [menuId, setMenuId] = useState<string|null>(null);
  const groups = ["today","yesterday","week","older"] as const;
  const filtered = DEMO_CONVS.filter(c=>q===""||c.title.includes(q)||c.preview.includes(q));
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"16px 16px 10px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{fontSize:16,fontWeight:800,color:"var(--ah-text)"}}>تاریخچه چت‌ها</div>
          <button onClick={onNewChat} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:11,cursor:"pointer",background:"rgba(139,92,246,0.12)",border:"1px solid rgba(139,92,246,0.28)",color:"#a78bfa",fontSize:11,fontWeight:700,fontFamily:"Vazirmatn"}}>
            <Ic n="plus" s={13}/> چت جدید
          </button>
        </div>
        {/* Search */}
        <div style={{display:"flex",alignItems:"center",gap:8,background:"var(--ah-card)",border:"1px solid var(--ah-border)",borderRadius:12,padding:"9px 12px"}}>
          <Ic n="search" s={15} w={1.8}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="جستجو در تاریخچه..." style={{flex:1,background:"none",border:"none",color:"var(--ah-text)",fontSize:13,fontFamily:"Vazirmatn",outline:"none"}}/>
          {q&&<button onClick={()=>setQ("")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--ah-muted)",display:"flex",padding:0}}><Ic n="close" s={13}/></button>}
        </div>
      </div>
      {/* List */}
      <div style={{flex:1,overflowY:"auto",padding:"0 16px 20px"}} className="ah-scroll">
        {groups.map(g=>{
          const items = filtered.filter(c=>c.group===g);
          if(!items.length)return null;
          return (
            <div key={g} style={{marginBottom:20}}>
              <div style={{fontSize:10,fontWeight:700,color:"var(--ah-muted)",letterSpacing:"0.08em",marginBottom:8,padding:"0 2px"}}>{GROUP_LABELS[g]}</div>
              {items.map(c=>{
                const modeInfo = CREATION_MODES.find(m=>m.id===c.modeId);
                const model = AI_MODELS.find(m=>m.id===c.modelId);
                return (
                  <div key={c.id} style={{position:"relative",marginBottom:4}}>
                    <div onClick={()=>onOpenConv(c)} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")onOpenConv(c);}} style={{
                      width:"100%",display:"block",padding:"13px 14px",
                      background:"var(--ah-card)",border:"1px solid var(--ah-border)",
                      borderRadius:14,cursor:"pointer",textAlign:"right",transition:"all 0.13s",boxSizing:"border-box",
                    }} className="ah-hist-card">
                      <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                        {modeInfo && <div style={{color:"rgba(139,92,246,0.65)",flexShrink:0,marginTop:1}}><Ic n={modeInfo.iconId} s={15}/></div>}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"space-between",marginBottom:4}}>
                            <div style={{fontSize:13,fontWeight:700,color:"var(--ah-text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.title}</div>
                            <div style={{fontSize:10,color:"var(--ah-muted)",flexShrink:0}}>{c.updatedAt}</div>
                          </div>
                          <div style={{fontSize:11,color:"var(--ah-muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.5,marginBottom:5}}>{c.preview}</div>
                          <div style={{display:"flex",alignItems:"center",gap:5}}>
                            {model && <PMark provider={model.provider} size={16}/>}
                            <span style={{fontSize:10,color:"var(--ah-muted)"}}>{model?.name}</span>
                          </div>
                        </div>
                        <button onClick={e=>{e.stopPropagation();setMenuId(menuId===c.id?null:c.id);}} style={{background:"none",border:"none",cursor:"pointer",color:"var(--ah-muted)",display:"flex",padding:"2px",flexShrink:0}}>
                          <Ic n="dots" s={16}/>
                        </button>
                      </div>
                    </div>
                    {menuId===c.id&&(
                      <div style={{position:"absolute",left:0,top:"100%",zIndex:20,background:"var(--ah-surface)",border:"1px solid var(--ah-border)",borderRadius:12,padding:"4px",boxShadow:"0 8px 24px rgba(0,0,0,0.4)",minWidth:140,marginTop:4}}>
                        {[{n:"edit",label:"تغییر نام"},{n:"trash",label:"حذف"}].map(item=>(
                          <button key={item.n} onClick={()=>setMenuId(null)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:9,cursor:"pointer",background:"transparent",border:"none",color:item.n==="trash"?"#f87171":"var(--ah-text)",fontSize:12,fontWeight:600,fontFamily:"Vazirmatn",textAlign:"right"}}>
                            <Ic n={item.n} s={14}/>{item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
        {filtered.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"var(--ah-muted)",fontSize:13}}>چتی یافت نشد</div>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// PROJECTS VIEW
// ══════════════════════════════════════════════════════════════════
function ProjectsView({ onOpenProject, onNewProject }: { onOpenProject:(p:Project)=>void; onNewProject:()=>void }) {
  const [q, setQ] = useState("");
  const filtered = DEMO_PROJECTS.filter(p=>q===""||p.title.includes(q)||p.description.includes(q));
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"16px 16px 10px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{fontSize:16,fontWeight:800,color:"var(--ah-text)"}}>پروژه‌ها</div>
          <button onClick={onNewProject} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:11,cursor:"pointer",background:"rgba(139,92,246,0.12)",border:"1px solid rgba(139,92,246,0.28)",color:"#a78bfa",fontSize:11,fontWeight:700,fontFamily:"Vazirmatn"}}>
            <Ic n="plus" s={13}/> پروژه جدید
          </button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,background:"var(--ah-card)",border:"1px solid var(--ah-border)",borderRadius:12,padding:"9px 12px"}}>
          <Ic n="search" s={15} w={1.8}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="جستجو در پروژه‌ها..." style={{flex:1,background:"none",border:"none",color:"var(--ah-text)",fontSize:13,fontFamily:"Vazirmatn",outline:"none"}}/>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"4px 16px 24px"}} className="ah-scroll">
        {filtered.map(p=>{
          const model = AI_MODELS.find(m=>m.id===p.modelId);
          const modeInfo = CREATION_MODES.find(m=>m.id===p.modeId);
          return (
            <button key={p.id} onClick={()=>onOpenProject(p)} className="ah-proj-card" style={{
              width:"100%",display:"block",marginBottom:10,padding:"16px",borderRadius:16,cursor:"pointer",
              background:"var(--ah-card)",border:`1px solid ${p.accentColor}22`,textAlign:"right",transition:"all 0.15s",
            }}>
              <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                {/* Color accent dot */}
                <div style={{width:40,height:40,borderRadius:13,background:`${p.accentColor}18`,border:`1.5px solid ${p.accentColor}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:p.accentColor}}>
                  {modeInfo ? <Ic n={modeInfo.iconId} s={18}/> : <Ic n="folder" s={18}/>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:800,color:"var(--ah-text)",marginBottom:4}}>{p.title}</div>
                  <div style={{fontSize:11,color:"var(--ah-muted)",lineHeight:1.5,marginBottom:8}}>{p.description}</div>
                  <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      {model&&<PMark provider={model.provider} size={16}/>}
                      <span style={{fontSize:10,color:"var(--ah-muted)"}}>{model?.name}</span>
                    </div>
                    <span style={{fontSize:10,color:"var(--ah-muted)",opacity:0.7}}>•</span>
                    <span style={{fontSize:10,color:"var(--ah-muted)"}}>{FA(String(p.conversationIds.length))} مکالمه</span>
                    <span style={{fontSize:10,color:"var(--ah-muted)",opacity:0.7}}>•</span>
                    <span style={{fontSize:10,color:"var(--ah-muted)"}}>آپدیت {p.updatedAt}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
        {filtered.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"var(--ah-muted)",fontSize:13}}>پروژه‌ای یافت نشد</div>}
        {/* New project CTA */}
        <button onClick={onNewProject} style={{width:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,padding:"24px",borderRadius:16,cursor:"pointer",background:"transparent",border:"1.5px dashed var(--ah-border)",color:"var(--ah-muted)",marginTop:4}}>
          <Ic n="plus" s={22}/>
          <div style={{fontSize:13,fontWeight:700,fontFamily:"Vazirmatn"}}>ساخت پروژه جدید</div>
          <div style={{fontSize:11,fontFamily:"Vazirmatn",textAlign:"center",lineHeight:1.6}}>مکالمات، فایل‌ها و خروجی‌ها را در یک پروژه سازمان‌دهی کنید</div>
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// NEW PROJECT SHEET
// ══════════════════════════════════════════════════════════════════
function NewProjectSheet({ modelId, onClose }: { modelId:string; onClose:()=>void }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div style={{background:"var(--ah-surface)",borderRadius:"22px 22px 0 0",borderTop:"1px solid var(--ah-border)",padding:"20px 20px 36px",maxHeight:"70vh"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div style={{fontSize:16,fontWeight:800,color:"var(--ah-text)"}}>پروژه جدید</div>
          <button onClick={onClose} style={{background:"var(--ah-card)",border:"1px solid var(--ah-border)",borderRadius:10,width:32,height:32,cursor:"pointer",color:"var(--ah-muted)",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="close" s={14}/></button>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--ah-muted)",marginBottom:6}}>نام پروژه</div>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="مثال: راه‌اندازی فروشگاه اینترنتی" style={{width:"100%",background:"var(--ah-card)",border:"1px solid var(--ah-border)",borderRadius:12,padding:"11px 14px",color:"var(--ah-text)",fontSize:13,fontFamily:"Vazirmatn",outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--ah-muted)",marginBottom:6}}>توضیحات (اختیاری)</div>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="هدف و محتوای این پروژه را توضیح دهید..." rows={3} style={{width:"100%",background:"var(--ah-card)",border:"1px solid var(--ah-border)",borderRadius:12,padding:"11px 14px",color:"var(--ah-text)",fontSize:13,fontFamily:"Vazirmatn",outline:"none",resize:"none",boxSizing:"border-box"}}/>
        </div>
        <button onClick={onClose} disabled={!title.trim()} style={{width:"100%",padding:"13px",borderRadius:14,border:"none",cursor:title.trim()?"pointer":"default",background:title.trim()?"linear-gradient(135deg,#7c3aed,#5b21b6)":"var(--ah-border)",color:title.trim()?"#fff":"var(--ah-muted)",fontSize:14,fontWeight:800,fontFamily:"Vazirmatn"}}>
          ساخت پروژه
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// EXPLORE VIEW — model & tool catalog
// ══════════════════════════════════════════════════════════════════
function ExploreView({ currentModelId, onSelectModel }: { currentModelId:string; onSelectModel:(id:string)=>void }) {
  const [prov, setProv] = useState("all");
  const [cap, setCap] = useState("all");
  const caps = ["all","reasoning","coding","vision","fast","writing","translation","doc-analysis"];
  const filtered = AI_MODELS.filter(m=>
    (prov==="all"||m.provider===prov) &&
    (cap==="all"||m.capabilities.includes(cap))
  );
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"16px 16px 8px",flexShrink:0}}>
        <div style={{fontSize:16,fontWeight:800,color:"var(--ah-text)",marginBottom:4}}>کشف مدل‌ها</div>
        <div style={{fontSize:11,color:"var(--ah-muted)",marginBottom:14}}>{FA(String(AI_MODELS.length))} مدل از {FA(String(PROVIDERS.length))} ارائه‌دهنده برتر جهان</div>
        {/* Provider tabs */}
        <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:8,paddingBottom:2}} className="ah-noscroll">
          {["all",...PROVIDERS].map(p=>(
            <button key={p} onClick={()=>setProv(p)} style={{padding:"5px 12px",borderRadius:20,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,background:prov===p?"rgba(139,92,246,0.15)":"transparent",border:prov===p?"1.5px solid rgba(139,92,246,0.4)":"1.5px solid var(--ah-border)",color:prov===p?"#c4b5fd":"var(--ah-muted)",fontSize:11,fontWeight:700,fontFamily:"Vazirmatn"}}>{p==="all"?"همه":p}</button>
          ))}
        </div>
        {/* Capability chips */}
        <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:2}} className="ah-noscroll">
          {caps.map(c=>(
            <button key={c} onClick={()=>setCap(c)} style={{padding:"4px 10px",borderRadius:20,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,background:cap===c?"rgba(0,214,176,0.12)":"transparent",border:cap===c?"1px solid rgba(0,214,176,0.4)":"1px solid var(--ah-border)",color:cap===c?"#00D6B0":"var(--ah-muted)",fontSize:10,fontWeight:700,fontFamily:"Vazirmatn"}}>{c==="all"?"همه قابلیت‌ها":CAPABILITY_LABELS[c]??c}</button>
          ))}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"8px 16px 24px"}} className="ah-scroll">
        <div style={{fontSize:11,color:"var(--ah-muted)",marginBottom:10}}>{FA(String(filtered.length))} مدل</div>
        {filtered.map(m=>{
          const active = m.id===currentModelId;
          return (
            <div key={m.id} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",marginBottom:6,background:"var(--ah-card)",border:active?"1.5px solid rgba(139,92,246,0.35)":"1px solid var(--ah-border)",borderRadius:16}}>
              <PMark provider={m.provider} size={44}/>
              <div style={{flex:1,textAlign:"right",minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end",marginBottom:3,flexWrap:"wrap"}}>
                  {m.badge==="pro"&&<span style={{fontSize:9,fontWeight:800,padding:"1px 5px",borderRadius:4,background:"rgba(251,191,36,0.14)",color:"#fbbf24"}}>PRO</span>}
                  {m.badge==="new"&&<span style={{fontSize:9,fontWeight:800,padding:"1px 5px",borderRadius:4,background:"rgba(139,92,246,0.14)",color:"#a78bfa"}}>جدید</span>}
                  {m.contextWindow&&<span style={{fontSize:9,color:"var(--ah-muted)",padding:"1px 5px",background:"var(--ah-input)",borderRadius:4}}>{m.contextWindow}</span>}
                  <span style={{fontSize:13,fontWeight:800,color:"var(--ah-text)"}}>{m.name}</span>
                </div>
                <div style={{fontSize:10,color:"var(--ah-muted)",lineHeight:1.5,marginBottom:6}}>{m.desc}</div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
                  {m.capabilities.slice(0,4).map(c=><span key={c} style={{fontSize:9,padding:"1px 6px",borderRadius:10,background:"rgba(139,92,246,0.07)",border:"1px solid rgba(139,92,246,0.14)",color:"rgba(167,139,250,0.75)"}}>{CAPABILITY_LABELS[c]??c}</span>)}
                </div>
              </div>
              <button onClick={()=>onSelectModel(m.id)} style={{padding:"7px 12px",borderRadius:10,border:"none",cursor:"pointer",background:active?"rgba(139,92,246,0.15)":"rgba(139,92,246,0.1)",color:active?"#c4b5fd":"#a78bfa",fontSize:11,fontWeight:700,fontFamily:"Vazirmatn",flexShrink:0}}>
                {active?"فعال":"انتخاب"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// BOTTOM NAVIGATION
// ══════════════════════════════════════════════════════════════════
type AhTab = "home" | "history" | "projects" | "explore";
const AH_TABS: { id:AhTab; label:string; icon:string }[] = [
  { id:"home",     label:"چت",       icon:"chat"    },
  { id:"history",  label:"تاریخچه",  icon:"clock"   },
  { id:"projects", label:"پروژه‌ها", icon:"folder"  },
  { id:"explore",  label:"کشف",      icon:"compass" },
];

// ══════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════════
export default function AnHooshScreen({ onBack }: { onBack: () => void }) {
  const [tab, setTab]               = useState<AhTab>("home");
  const [modelId, setModelId]       = useState("gpt-4o-mini");
  const [showModels, setShowModels] = useState(false);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState("");
  const [deepThink, setDeepThink]   = useState(false);
  const [activeMode, setActiveMode] = useState<CreationMode|null>(null);
  const [filterCat, setFilterCat]   = useState("all");
  const [showNewProj, setShowNewProj] = useState(false);

  // Device back button: close panels first, then exit to main app
  useBackHandler(() => {
    if (showModels) { setShowModels(false); return; }
    if (showNewProj) { setShowNewProj(false); return; }
    onBack();
  });

  const inChat = messages.length > 0;
  const model = AI_MODELS.find(m=>m.id===modelId)!;

  const send = useCallback(() => {
    if(!input.trim())return;
    const u: Message = { id:`u${Date.now()}`, role:"user", text:input.trim(), ts:new Date() };
    const t: Message = { id:`t${Date.now()}`, role:"ai", text:"", thinking:true, modelId, ts:new Date() };
    setMessages(prev=>[...prev,u,t]);
    setInput("");
    const d = deepThink ? 2400+Math.random()*600 : 900+Math.random()*500;
    setTimeout(()=>{
      setMessages(prev=>prev.filter(m=>!m.thinking).concat({ id:`a${Date.now()}`, role:"ai", text:randReply(), modelId, ts:new Date() }));
    }, d);
  }, [input, modelId, deepThink]);

  const newChat = useCallback(()=>{ setMessages([]); setInput(""); setActiveMode(null); setTab("home"); }, []);

  const handleSelectMode = (mode: CreationMode) => {
    if(mode.id==="__clear__"){ setActiveMode(null); return; }
    setActiveMode(prev => prev?.id===mode.id ? null : mode);
  };

  return (
    <>
      <style>{`
        .ah-root{
          /* Deep indigo-navy — premium, not pure black */
          --ah-bg:#0F1020; --ah-surface:#161728; --ah-card:#1C1E30;
          --ah-input:#222438; --ah-border:rgba(100,100,200,0.16);
          --ah-border-acc:rgba(139,92,246,0.28);
          --ah-text:#E8E6F8; --ah-muted:rgba(180,178,230,0.55); --ah-accent:#8b5cf6;
        }
        .light-theme .ah-root{
          --ah-bg:#f5f5fb; --ah-surface:#ffffff; --ah-card:#f0f0f8;
          --ah-input:#e8e8f2; --ah-border:rgba(0,0,0,0.08);
          --ah-border-acc:rgba(139,92,246,0.22);
          --ah-text:#18181e; --ah-muted:rgba(24,24,30,0.44);
        }
        @keyframes ahBounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}
        .ah-scroll::-webkit-scrollbar{width:2px}
        .ah-scroll::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.2);border-radius:2px}
        .ah-noscroll::-webkit-scrollbar{height:0;display:none}
        .ah-noscroll{scrollbar-width:none}
        .ah-ico-btn{background:none;border:none;cursor:pointer;width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;color:var(--ah-muted);transition:background 0.13s}
        .ah-ico-btn:hover{background:rgba(255,255,255,0.06)}
        .ah-send-btn{width:36px;height:36px;border-radius:11px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.14s}
        .ah-send-btn:hover:not(:disabled){transform:scale(1.06)}
        .ah-send-btn:active:not(:disabled){transform:scale(0.95)}
        .ah-send-btn:disabled{cursor:default}
        .ah-deep-btn{display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:9px;cursor:pointer;background:transparent;border:1.5px solid var(--ah-border);color:var(--ah-muted);font-size:11px;font-weight:700;font-family:Vazirmatn;transition:all 0.13s}
        .ah-deep-btn.on{background:rgba(139,92,246,0.14);border-color:rgba(139,92,246,0.4);color:#a78bfa}
        .ah-input-wrap{transition:border-color 0.14s}
        .ah-input-wrap:focus-within{border-color:rgba(139,92,246,0.4)!important}
        .ah-input-wrap textarea{resize:none;scrollbar-width:none}
        .ah-input-wrap textarea::-webkit-scrollbar{width:0}
        .ah-input-wrap textarea:focus{outline:none}
        .ah-input-wrap textarea::placeholder{color:var(--ah-muted)}
        .ah-mode-card:hover{border-color:rgba(139,92,246,0.32)!important;background:rgba(139,92,246,0.07)!important}
        .ah-hist-card:hover{background:rgba(139,92,246,0.06)!important;border-color:rgba(139,92,246,0.22)!important}
        .ah-proj-card:hover{border-color:rgba(139,92,246,0.25)!important}
        .ah-bnav-btn{display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 12px;border:none;cursor:pointer;background:transparent;color:var(--ah-muted);font-size:10px;font-weight:700;font-family:Vazirmatn;transition:color 0.14s;border-radius:12px}
        .ah-bnav-btn.active{color:#a78bfa}
      `}</style>

      <div className="ah-root" dir="rtl" style={{ display:"flex", flexDirection:"column", height:"100%", background:"var(--ah-bg)", fontFamily:"Vazirmatn,sans-serif", position:"relative", overflow:"hidden" }}>

        {/* ── HEADER ── */}
        <header style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 14px", background:"var(--ah-surface)", borderBottom:"1px solid var(--ah-border)", flexShrink:0 }}>
          <button onClick={onBack} style={{ display:"flex",alignItems:"center",gap:4,background:"var(--ah-card)",border:"1px solid var(--ah-border)",borderRadius:11,padding:"6px 10px",cursor:"pointer",color:"var(--ah-muted)",fontSize:11,fontWeight:700,fontFamily:"Vazirmatn",flexShrink:0 }}>
            <Ic n="back" s={13}/><span>آن‌پرداز</span>
          </button>

          {/* Model selector — center, always visible */}
          <button onClick={()=>setShowModels(true)} style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"var(--ah-card)",border:"1px solid var(--ah-border-acc)",borderRadius:14,padding:"8px 12px",cursor:"pointer",transition:"border-color 0.13s" }}>
            <PMark provider={model.provider} size={26}/>
            <span style={{ fontSize:13,fontWeight:800,color:"var(--ah-text)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:130 }}>{model.name}</span>
            <Ic n="chevron" s={13} w={2}/>
          </button>

          {/* New chat (when in chat) */}
          {inChat && (
            <button onClick={newChat} style={{ background:"var(--ah-card)",border:"1px solid var(--ah-border)",borderRadius:11,width:36,height:36,cursor:"pointer",color:"var(--ah-muted)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              <Ic n="plus" s={16}/>
            </button>
          )}
        </header>

        {/* ── Chat mode breadcrumb ── */}
        {inChat && tab==="home" && (
          <div style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 14px",background:"var(--ah-surface)",borderBottom:"1px solid var(--ah-border)",flexShrink:0 }}>
            <button onClick={newChat} style={{ display:"flex",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",color:"var(--ah-muted)",fontSize:11,fontWeight:700,fontFamily:"Vazirmatn",padding:0 }}>
              <Ic n="plus" s={12}/> چت جدید
            </button>
            {activeMode && <>
              <div style={{flex:1,height:1,background:"var(--ah-border)"}}/>
              <span style={{display:"flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.22)",color:"#a78bfa",fontSize:11,fontWeight:700}}>
                <Ic n={activeMode.iconId} s={11}/>{activeMode.label}
              </span>
            </>}
          </div>
        )}

        {/* ── MAIN CONTENT ── */}
        {tab==="home" && (
          inChat
            ? <ChatView messages={messages} input={input} onInputChange={setInput} onSend={send} deepThinking={deepThink} onToggleDeep={()=>setDeepThink(v=>!v)} mode={activeMode}/>
            : <HomeView activeMode={activeMode} onSelectMode={handleSelectMode} onSend={send} input={input} onInputChange={setInput} deepThinking={deepThink} onToggleDeep={()=>setDeepThink(v=>!v)} filterCat={filterCat} onFilterCat={setFilterCat}/>
        )}
        {tab==="history"  && <HistoryView onOpenConv={c=>{setMessages([{id:"demo",role:"ai",text:c.preview,modelId:c.modelId,ts:new Date()}]);setTab("home");}} onNewChat={newChat}/>}
        {tab==="projects" && <ProjectsView onOpenProject={()=>setTab("home")} onNewProject={()=>setShowNewProj(true)}/>}
        {tab==="explore"  && <ExploreView currentModelId={modelId} onSelectModel={id=>{setModelId(id);setTab("home");}}/>}

        {/* ── BOTTOM NAVIGATION ── */}
        <nav style={{ display:"flex",borderTop:"1px solid var(--ah-border)",background:"var(--ah-surface)",flexShrink:0 }}>
          {AH_TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className={`ah-bnav-btn${tab===t.id?" active":""}`} style={{flex:1}}>
              <Ic n={t.icon} s={18} w={tab===t.id?2:1.6}/>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        {/* ── OVERLAYS ── */}
        {showModels   && <ModelSheet current={modelId} onSelect={setModelId} onClose={()=>setShowModels(false)}/>}
        {showNewProj  && <NewProjectSheet modelId={modelId} onClose={()=>setShowNewProj(false)}/>}
      </div>
    </>
  );
}
