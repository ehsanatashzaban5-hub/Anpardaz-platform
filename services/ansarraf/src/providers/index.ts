import {WallexAdapter} from './wallex.js';
import type {LiquidityProviderAdapter} from './types.js';

const bool=(v:string|undefined)=>v==='true';

export function createProviderRegistry(){
  const registry=new Map<string,LiquidityProviderAdapter>();
  const code=(process.env.LIQUIDITY_PROVIDER_CODE??'WALLEX').toUpperCase();
  const executionEnabled=bool(process.env.LIQUIDITY_PROVIDER_EXECUTION_ENABLED);
  if(code==='WALLEX' && executionEnabled){
    const key=process.env.WALLEX_API_KEY;
    const baseUrl=process.env.WALLEX_API_BASE_URL??'https://api.wallex.ir';
    if(key && !key.includes('CHANGE_ME') && !key.includes('local-secret-not-for-git')){
      registry.set('WALLEX',new WallexAdapter({
        baseUrl,
        apiKey:key,
        timeoutMs:Number(process.env.PROVIDER_HTTP_TIMEOUT_MS??10000)
      }));
    }
  }
  return {
    executionEnabled,
    get(providerCode:string){return registry.get(providerCode.toUpperCase())??null;},
    codes(){return [...registry.keys()]}
  };
}
