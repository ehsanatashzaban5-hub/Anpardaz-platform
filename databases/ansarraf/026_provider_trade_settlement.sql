BEGIN;

ALTER TABLE provider_orders
  ADD COLUMN IF NOT EXISTS settled_quantity NUMERIC(36,18) NOT NULL DEFAULT 0 CHECK (settled_quantity>=0),
  ADD COLUMN IF NOT EXISTS settled_quote_amount NUMERIC(36,18) NOT NULL DEFAULT 0 CHECK (settled_quote_amount>=0),
  ADD COLUMN IF NOT EXISTS settled_provider_fee_amount NUMERIC(36,18) NOT NULL DEFAULT 0 CHECK (settled_provider_fee_amount>=0),
  ADD COLUMN IF NOT EXISTS settlement_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (settlement_status IN ('PENDING','PARTIAL','SETTLED','QUARANTINED'));

CREATE TABLE IF NOT EXISTS provider_trade_settlements (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider_order_id BIGINT NOT NULL REFERENCES provider_orders(id),
  customer_order_id BIGINT NOT NULL REFERENCES orders(id),
  operation_id TEXT NOT NULL UNIQUE,
  quantity NUMERIC(36,18) NOT NULL CHECK (quantity>0),
  quote_amount NUMERIC(36,18) NOT NULL CHECK (quote_amount>0),
  customer_fee_amount NUMERIC(36,18) NOT NULL DEFAULT 0 CHECK (customer_fee_amount>=0),
  provider_fee_amount NUMERIC(36,18) NOT NULL DEFAULT 0 CHECK (provider_fee_amount>=0),
  provider_fee_asset_id BIGINT REFERENCES assets(id),
  company_revenue_amount NUMERIC(36,18) NOT NULL DEFAULT 0 CHECK (company_revenue_amount>=0),
  execution_price NUMERIC(36,18) NOT NULL CHECK (execution_price>0),
  status TEXT NOT NULL DEFAULT 'SETTLED'
    CHECK (status IN ('SETTLED','QUARANTINED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider_order_id,quantity,quote_amount,provider_fee_amount)
);

CREATE INDEX IF NOT EXISTS idx_provider_trade_settlements_order
  ON provider_trade_settlements(customer_order_id,created_at);

INSERT INTO schema_migrations(version)
VALUES ('026_provider_trade_settlement')
ON CONFLICT(version) DO NOTHING;

COMMIT;
