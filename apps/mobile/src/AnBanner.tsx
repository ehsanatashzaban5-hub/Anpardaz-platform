import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useBackHandler } from "./backHandler";
import { bannerApi, bannerMediaUrl, bannerMessageMediaUrl } from "./bannerApi";

/* ═══════════════════════════════════════════════════════════════
   آن بنر  |  AN BANNER — Iranian Classifieds Marketplace
   Complete Design System + Product Architecture
   RTL · Persian · Mobile-First (390×844)
═══════════════════════════════════════════════════════════════ */

/* ─── Utilities ──────────────────────────────────────────────────── */
const toFaD = (s: string | number) =>
  String(s).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]);

const fmtPrice = (n: number, mode?: string): string => {
  if (mode === "free") return "رایگان";
  if (mode === "swap") return "معاوضه";
  if (n === 0) return "توافقی";
  if (n >= 1_000_000_000) return toFaD((n / 1_000_000_000).toFixed(1)) + " میلیارد تومان";
  if (n >= 1_000_000) return toFaD((n / 1_000_000).toFixed(1)) + " میلیون تومان";
  return new Intl.NumberFormat("fa-IR").format(n) + " تومان";
};

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 2) return "همین الان";
  if (m < 60) return toFaD(m) + " دقیقه پیش";
  if (h < 24) return toFaD(h) + " ساعت پیش";
  if (d < 30) return toFaD(d) + " روز پیش";
  return toFaD(Math.floor(d / 30)) + " ماه پیش";
};

const condLabel = (c: string) =>
  ({ "new": "نو", "like-new": "در حد نو", "good": "خوب", "used": "کارکرده", "for-parts": "قطعات" }[c] ?? c);
const condColor = (c: string) =>
  ({ "new": "#059669", "like-new": "#2563EB", "good": "#D97706", "used": "#6B6B6B", "for-parts": "#9E9E9E" }[c] ?? "#6B6B6B");
const condBg = (c: string) =>
  ({ "new": "rgba(5,150,105,0.1)", "like-new": "rgba(37,99,235,0.1)", "good": "rgba(217,119,6,0.1)", "used": "rgba(107,107,107,0.09)", "for-parts": "rgba(158,158,158,0.1)" }[c] ?? "rgba(107,107,107,0.09)");

const px = (p: number) => `${p}px`;

/* Format raw digit string as Persian thousands-separated display value */
function formatPersianPrice(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const n = parseInt(digits, 10);
  if (isNaN(n)) return "";
  // English thousands-separated, then replace , → . and convert to Persian digits
  return toFaD(n.toLocaleString("en-US").replace(/,/g, "."));
}
/* Strip any non-digit char (handles Persian digits, dots, commas) back to raw ASCII digits */
function parsePriceInput(val: string): string {
  return val.replace(/[^\d۰-۹]/g, "").replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
}

/* ─── Iran City System ───────────────────────────────────────────── */
const IRAN_PROVINCES: { id: string; name: string; cities: { id: string; name: string }[] }[] = [
  { id: "tehran", name: "تهران", cities: [
    { id: "tehran", name: "تهران" }, { id: "shemiranat", name: "شمیرانات" }, { id: "shahriar", name: "شهریار" },
    { id: "eslamshahr", name: "اسلامشهر" }, { id: "robat-karim", name: "رباط‌کریم" }, { id: "varamin", name: "ورامین" },
    { id: "pakdasht", name: "پاکدشت" }, { id: "damavand", name: "دماوند" }, { id: "firuzkooh", name: "فیروزکوه" },
    { id: "qods", name: "قدس" }, { id: "malard", name: "ملارد" }, { id: "pardis", name: "پردیس" },
    { id: "pishva", name: "پیشوا" }, { id: "baharestan", name: "بهارستان" }, { id: "qarchak", name: "قرچک" },
    { id: "andisheh", name: "اندیشه" }, { id: "lavasan", name: "لواسان" }, { id: "rudehen", name: "رودهن" },
  ]},
  { id: "alborz", name: "البرز", cities: [
    { id: "karaj", name: "کرج" }, { id: "fardis", name: "فردیس" }, { id: "hashtgerd", name: "هشتگرد" },
    { id: "nazar-abad", name: "نظرآباد" }, { id: "eshtehard", name: "اشتهارد" }, { id: "goldasht", name: "گلدشت" },
    { id: "mahdasht", name: "ماهدشت" }, { id: "taleghan", name: "طالقان" },
  ]},
  { id: "isfahan", name: "اصفهان", cities: [
    { id: "isfahan", name: "اصفهان" }, { id: "kashan", name: "کاشان" }, { id: "khomeyni-shahr", name: "خمینی‌شهر" },
    { id: "najafabad", name: "نجف‌آباد" }, { id: "shahinshahr", name: "شاهین‌شهر" }, { id: "zarinshahr", name: "زرین‌شهر" },
    { id: "mobarakeh", name: "مبارکه" }, { id: "ardestan", name: "اردستان" }, { id: "naein", name: "نائین" },
    { id: "natanz", name: "نطنز" }, { id: "fereydunshahr", name: "فریدون‌شهر" }, { id: "golpayegan", name: "گلپایگان" },
    { id: "khansar", name: "خوانسار" }, { id: "dehaghan", name: "دهاقان" }, { id: "meymeh", name: "میمه" },
    { id: "shahrezah", name: "شهرضا" }, { id: "fereydan", name: "فریدن" }, { id: "tiran", name: "تیران" },
    { id: "lenjan", name: "لنجان" }, { id: "semirom", name: "سمیرم" },
  ]},
  { id: "east-azerbaijan", name: "آذربایجان شرقی", cities: [
    { id: "tabriz", name: "تبریز" }, { id: "maragheh", name: "مراغه" }, { id: "marand", name: "مرند" },
    { id: "ahar", name: "اهر" }, { id: "mianeh", name: "میانه" }, { id: "sarab", name: "سراب" },
    { id: "shabestar", name: "شبستر" }, { id: "bostanabad", name: "بستان‌آباد" }, { id: "bonab", name: "بناب" },
    { id: "varzaqan", name: "ورزقان" }, { id: "hashtrood", name: "هشترود" }, { id: "jolfa", name: "جلفا" },
    { id: "kaleybar", name: "کلیبر" }, { id: "azarshahr", name: "آذرشهر" }, { id: "heris", name: "هریس" },
    { id: "osku", name: "اسکو" }, { id: "charavymaq", name: "چاراویماق" },
  ]},
  { id: "west-azerbaijan", name: "آذربایجان غربی", cities: [
    { id: "urmia", name: "ارومیه" }, { id: "khoy", name: "خوی" }, { id: "miandoab", name: "میاندوآب" },
    { id: "maku", name: "ماکو" }, { id: "mahabad", name: "مهاباد" }, { id: "salmas", name: "سلماس" },
    { id: "takab", name: "تکاب" }, { id: "naqadeh", name: "نقده" }, { id: "sardasht", name: "سردشت" },
    { id: "poldasht", name: "پلدشت" }, { id: "piranshahr", name: "پیرانشهر" }, { id: "showt", name: "شوط" },
    { id: "chaldoran", name: "چالدران" }, { id: "oshnavieh", name: "اشنویه" }, { id: "bukan", name: "بوکان" },
  ]},
  { id: "ardabil", name: "اردبیل", cities: [
    { id: "ardabil", name: "اردبیل" }, { id: "meshginshahr", name: "مشگین‌شهر" }, { id: "parsabad", name: "پارس‌آباد" },
    { id: "khalkhal", name: "خلخال" }, { id: "bilesavar", name: "بیله‌سوار" }, { id: "namin", name: "نمین" },
    { id: "kowsar", name: "کوثر" }, { id: "sareyn", name: "سرعین" }, { id: "nir", name: "نیر" },
    { id: "germi", name: "گرمی" },
  ]},
  { id: "ilam", name: "ایلام", cities: [
    { id: "ilam", name: "ایلام" }, { id: "abdanan", name: "آبدانان" }, { id: "ivan", name: "ایوان" },
    { id: "dehloran", name: "دهلران" }, { id: "mehran", name: "مهران" }, { id: "malekshahi", name: "ملکشاهی" },
    { id: "darrehshahr", name: "دره‌شهر" }, { id: "shirvan-chardavol", name: "شیروان و چرداول" },
  ]},
  { id: "bushehr", name: "بوشهر", cities: [
    { id: "bushehr", name: "بوشهر" }, { id: "bandar-ganaveh", name: "بندر گناوه" }, { id: "bandar-deylam", name: "بندر دیلم" },
    { id: "kangan", name: "کنگان" }, { id: "jam", name: "جم" }, { id: "dayyer", name: "دیّر" },
    { id: "khormoj", name: "خورموج" }, { id: "tangestan", name: "تنگستان" }, { id: "dashti", name: "دشتی" },
    { id: "dashtestan", name: "دشتستان" },
  ]},
  { id: "chaharmahal", name: "چهارمحال و بختیاری", cities: [
    { id: "shahrekord", name: "شهرکرد" }, { id: "farsan", name: "فارسان" }, { id: "borujen", name: "بروجن" },
    { id: "lordegan", name: "لردگان" }, { id: "ardal", name: "اردل" }, { id: "koohrang", name: "کوهرنگ" },
    { id: "saman", name: "سامان" }, { id: "ben", name: "بن" },
  ]},
  { id: "khorasan-south", name: "خراسان جنوبی", cities: [
    { id: "birjand", name: "بیرجند" }, { id: "nehbandan", name: "نهبندان" }, { id: "ferdows", name: "فردوس" },
    { id: "qaen", name: "قائن" }, { id: "sarbisheh", name: "سربیشه" }, { id: "boshrouyeh", name: "بشرویه" },
    { id: "tabas", name: "طبس" }, { id: "zirkouh", name: "زیرکوه" }, { id: "khusf", name: "خوسف" },
  ]},
  { id: "khorasan-razavi", name: "خراسان رضوی", cities: [
    { id: "mashhad", name: "مشهد" }, { id: "neyshabur", name: "نیشابور" }, { id: "sabzevar", name: "سبزوار" },
    { id: "quchan", name: "قوچان" }, { id: "gonabad", name: "گناباد" }, { id: "torbat-heydarieh", name: "تربت حیدریه" },
    { id: "torbat-jam", name: "تربت جام" }, { id: "kashmar", name: "کاشمر" }, { id: "chenaran", name: "چناران" },
    { id: "fariman", name: "فریمان" }, { id: "khalilabad", name: "خلیل‌آباد" }, { id: "taybad", name: "تایباد" },
    { id: "khaf", name: "خواف" }, { id: "dargaz", name: "درگز" }, { id: "nishapur", name: "نیشابور" },
    { id: "bardaskan", name: "بردسکن" }, { id: "rashtkhar", name: "رشتخوار" }, { id: "sarakhs", name: "سرخس" },
  ]},
  { id: "khorasan-north", name: "خراسان شمالی", cities: [
    { id: "bojnurd", name: "بجنورد" }, { id: "shirvan", name: "شیروان" }, { id: "esfarayen", name: "اسفراین" },
    { id: "jajarm", name: "جاجرم" }, { id: "mane-semelqan", name: "مانه و سملقان" }, { id: "garmeh", name: "گرمه" },
    { id: "raz-jargalan", name: "راز و جرگلان" },
  ]},
  { id: "khuzestan", name: "خوزستان", cities: [
    { id: "ahvaz", name: "اهواز" }, { id: "dezful", name: "دزفول" }, { id: "abadan", name: "آبادان" },
    { id: "khorramshahr", name: "خرمشهر" }, { id: "masjed-soleiman", name: "مسجدسلیمان" },
    { id: "andimeshk", name: "اندیمشک" }, { id: "behbahan", name: "بهبهان" }, { id: "shushtar", name: "شوشتر" },
    { id: "susa", name: "شوش" }, { id: "ramhormoz", name: "رامهرمز" }, { id: "ramshir", name: "رامشیر" },
    { id: "omidiyeh", name: "امیدیه" }, { id: "bandar-imam", name: "بندر امام خمینی" },
    { id: "mahshahr", name: "ماهشهر" }, { id: "hendijan", name: "هندیجان" }, { id: "shadegan", name: "شادگان" },
    { id: "haftkel", name: "هفتکل" }, { id: "izeh", name: "ایذه" }, { id: "baghmalek", name: "باغملک" },
    { id: "lali", name: "لالی" }, { id: "sus", name: "سوسنگرد" }, { id: "hafshejaan", name: "حافظ‌شهر" },
    { id: "agha-jari", name: "آغاجاری" }, { id: "bavi", name: "باوی" }, { id: "minudasht-khuz", name: "کارون" },
  ]},
  { id: "zanjan", name: "زنجان", cities: [
    { id: "zanjan", name: "زنجان" }, { id: "abhar", name: "ابهر" }, { id: "khodabandeh", name: "خدابنده" },
    { id: "ijrud", name: "ایجرود" }, { id: "mahdishahr", name: "ماهنشان" }, { id: "tarom", name: "طارم" },
    { id: "mahneshan", name: "ماهنشان" },
  ]},
  { id: "semnan", name: "سمنان", cities: [
    { id: "semnan", name: "سمنان" }, { id: "shahrud", name: "شاهرود" }, { id: "damghan", name: "دامغان" },
    { id: "garmsar", name: "گرمسار" }, { id: "miaami", name: "میامی" }, { id: "aradan", name: "آرادان" },
    { id: "sorkheh", name: "سرخه" },
  ]},
  { id: "sistan", name: "سیستان و بلوچستان", cities: [
    { id: "zahedan", name: "زاهدان" }, { id: "zabol", name: "زابل" }, { id: "iranshahr", name: "ایرانشهر" },
    { id: "chabahar", name: "چابهار" }, { id: "saravan", name: "سراوان" }, { id: "khash", name: "خاش" },
    { id: "nikshahr", name: "نیکشهر" }, { id: "konarak", name: "کنارک" }, { id: "sarbaz", name: "سرباز" },
    { id: "dalgan", name: "دلگان" }, { id: "mirjaveh", name: "میرجاوه" }, { id: "qasr-qand", name: "قصرقند" },
    { id: "hirmand", name: "هیرمند" }, { id: "nehbandan-sis", name: "نهبندان" },
  ]},
  { id: "fars", name: "فارس", cities: [
    { id: "shiraz", name: "شیراز" }, { id: "marvdasht", name: "مرودشت" }, { id: "fasa", name: "فسا" },
    { id: "kazerun", name: "کازرون" }, { id: "jahrom", name: "جهرم" }, { id: "lar", name: "لار" },
    { id: "abadeh", name: "آباده" }, { id: "firozabad", name: "فیروزآباد" }, { id: "darab", name: "داراب" },
    { id: "neyriz", name: "نیریز" }, { id: "estahban", name: "استهبان" }, { id: "lamerd", name: "لامرد" },
    { id: "arsanjan", name: "ارسنجان" }, { id: "pasargad", name: "پاسارگاد" }, { id: "bavanat", name: "بوانات" },
    { id: "kavar", name: "کوار" }, { id: "khorrambid", name: "خرم‌بید" }, { id: "mamasani", name: "ممسنی" },
    { id: "sarvestan", name: "سروستان" }, { id: "khonj", name: "خنج" }, { id: "mehr", name: "مهر" },
    { id: "zarrindasht", name: "زرین‌دشت" }, { id: "rostam", name: "رستم" },
  ]},
  { id: "qazvin", name: "قزوین", cities: [
    { id: "qazvin", name: "قزوین" }, { id: "takestan", name: "تاکستان" }, { id: "buin-zahra", name: "بوئین‌زهرا" },
    { id: "alborz-qaz", name: "البرز" }, { id: "avaj", name: "آوج" },
  ]},
  { id: "qom", name: "قم", cities: [
    { id: "qom", name: "قم" }, { id: "kahak", name: "کهک" },
  ]},
  { id: "kurdistan", name: "کردستان", cities: [
    { id: "sanandaj", name: "سنندج" }, { id: "saqqez", name: "سقز" }, { id: "marivan", name: "مریوان" },
    { id: "bijar", name: "بیجار" }, { id: "qorveh", name: "قروه" }, { id: "baneh", name: "بانه" },
    { id: "kamyaran", name: "کامیاران" }, { id: "dehgolan", name: "دهگلان" }, { id: "divandareh", name: "دیواندره" },
  ]},
  { id: "kerman", name: "کرمان", cities: [
    { id: "kerman", name: "کرمان" }, { id: "rafsanjan", name: "رفسنجان" }, { id: "sirjan", name: "سیرجان" },
    { id: "jiroft", name: "جیرفت" }, { id: "zarand", name: "زرند" }, { id: "bam", name: "بم" },
    { id: "kahnooj", name: "کهنوج" }, { id: "manujan", name: "منوجان" }, { id: "bardsir", name: "بردسیر" },
    { id: "orzouiyeh", name: "ارزوئیه" }, { id: "anar", name: "انار" }, { id: "ravar", name: "راور" },
    { id: "narmashir", name: "نرماشیر" }, { id: "shahr-babak", name: "شهربابک" }, { id: "baft", name: "بافت" },
  ]},
  { id: "kermanshah", name: "کرمانشاه", cities: [
    { id: "kermanshah", name: "کرمانشاه" }, { id: "kangavar", name: "کنگاور" }, { id: "islamabad-gharb", name: "اسلام‌آباد غرب" },
    { id: "javanrud", name: "جوانرود" }, { id: "paveh", name: "پاوه" }, { id: "sarpol-zahab", name: "سرپل ذهاب" },
    { id: "qasr-shirin", name: "قصرشیرین" }, { id: "sahne", name: "صحنه" }, { id: "sonqor", name: "سنقر" },
    { id: "harsin", name: "هرسین" }, { id: "dalahu", name: "دالاهو" }, { id: "ravansar", name: "روانسر" },
  ]},
  { id: "kohgiluyeh", name: "کهگیلویه و بویراحمد", cities: [
    { id: "yasuj", name: "یاسوج" }, { id: "dehdasht", name: "دهدشت" }, { id: "gachsaran", name: "گچساران" },
    { id: "sisakht", name: "سی‌سخت" }, { id: "dogonbadan", name: "دوگنبدان" }, { id: "basht", name: "بشت" },
    { id: "landeh", name: "لنده" },
  ]},
  { id: "golestan", name: "گلستان", cities: [
    { id: "gorgan", name: "گرگان" }, { id: "gonbad-kavus", name: "گنبد کاووس" }, { id: "aliabad", name: "علی‌آباد کتول" },
    { id: "kordkuy", name: "کردکوی" }, { id: "azadshahr", name: "آزادشهر" }, { id: "minudasht", name: "مینودشت" },
    { id: "ramian", name: "رامیان" }, { id: "galikesh", name: "گالیکش" }, { id: "bandar-torkaman", name: "بندر ترکمن" },
    { id: "bandargaz", name: "بندرگز" }, { id: "maraveh-tapeh", name: "مراوه‌تپه" }, { id: "gomishan", name: "گمیشان" },
    { id: "aq-qala", name: "آق‌قلا" }, { id: "kalale", name: "کلاله" },
  ]},
  { id: "guilan", name: "گیلان", cities: [
    { id: "rasht", name: "رشت" }, { id: "anzali", name: "بندرانزلی" }, { id: "lahijan", name: "لاهیجان" },
    { id: "langarud", name: "لنگرود" }, { id: "astara", name: "آستارا" }, { id: "talesh", name: "تالش" },
    { id: "fooman", name: "فومن" }, { id: "rudbar", name: "رودبار" }, { id: "sowme-sara", name: "صومعه‌سرا" },
    { id: "shaft", name: "شفت" }, { id: "siahkal", name: "سیاهکل" }, { id: "rudsar", name: "رودسر" },
    { id: "astaneh-ashrafieh", name: "آستانه اشرفیه" }, { id: "rezvanshahr", name: "رضوانشهر" },
    { id: "masal", name: "ماسال" }, { id: "amlash", name: "املش" },
  ]},
  { id: "lorestan", name: "لرستان", cities: [
    { id: "khorramabad", name: "خرم‌آباد" }, { id: "borujerd", name: "بروجرد" }, { id: "andimeshk-lor", name: "اندیمشک" },
    { id: "dorud", name: "دورود" }, { id: "aligudarz", name: "الیگودرز" }, { id: "kouhdasht", name: "کوهدشت" },
    { id: "noorabad", name: "نورآباد" }, { id: "poldokhtar", name: "پلدختر" }, { id: "selseleh", name: "سلسله" },
    { id: "azna", name: "ازنا" }, { id: "delfan", name: "دلفان" }, { id: "cegeni", name: "چگنی" },
  ]},
  { id: "mazandaran", name: "مازندران", cities: [
    { id: "sari", name: "ساری" }, { id: "amol", name: "آمل" }, { id: "babol", name: "بابل" },
    { id: "noshahr", name: "نوشهر" }, { id: "chalus", name: "چالوس" }, { id: "qaemshahr", name: "قائمشهر" },
    { id: "babolsar", name: "بابلسر" }, { id: "tonekabon", name: "تنکابن" }, { id: "ramsar", name: "رامسر" },
    { id: "behshahr", name: "بهشهر" }, { id: "neka", name: "نکا" }, { id: "savadkuh", name: "سوادکوه" },
    { id: "juybar", name: "جویبار" }, { id: "mahmudabad", name: "محمودآباد" }, { id: "ghaemshahr", name: "قائمشهر" },
    { id: "galugah", name: "گلوگاه" }, { id: "miandorood", name: "میاندورود" },
  ]},
  { id: "markazi", name: "مرکزی", cities: [
    { id: "arak", name: "اراک" }, { id: "saveh", name: "ساوه" }, { id: "khomein", name: "خمین" },
    { id: "mahallat", name: "محلات" }, { id: "delijan", name: "دلیجان" }, { id: "komijan", name: "کمیجان" },
    { id: "shazand", name: "شازند" }, { id: "tafresh", name: "تفرش" }, { id: "zarandieh", name: "زرندیه" },
    { id: "ashtian", name: "آشتیان" },
  ]},
  { id: "hamadan", name: "همدان", cities: [
    { id: "hamadan", name: "همدان" }, { id: "malayer", name: "ملایر" }, { id: "nahavand", name: "نهاوند" },
    { id: "tuyserkan", name: "تویسرکان" }, { id: "asadabad", name: "اسدآباد" }, { id: "kabudarahang", name: "کبودرآهنگ" },
    { id: "razan", name: "رزن" }, { id: "bahar", name: "بهار" }, { id: "famenin", name: "فامنین" },
  ]},
  { id: "hormozgan", name: "هرمزگان", cities: [
    { id: "bandar-abbas", name: "بندرعباس" }, { id: "minab", name: "میناب" }, { id: "qeshm", name: "قشم" },
    { id: "bandar-lengeh", name: "بندر لنگه" }, { id: "kish", name: "کیش" }, { id: "jask", name: "جاسک" },
    { id: "hormuz", name: "هرمز" }, { id: "abumusa", name: "ابوموسی" }, { id: "parsian", name: "پارسیان" },
    { id: "rudan", name: "رودان" }, { id: "sirik", name: "سیریک" }, { id: "hajiabad", name: "حاجی‌آباد" },
    { id: "bashagard", name: "بشاگرد" },
  ]},
  { id: "yazd", name: "یزد", cities: [
    { id: "yazd", name: "یزد" }, { id: "ardakan", name: "اردکان" }, { id: "meybod", name: "میبد" },
    { id: "abarkuh", name: "ابرکوه" }, { id: "taft", name: "تفت" }, { id: "behabad", name: "بهاباد" },
    { id: "khatam", name: "خاتم" }, { id: "marvast", name: "مروست" }, { id: "mehriz", name: "مهریز" },
    { id: "sadough", name: "صدوق" },
  ]},
];

type CitySelection = { type: "all" } | { type: "cities"; ids: string[] };

function cityLabel(sel: CitySelection): string {
  if (sel.type === "all") return "کل ایران";
  if (sel.ids.length === 0) return "کل ایران";
  if (sel.ids.length === 1) {
    for (const p of IRAN_PROVINCES) {
      const c = p.cities.find(c => c.id === sel.ids[0]);
      if (c) return c.name;
    }
    return sel.ids[0];
  }
  return `${toFaD(sel.ids.length)} شهر`;
}

function listingMatchesCity(l: ABListing, sel: CitySelection): boolean {
  if (sel.type === "all" || sel.ids.length === 0) return true;
  return sel.ids.includes(l.cityId) || sel.ids.includes(l.provinceId ?? "");
}

function abCategoryListingCount(cat: ABCategory): number { const ids=new Set<string>(); const walk=(x:ABCategory)=>{ids.add(x.categoryId);x.children.forEach(walk)};walk(cat); return _ads.filter(a=>ids.has(a.categoryId)).length; }

function cityNameById(cityId: string): string {
  for (const p of IRAN_PROVINCES) {
    const c = p.cities.find(c => c.id === cityId);
    if (c) return c.name;
    if (p.id === cityId) return p.name;
  }
  return cityId;
}

/* ─── Data Architecture (Type System) ───────────────────────────── */
type ABTab = "home" | "fav" | "post" | "msgs" | "me";
type ABView =
  | { t: "home" }
  | { t: "cats" }
  | { t: "cat"; cid: string }
  | { t: "sub"; cid: string; sid: string }
  | { t: "listing"; lid: string }
  | { t: "post"; step?: number }
  | { t: "edit-post"; lid: string }
  | { t: "chat-list" }
  | { t: "chat"; cid: string }
  | { t: "me" }
  | { t: "fav" }
  | { t: "my-listings" }
  | { t: "notifs" }
  | { t: "postchi" }
  | { t: "profile"; uid: string }
  | { t: "search"; q: string }
  | { t: "business"; bid: string }
  | { t: "support" }
  | { t: "terms" }
  | { t: "my-tickets" }
  | { t: "ticket"; tid: string }
  | { t: "new-ticket" }
  | { t: "edit-profile" };

interface ABUser {
  userId: string; name: string; avatar: string; mobile: string;
  verificationStatus: "verified" | "pending" | "unverified";
  accountType: "personal" | "business"; createdAt: string; lastActive: string;
}
interface ABProfile {
  profileId: string; userId: string; displayName: string; avatar: string;
  bio: string; city: string; district: string;
  contactPreferences: { phone: boolean; chat: boolean };
}
interface ABBusiness {
  businessId: string; ownerId: string; businessName: string; logo: string;
  businessType: string; description: string; phone: string;
  address: string; city: string; workingHours: string;
  verificationStatus: "verified" | "pending"; listingCount: number;
}
interface ABCategory {
  categoryId: string; parentId: string | null; level: number; slug: string;
  name: string; icon: string; color: string; emoji: string;
  children: ABCategory[]; listingEnabled: boolean; listingCount: number;
}
interface ABLocation {
  provinceId: string; cityId: string; districtId?: string; neighborhoodId?: string;
  name: string; parentId?: string; latitude?: number; longitude?: number;
}
interface ABMedia {
  mediaId: string; listingId: string; type: "image" | "video";
  url: string; order: number; isCover: boolean; status: "active" | "pending";
}
interface ABListing {
  listingId: string; token: string; ownerId: string; businessId?: string;
  categoryId: string; parentCategoryId: string;
  title: string; description: string; images: string[];
  price: number; priceMode: "fixed" | "negotiable" | "swap" | "free";
  condition: "new" | "like-new" | "good" | "used" | "for-parts";
  cityId: string; provinceId: string; districtId?: string;
  latitude?: number; longitude?: number;
  attributes: Record<string, string>;
  status: "active" | "expired" | "sold" | "draft" | "pending";
  createdAt: string; updatedAt: string; expiresAt: string;
  viewCount: number; favoriteCount: number; messageCount: number;
  contactEnabled: boolean; chatEnabled: boolean;
  verificationStatus: "verified" | "pending" | "none";
  isUrgent?: boolean; isFeatured?: boolean;
}
interface ABConversation {
  conversationId: string; listingId: string; buyerId: string; sellerId: string;
  createdAt: string; lastMessageAt: string; lastMessage: string;
  status: "active" | "archived"; unreadCount: number;
}
interface ABMessage {
  messageId: string; conversationId: string; senderId: string;
  type: "text" | "image" | "offer" | "sticker" | "voice";
  text?: string; media?: string; sticker?: string;
  offerAmount?: number; duration?: number;
  createdAt: string; status: "sent" | "delivered" | "read";
}
interface ABNotification {
  notificationId: string; userId: string;
  type: "message" | "offer" | "view" | "favorite" | "system" | "price-alert";
  title: string; description: string; read: boolean; createdAt: string;
}
interface ABPostchiEvent {
  eventId: string;
  type: "published" | "reviewing" | "rejected" | "edited" | "closed" | "deleted" | "new-message" | "support-reply" | "system" | "security";
  title: string; description: string; read: boolean; createdAt: string;
  listingId?: string; conversationId?: string; reason?: string;
  color?: string;
}
interface ABSearchQuery {
  query: string; categoryId?: string; cityId?: string;
  filters: Record<string, string>;
  sort: "newest" | "cheapest" | "most-expensive" | "most-viewed"; page: number;
}
interface ABFavorite { favoriteId: string; userId: string; listingId: string; createdAt: string; }
interface ABTicket {
  ticketId: string; userId: string; subject: string;
  status: "pending" | "reviewing" | "answered" | "closed";
  createdAt: string; updatedAt: string;
  messages: ABTicketMessage[];
}
interface ABTicketMessage {
  id: string; senderId: "user" | "support"; text: string; createdAt: string;
}
interface ABReport {
  reportId: string; reporterId: string; listingId?: string; userId?: string;
  reason: string; description: string; status: "pending" | "reviewed" | "resolved";
  createdAt: string;
}

/* ─── Static Banner taxonomy (configuration only; listing data comes from the Banner API) ─── */

/* Compact category builder — keeps taxonomy data readable */
function _c(id: string, pid: string | null, lvl: number, name: string, col: string, n: number, ch: ABCategory[] = []): ABCategory {
  return { categoryId: id, parentId: pid, level: lvl, slug: id, name, icon: id, color: col, emoji: "", listingEnabled: true, listingCount: n, children: ch };
}
const RE="#059669", VH="#2563EB", DG="#7C3AED", HK="#D97706", SV="#64748B",
      PR="#EC4899", EN="#0891B2", SC="#16A34A", IN="#374151", JB="#1E40AF";

