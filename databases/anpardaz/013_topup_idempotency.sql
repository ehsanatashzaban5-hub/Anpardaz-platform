BEGIN;

ALTER TABLE topup_requests
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_topup_customer_idempotency
  ON topup_requests(customer_id,idempotency_key)
  WHERE idempotency_key IS NOT NULL;

INSERT INTO schema_migrations(version)
VALUES ('013_topup_idempotency')
ON CONFLICT(version) DO NOTHING;

COMMIT;
