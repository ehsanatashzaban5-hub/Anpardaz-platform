BEGIN;

ALTER TABLE platform_user_settings
  ADD COLUMN IF NOT EXISTS home_services JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS home_platforms JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS show_cashback BOOLEAN NOT NULL DEFAULT TRUE;

INSERT INTO schema_migrations(version)
VALUES ('074_home_service_preferences')
ON CONFLICT(version) DO NOTHING;

COMMIT;
