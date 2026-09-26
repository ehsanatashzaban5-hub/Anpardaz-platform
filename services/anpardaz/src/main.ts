import Fastify from 'fastify';import {createHash,randomBytes} from 'node:crypto';import cors from '@fastify/cors';import {Pool} from 'pg';import {registerAuthRoutes,requireAuth,ensureCustomer,verifyIdentityToken} from './auth.js';import {registerAccountRoutes} from './routes/accounts.js';import {registerBankingRoutes} from './routes/banking.js';import {registerInternalAdminRoutes} from './routes/internal-admin.js';import {registerServiceRoutes} from './routes/services.js';import {registerFinnotechBankingRoutes} from './routes/finnotech-banking.js';import {registerFinnotechSayadRoutes} from './routes/finnotech-sayad.js';import {registerCardRegistrationRoutes} from './routes/card-registration.js';import {registerFinancialCenterRoutes} from './routes/financial-center.js';import {iranIpDecision,requireIranIpInProduction} from '@anpardaz/ip-region-policy';
import {generateAuthenticationOptions,generateRegistrationOptions,verifyAuthenticationResponse,verifyRegistrationResponse} from '@simplewebauthn/server';
const isProduction=process.env.NODE_ENV==='production';const requiredProduction=['DATABASE_URL','CORS_ORIGIN','IDENTITY_SERVICE_URL','IDENTITY_ISSUER','IDENTITY_PUBLIC_KEY_B64','ANPARDAZ_INTERNAL_TOKEN','IP_GEOLOCATION_URL_TEMPLATE','WEBAUTHN_RP_ID','WEBAUTHN_ORIGIN'];if(isProduction){for(const name of requiredProduction){const value=process.env[name];if(!value||value.includes('CHANGE_ME')||value.includes('your-web-domain.example')||value.includes('your-domain.example')||value.includes('<trusted-geolocation-provider>')||value.includes('BASE64-DER-ED25519-PUBLIC-KEY')||value.includes('generate-a-long-random-secret'))throw new Error(`Production environment variable ${name} must be configured with a real value`);}if(String(process.env.ANPARDAZ_INTERNAL_TOKEN).length<32)throw new Error('Production ANPARDAZ_INTERNAL_TOKEN must be at least 32 characters');if(process.env.SHAPARAK_CARD_REGISTRATION_ENABLED==='true'){for(const name of ['SHAPARAK_CARD_REGISTRATION_URL','SHAPARAK_CARD_REGISTRATION_REDIRECT_URI','SHAPARAK_CARD_REGISTRATION_RETURN_URL','SHAPARAK_CARD_FINGERPRINT_SECRET','SHAPARAK_CALLBACK_HMAC_SECRET']){const value=process.env[name];if(!value||value.includes('configure-at-deploy-time')||value.includes('your-domain.example')||value.includes('generate-a-32-byte-base64-key'))throw new Error(`Production Shaparak variable ${name} must be configured with a real value`);}}if(process.env.FINNOTECH_ENABLED==='true'){for(const name of ['FINNOTECH_CLIENT_ID','FINNOTECH_CLIENT_SECRET','FINNOTECH_AUTHORIZE_URL','FINNOTECH_TOKEN_URL','FINNOTECH_REDIRECT_URI','FINNOTECH_TOKEN_ENCRYPTION_KEY_B64','FINNOTECH_BALANCE_PATH','FINNOTECH_STATEMENT_PATH','FINNOTECH_TRANSFER_PATH','FINNOTECH_SAYAD_INQUIRY_PATH','FINNOTECH_SAYAD_REGISTER_PATH','FINNOTECH_SAYAD_ACCEPT_PATH','FINNOTECH_SAYAD_REJECT_PATH','FINNOTECH_SAYAD_TRANSFER_PATH','FINNOTECH_SAYAD_CANCEL_PATH']){const value=process.env[name];if(!value||value.includes('configure-at-deploy-time')||value.includes('your-domain.example')||value.includes('generate-a-32-byte-base64-key'))throw new Error(`Production Finnotech variable ${name} must be configured with a real value`);}}}const trustProxy=process.env.TRUST_PROXY==='true';const app=Fastify({logger:true,trustProxy});app.setErrorHandler((error,_request,reply)=>{if(error instanceof Error&&error.message==='customer_inactive')return reply.code(403).send({error:'customer_inactive'});app.log.error(error);return reply.code(500).send({error:'internal_server_error'});});const port=Number(process.env.PORT??4001);const databaseUrl=process.env.DATABASE_URL;const pool=databaseUrl?new Pool({connectionString:databaseUrl,max:10,connectionTimeoutMillis:5000,idleTimeoutMillis:30000}):null;if(!pool)app.log.warn('DATABASE_URL is not configured');const corsOrigins=process.env.CORS_ORIGIN?.split(',').map(v=>v.trim()).filter(Boolean)??['http://localhost:5173'];if(isProduction&&corsOrigins.some(v=>v==='*'||v.startsWith('http://localhost')||v.startsWith('http://127.0.0.1')))throw new Error('Production CORS_ORIGIN must not allow localhost or wildcard origins');await app.register(cors,{origin:corsOrigins});app.addHook('onSend',async(_r,reply)=>{reply.header('X-Content-Type-Options','nosniff');reply.header('Referrer-Policy','strict-origin-when-cross-origin');reply.header('X-Frame-Options','DENY');});
app.get('/health',async()=>({service:'anpardaz',status:'ok'}));app.get('/health/db',async(_r,reply)=>{if(!pool)return reply.code(503).send({service:'anpardaz',database:'not-configured'});try{const x=await pool.query<{version:string}>('SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1');return{service:'anpardaz',database:'ok',migration:x.rows[0]?.version??null};}catch{return reply.code(503).send({service:'anpardaz',database:'unavailable'});}});app.get('/api/v1/status',async()=>({service:'anpardaz',apiVersion:'v1',status:'ready'}));
const iranOnlyPath=(url:string)=>/^\/api\/v1\/(?:cards(?:\/|$)|services(?:\/|$)|financial-center(?:\/|$)|banking(?:\/|$)|finnotech(?:\/|$))/.test(url);
const deviceSecurityExempt=(url:string)=>/^\/api\/v1\/(?:cards\/registration\/callback|device-security(?:\/|$))/.test(url);
const providerCallbackPath=(url:string)=>/^\/api\/v1\/cards\/registration\/callback(?:\?|$)/.test(url);
const deviceTokenHash=(token:string)=>createHash('sha256').update(token).digest('hex');
app.addHook('onRequest',async(request,reply)=>{
  if(!iranOnlyPath(request.url)||providerCallbackPath(request.url))return;
  const allowed=await requireIranIpInProduction(request,reply);
  if(allowed===false)return reply;
  if(deviceSecurityExempt(request.url))return;
  const authHeader=request.headers.authorization;
  const claims=authHeader?.startsWith('Bearer ')?verifyIdentityToken(authHeader.slice(7)):null;
  const deviceToken=String(request.headers['x-anpardaz-device-token']??'');
  if(!claims||!deviceToken){await reply.code(403).send({error:'device_security_required',message:'فعال‌بودن قفل امن دستگاه برای استفاده از این خدمت الزامی است.'});return reply;}
  const customer=pool?await pool.query('SELECT id FROM customers WHERE identity_id=$1 AND status=\'active\' LIMIT 1',[claims.sub]):{rows:[]};
  const customerId=customer.rows[0]?.id;
  if(!customerId){await reply.code(403).send({error:'device_security_required'});return reply;}
  const session=await pool!.query('SELECT 1 FROM device_security_sessions WHERE token_hash=$1 AND customer_id=$2 AND expires_at>NOW() LIMIT 1',[deviceTokenHash(deviceToken),customerId]);
  if(!session.rows[0]){await reply.code(403).send({error:'device_security_required',message:'برای ادامه، قفل امن گوشی را تأیید کنید.'});return reply;}
});
app.get('/api/v1/access/region',async(request)=>{const d=await iranIpDecision(request);return{allowed:d.allowed,countryCode:d.countryCode,source:d.source};});
const webauthnRpName=process.env.WEBAUTHN_RP_NAME??'An Pardaz';
const webauthnRpId=process.env.WEBAUTHN_RP_ID??'localhost';
const webauthnOrigin=process.env.WEBAUTHN_ORIGIN??'http://localhost:5173';
const deviceSecurityUserId=(customerId:string)=>new Uint8Array(Buffer.from(customerId,'utf8'));

