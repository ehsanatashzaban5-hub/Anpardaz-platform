BEGIN;

ALTER TABLE provider_orders
  ADD COLUMN IF NOT EXISTS operation_id TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS executed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE INDEX IF NOT EXISTS idx_provider_orders_operation_id ON provider_orders(operation_id);
CREATE INDEX IF NOT EXISTS idx_provider_orders_provider_order_id ON provider_orders(provider_id,provider_order_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_provider_orders_idempotency
  ON provider_orders(provider_id,idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE quote_locks
  ADD COLUMN IF NOT EXISTS consumed_by_operation_id TEXT,
  ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_quote_lock_order
  ON quote_locks(order_id)
  WHERE status='ACTIVE';

CREATE INDEX IF NOT EXISTS idx_quote_locks_customer_active
  ON quote_locks(customer_id,status,expires_at);

CREATE TABLE IF NOT EXISTS provider_execution_outbox (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider_order_id BIGINT NOT NULL REFERENCES provider_orders(id),
  event_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','posted','failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts>=0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processing_started_at TIMESTAMPTZ,
  last_error TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_execution_outbox_pick
  ON provider_execution_outbox(status,available_at,id);

INSERT INTO schema_migrations(version)
VALUES ('024_provider_execution_hardening')
ON CONFLICT(version) DO NOTHING;

COMMIT;
