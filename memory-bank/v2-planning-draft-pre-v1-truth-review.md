# ICHI V2 规划草案——V1 事实审阅前版本

> **历史归档，仅用于追溯。不得覆盖 `memory-bank/implementation-plan.md` 中的当前计划，也不得作为当前任务自动执行。**
>
> `HISTORICAL / BLOCKED DRAFT — NOT EXECUTABLE`
>
> This 2026-09-08 reconstruction is preserved without deletion for comparison. The V1 truth reconciliation found that it must not remain the active implementation plan before human review of the validated V1 baseline and Current Truth Registry.

## 0. Authority and current status

> Status date: 2026-09-08
>
> Status: `DRAFT / HUMAN REVIEW REQUIRED`
>
> Branch/base: `feature/v2-board-map` exactly from `origin/main@929d189a06e13010e50abf4927bfec3b1ebd49fc`
>
> Active implementation block: none
>
> `CURRENT_V2_PLAN_AUTHORITATIVE = NO` until the user approves this reconciliation draft.
>
> `V2_IMPLEMENTATION_STARTED = NO`; every task below is `LOCKED / NOT_STARTED`.

本文件不是当前实施计划，也没有执行权。历史 V1、已被替代的 V2 与延后 V3 计划保存在 `memory-bank/implementation-plan-history.md`；唯一当前实施计划是 `memory-bank/implementation-plan.md`。本草案的历史审阅证据位于 `docs/delivery/v2-pre-development-review-packet.md`。

This pass changes documentation only. It does not authorize runtime, page, component, cloud function, database, Storage, recognition, test, production configuration, deployment, migration, commit, push, PR, merge, tag, or WeChat publication work. Do not start `TASK-V2-01` at the end of this pass.

## 1. Execution and knowledge-propagation protocol

The project uses one worktree at `/Users/cunfu/Documents/ichi 2` and branch switching only:

`latest validated main → feature/version branch → development → PR → merge main → actual WeChat publication → immutable tag`.

For every task:

1. Confirm the task is unlocked and all listed dependencies and gates are closed.
2. Read the current truth registry and the task's affected documents before changing code.
3. Complete the smallest verifiable step; run that task's automated gate.
4. Record evidence and state in `progress.md`. Automated success is `AWAITING_REVIEW`, not approval.
5. Do not unlock the next block until the current block's steps, integration gate, and user acceptance pass.

区块解锁时，区块内所有未完成 step 一并转为 `READY`；当前没有已解锁区块。

When `TASK-X` produces knowledge `K-X` that changes product assumptions, data semantics, system boundaries, architecture, interfaces, state machines, security/privacy, UX, deployment, tests, or dependencies:

1. Record `K-X`, evidence, confidence, and first affected task in `progress.md`.
2. Walk both `DEPENDENCIES` and `KNOWLEDGE_PROPAGATION` to find every unstarted downstream task.
3. Mark each affected task `AFFECTED_BY_K-X`; do not continue using the invalidated assumption.
4. Update its inputs, data contract, security boundary, implementation steps, tests, and acceptance criteria.
5. Update product behavior in `design-document.md`, technical choices in `tech-stack.md`, and real file/runtime structure in `architecture.md`.
6. If scope, platform, privacy, core architecture, or task order changes, stop and create a product decision gate for user approval.
7. Re-run workflow/contract validation before unlocking downstream work.

## V1 — completed historical baseline index

V1 is `COMPLETED / FROZEN`; its executable history is not duplicated here. Current V1 facts needed by V2 are listed below, while full task/release history remains in `implementation-plan-history.md`.

## 2. Current system truth used by V2

The detailed evidence registry is Review Packet section B. These truths are mandatory inputs:

- `TR-ACT-01—04`: first launch silently find-or-creates an ICHI Account from trusted WeChat context; Profile is optional presentation data, not login or authorization; default nickname/avatar are UI fallbacks; no phone number is required.
- `TR-DOM-01—07`: Local Board, Upload Submission, and Current Cloud Publication are separate; `boardId`, `recordId`, `recordCode`, and `submissionVersion` have separate roles; a current publication is a lightweight pointer to the exact approved submission.
- `TR-LIFE-01—05`: pending/failed/late submissions cannot replace current; local deletion is not cloud deletion; cloud deletion uses durable tombstones/jobs; stale references cannot resurrect deleted content; asynchronous responses must be identity/generation guarded.
- `TR-REC-01—05`: R2 IP/theme/tiers/direct `remainingTickets` are frozen; price and grand-prize classification remain manual; baseline R is immutable and current values are event-derived; `null` is unknown while `0` is confirmed zero; H0 is the frozen rollback.
- `TR-VER-01—04`: V1 prize-ticket verification is `LOCATION → PHOTO → NOTE`; V1 `APPROVED` proves only that private submission contract, not future public-map safety; provider, validation, database, projection, and UI failures are distinct.
- `TR-SEC-01—05`: all 13 current collections are `ADMINONLY`, there is no public collection or public map endpoint, Storage is frozen `CUSTOM`, `profile-avatars/` is owner scoped, and `recognition-temp/` is private ephemeral transport with `Expiration.Days=1` fallback.
- `TR-CLI-01—03`: My Records reads Local Boards; My Uploads reads current cloud publications; V1.0.1 share query is `tab` only and carries no private state.
- `TR-OPS-01—04`: target CloudBase behavior must be verified by read-back/smoke, WeChat-dependent behavior requires true-device gates, package size is a release budget, and immutable tags follow actual publication only.

Frozen V1 assets remain byte-identical:

- R2 Prompt SHA-256: `c083066c80999722a2e3207f64654c598e418daf1c51dba35d57abf0291a3462`
- R2 Provider Schema SHA-256: `178c3fffb9ad74257ad6fb0123509beacbd011225eae2aa7eb2d648beb690722`
- R2 Resolver SHA-256: `46ffebadc3094412c4beb9c8625acdf83346b496e382fe40a48083ff101411d8`
- Storage `CUSTOM` boundary: unchanged; any public image need requires an explicit V2 unlock decision.

## V2 — current product scope and semantic boundaries

### In scope

- Prove that time-stamped, source-labelled, non-real-time board leads help users decide where to investigate or visit.
- Establish at least one legal, sustainable, removable supply route before public launch.
- Explicit private-to-public consent, preview, review, publish, edit, withdraw, delete, and historical re-consent behavior.
- A minimal public serving projection and bounded viewport/detail API; map/list/filter/detail client experience.
- Location semantics that distinguish private device evidence, a user-confirmed venue/POI, public coordinates, and public precision.
- Freshness, pagination/limits, marker density/clustering, cache/refresh, stale response, weak-network, rate-limit, and abuse boundaries.
- Minimal structured-content moderation: eligibility, approval, admin hide, owner withdrawal, and audit.
- Layered automated, CloudBase, negative/security, true-device, closed-pilot, production-smoke, and release gates.

### Out of scope

- Real-time inventory guarantees, merchant trust scores, blacklists, inducement rankings, forums, posts, comments, DMs, feeds, or public spending profiles.
- Direct client reads of private CloudBase collections or direct writes to a public collection.
- Treating Local Board, submission history, failed drafts, or `recordCode` as map truth or identity.
- Changing frozen R2/H0 recognition semantics or widening current Storage rules.
- Automatic cross-owner real-world board merge/version consensus, which remains V3 territory.

### Deferred unless the user restores them through `PDG-V2-06`

- Watch rules, subscription-message reminders, and background notification operations.
- Draw-result posters and other package-heavy social assets.
- Rich public notes, photos, appeals/SLA machinery, and automated canonical merge/unmerge.
- Merchant/staff verification operations beyond a pilot evidence study.

### Authoritative terminology