app.get('/api/v1/device-security/status',{preHandler:requireAuth},async(request,reply)=>{
  if(!pool)return reply.code(503).send({error:'database_unavailable'});
  const auth=(request as typeof request&{auth:any}).auth;
  const customerId=await ensureCustomer(pool,auth);
  const rows=await pool.query('SELECT credential_id,last_verified_at FROM device_security_credentials WHERE customer_id=$1 ORDER BY id',[customerId]);
  return {required:true,registered:rows.rows.length>0,lastVerifiedAt:rows.rows.at(-1)?.last_verified_at??null};
});

app.get('/api/v1/device-security/registration/options',{preHandler:requireAuth},async(request,reply)=>{
  if(!pool)return reply.code(503).send({error:'database_unavailable'});
  const auth=(request as typeof request&{auth:any}).auth;
  const customerId=await ensureCustomer(pool,auth);
  const existing=await pool.query('SELECT credential_id FROM device_security_credentials WHERE customer_id=$1',[customerId]);
  const options=await generateRegistrationOptions({
    rpName:webauthnRpName,
    rpID:webauthnRpId,
    userID:deviceSecurityUserId(customerId),
    userName:auth.email,
    attestationType:'none',
    supportedAlgorithmIDs:[-7,-257],
    excludeCredentials:existing.rows.map((x:any)=>({id:x.credential_id})),
    authenticatorSelection:{residentKey:'required',userVerification:'required',authenticatorAttachment:'platform'},
  });
  await pool.query(`INSERT INTO device_security_challenges(customer_id,challenge,challenge_type,expires_at) VALUES($1,$2,'registration',NOW()+INTERVAL '5 minutes') ON CONFLICT(customer_id) DO UPDATE SET challenge=EXCLUDED.challenge,challenge_type='registration',expires_at=EXCLUDED.expires_at,created_at=NOW()`,[customerId,options.challenge]);
  return options;
});

