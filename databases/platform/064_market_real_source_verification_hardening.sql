BEGIN;

-- 060: remove blanket/fabricated source verification from earlier registry waves.
-- A store is production-active only after the discovery worker proves a public,
-- permitted catalog endpoint and records the connection method.
UPDATE market_store_sources
SET enabled=FALSE, updated_at=NOW()
WHERE source_name IN ('public-woocommerce-store-api','public-jsonld-catalog');

UPDATE market_stores
SET
  active=FALSE,
  verification_status='pending',
  discovery_status='not_checked',
  discovery_error=NULL,
  discovery_method=NULL,
  feed_verified_at=NULL,
  verified_at=NULL,
  last_sync_status=NULL,
  last_sync_error=NULL,
  updated_at=NOW()
WHERE verification_status='verified'
  AND COALESCE(discovery_method,'') NOT IN ('woocommerce_store_api','shopify_products_json','sitemap_jsonld');

-- Re-run discovery for every registry candidate. Successful discovery will
-- reactivate the store and create only the source that actually exists.
UPDATE market_stores
SET
  verification_status='pending',
  discovery_status='not_checked',
  discovery_error=NULL,
  updated_at=NOW()
WHERE verification_status IN ('unverified','rejected','blocked')
   OR discovery_status IN ('failed','blocked');

CREATE INDEX IF NOT EXISTS idx_market_stores_discovery_queue
  ON market_stores(verification_status,discovery_status,active,id);

INSERT INTO schema_migrations(version)
VALUES ('064_market_real_source_verification_hardening')
ON CONFLICT(version) DO NOTHING;

COMMIT;
