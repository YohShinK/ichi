import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relativePath: string): string =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const wxml = read("apps/client/miniprogram/pages/home/index.wxml");
const wxss = read("apps/client/miniprogram/pages/home/index.wxss");
const mapBlock =
  wxml.slice(
    wxml.indexOf(`data-testid="page-map"`),
    wxml.indexOf(`currentView === 'my'`),
  ) +
  wxml.slice(
    wxml.indexOf('<template name="map-detail-card">'),
    wxml.indexOf('<template name="draft-row">'),
  );

const cssRule = (selector: string): string => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const match = wxss.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`, "u"));
  expect(match, `missing ${selector}`).not.toBeNull();
  return match?.[1] ?? "";
};

describe("TASK-V2-16C partial Gemini marker info card integration", () => {
  it("keeps one map-anchored information card with outside-tap dismissal", () => {
    expect(mapBlock).toContain('is="map-detail-card"');
    expect(mapBlock).toContain("map-marker-info-card");
    expect(mapBlock).toContain('bindtap="onMapNativeTap"');
    expect(read("apps/client/miniprogram/pages/home/index.ts")).toContain(
      'this.dismissNativeMapSelection("IDLE");',
    );
    expect(mapBlock).toContain('catchtap="onMapCardTap"');
    expect(mapBlock).not.toContain("map-detail-close");
    expect(mapBlock).not.toContain("map-detail-close-disc");
    expect(wxss).not.toContain(".map-detail-close");
    expect(mapBlock).not.toContain("map-detail-expanded");
    expect(mapBlock).not.toContain("查看完整");
    expect(mapBlock).not.toContain("公开详情");
  });

  it("reproduces the reference collapsed and expanded note interaction", () => {
    expect(mapBlock).toContain(
      "mapSheetMode === 'EXPANDED' ? 'map-detail-shell--note-expanded' : ''",
    );
    expect(mapBlock).toContain(
      "mapSheetMode === 'EXPANDED' ? 'map-info-player--expanded' : ''",
    );
    expect(mapBlock).not.toContain('bindtap="onMapToggleDetailInfo"');
    expect(mapBlock).toContain('catchtap="onMapToggleDetailInfo"');
    expect(mapBlock).toContain("map-info-detail-button");
    expect(mapBlock).toContain("map-info-expanded-content");
    expect(mapBlock).toContain(
      "aria-expanded=\"{{mapSheetMode === 'EXPANDED'}}\"",
    );

    const player = cssRule(".map-info-player");
    expect(player).toContain("height: 48px");
    expect(player).toContain("transition: height 300ms ease-in-out");
    expect(cssRule(".map-info-player--expanded")).toContain("height: 130px");
    expect(cssRule(".map-info-detail-button")).toContain("max-width: 100px");
    expect(
      cssRule(".map-info-player--expanded .map-info-detail-button"),
    ).toContain("max-width: 0");
    expect(cssRule(".map-info-expanded-content")).toContain("opacity: 0");
    expect(
      cssRule(".map-info-player--expanded .map-info-expanded-content"),
    ).toContain("opacity: 1");
  });

  it("uses the code-drawn round-eye mascot with an independent optional tag", () => {
    expect(mapBlock).toContain("map-info-decoration");
    expect(mapBlock).toContain("map-info-mascot-eyes");
    expect(mapBlock).toContain("map-info-round-eye");
    expect(mapBlock).not.toContain("map-info-star");
    expect(mapBlock).toContain('wx:if="{{mapDetail.primaryDiscoveryTag}}"');
    expect(cssRule(".map-info-mascot-anchor")).toContain("position: absolute");
    expect(cssRule(".map-info-mascot-anchor")).toContain("left: 0");
    expect(cssRule(".map-info-mascot-anchor")).toContain("bottom: 0");
    expect(cssRule(".map-info-mascot")).toContain("clip-path: polygon");
    expect(cssRule(".map-info-mascot")).toContain("90% 30%");
    expect(cssRule(".map-info-primary-tag")).toContain("position: absolute");
    expect(cssRule(".map-info-primary-tag")).toContain("left: 56px");
    expect(mapBlock).toContain("map-info-summary");
    expect(mapBlock).toContain("map-info-summary--draw");
    expect(mapBlock).toContain("map-info-summary-divider");
    expect(mapBlock).toContain("mapDetail.priceLabel");
    expect(mapBlock).toContain("mapDetail.fullPackCostValueLabel");
    expect(cssRule(".map-info-summary")).toContain("background: #fff");
    expect(cssRule(".map-info-summary--draw")).toContain(
      "rgba(255, 180, 50, 0.08)",
    );
    expect(cssRule(".map-info-summary--draw")).toContain("height: 81px");
    expect(cssRule(".map-info-summary--draw")).toContain("padding: 9px 21px");
    expect(cssRule(".map-info-summary--draw")).toContain(
      'font-family: "Montserrat"',
    );
    expect(cssRule(".map-info-summary-divider")).toContain("height: 46px");
    expect(cssRule(".map-info-summary-divider")).not.toContain(
      "position: absolute",
    );
    expect(cssRule(".map-info-title")).toContain("max-width: 145px");
    expect(cssRule(".map-info-count--compact")).toContain("font-size: 28px");
    expect(mapBlock).toContain("mapDetail.totalRemainingCompact");
  });

  it("grows the card upward when a marker detail card is inserted", () => {
    expect(cssRule(".map-detail-shell--card")).toContain(
      "animation: map-info-card-rise",
    );
    expect(cssRule(".map-detail-shell--card")).toContain(
      "transform-origin: center bottom",
    );
    expect(wxss).toContain("@keyframes map-info-card-rise");
    expect(wxss).toContain("translateY(18px) scaleY(0.94)");
    expect(cssRule(".map-detail-shell--closing")).toContain(
      "animation: map-info-card-fall",
    );
    expect(wxss).toContain("@keyframes map-info-card-fall");
  });

  it("uses a four-phase card lifecycle and resets detail on outside close", () => {
    const pageScript = read("apps/client/miniprogram/pages/home/index.ts");
    expect(pageScript).toContain(
      'type PublicMapCardPhase = "CLOSED" | "OPENING" | "OPEN" | "CLOSING"',
    );
    expect(pageScript).toContain('mapCardPhase: "CLOSING"');
    expect(pageScript).toContain('mapCardPhase: "CLOSED"');
    expect(pageScript).toContain(
      "this.ensurePublicMapClient().clearSelection()",
    );
    expect(pageScript).toContain('mapSheetMode: "PREVIEW" as const');
  });

  it("uses a horizontal column-first two-row prize grid with explicit zero/null states", () => {
    expect(mapBlock).toContain('class="map-info-tier-scroll" scroll-x');
    expect(mapBlock).toContain('bounces="{{true}}"');
    expect(mapBlock).toContain(
      "tier.isSoldOut ? 'map-info-tier--sold-out' : ''",
    );
    expect(mapBlock).toContain(
      "tier.isUnknown ? 'map-info-tier--unknown' : ''",
    );
    expect(mapBlock).toContain("完售");
    expect(mapBlock).toContain("{{tier.remainingLabel}}");
    expect(mapBlock).toContain("{{tier.probabilityLabel}}");
    expect(cssRule(".map-info-tier-probability")).toContain(
      "var(--map-info-cyan)",
    );
    expect(mapBlock).toContain("map-info-sold-overlay");

    const grid = cssRule(".map-info-tier-grid");
    expect(grid).toContain("grid-template-rows: repeat(2, 54px)");
    expect(grid).toContain("grid-auto-flow: column");
    expect(mapBlock).toContain("repeat({{mapDetail.tierColumnCount}}, 86px)");
  });

  it("keeps the detail card fixed while allowing only the tier rail to scroll", () => {
    expect(mapBlock).toContain(
      '<view wx:elif="{{mapDetail}}" class="map-marker-info-card">',
    );
    expect(mapBlock).not.toContain(
      '<scroll-view wx:elif="{{mapDetail}}" class="map-marker-info-card"',
    );
    expect(cssRule(".map-marker-info-card")).toContain("overflow: hidden");
  });

  it("adapts the dark player panel to truthful public note metadata", () => {
    expect(mapBlock).toContain("map-info-player");
    expect(mapBlock).toContain("mapDetail.contributorAvatars");
    expect(mapBlock).toContain("mapDetail.contributorName");
    expect(mapBlock).toContain("mapDetail.recordTimeLabel");
    expect(mapBlock).toContain("mapDetail.venueNotePreview");
    expect(mapBlock).toContain(
      "mapDetail.hasVenueNote && mapDetail.venueNoteBody",
    );
    expect(mapBlock).toContain("mapDetail.venueNote");
    expect(mapBlock).toContain("map-detail-disclosure");
    expect(cssRule(".map-info-player")).toContain("background: #191a20");
    expect(cssRule(".map-info-avatar")).toContain("width: 32px");
    expect(cssRule(".map-info-avatar")).toContain("height: 32px");
    expect(cssRule(".map-info-avatar-glow")).toContain("top: -2px");
    expect(cssRule(".map-info-avatar-glow")).toContain("filter: blur(2px)");
    expect(cssRule(".map-info-avatar-inner")).toContain("width: 32px");
    expect(cssRule(".map-info-player-meta")).toContain("var(--map-info-cyan)");
  });

  it("keeps report nonfunctional and derives only the supported probability metric", () => {
    expect(mapBlock).toContain("map-report-button");
    expect(mapBlock).not.toContain("onOpenMapReport");
    expect(mapBlock).toContain("举报");
    expect(mapBlock).not.toMatch(/likeCount|中奖率/u);
    expect(mapBlock).toContain("tier.probabilityLabel");
    expect(mapBlock).not.toContain("点赞数据暂不可用");
    expect(mapBlock).not.toContain("管理我的地图贡献");
  });

  it("keeps the card resilient for long notes and dense tiers", () => {
    expect(cssRule(".map-marker-info-card")).toContain("max-height:");
    expect(cssRule(".map-info-expanded-note")).toContain(
      "overflow-wrap: anywhere",
    );
    expect(cssRule(".map-info-tier-scroll")).toContain("width: 100%");
    expect(mapBlock).toContain("/assets/icons/file-text-gray.svg");
    expect(cssRule(".map-info-document-icon")).toContain("width: 14px");
  });

  it("uses reference proportions bounded only by the safe map viewport", () => {
    const shell = cssRule(".map-detail-shell");
    expect(shell).toContain("right: 20px");
    expect(shell).toContain("left: 20px");
    expect(shell).toContain("bottom: var(--map-interactive-bottom-inset)");
    const cardShell = cssRule(".map-detail-shell--card");
    expect(cardShell).toContain("--map-info-bottom-gap: 8px");
    expect(cardShell).toContain("--map-info-cyan: #2eead2");
    expect(cardShell).toContain("bottom: calc(");
    expect(cssRule(".map-marker-info-card")).toContain("height: 279px");
    expect(
      cssRule(".map-detail-shell--note-expanded .map-marker-info-card"),
    ).toContain("height: 361px");
  });
});
