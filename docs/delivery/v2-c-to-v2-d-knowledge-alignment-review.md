# V2-C → V2-D Knowledge Alignment Review

> Date: 2026-09-13
>
> Scope: V2-C final approval, current-truth hygiene, frozen-contract handoff and state transition only
>
> Result: `V2_C_TO_D_ALIGNMENT = PASS`
>
> Runtime implementation in this transition: `NO`

## 1. V2-C final approval record

The Founder explicitly approved the reconciled result through `V2-C_to_V2-D_Knowledge_Alignment_State_Transition.txt`:

- `TASK-V2-10 = APPROVE AS RECONCILED`
- `TASK-V2-11 = APPROVE AS RECONCILED`
- `TASK-V2-12 = APPROVE AS RECONCILED`
- `TASK-V2-13 = APPROVE AS RECONCILED`
- `V2_C_RECONCILIATION = PASS`

This is the real approval event. It is not inferred from the prior safe-batch or reconciliation execution commands. It approves the local server-side reference implementation and frozen contracts proved in `v2-c-completion-reconciliation-review.md`; it does not claim production deploy, migration, resource/index apply, secret binding, true-device, pilot or release completion.

## 2. Current-truth hygiene result

The pre-transition canonical state was correctly restored: TASK-V2-10—13 were awaiting Founder final review, V2-C was awaiting review and V2-D/TASK-V2-14—22 were locked. No old erroneous approval was used as the cause of this transition.

Current truth is now synchronized in `memory-bank/implementation-plan.md`, `progress.md`, `architecture.md`, `design-document.md` and `tech-stack.md`. The batch and reconciliation reviews record the final approval. Individual TASK-V2-10—13 packets remain historical implementation-review snapshots and are explicitly marked superseded rather than rewritten.

`CURRENT_TRUTH_CONTRADICTION = NO`

## 3. Stale or erroneous status cleanup

- Current references to TASK-V2-10—13 `AWAITING_FOUNDER_FINAL_REVIEW` were replaced with `COMPLETE / HUMAN_APPROVED`.
- Current V2-C `AWAITING_REVIEW`, `IN_PROGRESS` or awaiting-final-review state was replaced with `COMPLETE / HUMAN_APPROVED`.
- V2-D readiness is now causally tied to this Founder approval and this alignment review, not the withdrawn premature transition.
- TASK-V2-15—18 were not batch-unlocked. They remain locked behind the explicit `14 → 15 → 16 → 17 → 18` gate.
- Historical evidence and correction narratives remain intact and are labeled historical/superseded where needed.

`ERRONEOUS_APPROVAL_AS_CURRENT_TRUTH = NO`

## 4. V2-C frozen contract summary

The client boundary is PublicMapLead-only. Private observation, verification, rights, moderation, raw location and profile-storage facts remain server-side. `VerificationInput → VerifiedBoard → OpportunityEvaluation → PublicCandidate → PublicMapLead` exact-version gates cannot be recreated or bypassed by the client. PublicMapLead is the service boundary; its production storage/materialization strategy remains downstream implementation detail.

## 5. V2-C → V2-D Knowledge Alignment Matrix

| ID | Frozen knowledge inherited by V2-D | Client consequence | Reopen condition |
| --- | --- | --- | --- |
| A | Public API/service boundary | Consume public query/detail only; no private collection, P1, drawSubmission, rights, moderation, raw location, private IDs or client eligibility calculation | A required UX field is absent from the public allowlist |
| B | Marker allowlist | Use `publicLeadId`, versions, PublicLocation, short label, recordType, Opportunity, Freshness/source and overlap metadata only | Marker UX requires a new public field |
| C | Detail allowlist | Fetch by opaque `publicLeadId`; render only approved board/contributor/opportunity/freshness/location/source/disclosure fields | Detail UX requires private evidence or board image |
| D | Opportunity, Freshness and RecordType are independent | Encode execution, opportunity and time independently; never express recordType as trust | Research shows users read recordType as credibility |
| E | Opportunity level differs from public gate | Render `HIGH/MEDIUM/LOW/INSUFFICIENT`; never rerun `PASS/FAIL` eligibility | Server contract changes |
| F | Opaque public identity/version | Do not merge by location/name; stable active ID, advancing servedVersion, no retired-ID resurrection | Identity lifecycle contract changes |
| G | Freshness is server-reproducible | Display service facts/relative copy; local clock is not authoritative; disclose stale cache/non-realtime | Freshness policy or payload changes |
| H | Contributor/avatar projection is public-safe | Render `displayName` and signed/public-safe locator with fallback; never handle fileID | Public contributor contract changes |
| I | Silent trusted Account | No explicit login/phone/Profile gate; identity failure gets stable recovery, not anonymous API fallback | Identity architecture changes |
| J | Opaque cursor/snapshot/generation | Never parse/reuse invalid cursor; discard late generations; keep loaded pages on pagination error | Paging contract changes |
| K | Rate/global stop are server controlled | Render stable service errors distinctly from empty state; never own counters/enable/secret | Error contract changes |
| L | Versioned authorization/owner commands | No per-record repeat consent; trusted owner, hide-first withdraw/delete, no resurrection, no Profile gate | Authorization scope changes |
| M | Moderation authority is server trusted | Client submits allowed report action only; it cannot declare reporter eligibility, moderator role, credible notice or threshold | Moderation policy changes |
| N | PublicLocation is not private location or Venue | Render only PublicLocation; no POI/Venue identity proof and no private coordinate fallback | Public location policy changes |
| O | No public board/evidence image in MVP | Marker/detail design cannot depend on board images; contributor avatar remains a separate profile projection | A new Founder public-image decision |

