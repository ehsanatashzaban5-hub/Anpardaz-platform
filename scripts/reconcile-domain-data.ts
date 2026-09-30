import { Pool } from "pg";

const sourceUrl = process.env.SOURCE_DATABASE_URL;
const targetUrl = process.env.TARGET_DATABASE_URL;
if (!sourceUrl || !targetUrl) throw new Error("SOURCE_DATABASE_URL and TARGET_DATABASE_URL are required");

const source = new Pool({ connectionString: sourceUrl, max: 2 });
const target = new Pool({ connectionString: targetUrl, max: 2 });

const domain = process.argv[2];
const withChecksum = process.argv.includes("--checksum");

const sets: Record<string, string[]> = {
  market: [
    "market_users","market_products","market_media","market_offers","market_categories",
    "market_stores","market_offer_snapshots","market_favorites","market_orders","market_clickouts",
    "market_user_events","market_tickets","market_ticket_messages","market_purchase_events",
    "market_data_sources","market_data_symbols","market_data_observations","market_data_health","market_quotes",
  ],
  hoosh: [
    "hoosh_users","hoosh_conversations","hoosh_messages","hoosh_usage","hoosh_requests",
    "hoosh_projects","hoosh_project_conversations","hoosh_settings","hoosh_media_assets","hoosh_media_jobs",
  ],
  financial: [
    "financial_users","financial_accounts","financial_cards","financial_finnotech_oauth_states",
    "financial_finnotech_connections","financial_card_audit_permissions","financial_card_transactions",
    "financial_notifications",
  ],
};

if (!sets[domain]) throw new Error("domain must be market|hoosh|financial");

async function columns(pool: Pool, table: string) {
  return (await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position",
    [table],
  )).rows.map((x: { column_name: string }) => x.column_name);
}

async function exists(pool: Pool, table: string) {
  const r = await pool.query(
    "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1) AS exists",
    [table],
  );
  return Boolean(r.rows[0]?.exists);
}

async function fingerprint(pool: Pool, table: string, common: string[]) {
  const quoted = common.map(x => '"' + x.replace(/"/g, '""') + '"').join(",");
  const sql = `SELECT md5(COALESCE(string_agg(md5(row_to_json(r)::text), '' ORDER BY md5(row_to_json(r)::text)), '')) AS checksum FROM (SELECT ${quoted} FROM "${table.replace(/"/g, '""')}") r`;
  return String((await pool.query(sql)).rows[0]?.checksum ?? "");
}

async function main() {
  const results: Record<string, unknown> = {};
  for (const table of sets[domain]) {
    const sourceExists = await exists(source, table);
    const targetExists = await exists(target, table);
    if (!sourceExists && !targetExists) {
      results[table] = { status: "absent-both" };
      continue;
    }
    if (sourceExists !== targetExists) {
      results[table] = { status: "schema-mismatch", sourceExists, targetExists };
      continue;
    }

    const sourceColumns = await columns(source, table);
    const targetColumns = await columns(target, table);
    const common = sourceColumns.filter(x => targetColumns.includes(x));
    const sourceCount = Number((await source.query('SELECT COUNT(*)::bigint AS count FROM "' + table + '"')).rows[0].count);
    const targetCount = Number((await target.query('SELECT COUNT(*)::bigint AS count FROM "' + table + '"')).rows[0].count);
    const result: Record<string, unknown> = {
      status: sourceCount === targetCount ? "count-match" : "count-mismatch",
      sourceCount,
      targetCount,
      commonColumnCount: common.length,
    };
    if (withChecksum && common.length) {
      const [sourceChecksum, targetChecksum] = await Promise.all([
        fingerprint(source, table, common),
        fingerprint(target, table, common),
      ]);
      result.sourceChecksum = sourceChecksum;
      result.targetChecksum = targetChecksum;
      result.checksumMatch = sourceChecksum === targetChecksum;
      if (result.status === "count-match" && !result.checksumMatch) result.status = "content-mismatch";
    }
    results[table] = result;
  }

  const mismatches = Object.entries(results).filter(([, value]) => {
    const status = (value as { status: string }).status;
    return status === "schema-mismatch" || status === "count-mismatch" || status === "content-mismatch";
  });
  console.log(JSON.stringify({
    domain,
    checksum: withChecksum,
    generatedAt: new Date().toISOString(),
    ok: mismatches.length === 0,
    results,
  }, null, 2));
  if (mismatches.length) process.exitCode = 2;
}

main().catch(error => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await Promise.all([source.end(), target.end()]);
});
