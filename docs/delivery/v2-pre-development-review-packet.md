# ICHI V2 权威认知校准审阅包

> **历史归档，仅用于追溯。不得覆盖 `memory-bank/implementation-plan.md` 中的当前计划，也不得作为当前任务自动执行。**
>
> `HISTORICAL / BLOCKED DRAFT — NOT EXECUTABLE`
>
> This packet is preserved for comparison only. The 2026-09-10 V1 truth reconciliation blocks complete V2 planning until human review.

> Status: `DRAFT / READY FOR HUMAN REVIEW`
>
> Audit date: 2026-09-08
>
> Planning branch: `feature/v2-board-map`
>
> Baseline: `origin/main@929d189a06e13010e50abf4927bfec3b1ebd49fc`
>
> Before reconciliation: `CURRENT_V2_PLAN_AUTHORITATIVE = NO`.
>
> After this pass the plan is rebuilt and review-ready, but remains non-authoritative until the user approves it. No V2 implementation task is unlocked.

Evidence priority used throughout: current production/repository code and frozen contracts → tests → V1 release evidence → Git history → current Memory Bank → historical plans/references. Historical text never overrides current runtime evidence.

## A. BASELINE

| Check | Result | Evidence |
| --- | --- | --- |
| Worktree | `/Users/cunfu/Documents/ichi 2`; single worktree | `git rev-parse --show-toplevel`; project rule |
| Current branch | `feature/v2-board-map` | `git branch --show-current` |
| Current HEAD | `929d189a06e13010e50abf4927bfec3b1ebd49fc` | `git rev-parse HEAD` |
| origin/main HEAD | `929d189a06e13010e50abf4927bfec3b1ebd49fc` | fetch/prune followed by `git rev-parse origin/main` |
| Branch base | Exact origin/main | mutual ancestor check passed |
| V1.0.0 online source | Contained | `03942f2067959a4b8b0eb6223c949e51e768587d` is an origin/main ancestor; `v1.0.0` points there |
| V1.0.0 publication closure | Contained | `62c02ab6bb16ad415a7a9034e41c28066bfe8af3` is an origin/main ancestor |
| V1.0.1 sharing source | Contained | `8d442aa7cc9f1921a9b9aade231b5884e8d2dd00`; merge `929d189…` |
| Necessary branch-only commit | None found | all normal local/remote release and feature branches are contained; `git log --all --not main` only exposed stash implementation objects |
| Existing working changes | Planning/docs only | PRD/README/Memory Bank/decision/spec/delivery documents; no runtime or production file |
| Historical stashes | Preserved | `PRE_V1_0_1_MAIN_WORKTREE_RESIDUAL`; `MIGRATION_V1_0_1_SHARING_TO_MAIN_WORKTREE` |
| R2 frozen hashes | Match | prompt `c083…3462`; schema `178c…a722`; resolver `46ff…11d8` |
| Database/Storage frozen source | Unchanged | `services/cloudbase/database/resources.json` not modified |
| Prior quality baseline | PASS | main: 57 test files / 571 tests plus format/lint/TypeScript/contracts/workflow |

`MAIN_VALID_AS_V2_BASE = YES`.

## B. CURRENT_SYSTEM_TRUTH_REGISTRY

