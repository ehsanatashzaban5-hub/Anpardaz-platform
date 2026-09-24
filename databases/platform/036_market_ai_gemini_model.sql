BEGIN;

UPDATE ai_providers
SET model_policy=jsonb_set(COALESCE(model_policy,'{}'::jsonb),'{"default_model"}','"gemini-3.8-flash"'::jsonb),
    priority=10,
    enabled=TRUE
WHERE name='gemini';

INSERT INTO schema_migrations(version)
VALUES ('036_market_ai_gemini_model')
ON CONFLICT(version) DO NOTHING;

COMMIT;
