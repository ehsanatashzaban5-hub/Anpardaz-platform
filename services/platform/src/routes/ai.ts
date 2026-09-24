import type {FastifyInstance,FastifyRequest} from 'fastify';
import type {Pool} from 'pg';
import {requireAuth,type AuthClaims} from '../auth.js';
import {hasPermission} from '../permissions.js';
import {AiGateway} from '../services/ai-gateway.js';

type R=FastifyRequest&{auth:AuthClaims};const r=(x:FastifyRequest)=>x as R;const deny=(reply:any)=>reply.code(403).send({error:'forbidden'});
const idem=(v:unknown)=>typeof v==='string'&&v.trim().length>=8&&v.trim().length<=200;
export function registerAiRoutes(app:FastifyInstance,pool:Pool){const gateway=new AiGateway(pool);
 app.get('/api/v1/ai/models',{preHandler:requireAuth},async(req,reply)=>{
  const a=r(req);if(!(await hasPermission(pool,a.auth,'ai.execute')))return deny(reply);
  const catalog:any[]=[
    {id:'gpt-5.6-luna',name:'GPT-5.6 Luna',providerId:'openai',provider:'OpenAI',descFa:'مدل سریع و کم‌هزینه برای استفاده روزمره و حجم بالا',capabilities:['fast','writing','coding','reasoning'],contextWindow:'1.05M',isAvailable:true},
    {id:'gpt-5.6-terra',name:'GPT-5.6 Terra',providerId:'openai',provider:'OpenAI',descFa:'تعادل هوش و هزینه برای کارهای حرفه‌ای',capabilities:['reasoning','coding','vision'],contextWindow:'1.05M',isAvailable:true},
    {id:'gpt-5.6-sol',name:'GPT-5.6 Sol',providerId:'openai',provider:'OpenAI',descFa:'مدل پرچم‌دار برای استدلال و کدنویسی پیچیده',capabilities:['reasoning','coding','vision'],contextWindow:'1.05M',badge:'pro',isAvailable:true},
    {id:'gemini-3.8-flash',name:'Gemini 3.8 Flash',providerId:'gemini',provider:'Google',descFa:'مدل سریع چندمدالی برای کارهای روزمره و عامل‌های هوشمند',capabilities:['fast','vision','coding','reasoning'],contextWindow:'1M',isAvailable:true},
    {id:'gemini-3.7-flash',name:'Gemini 3.7 Flash',providerId:'gemini',provider:'Google',descFa:'نسل قبلی فلش برای کدنویسی و کارهای چندمرحله‌ای',capabilities:['fast','coding','reasoning'],contextWindow:'1M',isAvailable:true},
    {id:'gemini-3.1-pro',name:'Gemini 3.1 Pro',providerId:'gemini',provider:'Google',descFa:'استدلال پیشرفته برای حل مسئله و عامل‌ها',capabilities:['reasoning','vision','coding'],contextWindow:'1M',badge:'pro',isAvailable:true},
    {id:'claude-sonnet-5',name:'Claude Sonnet 5',providerId:'anthropic',provider:'Anthropic',descFa:'تعادل هوش و سرعت برای بیشتر کارهای تولیدی',capabilities:['reasoning','coding','writing','vision'],contextWindow:'1M',isAvailable:true},
    {id:'claude-opus-5',name:'Claude Opus 5',providerId:'anthropic',provider:'Anthropic',descFa:'استدلال عمیق برای تحلیل و کدنویسی پیچیده',capabilities:['reasoning','coding','writing','vision'],contextWindow:'1M',badge:'pro',isAvailable:true},
    {id:'claude-haiku-4-5',name:'Claude Haiku 4.5',providerId:'anthropic',provider:'Anthropic',descFa:'سریع و مناسب پردازش پرتعداد',capabilities:['fast','writing','translation'],contextWindow:'200K',isAvailable:true},
    {id:'grok-4.7',name:'Grok 4.7',providerId:'xai',provider:'xAI',descFa:'مدل پرچم‌دار Grok برای کدنویسی و استدلال',capabilities:['reasoning','coding','vision'],contextWindow:'500K',badge:'pro',isAvailable:true}
  ];
  const configured=new Set<string>();
  for(const p of ['openai','gemini','anthropic','xai'])if(process.env[p==='openai'?'OPENAI_API_KEY':p==='gemini'?'GEMINI_API_KEY':p==='anthropic'?'ANTHROPIC_API_KEY':'XAI_API_KEY'])configured.add(p);
  const compatible=process.env.AI_COMPAT_MODELS_JSON;
  if(compatible){try{const parsed=JSON.parse(compatible);if(Array.isArray(parsed))for(const m of parsed)if(m?.id&&m?.providerId&&m?.provider)catalog.push({...m,source:'compatible'});}catch{}}
  return{models:catalog.filter(m=>configured.has(m.providerId)||m.source==='compatible'),configuredProviders:[...configured]};
});
 app.post('/api/v1/ai/execute',{preHandler:requireAuth},async(req,reply)=>{const a=r(req);if(!(await hasPermission(pool,a.auth,'ai.execute')))return deny(reply);const b=(req.body??{}) as any;const header=req.headers['idempotency-key'];const idempotencyKey=Array.isArray(header)?header[0]:header;if(typeof b.workflowCode!=='string'||b.workflowCode.length<2||b.workflowCode.length>100||typeof b.input!=='string'||!b.input.trim()||((b.modelId!==undefined)&& (typeof b.modelId!=='string'||b.modelId.length>150))||b.input.length>20000||(idempotencyKey!==undefined&&!idem(idempotencyKey)))return reply.code(400).send({error:'invalid_ai_request'});try{const result=await gateway.execute({workflowCode:b.workflowCode,input:b.input,modelId:typeof b.modelId==='string'?b.modelId.trim():undefined,requesterIdentityId:a.auth.sub,sourceType:b.sourceType,sourceId:b.sourceId,idempotencyKey:typeof idempotencyKey==='string'?idempotencyKey.trim():undefined});return{result};}catch(e){requestLog(req,e);if(e instanceof Error&&e.message==='AI_IDEMPOTENCY_KEY_REUSED')return reply.code(409).send({error:'idempotency_key_reused'});if(e instanceof Error&&e.message==='AI_EXECUTION_IN_PROGRESS')return reply.code(409).send({error:'ai_execution_in_progress'});return reply.code(502).send({error:'ai_provider_failure'});}});
 app.get('/api/v1/ai/runs',{preHandler:requireAuth},async(req,reply)=>{const a=r(req);if(!(await hasPermission(pool,a.auth,'ai.runs.read')))return deny(reply);const q=await pool.query('SELECT r.id,w.code workflow,p.name provider,r.status,r.model,r.input_tokens,r.output_tokens,r.cost,r.error_code,r.error_message,r.started_at,r.completed_at,r.created_at FROM ai_execution_runs r LEFT JOIN ai_workflows w ON w.id=r.workflow_id LEFT JOIN ai_providers p ON p.id=r.provider_id ORDER BY r.created_at DESC LIMIT 200');return{runs:q.rows};});
}
function requestLog(req:FastifyRequest,e:unknown){req.log.error(e,'ai_execution_failed');}
