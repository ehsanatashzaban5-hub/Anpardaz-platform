-- Retired: Financial Center is owned by the independent financial database.
BEGIN;
INSERT INTO schema_migrations(version) VALUES ('016_finnotech_connections') ON CONFLICT(version) DO NOTHING;
COMMIT;
