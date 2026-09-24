BEGIN;
UPDATE ai_prompt_versions
SET user_template='{{input}}',
    enabled=TRUE
WHERE workflow_id=(SELECT id FROM ai_workflows WHERE code='hoosh.chat')
  AND version=2;
INSERT INTO schema_migrations(version) VALUES ('059_hoosh_prompt_template_fix') ON CONFLICT(version) DO NOTHING;
COMMIT;
