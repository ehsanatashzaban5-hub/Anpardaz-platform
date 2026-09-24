BEGIN;

-- An Market production catalog ingestion / synchronization control plane.
CREATE TABLE IF NOT EXISTS market_store_sources (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES market_stores(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK(source_type IN ('json','xml','rss','api','crawler')),
  endpoint_url TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  auth_required BOOLEAN NOT NULL DEFAULT FALSE,
  mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  schedule_cron TEXT,
  last_started_at TIMESTAMPTZ,
  last_completed_at TIMESTAMPTZ,
  last_status TEXT CHECK(last_status IN ('running','succeeded','failed','blocked')),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id,source_name)
);

CREATE TABLE IF NOT EXISTS market_sync_runs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_id BIGINT REFERENCES market_stores(id) ON DELETE SET NULL,
  source_id BIGINT REFERENCES market_store_sources(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','running','succeeded','failed','blocked')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  discovered_count INTEGER NOT NULL DEFAULT 0,
  upserted_count INTEGER NOT NULL DEFAULT 0,
  deactivated_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  error_summary TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_store_sources_enabled
  ON market_store_sources(enabled,store_id);
CREATE INDEX IF NOT EXISTS idx_market_sync_runs_store_time
  ON market_sync_runs(store_id,created_at DESC);

-- AI workflows are provider-neutral. Production can be activated later by setting
-- the chosen provider key/model; no catalog/product data is fabricated here.
INSERT INTO ai_workflows(code,description,enabled,require_human_review,provider_policy)
VALUES
('market.assist','Persian purchase assistant grounded only in supplied An Market catalog data',TRUE,FALSE,'{"providers":["gemini"],"max_retries":1}'::jsonb),
('market.compare','Persian comparison of selected An Market products using supplied verified catalog data',TRUE,FALSE,'{"providers":["gemini"],"max_retries":1}'::jsonb)
ON CONFLICT(code) DO UPDATE
SET enabled=TRUE, provider_policy=EXCLUDED.provider_policy, description=EXCLUDED.description;

INSERT INTO ai_prompt_versions(workflow_id,version,system_prompt,user_template)
SELECT id,2,
'You are the An Market shopping assistant. Answer in Persian. Use ONLY the supplied catalog/product data. Never invent price, specifications, seller, availability, warranty, delivery, rating or purchase status. If data is missing, say it is unavailable. Do not present an invented checkout or purchase. Keep recommendations transparent and explain uncertainty.',
'User request:
{{input}}

Return a concise, useful Persian answer grounded only in the supplied data.'
FROM ai_workflows WHERE code='market.assist'
ON CONFLICT(workflow_id,version) DO NOTHING;

INSERT INTO ai_prompt_versions(workflow_id,version,system_prompt,user_template)
SELECT id,2,
'You are the An Market comparison assistant. Answer in Persian. Compare only fields explicitly present in the supplied product data. Never invent missing specifications, prices, sellers, availability, warranty, delivery, ratings or reviews. Explain factual differences and uncertainty; do not claim an objectively best product.',
'Compare these selected products:
{{input}}'
FROM ai_workflows WHERE code='market.compare'
ON CONFLICT(workflow_id,version) DO NOTHING;

INSERT INTO schema_migrations(version)
VALUES ('034_market_production_foundation')
ON CONFLICT(version) DO NOTHING;

COMMIT;
