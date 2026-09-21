BEGIN;

-- Manual settlement workflow: no automatic bank/provider transfer is implied.
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS deposit_method TEXT NOT NULL DEFAULT 'manual' CHECK (deposit_method IN ('manual','provider'));
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS user_reference_code CHAR(10);
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS sender_card_number TEXT;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS review_note TEXT;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS accounting_operation_id TEXT;

ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS withdrawal_method TEXT NOT NULL DEFAULT 'manual' CHECK (withdrawal_method IN ('manual','provider'));
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS review_note TEXT;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS accounting_operation_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_deposits_user_reference_code
  ON deposits(user_reference_code)
  WHERE user_reference_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deposits_manual_review
  ON deposits(status,deposit_method,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_manual_review
  ON withdrawals(status,withdrawal_method,created_at DESC);

-- KYC media is stored as private object references, never as public URLs or raw blobs.
ALTER TABLE kyc_profiles ADD COLUMN IF NOT EXISTS national_id_image_object_key TEXT;
ALTER TABLE kyc_profiles ADD COLUMN IF NOT EXISTS identity_video_object_key TEXT;
ALTER TABLE kyc_profiles ADD COLUMN IF NOT EXISTS media_uploaded_at TIMESTAMPTZ;
ALTER TABLE kyc_profiles ADD COLUMN IF NOT EXISTS media_reviewed_at TIMESTAMPTZ;
ALTER TABLE kyc_profiles ADD COLUMN IF NOT EXISTS media_review_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (media_review_status IN ('pending','approved','rejected'));
ALTER TABLE kyc_profiles ADD COLUMN IF NOT EXISTS media_review_reason TEXT;
ALTER TABLE kyc_profiles ADD COLUMN IF NOT EXISTS media_reviewed_by TEXT;

CREATE TABLE IF NOT EXISTS manual_funding_review_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('deposit','withdrawal','kyc_media')),
  entity_id BIGINT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approve','reject','request_changes','mark_paid')),
  actor_id TEXT NOT NULL,
  note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_manual_review_events_entity
  ON manual_funding_review_events(entity_type,entity_id,created_at DESC);

INSERT INTO schema_migrations(version)
VALUES ('011_manual_funding_and_kyc_media')
ON CONFLICT(version) DO NOTHING;

COMMIT;
