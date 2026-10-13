# V2 Public Map Service Contract

> 文档角色：`CURRENT TECHNICAL CONTRACT / ENGLISH IDENTIFIERS AND MATRIX APPENDIX`。当前中文人工阅读与状态入口为 `docs/delivery/v2-b-closeout-review.md`；本文 D08-01—18 均为 Founder 最终批准结果，不得把正文中的比较或实现延后项重新解释为待选 recommendation。

> Task: `TASK-V2-08`
>
> Status: `COMPLETE / HUMAN_APPROVED`
>
> Contract level: `DOCUMENT_ONLY / STORAGE_AGNOSTIC`
>
> API/runtime/DB implementation: `NO`

## 1. Purpose and inherited boundaries

This contract defines what a future ICHI Map Query API may return to the WeChat native `<map>` and how viewport, marker, detail, Freshness, Opportunity, multi-instance, error and compatibility semantics fit together.

It does not create an API route, runtime type, collection, index, cache, Cloud Function, page or production configuration. `PublicMapLead` remains a public service boundary; materialized, request-time and hybrid generation are all deferred to V2-C technical design.

Inherited invariants:

- `BoardObservation → Verification → VerifiedBoard → OpportunityEvaluation → FreshnessEvaluation → Public Eligibility → Public Projection → PublicMapLead`.
- Source is provenance, not trust. Map results require verified facts and every public gate.
- Freshness changes action-reference value, not truth, and never deletes facts by itself.
- `null=unknown`; `0=confirmed zero`.
- Observation revisions are immutable; evaluations bind exact versions; late results cannot revive retired public state.
- Location produces BoardInstance candidates but never proves identity alone. Location is not Venue.
- Public Location is a separate projection; no eligible Public Location means no marker.
- Opportunity is an explainable information classification, not a recommendation, probability or guarantee.
- Public clients never read V1 private collections or internal V2 domain objects.

## 2. Logical service views

`PublicMapLead` has two logical views. They share identity and compatibility semantics but do not require one stored object.

### 2.1 Common public envelope

| Field | Required | Public semantics |
| --- | --- | --- |
| `publicLeadId` | Yes | V2 map-only opaque public identity; cannot equal, encode or reversibly derive any private/storage identity |
| `servedVersion` | Yes | Version of the currently served public representation; changes when public-visible content changes |
| `schemaVersion` | Yes | Public contract version selected by the service |
| `projectionVersion` | Yes | Public projection rule version used for this representation |
| `policyVersion` | Yes | Aggregate/public policy reference sufficient to reproduce eligibility/display semantics without revealing internal evidence |
| `asOf` | Yes | Server snapshot time for the result; cursor and Freshness evaluation bind to it |

`publicLeadId` is specifically not a CloudBase Storage `fileID`, database `_id`, V1 `recordId/recordCode/boardId/cloudRecordId`, draw submission identity/version, openid/account/owner identity or internal lineage identifier. `boardInstancePublicKey` is **not recommended in the MVP public payload**. BoardInstance remains private/service identity. A future opaque grouping key may be introduced only through a versioned schema expansion if overlap/history UX proves it necessary; it must not be derived from private instance identity or coordinates.

Within one resolved BoardInstance's uninterrupted active public lifecycle, `publicLeadId` stays stable while the supporting Observation, contributor/source, served board state, Opportunity, Freshness or PublicLocation projection changes. `servedVersion` identifies those public-visible revisions. If all eligible support disappears, the lead hides and retires; that ID is never reused or resurrected. A later public lifecycle receives a new ID. Public identity does not promise a physical storage record or stable URL implementation.

### 2.2 Marker minimum view

The viewport response uses a lightweight `marker` view:

