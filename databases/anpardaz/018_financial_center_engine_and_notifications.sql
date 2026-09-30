-- Retired: Financial Center is owned by the independent financial database.
BEGIN;
INSERT INTO schema_migrations(version) VALUES ('018_financial_center_engine_and_notifications') ON CONFLICT(version) DO NOTHING;
COMMIT;
