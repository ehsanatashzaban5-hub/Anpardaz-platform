# Admin Stage 9 — Identity Spoofing / Attack-Chain Hardening

Date: 2026-09-29

## Finding

The Admin Backend correctly authenticates the browser administrator and forwards the trusted administrator identity in `x-admin-identity` to owning services. The Banner internal admin routes, however, previously accepted `adminIdentityId` / `actorIdentityId` supplied in the request body/query and used those values for audit attribution and privileged mutations.

That created an identity-attribution spoofing path: a caller that reached the internal Banner boundary with a valid service token could select another administrator identity for the recorded actor. Browser administrators could also send a conflicting body value; the owning service should never trust that value over the gateway identity.

## Fix

Banner internal admin write/audit attribution now derives the actor exclusively from `x-admin-identity` supplied by the Admin Backend. Body/query actor identity fields are no longer trusted.

Affected operations include alert resolution, message-template creation/update, user messages/restrictions/ban/unrestrict, listing moderation, ticket reply/status, report review, and user-history export.

## Attack-chain invariant

Browser → Admin Frontend → Admin Backend authorization → owning service internal token + trusted admin identity → DB.

A browser-supplied actor identity is not an authorization or audit identity.

## Remaining production verification

Runtime penetration testing still requires the deployed VPS environment and real production credentials/configuration. CI/runtime results must be reported only from observed runs.
