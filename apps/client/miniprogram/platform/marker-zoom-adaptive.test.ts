import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fitMarkerPrefix,
  markerDetailLevel,
  markerGeometry,
  MarkerZoomThrottle,
  type MarkerDetailLevel,
} from "./marker-zoom-adaptive.js";
import {
  createMarkerRenderKey,
  drawMarkerCanvas,
  formatMarkerCanvasCount,
  markerRenderGeometry,
  MARKER_STATUS_TAG_INSET,
  type MarkerCanvasRenderer,
  type MarkerCanvasRenderInput,
} from "./marker-canvas-renderer.js";
import {
  LatestMarkerProjectionResolver,
  markerCanvasInputForView,
} from "./marker-binding-adapter.js";
import { MarkerImageCache } from "./marker-image-cache.js";
import {
  projectNativeMapMarkers,
  type NativeMapMarkerProjection,
} from "./public-map-native-presentation.js";
import type { PublicMapMarkerPresentation } from "./public-map-presentation.js";

const marker = (
  id: number,
  longitude = 121 + id * 0.03,
): PublicMapMarkerPresentation => ({
  publicLeadId: `lead-${id}`,
  latitude: 31,
  longitude,
  boardShortLabel: `宝可梦中心${id}`,
  totalRemainingLabel: "72",
  totalRemainingCompact: false,
  primaryDiscoveryTag: "刚刚拆套",
  discoveryTagIds: [],
  markerStatusTone: "split",
  opportunityStatus: "GRAND_PRIZE_REMAINS",
  opportunityLabel: "高机会信息",
  freshnessBand: "RECENT",
  freshnessLabel: "近期观察",
  observedAtLabel: "刚刚",
  recordType: "DRAW_RECORD",
  recordTypeLabel: "抽赏记录",
  overlapCount: 0,
  overlapKey: `31:${longitude}`,
  sourceLabel: "",
  positionClass: "",
});
const project = (
  scale: number,
  count = 1,
  previous?: NativeMapMarkerProjection,
) =>
  projectNativeMapMarkers({
    markers: Array.from({ length: count }, (_, i) => marker(i)),
    scale,
    detailLevel: markerDetailLevel(scale),
    selectedPublicLeadId: "",
    ...(previous ? { previousTopology: previous.topology } : {}),
  });
const asset = (input: MarkerCanvasRenderInput) => ({
  renderKey: createMarkerRenderKey(input),
  iconPath: `/tmp/${createMarkerRenderKey(input)}.png`,
  ...markerGeometry(input.detailLevel),
});
afterEach(() => vi.useRealTimers());

