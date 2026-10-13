import { describe, expect, it } from "vitest";

import {
  beginNativeMapPresentationReconcile,
  cancelNativeMapPresentationReconcile,
  completeNativeMapPresentationReconcile,
  createNativeMapCameraScaleState,
  needsNativeMapPresentationReconcile,
  resolveNativeMapObservedScale,
  resolveNativeMapPresentationScale,
  retainStablePublicMapMarkers,
  withNativeMapObservedScale,
  withNativeMapSettledScale,
  withNativeMapTargetScale,
} from "./public-map-render-scheduler.js";

describe("TASK-V2-17 native map render scheduler", () => {
  it("keeps presentation frozen while camera observation and command targets move", () => {
    const initial = createNativeMapCameraScaleState(12);
    const targeted = withNativeMapTargetScale(initial, 13);
    const staleObserved = withNativeMapObservedScale(targeted, {
      scale: 12,
      source: "GET_SCALE_SAMPLE",
      at: 100,
    });

    expect(targeted.targetScale).toBe(13);
    expect(resolveNativeMapObservedScale(staleObserved)).toBe(12);
    expect(resolveNativeMapPresentationScale(staleObserved)).toBe(12);
  });

  it("protects a fresh region scale from an immediately stale getScale sample", () => {
    const initial = createNativeMapCameraScaleState(12);
    const region = withNativeMapObservedScale(initial, {
      scale: 13,
      source: "REGION_CHANGE_BEGIN",
      at: 1_000,
    });
    const stale = withNativeMapObservedScale(region, {
      scale: 12,
      source: "REGION_CHANGE_END",
      at: 1_080,
    });
    const moving = withNativeMapObservedScale(stale, {
      scale: 12.4,
      source: "GET_SCALE_SAMPLE",
      at: 1_120,
    });

    expect(stale.observedScale).toBe(13);
    expect(moving.observedScale).toBe(12.4);
  });

  it("clears the target only when the camera settles", () => {
    const targeted = withNativeMapTargetScale(
      createNativeMapCameraScaleState(12),
      13,
    );
    const settled = withNativeMapSettledScale(targeted, 13, 2_000);

    expect(settled).toMatchObject({
      targetScale: null,
      observedScale: 13,
      settledScale: 13,
      presentationScale: 12,
      targetPresentationScale: null,
    });
  });

  it("starts, completes, and cancels one deferred presentation reconcile", () => {
    const observed = withNativeMapObservedScale(
      createNativeMapCameraScaleState(12),
      { scale: 14, source: "GET_SCALE_SAMPLE", at: 100 },
    );
    expect(needsNativeMapPresentationReconcile(observed)).toBe(true);
    expect(resolveNativeMapPresentationScale(observed)).toBe(12);

    const reconciling = beginNativeMapPresentationReconcile(observed);
    expect(reconciling.targetPresentationScale).toBe(14);
    const completed = completeNativeMapPresentationReconcile(reconciling);
    expect(completed).toMatchObject({
      observedScale: 14,
      presentationScale: 14,
      targetPresentationScale: null,
    });
    expect(needsNativeMapPresentationReconcile(completed)).toBe(false);

    const cancelled = cancelNativeMapPresentationReconcile(reconciling, 12.8);
    expect(cancelled).toMatchObject({
      observedScale: 14,
      presentationScale: 12.8,
      targetPresentationScale: null,
    });
  });

  it("retains a stable projection only while a root query is revalidating", () => {
    const stable = [{ id: "lead-a" }];

    expect(
      retainStablePublicMapMarkers({
        phase: "INITIAL_LOADING",
        incoming: [],
        stable,
      }),
    ).toBe(stable);
    expect(
      retainStablePublicMapMarkers({
        phase: "VIEWPORT_REFRESHING",
        incoming: [],
        stable,
      }),
    ).toBe(stable);
    expect(
      retainStablePublicMapMarkers({
        phase: "LOADED",
        incoming: [{ id: "lead-b" }],
        stable,
      }),
    ).toEqual([{ id: "lead-b" }]);
    expect(
      retainStablePublicMapMarkers({
        phase: "EMPTY",
        incoming: [],
        stable,
      }),
    ).toEqual([]);
  });
});
