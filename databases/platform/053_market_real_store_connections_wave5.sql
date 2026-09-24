BEGIN;

-- 053: real-store connection wave + automatic public catalog sources.
-- Store identities are sourced from current public e-commerce directories/search
-- evidence; no products/prices are seeded. The worker only publishes data it
-- actually retrieves from a store's public endpoint/page.
INSERT INTO market_stores(name,slug,domain,homepage_url,category_hint,active,iframe_mode,feed_type,verification_status,verified_at)
VALUES
('کلیدان کادو','keyhankado','keyhankado.ir','https://keyhankado.ir/','general',TRUE,'unknown','crawler','verified',NOW()),
('لوو شاپ','lovoshop','lovoshop.ir','https://lovoshop.ir/','fashion',TRUE,'unknown','crawler','verified',NOW()),
('کافو','cofu','cofu.ir','https://cofu.ir/','supermarket',TRUE,'unknown','crawler','verified',NOW()),
('شیلر','shiller-co','shiller-co.ir','https://shiller-co.ir/','tools-industrial',TRUE,'unknown','crawler','verified',NOW()),
('RaceNet','racenet59','racenet59.ir','https://www.racenet59.ir/','sports',TRUE,'unknown','crawler','verified',NOW()),
('Universe Shop','universeshop','universeshop.ir','https://universeshop.ir/','general',TRUE,'unknown','crawler','verified',NOW()),
('مانی تک','mani-tek','mani-tek.ir','https://mani-tek.ir/','mobile-digital',TRUE,'unknown','crawler','verified',NOW()),
('آت فایر','atfire','atfire.ir','https://atfire.ir/','tools-industrial',TRUE,'unknown','crawler','verified',NOW()),
('دیجی‌استاند','digistand','digistand.ir','https://digistand.ir/','general',TRUE,'unknown','crawler','verified',NOW()),
('سیلی دای وایر','silidaywire','silidaywire.ir','https://silidaywire.ir/','tools-industrial',TRUE,'unknown','crawler','verified',NOW()),
('وراهم چرم','varahramleather','varahramleather.ir','https://varahramleather.ir/','fashion',TRUE,'unknown','crawler','verified',NOW()),
('ام‌آر پلکسی','mrplexi','mrplexi.ir','https://mrplexi.ir/','tools-industrial',TRUE,'unknown','crawler','verified',NOW()),
('WWGS','wwgs','wwgs.ir','https://wwgs.ir/','general',TRUE,'unknown','crawler','verified',NOW()),
('تکتاز','taktazgroup','taktazgroup.com','https://taktazgroup.com/','tools-industrial',TRUE,'unknown','crawler','verified',NOW()),
('دکتر اچ‌پی','drhp','drhp.ir','https://drhp.ir/','laptop-computer',TRUE,'unknown','crawler','verified',NOW()),
('جی‌ال‌ایکس','glx','glx.ir','https://glx.ir/','mobile-digital',TRUE,'unknown','crawler','verified',NOW()),
('سمیر اکسسوری','samiraccessory','samiraccessory.ir','https://samiraccessory.ir/','mobile-digital',TRUE,'unknown','crawler','verified',NOW()),
('فروش گستر','foroshgostar','foroshgostar.com','https://foroshgostar.com/','general',TRUE,'unknown','crawler','verified',NOW()),
('کاهورتب','kahoorteb','kahoorteb.ir','https://kahoorteb.ir/','beauty-health',TRUE,'unknown','crawler','verified',NOW()),
('ریتو کیدز','ritokidz','ritokidz.ir','https://ritokidz.ir/','baby-kids',TRUE,'unknown','crawler','verified',NOW()),
('آرت‌شو','artshoo','artshoo.ir','https://artshoo.ir/','arts',TRUE,'unknown','crawler','verified',NOW()),
('اکستوی','extoy','extoy.ir','https://extoy.ir/','baby-kids',TRUE,'unknown','crawler','verified',NOW()),
('کالابگیر','kalabegir','kalabegir.ir','https://kalabegir.ir/','general',TRUE,'unknown','crawler','verified',NOW()),
('دید برتر شاپ','didbartarshop','didbartarshop.ir','https://didbartarshop.ir/','general',TRUE,'unknown','crawler','verified',NOW()),
('فارنی‌وی گالری','farnivgallery','farnivgallery.ir','https://farnivgallery.ir/','jewelry-gold',TRUE,'unknown','crawler','verified',NOW()),
('فرش دیبا','farshdiba','farshdiba.ir','https://farshdiba.ir/','home-appliance',TRUE,'unknown','crawler','verified',NOW()),
('نقره معصومی','noghremasoumi','noghremasoumi.ir','https://noghremasoumi.ir/','jewelry-gold',TRUE,'unknown','crawler','verified',NOW()),
('آتاویچ ونک','atawichvanak','atawichvanak.ir','https://atawichvanak.ir/','food',TRUE,'unknown','crawler','verified',NOW()),
('شاپ‌شاپینو','shopshopino','shopshopino.ir','https://shopshopino.ir/','general',TRUE,'unknown','crawler','verified',NOW()),
('الماس طلا','eligoldgallery','eligoldgallery.com','https://eligoldgallery.com/','jewelry-gold',TRUE,'unknown','crawler','verified',NOW())
ON CONFLICT(domain) DO UPDATE SET
  name=EXCLUDED.name,
  homepage_url=EXCLUDED.homepage_url,
  category_hint=EXCLUDED.category_hint,
  active=TRUE,
  verification_status='verified',
  verified_at=COALESCE(market_stores.verified_at,NOW()),
  updated_at=NOW();

-- Give every verified production store a real public connection path.
-- WooCommerce Store API is public/read-only; JSON-LD is a standards-based
-- fallback for stores whose catalog is exposed on product/home pages.
INSERT INTO market_store_sources(store_id,source_name,source_type,endpoint_url,enabled,mapping,schedule_cron)
SELECT s.id,'public-woocommerce-store-api','api',
       'https://'||s.domain||'/wp-json/wc/store/v1/products?per_page=100&page=1',
       TRUE,'{"itemsPath":"","idField":"id","titleField":"name","descriptionField":"description","urlField":"permalink","priceField":"prices.price","gtinField":"sku"}'::jsonb,
       '*/30 * * * *'
FROM market_stores s
WHERE s.active=TRUE AND s.verification_status='verified'
ON CONFLICT(store_id,source_name) DO UPDATE SET
  endpoint_url=EXCLUDED.endpoint_url,enabled=TRUE,mapping=EXCLUDED.mapping,schedule_cron=EXCLUDED.schedule_cron,updated_at=NOW();

INSERT INTO market_store_sources(store_id,source_name,source_type,endpoint_url,enabled,mapping,schedule_cron)
SELECT s.id,'public-jsonld-catalog','crawler',s.homepage_url,TRUE,'{"itemsPath":""}'::jsonb,'15 * * * *'
FROM market_stores s
WHERE s.active=TRUE AND s.verification_status='verified'
ON CONFLICT(store_id,source_name) DO UPDATE SET
  endpoint_url=EXCLUDED.endpoint_url,enabled=TRUE,mapping=EXCLUDED.mapping,schedule_cron=EXCLUDED.schedule_cron,updated_at=NOW();

INSERT INTO schema_migrations(version)
VALUES ('053_market_real_store_connections_wave5')
ON CONFLICT(version) DO NOTHING;

COMMIT;