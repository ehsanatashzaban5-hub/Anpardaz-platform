BEGIN;

INSERT INTO admin_permissions(role,permission) VALUES
  ('super_admin','users.read'),
  ('super_admin','operations.read'),
  ('admin','users.read'),
  ('admin','operations.read'),
  ('operator','users.read'),
  ('operator','operations.read')
ON CONFLICT(role,permission) DO NOTHING;

INSERT INTO schema_migrations(version)
VALUES ('010_anpardaz_admin_permissions')
ON CONFLICT(version) DO NOTHING;

COMMIT;
