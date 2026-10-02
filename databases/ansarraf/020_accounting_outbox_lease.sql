BEGIN;

ALTER TABLE accounting_outbox
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_accounting_outbox_processing
  ON accounting_outbox(status,processing_started_at,id)
  WHERE status='processing';

INSERT INTO schema_migrations(version)
VALUES ('019_accounting_outbox_lease')
ON CONFLICT(version) DO NOTHING;

COMMIT;
