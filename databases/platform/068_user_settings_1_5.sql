BEGIN;

CREATE TABLE IF NOT EXISTS user_settings (
  identity_id UUID PRIMARY KEY,
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark','light')),
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  keyboard_sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  font_scale SMALLINT NOT NULL DEFAULT 0 CHECK (font_scale BETWEEN 0 AND 10),
  pin_hash TEXT,
  pin_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  pin_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_updated_at ON user_settings(updated_at);

INSERT INTO schema_migrations(version)
VALUES ('068_user_settings_1_5')
ON CONFLICT (version) DO NOTHING;

COMMIT;
