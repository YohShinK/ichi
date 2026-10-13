import type { MarkerImageAsset } from "./marker-image-cache.js";
import { OSWALD_GLYPHS, OSWALD_UNITS_PER_EM } from "./marker-oswald-glyphs.js";
import {
  fitMarkerPrefix,
  markerGeometry,
  type MarkerDetailLevel,
} from "./marker-zoom-adaptive.js";

export const MARKER_CANVAS_WIDTH = 140;
export const MARKER_CANVAS_HEIGHT = 72;
export const MARKER_CANVAS_CARD_X = 12;
export const MARKER_CANVAS_CARD_Y = 12;
export const MARKER_CANVAS_CARD_WIDTH = 120;
export const MARKER_CANVAS_CARD_HEIGHT = 48;
export const MARKER_CANVAS_PLATE_X = 8;
export const MARKER_CANVAS_PLATE_Y = MARKER_CANVAS_CARD_Y;
export const MARKER_CANVAS_PLATE_WIDTH = 124;
export const MARKER_CANVAS_PLATE_HEIGHT = MARKER_CANVAS_CARD_HEIGHT;
export const MARKER_CANVAS_NUMBER_WIDTH = 32;
export const MARKER_CANVAS_TIP_X =
  MARKER_CANVAS_CARD_X + MARKER_CANVAS_NUMBER_WIDTH / 2;
export const MARKER_CANVAS_TIP_BASE_Y =
  MARKER_CANVAS_CARD_Y + MARKER_CANVAS_CARD_HEIGHT;
export const MARKER_CANVAS_TIP_Y = 66;
export const MARKER_CANVAS_TIP_LENGTH =
  MARKER_CANVAS_TIP_Y - MARKER_CANVAS_TIP_BASE_Y;
export const MARKER_CANVAS_BADGE_CENTER_X = 128;
export const MARKER_CANVAS_BADGE_CENTER_Y = 12;
export const MARKER_CANVAS_BADGE_RADIUS = 8;
export const MARKER_CANVAS_ANCHOR = {
  x: MARKER_CANVAS_TIP_X / MARKER_CANVAS_WIDTH,
  y: MARKER_CANVAS_TIP_Y / MARKER_CANVAS_HEIGHT,
} as const;
const MARKER_CANVAS_RENDER_VERSION = "v8-compact-tags-picker-metadata";

export const clusterBadgeGeometry = (count: number, badgeX: number) => {
  const label = String(Math.min(999, Math.max(1, Math.floor(count))));
  const width = label.length === 1 ? 16 : label.length === 2 ? 23 : 30;
  // Keep the approved circular badge's right edge and top inset unchanged.
  return { label, x: badgeX + 8 - width, y: 4, width, height: 16 } as const;
};

export interface MarkerCanvasRenderInput {
  readonly surface?: "PICKER";
  readonly pickerWidth?: number;
  readonly pickerNotePreview?: string;
  readonly pickerUploadedAtLabel?: string;
  readonly statusTags?: readonly {
    readonly label: string;
    readonly tone: MarkerCanvasRenderInput["statusTone"];
  }[];
  readonly detailLevel?: MarkerDetailLevel;
  readonly kind: "LEAD" | "CLUSTER";
  readonly countLabel: string;
  readonly title: string;
  readonly statusLabel: string;
  readonly statusTone: "last" | "grand" | "low" | "split" | "default";
  readonly selected: boolean;
  readonly clusterCount: number;
}

/** Picker rows share the approved marker artwork; only the text area expands. */
export const markerRenderGeometry = (input: MarkerCanvasRenderInput) => {
  const geometry = markerGeometry(input.detailLevel);
  if (input.surface !== "PICKER") return geometry;
  const width = Math.round(
    Math.max(140, Math.min(400, input.pickerWidth ?? 308)),
  );
  return {
    ...geometry,
    width,
    height: 60,
    right: width - 8,
    cardWidth: width - 20,
    plateWidth: width - 16,
    titleWidth: width - 66,
  };
};
interface MarkerCanvasQueryScope {
  createSelectorQuery(): {
    select(selector: string): {
      fields(
        options: { node: boolean; size: boolean },
        callback: (result: {
          readonly node?: WechatMiniprogram.Canvas;
        }) => void,
      ): void;
    };
    exec(): void;
  };
}
type Context =
  WechatMiniprogram.CanvasRenderingContext.CanvasRenderingContext2D;
