import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { Pool } from 'pg';
import { ensurePlatformUser, requireAuth } from '../auth.js';
export function registerContentRoutes(app: FastifyInstance, pool: Pool) {
 app.get('/api/v1/categories', async (request) => {const type=(request.query as {type?:string}).type;const r=await pool.query('SELECT id,name,slug,category_type,parent_id FROM categories WHERE ($1::text IS NULL OR category_type=$1) ORDER BY name',[type??null]);return {categories:r.rows};});


if(b.price!==undefined&&(!Number.isFinite(b.price)||b.price<0))return reply.code(400).send({error:'invalid_price'});const userId=await ensurePlatformUser(pool,auth);const r=await pool.query('INSERT INTO banner_listings(user_id,category_id,title,description,price,currency,city) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[userId,b.categoryId??null,b.title.trim(),b.description??null,b.price??null,b.currency?.toUpperCase()??null,b.city??null]);return reply.code(201).send({listing:r.rows[0]});});
}
