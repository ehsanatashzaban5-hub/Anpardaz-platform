import { createHash } from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';
import { requireAuth, verifyIdentityToken, type AuthClaims } from '../auth.js';

type AuthRequest = FastifyRequest & { auth: AuthClaims };
const TARGETS = ['news','banner','market_product','forum_thread','forum_post','content'] as const;
const LIKE_TARGETS = [...TARGETS,'comment'] as const;
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const guestHash = (token: string) => hash(`${process.env.GUEST_INTERACTION_SECRET ?? 'CHANGE_ME_GUEST_INTERACTION_SECRET'}:${token}`);
const guestToken = (req: FastifyRequest) => {
  const value = req.headers['x-guest-token'];
  return typeof value === 'string' && value.length >= 16 && value.length <= 256 ? value : null;
};
const optionalAuth = async (pool: Pool, req: FastifyRequest) => {
  const value = req.headers.authorization;
  if (!value?.startsWith('Bearer ')) return null;
  const auth = verifyIdentityToken(value.slice(7));
  if (!auth) return null;
  const active = await pool.query(`SELECT 1 FROM platform_users WHERE identity_id=$1 AND status='active' LIMIT 1`, [auth.sub]);
  return active.rows[0] ? auth : null;
};
const requestIpHash = (req: FastifyRequest) => hash(`${process.env.GUEST_INTERACTION_SECRET ?? 'CHANGE_ME_GUEST_INTERACTION_SECRET'}:${req.ip}`);

