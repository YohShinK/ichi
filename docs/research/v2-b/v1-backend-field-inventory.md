# V1 Backend Field Inventory for V2 Public Map

> 文档角色：`READ-ONLY TECHNICAL EVIDENCE APPENDIX`。当前中文判定入口为 `docs/delivery/v2-b-closeout-review.md`；本矩阵只证明 V1 实际字段与来源，不定义 V2 schema 或当前任务状态。

> Task: `TASK-V2-08`
>
> Status: `READ-ONLY EVIDENCE / CLOSEOUT_VERIFIED`
>
> Inspected truth: current repository runtime, contracts, tests and CloudBase resources at `HEAD 929d189a06e13010e50abf4927bfec3b1ebd49fc`
>
> Runtime/API/DB changes: `0`

## 1. Authoritative-input conclusion

V1 does not have one unified canonical cloud record containing every board path's authoritative facts. A future V2 adapter must use **source-specific authoritative inputs**:

1. For `PLAYER_ASSISTED`, use a version-locked composite. `observationCandidates` supplies private lineage, source path, initial board snapshot, observation time, base capture location, V1 consent/disclosure references, current publication pointer and deletion/publication state. The exact `drawSubmissions` document identified by `recordId + boardId + publishedSubmissionVersion` supplies the approved final board state, authoritative draw events, ticket location/review, note content/hash/safety review and approval evidence.
2. For `PLAYER_DIRECT`, `observationCandidates` itself is the finalized source-specific cloud input. It stores the VLM-recognized then user-confirmed/corrected `initialSnapshot` and identical `finalSnapshot`, queryable R2 board fields, `recognitionJobId`, `correctionSummary`, `observedAt`, private capture `location`, required `locationNote`, `sourcePath=direct-upload`, V1 consent/disclosure versions, `status=clue_submitted`, `v2Eligibility=pending` and deletion state.
3. Direct Upload has no assisted `drawSubmissions` object, `publishedSubmissionVersion`, `APPROVED` prize-ticket decision, draw events, locationReview or MAP_NOTE note review. Those absent assisted-specific objects must not disqualify the entire record type. Instead, P1 supplies a legitimate `UPLOAD_RECORD` input to the future V2 Verification pipeline; any missing board, location, note, rights or public field fails closed at its own gate.

The assisted composite and direct P1 are private adapter inputs, not public read models. Neither may be exposed directly, and neither alone grants V2 map authorization, Opportunity PASS, Public Eligibility or PublicLocation.

Direct Upload is therefore not “automatically unverified forever.” Its source-specific P1 facts can produce a VerifiedBoard after the future V2 Verification contract succeeds. Its `locationNote` remains omitted until an equivalent safety decision exists, and no eligible PublicLocation still means no marker.

## 2. Objects and responsibilities

| Object | Current responsibility | Authority for V2 adapter | Boundary |
| --- | --- | --- | --- |
| Local Board / local draw draft | On-device working state, capture/draw history and pending finalization | `NO` | Not cloud authority; deletion does not imply cloud/public deletion |
| Recognition job / structured result | Provider output, normalized draft and recognition evidence | Evidence only | May contain unknown/null or provider-only values; not an approved public fact |
| `observationCandidates` | Private current P1; assisted lineage/current-version pointer; direct finalized user-confirmed source record | Required for both paths | `ADMINONLY`; never a public collection; direct/assisted semantics differ |
| `drawSubmissions` | Versioned assisted-draw submissions and exact approval result | Required composite part for assisted records | Only exact current `APPROVED` version is authoritative |
| `authoritativeDrawEvents` | Approved draw-event sequence | Private derivation input | Full event stream is not public allowlist data |
| `finalSnapshot` | Assisted: state derived from approved draw events in exact submission. Direct: user-confirmed/corrected snapshot persisted in P1 | Source-specific board input | Assisted locks exact submission; direct re-enters V2 Verification without requiring draw events |
| `deletionJobs` | Deletion workflow and minimal no-resurrection evidence | Negative eligibility input | Not a public removal explanation |

All existing CloudBase collections remain `ADMINONLY`. V1 has no `PublicLocation`, `PublicMapLead`, public map authorization, public source label or public viewport API.

## 3. Field inventory

`Public-safe` below means “eligible to become a V2 public field only after the listed V2 gates”; it never means the V1 collection can be read publicly. `DIRECT` means semantic inheritance inside a private adapter, not payload passthrough.

### 3.1 Identity, source and publication

