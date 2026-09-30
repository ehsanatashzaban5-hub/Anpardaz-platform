BEGIN;

-- Retired: Market, Banner and Financial Center relationship integrity belongs
-- to their owning databases. The old Platform triggers referenced tables that
-- are intentionally no longer present in the Platform database.

INSERT INTO schema_migrations(version)
VALUES ('026_ecosystem_relationship_integrity')
ON CONFLICT(version) DO NOTHING;

COMMIT;
