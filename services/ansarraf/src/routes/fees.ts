import type { FastifyInstance } from 'fastify';
import type { Pool } from 'pg';
import { ensureCustomer, requireAuth } from '../auth.js';

export function registerFeeRoutes(app: FastifyInstance, pool: Pool) {
  app.get('/api/v1/fees', { preHandler: requireAuth }, async (request) => {
    const auth=(request as typeof request & {auth:any}).auth;
    const customerId=await ensureCustomer(pool,auth);
    const rules=await pool.query(
      `SELECT id,operation_type,asset_symbol,market_symbol,percentage,fixed_amount,min_amount,max_amount,fee_asset_symbol,effective_from,effective_to,metadata
       FROM customer_fee_rules
       WHERE service='ansarraf' AND operation_type='trade'
         AND effective_from<=NOW() AND (effective_to IS NULL OR effective_to>NOW())
       ORDER BY effective_from DESC,id DESC`,
    );
    const provider=await pool.query(
      `SELECT id,provider_code,asset_symbol,market_symbol,side,maker_rate,taker_rate,fixed_fee,fee_asset_symbol,effective_from,effective_to,metadata
       FROM provider_fee_rules
       WHERE effective_from<=NOW() AND (effective_to IS NULL OR effective_to>NOW())
       ORDER BY effective_from DESC,id DESC`,
    );
    return { customerId, customerRules: rules.rows, providerRules: provider.rows, source:'database' };
  });
}