- **Authoritative Private Domain Truth:** Current Cloud Publication pointer plus the exact `APPROVED` Upload Submission it references. It stays private.
- **Public Serving Read Model:** `PublicMapLead`, a minimal, revocable projection produced only after separate public consent/eligibility/moderation gates. It is a serving projection, not domain truth.
- **Public API Read Source:** only `PublicMapLead`; the client never queries private P1 or Submission collections.

`publicLeadId` contract for this draft: server-generated opaque random identifier with at least 128 bits of entropy; never derived from or equal to `boardId`, `recordId`, `recordCode`, owner identity, location, or submission version. One private publication lineage has zero or one active public lead; one public lead references exactly one private publication lineage and one currently served approved version. Approved replacements keep the ID. Owner withdrawal or explicit deletion retires it permanently; later republication requires fresh consent and a new ID. Admin temporary hide may preserve the ID but returns no public payload while hidden. IDs are never reused and reveal no cardinality or ownership.

## 4. Product decision gates and evidence gates

Evidence-generating tasks `TASK-V2-01—03` are not blocked by the gates they are designed to inform. They remain locked only until this plan receives human approval.

### Evidence gates

| Gate | Evidence required | Generated by | Blocks |
| --- | --- | --- | --- |
| `EG-V2-01` | Representative users understand the non-real-time promise and the map measurably improves discovery/decision work | 01 | 04 and all implementation |
| `EG-V2-02` | At least one lawful, sustainable, removable supply path; measured assessment of whether explicit V1 re-consent can seed a pilot | 02 | 04, 08—16 |
| `EG-V2-03` | Target CloudBase/map provider capability, query/index feasibility, quota/rate-limit options, rough cost, package impact, and fallback | 03 | 04, 07, 11, 14—16 |
| `EG-V2-04` | WeChat privacy/review declaration and location/public-content obligations are documented for the chosen MVP | 04 with 01—03 evidence | 05—16 |

### Product decision gates

| Gate | User decision | Evidence input | Blocks | Recommended draft |
| --- | --- | --- | --- | --- |
| `PDG-V2-01` | Public audience and contributor disclosure | EG-01/04 | 05—16 | Anonymous minimal reads; contribution requires silent Account; Profile never gates; no contributor profile in MVP |
| `PDG-V2-02` | Exact public field allowlist and resulting MVP moderation | EG-01/02/04 | 05—16 | Structured fields only; no public photo/note; eligibility + admin hide + owner withdrawal + audit |
| `PDG-V2-03` | Venue model, coordinate derivation, public precision, edit rules, and migration | EG-03/04 | 05—16 | User-confirmed venue/POI is authoritative candidate; device location remains private evidence; public coordinate is derived at approved precision |
| `PDG-V2-04` | MVP supply tranche and cross-source/canonical behavior | EG-01/02 | 05—16 | One proven player path; separate leads, no automatic canonical merge; merchant/staff remains evidence pilot |
| `PDG-V2-05` | V1 historical publications | EG-02/04 | 08—10, 15—16 | No automatic backfill; per-item fresh preview, explicit consent, and fresh eligibility review |
| `PDG-V2-06` | Completion scope and extras | EG-01/03 | 13—16 | Core map + safe deep-link landing only; reminders/posters remain deferred |

No task may treat an open gate as an implicit assumption. If evidence is insufficient, the gate stays open and blocked tasks stay locked.

## 5. Dependency-ordered V2 task plan

### Phase A — evidence before architecture

#### TASK-V2-01 — User value and comprehension discovery

| Field | Plan |
| --- | --- |
| TASK_ID | `TASK-V2-01` |
| STATUS | `LOCKED / NOT_STARTED` |
| TITLE | User value and non-real-time comprehension discovery |
| WHY THIS IS NET-NEW OR V2-SPECIFIC / CAPABILITY_DELTA | V1 validated private decision work, not public lead discovery; `NET_NEW_V2_CAPABILITY` |
| EXISTING V1 CAPABILITIES REUSED / EXISTING_SYSTEM_DEPENDENCY | V1 terminology, approved map placeholder, private board summaries as non-public research stimuli |
| GOAL | Test whether users can find useful leads faster and correctly understand source, observation time, freshness, and non-real-time limits |
| WHY_NOW | Product value must be evidenced before data/API/UI construction |
| INPUTS / PRECONDITIONS | Approved research plan; no production data exposure; human approval of this plan |
| AFFECTED DOMAIN | Product problem, comprehension, metrics, MVP boundary |
| ARCHITECTURE DECISION | None; research outputs cannot create runtime commitments |
| FILES / MODULES EXPECTED | Research and decision docs only |
| DECISION / EVIDENCE GATES | Generates `EG-V2-01`; informs `PDG-V2-01/02/04/06` |
| DATA CONTRACT | De-identified research notes and metric definitions only |
| SECURITY / PRIVACY IMPACT | No private user records in shared artifacts without explicit research consent |
| DEPENDENCIES / BLOCKS | Depends on plan approval; blocks 04—16 through EG-01 |
| IMPLEMENTATION / IMPLEMENTATION STEPS | Define hypotheses/tasks; recruit representative users; run prototype/interview study; synthesize evidence and stop criteria |
| TESTS / TEST STRATEGY | Research protocol review, evidence traceability, comprehension/error-rate analysis |
| TRUE_DEVICE / TRUE_DEVICE_REQUIRED | `NO` |
| CLOUD_DEPLOY / CLOUD_DEPLOY_REQUIRED | `NO` |
| MIGRATION / MIGRATION_REQUIRED | `NO` |
| ACCEPTANCE / ACCEPTANCE CRITERIA | Evidence supports Continue/Adjust/Stop and the user accepts the conclusion |
| ROLLBACK / FAILURE BOUNDARY | Stop or redesign scope; no runtime rollback exists |
| KNOWLEDGE_PROPAGATION INPUT / KNOWLEDGE THAT MAY INVALIDATE THIS TASK | Users cannot distinguish historical leads from real-time inventory, or the research cohort is not representative |
| KNOWLEDGE_PROPAGATION OUTPUT / DOWNSTREAM TASKS TO UPDATE IF KNOWLEDGE CHANGES | 04, 12—16 and product documents |

#### TASK-V2-02 — Legal supply and pilot sufficiency discovery

| Field | Plan |
| --- | --- |
| TASK_ID | `TASK-V2-02` |
| STATUS | `LOCKED / NOT_STARTED` |
| TITLE | Legal supply, takedown, and V1-base pilot sufficiency |
| WHY THIS IS NET-NEW OR V2-SPECIFIC / CAPABILITY_DELTA | V1 stores private publications but never established a lawful public supply route; `NEEDS_V2_EXTENSION` |
| EXISTING V1 CAPABILITIES REUSED / EXISTING_SYSTEM_DEPENDENCY | Private current-publication inventory, ownership, deletion, audit, source-path fields |
| GOAL | Prove at least one consented/removable source and quantify how many V1 records are technically eligible for per-item re-consent |
| WHY_NOW | A technically complete empty or legally unusable map is failure |
| INPUTS / PRECONDITIONS | Read-only aggregate/private eligibility methodology; no bulk public disclosure |
| AFFECTED DOMAIN | Supply, consent, source labels, pilot size, takedown |
| ARCHITECTURE DECISION | Eligibility report is private evidence, never a public backfill |
| FILES / MODULES EXPECTED | Research, compliance, decision, and aggregate report docs only |
| DECISION / EVIDENCE GATES | Generates `EG-V2-02`; informs `PDG-V2-02/04/05` |
| DATA CONTRACT | Aggregate counts and source/consent gaps; no direct public lead writes |
| SECURITY / PRIVACY IMPACT | V1 records remain private; historical use requires fresh item-level consent |
| DEPENDENCIES / BLOCKS | Depends on plan approval; blocks 04, 08—16 through EG-02 |
| IMPLEMENTATION / IMPLEMENTATION STEPS | Inventory source rights; define consent proof and takedown route; assess V1 structured-data sufficiency; propose pilot tranche and stop rule |
| TESTS / TEST STRATEGY | Evidence/license trace, deletion feasibility tabletop, reproducible aggregate query review |
| TRUE_DEVICE / TRUE_DEVICE_REQUIRED | `NO` |
| CLOUD_DEPLOY / CLOUD_DEPLOY_REQUIRED | `NO` |
| MIGRATION / MIGRATION_REQUIRED | `NO` |
| ACCEPTANCE / ACCEPTANCE CRITERIA | At least one approved route with owner/contact/takedown, or an explicit Stop decision |
| ROLLBACK / FAILURE BOUNDARY | No production write; an invalid supply route stops or narrows V2 |
| KNOWLEDGE_PROPAGATION INPUT / KNOWLEDGE THAT MAY INVALIDATE THIS TASK | Rights, consent, takedown ownership, or pilot-volume evidence proves the proposed supply unusable |
| KNOWLEDGE_PROPAGATION OUTPUT / DOWNSTREAM TASKS TO UPDATE IF KNOWLEDGE CHANGES | 04—10, 13, 15—16 and privacy/release documents |