| Field | Required | Semantics |
| --- | --- | --- |
| common envelope | Yes | Identity/version/asOf values above |
| `publicLocation` | Yes | GCJ-02-compatible point for rendering plus `precisionMode` and optional safe area label |
| `boardShortLabel` | Yes | Curated/safety-approved short board label; deterministic fallback such as “已核对版面” if text is unavailable |
| `totalRemaining` | Yes, nullable | Deterministic sum of all verified tier remaining counts for the same served board version; `null` when any required tier count is unknown |
| `recordType` | PLAYER: Yes; NETWORK: absent | `DRAW_RECORD / 抽赏记录` or `UPLOAD_RECORD / 上传记录`; product execution path, not trust |
| `opportunity.level` | Yes | `HIGH / MEDIUM / LOW / INSUFFICIENT` |
| `freshness.band` | Yes | `RECENT / AGING / LOW / UNKNOWN` under the returned policy version |
| `freshness.observedAt` | Conditional | Required when known; records without an adequate observedAt cannot be current opportunity markers |
| `sourceLabel` | Yes | PLAYER is identified through recordType; NETWORK uses `网络来源` and never receives a player profile |
| `overlapHint` | Optional | Opaque display hint/count for same-or-near display coordinates; never evidence of one BoardInstance |

Marker payload excludes per-tier rows, full reason trace, venueNote, price, full-pack cost and contributor Profile. It may carry only the deterministic total remaining summary needed by the compact marker; the source tier rows remain detail-only. A future callout may request a bounded detail subset, but the viewport marker list does not carry nickname/avatar by default.

### 2.3 Record execution visual hierarchy

The record type drives a separate visual hierarchy:

- `DRAW_RECORD / 抽赏记录`: high-execution marker treatment with greater visual weight.
- `UPLOAD_RECORD / 上传记录`: lower-execution treatment such as gray/low saturation and lower visual weight.

Exact color, opacity, icon, size and z-index remain V2-D decisions. The hierarchy communicates which ICHI product workflow produced the observation; it does not say “true/false” or “high/low trust.”

Three public dimensions remain orthogonal:

- Opportunity describes the board-state opportunity.
- Freshness describes how old the observation is.
- Record type describes the product execution path.

Therefore `UPLOAD_RECORD + HIGH` must still show HIGH Opportunity clearly through a separate badge/ring/label, while `DRAW_RECORD + LOW` remains LOW. Record type cannot modify Opportunity or Freshness.

### 2.4 Detail/callout view

Detail is fetched by `publicLeadId`, never by a private ID, raw coordinate or network URL. It may return:

| Group | Fields | Rules |
| --- | --- | --- |
| common | common envelope + `publicLeadId` | Must describe the same or a newer explicitly returned served version |
| board | safe `ipName?`, `themeName?`, `tiers[]`, total remaining, Grand Prize summary, unit price, remaining full-pack cost | All fields allowlisted; derived values identify calculation version; missing facts remain absent |
| Opportunity | level, public reason codes, allowlisted reason facts, evaluation policy version, `evaluatedAt`, `asOf` | No probability, ranking, score or behavioral advice |
| Freshness | `observedAt`, band, evaluation asOf, policy version | Supports relative text and explicit non-real-time message |
| Location | public point/precision mode, optional safe city/region/area label, optional eligible venueNote | Raw capture coordinate, accuracy and resolver evidence never returned |
| attribution | PLAYER record type + public-safe contributor; NETWORK source label | contributor contains displayName/avatar only; network URL private by default |
| disclosure | non-real-time and non-recommendation copy keys/text | Required in detail; UI wording versioned with schema/policy |

Callout may use either the marker subset or a bounded detail subset; the contract does not require all detail fields in every callout.

## 3. Document-level schema contract

The notation below specifies logical types, not a runtime or database schema.

