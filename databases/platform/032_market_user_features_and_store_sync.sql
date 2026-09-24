BEGIN;

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

INSERT INTO schema_migrations(version)
VALUES ('032_market_user_features_and_store_sync')
ON CONFLICT(version) DO NOTHING;

COMMIT;