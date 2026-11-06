BEGIN;
ALTER TABLE banner_listings
  ADD COLUMN IF NOT EXISTS price_mode TEXT NOT NULL DEFAULT 'fixed'
  CHECK (price_mode IN ('fixed','negotiable','free','swap'));
UPDATE banner_listings
SET price_mode = CASE WHEN price IS NULL THEN 'negotiable' ELSE 'fixed' END
WHERE price_mode = 'fixed' AND price IS NULL;
ALTER TABLE banner_inquiry_messages
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE banner_activity_events
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_banner_messages_unread
  ON banner_inquiry_messages(inquiry_id, read_at, sender_identity_id, created_at);
INSERT INTO schema_migrations(version) VALUES('008_price_modes_and_message_reads')
ON CONFLICT(version) DO NOTHING;
COMMIT;
