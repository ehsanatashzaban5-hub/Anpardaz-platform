import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root=process.cwd(),read=p=>readFileSync(resolve(root,p),'utf8'),failures=[];
const expect=(c,m)=>{if(!c)failures.push(m)};
const admin=read('services/admin/src/main.ts'),proxy=read('services/admin/src/proxy.ts'),adapters=read('services/admin/src/adapters/service-proxy.ts'),routes=read('services/admin/src/adapters/routes.ts'),banner=read('services/banner/src/main.ts');
const ac=read('infrastructure/production/admin.compose.yml'),as=read('infrastructure/production/ansarraf.compose.yml'),ap=read('infrastructure/production/anpardaz.compose.yml');
expect(admin.includes('ANSARRAF_INTERNAL_TOKEN')&&admin.includes('ANPARDAZ_INTERNAL_TOKEN')&&admin.includes('BANNER_INTERNAL_TOKEN')&&admin.includes('ACCOUNTING_INTERNAL_TOKEN'),'Admin production credential contract is incomplete');
expect(admin.includes("value.includes('CHANGE_ME')"),'Admin production secrets are not fail-closed');
expect(proxy.includes('x-admin-permission')&&proxy.includes('content.write'),'Admin permission/upload contract is incomplete');
expect(proxy.includes('multipart_not_supported_for_admin_path'),'Unexpected multipart requests are not rejected');
expect(adapters.includes("redirect:'error'"),'Owning-service proxy allows redirects');
expect(adapters.includes('x-admin-identity'),'Owning-service proxy does not bind trusted admin identity');
expect(routes.includes('permissionFor(request as AdminRequest)'),'Owning-service adapter does not authorize before proxying');
expect(banner.includes("x-admin-identity"),'Banner admin routes do not bind mutations to gateway identity');
expect(ac.includes('127.0.0.1:4006:4006'),'Admin production port is not loopback-bound');
expect(as.includes('127.0.0.1:4002:4002'),'An Sarraf production port is not loopback-bound');
expect(ap.includes('127.0.0.1:4001:4001'),'An Pardaz production port is not loopback-bound');
if(failures.length){console.error('ADMIN PRODUCTION GATE FAILED');for(const f of failures)console.error('- '+f);process.exit(1)}
console.log('ADMIN PRODUCTION GATE PASSED');
