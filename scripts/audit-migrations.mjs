import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const domains = ["anpardaz","ansarraf","platform","accounting","banner","hoosh","market","financial"];
const forbidden = {
  anpardaz: ["market_","hoosh_","financial_"],
  platform: ["market_","hoosh_","financial_","banner_"],
  market: ["platform_","hoosh_","financial_","banner_"],
  hoosh: ["platform_","market_","financial_","banner_"],
  financial: ["platform_","market_","hoosh_","banner_"],
  banner: ["platform_","market_","hoosh_","financial_"],
  ansarraf: ["platform_","hoosh_","financial_","banner_"],
  accounting: ["platform_","market_","hoosh_","financial_","banner_"],
};

const errors = [];
for (const domain of domains) {
  const dir = path.join(root, "databases", domain);
  if (!fs.existsSync(dir)) {
    errors.push(`${domain}: migration directory is missing`);
    continue;
  }
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".sql")).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  if (!files.length) {
    errors.push(`${domain}: no SQL migrations found`);
    continue;
  }

  for (const file of files) {
    const m = /^(\d+)_/.exec(file);
    if (!m) {
      errors.push(`${domain}: migration filename lacks numeric prefix: ${file}`);
      continue;
    }
    const sql = fs.readFileSync(path.join(dir,file),"utf8");
    if (!/schema_migrations/i.test(sql)) {
      errors.push(`${domain}: migration has no schema_migrations reference: ${file}`);
    }

    for (const prefix of forbidden[domain] ?? []) {
      const re = new RegExp(`(?:CREATE\\s+TABLE|ALTER\\s+TABLE|REFERENCES|FROM|JOIN|UPDATE|INSERT\\s+INTO|DELETE\\s+FROM)\\s+(?:public\\.)?["']?${prefix}`, "i");
      if (re.test(sql)) {
        errors.push(`${domain}: possible cross-domain table reference '${prefix}' in ${file}`);
      }
    }
  }
}

if (errors.length) {
  console.error("Migration dependency/boundary audit failed:");
  for (const error of errors) console.error(" - " + error);
  process.exit(1);
}

console.log(`Migration dependency/boundary audit passed for ${domains.length} domains.`);
