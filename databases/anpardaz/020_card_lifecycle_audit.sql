BEGIN;

CREATE TABLE IF NOT EXISTS card_lifecycle_audit (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  card_id BIGINT,
  action TEXT NOT NULL CHECK (action IN ('registered','verified','revoked','deleted')),
  provider TEXT,
  provider_reference TEXT,
  last4 CHAR(4),
  bank_name TEXT,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('customer','admin','system')),
  actor_identity_id UUID,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_card_lifecycle_customer_created ON card_lifecycle_audit(customer_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_card_lifecycle_card_created ON card_lifecycle_audit(card_id,created_at DESC);

INSERT INTO schema_migrations(version) VALUES ('020_card_lifecycle_audit')
ON CONFLICT(version) DO NOTHING;
COMMIT;