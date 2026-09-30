import {createCipheriv,createDecipheriv,randomBytes,randomUUID} from 'node:crypto';

type Json=Record<string,unknown>;

function required(name:string){
  const value=process.env[name]?.trim();
  if(!value) throw new Error(`${name}_not_configured`);
  return value;
}

function env(name:string,fallback?:string){
  const value=process.env[name]?.trim();
  return value||fallback||'';
}

function key(){
  const raw=required('FINNOTECH_TOKEN_ENCRYPTION_KEY_B64');
  const b=Buffer.from(raw,'base64');
  if(b.length!==32) throw new Error('FINNOTECH_TOKEN_ENCRYPTION_KEY_B64_must_be_32_bytes_base64');
  return b;
}

export function encryptSecret(value:string){
  const iv=randomBytes(12);
  const cipher=createCipheriv('aes-256-gcm',key(),iv);
  const ciphertext=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);
  const tag=cipher.getAuthTag();
  return [iv.toString('base64'),tag.toString('base64'),ciphertext.toString('base64')].join('.');
}

export function decryptSecret(value:string){
  const [ivB64,tagB64,dataB64]=value.split('.');
  if(!ivB64||!tagB64||!dataB64) throw new Error('invalid_encrypted_secret');
  const decipher=createDecipheriv('aes-256-gcm',key(),Buffer.from(ivB64,'base64'));
  decipher.setAuthTag(Buffer.from(tagB64,'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64,'base64')),decipher.final()]).toString('utf8');
}

export function oauthState(){
  return randomBytes(32).toString('base64url');
}

export class FinnotechClient {
  private readonly baseUrl:string;
  private readonly clientId:string;
  private readonly clientSecret:string;
  private readonly authorizeUrl:string;
  private readonly tokenUrl:string;
  private readonly timeoutMs:number;

  constructor(){
    this.baseUrl=env('FINNOTECH_API_BASE_URL','https://api.finnotech.ir').replace(/\/$/,'');
    this.clientId=required('FINNOTECH_CLIENT_ID');
    this.clientSecret=required('FINNOTECH_CLIENT_SECRET');
    this.authorizeUrl=required('FINNOTECH_AUTHORIZE_URL');
    this.tokenUrl=required('FINNOTECH_TOKEN_URL');
    this.timeoutMs=Number(env('FINNOTECH_REQUEST_TIMEOUT_MS','15000'));
  }

  authorizationUrl(state:string,redirectUri:string){
    const url=new URL(this.authorizeUrl);
    url.searchParams.set('response_type','code');
    url.searchParams.set('client_id',this.clientId);
    url.searchParams.set('redirect_uri',redirectUri);
    url.searchParams.set('state',state);
    const scope=env('FINNOTECH_SCOPE');
    if(scope)url.searchParams.set('scope',scope);
    return url.toString();
  }

  async exchangeCode(code:string,redirectUri:string){
    const auth=Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    return this.postAbsolute(this.tokenUrl,{
      grant_type:'authorization_code',code,redirect_uri:redirectUri
    },{'authorization':`Basic ${auth}`});
  }

  async refresh(refreshToken:string){
    const auth=Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    return this.postAbsolute(this.tokenUrl,{grant_type:'refresh_token',refresh_token:refreshToken},{'authorization':`Basic ${auth}`});
  }

  async call(path:string,accessToken:string,body?:Json,method:'GET'|'POST'='POST'){
    const url=new URL(path,this.baseUrl);
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),this.timeoutMs);
    try{
      const response=await fetch(url,{
        method,
        headers:{authorization:`Bearer ${accessToken}`,'content-type':'application/json','x-track-id':randomUUID()},
        ...(method==='GET'?{}:{body:JSON.stringify(body??{})}),
        signal:controller.signal,
      });
      const raw=await response.text();
      let data:Json={};
      try{data=raw?JSON.parse(raw) as Json:{}}catch{data={raw:raw.slice(0,1000)};}
      if(!response.ok)throw Object.assign(new Error(typeof data.message==='string'?data.message:`FINNOTECH_HTTP_${response.status}`),{code:`HTTP_${response.status}`,data});
      return data;
    }finally{clearTimeout(timer);}
  }

  private async postAbsolute(urlString:string,body:Json,extra:Record<string,string>={}){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),this.timeoutMs);
    try{
      const response=await fetch(urlString,{method:'POST',headers:{'content-type':'application/json',...extra},body:JSON.stringify(body),signal:controller.signal});
      const raw=await response.text();
      let data:Json={};
      try{data=raw?JSON.parse(raw) as Json:{}}catch{data={raw:raw.slice(0,1000)};}
      if(!response.ok)throw Object.assign(new Error(typeof data.message==='string'?data.message:`FINNOTECH_HTTP_${response.status}`),{code:`HTTP_${response.status}`,data});
      return data;
    }finally{clearTimeout(timer);}
  }
}
