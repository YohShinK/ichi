# V2-C Completion Reconciliation Review

> Date: 2026-09-13
>
> Purpose: code-level completion reconciliation evidence; Founder approval is recorded only in section 8
>
> Result: `PASS / HUMAN_APPROVED AS RECONCILED`
>
> Branch/HEAD baseline: `feature/v2-board-map@929d189a06e13010e50abf4927bfec3b1ebd49fc`

## 1. Canonical ownership reconciliation

The latest `memory-bank/implementation-plan.md` originally combined local implementation with `CLOUD_DEPLOY_REQUIRED=YES` for TASK-V2-10—13 and `MIGRATION_REQUIRED=YES` for TASK-V2-10/11/13. At the same time, its implementation rows said CloudBase wiring waited for a production gate. The Founder-approved `docs/delivery/v2-b-closeout-review.md` formally assigns cross-layer security/migration/rollback to TASK-V2-19, candidate/pilot validation to TASK-V2-20/21, and actual deploy/review/publication/tag to TASK-V2-22. The safe-batch authorization also expressly limited TASK-V2-10—13 to local implementation.

This was a canonical field mismatch, not permission for Codex to reduce product scope. The current plan now records `NO_FOR_LOCAL_COMPLETION` and an explicit `PRODUCTION_OWNER` without removing any production obligation.

| Task | Local completion | Original deploy/migration fields | Current production/resource owner | Production validation | Acceptance retained |
| --- | --- | --- | --- | --- | --- |
| TASK-V2-10 | Source adapters; Verification/VerifiedBoard/Opportunity/PublicCandidate exact-version gates; VerifiedBoard-only resolver; authorization/applicability/owner commands; tests | Cloud `YES`; migration `YES` | TASK-V2-19 integration + migration rehearsal; TASK-V2-21 pilot/RC; TASK-V2-22 actual deploy/migration | TASK-V2-19/21/22 | Authorization required, one-version UX, trusted/idempotent/auditable hide-first owner action |
| TASK-V2-11 | Trusted avatar projection; monotonic projector; stable active ID; retire/no-resurrection; Freshness; tests | Cloud `YES`; migration `YES` | TASK-V2-19 projector/avatar/outbox integration + rehearsal; TASK-V2-21 pilot/RC; TASK-V2-22 actual deploy/migration | TASK-V2-19/21/22 | Lifecycle matrix, no stale/failed overwrite, no withdrawal/delete resurrection |
| TASK-V2-12 | Trusted reporter/moderator/owner authority boundary; moderation domain/audit/retention; tests | Cloud `YES`; migration `NO` | TASK-V2-19 role/resource/security integration; TASK-V2-20/21 ops validation; TASK-V2-22 actual deploy | TASK-V2-19/20/21/22 | Unauthorized action fails; public hide; audit complete |
| TASK-V2-13 | Trusted account/shared rate/read-control/secret ports; bounded query/detail; snapshots/cursors/allowlist; tests | Cloud `YES`; migration `YES` | TASK-V2-19 Cloud Function/resource/index/migration rehearsal; TASK-V2-20/21 candidate/pilot; TASK-V2-22 actual apply/deploy/secret binding | TASK-V2-18—22 | Budget validation downstream; leakage zero; hidden/deleted fail closed |

`TASK_10_13_OWNERSHIP = CONSISTENT`

`PLAN_OWNERSHIP_CONTRADICTION = NO`

## 2. VerifiedBoard and Opportunity hard gates

Real code path:

```text
adaptDirectPublication()/adaptAssistedPublication()
  -> VerificationInput
  -> verifyBoard()
  -> branded VerifiedBoard + exact observation/version
  -> resolveBoardInstance(VerifiedBoard, currentVerifiedBoardVersion, candidates)
  -> recordOpportunityEvaluation(VerifiedBoard, result)
  -> exact VerifiedBoard/version-bound OpportunityEvaluation
  -> buildPublicCandidate(VerifiedBoard + OpportunityEvaluation + public gate/rights/auth/location)
  -> branded PublicCandidate
  -> reconcilePublicMapLead()
```

