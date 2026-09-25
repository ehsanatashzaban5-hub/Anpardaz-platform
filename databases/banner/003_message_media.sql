BEGIN;
ALTER TABLE banner_inquiry_messages ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text' CHECK(message_type IN ('text','image','offer','sticker','voice'));
ALTER TABLE banner_inquiry_messages ADD COLUMN IF NOT EXISTS media_data BYTEA;
ALTER TABLE banner_inquiry_messages ADD COLUMN IF NOT EXISTS media_mime TEXT;
ALTER TABLE banner_inquiry_messages ADD COLUMN IF NOT EXISTS offer_amount NUMERIC(24,8);
INSERT INTO schema_migrations(version) VALUES('003_message_media') ON CONFLICT(version) DO NOTHING;
COMMIT;
