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
      const [wallets, orders, withdrawals, reconciliation] = await Promise.all([
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
      ]);
      return {
        customer: customer.rows[0],
        wallets: wallets.rows,
        orders: orders.rows,
        withdrawals: withdrawals.rows,
        reconciliation: reconciliation.rows,
      };
    },
  );
}
