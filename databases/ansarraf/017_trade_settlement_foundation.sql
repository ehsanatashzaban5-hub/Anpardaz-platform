BEGIN;

ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS counterparty_order_id BIGINT REFERENCES orders(id),
  ADD COLUMN IF NOT EXISTS settlement_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (settlement_status IN ('pending','settled','failed')),
  ADD COLUMN IF NOT EXISTS settlement_idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uq_trades_settlement_idempotency
  ON trades(settlement_idempotency_key)
  WHERE settlement_idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trades_counterparty_order
  ON trades(counterparty_order_id);

CREATE INDEX IF NOT EXISTS idx_trades_settlement_status
  ON trades(settlement_status, created_at);

ALTER TABLE wallet_reservations
  ADD COLUMN IF NOT EXISTS consumed_amount NUMERIC(36,18) NOT NULL DEFAULT 0
    CHECK (consumed_amount >= 0);

CREATE OR REPLACE FUNCTION validate_wallet_reservation_consumption()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.consumed_amount > NEW.amount THEN
    RAISE EXCEPTION 'reservation_consumed_exceeds_amount';
  END IF;
  IF NEW.status='active' AND NEW.consumed_amount >= NEW.amount THEN
    RAISE EXCEPTION 'fully_consumed_reservation_must_not_remain_active';
  END IF;
  IF NEW.status IN ('captured','released') AND NEW.resolved_at IS NULL THEN
    RAISE EXCEPTION 'resolved_reservation_requires_resolved_at';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_wallet_reservation_consumption ON wallet_reservations;
CREATE TRIGGER trg_wallet_reservation_consumption
BEFORE INSERT OR UPDATE ON wallet_reservations
FOR EACH ROW EXECUTE FUNCTION validate_wallet_reservation_consumption();

CREATE OR REPLACE FUNCTION validate_trade_counterparty()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  own orders%ROWTYPE;
  other orders%ROWTYPE;
BEGIN
  IF NEW.counterparty_order_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO own FROM orders WHERE id=NEW.order_id;
  SELECT * INTO other FROM orders WHERE id=NEW.counterparty_order_id;

  IF own.id IS NULL OR other.id IS NULL THEN
    RAISE EXCEPTION 'trade_order_not_found';
  END IF;
  IF own.id=other.id THEN
    RAISE EXCEPTION 'trade_orders_must_differ';
  END IF;
  IF own.base_asset_id<>other.base_asset_id OR own.quote_asset_id<>other.quote_asset_id
     OR own.side=other.side THEN
    RAISE EXCEPTION 'invalid_trade_counterparty';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_trade_counterparty ON trades;
CREATE TRIGGER trg_trade_counterparty
BEFORE INSERT OR UPDATE ON trades
FOR EACH ROW EXECUTE FUNCTION validate_trade_counterparty();

INSERT INTO schema_migrations(version)
VALUES ('016_trade_settlement_foundation')
ON CONFLICT(version) DO NOTHING;

COMMIT;