import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';
import { ensureCustomer, requireAuth, type AuthClaims } from '../auth.js';
import type { MarketDataService } from '../market-data.js';

type AuthenticatedRequest = FastifyRequest & { auth: AuthClaims };

export function registerMarketRoutes(app: FastifyInstance, pool: Pool, marketData?: MarketDataService | null) {
  app.get('/api/v1/fees', async (request) => {
    const q=request.query as {operationType?:string};
    const operationType=String(q.operationType??'trade').trim()||'trade';
    if(!/^[a-z_]{1,50}$/.test(operationType)) return {rules:[]};
    const r=await pool.query(`SELECT id,service,asset_symbol,market_symbol,operation_type,percentage::text,fixed_amount::text,min_amount::text,max_amount::text,fee_asset_symbol,effective_from,effective_to,metadata
      FROM customer_fee_rules
      WHERE service='ansarraf' AND operation_type=$1 AND effective_from<=NOW() AND (effective_to IS NULL OR effective_to>NOW())
      ORDER BY (market_symbol IS NOT NULL) DESC,(asset_symbol IS NOT NULL) DESC,effective_from DESC,id DESC`,[operationType]);
    return {rules:r.rows};
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
