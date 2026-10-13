# TASK-V2-15 Review Packet

> Status: `IMPLEMENTATION_COMPLETE / AWAITING_FOUNDER_REVIEW`
>
> Block: `V2-D / IN_PROGRESS / AWAITING_TASK_15_FOUNDER_REVIEW`
>
> Downstream: `TASK-V2-16—22 / LOCKED / NOT_STARTED`

## 1. Scope

Implemented the local, low-fi/high-interaction-fidelity UX for versioned map contribution authorization and trusted owner withdraw/delete controls inside the real V1 app. TASK 15 consumes the approved V2-C/TASK 10 contracts; it does not redesign authorization, implement TASK 16, add native `<map>`, or create/deploy a production adapter.

## 2. TASK 14 approval record

Founder approval is recorded as `TASK_V2_14 = COMPLETE / HUMAN_APPROVED`. Its existing V1 host, state/cache/generation/cursor/stale/detail-race engine, frontend inventory, inheritance matrix and low-fi shell are accepted and were not rebuilt.

## 3. Frontend host assumption correction

The V2-D execution addendum and current truth now state:

- TASK 15 uses the real V1 page stack and creates no auth route;
- TASK 16 designs only inside the existing V1 navigation + `map-preview` context;
- TASK 17 replaces the synthetic surface with native map inside that host and has no route-integration duty;
- TASK 18 benchmarks the same formal host and creates no second benchmark page.

## 4. Formal host path

The sole formal map host remains `apps/client/miniprogram/pages/home/index` with `currentView === "map-preview"`, entered by the existing V1 **地图** button. `app.json` still registers only `pages/home/index` and `pages/bootstrap/index`. There is no second map page, hidden/dev route or release redirect.

## 5. Map browsing versus contribution authorization

The map tab branch initializes only `PublicMapClient`; it has no authorization-state check and never opens the authorization modal. Unaccepted, declined, dismissed, reauthorization-required, withdrawn or deleted contribution state does not block map browsing or V1 core functions.

## 6. Authorization placement

An active status/management card is placed at the top of the existing **我的 → 我上传的版面** owner surface. It does not auto-open. This placement is adjacent to uploaded-record ownership and destructive controls, avoids modal fatigue on map entry, and uses the existing page/back stack. No competing placement requires Founder resolution.

## 7. Authorization state machine

`PublicMapAuthorizationClient` explicitly models `UNKNOWN`, `NOT_ACCEPTED`, `PROMPT_ELIGIBLE`, `PROMPT_OPEN`, `ACCEPTING`, `ACCEPTED_CURRENT`, `DECLINED`, `DISMISSED`, `REAUTH_REQUIRED`, `WITHDRAWING`, `WITHDRAWN`, `DELETE_CONFIRMING`, `DELETING`, `DELETED`, and `ACTION_ERROR`. `DECLINED`, `WITHDRAWN`, and `DELETED` are distinct; withdraw and delete are separate commands.

## 8. Version and scope semantics

The service-issued presentation exposes `authorizationVersion`, `scopeDigest`, and the frozen current scope: eligible historical + future `DRAW_RECORD`/`UPLOAD_RECORD`, PublicLocation, eligible venue note, and safe contributor profile. It is one versioned authorization, not per-record consent. Same accepted version/digest cannot prompt again; a material version/digest change yields `REAUTH_REQUIRED` and does not silently expand the old acceptance.

## 9. Profile attribution disclosure

The prompt shows only safe player nickname/avatar attribution and explicitly excludes account/openid/private fileID. Missing Profile uses `ICHI 玩家` plus the existing ICHI default avatar. Profile completion and phone binding are absent from the gate and request.

## 10. Accept, decline and dismiss

Accept copies the exact service-issued version/digest and adds a stable idempotency key. Busy state prevents duplicate taps. Decline records no acceptance and leaves an explicit manual re-entry path. Dismiss means “not now,” never accept, and is not immediately promoted back to an automatic prompt.

## 11. Reauthorization

When the trusted service presents a different material version or scope digest, the UI says the authorization scope changed, preserves the old accepted identifiers for comparison, and requires explicit acceptance of the new pair before it becomes current.

## 12. Owner identity boundary

Client owner requests contain only `publicLeadId`, `commandId`, and `WITHDRAW`/`DELETE`. They contain no `ownerAccountId`, `isOwner`, trusted role, scope replacement, or server status. Capability and owner identity come from the injected trusted adapter. The local adapter is labelled `NOT_PRODUCTION_EVIDENCE`; production wiring remains TASK-V2-19/22.

## 13. Withdraw

Withdraw stops public applicability without describing account deletion or permanent data deletion. Success consumes the service's `publicHideIntent`, immediately suppresses the current map item, and shows visible feedback. Failure keeps the trusted capability and retries the same idempotent command ID.

## 14. Delete

Delete has a separate explicit second-confirmation modal, repeat-tap loading guard, accurate map-publication copy and a statement that the V1 local board is untouched. Success consumes `publicHideIntent` plus `noResurrection: true`, removes current public state and records the client deletion guard.

## 15. Hide-first

