# White-box rate-limit and abuse audit — 2026-09-29

## Scope
Security item 7: brute-force resistance, authentication throttling, API abuse controls, replay pressure and high-cost endpoint rate limiting.

## Findings

### Platform authentication
- Password registration: 5 attempts per minute per IP+identity key.
- Password login: 10 attempts per minute per IP+identity key.
- Phone OTP request: 3 per minute per IP+phone plus 5 per minute per phone.
- OTP verification: 10 per minute per IP+phone.
- Each OTP challenge has a maximum of 5 verification attempts and expires after 2 minutes.
- OTP challenges are consumed/locked transactionally.
- Rate-limit keys are hashed and persisted in PostgreSQL.
- Old authentication rate-limit records are cleaned after 24 hours.

### An Pardaz financial/security endpoints
- Sensitive POST endpoints have database-backed per-minute limits keyed by scope, client IP and authenticated identity.
- Current protected scopes include transfers, topups, card balance, card registration and device-security operations.
- Device-security sessions expire after 15 minutes.
- Security-rate records are periodically cleaned.
- The service also enforces the Iran production-origin policy before protected financial routes.

### An Hoosh
- Media generation is limited to 10 jobs per identity per minute.
- Media requests require idempotency keys.
- Media generation is additionally bounded by worker attempts/leases and server-side model capability checks.

### An Sarraf
- Trading and withdrawal paths have transactional balance/reservation/idempotency controls already covered by the financial-logic audit.
- No generic application-wide request throttle was found on every authenticated POST route.
- This is a hardening gap for volumetric abuse, but no authentication bypass, balance bypass, or duplicate-settlement exploit was established by the white-box review.
- Existing business controls prevent a rate-limit omission from becoming a confirmed double-spend issue in the reviewed trading paths.

### An Banner / Platform support
- Authenticated ownership and state checks exist on messaging, listings and support mutations.
- No generic per-user throttle was found on every messaging/support mutation.
- This represents an abuse-hardening opportunity (spam/resource exhaustion), not a confirmed authorization or accounting vulnerability.

## Assessment
No confirmed exploitable brute-force authentication bypass, OTP bypass, duplicate financial execution, or privilege escalation was identified.

The main residual issue is uneven rate-limit coverage: authentication and high-risk An Pardaz/Hoosh flows have explicit throttles, while some lower-level authenticated content/support/messaging routes rely primarily on authentication, ownership and payload limits.

Because introducing a broad database-backed throttle into all independent services would alter traffic semantics and operational capacity without evidence from runtime load testing, no application behavior patch was made in this white-box item.

## Recommended runtime stage
The later abuse/fuzzing stage should exercise:
- credential spraying from rotating source IPs;
- OTP request/verify bursts;
- simultaneous order/withdrawal submissions;
- Banner inquiry/message/ticket floods;
- Hoosh media job floods;
- large concurrent request bodies;
- proxy/IP-header manipulation under the production reverse proxy.

## Status
Item 7 complete — white-box rate-limit/abuse audit recorded.
