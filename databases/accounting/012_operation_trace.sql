BEGIN;

ALTER TABLE journal_transactions
  ADD COLUMN IF NOT EXISTS operation_id TEXT;

CREATE INDEX IF NOT EXISTS idx_journal_transactions_operation_id
  ON journal_transactions(operation_id,created_at DESC);

INSERT INTO schema_migrations(version)
VALUES ('009_operation_trace')
ON CONFLICT(version) DO NOTHING;

COMMIT;
