import type { Pool } from 'pg';

export type MarketQuote = {
  symbol: string;
  provider: 'wallex' | 'nobitex' | 'tabdeal';
  lastPrice: string;
  bidPrice: string | null;
  askPrice: string | null;
  fetchedAt: string;
  stale: boolean;
};

type Normalized = Omit<MarketQuote, 'stale' | 'fetchedAt'>;

const REQUEST_TIMEOUT_MS = 5000;
const STALE_AFTER_MS = 15000;
const POLL_INTERVAL_MS = 5000;
const TABDEAL_REFRESH_INTERVAL_MS = 30000;

const TRACKED = new Set([
  'BTC/USDT','ETH/USDT','BNB/USDT','XRP/USDT','ADA/USDT','SOL/USDT',
  'AVAX/USDT','DOT/USDT','MATIC/USDT','LINK/USDT','UNI/USDT','ATOM/USDT',
  'LTC/USDT','ETC/USDT','DOGE/USDT','TRX/USDT','NEAR/USDT','ALGO/USDT',
  'VET/USDT','SHIB/USDT','APE/USDT','OP/USDT','ARB/USDT','INJ/USDT',
  'SUI/USDT','PEPE/USDT','WIF/USDT','JUP/USDT',
  'BTC/TOMAN','ETH/TOMAN','USDT/TOMAN','BNB/TOMAN','SOL/TOMAN','DOGE/TOMAN',
]);

const PROVIDER_SYMBOLS: Record<string,string> = {
  'BTC/USDT':'BTCUSDT','ETH/USDT':'ETHUSDT','BNB/USDT':'BNBUSDT','XRP/USDT':'XRPUSDT',
  'ADA/USDT':'ADAUSDT','SOL/USDT':'SOLUSDT','AVAX/USDT':'AVAXUSDT','DOT/USDT':'DOTUSDT',
  'MATIC/USDT':'MATICUSDT','LINK/USDT':'LINKUSDT','UNI/USDT':'UNIUSDT','ATOM/USDT':'ATOMUSDT',
  'LTC/USDT':'LTCUSDT','ETC/USDT':'ETCUSDT','DOGE/USDT':'DOGEUSDT','TRX/USDT':'TRXUSDT',
  'NEAR/USDT':'NEARUSDT','ALGO/USDT':'ALGOUSDT','VET/USDT':'VETUSDT','SHIB/USDT':'SHIBUSDT',
  'APE/USDT':'APEUSDT','OP/USDT':'OPUSDT','ARB/USDT':'ARBUSDT','INJ/USDT':'INJUSDT',
  'SUI/USDT':'SUIUSDT','PEPE/USDT':'PEPEUSDT','WIF/USDT':'WIFUSDT','JUP/USDT':'JUPUSDT',
  'BTC/TOMAN':'BTCTMN','ETH/TOMAN':'ETHTMN','USDT/TOMAN':'USDTTMN',
  'BNB/TOMAN':'BNBTMN','SOL/TOMAN':'SOLTMN','DOGE/TOMAN':'DOGETMN',
};

function validNumber(value: unknown): value is string | number {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') return /^\d+(?:\.\d+)?$/.test(value) && Number.isFinite(Number(value));
  return false;
}

function normalize(provider: Normalized): Normalized | null {
  if (!validNumber(provider.lastPrice) || Number(provider.lastPrice) <= 0) return null;
  if (provider.bidPrice != null && (!validNumber(provider.bidPrice) || Number(provider.bidPrice) <= 0)) provider.bidPrice = null;
  if (provider.askPrice != null && (!validNumber(provider.askPrice) || Number(provider.askPrice) <= 0)) provider.askPrice = null;
  return provider;
}

async function getJson(url: string): Promise<any> {
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`provider_http_${response.status}`);
  return response.json();
}

async function fetchWallex(): Promise<Normalized[]> {
  const data = await getJson('https://api.wallex.ir/v1/markets');
  const symbols = data?.result?.symbols;
  if (!symbols || typeof symbols !== 'object') throw new Error('wallex_invalid_response');
  const result: Normalized[] = [];
  for (const market of Object.values(symbols) as any[]) {
    const base = String(market?.baseAsset ?? '').toUpperCase();
    const quote = String(market?.quoteAsset ?? '').toUpperCase();
    if (!base || !['USDT','TMN'].includes(quote) || base === quote) continue;
    const appSymbol = `${base}/${quote === 'TMN' ? 'TOMAN' : 'USDT'}`;
    const stats = market?.stats;
    const q = normalize({
      symbol: appSymbol,
      provider: 'wallex',
      lastPrice: String(stats?.lastPrice ?? ''),
      bidPrice: stats?.bidPrice == null ? null : String(stats.bidPrice),
      askPrice: stats?.askPrice == null ? null : String(stats.askPrice),
    });
    if (q) result.push(q);
  }
  return result;
}

async function fetchNobitex(): Promise<Normalized[]> {
  const data = await getJson('https://api.nobitex.ir/market/stats');
  const stats = data?.stats;
  if (!stats || typeof stats !== 'object') throw new Error('nobitex_invalid_response');
  const result: Normalized[] = [];
  for (const [marketSymbol, market] of Object.entries(stats) as [string, any][]) {
    const [base, quote] = marketSymbol.toUpperCase().split('-');
    if (!base || !['RLS','USDT'].includes(quote) || base === quote) continue;
    const appSymbol = `${base}/${quote === 'RLS' ? 'TOMAN' : 'USDT'}`;
    const divisor = quote === 'RLS' ? 10 : 1;
    const q = normalize({
      symbol: appSymbol,
      provider: 'nobitex',
      lastPrice: String(Number(market.latest ?? 0) / divisor),
      bidPrice: market.bestBuy == null ? null : String(Number(market.bestBuy) / divisor),
      askPrice: market.bestSell == null ? null : String(Number(market.bestSell) / divisor),
    });
    if (q) result.push(q);
  }
  return result;
}

