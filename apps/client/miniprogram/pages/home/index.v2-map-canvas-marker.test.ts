import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  MARKER_CANVAS_ANCHOR,
  MARKER_CANVAS_BADGE_CENTER_X,
  MARKER_CANVAS_BADGE_CENTER_Y,
  MARKER_CANVAS_BADGE_RADIUS,
  MARKER_CANVAS_CARD_HEIGHT,
  MARKER_CANVAS_CARD_WIDTH,
  MARKER_CANVAS_HEIGHT,
  MARKER_CANVAS_PLATE_HEIGHT,
  MARKER_CANVAS_PLATE_WIDTH,
  MARKER_CANVAS_TIP_BASE_Y,
  MARKER_CANVAS_TIP_X,
  MARKER_CANVAS_TIP_Y,
  MARKER_CANVAS_TIP_LENGTH,
  MARKER_CANVAS_WIDTH,
  MARKER_CANVAS_CARD_X,
  MARKER_CANVAS_CARD_Y,
  MARKER_CANVAS_PLATE_Y,
  MARKER_CANVAS_NUMBER_WIDTH,
  drawTightNumber,
  markerSilhouette,
} from "../../platform/marker-canvas-renderer.js";

const root = process.cwd();
const pageTs = fs.readFileSync(
  path.join(root, "apps/client/miniprogram/pages/home/index.ts"),
  "utf8",
);
const pageWxml = fs.readFileSync(
  path.join(root, "apps/client/miniprogram/pages/home/index.wxml"),
  "utf8",
);
const rendererSource = fs.readFileSync(
  path.join(root, "apps/client/miniprogram/platform/marker-canvas-renderer.ts"),
  "utf8",
);

describe("TASK-V2-17 Canvas PNG marker production path", () => {
  it("mounts the PNG renderer without a legacy visual callout", () => {
    expect(pageWxml).not.toContain('slot="callout"');
    expect(pageWxml).not.toContain("native-marker-card");
    expect(pageWxml).toContain('id="marker-render-canvas"');
    expect(pageWxml).toContain('bindmarkertap="onMapNativeMarkerTap"');
  });

  it("routes projections through the cached Canvas adapter", () => {
    expect(pageTs).toContain("resolveCanvasMarkerProjection");
    expect(pageTs).toContain("publicMapMarkerRenderGenerations");
    expect(pageTs).toContain("public_map_canvas_marker_fallback");
  });

  it("keeps the visual hierarchy in Canvas and uses a real cyan backing plate", () => {
    expect(rendererSource).toContain('c.fillStyle = "#20d0b6"');
    expect(rendererSource).not.toContain("drawStackIcon");
    expect(rendererSource).not.toContain("border-left");
    expect(rendererSource).toContain(
      "representative marker remains the cluster",
    );
    expect(rendererSource).toContain("Oswald");
    expect(rendererSource).toContain("-fontSize * 0.05");
    expect(rendererSource.indexOf("Cyan backing plate")).toBeGreaterThan(-1);
    expect(rendererSource.indexOf("White foreground card")).toBeGreaterThan(
      rendererSource.indexOf("Cyan backing plate"),
    );
  });

  it("includes image properties in native binding change detection", () => {
    const signature = pageTs.slice(
      pageTs.indexOf("const nativeMapBindingItemSignature"),
      pageTs.indexOf("const nativeMapBindingSignature"),
    );
    expect(signature).toContain("binding.iconPath");
    expect(signature).toContain("binding.anchor.x");
    expect(signature).toContain("binding.width");
  });

  it("locks the screenshot-calibrated visual geometry to a centered tail anchor", () => {
    expect({ MARKER_CANVAS_WIDTH, MARKER_CANVAS_HEIGHT }).toEqual({
      MARKER_CANVAS_WIDTH: 140,
      MARKER_CANVAS_HEIGHT: 72,
    });
    expect({ MARKER_CANVAS_CARD_WIDTH, MARKER_CANVAS_CARD_HEIGHT }).toEqual({
      MARKER_CANVAS_CARD_WIDTH: 120,
      MARKER_CANVAS_CARD_HEIGHT: 48,
    });
    expect({ MARKER_CANVAS_PLATE_WIDTH, MARKER_CANVAS_PLATE_HEIGHT }).toEqual({
      MARKER_CANVAS_PLATE_WIDTH: 124,
      MARKER_CANVAS_PLATE_HEIGHT: 48,
    });
    expect(MARKER_CANVAS_TIP_X).toBe(
      MARKER_CANVAS_CARD_X + MARKER_CANVAS_NUMBER_WIDTH / 2,
    );
    expect(MARKER_CANVAS_PLATE_Y).toBe(MARKER_CANVAS_CARD_Y);
    expect(MARKER_CANVAS_TIP_BASE_Y).toBe(60);
    expect(MARKER_CANVAS_TIP_Y).toBe(66);
    expect(MARKER_CANVAS_TIP_LENGTH).toBe(6);
    expect(MARKER_CANVAS_ANCHOR).toEqual({ x: 0.2, y: 66 / 72 });
    const badgeStrokeRadius = MARKER_CANVAS_BADGE_RADIUS + 1;
    expect(
      MARKER_CANVAS_BADGE_CENTER_X + badgeStrokeRadius,
    ).toBeLessThanOrEqual(MARKER_CANVAS_WIDTH);
    expect(
      MARKER_CANVAS_BADGE_CENTER_Y - badgeStrokeRadius,
    ).toBeGreaterThanOrEqual(0);
  });

  it("draws bundled digit outlines without requesting a runtime font", () => {
    const calls: string[] = [];
    const context = new Proxy(
      {},
      {
        get: (_, name) => () => {
          calls.push(String(name));
        },
      },
    );
    drawTightNumber(context as Parameters<typeof drawTightNumber>[0], "72");
    expect(calls.filter((name) => name === "fill")).toHaveLength(2);
    expect(calls).toContain("quadraticCurveTo");
    expect(calls).not.toContain("fillText");
  });

  it("connects both tail shoulders through the tip in one closed silhouette", () => {
    const lines: number[][] = [];
    const context = new Proxy(
      {},
      {
        get:
          (_, name) =>
          (...args: number[]) => {
            if (name === "lineTo") lines.push(args);
          },
      },
    );
    markerSilhouette(context as Parameters<typeof markerSilhouette>[0]);
    const mouth = lines.findIndex(([x, y]) => x === 34 && y === 60);
    expect(lines.slice(mouth, mouth + 3)).toEqual([
      [34, 60],
      [28, 66],
      [22, 60],
    ]);
  });
});
