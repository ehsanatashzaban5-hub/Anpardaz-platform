import type { Pool } from 'pg';

export type NewsListItem = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  published_at: string | null;
  category_slug: string | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string[];
  hashtags: string[];
};

export class NewsRepository {
  constructor(private readonly pool: Pool) {}

  async listPublished(limit: number, offset: number) {
    const [items, count] = await Promise.all([
      this.pool.query<NewsListItem>(
        `SELECT id,title,slug,summary,published_at,category_slug,meta_title,meta_description,keywords,hashtags FROM news_articles
         WHERE status='published' ORDER BY published_at DESC NULLS LAST,id DESC LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      this.pool.query<{ total: string }>(
        `SELECT COUNT(*)::text AS total FROM news_articles WHERE status='published'`,
      ),
    ]);
    return { items: items.rows, total: Number(count.rows[0]?.total ?? 0) };
  }
}
