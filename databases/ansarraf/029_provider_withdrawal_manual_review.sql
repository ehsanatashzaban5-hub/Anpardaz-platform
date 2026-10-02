BEGIN;
ALTER TABLE provider_withdrawal_outbox DROP CONSTRAINT IF EXISTS provider_withdrawal_outbox_status_check;
ALTER TABLE provider_withdrawal_outbox ADD CONSTRAINT provider_withdrawal_outbox_status_check
  CHECK (status IN ('pending','processing','posted','failed','manual_review'));
INSERT INTO schema_migrations(version)
VALUES ('028_provider_withdrawal_manual_review')
ON CONFLICT(version) DO NOTHING;
COMMIT;
