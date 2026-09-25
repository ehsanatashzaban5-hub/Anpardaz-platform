BEGIN;

-- 061: final An Market production/AI gate.
-- The catalog may only be published from stores whose public source has been
-- discovered and explicitly connected. AI remains provider-neutral.
UPDATE market_stores
SET active=FALSE
WHERE verification_status<>'verified'
   OR discovery_status<>'connected';

UPDATE market_store_sources
SET enabled=FALSE
WHERE store_id IN (
  SELECT id FROM market_stores
  WHERE active=FALSE
);

-- Use current, production model IDs while keeping provider selection configurable.
UPDATE ai_providers
SET model_policy=jsonb_set(COALESCE(model_policy,'{}'::jsonb),'{default_model}','"gpt-5.6-luna"'::jsonb,true)
WHERE name='openai';

UPDATE ai_providers
SET model_policy=jsonb_set(COALESCE(model_policy,'{}'::jsonb),'{default_model}','"gemini-3.8-flash"'::jsonb,true)
WHERE name='gemini';

UPDATE ai_workflows
SET provider_policy='{"providers":["openai","gemini","openai_compatible"],"max_retries":1}'::jsonb,
    enabled=TRUE
WHERE code IN ('market.assist','market.compare','market.classify','market.audit');

CREATE INDEX IF NOT EXISTS idx_market_products_published_category_updated
  ON market_products(status,category_id,updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_market_offers_live_product_price
  ON market_offers(product_id,price)
  WHERE availability <> 'out_of_stock';

INSERT INTO schema_migrations(version)
VALUES ('061_market_final_production_ai_gate')
ON CONFLICT(version) DO NOTHING;

COMMIT;
