import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';
import { ensurePlatformUser, requireAuth } from '../auth.js';

type AuthenticatedRequest = FastifyRequest & { auth: any };

export function registerForumRoutes(app: FastifyInstance, pool: Pool) {
  app.get('/api/v1/forum/rooms', async () => ({ rooms: (await pool.query("SELECT id,name,slug,description,status,created_at FROM forum_rooms WHERE status='open' ORDER BY id")).rows }));
  app.get<{ Params: { roomId: string } }>('/api/v1/forum/rooms/:roomId/messages', async (request, reply) => {
    const roomId=Number(request.params.roomId);if(!Number.isSafeInteger(roomId)||roomId<=0)return reply.code(400).send({error:'invalid_room'});
    return {messages:(await pool.query("SELECT id,room_id,identity_id,body,created_at FROM forum_room_messages WHERE room_id=$1 AND status='visible' ORDER BY id DESC LIMIT 100",[roomId])).rows};
  });
  app.post<{ Params: { roomId: string }; Body: { body?: string } }>('/api/v1/forum/rooms/:roomId/messages',{preHandler:requireAuth},async(request,reply)=>{
    const roomId=Number(request.params.roomId);const body=String(request.body?.body??'').trim();if(!Number.isSafeInteger(roomId)||roomId<=0||!body||body.length>10000)return reply.code(400).send({error:'invalid_message'});
    const auth=(request as AuthenticatedRequest).auth;const room=(await pool.query("SELECT id FROM forum_rooms WHERE id=$1 AND status='open'",[roomId])).rows[0];if(!room)return reply.code(404).send({error:'room_not_found'});
    await pool.query("INSERT INTO forum_room_members(room_id,identity_id) VALUES($1,$2) ON CONFLICT DO NOTHING",[roomId,auth.sub]);
    const r=await pool.query("INSERT INTO forum_room_messages(room_id,identity_id,body) VALUES($1,$2,$3) RETURNING id,room_id,identity_id,body,created_at",[roomId,auth.sub,body]);return reply.code(201).send({message:r.rows[0]});
  });


  app.get('/api/v1/forum/threads', async (request) => {
    const q = request.query as { page?: string; limit?: string };
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(q.limit) || 20));
    const result = await pool.query(
      "SELECT t.id,t.title,t.status,t.category_id,t.created_at,t.updated_at,u.display_name " +
      "FROM forum_threads t JOIN platform_users u ON u.id=t.user_id " +
      "WHERE t.status <> 'archived' AND t.moderation_status = 'visible' " +
      "ORDER BY t.updated_at DESC LIMIT $1 OFFSET $2",
      [limit, (page - 1) * limit],
    );
    return { items: result.rows, pagination: { page, limit } };
  });

  app.get<{ Params: { id: string } }>('/api/v1/forum/threads/:id', async (request, reply) => {
    const id = Number(request.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return reply.code(400).send({ error: 'invalid_thread_id' });
    }

    const thread = await pool.query(
      "SELECT id,title,status,category_id,created_at,updated_at " +
      "FROM forum_threads WHERE id=$1 AND status <> 'archived' AND moderation_status='visible'",
      [id],
    );
    if (!thread.rows[0]) {
      return reply.code(404).send({ error: 'thread_not_found' });
    }

    const posts = await pool.query(
      "SELECT p.id,p.body,p.created_at,u.display_name " +
      "FROM forum_posts p JOIN platform_users u ON u.id=p.user_id " +
      "WHERE p.thread_id=$1 AND p.moderation_status='visible' ORDER BY p.created_at ASC",
      [id],
    );
    return { thread: thread.rows[0], posts: posts.rows };
  });

  app.post<{ Body: { title?: string; categoryId?: number } }>(
    '/api/v1/forum/threads',
    { preHandler: requireAuth },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const body = request.body ?? {};
      if (
        typeof body.title !== 'string' ||
        body.title.trim().length < 3 ||
        body.title.length > 200 ||
        (body.categoryId !== undefined &&
          (!Number.isSafeInteger(body.categoryId) || body.categoryId <= 0))
      ) {
        return reply.code(400).send({ error: 'invalid_thread' });
      }

      const userId = await ensurePlatformUser(pool, auth);
      const result = await pool.query(
        'INSERT INTO forum_threads(user_id,category_id,title) VALUES($1,$2,$3) RETURNING *',
        [userId, body.categoryId ?? null, body.title.trim()],
      );
      return reply.code(201).send({ thread: result.rows[0] });
    },
  );

  app.post<{ Params: { id: string }; Body: { body?: string } }>(
    '/api/v1/forum/threads/:id/posts',
    { preHandler: requireAuth },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const id = Number(request.params.id);
      const body = request.body?.body;
      if (
        !Number.isSafeInteger(id) ||
        id <= 0 ||
        typeof body !== 'string' ||
        body.trim().length < 1 ||
        body.length > 10000
      ) {
        return reply.code(400).send({ error: 'invalid_post' });
      }

      const thread = await pool.query(
        "SELECT id FROM forum_threads WHERE id=$1 AND status='open' AND moderation_status='visible'",
        [id],
      );
      if (!thread.rows[0]) {
        return reply.code(404).send({ error: 'thread_not_found' });
      }

      const userId = await ensurePlatformUser(pool, auth);
      const result = await pool.query(
        'INSERT INTO forum_posts(thread_id,user_id,body) VALUES($1,$2,$3) RETURNING *',
        [id, userId, body.trim()],
      );
      await pool.query('UPDATE forum_threads SET updated_at=NOW() WHERE id=$1', [id]);
      return reply.code(201).send({ post: result.rows[0] });
    },
  );
}
