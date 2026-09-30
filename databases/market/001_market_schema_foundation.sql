-- An Market owns these tables. Historical source migrations 031-035 are consolidated here.
CREATE TABLE IF NOT EXISTS schema_migrations(version TEXT PRIMARY KEY,applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS market_users(id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,identity_id UUID NOT NULL UNIQUE,email TEXT,display_name TEXT,role TEXT NOT NULL DEFAULT 'user',status TEXT NOT NULL DEFAULT 'active',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS ai_providers(id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,name TEXT NOT NULL UNIQUE,provider_type TEXT NOT NULL,base_url TEXT,enabled BOOLEAN NOT NULL DEFAULT TRUE,priority INTEGER NOT NULL DEFAULT 100,model_policy JSONB NOT NULL DEFAULT '{}',secret_ref TEXT);
CREATE TABLE IF NOT EXISTS ai_workflows(id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,code TEXT NOT NULL UNIQUE,description TEXT,enabled BOOLEAN NOT NULL DEFAULT TRUE,require_human_review BOOLEAN NOT NULL DEFAULT TRUE,provider_policy JSONB NOT NULL DEFAULT '{}');
CREATE TABLE IF NOT EXISTS ai_prompt_versions(id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,workflow_id BIGINT NOT NULL REFERENCES ai_workflows(id) ON DELETE CASCADE,version INTEGER NOT NULL,system_prompt TEXT NOT NULL,user_template TEXT NOT NULL,enabled BOOLEAN NOT NULL DEFAULT TRUE,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),UNIQUE(workflow_id,version));
CREATE TABLE IF NOT EXISTS ai_execution_runs(id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,workflow_id BIGINT REFERENCES ai_workflows(id),provider_id BIGINT REFERENCES ai_providers(id),prompt_version_id BIGINT REFERENCES ai_prompt_versions(id),requester_identity_id UUID,source_type TEXT,source_id TEXT,status TEXT NOT NULL DEFAULT 'queued',model TEXT,input_tokens BIGINT NOT NULL DEFAULT 0,output_tokens BIGINT NOT NULL DEFAULT 0,cost NUMERIC(38,18) NOT NULL DEFAULT 0,request_hash TEXT,error_code TEXT,error_message TEXT,input_metadata JSONB NOT NULL DEFAULT '{}',output_metadata JSONB NOT NULL DEFAULT '{}',started_at TIMESTAMPTZ,completed_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),idempotency_key TEXT UNIQUE);
-- SOURCE 031_market_aggregator_foundation.sql
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


-- SOURCE 032_market_completion.sql
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


-- SOURCE 032_market_production_interactions_ai.sql
-- An Market production interaction + AI grounding layer.
-- No products, prices, reviews or stores are seeded here.

CREATE TABLE IF NOT EXISTS market_reviews (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES market_products(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','published','rejected','hidden')),
  helpful_count INTEGER NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),
  verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id,user_id)
);

CREATE INDEX IF NOT EXISTS idx_market_reviews_product_status
  ON market_reviews(product_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS market_review_votes (
  review_id BIGINT NOT NULL REFERENCES market_reviews(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (review_id,user_id)
);

CREATE TABLE IF NOT EXISTS market_store_category_rules (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES market_stores(id) ON DELETE CASCADE,
  source_category TEXT NOT NULL,
  category_id BIGINT NOT NULL REFERENCES market_categories(id) ON DELETE RESTRICT,
  confidence NUMERIC(5,4) NOT NULL DEFAULT 1 CHECK (confidence BETWEEN 0 AND 1),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id,source_category)
);

CREATE TABLE IF NOT EXISTS market_product_match_candidates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  offer_id BIGINT NOT NULL REFERENCES market_offers(id) ON DELETE CASCADE,
  candidate_product_id BIGINT NOT NULL REFERENCES market_products(id) ON DELETE CASCADE,
  score NUMERIC(7,6) NOT NULL CHECK (score BETWEEN 0 AND 1),
  match_method TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','rejected')),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(offer_id,candidate_product_id)
);

CREATE INDEX IF NOT EXISTS idx_market_match_candidates_pending
  ON market_product_match_candidates(status,score DESC);