| Current field/path | Authoritative source | Semantics / nullability | Public-safe | V2 strategy |
| --- | --- | --- | --- | --- |
| `ownerAccountId` | P1 + exact submission | Private authenticated owner; required on player paths | No | Private lineage/authz input only |
| `recordId` | P1 + exact submission | Private record identity; required | No | Normalize to private observation lineage reference |
| `recordCode` | P1 | Private/user-facing V1 lookup code; may exist | No | Do not expose or derive public identity from it |
| `boardId` | P1 + exact submission | Private board identity; required | No | Private version-lock key only |
| submission document key | `drawSubmissions` | `prize-ticket:{recordId}:{boardId}:{submissionVersion}` | No | Private exact-version lookup only |
| `submissionVersion` | exact submission | Monotonic V1 upload version; required | No | Normalize to private source version |
| `sourcePath` | P1 | `direct-upload` or `assisted-draw`; required | Conditional | Normalize to V2 provenance; V1_HISTORY remains wrapper source with origin preserved |
| `status` | both | V1 workflow state; path-dependent | No | Interpret only through documented adapter checks |
| `publishedSubmissionVersion` | P1 | Pointer to current approved assisted submission; absent on direct path | No | Required exact-version lock for assisted only |
| `latestVerifiedPrizeTicketSubmissionVersion` | P1 | Latest version approved by prize-ticket verification | No | Consistency check, not public fact |
| `publicationState` | P1 | Current assisted V1 publication pointer state; not required on direct P1 | No | Path-specific currentness input; not public visibility enum |
| `verificationId` | submission | Private verification attempt identity | No | Evidence reference only |
| `recognitionJobId` | P1 | Private recognition job identity | No | Evidence reference only |
| `consentVersion` / `disclosureVersion` | P1 | V1 collection/use consent and disclosure versions | No | Rights evidence only; does not grant V2 map publication |
| V2 map authorization | none | Not present | No | `V2_GENERATED`; fail closed until applicable |
| public source label | none | Not present | Yes after policy | `V2_GENERATED` from approved Source contract |
| `publicLeadId` / `servedVersion` | none | Not present | Yes | `V2_GENERATED`, opaque and non-reusable after retirement |

### 3.2 Board facts

| Current field/path | Authoritative source | Semantics / nullability | Public-safe | V2 strategy |
| --- | --- | --- | --- | --- |
| `initialSnapshot` | P1 | First confirmed observed board state; required | Conditional | Normalize; do not call it manufacturer initial inventory |
| `finalSnapshot` | exact approved submission for assisted; P1 for direct | Assisted current state after approved events; direct user-confirmed/corrected observed state | Conditional | Assisted can inherit after exact lock; direct is authoritative Verification input and may become VerifiedBoard after V2 Verification |
| `schemaVersion` | snapshot/P1 | Legacy or `board-record-r2-1.0.0` | No | Schema dispatch and normalization only |
| `recognitionVersion` | P1/snapshot | Recognition contract version | No | Provenance only |
| `ipName` | R2 snapshot/P1 | User-confirmed structured text; required/nonempty | Conditional | Fact semantics reusable, but public text needs approved normalization/safety policy |
| `themeName` | R2 snapshot/P1 | Optional structured text | Conditional | Same as `ipName`; omit when absent or unsafe |
| `tiers[]` | final snapshot | Ordered observed tier facts; required under schema | Conditional | Normalize into public board-detail allowlist after eligibility |
| `tiers[].tierCode` | R2 snapshot | Stable structured code; required | Conditional | DIRECT semantic field after allowlist |
| `tiers[].rawLabel` | R2 snapshot | User/provider-origin text; required | Conditional | Normalize/curate before public display; not automatically safety-passed |
| `tiers[].remainingTickets` | R2/legacy final snapshot | Integer `>=0`; required in confirmed snapshot | Yes after gates | DIRECT; preserve `0=confirmed zero` |
| `tiers[].isGrandPrize` | R2 final snapshot | User-confirmed boolean | Yes after gates | DIRECT; may derive Grand Prize summary |
| legacy tier totals/attached | legacy snapshot | Integer counts under legacy schema | Conditional | Normalize by source schema; do not invent for R2 |
| board `remainingTickets` | legacy snapshot | Whole-board confirmed remaining count | Yes after gates | DIRECT for compatible legacy schema only |
| board `totalTickets` | legacy snapshot | Legacy total ticket slots | Conditional | DIRECT only where present and semantically verified |
| R2 initial/total ticket slots | none | Not captured by R2 contract | No | `UNAVAILABLE`; must remain absent/unknown |
| total remaining | not persisted for R2 | Sum of exact tier remaining values | Yes after gates | Deterministic derivation with derivation version |
| Grand Prize summary | not persisted as summary | Filter/sum tiers where `isGrandPrize=true` | Yes after gates | Deterministic derivation |
| `pricePerDraw` | R2/legacy snapshot | Numeric CNY unit price | Yes after gates | Normalize to `{currency:"CNY", unitPriceMinor}` with safe conversion/version |
| remaining full-pack cost | not persisted | Remaining count × unit price | Yes after gates | Deterministic derivation; label as calculation, not recommendation |
| `authoritativeDrawEvents` | exact approved submission | Full private draw sequence | No | Private derivation/audit input; never return raw events publicly |
| `visibleNumberRuns` | recognition/provider evidence on older paths | Provider/recognition evidence, not approved R2 fact | No | Do not publicize or use as verified R2 fact |
| `recognizedStructuredResult` | legacy P1 / recognition job | Recognition draft/provider output | No | Evidence only; R2 deliberately does not retain it in P1 |

