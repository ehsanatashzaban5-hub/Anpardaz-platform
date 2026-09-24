BEGIN;

INSERT INTO ai_providers(name,provider_type,base_url,enabled,priority,model_policy,secret_ref)
VALUES (
  'openai_compatible',
  'openai_compatible',
  NULL,
  FALSE,
  50,
  '{"default_model":"qwen3","env_key":"AI_COMPAT_API_KEY","base_url_env":"AI_COMPAT_BASE_URL","model_env":"AI_COMPAT_MODEL"}'::jsonb,
  'AI_COMPAT_API_KEY'
)
ON CONFLICT(name) DO UPDATE SET
  provider_type=EXCLUDED.provider_type,
  model_policy=EXCLUDED.model_policy,
  secret_ref=EXCLUDED.secret_ref;

UPDATE ai_workflows
SET provider_policy=jsonb_set(
  COALESCE(provider_policy,'{}'::jsonb),
  '{providers}',
  '["openai","gemini","openai_compatible"]'::jsonb,
  true
)
WHERE code='hoosh.chat';

INSERT INTO schema_migrations(version)
VALUES ('061_hoosh_provider_neutral')
ON CONFLICT(version) DO NOTHING;

COMMIT;
