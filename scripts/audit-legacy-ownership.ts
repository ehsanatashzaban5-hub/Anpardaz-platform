import { Pool } from "pg";

type Domain = "anpardaz" | "platform";

const url = process.env.DATABASE_URL;
const domain = process.argv[2] as Domain | undefined;
const includeCounts = process.argv.includes("--counts");

if (!url) throw new Error("DATABASE_URL is required");
if (!domain || !["anpardaz", "platform"].includes(domain)) {
  throw new Error("usage: DATABASE_URL=... tsx scripts/audit-legacy-ownership.ts anpardaz|platform [--counts]");
}

const pool = new Pool({ connectionString: url, max: 2 });

const ownershipHints: Record<string, string> = {
  market: "market",
  product: "market",
  offer: "market",
  store: "market",
  clickout: "market",
  hoosh: "hoosh",
  ai_: "hoosh",
  financial: "financial",
  finnotec: "financial",
  card: "financial",
  transaction: "financial",
  banner: "banner",
  listing: "banner",
  ad_: "banner",
  crypto: "ansarraf",
  wallet: "ansarraf",
  order: "ansarraf",
  trade: "ansarraf",
  news: "platform",
  forum: "platform",
  content: "platform",
  audit: "platform",
  notification: "platform",
  support: "platform",
  user: "platform/identity-reference",
};

function classify(table: string): string {
  const lower = table.toLowerCase();
  for (const [hint, owner] of Object.entries(ownershipHints)) {
    if (lower.includes(hint)) return owner;
  }
  return "review-required";
}

async function main() {
  const client = await pool.connect();
  try {
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema='public' AND table_type='BASE TABLE'
      ORDER BY table_name
    `);

    const fks = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column,
        tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name=kcu.constraint_name
       AND tc.table_schema=kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name=tc.constraint_name
       AND ccu.table_schema=tc.table_schema
      WHERE tc.constraint_type='FOREIGN KEY'
        AND tc.table_schema='public'
      ORDER BY tc.table_name,tc.constraint_name,kcu.ordinal_position
    `);

    const rows: Array<Record<string, unknown>> = [];
    for (const { table_name: table } of tables.rows) {
      let rowCount: number | undefined;
      if (includeCounts) {
        const result = await client.query('SELECT COUNT(*)::bigint AS count FROM "' + table.replace(/"/g, '""') + '"');
        rowCount = Number(result.rows[0].count);
      }
      const tableFks = fks.rows.filter((fk: any) => fk.table_name === table);
      rows.push({
        domain,
        table,
        proposed_owner: classify(table),
        row_count: rowCount,
        foreign_keys: tableFks,
        action: classify(table) === "review-required"
          ? "manual-review-before-retirement"
          : "inventory-and-reconcile-before-retirement",
      });
    }

    console.log(JSON.stringify({
      generated_at: new Date().toISOString(),
      domain,
      source: "information_schema",
      destructive_actions_performed: false,
      tables: rows,
      foreign_key_count: fks.rowCount,
      notes: [
        "This audit is read-only.",
        "Ownership hints are triage only; they are not permission to migrate or drop a table.",
        "A table may be retired only after destination schema validation, dry-run migration, row-count/checksum reconciliation, dependency verification, and controlled retirement.",
      ],
    }, null, 2));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