```text
PublicMapQueryRequest {
  bounds: BBox | ApprovedCellSet
  zoom: number
  filters?: PublicMapFilter
  limit: positive integer
  cursor?: opaque string
  requestId: opaque client request identity
  generation: non-negative client generation
  supportedSchema: { min: string, max: string }
}

PublicMapQueryResponse {
  schemaVersion: string
  requestId: string
  generation: number
  asOf: timestamp
  queryEcho: { boundsDigest, zoomBand, filtersDigest }
  items: PublicMapLeadMarker[]
  nextCursor?: opaque string
  truncated: boolean
  density: { returnedCount, serverCap, overlapPresent, aggregationAvailable }
}

PublicMapLeadMarker {
  publicLeadId: opaque string
  servedVersion: string
  projectionVersion: string
  policyVersion: string
  asOf: timestamp
  publicLocation: { latitude, longitude, coordinateSystem: "GCJ02", precisionMode, areaLabel? }
  boardShortLabel: string
  totalRemaining: number | null
  recordType?: "DRAW_RECORD" | "UPLOAD_RECORD" // required for PLAYER; absent for NETWORK
  opportunity: { level }
  freshness: { observedAt, band, freshnessAsOf, policyVersion }
  sourceLabel: "网络来源" | null
  overlapHint?: { displayCount }
}

PublicMapLeadDetail {
  ...common public envelope
  board: PublicBoardSummary
  opportunity: PublicOpportunityView
  freshness: PublicFreshnessView
  publicLocation: PublicLocationView
  venueNote?: string
  recordType?: "DRAW_RECORD" | "UPLOAD_RECORD"
  contributor?: { displayName, avatar } // PLAYER only
  sourceLabel: "网络来源" | null
  disclosures: { nonRealtime, nonRecommendation }
}
```

All identifiers and cursors are opaque. Exact field encoding, limits, HTTP/Cloud Function transport, serialization library and storage model remain deferred.

## 4. Public board fact allowlist

### 4.1 Allowed after all gates

- Safe normalized `ipName` and optional `themeName`.
- Tier code and safety-approved/curated display label.
- Each verified tier's remaining count and Grand Prize flag.
- Deterministic Grand Prize remaining summary.
- Deterministic total remaining count.
- Normalized CNY unit price in integer minor units.
- Deterministic remaining full-pack cost, explicitly labeled as a calculation.
- Optional legacy initial total/drawn count only when the exact verified source schema really contains compatible facts.

R2 does not contain manufacturer initial ticket slots. The contract therefore does not require initial totals or drawn count. They are optional facts, never inferred from the first observed snapshot.

Raw labels, IP/theme text or notes without an approved public-safety/normalization basis are omitted or replaced with a safe generic label. A missing optional field cannot block an otherwise valid marker unless a future eligibility policy explicitly makes it required.

### 4.2 Opportunity public view

The recommended public representation is:

- level: `HIGH / MEDIUM / LOW / INSUFFICIENT`;
- stable public reason code(s);
- allowlisted reason facts drawn only from verified/derived board facts, observedAt and Freshness;
- evaluation `policyVersion`, `evaluatedAt` and `asOf`.

Reason codes may explain facts such as Grand Prize remaining, total remaining, unit price, calculated remaining full-pack cost, insufficient verified inputs or low Freshness. They must not expose a hidden score, probability, internal evidence, ranking or instructions such as “建议抽”“值得包套”“容易中奖”.

Existing V1 probability/outlook utilities are not automatically reusable as V2 Opportunity policy. Existing exact cost arithmetic may be reused after price normalization, but the result is descriptive rather than advisory.

Record type is not an Opportunity input or weight. The public contract does not create `trustScore`, `confidenceLevel`, `HIGH_TRUST`, `LOW_TRUST`, “可信度高” or “可信度低”. No screen-recapture detector, liveness/real-scene challenge, flash challenge or extra anti-spoofing VLM is introduced by TASK-V2-08.

### 4.3 Freshness public view

The recommended contract is server-evaluated band plus reproducible timestamps:

- `observedAt`: immutable observation time;
- `freshnessBand`: `RECENT / AGING / LOW / UNKNOWN`;
- `freshnessAsOf`: server evaluation time;
- `freshnessPolicyVersion`.

