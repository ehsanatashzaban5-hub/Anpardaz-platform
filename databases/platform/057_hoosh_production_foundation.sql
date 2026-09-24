BEGIN;

ALTER TABLE hoosh_requests
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lease_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS requested_model TEXT,
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'chat';

CREATE UNIQUE INDEX IF NOT EXISTS uq_hoosh_requests_idempotency
  ON hoosh_requests(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hoosh_requests_queue
  ON hoosh_requests(status, created_at, lease_until);

ALTER TABLE hoosh_conversations
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'chat',
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS hoosh_projects (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  model TEXT,
  mode TEXT NOT NULL DEFAULT 'chat',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hoosh_project_conversations (
  project_id BIGINT NOT NULL REFERENCES hoosh_projects(id) ON DELETE CASCADE,
  conversation_id BIGINT NOT NULL REFERENCES hoosh_conversations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(project_id, conversation_id)
);

CREATE INDEX IF NOT EXISTS idx_hoosh_projects_identity_updated
  ON hoosh_projects(identity_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS hoosh_settings (
  identity_id UUID PRIMARY KEY,
  preferred_provider TEXT,
  preferred_model TEXT,
  temperature NUMERIC(4,3) CHECK(temperature >= 0 AND temperature <= 2),
  max_output_tokens INTEGER CHECK(max_output_tokens BETWEEN 256 AND 32768),
  language TEXT NOT NULL DEFAULT 'fa',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO admin_permissions(role,permission) VALUES
('admin','hoosh.read'),('admin','hoosh.manage'),
('super_admin','hoosh.read'),('super_admin','hoosh.manage'),
('operator','hoosh.read'),('operator','hoosh.manage'),
('support','hoosh.read')
ON CONFLICT(role,permission) DO NOTHING;

INSERT INTO schema_migrations(version)
VALUES ('057_hoosh_production_foundation')
ON CONFLICT(version) DO NOTHING;

COMMIT;
