CREATE TABLE IF NOT EXISTS admin_permissions(role TEXT NOT NULL,permission TEXT NOT NULL,PRIMARY KEY(role,permission));
INSERT INTO admin_permissions(role,permission) VALUES
('admin','*'),('super_admin','*'),('operator','operations.read'),('operator','approvals.write'),('support','operations.read'),('editor','operations.read')
ON CONFLICT DO NOTHING;

INSERT INTO schema_migrations(version) VALUES ('005_admin_permissions') ON CONFLICT(version) DO NOTHING;
