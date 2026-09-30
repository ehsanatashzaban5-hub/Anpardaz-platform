import { Pool } from "pg";

const sourceUrl = process.env.SOURCE_DATABASE_URL;
const targetUrl = process.env.TARGET_DATABASE_URL;
if (!sourceUrl || !targetUrl) throw new Error("SOURCE_DATABASE_URL and TARGET_DATABASE_URL are required");

const source = new Pool({ connectionString: sourceUrl, max: 2 });
const target = new Pool({ connectionString: targetUrl, max: 2 });

const domain = process.argv[2];
const apply = process.argv.includes("--apply");

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
    "SELECT column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position",
    [table],
  )).rows;
}

async function tableExists(pool: Pool, table: string) {
  const r = await pool.query(
    "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1) AS exists",
    [table],
  );
  return Boolean(r.rows[0]?.exists);
}

async function copyTable(table: string, tx: any) {
  if (!(await tableExists(source, table)) || !(await tableExists(target, table))) {
    return { sourceRows: 0, copiedRows: 0, skipped: true };
  }

  const sourceColumns = await columns(source, table);
  const targetColumns = await columns(target, table);
  const common = sourceColumns.map(x => x.column_name).filter(x => targetColumns.some(y => y.column_name === x));
  if (!common.length) return { sourceRows: 0, copiedRows: 0, skipped: true };

  const quoted = common.map(x => '"' + x.replace(/"/g, '""') + '"').join(",");
  const rows = (await source.query('SELECT ' + quoted + ' FROM "' + table + '"')).rows;

  if (!apply) return { sourceRows: rows.length, copiedRows: 0, skipped: false };

  for (const row of rows) {
    const placeholders = common.map((_, i) => "$" + (i + 1)).join(",");
    await tx.query(
      'INSERT INTO "' + table + '" (' + quoted + ') OVERRIDING SYSTEM VALUE VALUES (' + placeholders + ') ON CONFLICT DO NOTHING',
      common.map(x => row[x]),
    );
  }

  return { sourceRows: rows.length, copiedRows: rows.length, skipped: false };
}

async function resetIdentitySequences(tx: any, table: string) {
  const ids = await tx.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND is_identity='YES'",
    [table],
  );
  for (const row of ids.rows) {
    const column = row.column_name;
    const sequence = await tx.query("SELECT pg_get_serial_sequence($1,$2) AS sequence", [table, column]);
    const seq = sequence.rows[0]?.sequence;
    if (!seq) continue;
    await tx.query(
      'SELECT setval($1, COALESCE((SELECT MAX("' + column.replace(/"/g, '""') + '") FROM "' + table + '"),1), (SELECT COUNT(*) > 0 FROM "' + table + '"))',
      [seq],
    );
  }
}

(async () => {
  const connection = await target.connect();
  try {
    await connection.query("BEGIN");
    const results: Record<string, unknown> = {};

    for (const table of sets[domain]) {
      results[table] = await copyTable(table, connection);
      if (apply && !(results[table] as any).skipped) await resetIdentitySequences(connection, table);
    }

    if (apply) await connection.query("COMMIT");
    else await connection.query("ROLLBACK");

    console.log(JSON.stringify({ domain, apply, results }, null, 2));
  } catch (error) {
    await connection.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    connection.release();
    await source.end();
    await target.end();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
