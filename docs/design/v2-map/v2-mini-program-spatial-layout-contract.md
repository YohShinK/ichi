# V2 Mini Program Spatial Layout Contract

> Status: `TASK-V2-16-A / STRUCTURAL_LAYOUT_AUTOMATED_GATE=PASS / MAP_FIRST_LAYOUT_IMPLEMENTED=YES / AWAITING_FOUNDER_STRUCTURAL_VISUAL_REVIEW`
>
> Host: existing `pages/home/index` / `currentView === "map-preview"`

## Scope

This contract includes the five root-cause repairs proven by the 2026-09-13 WeChat DevTools audit and the later Founder-directed map-first refinement. It does not change the TASK 14 public-map client, TASK 15 authorization/owner semantics, native-map status, route registration or release exposure.

## Map vertical allocation contract

The existing V1 page remains the sole viewport shell and counts the top safe area once. In MAP mode the page-specific shell removes the ordinary content bottom clearance so the map visual can extend behind the unchanged fixed V1 navigation. One shared interactive inset protects tappable content:

```text
page below top-safe boundary
  map-content-stage                 flex: 1 1 0; min-height: 0
    synthetic map surface           absolute; inset: 0
    brand/search/filter/mode        compact top overlay
    status / overlap                bounded overlay
    locate / refresh                right floating controls
    preview / expanded detail       absolute map-anchored sheet
  unchanged V1 bottom navigation   fixed overlay above map visual
```

Invariants:

- the map stage is the only page content-height owner below the legal top safe area;
- the map surface is absolute `inset:0`, has no card border and no fixed `190px` basis;
- extra height on tall devices goes to the map and map visual reaches the content bottom;
- one status banner does not reduce the map's allocated height;
- preview/detail never participates in normal flow;
- the page itself does not scroll;
- LIST and expanded detail retain their own inner vertical scrollers;
- the filter row retains its horizontal scroller;
- `--map-interactive-bottom-inset = safe bottom + 64px nav + 20px bounded gap` is applied to markers/controls/sheet, not to the map visual.

## Map-control button reset

Every map-specific button carries `map-control-button`. The scoped reset explicitly owns `width`, `min/max-width`, `height`, `min-height`, padding, margin, line-height, box sizing, display, border, background, inherited font, flex grow/shrink and whitespace. Intended widths then use explicit component contracts with `!important` only where required to defeat WeChat's injected `wx-button:not([size=mini]) { width:184px }`.

| Control | Width contract | Height contract |
|---|---:|---:|
| Refresh / synthetic locate | `44px` each | `44px` |
| Mode segment | `40px` each | `26px` |
| Mode switch | `88px` total | `32px` |
| Filter chip | content width, `46–132px` | `32px` |
| Marker | content width, `42–68px` | `32px` |
| Search clear | `32px` | `32px` |

The reset is limited to the map host and does not touch V1 buttons elsewhere.

## Status banner layout policy

Only one retained-data status banner is mounted through a single `wx:if / wx:elif` priority chain:

1. retained-data root error;
2. pagination error;
3. refreshing or cursor recovery;
4. stale client cache;
5. pagination progress.

In MAP mode this is a bounded `56px` overlay inside `map-content-stage`. In LIST mode it is one bounded normal-flow row before the inner list scroller. Initial loading, empty and no-data errors replace map/list content in their existing root-state regions. Hidden conditions remain unmounted through `wx:if`; banners cannot accumulate indefinitely in the page flex column.

## Sheet anchoring contract

`map-content-stage` is the explicit `position:relative` containing block. Preview and expanded detail are absolute children with `left/right:12px` and `bottom:var(--map-interactive-bottom-inset)`; expanded mode uses a bounded `top:108px`. The map visual continues behind navigation, while the sheet's key content remains above it. No second safe-area or navigation padding exists.

## Viewport model hardening

