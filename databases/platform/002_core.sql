BEGIN;

CREATE TABLE IF NOT EXISTS platform_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  external_user_id TEXT NOT NULL UNIQUE,
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked','pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category_type TEXT NOT NULL CHECK (category_type IN ('banner','market','forum','content')),
  parent_id BIGINT REFERENCES categories(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_threads (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES platform_users(id),
  category_id BIGINT REFERENCES categories(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  thread_id BIGINT NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES platform_users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news_articles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  author_user_id BIGINT REFERENCES platform_users(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banner_listings_category_status ON banner_listings(category_id, status);
CREATE INDEX IF NOT EXISTS idx_forum_threads_category_created ON forum_threads(category_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_thread_created ON forum_posts(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_news_articles_status_published ON news_articles(status, published_at DESC);

INSERT INTO schema_migrations (version)
VALUES ('002_core')
ON CONFLICT (version) DO NOTHING;

COMMIT;
