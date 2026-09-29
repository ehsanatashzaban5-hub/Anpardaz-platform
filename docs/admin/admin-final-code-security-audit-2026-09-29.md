# Final Admin / Accounting / Banner Security Audit — 2026-09-29

## Scope
Final code-level review of the Admin boundary, An Sarraf withdrawal boundary, Accounting ledger boundary, and Banner internal-admin identity boundary.

## Findings and disposition

### 1. An Sarraf withdrawal trust boundary
Administrative withdrawal list/approve/reject/complete/reconcile operations are now separated from customer withdrawal endpoints. Admin Backend supplies the owning-service internal token and trusted admin identity/role. Customer withdrawal routes remain user-authenticated.

### 2. Accounting
Accounting is private/internal and requires ACCOUNTING_INTERNAL_TOKEN on every internal ledger route. Ledger transactions enforce:
- positive bounded decimal amounts;
- single-currency transactions;
- active account and currency matching;
- balanced journal entries;
- idempotency request-hash protection;
- immutable posted transactions and entries;
- explicit reversal records and state integrity;
- liability sufficient-balance checks;
- hold currency/account integrity.

Admin Backend only consumes Accounting read/trace adapters; it does not expose a browser-to-Accounting database path.

### 3. Banner
Banner internal-admin authentication requires BANNER_INTERNAL_TOKEN. Browser/user routes use signed identity tokens plus live identity introspection. Administrative actor attribution is derived from the trusted Admin Backend identity header rather than browser-supplied body/query actor IDs.

### 4. Admin Gateway
Admin requests are permission-gated before proxying. Multipart is allowlisted to content/video upload, generic multipart is rejected, path traversal markers are rejected, owning-service requests use server-side credentials, redirects are disabled, and service URLs are configured through production environment variables.

## Remaining live-production requirement
A repository audit cannot prove the security of a deployed VPS. Before public production traffic, perform an authenticated end-to-end penetration test against the actual deployment covering direct service ports, reverse-proxy routing, secret injection, admin token replay, header injection, IDOR, privilege escalation, withdrawal approval/rejection, ledger mutation/reversal, and failure/timeouts.

No claim of live-production verification is made until that runtime test is performed.
