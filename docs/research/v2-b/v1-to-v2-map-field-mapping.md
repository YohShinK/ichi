# V1 → V2 Public Map Field Mapping

> 文档角色：`TECHNICAL MAPPING APPENDIX / NOT RUNTIME SCHEMA`。当前中文判定入口为 `docs/delivery/v2-b-closeout-review.md`；本文的英文分类词是精确 mapping identifiers，不得被理解为已实现的数据库或 API。

> Task: `TASK-V2-08`
>
> Status: `DESIGN INPUT / CLOSEOUT_VERIFIED`
>
> Implementation, migration and backfill: `NO`

## 1. Scope

This matrix is the future V2-C adapter/projector design input. It does not modify V1 schema, create a collection, migrate data, implement an adapter or select the PublicMapLead storage strategy.

Strategy meanings:

- `DIRECT`: semantics can be inherited after exact-version validation and all V2 gates; never means direct client/database exposure.
- `NORMALIZE`: V1 has an input, but V2 must convert identity, units, vocabulary or structure.
- `DERIVED`: deterministic calculation from exact approved facts.
- `DYNAMIC`: reproducible `asOf` evaluation, not permanent observation truth.
- `V2_GENERATED`: no V1 equivalent; V2 policy/resolver/projection must create it.
- `UNAVAILABLE`: no reliable V1 source; remain absent or deferred.

## 2. Mapping matrix

