# TASK-V2-16-A Review Packet

> Status: `LOGIC_INTERACTION_COMPLETE / 16A_MAP_FIRST_REFINEMENT_COMPLETE / AWAITING_FOUNDER_STRUCTURAL_VISUAL_REVIEW`
>
> Canonical task: `TASK-V2-16 = IN_PROGRESS / 16A_LOGIC_COMPLETE / 16A_MAP_FIRST_REFINEMENT_COMPLETE / AWAITING_FOUNDER_STRUCTURAL_VISUAL_REVIEW`
>
> Block: `V2-D / IN_PROGRESS / AWAITING_TASK_16A_FOUNDER_STRUCTURAL_VISUAL_REVIEW`

> Historical failure evidence: [`v2-d-task-16a-mini-program-layout-root-cause-audit.md`](./v2-d-task-16a-mini-program-layout-root-cause-audit.md). Its `STRUCTURAL_VISUAL_GATE=FAIL` result is preserved as the before-state. The repair below passes the automated structural gate but does not self-approve the Founder visual gate.
>
> Downstream: `16-B / 16-C = NOT_STARTED`; `TASK-V2-17—22 = LOCKED / NOT_STARTED`

## 1. Scope

Implemented only TASK-V2-16-A: an interaction-complete, public-only, low-fi Map-based Discovery prototype in the real V1 mini-program. No 16-B handoff package, 16-C visual integration, TASK 17 native map/location, TASK 18 performance work or production adapter/resource work was started.

## 2. TASK 14/15 approval record

Founder approval is recorded as:

- `TASK_V2_14 = COMPLETE / HUMAN_APPROVED`
- `TASK_V2_15 = COMPLETE / HUMAN_APPROVED`

The implementation reuses TASK 14 query/generation/cursor/cache/stale/detail-race behavior and TASK 15 versioned authorization plus trusted owner withdraw/delete behavior.

## 3. Formal host

The sole host remains `apps/client/miniprogram/pages/home/index`, `currentView === "map-preview"`, entered by the existing V1 **地图** button through `onSelectTab`. `app.json` still contains only `pages/home/index` and `pages/bootstrap/index`. Second/hidden map route and release redirect: `NO`.

## 4. Low-fi/high-interaction principle

The result uses V1-compatible cards, plain text states, simple geometric markers and a synthetic map surface. Engineering effort is concentrated on complete IA, transitions, data binding, recovery and tests. It introduces no final palette, marker artwork, visual library, new asset, ornamental animation or external visual-AI dependency.

## 5. V1 inheritance

Reused/adapted: V1 page/tab relationship, title/header rhythm, bottom navigation, `light-capsule`, action/ghost/text/danger buttons, modal layer/head, loading/empty/error vocabulary, status disclosure, avatar asset, toast, My Uploads page stack and destructive confirmation. Map-only marker, overlap, mode switch, controls and sheet remain simple `NEW_REQUIRED` structures.

## 6. Page information architecture

The page contains header/refresh, area/location-placeholder shell, Opportunity/Freshness filters, map/list toggle, synthetic map and controls, marker/selected/overlap states, shared retained-data banners, nearby public-lead list/pagination, selected preview, expanded public-only detail, report entry, capability-gated owner entry, contribution-management link and non-realtime/non-recommendation disclosures.

## 7. Map/list model

A mode toggle is used because the mobile V1 host has limited height and persistent bottom navigation. Map and list use the same `PublicMapClient.items`, selected `publicLeadId`, filter, cache and error state. Toggling modes preserves selection and stored list scroll position. Marker/list selection enters one shared preview/detail path. Both modes expose pagination/recovery.

## 8. Marker states

Low-fi states cover default, selected, `DRAW_RECORD`, `UPLOAD_RECORD`, Opportunity variants, low-Freshness context, overlap count and unavailable/removed transition. Record type changes geometry/text only; Opportunity remains a neutral label. A selected outline identifies the exact lead owning preview/detail.

## 9. Selected preview

Selecting a marker/list row immediately sets sheet mode to `PREVIEW` and starts TASK 14 detail selection. Loading keeps the selected ID explicit. Loaded preview shows only board short label, record type, Opportunity, Freshness/observed time, total remaining summary, safe contributor/location, disclosure and one expand action; it does not overload the marker callout.

