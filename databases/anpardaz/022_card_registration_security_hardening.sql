BEGIN;

-- Final card-registration hardening.
-- No PAN/CVV/OTP is persisted. Provider token/reference + last4 + keyed fingerprint only.
ALTER TABLE card_registration_sessions
  ADD COLUMN IF NOT EXISTS request_ip INET,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS callback_received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS callback_attempts INTEGER NOT NULL DEFAULT 0;

ALTER TABLE cards
  ADD CONSTRAINT cards_verified_requires_identity_match
  CHECK (registration_status <> 'verified' OR holder_identity_match = TRUE) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_card_registration_provider_status
  ON card_registration_sessions(provider,status,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_card_registration_state_expiry
  ON card_registration_sessions(state,expires_at);

INSERT INTO schema_migrations(version)
VALUES ('022_card_registration_security_hardening')
ON CONFLICT(version) DO NOTHING;

COMMIT;
