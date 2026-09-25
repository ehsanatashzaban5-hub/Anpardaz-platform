BEGIN;

ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'SHAPARAK',
  ADD COLUMN IF NOT EXISTS registration_status TEXT NOT NULL DEFAULT 'legacy'
    CHECK (registration_status IN ('legacy','pending','verified','rejected','revoked')),
  ADD COLUMN IF NOT EXISTS provider_reference TEXT,
  ADD COLUMN IF NOT EXISTS pan_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS holder_identity_match BOOLEAN,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS registration_session_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_cards_provider_reference
  ON cards(provider, provider_reference)
  WHERE provider_reference IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_cards_customer_pan_fingerprint
  ON cards(customer_id, pan_fingerprint)
  WHERE pan_fingerprint IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cards_pan_fingerprint
  ON cards(pan_fingerprint);

CREATE TABLE IF NOT EXISTS card_registration_sessions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'SHAPARAK',
  state TEXT NOT NULL UNIQUE,
  redirect_uri TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','verified','rejected','expired','cancelled','error')),
  provider_reference TEXT,
  card_last4 CHAR(4),
  bank_name TEXT,
  holder_identity_match BOOLEAN,
  provider_status TEXT,
  callback_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_card_registration_customer_created
  ON card_registration_sessions(customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_card_registration_expiry
  ON card_registration_sessions(expires_at);

INSERT INTO schema_migrations(version)
VALUES ('019_card_registration_shaparak')
ON CONFLICT(version) DO NOTHING;

COMMIT;
