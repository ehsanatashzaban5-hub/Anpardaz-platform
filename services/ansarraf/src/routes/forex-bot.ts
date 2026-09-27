import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { ensureCustomer, requireAuth } from '../auth.js';

type AuthRequest = FastifyRequest & { auth: { sub: string; role: string } };
const auth = (r: FastifyRequest) => r as AuthRequest;
const REVIEW_ROLES = ['admin','super_admin'];
const VIEW_ROLES = ['admin','super_admin','operator'];
const amount = (v: unknown) => typeof v === 'string' && /^(?:0|[1-9]\d{0,27})(?:\.\d{1,18})?$/.test(v) && Number(v) > 0;
const MAX_INVESTMENT = '30';
const executionAvailable=()=>process.env.FOREX_BOT_EXECUTION_ENABLED==='true'&&!!process.env.FOREX_BOT_EXECUTION_URL&&!!process.env.FOREX_BOT_EXECUTION_TOKEN;

const FOREX_EXECUTION_AVAILABLE = process.env.FOREX_EXECUTION_ENABLED === 'true' && Boolean(process.env.FOREX_BROKER_PROVIDER_URL);


async function botSnapshot(pool: Pool, customerId: string) {
  const account = await pool.query(
    `SELECT id,customer_id,status,investment_amount::text,total_pnl::text,activated_at,deactivated_at,version,created_at,updated_at
     FROM forex_bot_accounts WHERE customer_id=$1 LIMIT 1`, [customerId],
  );
  if (!account.rows[0]) return { account: null, pendingRequest: null, pnlEvents: [], executionAvailable: executionAvailable() };
  const a = account.rows[0];
  const [pending, events] = await Promise.all([
    pool.query(
      `SELECT id,action,requested_amount::text,status,idempotency_key,user_note,admin_identity_id,admin_reason,operation_id,created_at,decided_at
       FROM forex_bot_requests WHERE account_id=$1 AND status='pending' ORDER BY created_at DESC LIMIT 1`, [a.id],
    ),
    pool.query(
      `SELECT id,amount::text,source_reference,reason,admin_identity_id,operation_id,created_at
       FROM forex_bot_pnl_events WHERE account_id=$1 ORDER BY created_at DESC LIMIT 100`, [a.id],
    ),
  ]);
  return { account: a, pendingRequest: pending.rows[0] ?? null, pnlEvents: events.rows, executionAvailable: executionAvailable() };
}

async function ensureBotAccount(pool: Pool, customerId: string) {
  const r = await pool.query(
    `INSERT INTO forex_bot_accounts(customer_id) VALUES($1)
     ON CONFLICT(customer_id) DO UPDATE SET updated_at=NOW()
     RETURNING id,customer_id,status,investment_amount::text,total_pnl::text,activated_at,deactivated_at,version,created_at,updated_at`,
    [customerId],
  );
  return r.rows[0];
}

async function addOutbox(client: any, eventType: string, aggregateId: string, payload: Record<string, unknown>, idempotencyKey: string) {
  await client.query(
    `INSERT INTO accounting_outbox(event_type,aggregate_type,aggregate_id,idempotency_key,payload)
     VALUES($1,'forex_bot',$2,$3,$4)`,
    [eventType, aggregateId, idempotencyKey, payload],
  );
}

