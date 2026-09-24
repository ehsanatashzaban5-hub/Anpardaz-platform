BEGIN;
INSERT INTO ai_providers(name,provider_type,base_url,enabled,priority,model_policy,secret_ref)
VALUES ('openai_compatible','openai_compatible',COALESCE(NULLIF(current_setting('app.ai_compat_base_url',true),''),'https://example.invalid'),TRUE,50,'{"default_model":"qwen3"}'::jsonb,'AI_COMPAT_API_KEY')
ON CONFLICT(name) DO UPDATE SET enabled=TRUE;
INSERT INTO schema_migrations(version) VALUES ('058_market_ai_compatible_provider')
ON CONFLICT(version) DO NOTHING;
COMMIT;