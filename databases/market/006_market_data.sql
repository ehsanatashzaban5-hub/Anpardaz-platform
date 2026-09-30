BEGIN;

CREATE TABLE IF NOT EXISTS market_quotes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  symbol TEXT NOT NULL,
  source TEXT NOT NULL,
  bid NUMERIC(36,18),
  ask NUMERIC(36,18),
  last_price NUMERIC(36,18),
  volume NUMERIC(36,18),
  observed_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_quotes_symbol_observed ON market_quotes(symbol, observed_at DESC);

CREATE TABLE IF NOT EXISTS market_data_sources (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  base_url TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  priority INTEGER NOT NULL DEFAULT 100,
  timeout_ms INTEGER NOT NULL DEFAULT 5000 CHECK(timeout_ms BETWEEN 500 AND 30000),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_data_symbols (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  base_asset TEXT NOT NULL,
  quote_asset TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_data_observations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_id BIGINT NOT NULL REFERENCES market_data_sources(id) ON DELETE CASCADE,
  symbol_id BIGINT NOT NULL REFERENCES market_data_symbols(id) ON DELETE CASCADE,
  bid NUMERIC(38,18),
  ask NUMERIC(38,18),
  last_price NUMERIC(38,18),
  volume_24h NUMERIC(38,18),
  source_timestamp TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS market_data_health (
  source_id BIGINT PRIMARY KEY REFERENCES market_data_sources(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'unknown' CHECK(status IN ('unknown','healthy','degraded','down')),
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_data_observations_symbol_received
  ON market_data_observations(symbol_id,received_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_data_observations_source_received
  ON market_data_observations(source_id,received_at DESC);

INSERT INTO schema_migrations(version)
VALUES ('006_market_data')
ON CONFLICT(version) DO NOTHING;

COMMIT;
