BEGIN;

ALTER TABLE fintech_service_operations
  ADD COLUMN IF NOT EXISTS provider_payload_enc TEXT;

ALTER TABLE transfer_requests
  DROP CONSTRAINT IF EXISTS transfer_requests_status_check;
ALTER TABLE transfer_requests
  ADD CONSTRAINT transfer_requests_status_check
  CHECK (status IN ('pending','processing','completed','failed','cancelled','reversed','manual_review'));

ALTER TABLE topup_requests
  DROP CONSTRAINT IF EXISTS topup_requests_status_check;
ALTER TABLE topup_requests
  ADD CONSTRAINT topup_requests_status_check
  CHECK (status IN ('pending','processing','completed','failed','cancelled','manual_review'));

CREATE OR REPLACE FUNCTION validate_transfer_status_transition()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status <> OLD.status AND NOT (
    (OLD.status='pending' AND NEW.status IN ('processing','cancelled','failed','manual_review')) OR
    (OLD.status='processing' AND NEW.status IN ('completed','failed','reversed','manual_review')) OR
    (OLD.status='completed' AND NEW.status='reversed')
  ) THEN
    RAISE EXCEPTION 'invalid_transfer_status_transition:%->%', OLD.status, NEW.status;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION validate_topup_status_transition()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status <> OLD.status AND NOT (
    (OLD.status='pending' AND NEW.status IN ('processing','cancelled','failed','manual_review')) OR
    (OLD.status='processing' AND NEW.status IN ('completed','failed','cancelled','manual_review'))
  ) THEN
    RAISE EXCEPTION 'invalid_topup_status_transition:%->%', OLD.status, NEW.status;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END; $$;

INSERT INTO schema_migrations(version)
VALUES ('029_fintech_payload_encryption_and_banking_reconciliation')
ON CONFLICT(version) DO NOTHING;

COMMIT;