const AB_CATS: ABCategory[] = [
  /* 1 ─ املاک */
  _c("realestate", null, 0, "املاک", RE, 7200, [
    _c("re-sell-res", "realestate", 1, "فروش مسکونی", RE, 2400, [
      _c("re-sell-apt",    "re-sell-res", 2, "آپارتمان",             RE, 1200, []),
      _c("re-sell-house",  "re-sell-res", 2, "خانه",                 RE,  400, []),
      _c("re-sell-villa",  "re-sell-res", 2, "ویلا",                 RE,  180, []),
      _c("re-sell-land",   "re-sell-res", 2, "زمین",                 RE,  320, []),
      _c("re-sell-old",    "re-sell-res", 2, "کلنگی",                RE,  140, []),
      _c("re-sell-garden", "re-sell-res", 2, "باغ",                  RE,   80, []),
      _c("re-sell-agri",   "re-sell-res", 2, "زمین کشاورزی",        RE,   60, []),
      _c("re-sell-other",  "re-sell-res", 2, "سایر",                 RE,   20, []),
    ]),
    _c("re-rent-res", "realestate", 1, "اجاره مسکونی", RE, 2100, [
      _c("re-rent-apt",   "re-rent-res", 2, "آپارتمان",  RE, 1100, []),
      _c("re-rent-house", "re-rent-res", 2, "خانه",      RE,  350, []),
      _c("re-rent-villa", "re-rent-res", 2, "ویلا",      RE,  120, []),
      _c("re-rent-suite", "re-rent-res", 2, "سوئیت",     RE,  280, []),
      _c("re-rent-room",  "re-rent-res", 2, "اتاق",      RE,  200, []),
      _c("re-rent-other", "re-rent-res", 2, "سایر",      RE,   50, []),
    ]),
    _c("re-sell-com", "realestate", 1, "فروش اداری و تجاری", RE, 1200, [
      _c("re-sc-office",    "re-sell-com", 2, "دفتر کار",     RE, 300, []),
      _c("re-sc-medical",   "re-sell-com", 2, "مطب",          RE,  80, []),
      _c("re-sc-shop",      "re-sell-com", 2, "مغازه",        RE, 350, []),
      _c("re-sc-booth",     "re-sell-com", 2, "غرفه",         RE,  90, []),
      _c("re-sc-warehouse", "re-sell-com", 2, "انبار",        RE, 120, []),
      _c("re-sc-workshop",  "re-sell-com", 2, "کارگاه",       RE, 100, []),
      _c("re-sc-factory",   "re-sell-com", 2, "کارخانه",      RE,  80, []),
      _c("re-sc-indprop",   "re-sell-com", 2, "ملک صنعتی",   RE,  60, []),
      _c("re-sc-agriprop",  "re-sell-com", 2, "ملک کشاورزی", RE,  40, []),
      _c("re-sc-other",     "re-sell-com", 2, "سایر",         RE,  80, []),
    ]),
    _c("re-rent-com", "realestate", 1, "اجاره اداری و تجاری", RE, 900, [
      _c("re-rc-office",    "re-rent-com", 2, "دفتر کار",  RE, 250, []),
      _c("re-rc-medical",   "re-rent-com", 2, "مطب",       RE,  60, []),
      _c("re-rc-shop",      "re-rent-com", 2, "مغازه",     RE, 280, []),
      _c("re-rc-booth",     "re-rent-com", 2, "غرفه",      RE,  70, []),
      _c("re-rc-warehouse", "re-rent-com", 2, "انبار",     RE,  90, []),
      _c("re-rc-workshop",  "re-rent-com", 2, "کارگاه",    RE,  80, []),
      _c("re-rc-factory",   "re-rent-com", 2, "کارخانه",   RE,  50, []),
      _c("re-rc-other",     "re-rent-com", 2, "سایر",      RE,  20, []),
    ]),
    _c("re-short", "realestate", 1, "اجاره کوتاه مدت", RE, 340, [
      _c("re-sh-apt",    "re-short", 2, "آپارتمان و سوئیت", RE, 120, []),
      _c("re-sh-house",  "re-short", 2, "خانه",             RE,  60, []),
      _c("re-sh-villa",  "re-short", 2, "ویلا",             RE,  80, []),
      _c("re-sh-garden", "re-short", 2, "باغ",              RE,  30, []),
      _c("re-sh-lodge",  "re-short", 2, "اقامتگاه",         RE,  30, []),
      _c("re-sh-office", "re-short", 2, "دفتر کار",         RE,  10, []),
      _c("re-sh-edu",    "re-short", 2, "فضای آموزشی",      RE,  10, []),
    ]),
    _c("re-land", "realestate", 1, "زمین و کلنگی", RE, 460, [
      _c("re-land-res",    "re-land", 2, "زمین مسکونی",  RE, 180, []),
      _c("re-land-com",    "re-land", 2, "زمین تجاری",   RE,  80, []),
      _c("re-land-ind",    "re-land", 2, "زمین صنعتی",   RE,  60, []),
      _c("re-land-agri",   "re-land", 2, "زمین کشاورزی", RE,  70, []),
      _c("re-land-garden", "re-land", 2, "باغ",           RE,  40, []),
      _c("re-land-old",    "re-land", 2, "کلنگی",         RE,  30, []),
    ]),
    _c("re-project", "realestate", 1, "پروژه‌های ساخت‌وساز", RE, 280, [
      _c("re-proj-presell", "re-project", 2, "پیش‌فروش",          RE, 120, []),
      _c("re-proj-partner", "re-project", 2, "مشارکت در ساخت",    RE,  80, []),
      _c("re-proj-res",     "re-project", 2, "پروژه مسکونی",      RE,  40, []),
      _c("re-proj-com",     "re-project", 2, "پروژه تجاری",       RE,  20, []),
      _c("re-proj-office",  "re-project", 2, "پروژه اداری",       RE,  20, []),
    ]),
    _c("re-services", "realestate", 1, "خدمات املاک", RE, 180, [
      _c("re-svc-agency",  "re-services", 2, "آژانس املاک",      RE,  60, []),
      _c("re-svc-expert",  "re-services", 2, "کارشناسی ملک",     RE,  30, []),
      _c("re-svc-consult", "re-services", 2, "مشاوره املاک",     RE,  40, []),
      _c("re-svc-legal",   "re-services", 2, "امور حقوقی ملک",  RE,  20, []),
      _c("re-svc-finance", "re-services", 2, "امور مالی ملک",   RE,  15, []),
      _c("re-svc-manage",  "re-services", 2, "مدیریت ملک",       RE,  15, []),
    ]),
  ]),

  /* 2 ─ وسایل نقلیه */
  _c("vehicles", null, 0, "وسایل نقلیه", VH, 9400, [
    _c("veh-cars", "vehicles", 1, "خودرو", VH, 5600, [
      _c("veh-car-passenger", "veh-cars", 2, "سواری", VH, 3200, [
        _c("veh-pass-sedan",   "veh-car-passenger", 3, "سدان",       VH,  800, []),
        _c("veh-pass-hatch",   "veh-car-passenger", 3, "هاچ‌بک",     VH,  400, []),
        _c("veh-pass-suv",     "veh-car-passenger", 3, "شاسی‌بلند",  VH,  720, []),
        _c("veh-pass-cross",   "veh-car-passenger", 3, "کراس‌اوور",  VH,  500, []),
        _c("veh-pass-coupe",   "veh-car-passenger", 3, "کوپه",       VH,   80, []),
        _c("veh-pass-convert", "veh-car-passenger", 3, "کروک",       VH,   30, []),
        _c("veh-pass-station", "veh-car-passenger", 3, "استیشن",     VH,   60, []),
        _c("veh-pass-pickup",  "veh-car-passenger", 3, "وانت",       VH,  610, []),
      ]),
      _c("veh-car-classic", "veh-cars", 2, "خودرو کلاسیک", VH, 150, []),
      _c("veh-car-heavy", "veh-cars", 2, "خودرو سنگین", VH, 620, [
        _c("veh-hvy-truck",   "veh-car-heavy", 3, "کامیون",   VH, 200, []),
        _c("veh-hvy-truck2",  "veh-car-heavy", 3, "کامیونت",  VH, 150, []),
        _c("veh-hvy-semi",    "veh-car-heavy", 3, "کشنده",    VH,  80, []),
        _c("veh-hvy-bus",     "veh-car-heavy", 3, "اتوبوس",   VH,  50, []),
        _c("veh-hvy-minibus", "veh-car-heavy", 3, "مینی‌بوس", VH,  90, []),
        _c("veh-hvy-trailer", "veh-car-heavy", 3, "تریلر",    VH,  50, []),
      ]),
      _c("veh-car-rental",  "veh-cars", 2, "خودرو اجاره‌ای",  VH, 180, []),
      _c("veh-car-damaged", "veh-cars", 2, "خودرو تصادفی",    VH, 320, []),
      _c("veh-car-other",   "veh-cars", 2, "سایر خودروها",    VH, 130, []),
    ]),
    _c("veh-motorcycle", "vehicles", 1, "موتورسیکلت", VH, 1800, [
      _c("veh-moto-city",     "veh-motorcycle", 2, "شهری",            VH, 700, []),
      _c("veh-moto-scooter",  "veh-motorcycle", 2, "اسکوتر",          VH, 280, []),
      _c("veh-moto-sport",    "veh-motorcycle", 2, "اسپرت",           VH, 320, []),
      _c("veh-moto-cross",    "veh-motorcycle", 2, "کراس",            VH, 140, []),
      _c("veh-moto-classic",  "veh-motorcycle", 2, "کلاسیک",          VH,  80, []),
      _c("veh-moto-electric", "veh-motorcycle", 2, "برقی",            VH, 160, []),
      _c("veh-moto-parts",    "veh-motorcycle", 2, "قطعات موتورسیکلت",VH, 120, []),
    ]),
    _c("veh-bicycle", "vehicles", 1, "دوچرخه", VH, 640, [
      _c("veh-bike-city",     "veh-bicycle", 2, "شهری",          VH, 180, []),
      _c("veh-bike-mountain", "veh-bicycle", 2, "کوهستان",        VH, 220, []),
      _c("veh-bike-road",     "veh-bicycle", 2, "جاده",           VH,  80, []),
      _c("veh-bike-kids",     "veh-bicycle", 2, "کودک",           VH,  90, []),
      _c("veh-bike-electric", "veh-bicycle", 2, "برقی",           VH,  40, []),
      _c("veh-bike-parts",    "veh-bicycle", 2, "قطعات و لوازم",  VH,  30, []),
    ]),
    _c("veh-marine", "vehicles", 1, "قایق و وسایل دریایی", VH, 140, [
      _c("veh-marine-boat",    "veh-marine", 2, "قایق",          VH,  60, []),
      _c("veh-marine-jetski",  "veh-marine", 2, "جت‌اسکی",       VH,  40, []),
      _c("veh-marine-engine",  "veh-marine", 2, "موتور دریایی",  VH,  20, []),
      _c("veh-marine-parts",   "veh-marine", 2, "لوازم دریایی",  VH,  20, []),
    ]),
    _c("veh-parts", "vehicles", 1, "قطعات یدکی خودرو", VH, 720, [
      _c("veh-pt-engine",  "veh-parts", 2, "موتور",         VH, 120, []),
      _c("veh-pt-gearbox", "veh-parts", 2, "گیربکس",        VH,  80, []),
      _c("veh-pt-brake",   "veh-parts", 2, "سیستم ترمز",    VH, 100, []),
      _c("veh-pt-susp",    "veh-parts", 2, "سیستم تعلیق",   VH,  90, []),
      _c("veh-pt-elec",    "veh-parts", 2, "برق خودرو",     VH, 110, []),
      _c("veh-pt-body",    "veh-parts", 2, "بدنه",          VH, 130, []),
      _c("veh-pt-light",   "veh-parts", 2, "چراغ",          VH,  60, []),
      _c("veh-pt-other",   "veh-parts", 2, "سایر قطعات",    VH,  30, []),
    ]),
    _c("veh-tire", "vehicles", 1, "لاستیک و رینگ", VH, 280, [
      _c("veh-tire-tire",  "veh-tire", 2, "لاستیک",          VH, 140, []),
      _c("veh-tire-rim",   "veh-tire", 2, "رینگ",            VH,  80, []),
      _c("veh-tire-spare", "veh-tire", 2, "زاپاس",           VH,  30, []),
      _c("veh-tire-acc",   "veh-tire", 2, "لوازم جانبی",     VH,  30, []),
    ]),
    _c("veh-acc", "vehicles", 1, "لوازم جانبی خودرو", VH, 420, [
      _c("veh-acc-av",     "veh-acc", 2, "صوتی و تصویری",   VH, 100, []),
      _c("veh-acc-alarm",  "veh-acc", 2, "دزدگیر",          VH,  60, []),
      _c("veh-acc-camera", "veh-acc", 2, "دوربین",          VH,  80, []),
      _c("veh-acc-cover",  "veh-acc", 2, "روکش",            VH,  50, []),
      _c("veh-acc-mat",    "veh-acc", 2, "کفپوش",           VH,  70, []),
      _c("veh-acc-dec",    "veh-acc", 2, "لوازم تزئینی",    VH,  30, []),
      _c("veh-acc-safety", "veh-acc", 2, "تجهیزات ایمنی",   VH,  30, []),
    ]),
    _c("veh-service", "vehicles", 1, "خدمات خودرو", VH, 380, [
      _c("veh-svc-mechanic",  "veh-service", 2, "مکانیکی",       VH,  80, []),
      _c("veh-svc-electric",  "veh-service", 2, "برق خودرو",    VH,  50, []),
      _c("veh-svc-body",      "veh-service", 2, "صافکاری",       VH,  60, []),
      _c("veh-svc-paint",     "veh-service", 2, "نقاشی",         VH,  40, []),
      _c("veh-svc-wash",      "veh-service", 2, "کارواش",        VH,  50, []),
      _c("veh-svc-detail",    "veh-service", 2, "دیتیلینگ",      VH,  30, []),
      _c("veh-svc-oil",       "veh-service", 2, "تعویض روغن",    VH,  40, []),
      _c("veh-svc-tire",      "veh-service", 2, "لاستیک",        VH,  20, []),
      _c("veh-svc-rescue",    "veh-service", 2, "امداد خودرو",   VH,  10, []),
    ]),
  ]),

  /* 3 ─ کالای دیجیتال */
  _c("digital", null, 0, "کالای دیجیتال", DG, 11200, [
    _c("dig-mobile", "digital", 1, "موبایل", DG, 3800, [
      _c("dig-mob-phone", "dig-mobile", 2, "گوشی موبایل", DG, 2800, [
        _c("dig-mob-android",  "dig-mob-phone", 3, "اندروید",         DG, 900, []),
        _c("dig-mob-iphone",   "dig-mob-phone", 3, "آیفون",           DG, 700, []),
        _c("dig-mob-budget",   "dig-mob-phone", 3, "گوشی اقتصادی",   DG, 400, []),
        _c("dig-mob-mid",      "dig-mob-phone", 3, "گوشی میان‌رده",   DG, 400, []),
        _c("dig-mob-flag",     "dig-mob-phone", 3, "گوشی پرچمدار",   DG, 260, []),
        _c("dig-mob-fold",     "dig-mob-phone", 3, "گوشی تاشو",       DG,  40, []),
      ]),
      _c("dig-mob-acc", "dig-mobile", 2, "لوازم جانبی موبایل", DG, 840, [
        _c("dig-mob-acc-case",    "dig-mob-acc", 3, "قاب",           DG, 200, []),
        _c("dig-mob-acc-screen",  "dig-mob-acc", 3, "محافظ صفحه",    DG, 150, []),
        _c("dig-mob-acc-charger", "dig-mob-acc", 3, "شارژر",         DG, 180, []),
        _c("dig-mob-acc-cable",   "dig-mob-acc", 3, "کابل",          DG, 100, []),
        _c("dig-mob-acc-power",   "dig-mob-acc", 3, "پاوربانک",      DG, 110, []),
        _c("dig-mob-acc-holder",  "dig-mob-acc", 3, "هولدر",         DG,  60, []),
        _c("dig-mob-acc-other",   "dig-mob-acc", 3, "سایر",          DG,  40, []),
      ]),
      _c("dig-mob-sim", "dig-mobile", 2, "سیم‌کارت", DG, 160, []),
    ]),
    _c("dig-tablet", "digital", 1, "تبلت", DG, 780, [
      _c("dig-tab-android", "dig-tablet", 2, "تبلت اندرویدی",     DG, 320, []),
      _c("dig-tab-ipad",    "dig-tablet", 2, "iPad",               DG, 280, []),
      _c("dig-tab-win",     "dig-tablet", 2, "تبلت ویندوزی",       DG, 100, []),
      _c("dig-tab-acc",     "dig-tablet", 2, "لوازم جانبی تبلت",   DG,  80, []),
    ]),
    _c("dig-laptop", "digital", 1, "لپ‌تاپ", DG, 1900, [
      _c("dig-lap-student",  "dig-laptop", 2, "دانشجویی",  DG, 400, []),
      _c("dig-lap-office",   "dig-laptop", 2, "اداری",     DG, 350, []),
      _c("dig-lap-engineer", "dig-laptop", 2, "مهندسی",    DG, 280, []),
      _c("dig-lap-gaming",   "dig-laptop", 2, "گیمینگ",    DG, 320, []),
      _c("dig-lap-design",   "dig-laptop", 2, "طراحی",     DG, 180, []),
      _c("dig-lap-budget",   "dig-laptop", 2, "اقتصادی",   DG, 200, []),
      _c("dig-lap-pro",      "dig-laptop", 2, "حرفه‌ای",   DG, 100, []),
      _c("dig-lap-mac",      "dig-laptop", 2, "MacBook",   DG,  70, []),
    ]),
    _c("dig-computer", "digital", 1, "کامپیوتر", DG, 820, [
      _c("dig-pc-desktop", "dig-computer", 2, "کامپیوتر رومیزی", DG, 360, []),
      _c("dig-pc-aio",     "dig-computer", 2, "All-in-One",       DG, 120, []),
      _c("dig-pc-mini",    "dig-computer", 2, "Mini PC",          DG,  80, []),
      _c("dig-pc-ws",      "dig-computer", 2, "Workstation",      DG,  60, []),
      _c("dig-pc-gaming",  "dig-computer", 2, "سیستم گیمینگ",    DG, 200, []),
    ]),
    _c("dig-parts", "digital", 1, "قطعات کامپیوتر", DG, 1100, [
      _c("dig-pt-cpu",   "dig-parts", 2, "CPU",              DG, 160, []),
      _c("dig-pt-gpu",   "dig-parts", 2, "GPU",              DG, 200, []),
      _c("dig-pt-mb",    "dig-parts", 2, "مادربرد",          DG, 120, []),
      _c("dig-pt-ram",   "dig-parts", 2, "RAM",              DG, 140, []),
      _c("dig-pt-ssd",   "dig-parts", 2, "SSD",              DG, 180, []),
      _c("dig-pt-hdd",   "dig-parts", 2, "HDD",              DG, 100, []),
      _c("dig-pt-psu",   "dig-parts", 2, "پاور",             DG,  80, []),
      _c("dig-pt-case",  "dig-parts", 2, "کیس",              DG,  70, []),
      _c("dig-pt-cool",  "dig-parts", 2, "فن و خنک‌کننده",  DG,  30, []),
      _c("dig-pt-sound", "dig-parts", 2, "کارت صدا",         DG,  20, []),
    ]),
    _c("dig-monitor", "digital", 1, "مانیتور", DG, 560, [
      _c("dig-mon-office",  "dig-monitor", 2, "اداری",      DG, 180, []),
      _c("dig-mon-gaming",  "dig-monitor", 2, "گیمینگ",     DG, 160, []),
      _c("dig-mon-design",  "dig-monitor", 2, "طراحی",      DG, 100, []),
      _c("dig-mon-pro",     "dig-monitor", 2, "حرفه‌ای",    DG,  60, []),
      _c("dig-mon-ultra",   "dig-monitor", 2, "Ultrawide",  DG,  60, []),
    ]),
    _c("dig-printer", "digital", 1, "پرینتر و اسکنر", DG, 380, [
      _c("dig-prn-laser", "dig-printer", 2, "لیزری",       DG, 140, []),
      _c("dig-prn-ink",   "dig-printer", 2, "جوهرافشان",   DG, 100, []),
      _c("dig-prn-multi", "dig-printer", 2, "چندکاره",     DG,  80, []),
      _c("dig-prn-scan",  "dig-printer", 2, "اسکنر",       DG,  40, []),
      _c("dig-prn-cons",  "dig-printer", 2, "مواد مصرفی",  DG,  20, []),
    ]),
    _c("dig-network", "digital", 1, "شبکه و اینترنت", DG, 340, [
      _c("dig-net-modem",  "dig-network", 2, "مودم",          DG, 100, []),
      _c("dig-net-router", "dig-network", 2, "روتر",          DG, 100, []),
      _c("dig-net-switch", "dig-network", 2, "سوئیچ",         DG,  50, []),
      _c("dig-net-ap",     "dig-network", 2, "Access Point",  DG,  50, []),
      _c("dig-net-nic",    "dig-network", 2, "کارت شبکه",     DG,  20, []),
      _c("dig-net-fiber",  "dig-network", 2, "تجهیزات فیبر",  DG,  20, []),
    ]),
    _c("dig-camera", "digital", 1, "دوربین", DG, 620, [
      _c("dig-cam-dslr",    "dig-camera", 2, "DSLR",             DG, 180, []),
      _c("dig-cam-mirror",  "dig-camera", 2, "Mirrorless",       DG, 160, []),
      _c("dig-cam-compact", "dig-camera", 2, "کامپکت",           DG,  80, []),
      _c("dig-cam-action",  "dig-camera", 2, "اکشن‌کم",          DG,  60, []),
      _c("dig-cam-cctv",    "dig-camera", 2, "دوربین مداربسته",  DG,  80, []),
      _c("dig-cam-acc",     "dig-camera", 2, "تجهیزات عکاسی",   DG,  60, []),
    ]),
    _c("dig-audio", "digital", 1, "صوتی", DG, 740, [
      _c("dig-aud-headphone","dig-audio", 2, "هدفون",    DG, 200, []),
      _c("dig-aud-earphone", "dig-audio", 2, "هندزفری",  DG, 120, []),
      _c("dig-aud-earbud",   "dig-audio", 2, "ایرباد",   DG, 160, []),
      _c("dig-aud-speaker",  "dig-audio", 2, "اسپیکر",   DG, 140, []),
      _c("dig-aud-soundbar", "dig-audio", 2, "ساندبار",  DG,  40, []),
      _c("dig-aud-amp",      "dig-audio", 2, "آمپلی‌فایر",DG,  40, []),
      _c("dig-aud-mic",      "dig-audio", 2, "میکروفون", DG,  40, []),
    ]),
    _c("dig-tv", "digital", 1, "تلویزیون و تصویری", DG, 980, [
      _c("dig-tv-led",      "dig-tv", 2, "تلویزیون",      DG, 720, []),
      _c("dig-tv-proj",     "dig-tv", 2, "پروژکتور",      DG, 140, []),
      _c("dig-tv-receiver", "dig-tv", 2, "گیرنده دیجیتال",DG,  70, []),
      _c("dig-tv-acc",      "dig-tv", 2, "لوازم جانبی",   DG,  50, []),
    ]),
    _c("dig-gaming", "digital", 1, "کنسول و بازی", DG, 860, [
      _c("dig-game-ps",      "dig-gaming", 2, "PlayStation",      DG, 300, []),
      _c("dig-game-xbox",    "dig-gaming", 2, "Xbox",             DG, 120, []),
      _c("dig-game-nintendo","dig-gaming", 2, "Nintendo",         DG,  80, []),
      _c("dig-game-title",   "dig-gaming", 2, "بازی",             DG, 200, []),
      _c("dig-game-ctrl",    "dig-gaming", 2, "دسته بازی",        DG,  80, []),
      _c("dig-game-acc",     "dig-gaming", 2, "تجهیزات گیمینگ",  DG,  80, []),
    ]),
    _c("dig-watch", "digital", 1, "ساعت هوشمند", DG, 340, [
      _c("dig-watch-apple",  "dig-watch", 2, "Apple Watch",   DG, 140, []),
      _c("dig-watch-galaxy", "dig-watch", 2, "Galaxy Watch",  DG, 100, []),
      _c("dig-watch-other",  "dig-watch", 2, "سایر",          DG, 100, []),
    ]),
    _c("dig-smart", "digital", 1, "لوازم دیجیتال هوشمند", DG, 280, [
      _c("dig-smart-home",   "dig-smart", 2, "خانه هوشمند",         DG, 100, []),
      _c("dig-smart-cam",    "dig-smart", 2, "دوربین هوشمند",       DG,  80, []),
      _c("dig-smart-sensor", "dig-smart", 2, "سنسور",               DG,  40, []),
      _c("dig-smart-voice",  "dig-smart", 2, "دستیار صوتی",        DG,  30, []),
      _c("dig-smart-kit",    "dig-smart", 2, "تجهیزات هوشمندسازی", DG,  30, []),
    ]),
  ]),

  /* 4 ─ خانه و آشپزخانه */
  _c("home-kitchen", null, 0, "خانه و آشپزخانه", HK, 8600, [
    _c("hk-appliance", "home-kitchen", 1, "لوازم خانگی برقی", HK, 2200, [
      _c("hk-app-fridge",  "hk-appliance", 2, "یخچال",       HK, 500, []),
      _c("hk-app-freezer", "hk-appliance", 2, "فریزر",       HK, 200, []),
      _c("hk-app-reffrz",  "hk-appliance", 2, "یخچال فریزر", HK, 400, []),
      _c("hk-app-washer",  "hk-appliance", 2, "لباسشویی",    HK, 450, []),
      _c("hk-app-dryer",   "hk-appliance", 2, "خشک‌کن",      HK, 120, []),
      _c("hk-app-dishw",   "hk-appliance", 2, "ظرفشویی",     HK, 180, []),
      _c("hk-app-vacuum",  "hk-appliance", 2, "جاروبرقی",    HK, 220, []),
      _c("hk-app-cordless","hk-appliance", 2, "جارو شارژی",  HK,  80, []),
      _c("hk-app-iron",    "hk-appliance", 2, "اتو",          HK,  30, []),
      _c("hk-app-other",   "hk-appliance", 2, "سایر",         HK,  20, []),
    ]),
    _c("hk-kitchen-el", "home-kitchen", 1, "آشپزخانه", HK, 1400, [
      _c("hk-kit-stove",  "hk-kitchen-el", 2, "اجاق گاز",   HK, 300, []),
      _c("hk-kit-oven",   "hk-kitchen-el", 2, "فر",          HK, 200, []),
      _c("hk-kit-micro",  "hk-kitchen-el", 2, "مایکروویو",   HK, 180, []),
      _c("hk-kit-fryer",  "hk-kitchen-el", 2, "سرخ‌کن",     HK, 120, []),
      _c("hk-kit-tea",    "hk-kitchen-el", 2, "چای‌ساز",    HK,  80, []),
      _c("hk-kit-coffee", "hk-kitchen-el", 2, "قهوه‌ساز",   HK,  90, []),
      _c("hk-kit-esp",    "hk-kitchen-el", 2, "اسپرسوساز",  HK,  60, []),
      _c("hk-kit-kettle", "hk-kitchen-el", 2, "کتری",        HK,  50, []),
      _c("hk-kit-blend",  "hk-kitchen-el", 2, "مخلوط‌کن",   HK,  70, []),
      _c("hk-kit-juicer", "hk-kitchen-el", 2, "آبمیوه‌گیری",HK,  40, []),
      _c("hk-kit-food",   "hk-kitchen-el", 2, "غذاساز",     HK,  60, []),
    ]),
    _c("hk-vessels", "home-kitchen", 1, "ظروف و لوازم آشپزخانه", HK, 680, [
      _c("hk-ves-pot",    "hk-vessels", 2, "قابلمه",          HK, 150, []),
      _c("hk-ves-pan",    "hk-vessels", 2, "ماهیتابه",        HK, 130, []),
      _c("hk-ves-dinner", "hk-vessels", 2, "سرویس غذاخوری", HK, 120, []),
      _c("hk-ves-cup",    "hk-vessels", 2, "لیوان و فنجان",  HK,  80, []),
      _c("hk-ves-cutl",   "hk-vessels", 2, "قاشق و چنگال",  HK,  80, []),
      _c("hk-ves-store",  "hk-vessels", 2, "ظروف نگهداری",  HK,  70, []),
      _c("hk-ves-tools",  "hk-vessels", 2, "لوازم آشپزی",   HK,  50, []),
    ]),
    _c("hk-furniture", "home-kitchen", 1, "مبلمان", HK, 1800, [
      _c("hk-furn-sofa",   "hk-furniture", 2, "مبل",          HK, 600, []),
      _c("hk-furn-table",  "hk-furniture", 2, "میز",          HK, 360, []),
      _c("hk-furn-chair",  "hk-furniture", 2, "صندلی",        HK, 280, []),
      _c("hk-furn-dining", "hk-furniture", 2, "میز ناهارخوری",HK, 200, []),
      _c("hk-furn-tv",     "hk-furniture", 2, "میز تلویزیون", HK, 160, []),
      _c("hk-furn-shelf",  "hk-furniture", 2, "کتابخانه",     HK, 100, []),
      _c("hk-furn-ward",   "hk-furniture", 2, "کمد",          HK, 100, []),
    ]),
    _c("hk-bedroom", "home-kitchen", 1, "اتاق خواب", HK, 920, [
      _c("hk-bed-frame",   "hk-bedroom", 2, "تخت",        HK, 360, []),
      _c("hk-bed-mattress","hk-bedroom", 2, "تشک",        HK, 240, []),
      _c("hk-bed-blanket", "hk-bedroom", 2, "پتو",        HK,  80, []),
      _c("hk-bed-pillow",  "hk-bedroom", 2, "بالش",       HK,  60, []),
      _c("hk-bed-cover",   "hk-bedroom", 2, "روتختی",     HK, 100, []),
      _c("hk-bed-wardrobe","hk-bedroom", 2, "کمد لباس",   HK,  80, []),
    ]),
    _c("hk-carpet", "home-kitchen", 1, "فرش و کفپوش", HK, 540, [
      _c("hk-car-carpet",  "hk-carpet", 2, "فرش",      HK, 220, []),
      _c("hk-car-kilim",   "hk-carpet", 2, "گلیم",     HK,  80, []),
      _c("hk-car-moketo",  "hk-carpet", 2, "موکت",     HK, 100, []),
      _c("hk-car-doormat", "hk-carpet", 2, "پادری",    HK,  80, []),
      _c("hk-car-tapestry","hk-carpet", 2, "تابلوفرش", HK,  60, []),
    ]),
    _c("hk-decor", "home-kitchen", 1, "دکوراسیون", HK, 460, [
      _c("hk-dec-painting","hk-decor", 2, "تابلو",          HK, 120, []),
      _c("hk-dec-mirror",  "hk-decor", 2, "آینه",           HK,  80, []),
      _c("hk-dec-clock",   "hk-decor", 2, "ساعت",           HK,  70, []),
      _c("hk-dec-statue",  "hk-decor", 2, "مجسمه",          HK,  40, []),
      _c("hk-dec-vase",    "hk-decor", 2, "گلدان",          HK,  60, []),
      _c("hk-dec-candle",  "hk-decor", 2, "شمع",            HK,  40, []),
      _c("hk-dec-other",   "hk-decor", 2, "لوازم تزئینی",   HK,  50, []),
    ]),
    _c("hk-lighting", "home-kitchen", 1, "نور و روشنایی", HK, 360, [
      _c("hk-lit-chandel", "hk-lighting", 2, "لوستر",       HK, 140, []),
      _c("hk-lit-ceiling", "hk-lighting", 2, "چراغ سقفی",   HK,  80, []),
      _c("hk-lit-shade",   "hk-lighting", 2, "آباژور",       HK,  60, []),
      _c("hk-lit-desk",    "hk-lighting", 2, "چراغ مطالعه",  HK,  50, []),
      _c("hk-lit-bulb",    "hk-lighting", 2, "لامپ",          HK,  30, []),
    ]),
    _c("hk-hvac", "home-kitchen", 1, "سرمایش و گرمایش", HK, 620, [
      _c("hk-hvac-ac",      "hk-hvac", 2, "کولر گازی",  HK, 220, []),
      _c("hk-hvac-evap",    "hk-hvac", 2, "کولر آبی",   HK, 100, []),
      _c("hk-hvac-fan",     "hk-hvac", 2, "پنکه",       HK,  80, []),
      _c("hk-hvac-heater",  "hk-hvac", 2, "بخاری",      HK,  80, []),
      _c("hk-hvac-radiator","hk-hvac", 2, "شوفاژ",      HK,  60, []),
      _c("hk-hvac-pkg",     "hk-hvac", 2, "پکیج",       HK,  50, []),
      _c("hk-hvac-boiler",  "hk-hvac", 2, "آبگرمکن",    HK,  30, []),
    ]),
    _c("hk-bathroom", "home-kitchen", 1, "حمام و سرویس بهداشتی", HK, 280, [
      _c("hk-bath-items",   "hk-bathroom", 2, "لوازم حمام",    HK, 100, []),
      _c("hk-bath-faucet",  "hk-bathroom", 2, "شیرآلات",       HK,  70, []),
      _c("hk-bath-basin",   "hk-bathroom", 2, "روشویی",        HK,  40, []),
      _c("hk-bath-toilet",  "hk-bathroom", 2, "توالت",         HK,  40, []),
      _c("hk-bath-other",   "hk-bathroom", 2, "لوازم سرویس",   HK,  30, []),
    ]),
    _c("hk-cleaning", "home-kitchen", 1, "شستشو و نظافت", HK, 180, [
      _c("hk-cln-deterg",  "hk-cleaning", 2, "مواد شوینده",       HK,  70, []),
      _c("hk-cln-tools",   "hk-cleaning", 2, "لوازم نظافت",       HK,  60, []),
      _c("hk-cln-line",    "hk-cleaning", 2, "بند رخت",           HK,  20, []),
      _c("hk-cln-equip",   "hk-cleaning", 2, "تجهیزات نظافت",     HK,  30, []),
    ]),
    _c("hk-sewing", "home-kitchen", 1, "خیاطی و بافتنی", HK, 160, [
      _c("hk-sew-machine", "hk-sewing", 2, "چرخ خیاطی",   HK,  60, []),
      _c("hk-sew-thread",  "hk-sewing", 2, "نخ",           HK,  30, []),
      _c("hk-sew-fabric",  "hk-sewing", 2, "پارچه",        HK,  40, []),
      _c("hk-sew-tools",   "hk-sewing", 2, "لوازم خیاطی", HK,  20, []),
      _c("hk-sew-knit",    "hk-sewing", 2, "لوازم بافتنی", HK,  10, []),
    ]),
  ]),

  /* 5 ─ خدمات */
  _c("services", null, 0, "خدمات", SV, 7400, [
    _c("svc-vehicle", "services", 1, "خدمات خودرو", SV, 380, [
      _c("svc-veh-mechanic","svc-vehicle", 2, "مکانیکی",      SV,  80, []),
      _c("svc-veh-electric","svc-vehicle", 2, "برق خودرو",   SV,  50, []),
      _c("svc-veh-body",    "svc-vehicle", 2, "صافکاری",      SV,  60, []),
      _c("svc-veh-paint",   "svc-vehicle", 2, "نقاشی",        SV,  40, []),
      _c("svc-veh-wash",    "svc-vehicle", 2, "کارواش",       SV,  50, []),
      _c("svc-veh-detail",  "svc-vehicle", 2, "دیتیلینگ",     SV,  30, []),
      _c("svc-veh-oil",     "svc-vehicle", 2, "تعویض روغن",   SV,  40, []),
      _c("svc-veh-rescue",  "svc-vehicle", 2, "امداد خودرو",  SV,  30, []),
    ]),
    _c("svc-construction", "services", 1, "خدمات ساختمانی", SV, 1200, [
      _c("svc-con-elec",    "svc-construction", 2, "برق‌کاری",          SV, 200, []),
      _c("svc-con-plumb",   "svc-construction", 2, "لوله‌کشی",          SV, 180, []),
      _c("svc-con-paint",   "svc-construction", 2, "نقاشی ساختمان",     SV, 160, []),
      _c("svc-con-cabinet", "svc-construction", 2, "کابینت",             SV, 120, []),
      _c("svc-con-tile",    "svc-construction", 2, "کاشی و سرامیک",     SV, 140, []),
      _c("svc-con-dryw",    "svc-construction", 2, "کناف",               SV,  80, []),
      _c("svc-con-weld",    "svc-construction", 2, "جوشکاری",            SV,  80, []),
      _c("svc-con-blacksm", "svc-construction", 2, "آهنگری",             SV,  40, []),
      _c("svc-con-renov",   "svc-construction", 2, "بازسازی",            SV, 200, []),
    ]),
    _c("svc-tech", "services", 1, "خدمات رایانه و موبایل", SV, 920, [
      _c("svc-tech-mobile",  "svc-tech", 2, "تعمیر موبایل",   SV, 200, []),
      _c("svc-tech-laptop",  "svc-tech", 2, "تعمیر لپ‌تاپ",  SV, 160, []),
      _c("svc-tech-pc",      "svc-tech", 2, "تعمیر کامپیوتر", SV, 120, []),
      _c("svc-tech-soft",    "svc-tech", 2, "نصب نرم‌افزار",  SV,  80, []),
      _c("svc-tech-web",     "svc-tech", 2, "طراحی سایت",     SV, 100, []),
      _c("svc-tech-dev",     "svc-tech", 2, "برنامه‌نویسی",   SV, 120, []),
      _c("svc-tech-design",  "svc-tech", 2, "طراحی گرافیک",   SV,  80, []),
      _c("svc-tech-hosting", "svc-tech", 2, "هاست و دامنه",   SV,  30, []),
      _c("svc-tech-network", "svc-tech", 2, "خدمات شبکه",     SV,  30, []),
    ]),
    _c("svc-finance", "services", 1, "خدمات مالی", SV, 420, [
      _c("svc-fin-account",  "svc-finance", 2, "حسابداری",      SV, 160, []),
      _c("svc-fin-audit",    "svc-finance", 2, "حسابرسی",       SV,  80, []),
      _c("svc-fin-insure",   "svc-finance", 2, "بیمه",          SV, 100, []),
      _c("svc-fin-tax",      "svc-finance", 2, "مالیاتی",       SV,  50, []),
      _c("svc-fin-consult",  "svc-finance", 2, "مشاوره مالی",   SV,  30, []),
    ]),
    _c("svc-transport", "services", 1, "حمل‌ونقل", SV, 560, [
      _c("svc-trn-cargo",   "svc-transport", 2, "باربری",          SV, 180, []),
      _c("svc-trn-moving",  "svc-transport", 2, "اسباب‌کشی",       SV, 160, []),
      _c("svc-trn-pickup",  "svc-transport", 2, "وانت",            SV,  80, []),
      _c("svc-trn-truck",   "svc-transport", 2, "کامیون",          SV,  60, []),
      _c("svc-trn-courier", "svc-transport", 2, "پیک",             SV,  50, []),
      _c("svc-trn-inter",   "svc-transport", 2, "حمل بین‌شهری",   SV,  30, []),
    ]),
    _c("svc-education", "services", 1, "آموزشی", SV, 980, [
      _c("svc-edu-lang", "svc-education", 2, "زبان", SV, 320, [
        _c("svc-edu-en",  "svc-edu-lang", 3, "انگلیسی",   SV, 160, []),
        _c("svc-edu-de",  "svc-edu-lang", 3, "آلمانی",    SV,  60, []),
        _c("svc-edu-fr",  "svc-edu-lang", 3, "فرانسه",    SV,  40, []),
        _c("svc-edu-other-lang","svc-edu-lang", 3, "سایر", SV,  60, []),
      ]),
      _c("svc-edu-school",    "svc-education", 2, "مدرسه",           SV,  80, []),
      _c("svc-edu-uni",       "svc-education", 2, "دانشگاه",         SV, 100, []),
      _c("svc-edu-konkur",    "svc-education", 2, "کنکور",            SV, 120, []),
      _c("svc-edu-private",   "svc-education", 2, "تدریس خصوصی",     SV, 160, []),
      _c("svc-edu-music",     "svc-education", 2, "موسیقی",           SV,  80, []),
      _c("svc-edu-computer",  "svc-education", 2, "کامپیوتر",         SV,  60, []),
      _c("svc-edu-skills",    "svc-education", 2, "مهارت‌های فنی",   SV,  60, []),
    ]),
    _c("svc-beauty", "services", 1, "آرایش و زیبایی", SV, 520, [
      _c("svc-bty-barber","svc-beauty", 2, "آرایشگری",        SV, 140, []),
      _c("svc-bty-makeup","svc-beauty", 2, "میکاپ",           SV, 100, []),
      _c("svc-bty-nail",  "svc-beauty", 2, "ناخن",            SV,  90, []),
      _c("svc-bty-skin",  "svc-beauty", 2, "پوست",            SV,  80, []),
      _c("svc-bty-hair",  "svc-beauty", 2, "مو",              SV,  70, []),
      _c("svc-bty-other", "svc-beauty", 2, "خدمات زیبایی",   SV,  40, []),
    ]),
    _c("svc-cleaning", "services", 1, "نظافت", SV, 340, [
      _c("svc-cln-home",   "svc-cleaning", 2, "منزل",   SV, 160, []),
      _c("svc-cln-office", "svc-cleaning", 2, "شرکت",   SV, 100, []),
      _c("svc-cln-stairs", "svc-cleaning", 2, "راه‌پله",SV,  50, []),
      _c("svc-cln-window", "svc-cleaning", 2, "شیشه",   SV,  30, []),
    ]),
    _c("svc-garden", "services", 1, "باغبانی", SV, 180, [
      _c("svc-grd-design", "svc-garden", 2, "طراحی فضای سبز", SV,  60, []),
      _c("svc-grd-maint",  "svc-garden", 2, "نگهداری باغ",    SV,  70, []),
      _c("svc-grd-prune",  "svc-garden", 2, "هرس",            SV,  30, []),
      _c("svc-grd-plant",  "svc-garden", 2, "کاشت",           SV,  20, []),
    ]),
    _c("svc-event", "services", 1, "مراسم و پذیرایی", SV, 460, [
      _c("svc-evt-hall",  "svc-event", 2, "تالار",        SV, 100, []),
      _c("svc-evt-cater", "svc-event", 2, "کترینگ",       SV,  80, []),
      _c("svc-evt-photo", "svc-event", 2, "عکاسی",        SV,  90, []),
      _c("svc-evt-video", "svc-event", 2, "فیلمبرداری",   SV,  80, []),
      _c("svc-evt-decor", "svc-event", 2, "دیزاین",       SV,  60, []),
      _c("svc-evt-music", "svc-event", 2, "موسیقی",       SV,  30, []),
      _c("svc-evt-other", "svc-event", 2, "خدمات مجالس",  SV,  20, []),
    ]),
    _c("svc-legal", "services", 1, "حقوقی", SV, 280, [
      _c("svc-leg-lawyer",  "svc-legal", 2, "وکیل",          SV, 120, []),
      _c("svc-leg-consult", "svc-legal", 2, "مشاوره حقوقی",  SV,  90, []),
      _c("svc-leg-contract","svc-legal", 2, "قرارداد",        SV,  40, []),
      _c("svc-leg-reg",     "svc-legal", 2, "امور ثبتی",      SV,  30, []),
    ]),
    _c("svc-immigration", "services", 1, "مهاجرت", SV, 220, [
      _c("svc-imm-study",    "svc-immigration", 2, "تحصیلی",          SV,  80, []),
      _c("svc-imm-work",     "svc-immigration", 2, "کاری",            SV,  60, []),
      _c("svc-imm-invest",   "svc-immigration", 2, "سرمایه‌گذاری",   SV,  40, []),
      _c("svc-imm-consult",  "svc-immigration", 2, "مشاوره مهاجرت",  SV,  40, []),
    ]),
    _c("svc-other", "services", 1, "سایر خدمات", SV, 220, []),
  ]),

  /* 6 ─ وسایل شخصی */
  _c("personal", null, 0, "وسایل شخصی", PR, 6200, [
    _c("per-clothes", "personal", 1, "لباس", PR, 2200, [
      _c("per-clo-men",     "per-clothes", 2, "مردانه",  PR, 600, []),
      _c("per-clo-women",   "per-clothes", 2, "زنانه",   PR, 800, []),
      _c("per-clo-kids",    "per-clothes", 2, "بچگانه",  PR, 400, []),
      _c("per-clo-formal",  "per-clothes", 2, "مجلسی",   PR, 200, []),
      _c("per-clo-sport",   "per-clothes", 2, "ورزشی",   PR, 140, []),
      _c("per-clo-trad",    "per-clothes", 2, "سنتی",    PR,  60, []),
    ]),
    _c("per-shoes", "personal", 1, "کفش", PR, 900, [
      _c("per-sh-men",   "per-shoes", 2, "مردانه",  PR, 280, []),
      _c("per-sh-women", "per-shoes", 2, "زنانه",   PR, 320, []),
      _c("per-sh-kids",  "per-shoes", 2, "بچگانه",  PR, 160, []),
      _c("per-sh-sport", "per-shoes", 2, "ورزشی",   PR,  90, []),
      _c("per-sh-formal","per-shoes", 2, "رسمی",    PR,  50, []),
    ]),
    _c("per-bag", "personal", 1, "کیف", PR, 580, [
      _c("per-bag-hand",  "per-bag", 2, "دستی",   PR, 180, []),
      _c("per-bag-cross", "per-bag", 2, "دوشی",   PR, 160, []),
      _c("per-bag-back",  "per-bag", 2, "کوله",   PR, 120, []),
      _c("per-bag-office","per-bag", 2, "اداری",  PR,  70, []),
      _c("per-bag-travel","per-bag", 2, "سفر",    PR,  50, []),
    ]),
    _c("per-jewelry", "personal", 1, "زیورآلات", PR, 760, [
      _c("per-jew-gold",     "per-jewelry", 2, "طلا",      PR, 260, []),
      _c("per-jew-silver",   "per-jewelry", 2, "نقره",     PR, 160, []),
      _c("per-jew-costume",  "per-jewelry", 2, "بدلیجات",  PR, 100, []),
      _c("per-jew-ring",     "per-jewelry", 2, "انگشتر",   PR,  80, []),
      _c("per-jew-necklace", "per-jewelry", 2, "گردنبند",  PR,  80, []),
      _c("per-jew-bracelet", "per-jewelry", 2, "دستبند",   PR,  50, []),
      _c("per-jew-earring",  "per-jewelry", 2, "گوشواره",  PR,  30, []),
    ]),
    _c("per-watch", "personal", 1, "ساعت", PR, 420, [
      _c("per-wat-wrist",  "per-watch", 2, "مچی",         PR, 220, []),
      _c("per-wat-classic","per-watch", 2, "کلاسیک",      PR, 100, []),
      _c("per-wat-sport",  "per-watch", 2, "اسپرت",       PR,  70, []),
      _c("per-wat-acc",    "per-watch", 2, "اکسسوری ساعت",PR,  30, []),
    ]),
    _c("per-beauty", "personal", 1, "آرایشی و بهداشتی", PR, 780, [
      _c("per-bty-perfume",  "per-beauty", 2, "عطر",          PR, 200, []),
      _c("per-bty-cologne",  "per-beauty", 2, "ادکلن",        PR, 160, []),
      _c("per-bty-skincare", "per-beauty", 2, "مراقبت پوست",  PR, 140, []),
      _c("per-bty-haircare", "per-beauty", 2, "مراقبت مو",    PR, 100, []),
      _c("per-bty-makeup",   "per-beauty", 2, "لوازم آرایش",  PR, 120, []),
      _c("per-bty-hygiene",  "per-beauty", 2, "بهداشت شخصی",  PR,  60, []),
    ]),
    _c("per-baby", "personal", 1, "کودک و نوزاد", PR, 640, [
      _c("per-baby-stroller", "per-baby", 2, "کالسکه",       PR, 180, []),
      _c("per-baby-carseat",  "per-baby", 2, "صندلی خودرو",  PR, 100, []),
      _c("per-baby-bed",      "per-baby", 2, "تخت کودک",     PR, 120, []),
      _c("per-baby-clothes",  "per-baby", 2, "لباس کودک",    PR, 120, []),
      _c("per-baby-items",    "per-baby", 2, "لوازم نوزاد",  PR,  80, []),
      _c("per-baby-toys",     "per-baby", 2, "اسباب‌بازی",   PR,  40, []),
    ]),
    _c("per-stationery", "personal", 1, "لوازم‌التحریر", PR, 220, [
      _c("per-sta-notebook","per-stationery", 2, "دفتر",         PR,  60, []),
      _c("per-sta-pen",     "per-stationery", 2, "قلم",          PR,  40, []),
      _c("per-sta-bag",     "per-stationery", 2, "کیف",          PR,  40, []),
      _c("per-sta-school",  "per-stationery", 2, "لوازم مدرسه",  PR,  50, []),
      _c("per-sta-art",     "per-stationery", 2, "لوازم هنری",   PR,  30, []),
    ]),
  ]),

  /* 7 ─ سرگرمی و فراغت */
  _c("entertainment", null, 0, "سرگرمی و فراغت", EN, 5800, [
    _c("ent-books", "entertainment", 1, "کتاب و مجله", EN, 1100, [
      _c("ent-book-novel",  "ent-books", 2, "رمان",      EN, 300, []),
      _c("ent-book-uni",    "ent-books", 2, "دانشگاهی",  EN, 200, []),
      _c("ent-book-school", "ent-books", 2, "درسی",      EN, 180, []),
      _c("ent-book-kids",   "ent-books", 2, "کودک",      EN, 120, []),
      _c("ent-book-lang",   "ent-books", 2, "زبان",      EN,  80, []),
      _c("ent-book-sci",    "ent-books", 2, "علمی",      EN,  80, []),
      _c("ent-book-art",    "ent-books", 2, "هنری",      EN,  70, []),
      _c("ent-book-hist",   "ent-books", 2, "تاریخی",    EN,  70, []),
    ]),
    _c("ent-music", "entertainment", 1, "موسیقی", EN, 640, [
      _c("ent-mus-inst",    "ent-music", 2, "ساز",              EN, 100, []),
      _c("ent-mus-guitar",  "ent-music", 2, "گیتار",           EN, 160, []),
      _c("ent-mus-piano",   "ent-music", 2, "پیانو",           EN,  80, []),
      _c("ent-mus-violin",  "ent-music", 2, "ویولن",           EN,  60, []),
      _c("ent-mus-santur",  "ent-music", 2, "سنتور",           EN,  40, []),
      _c("ent-mus-daf",     "ent-music", 2, "دف",              EN,  40, []),
      _c("ent-mus-drum",    "ent-music", 2, "درام",            EN,  80, []),
      _c("ent-mus-equip",   "ent-music", 2, "تجهیزات موسیقی", EN,  80, []),
    ]),
    _c("ent-sports", "entertainment", 1, "ورزش", EN, 1200, [
      _c("ent-spt-gym",    "ent-sports", 2, "بدنسازی",        EN, 380, []),
      _c("ent-spt-soccer", "ent-sports", 2, "فوتبال",         EN, 180, []),
      _c("ent-spt-hike",   "ent-sports", 2, "کوهنوردی",       EN, 120, []),
      _c("ent-spt-swim",   "ent-sports", 2, "شنا",            EN,  80, []),
      _c("ent-spt-bike",   "ent-sports", 2, "دوچرخه",         EN, 220, []),
      _c("ent-spt-camp",   "ent-sports", 2, "کمپینگ",         EN, 100, []),
      _c("ent-spt-equip",  "ent-sports", 2, "تجهیزات ورزشی",  EN, 120, []),
    ]),
    _c("ent-camp", "entertainment", 1, "سفر و کمپینگ", EN, 420, [
      _c("ent-cmp-tent",   "ent-camp", 2, "چادر",               EN, 140, []),
      _c("ent-cmp-sleep",  "ent-camp", 2, "کیسه خواب",          EN,  80, []),
      _c("ent-cmp-bag",    "ent-camp", 2, "کوله",               EN, 100, []),
      _c("ent-cmp-equip",  "ent-camp", 2, "تجهیزات کمپ",       EN,  60, []),
      _c("ent-cmp-hike",   "ent-camp", 2, "تجهیزات کوهنوردی",  EN,  40, []),
    ]),
    _c("ent-tickets", "entertainment", 1, "بلیت", EN, 340, [
      _c("ent-tkt-concert","ent-tickets", 2, "کنسرت",   EN, 140, []),
      _c("ent-tkt-cinema", "ent-tickets", 2, "سینما",   EN,  80, []),
      _c("ent-tkt-theater","ent-tickets", 2, "تئاتر",   EN,  60, []),
      _c("ent-tkt-sport",  "ent-tickets", 2, "مسابقات", EN,  30, []),
      _c("ent-tkt-event",  "ent-tickets", 2, "رویداد",  EN,  30, []),
    ]),
    _c("ent-travel", "entertainment", 1, "تور و سفر", EN, 460, [
      _c("ent-trv-domestic","ent-travel", 2, "تور داخلی",  EN, 180, []),
      _c("ent-trv-foreign", "ent-travel", 2, "تور خارجی",  EN, 140, []),
      _c("ent-trv-hotel",   "ent-travel", 2, "هتل",         EN,  80, []),
      _c("ent-trv-lodge",   "ent-travel", 2, "اقامتگاه",    EN,  60, []),
    ]),
    _c("ent-collect", "entertainment", 1, "کلکسیون", EN, 280, [
      _c("ent-col-coin",    "ent-collect", 2, "سکه",              EN, 100, []),
      _c("ent-col-stamp",   "ent-collect", 2, "تمبر",             EN,  60, []),
      _c("ent-col-card",    "ent-collect", 2, "کارت",             EN,  50, []),
      _c("ent-col-antique", "ent-collect", 2, "اشیای قدیمی",     EN,  40, []),
      _c("ent-col-special", "ent-collect", 2, "کلکسیون‌های خاص", EN,  30, []),
    ]),
    _c("ent-animals", "entertainment", 1, "حیوانات", EN, 680, [
      _c("ent-ani-dog",   "ent-animals", 2, "سگ",              EN, 180, []),
      _c("ent-ani-cat",   "ent-animals", 2, "گربه",            EN, 200, []),
      _c("ent-ani-bird",  "ent-animals", 2, "پرندگان",         EN, 120, []),
      _c("ent-ani-fish",  "ent-animals", 2, "ماهی",            EN,  80, []),
      _c("ent-ani-farm",  "ent-animals", 2, "حیوانات مزرعه",  EN,  60, []),
      _c("ent-ani-items", "ent-animals", 2, "لوازم حیوانات",  EN,  40, []),
    ]),
    _c("ent-toys", "entertainment", 1, "اسباب‌بازی", EN, 480, [
      _c("ent-toy-mind",     "ent-toys", 2, "فکری",       EN, 120, []),
      _c("ent-toy-edu",      "ent-toys", 2, "آموزشی",     EN, 100, []),
      _c("ent-toy-car",      "ent-toys", 2, "ماشین",      EN,  80, []),
      _c("ent-toy-doll",     "ent-toys", 2, "عروسک",      EN,  80, []),
      _c("ent-toy-build",    "ent-toys", 2, "ساختنی",     EN,  60, []),
      _c("ent-toy-electric", "ent-toys", 2, "الکترونیکی", EN,  40, []),
    ]),
  ]),

  /* 8 ─ اجتماعی */
  _c("social", null, 0, "اجتماعی", SC, 1200, [
    _c("soc-events", "social", 1, "رویدادها", SC, 360, [
      _c("soc-evt-cultural","soc-events", 2, "فرهنگی",  SC,  80, []),
      _c("soc-evt-art",     "soc-events", 2, "هنری",    SC,  70, []),
      _c("soc-evt-sport",   "soc-events", 2, "ورزشی",   SC,  80, []),
      _c("soc-evt-edu",     "soc-events", 2, "آموزشی",  SC,  80, []),
      _c("soc-evt-social",  "soc-events", 2, "اجتماعی", SC,  50, []),
    ]),
    _c("soc-volunteer", "social", 1, "فعالیت داوطلبانه", SC, 220, [
      _c("soc-vol-charity","soc-volunteer", 2, "خیریه",           SC,  80, []),
      _c("soc-vol-env",    "soc-volunteer", 2, "محیط زیست",       SC,  60, []),
      _c("soc-vol-help",   "soc-volunteer", 2, "کمک‌رسانی",       SC,  50, []),
      _c("soc-vol-social", "soc-volunteer", 2, "فعالیت اجتماعی", SC,  30, []),
    ]),
    _c("soc-lost", "social", 1, "گم‌شده‌ها", SC, 200, [
      _c("soc-lost-docs",   "soc-lost", 2, "مدارک",    SC,  60, []),
      _c("soc-lost-mobile", "soc-lost", 2, "موبایل",   SC,  50, []),
      _c("soc-lost-bag",    "soc-lost", 2, "کیف",      SC,  40, []),
      _c("soc-lost-animal", "soc-lost", 2, "حیوانات",  SC,  30, []),
      _c("soc-lost-other",  "soc-lost", 2, "سایر",     SC,  20, []),
    ]),
    _c("soc-found", "social", 1, "پیداشده‌ها", SC, 180, [
      _c("soc-fnd-docs",   "soc-found", 2, "مدارک",    SC,  60, []),
      _c("soc-fnd-mobile", "soc-found", 2, "موبایل",   SC,  40, []),
      _c("soc-fnd-bag",    "soc-found", 2, "کیف",      SC,  40, []),
      _c("soc-fnd-animal", "soc-found", 2, "حیوانات",  SC,  20, []),
      _c("soc-fnd-other",  "soc-found", 2, "سایر",     SC,  20, []),
    ]),
    _c("soc-announce", "social", 1, "اطلاع‌رسانی اجتماعی", SC, 240, []),
  ]),

  /* 9 ─ تجهیزات و صنعتی */
  _c("industrial", null, 0, "تجهیزات و صنعتی", IN, 4200, [
    _c("ind-tools", "industrial", 1, "ابزارآلات", IN, 900, [
      _c("ind-tl-hand",    "ind-tools", 2, "ابزار دستی",      IN, 280, []),
      _c("ind-tl-electric","ind-tools", 2, "ابزار برقی",      IN, 320, []),
      _c("ind-tl-battery", "ind-tools", 2, "ابزار شارژی",     IN, 180, []),
      _c("ind-tl-measure", "ind-tools", 2, "ابزار اندازه‌گیری",IN,  60, []),
      _c("ind-tl-workshop","ind-tools", 2, "تجهیزات کارگاهی", IN,  60, []),
    ]),
    _c("ind-machinery", "industrial", 1, "ماشین‌آلات صنعتی", IN, 620, [
      _c("ind-mch-cnc",    "ind-machinery", 2, "CNC",              IN, 100, []),
      _c("ind-mch-lathe",  "ind-machinery", 2, "تراش",            IN,  80, []),
      _c("ind-mch-mill",   "ind-machinery", 2, "فرز",             IN,  70, []),
      _c("ind-mch-cut",    "ind-machinery", 2, "دستگاه برش",      IN, 100, []),
      _c("ind-mch-comp",   "ind-machinery", 2, "کمپرسور",         IN, 100, []),
      _c("ind-mch-gen",    "ind-machinery", 2, "ژنراتور",         IN,  80, []),
      _c("ind-mch-prod",   "ind-machinery", 2, "تجهیزات تولید",   IN,  90, []),
    ]),
    _c("ind-building", "industrial", 1, "مصالح و تجهیزات ساختمان", IN, 880, [
      _c("ind-bld-cement",  "ind-building", 2, "سیمان",              IN, 120, []),
      _c("ind-bld-brick",   "ind-building", 2, "آجر",                IN,  80, []),
      _c("ind-bld-stone",   "ind-building", 2, "سنگ",                IN, 100, []),
      _c("ind-bld-wood",    "ind-building", 2, "چوب",                IN,  90, []),
      _c("ind-bld-iron",    "ind-building", 2, "آهن",                IN, 180, []),
      _c("ind-bld-pipe",    "ind-building", 2, "لوله",               IN, 140, []),
      _c("ind-bld-cable",   "ind-building", 2, "کابل",               IN, 100, []),
      _c("ind-bld-equip",   "ind-building", 2, "تجهیزات ساختمانی",  IN,  70, []),
    ]),
    _c("ind-business", "industrial", 1, "تجهیزات کسب‌وکار", IN, 760, [
      _c("ind-biz-retail", "ind-business", 2, "فروشگاهی",   IN, 200, []),
      _c("ind-biz-rest",   "ind-business", 2, "رستوران",    IN, 160, []),
      _c("ind-biz-cafe",   "ind-business", 2, "کافی‌شاپ",  IN, 120, []),
      _c("ind-biz-office", "ind-business", 2, "اداری",      IN, 150, []),
      _c("ind-biz-ware",   "ind-business", 2, "انبار",      IN,  80, []),
      _c("ind-biz-expo",   "ind-business", 2, "نمایشگاهی",  IN,  50, []),
    ]),
    _c("ind-medical", "industrial", 1, "تجهیزات پزشکی", IN, 480, [
      _c("ind-med-diag",   "ind-medical", 2, "تجهیزات تشخیصی",    IN, 160, []),
      _c("ind-med-treat",  "ind-medical", 2, "تجهیزات درمانی",    IN, 120, []),
      _c("ind-med-lab",    "ind-medical", 2, "تجهیزات آزمایشگاهی",IN, 100, []),
      _c("ind-med-furn",   "ind-medical", 2, "مبلمان پزشکی",      IN, 100, []),
    ]),
    _c("ind-agri", "industrial", 1, "تجهیزات کشاورزی", IN, 360, [
      _c("ind-agr-tractor","ind-agri", 2, "تراکتور",          IN, 100, []),
      _c("ind-agr-tools",  "ind-agri", 2, "ادوات کشاورزی",   IN,  80, []),
      _c("ind-agr-pump",   "ind-agri", 2, "پمپ",              IN,  60, []),
      _c("ind-agr-irrig",  "ind-agri", 2, "آبیاری",           IN,  60, []),
      _c("ind-agr-green",  "ind-agri", 2, "گلخانه",           IN,  30, []),
      _c("ind-agr-garden", "ind-agri", 2, "تجهیزات باغبانی",  IN,  30, []),
    ]),
    _c("ind-wholesale", "industrial", 1, "عمده‌فروشی", IN, 200, [
      _c("ind-whl-raw",   "ind-wholesale", 2, "مواد اولیه",  IN,  50, []),
      _c("ind-whl-goods", "ind-wholesale", 2, "کالا",         IN,  60, []),
      _c("ind-whl-food",  "ind-wholesale", 2, "مواد غذایی",  IN,  30, []),
      _c("ind-whl-cloth", "ind-wholesale", 2, "پوشاک",        IN,  30, []),
      _c("ind-whl-equip", "ind-wholesale", 2, "تجهیزات",      IN,  20, []),
      _c("ind-whl-other", "ind-wholesale", 2, "سایر",         IN,  10, []),
    ]),
  ]),

  /* 10 ─ استخدام و کاریابی */
  _c("jobs", null, 0, "استخدام و کاریابی", JB, 5800, [
    _c("job-admin", "jobs", 1, "اداری و مدیریت", JB, 640, [
      _c("job-adm-clerk",   "job-admin", 2, "کارمند اداری",   JB, 220, []),
      _c("job-adm-secretary","job-admin", 2, "منشی",           JB, 120, []),
      _c("job-adm-manager", "job-admin", 2, "مدیر",            JB, 160, []),
      _c("job-adm-hr",      "job-admin", 2, "منابع انسانی",   JB,  80, []),
      _c("job-adm-chief",   "job-admin", 2, "مسئول دفتر",     JB,  60, []),
    ]),
    _c("job-finance", "jobs", 1, "مالی و حسابداری", JB, 540, [
      _c("job-fin-acc",    "job-finance", 2, "حسابدار",   JB, 240, []),
      _c("job-fin-audit",  "job-finance", 2, "حسابرس",    JB,  80, []),
      _c("job-fin-fin",    "job-finance", 2, "امور مالی", JB, 120, []),
      _c("job-fin-ins",    "job-finance", 2, "بیمه",      JB,  60, []),
      _c("job-fin-tax",    "job-finance", 2, "مالیاتی",   JB,  40, []),
    ]),
    _c("job-sales", "jobs", 1, "فروش و بازاریابی", JB, 740, [
      _c("job-sal-seller",   "job-sales", 2, "فروشنده",          JB, 280, []),
      _c("job-sal-marketer", "job-sales", 2, "بازاریاب",         JB, 160, []),
      _c("job-sal-manager",  "job-sales", 2, "مدیر فروش",        JB, 120, []),
      _c("job-sal-digital",  "job-sales", 2, "دیجیتال مارکتینگ",JB, 120, []),
      _c("job-sal-content",  "job-sales", 2, "تولید محتوا",      JB,  60, []),
    ]),
    _c("job-it", "jobs", 1, "فناوری اطلاعات", JB, 880, [
      _c("job-it-dev",    "job-it", 2, "برنامه‌نویس",      JB, 280, []),
      _c("job-it-web",    "job-it", 2, "طراح سایت",        JB, 160, []),
      _c("job-it-eng",    "job-it", 2, "مهندس نرم‌افزار",  JB, 160, []),
      _c("job-it-net",    "job-it", 2, "شبکه",              JB,  80, []),
      _c("job-it-sec",    "job-it", 2, "امنیت",             JB,  60, []),
      _c("job-it-ai",     "job-it", 2, "هوش مصنوعی",       JB, 100, []),
      _c("job-it-support","job-it", 2, "پشتیبانی IT",       JB,  40, []),
    ]),
    _c("job-engineering", "jobs", 1, "مهندسی", JB, 620, [
      _c("job-eng-elec",  "job-engineering", 2, "برق",             JB, 140, []),
      _c("job-eng-mech",  "job-engineering", 2, "مکانیک",         JB, 120, []),
      _c("job-eng-civil", "job-engineering", 2, "عمران",           JB, 120, []),
      _c("job-eng-arch",  "job-engineering", 2, "معماری",          JB,  90, []),
      _c("job-eng-ind",   "job-engineering", 2, "صنایع",           JB,  80, []),
      _c("job-eng-chem",  "job-engineering", 2, "شیمی",            JB,  40, []),
      _c("job-eng-other", "job-engineering", 2, "سایر مهندسی‌ها", JB,  30, []),
    ]),
    _c("job-technical", "jobs", 1, "فنی و صنعتی", JB, 500, [
      _c("job-tec-welder",   "job-technical", 2, "جوشکار",   JB, 100, []),
      _c("job-tec-elec",     "job-technical", 2, "برقکار",   JB, 100, []),
      _c("job-tec-mechanic", "job-technical", 2, "مکانیک",   JB,  90, []),
      _c("job-tec-tech",     "job-technical", 2, "تکنسین",   JB,  80, []),
      _c("job-tec-operator", "job-technical", 2, "اپراتور",  JB,  80, []),
      _c("job-tec-worker",   "job-technical", 2, "کارگر فنی",JB,  50, []),
    ]),
    _c("job-education", "jobs", 1, "آموزشی", JB, 420, [
      _c("job-edu-teacher",  "job-education", 2, "معلم",             JB, 140, []),
      _c("job-edu-prof",     "job-education", 2, "مدرس دانشگاه",    JB,  80, []),
      _c("job-edu-lang",     "job-education", 2, "مدرس زبان",       JB,  80, []),
      _c("job-edu-coach",    "job-education", 2, "مربی",             JB,  70, []),
      _c("job-edu-private",  "job-education", 2, "تدریس خصوصی",    JB,  50, []),
    ]),
    _c("job-medical", "jobs", 1, "درمانی و پزشکی", JB, 480, [
      _c("job-med-doctor",  "job-medical", 2, "پزشک",         JB, 120, []),
      _c("job-med-nurse",   "job-medical", 2, "پرستار",        JB, 140, []),
      _c("job-med-assist",  "job-medical", 2, "دستیار",        JB,  80, []),
      _c("job-med-pharma",  "job-medical", 2, "داروخانه",      JB,  60, []),
      _c("job-med-lab",     "job-medical", 2, "آزمایشگاه",     JB,  40, []),
      _c("job-med-service", "job-medical", 2, "خدمات درمانی",  JB,  40, []),
    ]),
    _c("job-beauty", "jobs", 1, "زیبایی و بهداشت", JB, 320, [
      _c("job-bty-barber",    "job-beauty", 2, "آرایشگر",       JB, 120, []),
      _c("job-bty-nail",      "job-beauty", 2, "ناخن‌کار",      JB,  70, []),
      _c("job-bty-makeup",    "job-beauty", 2, "میکاپ",          JB,  70, []),
      _c("job-bty-skincare",  "job-beauty", 2, "متخصص پوست",   JB,  40, []),
      _c("job-bty-other",     "job-beauty", 2, "سایر",           JB,  20, []),
    ]),
    _c("job-transport", "jobs", 1, "حمل‌ونقل", JB, 300, [
      _c("job-trn-driver",   "job-transport", 2, "راننده",          JB, 120, []),
      _c("job-trn-courier",  "job-transport", 2, "پیک",             JB,  80, []),
      _c("job-trn-truck",    "job-transport", 2, "راننده کامیون",   JB,  60, []),
      _c("job-trn-taxi",     "job-transport", 2, "راننده تاکسی",    JB,  40, []),
    ]),
    _c("job-restaurant", "jobs", 1, "فروشگاه و رستوران", JB, 380, [
      _c("job-rst-seller",   "job-restaurant", 2, "فروشنده",    JB, 100, []),
      _c("job-rst-cashier",  "job-restaurant", 2, "صندوق‌دار",  JB,  50, []),
      _c("job-rst-chef",     "job-restaurant", 2, "آشپز",       JB,  90, []),
      _c("job-rst-sous",     "job-restaurant", 2, "کمک‌آشپز",   JB,  60, []),
      _c("job-rst-waiter",   "job-restaurant", 2, "گارسون",     JB,  50, []),
      _c("job-rst-manager",  "job-restaurant", 2, "مدیر فروشگاه",JB, 30, []),
    ]),
    _c("job-services", "jobs", 1, "خدمات", JB, 340, [
      _c("job-svc-clean",    "job-services", 2, "نظافت",        JB, 100, []),
      _c("job-svc-porter",   "job-services", 2, "سرایداری",     JB,  80, []),
      _c("job-svc-security", "job-services", 2, "نگهبانی",      JB, 100, []),
      _c("job-svc-home",     "job-services", 2, "خدمات منزل",   JB,  40, []),
      _c("job-svc-general",  "job-services", 2, "خدمات عمومی",  JB,  20, []),
    ]),
    _c("job-media", "jobs", 1, "هنری و رسانه", JB, 280, [
      _c("job-med-photo",  "job-media", 2, "عکاسی",        JB,  60, []),
      _c("job-med-video",  "job-media", 2, "فیلمبرداری",   JB,  50, []),
      _c("job-med-edit",   "job-media", 2, "تدوین",        JB,  40, []),
      _c("job-med-graph",  "job-media", 2, "گرافیک",       JB,  50, []),
      _c("job-med-actor",  "job-media", 2, "بازیگری",      JB,  30, []),
      _c("job-med-music",  "job-media", 2, "موسیقی",       JB,  20, []),
      _c("job-med-write",  "job-media", 2, "نویسندگی",     JB,  30, []),
    ]),
    _c("job-architecture", "jobs", 1, "معماری و ساختمان", JB, 220, [
      _c("job-arc-arch",     "job-architecture", 2, "معمار",          JB,  70, []),
      _c("job-arc-civil",    "job-architecture", 2, "مهندس عمران",   JB,  60, []),
      _c("job-arc-drafter",  "job-architecture", 2, "نقشه‌کش",       JB,  40, []),
      _c("job-arc-contract", "job-architecture", 2, "پیمانکار",       JB,  30, []),
      _c("job-arc-worker",   "job-architecture", 2, "کارگر ساختمانی",JB,  20, []),
    ]),
  ]),
];

