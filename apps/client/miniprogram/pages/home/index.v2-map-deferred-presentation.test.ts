import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  beginNativeMapPresentationReconcile,
  cancelNativeMapPresentationReconcile,
  completeNativeMapPresentationReconcile,
  createNativeMapCameraScaleState,
  needsNativeMapPresentationReconcile,
  withNativeMapObservedScale,
} from "../../platform/public-map-render-scheduler.js";

const root = process.cwd();
const read = (relativePath: string): string =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const ts = read("apps/client/miniprogram/pages/home/index.ts");
const wxml = read("apps/client/miniprogram/pages/home/index.wxml");

describe("TASK-V2-17 zoom deferred marker presentation", () => {
  it("freezes presentation through repeated pinch observations", () => {
    const observed = [12.5, 13, 14].reduce(
      (state, scale, index) =>
        withNativeMapObservedScale(state, {
          scale,
          source: "GET_SCALE_SAMPLE",
          at: 100 + index * 40,
        }),
      createNativeMapCameraScaleState(12),
    );

    expect(observed.observedScale).toBe(14);
    expect(observed.presentationScale).toBe(12);
    expect(observed.targetPresentationScale).toBeNull();
    expect(needsNativeMapPresentationReconcile(observed)).toBe(true);
  });

  it("creates one pan reconcile from the frozen scale to the latest observation", () => {
    const observed = withNativeMapObservedScale(
      createNativeMapCameraScaleState(12),
      { scale: 14, source: "REGION_CHANGE_END", at: 200 },
    );
    const started = beginNativeMapPresentationReconcile(observed);
    const completed = completeNativeMapPresentationReconcile(started);

    expect(started).toMatchObject({
      presentationScale: 12,
      targetPresentationScale: 14,
    });
    expect(completed).toMatchObject({
      observedScale: 14,
      presentationScale: 14,
      targetPresentationScale: null,
    });
  });

  it("does not create a reconcile for an ordinary pan without a scale gap", () => {
    expect(
      needsNativeMapPresentationReconcile(createNativeMapCameraScaleState(12)),
    ).toBe(false);
  });

  it("cancels an old target and keeps its last committed visual scale", () => {
    const started = beginNativeMapPresentationReconcile(
      withNativeMapObservedScale(createNativeMapCameraScaleState(12), {
        scale: 14,
        source: "GET_SCALE_SAMPLE",
        at: 100,
      }),
    );
    const cancelled = cancelNativeMapPresentationReconcile(started, 12.8);

    expect(cancelled).toMatchObject({
      observedScale: 14,
      presentationScale: 12.8,
      targetPresentationScale: null,
    });
  });

  it("routes adaptive observations through throttling while preserving the fixed fallback gates", () => {
    const observe = ts.slice(
      ts.indexOf("observeNativeMapCameraScale("),
      ts.indexOf(
        "\n  schedulePngMarkerZoomProjection()",
        ts.indexOf("observeNativeMapCameraScale("),
      ),
    );
    expect(observe).not.toContain("projectNativeMapPresentationAtScale");
    expect(observe).not.toContain("commitNativeMapProjection");
    expect(observe).toContain("PNG_MARKER_ZOOM_ADAPTIVE_ENABLED");
    expect(observe).toContain("this.schedulePngMarkerZoomProjection()");
    expect(ts).toContain('startNativeMapDeferredReconcile("PAN")');
    expect(ts).toContain('"PROGRAMMATIC_CAMERA_SETTLE"');
    expect(ts).toContain('"PINCH_DURING_RECONCILE"');
    expect(ts).not.toContain("schedulePostZoomPresentationRefresh");
    expect(ts).not.toContain("postZoomPresentationTimeout");
  });

  it("uses one stable final commit and keeps latest-write backpressure", () => {
    expect(ts).toContain("planNativeMapStableReconcile");
    expect(ts).not.toContain("NATIVE_MAP_DEFERRED_RECONCILE_FRAME_COUNT");
    expect(ts).not.toContain("visualFrames");
    expect(ts).not.toContain("setTimeout(tick");
    expect(ts).toContain("publicMapNativeCommitInFlight");
    expect(ts).toContain("COALESCED_AS_LATEST_PENDING");
    expect(ts).toContain("publicMapNativePendingCommits.set");
    expect(ts).toContain("plan.finalBindingProjection");
  });

  it("mounts the map only for the map module and keeps the independent My-page condition", () => {
    expect(wxml).toContain(
      `<view wx:if="{{currentView === 'map-preview'}}" class="page page--map"`,
    );
    expect(wxml).not.toContain('class="page--map-retained-hidden"');
    expect(wxml).toContain(
      `<view wx:if="{{currentView === 'my'}}" class="page page--my"`,
    );
    expect(wxml).not.toContain(
      `<view wx:elif="{{currentView === 'my'}}" class="page page--my"`,
    );
    expect(wxml).toContain('class="bottom-nav light-capsule"');
    expect(ts).toContain("activateNativeMapSurface");
    expect(ts).toContain("deactivateNativeMapSurface");
    expect(ts).toContain("publicMapNativeCameraSnapshots");
  });
});
