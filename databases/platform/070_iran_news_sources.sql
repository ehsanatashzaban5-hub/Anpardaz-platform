BEGIN;

UPDATE content_sources SET enabled=FALSE,updated_at=NOW() WHERE category IN ('world-news','forex-news');

UPDATE news_articles SET category_slug='iran-news' WHERE category_slug='world-news';

INSERT INTO content_sources(source_type,name,source_url,category,enabled,fetch_interval_seconds)
VALUES
('rss','ایسنا','https://www.isna.ir/rss','iran-news',TRUE,900),
('rss','ایرنا','https://www.irna.ir/rss','iran-news',TRUE,900),
('rss','مهر','https://www.mehrnews.com/rss','iran-news',TRUE,900),
('rss','تسنیم','https://www.tasnimnews.com/fa/rss/feed/0/8/0/%D9%85%D9%87%D9%85%D8%AA%D8%B1%DB%8C%D9%86%20%D8%A7%D8%AE%D8%A8%D8%A7%D8%B1%20%D8%AA%D8%B3%D9%86%DB%8C%D9%85','iran-news',TRUE,900),
('rss','خبرآنلاین','https://www.khabaronline.ir/rss','iran-news',TRUE,900),
('rss','تابناک','https://www.tabnak.ir/fa/rss/allnews','iran-news',TRUE,900),
('rss','عصر ایران','https://www.asriran.com/fa/rss/allnews','iran-news',TRUE,900),
('rss','باشگاه خبرنگاران جوان','https://www.yjc.ir/fa/rss/allnews','iran-news',TRUE,900),
('rss','میهن بلاکچین','https://mihanblockchain.com/feed/','crypto-news',TRUE,900)
ON CONFLICT(source_url) DO UPDATE SET category='iran-news',enabled=TRUE,fetch_interval_seconds=EXCLUDED.fetch_interval_seconds,updated_at=NOW();

INSERT INTO content_publication_policies(category_slug,daily_limit,auto_publish,require_review)
VALUES('iran-news',20,FALSE,TRUE)
ON CONFLICT(category_slug) DO UPDATE SET daily_limit=EXCLUDED.daily_limit,auto_publish=EXCLUDED.auto_publish,require_review=EXCLUDED.require_review;

INSERT INTO schema_migrations(version) VALUES ('070_iran_news_sources') ON CONFLICT(version) DO NOTHING;
COMMIT;