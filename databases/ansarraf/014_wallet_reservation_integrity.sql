BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS reserved_asset_id BIGINT REFERENCES assets(id),
  ADD COLUMN IF NOT EXISTS reserved_amount NUMERIC(36,18) NOT NULL DEFAULT 0
    CHECK (reserved_amount >= 0);

CREATE TABLE IF NOT EXISTS wallet_reservations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id),
  wallet_id BIGINT NOT NULL REFERENCES wallets(id),
  asset_id BIGINT NOT NULL REFERENCES assets(id),
  amount NUMERIC(36,18) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','released','captured')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  UNIQUE (order_id),
  CHECK ((status='active' AND resolved_at IS NULL) OR (status IN ('released','captured') AND resolved_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_wallet_reservations_wallet_status
  ON wallet_reservations(wallet_id,status);

CREATE INDEX IF NOT EXISTS idx_wallet_reservations_order
  ON wallet_reservations(order_id);

CREATE OR REPLACE FUNCTION validate_order_reservation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IN ('open','partially_filled') THEN
    IF NEW.reserved_asset_id IS NULL OR NEW.reserved_amount <= 0 THEN
      RAISE EXCEPTION 'active_order_requires_reservation';
    END IF;
  ELSIF NEW.reserved_amount <> 0 OR NEW.reserved_asset_id IS NOT NULL THEN
    RAISE EXCEPTION 'terminal_order_cannot_keep_reservation';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_order_reservation_invariant ON orders;
CREATE TRIGGER trg_order_reservation_invariant
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION validate_order_reservation();

INSERT INTO schema_migrations(version)
VALUES ('013_wallet_reservation_integrity')
ON CONFLICT(version) DO NOTHING;

COMMIT;
