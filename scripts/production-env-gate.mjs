import fs from "node:fs";

const [service, envPath] = process.argv.slice(2);
if (!service || !envPath) throw new Error("Usage: node scripts/production-env-gate.mjs <service> <env-file>");

const text = fs.readFileSync(envPath, "utf8");
const env = {};
for (const raw of text.split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i <= 0) continue;
  env[line.slice(0, i)] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}

const required = {
  platform: [
    "NODE_ENV","PORT","CORS_ORIGIN","DATABASE_URL","IDENTITY_ISSUER","IDENTITY_PRIVATE_KEY_B64",
    "GUEST_INTERACTION_SECRET","TRUST_PROXY","IP_GEOLOCATION_URL_TEMPLATE",
    "ANSARRAF_SERVICE_URL","ANPARDAZ_SERVICE_URL","ACCOUNTING_SERVICE_URL",
    "ANSARRAF_INTERNAL_TOKEN","ANPARDAZ_INTERNAL_TOKEN","ACCOUNTING_INTERNAL_TOKEN",
    "BANNER_SERVICE_URL","BANNER_INTERNAL_TOKEN","ADMIN_INTERNAL_TOKEN"
  ],
  admin: [
    "NODE_ENV","PORT","CORS_ORIGIN","TRUST_PROXY","PLATFORM_SERVICE_URL","ADMIN_INTERNAL_TOKEN",
    "IP_GEOLOCATION_URL_TEMPLATE","ANSARRAF_SERVICE_URL","ANSARRAF_INTERNAL_TOKEN",
    "ANPARDAZ_SERVICE_URL","ANPARDAZ_INTERNAL_TOKEN","BANNER_SERVICE_URL","BANNER_INTERNAL_TOKEN",
    "ACCOUNTING_SERVICE_URL","ACCOUNTING_INTERNAL_TOKEN","HOOSH_SERVICE_URL","HOOSH_INTERNAL_TOKEN",
    "MARKET_SERVICE_URL","MARKET_INTERNAL_TOKEN","FINANCIAL_SERVICE_URL","FINANCIAL_INTERNAL_TOKEN"
  ],
  anpardaz: [
    "NODE_ENV","PORT","CORS_ORIGIN","DATABASE_URL","IDENTITY_SERVICE_URL","IDENTITY_ISSUER",
    "IDENTITY_PUBLIC_KEY_B64","ANPARDAZ_INTERNAL_TOKEN","ACCOUNTING_SERVICE_URL",
    "ACCOUNTING_INTERNAL_TOKEN","FINTECH_API_BASE_URL",
    "FINTECH_ENDPOINTS_JSON","FINTECH_PAYLOAD_ENCRYPTION_KEY_B64",
    "IP_GEOLOCATION_URL_TEMPLATE","TRUST_PROXY","WEBAUTHN_RP_ID","WEBAUTHN_ORIGIN",
    "FINANCIAL_SERVICE_URL","FINANCIAL_INTERNAL_TOKEN"
  ],
  ansarraf: [
    "NODE_ENV","PORT","CORS_ORIGIN","DATABASE_URL","IDENTITY_SERVICE_URL","IDENTITY_ISSUER",
    "IDENTITY_PUBLIC_KEY_B64","ANSARRAF_INTERNAL_TOKEN","ACCOUNTING_SERVICE_URL",
    "ACCOUNTING_INTERNAL_TOKEN","ANPARDAZ_SERVICE_URL","ANPARDAZ_INTERNAL_TOKEN",
    "WALLEX_API_BASE_URL","KYC_MANUAL_REVIEW_ENABLED","KYC_ENCRYPTION_KEY_B64",
    "TRUST_PROXY","IP_GEOLOCATION_URL_TEMPLATE"
  ],
  banner: ["NODE_ENV","PORT","CORS_ORIGIN","DATABASE_URL","IDENTITY_ISSUER","IDENTITY_PUBLIC_KEY_B64","BANNER_INTERNAL_TOKEN"],
  hoosh: ["NODE_ENV","PORT","CORS_ORIGIN","DATABASE_URL","IDENTITY_ISSUER","IDENTITY_PUBLIC_KEY_B64","OPENAI_BASE_URL","HOOSH_INTERNAL_TOKEN"],
  market: ["NODE_ENV","PORT","CORS_ORIGIN","DATABASE_URL","IDENTITY_ISSUER","IDENTITY_PUBLIC_KEY_B64","OPENAI_BASE_URL","MARKET_INTERNAL_TOKEN"],
  financial: [
    "NODE_ENV","PORT","CORS_ORIGIN","DATABASE_URL","IDENTITY_ISSUER","IDENTITY_PUBLIC_KEY_B64",
    "ANPARDAZ_SERVICE_URL","ANPARDAZ_INTERNAL_TOKEN","ACCOUNTING_SERVICE_URL","ACCOUNTING_INTERNAL_TOKEN",
    "FINNOTECH_API_BASE_URL","FINANCIAL_INTERNAL_TOKEN"
  ],
  accounting: ["NODE_ENV","PORT","DATABASE_URL","ACCOUNTING_INTERNAL_TOKEN"]
};

