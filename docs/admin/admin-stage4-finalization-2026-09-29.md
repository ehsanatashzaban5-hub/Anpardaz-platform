# Admin Stage 4 — final Platform boundary

## Completed
- Extracted Platform-owned orchestration previously implemented in the legacy `admin-gateway.ts` for ecosystem health, user summary, and operation trace into the independent Admin Backend.
- Service-owned Admin operations remain behind the Stage 3 Admin Backend adapters.
- Platform-owned Admin modules (content, Hoosh, Market, support, moderation, settings, approvals, reconciliation, etc.) remain on Platform because Platform owns their data/domain; the browser still reaches them only through Admin Backend.
- Removed registration and deleted the obsolete Platform `admin-gateway.ts` adapter layer. No browser-facing Admin route depends on it.
- Added Accounting service credentials to Admin Backend configuration for cross-service user/trace orchestration.
- Admin Backend continues to have no PostgreSQL connection.

## Security boundary
Browser -> Admin Frontend -> Admin Backend -> authenticated Platform/domain service APIs -> owning DB.

Admin Backend performs identity authorization, capability routing, server-side credentials, timeout/error isolation and audit for extracted service write actions. Domain services retain business rules and data ownership.

## Remaining Platform routes
These are intentionally Platform-owned and are not duplicated in Admin Backend: content management, Hoosh control/support, Market control/reporting, support, moderation, settings, approvals, reconciliation, and other Platform data operations. They are internal-only and are reached through the Admin Backend generic internal proxy.

## Deletion gate
The legacy cross-service gateway has been removed only after the three extracted families plus health/user/trace orchestration were covered. No Platform DB logic was copied into Admin Backend.
