BEGIN;

CREATE TABLE IF NOT EXISTS fintech_service_operations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  service_code TEXT NOT NULL,
  operation_id TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','failed','reversed','manual_review')),
  provider_code TEXT,
  provider_operation_id TEXT,
  external_reference TEXT,
  accounting_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (accounting_status IN ('pending','posted','failed','not_required')),
  failure_code TEXT,
  failure_message TEXT,
  request_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(customer_id,idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_fintech_ops_customer_created
  ON fintech_service_operations(customer_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fintech_ops_status_created
  ON fintech_service_operations(status,created_at);
CREATE INDEX IF NOT EXISTS idx_fintech_ops_service_created
  ON fintech_service_operations(service_code,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fintech_ops_provider_operation
  ON fintech_service_operations(provider_code,provider_operation_id)
  WHERE provider_operation_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS fintech_provider_outbox (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  operation_id TEXT NOT NULL REFERENCES fintech_service_operations(operation_id),
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','failed','manual_review')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(operation_id,event_type)
);

CREATE INDEX IF NOT EXISTS idx_fintech_outbox_due
  ON fintech_provider_outbox(status,next_attempt_at);

INSERT INTO schema_migrations(version)
VALUES ('014_fintech_service_operations')
ON CONFLICT(version) DO NOTHING;

COMMIT;
