BEGIN;

ALTER TABLE provider_deposit_events
  DROP CONSTRAINT IF EXISTS provider_deposit_events_status_check;

ALTER TABLE provider_deposit_events
  ADD CONSTRAINT provider_deposit_events_status_check
  CHECK(status IN ('detected','confirmed','credited','manual_review','rejected','accounting_pending'));

CREATE INDEX IF NOT EXISTS idx_provider_deposit_events_accounting_pending
  ON provider_deposit_events(status,detected_at)
  WHERE status='accounting_pending';

INSERT INTO schema_migrations(version)
VALUES ('040_crypto_deposit_accounting_outbox')
ON CONFLICT(version) DO NOTHING;

COMMIT;
