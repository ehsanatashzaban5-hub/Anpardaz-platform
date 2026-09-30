import { createPublicKey, timingSafeEqual, verify as verifyData } from 'node:crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';

export type AuthClaims = {
  sub: string; email: string; role: string; phone?: string; iss: string; aud: 'anpardaz-ecosystem'; iat: number; exp: number;
};

const PUBLIC_KEY_B64 = process.env.IDENTITY_PUBLIC_KEY_B64;
if (!PUBLIC_KEY_B64) throw new Error('IDENTITY_PUBLIC_KEY_B64 must be configured');
const publicKey = createPublicKey({key:Buffer.from(PUBLIC_KEY_B64,'base64'),format:'der',type:'spki'});
const identityUrl = () => (process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:4003').replace(/\/$/, '');

export function verifyIdentityToken(token:string):AuthClaims|null {
  if (typeof token !== 'string' || token.length < 32 || token.length > 8192) return null;
  const parts=token.split('.'); if(parts.length!==3) return null;
  const [h,p,s]=parts; if(!h||!p||!s) return null;
  try {
    const header=JSON.parse(Buffer.from(h,'base64url').toString()) as {alg?:string;typ?:string};
    if(header.alg!=='EdDSA'||header.typ!=='JWT') return null;
    if(!verifyData(null,Buffer.from(h+'.'+p),publicKey,Buffer.from(s,'base64url'))) return null;
    const c=JSON.parse(Buffer.from(p,'base64url').toString()) as AuthClaims;
    const now=Math.floor(Date.now()/1000);
    if(typeof c.sub!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(c.sub)) return null;
    if(typeof c.email!=='string'||!/^([^\\s@]+)@([^\\s@]+)\\.([^\\s@]+)$/.test(c.email)) return null;
    if(typeof c.role!=='string'||!['user','admin','super_admin','operator','editor','moderator','support'].includes(c.role)) return null;
    if(c.aud!=='anpardaz-ecosystem'||c.iss!==(process.env.IDENTITY_ISSUER??'anpardaz-platform')||
      !Number.isSafeInteger(c.iat)||!Number.isSafeInteger(c.exp)||c.iat>now+60||c.exp<=now||c.exp>c.iat+3600) return null;
    return c;
  } catch { return null; }
}

export async function requireAuth(req:FastifyRequest,reply:FastifyReply): Promise<void> {
  const h=req.headers.authorization;
  const token=h?.startsWith('Bearer ')?h.slice(7):'';
  const auth=token?verifyIdentityToken(token):null;
  if(!auth){reply.code(401).send({error:'unauthorized'});return;}

  // A locally valid JWT is not sufficient: account disable/revocation and role changes
  // must take effect immediately instead of waiting for the JWT TTL to expire.
  const internalToken=process.env.BANNER_INTERNAL_TOKEN?.trim();
  if(!internalToken){reply.code(503).send({error:'internal_identity_token_not_configured'});return;}
  try{
    const upstream=await fetch(identityUrl()+'/internal/v1/identity/introspect',{
      headers:{authorization:'Bearer '+internalToken,'x-identity-token':token,accept:'application/json'},
      signal:AbortSignal.timeout(4000),
      cache:'no-store',
    });
    if(!upstream.ok){
      reply.code(upstream.status===401||upstream.status===403?401:503)
        .send({error:upstream.status===401||upstream.status===403?'unauthorized':'identity_service_unavailable'});
      return;
    }
    const data=await upstream.json().catch(()=>null) as any;
    const u=data?.user;
    if(!u||u.status!=='active'||String(u.identity_id??'')!==auth.sub){
      reply.code(401).send({error:'unauthorized'});
      return;
    }
    if(typeof u.role==='string')auth.role=u.role;
    if(typeof u.email==='string')auth.email=u.email;
    if(typeof u.phone==='string')auth.phone=u.phone;
    (req as FastifyRequest&{auth:AuthClaims}).auth=auth;
  }catch(error){
    req.log.warn({error},'identity revalidation failed');
    reply.code(503).send({error:'identity_service_unavailable'});
  }
}

export async function requireAdminInternal(req:FastifyRequest,reply:FastifyReply): Promise<void> {
  const expected=process.env.BANNER_INTERNAL_TOKEN?.trim();
  if(!expected){reply.code(503).send({error:'internal_credentials_not_configured'});return;}
  if(req.headers.authorization!==`Bearer ${expected}`){reply.code(401).send({error:'unauthorized'});return;}
}
