# V2 Query / Security / Resource / Migration Contract

> Task: `TASK-V2-09`
>
> Status: `COMPLETE / HUMAN_APPROVED`
>
> Date: 2026-09-12
>
> Runtime / backend / Cloud Function / DB / Storage / API / production config change: `NO`

## 1. Scope and inherited boundaries

This contract converts the approved V2-B `PublicMapLead` service boundary into a proposed physical serving, query, security, resource and migration design. It does not create a collection, index, function, API, cache, migration, feature flag or production configuration.

The following V2-B facts remain unchanged:

- the map displays ICHI board-opportunity intelligence, not a shop or Tencent POI database;
- `PublicMapLead` is an allowlist-only public service boundary and never a private truth source;
- clients must not read `BoardObservation`, `VerifiedBoard`, internal review data or any existing V1 collection;
- `publicLeadId` cannot be resolver evidence for `BoardInstance`;
- Opportunity, Freshness and record type remain independent;
- a missing Rights, consent, moderation or Public Location gate fails closed;
- withdrawal and takedown hide first, and a retired `publicLeadId` never returns;
- Tencent Location Service remains an optional enhancement and is not used by viewport browsing.

## 2. Recommended serving strategy

### D09-01 — Hybrid public serving model

`RECOMMENDATION = MATERIALIZED_PUBLIC_CORE + REQUEST_TIME_SERVICE_ENVELOPE`

The future projector materializes only the sanitized fields needed to serve an eligible map lead. The query service reads this isolated public-serving core, rechecks current visibility, applies bounded spatial retrieval and constructs the response envelope at request time.

This is a hybrid model:

- **materialized public core**: stable `publicLeadId`, `servedVersion`, public board summary, approved public point and precision mode, Opportunity facts/reasons, `observedAt`, freshness policy reference, source/record label, disclosures and current public visibility;
- **request-time envelope**: `asOf`, schema version, current Freshness display derived reproducibly from `observedAt + asOf + policyVersion`, pagination/density metadata and stable error mapping;
- **not materialized**: relative copy such as “3 hours ago”, private IDs, raw coordinates, capture accuracy, evidence, owner identity, internal moderation reason, resolver evidence or unpublished content.

Why this is recommended:

1. Request-time joins across private Verification, Rights, Location and moderation facts would increase leakage and fail-open risk.
2. Fully materializing time-relative Freshness would require unnecessary rewrites and could become stale.
3. A public-safe core makes the future API auditable while preserving dynamic `asOf` semantics.

The core is a serving projection, not a domain truth. TASK-V2-11 remains responsible for monotonic projector behavior and public lifecycle updates; TASK-V2-13 remains responsible for API implementation.

## 3. Logical resources and ownership

Names below are contract names only. No resource is created by TASK-V2-09.

| Proposed logical resource | Access boundary | Purpose | Owner after approval |
| --- | --- | --- | --- |
| `publicMapLeads` | server-only; client read/write denied | current and retired versions of sanitized public-serving cores | TASK-V2-11 projector writes; TASK-V2-13 reads |
| `publicMapQuerySnapshots` | server-only; client read/write denied | short-lived ordered `publicLeadId@servedVersion` references for deterministic cursor paging | TASK-V2-13 |
| `PublicLocationPolicy` | versioned server contract/config; no client mutation | carries coordinate system, precision mode and approved transform rule reference | TASK-V2-09 contract; TASK-V2-17/20/21 calibrate and verify |
| map read feature flag | server-only configuration | fail-closed enable/disable of query and detail service | TASK-V2-13/19/22 |

The existing V1 `services/cloudbase/database/resources.json` remains unchanged: `publicCollections=[]`, all 13 collections remain `ADMINONLY`, and no existing collection becomes a public read model.

### Required resource properties

- `publicMapLeads` uses an opaque ID unrelated to private `_id`, V1 record code, account/openid, source URL or Storage fileID.
- Retired entries retain only the minimum server-only no-resurrection fact required by the approved lifecycle contract; retired entries are never serialized.
- Query snapshots store public opaque references, query digest, `asOf`, expiry and an account-binding digest. They do not store raw private IDs or resolver evidence.
- No new Storage prefix, public asset bucket, Tencent provider resource or client database permission is required for MVP.