#### TASK-V2-03 — Platform, geospatial, cost, and package feasibility spike

| Field | Plan |
| --- | --- |
| TASK_ID | `TASK-V2-03` |
| STATUS | `LOCKED / NOT_STARTED` |
| TITLE | CloudBase/map provider feasibility, cost, limits, and package spike |
| WHY THIS IS NET-NEW OR V2-SPECIFIC / CAPABILITY_DELTA | V1 has no public/viewport/geospatial serving path; `NET_NEW_V2_CAPABILITY` |
| EXISTING V1 CAPABILITIES REUSED / EXISTING_SYSTEM_DEPENDENCY | CloudBase Nodejs20.19 deployment discipline, ADMINONLY backend pattern, package-size gate |
| GOAL | Determine feasible provider, coordinate system, viewport query/index strategy, anonymous/auth option, rate limit, cost, and fallback |
| WHY_NOW | These findings can invalidate location, API, resource, and UX tasks |
| INPUTS / PRECONDITIONS | Read-only docs/target-environment inspection or isolated non-production spike explicitly approved for this task |
| AFFECTED DOMAIN | Platform, geo query, cost, package, network, privacy declarations |
| ARCHITECTURE DECISION | Spike artifacts are evidence; no production resource or frozen-boundary change |
| FILES / MODULES EXPECTED | Technical spike and decision docs; optional disposable non-production artifact only if separately approved |
| DECISION / EVIDENCE GATES | Generates `EG-V2-03`; informs `PDG-V2-03/06` |
| DATA CONTRACT | Synthetic coordinates/results only |
| SECURITY / PRIVACY IMPACT | No production locations; document provider data handling and retention |
| DEPENDENCIES / BLOCKS | Depends on plan approval; blocks 04, 07, 11, 14—16 through EG-03 |
| IMPLEMENTATION / IMPLEMENTATION STEPS | Validate SDK/base-library support; geo/index/query limits; coordinate conversion; quotas/cost; package delta; fallback architecture |
| TESTS / TEST STRATEGY | Reproducible capability matrix, synthetic load estimate, package measurement, target-environment read-back where safe |
| TRUE_DEVICE / TRUE_DEVICE_REQUIRED | `CONDITIONAL` for capability proof |
| CLOUD_DEPLOY / CLOUD_DEPLOY_REQUIRED | `NO` production deploy |
| MIGRATION / MIGRATION_REQUIRED | `NO` |
| ACCEPTANCE / ACCEPTANCE CRITERIA | The user approves a feasible bounded option or explicitly stops/changes V2 architecture |
| ROLLBACK / FAILURE BOUNDARY | Disposable spike is removable and cannot alter production or frozen boundaries |
| KNOWLEDGE_PROPAGATION INPUT / KNOWLEDGE THAT MAY INVALIDATE THIS TASK | Provider, coordinate, CloudBase limit, cost, package, or target-device evidence makes the bounded option infeasible |
| KNOWLEDGE_PROPAGATION OUTPUT / DOWNSTREAM TASKS TO UPDATE IF KNOWLEDGE CHANGES | 04—07, 11—16 and tech/architecture documents |

### Phase B — decisions and contracts

#### TASK-V2-04 — Evidence and product gate closure

| Field | Plan |
| --- | --- |
| TASK_ID | `TASK-V2-04` |
| STATUS | `LOCKED / NOT_STARTED` |
| TITLE | Close evidence gates, MVP product decisions, and completion scope |
| WHY THIS IS NET-NEW OR V2-SPECIFIC / CAPABILITY_DELTA | V1 never selected a public map MVP; `NET_NEW_V2_CAPABILITY` |
| EXISTING V1 CAPABILITIES REUSED / EXISTING_SYSTEM_DEPENDENCY | Current truth registry and V1 release/privacy contracts |
| GOAL | Resolve EG-01—04 and PDG-01—06 without hiding uncertainty |
| WHY_NOW | All architecture/implementation depends on the chosen audience, fields, location, source, history, and extras |
| INPUTS / PRECONDITIONS | Completed 01—03 evidence; compliance/review evidence; user decision session |
| AFFECTED DOMAIN | Entire V2 MVP and release definition |
| ARCHITECTURE DECISION | Freeze boundaries only; no runtime files |
| FILES / MODULES EXPECTED | PRD, design, tech, plan, progress, decision records |
| DECISION / EVIDENCE GATES | Closes all listed gates; may create explicit replacement gates |
| DATA CONTRACT | Approved public field/source/location/consent/freshness vocabulary |
| SECURITY / PRIVACY IMPACT | Defines minimum disclosure and prohibited fields |
| DEPENDENCIES / BLOCKS | Depends on 01—03; blocks 05—16 |
| IMPLEMENTATION / IMPLEMENTATION STEPS | Review evidence; record decisions/options/reasons; remove invalid tasks; refresh dependency graph and completion definition |
| TESTS / TEST STRATEGY | Workflow validation, cross-document contradiction audit, decision-to-task trace |
| TRUE_DEVICE / TRUE_DEVICE_REQUIRED | `NO` |
| CLOUD_DEPLOY / CLOUD_DEPLOY_REQUIRED | `NO` |
| MIGRATION / MIGRATION_REQUIRED | `NO` |
| ACCEPTANCE / ACCEPTANCE CRITERIA | The user signs off every gate or marks V2 stopped |
| ROLLBACK / FAILURE BOUNDARY | Changes remain document-only; an unresolved gate keeps downstream tasks locked |
| KNOWLEDGE_PROPAGATION INPUT / KNOWLEDGE THAT MAY INVALIDATE THIS TASK | Any evidence gate remains unresolved or produces mutually incompatible product choices |
| KNOWLEDGE_PROPAGATION OUTPUT / DOWNSTREAM TASKS TO UPDATE IF KNOWLEDGE CHANGES | Every affected task in 05—16 before any unlock |

#### TASK-V2-05 — Private-to-public consent, location, and lifecycle contract

