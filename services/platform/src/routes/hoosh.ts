import type {FastifyInstance,FastifyRequest} from 'fastify';
import type {Pool} from 'pg';
import {requireAuth,type AuthClaims} from '../auth.js';

type R=FastifyRequest&{auth:AuthClaims};
const req=(x:FastifyRequest)=>x as R;
const MAX_MESSAGE=20000;

export function registerHooshRoutes(app:FastifyInstance,pool:Pool){
  app.get('/api/v1/hoosh/conversations',{preHandler:requireAuth},async(request)=>{
    const a=req(request);
    const q=await pool.query(
      'SELECT id,title,model,mode,status,created_at,updated_at FROM hoosh_conversations WHERE identity_id=$1 ORDER BY updated_at DESC LIMIT 100',
      [a.auth.sub]
    );
    return {conversations:q.rows};
  });

  app.post('/api/v1/hoosh/conversations',{preHandler:requireAuth},async(request,reply)=>{
    const a=req(request); const b=(request.body??{}) as any;
    const title=typeof b.title==='string'&&b.title.trim()?b.title.trim().slice(0,200):'مکالمه جدید';
    const model=typeof b.model==='string'&&b.model.trim()?b.model.trim().slice(0,120):null;
    const mode=typeof b.mode==='string'&&b.mode.trim()?b.mode.trim().slice(0,60):'chat';
    const q=await pool.query(
      'INSERT INTO hoosh_conversations(identity_id,title,model,mode) VALUES($1,$2,$3,$4) RETURNING id,title,model,mode,status,created_at,updated_at',
      [a.auth.sub,title,model,mode]
    );
    return reply.code(201).send({conversation:q.rows[0]});
  });

  app.get('/api/v1/hoosh/conversations/:id',{preHandler:requireAuth},async(request,reply)=>{
    const a=req(request); const id=Number((request.params as any).id);
    if(!Number.isSafeInteger(id)||id<1)return reply.code(400).send({error:'invalid_conversation_id'});
    const q=await pool.query(
      'SELECT id,title,model,mode,status,created_at,updated_at FROM hoosh_conversations WHERE id=$1 AND identity_id=$2',
      [id,a.auth.sub]
    );
    if(!q.rows[0])return reply.code(404).send({error:'conversation_not_found'});
    const m=await pool.query(
      'SELECT id,role,content,metadata,created_at FROM hoosh_messages WHERE conversation_id=$1 ORDER BY created_at ASC,id ASC',
      [id]
    );
    return {conversation:q.rows[0],messages:m.rows};
  });

  app.post('/api/v1/hoosh/conversations/:id/messages',{preHandler:requireAuth},async(request,reply)=>{
    const a=req(request); const id=Number((request.params as any).id); const b=(request.body??{}) as any;
    const text=typeof b.content==='string'?b.content.trim():'';
    if(!Number.isSafeInteger(id)||id<1||!text||text.length>MAX_MESSAGE)return reply.code(400).send({error:'invalid_message'});
    const mode=typeof b.mode==='string'&&b.mode.trim()?b.mode.trim().slice(0,60):'chat';
    const model=typeof b.model==='string'&&b.model.trim()?b.model.trim().slice(0,120):null;
    const idemHeader=request.headers['idempotency-key'];
    const idem=typeof idemHeader==='string'?idemHeader.trim():Array.isArray(idemHeader)?idemHeader[0]?.trim():undefined;
    if(idem&& (idem.length<8||idem.length>200))return reply.code(400).send({error:'invalid_idempotency_key'});
    const c=await pool.connect();
    try{
      await c.query('BEGIN');
      const conv=await c.query(
        'SELECT id,status,model,mode FROM hoosh_conversations WHERE id=$1 AND identity_id=$2 FOR UPDATE',
        [id,a.auth.sub]
      );
      if(!conv.rows[0]){await c.query('ROLLBACK');return reply.code(404).send({error:'conversation_not_found'});}
      if(conv.rows[0].status!=='active'){await c.query('ROLLBACK');return reply.code(409).send({error:'conversation_not_active'});}
      if(idem){
        const existing=await c.query(
          'SELECT id,status,conversation_id FROM hoosh_requests WHERE idempotency_key=$1',
          [idem]
        );
        if(existing.rows[0]){
          if(Number(existing.rows[0].conversation_id)!==id){await c.query('ROLLBACK');return reply.code(409).send({error:'idempotency_key_reused'});}
          await c.query('COMMIT');
          return {request:{id:existing.rows[0].id,status:existing.rows[0].status,conversationId:id}};
        }
      }
      const msg=await c.query(
        'INSERT INTO hoosh_messages(conversation_id,role,content,metadata) VALUES($1,\'user\',$2,$3) RETURNING id,role,content,metadata,created_at',
        [id,text,JSON.stringify({mode})]
      );
      const rq=await c.query(
        'INSERT INTO hoosh_requests(identity_id,conversation_id,request_text,status,requested_model,model,mode,idempotency_key,attempt_count) VALUES($1,$2,$3,\'queued\',$4,$4,$5,$6,0) RETURNING id,status,created_at',
        [a.auth.sub,id,text,model,mode,idem??null]
      );
      await c.query(
        'UPDATE hoosh_conversations SET model=COALESCE($1,model),mode=$2,updated_at=NOW(),title=CASE WHEN title IS NULL OR title=\'\' OR title=\'مکالمه جدید\' THEN LEFT($3,80) ELSE title END WHERE id=$4',
        [model,mode,text,id]
      );
      await c.query('COMMIT');
      return reply.code(202).send({request:{id:rq.rows[0].id,status:rq.rows[0].status,createdAt:rq.rows[0].created_at},message:msg.rows[0]});
    }catch(e:any){
      await c.query('ROLLBACK').catch(()=>{});
      if(e?.code==='23505'&&idem)return reply.code(409).send({error:'idempotency_key_reused'});
      throw e;
    }finally{c.release();}
  });

  app.delete('/api/v1/hoosh/conversations/:id',{preHandler:requireAuth},async(request,reply)=>{
    const a=req(request); const id=Number((request.params as any).id);
    const q=await pool.query('UPDATE hoosh_conversations SET status=\'archived\',updated_at=NOW() WHERE id=$1 AND identity_id=$2 RETURNING id,status',[id,a.auth.sub]);
    if(!q.rows[0])return reply.code(404).send({error:'conversation_not_found'});
    return {conversation:q.rows[0]};
  });

  app.get('/api/v1/hoosh/projects',{preHandler:requireAuth},async(request)=>{\n    const a=req(request);\n    const q=await pool.query('SELECT id,title,description,model,mode,metadata,status,created_at,updated_at FROM hoosh_projects WHERE identity_id=$1 AND status=\'active\' ORDER BY updated_at DESC LIMIT 100',[a.auth.sub]);\n    return {projects:q.rows};\n  });\n\n  app.post('/api/v1/hoosh/projects',{preHandler:requireAuth},async(request,reply)=>{\n    const a=req(request); const b=(request.body??{}) as any;\n    const title=typeof b.title==='string'&&b.title.trim()?b.title.trim().slice(0,200):'';\n    if(!title)return reply.code(400).send({error:'invalid_project_title'});\n    const description=typeof b.description==='string'?b.description.trim().slice(0,2000):null;\n    const model=typeof b.model==='string'&&b.model.trim()?b.model.trim().slice(0,120):null;\n    const mode=typeof b.mode==='string'&&b.mode.trim()?b.mode.trim().slice(0,60):'chat';\n    const q=await pool.query('INSERT INTO hoosh_projects(identity_id,title,description,model,mode,metadata) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,title,description,model,mode,metadata,status,created_at,updated_at',[a.auth.sub,title,description,model,mode,JSON.stringify({})]);\n    return reply.code(201).send({project:q.rows[0]});\n  });\n\n  app.get('/api/v1/hoosh/projects/:id',{preHandler:requireAuth},async(request,reply)=>{\n    const a=req(request); const id=Number((request.params as any).id);\n    if(!Number.isSafeInteger(id)||id<1)return reply.code(400).send({error:'invalid_project_id'});\n    const q=await pool.query('SELECT id,title,description,model,mode,metadata,status,created_at,updated_at FROM hoosh_projects WHERE id=$1 AND identity_id=$2',[id,a.auth.sub]);\n    if(!q.rows[0])return reply.code(404).send({error:'project_not_found'});\n    const c=await pool.query('SELECT c.id,c.title,c.model,c.mode,c.status,c.created_at,c.updated_at FROM hoosh_project_conversations pc JOIN hoosh_conversations c ON c.id=pc.conversation_id WHERE pc.project_id=$1 ORDER BY c.updated_at DESC',[id]);\n    return {project:q.rows[0],conversations:c.rows};\n  });\n\n  app.post('/api/v1/hoosh/projects/:id/conversations/:conversationId',{preHandler:requireAuth},async(request,reply)=>{\n    const a=req(request); const projectId=Number((request.params as any).id); const conversationId=Number((request.params as any).conversationId);\n    if(!Number.isSafeInteger(projectId)||!Number.isSafeInteger(conversationId)||projectId<1||conversationId<1)return reply.code(400).send({error:'invalid_reference'});\n    const q=await pool.query('SELECT p.id FROM hoosh_projects p JOIN hoosh_conversations c ON c.identity_id=p.identity_id WHERE p.id=$1 AND p.identity_id=$2 AND c.id=$3 AND c.identity_id=$2',[projectId,a.auth.sub,conversationId]);\n    if(!q.rows[0])return reply.code(404).send({error:'project_or_conversation_not_found'});\n    await pool.query('INSERT INTO hoosh_project_conversations(project_id,conversation_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[projectId,conversationId]);\n    await pool.query('UPDATE hoosh_projects SET updated_at=NOW() WHERE id=$1',[projectId]);\n    return {ok:true};\n  });\n\n  app.delete('/api/v1/hoosh/projects/:id',{preHandler:requireAuth},async(request,reply)=>{\n    const a=req(request); const id=Number((request.params as any).id);\n    const q=await pool.query('UPDATE hoosh_projects SET status=\'archived\',updated_at=NOW() WHERE id=$1 AND identity_id=$2 RETURNING id,status',[id,a.auth.sub]);\n    if(!q.rows[0])return reply.code(404).send({error:'project_not_found'});\n    return {project:q.rows[0]};\n  });\n\n  app.get('/api/v1/hoosh/models',{preHandler:requireAuth},async()=>{
    const q=await pool.query('SELECT name,provider_type,base_url,model_policy FROM ai_providers WHERE enabled=true ORDER BY priority ASC,name ASC');
    return {providers:q.rows.map((x:any)=>({id:x.name,type:x.provider_type,baseUrl:x.base_url,modelPolicy:x.model_policy??{}}))};
  });

  app.get('/api/v1/hoosh/settings',{preHandler:requireAuth},async(request)=>{
    const a=req(request);
    const q=await pool.query('SELECT preferred_provider,preferred_model,temperature,max_output_tokens,language FROM hoosh_settings WHERE identity_id=$1',[a.auth.sub]);
    return {settings:q.rows[0]??{preferred_provider:null,preferred_model:null,temperature:0.7,max_output_tokens:4096,language:'fa'}};
  });

  app.put('/api/v1/hoosh/settings',{preHandler:requireAuth},async(request,reply)=>{
    const a=req(request); const b=(request.body??{}) as any;
    const temperature=Number(b.temperature??0.7), maxTokens=Number(b.maxOutputTokens??4096);
    if(!Number.isFinite(temperature)||temperature<0||temperature>2||!Number.isInteger(maxTokens)||maxTokens<256||maxTokens>32768)return reply.code(400).send({error:'invalid_settings'});
    const provider=typeof b.provider==='string'&&b.provider.trim()?b.provider.trim().slice(0,100):null;
    const model=typeof b.model==='string'&&b.model.trim()?b.model.trim().slice(0,120):null;
    const language=typeof b.language==='string'&&b.language.trim()?b.language.trim().slice(0,20):'fa';
    const q=await pool.query(
      'INSERT INTO hoosh_settings(identity_id,preferred_provider,preferred_model,temperature,max_output_tokens,language,updated_at) VALUES($1,$2,$3,$4,$5,$6,NOW()) ON CONFLICT(identity_id) DO UPDATE SET preferred_provider=EXCLUDED.preferred_provider,preferred_model=EXCLUDED.preferred_model,temperature=EXCLUDED.temperature,max_output_tokens=EXCLUDED.max_output_tokens,language=EXCLUDED.language,updated_at=NOW() RETURNING preferred_provider,preferred_model,temperature,max_output_tokens,language',
      [a.auth.sub,provider,model,temperature,maxTokens,language]
    );
    return {settings:q.rows[0]};
  });
}
