BEGIN;

ALTER TABLE platform_users
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE TABLE IF NOT EXISTS hoosh_media_jobs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID NOT NULL,
  conversation_id BIGINT REFERENCES hoosh_conversations(id) ON DELETE SET NULL,
  project_id BIGINT REFERENCES hoosh_projects(id) ON DELETE SET NULL,
  mode TEXT NOT NULL CHECK(mode IN ('image','video','music','voice')),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','running','completed','failed','cancelled')),
  operation_name TEXT,
  mime_type TEXT,
  file_name TEXT,
  media_data BYTEA,
  text_output TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  lease_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_hoosh_media_identity_created
  ON hoosh_media_jobs(identity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hoosh_media_queue
  ON hoosh_media_jobs(status, created_at, lease_until);
CREATE INDEX IF NOT EXISTS idx_hoosh_media_conversation
  ON hoosh_media_jobs(conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS hoosh_tickets (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','pending','resolved','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hoosh_ticket_messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES hoosh_tickets(id) ON DELETE CASCADE,
  identity_id UUID,
  role TEXT NOT NULL CHECK(role IN ('user','support','system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hoosh_tickets_identity_updated
  ON hoosh_tickets(identity_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_hoosh_ticket_messages_ticket_created
  ON hoosh_ticket_messages(ticket_id, created_at, id);

INSERT INTO admin_permissions(role,permission) VALUES
('admin','hoosh.support.read'),('admin','hoosh.support.manage'),
('super_admin','hoosh.support.read'),('super_admin','hoosh.support.manage'),
('operator','hoosh.support.read'),('operator','hoosh.support.manage'),
('support','hoosh.support.read'),('support','hoosh.support.manage')
ON CONFLICT(role,permission) DO NOTHING;

-- Real, server-controlled Gemini multimodal catalog. No UI-invented production models.
UPDATE ai_providers
SET model_policy = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(COALESCE(model_policy,'{}'::jsonb),
        '{allowed_models}',
        '["gemini-2.5-flash","gemini-2.5-pro","gemini-3.1-flash-image","gemini-3-pro-image","gemini-3.1-flash-lite-image","gemini-2.5-flash-image","veo-3.1-generate-preview","veo-3.1-fast-generate-preview","veo-3.1-lite-generate-preview","lyria-3.5","lyria-3-clip-preview","gemini-3.8-flash-tts","gemini-3.8-flash-lite-tts"]'::jsonb,
        true),
      '{capabilities}',
      '{"gemini-2.5-flash":["text"],"gemini-2.5-pro":["text"],"gemini-3.1-flash-image":["image"],"gemini-3-pro-image":["image"],"gemini-3.1-flash-lite-image":["image"],"gemini-2.5-flash-image":["image"],"veo-3.1-generate-preview":["video"],"veo-3.1-fast-generate-preview":["video"],"veo-3.1-lite-generate-preview":["video"],"lyria-3.5":["music"],"lyria-3-clip-preview":["music"],"gemini-3.8-flash-tts":["voice"],"gemini-3.8-flash-lite-tts":["voice"]}'::jsonb,
      true),
    '{labels}',
    '{"gemini-3.1-flash-image":"Gemini 3.1 Flash Image","gemini-3-pro-image":"Gemini 3 Pro Image","gemini-3.1-flash-lite-image":"Gemini 3.1 Flash Lite Image","gemini-2.5-flash-image":"Gemini 2.5 Flash Image","veo-3.1-generate-preview":"Veo 3.1","veo-3.1-fast-generate-preview":"Veo 3.1 Fast","veo-3.1-lite-generate-preview":"Veo 3.1 Lite","lyria-3.5":"Lyria 3.5","lyria-3-clip-preview":"Lyria 3 Clip","gemini-3.8-flash-tts":"Gemini 3.8 Flash TTS","gemini-3.8-flash-lite-tts":"Gemini 3.8 Flash-Lite TTS"}'::jsonb,
    true),
  '{descriptions}',
  '{"gemini-3.1-flash-image":"تولید و ویرایش تصویر","gemini-3-pro-image":"تولید تصویر حرفه‌ای","gemini-3.1-flash-lite-image":"تولید سریع تصویر","gemini-2.5-flash-image":"تولید سریع تصویر","veo-3.1-generate-preview":"تولید ویدیو با صدای بومی","veo-3.1-fast-generate-preview":"تولید سریع ویدیو با صدا","veo-3.1-lite-generate-preview":"تولید کم‌هزینه ویدیو با صدا","lyria-3.5":"تولید آهنگ کامل","lyria-3-clip-preview":"تولید کلیپ موسیقی ۳۰ ثانیه‌ای","gemini-3.8-flash-tts":"تبدیل متن به گفتار با کیفیت استودیویی","gemini-3.8-flash-lite-tts":"تبدیل سریع متن به گفتار"}'::jsonb,
  true)
WHERE name='gemini';

INSERT INTO schema_migrations(version)
VALUES ('063_hoosh_media_support')
ON CONFLICT(version) DO NOTHING;

COMMIT;