## 4. Service transport and authentication

### D09-02 — Cloud Function transport with silent trusted Account

The MVP recommendation is two logical operations exposed through authenticated Cloud Function calls:

- `queryPublicMapLeads`
- `getPublicMapLeadDetail`

The names are logical and do not authorize function creation. The client silently bootstraps the existing trusted WeChat Account context; Profile, phone number, nickname and avatar are not read gates. Completely unauthenticated HTTP access is outside MVP.

Cloud Function invocation rules provide an outer authentication boundary. Fine-grained validation, rate limiting, projection allowlisting and owner/privacy checks must also execute inside the function because platform invocation rules are not a substitute for business authorization.

## 5. Viewport query contract

The D08 logical request/response shape remains authoritative. TASK-V2-09 adds these physical constraints.

### Request validation

- `bbox` is required for map mode; all four values must be finite, ordered and in valid GCJ-02 longitude/latitude ranges.
- antimeridian-crossing boxes are rejected for the Shanghai MVP rather than silently reinterpreted;
- `zoom`, filters and city/list-mode parameters must match the versioned policy allowlist;
- `limit` is an integer from 1 to 50; the service defaults downward and never accepts a larger client cap;
- `requestId` is bounded, non-authoritative and reflected only for response correlation;
- a cursor request cannot change bbox, mode, filters, limit, schema version or `asOf`.

### Retrieval and spatial index

### D09-03 — Geo-index primary retrieval with deterministic service filtering

- The materialized public point uses the CloudBase Geo Point type in GCJ-02 and requires a dedicated geographic index.
- The first candidate query uses a rectangular `geoWithin` region; the service then performs an exact numeric bbox check before serialization.
- The client never supplies a database predicate or field list.
- A versioned query-cell field may be added later as a measured fallback, but cell/geohash levels are not frozen without TASK-V2-18 load evidence.
- Regex search and arbitrary sort are excluded from the viewport operation.

The CloudBase documentation states that geospatial queries require a geographic index and supports region queries such as `geoWithin`. This contract treats those statements as documentation facts; actual index creation and execution-plan evidence belong to TASK-V2-19.

### Bounded-result policy

Recommended pilot defaults are policy-versioned operational limits rather than permanent domain constants:

| Limit | Recommended pilot default | Failure behavior |
| --- | ---: | --- |
| returned items per page | `50` | clamp default downward; reject values above 50 |
| snapshot candidate cap | `500` | return bounded items with `truncated=true`; require zoom/filter/list refinement |
| snapshot TTL | `120 seconds` | `CURSOR_EXPIRED`; restart query |
| bbox maximum | versioned Shanghai/city policy | `INVALID_VIEWPORT`; do not broaden automatically |
| response serialized size | `64 KiB` target, hard bounded in implementation | truncate at item boundary with density metadata; never drop allowlist checks |

TASK-V2-18 must tune these values using real index and load evidence without changing the bounded semantics.

### D09-04 — Snapshot-backed opaque cursor

The first page creates a short-lived ordered snapshot of at most 500 `publicLeadId@servedVersion` references. The cursor contains only a random snapshot handle, page offset and authentication tag. Bbox, IDs, account identity and private facts are not embedded in client-readable form.

The server binds the snapshot to account digest, query digest, schema version, `asOf` and expiry. Cursor tampering, reuse by a different account, changed filters, malformed offsets and expiry fail closed.

Before serializing any snapshot item, the service rechecks current visibility. An item withdrawn or taken down after the snapshot was created is omitted immediately; the snapshot may therefore shrink but must never resurrect hidden data. A missing historical version produces safe omission and diagnostic counts, not fallback to private data.

### Density and overlap

### D09-05 — No server-side identity merge or semantic clustering in MVP

- Each returned item represents one current PublicMapLead.
- Same-location items remain distinct and may carry approved overlap metadata.
- The service may return density/truncation metadata but cannot merge items into a new board identity.
- When the bounded candidate cap is exceeded, the response asks the client to zoom, filter or switch to list/city fallback.
- Visual clustering remains a later client UX decision and cannot affect BoardInstance resolution.

