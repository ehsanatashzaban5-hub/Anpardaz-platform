BEGIN;

ALTER TABLE card_registration_sessions
  DROP CONSTRAINT IF EXISTS card_registration_sessions_status_check;

ALTER TABLE card_registration_sessions
  ADD CONSTRAINT card_registration_sessions_status_check
  CHECK (status IN ('pending','processing','verified','rejected','expired','cancelled','error'));

ALTER TABLE card_registration_sessions
  ADD COLUMN IF NOT EXISTS callback_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS callback_received_at TIMESTAMPTZ;

ALTER TABLE card_registration_sessions
  DROP CONSTRAINT IF EXISTS card_registration_sessions_callback_attempts_check;

ALTER TABLE card_registration_sessions
  ADD CONSTRAINT card_registration_sessions_callback_attempts_check CHECK (callback_attempts >= 0);

CREATE INDEX IF NOT EXISTS idx_card_registration_processing
  ON card_registration_sessions(status, updated_at)
  WHERE status='processing';

INSERT INTO schema_migrations(version)
VALUES ('020_shaparak_callback_integrity')
ON CONFLICT(version) DO NOTHING;

COMMIT;