| Field | Plan |
| --- | --- |
| TASK_ID | `TASK-V2-05` |
| STATUS | `LOCKED / NOT_STARTED` |
| TITLE | Explicit consent and public lifecycle domain contract |
| WHY THIS IS NET-NEW OR V2-SPECIFIC / CAPABILITY_DELTA | V1 publication is private and has no public consent lifecycle; `NEEDS_V2_EXTENSION` |
| EXISTING V1 CAPABILITIES REUSED / EXISTING_SYSTEM_DEPENDENCY | B/S/P pointer, stable IDs, approved-submission versioning, tombstones, owner deletion |
| GOAL | Specify preview → explicit consent → pending → rejected/public → edit → withdraw/delete → optional re-consent without private auto-publication |
| WHY_NOW | Public data and UI cannot be safely designed before lifecycle semantics |
| INPUTS / PRECONDITIONS | 04; PDG-01—05 closed |
| AFFECTED DOMAIN | Consent, location, publication, owner control, historical data |
| ARCHITECTURE DECISION | Device capture location remains private evidence; confirmed venue is private domain input; public coordinate/precision is derived; edit replacement keeps old approved public version until approved unless owner withdraws |
| FILES / MODULES EXPECTED | Domain/design/decision/schema docs; expected future shared contract modules |
| DECISION / EVIDENCE GATES | Must satisfy closed PDG-01—05; new ambiguity reopens a product gate |
| DATA CONTRACT | Consent version, disclosure digest, venue/POI, private device evidence, public coordinate, precision enum, approval/version/withdrawal/deletion/re-consent states |
| SECURITY / PRIVACY IMPACT | Exact public preview and explicit action; no bulk or implicit consent; withdrawal hides first |
| DEPENDENCIES / BLOCKS | Depends on 04; blocks 06—16 |
| IMPLEMENTATION / IMPLEMENTATION STEPS | State/cardinality diagrams; transitions; late/failure rules; historical policy; owner/account-change behavior; reason codes |
| TESTS / TEST STRATEGY | Domain state-transition, invariants, negative consent, stale version, deletion/resurrection matrices |
| TRUE_DEVICE / TRUE_DEVICE_REQUIRED | `NO` |
| CLOUD_DEPLOY / CLOUD_DEPLOY_REQUIRED | `NO` |
| MIGRATION / MIGRATION_REQUIRED | `NO` at contract stage |
| ACCEPTANCE / ACCEPTANCE CRITERIA | Every required lifecycle event has deterministic public/private outcomes and user approval |
| ROLLBACK / FAILURE BOUNDARY | No runtime change; unresolved lifecycle semantics keep 06—16 locked |
| KNOWLEDGE_PROPAGATION INPUT / KNOWLEDGE THAT MAY INVALIDATE THIS TASK | Consent, location, historical-publication, ownership, withdrawal, or deletion decisions change |
| KNOWLEDGE_PROPAGATION OUTPUT / DOWNSTREAM TASKS TO UPDATE IF KNOWLEDGE CHANGES | 06—16 plus design, tech, and architecture documents |

#### TASK-V2-06 — PublicMapLead and publicLeadId contract

| Field | Plan |
| --- | --- |
| TASK_ID | `TASK-V2-06` |
| STATUS | `LOCKED / NOT_STARTED` |
| TITLE | Minimal Public Serving Read Model contract |
| WHY THIS IS NET-NEW OR V2-SPECIFIC / CAPABILITY_DELTA | V1 has no public collection/read model; `NET_NEW_V2_CAPABILITY` |
| EXISTING V1 CAPABILITIES REUSED / EXISTING_SYSTEM_DEPENDENCY | Exact approved Submission facts and Current Publication lineage as private input only |
| GOAL | Freeze `PublicMapLead`, `publicLeadId`, versioning, freshness, tombstone, and public allowlist semantics |
| WHY_NOW | API, projector, client, and moderation require a shared stable projection contract |
| INPUTS / PRECONDITIONS | 05 and approved field/location policy |
| AFFECTED DOMAIN | Public projection, identifiers, null semantics, serving lifecycle |
| ARCHITECTURE DECISION | PublicMapLead is not authoritative domain truth; 0..1 active lead per private lineage; separate real-world observations remain separate for MVP |
| FILES / MODULES EXPECTED | Contract/schema docs; future public-map schema and shared types |
| DECISION / EVIDENCE GATES | PDG-02—05 closed |
| DATA CONTRACT | Opaque publicLeadId; servedVersion; source/freshness/moderation states; public location/precision; allowlisted R2-derived summary; `null ≠ 0`; no private IDs/events/profile/image/note by default |
| SECURITY / PRIVACY IMPACT | Schema-level deny-by-default allowlist and non-inferable identifiers |
| DEPENDENCIES / BLOCKS | Depends on 05; blocks 07—16 |
| IMPLEMENTATION / IMPLEMENTATION STEPS | Schema, examples, compatibility policy, cardinality, ID retirement, hidden/deleted behavior |
| TESTS / TEST STRATEGY | Schema positive/negative, ID non-derivation, null/zero, compatibility, leakage fixtures |
| TRUE_DEVICE / TRUE_DEVICE_REQUIRED | `NO` |
| CLOUD_DEPLOY / CLOUD_DEPLOY_REQUIRED | `NO` |
| MIGRATION / MIGRATION_REQUIRED | `NO` |
| ACCEPTANCE / ACCEPTANCE CRITERIA | The user approves the contract and forbidden private fields cannot validate |
| ROLLBACK / FAILURE BOUNDARY | No public resource is created until the contract is approved; incompatible change restarts contract review |
| KNOWLEDGE_PROPAGATION INPUT / KNOWLEDGE THAT MAY INVALIDATE THIS TASK | Public allowlist, privacy, location precision, cardinality, lifecycle, or opaque-ID requirements change |
| KNOWLEDGE_PROPAGATION OUTPUT / DOWNSTREAM TASKS TO UPDATE IF KNOWLEDGE CHANGES | 07—16 and every public API/UI acceptance criterion |

#### TASK-V2-07 — Public API, viewport, performance, and security contract

| Field | Plan |
| --- | --- |
| TASK_ID | `TASK-V2-07` |
| STATUS | `LOCKED / NOT_STARTED` |
| TITLE | Bounded public query and resource architecture |
| WHY THIS IS NET-NEW OR V2-SPECIFIC / CAPABILITY_DELTA | V1 has no public endpoint, geo index, or abuse boundary; `NET_NEW_V2_CAPABILITY` |
| EXISTING V1 CAPABILITIES REUSED / EXISTING_SYSTEM_DEPENDENCY | Function envelopes, stable error codes, CloudBase resource/deploy validation discipline |
| GOAL | Define viewport/detail reads, pagination/limits, cluster strategy, rate limit, cache/staleness, indexes, costs, deployment, migration, and rollback |
| WHY_NOW | Backend and UI must share query semantics before implementation |
| INPUTS / PRECONDITIONS | 03, 06; EG-03 and PDG-01/03 closed |
| AFFECTED DOMAIN | API, resources, performance, abuse, migration |
| ARCHITECTURE DECISION | Public API reads only PublicMapLead; no direct client database reads; bounded viewport plus cursor; server-enforced allowlist/rate limit |
| FILES / MODULES EXPECTED | API/resource/ADR docs; future contracts, cloud function, database resource and deploy manifest modules |
| DECISION / EVIDENCE GATES | EG-03; PDG-01/03/06 |
| DATA CONTRACT | Bounding box/cell, filters, opaque cursor, limit, result version/staleness, stable error envelope, detail by publicLeadId |
| SECURITY / PRIVACY IMPACT | Enumeration/harvest limits, coarse public precision, no owner/private lineage fields |
| DEPENDENCIES / BLOCKS | Depends on 03, 06; blocks 09, 11—16 |
| IMPLEMENTATION / IMPLEMENTATION STEPS | Query/resource ADR; index plan; density/clustering thresholds; cache/refresh; migration dry-run and rollback plan; cost budget |
| TESTS / TEST STRATEGY | Contract/property/security/load plans, invalid bbox/cursor/limit, scraping/rate-limit scenarios, resource diff review |
| TRUE_DEVICE / TRUE_DEVICE_REQUIRED | `NO` at contract stage |
| CLOUD_DEPLOY / CLOUD_DEPLOY_REQUIRED | `NO` |
| MIGRATION / MIGRATION_REQUIRED | `PLAN ONLY` |
| ACCEPTANCE / ACCEPTANCE CRITERIA | A bounded feasible architecture and rollback are approved, with no circular UI dependency |
| ROLLBACK / FAILURE BOUNDARY | No resource deploy; rejected cost/limit/security result returns to 03/04/06 |
| KNOWLEDGE_PROPAGATION INPUT / KNOWLEDGE THAT MAY INVALIDATE THIS TASK | Provider or CloudBase limits, cost, abuse model, field allowlist, precision, or load targets change |
| KNOWLEDGE_PROPAGATION OUTPUT / DOWNSTREAM TASKS TO UPDATE IF KNOWLEDGE CHANGES | 09, 11—16 plus tech and architecture documents |

