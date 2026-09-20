BEGIN;

ALTER TABLE market_orders
  ADD COLUMN IF NOT EXISTS operation_id TEXT;

UPDATE market_orders
SET operation_id = gen_random_uuid()::text
WHERE operation_id IS NULL;

ALTER TABLE market_orders
  ALTER COLUMN operation_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_market_orders_operation_id
  ON market_orders(operation_id);

CREATE INDEX IF NOT EXISTS idx_market_orders_operation_id
  ON market_orders(operation_id);

INSERT INTO schema_migrations(version)
VALUES ('030_market_operation_trace')
ON CONFLICT(version) DO NOTHING;

COMMIT;