| TRUTH_ID | DOMAIN | CURRENT_TRUTH | EVIDENCE | STATUS | V2_IMPACT | DOCUMENTS_THAT_MUST_MATCH |
| --- | --- | --- | --- | --- | --- | --- |
| TR-ACT-01 | Account | First launch uses trusted CloudBase WXContext and transactional find-or-create; no visible login/profile gate | `shared/runtime.js::bootstrapAccount`; runtime/account tests; release source `03942f2` | FROZEN | Reuse; map browse/consent cannot require profile completion | PRD, design, tech, plan, README |
| TR-ACT-02 | Profile | `Profile != login`; nickname/avatar are optional; `ICHI 玩家` and packaged avatar are UI fallbacks; phone is out of scope | runtime default profile; home WXML copy; profile tests | FROZEN | Remove duplicate account/profile tasks and unrelated permission asks | PRD, design, plan, old account proposal |
| TR-ACT-03 | Identity | Internal `accountId` is private ownership identity; public ICHI ID is stable display identity but not authorization | runtime ID allocator; DB resource indexes; tests | FROZEN | Public map must not expose/use internal ID; contributor disclosure is separate decision | design, tech, plan |
| TR-ACT-04 | Profile media | Chosen avatar goes to owner-only `profile-avatars/`; DB stores stable fileID; replacement deletes old only after DB success | `cloud-account.ts`; runtime profile flow/tests; storage policy | FROZEN | No public-avatar assumption and no widening existing bucket | design, tech, security docs |
| TR-DOM-01 | Domain | Local Board, Upload Submission, and Current Cloud Publication are distinct roles | runtime/client lifecycle code and regression tests; V1 closure docs | FROZEN | All V2 source/lifecycle tasks derive from this split | design, architecture, plan |
| TR-DOM-02 | IDs | `boardId` identifies local board lineage; `recordId` identifies private cloud publication; `recordCode` is a six-character lookup code; `submissionVersion` identifies attempts | `domain.js`, runtime, local/cloud adapters and tests | FROZEN | Create separate opaque publicLeadId; never key on recordCode | design, architecture, API plan |
| TR-DOM-03 | Publication | P1 is a lightweight `publishedSubmissionVersion` pointer; full snapshot/events live in the exact approved Submission | runtime get/publish code; large-update regression tests | FROZEN | Authoritative Private Domain Truth requires pointer+version join | design, architecture, plan |
| TR-DOM-04 | Cardinality | At most one current private publication per owner + boardId; attempts are 1:N versions | deterministic recordId and runtime transaction tests | FROZEN | Public lead cardinality must not copy submission history | plan, public schema |
| TR-DOM-05 | Records UI | My Records projects local repository boards; My Uploads projects current private cloud publications | home page/adapters/tests | FROZEN | Map cannot reuse either list as a public source | design, architecture, client plan |
| TR-LIFE-01 | Failure isolation | PENDING/FAILED/provider/network/late older submission cannot replace, hide, or delete current publication | runtime tests “unchanged before verification” and “published while failed attempt visible” | FROZEN | Public projector must be monotonic and retain old served lead | plan, lifecycle contract |
| TR-LIFE-02 | Delete | Local deletion is repository-only; cloud deletion is explicit owner action and not inferred from local absence/404 | home handlers/adapters/tests | FROZEN | Public withdrawal/delete is a separate command | design, plan |
| TR-LIFE-03 | No resurrection | Explicit cloud deletion creates durable tombstone/job; stale local reference or old async work cannot recreate it | runtime deletion/retry tests | FROZEN | Retire publicLeadId and make projector tombstone-aware | architecture, plan |
| TR-LIFE-04 | Async state | Late refresh/recovery/verification results must not overwrite a newly active board/state | draw-session incident evidence; home guards/tests | FROZEN | Viewport/filter/detail requests need query identity/generation guards | design, client task |
| TR-LIFE-05 | Eventual consistency | Deletion/cleanup is hide/accept first with retryable durable completion; unknown network result is not success | runtime maintenance/deletion jobs and tests | FROZEN | Define visibility SLA and retry/reconciliation rather than instant physical deletion claims | lifecycle, operations, release |
| TR-REC-01 | Recognition | Production recognition is R2 direct-remaining with frozen prompt/schema/resolver hashes; H0 hybrid-semantic is frozen rollback | release manifest; calculated SHA-256; recognition tests | FROZEN | V2 consumes, never redefines, recognition output | design, tech, plan |
| TR-REC-02 | R2 fields | R2 facts are IP, optional theme, tiers, nullable direct `remainingTickets`; Provider trace is not business/map data | R2 schema/resolver, board-record adapter/tests | FROZEN | Public schema may allow only approved projections of these facts | design, public schema |
| TR-REC-03 | Manual facts | `pricePerDraw` and `isGrandPrize` are user-confirmed/manual, not model-inferred | client/domain R2 tests and release docs | FROZEN | Public display must preserve provenance and not recompute | design, tests |
| TR-REC-04 | Immutable baseline | Initial R2 remaining is immutable; current remaining is derived from authoritative draw events; finalSnapshot is rebuildable projection | draw-session/runtime tests | FROZEN | Map projection must reference exact approved version, not mutate baseline | domain/public contract |
| TR-REC-05 | Null | `null=unknown`; `0=confirmed zero`; no `Number(null)` or falsy coercion in R2/map semantics | recognition/runtime tests; frozen docs | FROZEN | Filters, aggregates, markers, clusters and UI need explicit tri-state behavior | plan, schema, UI tests |
| TR-VER-01 | Verification | Prize-ticket workflow is LOCATION → PHOTO → NOTE with distinct pending/pass/fail/retry states | `verify-prize-tickets` source/tests; home mappings | FROZEN | Reuse as private eligibility input only | design, moderation plan |
| TR-VER-02 | Public safety | V1 `APPROVED` proves the existing private submission contract, not consent or safety for future public fields | absence of public resource/API; V1 contract scope | FROZEN | Add explicit consent/public eligibility/moderation; no automatic map publish | PRD, design, plan |
| TR-VER-03 | Error boundaries | Provider transport/schema, normalization/reconciliation, DB, publication projection, and UI errors are distinct | production incident; verification checkpoints/tests | FROZEN | V2 projector/API/UI errors must not be reported as provider failures | architecture, tasks/tests |
| TR-VER-04 | Evidence media | Board/ticket images are ephemeral recognition inputs; final private facts do not retain long-lived board/ticket images | resources, functions, release/storage evidence | FROZEN | No historical public images; new images need explicit architecture unlock | PRD, design, tech |
| TR-QUO-01 | Quota | Daily recognition limit is 5 per account, reset by Asia/Shanghai day; used + reserved determine remaining | `domain.js`; quota tests/UI | FROZEN | Map reads must not consume recognition quota; reuse only for new recognition | design, API plan |
| TR-QUO-02 | Reservation | Quota is reserved transactionally; terminal pre-commit failures release; commit happens with observation finalization | runtime recognition/quota tests | FROZEN | Do not couple public consent/read to recognition quota | domain tasks |
| TR-SEC-01 | Database | Current resource manifest has 13 collections, all `ADMINONLY`, `publicCollections=[]` | `database/resources.json` read | FROZEN | Public serving resources/API are net-new; direct private DB reads prohibited | architecture, tech, plan |
| TR-SEC-02 | Storage | Production Storage ACL is `CUSTOM`; `profile-avatars/` owner-read/write; `recognition-temp/` owner-write/delete and client no-read; other paths denied | resources manifest; storage policy tests | FROZEN | Never “make bucket public”; public image is separate unlock | PRD, design, tech |
| TR-SEC-03 | Storage lifecycle | Recognition temp normal path deletes promptly; platform fallback is `Expiration.Days=1`, not exact one hour/24 hours | resources read-back/release evidence | FROZEN | Avoid impossible retention claims and old-spec backfill assumptions | specs, design, release |
| TR-SEC-04 | Text safety | Shared server text safety maps PROFILE_NICKNAME and MAP_NOTE to fixed msgSecCheck scenes and fails closed | `text-safety-review.js` and tests; deploy permissions | FROZEN | New public fields must be assessed separately; existing check is not blanket public approval | design, moderation plan |
| TR-SEC-05 | Public surface | V1 created no public map collection or public endpoint | resources/deploy manifest; map remains placeholder | FROZEN | PublicMapLead/API are net-new critical path | architecture, plan |
| TR-SHR-01 | Sharing | V1.0.1 shares only `tab=recognize\|map\|my`; query allowlist contains only `tab`; no private/account/record state | `home-sharing.ts` and tests; commit `8d442aa` | ACTIVE | Map deep link needs a new explicit public allowlist and hidden/deleted landing behavior | design, task 14 |
| TR-SHR-02 | Package | V1.0.1 added a 127,613-byte friend share image and kept package under project 2 MiB gate | commit stat; progress/release preflight | ACTIVE | Marker/SDK/static assets need measured package delta | tech, task 03/14/15 |
| TR-OPS-01 | True device | Simulator/unit tests did not replace true-device findings for profile review, camera, location, upload, sharing, scrolling, weak network | V1 progress/release evidence | ACTIVE | Every WeChat/map/location/share/permission task has true-device gate | plan, release |
| TR-OPS-02 | Deployment | CLI success is insufficient; deploy from function dir, merge/read-back config, reverse-download hash, and black-box smoke | V1 production incidents/progress | ACTIVE | V2 CloudBase work/release must use the same verification discipline | tech, tasks 08—16 |
| TR-OPS-03 | Workflow | Documentation/governance changes require `node scripts/validate-workflow.mjs`; implementation adds scoped tests/build/contracts | AGENTS/project workflow | ACTIVE | Each task names its test layer and knowledge propagation | plan, progress |
| TR-OPS-04 | Git/release | Single worktree; latest main branch flow; immutable tag only after actual WeChat publication | project rule; V1 tag/closure; V1.0.1 no-tag state | ACTIVE | Task 16 preserves publication-before-tag and no extra worktree | README, plan, progress |

