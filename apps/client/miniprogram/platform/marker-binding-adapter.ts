import {
  createMarkerRenderKey,
  type MarkerCanvasRenderInput,
  type MarkerCanvasRenderer,
} from "./marker-canvas-renderer.js";
import { MarkerImageCache } from "./marker-image-cache.js";
import { markerLevelForRightWidth } from "./marker-zoom-adaptive.js";
import { formatPublicIpTheme } from "./public-map-presentation.js";
import type {
  NativeMapMarkerBinding,
  NativeMapMarkerProjection,
  NativeMapMarkerView,
} from "./public-map-native-presentation.js";

export const markerCanvasInputForView = (
  view: NativeMapMarkerView,
  adaptive = false,
): MarkerCanvasRenderInput => ({
  ...(adaptive
    ? { detailLevel: markerLevelForRightWidth(view.rightWidth) }
    : {}),
  kind: view.kind,
  countLabel: view.totalRemainingLabel,
  // A cluster is still represented by one of its existing public marker views.
  // Only the count badge is cluster-specific; its visual content stays truthful.
  title: view.displayIpTheme ?? formatPublicIpTheme(view.boardShortLabel),
  statusLabel: view.primaryDiscoveryTag,
  statusTone: view.markerStatusTone,
  selected: view.selected,
  clusterCount: view.clusterCount,
});

export const canvasBindingForView = (
  view: NativeMapMarkerView,
  asset: {
    readonly iconPath: string;
    readonly width: number;
    readonly height: number;
    readonly anchor: { readonly x: number; readonly y: number };
  },
): NativeMapMarkerBinding => ({
  id: view.markerId,
  latitude: view.latitude,
  longitude: view.longitude,
  iconPath: asset.iconPath,
  alpha: view.transitionHidden ? 0 : 1,
  width: asset.width,
  height: asset.height,
  anchor: asset.anchor,
  zIndex: view.selected
    ? 9
    : view.spiderfied
      ? 8
      : view.kind === "CLUSTER"
        ? 7
        : 6,
});

export const resolveCanvasMarkerProjection = async (input: {
  readonly projection: NativeMapMarkerProjection;
  readonly previousProjection?: NativeMapMarkerProjection;
  readonly cache: MarkerImageCache;
  readonly renderer: MarkerCanvasRenderer;
  readonly adaptive?: boolean;
  readonly isCurrent?: () => boolean;
}): Promise<NativeMapMarkerProjection> => {
  const bindings: NativeMapMarkerBinding[] = [];
  const previousBindings = new Map<string, NativeMapMarkerBinding>();
  input.previousProjection?.views.forEach((view, index) => {
    const binding = input.previousProjection?.bindings[index];
    if (!binding || binding.alpha === 0) return;
    const key = createMarkerRenderKey(
      markerCanvasInputForView(view, input.adaptive),
    );
    previousBindings.set(`${view.nodeId}:${key}`, binding);
  });
  for (const view of input.projection.views) {
    if (input.isCurrent && !input.isCurrent())
      throw new Error("marker-projection:superseded");
    const renderInput = markerCanvasInputForView(view, input.adaptive);
    const renderKey = createMarkerRenderKey(renderInput);
    const previous = previousBindings.get(`${view.nodeId}:${renderKey}`);
    if (previous) {
      bindings.push(canvasBindingForView(view, previous));
      continue;
    }
    const asset = await input.cache.getOrCreate(renderKey, () =>
      input.renderer.render(renderInput),
    );
    bindings.push(canvasBindingForView(view, asset));
  }
  return { ...input.projection, bindings };
};

/** One active image preparation and one latest pending projection, never a pinch backlog. */
export class LatestMarkerProjectionResolver {
  private generation = 0;
  private running = false;
  private pending:
    | {
        readonly generation: number;
        readonly input: Parameters<typeof resolveCanvasMarkerProjection>[0];
        readonly resolve: (
          projection: NativeMapMarkerProjection | null,
        ) => void;
        readonly reject: (error: unknown) => void;
      }
    | undefined;
  cancel(): void {
    this.generation += 1;
    this.pending?.resolve(null);
    this.pending = undefined;
  }
  resolve(
    input: Parameters<typeof resolveCanvasMarkerProjection>[0],
  ): Promise<NativeMapMarkerProjection | null> {
    const generation = ++this.generation;
    this.pending?.resolve(null);
    const request = new Promise<NativeMapMarkerProjection | null>(
      (resolve, reject) => {
        this.pending = { generation, input, resolve, reject };
      },
    );
    void this.drain();
    return request;
  }
  private async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;
    while (this.pending) {
      const request = this.pending;
      this.pending = undefined;
      const current = () => request.generation === this.generation;
      try {
        const result = await resolveCanvasMarkerProjection({
          ...request.input,
          isCurrent: current,
        });
        request.resolve(current() ? result : null);
      } catch (error) {
        if (!current()) request.resolve(null);
        else request.reject(error);
      }
    }
    this.running = false;
  }
}
