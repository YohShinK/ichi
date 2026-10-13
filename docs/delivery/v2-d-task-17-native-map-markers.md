# V2-D TASK 17 Native Map Cluster / Zoom Structural Rebuild

Date: 2026-09-20

## Status

`TASK_V2_17 = IN_PROGRESS / RUNTIME_INTERACTION_REFINEMENT_IMPLEMENTED / AWAITING_FOUNDER_RUNTIME_REVIEW`

The fixed-level implementation from 2026-09-19 is superseded. The local rebuild, automated regression, and one-session WeChat DevTools simulator review are complete. Founder true-device pinch/touch and final visual acceptance remain the human gate; TASK-V2-18 stays locked.

## Runtime interaction refinement

The remaining runtime defect was not another clustering-model issue. Native `regionchange` only guaranteed begin/end events, while the page read `getScale()` once at end. That left live pinch frames without presentation updates and let native camera settling finish after the page had already committed a stale width/topology. Split/merge was also driven by a fixed 220ms ghost rather than camera state.

The page now starts a 40ms read-only `MapContext.getScale()` sampler for both user gestures and atomic cluster camera commands. A bounded post-end settle tail catches the native camera's final scale. Every accepted frame updates continuous marker width, exact-scale footprint collision, and topology presentation without writing the bound map scale or issuing a public query.

`public-map-native-presentation.ts` derives directed transition progress from camera scale and interpolates Web Mercator screen coordinates with `origin + (target - origin) × progress`. Split frames represent the target children exactly once while they leave the parent position; merge frames represent the outgoing children exactly once while they gather. Reversal rolls back or rebases the session, and region generations reject stale end/tail callbacks.

The unexpected small brand icon was the required native marker `iconPath` (`ichi-avatar.png`) rendered at 1×1 beneath the custom callout. The binding now uses `alpha:0`; the approved code-drawn Marker card, top ICHI mascot, and Info Card remain unchanged.

One existing WeChat DevTools instance and the existing `task17` client verified the live chain. At scale 12 the page started with 3 views representing all 10 leads and a 60.44px right column. Atomic cluster navigation to scale 13 produced sampled frames at 60.59px, 62.85px, 65.51px, 66.99px, 67.78px, and 68.02px. Intermediate split positions moved away from the parent coordinate, while every sampled frame still represented exactly 10 leads; the settled output was 8 views. All native bindings reported `alpha=0`, custom callouts remained visible, and the extra avatar icon was absent.

The max-scale regression also passed: the settled scale-18 output retained both exact-overlap clusters, activating one produced two spider children with distinct display coordinates and the same real coordinate, and activating `lead-synthetic-002` opened only its existing Info Card. WXML/WXSS native compilation passed and the simulator console contained no error/warn/fail output. Runtime screenshots are `artifacts/task17-runtime-polish/initial-map.png` and `artifacts/task17-runtime-polish/final-map-spider.png`.

## Root causes replaced

- Full native marker/callout arrays were replaced around camera settle, while transition origins arrived asynchronously. This allowed missing, flashing, and late-appearing markers.
- Product-visible `LEVEL_0/1/2` and density bands changed topology and text discretely instead of following actual screen geometry.
- Cluster navigation combined bounds fitting with later forced scale writes, creating a second camera correction.
- Leaving the Map tab hid the native component through layout removal semantics, forcing costly native-layer revival.
- Exact-coordinate members escaped through a business chooser instead of remaining direct map objects.

## Structural model

`public-map-cluster-engine.ts` now projects every eligible public marker to Web Mercator world pixels at the exact settled scale. Collision uses the full current marker footprint, horizontal/vertical spacing, deterministic `publicLeadId` ordering, and an 8px history-based hysteresis margin. The output includes stable IDs, exact-overlap knowledge, an expansion-scale search, and a representation invariant that rejects missing or duplicate eligible leads.

`public-map-native-presentation.ts` keeps the left number block at 36px and continuously interpolates the right block from 48px to 96px. IP and discovery-tag strings remain present at every scale and are clipped by real width. Near overlaps dissolve automatically when footprints can coexist. Only a clicked unresolved cluster at maximum scale uses deterministic circle/spiral spiderfy; fan-out display coordinates never replace each child's real coordinates or identity.

`pages/home/index` sends one atomic cluster-center + target-scale camera command and uses generation cancellation for stale callbacks. The true-device repair removed the asynchronous `toScreenLocation` / left-top ghost path: split children are installed once at stable target bindings, merge children remain at stable source bindings, and intermediate screen motion is a custom-callout transform offset. A single in-flight `setData` plus latest-frame coalescing prevents camera samples from queuing native output; binding and view signatures ensure `mapNativeMarkers` is rewritten only at a real topology/display-coordinate boundary.

The overlap chooser, its state, its handler, and the “此位置有 N 个版面” UI are removed. A cluster activation never opens an Info Card. A normal marker or a spiderfied child opens the existing Info Card directly.

## Lifecycle and query behavior

- The native map remains mounted across tabs through `visibility`, `opacity`, and `pointer-events`, not `hidden` or `display:none`.
- The single map context, public client subscription, projection, and cache are reused.
- Leaving the Map tab clears transient spiderfy/transition state and immediately restores a settled non-spider projection without remounting the native map.
- Settled projection no longer removes eligible loaded leads through a stale viewport filter.
- Pure zoom-in and marker-width interpolation do not query. The existing 180ms viewport debounce queries only when the settled viewport exceeds the loaded bbox; TASK 14 latest-wins/cache/detail protections and TASK 15 authorization/withdraw/delete protections remain unchanged.

## WeChat DevTools runtime evidence

One existing WeChat DevTools instance and one `task17` automator client were used; no second IDE instance was launched.

- Initial Map entry at scale 12 produced 3 stable views representing all 10 eligible synthetic leads: clusters of 7 and 2 plus one leaf.
- Activating the 7-member cluster issued one camera target at scale 13. The settled projection became 8 views while still representing all 10 leads: near overlaps dissolved automatically and the two exact-coordinate pairs remained clustered.
- At scale 18, activating exact cluster `lead-synthetic-002|lead-synthetic-004` produced two spiderfied child markers. Their display coordinates differed while both retained real coordinate `31.2201, 121.492`.
- Activating the spider child opened only the existing Info Card for `lead-synthetic-002`; `mapCardPhase=OPEN`, `mapSheetMode=PREVIEW`.
- Tab exit/re-entry retained the map views and produced no simulator `error`, `warn`, or `fail` console output.
- Initial visual evidence is saved at `artifacts/task17-structural-rebuild/map-entry.png`.

Desktop automation does not certify true-device two-finger slow zoom, native touch dispatch, location permission branches, or final visual quality. Those remain Founder review items.

## Automated verification

- `corepack pnpm test`: 76 files, 837 tests passed
- `corepack pnpm lint`: passed
- `corepack pnpm typecheck`: passed
- `corepack pnpm validate:contracts`: passed, including workflow validation
- `corepack pnpm --filter @ichi/web build`: passed
- `node scripts/validate-v1f-release.mjs`: passed
- scoped Prettier: passed
- `git diff --check`: passed

## Explicit non-actions

No backend, Cloud Functions, DB, public contracts, production adapters, deployment, publish, commit, push, PR, merge, tag, or TASK-V2-18 work was performed.
