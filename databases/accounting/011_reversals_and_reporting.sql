BEGIN;

CREATE TABLE IF NOT EXISTS journal_reversals (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  original_transaction_id BIGINT NOT NULL UNIQUE REFERENCES journal_transactions(id) ON DELETE RESTRICT,
  reversal_transaction_id BIGINT NOT NULL UNIQUE REFERENCES journal_transactions(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_hold_reference ON ledger_holds(reference_type,reference_id) WHERE status='active';
CREATE INDEX IF NOT EXISTS idx_journal_entries_currency ON journal_entries(currency,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reversals_original ON journal_reversals(original_transaction_id);

INSERT INTO schema_migrations(version) VALUES('004_reversals_and_reporting') ON CONFLICT(version) DO NOTHING;
COMMIT;
