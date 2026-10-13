import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CURRENT_LOCATION_MARKER_ID,
  HIGH_ACCURACY_LOCATION_OPTIONS,
  requestCurrentMapLocation,
  withCurrentMapLocation,
  currentMapLocationCircles,
} from "./public-map-location.js";

afterEach(() => vi.useRealTimers());

describe("checked current map location", () => {
  it("requests high accuracy GCJ02 and preserves its exact coordinates", async () => {
    const getLocation = vi.fn((options) =>
      options.success({
        latitude: 30.394123,
        longitude: 120.301234,
        accuracy: 18,
      }),
    );
    const result = await requestCurrentMapLocation({ getLocation });
    expect(getLocation).toHaveBeenCalledWith(
      expect.objectContaining(HIGH_ACCURACY_LOCATION_OPTIONS),
    );
    expect(result).toMatchObject({
      latitude: 30.394123,
      longitude: 120.301234,
      accuracy: 18,
      approximate: false,
    });
  });

  it.each([undefined, 0, -1, NaN, Infinity])(
    "uses an approximate point for unknown accuracy %s without inventing a radius",
    async (accuracy) => {
      const result = await requestCurrentMapLocation({
        getLocation: (o) =>
          o.success({
            latitude: 30.4,
            longitude: 120.3,
            ...(accuracy === undefined ? {} : { accuracy }),
          }),
      });
      expect(result).toMatchObject({ accuracy: null, approximate: true });
      expect(currentMapLocationCircles(result)).toEqual([]);
    },
  );

  it.each([101, 2000])(
    "shows the reported %s meter uncertainty for a coarse point",
    async (accuracy) => {
      const result = await requestCurrentMapLocation({
        getLocation: (o) =>
          o.success({ latitude: 30.4, longitude: 120.3, accuracy }),
      });
      expect(result.approximate).toBe(true);
      expect(currentMapLocationCircles(result)).toMatchObject([
        { latitude: 30.4, longitude: 120.3, radius: accuracy },
      ]);
    },
  );

  it("allows reduced system permission even when the reported accuracy looks precise", async () => {
    const getLocation = vi.fn((o) =>
      o.success({ latitude: 30.4, longitude: 120.3, accuracy: 18 }),
    );
    const result = await requestCurrentMapLocation(
      { getLocation },
      { reducedAccuracy: true },
    );
    expect(getLocation).toHaveBeenCalledOnce();
    expect(result.approximate).toBe(true);
  });

  it("rejects invalid coordinates and lets API permission errors propagate", async () => {
    await expect(
      requestCurrentMapLocation({
        getLocation: (o) =>
          o.success({ latitude: 200, longitude: 120, accuracy: 15 }),
      }),
    ).rejects.toThrow("LOCATION_INVALID");
    await expect(
      requestCurrentMapLocation({
        getLocation: (o) => o.fail({ errMsg: "deny" }),
      }),
    ).rejects.toEqual({ errMsg: "deny" });
  });

  it("bounds an unresponsive location provider", async () => {
    vi.useFakeTimers();
    const request = requestCurrentMapLocation({ getLocation: () => undefined });
    const rejected = expect(request).rejects.toThrow("LOCATION_TIMEOUT");
    await vi.advanceTimersByTimeAsync(12000);
    await rejected;
  });

  it("appends an independent centered personal point without changing public bindings", () => {
    const publicBindings = [
      {
        id: 123,
        latitude: 30.394,
        longitude: 120.301,
        iconPath: "lead.png",
        alpha: 1,
        width: 120,
        height: 48,
        anchor: { x: 0.5, y: 1 },
      },
    ];
    const location = {
      latitude: 30.394123,
      longitude: 120.301234,
      accuracy: 18,
      approximate: false,
      obtainedAt: Date.now(),
    };
    const display = withCurrentMapLocation(publicBindings, location);
    expect(publicBindings).toHaveLength(1);
    expect(display).toHaveLength(2);
    expect(display[0]).toBe(publicBindings[0]);
    expect(display[1]).toMatchObject({
      id: CURRENT_LOCATION_MARKER_ID,
      latitude: location.latitude,
      longitude: location.longitude,
      anchor: { x: 0.5, y: 0.5 },
    });
    expect(withCurrentMapLocation(publicBindings, null)).toBe(publicBindings);
    expect(currentMapLocationCircles(location)).toEqual([]);
    expect(currentMapLocationCircles(null)).toEqual([]);
    expect(CURRENT_LOCATION_MARKER_ID).toBeGreaterThan(1_999_999_999);
  });
});
