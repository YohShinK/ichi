import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relativePath: string): string =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

describe("TASK-V2-14 existing V1 map host", () => {
  const ts = read("apps/client/miniprogram/pages/home/index.ts");
  const wxml = read("apps/client/miniprogram/pages/home/index.wxml");
  const appJson = JSON.parse(read("apps/client/miniprogram/app.json")) as {
    readonly pages: readonly string[];
    readonly tabBar?: unknown;
  };
  const projectConfig = JSON.parse(read("project.config.json")) as {
    readonly setting?: { readonly coverView?: boolean };
  };

  it("keeps the existing map tab and map-preview navigation relationship", () => {
    expect(wxml).toContain('data-tab="map"');
    expect(ts).toContain('currentView: "map-preview"');
    expect(ts).toContain('if (tab === "map")');
  });

  it("does not register a second map page or change the native TabBar", () => {
    expect(appJson.pages).toEqual([
      "pages/home/index",
      "pages/bootstrap/index",
    ]);
    expect(appJson.tabBar).toBeUndefined();
    expect(ts).not.toContain("isV2MapDevEntryAllowed");
  });

  it("uses the formal native map surface and keeps location permission optional", () => {
    expect(wxml).toContain('<map id="public-map"');
    expect(wxml).toContain('enable-zoom="true"');
    expect(wxml).toContain('enable-scroll="true"');
    expect(wxml).toContain('bindregionchange="onMapNativeRegionChange"');
    expect(ts).toContain('type: "gcj02"');
  });

  it("keeps native cover-view rendering enabled for map controls", () => {
    expect(projectConfig.setting?.coverView).toBe(true);
    const privateConfigPath = path.join(root, "project.private.config.json");
    if (!fs.existsSync(privateConfigPath)) return;
    const privateConfig = JSON.parse(
      fs.readFileSync(privateConfigPath, "utf8"),
    ) as { readonly setting?: { readonly coverView?: boolean } };
    expect(privateConfig.setting?.coverView).not.toBe(false);
  });

  it("renders the required low-fi regions and stable recovery controls", () => {
    for (const required of [
      "map-top-overlay",
      "map-brand",
      "map-search-capsule",
      "map-filter-row",
      "map-surface-placeholder",
      "map-floating-controls",
      "map-status-banner",
      "map-detail-shell",
      "map-marker-info-card",
      "map-surface-layer",
      "onMapRefresh",
      "onMapRetry",
      "onMapNativeMarkerTap",
    ]) {
      expect(wxml).toContain(required);
    }
  });

  it("uses map as the initial page while honoring explicit public tab routes", () => {
    expect(ts).toContain("const requestedTab = parsePublicShareTab(query);");
    expect(ts).toMatch(
      /Page\(\{\s*data: \{\s*currentView: "map-preview" as HomeView,\s*activeTab: "map" as MainTab/,
    );
    expect(ts).toContain(
      "currentView: publicEntryView(requestedTab, recognitionEntryView)",
    );
    expect(wxml).toContain('class="bottom-nav light-capsule"');
  });

  it("keeps the native map browsable under a compact initial loading status", () => {
    expect(wxml).toContain("正在加载公开线索，可先浏览地图");
    expect(wxml).toContain("mapPhase === 'INITIAL_LOADING'");
    expect(wxml).not.toContain('class="map-state-overlay"');
    expect(wxml).toContain("正在加载此区域，保留已有线索。");
    expect(wxml).toContain("map-detail-skeleton-tiers");
    expect(wxml).toContain("mapDetailPreview.totalRemainingLabel");
    expect(wxml).toContain("mapDetail || mapDetailPhase === 'LOADING'");
  });

  it("leaves empty map viewports browsable after recenter or pan", () => {
    const controls = wxml.match(
      /<cover-view wx:if="\{\{([^"}]+)\}\}" class="map-floating-controls"/u,
    )?.[1];
    expect(controls).toBeDefined();
    expect(controls).not.toContain("mapErrorMessage");
    expect(controls).not.toContain("mapDiscoveryEmptyReason");
    expect(controls).not.toContain("mapPhase");
    expect(controls).not.toContain("mapNativeRenderError");
    expect(controls).not.toContain("mapPhase !== 'EMPTY'");
    expect(controls).not.toContain("mapMarkers.length > 0");
    expect(wxml).not.toMatch(
      /wx:if="\{\{[^"}]*mapPhase === 'EMPTY'[^"}]*\}\}" class="map-state-overlay"/u,
    );
    expect(wxml).toContain(
      "mapDiscoveryEmptyReason && mapSelectedDiscoveryTagIds.length > 0",
    );
    const recoveryBar = wxml.match(
      /<view wx:elif="\{\{([^"}]*mapErrorMessage[^"}]+)\}\}" class="map-status-banner light-capsule"/u,
    )?.[1];
    expect(recoveryBar).toContain("mapErrorMessage");
    expect(recoveryBar).not.toContain("mapPhase !== 'EMPTY'");
    expect(wxml).not.toContain("地图状态需要恢复");
  });
});