## 10. Bottom sheet/detail

Presentation modes are `CLOSED`, `PREVIEW`, `EXPANDED`; detail phases are `IDLE`, `LOADING`, `LOADED`, `ERROR`, `UNAVAILABLE`. Expanded back returns to preview. Preview close clears only selection, never query/filter/items. Detail unavailable shows its state while TASK 14 removes only the affected marker; owner success intentionally closes the sheet after hide-first.

## 11. Filter UX

Opportunity and the frozen `includeLowFreshness` capability are operable. Active count and clear/reset are visible. `createDiscoveryFilterQuery` creates canonical input for TASK 14 `changeQuery`, which gives a new identity/generation and null cursor while invalidating selection. No trust, verification, rights, internal-source, owner or other private filter exists.

## 12. Opportunity UX

Marker shows compact level; list/preview show neutral labels; expanded detail adds stable reason trace. Opportunity is independent from public eligibility, trust and guarantee. Prohibited recommendation/promotional copy is absent. Final color encoding remains undecided by design.

## 13. Freshness UX

Server Freshness appears per lead as band and observed time. Client cache stale appears as a separate page banner that explicitly states the distinction. The two can coexist and never collapse into one “updated time.”

## 14. RecordType UX

`DRAW_RECORD = 抽赏记录`; `UPLOAD_RECORD = 上传记录`. Synthetic fixtures and tests prove both `DRAW_RECORD + LOW` and `UPLOAD_RECORD + HIGH` are legal. Record type does not derive trust, eligibility or Opportunity/Freshness.

## 15. Overlap UX

The fixture contains two different `publicLeadId` values at one public position. The marker count opens a chooser listing each record; choosing one enters the normal selection flow. Coordinate equality is display metadata only and never merges identity, detail, owner capability or lifecycle.

## 16. Contributor/profile fallback

Expanded detail reads only public-safe `displayName/avatarUrl`. Missing/empty profile falls back to **ICHI 玩家** and the existing ICHI avatar; image `binderror` swaps to the same fallback. Avatar failure and Profile incompleteness never block browsing or detail.

## 17. Report entry

Expanded detail opens a V1-style synthetic report modal with four public categories and visible submitting/success/error/retry. Request fields are only `publicLeadId`, category, reason and action ID. Client does not decide or submit reporter eligibility, credible classification, moderator role, threshold or trusted moderation state.

## 18. Owner-control reuse

The page looks up the exact selected `publicLeadId` in TASK 15's trusted capability snapshot. Withdraw/delete appear only for capability-present records and call the existing TASK 15 client, visibility port and delete confirmation. It does not infer owner identity or build a second owner state machine.

## 19. Authorization discoverability observation

No authorization opens on map entry. A low-interference **管理我的地图贡献** link in expanded detail navigates to the existing **我的 → 我上传的版面** surface.

`FOUNDER_UX_OBSERVATION`: this affordance appears useful, but final wording/prominence should be reviewed before 16-C. It does not change versioned scope, add per-record consent or gate browsing. It is non-blocking and is not promoted to mandatory final design.

## 20. State/error coverage

The updated matrix maps `INITIAL_IDLE/LOADING`, `LOADED`, `EMPTY`, `INITIAL_ERROR`, `REFRESHING`, `PAGINATING`, `PAGINATION_ERROR`, `STALE_CACHE`, `RATE_LIMITED`, `SERVICE_UNAVAILABLE`, `SCHEMA_UNSUPPORTED`, `UNAUTHORIZED`, `CURSOR_RECOVERY` and every detail state to visible regions, controls, selection, retained map/list behavior and recovery. Refresh/retry/load-more/search-area remain distinct.

## 21. Interaction map

`docs/design/v2-map/v2-interaction-map.md` covers entry, initial load, marker/list/overlap selection, preview/expand/close, mode toggle and scroll retention, filters/reset, refresh, synthetic viewport/search, paginate/cursor recovery, stale, A/B selection race, report, owner withdraw/delete, contribution management and V1 tab away/return, including error and recovery paths.

## 22. Data binding

`docs/design/v2-map/v2-data-binding-map.md` maps every required public field to source, transform, null/fallback, interaction dependency and prohibited private fields. `presentPublicMarker` and `presentPublicDetail` concentrate the public presentation boundary. `null` uses explicit equality checks and never collapses into valid zero.

