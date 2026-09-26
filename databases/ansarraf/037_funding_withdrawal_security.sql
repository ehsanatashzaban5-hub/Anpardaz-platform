BEGIN;

-- Anti-phishing / source-of-funds controls.
ALTER TABLE deposits
  ADD COLUMN IF NOT EXISTS source_card_id BIGINT,
  ADD COLUMN IF NOT EXISTS admin_review_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (admin_review_status IN ('PENDING','APPROVED','REJECTED')),
  ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_toman_deposit_at TIMESTAMPTZ;

ALTER TABLE withdrawals
  ADD COLUMN IF NOT EXISTS destination_card_id BIGINT,
  ADD COLUMN IF NOT EXISTS destination_card_last4 CHAR(4),
  ADD COLUMN IF NOT EXISTS admin_review_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (admin_review_status IN ('PENDING','APPROVED','REJECTED')),
  ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_ansarraf_toman_deposits_customer_confirmed
  ON deposits(customer_id,created_at)
  WHERE status='confirmed';

CREATE INDEX IF NOT EXISTS idx_ansarraf_withdrawal_admin_review
  ON withdrawals(admin_review_status,status,created_at DESC);

-- Explicitly record the 24-hour anti-fraud window from the first confirmed Toman funding.
CREATE OR REPLACE FUNCTION ansarraf_first_toman_deposit_guard()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status='confirmed' THEN
    IF EXISTS (SELECT 1 FROM assets a WHERE a.id=NEW.asset_id AND a.asset_type='fiat') THEN
      UPDATE deposits
      SET first_toman_deposit_at=COALESCE(first_toman_deposit_at,NEW.created_at)
      WHERE customer_id=NEW.customer_id
        AND id=NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_ansarraf_first_toman_deposit ON deposits;
CREATE TRIGGER trg_ansarraf_first_toman_deposit
AFTER INSERT OR UPDATE OF status ON deposits
FOR EACH ROW EXECUTE FUNCTION ansarraf_first_toman_deposit_guard();

INSERT INTO schema_migrations(version)
VALUES ('037_funding_withdrawal_security')
ON CONFLICT(version) DO NOTHING;

COMMIT;
