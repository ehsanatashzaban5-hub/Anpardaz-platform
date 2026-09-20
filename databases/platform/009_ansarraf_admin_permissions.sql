BEGIN;

-- Operational permissions required by the An Sarraf admin control plane.
-- Keep the historical 008 migration immutable; additive permissions belong here.
INSERT INTO admin_permissions(role,permission) VALUES
('super_admin','service_health.read'),
('super_admin','users.read'),
('super_admin','operations.read'),
('super_admin','approvals.write'),
('super_admin','reconciliation.write'),
('admin','service_health.read'),
('admin','operations.read'),
('admin','approvals.write'),
('admin','reconciliation.write'),
('operator','service_health.read'),
('operator','operations.read'),
('operator','approvals.write'),
('operator','reconciliation.write')
ON CONFLICT(role,permission) DO NOTHING;

INSERT INTO schema_migrations(version)
VALUES ('009_ansarraf_admin_permissions')
ON CONFLICT(version) DO NOTHING;

COMMIT;
