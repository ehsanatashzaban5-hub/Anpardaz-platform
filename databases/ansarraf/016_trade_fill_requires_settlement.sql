BEGIN;

CREATE OR REPLACE FUNCTION sync_order_status_from_trades()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  oid BIGINT;
  ordered NUMERIC(36,18);
  filled NUMERIC(36,18);
BEGIN
  oid := COALESCE(NEW.order_id,OLD.order_id);

  SELECT quantity INTO ordered FROM orders WHERE id=oid FOR UPDATE;
  IF ordered IS NULL THEN RAISE EXCEPTION 'trade_order_not_found'; END IF;

  SELECT COALESCE(SUM(quantity),0) INTO filled FROM trades WHERE order_id=oid;

  -- A filled order requires settlement to consume/release its wallet reservation
  -- atomically. Do not transition to 'filled' from this trigger alone.
  IF filled>0 AND filled<ordered THEN
    UPDATE orders SET status='partially_filled'
    WHERE id=oid AND status='open';
  END IF;

  RETURN COALESCE(NEW,OLD);
END; $$;

INSERT INTO schema_migrations(version)
VALUES ('015_trade_fill_requires_settlement')
ON CONFLICT(version) DO NOTHING;

COMMIT;