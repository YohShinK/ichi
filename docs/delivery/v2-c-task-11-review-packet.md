# TASK-V2-11 Review Packet

> Historical implementation-review snapshot. The `AWAITING_FOUNDER_FINAL_REVIEW` state below was superseded on 2026-09-13 by the Founder's explicit `APPROVE AS RECONCILED`; current status is `COMPLETE / HUMAN_APPROVED`. Evidence history is intentionally unchanged.
>
> Status: `IMPLEMENTATION_COMPLETE / AWAITING_FOUNDER_FINAL_REVIEW`
>
> `EXECUTION_COMPLETE_UNDER_FOUNDER_BATCH_PREAUTHORIZATION = YES`

## Scope

Implemented a local monotonic PublicMapLead projector, dynamic Freshness evaluator and public-safe PLAYER contributor projection. It is a server-side reference implementation and is not connected to CloudBase resources or deployment.

## Files changed

- `packages/v2-map/src/projector.ts`
- `packages/v2-map/src/avatar-projection.ts`
- `packages/v2-map/src/index.ts`
- `packages/v2-map/src/task-v2-11.test.ts`
- `packages/v2-map/src/v2-c-completion-reconciliation.test.ts`

## Implementation architecture

- Reconciliation consumes the complete currently eligible support set for one BoardInstance.
- All frozen gates must pass and PublicLocation must exist before materialization.
- Continuous A→B support advancement preserves `publicLeadId` and monotonically advances `servedVersion`.
- No support retires the lead and strips the retained tombstone to minimal no-resurrection fields.
- Later republication requires an injected new opaque ID; retired/colliding IDs throw closed.
- Late event sequence is discarded before state mutation.
- Freshness is computed from `observedAt + asOf + policyVersion`; no relative-time string is persisted.
- `PrivateAvatarUrlIssuer` is the server-trusted delivery port: V1 `profiles.avatarFileId` stays private/stable, while a short-lived allowlisted HTTPS locator is returned to public detail. Arbitrary profile HTTPS input is ignored; invalid/missing/expired/deleted profiles use the ICHI fallback.
- `PublicContributor` and `PublicCandidate` carry runtime brands at their construction boundaries, so callers cannot promote an arbitrary HTTPS URL or a hand-written candidate into projection.

## Inherited frozen contracts

Opportunity/Freshness/recordType remain independent. Rights and authorization are checked per current support. No board image, private Profile ID, avatar fileID, raw location or resolver evidence enters the core.

## Tests and automated validation

- TASK-V2-11 targeted tests: `1 file / 6 tests PASS`.
- Completion reconciliation avatar tests: `5 tests PASS`.
- TypeScript workspace typecheck: PASS.
- Frozen R2/security regression: `1 file / 16 tests PASS`.
- Covered stable ID A→B, A deleted while B remains, retire/new lifecycle, collision/no-resurrection, late event discard, current authorization failure, Profile fallback and dynamic Freshness.

## Security/privacy review

Projection starts from typed public fields rather than copying a private object. Retired core removes board/location/Profile payload. Profile authorization is required. Private CloudBase avatar references are consumed only by the trusted issuer and never serialized; Storage ACL remains owner-only.

## V1 regression and R2 hash result

V1 runtime was not edited. Canonical R2 Prompt/Schema/Resolver hashes remain the approved `c083066c… / 178c3fff… / 46ffebad…` and the 16-test assertion passes.

## Production action

`deploy / migration / backfill / collection-index mutation / Storage-ACL mutation / commit / push / publish = NO`

## Unresolved decisions

No new founder decision. Exact Freshness thresholds remain injected policy and later pilot calibration. Projector/avatar issuer persistence and CloudBase wiring are TASK-V2-19 integration evidence; actual deploy/migration remains TASK-V2-22 after TASK-V2-21 pilot/RC validation.

## Batch continuation gate

`H1_TO_H9 = CLEAR`

`TASK_V2_11 = IMPLEMENTATION_COMPLETE / AWAITING_FOUNDER_FINAL_REVIEW`

`FOUNDER_FINAL_REVIEW = REQUIRED`