/* ─── Live Ad/Chat/User Store ──────────────────────────────────────
   Runtime source of truth is the Banner backend. Module state is memory-only. */
let _ads: ABListing[] = [];
let _convs: ABConversation[] = [];
let _msgs: Record<string, ABMessage[]> = {};
let _myUser: ABUser = { userId:"", name:"", avatar:"", mobile:"", verificationStatus:"unverified", accountType:"personal", createdAt:"", lastActive:"" };
let _myFavs: string[] = [];
let _currentUid = "default";
let _bannerUsers: ABUser[] = [];
function mapApiListing(x: any): ABListing {
  const category = AB_CATS.find(c => c.name === x.category_name);
  return {
    listingId: String(x.id), token: "", ownerId: String(x.identity_id),
    categoryId: category?.categoryId ?? String(x.category_id), parentCategoryId: category?.parentId ?? "",
    title: x.title, description: x.description ?? "", images: Array.isArray(x.media_ids) ? x.media_ids.map((id:number)=>bannerMediaUrl(id)) : [],
    price: Number(x.price ?? 0), priceMode: x.price === null ? "negotiable" : "fixed",
    condition: (["new","like-new","good","used","for-parts"].includes(x.condition) ? x.condition : "used") as ABListing["condition"],
    cityId: x.city ?? "", provinceId: "", attributes: x.attributes && typeof x.attributes === "object" ? x.attributes : {}, status: x.status === "published" ? "active" : x.status,
    createdAt: x.created_at, updatedAt: x.updated_at, expiresAt: x.expires_at ?? "",
    viewCount: Number(x.views ?? 0), favoriteCount: 0, messageCount: 0,
    contactEnabled: x.contact_enabled !== false, chatEnabled: x.chat_enabled !== false,
    verificationStatus: "none",
  };
}
function upsertBannerUser(id:string,name?:string) {
  if (!id || !name?.trim()) return;
  if (_bannerUsers.some(u=>u.userId===id)) return;
  _bannerUsers.push({userId:id,name:name.trim(),avatar:"",mobile:"",verificationStatus:"unverified",accountType:"personal",createdAt:"",lastActive:""});
}
function abGetBannerUser(id:string){return _bannerUsers.find(u=>u.userId===id);}
async function initAnBannerStore(uid: string) {
  _currentUid = uid;
  _ads = []; _convs = []; _msgs = {}; _myFavs = []; _postchi = []; _bannerUsers = [];
  try {
    const [listings,favorites,profile,conversations,notifications] = await Promise.all([
      bannerApi.listings({limit:200}), bannerApi.favorites(), bannerApi.profile(), bannerApi.conversations(), bannerApi.notifications()
    ]);
    _ads = (listings.listings ?? []).map((x:any)=>{upsertBannerUser(String(x.identity_id),x.seller_display_name);return mapApiListing(x);});
    _myFavs = (favorites.listings ?? []).map((x:any)=>String(x.id));
    _myUser = {
      userId: uid, name: profile?.profile?.display_name ?? "کاربر آن بنر", avatar: "", mobile: profile?.profile?.phone ?? "",
      verificationStatus: "unverified", accountType: "personal", createdAt: profile?.profile?.created_at ?? new Date().toISOString(), lastActive: new Date().toISOString()
    };
    for (const conv of conversations.conversations ?? []) {
      const cid=String(conv.conversation_id);
      _convs.push({conversationId:cid,listingId:String(conv.listing_id),buyerId:String(conv.buyer_identity_id),sellerId:String(conv.seller_identity_id),createdAt:conv.created_at,lastMessageAt:conv.last_message_at,lastMessage:conv.last_message??"",status:conv.status==="archived"?"archived":"active",unreadCount:0});
    }
    await Promise.all(_convs.slice(0,50).map(async conv=>{try{const d=await bannerApi.conversation(conv.conversationId);_msgs[conv.conversationId]=(d.messages??[]).map((m:any)=>({messageId:String(m.message_id),conversationId:conv.conversationId,senderId:String(m.sender_identity_id),type:(m.message_type??"text") as ABMessage["type"],text:m.body||undefined,offerAmount:m.offer_amount?Number(m.offer_amount):undefined,media:m.media_mime?bannerMessageMediaUrl(m.message_id):undefined,createdAt:m.created_at,status:"delivered"}));}catch{}}));
    for (const n of notifications.notifications ?? []) _postchi.push({eventId:String(n.id),type:n.type==="support-reply"?"support-reply":"system",title:n.title,description:n.description,read:Boolean(n.read),createdAt:n.created_at});
  } catch (e) {
    console.error("An Banner API unavailable",e);
  }
  _notifyAds(); _notifyConvs(); _notifyPostchi();
}

