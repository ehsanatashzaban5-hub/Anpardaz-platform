BEGIN;

CREATE TABLE IF NOT EXISTS withdrawal_approvals (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  withdrawal_id BIGINT NOT NULL REFERENCES withdrawals(id),
  approver_identity_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('APPROVED','REJECTED')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(withdrawal_id,approver_identity_id)
);

ALTER TABLE withdrawals
  ADD COLUMN IF NOT EXISTS liquidity_provider_id BIGINT REFERENCES liquidity_providers(id),
  ADD COLUMN IF NOT EXISTS destination_memo TEXT,
  ADD COLUMN IF NOT EXISTS approval_required_count INTEGER NOT NULL DEFAULT 1
    CHECK (approval_required_count BETWEEN 1 AND 2),
  ADD COLUMN IF NOT EXISTS approved_count INTEGER NOT NULL DEFAULT 0
    CHECK (approved_count >= 0),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS provider_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provider_completed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS provider_withdrawal_outbox (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  withdrawal_id BIGINT NOT NULL REFERENCES withdrawals(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('provider.withdrawal.submit','provider.withdrawal.poll')),
  idempotency_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','posted','failed','manual_review')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processing_started_at TIMESTAMPTZ,
  last_error TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_approvals_withdrawal
  ON withdrawal_approvals(withdrawal_id,created_at);
CREATE INDEX IF NOT EXISTS idx_provider_withdrawal_outbox_pick
  ON provider_withdrawal_outbox(status,available_at,id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_provider_lookup
  ON withdrawals(liquidity_provider_id,provider_withdrawal_id);

INSERT INTO schema_migrations(version)
VALUES ('027_withdrawal_approval_provider_outbox')
ON CONFLICT(version) DO NOTHING;

COMMIT;
