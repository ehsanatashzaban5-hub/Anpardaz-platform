BEGIN;

-- An Market category taxonomy: parent/child structure used by web and mobile.
WITH roots AS (
  SELECT id,slug FROM market_categories WHERE parent_id IS NULL
)
INSERT INTO market_categories(parent_id,slug,name,name_fa,icon,sort_order)
SELECT r.id,v.slug,v.name,v.name_fa,v.icon,v.sort_order
FROM roots r JOIN (VALUES
('mobile-digital','mobile-phones','Mobile Phones','موبایل','smartphone',1),
('mobile-digital','tablets','Tablets','تبلت','tablet',2),
('mobile-digital','mobile-accessories','Mobile Accessories','لوازم جانبی موبایل','headphones',3),
('laptop-computer','laptops','Laptops','لپ‌تاپ','laptop',1),
('laptop-computer','computer-parts','Computer Parts','قطعات کامپیوتر','cpu',2),
('laptop-computer','monitors','Monitors','مانیتور','monitor',3),
('laptop-computer','gaming','Gaming','گیمینگ','gamepad',4),
('home-appliance','refrigerator','Refrigerator & Freezer','یخچال و فریزر','home',1),
('home-appliance','washing-machine','Washing Machines','ماشین لباسشویی','home',2),
('home-appliance','kitchen','Kitchen Appliances','لوازم آشپزخانه','home',3),
('home-appliance','vacuum','Cleaning Appliances','نظافت و جاروبرقی','home',4),
('supermarket','food','Food','مواد غذایی','shopping-cart',1),
('supermarket','beverages','Beverages','نوشیدنی','coffee',2),
('supermarket','personal-care','Personal Care','بهداشت شخصی','heart',3),
('fashion','women-clothing','Women Clothing','پوشاک زنانه','shirt',1),
('fashion','men-clothing','Men Clothing','پوشاک مردانه','shirt',2),
('fashion','kids-clothing','Kids Clothing','پوشاک کودک','baby',3),
('fashion','shoes-bags','Shoes & Bags','کفش و کیف','shopping-bag',4),
('beauty-health','skincare','Skincare','مراقبت پوست','heart',1),
('beauty-health','haircare','Haircare','مراقبت مو','heart',2),
('beauty-health','makeup','Makeup','آرایش','heart',3),
('audio-video','tv','TV','تلویزیون','tv',1),
('audio-video','headphones','Headphones & Earbuds','هدفون و هندزفری','headphones',2),
('audio-video','speakers','Speakers','اسپیکر','volume-2',3),
('automotive','car-parts','Car Parts','قطعات خودرو','tool',1),
('automotive','car-accessories','Car Accessories','لوازم خودرو','car',2),
('sports','fitness','Fitness','بدنسازی و تناسب اندام','activity',1),
('sports','outdoor','Outdoor Sports','ورزش و سفر','map',2),
('baby-kids','baby-care','Baby Care','مراقبت کودک','baby',1),
('baby-kids','toys','Toys','اسباب‌بازی','gamepad',2),
('books-culture','books','Books','کتاب','book',1),
('books-culture','stationery','Stationery','لوازم‌التحریر','briefcase',2),
('tools-industrial','hand-tools','Hand Tools','ابزار دستی','tool',1),
('tools-industrial','power-tools','Power Tools','ابزار برقی','tool',2),
('travel-camping','camping','Camping','کمپینگ','map',1),
('travel-camping','travel-accessories','Travel Accessories','لوازم سفر','map',2),
('pet','pet-food','Pet Food','غذای حیوانات','paw',1),
('pet','pet-accessories','Pet Accessories','لوازم حیوانات','paw',2),
('office','office-equipment','Office Equipment','تجهیزات اداری','briefcase',1),
('office','stationery','Office Stationery','لوازم اداری','briefcase',2),
('jewelry-gold','gold-jewelry','Gold Jewelry','طلای زینتی','gem',1),
('jewelry-gold','jewelry','Jewelry','جواهرات','gem',2)
) v(root_slug,slug,name,name_fa,icon,sort_order) ON v.root_slug=r.slug
ON CONFLICT(slug) DO NOTHING;

INSERT INTO schema_migrations(version)
VALUES ('035_market_taxonomy')
ON CONFLICT(version) DO NOTHING;

COMMIT;
