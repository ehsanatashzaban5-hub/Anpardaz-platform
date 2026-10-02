BEGIN;

CREATE TABLE IF NOT EXISTS support_ticket_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  actor_identity_id UUID,
  event_type TEXT NOT NULL CHECK(event_type IN ('created','assigned','status_changed','priority_changed','message_added','linked','resolved','closed','reopened')),
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_templates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL CHECK(channel IN ('in_app','push','sms','email')),
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_providers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  provider_type TEXT NOT NULL,
  base_url TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  priority INTEGER NOT NULL DEFAULT 100,
  model_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
  secret_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_workflows (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  require_human_review BOOLEAN NOT NULL DEFAULT FALSE,
  provider_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reconciliation_runs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  service TEXT NOT NULL,
  scope TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running','matched','mismatch','failed')),
  expected_count BIGINT,
  actual_count BIGINT,
  mismatch_count BIGINT NOT NULL DEFAULT 0,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket_created ON support_ticket_events(ticket_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reconciliation_service_started ON reconciliation_runs(service,started_at DESC);

INSERT INTO notification_templates(code,channel,title_template,body_template) VALUES
('maintenance.in_app','in_app','{title}','{message}'),
('support.ticket_created','in_app','درخواست پشتیبانی ثبت شد','تیکت شما با موفقیت ثبت شد.'),
('support.ticket_reply','in_app','پاسخ پشتیبانی','پاسخ جدیدی برای تیکت شما ثبت شده است.'),
('security.login','in_app','ورود به حساب','ورود جدید به حساب شما ثبت شد.')
ON CONFLICT(code) DO NOTHING;

INSERT INTO schema_migrations(version) VALUES('010_control_plane') ON CONFLICT(version) DO NOTHING;
COMMIT;
