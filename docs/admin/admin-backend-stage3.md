# Admin Backend Stage 3 — owning-service adapter boundary

The Admin Backend now owns browser-facing routing for service-owned admin operations.

## Adapter rules
- Browser -> Admin Backend only.
- Admin Backend authenticates the Platform identity token before adapter dispatch.
- Admin Backend selects the owning service and service-internal credential; credentials never reach the browser.
- Admin Backend forwards admin identity/role as server-side headers for owning-service audit/context.
- Platform remains the identity authority; domain services remain the domain-authority and data owner.
- No Admin Backend route connects to PostgreSQL.

## Extracted service families
- An Sarraf: KYC, withdrawals, Forex Bot, funding security, manual deposits, fees.
- An Pardaz: cashback, Sayad, banking operations, service operations, operation trace, financial center, card lifecycle/lookup, user summary.
- An Banner: overview and all existing internal admin resources under the Banner adapter boundary.

## Transitional boundary
Platform's legacy admin-gateway adapters remain for non-extracted Platform-owned operations and as a rollback path. They are no longer the browser-facing transport for the extracted service families. They must only be removed after Stage 4 coverage tests prove every AdminPanel action resolves through the new adapters.
