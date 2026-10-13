# V2-D Frontend Execution Strategy Addendum

> Status: `CANONICAL / APPROVED EXECUTION CONSTRAINT`
>
> Applies to: `TASK-V2-14—18`
>
> State impact: execution strategy only. V2-C frozen backend/service contracts, V2-D product scope, canonical task count, task order, and current lock states are unchanged.

## 1. Decision

V2-D no longer uses the isolated spike mini-program as the primary implementation host for product UI. The formal host for the interaction-complete low-fi prototype and approved visual integration is the existing real V1 mini-program project.

```text
real V1 mini-program
  + existing V1 “地图” navigation and map-preview host
  + V2 local/synthetic public-service adapter
  + V1 real assets, styles, navigation, Profile, page stack, and interaction environment
```

TASK-V2-14 directly upgrades the placeholder inside the existing V1 map host. It must not add a second map page, hidden/development route, or release redirect. The current branch is not deployed; actual release/pilot exposure control remains a TASK-V2-21/22 responsibility.

## 2. Why the real V1 app is the formal host

Copying V1 into a long-lived spike is not an accepted delivery strategy because:

1. the copy will drift from the real V1 project;
2. real routing, tabs, Profile, global styles, assets, page-stack behavior, safe area, and WeChat capsule behavior cannot be validated reliably in the copy;
3. interactions that pass in the spike can regress when merged back into V1;
4. the V2 UI must behave as an extension of ICHI, not as a separate app.

TASK-V2-14—18 therefore add V2 frontend logic inside the real V1 mini-program by default. For TASK-V2-14 specifically, the already-existing custom **地图** navigation and `pages/home/index` / `map-preview` view are the formal host. Its navigation relationship remains unchanged; no second route/page or runtime redirect is permitted. A later task may refine release controls, but this non-deployed branch does not simulate them with application behavior.

## 3. Spike role after V2-C

The existing spike is retained with the formal role `TECHNICAL_SPIKE_ONLY`.

It may be used for native `<map>` API behavior, WeChat map layer and `cover-view` edge cases, marker-count/package/render-performance benchmarks, `regionchange`, map SDK bug reproduction, isolated permission experiments, disposable prototypes, and extreme-case validation.

It must not define final V2 page structure, navigation, V1 integration, component hierarchy, or visual design. When spike behavior conflicts with the real V1 project, the real V1 project is product truth.

## 4. Low-fi visual, high-fi interaction

V2-D freezes the delivery principle:

> `LOW-FIDELITY VISUAL + HIGH-FIDELITY INTERACTION + COMPLETE PRODUCT LOGIC`

Visual treatment remains intentionally replaceable. Interaction behavior and product logic must approach final-product quality and follow the frozen public-service contract strictly.

Engineering effort prioritizes page/component relationships, tap targets, gestures, transitions, route/back behavior, bottom-sheet and map/list coordination, marker selection, expand/collapse, filters, loading/empty/partial/pagination/error/stale/offline states, retry and recovery, location denial and manual-city recovery, avatar failure, withdrawn/unavailable detail, consent, destructive-action confirmation, safe area, WeChat capsule, native-map overlay behavior, keyboard/scroll/fixed interaction, late-response discard, and stale-cursor recovery.

Engineering effort does not prioritize final gradients, decorative shadows, final typography, brand invention, final marker/icon artwork, complex decoration, or a final visual-motion language.

## 5. Responsibility split

### Codex: engineering, interaction, structure, and V1 integration

Codex owns real V1 integration, routing, page shells, state machines, data binding, interaction flows, component states, low-fi layout, reuse of V1 assets and style tokens, WeChat constraints, testability, basic accessibility/hit areas, error/recovery UX, and design-handoff documentation. Codex does not own final visual-design decisions.

### Gemini or another external visual-design process: visual design only

The visual-design process may refine visual hierarchy, layout, spacing, colors, typography, cards, chips, buttons, marker/icon appearance, and visual-motion proposals. It must not change product logic, backend fields, public/private boundaries, state machines, authorization, routing requirements, required interactions, or frozen component states.

### Founder: final product and visual approval

The Founder owns final information-architecture judgment, aesthetics, selection or rejection of external visual proposals, final visual approval, and the decision to enter TASK-V2-16-C.

## 6. V1 Frontend Design Inventory

TASK-V2-14 must extract a read-only `V1 FRONTEND DESIGN INVENTORY` from the real V1 code and assets before or during early implementation. It cannot be inferred from memory or invented by Codex.

The inventory must cover:

1. page structures;
2. navigation, tab, and page-stack patterns;
3. top bar/header;
4. WeChat safe-area usage;
5. cards;
6. capsules, chips, and buttons;
7. modal/dialog;
8. toast;
9. loading;
10. empty states;
11. error states;
12. typography hierarchy;
13. spacing and radius;
14. icon usage;
15. avatar and logo assets;
16. background assets;
17. existing illustrations;
18. V1 record cards;
19. Profile presentation;
20. destructive-action UX;
21. confirmation flows;
22. share and navigation behavior;
23. reusable components;
24. reusable WXSS tokens/classes;
25. page-level layout patterns.