The client may render “X 分钟／天前” from `observedAt` relative to response `asOf`, then advance the relative label locally without changing the authoritative band. Thresholds and refresh scheduling remain policy/implementation details.

Required disclosure semantics: “这是 X 时间前观察到的版面状态，不保证现实库存实时同步。” Low Freshness may be omitted from the default opportunity viewport while remaining available through an explicit historical mode under D05; Freshness never changes Verification or deletes history.

## 5. Location, venueNote and source

### 5.1 Public Location

Public marker coordinates use GCJ-02-compatible semantics and include `precisionMode = EXACT / APPROXIMATE / AREA`. `NOT_PUBLIC` produces no marker. Numeric meter/grid/offset parameters remain deferred.

Optional `areaLabel`, `city` or `region` must come from an approved PublicLocationProjection. Raw GPS accuracy, private capture coordinate, resolver candidates, provider payload and capture evidence are forbidden.

Provider attribution is absent unless a future provider/license contract explicitly requires a public attribution field for a value actually included. Tencent POI is not an MVP data dependency.

### 5.2 venueNote

`venueNote` is detail-only and optional. It is included only when exact content provenance proves the applicable safety pass and current authorization, Rights, Eligibility and lifecycle all permit it. V1 assisted text may reuse its exact `MAP_NOTE/msgSecCheck` pass; changed content and NETWORK_SOURCE/provider/admin/direct-upload text require a new equivalent safety decision.

Missing, pending or failed note safety omits the field only. It does not remove an otherwise eligible marker. The note is not a Venue, coordinate source or BoardInstance identity proof.

### 5.3 Record type, contributor and network source

- PLAYER_ASSISTED displays `DRAW_RECORD / 抽赏记录`.
- PLAYER_DIRECT displays `UPLOAD_RECORD / 上传记录`.
- V1_HISTORY preserves its actual direct/assisted origin and maps to the corresponding record type.
- PLAYER detail may return `contributor.displayName` and `contributor.avatar` from an authorization-applicable public-safe Profile projection. Missing custom fields use `ICHI 玩家` and the ICHI fallback avatar; Profile completion never gates map read or contribution.
- NETWORK_SOURCE observations display `网络来源`.
- NETWORK_SOURCE never receives or imitates a player contributor object.
- `contributor` never exposes openid, accountId, ICHI ID, internal profile ID, phone, auth/session identity, private avatar fileID or Storage metadata.
- Network URL and rights evidence remain private by default. If a future attribution contract requires a URL, it is a versioned allowlist expansion and must be separately approved.

## 6. BoardInstance current-state compatibility

Three related rules operate at different levels and do not conflict:

1. **Lineage level:** one BoardObservation lineage has at most `0..1` active public derivation relationship. Revisions of that lineage cannot create simultaneous current contributions.
2. **Resolved instance level:** one BoardInstance has at most `0..1` current map state. Multiple independent lineages associated by `UNIQUE_MATCH` remain historically intact, but only one selected current eligible state is served.
3. **Public lifecycle level:** that current state keeps one stable `publicLeadId` while at least one eligible supporting Observation preserves an uninterrupted public lifecycle. Supporting source/contributor changes do not merge Rights lineage.

Resolution effects:

- `UNIQUE_MATCH`: retain all observations; suppress the superseded current state. If a newer eligible observation seamlessly replaces the old eligible support, keep the active publicLeadId and increment servedVersion. If a newer observation proves the old state obsolete but no eligible support remains, hide and retire the old lead; later re-publication uses a new ID.
- `NO_MATCH`: create/retain an independent BoardInstance; multiple current leads at the same location are valid.
- `AMBIGUOUS`: do not merge and do not hide independent candidates based on uncertainty alone. Return separate eligible items, potentially at identical/similar public coordinates, with overlap metadata.

`overlapHint` is display metadata, not an association result. Future clustering may group presentation but cannot collapse identities, transfer Rights or select a winner. Historical browsing may return retired/historical observations through a separate explicit mode; they are never mislabeled as current markers.