| Boundary | File | Type/function | Enforced result |
| --- | --- | --- | --- |
| Source to verification | `packages/v2-map/src/source-adapters.ts` | `VerificationInput`, `adaptDirectPublication`, `adaptAssistedPublication` | Source output remains `verificationInputOnly`; exact V1 source version is checked |
| Verification | `packages/v2-map/src/verification.ts` | `VerifiedBoard`, `verifyBoard`, `isVerifiedBoard` | Expected and current Observation versions must match; branded immutable verified artifact is created |
| BoardInstance input | `packages/v2-map/src/board-instance.ts` | `resolveBoardInstance` | Raw/unbranded input is `REJECTED_UNVERIFIED`; non-current version is `REJECTED_STALE_VERSION`; candidates also carry VerifiedBoard |
| Opportunity | `packages/v2-map/src/verification.ts` | `OpportunityEvaluation`, `recordOpportunityEvaluation` | Evaluation must bind exact `verifiedBoardId + verifiedBoardVersion` |
| Public candidate | `packages/v2-map/src/projector.ts` | `buildPublicCandidate`, `isPublicCandidate` | Requires branded current VerifiedBoard, matching branded evaluation and independent `publicGateDecision=PASS` |
| Projector/migration | `projector.ts`, `migration.ts` | `candidatePasses`, `dryRunPublicMapMigration` | Hand-written/unbranded candidate is rejected and cannot materialize |

Opportunity level and public gate are deliberately separate. `HIGH/MEDIUM/LOW/INSUFFICIENT` expresses the evaluated level; `publicGateDecision=PASS|FAIL` is a separate canonical gate. The positive control proves `LOW + PASS` can publish, so no HIGH-only or LOW-fails mapping was invented.

## 3. V1 private avatar to public-safe delivery

Current V1 truth:

- `services/cloudbase/shared/runtime.js` stores `profiles.avatarFileId`, with `null` for the default profile. `freshProfileAvatarUrl()` calls server-side `cloud.getTempFileURL({ fileID, maxAge: 300 })` for the owner profile response.
- `apps/client/miniprogram/platform/cloud-account.ts` uploads `chooseAvatar` temporary files to `profile-avatars/...` and persists only returned CloudBase `fileID`.
- `services/cloudbase/database/resources.json` declares `profile-avatars/` durable/private with `publicRead=false`; deployed ACL is `CUSTOM`, owner-only client read/write, trusted server bypass retained.

V2 contract:

- `packages/v2-map/src/avatar-projection.ts` defines `TrustedContributorProfile`, `PrivateAvatarUrlIssuer`, `PublicAvatarProjectionPolicy`, `PublicContributor`, and `projectPublicContributor()`.
- Only a trusted active profile with a valid `cloud://.../profile-avatars/...` reference can call the issuer.
- The issuer output must be an unexpired HTTPS URL from an allowlisted signed-URL origin. Query signatures are permitted; credentials and fragments are rejected.
- Legacy/arbitrary HTTPS profile input is never promoted. Invalid/missing/expired/deleted profile state returns `/assets/v1-29/ichi-avatar.png`.
- `PublicContributor` is branded at the server projection boundary; `buildPublicCandidate()` rejects untrusted contributor objects.
- The public view contains only `displayName` and public URL/fallback asset. `avatarFileId` is absent and the JSON negative assertion checks that neither the field nor `cloud://` value appears.

**A V1 real user's existing private avatar becomes visible to another map user when the trusted server reads the stable `profiles.avatarFileId`, asks the private-avatar issuer/CloudBase adapter for a short-lived signed HTTPS URL, validates the projection policy, and serializes only that URL; failure or deletion yields the ICHI fallback and the private fileID never reaches the client.**

Production adapter ownership: TASK-V2-19 binds and verifies the CloudBase issuer; TASK-V2-21 validates pilot behavior; TASK-V2-22 performs actual deploy/config binding. Storage ACL is unchanged.

## 4. Server-trusted authority boundaries

### Reporter, moderation and owner

`packages/v2-map/src/moderation.ts` defines a client-safe `ClientReportRequest` and production-facing `TrustedModerationService`. The client submits only target, category, reason, action ID and time. `ReporterAuthorityPort` supplies trusted account, eligibility and spam classification; `ModeratorAuthorityPort` supplies moderator privilege and credible-notice classification; `OwnerAuthorityPort` supplies caller identity and target ownership. Domain functions may still accept trusted booleans for deterministic unit tests, but no production-facing client request does.

Tests prove spoofed eligibility/spam/reporter identity is ignored, two device labels still deduplicate to one trusted account, and an ordinary client cannot self-declare moderator privilege or a credible notice.

### Rate limit

`packages/v2-map/src/public-api.ts` defines `RateLimitStore.consume({ key, limit, windowMs, nowMs }) -> ALLOWED|LIMITED|UNAVAILABLE`. Keys are built by the service from the server-derived account and operation. `InMemorySharedRateLimitStore` is explicitly local-only and is injected/shared across service instances in tests; it is not a production authority. Store absence/unavailability fails with stable `SERVICE_UNAVAILABLE`. TASK-V2-19 owns a durable cross-serverless-instance adapter; TASK-V2-22 owns actual deployment.

### Global read stop

`PublicMapReadControl.readState()` is a trusted server port. Missing, disabled or unavailable control fails closed with stable `SERVICE_UNAVAILABLE`. A `globalReadEnabled` request field is ignored.

