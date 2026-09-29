# White-box BOLA / IDOR audit — 2026-09-29

Scope: security item 2 — object-level authorization (BOLA/IDOR) across authenticated customer APIs.

## Reviewed boundaries

### An Pardaz
Checked account, card, transfer, card-registration and Financial Center object access.

Confirmed ownership predicates include the authenticated customer identity for customer-owned resources, e.g.:

- account transactions: account id + customer id
- cards: card id + customer id
- card registration sessions: session id + customer id
- financial notifications: notification id + customer id
- Financial Center cards/transactions: customer id + card/customer relationship

Cross-customer destination accounts are intentionally addressable by account id for transfers, but the source account is explicitly required to belong to the authenticated customer. The destination is validated as an account record rather than being treated as an authenticated user's owned resource.

### An Sarraf
Checked wallets, orders, trades, deposits, withdrawals, cancellation, approval and settlement paths.

Confirmed customer-owned reads/mutations use customer identity/customer id predicates. Examples:

- orders: order id + customer id
- order cancellation: order id + customer id
- order trades: order id joined to order customer id
- deposits/withdrawals: customer id
- withdrawal cancellation: withdrawal id + customer id
- wallet mutations are resolved from authenticated customer + asset

Administrative withdrawal/provider settlement paths are separately role-gated and intentionally operate across customers.

### An Banner
Checked listings, media, favorites, recent views, inquiries, messages, tickets and notifications.

Confirmed ownership/participant predicates include:

- listing update/delete: listing id + owner identity
- media delete: media id + owner identity
- notifications: notification id + identity
- inquiries: inquiry id + buyer/seller identity
- inquiry replies: inquiry id + buyer/seller identity
- tickets: ticket id + owner identity
- favorites/recent views: authenticated identity is the actor

Public listing reads are intentionally public and do not expose customer-private records.

### Platform
Checked Hoosh conversations/projects, support tickets, forum resources and Market user history.

Confirmed:

- Hoosh conversations/projects require identity ownership on object lookup/mutation.
- Project/conversation linking checks both project ownership and conversation ownership.
- Support tickets require ticket id + authenticated user id for customer reads/replies.
- Forum creation always derives the platform user from the authenticated identity; client cannot choose another user id.
- Market AI history is scoped to the authenticated platform user.

## Adversarial IDOR cases checked

The source was inspected specifically for client-controlled:

- `customerId`
- `userId`
- `identityId`
- `accountId`
- `orderId`
- `cardId`
- `listingId`
- `conversationId`
- `ticketId`
- `messageId`

The important pattern was not merely the presence of an id check, but whether the id was joined/filtered against the authenticated principal before returning or mutating the resource.

## Findings

No confirmed exploitable BOLA/IDOR vulnerability was identified in this item.

One deliberate cross-user operation exists in An Pardaz transfers: a user may select another account as the transfer destination. This is not an IDOR because the source account is ownership-checked and the destination is a transfer target rather than a private resource read/update.

Administrative/internal endpoints that accept actor/customer identifiers are protected by administrative role/permission or internal service authentication. They are not ordinary end-user object APIs.

## Required follow-on

This item does not prove financial safety. The next adversarial layer must test race conditions, replay/idempotency, balance reservation, state transitions and transaction/accounting consistency, because a system can pass object-ownership checks while still allowing a business-logic exploit.

## Status

Item 2 — BOLA/IDOR white-box audit — complete for the current development snapshot. No application patch was necessary because no confirmed object-level authorization bypass was found.
