BEGIN;

-- An Banner
CREATE TABLE IF NOT EXISTS banner_media (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,listing_id BIGINT NOT NULL REFERENCES banner_listings(id) ON DELETE CASCADE,url TEXT NOT NULL,media_type TEXT NOT NULL CHECK(media_type IN ('image','video')),sort_order INTEGER NOT NULL DEFAULT 0,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS banner_favorites (user_id BIGINT NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,listing_id BIGINT NOT NULL REFERENCES banner_listings(id) ON DELETE CASCADE,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(user_id,listing_id));
CREATE TABLE IF NOT EXISTS banner_inquiries (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,listing_id BIGINT NOT NULL REFERENCES banner_listings(id) ON DELETE CASCADE,buyer_user_id BIGINT REFERENCES platform_users(id),message TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','replied','closed','blocked')),created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());

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

CREATE INDEX IF NOT EXISTS idx_banner_media_listing ON banner_media(listing_id,sort_order);
CREATE INDEX IF NOT EXISTS idx_banner_inquiries_listing ON banner_inquiries(listing_id,updated_at DESC);

INSERT INTO schema_migrations(version) VALUES('013_ecosystem_core') ON CONFLICT(version) DO NOTHING;
COMMIT;
