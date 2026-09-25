import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';
import { requireAuth, type AuthClaims } from '../auth.js';

const scrypt = promisify(scryptCallback);
type Req = FastifyRequest & { auth: AuthClaims };
type Settings = {
  theme: 'dark'|'light';
  notifications_enabled: boolean;
  keyboard_sound_enabled: boolean;
  font_scale: number;
  pin_enabled: boolean;
};

async function hashPin(pin: string) {
  const salt = randomBytes(16).toString('base64url');
  const digest = (await scrypt(pin, salt, 64)) as Buffer;
  return `scrypt$${salt}$${digest.toString('base64url')}`;
}
async function verifyPin(pin: string, encoded: string) {
  const parts = encoded.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const expected = Buffer.from(parts[2], 'base64url');
  if (expected.length !== 64) return false;
  const actual = (await scrypt(pin, parts[1], expected.length)) as Buffer;
  return timingSafeEqual(expected, actual);
}
function validPin(pin: unknown): pin is string {
  return typeof pin === 'string' && /^\d{4}$/.test(pin);
}
async function ensure(pool: Pool, identityId: string) {
  await pool.query(
    `INSERT INTO user_settings(identity_id) VALUES($1) ON CONFLICT(identity_id) DO NOTHING`,
    [identityId]
  );
}
async function get(pool: Pool, identityId: string) {
  await ensure(pool, identityId);
  const r = await pool.query<Settings>(
    `SELECT theme,notifications_enabled,keyboard_sound_enabled,font_scale,pin_enabled
     FROM user_settings WHERE identity_id=$1`,
    [identityId]
  );
  return r.rows[0];
}
async function audit(pool: Pool, req: Req, action: string, metadata: Record<string, unknown> = {}) {
  await pool.query(
    `INSERT INTO audit_logs(identity_id,actor_type,actor_identity_id,action,resource_type,resource_id,request_id,ip_address,metadata)
     VALUES($1,'user',$1,$2,'user_settings',$1,$3,$4,$5)`,
    [req.auth.sub, action, req.id, req.ip, metadata]
  ).catch(() => {});
}

export function registerUserSettingsRoutes(app: FastifyInstance, pool: Pool) {
  app.get('/api/v1/settings', { preHandler: requireAuth }, async (request) => {
    const req = request as Req;
    return { settings: await get(pool, req.auth.sub) };
  });

  app.patch('/api/v1/settings', { preHandler: requireAuth }, async (request, reply) => {
    const req = request as Req;
    const body = (request.body ?? {}) as Partial<{
      theme: string; notifications_enabled: boolean;
      keyboard_sound_enabled: boolean; font_scale: number;
    }>;
    if (body.theme !== undefined && !['dark','light'].includes(body.theme)) return reply.code(400).send({ error: 'invalid_theme' });
    if (body.font_scale !== undefined && (!Number.isInteger(body.font_scale) || body.font_scale < 0 || body.font_scale > 10)) return reply.code(400).send({ error: 'invalid_font_scale' });
    if (body.notifications_enabled !== undefined && typeof body.notifications_enabled !== 'boolean') return reply.code(400).send({ error: 'invalid_notifications_enabled' });
    if (body.keyboard_sound_enabled !== undefined && typeof body.keyboard_sound_enabled !== 'boolean') return reply.code(400).send({ error: 'invalid_keyboard_sound_enabled' });
    await ensure(pool, req.auth.sub);
    const r = await pool.query(
      `UPDATE user_settings SET
        theme=COALESCE($1,theme),
        notifications_enabled=COALESCE($2,notifications_enabled),
        keyboard_sound_enabled=COALESCE($3,keyboard_sound_enabled),
        font_scale=COALESCE($4,font_scale)
       WHERE identity_id=$5
       RETURNING theme,notifications_enabled,keyboard_sound_enabled,font_scale,pin_enabled`,
      [body.theme ?? null, body.notifications_enabled ?? null, body.keyboard_sound_enabled ?? null, body.font_scale ?? null, req.auth.sub]
    );
    await audit(pool, req, 'user_settings.update');
    return { settings: r.rows[0] };
  });

  app.put('/api/v1/settings/pin', { preHandler: requireAuth }, async (request, reply) => {
    const req = request as Req;
    const body = (request.body ?? {}) as { action?: 'enable'|'change'|'disable'; currentPin?: string; newPin?: string };
    if (!['enable','change','disable'].includes(body.action ?? '')) return reply.code(400).send({ error: 'invalid_pin_action' });
    await ensure(pool, req.auth.sub);
    const existing = await pool.query<{pin_enabled:boolean;pin_hash:string|null}>(
      'SELECT pin_enabled,pin_hash FROM user_settings WHERE identity_id=$1',[req.auth.sub]
    );
    const current = existing.rows[0];
    if (body.action === 'enable' || body.action === 'change') {
      if (!validPin(body.newPin)) return reply.code(400).send({ error: 'invalid_pin' });
    }
    if (body.action !== 'enable') {
      if (!validPin(body.currentPin) || !current?.pin_enabled || !current.pin_hash || !(await verifyPin(body.currentPin, current.pin_hash))) {
        return reply.code(401).send({ error: 'invalid_current_pin' });
      }
    }
    if (body.action === 'disable') {
      await pool.query('UPDATE user_settings SET pin_enabled=false,pin_hash=NULL WHERE identity_id=$1',[req.auth.sub]);
    } else {
      await pool.query('UPDATE user_settings SET pin_enabled=true,pin_hash=$1 WHERE identity_id=$2',[await hashPin(body.newPin!),req.auth.sub]);
    }
    await audit(pool, req, `user_settings.pin_${body.action}`);
    return { settings: await get(pool, req.auth.sub) };
  });

  app.post('/api/v1/settings/pin/verify', { preHandler: requireAuth }, async (request, reply) => {
    const req = request as Req;
    const body = (request.body ?? {}) as { pin?: string };
    if (!validPin(body.pin)) return reply.code(400).send({ error: 'invalid_pin' });
    await ensure(pool, req.auth.sub);
    const r = await pool.query<{pin_enabled:boolean;pin_hash:string|null}>('SELECT pin_enabled,pin_hash FROM user_settings WHERE identity_id=$1',[req.auth.sub]);
    if (!r.rows[0]?.pin_enabled || !r.rows[0].pin_hash) return reply.code(409).send({ error: 'pin_disabled' });
    if (!(await verifyPin(body.pin, r.rows[0].pin_hash))) return reply.code(401).send({ error: 'invalid_pin' });
    return { verified: true };
  });
}
