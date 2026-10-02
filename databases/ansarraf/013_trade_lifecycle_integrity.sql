BEGIN;

CREATE OR REPLACE FUNCTION sync_order_status_from_trades()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  oid BIGINT;
  ordered NUMERIC(36,18);
  filled NUMERIC(36,18);
BEGIN
  oid := COALESCE(NEW.order_id,OLD.order_id);

  SELECT quantity INTO ordered
  FROM orders
  WHERE id=oid
  FOR UPDATE;

  IF ordered IS NULL THEN
    RAISE EXCEPTION 'trade_order_not_found';
  END IF;

  SELECT COALESCE(SUM(quantity),0) INTO filled
  FROM trades
  WHERE order_id=oid;

  IF filled>=ordered THEN
    UPDATE orders SET status='filled' WHERE id=oid AND status IN ('open','partially_filled');
  ELSIF filled>0 THEN
    UPDATE orders SET status='partially_filled' WHERE id=oid AND status='open';
  END IF;

  RETURN COALESCE(NEW,OLD);
END; $$;

DROP TRIGGER IF EXISTS trg_sync_order_status_from_trades ON trades;
CREATE TRIGGER trg_sync_order_status_from_trades
AFTER INSERT ON trades
FOR EACH ROW EXECUTE FUNCTION sync_order_status_from_trades();

CREATE OR REPLACE FUNCTION protect_exchange_trade_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'trades_are_immutable';
END; $$;

DROP TRIGGER IF EXISTS trg_trade_immutable ON trades;
CREATE TRIGGER trg_trade_immutable
BEFORE UPDATE OR DELETE ON trades
FOR EACH ROW EXECUTE FUNCTION protect_exchange_trade_immutable();

INSERT INTO schema_migrations(version)
VALUES ('011_trade_lifecycle_integrity')
ON CONFLICT(version) DO NOTHING;

COMMIT;
