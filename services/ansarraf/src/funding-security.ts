import type {FastifyRequest} from 'fastify';
import type {Pool} from 'pg';

type AuthRequest=FastifyRequest&{auth:any};

async function verifyOwnedCard(identityId:string,cardId:number){
  const base=(process.env.ANPARDAZ_SERVICE_URL??'').replace(/\/$/,'');
  const token=process.env.ANPARDAZ_INTERNAL_TOKEN;
  if(!base||!token)throw new Error('anpardaz_card_verification_not_configured');
  const r=await fetch(base+'/internal/v1/admin/cards/lookup?identityId='+encodeURIComponent(identityId),{
    headers:{authorization:'Bearer '+token},signal:AbortSignal.timeout(Number(process.env.ANPARDAZ_HTTP_TIMEOUT_MS??5000))
  });
  const body=await r.json().catch(()=>({})) as any;
  if(!r.ok)throw new Error(String(body?.error??'anpardaz_card_verification_failed'));
  const card=(Array.isArray(body.cards)?body.cards:[]).find((x:any)=>Number(x.id)===cardId);
  if(!card||card.registration_status!=='verified'||card.status!=='active'||card.holder_identity_match!==true)
    throw new Error('owned_verified_anpardaz_card_required');
  return card;
}

export async function verifyFirstTomanDepositWindow(pool:Pool,customerId:string){
  const r=await pool.query(`SELECT MIN(d.created_at) AS first_toman_deposit_at
    FROM deposits d JOIN assets a ON a.id=d.asset_id
    WHERE d.customer_id=$1 AND d.status='confirmed' AND a.asset_type='fiat'`,[customerId]);
  const first=r.rows[0]?.first_toman_deposit_at;
  if(!first)return {allowed:true,firstTomanDepositAt:null,remainingSeconds:0};
  const elapsed=(Date.now()-new Date(first).getTime())/1000;
  const remaining=Math.max(0,24*60*60-elapsed);
  return {allowed:remaining<=0,firstTomanDepositAt:first,remainingSeconds:Math.ceil(remaining)};
}

export async function requireTomanWithdrawalSecurity(pool:Pool,request:FastifyRequest,customerId:string,assetId:number,cardId:number){
  const auth=(request as AuthRequest).auth;
  const asset=(await pool.query('SELECT id,symbol,asset_type FROM assets WHERE id=$1 AND status=\'active\' LIMIT 1',[assetId])).rows[0];
  if(!asset)throw new Error('asset_not_available');
  if(asset.asset_type==='fiat'){
    if(!Number.isSafeInteger(cardId)||cardId<=0)throw new Error('registered_destination_card_required');
    const card=await verifyOwnedCard(auth.sub,cardId);
    return {asset,card};
  }
  const window=await verifyFirstTomanDepositWindow(pool,customerId);
  if(!window.allowed)throw new Error('crypto_withdrawal_locked_24h');
  return {asset,card:null};
}
export async function getCryptoWithdrawalSecurity(pool:Pool,customerId:string){
  const customer=(await pool.query('SELECT status,security_hold_reason,security_hold_at FROM customers WHERE id=$1 LIMIT 1',[customerId])).rows[0];
  if(!customer)return {allowed:false,reason:'customer_not_found',message:'حساب کاربری پیدا نشد.'};
  if(customer.status==='blocked'&&customer.security_hold_reason==='RAPID_TOMAN_CRYPTO_CONVERSION'){
    const c=(await pool.query("SELECT id,created_at,reason_code,reason_message,metadata FROM funding_security_cases WHERE customer_id=$1 AND status='open' ORDER BY created_at DESC LIMIT 1",[customerId])).rows[0];
    return {allowed:false,reason:'security_hold',message:'به‌دلیل رفتار مشکوک در واریز تومان و تبدیل سریع به رمزارز، حساب شما موقتاً در حال بررسی مدیر است. تا تأیید مدیر، برداشت رمزارز و ادامه فعالیت حساب امکان‌پذیر نیست.',case:c??null};
  }
  const window=await verifyFirstTomanDepositWindow(pool,customerId);
  if(!window.allowed)return {allowed:false,reason:'first_toman_deposit_24h',message:'برداشت رمزارز تا ۲۴ ساعت پس از اولین واریز تومان برای امنیت حساب فعال نمی‌شود.',remainingSeconds:window.remainingSeconds,firstTomanDepositAt:window.firstTomanDepositAt};
  return {allowed:true,reason:null,message:null,remainingSeconds:0,firstTomanDepositAt:window.firstTomanDepositAt};
}

export async function requireCryptoWithdrawalSecurity(pool:Pool,customerId:string){
  const status=await getCryptoWithdrawalSecurity(pool,customerId);
  if(!status.allowed){const e=new Error(String(status.reason??'withdrawal_security_blocked'));(e as any).security=status;throw e;}
  return status;
}
