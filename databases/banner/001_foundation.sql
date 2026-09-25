BEGIN;
CREATE TABLE IF NOT EXISTS schema_migrations(version TEXT PRIMARY KEY,applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW());

CREATE TABLE IF NOT EXISTS banner_categories(
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_id BIGINT REFERENCES banner_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS banner_profiles(
  identity_id UUID PRIMARY KEY,
  display_name TEXT,
  phone TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS banner_listings(
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID NOT NULL,
  category_id BIGINT NOT NULL REFERENCES banner_categories(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(24,8) CHECK(price>=0),
  currency CHAR(3) NOT NULL DEFAULT 'IRR',
  condition TEXT NOT NULL DEFAULT 'used',
  city TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','published','rejected','paused','sold','archived','deleted')),
  moderation_reason TEXT,
  views BIGINT NOT NULL DEFAULT 0 CHECK(views>=0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS banner_media(
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  listing_id BIGINT NOT NULL REFERENCES banner_listings(id) ON DELETE CASCADE,
  identity_id UUID NOT NULL,
  mime_type TEXT NOT NULL,
  filename TEXT NOT NULL,
  data BYTEA NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS banner_favorites(
  identity_id UUID NOT NULL,
  listing_id BIGINT NOT NULL REFERENCES banner_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(identity_id,listing_id)
);

CREATE TABLE IF NOT EXISTS banner_inquiries(
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  listing_id BIGINT NOT NULL REFERENCES banner_listings(id) ON DELETE CASCADE,
  buyer_identity_id UUID NOT NULL,
  seller_identity_id UUID NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','replied','closed','blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS banner_inquiry_messages(
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  inquiry_id BIGINT NOT NULL REFERENCES banner_inquiries(id) ON DELETE CASCADE,
  sender_identity_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS banner_tickets(
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','pending','resolved','closed')),
  assigned_admin_identity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS banner_ticket_messages(
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES banner_tickets(id) ON DELETE CASCADE,
  sender_identity_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK(sender_type IN ('user','admin','system')),
  body TEXT NOT NULL,
  internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS banner_activity_events(
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  request_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS banner_audit_logs(
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id UUID,
  actor_identity_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  request_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banner_listings_status_created ON banner_listings(status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_banner_listings_identity_created ON banner_listings(identity_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_banner_listings_category_status ON banner_listings(category_id,status);
CREATE INDEX IF NOT EXISTS idx_banner_media_listing ON banner_media(listing_id,sort_order);
CREATE INDEX IF NOT EXISTS idx_banner_favorites_identity ON banner_favorites(identity_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_banner_inquiries_participants ON banner_inquiries(buyer_identity_id,seller_identity_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_banner_tickets_identity ON banner_tickets(identity_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_banner_tickets_status ON banner_tickets(status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_banner_activity_identity ON banner_activity_events(identity_id,occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_banner_activity_type ON banner_activity_events(event_type,occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_banner_audit_identity ON banner_audit_logs(identity_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_banner_audit_resource ON banner_audit_logs(resource_type,resource_id,created_at DESC);

INSERT INTO banner_categories(name,slug,sort_order) VALUES
('املاک','real-estate',10),('خودرو','vehicles',20),('موبایل و تبلت','mobile-tablet',30),('کالای دیجیتال','digital',40),('خانه و آشپزخانه','home',50),('لوازم شخصی','personal',60),('سرگرمی و فراغت','leisure',70),('خدمات','services',80),('استخدام و کاریابی','jobs',90),('صنعتی و کشاورزی','industrial',100),('حیوانات','animals',110),('سایر','other',120)
ON CONFLICT(slug) DO NOTHING;

INSERT INTO schema_migrations(version) VALUES('001_foundation') ON CONFLICT(version) DO NOTHING;
COMMIT;
