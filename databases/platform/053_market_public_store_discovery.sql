BEGIN;

ALTER TABLE market_stores
  ADD COLUMN IF NOT EXISTS discovery_status TEXT NOT NULL DEFAULT 'not_checked'
    CHECK(discovery_status IN ('not_checked','checking','connected','blocked','failed')),
  ADD COLUMN IF NOT EXISTS discovery_method TEXT,
  ADD COLUMN IF NOT EXISTS discovery_error TEXT;

CREATE INDEX IF NOT EXISTS idx_market_stores_discovery
  ON market_stores(discovery_status,active,verification_status);

-- Three additionally verified real storefront candidates, bringing the unique
-- registry to 200 domains. They remain inactive until a permitted public feed
-- is discovered by the onboarding worker.
INSERT INTO market_stores(name,slug,domain,homepage_url,category_hint,active,iframe_mode,feed_type)
VALUES
('کالاتیک','kalatik','kalatik.com','https://kalatik.com','mobile-digital',FALSE,'unknown','crawler'),
('موبوتک','moboteek','moboteek.com','https://moboteek.com','mobile-digital',FALSE,'unknown','crawler'),
('شایان جانبی','shayanjanebi','shayanjanebi.com','https://shayanjanebi.com','mobile-digital',FALSE,'unknown','crawler')
ON CONFLICT(domain) DO NOTHING;

INSERT INTO schema_migrations(version)
VALUES ('053_market_public_store_discovery')
ON CONFLICT(version) DO NOTHING;

COMMIT;