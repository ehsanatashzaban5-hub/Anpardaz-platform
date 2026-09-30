-- SOURCE 036_market_ai_gemini_model.sql
UPDATE ai_providers
SET model_policy=jsonb_set(COALESCE(model_policy,'{}'::jsonb),'{"default_model"}','"gemini-3.8-flash"'::jsonb),
    priority=10,
    enabled=TRUE
WHERE name='gemini';


-- SOURCE 037_market_real_store_registry.sql
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


-- SOURCE 038_market_real_store_registry_wave2.sql
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


-- SOURCE 039_market_ingestion_uniques.sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_market_media_product_url
  ON market_media(product_id,url);

CREATE UNIQUE INDEX IF NOT EXISTS uq_market_offers_store_external_product
  ON market_offers(store_id,external_product_id)
  WHERE external_product_id IS NOT NULL;


-- SOURCE 040_market_store_registry_wave3.sql
-- Real-store registry expansion. Entries are inactive until An Market verifies domain, terms and a permitted feed/API.
INSERT INTO market_stores(name,slug,domain,homepage_url,category_hint,active,iframe_mode,feed_type) VALUES
('ترب','torob','torob.com','https://torob.com','general',FALSE,'unknown','manual'),
('ایمالز','emalls','emalls.ir','https://emalls.ir','general',FALSE,'unknown','manual'),
('لیپک','lipak','lipak.com','https://lipak.com','mobile-digital',FALSE,'unknown','manual'),
('یدک‌یار','yadakyar','yadakyar.com','https://yadakyar.com','automotive',FALSE,'unknown','manual'),
('تگموند','tagmond','tagmond.com','https://tagmond.com','fashion',FALSE,'unknown','manual'),
('روبان','roban','roban.ir','https://roban.ir','beauty-health',FALSE,'unknown','manual'),
('آداک','adak','adak.ir','https://adak.ir','digital',FALSE,'unknown','manual'),
('گیزدین','gizdin','gizdin.ir','https://gizdin.ir','digital',FALSE,'unknown','manual'),
('های‌شیائومی','hixiaomi','hixiaomi.ir','https://hixiaomi.ir','mobile-digital',FALSE,'unknown','manual'),
('لباسچی','lebaschi','lebaschi.com','https://lebaschi.com','fashion',FALSE,'unknown','manual'),
('برقچی','barghchi','barghchi.com','https://barghchi.com','tools-industrial',FALSE,'unknown','manual'),
('نورنگار','noornegar','noornegar.com','https://noornegar.com','audio-video',FALSE,'unknown','manual'),
('گیشا اسپرت','gishasport','gishasport.com','https://gishasport.com','sports',FALSE,'unknown','manual'),
('عطارک','attarak','attarak.com','https://attarak.com','beauty-health',FALSE,'unknown','manual'),
('دما تجهیز','damatajhiz','damatajhiz.com','https://damatajhiz.com','tools-industrial',FALSE,'unknown','manual'),
('شرف آنلاین','sharafonline','sharafonline.ir','https://sharafonline.ir','jewelry-gold',FALSE,'unknown','manual'),
('دیجی زرگر','digizargar','digizargar.com','https://digizargar.com','jewelry-gold',FALSE,'unknown','manual'),
('روبی گلد','rubygold','rubygold.ir','https://rubygold.ir','jewelry-gold',FALSE,'unknown','manual'),
('داروبوم','darooboom','darooboom.com','https://darooboom.com','beauty-health',FALSE,'unknown','manual'),
('بتادارو','betadarou','betadarou.com','https://betadarou.com','beauty-health',FALSE,'unknown','manual'),
('الانزا','elanza','elanza.com','https://elanza.com','beauty-health',FALSE,'unknown','manual'),
('کادولین','kadolin','kadolin.ir','https://kadolin.ir','beauty-health',FALSE,'unknown','manual'),
('بارجیل','barjil','barjil.com','https://barjil.com','supermarket',FALSE,'unknown','manual'),
('کاله','kalleh','kalleh.com','https://kalleh.com','supermarket',FALSE,'unknown','manual'),
('انتخاب سنتر','entekhabcenter','entekhabcenter.com','https://entekhabcenter.com','home-appliance',FALSE,'unknown','manual'),
('اگزو گیم','exogame','exogame.ir','https://exogame.ir','audio-video',FALSE,'unknown','manual'),
('مارال چرم','mymaral','mymaral.com','https://mymaral.com','fashion',FALSE,'unknown','manual'),
('آیفونچی','iphonechi','iphonechi.com','https://iphonechi.com','mobile-digital',FALSE,'unknown','manual'),
('پایتخت کتاب','paytakhtketab','paytakhteketab.com','https://paytakhteketab.com','books-culture',FALSE,'unknown','manual'),
('کتابچی','ketabchi','ketabchi.com','https://ketabchi.com','books-culture',FALSE,'unknown','manual'),
('گلد نهال','goldnahal','goldnahal.ir','https://goldnahal.ir','travel-camping',FALSE,'unknown','manual'),
('بست چاینا','bestchina','bestchina.ir','https://bestchina.ir','mobile-digital',FALSE,'unknown','manual'),
('دکورشاپ','decorshop','decorshop.ir','https://decorshop.ir','home-appliance',FALSE,'unknown','manual'),
('کافه مافی','cafimafi','cafimafi.com','https://cafimafi.com','supermarket',FALSE,'unknown','manual'),
('گیلان کشت','gilankesht','gilankesht.ir','https://gilankesht.ir','supermarket',FALSE,'unknown','manual'),
('پاییز کمپ','paeezcamp','paeezcamp.ir','https://paeezcamp.ir','travel-camping',FALSE,'unknown','manual'),
('پلی تهران','polytehran','polytehran.ir','https://polytehran.ir','tools-industrial',FALSE,'unknown','manual'),
('گلستان استیل','golestansteel','golestansteel.ir','https://golestansteel.ir','home-appliance',FALSE,'unknown','manual'),
('یواستور','yoostore','yoostore.ir','https://yoostore.ir','books-culture',FALSE,'unknown','manual'),
('اورجینال تهران','orginaltehran','orginaltehran.com','https://orginaltehran.com','home-appliance',FALSE,'unknown','manual'),
('لافارر','lafarrerr','lafarrerr.com','https://lafarrerr.com','beauty-health',FALSE,'unknown','manual'),
('داروکده','darukade','darukade.com','https://darukade.com','beauty-health',FALSE,'unknown','manual'),
('ایرانسل','irancell','irancell.ir','https://irancell.ir','mobile-digital',FALSE,'unknown','manual'),
('رمان بوک','romanbook','romanbook.ir','https://romanbook.ir','books-culture',FALSE,'unknown','manual'),
('نوین','novin','novin.com','https://novin.com','office',FALSE,'unknown','manual'),
('تخفیفان','takhfifan','takhfifan.com','https://takhfifan.com','other',FALSE,'unknown','manual'),
('پگاه','pegah','pegah.ir','https://pegah.ir','supermarket',FALSE,'unknown','manual'),
('میهن','mihan','mihan.ir','https://mihan.ir','supermarket',FALSE,'unknown','manual'),
('اسنپ مارکت','snappmarket','snappmarket.ir','https://snappmarket.ir','supermarket',FALSE,'unknown','manual'),
('اسنپ فود','snappfood','snappfood.ir','https://snappfood.ir','supermarket',FALSE,'unknown','manual'),
('کتابراه','ketabrah','ketabrah.ir','https://ketabrah.ir','books-culture',FALSE,'unknown','manual'),
('موبایل ۱۴۰','mobile140','mobile140.com','https://mobile140.com','mobile-digital',FALSE,'unknown','manual'),
('تکنوسان','technosun','technosun.ir','https://technosun.ir','laptop-computer',FALSE,'unknown','manual'),
('موبایل آباد','mobileabad','mobileabad.ir','https://mobileabad.ir','mobile-digital',FALSE,'unknown','manual'),
('پاپیون','papion','papion.com','https://papion.com','fashion',FALSE,'unknown','manual'),
('شیک پوش','shikpoosh','shikpoosh.com','https://shikpoosh.com','fashion',FALSE,'unknown','manual'),
('موبایل کمک','mobilekomak','mobilekomak.com','https://mobilekomak.com','mobile-digital',FALSE,'unknown','manual'),
('ایران جیب','iranjib','iranjib.ir','https://iranjib.ir','automotive',FALSE,'unknown','manual'),
('خودرو ۴۵','khodro45','khodro45.com','https://khodro45.com','automotive',FALSE,'unknown','manual'),
('دنیای خودرو','donyayekhodro','donyayekhodro.com','https://donyayekhodro.com','automotive',FALSE,'unknown','manual'),
('کارنوژن','karnogen','karnogen.com','https://karnogen.com','automotive',FALSE,'unknown','manual'),
('چرم مشهد','charmmashhad','charmmashhad.ir','https://charmmashhad.ir','fashion',FALSE,'unknown','manual'),
('چرم درسا','dorsa','dorsagroup.com','https://dorsagroup.com','fashion',FALSE,'unknown','manual'),
('کفش ملی','melli','mellishoes.ir','https://mellishoes.ir','fashion',FALSE,'unknown','manual'),
('کفش شیما','shima','shimashoes.ir','https://shimashoes.ir','fashion',FALSE,'unknown','manual'),
('دیجی‌رو','digiro','digiro.ir','https://digiro.ir','digital',FALSE,'unknown','manual'),
('آی تی هوم','ithome','ithome.ir','https://ithome.ir','digital',FALSE,'unknown','manual'),
('آی تی بازار','itbazaar','itbazaar.com','https://itbazaar.com','digital',FALSE,'unknown','manual'),
('فروشگاه مجید','majidshop','majidonline.com','https://majidonline.com','audio-video',FALSE,'unknown','manual'),
('فروشگاه دوربین','doorbin','doorbin.ir','https://doorbin.ir','audio-video',FALSE,'unknown','manual'),
('پرشین تولز','persiantools','persiantools.com','https://persiantools.com','tools-industrial',FALSE,'unknown','manual'),
('ابزارمارکت','abzarmarket','abzarmarket.com','https://abzarmarket.com','tools-industrial',FALSE,'unknown','manual'),
('ابزارلاین','abzarline','abzarline.com','https://abzarline.com','tools-industrial',FALSE,'unknown','manual'),
('ایران ابزار','iranabzar','iranabzar.com','https://iranabzar.com','tools-industrial',FALSE,'unknown','manual'),
('خانه ابزار','khanehabzar','khanehabzar.com','https://khanehabzar.com','tools-industrial',FALSE,'unknown','manual'),
('هوم‌کالا','homekala','homekala.ir','https://homekala.ir','home-appliance',FALSE,'unknown','manual'),
('لوازم خانگی بانه','banehkala','banehkala.com','https://banehkala.com','home-appliance',FALSE,'unknown','manual'),
('آی‌کالا','ikala','ikala.ir','https://ikala.ir','home-appliance',FALSE,'unknown','manual'),
('کالای خانه','kalayekhane','kalayekhaneh.com','https://kalayekhaneh.com','home-appliance',FALSE,'unknown','manual'),
('آجیل شور و شیرین','ajilstore','ajilstore.ir','https://ajilstore.ir','supermarket',FALSE,'unknown','manual'),
('خشکبار سنجاب','sanjab','sanjab.ir','https://sanjab.ir','supermarket',FALSE,'unknown','manual'),
('مسترکالا','masterkala','masterkala.com','https://masterkala.com','general',FALSE,'unknown','manual'),
('کالاچاپ','kalachap','kalachap.com','https://kalachap.com','office',FALSE,'unknown','manual'),
('کتاب فردا','ketabfarda','ketabfarda.com','https://ketabfarda.com','books-culture',FALSE,'unknown','manual'),
('کتاب گالری','ketabgallery','ketabgallery.com','https://ketabgallery.com','books-culture',FALSE,'unknown','manual'),
('آرایشی روبی','rubycosmetic','rubycosmetic.ir','https://rubycosmetic.ir','beauty-health',FALSE,'unknown','manual'),
('فروشگاه بچگانه','bacheganeh','bacheganeh.com','https://bacheganeh.com','baby-kids',FALSE,'unknown','manual'),
('نی نی کالا','ninikala','ninikala.com','https://ninikala.com','baby-kids',FALSE,'unknown','manual'),
('کودک آنلاین','koodakonline','koodakonline.com','https://koodakonline.com','baby-kids',FALSE,'unknown','manual'),
('پت شاپ ایران','petshopiran','petshopiran.com','https://petshopiran.com','pet',FALSE,'unknown','manual'),
('پت‌کالا','petkala','petkala.ir','https://petkala.ir','pet',FALSE,'unknown','manual'),
('پت‌لند','petland','petland.ir','https://petland.ir','pet',FALSE,'unknown','manual'),
('کمپینگ من','campingman','campingman.ir','https://campingman.ir','travel-camping',FALSE,'unknown','manual'),
('طبیعت گرد','tabiatgard','tabiatgard.com','https://tabiatgard.com','travel-camping',FALSE,'unknown','manual'),
('ورزش کالا','varzeshkala','varzeshkala.com','https://varzeshkala.com','sports',FALSE,'unknown','manual'),
('فروشگاه اسپرت','sportstore','sportstore.ir','https://sportstore.ir','sports',FALSE,'unknown','manual'),
('جواهری آنلاین','javaheri','javaheri.ir','https://javaheri.ir','jewelry-gold',FALSE,'unknown','manual'),
('گالری طلا','gallerygold','gallerygold.ir','https://gallerygold.ir','jewelry-gold',FALSE,'unknown','manual'),
('اداری شاپ','edarishop','edarishop.ir','https://edarishop.ir','office',FALSE,'unknown','manual'),
('لوازم التحریر آنلاین','stationeryonline','stationeryonline.ir','https://stationeryonline.ir','office',FALSE,'unknown','manual'),
('پلاس‌مارکت','plusmarket','plusmarket.ir','https://plusmarket.ir','general',FALSE,'unknown','manual'),
('بازرگام','bazargam','bazargam.com','https://bazargam.com','supermarket',FALSE,'unknown','manual'),
('پاییز کمپ','paeezcamp2','paeezcamp.ir','https://paeezcamp.ir','travel-camping',FALSE,'unknown','manual'),
('ایسام','esam2','esam.ir','https://esam.ir','general',FALSE,'unknown','manual'),
('مالتینا','malltina2','malltina.com','https://malltina.com','general',FALSE,'unknown','manual'),
('پیندو','pindo2','pindo.ir','https://pindo.ir','general',FALSE,'unknown','manual'),
('شهرکتاب آنلاین','shahreketab2','shahreketabonline.com','https://shahreketabonline.com','books-culture',FALSE,'unknown','manual')
ON CONFLICT(domain) DO NOTHING;

