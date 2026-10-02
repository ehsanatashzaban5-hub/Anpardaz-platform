BEGIN;

CREATE TABLE IF NOT EXISTS solvency_reconciliation_evidence (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  run_id BIGINT NOT NULL REFERENCES reconciliation_runs(id),
  asset_symbol TEXT NOT NULL,
  controlled_provider_total NUMERIC(36,18) NOT NULL DEFAULT 0,
  customer_liability NUMERIC(36,18) NOT NULL DEFAULT 0,
  coverage_difference NUMERIC(36,18) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('OK','WARNING','CRITICAL')),
  coverage_scope TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(run_id,asset_symbol)
);

CREATE INDEX IF NOT EXISTS idx_solvency_reconciliation_asset
  ON solvency_reconciliation_evidence(asset_symbol,created_at DESC);

INSERT INTO schema_migrations(version)
VALUES ('033_solvency_reconciliation_evidence')
ON CONFLICT(version) DO NOTHING;

COMMIT;
