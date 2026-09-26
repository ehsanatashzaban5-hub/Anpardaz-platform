const placeholder = (value: string) =>
  !value ||
  value.includes('CHANGE_ME') ||
  value.includes('generate-a-long-random-secret') ||
  value.includes('BASE64-DER');

export function validateAnSarrafProductionConfig(env: NodeJS.ProcessEnv) {
  if (env.NODE_ENV !== 'production') return;
  const executionEnabled = env.LIQUIDITY_PROVIDER_EXECUTION_ENABLED === 'true';
  const providerCode = env.LIQUIDITY_PROVIDER_CODE;
  const providerBaseUrl = env.WALLEX_API_BASE_URL;
  const providerApiKey = env.WALLEX_API_KEY;
  if (executionEnabled) {
    if (!providerCode) throw new Error('LIQUIDITY_PROVIDER_CODE is required when provider execution is enabled');
    if (placeholder(providerBaseUrl ?? '')) throw new Error('WALLEX_API_BASE_URL must be configured when provider execution is enabled');
    if (placeholder(providerApiKey ?? '')) throw new Error('WALLEX_API_KEY must be configured when provider execution is enabled');
  }
  const interval = Number(env.PROVIDER_RECONCILIATION_INTERVAL_MS ?? 60000);
  if (!Number.isSafeInteger(interval) || interval < 5000) throw new Error('PROVIDER_RECONCILIATION_INTERVAL_MS must be an integer >= 5000');
  const tolerance = env.PROVIDER_RECONCILIATION_TOLERANCE ?? '0.00000001';
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(tolerance)) throw new Error('PROVIDER_RECONCILIATION_TOLERANCE must be a positive decimal');
  const dual = Number(env.WITHDRAWAL_DUAL_APPROVAL_THRESHOLD ?? 0);
  if (!Number.isFinite(dual) || dual < 0) throw new Error('WITHDRAWAL_DUAL_APPROVAL_THRESHOLD must be >= 0');

  const kycProviderUrl=env.KYC_PROVIDER_URL;
  const kycProviderCode=env.KYC_PROVIDER_CODE;
  const kycProviderKey=env.KYC_PROVIDER_API_KEY;
  const manualKyc=env.KYC_MANUAL_REVIEW_ENABLED==='true';
  const kycKey=env.KYC_ENCRYPTION_KEY_B64;
  if (!manualKyc && placeholder(kycProviderUrl ?? '')) throw new Error('KYC_PROVIDER_URL must be configured in production unless manual KYC review is enabled');
  if (!manualKyc && !kycProviderCode) throw new Error('KYC_PROVIDER_CODE must be configured in production unless manual KYC review is enabled');
  if (!manualKyc && placeholder(kycProviderKey ?? '')) throw new Error('KYC_PROVIDER_API_KEY must be configured in production unless manual KYC review is enabled');
  if (!kycKey) throw new Error('KYC_ENCRYPTION_KEY_B64 must be configured in production');
  const decoded=Buffer.from(kycKey,'base64');
  if (decoded.length!==32) throw new Error('KYC_ENCRYPTION_KEY_B64 must decode to exactly 32 bytes');
  const kycTimeout=Number(env.KYC_PROVIDER_TIMEOUT_MS ?? 10000);
  if (!Number.isSafeInteger(kycTimeout) || kycTimeout<1000 || kycTimeout>60000) throw new Error('KYC_PROVIDER_TIMEOUT_MS must be an integer between 1000 and 60000');
}
