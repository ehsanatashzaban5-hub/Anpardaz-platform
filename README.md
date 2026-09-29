# ✦ An Pardaz Platform

### همه‌چیز در یک اکوسیستم

> **An Pardaz — یک پلتفرم یکپارچه برای خدمات مالی، بازار، محتوا و ابزارهای هوشمند**

Central monorepo for the An Pardaz ecosystem. Mobile/Web and backend services evolve together while banking, exchange and accounting workloads remain isolated.

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
├── services/
│   ├── anpardaz/         # Banking API
│   ├── ansarraf/         # Exchange API
│   ├── platform/         # Identity, content, community and control plane
│   └── accounting/       # Double-entry accounting API
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

- [x] Four independently deployable Fastify services on ports 4001–4004
- [x] Four isolated PostgreSQL 17 databases
- [x] Central Platform identity with Ed25519-signed short-lived tokens
- [x] Password hashing and authenticated service APIs
- [x] Granular role/permission model
- [x] Admin/control-plane settings, maintenance, support and notifications
- [x] Community comments and likes for members and guests
- [x] Guest rate limiting, guest blocking and abuse reports
- [x] Admin moderation with audit trail
- [x] Content ingestion/AI workflow data model
- [x] Market-data source/observation model and exchange adapters
- [x] Accounting double-entry ledger with idempotency and decimal-safe validation
- [x] Posted-ledger immutability, holds, statements and reversal transactions
- [x] Shared accounting client package
- [x] Local four-database bootstrap and migrations
- [x] GitHub Actions builds for services, shared accounting package, Mobile and Web

## Database boundaries

**An Pardaz DB** is the source of banking-domain data.

**An Sarraf DB** is the source of exchange-domain data.

**Platform DB** contains identity, Banner, Market, forum, news/content, support, community and operational control-plane data.

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

```text
VPS 1 → An Pardaz / Banking → An Pardaz DB
VPS 2 → An Sarraf / Exchange → An Sarraf DB
VPS 3 → Platform / Control Plane → Platform DB
VPS 4 → Accounting → Accounting DB
```

See `docs/production-deployment.md` for isolation and deployment rules.

## Local development

The complete local environment can be initialized with:

```bash
bash scripts/bootstrap-local.sh
```

The bootstrap starts all four PostgreSQL containers, applies all migrations, generates local identity/guest/accounting secrets, installs dependencies and builds every service plus both approved frontends.

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

**Current phase: Backend + Database + Control Plane completion.**

The repository now contains the core service, database, identity, moderation, market-data and accounting foundations needed before the final frontend integration phase.

---

## © An Pardaz

**An Pardaz — همه‌چیز در یک اپلیکیشن**


## Independent Admin boundary

The Admin Frontend is intentionally separate from the user Web/Mobile applications. Its only backend is `services/admin` (port 4006). The Admin Backend authenticates administrators through the Platform identity/control-plane API and exposes the browser-facing `/api/v1/admin/*` boundary. Platform admin routes are gateway-protected and are not a public browser API.

Flow:
`Admin Frontend -> Admin Backend -> authenticated domain/control-plane APIs -> owning databases -> Accounting where financial -> audit/trace`.

The Admin Backend does not connect directly to PostgreSQL and does not duplicate domain business logic.
