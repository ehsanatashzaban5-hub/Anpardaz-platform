BEGIN;

-- Device-session hardening. Session tokens are stored only as SHA-256 hashes.
ALTER TABLE device_security_sessions
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_device_security_sessions_active
  ON device_security_sessions(customer_id, expires_at)
  WHERE revoked_at IS NULL;

INSERT INTO schema_migrations(version)
VALUES ('025_device_security_session_hardening')
ON CONFLICT(version) DO NOTHING;

COMMIT;
