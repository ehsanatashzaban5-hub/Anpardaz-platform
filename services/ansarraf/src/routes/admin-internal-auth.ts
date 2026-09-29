import type { FastifyReply, FastifyRequest } from 'fastify';

export function requireAdminInternal(
  request: FastifyRequest,
  reply: FastifyReply,
  roles: readonly string[] = ['admin','super_admin','operator','support'],
): { identityId: string; role: string } | null {
  const token = process.env.ANSARRAF_INTERNAL_TOKEN?.trim();
  const authorization = String(request.headers.authorization ?? '');
  if (!token || authorization !== 'Bearer ' + token) {
    reply.code(401).send({ error: 'unauthorized' });
    return null;
  }
  const identityId = String(request.headers['x-admin-identity'] ?? '').trim();
  const role = String(request.headers['x-admin-role'] ?? '').trim();
  if (!identityId || identityId.length > 200 || !roles.includes(role)) {
    reply.code(403).send({ error: 'forbidden' });
    return null;
  }
  return { identityId, role };
}
