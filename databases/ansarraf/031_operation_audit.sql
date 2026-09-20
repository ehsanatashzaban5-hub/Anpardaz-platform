BEGIN;

CREATE TABLE IF NOT EXISTS operation_audit_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  operation_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('SYSTEM','USER','ADMIN','PROVIDER')),
  actor_id TEXT,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT,
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  previous_hash TEXT,
  event_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_hash)
);

CREATE INDEX IF NOT EXISTS idx_operation_audit_events_operation
  ON operation_audit_events(operation_id,created_at,id);
CREATE INDEX IF NOT EXISTS idx_operation_audit_events_aggregate
  ON operation_audit_events(aggregate_type,aggregate_id,created_at DESC);

INSERT INTO schema_migrations(version)
VALUES ('031_operation_audit')
ON CONFLICT(version) DO NOTHING;

COMMIT;
