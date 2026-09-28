BEGIN;

ALTER TABLE financial_card_transactions
  ADD COLUMN IF NOT EXISTS accounting_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (accounting_status IN ('pending','posted','failed')),
  ADD COLUMN IF NOT EXISTS accounting_reference TEXT,
  ADD COLUMN IF NOT EXISTS accounting_error TEXT,
  ADD COLUMN IF NOT EXISTS accounting_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_financial_card_tx_accounting_status
  ON financial_card_transactions(accounting_status, accounting_updated_at);

INSERT INTO schema_migrations(version)
VALUES ('030_financial_center_accounting_reconciliation')
ON CONFLICT(version) DO NOTHING;

COMMIT;
