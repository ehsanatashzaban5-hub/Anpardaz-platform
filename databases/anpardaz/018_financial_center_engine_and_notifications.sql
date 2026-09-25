BEGIN;

ALTER TABLE cards ADD COLUMN IF NOT EXISTS bank_name TEXT;

CREATE TABLE IF NOT EXISTS financial_notifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  card_id BIGINT REFERENCES cards(id) ON DELETE SET NULL,
  transaction_id BIGINT REFERENCES financial_card_transactions(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('sync','large_transaction','warning')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_notifications_customer_created
  ON financial_notifications(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_notifications_unread
  ON financial_notifications(customer_id, read_at, created_at DESC);

CREATE OR REPLACE VIEW financial_daily_summary AS
SELECT
  t.customer_id,
  t.card_id,
  MAX(c.last4) AS card_last4,
  MAX(c.bank_name) AS bank_name,
  (t.occurred_at AT TIME ZONE 'Asia/Tehran')::date AS local_day,
  t.direction,
  COALESCE(t.category,'سایر') AS category,
  t.currency,
  SUM(t.amount) AS total,
  COUNT(*)::bigint AS transaction_count
FROM financial_card_transactions t
JOIN cards c ON c.id=t.card_id
GROUP BY t.customer_id, t.card_id, (t.occurred_at AT TIME ZONE 'Asia/Tehran')::date,
         t.direction, COALESCE(t.category,'سایر'), t.currency;

INSERT INTO schema_migrations(version)
VALUES ('018_financial_center_engine_and_notifications')
ON CONFLICT(version) DO NOTHING;

COMMIT;
