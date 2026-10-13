# TASK-V2-08 Founder Second Review Approval Record

> 文档角色：`FINAL APPROVAL EVIDENCE`。当前中文状态与 V2-B 全区判定入口为 `docs/delivery/v2-b-closeout-review.md`；本文不再包含可覆盖 Founder 最终决定的未决 recommendation。

> Review target: `TASK-V2-08 Public Map Service Contract`
>
> Status: `COMPLETE / HUMAN_APPROVED`
>
> Product implementation: `NOT_STARTED`

## 1. Review outcome recorded

Founder 通过本轮 Closeout 命令批准 `TASK-V2-08 = CONTINUE / APPROVE ADJUSTED D08-01—18`。D08-03/04/10/13/17 按调整方案批准，其余 recommendation 按原方案批准。该批准关闭 document-only TASK-V2-08，但不批准任何数据库 schema、collection、API、Cloud Function、index、cache、Profile publication code 或 map UI 实现。

## 2. Adjustments incorporated

- `publicLeadId` is a V2 map-only opaque identity, never a Storage fileID, database `_id`, V1 record/board/submission ID, account identity or derivation of them.
- One resolved BoardInstance has at most one current public state. Its ID stays stable across eligible supporting-Observation changes within an uninterrupted active public lifecycle; retirement ends the lifecycle permanently.
- PLAYER records publicly preserve `DRAW_RECORD / 抽赏记录` or `UPLOAD_RECORD / 上传记录`. Draw records have greater execution visual weight; upload records use lower-saturation/lower-weight treatment. This is execution provenance, not trust.
- PLAYER detail can show an authorization-applicable public-safe nickname and avatar. Missing optional Profile uses `ICHI 玩家` + ICHI fallback avatar and never blocks the map.
- MVP read uses the existing trusted WeChat identity/silent Account bootstrap. There is no explicit login, phone or Profile gate, and completely unauthenticated map read is out of scope.
- Direct Upload uses finalized P1 as its source-specific input to future V2 Verification. It does not require an assisted drawSubmission and may become VerifiedBoard/PublicMapLead after all common gates pass.
- No trust score, screen-recapture detection, liveness challenge or extra anti-spoofing VLM was added.

## 3. Final D08 decision table

| ID | Final decision | State | Frozen meaning |
| --- | --- | --- | --- |
| `D08-01` | `APPROVED / OPAQUE_PUBLIC_LEAD_ID` | `HUMAN_APPROVED` | Map-only opaque identity; retired ID no-resurrection |
| `D08-02` | `APPROVED / STORAGE_AGNOSTIC_CONTINUES` | `HUMAN_APPROVED` | Storage/materialization strategy remains V2-C work |
| `D08-03` | `APPROVED AS ADJUSTED / BOARD_INSTANCE_ONE_CURRENT_WITH_STABLE_ACTIVE_PUBLIC_ID` | `HUMAN_APPROVED` | Stable ID within uninterrupted active lifecycle; new ID after retirement |
| `D08-04` | `APPROVED AS ADJUSTED / MARKER_MINIMUM_DETAIL_SPLIT_WITH_RECORD_EXECUTION_HIERARCHY` | `HUMAN_APPROVED` | Marker/detail split and independent draw/upload execution style |
| `D08-05` | `APPROVED / DETAIL_BY_PUBLIC_ID_ONLY` | `HUMAN_APPROVED` | Detail lookup accepts publicLeadId only |
| `D08-06` | `APPROVED / CONDITIONAL_STRUCTURED_FACT_ALLOWLIST` | `HUMAN_APPROVED` | Only verified, safe and applicable facts; optional omissions remain safe |
| `D08-07` | `APPROVED / FOUR_LEVEL_REASON_TRACE_NO_RECOMMENDATION` | `HUMAN_APPROVED` | Four levels, reason trace and no-advice semantics |
| `D08-08` | `APPROVED / SERVER_BAND_WITH_ASOF_CLIENT_RELATIVE_LABEL` | `HUMAN_APPROVED` | Reproducible server band with client relative rendering |
| `D08-09` | `APPROVED / VENUE_NOTE_DETAIL_ONLY_BY_EXACT_SAFETY_PROVENANCE` | `HUMAN_APPROVED` | Detail-only venueNote and field-only omission |
| `D08-10` | `APPROVED AS ADJUSTED / PUBLIC_PLAYER_PROFILE_ATTRIBUTION` | `HUMAN_APPROVED` | Safe PLAYER nickname/avatar; NETWORK never impersonates player |
| `D08-11` | `APPROVED / BOUNDED_VIEWPORT_SNAPSHOT_CURSOR` | `HUMAN_APPROVED` | Bounded query, snapshot cursor and late generation discard |
| `D08-12` | `APPROVED / MULTI_ITEM_NO_AUTO_MERGE_WITH_DENSITY_METADATA` | `HUMAN_APPROVED` | Same-location instances remain distinct |
| `D08-13` | `APPROVED AS ADJUSTED / SILENT_ACCOUNT_PUBLIC_READ_NO_PROFILE_GATE` | `HUMAN_APPROVED` | Silent trusted Account; no Profile/phone/login UI gate |
| `D08-14` | `APPROVED / STRICT_SCHEMA_NEGOTIATION_FAIL_SAFE` | `HUMAN_APPROVED` | Schema mismatch and unknown enum fail safe |
| `D08-15` | `APPROVED / PUBLIC_IMAGE_NO_MVP` | `HUMAN_APPROVED` | No public board/evidence image; authorized contributor avatar is separate |
| `D08-16` | `APPROVED / FIELD_LEVEL_AND_SNAPSHOT_SAFE_ERRORS` | `HUMAN_APPROVED` | Offline/cache/pagination/unavailable semantics do not leak or fabricate |
| `D08-17` | `APPROVED AS ADJUSTED / SOURCE_SPECIFIC_AUTHORITATIVE_INPUT_WITH_PUBLIC_RECORD_TYPE` | `HUMAN_APPROVED` | Assisted composite/direct P1 feed common Verification; recordType retained |
| `D08-18` | `APPROVED / PUBLIC_LOCATION_REQUIRED_FOR_MARKER` | `HUMAN_APPROVED` | NOT_PUBLIC/internal-only records never produce marker |

