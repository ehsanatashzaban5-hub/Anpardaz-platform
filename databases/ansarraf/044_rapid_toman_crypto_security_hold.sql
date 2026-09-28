BEGIN;

-- Suspicious-funding control:
-- A confirmed Toman deposit followed by a crypto purchase within the configured
-- rapid-conversion window during 12:00-20:00 Tehran time opens a manual-review
-- security case and blocks the An Sarraf account until an authorized admin releases it.
CREATE TABLE IF NOT EXISTS funding_security_cases (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  case_type TEXT NOT NULL CHECK (case_type IN ('rapid_toman_to_crypto')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','released','rejected')),
  trigger_deposit_id BIGINT REFERENCES deposits(id),
  trigger_trade_id BIGINT REFERENCES trades(id),
  trigger_order_id BIGINT REFERENCES orders(id),
  reason_code TEXT NOT NULL,
  reason_message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  review_reason TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_funding_security_open_customer_case
  ON funding_security_cases(customer_id, case_type)
  WHERE status='open';

CREATE INDEX IF NOT EXISTS idx_funding_security_cases_status_created
  ON funding_security_cases(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_funding_security_cases_customer_created
  ON funding_security_cases(customer_id, created_at DESC);

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS security_hold_reason TEXT,
  ADD COLUMN IF NOT EXISTS security_hold_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION ansarraf_detect_rapid_toman_crypto_conversion()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  o RECORD;
  a_base RECORD;
  a_quote RECORD;
  d RECORD;
BEGIN
  SELECT id,customer_id,side,base_asset_id,quote_asset_id,created_at
    INTO o
    FROM orders WHERE id=NEW.order_id;

  IF NOT FOUND OR o.side <> 'buy' THEN
    RETURN NEW;
  END IF;

  SELECT id,asset_type,symbol INTO a_base FROM assets WHERE id=o.base_asset_id;
  SELECT id,asset_type,symbol INTO a_quote FROM assets WHERE id=o.quote_asset_id;

  IF a_base.asset_type <> 'crypto' OR a_quote.asset_type <> 'fiat' THEN
    RETURN NEW;
  END IF;

  SELECT id,created_at,amount INTO d
    FROM deposits dep
    JOIN assets da ON da.id=dep.asset_id
   WHERE dep.customer_id=o.customer_id
     AND dep.status='confirmed'
     AND da.asset_type='fiat'
     AND dep.created_at <= NEW.created_at
     AND NEW.created_at - dep.created_at <= INTERVAL '15 minutes'
     AND (dep.created_at AT TIME ZONE 'Asia/Tehran')::time >= TIME '12:00'
     AND (dep.created_at AT TIME ZONE 'Asia/Tehran')::time < TIME '20:00'
     AND (NEW.created_at AT TIME ZONE 'Asia/Tehran')::time >= TIME '12:00'
     AND (NEW.created_at AT TIME ZONE 'Asia/Tehran')::time < TIME '20:00'
   ORDER BY dep.created_at DESC
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  INSERT INTO funding_security_cases(
    customer_id,case_type,status,trigger_deposit_id,trigger_trade_id,trigger_order_id,
    reason_code,reason_message,metadata
  )
  VALUES(
    o.customer_id,'rapid_toman_to_crypto','open',d.id,NEW.id,NEW.order_id,
    'RAPID_TOMAN_CRYPTO_CONVERSION',
    'واریز تومان در بازه ۱۲ ظهر تا ۸ شب و تبدیل سریع آن به رمزارز نیازمند بررسی مدیر است.',
    jsonb_build_object(
      'depositId',d.id,
      'depositCreatedAt',d.created_at,
      'depositAmount',d.amount::text,
      'tradeId',NEW.id,
      'orderId',NEW.order_id,
      'tradeCreatedAt',NEW.created_at,
      'baseAsset',a_base.symbol,
      'quoteAsset',a_quote.symbol,
      'rapidWindowSeconds',900,
      'tehranWindow','12:00-20:00'
    )
  )
  ON CONFLICT DO NOTHING;

  UPDATE customers
     SET status='blocked',
         security_hold_reason='RAPID_TOMAN_CRYPTO_CONVERSION',
         security_hold_at=COALESCE(security_hold_at,NOW()),
         updated_at=NOW()
   WHERE id=o.customer_id
     AND status='active';

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_ansarraf_rapid_toman_crypto_conversion ON trades;
CREATE TRIGGER trg_ansarraf_rapid_toman_crypto_conversion
AFTER INSERT ON trades
FOR EACH ROW EXECUTE FUNCTION ansarraf_detect_rapid_toman_crypto_conversion();

INSERT INTO schema_migrations(version)
VALUES ('044_rapid_toman_crypto_security_hold')
ON CONFLICT(version) DO NOTHING;

COMMIT;
