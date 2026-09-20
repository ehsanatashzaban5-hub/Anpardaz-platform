import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';
import { ensureCustomer, requireAuth, type AuthClaims } from './auth.js';
import { adminDecideKyc, getKyc, getKycById, submitKyc } from './kyc.js';

type R = FastifyRequest & { auth: AuthClaims };
const ar = (x: FastifyRequest) => x as R;
const adminRoles = ['admin','super_admin','operator'];

export function registerKycRoutes(app: FastifyInstance, pool: Pool) {
  app.get('/api/v1/kyc', { preHandler: requireAuth }, async (request) => {
    const customer = await ensureCustomer(pool, ar(request).auth);
    return { kyc: await getKyc(pool, customer, false) };
  });

  app.post('/api/v1/kyc/submit', { preHandler: requireAuth }, async (request, reply) => {
    const customer = await ensureCustomer(pool, ar(request).auth);
    try {
      const kyc = await submitKyc(pool, customer, request.body, ar(request).auth.sub);
      return reply.code(200).send({ kyc });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'kyc_submission_failed';
      const status = message.startsWith('invalid_') ? 400 : message === 'kyc_submission_not_allowed' ? 409 : 503;
      return reply.code(status).send({ error: message });
    }
  });

  app.get('/api/v1/admin/kyc', { preHandler: requireAuth }, async (request, reply) => {
    if (!adminRoles.includes(ar(request).auth.role)) return reply.code(403).send({ error: 'forbidden' });
    const q = request.query as { status?: string };
    const rows = await pool.query(
      `SELECT k.id,k.customer_id,k.status,k.provider_code,k.provider_reference,k.provider_identity_match,k.provider_mobile_match,k.provider_status,k.provider_checked_at,k.submitted_at,k.approved_at,k.rejected_at,k.admin_id,k.admin_decision_reason,k.created_at,k.updated_at,c.identity_id,c.email
       FROM kyc_profiles k JOIN customers c ON c.id=k.customer_id
       WHERE ($1::text IS NULL OR k.status=$1)
       ORDER BY k.updated_at DESC LIMIT 500`,
      [typeof q.status === 'string' ? q.status : null],
    );
    return { kyc: rows.rows };
  });

  app.get('/api/v1/admin/kyc/:id', { preHandler: requireAuth }, async (request, reply) => {
    if (!adminRoles.includes(ar(request).auth.role)) return reply.code(403).send({ error: 'forbidden' });
    const id = Number((request.params as { id: string }).id);
    if (!Number.isSafeInteger(id) || id <= 0) return reply.code(400).send({ error: 'invalid_kyc_id' });
    const kyc = await getKycById(pool, id, true);
    if (!kyc) return reply.code(404).send({ error: 'kyc_not_found' });
    return { kyc };
  });

  app.post('/api/v1/admin/kyc/:id/decision', { preHandler: requireAuth }, async (request, reply) => {
    const actor = ar(request).auth;
    if (!adminRoles.includes(actor.role)) return reply.code(403).send({ error: 'forbidden' });
    const id = Number((request.params as { id: string }).id);
    const b = (request.body ?? {}) as { approve?: boolean; reason?: string };
    if (!Number.isSafeInteger(id) || id <= 0 || typeof b.approve !== 'boolean' || typeof b.reason !== 'string') return reply.code(400).send({ error: 'invalid_kyc_decision' });
    try {
      return { kyc: await adminDecideKyc(pool, id, actor.sub, b.approve, b.reason) };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'kyc_decision_failed';
      return reply.code(message === 'kyc_not_found' ? 404 : 409).send({ error: message });
    }
  });
}
