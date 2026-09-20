BEGIN;

CREATE TABLE IF NOT EXISTS operation_reconciliation_evidence (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  operation_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('OK','WARNING','CRITICAL')),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_operation_reconciliation_evidence_status
  ON operation_reconciliation_evidence(status,checked_at DESC);

INSERT INTO schema_migrations(version)
VALUES ('032_operation_reconciliation_evidence')
ON CONFLICT(version) DO NOTHING;

COMMIT;
