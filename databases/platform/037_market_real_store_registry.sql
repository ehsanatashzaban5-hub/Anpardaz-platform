BEGIN;

-- Curated real-store registry for An Market.
-- No products/prices are seeded here. Product data must arrive from approved feeds/APIs.
INSERT INTO market_stores
  (name,slug,domain,homepage_url,category_hint,active,iframe_mode,feed_type)
VALUES
  ('دیجی‌کالا','digikala','digikala.com','https://www.digikala.com','general',TRUE,'unknown','manual'),
  ('تکنولایف','technolife','technolife.ir','https://www.technolife.ir','mobile-digital',TRUE,'unknown','manual'),
  ('مقداد آی‌تی','meghdadit','meghdadit.com','https://www.meghdadit.com','laptop-computer',TRUE,'unknown','manual'),
  ('اسنپ‌شاپ','snappshop','snappshop.ir','https://www.snappshop.ir','general',TRUE,'unknown','manual'),
  ('اکالا','okala','okala.com','https://www.okala.com','supermarket',TRUE,'unknown','manual'),
  ('خانومی','khanoumi','khanoumi.com','https://www.khanoumi.com','beauty-health',TRUE,'unknown','manual'),
  ('بانی‌مد','banimode','banimode.com','https://www.banimode.com','fashion',TRUE,'unknown','manual'),
  ('مدیسه','modiseh','modiseh.com','https://www.modiseh.com','fashion',TRUE,'unknown','manual'),
  ('شیکسون','shixon','shixon.com','https://www.shixon.com','fashion',TRUE,'unknown','manual'),
  ('مو تن رو','mootanroo','mootanroo.com','https://www.mootanroo.com','beauty-health',TRUE,'unknown','manual'),
  ('دیجی‌استایل','digistyle','digistyle.com','https://www.digistyle.com','fashion',TRUE,'unknown','manual'),
  ('بانه‌دات‌کام','baneh','baneh.com','https://www.baneh.com','home-appliance',TRUE,'unknown','manual'),
  ('زنبیل','zanbil','zanbil.ir','https://www.zanbil.ir','home-appliance',TRUE,'unknown','manual'),
  ('پلازا','plaza','plaza.ir','https://www.plaza.ir','mobile-digital',TRUE,'unknown','manual'),
  ('لیون کامپیوتر','lioncomputer','lioncomputer.ir','https://www.lioncomputer.ir','laptop-computer',TRUE,'unknown','manual'),
  ('کیمیا آنلاین','kimiaonline','kimiaonline.com','https://www.kimiaonline.com','mobile-digital',TRUE,'unknown','manual'),
  ('۱۹کالا','19kala','19kala.com','https://www.19kala.com','mobile-digital',TRUE,'unknown','manual'),
  ('شهروند','shahrvand','shahrvand.ir','https://www.shahrvand.ir','supermarket',TRUE,'unknown','manual')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name,
  domain=EXCLUDED.domain,
  homepage_url=EXCLUDED.homepage_url,
  category_hint=EXCLUDED.category_hint,
  active=EXCLUDED.active,
  updated_at=NOW();

INSERT INTO schema_migrations(version)
VALUES ('037_market_real_store_registry')
ON CONFLICT(version) DO NOTHING;

COMMIT;
