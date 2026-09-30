# Legacy table ownership audit

Status: read-only audit tooling and retirement plan. No legacy production table is dropped by this stage.

## Current ownership boundary

| Physical area | Current intended owner | Action |
|---|---|---|
| `platform` `platform_users`, forum tables, news/content, audit/support/notification/control-plane tables | Platform | Keep |
| `platform.categories` | Platform for `forum`/`content`; legacy Market/Banner rows may remain temporarily | Inventory rows, migrate dependent domain rows, then remove legacy rows and validate the ownership constraint |
| Market product/order/favorite/media/offer tables | Market | Destination is `market`; reconcile before retirement |
| Market data tables (`market_quotes`, `market_data_sources`, `market_data_symbols`, `market_data_observations`, `market_data_health`) | Market | Destination is `market`; reconcile before retirement |
| Hoosh conversation/message/usage/request tables | Hoosh | Destination is `hoosh`; reconcile before retirement |
| Financial Center / Finotac tables | Financial | Destination is `financial`; reconcile before retirement |
| Legacy An Pardaz Financial Center migrations 016/017/018/030 | Retired migration history | Do not recreate domain tables in An Pardaz |
| Platform legacy Market/Hoosh/Financial migrations | Retired/relocated migration history | Do not recreate domain tables in Platform |

## Required retirement sequence

1. Run `scripts/audit-legacy-ownership.ts` against the real source database with `--counts`.
2. Export the inventory, including foreign keys, before changing data.
3. Run the domain migration utility in dry-run mode.
4. Validate the destination schema against the production source shape; the migration tool must never silently treat a missing destination table as a successful migration.
5. Apply the migration in a transaction.
6. Re-run the inventory on both sides and reconcile row counts.
7. Reconcile deterministic content checksums for migrated rows and verify identity sequences.
8. Verify application/API dependencies and foreign keys no longer point at the legacy domain tables.
9. Only after the previous checks pass, create a separate controlled retirement migration for the exact legacy tables/rows.
10. Keep rollback/backup capability until post-cutover verification is complete.

## Explicit non-actions

- No production database is connected or modified by CI.
- No table is dropped based only on its name.
- No cross-domain foreign key is introduced.
- Mobile UI/routes are not changed by this stage.

The ownership classifier in the audit script is only triage metadata. It is not authorization to migrate or drop anything.
