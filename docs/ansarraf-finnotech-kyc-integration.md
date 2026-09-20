# An Sarraf — Finnotech KYC contract

## Business rule

- KYC is requested only when a customer attempts the first deposit or withdrawal.
- The customer submits full name, national ID, mobile number, and optional birth date through the existing mobile/web flow.
- Finnotech is used only as an identity check: submitted information, national ID, and mobile-number ownership/match.
- Finnotech never makes the final business decision.
- Only an An Sarraf administrator may approve or reject the verification in the management panel.
- A customer may deposit or withdraw only when the internal KYC status is `VERIFIED`.

## Backend state machine

`KYC_REQUIRED -> PROVIDER_CHECKING -> ADMIN_REVIEW -> VERIFIED`

Failure paths:

- Provider mismatch: `REQUIRES_ACTION` or `PROVIDER_REJECTED`.
- Provider outage/configuration failure: `REQUIRES_ACTION`.
- Admin rejection: `REJECTED`.

The provider result is stored separately from the admin decision and all transitions are audited.

## Finnotech adapter boundary

Configure the provider integration through environment variables; never commit credentials:

- `KYC_PROVIDER_CODE=FINNOTECH`
- `KYC_PROVIDER_URL` — private adapter endpoint for the approved Finnotech operation
- `KYC_PROVIDER_API_KEY` — runtime secret
- `KYC_PROVIDER_TIMEOUT_MS`

The adapter endpoint must accept the normalized payload:

```json
{
  "fullName": "...",
  "nationalId": "10-digit national ID",
  "mobile": "09xxxxxxxxx",
  "birthDate": "YYYY-MM-DD"
}
```

It must return a normalized result:

```json
{
  "reference": "provider tracking reference or null",
  "status": "verified | rejected | review",
  "identityMatch": true,
  "mobileMatch": true,
  "statusCode": "provider code or null"
}
```

The adapter must map the official Finnotech API response into this contract and must not expose access tokens or raw sensitive payloads to the client.

## Admin API

- `GET /api/v1/admin/kyc` — roles `admin`, `super_admin`, `operator`
- `GET /api/v1/admin/kyc/:id` — roles `admin`, `super_admin`, `operator`; sensitive submitted data is available only to authorized admin users
- `POST /api/v1/admin/kyc/:id/decision` — roles `admin`, `super_admin`; requires `approve` and a non-empty reason

The final approval is intentionally enforced server-side and cannot be supplied by the customer app or Finnotech response.

## Production activation

Before enabling production traffic, configure the official Finnotech endpoint/credentials in the deployment secret store, run provider contract tests with sandbox credentials, and verify that the management panel calls the admin endpoints above. Do not enable a provider-controlled final approval state.
