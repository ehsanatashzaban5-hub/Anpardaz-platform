BEGIN;

CREATE TABLE IF NOT EXISTS finnotech_service_operations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  service_code TEXT NOT NULL,
  operation_id TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing','completed','failed','manual_review')),
  provider_reference TEXT,
  provider_status TEXT,
  request_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_data JSONB,
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, service_code, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_finnotech_service_operations_customer
  ON finnotech_service_operations(customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_finnotech_service_operations_service_status
  ON finnotech_service_operations(service_code, status, created_at DESC);

INSERT INTO schema_migrations(version)
VALUES ('017_finnotech_service_operations')
ON CONFLICT(version) DO NOTHING;

COMMIT;
