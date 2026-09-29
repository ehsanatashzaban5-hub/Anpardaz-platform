# Full-Repository Adversarial Audit — 2026-09-29

## Scope
Six adversarial areas were reviewed together:
1. An Pardaz banking / Finnotech / Shaparak / cards / financial center
2. Platform identity and authorization boundaries
3. Accounting / ledger / reconciliation / idempotency
4. An Banner uploads / chat / moderation / notifications
5. Mobile/Web API trust boundaries and mock/bypass exposure
6. Cross-service attack-chain and production regression controls

## Concrete findings fixed

### 1. Duplicate banking transfer execution path
The Finnotech-specific `/api/v1/banking/transfers` route previously called the provider directly and finalized `transfer_requests` without using the audited `BankingProviderWorker` hold/accounting path. It now creates the same idempotent outbox operation and returns `202 queued`; the worker is the sole execution path.

### 2. Uncertain provider retry
Banking/top-up worker paths no longer automatically retry a non-terminal provider response when there is no provider operation/reference suitable for reconciliation. Such operations are moved to `manual_review` to prevent duplicate external side effects.

The general Finnotech service worker applies the same rule to non-terminal results without a provider reference.

### 3. Internal Admin identity binding
An Pardaz internal Admin routes now require:
- the exact `ANPARDAZ_INTERNAL_TOKEN`
- `x-admin-identity`
- an allowed admin role: `admin`, `super_admin`, `operator`, or `support`

This keeps the owning service aligned with the established Browser → Admin Backend → owning-service trust chain.

### 4. Security-header duplication
Duplicate An Pardaz `onSend` security-header hooks were consolidated so later hooks cannot silently override earlier security-header policy.

## Areas reviewed with no new concrete exploit fixed in this pass

- Shaparak callback: signed HMAC callback, single-use pending state, expiry, customer binding, provider approval + identity-match requirement, transactional card registration.
- Account/card ownership: user-facing account/card queries are scoped through authenticated customer ownership.
- Financial Center: customer/card ownership predicates and accounting idempotency were reviewed.
- Accounting: immutable posted journal controls, balanced transactions, currency checks, idempotency hashes, reversals, holds, sufficient-balance enforcement and operation tracing were reviewed.
- Banner: internal admin authentication, trusted admin identity, media MIME/size/dimension normalization, participant-scoped message media access, moderation and audit attribution were reviewed.
- Admin Frontend: previous stages removed browser-to-service direct configuration, mocks/demo literals, and direct database access.
- Cross-service internal calls: service tokens and explicit internal endpoints were reviewed; production tokens remain deployment secrets rather than committed values.

## Remaining deployment condition
This audit does not manufacture production provider credentials, Finnotech/Shaparak secrets, Wallex credentials, or VPS configuration. Those remain deployment-time requirements.

CI status must be taken from actual workflow runs for the resulting commit; absence of a run is not treated as success.
