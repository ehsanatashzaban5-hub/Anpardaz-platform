BEGIN;

CREATE TABLE IF NOT EXISTS reconciliation_runs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  scope TEXT NOT NULL,
  provider_code TEXT,
  status TEXT NOT NULL CHECK (status IN ('RUNNING','OK','WARNING','CRITICAL','FAILED')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS provider_balance_reconciliations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  run_id BIGINT NOT NULL REFERENCES reconciliation_runs(id),
  provider_code TEXT NOT NULL,
  asset_symbol TEXT NOT NULL,
  provider_available NUMERIC(36,18) NOT NULL DEFAULT 0,
  provider_locked NUMERIC(36,18) NOT NULL DEFAULT 0,
  provider_total NUMERIC(36,18) NOT NULL DEFAULT 0,
  accounting_balance NUMERIC(36,18),
  difference NUMERIC(36,18),
  status TEXT NOT NULL CHECK (status IN ('OK','WARNING','CRITICAL','MISSING_ACCOUNT','PROVIDER_UNAVAILABLE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(run_id,provider_code,asset_symbol)
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_scope
  ON reconciliation_runs(scope,started_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_balance_reconciliations_asset
  ON provider_balance_reconciliations(provider_code,asset_symbol,created_at DESC);

INSERT INTO schema_migrations(version)
VALUES ('029_provider_balance_reconciliation')
ON CONFLICT(version) DO NOTHING;

COMMIT;
