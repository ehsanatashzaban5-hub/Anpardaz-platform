BEGIN;

-- Withdrawal funds are reserved separately from trade reservations so a pending
-- withdrawal can never leave customer spendable balance overstated.
CREATE TABLE IF NOT EXISTS withdrawal_reservations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  withdrawal_id BIGINT NOT NULL REFERENCES withdrawals(id),
  wallet_id BIGINT NOT NULL REFERENCES wallets(id),
  asset_id BIGINT NOT NULL REFERENCES assets(id),
  amount NUMERIC(36,18) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','released','captured')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  UNIQUE(withdrawal_id),
  CHECK (
    (status='active' AND resolved_at IS NULL)
    OR (status IN ('released','captured') AND resolved_at IS NOT NULL)
  )
);

ALTER TABLE withdrawals
  ADD COLUMN IF NOT EXISTS operation_id TEXT,
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (approval_status IN ('PENDING','APPROVED','REJECTED')),
  ADD COLUMN IF NOT EXISTS approved_by TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provider_id UUID,
  ADD COLUMN IF NOT EXISTS provider_withdrawal_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_fee_amount NUMERIC(36,18) NOT NULL DEFAULT 0
    CHECK (provider_fee_amount >= 0),
  ADD COLUMN IF NOT EXISTS customer_fee_amount NUMERIC(36,18) NOT NULL DEFAULT 0
    CHECK (customer_fee_amount >= 0),
  ADD COLUMN IF NOT EXISTS tx_hash TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_withdrawal_reservations_wallet_status
  ON withdrawal_reservations(wallet_id,status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_reservations_withdrawal
  ON withdrawal_reservations(withdrawal_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_operation_id
  ON withdrawals(operation_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_approval_status
  ON withdrawals(approval_status,status,created_at);

INSERT INTO schema_migrations(version)
VALUES ('021_withdrawal_reservation_foundation')
ON CONFLICT(version) DO NOTHING;

COMMIT;