const canonicalText = (value: string): string =>
  value.trim().replace(/\s+/g, " ");
export const formatMarkerCanvasCount = (value: string): string => {
  const text = canonicalText(value);
  return /^\d$/.test(text) ? `0${text}` : text;
};
export const MARKER_STATUS_TAG_INSET = 4;
const PICKER_STATUS_TAG_GAP = 4;
export const createMarkerRenderKey = (input: MarkerCanvasRenderInput): string =>
  [
    `canvas-marker-${MARKER_CANVAS_RENDER_VERSION}`,
    input.surface === "PICKER"
      ? `picker-v2-${markerRenderGeometry(input).width}`
      : input.detailLevel === undefined
        ? "fixed"
        : `adaptive-${input.detailLevel}`,
    input.kind,
    input.selected ? "selected" : "idle",
    formatMarkerCanvasCount(input.countLabel),
    canonicalText(input.title),
    input.statusTone,
    canonicalText(input.statusLabel),
    ...(input.surface === "PICKER"
      ? (input.statusTags ?? []).map(
          (tag) => `${tag.tone}:${canonicalText(tag.label)}`,
        )
      : []),
    ...(input.surface === "PICKER"
      ? [
          canonicalText(input.pickerNotePreview ?? "备注加载中"),
          canonicalText(input.pickerUploadedAtLabel ?? "上传时间读取中"),
        ]
      : []),
    input.kind === "CLUSTER"
      ? clusterBadgeGeometry(input.clusterCount, 0).label
      : "1",
  ]
    .map(encodeURIComponent)
    .join("|");

