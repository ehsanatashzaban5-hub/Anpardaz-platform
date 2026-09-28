BEGIN;

CREATE TABLE IF NOT EXISTS cashback_policies (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  service_code TEXT NOT NULL,
  rate_bps INTEGER NOT NULL CHECK (rate_bps >= 0 AND rate_bps <= 10000),
  currency TEXT NOT NULL DEFAULT 'IRR',
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (effective_to IS NULL OR effective_to > effective_from)
);
CREATE INDEX IF NOT EXISTS idx_cashback_policies_lookup
  ON cashback_policies(service_code, currency, enabled, effective_from DESC);

CREATE TABLE IF NOT EXISTS cashback_rewards (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  operation_id TEXT NOT NULL,
  service_code TEXT NOT NULL,
  base_amount NUMERIC(38,18) NOT NULL CHECK (base_amount > 0),
  rate_bps INTEGER NOT NULL CHECK (rate_bps >= 0 AND rate_bps <= 10000),
  reward_amount NUMERIC(38,18) NOT NULL CHECK (reward_amount > 0),
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'accrued'
    CHECK (status IN ('accrued','redeemed','reversed','manual_review')),
  accounting_reference TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, operation_id)
);
CREATE INDEX IF NOT EXISTS idx_cashback_rewards_customer
  ON cashback_rewards(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cashback_rewards_status
  ON cashback_rewards(status, created_at DESC);

INSERT INTO schema_migrations(version)
VALUES ('031_cashback_rewards')
ON CONFLICT(version) DO NOTHING;

COMMIT;