## 4. Identity and current-state compatibility

- An observation lineage has at most one active public derivation relationship.
- A resolved BoardInstance has at most one current public map state.
- That state retains one publicLeadId while at least one eligible support maintains an uninterrupted public lifecycle.
- A/B Rights, provenance, owner, deletion and takedown remain independent even when the current state changes from A to B.
- If all support disappears, hide and RETIRE. A later public lifecycle receives a new publicLeadId.
- NO_MATCH/AMBIGUOUS can produce distinct overlapping items; density metadata never merges identity.

## 5. Marker/detail and three independent dimensions

Marker contains opaque identity/version, PublicLocation, safe short label, PLAYER recordType when applicable, Opportunity level, Freshness/observedAt and optional overlap hint. Contributor Profile remains detail/callout-only by default.

Detail may add record type, public-safe contributor displayName/avatar, board tiers, Grand Prize/total remaining, normalized price, derived full-pack cost, reason trace, Freshness disclosure and eligible venueNote.

`Opportunity != Freshness != Record Type`. An upload record can be HIGH, and a draw record can be LOW. Record styling must never emit “high trust/low trust.”

## 6. Source-specific V1 evidence

- `DRAW_RECORD`: P1 + exact current APPROVED drawSubmission version-locked composite.
- `UPLOAD_RECORD`: finalized direct P1 containing user-confirmed/corrected board snapshot, recognition/correction provenance, observedAt, private location, locationNote, source/status and deletion state.
- Direct P1 is input to the future common V2 Verification, not automatic public PASS. Missing note safety omits note; missing PublicLocation omits marker; missing core verified facts blocks that record.
- Both record types may enter PublicMapLead after Verification, Opportunity, authorization, Rights, Location, safety, moderation and Public Eligibility pass.

## 7. D06 Addendum

`D06-A1 = PUBLIC_PLAYER_PROFILE_ATTRIBUTION / FOUNDER_ADDENDUM / HUMAN_APPROVED` supersedes the pre-launch anonymous-attribution direction without reopening TASK-V2-06. The first real MapContributionAuthorization version must disclose safe nickname/avatar attribution for eligible historical and future PLAYER contributions, plus deletion hide-first. Unaccepted authorization means neither records nor Profile enter the new map public scope.

## 8. Tabletop coverage

- M-A—M-N cover draw/upload styling, Opportunity independence, Profile fallback, stable active public ID, deletion/support transition, retirement/new ID, silent Account read, Direct Upload mapping, no-location behavior, PLAYER attribution and NETWORK_SOURCE.
- S-A—S-B cover first V2 authorization with Profile attribution and fail-closed behavior when not accepted.
- Existing M1—M18, D04-A1 S1—S10, lifecycle, rights and Location scenarios remain inherited.

## 9. Files for review

- `docs/research/v2-b/v2-public-map-service-contract.md`
- `docs/research/v2-b/v1-backend-field-inventory.md`
- `docs/research/v2-b/v1-to-v2-map-field-mapping.md`
- `docs/research/v2-b/v2-source-rights-model-contract.md`
- `docs/research/v2-b/v2-domain-model-contract.md`
- `docs/research/v2-b/v2-board-instance-resolution-contract.md`
- `docs/research/v2-b/v2-lifecycle-semantics-contract.md`
- `docs/research/v2-b/v2-location-model-contract.md`

## 10. Gate effect

- TASK-V2-04—07: `COMPLETE / HUMAN_APPROVED`.
- TASK-V2-08: `COMPLETE / HUMAN_APPROVED`.
- V2-B Closeout Review is performed separately before TASK-V2-09 may become READY.
- Runtime/backend/Cloud Functions/DB/Storage/API/production config changes: `0`.
- Commit/push/deploy/migration/upload/publish: `NO`.

`TASK_V2_04_TO_08 = COMPLETE / HUMAN_APPROVED`

`TASK_V2_08 = COMPLETE / HUMAN_APPROVED`

`V2_IMPLEMENTATION_STARTED = NO`
