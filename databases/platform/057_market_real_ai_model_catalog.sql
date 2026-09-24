BEGIN;

-- 057: real, provider-neutral An Hoosh model catalog.
-- The UI must only advertise models for providers that have a server-side key.
INSERT INTO ai_providers(name,provider_type,base_url,enabled,priority,model_policy,secret_ref) VALUES
('openai','openai','https://api.openai.com/v1',TRUE,10,'{"default_model":"gpt-5.6-luna"}'::jsonb,'OPENAI_API_KEY'),
('gemini','gemini','https://generativelanguage.googleapis.com',TRUE,20,'{"default_model":"gemini-3.8-flash"}'::jsonb,'GEMINI_API_KEY'),
('anthropic','anthropic','https://api.anthropic.com',TRUE,30,'{"default_model":"claude-sonnet-5"}'::jsonb,'ANTHROPIC_API_KEY'),
('xai','openai_compatible','https://api.x.ai/v1',TRUE,40,'{"default_model":"grok-4.7"}'::jsonb,'XAI_API_KEY')
ON CONFLICT(name) DO UPDATE SET base_url=EXCLUDED.base_url,provider_type=EXCLUDED.provider_type,model_policy=EXCLUDED.model_policy,secret_ref=EXCLUDED.secret_ref;

UPDATE ai_workflows
SET provider_policy='{"providers":["openai","gemini","anthropic","xai","openai_compatible"],"max_retries":1}'::jsonb
WHERE code IN ('hoosh.chat','market.assist','market.compare','market.classify','market.audit');

INSERT INTO schema_migrations(version) VALUES ('057_market_real_ai_model_catalog')
ON CONFLICT(version) DO NOTHING;
COMMIT;