export function registerForexBotRoutes(app: FastifyInstance, pool: Pool) {
  app.get('/api/v1/forex-bot', { preHandler: requireAuth }, async (request, reply) => {
    const customerId = await ensureCustomer(pool, auth(request).auth as any);
    const snapshot = await botSnapshot(pool, customerId);
    const wallet = await pool.query(
      `SELECT w.available_balance::text AS available_balance,w.locked_balance::text AS locked_balance,a.symbol
       FROM wallets w JOIN assets a ON a.id=w.asset_id
       WHERE w.customer_id=$1 AND a.symbol='USDT' LIMIT 1`, [customerId],
    );
    return { ...snapshot, executionAvailable: FOREX_EXECUTION_AVAILABLE, wallet: wallet.rows[0] ?? { available_balance: '0', locked_balance: '0', symbol: 'USDT' }, maxInvestment: MAX_INVESTMENT };
  });

  app.post('/api/v1/forex-bot/requests', { preHandler: requireAuth }, async (request, reply) => {
    const customerId = await ensureCustomer(pool, auth(request).auth as any);
    const body = (request.body ?? {}) as { action?: string; amount?: string; idempotencyKey?: string; note?: string };
    if (!['activate','deactivate'].includes(body.action ?? '')) return reply.code(400).send({ error: 'invalid_action' });
    if (typeof body.idempotencyKey !== 'string' || body.idempotencyKey.length < 8 || body.idempotencyKey.length > 200) return reply.code(400).send({ error: 'invalid_idempotency_key' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const existing = await client.query(
        'SELECT * FROM forex_bot_requests WHERE idempotency_key=$1 FOR UPDATE', [body.idempotencyKey],
      );
      if (existing.rows[0]) {
        await client.query('ROLLBACK');
        const snapshot = await botSnapshot(pool, customerId);
        return { request: existing.rows[0], ...snapshot, idempotent: true };
      }

      const account = await client.query(
        `INSERT INTO forex_bot_accounts(customer_id) VALUES($1)
         ON CONFLICT(customer_id) DO UPDATE SET updated_at=NOW()
         RETURNING *`, [customerId],
      );
      const a = account.rows[0];

      const pending = await client.query(
        `SELECT id FROM forex_bot_requests WHERE account_id=$1 AND status='pending' FOR UPDATE`, [a.id],
      );
      if (pending.rows[0]) throw new Error('forex_bot_request_already_pending');

      const operationId = 'ANSARRAF-FB-' + randomUUID();

      if (body.action === 'activate') {
        if (!FOREX_EXECUTION_AVAILABLE) throw new Error('forex_execution_not_configured');
        if (!amount(body.amount) || Number(body.amount) > Number(MAX_INVESTMENT)) throw new Error('forex_bot_max_investment_30_usd');
        if (!executionAvailable()) throw new Error('forex_bot_execution_not_configured');
        if (a.status !== 'inactive') throw new Error('forex_bot_activation_not_allowed');
        if (a.deactivated_at) {
          const cooldown = await client.query("SELECT (NOW() >= $1::timestamptz + INTERVAL '24 hours') AS allowed",[a.deactivated_at]);
          if (!cooldown.rows[0].allowed) throw new Error('forex_bot_cooldown_24h');
        }
        const requested = String(body.amount);
        const usdt = await client.query(`SELECT id FROM assets WHERE symbol='USDT' AND status='active' LIMIT 1`);
        if (!usdt.rows[0]) throw new Error('usdt_asset_not_available');
        const wallet = await client.query(
          `SELECT * FROM wallets WHERE customer_id=$1 AND asset_id=$2 FOR UPDATE`, [customerId, usdt.rows[0].id],
        );
        if (!wallet.rows[0]) throw new Error('usdt_wallet_not_found');
        const sufficient = await client.query('SELECT ($1::numeric >= $2::numeric) AS ok', [wallet.rows[0].available_balance, requested]);
        if (!sufficient.rows[0].ok) throw new Error('insufficient_usdt_balance');

        await client.query(
          `UPDATE wallets SET available_balance=available_balance-$1::numeric,locked_balance=locked_balance+$1::numeric WHERE id=$2`,
          [requested, wallet.rows[0].id],
        );
        await client.query(
          `UPDATE forex_bot_accounts SET status='activation_pending',investment_amount=$1,total_pnl=0,version=version+1,updated_at=NOW() WHERE id=$2`,
          [requested, a.id],
        );
        const req = await client.query(
          `INSERT INTO forex_bot_requests(account_id,action,requested_amount,idempotency_key,user_note,operation_id)
           VALUES($1,'activate',$2,$3,$4,$5) RETURNING *`,
          [a.id, requested, body.idempotencyKey, typeof body.note === 'string' ? body.note.trim().slice(0,1000) : null, operationId],
        );
        await client.query(
          `INSERT INTO forex_bot_audit_events(account_id,request_id,event_type,actor_type,actor_identity_id,payload)
           VALUES($1,$2,'activation_requested','user',$3,$4)`,
          [a.id, req.rows[0].id, auth(request).auth.sub, { amount: requested }],
        );
        await addOutbox(client, 'forex_bot.funding_transfer', String(req.rows[0].id), {
          operationId, customerId:Number(customerId), amount:requested, direction:'customer_to_bot',
          requestId:req.rows[0].id,
        }, 'ansarraf:forexbot:request:' + req.rows[0].id + ':fund');
        await client.query('COMMIT');
        return reply.code(201).send({ request:req.rows[0], message:'درخواست فعال‌سازی برای تأیید مدیریت ثبت شد.' });
      }

      if (a.status !== 'active') throw new Error('forex_bot_deactivation_not_allowed');
      if (a.activated_at) {
        const cooldown = await client.query("SELECT (NOW() >= $1::timestamptz + INTERVAL '24 hours') AS allowed",[a.activated_at]);
        if (!cooldown.rows[0].allowed) throw new Error('forex_bot_cooldown_24h');
      }
      const req = await client.query(
        `INSERT INTO forex_bot_requests(account_id,action,idempotency_key,user_note,operation_id)
         VALUES($1,'deactivate',$2,$3,$4) RETURNING *`,
        [a.id, body.idempotencyKey, typeof body.note === 'string' ? body.note.trim().slice(0,1000) : null, operationId],
      );
      await client.query(
        `UPDATE forex_bot_accounts SET status='deactivation_pending',version=version+1,updated_at=NOW() WHERE id=$1`, [a.id],
      );
      await client.query(
        `INSERT INTO forex_bot_audit_events(account_id,request_id,event_type,actor_type,actor_identity_id,payload)
         VALUES($1,$2,'deactivation_requested','user',$3,'{}')`,
        [a.id, req.rows[0].id, auth(request).auth.sub],
      );
      await client.query('COMMIT');
      return reply.code(201).send({ request:req.rows[0], message:'درخواست غیرفعال‌سازی برای تأیید مدیریت ثبت شد.' });
    } catch (e) {
      await client.query('ROLLBACK');
      return reply.code(400).send({ error: e instanceof Error ? e.message : 'forex_bot_request_failed' });
    } finally { client.release(); }
  });

  app.get('/api/v1/admin/forex-bot/requests', { preHandler: requireAuth }, async (request, reply) => {
    const a = auth(request).auth;
    if (!VIEW_ROLES.includes(a.role)) return reply.code(403).send({ error:'forbidden' });
    const q = request.query as { status?: string };
    const status = q.status?.trim();
    const rows = await pool.query(
      `SELECT r.*,c.identity_id,a.status AS bot_status,a.investment_amount::text,a.total_pnl::text,c.email
       FROM forex_bot_requests r
       JOIN forex_bot_accounts a ON a.id=r.account_id
       JOIN customers c ON c.id=a.customer_id
       WHERE ($1::text IS NULL OR r.status=$1)
       ORDER BY r.created_at DESC LIMIT 500`, [status || null],
    );
    return { requests: rows.rows };
  });

  app.post('/api/v1/admin/forex-bot/requests/:id/decision', { preHandler: requireAuth }, async (request, reply) => {
    const a = auth(request).auth;
    if (!REVIEW_ROLES.includes(a.role)) return reply.code(403).send({ error:'forbidden' });
    const id = Number((request.params as any).id);
    const body = (request.body ?? {}) as { approve?: boolean; reason?: string };
    if (!Number.isSafeInteger(id) || typeof body.approve !== 'boolean') return reply.code(400).send({ error:'invalid_decision' });
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0,2000) : '';
    if (!reason) return reply.code(400).send({ error:'decision_reason_required' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const rq = await client.query(
        `SELECT r.*,a.*,c.identity_id FROM forex_bot_requests r
         JOIN forex_bot_accounts a ON a.id=r.account_id
         JOIN customers c ON c.id=a.customer_id
         WHERE r.id=$1 FOR UPDATE`, [id],
      );
      const row = rq.rows[0];
      if (!row) throw new Error('forex_bot_request_not_found');
      if (row.status !== 'pending') return reply.code(409).send({ error:'forex_bot_request_already_decided' });
      if (row.identity_id === a.sub) throw new Error('self_approval_forbidden');

      const usdt = await client.query(`SELECT id FROM assets WHERE symbol='USDT' AND status='active' LIMIT 1`);
      if (!usdt.rows[0]) throw new Error('usdt_asset_not_available');

      if (row.action === 'activate') {
        if (body.approve) {
          if (!FOREX_EXECUTION_AVAILABLE) throw new Error('forex_execution_not_configured');
          await client.query(
            `UPDATE forex_bot_accounts SET status='active',activated_at=NOW(),deactivated_at=NULL,updated_at=NOW(),version=version+1 WHERE id=$1`,
            [row.account_id],
          );
          await client.query(
            `UPDATE forex_bot_requests SET status='approved',admin_identity_id=$2,admin_reason=$3,decided_at=NOW() WHERE id=$1`,
            [id,a.sub,reason],
          );
          await client.query(
            `INSERT INTO forex_bot_audit_events(account_id,request_id,event_type,actor_type,actor_identity_id,payload)
             VALUES($1,$2,'activation_approved','admin',$3,$4)`,
            [row.account_id,id,a.sub,{reason}],
          );
        } else {
          const wallet = await client.query(
            `SELECT * FROM wallets WHERE customer_id=$1 AND asset_id=$2 FOR UPDATE`, [row.customer_id, usdt.rows[0].id],
          );
          if (!wallet.rows[0]) throw new Error('usdt_wallet_not_found');
          const unlock = String(row.requested_amount);
          const ok = await client.query('SELECT (locked_balance >= $1::numeric) AS ok FROM wallets WHERE id=$2',[unlock,wallet.rows[0].id]);
          if (!ok.rows[0].ok) throw new Error('forex_bot_locked_balance_invariant_failed');
          await client.query(
            `UPDATE wallets SET locked_balance=locked_balance-$1::numeric,available_balance=available_balance+$1::numeric WHERE id=$2`,
            [unlock,wallet.rows[0].id],
          );
          await client.query(`UPDATE forex_bot_accounts SET status='inactive',investment_amount=0,total_pnl=0,updated_at=NOW(),version=version+1 WHERE id=$1`,[row.account_id]);
          await client.query(`UPDATE forex_bot_requests SET status='rejected',admin_identity_id=$2,admin_reason=$3,decided_at=NOW() WHERE id=$1`,[id,a.sub,reason]);
          await addOutbox(client,'forex_bot.funding_transfer',String(id),{operationId:row.operation_id,customerId:Number(row.customer_id),amount:unlock,direction:'bot_to_customer',requestId:id},'ansarraf:forexbot:request:'+id+':release');
          await client.query(`INSERT INTO forex_bot_audit_events(account_id,request_id,event_type,actor_type,actor_identity_id,payload) VALUES($1,$2,'activation_rejected','admin',$3,$4)`,[row.account_id,id,a.sub,{reason}]);
        }
      } else {
        if (body.approve) {
          const wallet = await client.query(`SELECT * FROM wallets WHERE customer_id=$1 AND asset_id=$2 FOR UPDATE`,[row.customer_id,usdt.rows[0].id]);
          if (!wallet.rows[0]) throw new Error('usdt_wallet_not_found');
          const release = await client.query('SELECT (investment_amount+total_pnl)::text AS amount,(investment_amount+total_pnl >= 0) AS ok FROM forex_bot_accounts WHERE id=$1 FOR UPDATE',[row.account_id]);
          if (!release.rows[0].ok || Number(release.rows[0].amount)<=0) throw new Error('forex_bot_release_amount_invalid');
          const amountToRelease=release.rows[0].amount;
          const lockedOk=await client.query('SELECT (locked_balance >= $1::numeric) AS ok FROM wallets WHERE id=$2',[amountToRelease,wallet.rows[0].id]);
          if(!lockedOk.rows[0].ok)throw new Error('forex_bot_locked_balance_invariant_failed');
          await client.query(`UPDATE wallets SET locked_balance=locked_balance-$1::numeric,available_balance=available_balance+$1::numeric WHERE id=$2`,[amountToRelease,wallet.rows[0].id]);
          await client.query(`UPDATE forex_bot_accounts SET status='inactive',investment_amount=0,total_pnl=0,deactivated_at=NOW(),updated_at=NOW(),version=version+1 WHERE id=$1`,[row.account_id]);
          await client.query(`UPDATE forex_bot_requests SET status='approved',admin_identity_id=$2,admin_reason=$3,decided_at=NOW() WHERE id=$1`,[id,a.sub,reason]);
          await addOutbox(client,'forex_bot.funding_transfer',String(id),{operationId:row.operation_id,customerId:Number(row.customer_id),amount:amountToRelease,direction:'bot_to_customer',requestId:id},'ansarraf:forexbot:request:'+id+':release');
          await client.query(`INSERT INTO forex_bot_audit_events(account_id,request_id,event_type,actor_type,actor_identity_id,payload) VALUES($1,$2,'deactivation_approved','admin',$3,$4)`,[row.account_id,id,a.sub,{reason,amountReleased:amountToRelease}]);
        } else {
          await client.query(`UPDATE forex_bot_accounts SET status='active',updated_at=NOW(),version=version+1 WHERE id=$1`,[row.account_id]);
          await client.query(`UPDATE forex_bot_requests SET status='rejected',admin_identity_id=$2,admin_reason=$3,decided_at=NOW() WHERE id=$1`,[id,a.sub,reason]);
          await client.query(`INSERT INTO forex_bot_audit_events(account_id,request_id,event_type,actor_type,actor_identity_id,payload) VALUES($1,$2,'deactivation_rejected','admin',$3,$4)`,[row.account_id,id,a.sub,{reason}]);
        }
      }
      await client.query('COMMIT');
      return { ok:true, status: body.approve?'approved':'rejected' };
    } catch(e) {
      await client.query('ROLLBACK');
      return reply.code(400).send({error:e instanceof Error?e.message:'forex_bot_decision_failed'});
    } finally { client.release(); }
  });

  app.post('/api/v1/admin/forex-bot/accounts/:id/pnl', { preHandler: requireAuth }, async (request, reply) => {
    const a = auth(request).auth;
    if (!REVIEW_ROLES.includes(a.role)) return reply.code(403).send({ error:'forbidden' });
    const accountId = Number((request.params as any).id);
    const body = (request.body ?? {}) as { amount?: string; sourceReference?: string; reason?: string; idempotencyKey?: string };
    if (!Number.isSafeInteger(accountId) || typeof body.amount !== 'string' || !body.sourceReference?.trim() || !body.reason?.trim() || !body.idempotencyKey) return reply.code(400).send({error:'invalid_pnl'});
    const raw = String(body.amount).trim();
    if (!/^-?(?:0|[1-9]\d{0,27})(?:\.\d{1,18})?$/.test(raw) || Number(raw)===0) return reply.code(400).send({error:'invalid_pnl_amount'});
    const client=await pool.connect();
    try{
      await client.query('BEGIN');
      const existing=await client.query('SELECT * FROM forex_bot_pnl_events WHERE idempotency_key=$1 FOR UPDATE',[body.idempotencyKey]);
      if(existing.rows[0]){await client.query('ROLLBACK');return{event:existing.rows[0],idempotent:true};}
      const q=await client.query(`SELECT * FROM forex_bot_accounts WHERE id=$1 FOR UPDATE`,[accountId]);
      if(!q.rows[0]||q.rows[0].status!=='active')throw new Error('forex_bot_not_active');
      const row=q.rows[0];
      const next=await client.query('SELECT ($1::numeric+$2::numeric)::text AS pnl,($3::numeric+$1::numeric+$2::numeric)::text AS total,($3::numeric+$1::numeric+$2::numeric>=0) AS ok',[row.total_pnl,raw,row.investment_amount]);
      if(!next.rows[0].ok)throw new Error('forex_bot_pnl_exceeds_investment_loss');
      const customerId=Number(row.customer_id);
      const usdt=await client.query(`SELECT id FROM assets WHERE symbol='USDT' AND status='active' LIMIT 1`);
      const wallet=await client.query('SELECT * FROM wallets WHERE customer_id=$1 AND asset_id=$2 FOR UPDATE',[customerId,usdt.rows[0].id]);
      if(!wallet.rows[0])throw new Error('usdt_wallet_not_found');
      const lockedChange=raw;
      if(Number(raw)<0 && Number(wallet.rows[0].locked_balance)<Math.abs(Number(raw)))throw new Error('forex_bot_locked_balance_invariant_failed');
      await client.query(`UPDATE wallets SET locked_balance=locked_balance+$1::numeric WHERE id=$2`,[lockedChange,wallet.rows[0].id]);
      const operationId='ANSARRAF-FBP-'+randomUUID();
      const event=await client.query(`INSERT INTO forex_bot_pnl_events(account_id,amount,source_reference,reason,idempotency_key,admin_identity_id,operation_id) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[accountId,raw,body.sourceReference.trim().slice(0,200),body.reason.trim().slice(0,2000),body.idempotencyKey,a.sub,operationId]);
      await client.query(`UPDATE forex_bot_accounts SET total_pnl=$1,updated_at=NOW(),version=version+1 WHERE id=$2`,[next.rows[0].pnl,accountId]);
      await addOutbox(client,'forex_bot.pnl',''+event.rows[0].id,{operationId,customerId,amount:raw,eventId:event.rows[0].id},'ansarraf:forexbot:pnl:'+event.rows[0].id);
      await client.query(`INSERT INTO forex_bot_audit_events(account_id,event_type,actor_type,actor_identity_id,payload) VALUES($1,'pnl_recorded','admin',$2,$3)`,[accountId,a.sub,{amount:raw,sourceReference:body.sourceReference,reason:body.reason}]);
      await client.query('COMMIT');
      return {event:event.rows[0]};
    }catch(e){await client.query('ROLLBACK');return reply.code(400).send({error:e instanceof Error?e.message:'forex_bot_pnl_failed'});}
    finally{client.release();}
  });
}