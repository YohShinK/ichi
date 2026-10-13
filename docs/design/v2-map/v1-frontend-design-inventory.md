# V1 Frontend Design Inventory

> Status: `TASK-V2-14 / IMPLEMENTATION EVIDENCE`
>
> Source of truth: files under `apps/client/miniprogram`. This is a read-only inventory of the real V1 client, not an inferred style guide.

## Host and navigation finding

V1 already exposes the formal **地图** item in the custom bottom navigation. `onSelectTab` keeps the user on `pages/home/index` and switches `currentView` to `map-preview`; `app.json` does not register a second map page and has no native `tabBar`. TASK-V2-14 therefore replaces the placeholder content inside that existing view without changing the navigation relationship.

## Inventory

| # | Concern | Real file path / source | Reuse possibility for V2 map | Known constraint |
|---:|---|---|---|---|
| 1 | App page registration | `apps/client/miniprogram/app.json` → `pages/home/index`, `pages/bootstrap/index` | **REUSE** current registration | Do not add a second map page or native TabBar. |
| 2 | Main page composition | `apps/client/miniprogram/pages/home/index.wxml` → mutually exclusive `currentView` branches | **REUSE** `map-preview` branch as the V2 host | Only one branch should render; the large host page requires scoped state. |
| 3 | Map navigation | `index.wxml` → bottom-nav `data-tab="map"`; `index.ts` → `onSelectTab` | **REUSE** unchanged | Map is already a formal V1 navigation entry; no hidden route or redirect. |
| 4 | Share-to-tab navigation | `apps/client/miniprogram/platform/home-sharing.ts`; `index.ts` → `publicEntryView` | **REUSE** `tab=map` → `map-preview` | Share payload stays public and fixed; do not add private map query state. |
| 5 | Custom navigation style | `apps/client/miniprogram/pages/home/index.json` → `navigationStyle: custom` | **REUSE** | Page owns top safe-area and bottom navigation geometry. |
| 6 | Safe-area/capsule calculation | `index.ts` → `getTopSafePx`; `index.wxml` → `--top-safe-px` | **REUSE** | Must continue using WeChat window and menu-button metrics. |
| 7 | Page geometry | `index.wxss` → `.page`, `--page-gutter`, `--page-max-width`, `--bottom-clearance` | **REUSE** | Map content must fit above the fixed custom bottom nav. |
| 8 | Page background/typeface | `apps/client/miniprogram/app.wxss` → `page`, bundled Montserrat font | **REUSE** | Do not introduce a separate font or final V2 typography system. |
| 9 | Primary card/capsule | `index.wxss` → `.light-capsule`; broad use in `index.wxml` | **REUSE** for toolbar, rows, status, detail shell | Existing white rounded surface is broad, not a map-specific semantic component. |
| 10 | Hero radius | `index.wxss` → `--hero-radius`, `.import-hero`, `.state-card--hero` | **ADAPT** only for large state containers | Large radius is unsuitable for every compact map control. |
| 11 | Primary button | `index.wxss` → `.action-button`; `index.wxml` import/flow actions | **REUSE** for future primary map actions | TASK 14 needs retry/refresh more than final CTA hierarchy. |
| 12 | Secondary button | `index.wxss` → `.ghost-button` | **REUSE** for retry/load-more | Width is context-dependent; map shell adds scoped sizing only. |
| 13 | Circular icon button | `index.wxml/.wxss` → `.flow-back`, `.back-button`, camera side controls | **ADAPT** for refresh/close | Preserve at least 44px tap area; icon meaning must remain explicit with `aria-label`. |
| 14 | Custom bottom nav | `index.wxml` → `.bottom-nav`, `.nav-item`; `index.wxss` → active flex transition | **REUSE** unchanged | TASK 14 must not change item order, labels, or normal entry behavior. |
| 15 | Header pattern | `index.wxml/.wxss` → `.flow-header`, `.subpage-header`, `.flow-title` | **ADAPT** into compact map header | Map is a top-level tab, so it must not pretend to be a pushed subpage with a back button. |
| 16 | Typography hierarchy | `index.wxss` → `.flow-title`, `.card-title`, `.card-copy`, `.draft-kicker` | **ADAPT** using existing weight/size relationships | Exact map copy and final visual hierarchy remain replaceable. |
| 17 | Spacing rhythm | `index.wxss` → page gutter 16px; repeated 8/12/16/20/24px gaps | **REUSE** | Avoid dense controls below comfortable tap targets. |
| 18 | Border/shadow language | `index.wxss` → `.light-capsule`, `.action-button`, `.draft-card`, `.modal-card` | **ADAPT** neutrally | TASK 14 must not establish final marker/shadow artwork. |
| 19 | Icon system | `apps/client/miniprogram/assets/icons/*.svg` | **REUSE** map-pin, refresh, close and caret assets | Existing icons are raster/SVG assets, not a generalized icon component. |
| 20 | Logo/avatar fallback | `apps/client/miniprogram/assets/v1-29/ichi-avatar.png`; `index.ts` → `DEFAULT_ACCOUNT_AVATAR` | **REUSE** for synthetic contributor fallback | A private CloudBase avatar `fileID` must never enter public map state/cache. |
| 21 | Mascot illustrations | `apps/client/miniprogram/assets/v1-29/ichi-mascot-*.png` | **REUSE** only if later approved | Decorative map use is outside TASK 14. |
| 22 | Existing map artwork | `apps/client/miniprogram/assets/v1-29/map-placeholder.svg` | **REUSE** as synthetic surface watermark | It is a placeholder, not a native map or final visual. |
| 23 | Camera/background art | `ichi-camera-cutout.png`, `camera-corner-*.png` | **NO DIRECT REUSE** | Recognition-specific imagery has no map semantic. |
| 24 | Loading pattern | `index.wxml/.wxss` → `.recognizing-card`, progress ring/step states | **ADAPT** into a minimal map overlay spinner | Do not block or clear already-visible map data during refresh/pagination. |
| 25 | Empty state | `index.wxml/.wxss` → `.records-empty`, `.state-card` | **REUSE/ADAPT** | Empty must remain distinct from service/rate/schema failures. |
| 26 | Error state | `index.wxml/.wxss` → `.exception-card`, `.flow-error`, `.state-actions` | **ADAPT** into initial overlay and retained-data banner | Pagination/refresh errors must not replace existing data. |
| 27 | Modal/dialog shell | `index.wxml/.wxss` → `.modal-layer`, `.modal-card`, `.modal-head` | **REUSE** in later consent/detail tasks | TASK 14 detail is only a low-fi shell; no new blocking modal needed. |
| 28 | Toast behavior | `index.ts` → `wx.showToast`; `index.wxml/.wxss` → `.draw-toast` | **REUSE** for terse action feedback when needed | Stable service errors require persistent state, not transient toast-only feedback. |
| 29 | Record card | `index.wxml/.wxss` → `record-row` template, `.record-card`, `.record-row-card` | **ADAPT** into public map list rows | Public rows cannot reuse private record IDs or owner controls. |
| 30 | Profile presentation | `index.wxml/.wxss` → `.profile`, `.profile-avatar`, `.profile-copy` | **ADAPT** contributor avatar/name treatment | Contributor display is optional public projection; no Profile/login gate. |
| 31 | Destructive action UX | `index.wxml/.wxss` → `.swipe-delete`; `index.ts` delete handlers | **REUSE** only in owner-control task | Map browsing has no destructive action in TASK 14. |
| 32 | Confirmation flow | `index.ts` → `modalView`; `index.wxml` confirmation modal branches | **REUSE** later for withdraw/delete | Blocking overlays require explicit dismissal and safe-area clearance. |
| 33 | Pull-to-refresh convention | `index.wxml` → records `refresher-enabled`; `index.ts` → `onRecordsRefresherRefresh` | **ADAPT** conceptually; TASK 14 uses explicit refresh | Native map/pull gesture conflicts are deferred to TASK 17. |
| 34 | Scroll/state restoration | `apps/client/miniprogram/platform/navigation-state.ts`; `index.ts` → scroll memory | **ADAPT** for later map/list continuity | TASK 14 preserves current map client state per Page instance only. |
| 35 | Motion/transition | `index.wxss` → bottom-nav cubic-bezier, modal/toast keyframes, active states | **REUSE** tap feedback only | Complex map/sheet animation and final motion language are out of scope. |
| 36 | Accessibility/tap areas | `index.wxml` → `aria-label`, `aria-hidden`, `aria-live`, `role="button"`; 44–52px controls in WXSS | **REUSE** | Native mini-program accessibility support varies; semantic labels remain required. |
| 37 | Press/gesture handling | `index.wxml` → `hover-class`, touch/catchtap patterns; `index.ts` swipe suppression | **ADAPT** for filters/markers/close | Avoid duplicate requests and overlay tap-through. |
| 38 | Reusable WXML templates | `index.wxml` → `draft-card`, `record-row`, `prize-ticket` templates | **NO DIRECT REUSE** for map shell | Templates bind private/local record shapes; copying them would cross the public boundary. |
| 39 | Bootstrap page | `apps/client/miniprogram/pages/bootstrap/index.*` | **REUSE** unchanged | Silent Account bootstrap remains V1-owned; no explicit map login wall. |
| 40 | Regression evidence | `index.behavior.test.ts`, `index.fidelity.test.ts`, `index.v1-e.test.ts`, platform tests | **REUSE** as V1 regression suite | Static tests are necessary but not a substitute for user-owned visual inspection. |

## Inventory conclusion

The V2 state shell can reuse the existing host, navigation, safe-area geometry, core surface/button patterns, feedback semantics, assets, and accessibility conventions. Map markers, overlap indicators, freshness/opportunity badges, a map-specific detail surface, and native-map coordination have no complete V1 equivalent; TASK 14 therefore renders only neutral, replaceable placeholders for those elements.