let _adsListeners: (() => void)[] = [];
function _subscribeAds(fn: () => void) { _adsListeners.push(fn); return () => { _adsListeners = _adsListeners.filter(f => f !== fn); }; }
function _notifyAds() { _adsListeners.forEach(f => f()); }

function storeAds() { _notifyAds(); }
function storeConvs() { /* backend is source of truth */ }
function storeMsgs() { /* backend is source of truth */ }
function storeUser() { /* backend is source of truth */ }
function storeFavs() { /* backend is source of truth */ }

// --- Ad CRUD ---
function abGetAds(): ABListing[] { return _ads; }
function abAddAd(ad: ABListing) { _ads = [ad, ..._ads]; _notifyAds(); }
async function abUpdateAd(ad: ABListing) { try{await bannerApi.updateListing(ad.listingId,{title:ad.title,description:ad.description,price:ad.price,city:ad.cityId,condition:ad.condition,attributes:ad.attributes});_ads=_ads.map(a=>a.listingId===ad.listingId?ad:a);_notifyAds();}catch(e){console.error("listing_update_failed",e);} }
async function abDeleteAd(id: string) { try{await bannerApi.deleteListing(id);_ads=_ads.filter(a=>a.listingId!==id);_notifyAds();}catch(e){console.error("listing_delete_failed",e);} }
async function abCloseAd(id: string) { try{await bannerApi.updateListing(id,{status:"paused"});_ads=_ads.map(a=>a.listingId===id?{...a,status:"expired" as const,updatedAt:new Date().toISOString()}:a);_notifyAds();}catch(e){console.error("listing_pause_failed",e);} }
async function abReopenAd(id: string) { try{await bannerApi.updateListing(id,{status:"published"});_ads=_ads.map(a=>a.listingId===id?{...a,status:"active" as const,updatedAt:new Date().toISOString()}:a);_notifyAds();}catch(e){console.error("listing_reopen_failed",e);} }

// --- Conversation/Message CRUD ---
function abGetConvs(): ABConversation[] { return _convs; }
function abGetMsgs(cid: string): ABMessage[] { return _msgs[cid] ?? []; }
async function abAddMsg(cid: string, msg: ABMessage) {
  try {
    let mediaBase64:string|undefined; let mediaMime:string|undefined;
    if (msg.media && msg.media.startsWith("blob:")) {
      const blob=await fetch(msg.media).then(r=>r.blob());
      mediaMime=blob.type||"application/octet-stream";
      mediaBase64=await new Promise<string>((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(String(fr.result).split(",")[1]??"");fr.onerror=()=>reject(fr.error);fr.readAsDataURL(blob);});
    }
    const response=await bannerApi.sendMessage(cid,{message:msg.text??msg.sticker??"",type:msg.type,mediaBase64,mediaMime,offerAmount:msg.offerAmount});
    const sm=response?.message;
    const saved:ABMessage={...msg,messageId:String(sm?.message_id??msg.messageId),createdAt:sm?.created_at??msg.createdAt,status:"sent",media:sm?.message_id&&msg.media?bannerMessageMediaUrl(sm.message_id):msg.media};
    abAddMsgAndNotify(cid,saved);
  } catch(e) { console.error("An Banner message failed",e); }
}
async function abStartConv(listing: ABListing): Promise<string> {
  const existing = _convs.find(c => c.listingId === listing.listingId && c.buyerId === _currentUid);
  if (existing) return existing.conversationId;
  const response=await bannerApi.createConversation(listing.listingId,"");
  const cid=String(response.conversationId);
  const now=new Date().toISOString();
  _convs=[{conversationId:cid,listingId:listing.listingId,buyerId:_currentUid,sellerId:listing.ownerId,createdAt:now,lastMessageAt:now,lastMessage:"",status:"active",unreadCount:0},..._convs];
  storeConvsAndNotify(); return cid;
}

// --- User ---
function abGetUser(): ABUser { return _myUser; }
async function abUpdateUser(u: ABUser) {
  try{
    const body:any={displayName:u.name,phone:u.mobile};
    if(u.avatar?.startsWith("data:")){const m=u.avatar.match(/^data:([^;]+);base64,(.*)$/);if(m){body.avatarMime=m[1];body.avatarBase64=m[2];}}
    const r=await bannerApi.updateProfile(body);_myUser={...u,avatar:r?.profile?.avatar_data_url??u.avatar};_notifyAds();
  }catch(e){console.error("profile_update_failed",e);}
}

// --- Favs ---
function abGetFavs(): string[] { return _myFavs; }
function abToggleFav(id: string) { _myFavs = _myFavs.includes(id) ? _myFavs.filter(x => x !== id) : [..._myFavs, id]; storeFavs(); }

// Hook to subscribe to ad changes
function useAdsVersion() {
  const [v, setV] = useState(0);
  useEffect(() => _subscribeAds(() => setV(x => x + 1)), []);
  return v;
}

// --- Conversation / Message pub-sub (separate from ads) ---
let _convsListeners: (() => void)[] = [];
function _subscribeConvs(fn: () => void) { _convsListeners.push(fn); return () => { _convsListeners = _convsListeners.filter(f => f !== fn); }; }
function _notifyConvs() { _convsListeners.forEach(f => f()); }

function storeConvsAndNotify() { storeConvs(); _notifyConvs(); }

function abAddMsgAndNotify(cid: string, msg: ABMessage) {
  _msgs = { ..._msgs, [cid]: [...(_msgs[cid] ?? []), msg] };
  const lastText = msg.type === "text" ? (msg.text ?? "") : msg.type === "sticker" ? "🎭 استیکر" : msg.type === "voice" ? "🎤 پیام صوتی" : msg.type === "offer" ? `💰 ${fmtPrice(msg.offerAmount ?? 0)}` : "";
  _convs = _convs.map(c => c.conversationId === cid
    ? { ...c, lastMessage: lastText, lastMessageAt: msg.createdAt, unreadCount: msg.senderId === _currentUid ? 0 : c.unreadCount + 1 }
    : c);
  storeMsgs(); storeConvsAndNotify();
  // Also emit Postchi event for incoming messages
  if (msg.senderId !== _currentUid) {
    const conv = _convs.find(c => c.conversationId === cid);
    const listing = _ads.find(l => l.listingId === conv?.listingId);
    abAddPostchiEvent({
      eventId: `pe-msg-${msg.messageId}`,
      type: "new-message",
      title: "پیام جدید",
      description: listing ? `درباره: ${listing.title.slice(0, 40)}` : "پیام جدید دریافت شد",
      read: false, createdAt: msg.createdAt, conversationId: cid, listingId: conv?.listingId, color: "#2563EB",
    });
  }
}

function abMarkConvRead(cid: string) {
  _convs = _convs.map(c => c.conversationId === cid ? { ...c, unreadCount: 0 } : c);
  storeConvsAndNotify();
}

function useConvsVersion() {
  const [v, setV] = useState(0);
  useEffect(() => _subscribeConvs(() => setV(x => x + 1)), []);
  return v;
}

// --- Postchi (An Banner system notification) store ---
let _postchi: ABPostchiEvent[] = [];
let _postchiListeners: (() => void)[] = [];

function _subscribePostchi(fn: () => void) { _postchiListeners.push(fn); return () => { _postchiListeners = _postchiListeners.filter(f => f !== fn); }; }
function _notifyPostchi() { _postchiListeners.forEach(f => f()); }
function storePostchi() { _notifyPostchi(); }
function abGetPostchi(): ABPostchiEvent[] { return _postchi; }
function abAddPostchiEvent(ev: ABPostchiEvent) { _postchi = [ev, ..._postchi]; storePostchi(); }
function abMarkPostchiRead(id: string) { _postchi = _postchi.map(e => e.eventId === id ? { ...e, read: true } : e); storePostchi(); }
function abMarkAllPostchiRead() { _postchi = _postchi.map(e => ({ ...e, read: true })); storePostchi(); }
function usePostchiVersion() {
  const [v, setV] = useState(0);
  useEffect(() => _subscribePostchi(() => setV(x => x + 1)), []);
  return v;
}

