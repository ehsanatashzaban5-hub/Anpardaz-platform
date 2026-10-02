BEGIN;

CREATE TABLE IF NOT EXISTS market_quotes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('wallex','nobitex','tabdeal')),
  symbol TEXT NOT NULL,
  last_price NUMERIC(38,18) NOT NULL CHECK (last_price > 0),
  bid_price NUMERIC(38,18),
  ask_price NUMERIC(38,18),
  fetched_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, symbol),
  CHECK (bid_price IS NULL OR bid_price > 0),
  CHECK (ask_price IS NULL OR ask_price > 0)
);

CREATE INDEX IF NOT EXISTS idx_market_quotes_symbol_fetched
  ON market_quotes(symbol, fetched_at DESC);

INSERT INTO schema_migrations(version)
VALUES ('012_market_data')
ON CONFLICT(version) DO NOTHING;

COMMIT;
