BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS market_buy_quote_amount NUMERIC(36,18)
    CHECK (market_buy_quote_amount IS NULL OR market_buy_quote_amount > 0);

CREATE OR REPLACE FUNCTION validate_order_reservation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IN ('filled','cancelled','rejected') AND
     (NEW.reserved_amount <> 0 OR NEW.reserved_asset_id IS NOT NULL) THEN
    RAISE EXCEPTION 'terminal_order_cannot_keep_reservation';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_order_reservation_invariant ON orders;
CREATE TRIGGER trg_order_reservation_invariant
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION validate_order_reservation();

INSERT INTO schema_migrations(version)
VALUES ('014_exchange_order_quote_amount')
ON CONFLICT(version) DO NOTHING;

COMMIT;
