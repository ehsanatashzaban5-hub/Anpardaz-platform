BEGIN;

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

INSERT INTO schema_migrations(version)
VALUES ('032_market_production_interactions_ai')
ON CONFLICT(version) DO NOTHING;

COMMIT;
