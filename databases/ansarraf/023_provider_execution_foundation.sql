BEGIN;

CREATE TABLE IF NOT EXISTS liquidity_providers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED','MAINTENANCE')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provider_orders (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider_id BIGINT NOT NULL REFERENCES liquidity_providers(id),
  customer_order_id BIGINT REFERENCES orders(id),
  trade_id BIGINT REFERENCES trades(id),
  client_order_id TEXT NOT NULL,
  provider_order_id TEXT,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy','sell')),
  order_type TEXT NOT NULL CHECK (order_type IN ('market','limit')),
  quantity NUMERIC(36,18) NOT NULL CHECK (quantity > 0),
  price NUMERIC(36,18),
  status TEXT NOT NULL DEFAULT 'REQUESTED',
  executed_quantity NUMERIC(36,18) NOT NULL DEFAULT 0 CHECK (executed_quantity >= 0),
  executed_quote_amount NUMERIC(36,18) NOT NULL DEFAULT 0 CHECK (executed_quote_amount >= 0),
  provider_fee_amount NUMERIC(36,18) NOT NULL DEFAULT 0 CHECK (provider_fee_amount >= 0),
  provider_fee_asset_id BIGINT REFERENCES assets(id),
  raw_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider_id,client_order_id)
);

CREATE TABLE IF NOT EXISTS quote_locks (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id),
  order_id BIGINT REFERENCES orders(id),
  provider_id BIGINT REFERENCES liquidity_providers(id),
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy','sell')),
  quantity NUMERIC(36,18) NOT NULL CHECK (quantity > 0),
  executable_price NUMERIC(36,18) NOT NULL CHECK (executable_price > 0),
  customer_fee NUMERIC(36,18) NOT NULL DEFAULT 0 CHECK (customer_fee >= 0),
  provider_fee_estimate NUMERIC(36,18) NOT NULL DEFAULT 0 CHECK (provider_fee_estimate >= 0),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','CONSUMED','EXPIRED','CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consumed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_provider_orders_status ON provider_orders(status);
CREATE INDEX IF NOT EXISTS idx_provider_orders_customer_order ON provider_orders(customer_order_id);
CREATE INDEX IF NOT EXISTS idx_quote_locks_order ON quote_locks(order_id);
CREATE INDEX IF NOT EXISTS idx_quote_locks_expiry ON quote_locks(expires_at);

INSERT INTO liquidity_providers(code,name,status)
VALUES ('WALLEX','Wallex','ACTIVE')
ON CONFLICT(code) DO NOTHING;

INSERT INTO schema_migrations(version)
VALUES ('023_provider_execution_foundation')
ON CONFLICT(version) DO NOTHING;

COMMIT;
