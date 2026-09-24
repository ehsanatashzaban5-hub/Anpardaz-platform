BEGIN;
CREATE UNIQUE INDEX IF NOT EXISTS uq_market_product_classification_active
  ON market_category_classifications(product_id,category_id,method)
  WHERE active=true;
INSERT INTO schema_migrations(version) VALUES ('052_market_classification_uniqueness')
ON CONFLICT(version) DO NOTHING;
COMMIT;
