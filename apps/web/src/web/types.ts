// ─────────────────────────────────────────────────
// An Pardaz Web Portal — Type Definitions
// API-ready: every interface maps to a backend entity
// ─────────────────────────────────────────────────

// ── Access control ────────────────────────────────
export type UserRole = "guest" | "user" | "kyc_pending" | "kyc_verified" | "admin" | "content_manager" | "video_manager" | "support_operator";
export type KycStatus = "not_verified" | "submitted" | "pending" | "verified" | "rejected" | "correction_required";

export interface User {
  id: string;
  phone: string;
  name?: string;
  nationalId?: string;
  email?: string;
  role: UserRole;
  kycStatus: KycStatus;
  avatarUrl?: string;
  createdAt: string;
}

// ── Navigation ────────────────────────────────────
export type WebPage =
  | "home"
  | "sarraf" | "sarraf-markets" | "sarraf-trade" | "sarraf-assets" | "sarraf-deposit" | "sarraf-withdraw"
  | "market" | "market-product" | "market-category" | "market-orders"
  | "banner" | "banner-detail" | "banner-post"
  | "hoosh"
  | "financial"
  | "news" | "news-article"
  | "education" | "education-article"
  | "video" | "video-detail"
  | "auth" | "kyc"
  | "download"
  | "support"
  | "about";

// ── Content / SEO ─────────────────────────────────
export interface SeoMeta {
  title: string;
  description: string;
  keywords: string[];
  slug: string;
  ogImage?: string;
  canonicalUrl?: string;
  hashtags?: string[];
}

export interface Author {
  id: string;
  name: string;
  avatarUrl?: string;
}

export type ContentCategory =
  | "crypto-news" | "product-news" | "ai-news" | "tech-news"
  | "crypto-edu" | "ai-edu" | "forex-edu"
  | "video-edu" | "video-news" | "video-company";

export type ContentLevel = "beginner" | "intermediate" | "advanced";
export type PublishStatus = "draft" | "scheduled" | "published" | "unpublished";

export interface Article {
  id: string;
  type: "news" | "education";
  title: string;
  summary: string;
  body?: string;
  thumbnail?: string;
  category: ContentCategory;
  level?: ContentLevel;
  author: Author;
  publishedAt: string;
  readingTime: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  tags: string[];
  hashtags: string[];
  seo: SeoMeta;
  status: PublishStatus;
}

export interface Video {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string;
  videoUrl?: string;
  duration: number; // seconds
  category: ContentCategory;
  subcategory?: string;
  author: Author;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  tags: string[];
  keywords: string[];
  hashtags: string[];
  seo: SeoMeta;
  status: PublishStatus;
}

// ── Exchange (An Sarraf) ──────────────────────────
export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  nameFa: string;
  logoUrl?: string;
  logoColor: string;
  price: number;
  priceIrt: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
  rank: number;
  isFavorite?: boolean;
}

export interface OrderBookEntry { price: number; amount: number; total: number; }
export interface Trade { price: number; amount: number; side: "buy" | "sell"; time: string; }

export interface WalletBalance {
  assetId: string;
  available: number;
  locked: number;
  totalIrt: number;
}

export type NetworkName = "TRC20" | "ERC20" | "BEP20" | "Native" | "Polygon" | "Arbitrum" | "Optimism";

export interface DepositAddress {
  network: NetworkName;
  address: string;
  memo?: string;
  minDeposit: number;
  confirmations: number;
}

// ── Market (An Market) ────────────────────────────
export type ProductCondition = "new" | "used" | "refurbished";

export interface Product {
  id: string;
  title: string;
  titleFa: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  category: string;
  subcategory?: string;
  brand?: string;
  condition: ProductCondition;
  seller: Seller;
  rating: number;
  reviewCount: number;
  stock: number;
  sold: number;
  isFavorite?: boolean;
  tags: string[];
  specs?: Record<string, string>;
}

export interface Seller {
  id: string;
  name: string;
  nameFa: string;
  avatarUrl?: string;
  rating: number;
  reviewCount: number;
  salesCount: number;
  isVerified: boolean;
  joinedAt: string;
}

// ── Banner (An Banner) ────────────────────────────
export interface BannerAd {
  id: string;
  title: string;
  description: string;
  price?: number;
  images: string[];
  category: string;
  subcategory?: string;
  city: string;
  district?: string;
  seller: Seller;
  phone?: string;
  views: number;
  isFavorite?: boolean;
  postedAt: string;
  status: "active" | "pending" | "expired" | "rejected";
  isNegotiable: boolean;
}

export interface BannerCategory {
  id: string;
  name: string;
  nameFa: string;
  icon: string;
  adCount: number;
  subcategories?: BannerCategory[];
}

// ── AI (An Hoosh) ─────────────────────────────────
export interface AiProvider {
  id: string;
  name: string;
  color: string;
  bgColor: string;
}

export interface AiModel {
  id: string;
  name: string;
  providerId: string;
  descFa: string;
  capabilities: string[];
  contextWindow?: string;
  badge?: "new" | "pro";
  isAvailable: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  modelId?: string;
  createdAt: string;
  isThinking?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  preview: string;
  modelId: string;
  modeId?: string;
  messages: ChatMessage[];
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiProject {
  id: string;
  title: string;
  description: string;
  modelId: string;
  chatIds: string[];
  accentColor: string;
  createdAt: string;
  updatedAt: string;
}

// ── Financial Center ──────────────────────────────
export interface MarketIndex {
  name: string;
  nameFa: string;
  value: number;
  change: number;
  changePercent: number;
}

// ── Comments / Social ─────────────────────────────
export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  likes: number;
  createdAt: string;
  replies?: Comment[];
  status: "published" | "pending" | "rejected";
}

// ── Contact / Footer Config ───────────────────────
export interface FooterConfig {
  website: string;
  phone: string;
  email: string;
  address?: string;
  telegram?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  twitter?: string;
  appStoreUrl?: string;
  googlePlayUrl?: string;
  bazaarUrl?: string;
  myketUrl?: string;
}
