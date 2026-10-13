# V2-C Safe Batch Review

> Review scope: `TASK-V2-09—13`
>
> Canonical block status: `COMPLETE / HUMAN_APPROVED`
>
> Final approval basis: 2026-09-13 `V2-C_to_V2-D_Knowledge_Alignment_State_Transition.txt`
>
> Date: 2026-09-13

## 1. Batch outcome

TASK-V2-09 and D09-01—13 were already `COMPLETE / HUMAN_APPROVED`. Under the founder's explicit safe-batch preauthorization, TASK-V2-10—13 local server-side reference implementations, isolated tests and individual review packets were completed. Completion Reconciliation then closed the code-level ownership and security gaps. On 2026-09-13 the Founder explicitly approved TASK-V2-10—13 `AS RECONCILED` and approved `V2_C_RECONCILIATION=PASS`.

V2-C is now `COMPLETE / HUMAN_APPROVED`. This approval does not claim production deployment, migration, resource application, true-device evidence or pilot completion. The separate Knowledge Alignment Review unlocks only TASK-V2-14; TASK-V2-15—22 remain locked.

## 2. TASK-V2-09 approval and D09 baseline

The approved serving baseline is:

- hybrid materialized public-safe core plus request-time service envelope;
- logical Cloud Function query/detail transport with silent trusted Account;
- server-only GCJ-02 geo query plus exact bbox check;
- short-lived server snapshot and opaque authenticated cursor;
- no server identity merge and no shared MVP response cache;
- account-bound rate limits and global read stop;
- shadow-first migration and disable/hide-first rollback.

D09-07 remains a pilot default, not a permanent production constant. D09-11 remains an operational cost target, not permission to weaken correctness or security.

## 3. TASK-V2-10 status

`COMPLETE / HUMAN_APPROVED AS RECONCILED`

Implemented source-specific V1 `VerificationInput`, branded immutable `VerifiedBoard`, exact-version `OpportunityEvaluation`, no-bypass `PublicCandidate` builder, VerifiedBoard-only Conservative Unique Continuation, append-only BoardInstance association corrections, bounded Human Assistance evidence, versioned authorization applicability and owner hide-first withdrawal/delete commands. One accepted owner/version cannot be silently overwritten with a different scope digest.

Targeted result: `1 file / 11 tests PASS`; reconciliation hard-gate result: `8 tests PASS`.

## 4. TASK-V2-11 status

`COMPLETE / HUMAN_APPROVED AS RECONCILED`

Implemented full-support-set reconciliation, monotonic servedVersion, stable active publicLeadId, retire/no-resurrection, late-event discard, dynamic Freshness and server-trusted contributor/avatar projection. V1 private `avatarFileId` is passed only to a trusted short-lived URL issuer; arbitrary HTTPS profile input is not trusted, and missing/invalid/expired/deleted cases fall back safely.

Targeted result: `1 file / 6 tests PASS`.

## 5. TASK-V2-12 status

`COMPLETE / HUMAN_APPROVED AS RECONCILED`

Implemented explicit Reporter/Moderator/Owner authority ports, trusted reporter binding, same trusted account across devices deduplication, policy-versioned distinct-report auto-hide, server-classified credible-notice early hide, owner withdrawal precedence, authorized moderation decisions and minimal retained audit facts. Client-supplied eligibility/spam/moderator/credible/identity fields are ignored. Moderation never changes Verification or performs threshold-based destructive deletion.

Targeted result: `1 file / 5 tests PASS`.

## 6. TASK-V2-13 status

`COMPLETE / HUMAN_APPROVED AS RECONCILED`

Implemented repository/snapshot ports, server-derived Account port, durable-capable shared rate-store port, server-controlled read-stop port and server-only cursor-secret port; plus public GCJ-02 geoWithin plan, exact bbox filtering, bounded snapshots/pages, account/query/asOf-bound HMAC cursors, visibility recheck, allowlist serializers, Freshness, stable errors and late-generation handling. Client requests carry none of the trusted authority facts. Missing authority, unavailable rate store and missing/short secret fail closed.

Targeted result: `1 file / 9 tests PASS`; reconciliation trusted-read result: `5 tests PASS`.

## 7. Implementation architecture and V1→V2 mapping