## 7. Viewport and cursor contract

### 7.1 Request semantics

- Exactly one bounded spatial selector: viewport `bbox` or an approved bounded cell set.
- `zoom` or zoom band, allowlisted public filters, positive `limit`, optional opaque cursor.
- Client `requestId` and monotonic request `generation`.
- Supported public schema range/capability.
- Server always enforces a maximum result cap regardless of requested limit.

The map reads only the future ICHI service boundary. It never queries private collections and never calls Tencent POI to construct the result set.

### 7.2 Response and snapshot semantics

- Echo requestId/generation and a digest/bounded representation of query bounds and filters.
- Include server `asOf`, served schema version, items, optional next cursor, truncation and density metadata.
- Cursor is bound to query bounds/cells, zoom band, filters, schema and `asOf` snapshot. Reuse outside that binding returns `INVALID_CURSOR`.
- Pagination preserves the same `asOf`; a changed query or refresh starts a new generation/snapshot.
- Client accepts only the latest applicable generation. Late responses are discarded and logged without mutating visible state.
- Exact ordering algorithm and index/storage strategy remain deferred, but pagination must be deterministic within a snapshot.

### 7.3 Density and multi-instance

The service may report returned count, server cap, truncation, overlap presence and whether aggregation is available. It must support multiple items with identical or nearby public coordinates and must not auto-merge them because labels or positions match.

Future cluster/aggregate responses require a schema extension with stable drill-down semantics. V2-B does not freeze clustering thresholds, visual design or aggregation algorithm.

## 8. Detail read and silent trusted Account access

Founder-adjusted MVP boundary:

- Viewport and public detail require the existing trusted WeChat identity/silent Account bootstrap. No explicit login button, phone number, nickname/avatar prompt or Profile-completion gate is allowed.
- The trusted internal account identity may drive read rate limits, abuse control, distinct-reporter deduplication, Human Assistance cooldown and future account-level guards/cache, but it never enters the public payload.
- Detail accepts only `publicLeadId` plus schema capability; no private lookup keys.
- A hidden, withdrawn, taken-down or retired lead returns a generic `LEAD_UNAVAILABLE` envelope and no cached private/internal removal reason.
- Profile remains optional and does not gate browsing or contribution. Completely unauthenticated Web map/external API access is outside V2 MVP and requires a later contract.

## 9. Error, offline and stale semantics

| Situation | Contract behavior |
| --- | --- |
| initial loading | No false empty result; explicit loading state |
| empty viewport | Successful empty result with `asOf`, not an error |
| first-load error | Error + retry + city/area/list fallback; no fabricated markers |
| pagination error | Keep already loaded snapshot; identify page retry without clearing valid items |
| offline with cache | Show cached public snapshot with visible stale/offline disclosure and original `asOf` |
| offline without cache | Show offline state and manual city/list guidance; no stale fabrication |
| stale cache | Never imply live inventory; user can refresh when connected |
| late generation response | Discard and log requestId/generation; do not overwrite current viewport |
| invalid cursor | Keep loaded data; restart the query snapshot, never silently splice snapshots |
| unsupported schema | Fail safe with upgrade/compatibility state; never parse unknown fields as trusted facts |
| lead hidden/withdrawn/taken down | Detail returns generic `LEAD_UNAVAILABLE`; cached item is removed from current view |
| location permission denied | Map remains usable through pan/zoom, manual city/area and list/viewport browsing |
| no eligible PublicLocation | Record is not returned as marker; this is not a query error |
| optional provider unavailable | No impact on core map browse; optional search/enhancement alone degrades |

Public error codes may include `INVALID_REQUEST`, `INVALID_CURSOR`, `SCHEMA_UNSUPPORTED`, `RATE_LIMITED`, `TEMPORARILY_UNAVAILABLE` and `LEAD_UNAVAILABLE`. Internal rights, moderation, verification or takedown reasons are never exposed.