app.post('/api/v1/device-security/registration/verify',{preHandler:requireAuth},async(request,reply)=>{
  if(!pool)return reply.code(503).send({error:'database_unavailable'});
  const auth=(request as typeof request&{auth:any}).auth;
  const customerId=await ensureCustomer(pool,auth);
  const challenge=(await pool.query("SELECT challenge FROM device_security_challenges WHERE customer_id=$1 AND challenge_type='registration' AND expires_at>NOW()",[customerId])).rows[0]?.challenge;
  if(!challenge)return reply.code(400).send({error:'device_security_challenge_expired'});
  try{
    const verification=await verifyRegistrationResponse({
      response:(request.body??{}) as any,
      expectedChallenge:challenge,
      expectedOrigin:webauthnOrigin,
      expectedRPID:webauthnRpId,
      requireUserVerification:true,
    });
    if(!verification.verified||!verification.registrationInfo)return reply.code(400).send({error:'device_security_registration_failed'});
    const info=verification.registrationInfo;
    const cred=info.credential;
    await pool.query(`INSERT INTO device_security_credentials(customer_id,credential_id,public_key,counter,transports,device_type,backed_up,last_verified_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,NOW()) ON CONFLICT(credential_id) DO UPDATE SET counter=EXCLUDED.counter,transports=EXCLUDED.transports,device_type=EXCLUDED.device_type,backed_up=EXCLUDED.backed_up,last_verified_at=NOW()`,
      [customerId,cred.id,Buffer.from(cred.publicKey),cred.counter,cred.transports??[],info.credentialDeviceType??null,info.credentialBackedUp??false]);
    await pool.query('DELETE FROM device_security_challenges WHERE customer_id=$1',[customerId]);
    const deviceToken=randomBytes(32).toString('base64url');
    await pool.query('INSERT INTO device_security_sessions(token_hash,customer_id,expires_at) VALUES($1,$2,NOW()+INTERVAL \'15 minutes\')',[deviceToken,customerId]);
    return {verified:true,deviceToken,expiresInSeconds:900};
  }catch(error){request.log.warn({error},'device security registration verification failed');return reply.code(400).send({error:'device_security_registration_failed'});}
});

app.get('/api/v1/device-security/authentication/options',{preHandler:requireAuth},async(request,reply)=>{
  if(!pool)return reply.code(503).send({error:'database_unavailable'});
  const auth=(request as typeof request&{auth:any}).auth;
  const customerId=await ensureCustomer(pool,auth);
  const rows=await pool.query('SELECT credential_id,transports FROM device_security_credentials WHERE customer_id=$1',[customerId]);
  if(!rows.rows.length)return reply.code(404).send({error:'device_security_not_registered'});
  const options=await generateAuthenticationOptions({
    rpID:webauthnRpId,
    allowCredentials:rows.rows.map((x:any)=>({id:x.credential_id,transports:x.transports??[]})),
    userVerification:'required',
  });
  await pool.query(`INSERT INTO device_security_challenges(customer_id,challenge,challenge_type,expires_at) VALUES($1,$2,'authentication',NOW()+INTERVAL '5 minutes') ON CONFLICT(customer_id) DO UPDATE SET challenge=EXCLUDED.challenge,challenge_type='authentication',expires_at=EXCLUDED.expires_at,created_at=NOW()`,[customerId,options.challenge]);
  return options;
});

