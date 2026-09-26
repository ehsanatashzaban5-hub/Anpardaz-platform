import {createHash} from 'node:crypto';
import type {Pool} from 'pg';
import {AiGateway} from './ai-gateway.js';

const strip=(s:string)=>s.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim();
const tag=(xml:string,name:string)=>{const m=xml.match(new RegExp('<(?:[\\w-]+:)?'+name+'[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?'+name+'>','i'));return m?strip(m[1]):''};
const items=(xml:string)=>Array.from(xml.matchAll(/<(item|entry)\\b[\\s\\S]*?<\\/(item|entry)>/gi)).map(m=>m[0]);
const itemField=(x:string,name:string)=>{const m=x.match(new RegExp('<(?:[\\w-]+:)?'+name+'[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?'+name+'>','i'));if(m)return strip(m[1]);const a=x.match(new RegExp('<(?:[\\w-]+:)?'+name+'[^>]*href=["']([^"']+)["']','i'));return a?.[1]??''};

export class ContentPipeline{
  private timer:NodeJS.Timeout|null=null;
  constructor(private readonly pool:Pool,private readonly ai:AiGateway){}
  start(){this.timer=setInterval(()=>void this.run().catch(()=>undefined),Number(process.env.CONTENT_PIPELINE_INTERVAL_MS??21600000));void this.run().catch(()=>undefined);}
  stop(){if(this.timer)clearInterval(this.timer);}
  async run(){
    const run=(await this.pool.query(`INSERT INTO content_pipeline_runs(run_date,status) VALUES(CURRENT_DATE,'running')
      ON CONFLICT(run_date) DO UPDATE SET status='running',started_at=NOW(),completed_at=NULL RETURNING id`)).rows[0];
    let fetched=0,selected=0,rewritten=0,published=0,failed=0;
    try{
      const sources=(await this.pool.query("SELECT * FROM content_sources WHERE enabled=true AND (last_fetched_at IS NULL OR last_fetched_at+make_interval(secs=>fetch_interval_seconds)<=NOW()) ORDER BY id")).rows;
      for(const source of sources){
        try{
          const response=await fetch(source.source_url,{headers:{accept:'application/rss+xml, application/atom+xml, application/xml, text/xml', 'user-agent':'AnPardaz-ContentBot/1.0'},signal:AbortSignal.timeout(15000)});
          if(!response.ok)throw new Error('SOURCE_HTTP_'+response.status);
          const xml=await response.text();
          for(const raw of items(xml).slice(0,50)){
            const title=itemField(raw,'title'),link=itemField(raw,'link')||itemField(raw,'guid'),description=itemField(raw,'description')||itemField(raw,'summary');
            if(!title||!link)continue;
            const hash=createHash('sha256').update(link+'|'+title).digest('hex');
            const ins=await this.pool.query(`INSERT INTO content_ingestion_items(source_id,external_id,source_url,source_title,raw_content,raw_payload,content_hash)
              VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(source_id,content_hash) DO NOTHING RETURNING id`,
              [source.id,link,link,title,description,JSON.stringify({source:source.name}),hash]);
            if(ins.rows[0])fetched++;
          }
          await this.pool.query('UPDATE content_sources SET last_fetched_at=NOW(),updated_at=NOW() WHERE id=$1',[source.id]);
        }catch{failed++}
      }
      const limitRows=await this.pool.query(`SELECT i.*,s.name AS source_name,s.category
        FROM content_ingestion_items i JOIN content_sources s ON s.id=i.source_id
        WHERE i.status='received' ORDER BY i.received_at DESC LIMIT 100`);
      for(const item of limitRows.rows){
        const policy=(await this.pool.query('SELECT * FROM content_publication_policies WHERE category_slug=$1',[item.category])).rows[0];
        const today=Number((await this.pool.query("SELECT COUNT(*)::int AS n FROM news_articles WHERE category_slug=$1 AND published_at>=CURRENT_DATE",[item.category])).rows[0].n);
        if(policy&&today>=policy.daily_limit){await this.pool.query("UPDATE content_ingestion_items SET status='rejected',error='daily_publication_limit' WHERE id=$1",[item.id]);continue;}
        selected++;
        await this.pool.query("UPDATE content_ingestion_items SET status='processing',processed_at=NOW() WHERE id=$1",[item.id]);
        try{
          const input=JSON.stringify({source:item.source_name,category:item.category,title:item.source_title,summary:item.raw_content,sourceUrl:item.source_url,instruction:'Create an original Persian article based only on the supplied facts. If the source is not Persian, translate the facts first, then rewrite naturally in Persian. Do not copy sentences. Return JSON: {title,summary,body,metaTitle,metaDescription,keywords,hashtags,score,language,originalLanguage}. Preserve attribution and uncertainty.'});
          const aiResult=await this.ai.execute({workflowCode:'news.rewrite',input,sourceType:'content_ingestion',sourceId:String(item.id),idempotencyKey:'content-rewrite:'+item.id});
          let out:any;try{out=JSON.parse(aiResult.text)}catch{throw new Error('AI_OUTPUT_NOT_JSON')}
          if(!out?.title||!out?.body||!Array.isArray(out.keywords)||!Array.isArray(out.hashtags))throw new Error('AI_OUTPUT_INVALID');
          const slug=String(out.title).toLowerCase().trim().replace(/[^\\p{L}\\p{N}]+/gu,'-').replace(/^-|-$/g,'').slice(0,180)+'-'+item.id;
          const pub=policy?.auto_publish===true&&!policy?.require_review;
          const article=(await this.pool.query(`INSERT INTO news_articles(title,slug,summary,body,status,published_at,category_slug,source_url,source_name,source_published_at,language,original_language,meta_title,meta_description,keywords,hashtags,canonical_url,editorial_score,human_reviewed)
            VALUES($1,$2,$3,$4,$5,CASE WHEN $5='published' THEN NOW() ELSE NULL END,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$7,$16,$17)
            RETURNING id`,
            [String(out.title).slice(0,500),slug,String(out.summary??'').slice(0,2000),String(out.body),pub?'published':'draft',item.category,item.source_url,item.source_name,null,String(out.language??'fa'),String(out.originalLanguage??'en'),String(out.metaTitle??out.title).slice(0,200),String(out.metaDescription??out.summary??'').slice(0,320),out.keywords.map(String).slice(0,30),out.hashtags.map(String).slice(0,30),Number(out.score??0),pub?false:false])).rows[0];
          await this.pool.query('INSERT INTO content_source_attributions(article_id,source_name,source_url,attribution_text) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',[article.id,item.source_name,item.source_url,'منبع: '+item.source_name]);
          await this.pool.query('UPDATE content_ingestion_items SET status=$2,article_id=$3,processed_at=NOW() WHERE id=$1',[item.id,pub?'published':'rewritten',article.id]);
          rewritten++;if(pub)published++;
        }catch(error){failed++;await this.pool.query("UPDATE content_ingestion_items SET status='failed',error=$2,processed_at=NOW() WHERE id=$1",[item.id,error instanceof Error?error.message:'AI_PIPELINE_FAILED']);}
      }
      await this.pool.query(`UPDATE content_pipeline_runs SET status='completed',fetched_count=$2,selected_count=$3,rewritten_count=$4,published_count=$5,failed_count=$6,completed_at=NOW() WHERE id=$1`,[run.id,fetched,selected,rewritten,published,failed]);
    }catch(error){await this.pool.query(`UPDATE content_pipeline_runs SET status='failed',fetched_count=$2,selected_count=$3,rewritten_count=$4,published_count=$5,failed_count=$6,metadata=$7,completed_at=NOW() WHERE id=$1`,[run.id,fetched,selected,rewritten,published,failed,JSON.stringify({error:error instanceof Error?error.message:'PIPELINE_FAILED'})]);throw error;}
    return {fetched,selected,rewritten,published,failed};
  }
}
