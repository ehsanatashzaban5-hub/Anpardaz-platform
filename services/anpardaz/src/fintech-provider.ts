import {createHash} from 'node:crypto';

export type FintechServiceCode =
  | 'card_balance'
  | 'transfer'
  | 'mobile_charge'
  | 'internet_package'
  | 'bill_payment'
  | 'charity'
  | 'third_party_insurance'
  | 'body_insurance'
  | 'motorcycle_insurance'
  | 'vehicle_violations'
  | 'freeway_toll'
  | 'tehran_traffic'
  | 'sana'
  | 'judiciary_bill'
  | 'property_registration'
  | 'cashback';

export type FintechProviderRequest = {
  serviceCode: FintechServiceCode;
  operationId: string;
  payload: Record<string, unknown>;
};

export type FintechProviderResponse = {
  providerOperationId?: string;
  externalReference?: string;
  status: 'completed' | 'processing' | 'failed' | 'manual_review';
  data?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
};

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name}_not_configured`);
  return value;
}

function endpointFor(code: FintechServiceCode) {
  const configured = process.env.FINTECH_ENDPOINTS_JSON?.trim();
  if (configured) {
    try {
      const map = JSON.parse(configured) as Record<string, unknown>;
      const value = map[code];
      if (typeof value === 'string' && value.trim()) return value.trim();
    } catch {
      throw new Error('FINTECH_ENDPOINTS_JSON_invalid');
    }
  }
  return `/v1/services/${code}`;
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [k,v] of Object.entries(value as Record<string,unknown>)) {
    if (/password|otp|cvv|cardtoken|api.?key|secret|authorization/i.test(k)) out[k]='[REDACTED]';
    else out[k]=redact(v);
  }
  return out;
}

export function requestFingerprint(payload: Record<string, unknown>) {
  return createHash('sha256').update(JSON.stringify(redact(payload))).digest('hex');
}

export class FintechProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly keyHeader: string;
  private readonly authScheme: string;

  constructor() {
    this.baseUrl=required('FINTECH_API_BASE_URL').replace(/\/$/,'');
    this.apiKey=required('FINTECH_API_KEY');
    this.keyHeader=process.env.FINTECH_API_KEY_HEADER?.trim()||'x-api-key';
    this.authScheme=process.env.FINTECH_AUTH_SCHEME?.trim()||'';
  }

  async execute(input: FintechProviderRequest): Promise<FintechProviderResponse> {
    const headers: Record<string,string>={
      'content-type':'application/json',
      [this.keyHeader]:this.apiKey,
      'x-anpardaz-operation-id':input.operationId,
    };
    if (this.authScheme) headers.authorization=`${this.authScheme} ${this.apiKey}`;
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),Number(process.env.FINTECH_REQUEST_TIMEOUT_MS??15000));
    try {
      const response=await fetch(this.baseUrl+endpointFor(input.serviceCode),{
        method:'POST',headers,signal:controller.signal,
        body:JSON.stringify({operationId:input.operationId,...input.payload}),
      });
      const text=await response.text();
      let data: Record<string,unknown>={};
      try { data=text?JSON.parse(text) as Record<string,unknown>:{}; } catch { data={raw:text.slice(0,1000)}; }
      if (!response.ok) {
        return {
          status:response.status>=500||response.status===429?'manual_review':'failed',
          errorCode:typeof data.code==='string'?data.code:`HTTP_${response.status}`,
          errorMessage:typeof data.message==='string'?data.message:'fintech_provider_request_failed',
          data:redact(data) as Record<string,unknown>,
        };
      }
      const status=String(data.status??'processing').toLowerCase();
      const normalized=status==='completed'||status==='success'?'completed':status==='failed'||status==='error'?'failed':status==='manual_review'?'manual_review':'processing';
      return {
        status:normalized,
        providerOperationId:typeof data.providerOperationId==='string'?data.providerOperationId:typeof data.operationId==='string'?data.operationId:undefined,
        externalReference:typeof data.reference==='string'?data.reference:typeof data.externalReference==='string'?data.externalReference:undefined,
        data:redact(data) as Record<string,unknown>,
        errorCode:typeof data.code==='string'?data.code:undefined,
        errorMessage:typeof data.message==='string'?data.message:undefined,
      };
    } catch (e) {
      return {status:'manual_review',errorCode:'PROVIDER_UNAVAILABLE',errorMessage:e instanceof Error?e.message:'provider_unavailable'};
    } finally { clearTimeout(timeout); }
  }
}
