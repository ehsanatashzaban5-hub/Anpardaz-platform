BEGIN;

-- Final hardening for production An Market ingestion, classification, matching,
-- AI grounding and merchant attribution. No products/prices/stores are fabricated.
ALTER TABLE market_stores
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending','verified','blocked','rejected')),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS robots_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS feed_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE market_store_sources
  ADD COLUMN IF NOT EXISTS adapter TEXT,
  ADD COLUMN IF NOT EXISTS last_http_status INTEGER,
  ADD COLUMN IF NOT EXISTS last_item_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_content_hash TEXT,
  ADD COLUMN IF NOT EXISTS etag TEXT,
  ADD COLUMN IF NOT EXISTS last_modified TEXT;

ALTER TABLE market_products
  ADD COLUMN IF NOT EXISTS classification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (classification_status IN ('pending','rule','ai','review','verified')),
  ADD COLUMN IF NOT EXISTS classification_confidence NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS classification_reason TEXT,
  ADD COLUMN IF NOT EXISTS match_confidence NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS match_method TEXT;

CREATE INDEX IF NOT EXISTS idx_market_stores_verification
  ON market_stores(verification_status,active);
CREATE INDEX IF NOT EXISTS idx_market_sources_adapter
  ON market_store_sources(adapter,enabled);
CREATE INDEX IF NOT EXISTS idx_market_products_classification
  ON market_products(classification_status,classification_confidence);
CREATE INDEX IF NOT EXISTS idx_market_products_brand_model
  ON market_products(brand,model);

CREATE TABLE IF NOT EXISTS market_product_match_candidates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES market_products(id) ON DELETE CASCADE,
  candidate_product_id BIGINT NOT NULL REFERENCES market_products(id) ON DELETE CASCADE,
  score NUMERIC(5,4) NOT NULL CHECK(score>=0 AND score<=1),
  method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','accepted','rejected')),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviewed_by BIGINT REFERENCES platform_users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id,candidate_product_id)
);
CREATE INDEX IF NOT EXISTS idx_market_match_candidates_status
  ON market_product_match_candidates(status,score DESC);

CREATE TABLE IF NOT EXISTS market_category_classifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES market_products(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES market_categories(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK(method IN ('store_rule','alias','ai','manual')),
  confidence NUMERIC(5,4) NOT NULL CHECK(confidence>=0 AND confidence<=1),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_market_classifications_product
  ON market_category_classifications(product_id,active,confidence DESC);

CREATE TABLE IF NOT EXISTS market_ingestion_errors (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_id BIGINT REFERENCES market_stores(id) ON DELETE SET NULL,
  source_id BIGINT REFERENCES market_store_sources(id) ON DELETE SET NULL,
  sync_run_id BIGINT REFERENCES market_sync_runs(id) ON DELETE CASCADE,
  external_product_id TEXT,
  error_code TEXT NOT NULL,
  message TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_market_ingestion_errors_run
  ON market_ingestion_errors(sync_run_id,created_at DESC);

CREATE TABLE IF NOT EXISTS market_ai_feedback (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT REFERENCES platform_users(id) ON DELETE SET NULL,
  workflow_code TEXT NOT NULL,
  execution_id BIGINT REFERENCES ai_execution_runs(id) ON DELETE SET NULL,
  rating SMALLINT CHECK(rating BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only explicitly verified stores may be promoted to active production ingestion.
CREATE INDEX IF NOT EXISTS idx_market_clickouts_store_user_time
  ON market_clickouts(store_id,user_id,created_at DESC);

INSERT INTO schema_migrations(version)
VALUES ('047_market_final_hardening')
ON CONFLICT(version) DO NOTHING;

COMMIT;