After a successful trusted command, `PublicMapVisibilityPort` synchronously removes the lead from current marker/list state, closes matching detail, and invalidates its public-only cache entries before user feedback. The UI never waits for unrelated cleanup while continuing to label that item public.

## 16. No-resurrection client guard

`PublicMapClient` owns session-local suppressed lead IDs and deleted-lead tombstones. Root and pagination commits filter suppressed IDs, detail selection rejects them, in-flight detail responses lose against the updated selection generation, and cache snapshots/details remove them. This protects client stale responses only; durable server truth remains a later production responsibility.

## 17. TASK 14 integration

No second map reducer/cache exists. TASK 15 extends the approved `PublicMapClient` and `PublicMapMemoryCache`; query identity, generation, retained data, opaque cursor, pagination ownership, selected detail and stable errors remain TASK 14 responsibilities. Removing one owner-controlled lead preserves unrelated query/list state.

## 18. V1 component reuse

Reused/adapted: **我的上传** page, subpage header/back stack, light-capsule card, modal layer/head, action/ghost/text/danger buttons, disabled/loading behavior, warning/destructive confirmation, toast feedback, status pill and default avatar. No independent visual system or new asset was added.

## 19. Tests

- `public-map-authorization-client.test.ts`: version/scope/idempotency, decline/dismiss/reauth, fallback profile, trusted capability, withdraw/delete/retry/identity/service errors.
- `public-map-client.test.ts`: deleted-lead root, pagination and late-detail anti-resurrection plus cache/state continuity.
- `index.v2-map-authorization.test.ts`: browsing independence, no forced prompt, sole host/no route, no Profile/phone gate, scope copy, V1-delete separation and V1 pattern reuse.
- TASK 15 targeted result: `3 files / 61 tests PASS`.
- TASK 14 regression result after extension: `2 files / 37 tests PASS`.

The semantic suite covers all 30 required execution-command scenarios, including retained V1 behavior through client/full regression.

## 20. V1 regression

Client suite: `24 files / 324 tests PASS`. Full workspace quality: `67 files / 692 tests PASS`. Playwright V1 web regression: `26/26 PASS`. Existing V1 fidelity assertions for exception cards/icons initially detected structural counting drift; TASK 15 now uses its own semantic wrapper classes while reusing the same styles, and the unchanged V1 assertions pass.

Per project policy, no automated browser visual inspection was performed; visual inspection remains user-owned.

## 21. Package/source-size impact

- TASK 14 mini-program source: `958,906 bytes`.
- TASK 15 result: `995,774 bytes`.
- TASK 15 delta: `+36,868 bytes`.
- 2 MiB gate: `PASS`, with `1,101,378 bytes` headroom.
- New dependencies/assets: `0`.

## 22. Runtime diff and production actions

Modified runtime:

- `apps/client/miniprogram/pages/home/index.ts`
- `apps/client/miniprogram/pages/home/index.wxml`
- `apps/client/miniprogram/pages/home/index.wxss`
- `platform/public-map-client.ts`
- `platform/public-map-cache.ts`

Added runtime:

- `platform/public-map-authorization-contract.ts`
- `platform/public-map-authorization-client.ts`
- `platform/public-map-authorization-synthetic-service.ts`

Added/extended tests and the two TASK 15 UX documents. `app.json`, native map/location, CloudBase functions/manifests, DB/index/resources, Storage/ACL, secrets, production configuration and Frozen R2 artifacts have no TASK 15 diff.

`commit/push/PR/merge/tag/deploy/publish/upload/migration/backfill/production DB-index-resource mutation/Storage-ACL mutation/production config-secret binding = NO`.

## 23. Validation and unresolved Founder decisions

- Prettier, ESLint, root+web TypeScript: `PASS`.
- Contracts/workflow validators: `PASS`.
- V1-F source preflight: `995,774 bytes / PASS`.
- Next.js 15.5.6 production build: `PASS`.
- Frozen R2 suite: `1 file / 16 tests PASS`.
- Frozen SHA read-back: Prompt `c083066c80999722a2e3207f64654c598e418daf1c51dba35d57abf0291a3462`; Schema `178c3fffb9ad74257ad6fb0123509beacbd011225eae2aa7eb2d648beb690722`; Resolver `46ffebadc3094412c4beb9c8625acdf83346b496e382fe40a48083ff101411d8`.
- Public/private leakage: request types and tests prove trusted owner/status fields are absent; public cache allowlist regression passes.
- Sole-route/current-state/production-scope checks and `git diff --check`: `PASS`.
- Unresolved Founder decisions: `0`.

## 24. Recommendation

Approve TASK-V2-15 after Founder review. Until explicit approval, retain:

- `TASK_V2_14 = COMPLETE / HUMAN_APPROVED`
- `TASK_V2_15 = IMPLEMENTATION_COMPLETE / AWAITING_FOUNDER_REVIEW`
- `V2_D = IN_PROGRESS / AWAITING_TASK_15_FOUNDER_REVIEW`
- `TASK_V2_16_TO_22 = LOCKED / NOT_STARTED`

Do not begin TASK-V2-16.
