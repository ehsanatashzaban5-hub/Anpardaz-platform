import {WallexAdapter} from './wallex.js';
import type {LiquidityProviderAdapter} from './types.js';

export function createProviderRegistry(){
  const registry=new Map<string,LiquidityProviderAdapter>();
  const code=(process.env.LIQUIDITY_PROVIDER_CODE??'WALLEX').toUpperCase();
  if(code==='WALLEX'){
    const key=process.env.WALLEX_API_KEY;
    const baseUrl=process.env.WALLEX_API_BASE_URL??'https://api.wallex.ir';
    if(key)registry.set('WALLEX',new WallexAdapter({baseUrl,apiKey:key,timeoutMs:Number(process.env.PROVIDER_HTTP_TIMEOUT_MS??10000)}));
  }
  return {
    get(providerCode:string){return registry.get(providerCode.toUpperCase())??null;},
    codes(){return [...registry.keys()]}
  };
}
