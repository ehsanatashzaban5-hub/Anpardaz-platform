import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';
import { ensurePlatformUser, requireAuth, type AuthClaims } from '../auth.js';

const scrypt = promisify(scryptCallback);

type SettingsBody = {
  theme?: 'dark' | 'light';
  notificationsEnabled?: boolean;
  keySoundEnabled?: boolean;
  fontScale?: number;
};

type PinBody = { currentPin?: string; newPin?: string };

function authOf(request: FastifyRequest): AuthClaims {
  return (request as FastifyRequest & { auth: AuthClaims }).auth;
}

function validPin(pin: unknown): pin is string {
  return typeof pin === 'string' && /^\d{4}$/.test(pin);
}

async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16).toString('base64url');
  const digest = (await scrypt(pin, salt, 64)) as Buffer;
  return `scrypt$${salt}$${digest.toString('base64url')}`;
}

async function verifyPin(pin: string, encoded: string | null): Promise<boolean> {
  if (!encoded) return false;
  const parts = encoded.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const expected = Buffer.from(parts[2], 'base64url');
  if (expected.length !== 64) return false;
  const actual = (await scrypt(pin, parts[1], expected.length)) as Buffer;
  return timingSafeEqual(expected, actual);
}

async function ensureSettings(pool: Pool, identityId: string) {
  await pool.query(
    `INSERT INTO platform_user_settings(identity_id)
     VALUES($1)
     ON CONFLICT(identity_id) DO NOTHING`,
    [identityId],
  );
}

