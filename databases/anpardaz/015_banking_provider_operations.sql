BEGIN;

ALTER TABLE transfer_requests
  ADD COLUMN IF NOT EXISTS provider_code TEXT,
  ADD COLUMN IF NOT EXISTS provider_operation_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_reference TEXT,
  ADD COLUMN IF NOT EXISTS provider_status TEXT,
  ADD COLUMN IF NOT EXISTS provider_error_code TEXT,
  ADD COLUMN IF NOT EXISTS provider_error_message TEXT,
  ADD COLUMN IF NOT EXISTS provider_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE topup_requests
  ADD COLUMN IF NOT EXISTS provider_operation_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_reference TEXT,
  ADD COLUMN IF NOT EXISTS provider_status TEXT,
  ADD COLUMN IF NOT EXISTS provider_error_code TEXT,
  ADD COLUMN IF NOT EXISTS provider_error_message TEXT,
  ADD COLUMN IF NOT EXISTS provider_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS card_balance_checks (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  card_id BIGINT REFERENCES cards(id),
  operation_id TEXT NOT NULL UNIQUE,
  card_last4 CHAR(4) NOT NULL,
  provider_code TEXT NOT NULL,
  provider_operation_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','processing','completed','failed','manual_review')),
  balance NUMERIC(24,8),
  currency CHAR(3),
  provider_reference TEXT,
  error_code TEXT,
  error_message TEXT,
  response_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_card_balance_checks_customer_created
  ON card_balance_checks(customer_id,created_at DESC);

CREATE TABLE IF NOT EXISTS banking_provider_outbox (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  operation_id TEXT NOT NULL,
  operation_type TEXT NOT NULL CHECK(operation_type IN ('transfer','card_balance','topup')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','processing','completed','failed','manual_review')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts >= 0),
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(operation_id,operation_type)
);

CREATE INDEX IF NOT EXISTS idx_banking_provider_outbox_due
  ON banking_provider_outbox(status,next_attempt_at);

CREATE INDEX IF NOT EXISTS idx_transfer_provider_reference
  ON transfer_requests(provider_code,provider_reference)
  WHERE provider_reference IS NOT NULL;

INSERT INTO schema_migrations(version)
VALUES('015_banking_provider_operations')
ON CONFLICT(version) DO NOTHING;

COMMIT;
