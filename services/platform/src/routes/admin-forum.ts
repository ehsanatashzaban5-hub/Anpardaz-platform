import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';
import { requireAuth, type AuthClaims } from '../auth.js';
import { hasPermission } from '../permissions.js';

type RequestWithAuth = FastifyRequest & { auth: AuthClaims };

const auth = (request: FastifyRequest) => request as RequestWithAuth;
const deny = (reply: any) => reply.code(403).send({ error: 'forbidden' });

async function audit(pool: Pool, request: RequestWithAuth, action: string, type: string, id: string) {
  await pool.query(
    "INSERT INTO audit_logs(identity_id,actor_type,actor_identity_id,action,resource_type,resource_id) VALUES($1,'admin',$1,$2,$3,$4)",
    [request.auth.sub, action, type, id],
  );
}

/**
 * Platform owns Forum. Domain services such as Market, Hoosh and Banner
 * own their own administration routes and databases.
 */
export function registerAdminForumRoutes(app: FastifyInstance, pool: Pool) {
  app.get('/internal/v1/admin/forum', { preHandler: requireAuth }, async (request, reply) => {
    const a = auth(request);
    if (!(await hasPermission(pool, a.auth, 'content.read'))) return deny(reply);

    const [threads, posts] = await Promise.all([
      pool.query('SELECT * FROM forum_threads ORDER BY updated_at DESC LIMIT 500'),
      pool.query('SELECT * FROM forum_posts ORDER BY created_at DESC LIMIT 1000'),
    ]);

    return { threads: threads.rows, posts: posts.rows };
  });

  app.patch('/internal/v1/admin/forum/threads/:id', { preHandler: requireAuth }, async (request, reply) => {
    const a = auth(request);
    if (!(await hasPermission(pool, a.auth, 'content.moderate'))) return deny(reply);

    const id = String((request.params as any).id);
    const body = (request.body ?? {}) as any;

    if (body.status && !['open', 'closed', 'archived'].includes(body.status)) {
      return reply.code(400).send({ error: 'invalid_status' });
    }

    const result = await pool.query(
      'UPDATE forum_threads SET status=COALESCE($1,status),moderation_status=COALESCE($2,moderation_status),updated_at=NOW() WHERE id=$3 RETURNING *',
      [body.status ?? null, body.moderationStatus ?? null, id],
    );

    if (!result.rows[0]) return reply.code(404).send({ error: 'thread_not_found' });

    await audit(pool, a, 'admin_forum_update', 'forum_thread', id);
    return { thread: result.rows[0] };
  });

  app.patch('/internal/v1/admin/forum/posts/:id', { preHandler: requireAuth }, async (request, reply) => {
    const a = auth(request);
    if (!(await hasPermission(pool, a.auth, 'content.moderate'))) return deny(reply);

    const id = String((request.params as any).id);
    const body = (request.body ?? {}) as any;

    if (!['visible', 'hidden', 'deleted', 'blocked'].includes(body.moderationStatus ?? '')) {
      return reply.code(400).send({ error: 'invalid_moderation_status' });
    }

    const result = await pool.query(
      'UPDATE forum_posts SET moderation_status=$1 WHERE id=$2 RETURNING *',
      [body.moderationStatus, id],
    );

    if (!result.rows[0]) return reply.code(404).send({ error: 'post_not_found' });

    await audit(pool, a, 'admin_forum_moderate', 'forum_post', id);
    return { post: result.rows[0] };
  });
}
