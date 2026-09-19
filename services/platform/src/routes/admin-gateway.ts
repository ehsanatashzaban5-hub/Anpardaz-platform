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
  app.get<{ Params: { operationId: string } }>(
    '/api/v1/admin/ecosystem/operations/:operationId/trace',
    { preHandler: requireAuth },
    async (request, reply) => {
      const req = reqAuth(request);
      if (!(await hasPermission(pool, req.auth, 'users.read'))) return reply.code(403).send({ error: 'forbidden' });
      const operationId = request.params.operationId?.trim();
      if (!operationId || operationId.length > 200) return reply.code(400).send({ error: 'invalid_operation_id' });
      const ansarrafUrl = process.env.ANSARRAF_SERVICE_URL ?? 'http://localhost:4002';
      const ansarrafToken = process.env.ANSARRAF_INTERNAL_TOKEN;
      if (!ansarrafToken) return reply.code(503).send({ error: 'internal_service_credentials_not_configured' });
      const trace = await fetchJson(
        `${ansarrafUrl.replace(/\/$/, '')}/internal/v1/admin/operations/${encodeURIComponent(operationId)}/trace`,
        { headers: { authorization: `Bearer ${ansarrafToken}` } },
        Number(process.env.ACCOUNTING_HTTP_TIMEOUT_MS ?? 5000) + 2000,
      );
      if (!trace.ok) return reply.code(trace.status).send({ error: 'ansarraf_trace_unavailable', upstream: trace.body });
      return trace.body;
    },
  );

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
      const accountingUrl = process.env.ACCOUNTING_SERVICE_URL ?? 'http://localhost:4004';
      const ansarrafToken = process.env.ANSARRAF_INTERNAL_TOKEN;
      const accountingToken = process.env.ACCOUNTING_INTERNAL_TOKEN;
      if (!ansarrafToken || !accountingToken) return reply.code(503).send({ error: 'internal_service_credentials_not_configured' });

      const [ansarraf, accounting] = await Promise.all([
        fetchJson(`${ansarrafUrl.replace(/\/$/, '')}/internal/v1/admin/users/${encodeURIComponent(identityId)}/summary`, {
          headers: { authorization: `Bearer ${ansarrafToken}` },
        }),
        fetchJson(`${accountingUrl.replace(/\/$/, '')}/internal/v1/ledger/accounts?ownerIdentityId=${encodeURIComponent(identityId)}&limit=500`, {
          headers: { authorization: `Bearer ${accountingToken}` },
        }),
      ]);

      return {
        user: platform.rows[0],
        services: {
          ansarraf: ansarraf.ok ? ansarraf.body : { unavailable: true, status: ansarraf.status, error: ansarraf.body },
          accounting: accounting.ok ? accounting.body : { unavailable: true, status: accounting.status, error: accounting.body },
        },
      };
    },
  );
}