### Frozen marker fields

The current service marker contains:

- `publicLeadId`, `servedVersion`, `projectionVersion`, `policyVersion`, response `schemaVersion` and `asOf`;
- `publicLocation { latitude, longitude, coordinateSystem=GCJ02, precisionMode, areaLabel }`;
- `boardShortLabel`;
- `recordType = DRAW_RECORD | UPLOAD_RECORD | null`;
- `opportunity.level`;
- `freshness { observedAt, band, freshnessAsOf, policyVersion }`;
- `sourceLabel` and optional `overlapHint.displayCount`;
- response-level `nextCursor`, `truncated`, query echo and density metadata.

### Frozen detail fields

The current detail contains opaque identity/version/asOf, PublicLocation, IP/theme, allowlisted tiers, Grand Prize remaining, total remaining, optional price and deterministic full-pack cost, recordType, public-safe contributor `displayName/avatar`, Opportunity level/reason codes/policy/evaluated time, Freshness, eligible `venueNote`, safe source label, and mandatory non-realtime/non-recommendation disclosures. It contains no public board/evidence image.

## 6. TASK-V2-14 inherited inputs

TASK-V2-14 must implement deterministic client state around:

- `schemaVersion`, `servedVersion`, query identity, viewport/filter and server `asOf`;
- request `generation`, late-response discard and A/B inversion protection;
- opaque cursor, cursor expiry and no cross-query reuse;
- initial loading, loaded, empty, initial error and pagination error as distinct states;
- page-error-retains-data, public-only cache, stale disclosure and explicit refresh;
- stable `INVALID_REQUEST`, `INVALID_VIEWPORT`, `UNAUTHORIZED`, `RATE_LIMITED`, `CURSOR_INVALID`, `CURSOR_EXPIRED`, `LEAD_UNAVAILABLE`, `SCHEMA_UNSUPPORTED` and `SERVICE_UNAVAILABLE` handling;
- no client-side authoritative eligibility calculation.

It may use deterministic mocks and synthetic allowlisted fixtures, but those are not production API evidence.

## 7. TASK-V2-15 inherited inputs

TASK-V2-15 inherits `VERSIONED_MAP_CONTRIBUTION_AUTHORIZATION`, first accepted scope, PLAYER nickname/avatar attribution disclosure, eligible historical + future scope, no per-record repeat consent, material-scope reauthorization only, trusted backend owner identity, immediate hide-first withdraw/delete, delete no-resurrection and no Profile/phone gate. It remains locked until TASK-V2-14 is complete and human-approved.

## 8. TASK-V2-16 inherited inputs

TASK-V2-16 inherits marker/detail allowlists; DRAW_RECORD high-execution and UPLOAD_RECORD lower-execution visual hierarchy; independent Opportunity and Freshness encoding; contributor displayName/avatar fallback; same-location multi-item/overlap; density as display metadata only; bounded Human Assistance comparison; no trust-score or recommendation language; and no public board-image dependency. It remains locked until TASK-V2-15 is complete and human-approved.

## 9. TASK-V2-17 inherited inputs

