import type { Pool } from "pg";
import type { AuthClaims } from "./auth.js";

const rolePermissions: Record<string, Set<string>> = {
  admin: new Set(["*"]),
  super_admin: new Set(["*"]),
  operator: new Set(["operations.read", "operations.write", "approvals.write", "users.read"]),
  support: new Set(["operations.read", "users.read"]),
  editor: new Set(["operations.read"]),
};

export async function hasPermission(_pool: Pool, auth: AuthClaims, permission: string) {
  const permissions = rolePermissions[String(auth.role)] ?? new Set<string>();
  return permissions.has("*") || permissions.has(permission);
}

export async function requirePermission(pool: Pool, auth: AuthClaims, permission: string) {
  return hasPermission(pool, auth, permission);
}
