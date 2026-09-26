BEGIN;

ALTER TABLE news_articles
  ADD COLUMN IF NOT EXISTS category_slug TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_name TEXT,
  ADD COLUMN IF NOT EXISTS source_published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'fa',
  ADD COLUMN IF NOT EXISTS original_language TEXT,
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS keywords TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hashtags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS canonical_url TEXT,
  ADD COLUMN IF NOT EXISTS ai_rewrite_run_id BIGINT,
  ADD COLUMN IF NOT EXISTS editorial_score NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS human_reviewed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_news_articles_category_published
  ON news_articles(category_slug,status,published_at DESC);

CREATE TABLE IF NOT EXISTS content_publication_policies (
  category_slug TEXT PRIMARY KEY,
  daily_limit INTEGER NOT NULL DEFAULT 5 CHECK(daily_limit BETWEEN 0 AND 500),
  auto_publish BOOLEAN NOT NULL DEFAULT FALSE,
  require_review BOOLEAN NOT NULL DEFAULT TRUE,
  source_language_policy TEXT NOT NULL DEFAULT 'translate_then_rewrite',
  updated_by BIGINT REFERENCES platform_users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_source_attributions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  article_id BIGINT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_published_at TIMESTAMPTZ,
  attribution_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id,source_url)
);

CREATE TABLE IF NOT EXISTS content_videos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  mime_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  bytes BYTEA NOT NULL,
  byte_size BIGINT NOT NULL CHECK(byte_size>0),
  duration_seconds INTEGER,
  category_slug TEXT NOT NULL DEFAULT 'video-news',
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
  created_by BIGINT REFERENCES platform_users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_content_videos_public
  ON content_videos(status,published_at DESC);

CREATE TABLE IF NOT EXISTS content_pipeline_runs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running','completed','failed')),
  fetched_count INTEGER NOT NULL DEFAULT 0,
  selected_count INTEGER NOT NULL DEFAULT 0,
  rewritten_count INTEGER NOT NULL DEFAULT 0,
  published_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_content_pipeline_run_date ON content_pipeline_runs(run_date);

INSERT INTO content_sources(source_type,name,source_url,category,fetch_interval_seconds)
VALUES
('rss','CoinDesk Crypto','https://www.coindesk.com/arc/outboundfeeds/rss/?output=1','crypto-news',900),
('rss','Cointelegraph Crypto','https://cointelegraph.com/rss','crypto-news',900),
('rss','Investing.com Financial','https://www.investing.com/rss/news_25.rss','world-news',900),
('rss','Investing.com Forex','https://www.investing.com/rss/news_1.rss','forex-news',900),
('rss','Investing.com Crypto','https://www.investing.com/rss/news_301.rss','crypto-news',900)
ON CONFLICT(source_url) DO UPDATE SET category=EXCLUDED.category,fetch_interval_seconds=EXCLUDED.fetch_interval_seconds,enabled=TRUE;

INSERT INTO content_publication_policies(category_slug,daily_limit,auto_publish,require_review)
VALUES
('crypto-news',8,FALSE,TRUE),
('world-news',5,FALSE,TRUE),
('forex-news',5,FALSE,TRUE),
('crypto-edu',3,FALSE,TRUE),
('forex-edu',3,FALSE,TRUE),
('ai-news',3,FALSE,TRUE),
('tech-news',3,FALSE,TRUE)
ON CONFLICT(category_slug) DO NOTHING;

INSERT INTO schema_migrations(version)
VALUES ('068_content_ai_seo_video_pipeline')
ON CONFLICT(version) DO NOTHING;

COMMIT;
