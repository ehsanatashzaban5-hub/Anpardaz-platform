BEGIN;

CREATE TABLE IF NOT EXISTS platform_user_settings (
  identity_id UUID PRIMARY KEY REFERENCES platform_users(identity_id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark','light')),
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  key_sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  font_scale SMALLINT NOT NULL DEFAULT 0 CHECK (font_scale BETWEEN 0 AND 10),
  pin_hash TEXT NULL,
  pin_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_user_settings_updated_at
  ON platform_user_settings(updated_at);

INSERT INTO schema_migrations(version)
VALUES ('068_user_settings')
ON CONFLICT(version) DO NOTHING;

COMMIT;
