BEGIN;
DELETE FROM market_category_classifications a
USING market_category_classifications b
WHERE a.id>b.id
  AND a.product_id=b.product_id
  AND a.category_id=b.category_id
  AND a.method=b.method
  AND a.active=true
  AND b.active=true;
CREATE UNIQUE INDEX IF NOT EXISTS uq_market_product_classification_active
  ON market_category_classifications(product_id,category_id,method)
  WHERE active=true;
INSERT INTO schema_migrations(version) VALUES ('052_market_classification_uniqueness')
ON CONFLICT(version) DO NOTHING;
COMMIT;
