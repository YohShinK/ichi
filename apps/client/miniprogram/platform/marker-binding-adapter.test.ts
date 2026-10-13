import { describe, expect, it, vi } from "vitest";
import {
  canvasBindingForView,
  markerCanvasInputForView,
  resolveCanvasMarkerProjection,
} from "./marker-binding-adapter.js";
import {
  MARKER_CANVAS_ANCHOR,
  MARKER_CANVAS_HEIGHT,
  MARKER_CANVAS_WIDTH,
  createMarkerRenderKey,
  type MarkerCanvasRenderer,
} from "./marker-canvas-renderer.js";
import { MarkerImageCache } from "./marker-image-cache.js";
import { projectNativeMapMarkers } from "./public-map-native-presentation.js";
import type { PublicMapMarkerPresentation } from "./public-map-presentation.js";

const marker = (
  publicLeadId: string,
  latitude: number,
  longitude: number,
): PublicMapMarkerPresentation => ({
  publicLeadId,
  latitude,
  longitude,
  boardShortLabel: "咒术回战",
  totalRemainingLabel: "41",
  totalRemainingCompact: false,
  primaryDiscoveryTag: "LAST 机会",
  discoveryTagIds: [],
  markerStatusTone: "last",
  opportunityStatus: "GRAND_PRIZE_REMAINS",
  opportunityLabel: "高机会信息",
  freshnessBand: "RECENT",
  freshnessLabel: "近期观察",
  observedAtLabel: "刚刚",
  recordType: "DRAW_RECORD",
  recordTypeLabel: "抽赏记录",
  overlapCount: 0,
  overlapKey: `${latitude}:${longitude}`,
  sourceLabel: "",
  positionClass: "",
});

describe("Canvas marker binding adapter", () => {
  it("uses visual state for the render key, independent of coordinates and scale", () => {
    const low = projectNativeMapMarkers({
      markers: [marker("lead", 31.23, 121.47)],
      scale: 12,
      selectedPublicLeadId: "",
    }).views[0];
    const high = projectNativeMapMarkers({
      markers: [marker("lead", 32.11, 118.22)],
      scale: 18,
      selectedPublicLeadId: "",
    }).views[0];
    expect(low).toBeDefined();
    expect(high).toBeDefined();
    expect(createMarkerRenderKey(markerCanvasInputForView(low!))).toBe(
      createMarkerRenderKey(markerCanvasInputForView(high!)),
    );
    expect(
      createMarkerRenderKey(
        markerCanvasInputForView({ ...high!, selected: true }),
      ),
    ).not.toBe(createMarkerRenderKey(markerCanvasInputForView(high!)));
  });

  it("preserves marker identity and coordinates while replacing only its visual binding", async () => {
    const projection = projectNativeMapMarkers({
      markers: [marker("lead", 31.23, 121.47)],
      scale: 12,
      selectedPublicLeadId: "",
    });
    const render = vi.fn(async (input) => ({
      renderKey: createMarkerRenderKey(input),
      iconPath: "/tmp/marker.png",
      width: MARKER_CANVAS_WIDTH,
      height: MARKER_CANVAS_HEIGHT,
      anchor: MARKER_CANVAS_ANCHOR,
    }));
    const resolved = await resolveCanvasMarkerProjection({
      projection,
      cache: new MarkerImageCache(),
      renderer: { render } as unknown as MarkerCanvasRenderer,
    });
    const binding = resolved.bindings[0];

    expect(render).toHaveBeenCalledTimes(1);
    expect(binding).toMatchObject({
      id: projection.views[0]?.markerId,
      latitude: 31.23,
      longitude: 121.47,
      iconPath: "/tmp/marker.png",
      alpha: 1,
      width: MARKER_CANVAS_WIDTH,
      height: MARKER_CANVAS_HEIGHT,
    });
    expect(binding).not.toHaveProperty("customCallout");
  });

  it("reuses committed PNG bindings beyond the 192-entry LRU without stale visuals", async () => {
    const markers = Array.from({ length: 200 }, (_, index) => ({
      ...marker(`lead-${index}`, 31.23, 121.4 + index * 0.006),
      boardShortLabel: `测试版面 ${index}`,
    }));
    const projection = projectNativeMapMarkers({
      markers,
      scale: 18,
      detailLevel: 4,
      selectedPublicLeadId: "",
    });
    const cache = new MarkerImageCache();
    let exports = 0;
    const renderer = {
      render: vi.fn(async (input) => ({
        renderKey: createMarkerRenderKey(input),
        iconPath: `/tmp/generated-${++exports}.png`,
        width: MARKER_CANVAS_WIDTH,
        height: MARKER_CANVAS_HEIGHT,
        anchor: MARKER_CANVAS_ANCHOR,
      })),
    } as unknown as MarkerCanvasRenderer;
    const cold = await resolveCanvasMarkerProjection({
      projection,
      cache,
      renderer,
      adaptive: true,
    });
    expect(exports).toBe(200);
    expect(cache.size).toBe(192);

    const warm = await resolveCanvasMarkerProjection({
      projection,
      previousProjection: cold,
      cache,
      renderer,
      adaptive: true,
    });
    expect(exports).toBe(200);
    expect(warm.bindings).toEqual(cold.bindings);

    const selected = projectNativeMapMarkers({
      markers,
      scale: 18,
      detailLevel: 4,
      selectedPublicLeadId: "lead-0",
    });
    const changed = await resolveCanvasMarkerProjection({
      projection: selected,
      previousProjection: warm,
      cache,
      renderer,
      adaptive: true,
    });
    expect(exports).toBe(201);
    expect(changed.bindings[0]?.iconPath).not.toBe(warm.bindings[0]?.iconPath);
    expect(changed.invariant.valid).toBe(true);
  });

  it("uses the tail tip as anchor and keeps selected markers above peers", () => {
    const view = projectNativeMapMarkers({
      markers: [marker("lead", 31.23, 121.47)],
      scale: 12,
      selectedPublicLeadId: "lead",
    }).views[0]!;
    const binding = canvasBindingForView(view, {
      iconPath: "/tmp/selected.png",
      width: MARKER_CANVAS_WIDTH,
      height: MARKER_CANVAS_HEIGHT,
      anchor: MARKER_CANVAS_ANCHOR,
    });
    expect(binding.anchor).toEqual(MARKER_CANVAS_ANCHOR);
    expect(binding.zIndex).toBe(9);
  });

  it("renders a cluster asset with its member count", async () => {
    const collapsed = projectNativeMapMarkers({
      markers: [
        marker("lead-a", 31.23, 121.47),
        marker("lead-b", 31.23, 121.47),
      ],
      scale: 12,
      selectedPublicLeadId: "",
    });
    const cluster = collapsed.views[0]!;
    const render = vi.fn(async (input) => ({
      renderKey: createMarkerRenderKey(input),
      iconPath: "/tmp/cluster.png",
      width: MARKER_CANVAS_WIDTH,
      height: MARKER_CANVAS_HEIGHT,
      anchor: MARKER_CANVAS_ANCHOR,
    }));

    await resolveCanvasMarkerProjection({
      projection: collapsed,
      cache: new MarkerImageCache(),
      renderer: { render } as unknown as MarkerCanvasRenderer,
    });

    expect(cluster.kind).toBe("CLUSTER");
    expect(render).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "CLUSTER",
        clusterCount: 2,
        title: "咒术回战",
        statusLabel: "LAST 机会",
        statusTone: "last",
      }),
    );
  });
});
