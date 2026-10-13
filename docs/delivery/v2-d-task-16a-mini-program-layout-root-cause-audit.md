# TASK-V2-16A Mini Program Spatial Layout Root-Cause Audit

> Audit date: 2026-09-13
>
> Runtime host: `apps/client/miniprogram/pages/home/index` / `map-preview`
>
> Result: `IN_PROGRESS / 16A_LOGIC_COMPLETE / STRUCTURAL_VISUAL_REWORK_REQUIRED / LAYOUT_ROOT_CAUSE_AUDIT_COMPLETE`

## 1. Audit scope

This is a diagnostic-only audit of the existing V1 **地图** tab and its single `pages/home/index` / `map-preview` host. It inspected the real WXML, WXSS, TypeScript, page configuration, shared V1 shell, fixed bottom navigation, safe-area calculation, state branches and the live WeChat DevTools render. It did not redesign or repair the UI, add a page or route, start native `<map>`, or enter TASK-V2-16-B.

Evidence sources:

- `apps/client/miniprogram/pages/home/index.wxml`
- `apps/client/miniprogram/pages/home/index.wxss`
- `apps/client/miniprogram/pages/home/index.ts`
- `apps/client/miniprogram/pages/home/index.json`
- `apps/client/miniprogram/app.json`
- WeChat DevTools RC `2.02.2607271`, base library `3.17.0`, current `iPhone 12/13 (Pro)` simulator
- WeChat DevTools WXML inspector computed boxes on the current V2 page
- WeChat official [`scroll-view`](https://developers.weixin.qq.com/miniprogram/dev/component/scroll-view.html), [`getWindowInfo`](https://developers.weixin.qq.com/miniprogram/dev/api/base/system/wx.getWindowInfo.html), and [WXSS unit](https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxss.html) documentation

The two unrelated phone images found in Downloads were explicitly excluded from evidence. The Founder screenshot symptom mapping below uses the actual V2 page visible in WeChat DevTools.

## 2. Current 16-A gate status

```text
TASK_V2_14 = COMPLETE / HUMAN_APPROVED
TASK_V2_15 = COMPLETE / HUMAN_APPROVED

TASK_V2_16 =
IN_PROGRESS /
16A_LOGIC_COMPLETE /
STRUCTURAL_VISUAL_REWORK_REQUIRED /
LAYOUT_ROOT_CAUSE_AUDIT_COMPLETE

16-B = LOCKED / NOT_STARTED
16-C = LOCKED / NOT_STARTED
TASK_V2_17_TO_22 = LOCKED / NOT_STARTED

LOGIC_INTERACTION_GATE = PASS
STRUCTURAL_VISUAL_GATE = FAIL
```

The existing semantic tests remain evidence for state and interaction behavior only. They do not prove spatial layout correctness.

## 3. Mini Program vertical space budget

### Observed simulator geometry

The live WXML inspector reported the following logical-pixel boxes for the current `390 × 844` simulator:

| Box | Computed geometry | Source / explanation |
| --- | ---: | --- |
| `app-shell` | `390 × 844` | `height: 100vh` |
| `--top-safe-px` | `95px` | menu capsule bottom `83px + 12px` |
| `.page.page--map` border box | `390 × 726` | `844 - (34 safe bottom + 64 nav + 20 clearance)` |
| `.page.page--map` content box | `358 × 631` | border box minus `95px` top and `16px` horizontal padding |
| `.map-shell-header` | `358 × 49` | normal-flow header |
| `.map-refresh-button` | `181.633 × 44` | intended `44 × 44`; native button width wins and flex only slightly shrinks it |
| `.map-toolbar` | `358 × 256.5` | content `334 × 232.5` plus `12px` padding on both axes |
| `.map-toolbar-top` | `334 × 188.5` | unexpectedly tall flex row |
| `.map-location-shell` | `0 × 188.5` | squeezed to zero width by the oversized mode switch; its content wraps vertically |
| `.map-mode-switch` | `376 × 38` | two native `184px` buttons plus padding/border; exceeds the `334px` toolbar content width |
| each mode button | `184 × 30` | injected `wx-button:not([size=mini]) { width: 184px }` |
| `.map-filter-scroll` | `334 × 34` + `10px` top margin | correctly auto-sized by horizontal content; not the blank-card cause |
| `.map-surface-placeholder` | `358 × 190` | fixed by `min-height: 190px; flex: 0 0 190px` |
| `.synthetic-marker` | `184 × 38` | intended minimum `52px`; injected native button width remains active |
| `.bottom-nav` | `312 × 64`, top `746`, bottom inset `34` | fixed, `80%` of 390, safe-bottom anchored |

### MINI_PROGRAM_VERTICAL_SPACE_BUDGET

| Item | Current definition | Unit / flow | Repeated? | Viewport behavior | Consequence |
| --- | --- | --- | --- | --- | --- |
| Status bar | Included in `getTopSafePx()` maximum | runtime `px` | No separate second subtraction | device-dependent | protected once inside the 95px top reserve |
| Capsule/navigation reserve | `menuButton.bottom + 12` | runtime `px` | No | grows with device capsule position | current observed reserve is 95px |
| Page header/title | natural content; observed 49px | auto / normal flow | No | mostly fixed | consumes 49px before toolbar |
| Refresh control | source says `44px`; observed width 181.633px, height 44px | fixed `px` / normal-flow child | No | width collides with title | produces the oversized white refresh capsule and horizontal pressure |
| Location + map/list row | intended auto row; observed 188.5px tall | auto / flex | No | broken on ordinary phone widths | primary source of the giant toolbar card |
| Filter area | `34px` controls, `10px` top margin | fixed `px` / horizontal `scroll-view` | No | height stable | consumes 44px; filter button widths are also inflated by native button defaults |
| Toolbar padding | `12px` top and bottom | fixed `px` | No | stable | adds 24px; not sufficient alone to explain the blank card |
| Map surface | `min-height:190px; flex:0 0 190px` | fixed `px` / normal flow | No | never grows on tall screens | map is not the main area |
| Preview/detail reserve | preview `min-height:118px`, absolute; expanded top/bottom absolute | overlay, not normal flow | No page-flow reserve | viewport-anchored, not map-anchored | does not shrink map, but weakens map/sheet hierarchy |
| Bottom nav | `64px`, `position:fixed` | fixed `px` | once | stable | page removes 64px exactly once |
| Bottom safe area | `env(safe-area-inset-bottom)`; observed 34px | environment `px` | once for page; repeated as inner expanded-sheet padding | device-dependent | page accounting is correct; expanded detail has extra internal safe padding |
| Extra nav clearance | `20px` | fixed `px` | once | stable | intentional blank strip between page end and nav top |
| Page horizontal padding | `16px + 16px` | fixed `px` | No | narrows all flex rows | worsens the 376px switch collision |
| Page vertical gaps | `10px` between direct flex children | fixed `px` | once per mounted sibling | increases with banners | base MAP state uses 20px for three siblings |
| Hidden/inactive items | mostly removed by `wx:if`; camera canvas fixed offscreen at `1×1` | out of flow | No | none | no material invisible occupancy |
| State banners | `min-height:40px`, conditional normal-flow siblings | fixed minimum / normal flow | only when mounted | adds 50px including a flex gap | clips/squeezes the available composition further because the map will not shrink or grow |

For this host, the usable page content height is:

```text
PAGE_BORDER_HEIGHT
= WINDOW_HEIGHT - BOTTOM_SAFE - V1_NAV - EXTRA_NAV_CLEARANCE
= 844 - 34 - 64 - 20
= 726px

AVAILABLE_CONTENT_HEIGHT
= PAGE_BORDER_HEIGHT - TOP_SYSTEM_RESERVED
= 726 - 95
= 631px
```

In the currently observed clean MAP state:

```text
CURRENT_FLOW_USE
= HEADER + BROKEN_TOOLBAR + TWO_GAPS + FIXED_MAP
= 49 + 256.5 + 20 + 190
= 515.5px

UNALLOCATED_CONTENT_HEIGHT
= 631 - 515.5
= 115.5px
```

The intended compact toolbar height implied by its own declared controls is `38 + 10 + 34 + 24 = 106px`. If the map filled the remaining area, its theoretical height would be:

```text
THEORETICAL_MAP_HEIGHT
= 631 - HEADER_49 - COMPACT_TOOLBAR_106 - TWO_GAPS_20
= 456px

ACTUAL_MAP_HEIGHT = 190px
DEFICIT = 456 - 190 = 266px
```

The 266px deficit decomposes into approximately `150.5px` of toolbar inflation (`256.5 - 106`) plus `115.5px` of unallocated free space caused by `flex-grow:0`. The remaining rounding difference is zero at the inspector precision shown.

## 4. Unit usage audit

The complete map-related WXSS block (`index.wxss` lines 910–1580) contains:

| Token/property | Count |
| --- | ---: |
| `rpx` | 0 |
| `px` numeric uses | 179 |
| `vh` | 0 inside map block; 2 shell uses outside it (`100vh`) |
| `vw` | 0 inside map block |
| `%` numeric uses | 17 |
| `calc()` | 2 inside map block |
| `min-height` | 10 |
| `max-height` | 0 |
| `height` | 17 |
| `padding*` | 22 |
| `margin*` | 12 |
| `gap` | 19 |
| physical `top/right/bottom/left` | 20 |
| `flex*` declarations | 14 |
| `overflow*` | 3 |

Repository-wide `index.wxss` contains `0 rpx`, `1018 px`, `12 vh`, `3 vw`, and `173 %` numeric uses. Therefore the current failure is not caused by vertical `rpx` scaling.

### UNIT_RISK_TABLE

| File | Selector | Property | Current value | Risk | Actual consequence |
| --- | --- | --- | --- | --- | --- |
| `index.wxss` | `.app-shell` | `height` | `100vh` | MEDIUM | imports a browser-style viewport assumption instead of binding the shell to the actual `getWindowInfo().windowHeight`; observed simulator is consistent, cross-runtime behavior is not explicitly modeled |
| `index.wxss` | `.page` | `height` | `calc(100vh - bottom clearance)` | MEDIUM | combines CSS viewport with JS top inset and environment bottom inset across two systems |
| `index.wxss` + injected component style | all non-mini buttons | `width` | injected `184px` | CRITICAL | overrides or survives map control sizing, inflating refresh, switch, filters and markers |
| `index.wxss` | `.map-refresh-button` | `width` | declared `44px`, observed `181.633px` | CRITICAL | refresh capsule becomes a large pill and crowds the title |
| `index.wxss` | `.map-mode-switch button` | `min-width` only | `46px`; observed width `184px` | CRITICAL | switch becomes 376px wide inside 334px, crushing the location button |
| `index.wxss` | `.map-location-shell` | `min-width` | `0` with no owned width/flex rule | CRITICAL | flex shrink collapses it to 0px; wrapped children make the row 188.5px tall |
| `index.wxss` | `.map-filter` | `min-width` only | `64px` | HIGH | native 184px width remains; chips behave like large CTAs in horizontal scroll |
| `index.wxss` | `.map-surface-placeholder` | `min-height`, `flex` | `190px`, `0 0 190px` | CRITICAL | hard caps the main visual area and disables growth |
| `index.wxss` | `.synthetic-marker` | `min-width`, `height` | `52px`, `38px`; observed `184×38` | CRITICAL | markers render as CTA-sized pills |
| `index.wxss` | `.map-detail-shell` | absolute edges | viewport-relative because no positioned map/page ancestor | HIGH | sheet is not anchored to the map surface and can sit behind the fixed nav |
| `index.wxss` | `.map-detail-expanded` | `height` | `100%` | MEDIUM | depends on the absolute sheet having a definite content box; padding/safe inset can create internal overflow |
| `index.wxss` | `.map-list-shell` | `min-height`, `flex` | `0`, `1 1 auto` | LOW | this is the correct constrained-scroll pattern for LIST mode |
| `index.wxss` | `.map-filter-scroll` | no explicit height | observed `34px` | LOW | horizontal scroll auto-sizes correctly in the inspected render; it is not the giant-card cause |

No percentage height has an indeterminate parent in the base MAP surface: the watermark's `height:100%` resolves against the fixed 190px surface. The expanded detail's `height:100%` is a separate sheet risk, not the base-page collapse.

## 5. Safe-area/capsule accounting

`pages/home/index.json` sets `navigationStyle: custom` and `disableScroll: true`; therefore the home page does not also render the native navigation bar. V1's shared `getTopSafePx()` returns:

```text
max(40, statusBarHeight, safeArea.top, menuButton.bottom + 12)
```

The root exports the result once as `--top-safe-px`; `.page` consumes it once as top padding. In the inspected simulator it is `95px`, matching the previously recorded `menuButton.bottom=83 + 12` behavior.

**Top double reservation: NO.** TASK 16-A did not add a second safe-area margin or fixed navigation height. The perceived excessive top is `95px` legitimate V1 capsule reserve followed by a normal-flow 49px map header, made visually heavier by the refresh button's native 184px width leak. Dynamic Island devices increase the single reserve, so the fixed content below becomes proportionally more costly, but it is not counted twice.

The implementation does not use `screenHeight` or `windowHeight` when calculating CSS height. That is a modeling weakness: `getWindowInfo()` is used only for top metrics, while the page itself uses `100vh` and `env()`.

## 6. Bottom-nav accounting

### BOTTOM_NAV_SPACE_ACCOUNTING

| Layer | Definition | Observed | Count |
| --- | --- | ---: | ---: |
| fixed V1 nav | `height:64px; bottom:safe-bottom` | y=746–810 | 1 |
| bottom safe area | `env(safe-area-inset-bottom)` | 34px | 1 |
| deliberate separation | extra `20px` in `--bottom-clearance` | y=726–746 | 1 |
| map page height | subtracts all three above | 726px | reservation, not a second nav |
| MAP page bottom padding | `0` | 0 | 0 |
| expanded detail inner padding | `18px + safe-bottom` | conditional | localized extra inset, not page/map reservation |

**The bottom navigation occupies page space once.** It is fixed, and the page reserves `safe bottom + 64 + 20` once. The 20px strip is extra clearance, not a second copy of the nav. The only repeated bottom-safe use is inside expanded detail padding; it can waste sheet content height but does not produce the base-page blank area.

## 7. Giant blank card root cause

```text
GIANT_BLANK_CARD_ROOT_CAUSE =
WECHAT_NATIVE_BUTTON_WIDTH_184PX + INCOMPLETE_BUTTON_RESET
-> MAP_MODE_SWITCH_WIDTH_376PX
-> MAP_LOCATION_SHELL_FLEX_SHRINKS_TO_0PX
-> LOCATION_CONTENT_WRAPS TO 188.5PX HEIGHT
-> MAP_TOOLBAR EXPANDS TO 256.5PX
```

The white region is the single `view.map-toolbar.light-capsule`; there is no duplicated map placeholder inside it. Its first child is `view.map-toolbar-top`, followed by `scroll-view.map-filter-scroll`. The intended top row is compact, but its two mode buttons retain WeChat's injected `184px` width each. The switch becomes 376px wide, larger than its 334px parent content width. The flexible location button collapses to 0px wide, and its icon/text wrapping increases the row to 188.5px. Adding the valid 34px filter scroll, 10px margin, and 24px toolbar padding produces the observed 256.5px card.

The filter `scroll-view` is not vertically unbounded: it measured `334×34`. There is also no “reserved map card plus second synthetic map” duplication. The giant card is a native-button cascade/flex-collision defect.

## 8. Map surface height chain

### MAP_SURFACE_HEIGHT_CHAIN

```text
WeChat window: 390×844
└─ .app-shell: 390×844, height:100vh, overflow:hidden
   ├─ .page.page--map: 390×726, content 358×631
   │  ├─ .map-shell-header: 358×49, normal flow
   │  ├─ .map-toolbar: 358×256.5, normal flow
   │  ├─ .map-surface-placeholder: 358×190,
   │  │    min-height:190px; flex:0 0 190px; overflow:hidden
   │  │  ├─ watermark: absolute inset:0, 100%×100%
   │  │  ├─ markers: absolute, observed 184×38
   │  │  ├─ viewport actions: absolute bottom:10px
   │  │  └─ state/overlap: absolute overlays when mounted
   │  └─ detail shell: absolute overlay when mounted
   └─ .bottom-nav: fixed 312×64 at bottom inset 34
```

The parent has a definite content height, so `flex:1` could work. MAP mode simply never assigns it to the map. The map's basis, minimum and actual height are all 190px, its grow factor is zero, and it has no max-height because none is needed to keep it small. Tall devices create more blank space rather than a larger map. On short devices, normal-flow siblings overflow and are clipped by `.page { overflow:hidden }`.

## 9. Flex analysis

| Container / child | Current flex model | Finding |
| --- | --- | --- |
| `.page--map` | column, definite height, `gap:10px`, hidden overflow | correct prerequisite for a map-first flex shell, but MAP child does not grow |
| `.map-shell-header` | horizontal flex, space-between | native refresh width crowds the title; observed 181.633px refresh width |
| `.map-toolbar-top` | horizontal flex, space-between, center | switch is 376px; location button collapses to 0px and row grows to 188.5px |
| `.map-location-shell` | flex, `min-width:0`, default shrink | missing owned width/flex-basis; becomes the sacrificial shrink target |
| `.map-mode-switch` | flex, no shrink constraint correction | children preserve 184px native widths |
| `.map-surface-placeholder` | `flex:0 0 190px` | explicitly cannot grow or shrink |
| `.map-list-shell` | `min-height:0; flex:1 1 auto` | correct LIST-mode pattern |
| state banners | normal-flow auto children | each mounted banner adds its own height and an extra 10px page gap |
| detail shell | absolute | not a flex item and does not squeeze the map |

No blank card wrongly receives `flex-grow:1`; its excessive height comes from its child. The base failure is the combination of native button sizing and the map's explicit zero grow factor.

## 10. Positioning model

### POSITIONING_MODEL_TABLE

| Element | Position model | Flow occupancy | Correctness / risk |
| --- | --- | ---: | --- |
| page header | normal flow | yes, 49px | appropriate, but refresh child is oversized |
| toolbar/filter/switch | normal flow | yes, 256.5px | appropriate semantic group; computed geometry is broken |
| map surface | relative normal-flow flex item | yes, 190px | should own remaining space but is fixed |
| watermark | absolute in map surface | no | correct |
| markers | absolute in map surface | no | correct positioning model; wrong button size |
| viewport controls | absolute in map surface | no | correct overlay model; button widths remain risky |
| overlap card | absolute in map surface | no | correct overlay model |
| loading/empty/error overlay | absolute inset map surface | no | correct, does not reserve space |
| stale/refresh/error/pagination banners | conditional normal flow | yes | intentional feedback, but can trigger page clipping |
| preview/expanded detail | absolute | no | does not shrink map, but has no positioned page/map ancestor and is viewport-anchored |
| bottom nav | fixed | no | page reserves it once |
| camera output canvas | fixed offscreen `1×1` | no | no hidden occupancy |
| sticky items | none | n/a | no sticky interaction |

The bottom sheet is not incorrectly participating in normal flow. Its separate defect is anchoring: `.page--map` is not positioned, so the sheet's containing block is not the map surface.

## 11. Marker size/style inheritance

Declared marker geometry is `min-width:52px; height:38px; padding:0 9px; display:flex`. No line-height is declared. It does not carry `.action-button`, `.ghost-button`, `.light-capsule`, or a V1 pill class.

The WXML inspector nevertheless measured every marker at `184×38`. The active chain is:

```text
<button class="synthetic-marker ...">
-> injected wx-button:not([size=mini]) { width:184px }
-> .synthetic-marker supplies only min-width, not width
-> computed width remains 184px
```

```text
MARKER_BUTTON_STYLE_LEAK = YES
LEAK_SOURCE = WECHAT_INJECTED_NATIVE_BUTTON_WIDTH
V1_ACTION_BUTTON_INHERITANCE = NO
V1_LIGHT_CAPSULE_INHERITANCE = NO
```

Its pill radius, black fill, bold text and 38px height then amplify the inherited width, making it read as a CTA.

## 12. V1 reuse misapplication

### V1_REUSE_MISAPPLICATION_TABLE

| Element | Reuse source / current implementation | Classification | Reason |
| --- | --- | --- | --- |
| fixed bottom navigation | approved V1 `.bottom-nav.light-capsule` | `CORRECT_REUSE` | measured 312×64 and reserved exactly once |
| list result rows | V1 card surface via `.light-capsule` | `CORRECT_REUSE` | card semantics suit list items; not base MAP collapse |
| toolbar outer surface | V1 `.light-capsule` | `NEEDS_ADAPT` | one large card magnifies the native-button geometry failure and visually competes with the map |
| map surface outer surface | V1 `.light-capsule` + placeholder | `NEEDS_ADAPT` | acceptable synthetic evidence, but card language and fixed 190px basis prevent map-first hierarchy |
| preview/detail shell | V1 `.light-capsule` | `NEEDS_ADAPT` | surface language is reusable, anchoring and sheet behavior are map-specific |
| refresh control | new map class on native `<button>` | `SHOULD_BE_NEW_REQUIRED` | not a V1 action-button reuse; requires an explicit compact map-control reset |
| map/list toggle | new map classes on native `<button>` | `SHOULD_BE_NEW_REQUIRED` | each button remains 184px wide |
| filter chips | new map classes on native `<button>` | `SHOULD_BE_NEW_REQUIRED` | min-width does not override the native width |
| markers | new map classes on native `<button>` | `SHOULD_BE_NEW_REQUIRED` | map marker needs its own explicit geometry; no V1 CTA class is inherited |
| overlap rows | new map button classes | `SHOULD_BE_NEW_REQUIRED` | map-context density differs from V1 cards/actions |
| viewport/search/pagination controls | mixed new map classes and `.ghost-button` | `NEEDS_ADAPT` | actions are valid, but V1-sized button semantics must not dominate the canvas |

V1 consistency is not itself the root cause. The root is an incomplete native button neutralization plus use of card/action visual weight in a map context. No evidence supports the claim that `.action-button` directly leaked into markers.

## 13. WXML hierarchy

```text
app-shell
├─ page.page--map                         [currentView === map-preview]
│  ├─ map-shell-header                    [normal flow]
│  │  ├─ kicker + title
│  │  └─ button.map-refresh-button
│  ├─ map-toolbar.light-capsule           [normal flow]
│  │  ├─ map-toolbar-top
│  │  │  ├─ button.map-location-shell
│  │  │  └─ map-mode-switch
│  │  │     ├─ button MAP
│  │  │     └─ button LIST
│  │  └─ scroll-view.map-filter-scroll
│  │     └─ map-filter-row
│  │        └─ filter buttons
│  ├─ map-surface-placeholder             [wx:if MAP; normal-flow 190px]
│  │  ├─ map watermark
│  │  ├─ synthetic marker buttons         [absolute]
│  │  ├─ viewport action buttons          [absolute]
│  │  ├─ overlap card                     [absolute wx:if]
│  │  └─ state overlay                    [absolute wx:if]
│  ├─ LIST root state                     [conditional normal flow]
│  ├─ status banners                      [conditional normal flow]
│  ├─ scroll-view.map-list-shell          [wx:if LIST; flex scroll region]
│  └─ map-detail-shell                    [wx:if; absolute preview/sheet]
├─ modal layers                           [conditional fixed]
├─ bottom-nav.light-capsule               [fixed sibling]
└─ camera-output-canvas                   [fixed offscreen 1×1]
```

The switch, filters and map are separate siblings within the same semantic map-page region; the switch and filters correctly share the toolbar. Map controls are inside the map surface. There is one map container, not two. The detail is outside the surface and absolutely positioned, which explains its weak spatial attachment to the map.

## 14. Hidden-element space occupancy

| State/element | Mechanism | Occupies layout when inactive? |
| --- | --- | --- |
| MAP vs LIST surface | `wx:if` | No |
| loading/empty/error overlay | `wx:if` + absolute inset | No when absent; no flow space when present |
| overlap card | `wx:if` + absolute | No |
| preview/expanded detail | `wx:if` + absolute | No |
| stale/refresh/error banners | `wx:if` + normal flow | No when absent; yes intentionally when present |
| camera output canvas | always mounted, fixed at `left:-10000px`, `1×1` | No flow space |
| map watermark opacity | visible at `0.36` | occupies only its already-fixed absolute surface |

There is no map-relevant `hidden`, `display:none`, `visibility:hidden`, or `opacity:0` element consuming the giant blank area. `HIDDEN_INACTIVE_SPACE_CAUSE = NO`.

## 15. Scroll model

Current strategy is **B: fixed page/map context + inner list/sheet scrolling**, with a small nested horizontal filter scroller:

- the page itself is disabled from scrolling (`disableScroll:true`, `overflow:hidden`);
- MAP mode uses a fixed 190px surface;
- LIST mode uses `scroll-view.map-list-shell` with `min-height:0; flex:1 1 auto`;
- expanded detail uses its own vertical `scroll-view`;
- filters use a horizontal `scroll-view` measured at 34px high.

This strategy is reasonable in principle. The implementation is inconsistent with its map-first intent because MAP mode fixes the map instead of letting it fill the constrained page. The horizontal filter scroller is correctly height-bounded in the observed render. Nested sheet/list scrolling has no base-page conflict because only the active branch is mounted, but the viewport-anchored detail sheet needs a map/page containing block in a later repair.

## 16. Device-size calculations

The following pure model uses representative logical sizes and capsule bottoms; only the `390×844` row is directly observed in the current simulator. `top reserve = max(40, status, safeTop, capsuleBottom+12)`. Current component heights hold the observed broken geometry constant to expose short/tall risk.

| Scenario | Window W×H | status / safe top / capsule bottom | top reserve | safe bottom | usable content | current fixed UI (`49+256.5+20`) | actual map | map / usable | leftover (+) or clipped (-) | map if compact toolbar fills remainder |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| small iPhone | 375×667 | 20 / 20 / 58 | 70 | 0 | 513 | 325.5 | 190 | 37.0% | -2.5 | 338 |
| Dynamic Island iPhone | 393×852 | 54 / 59 / 86 | 98 | 34 | 636 | 325.5 | 190 | 29.9% | +120.5 | 461 |
| tall iPhone, observed class | 390×844 | 47 / 47 / 83 | 95 | 34 | 631 | 325.5 | 190 | 30.1% | +115.5 | 456 |
| common Android | 360×800 | 24 / 24 / 62 | 74 | 0 | 642 | 325.5 | 190 | 29.6% | +126.5 | 467 |
| narrow Android | 320×640 | 24 / 24 / 62 | 74 | 0 | 482 | 325.5 | 190 | 39.4% | -33.5 | 307 |

Formula:

```text
usable content = windowHeight - topReserve - safeBottom - 64 nav - 20 clearance
current leftover = usable - 49 header - 256.5 toolbar - 20 gaps - 190 map
compact-fill map = usable - 49 header - 106 toolbar - 20 gaps
```

The layout is not robust at any one device family: tall devices expose 115–127px of unused space, while short/narrow devices clip 2–34px. The fixed 190px map is only about 30% of usable content on common tall phones.

## 17. Vertical rpx risk

```text
VERTICAL_RPX_RISK = NO
```

There are zero `rpx` uses in the map block and zero in the full `index.wxss`. The general warning remains valid—`rpx` scales from width—but it is not the present root cause. Here the dominant risks are fixed logical `px`, injected native 184px button width, `100vh`, and missing flex growth.

## 18. Web vs Mini Program project-specific differences

| Dimension | Typical web assumption | Current ICHI Mini Program reality |
| --- | --- | --- |
| viewport | browser CSS viewport is inspectable and usually centralized in layout CSS | shell uses `100vh`, top uses JS capsule metrics, bottom uses `env()`; three metric systems are composed manually |
| safe top | CSS safe-area may be enough | custom navigation requires WeChat status/capsule measurement; V1 uses `menuButton.bottom+12` |
| controls | browser button reset is predictable | WeChat injects `wx-button:not([size=mini]) { width:184px }`; current reset omits width and map selectors often set only `min-width` |
| DOM/flow | standard elements and browser DevTools computed layout | WXML components have injected styles and `scroll-view` component semantics |
| page scroll | document/body scrolling is common | `disableScroll:true` and `overflow:hidden`; every inner scroll region needs a definite flex/height contract |
| units | px/rem/vh are often sufficient | logical px, viewport units, environment insets and runtime window metrics must agree |
| overlays | positioned ancestor patterns are conventional | `.page--map` lacks positioning, so its absolute sheet is not map/page anchored |
| bottom nav | browser tab bars often participate in app-shell grid | V1 nav is fixed and manually subtracted from `100vh` |

The failure is therefore Mini Program adaptation/layout implementation, not merely aesthetic taste. The most visible defect is a WeChat component default that semantic source tests never compute.

## 19. Founder screenshot symptom-to-root-cause table

| ID | Symptom | WXML/WXSS evidence | Root cause | Confidence |
| --- | --- | --- | --- | --- |
| A | top appears too high | root `--top-safe-px:95px`; header 49px | one valid capsule reserve plus a full normal-flow header; oversized refresh makes the band visually heavier, not double safe area | HIGH |
| B | refresh capsule is too large | `.map-refresh-button` intended 44px, observed 181.633×44 | injected native 184px width outranks/survives the class width and is only slightly flex-shrunk | HIGH |
| C | first white card has huge blank area | `.map-toolbar` observed 358×256.5 | switch 376px crushes location to 0px; wrapped location content makes top row 188.5px | HIGH |
| D | map/list switch sits in abnormal area | each mode button observed 184×30; switch 376×38 | `min-width:46px` never overrides native `width:184px`; parent clips overflow | HIGH |
| E | filter occupies a separate heavy layer | horizontal `scroll-view`, filter buttons set min-width only | toolbar is already inflated; filters also retain native button width, so chips read as large controls | HIGH |
| F | synthetic map is too small | `.map-surface-placeholder { min-height:190px; flex:0 0 190px }` | explicitly fixed and cannot grow | HIGH |
| G | marker looks like a button | marker observed 184×38 | WeChat native width leak plus pill styling; not V1 `.action-button` inheritance | HIGH |
| H | large blank area above bottom nav | current unused content is 115.5px | map grow is zero; free flex space remains after the 190px map | HIGH |
| I | selected preview lacks clear sheet hierarchy | detail is a sibling absolute element; no positioned map/page ancestor | overlay is viewport-anchored rather than map-anchored; initial CLOSED state naturally shows none | MEDIUM-HIGH |
| J | page lacks map-first hierarchy | toolbar 256.5px vs map 190px | tool controls occupy more vertical weight than the canvas, and the canvas cannot claim remaining space | HIGH |

## 20. Root causes ranked by confidence

### ROOT_CAUSE_RANKING

#### RC1

Description: WeChat native button width is not neutralized for map controls.

Evidence: WXML inspector shows injected `width:184px`; refresh `181.633×44`, mode buttons `184×30`, marker `184×38`, switch `376×38`, location `0×188.5`.

Affected selectors/files: global `button`, `.map-refresh-button`, `.map-location-shell`, `.map-mode-switch button`, `.map-filter`, `.synthetic-marker`, viewport controls in `index.wxss`.

Confidence: **HIGH**.

Impact: creates the giant toolbar card, huge refresh, CTA markers, wide filters and horizontal clipping.

#### RC2

Description: the map surface is explicitly fixed at 190px with zero flex growth.

Evidence: source and computed box both show `min-height:190px; flex:0 0 190px`; actual map is exactly 190px.

Affected selectors/files: `.map-surface-placeholder` in `index.wxss`.

Confidence: **HIGH**.

Impact: map cannot become the main content area; tall screens expose blank space and short screens clip siblings.

#### RC3

Description: MAP-mode vertical space has no invariant or allocator.

Evidence: definite 631px content height, normal-flow header/toolbar, fixed map, conditional banners, but no flex-growing MAP child; observed 115.5px left unused.

Affected selectors/files: `.page--map`, map WXML sibling order, `.map-status-banner`, `.map-surface-placeholder`.

Confidence: **HIGH**.

Impact: state additions and device height changes cannot be absorbed predictably.

#### RC4

Description: overlay/detail anchoring is tied to the viewport rather than the map context.

Evidence: `.map-detail-shell` is absolute but neither `.page--map` nor a dedicated map-stage ancestor is positioned; detail is a sibling of the map.

Affected selectors/files: map hierarchy in `index.wxml`; `.map-detail-shell`, `.map-detail-shell--EXPANDED` in `index.wxss`.

Confidence: **HIGH** for the containing-block fact; **MEDIUM-HIGH** for its full visual impact because no selected-detail screenshot was measured in this audit.

Impact: weak selected-preview/map relationship and possible overlap behind the higher-z fixed nav.

#### RC5

Description: viewport accounting is split between CSS `100vh`, JS capsule metrics and CSS environment bottom inset.

Evidence: `.app-shell/.page` use `100vh`; `getTopSafePx()` reads only top metrics; bottom uses `env()`; no `windowHeight` is bound to layout.

Affected selectors/files: `index.ts`, `index.wxss`, `index.json`.

Confidence: **MEDIUM**.

Impact: increases cross-device risk, though the inspected 390×844 simulator resolved consistently and this is not the immediate giant-card cause.

## 21. Spatial invariant set

### SPATIAL_INVARIANT_SET

1. Exactly one top system/capsule reserve and one bottom safe reserve exist per page.
2. The fixed V1 bottom nav is subtracted exactly once; any extra clearance is separately named and bounded.
3. Every map-specific native button owns an explicit computed width, height, margin, padding and line-height; no injected 184px width may survive.
4. In MAP mode, the map stage receives all positive remaining height after compact fixed UI; `map height > header + toolbar + controls` on supported viewports.
5. The map stage has `min-height:0` where necessary and a bounded minimum fallback; short screens degrade by reducing/overlaying secondary controls, not by clipping core map actions.
6. Switch and filters form one compact control region whose total normal-flow height is bounded and independent of native button defaults.
7. Markers are materially smaller than CTA controls and never use V1 action/card dimensions.
8. Preview/detail is anchored to a positioned map/page stage and overlays it; it does not consume normal flow or hide behind bottom navigation.
9. Conditional banners have an explicit allocation policy (overlay, bounded stack, or compensated map area); mounting a state cannot silently overflow the page.
10. LIST and expanded-detail are the only vertical inner scroll regions; each has a definite available height and `min-height:0`.
11. No inactive branch occupies space; overlays remain absolute/fixed and `wx:if`-gated.
12. On small iPhone, Dynamic Island iPhone, tall iPhone, common Android and narrow Android, the first frame visibly reads as a map exploration page with no information-free blank region.

## 22. Proposed repair order

No repair is performed here. The evidence-derived minimum order for the next authorized 16-A structural rework is:

1. Establish an explicit Mini Program button reset/compact map-control contract and verify computed boxes, beginning with refresh, mode switch, location, filters and marker.
2. Replace the fixed 190px MAP allocation with one remaining-height owner under a bounded page layout; preserve LIST `min-height:0` behavior.
3. Re-anchor preview/expanded detail to a positioned map-stage/page context and define its relationship to the fixed nav.
4. Define how conditional status banners consume or overlay the map allocation on short screens.
5. Centralize/test viewport inputs (top capsule, actual window height, bottom safe inset, fixed nav, deliberate clearance) across the five logical device scenarios.
6. Only after computed structural invariants pass, perform the Founder visual review; do not start 16-B until both 16-A gates pass.

## 23. Explicit no repair performed

`NO_REPAIR_PERFORMED = YES`.

No WXML, WXSS, TypeScript, public-map runtime, app config, asset, route, dependency, CloudBase file or production resource was changed by this audit. No temporary instrumentation entered the repository. The only changes are this diagnostic report and current-status documentation.

## 24. Runtime diff = 0 proof

Pre-audit hashes:

```text
home + platform + assets aggregate:
ff4acc0e701cb3a7ec85c5b6fb1faa2fa957561632afc1444685faa3df36d3d2

app.json:
f8eb015b5ba353329d41150b6554f4939b3fd09d98e7d565d571ce745b88d374

app.wxss:
3b8fae1fb8c3b7f56f2439236a1b0fee49f9a254e1e7e7d6087b779c84ea6dd0

index.ts:
216e4577efb26924bc3d1bd9391a035d1a4dcec93d79f2d3e7d2fa6d35868998

index.wxml:
7d7210e465ba09fde531ce165db84ee11394cf99020cd744e750181fd1dde1b5

index.wxss:
41973781a733156fd70324eb1383970d504744bb94d463f7f6e50f5905c3def8

dependency-manifest aggregate:
3bec6149333d527cf5cbd8f0fa1710a18d8d1b7a5a78c912d1fc7cd28b5ff0ff

CloudBase aggregate:
d4b48c89424b7feeaa5702905e5e6c58e8105b1d45bba9972a43faa265f8b077
```

Post-audit values matched every pre-audit value exactly:

```text
home + platform + assets aggregate:
ff4acc0e701cb3a7ec85c5b6fb1faa2fa957561632afc1444685faa3df36d3d2

app.json / app.wxss / index.ts / index.wxml / index.wxss:
f8eb015b5ba353329d41150b6554f4939b3fd09d98e7d565d571ce745b88d374
3b8fae1fb8c3b7f56f2439236a1b0fee49f9a254e1e7e7d6087b779c84ea6dd0
216e4577efb26924bc3d1bd9391a035d1a4dcec93d79f2d3e7d2fa6d35868998
7d7210e465ba09fde531ce165db84ee11394cf99020cd744e750181fd1dde1b5
41973781a733156fd70324eb1383970d504744bb94d463f7f6e50f5905c3def8

dependency-manifest aggregate:
3bec6149333d527cf5cbd8f0fa1710a18d8d1b7a5a78c912d1fc7cd28b5ff0ff

CloudBase aggregate:
d4b48c89424b7feeaa5702905e5e6c58e8105b1d45bba9972a43faa265f8b077
```

The worktree already contained the authorized TASK 14/15/16-A implementation before this audit; “runtime diff = 0” means no additional runtime delta was introduced by this audit.

Frozen R2 Prompt / Schema / Resolver remain:

```text
c083066c80999722a2e3207f64654c598e418daf1c51dba35d57abf0291a3462
178c3fffb9ad74257ad6fb0123509beacbd011225eae2aa7eb2d648beb690722
46ffebadc3094412c4beb9c8625acdf83346b496e382fe40a48083ff101411d8
```

Production actions: **NO**. Git commit/push: **NO**.

Validation results:

- TASK 16-A logic code unchanged: PASS by exact pre/post hashes
- TASK 16-B / 16-C / TASK 17 not started: PASS
- app config / route / assets / dependencies / CloudBase unchanged: PASS by exact aggregate and file hashes
- Frozen R2 byte identity: `1 file / 16 tests PASS`
- `node scripts/validate-workflow.mjs`: PASS
- `git diff --check`: PASS

## 25. Recommendation and explicit answers

The next authorized work should be a focused **16-A structural layout rework**, not 16-B and not visual polish. It should first neutralize WeChat native button geometry, then make the map the single remaining-height owner, then anchor sheet/state overlays. Re-run semantic tests afterward, but keep `STRUCTURAL_VISUAL_REVIEW` as an independent Founder gate.

1. **Is this mainly Mini Program adaptation/layout, not aesthetics?** Yes. Computed boxes prove a native button cascade and broken flex allocation.
2. **How is usable viewport calculated?** `windowHeight - topReserve - bottomSafe - 64 nav - 20 clearance`; observed `844-95-34-64-20=631px`.
3. **Is top safe/capsule counted twice?** No; it is one 95px max-based reserve.
4. **Is bottom nav counted twice?** No; nav, safe bottom and named 20px clearance are each counted once. Expanded detail repeats safe bottom only internally.
5. **Giant blank card root cause?** Native 184px mode buttons create a 376px switch, collapse location to 0px, wrap it to 188.5px and expand the toolbar to 256.5px.
6. **Why is synthetic map compressed?** It is explicitly `flex:0 0 190px` and cannot claim remaining height.
7. **Why do markers look like CTA buttons?** They compute to `184×38` because native button width survives, then pill styling reinforces it.
8. **Are V1 button/card styles incorrectly reused?** V1 card surface needs map adaptation, but markers do not inherit V1 action-button styles; their direct leak is WeChat native button CSS.
9. **Vertical rpx overuse?** No; the map block uses zero rpx.
10. **100vh/fixed/flex/min-height conflict?** Yes: split viewport accounting is a medium risk, and fixed 190px plus zero grow is an immediate high-confidence failure.
11. **Does hidden/inactive UI occupy space?** No material case. Conditional banners occupy space only when actually mounted.
12. **Does bottom sheet/detail wrongly participate in normal flow?** No; it is absolute. It is incorrectly anchored to the viewport rather than the map/page context.
13. **What is the scroll model, and is it reasonable?** Fixed page with inner LIST/detail scrolling and horizontal filter scrolling. The strategy is reasonable; MAP height allocation is not.
14. **What came from web-style thinking?** `100vh` shell composition, assuming a generic button reset controls computed geometry, and not treating WXML component-injected styles/scroll regions as first-class constraints.
15. **Primary causes?** RC1 native button width, RC2 fixed map, RC3 missing MAP allocation invariant, RC4 wrong detail containing block, RC5 split viewport model.
16. **Which are HIGH confidence?** RC1–RC3 are fully observed; RC4's containing-block fact is high confidence. RC5 is medium.
17. **Minimum repair order?** Button geometry → map flex allocation → sheet anchoring → banner policy → multi-device viewport model → Founder structural review.
18. **SPATIAL_INVARIANT_SET?** The 12 invariants in section 21.
19. **Runtime diff zero?** Yes, subject to the matching post-audit hashes recorded by validation.
20. **Is TASK 16-B still locked?** Yes: `LOCKED / NOT_STARTED`.