CREATE TABLE IF NOT EXISTS market_sync_runs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES market_stores(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('scheduled','manual','retry')),
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running','succeeded','partial','failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  products_seen INTEGER NOT NULL DEFAULT 0,
  offers_seen INTEGER NOT NULL DEFAULT 0,
  products_created INTEGER NOT NULL DEFAULT 0,
  products_updated INTEGER NOT NULL DEFAULT 0,
  offers_created INTEGER NOT NULL DEFAULT 0,
  offers_updated INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,
  error_summary TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_market_sync_runs_store_time
  ON market_sync_runs(store_id,started_at DESC);

CREATE TABLE IF NOT EXISTS market_home_sections (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  section_type TEXT NOT NULL
    CHECK (section_type IN ('category','products','price_drops','stores','offers','custom')),
  query_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_merchant_reports (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES market_stores(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  views_count BIGINT NOT NULL DEFAULT 0,
  unique_viewers BIGINT NOT NULL DEFAULT 0,
  clickouts_count BIGINT NOT NULL DEFAULT 0,
  unique_clickers BIGINT NOT NULL DEFAULT 0,
  checkout_started_count BIGINT NOT NULL DEFAULT 0,
  purchase_reported_count BIGINT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(store_id,period_start,period_end),
  CHECK(period_end > period_start)
);

CREATE INDEX IF NOT EXISTS idx_market_merchant_reports_store_period
  ON market_merchant_reports(store_id,period_start DESC);

-- AI retrieval/audit metadata. Raw review/product text remains in the source tables;
-- this table only records which trusted Market records were supplied to a run.
CREATE TABLE IF NOT EXISTS market_ai_context_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  execution_run_id BIGINT NOT NULL REFERENCES ai_execution_runs(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK(item_type IN ('product','offer','review','store','category')),
  item_id BIGINT NOT NULL,
  relevance NUMERIC(7,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_ai_context_run
  ON market_ai_context_items(execution_run_id,item_type,item_id);


-- SOURCE 032_market_real_store_registry.sql
-- An Market real-store registry. This migration registers real stores only.
-- It intentionally does NOT create products, prices or offers. Those must come from a verified feed/API/approved importer.
INSERT INTO market_stores
  (name,slug,domain,homepage_url,category_hint,active,iframe_mode,feed_type)
VALUES
 ('دیجی‌کالا','digikala','digikala.com','https://www.digikala.com/','general',true,'unknown','manual'),
 ('تکنولایف','technolife','technolife.com','https://www.technolife.com/','digital',true,'unknown','manual'),
 ('دیجی‌استایل','digistyle','digistyle.com','https://www.digistyle.com/','fashion',true,'unknown','manual'),
 ('بانی‌مد','banimode','banimode.com','https://www.banimode.com/','fashion',true,'unknown','manual'),
 ('خانومی','khanoumi','khanoumi.com','https://www.khanoumi.com/','beauty-health',true,'unknown','manual'),
 ('مقداد آی‌تی','meghdadit','meghdadit.com','https://www.meghdadit.com/','digital',true,'unknown','manual'),
 ('کالاتیک','kalatik','kalatik.com','https://www.kalatik.com/','digital',true,'unknown','manual'),
 ('موبیت','mobit','mobit.ir','https://www.mobit.ir/','digital',true,'unknown','manual'),
 ('مدیسه','modiseh','modiseh.com','https://www.modiseh.com/','fashion',true,'unknown','manual'),
 ('شیکسون','shixon','shixon.com','https://www.shixon.com/','fashion',true,'unknown','manual'),
 ('مو تن رو','mootanroo','mootanroo.com','https://www.mootanroo.com/','beauty-health',true,'unknown','manual'),
 ('تیمچه','timcheh','timcheh.com','https://www.timcheh.com/','general',true,'unknown','manual'),
 ('زنبیل','zanbil','zanbil.ir','https://www.zanbil.ir/','home-appliance',true,'unknown','manual'),
 ('بانه دات کام','baneeh','baneeh.com','https://www.baneeh.com/','home-appliance',true,'unknown','manual'),
 ('جانبی','janebi','janebi.com','https://www.janebi.com/','digital',true,'unknown','manual'),
 ('لیون کامپیوتر','lioncomputer','lioncomputer.com','https://lioncomputer.com/','digital',true,'unknown','manual'),
 ('روژا','rojashop','rojashop.com','https://rojashop.com/','beauty-health',true,'unknown','manual'),
 ('دیدنگار','didnegar','didnegar.com','https://www.didnegar.com/','digital',true,'unknown','manual'),
 ('کالااوما','kalaoma','kalaoma.com','https://kalaoma.com/','general',true,'unknown','manual'),
 ('باسلام','basalam','basalam.com','https://basalam.com/','general',true,'unknown','manual'),
 ('اکالا','okala','okala.com','https://okala.com/','supermarket',true,'unknown','manual'),
 ('اسنپ‌شاپ','snappshop','snappshop.ir','https://snappshop.ir/','general',true,'unknown','manual'),
 ('پلازا دیجیتال','plazadigital','plazadigital.ir','https://plazadigital.ir/','digital',true,'unknown','manual'),
 ('کالازم','kalazem','kalazem.com','https://kalazem.com/','home-appliance',true,'unknown','manual'),
 ('توانینو','tavanino','tavanino.com','https://tavanino.com/','health',true,'unknown','manual')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name,
  domain=EXCLUDED.domain,
  homepage_url=EXCLUDED.homepage_url,
  category_hint=EXCLUDED.category_hint,
  active=true;

-- SOURCE 032_market_user_features_and_store_sync.sql
ALTER TABLE market_stores
  ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_interval_minutes INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified','verified','disabled')),
  ADD COLUMN IF NOT EXISTS supports_order_attribution BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_market_stores_active_sync
  ON market_stores(active,last_sync_at);

CREATE TABLE IF NOT EXISTS market_store_sync_runs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES market_stores(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK(status IN ('running','succeeded','failed','partial')),
  products_seen INTEGER NOT NULL DEFAULT 0,
  products_changed INTEGER NOT NULL DEFAULT 0,
  offers_changed INTEGER NOT NULL DEFAULT 0,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_market_store_sync_runs_store_time
  ON market_store_sync_runs(store_id,started_at DESC);

CREATE TABLE IF NOT EXISTS market_recent_views (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID NOT NULL,
  user_id BIGINT REFERENCES platform_users(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES market_products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_recent_views_user_time
  ON market_recent_views(identity_id,viewed_at DESC);

CREATE TABLE IF NOT EXISTS market_price_alerts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID NOT NULL,
  user_id BIGINT NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES market_products(id) ON DELETE CASCADE,
  target_price NUMERIC(24,8) NOT NULL CHECK(target_price > 0),
  currency CHAR(3) NOT NULL DEFAULT 'IRR',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id,product_id)
);

CREATE INDEX IF NOT EXISTS idx_market_price_alerts_active
  ON market_price_alerts(enabled,updated_at DESC);

CREATE TABLE IF NOT EXISTS market_saved_comparisons (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID NOT NULL,
  user_id BIGINT NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'مقایسه ذخیره‌شده',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_saved_comparison_items (
  comparison_id BIGINT NOT NULL REFERENCES market_saved_comparisons(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES market_products(id) ON DELETE CASCADE,
  position SMALLINT NOT NULL,
  PRIMARY KEY(comparison_id,product_id),
  UNIQUE(comparison_id,position)
);

CREATE INDEX IF NOT EXISTS idx_market_saved_comparisons_user
  ON market_saved_comparisons(user_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS market_order_attributions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clickout_id BIGINT REFERENCES market_clickouts(id) ON DELETE SET NULL,
  identity_id UUID,
  user_id BIGINT REFERENCES platform_users(id) ON DELETE SET NULL,
  store_id BIGINT REFERENCES market_stores(id) ON DELETE SET NULL,
  external_order_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','confirmed','cancelled','unknown')),
  amount NUMERIC(24,8),
  currency CHAR(3),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_order_attributions_store_time
  ON market_order_attributions(store_id,created_at DESC);


-- SOURCE 033_market_ai_compare_workflow.sql
INSERT INTO ai_workflows(code,description,enabled,require_human_review,provider_policy)
VALUES
('market.compare','Compare selected marketplace products using verified catalog data only',TRUE,FALSE,'{"providers":["gemini","openai"],"max_retries":1}'::jsonb)
ON CONFLICT(code) DO UPDATE SET provider_policy=EXCLUDED.provider_policy,enabled=TRUE;

INSERT INTO ai_prompt_versions(workflow_id,version,system_prompt,user_template)
SELECT id,1,
'You are An Market purchase-assistance AI. Use only the supplied product data. Do not invent prices, specifications, sellers, availability, warranties, reviews, or purchase outcomes. Explain factual differences and uncertainty in Persian. Do not claim that one product is objectively best. Return concise structured Persian text.',
'Compare these products for the user request below. Product data:\n{{input}}'
FROM ai_workflows WHERE code='market.compare'
ON CONFLICT(workflow_id,version) DO NOTHING;


-- SOURCE 034_market_classification_queue.sql
CREATE TABLE IF NOT EXISTS market_classification_queue (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES market_products(id) ON DELETE CASCADE,
  source_category TEXT,
  suggested_category_id BIGINT REFERENCES market_categories(id) ON DELETE SET NULL,
  method TEXT NOT NULL CHECK(method IN ('rule','ai','manual')),
  confidence NUMERIC(5,4),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected')),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_market_classification_queue_status ON market_classification_queue(status,created_at);


-- SOURCE 034_market_production_foundation.sql
-- An Market production catalog ingestion / synchronization control plane.
CREATE TABLE IF NOT EXISTS market_store_sources (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES market_stores(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK(source_type IN ('json','xml','rss','api','crawler')),
  endpoint_url TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  auth_required BOOLEAN NOT NULL DEFAULT FALSE,
  mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  schedule_cron TEXT,
  last_started_at TIMESTAMPTZ,
  last_completed_at TIMESTAMPTZ,
  last_status TEXT CHECK(last_status IN ('running','succeeded','failed','blocked')),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id,source_name)
);

CREATE TABLE IF NOT EXISTS market_sync_runs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_id BIGINT REFERENCES market_stores(id) ON DELETE SET NULL,
  source_id BIGINT REFERENCES market_store_sources(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','running','succeeded','failed','blocked')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  discovered_count INTEGER NOT NULL DEFAULT 0,
  upserted_count INTEGER NOT NULL DEFAULT 0,
  deactivated_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  error_summary TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 032 created market_sync_runs with a different operational schema. Reconcile it
-- explicitly instead of relying on CREATE TABLE IF NOT EXISTS, which does not alter
-- an existing table.
ALTER TABLE market_sync_runs
  ADD COLUMN IF NOT EXISTS source_id BIGINT REFERENCES market_store_sources(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS discovered_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS upserted_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deactivated_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS error_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE market_sync_runs ALTER COLUMN store_id DROP NOT NULL;
ALTER TABLE market_sync_runs DROP CONSTRAINT IF EXISTS market_sync_runs_store_id_fkey;
ALTER TABLE market_sync_runs
  ADD CONSTRAINT market_sync_runs_store_id_fkey
  FOREIGN KEY (store_id) REFERENCES market_stores(id) ON DELETE SET NULL;

ALTER TABLE market_sync_runs DROP CONSTRAINT IF EXISTS market_sync_runs_status_check;
ALTER TABLE market_sync_runs
  ADD CONSTRAINT market_sync_runs_status_check
  CHECK (status IN ('queued','running','succeeded','partial','failed','blocked','skipped'));

CREATE INDEX IF NOT EXISTS idx_market_store_sources_enabled
  ON market_store_sources(enabled,store_id);
CREATE INDEX IF NOT EXISTS idx_market_sync_runs_store_time
  ON market_sync_runs(store_id,created_at DESC);

-- AI workflows are provider-neutral. Production can be activated later by setting
-- the chosen provider key/model; no catalog/product data is fabricated here.
INSERT INTO ai_workflows(code,description,enabled,require_human_review,provider_policy)
VALUES
('market.assist','Persian purchase assistant grounded only in supplied An Market catalog data',TRUE,FALSE,'{"providers":["gemini"],"max_retries":1}'::jsonb),
('market.compare','Persian comparison of selected An Market products using supplied verified catalog data',TRUE,FALSE,'{"providers":["gemini"],"max_retries":1}'::jsonb)
ON CONFLICT(code) DO UPDATE
SET enabled=TRUE, provider_policy=EXCLUDED.provider_policy, description=EXCLUDED.description;

INSERT INTO ai_prompt_versions(workflow_id,version,system_prompt,user_template)
SELECT id,2,
'You are the An Market shopping assistant. Answer in Persian. Use ONLY the supplied catalog/product data. Never invent price, specifications, seller, availability, warranty, delivery, rating or purchase status. If data is missing, say it is unavailable. Do not present an invented checkout or purchase. Keep recommendations transparent and explain uncertainty.',
'User request:
{{input}}

Return a concise, useful Persian answer grounded only in the supplied data.'
FROM ai_workflows WHERE code='market.assist'
ON CONFLICT(workflow_id,version) DO NOTHING;

INSERT INTO ai_prompt_versions(workflow_id,version,system_prompt,user_template)
SELECT id,2,
'You are the An Market comparison assistant. Answer in Persian. Compare only fields explicitly present in the supplied product data. Never invent missing specifications, prices, sellers, availability, warranty, delivery, ratings or reviews. Explain factual differences and uncertainty; do not claim an objectively best product.',
'Compare these selected products:
{{input}}'
FROM ai_workflows WHERE code='market.compare'
ON CONFLICT(workflow_id,version) DO NOTHING;


-- SOURCE 035_market_taxonomy.sql
-- An Market category taxonomy: parent/child structure used by web and mobile.
WITH roots AS (
  SELECT id,slug FROM market_categories WHERE parent_id IS NULL
)
INSERT INTO market_categories(parent_id,slug,name,name_fa,icon,sort_order)
SELECT r.id,v.slug,v.name,v.name_fa,v.icon,v.sort_order
FROM roots r JOIN (VALUES
('mobile-digital','mobile-phones','Mobile Phones','موبایل','smartphone',1),
('mobile-digital','tablets','Tablets','تبلت','tablet',2),
('mobile-digital','mobile-accessories','Mobile Accessories','لوازم جانبی موبایل','headphones',3),
('laptop-computer','laptops','Laptops','لپ‌تاپ','laptop',1),
('laptop-computer','computer-parts','Computer Parts','قطعات کامپیوتر','cpu',2),
('laptop-computer','monitors','Monitors','مانیتور','monitor',3),
('laptop-computer','gaming','Gaming','گیمینگ','gamepad',4),
('home-appliance','refrigerator','Refrigerator & Freezer','یخچال و فریزر','home',1),
('home-appliance','washing-machine','Washing Machines','ماشین لباسشویی','home',2),
('home-appliance','kitchen','Kitchen Appliances','لوازم آشپزخانه','home',3),
('home-appliance','vacuum','Cleaning Appliances','نظافت و جاروبرقی','home',4),
('supermarket','food','Food','مواد غذایی','shopping-cart',1),
('supermarket','beverages','Beverages','نوشیدنی','coffee',2),
('supermarket','personal-care','Personal Care','بهداشت شخصی','heart',3),
('fashion','women-clothing','Women Clothing','پوشاک زنانه','shirt',1),
('fashion','men-clothing','Men Clothing','پوشاک مردانه','shirt',2),
('fashion','kids-clothing','Kids Clothing','پوشاک کودک','baby',3),
('fashion','shoes-bags','Shoes & Bags','کفش و کیف','shopping-bag',4),
('beauty-health','skincare','Skincare','مراقبت پوست','heart',1),
('beauty-health','haircare','Haircare','مراقبت مو','heart',2),
('beauty-health','makeup','Makeup','آرایش','heart',3),
('audio-video','tv','TV','تلویزیون','tv',1),
('audio-video','headphones','Headphones & Earbuds','هدفون و هندزفری','headphones',2),
('audio-video','speakers','Speakers','اسپیکر','volume-2',3),
('automotive','car-parts','Car Parts','قطعات خودرو','tool',1),
('automotive','car-accessories','Car Accessories','لوازم خودرو','car',2),
('sports','fitness','Fitness','بدنسازی و تناسب اندام','activity',1),
('sports','outdoor','Outdoor Sports','ورزش و سفر','map',2),
('baby-kids','baby-care','Baby Care','مراقبت کودک','baby',1),
('baby-kids','toys','Toys','اسباب‌بازی','gamepad',2),
('books-culture','books','Books','کتاب','book',1),
('books-culture','stationery','Stationery','لوازم‌التحریر','briefcase',2),
('tools-industrial','hand-tools','Hand Tools','ابزار دستی','tool',1),
('tools-industrial','power-tools','Power Tools','ابزار برقی','tool',2),
('travel-camping','camping','Camping','کمپینگ','map',1),
('travel-camping','travel-accessories','Travel Accessories','لوازم سفر','map',2),
('pet','pet-food','Pet Food','غذای حیوانات','paw',1),
('pet','pet-accessories','Pet Accessories','لوازم حیوانات','paw',2),
('office','office-equipment','Office Equipment','تجهیزات اداری','briefcase',1),
('office','stationery','Office Stationery','لوازم اداری','briefcase',2),
('jewelry-gold','gold-jewelry','Gold Jewelry','طلای زینتی','gem',1),
('jewelry-gold','jewelry','Jewelry','جواهرات','gem',2)
) v(root_slug,slug,name,name_fa,icon,sort_order) ON v.root_slug=r.slug
ON CONFLICT(slug) DO NOTHING;

