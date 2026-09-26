CREATE TABLE IF NOT EXISTS device_security_sessions (
  token_hash TEXT PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_device_security_sessions_customer
  ON device_security_sessions(customer_id);
