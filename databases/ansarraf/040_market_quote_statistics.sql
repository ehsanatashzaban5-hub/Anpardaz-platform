BEGIN;

ALTER TABLE market_quotes
  ADD COLUMN IF NOT EXISTS change_24h NUMERIC(20,8),
  ADD COLUMN IF NOT EXISTS volume_24h NUMERIC(38,18),
  ADD COLUMN IF NOT EXISTS high_24h NUMERIC(38,18),
  ADD COLUMN IF NOT EXISTS low_24h NUMERIC(38,18);

CREATE INDEX IF NOT EXISTS idx_market_quotes_provider_fetched
  ON market_quotes(provider,fetched_at DESC);

INSERT INTO schema_migrations(version)
VALUES ('040_market_quote_statistics')
ON CONFLICT(version) DO NOTHING;

COMMIT;