## 23. Tests

- TASK 16-A targeted: `3 files / 105 tests PASS` (minimum required: 44 scenarios).
- Combined TASK 14/15/16A map regression: `7 files / 170 tests PASS`.
- Presentation tests cover neutral copy, legal record combinations, overlap, filters, synthetic viewport, public allowlist and null/zero/avatar fallback.
- Report tests cover lifecycle, all categories, failures/retry, in-flight close guard, notifications and trusted-field absence.
- Page tests cover host/route, all required regions/handlers/states, map/list/scroll/selection, preview/detail separation, owner capability, no forced consent/Profile/native map/final visual and leakage boundaries.
- Existing TASK 14 tests continue to cover A/B race, refresh/pagination retained data, cursor recovery, query identity, unavailable removal and deleted-lead anti-resurrection.

## 24. V1 regression

Client suite: `27 files / 429 tests PASS`. Full workspace quality: `70 files / 797 tests PASS`. Next.js 15.5.6 production build: `PASS`. Final Playwright V1 web regression: `26/26 PASS`.

During validation, two earlier Playwright invocations exposed the pre-existing mouse-swipe gesture test as timing-sensitive; an isolated repeated run produced both pass/fail without any web-source diff. The final unchanged-source, single-worker full run passed all 26 cases. TASK 16-A changes no web runtime/test file.

Per project policy, no automated browser visual inspection was performed; visual review remains user-owned.

## 25. Package/source size

> Historical pre-map-first result; current figures are in section 33.

- TASK 15 accepted mini-program source: `995,774 bytes`.
- TASK 16-A result: `1,028,730 bytes`.
- Delta: `+32,956 bytes`.
- 2 MiB source gate: `PASS`, with `1,068,422 bytes` headroom.
- New runtime dependencies/assets: `0`.

## 26. No-native-map proof

Scoped source scan finds no native `<map>` in `apps/client/miniprogram`, and the map interaction methods contain no `wx.getLocation`, MapContext or real region-change binding. Existing V1 recognition location behavior outside the map branch is unchanged. `app.json` page registration is unchanged.

## 27. No-final-visual proof

Root/client dependency manifests have no TASK 16-A diff. No image, icon, font, component library, external visual-AI output, final color token or visual handoff package was added. CSS is simple V1-compatible low-fi structure. 16-B and 16-C remain `NOT_STARTED`.

## 28. Production/Git actions

Runtime files changed by 16-A:

- `apps/client/miniprogram/pages/home/index.ts`
- `apps/client/miniprogram/pages/home/index.wxml`
- `apps/client/miniprogram/pages/home/index.wxss`
- `apps/client/miniprogram/platform/public-map-synthetic-service.ts`

Runtime files added:

- `apps/client/miniprogram/platform/public-map-presentation.ts`
- `apps/client/miniprogram/platform/public-map-report-client.ts`

Tests added: `public-map-presentation.test.ts`, `public-map-report-client.test.ts`, `index.v2-map-discovery.test.ts`; TASK 14 synthetic end-to-end expectation was extended for the fourth legal fixture. Blueprint, Interaction Map, Data Binding Map, State Matrix and current-truth files were added/updated.

CloudBase functions/manifests, DB/index/resources, migrations, Storage/ACL, secrets, production configuration and Frozen R2 artifacts have no working-tree diff. `commit/push/PR/merge/tag/deploy/publish/upload/migration/backfill/production mutation = NO`.

## 29. Unresolved Founder decisions

Historical pre-map-first snapshot: `0`. Superseded by section 33: Founder structural visual acceptance and later public-contract decisions for keyword search/four synthetic-only labels remain unresolved.

## 30. Recommendation

Founder review may approve the repaired TASK-V2-16-A structure. Until then retain:

- `TASK_V2_16 = IN_PROGRESS / 16A_LOGIC_COMPLETE / 16A_LAYOUT_REPAIRED / AWAITING_FOUNDER_STRUCTURAL_VISUAL_REVIEW`
- `V2_D = IN_PROGRESS / AWAITING_TASK_16A_FOUNDER_STRUCTURAL_VISUAL_REVIEW`
- `TASK_V2_17_TO_22 = LOCKED / NOT_STARTED`

Do not begin 16-B until explicit Founder approval. Do not begin 16-C or TASK 17.