```text
source-specific V1 authoritative input
  -> VerificationInput
  -> ICHI Verification -> exact-version VerifiedBoard
  -> VerifiedBoard-only BoardInstance candidate/resolution/association
  -> exact-version OpportunityEvaluation + independent public gate PASS
  -> versioned authorization + per-record Rights/Eligibility
  -> branded PublicCandidate builder (no direct construction)
  -> monotonic PublicMapLead public-safe core
  -> moderation/current visibility
  -> bounded viewport/detail service envelope
```

`PublicMapLead` remains one-way public projection. It cannot become a private truth source or BoardInstance resolver input. The implementation is contained in `packages/v2-map/` and is not imported by the V1 mini-program or production CloudBase runtime.

DRAW_RECORD reads P1 only when it points to the exact current `APPROVED` drawSubmission and takes its authoritative finalSnapshot. UPLOAD_RECORD reads the finalized direct P1 and its user-confirmed/corrected snapshot without requiring an assisted submission. Both outputs are private Verification inputs, preserve `null != 0`, and never become automatic public PASS.

## 8. Files by task

- TASK-V2-09: `docs/research/v2-c/v2-query-security-resource-migration-contract.md`, `docs/delivery/v2-c-task-09-review-packet.md`.
- TASK-V2-10: `types.ts`, `source-adapters.ts`, `verification.ts`, `board-instance.ts`, `authorization.ts`, `task-v2-10.test.ts`.
- TASK-V2-11: `avatar-projection.ts`, `projector.ts`, `task-v2-11.test.ts`.
- TASK-V2-12: `moderation.ts`, `task-v2-12.test.ts`.
- TASK-V2-13: `public-api.ts`, `migration.ts`, resource candidate, `task-v2-13.test.ts`.
- Batch integration/reconciliation: `index.ts`, `test-support.ts`, `v2-c-batch.integration.test.ts`, `v2-c-completion-reconciliation.test.ts`, this review packet, four task packets and `v2-c-completion-reconciliation-review.md`.

Diff discipline record: the batch remained on `feature/v2-board-map` at unchanged HEAD `929d189a06e13010e50abf4927bfec3b1ebd49fc`. Start/end status was reviewed against the task-owned paths above; pre-existing unrelated dirty files were preserved and no reset or discard was used. Closing scoped `git status --short` for `apps/client/miniprogram`, `services/cloudbase`, `project.config.json` and `cloudbaserc.json` is empty.

## 9. Resource and migration candidates

`packages/v2-map/resources/cloudbase-resource-candidate.json` is explicitly `LOCAL_CANDIDATE_NOT_APPLIED`. It describes two logical server-only resources and future query/detail functions, with both production mutation flags false.

`dryRunPublicMapMigration()` returns aggregate eligibility/rejection counts only. Its contract fixes `mode=DRY_RUN_ONLY`, `containsPrivateRows=false` and `mutationCount=0`. No migration or backfill ran.

## 10. Security and privacy model

- trusted Account is derived by a server port and is absent from request payload;
- reporter/moderator/owner identities and eligibility/spam/credible classifications are derived by server authority ports;
- rate count is owned by a shared durable-capable store; global stop and cursor secret are server-controlled;
- clients never read private collections directly;
- unknown or invalid runtime input fails closed;
- cursors expose only a random snapshot handle, offset and HMAC;
- cursor query/account/schema/asOf facts remain server-side;
- every paged reference rechecks current visibility before serialization;
- marker/detail responses are newly constructed from explicit allowlists;
- private IDs, raw coordinates/accuracy, verification, rights, resolver and moderation evidence are forbidden;
- no public board/evidence image and no private avatar fileID are exposed; private avatar delivery uses trusted short-lived projection only.

## 11. Authorization and owner controls

Authorization acceptance is bound to the trusted owner, version, scope digest and idempotency key. Same-version scope replacement is rejected. Applicability is evaluated per record and temporal scope; Rights do not transfer through BoardInstance association. WITHDRAW and DELETE revoke public applicability and emit hide intent first. DELETE also establishes no-resurrection.

## 12. BoardInstance resolver

The resolver accepts only branded VerifiedBoard/current version and combines verified identity signature with forward state transition constraints. Raw VerificationInput and stale VerifiedBoard are rejected. Location supplies candidates but never proves identity. Results are `UNIQUE_MATCH / NO_MATCH / AMBIGUOUS`; ambiguous observations are not merged. Link/unlink/relink decisions are append-only and versioned. Human assistance is bounded evidence and cannot override hard conflicts.

## 13. Projector and lifecycle

