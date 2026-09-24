BEGIN;
WITH v(source_key,slug,priority) AS (
 VALUES
 ('mobile','mobile-digital',10),('smartphone','mobile-digital',10),('موبایل','mobile-digital',10),('phone','mobile-digital',10),
 ('laptop','laptop-computer',10),('computer','laptop-computer',10),('لپ تاپ','laptop-computer',10),('کامپیوتر','laptop-computer',10),
 ('refrigerator','home-appliance',10),('washing machine','home-appliance',10),('لوازم خانگی','home-appliance',10),
 ('supermarket','supermarket',10),('grocery','supermarket',10),('مواد غذایی','supermarket',10),
 ('fashion','fashion',10),('clothing','fashion',10),('پوشاک','fashion',10),
 ('cosmetic','beauty-health',10),('beauty','beauty-health',10),('آرایشی','beauty-health',10),('بهداشتی','beauty-health',10),
 ('tv','audio-video',10),('headphone','audio-video',10),('audio','audio-video',10),
 ('car','automotive',10),('automotive','automotive',10),('خودرو','automotive',10),
 ('sport','sports',10),('fitness','sports',10),('ورزش','sports',10),
 ('baby','baby-kids',10),('toy','toys-games',10),('کودک','baby-kids',10),
 ('book','books-culture',10),('books','books-culture',10),('کتاب','books-culture',10),
 ('tool','tools-industrial',10),('industrial','tools-industrial',10),('ابزار','tools-industrial',10),
 ('camp','travel-camping',10),('travel','travel-camping',10),('کمپینگ','travel-camping',10),
 ('pet','pet',10),('حیوانات','pet',10),
 ('stationery','office',10),('office','office',10),('لوازم التحریر','office',10),
 ('jewelry','jewelry-gold',10),('gold','jewelry-gold',10),('طلا','jewelry-gold',10),
 ('health-medical','health-medical',10),('medical','health-medical',10),('سلامت','health-medical',10),
 ('toys','toys-games',10),('اسباب بازی','toys-games',10),
 ('building','building-home',10),('construction','building-home',10),('ساختمان','building-home',10),
 ('store equipment','store-equipment',10),('store-equipment','store-equipment',10),('لوازم فروشگاهی','store-equipment',10)
)
INSERT INTO market_category_aliases(source_key,category_id,priority)
SELECT v.source_key,c.id,v.priority FROM v JOIN market_categories c ON c.slug=v.slug
ON CONFLICT(source_key) DO UPDATE SET category_id=EXCLUDED.category_id,priority=EXCLUDED.priority,active=true;

INSERT INTO schema_migrations(version) VALUES ('051_market_taxonomy_aliases_repair')
ON CONFLICT(version) DO NOTHING;
COMMIT;