## 10. Allowlist and forbidden data

### 10.1 Explicit public allowlist

- Common opaque identity/version/schema/asOf fields.
- PublicLocationProjection point/precision and approved area labels.
- Safe board short label and conditionally approved structured board facts.
- Opportunity level, stable public reason codes and allowlisted reason facts.
- observedAt and public Freshness representation.
- PLAYER record type and detail-only public-safe contributor displayName/avatar; NETWORK source label.
- Optional exact safety-provenance-qualified venueNote in detail.
- Required non-real-time/non-recommendation disclosures.
- Bounded pagination/density/overlap metadata.

### 10.2 Explicitly forbidden

- `openid`, `ownerAccountId`, `accountId`, ICHI ID, internal profile ID, phone, auth/session identifiers or Human Assistance user identity.
- unsafe nickname text, private `avatarFileId`, owner-scoped avatar temp URL as a stable identity, or private avatar Storage metadata. Only the explicit public contributor projection is allowed.
- private `recordId`, `recordCode`, `boardId`, `submissionId`, `verificationId`, `recognitionJobId`, lineage or private BoardInstance IDs.
- raw capture coordinates, raw GPS accuracy, private capture context, private coordinate history or resolver candidates.
- Verification evidence, provider raw output, moderation evidence, report identities/count details or rights evidence.
- private network source URL unless a later explicit attribution contract adds it.
- raw authoritative draw events or full submission history.
- internal Opportunity score/weights/ranking/probability.
- unpublished/unapproved board or evidence images. `PUBLIC_IMAGE_NO_MVP` excludes board imagery; it does not prohibit the separately authorized public-safe contributor avatar projection.
- text without an applicable safety decision.
- internal visibility/removal reason or tombstone contents.

Unknown fields default to `PRIVATE / NOT_PUBLIC`. A schema implementation must serialize from the allowlist, not subtract fields from a private object.

## 11. Compatibility policy

- Clients declare a supported schema range; the service selects a compatible version or returns `SCHEMA_UNSUPPORTED`.
- Additive optional fields require default omission-safe behavior. A field becoming required, changing meaning/type or expanding public scope is a versioned contract change and may require new authorization/policy review.
- Unknown enum values are rendered as safe generic/insufficient states, not interpreted optimistically.
- `servedVersion`, projection/policy versions and response `asOf` make cache/debug behavior reproducible without exposing internal evidence.
- Storage strategy remains `DEFERRED`; compatibility semantics must be identical for materialized, request-time or hybrid implementations.

## 12. Contract scenarios

| ID | Scenario | Required result |
| --- | --- | --- |
| M1 | two historical observations uniquely resolve to one instance | one current marker; both observations remain private/history |
| M2 | newer unique successor not yet eligible | old current marker hides; new marker waits |
| M3 | two no-match instances share exact public coordinate | two public items; overlap metadata may help display |
| M4 | ambiguous same-series observations | no merge/hide based only on ambiguity; separate eligible items |
| M5 | R2 tier count is zero | return `0`, never null/omit as unknown |
| M6 | recognition draft count is null | do not publish it as a verified reason fact |
| M7 | no R2 initial total | omit initial total/drawn count; do not infer |
| M8 | assisted V1 exact approved note passes hash/safety gates | detail may include note; marker remains minimal |
| M9 | direct or NETWORK note has no new safety pass | omit note; retain otherwise eligible marker |
| M10 | cursor used with different filter/asOf | `INVALID_CURSOR`; retain prior loaded data |
| M11 | old generation returns after pan | discard response and log generation |
| M12 | permission denied | manual pan/city/list remains usable |
| M13 | lead withdrawn during detail fetch | generic unavailable; no internal reason leakage |
| M14 | optional provider is down | core viewport/detail service still functions |
| M15 | client supports no served schema | fail safe; do not parse/display partial private data |
| M16 | high-density viewport exceeds cap | bounded items + truncation/density metadata + cursor/zoom guidance |
| M17 | cached snapshot is offline/stale | preserve original asOf and display offline/non-real-time state |
| M18 | private input gains an unknown field | field does not enter public serialization |

