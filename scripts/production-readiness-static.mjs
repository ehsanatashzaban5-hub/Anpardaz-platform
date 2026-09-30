import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredDomains = ["anpardaz","ansarraf","platform","accounting","banner","hoosh","market","financial"];
const requiredMobileFiles = [
  "apps/mobile/src/App.tsx",
  "apps/mobile/src/AnBanner.tsx",
  "apps/mobile/src/AnHoosh.tsx",
  "apps/mobile/src/FinancialCenterLive.tsx",
  "apps/mobile/src/bannerApi.ts",
  "apps/mobile/src/financialApi.ts",
];
const requiredProductionFiles = [
  "infrastructure/production/platform.compose.yml",
  "infrastructure/production/admin.compose.yml",
  "infrastructure/production/anpardaz.compose.yml",
  "infrastructure/production/ansarraf.compose.yml",
  "infrastructure/production/accounting.compose.yml",
  "infrastructure/production/web.compose.yml",
  "databases/docker-compose.yml",
];

const errors = [];
const exists = p => fs.existsSync(path.join(root, p));
const read = p => fs.readFileSync(path.join(root, p), "utf8");

for (const domain of requiredDomains) {
  const dir = path.join(root, "databases", domain);
  if (!fs.existsSync(dir)) errors.push(`missing database domain: ${domain}`);
  else if (!fs.readdirSync(dir).some(f => f.endsWith(".sql"))) errors.push(`database domain has no migrations: ${domain}`);
}

for (const p of requiredMobileFiles) if (!exists(p)) errors.push(`mobile source-of-truth file missing: ${p}`);
for (const p of requiredProductionFiles) if (!exists(p)) errors.push(`production infrastructure file missing: ${p}`);

const mobile = read("apps/mobile/src/App.tsx");
for (const marker of ["AnBanner","AnHoosh","FinancialCenterLive"]) {
  if (!mobile.includes(marker)) errors.push(`mobile App.tsx no longer references required feature: ${marker}`);
}

const forbiddenSourcePatterns = [
  ["services/market/src", /(?:FROM|JOIN|UPDATE|INSERT\\s+INTO|DELETE\\s+FROM)\\s+(?:public\\.)?(?:platform_|hoosh_|financial_|banner_)/i],
  ["services/hoosh/src", /(?:FROM|JOIN|UPDATE|INSERT\\s+INTO|DELETE\\s+FROM)\\s+(?:public\\.)?(?:platform_|market_|financial_|banner_)/i],
  ["services/financial/src", /(?:FROM|JOIN|UPDATE|INSERT\\s+INTO|DELETE\\s+FROM)\\s+(?:public\\.)?(?:platform_|market_|hoosh_|banner_)/i],
  ["services/banner/src", /(?:FROM|JOIN|UPDATE|INSERT\\s+INTO|DELETE\\s+FROM)\\s+(?:public\\.)?(?:platform_|market_|hoosh_|financial_)/i],
];
for (const [dir, pattern] of forbiddenSourcePatterns) {
  if (!fs.existsSync(path.join(root, dir))) continue;
  const stack = [path.join(root, dir)];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, {withFileTypes:true})) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (/\\.(ts|tsx|js|mjs)$/.test(entry.name)) {
        const source = fs.readFileSync(full, "utf8");
        if (pattern.test(source)) errors.push(`possible cross-domain DB access in ${path.relative(root, full)}`);
      }
    }
  }
}

if (errors.length) {
  console.error("Production readiness static gate failed:");
  for (const e of errors) console.error(" - " + e);
  process.exit(1);
}
console.log("Production readiness static gate passed.");
