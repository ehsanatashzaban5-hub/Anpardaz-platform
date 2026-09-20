BEGIN;

ALTER TABLE transfer_requests
  ADD COLUMN IF NOT EXISTS operation_id UUID;

ALTER TABLE topup_requests
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

ALTER TABLE topup_requests
  ADD COLUMN IF NOT EXISTS operation_id UUID;

-- Top-up idempotency was already enforced in the API contract but the
-- original table did not persist the key. Scope it to the customer.
CREATE UNIQUE INDEX IF NOT EXISTS uq_topup_customer_idempotency
  ON topup_requests(customer_id,idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_transfer_operation_id
  ON transfer_requests(operation_id)
  WHERE operation_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_topup_operation_id
  ON topup_requests(operation_id)
  WHERE operation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transfer_operation_id
  ON transfer_requests(operation_id)
  WHERE operation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_topup_operation_id
  ON topup_requests(operation_id)
  WHERE operation_id IS NOT NULL;

INSERT INTO schema_migrations(version)
VALUES ('012_operation_and_idempotency')
ON CONFLICT(version) DO NOTHING;

COMMIT;
