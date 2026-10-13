# V2 Client State Machine

> Status: `TASK-V2-14 / IMPLEMENTED`

The implementation is `apps/client/miniprogram/platform/public-map-client.ts`. It exposes one immutable-shaped state snapshot and subscription API rather than unrelated booleans.

## Root request concurrency model

Every initial load, query/filter change, refresh, identity recovery, or cursor recovery increments `generation`. A response may commit only when both its captured generation and canonical `queryIdentity` still match current state. Therefore, if A, B and C return in the order C, A, B, only C can commit.

Pagination remains in the current root generation, captures `queryIdentity`, request ID and the exact current cursor, and commits only when all four still match. Only one page request can be active. A root request invalidates the page request ID.

## Detail concurrency model

Detail uses a separate `selectionGeneration`. Each marker selection and close increments it. A response commits only if its generation and `selectedPublicLeadId` match current selection, so a late Marker A response cannot overwrite Marker B.

## State continuity

- Root success replaces the first-page snapshot.
- Pagination success appends/deduplicates by `publicLeadId`.
- Pagination failure enters `PAGINATION_ERROR` without clearing data.
- Refresh failure with data enters `STALE_CACHE`, retains data and exposes retry.
- Cursor invalid/expired nulls the cursor and performs a fresh first-page request.
- `LEAD_UNAVAILABLE` invalidates cached detail, removes that public lead from current markers, and clears selection safely.
