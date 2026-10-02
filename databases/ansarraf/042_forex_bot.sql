BEGIN;

CREATE TABLE IF NOT EXISTS forex_bot_accounts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL UNIQUE REFERENCES customers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (status IN ('inactive','activation_pending','active','deactivation_pending')),
  investment_amount NUMERIC(36,18) NOT NULL DEFAULT 0 CHECK (investment_amount >= 0 AND investment_amount <= 30),
  total_pnl NUMERIC(36,18) NOT NULL DEFAULT 0,
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  version BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forex_bot_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES forex_bot_accounts(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('activate','deactivate')),
  requested_amount NUMERIC(36,18) CHECK (requested_amount IS NULL OR (requested_amount > 0 AND requested_amount <= 30)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  idempotency_key TEXT NOT NULL UNIQUE,
  user_note TEXT,
  admin_identity_id UUID,
  admin_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS forex_bot_pnl_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES forex_bot_accounts(id) ON DELETE RESTRICT,
  amount NUMERIC(36,18) NOT NULL CHECK (amount <> 0),
  source_reference TEXT NOT NULL,
  reason TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  admin_identity_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forex_bot_audit_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES forex_bot_accounts(id) ON DELETE RESTRICT,
  request_id BIGINT REFERENCES forex_bot_requests(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user','admin','system')),
  actor_identity_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forex_bot_requests_account_created ON forex_bot_requests(account_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forex_bot_requests_pending ON forex_bot_requests(status,created_at) WHERE status='pending';
CREATE INDEX IF NOT EXISTS idx_forex_bot_pnl_account_created ON forex_bot_pnl_events(account_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forex_bot_audit_account_created ON forex_bot_audit_events(account_id,created_at DESC);

INSERT INTO schema_migrations(version)
VALUES ('041_forex_bot')
ON CONFLICT(version) DO NOTHING;

COMMIT;