async function permitted(pool: Pool, identityId: string, permission: string) {
  const r = await pool.query<{ ok: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM admin_permissions ap JOIN platform_users u ON u.role=ap.role
      WHERE u.identity_id=$1 AND (ap.permission='*' OR ap.permission=$2)) ok`,
    [identityId, permission]
  );
  return r.rows[0]?.ok === true;
}
async function audit(pool: Pool, req: FastifyRequest, identityId: string, action: string, resourceType: string, resourceId: string | null, reason?: string) {
  await pool.query(
    `INSERT INTO audit_logs(identity_id,actor_type,actor_identity_id,action,resource_type,resource_id,request_id,reason,ip_address,metadata)
     VALUES($1,'admin',$1,$2,$3,$4,$5,$6,$7,$8)`,
    [identityId, action, resourceType, resourceId, req.id, reason ?? null, req.ip, {}]
  );
}
async function requirePermission(pool: Pool, req: FastifyRequest, reply: any, permission: string) {
  const auth = (req as AuthRequest).auth;
  if (!auth || !(await permitted(pool, auth.sub, permission))) {
    await reply.code(403).send({ error: 'forbidden' });
    return null;
  }
  return auth;
}
async function consumeRate(pool: Pool, key: string, action: string, maxHits: number) {
  const bucket = new Date(Math.floor(Date.now() / 60000) * 60000);
  const r = await pool.query<{ hits: number }>(
    `INSERT INTO community_rate_buckets(bucket_start,bucket_key,action,hits) VALUES($1,$2,$3,1)
     ON CONFLICT(bucket_start,bucket_key,action) DO UPDATE SET hits=community_rate_buckets.hits+1
     RETURNING hits`, [bucket, key, action]
  );
  return (r.rows[0]?.hits ?? maxHits + 1) <= maxHits;
}

export function registerModerationRoutes(app: FastifyInstance, pool: Pool) {
  app.post('/api/v1/community/comments', async (req, reply) => {
    const b = (req.body ?? {}) as { targetType?: string; targetId?: string; body?: string; parentId?: number };
    if (!TARGETS.includes(b.targetType as any) || !b.targetId || !b.body?.trim() || b.body.trim().length > 10000) return reply.code(400).send({ error: 'invalid_comment' });
    const auth = await optionalAuth(pool,req);
    const guest = guestToken(req);
    if (!auth && !guest) return reply.code(401).send({ error: 'guest_token_required' });
    const actorKey = auth ? `u:${auth.sub}` : `g:${guestHash(guest!)}`;
    if (!(await consumeRate(pool, actorKey, 'comment', auth ? 30 : 5))) return reply.code(429).send({ error: 'rate_limited' });
    const gh = auth ? null : guestHash(guest!);
    if (gh) {
      const blocked = await pool.query(`SELECT 1 FROM guest_interaction_blocks WHERE guest_token_hash=$1 AND (expires_at IS NULL OR expires_at>NOW())`, [gh]);
      if (blocked.rows[0]) return reply.code(403).send({ error: 'guest_blocked' });
    }
    const c = await pool.query(
      `INSERT INTO community_comments(identity_id,guest_token_hash,target_type,target_id,parent_id,body,ip_hash,user_agent_hash)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,target_type,target_id,parent_id,body,status,created_at`,
      [auth?.sub ?? null, gh, b.targetType, b.targetId, b.parentId ?? null, b.body.trim(), requestIpHash(req), hash(req.headers['user-agent'] ?? '')]
    );
    return reply.code(201).send({ comment: c.rows[0] });
  });

  app.get('/api/v1/community/comments', async (req, reply) => {
    const q = req.query as { targetType?: string; targetId?: string; limit?: string; cursor?: string };
    if (!TARGETS.includes(q.targetType as any) || !q.targetId) return reply.code(400).send({ error: 'invalid_target' });
    const parsed = Number(q.limit ?? 50); const limit = Math.min(Math.max(Number.isFinite(parsed) ? parsed : 50, 1), 100);
    const rows = await pool.query(
      `SELECT id,target_type,target_id,parent_id,body,status,created_at,
              CASE WHEN identity_id IS NULL THEN 'guest' ELSE 'member' END author_type
         FROM community_comments WHERE target_type=$1 AND target_id=$2 AND status='visible'
           AND ($3::bigint IS NULL OR id<$3) ORDER BY id DESC LIMIT $4`,
      [q.targetType, q.targetId, q.cursor ?? null, limit]
    );
    return { comments: rows.rows, nextCursor: rows.rows.length === limit ? String(rows.rows.at(-1).id) : null };
  });

  app.post('/api/v1/community/likes', async (req, reply) => {
    const b = (req.body ?? {}) as { targetType?: string; targetId?: string };
    if (!LIKE_TARGETS.includes(b.targetType as any) || !b.targetId) return reply.code(400).send({ error: 'invalid_target' });
    const auth = await optionalAuth(pool, req); const guest = guestToken(req);
    if (!auth && !guest) return reply.code(401).send({ error: 'guest_token_required' });
    const gh = auth ? null : guestHash(guest!); const actorKey = auth ? `u:${auth.sub}` : `g:${gh}`;
    if (!(await consumeRate(pool, actorKey, 'like', auth ? 120 : 30))) return reply.code(429).send({ error: 'rate_limited' });
    if (gh) {
      const blocked = await pool.query(`SELECT 1 FROM guest_interaction_blocks WHERE guest_token_hash=$1 AND (expires_at IS NULL OR expires_at>NOW())`, [gh]);
      if (blocked.rows[0]) return reply.code(403).send({ error: 'guest_blocked' });
    }
    const existing = await pool.query<{ id: string }>(
      `SELECT id FROM community_likes WHERE status='active' AND ((identity_id=$1 AND $1 IS NOT NULL) OR (guest_token_hash=$2 AND $2 IS NOT NULL)) AND target_type=$3 AND target_id=$4 LIMIT 1`,
      [auth?.sub ?? null, gh, b.targetType, b.targetId]
    );
    if (existing.rows[0]) {
      await pool.query(`UPDATE community_likes SET status='removed' WHERE id=$1`, [existing.rows[0].id]);
      return { liked: false };
    }
    try {
      const l = await pool.query(`INSERT INTO community_likes(identity_id,guest_token_hash,target_type,target_id) VALUES($1,$2,$3,$4) RETURNING id`, [auth?.sub ?? null, gh, b.targetType, b.targetId]);
      return reply.code(201).send({ liked: true, id: l.rows[0].id });
    } catch (e: any) {
      if (e?.code === '23505') return { liked: true };
      throw e;
    }
  });

  app.get('/api/v1/community/likes', async (req, reply) => {
    const q = req.query as { targetType?: string; targetId?: string };
    if (!LIKE_TARGETS.includes(q.targetType as any) || !q.targetId) return reply.code(400).send({ error: 'invalid_target' });
    const r = await pool.query(`SELECT count(*)::int AS count FROM community_likes WHERE status='active' AND target_type=$1 AND target_id=$2`, [q.targetType, q.targetId]);
    return { count: r.rows[0].count };
  });

  app.post('/api/v1/community/reports', async (req, reply) => {
    const b = (req.body ?? {}) as { targetType?: string; targetId?: string; reason?: string; details?: string };
    if (!['comment','like',...TARGETS].includes(b.targetType ?? '') || !b.targetId || !b.reason?.trim()) return reply.code(400).send({ error: 'invalid_report' });
    const auth = await optionalAuth(pool, req); const guest = guestToken(req);
    if (!auth && !guest) return reply.code(401).send({ error: 'guest_token_required' });
    const gh = auth ? null : guestHash(guest!);
    if (gh) {
      const blocked = await pool.query(`SELECT 1 FROM guest_interaction_blocks WHERE guest_token_hash=$1 AND (expires_at IS NULL OR expires_at>NOW())`, [gh]);
      if (blocked.rows[0]) return reply.code(403).send({ error: 'guest_blocked' });
    }
    if (!(await consumeRate(pool, auth ? `u:${auth.sub}` : `g:${gh}`, 'report', 10))) return reply.code(429).send({ error: 'rate_limited' });
    const r = await pool.query(`INSERT INTO community_reports(reporter_identity_id,reporter_guest_token_hash,target_type,target_id,reason,details) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,status,created_at`, [auth?.sub ?? null, gh, b.targetType, b.targetId, b.reason.trim().slice(0,500), b.details?.trim().slice(0,5000) ?? null]);
    return reply.code(201).send({ report: r.rows[0] });
  });

  app.get('/internal/v1/admin/moderation/comments', { preHandler: requireAuth }, async (req, reply) => {
    const auth = await requirePermission(pool, req, reply, 'content.moderate'); if (!auth) return;
    const q = req.query as { status?: string; targetType?: string; targetId?: string; limit?: string };
    const parsed = Number(q.limit ?? 100); const limit = Math.min(Math.max(Number.isFinite(parsed) ? parsed : 100, 1), 200);
    const rows = await pool.query(`SELECT c.*,u.email FROM community_comments c LEFT JOIN platform_users u ON u.identity_id=c.identity_id WHERE ($1::text IS NULL OR c.status=$1) AND ($2::text IS NULL OR c.target_type=$2) AND ($3::text IS NULL OR c.target_id=$3) ORDER BY c.created_at DESC LIMIT $4`, [q.status ?? null, q.targetType ?? null, q.targetId ?? null, limit]);
    return { comments: rows.rows };
  });

  app.patch('/internal/v1/admin/moderation/comments/:id', { preHandler: requireAuth }, async (req, reply) => {
    const auth = await requirePermission(pool, req, reply, 'content.moderate'); if (!auth) return;
    const id = (req.params as { id: string }).id; const b = (req.body ?? {}) as { status?: string; reason?: string };
    if (!['visible','hidden','deleted','pending','blocked'].includes(b.status ?? '')) return reply.code(400).send({ error: 'invalid_status' });
    const c = await pool.query(`UPDATE community_comments SET status=$1,moderation_reason=$2,updated_at=NOW() WHERE id=$3 RETURNING *`, [b.status, b.reason?.trim() ?? null, id]);
    if (!c.rows[0]) return reply.code(404).send({ error: 'comment_not_found' });
    const action = b.status === 'deleted' ? 'delete' : b.status === 'hidden' ? 'hide' : b.status === 'visible' ? 'restore' : 'block';
    await pool.query(`INSERT INTO moderation_actions(moderator_identity_id,target_type,target_id,action,reason) VALUES($1,'comment',$2,$3,$4)`, [auth.sub, id, action, b.reason?.trim() ?? null]);
    await audit(pool, req, auth.sub, 'moderate', 'comment', id, b.reason);
    return { comment: c.rows[0] };
  });

  app.get('/internal/v1/admin/moderation/likes', { preHandler: requireAuth }, async (req, reply) => {
    const auth = await requirePermission(pool, req, reply, 'content.moderate'); if (!auth) return;
    const q = req.query as { targetType?: string; targetId?: string; limit?: string }; const parsed = Number(q.limit ?? 100); const limit = Math.min(Math.max(Number.isFinite(parsed) ? parsed : 100, 1), 200);
    const rows = await pool.query(`SELECT l.*,u.email FROM community_likes l LEFT JOIN platform_users u ON u.identity_id=l.identity_id WHERE ($1::text IS NULL OR l.target_type=$1) AND ($2::text IS NULL OR l.target_id=$2) ORDER BY l.created_at DESC LIMIT $3`, [q.targetType ?? null, q.targetId ?? null, limit]);
    return { likes: rows.rows };
  });

  app.delete('/internal/v1/admin/moderation/likes/:id', { preHandler: requireAuth }, async (req, reply) => {
    const auth = await requirePermission(pool, req, reply, 'content.moderate'); if (!auth) return;
    const id = (req.params as { id: string }).id; const l = await pool.query(`UPDATE community_likes SET status='removed' WHERE id=$1 RETURNING *`, [id]);
    if (!l.rows[0]) return reply.code(404).send({ error: 'like_not_found' });
    await pool.query(`INSERT INTO moderation_actions(moderator_identity_id,target_type,target_id,action) VALUES($1,'like',$2,'remove_like')`, [auth.sub, id]);
    await audit(pool, req, auth.sub, 'remove', 'like', id);
    return { like: l.rows[0] };
  });

  app.get('/internal/v1/admin/moderation/reports', { preHandler: requireAuth }, async (req, reply) => {
    const auth = await requirePermission(pool, req, reply, 'content.moderate'); if (!auth) return;
    const q = req.query as { status?: string; limit?: string }; const parsed = Number(q.limit ?? 100); const limit = Math.min(Math.max(Number.isFinite(parsed) ? parsed : 100, 1), 200);
    const rows = await pool.query(`SELECT * FROM community_reports WHERE ($1::text IS NULL OR status=$1) ORDER BY created_at DESC LIMIT $2`, [q.status ?? null, limit]);
    return { reports: rows.rows };
  });

  app.patch('/internal/v1/admin/moderation/reports/:id', { preHandler: requireAuth }, async (req, reply) => {
    const auth = await requirePermission(pool, req, reply, 'content.moderate'); if (!auth) return;
    const id = (req.params as { id: string }).id; const b = (req.body ?? {}) as { status?: string; resolution?: string };
    if (!['open','reviewing','resolved','rejected'].includes(b.status ?? '')) return reply.code(400).send({ error: 'invalid_status' });
    const r = await pool.query(`UPDATE community_reports SET status=$1,resolution=$2,resolved_by=CASE WHEN $1 IN ('resolved','rejected') THEN $3 ELSE NULL END,resolved_at=CASE WHEN $1 IN ('resolved','rejected') THEN NOW() ELSE NULL END WHERE id=$4 RETURNING *`, [b.status, b.resolution?.trim() ?? null, auth.sub, id]);
    if (!r.rows[0]) return reply.code(404).send({ error: 'report_not_found' });
    await audit(pool, req, auth.sub, 'moderate', 'report', id, b.resolution);
    return { report: r.rows[0] };
  });

  app.post('/internal/v1/admin/moderation/guest-blocks', { preHandler: requireAuth }, async (req, reply) => {
    const auth = await requirePermission(pool, req, reply, 'content.moderate'); if (!auth) return;
    const b = (req.body ?? {}) as { guestToken?: string; reason?: string; expiresAt?: string | null };
    if (!b.guestToken || b.guestToken.length < 16) return reply.code(400).send({ error: 'invalid_guest_token' });
    const gh = guestHash(b.guestToken);
    const r = await pool.query(`INSERT INTO guest_interaction_blocks(guest_token_hash,reason,expires_at,created_by) VALUES($1,$2,$3,$4) ON CONFLICT(guest_token_hash) DO UPDATE SET reason=EXCLUDED.reason,expires_at=EXCLUDED.expires_at,created_by=EXCLUDED.created_by RETURNING id,expires_at,created_at`, [gh, b.reason?.trim() ?? null, b.expiresAt ?? null, auth.sub]);
    await audit(pool, req, auth.sub, 'block', 'guest', r.rows[0].id.toString(), b.reason);
    return reply.code(201).send({ block: r.rows[0] });
  });

  app.delete('/internal/v1/admin/moderation/guest-blocks/:id', { preHandler: requireAuth }, async (req, reply) => {
    const auth = await requirePermission(pool, req, reply, 'content.moderate'); if (!auth) return;
    const id = (req.params as { id: string }).id; const r = await pool.query(`DELETE FROM guest_interaction_blocks WHERE id=$1 RETURNING id`, [id]);
    if (!r.rows[0]) return reply.code(404).send({ error: 'guest_block_not_found' });
    await audit(pool, req, auth.sub, 'unblock', 'guest', id);
    return { deleted: true };
  });
}