app.post('/api/v1/device-security/authentication/verify',{preHandler:requireAuth},async(request,reply)=>{
  if(!pool)return reply.code(503).send({error:'database_unavailable'});
  const auth=(request as typeof request&{auth:any}).auth;
  const customerId=await ensureCustomer(pool,auth);
  const challenge=(await pool.query("SELECT challenge FROM device_security_challenges WHERE customer_id=$1 AND challenge_type='authentication' AND expires_at>NOW()",[customerId])).rows[0]?.challenge;
  const body=(request.body??{}) as any;
  const stored=(await pool.query('SELECT id,credential_id,public_key,counter,transports FROM device_security_credentials WHERE customer_id=$1 AND credential_id=$2 LIMIT 1',[customerId,String(body.id??'')])).rows[0];
  if(!challenge||!stored)return reply.code(400).send({error:'device_security_authentication_invalid'});
  try{
    const verification=await verifyAuthenticationResponse({
      response:body,
      expectedChallenge:challenge,
      expectedOrigin:webauthnOrigin,
      expectedRPID:webauthnRpId,
      requireUserVerification:true,
      credential:{id:stored.credential_id,publicKey:new Uint8Array(stored.public_key),counter:Number(stored.counter),transports:stored.transports??[]},
    });
    if(!verification.verified)return reply.code(401).send({error:'device_security_authentication_failed'});
    await pool.query('UPDATE device_security_credentials SET counter=$1,last_verified_at=NOW() WHERE id=$2',[verification.authenticationInfo.newCounter,stored.id]);
    await pool.query('DELETE FROM device_security_challenges WHERE customer_id=$1',[customerId]);
    const deviceToken=randomBytes(32).toString('base64url');
    await pool.query('INSERT INTO device_security_sessions(token_hash,customer_id,expires_at) VALUES($1,$2,NOW()+INTERVAL \'15 minutes\')',[deviceToken,customerId]);
    return {verified:true,deviceToken,expiresInSeconds:900};
  }catch(error){request.log.warn({error},'device security authentication verification failed');return reply.code(401).send({error:'device_security_authentication_failed'});}
});


let financialSyncTimer:NodeJS.Timeout|undefined;
if(pool){registerAuthRoutes(app,pool);registerAccountRoutes(app,pool);registerBankingRoutes(app,pool);registerServiceRoutes(app,pool);registerFinnotechBankingRoutes(app,pool);registerFinnotechSayadRoutes(app,pool);registerCardRegistrationRoutes(app,pool);
registerInternalAdminRoutes(app,pool);registerFinancialCenterRoutes(app,pool);
const financialSyncMinutes=Math.max(0,Number(process.env.FINANCIAL_CENTER_SYNC_INTERVAL_MINUTES??60));
if(financialSyncMinutes>0){
  financialSyncTimer=setInterval(()=>{void fetch(`http://127.0.0.1:${port}/internal/v1/financial-center/sync-all`,{method:'POST',headers:{authorization:`Bearer ${process.env.ANPARDAZ_INTERNAL_TOKEN??''}`}}).then(async r=>{if(!r.ok)app.log.warn({status:r.status},'financial center scheduled sync failed');}).catch(error=>app.log.warn({error},'financial center scheduled sync unavailable'));},financialSyncMinutes*60_000);
  financialSyncTimer.unref();
}
app.get('/api/v1/auth/me',{preHandler:requireAuth},async(request)=>{const a=(request as typeof request&{auth:any}).auth,c=await ensureCustomer(pool,a),x=await pool.query('SELECT id,identity_id,external_user_id,email,status FROM customers WHERE id=$1',[c]);return x.rows[0]?{user:x.rows[0]}:{error:'user_not_found'};});}
const shutdown=async()=>{if(financialSyncTimer)clearInterval(financialSyncTimer);await app.close();await pool?.end()};process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);await app.listen({host:'0.0.0.0',port});