describe("PNG zoom visual contract", () => {
  it("keeps five levels and suppresses oscillation around each threshold", () => {
    expect(
      [9, 12, 14, 16, 18].map((scale) => markerDetailLevel(scale)),
    ).toEqual([0, 1, 2, 3, 4]);
    let level: MarkerDetailLevel = 1;
    for (const scale of [13.49, 13.51, 13.55, 13.48])
      level = markerDetailLevel(scale, level);
    expect(level).toBe(1);
    expect(markerDetailLevel(13.7, level)).toBe(2);
    expect(markerDetailLevel(9, 4)).toBe(0);
    expect(markerDetailLevel(18, 0)).toBe(4);
  });

  it("keeps one real title/status character instead of ellipsis at every width", () => {
    const measure = (text: string) => Array.from(text).length * 11;
    expect(fitMarkerPrefix("宝可梦中心", 14, measure)).toBe("宝");
    expect(fitMarkerPrefix("宝可梦中心", 29, measure)).toBe("宝可");
    expect(fitMarkerPrefix("宝可梦中心", 44, measure)).toBe("宝可梦中");
    expect(fitMarkerPrefix("宝可梦中心", 74, measure)).toBe("宝可梦中心");
    expect(fitMarkerPrefix("🎁新赏", 1, measure)).toBe("🎁");
  });

  it("holds the numeric block/tip fixed and contains badge/stroke at all widths", () => {
    for (const level of [0, 1, 2, 3, 4] as const) {
      const g = markerGeometry(level);
      expect(g.anchor.x * g.width).toBeCloseTo(28);
      expect(g.anchor.y * g.height).toBe(66);
      expect(g.badgeX + 9).toBeLessThan(g.width);
      expect(g.cardWidth).toBeGreaterThan(32);
      const text: string[] = [];
      const c = new Proxy(
        {
          measureText: (s: string) => ({ width: [...s].length * 11 }),
          fillText: (s: string) => text.push(s),
        },
        {
          get(target, name) {
            return Reflect.get(target, name) ?? (() => undefined);
          },
        },
      );
      drawMarkerCanvas(c as unknown as Parameters<typeof drawMarkerCanvas>[0], {
        detailLevel: level,
        kind: "LEAD",
        countLabel: "72",
        title: "宝可梦中心",
        statusLabel: "刚刚拆套",
        statusTone: "split",
        selected: true,
        clusterCount: 1,
      });
      expect(text).toHaveLength(2);
      expect(text.every((s) => s.length > 0 && s !== "…")).toBe(true);
    }
  });

  it("uses only discrete visual state in keys; fixed mode stays full width", () => {
    const a = project(14).views[0]!;
    const b = project(14.1).views[0]!;
    expect(createMarkerRenderKey(markerCanvasInputForView(a, true))).toBe(
      createMarkerRenderKey(markerCanvasInputForView(b, true)),
    );
    expect(
      createMarkerRenderKey(
        markerCanvasInputForView(project(18).views[0]!, true),
      ),
    ).not.toBe(createMarkerRenderKey(markerCanvasInputForView(a, true)));
    expect(markerCanvasInputForView(a).detailLevel).toBeUndefined();
    expect(markerGeometry().width).toBe(140);
  });

  it("isolates picker dimensions from native marker geometry and cached PNGs", () => {
    const input = markerCanvasInputForView(project(18).views[0]!);
    const picker = { ...input, surface: "PICKER" as const, pickerWidth: 308 };
    expect(markerRenderGeometry(input)).toMatchObject({
      width: 140,
      height: 72,
      anchor: { x: 0.2, y: 66 / 72 },
    });
    expect(markerRenderGeometry(picker)).toMatchObject({
      width: 308,
      height: 60,
    });
    expect(createMarkerRenderKey(picker)).not.toBe(
      createMarkerRenderKey(input),
    );
    expect(createMarkerRenderKey({ ...picker, pickerWidth: 270 })).not.toBe(
      createMarkerRenderKey(picker),
    );
  });

  it("pads one-digit counts and keys picker images by all visible tags", () => {
    const mapInput = markerCanvasInputForView(project(18).views[0]!);
    expect(formatMarkerCanvasCount("8")).toBe("08");
    expect(formatMarkerCanvasCount("0")).toBe("00");
    expect(formatMarkerCanvasCount("10")).toBe("10");
    expect(formatMarkerCanvasCount("—")).toBe("—");
    expect(createMarkerRenderKey({ ...mapInput, countLabel: "8" })).toBe(
      createMarkerRenderKey({ ...mapInput, countLabel: "08" }),
    );
    const picker = {
      ...mapInput,
      surface: "PICKER" as const,
      statusTags: [{ label: "LAST 机会", tone: "last" as const }],
    };
    expect(MARKER_STATUS_TAG_INSET).toBe(4);
    expect(createMarkerRenderKey(picker)).not.toBe(
      createMarkerRenderKey({
        ...picker,
        statusTags: [
          ...picker.statusTags,
          { label: "大赏存量足", tone: "grand" },
        ],
      }),
    );
  });
});

