BEGIN;

-- 042: production-grade An Market community, taxonomy mapping, homepage and merchant reporting.
ALTER TABLE market_products
  ADD COLUMN IF NOT EXISTS normalized_title TEXT,
  ADD COLUMN IF NOT EXISTS gtin TEXT,
  ADD COLUMN IF NOT EXISTS mpn TEXT,
  ADD COLUMN IF NOT EXISTS model TEXT;

CREATE INDEX IF NOT EXISTS idx_market_products_gtin ON market_products(gtin) WHERE gtin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_market_products_normalized_title ON market_products(normalized_title);

CREATE TABLE IF NOT EXISTS market_category_aliases (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_key TEXT NOT NULL UNIQUE,
  category_id BIGINT NOT NULL REFERENCES market_categories(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_market_category_aliases_category ON market_category_aliases(category_id,active);

CREATE TABLE IF NOT EXISTS market_reviews (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES market_products(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK(rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT NOT NULL CHECK(length(trim(body)) BETWEEN 2 AND 10000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','published','rejected','hidden')),
  helpful_count INTEGER NOT NULL DEFAULT 0 CHECK(helpful_count>=0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id,user_id)
);

CREATE TABLE IF NOT EXISTS market_review_likes (
  review_id BIGINT NOT NULL REFERENCES market_reviews(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(review_id,user_id)
);

CREATE INDEX IF NOT EXISTS idx_market_reviews_product_status ON market_reviews(product_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_review_likes_user ON market_review_likes(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS market_home_sections (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  section_type TEXT NOT NULL CHECK(section_type IN ('hero','category','products','offers','stores','campaign')),
  query JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO market_home_sections(key,title,subtitle,section_type,query,sort_order)
VALUES
('categories','دسته‌بندی‌ها','دسته‌های فعال آن مارکت','category','{}',10),
('latest-products','محصولات تازه','محصولات دریافت‌شده از فیدهای معتبر','products','{"sort":"latest","limit":12}',20),
('price-comparison','پیشنهادهای قابل مقایسه','محصولاتی با چند فروشگاه فعال','products','{"sort":"store_count","limit":12}',30),
('stores','فروشگاه‌های فعال','فروشگاه‌هایی که منبع داده معتبر دارند','stores','{"limit":12}',40)
ON CONFLICT(key) DO NOTHING;

CREATE TABLE IF NOT EXISTS market_merchant_commission_rules (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES market_stores(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  commission_type TEXT NOT NULL CHECK(commission_type IN ('fixed','percent')),
  commission_value NUMERIC(24,8) NOT NULL CHECK(commission_value>=0),
  currency CHAR(3) DEFAULT 'IRR',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  UNIQUE(store_id,rule_name)
);

CREATE TABLE IF NOT EXISTS market_merchant_report_exports (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_id BIGINT REFERENCES market_stores(id) ON DELETE SET NULL,
  from_at TIMESTAMPTZ NOT NULL,
  to_at TIMESTAMPTZ NOT NULL,
  format TEXT NOT NULL CHECK(format IN ('json','csv')),
  requested_by BIGINT REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_clickouts_store_time ON market_clickouts(store_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_purchase_store_time ON market_purchase_events(store_id,event_type,created_at DESC);

-- Deterministic initial taxonomy aliases. The ingestion worker uses these only as
-- classification hints; store-provided categories never become executable instructions.
INSERT INTO market_category_aliases(source_key,category_id,priority)
SELECT v.source_key,c.id,v.priority
FROM (VALUES
 ('mobile',10),('smartphone',10),('موبایل',10),('phone',10),
 ('laptop',20),('computer',20),('لپ تاپ',20),('کامپیوتر',20),
 ('refrigerator',30),('washing machine',30),('لوازم خانگی',30),
 ('supermarket',40),('grocery',40),('مواد غذایی',40),
 ('fashion',50),('clothing',50),('پوشاک',50),
 ('cosmetic',60),('beauty',60),('آرایشی',60),('بهداشتی',60),
 ('tv',70),('headphone',70),('audio',70),
 ('car',80),('automotive',80),('خودرو',80),
 ('sport',90),('fitness',90),('ورزش',90),
 ('baby',100),('toy',100),('کودک',100),
 ('book',110),('books',110),('کتاب',110),
 ('tool',120),('industrial',120),('ابزار',120),
 ('camp',130),('travel',130),('کمپینگ',130),
 ('pet',140),('حیوانات',140),
 ('stationery',150),('office',150),('لوازم التحریر',150),
 ('jewelry',160),('gold',160),('طلا',160)
) v(source_key,priority)
JOIN market_categories c ON c.id=v.priority
ON CONFLICT(source_key) DO NOTHING;

INSERT INTO schema_migrations(version) VALUES ('042_market_production_ecosystem')
ON CONFLICT(version) DO NOTHING;

COMMIT;