## 6. Detail contract

- Detail accepts only an opaque active `publicLeadId` plus request correlation/schema fields.
- Detail reads the same serving projection and returns only the D08 detail allowlist.
- A retired, hidden, withdrawn, deleted, ineligible or unknown ID returns the same stable unavailable class; it must not reveal whether a private record exists.
- Detail cannot query by V1 record code, source URL, owner, internal lineage or raw coordinates.
- Contributor nickname/avatar is returned only when D08/D06 authorization and public-safe projection gates currently pass; it is never used as authentication evidence.

## 7. Security, privacy and abuse contract

### D09-06 — Defense in depth

The future implementation must enforce all of the following:

1. client access to database resources remains denied;
2. trusted Account context is required without introducing a Profile gate;
3. strict schema validation rejects unknown fields, non-finite numbers, oversized values and unsupported filters;
4. a response serializer starts from an explicit allowlist rather than deleting known private fields;
5. Public Location is read only from an approved projection; no request can increase its precision;
6. current visibility/takedown is checked after candidate lookup and before serialization;
7. public and service logs redact exact bbox, cursor, account identity and response bodies according to an approved observability policy;
8. rate limits are keyed by trusted account plus coarse abuse dimensions, never by user-controlled IDs alone.

### D09-07 — Pilot rate policy

Recommended initial policy, adjustable only through versioned server configuration:

- viewport/list queries: token bucket averaging 30 requests/minute/account with burst 10;
- detail: 60 requests/minute/account with burst 15;
- malformed or cursor-tampering traffic consumes the same or stricter budget;
- global emergency budget and feature flag stop runaway cost independent of per-account limits;
- rate responses use a stable retryable error and bounded `retryAfterSeconds`, without revealing the rule internals.

These are safety defaults, not scale claims. TASK-V2-18 owns load tuning and TASK-V2-21 owns pilot calibration.

### D09-08 — No shared response cache in MVP

Server response caching is not required initially. This removes cache-invalidation races for withdrawal/takedown and avoids using stale output as authority. The short-lived query snapshot is pagination state, not a reusable response cache.

TASK-V2-14 may implement bounded client cache/offline behavior under D08 rules. Cached UI must show its `asOf`/offline state and cannot be used to fetch unavailable detail. A future shared server cache requires a new invalidation proof and resource/cost review.

## 8. Public Location policy carrier

### D09-09 — Freeze the carrier, not the public meter value

The public-serving core carries:

- `coordinateSystem = GCJ02`;
- approved public point;
- `precisionMode = EXACT | APPROXIMATE | AREA`;
- `locationPolicyVersion`;
- an internal `projectionRuleId` reference used for reproducibility.

The numeric rounding radius, grid size, offset and scenario-specific permission remain outside V2-B/V2-C contract freeze. They are stored in a server-only versioned policy, never accepted from the client and never inferred from venueNote or Tencent POI. Raw Observation Location, capture accuracy and transform evidence are not copied into `PublicMapLead`.

## 9. Stable errors and retry semantics

| Error class | Retry | Public meaning |
| --- | --- | --- |
| `INVALID_REQUEST` | after correcting input | malformed/unsupported request |
| `INVALID_VIEWPORT` | after moving or narrowing | bbox violates bounded policy |
| `UNAUTHORIZED` | after silent account re-bootstrap | trusted Account unavailable |
| `RATE_LIMITED` | after bounded delay | request budget exhausted |
| `CURSOR_INVALID` | restart query | tampered or mismatched cursor |
| `CURSOR_EXPIRED` | restart query | snapshot TTL elapsed |
| `LEAD_UNAVAILABLE` | no automatic identity probing | detail not publicly available |
| `SCHEMA_UNSUPPORTED` | client upgrade/fallback | incompatible contract version |
| `SERVICE_UNAVAILABLE` | bounded retry, then list/offline fallback | safe technical failure |

Internal database, provider, rule, moderation and identity details are never exposed in error messages. Unknown server failures map to `SERVICE_UNAVAILABLE` with a correlation ID.

## 10. Resource and production diff proposal

This table is a future diff review, not a deploy manifest.

