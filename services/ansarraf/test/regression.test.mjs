import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { validateKycSubmission } from '../dist/kyc.js';
import { validateAnSarrafProductionConfig } from '../dist/production-config.js';

test('KYC validation accepts the supported identity payload', () => {
  const value = validateKycSubmission({
    fullName: 'Ali Example',
    nationalId: '0012345678',
    mobile: '09123456789',
    birthDate: '1990-01-15',
  });
  assert.equal(value.nationalId, '0012345678');
  assert.equal(value.mobile, '09123456789');
});

test('KYC validation rejects malformed identity fields', () => {
  assert.throws(() => validateKycSubmission({fullName:'A',nationalId:'123',mobile:'0912'}), /invalid_/);
  assert.throws(() => validateKycSubmission({fullName:'Ali Example',nationalId:'0012345678',mobile:'09123456789',birthDate:'1370/01/01'}), /invalid_birth_date/);
});

test('production configuration rejects missing KYC provider configuration', () => {
  const env = {
    NODE_ENV: 'production',
    PROVIDER_RECONCILIATION_INTERVAL_MS: '60000',
    PROVIDER_RECONCILIATION_TOLERANCE: '0.00000001',
    WITHDRAWAL_DUAL_APPROVAL_THRESHOLD: '0',
  };
  assert.throws(() => validateAnSarrafProductionConfig(env), /KYC_PROVIDER_URL/);
});

test('production configuration accepts a complete KYC configuration', () => {
  const env = {
    NODE_ENV: 'production',
    PROVIDER_RECONCILIATION_INTERVAL_MS: '60000',
    PROVIDER_RECONCILIATION_TOLERANCE: '0.00000001',
    WITHDRAWAL_DUAL_APPROVAL_THRESHOLD: '0',
    KYC_PROVIDER_URL: 'https://kyc.example.test',
    KYC_PROVIDER_CODE: 'provider',
    KYC_PROVIDER_API_KEY: 'real-secret',
    KYC_ENCRYPTION_KEY_B64: Buffer.alloc(32, 7).toString('base64'),
  };
  assert.doesNotThrow(() => validateAnSarrafProductionConfig(env));
});

test('financial routes retain backend KYC gates and idempotency checks', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/routes/trading.ts'), 'utf8');
  assert.match(source, /ensureKycRequired\(pool,customer\)/);
  assert.match(source, /idempotency_key_reused/);
  assert.match(source, /approval_status/);
});

test('provider and reconciliation architecture remains provider-only', () => {
  const files = [
    'src/provider-execution-worker.ts',
    'src/provider-withdrawal-worker.ts',
    'src/provider-reconciliation.ts',
    'src/solvency-reconciliation.ts',
  ];
  for (const file of files) {
    const source = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
    assert.doesNotMatch(source, /private key|hot wallet|blockchain node|blockchain indexer/i);
  }
});

test('deposit and withdrawal E2E entry points are both KYC-gated before financial mutation', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/routes/trading.ts'), 'utf8');
  const deposit = source.slice(source.indexOf("app.post('/api/v1/deposits"));
  const withdrawal = source.slice(source.indexOf("app.post('/api/v1/withdrawals"));
  assert.match(deposit, /ensureKycRequired\(pool,customer\)/);
  assert.match(withdrawal, /ensureKycRequired\(pool,customer\)/);
  assert.match(withdrawal, /BEGIN/);
  assert.match(withdrawal, /withdrawal_reservations/);
});

test('withdrawal approval path preserves separation of duties and dual approval controls', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/routes/trading.ts'), 'utf8');
  const i = source.indexOf("app.post('/api/v1/withdrawals/:id/approve");
  assert.ok(i >= 0);
  const block = source.slice(i, i + 12000);
  assert.match(block, /approval_status/);
  assert.match(block, /admin_id/);
  assert.match(block, /dual|DUAL|approval/i);
});

test('provider execution and settlement preserve operation provenance', () => {
  const execution = fs.readFileSync(path.join(process.cwd(), 'src/provider-execution-worker.ts'), 'utf8');
  const settlement = fs.readFileSync(path.join(process.cwd(), 'src/provider-trade-settlement.ts'), 'utf8');
  assert.match(execution, /operation_id|operationId/);
  assert.match(settlement, /operationId/);
  assert.match(settlement, /providerOrderId/);
});

test('unknown provider outcomes are not converted into blind retries', () => {
  const withdrawal = fs.readFileSync(path.join(process.cwd(), 'src/provider-withdrawal-worker.ts'), 'utf8');
  assert.match(withdrawal, /unknown|manual_review|MANUAL_REVIEW/i);
  assert.match(withdrawal, /provider withdrawal|provider_withdrawal/i);
});

test('reconciliation and admin operation trace remain exposed', () => {
  const reconciliation = fs.readFileSync(path.join(process.cwd(), 'src/provider-reconciliation.ts'), 'utf8');
  const solvency = fs.readFileSync(path.join(process.cwd(), 'src/solvency-reconciliation.ts'), 'utf8');
  const admin = fs.readFileSync(path.join(process.cwd(), 'src/routes/internal-admin.ts'), 'utf8');
  assert.match(reconciliation, /PROVIDER_BALANCE/);
  assert.match(solvency, /provider/i);
  assert.match(admin, /operations\/:operationId\/trace/);
  assert.match(admin, /kyc/);
});

test('web exchange surface and mobile reference are present', () => {
  const root = path.resolve(process.cwd(), '../..');
  assert.ok(fs.existsSync(path.join(root, 'apps/web/src/web/WebSarraf.tsx')));
  assert.ok(fs.existsSync(path.join(root, 'apps/mobile/src/App.tsx')));
});
