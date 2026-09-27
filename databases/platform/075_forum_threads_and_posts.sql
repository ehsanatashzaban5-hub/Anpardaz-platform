BEGIN;

CREATE TABLE IF NOT EXISTS forum_categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_threads (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES platform_users(id) ON DELETE RESTRICT,
  category_id BIGINT REFERENCES forum_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK(char_length(trim(title)) BETWEEN 3 AND 200),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed','archived')),
  moderation_status TEXT NOT NULL DEFAULT 'visible' CHECK(moderation_status IN ('visible','hidden','deleted','pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  thread_id BIGINT NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES platform_users(id) ON DELETE RESTRICT,
  body TEXT NOT NULL CHECK(char_length(trim(body)) BETWEEN 1 AND 10000),
  moderation_status TEXT NOT NULL DEFAULT 'visible' CHECK(moderation_status IN ('visible','hidden','deleted','pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_threads_status_moderation_updated
  ON forum_threads(status,moderation_status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_threads_user_updated
  ON forum_threads(user_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_thread_created
  ON forum_posts(thread_id,created_at ASC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user_created
  ON forum_posts(user_id,created_at DESC);

INSERT INTO forum_categories(name,slug,description)
VALUES
  ('رمزارز','crypto','بحث و تبادل نظر درباره بازار رمزارز'),
  ('آموزش','education','پرسش و پاسخ آموزشی'),
  ('اقتصاد','world-economy','بحث درباره اقتصاد و بازار')
ON CONFLICT(slug) DO NOTHING;

INSERT INTO schema_migrations(version)
VALUES ('075_forum_threads_and_posts')
ON CONFLICT(version) DO NOTHING;

COMMIT;