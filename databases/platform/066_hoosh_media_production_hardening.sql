BEGIN;

ALTER TABLE hoosh_media_jobs
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_hoosh_media_identity_idempotency
  ON hoosh_media_jobs(identity_id,idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hoosh_media_identity_status_created
  ON hoosh_media_jobs(identity_id,status,created_at DESC);

-- Keep the media catalog server-controlled and aligned with current Gemini production IDs.
UPDATE ai_providers
SET model_policy = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(model_policy,'{}'::jsonb),
      '{allowed_models}',
      '["gemini-3.8-flash","gemini-3.1-flash-image","gemini-3-pro-image","gemini-3.1-flash-lite-image","veo-3.1-generate-preview","veo-3.1-fast-generate-preview","veo-3.1-lite-generate-preview","lyria-3.5","lyria-3-clip-preview","gemini-3.8-flash-tts","gemini-3.8-flash-lite-tts"]'::jsonb,
      true
    ),
    '{capabilities}',
    '{"gemini-3.8-flash":["text"],"gemini-3.1-flash-image":["image"],"gemini-3-pro-image":["image"],"gemini-3.1-flash-lite-image":["image"],"veo-3.1-generate-preview":["video"],"veo-3.1-fast-generate-preview":["video"],"veo-3.1-lite-generate-preview":["video"],"lyria-3.5":["music"],"lyria-3-clip-preview":["music"],"gemini-3.8-flash-tts":["voice"],"gemini-3.8-flash-lite-tts":["voice"]}'::jsonb,
    true
  ),
  '{default_model}',
  '"gemini-3.8-flash"'::jsonb,
  true
)
WHERE name='gemini';

INSERT INTO schema_migrations(version)
VALUES ('066_hoosh_media_production_hardening')
ON CONFLICT(version) DO NOTHING;

COMMIT;