### Search-hit classification inventory

The stale-search set covered profile/login gates, IDs, P1/full snapshots, failed submissions, deletion/resurrection, Provider/DB errors, R2/H0/T/P/U, null coercion, Storage prefixes, public map/endpoint, location, reminders/posters, and V2-20. Every relevant hit falls into one of these reviewed groups:

| Hit group | Classification | Disposition |
| --- | --- | --- |
| Current runtime/tests for silent Account, B/S/P, IDs, pointer publication, failures, deletion, R2, quota, Storage, sharing | `CURRENT_AND_CORRECT` | Registered above; unchanged |
| `finalSnapshot`/`authoritativeDrawEvents` in private adapters and approved Submission tests | `CURRENT_AND_CORRECT` | They remain private facts/projections; forbidden only in P1/PublicMapLead duplication |
| Current V2 unknowns: public audience/fields, location precision, supply tranche, provider, freshness | `AMBIGUOUS/HUMAN_REVIEW_REQUIRED` | Converted to EG/PDG gates; no implementation assumption |
| Dated Memory Bank V1 evolution and design experiments | `HISTORICAL_CONTEXT_ONLY` | Explicit top-level history markers; current registry wins |
| Old implementation plan and initial review packet | `HISTORICAL_CONTEXT_ONLY` | Moved to separately warned history files |
| Old account/V2 lifecycle/toolchain proposals and V1 backend specs | `HISTORICAL_CONTEXT_ONLY` | Explicit non-executable/superseded warnings added |
| README/PRD/active Memory Bank statements implying page-only V2, simultaneous supply paths, profile/login work, direct device-location publicity, reminders/posters, old DG/tasks | `STALE_ACTIVE_ASSUMPTION` | Rewritten or isolated; ledger below |

## C. STALE_ASSUMPTION_LEDGER

