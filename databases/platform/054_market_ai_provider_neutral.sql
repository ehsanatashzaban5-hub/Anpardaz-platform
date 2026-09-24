BEGIN;

UPDATE ai_workflows
SET provider_policy='{"providers":["openai","gemini","openai_compatible"],"max_retries":1}'::jsonb
WHERE code IN ('market.assist','market.compare','market.classify');

INSERT INTO schema_migrations(version)
VALUES ('054_market_ai_provider_neutral')
ON CONFLICT(version) DO NOTHING;

COMMIT;