No second JS window-height truth was introduced. `page--map` remains `100vh` with the one JS-derived `topSafePx`; `map-content-stage` fills the remainder. `env(safe-area-inset-bottom)`, one `64px` nav and one `20px` gap appear only in the interactive inset. The map visual is not reduced by that inset.

## WeChat DevTools structural-repair baseline geometry

The table below is preserved as the RC1–RC5 before/after record. The later map-first refinement intentionally removes the separate header/control-band flow and changes switch/filter contracts as specified above.

Environment: WeChat DevTools RC `2.02.2607271`, base library `3.17.0`, iPhone 12/13 Pro simulator, logical viewport `390×844`.

| Box | Before | After | Result |
|---|---:|---:|---|
| Page border/content | `390×726` / `358×631` | `390×726` / `358×631` | V1 shell unchanged |
| Header | `358×49` | `358×44` | bounded |
| Refresh | `181.633×44` | `44×44` | native width neutralized |
| Toolbar | `358×256.5` | `358×96` | `-160.5px` |
| Location | `0×188.5` | `228×36` | non-zero owner |
| Map/list switch | `376×38` | `100×38` | fits `338px` toolbar content |
| Map mode segment | `184×30` | `46×30` outer | compact |
| Map surface | `358×190` | `358×475` | `+285px`, flex-owned |
| Marker | `184×38` | `44.55×32` | clearly smaller than CTA |
| Bottom nav | `312×64 @ y=746`, bottom safe `34` | unchanged | counted once |
| Preview containing block | viewport | `map-content-stage` | explicit map context |

The repaired page allocates the full `631px` content height as `44 header + 96 controls + 16 gaps + 475 map`; unallocated vertical blank is `0px` in the computed layout. The map is larger than header plus controls (`475 > 140`).

## Five-device structural-repair calculation matrix

The deterministic structural test uses the V1 shell equation and the repaired bounded structure. A status banner is overlaid and therefore does not subtract from map height.

| Scenario | Viewport | Top / bottom safe | Calculated map height | Map-first | Core clipping |
|---|---:|---:|---:|---|---|
| Small iPhone | `375×667` | `83 / 34` | `312px` | PASS | none |
| Dynamic Island iPhone | `390×844` | `95 / 34` | `477px` model; `475px` real computed | PASS | none |
| Tall iPhone | `430×932` | `95 / 34` | `565px` | PASS | none |
| Common Android | `393×873` | `68 / 24` | `543px` | PASS | none |
| Narrow Android | `360×780` | `64 / 20` | `458px` | PASS | none |

Every scenario keeps location width positive by reserving the fixed `100px` switch after the row gap, keeps the switch within the control band, leaves the fixed bottom nav outside the page content allocation, and keeps one banner bounded.

## Structural evidence

- [A — MAP clean](../../../artifacts/v2-d-task-16a-structural-layout-repair/A-map-clean.png)
- [B — selected preview](../../../artifacts/v2-d-task-16a-structural-layout-repair/B-map-selected-preview.png)
- [C — expanded detail](../../../artifacts/v2-d-task-16a-structural-layout-repair/C-map-expanded-detail.png)
- [D — overlap](../../../artifacts/v2-d-task-16a-structural-layout-repair/D-map-overlap.png)
- [E — LIST](../../../artifacts/v2-d-task-16a-structural-layout-repair/E-list.png)
- [F — stale retained data](../../../artifacts/v2-d-task-16a-structural-layout-repair/F-stale-retained-data.png)

These are real WeChat DevTools screenshots, not generated mockups. They are structural review evidence only and do not approve final visual design.

## Gate

`STRUCTURAL_LAYOUT_AUTOMATED_GATE=PASS` and `MAP_FIRST_LAYOUT_IMPLEMENTED=YES` after source checks, state tests and A–G real WeChat DevTools screenshots. `STRUCTURAL_VISUAL_FOUNDER_GATE=AWAITING_FOUNDER_REVIEW`; Codex does not self-approve that gate. TASK 16-B, 16-C and TASK 17 remain locked.
