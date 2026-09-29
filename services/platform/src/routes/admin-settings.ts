import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';
import { requireAuth, type AuthClaims } from '../auth.js';

type Req = FastifyRequest & { auth: AuthClaims };

async function permitted(pool: Pool, identityId: string, permission: string) {
  const r = await pool.query<{ ok: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM admin_permissions ap
       JOIN platform_users u ON u.role = ap.role
       WHERE u.identity_id = $1 AND (ap.permission='*' OR ap.permission=$2)
     ) ok`,
    [identityId, permission]
  );
  return r.rows[0]?.ok === true;
}

async function audit(pool: Pool, request: FastifyRequest, identityId: string, action: string, key: string) {
  await pool.query(
    `INSERT INTO audit_logs(identity_id,actor_type,actor_identity_id,action,resource_type,resource_id,request_id,ip_address,metadata)
     VALUES($1,'admin',$1,$2,'platform_setting',$3,$4,$5,$6)`,
    [identityId, action, key, request.id, request.ip, {}]
  );
}

export function registerAdminSettingsRoutes(app: FastifyInstance, pool: Pool) {
  app.get('/internal/v1/admin/settings', { preHandler: requireAuth }, async (request, reply) => {
    const r = request as Req;
    if (!(await permitted(pool, r.auth.sub, 'maintenance.write'))) return reply.code(403).send({ error: 'forbidden' });
    const rows = await pool.query('SELECT key,value,updated_at FROM platform_settings ORDER BY key');
    return { settings: rows.rows };
  });

  app.put('/internal/v1/admin/settings/:key', { preHandler: requireAuth }, async (request, reply) => {
    const r = request as Req;
    if (!(await permitted(pool, r.auth.sub, 'maintenance.write'))) return reply.code(403).send({ error: 'forbidden' });
    const key = (request.params as { key: string }).key;
    const value = (request.body as { value?: unknown })?.value;
    if (!key || value === undefined || key.length > 200) return reply.code(400).send({ error: 'invalid_setting' });
    const user = await pool.query<{ id: string }>('SELECT id FROM platform_users WHERE identity_id=$1', [r.auth.sub]);
    const row = await pool.query(
      `INSERT INTO platform_settings(key,value,updated_by) VALUES($1,$2,$3)
       ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_by=EXCLUDED.updated_by,updated_at=NOW()
       RETURNING *`,
      [key, value, user.rows[0]?.id ?? null]
    );
    await audit(pool, request, r.auth.sub, 'settings.update', key);
    return { setting: row.rows[0] };
  });
}
