BEGIN;
INSERT INTO ai_providers(name,provider_type,base_url,enabled,priority,model_policy,secret_ref)
VALUES ('openai_compatible','openai_compatible',COALESCE(current_setting('app.ai_compat_base_url',true),'http://localhost'),FALSE,30,
'{"default_model":"qwen3","env_key":"AI_COMPAT_API_KEY","base_url_env":"AI_COMPAT_BASE_URL"}'::jsonb,'AI_COMPAT_API_KEY')
ON CONFLICT(name) DO UPDATE SET provider_type=EXCLUDED.provider_type,model_policy=EXCLUDED.model_policy,secret_ref=EXCLUDED.secret_ref;

UPDATE ai_workflows
SET provider_policy=jsonb_set(COALESCE(provider_policy,'{}'::jsonb),'{providers}',
  COALESCE(provider_policy->'providers','["gemini","openai"]'::jsonb) || '["openai_compatible"]'::jsonb)
WHERE code IN ('market.assist','market.compare');

INSERT INTO schema_migrations(version) VALUES ('044_market_ai_provider_adapter')
ON CONFLICT(version) DO NOTHING;
COMMIT;