| STALE_ID | FILE | SECTION / LINE OR HEADING | OLD_STATEMENT | CURRENT_TRUTH | EVIDENCE | WHY_STALE | CAN_REMAIN_AS_HISTORY YES/NO | MUST_BE_REWRITTEN YES/NO | V2_TASKS_AFFECTED |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SA-001 | `README.md` | Introduction | All future mini-program work is one-to-one copying of approved web pages | V2 adds new public domain/API/location contracts | TR-SEC-05; current plan 05—14 | Would invite page-first implementation | NO in active intro | YES, corrected to V1-only baseline | 03—15 |
| SA-002 | `PRD.md` | Status | Whole PRD simply `APPROVED` | V1 is frozen; V2 is a human-decision draft | TR-OPS-04; plan status | Hid V2 uncertainty | NO | YES | 01—04 |
| SA-003 | `PRD.md` | Overview / supply | Player, merchant and staff supply read as already available scope | No legal, sustainable public supply route has passed its evidence gate | TR-VER-02; EG-V2-02 | Product hypothesis was written as fact | YES, as historical concept | YES in active V2 scope | 02,04,10,15 |
| SA-004 | `PRD.md` | Overview | Both paths require “account and current location”; location was conflated with public venue | Account is silent, Profile optional, and device evidence is not a venue/public coordinate | TR-ACT-01/02; PDG-V2-03 | Conflated authorization and location semantics | YES, as history | YES | 05,08,13—15 |
| SA-005 | `PRD.md` | V2 core | Reminders/subscription and result posters were V2 completion items | Core map + safe landing is the draft completion scope; reminders/posters are deferred | PDG-V2-06; completion definition | Extras inflated the critical path and package/privacy burden | YES, as deferred concept | YES | 03—04,14—16 |
| SA-006 | `memory-bank/design-document.md` | Previous V2 overlay | Ten generic DGs and a plan starting with decision closure | Evidence tasks 01—03 generate facts before task 04 closes decisions | EG-V2-01—04; current dependency graph | Research was blocked by the gate it needed to inform | YES, in initial packet history | YES | 01—07 |
| SA-007 | `memory-bank/design-document.md` | Historical V2 sections 5.1—5.3 | Account/Profile, reminders, sharing/poster described as current V2 design | Account/Profile are V1 capabilities; reminders/posters are deferred | TR-ACT-01/02; PDG-V2-06 | Repeated V1 work and introduced scope creep | YES, explicitly historical | NO further active use | 04,13—16 |
| SA-008 | `memory-bank/design-document.md` | Historical BoardLead / ContributionDraft | `BoardLead`, boardId overwrite, and old public/photo flow | B/S/P pointer + exact approved Submission + explicit consent + PublicMapLead | TR-DOM-01—04; TR-VER-02 | Predates final V1 publication semantics | YES, explicitly historical | YES before any reuse | 05—10 |
| SA-009 | `memory-bank/design-document.md` | V1 recognition history | Old v3/v4/H0/R1/T/P/U paragraphs could read as current | Frozen R2 direct remaining and the three fixed hashes are current | TR-REC-01—05 | Chronology contained mutually exclusive “current” statements | YES, under chapter authority warning | YES at the active truth entry | 06,15 |
| SA-010 | `memory-bank/tech-stack.md` | Historical V2 technology table | Map provider, reminders, Canvas poster and V2 Account resources appeared selected/current | Provider requires a spike, extras are deferred, and Account already exists | TR-ACT-01; EG-V2-03; PDG-V2-06 | Technology selection preceded evidence/product scope | YES, as historical direction | YES | 03—04,07,14—16 |
| SA-011 | `memory-bank/tech-stack.md` | Decision register | V1-E/F and V2 reminder/model decisions appeared pending | V1 is closed; only EG-V2-01—04 and PDG-V2-01—06 are current | TR-OPS-04; current plan gates | Old gates could reopen V1 or restore scope silently | YES, as labelled history | YES | 01—04,16 |
| SA-012 | `memory-bank/architecture.md` | Historical block boundary | V1-F described as `IN_PROGRESS` and current | V1.0.0 is published and frozen | TR-REC-01; V1 closure evidence | Old status could become an accidental workset | YES, under explicit historical heading | YES | All |
| SA-013 | `memory-bank/architecture.md` | Planned modules | Public profile/canonical merge listed as ordinary V2 next modules | Profile exists; canonical merge is deferred; consent/PublicMapLead/API are the missing modules | TR-ACT-02; capability delta | Did not reflect the actual capability delta | YES, as historical list | YES | 05—14 |
| SA-014 | `memory-bank/progress.md` | Previous planning pass | DG-01—10 and TASK-01—17 declared rebuilt/current | Reconciliation uses EG-01—04, PDG-01—06 and TASK-01—16 | Current plan and packet H | Previous draft lacked evidence-first ordering and a correct completion scope | YES, as dated evidence | YES at the current top section | All |
| SA-015 | `memory-bank/progress.md` | Historical “下一步” | V1-F `IN_PROGRESS` and V1-48 blocks V2 | V1 is closed; current next step is human review | TR-OPS-04; current status | Heading looked executable | YES | YES, renamed historical | All |
| SA-016 | `memory-bank/implementation-plan.md` | Former whole file | Current V2 plus executable-looking V1/V2/V3 tables coexisted | Active plan contains only current protocol/truth/scope/gates/tasks/status | Current active/history file split | An overlay could not prevent accidental old-task execution | YES, in separate archive | YES via file separation | All |
| SA-017 | Initial review packet | Former task/gate summary | Plan ready with 17 tasks, ten DGs, task 17 tag and old completion | New evidence-first 16-task plan has no V2-20 or reminder/poster completion gate | Current plan schema and completion definition | Packet claimed completeness before reconciliation | YES, in separately warned archive | YES, replaced | All |
| SA-018 | `docs/decisions/account-and-my-panel-proposal.md` | Whole proposal | Account/login/public ID/Profile plus reminders/sharing approved for V2 | Core Account/Profile capabilities completed in V1; extras deferred | TR-ACT-01—04; PDG-V2-06 | Duplicate work and Profile-gating risk | YES, with warning | NO active reliance | 04,13—16 |
| SA-019 | `docs/decisions/v2-contribution-verification-lifecycle.md` | Whole proposal | boardId-keyed ContributionDraft overwrite and retained private/public image references | Versioned Submission, pointer P1, ephemeral evidence images, explicit public consent/projection | TR-DOM-02/03; TR-VER-04 | Predates final production fixes | YES, with warning | YES if revived | 05—10,13 |
| SA-020 | `docs/decisions/v1-toolchain-and-recognition.md` | Old selected pipeline | qwen3.5/OCR/Base64/in-memory/no Storage as active plan | Frozen R2 qwen3.7 path and private temporary fileID transport | TR-REC-01; TR-SEC-02/03 | Superseded by production migrations | YES, with authority note | NO active reliance | 03,06,15 |
| SA-021 | `specs/v1-cloudbase-backend/requirements.md` | Storage/future-map requirements | One-hour lifecycle and future-map wording | App cleanup + `Expiration.Days=1`; V1 has no public map | TR-SEC-03/05 | Old spec target differs from production truth | YES, with closed warning | NO active reliance | 02,06,15 |
| SA-022 | `specs/v1-cloudbase-backend/design.md` and `tasks.md` | Function/task status | 16 functions, pending true-device/model gates and unchecked executable tasks | V1 is published/frozen; current manifests/tests are evidence | TR-OPS-01—04; release closure | Could reopen completed work | YES, with closed/non-executable warning | NO active reliance | All |
| SA-023 | Active planning documents | Public source-of-truth terminology | PublicMapLead serving projection was called authoritative truth | Private pointer + approved Submission is authoritative; PublicMapLead is the serving read model/API source | TR-DOM-03; TR-SEC-05 | Could authorize projection writes as domain truth | YES, only as warned historical wording | YES in active docs | 05—11 |
| SA-024 | Historical public-flow text | Public identity | `recordCode` or `boardId` implied suitability as public identity | `publicLeadId` is opaque, non-inferable and has explicit lifecycle/cardinality | TR-DOM-02; task 06 | Privacy, ownership and resurrection risk | YES, as history | YES in active plan | 05—14 |

All `STALE_ACTIVE_ASSUMPTION` rows are now either rewritten in active sources or isolated under explicit non-authoritative history warnings. Open product unknowns are not “resolved by assumption”; they are gates.

## D. KNOWLEDGE_PROPAGATION_GAPS