### Phase C — private-to-public write path and serving backend

#### TASK-V2-08 — Owner consent and public-candidate write path

| Field | Plan |
| --- | --- |
| TASK_ID | `TASK-V2-08` |
| STATUS | `LOCKED / NOT_STARTED` |
| TITLE | Owner preview, consent, edit, withdrawal, deletion, and historical re-consent backend |
| WHY THIS IS NET-NEW OR V2-SPECIFIC / CAPABILITY_DELTA | V1 upload approval is private and never grants public rights; `NEEDS_V2_EXTENSION` |
| EXISTING V1 CAPABILITIES REUSED / EXISTING_SYSTEM_DEPENDENCY | Silent Account ownership, Current Publication, exact Submission, owner functions, audit/deletion jobs |
| GOAL | Implement owner-scoped public lifecycle commands without changing V1 private semantics |
| WHY_NOW | Projector cannot publish safely without durable consent facts |
| INPUTS / PRECONDITIONS | 05—07; gates closed; implementation block approved |
| AFFECTED DOMAIN | Consent commands, owner state, audit, historical eligibility |
| ARCHITECTURE DECISION | Consent fact references exact preview digest/version; withdrawal hides synchronously before cleanup |
| FILES / MODULES EXPECTED | Future shared domain/contracts, owner cloud functions, resource/deploy manifests, client adapter tests |
| DECISION / EVIDENCE GATES | PDG-01—05 |
| DATA CONTRACT | Public consent record, target publication/version, field digest, venue/public precision choice, state/reason timestamps, actor/audit IDs |
| SECURITY / PRIVACY IMPACT | Trusted owner binding; replay/version protection; Profile optional; no phone/avatar/nickname requirement |
| DEPENDENCIES / BLOCKS | Depends on 05—07; blocks 09—10, 12—16 |
| IMPLEMENTATION / IMPLEMENTATION STEPS | Preview read; submit/revoke/edit/delete commands; idempotency; historical re-consent; account deletion cascade |
| TESTS / TEST STRATEGY | Unit/contract/integration/negative authorization/idempotency/stale digest/deletion tests |
| TRUE_DEVICE / TRUE_DEVICE_REQUIRED | `YES` for the later consent UX integration |
| CLOUD_DEPLOY / CLOUD_DEPLOY_REQUIRED | `YES` |
| MIGRATION / MIGRATION_REQUIRED | `CONDITIONAL` for consent records; never bulk-public backfill |
| ACCEPTANCE / ACCEPTANCE CRITERIA | No public eligibility without exact consent; revoke/delete hides; all owner actions are idempotent and authorized |
| ROLLBACK / FAILURE BOUNDARY | Feature flag disables new consent writes; private V1 publication remains authoritative and intact |
| KNOWLEDGE_PROPAGATION INPUT / KNOWLEDGE THAT MAY INVALIDATE THIS TASK | Consent wording/versioning, owner identity, historical policy, account deletion, or public lifecycle changes |
| KNOWLEDGE_PROPAGATION OUTPUT / DOWNSTREAM TASKS TO UPDATE IF KNOWLEDGE CHANGES | 09—10, 12—16 and release/privacy declarations |

#### TASK-V2-09 — Monotonic PublicMapLead projector

| Field | Plan |
| --- | --- |
| TASK_ID | `TASK-V2-09` |
| STATUS | `LOCKED / NOT_STARTED` |
| TITLE | Public projection and no-resurrection lifecycle enforcement |
| WHY THIS IS NET-NEW OR V2-SPECIFIC / CAPABILITY_DELTA | V1 Current Publication has no public projection; `NET_NEW_V2_CAPABILITY` |
| EXISTING V1 CAPABILITIES REUSED / EXISTING_SYSTEM_DEPENDENCY | Pointer-to-approved-version, submission monotonicity, tombstones, maintenance retries |
| GOAL | Project only consented, eligible, approved current facts into PublicMapLead and remove/hide them durably |
| WHY_NOW | API and UI require a trustworthy serving projection |
| INPUTS / PRECONDITIONS | 06—08 |
| AFFECTED DOMAIN | Projection, eventual consistency, moderation eligibility, deletion |
| ARCHITECTURE DECISION | Provider/validation/DB/projection errors have separate checkpoints; pending/failed/late private submissions do not change served lead |
| FILES / MODULES EXPECTED | Future projector/shared runtime/resources/deploy/tests |
| DECISION / EVIDENCE GATES | All product gates closed |
| DATA CONTRACT | Projection source version, served version, consent/moderation/freshness state, opaque publicLeadId, tombstone/retirement state |
| SECURITY / PRIVACY IMPACT | Server-only writes; strict allowlist; stale jobs cannot resurrect retired IDs |
| DEPENDENCIES / BLOCKS | Depends on 06—08; blocks 10—16 |
| IMPLEMENTATION / IMPLEMENTATION STEPS | Create/update/hide/retire handlers; compare-and-advance; outbox/retry or equivalent; failure reason separation; reconciliation job |
| TESTS / TEST STRATEGY | Contract/integration/failure injection/concurrency/late event/failed submission/deletion resurrection tests |
| TRUE_DEVICE / TRUE_DEVICE_REQUIRED | `NO` |
| CLOUD_DEPLOY / CLOUD_DEPLOY_REQUIRED | `YES` |
| MIGRATION / MIGRATION_REQUIRED | `CONDITIONAL` controlled projection backfill after consent only |
| ACCEPTANCE / ACCEPTANCE CRITERIA | Lifecycle matrix passes; late/failed attempts never replace the served lead; withdrawal/deletion prevents resurrection |
| ROLLBACK / FAILURE BOUNDARY | Disable projector and hide public reads; no private-publication rollback is required |
| KNOWLEDGE_PROPAGATION INPUT / KNOWLEDGE THAT MAY INVALIDATE THIS TASK | Projection cardinality, source-version, consent, tombstone, consistency, or failure-boundary semantics change |
| KNOWLEDGE_PROPAGATION OUTPUT / DOWNSTREAM TASKS TO UPDATE IF KNOWLEDGE CHANGES | 10—16 and architecture/operations documents |

#### TASK-V2-10 — Minimal public moderation and operations

