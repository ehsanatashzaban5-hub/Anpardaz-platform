# Production Deployment Blueprint

Production is split into four independently deployable service groups:

1. **VPS 1 — An Pardaz / Banking**
   - `services/anpardaz`
   - An Pardaz PostgreSQL database on the banking network
2. **VPS 2 — An Sarraf / Exchange**
   - `services/ansarraf`
   - An Sarraf PostgreSQL database on the exchange network
3. **VPS 3 — Platform / Control Plane**
   - `services/platform`
   - Platform PostgreSQL database
   - identity, content, community, support, moderation and operational control plane
4. **VPS 4 — Accounting**
   - `services/accounting`
   - Accounting PostgreSQL database
   - append-only double-entry ledger, holds, statements and reversals

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

For each VPS, copy its matching `*.env.example` to an environment-only file, replace all placeholders, build the service image and start its compose file.

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

The supplied compose files are deployment templates, not a claim that a particular VPS provider, firewall or domain has already been configured.
