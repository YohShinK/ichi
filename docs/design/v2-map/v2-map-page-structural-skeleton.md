# V2 Map Page Structural Skeleton

> Status: `TASK-V2-14 / LOW-FI, REPLACEABLE`
>
> Host: `apps/client/miniprogram/pages/home/index` → existing `currentView === 'map-preview'` branch.

## Navigation boundary

```text
existing custom bottom nav: 地图
  → onSelectTab(data-tab="map")
  → activeTab = "map"
  → currentView = "map-preview"
  → initialize one PublicMapClient per Page instance
```

This relationship is unchanged from V1. There is no second map page, hidden/dev route, release redirect, native TabBar mutation, or deployment in TASK 14.

## Page hierarchy

```text
page.page--map
├─ map-shell-header
│  ├─ low-fi title/kicker
│  └─ 44px explicit refresh button
├─ map-toolbar.light-capsule
│  ├─ location/city shell (static synthetic context)
│  └─ horizontally scrollable opportunity filters
├─ map-surface-placeholder.light-capsule
│  ├─ existing V1 map-placeholder.svg watermark
│  ├─ explicit SYNTHETIC MAP SURFACE label
│  ├─ synthetic marker buttons / selected marker / overlap count
│  └─ initial loading, empty, or initial error overlay
├─ retained-data status banners
│  ├─ client-cache-stale disclosure + refresh
│  └─ refresh/service/rate/schema/identity error + recovery
├─ map-list-shell
│  ├─ count header
│  ├─ public-only lead rows
│  ├─ pagination error + retry (retains rows)
│  ├─ load-more button
│  └─ paginating continuity state
└─ map-detail-shell.light-capsule
   ├─ close button
   ├─ detail loading
   ├─ public detail preview + non-realtime disclosure
   └─ detail error/unavailable recovery
```

## Structural invariants

- The surface is synthetic; no native `<map>`, `wx.getLocation`, marker binding, or `regionchange` exists.
- Initial loading may cover the empty surface. Refresh and pagination never hide already-loaded rows/markers.
- `EMPTY`, `SERVICE_UNAVAILABLE`, `RATE_LIMITED`, `SCHEMA_UNSUPPORTED`, and `UNAUTHORIZED` are different client phases.
- Detail selection is independent from root-query generation and uses its own monotonic selection generation.
- All displayed/cacheable domain data is copied through explicit public allowlist clones.
- New visual elements are neutral placeholders; final marker, sheet, badges, typography and motion are not frozen here.

## Reserved later-task regions

- Real map/list switch and complete bottom-sheet information architecture: TASK 16.
- Native `<map>`, GCJ-02 viewport events, location permission/manual city, overlay constraints and deep links: TASK 17.
- Clustering, weak-network behavior, signed-avatar refresh, package/render optimization: TASK 18.
- Release/pilot exposure controls: TASK 21/22.