| Field | Plan |
| --- | --- |
| TASK_ID | `TASK-V2-10` |
| STATUS | `LOCKED / NOT_STARTED` |
| TITLE | MVP eligibility, approval, admin hide, owner withdrawal, and audit |
| WHY THIS IS NET-NEW OR V2-SPECIFIC / CAPABILITY_DELTA | V1 verification is private and has no public-content operations; `NET_NEW_V2_CAPABILITY` |
| EXISTING V1 CAPABILITIES REUSED / EXISTING_SYSTEM_DEPENDENCY | LOCATION/PHOTO/NOTE results as one private input, text-safety capability, roles, audit, deletion jobs |
| GOAL | Operate the chosen structured MVP without assuming V1 APPROVED equals public-safe |
| WHY_NOW | Public API cannot launch without hide/withdraw/audit controls |
| INPUTS / PRECONDITIONS | 04, 05, 08—09; exact public fields fixed |
| AFFECTED DOMAIN | Public eligibility, moderation, abuse, operations |
| ARCHITECTURE DECISION | For no-photo/no-note MVP, use rule eligibility + explicit approval/admin hide + owner withdrawal + audit; appeals/SLA/rich UGC are deferred |
| FILES / MODULES EXPECTED | Future moderation functions/resources/admin tooling/tests and operations docs |
| DECISION / EVIDENCE GATES | PDG-02/04/06 |
| DATA CONTRACT | Eligibility reasons, review decision/version, hidden reason, actor, audit event, owner withdrawal priority |
| SECURITY / PRIVACY IMPACT | Least-privilege reviewer role; hidden payload unavailable to public API; abuse controls |
| DEPENDENCIES / BLOCKS | Depends on 08—09; blocks 11—16 |
| IMPLEMENTATION / IMPLEMENTATION STEPS | Eligibility evaluator; approve/reject/hide; owner precedence; audit/search; minimal abuse/rate operations |
| TESTS / TEST STRATEGY | Negative/security/role/idempotency/hide latency/audit completeness and fail-closed tests |
| TRUE_DEVICE / TRUE_DEVICE_REQUIRED | `NO` |
| CLOUD_DEPLOY / CLOUD_DEPLOY_REQUIRED | `YES` |
| MIGRATION / MIGRATION_REQUIRED | `NO` bulk migration |
| ACCEPTANCE / ACCEPTANCE CRITERIA | Unauthorized decisions fail; hide/withdraw removes public access within the approved bound; audits are complete |
| ROLLBACK / FAILURE BOUNDARY | Disable public endpoint/projector and fail closed while preserving private V1 data |
| KNOWLEDGE_PROPAGATION INPUT / KNOWLEDGE THAT MAY INVALIDATE THIS TASK | Public field types, safety-review obligations, roles, abuse policy, hide SLA, or owner precedence changes |
| KNOWLEDGE_PROPAGATION OUTPUT / DOWNSTREAM TASKS TO UPDATE IF KNOWLEDGE CHANGES | 11—16 and privacy/release documents |

#### TASK-V2-11 — Public viewport and detail API

| Field | Plan |
| --- | --- |
| TASK_ID | `TASK-V2-11` |
| STATUS | `LOCKED / NOT_STARTED` |
| TITLE | Bounded Public API Read Source implementation |
| WHY THIS IS NET-NEW OR V2-SPECIFIC / CAPABILITY_DELTA | V1 exposes no public map read API; `NET_NEW_V2_CAPABILITY` |
| EXISTING V1 CAPABILITIES REUSED / EXISTING_SYSTEM_DEPENDENCY | Function envelope/error-code conventions and deployment verification |
| GOAL | Serve allowlisted PublicMapLead viewport/list/detail results with stable paging, limits, cache and rate behavior |
| WHY_NOW | Client state and UI need a real contract-backed serving path |
| INPUTS / PRECONDITIONS | 07, 09—10 |
| AFFECTED DOMAIN | Public reads, geo filtering, cache, errors, abuse |
| ARCHITECTURE DECISION | PublicMapLead only; anonymous or silent-account mode exactly as PDG-01; no client DB access |
| FILES / MODULES EXPECTED | Future public API function, contracts, resources/deploy, adapters/tests |
| DECISION / EVIDENCE GATES | EG-03/04; PDG-01—04 |
| DATA CONTRACT | Viewport/list/detail request/response, opaque cursor, limits, cluster/lead union if chosen, cache metadata, stable errors |
| SECURITY / PRIVACY IMPACT | Output allowlist, precision enforcement, enumeration controls, no internal IDs or profile/private fields |
| DEPENDENCIES / BLOCKS | Depends on 07, 09—10; blocks 12—16 |
| IMPLEMENTATION / IMPLEMENTATION STEPS | Query validation; indexed read; bounded projection; cache/ETag strategy; rate limit; unavailable/stale handling |
| TESTS / TEST STRATEGY | Unit/contract/integration/cloud/load/negative/security and allowlist snapshot tests |
| TRUE_DEVICE / TRUE_DEVICE_REQUIRED | `NO` |
| CLOUD_DEPLOY / CLOUD_DEPLOY_REQUIRED | `YES` |
| MIGRATION / MIGRATION_REQUIRED | Resource indexes only as explicitly approved |
| ACCEPTANCE / ACCEPTANCE CRITERIA | Limits and latency budget pass; private-field leakage tests pass; hidden/deleted leads fail closed |
| ROLLBACK / FAILURE BOUNDARY | Disable endpoint/feature flag, invalidate public cache, and leave private resources untouched |
| KNOWLEDGE_PROPAGATION INPUT / KNOWLEDGE THAT MAY INVALIDATE THIS TASK | Read audience, API allowlist, viewport/index limits, density, cache, rate, cost, or freshness contract changes |
| KNOWLEDGE_PROPAGATION OUTPUT / DOWNSTREAM TASKS TO UPDATE IF KNOWLEDGE CHANGES | 12—16 and client/architecture documents |

### Phase D — client state, consent UX, and map experience

#### TASK-V2-12 — Client map state and stale-async protection

| Field | Plan |
| --- | --- |
| TASK_ID | `TASK-V2-12` |
| STATUS | `LOCKED / NOT_STARTED` |
| TITLE | Map query state, cache, refresh, recovery, and race safety |
| WHY THIS IS NET-NEW OR V2-SPECIFIC / CAPABILITY_DELTA | V1 navigation/recovery exists, but viewport concurrency and public cache do not; `NEEDS_V2_EXTENSION` |
| EXISTING V1 CAPABILITIES REUSED / EXISTING_SYSTEM_DEPENDENCY | Platform adapters, navigation stable-view storage, active-board stale-response lessons |
| GOAL | Deterministic state for viewport/filter/detail, pagination, cache, stale data, network failures, cancellation, and tab switching |
| WHY_NOW | UI must not invent data ownership or race behavior |
| INPUTS / PRECONDITIONS | 06—07, 11 |
| AFFECTED DOMAIN | Client state, async identity, caching, errors |
| ARCHITECTURE DECISION | Request generation + query identity guards; stale response cannot replace current viewport/detail or active draw state |
| FILES / MODULES EXPECTED | Future miniprogram platform map API/state modules and tests |
| DECISION / EVIDENCE GATES | PDG-01/03/06 |
| DATA CONTRACT | Normalized query key, request generation, cache timestamp, page cursor, selected publicLeadId, explicit unknown/empty/error states |
| SECURITY / PRIVACY IMPACT | Persist only public-safe cache; clear/expire by policy; no private location in share/query cache |
| DEPENDENCIES / BLOCKS | Depends on 11; blocks 13—16 |
| IMPLEMENTATION / IMPLEMENTATION STEPS | Reducer/state machine; adapter; cancellation/ignore-late rules; cache/refresh/paging; tab/recovery integration |
| TESTS / TEST STRATEGY | Unit/race/property/integration tests for rapid pan/filter/tab, offline/timeout/partial/stale responses |
| TRUE_DEVICE / TRUE_DEVICE_REQUIRED | `NO` at this state-contract task |
| CLOUD_DEPLOY / CLOUD_DEPLOY_REQUIRED | `NO` |
| MIGRATION / MIGRATION_REQUIRED | Client cache version migration only if the approved design requires it |
| ACCEPTANCE / ACCEPTANCE CRITERIA | The race matrix passes and late responses never overwrite current viewport/filter/detail state |
| ROLLBACK / FAILURE BOUNDARY | Feature flag returns the existing map placeholder without touching active V1 state |
| KNOWLEDGE_PROPAGATION INPUT / KNOWLEDGE THAT MAY INVALIDATE THIS TASK | API paging/freshness/cache contract, platform lifecycle, navigation, or query identity changes |
| KNOWLEDGE_PROPAGATION OUTPUT / DOWNSTREAM TASKS TO UPDATE IF KNOWLEDGE CHANGES | 13—16 and architecture documents |

