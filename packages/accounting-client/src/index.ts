export type LedgerEntry={accountId:number;direction:'debit'|'credit';amount:string;currency:string;metadata?:Record<string,unknown>};
export type LedgerTransaction={referenceType:string;referenceId:string;operationId?:string;idempotencyKey:string;description?:string;entries:LedgerEntry[]};
export class AccountingClient{
 constructor(private readonly baseUrl:string,private readonly token:string){this.baseUrl=baseUrl.replace(/\/$/,'');}
 async postTransaction(input:LedgerTransaction){if(input.entries.length<2)throw new Error('ledger_requires_at_least_two_entries');const r=await fetch(`${this.baseUrl}/internal/v1/ledger/transactions`,{method:'POST',headers:{authorization:`Bearer ${this.token}`,'content-type':'application/json'},body:JSON.stringify(input)});const data=await r.json() as any;if(!r.ok)throw new Error(data?.error??`accounting_http_${r.status}`);return data as {transaction:{id:string;transaction_uuid:string;status:string};idempotent:boolean};}
}
