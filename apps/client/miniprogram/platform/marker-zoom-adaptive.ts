/** One experiment switch: false keeps the approved fixed PNG + deferred zoom path. */
export const PNG_MARKER_ZOOM_ADAPTIVE_ENABLED = true;
export const PNG_MARKER_ZOOM_INTERVAL_MS = 180;
export type MarkerDetailLevel = 0 | 1 | 2 | 3 | 4;
const thresholds: readonly number[] = [11.5, 13.5, 15.5, 17.5];
export const MARKER_DETAIL_HYSTERESIS = 0.12;

export const markerDetailLevel = (
  scale: number,
  previous?: MarkerDetailLevel,
): MarkerDetailLevel => {
  if (!Number.isFinite(scale)) return previous ?? 4;
  let level = previous ?? 0;
  if (previous === undefined)
    return thresholds.filter((t) => scale >= t).length as MarkerDetailLevel;
  while (level < 4 && scale >= thresholds[level]! + MARKER_DETAIL_HYSTERESIS)
    level = (level + 1) as MarkerDetailLevel;
  while (level > 0 && scale < thresholds[level - 1]! - MARKER_DETAIL_HYSTERESIS)
    level = (level - 1) as MarkerDetailLevel;
  return level;
};

/** Only the right edge moves. Numeric block, cyan plate height and tip stay fixed. */
export const markerGeometry = (level: MarkerDetailLevel = 4) => {
  const reduction = (4 - level) * 15;
  const width = 140 - reduction;
  return {
    width,
    height: 72,
    cardWidth: 120 - reduction,
    plateWidth: 124 - reduction,
    rightWidth: 88 - reduction,
    titleWidth: 74 - reduction,
    statusWidth: 66 - reduction,
    right: 132 - reduction,
    badgeX: 128 - reduction,
    // Include badge, selected stroke, arrow and small shadow margin conservatively.
    footprintWidth: 132 - reduction,
    footprintHeight: 68,
    anchor: { x: 28 / width, y: 66 / 72 },
  } as const;
};

export const markerLevelForRightWidth = (width: number): MarkerDetailLevel =>
  Math.max(0, Math.min(4, Math.round((width - 28) / 15))) as MarkerDetailLevel;

/** No ellipsis-only state; code points aren't cut through surrogate pairs. */
export const fitMarkerPrefix = (
  value: string,
  width: number,
  measure: (text: string) => number,
): string => {
  const chars = Array.from(value.trim().replace(/\s+/g, " ") || "—");
  while (chars.length > 1 && measure(chars.join("")) > width) chars.pop();
  return chars.join("");
};

/** Bounded trailing throttle: observation storms never create a timer backlog. */
export class MarkerZoomThrottle {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private pending: (() => void) | undefined;
  request(work: () => void): void {
    this.pending = work;
    this.timer ??= setTimeout(() => {
      this.timer = undefined;
      const latest = this.pending;
      this.pending = undefined;
      latest?.();
    }, PNG_MARKER_ZOOM_INTERVAL_MS);
  }
  cancel(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.pending = undefined;
  }
}
