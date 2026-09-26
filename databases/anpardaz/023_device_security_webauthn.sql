BEGIN;

-- Device security gate for An Pardaz protected services.
CREATE TABLE IF NOT EXISTS device_security_credentials (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key BYTEA NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  transports TEXT[] NOT NULL DEFAULT '{}',
  device_type TEXT,
  backed_up BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_device_security_credentials_customer
  ON device_security_credentials(customer_id);

CREATE TABLE IF NOT EXISTS device_security_challenges (
  customer_id BIGINT PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('registration','authentication')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS device_security_sessions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_device_security_sessions_customer
  ON device_security_sessions(customer_id, expires_at DESC);

INSERT INTO schema_migrations(version)
VALUES ('023_device_security_webauthn')
ON CONFLICT(version) DO NOTHING;

COMMIT;