| GAP_ID | Missed propagation | Downstream risk | Correction in this pass |
| --- | --- | --- | --- |
| KP-01 | Silent Account/Profile-optional truth did not remove old V2 login/profile tasks | Review/UX profile gating recurrence | Capability delta removes duplicate tasks; PDG-01 and tasks 08/13 prohibit Profile gate |
| KP-02 | Final B/S/P semantics did not replace ContributionDraft overwrite everywhere | Failed attempts could erase public state | Tasks 05/09 freeze versioned lifecycle and monotonic projector |
| KP-03 | Lightweight P1 pointer was not propagated into map source terminology | P1 or Submission collection could become public API | Three named truth/read layers now appear in PRD/design/tech/architecture/plan |
| KP-04 | V1 APPROVED was treated as sufficient for publication | Private verification could silently grant public consent | Explicit preview/consent/eligibility/moderation tasks 05/08/10 |
| KP-05 | Private device location was treated as public venue | Privacy leakage and wrong merchant attribution | Four-level location contract and PDG-03 added before schema/backend/UI |
| KP-06 | Product decisions blocked discovery that should generate their evidence | Circular planning/deadlock | Tasks 01—03 run after plan approval and generate EG-01—03; task 04 closes gates |
| KP-07 | Reminders/posters remained in V2 completion despite no current restoration decision | Scope/package/review inflation | Deferred in PRD/design/tech/plan; PDG-06 controls any restoration |
| KP-08 | No publicLeadId lifecycle/cardinality/noninferability contract | Enumeration, collision, stale link resurrection | Draft contract frozen in plan and architecture; schema task 06 verifies it |
| KP-09 | Moderation scope was inherited from rich UGC before public fields were chosen | Premature appeal/SLA/admin complexity | PDG-02 derives moderation; structured MVP is eligibility/hide/withdraw/audit only |
| KP-10 | V1 provider-vs-DB incident was not mapped to V2 stages | Misdiagnosis and destructive retries | Tasks 09/11 require provider/validation/DB/projection/UI checkpoints and stable codes |
| KP-11 | V1 package growth did not constrain map SDK/assets | Upload/review performance failure | Task 03 measures provider/SDK/package; tasks 14/15 enforce budget |
| KP-12 | True-device findings were a release-only note | Late discovery of permission/map/location/share failures | Task-level true-device fields plus task 15 matrix |
| KP-13 | Old active-looking plans/specs stayed adjacent to current tasks | Accidental execution from obsolete assumptions | Active/history files separated; warnings added; README points to authority |
| KP-14 | V1 history backfill was discussed as migration, not fresh public consent | Bulk private-to-public disclosure | PDG-05 defaults no auto backfill; tasks 02/05/08 require per-item re-consent |

### POST_RECONCILIATION_CONTRADICTION_REPORT

| Active document set | Result | Notes |
| --- | --- | --- |
| `README.md`, `PRD.md` | PASS | V1 baseline versus V2 draft, evidence-first scope, optional Profile, deferred extras and current completion agree |
| 当时的 V2 计划快照 | PASS | 当时的 16 个锁定任务现已整体归档至 `memory-bank/v2-planning-draft-pre-v1-truth-review.md`；本行不描述当前计划 |
| `memory-bank/design-document.md` | PASS | Current reconciliation is explicit; old V1/V2 evolution is marked historical |
| `memory-bank/tech-stack.md` | PASS | No provider prematurely selected; current public/private terminology and deferred scope agree |
| `memory-bank/architecture.md` | PASS | Existing versus planned resources and publicLeadId lifecycle agree with plan |
| `memory-bank/progress.md` | PASS | Current top state overrides dated snapshots; no implementation is active |
| Current decision/delivery entry points | PASS | Old proposals/specs are explicitly non-executable; current packet and plan are linked |
| Frozen runtime/contracts | PASS | No runtime/resource/recognition file changed; hashes remain exact |

`ACTIVE_DOC_CONTRADICTIONS = 0`. Historical contradictions remain only inside clearly labelled non-authoritative evidence and cannot unlock work.

## E. V2_CAPABILITY_DELTA

| Capability | ALREADY_EXISTS_AND_REUSE | NEEDS_V2_EXTENSION | NET_NEW_V2_CAPABILITY | Tasks |
| --- | --- | --- | --- | --- |
| Account/Profile | Silent Account, internal ownership, ICHI ID, optional profile edit | Decide whether any contributor display is public | None for login/profile | 04,08,13 |
| Private board facts | Local Board, versioned Submission, pointer Publication, R2 facts, owner deletion | Public-consent candidate/re-consent commands | None to recognition semantics | 02,05,08 |
| Public serving | Function envelope and server-only DB pattern | Deployment/resource discipline | PublicMapLead, publicLeadId, projector, viewport/detail API | 03,06—07,09,11 |
| Verification/moderation | LOCATION/PHOTO/NOTE private verification, msgSecCheck, roles/audit | Separate public eligibility input | Minimal public approval/admin hide/withdraw/audit | 05,10 |
| Location | Private GCJ-02 capture evidence and accuracy | Confirmed venue/POI and consent-bound edit rules | Derived public coordinate/precision and geo query | 03,05—07,14 |
| Client | Page shell, navigation, adapters, My Uploads, stale active-board lessons | Owner public controls and map state integration | Map/list/filter/detail/clustering/public landing | 12—14 |
| Sharing/package | V1 tab-only share allowlist; 2 MiB gate | Safe publicLead landing link and package measurement | No poster/reminder in current scope | 03,14—15 |
| Release | Quality workflow, CloudBase read-back, true-device and publication/tag discipline | V2 privacy/map/migration/pilot matrix | Public-map production smoke | 15—16 |

Task mapping (exactly one primary delta category):

| Task | Primary category | Why it is not an already-completed V1 task |
| --- | --- | --- |
| 01 | `NET_NEW_V2_CAPABILITY` | V1 did not validate public lead discovery/comprehension |
| 02 | `NEEDS_V2_EXTENSION` | V1 private data exists; lawful public supply/re-consent evidence does not |
| 03 | `NET_NEW_V2_CAPABILITY` | No V1 map/geo/public-cost capability exists |
| 04 | `NET_NEW_V2_CAPABILITY` | V1 did not select a public-map MVP |
| 05 | `NEEDS_V2_EXTENSION` | Extends private publication with explicit public lifecycle semantics |
| 06 | `NET_NEW_V2_CAPABILITY` | PublicMapLead/publicLeadId do not exist |
| 07 | `NET_NEW_V2_CAPABILITY` | Public viewport/API/resource architecture does not exist |
| 08 | `NEEDS_V2_EXTENSION` | Extends owner/private functions with consent/re-consent, not login |
| 09 | `NET_NEW_V2_CAPABILITY` | No public projector exists |
| 10 | `NET_NEW_V2_CAPABILITY` | No public moderation operation exists |
| 11 | `NET_NEW_V2_CAPABILITY` | No public map endpoint exists |
| 12 | `NEEDS_V2_EXTENSION` | Reuses client adapters/race lessons but adds viewport state |
| 13 | `NET_NEW_V2_CAPABILITY` | No public consent/owner-control UX exists |
| 14 | `NET_NEW_V2_CAPABILITY` | V1 map is a placeholder only |
| 15 | `NET_NEW_V2_CAPABILITY` | V1 gates do not cover public geo/consent/moderation/pilot |
| 16 | `NEEDS_V2_EXTENSION` | Reuses release method for a distinct V2 production boundary |

