BEGIN;

-- Re-establish the invariant weakened by the earlier migration:
-- every live order must have a positive reservation; terminal orders must have none.
CREATE OR REPLACE FUNCTION validate_order_reservation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IN ('open','partially_filled') THEN
    IF NEW.reserved_asset_id IS NULL OR NEW.reserved_amount <= 0 THEN
      RAISE EXCEPTION 'active_order_requires_reservation';
    END IF;
  ELSE
    IF NEW.reserved_amount <> 0 OR NEW.reserved_asset_id IS NOT NULL THEN
      RAISE EXCEPTION 'terminal_order_cannot_keep_reservation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_reservation_invariant ON orders;
CREATE TRIGGER trg_order_reservation_invariant
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION validate_order_reservation();

-- A reservation can only be consumed by its own order's settlement lifecycle.
-- Keep the accounting fields internally consistent at the database boundary.
ALTER TABLE wallet_reservations
  ADD CONSTRAINT wallet_reservation_consumed_nonnegative
  CHECK (consumed_amount >= 0);

INSERT INTO schema_migrations(version)
VALUES ('018_settlement_invariant_hardening')
ON CONFLICT(version) DO NOTHING;

COMMIT;