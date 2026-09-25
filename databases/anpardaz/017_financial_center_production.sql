BEGIN;

CREATE TABLE IF NOT EXISTS financial_card_audit_permissions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  card_id BIGINT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  enabled_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, card_id)
);

CREATE TABLE IF NOT EXISTS financial_card_transactions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  card_id BIGINT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('income','expense','internal')),
  amount NUMERIC(24,8) NOT NULL CHECK(amount > 0),
  currency CHAR(3) NOT NULL,
  description TEXT,
  category TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('FINNOTECH','ANPARDAZ')),
  raw_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(card_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_financial_permissions_customer ON financial_card_audit_permissions(customer_id, enabled);
CREATE INDEX IF NOT EXISTS idx_financial_card_tx_customer_date ON financial_card_transactions(customer_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_card_tx_card_date ON financial_card_transactions(card_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_card_tx_direction_category ON financial_card_transactions(customer_id, direction, category);

INSERT INTO schema_migrations(version)
VALUES ('017_financial_center_production')
ON CONFLICT(version) DO NOTHING;

COMMIT;