| Category | Proposed future delta | TASK-V2-09 actual delta |
| --- | --- | ---: |
| DB collection | `publicMapLeads`, `publicMapQuerySnapshots` | `0` |
| DB indexes | geo index on approved public point; unique/lookup and expiry indexes to be proven in TASK-V2-19 | `0` |
| Cloud Functions | query/detail operations implemented in TASK-V2-13 | `0` |
| client DB permission | none; existing ADMINONLY boundary preserved | `0` |
| Storage/public assets | none for MVP contract | `0` |
| Tencent Location Service | none for viewport query | `0` |
| production config/feature flag | future fail-closed flag only | `0` |
| migration/backfill | staged contract below; no execution | `0` |

## 11. Cost envelope

Official CloudBase resource-point pricing checked on 2026-09-12 lists document-database calls at ¥0.2 per 10,000 and database capacity at ¥0.04/GB/day. Package and compute billing remain environment-dependent and must be read back before deployment.

For a conservative contract comparison of 100,000 public requests/month:

| Component | Contract assumption | Planning estimate |
| --- | ---: | ---: |
| public DB query/detail calls | 100,000 | ¥2.00 |
| snapshot create/read/cleanup calls | up to 150,000 | ¥3.00 |
| snapshot + projection capacity | average ≤0.25 GB | ≤¥0.31/month |
| function invocation/compute/traffic | reuse V2-A measured assumptions with 2.2× safety factor | ≤¥1.00/month |
| monitoring/error headroom | planning reserve | ¥3.00/month |
| estimated V2 incremental variable cost | — | `≤¥9.31/month` |

This is a planning bound, not a bill or capacity proof. It excludes the existing CloudBase base plan. If V2 alone requires a package upgrade, if measured variable cost exceeds ¥20/month, or if mandatory observability cannot fit the remaining budget, TASK-V2-18/19 must return `ADJUST / STOP` before production enablement.

## 12. Migration and rollback contract

### D09-10 — Shadow-first, no bulk-public migration

Migration must be independently authorized in TASK-V2-19 and follow these gates:

1. **resource dry run**: compare proposed collections, indexes, function permissions, feature flag and rollback ownership; no mutation;
2. **empty resource creation**: create server-only resources with client access denied and read back actual rules/indexes;
3. **synthetic verification**: write synthetic PublicMapLead projections only, verify bounded query/detail and delete them;
4. **shadow projection**: project only records that satisfy all current Verification, Opportunity, Rights/consent, Location, privacy and moderation gates; public read flag remains off;
5. **aggregate reconciliation**: compare counts, reason classes and version monotonicity without exporting private rows;
6. **limited allowlisted pilot**: explicitly approved records only; no V1-history or NETWORK_SOURCE bulk publication by default;
7. **read enablement**: enable query service through a fail-closed server flag after security and cost read-back;
8. **seeding/release**: NETWORK_SOURCE stage 3 and broader data publication remain TASK-V2-21/22 gates.

Dry runs may emit aggregate counts and hashes but no owner IDs, raw coordinates, source images, notes or private record contents.

### D09-11 — Rollback is service disable + hide, not V1 data rollback

Rollback order:

1. disable query/detail through the server flag;
2. stop new projection writes;
3. hide affected public serving rows and invalidate query snapshots;
4. verify that no public operation returns a lead;
5. preserve minimal audit/no-resurrection facts and the untouched V1 private truth;
6. remove isolated V2 resources only under a separate destructive-operation approval after retention obligations are satisfied.

Rollback never rewrites or deletes V1 Current Truth, never restores a retired `publicLeadId`, and never treats a stale snapshot as public authority.

## 13. Verification matrix

