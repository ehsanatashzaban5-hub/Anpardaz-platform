BEGIN;

ALTER TABLE banner_profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active'
    CHECK(account_status IN ('active','restricted','suspended','banned')),
  ADD COLUMN IF NOT EXISTS restriction_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS restriction_reason TEXT,
  ADD COLUMN IF NOT EXISTS restricted_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS violation_count INT NOT NULL DEFAULT 0 CHECK(violation_count>=0);

ALTER TABLE banner_listings
  ADD COLUMN IF NOT EXISTS ai_suggestion JSONB,
  ADD COLUMN IF NOT EXISTS ai_reviewed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS banner_violation_reports(
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reporter_identity_id UUID NOT NULL,
  reported_identity_id UUID NOT NULL,
  listing_id BIGINT REFERENCES banner_listings(id) ON DELETE SET NULL,
  inquiry_id BIGINT REFERENCES banner_inquiries(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','reviewed','dismissed','confirmed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID
);
CREATE INDEX IF NOT EXISTS idx_banner_violation_reports_reported ON banner_violation_reports(reported_identity_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_banner_violation_reports_status ON banner_violation_reports(status,created_at DESC);

CREATE TABLE IF NOT EXISTS banner_restrictions(
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID NOT NULL,
  restriction_code TEXT NOT NULL CHECK(restriction_code IN ('chat','favorite','listing','message','contact','all')),
  reason TEXT NOT NULL,
  source_report_count INT NOT NULL DEFAULT 0,
  created_by UUID,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_banner_restrictions_identity ON banner_restrictions(identity_id,created_at DESC);

CREATE TABLE IF NOT EXISTS banner_admin_message_templates(
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  restriction_code TEXT NOT NULL DEFAULT 'none' CHECK(restriction_code IN ('none','chat','favorite','listing','message','contact','all')),
  duration_hours INT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS banner_user_messages(
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID NOT NULL,
  sender_admin_identity_id UUID,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  template_id BIGINT REFERENCES banner_admin_message_templates(id) ON DELETE SET NULL,
  restriction_id BIGINT REFERENCES banner_restrictions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_banner_user_messages_identity ON banner_user_messages(identity_id,created_at DESC);

CREATE TABLE IF NOT EXISTS banner_ai_suggestions(
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID NOT NULL,
  listing_id BIGINT REFERENCES banner_listings(id) ON DELETE CASCADE,
  title_input TEXT NOT NULL,
  description_input TEXT NOT NULL,
  suggested_category_id BIGINT REFERENCES banner_categories(id),
  suggested_attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  suggested_condition TEXT,
  suggested_price NUMERIC(24,8),
  model TEXT,
  provider TEXT,
  status TEXT NOT NULL DEFAULT 'suggested' CHECK(status IN ('suggested','accepted','edited','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_banner_ai_identity_created ON banner_ai_suggestions(identity_id,created_at DESC);

CREATE TABLE IF NOT EXISTS banner_user_history_exports(
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID NOT NULL,
  requested_by UUID NOT NULL,
  format TEXT NOT NULL CHECK(format IN ('json','csv')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO banner_admin_message_templates(title,body,restriction_code,duration_hours)
SELECT * FROM (VALUES
('هشدار قوانین آن بنر','فعالیت حساب شما به دلیل گزارش‌های ثبت‌شده تحت بررسی قرار گرفته است. لطفاً قوانین آن بنر را رعایت کنید.','none',NULL),
('محدودیت چت','به دلیل تخلف ثبت‌شده، قابلیت چت حساب شما برای مدت تعیین‌شده محدود شده است.','chat',24),
('محدودیت علاقه‌مندی','به دلیل تخلف ثبت‌شده، قابلیت نشانه‌گذاری علاقه‌مندی برای حساب شما موقتاً محدود شده است.','favorite',24),
('محدودیت ثبت آگهی','به دلیل تخلف ثبت‌شده، ثبت آگهی برای حساب شما موقتاً محدود شده است.','listing',72),
('محدودیت کامل','به دلیل تخلفات مکرر، دسترسی حساب شما به قابلیت‌های آن بنر محدود شده است.','all',168)
) v(title,body,restriction_code,duration_hours)
WHERE NOT EXISTS (SELECT 1 FROM banner_admin_message_templates);

INSERT INTO schema_migrations(version) VALUES('006_moderation_ai_restrictions_history') ON CONFLICT(version) DO NOTHING;
COMMIT;
