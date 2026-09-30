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
  platform: ["DATABASE_URL","ANSARRAF_SERVICE_URL","ANSARRAF_INTERNAL_TOKEN","ANPARDAZ_SERVICE_URL","ANPARDAZ_INTERNAL_TOKEN","ACCOUNTING_SERVICE_URL","ACCOUNTING_INTERNAL_TOKEN","BANNER_SERVICE_URL","BANNER_INTERNAL_TOKEN","ADMIN_INTERNAL_TOKEN"],
  admin: ["PLATFORM_SERVICE_URL","ADMIN_INTERNAL_TOKEN","ANSARRAF_SERVICE_URL","ANSARRAF_INTERNAL_TOKEN","ANPARDAZ_SERVICE_URL","ANPARDAZ_INTERNAL_TOKEN","BANNER_SERVICE_URL","BANNER_INTERNAL_TOKEN","ACCOUNTING_SERVICE_URL","ACCOUNTING_INTERNAL_TOKEN","HOOSH_SERVICE_URL","HOOSH_INTERNAL_TOKEN","MARKET_SERVICE_URL","MARKET_INTERNAL_TOKEN","FINANCIAL_SERVICE_URL","FINANCIAL_INTERNAL_TOKEN"],
  anpardaz: ["DATABASE_URL","ANPARDAZ_INTERNAL_TOKEN","ACCOUNTING_SERVICE_URL","ACCOUNTING_INTERNAL_TOKEN","FINANCIAL_SERVICE_URL","FINANCIAL_INTERNAL_TOKEN"],
  ansarraf: ["DATABASE_URL","ANSARRAF_INTERNAL_TOKEN","ACCOUNTING_SERVICE_URL","ACCOUNTING_INTERNAL_TOKEN","ANPARDAZ_SERVICE_URL","ANPARDAZ_INTERNAL_TOKEN","WALLEX_API_BASE_URL"],
  banner: ["DATABASE_URL","BANNER_INTERNAL_TOKEN"],
  hoosh: ["DATABASE_URL","HOOSH_INTERNAL_TOKEN","OPENAI_BASE_URL"],
  market: ["DATABASE_URL","MARKET_INTERNAL_TOKEN","OPENAI_BASE_URL"],
  financial: ["DATABASE_URL","FINANCIAL_INTERNAL_TOKEN","ANPARDAZ_SERVICE_URL","ANPARDAZ_INTERNAL_TOKEN","ACCOUNTING_SERVICE_URL","ACCOUNTING_INTERNAL_TOKEN","FINNOTECH_API_BASE_URL"],
  accounting: ["DATABASE_URL"]
};
if (!required[service]) throw new Error("Unknown service: " + service);

const errors = [];
for (const name of required[service]) {
  const value = env[name] ?? "";
  if (!value) { errors.push(name + ": missing"); continue; }
  if (/CHANGE_ME|your-domain\.example|DB_HOST|USER:PASSWORD|<trusted-|BASE64-32-BYTE-KEY/i.test(value)) errors.push(name + ": placeholder value");
  if (name.includes("TOKEN") && value.length < 32) errors.push(name + ": must be at least 32 characters");
}
if (errors.length) {
  console.error("Production environment gate failed for " + service + ":");
  for (const e of errors) console.error(" - " + e);
  process.exit(1);
}
console.log("Production environment gate passed for " + service + ".");