No standalone task exists merely to reimplement an `ALREADY_EXISTS_AND_REUSE` capability.

## F. HISTORICAL SEPARATION

### File separation

- `memory-bank/v2-planning-draft-pre-v1-truth-review.md`：保存本审阅包所对应的 16 个历史 V2 任务，无执行权。
- `memory-bank/implementation-plan-history.md`：保存已完成 V1、初始 V2 草案以及更早 V2/V3 计划，并带有中文历史警告。
- `docs/delivery/v2-pre-development-review-packet-initial-draft-history.md`: first planning packet preserved with the same non-executable warning.
- Old account, V2 lifecycle, toolchain, and V1 CloudBase specs now carry explicit historical/superseded warnings.
- `progress.md` keeps dated evidence but marks old next steps/non-current states as historical snapshots.

### OLD_PLAN_TO_V2_PLAN_MAPPING

| Old task | Classification | New task(s) | Reason |
| --- | --- | --- | --- |
| V2-00 | `SPLIT / MODIFY / BLOCKED_BY_DECISION` | 04—06 | Remove duplicate Account work; separate scope, consent/location, public model |
| V2-01 | `KEEP / MOVE / MODIFY` | 01 | User-value evidence is first-class and no longer hidden inside a product gate |
| V2-02 | `KEEP / MOVE / MODIFY` | 01 | Comprehension becomes EG-01 evidence |
| V2-03 | `SPLIT / MODIFY` | 02—04,07,16 | Legal supply, platform feasibility, product decisions, API and release are separate dependencies |
| V2-04 | `KEEP / MOVE / MODIFY` | 02 | Lawful supply and takedown become early evidence |
| V2-05 | `SPLIT / MODIFY` | 05—07 | Replace old entities with final B/S/P, explicit consent, public model/API |
| V2-06 | `SPLIT / MODIFY` | 06—11 | Resource, projector, moderation and API no longer one block |
| V2-06A | `ALREADY_COMPLETED_IN_V1 / MODIFY` | 04,08 | Account/ICHI ID exist; only public disclosure/consent is V2 |
| V2-06B | `ALREADY_COMPLETED_IN_V1 / MODIFY` | 04,13 | Profile editing exists; no V2 implementation task repeats it |
| V2-07 | `SPLIT / MODIFY` | 02,05,08,13 | V1 player upload exists; lawful source, public consent, backend and UX are separated |
| V2-08 | `ALREADY_COMPLETED_IN_V1 / MODIFY` | 02,10,15 | Private prize-ticket verification exists; V2 evaluates eligibility/pilot, not OCR reimplementation |
| V2-09 | `SPLIT / MODIFY` | 08—10,13 | Owner consent, projector, moderation and UX are distinct |
| V2-10 | `KEEP / MOVE / MODIFY` | 06,14 | Time/freshness is a schema/UX contract; thresholds remain evidence-driven |
| V2-11 | `MOVE / MODIFY` | 05,09—10 | Withdrawal/deletion is core lifecycle, not tail cleanup |
| V2-12 | `MOVE / MODIFY` | 12—14 | UI follows contracts/API/state |
| V2-13 | `SPLIT / BLOCKED_BY_DECISION` | 03,05,07,14 | Provider, location semantics, API and permission UX are separate |
| V2-14 | `SPLIT / MODIFY` | 07,12,14 | Filters require query/null/cache contracts before UI |
| V2-15 | `MODIFY / MOVE` | 06,11,14 | Detail reads only PublicMapLead and handles hidden/deleted links |
| V2-16 | `MERGE / MOVE / MODIFY` | 12,14—15 | Client/platform verification joins the layered/true-device gate |
| V2-16A | `DEFER_TO_LATER_VERSION / BLOCKED_BY_DECISION` | PDG-06 | Watch rules are not current V2 completion scope |
| V2-16B | `DEFER_TO_LATER_VERSION / BLOCKED_BY_DECISION` | PDG-06 | Subscription messages need a future scope/platform/ops plan |
| V2-16C | `MODIFY / MERGE` | 14,16 | Keep only safe publicLead landing link; rich sharing optimization deferred |
| V2-16D | `DEFER_TO_LATER_VERSION` | PDG-06 | Result poster is unrelated to core-map proof and adds package/privacy cost |
| V2-17 | `SPLIT / MODIFY` | 10,15—16 | Operations, test/pilot and release are separate |
| V2-18 | `KEEP / MOVE / MODIFY` | 15 | Closed pilot remains, now after full lifecycle/device gates |
| V2-19 | `SPLIT / MODIFY` | 15—16 | Quality/pilot and actual publication/tag are separate |
| V2-20 | `DEFER_TO_LATER_VERSION / DELETE from V2 completion gate` | post-V2 review | V3 decision cannot define whether V2 itself is complete |

Old V1 task groups are `ALREADY_COMPLETED_IN_V1 / HISTORICAL BASELINE`; old V3 task groups remain `DEFER_TO_LATER_VERSION`. Neither is executable from the current plan.

## G. PRODUCT / EVIDENCE GATES

### Evidence gates