### Founder-adjusted record/profile/identity scenarios

| ID | Scenario | Required result |
| --- | --- | --- |
| M-A | `DRAW_RECORD + HIGH` | Use high-execution record style and independently visible HIGH Opportunity |
| M-B | `UPLOAD_RECORD + HIGH` | Use gray/low-saturation upload style while HIGH remains clear; never emit LOW_TRUST |
| M-C | `DRAW_RECORD + LOW` | Keep draw-record visual system while Opportunity remains LOW |
| M-D | upload-record detail | Show `上传记录` and public-safe nickname/avatar; no private identity |
| M-E | draw-record detail | Show `抽赏记录` and public-safe nickname/avatar |
| M-F | player has no custom Profile | Use `ICHI 玩家` + ICHI fallback avatar; no Profile gate or PublicMapLead block |
| M-G | new eligible Observation uniquely continues same BoardInstance | Update current supporting Observation and servedVersion; retain publicLeadId/history; Rights lineages remain independent |
| M-H | current contributor deletes but another eligible support already exists | Remove deleted lineage; continuously project from the other support and retain publicLeadId |
| M-I | all eligible support disappears, then a valid support appears later | Hide/retire old lead; never resurrect old ID; create a new publicLeadId |
| M-J | trusted user opens map without completed Profile | Silent Account bootstrap permits browse; account may guard rate/abuse; no Profile UI gate |
| M-K | Direct Upload reaches future V2 adapter | Use P1 source-specific evidence without requiring assisted drawSubmission; if common Verification and all public gates pass, it may become PublicMapLead |
| M-L | upload record lacks eligible PublicLocation | No marker and no private-coordinate fallback |
| M-M | PLAYER detail attribution | Return only displayName/public-safe avatar plus recordType; no openid/account/internal IDs |
| M-N | NETWORK_SOURCE item | Show `网络来源`, no fabricated contributor Profile, URL private by default |

## 13. Founder decisions approved

