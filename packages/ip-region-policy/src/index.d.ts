export type IpRegionDecision={allowed:boolean;countryCode:string|null;source:'trusted-proxy'|'geolocation-provider'|'private-network'|'unknown'};
export type RequestLike={ip:string;headers:Record<string,string|string[]|undefined>;log:{warn:(data:unknown,message:string)=>void}};
export type ReplyLike={code:(status:number)=>{send:(body:unknown)=>Promise<unknown>|unknown}};
export function iranIpDecision(request:RequestLike):Promise<IpRegionDecision>;
export function requireIranIp(request:RequestLike,reply:ReplyLike):Promise<boolean>;
export function requireIranIpInProduction(request:RequestLike,reply:ReplyLike):Promise<boolean|void>|void;