| Case | Expected result |
| --- | --- |
| valid Shanghai bbox, limit 30 | ≤30 allowlisted items, stable `asOf`, current visibility rechecked |
| limit 51 / NaN / inverted bbox / antimeridian | stable validation error; zero DB broadening |
| changed filter with cursor | `CURSOR_INVALID` |
| cursor reused by another account | `CURSOR_INVALID`; abuse budget consumed |
| cursor after 120 seconds | `CURSOR_EXPIRED`; restart query |
| lead withdrawn after first page | omitted from later page and detail; never resurrected |
| same point, two BoardInstances | two distinct items/overlap metadata; no merge |
| candidate cap exceeded | bounded response, `truncated=true`, zoom/filter/list guidance |
| raw/private fields injected into stored fixture | serializer/schema test fails; no partial response |
| low Freshness but still eligible | remains truthful historical lead according to display policy |
| no Public Location | absent from marker query; internal fact may remain |
| CloudBase query failure | `SERVICE_UNAVAILABLE`; no private fallback or client DB read |
| Tencent POI unavailable | no effect on MVP viewport query |
| rollback flag off | query/detail fail closed; V1 remains unchanged |

Required future automated evidence includes schema/contract tests, property tests for bbox/cursor, negative field-leak fixtures, index/read-back verification, rate/load tests, cost sampling, migration dry-run reconciliation and rollback/no-resurrection tests.

## 14. Founder decisions approved

Founder approved D09-01—13 as recommended through `TASK-V2-09_Accept_and_V2-C_Safe_Batch_Execution_Command.md` on 2026-09-12:

| ID | Decision | Approved result |
| --- | --- | --- |
| D09-01 | physical serving strategy | `APPROVED` — hybrid materialized public core + request-time envelope |
| D09-02 | MVP transport/read identity | `APPROVED` — Cloud Function operations + silent trusted Account; no Profile gate |
| D09-03 | spatial retrieval | `APPROVED` — public GCJ-02 Geo Point + geo index + server exact bbox check |
| D09-04 | pagination | `APPROVED` — server-side short-lived snapshot + opaque authenticated cursor |
| D09-05 | density/cluster | `APPROVED` — no server identity merge; bounded distinct items + truncation/overlap metadata |
| D09-06 | resource boundary | `APPROVED` — two isolated server-only logical collections; no client DB access |
| D09-07 | pilot query limits | `APPROVED AS PILOT DEFAULT` — page 50, snapshot 500, TTL 120s; not permanent domain constants |
| D09-08 | cache | `APPROVED` — no shared response cache in MVP; snapshot is pagination state only |
| D09-09 | rate/abuse | `APPROVED` — versioned account-bound token buckets + global emergency budget |
| D09-10 | Public Location | `APPROVED` — freeze carrier and GCJ-02/precision semantics; numeric policy remains calibrated later |
| D09-11 | cost gate | `APPROVED AS OPERATIONAL TARGET` — incremental variable target ≤¥20/month; correctness/security cannot be reduced to meet it |
| D09-12 | migration | `APPROVED` — resource dry-run → synthetic → shadow → allowlisted pilot; no automatic bulk public |
| D09-13 | rollback | `APPROVED` — disable/hide/invalidate first; preserve V1 and no-resurrection facts |

TASK-V2-18/21 retain ownership of real performance/cost calibration. The initial approval authorized local TASK-V2-10—13 batch execution without pre-approving final review states; the founder subsequently approved all four tasks on 2026-09-13. Neither approval authorizes production actions.

## 15. Official references

- [CloudBase database API and geospatial query](https://docs.cloudbase.net/api-reference/webv3-pg/database)
- [CloudBase index management](https://docs.cloudbase.net/database/data-index)
- [CloudBase Cloud Function security rules](https://docs.cloudbase.net/cloud-function/security-rules)
- [CloudBase database security rules](https://docs.cloudbase.net/database/security-rules)
- [CloudBase resource-point pricing](https://cloud.tencent.com/document/product/876/127357)
- [CloudBase compute-resource metering](https://cloud.tencent.com/document/product/876/120342)

## 16. Current status

`TASK_V2_09_EXECUTION = CONTRACT_COMPLETE`

`TASK_V2_09 = COMPLETE / HUMAN_APPROVED`

`TASK_V2_10_TO_13 = IMPLEMENTATION_COMPLETE / AWAITING_FOUNDER_FINAL_REVIEW`

`TASK_V2_14_TO_18 = LOCKED / NOT_STARTED`

`TASK_V2_19_TO_22 = LOCKED / NOT_STARTED`

`V2_IMPLEMENTATION_STARTED = YES`