Confirmed R2 snapshots require every `remainingTickets` value to be a non-negative integer. Recognition drafts may contain `null`; that is `unknown`, never zero and never eligible for a reason fact until resolved.

### 3.3 Time

| Current field/path | Authoritative source | Semantics / nullability | Public-safe | V2 strategy |
| --- | --- | --- | --- | --- |
| `observedAt` | P1 | Time the board snapshot was observed/captured; required on finalized cloud record | Yes after gates | DIRECT semantic input for Freshness |
| `capturedAt` | exact submission v1 / location objects | Evidence or device-location capture time; path-dependent | No by default | Private provenance; not a substitute for board `observedAt` |
| draw event `occurredAt` | authoritative events | Individual assisted-draw event time | No | Private derivation input |
| `createdAt` | P1/submission | Server-side record creation time | No | Audit only; not Freshness basis |
| `serverReceivedAt` | P1 | Server receipt time | No | Audit only |
| `uploadedAt` / `submittedAt` | submission | Evidence upload/submission time | No | Audit only |
| `approvedAt` | P1/submission | Verification/publication transaction time | No | Audit only; not observation time |
| `publishedAt` | none | No distinct V1 field | No | `UNAVAILABLE`; never alias `approvedAt` |
| `updatedAt` / `completedAt` / `verifiedAt` | both | Workflow/audit times | No | Audit only |
| Freshness band/text/asOf | none | Not persisted as V1 truth | Yes after projection | Dynamic V2 derivation from `observedAt + asOf + policyVersion` |

### 3.4 Location

| Current field/path | Authoritative source | Semantics / nullability | Public-safe | V2 strategy |
| --- | --- | --- | --- | --- |
| `location.latitude/longitude` | P1 | Private capture coordinate | No | ObservationLocation input only |
| `location.coordinateSystem` | P1 | `gcj02` in current path | No | Normalize with declared CRS; never silently infer when absent |
| `location.accuracy` | P1 | Raw device accuracy | No | Private evidence only |
| `location.source/capturedAt/consentVersion` | P1 | Capture basis, time and V1 consent reference | No | Private provenance only |
| `ticketLocation` | exact submission | Prize-ticket location used for assisted validation; coordinate system not persisted on the nested object | No | Private evidence; validate against P1 and declared adapter policy |
| `locationReview.status` | exact submission | `LOCATION_PASSED/FAILED/PENDING` | No | Verification/eligibility evidence only |
| `locationReview.distanceMeters/radiusMeters/*Accuracy` | exact submission | Private comparison evidence | No | Never publish |
| PublicLocation | none | No V1 public projection | Yes after policy | `V2_GENERATED` from approved Location contract |
| city/region/area label | none as stable approved public contract | Not reliably canonical | Conditional | V2 resolution/projection output; do not fabricate |

### 3.5 Note and safety provenance

| Current field/path | Authoritative source | Semantics / nullability | Public-safe | V2 strategy |
| --- | --- | --- | --- | --- |
| `userNote` | exact approved assisted submission | Exact user text; required on that path | Conditional | Only project exact content version when all D07-07 gates pass |
| `userNoteHash` | exact submission | SHA-256 binding safety decision to exact content | No | Private provenance check |
| `noteReview.status` | exact submission | `NOTE_PASSED/FAILED`; may be missing in legacy records | No | Private safety decision; missing fails closed for note |
| `noteReview.reviewedAt` | exact submission | Review time | No | Private provenance only |
| MAP_NOTE reviewer configuration | frozen verification runtime | `msgSecCheck` usage contract; version/scene are code-level provenance | No | Reference frozen artifact version; not public payload |
| `locationNote` | direct-upload P1 | Required direct-path location text | No by default | No observed MAP_NOTE review; must pass a new V2 safety gate before public use |
| provider/NETWORK/admin note | no inherited pass | New-source text | No by default | New equivalent safety gate required |

Safety Review is inherited by exact content provenance, not by field name. A matching hash and exact approved submission are required before an assisted V1 note can reuse its safety result.

### 3.6 Profile attribution inputs

