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
  if (!Number.isSafeInteger(interval) || interval < 5000) {
    throw new Error('PROVIDER_RECONCILIATION_INTERVAL_MS must be an integer >= 5000');
  }
  const tolerance = env.PROVIDER_RECONCILIATION_TOLERANCE ?? '0.00000001';
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(tolerance)) {
    throw new Error('PROVIDER_RECONCILIATION_TOLERANCE must be a positive decimal');
  }
  const dual = Number(env.WITHDRAWAL_DUAL_APPROVAL_THRESHOLD ?? 0);
  if (!Number.isFinite(dual) || dual < 0) throw new Error('WITHDRAWAL_DUAL_APPROVAL_THRESHOLD must be >= 0');
}