#### TASK-V2-13 — Explicit consent and owner-control UX

| Field | Plan |
| --- | --- |
| TASK_ID | `TASK-V2-13` |
| STATUS | `LOCKED / NOT_STARTED` |
| TITLE | Public preview, consent, status, edit, withdraw, delete, and re-consent UX |
| WHY THIS IS NET-NEW OR V2-SPECIFIC / CAPABILITY_DELTA | V1 My Uploads is private and has no public publication controls; `NET_NEW_V2_CAPABILITY` |
| EXISTING V1 CAPABILITIES REUSED / EXISTING_SYSTEM_DEPENDENCY | My Uploads, owner-scoped actions, silent Account, optional Profile, durable deletion UI pattern |
| GOAL | Make private-to-public transition explicit and reversible with exact field/venue/precision preview |
| WHY_NOW | Public supply requires understandable consent, not an invisible backend projection |
| INPUTS / PRECONDITIONS | 05, 08, 10—12 |
| AFFECTED DOMAIN | Consent UX, owner status, error/retry, historical records |
| ARCHITECTURE DECISION | Consent is version/digest-bound; Profile completion never gates; withdrawal is immediate-hide intent |
| FILES / MODULES EXPECTED | Future home/My Uploads views, WXML/WXSS, adapters/state/tests |
| DECISION / EVIDENCE GATES | PDG-01—06 |
| DATA CONTRACT | Preview fields, consent version, venue/public precision, pending/rejected/public/hidden/withdrawn/deleted/re-consent states |
| SECURITY / PRIVACY IMPACT | No prechecked consent; no irrelevant profile/phone request; safe error messages |
| DEPENDENCIES / BLOCKS | Depends on 08, 10—12; blocks 15—16 |
| IMPLEMENTATION / IMPLEMENTATION STEPS | Preview; explicit submit; state/status cards; edit/review; withdraw/delete; historical re-consent; recovery |
| TESTS / TEST STRATEGY | Component/behavior/accessibility/contract/integration/negative consent and stale-response tests |
| TRUE_DEVICE / TRUE_DEVICE_REQUIRED | `YES` |
| CLOUD_DEPLOY / CLOUD_DEPLOY_REQUIRED | Backend is already deployed by dependencies; no additional deploy assumed |
| MIGRATION / MIGRATION_REQUIRED | `NO` |
| ACCEPTANCE / ACCEPTANCE CRITERIA | A user can explain and control every public state without completing Profile or granting unrelated permissions |
| ROLLBACK / FAILURE BOUNDARY | Disabling the entry leaves private V1 flows and records intact |
| KNOWLEDGE_PROPAGATION INPUT / KNOWLEDGE THAT MAY INVALIDATE THIS TASK | Consent copy, lifecycle, owner controls, Profile/account assumptions, platform review, or accessibility findings change |
| KNOWLEDGE_PROPAGATION OUTPUT / DOWNSTREAM TASKS TO UPDATE IF KNOWLEDGE CHANGES | 15—16 and design/privacy documents |

#### TASK-V2-14 — Map, list, filter, detail, location, and safe deep link

| Field | Plan |
| --- | --- |
| TASK_ID | `TASK-V2-14` |
| STATUS | `LOCKED / NOT_STARTED` |
| TITLE | Core map discovery experience and WeChat platform integration |
| WHY THIS IS NET-NEW OR V2-SPECIFIC / CAPABILITY_DELTA | V1 has only a map placeholder; `NET_NEW_V2_CAPABILITY` |
| EXISTING V1 CAPABILITIES REUSED / EXISTING_SYSTEM_DEPENDENCY | Approved visual shell/navigation, public tab share allowlist pattern, optional-account bootstrap |
| GOAL | Deliver map/list/filter/detail with source, observation time, freshness, precision, non-real-time copy, clustering, weak-network behavior, permission fallback, and safe landing link |
| WHY_NOW | UI follows public contracts/backend/state; it must not precede them |
| INPUTS / PRECONDITIONS | 03—07, 11—13 |
| AFFECTED DOMAIN | UI, map provider, permissions, location, sharing, performance/package |
| ARCHITECTURE DECISION | Browse does not require Profile; device location is foreground convenience only and never becomes public contribution data; deep link carries publicLeadId/allowlisted public query only |
| FILES / MODULES EXPECTED | Future miniprogram page/components/assets/platform adapters/tests; no package-heavy poster/reminder code |
| DECISION / EVIDENCE GATES | EG-03/04; PDG-01—06 |
| DATA CONTRACT | Public API models only; filters preserve null/zero; link allowlist and unavailable/hidden landing states |
| SECURITY / PRIVACY IMPACT | Permission requested only on user action; city/manual browse fallback; no private coordinates/query state in links |
| DEPENDENCIES / BLOCKS | Depends on 11—13; blocks 15—16 |
| IMPLEMENTATION / IMPLEMENTATION STEPS | Map/list/detail; clustering/density; filters; empty/error/stale; foreground location/fallback; safe link; asset budget |
| TESTS / TEST STRATEGY | Unit/component/e2e/accessibility/platform/package/load/network/security; true-device matrix |
| TRUE_DEVICE / TRUE_DEVICE_REQUIRED | `YES` |
| CLOUD_DEPLOY / CLOUD_DEPLOY_REQUIRED | `NO` new deploy beyond dependencies |
| MIGRATION / MIGRATION_REQUIRED | `NO` |
| ACCEPTANCE / ACCEPTANCE CRITERIA | Representative discovery succeeds without inventory misunderstanding; package and performance budgets pass |
| ROLLBACK / FAILURE BOUNDARY | Feature flag restores the placeholder; denial/offline/provider failure retains a safe list or empty-state path |
| KNOWLEDGE_PROPAGATION INPUT / KNOWLEDGE THAT MAY INVALIDATE THIS TASK | Provider behavior, platform permissions, performance/density, field allowlist, deep-link, package, or user-comprehension findings change |
| KNOWLEDGE_PROPAGATION OUTPUT / DOWNSTREAM TASKS TO UPDATE IF KNOWLEDGE CHANGES | 15—16 plus product and tech documents |

### Phase E — verification, pilot, release, and immutable closure

#### TASK-V2-15 — Layered quality, security, true-device, and closed-pilot gate

