BEGIN;

CREATE INDEX IF NOT EXISTS idx_news_slug ON news_articles(slug);
CREATE INDEX IF NOT EXISTS idx_platform_users_status_created ON platform_users(status, created_at DESC);

INSERT INTO schema_migrations (version)
VALUES ('004_content_indexes')
ON CONFLICT (version) DO NOTHING;

COMMIT;