const roundedRect = (
  c: Context,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void => {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
};

/** One closed silhouette owns shadow, clipping and the sole outer stroke.
 * There is no horizontal stroke across the tail mouth, nor an inner cyan seam. */
export const markerSilhouette = (
  c: Context,
  rightEdge = 132,
  withTail = true,
): void => {
  const x = MARKER_CANVAS_PLATE_X,
    y = MARKER_CANVAS_CARD_Y,
    right = rightEdge,
    bottom = 60,
    r = 12;
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(right - r, y);
  c.quadraticCurveTo(right, y, right, y + r);
  c.lineTo(right, bottom - r);
  c.quadraticCurveTo(right, bottom, right - r, bottom);
  if (withTail) {
    c.lineTo(MARKER_CANVAS_TIP_X + 6, bottom);
    c.lineTo(MARKER_CANVAS_TIP_X, MARKER_CANVAS_TIP_Y);
    c.lineTo(MARKER_CANVAS_TIP_X - 6, bottom);
  }
  c.lineTo(x + r, bottom);
  c.quadraticCurveTo(x, bottom, x, bottom - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
};

const fitText = (c: Context, value: string, width: number): string => {
  const text = canonicalText(value) || "—";
  if (c.measureText(text).width <= width) return text;
  let fitted = text;
  while (fitted.length > 1) {
    fitted = fitted.slice(0, -1);
    if (c.measureText(fitted + "…").width <= width) return fitted + "…";
  }
  return "…";
};

/** Actual Oswald 700 outlines, not a family-name request that can fall back.
 * 1em line box; -0.05em tracking; +2px optical downward adjustment. */
export const drawTightNumber = (c: Context, value: string): void => {
  const text = [...(formatMarkerCanvasCount(value) || "—")];
  const fontSize = text.length > 2 ? 26 : 28;
  const tracking = -fontSize * 0.05;
  const scale = fontSize / OSWALD_UNITS_PER_EM;
  const advances = text.map((ch) => OSWALD_GLYPHS[ch]?.advance ?? 600);
  const width =
    advances.reduce((a, b) => a + b * scale, 0) + tracking * (text.length - 1);
  const shrink = Math.min(1, 27 / width);
  c.save();
  c.translate(
    MARKER_CANVAS_TIP_X - (width * shrink) / 2,
    MARKER_CANVAS_CARD_Y + 36,
  );
  c.scale(shrink, 1);
  for (let i = 0; i < text.length; i++) {
    const glyph = OSWALD_GLYPHS[text[i]!] ?? OSWALD_GLYPHS["—"]!;
    c.beginPath();
    for (const command of glyph.commands) {
      const n = command.slice(1) as number[];
      switch (command[0]) {
        case "M":
          c.moveTo(n[0]! * scale, -n[1]! * scale);
          break;
        case "L":
          c.lineTo(n[0]! * scale, -n[1]! * scale);
          break;
        case "Q":
          c.quadraticCurveTo(
            n[0]! * scale,
            -n[1]! * scale,
            n[2]! * scale,
            -n[3]! * scale,
          );
          break;
        case "C":
          c.bezierCurveTo(
            n[0]! * scale,
            -n[1]! * scale,
            n[2]! * scale,
            -n[3]! * scale,
            n[4]! * scale,
            -n[5]! * scale,
          );
          break;
        case "Z":
          c.closePath();
          break;
      }
    }
    c.fill();
    c.translate(advances[i]! * scale + tracking, 0);
  }
  c.restore();
};

export const markerStatusPalette = (
  tone: MarkerCanvasRenderInput["statusTone"],
): { readonly background: string; readonly foreground: string } => {
  if (tone === "last") return { background: "#ffeaf4", foreground: "#e6007e" };
  if (tone === "grand") return { background: "#f0fdf4", foreground: "#16a34a" };
  if (tone === "low") return { background: "#fffbeb", foreground: "#d97706" };
  if (tone === "split") return { background: "#eff6ff", foreground: "#2563eb" };
  return { background: "#f1f3f5", foreground: "#687386" };
};

export const drawMarkerCanvas = (
  c: Context,
  input: MarkerCanvasRenderInput,
): void => {
  const geometry = markerRenderGeometry(input);
  const isPicker = input.surface === "PICKER";
  const silhouette = () => markerSilhouette(c, geometry.right, !isPicker);
  const fit = (value: string, width: number) =>
    input.detailLevel === undefined || isPicker
      ? fitText(c, value, width)
      : fitMarkerPrefix(value, width, (text) => c.measureText(text).width);
  c.clearRect(0, 0, geometry.width, geometry.height);
  c.save();
  if (isPicker) c.translate(0, -6);
  c.save();
  c.shadowColor = "rgba(22,28,35,0.18)";
  c.shadowBlur = 4;
  c.shadowOffsetY = 2;
  silhouette();
  c.fillStyle = "#20d0b6";
  c.fill();
  c.restore();
  c.save();
  silhouette();
  c.clip();
  // Cyan backing plate has the same top and bottom as the foreground card.
  c.fillStyle = "#20d0b6";
  c.fillRect(8, 12, geometry.plateWidth, 48);
  // White foreground card covers the cyan plate except for the exposed left crescent.
  c.fillStyle = "#ffffff";
  roundedRect(c, 12, 12, geometry.cardWidth, 48, 12);
  c.fill();
  c.save();
  roundedRect(c, 12, 12, geometry.cardWidth, 48, 12);
  c.clip();
  c.fillStyle = "#191a20";
  c.fillRect(12, 12, 32, 48);
  c.restore();
  // Fill through the mouth inside the same silhouette; never stroke a separate triangle.
  c.fillStyle = "#191a20";
  if (!isPicker) c.fillRect(22, 59, 12, 8);
  c.fillStyle = "#ffffff";
  drawTightNumber(c, input.countLabel);
  c.fillStyle = "#191a20";
  c.font = '800 11px "PingFang SC", "Helvetica Neue", Arial';
  c.textAlign = "left";
  c.textBaseline = "alphabetic";
  const pickerTags = input.statusTags?.length
    ? input.statusTags
    : [{ label: input.statusLabel, tone: input.statusTone }];
  const titleWidth =
    isPicker && pickerTags.length
      ? Math.min(
          c.measureText(canonicalText(input.title) || "—").width,
          Math.max(44, geometry.titleWidth * 0.45),
        )
      : geometry.titleWidth;
  c.fillText(fit(input.title, titleWidth), 52, 31, titleWidth);
  c.font = '800 9px "PingFang SC", "Helvetica Neue", Arial';
  c.textBaseline = "alphabetic";
  const statusInset = input.detailLevel === 0 ? 2 : 4;
  const drawStatusTag = (
    x: number,
    y: number,
    maxWidth: number,
    label: string,
    tone: MarkerCanvasRenderInput["statusTone"],
    inset: number,
  ) => {
    const fitted = fit(label, Math.max(0, maxWidth - inset * 2));
    const textWidth = Math.ceil(c.measureText(fitted).width);
    const width = Math.min(maxWidth, textWidth + inset * 2);
    const palette = markerStatusPalette(tone);
    c.fillStyle = palette.background;
    roundedRect(c, x, y, width, 14, 4);
    c.fill();
    c.strokeStyle =
      tone === "split"
        ? "#dbeafe"
        : tone === "grand"
          ? "#dcfce7"
          : palette.background;
    c.lineWidth = 0.8;
    c.stroke();
    c.fillStyle = palette.foreground;
    c.fillText(fitted, x + inset, y + 10, width - inset * 2);
    return width;
  };
  if (isPicker) {
    let x = 52 + titleWidth + 6;
    const right = 52 + geometry.titleWidth;
    for (let i = 0; i < pickerTags.length; i++) {
      const tag = pickerTags[i]!;
      const available = right - x;
      const naturalWidth =
        Math.ceil(c.measureText(canonicalText(tag.label)).width) + 8;
      const overflow =
        naturalWidth > available ||
        (i < pickerTags.length - 1 &&
          naturalWidth + PICKER_STATUS_TAG_GAP + c.measureText("…").width >
            available);
      if (overflow) {
        if (available > 16) {
          const label = canonicalText(tag.label);
          drawStatusTag(
            x,
            21,
            available,
            label.endsWith("…") ? label : label + "…",
            tag.tone,
            MARKER_STATUS_TAG_INSET,
          );
        } else if (available >= c.measureText("…").width) {
          c.fillStyle = "#687386";
          c.fillText("…", x, 31, available);
        }
        break;
      }
      x +=
        drawStatusTag(
          x,
          21,
          available,
          tag.label,
          tag.tone,
          MARKER_STATUS_TAG_INSET,
        ) + PICKER_STATUS_TAG_GAP;
    }
    c.fillStyle = "#687386";
    c.font = '600 8px "PingFang SC", "Helvetica Neue", Arial';
    const time = fitText(
      c,
      input.pickerUploadedAtLabel ?? "上传时间读取中",
      Math.max(40, geometry.titleWidth * 0.47),
    );
    const timeWidth = Math.ceil(c.measureText(time).width);
    c.fillText(time, right - timeWidth, 48, timeWidth);
    c.font = '600 9px "PingFang SC", "Helvetica Neue", Arial';
    const noteWidth = Math.max(1, geometry.titleWidth - timeWidth - 8);
    c.fillText(
      fitText(c, input.pickerNotePreview ?? "备注加载中", noteWidth),
      52,
      48,
      noteWidth,
    );
  } else {
    drawStatusTag(
      52,
      38,
      geometry.titleWidth,
      input.statusLabel,
      input.statusTone,
      statusInset,
    );
  }
  c.restore();
  silhouette();
  c.strokeStyle = input.selected ? "#f20aa4" : "#e5e7eb";
  c.lineWidth = input.selected ? 1.5 : 1;
  c.lineJoin = "round";
  c.stroke();
  // The representative marker remains the cluster's body; only its badge differs.
  if (input.kind === "CLUSTER" && !isPicker) {
    const badge = clusterBadgeGeometry(input.clusterCount, geometry.badgeX);
    roundedRect(c, badge.x, badge.y, badge.width, badge.height, 8);
    c.fillStyle = "#e6007e";
    c.fill();
    c.strokeStyle = "#ffffff";
    c.lineWidth = 1.5;
    c.stroke();
    c.fillStyle = "#ffffff";
    c.font = badge.label.length === 3 ? "800 8.5px Arial" : "800 9px Arial";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(badge.label, badge.x + badge.width / 2, 12.5, badge.width - 5);
  }
  c.restore();
};

const selectCanvas = (
  scope: MarkerCanvasQueryScope,
): Promise<WechatMiniprogram.Canvas> =>
  new Promise((resolve, reject) => {
    const query = scope.createSelectorQuery();
    query
      .select("#marker-render-canvas")
      .fields({ node: true, size: true }, (result) => {
        if (result.node) resolve(result.node);
        else reject(new Error("marker-canvas-renderer:missing-canvas-node"));
      });
    query.exec();
  });

const exportCanvas = (
  canvas: WechatMiniprogram.Canvas,
  pixelRatio: number,
  width: number,
  height: number,
): Promise<string> =>
  new Promise((resolve, reject) => {
    wx.canvasToTempFilePath({
      canvas,
      fileType: "png",
      x: 0,
      y: 0,
      width: width * pixelRatio,
      height: height * pixelRatio,
      destWidth: width * pixelRatio,
      destHeight: height * pixelRatio,
      success: (result) => resolve(result.tempFilePath),
      fail: reject,
    });
  });

export class MarkerCanvasRenderer {
  private queue: Promise<void> = Promise.resolve();
  private canvasPromise: Promise<WechatMiniprogram.Canvas> | undefined;
  private queued = 0;
  private queuedPeak = 0;
  private completed = 0;
  private failed = 0;

  constructor(private readonly scope: MarkerCanvasQueryScope) {}

  get diagnostics() {
    return {
      queued: this.queued,
      queuedPeak: this.queuedPeak,
      completed: this.completed,
      failed: this.failed,
    };
  }

  /** Benchmark counters only; never resets the queue or canvas. */
  resetDiagnostics(): void {
    this.queuedPeak = this.queued;
    this.completed = 0;
    this.failed = 0;
  }

  render(input: MarkerCanvasRenderInput): Promise<MarkerImageAsset> {
    const renderKey = createMarkerRenderKey(input);
    this.queued += 1;
    this.queuedPeak = Math.max(this.queuedPeak, this.queued);
    const request = this.queue.then(async () => {
      this.canvasPromise ??= selectCanvas(this.scope);
      let canvas: WechatMiniprogram.Canvas;
      try {
        canvas = await this.canvasPromise;
      } catch (error) {
        this.canvasPromise = undefined;
        throw error;
      }
      const pixelRatio = Math.min(
        3,
        Math.max(1, Number(wx.getWindowInfo().pixelRatio) || 1),
      );
      const geometry = markerRenderGeometry(input);
      canvas.width = Math.round(geometry.width * pixelRatio);
      canvas.height = Math.round(geometry.height * pixelRatio);
      const context = canvas.getContext("2d");
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      drawMarkerCanvas(context, input);
      const iconPath = await exportCanvas(
        canvas,
        pixelRatio,
        geometry.width,
        geometry.height,
      );
      return {
        renderKey,
        iconPath,
        width: geometry.width,
        height: geometry.height,
        anchor: {
          ...geometry.anchor,
        },
      };
    });
    const tracked = request.then(
      (asset) => {
        this.queued -= 1;
        this.completed += 1;
        return asset;
      },
      (error: unknown) => {
        this.queued -= 1;
        this.failed += 1;
        throw error;
      },
    );
    this.queue = tracked.then(
      () => undefined,
      () => undefined,
    );
    return tracked;
  }
}
