-- Retired: Financial Center is owned by the independent financial database.
BEGIN;
INSERT INTO schema_migrations(version) VALUES ('030_financial_center_accounting_reconciliation') ON CONFLICT(version) DO NOTHING;
COMMIT;