| V2 field / concept | V1 authoritative source | Type | Strategy | Notes |
| --- | --- | --- | --- | --- |
| private observation lineage | P1 `recordId + boardId` | `NORMALIZE` | Create private opaque V2 lineage reference | Never public; `recordCode` is not a public ID |
| observation source version | exact `submissionVersion` for assisted; finalized P1 identity/version context for direct | `NORMALIZE` | Lock to source-specific immutable input | Direct does not require an assisted submission, but still re-enters V2 Verification |
| `Source.type=V1_HISTORY` | adapter ingestion context | `V2_GENERATED` | Wrap V1 history and retain `originSourcePath` privately | Do not erase direct/assisted origin |
| origin source path | P1 `sourcePath` | `NORMALIZE` | Map `direct-upload`/`assisted-draw` to provenance vocabulary | Source never changes trust level |
| subject owner/steward | P1 owner + V2 operations policy | `NORMALIZE` | Private Source/Rights contract and contributor lookup input | Owner ID stays private; only approved public Profile projection may be returned |
| public player `recordType` | P1 `sourcePath` / retained V1 origin | `NORMALIZE` | `assisted-draw → DRAW_RECORD/抽赏记录`; `direct-upload → UPLOAD_RECORD/上传记录` | Execution provenance, not trust score; V1_HISTORY preserves origin |
| `observedAt` | P1 `observedAt` | `DIRECT` | Copy semantic time after version check | Freshness basis; not createdAt/approvedAt |
| BoardObservation raw board input | P1 `initialSnapshot` / direct final snapshot | `NORMALIZE` | Schema-versioned private observation | Direct input still needs V2 verification |
| VerifiedBoard final facts (assisted) | exact current APPROVED submission `finalSnapshot` | `DIRECT` | Copy normalized facts bound to verification evidence | Must match current P1 pointer/owner/board/version |
| VerifiedBoard input (direct) | P1 direct user-confirmed `finalSnapshot` + recognition/correction provenance | `NORMALIZE` | Feed source-specific facts into future V2 Verification | Can become VerifiedBoard when core Verification passes; no assisted drawSubmission required |
| `ipName` | exact eligible snapshot/P1 | `NORMALIZE` | Preserve fact, apply approved public text normalization/safety | Omit publicly if not safe/allowed |
| `themeName` | exact eligible snapshot/P1 | `NORMALIZE` | Optional public text | Absence stays absent |
| tier code | R2 `tiers[].tierCode` | `DIRECT` | Allowlisted structured code | Never infer missing code |
| tier display label | `rawLabel` plus future policy | `NORMALIZE` | Curated/safety-cleared display label | Raw arbitrary text not automatically public-safe |
| tier remaining | exact final snapshot | `DIRECT` | Non-negative integer | Preserve `0`; unresolved/null blocks fact publication |
| Grand Prize flags | R2 `isGrandPrize` | `DIRECT` | Boolean fact | Legacy mapping requires explicit compatible evidence |
| Grand Prize summary | eligible tier facts | `DERIVED` | Filter/sum Grand Prize tiers | Include derivation/policy version |
| total remaining tickets | eligible tier remaining or compatible legacy whole-board remaining | `DERIVED` | Deterministic sum/normalization | Do not double count mixed schemas |
| initial total ticket slots | legacy `totalTickets` only | `DIRECT` or `UNAVAILABLE` | Conditional by source schema | R2 has no reliable value; omit there |
| drawn count | legacy totals minus remaining where both verified | `DERIVED` or `UNAVAILABLE` | Only calculate with compatible verified inputs | Never manufacture from R2 first-observed snapshot |
| unit price | `pricePerDraw` | `NORMALIZE` | Convert numeric CNY units to integer minor-unit money object | Conversion rules/version required |
| remaining full-pack cost | normalized total remaining × unit price minor | `DERIVED` | Existing exact arithmetic semantics | Display as calculation, never advice |
| raw draw events | exact submission `authoritativeDrawEvents` | `PRIVATE` | No public mapping | May support private audit/derivation only |
| visible number runs | recognition/provider evidence | `UNAVAILABLE` | Exclude from public contract | Not an approved R2 board fact |
| Verification result/version | exact approved composite + future V2 adapter decision | `V2_GENERATED` | Create V2 verification-bound fact identity | V1 workflow status is not a public field |
| BoardInstance association | none | `V2_GENERATED` | Conservative unique continuation resolver | Location alone cannot create it |
| BoardInstance public grouping key | none | `V2_GENERATED / DEFERRED` | Omit from MVP payload recommendation | Future opaque grouping must not leak instance identity |
| Opportunity level | none; V1 probability/outlook not approved | `V2_GENERATED` | Versioned V2 Opportunity policy | `HIGH/MEDIUM/LOW/INSUFFICIENT`; no recommendation |
| Opportunity reason codes/facts | verified/derived board facts + V2 policy | `V2_GENERATED` | Allowlisted reason trace | No probability or behavior advice |
| Freshness evaluation | P1 observedAt + V2 asOf/policy | `DYNAMIC` | `observedAt + asOf + policyVersion` | Truth remains unchanged as Freshness falls |
| Freshness relative text | observedAt + response asOf | `DYNAMIC` | Client renders bounded relative label | Must retain non-real-time disclaimer |
| private ObservationLocation | P1 location + exact submission location evidence | `NORMALIZE` | Four-layer Location input | Never expose raw coordinate/accuracy |
| PublicLocation | none | `V2_GENERATED` | Rights/privacy/safety projection to GCJ-02-compatible semantics | No eligible PublicLocation means no marker |
| area/city label | no stable V1 public fact | `V2_GENERATED` | LocationResolution/PublicProjection output | Provider suggestion remains advisory |
| venueNote (assisted exact text) | exact APPROVED `userNote + userNoteHash + NOTE_PASSED` | `DIRECT / CONDITIONAL` | Project only with exact safety provenance + authorization + eligibility | Missing/failed note only omits note |
| venueNote (direct `locationNote`) | P1 without MAP_NOTE pass | `UNAVAILABLE` | Requires new V2 safety decision | Cannot inherit assisted safety pass |
| network/provider/admin note | none with inherited V1 safety | `V2_GENERATED` | New equivalent safety gate | Fail closed for field |
| public source attribution | V2 Source contract + origin source | `V2_GENERATED` | PLAYER uses recordType + contributor projection; NETWORK uses `网络来源` | Network URL private by default; never fabricate player profile |
| contributor displayName | owner `profiles.nickname` | `NORMALIZE` | Use safety-reviewed nickname or `ICHI 玩家` fallback | No account/profile ID; requires MapContributionAuthorization scope |
| contributor avatar | private profile avatar reference or ICHI fallback asset | `V2_GENERATED` | Produce public-safe avatar reference; default to ICHI avatar | Never return `avatarFileId`, private Storage metadata or owner-scoped temp URL as contract identity |
| profile safety provenance | `PROFILE_NICKNAME/msgSecCheck` code path + profile version context | `NORMALIZE` | Private Eligibility/projection input | Not exposed publicly |
| profile update effect | current profile facts exist; public history behavior absent | `V2_GENERATED / DEFERRED` | Choose request-time, publication snapshot or hybrid in V2-C | Missing optional profile uses fallback; account deletion hides contribution first |
| public rights/eligibility | no V2 equivalent | `V2_GENERATED` | Exact-version policy decision | V1 consent does not authorize V2 public map |
| `publicLeadId` | none | `V2_GENERATED` | Opaque identity for a BoardInstance's continuous active public lifecycle | Stable across supporting Observation change while lifecycle continues; retired ID never reused |
| `servedVersion` | none | `V2_GENERATED` | Monotonic/logical public representation version | Storage mechanism deferred |
| `projectionVersion` | none | `V2_GENERATED` | Exact public transformation contract version | Included for compatibility/audit semantics |
| `schemaVersion` | no V2 public schema | `V2_GENERATED` | Response/lead contract version | Client declares supported range/capability |
| public `asOf` | query/evaluation execution | `V2_GENERATED` | Server response snapshot time | Cursor binds to it |
| public visibility/retirement | P1 negative state plus V2 lifecycle/rights/moderation | `V2_GENERATED` | Service returns item or generic unavailable | Do not leak internal reason |
| publishedAt | none | `UNAVAILABLE` | Omit | Never alias V1 approvedAt |
| public image | no approved public storage/rights contract | `UNAVAILABLE / DEFERRED` | Exclude from V2 MVP | New public storage architecture required later |

