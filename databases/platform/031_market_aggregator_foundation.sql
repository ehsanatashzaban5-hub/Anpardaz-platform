BEGIN;

-- An Market marketplace/aggregator foundation.
CREATE TABLE IF NOT EXISTS market_stores (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL UNIQUE,
  homepage_url TEXT NOT NULL,
  category_hint TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  iframe_mode TEXT NOT NULL DEFAULT 'unknown'
    CHECK (iframe_mode IN ('allowed','blocked','unknown')),
  feed_type TEXT NOT NULL DEFAULT 'manual'
    CHECK (feed_type IN ('manual','json','xml','rss','api','crawler')),
  feed_url TEXT,
  product_url_template TEXT,
  terms_url TEXT,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_id BIGINT REFERENCES market_categories(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_fa TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE market_products
  ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES market_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS canonical_key TEXT,
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS condition TEXT NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS specs JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'store_feed';

CREATE UNIQUE INDEX IF NOT EXISTS uq_market_products_canonical_key
  ON market_products(canonical_key)
  WHERE canonical_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_market_products_category_status
  ON market_products(category_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS market_offer_snapshots (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  offer_id BIGINT NOT NULL REFERENCES market_offers(id) ON DELETE CASCADE,
  store_id BIGINT REFERENCES market_stores(id) ON DELETE SET NULL,
  price NUMERIC(24,8) NOT NULL CHECK(price>=0),
  currency CHAR(3) NOT NULL,
  availability TEXT NOT NULL,
  shipping_cost NUMERIC(24,8),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE market_offers
  ADD COLUMN IF NOT EXISTS store_id BIGINT REFERENCES market_stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS external_product_id TEXT,
  ADD COLUMN IF NOT EXISTS product_url TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS raw_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_market_offers_store_product
  ON market_offers(store_id,product_id,price);

CREATE INDEX IF NOT EXISTS idx_market_offer_snapshots_offer_time
  ON market_offer_snapshots(offer_id,captured_at DESC);

CREATE TABLE IF NOT EXISTS market_clickouts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID,
  user_id BIGINT REFERENCES platform_users(id) ON DELETE SET NULL,
  product_id BIGINT REFERENCES market_products(id) ON DELETE SET NULL,
  offer_id BIGINT REFERENCES market_offers(id) ON DELETE SET NULL,
  store_id BIGINT REFERENCES market_stores(id) ON DELETE SET NULL,
  surface TEXT NOT NULL CHECK(surface IN ('web','mobile')),
  destination_url TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'external'
    CHECK(mode IN ('iframe','external')),
  session_id TEXT,
  operation_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_clickouts_user_time
  ON market_clickouts(identity_id,created_at DESC);

CREATE TABLE IF NOT EXISTS market_user_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID,
  user_id BIGINT REFERENCES platform_users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  surface TEXT NOT NULL CHECK(surface IN ('web','mobile','admin')),
  product_id BIGINT REFERENCES market_products(id) ON DELETE SET NULL,
  offer_id BIGINT REFERENCES market_offers(id) ON DELETE SET NULL,
  store_id BIGINT REFERENCES market_stores(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  operation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_user_events_identity_time
  ON market_user_events(identity_id,created_at DESC);

CREATE TABLE IF NOT EXISTS market_tickets (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK(status IN ('open','pending','answered','closed')),
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK(priority IN ('low','normal','high','urgent')),
  product_id BIGINT REFERENCES market_products(id) ON DELETE SET NULL,
  offer_id BIGINT REFERENCES market_offers(id) ON DELETE SET NULL,
  store_id BIGINT REFERENCES market_stores(id) ON DELETE SET NULL,
  order_id BIGINT REFERENCES market_orders(id) ON DELETE SET NULL,
  operation_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_ticket_messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES market_tickets(id) ON DELETE CASCADE,
  author_identity_id UUID,
  author_user_id BIGINT REFERENCES platform_users(id) ON DELETE SET NULL,
  author_type TEXT NOT NULL CHECK(author_type IN ('user','admin','system')),
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_tickets_user_status
  ON market_tickets(user_id,status,updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_market_ticket_messages_ticket_time
  ON market_ticket_messages(ticket_id,created_at);

-- The aggregator is not the merchant. These events let us trace click-out/order
-- intent without pretending that checkout happened inside An Market.
CREATE TABLE IF NOT EXISTS market_purchase_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID,
  user_id BIGINT REFERENCES platform_users(id) ON DELETE SET NULL,
  product_id BIGINT REFERENCES market_products(id) ON DELETE SET NULL,
  offer_id BIGINT REFERENCES market_offers(id) ON DELETE SET NULL,
  store_id BIGINT REFERENCES market_stores(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK(event_type IN ('view','compare','clickout','checkout_started','purchase_reported')),
  external_reference TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_purchase_events_user_time
  ON market_purchase_events(identity_id,created_at DESC);

-- Seed only the category taxonomy; no fake products, prices or stores.
INSERT INTO market_categories(slug,name,name_fa,icon,sort_order) VALUES
('mobile-digital','Mobile & Digital','موبایل و دیجیتال','smartphone',10),
('laptop-computer','Laptop & Computer','لپ‌تاپ و کامپیوتر','laptop',20),
('home-appliance','Home Appliances','لوازم خانگی','home',30),
('supermarket','Supermarket','هایپرمارکت','shopping-cart',40),
('fashion','Fashion & Apparel','مد و پوشاک','shirt',50),
('beauty-health','Beauty & Health','زیبایی و بهداشت','heart',60),
('audio-video','Audio & Video','صوتی و تصویری','tv',70),
('automotive','Automotive','خودرو و لوازم خودرو','car',80),
('sports','Sports','ورزش','activity',90),
('baby-kids','Baby & Kids','کودک و نوزاد','baby',100),
('books-culture','Books & Culture','کتاب و فرهنگ','book',110),
('tools-industrial','Tools & Industrial','ابزار و تجهیزات صنعتی','tool',120),
('travel-camping','Travel & Camping','سفر و کمپینگ','map',130),
('pet','Pet Supplies','حیوانات خانگی','paw',140),
('office','Office & Stationery','اداری و لوازم‌التحریر','briefcase',150),
('jewelry-gold','Jewelry & Gold','طلا و جواهر','gem',160),
('other','Other','سایر کالاها','grid',999)
ON CONFLICT(slug) DO NOTHING;

INSERT INTO schema_migrations(version)
VALUES ('031_market_aggregator_foundation')
ON CONFLICT(version) DO NOTHING;

COMMIT;