| Field | Plan |
| --- | --- |
| TASK_ID | `TASK-V2-15` |
| STATUS | `LOCKED / NOT_STARTED` |
| TITLE | Full test matrix and evidence-backed closed pilot |
| WHY THIS IS NET-NEW OR V2-SPECIFIC / CAPABILITY_DELTA | V1 gates do not cover public geo queries, consent, moderation, or map usage; `NET_NEW_V2_CAPABILITY` |
| EXISTING V1 CAPABILITIES REUSED / EXISTING_SYSTEM_DEPENDENCY | Quality workflow, contract tests, CloudBase validation, true-device and production-smoke discipline |
| GOAL | Prove correctness, privacy, performance, comprehension, supply, takedown, rollback, and device/platform behavior |
| WHY_NOW | Release candidacy needs evidence across all layers, not marker rendering alone |
| INPUTS / PRECONDITIONS | 08—14 complete; release candidate deployment plan approved |
| AFFECTED DOMAIN | Unit, contract, integration, cloud, migration, security, performance, true-device, pilot |
| ARCHITECTURE DECISION | No layer substitutes for true-device or production smoke; pilot remains bounded/withdrawable |
| FILES / MODULES EXPECTED | Tests, fixtures, delivery evidence, runbooks; only within approved implementation scope |
| DECISION / EVIDENCE GATES | Revalidates EG-01—04 and all PDGs against actual behavior |
| DATA CONTRACT | Fixed representative lifecycle/security/query/device/pilot matrices |
| SECURITY / PRIVACY IMPACT | Cross-account, scraping, precision, hidden/deleted, cache, consent, reviewer-role, and logs tested |
| DEPENDENCIES / BLOCKS | Depends on 08—14; blocks 16 |
| IMPLEMENTATION / IMPLEMENTATION STEPS | Run unit/contract/integration/cloud/migration/negative/security/load/package; true-device location/map/link/weak-network; pilot metrics and takedown drill |
| TESTS / TEST STRATEGY | All named layers plus production smoke and V1 release regression |
| TRUE_DEVICE / TRUE_DEVICE_REQUIRED | `YES` |
| CLOUD_DEPLOY / CLOUD_DEPLOY_REQUIRED | `YES` candidate environment/deployment |
| MIGRATION / MIGRATION_REQUIRED | `YES` only for an approved, rehearsed migration |
| ACCEPTANCE / ACCEPTANCE CRITERIA | No P0/P1; budgets and consent/takedown pass; rollback drill succeeds; user chooses Continue/Adjust/Stop |
| ROLLBACK / FAILURE BOUNDARY | Any failed gate blocks release; disable public read/write paths and execute the rehearsed resource/data rollback |
| KNOWLEDGE_PROPAGATION INPUT / KNOWLEDGE THAT MAY INVALIDATE THIS TASK | Any test, true-device, pilot, privacy/review, deployment read-back, performance, or rollback finding changes a contract |
| KNOWLEDGE_PROPAGATION OUTPUT / DOWNSTREAM TASKS TO UPDATE IF KNOWLEDGE CHANGES | Affected tasks in 08—16 and their contracts/documents before rerun |

#### TASK-V2-16 — Release, publication, Git closure, and tag

| Field | Plan |
| --- | --- |
| TASK_ID | `TASK-V2-16` |
| STATUS | `LOCKED / NOT_STARTED` |
| TITLE | V2 release candidate through actual WeChat publication and immutable tag |
| WHY THIS IS NET-NEW OR V2-SPECIFIC / CAPABILITY_DELTA | V2 requires its own CloudBase/privacy/review/device/rollback evidence; `NEEDS_V2_EXTENSION` |
| EXISTING V1 CAPABILITIES REUSED / EXISTING_SYSTEM_DEPENDENCY | Single-worktree Git flow, CloudBase read-back, online-source manifest, publication-before-tag rule |
| GOAL | Close quality, package, deployed versions, DB/index/migration, privacy declaration, WeChat review, true-device, rollback, GitHub sync, online source, and tag |
| WHY_NOW | Only after task 15 proves release readiness |
| INPUTS / PRECONDITIONS | 15 accepted; user explicitly authorizes each external release action |
| AFFECTED DOMAIN | Release, production, Git, evidence, operations |
| ARCHITECTURE DECISION | Tag targets exact online source only after actual `APPROVED + PUBLISHED` confirmation |
| FILES / MODULES EXPECTED | Release manifests/checklists/progress/architecture; no feature expansion |
| DECISION / EVIDENCE GATES | All gates closed; user release approval |
| DATA CONTRACT | Exact deployed function/resource/index/migration versions and online source commit |
| SECURITY / PRIVACY IMPACT | Privacy declaration/review scope matches actual fields, location, audience, providers, retention, withdrawal |
| DEPENDENCIES / BLOCKS | Depends on 15; blocks V2 completion and any V3 decision |
| IMPLEMENTATION / IMPLEMENTATION STEPS | Final regression; deploy/read-back; production smoke; PR/merge main; upload/review; actual publish; record online source; create immutable tag |
| TESTS / TEST STRATEGY | Quality, package, CloudBase/resource diff, migration status, security, true-device matrix, production smoke, release regression |
| TRUE_DEVICE / TRUE_DEVICE_REQUIRED | `YES` |
| CLOUD_DEPLOY / CLOUD_DEPLOY_REQUIRED | `YES` |
| MIGRATION / MIGRATION_REQUIRED | `AS APPROVED` by the contract and rehearsed release plan |
| ACCEPTANCE / ACCEPTANCE CRITERIA | Actual publication is confirmed, smoke passes, rollback is ready, GitHub is synchronized, and the tag points exactly to online source |
| ROLLBACK / FAILURE BOUNDARY | Failed gate/review stops publication and creates no tag; runtime rollback follows the rehearsed release plan |
| KNOWLEDGE_PROPAGATION INPUT / KNOWLEDGE THAT MAY INVALIDATE THIS TASK | Release review, deploy read-back, privacy declaration, migration, true-device, production smoke, or publication evidence changes |
| KNOWLEDGE_PROPAGATION OUTPUT / DOWNSTREAM TASKS TO UPDATE IF KNOWLEDGE CHANGES | Release registry, progress, architecture, completion definition, and the future V3 gate |

## 6. Critical path and block status

`Human approval of this draft → 01/02/03 evidence (parallel where safe) → 04 gate closure → 05 consent/location lifecycle → 06 public model → 07 API/resources contract → 08 consent backend → 09 projector → 10 moderation → 11 public API → 12 client state → 13 consent UX → 14 map UX/platform → 15 layered/true-device/pilot gate → 16 release/publication/tag`.

No UI implementation starts before source, consent, location, public schema, query, and serving contracts. No public release starts before true-device and pilot gates.

## 7. Current V2 completion definition

V2 is complete only when:

- EG-01—04 and PDG-01—06 are explicitly closed with evidence and user decisions.
- At least one lawful, sustainable, removable supply route works in a bounded pilot.
- Private records never become public without exact preview, explicit consent, eligibility/moderation approval, and auditable ownership.
- PublicMapLead/publicLeadId lifecycle, API limits, location precision, withdrawal/deletion/no-resurrection, failure isolation, and eventual consistency pass.
- Users can browse map/list/filter/detail and safe deep-link landing states without Profile completion, while understanding that leads are historical and not real-time inventory.
- Minimal moderation/admin hide, owner withdrawal/deletion, rate/abuse controls, logs, and rollback operate within approved bounds.
- Unit, contract, integration, CloudBase/backend, migration, negative/security, performance/package, true-device, production smoke, and V1 release regression gates pass.
- CloudBase deployed versions, DB/index/migration status, privacy declarations, WeChat review scope, GitHub main, online-source commit, and rollback evidence are recorded.
- The immutable V2 tag is created only after actual WeChat `APPROVED + PUBLISHED` confirmation.

Reminders, subscription messages, draw-result posters, rich public notes/photos, advanced appeals/SLA, and automatic canonical merge are not required for V2 completion unless `PDG-V2-06` is explicitly changed and all affected tasks are re-planned.

## 8. Current stop point

- `CURRENT_V2_PLAN_AUTHORITATIVE = NO` pending human review.
- `V2_IMPLEMENTATION_STARTED = NO`.
- `TASK-V2-01 = LOCKED / NOT_STARTED`.
- `commit = NO`; `push = NO`; `PR = NO`; `merge = NO`; `tag = NO`.
- Stop after producing the reconciliation Review Packet; do not begin Phase A.

## V3 — deferred historical pointer

V3 is `DEFERRED / NOT EXECUTABLE` and has no current tasks or gates in this file. Its historical research plan remains in `implementation-plan-history.md`; V2 completion does not depend on a V3 decision.