## 3. Authoritative adapter checks

### Assisted `DRAW_RECORD`

Before assisted V1 facts can enter the private V2 pipeline, a future adapter must atomically or equivalently prove:

1. P1 exists and is not deleting, deleted or superseded.
2. `publishedSubmissionVersion` identifies exactly one submission.
3. submission `recordId`, `boardId`, `ownerAccountId` and version match P1.
4. submission status is `APPROVED` and its final snapshot is internally valid.
5. any reused note has matching exact content hash and `NOTE_PASSED` provenance.
6. late/superseded/deletion-job state cannot advance the result.

Passing these checks only creates valid V2 private inputs. It does not imply Opportunity PASS, map authorization, Public Eligibility, PublicLocation or PublicMapLead.

### Direct `UPLOAD_RECORD`

A future direct adapter must prove:

1. P1 exists with `sourcePath=direct-upload` and is not deleting, deleted or superseded.
2. the referenced recognition job belonged to the same owner/path and reached the accepted recognition state before finalization;
3. P1 contains a schema-valid user-confirmed/corrected snapshot, `observedAt`, private location and required locationNote as actually persisted by V1;
4. any facts used for VerifiedBoard pass the future source-independent V2 Verification contract;
5. `v2Eligibility=pending`, `clue_submitted` or the absence of an assisted approval pointer is not treated as automatic Verification failure or public PASS;
6. locationNote without exact safety provenance is omitted, no PublicLocation means no marker, and missing core board facts block only that record's publication.

Direct Upload can therefore become VerifiedBoard/PublicMapLead after its source-specific input passes all common V2 gates. This contract adds no screen-recapture detector, liveness check, extra anti-spoofing VLM, confidence level or trust score.

## 4. Explicit unavailable facts

- R2 manufacturer initial ticket slots and reliable drawn count.
- A distinct V1 `publishedAt`.
- V1 public location or public precision policy.
- V1 V2-map authorization and withdrawal contract.
- V1 BoardInstance association.
- An approved V2 Opportunity PASS algorithm.
- A public-safe image pipeline.
- A unified single-record V1 canonical source.

`V1_SCHEMA_MODIFIED = NO`

`MAPPING_CODE_IMPLEMENTED = NO`

`MIGRATION_OR_BACKFILL_STARTED = NO`
