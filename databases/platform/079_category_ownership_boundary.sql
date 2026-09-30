BEGIN;

-- Platform owns only shared Web content/forum taxonomy.
-- Legacy Market/Banner category rows may still exist during controlled data migration,
-- so the constraint is intentionally NOT VALID: it blocks new cross-domain rows
-- without failing an existing production database.
ALTER TABLE categories
  DROP CONSTRAINT IF EXISTS categories_category_type_check;

ALTER TABLE categories
  ADD CONSTRAINT categories_platform_category_type_check
  CHECK (category_type IN ('forum','content'))
  NOT VALID;

INSERT INTO schema_migrations(version)
VALUES ('079_category_ownership_boundary')
ON CONFLICT(version) DO NOTHING;

COMMIT;
