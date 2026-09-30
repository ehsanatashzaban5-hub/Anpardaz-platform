BEGIN;

-- Operational control-plane data. Financial source-of-truth remains in the
-- domain/accounting layer; these records provide cross-platform traceability.

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user','admin','service','system','ai')),
  actor_identity_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  request_id TEXT,
  reason TEXT,
  ip_address INET,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES platform_users(id),
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','pending','resolved','closed')),
  assigned_to BIGINT REFERENCES platform_users(id),
  external_reference TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user','agent','admin','system')),
  sender_user_id BIGINT REFERENCES platform_users(id),
  body TEXT NOT NULL,
  internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_activity_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID NOT NULL,
  service TEXT NOT NULL,
  event_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  request_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_metadata (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  article_id BIGINT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  seo_title TEXT,
  meta_description TEXT,
  canonical_url TEXT,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  source_url TEXT,
  source_name TEXT,
  ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  editorial_status TEXT NOT NULL DEFAULT 'pending' CHECK (editorial_status IN ('pending','approved','rejected')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id)
);

CREATE TABLE IF NOT EXISTS ai_jobs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID,
  job_type TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','succeeded','failed','cancelled')),
  input_ref TEXT,
  output_ref TEXT,
  usage JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('in_app','push','sms','email')),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','read','failed')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_identity_created ON audit_logs(identity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_created ON audit_logs(resource_type, resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_status ON support_tickets(user_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_priority ON support_tickets(status, priority, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_created ON support_messages(ticket_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_identity_occurred ON user_activity_events(identity_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status_created ON ai_jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_identity_status ON notifications(identity_id, status, created_at DESC);

INSERT INTO schema_migrations (version)
VALUES ('006_operations')
ON CONFLICT (version) DO NOTHING;

COMMIT;
