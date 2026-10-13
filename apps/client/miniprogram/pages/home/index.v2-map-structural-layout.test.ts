import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relativePath: string): string =>
  fs.readFileSync(path.join(root, relativePath), "utf8");
const wxml = read("apps/client/miniprogram/pages/home/index.wxml");
const wxss = read("apps/client/miniprogram/pages/home/index.wxss");
const appJson = JSON.parse(read("apps/client/miniprogram/app.json")) as {
  readonly pages: readonly string[];
};
const mapBlock = wxml.slice(
  wxml.indexOf(`currentView === 'map-preview'`),
  wxml.indexOf(`currentView === 'my'`),
);
const cssRule = (selector: string): string => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const match = wxss.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`, "u"));
  expect(match, `missing ${selector}`).not.toBeNull();
  return match?.[1] ?? "";
};

describe("TASK-V2-16A Founder map-only structural layout", () => {
  it("keeps the outside scrim's tap close reachable after observing touch start", () => {
    const tag = wxml
      .split("\n")
      .find((line) => line.includes('class="map-cluster-picker-scrim"'));
    expect(tag).toContain(
      'bindtouchstart="onMapClusterPickerOutsideTouchStart"',
    );
    expect(tag).not.toContain("catchtouchstart");
    expect(tag).toContain(
      'catchtouchmove="onMapClusterPickerOutsideTouchMove"',
    );
    expect(tag).toContain('catchtap="onMapClusterPickerOutsideDetailTap"');
  });

  it.each([
    "map-detail-shell map-detail-shell--info",
    "modal-card light-capsule map-cluster-picker-sheet",
  ])(
    "%s observes touch lifecycle without cancelling descendant taps",
    (surface) => {
      const tag = wxml
        .split("\n")
        .find((line) => line.includes(`class="${surface}`));
      expect(tag).toBeDefined();
      expect(tag).toContain('bindtouchstart="onMapOverlayTouchStart"');
      expect(tag).toContain('bindtouchend="onMapOverlayTouchEnd"');
      expect(tag).toContain('bindtouchcancel="onMapOverlayTouchEnd"');
      expect(tag).not.toContain("catchtouchstart");
      expect(tag).not.toContain("catchtouchend");
      expect(tag).toContain('catchtouchmove="onMapOverlayTouchMove"');
      expect(tag).toContain("catchtap=");
    },
  );

  it("keeps the scoped native-button reset", () => {
    const rule = cssRule(".map-control-button");
    for (const declaration of [
      "width: auto !important",
      "min-width: 0",
      "max-width: 100%",
      "box-sizing: border-box",
      "display: flex",
    ])
      expect(rule).toContain(declaration);
  });

  it("makes the map stage the full remaining page surface", () => {
    expect(cssRule(".page--map")).toContain("height: 100vh");
    expect(cssRule(".map-content-stage")).toContain("flex: 1 1 0");
    expect(cssRule(".map-surface-placeholder")).toContain("inset: 0");
    expect(cssRule(".map-surface-placeholder")).toContain("width: 100%");
    expect(cssRule(".map-surface-placeholder")).toContain("height: 100%");
  });

  it("keeps ordinary map UI in an explicit page surface above the native map", () => {
    const surfaceStart = mapBlock.indexOf('class="map-surface-layer"');
    const mapEnd = mapBlock.indexOf("</map>");
    expect(surfaceStart).toBeGreaterThan(mapEnd);
    expect(mapBlock.slice(surfaceStart)).toContain('class="map-top-overlay"');
    expect(mapBlock.slice(surfaceStart)).toContain('is="map-detail-card"');
    expect(wxml).toContain('<template name="map-detail-card">');
    const surface = cssRule(".map-surface-layer");
    expect(surface).toContain("position: absolute");
    expect(surface).toContain("z-index: 20");
    expect(surface).toContain("inset: 0");
    expect(surface).toContain("pointer-events: none");
    expect(cssRule(".map-top-overlay")).toContain("pointer-events: auto");
    expect(mapBlock).not.toContain('class="map-state-overlay"');
    expect(cssRule(".map-status-slot")).toContain("pointer-events: auto");
    expect(cssRule(".map-detail-shell")).toContain("pointer-events: auto");
    expect(wxss).not.toContain(":not(");
  });

  it("proves filter chips are materially thinner than search", () => {
    expect(cssRule(".map-search-capsule")).toContain("height: 44px");
    expect(cssRule(".map-filter")).toContain("height: 28px");
    expect(28 / 44).toBeLessThanOrEqual(0.72);
  });

  it("keeps filters white/black with a bright system-cyan selection outline", () => {
    const base = cssRule(".map-filter");
    const selected = cssRule(".map-filter--active");
    expect(base).toContain("background: rgba(255, 255, 255, 0.96)");
    expect(base).toContain("color: #111");
    expect(selected).toContain("border-color: #16d9bf");
    expect(selected).toContain("background: #f2fffc");
    expect(selected).toContain("color: #111");
  });

  it("does not ship the retired synthetic marker visual styles", () => {
    expect(wxss).not.toContain(".synthetic-marker");
    expect(wxss).not.toContain(".map-overlap-fireworks");
  });

  it("uses a bounded two-row card grid and map-anchored sheet", () => {
    expect(cssRule(".map-info-tier-grid")).toContain(
      "grid-template-rows: repeat(2, 54px)",
    );
    const shell = cssRule(".map-detail-shell");
    expect(shell).toContain("position: absolute");
    expect(shell).toContain("bottom: var(--map-interactive-bottom-inset)");
  });

  it("keeps locate and refresh floating with no list control", () => {
    expect(cssRule(".map-floating-controls")).toContain("position: absolute");
    expect(mapBlock).toContain("map-locate-control");
    expect(mapBlock).not.toContain("map-mode-switch");
    expect(mapBlock).not.toContain("map-list-shell");
    expect(mapBlock.indexOf('class="map-floating-controls"')).toBeLessThan(
      mapBlock.indexOf("</map>"),
    );
  });

  it("unmounts native map controls while any upper-layer dialog or detail is open", () => {
    const controlTag = mapBlock.match(
      /<cover-view wx:if="\{\{([^"}]+)\}\}" class="map-floating-controls"/u,
    )?.[1];
    expect(controlTag).toBeDefined();
    for (const condition of [
      "mapCardPhase === 'CLOSED'",
      "!mapClusterPickerOpen",
      "!modalView",
      "mapSheetMode === 'CLOSED'",
      "mapDetailPhase === 'IDLE'",
    ])
      expect(controlTag).toContain(condition);
    expect(mapBlock).toContain('bindtap="onMapRecenter"');
    expect(mapBlock).toContain('bindtap="onMapRefresh"');
  });

  it("keeps the bottom navigation in the page layer above native map content", () => {
    expect(mapBlock).not.toContain("bottom-nav");
    expect(wxml).toContain('class="bottom-nav light-capsule"');
    expect(wxss).toMatch(
      /\.bottom-nav\s*\{[^}]*position: fixed;[^}]*z-index: 1000;/su,
    );
  });

  it("retains one route and uses the formal native map host", () => {
    expect(appJson.pages).toEqual([
      "pages/home/index",
      "pages/bootstrap/index",
    ]);
    expect(mapBlock).toMatch(/<map(?:\s|>)/u);
  });
});
