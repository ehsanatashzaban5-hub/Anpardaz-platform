BEGIN;

ALTER TABLE provider_trade_settlements
  DROP CONSTRAINT IF EXISTS provider_trade_settlements_operation_id_key;

CREATE INDEX IF NOT EXISTS idx_provider_trade_settlements_operation
  ON provider_trade_settlements(operation_id,created_at DESC);

INSERT INTO schema_migrations(version)
VALUES ('034_provider_settlement_operation_reuse')
ON CONFLICT(version) DO NOTHING;

COMMIT;
