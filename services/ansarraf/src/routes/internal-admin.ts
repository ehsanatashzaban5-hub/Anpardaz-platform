import {reconcileOperation} from '../operation-reconciliation.js';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';

const guard = async (request: FastifyRequest, reply: { code: (n: number) => { send: (v: unknown) => void } }): Promise<void> => {
  const expected = process.env.ANSARRAF_INTERNAL_TOKEN;
  if (!expected || request.headers.authorization !== `Bearer ${expected}`) return reply.code(401).send({ error: 'unauthorized' });
};

export function registerInternalAdminRoutes(app: FastifyInstance, pool: Pool) {
  app.get<{ Params: { identityId: string } }>(
    '/internal/v1/admin/users/:identityId/summary',
    { preHandler: guard },
    async (request, reply) => {
      const identityId = request.params.identityId;
      const customer = await pool.query(
        'SELECT id,identity_id,external_user_id,email,status,created_at,updated_at FROM customers WHERE identity_id=$1 LIMIT 1',
        [identityId],
      );
      if (!customer.rows[0]) return reply.code(404).send({ error: 'customer_not_found' });
      const customerId = customer.rows[0].id;
      const [wallets, orders, withdrawals, kyc, reconciliation, reconciliationDetails, customerReconciliation] = await Promise.all([
        pool.query(
          `SELECT w.id,a.symbol,a.asset_type,w.available_balance::text,w.locked_balance::text,
                  (w.available_balance+w.locked_balance)::text AS total_balance
           FROM wallets w JOIN assets a ON a.id=w.asset_id
           WHERE w.customer_id=$1 ORDER BY a.symbol`,
          [customerId],
        ),
        pool.query(
          `SELECT id,operation_id,side,order_type,status,base_asset_id,quote_asset_id,
                  quantity::text,filled_quantity::text,price::text,created_at,updated_at
           FROM orders WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 100`,
          [customerId],
        ),
        pool.query(
          `SELECT id,operation_id,asset_id,amount::text,network,destination,
                  status,approval_status,provider_withdrawal_id,created_at,completed_at
           FROM withdrawals WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 100`,
          [customerId],
        ),
        pool.query(
          `SELECT id,provider_code,status,started_at,completed_at,
                  error_message,metadata
           FROM reconciliation_runs ORDER BY id DESC LIMIT 10`,
        ),
        pool.query(
          `SELECT id,status,provider_code,provider_reference,provider_identity_match,provider_mobile_match,provider_status,provider_checked_at,submitted_at,approved_at,rejected_at,admin_id,admin_decision_reason,created_at,updated_at
           FROM kyc_profiles WHERE customer_id=$1 LIMIT 1`,
          [customerId],
        ),
        pool.query(
          `SELECT id,run_id,provider_code,asset_symbol,provider_available::text,
                  provider_locked::text,provider_total::text,accounting_balance::text,
                  difference::text,status,created_at
           FROM provider_balance_reconciliations
           ORDER BY id DESC LIMIT 100`,
        ),
        pool.query(
          `SELECT id,run_id,asset_symbol,wallet_total::text,accounting_liability::text,
                  difference::text,status,created_at
           FROM customer_balance_reconciliations
           ORDER BY id DESC LIMIT 100`,
        ),
      ]);
      return {
        customer: customer.rows[0],
        wallets: wallets.rows,
        orders: orders.rows,
        withdrawals: withdrawals.rows,
        kyc: kyc.rows[0] ?? null,
        reconciliation: reconciliation.rows,
        reconciliationDetails: reconciliationDetails.rows,
        customerReconciliation: customerReconciliation.rows,
      };
    },
  );

  app.get<{ Params: { operationId: string } }>(
    '/internal/v1/admin/operations/:operationId/trace',
    { preHandler: guard },
    async (request, reply) => {
      const operationId = request.params.operationId?.trim();
      if (!operationId || operationId.length > 200) return reply.code(400).send({ error: 'invalid_operation_id' });

      const [orders, withdrawals, trades, providerOrders, settlements, provenance, reconciliationRuns, auditEvents] = await Promise.all([
        pool.query(
          `SELECT o.*,ba.symbol AS base_symbol,qa.symbol AS quote_symbol
           FROM orders o
           JOIN assets ba ON ba.id=o.base_asset_id
           JOIN assets qa ON qa.id=o.quote_asset_id
           WHERE o.operation_id=$1 ORDER BY o.id`,
          [operationId],
        ),
        pool.query(
          `SELECT w.*,a.symbol AS asset_symbol,lp.code AS provider_code
           FROM withdrawals w
           JOIN assets a ON a.id=w.asset_id
           LEFT JOIN liquidity_providers lp ON lp.id=w.liquidity_provider_id
           WHERE w.operation_id=$1 ORDER BY w.id`,
          [operationId],
        ),
        pool.query(
          `SELECT t.*,o.operation_id AS order_operation_id
           FROM trades t JOIN orders o ON o.id=t.order_id
           WHERE t.operation_id=$1 OR o.operation_id=$1 ORDER BY t.id`,
          [operationId],
        ),
        pool.query(
          `SELECT po.*,lp.code AS provider_code
           FROM provider_orders po JOIN liquidity_providers lp ON lp.id=po.provider_id
           WHERE po.customer_order_id IN
             (SELECT id FROM orders WHERE operation_id=$1)
           ORDER BY po.id`,
          [operationId],
        ),
        pool.query(
          `SELECT pts.*
           FROM provider_trade_settlements pts
           WHERE pts.operation_id=$1 OR pts.customer_order_id IN
             (SELECT id FROM orders WHERE operation_id=$1)
           ORDER BY pts.id`,
          [operationId],
        ),
        pool.query(
          `SELECT ap.*
           FROM asset_provenance ap
           WHERE ap.operation_id=$1 ORDER BY ap.id`,
          [operationId],
        ),
        pool.query(
          `SELECT id,provider_code,status,started_at,completed_at,error_message,metadata
           FROM reconciliation_runs ORDER BY id DESC LIMIT 20`,
        ),
        pool.query(
          `SELECT id,operation_id,event_type,actor_type,actor_id,aggregate_type,aggregate_id,
                  event_payload,previous_hash,event_hash,created_at
           FROM operation_audit_events
           WHERE operation_id=$1
           ORDER BY id`,
          [operationId],
        ),
      ]);

      const orderIds = orders.rows.map((r) => Number(r.id));
      const withdrawalIds = withdrawals.rows.map((r) => Number(r.id));
      const [orderReservations, withdrawalReservations] = await Promise.all([
        orderIds.length
          ? pool.query(
              `SELECT * FROM wallet_reservations WHERE order_id=ANY($1::bigint[]) ORDER BY id`,
              [orderIds],
            )
          : Promise.resolve({ rows: [] as unknown[] }),
        withdrawalIds.length
          ? pool.query(
              `SELECT * FROM withdrawal_reservations WHERE withdrawal_id=ANY($1::bigint[]) ORDER BY id`,
              [withdrawalIds],
            )
          : Promise.resolve({ rows: [] as unknown[] }),
      ]);

      const accounting = { available: false, transactions: [] as unknown[], error: null as string | null };
      const accountingUrl = process.env.ACCOUNTING_SERVICE_URL;
      const accountingToken = process.env.ACCOUNTING_INTERNAL_TOKEN;
      if (accountingUrl && accountingToken) {
        try {
          const response = await fetch(
            accountingUrl.replace(/\/$/, '') +
              '/internal/v1/ledger/transactions/by-operation/' +
              encodeURIComponent(operationId),
            {
              headers: { authorization: 'Bearer ' + accountingToken },
              signal: AbortSignal.timeout(Number(process.env.ACCOUNTING_HTTP_TIMEOUT_MS ?? 5000)),
            },
          );
          const body = await response.json().catch(() => ({}));
          if (response.ok) {
            accounting.available = true;
            accounting.transactions = body.transactions ?? [];
          } else {
            accounting.error = 'accounting_http_' + response.status;
          }
        } catch {
          accounting.error = 'accounting_unavailable';
        }
      } else {
        accounting.error = 'accounting_not_configured';
      }

      const customerIds = new Set<number>();
      for (const row of orders.rows) customerIds.add(Number(row.customer_id));
      for (const row of withdrawals.rows) customerIds.add(Number(row.customer_id));
      for (const row of settlements.rows) customerIds.add(Number(row.customer_id ?? 0));
      customerIds.delete(0);

      return {
        operationId,
        customerIds: [...customerIds],
        orders: orders.rows,
        trades: trades.rows,
        reservations: {
          orders: orderReservations.rows,
          withdrawals: withdrawalReservations.rows,
        },
        provider: {
          orders: providerOrders.rows,
          settlements: settlements.rows,
        },
        withdrawals: withdrawals.rows,
        provenance: provenance.rows,
        accounting,
        audit: {
          events: auditEvents.rows,
          tamperEvidence: auditEvents.rows.map((row: any) => ({
            id: row.id,
            previousHash: row.previous_hash,
            eventHash: row.event_hash,
          })),
        },
        reconciliation: {
          operationEvidence: await reconcileOperation(pool, operationId),
          latestRuns: reconciliationRuns.rows,
        },
      };
    },
  );
}
