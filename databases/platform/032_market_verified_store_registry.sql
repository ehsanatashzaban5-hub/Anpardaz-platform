BEGIN;

-- Verified initial An Market store registry.
-- This migration contains store identities only; no fabricated products/prices are inserted.
-- Feed endpoints remain NULL until their ingestion contract is verified and approved.
INSERT INTO market_stores
  (name,slug,domain,homepage_url,category_hint,active,iframe_mode,feed_type,terms_url)
VALUES
('دیجی‌کالا','digikala','digikala.com','https://www.digikala.com/','multi','true','unknown','manual','https://www.digikala.com/page/terms/'),
('تکنولایف','technolife','technolife.com','https://www.technolife.com/','mobile-digital','true','unknown','manual',NULL),
('خانومی','khanoumi','khanoumi.com','https://www.khanoumi.com/','beauty-health','true','unknown','manual',NULL),
('بانی‌مد','banimode','banimode.com','https://www.banimode.com/','fashion','true','unknown','manual',NULL),
('مقداد آی‌تی','meghdadit','meghdadit.com','https://www.meghdadit.com/','laptop-computer','true','unknown','manual',NULL),
('مدیسه','modiseh','modiseh.com','https://www.modiseh.com/','fashion','true','unknown','manual',NULL),
('شیکسون','shixon','shixon.com','https://www.shixon.com/','fashion','true','unknown','manual',NULL),
('اکالا','okala','okala.com','https://www.okala.com/','supermarket','true','unknown','manual',NULL),
('مو تن رو','mootanroo','mootanroo.com','https://www.mootanroo.com/','beauty-health','true','unknown','manual',NULL),
('دیجی‌استایل','digistyle','digistyle.com','https://www.digistyle.com/','fashion','true','unknown','manual',NULL),
('باسلام','basalam','basalam.com','https://basalam.com/','multi','true','unknown','manual',NULL),
('اسنپ‌مارکت','snapp-market','snapp.market','https://snapp.market/','supermarket','true','unknown','manual',NULL),
('ایسام','esam','esam.ir','https://esam.ir/','multi','true','unknown','manual',NULL),
('لیون کامپیوتر','lioncomputer','lioncomputer.com','https://www.lioncomputer.com/','laptop-computer','true','unknown','manual',NULL),
('کالایتک','kalatik','kalatik.com','https://kalatik.com/','mobile-digital','true','unknown','manual',NULL),
('موبایل ۱۴۰','mobile140','mobile140.com','https://mobile140.com/','mobile-digital','true','unknown','manual',NULL),
('جانبی','janebi','janebi.com','https://janebi.com/','mobile-digital','true','unknown','manual',NULL),
('۱۹کالا','19kala','19kala.com','https://www.19kala.com/','home-appliance','true','unknown','manual',NULL),
('بامیلو کالا','bamilokala','bamilokala.com','https://bamilokala.com/','multi','true','unknown','manual',NULL)
ON CONFLICT(domain) DO UPDATE SET
  name=EXCLUDED.name,
  homepage_url=EXCLUDED.homepage_url,
  category_hint=EXCLUDED.category_hint,
  updated_at=NOW();

INSERT INTO schema_migrations(version)
VALUES ('032_market_verified_store_registry')
ON CONFLICT(version) DO NOTHING;

COMMIT;
