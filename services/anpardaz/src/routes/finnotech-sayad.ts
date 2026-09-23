import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';
import { createHash, randomUUID } from 'node:crypto';
import { ensureCustomer, requireAuth, type AuthClaims } from '../auth.js';
import { decryptSecret, FinnotechClient } from '../finnotech.js';

type R = FastifyRequest & { auth: AuthClaims };
type Json = Record<string, unknown>;

const asR = (r: FastifyRequest) => r as R;
const idem = (v: unknown) => typeof v === 'string' && v.length >= 8 && v.length <= 200;
const sayadId = (v: unknown) => typeof v === 'string' && /^\d{16}$/.test(v);
const path = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name}_not_configured`);
  return value;
};

function configured(reply: FastifyReply) {
  try { return new FinnotechClient(); }
  catch { void reply.code(503).send({ error: 'finnotech_not_configured' }); return null; }
}

async function connection(pool: Pool, customerId: string) {
  return (await pool.query(
    "SELECT * FROM finnotech_connections WHERE customer_id=$1 AND status='active' ORDER BY id DESC LIMIT 1",
    [customerId],
  )).rows[0];
}

async function token(pool: Pool, row: any, client: FinnotechClient) {
  if (row.access_token_expires_at && new Date(row.access_token_expires_at).getTime() < Date.now() + 30000 && row.refresh_token_enc) {
    const refreshed = await client.refresh(decryptSecret(row.refresh_token_enc));
    const access = String((refreshed.access_token as any)?.value ?? refreshed.access_token ?? '');
    const refresh = String((refreshed.access_token as any)?.refreshToken ?? refreshed.refresh_token ?? '');
    if (!access) throw new Error('finnotech_refresh_missing_access_token');
    const expires = Number((refreshed.access_token as any)?.expiresIn ?? refreshed.expires_in ?? 3600);
    await pool.query(
      "UPDATE finnotech_connections SET access_token_enc=$1,refresh_token_enc=$2,access_token_expires_at=NOW()+($3::text || ' seconds')::interval,updated_at=NOW(),last_error=NULL WHERE id=$4",
      [require('../finnotech.js').encryptSecret(access), refresh ? require('../finnotech.js').encryptSecret(refresh) : row.refresh_token_enc, expires, row.id],
    );
    return access;
  }
  return decryptSecret(row.access_token_enc);
}

function fingerprint(body: Json) {
  return createHash('sha256').update(JSON.stringify(body)).digest('hex');
}

function safeMetadata(body: Json) {
  const allowed = [
    'sayadId', 'amount', 'dueDate', 'description', 'reason', 'recipientType',
    'recipientNationalId', 'recipientLegalId', 'recipientName',
  ];
  const result: Json = {};
  for (const key of allowed) {
    if (body[key] !== undefined) result[key] = key.toLowerCase().includes('nationalid') || key.toLowerCase().includes('legalid')
      ? String(body[key]).replace(/.(?=.{4})/g, '*')
      : body[key];
  }
  return result;
}

function providerPayload(body: Json) {
  const payload = { ...body };
  delete payload.idempotencyKey;
  return payload;
}

export function registerFinnotechSayadRoutes(app: FastifyInstance, pool: Pool) {
  app.get('/api/v1/banking/sayad/operations', { preHandler: requireAuth }, async (req, reply) => {
    const customerId = await ensureCustomer(pool, asR(req).auth);
    const rows = await pool.query(
      "SELECT operation_id,service_code,status,provider_code,provider_operation_id,external_reference,failure_code,failure_message,request_metadata,response_metadata,created_at,updated_at,completed_at FROM fintech_service_operations WHERE customer_id=$1 AND service_code LIKE 'sayad_%' ORDER BY created_at DESC LIMIT 100",
      [customerId],
    );
    return { operations: rows.rows };
  });

  const execute = async (
    req: FastifyRequest,
    reply: FastifyReply,
    serviceCode: string,
    envName: string,
    validate: (body: Json) => boolean,
    method: 'GET' | 'POST' = 'POST',
  ) => {
    const customerId = await ensureCustomer(pool, asR(req).auth);
    const body = ((req.body ?? {}) as Json);
    if (!validate(body)) return reply.code(400).send({ error: 'invalid_sayad_request' });

    const idempotencyKey = String(body.idempotencyKey ?? req.headers['idempotency-key'] ?? '');
    if (!idem(idempotencyKey)) return reply.code(400).send({ error: 'invalid_idempotency_key' });

    const existing = (await pool.query(
      'SELECT * FROM fintech_service_operations WHERE customer_id=$1 AND idempotency_key=$2 LIMIT 1',
      [customerId, idempotencyKey],
    )).rows[0];
    if (existing) return { operation: existing, idempotent: true };

    const operationId = `ANPARDAZ-SAYAD-${randomUUID()}`;
    const metadata = safeMetadata(body);
    const requestBody = providerPayload(body);

    await pool.query(
      `INSERT INTO fintech_service_operations
       (customer_id,service_code,operation_id,idempotency_key,request_fingerprint,status,provider_code,request_metadata)
       VALUES($1,$2,$3,$4,$5,'processing','FINNOTECH',$6)`,
      [customerId, serviceCode, operationId, idempotencyKey, fingerprint(requestBody), JSON.stringify(metadata)],
    );

    try {
      const conn = await connection(pool, customerId);
      if (!conn) {
        await pool.query("UPDATE fintech_service_operations SET status='failed',failure_code='finnotech_account_not_connected',failure_message='No active Finnotech connection',updated_at=NOW(),completed_at=NOW() WHERE operation_id=$1", [operationId]);
        return reply.code(409).send({ error: 'finnotech_account_not_connected', operationId });
      }

      const client = configured(reply);
      if (!client) {
        await pool.query("UPDATE fintech_service_operations SET status='failed',failure_code='finnotech_not_configured',updated_at=NOW(),completed_at=NOW() WHERE operation_id=$1", [operationId]);
        return;
      }

      const access = await token(pool, conn, client);
      const endpoint = path(envName).replace('{clientId}', encodeURIComponent(conn.client_id ?? process.env.FINNOTECH_CLIENT_ID ?? ''));
      const result = await client.call(endpoint, access, method === 'POST' ? { ...requestBody, operationId } : undefined, method);
      const providerOperationId = String((result.providerOperationId as any) ?? (result.operationId as any) ?? (result.trackId as any) ?? '') || null;
      const externalReference = String((result.reference as any) ?? (result.externalReference as any) ?? (result.traceId as any) ?? '') || null;

      const updated = (await pool.query(
        `UPDATE fintech_service_operations
         SET status='completed',provider_operation_id=$1,external_reference=$2,response_metadata=$3,accounting_status='not_required',updated_at=NOW(),completed_at=NOW()
         WHERE operation_id=$4 RETURNING *`,
        [providerOperationId, externalReference, JSON.stringify(result), operationId],
      )).rows[0];

      return { operation: updated, result };
    } catch (e) {
      const error = e as Error & { code?: string; data?: unknown };
      await pool.query(
        `UPDATE fintech_service_operations SET status='failed',failure_code=$1,failure_message=$2,response_metadata=$3,updated_at=NOW(),completed_at=NOW() WHERE operation_id=$4`,
        [error.code ?? 'FINNOTECH_ERROR', error.message.slice(0, 500), JSON.stringify(error.data ?? {}), operationId],
      );
      throw e;
    }
  };

  app.post('/api/v1/banking/sayad/inquiry', { preHandler: requireAuth }, async (req, reply) =>
    execute(req, reply, 'sayad_inquiry', 'FINNOTECH_SAYAD_INQUIRY_PATH', b => sayadId(b.sayadId)));

  app.post('/api/v1/banking/sayad/register', { preHandler: requireAuth }, async (req, reply) =>
    execute(req, reply, 'sayad_register', 'FINNOTECH_SAYAD_REGISTER_PATH', b =>
      sayadId(b.sayadId) && typeof b.amount === 'string' && /^\d+(\.\d+)?$/.test(b.amount as string) && typeof b.dueDate === 'string' && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(b.dueDate as string)));

  app.post('/api/v1/banking/sayad/accept', { preHandler: requireAuth }, async (req, reply) =>
    execute(req, reply, 'sayad_accept', 'FINNOTECH_SAYAD_ACCEPT_PATH', b => sayadId(b.sayadId)));

  app.post('/api/v1/banking/sayad/reject', { preHandler: requireAuth }, async (req, reply) =>
    execute(req, reply, 'sayad_reject', 'FINNOTECH_SAYAD_REJECT_PATH', b => sayadId(b.sayadId)));

  app.post('/api/v1/banking/sayad/transfer', { preHandler: requireAuth }, async (req, reply) =>
    execute(req, reply, 'sayad_transfer', 'FINNOTECH_SAYAD_TRANSFER_PATH', b => sayadId(b.sayadId) && typeof b.recipientNationalId === 'string' && /^[0-9]{10}$/.test(b.recipientNationalId as string)));

  app.post('/api/v1/banking/sayad/cancel', { preHandler: requireAuth }, async (req, reply) =>
    execute(req, reply, 'sayad_cancel', 'FINNOTECH_SAYAD_CANCEL_PATH', b => sayadId(b.sayadId)));
}
