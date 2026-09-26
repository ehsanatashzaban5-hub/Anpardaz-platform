BEGIN;

ALTER TABLE topup_requests
  ADD COLUMN IF NOT EXISTS request_fingerprint TEXT;

INSERT INTO schema_migrations(version)
VALUES ('028_topup_request_fingerprint')
ON CONFLICT(version) DO NOTHING;

COMMIT;