| Gate | Question/evidence | Generator | Downstream blocked | Pass rule |
| --- | --- | --- | --- | --- |
| EG-V2-01 | Does the non-real-time lead map solve discovery/decision work without inventory misunderstanding? | 01 | 04—16 | Representative task/comprehension evidence supports Continue/Adjust |
| EG-V2-02 | Is there a lawful, sustainable, removable supply route, and is explicit V1 re-consent sufficient for a pilot? | 02 | 04,08—16 | Named route, rights evidence, takedown owner, quantified pilot or explicit Stop |
| EG-V2-03 | Are provider, coordinate, CloudBase geo/index/API, cost, rate and package constraints feasible? | 03 | 04,07,11,14—16 | Reproducible target-environment matrix and approved bounded option/fallback |
| EG-V2-04 | What privacy/review declarations and public-content/location obligations apply to the chosen MVP? | 04 using 01—03 evidence | 05—16 | Documented obligations mapped to fields, UX, deployment and release |

Tasks 01—03 are evidence producers and are not blocked by the gates they generate. They start only after the human approves this plan.

### Product decision gates

| Gate | QUESTION | WHY IT MATTERS | OPTIONS | BLOCKED TASKS | RECOMMENDED DECISION | USER_DECISION_REQUIRED |
| --- | --- | --- | --- | --- | --- | --- |
| PDG-V2-01 | Who can read and is any contributor identity displayed? | Determines auth, privacy, API and review surface | anonymous minimal / silent Account / mixed; no identity / ICHI ID / nickname/avatar | 05—16 | Anonymous minimal read; contribution uses silent Account; no contributor profile in MVP | YES |
| PDG-V2-02 | Exact public fields and resulting moderation? | V1 approval does not cover new public content | structured only / +note / +image | 05—16 | Structured only, no public note/image; eligibility + approval + hide + withdrawal + audit | YES |
| PDG-V2-03 | What is location and public precision? | Prevents device-track leakage and false merchant attribution | verified POI / user-selected venue / rounded device point; precision options | 05—16 | Confirmed venue/POI; device point private; derived public coordinate/precision | YES |
| PDG-V2-04 | Which supply sources launch and how are duplicate real-world boards handled? | Controls cold start, identity and moderation cost | V1 re-consent only / player direct / merchant/staff / curated; separate / manual link / auto merge | 05—16 | One proven player route, separate leads; merchant/staff evidence pilot; no auto merge | YES |
| PDG-V2-05 | Can historical V1 publications enter? | Existing private consent did not authorize public display | none / per-item re-consent / policy bulk | 08—10,15—16 | No auto backfill; exact preview + fresh per-item consent + new eligibility review | YES |
| PDG-V2-06 | What defines V2 completion? | Prevents reminders/posters from silently returning | core map / +safe link / +reminders / +poster/rich sharing | 13—16 | Core map + safe public landing only; reminders/posters deferred | YES |

## H. REBUILT V2 PLAN

以下是本历史快照当时的任务顺序；完整字段现归档于 `memory-bank/v2-planning-draft-pre-v1-truth-review.md`，不得从本节启动实施：

| Order / Task | Goal | Dependencies / gates | Key work | Test gate | True device | Acceptance | Knowledge propagation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 01 User value discovery | Validate discovery value and non-real-time comprehension | Plan approval; generates EG-01 | Research protocol, representative study, metrics/stop rule | Protocol/evidence trace | NO | Evidence-based Continue/Adjust/Stop | Updates 04,12—16/product docs |
| 02 Supply feasibility | Prove lawful removable supply and V1 re-consent pilot sufficiency | Plan approval; generates EG-02 | Rights/takedown inventory, private aggregate eligibility | Rights/deletion/tabletop | NO | One viable route or Stop | Updates 04—10,13,15—16 |
| 03 Platform spike | Prove provider/geo/API/cost/package feasibility | Plan approval; generates EG-03 | Target capability/limits/cost/fallback | Synthetic load/package/read-back | CONDITIONAL | Approved bounded option or Stop/change | Updates 04—07,11—16 |
| 04 Gate closure | Freeze MVP and completion scope | 01—03; closes EG/PDG | Decisions, field/location/source/deferred scope | Workflow/contradiction/trace | NO | User signs all gates or stops V2 | Updates all downstream |
| 05 Consent/location lifecycle | Define explicit public state machine and four-level location | 04; PDG-01—05 | Preview/consent/pending/rejected/public/edit/withdraw/delete/re-consent | Domain/negative/stale matrix | NO | Deterministic public/private outcome | Updates 06—16 |
| 06 PublicMapLead contract | Freeze minimal projection and opaque ID | 05 | Schema, cardinality, versions, null, retirement | Schema/leakage/compatibility | NO | Forbidden private fields cannot validate | Updates 07—16 |
| 07 API/resources contract | Freeze viewport/query/security/performance/resource plan | 03,06; EG-03 | bbox/cursor/limit/cluster/cache/rate/index/migration/rollback | Contract/property/security/load plan | NO | Feasible bounded plan approved | Updates 09,11—16 |
| 08 Owner public write path | Implement preview/consent/control/re-consent backend | 05—07 | Owner commands, digest/version, audit, account deletion | Unit/contract/integration/auth/idempotency | Later YES | No public eligibility without exact consent | Updates 09—10,12—16 |
| 09 Projector | Monotonic PublicMapLead create/update/hide/retire | 06—08 | Checkpoints, compare-and-advance, retry/reconcile | Failure/concurrency/resurrection | NO | Failed/late private attempt leaves served lead | Updates 10—16 |
| 10 Minimal moderation | Operate eligibility/approval/hide/withdraw/audit | 08—09; PDG-02/04 | Least privilege, reasons, owner precedence | Negative/security/role/hide SLA | NO | Unauthorized action fails; hide bounded | Updates 11—16 |
| 11 Public API | Serve allowlisted viewport/detail | 07,09—10 | Validation/index/cache/rate/hidden results | Contract/cloud/load/leakage | NO | Budget passes; no private leakage | Updates 12—16 |
| 12 Client state | Guard viewport/filter/detail cache and races | 06—07,11 | Query identity/generation, paging/offline/stale | Reducer/race/integration | NO | Late response never overwrites current state | Updates 13—16 |
| 13 Consent UX | Explicit preview/status/edit/withdraw/delete/re-consent | 05,08,10—12 | My Uploads owner control without profile gate | Component/a11y/negative consent | YES | User understands/controls every public state | Updates 15—16 |
| 14 Map UX/platform | Map/list/filter/detail/location fallback/safe link | 03—07,11—13 | Clustering, non-real-time copy, permissions, package | Unit/component/e2e/platform/network/package | YES | Discovery task passes without inventory confusion | Updates 15—16 |
| 15 Layered gate/pilot | Prove quality, privacy, scale, device, pilot, rollback | 08—14 | Unit→release matrix, takedown drill, pilot | All layers + production smoke | YES | No P0/P1; user Continue/Adjust/Stop | Any finding updates 08—16 |
| 16 Release/publication/tag | Close deployment, review, online source and immutable tag | 15 + explicit user release authority | Deploy/read-back, PR/main, upload/review/publish, smoke, tag | Full release regression | YES | Tag only after actual APPROVED+PUBLISHED | Updates release/V3 facts |

