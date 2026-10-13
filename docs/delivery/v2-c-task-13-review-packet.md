# TASK-V2-13 Review Packet

> Historical implementation-review snapshot. The `AWAITING_FOUNDER_FINAL_REVIEW` state below was superseded on 2026-09-13 by the Founder's explicit `APPROVE AS RECONCILED`; current status is `COMPLETE / HUMAN_APPROVED`. Evidence history is intentionally unchanged.
>
> Status: `IMPLEMENTATION_COMPLETE / AWAITING_FOUNDER_FINAL_REVIEW`
>
> `EXECUTION_COMPLETE_UNDER_FOUNDER_BATCH_PREAUTHORIZATION = YES`

## Scope

Implemented a local PublicMapLead viewport/detail service with silent trusted Account guard, public GCJ-02 query plan, exact bbox filtering through the repository boundary, short-lived snapshots, authenticated opaque cursors, visibility recheck, explicit marker/detail allowlists, dynamic Freshness, rate/global stop and stable errors. No Cloud Function was deployed or added to the production manifest.

## Files changed

- `packages/v2-map/src/public-api.ts`
- `packages/v2-map/src/index.ts`
- `packages/v2-map/src/task-v2-13.test.ts`
- `packages/v2-map/src/v2-c-completion-reconciliation.test.ts`

## Implementation architecture

- `PublicLeadRepository` and `QuerySnapshotStore` are server-only ports; local in-memory adapters provide deterministic tests.
- `ViewportRequest`/`DetailRequest` contain no trusted account, global-stop, rate-count or HMAC-secret facts. `TrustedPublicAccountPort`, `RateLimitStore`, `PublicMapReadControl` and `CursorSecretSource` are injected server authority.
- `RateLimitStore` is a durable-capable shared port; the in-memory implementation is explicitly a local shared reference adapter and is not a production authority.
- D09 pilot defaults are page 50, snapshot cap 500 and TTL 120 seconds.
- Cursor exposes only random snapshot handle, offset and HMAC; bbox/filter/account/schema/asOf remain server-side bindings. Missing or shorter-than-32 server secrets fail closed with stable unavailable, and client secret injection has no effect.
- Every snapshot reference rechecks current visibility before serialization.
- Marker and detail serializers construct new allowlisted objects.
- Geo plan declares CloudBase `geoWithin`, `publicLocation.point` geo-index requirement and an exact server check.
- No shared response cache exists.

## Inherited frozen contracts

Silent Account without Profile gate; PublicMapLead-only reads; Opportunity/Freshness/recordType separated; no client private DB read; no public image; no Tencent POI dependency; retired/withdrawn detail returns generic unavailable.

## Tests and automated validation

- TASK-V2-13 targeted tests: `1 file / 9 tests PASS`.
- Completion reconciliation trusted-read tests: `5 tests PASS`.
- TypeScript workspace typecheck: PASS.
- Frozen R2/security regression: `1 file / 16 tests PASS`.
- Covered initial/empty/page, 50-item paging, query/asOf binding, 120-second expiry, visibility recheck, no PublicLocation, detail unavailable, identity/schema/viewport/runtime-filter/rate/global stop, minimum cursor secret strength, overlap-ready metadata, late generation and loaded-data retention on page error; reconciliation additionally covers shared account-bound budget across service instances/devices, rate-store unavailable, missing/disabled server read control, client override rejection and missing/short/injected secrets.

## Security/privacy review

The negative fixture injected owner/account, private record/board/submission, raw location/accuracy, Verification/Rights/moderation/resolver evidence, raw draw events, board image and network URL. Public serialization leakage count was `0` across all injected classes.

## V1 regression and R2 hash result

V1 runtime was not edited. Canonical R2 Prompt/Schema/Resolver hash assertions remain PASS.

## Production action

`deploy / migration / backfill / collection-index mutation / Storage-ACL mutation / commit / push / publish = NO`

## Unresolved decisions

No new founder semantic decision. Real CloudBase account/rate/read-control/secret adapters plus index/migration rehearsal are TASK-V2-19; candidate/pilot validation is TASK-V2-20/21; actual resource apply, deploy and production secret binding are TASK-V2-22. Latency/cost remain TASK-V2-18/21 gates.

## Batch continuation gate

`H1_TO_H9 = CLEAR`

`TASK_V2_13 = IMPLEMENTATION_COMPLETE / AWAITING_FOUNDER_FINAL_REVIEW`

`FOUNDER_FINAL_REVIEW = REQUIRED`
