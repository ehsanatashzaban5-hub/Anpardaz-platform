BEGIN;
ALTER TABLE banner_profiles ADD COLUMN IF NOT EXISTS avatar_data BYTEA;
ALTER TABLE banner_profiles ADD COLUMN IF NOT EXISTS avatar_mime TEXT;
INSERT INTO schema_migrations(version) VALUES('004_profile_media') ON CONFLICT(version) DO NOTHING;
COMMIT;
