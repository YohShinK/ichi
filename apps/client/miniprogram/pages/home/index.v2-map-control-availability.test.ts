import fs from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const wxml = fs.readFileSync(
  "apps/client/miniprogram/pages/home/index.wxml",
  "utf8",
);
const controls = wxml.match(
  /<cover-view wx:if="\{\{([^"}]+)\}\}" class="map-floating-controls"/u,
)?.[1];
const detail = wxml.match(
  /<view wx:if="\{\{([^"}]+)\}\}" class="map-detail-shell /u,
)?.[1];
const base = {
  mapCardPhase: "CLOSED",
  mapSheetMode: "CLOSED",
  mapDetailPhase: "IDLE",
  mapClusterPickerOpen: false,
  modalView: "",
  mapDiscoveryEmptyReason: "",
  mapSearchText: "",
  mapSelectedDiscoveryTagIds: ["UPLOAD_ONLY"],
  mapErrorMessage: "",
  mapErrorCode: "",
  mapNativeRenderError: "",
  mapPhase: "LOADED",
  mapLocationState: "IDLE",
  mapNativeReady: true,
};
// Exercise the actual shipped wx:if binding, rather than a parallel UI predicate.
const visible = (changes: Record<string, unknown> = {}) => {
  expect(controls).toBeDefined();
  return runInNewContext(`Boolean(${controls})`, { ...base, ...changes });
};

describe("map recovery controls stay available during browsing", () => {
  it.each([
    "INITIAL_IDLE",
    "INITIAL_LOADING",
    "LOADED",
    "EMPTY",
    "INITIAL_ERROR",
    "REFRESHING",
    "VIEWPORT_REFRESHING",
    "PAGINATING",
    "PAGINATION_ERROR",
    "STALE_CACHE",
    "RATE_LIMITED",
    "SERVICE_UNAVAILABLE",
    "SCHEMA_UNSUPPORTED",
    "UNAUTHORIZED",
    "CURSOR_RECOVERY",
  ])("keeps both recovery controls in %s", (mapPhase) => {
    expect(visible({ mapPhase })).toBe(true);
  });

  it.each([
    {
      mapDiscoveryEmptyReason: "所选状态暂无公开线索",
      mapLocationState: "APPROXIMATE",
    },
    {
      mapDiscoveryEmptyReason: "没有匹配此 IP / 关键词的公开线索",
      mapSearchText: "未匹配",
    },
    {
      mapDiscoveryEmptyReason: "未选择筛选条件",
      mapSelectedDiscoveryTagIds: [],
    },
    { mapErrorMessage: "服务暂不可用", mapErrorCode: "SERVICE_UNAVAILABLE" },
    { mapErrorMessage: "账号状态需要恢复", mapErrorCode: "UNAUTHORIZED" },
    { mapErrorMessage: "请求较多", mapErrorCode: "RATE_LIMITED" },
    { mapErrorMessage: "下一页失败", mapPhase: "PAGINATION_ERROR" },
    { mapNativeRenderError: "map render failed", mapNativeReady: false },
    { mapLocationState: "PERMISSION_NEEDED" },
    { mapLocationState: "UNAVAILABLE" },
    { mapLocationState: "LOADING" },
  ])("keeps recovery controls under status %j", (changes) => {
    expect(visible(changes)).toBe(true);
  });

  it("survives the screenshot combination of filter empty, approximate location and refresh failure", () => {
    expect(
      visible({
        mapDiscoveryEmptyReason: "所选状态暂无公开线索",
        mapLocationState: "APPROXIMATE",
        mapErrorMessage: "刷新失败",
        mapPhase: "INITIAL_LOADING",
      }),
    ).toBe(true);
  });

  it.each(["OPENING", "OPEN", "CLOSING"])(
    "removes controls only while the %s detail surface exists",
    (mapCardPhase) => {
      const state = {
        ...base,
        mapCardPhase,
        mapSheetMode: "PREVIEW",
        mapDetailPhase: "LOADING",
      };
      expect(runInNewContext(`Boolean(${detail})`, state)).toBe(true);
      expect(visible(state)).toBe(false);
      expect(visible({ ...state, mapSheetMode: "CLOSED" })).toBe(true);
      expect(visible({ ...state, mapDetailPhase: "IDLE" })).toBe(true);
      expect(visible({ ...state, mapCardPhase: "CLOSED" })).toBe(true);
    },
  );

  it.each([
    { mapClusterPickerOpen: true },
    { modalView: "map-contribution-consent" },
    { modalView: "account-unavailable" },
  ])(
    "suppresses native hit targets under an interactive overlay %j and restores on close",
    (overlay) => {
      expect(visible(overlay)).toBe(false);
      expect(visible()).toBe(true);
    },
  );

  it("preserves native bindings and the page-layer renderer recovery action", () => {
    const mapStart = wxml.indexOf('<map id="public-map"');
    const controlsStart = wxml.indexOf('class="map-floating-controls"');
    expect(controlsStart).toBeGreaterThan(mapStart);
    expect(controlsStart).toBeLessThan(wxml.indexOf("</map>", mapStart));
    expect(wxml).toContain('bindtap="onMapRecenter"');
    expect(wxml).toContain('bindtap="onMapRefresh"');
    expect(wxml).toContain('bindtap="onMapRefresh">重新载入</button>');
  });
});
