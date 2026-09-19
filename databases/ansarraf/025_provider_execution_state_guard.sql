BEGIN;

ALTER TABLE provider_orders
  ADD CONSTRAINT provider_orders_status_check
  CHECK (status IN ('REQUESTED','SUBMITTED','PARTIALLY_FILLED','FILLED','CANCEL_PENDING','CANCELLED','REJECTED','UNKNOWN'));

CREATE INDEX IF NOT EXISTS idx_provider_orders_client_order
  ON provider_orders(client_order_id);

CREATE INDEX IF NOT EXISTS idx_provider_orders_open_lookup
  ON provider_orders(provider_id,client_order_id,status);

INSERT INTO schema_migrations(version)
VALUES ('025_provider_execution_state_guard')
ON CONFLICT(version) DO NOTHING;

COMMIT;
