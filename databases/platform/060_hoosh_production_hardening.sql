BEGIN;

-- An Hoosh production hardening: model catalog, project integrity and operational audit indexes.
ALTER TABLE hoosh_projects
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_hoosh_project_conversations_conversation
  ON hoosh_project_conversations(conversation_id);

CREATE INDEX IF NOT EXISTS idx_hoosh_messages_conversation_created
  ON hoosh_messages(conversation_id, created_at, id);

CREATE INDEX IF NOT EXISTS idx_hoosh_usage_identity_created
  ON hoosh_usage(identity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hoosh_requests_identity_created
  ON hoosh_requests(identity_id, created_at DESC);

-- Provider configuration is data-driven. No provider credentials are stored here.
UPDATE ai_providers
SET model_policy = jsonb_set(
  COALESCE(model_policy,'{}'::jsonb),
  '{allowed_models}',
  CASE name
    WHEN 'openai' THEN '["gpt-5.6-luna"]'::jsonb
    WHEN 'gemini' THEN '["gemini-2.5-flash","gemini-2.5-pro"]'::jsonb
    WHEN 'anthropic' THEN '["claude-sonnet"]'::jsonb
    ELSE COALESCE(model_policy->'allowed_models','[]'::jsonb)
  END,
  true
)
WHERE name IN ('openai','gemini','anthropic');

INSERT INTO schema_migrations(version)
VALUES ('060_hoosh_production_hardening')
ON CONFLICT(version) DO NOTHING;

COMMIT;