TASK-V2-17 inherits native WeChat `<map>`, GCJ-02 PublicLocation, public coordinates only, `wx.getLocation({ type: "gcj02" })` when permitted, permission-denied/manual-city recovery, Tencent Location Services as optional enhancement, no Venue identity assumption, no marker without PublicLocation and safe deep links containing only opaque `publicLeadId`. It remains locked until TASK-V2-16 is complete and human-approved.

## 10. TASK-V2-18 inherited inputs

TASK-V2-18 must revalidate page default `50`, snapshot cap `500`, TTL default `120s`, no shared server response cache, identity-preserving density/cluster behavior, latency/QPS/payload/render/package budgets, rate and global-stop UX, weak network, signed-avatar expiry/cache behavior and V2 incremental variable cost `≤ ¥20/month`. These are pilot defaults/targets, not yet production evidence. It remains locked until TASK-V2-17 is complete and human-approved.

## 11. Downstream production obligations

| Owner | Obligations still not completed |
| --- | --- |
| TASK-V2-19 | CloudBase integration; resource/index wiring; durable rate-limit/read-control/avatar issuer/cursor-secret adapters; projector/outbox integration; migration rehearsal; rollback/security integration |
| TASK-V2-20 | True-device matrix; iOS/Android map, permission and location behavior; physical-device evidence |
| TASK-V2-21 | Closed pilot; latency/density/cost remeasurement; Freshness/report/PublicLocationCoverage calibration; NETWORK_SOURCE Initial Data Seeding evidence; RC decision |
| TASK-V2-22 | Actual production deploy; approved migration/backfill; resource/index apply; production secret/config binding; review/publication/tag |

## 12. Explicit non-production evidence warning

Local reference services, in-memory ports, synthetic allowlisted fixtures and deterministic mocks may support V2-D development. They do not count as production API, deployed CloudBase resource, durable cross-instance adapter, true-device, pilot, migration, release or publication evidence.

`production deploy / migration / backfill / DB-index mutation / Storage-ACL mutation / config mutation / secret binding = NO`

## 13. Unresolved Founder decisions

No new product, privacy, architecture or scope decision was required for this alignment. Exact UX parameters and TASK-V2-18 pilot-default calibration remain evidence work already assigned by the canonical plan, not unresolved Founder gates.

`UNRESOLVED_FOUNDER_DECISIONS = 0`

## 14. Validation and state transition result

The current plan, approved V2-C contract and V2-D inputs are consistent. No V2-D runtime code was created or changed during this transition.

- Current plan/task state: `22/22 UNIQUE / PASS`; TASK-V2-14 is the only READY task.
- Current-truth contradiction and reconciliation evidence consistency: `PASS`.
- Knowledge Matrix A—O and TASK-V2-14—22 ownership coverage: `PASS`.
- Sequential dependency gate `14 → 15 → 16 → 17 → 18`: `PASS`.
- Prettier, workflow validation and `git diff --check`: `PASS`.
- Full repository quality: `63 files / 627 tests PASS`; lint, both TypeScript checks and all contract validators pass.
- Frozen R2 suite: `16 tests PASS`; Prompt `c083066c80999722a2e3207f64654c598e418daf1c51dba35d57abf0291a3462`, Schema `178c3fffb9ad74257ad6fb0123509beacbd011225eae2aa7eb2d648beb690722`, Resolver `46ffebadc3094412c4beb9c8625acdf83346b496e382fe40a48083ff101411d8`.
- Turn-scoped runtime/backend tree SHA before and after: `f2d09d61246ca09dcac2f964715ba8f59af4350b2761c77fa3f2edf63a51507b`; runtime behavior diff `0`.
- `apps/client/miniprogram` and `services/cloudbase` scoped Git status: clean; production resource, Cloud Function, DB/index, Storage/ACL, migration/backfill and config diff `0`.
- `commit / push / PR / merge / tag / deploy / publish / upload = NO`.

`V2_C_TO_D_ALIGNMENT = PASS`

`TASK_V2_09_TO_13 = COMPLETE / HUMAN_APPROVED`

`V2_C = COMPLETE / HUMAN_APPROVED`

`V2_D = READY / NOT_STARTED`

`TASK_V2_14 = READY / NOT_STARTED`

`TASK_V2_15_TO_22 = LOCKED / NOT_STARTED`

`V2_IMPLEMENTATION_STARTED = YES / LOCAL_ONLY`

## 15. Recommendation for TASK-V2-14 start

TASK-V2-14 may start only under a later explicit execution instruction. Its first implementation must consume the frozen public service contract and build the client state/cache/race boundary before any map UI work. This command stops at readiness and does not execute TASK-V2-14.