/* ─── Screen: Home Tab ───────────────────────────────────────────── */
function ABHomeTab({ push, favs, toggleFav, citySelection, setShowCitySelector }: {
  push: (v: ABView) => void;
  favs: string[]; toggleFav: (id: string) => void;
  citySelection: CitySelection; setShowCitySelector: (v: boolean) => void;
}) {
  const [sheetCatId, setSheetCatId] = useState<string | null>(null);
  const _v = useAdsVersion();
  const latest = useMemo(() => {
    const items = abGetAds().filter(l => l.status === "active" && listingMatchesCity(l, citySelection));
    return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [citySelection, _v]);

  return (
    <div className="ab-page" style={{ background: "var(--ab-bg)" }}>
      {/* Search bar */}
      <div style={{ background: "var(--ab-bg2)", padding: "12px 12px 0" }}>
        <div
          style={{ display: "flex", alignItems: "center", background: "var(--ab-card2)", borderRadius: 10, padding: "0 12px", height: 48, cursor: "text", gap: 8, border: "1px solid var(--ab-border)" }}
          onClick={() => push({ t: "search", q: "" })}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ab-muted)" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span style={{ flex: 1, fontSize: 14, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif", direction: "rtl", textAlign: "right" }}>جستجو در همهٔ آگهی‌ها</span>
        </div>
        {/* Location bar — tappable city selector */}
        <div onClick={() => setShowCitySelector(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 0 10px", borderTop: "1px solid var(--ab-border)", marginTop: 10, cursor: "pointer" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ab-muted)" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span style={{ fontSize: 13, color: "var(--ab-text2)", fontFamily: "Vazirmatn,sans-serif" }}>شهر:</span>
          <span style={{ fontSize: 13, color: "var(--ab-red)", fontWeight: 700, fontFamily: "Vazirmatn,sans-serif" }}>{cityLabel(citySelection)}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ab-muted)" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--ab-border)" }} />

      {/* Categories grid — 4-column with SVG icons */}
      <div style={{ background: "var(--ab-bg2)", padding: "16px 0 8px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0 }}>
          {HOME_CATS.map(cat => (
            <div
              key={cat.id}
              onClick={() => setSheetCatId(cat.id)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "10px 4px 14px", cursor: "pointer" }}
            >
              <div style={{ width: 56, height: 56, borderRadius: 16, background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${cat.color}22` }}>
                <CatIcon id={cat.id} color={cat.color} />
              </div>
              <span style={{ fontSize: 11, color: "var(--ab-text2)", textAlign: "center", lineHeight: 1.4, fontFamily: "Vazirmatn,sans-serif" }}>{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Listings - single-column list like Divar */}
      <div style={{ marginTop: 8, background: "var(--ab-bg2)" }}>
        {latest.map(l => (
          <div
            key={l.listingId}
            onClick={() => push({ t: "listing", lid: l.listingId })}
            style={{ display: "flex", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--ab-border)", cursor: "pointer", background: "transparent", flexDirection: "row-reverse", alignItems: "flex-start" }}
          >
            {/* Image */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img
                src={l.images[0]}
                alt={l.title}
                style={{ width: 128, height: 128, objectFit: "cover", borderRadius: 12, display: "block", background: "var(--ab-card2)" }}
                onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Crect width='128' height='128' rx='12' fill='%231A1D2C'/%3E%3Cpath d='M54 64a10 10 0 1 0 20 0 10 10 0 0 0-20 0z' stroke='%235C6485' stroke-width='2' fill='none'/%3E%3Cpath d='M40 80c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16' stroke='%235C6485' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"; }}
              />
              {l.images.length > 1 && (
                <div style={{ position: "absolute", bottom: 5, right: 5, background: "rgba(0,0,0,0.65)", borderRadius: 6, padding: "2px 6px", display: "flex", alignItems: "center", gap: 3 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span style={{ color: "#FFF", fontSize: 10, fontFamily: "Vazirmatn,sans-serif" }}>{toFaD(l.images.length)}</span>
                </div>
              )}
            </div>
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0, direction: "rtl" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ab-text)", lineHeight: 1.5, marginBottom: 8, fontFamily: "Vazirmatn,sans-serif" }}>{l.title}</div>
              <div style={{ fontSize: 13, color: "var(--ab-text2)", marginBottom: 4, fontFamily: "Vazirmatn,sans-serif" }}>{condLabel(l.condition)}</div>
              <div style={{ fontSize: 13, color: "var(--ab-text2)", marginBottom: 4, fontFamily: "Vazirmatn,sans-serif" }}>{fmtPrice(l.price, l.priceMode === "negotiable" ? undefined : l.priceMode)}</div>
              <div style={{ fontSize: 13, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif" }}>{timeAgo(l.createdAt)} · {cityNameById(l.cityId)}</div>
            </div>
          </div>
        ))}
      </div>

      <ABCategorySheet
        catId={sheetCatId}
        onClose={() => setSheetCatId(null)}
        onSelectFinal={(cid) => { push({ t: "cat", cid }); setSheetCatId(null); }}
      />
    </div>
  );
}

/* ─── Screen: Category Listings ──────────────────────────────────── */
function ABCatListings({ cid, push, pop, favs, toggleFav, citySelection, setShowCitySelector }: {
  cid: string; push: (v: ABView) => void; pop?: () => void; favs: string[]; toggleFav: (id: string) => void;
  citySelection?: CitySelection; setShowCitySelector?: (v: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [showSubSheet, setShowSubSheet] = useState(false);
  const _v = useAdsVersion();
  const cat = findCatById(cid) ?? AB_CATS[0];
  const breadcrumb = useMemo(() => getBreadcrumb(cid), [cid]);
  const descendantIds = useMemo(() => getAllDescendantIds(cid), [cid]);
  // find the root category for the sheet navigation
  const rootCatId = breadcrumb.length > 0 ? breadcrumb[0].categoryId : cid;
  const goBack = pop ?? (() => push({ t: "home" }));

  const listings = useMemo(() => {
    const sel: CitySelection = citySelection ?? { type: "all" };
    const items = abGetAds().filter(l => descendantIds.includes(l.categoryId) && l.status === "active" && listingMatchesCity(l, sel));
    const sorted = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (!search.trim()) return sorted;
    return sorted.filter(l => l.title.includes(search) || l.description.includes(search));
  }, [cid, descendantIds, search, citySelection, _v]);

  const subcats = cat.children;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ABHeader
        title={cat.name}
        onBack={goBack}
        rightSlot={
          <button className="ab-icon-btn" onClick={() => push({ t: "search", q: "" })}>
            <ABIco name="search" size={20} color="var(--ab-text)" />
          </button>
        }
      />

      <div className="ab-page" style={{ padding: 0 }}>
        {/* Category breadcrumb + subcategory selector */}
        <div style={{ background: "var(--ab-bg2)", borderBottom: "1px solid var(--ab-border)", padding: "10px 16px 10px", direction: "rtl" }}>
          {/* Breadcrumb row */}
          {breadcrumb.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, overflowX: "auto", scrollbarWidth: "none", flexWrap: "nowrap", marginBottom: 8 }}>
              {breadcrumb.map((bc, i) => (
                <React.Fragment key={bc.categoryId}>
                  {i > 0 && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>}
                  {i < breadcrumb.length - 1 ? (
                    <button onClick={() => { push({ t: "cat", cid: bc.categoryId }); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", fontSize: 12, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif", whiteSpace: "nowrap" }}>{bc.name}</button>
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ab-text)", fontFamily: "Vazirmatn,sans-serif", whiteSpace: "nowrap" }}>{bc.name}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
          {/* Subcategory chips — text only, no icons */}
          {subcats.length > 0 && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
              <button
                onClick={() => setShowSubSheet(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--ab-card2)", border: "1.5px solid var(--ab-border)", borderRadius: 20, padding: "6px 14px", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", fontSize: 13, fontWeight: 600, color: "var(--ab-text2)", whiteSpace: "nowrap", flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ab-muted)" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
                انتخاب زیردسته
              </button>
              {subcats.slice(0, 5).map(sub => (
                <button key={sub.categoryId} onClick={() => push({ t: "cat", cid: sub.categoryId })}
                  style={{ background: "var(--ab-card)", border: "1.5px solid var(--ab-border)", borderRadius: 20, padding: "6px 14px", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", fontSize: 13, color: "var(--ab-text2)", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {sub.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search bar */}
        <div style={{ padding: "10px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", background: "var(--ab-card2)", border: "1px solid var(--ab-border)", borderRadius: 12, padding: "0 12px", height: 44, gap: 8 }}>
            <ABIco name="search" size={16} color="var(--ab-muted)" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`جستجو در ${cat.name}…`}
              style={{ flex: 1, border: "none", background: "transparent", fontFamily: "Vazirmatn,sans-serif", fontSize: 14, color: "var(--ab-text)", outline: "none", direction: "rtl" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
                <ABIco name="x" size={14} color="#AAA" />
              </button>
            )}
          </div>
        </div>

        {/* Listing count */}
        <div style={{ padding: "0 16px 8px" }}>
          <span style={{ fontSize: 13, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif" }}>
            {toFaD(listings.length)} آگهی — جدیدترین ابتدا
          </span>
        </div>

        {/* Subcategory bottom sheet */}
        {showSubSheet && (
          <ABCategorySheet
            catId={rootCatId}
            onClose={() => setShowSubSheet(false)}
            onSelectFinal={(finalCid) => { push({ t: "cat", cid: finalCid }); setShowSubSheet(false); }}
          />
        )}

        {/* Listings */}
        {listings.length === 0 ? (
          <ABEmpty title="آگهی‌ای یافت نشد" desc="در این دسته‌بندی آگهی‌ای وجود ندارد" icon="🔍" />
        ) : (
          <div style={{ background: "transparent" }}>
            {listings.map(l => (
              <div
                key={l.listingId}
                onClick={() => push({ t: "listing", lid: l.listingId })}
                style={{ display: "flex", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--ab-border)", cursor: "pointer", flexDirection: "row-reverse", alignItems: "flex-start" }}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img
                    src={l.images[0]} alt={l.title}
                    style={{ width: 128, height: 128, objectFit: "cover", borderRadius: 12, display: "block" }}
                    onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' fill='%231a1d2c'%3E%3Crect width='128' height='128'/%3E%3C/svg%3E"; }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0, direction: "rtl" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ab-text)", lineHeight: 1.5, marginBottom: 8, fontFamily: "Vazirmatn,sans-serif" }}>{l.title}</div>
                  <div style={{ fontSize: 13, color: "var(--ab-text2)", marginBottom: 4, fontFamily: "Vazirmatn,sans-serif" }}>{condLabel(l.condition)}</div>
                  <div style={{ fontSize: 13, color: "var(--ab-text2)", marginBottom: 4, fontFamily: "Vazirmatn,sans-serif" }}>{fmtPrice(l.price, l.priceMode)}</div>
                  <div style={{ fontSize: 13, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif" }}>{timeAgo(l.createdAt)} · {cityNameById(l.cityId)}</div>
                </div>
                <button className="ab-icon-btn" style={{ alignSelf: "center", flexShrink: 0 }} onClick={e => { e.stopPropagation(); toggleFav(l.listingId); }}>
                  <ABIco name={favs.includes(l.listingId) ? "heartFill" : "heart"} size={18} color={favs.includes(l.listingId) ? "#E8354E" : "var(--ab-muted)"} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Screen: Listing Detail ─────────────────────────────────────── */
function ABListingDetail({ lid, push, pop, favs, toggleFav, isMyAd, onDelete, onStartChat, onBackToPardaz }: {
  lid: string; push: (v: ABView) => void; pop?: () => void; favs: string[]; toggleFav: (id: string) => void;
  isMyAd?: boolean; onDelete?: (id: string) => void; onStartChat?: (cid: string) => void; onBackToPardaz?: () => void;
}) {
  const _v = useAdsVersion();
  const listing = abGetAds().find(l => l.listingId === lid);
  const [showPhone, setShowPhone] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [reported, setReported] = useState(false);

  if (!listing) return <ABEmpty title="آگهی یافت نشد" icon="🔍" />;
  const owner = abGetBannerUser(listing.ownerId);
  const city = cityNameById(listing.cityId);
  const isFav = favs.includes(listing.listingId);
  const goBack = pop ?? (() => push({ t: "home" }));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* ── Detail Header: back (right in RTL), pardaz link + actions (left) ── */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", alignItems: "center", padding: "10px 12px", gap: 8, direction: "rtl" }}>
        {/* Back button — right in RTL */}
        <button className="ab-icon-btn" style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 11, flexShrink: 0, boxShadow: "0 1px 6px rgba(0,0,0,0.18)" }} onClick={goBack}>
          <ABIco name="arrow" size={22} color="#1a1a2e" />
        </button>
        <div style={{ flex: 1 }} />
        {/* Action buttons — left in RTL */}
        <button className="ab-icon-btn" style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 11, flexShrink: 0, boxShadow: "0 1px 6px rgba(0,0,0,0.18)" }} onClick={() => toggleFav(listing.listingId)}>
          <ABIco name={isFav ? "heartFill" : "heart"} size={20} color={isFav ? "#E8354E" : "#1a1a2e"} />
        </button>
        <button className="ab-icon-btn" style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 11, flexShrink: 0, boxShadow: "0 1px 6px rgba(0,0,0,0.18)" }}>
          <ABIco name="share" size={20} color="#1a1a2e" />
        </button>
        {onBackToPardaz && (
          <button onClick={onBackToPardaz} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 20, padding: "5px 10px 5px 8px", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", fontSize: 10, fontWeight: 700, color: "#1a1a2e", flexShrink: 0, whiteSpace: "nowrap", boxShadow: "0 1px 6px rgba(0,0,0,0.18)" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            آن‌پرداز
          </button>
        )}
      </div>
      <div className="ab-page">
        {/* Gallery */}
        <ABImageGallery images={listing.images} title={listing.title} />

        {/* Title & Price */}
        <div style={{ padding: "16px 16px 12px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            {listing.isUrgent && <span className="ab-badge ab-badge-urgent">🔥 فوری</span>}
            {listing.isFeatured && <span className="ab-badge ab-badge-featured">⭐ ویژه</span>}
            <ABCondBadge condition={listing.condition} />
            {listing.verificationStatus === "verified" && <span className="ab-badge ab-badge-verified">✓ تایید شده</span>}
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: "var(--ab-text)", lineHeight: 1.5, margin: "0 0 10px" }}>{listing.title}</h1>
          <div style={{ fontSize: 22, fontWeight: 900, color: "var(--ab-text)", marginBottom: 8 }}>{fmtPrice(listing.price, listing.priceMode)}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--ab-muted)", fontSize: 12 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><ABIco name="map" size={12} color="var(--ab-muted)" />{city}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><ABIco name="clock" size={12} color="var(--ab-muted)" />{timeAgo(listing.createdAt)}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><ABIco name="eye" size={12} color="var(--ab-muted)" />{toFaD(listing.viewCount)} بازدید</span>
          </div>
        </div>

        <div className="ab-divider" />

        {/* Attributes */}
        {Object.keys(listing.attributes).length > 0 && (
          <div style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ab-text)", marginBottom: 12 }}>مشخصات</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, borderRadius: 12, overflow: "hidden", border: "1px solid var(--ab-border)" }}>
              {Object.entries(listing.attributes).map(([k, v], i) => (
                <div key={k} style={{ padding: "10px 12px", background: i % 4 < 2 ? "var(--ab-card2)" : "var(--ab-card)", borderBottom: "1px solid var(--ab-border)" }}>
                  <div style={{ fontSize: 11, color: "var(--ab-muted)", marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ab-text)" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="ab-divider" />

        {/* Description */}
        <div style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ab-text)", marginBottom: 10 }}>توضیحات</div>
          <div style={{ fontSize: 14, color: "var(--ab-text2)", lineHeight: 1.8, overflow: expanded ? undefined : "hidden", maxHeight: expanded ? undefined : 80 }}>
            {listing.description}
          </div>
          {listing.description.length > 120 && (
            <button onClick={() => setExpanded(!expanded)} style={{ marginTop: 8, background: "none", border: "none", color: "var(--ab-red)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Vazirmatn, sans-serif", padding: 0 }}>
              {expanded ? "نمایش کمتر" : "نمایش بیشتر"}
            </button>
          )}
        </div>

        <div className="ab-section-divider" />

        {/* Seller Card */}
        {owner && (
          <div style={{ padding: "16px 0" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ab-text)", padding: "0 16px 12px" }}>فروشنده</div>
            <ABSellerCard user={owner} listing={listing}
              onProfile={() => push({ t: "profile", uid: owner.userId })}
              onCall={() => setShowPhone(true)}
              onChat={() => { void abStartConv(listing).then(cid => { if (onStartChat) onStartChat(cid); else push({ t: "chat", cid }); }); }}
            />
            {isMyAd && (
              <div style={{ display: "flex", gap: 8, margin: "10px 16px 0", flexWrap: "wrap" }}>
                <button onClick={() => push({ t: "edit-post", lid: listing.listingId })}
                  style={{ flex: 1, minWidth: 90, height: 46, borderRadius: 13, border: "1.5px solid var(--ab-border)", background: "var(--ab-card2)", fontSize: 13, fontWeight: 700, color: "var(--ab-text)", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <ABIco name="edit" size={15} color="var(--ab-text)" />ویرایش</button>
                {listing.status === "active" ? (
                  <button onClick={() => abCloseAd(listing.listingId)}
                    style={{ flex: 1, minWidth: 90, height: 46, borderRadius: 13, border: "1.5px solid rgba(217,119,6,0.3)", background: "rgba(217,119,6,0.07)", fontSize: 13, fontWeight: 700, color: "#D97706", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <ABIco name="x" size={15} color="#D97706" />بستن آگهی</button>
                ) : (
                  <button onClick={() => abReopenAd(listing.listingId)}
                    style={{ flex: 1, minWidth: 90, height: 46, borderRadius: 13, border: "1.5px solid rgba(5,150,105,0.3)", background: "rgba(5,150,105,0.07)", fontSize: 13, fontWeight: 700, color: "var(--ab-green)", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <ABIco name="check" size={15} color="var(--ab-green)" />بازگشایی</button>
                )}
                <button onClick={() => { if (window.confirm("آیا از حذف این آگهی مطمئن هستید؟")) { abDeleteAd(listing.listingId); onDelete?.(listing.listingId); push({ t: "my-listings" }); } }}
                  style={{ flex: 1, minWidth: 90, height: 46, borderRadius: 13, border: "1.5px solid rgba(232,53,78,0.25)", background: "rgba(232,53,78,0.08)", fontSize: 13, fontWeight: 700, color: "var(--ab-red)", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <ABIco name="trash" size={15} color="var(--ab-red)" />حذف</button>
              </div>
            )}
            {showPhone && (
              <div style={{ margin: "10px 16px 0", padding: "12px 16px", background: "var(--ab-green-light)", borderRadius: 12, border: "1px solid rgba(5,150,105,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
                <ABIco name="phone" size={18} color="var(--ab-green)" />
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--ab-green)", letterSpacing: 1, direction: "ltr" }}>{owner.mobile}</span>
              </div>
            )}
          </div>
        )}

        {/* Report */}
        <div style={{ padding: "0 16px 16px" }}>
          <button onClick={() => setReported(true)} style={{ width: "100%", padding: "11px", borderRadius: 11, border: "1px solid var(--ab-border)", background: "transparent", fontSize: 12, color: reported ? "var(--ab-muted)" : "var(--ab-red)", fontFamily: "Vazirmatn, sans-serif", cursor: reported ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <ABIco name="report" size={14} color={reported ? "var(--ab-muted)" : "var(--ab-red)"} />
            {reported ? "گزارش ارسال شد" : "گزارش تخلف"}
          </button>
        </div>

      </div>
    </div>
  );
}

/* ─── Single City Picker (single-select for posting) ─────────────── */
function ABSingleCityPicker({ cityId, onClose, onSelect }: {
  cityId: string; onClose: () => void; onSelect: (id: string) => void;
}) {
  const [search, setSearch] = React.useState("");
  const initProv = IRAN_PROVINCES.find(p => p.cities.some(c => c.id === cityId))?.id ?? "tehran";
  const [expanded, setExpanded] = React.useState<string | null>(initProv);
  const filtered = search.trim()
    ? IRAN_PROVINCES.map(p => ({ ...p, cities: p.cities.filter(c => c.name.includes(search) || p.name.includes(search)) })).filter(p => p.cities.length > 0)
    : IRAN_PROVINCES;
  return createPortal(
    <>
      <div className="ab-sheet-overlay" onClick={onClose} />
      <div className="ab-sheet" style={{ maxHeight: "88vh" }}>
        <div className="ab-sheet-handle" />
        <div className="ab-sheet-header">
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ab-text2)" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <span style={{ fontSize: 17, fontWeight: 800, color: "var(--ab-text)", fontFamily: "Vazirmatn,sans-serif" }}>انتخاب شهر آگهی</span>
          <div style={{ width: 32 }} />
        </div>
        <div style={{ padding: "8px 14px 6px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", background: "var(--ab-card2)", border: "1px solid var(--ab-border)", borderRadius: 12, padding: "0 12px", height: 44, gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ab-muted)" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجوی شهر یا استان…" style={{ flex: 1, border: "none", background: "transparent", fontFamily: "Vazirmatn,sans-serif", fontSize: 14, color: "var(--ab-text)", outline: "none", direction: "rtl" }} />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ab-muted)" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>}
          </div>
        </div>
        <div className="ab-sheet-body">
          {filtered.map(prov => {
            const isExp = expanded === prov.id;
            return (
              <div key={prov.id}>
                <div onClick={() => setExpanded(isExp ? null : prov.id)} style={{ display: "flex", alignItems: "center", padding: "15px 18px", cursor: "pointer", borderBottom: "1px solid var(--ab-border)", background: isExp ? "var(--ab-card2)" : "transparent" }}>
                  <span style={{ flex: 1, fontSize: 16, fontWeight: 700, color: "var(--ab-text)", fontFamily: "Vazirmatn,sans-serif" }}>{prov.name}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ab-muted)" strokeWidth="2" strokeLinecap="round">
                    {isExp ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
                  </svg>
                </div>
                {isExp && prov.cities.map(city => {
                  const sel = city.id === cityId;
                  return (
                    <div key={city.id} onClick={() => { onSelect(city.id); onClose(); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 50px 14px 18px", borderBottom: "1px solid var(--ab-border2)", cursor: "pointer", background: sel ? "rgba(232,53,78,0.07)" : "var(--ab-card2)" }}>
                      <div style={{ width: 24, height: 24, borderRadius: 12, border: `2.5px solid ${sel ? "var(--ab-red)" : "var(--ab-faint)"}`, background: sel ? "var(--ab-red)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {sel && <div style={{ width: 9, height: 9, borderRadius: 5, background: "#FFF" }} />}
                      </div>
                      <span style={{ fontSize: 15, color: sel ? "var(--ab-red)" : "var(--ab-text2)", fontWeight: sel ? 700 : 400, fontFamily: "Vazirmatn,sans-serif" }}>{city.name}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>,
    document.body
  );
}

/* ─── Square Crop Editor ─────────────────────────────────────────── */
function ABCropEditor({ src, onConfirm, onCancel }: { src: string; onConfirm: (d: string) => void; onCancel: () => void }) {
  const CROP = 272;
  const [scale, setScale] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [imgNat, setImgNat] = React.useState<{ w: number; h: number } | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const startRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const basePx = imgNat ? CROP / Math.min(imgNat.w, imgNat.h) : 1;
  const dW = imgNat ? imgNat.w * basePx * scale : CROP;
  const dH = imgNat ? imgNat.h * basePx * scale : CROP;

  const onPD = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget).setPointerCapture(e.pointerId);
    setDragging(true);
    startRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPM = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setOffset({ x: startRef.current.ox + e.clientX - startRef.current.x, y: startRef.current.oy + e.clientY - startRef.current.y });
  };
  const onPU = () => setDragging(false);

  const confirm = () => {
    const canvas = canvasRef.current, img = imgRef.current;
    if (!canvas || !img || !imgNat) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 1080; canvas.height = 1080;
    const imgLeft = CROP / 2 + offset.x - dW / 2;
    const imgTop  = CROP / 2 + offset.y - dH / 2;
    const srcX = (-imgLeft) / basePx / scale;
    const srcY = (-imgTop) / basePx / scale;
    const srcSz = CROP / basePx / scale;
    ctx.drawImage(img, srcX, srcY, srcSz, srcSz, 0, 0, 1080, 1080);
    onConfirm(canvas.toDataURL("image/jpeg", 0.88));
  };

  const cornerStyles: React.CSSProperties[] = [
    { top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3, borderBottomWidth: 0, borderLeftWidth: 0 },
    { top: -2, left: -2, borderTopWidth: 3, borderRightWidth: 0, borderBottomWidth: 0, borderLeftWidth: 3 },
    { bottom: -2, right: -2, borderTopWidth: 0, borderRightWidth: 3, borderBottomWidth: 3, borderLeftWidth: 0 },
    { bottom: -2, left: -2, borderTopWidth: 0, borderRightWidth: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  ];

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 802, background: "#0a0a0a", display: "flex", flexDirection: "column", direction: "rtl" }}>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div style={{ background: "#0d0d0d", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, borderBottom: "1px solid #222" }}>
        <button onClick={onCancel} style={{ color: "#CCC", background: "rgba(255,255,255,0.07)", border: "1px solid #444", borderRadius: 10, padding: "9px 18px", fontFamily: "Vazirmatn,sans-serif", fontSize: 14, cursor: "pointer" }}>لغو</button>
        <span style={{ color: "#FFF", fontSize: 16, fontWeight: 800, fontFamily: "Vazirmatn,sans-serif" }}>برش مربعی تصویر</span>
        <button onClick={confirm} style={{ color: "#FFF", background: "var(--ab-red)", border: "none", borderRadius: 10, padding: "9px 20px", fontFamily: "Vazirmatn,sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>تأیید</button>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--ab-bg)" }}>
        <div style={{ position: "relative" }}>
          <div
            style={{ width: CROP, height: CROP, overflow: "hidden", position: "relative", cursor: dragging ? "grabbing" : "grab", outline: "3px solid rgba(255,255,255,0.55)", borderRadius: 4 }}
            onPointerDown={onPD} onPointerMove={onPM} onPointerUp={onPU} onPointerLeave={onPU}
          >
            <img ref={imgRef} src={src} alt="crop" draggable={false}
              onLoad={() => { const i = imgRef.current; if (i) setImgNat({ w: i.naturalWidth, h: i.naturalHeight }); }}
              style={{ position: "absolute", width: dW, height: dH, top: "50%", left: "50%", transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`, userSelect: "none", pointerEvents: "none", objectFit: "fill" }}
            />
          </div>
          {cornerStyles.map((s, i) => (
            <div key={i} style={{ position: "absolute", width: 22, height: 22, borderColor: "rgba(255,255,255,0.85)", borderStyle: "solid", ...s }} />
          ))}
        </div>
      </div>
      <div style={{ background: "#0d0d0d", padding: "20px 28px", paddingBottom: "calc(20px + env(safe-area-inset-bottom,0px))", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ab-muted)" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <input type="range" min={0.5} max={4} step={0.01} value={scale} onChange={e => setScale(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--ab-red)", height: 4 }} />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ab-muted)" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        </div>
        <div style={{ fontSize: 12, color: "var(--ab-muted)", textAlign: "center", fontFamily: "Vazirmatn,sans-serif" }}>تصویر را بکشید · از نوار لغزنده برای بزرگ‌نمایی استفاده کنید</div>
      </div>
    </div>,
    document.body
  );
}

