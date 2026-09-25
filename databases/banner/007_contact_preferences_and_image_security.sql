BEGIN;

-- Canonical An Banner contact preferences. The phone itself remains the shared
-- An Pardaz identity/profile phone; these flags only control exposure/actions.
ALTER TABLE banner_listings
  ADD COLUMN IF NOT EXISTS contact_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS chat_enabled BOOLEAN NOT NULL DEFAULT TRUE;
CREATE INDEX IF NOT EXISTS idx_banner_listings_contact_chat
  ON banner_listings(contact_enabled,chat_enabled,status);

-- Every new/updated listing must expose at least one contact channel.
ALTER TABLE banner_listings
  ADD CONSTRAINT banner_listing_contact_or_chat_chk
  CHECK (contact_enabled = TRUE OR chat_enabled = TRUE) NOT VALID;

-- Listing media is image-only and size-limited.
ALTER TABLE banner_media
  ADD CONSTRAINT banner_listing_media_type_chk
  CHECK (
    mime_type IN ('image/jpeg','image/png','image/webp')
    AND octet_length(data) > 0
    AND octet_length(data) <= 8388608
  ) NOT VALID;

-- Chat attachments are image-only and size-limited.
ALTER TABLE banner_inquiry_messages
  ADD CONSTRAINT banner_chat_media_type_chk
  CHECK (
    media_data IS NULL
    OR (
      message_type = 'image'
      AND media_mime IN ('image/jpeg','image/png','image/webp')
      AND octet_length(media_data) > 0
      AND octet_length(media_data) <= 8388608
    )
  ) NOT VALID;

INSERT INTO schema_migrations(version)
VALUES ('007_contact_preferences_and_image_security')
ON CONFLICT(version) DO NOTHING;

COMMIT;
