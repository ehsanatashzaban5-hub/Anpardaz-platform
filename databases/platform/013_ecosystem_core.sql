BEGIN;

-- An Banner

-- An Market

-- Forum moderation
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'visible';
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'visible';

-- News/SEO/editorial
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES categories(id);
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER;
CREATE TABLE IF NOT EXISTS content_revisions (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,article_id BIGINT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,editor_identity_id UUID,version INTEGER NOT NULL,content JSONB NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),UNIQUE(article_id,version));

-- An Hoosh / AI assistant

-- Financial Center


INSERT INTO schema_migrations(version) VALUES('013_ecosystem_core') ON CONFLICT(version) DO NOTHING;
COMMIT;
