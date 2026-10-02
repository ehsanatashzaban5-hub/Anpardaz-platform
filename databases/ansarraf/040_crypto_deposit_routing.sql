BEGIN;

CREATE TABLE IF NOT EXISTS crypto_deposit_routing (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider_id BIGINT NOT NULL REFERENCES liquidity_providers(id),
  asset_id BIGINT NOT NULL REFERENCES assets(id),
  network TEXT NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('provider_unique','custody_unique','shared_manual')),
  custody_provider_code TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider_id,asset_id,network)
);

CREATE INDEX IF NOT EXISTS idx_crypto_deposit_routing_active
  ON crypto_deposit_routing(provider_id,asset_id,network) WHERE enabled=TRUE;

ALTER TABLE provider_deposit_addresses
  ADD COLUMN IF NOT EXISTS attribution_key TEXT,
  ADD COLUMN IF NOT EXISTS allocation_mode TEXT NOT NULL DEFAULT 'provider';

CREATE INDEX IF NOT EXISTS idx_provider_deposit_addresses_attribution
  ON provider_deposit_addresses(provider_id,asset_id,network,address,memo,status);

INSERT INTO schema_migrations(version)
VALUES ('039_crypto_deposit_routing')
ON CONFLICT(version) DO NOTHING;

COMMIT;