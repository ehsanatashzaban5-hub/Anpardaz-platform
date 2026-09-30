BEGIN;
ALTER TABLE content_sources ADD COLUMN IF NOT EXISTS rights_status TEXT NOT NULL DEFAULT 'review_required' CHECK(rights_status IN ('review_required','licensed','allowed','blocked'));
CREATE INDEX IF NOT EXISTS idx_content_sources_enabled_rights ON content_sources(enabled,rights_status,category);
UPDATE content_sources SET rights_status='review_required' WHERE rights_status IS NULL OR rights_status NOT IN ('licensed','allowed','blocked');
INSERT INTO schema_migrations(version) VALUES('078_content_source_rights') ON CONFLICT(version) DO NOTHING;
COMMIT;