BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS uq_market_media_product_url
  ON market_media(product_id,url);

CREATE UNIQUE INDEX IF NOT EXISTS uq_market_offers_store_external_product
  ON market_offers(store_id,external_product_id)
  WHERE external_product_id IS NOT NULL;

INSERT INTO schema_migrations(version)
VALUES ('039_market_ingestion_uniques')
ON CONFLICT(version) DO NOTHING;

COMMIT;