## 31. STRUCTURAL LAYOUT REPAIR

### Root causes repaired

- RC1: a scoped `map-control-button` reset now defeats WeChat's injected `184px` width and explicitly owns button box geometry without affecting V1 controls outside the map host.
- RC2: the fixed `min-height:190px; flex:0 0 190px` surface contract is removed.
- RC3: `map-content-stage` and the synthetic map surface use `flex:1 1 0; min-height:0`, making the map the sole remaining-height owner.
- RC4: preview/detail moved under the positioned `map-content-stage` and remains absolute/out of flow.
- RC5: no second window-height truth was added; the existing V1 `100vh + one top safe + one bottom safe/nav clearance` model is hardened locally with explicit flex/min-height contracts.

### Before/after computed geometry

Real WeChat DevTools RC `2.02.2607271`, base library `3.17.0`, iPhone 12/13 Pro simulator `390×844`:

| Box | Audit before | Repair after |
|---|---:|---:|
| Page border/content | `390×726` / `358×631` | unchanged |
| Header | `358×49` | `358×44` |
| Refresh | `181.633×44` | `44×44` |
| Toolbar | `358×256.5` | `358×96` |
| Location shell | `0×188.5` | `228×36` |
| Map/list switch | `376×38` | `100×38` |
| Map segment | `184×30` | `46×30` outer |
| Map surface | `358×190` | `358×475` |
| Marker | `184×38` | `44.55×32` |
| Bottom nav | `312×64 @ y=746`, safe bottom `34` | unchanged |
| Preview containing block | viewport | `map-content-stage` |

The repaired `631px` content height is fully allocated as `44 header + 96 control band + 16 gaps + 475 map`. Unallocated blank falls from `115.5px` to `0px`; map height grows by `285px` and is greater than header plus control band (`475 > 140`).

### Button reset and marker contract

The reset explicitly owns width/min/max, height/min-height, padding, margin, line-height, box sizing, display, border, background, font inheritance, flex shrink/grow and whitespace. Refresh is fixed at `44px`; switch segments at `46px`; filters are content-sized `46–148px`; markers are content-sized `42–72px × 32px`. The measured marker is `44.55×32`, clearly below both the leaked `184px` and ordinary CTA geometry. V1 `action-button`/`light-capsule` geometry is no longer used to size markers or compact controls.

### Map flex and toolbar compaction

`map-content-stage` is the only remaining-height owner. The surface grows inside it and no longer declares `190px`. The location control receives the row remainder through `flex:1 1 auto`, while a fixed `100px` switch leaves it `228px` on the current device. Toolbar content is a `36px` top row plus `30px` horizontal filter row, `8px` separation and `20px` total padding, yielding `96px` computed height.

### Sheet anchoring and viewport handling

Preview and expanded detail use `position:absolute` with `left/right/bottom:0` under the stage; expanded detail also uses `top:0`. Because the page content already ends `20px` above the fixed `64px` bottom nav and bottom safe inset, the sheet is not obscured and adds no duplicate safe-area/nav padding. Top safe remains the single `topSafePx=95px` page padding. No second `windowHeight` CSS variable or JS height calculation was introduced.

### Banner policy

No-data loading/empty/error remain content replacements. Retained-data status uses one `wx:if/wx:elif` chain: root error → pagination error → refresh/cursor recovery → stale cache → pagination progress. MAP uses a bounded maximum `56px` overlay; LIST uses one bounded row before its inner scroller. A single banner therefore cannot collapse or push the map.

### Device matrix

| Scenario | Calculated map height | Result |
|---|---:|---|
| Small iPhone `375×667`, safe `83/34` | `312px` | map-first / no core clipping |
| Dynamic Island iPhone `390×844`, safe `95/34` | `477px` model, `475px` real | map-first / no core clipping |
| Tall iPhone `430×932`, safe `95/34` | `565px` | grows with height |
| Common Android `393×873`, safe `68/24` | `543px` | map-first / no core clipping |
| Narrow Android `360×780`, safe `64/20` | `458px` | switch fits / location remains positive |

All five retain one bottom-nav reservation, compact switch/marker geometry, a stage-anchored sheet and a non-destructive one-banner overlay. LIST remains the inner vertical scroller; page scrolling stays disabled.

### Structural tests and logic regression

