BEGIN;
CREATE TABLE IF NOT EXISTS content_likes(
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 identity_id UUID NOT NULL,
 content_type TEXT NOT NULL CHECK(content_type IN ('article','video')),
 content_id BIGINT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(identity_id,content_type,content_id)
);
CREATE TABLE IF NOT EXISTS content_comments(
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 identity_id UUID NOT NULL,
 content_type TEXT NOT NULL CHECK(content_type IN ('article','video')),
 content_id BIGINT NOT NULL,
 body TEXT NOT NULL CHECK(char_length(trim(body)) BETWEEN 1 AND 5000),
 status TEXT NOT NULL DEFAULT 'visible' CHECK(status IN ('visible','pending','hidden','deleted')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_content_likes_content ON content_likes(content_type,content_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_content ON content_comments(content_type,content_id,status,created_at DESC);
INSERT INTO content_sources(source_type,name,source_url,category,enabled,fetch_interval_seconds) VALUES
('rss','BBC World','https://feeds.bbci.co.uk/news/world/rss.xml','world-news',TRUE,900),
('rss','Al Jazeera World','https://www.aljazeera.com/xml/rss/all.xml','world-news',TRUE,900),
('rss','Deutsche Welle World','https://rss.dw.com/rdf/rss-en-world','world-news',TRUE,900),
('rss','France 24 World','https://www.france24.com/en/rss','world-news',TRUE,900),
('rss','The Guardian World','https://www.theguardian.com/world/rss','world-news',TRUE,900),
('rss','Investing.com Forex','https://www.investing.com/rss/news_1.rss','forex-news',TRUE,900),
('rss','Investing.com Crypto','https://www.investing.com/rss/news_301.rss','crypto-news',TRUE,900),
('rss','InvestingLive','https://investinglive.com/rss/','forex-news',TRUE,300)
ON CONFLICT(source_url) DO UPDATE SET category=EXCLUDED.category,enabled=TRUE,fetch_interval_seconds=EXCLUDED.fetch_interval_seconds,updated_at=NOW();
INSERT INTO content_publication_policies(category_slug,daily_limit,auto_publish,require_review)
VALUES('world-news',5,FALSE,TRUE),('forex-news',5,FALSE,TRUE),('crypto-news',8,FALSE,TRUE)
ON CONFLICT(category_slug) DO NOTHING;
INSERT INTO schema_migrations(version) VALUES('076_content_engagement_and_world_sources') ON CONFLICT(version) DO NOTHING;
COMMIT;