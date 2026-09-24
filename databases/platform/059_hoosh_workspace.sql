BEGIN;

CREATE TABLE IF NOT EXISTS hoosh_projects (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  description TEXT,
  model_id TEXT,
  mode_id TEXT,
  accent_color TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hoosh_projects_identity ON hoosh_projects(identity_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS hoosh_project_conversations (
  project_id BIGINT NOT NULL REFERENCES hoosh_projects(id) ON DELETE CASCADE,
  conversation_id BIGINT NOT NULL REFERENCES hoosh_conversations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(project_id,conversation_id)
);

CREATE TABLE IF NOT EXISTS hoosh_tickets (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID NOT NULL,
  subject TEXT NOT NULL CHECK (char_length(subject) BETWEEN 3 AND 200),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','pending','answered','closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  category TEXT NOT NULL DEFAULT 'general',
  conversation_id BIGINT REFERENCES hoosh_conversations(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hoosh_tickets_identity ON hoosh_tickets(identity_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS hoosh_ticket_messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES hoosh_tickets(id) ON DELETE CASCADE,
  author_identity_id UUID,
  author_type TEXT NOT NULL CHECK (author_type IN ('user','admin','system')),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 10000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hoosh_ticket_messages_ticket ON hoosh_ticket_messages(ticket_id,created_at);

INSERT INTO schema_migrations(version) VALUES('059_hoosh_workspace') ON CONFLICT(version) DO NOTHING;
COMMIT;