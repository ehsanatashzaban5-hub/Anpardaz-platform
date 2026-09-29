# White-box security audit — authentication and authorization map

Date: 2026-09-29
Scope: item 1 of the development-stage security plan — authentication, authorization, route exposure and privilege boundaries.

## Services reviewed

- `services/platform`
- `services/anpardaz`
- `services/ansarraf`
- `services/banner`
- `services/accounting`
- `apps/admin`

## Identity boundary

All authenticated service APIs use the Platform Identity JWT contract with EdDSA verification and issuer/audience validation. The principal identifier is the JWT `sub` identity UUID; client-supplied customer/user IDs are not accepted as an authentication substitute.

The following services revalidate an authenticated identity against authoritative state rather than trusting JWT validity alone:

- An Pardaz
- An Sarraf
- An Banner
- Platform

A disabled/non-active identity therefore cannot continue using an otherwise cryptographically valid token.

## Route classes

### Public routes

Only intentionally public functionality was found in the reviewed service entry points, including:

- health/status endpoints
- public news/content/market-data reads where applicable
- authentication registration/login/OTP flows
- Shaparak/Finnotech callback endpoints protected by their respective callback/state validation
- selected public catalog/read endpoints

Public routes were checked for accidental access to authenticated customer data. Customer-specific reads use authenticated identity/customer ownership predicates.

### Authenticated customer routes

Customer routes consistently use `preHandler: requireAuth` (or equivalent) and then resolve the customer from the authenticated identity.

Examples reviewed:

- An Pardaz accounts, cards, transfers, topups, financial center, cashback, customer profile and service operations
- An Sarraf wallets, orders, trades, deposits, withdrawals, KYC submission and funding
- An Banner profile, listings, messages/media and AI/category operations
- Platform user settings, Hoosh conversations/usage, Market orders/favorites and Banner user operations

Ownership predicates were specifically checked on representative object routes such as orders, trades, cards, listings, conversations and financial records.

### Administrative routes

Administrative API routes use authenticated identity plus an authorization boundary.

Examples:

- Platform admin routes use database-backed permissions such as `users.read`, `content.write`, `content.delete`, `approvals.write`, `service_health.read`, etc.
- An Sarraf admin routes use explicit role allowlists for KYC, fees, withdrawals, Forex Bot and provider funding.
- Self-approval protection exists for sensitive approval flows such as withdrawals and platform approval requests.

No reviewed admin route was found where a normal authenticated user could directly satisfy the admin check merely by supplying an `identityId`, `customerId`, `adminId` or similar request-body field.

### Internal service routes

Internal routes are not protected by end-user JWTs. They use service-to-service bearer tokens, for example:

- `ANPARDAZ_INTERNAL_TOKEN`
- `ANSARRAF_INTERNAL_TOKEN`
- `ACCOUNTING_INTERNAL_TOKEN`
- `BANNER_INTERNAL_TOKEN`

Reviewed internal endpoints included:

- identity introspection
- admin summaries and operational traces
- cashback policy/accrual
- manual funding
- order matching
- trade settlement
- security cases
- accounting integration

The internal guards compare the supplied bearer token with the configured service secret before processing the request.

## Findings

### Critical / High

No direct authentication bypass or privilege-escalation path was identified in this item during the white-box review.

### Medium / Low

No confirmed exploitable authorization defect was identified from the reviewed route registration and authorization boundaries.

The remaining security work must continue into the next items rather than treating this result as proof of complete security. In particular, object-level authorization, financial race conditions, idempotency/replay, input validation, SSRF/file handling and service-to-service abuse require adversarial testing beyond route-map inspection.

## Hardening already present and re-verified

- EdDSA JWT algorithm/type validation
- issuer/audience validation
- bounded JWT lifetime
- identity UUID validation
- active-identity revalidation
- role refresh from authoritative identity state
- customer ownership predicates on sensitive resources
- admin role/permission checks
- self-approval prevention on sensitive flows
- internal bearer-token checks
- production fail-closed environment requirements

## Test limitation

This item is a white-box source-level authorization audit. It is not an external black-box penetration test because there is no authorized production/staging attack surface being tested from the public Internet at this stage.

## Conclusion

Item 1 — authentication/authorization route mapping and privilege-boundary review — is complete for the current development snapshot. No confirmed auth bypass was left unpatched by this review. Further vulnerabilities, if any, are expected to be found in the subsequent adversarial object-access and business-logic tests rather than by repeating the same route inventory.
