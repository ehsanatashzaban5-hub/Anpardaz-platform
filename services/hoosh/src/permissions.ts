import type { Pool } from 'pg';
import type { AuthClaims } from './auth.js';

export async function hasPermission(pool: Pool, auth: AuthClaims, permission: string) {
  const result = await pool.query<{ ok: boolean }>(
    `SELECT EXISTS(
       SELECT 1
       FROM hoosh_users u
       JOIN admin_permissions p ON p.role = u.role
       WHERE u.identity_id=$1 AND (p.permission='*' OR p.permission=$2)
     ) AS ok`,
    [auth.sub, permission]
  );
  return result.rows[0]?.ok === true;
}

export async function requirePermission(pool: Pool, auth: AuthClaims, permission: string) {
  return hasPermission(pool, auth, permission);
}
