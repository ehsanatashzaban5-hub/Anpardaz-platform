BEGIN;

ALTER TABLE transfer_requests ADD COLUMN IF NOT EXISTS operation_id TEXT;
ALTER TABLE topup_requests ADD COLUMN IF NOT EXISTS operation_id TEXT;

UPDATE transfer_requests
SET operation_id = gen_random_uuid()::text
WHERE operation_id IS NULL;

UPDATE topup_requests
SET operation_id = gen_random_uuid()::text
WHERE operation_id IS NULL;

ALTER TABLE transfer_requests ALTER COLUMN operation_id SET NOT NULL;
ALTER TABLE topup_requests ALTER COLUMN operation_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_transfer_operation_id ON transfer_requests(operation_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_topup_operation_id ON topup_requests(operation_id);
CREATE INDEX IF NOT EXISTS idx_transfer_operation_id ON transfer_requests(operation_id);
CREATE INDEX IF NOT EXISTS idx_topup_operation_id ON topup_requests(operation_id);

INSERT INTO schema_migrations(version)
VALUES ('012_operation_trace')
ON CONFLICT(version) DO NOTHING;

COMMIT;
