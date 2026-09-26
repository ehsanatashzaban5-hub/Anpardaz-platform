BEGIN;

ALTER TABLE card_balance_checks
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS request_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS uq_card_balance_customer_idempotency
  ON card_balance_checks(customer_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE card_registration_sessions
  DROP CONSTRAINT IF EXISTS card_registration_sessions_status_check;

ALTER TABLE card_registration_sessions
  ADD CONSTRAINT card_registration_sessions_status_check
  CHECK (status IN ('pending','processing','verified','rejected','expired','cancelled','error'));

CREATE INDEX IF NOT EXISTS idx_card_balance_idempotency
  ON card_balance_checks(customer_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

INSERT INTO schema_migrations(version)
VALUES ('026_banking_and_card_callback_hardening')
ON CONFLICT(version) DO NOTHING;

COMMIT;
