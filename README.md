# ✦ An Pardaz Platform

### همه‌چیز در یک اکوسیستم

> **An Pardaz — یک پلتفرم یکپارچه برای خدمات مالی، بازار، محتوا و ابزارهای هوشمند**

Central monorepo for the An Pardaz ecosystem. Mobile/Web are the approved user frontends; backend services and databases are isolated by domain.

## Ecosystem

| Product | Purpose |
|---|---|
| **An Pardaz** | Banking, cards, transfers and financial services |
| **An Sarraf** | Digital-asset exchange |
| **An Banner** | Classified advertisements and local listings |
| **An Market** | Products and price comparison |
| **An Hoosh** | AI assistant and content capabilities |
| **Financial Center** | Income, expenses and personal financial management |
| **An Yab** | Planned ecosystem service |

## Repository

```text
anpardaz-platform/
├── apps/                 # Approved Mobile + Web frontends
├── packages/             # Shared clients/modules
├── services/             # Independently deployable domain/gateway services
│   ├── anpardaz/         # Banking API
│   ├── ansarraf/         # Exchange API
│   ├── banner/           # Classifieds API
│   ├── market/           # Market API + market-data ingestion
│   ├── hoosh/            # AI API
│   ├── financial/        # Financial Center API
│   ├── platform/         # Identity/content/community/control plane
│   ├── accounting/       # Double-entry accounting API
│   └── admin/             # Admin gateway/orchestration
├── databases/
│   ├── anpardaz/         # Banking DB migrations
│   ├── ansarraf/         # Exchange DB migrations
│   ├── platform/         # Platform DB migrations
│   └── accounting/       # Accounting DB migrations
├── infrastructure/       # Deployment templates
├── docs/                 # Architecture/deployment documentation
└── .github/workflows/    # CI
```

## Current backend foundation

- [x] Independent domain services for An Pardaz, An Sarraf, Banner, Market, Hoosh, Financial, Platform and Accounting.
- [x] Separate Admin gateway with no direct PostgreSQL access.
- [x] Eight isolated PostgreSQL 17 databases with one migration set per owner.
- [x] Central Platform identity with Ed25519-signed short-lived tokens.
- [x] Authenticated service-to-service credentials at internal admin boundaries.
- [x] Granular permissions and audited administrative actions.
- [x] Market-data ingestion isolated in Market and never used to mutate balances.
- [x] Accounting double-entry ledger with idempotency, decimal-safe validation, holds and reversals.
- [x] Fresh-install migration validation and migration dependency/boundary auditing.
- [x] Production Docker/runtime validation and security regression gates.
- [x] Mobile, Web and Admin builds in CI.

## Database boundaries

**An Pardaz DB** is the source of banking-domain data.

**An Sarraf DB** is the source of exchange-domain data.

**Platform DB** owns identity, forum, news/content, support, community and operational control-plane data. Banner, Market, Hoosh and Financial application data belongs to their own databases.

**Accounting DB** contains the financial double-entry ledger. Posted ledger history is immutable; corrections are represented by new reversal/adjustment transactions.

There are no cross-database foreign keys. Frontends never connect directly to PostgreSQL. Cross-service operations use authenticated APIs. Market-data ingestion is informational and does not mutate balances.

## Security model

- Banking, exchange and accounting runtime/database/network boundaries are separated.
- Internal accounting endpoints require a dedicated credential.
- Production secrets are never committed.
- Platform identity signing uses an Ed25519 private key held only by Platform; domain services receive only the verification key.
- Administrative destructive/moderation actions require permissions and are audited.
- Guest interaction identifiers are stored as hashes rather than raw guest tokens.
- Financial amounts are handled as decimal strings and PostgreSQL `NUMERIC`, not JavaScript floating-point numbers.

## Production topology

Each domain may be deployed independently. The deployment template can place services on the same host, but database credentials and network access must remain isolated by owner.

See `docs/production-deployment.md` and `docs/architecture/legacy-table-ownership.md` for isolation and deployment rules.

## Local development

The complete local environment can be initialized with:

```bash
bash scripts/bootstrap-local.sh
```

The bootstrap starts all eight PostgreSQL containers, applies every domain migration, creates local identity/service secrets where needed, and builds the backend services plus Mobile, Web and Admin frontends.

Backend builds can also be run individually with:

```bash
pnpm --dir services/anpardaz build
pnpm --dir services/ansarraf build
pnpm --dir services/platform build
pnpm --dir services/accounting build
pnpm --dir packages/accounting-client build
```

## Engineering rules

1. Preserve the approved frontend UI unless an explicit UI change is requested.
2. Keep the legacy `Anpardaz_working_-` application reference-only.
3. Never expose PostgreSQL directly to a frontend.
4. Keep banking, exchange and accounting data isolated.
5. Never commit real credentials or tokens.
6. Use authenticated API boundaries for cross-service communication.
7. Do not use floating-point arithmetic for financial amounts.
8. Keep meaningful changes committed and pushed to `main`.
9. Complete backend/database/control-plane foundations before frontend integration.

## Phase

**Current phase: Production hardening and controlled cutover.**

Automated gates now cover migration boundaries, builds, Docker runtime configuration and dependency/security checks. The remaining production-only work is live database cutover/reconciliation on the actual VPS environment; source control alone cannot truthfully perform that operation.

---

## © An Pardaz

**An Pardaz — همه‌چیز در یک اپلیکیشن**


## Independent Admin boundary

The Admin Frontend is intentionally separate from the user Web/Mobile applications. Its only backend is `services/admin` (port 4006). The Admin Backend authenticates administrators through the Platform identity/control-plane API and exposes the browser-facing `/api/v1/admin/*` boundary. Platform admin routes are gateway-protected and are not a public browser API.

Flow:
`Admin Frontend -> Admin Backend -> authenticated domain/control-plane APIs -> owning databases -> Accounting where financial -> audit/trace`.

The Admin Backend does not connect directly to PostgreSQL and does not duplicate domain business logic.