/* ─── Screen: Post Listing Flow ──────────────────────────────────── */
function ABPostFlow({ push }: {
  push: (v: ABView) => void;
}) {
  /* ALL hooks before any conditional return */
  const [step, setStep] = useState(0);
  const [adStatus, setAdStatus] = useState<"draft" | "reviewing" | "approved" | "published">("draft");
  const [form, setForm] = useState<{ title: string; desc: string; price: string; priceMode: "fixed"|"negotiable"|"free"|"swap"; condition: "new"|"like-new"|"good"|"used"|"for-parts" }>({ title: "", desc: "", price: "", priceMode: "fixed", condition: "used" });
  const [contactMethods, setContactMethods] = useState<{ phone: boolean; chat: boolean }>({ phone: true, chat: true });
  const [errors, setErrors] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [showCatSheet, setShowCatSheet] = useState(false);
  const [catSheetRoot, setCatSheetRoot] = useState<string | null>(null);
  const [selectedLeaf, setSelectedLeaf] = useState<ABCategory | null>(null);
  const [postCity, setPostCity] = useState("tehran");
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [dynFields, setDynFields] = useState<Record<string, string>>({});
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef<{ form: typeof form; photos: string[]; selectedLeaf: ABCategory | null; postCity: string; dynFields: Record<string, string>; contactMethods: { phone: boolean; chat: boolean } } | null>(null);
  const [aiAnim, setAiAnim] = useState(false);
  const [aiOverridden, setAiOverridden] = useState(false);
  const [aiSetFields, setAiSetFields] = useState<{cat?:boolean;condition?:boolean;price?:boolean}>({});

  /* ── Real submission: the backend is the only source of listing status ── */
  useEffect(() => {
    if (adStatus !== "reviewing") return;
    const data=submittedRef.current;
    if(!data||!data.selectedLeaf)return;
    let cancelled=false;
    (async()=>{
      try{
        const cats=await bannerApi.categories();
        const cat=cats.categories.find((x:any)=>x.name===data.selectedLeaf?.name||x.slug===data.selectedLeaf?.categoryId);
        if(!cat)throw new Error("banner_category_not_configured");
        const price=data.form.priceMode==="fixed"?(Number(data.form.price.replace(/[^0-9۰-۹]/g,"").replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))))||0):null;
        const created=await bannerApi.createListing({
          categoryId:Number(cat.id),title:data.form.title.trim(),description:data.form.desc.trim(),price,
          condition:data.form.condition,city:cityNameById(data.postCity),currency:"IRR",attributes:data.dynFields
        });
        const id=String(created.listing.id);
        for(const src of data.photos){
          if(src.startsWith("data:")){
            const blob=await fetch(src).then(x=>x.blob());
            const file=new File([blob],"banner-image.jpg",{type:blob.type||"image/jpeg"});
            await bannerApi.uploadMedia(id,file);
          }
        }
        if(!cancelled){
          const live=await bannerApi.myListings();
          _ads=(live.listings??[]).map((x:any)=>mapApiListing(x));
          _notifyAds();
        }
      }catch(e){
        if(!cancelled){setErrors([e instanceof Error?e.message:"banner_submit_failed"]);setAdStatus("draft");}
      }
    })();
    return()=>{cancelled=true};
  },[adStatus]);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErrors(["فقط فایل‌های تصویری مجاز هستند."]); return; }
    if (file.size > 15 * 1024 * 1024) { setErrors(["حجم تصویر نباید بیشتر از ۱۵ مگابایت باشد."]); return; }
    const reader = new FileReader();
    reader.onload = ev => { const s = ev.target?.result as string; if (s) setCropSrc(s); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const getDynFields = (cat: ABCategory | null): { key: string; label: string; placeholder: string }[] => {
    if (!cat) return [];
    const id = cat.categoryId;
    if (id.startsWith("re-")) return [
      { key: "area", label: "متراژ (متر مربع)", placeholder: "مثال: ۸۵" },
      { key: "rooms", label: "تعداد اتاق", placeholder: "مثال: ۲" },
      { key: "year", label: "سال ساخت", placeholder: "مثال: ۱۴۰۰" },
      { key: "floor", label: "طبقه", placeholder: "مثال: ۳" },
    ];
    if (id.startsWith("veh-car") || id.startsWith("veh-pass")) return [
      { key: "brand", label: "برند", placeholder: "مثال: تویوتا" },
      { key: "model", label: "مدل", placeholder: "مثال: کمری" },
      { key: "year", label: "سال تولید", placeholder: "مثال: ۱۴۰۲" },
      { key: "km", label: "کارکرد (کیلومتر)", placeholder: "مثال: ۵۰,۰۰۰" },
      { key: "color", label: "رنگ", placeholder: "مثال: سفید" },
    ];
    if (id.startsWith("veh-moto")) return [
      { key: "brand", label: "برند", placeholder: "مثال: هوندا" },
      { key: "year", label: "سال تولید", placeholder: "مثال: ۱۴۰۲" },
      { key: "km", label: "کارکرد (کیلومتر)", placeholder: "مثال: ۸,۰۰۰" },
    ];
    if (id.startsWith("dig-mob")) return [
      { key: "brand", label: "برند", placeholder: "مثال: اپل" },
      { key: "model", label: "مدل", placeholder: "مثال: آیفون ۱۵ پرو مکس" },
      { key: "storage", label: "حافظه داخلی", placeholder: "مثال: ۲۵۶ گیگ" },
      { key: "color", label: "رنگ", placeholder: "مثال: مشکی" },
    ];
    if (id.startsWith("dig-lap")) return [
      { key: "brand", label: "برند", placeholder: "مثال: ایسوس" },
      { key: "cpu", label: "پردازنده", placeholder: "مثال: Core i5" },
      { key: "ram", label: "رم", placeholder: "مثال: ۸ گیگ" },
      { key: "storage", label: "حافظه", placeholder: "مثال: SSD 512" },
    ];
    if (id.startsWith("ent-book")) return [
      { key: "author", label: "نویسنده", placeholder: "مثال: دوستایوفسکی" },
      { key: "publisher", label: "ناشر", placeholder: "مثال: نشر نی" },
      { key: "year", label: "سال چاپ", placeholder: "مثال: ۱۴۰۱" },
    ];
    if (id.startsWith("job-")) return [
      { key: "contract", label: "نوع همکاری", placeholder: "مثال: تمام‌وقت" },
      { key: "hours", label: "ساعت کاری", placeholder: "مثال: ۸ تا ۵" },
      { key: "salary", label: "حقوق پیشنهادی", placeholder: "مثال: توافقی" },
    ];
    if (id.startsWith("svc-")) return [
      { key: "serviceType", label: "نوع خدمت", placeholder: "مثال: نصب و راه‌اندازی" },
      { key: "coverage", label: "محدوده خدمت", placeholder: "مثال: تهران" },
      { key: "experience", label: "سابقه کار", placeholder: "مثال: ۵ سال" },
    ];
    return [];
  };

  const dynamicFields = getDynFields(selectedLeaf);
  const STEPS = ["تصویر و توضیحات", "دسته‌بندی", "قیمت و ارسال"];
  const cityName = IRAN_PROVINCES.flatMap(p => p.cities).find(c => c.id === postCity)?.name ?? "تهران";
  const rootCatColor = AB_CATS.find(c => selectedLeaf?.categoryId.startsWith(c.categoryId))?.color ?? "#999";

  const runAiCategorization = (title: string, desc: string) => {
    /* Simulate AI: pick a category based on keywords, auto-fill condition and price */
    const text = (title + " " + desc).toLowerCase();
    let aiCat: ABCategory | null = null;
    const catHints: [string[], string][] = [
      [["موبایل","گوشی","آیفون","سامسونگ","اپل","شیائومی"], "mob-phone"],
      [["لپ‌تاپ","لپتاپ","laptop","کامپیوتر","نوتبوک"], "elec-laptop"],
      [["ماشین","خودرو","پراید","پژو","رنو","سمند"], "veh-car"],
      [["خانه","آپارتمان","اجاره","رهن","ملک","زمین"], "prop-apart"],
      [["کتاب","کتب"], "ent-book"],
    ];
    for (const [keywords, catId] of catHints) {
      if (keywords.some(k => text.includes(k))) {
        const found = findCatById(catId);
        if (found) { aiCat = found; break; }
      }
    }
    if (!aiCat) {
      const allLeaves: ABCategory[] = [];
      const collectLeaves = (cats: ABCategory[]) => cats.forEach(c => { if (c.children.length === 0) allLeaves.push(c); else collectLeaves(c.children); });
      collectLeaves(AB_CATS);
      aiCat = allLeaves[Math.floor(Math.random() * Math.min(allLeaves.length, 12))];
    }
    const aiCondition: typeof form.condition = text.includes("نو") || text.includes("آکبند") ? "new" : text.includes("در حد نو") || text.includes("کارکرده کم") ? "like-new" : "good";
    const priceMatch = text.match(/(\d[\d,]+)\s*(تومان|هزار تومان|میلیون)?/);
    const aiPrice = priceMatch ? priceMatch[1].replace(/,/g, "") : "";
    const setFields: {cat?:boolean;condition?:boolean;price?:boolean} = {};
    if (aiCat) { setSelectedLeaf(aiCat); setFields.cat = true; }
    setForm(f => ({ ...f, condition: aiCondition, price: aiPrice && !f.price ? aiPrice : f.price }));
    if (aiCondition) setFields.condition = true;
    if (aiPrice) setFields.price = true;
    setAiSetFields(setFields);
  };

  const goNext = () => {
    const errs: string[] = [];
    if (step === 0) {
      if (photos.length === 0) errs.push("حداقل یک تصویر اضافه کنید.");
      if (!form.title.trim()) errs.push("عنوان آگهی را وارد کنید.");
      if (!form.desc.trim()) errs.push("توضیحات آگهی را وارد کنید.");
      if (errs.length > 0) { setErrors(errs); return; }
      setErrors([]);
      if (!aiOverridden) {
        setAiAnim(true);
        setTimeout(() => {
          runAiCategorization(form.title, form.desc);
          setAiAnim(false);
          setStep(1);
        }, 2800);
      } else {
        setStep(1);
      }
      return;
    }
    if (step === 1) {
      if (!selectedLeaf) errs.push("لطفاً دسته‌بندی آگهی را انتخاب کنید.");
      else if (selectedLeaf.children.length > 0) errs.push("لطفاً تا آخرین زیردسته پیش بروید.");
    }
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    setStep(s => s + 1);
  };

  const doSubmit = () => {
    submittedRef.current = { form, photos, selectedLeaf, postCity, dynFields, contactMethods };
    setErrors([]);
    setAdStatus("reviewing");
  };

  /* Status screens */
  if (adStatus !== "draft") {
    const isReviewing = adStatus === "reviewing";
    const isApproved  = adStatus === "approved";
    const isPublished = adStatus === "published";
    const steps3 = [
      { label: "دریافت آگهی", done: true, active: false, pending: false },
      { label: "در حال بررسی", done: isApproved || isPublished, active: isReviewing, pending: false },
      { label: "انتشار", done: isPublished, active: false, pending: isApproved },
    ];
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 510, display: "flex", flexDirection: "column", background: "var(--ab-bg)", direction: "rtl" }}>
        <ABHeader title="ثبت آگهی" onBack={() => push({ t: "home" })} />
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", gap: 28 }} className="ab-no-sb">
          {!isPublished ? (
            <>
              <div style={{ position: "relative", width: 96, height: 96, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: 48, border: "3px solid rgba(232,53,78,0.18)", animation: "ab-pulse-ring 1.8s ease-out infinite" }} />
                <div style={{ position: "absolute", inset: 10, borderRadius: 38, border: "2px solid rgba(232,53,78,0.1)", animation: "ab-pulse-ring 1.8s ease-out infinite 0.5s" }} />
                <div style={{ width: 70, height: 70, borderRadius: 35, background: "rgba(232,53,78,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--ab-red)" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "var(--ab-text)", marginBottom: 12, fontFamily: "Vazirmatn,sans-serif" }}>
                  {isReviewing ? "در حال بررسی آگهی…" : "تأیید شد — در حال انتشار…"}
                </div>
                <div style={{ fontSize: 15, color: "var(--ab-text2)", lineHeight: 2.1, fontFamily: "Vazirmatn,sans-serif" }}>
                  {isReviewing ? "آگهی شما توسط تیم آن بنر بررسی می‌شود." : "آگهی شما تأیید شد و در حال انتشار است."}
                </div>
              </div>
              <div style={{ background: "var(--ab-card)", borderRadius: 18, padding: "20px 16px", width: "100%", border: "1px solid var(--ab-border)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
                  {steps3.map((s, i) => (
                    <React.Fragment key={i}>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <div className={`ab-status-step-dot${s.active ? " active" : ""}`} style={{
                          width: 40, height: 40, borderRadius: 20,
                          background: s.done ? "#10B981" : s.active ? "var(--ab-red)" : s.pending ? "#F59E0B" : "var(--ab-faint)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {s.done
                            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            : s.active
                              ? <div style={{ width: 14, height: 14, borderRadius: 7, background: "#FFF" }} />
                              : s.pending
                                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                : <div style={{ width: 12, height: 12, borderRadius: 6, background: "var(--ab-muted)" }} />}
                        </div>
                        <div style={{ fontSize: 12, color: s.done ? "#10B981" : s.active ? "var(--ab-red)" : s.pending ? "#F59E0B" : "var(--ab-muted)", fontWeight: s.done || s.active ? 700 : 400, fontFamily: "Vazirmatn,sans-serif", textAlign: "center", lineHeight: 1.4 }}>{s.label}</div>
                      </div>
                      {i < 2 && <div style={{ flex: 0, width: 32, height: 2, background: s.done ? "#10B981" : "var(--ab-faint)", marginTop: 19, transition: "background .4s" }} />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ width: 100, height: 100, borderRadius: 50, background: "rgba(5,150,105,0.1)", border: "3px solid rgba(5,150,105,0.25)", display: "flex", alignItems: "center", justifyContent: "center", animation: "ab-bounce-in .5s ease" }}>
                <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#10B981", marginBottom: 10, fontFamily: "Vazirmatn,sans-serif" }}>آگهی منتشر شد</div>
                <div style={{ fontSize: 15, color: "var(--ab-text2)", lineHeight: 2.1, fontFamily: "Vazirmatn,sans-serif" }}>آگهی شما منتشر شد و در آن بنر قابل مشاهده است.</div>
              </div>
              <div style={{ background: "rgba(16,185,129,0.06)", border: "1.5px solid rgba(16,185,129,0.2)", borderRadius: 18, padding: "18px 20px", width: "100%", direction: "rtl" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: "#10B981" }} />
                  <span style={{ fontSize: 14, color: "#10B981", fontWeight: 800, fontFamily: "Vazirmatn,sans-serif" }}>وضعیت: منتشر شده</span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ab-text)", marginBottom: 6, fontFamily: "Vazirmatn,sans-serif" }}>{form.title || "آگهی جدید"}</div>
                <div style={{ fontSize: 14, color: "var(--ab-text2)", fontFamily: "Vazirmatn,sans-serif" }}>{selectedLeaf?.name ?? "—"} · {cityName}</div>
              </div>
              <button onClick={() => push({ t: "my-listings" })} style={{ width: "100%", height: 56, borderRadius: 17, background: "var(--ab-red)", border: "none", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", fontSize: 18, fontWeight: 700, color: "#FFF", boxShadow: "0 4px 20px rgba(232,53,78,0.3)" }}>
                مشاهده آگهی‌های من
              </button>
              <button onClick={() => push({ t: "home" })} style={{ width: "100%", height: 50, borderRadius: 14, background: "var(--ab-card2)", border: "1px solid var(--ab-border)", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", fontSize: 15, fontWeight: 600, color: "var(--ab-text2)" }}>
                بازگشت به خانه
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--ab-bg)" }}>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} style={{ display: "none" }} />
      <input ref={galleryRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />
      {cropSrc && <ABCropEditor src={cropSrc} onConfirm={d => { setPhotos(p => [...p, d].slice(0, 8)); setCropSrc(null); setErrors([]); }} onCancel={() => setCropSrc(null)} />}
      {showCityPicker && <ABSingleCityPicker cityId={postCity} onClose={() => setShowCityPicker(false)} onSelect={id => { setPostCity(id); setShowCityPicker(false); }} />}
      {showCatSheet && <ABCategorySheet catId={catSheetRoot} onClose={() => setShowCatSheet(false)} onSelectFinal={cid => { const cat = findCatById(cid); if (cat) { setSelectedLeaf(cat); if (aiSetFields.cat) setAiOverridden(true); } setShowCatSheet(false); }} />}

      {/* AI categorization animation overlay */}
      {aiAnim && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "var(--ab-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, direction: "rtl" }}>
          <div style={{ position: "relative", width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 50, border: "3px solid rgba(232,53,78,0.2)", animation: "ab-pulse-ring 1.6s ease-out infinite" }} />
            <div style={{ position: "absolute", inset: 12, borderRadius: 38, border: "2px solid rgba(232,53,78,0.12)", animation: "ab-pulse-ring 1.6s ease-out infinite 0.4s" }} />
            <div style={{ width: 68, height: 68, borderRadius: 34, background: "rgba(232,53,78,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--ab-red)" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/>
              </svg>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "0 32px" }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "var(--ab-text)", marginBottom: 12, fontFamily: "Vazirmatn,sans-serif" }}>در حال تشخیص دسته‌بندی آگهی...</div>
            <div style={{ fontSize: 14, color: "var(--ab-text2)", lineHeight: 2, fontFamily: "Vazirmatn,sans-serif" }}>هوش مصنوعی آن بنر آگهی شما را تحلیل می‌کند و دسته‌بندی مناسب را پیشنهاد می‌دهد.</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[0,1,2,3].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: "var(--ab-red)", opacity: 0.3, animation: `ab-dot-bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
          </div>
        </div>
      )}

      <ABHeader title="ثبت آگهی" onBack={() => { setErrors([]); step === 0 ? push({ t: "home" }) : setStep(s => s - 1); }} />

      {/* Progress */}
      <div style={{ padding: "12px 16px 0", background: "var(--ab-bg2)", borderBottom: "1px solid var(--ab-border)", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {STEPS.map((_, i) => <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= step ? "var(--ab-red)" : "var(--ab-faint)", transition: "background .35s" }} />)}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ab-text)", fontFamily: "Vazirmatn,sans-serif" }}>مرحله {toFaD(step + 1)}: {STEPS[step]}</span>
          <span style={{ fontSize: 13, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif" }}>{toFaD(step + 1)} از {toFaD(STEPS.length)}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }} className="ab-no-sb">
        <div style={{ padding: "20px 16px 8px" }}>

          {/* Step 0: Photos + City + Title + Desc */}
          {step === 0 && (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                  <label style={{ fontSize: 16, fontWeight: 700, color: "var(--ab-text)", fontFamily: "Vazirmatn,sans-serif" }}>تصویر آگهی <span style={{ color: "var(--ab-red)" }}>*</span></label>
                  <span style={{ fontSize: 12, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif" }}>حداقل ۱، حداکثر ۸</span>
                </div>
                {photos.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 12 }}>
                    {photos.map((url, i) => (
                      <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: 13, overflow: "hidden", border: i === 0 ? "2.5px solid var(--ab-red)" : "1.5px solid #ECECEA" }}>
                        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        {i === 0 && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(232,53,78,0.82)", fontSize: 11, color: "#FFF", textAlign: "center", padding: "5px 0", fontFamily: "Vazirmatn,sans-serif", fontWeight: 600 }}>تصویر اصلی</div>}
                        <button onClick={() => setPhotos(p => p.filter((_, idx) => idx !== i))} style={{ position: "absolute", top: 5, left: 5, width: 26, height: 26, borderRadius: 8, background: "rgba(0,0,0,0.65)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {photos.length < 8 && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <button onClick={() => cameraRef.current?.click()} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "20px 12px", borderRadius: 15, border: "2px dashed var(--ab-border)", background: "var(--ab-card2)", cursor: "pointer" }}>
                      <div style={{ width: 48, height: 48, borderRadius: 15, background: "rgba(232,53,78,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--ab-red)" strokeWidth="1.8" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ab-text)", fontFamily: "Vazirmatn,sans-serif" }}>دوربین</span>
                    </button>
                    <button onClick={() => galleryRef.current?.click()} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "20px 12px", borderRadius: 15, border: "2px dashed var(--ab-border)", background: "var(--ab-card2)", cursor: "pointer" }}>
                      <div style={{ width: 48, height: 48, borderRadius: 15, background: "rgba(37,99,235,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ab-text)", fontFamily: "Vazirmatn,sans-serif" }}>گالری</span>
                    </button>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 16, fontWeight: 700, color: "var(--ab-text)", display: "block", marginBottom: 10, fontFamily: "Vazirmatn,sans-serif" }}>شهر آگهی</label>
                <div onClick={() => setShowCityPicker(true)} style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, background: "var(--ab-card2)", borderRadius: 15, border: "1.5px solid var(--ab-border)", cursor: "pointer" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(37,99,235,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif", marginBottom: 3 }}>موقعیت آگهی</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ab-text)", fontFamily: "Vazirmatn,sans-serif" }}>{cityName}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9A9A9A" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 16, fontWeight: 700, color: "var(--ab-text)", display: "block", marginBottom: 8, fontFamily: "Vazirmatn,sans-serif" }}>عنوان آگهی <span style={{ color: "var(--ab-red)" }}>*</span></label>
                <input className="ab-post-input" placeholder="مثال: آیفون ۱۵ پرو مکس — نو در حد آکبند" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={70} />
                <div style={{ fontSize: 12, color: "var(--ab-muted)", marginTop: 6, fontFamily: "Vazirmatn,sans-serif" }}>{toFaD(form.title.length)} / ۷۰</div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 16, fontWeight: 700, color: "var(--ab-text)", display: "block", marginBottom: 8, fontFamily: "Vazirmatn,sans-serif" }}>توضیحات <span style={{ color: "var(--ab-red)" }}>*</span></label>
                <textarea className="ab-post-textarea" placeholder="جزئیات بیشتر درباره آگهی بنویسید…" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} rows={5} />
              </div>
            </>
          )}

          {/* Step 1: Category (AI pre-selected) */}
          {step === 1 && (
            <>
              {!aiOverridden && selectedLeaf && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(232,53,78,0.06)", borderRadius: 12, border: "1px solid rgba(232,53,78,0.2)", marginBottom: 16 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ab-red)" strokeWidth="2" strokeLinecap="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/></svg>
                  <span style={{ fontSize: 13, color: "var(--ab-red)", fontWeight: 700, fontFamily: "Vazirmatn,sans-serif" }}>دسته‌بندی توسط هوش مصنوعی انتخاب شد</span>
                </div>
              )}
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ab-text)", marginBottom: 16, fontFamily: "Vazirmatn,sans-serif" }}>دسته‌بندی آگهی را انتخاب کنید</div>
              {selectedLeaf ? (
                <div onClick={() => { setSelectedLeaf(null); setCatSheetRoot(null); }}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, background: "var(--ab-card2)", borderRadius: 16, border: "1.5px solid var(--ab-border)", marginBottom: 18, cursor: "pointer" }}>
                  <div style={{ width: 50, height: 50, borderRadius: 15, background: rootCatColor + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <CatIcon id={selectedLeaf.categoryId} color={rootCatColor} size={28} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif", marginBottom: 4 }}>دسته انتخاب‌شده</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ab-text)", fontFamily: "Vazirmatn,sans-serif" }}>{selectedLeaf.name}</div>
                  </div>
                  <span style={{ fontSize: 14, color: "var(--ab-red)", fontWeight: 700, fontFamily: "Vazirmatn,sans-serif" }}>تغییر</span>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  {AB_CATS.map(cat => (
                    <div key={cat.categoryId} onClick={() => { setCatSheetRoot(cat.categoryId); setShowCatSheet(true); }}
                      style={{ display: "flex", alignItems: "center", gap: 13, padding: "15px 16px", background: "var(--ab-card2)", borderRadius: 15, border: "1.5px solid var(--ab-border)", cursor: "pointer" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 13, background: cat.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CatIcon id={cat.categoryId} color={cat.color} size={24} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ab-text)", fontFamily: "Vazirmatn,sans-serif", lineHeight: 1.4 }}>{cat.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {selectedLeaf && (
                <>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 15, fontWeight: 700, color: "var(--ab-text)", display: "block", marginBottom: 10, fontFamily: "Vazirmatn,sans-serif" }}>وضعیت کالا</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {(["new", "like-new", "good", "used"] as const).map(c => (
                        <button key={c} onClick={() => { setForm(f => ({ ...f, condition: c })); if (aiSetFields.condition && c !== form.condition) setAiOverridden(true); }}
                          style={{ padding: "14px 8px", borderRadius: 13, border: `2px solid ${form.condition === c ? "var(--ab-red)" : "var(--ab-border)"}`, background: form.condition === c ? "rgba(232,53,78,0.06)" : "var(--ab-card2)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Vazirmatn, sans-serif", color: form.condition === c ? "var(--ab-red)" : "var(--ab-text2)" }}>
                          {condLabel(c)}
                        </button>
                      ))}
                    </div>
                  </div>
                  {dynamicFields.map(f => (
                    <div key={f.key} style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 15, fontWeight: 700, color: "var(--ab-text)", display: "block", marginBottom: 8, fontFamily: "Vazirmatn,sans-serif" }}>{f.label}</label>
                      <input className="ab-post-input" placeholder={f.placeholder} value={dynFields[f.key] ?? ""} onChange={e => setDynFields(d => ({ ...d, [f.key]: e.target.value }))} />
                    </div>
                  ))}
                </>
              )}
            </>
          )}



          {/* Step 2: Price + Contact + Preview */}
          {step === 2 && (
            <>
              <div style={{ marginBottom: 22 }}>
                <label style={{ fontSize: 16, fontWeight: 700, color: "var(--ab-text)", display: "block", marginBottom: 12, fontFamily: "Vazirmatn,sans-serif" }}>نوع قیمت</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                  {([["fixed", "قیمت مشخص"], ["negotiable", "توافقی"], ["free", "رایگان"]] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setForm(f => ({ ...f, priceMode: v }))}
                      style={{ padding: "15px 6px", borderRadius: 14, border: `2px solid ${form.priceMode === v ? "var(--ab-red)" : "var(--ab-border)"}`, background: form.priceMode === v ? "rgba(232,53,78,0.06)" : "var(--ab-card2)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Vazirmatn, sans-serif", color: form.priceMode === v ? "var(--ab-red)" : "var(--ab-text2)" }}>
                      {l}
                    </button>
                  ))}
                </div>
                {form.priceMode === "fixed" && (
                  <div>
                    <input
                      className="ab-post-input"
                      style={{ direction: "rtl", textAlign: "right" }}
                      placeholder="قیمت به تومان"
                      inputMode="numeric"
                      value={formatPersianPrice(form.price)}
                      onChange={e => {
                        const raw = parsePriceInput(e.target.value);
                        setForm(f => ({ ...f, price: raw }));
                      }}
                    />
                    {form.price && <div style={{ fontSize: 15, color: "#059669", fontWeight: 700, marginTop: 8, fontFamily: "Vazirmatn,sans-serif" }}>{fmtPrice(parseInt(form.price, 10) || 0)}</div>}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 22 }}>
                <label style={{ fontSize: 16, fontWeight: 700, color: "var(--ab-text)", display: "block", marginBottom: 12, fontFamily: "Vazirmatn,sans-serif" }}>روش‌های تماس <span style={{ fontSize: 13, fontWeight: 400, color: "var(--ab-muted)" }}>(می‌توانید هر دو را انتخاب کنید)</span></label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {([
                    { key: "phone" as const, label: "تماس تلفنی", desc: "خریدار مستقیم تماس می‌گیرد",
                      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.44 2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> },
                    { key: "chat" as const, label: "پیام و چت", desc: "خریدار پیام می‌فرستد",
                      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
                  ]).map(opt => {
                    const sel = contactMethods[opt.key];
                    return (
                      <button key={opt.key} onClick={() => setContactMethods(prev => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 12px 16px", borderRadius: 16, border: `2px solid ${sel ? "var(--ab-red)" : "var(--ab-border)"}`, background: sel ? "rgba(232,53,78,0.05)" : "var(--ab-card2)", cursor: "pointer", color: sel ? "var(--ab-red)" : "var(--ab-text2)", transition: "all .18s", position: "relative" }}>
                        {sel && (
                          <div style={{ position: "absolute", top: 10, left: 10, width: 22, height: 22, borderRadius: 11, background: "var(--ab-red)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                        )}
                        {opt.icon}
                        <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "Vazirmatn,sans-serif" }}>{opt.label}</span>
                        <span style={{ fontSize: 11, color: sel ? "rgba(232,53,78,0.7)" : "#9A9A9A", fontFamily: "Vazirmatn,sans-serif", textAlign: "center", lineHeight: 1.4 }}>{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ background: "var(--ab-card)", border: "1.5px solid var(--ab-border)", borderRadius: 18, overflow: "hidden", marginBottom: 20 }}>
                <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid #ECECEA" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif" }}>پیش‌نمایش آگهی</span>
                </div>
                <div style={{ display: "flex", gap: 14, padding: "14px 16px", direction: "rtl" }}>
                  <div style={{ width: 92, height: 92, borderRadius: 12, background: "var(--ab-card2)", overflow: "hidden", flexShrink: 0 }}>
                    {photos[0] ? <img src={photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ab-text)", fontFamily: "Vazirmatn,sans-serif", marginBottom: 6 }}>{form.title || "عنوان آگهی"}</div>
                    <div style={{ fontSize: 16, color: "#059669", fontWeight: 700, fontFamily: "Vazirmatn,sans-serif", marginBottom: 4 }}>
                      {form.priceMode === "free" ? "رایگان" : form.priceMode === "negotiable" ? "توافقی" : form.price ? fmtPrice(parseInt(form.price, 10) || 0) : "—"}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif" }}>{selectedLeaf?.name ?? "—"} · {cityName}</div>
                  </div>
                </div>
              </div>

              <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <div style={{ fontSize: 13, color: "#92400E", fontFamily: "Vazirmatn,sans-serif", lineHeight: 1.9 }}>
                    پس از ثبت، آگهی در انتظار تأیید اپراتور قرار می‌گیرد و بعد از تأیید منتشر می‌شود.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sticky action bar */}
      <div style={{ flexShrink: 0, background: "var(--ab-bg2)", borderTop: "1px solid var(--ab-border)", padding: "14px 16px", paddingBottom: "calc(14px + 72px + env(safe-area-inset-bottom, 0px))" }}>
        {errors.length > 0 && (
          <div style={{ background: "rgba(232,53,78,0.08)", border: "1px solid rgba(232,53,78,0.25)", borderRadius: 13, padding: "12px 16px", marginBottom: 14 }}>
            {errors.map((e, i) => <div key={i} style={{ fontSize: 14, color: "#B91C1C", fontFamily: "Vazirmatn,sans-serif", lineHeight: 1.9 }}>• {e}</div>)}
          </div>
        )}
        {step < 2 ? (
          <button onClick={goNext} style={{ width: "100%", height: 56, borderRadius: 17, background: "var(--ab-red)", border: "none", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", fontSize: 17, fontWeight: 700, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 18px rgba(232,53,78,0.28)" }}>
            مرحله بعد
          </button>
        ) : (
          <button onClick={doSubmit} style={{ width: "100%", height: 56, borderRadius: 17, background: "var(--ab-red)", border: "none", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", fontSize: 17, fontWeight: 700, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 4px 18px rgba(232,53,78,0.28)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            ثبت نهایی آگهی
          </button>
        )}
      </div>
    </div>
  );
}


/* ─── Screen: Edit Post ──────────────────────────────────────────── */
function ABEditPostFlow({ push, lid }: { push: (v: ABView) => void; lid: string }) {
  const existing = abGetAds().find(a => a.listingId === lid);
  const [form, setForm] = useState({
    title: existing?.title ?? "",
    desc: existing?.description ?? "",
    price: existing ? String(existing.price ?? "") : "",
    priceMode: (existing?.priceMode ?? "fixed") as "fixed"|"negotiable"|"free"|"swap",
    condition: (existing?.condition ?? "used") as "new"|"like-new"|"good"|"used"|"for-parts",
  });
  const [contactMethods, setContactMethods] = useState({
    phone: existing?.contactEnabled ?? true,
    chat: existing?.chatEnabled ?? true,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  if (!existing) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <ABHeader title="ویرایش آگهی" onBack={() => push({ t: "my-listings" })} />
        <ABEmpty title="آگهی یافت نشد" desc="آگهی مورد نظر حذف شده یا موجود نیست" icon="📋" />
      </div>
    );
  }

  const handleSave = () => {
    const errs: string[] = [];
    if (!form.title.trim()) errs.push("عنوان آگهی الزامی است.");
    if (form.priceMode === "fixed" && !form.price) errs.push("قیمت را وارد کنید.");
    if (errs.length) { setErrors(errs); return; }
    const updated: ABListing = {
      ...existing,
      title: form.title.trim(),
      description: form.desc.trim(),
      price: form.priceMode === "fixed" ? (parseInt(form.price, 10) || 0) : 0,
      priceMode: form.priceMode,
      condition: form.condition,
      contactEnabled: contactMethods.phone,
      chatEnabled: contactMethods.chat,
      updatedAt: new Date().toISOString(),
    };
    abUpdateAd(updated);
    setSaved(true);
    setTimeout(() => push({ t: "my-listings" }), 1200);
  };

  if (saved) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: 36, background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ab-green)", fontFamily: "Vazirmatn,sans-serif" }}>آگهی ذخیره شد</div>
      </div>
    );
  }

  const priceModes = [
    { key: "fixed" as const, label: "قیمت ثابت" },
    { key: "negotiable" as const, label: "توافقی" },
    { key: "free" as const, label: "رایگان" },
    { key: "swap" as const, label: "معاوضه" },
  ];
  const conditions = [
    { key: "new" as const, label: "نو" },
    { key: "like-new" as const, label: "در حد نو" },
    { key: "good" as const, label: "خوب" },
    { key: "used" as const, label: "کارکرده" },
    { key: "for-parts" as const, label: "قطعات" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ABHeader title="ویرایش آگهی" onBack={() => push({ t: "my-listings" })} />
      <div className="ab-page" style={{ padding: "16px 16px 80px" }}>
        {errors.length > 0 && (
          <div style={{ background: "rgba(232,53,78,0.1)", border: "1px solid rgba(232,53,78,0.3)", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
            {errors.map((e, i) => <div key={i} style={{ fontSize: 13, color: "#B91C1C", fontFamily: "Vazirmatn,sans-serif" }}>{e}</div>)}
          </div>
        )}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 15, fontWeight: 700, color: "var(--ab-text)", display: "block", marginBottom: 8, fontFamily: "Vazirmatn,sans-serif" }}>عنوان آگهی</label>
          <input className="ab-post-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="مثلاً: پراید ۱۳۲ مدل ۱۴۰۰" maxLength={100} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 15, fontWeight: 700, color: "var(--ab-text)", display: "block", marginBottom: 8, fontFamily: "Vazirmatn,sans-serif" }}>توضیحات</label>
          <textarea className="ab-post-input" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="توضیحات کامل آگهی..." rows={4} style={{ resize: "none", height: "auto", minHeight: 100 }} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 15, fontWeight: 700, color: "var(--ab-text)", display: "block", marginBottom: 8, fontFamily: "Vazirmatn,sans-serif" }}>نوع قیمت</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {priceModes.map(p => (
              <button key={p.key} onClick={() => setForm(f => ({ ...f, priceMode: p.key }))}
                style={{ padding: "8px 16px", borderRadius: 12, border: `2px solid ${form.priceMode === p.key ? "var(--ab-red)" : "var(--ab-border)"}`, background: form.priceMode === p.key ? "rgba(232,53,78,0.07)" : "var(--ab-card2)", color: form.priceMode === p.key ? "var(--ab-red)" : "var(--ab-text2)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Vazirmatn,sans-serif" }}>
                {p.label}
              </button>
            ))}
          </div>
          {form.priceMode === "fixed" && (
            <input className="ab-post-input" style={{ marginTop: 10, direction: "ltr", textAlign: "right" }} placeholder="قیمت به تومان" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value.replace(/\D/g, "") }))} inputMode="numeric" />
          )}
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 15, fontWeight: 700, color: "var(--ab-text)", display: "block", marginBottom: 8, fontFamily: "Vazirmatn,sans-serif" }}>وضعیت کالا</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {conditions.map(c => (
              <button key={c.key} onClick={() => setForm(f => ({ ...f, condition: c.key }))}
                style={{ padding: "8px 16px", borderRadius: 12, border: `2px solid ${form.condition === c.key ? "var(--ab-red)" : "var(--ab-border)"}`, background: form.condition === c.key ? "rgba(232,53,78,0.07)" : "var(--ab-card2)", color: form.condition === c.key ? "var(--ab-red)" : "var(--ab-text2)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Vazirmatn,sans-serif" }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 15, fontWeight: 700, color: "var(--ab-text)", display: "block", marginBottom: 10, fontFamily: "Vazirmatn,sans-serif" }}>روش‌های تماس</label>
          <div style={{ display: "flex", gap: 10 }}>
            {([
              { key: "phone" as const, label: "تماس تلفنی" },
              { key: "chat" as const, label: "پیام و چت" },
            ] as const).map(opt => {
              const sel = contactMethods[opt.key];
              return (
                <button key={opt.key} onClick={() => setContactMethods(prev => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                  style={{ flex: 1, padding: "12px 10px", borderRadius: 14, border: `2px solid ${sel ? "var(--ab-red)" : "var(--ab-border)"}`, background: sel ? "rgba(232,53,78,0.05)" : "var(--ab-card2)", color: sel ? "var(--ab-red)" : "var(--ab-text2)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {sel && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ab-red)" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
        <button onClick={handleSave}
          style={{ width: "100%", height: 54, borderRadius: 16, background: "var(--ab-red)", border: "none", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", fontSize: 16, fontWeight: 700, color: "#FFF", boxShadow: "0 4px 18px rgba(232,53,78,0.3)" }}>
          ذخیره تغییرات
        </button>
      </div>
    </div>
  );
}

/* ─── Screen: Postchi An Banner ──────────────────────────────────── */
const POSTCHI_TYPE_META: Record<string, { icon: string; bg: string; color: string }> = {
  "published":    { icon: "✅", bg: "rgba(5,150,105,0.08)",  color: "#059669" },
  "reviewing":    { icon: "🔍", bg: "rgba(37,99,235,0.07)",  color: "#1D4ED8" },
  "rejected":     { icon: "❌", bg: "rgba(220,38,38,0.07)",  color: "#DC2626" },
  "edited":       { icon: "✏️", bg: "rgba(107,114,128,0.08)", color: "#4B5563" },
  "closed":       { icon: "🔒", bg: "rgba(107,114,128,0.08)", color: "#6B7280" },
  "deleted":      { icon: "🗑️", bg: "rgba(220,38,38,0.07)",  color: "#DC2626" },
  "new-message":  { icon: "💬", bg: "rgba(232,53,78,0.07)",  color: "var(--ab-red)" },
  "support-reply":{ icon: "🎧", bg: "rgba(168,85,247,0.07)", color: "#7C3AED" },
  "system":       { icon: "⚙️", bg: "rgba(107,114,128,0.08)", color: "#6B7280" },
  "security":     { icon: "🔐", bg: "rgba(234,179,8,0.08)",  color: "#B45309" },
};

function ABPostchiScreen({ push }: { push: (v: ABView) => void }) {
  const _pv = usePostchiVersion();
  const events = abGetPostchi();
  const unreadCount = events.filter(e => !e.read).length;

  const handleEventClick = (ev: ABPostchiEvent) => {
    abMarkPostchiRead(ev.eventId);
    if (ev.listingId) push({ t: "listing", lid: ev.listingId });
    else if (ev.conversationId) push({ t: "chat", cid: ev.conversationId });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--ab-bg)" }}>
      <ABHeader
        title="پستچی آن بنر"
        onBack={() => push({ t: "chat-list" })}
        rightSlot={unreadCount > 0
          ? <button onClick={abMarkAllPostchiRead}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "var(--ab-red)", fontFamily: "Vazirmatn,sans-serif", padding: "4px 8px" }}>
              خواندن همه
            </button>
          : undefined}
      />
      <div className="ab-page" style={{ padding: 0 }}>
        {events.length === 0 ? (
          <ABEmpty title="اعلانی ندارید" desc="رویدادهای مربوط به آگهی‌ها و پیام‌های شما اینجا نمایش داده می‌شود" icon="📬" />
        ) : events.map(ev => {
          const meta = POSTCHI_TYPE_META[ev.type] ?? POSTCHI_TYPE_META["system"];
          return (
            <div key={ev.eventId}
              onClick={() => handleEventClick(ev)}
              style={{ display: "flex", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--ab-border)", cursor: "pointer", background: ev.read ? "transparent" : "rgba(232,53,78,0.06)", direction: "rtl", alignItems: "flex-start" }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                {meta.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 14, fontWeight: ev.read ? 600 : 800, color: ev.color ?? meta.color, fontFamily: "Vazirmatn,sans-serif", flex: 1 }}>{ev.title}</span>
                  <span style={{ fontSize: 11, color: "#AAA", fontFamily: "Vazirmatn,sans-serif", flexShrink: 0, marginRight: 8 }}>{timeAgo(ev.createdAt)}</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--ab-text2)", fontFamily: "Vazirmatn,sans-serif", lineHeight: 1.6 }}>{ev.description}</div>
                {ev.reason && <div style={{ fontSize: 12, color: "#DC2626", fontFamily: "Vazirmatn,sans-serif", marginTop: 4 }}>دلیل: {ev.reason}</div>}
                {(ev.listingId || ev.conversationId) && (
                  <div style={{ fontSize: 12, color: meta.color, fontFamily: "Vazirmatn,sans-serif", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                    {ev.listingId ? "مشاهده آگهی" : "مشاهده مکالمه"}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </div>
                )}
              </div>
              {!ev.read && <div style={{ width: 8, height: 8, borderRadius: 4, background: "var(--ab-red)", flexShrink: 0, marginTop: 4 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Screen: Edit Profile ───────────────────────────────────────── */
function ABEditProfileForm({ push }: { push: (v: ABView) => void }) {
  const user = abGetUser();
  const [form, setForm] = useState({ name: user.name, mobile: user.mobile });
  const [saved, setSaved] = useState(false);
  const [photoSheet, setPhotoSheet] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const cameraRef = React.useRef<HTMLInputElement>(null);
  const galleryRef = React.useRef<HTMLInputElement>(null);

  const openFile = (raw: File) => {
    const url = URL.createObjectURL(raw);
    setCropSrc(url);
    setPhotoSheet(false);
  };

  const handleSave = () => {
    void abUpdateUser({ ...user, name: form.name.trim() || user.name, mobile: form.mobile.trim() || user.mobile });
    setSaved(true);
    setTimeout(() => push({ t: "me" }), 1200);
  };

  if (cropSrc) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: "#000" }}>
        <ABCropEditor
          src={cropSrc}
          onConfirm={(dataURL) => {
            void abUpdateUser({ ...abGetUser(), avatar: dataURL });
            URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
          }}
          onCancel={() => { URL.revokeObjectURL(cropSrc); setCropSrc(null); }}
        />
      </div>
    );
  }

  if (saved) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: 36, background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ab-green)", fontFamily: "Vazirmatn,sans-serif" }}>پروفایل ذخیره شد</div>
      </div>
    );
  }

  const currentAvatar = abGetUser().avatar;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ABHeader title="ویرایش پروفایل" onBack={() => push({ t: "me" })} />
      {/* hidden file inputs */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) openFile(f); e.target.value = ""; }} />
      <input ref={galleryRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) openFile(f); e.target.value = ""; }} />

      <div className="ab-page" style={{ padding: "24px 16px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <div onClick={() => setPhotoSheet(true)}
            style={{ width: 96, height: 96, borderRadius: 48, background: "var(--ab-red)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 10, cursor: "pointer", position: "relative", overflow: "hidden", border: "3px solid rgba(232,53,78,0.2)" }}>
            {currentAvatar
              ? <img src={currentAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span>👤</span>}
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.28)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
          </div>
          <button onClick={() => setPhotoSheet(true)}
            style={{ fontSize: 13, fontWeight: 700, color: "var(--ab-red)", background: "none", border: "none", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", padding: "4px 8px" }}>
            تغییر عکس پروفایل
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 15, fontWeight: 700, color: "var(--ab-text)", display: "block", marginBottom: 8, fontFamily: "Vazirmatn,sans-serif" }}>نام و نام‌خانوادگی</label>
          <input className="ab-post-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="نام کامل شما" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 15, fontWeight: 700, color: "var(--ab-text)", display: "block", marginBottom: 8, fontFamily: "Vazirmatn,sans-serif" }}>شماره تلفن</label>
          <input className="ab-post-input" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="۰۹۱۲۳۴۵۶۷۸۹" inputMode="tel" style={{ direction: "ltr", textAlign: "right" }} />
        </div>
        <button onClick={handleSave}
          style={{ width: "100%", height: 54, borderRadius: 16, background: "var(--ab-red)", border: "none", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", fontSize: 16, fontWeight: 700, color: "#FFF", boxShadow: "0 4px 18px rgba(232,53,78,0.3)" }}>
          ذخیره تغییرات
        </button>
      </div>

      {/* Photo source bottom sheet */}
      {photoSheet && createPortal(
        <>
          <div className="ab-sheet-overlay" onClick={() => setPhotoSheet(false)} />
          <div className="ab-sheet" style={{ zIndex: 4000 }}>
            <div className="ab-sheet-body" style={{ padding: "20px 16px 32px", direction: "rtl" }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--ab-faint)", margin: "0 auto 20px" }} />
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ab-text)", marginBottom: 16, fontFamily: "Vazirmatn,sans-serif" }}>عکس پروفایل</div>
              <button onClick={() => cameraRef.current?.click()}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px 14px", borderRadius: 14, background: "var(--ab-card2)", border: "1px solid var(--ab-border)", marginBottom: 10, cursor: "pointer" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(232,53,78,0.09)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8354E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ab-text)", fontFamily: "Vazirmatn,sans-serif" }}>دوربین</span>
              </button>
              <button onClick={() => galleryRef.current?.click()}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px 14px", borderRadius: 14, background: "var(--ab-card2)", border: "1px solid var(--ab-border)", marginBottom: 10, cursor: "pointer" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(99,102,241,0.09)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ab-text)", fontFamily: "Vazirmatn,sans-serif" }}>انتخاب از گالری</span>
              </button>
              <button onClick={() => setPhotoSheet(false)}
                style={{ width: "100%", padding: "14px", borderRadius: 14, background: "none", border: "1.5px solid var(--ab-border)", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "var(--ab-text2)", fontFamily: "Vazirmatn,sans-serif" }}>
                انصراف
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

/* ─── Screen: Messages Tab ───────────────────────────────────────── */
function ABMsgsTab({ push }: { push: (v: ABView) => void }) {
  const [chipFilter, setChipFilter] = useState<"unread" | "mine" | "others" | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(() => {
    try { return localStorage.getItem("ab2_notif") !== "off"; } catch { return true; }
  });
  const _v = useAdsVersion();
  const _cv = useConvsVersion();
  const _pv = usePostchiVersion();

  const toggleNotif = () => {
    const next = !notifEnabled;
    setNotifEnabled(next);
    try { localStorage.setItem("ab2_notif", next ? "on" : "off"); } catch {}
    if (next && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const chips = [
    { id: "unread" as const, label: "خوانده‌نشده" },
    { id: "mine" as const, label: "آگهی‌های من" },
    { id: "others" as const, label: "آگهی‌های دیگران" },
  ];

  const allConvs = abGetConvs().filter(c => c.buyerId === _currentUid || c.sellerId === _currentUid);
  const filteredConvs = allConvs.filter(c => {
    if (chipFilter === "unread") return c.unreadCount > 0;
    if (chipFilter === "mine") return c.sellerId === _currentUid;
    if (chipFilter === "others") return c.sellerId !== _currentUid;
    return true;
  });

  const postchiUnread = abGetPostchi().filter(e => !e.read).length;
  const latestPostchi = abGetPostchi()[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--ab-bg)" }}>
      <div style={{ padding: "16px 16px 0", background: "var(--ab-bg2)", direction: "rtl", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: "var(--ab-text)", fontFamily: "Vazirmatn,sans-serif" }}>چت و تماس</span>
        </div>
        {/* Filter chips */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 12 }}>
          {chips.map(chip => (
            <button key={chip.id} onClick={() => setChipFilter(chipFilter === chip.id ? null : chip.id)}
              style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 20, border: `1.5px solid ${chipFilter === chip.id ? "var(--ab-red)" : "var(--ab-border)"}`, background: chipFilter === chip.id ? "var(--ab-red-light)" : "var(--ab-card2)", color: chipFilter === chip.id ? "var(--ab-red)" : "var(--ab-text2)", fontSize: 13, fontWeight: 600, fontFamily: "Vazirmatn,sans-serif", cursor: "pointer", whiteSpace: "nowrap" }}>
              {chip.label}
            </button>
          ))}
        </div>
        <div style={{ borderBottom: "1px solid var(--ab-border)" }} />
      </div>

      <div className="ab-page" style={{ padding: 0 }}>
        {/* Notification enable/disable row — ENTIRE ROW IS CLICKABLE */}
        <div onClick={toggleNotif} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--ab-border)", cursor: "pointer", direction: "rtl", background: notifEnabled ? "transparent" : "rgba(234,179,8,0.04)", userSelect: "none" }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: notifEnabled ? "rgba(5,150,105,0.1)" : "rgba(234,179,8,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .2s" }}>
            {notifEnabled
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><line x1="4" y1="4" x2="20" y2="20"/></svg>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: notifEnabled ? "#059669" : "#92400E", fontFamily: "Vazirmatn,sans-serif" }}>اعلان پیام‌ها</div>
            <div style={{ fontSize: 12, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif", marginTop: 2 }}>{notifEnabled ? "اعلان‌ها فعال است — کلیک برای غیرفعال" : "اعلان‌ها غیرفعال است — کلیک برای فعال"}</div>
          </div>
          {/* Visual toggle indicator */}
          <div style={{ width: 44, height: 24, borderRadius: 12, background: notifEnabled ? "#10B981" : "var(--ab-faint)", position: "relative", flexShrink: 0, transition: "background .2s" }}>
            <div style={{ position: "absolute", top: 3, left: notifEnabled ? 23 : 3, width: 18, height: 18, borderRadius: 9, background: "#FFF", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left .2s" }} />
          </div>
        </div>

        {/* Postchi An Banner row */}
        <div onClick={() => push({ t: "postchi" })} style={{ display: "flex", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--ab-border)", cursor: "pointer", background: postchiUnread > 0 ? "rgba(232,53,78,0.04)" : "var(--ab-bg)", direction: "rtl", alignItems: "center" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: "var(--ab-red)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            {postchiUnread > 0 && (
              <div style={{ position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, background: "var(--ab-red)", color: "#FFF", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #FFF", padding: "0 3px" }}>
                {toFaD(postchiUnread)}
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "var(--ab-text)", fontFamily: "Vazirmatn,sans-serif" }}>پستچی آن بنر</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#1976D2"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138z"/></svg>
              </div>
              {latestPostchi && <span style={{ fontSize: 11, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif" }}>{timeAgo(latestPostchi.createdAt)}</span>}
            </div>
            <span style={{ fontSize: 12, color: postchiUnread > 0 ? "var(--ab-text)" : "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif" }}>
              {latestPostchi?.title ?? "اعلانات سیستمی آن بنر"}
            </span>
          </div>
          {postchiUnread > 0 && <div style={{ width: 9, height: 9, borderRadius: 5, background: "var(--ab-red)", flexShrink: 0 }} />}
        </div>

        {/* Conversation list */}
        {filteredConvs.length === 0 ? (
          <ABEmpty title="پیامی ندارید" desc="وقتی با فروشندگان پیام رد و بدل کنید اینجا نمایش داده می‌شود" icon="💬" />
        ) : filteredConvs.map(conv => {
          const listing = abGetAds().find(l => l.listingId === conv.listingId);
          const otherUserId = conv.sellerId === _currentUid ? conv.buyerId : conv.sellerId;
          const other = abGetBannerUser(otherUserId);
          const hasUnread = conv.unreadCount > 0;
          return (
            <div key={conv.conversationId} onClick={() => push({ t: "chat", cid: conv.conversationId })}
              style={{ display: "flex", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--ab-border)", cursor: "pointer", background: hasUnread ? "rgba(232,53,78,0.04)" : "var(--ab-bg)", direction: "rtl", alignItems: "center" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                {listing?.images[0]
                  ? <img src={listing.images[0]} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  : <div style={{ width: 56, height: 56, borderRadius: 12, background: "var(--ab-card2)", display: "flex", alignItems: "center", justifyContent: "center" }}><ABIco name="image" size={22} color="#CCC" /></div>}
                {other?.avatar && (
                  <img src={other.avatar} alt="" style={{ position: "absolute", bottom: -4, right: -4, width: 24, height: 24, borderRadius: 8, objectFit: "cover", border: "2px solid #FFF" }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: hasUnread ? 800 : 600, color: "var(--ab-text)", fontFamily: "Vazirmatn,sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{listing?.title ?? other?.name ?? "مکالمه"}</span>
                  <span style={{ fontSize: 11, color: "#AAA", fontFamily: "Vazirmatn,sans-serif", flexShrink: 0 }}>{timeAgo(conv.lastMessageAt)}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif", marginBottom: 3 }}>{other?.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: hasUnread ? "var(--ab-text)" : "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, fontWeight: hasUnread ? 600 : 400 }}>{conv.lastMessage || "مکالمه جدید"}</span>
                  {hasUnread && (
                    <div style={{ minWidth: 20, height: 20, borderRadius: 10, background: "var(--ab-red)", color: "#FFF", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 8, padding: "0 5px" }}>
                      {toFaD(conv.unreadCount)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Screen: Chat View ──────────────────────────────────────────── */
const AB_STICKERS = ["😊","😂","🥰","😎","🤔","👍","👏","🙏","❤️","🎉","🔥","✅","😢","😮","🤝","💪","🌹","🎁","⭐","💯","🚗","🏠","📱","💰","🛒","🎭","🌸","🦋","🍕","☕"];

function ABChatView({ cid, push, pop }: { cid: string; push: (v: ABView) => void; pop?: () => void }) {
  const _cv = useConvsVersion();
  const conv = abGetConvs().find(c => c.conversationId === cid);
  const listing = abGetAds().find(l => l.listingId === conv?.listingId);
  const otherUserId = conv ? (conv.sellerId === _currentUid ? conv.buyerId : conv.sellerId) : null;
  const other = abGetBannerUser(otherUserId);
  const [input, setInput] = useState("");
  const [offerMode, setOfferMode] = useState(false);
  const [offerVal, setOfferVal] = useState("");
  const [showStickers, setShowStickers] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSecs, setRecordingSecs] = useState(0);
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const displayMsgs = abGetMsgs(cid);

  // Mark conversation read on mount
  useEffect(() => { abMarkConvRead(cid); }, [cid]);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [displayMsgs.length]);

  const send = () => {
    if (!input.trim()) return;
    void abAddMsg(cid, { messageId: Date.now().toString(), conversationId: cid, senderId: _currentUid, type:"text", text:input.trim(), createdAt:new Date().toISOString(), status:"sent" });
    setInput(""); setShowStickers(false);
  };
  const sendSticker = (s:string) => {
    void abAddMsg(cid, { messageId: Date.now().toString(), conversationId: cid, senderId:_currentUid, type:"sticker", sticker:s, text:s, createdAt:new Date().toISOString(), status:"sent" });
    setShowStickers(false);
  };
  const sendOffer = () => {
    const amt=Number(offerVal.replace(/[^0-9]/g,"")); if(!amt)return;
    void abAddMsg(cid,{messageId:Date.now().toString(),conversationId:cid,senderId:_currentUid,type:"offer",offerAmount:amt,text:String(amt),createdAt:new Date().toISOString(),status:"sent"});
    setOfferMode(false);setOfferVal("");
  };

  const startRecording = async () => {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const dur = recordingSecs;
        setRecording(false); setRecordingSecs(0);
        if (recTimerRef.current) clearInterval(recTimerRef.current);
        void abAddMsg(cid, { messageId: Date.now().toString(), conversationId: cid, senderId: _currentUid, type: "voice", media: url, duration: dur, createdAt: new Date().toISOString(), status: "sent" });
      };
      mr.start();
      mediaRecRef.current = mr;
      setRecording(true);
      recTimerRef.current = setInterval(() => setRecordingSecs(s => s + 1), 1000);
    } catch {
      console.error("voice_recording_unavailable");
    }
  };
  const stopRecording = () => {
    if (mediaRecRef.current && mediaRecRef.current.state !== "inactive") {
      mediaRecRef.current.stop();
    } else {
      setRecording(false); setRecordingSecs(0);
      if (recTimerRef.current) clearInterval(recTimerRef.current);
    }
  };
  const cancelRecording = () => {
    if (mediaRecRef.current && mediaRecRef.current.state !== "inactive") {
      mediaRecRef.current.ondataavailable = null;
      mediaRecRef.current.onstop = () => {};
      mediaRecRef.current.stop();
    }
    setRecording(false); setRecordingSecs(0);
    if (recTimerRef.current) clearInterval(recTimerRef.current);
  };

  const playVoice = (msg: ABMessage) => {
    if (!msg.media) return;
    if (playingMsgId === msg.messageId) {
      audioRefs.current[msg.messageId]?.pause();
      setPlayingMsgId(null);
      return;
    }
    Object.values(audioRefs.current).forEach(a => a.pause());
    let audio = audioRefs.current[msg.messageId];
    if (!audio) {
      audio = new Audio(msg.media);
      audio.onended = () => setPlayingMsgId(null);
      audioRefs.current[msg.messageId] = audio;
    }
    audio.play();
    setPlayingMsgId(msg.messageId);
  };

  const fmtSecs = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${toFaD(m)}:${toFaD(sec).padStart(2, "۰")}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--ab-bg)" }}>
      {/* Header with owner info */}
      <div className="ab-header" style={{ background: "var(--ab-bg2)" }}>
        <button className="ab-icon-btn" onClick={() => pop ? pop() : push({ t: "chat-list" })}><ABIco name="arrow" size={22} color="var(--ab-text)" /></button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          {other?.avatar
            ? <img src={other.avatar} alt="" style={{ width: 38, height: 38, borderRadius: 12, objectFit: "cover" }} />
            : <div style={{ width: 38, height: 38, borderRadius: 12, background: "var(--ab-red)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#FFF" }}>{other?.name?.[0] ?? "؟"}</div>}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ab-text)", fontFamily: "Vazirmatn,sans-serif" }}>{other?.name ?? "کاربر"}</div>
            <div style={{ fontSize: 11, color: "var(--ab-green)", fontFamily: "Vazirmatn,sans-serif" }}>آنلاین</div>
          </div>
        </div>
        <button className="ab-icon-btn"><ABIco name="moreV" size={20} color="var(--ab-text2)" /></button>
      </div>

      {/* Listing context banner — NOT a full-area click target; only the small arrow button navigates */}
      {listing && (
        <div style={{ background: "var(--ab-bg2)", borderBottom: "1px solid var(--ab-border)", padding: "8px 12px", display: "flex", gap: 10, alignItems: "center", direction: "rtl", flexShrink: 0 }}>
          {listing.images[0]
            ? <img src={listing.images[0]} alt="" style={{ width: 42, height: 42, borderRadius: 10, objectFit: "cover", flexShrink: 0, pointerEvents: "none" }} />
            : <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--ab-card2)", flexShrink: 0 }} />}
          <div style={{ flex: 1, minWidth: 0, pointerEvents: "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ab-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "Vazirmatn,sans-serif" }}>{listing.title}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ab-green)", fontFamily: "Vazirmatn,sans-serif" }}>{fmtPrice(listing.price, listing.priceMode)}</div>
          </div>
          {/* Small explicit "view listing" button — only this triggers navigation */}
          <button
            onClick={e => { e.stopPropagation(); push({ t: "listing", lid: listing.listingId }); }}
            style={{ flexShrink: 0, background: "var(--ab-card2)", border: "1px solid var(--ab-border)", borderRadius: 10, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--ab-text2)", fontFamily: "Vazirmatn,sans-serif", fontWeight: 600 }}>
            مشاهده
            <ABIco name="chevron" size={12} color="var(--ab-muted)" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="ab-page" style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {displayMsgs.map(msg => {
          const isMe = msg.senderId === _currentUid;
          if (msg.type === "sticker") {
            return (
              <div key={msg.messageId} style={{ alignSelf: isMe ? "flex-end" : "flex-start", fontSize: 44, lineHeight: 1, margin: "2px 0" }}>
                {msg.sticker}
              </div>
            );
          }
          if (msg.type === "voice") {
            const dur = msg.duration ?? 0;
            const isPlaying = playingMsgId === msg.messageId;
            return (
              <div key={msg.messageId} style={{ alignSelf: isMe ? "flex-end" : "flex-start", background: isMe ? "var(--ab-red)" : "var(--ab-card)", borderRadius: isMe ? "18px 4px 18px 18px" : "4px 18px 18px 18px", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.07)", direction: "rtl", maxWidth: "220px" }}>
                <button onClick={() => msg.media ? playVoice(msg) : undefined}
                  style={{ width: 36, height: 36, borderRadius: 18, background: isMe ? "rgba(255,255,255,0.25)" : "var(--ab-red)", border: "none", cursor: msg.media ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {isPlaying
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill={isMe ? "white" : "white"}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill={isMe ? "white" : "white"}><polygon points="5,3 19,12 5,21"/></svg>}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 20, display: "flex", alignItems: "center", gap: 1 }}>
                    {Array.from({ length: 20 }, (_, i) => (
                      <div key={i} style={{ width: 2, height: `${6 + Math.sin(i * 1.2) * 6}px`, background: isMe ? "rgba(255,255,255,0.7)" : "var(--ab-red)", borderRadius: 2 }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: isMe ? "rgba(255,255,255,0.7)" : "var(--ab-muted)", marginTop: 2, fontFamily: "Vazirmatn,sans-serif" }}>{fmtSecs(dur)}</div>
                </div>
              </div>
            );
          }
          if (msg.type === "offer") {
            return (
              <div key={msg.messageId} className="ab-msg-offer" style={{ alignSelf: isMe ? "flex-end" : "flex-start" }}>
                <div style={{ fontSize: 12, color: "var(--ab-green)", fontWeight: 700, marginBottom: 6 }}>💰 پیشنهاد قیمت</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "var(--ab-green)", fontFamily: "Vazirmatn,sans-serif" }}>{fmtPrice(msg.offerAmount ?? 0)}</div>
                {!isMe && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button style={{ flex: 1, padding: "8px", borderRadius: 9, background: "var(--ab-green)", color: "#FFF", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Vazirmatn,sans-serif" }}>قبول</button>
                    <button style={{ flex: 1, padding: "8px", borderRadius: 9, background: "transparent", color: "var(--ab-text2)", border: "1px solid var(--ab-border)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Vazirmatn,sans-serif" }}>رد</button>
                  </div>
                )}
              </div>
            );
          }
          // text
          return (
            <div key={msg.messageId} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "78%", display: "flex", flexDirection: "column", gap: 2 }}>
              <div className={isMe ? "ab-msg-me" : "ab-msg-other"} style={{ margin: 0 }}>
                {msg.text}
              </div>
              <div style={{ fontSize: 10, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif", alignSelf: isMe ? "flex-end" : "flex-start" }}>
                {new Date(msg.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                {isMe && <span style={{ marginRight: 4 }}>{msg.status === "read" ? "✓✓" : msg.status === "delivered" ? "✓✓" : "✓"}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticker picker */}
      {showStickers && (
        <div style={{ background: "var(--ab-bg2)", borderTop: "1px solid var(--ab-border)", padding: "12px 16px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {AB_STICKERS.map(s => (
              <button key={s} onClick={() => sendSticker(s)} style={{ width: 44, height: 44, fontSize: 26, background: "none", border: "1px solid var(--ab-border)", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Offer input */}
      {offerMode && !recording && (
        <div style={{ padding: "10px 16px", background: "#F8F8F6", borderTop: "1px solid var(--ab-border)", display: "flex", gap: 8, direction: "rtl" }}>
          <input className="ab-input" style={{ flex: 1, height: 44 }} placeholder="قیمت پیشنهادی (تومان)" value={offerVal} onChange={e => setOfferVal(e.target.value)} type="number" />
          <button className="ab-btn-primary" style={{ height: 44, padding: "0 16px", fontSize: 13 }} onClick={sendOffer}>ارسال</button>
        </div>
      )}

      {/* Recording state */}
      {recording ? (
        <div style={{ padding: "12px 16px", background: "var(--ab-bg2)", borderTop: "1px solid var(--ab-border)", display: "flex", alignItems: "center", gap: 12, direction: "rtl" }}>
          <button onClick={cancelRecording} style={{ width: 40, height: 40, borderRadius: 12, background: "var(--ab-card2)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, background: "var(--ab-red)", animation: "pulse 1s infinite" }} />
            <span style={{ fontSize: 15, fontFamily: "Vazirmatn,sans-serif", color: "var(--ab-text)", fontWeight: 700 }}>{fmtSecs(recordingSecs)}</span>
            <span style={{ fontSize: 12, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif" }}>در حال ضبط...</span>
          </div>
          <button onClick={stopRecording} style={{ height: 44, padding: "0 18px", borderRadius: 13, background: "var(--ab-red)", color: "#FFF", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Vazirmatn,sans-serif" }}>ارسال</button>
        </div>
      ) : (
        /* Normal Input bar */
        <div className="ab-chat-input-bar">
          <button className="ab-icon-btn" onClick={() => { setShowStickers(!showStickers); setOfferMode(false); }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>😊</span>
          </button>
          <button className="ab-icon-btn" onClick={() => { setOfferMode(!offerMode); setShowStickers(false); }}>
            <ABIco name="dollar" size={20} color={offerMode ? "var(--ab-red)" : "var(--ab-muted)"} />
          </button>
          <textarea className="ab-chat-input" placeholder="پیام..." value={input} onChange={e => setInput(e.target.value)} rows={1}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            style={{ flex: 1 }} />
          {input.trim()
            ? <button className="ab-icon-btn" style={{ background: "var(--ab-red)", borderRadius: 12, width: 40, height: 40 }} onClick={send}>
                <ABIco name="send" size={17} color="#FFF" />
              </button>
            : <button className="ab-icon-btn" onPointerDown={startRecording} style={{ color: "var(--ab-muted)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              </button>}
        </div>
      )}
    </div>
  );
}

/* ─── Screen: Me Tab ─────────────────────────────────────────────── */
function ABMeTab({ push, favs }: { push: (v: ABView) => void; favs: string[] }) {
  const _v = useAdsVersion();
  const me = abGetUser();
  const [notifOn, setNotifOn] = useState(true);
  const myListings = abGetAds().filter(l => l.ownerId === _currentUid || l.ownerId === me.userId);
  const myFavListings = abGetAds().filter(l => favs.includes(l.listingId));

  return (
    <div className="ab-page">
      {/* Profile hero */}
      <div style={{ background: "var(--ab-card2)", padding: "24px 20px 20px", borderBottom: "1px solid var(--ab-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div onClick={() => push({ t: "edit-profile" })} style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}>
            <img src={me.avatar} alt="" style={{ width: 68, height: 68, borderRadius: 20, objectFit: "cover", border: "3px solid var(--ab-border)", display: "block" }} />
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: 7, background: "var(--ab-red)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--ab-card2)" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: "var(--ab-text)" }}>{me.name}</span>
              <ABIco name="verified" size={16} color="#4ade80" />
            </div>
            <div style={{ fontSize: 12, color: "var(--ab-text2)", marginTop: 4 }}>عضو از {new Date(me.createdAt).toLocaleDateString("fa-IR", { year: "numeric", month: "long" })}</div>
            <div style={{ fontSize: 11, color: "var(--ab-muted)", marginTop: 2 }}>{me.mobile}</div>
          </div>
          <button className="ab-icon-btn" style={{ marginRight: "auto" }} onClick={() => push({ t: "edit-profile" })}>
            <ABIco name="edit" size={20} color="var(--ab-text2)" />
          </button>
        </div>
        <div className="ab-profile-stats">
          <div className="ab-stat-tile">
            <div style={{ fontSize: 18, fontWeight: 900, color: "var(--ab-text)" }}>{toFaD(myListings.length)}</div>
            <div style={{ fontSize: 11, color: "var(--ab-muted)", marginTop: 4 }}>آگهی فعال</div>
          </div>
          <div className="ab-stat-tile">
            <div style={{ fontSize: 18, fontWeight: 900, color: "var(--ab-text)" }}>{toFaD(myFavListings.length)}</div>
            <div style={{ fontSize: 11, color: "var(--ab-muted)", marginTop: 4 }}>نشان‌شده</div>
          </div>
          <div className="ab-stat-tile">
            <div style={{ fontSize: 18, fontWeight: 900, color: "var(--ab-text)" }}>{toFaD(abGetConvs().length)}</div>
            <div style={{ fontSize: 11, color: "var(--ab-muted)", marginTop: 4 }}>مکالمات</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ background: "var(--ab-card)", margin: "12px 16px", borderRadius: 16, border: "1px solid var(--ab-border)", overflow: "hidden" }}>
        {[
          { label: "آگهی‌های من", icon: "list", action: () => push({ t: "my-listings" }) },
          { label: "نشان‌شده‌ها", icon: "heart", action: () => push({ t: "fav" }) },
          { label: "پیام‌ها", icon: "msg", action: () => push({ t: "chat-list" }) },
          { label: "اعلان‌ها", icon: "bell", action: () => push({ t: "notifs" }) },
          { label: "تیکت‌های من", icon: "info", action: () => push({ t: "my-tickets" }) },
        ].map((item, i, arr) => (
          <div key={item.label} onClick={item.action}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 16px", cursor: "pointer", borderBottom: i < arr.length - 1 ? "1px solid var(--ab-border)" : undefined }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--ab-red-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ABIco name={item.icon} size={18} color="var(--ab-red)" />
            </div>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--ab-text)" }}>{item.label}</span>
            <ABIco name="chevron" size={16} color="var(--ab-muted)" />
          </div>
        ))}
      </div>

      {/* Settings */}
      <div style={{ background: "var(--ab-card)", margin: "0 16px 20px", borderRadius: 16, border: "1px solid var(--ab-border)", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "var(--ab-muted)", borderBottom: "1px solid var(--ab-border)" }}>تنظیمات</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: "1px solid var(--ab-border)" }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(100,100,100,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ABIco name="bell" size={18} color="var(--ab-text2)" />
          </div>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--ab-text)" }}>اعلان‌های پیام</span>
          <button className={`ab-switch${notifOn ? " on" : ""}`} onClick={() => setNotifOn(!notifOn)} />
        </div>
        {[
          { label: "پشتیبانی", icon: "info", action: () => push({ t: "support" }) },
          { label: "قوانین و مقررات", icon: "report", action: () => push({ t: "terms" }) },
        ].map((item, i, arr) => (
          <div key={item.label} onClick={item.action} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", cursor: "pointer", borderBottom: i < arr.length - 1 ? "1px solid var(--ab-border)" : undefined }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(107,107,107,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ABIco name={item.icon} size={18} color="var(--ab-text2)" />
            </div>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--ab-text)" }}>{item.label}</span>
            <ABIco name="chevron" size={16} color="var(--ab-muted)" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Screen: Favorites ──────────────────────────────────────────── */
function ABFavScreen({ push, favs, toggleFav }: {
  push: (v: ABView) => void; favs: string[]; toggleFav: (id: string) => void;
}) {
  const _v = useAdsVersion();
  const items = abGetAds().filter(l => favs.includes(l.listingId));
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ABHeader title={`نشان‌شده‌ها (${toFaD(items.length)})`} onBack={() => push({ t: "me" })} />
      <div className="ab-page" style={{ padding: "12px 16px" }}>
        {items.length === 0 ? (
          <ABEmpty title="هنوز آگهی‌ای نشان نکردید" desc="با زدن آیکون قلب روی آگهی‌ها، آنها را اینجا ذخیره کنید" icon="❤️" />
        ) : (
          <div style={{ background: "var(--ab-card)", borderRadius: 14, overflow: "hidden" }}>
            {items.map((l, idx) => (
              <div
                key={l.listingId}
                onClick={() => push({ t: "listing", lid: l.listingId })}
                style={{ display: "flex", gap: 12, padding: "14px 16px", borderBottom: idx < items.length - 1 ? "1px solid var(--ab-border)" : "none", cursor: "pointer", flexDirection: "row-reverse", alignItems: "flex-start" }}
              >
                <img src={l.images[0]} alt={l.title} style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, direction: "rtl" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ab-text)", lineHeight: 1.5, marginBottom: 6 }}>{l.title}</div>
                  <div style={{ fontSize: 13, color: "var(--ab-text2)", marginBottom: 4 }}>{fmtPrice(l.price, l.priceMode)}</div>
                  <div style={{ fontSize: 13, color: "var(--ab-text2)" }}>{timeAgo(l.createdAt)}</div>
                </div>
                <button className="ab-icon-btn" style={{ flexShrink: 0 }} onClick={e => { e.stopPropagation(); toggleFav(l.listingId); }}>
                  <ABIco name="heartFill" size={18} color="#E8354E" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Screen: My Listings ────────────────────────────────────────── */
function ABMyListings({ push }: { push: (v: ABView) => void }) {
  const [tab, setTab] = useState<"active" | "sold" | "expired">("active");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const _v = useAdsVersion();
  const me = abGetUser();
  const my = abGetAds().filter(l => l.ownerId === _currentUid || l.ownerId === me.userId);
  const filtered = my.filter(l => {
    if (tab === "active") return l.status === "active";
    if (tab === "sold") return l.status === "sold";
    if (tab === "expired") return l.status === "expired" || l.status === "draft";
    return true;
  });

  const doDelete = (id: string) => {
    abDeleteAd(id);
    setDeleteConfirm(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
          <div style={{ background: "var(--ab-card2)", borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 340, textAlign: "center", direction: "rtl" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🗑️</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--ab-text)", marginBottom: 10, fontFamily: "Vazirmatn,sans-serif" }}>حذف آگهی</div>
            <div style={{ fontSize: 14, color: "var(--ab-text2)", lineHeight: 1.8, marginBottom: 24, fontFamily: "Vazirmatn,sans-serif" }}>آیا از حذف این آگهی مطمئن هستید؟ این عمل قابل بازگشت نیست.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, height: 48, borderRadius: 13, border: "1.5px solid var(--ab-border)", background: "var(--ab-card2)", fontSize: 15, fontWeight: 700, color: "var(--ab-text)", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif" }}>انصراف</button>
              <button onClick={() => doDelete(deleteConfirm)} style={{ flex: 1, height: 48, borderRadius: 13, border: "none", background: "var(--ab-red)", fontSize: 15, fontWeight: 700, color: "#FFF", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif" }}>حذف</button>
            </div>
          </div>
        </div>
      )}
      <ABHeader title="آگهی‌های من" onBack={() => push({ t: "me" })}
        rightSlot={<button className="ab-icon-btn" onClick={() => push({ t: "post" })}><ABIco name="plus" size={20} color="var(--ab-red)" /></button>} />
      <div style={{ padding: "10px 16px", background: "var(--ab-bg2)", borderBottom: "1px solid var(--ab-border)" }}>
        <div className="ab-segmented">
          {(["active", "sold", "expired"] as const).map((t, i) => (
            <button key={t} className={`ab-segment-btn${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
              {["فعال", "فروخته‌شده", "منقضی"][i]}
            </button>
          ))}
        </div>
      </div>
      <div className="ab-page" style={{ padding: 16 }}>
        {filtered.length === 0 ? (
          <ABEmpty title="آگهی‌ای در این وضعیت ندارید" desc="آگهی جدید ثبت کنید تا اینجا نمایش داده شود" icon="📋" />
        ) : (<>{filtered.map(l => (
          <div key={l.listingId} style={{ background: "var(--ab-card)", borderRadius: 14, border: "1px solid var(--ab-border)", overflow: "hidden", marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 0, cursor: "pointer" }} onClick={() => push({ t: "listing", lid: l.listingId })}>
              <img src={l.images[0]} alt="" style={{ width: 96, height: 80, objectFit: "cover", flexShrink: 0 }}
                onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='80' fill='%23f0f0f0'%3E%3Crect width='96' height='80'/%3E%3C/svg%3E"; }} />
              <div style={{ flex: 1, padding: "10px 12px", minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ab-text)", lineHeight: 1.5, marginBottom: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{l.title}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ab-text)" }}>{fmtPrice(l.price, l.priceMode)}</div>
                <div style={{ fontSize: 12, color: "var(--ab-muted)", marginTop: 2 }}>{timeAgo(l.createdAt)}</div>
              </div>
            </div>
            <div style={{ padding: "10px 14px", borderTop: "1px solid var(--ab-border)", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "var(--ab-muted)", display: "flex", gap: 4, alignItems: "center" }}><ABIco name="eye" size={12} color="var(--ab-muted)" />{toFaD(l.viewCount)}</span>
              <span style={{ fontSize: 12, color: "var(--ab-muted)", display: "flex", gap: 4, alignItems: "center" }}><ABIco name="msg" size={12} color="var(--ab-muted)" />{toFaD(l.messageCount)}</span>
              <div style={{ marginRight: "auto", display: "flex", gap: 8 }}>
                <button onClick={() => push({ t: "cat", cid: l.categoryId })}
                  style={{ fontSize: 12, color: "var(--ab-blue)", background: "rgba(37,99,235,0.07)", border: "none", borderRadius: 8, padding: "7px 11px", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                  <ABIco name="map" size={12} color="var(--ab-blue)" />مشاهده محل</button>
                <button onClick={() => push({ t: "edit-post", lid: l.listingId })}
                  style={{ fontSize: 12, color: "var(--ab-text2)", background: "var(--ab-bg)", border: "none", borderRadius: 8, padding: "7px 11px", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                  <ABIco name="edit" size={12} color="var(--ab-text2)" />ویرایش</button>
                {l.status === "active" ? (
                  <button onClick={() => abCloseAd(l.listingId)}
                    style={{ fontSize: 12, color: "#D97706", background: "rgba(217,119,6,0.09)", border: "none", borderRadius: 8, padding: "7px 11px", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                    <ABIco name="x" size={12} color="#D97706" />بستن</button>
                ) : (
                  <button onClick={() => abReopenAd(l.listingId)}
                    style={{ fontSize: 12, color: "var(--ab-green)", background: "var(--ab-green-light)", border: "none", borderRadius: 8, padding: "7px 11px", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                    <ABIco name="check" size={12} color="var(--ab-green)" />بازگشایی</button>
                )}
                <button onClick={() => setDeleteConfirm(l.listingId)}
                  style={{ fontSize: 12, color: "var(--ab-red)", background: "var(--ab-red-light)", border: "none", borderRadius: 8, padding: "7px 11px", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                  <ABIco name="trash" size={12} color="var(--ab-red)" />حذف</button>
              </div>
            </div>
          </div>
        ))}</>)}
        <button
          onClick={() => push({ t: "post" })}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", marginTop: 16, height: 56, borderRadius: 16, background: "var(--ab-red)", border: "none", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", fontSize: 16, fontWeight: 700, color: "#FFF", boxShadow: "0 4px 18px rgba(232,53,78,0.35)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          ثبت آگهی جدید
        </button>
      </div>
    </div>
  );
}

/* ─── Screen: Notifications ──────────────────────────────────────── */
function ABNotifsScreen({ push }: { push: (v: ABView) => void }) {
  const [notifs, setNotifs] = useState<ABNotification[]>([]);
  useEffect(() => { bannerApi.notifications().then(x=>setNotifs((x.notifications??[]).map((n:any)=>({notificationId:String(n.id),userId:_currentUid,type:(n.type??"system") as ABNotification["type"],title:n.title,description:n.description,read:Boolean(n.read),createdAt:n.created_at})))).catch(e=>console.error("notifications_failed",e)); }, []);
  const iconMap: Record<string, string> = { message: "msg", offer: "dollar", view: "eye", favorite: "heart", system: "info", "price-alert": "bell" };
  const colorMap: Record<string, string> = { message: "#E8354E", offer: "#059669", view: "#2563EB", favorite: "#E8354E", system: "#D97706", "price-alert": "#7C3AED" };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ABHeader title="اعلان‌ها" onBack={() => push({ t: "me" })} rightSlot={
        <button className="ab-icon-btn" onClick={() => { void bannerApi.readAllNotifications(); setNotifs(n => n.map(x => ({ ...x, read: true }))); }}>
          <ABIco name="check" size={18} color="var(--ab-red)" />
        </button>
      } />
      <div className="ab-page">
        {notifs.map(n => (
          <div key={n.notificationId} className={`ab-notif-row${!n.read ? " unread" : ""}`} onClick={() => { void bannerApi.readNotification(n.notificationId); setNotifs(prev => prev.map(x => x.notificationId === n.notificationId ? { ...x, read: true } : x)); }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: colorMap[n.type] + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ABIco name={iconMap[n.type] ?? "bell"} size={18} color={colorMap[n.type]} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: n.read ? 600 : 800, color: "var(--ab-text)" }}>{n.title}</span>
                {!n.read && <span style={{ width: 8, height: 8, borderRadius: 4, background: "var(--ab-red)", flexShrink: 0, marginTop: 4 }} />}
              </div>
              <div style={{ fontSize: 12, color: "var(--ab-text2)", lineHeight: 1.5 }}>{n.description}</div>
              <div style={{ fontSize: 11, color: "var(--ab-muted)", marginTop: 5 }}>{timeAgo(n.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Search history helpers ─────────────────────────────────────── */
const AB_HISTORY_KEY = "ab_search_history";
type ABHistoryItem = { q: string; city?: string; cat?: string; ts: number };

function loadHistory(): ABHistoryItem[] {
  try { return JSON.parse(localStorage.getItem(AB_HISTORY_KEY) ?? "[]"); } catch { return []; }
}
function saveHistory(items: ABHistoryItem[]) {
  try { localStorage.setItem(AB_HISTORY_KEY, JSON.stringify(items.slice(0, 20))); } catch { /* noop */ }
}
function pushHistory(q: string, city?: string, cat?: string) {
  if (!q.trim()) return;
  const prev = loadHistory().filter(h => h.q !== q.trim());
  saveHistory([{ q: q.trim(), city, cat, ts: Date.now() }, ...prev]);
}

/* ─── Screen: Search Results ─────────────────────────────────────── */
function ABSearchScreen({ initialQ, push, favs, toggleFav, citySelection }: {
  initialQ: string; push: (v: ABView) => void; favs: string[]; toggleFav: (id: string) => void;
  citySelection?: CitySelection;
}) {
  const [q, setQ] = useState(initialQ);
  const [focused, setFocused] = useState(!initialQ);
  const [history, setHistory] = useState<ABHistoryItem[]>(() => loadHistory());

  const catResults = useMemo(() => q.trim().length > 0 ? searchCategories(q.trim()).slice(0, 5) : [], [q]);

  const cityFilter = citySelection ?? { type: "all" };
  const results = useMemo(() => {
    const items = abGetAds().filter(l => {
      if (l.status !== "active") return false;
      if (!listingMatchesCity(l, cityFilter)) return false;
      if (!q.trim()) return true;
      return l.title.includes(q) || l.description.includes(q);
    });
    return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [q, cityFilter]);

  const doSearch = (val: string, cat?: string) => {
    const cityLabel_ = citySelection ? cityLabel(citySelection) : undefined;
    pushHistory(val, cityLabel_ !== "کل ایران" ? cityLabel_ : undefined, cat);
    setHistory(loadHistory());
    setFocused(false);
    setQ(val);
  };

  const deleteHistory = (ts: number) => {
    const next = history.filter(h => h.ts !== ts);
    setHistory(next);
    saveHistory(next);
  };

  const showHistory = focused && !q && history.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="ab-header">
        <button className="ab-icon-btn" onClick={() => push({ t: "home" })}><ABIco name="arrow" size={22} color="var(--ab-text)" /></button>
        <div style={{ flex: 1, padding: "0 4px" }}>
          <div style={{ display: "flex", alignItems: "center", background: "var(--ab-card2)", borderRadius: 10, padding: "0 12px", height: 44, gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ab-muted)" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              autoFocus={!initialQ}
              value={q}
              onChange={e => setQ(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              onKeyDown={e => { if (e.key === "Enter" && q.trim()) doSearch(q); }}
              placeholder="جستجو در آن بنر..."
              style={{ flex: 1, border: "none", background: "transparent", fontFamily: "Vazirmatn,sans-serif", fontSize: 14, color: "#222", outline: "none", direction: "rtl" }}
            />
            {q && <button onClick={() => setQ("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#AAA" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>}
          </div>
        </div>
      </div>

      {/* Search history panel */}
      {showHistory && (
        <div style={{ background: "var(--ab-bg2)", borderBottom: "1px solid var(--ab-border)", flexShrink: 0 }}>
          <div style={{ padding: "10px 16px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif" }}>جستجوهای اخیر</span>
            <button onClick={() => { setHistory([]); saveHistory([]); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#AAA", fontFamily: "Vazirmatn,sans-serif" }}>حذف همه</button>
          </div>
          {history.map(h => (
            <div key={h.ts} style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderTop: "1px solid #F6F6F6", cursor: "pointer" }} onClick={() => doSearch(h.q)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <div style={{ flex: 1, padding: "0 12px" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ab-text)", fontFamily: "Vazirmatn,sans-serif" }}>{h.q}</div>
                {(h.city || h.cat) && <div style={{ fontSize: 12, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif", marginTop: 2 }}>{[h.city, h.cat].filter(Boolean).join(" · ")}</div>}
              </div>
              <button onClick={e => { e.stopPropagation(); deleteHistory(h.ts); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {!showHistory && (
        <div style={{ padding: "8px 16px 4px", background: "var(--ab-bg)", flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: "var(--ab-muted)" }}>{toFaD(results.length)} نتیجه</span>
        </div>
      )}

      {/* Category matches */}
      {!showHistory && catResults.length > 0 && (
        <div style={{ background: "var(--ab-bg2)", borderBottom: "1px solid var(--ab-border)", flexShrink: 0 }}>
          <div style={{ padding: "8px 16px 4px", fontSize: 11, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif" }}>دسته‌بندی‌ها</div>
          {catResults.map(({ cat, path }) => (
            <div
              key={cat.categoryId}
              onClick={() => push({ t: "cat", cid: cat.categoryId })}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderTop: "1px solid #F6F6F6", cursor: "pointer" }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: cat.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CatIcon id={path[0]?.categoryId ?? cat.categoryId} color={cat.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ab-text)", fontFamily: "Vazirmatn,sans-serif" }}>{cat.name}</div>
                <div style={{ fontSize: 11, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif", marginTop: 2 }}>
                  {path.slice(0, -1).map(p => p.name).join(" ← ")}
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#AAA", fontFamily: "Vazirmatn,sans-serif" }}>{toFaD(abCategoryListingCount(cat))} آگهی</div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" transform="scale(-1,1) translate(-24,0)"/>
              </svg>
            </div>
          ))}
        </div>
      )}

      <div className="ab-page" style={{ padding: "4px 16px 16px" }}>
        {!showHistory && (results.length === 0 ? (
          <ABEmpty title="نتیجه‌ای یافت نشد" desc="با کلمات دیگری جستجو کنید" icon="🔍" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {results.map(l => <ABListingCard key={l.listingId} listing={l} layout="list" onTap={() => { doSearch(q || l.title); push({ t: "listing", lid: l.listingId }); }} onFav={() => toggleFav(l.listingId)} isFav={favs.includes(l.listingId)} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Screen: Seller Profile ─────────────────────────────────────── */
function ABProfileScreen({ uid, push, favs, toggleFav }: {
  uid: string; push: (v: ABView) => void; favs: string[]; toggleFav: (id: string) => void;
}) {
  const user = uid === _myUser.userId ? _myUser : abGetBannerUser(uid);
  const biz = AB_BUSINESSES.find(b => b.ownerId === uid);
  const listings = abGetAds().filter(l => l.ownerId === uid && l.status === "active");
  if (!user) return <ABEmpty title="کاربر یافت نشد" />;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ABHeader title="پروفایل" onBack={() => push({ t: "home" })} />
      <div className="ab-page">
        <div style={{ background: "linear-gradient(145deg,#1C1B1F,#2D2B30)", padding: "28px 20px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <img src={user.avatar} alt="" style={{ width: 80, height: 80, borderRadius: 24, objectFit: "cover", border: "3px solid rgba(255,255,255,0.2)" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#FFF", display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              {user.name}
              {user.verificationStatus === "verified" && <ABIco name="verified" size={18} color="#4ade80" />}
            </div>
            {biz && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{biz.businessType}</div>}
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>عضو از {new Date(user.createdAt).toLocaleDateString("fa-IR", { year: "numeric", month: "long" })}</div>
          </div>
          {biz && (
            <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 4 }}>
              <button className="ab-btn-primary" style={{ flex: 1, height: 44 }}>
                <ABIco name="phone" size={16} color="#FFF" />
                تماس
              </button>
              <button className="ab-btn-secondary" style={{ flex: 1, height: 44, borderColor: "rgba(255,255,255,0.3)", color: "#FFF" }}>
                <ABIco name="msg" size={16} color="#FFF" />
                پیام
              </button>
            </div>
          )}
        </div>
        {biz && (
          <div style={{ padding: "16px", borderBottom: "1px solid var(--ab-border)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ab-text)", marginBottom: 10 }}>درباره</div>
            <div style={{ fontSize: 13, color: "var(--ab-text2)", lineHeight: 1.8 }}>{biz.description}</div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {[{ icon: "map", text: biz.city + " · " + biz.address }, { icon: "clock", text: biz.workingHours }].map(item => (
                <div key={item.text} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <ABIco name={item.icon} size={14} color="var(--ab-muted)" />
                  <span style={{ fontSize: 12, color: "var(--ab-text2)" }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ padding: "16px" }}>
          <div className="ab-section-hd">
            <span className="ab-section-title">آگهی‌های فعال ({toFaD(listings.length)})</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {listings.map((l, idx) => (
              <div key={l.listingId} onClick={() => push({ t: "listing", lid: l.listingId })} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: idx < listings.length - 1 ? "1px solid var(--ab-border)" : "none", cursor: "pointer", flexDirection: "row-reverse", alignItems: "flex-start" }}>
                <img src={l.images[0]} alt={l.title} style={{ width: 88, height: 88, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, direction: "rtl" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ab-text)", lineHeight: 1.5, marginBottom: 4 }}>{l.title}</div>
                  <div style={{ fontSize: 13, color: "var(--ab-text2)", marginBottom: 2 }}>{fmtPrice(l.price, l.priceMode)}</div>
                  <div style={{ fontSize: 12, color: "var(--ab-muted)" }}>{timeAgo(l.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Ticket System ──────────────────────────────────────────────── */
const TICKET_STATUS_LABEL: Record<string, string> = {
  pending: "در انتظار بررسی", reviewing: "در حال بررسی", answered: "پاسخ داده شده", closed: "بسته شده"
};
const TICKET_STATUS_COLOR: Record<string, string> = {
  pending: "#D97706", reviewing: "#2563EB", answered: "#059669", closed: "#9A9A9A"
};
const TICKET_STATUS_BG: Record<string, string> = {
  pending: "rgba(217,119,6,0.09)", reviewing: "rgba(37,99,235,0.08)", answered: "rgba(5,150,105,0.09)", closed: "rgba(154,154,154,0.09)"
};

function ABMyTicketsScreen({ push, tickets, setTickets }: { push: (v: ABView) => void; tickets: ABTicket[]; setTickets: React.Dispatch<React.SetStateAction<ABTicket[]>> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ABHeader title="تیکت‌های من" onBack={() => push({ t: "me" })}
        rightSlot={<button className="ab-icon-btn" onClick={() => push({ t: "new-ticket" })}><ABIco name="plus" size={20} color="var(--ab-red)" /></button>} />
      <div className="ab-page">
        {tickets.length === 0 ? (
          <ABEmpty title="تیکتی وجود ندارد" desc="با کلیک روی + تیکت جدید ثبت کنید" icon="🎫" />
        ) : (
          tickets.map(t => (
            <div key={t.ticketId} onClick={() => push({ t: "ticket", tid: t.ticketId })}
              style={{ background: "var(--ab-card2)", borderBottom: "1px solid var(--ab-border)", padding: "14px 16px", cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ab-text)", fontFamily: "Vazirmatn,sans-serif", flex: 1 }}>{t.subject}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: TICKET_STATUS_BG[t.status], color: TICKET_STATUS_COLOR[t.status], fontFamily: "Vazirmatn,sans-serif", flexShrink: 0, marginRight: 8 }}>{TICKET_STATUS_LABEL[t.status]}</span>
              </div>
              {t.messages.length > 0 && (
                <div style={{ fontSize: 12, color: "var(--ab-muted)", lineHeight: 1.5, marginBottom: 6, fontFamily: "Vazirmatn,sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.messages[t.messages.length - 1].text}
                </div>
              )}
              <div style={{ fontSize: 11, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif" }}>{timeAgo(t.updatedAt)}</div>
            </div>
          ))
        )}
        <div style={{ padding: 16 }}>
          <button onClick={() => push({ t: "new-ticket" })} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", height: 52, borderRadius: 14, background: "var(--ab-red)", border: "none", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", fontSize: 15, fontWeight: 700, color: "#FFF" }}>
            <ABIco name="plus" size={20} color="#FFF" /> ثبت تیکت جدید
          </button>
        </div>
      </div>
    </div>
  );
}

function ABTicketDetailScreen({ tid, push, tickets, setTickets }: { tid: string; push: (v: ABView) => void; tickets: ABTicket[]; setTickets: React.Dispatch<React.SetStateAction<ABTicket[]>> }) {
  const ticket = tickets.find(t => t.ticketId === tid);
  const [reply, setReply] = useState("");
  useEffect(()=>{if(!tid)return;void bannerApi.ticket(tid).then((x:any)=>{const t=x.ticket;setTickets(ts=>ts.map(v=>v.ticketId===tid?{...v,status:t.status==="open"?"pending":t.status==="resolved"?"answered":"closed",updatedAt:t.updated_at,messages:(x.messages??[]).map((m:any)=>({id:String(m.id),senderId:m.sender_type==="admin"?"support":"user",text:m.body,createdAt:m.created_at}))}:v));}).catch(e=>console.error("ticket_load_failed",e));},[tid]);
  if (!ticket) return <ABEmpty title="تیکت یافت نشد" icon="🎫" />;

  const sendReply = () => {
    if (!reply.trim()) return;
    const text=reply.trim();
    void bannerApi.replyTicket(tid,text).then(()=>setTickets(ts=>ts.map(t=>t.ticketId===tid?{...t, messages:[...t.messages,{id:String(Date.now()),senderId:"user",text,createdAt:new Date().toISOString()}],updatedAt:new Date().toISOString()}:t))).catch(e=>console.error("ticket_reply_failed",e));
    setReply("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ABHeader title={ticket.subject} onBack={() => push({ t: "my-tickets" })} />
      <div style={{ padding: "8px 16px", background: "var(--ab-bg2)", borderBottom: "1px solid var(--ab-border)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: TICKET_STATUS_BG[ticket.status], color: TICKET_STATUS_COLOR[ticket.status], fontFamily: "Vazirmatn,sans-serif" }}>{TICKET_STATUS_LABEL[ticket.status]}</span>
        <span style={{ fontSize: 11, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif" }}>{timeAgo(ticket.createdAt)}</span>
      </div>
      <div className="ab-page" style={{ padding: 14 }}>
        {ticket.messages.map(msg => {
          const isUser = msg.senderId === "user";
          return (
            <div key={msg.id} style={{ display: "flex", justifyContent: isUser ? "flex-start" : "flex-end", marginBottom: 12 }}>
              <div style={{ maxWidth: "78%", background: isUser ? "var(--ab-card2)" : "var(--ab-red)", borderRadius: isUser ? "16px 16px 16px 4px" : "16px 16px 4px 16px", padding: "10px 14px" }}>
                <div style={{ fontSize: 13, color: isUser ? "var(--ab-text)" : "#FFF", fontFamily: "Vazirmatn,sans-serif", lineHeight: 1.6 }}>{msg.text}</div>
                <div style={{ fontSize: 10, color: isUser ? "var(--ab-muted)" : "rgba(255,255,255,0.65)", marginTop: 4, textAlign: isUser ? "right" : "left", fontFamily: "Vazirmatn,sans-serif" }}>{timeAgo(msg.createdAt)} — {msg.senderId === "user" ? "شما" : "پشتیبانی"}</div>
              </div>
            </div>
          );
        })}
      </div>
      {ticket.status !== "closed" && (
        <div style={{ padding: "10px 12px", background: "var(--ab-bg2)", borderTop: "1px solid var(--ab-border)", display: "flex", gap: 8, alignItems: "flex-end", flexShrink: 0, paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0))" }}>
          <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="پاسخ شما..." rows={2} style={{ flex: 1, border: "1.5px solid var(--ab-border)", borderRadius: 12, padding: "10px 12px", fontFamily: "Vazirmatn,sans-serif", fontSize: 13, color: "var(--ab-text)", background: "var(--ab-card2)", outline: "none", resize: "none", direction: "rtl" }} />
          <button onClick={sendReply} disabled={!reply.trim()} style={{ height: 44, width: 44, borderRadius: 12, background: "var(--ab-red)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: reply.trim() ? 1 : 0.4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}

function ABNewTicketScreen({ push, tickets, setTickets }: { push: (v: ABView) => void; tickets: ABTicket[]; setTickets: React.Dispatch<React.SetStateAction<ABTicket[]>> }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const subjects = ["مشکل در ثبت آگهی", "مشکل در پرداخت", "سوال", "درخواست حذف", "گزارش تخلف", "سایر"];

  const submit = () => {
    if (!subject || !message.trim()) return;
    void bannerApi.createTicket(subject,message.trim()).then((x:any)=>{
      const t=x.ticket;const now=t.created_at??new Date().toISOString();
      const newTicket:ABTicket={ticketId:String(t.id),userId:_currentUid,subject:t.subject,status:"pending",createdAt:now,updatedAt:t.updated_at??now,messages:[{id:"local",senderId:"user",text:message.trim(),createdAt:now}]};
      setTickets(ts=>[newTicket,...ts]);setSubmitted(true);setTimeout(()=>push({t:"ticket",tid:String(t.id)}),800);
    }).catch(e=>console.error("ticket_create_failed",e));
  };

  if (submitted) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "center", justifyContent: "center", gap: 16, padding: 32, textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: "var(--ab-green-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ab-text)", fontFamily: "Vazirmatn,sans-serif" }}>تیکت ثبت شد</div>
        <div style={{ fontSize: 13, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif" }}>در حال انتقال به تیکت...</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ABHeader title="تیکت جدید" onBack={() => push({ t: "my-tickets" })} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 160px" }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "var(--ab-text)", display: "block", marginBottom: 10, fontFamily: "Vazirmatn,sans-serif" }}>موضوع تیکت</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {subjects.map(s => (
              <button key={s} onClick={() => setSubject(s)}
                style={{ padding: "8px 14px", borderRadius: 20, border: `1.5px solid ${subject === s ? "var(--ab-red)" : "var(--ab-border)"}`, background: subject === s ? "var(--ab-red-light)" : "var(--ab-card2)", fontSize: 13, fontWeight: subject === s ? 700 : 500, cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", color: subject === s ? "var(--ab-red)" : "var(--ab-text2)", flexShrink: 0 }}>
                {subject === s && <span style={{ marginLeft: 4 }}>✓ </span>}{s}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "var(--ab-text)", display: "block", marginBottom: 8, fontFamily: "Vazirmatn,sans-serif" }}>توضیحات</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="مشکل یا سوال خود را شرح دهید..." rows={6}
            style={{ width: "100%", border: "1.5px solid var(--ab-border)", borderRadius: 12, padding: "12px", fontFamily: "Vazirmatn,sans-serif", fontSize: 13, color: "var(--ab-text)", background: "var(--ab-card2)", outline: "none", resize: "none", direction: "rtl", boxSizing: "border-box" }} />
        </div>
      </div>
      {/* Sticky submit */}
      <div style={{ position: "absolute", bottom: "calc(72px + env(safe-area-inset-bottom, 0px))", left: 0, right: 0, padding: "12px 16px", background: "var(--ab-bg)", borderTop: "1px solid var(--ab-border)", backdropFilter: "blur(12px)" }}>
        <button onClick={submit} disabled={!subject || !message.trim()}
          style={{ width: "100%", height: 52, borderRadius: 14, background: "var(--ab-red)", border: "none", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", fontSize: 15, fontWeight: 700, color: "#FFF", opacity: !subject || !message.trim() ? 0.5 : 1, transition: "opacity .15s" }}>
          ارسال تیکت
        </button>
      </div>
    </div>
  );
}

/* ─── Screen: Support ────────────────────────────────────────────── */
function ABSupportPage({ push }: { push: (v: ABView) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ABHeader title="پشتیبانی" onBack={() => push({ t: "me" })} />
      <div className="ab-page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "0 32px" }}>
          {/* Headset icon */}
          <div style={{ width: 96, height: 96, borderRadius: 28, background: "var(--ab-red-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--ab-red)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
              <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
            </svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ab-text)", marginBottom: 8, fontFamily: "Vazirmatn,sans-serif" }}>پشتیبانی آن بنر</div>
          <div style={{ fontSize: 14, color: "var(--ab-text2)", marginBottom: 32, fontFamily: "Vazirmatn,sans-serif", lineHeight: 1.8 }}>برای ارتباط مستقیم با تیم پشتیبانی با شماره زیر تماس بگیرید</div>
          {/* Phone number — tap to call */}
          <a href="tel:09375437106" style={{ textDecoration: "none" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 14, background: "var(--ab-card)", border: "1.5px solid var(--ab-border)", borderRadius: 18, padding: "18px 28px", boxShadow: "var(--ab-shadow)" }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: "var(--ab-red)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 12 19.79 19.79 0 0 1 1.07 3.4 2 2 0 0 1 3 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16z"/>
                </svg>
              </div>
              <span style={{ fontSize: 22, fontWeight: 900, color: "var(--ab-text)", fontFamily: "Vazirmatn,sans-serif", direction: "ltr", letterSpacing: 1 }}>۰۹۳۷۵۴۳۷۱۰۶</span>
            </div>
          </a>
          <div style={{ marginTop: 16, fontSize: 12, color: "var(--ab-muted)", fontFamily: "Vazirmatn,sans-serif" }}>لمس کنید تا مستقیم تماس بگیرید</div>
        </div>
      </div>
    </div>
  );
}


/* ─── Screen: Terms ──────────────────────────────────────────────── */
function ABTermsPage({ push }: { push: (v: ABView) => void }) {
  const sections = [
    {
      title: "۱. شرایط عمومی",
      body: "با استفاده از سرویس آن بنر، کاربر می‌پذیرد که تمام مقررات این سند را رعایت کند. آن بنر یک بازار آنلاین آگهی‌های ایران است و هیچ‌گونه مسئولیتی در قبال معاملات بین طرفین ندارد."
    },
    {
      title: "۲. قوانین ثبت آگهی",
      body: "آگهی‌ها باید دقیق، صادقانه و غیرمضر باشند. ثبت آگهی‌های تقلبی، فریبکارانه، یا غیرقانونی ممنوع است. آن بنر حق حذف یا ویرایش هر آگهی را برای خود محفوظ می‌دارد."
    },
    {
      title: "۳. حریم خصوصی",
      body: "اطلاعات شخصی کاربران با بالاترین استانداردهای امنیتی نگهداری می‌شود. اطلاعات هیچ‌گاه بدون رضایت کاربر به اشخاص ثالث داده نمی‌شود، مگر در موارد الزامی قانونی."
    },
    {
      title: "۴. مسئولیت‌پذیری",
      body: "آن بنر صرفاً یک بستر آگهی است. هرگونه تراکنش مالی، تحویل کالا، و ضمانت کیفیت بر عهده طرفین معامله است. توصیه می‌شود معاملات حضوری انجام شوند."
    },
    {
      title: "۵. مالکیت معنوی",
      body: "تمامی محتوای آن بنر شامل نشانه‌های تجاری، طراحی و کدهای نرم‌افزاری تحت حمایت قوانین مالکیت معنوی هستند و استفاده غیرمجاز از آن‌ها ممنوع است."
    },
    {
      title: "۶. تغییرات مقررات",
      body: "آن بنر حق دارد در هر زمان این مقررات را تغییر دهد. ادامه استفاده از سرویس پس از تغییرات به منزله پذیرش مقررات جدید است. کاربران از طریق ایمیل مطلع خواهند شد."
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ABHeader title="قوانین و مقررات" onBack={() => push({ t: "me" })} />
      <div className="ab-page">
        <div style={{ padding: "16px 16px 0", background: "var(--ab-bg2)", marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: "var(--ab-text2)", lineHeight: 1.8, paddingBottom: 14, borderBottom: "1px solid var(--ab-border)" }}>
            آخرین بروزرسانی: ۱۴۰۳/۰۶/۰۱ · لطفاً پیش از استفاده از سرویس آن بنر این مقررات را به دقت مطالعه کنید.
          </div>
        </div>
        {sections.map((s, i) => (
          <div key={i} style={{ background: "transparent", margin: "0", padding: "16px 16px", borderBottom: "1px solid var(--ab-border)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ab-text)", marginBottom: 8 }}>{s.title}</div>
            <div style={{ fontSize: 13, color: "var(--ab-text2)", lineHeight: 1.9 }}>{s.body}</div>
          </div>
        ))}
        <div style={{ padding: 16 }}>
          <div style={{ background: "var(--ab-card2)", borderRadius: 12, padding: "14px 16px", fontSize: 12, color: "var(--ab-muted)", lineHeight: 1.8 }}>
            با استفاده از آن بنر، تمامی شرایط فوق را پذیرفته‌اید. برای سوال با پشتیبانی تماس بگیرید.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main AnBanner Screen ───────────────────────────────────────── */
export default function AnBannerScreen({ onBack, userId, lightTheme }: { onBack: () => void; userId: string; lightTheme?: boolean }) {
  useEffect(() => { if (userId) void initAnBannerStore(userId); }, [userId]);
  const [tab, setTab] = useState<ABTab>("home");
  const [stack, setStack] = useState<ABView[]>([{ t: "home" }]);
  const [favs, setFavs] = useState<string[]>([]);
  const [citySelection, setCitySelection] = useState<CitySelection>(() => {
    try {
      const raw = localStorage.getItem(abKey("city_sel"));
      if (raw) return JSON.parse(raw) as CitySelection;
    } catch {}
    return { type: "all" };
  });
  const applyCity = (sel: CitySelection) => {
    setCitySelection(sel);
    try { localStorage.setItem(abKey("city_sel"), JSON.stringify(sel)); } catch {}
  };
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [tickets, setTickets] = useState<ABTicket[]>([]);
  useEffect(() => { if (!userId) return; bannerApi.tickets().then(x => setTickets((x.tickets??[]).map((t:any)=>({ticketId:String(t.id),userId,subject:t.subject,status:t.status==="open"?"pending":t.status==="resolved"?"answered":"closed",createdAt:t.created_at,updatedAt:t.updated_at,messages:[]})))).catch(e=>console.error("An Banner tickets unavailable",e)); }, [userId]);

  const push = (v: ABView) => setStack(s => [...s, v]);
  const pop = () => {
    if (stack.length > 1) setStack(s => s.slice(0, -1));
    else onBack();
  };

  // Device back button: integrate with the global _ANP_BACK stack
  useBackHandler(() => {
    if (showCitySelector) { setShowCitySelector(false); return; }
    pop();
  });
  // Navigate from listing → chat, ensuring back from chat goes to chat-list
  const startChat = (cid: string) => {
    setStack([{ t: "chat-list" }, { t: "chat", cid }]);
  };
  const toggleFav = (id: string) => {
    const next=favs.includes(id)?favs.filter(x=>x!==id):[...favs,id];setFavs(next);
    void bannerApi.favorite(id).catch(e=>{console.error("favorite_failed",e);setFavs(favs);});
  };

  const cur = stack[stack.length - 1];

  const activeTab: ABTab = ((): ABTab => {
    if (cur.t === "home" || cur.t === "cat" || cur.t === "sub") return "home";
    if (cur.t === "fav") return "fav";
    if (cur.t === "post") return "post";
    if (cur.t === "chat-list" || cur.t === "chat") return "msgs";
    if (cur.t === "me" || cur.t === "my-listings" || cur.t === "notifs" || cur.t === "my-tickets" || cur.t === "ticket" || cur.t === "new-ticket") return "me";
    return "home";
  })();

  const switchTab = (t: ABTab) => {
    if (t === "post") { push({ t: "post" }); return; }
    if (t === "fav") { setStack([{ t: "fav" }]); return; }
    setStack([{ t: t === "msgs" ? "chat-list" : t === "me" ? "me" : "home" }]);
    setTab(t);
  };

  const tabs: { id: ABTab; label: string; icon: string }[] = [
    { id: "home", label: "آگهی‌ها", icon: "home" },
    { id: "fav", label: "نشان‌ها", icon: "heart" },
    { id: "post", label: "", icon: "plus" },
    { id: "msgs", label: "چت و تماس", icon: "msg" },
    { id: "me", label: "آن بنر من", icon: "user" },
  ];

  const _cv = useConvsVersion();
  const unreadMsgs = abGetConvs().reduce((a, c) => a + c.unreadCount, 0);
  const unreadNotifs = abGetPostchi().filter(e => !e.read).length;

  return (
    <div className={`an-banner-root${lightTheme?" an-banner-light":""}`}>
      {/* ── Back to main app button — hidden on listing detail (handled inside) ── */}
      {cur.t !== "listing" && (
        <div style={{ position: "absolute", top: 10, left: 12, zIndex: 300, pointerEvents: "none" }}>
          <button
            onClick={onBack}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--ab-card2,rgba(255,255,255,0.9))", border: "1px solid var(--ab-border,rgba(0,0,0,0.08))", borderRadius: 20, padding: "5px 12px 5px 10px", cursor: "pointer", fontFamily: "Vazirmatn,sans-serif", fontSize: 11, fontWeight: 700, color: "var(--ab-text2,#444)", backdropFilter: "blur(8px)", boxShadow: "var(--ab-shadow,0 1px 6px rgba(0,0,0,0.10))", pointerEvents: "auto" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ab-muted,#666)" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            بازگشت به آن‌پرداز
          </button>
        </div>
      )}

      {/* ── Screen router ── */}
      {cur.t === "home" && <ABHomeTab push={push} favs={favs} toggleFav={toggleFav} citySelection={citySelection} setShowCitySelector={setShowCitySelector} />}
      {cur.t === "cat" && <ABCatListings cid={cur.cid} push={push} pop={pop} favs={favs} toggleFav={toggleFav} citySelection={citySelection} setShowCitySelector={setShowCitySelector} />}
      {cur.t === "listing" && <ABListingDetail lid={cur.lid} push={push} pop={pop} favs={favs} toggleFav={toggleFav} isMyAd={abGetAds().find(a => a.listingId === cur.lid)?.ownerId === userId} onDelete={id => { abDeleteAd(id); pop(); }} onStartChat={startChat} onBackToPardaz={onBack} />}
      {cur.t === "post" && <ABPostFlow push={push} />}
      {cur.t === "chat-list" && <ABMsgsTab push={push} />}
      {cur.t === "chat" && <ABChatView cid={cur.cid} push={push} pop={pop} />}
      {cur.t === "me" && <ABMeTab push={push} favs={favs} />}
      {cur.t === "fav" && <ABFavScreen push={push} favs={favs} toggleFav={toggleFav} />}
      {cur.t === "my-listings" && <ABMyListings push={push} />}
      {cur.t === "edit-post" && <ABEditPostFlow push={push} lid={cur.lid} />}
      {cur.t === "edit-profile" && <ABEditProfileForm push={push} />}
      {cur.t === "postchi" && <ABPostchiScreen push={push} />}
      {cur.t === "notifs" && <ABNotifsScreen push={push} />}
      {cur.t === "profile" && <ABProfileScreen uid={cur.uid} push={push} favs={favs} toggleFav={toggleFav} />}
      {cur.t === "search" && <ABSearchScreen initialQ={cur.q} push={push} favs={favs} toggleFav={toggleFav} citySelection={citySelection} />}
      {cur.t === "support" && <ABSupportPage push={push} />}
      {cur.t === "terms" && <ABTermsPage push={push} />}
      {cur.t === "my-tickets" && <ABMyTicketsScreen push={push} tickets={tickets} setTickets={setTickets} />}
      {cur.t === "ticket" && <ABTicketDetailScreen tid={cur.tid} push={push} tickets={tickets} setTickets={setTickets} />}
      {cur.t === "new-ticket" && <ABNewTicketScreen push={push} tickets={tickets} setTickets={setTickets} />}

      {/* ── City selector modal ── */}
      {showCitySelector && <ABCitySelector sel={citySelection} onClose={() => setShowCitySelector(false)} onApply={sel => { applyCity(sel); setShowCitySelector(false); }} />}

      {/* ── Bottom Tab Bar ── */}
      <div className="ab-tab-bar">
        {tabs.map(t => {
          if (t.id === "post") {
            return (
              <div key="post" style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
                <button className="ab-fab" onClick={() => push({ t: "post" })}>
                  <ABIco name="plus" size={26} color="#FFF" />
                </button>
              </div>
            );
          }
          const isActive = activeTab === t.id;
          const badge = t.id === "msgs" ? unreadMsgs : t.id === "me" ? unreadNotifs : 0;
          return (
            <button key={t.id} className={`ab-tab-btn${isActive ? " active" : ""}`} onClick={() => switchTab(t.id)}>
              <div style={{ position: "relative" }}>
                <ABIco name={t.icon} size={22} color={isActive ? "var(--ab-red)" : "var(--ab-muted)"} />
                {badge > 0 && (
                  <span style={{ position: "absolute", top: -5, left: -5, width: 16, height: 16, borderRadius: 8, background: "var(--ab-red)", color: "#FFF", fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #FFF" }}>{toFaD(badge)}</span>
                )}
              </div>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
