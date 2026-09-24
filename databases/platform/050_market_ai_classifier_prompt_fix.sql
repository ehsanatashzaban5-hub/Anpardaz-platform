BEGIN;
UPDATE ai_prompt_versions
SET user_template='Classify this JSON using only the supplied category list:
{{input}}'
WHERE workflow_id=(SELECT id FROM ai_workflows WHERE code='market.classify') AND version=1;
INSERT INTO schema_migrations(version) VALUES ('050_market_ai_classifier_prompt_fix')
ON CONFLICT(version) DO NOTHING;
COMMIT;
