INSERT INTO ai_providers(name,provider_type,base_url,enabled,priority,model_policy,secret_ref) VALUES
('openai','openai','https://api.openai.com/v1',TRUE,10,'{"default_model":"gpt-5.6-luna","env_key":"OPENAI_API_KEY"}','OPENAI_API_KEY'),
('gemini','gemini','https://generativelanguage.googleapis.com',TRUE,20,'{"default_model":"gemini-2.5-flash","env_key":"GEMINI_API_KEY"}','GEMINI_API_KEY')
ON CONFLICT(name) DO UPDATE SET model_policy=EXCLUDED.model_policy,secret_ref=EXCLUDED.secret_ref;
INSERT INTO ai_workflows(code,description,enabled,require_human_review,provider_policy) VALUES
('market.assist','An Market product assistance',TRUE,TRUE,'{"providers":["openai","gemini"]}'),
('market.compare','An Market product comparison',TRUE,FALSE,'{"providers":["openai","gemini"]}'),
('market.classify','An Market product classification',TRUE,TRUE,'{"providers":["openai","gemini"]}')
ON CONFLICT(code) DO UPDATE SET enabled=TRUE,provider_policy=EXCLUDED.provider_policy;
INSERT INTO ai_prompt_versions(workflow_id,version,system_prompt,user_template)
SELECT id,1,'You are an An Pardaz domain AI assistant. Return only the requested structured output. Do not invent facts.','Process the following input:\n{{input}}'
FROM ai_workflows WHERE code IN ('market.assist','market.compare','market.classify')
ON CONFLICT(workflow_id,version) DO NOTHING;

INSERT INTO schema_migrations(version) VALUES ('004_ai_foundation') ON CONFLICT(version) DO NOTHING;