export function registerUserSettingsRoutes(app: FastifyInstance, pool: Pool) {
  app.get('/api/v1/user/settings', { preHandler: requireAuth }, async (request, reply) => {
    const auth = authOf(request);
    await ensurePlatformUser(pool, auth);
    await ensureSettings(pool, auth.sub);
    const result = await pool.query(
      `SELECT theme, notifications_enabled AS "notificationsEnabled",
              key_sound_enabled AS "keySoundEnabled", font_scale AS "fontScale",
              pin_enabled AS "pinEnabled", updated_at AS "updatedAt"
       FROM platform_user_settings WHERE identity_id=$1`,
      [auth.sub],
    );
    return { settings: result.rows[0] };
  });

  app.patch<{ Body: SettingsBody }>('/api/v1/user/settings', { preHandler: requireAuth }, async (request, reply) => {
    const auth = authOf(request);
    const body = request.body ?? {};
    if (body.theme !== undefined && body.theme !== 'dark' && body.theme !== 'light')
      return reply.code(400).send({ error: 'invalid_theme' });
    if (body.notificationsEnabled !== undefined && typeof body.notificationsEnabled !== 'boolean')
      return reply.code(400).send({ error: 'invalid_notifications_enabled' });
    if (body.keySoundEnabled !== undefined && typeof body.keySoundEnabled !== 'boolean')
      return reply.code(400).send({ error: 'invalid_key_sound_enabled' });
    if (body.fontScale !== undefined && (!Number.isInteger(body.fontScale) || body.fontScale < 0 || body.fontScale > 10))
      return reply.code(400).send({ error: 'invalid_font_scale' });

    await ensurePlatformUser(pool, auth);
    await ensureSettings(pool, auth.sub);
    const result = await pool.query(
      `UPDATE platform_user_settings
       SET theme=COALESCE($2,theme),
           notifications_enabled=COALESCE($3,notifications_enabled),
           key_sound_enabled=COALESCE($4,key_sound_enabled),
           font_scale=COALESCE($5,font_scale),
           updated_at=NOW()
       WHERE identity_id=$1
       RETURNING theme, notifications_enabled AS "notificationsEnabled",
                 key_sound_enabled AS "keySoundEnabled", font_scale AS "fontScale",
                 pin_enabled AS "pinEnabled", updated_at AS "updatedAt"`,
      [auth.sub, body.theme ?? null, body.notificationsEnabled ?? null, body.keySoundEnabled ?? null, body.fontScale ?? null],
    );
    return { settings: result.rows[0] };
  });

  app.post<{ Body: PinBody }>('/api/v1/user/settings/pin/enable', { preHandler: requireAuth }, async (request, reply) => {
    const auth = authOf(request);
    if (!validPin(request.body?.newPin)) return reply.code(400).send({ error: 'invalid_new_pin' });
    await ensurePlatformUser(pool, auth);
    const pinHash = await hashPin(request.body.newPin);
    const result = await pool.query(
      `INSERT INTO platform_user_settings(identity_id,pin_hash,pin_enabled)
       VALUES($1,$2,TRUE)
       ON CONFLICT(identity_id) DO UPDATE
       SET pin_hash=EXCLUDED.pin_hash,pin_enabled=TRUE,updated_at=NOW()
       RETURNING pin_enabled AS "pinEnabled"`,
      [auth.sub, pinHash],
    );
    return { pinEnabled: result.rows[0].pinEnabled };
  });

  app.post<{ Body: PinBody }>('/api/v1/user/settings/pin/change', { preHandler: requireAuth }, async (request, reply) => {
    const auth = authOf(request);
    if (!validPin(request.body?.currentPin) || !validPin(request.body?.newPin))
      return reply.code(400).send({ error: 'invalid_pin' });
    await ensurePlatformUser(pool, auth);
    const current = await pool.query<{ pin_hash: string | null }>(
      'SELECT pin_hash FROM platform_user_settings WHERE identity_id=$1',
      [auth.sub],
    );
    if (!current.rows[0]?.pin_hash || !(await verifyPin(request.body.currentPin, current.rows[0].pin_hash)))
      return reply.code(401).send({ error: 'invalid_current_pin' });
    await pool.query(
      'UPDATE platform_user_settings SET pin_hash=$2,pin_enabled=TRUE,updated_at=NOW() WHERE identity_id=$1',
      [auth.sub, await hashPin(request.body.newPin)],
    );
    return { pinEnabled: true };
  });

  app.post<{ Body: PinBody }>('/api/v1/user/settings/pin/disable', { preHandler: requireAuth }, async (request, reply) => {
    const auth = authOf(request);
    if (!validPin(request.body?.currentPin)) return reply.code(400).send({ error: 'invalid_current_pin' });
    await ensurePlatformUser(pool, auth);
    const current = await pool.query<{ pin_hash: string | null }>(
      'SELECT pin_hash FROM platform_user_settings WHERE identity_id=$1',
      [auth.sub],
    );
    if (!current.rows[0]?.pin_hash || !(await verifyPin(request.body.currentPin, current.rows[0].pin_hash)))
      return reply.code(401).send({ error: 'invalid_current_pin' });
    await pool.query(
      'UPDATE platform_user_settings SET pin_hash=NULL,pin_enabled=FALSE,updated_at=NOW() WHERE identity_id=$1',
      [auth.sub],
    );
    return { pinEnabled: false };
  });
  app.post<{ Body: { pin?: string } }>('/api/v1/user/settings/pin/verify', { preHandler: requireAuth }, async (request, reply) => {
    const auth = authOf(request);
    if (!validPin(request.body?.pin)) return reply.code(400).send({ error: 'invalid_pin' });
    await ensurePlatformUser(pool, auth);
    const current = await pool.query<{ pin_hash: string | null; pin_enabled: boolean }>(
      'SELECT pin_hash,pin_enabled FROM platform_user_settings WHERE identity_id=$1',
      [auth.sub],
    );
    if (!current.rows[0]?.pin_enabled || !current.rows[0]?.pin_hash)
      return reply.code(409).send({ error: 'pin_disabled' });
    if (!(await verifyPin(request.body.pin, current.rows[0].pin_hash)))
      return reply.code(401).send({ error: 'invalid_pin' });
    return { verified: true };
  });

}
