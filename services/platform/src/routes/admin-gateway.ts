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
  // Browser-facing admin proxy for An Pardaz banking/service operations.
  const anpardazBase = () => (process.env.ANPARDAZ_SERVICE_URL ?? 'http://localhost:4001').replace(/\/$/, '');

  app.get('/api/v1/admin/ecosystem/anpardaz/operations', { preHandler: requireAuth }, async (request, reply) => {
    const req = reqAuth(request);
    if (!(await hasPermission(pool, req.auth, 'operations.read'))) return reply.code(403).send({ error: 'forbidden' });
    const q = request.url.includes('?') ? request.url.slice(request.url.indexOf('?')) : '';
    const result = await fetchJson(anpardazBase() + '/api/v1/services/operations' + q, { headers: forwardUser(request) });
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
      const ansarrafToken = process.env.ANSARRAF_INTERNAL_TOKEN;
      const anpardazToken = process.env.ANPARDAZ_INTERNAL_TOKEN;
      const accountingToken = process.env.ACCOUNTING_INTERNAL_TOKEN;
      if (!ansarrafToken || !anpardazToken || !accountingToken) return reply.code(503).send({ error: 'internal_service_credentials_not_configured' });

      const [ansarraf, anpardaz, accounting] = await Promise.all([
        fetchJson(`${ansarrafUrl.replace(/\/$/, '')}/internal/v1/admin/users/${encodeURIComponent(identityId)}/summary`, {
          headers: { authorization: `Bearer ${ansarrafToken}` },
        }),
        fetchJson(`${anpardazUrl.replace(/\/$/, '')}/internal/v1/admin/users/${encodeURIComponent(identityId)}/summary`, {
          headers: { authorization: `Bearer ${anpardazToken}` },
        }),
        fetchJson(`${accountingUrl.replace(/\/$/, '')}/internal/v1/ledger/accounts?ownerIdentityId=${encodeURIComponent(identityId)}&limit=500`, {
          headers: { authorization: `Bearer ${accountingToken}` },
        }),
      ]);

      return {
        user: platform.rows[0],
        services: {
          ansarraf: ansarraf.ok ? ansarraf.body : { unavailable: true, status: ansarraf.status, error: ansarraf.body },
          anpardaz: anpardaz.ok ? anpardaz.body : { unavailable: true, status: anpardaz.status, error: anpardaz.body },
          accounting: accounting.ok ? accounting.body : { unavailable: true, status: accounting.status, error: accounting.body },
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
}
