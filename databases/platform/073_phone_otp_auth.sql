BEGIN;

ALTER TABLE platform_users ADD COLUMN IF NOT EXISTS phone TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_users_phone ON platform_users(phone) WHERE phone IS NOT NULL;

CREATE TABLE IF NOT EXISTS phone_otp_challenges (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_phone_otp_phone_created ON phone_otp_challenges(phone,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phone_otp_expiry ON phone_otp_challenges(expires_at);

INSERT INTO schema_migrations(version)
VALUES ('073_phone_otp_auth')
ON CONFLICT(version) DO NOTHING;

COMMIT;
