import type { FastifyInstance } from 'fastify';
import type { Pool } from 'pg';

/**
 * Platform-owned taxonomy used by Platform content and forum surfaces.
 * Domain-specific listing/product/category management belongs to the owning
 * service and its database.
 */
export function registerContentRoutes(app: FastifyInstance, pool: Pool) {
  app.get('/api/v1/categories', async (request) => {
    const type = (request.query as { type?: string }).type;
    const result = await pool.query(
      'SELECT id,name,slug,category_type,parent_id FROM categories WHERE ($1::text IS NULL OR category_type=$1) ORDER BY name',
      [type ?? null],
    );
    return { categories: result.rows };
  });
}
