# Admin Frontend Capability Audit — 2026-09-29

## Scope
Audited `apps/admin/src/AdminPanel.tsx` against the dedicated Admin Backend and Platform internal admin boundary.

### Result
- Admin tabs audited: **17**
- Frontend API path patterns audited: **59** after removing two unreachable Market export handlers.
- Direct Platform browser configuration: **none**
- Mock/demo/fixture/sample literals found in AdminPanel: **none**
- Admin Frontend transport: **Admin Backend only**
- Generic Admin Backend proxy: authenticated and protected by the Platform admin gateway token.
- Multipart upload: dedicated, allowlisted route for `content/videos`.

## Capability matrix

| Area | Frontend capability | Backend path | Status |
|---|---|---|---|
| Authentication | login / current admin | Admin Backend auth endpoints | OK |
| Overview | dashboard + ecosystem health | Platform internal admin | OK |
| User | cross-service user summary | Platform admin gateway | OK |
| Operation Trace | operation trace | Platform admin gateway | OK |
| An Sarraf KYC | list / approve / reject | An Sarraf admin API through gateway | OK |
| An Sarraf withdrawals | list / approve / reject / payout / reconcile | An Sarraf admin API through gateway | OK |
| An Sarraf security | list / release | An Sarraf admin API through gateway | OK |
| An Sarraf funding | manual Toman credit + history | An Sarraf admin API through gateway | OK |
| An Sarraf fees | create / close / list | An Sarraf admin API through gateway | OK |
| An Sarraf Forex Bot | request decisions | An Sarraf admin API through gateway | OK |
| An Pardaz | operations / cashback / banking | An Pardaz admin API through gateway | OK |
| An Pardaz cards | lifecycle / lookup | An Pardaz admin API through gateway | FIXED |
| Sayad | operations | An Pardaz admin API through gateway | OK |
| Banner | listings / tickets / reports / alerts / templates / users / audit | Banner admin API through gateway | OK |
| Market | stores / tickets / events / sources / sync / report / categories / activity / AI history | Platform internal admin | FIXED |
| Hoosh | overview / requests / tickets | Platform internal admin | OK |
| Content | policies / pipeline / videos / upload | Platform internal admin | OK |
| Support | tickets / reply / close | Platform internal admin | FIXED |

## Findings fixed in this audit

### 1. Card lookup HTTP method mismatch
The Admin Frontend sends card lookup as POST with a JSON body, while the Platform gateway route was registered as GET.

Fixed by changing the internal gateway route from GET to POST. The request body remains forwarded to the owning An Pardaz service.

### 2. Support admin routes bypassed the internal admin namespace
Support admin handlers were registered under `/api/v1/admin/support/*`, while the dedicated Admin Backend proxies browser admin traffic to `/internal/v1/admin/*`.

All four admin support handlers were moved to the internal namespace:
- `GET /internal/v1/admin/support/tickets`
- `GET /internal/v1/admin/support/tickets/:id`
- `POST /internal/v1/admin/support/tickets/:id/reply`
- `POST /internal/v1/admin/support/tickets/:id/close`

### 3. Market completion admin routes were outside the internal namespace
Market categories, activity, AI history, product types and activity export were registered under `/api/v1/admin/*`.

They were moved behind `/internal/v1/admin/market/*` so the browser continues to reach only Admin Backend.

### 4. Dead frontend code
Two unreachable Market CSV export handlers were removed from AdminPanel. They had no UI caller and therefore did not represent real Admin capabilities.

## Type/state cleanup
The AdminPanel tab union now explicitly contains all rendered tabs:

`overview, trace, kyc, withdrawals, funding, security, forexbot, user, market, hoosh, financial, anpardaz, sayad, ansarraf-fees, banner, content, support`

A duplicated An Pardaz tab loader was also removed.

## Architectural conclusion
The audited browser path is:

`Admin Frontend -> Admin Backend -> authenticated internal admin API -> owning service/domain logic`

The Admin Frontend does not connect directly to PostgreSQL or to a public Platform admin API.

## Remaining work for Stage 3
This audit intentionally does not physically remove the Platform admin adapters. They are still the transitional control-plane implementation behind the Admin Backend. Stage 3 will map each capability to its owning service and begin extracting these adapters into dedicated Admin Backend adapters without duplicating domain logic.