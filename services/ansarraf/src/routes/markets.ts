import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';
import { ensureCustomer, requireAuth, type AuthClaims } from '../auth.js';
import type { MarketDataService } from '../market-data.js';

type AuthenticatedRequest = FastifyRequest & { auth: AuthClaims };

export function registerMarketRoutes(app: FastifyInstance, pool: Pool, marketData?: MarketDataService | null) {
  app.get('/api/v1/transactions/export', { preHandler: requireAuth }, async (request, reply) => {
    const customerId = await ensureCustomer(pool, (request as AuthenticatedRequest).auth);
    const [orders, deposits, withdrawals] = await Promise.all([
      pool.query(`SELECT o.id,o.created_at,o.status,o.side,o.order_type,o.quantity::text AS amount,a.symbol AS asset_symbol,qa.symbol AS quote_symbol,o.operation_id
        FROM orders o JOIN assets a ON a.id=o.base_asset_id JOIN assets qa ON qa.id=o.quote_asset_id
        WHERE o.customer_id=$1 ORDER BY o.created_at DESC LIMIT 5000`, [customerId]),
      pool.query(`SELECT d.id,d.created_at,d.status,d.amount::text AS amount,a.symbol AS asset_symbol,d.operation_id
        FROM deposits d JOIN assets a ON a.id=d.asset_id WHERE d.customer_id=$1 ORDER BY d.created_at DESC LIMIT 5000`, [customerId]),
      pool.query(`SELECT w.id,w.created_at,w.status,w.amount::text AS amount,a.symbol AS asset_symbol,w.operation_id
        FROM withdrawals w JOIN assets a ON a.id=w.asset_id WHERE w.customer_id=$1 ORDER BY w.created_at DESC LIMIT 5000`, [customerId]),
    ]);
    const esc=(v:unknown)=>`"${String(v??'').replace(/"/g,'""')}"`;
    const rows:string[]=[['نوع','شناسه','تاریخ','وضعیت','جهت','دارایی','دارایی مظنه','مبلغ','عملیات'].map(esc).join(',')];
    for(const x of orders.rows) rows.push([esc('order'),esc(x.id),esc(x.created_at),esc(x.status),esc(x.side),esc(x.asset_symbol),esc(x.quote_symbol),esc(x.amount),esc(x.operation_id)].join(','));
    for(const x of deposits.rows) rows.push([esc('deposit'),esc(x.id),esc(x.created_at),esc(x.status),esc(''),esc(x.asset_symbol),esc(''),esc(x.amount),esc(x.operation_id)].join(','));
    for(const x of withdrawals.rows) rows.push([esc('withdrawal'),esc(x.id),esc(x.created_at),esc(x.status),esc(''),esc(x.asset_symbol),esc(''),esc(x.amount),esc(x.operation_id)].join(','));
    reply.header('Content-Type','text/csv; charset=utf-8').header('Content-Disposition','attachment; filename="ansarraf-transactions.csv"');
    return '\uFEFF'+rows.join('\n');
  });

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
  app.get('/api/v1/market-data/candles', async (request, reply) => {
    if (!marketData) return reply.code(503).send({ error: 'market_data_unavailable' });
    const q = request.query as { symbol?: string; resolution?: string; from?: string; to?: string };
    const symbol = q.symbol?.trim().toUpperCase() || '';
    if (!/^[A-Z0-9]+\/(?:[A-Z0-9]+)$/.test(symbol)) return reply.code(400).send({ error: 'invalid_symbol' });
    const resolution = q.resolution?.trim() || '60';
    if (!/^(1|5|15|30|60|120|240|360|720|D|1D|W|1W)$/.test(resolution)) return reply.code(400).send({ error: 'invalid_resolution' });
    const now = Math.floor(Date.now() / 1000);
    const to = Math.min(now, Number.parseInt(q.to ?? String(now), 10) || now);
    const defaultFrom = to - 7 * 24 * 60 * 60;
    const from = Math.max(0, Number.parseInt(q.from ?? String(defaultFrom), 10) || defaultFrom);
    if (from >= to || to - from > 31 * 24 * 60 * 60) return reply.code(400).send({ error: 'invalid_time_range' });
    try {
      return await marketData.getCandles(symbol, resolution, from, to);
    } catch (error) {
      request.log.warn({ error, symbol, resolution }, 'wallex candles unavailable');
      return reply.code(503).send({ error: 'market_candles_unavailable' });
    }
  });

  app.get('/api/v1/market-data/trades', async (request, reply) => {
    const q = request.query as { symbol?: string; limit?: string };
    const symbol = q.symbol?.trim().toUpperCase() || '';
    const limit = Math.min(50, Math.max(1, Number.parseInt(q.limit ?? '20', 10) || 20));
    if (!symbol || !/^[A-Z0-9]+\/[A-Z0-9]+$/.test(symbol)) return reply.code(400).send({ error: 'invalid_symbol' });
    const parts = symbol.split('/');
    const assets = await pool.query<{ id: string; symbol: string }>(
      "SELECT id,symbol FROM assets WHERE status='active' AND symbol=ANY($1::text[])",
      [[parts[0], parts[1]]],
    );
    const bySymbol = new Map(assets.rows.map((row) => [row.symbol.toUpperCase(), row.id]));
    const baseAssetId = bySymbol.get(parts[0]);
    const quoteAssetId = bySymbol.get(parts[1]);
    if (!baseAssetId || !quoteAssetId) return reply.code(404).send({ error: 'market_not_found' });
    const trades = await pool.query(
      `SELECT t.id,t.price::text,t.quantity::text,t.side,t.created_at
       FROM trades t
       JOIN orders o ON o.id=t.order_id
       WHERE o.base_asset_id=$1 AND o.quote_asset_id=$2
       ORDER BY t.created_at DESC,t.id DESC LIMIT $3`,
      [baseAssetId, quoteAssetId, limit],
    );
    return { symbol, trades: trades.rows };
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
}
