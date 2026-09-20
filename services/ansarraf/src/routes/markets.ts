import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';
import { ensureCustomer, requireAuth, type AuthClaims } from '../auth.js';
import type { MarketDataService } from '../market-data.js';

type AuthenticatedRequest = FastifyRequest & { auth: AuthClaims };

export function registerMarketRoutes(app: FastifyInstance, pool: Pool, marketData?: MarketDataService | null) {
  app.get('/api/v1/assets', async () => {
    const r = await pool.query("SELECT id,symbol,name,asset_type,decimals,status FROM assets WHERE status='active' ORDER BY symbol");
    return { assets: r.rows };
  });
  app.get('/api/v1/market-data/quotes', async (request, reply) => {
    if (!marketData) return reply.code(503).send({ error: 'market_data_unavailable' });
    const symbol = (request.query as { symbol?: string }).symbol?.trim() || undefined;
    if (symbol && !/^[A-Z0-9]+\/[A-Z0-9]+$/.test(symbol)) return reply.code(400).send({ error: 'invalid_symbol' });
    return { quotes: await marketData.getQuotes(symbol) };
  });
  app.get('/api/v1/orderbook', async (request, reply) => {
    const q = request.query as { baseAssetId?: string; quoteAssetId?: string; symbol?: string; limit?: string };
    let baseAssetId = q.baseAssetId?.trim() || '';
    let quoteAssetId = q.quoteAssetId?.trim() || '';
    const symbol = q.symbol?.trim().toUpperCase() || '';
    const limit = Math.min(50, Math.max(1, Number.parseInt(q.limit ?? '20', 10) || 20));

    if (symbol) {
      const parts = symbol.split('/');
      if (parts.length !== 2 || !/^[A-Z0-9]+$/.test(parts[0]) || !/^[A-Z0-9]+$/.test(parts[1])) return reply.code(400).send({ error: 'invalid_symbol' });
      const assets = await pool.query<{ id: string; symbol: string }>(
        "SELECT id,symbol FROM assets WHERE status='active' AND symbol=ANY($1::text[])",
        [[parts[0], parts[1]]],
      );
      const bySymbol = new Map(assets.rows.map((row) => [row.symbol.toUpperCase(), row.id]));
      baseAssetId = bySymbol.get(parts[0]) ?? '';
      quoteAssetId = bySymbol.get(parts[1]) ?? '';
    }

    if (!/^\d+$/.test(baseAssetId) || !/^\d+$/.test(quoteAssetId) || baseAssetId === quoteAssetId) return reply.code(400).send({ error: 'invalid_market' });
    const assets = await pool.query<{ id: string; symbol: string }>(
      "SELECT id,symbol FROM assets WHERE id=ANY($1::bigint[]) AND status='active'",
      [[baseAssetId, quoteAssetId]],
    );
    if (assets.rows.length !== 2) return reply.code(404).send({ error: 'market_not_found' });

    const [bids, asks] = await Promise.all([
      pool.query(
        `WITH remaining AS (
           SELECT o.id,o.price,(o.quantity-COALESCE(SUM(t.quantity),0))::text AS amount
           FROM orders o
           LEFT JOIN trades t ON t.order_id=o.id
           WHERE o.base_asset_id=$1 AND o.quote_asset_id=$2 AND o.side='buy'
             AND o.order_type='limit' AND o.status IN ('open','partially_filled')
           GROUP BY o.id,o.price,o.quantity
         )
         SELECT price::text, SUM(amount::numeric)::text AS amount,
                (price*SUM(amount::numeric))::text AS total
         FROM remaining
         WHERE amount::numeric > 0
         GROUP BY price
         ORDER BY price DESC
         LIMIT $3`,
        [baseAssetId, quoteAssetId, limit],
      ),
      pool.query(
        `WITH remaining AS (
           SELECT o.id,o.price,(o.quantity-COALESCE(SUM(t.quantity),0))::text AS amount
           FROM orders o
           LEFT JOIN trades t ON t.order_id=o.id
           WHERE o.base_asset_id=$1 AND o.quote_asset_id=$2 AND o.side='sell'
             AND o.order_type='limit' AND o.status IN ('open','partially_filled')
           GROUP BY o.id,o.price,o.quantity
         )
         SELECT price::text, SUM(amount::numeric)::text AS amount,
                (price*SUM(amount::numeric))::text AS total
         FROM remaining
         WHERE amount::numeric > 0
         GROUP BY price
         ORDER BY price ASC
         LIMIT $3`,
        [baseAssetId, quoteAssetId, limit],
      ),
    ]);

    return { symbol: symbol || undefined, bids: bids.rows, asks: asks.rows, fetchedAt: new Date().toISOString() };
  });
  app.get('/api/v1/wallets', { preHandler: requireAuth }, async (request) => {
    const auth = (request as AuthenticatedRequest).auth;
    const customerId = await ensureCustomer(pool, auth);
    const r = await pool.query(`SELECT w.id,w.asset_id,w.available_balance,w.locked_balance,w.created_at,a.symbol,a.name FROM wallets w JOIN assets a ON a.id=w.asset_id WHERE w.customer_id=$1 ORDER BY a.symbol`, [customerId]);
    return { wallets: r.rows };
  });
}
