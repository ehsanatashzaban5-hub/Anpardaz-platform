BEGIN;

-- Retired: Financial Center category integrity is enforced by the Financial
-- service and Financial database, not by Platform.

INSERT INTO schema_migrations(version)
VALUES ('028_financial_category_integrity')
ON CONFLICT(version) DO NOTHING;

COMMIT;
