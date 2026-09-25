import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';
import { requireAuth, type AuthClaims } from '../auth.js';

const scrypt = promisify(scryptCallback);

type SettingsBody = {
  theme?: 'dark'|'light';
  notificationsEnabled?: boolean;
  keyboardSoundEnabled?: boolean;
  fontScale?: number;
};

type PinBody = { currentPin?: string; newPin?: string };

async function hashPin(pin: string) {
  const salt = randomBytes(16).toString('base64url');
  const digest = await scrypt(pin, salt, 64) as Buffer;
  return `scrypt$${salt}$${digest.toString('base64url')}`;
}

async function verifyPin(pin: string, stored: string | null) {
  if (!stored) return false;
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const expected = Buffer.from(parts[2], 'base64url');
  if (expected.length !== 64) return false;
  const actual = await scrypt(pin, parts[1], expected.length) as Buffer;
  return timingSafeEqual(expected, actual);
}

function claims(req: FastifyRequest) {
  return (req as FastifyRequest & {auth: AuthClaims}).auth;
}

function validPin(v: unknown): v is string {
  return typeof v === 'string' && /^[0-9۰-۹]{4}$/.test(v);
}

async function ensureRow(pool: Pool, identityId: string) {
  await pool.query(
    'INSERT INTO user_settings(identity_id) VALUES($1) ON CONFLICT(identity_id) DO NOTHING',
    [identityId],
  );
}

export function registerUserSettingsRoutes(app: FastifyInstance, pool: Pool) {
  app.get('/api/v1/settings', {preHandler: requireAuth}, async (request, reply) => {
    const identityId = claims(request).sub;
    await ensureRow(pool, identityId);
    const r = await pool.query(
      `SELECT theme, notifications_enabled, keyboard_sound_enabled, font_scale,
              pin_enabled, pin_updated_at, updated_at
       FROM user_settings WHERE identity_id=$1`,
      [identityId],
    );
    const s = r.rows[0];
    return {settings: {
      theme: s.theme,
      notificationsEnabled: s.notifications_enabled,
      keyboardSoundEnabled: s.keyboard_sound_enabled,
      fontScale: s.font_scale,
      pinEnabled: s.pin_enabled,
      pinUpdatedAt: s.pin_updated_at,
      updatedAt: s.updated_at,
    }};
  });

  app.put<{Body: SettingsBody}>('/api/v1/settings', {preHandler: requireAuth}, async (request, reply) => {
    const identityId = claims(request).sub;
    const body = request.body ?? {};
    if (body.theme !== undefined && body.theme !== 'dark' && body.theme !== 'light')
      return reply.code(400).send({error:'invalid_theme'});
    if (body.notificationsEnabled !== undefined && typeof body.notificationsEnabled !== 'boolean')
      return reply.code(400).send({error:'invalid_notifications'});
    if (body.keyboardSoundEnabled !== undefined && typeof body.keyboardSoundEnabled !== 'boolean')
      return reply.code(400).send({error:'invalid_keyboard_sound'});
    if (body.fontScale !== undefined && (!Number.isInteger(body.fontScale) || body.fontScale < 0 || body.fontScale > 10))
      return reply.code(400).send({error:'invalid_font_scale'});

    await ensureRow(pool, identityId);
    await pool.query(
      `UPDATE user_settings SET
        theme=COALESCE($2,theme),
        notifications_enabled=COALESCE($3,notifications_enabled),
        keyboard_sound_enabled=COALESCE($4,keyboard_sound_enabled),
        font_scale=COALESCE($5,font_scale),
        updated_at=NOW()
       WHERE identity_id=$1`,
      [identityId, body.theme ?? null, body.notificationsEnabled ?? null,
       body.keyboardSoundEnabled ?? null, body.fontScale ?? null],
    );
    return {ok:true};
  });

  app.post<{Body: PinBody}>('/api/v1/settings/pin/enable', {preHandler: requireAuth}, async (request, reply) => {
    const identityId = claims(request).sub;
    const pin = request.body?.newPin;
    if (!validPin(pin)) return reply.code(400).send({error:'invalid_pin'});
    await ensureRow(pool, identityId);
    await pool.query(
      'UPDATE user_settings SET pin_hash=$2,pin_enabled=TRUE,pin_updated_at=NOW(),updated_at=NOW() WHERE identity_id=$1',
      [identityId, await hashPin(pin)],
    );
    return {ok:true,pinEnabled:true};
  });

  app.post<{Body: PinBody}>('/api/v1/settings/pin/change', {preHandler: requireAuth}, async (request, reply) => {
    const identityId = claims(request).sub;
    const {currentPin,newPin} = request.body ?? {};
    if (!validPin(currentPin) || !validPin(newPin)) return reply.code(400).send({error:'invalid_pin'});
    await ensureRow(pool, identityId);
    const r = await pool.query('SELECT pin_hash,pin_enabled FROM user_settings WHERE identity_id=$1',[identityId]);
    if (!r.rows[0]?.pin_enabled || !(await verifyPin(currentPin, r.rows[0].pin_hash)))
      return reply.code(401).send({error:'invalid_current_pin'});
    await pool.query(
      'UPDATE user_settings SET pin_hash=$2,pin_enabled=TRUE,pin_updated_at=NOW(),updated_at=NOW() WHERE identity_id=$1',
      [identityId, await hashPin(newPin)],
    );
    return {ok:true,pinEnabled:true};
  });

  app.post<{Body: PinBody}>('/api/v1/settings/pin/disable', {preHandler: requireAuth}, async (request, reply) => {
    const identityId = claims(request).sub;
    const currentPin = request.body?.currentPin;
    if (!validPin(currentPin)) return reply.code(400).send({error:'invalid_pin'});
    await ensureRow(pool, identityId);
    const r = await pool.query('SELECT pin_hash,pin_enabled FROM user_settings WHERE identity_id=$1',[identityId]);
    if (!r.rows[0]?.pin_enabled || !(await verifyPin(currentPin, r.rows[0].pin_hash)))
      return reply.code(401).send({error:'invalid_current_pin'});
    await pool.query(
      'UPDATE user_settings SET pin_hash=NULL,pin_enabled=FALSE,pin_updated_at=NOW(),updated_at=NOW() WHERE identity_id=$1',
      [identityId],
    );
    return {ok:true,pinEnabled:false};
  });
}
