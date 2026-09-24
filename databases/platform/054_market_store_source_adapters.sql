BEGIN;
UPDATE market_store_sources SET adapter='woocommerce-store-api'
WHERE source_name='public-woocommerce-store-api';
UPDATE market_store_sources SET adapter='jsonld'
WHERE source_name='public-jsonld-catalog';
INSERT INTO schema_migrations(version)
VALUES ('054_market_store_source_adapters')
ON CONFLICT(version) DO NOTHING;
COMMIT;