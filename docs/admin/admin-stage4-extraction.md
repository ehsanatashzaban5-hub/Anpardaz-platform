# Admin Stage 4 — adapter extraction and legacy cleanup

Date: 2026-09-29

## Completed

The browser-facing Admin Backend adapter boundary now owns the extracted service families:
- An Sarraf: KYC, withdrawals, Forex Bot, security cases, manual Toman funding, fees.
- An Pardaz: cashback, Sayad, banking operations, operations/trace, financial center, card lifecycle, card lookup, user summary.
- An Banner: overview, listings, tickets, reports, alerts, templates, users, activity and audit.

The corresponding browser-facing ecosystem adapters were removed from services/platform/src/routes/admin-gateway.ts. Platform keeps only Platform-owned aggregation/control-plane capabilities (service health, cross-service user aggregation, operation trace) that are not domain-owned by one extracted service.

## Authorization

The Admin Backend performs the first authorization boundary and maps each extracted capability to a granular Platform permission. The Platform remains the identity and permission authority. Service credentials are server-side only.

## Audit

Successful non-read adapter operations generate an internal audit event and persist to admin_action_requests; the Admin Backend never writes PostgreSQL directly.

## Deliberate remaining Platform boundary

Hoosh/content/support/Market administration remains Platform-owned because those capabilities currently live in the Platform service. Their browser transport is still through the independent Admin Backend and Platform internal /internal/v1/admin/* APIs. They are not duplicated into another domain service merely to satisfy physical separation.

## Production rule

Do not delete the remaining Platform control-plane routes until a capability-by-capability regression run verifies the Admin Frontend against the owning service and the Platform-owned routes.