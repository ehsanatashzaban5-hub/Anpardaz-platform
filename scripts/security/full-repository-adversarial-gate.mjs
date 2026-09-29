import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const checks=[
  ['An Pardaz Finnotech transfer route must not execute the provider directly',
    !read('services/anpardaz/src/routes/finnotech-banking.ts').includes("client.call(endpoint,access")],
  ['An Pardaz internal admin requires trusted identity and role',
    /x-admin-identity/.test(read('services/anpardaz/src/routes/internal-admin.ts')) &&
    /x-admin-role/.test(read('services/anpardaz/src/routes/internal-admin.ts'))],
  ['Banking provider worker quarantines uncertain provider outcomes',
    /PROVIDER_OPERATION_UNCERTAIN/.test(read('services/anpardaz/src/banking-provider-worker.ts'))],
  ['Fintech service worker quarantines non-terminal outcomes without reconciliation reference',
    /PROVIDER_OPERATION_UNCERTAIN/.test(read('services/anpardaz/src/fintech-service-worker.ts'))],
  ['Shaparak callback remains signature-verified and single-use',
    /verifyCallback\(q\)/.test(read('services/anpardaz/src/routes/card-registration.ts')) &&
    /status='processing'.*callback_attempts/.test(read('services/anpardaz/src/routes/card-registration.ts'))],
  ['Accounting internal transaction endpoint keeps idempotency hashing',
    /requestHash=createHash\('sha256'\)/.test(read('services/accounting/src/main.ts'))],
  ['Banner admin routes require internal authentication',
    /requireAdminInternal/.test(read('services/banner/src/main.ts'))],
];

const failures=checks.filter(([,ok])=>!ok).map(([name])=>name);
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log(`Full-repository adversarial regression gate passed (${checks.length} checks).`);
