# White-box internal/admin abuse audit — 2026-09-29

Scope: security item 5 — internal service trust boundaries, admin gateway authorization, privileged service credentials, actor propagation, and privileged-operation exposure.

## Platform admin gateway
- Browser-facing admin routes require a valid Platform JWT.
- Current identity status and role are revalidated against Platform's database.
- Privileged actions are additionally gated by named permissions.
- Service credentials are injected server-side and are never returned to the browser.
- Cross-service admin calls use dedicated internal bearer credentials or, where appropriate, the authenticated Platform JWT.
- Actor identity is propagated explicitly for sensitive internal administrative actions.
- Security-case release additionally propagates the authenticated role and the downstream route restricts release to admin/super_admin.

## Permission matrix
Reviewed the platform permission migrations for users, operations, approvals, reconciliation, service health, An Sarraf fees, An Pardaz operations, content, support, notifications and audit.
- Permissions are database-backed and checked against the authenticated identity rather than trusting a client-supplied role.
- The An Sarraf security-case release route performs a downstream role check, so an operator with approvals.write cannot use that route.

## Internal service endpoints
- Internal admin routes fail closed when the corresponding internal token is absent or incorrect.
- Tokens are compared server-side and are not derived from request parameters.
- Sensitive internal actions validate required identifiers and state.
- Accounting ledger mutation endpoints require the dedicated Accounting internal token.
- Accounting reversal and hold mutations use database transactions and row locks.
- Admin gateway service tokens are not exposed to browser clients.

## Actor identity
- An Sarraf manual deposit credit requires an actor identity and persists it.
- Security-case release requires actor identity, actor role and a reason.
- Platform admin gateway supplies actor identity from the authenticated JWT rather than accepting it directly from the browser.
- Banner admin mutations inject the authenticated actor identity before forwarding.

## Findings
No confirmed privilege-escalation or internal-admin abuse vulnerability was identified in the reviewed source snapshot.

The shared internal bearer-token model is an intentional service trust boundary. Compromise of a service internal credential would provide that service's configured internal privileges; the current architecture does not implement per-call capability tokens between services. This is an architectural residual risk, not a confirmed application exploit.

No application behavior patch was required for this item.

## Residual limitations
This is a white-box source review. It does not prove network isolation, secret storage security, or resistance to a compromised production container. Those require runtime/infrastructure testing and secret-rotation verification.

## Status
Item 5 — internal/admin abuse and service trust-boundary audit — complete.