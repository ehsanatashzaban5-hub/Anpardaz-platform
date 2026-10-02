BEGIN;

-- Fee schedules are data, not hard-coded application constants.
CREATE TABLE IF NOT EXISTS provider_fee_rules (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider_code TEXT NOT NULL,
  asset_symbol TEXT,
  market_symbol TEXT,
  side TEXT CHECK (side IN ('buy','sell')),
  maker_rate NUMERIC(24,12) NOT NULL DEFAULT 0 CHECK (maker_rate >= 0),
  taker_rate NUMERIC(24,12) NOT NULL DEFAULT 0 CHECK (taker_rate >= 0),
  fixed_fee NUMERIC(36,18) NOT NULL DEFAULT 0 CHECK (fixed_fee >= 0),
  fee_asset_symbol TEXT,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CHECK (effective_to IS NULL OR effective_to > effective_from)
);

CREATE TABLE IF NOT EXISTS customer_fee_rules (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  service TEXT NOT NULL,
  asset_symbol TEXT,
  market_symbol TEXT,
  operation_type TEXT NOT NULL,
  percentage NUMERIC(24,12) NOT NULL DEFAULT 0 CHECK (percentage >= 0),
  fixed_amount NUMERIC(36,18) NOT NULL DEFAULT 0 CHECK (fixed_amount >= 0),
  min_amount NUMERIC(36,18) CHECK (min_amount IS NULL OR min_amount >= 0),
  max_amount NUMERIC(36,18) CHECK (max_amount IS NULL OR max_amount >= 0),
  fee_asset_symbol TEXT,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CHECK (effective_to IS NULL OR effective_to > effective_from),
  CHECK (max_amount IS NULL OR min_amount IS NULL OR max_amount >= min_amount)
);

CREATE INDEX IF NOT EXISTS idx_provider_fee_rules_lookup
  ON provider_fee_rules(provider_code,market_symbol,asset_symbol,effective_from DESC);

CREATE INDEX IF NOT EXISTS idx_customer_fee_rules_lookup
  ON customer_fee_rules(service,operation_type,market_symbol,asset_symbol,effective_from DESC);

-- A trade must preserve the financial split between customer fee, provider
-- cost and company revenue. Zero defaults preserve legacy zero-fee trades.
ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS provider_fee_amount NUMERIC(36,18) NOT NULL DEFAULT 0
    CHECK (provider_fee_amount >= 0),
  ADD COLUMN IF NOT EXISTS provider_fee_asset_id BIGINT REFERENCES assets(id),
  ADD COLUMN IF NOT EXISTS customer_fee_amount NUMERIC(36,18) NOT NULL DEFAULT 0
    CHECK (customer_fee_amount >= 0),
  ADD COLUMN IF NOT EXISTS company_revenue_amount NUMERIC(36,18) NOT NULL DEFAULT 0
    CHECK (company_revenue_amount >= 0),
  ADD COLUMN IF NOT EXISTS operation_id TEXT,
  ADD COLUMN IF NOT EXISTS settlement_source TEXT;

CREATE INDEX IF NOT EXISTS idx_trades_operation_id ON trades(operation_id);

-- Provenance is independent from the wallet row: every credit/debit can be
-- traced to a domain operation and its originating evidence.
CREATE TABLE IF NOT EXISTS asset_provenance (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id),
  asset_id BIGINT NOT NULL REFERENCES assets(id),
  direction TEXT NOT NULL CHECK (direction IN ('CREDIT','DEBIT')),
  amount NUMERIC(36,18) NOT NULL CHECK (amount > 0),
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  operation_id TEXT NOT NULL,
  ledger_entry_reference TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(operation_id,direction,source_type,source_id)
);

CREATE INDEX IF NOT EXISTS idx_asset_provenance_operation
  ON asset_provenance(operation_id);

CREATE INDEX IF NOT EXISTS idx_asset_provenance_source
  ON asset_provenance(source_type,source_id);

INSERT INTO schema_migrations(version)
VALUES ('022_fee_and_asset_provenance_foundation')
ON CONFLICT(version) DO NOTHING;

COMMIT;
