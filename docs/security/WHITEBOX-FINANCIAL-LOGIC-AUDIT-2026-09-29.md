# White-box financial business-logic audit — 2026-09-29

Scope: security item 4 — replay/idempotency, race conditions, double-spend, reservation integrity, state transitions and accounting consistency.

## An Sarraf

### Order creation
- Client idempotency keys are validated and bound to the authenticated customer.
- Existing orders are locked with `FOR UPDATE`.
- Reuse with a different request fingerprint is rejected.
- Wallet creation/reservation occurs in the same database transaction as order creation.
- The available balance decrement is conditional on `available_balance >= amount`.
- Reservation rows are created atomically.
- Matching starts only after the order transaction commits.

### Cancellation
- The order row is locked with `FOR UPDATE`.
- Only open/partially-filled orders are cancellable.
- The active wallet reservation is locked before release.
- Provider-backed cancellation is converted into an idempotent provider outbox event.
- Local release uses an invariant-checked wallet update.

### Matching and settlement
- Settlement locks both orders in deterministic ID order, preventing buyer/seller lock-order deadlocks.
- Both wallet reservations are locked.
- Both wallets are locked deterministically.
- Self-trading is rejected.
- Remaining quantities and quote amounts are calculated by PostgreSQL NUMERIC.
- Settlement has an idempotency key checked inside the transaction.
- Reservation consumption and wallet movements happen atomically.
- Accounting outbox insertion is part of the same transaction.
- Provider execution uses cumulative execution deltas, regression quarantine and settlement uniqueness.
- Provider outbox processing uses `FOR UPDATE SKIP LOCKED` and stale-processing recovery.
- Ambiguous provider submission is reconciled before a new submission to avoid duplicate external orders.
- Provider settlement uses cumulative quantities and a uniqueness constraint for already-settled execution slices.

### Withdrawals
- Withdrawal idempotency is checked under row locking.
- The wallet is locked before the balance is debited.
- The debit is conditional on sufficient available balance.
- The debit and withdrawal reservation are committed together.
- Administrative completion locks the withdrawal and reservation before releasing the wallet lock.
- Accounting posting uses its own idempotency key.

### Quote locks
- Active quote locks are locked by order before creation.
- Quote consumption is an atomic conditional update requiring ACTIVE status and a non-expired timestamp.

## An Pardaz banking

### Transfers/topups
- Requests are customer-bound.
- Source accounts are ownership-checked.
- Internal destinations are validated.
- Idempotency keys and request fingerprints prevent semantic replay.
- Database uniqueness handles concurrent duplicate submissions.
- Banking provider operations use an outbox.
- Provider workers claim outbox rows with `FOR UPDATE SKIP LOCKED`.
- Provider-completed operations are reconciled to accounting rather than executed again.

### Internal transfer double-spend protection
The internal transfer worker checks the source liability balance before posting. More importantly, the Accounting service's `assert_journal_transaction_sufficient` locks affected liability accounts with `FOR UPDATE` while validating the current posted balance. This serializes concurrent debits against the same customer liability account and prevents two concurrent transfers from both consuming the same balance.

### Provider side effects
Completed provider operations are explicitly reconciled through Accounting using stable idempotency keys. This avoids re-submitting an external transfer solely because a later Accounting/finalization step failed.

## Accounting

- Journal transaction creation and entries occur inside a database transaction.
- Idempotency keys are checked and protected by database uniqueness.
- Request hashes prevent reusing an idempotency key with a different transaction payload.
- Journal balance is validated before posting.
- Liability sufficiency is checked while locking the affected liability accounts.
- Holds have unique active references and state-integrity triggers.
- Accounting posting therefore provides the authoritative serialization boundary for customer liability balances.

## State-transition review

The reviewed financial flows reject invalid terminal-state transitions in the application logic and/or use conditional updates:
- orders: open/partially-filled/cancelled/filled
- wallet reservations: active/captured/released
- withdrawals: pending/approved/processing/completed
- provider orders: requested/processing/filled/cancelled/rejected
- banking transfers: pending/processing/completed/failed/cancelled/manual-review
- accounting holds: active/released/captured/cancelled

## Findings

No confirmed exploitable double-spend, replay, race-condition or accounting-consistency vulnerability was identified in the reviewed source snapshot.

No application patch was required for this item.

## Residual limitation

This is a white-box source and invariant review. It does not replace concurrency testing against a live isolated test database/provider sandbox. Such runtime testing remains part of the later fuzzing/attack-chain stage.

## Status

Item 4 — financial business-logic/race/idempotency/accounting audit — complete.
