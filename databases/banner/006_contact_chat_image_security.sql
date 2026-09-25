BEGIN;

-- Every listing must keep at least one direct contact method enabled.
ALTER TABLE banner_listings
  ADD CONSTRAINT banner_listing_contact_or_chat_chk
  CHECK (contact_enabled = TRUE OR chat_enabled = TRUE) NOT VALID;

-- Chat media is deliberately limited to raster images only.
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

-- Listing media is also image-only and capped at 8 MiB.
ALTER TABLE banner_media
  ADD CONSTRAINT banner_listing_media_type_chk
  CHECK (
    mime_type IN ('image/jpeg','image/png','image/webp')
    AND octet_length(data) > 0
    AND octet_length(data) <= 8388608
  ) NOT VALID;

INSERT INTO schema_migrations(version)
VALUES ('006_contact_chat_image_security')
ON CONFLICT(version) DO NOTHING;

COMMIT;
