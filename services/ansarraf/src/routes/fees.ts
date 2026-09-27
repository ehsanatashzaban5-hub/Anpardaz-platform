import type { FastifyInstance } from 'fastify';
import type { Pool } from 'pg';
import { ensureCustomer, requireAuth, type AuthClaims } from '../auth.js';

const adminRoles=new Set(['admin','super_admin','operator']);
const actor=(request:any)=>request.auth as AuthClaims;

export function registerFeeRoutes(app: FastifyInstance, pool: Pool) {
  app.get('/api/v1/fees', { preHandler: requireAuth }, async (request) => {
    const auth=actor(request);
    const customerId=await ensureCustomer(pool,auth);
    const rules=await pool.query(
      `SELECT id,operation_type,asset_symbol,market_symbol,percentage,fixed_amount,min_amount,max_amount,fee_asset_symbol,effective_from,effective_to,metadata
       FROM customer_fee_rules
       WHERE service='ansarraf' AND effective_from<=NOW() AND (effective_to IS NULL OR effective_to>NOW())
       ORDER BY operation_type,effective_from DESC,id DESC`,
    );
    const provider=await pool.query(
      `SELECT id,provider_code,asset_symbol,market_symbol,side,maker_rate,taker_rate,fixed_fee,fee_asset_symbol,effective_from,effective_to,metadata
       FROM provider_fee_rules
       WHERE effective_from<=NOW() AND (effective_to IS NULL OR effective_to>NOW())
       ORDER BY effective_from DESC,id DESC`,
    );
    return { customerId, rules: rules.rows, customerRules: rules.rows, providerRules: provider.rows, source:'database' };
  });

  app.get('/api/v1/admin/fees', { preHandler: requireAuth }, async (request,reply) => {
    if(!adminRoles.has(actor(request).role))return reply.code(403).send({error:'forbidden'});
    const q=await pool.query(
      `SELECT id,service,operation_type,asset_symbol,market_symbol,percentage,fixed_amount,min_amount,max_amount,fee_asset_symbol,effective_from,effective_to,metadata
       FROM customer_fee_rules WHERE service='ansarraf' ORDER BY operation_type,effective_from DESC,id DESC`
    );
    return {rules:q.rows};
  });

  app.post('/api/v1/admin/fees', { preHandler: requireAuth }, async (request,reply) => {
    const auth=actor(request);
    if(!adminRoles.has(auth.role))return reply.code(403).send({error:'forbidden'});
    const b=(request.body??{}) as any;
    const operationType=String(b.operationType??'').trim();
    const assetSymbol=b.assetSymbol==null?null:String(b.assetSymbol).trim().toUpperCase()||null;
    const marketSymbol=b.marketSymbol==null?null:String(b.marketSymbol).trim().toUpperCase()||null;
    const feeAssetSymbol=b.feeAssetSymbol==null?assetSymbol:String(b.feeAssetSymbol).trim().toUpperCase()||assetSymbol;
    const percentage=String(b.percentage??'0').trim();
    const fixedAmount=String(b.fixedAmount??'0').trim();
    const minAmount=b.minAmount==null||b.minAmount===''?null:String(b.minAmount);
    const maxAmount=b.maxAmount==null||b.maxAmount===''?null:String(b.maxAmount);
    if(!['trade','deposit','withdrawal','transfer'].includes(operationType))return reply.code(400).send({error:'invalid_operation_type'});
    const decimal=/^(?:0|[1-9]\d{0,27})(?:\.\d{1,18})?$/;
    if(!decimal.test(percentage)||!decimal.test(fixedAmount)|| (minAmount!==null&&!decimal.test(minAmount)) || (maxAmount!==null&&!decimal.test(maxAmount)))return reply.code(400).send({error:'invalid_fee_value'});
    const actorId=auth.sub;
    const client=await pool.connect();
    try{
      await client.query('BEGIN');
      const current=await client.query(
        `SELECT * FROM customer_fee_rules
         WHERE service='ansarraf' AND operation_type=$1
           AND asset_symbol IS NOT DISTINCT FROM $2
           AND market_symbol IS NOT DISTINCT FROM $3
           AND effective_to IS NULL
         ORDER BY effective_from DESC,id DESC LIMIT 1 FOR UPDATE`,
        [operationType,assetSymbol,marketSymbol]
      );
      const now=new Date();
      if(current.rows[0]){
        await client.query('UPDATE customer_fee_rules SET effective_to=$1 WHERE id=$2',[now,current.rows[0].id]);
        await client.query('INSERT INTO fee_rule_audit(rule_id,action,actor_identity_id,before_data,after_data) VALUES($1,\'close\',$2,$3,$4)',[current.rows[0].id,actorId,current.rows[0],null]);
      }
      const inserted=await client.query(
        `INSERT INTO customer_fee_rules(service,operation_type,asset_symbol,market_symbol,percentage,fixed_amount,min_amount,max_amount,fee_asset_symbol,effective_from,metadata)
         VALUES('ansarraf',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [operationType,assetSymbol,marketSymbol,percentage,fixedAmount,minAmount,maxAmount,feeAssetSymbol,now,{source:'admin_panel'}]
      );
      await client.query('INSERT INTO fee_rule_audit(rule_id,action,actor_identity_id,before_data,after_data) VALUES($1,\'create\',$2,$3,$4)',[inserted.rows[0].id,actorId,null,inserted.rows[0]]);
      await client.query('COMMIT');
      return reply.code(201).send({rule:inserted.rows[0]});
    }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
  });

  app.post('/api/v1/admin/fees/:id/close', { preHandler: requireAuth }, async (request,reply) => {
    const auth=actor(request);
    if(!adminRoles.has(auth.role))return reply.code(403).send({error:'forbidden'});
    const id=Number((request.params as any).id);
    if(!Number.isSafeInteger(id)||id<=0)return reply.code(400).send({error:'invalid_fee_rule_id'});
    const client=await pool.connect();
    try{
      await client.query('BEGIN');
      const row=(await client.query('SELECT * FROM customer_fee_rules WHERE id=$1 AND service=\'ansarraf\' FOR UPDATE',[id])).rows[0];
      if(!row)return reply.code(404).send({error:'fee_rule_not_found'});
      if(row.effective_to)return reply.code(409).send({error:'fee_rule_already_closed'});
      const closed=(await client.query('UPDATE customer_fee_rules SET effective_to=NOW() WHERE id=$1 RETURNING *',[id])).rows[0];
      await client.query('INSERT INTO fee_rule_audit(rule_id,action,actor_identity_id,before_data,after_data) VALUES($1,\'close\',$2,$3,$4)',[id,auth.sub,row,closed]);
      await client.query('COMMIT');
      return {rule:closed};
    }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
  });
}
