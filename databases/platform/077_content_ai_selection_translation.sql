BEGIN;
INSERT INTO ai_workflows(code,description,enabled,require_human_review,provider_policy)
VALUES
('news.select','Rank incoming stories by editorial relevance, freshness and user interest without inventing facts',TRUE,FALSE,'{"providers":["openai","gemini"],"max_retries":1}'),
('news.translate','Translate source facts to Persian before editorial rewriting',TRUE,TRUE,'{"providers":["openai","gemini"],"max_retries":1}')
ON CONFLICT(code) DO UPDATE SET enabled=TRUE,provider_policy=EXCLUDED.provider_policy;
INSERT INTO ai_prompt_versions(workflow_id,version,system_prompt,user_template)
SELECT id,1,'Return ONLY JSON. Rank only the supplied stories. Do not invent events or facts. Score each story 0-100 using freshness, relevance, significance, uniqueness and source quality.','Rank these candidate stories and return {"items":[{"id":"...","score":0,"reason":"..."}]}:\n{{input}}'
FROM ai_workflows WHERE code='news.select'
ON CONFLICT(workflow_id,version) DO NOTHING;
INSERT INTO ai_prompt_versions(workflow_id,version,system_prompt,user_template)
SELECT id,1,'Translate factual source material into accurate Persian. Preserve names, numbers, dates, uncertainty and attribution. Do not add facts. Return ONLY JSON with language,translatedText,notes.','Translate this source material to Persian:\n{{input}}'
FROM ai_workflows WHERE code='news.translate'
ON CONFLICT(workflow_id,version) DO NOTHING;
INSERT INTO schema_migrations(version) VALUES('077_content_ai_selection_translation') ON CONFLICT(version) DO NOTHING;
COMMIT;