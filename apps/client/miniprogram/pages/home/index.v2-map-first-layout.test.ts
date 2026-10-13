import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relativePath: string): string =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const wxml = read("apps/client/miniprogram/pages/home/index.wxml");
const wxss = read("apps/client/miniprogram/pages/home/index.wxss");
const ts = read("apps/client/miniprogram/pages/home/index.ts");
const markerRenderer = read(
  "apps/client/miniprogram/platform/marker-canvas-renderer.ts",
);
const contract = read(
  "apps/client/miniprogram/platform/public-map-contract.ts",
);
const prototype = read(
  "apps/client/miniprogram/platform/public-map-discovery.ts",
);
const fixture = read(
  "apps/client/miniprogram/platform/public-map-synthetic-service.ts",
);
const mapBlock = wxml.slice(
  wxml.indexOf(`currentView === 'map-preview'`),
  wxml.indexOf(`currentView === 'my'`),
);

describe("TASK-V2-16A Founder map-first refinement", () => {
  it("removes the development header, city card, and manual viewport CTAs", () => {
    for (const removed of [
      "TASK-V2-16A · INTERACTION LOW-FI",
      "好版地图",
      "当前浏览范围",
      "上海 · 合成数据",
      "移动地图",
      "搜索此区域",
      "载入更多线索",
      "map-shell-header",
      "map-toolbar",
    ])
      expect(mapBlock).not.toContain(removed);
  });

  it("reuses the upright detail-card mascot beside an equal-height ICHI wordmark", () => {
    expect(mapBlock).toContain('class="map-top-overlay"');
    expect(mapBlock).toContain('class="map-info-mascot map-brand-mascot"');
    expect(mapBlock).toContain('class="map-info-mascot-eyes"');
    expect(mapBlock).toContain('class="map-info-round-eye"');
    expect(mapBlock).not.toContain(
      '<image src="/assets/v1-29/ichi-recognition-mascot.png"',
    );
    expect(mapBlock).toContain("<text>ICHI</text>");
    expect(wxss).toMatch(/\.map-top-overlay\s*\{[^}]*position: absolute/su);
    expect(wxss).toMatch(
      /\.map-top-overlay\s*\{[^}]*top: var\(--map-top-extension\);/su,
    );
    expect(wxss).toMatch(/\.map-brand\s*\{[^}]*background: transparent;/su);
    expect(wxss).toMatch(/\.map-brand\s*\{[^}]*box-shadow: none;/su);
    expect(wxss).toMatch(/\.map-brand\s*\{[^}]*font-size: 32px;/su);
    expect(wxss).toMatch(
      /\.map-brand \.map-brand-mascot\s*\{[^}]*height: 32px;[^}]*transform: none;/su,
    );
  });

  it("renders a searchable capsule and a conditional clear control", () => {
    expect(mapBlock).toContain(
      'class="map-search-leading-icon" src="/assets/icons/magnifying-glass-gray.svg"',
    );
    expect(mapBlock).toContain('placeholder="搜索 IP / 关键词"');
    expect(mapBlock).toContain('bindinput="onMapSearchInput"');
    expect(mapBlock).toContain('bindtap="onMapClearSearch"');
    expect(mapBlock).toContain('wx:if="{{mapSearchText}}"');
    expect(wxss).toMatch(
      /\.map-search-leading-icon\s*\{[^}]*width: 18px;[^}]*flex: 0 0 18px;/su,
    );
  });

  it("keeps search below the one V1 top-safe boundary", () => {
    expect(wxss).toMatch(
      /\.page--map\s*\{[^}]*--map-top-extension: 8px;[^}]*padding: calc\(var\(--top-safe-px\) - var\(--map-top-extension\)\) 0 0/su,
    );
    expect(wxss).toMatch(
      /\.map-top-overlay\s*\{[^}]*top: var\(--map-top-extension\);/su,
    );
  });

  it("fades the map into the interface background from the filter and nav edges", () => {
    expect(mapBlock).toContain('class="map-edge-fade map-edge-fade--top"');
    expect(mapBlock).toContain('class="map-edge-fade map-edge-fade--bottom"');
    expect(wxss).toMatch(
      /\.map-edge-fade\s*\{[^}]*position: absolute;[^}]*z-index: 2;[^}]*pointer-events: none;/su,
    );
    expect(wxss).toMatch(
      /\.map-edge-fade--top\s*\{[^}]*top: 0;[^}]*height: calc\(var\(--map-top-extension\) \+ 44px \+ 8px \+ 28px\);[^}]*linear-gradient\(/su,
    );
    expect(wxss).toMatch(
      /\.map-edge-fade--bottom\s*\{[^}]*bottom: 0;[^}]*height: calc\(var\(--bottom-nav-offset\) \+ var\(--bottom-nav-height\)\);[^}]*linear-gradient\(/su,
    );
    const mapFadeStyles = wxss.slice(
      wxss.indexOf(".map-edge-fade {"),
      wxss.indexOf(".map-floating-controls"),
    );
    expect(wxss).toContain("--map-interface-background: #e8e9e5");
    expect(mapFadeStyles).toContain("rgba(232, 233, 229, 0.96)");
    expect(mapFadeStyles).not.toContain("rgba(240, 242, 245, 0.96)");
  });

  it("uses horizontal multi-select discovery capsules", () => {
    expect(mapBlock).toContain('class="map-filter-scroll" scroll-x');
    expect(mapBlock).toContain('wx:for="{{mapDiscoveryTagOptions}}"');
    expect(mapBlock).toContain('bindtap="onMapToggleDiscoveryFilter"');
    expect(mapBlock).toContain('aria-pressed="{{item.selected}}"');
    expect(ts).toContain("ALL_PUBLIC_DISCOVERY_TAG_IDS");
  });

  it("keeps zero-selected explicit and show-all clears search too", () => {
    expect(ts).toContain("未选择筛选条件");
    expect(mapBlock).toContain('bindtap="onMapResetDiscoveryFilters"');
    const reset = ts.slice(
      ts.indexOf("onMapResetDiscoveryFilters()"),
      ts.indexOf("onMapBrowseMode", ts.indexOf("onMapResetDiscoveryFilters()")),
    );
    expect(reset).toContain(
      'updateMapDiscoveryPresentation("", ALL_PUBLIC_DISCOVERY_TAG_IDS)',
    );
    expect(reset).not.toContain('mapSearchText: ""');
  });

  it("uses public-label search and server-evaluated independent states", () => {
    expect(prototype).toContain("IP_SEARCH_PUBLIC_CONTRACT_GAP = false");
    expect(contract).not.toContain("searchKeyword");
    expect(contract).not.toContain("discoveryTags");
    expect(prototype.match(/SERVER_EVALUATED/gu)).toHaveLength(5);
  });

  it("never joins private search truth into the map host", () => {
    for (const privateField of [
      "privateP1",
      "rawOcr",
      "ownerAccountId",
      "avatarFileId",
      "verificationEvidence",
    ])
      expect(mapBlock).not.toContain(privateField);
  });

  it("observes live camera scale without invalidating marker presentation", () => {
    expect(mapBlock).toContain('bindregionchange="onMapNativeRegionChange"');
    const pan = ts.slice(
      ts.indexOf("onMapNativeRegionChange("),
      ts.indexOf("onMapRecenter", ts.indexOf("onMapSyntheticPanEnd()")),
    );
    expect(pan).toContain("setTimeout");
    expect(pan).toContain("180");
    expect(pan).toContain("getRegion");
    expect(pan).toContain("startNativeMapScaleSampling");
    expect(pan).toContain("observeNativeMapCameraScale");
    expect(pan).toContain('startNativeMapDeferredReconcile("PAN")');
    expect(ts).toContain("context.getScale");
    expect(ts).toContain("setTimeout(sample, 40)");
    expect(pan).not.toContain("mapNativeScale: scale");
    expect(pan).not.toContain("scheduleNativeMapPresentation");
    const refresh = ts.slice(
      ts.indexOf("refreshNativeMapPresentation("),
      ts.indexOf("onMapNativeUpdated("),
    );
    expect(refresh).not.toContain("mapNativeScale: effectiveScale");
    const updated = ts.slice(
      ts.indexOf("onMapNativeUpdated("),
      ts.indexOf("onMapNativeTap("),
    );
    expect(updated).toContain("if (this.data.mapNativeReady) return");
  });

  it("preserves search and filter state across pan and refresh", () => {
    const pan = ts.slice(
      ts.indexOf("onMapSyntheticPanEnd()"),
      ts.indexOf("onMapRecenter", ts.indexOf("onMapSyntheticPanEnd()")),
    );
    const refresh = ts.slice(
      ts.indexOf("onMapRefresh()"),
      ts.indexOf("onMapRetry()", ts.indexOf("onMapRefresh()")),
    );
    for (const source of [pan, refresh]) {
      expect(source).not.toContain('mapSearchText: ""');
      expect(source).not.toContain("mapSelectedDiscoveryTagIds:");
    }
    expect(refresh).toContain(".refresh()");
  });

  it("provides native locate and floating current-viewport refresh", () => {
    expect(mapBlock).toContain('class="map-floating-controls"');
    expect(mapBlock).toContain('bindtap="onMapRecenter"');
    expect(mapBlock).toContain('bindtap="onMapRefresh"');
    expect(mapBlock).toContain("/assets/icons/map-pin-black.png");
    expect(mapBlock).toContain(
      "/assets/icons/arrow-counter-clockwise-black.png",
    );
    expect(ts).toContain("requestNativeMapLocation");
    const mapMethods = ts.slice(
      ts.indexOf("onMapRefresh()"),
      ts.indexOf("onSelectTab", ts.indexOf("onMapRefresh()")),
    );
    expect(mapMethods).not.toContain("wx.getLocation");
  });

  it("keeps floating controls and the sheet above the interactive inset", () => {
    expect(wxss).toContain("--map-interactive-bottom-inset");
    expect(wxss).toMatch(
      /\.map-floating-controls\s*\{[^}]*position: absolute;[^}]*bottom: calc\(var\(--bottom-clearance\) \+ 56px\);[^}]*gap: 0;/su,
    );
    expect(wxss).toMatch(
      /\.map-floating-control-shell\s*\{[^}]*width: 48px;[^}]*height: 48px;[^}]*border: 1px solid rgba\(17, 17, 17, 0\.1\);[^}]*border-radius: 50%;[^}]*background: #fff;/su,
    );
    expect(wxss).toMatch(
      /\.map-floating-control image,[\s\S]*?\.map-floating-control cover-image\s*\{[^}]*width: 20px;[^}]*height: 20px;/su,
    );
    expect(wxss).toContain(
      ".map-floating-control-shell + .map-floating-control-shell { margin-top: 12px; }",
    );
    expect(wxss).toMatch(
      /\.map-detail-shell\s*\{[^}]*bottom: var\(--map-interactive-bottom-inset\)/su,
    );
  });

  it("extends the visual stage to the page bottom behind unchanged V1 nav", () => {
    expect(wxss).toMatch(/\.page--map\s*\{[^}]*height: 100vh/su);
    expect(wxss).toMatch(/\.map-surface-placeholder\s*\{[^}]*inset: 0/su);
    expect(wxss).toMatch(
      /\.map-surface-placeholder\s*\{[^}]*width: 100%;[^}]*height: 100%/su,
    );
    expect(mapBlock).not.toContain("bottom-nav");
    expect(wxml).toContain('class="bottom-nav light-capsule"');
    expect(wxml).toContain('data-tab="map"');
  });

  it("is map-only with no list-mode control or surface", () => {
    expect(mapBlock).not.toContain('class="map-mode-switch"');
    expect(mapBlock).not.toContain('data-mode="LIST"');
    expect(mapBlock).not.toContain("map-list-shell");
  });

  it("binds Canvas PNG markers to the native map without a CSS callout", () => {
    expect(mapBlock).toContain('markers="{{mapNativeDisplayMarkers}}"');
    expect(mapBlock).not.toContain('slot="callout"');
    expect(wxss).not.toContain(".native-marker-callout");
    expect(ts).toContain("projectNativeMapMarkers");
    expect(ts).toContain("resolveCanvasMarkerProjection");
    expect(markerRenderer).toContain("drawTightNumber");
  });

  it("shows cluster count in PNG and unresolved members in the picker", () => {
    expect(markerRenderer).toContain("clusterBadgeGeometry");
    expect(wxml).toContain("此位置有 {{mapClusterPickerItems.length}} 个版面");
    expect(ts).toContain("classifyClusterAtMaxScale");
    expect(ts).toContain("nativeMarkerClusterKey");
  });

  it("navigates the native camera and reconciles topology after settle", () => {
    expect(mapBlock).toContain('bindmarkertap="onMapNativeMarkerTap"');
    expect(mapBlock).not.toContain('slot="callout"');
    expect(ts).toContain("mapNativeScale: nextSplitScale");
    expect(ts).toContain("planNativeMapStableReconcile");
    expect(ts).toContain("publicMapNativeReconcileSessions");
    expect(ts).toContain('"PROGRAMMATIC_CAMERA_SETTLE"');
    expect(ts).toContain("publicMapNativeRegionGenerations");
    expect(ts).toContain("publicMapNativeCommitInFlight");
    expect(ts).toContain("publicMapNativePendingCommits");
    expect(mapBlock).toContain('bindrendererror="onMapNativeRenderError"');
    expect(wxss).not.toContain(".native-marker-callout");
    expect(mapBlock).not.toContain("mapNativeTransitionGhosts");
    expect(wxss).not.toContain(".map-transition-ghost");
    expect(ts).not.toContain("toScreenLocation");
    expect(ts).not.toContain("interpolateNativeMapTopologyProjection");
    expect(ts).not.toContain("NATIVE_MAP_DEFERRED_RECONCILE_MS");
    expect(ts).not.toContain("NATIVE_MAP_DEFERRED_RECONCILE_FRAME_COUNT");
  });

  it("keeps the zoom diagnostic logger disabled in the production path", () => {
    expect(ts).toContain("NATIVE_MAP_ZOOM_DIAGNOSTICS_ENABLED = false");
    expect(ts).toContain('"ZOOM_EVENT_RECEIVED"');
    expect(ts).toContain('"CAMERA_STATE_UPDATED"');
    expect(ts).toContain('"SCALE_CHANGE_CHECK"');
    expect(ts).toContain('"PRESENTATION_UPDATE_START"');
    expect(ts).toContain('"PROJECTION_REBUILD"');
    expect(ts).toContain('"MARKER_VIEW_GENERATED"');
    expect(ts).toContain('"NATIVE_BINDING_COMMIT"');
    expect(ts).toContain('"SET_DATA_COMMIT"');
    expect(ts).toContain('"SET_DATA_SKIPPED"');
    expect(ts).toContain('"NATIVE_MAP_RENDER"');
    expect(ts).toContain("commitsInLastSecond");
    expect(ts).toContain("projectionsInLastSecond");
    expect(ts).toContain("nativeBindingCommitsInLastSecond");
    expect(ts).toContain("nativeRendersInLastSecond");
    expect(ts).toContain("topologyGeneration");
    expect(ts).toContain("transitionGeneration");
    expect(ts).toContain("targetScale");
    expect(ts).toContain("observedScale");
    expect(ts).toContain("settledScale");
    expect(ts).toContain("presentationScale");
    expect(ts).toContain("targetPresentationScale");
    expect(ts).toContain('"RECONCILE_STARTED"');
    expect(ts).toContain('"RECONCILE_CANCELLED"');
    expect(ts).toContain('"RECONCILE_COMPLETED"');
    expect(ts).toContain('"STABLE_MARKER_COMMIT"');
    expect(ts).toContain("projectionGeneration");
    expect(ts).toContain("markerBindingCommit");
  });

  it("retains stable data and barriers intermediate native topology commits", () => {
    expect(ts).toContain("retainStablePublicMapMarkers");
    expect(ts).toContain("TRANSIENT_EMPTY_PROJECTION_RETAINED");
    expect(ts).toContain("NATIVE_MAP_TOPOLOGY_STABILITY_MS = 120");
    expect(ts).toContain("TOPOLOGY_COMMIT_BARRIER");
    expect(ts).toContain("publicMapNativeCommittedProjections");
    expect(ts).toContain("topologyBarrierGeneration");
    expect(ts).toContain(
      "const topologyChanged = barrier.signature !== signature",
    );
  });

  it("raises the synthetic exploration fixture to ten markers and two overlaps", () => {
    expect(fixture.match(/syntheticMarker\(\{/gu)).toHaveLength(10);
    expect(fixture.match(/overlapCount: 2/gu)).toHaveLength(4);
    expect(ts).toContain("pageLimit: 50");
  });

  it("keeps the single marker info card anchored to the map stage", () => {
    expect(mapBlock).toContain('is="map-detail-card"');
    expect(wxml).toContain('<template name="map-detail-card">');
    expect(wxss).toMatch(/\.map-detail-shell\s*\{[^}]*position: absolute/su);
    expect(wxml).toContain("map-marker-info-card");
    expect(mapBlock).not.toContain("map-detail-expanded");
    expect(mapBlock).not.toContain("查看完整");
  });

  it("excludes unsupported recommendation and probability promises", () => {
    for (const copy of [
      "LAST 上几率高",
      "大赏中奖率高",
      "容易中奖",
      "稳赚",
      "建议抽",
      "推荐包套",
    ])
      expect(mapBlock).not.toContain(copy);
  });

  it("uses native map without adding a second route or release redirect", () => {
    const appJson = JSON.parse(read("apps/client/miniprogram/app.json")) as {
      readonly pages: readonly string[];
    };
    expect(appJson.pages).toEqual([
      "pages/home/index",
      "pages/bootstrap/index",
    ]);
    expect(mapBlock).toMatch(/<map(?:\s|>)/u);
    expect(mapBlock).not.toContain("redirectTo");
  });

  it("keeps the map module independent from the My page render branch", () => {
    expect(wxml).toContain(
      `<view wx:if="{{currentView === 'map-preview'}}" class="page page--map"`,
    );
    expect(wxml).toContain(
      `<view wx:if="{{currentView === 'my'}}" class="page page--my"`,
    );
    expect(wxml).not.toContain(
      `<view wx:elif="{{currentView === 'my'}}" class="page page--my"`,
    );
  });
});
