import { createPublicKey, verify as verifyData } from 'node:crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Pool } from 'pg';

type Claims = {
  sub: string;
  email: string;
  role: string;
  iss: string;
  aud: 'anpardaz-ecosystem';
  iat: number;
  exp: number;
};
type AuthBody = { email?: string; password?: string };

const PUBLIC_KEY_B64 = process.env.IDENTITY_PUBLIC_KEY_B64;
if (!PUBLIC_KEY_B64) throw new Error('IDENTITY_PUBLIC_KEY_B64 must be configured');
const publicKey = createPublicKey({
  key: Buffer.from(PUBLIC_KEY_B64, 'base64'),
  format: 'der',
  type: 'spki',
});
const identityUrl = () => (process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:4003').replace(/\/$/, '');
const valid = (b: AuthBody): b is Required<AuthBody> =>
  typeof b.email === 'string' &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email) &&
  typeof b.password === 'string' &&
  b.password.length >= 10 &&
  b.password.length <= 128;

export function verifyIdentityToken(t: string): Claims | null {
  if (typeof t !== 'string' || t.length < 32 || t.length > 8192) return null;
  const parts = t.split('.');
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  if (!h || !p || !s) return null;
  try {
    const header = JSON.parse(Buffer.from(h, 'base64url').toString()) as { alg?: string; typ?: string };
    if (header.alg !== 'EdDSA' || header.typ !== 'JWT') return null;
    if (!verifyData(null, Buffer.from(h + '.' + p), publicKey, Buffer.from(s, 'base64url'))) return null;

    const c = JSON.parse(Buffer.from(p, 'base64url').toString()) as Claims;
    const now = Math.floor(Date.now() / 1000);
    if (typeof c.sub !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(c.sub)) return null;
    if (typeof c.email !== 'string' || !valid({ email: c.email, password: '0123456789' })) return null;
    if (typeof c.role !== 'string' || !['user', 'admin', 'super_admin', 'operator', 'editor', 'moderator', 'support'].includes(c.role)) return null;
    if (
      c.aud !== 'anpardaz-ecosystem' ||
      c.iss !== (process.env.IDENTITY_ISSUER ?? 'anpardaz-platform') ||
      typeof c.iat !== 'number' ||
      typeof c.exp !== 'number' ||
      !Number.isSafeInteger(c.iat) ||
      !Number.isSafeInteger(c.exp) ||
      c.iat > now + 60 ||
      c.exp <= now ||
      c.exp > c.iat + 3600
    ) return null;
    return c;
  } catch {
    return null;
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const h = req.headers.authorization;
  const token = h?.startsWith('Bearer ') ? h.slice(7) : '';
  const c = token ? verifyIdentityToken(token) : null;
  if (!c) return reply.code(401).send({ error: 'unauthorized' });
  try {
    const internalToken = process.env.ANSARRAF_INTERNAL_TOKEN?.trim();
    if (!internalToken) return reply.code(503).send({ error: 'internal_identity_token_not_configured' });
    const upstream = await fetch(identityUrl() + '/internal/v1/identity/introspect', {
      headers: { authorization: 'Bearer ' + internalToken, 'x-identity-token': token, accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    });
    if (!upstream.ok) return reply.code(upstream.status === 401 || upstream.status === 403 ? 401 : 503)
      .send({ error: upstream.status === 401 || upstream.status === 403 ? 'unauthorized' : 'identity_service_unavailable' });
    const data = await upstream.json().catch(() => null) as any;
    const u = data?.user;
    if (!u || u.status !== 'active' || String(u.identity_id ?? '') !== c.sub) return reply.code(401).send({ error: 'unauthorized' });
    if (typeof u.role === 'string') c.role = u.role;
    if (typeof u.email === 'string') c.email = u.email;
    (req as FastifyRequest & { auth: Claims }).auth = c;
  } catch (error) {
    req.log.warn({ error }, 'identity revalidation failed');
    return reply.code(503).send({ error: 'identity_service_unavailable' });
  }
}

export async function ensureCustomer(pool: Pool, auth: Claims) {
  const existing = await pool.query<{ id: string; status: string }>(
    'SELECT id,status FROM customers WHERE identity_id=$1 LIMIT 1',
    [auth.sub],
  );
  if (existing.rows[0]) {
    if (existing.rows[0].status !== 'active') throw new Error('customer_inactive');
    return existing.rows[0].id;
  }

  const result = await pool.query<{ id: string }>(
    'INSERT INTO customers(identity_id,external_user_id,email) VALUES($1,$1,$2) ON CONFLICT(identity_id) DO UPDATE SET email=EXCLUDED.email RETURNING id',
    [auth.sub, auth.email],
  );
  return result.rows[0].id;
}

export type AuthClaims = Claims;