-- SOURCE 041_market_store_registry_wave4.sql
-- 041: additional real-store candidates. Inactive until verified onboarding/feed approval.
INSERT INTO market_stores(name,slug,domain,homepage_url,category_hint,active,iframe_mode,feed_type) VALUES
('نورنگار','noornegar2','noornegar.com','https://noornegar.com','audio-video',FALSE,'unknown','manual'),
('گلد نهال','goldnahal2','goldnahal.ir','https://goldnahal.ir','other',FALSE,'unknown','manual'),
('سایاخودرو','sayakhodro','sayakhodro.com','https://sayakhodro.com','automotive',FALSE,'unknown','manual'),
('مانی نی','maninimarket','maninimarket.ir','https://maninimarket.ir','baby-kids',FALSE,'unknown','manual'),
('دینه ایران','dinehiran2','dineh.ir','https://dineh.ir','beauty-health',FALSE,'unknown','manual'),
('دلوکس گلامور','deluxeglamour','deluxeglamour.com','https://deluxeglamour.com','jewelry-gold',FALSE,'unknown','manual'),
('دوربین','camera-shop','camera-shop.ir','https://camera-shop.ir','audio-video',FALSE,'unknown','manual'),
('ایکس‌گیم','xgame','xgame.ir','https://xgame.ir','audio-video',FALSE,'unknown','manual'),
('آی‌تی مال','itmall','itmall.ir','https://itmall.ir','digital',FALSE,'unknown','manual'),
('پارس خزر','parskhazar','parskhazar.com','https://parskhazar.com','home-appliance',FALSE,'unknown','manual'),
('اسنوا','snowa','snowa.ir','https://snowa.ir','home-appliance',FALSE,'unknown','manual'),
('پاکشوما','pakshoma','pakshoma.com','https://pakshoma.com','home-appliance',FALSE,'unknown','manual'),
('دوو ایران','daewoo','daewoo.ir','https://daewoo.ir','home-appliance',FALSE,'unknown','manual'),
('جی‌پلاس','gplus','gplus.ir','https://gplus.ir','home-appliance',FALSE,'unknown','manual'),
('انتخاب الکترونیک','entekhab','entekhabgroup.com','https://entekhabgroup.com','home-appliance',FALSE,'unknown','manual'),
('دیجی‌کالا کالا','digikala-kala','digikala.com','https://digikala.com','general',FALSE,'unknown','manual'),
('فروشگاه افق کوروش','okcs','okcs.com','https://okcs.com','supermarket',FALSE,'unknown','manual'),
('جانبو','janbo','janbo.com','https://janbo.com','supermarket',FALSE,'unknown','manual'),
('هایپرمی','hyperme','hyperme.ir','https://hyperme.ir','supermarket',FALSE,'unknown','manual'),
('دیلی مارکت','dailymarket','dailymarket.ir','https://dailymarket.ir','supermarket',FALSE,'unknown','manual'),
('اسنپ اکسپرس','snapp-express','snappmarket.ir','https://snappmarket.ir','supermarket',FALSE,'unknown','manual'),
('فروشگاه هفت','haft','haft.ir','https://haft.ir','supermarket',FALSE,'unknown','manual'),
('فروشگاه شهرما','shahrma','shahrma.ir','https://shahrma.ir','supermarket',FALSE,'unknown','manual'),
('فروشگاه رفاه','refah','refah.ir','https://refah.ir','supermarket',FALSE,'unknown','manual'),
('اکالا پلاس','okala-plus','okala.com','https://okala.com','supermarket',FALSE,'unknown','manual'),
('گاج مارکت','gajmarket','gajmarket.com','https://gajmarket.com','books-culture',FALSE,'unknown','manual'),
('موسسه گاج','gaj','gaj.ir','https://gaj.ir','books-culture',FALSE,'unknown','manual'),
('مدرسان شریف','modaresan','modaresanesharif.ac.ir','https://modaresanesharif.ac.ir','books-culture',FALSE,'unknown','manual'),
('رشد','roshd','roshd.ir','https://roshd.ir','books-culture',FALSE,'unknown','manual'),
('کتابستان','ketabestan','ketabestan.com','https://ketabestan.com','books-culture',FALSE,'unknown','manual'),
('بوک‌لند','bookland','bookland.ir','https://bookland.ir','books-culture',FALSE,'unknown','manual'),
('کتاب جم','ketabjam','ketabjam.com','https://ketabjam.com','books-culture',FALSE,'unknown','manual'),
('فروشگاه مهر','mehrshop','mehrshop.ir','https://mehrshop.ir','general',FALSE,'unknown','manual'),
('روژان','rojanshop','rojanshop.ir','https://rojanshop.ir','beauty-health',FALSE,'unknown','manual'),
('مفید','mofidshop','mofidshop.ir','https://mofidshop.ir','beauty-health',FALSE,'unknown','manual'),
('داروخانه آنلاین ۲۴','darukhane24','darukhane24.com','https://darukhane24.com','beauty-health',FALSE,'unknown','manual'),
('مثبت سبز','mosbate-sabz','mosbatesabz.com','https://mosbatesabz.com','beauty-health',FALSE,'unknown','manual'),
('داروخانه مفید','darukhanemofid','darukhanemofid.ir','https://darukhanemofid.ir','beauty-health',FALSE,'unknown','manual'),
('مو تن رو','mootanroo3','mootanroo.com','https://mootanroo.com','beauty-health',FALSE,'unknown','manual'),
('خانومی','khanoumi3','khanoumi.com','https://khanoumi.com','beauty-health',FALSE,'unknown','manual'),
('شاپرزفا','shoppersfa','shoppersfa.com','https://shoppersfa.com','fashion',FALSE,'unknown','manual'),
('مد و پوشاک ایرانی','iranfashion','iranfashion.ir','https://iranfashion.ir','fashion',FALSE,'unknown','manual'),
('ژینورا','jinora','jinora.com','https://jinora.com','fashion',FALSE,'unknown','manual'),
('بادی اسپینر','bodyspinner2','bodyspinner.ir','https://bodyspinner.ir','sports',FALSE,'unknown','manual'),
('پادرا','padra','padra.ir','https://padra.ir','fashion',FALSE,'unknown','manual'),
('دیجی‌پوش','digipoosh','digipoosh.com','https://digipoosh.com','fashion',FALSE,'unknown','manual'),
('پوشاک سالیان','salian','salian.ir','https://salian.ir','fashion',FALSE,'unknown','manual'),
('هفت و هشت','haftohasht','haftohasht.com','https://haftohasht.com','fashion',FALSE,'unknown','manual'),
('چرم نگار','charmnegar','charmnegar.ir','https://charmnegar.ir','fashion',FALSE,'unknown','manual'),
('ایران تایر','irantire','irantire.com','https://irantire.com','automotive',FALSE,'unknown','manual'),
('لاستیک بارز','barez','barez.org','https://barez.org','automotive',FALSE,'unknown','manual'),
('لاستیک یزد','yazdtire','yazdtire.com','https://yazdtire.com','automotive',FALSE,'unknown','manual'),
('یدک‌سنتر','yadakcenter','yadakcenter.com','https://yadakcenter.com','automotive',FALSE,'unknown','manual'),
('اتوپارت','autopart','autopart.ir','https://autopart.ir','automotive',FALSE,'unknown','manual'),
('لوازم یدکی کار','yadakicar','yadakicar.com','https://yadakicar.com','automotive',FALSE,'unknown','manual'),
('موتور آنلاین','motoronline','motoronline.ir','https://motoronline.ir','automotive',FALSE,'unknown','manual'),
('دیجی‌کالا موتور','digikalamotor','digikala.com','https://digikala.com','automotive',FALSE,'unknown','manual'),
('کمپ‌مارکت','campmarket','campmarket.ir','https://campmarket.ir','travel-camping',FALSE,'unknown','manual'),
('کوه‌مارکت','koohmarket','koohmarket.ir','https://koohmarket.ir','travel-camping',FALSE,'unknown','manual'),
('آف‌کمپ','offcamp','offcamp.ir','https://offcamp.ir','travel-camping',FALSE,'unknown','manual'),
('فروشگاه طبیعت','naturestore','naturestore.ir','https://naturestore.ir','travel-camping',FALSE,'unknown','manual'),
('پت‌چی','petchi','petchi.ir','https://petchi.ir','pet',FALSE,'unknown','manual'),
('پت‌مارکت','petmarket','petmarket.ir','https://petmarket.ir','pet',FALSE,'unknown','manual'),
('پت‌هوم','pethome','pethome.ir','https://pethome.ir','pet',FALSE,'unknown','manual'),
('پت‌زون','petzone','petzone.ir','https://petzone.ir','pet',FALSE,'unknown','manual'),
('لوازم حیوانات خانگی','pettools','pettools.ir','https://pettools.ir','pet',FALSE,'unknown','manual'),
('دیجی زرگر','digizargar2','digizargar.com','https://digizargar.com','jewelry-gold',FALSE,'unknown','manual'),
('طلاسی','talasea','talasea.ir','https://talasea.ir','jewelry-gold',FALSE,'unknown','manual'),
('گلدینو','goldino','goldino.ir','https://goldino.ir','jewelry-gold',FALSE,'unknown','manual'),
('طلاپ','talapp','talapp.ir','https://talapp.ir','jewelry-gold',FALSE,'unknown','manual'),
('جواهری حقانی','haghighi-jewelry','haghighijewelry.com','https://haghighijewelry.com','jewelry-gold',FALSE,'unknown','manual'),
('نورنگار','noornegar3','noornegar.com','https://noornegar.com','audio-video',FALSE,'unknown','manual')
ON CONFLICT(domain) DO NOTHING;

