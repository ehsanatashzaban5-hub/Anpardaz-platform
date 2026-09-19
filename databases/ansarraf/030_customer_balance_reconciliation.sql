BEGIN;

CREATE TABLE IF NOT EXISTS customer_balance_reconciliations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  run_id BIGINT NOT NULL REFERENCES reconciliation_runs(id),
  asset_symbol TEXT NOT NULL,
  wallet_total NUMERIC(36,18) NOT NULL DEFAULT 0,
  accounting_liability NUMERIC(36,18) NOT NULL DEFAULT 0,
  difference NUMERIC(36,18) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('OK','WARNING','CRITICAL')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(run_id,asset_symbol)
);

CREATE INDEX IF NOT EXISTS idx_customer_balance_reconciliations_asset
  ON customer_balance_reconciliations(asset_symbol,created_at DESC);

INSERT INTO schema_migrations(version)
VALUES ('030_customer_balance_reconciliation')
ON CONFLICT(version) DO NOTHING;

COMMIT;