## 7. V1 to V2 Design Inheritance Matrix

V2-D must maintain a matrix that classifies each V1 component or visual-language element as `REUSE`, `ADAPT`, or `NEW_REQUIRED` for V2.

Required mappings include V1 header to the V2 map/city header, V1 capsules/buttons to filters, V1 card spacing/radius to board summary/detail, V1 Profile/avatar treatment to contributor attribution, V1 modal to authorization/withdraw/delete confirmation, and V1 loading/error treatment to map/detail states.

`NEW_REQUIRED` is allowed only when the real V1 project has no adequate equivalent. Likely candidates include map markers, map controls, map bottom sheet, Opportunity/Freshness badges, overlap-stack indicator, map/list switch, and location control. New elements remain low-fi until TASK-V2-16-C.

## 8. TASK-V2-14 revised execution notes

The canonical task remains `Client Map State / Cache / Stale Guard`; its technical acceptance does not change.

In the real V1 mini-program it additionally establishes a V2 Map Page Shell inside the existing `map-preview` host, with V1 layout integration, V1 asset/style reuse, state rendering, synthetic/local public-service binding, state/cache/generation/cursor behavior, and low-fi controls. The existing **地图** button → `onSelectTab` → `map-preview` relationship remains intact.

It does not implement final marker/card visuals, a final visual system, or final map styling.

Required outputs are `V1 Frontend Design Inventory`, `V1 → V2 Design Inheritance Matrix`, `V2 Map Page Structural Skeleton`, and `V2 State Matrix v1`.

TASK-V2-14 ends at Founder Review. TASK-V2-15 remains locked until TASK-V2-14 is `COMPLETE / HUMAN_APPROVED`.

## 9. TASK-V2-15 revised execution notes

The canonical task remains `Consent / Owner-Control UX`. It implements the complete interaction skeleton in the real V1 app, with low-fi visuals and maximum reuse of V1 modal/card/button patterns.

Its host is the existing V1 page stack. Authorization management belongs with the current **我的上传** owner surface and may coordinate with the existing `map-preview` state engine; it must not create a standalone V2 authorization route. Entering or browsing the map is never a contribution-authorization gate.

It covers authorization placement, one-time authorization, historical and future scope, public nickname/avatar disclosure, per-owner withdraw/delete, hide-first feedback, retry/recovery, appropriate double confirmation, loading/success/failure states, and no Profile gate. Final visual polish remains out of scope.

TASK-V2-15 ends at Founder Review. TASK-V2-16 remains locked until TASK-V2-15 is `COMPLETE / HUMAN_APPROVED`.

## 10. TASK-V2-16 internal gates

TASK-V2-16 remains one canonical task. `16-A`, `16-B`, and `16-C` are mandatory internal gates, not new canonical tasks.

### 16-A: Interaction-complete Low-Fi Prototype

Codex completes the map-page information architecture, map/list/filter/detail structure, marker selection, bottom sheet, detail/filter flows, Record Type, Opportunity, Freshness, contributor Profile, overlap/multi-item behavior, all loading/empty/error/stale states, and V1 visual-language reuse in the real V1 environment.

The fixed design context is the existing V1 navigation and the existing `pages/home/index` / `map-preview` host. External visual work may redesign the discovery UI inside that host, but not the V1 map entry, primary-navigation meaning, or page-host relationship.

All required states must be structurally present with low-fi visuals and high-fi interaction. Completion produces the `V2 UI Structure Blueprint` but does not authorize final visual implementation.

### 16-B: Design Handoff Package

Codex produces a handoff package for the Founder and the selected visual-design process. For every relevant element it records page/region, component type, position/hierarchy, interaction, state, backend field binding, V1 equivalent, `REUSE / ADAPT / NEW_REQUIRED`, whether visual design may change it, what must not change, WeChat constraints, public/private restrictions, and screenshots or low-fi captures when tooling supports them.

The element checklist must include header, city/location, filter capsules, map, map controls, marker and selected marker, overlap, bottom sheet, list, board summary, Record Type, Opportunity, Freshness, contributor avatar/name, remaining tickets, price/full-pack cost, venueNote, refresh, report, close/back, and loading, empty, error, offline, stale, rate-limited, service-unavailable, location-denied, avatar-fallback, and withdrawn/unavailable-detail states.

Expected package files, following repository naming conventions, are:

- `docs/design/v2-map/v1-frontend-design-inventory.md`;
- `docs/design/v2-map/v1-to-v2-design-inheritance.md`;
- `docs/design/v2-map/v2-ui-structure-blueprint.md`;
- `docs/design/v2-map/v2-state-matrix.md`;
- `docs/design/v2-map/v2-interaction-map.md`;
- `docs/design/v2-map/v2-data-binding-map.md`;
- `docs/design/v2-map/v2-gemini-design-handoff.md`.

