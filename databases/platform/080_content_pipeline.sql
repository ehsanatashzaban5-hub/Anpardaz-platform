BEGIN;

CREATE TABLE IF NOT EXISTS content_sources (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_type TEXT NOT NULL CHECK (source_type IN ('rss','api','url','manual')),
  name TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  category TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  fetch_interval_seconds INTEGER NOT NULL DEFAULT 900 CHECK (fetch_interval_seconds BETWEEN 60 AND 86400),
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_ingestion_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_id BIGINT NOT NULL REFERENCES content_sources(id) ON DELETE CASCADE,
  external_id TEXT,
  source_url TEXT NOT NULL,
  source_title TEXT,
  raw_content TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','processing','rewritten','published','rejected','failed','duplicate')),
  article_id BIGINT REFERENCES news_articles(id),
  error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  UNIQUE(source_id,content_hash)
);

CREATE TABLE IF NOT EXISTS content_ai_runs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ingestion_item_id BIGINT NOT NULL REFERENCES content_ingestion_items(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model TEXT,
  prompt_version TEXT NOT NULL,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','succeeded','failed','rejected')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ingestion_source_status ON content_ingestion_items(source_id,status,received_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_article ON content_ingestion_items(article_id);
CREATE INDEX IF NOT EXISTS idx_ai_runs_status_created ON content_ai_runs(status,created_at DESC);

INSERT INTO schema_migrations(version) VALUES ('009_content_pipeline') ON CONFLICT(version) DO NOTHING;
COMMIT;