if (!required[service]) throw new Error("Unknown service: " + service);

const errors = [];
const value = (name) => env[name] ?? "";

for (const name of required[service]) {
  if (!value(name)) errors.push(name + ": missing");
}

if (value("NODE_ENV") !== "production") errors.push("NODE_ENV: must be production");

const placeholder = /(?:CHANGE_ME|GENERATE_|configure-at-deploy-time|generated-by-bootstrap|local-|replace-in-local-bootstrap|your-domain\.example|USER:PASSWORD|<trusted-|BASE64-32-BYTE-KEY|example\.com)/i;
// DATABASE_URL is validated separately because real URLs commonly contain
// credential labels such as DB_USER/DB_PASSWORD and must not be classified
// as placeholders by the generic secret scanner.
for (const [name, v] of Object.entries(env)) {
  if (name === "DATABASE_URL") continue;
  if (v && placeholder.test(v)) errors.push(name + ": placeholder/example value");
}
const databaseUrl = value("DATABASE_URL");
if (databaseUrl && /^(?:postgres(?:ql)?:\/\/)/i.test(databaseUrl)) {
  if (/your-domain\.example|USER:PASSWORD|CHANGE_ME|GENERATE_|example\.com/i.test(databaseUrl)) {
    errors.push("DATABASE_URL: placeholder/example value");
  }
} else if (databaseUrl) {
  errors.push("DATABASE_URL: must use PostgreSQL URL");
}

for (const [name, v] of Object.entries(env)) {
  if (name.includes("TOKEN") && v && v.length < 32) errors.push(name + ": must be at least 32 characters");
  if (/^(?:.*_SECRET|.*_PRIVATE_KEY_B64|.*_ENCRYPTION_KEY_B64|.*_API_KEY)$/.test(name) && v && /^(?:test|demo|dummy|sample|local|secret)$/i.test(v)) {
    errors.push(name + ": test/demo value");
  }
}

for (const name of ["PLATFORM_SERVICE_URL","ANSARRAF_SERVICE_URL","ANPARDAZ_SERVICE_URL","ACCOUNTING_SERVICE_URL","BANNER_SERVICE_URL","HOOSH_SERVICE_URL","MARKET_SERVICE_URL","FINANCIAL_SERVICE_URL","IDENTITY_SERVICE_URL"]) {
  const v = value(name);
  if (v && !/^https?:\/\/([a-z0-9-]+|127\.0\.0\.1|localhost)(?::\d+)?(?:\/.*)?$/i.test(v)) {
    errors.push(name + ": invalid internal service URL");
  }
  if (v && /localhost|127\.0\.0\.1/i.test(v)) errors.push(name + ": localhost is forbidden in production");
}

for (const name of ["CORS_ORIGIN","WEBAUTHN_ORIGIN"]) {
  const v = value(name);
  if (v && !v.startsWith("https://")) errors.push(name + ": must use HTTPS in production");
}

if (service === "platform" && value("PHONE_OTP_ENABLED") === "true") {
  for (const name of ["OTP_HASH_SECRET","KAVENEGAR_API_KEY","KAVENEGAR_SENDER"]) {
    if (!value(name)) errors.push(name + ": required when PHONE_OTP_ENABLED=true");
  }
}

if (service === "ansarraf" && value("LIQUIDITY_PROVIDER_EXECUTION_ENABLED") === "true" && !value("WALLEX_API_KEY")) {
  errors.push("WALLEX_API_KEY: required when live liquidity execution is enabled");
}

if (service === "ansarraf" && value("KYC_MANUAL_REVIEW_ENABLED") !== "true" && !value("KYC_PROVIDER_API_KEY")) {
  errors.push("KYC: either KYC_MANUAL_REVIEW_ENABLED=true or a real KYC provider API key is required");
}

if (service === "anpardaz" && value("FINNOTECH_ENABLED") === "true") {
  for (const name of ["FINNOTECH_CLIENT_ID","FINNOTECH_CLIENT_SECRET","FINNOTECH_AUTHORIZE_URL","FINNOTECH_TOKEN_URL","FINNOTECH_TOKEN_ENCRYPTION_KEY_B64"]) {
    if (!value(name)) errors.push(name + ": required when FINNOTECH_ENABLED=true");
  }
}

if (service === "financial") {
  const clientId = value("FINNOTECH_CLIENT_ID");
  const clientSecret = value("FINNOTECH_CLIENT_SECRET");
  if (clientId && !clientSecret) errors.push("FINNOTECH_CLIENT_SECRET: required with FINNOTECH_CLIENT_ID");
  if (clientSecret && !clientId) errors.push("FINNOTECH_CLIENT_ID: required with FINNOTECH_CLIENT_SECRET");
}

if (errors.length) {
  console.error("Production environment gate failed for " + service + ":");
  for (const e of [...new Set(errors)]) console.error(" - " + e);
  process.exit(1);
}

console.log("Production environment gate passed for " + service + ".");