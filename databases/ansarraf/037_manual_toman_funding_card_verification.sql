BEGIN;

ALTER TABLE deposits
  ADD COLUMN IF NOT EXISTS funding_source TEXT NOT NULL DEFAULT 'manual'
    CHECK (funding_source IN ('manual','provider')),
  ADD COLUMN IF NOT EXISTS source_card_last4 CHAR(4),
  ADD COLUMN IF NOT EXISTS source_card_provider_reference TEXT,
  ADD COLUMN IF NOT EXISTS source_card_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_actor_identity_id TEXT,
  ADD COLUMN IF NOT EXISTS accounting_operation_id TEXT;

CREATE INDEX IF NOT EXISTS idx_deposits_source_card_ref
  ON deposits(source_card_provider_reference)
  WHERE source_card_provider_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deposits_admin_review
  ON deposits(status, funding_source, created_at DESC);

INSERT INTO schema_migrations(version)
VALUES ('036_manual_toman_funding_card_verification')
ON CONFLICT(version) DO NOTHING;

COMMIT;