`index.v2-map-structural-layout.test.ts` adds 20 focused assertions covering the scoped reset, refresh/mode/filter/marker geometry, removal of fixed map height, positive stage/surface flex, non-zero location, switch bound, sheet containing block/out-of-flow behavior, single safe/nav accounting, inactive-state mounting, one-banner layout, small/tall viewport growth, LIST regression and no second route/native map.

TASK 16-A targeted run: `4 files / 125 tests PASS`, including all 20 structural tests. Combined TASK 14/15/16-A map regression: `8 files / 190 tests PASS`.

### Real structural visual evidence

- [A — MAP clean](../../artifacts/v2-d-task-16a-structural-layout-repair/A-map-clean.png)
- [B — selected preview](../../artifacts/v2-d-task-16a-structural-layout-repair/B-map-selected-preview.png)
- [C — expanded detail](../../artifacts/v2-d-task-16a-structural-layout-repair/C-map-expanded-detail.png)
- [D — overlap](../../artifacts/v2-d-task-16a-structural-layout-repair/D-map-overlap.png)
- [E — LIST](../../artifacts/v2-d-task-16a-structural-layout-repair/E-list.png)
- [F — stale retained data](../../artifacts/v2-d-task-16a-structural-layout-repair/F-stale-retained-data.png)

`AUTOMATED_MINIPROGRAM_SCREENSHOT=AVAILABLE`. These six files are real screenshots of the repaired page inside WeChat DevTools, not mockups. They satisfy evidence capture but not Founder approval.

### Source size, production actions and unresolved decisions

- Mini-program runtime source excluding tests: `1,032,193 bytes`; pre-repair `1,028,730 bytes`; delta `+3,463 bytes`.
- 2 MiB gate: `PASS`, headroom `1,064,959 bytes`.
- Runtime dependency delta: `0`; runtime asset delta: `0`. Review screenshots live outside the package.
- `commit/push/PR/merge/tag/deploy/publish/upload/migration/backfill/production resource/index/Storage/ACL/config/secret/exposure = NO`.
- Unresolved product decisions: `0`. Required remaining decision is Founder structural visual acceptance, not a new IA or semantic choice.

### Gate result

- `LOGIC_INTERACTION_GATE=PASS`
- `STRUCTURAL_LAYOUT_AUTOMATED_GATE=PASS`
- historical `STRUCTURAL_VISUAL_GATE=FAIL` preserved above
- `STRUCTURAL_VISUAL_FOUNDER_GATE=AWAITING_FOUNDER_REVIEW`
- `16-B / 16-C = LOCKED / NOT_STARTED`
- `TASK-V2-17—22 = LOCKED / NOT_STARTED`

## 32. Final Validation

| Gate | Result |
|---|---|
| Structural layout | `1 file / 20 tests PASS` |
| TASK 16-A targeted | `4 files / 125 tests PASS` |
| TASK 15 regression | `3 files / 61 tests PASS` |
| TASK 14 regression | `2 files / 37 tests PASS` |
| Combined map regression | `8 files / 190 tests PASS` |
| Client suite | `28 files / 449 tests PASS` |
| Full workspace Vitest | `71 files / 817 tests PASS` |
| V1 web Playwright | `26/26 PASS` (`.last-run.json`: `passed`, zero failed tests) |
| TypeScript / ESLint / Prettier | `PASS / PASS / PASS` |
| Next.js production build | `PASS` |
| V1-F preflight | `PASS`; `1,032,193` mini-program source bytes |
| Contracts / workflow | `PASS / PASS` |
| Public/private leakage | `PASS`; map render private-field hits=`0` and allowlist negative tests pass |
| Current-plan/task state | `PASS`; 22 canonical tasks, required state and downstream locks intact |
| Route / native map / final visual dependency | `PASS / PASS / PASS` |
| Frozen R2 | `1 file / 16 tests PASS`; all three SHA values unchanged |
| CloudBase production tree | unchanged aggregate `d4b48c89424b7feeaa5702905e5e6c58e8105b1d45bba9972a43faa265f8b077` |
| `git diff --check` | `PASS` |

One first TypeScript pass correctly rejected an unchecked device-matrix array index in the new test. The test received only explicit non-null assertions for its two fixed tuple positions; structural tests, strict TypeScript and the full suite then passed. No product/runtime behavior was changed by that correction.

