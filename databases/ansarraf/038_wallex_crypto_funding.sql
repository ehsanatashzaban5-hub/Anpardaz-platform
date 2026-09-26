BEGIN;

CREATE TABLE IF NOT EXISTS provider_deposit_addresses (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider_id BIGINT NOT NULL REFERENCES liquidity_providers(id),
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  asset_id BIGINT NOT NULL REFERENCES assets(id),
  network TEXT NOT NULL,
  address TEXT NOT NULL,
  memo TEXT,
  provider_reference TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','DISABLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider_id,customer_id,asset_id,network)
);

CREATE TABLE IF NOT EXISTS provider_deposit_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider_id BIGINT NOT NULL REFERENCES liquidity_providers(id),
  customer_id BIGINT REFERENCES customers(id),
  asset_id BIGINT REFERENCES assets(id),
  provider_event_id TEXT NOT NULL,
  asset_symbol TEXT NOT NULL,
  network TEXT,
  amount NUMERIC(36,18) NOT NULL CHECK(amount>0),
  address TEXT,
  memo TEXT,
  tx_hash TEXT,
  confirmations INTEGER,
  required_confirmations INTEGER,
  status TEXT NOT NULL DEFAULT 'detected' CHECK(status IN ('detected','confirmed','credited','manual_review','rejected')),
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  credited_at TIMESTAMPTZ,
  UNIQUE(provider_id,provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_provider_deposit_events_customer
  ON provider_deposit_events(customer_id,detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_deposit_events_status
  ON provider_deposit_events(status,detected_at);

INSERT INTO schema_migrations(version)
VALUES ('038_wallex_crypto_funding')
ON CONFLICT(version) DO NOTHING;

COMMIT;