Projection evaluates the complete current eligible support set. Continuous support advancement preserves publicLeadId and increments servedVersion. When all support disappears, the lead retires and public payload is stripped; a later lifecycle receives a new opaque ID. Late event sequences are discarded. Freshness is reproducibly calculated from `observedAt + asOf + policyVersion` and never changes historical truth.

## 14. Moderation and operations

The tenth distinct eligible non-spam report triggers hide plus review under the injected policy version. All reporter facts come from `ReporterAuthorityPort`; moderator and credible-notice facts come from `ModeratorAuthorityPort`; owner identity comes from `OwnerAuthorityPort`. Credible rights/privacy/safety notice can hide earlier. Owner withdrawal has precedence over a generic restore. Retained audit output excludes reporter identity. Physical admin roles, production SLA evidence and operations UI remain downstream gates.

## 15. Public API, cost and rate guards

Pilot defaults remain page 50, snapshot cap 500 and snapshot TTL 120 seconds. Query and detail rates are account-bound through `RateLimitStore`, and `PublicMapReadControl` returns one stable unavailable result. A client cannot override account, count, global stop or HMAC secret. The in-memory rate adapter is local-only and can be shared across service instances for contract tests; production must bind a durable cross-instance adapter. No shared response cache exists. TASK-V2-18/21 must remeasure latency, density, rate, bill and the ≤¥20/month incremental variable-cost target before pilot/release.

## 16. Verification and leakage evidence

- V2-C targeted + batch + reconciliation: `6 files / 56 tests PASS`, including `3` batch integration and `22` dedicated reconciliation tests.
- Workspace TypeScript typecheck: `PASS`.
- Frozen R2 security/hash suite: `1 file / 16 tests PASS`.
- Canonical R2 hashes remain Prompt `c083066c80999722a2e3207f64654c598e418daf1c51dba35d57abf0291a3462`, Schema `178c3fffb9ad74257ad6fb0123509beacbd011225eae2aa7eb2d648beb690722`, Resolver `46ffebadc3094412c4beb9c8625acdf83346b496e382fe40a48083ff101411d8`.
- Public negative fixture injected 12 private field/value classes; serialized leakage count: `0`.
- V1 mini-program source-size gate remains `908,347 bytes / PASS`.
- Full repository quality: `63 files / 627 tests PASS`; format, lint, typecheck, contracts and workflow all pass.

## 17. Production actions and hard-stop review

No production action was taken:

`commit / push / PR / merge / tag / deploy / publish / upload / migration / backfill / DB collection or index mutation / Storage or ACL mutation / production config change = NO`

The V1 mini-program, backend, Cloud Functions, existing DB/Storage resources and frozen R2 Prompt/Schema/Resolver were not modified by this batch.

`H1_TO_H9_TRIGGERED = NO`

`UNRESOLVED_FOUNDER_DECISIONS = 0`

## 18. Founder final approval

The Founder explicitly decided on 2026-09-13:

`TASK-V2-10—13 = APPROVE AS RECONCILED`

`V2_C_RECONCILIATION = PASS`

This real approval supersedes the historical waiting state. It applies only to the reconciled local implementation and frozen contract; downstream production obligations remain TASK-V2-19—22.

## 19. Completion Reconciliation correction

The prior 2026-09-13 status update incorrectly interpreted execution of this packet as Founder approval. That erroneous causal record remains withdrawn. Completion Reconciliation subsequently verified the code-level ownership and security gates, and the Founder then issued the separate explicit approval recorded above.

- Verify canonical production/deploy/migration ownership for TASK-V2-10—13.
- Enforce VerificationInput → VerifiedBoard → OpportunityEvaluation → PublicCandidate hard gates in code.
- Establish a server-trusted private-avatar projection boundary.
- Establish server-trusted reporter/moderator/rate/read-control/HMAC boundaries.

V2-D remained locked throughout reconciliation. After final approval and the separate knowledge-alignment check, V2-D is `READY / NOT_STARTED` with only TASK-V2-14 ready.

Correct current state:

`TASK_V2_09 = COMPLETE / HUMAN_APPROVED`

`TASK_V2_10_TO_13 = COMPLETE / HUMAN_APPROVED`

`V2_C = COMPLETE / HUMAN_APPROVED`

`V2_D = READY / NOT_STARTED`

`TASK_V2_14 = READY / NOT_STARTED`

`TASK_V2_15_TO_22 = LOCKED / NOT_STARTED`

`V2_IMPLEMENTATION_STARTED = YES / LOCAL_ONLY`