Critical path: `human plan approval → 01/02/03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15 → 16`. Tasks 01—03 may run in parallel after approval. UI cannot start before public semantics/backend/state; release cannot bypass task 15.

## I. CURRENT V2 COMPLETION DEFINITION

V2 is complete only when:

1. EG-01—04 and PDG-01—06 are explicitly closed.
2. At least one lawful, sustainable, removable supply route passes a bounded pilot.
3. No private publication becomes public without exact preview, explicit versioned consent, eligibility/moderation, and auditable ownership.
4. PublicMapLead/publicLeadId, location precision, bounded API, failed-update isolation, hide/withdraw/delete/no-resurrection, and eventual consistency pass.
5. Map/list/filter/detail and safe public landing work without Profile completion and users understand “historical lead, not real-time inventory.”
6. Minimal moderation/admin hide, owner controls, rate/abuse boundaries, logs and rollback work.
7. Unit, contract, integration, cloud/backend, migration, negative/security, performance/package, true-device, production smoke and V1 regression gates pass.
8. Deployed versions, DB/index/migration, privacy declarations, WeChat review scope, GitHub main, online-source commit and rollback evidence are recorded.
9. Immutable V2 tag is created only after actual WeChat `APPROVED + PUBLISHED`.

Not required: reminders/subscription messages, result posters, rich public notes/photos, advanced appeals/SLA, automatic canonical merge/unmerge, merchant/staff full operations. Restoring any requires PDG-06 change and downstream propagation.

## J. REMAINING HUMAN DECISIONS

The user must approve or reject:

1. This reconciliation as the new authoritative Implementation Plan.
2. After tasks 01—03 produce evidence: PDG-01 audience/contributor disclosure.
3. PDG-02 public field allowlist and derived moderation.
4. PDG-03 venue/public-coordinate/precision/edit/migration semantics.
5. PDG-04 MVP supply tranche and separate-vs-canonical behavior.
6. PDG-05 historical V1 per-item re-consent policy.
7. PDG-06 core completion scope; recommended reminders/posters remain deferred.
8. The bounded provider/CloudBase/query/cost/package option supported by EG-03.

No hidden product choice was made for these. Draft recommendations are not implementation authorization.

## K. FILES MODIFIED

Planning/Memory Bank only:

- `README.md`
- `PRD.md`
- `memory-bank/implementation-plan.md`
- `memory-bank/implementation-plan-history.md`
- `memory-bank/design-document.md`
- `memory-bank/tech-stack.md`
- `memory-bank/architecture.md`
- `memory-bank/progress.md`
- `docs/delivery/v2-pre-development-review-packet.md`
- `docs/delivery/v2-pre-development-review-packet-initial-draft-history.md`
- `docs/decisions/v2-contribution-verification-lifecycle.md`
- `docs/decisions/account-and-my-panel-proposal.md`
- `docs/decisions/v1-board-ocr-model-selection.md`
- `docs/decisions/v1-board-recognition-prompt-contract.md`
- `docs/decisions/v1-session-and-storage.md`
- `docs/decisions/v1-toolchain-and-recognition.md`
- `specs/v1-cloudbase-backend/requirements.md`
- `specs/v1-cloudbase-backend/design.md`
- `specs/v1-cloudbase-backend/tasks.md`

No runtime, page, component, cloud function, database/Storage rule, recognition pipeline, production configuration, or V2 functionality test file was changed.

## L. STATUS

Final validation evidence:

- `corepack pnpm quality`: PASS — format, ESLint, both TypeScript projects, 57 test files / 571 tests, contract validators, and workflow validator.
- Rebuilt-plan structure: PASS — 16/16 tasks contain every required task field; all remain `LOCKED / NOT_STARTED`.
- `node scripts/validate-workflow.mjs`: PASS — 8 required files.
- `git diff --check`: PASS.
- Frozen R2 SHA-256 read-back: prompt `c083066c80999722a2e3207f64654c598e418daf1c51dba35d57abf0291a3462`; schema `178c3fffb9ad74257ad6fb0123509beacbd011225eae2aa7eb2d648beb690722`; resolver `46ffebadc3094412c4beb9c8625acdf83346b496e382fe40a48083ff101411d8`.
- Final worktree boundary: documentation files only; the TypeScript build-cache refresh created by validation was returned exactly to `HEAD`.

- `CURRENT_V2_PLAN_AUTHORITATIVE = NO` before reconciliation; the rebuilt plan remains a human-review draft, not implementation authority.
- `MAIN_VALID_AS_V2_BASE = YES`
- `CURRENT_SYSTEM_TRUTH_RECONCILED = YES`
- `STALE_ACTIVE_ASSUMPTIONS_RESOLVED = YES`
- `ACTIVE_DOC_CONTRADICTIONS = 0`
- `V2_PLAN_REBUILT_FROM_CURRENT_TRUTH = YES`
- `V2_PLAN_READY_FOR_HUMAN_REVIEW = YES`
- `V2_IMPLEMENTATION_STARTED = NO`
- `TASK-V2-01 = LOCKED / NOT_STARTED`
- `CloudBase deploy = NO`; `migration = NO`; `WeChat action = NO`
- `commit = NO`; `push = NO`; `PR = NO`; `merge = NO`; `tag = NO`

Stop after this packet. Do not start `TASK-V2-01`.