Frozen R2 SHA-256 values:

```text
c083066c80999722a2e3207f64654c598e418daf1c51dba35d57abf0291a3462
178c3fffb9ad74257ad6fb0123509beacbd011225eae2aa7eb2d648beb690722
46ffebadc3094412c4beb9c8625acdf83346b496e382fe40a48083ff101411d8
```

Final gate state:

- `STRUCTURAL_LAYOUT_AUTOMATED_GATE=PASS`
- `STRUCTURAL_VISUAL_FOUNDER_GATE=AWAITING_FOUNDER_REVIEW`
- `TASK_V2_16 = IN_PROGRESS / 16A_LOGIC_COMPLETE / 16A_LAYOUT_REPAIRED / AWAITING_FOUNDER_STRUCTURAL_VISUAL_REVIEW`
- `16-B / 16-C = LOCKED / NOT_STARTED`
- `TASK_V2_17_TO_22 = LOCKED / NOT_STARTED`

## 33. FOUNDER MAP-FIRST DISCOVERY REFINEMENT

### Founder design direction and map-is-page principle

The existing V1 **地图** navigation still enters the one `pages/home/index` / `map-preview` host. The page now follows `MAP IS THE PAGE`: below the legal WeChat top-safe boundary, the synthetic map stage is the page-primary visual surface and continues to the content bottom behind the unchanged floating V1 Bottom Nav. Marker, right controls and sheet use one `--map-interactive-bottom-inset`; the map visual itself is not shortened by a second nav reservation.

Removed from product flow: the development kicker, large **好版地图** title, header refresh capsule, fixed **上海 / 当前浏览范围 / 合成数据** card, **移动地图**, **搜索此区域**, large toolbar card and central map load-more CTA.

### ICHI/search overlay and IP-search status

The compact top overlay reuses `/assets/v1-29/ichi-mascot-small.png` plus text `ICHI`. The long search capsule sits to its right and includes conditional clear `×`. Local matching normalizes Unicode, case, spacing and punctuation, supports substring/token lookup and deterministic one-edit approximate lookup, and only projects already-loaded public markers.

`IP_SEARCH_PUBLIC_CONTRACT_GAP=YES`. `PublicMarker.boardShortLabel` is public-safe, but V2-C has no keyword query field and no production pagination/search semantics. Synthetic aliases are explicitly fixture-only. No private P1, raw OCR, private board/evidence join or public-contract mutation was introduced.

### Positive discovery tags and derivation

| Visible tag | Status | `PUBLIC_DERIVATION_SOURCE` in 16-A |
|---|---|---|
| 更易包套 | `SYNTHETIC_ONLY / CONTRACT_GAP` | Explicit synthetic detail total/full-pack-cost fixture example; marker contract has no canonical tag |
| LAST 机会 | `SYNTHETIC_ONLY / CONTRACT_GAP` | Explicit synthetic assignment only; marker has no approved reason trace sufficient for this label |
| 大赏存量足 | `SYNTHETIC_ONLY / CONTRACT_GAP` | Explicit synthetic grand-prize-remaining fixture example; no marker field and no detail join |
| 大奖占比较高 | `SYNTHETIC_ONLY / CONTRACT_GAP` | Explicit synthetic ratio example; marker lacks approved numerator/denominator |
| 近期更新 | `SUPPORTED_BY_CURRENT_PUBLIC_CONTRACT` | `PublicMarker.freshness.band === RECENT` |

All selected is the default and means no tag restriction, including zero-tag leads. A partial selection uses inclusive OR; search composes with tags as AND; zero selected shows explicit **未选择筛选条件** and does not silently restore all. **全部恢复** keeps search text, and clearing search keeps tags. Copy avoids **中奖率高 / 建议抽 / 稳赚 / 容易中奖 / 推荐包套** and continues to state that historical observations are not current-inventory or purchase guarantees.

### Viewport, floating controls and mode placement

Synthetic map touch-end schedules `changeQuery` after a 180ms idle/debounce and preserves search/tags. The right floating stack is synthetic recenter above TASK 14 refresh; both are `44×44` and sit above the interactive bottom inset without entering normal flow. Recenter uses a replaceable `SyntheticMapLocationAdapter` with `READY/LOADING/PERMISSION_NEEDED/UNAVAILABLE`; there is no `wx.getLocation`. Refresh preserves current viewport/search/tags, starts a fresh root generation, retains visible data during request and uses existing stale/error recovery.

