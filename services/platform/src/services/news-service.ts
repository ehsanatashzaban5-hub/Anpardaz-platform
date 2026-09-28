import { NewsRepository } from '../repositories/news-repository.js';

export class NewsService {
  constructor(private readonly repository: NewsRepository) {}

  async list(page: number, limit: number, category?: string | null) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));
    const { items, total } = await this.repository.listPublished(safeLimit, (safePage - 1) * safeLimit, category);
    return {
      items,
      pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
    };
  }
}
