BEGIN;
INSERT INTO market_categories(slug,name,name_fa,icon,sort_order)
VALUES
('health-medical','Health & Medical','سلامت و پزشکی','activity',170),
('toys-games','Toys & Games','اسباب‌بازی و سرگرمی','gamepad',180),
('building-home','Building & Home Improvement','ساختمان و دکوراسیون','home',190),
('store-equipment','Store Equipment','لوازم فروشگاهی','shopping-bag',200)
ON CONFLICT(slug) DO NOTHING;

INSERT INTO schema_migrations(version) VALUES ('045_market_mobile_taxonomy_alignment')
ON CONFLICT(version) DO NOTHING;
COMMIT;