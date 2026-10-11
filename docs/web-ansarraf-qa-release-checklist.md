# Web Portal / An Sarraf QA and Release Checklist

This checklist is the release gate for PR #92. It deliberately distinguishes code changes from checks that require a real browser, backend, or release operator. Do not mark a check complete without evidence from the target commit.

## 61–63: Help, Persian errors, and service availability
- [x] An Sarraf includes a guide/help destination in its existing navigation.
- [x] Web content/news/video requests show explicit Persian loading and server-error states rather than silently presenting an empty list after a failed request.
- [x] Content search trims surrounding whitespace and compares case-insensitively using Persian locale rules.
- [ ] Verify live backend availability and API health on the deployed staging environment; UI-only checks cannot establish service health.

## 64–73: Web/mobile parity and responsive behavior
- [x] Keep the existing mobile app source files untouched; this PR changes web-only files.
- [x] Web portal layout resets legacy mobile-root/body styles only while the web portal is mounted and restores them on unmount.
- [x] News/education/video content layout collapses to a single-column layout on narrow screens; category buttons become a responsive grid.
- [x] Support ticket columns use an auto-fit responsive grid.
- [x] An Sarraf forms and asset tables use the responsive/validation work documented in the PR description.
- [ ] Compare every web-visible financial action with the mobile app on staging, including login, KYC gating, order placement, deposits, withdrawals, transaction history, and session expiry.
- [ ] Confirm each action maps to a supported backend API; unsupported actions must remain unavailable and must not be simulated.
- [ ] Confirm no route accidentally exposes authenticated account data to a guest.

## 74–81: Build, runtime, and functional regressions
- [ ] Run the CI workflow for the latest PR head and confirm the web build succeeds.
- [ ] Inspect browser console and network requests on desktop and mobile viewport sizes; fix all uncaught errors and unexpected 4xx/5xx responses.
- [ ] Verify direct navigation and return navigation for home, An Sarraf, markets, trade, assets, deposits, withdrawals, orders, transactions, security, support, and guide.
- [ ] Verify market data and order book use live backend responses only; API outage must not display fabricated prices or balances.
- [ ] Verify trade validation rejects invalid amount/price, insufficient balance, unsupported order type, and incomplete KYC.
- [ ] Verify Toman and crypto deposit/withdrawal forms reject invalid inputs and show backend rejection messages.
- [ ] Verify KYC status transitions do not cause React hook-order errors and protected routes require a valid session.
- [ ] Search the rendered web experience and changed files for mock/demo/fallback financial data; confirm no such data is used as production truth.

## 82–85: Device, security, review, and release
- [ ] Manually inspect at 360px, 390px, 768px, 1024px, and 1440px viewport widths, including RTL overflow and keyboard focus.
- [ ] Confirm Security Policy Regression Gate, An Sarraf integration CI, An Sarraf Release Gate, Docker Runtime Validation, and general CI all pass on the latest PR head.
- [ ] Resolve the existing Security Analysis/dependency-audit failure or document an approved, scoped exception before merge; do not bypass the gate silently.
- [ ] Review the final diff and confirm only intended web files changed; mobile UI, production data, and VPS files remain untouched.
- [ ] Merge only after required checks pass. Deploy the exact merged SHA through the established VPS deployment process, then run smoke checks for HTTPS, health, portal layout, live market data, authentication, and funding routes.

## Evidence
Record the tested commit SHA, CI run links, browser/device matrix, API results, reviewer decision, and post-deployment smoke-test results in the PR before release. A checklist entry is not evidence by itself.
