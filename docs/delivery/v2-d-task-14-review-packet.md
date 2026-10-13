# TASK-V2-14 Review Packet

> Status: `COMPLETE / HUMAN_APPROVED`
>
> Founder decision recorded: `2026-09-13`
>
> Downstream snapshot at approval: `TASK-V2-15 / READY / NOT_STARTED`; later status is governed by current `progress.md`.

## 1. TASK 14 scope

Implemented the public map client state engine and a low-fi, interaction-complete shell for query identity, request races, opaque cursors, pagination, public-only memory cache, stale disclosure, refresh continuity, stable service errors, and detail-selection races. No TASK 15 behavior, final visual system, native map/location, production API, or release action is included.

## 2. Current V1 host path

The formal host is the existing `apps/client/miniprogram/pages/home/index` page, specifically `currentView === 'map-preview'`. The existing custom **地图** button still calls `onSelectTab`, sets `activeTab="map"`, and enters `map-preview`. `app.json` remains unchanged with only `pages/home/index` and `pages/bootstrap/index`.

## 3. Spike role

`spikes/v2-a-map-device/` remains `TECHNICAL_SPIKE_ONLY`. It was not used as product truth and was not modified by TASK 14.

## 4. Hidden/dev route strategy

None. The Founder superseded the execution command's earlier hidden/dev-route allowance: TASK 14 reuses the existing formal V1 map host and must not add another route/page or a release redirect. A local build containing this branch can naturally enter the page through the existing map button. The branch is not deployed; actual exposure, pilot and release control remain TASK-V2-21/22 responsibilities.

## 5. V1 Frontend Design Inventory summary

`docs/design/v2-map/v1-frontend-design-inventory.md` records 40 code-backed items across routing, navigation, safe area, layout, cards, buttons, modal/toast, loading/empty/error, typography, spacing, assets, record/Profile/destructive/share patterns, motion and accessibility. Each row includes a real path/source, reuse possibility and constraint.

## 6. V1→V2 inheritance summary

`docs/design/v2-map/v1-to-v2-design-inheritance.md` classifies 30 required V2 elements as `REUSE`, `ADAPT` or `NEW_REQUIRED`. The host, navigation, surface/button patterns, avatar fallback and feedback conventions are reused/adapted; markers, overlap, stale disclosure, map detail and map/list controls remain low-fi new placeholders.

## 7. Page structural skeleton

The existing map branch contains:

1. V1-compatible header and explicit 44px refresh;
2. static city/location shell;
3. opportunity filter capsules;
4. existing map artwork as a labelled synthetic surface;
5. synthetic marker/selected/overlap placeholders;
6. initial loading, empty and initial error overlays;
7. retained-data stale/error banners;
8. public lead list, pagination progress/error/retry and load-more;
9. selected-lead detail loading/success/error/unavailable shell;
10. non-realtime/non-recommendation disclosure.

Full hierarchy: `docs/design/v2-map/v2-map-page-structural-skeleton.md`.

## 8. State machine

Root phases: `INITIAL_IDLE`, `INITIAL_LOADING`, `LOADED`, `EMPTY`, `INITIAL_ERROR`, `REFRESHING`, `PAGINATING`, `PAGINATION_ERROR`, `STALE_CACHE`, `RATE_LIMITED`, `SERVICE_UNAVAILABLE`, `SCHEMA_UNSUPPORTED`, `UNAUTHORIZED`, `CURSOR_RECOVERY`.

Detail phases: `IDLE`, `LOADING`, `LOADED`, `ERROR`, `UNAVAILABLE`.

The transition matrix is in `docs/design/v2-map/v2-state-matrix.md`; implementation is `platform/public-map-client.ts`.

## 9. Query identity

The identity is deterministic JSON over the normalized bbox (6 decimal places), zoom (2 decimals), mode, canonical Opportunity order, low-Freshness flag, and deduplicated/sorted supported schema versions. The opaque cursor and generation are intentionally excluded; generation is separately monotonic.

## 10. Generation model

Every root load/query change/filter/refresh/retry/identity recovery/cursor recovery increments root generation. A response commits only if captured generation and query identity still match. Pagination additionally checks current request ID and exact cursor. Detail has an independent monotonic selection generation plus selected `publicLeadId`. These guards implement latest-request/selection-wins.

## 11. Cursor rules

The client stores and forwards `nextCursor` byte-for-byte only within the same current query snapshot. It never parses or changes the cursor and never includes it in query identity. Root operations always request `cursor=null` and clear current pagination eligibility. Cache expiry also nulls the cursor.

## 12. Cache rules

`PublicMapMemoryCache` is runtime-memory-only, namespaced by canonical query identity, with a 120-second default TTL. It stores explicit allowlist clones of public markers/details, server `asOf`, schema, public versions/Freshness, client cache time and a live opaque cursor. It does not store private identity, Verification, Rights, moderation evidence, raw ObservationLocation, private avatar `fileID`, trusted server context or secrets.

## 13. Stale rules

Server Freshness remains the serializer-provided `observedAt`, `band`, `freshnessAsOf` and policy version. Client cache stale is separately computed from client cache age. A stale snapshot remains browsable, visibly disclosed, and has no cursor. Client staleness never rewrites server Freshness.

## 14. Refresh rules

Refresh creates a new root generation and a fresh first-page request with null cursor and null `asOf`. It does not clear existing public data. Success replaces the snapshot; failure retains data, sets `STALE_CACHE`, exposes the stable error and allows retry.

## 15. Pagination rules

