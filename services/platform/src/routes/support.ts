import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';
import { ensurePlatformUser, requireAuth, type AuthClaims } from '../auth.js';
import { hasPermission } from '../permissions.js';

type R = FastifyRequest & { auth: AuthClaims };
const auth = (req: FastifyRequest) => (req as R).auth;

async function adminOnly(pool: Pool, req: FastifyRequest, reply: any, permission: 'support.read'|'support.write') {
  if (!(await hasPermission(pool, auth(req), permission))) {
    await reply.code(403).send({ error: 'forbidden' });
    return false;
  }
  return true;
}

export function registerSupportRoutes(app: FastifyInstance, pool: Pool) {
  app.get('/api/v1/support/tickets', { preHandler: requireAuth }, async (req) => {
    const userId = await ensurePlatformUser(pool, auth(req));
    const result = await pool.query(
      'SELECT id,subject,status,priority,created_at,updated_at,closed_at FROM support_tickets WHERE user_id=$1 ORDER BY updated_at DESC LIMIT 100',
      [userId],
    );
    return { tickets: result.rows };
  });

  app.post('/api/v1/support/tickets', { preHandler: requireAuth }, async (req, reply) => {
    const userId = await ensurePlatformUser(pool, auth(req));
    const body = (req.body ?? {}) as { subject?: unknown; message?: unknown };
    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (subject.length < 3 || subject.length > 200 || !message || message.length > 10000) {
      return reply.code(400).send({ error: 'invalid_ticket' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const ticket = (await client.query(
        'INSERT INTO support_tickets(user_id,subject) VALUES($1,$2) RETURNING id,subject,status,priority,created_at,updated_at',
        [userId, subject],
      )).rows[0];
      await client.query(
        "INSERT INTO support_ticket_messages(ticket_id,sender_user_id,sender_role,message) VALUES($1,$2,'user',$3)",
        [ticket.id, userId, message],
      );
      await client.query('COMMIT');
      return reply.code(201).send({ ticket });
    } catch (error) {
      await client.query('ROLLBACK');
      req.log.error(error);
      return reply.code(500).send({ error: 'support_ticket_creation_failed' });
    } finally {
      client.release();
    }
  });

  app.get('/api/v1/support/tickets/:id', { preHandler: requireAuth }, async (req, reply) => {
    const userId = await ensurePlatformUser(pool, auth(req));
    const id = Number((req.params as { id: string }).id);
    if (!Number.isSafeInteger(id) || id <= 0) return reply.code(400).send({ error: 'invalid_ticket_id' });

    const ticket = (await pool.query(
      'SELECT id,subject,status,priority,created_at,updated_at,closed_at FROM support_tickets WHERE id=$1 AND user_id=$2',
      [id, userId],
    )).rows[0];
    if (!ticket) return reply.code(404).send({ error: 'ticket_not_found' });

    const messages = await pool.query(
      'SELECT id,sender_role,message,created_at FROM support_ticket_messages WHERE ticket_id=$1 ORDER BY created_at',
      [id],
    );
    return { ticket, messages: messages.rows };
  });

  app.post('/api/v1/support/tickets/:id/messages', { preHandler: requireAuth }, async (req, reply) => {
    const userId = await ensurePlatformUser(pool, auth(req));
    const id = Number((req.params as { id: string }).id);
    const body = (req.body ?? {}) as { message?: unknown };
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!Number.isSafeInteger(id) || id <= 0 || !message || message.length > 10000) {
      return reply.code(400).send({ error: 'invalid_message' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const ticket = (await client.query(
        "SELECT id FROM support_tickets WHERE id=$1 AND user_id=$2 AND status<>'closed' FOR UPDATE",
        [id, userId],
      )).rows[0];
      if (!ticket) {
        await client.query('ROLLBACK');
        return reply.code(404).send({ error: 'ticket_not_found' });
      }
      await client.query(
        "INSERT INTO support_ticket_messages(ticket_id,sender_user_id,sender_role,message) VALUES($1,$2,'user',$3)",
        [id, userId, message],
      );
      await client.query("UPDATE support_tickets SET status='open',updated_at=NOW() WHERE id=$1", [id]);
      await client.query('COMMIT');
      return { ok: true };
    } catch (error) {
      await client.query('ROLLBACK');
      req.log.error(error);
      return reply.code(500).send({ error: 'support_message_failed' });
    } finally {
      client.release();
    }
  });

  app.get('/internal/v1/admin/support/tickets', { preHandler: requireAuth }, async (req, reply) => {
    if (!(await adminOnly(pool, req, reply, 'support.read'))) return;
    const result = await pool.query(
      'SELECT t.id,t.subject,t.status,t.priority,t.created_at,t.updated_at,t.closed_at,u.email,u.display_name FROM support_tickets t JOIN platform_users u ON u.id=t.user_id ORDER BY t.updated_at DESC LIMIT 500',
    );
    return { tickets: result.rows };
  });

  app.get('/internal/v1/admin/support/tickets/:id', { preHandler: requireAuth }, async (req, reply) => {
    if (!(await adminOnly(pool, req, reply, 'support.read'))) return;
    const id = Number((req.params as { id: string }).id);
    if (!Number.isSafeInteger(id) || id <= 0) return reply.code(400).send({ error: 'invalid_ticket_id' });
    const ticket = (await pool.query(
      'SELECT t.id,t.subject,t.status,t.priority,t.created_at,t.updated_at,t.closed_at,u.email,u.display_name FROM support_tickets t JOIN platform_users u ON u.id=t.user_id WHERE t.id=$1',
      [id],
    )).rows[0];
    if (!ticket) return reply.code(404).send({ error: 'ticket_not_found' });
    const messages = await pool.query(
      'SELECT id,sender_role,message,created_at FROM support_ticket_messages WHERE ticket_id=$1 ORDER BY created_at',
      [id],
    );
    return { ticket, messages: messages.rows };
  });

  app.post('/internal/v1/admin/support/tickets/:id/reply', { preHandler: requireAuth }, async (req, reply) => {
    if (!(await adminOnly(pool, req, reply, 'support.write'))) return;
    const id = Number((req.params as { id: string }).id);
    const body = (req.body ?? {}) as { message?: unknown };
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!Number.isSafeInteger(id) || id <= 0 || !message || message.length > 10000) {
      return reply.code(400).send({ error: 'invalid_message' });
    }

    const sender = await ensurePlatformUser(pool, auth(req));
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const ticket = (await client.query(
        "SELECT id FROM support_tickets WHERE id=$1 AND status<>'closed' FOR UPDATE",
        [id],
      )).rows[0];
      if (!ticket) {
        await client.query('ROLLBACK');
        return reply.code(404).send({ error: 'ticket_not_found' });
      }
      const role = auth(req).role === 'operator' ? 'operator' : 'admin';
      await client.query(
        'INSERT INTO support_ticket_messages(ticket_id,sender_user_id,sender_role,message) VALUES($1,$2,$3,$4)',
        [id, sender, role, message],
      );
      await client.query("UPDATE support_tickets SET status='answered',updated_at=NOW() WHERE id=$1", [id]);
      await client.query('COMMIT');
      return { ok: true };
    } catch (error) {
      await client.query('ROLLBACK');
      req.log.error(error);
      return reply.code(500).send({ error: 'support_reply_failed' });
    } finally {
      client.release();
    }
  });

  app.post('/internal/v1/admin/support/tickets/:id/close', { preHandler: requireAuth }, async (req, reply) => {
    if (!(await adminOnly(pool, req, reply, 'support.write'))) return;
    const id = Number((req.params as { id: string }).id);
    if (!Number.isSafeInteger(id) || id <= 0) return reply.code(400).send({ error: 'invalid_ticket_id' });

    const sender = await ensurePlatformUser(pool, auth(req));
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const ticket = (await client.query(
        'SELECT id,status FROM support_tickets WHERE id=$1 FOR UPDATE',
        [id],
      )).rows[0];
      if (!ticket) {
        await client.query('ROLLBACK');
        return reply.code(404).send({ error: 'ticket_not_found' });
      }
      if (ticket.status !== 'closed') {
        const role = auth(req).role === 'operator' ? 'operator' : 'admin';
        await client.query(
          'INSERT INTO support_ticket_messages(ticket_id,sender_user_id,sender_role,message) VALUES($1,$2,$3,$4)',
          [id, sender, role, 'تیکت توسط پشتیبانی بسته شد.'],
        );
        await client.query(
          "UPDATE support_tickets SET status='closed',closed_at=NOW(),updated_at=NOW() WHERE id=$1",
          [id],
        );
      }
      await client.query('COMMIT');
      return { ok: true, status: 'closed' };
    } catch (error) {
      await client.query('ROLLBACK');
      req.log.error(error);
      return reply.code(500).send({ error: 'support_close_failed' });
    } finally {
      client.release();
    }
  });
}
