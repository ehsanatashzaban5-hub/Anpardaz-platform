BEGIN;

CREATE TABLE IF NOT EXISTS finnotech_oauth_states (
  state TEXT PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  redirect_uri TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finnotech_oauth_states_expiry ON finnotech_oauth_states(expires_at);

CREATE TABLE IF NOT EXISTS finnotech_connections (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  provider TEXT NOT NULL DEFAULT 'FINNOTECH',
  client_id TEXT,
  bank_code TEXT,
  provider_account_id TEXT,
  provider_subject TEXT,
  access_token_enc TEXT,
  refresh_token_enc TEXT,
  access_token_expires_at TIMESTAMPTZ,
  scope TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','expired','revoked','error')),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, provider, bank_code)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_finnotech_customer_provider_bank
  ON finnotech_connections(customer_id,provider,COALESCE(bank_code,''));

CREATE INDEX IF NOT EXISTS idx_finnotech_connections_customer
  ON finnotech_connections(customer_id, status);

ALTER TABLE transfer_requests
  ADD COLUMN IF NOT EXISTS provider_code TEXT,
  ADD COLUMN IF NOT EXISTS provider_operation_id TEXT,
  ADD COLUMN IF NOT EXISTS external_reference TEXT,
  ADD COLUMN IF NOT EXISTS provider_status TEXT,
  ADD COLUMN IF NOT EXISTS accounting_status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE topup_requests
  ADD COLUMN IF NOT EXISTS provider_code TEXT,
  ADD COLUMN IF NOT EXISTS provider_operation_id TEXT,
  ADD COLUMN IF NOT EXISTS accounting_status TEXT NOT NULL DEFAULT 'pending';

INSERT INTO schema_migrations(version)
VALUES ('015_finnotech_connections')
ON CONFLICT(version) DO NOTHING;

COMMIT;
