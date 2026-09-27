BEGIN;
INSERT INTO admin_permissions(role,permission) VALUES
('super_admin','ansarraf_fees.write'),
('admin','ansarraf_fees.write')
ON CONFLICT(role,permission) DO NOTHING;
INSERT INTO schema_migrations(version)
VALUES ('074_ansarraf_fee_admin_permission')
ON CONFLICT(version) DO NOTHING;
COMMIT;
