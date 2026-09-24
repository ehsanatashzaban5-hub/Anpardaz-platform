BEGIN;

-- Second curated wave of real An Market stores.
-- These are registry entries only; no products/prices are fabricated.
INSERT INTO market_stores
  (name,slug,domain,homepage_url,category_hint,active,iframe_mode,feed_type)
VALUES
 ('ایسام','esam','esam.ir','https://esam.ir','general',TRUE,'unknown','manual'),
 ('فیدیبو','fidibo','fidibo.com','https://fidibo.com','books-culture',TRUE,'unknown','manual'),
 ('مالتینا','malltina','malltina.com','https://malltina.com','general',TRUE,'unknown','manual'),
 ('طاقچه','taaghche','taaghche.com','https://taaghche.com','books-culture',TRUE,'unknown','manual'),
 ('لیلیوم','liliome','liliome.ir','https://liliome.ir','beauty-health',TRUE,'unknown','manual'),
 ('عطر افشان','atrafshan','atrafshan.com','https://atrafshan.com','beauty-health',TRUE,'unknown','manual'),
 ('آل دیجیتال','alldigital','alldigitall.ir','https://alldigitall.ir','mobile-digital',TRUE,'unknown','manual'),
 ('پیندو','pindo','pindo.ir','https://pindo.ir','general',TRUE,'unknown','manual'),
 ('شهر کتاب آنلاین','shahreketabonline','shahreketabonline.com','https://shahreketabonline.com','books-culture',TRUE,'unknown','manual'),
 ('گوشی‌شاپ','gooshishop','gooshishop.com','https://gooshishop.com','mobile-digital',TRUE,'unknown','manual'),
 ('ایران کتاب','iranketab','iranketab.ir','https://iranketab.ir','books-culture',TRUE,'unknown','manual')
ON CONFLICT (slug) DO UPDATE SET
 name=EXCLUDED.name,domain=EXCLUDED.domain,homepage_url=EXCLUDED.homepage_url,
 category_hint=EXCLUDED.category_hint,active=EXCLUDED.active,updated_at=NOW();

INSERT INTO schema_migrations(version)
VALUES ('038_market_real_store_registry_wave2')
ON CONFLICT(version) DO NOTHING;

COMMIT;
