BEGIN;

CREATE TABLE IF NOT EXISTS user_settings (
  identity_id UUID PRIMARY KEY,
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark','light')),
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  keyboard_sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  font_scale SMALLINT NOT NULL DEFAULT 0 CHECK (font_scale BETWEEN 0 AND 10),
  pin_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  pin_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_settings_pin_consistency CHECK (
    (pin_enabled = TRUE AND pin_hash IS NOT NULL) OR
    (pin_enabled = FALSE AND pin_hash IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_user_settings_updated_at ON user_settings(updated_at);

CREATE OR REPLACE FUNCTION touch_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_settings_updated_at ON user_settings;
CREATE TRIGGER trg_user_settings_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW EXECUTE FUNCTION touch_user_settings_updated_at();

INSERT INTO schema_migrations(version) VALUES ('068_user_settings_1_5')
ON CONFLICT (version) DO NOTHING;

COMMIT;
