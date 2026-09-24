BEGIN;

-- An Market completion layer: sources, ingestion runs, normalization, community,
-- homepage, merchant attribution and AI grounding. No product/store mock data.

ALTER TABLE market_stores
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending','verified','blocked','rejected')),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS market_store_sources (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES market_stores(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('json','xml','rss','api','crawler')),
  endpoint_url TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  schedule_cron TEXT,
  last_started_at TIMESTAMPTZ,
  last_completed_at TIMESTAMPTZ,
  last_status TEXT CHECK (last_status IN ('running','succeeded','failed','skipped')),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id,source_name)
);

CREATE TABLE IF NOT EXISTS market_sync_runs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_id BIGINT REFERENCES market_stores(id) ON DELETE SET NULL,
  source_id BIGINT REFERENCES market_store_sources(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK(status IN ('running','succeeded','failed','skipped')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  discovered_count INTEGER NOT NULL DEFAULT 0,
  upserted_count INTEGER NOT NULL DEFAULT 0,
  offer_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_market_sync_runs_created ON market_sync_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_store_sources_enabled ON market_store_sources(enabled,store_id);

CREATE TABLE IF NOT EXISTS market_product_matches (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_offer_id BIGINT REFERENCES market_offers(id) ON DELETE CASCADE,
  candidate_product_id BIGINT REFERENCES market_products(id) ON DELETE CASCADE,
  match_method TEXT NOT NULL CHECK(match_method IN ('gtin','mpn','sku','brand_model','normalized_title','ai','manual')),
  confidence NUMERIC(5,4) NOT NULL CHECK(confidence>=0 AND confidence<=1),
  status TEXT NOT NULL DEFAULT 'accepted' CHECK(status IN ('candidate','accepted','rejected','review')),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_offer_id,candidate_product_id,match_method)
);

CREATE TABLE IF NOT EXISTS market_category_mappings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_id BIGINT REFERENCES market_stores(id) ON DELETE CASCADE,
  source_category TEXT NOT NULL,
  category_id BIGINT NOT NULL REFERENCES market_categories(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK(method IN ('manual','rule','ai')),
  confidence NUMERIC(5,4) CHECK(confidence IS NULL OR (confidence>=0 AND confidence<=1)),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id,source_category)
);

CREATE TABLE IF NOT EXISTS market_reviews (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES market_products(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK(rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','published','rejected','hidden')),
  helpful_count INTEGER NOT NULL DEFAULT 0 CHECK(helpful_count>=0),
  verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  ai_moderation JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id,user_id)
);
CREATE INDEX IF NOT EXISTS idx_market_reviews_product_status ON market_reviews(product_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS market_review_votes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  review_id BIGINT NOT NULL REFERENCES market_reviews(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(review_id,user_id)
);

CREATE TABLE IF NOT EXISTS market_home_sections (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  section_type TEXT NOT NULL CHECK(section_type IN ('latest','category','price_drop','popular','stores','query')),
  query JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO market_home_sections(key,title,subtitle,section_type,query,sort_order) VALUES
('latest','جدیدترین کالاهای واقعی','از داده‌های همگام‌شده فروشگاه‌ها','latest','{}',10),
('price-drop','کاهش قیمت','قیمت‌های ثبت‌شده در بازه اخیر','price_drop','{}',20),
('popular','محبوب‌ترین‌ها','بر اساس رفتار واقعی کاربران','popular','{}',30),
('stores','فروشگاه‌ها','فروشگاه‌های تأییدشده آن مارکت','stores','{}',40)
ON CONFLICT(key) DO NOTHING;

CREATE TABLE IF NOT EXISTS market_merchant_commission_rules (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES market_stores(id) ON DELETE CASCADE,
  commission_type TEXT NOT NULL CHECK(commission_type IN ('fixed','percent')),
  commission_value NUMERIC(24,8) NOT NULL CHECK(commission_value>=0),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_market_commission_store_valid ON market_merchant_commission_rules(store_id,active,valid_from,valid_to);

CREATE TABLE IF NOT EXISTS market_merchant_report_exports (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_id BIGINT REFERENCES market_stores(id) ON DELETE SET NULL,
  from_at TIMESTAMPTZ NOT NULL,
  to_at TIMESTAMPTZ NOT NULL,
  format TEXT NOT NULL CHECK(format IN ('csv')),
  requested_by BIGINT REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_ai_documents (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT REFERENCES market_products(id) ON DELETE CASCADE,
  review_id BIGINT REFERENCES market_reviews(id) ON DELETE CASCADE,
  store_id BIGINT REFERENCES market_stores(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK(kind IN ('product','offer','review','store')),
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(kind,content_hash)
);
CREATE INDEX IF NOT EXISTS idx_market_ai_documents_product ON market_ai_documents(product_id,kind);

CREATE INDEX IF NOT EXISTS idx_market_offers_product_price ON market_offers(product_id,price,availability);
CREATE INDEX IF NOT EXISTS idx_market_purchase_events_store_time ON market_purchase_events(store_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_user_events_store_time ON market_user_events(store_id,created_at DESC);

INSERT INTO schema_migrations(version)
VALUES ('032_market_completion')
ON CONFLICT(version) DO NOTHING;

COMMIT;
