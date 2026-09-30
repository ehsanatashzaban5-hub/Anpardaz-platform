-- Retired: Financial Center is owned by the independent financial database.
BEGIN;
INSERT INTO schema_migrations(version) VALUES ('017_financial_center_production') ON CONFLICT(version) DO NOTHING;
COMMIT;
