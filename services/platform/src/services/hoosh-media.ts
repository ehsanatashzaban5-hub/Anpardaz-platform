import type {Pool} from 'pg';

type MediaResult={mimeType:string;fileName:string;data:Buffer;textOutput?:string;metadata?:Record<string,unknown>};

const GEMINI_BASE='https://generativelanguage.googleapis.com/v1beta';
const key=()=>process.env.GEMINI_API_KEY;

async function jsonFetch(url:string, init:RequestInit={}){
  const k=key(); if(!k) throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
  const headers=new Headers(init.headers); headers.set('x-goog-api-key',k); headers.set('content-type','application/json');
  const r=await fetch(url,{...init,headers});
  const body=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(String(body?.error?.message??`GEMINI_HTTP_${r.status}`));
  return body;
}

async function rawFetch(url:string){
  const k=key(); if(!k) throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
  const r=await fetch(url,{headers:{'x-goog-api-key':k}});
  if(!r.ok) throw new Error(`GEMINI_MEDIA_DOWNLOAD_${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

async function music(model:string,prompt:string):Promise<MediaResult>{
  const d=await jsonFetch(`${GEMINI_BASE}/interactions`,{method:'POST',body:JSON.stringify({model,input:prompt,response_format:{type:'audio'}})});
  const audio=d?.output_audio?.data;
  if(!audio) throw new Error('GEMINI_MUSIC_EMPTY_OUTPUT');
  return {mimeType:'audio/mpeg',fileName:`hoosh-music-${Date.now()}.mp3`,data:Buffer.from(audio,'base64'),textOutput:d?.output_text??undefined,metadata:{provider:'gemini',model}};
}

async function voice(model:string,prompt:string):Promise<MediaResult>{
  const d=await jsonFetch(`${GEMINI_BASE}/interactions`,{method:'POST',body:JSON.stringify({
    model,
    input:[{type:'user_input',content:[{type:'text',text:prompt}]}],
    response_format:{type:'audio'},
    generation_config:{speech_config:[{voice:process.env.GEMINI_TTS_VOICE??'Kore'}]}
  })});
  const audio=d?.output_audio?.data;
  if(!audio) throw new Error('GEMINI_TTS_EMPTY_OUTPUT');
  return {mimeType:'audio/wav',fileName:`hoosh-voice-${Date.now()}.wav`,data:Buffer.from(audio,'base64'),metadata:{provider:'gemini',model}};
}

async function image(model:string,prompt:string,options:any):Promise<MediaResult>{
  const d=await jsonFetch(`${GEMINI_BASE}/interactions`,{method:'POST',body:JSON.stringify({
    model,input:prompt,response_format:{type:'image',mime_type:options?.mimeType??'image/png',aspect_ratio:options?.aspectRatio??'1:1',image_size:options?.imageSize??'1K'}
  })});
  const img=d?.output_image?.data;
  if(!img) throw new Error('GEMINI_IMAGE_EMPTY_OUTPUT');
  const mime=String(d?.output_image?.mime_type??options?.mimeType??'image/png');
  return {mimeType:mime,fileName:`hoosh-image-${Date.now()}.png`,data:Buffer.from(img,'base64'),textOutput:d?.output_text??undefined,metadata:{provider:'gemini',model}};
}

async function video(model:string,prompt:string,options:any):Promise<MediaResult>{
  const body:any={instances:[{prompt}],parameters:{numberOfVideos:1}};
  if(options?.aspectRatio) body.parameters.aspectRatio=options.aspectRatio;
  if(options?.resolution) body.parameters.resolution=options.resolution;
  const op=await jsonFetch(`${GEMINI_BASE}/models/${encodeURIComponent(model)}:predictLongRunning`,{method:'POST',body:JSON.stringify(body)});
  const name=String(op?.name??''); if(!name) throw new Error('GEMINI_VIDEO_OPERATION_MISSING');
  const deadline=Date.now()+Number(process.env.HOOSH_MEDIA_VIDEO_TIMEOUT_MS??900000);
  let state:any=op;
  while(Date.now()<deadline){
    await new Promise(r=>setTimeout(r,Number(process.env.HOOSH_MEDIA_POLL_MS??5000)));
    state=await jsonFetch(`${GEMINI_BASE}/${name}`);
    if(state?.done) break;
  }
  if(!state?.done) throw new Error('GEMINI_VIDEO_TIMEOUT');
  if(state?.error?.message) throw new Error(String(state.error.message));
  const uri=state?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
  if(!uri) throw new Error('GEMINI_VIDEO_EMPTY_OUTPUT');
  const data=await rawFetch(uri);
  return {mimeType:'video/mp4',fileName:`hoosh-video-${Date.now()}.mp4`,data,metadata:{provider:'gemini',model,operation:name}};
}

export async function generateHooshMedia(_pool:Pool,mode:string,model:string,prompt:string,options:any):Promise<MediaResult>{
  if(!key()) throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
  if(mode==='music') return music(model,prompt);
  if(mode==='voice') return voice(model,prompt);
  if(mode==='image') return image(model,prompt,options);
  if(mode==='video') return video(model,prompt,options);
  throw new Error('UNSUPPORTED_HOOSH_MEDIA_MODE');
}