| Current field/path | Authoritative source | Semantics / nullability | Public-safe | V2 strategy |
| --- | --- | --- | --- | --- |
| `profiles.nickname` | owner profile | User-selected nickname after `PROFILE_NICKNAME/msgSecCheck`; default is `ICHI 玩家` | Conditional | Normalize through a public Profile projection; never expose profile/account identity |
| `profiles.avatarFileId` | owner profile | Private durable CloudBase reference under controlled `profile-avatars/`; optional/null | No | Never publish fileID; future service emits a public-safe avatar reference or fallback asset |
| owner-scoped `avatarUrl` | `get-my-profile` response | Short-lived URL minted from private avatar file for the owner; may be absent | No as-is | Not a stable public contract; public delivery/snapshot strategy deferred to V2-C |
| `avatarState` | profile | `default` or authorized-profile state | No | Select public default/custom projection without exposing state |
| `profileState` | profile | Optional profile completion state | No | Must not gate map read or contribution publication |
| default display name | bootstrap/profile response | `ICHI 玩家` when custom nickname missing | Yes after authorization | Deterministic public fallback |
| default avatar | mini-program asset `/assets/v1-29/ichi-avatar.png` | Existing ICHI fallback visual | Yes as app asset | Public fallback semantics; transport/versioning deferred |
| public contributor object | none | Does not exist in V1 | Yes after authorization | `V2_GENERATED` with displayName + public-safe avatar reference only |

Account or source-record deletion invalidates applicable public contribution scope and hides first under D05/D06. While an account remains active, missing/replaced optional profile fields can fall back to `ICHI 玩家` and the ICHI avatar. Whether existing details reflect current profile or a publication-time snapshot is deferred.

### 3.7 Deletion, retirement and no-resurrection

| Current field/path/process | Authoritative source | Semantics | Public-safe | V2 strategy |
| --- | --- | --- | --- | --- |
| `status=deleting` | P1 | Hide-first deletion transition | No | Immediate negative eligibility input |
| `published=false` / `publicationStatus=deleted` | P1 deletion update | V1 cloud-publication withdrawal state | No | Negative eligibility input; not a public reason |
| `deletionRequestedAt` | P1 | Audit timestamp | No | Private audit only |
| `deletionJobs` | deletion workflow | Tombstone/work status; prevents recreation and drives cleanup | No | Map to minimal V2 no-resurrection evidence later |
| submission cleanup | deletion retry | Removes versioned evidence according to V1 deletion workflow | No | Do not depend on physical deletion for public hide |
| late result checks | finalize/verify transactions | Old/deleting/superseded results cannot advance current pointer | No | Preserve exact-version and generation guards |
| V2 withdrawal/public retirement | none | Not present in V1 | No/public envelope only | `V2_GENERATED`; public detail returns generic unavailable, not internal reason |

## 4. Reuse rules

- No public contract field may be read directly from an `ADMINONLY` collection by the client.
- “Direct reuse” is allowed only after exact-version validation, V2 normalization, public authorization, eligibility, location projection, allowlist and moderation.
- Missing facts remain absent/unknown. R2 initial ticket slots, V1 `publishedAt`, V2 public location, Opportunity evaluation and map authorization must not be synthesized from unrelated timestamps or fields.
- V1 probability/outlook utilities are not approved V2 Opportunity policy. Existing full-pack arithmetic can support a versioned deterministic fact, but not a recommendation.
- Assisted no-resurrection uses P1 deletion/current-pointer plus exact submission checks. Direct uses P1 `status/publicationStatus` and deletionJobs; neither path gets a new runtime mechanism in TASK-V2-08.
- Record type transparently expresses product execution path: `assisted-draw → DRAW_RECORD/抽赏记录`, `direct-upload → UPLOAD_RECORD/上传记录`. It is not a trust level and cannot change Opportunity or Freshness.

## 5. Evidence locations

- `services/cloudbase/shared/runtime.js`: P1 finalization, current-record read overlay, deletion and late-result guards.
- `services/cloudbase/functions/verify-prize-tickets/index.js`: exact versioned submission, final snapshot/event derivation, location and note review, approval transaction.
- `services/cloudbase/database/resources.json`: all current collection access modes.
- `apps/client/miniprogram/platform/local-draw-drafts.ts`: local-only board/draft responsibility.
- `packages/recognition-contract/src/index.ts`: R2 confirmed snapshot structure and null/zero constraints.
- `packages/core/src/money.ts`: deterministic full-pack cost arithmetic in minor currency units.

`V1_UNIFIED_CANONICAL_SOURCE_EXISTS = NO`

`V1_AUTHORITATIVE_ADAPTER_INPUT = SOURCE_SPECIFIC_DIRECT_P1_OR_ASSISTED_VERSION_LOCKED_COMPOSITE`

`V1_RUNTIME_MODIFIED = NO`