### HMAC cursor secret

`CursorSecretSource.currentSecret()` is a server-only port. `ViewportRequest` and `DetailRequest` have no secret field. Missing or shorter-than-32 secrets fail closed. A client-injected secret has no effect. TASK-V2-19 owns adapter/config validation; TASK-V2-22 owns actual production secret binding. No secret is added to client code or bundle.

## 5. Added and strengthened tests

Dedicated file: `packages/v2-map/src/v2-c-completion-reconciliation.test.ts` (`22 tests PASS`).

Hard gates:

- `no VerifiedBoard -> reject`
- `stale VerifiedBoard version -> reject`
- `wrong VerifiedBoard version -> reject`
- `missing OpportunityEvaluation -> reject`
- `OpportunityEvaluation bound to wrong VerifiedBoard/version -> reject`
- `PublicCandidate direct bypass from VerificationInput -> reject`
- `BoardInstance resolver cannot consume unverified raw state`
- `valid exact-version VerifiedBoard + valid Opportunity gate -> pass`

Avatar:

- `valid private avatar reference -> public-safe locator; private fileID never serialized`
- `arbitrary HTTPS input rejected unless produced by trusted projection`
- `invalid avatar reference -> fallback; no custom avatar -> fallback`
- `expired projection -> safe fallback`
- `profile/account deletion -> safe fallback/no leak`

Trusted authority:

- `spoofed eligibleReporter from request -> ignored`
- `same trusted account multiple reports/devices -> distinct count only 1`
- `spoofed moderator flag rejected; credible notice cannot be self-declared`
- `spoofed owner identity is ignored in favor of trusted owner authority`
- `rate store unavailable -> stable unavailable response`
- `account-bound shared rate budget ignores client counter and device identity`
- `global read stop client override ignored; server disabled is unavailable`
- `missing server read control -> fail closed/stable unavailable`
- `client HMAC secret injection has no effect; missing/short server secret fail closed`

TASK-V2-10's existing test file was also strengthened with `rejects raw verification input and stale VerifiedBoard versions`; batch integration now executes the complete VerificationInput→VerifiedBoard→OpportunityEvaluation→PublicCandidate chain.

## 6. Validation

- Targeted V2-C + integration + reconciliation: `6 files / 56 tests PASS`.
- Workspace typecheck: `PASS`.
- Lint: `PASS`.
- Format: `PASS`.
- Workflow validation: `PASS`.
- Full repository quality: `63 files / 627 tests PASS`.
- V1 regression/V1-F preflight: `PASS`.
- Public leakage negative tests: `PASS / private avatar fileID and injected private fields = 0 serialized`.
- Canonical Frozen R2 SHA suite: `PASS`.
  - Prompt: `c083066c80999722a2e3207f64654c598e418daf1c51dba35d57abf0291a3462`
  - Schema: `178c3fffb9ad74257ad6fb0123509beacbd011225eae2aa7eb2d648beb690722`
  - Resolver: `46ffebadc3094412c4beb9c8625acdf83346b496e382fe40a48083ff101411d8`
- `git diff --check`: `PASS`.
- Production-scoped runtime/resource/config mutation: `0`.

## 7. Production actions and unresolved decisions

`commit / push / PR / merge / tag / deploy / publish / upload / production migration / production backfill / DB/index mutation / Storage/ACL mutation / production config change = NO`

No new product or architecture decision remains unresolved. The remaining action is Founder final review, not a missing design choice.

`UNRESOLVED_FOUNDER_DECISIONS = 0`

## 8. Founder final approval and exact status

On 2026-09-13 the Founder explicitly approved TASK-V2-10—13 `AS RECONCILED` and approved `V2_C_RECONCILIATION=PASS` through `V2-C_to_V2-D_Knowledge_Alignment_State_Transition.txt`. This is the real approval event; it is distinct from the earlier execution command that was correctly treated as non-approval. Production deploy, migration, resource/index apply, secret binding, true-device, pilot and release obligations remain downstream.

`V2_C_RECONCILIATION = PASS`

`TASK_V2_09 = COMPLETE / HUMAN_APPROVED`

`TASK_V2_10 = COMPLETE / HUMAN_APPROVED`

`TASK_V2_11 = COMPLETE / HUMAN_APPROVED`

`TASK_V2_12 = COMPLETE / HUMAN_APPROVED`

`TASK_V2_13 = COMPLETE / HUMAN_APPROVED`

`V2_C = COMPLETE / HUMAN_APPROVED`

`V2_D = READY / NOT_STARTED`

`TASK_V2_14 = READY / NOT_STARTED`

`TASK_V2_15_TO_22 = LOCKED / NOT_STARTED`

`V2_IMPLEMENTATION_STARTED = YES / LOCAL_ONLY`
