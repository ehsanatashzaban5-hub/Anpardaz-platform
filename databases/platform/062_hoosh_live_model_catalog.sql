BEGIN;

-- An Hoosh model catalog is server-controlled. The UI must never invent or hard-code production models.
UPDATE ai_providers
SET model_policy = jsonb_set(
  jsonb_set(
    COALESCE(model_policy,'{}'::jsonb),
    '{default_model}',
    to_jsonb(CASE name
      WHEN 'openai' THEN 'gpt-5.6-luna'
      WHEN 'gemini' THEN 'gemini-2.5-flash'
      ELSE COALESCE(model_policy->>'default_model','')
    END),
    true
  ),
  '{allowed_models}',
  CASE name
    WHEN 'openai' THEN '["gpt-5.6-luna","gpt-5.6-terra","gpt-5.6-sol"]'::jsonb
    WHEN 'gemini' THEN '["gemini-2.5-flash","gemini-2.5-pro"]'::jsonb
    ELSE COALESCE(model_policy->'allowed_models','[]'::jsonb)
  END,
  true
)
WHERE name IN ('openai','gemini');

-- Provider-neutral fallback remains opt-in until credentials are configured.
INSERT INTO ai_providers(name,provider_type,base_url,enabled,priority,model_policy,secret_ref)
VALUES (
  'openai_compatible','openai_compatible',NULL,FALSE,50,
  '{"default_model":"qwen3","allowed_models":[],"env_key":"AI_COMPAT_API_KEY","base_url_env":"AI_COMPAT_BASE_URL","model_env":"AI_COMPAT_MODEL"}'::jsonb,
  'AI_COMPAT_API_KEY'
)
ON CONFLICT(name) DO NOTHING;

INSERT INTO schema_migrations(version)
VALUES ('062_hoosh_live_model_catalog')
ON CONFLICT(version) DO NOTHING;

COMMIT;
