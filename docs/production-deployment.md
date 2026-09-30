# Production Deployment Blueprint

Production is organized by domain ownership. Services may share a VPS only when the network and database credential boundaries remain equivalent to this model.

## Service groups

1. **An Pardaz / Banking** — `services/anpardaz` → `anpardaz` DB
2. **An Sarraf / Exchange** — `services/ansarraf` → `ansarraf` DB
3. **An Banner** — `services/banner` → `banner` DB
4. **An Market** — `services/market` → `market` DB
5. **An Hoosh** — `services/hoosh` → `hoosh` DB
6. **Financial Center** — `services/financial` → `financial` DB
7. **Platform / Control Plane** — `services/platform` → `platform` DB
8. **Accounting** — `services/accounting` → `accounting` DB
9. **Admin Gateway** — `services/admin` → no PostgreSQL; API orchestration only

## Isolation rules

- Never expose PostgreSQL to the public Internet.
- Each service group gets its own database credentials and deployment secrets.
- Banking, exchange and accounting databases must not accept connections from unrelated service groups.
- No cross-database foreign keys are used. Cross-service operations use authenticated APIs and explicit allowlists.
- Accounting is the financial ledger source of truth; market-data ingestion and content services must never mutate balances.
- Posted ledger transactions and entries are immutable. Corrections are represented by reversal/adjustment transactions.
- Containers run as the unprivileged `node` user with a read-only filesystem and dropped Linux capabilities.
- Put TLS termination and public routing in the infrastructure layer; backend ports are bound to loopback in the supplied compose templates.

## First deployment

Create the shared Docker network before starting any production compose stack: `docker network create --driver bridge --internal anpardaz-internal`. Copy each matching `*.env.example` to an environment-only file, replace all placeholders, build the service image and start its compose file. Production PostgreSQL containers do not publish host ports; service-to-database traffic uses the shared Docker network and Docker DNS.

Run database migrations from the corresponding database host/network before enabling authenticated traffic. Ensure the platform migration `073_phone_otp_auth` is applied before enabling phone login. The migration runner is idempotent and applies migrations in filename order.

## Secrets

Generate unique high-entropy secrets per environment. Never use repository placeholders in production. In particular configure:

- Platform Ed25519 identity private key
- Platform guest-interaction secret
- Accounting internal service credential
- Database passwords
- Any external provider credentials
- Phone OTP provider credentials (`PHONE_OTP_ENABLED`, `OTP_HASH_SECRET`, Kavenegar API key/sender)
- An Pardaz accounting service URL/token
- An Sarraf KYC encryption key; if no external KYC provider is available, explicitly enable `KYC_MANUAL_REVIEW_ENABLED=true`

Do not store production secrets in GitHub source files. Use the VPS secret manager or protected environment configuration.

## Operational checks

After deployment verify:

- `GET /health` returns HTTP 200 for every service.
- `GET /health/db` returns HTTP 200 only when the intended database is reachable and migrations are present.
- `GET /api/v1/status` reports `v1` and `ready` where exposed.
- Authentication registration/login works only over HTTPS.
- Public traffic cannot reach PostgreSQL or internal backend ports directly.
- Accounting transaction creation is idempotent and rejects invalid decimal amounts, mixed currencies and unbalanced journals.
- An Pardaz banking-provider outbox worker is running and no transfer/top-up can remain silently stuck without a retry/manual-review outcome.
- Main-platform support tickets are visible and replyable from the admin panel.
- No production UI is allowed to synthesize financial balances, transaction receipts, market quotes or provider success states.
- A posted accounting transaction cannot be edited or deleted; a reversal creates a new balanced transaction.
- Community moderation actions are authenticated, permission-checked and audited.



## Final six-stage production gate

The repository-level cleanup is considered complete only after these six gates remain green:

1. **Domain/database isolation** — eight database domains have independent migrations; cross-domain database access is rejected by the migration/source audits.
2. **Build and regression** — all backend services, Admin, Web and Mobile build successfully; An Sarraf regression tests remain green.
3. **Container/runtime validation** — production Dockerfiles and compose definitions validate; mobile container health is checked.
4. **Security/policy validation** — security analysis, policy regression and service release gates pass on the same commit.
5. **Production configuration validation** — each VPS environment must pass `scripts/production-env-gate.mjs`; placeholders and short internal tokens are rejected.
6. **Data cutover/reconciliation** — only after real source/target database credentials are supplied: run the domain migration in dry-run mode, apply it, then run `scripts/reconcile-domain-data.mjs` with checksums. Legacy tables are retired only after reconciliation succeeds.

Stages 1–4 are repository/CI-verifiable. Stage 5 is deployment-environment verification. Stage 6 cannot be truthfully marked complete from Git alone because it requires the actual production databases and their data; no production data is deleted automatically by this repository.

The supplied compose files are deployment templates, not a claim that a particular VPS provider, firewall or domain has already been configured.
