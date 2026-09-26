import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';
import { requireAuth, type AuthClaims } from '../auth.js';
import { hasPermission } from '../permissions.js';

type R = FastifyRequest & { auth: AuthClaims };
const reqAuth = (request: FastifyRequest) => request as R;

async function fetchJson(url: string, init: RequestInit = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    let body: unknown;
    try { body = text ? JSON.parse(text) : null; } catch { body = { error: 'invalid_upstream_response' }; }
    return { ok: response.ok, status: response.status, body };
  } catch {
    return { ok: false, status: 503, body: { error: 'upstream_unavailable' } };
  } finally {
    clearTimeout(timer);
  }
}

export function registerAdminGatewayRoutes(app: FastifyInstance, pool: Pool) {
  app.get('/api/v1/admin/ecosystem/health', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'service_health.read'))) return reply.code(403).send({ error: 'forbidden' });

    const services = [
      ['platform', process.env.PLATFORM_SERVICE_URL ?? 'http://localhost:4003'],
      ['ansarraf', process.env.ANSARRAF_SERVICE_URL ?? 'http://localhost:4002'],
      ['anpardaz', process.env.ANPARDAZ_SERVICE_URL ?? 'http://localhost:4001'],
      ['accounting', process.env.ACCOUNTING_SERVICE_URL ?? 'http://localhost:4004'],
    ] as const;
    const results = await Promise.all(services.map(async ([name, base]) => {
      const health = await fetchJson(`${base.replace(/\/$/, '')}/health`);
      return { service: name, reachable: health.ok, status: health.status, health: health.body };
    }));
    const degraded = results.some(x => !x.reachable);
    return reply.code(degraded ? 503 : 200).send({ status: degraded ? 'degraded' : 'healthy', services: results });
  });

  app.get<{ Params: { identityId: string } }>(
    '/api/v1/admin/ecosystem/users/:identityId',
    { preHandler: requireAuth },
    async (request, reply) => {
      const req = reqAuth(request);
      if (!(await hasPermission(pool, req.auth, 'users.read'))) return reply.code(403).send({ error: 'forbidden' });
      const identityId = request.params.identityId;
      const platform = await pool.query(
        'SELECT id,identity_id,email,display_name,role,status,created_at,updated_at FROM platform_users WHERE identity_id=$1 LIMIT 1',
        [identityId],
      );
      if (!platform.rows[0]) return reply.code(404).send({ error: 'user_not_found' });

      const ansarrafUrl = process.env.ANSARRAF_SERVICE_URL ?? 'http://localhost:4002';
      const anpardazUrl = process.env.ANPARDAZ_SERVICE_URL ?? 'http://localhost:4001';
      const accountingUrl = process.env.ACCOUNTING_SERVICE_URL ?? 'http://localhost:4004';
      const bannerUrl = process.env.BANNER_SERVICE_URL ?? 'http://localhost:4005';
      const ansarrafToken = process.env.ANSARRAF_INTERNAL_TOKEN;
      const anpardazToken = process.env.ANPARDAZ_INTERNAL_TOKEN;
      const accountingToken = process.env.ACCOUNTING_INTERNAL_TOKEN;
      const bannerToken = process.env.BANNER_INTERNAL_TOKEN;
      if (!ansarrafToken || !anpardazToken || !accountingToken || !bannerToken) return reply.code(503).send({ error: 'internal_service_credentials_not_configured' });

      const [ansarraf, anpardaz, accounting, banner] = await Promise.all([
        fetchJson(`${ansarrafUrl.replace(/\/$/, '')}/internal/v1/admin/users/${encodeURIComponent(identityId)}/summary`, {
          headers: { authorization: `Bearer ${ansarrafToken}` },
        }),
        fetchJson(`${anpardazUrl.replace(/\/$/, '')}/internal/v1/admin/users/${encodeURIComponent(identityId)}/summary`, {
          headers: { authorization: `Bearer ${anpardazToken}` },
        }),
        fetchJson(`${accountingUrl.replace(/\/$/, '')}/internal/v1/ledger/accounts?ownerIdentityId=${encodeURIComponent(identityId)}&limit=500`, {
          headers: { authorization: `Bearer ${accountingToken}` },
        }),
        fetchJson(`${bannerUrl.replace(/\/$/, '')}/internal/v1/admin/users/${encodeURIComponent(identityId)}/summary`, {
          headers: { authorization: `Bearer ${bannerToken}` },
        }),
      ]);

      return {
        user: platform.rows[0],
        services: {
          ansarraf: ansarraf.ok ? ansarraf.body : { unavailable: true, status: ansarraf.status, error: ansarraf.body },
          anpardaz: anpardaz.ok ? anpardaz.body : { unavailable: true, status: anpardaz.status, error: anpardaz.body },
          accounting: accounting.ok ? accounting.body : { unavailable: true, status: accounting.status, error: accounting.body },
          banner: banner.ok ? banner.body : { unavailable: true, status: banner.status, error: banner.body },
        },
      };
    },
  );

  app.get<{ Params: { operationId: string } }>(
    '/api/v1/admin/ecosystem/operations/:operationId/trace',
    { preHandler: requireAuth },
    async (request, reply) => {
      const req = reqAuth(request);
      if (!(await hasPermission(pool, req.auth, 'operations.read'))) return reply.code(403).send({ error: 'forbidden' });
      const operationId = request.params.operationId?.trim();
      if (!operationId || operationId.length > 200) return reply.code(400).send({ error: 'invalid_operation_id' });
      const ansarrafUrl = process.env.ANSARRAF_SERVICE_URL ?? 'http://localhost:4002';
      const anpardazUrl = process.env.ANPARDAZ_SERVICE_URL ?? 'http://localhost:4001';
      const accountingUrl = process.env.ACCOUNTING_SERVICE_URL ?? 'http://localhost:4004';
      const ansarrafToken = process.env.ANSARRAF_INTERNAL_TOKEN;
      const anpardazToken = process.env.ANPARDAZ_INTERNAL_TOKEN;
      const accountingToken = process.env.ACCOUNTING_INTERNAL_TOKEN;
      if (!ansarrafToken || !anpardazToken || !accountingToken) return reply.code(503).send({ error: 'internal_service_credentials_not_configured' });
      const timeout = Number(process.env.ACCOUNTING_HTTP_TIMEOUT_MS ?? 5000) + 2000;
      const platformOrders = await pool.query('SELECT id,user_id,product_id,offer_id,quantity::text,unit_price::text,currency,status,idempotency_key,operation_id,created_at,updated_at FROM market_orders WHERE operation_id=$1 ORDER BY id',[operationId]);
      const [ansarraf, anpardaz, accounting] = await Promise.all([
        fetchJson(`${ansarrafUrl.replace(/\/$/, '')}/internal/v1/admin/operations/${encodeURIComponent(operationId)}/trace`, { headers: { authorization: `Bearer ${ansarrafToken}` } }, timeout),
        fetchJson(`${anpardazUrl.replace(/\/$/, '')}/internal/v1/admin/operations/${encodeURIComponent(operationId)}/trace`, { headers: { authorization: `Bearer ${anpardazToken}` } }, timeout),
        fetchJson(`${accountingUrl.replace(/\/$/, '')}/internal/v1/ledger/transactions/by-operation/${encodeURIComponent(operationId)}`, { headers: { authorization: `Bearer ${accountingToken}` } }, timeout),
      ]);
      if (!platformOrders.rows.length && !ansarraf.ok && !anpardaz.ok && !accounting.ok) return reply.code(404).send({ error: 'operation_not_found' });
      return {
        operationId,
        platform: { marketOrders: platformOrders.rows },
        ansarraf: ansarraf.ok ? ansarraf.body : { unavailable: true, status: ansarraf.status, error: ansarraf.body },
        anpardaz: anpardaz.ok ? anpardaz.body : { unavailable: true, status: anpardaz.status, error: anpardaz.body },
        accounting: accounting.ok ? accounting.body : { unavailable: true, status: accounting.status, error: accounting.body },
      };    },
  );

  // Browser-facing admin proxy for An Sarraf operational actions.
  // The user's Platform JWT is forwarded; no service token is exposed to the browser.
  const forwardUser = (request: FastifyRequest): Record<string,string> => {
    const authorization = request.headers.authorization;
    return authorization ? { authorization } : {};
  };
  const sarrafBase = () => (process.env.ANSARRAF_SERVICE_URL ?? 'http://localhost:4002').replace(/\/$/, '');

  app.get('/api/v1/admin/ecosystem/ansarraf/kyc', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'users.read'))) return reply.code(403).send({ error: 'forbidden' });
    const q = request.url.includes('?') ? request.url.slice(request.url.indexOf('?')) : '';
    const result = await fetchJson(sarrafBase() + '/api/v1/admin/kyc' + q, { headers: forwardUser(request) });
    return reply.code(result.status).send(result.body);
  });

  app.post<{ Params: { id: string } }>('/api/v1/admin/ecosystem/ansarraf/kyc/:id/decision', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'users.read'))) return reply.code(403).send({ error: 'forbidden' });
    const result = await fetchJson(sarrafBase() + '/api/v1/admin/kyc/' + encodeURIComponent(request.params.id) + '/decision', {
      method: 'POST',
      headers: forwardUser(request),
      body: JSON.stringify(request.body ?? {}),
    });
    return reply.code(result.status).send(result.body);
  });

  app.get('/api/v1/admin/ecosystem/ansarraf/withdrawals', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'operations.read'))) return reply.code(403).send({ error: 'forbidden' });
    const q = request.url.includes('?') ? request.url.slice(request.url.indexOf('?')) : '';
    const result = await fetchJson(sarrafBase() + '/api/v1/admin/withdrawals' + q, { headers: forwardUser(request) });
    return reply.code(result.status).send(result.body);
  });

  app.post<{ Params: { id: string } }>('/api/v1/admin/ecosystem/ansarraf/withdrawals/:id/approve', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'approvals.write'))) return reply.code(403).send({ error: 'forbidden' });
    const result = await fetchJson(sarrafBase() + '/api/v1/withdrawals/' + encodeURIComponent(request.params.id) + '/approve', {
      method: 'POST',
      headers: forwardUser(request),
      body: JSON.stringify(request.body ?? {}),
    });
    return reply.code(result.status).send(result.body);
  });

  app.post<{ Params: { id: string } }>('/api/v1/admin/ecosystem/ansarraf/withdrawals/:id/reject', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'approvals.write'))) return reply.code(403).send({ error: 'forbidden' });
    const result = await fetchJson(sarrafBase() + '/api/v1/withdrawals/' + encodeURIComponent(request.params.id) + '/reject', {
      method: 'POST',
      headers: forwardUser(request),
      body: JSON.stringify(request.body ?? {}),
    });
    return reply.code(result.status).send(result.body);
  });

  app.post<{ Params: { id: string } }>('/api/v1/admin/ecosystem/ansarraf/withdrawals/:id/complete-toman', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'approvals.write'))) return reply.code(403).send({ error: 'forbidden' });
    const result = await fetchJson(sarrafBase() + '/api/v1/admin/withdrawals/' + encodeURIComponent(request.params.id) + '/complete-toman', {
      method: 'POST', headers: forwardUser(request), body: JSON.stringify(request.body ?? {}),
    });
    return reply.code(result.status).send(result.body);
  });

  app.post<{ Params: { id: string } }>('/api/v1/admin/ecosystem/ansarraf/withdrawals/:id/reconcile', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'reconciliation.write'))) return reply.code(403).send({ error: 'forbidden' });
    const result = await fetchJson(sarrafBase() + '/api/v1/admin/withdrawals/' + encodeURIComponent(request.params.id) + '/reconcile', {
      method: 'POST',
      headers: forwardUser(request),
      body: JSON.stringify(request.body ?? {}),
    });
    return reply.code(result.status).send(result.body);
  });
  // Browser-facing admin proxy for An Sarraf manual Toman funding.
  app.get('/api/v1/admin/ecosystem/ansarraf/deposits/manual', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'operations.read'))) return reply.code(403).send({ error: 'forbidden' });
    const token = process.env.ANSARRAF_INTERNAL_TOKEN;
    if (!token) return reply.code(503).send({ error: 'ansarraf_internal_token_not_configured' });
    const base = sarrafBase();
    const q = request.url.includes('?') ? request.url.slice(request.url.indexOf('?')) : '';
    const result = await fetchJson(base + '/internal/v1/admin/deposits/manual' + q, { headers: { authorization: 'Bearer ' + token, 'x-admin-identity': req.auth.sub } });
    return reply.code(result.status).send(result.body);
  });

  app.post('/api/v1/admin/ecosystem/ansarraf/deposits/manual/credit', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'approvals.write'))) return reply.code(403).send({ error: 'forbidden' });
    const token = process.env.ANSARRAF_INTERNAL_TOKEN;
    if (!token) return reply.code(503).send({ error: 'ansarraf_internal_token_not_configured' });
    const result = await fetchJson(sarrafBase() + '/internal/v1/admin/deposits/manual/credit', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'x-admin-identity': req.auth.sub, 'content-type': 'application/json' },
      body: JSON.stringify(request.body ?? {}),
    }, 10000);
    return reply.code(result.status).send(result.body);
  });

  // Browser-facing admin proxy for An Pardaz banking/service operations.
  const anpardazBase = () => (process.env.ANPARDAZ_SERVICE_URL ?? 'http://localhost:4001').replace(/\/$/, '');

  app.get('/api/v1/admin/ecosystem/anpardaz/sayad-operations', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'operations.read'))) return reply.code(403).send({ error: 'forbidden' });
    const q = request.url.includes('?') ? request.url.slice(request.url.indexOf('?')) : '';
    const result = await fetchJson(anpardazBase() + '/internal/v1/admin/sayad/operations' + q, {
      headers: { authorization: process.env.ANPARDAZ_INTERNAL_TOKEN ? 'Bearer ' + process.env.ANPARDAZ_INTERNAL_TOKEN : '' },
    });
    return reply.code(result.status).send(result.body);
  });

  app.get('/api/v1/admin/ecosystem/anpardaz/banking-operations', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'operations.read'))) return reply.code(403).send({ error: 'forbidden' });
    const q = request.url.includes('?') ? request.url.slice(request.url.indexOf('?')) : '';
    const result = await fetchJson(anpardazBase() + '/internal/v1/admin/banking/operations' + q, { headers: { authorization: process.env.ANPARDAZ_INTERNAL_TOKEN ? 'Bearer ' + process.env.ANPARDAZ_INTERNAL_TOKEN : '' } });
    return reply.code(result.status).send(result.body);
  });

  app.get('/api/v1/admin/ecosystem/anpardaz/operations', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'operations.read'))) return reply.code(403).send({ error: 'forbidden' });
    const q = request.url.includes('?') ? request.url.slice(request.url.indexOf('?')) : '';
    const internalToken=process.env.ANPARDAZ_INTERNAL_TOKEN;
    if(!internalToken)return reply.code(503).send({error:'anpardaz_internal_token_not_configured'});
    const result = await fetchJson(anpardazBase() + '/internal/v1/admin/operations' + q, { headers: { authorization: 'Bearer ' + internalToken } });
    return reply.code(result.status).send(result.body);
  });

  app.get('/api/v1/admin/ecosystem/anpardaz/operations/:operationId', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'operations.read'))) return reply.code(403).send({ error: 'forbidden' });
    const operationId = (request.params as { operationId: string }).operationId?.trim();
    if (!operationId || operationId.length > 200) return reply.code(400).send({ error: 'invalid_operation_id' });
    const result = await fetchJson(anpardazBase() + '/internal/v1/admin/operations/' + encodeURIComponent(operationId) + '/trace', {
      headers: { authorization: process.env.ANPARDAZ_INTERNAL_TOKEN ? 'Bearer ' + process.env.ANPARDAZ_INTERNAL_TOKEN : '' },
    });
    return reply.code(result.status).send(result.body);
  });

  app.get('/api/v1/admin/ecosystem/anpardaz/financial-center/:identityId', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'users.read'))) return reply.code(403).send({ error: 'forbidden' });
    const identityId = (request.params as { identityId: string }).identityId?.trim();
    if (!identityId || identityId.length > 200) return reply.code(400).send({ error: 'invalid_identity_id' });
    const internalToken = process.env.ANPARDAZ_INTERNAL_TOKEN;
    if (!internalToken) return reply.code(503).send({ error: 'anpardaz_internal_token_not_configured' });
    const result = await fetchJson(anpardazBase() + '/internal/v1/admin/financial-center/' + encodeURIComponent(identityId), { headers: { authorization: 'Bearer ' + internalToken } });
    return reply.code(result.status).send(result.body);
  });

  app.get('/api/v1/admin/ecosystem/anpardaz/cards/lifecycle/:identityId', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'users.read'))) return reply.code(403).send({ error: 'forbidden' });
    const identityId = (request.params as { identityId: string }).identityId?.trim();
    if (!identityId || identityId.length > 200) return reply.code(400).send({ error: 'invalid_identity_id' });
    const internalToken = process.env.ANPARDAZ_INTERNAL_TOKEN;
    if (!internalToken) return reply.code(503).send({ error: 'anpardaz_internal_token_not_configured' });
    const result = await fetchJson(anpardazBase() + '/internal/v1/admin/cards/lifecycle/' + encodeURIComponent(identityId), {
      headers: { authorization: 'Bearer ' + internalToken },
    });
    return reply.code(result.status).send(result.body);
  });

  app.get('/api/v1/admin/ecosystem/anpardaz/cards/lookup', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'users.read'))) return reply.code(403).send({ error: 'forbidden' });
    const internalToken = process.env.ANPARDAZ_INTERNAL_TOKEN;
    if (!internalToken) return reply.code(503).send({ error: 'anpardaz_internal_token_not_configured' });
    const query = request.url.includes('?') ? request.url.slice(request.url.indexOf('?')) : '';
    const result = await fetchJson(anpardazBase() + '/internal/v1/admin/cards/lookup' + query, { headers: { authorization: 'Bearer ' + internalToken } });
    return reply.code(result.status).send(result.body);
  });

  app.get('/api/v1/admin/ecosystem/anpardaz/users/:identityId', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'users.read'))) return reply.code(403).send({ error: 'forbidden' });
    const identityId = (request.params as { identityId: string }).identityId?.trim();
    if (!identityId || identityId.length > 200) return reply.code(400).send({ error: 'invalid_identity_id' });
    const result = await fetchJson(anpardazBase() + '/internal/v1/admin/users/' + encodeURIComponent(identityId) + '/summary', {
      headers: { authorization: process.env.ANPARDAZ_INTERNAL_TOKEN ? 'Bearer ' + process.env.ANPARDAZ_INTERNAL_TOKEN : '' },
    });
    return reply.code(result.status).send(result.body);
  });

  // Browser-facing admin proxy for isolated An Banner operations.
  const bannerBase = () => (process.env.BANNER_SERVICE_URL ?? 'http://localhost:4005').replace(/\/$/, '');
  const bannerHeaders = (): Record<string,string> => ({ authorization: 'Bearer ' + (process.env.BANNER_INTERNAL_TOKEN ?? '') });

  app.get('/api/v1/admin/ecosystem/banner/overview', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'banner.read'))) return reply.code(403).send({ error: 'forbidden' });
    const token = process.env.BANNER_INTERNAL_TOKEN;
    if (!token) return reply.code(503).send({ error: 'banner_internal_token_not_configured' });
    const result = await fetchJson(bannerBase() + '/internal/v1/admin/overview', { headers: bannerHeaders() });
    return reply.code(result.status).send(result.body);
  });
  app.get('/api/v1/admin/ecosystem/banner/listings', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'banner.read'))) return reply.code(403).send({ error: 'forbidden' });
    const result = await fetchJson(bannerBase() + '/internal/v1/admin/listings' + (request.url.includes('?') ? request.url.slice(request.url.indexOf('?')) : ''), { headers: bannerHeaders() });
    return reply.code(result.status).send(result.body);
  });
  app.patch('/api/v1/admin/ecosystem/banner/listings/:id/status', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'banner.write'))) return reply.code(403).send({ error: 'forbidden' });
    const body = { ...(request.body as Record<string, unknown> ?? {}), actorIdentityId: req.auth.sub };
    const result = await fetchJson(bannerBase() + '/internal/v1/admin/listings/' + encodeURIComponent((request.params as { id: string }).id) + '/status', {
      method: 'PATCH', headers: { ...bannerHeaders(), 'content-type': 'application/json' }, body: JSON.stringify(body),
    });
    return reply.code(result.status).send(result.body);
  });
  app.get('/api/v1/admin/ecosystem/banner/tickets', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'banner.read'))) return reply.code(403).send({ error: 'forbidden' });
    const result = await fetchJson(bannerBase() + '/internal/v1/admin/tickets' + (request.url.includes('?') ? request.url.slice(request.url.indexOf('?')) : ''), { headers: bannerHeaders() });
    return reply.code(result.status).send(result.body);
  });
  app.get('/api/v1/admin/ecosystem/banner/tickets/:id', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'banner.read'))) return reply.code(403).send({ error: 'forbidden' });
    const result = await fetchJson(bannerBase() + '/internal/v1/admin/tickets/' + encodeURIComponent((request.params as { id: string }).id), { headers: bannerHeaders() });
    return reply.code(result.status).send(result.body);
  });
  app.post('/api/v1/admin/ecosystem/banner/tickets/:id/reply', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'banner.write'))) return reply.code(403).send({ error: 'forbidden' });
    const body = { ...(request.body as Record<string, unknown> ?? {}), adminIdentityId: req.auth.sub };
    const result = await fetchJson(bannerBase() + '/internal/v1/admin/tickets/' + encodeURIComponent((request.params as { id: string }).id) + '/reply', {
      method: 'POST', headers: { ...bannerHeaders(), 'content-type': 'application/json' }, body: JSON.stringify(body),
    });
    return reply.code(result.status).send(result.body);
  });
  app.patch('/api/v1/admin/ecosystem/banner/tickets/:id', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'banner.write'))) return reply.code(403).send({ error: 'forbidden' });
    const body = { ...(request.body as Record<string, unknown> ?? {}), adminIdentityId: req.auth.sub };
    const result = await fetchJson(bannerBase() + '/internal/v1/admin/tickets/' + encodeURIComponent((request.params as { id: string }).id), {
      method: 'PATCH', headers: { ...bannerHeaders(), 'content-type': 'application/json' }, body: JSON.stringify(body),
    });
    return reply.code(result.status).send(result.body);
  });
  app.get('/api/v1/admin/ecosystem/banner/reports', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'banner.read'))) return reply.code(403).send({ error: 'forbidden' });
    const result = await fetchJson(bannerBase() + '/internal/v1/admin/reports' + (request.url.includes('?') ? request.url.slice(request.url.indexOf('?')) : ''), { headers: bannerHeaders() });
    return reply.code(result.status).send(result.body);
  });
  app.patch('/api/v1/admin/ecosystem/banner/reports/:id', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'banner.write'))) return reply.code(403).send({ error: 'forbidden' });
    const body = { ...(request.body as Record<string, unknown> ?? {}), adminIdentityId: req.auth.sub };
    const result = await fetchJson(bannerBase() + '/internal/v1/admin/reports/' + encodeURIComponent((request.params as { id: string }).id), {
      method: 'PATCH', headers: { ...bannerHeaders(), 'content-type': 'application/json' }, body: JSON.stringify(body),
    });
    return reply.code(result.status).send(result.body);
  });
  app.get('/api/v1/admin/ecosystem/banner/alerts', { preHandler: requireAuth }, async (request, reply) => {
    const req=reqAuth(request);if(!(await hasPermission(pool,req.auth,'banner.read')))return reply.code(403).send({error:'forbidden'});
    const result=await fetchJson(bannerBase()+'/internal/v1/admin/alerts'+(request.url.includes('?')?request.url.slice(request.url.indexOf('?')):''),{headers:bannerHeaders()});return reply.code(result.status).send(result.body);
  });
  app.patch('/api/v1/admin/ecosystem/banner/alerts/:id', { preHandler: requireAuth }, async (request, reply) => {
    const req=reqAuth(request);if(!(await hasPermission(pool,req.auth,'banner.write')))return reply.code(403).send({error:'forbidden'});
    const body={...(request.body as Record<string,unknown>??{}),adminIdentityId:req.auth.sub};const result=await fetchJson(bannerBase()+'/internal/v1/admin/alerts/'+encodeURIComponent((request.params as {id:string}).id),{method:'PATCH',headers:{...bannerHeaders(),'content-type':'application/json'},body:JSON.stringify(body)});return reply.code(result.status).send(result.body);
  });
  app.get('/api/v1/admin/ecosystem/banner/templates', { preHandler: requireAuth }, async (request, reply) => {
    const req=reqAuth(request);if(!(await hasPermission(pool,req.auth,'banner.read')))return reply.code(403).send({error:'forbidden'});
    const result=await fetchJson(bannerBase()+'/internal/v1/admin/templates',{headers:bannerHeaders()});return reply.code(result.status).send(result.body);
  });
  app.post('/api/v1/admin/ecosystem/banner/templates', { preHandler: requireAuth }, async (request, reply) => {
    const req=reqAuth(request);if(!(await hasPermission(pool,req.auth,'banner.write')))return reply.code(403).send({error:'forbidden'});
    const body={...(request.body as Record<string,unknown>??{}),adminIdentityId:req.auth.sub};const result=await fetchJson(bannerBase()+'/internal/v1/admin/templates',{method:'POST',headers:{...bannerHeaders(),'content-type':'application/json'},body:JSON.stringify(body)});return reply.code(result.status).send(result.body);
  });
  app.patch('/api/v1/admin/ecosystem/banner/templates/:id', { preHandler: requireAuth }, async (request, reply) => {
    const req=reqAuth(request);if(!(await hasPermission(pool,req.auth,'banner.write')))return reply.code(403).send({error:'forbidden'});
    const body={...(request.body as Record<string,unknown>??{}),adminIdentityId:req.auth.sub};const result=await fetchJson(bannerBase()+'/internal/v1/admin/templates/'+encodeURIComponent((request.params as {id:string}).id),{method:'PATCH',headers:{...bannerHeaders(),'content-type':'application/json'},body:JSON.stringify(body)});return reply.code(result.status).send(result.body);
  });
  app.post('/api/v1/admin/ecosystem/banner/users/:identityId/message', { preHandler: requireAuth }, async (request, reply) => {
    const req=reqAuth(request);if(!(await hasPermission(pool,req.auth,'banner.write')))return reply.code(403).send({error:'forbidden'});
    const body={...(request.body as Record<string,unknown>??{}),adminIdentityId:req.auth.sub};const result=await fetchJson(bannerBase()+'/internal/v1/admin/users/'+encodeURIComponent((request.params as {identityId:string}).identityId)+'/message',{method:'POST',headers:{...bannerHeaders(),'content-type':'application/json'},body:JSON.stringify(body)});return reply.code(result.status).send(result.body);
  });
  app.post('/api/v1/admin/ecosystem/banner/users/:identityId/restrict', { preHandler: requireAuth }, async (request, reply) => {
    const req=reqAuth(request);if(!(await hasPermission(pool,req.auth,'banner.write')))return reply.code(403).send({error:'forbidden'});
    const body={...(request.body as Record<string,unknown>??{}),adminIdentityId:req.auth.sub};const result=await fetchJson(bannerBase()+'/internal/v1/admin/users/'+encodeURIComponent((request.params as {identityId:string}).identityId)+'/restrict',{method:'POST',headers:{...bannerHeaders(),'content-type':'application/json'},body:JSON.stringify(body)});return reply.code(result.status).send(result.body);
  });
  app.post('/api/v1/admin/ecosystem/banner/users/:identityId/unrestrict', { preHandler: requireAuth }, async (request, reply) => {
    const req=reqAuth(request);if(!(await hasPermission(pool,req.auth,'banner.write')))return reply.code(403).send({error:'forbidden'});
    const body={...(request.body as Record<string,unknown>??{}),adminIdentityId:req.auth.sub};const result=await fetchJson(bannerBase()+'/internal/v1/admin/users/'+encodeURIComponent((request.params as {identityId:string}).identityId)+'/unrestrict',{method:'POST',headers:{...bannerHeaders(),'content-type':'application/json'},body:JSON.stringify(body)});return reply.code(result.status).send(result.body);
  });
  app.post('/api/v1/admin/ecosystem/banner/users/:identityId/ban', { preHandler: requireAuth }, async (request, reply) => {
    const req=reqAuth(request);if(!(await hasPermission(pool,req.auth,'banner.write')))return reply.code(403).send({error:'forbidden'});
    const body={...(request.body as Record<string,unknown>??{}),adminIdentityId:req.auth.sub};const result=await fetchJson(bannerBase()+'/internal/v1/admin/users/'+encodeURIComponent((request.params as {identityId:string}).identityId)+'/ban',{method:'POST',headers:{...bannerHeaders(),'content-type':'application/json'},body:JSON.stringify(body)});return reply.code(result.status).send(result.body);
  });
  app.get('/api/v1/admin/ecosystem/banner/activity', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'banner.read'))) return reply.code(403).send({ error: 'forbidden' });
    const result = await fetchJson(bannerBase() + '/internal/v1/admin/activity' + (request.url.includes('?') ? request.url.slice(request.url.indexOf('?')) : ''), { headers: bannerHeaders() });
    return reply.code(result.status).send(result.body);
  });
  app.get('/api/v1/admin/ecosystem/banner/audit', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'banner.read'))) return reply.code(403).send({ error: 'forbidden' });
    const result = await fetchJson(bannerBase() + '/internal/v1/admin/audit' + (request.url.includes('?') ? request.url.slice(request.url.indexOf('?')) : ''), { headers: bannerHeaders() });
    return reply.code(result.status).send(result.body);
  });
  app.get('/api/v1/admin/ecosystem/banner/users/:identityId', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'users.read'))) return reply.code(403).send({ error: 'forbidden' });
    const result = await fetchJson(bannerBase() + '/internal/v1/admin/users/' + encodeURIComponent((request.params as { identityId: string }).identityId) + '/summary', { headers: bannerHeaders() });
    return reply.code(result.status).send(result.body);
  });

}
