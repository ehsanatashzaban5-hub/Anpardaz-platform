BEGIN;

ALTER TABLE customer_fee_rules
  DROP CONSTRAINT IF EXISTS customer_fee_rules_operation_type_check;

ALTER TABLE customer_fee_rules
  ADD CONSTRAINT customer_fee_rules_operation_type_check
  CHECK (operation_type IN ('trade','deposit','withdrawal','transfer'));

ALTER TABLE deposits
  ADD COLUMN IF NOT EXISTS fee_amount NUMERIC(36,18) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
  ADD COLUMN IF NOT EXISTS fee_asset_id BIGINT REFERENCES assets(id),
  ADD COLUMN IF NOT EXISTS net_amount NUMERIC(36,18);

ALTER TABLE withdrawals
  ADD COLUMN IF NOT EXISTS fee_amount NUMERIC(36,18) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
  ADD COLUMN IF NOT EXISTS fee_asset_id BIGINT REFERENCES assets(id),
  ADD COLUMN IF NOT EXISTS net_amount NUMERIC(36,18);

CREATE INDEX IF NOT EXISTS idx_customer_fee_rules_operation_active
  ON customer_fee_rules(service,operation_type,effective_from DESC,effective_to);

CREATE TABLE IF NOT EXISTS fee_rule_audit (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  rule_id BIGINT,
  action TEXT NOT NULL CHECK (action IN ('create','update','close')),
  actor_identity_id TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fee_rule_audit_created_at ON fee_rule_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fee_rule_audit_rule ON fee_rule_audit(rule_id,created_at DESC);

INSERT INTO schema_migrations(version)
VALUES ('043_ansarraf_operational_fee_configuration')
ON CONFLICT(version) DO NOTHING;

COMMIT;
