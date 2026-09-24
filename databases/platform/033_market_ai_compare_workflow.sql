BEGIN;

INSERT INTO ai_workflows(code,description,enabled,require_human_review,provider_policy)
VALUES
('market.compare','Compare selected marketplace products using verified catalog data only',TRUE,FALSE,'{"providers":["gemini","openai"],"max_retries":1}'::jsonb)
ON CONFLICT(code) DO UPDATE SET provider_policy=EXCLUDED.provider_policy,enabled=TRUE;

INSERT INTO ai_prompt_versions(workflow_id,version,system_prompt,user_template)
SELECT id,1,
'You are An Market purchase-assistance AI. Use only the supplied product data. Do not invent prices, specifications, sellers, availability, warranties, reviews, or purchase outcomes. Explain factual differences and uncertainty in Persian. Do not claim that one product is objectively best. Return concise structured Persian text.',
'Compare these products for the user request below. Product data:\n{{input}}'
FROM ai_workflows WHERE code='market.compare'
ON CONFLICT(workflow_id,version) DO NOTHING;

INSERT INTO schema_migrations(version)
VALUES ('033_market_ai_compare_workflow')
ON CONFLICT(version) DO NOTHING;

COMMIT;