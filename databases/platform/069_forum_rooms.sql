BEGIN;

CREATE TABLE IF NOT EXISTS forum_rooms (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category_id BIGINT REFERENCES categories(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_room_members (
  room_id BIGINT NOT NULL REFERENCES forum_rooms(id) ON DELETE CASCADE,
  identity_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY(room_id,identity_id)
);

CREATE TABLE IF NOT EXISTS forum_room_messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id BIGINT NOT NULL REFERENCES forum_rooms(id) ON DELETE CASCADE,
  identity_id UUID NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible' CHECK(status IN ('visible','hidden','deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_room_messages_room_created ON forum_room_messages(room_id,created_at DESC);
INSERT INTO forum_rooms(name,slug,description)
VALUES
('گفت‌وگوی ارز دیجیتال','crypto','بحث و تبادل نظر درباره بازار رمزارز'),
('تحلیل و آموزش','education','پرسش و پاسخ آموزشی ارز دیجیتال و فارکس'),
('بازار و اقتصاد جهان','world-economy','بحث درباره اقتصاد و بازارهای جهانی')
ON CONFLICT(slug) DO NOTHING;

INSERT INTO schema_migrations(version)
VALUES ('069_forum_rooms')
ON CONFLICT(version) DO NOTHING;

COMMIT;
