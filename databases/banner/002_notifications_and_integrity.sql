BEGIN;
CREATE TABLE IF NOT EXISTS banner_notifications(
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('message','offer','view','favorite','system','price-alert','support-reply')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_banner_notifications_identity_created ON banner_notifications(identity_id,created_at DESC);
ALTER TABLE banner_listings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE banner_listings ADD COLUMN IF NOT EXISTS contact_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE banner_listings ADD COLUMN IF NOT EXISTS chat_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE banner_listings ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_banner_listings_expiry ON banner_listings(expires_at) WHERE expires_at IS NOT NULL;
INSERT INTO schema_migrations(version) VALUES('002_notifications_and_integrity') ON CONFLICT(version) DO NOTHING;
COMMIT;
