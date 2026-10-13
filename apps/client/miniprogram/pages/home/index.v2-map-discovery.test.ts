import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relativePath: string): string =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const ts = read("apps/client/miniprogram/pages/home/index.ts");
const wxml = read("apps/client/miniprogram/pages/home/index.wxml");
const wxss = read("apps/client/miniprogram/pages/home/index.wxss");
const discovery = read(
  "apps/client/miniprogram/platform/public-map-discovery.ts",
);
const mapBlock = wxml.slice(
  wxml.indexOf(`currentView === 'map-preview'`),
  wxml.indexOf(`currentView === 'my'`),
);
const detailTemplate = wxml.slice(
  wxml.indexOf('<template name="map-detail-card">'),
  wxml.indexOf('<template name="draft-row">'),
);

describe("TASK-V2-16A Founder map-only discovery UI", () => {
  it("keeps zero filters and search misses in the shared status bar", () => {
    expect(wxml).not.toContain("map-discovery-empty-layer");
    expect(mapBlock).toContain(
      "mapDiscoveryEmptyReason && mapSelectedDiscoveryTagIds.length === 0",
    );
    expect(mapBlock).toContain(
      "mapDiscoveryEmptyReason && mapSelectedDiscoveryTagIds.length > 0",
    );
    const statuses = mapBlock.slice(
      mapBlock.indexOf('class="map-status-slot"'),
    );
    expect(statuses).toContain(
      'class="map-status-action" bindtap="onMapResetDiscoveryFilters"',
    );
    expect(statuses).not.toContain('bindtap="onMapClearSearch"');
  });

  it.each([
    "map-top-overlay",
    "map-brand",
    "map-search-capsule",
    "map-filter-row",
    "map-surface-placeholder",
    "map-floating-controls",
    "map-detail-shell",
    "map-marker-info-card",
    "map-info-tier-grid",
  ])("renders current low-fi region %s", (region) => {
    expect(mapBlock + detailTemplate).toContain(region);
    expect(wxss).toContain(`.${region}`);
  });

  it("removes the superseded map/list and expanded-detail UI", () => {
    for (const removed of [
      "map-mode-switch",
      "map-list-shell",
      'data-mode="LIST"',
      "onMapBrowseMode",
      "onMapExpandDetail",
      "查看完整",
      "公开详情",
      "map-detail-expanded",
    ])
      expect(mapBlock).not.toContain(removed);
  });

  it("keeps search, multi-select filters, pan, locate and refresh", () => {
    for (const handler of [
      "onMapClearSearch",
      "onMapToggleDiscoveryFilter",
      "onMapResetDiscoveryFilters",
      "onMapNativeMarkerTap",
      "onMapRecenter",
      "onMapRefresh",
    ]) {
      expect(mapBlock).toContain(handler);
      expect(ts).toContain(`${handler}(`);
    }
    expect(mapBlock).toContain('bindinput="onMapSearchInput"');
    expect(mapBlock).toContain('bindregionchange="onMapNativeRegionChange"');
    expect(mapBlock).toContain('bindmarkertap="onMapNativeMarkerTap"');
    expect(mapBlock).not.toContain('slot="callout"');
    const mapEnd = mapBlock.indexOf("</map>");
    expect(mapBlock.indexOf('class="map-floating-controls"')).toBeLessThan(
      mapEnd,
    );
    expect(mapBlock).toContain('class="map-floating-controls"');
    expect(mapBlock).toContain("<cover-image");
  });

  it("exposes later pages and tells users when a dense viewport was truncated", () => {
    expect(mapBlock).toContain('bindtap="onMapLoadMore"');
    expect(mapBlock).toContain("mapHasMore && mapPhase === 'LOADED'");
    expect(mapBlock).toContain("mapTruncated && mapPhase === 'LOADED'");
    expect(ts).toContain("!client.state.truncated &&");
    expect(ts).toContain("!client.state.nextCursor");
  });

  it("zooms naturally separable clusters and offers a picker only for unresolved overlaps", () => {
    expect(mapBlock).toContain('bindmarkertap="onMapNativeMarkerTap"');
    expect(mapBlock).not.toContain('slot="callout"');
    expect(mapBlock).not.toContain("map-overlap-scroll");
    expect(mapBlock).not.toContain("mapOverlapItems.length}} 条线索");
    expect(mapBlock).not.toContain('aria-label="关闭重叠线索"');
    expect(ts).toContain("projectNativeMapMarkers");
    expect(ts).toContain("mapNativeScale: nextSplitScale");
    expect(ts).toContain("classifyClusterAtMaxScale");
    expect(ts).not.toContain("publicMapNativeSpiderfyClusters.set(this");
    expect(ts).toContain("mapNativeMarkerViews: immediateMarkerViews");
    expect(wxml).toContain("此位置有 {{mapClusterPickerItems.length}} 个版面");
    expect(wxml).not.toContain("选择一个查看详情。");
    expect(wxml).toContain("modal-head map-cluster-picker-head");
    expect(wxml).toContain(
      "currentView === 'map-preview' && mapClusterPickerOpen",
    );
    expect(mapBlock).not.toContain("map-overlap-selector");
    expect(ts).not.toContain("onMapOverlapOptionTap");
  });

  it("uses five PNG text levels instead of density bands", () => {
    expect(mapBlock).not.toContain("item.density");
    expect(mapBlock).not.toContain("item.showSecondaryText");
    expect(ts).toContain("markerDetailLevel(");
    expect(ts).toContain("PNG_MARKER_ZOOM_ADAPTIVE_ENABLED");
    expect(ts).toContain("deriveMarkerRightWidth");
    expect(ts).not.toContain("getInteractionLevel");
  });

  it("mounts the native map only inside the map module", () => {
    expect(wxml).toContain(
      `<view wx:if="{{currentView === 'map-preview'}}" class="page page--map"`,
    );
    expect(wxss).not.toContain(".page--map-retained-hidden");
    expect(ts).toContain("deactivateNativeMapSurface");
    expect(ts).toContain("activateNativeMapSurface");
  });

  it("uses the requested fixed-all and five emoji display filters", () => {
    expect(discovery).toContain('label: "LAST 机会"');
    expect(discovery).toContain('label: "大赏存量足"');
    expect(discovery).toContain('label: "大赏占比高"');
    expect(discovery).toContain('label: "刚刚拆套"');
    expect(discovery).toContain('label: "低机会信息"');
    expect(mapBlock).toContain("🔥 显示全部");
    expect(mapBlock).toContain("{{item.emoji}} {{item.label}}");
    expect(mapBlock).not.toContain("全部恢复");
    expect(discovery).not.toContain('label: "更易包套"');
    expect(discovery).not.toContain('label: "大奖占比较高"');
    expect(discovery).not.toContain('label: "近期更新"');
    expect(wxss).toMatch(/\.map-filter-scroll\s*\{[^}]*height: 34px/su);
    expect(wxss).toContain("padding: 2px 4px 4px 2px");
  });

  it("moves a tapped lead to the detail-card contact target before opening its card", () => {
    expect(ts).toContain("NATIVE_MARKER_DETAIL_TARGET_OFFSET_Y_PX = 72");
    expect(ts).toContain("offsetPublicMapCoordinate(");
    expect(ts).toContain(
      "this.openSelectedMapLead(selected.publicLeadId, selected)",
    );
    expect(ts).toContain('mapNativeInteractionState: "CAMERA_ANIMATING"');
  });

  it("uses the Canvas PNG tip anchor without old CSS marker layers", () => {
    expect(ts).toContain("resolveCanvasMarkerProjection");
    expect(mapBlock).not.toContain("native-marker-tail");
    expect(wxss).not.toContain(".native-marker-callout");
  });

  it("lets a different lead preempt an in-flight detail camera move", () => {
    expect(ts).toContain("const switchingLeadDuringCamera =");
    expect(ts).toContain("const switchingClusterDuringCamera =");
    expect(ts).toContain("publicMapNativeCameraFallbackTimers.delete(this)");
    expect(ts).toContain("publicMapNativePendingClusters.delete(this)");
    expect(ts).toContain("this.clearNativeMapTransition()");
    expect(ts.indexOf("const switchingLeadDuringCamera =")).toBeLessThan(
      ts.indexOf("const immediateMarkerViews ="),
    );
  });

  it("allows a cluster tap to preempt an open lead detail and start expansion", () => {
    expect(ts).toContain("const switchingClusterDuringCamera");
    expect(ts).toContain("this.ensurePublicMapClient().clearSelection();");
    expect(ts).toContain('mapCardPhase: "CLOSED" as const');
    expect(ts).toContain("findPublicMapClusterExpansionScale({");
    expect(ts).toContain("const isClusterExpansion");
    expect(ts).toContain("previous && !isClusterExpansion");
    expect(ts).not.toMatch(
      /findPublicMapClusterExpansionScale\(\{[\s\S]*?previousTopology: projection\.topology/su,
    );
  });

  it("uses native marker tap without a custom-callout touch branch", () => {
    expect(ts).toContain("onMapNativeMarkerTap(");
    expect(ts).not.toContain("onMapNativeMarkerTouchCancel()");
    expect(ts).not.toContain("onMapNativeCalloutTap(");
  });

  it("suppresses a PNG markertap emitted during or just after a map gesture", () => {
    const regionHandler = ts.slice(ts.indexOf("onMapNativeRegionChange("));
    expect(regionHandler).toContain(
      "if (!isCameraCommand)\n        publicMapNativeMarkerTapSuppressedUntil.set(this, Date.now() + 10_000)",
    );
    expect(regionHandler).toContain(
      'publicMapNativeGestureSessions.get(this)?.kind === "PROGRAMMATIC"',
    );
    expect(regionHandler).toContain("if (!endingProgrammaticCamera)");
    expect(regionHandler).toContain(
      "publicMapNativeMarkerTapSuppressedUntil.set(this, Date.now() + 350)",
    );
  });

  it("renders one public-safe information card with no management CTA", () => {
    expect(mapBlock).toContain('is="map-detail-card"');
    expect(detailTemplate).toContain("mapDetail.displayIpTheme");
    expect(detailTemplate).toContain("mapDetail.totalRemainingValueLabel");
    expect(detailTemplate).toContain("mapDetail.primaryDiscoveryTag");
    expect(detailTemplate).toContain(
      "mapDetail.hasVenueNote && mapDetail.venueNoteBody",
    );
    expect(detailTemplate).toContain('wx:for="{{mapDetail.tiers}}"');
    expect(detailTemplate).toContain(
      'wx:if="{{mapDetail.fullPackCostValueLabel}}"',
    );
    expect(detailTemplate).not.toContain("管理我的地图贡献");
    expect(detailTemplate).not.toContain("map-detail-owner-actions");
  });

  it("routes report directly and removes the like placeholder", () => {
    expect(detailTemplate).toContain("map-report-button");
    expect(detailTemplate).toContain("onToggleMapReport");
    expect(detailTemplate).not.toContain("marker-heart-outline");
    expect(detailTemplate).not.toContain("map-info-secondary");
    expect(wxml).not.toContain(`modalView === 'map-report'`);
  });

  it("passes report state into every detail card so both cancel surfaces stay synchronized", () => {
    const cards = [
      ...wxml.matchAll(/<template\b[^>]*\bis="map-detail-card"[^>]*>/gu),
    ];
    expect(cards).toHaveLength(2);
    for (const [card] of cards) {
      expect(card).toContain("mapReportActive: mapReportActive");
      expect(card).toContain("mapReportBusy: mapReportBusy");
    }
    expect(detailTemplate).toContain("mapReportActive ? '已举报' : '举报'");
    expect(detailTemplate).toContain('disabled="{{mapReportBusy}}"');
  });

  it("keeps selection identity and frozen public detail split", () => {
    expect(mapBlock).toContain('markers="{{mapNativeDisplayMarkers}}"');
    expect(ts).toContain("selected.publicLeadId");
    expect(ts).toContain("nativeMarkerClusterKey");
    expect(ts).toContain("selectLead(publicLeadId)");
  });

  it("does not introduce private render fields or a second route", () => {
    for (const field of [
      "accountId",
      "openid",
      "avatarFileId",
      "verificationEvidence",
    ])
      expect(mapBlock).not.toContain(field);
    expect(mapBlock).toMatch(/<map(?:\s|>)/u);
    expect(mapBlock).not.toContain("navigateTo");
  });
});