MAP/LIST remains available as an `88×32` compact segmented switch beside the horizontal filter strip. LIST retains its inner scroll and end pagination. Markers remain compact `42–68×32` map objects. The design fixture now contains 10 public markers, both record types, mixed Opportunity/Freshness, two overlap groups, multiple tags and one zero-tag lead. Selected preview and expanded public-only detail remain absolute, map-anchored sheets rather than document-flow cards.

### Founder visual evidence

All files below are original `532×1148` PNG screenshots created from the running project by WeChat Developer Tools RC `2.02.2607271` official simulator automation. They are not generated mockups or unrelated phone screenshots.

- [A — MAP default](../../artifacts/v2-d-task-16a-map-first-refinement/A-map-default.png)
- [B — Search active](../../artifacts/v2-d-task-16a-map-first-refinement/B-search-active.png)
- [C — Multi-filter active](../../artifacts/v2-d-task-16a-map-first-refinement/C-multi-filter-active.png)
- [D — Selected marker + preview](../../artifacts/v2-d-task-16a-map-first-refinement/D-selected-marker-preview.png)
- [E — Expanded detail](../../artifacts/v2-d-task-16a-map-first-refinement/E-expanded-detail.png)
- [F — Overlap](../../artifacts/v2-d-task-16a-map-first-refinement/F-overlap.png)
- [G — LIST mode](../../artifacts/v2-d-task-16a-map-first-refinement/G-list-mode.png)

### Tests, package and immutable scope

- New discovery prototype tests: `10`.
- New map-first page assertions: `19`; updated shell/discovery/structural suites cover the removed range UI, overlay geometry, search/filter composition, pan/recenter, bottom-nav inset, no native map and no second route.
- Mini-program runtime source excluding tests: `1,045,346 bytes`; structural-repair baseline `1,032,193`; delta `+13,153`; 2 MiB headroom `1,051,806`.
- Frozen R2 Prompt/Schema/Resolver hashes remain `c083066c… / 178c3fff… / 46ffebadc…`; production/Git actions remain `NO`.

Current validation: combined map regression `10 files / 228 tests PASS`; TASK 14 `2 / 37 PASS`; TASK 15 `3 / 61 PASS`; structural `1 / 20 PASS`; full workspace `73 / 855 PASS`; TypeScript, ESLint, scoped Prettier, Next.js build, workflow, V1-F source gate, WeChat WXML/WXSS compile and simulator console checks all pass. Two full V1 Playwright runs each passed 25/26 with only the pre-existing mouse-swipe timing test failing at different pointer-stability stages; its isolated repeated run passed `2/2`, and this task has no web-source diff.

### Unresolved Founder decisions and gate

Founder review is still required to accept or reject this structural direction. Production contract work must later decide whether keyword search becomes a server query capability and whether the four synthetic-only positive labels should be retained, renamed or dropped before defining approved public derivations. These gaps do not authorize 16-B, backend mutation or private-field joins.

- `LOGIC_INTERACTION_GATE=PASS`
- `STRUCTURAL_LAYOUT_AUTOMATED_GATE=PASS`
- `MAP_FIRST_LAYOUT_IMPLEMENTED=YES`
- `STRUCTURAL_VISUAL_FOUNDER_GATE=AWAITING_FOUNDER_REVIEW`
- `TASK_V2_16=IN_PROGRESS / 16A_LOGIC_COMPLETE / 16A_MAP_FIRST_REFINEMENT_COMPLETE / AWAITING_FOUNDER_STRUCTURAL_VISUAL_REVIEW`
- `16-B=LOCKED / NOT_STARTED`
- `16-C=LOCKED / NOT_STARTED`
- `TASK_V2_17_TO_22=LOCKED / NOT_STARTED`

## 34. FOUNDER TOP-SEARCH REFINEMENT

The existing V1 **地图** route and `pages/home/index` / `map-preview` host remain unchanged. The current 16-A Founder iteration:

