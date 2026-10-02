BEGIN;

-- Active orders need a reservation, but the reservation is created in the
-- same transaction immediately after the order row. A deferred constraint
-- trigger enforces the invariant at COMMIT rather than during the temporary
-- in-transaction state.
DROP TRIGGER IF EXISTS trg_order_reservation_invariant ON orders;

CREATE CONSTRAINT TRIGGER trg_order_reservation_invariant
AFTER INSERT OR UPDATE ON orders
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION validate_order_reservation();

INSERT INTO schema_migrations(version)
VALUES ('020_deferred_order_reservation_invariant')
ON CONFLICT(version) DO NOTHING;

COMMIT;