Pagination stays within the current root generation/query identity and uses the current opaque cursor plus server `asOf`. One page request may be active. Success appends/deduplicates by `publicLeadId`; failure enters `PAGINATION_ERROR` and retains all loaded markers/rows. Invalid/expired cursors are discarded and trigger a fresh first page.

## 16. Detail race guard

Selecting or closing a lead advances `selectionGeneration`. Only the response matching both the current generation and selected `publicLeadId` may commit. `LEAD_UNAVAILABLE` invalidates its safe detail cache entry, removes the public marker and clears selection without affecting other leads.

## 17. Error mapping

All canonical errors have visible feedback and explicit recovery: `INVALID_REQUEST` → retry; `INVALID_VIEWPORT` → fresh query; `UNAUTHORIZED` → trusted silent Account recovery; `RATE_LIMITED` → retry-after; `CURSOR_INVALID/EXPIRED` → fresh first page; `LEAD_UNAVAILABLE` → dismiss/invalidate; `SCHEMA_UNSUPPORTED` → visible no-silent-fallback state; `SERVICE_UNAVAILABLE` → retry. Initial errors, empty, retained-data stale, pagination errors and detail errors stay distinct.

## 18. Public/private client boundary

The client mirrors the current V2-C-derived `public-map-v2` request/response shapes. `public-map-v2` is the Founder-authorized additive marker summary expansion that exposes deterministic `totalRemaining`; state/cache writes still use explicit allowlist clones. Tests inject runtime `ownerAccountId` and `avatarFileId` extras and prove they are discarded. No direct private collection read, client eligibility/Verification/Rights calculation, raw location or private `fileID` join exists.

## 19. Tests added

- `platform/public-map-client.test.ts`: 30 semantic state/race/cache/error cases (parameterized assertions expand the targeted run).
- `pages/home/index.v2-map-shell.test.ts`: 4 host/navigation/no-native-map/structural tests.
- Targeted TASK 14 result: `2 files / 34 tests PASS`.
- Client suite: `22 files / 293 tests PASS`.
- Full workspace quality: `65 files / 661 tests PASS` plus formatting, ESLint, dual TypeScript and contract/workflow validators.

Coverage includes all 26 required execution-command scenarios, adjusted so route safety asserts that no second map page/TabBar/dev guard exists and the original V1 map navigation remains the sole host.

## 20. V1 regression

All client tests pass. An initial change removed the historical `.map-watermark` fidelity selector; the existing V1 regression caught it. The implementation now preserves the V1 asset, class and `opacity: 0.36` contract while adding the synthetic shell. Map-tab/share routing and `app.json` page registration are unchanged.

Per project guidance, no automated browser visual inspection was performed; visual inspection remains user-owned. The Next.js production build passed.

## 21. Package/source-size impact

- Baseline V1 mini-program source: `908,347 bytes`.
- TASK 14 result: `958,906 bytes`.
- Delta: `+50,559 bytes`.
- 2 MiB source gate: `PASS` with `1,138,246 bytes` headroom.
- New dependencies/assets: `0`; existing `map-placeholder.svg` and icons are reused.

## 22. Runtime diff

Modified existing runtime host:

- `apps/client/miniprogram/pages/home/index.ts`
- `apps/client/miniprogram/pages/home/index.wxml`
- `apps/client/miniprogram/pages/home/index.wxss`

Added client runtime modules:

- `platform/public-map-contract.ts`
- `platform/public-map-query.ts`
- `platform/public-map-cache.ts`
- `platform/public-map-client.ts`
- `platform/public-map-synthetic-service.ts`

Added tests/design/review evidence and updated current truth. `app.json`, spike, CloudBase, DB/index/resource, Storage/ACL, secrets and Frozen R2 artifacts have no TASK 14 runtime diff.

## 23. Production actions

`commit/push/PR/merge/tag/deploy/publish/upload/migration/backfill/production DB-index-resource mutation/Storage-ACL mutation/production config-secret binding = NO`.

## 24. Unresolved Founder decisions

None required to accept TASK 14 implementation. Final visual design, native map/location behavior, production adapter/resource wiring and release/pilot exposure are intentionally owned by later locked tasks, not unresolved TASK 14 blockers.

## 25. Recommendation

Founder approved TASK-V2-14. The accepted implementation is now `TASK-V2-14 = COMPLETE / HUMAN_APPROVED`; downstream state is governed by the current implementation plan and `progress.md`.

## Verification record

- TASK 14 targeted: `2 files / 34 tests PASS`.
- Client regression: `22 files / 293 tests PASS`.
- Full quality: `65 files / 661 tests PASS`.
- TypeScript: root + web `PASS`.
- ESLint: `PASS`.
- Prettier: `PASS`.
- Contracts/workflow: `PASS`.
- V1-F source preflight: `958,906 bytes / PASS`.
- Next.js 15.5.6 production build: `PASS`.
- Frozen R2 suite: `1 file / 16 tests PASS`.
- Frozen SHA read-back:
  - Prompt `c083066c80999722a2e3207f64654c598e418daf1c51dba35d57abf0291a3462`.
  - Schema `178c3fffb9ad74257ad6fb0123509beacbd011225eae2aa7eb2d648beb690722`.
  - Resolver `46ffebadc3094412c4beb9c8625acdf83346b496e382fe40a48083ff101411d8`.
- Public/private leakage tests: `PASS`, forbidden runtime extras discarded; forbidden cache keys absent.
- `git diff --check`: `PASS`.