- aligns the top overlay to the V1 recognition card's `top-safe` content edge;
- removes the white capsule, border and shadow from the mascot + `ICHI` brand lockup;
- enlarges the mascot and wordmark while narrowing the adjacent search capsule;
- adds the Phosphor Icons Regular `magnifying-glass` SVG as a leading search icon under the upstream MIT license; and
- changes no search behavior, route, state, public contract, native-map integration or production exposure.

Founder evidence: [top search and brand refinement](../../artifacts/v2-d-task-16a-founder-refinements/02-top-search-brand-refined.png), an original `532×1148` PNG from the running project in the official WeChat Developer Tools simulator.

Validation: map-first layout=`1 file / 19 tests PASS`; full workspace=`73 files / 855 tests PASS`; TypeScript, ESLint, scoped Prettier, Next.js build, workflow, V1-F source gate and official WeChat WXSS compile all pass. Current mini-program runtime source=`1,046,050 bytes`; production/Git actions=`NO`.

## 35. FOUNDER MAP-ONLY / SINGLE INFO CARD REFINEMENT

This section supersedes the earlier review-packet UI assumptions about MAP/LIST, preview/expanded detail, report modal and owner controls in the browsing card; it does not rewrite their historical evidence.

- The existing V1 map navigation and `pages/home/index` / `map-preview` host are unchanged. The visible product is now map-only.
- The exact filters are `LAST 机会`, `大厂存量足`, `大赏占比高`; base and selected states remain white/black, with selected ICHI magenta outline. Search/chip targets are 44/28px.
- The map uses `assets/v1-29/ichi-recognition-mascot.png`, pointed pins, a synthetic count marker and identity-preserving fan-out.
- Marker tap opens one full information card directly. Zero tiers are hidden, null tiers remain `未知`, the tier grid has two columns and LAST cost is bound only from canonical `fullPackCost`.
- Map contribution management and owner actions remain in “我的上传”. The report glyph is a nonfunctional placeholder; the earlier report modal is absent from the map UI.
- Public research and the low-fi recommendation are recorded in `docs/design/v2-map/v2-marker-overlap-pattern-research.md`.

Gate: `LOGIC_INTERACTION_GATE=PASS / MAP_ONLY_FOUNDER_REFINEMENT=IMPLEMENTED / MARKER_INFO_CARD_REFINEMENT=IMPLEMENTED`; structural automation and new Founder screenshots are recorded after final verification. Founder visual approval remains explicitly pending.

Official WeChat Developer Tools simulator evidence:

- [A — Default map](../../artifacts/v2-d-task-16a-founder-map-only/A-default-map.png)
- [B — Filters all selected](../../artifacts/v2-d-task-16a-founder-map-only/B-filters-all-selected.png)
- [C — Some filters deselected](../../artifacts/v2-d-task-16a-founder-map-only/C-some-filters-deselected.png)
- [D — Single marker + full info card](../../artifacts/v2-d-task-16a-founder-map-only/D-single-marker-info-card.png)
- [E — Multiple tier rows](../../artifacts/v2-d-task-16a-founder-map-only/E-multiple-tier-rows.png)
- [F — Zero tier hidden / null unknown](../../artifacts/v2-d-task-16a-founder-map-only/F-zero-tier-hidden-null-unknown.png)
- [G — Overlap fan-out](../../artifacts/v2-d-task-16a-founder-map-only/G-overlap-marker-fanout.png)

Computed geometry is search `210×44px` and first filter `83.6015625×28px`. Validation: targeted 16-A `6/87`, TASK 14/15/report regression `4/79`, full workspace `73/793`, Frozen R2 assertion `1/16`, TypeScript, ESLint, scoped Prettier, Next.js build, workflow, V1-F, official WXML/WXSS compile, simulator console and diff check all pass. Runtime source is `1,040,951 bytes` (`-5,099` from `1,046,050`; 2 MiB headroom `1,056,201`).

- `STRUCTURAL_LAYOUT_AUTOMATED_GATE=PASS`
- `STRUCTURAL_VISUAL_FOUNDER_GATE=AWAITING_FOUNDER_REVIEW`
- `TASK_V2_16=IN_PROGRESS / 16A_LOGIC_COMPLETE / 16A_FOUNDER_UI_REFINEMENT_COMPLETE / AWAITING_FOUNDER_STRUCTURAL_VISUAL_REVIEW`
- `16-B / 16-C / TASK_V2_17_TO_22=LOCKED / NOT_STARTED`