| Decision | Final decision | State | What it freezes |
| --- | --- | --- | --- |
| `D08-01` | `APPROVED / OPAQUE_PUBLIC_LEAD_ID` | `HUMAN_APPROVED` | Map-only identity never derives from fileID/DB/V1/account/location IDs; retired ID no-resurrection |
| `D08-02` | `APPROVED / STORAGE_AGNOSTIC_CONTINUES` | `HUMAN_APPROVED` | Materialized/request-time/hybrid remains deferred |
| `D08-03` | `APPROVED AS ADJUSTED / BOARD_INSTANCE_ONE_CURRENT_WITH_STABLE_ACTIVE_PUBLIC_ID` | `HUMAN_APPROVED` | Stable ID within uninterrupted BoardInstance public lifecycle; retirement requires new ID |
| `D08-04` | `APPROVED AS ADJUSTED / MARKER_MINIMUM_DETAIL_SPLIT_WITH_RECORD_EXECUTION_HIERARCHY` | `HUMAN_APPROVED` | Marker/detail split plus draw/upload execution style independent of Opportunity/Freshness |
| `D08-05` | `APPROVED / DETAIL_BY_PUBLIC_ID_ONLY` | `HUMAN_APPROVED` | No private key or coordinate detail lookup |
| `D08-06` | `APPROVED / CONDITIONAL_STRUCTURED_FACT_ALLOWLIST` | `HUMAN_APPROVED` | Only verified, safe, applicable facts; optional missing fields omitted |
| `D08-07` | `APPROVED / FOUR_LEVEL_REASON_TRACE_NO_RECOMMENDATION` | `HUMAN_APPROVED` | Public Opportunity level/reasons and disclosure semantics |
| `D08-08` | `APPROVED / SERVER_BAND_WITH_ASOF_CLIENT_RELATIVE_LABEL` | `HUMAN_APPROVED` | Reproducible Freshness with client relative rendering |
| `D08-09` | `APPROVED / VENUE_NOTE_DETAIL_ONLY_BY_EXACT_SAFETY_PROVENANCE` | `HUMAN_APPROVED` | D07-07 projection and field-only omission |
| `D08-10` | `APPROVED AS ADJUSTED / PUBLIC_PLAYER_PROFILE_ATTRIBUTION` | `HUMAN_APPROVED` | PLAYER detail exposes safe nickname/avatar + record type; NETWORK never impersonates a player |
| `D08-11` | `APPROVED / BOUNDED_VIEWPORT_SNAPSHOT_CURSOR` | `HUMAN_APPROVED` | bbox/cell, cap, cursor query/asOf binding and generation discard |
| `D08-12` | `APPROVED / MULTI_ITEM_NO_AUTO_MERGE_WITH_DENSITY_METADATA` | `HUMAN_APPROVED` | Same-location instances remain distinct; clustering stays future extension |
| `D08-13` | `APPROVED AS ADJUSTED / SILENT_ACCOUNT_PUBLIC_READ_NO_PROFILE_GATE` | `HUMAN_APPROVED` | Trusted silent Account required; Profile/phone/login UI never gate browse |
| `D08-14` | `APPROVED / STRICT_SCHEMA_NEGOTIATION_FAIL_SAFE` | `HUMAN_APPROVED` | Version mismatch and unknown enum behavior |
| `D08-15` | `APPROVED / PUBLIC_IMAGE_NO_MVP` | `HUMAN_APPROVED` | No public board/evidence image; contributor avatar is separate authorized Profile projection |
| `D08-16` | `APPROVED / FIELD_LEVEL_AND_SNAPSHOT_SAFE_ERRORS` | `HUMAN_APPROVED` | Offline/cache/pagination/unavailable states do not leak or fabricate |
| `D08-17` | `APPROVED AS ADJUSTED / SOURCE_SPECIFIC_AUTHORITATIVE_INPUT_WITH_PUBLIC_RECORD_TYPE` | `HUMAN_APPROVED` | Assisted composite and direct P1 each feed common Verification; public recordType retained |
| `D08-18` | `APPROVED / PUBLIC_LOCATION_REQUIRED_FOR_MARKER` | `HUMAN_APPROVED` | NOT_PUBLIC/internal-only records never produce marker |

Founder 通过本轮 Closeout 命令正式批准调整后的 D08-01—18；以上内容现为 V2-B frozen input。

## 14. Gate and implementation status

- `PDG-V2-01/04/05/07` are closed by the approved D08 decisions; `PDG-V2-02` remains closed by D06-A1 and D08-10.
- `PDG-V2-02` now inherits approved `D06-A1 PUBLIC_PLAYER_PROFILE_ATTRIBUTION`; `PDG-V2-03` map authorization remains approved input and its first V2 scope includes safe Profile attribution.
- TASK-V2-09 的 D09-01—13 已 `COMPLETE / HUMAN_APPROVED`：采用 hybrid materialized public-safe core + request-time envelope、server-only geo query、snapshot cursor 与 Cloud Function logical transport；D09-07 仅是 pilot default，D09-11 仅是 operational target。
- TASK-V2-10—13 的本地 server-side reference implementation 已完成，当前为 `IMPLEMENTATION_COMPLETE / AWAITING_FOUNDER_FINAL_REVIEW`；没有接入生产 runtime/resource。V2-D—E 与 TASK-V2-14—22 继续 `LOCKED / NOT_STARTED`，numeric public-location precision、clustering UI 和生产 schema 仍按 downstream owner 延后。

`PUBLIC_MAP_LEAD_STORAGE_STRATEGY = DEFERRED`

`TASK_V2_08 = COMPLETE / HUMAN_APPROVED`

`V2_IMPLEMENTATION_STARTED = YES / LOCAL_ONLY`
