BEGIN;

INSERT INTO admin_permissions(role,permission) VALUES
('admin','operations.read'),
('super_admin','operations.read'),
('operator','operations.read')
ON CONFLICT(role,permission) DO NOTHING;

INSERT INTO schema_migrations(version)
VALUES ('029_operation_trace_permissions')
ON CONFLICT(version) DO NOTHING;

COMMIT;
