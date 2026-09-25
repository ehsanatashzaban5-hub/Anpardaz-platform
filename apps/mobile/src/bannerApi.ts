const BASE=((import.meta as any).env?.VITE_BANNER_API_URL as string|undefined)?.replace(/\/$/,"")??"";
function token(){return localStorage.getItem("anpardaz:accessToken")??localStorage.getItem("accessToken")??"";}
async function call(path:string,init:RequestInit={}){const t=token();if(!t)throw new Error("banner_auth_required");const r=await fetch(BASE+path,{...init,headers:{"content-type":"application/json",authorization:"Bearer "+t,...(init.headers??{})},cache:"no-store"});const body=await r.json().catch(()=>({}));if(!r.ok)throw new Error(String(body?.error??"banner_request_failed"));return body;}
export type BannerApiListing={id:number;identity_id:string;category_id:number;category_name:string;title:string;description:string;price:number|null;currency:string;condition:string;city:string;status:string;views:number;created_at:string;updated_at:string;media_ids:number[]};
export const bannerApi={
  async listings(q:Record<string,string|number|undefined>={}){const s=new URLSearchParams();for(const[k,v]of Object.entries(q))if(v!==undefined&&v!=="")s.set(k,String(v));return call("/api/v1/banner/listings?"+s.toString()) as Promise<{listings:BannerApiListing[];total:number}>;},
  async categories(){return call("/api/v1/banner/categories") as Promise<{categories:any[]}>;},
  async me(){return call("/api/v1/banner/me");},
  async myListings(){return call("/api/v1/banner/me/listings") as Promise<{listings:BannerApiListing[]}>;},
  async favorites(){return call("/api/v1/banner/me/favorites") as Promise<{listings:BannerApiListing[]}>;},
  async favorite(id:string){return call("/api/v1/banner/listings/"+encodeURIComponent(id)+"/favorite",{method:"POST"});},
  async createListing(body:any){return call("/api/v1/banner/listings",{method:"POST",body:JSON.stringify(body)});},
  async updateListing(id:string,body:any){return call("/api/v1/banner/listings/"+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify(body)});},
  async deleteListing(id:string){return call("/api/v1/banner/listings/"+encodeURIComponent(id),{method:"DELETE"});},
  async uploadMedia(id:string,file:File){const data=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(",")[1]??"");r.onerror=()=>reject(r.error);r.readAsDataURL(file);});return call("/api/v1/banner/listings/"+encodeURIComponent(id)+"/media",{method:"POST",body:JSON.stringify({mimeType:file.type,filename:file.name,dataBase64:data})});},
  async conversations(){return call("/api/v1/banner/me/conversations") as Promise<{conversations:any[]}>;},
  async conversation(id:string){return call("/api/v1/banner/conversations/"+encodeURIComponent(id));},
  async createConversation(listingId:string,message:string){return call("/api/v1/banner/conversations",{method:"POST",body:JSON.stringify({listingId:Number(listingId),message})});},
  async sendMessage(id:string,payload:{message?:string;type?:string;mediaBase64?:string;mediaMime?:string;offerAmount?:number}){return call("/api/v1/banner/conversations/"+encodeURIComponent(id)+"/messages",{method:"POST",body:JSON.stringify(payload)});},
  async notifications(){return call("/api/v1/banner/me/notifications") as Promise<{notifications:any[]}>;},
  async readNotification(id:string){return call("/api/v1/banner/notifications/"+encodeURIComponent(id)+"/read",{method:"PATCH",body:"{}"});},
  async readAllNotifications(){return call("/api/v1/banner/notifications/read-all",{method:"POST",body:"{}"});},
  async tickets(){return call("/api/v1/banner/me/tickets") as Promise<{tickets:any[]}>;},
  async ticket(id:string){return call("/api/v1/banner/tickets/"+encodeURIComponent(id));},
  async createTicket(subject:string,message:string,category="general"){return call("/api/v1/banner/tickets",{method:"POST",body:JSON.stringify({subject,message,category})});},
  async replyTicket(id:string,message:string){return call("/api/v1/banner/tickets/"+encodeURIComponent(id)+"/reply",{method:"POST",body:JSON.stringify({message})});},
  async profile(){return call("/api/v1/banner/me");},
  async updateProfile(body:any){return call("/api/v1/banner/me",{method:"PATCH",body:JSON.stringify(body)});},
};
export function bannerMediaUrl(id:number|string){return BASE+"/api/v1/banner/media/"+encodeURIComponent(String(id));}
export function bannerMessageMediaUrl(id:number|string){return BASE+"/api/v1/banner/messages/"+encodeURIComponent(String(id))+"/media";}
