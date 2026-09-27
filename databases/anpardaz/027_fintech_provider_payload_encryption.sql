BEGIN;

ALTER TABLE fintech_service_operations
  ADD COLUMN IF NOT EXISTS provider_payload_enc TEXT;

INSERT INTO schema_migrations(version)
VALUES ('027_fintech_provider_payload_encryption')
ON CONFLICT(version) DO NOTHING;

COMMIT;
