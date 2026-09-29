BEGIN;

CREATE TABLE IF NOT EXISTS security_rate_limits (
  scope TEXT NOT NULL,
  key_hash CHAR(64) NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  PRIMARY KEY (scope, key_hash, window_start)
);

CREATE INDEX IF NOT EXISTS idx_security_rate_limits_window
  ON security_rate_limits(window_start);

INSERT INTO schema_migrations(version)
VALUES ('032_security_rate_limits')
ON CONFLICT(version) DO NOTHING;

COMMIT;
