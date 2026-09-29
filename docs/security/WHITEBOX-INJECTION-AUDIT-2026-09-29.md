# White-box injection audit — 2026-09-29

Scope: security item 3 — SQL injection, command injection and unsafe query construction.

## SQL injection review

The reviewed services use PostgreSQL parameter binding for request-controlled values. Representative sensitive queries use placeholders such as `$1`, `$2`, etc., including:

- customer/account/card lookups
- An Sarraf orders, trades, wallets, deposits and withdrawals
- Banner listings, inquiries, tickets and media
- Platform user/content/support data
- Accounting ledger accounts, journal transactions and balances

Dynamic SQL fragments that remain in the code are constrained rather than populated directly from arbitrary user input.

Examples:

- Banner listing ordering maps the client sort value to a fixed server-side SQL expression.
- Pagination values are converted to numbers and bounded before being passed as parameters.
- Accounting account-code prefixes use `LIKE $1 || '%'`, not string concatenation into the SQL statement.
- Accounting ledger transaction fields and metadata are inserted through parameters.
- Internal route path parameters are decoded, length-checked and then parameter-bound.

## Command/code injection review

A repository-wide source search for common command execution and dynamic-code primitives was performed, including:

- `child_process`
- `exec(`
- `spawn(`
- `eval(`
- `new Function`

No confirmed application use of these primitives was found in the reviewed service source.

## Dangerous query construction

No confirmed request-controlled SQL fragment was found that could directly alter SQL syntax.

The most security-sensitive dynamic query construction found uses an allowlist or fixed SQL structure. No `ORDER BY`, `LIMIT`, table name, column name or SQL operator was found to be directly sourced from untrusted input without a server-side constraint.

## Input boundaries

Additional defensive constraints observed during this review include:

- bounded pagination
- bounded identifier lengths
- numeric/safe-integer validation where applicable
- strict currency/amount formats in accounting
- controlled enum values for statuses, directions and account types
- parameterized UUID/identity filters
- bounded text fields
- internal-service authentication before accounting mutation endpoints

## Findings

No confirmed SQL injection, command injection or dynamic-code execution vulnerability was identified in this item.

No application patch was required for this item.

This is a white-box source review; it does not replace runtime payload fuzzing against a deployed test instance.

## Follow-on

The next security item should move from injection syntax to business-logic abuse: replay/idempotency, race conditions, double-spend, state-transition bypasses and accounting consistency. These attacks can succeed even when SQL injection is fully mitigated.

## Status

Item 3 — injection white-box audit — complete for the current development snapshot.
