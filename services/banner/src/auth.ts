import { createPublicKey, verify as verifyData } from 'node:crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';

export type AuthClaims = {
  sub: string; email: string; role: string; iss: string; aud: 'anpardaz-ecosystem'; iat: number; exp: number;
};

const PUBLIC_KEY_B64 = process.env.IDENTITY_PUBLIC_KEY_B64;
if (!PUBLIC_KEY_B64) throw new Error('IDENTITY_PUBLIC_KEY_B64 must be configured');
const publicKey = createPublicKey({key:Buffer.from(PUBLIC_KEY_B64,'base64'),format:'der',type:'spki'});

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
    if(!c.sub||!c.email||c.aud!=='anpardaz-ecosystem'||c.iss!==(process.env.IDENTITY_ISSUER??'anpardaz-platform')||
      !Number.isSafeInteger(c.iat)||!Number.isSafeInteger(c.exp)||c.iat>now+60||c.exp<=now||c.exp>c.iat+3600) return null;
    return c;
  } catch { return null; }
}

export async function requireAuth(req:FastifyRequest,reply:FastifyReply): Promise<void> {
  const h=req.headers.authorization;
  const auth=h?.startsWith('Bearer ')?verifyIdentityToken(h.slice(7)):null;
  if(!auth){reply.code(401).send({error:'unauthorized'});return;}
  (req as FastifyRequest&{auth:AuthClaims}).auth=auth;
}
export async function requireAdminInternal(req:FastifyRequest,reply:FastifyReply): Promise<void> {
  const expected=process.env.BANNER_INTERNAL_TOKEN;
  if(!expected){reply.code(503).send({error:'internal_credentials_not_configured'});return;}
  if(req.headers.authorization!==`Bearer ${expected}`){reply.code(401).send({error:'unauthorized'});return;}
}