describe("adaptive topology and scheduling", () => {
  it("splits/merges on zoom without pan and preserves every public identity", () => {
    const markers = [marker(0, 121), marker(1, 121.003)];
    let previous: NativeMapMarkerProjection | undefined;
    const lengths: number[] = [];
    for (const scale of [9, 12, 14, 16, 18, 16, 14, 12, 9]) {
      previous = projectNativeMapMarkers({
        markers,
        scale,
        detailLevel: markerDetailLevel(scale),
        selectedPublicLeadId: "",
        ...(previous ? { previousTopology: previous.topology } : {}),
      });
      expect(previous.invariant.valid).toBe(true);
      expect(previous.views.flatMap((v) => v.memberLeadIds).sort()).toEqual([
        "lead-0",
        "lead-1",
      ]);
      lengths.push(previous.views.length);
    }
    expect(lengths[0]).toBe(1);
    expect(lengths[4]).toBe(2);
    expect(lengths.at(-1)).toBe(1);
  });

  it("uses PNG footprint, not old callout dimensions", () => {
    const markers = [
      marker(0, 121),
      marker(1, 121 + (100 * 360) / (256 * 2 ** 14)),
    ];
    const render = (detailLevel: MarkerDetailLevel) =>
      projectNativeMapMarkers({
        markers,
        scale: 14,
        detailLevel,
        selectedPublicLeadId: "",
      });
    expect(render(0).views).toHaveLength(2);
    expect(render(4).views).toHaveLength(1);
  });

  it("retains exact-overlap spiderfy and real coordinates", () => {
    const markers = [marker(0, 121), marker(1, 121)];
    const collapsed = projectNativeMapMarkers({
      markers,
      scale: 18,
      detailLevel: 4,
      selectedPublicLeadId: "",
    });
    expect(collapsed.views[0]?.exactOverlap).toBe(true);
    const open = projectNativeMapMarkers({
      markers,
      scale: 18,
      detailLevel: 4,
      selectedPublicLeadId: "lead-0",
      spiderfyClusterKey: collapsed.views[0]!.clusterKey,
    });
    expect(open.views).toHaveLength(2);
    expect(
      open.views.every((v) => v.realLongitude === 121 && v.spiderfied),
    ).toBe(true);
    expect(open.views.find((v) => v.publicLeadId === "lead-0")?.selected).toBe(
      true,
    );
  });

  it("bounds a rapid pinch+pan stream to a single latest callback per 180ms", () => {
    vi.useFakeTimers();
    const throttle = new MarkerZoomThrottle();
    const values: number[] = [];
    for (let i = 0; i < 100; i++) {
      throttle.request(() => values.push(i));
      vi.advanceTimersByTime(10);
    }
    vi.advanceTimersByTime(180);
    expect(values).toHaveLength(6);
    expect(values.at(-1)).toBe(99);
    throttle.request(() => values.push(100));
    throttle.cancel();
    vi.runAllTimers();
    expect(values.at(-1)).toBe(99);
  });

  it("abandons obsolete image batches after the active image, then serves latest topology", async () => {
    let release!: () => void;
    const wait = new Promise<void>((resolve) => {
      release = resolve;
    });
    const render = vi.fn(async (input: MarkerCanvasRenderInput) => {
      await wait;
      return asset(input);
    });
    const resolver = new LatestMarkerProjectionResolver();
    const shared = {
      cache: new MarkerImageCache(),
      renderer: { render } as unknown as MarkerCanvasRenderer,
      adaptive: true,
    };
    const first = resolver.resolve({ ...shared, projection: project(14, 30) });
    await Promise.resolve();
    const obsolete = resolver.resolve({
      ...shared,
      projection: project(16, 30),
    });
    const latest = resolver.resolve({ ...shared, projection: project(18, 1) });
    release();
    expect(await first).toBeNull();
    expect(await obsolete).toBeNull();
    expect((await latest)?.scale).toBe(18);
    expect(render).toHaveBeenCalledTimes(2);
  });

  it.each([10, 30, 100])(
    "reuses %i visible markers during repeated scale/pan observations",
    async (count) => {
      const cache = new MarkerImageCache();
      const render = vi.fn(async (input: MarkerCanvasRenderInput) =>
        asset(input),
      );
      const resolver = new LatestMarkerProjectionResolver();
      for (const scale of [18, 17.95, 18, 17.98]) {
        const resolved = await resolver.resolve({
          projection: project(scale, count),
          cache,
          renderer: { render } as unknown as MarkerCanvasRenderer,
          adaptive: true,
        });
        expect(resolved?.bindings).toHaveLength(count);
        expect(resolved?.invariant.valid).toBe(true);
      }
      expect(render).toHaveBeenCalledTimes(count);
      expect(cache.diagnostics).toMatchObject({
        misses: count,
        hits: count * 3,
        pending: 0,
      });
    },
  );
});
