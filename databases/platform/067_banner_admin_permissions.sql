BEGIN;
INSERT INTO admin_permissions(role,permission) VALUES
('admin','banner.read'),('admin','banner.write'),
('super_admin','banner.read'),('super_admin','banner.write'),
('operator','banner.read'),('operator','banner.write'),
('support','banner.read'),('support','banner.write')
ON CONFLICT(role,permission) DO NOTHING;
INSERT INTO schema_migrations(version) VALUES('067_banner_admin_permissions') ON CONFLICT(version) DO NOTHING;
COMMIT;