After 16-B, TASK-V2-16 must stop and wait for the Founder to return an approved visual proposal.

### 16-C: Approved Visual Integration

16-C starts only after the Founder explicitly provides or approves a visual proposal produced by Gemini or another visual-design process.

Codex then applies the approved visual system in the real WeChat mini-program without rewriting interaction, information architecture, data binding, or frozen product semantics, and performs visual regression. Absence of a proposal is a hard gate; Codex must not self-authorize or self-complete 16-C.

## 11. Gemini design-handoff boundaries

Gemini or another visual-design process may change visual hierarchy, color, typography, spacing, radius, visual card shape, chip/button styling, marker artwork, icon treatment, and visual-motion proposals.

It may not change screen/state coverage, backend fields, navigation requirements, authorization semantics, public/private boundaries, Record Type/Opportunity/Freshness meaning, BoardInstance/PublicMapLead identity, location semantics, report/moderation authority, or required recovery/error behavior.

## 12. TASK-V2-17 native-map integration rules

TASK-V2-17 remains `WeChat Map / Location / Safe Deep Link` and starts only from the Founder-approved TASK-V2-16 interaction structure and visual integration. It does not redesign the core UI.

Its focus is native `<map>`, real map layers and markers, GCJ-02, `wx.getLocation`, location permission and manual-city recovery, `cover-view` and native-layer constraints, safe area, marker tap, map move/`regionchange`, map/bottom-sheet coordination, deep link, back/navigation, and real V1 route integration.

The final phrase above means integration with the already-existing host state, not creating or reconnecting a route. TASK-V2-17 replaces/upgrades the synthetic surface inside the same `map-preview` branch; routing work is not a TASK-V2-17 deliverable.

If a native-map constraint prevents exact implementation of the approved visual, preserve in order: interaction correctness, information architecture, and V1 consistency. Then produce a `WECHAT_NATIVE_CONSTRAINT_VISUAL_ADJUSTMENT` for Founder review instead of unilaterally redesigning the UI.

## 13. TASK-V2-18 optimization boundaries

TASK-V2-18 remains `Scale / Clustering / Weak Network / Package` and does not own broad UI redesign.

Allowed changes are performance-oriented interaction adjustments, clustering and overlap behavior, loading strategy/timing, weak-network recovery, public-cache behavior, signed-avatar expiry/retry, package size, render and marker-density performance, map/list performance, rate/global-stop UX, and cost remeasurement.

Optimization must not merge BoardInstance identity, remove required states or disclosures, change approved visual semantics, or create a trust-score implication. A performance requirement that would materially alter the approved UI must stop for Founder review.

All scale, aggregation, weak-network, signed-avatar, package and cost evidence targets the same formal V1 `map-preview` host. TASK-V2-18 must not create a second benchmark product page.

## 14. Existing V1 map-host strategy

V1 already has a formal **地图** item in its custom bottom navigation and an existing `map-preview` placeholder inside `pages/home/index`. TASK-V2-14 must use that exact host and must not create a hidden/development route, a second map page, or a release redirect.

The map remains reachable through the same V1 navigation path in any local build containing this branch. This is intentional and is not treated as a production-exposure defect because the branch is not deployed. TASK-V2-14 does not claim the V2 map has shipped. Actual deployment, pilot, release gating and exposure decisions belong to TASK-V2-21/22.

## 15. Interaction-quality criteria

Low-fi does not mean merely clickable. Reviews must evaluate discoverability, tap targets, one-hand use, gesture conflicts, map-versus-sheet gestures, navigation clarity, back behavior, loading and page-error continuity, destructive-action safety, location and weak-network recovery, stale awareness, feedback latency, modal fatigue, repeated-consent avoidance, accidental withdraw/delete prevention, and visual state clarity before final skinning.

Codex may propose interaction improvements. Any proposal that changes product scope, introduces a public field or authorization, changes location semantics, or changes moderation semantics requires Founder review.

## 16. Founder gates and no-release warning

```text
TASK-V2-14 → Founder Review
TASK-V2-15 → Founder Review
TASK-V2-16-A → TASK-V2-16-B → Founder/Design Review → TASK-V2-16-C
TASK-V2-17 → Founder Review
TASK-V2-18
```

Canonical order remains `14 → 15 → 16 → 17 → 18`. TASK-V2-15—18 are not unlocked by this addendum. TASK-V2-19—22 remain locked.

This addendum, together with the explicit TASK-V2-14 execution authorization, permits only the scoped real-V1 client implementation recorded by TASK-V2-14. It does not authorize a new route, release redirect, dependency, final visual system, Cloud Function, database/index/resource, migration/backfill, Storage/ACL, secret, deployment, publication, Git commit, or remote action. It is not a production-release approval.