-- SOURCE 042_market_production_ecosystem.sql
-- 042: production-grade An Market community, taxonomy mapping, homepage and merchant reporting.
ALTER TABLE market_products
  ADD COLUMN IF NOT EXISTS normalized_title TEXT,
  ADD COLUMN IF NOT EXISTS gtin TEXT,
  ADD COLUMN IF NOT EXISTS mpn TEXT,
  ADD COLUMN IF NOT EXISTS model TEXT;

CREATE INDEX IF NOT EXISTS idx_market_products_gtin ON market_products(gtin) WHERE gtin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_market_products_normalized_title ON market_products(normalized_title);

CREATE TABLE IF NOT EXISTS market_category_aliases (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_key TEXT NOT NULL UNIQUE,
  category_id BIGINT NOT NULL REFERENCES market_categories(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_market_category_aliases_category ON market_category_aliases(category_id,active);

CREATE TABLE IF NOT EXISTS market_reviews (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES market_products(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES market_users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK(rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT NOT NULL CHECK(length(trim(body)) BETWEEN 2 AND 10000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','published','rejected','hidden')),
  helpful_count INTEGER NOT NULL DEFAULT 0 CHECK(helpful_count>=0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id,user_id)
);

CREATE TABLE IF NOT EXISTS market_review_likes (
  review_id BIGINT NOT NULL REFERENCES market_reviews(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES market_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(review_id,user_id)
);

CREATE INDEX IF NOT EXISTS idx_market_reviews_product_status ON market_reviews(product_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_review_likes_user ON market_review_likes(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS market_home_sections (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  section_type TEXT NOT NULL CHECK(section_type IN ('hero','category','products','offers','stores','campaign')),
  query JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 032 created this table with slug/query_config/active. Reconcile that schema
-- before seeding the 042 contract so fresh installs and upgrades converge.
ALTER TABLE market_home_sections
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS query_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS key TEXT,
  ADD COLUMN IF NOT EXISTS query JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE market_home_sections
SET key=COALESCE(key,slug),
    query=COALESCE(query,query_config,'{}'::jsonb),
    enabled=COALESCE(enabled,active,TRUE)
WHERE key IS NULL OR query IS NULL OR enabled IS NULL;

ALTER TABLE market_home_sections
  ALTER COLUMN key SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_market_home_sections_key ON market_home_sections(key);

ALTER TABLE market_home_sections DROP CONSTRAINT IF EXISTS market_home_sections_section_type_check;
ALTER TABLE market_home_sections
  ADD CONSTRAINT market_home_sections_section_type_check
  CHECK(section_type IN ('hero','latest','category','products','price_drops','price_drop','popular','offers','stores','custom','query','campaign'));

INSERT INTO market_home_sections(key,title,subtitle,section_type,query,sort_order)
VALUES
('categories','دسته‌بندی‌ها','دسته‌های فعال آن مارکت','category','{}',10),
('latest-products','محصولات تازه','محصولات دریافت‌شده از فیدهای معتبر','products','{"sort":"latest","limit":12}',20),
('price-comparison','پیشنهادهای قابل مقایسه','محصولاتی با چند فروشگاه فعال','products','{"sort":"store_count","limit":12}',30),
('stores','فروشگاه‌های فعال','فروشگاه‌هایی که منبع داده معتبر دارند','stores','{"limit":12}',40)
ON CONFLICT(key) DO NOTHING;

CREATE TABLE IF NOT EXISTS market_merchant_commission_rules (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES market_stores(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  commission_type TEXT NOT NULL CHECK(commission_type IN ('fixed','percent')),
  commission_value NUMERIC(24,8) NOT NULL CHECK(commission_value>=0),
  currency CHAR(3) DEFAULT 'IRR',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  UNIQUE(store_id,rule_name)
);

CREATE TABLE IF NOT EXISTS market_merchant_report_exports (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_id BIGINT REFERENCES market_stores(id) ON DELETE SET NULL,
  from_at TIMESTAMPTZ NOT NULL,
  to_at TIMESTAMPTZ NOT NULL,
  format TEXT NOT NULL CHECK(format IN ('json','csv')),
  requested_by BIGINT REFERENCES market_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_clickouts_store_time ON market_clickouts(store_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_purchase_store_time ON market_purchase_events(store_id,event_type,created_at DESC);

-- Deterministic initial taxonomy aliases. The ingestion worker uses these only as
-- classification hints; store-provided categories never become executable instructions.
INSERT INTO market_category_aliases(source_key,category_id,priority)
SELECT v.source_key,c.id,v.priority
FROM (VALUES
 ('mobile',10),('smartphone',10),('موبایل',10),('phone',10),
 ('laptop',20),('computer',20),('لپ تاپ',20),('کامپیوتر',20),
 ('refrigerator',30),('washing machine',30),('لوازم خانگی',30),
 ('supermarket',40),('grocery',40),('مواد غذایی',40),
 ('fashion',50),('clothing',50),('پوشاک',50),
 ('cosmetic',60),('beauty',60),('آرایشی',60),('بهداشتی',60),
 ('tv',70),('headphone',70),('audio',70),
 ('car',80),('automotive',80),('خودرو',80),
 ('sport',90),('fitness',90),('ورزش',90),
 ('baby',100),('toy',100),('کودک',100),
 ('book',110),('books',110),('کتاب',110),
 ('tool',120),('industrial',120),('ابزار',120),
 ('camp',130),('travel',130),('کمپینگ',130),
 ('pet',140),('حیوانات',140),
 ('stationery',150),('office',150),('لوازم التحریر',150),
 ('jewelry',160),('gold',160),('طلا',160)
) v(source_key,priority)
JOIN market_categories c ON c.id=v.priority
ON CONFLICT(source_key) DO NOTHING;


-- SOURCE 043_market_taxonomy_alias_fix.sql
-- 043: taxonomy alias correction. Aliases point to category slugs, never to generated numeric ids.
INSERT INTO market_category_aliases(source_key,category_id,priority)
SELECT v.source_key,c.id,v.priority
FROM (VALUES
 ('mobile', 'mobile-digital',10),('smartphone','mobile-digital',10),('موبایل','mobile-digital',10),('phone','mobile-digital',10),
 ('laptop','laptop-computer',10),('computer','laptop-computer',10),('لپ تاپ','laptop-computer',10),('کامپیوتر','laptop-computer',10),
 ('refrigerator','home-appliance',10),('washing machine','home-appliance',10),('لوازم خانگی','home-appliance',10),
 ('supermarket','supermarket',10),('grocery','supermarket',10),('مواد غذایی','supermarket',10),
 ('fashion','fashion',10),('clothing','fashion',10),('پوشاک','fashion',10),
 ('cosmetic','beauty-health',10),('beauty','beauty-health',10),('آرایشی','beauty-health',10),('بهداشتی','beauty-health',10),
 ('tv','audio-video',10),('headphone','audio-video',10),('audio','audio-video',10),
 ('car','automotive',10),('automotive','automotive',10),('خودرو','automotive',10),
 ('sport','sports',10),('fitness','sports',10),('ورزش','sports',10),
 ('baby','baby-kids',10),('toy','baby-kids',20),('کودک','baby-kids',10),
 ('book','books-culture',10),('books','books-culture',10),('کتاب','books-culture',10),
 ('tool','tools-industrial',10),('industrial','tools-industrial',10),('ابزار','tools-industrial',10),
 ('camp','travel-camping',10),('travel','travel-camping',10),('کمپینگ','travel-camping',10),
 ('pet','pet',10),('حیوانات','pet',10),
 ('stationery','office',10),('office','office',10),('لوازم التحریر','office',10),
 ('jewelry','jewelry-gold',10),('gold','jewelry-gold',10),('طلا','jewelry-gold',10)
) v(source_key,slug,priority)
JOIN market_categories c ON c.slug=v.slug
ON CONFLICT(source_key) DO UPDATE SET category_id=EXCLUDED.category_id,priority=EXCLUDED.priority,active=true;


-- SOURCE 044_market_ai_provider_adapter.sql
INSERT INTO ai_providers(name,provider_type,base_url,enabled,priority,model_policy,secret_ref)
VALUES ('openai_compatible','openai_compatible',COALESCE(current_setting('app.ai_compat_base_url',true),'http://localhost'),FALSE,30,
'{"default_model":"qwen3","env_key":"AI_COMPAT_API_KEY","base_url_env":"AI_COMPAT_BASE_URL"}'::jsonb,'AI_COMPAT_API_KEY')
ON CONFLICT(name) DO UPDATE SET provider_type=EXCLUDED.provider_type,model_policy=EXCLUDED.model_policy,secret_ref=EXCLUDED.secret_ref;

UPDATE ai_workflows
SET provider_policy=jsonb_set(COALESCE(provider_policy,'{}'::jsonb),'{providers}',
  COALESCE(provider_policy->'providers','["gemini","openai"]'::jsonb) || '["openai_compatible"]'::jsonb)
WHERE code IN ('market.assist','market.compare');



INSERT INTO schema_migrations(version) VALUES ('002_market_schema_wave2') ON CONFLICT(version) DO NOTHING;
