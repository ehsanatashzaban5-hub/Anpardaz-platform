BEGIN;
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

INSERT INTO schema_migrations(version) VALUES ('034_market_classification_queue')
ON CONFLICT(version) DO NOTHING;
COMMIT;