export type FinancialCard={id:number;last4:string;status:string;account_id:number;currency:string;audit_enabled:boolean;enabled_at?:string|null;disabled_at?:string|null};
export type FinancialTx={id:number;card_id:number;last4:string;direction:'income'|'expense'|'internal';amount:string;currency:string;description:string;category:string;occurred_at:string};
export type FinancialSnapshot={range:{start:string;end:string};transactions:FinancialTx[];summary:{direction:string;total:string}[];byCategory:{category:string;direction:string;total:string}[]};
const base=()=>((import.meta as any).env?.VITE_ANPARDAZ_API_URL as string|undefined)?.replace(/\/$/,'')??'';
async function req(path:string,init:RequestInit={}){const b=base();if(!b)throw new Error('anpardaz_api_unconfigured');const h=new Headers(init.headers);h.set('accept','application/json');const t=window.localStorage.getItem('anpardaz:accessToken')??'';if(t)h.set('authorization',`Bearer ${t}`);if(init.body&&!h.has('content-type'))h.set('content-type','application/json');const r=await fetch(b+path,{...init,headers:h,cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(String(d?.error??'financial_request_failed'));return d}
export const financialApi={
 cards:async():Promise<{cards:FinancialCard[]}>=>(await req('/api/v1/financial-center/cards')),
 access:async(cardId:number,enabled:boolean)=>req(`/api/v1/financial-center/cards/${cardId}/access`,{method:'PATCH',body:JSON.stringify({enabled})}),
 snapshot:async(start?:Date,end?:Date,cardIds?:number[]):Promise<FinancialSnapshot>=>req('/api/v1/financial-center?'+new URLSearchParams({...(start?{start:start.toISOString()}:{}) ,...(end?{end:end.toISOString()}:{}) ,...(cardIds?.length?{cardIds:cardIds.join(',')}:{})})),
 sync:async()=>req('/api/v1/financial-center/sync',{method:'POST'})
};