async function fetchTabdeal(): Promise<Normalized[]> {
  const result: Normalized[] = [];
  for (const appSymbol of TRACKED) {
    const providerSymbol = PROVIDER_SYMBOLS[appSymbol];
    if (!providerSymbol) continue;
    try {
      const data = await getJson(`https://api1.tabdeal.org/r/api/v1/depth?symbol=${encodeURIComponent(providerSymbol)}&limit=1`);
      const bid = Array.isArray(data?.bids) ? data.bids[0]?.[0] : null;
      const ask = Array.isArray(data?.asks) ? data.asks[0]?.[0] : null;
      const last = bid && ask ? String((Number(bid) + Number(ask)) / 2) : String(bid ?? ask ?? '');
      const q = normalize({ symbol: appSymbol, provider: 'tabdeal', lastPrice: last, bidPrice: bid ? String(bid) : null, askPrice: ask ? String(ask) : null });
      if (q) result.push(q);
    } catch {
      // A single market failure must not invalidate the other Tabdeal markets.
    }
  }
  return result;
}

export class MarketDataService {
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private lastTabdealRefresh = 0;
  private readonly cache = new Map<string, MarketQuote>();
  private readonly providerHealth = new Map<string, { status: 'healthy'|'down'; checkedAt: string; error?: string }>();

  constructor(private readonly pool: Pool) {}

  async start() {
    await this.refresh();
    this.timer = setInterval(() => { void this.refresh(); }, POLL_INTERVAL_MS);
    this.timer.unref();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async refresh() {
    if (this.running) return;
    this.running = true;
    try {
      const [wallex, nobitex] = await Promise.allSettled([fetchWallex(), fetchNobitex()]);
      await this.storeProviderResult('wallex', wallex);
      await this.storeProviderResult('nobitex', nobitex);
      if (Date.now() - this.lastTabdealRefresh >= TABDEAL_REFRESH_INTERVAL_MS) {
        this.lastTabdealRefresh = Date.now();
        const tabdeal = await Promise.allSettled([fetchTabdeal()]).then(r => r[0]);
        await this.storeProviderResult('tabdeal', tabdeal);
      }
    } finally {
      this.running = false;
    }
  }

  private async storeProviderResult(provider: string, settled: PromiseSettledResult<Normalized[]>) {
    const now = new Date().toISOString();
    if (settled.status === 'rejected') {
      this.providerHealth.set(provider, { status: 'down', checkedAt: now, error: settled.reason instanceof Error ? settled.reason.message : 'provider_error' });
      return;
    }
    this.providerHealth.set(provider, { status: 'healthy', checkedAt: now });
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const quote of settled.value) {
        const fetchedAt = new Date().toISOString();
        this.cache.set(`${quote.provider}:${quote.symbol}`, { ...quote, fetchedAt, stale: false });

        // Wallex is the execution/liquidity source for An Sarraf. Keep the
        // internal asset catalogue synchronized from its live market universe.
        if (provider === 'wallex') {
          const [base, quoteAsset] = quote.symbol.split('/');
          if (base && quoteAsset) {
            const baseType = base === 'USDT' ? 'stablecoin' : 'crypto';
            const normalizedQuote = quoteAsset.toUpperCase() === 'TOMAN' ? 'TOMAN' : quoteAsset.toUpperCase();
            const quoteType = normalizedQuote === 'TOMAN' ? 'fiat' : normalizedQuote === 'USDT' ? 'stablecoin' : 'crypto';
            await client.query(
              `INSERT INTO assets(symbol,name,asset_type,decimals,status)
               VALUES($1,$1,$2,18,'active')
               ON CONFLICT(symbol) DO UPDATE SET status='active'`,
              [base.toUpperCase(), baseType],
            );
            await client.query(
              `INSERT INTO assets(symbol,name,asset_type,decimals,status)
               VALUES($1,$1,$2,18,'active')
               ON CONFLICT(symbol) DO UPDATE SET status='active'`,
              [normalizedQuote, quoteType],
            );
          }
        }

        await client.query(
          `INSERT INTO market_quotes(provider,symbol,last_price,bid_price,ask_price,fetched_at)
           VALUES($1,$2,$3,$4,$5,$6)
           ON CONFLICT(provider,symbol) DO UPDATE SET
             last_price=EXCLUDED.last_price,bid_price=EXCLUDED.bid_price,ask_price=EXCLUDED.ask_price,fetched_at=EXCLUDED.fetched_at`,
          [quote.provider, quote.symbol, quote.lastPrice, quote.bidPrice, quote.askPrice, fetchedAt],
        );
      }
      await client.query('COMMIT');
    } catch {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  }

  async getQuotes(symbol?: string) {
    const rows = await this.pool.query(
      `SELECT provider,symbol,last_price,bid_price,ask_price,fetched_at,
              (EXTRACT(EPOCH FROM (NOW()-fetched_at))*1000 > $1) AS stale
       FROM market_quotes
       WHERE ($2::text IS NULL OR symbol=$2)
       ORDER BY symbol,provider`,
      [STALE_AFTER_MS, symbol ?? null],
    );
    return rows.rows.map(row => ({
      provider: row.provider,
      symbol: row.symbol,
      lastPrice: String(row.last_price),
      bidPrice: row.bid_price == null ? null : String(row.bid_price),
      askPrice: row.ask_price == null ? null : String(row.ask_price),
      fetchedAt: new Date(row.fetched_at).toISOString(),
      stale: Boolean(row.stale),
    }));
  }

  health() {
    return Object.fromEntries(this.providerHealth.entries());
  }
}
