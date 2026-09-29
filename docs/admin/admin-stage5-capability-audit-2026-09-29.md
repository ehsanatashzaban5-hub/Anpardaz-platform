# Admin Stage 5 — capability and production-boundary audit

Date: 2026-09-29

## Scope
The Admin Frontend was traced against the independent Admin Backend and then against Platform/domain-service ownership. The audit covers authentication, overview, Platform content/operations, Hoosh, Market, Support, Moderation, An Sarraf, An Pardaz, Banner, Accounting orchestration and uploads.

## Findings resolved in this stage
1. Generic Platform admin proxy requests now receive a capability-specific permission before dispatch instead of falling back to only `admin.read/admin.write`.
2. Hoosh permissions were aligned with the actual Platform contracts: `hoosh.read`, `hoosh.manage`, `hoosh.support.read`, `hoosh.support.manage`.
3. Support permissions were aligned with the actual Platform contract: `support.read` / `support.write`.
4. Moderation routes require `content.moderate` through the Platform contract.
5. Content video upload now requires `content.write` at the Admin Backend boundary.
6. Approvals, reconciliation, maintenance, settings, service health, content/news/banner/forum and Market operations have explicit capability mapping.
7. No direct Platform API configuration remains in Admin Frontend.
8. No `mock`, `demo`, `fixture`, or `sample` literals were found by repository search for the audited Admin boundary.

## Ownership model
- An Sarraf: Admin Backend adapter -> An Sarraf API -> An Sarraf DB.
- An Pardaz: Admin Backend adapter -> An Pardaz API -> An Pardaz DB.
- Banner: Admin Backend adapter -> Banner API -> Banner DB.
- Platform-owned admin domains: Admin Backend -> authenticated Platform internal API -> Platform DB.
- Accounting: only through authenticated service API; Admin Backend has no PostgreSQL connection.

## Security properties
- Browser never receives service-internal credentials.
- Admin identity is established by Platform authorization.
- Service adapters use server-side internal credentials.
- Capability permissions are checked before proxy dispatch.
- Existing domain-level permission checks remain in place as defense in depth.
- Multipart is allowlisted to the video upload endpoint.
- Admin requests remain behind the Iran-IP production policy and security headers.

## Result
The Admin boundary is now capability-aware across the audited Platform routes rather than relying on a generic read/write role check. Domain ownership and business rules remain in their owning services. No mock/admin-demo transport was retained in the audited Admin frontend boundary.

CI status must be treated independently from this static/code audit; no workflow result is claimed unless GitHub reports it.
