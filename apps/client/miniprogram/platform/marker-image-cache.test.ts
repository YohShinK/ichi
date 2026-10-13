import { describe, expect, it, vi } from "vitest";
import {
  MarkerImageCache,
  type MarkerImageAsset,
} from "./marker-image-cache.js";
import {
  MARKER_CANVAS_ANCHOR,
  MARKER_CANVAS_HEIGHT,
  MARKER_CANVAS_WIDTH,
} from "./marker-canvas-renderer.js";

const asset = (renderKey: string): MarkerImageAsset => ({
  renderKey,
  iconPath: `/tmp/${renderKey}.png`,
  width: MARKER_CANVAS_WIDTH,
  height: MARKER_CANVAS_HEIGHT,
  anchor: MARKER_CANVAS_ANCHOR,
});

describe("MarkerImageCache", () => {
  it("coalesces concurrent requests and reuses the finished image", async () => {
    const cache = new MarkerImageCache();
    const create = vi.fn(async () => asset("same"));

    const [first, second] = await Promise.all([
      cache.getOrCreate("same", create),
      cache.getOrCreate("same", create),
    ]);
    const third = await cache.getOrCreate("same", create);

    expect(create).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    expect(third).toBe(first);
  });

  it("does not retain a failed render", async () => {
    const cache = new MarkerImageCache();
    const create = vi
      .fn<() => Promise<MarkerImageAsset>>()
      .mockRejectedValueOnce(new Error("failed"))
      .mockResolvedValueOnce(asset("retry"));

    await expect(cache.getOrCreate("retry", create)).rejects.toThrow("failed");
    await expect(cache.getOrCreate("retry", create)).resolves.toEqual(
      asset("retry"),
    );
    expect(create).toHaveBeenCalledTimes(2);
  });
});
