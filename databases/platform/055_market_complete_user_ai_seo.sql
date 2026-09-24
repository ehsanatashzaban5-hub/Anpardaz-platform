BEGIN;

-- 055: complete An Market user workspace, search/AI history, immutable activity,
-- profile avatar storage, SEO metadata, and admin reporting indexes.

ALTER TABLE platform_users
  ADD COLUMN IF NOT EXISTS profile_photo_id BIGINT;

CREATE TABLE IF NOT EXISTS market_user_searches (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID NOT NULL,
  user_id BIGINT NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_count INTEGER,
  surface TEXT NOT NULL DEFAULT 'web' CHECK(surface IN ('web','mobile')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_market_searches_user_time ON market_user_searches(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_searches_query ON market_user_searches USING gin(to_tsvector('simple',query_text));

CREATE TABLE IF NOT EXISTS market_ai_conversations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID NOT NULL,
  user_id BIGINT NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  workflow_code TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS market_ai_messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES market_ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('user','assistant')),
  content TEXT NOT NULL,
  product_ids BIGINT[] NOT NULL DEFAULT '{}',
  execution_id BIGINT REFERENCES ai_execution_runs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_market_ai_conversations_user ON market_ai_conversations(user_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_ai_messages_conversation ON market_ai_messages(conversation_id,created_at);

CREATE TABLE IF NOT EXISTS market_profile_avatars (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES platform_users(id) ON DELETE CASCADE,
  mime_type TEXT NOT NULL CHECK(mime_type IN ('image/jpeg','image/png','image/webp')),
  data BYTEA NOT NULL,
  sha256 TEXT NOT NULL,
  byte_size INTEGER NOT NULL CHECK(byte_size > 0 AND byte_size <= 1048576),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_activity_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID,
  user_id BIGINT REFERENCES platform_users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  surface TEXT NOT NULL DEFAULT 'web' CHECK(surface IN ('web','mobile','admin','system')),
  product_id BIGINT REFERENCES market_products(id) ON DELETE SET NULL,
  offer_id BIGINT REFERENCES market_offers(id) ON DELETE SET NULL,
  store_id BIGINT REFERENCES market_stores(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  operation_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_market_activity_user_time ON market_activity_log(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_activity_type_time ON market_activity_log(event_type,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_activity_store_time ON market_activity_log(store_id,created_at DESC);

CREATE TABLE IF NOT EXISTS market_seo_metadata (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('home','category','product','store')),
  entity_id BIGINT,
  canonical_path TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  robots TEXT NOT NULL DEFAULT 'index,follow',
  og_image TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entity_type,entity_id)
);
CREATE INDEX IF NOT EXISTS idx_market_seo_entity ON market_seo_metadata(entity_type,entity_id);

CREATE TABLE IF NOT EXISTS market_admin_exports (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_user_id BIGINT REFERENCES platform_users(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  row_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep only compact metadata in general activity/search/AI history; full AI
-- execution traces remain in the existing AI execution tables.
CREATE INDEX IF NOT EXISTS idx_market_purchase_events_user_time ON market_purchase_events(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_clickouts_user_time ON market_clickouts(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_reviews_product_status ON market_reviews(product_id,status,created_at DESC);

INSERT INTO schema_migrations(version)
VALUES ('055_market_complete_user_ai_seo')
ON CONFLICT(version) DO NOTHING;

COMMIT;