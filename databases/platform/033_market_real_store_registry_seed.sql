BEGIN;

INSERT INTO market_stores(name,slug,domain,homepage_url,category_hint,active,iframe_mode,feed_type,verification_status)
VALUES
('دیجی‌کالا','digikala','digikala.com','https://www.digikala.com/','multi',true,'unknown','manual','verified'),
('تکنولایف','technolife','technolife.ir','https://www.technolife.ir/','mobile-digital',true,'unknown','manual','verified'),
('خانومی','khanoumi','khanoumi.com','https://www.khanoumi.com/','beauty-health',true,'unknown','manual','verified'),
('بانی‌مد','banimode','banimode.com','https://www.banimode.com/','fashion',true,'unknown','manual','verified'),
('مدیسه','modiseh','modiseh.com','https://www.modiseh.com/','fashion',true,'unknown','manual','verified'),
('دیجی‌استایل','digistyle','digistyle.com','https://www.digistyle.com/','fashion',true,'unknown','manual','verified'),
('موتن‌رو','mootanroo','mootanroo.com','https://www.mootanroo.com/','beauty-health',true,'unknown','manual','verified'),
('اکالا','okala','okala.com','https://www.okala.com/','supermarket',true,'unknown','manual','verified'),
('مقداد آی‌تی','meghdadit','meghdadit.com','https://meghdadit.com/','laptop-computer',true,'unknown','manual','verified'),
('کیمیا آنلاین','kimiaonline','kimiaonline.com','https://www.kimiaonline.com/','mobile-digital',true,'unknown','manual','verified'),
('آل دیجیتال','alldigital','alldigitall.ir','https://www.alldigitall.ir/','mobile-digital',true,'unknown','manual','verified'),
('تهران کالا','tehrankala','tehrankala.com','https://www.tehrankala.com/','home-appliance',true,'unknown','manual','verified'),
('شیکسون','shixon','shixon.com','https://www.shixon.com/','fashion',true,'unknown','manual','verified'),
('پلازا','plaza','plaza.ir','https://www.plaza.ir/','mobile-digital',true,'unknown','manual','verified'),
('مالتینا','malltina','malltina.com','https://malltina.com/','multi',true,'unknown','manual','verified'),
('ایران کتاب','iranketab','iranketab.ir','https://www.iranketab.ir/','books-culture',true,'unknown','manual','verified'),
('باسلام','basalam','basalam.com','https://basalam.com/','multi',true,'unknown','manual','verified'),
('داروکده','darukade','darukade.com','https://www.darukade.com/','beauty-health',true,'unknown','manual','verified'),
('داروبیار','darubiar','darubiar.com','https://www.darubiar.com/','beauty-health',true,'unknown','manual','verified'),
('لافارر','lafarrerr','lafarrerr.com','https://lafarrerr.com/','beauty-health',true,'unknown','manual','verified')
ON CONFLICT(domain) DO UPDATE SET
  name=EXCLUDED.name,
  homepage_url=EXCLUDED.homepage_url,
  category_hint=EXCLUDED.category_hint,
  verification_status='verified',
  updated_at=NOW();

INSERT INTO schema_migrations(version)
VALUES ('033_market_real_store_registry_seed')
ON CONFLICT(version) DO NOTHING;

COMMIT;