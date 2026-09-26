-- Device security gate for An Pardaz protected services.
CREATE TABLE IF NOT EXISTS device_security_credentials (
  id BIGSERIAL PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
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
  customer_id UUID PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('registration','authentication')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
