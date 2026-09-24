-- An Market real-store registry. This migration registers real stores only.
-- It intentionally does NOT create products, prices or offers. Those must come from a verified feed/API/approved importer.
INSERT INTO market_stores
  (name,slug,domain,homepage_url,category_hint,active,iframe_mode,feed_type)
VALUES
 ('دیجی‌کالا','digikala','digikala.com','https://www.digikala.com/','general',true,'unknown','manual'),
 ('تکنولایف','technolife','technolife.com','https://www.technolife.com/','digital',true,'unknown','manual'),
 ('دیجی‌استایل','digistyle','digistyle.com','https://www.digistyle.com/','fashion',true,'unknown','manual'),
 ('بانی‌مد','banimode','banimode.com','https://www.banimode.com/','fashion',true,'unknown','manual'),
 ('خانومی','khanoumi','khanoumi.com','https://www.khanoumi.com/','beauty-health',true,'unknown','manual'),
 ('مقداد آی‌تی','meghdadit','meghdadit.com','https://www.meghdadit.com/','digital',true,'unknown','manual'),
 ('کالاتیک','kalatik','kalatik.com','https://www.kalatik.com/','digital',true,'unknown','manual'),
 ('موبیت','mobit','mobit.ir','https://www.mobit.ir/','digital',true,'unknown','manual'),
 ('مدیسه','modiseh','modiseh.com','https://www.modiseh.com/','fashion',true,'unknown','manual'),
 ('شیکسون','shixon','shixon.com','https://www.shixon.com/','fashion',true,'unknown','manual'),
 ('مو تن رو','mootanroo','mootanroo.com','https://www.mootanroo.com/','beauty-health',true,'unknown','manual'),
 ('تیمچه','timcheh','timcheh.com','https://www.timcheh.com/','general',true,'unknown','manual'),
 ('زنبیل','zanbil','zanbil.ir','https://www.zanbil.ir/','home-appliance',true,'unknown','manual'),
 ('بانه دات کام','baneeh','baneeh.com','https://www.baneeh.com/','home-appliance',true,'unknown','manual'),
 ('جانبی','janebi','janebi.com','https://www.janebi.com/','digital',true,'unknown','manual'),
 ('لیون کامپیوتر','lioncomputer','lioncomputer.com','https://lioncomputer.com/','digital',true,'unknown','manual'),
 ('روژا','rojashop','rojashop.com','https://rojashop.com/','beauty-health',true,'unknown','manual'),
 ('دیدنگار','didnegar','didnegar.com','https://www.didnegar.com/','digital',true,'unknown','manual'),
 ('کالااوما','kalaoma','kalaoma.com','https://kalaoma.com/','general',true,'unknown','manual'),
 ('باسلام','basalam','basalam.com','https://basalam.com/','general',true,'unknown','manual'),
 ('اکالا','okala','okala.com','https://okala.com/','supermarket',true,'unknown','manual'),
 ('اسنپ‌شاپ','snappshop','snappshop.ir','https://snappshop.ir/','general',true,'unknown','manual'),
 ('پلازا دیجیتال','plazadigital','plazadigital.ir','https://plazadigital.ir/','digital',true,'unknown','manual'),
 ('کالازم','kalazem','kalazem.com','https://kalazem.com/','home-appliance',true,'unknown','manual'),
 ('توانینو','tavanino','tavanino.com','https://tavanino.com/','health',true,'unknown','manual')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name,
  domain=EXCLUDED.domain,
  homepage_url=EXCLUDED.homepage_url,
  category_hint=EXCLUDED.category_hint,
  active=true;
