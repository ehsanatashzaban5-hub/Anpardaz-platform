BEGIN;
INSERT INTO market_category_aliases(source_key,category_id,priority)
SELECT v.source_key,c.id,v.priority FROM (VALUES
('health-medical','health-medical',10),('medical','health-medical',10),('سلامت','health-medical',10),
('toy','toys-games',10),('toys','toys-games',10),('اسباب بازی','toys-games',10),
('building','building-home',10),('construction','building-home',10),('ساختمان','building-home',10),
('store equipment','store-equipment',10),('store-equipment','store-equipment',10),('لوازم فروشگاهی','store-equipment',10)
) v(source_key,slug,priority) JOIN market_categories c ON c.slug=v.slug
ON CONFLICT(source_key) DO UPDATE SET category_id=EXCLUDED.category_id,priority=EXCLUDED.priority,active=true;
INSERT INTO schema_migrations(version) VALUES ('046_market_mobile_taxonomy_aliases')
ON CONFLICT(version) DO NOTHING;
COMMIT;