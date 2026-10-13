import {
  createPublicMapClusterTopology,
  inspectPublicMapRepresentation,
  offsetPublicMapCoordinate,
  publicMapClusterKey,
  stableNativeMarkerId,
  type PublicMapClusterNode,
  type PublicMapClusterTopology,
  type PublicMapCoordinate,
  type PublicMapRepresentationInvariant,
} from "./public-map-cluster-engine.js";
import { PUBLIC_MAP_MAX_SCALE } from "./public-map-interaction.js";
import type { PublicMapMarkerPresentation } from "./public-map-presentation.js";
import {
  markerGeometry,
  type MarkerDetailLevel,
} from "./marker-zoom-adaptive.js";

export const NATIVE_MARKER_LEFT_WIDTH = 36;
export const NATIVE_MARKER_MIN_RIGHT_WIDTH = 82;
export const NATIVE_MARKER_MAX_RIGHT_WIDTH = 82;
export const NATIVE_MARKER_MIN_SCALE = 9;
export const NATIVE_MARKER_MAX_SCALE = PUBLIC_MAP_MAX_SCALE;
export const NATIVE_MARKER_HEIGHT = 48;
export const NATIVE_MARKER_SHELL_GUTTER = 4;

export type NativeMapMarkerKind = "LEAD" | "CLUSTER";

export interface NativeMapMarkerView extends PublicMapMarkerPresentation {
  readonly markerId: number;
  readonly nodeId: string;
  readonly clusterKey: string;
  readonly kind: NativeMapMarkerKind;
  readonly memberLeadIds: readonly string[];
  readonly memberCoordinates: readonly PublicMapCoordinate[];
  readonly latitude: number;
  readonly longitude: number;
  readonly realLatitude: number;
  readonly realLongitude: number;
  readonly rightWidth: number;
  readonly totalWidth: number;
  readonly shellWidth: number;
  readonly visualOffsetX: number;
  readonly visualOffsetY: number;
  readonly presentationProgress: number;
  readonly clusterCount: number;
  readonly exactOverlap: boolean;
  readonly spiderfied: boolean;
  readonly selected: boolean;
  readonly transitionHidden: boolean;
}

export interface NativeMapMarkerBinding {
  readonly id: number;
  readonly latitude: number;
  readonly longitude: number;
  readonly iconPath: string;
  readonly alpha: number;
  readonly width: number;
  readonly height: number;
  readonly anchor: { readonly x: number; readonly y: number };
  readonly zIndex?: number;
}

export interface NativeMapMarkerProjection {
  readonly scale: number;
  readonly presentationProgress: number;
  readonly topology: PublicMapClusterTopology;
  readonly views: readonly NativeMapMarkerView[];
  readonly bindings: readonly NativeMapMarkerBinding[];
  readonly invariant: PublicMapRepresentationInvariant;
}

export interface NativeMapTopologyTransition {
  readonly direction: "NONE" | "SPLIT" | "MERGE" | "REPLACE";
  readonly moves: readonly {
    readonly markerId: number;
    readonly from: PublicMapCoordinate;
    readonly to: PublicMapCoordinate;
    readonly view: NativeMapMarkerView;
  }[];
}

export interface NativeMapDeferredReconcilePlan {
  readonly direction: NativeMapTopologyTransition["direction"];
  readonly fromScale: number;
  readonly targetScale: number;
  readonly finalBindingProjection: NativeMapMarkerProjection;
}

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

/** Native stability mode keeps every marker at one fixed custom-callout size. */
export const deriveMarkerRightWidth = (scale: number): number => {
  void scale;
  return NATIVE_MARKER_MIN_RIGHT_WIDTH;
};

export const createNativeMapClusterTopology = (
  markers: readonly PublicMapMarkerPresentation[],
  scale: number,
  previousTopology?: PublicMapClusterTopology,
  detailLevel?: MarkerDetailLevel,
): PublicMapClusterTopology =>
  createPublicMapClusterTopology({
    markers,
    scale,
    renderedMarkerWidth:
      detailLevel === undefined
        ? NATIVE_MARKER_LEFT_WIDTH + deriveMarkerRightWidth(scale)
        : markerGeometry(detailLevel).footprintWidth,
    renderedMarkerHeight:
      detailLevel === undefined
        ? NATIVE_MARKER_HEIGHT
        : markerGeometry(detailLevel).footprintHeight,
    ...(previousTopology ? { previousTopology } : {}),
  });

export const clusterVisibleMarkers = (
  markers: readonly PublicMapMarkerPresentation[],
  scale: number,
): readonly (readonly PublicMapMarkerPresentation[])[] => {
  const topology = createNativeMapClusterTopology(markers, scale);
  return topology.nodes.map((node) =>
    node.memberLeadIds
      .map((id) => topology.markersByLeadId.get(id))
      .filter((marker): marker is PublicMapMarkerPresentation =>
        Boolean(marker),
      ),
  );
};

export const fallbackNativeMapBindingForView = (
  view: NativeMapMarkerView,
): NativeMapMarkerBinding => ({
  id: view.markerId,
  latitude: view.latitude,
  longitude: view.longitude,
  iconPath: "/assets/v1-29/ichi-avatar.png",
  // Transparent placeholder while the PNG iconPath is being prepared.
  alpha: 0,
  width: 1,
  height: 1,
  anchor: { x: 0.5, y: 0.5 },
});

const markerForNode = (
  topology: PublicMapClusterTopology,
  node: PublicMapClusterNode,
): PublicMapMarkerPresentation | undefined =>
  topology.markersByLeadId.get(node.memberLeadIds[0] ?? "");

const baseViewForNode = (input: {
  readonly detailLevel?: MarkerDetailLevel;
  readonly topology: PublicMapClusterTopology;
  readonly node: PublicMapClusterNode;
  readonly scale: number;
  readonly selectedPublicLeadId: string;
  readonly selectedClusterKey: string;
}): NativeMapMarkerView | null => {
  const representative = markerForNode(input.topology, input.node);
  if (!representative) return null;
  const rightWidth =
    input.detailLevel === undefined
      ? deriveMarkerRightWidth(input.scale)
      : markerGeometry(input.detailLevel).rightWidth;
  return {
    ...representative,
    markerId: input.node.markerId,
    nodeId: input.node.nodeId,
    clusterKey: input.node.clusterKey,
    kind: input.node.kind,
    memberLeadIds: input.node.memberLeadIds,
    memberCoordinates: input.node.memberCoordinates,
    latitude: input.node.latitude,
    longitude: input.node.longitude,
    realLatitude: input.node.latitude,
    realLongitude: input.node.longitude,
    rightWidth,
    totalWidth: NATIVE_MARKER_LEFT_WIDTH + rightWidth,
    shellWidth:
      NATIVE_MARKER_LEFT_WIDTH + rightWidth + NATIVE_MARKER_SHELL_GUTTER,
    visualOffsetX: 0,
    visualOffsetY: 0,
    presentationProgress: 1,
    clusterCount: input.node.memberLeadIds.length,
    exactOverlap: input.node.exactOverlap,
    spiderfied: false,
    selected:
      input.node.kind === "LEAD"
        ? representative.publicLeadId === input.selectedPublicLeadId
        : input.node.clusterKey === input.selectedClusterKey,
    transitionHidden: false,
  };
};

const spiderOffset = (
  index: number,
  count: number,
): { x: number; y: number } => {
  if (count <= 8) {
    const radius = Math.max(66, Math.min(92, 54 + count * 5));
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  }
  const angle = index * 1.7 - Math.PI / 2;
  const radius = 58 + index * 9;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
};

const spiderfyNode = (input: {
  readonly detailLevel?: MarkerDetailLevel;
  readonly topology: PublicMapClusterTopology;
  readonly node: PublicMapClusterNode;
  readonly scale: number;
  readonly selectedPublicLeadId: string;
}): readonly NativeMapMarkerView[] => {
  const ids = [...input.node.memberLeadIds].sort();
  const rightWidth =
    input.detailLevel === undefined
      ? deriveMarkerRightWidth(input.scale)
      : markerGeometry(input.detailLevel).rightWidth;
  return ids.flatMap((publicLeadId, index) => {
    const marker = input.topology.markersByLeadId.get(publicLeadId);
    if (!marker) return [];
    const displayCoordinate = offsetPublicMapCoordinate(
      { latitude: marker.latitude, longitude: marker.longitude },
      spiderOffset(index, ids.length),
      input.scale,
    );
    return [
      {
        ...marker,
        markerId: stableNativeMarkerId(publicLeadId),
        nodeId: `SPIDER:${input.node.clusterKey}:${publicLeadId}`,
        clusterKey: input.node.clusterKey,
        kind: "LEAD" as const,
        memberLeadIds: [publicLeadId],
        memberCoordinates: [
          { latitude: marker.latitude, longitude: marker.longitude },
        ],
        latitude: displayCoordinate.latitude,
        longitude: displayCoordinate.longitude,
        realLatitude: marker.latitude,
        realLongitude: marker.longitude,
        rightWidth,
        totalWidth: NATIVE_MARKER_LEFT_WIDTH + rightWidth,
        shellWidth:
          NATIVE_MARKER_LEFT_WIDTH + rightWidth + NATIVE_MARKER_SHELL_GUTTER,
        visualOffsetX: 0,
        visualOffsetY: 0,
        presentationProgress: 1,
        clusterCount: 1,
        exactOverlap: input.node.exactOverlap,
        spiderfied: true,
        selected: marker.publicLeadId === input.selectedPublicLeadId,
        transitionHidden: false,
      },
    ];
  });
};

export const projectNativeMapMarkers = (input: {
  readonly detailLevel?: MarkerDetailLevel;
  readonly markers: readonly PublicMapMarkerPresentation[];
  readonly previousTopology?: PublicMapClusterTopology;
  readonly scale: number;
  readonly selectedPublicLeadId: string;
  readonly selectedClusterKey?: string;
  readonly spiderfyClusterKey?: string;
}): NativeMapMarkerProjection => {
  const scale = clamp(
    input.scale,
    NATIVE_MARKER_MIN_SCALE,
    NATIVE_MARKER_MAX_SCALE,
  );
  const topology = createNativeMapClusterTopology(
    input.markers,
    scale,
    input.previousTopology,
    input.detailLevel,
  );
  const views = topology.nodes.flatMap((node) => {
    if (
      node.kind === "CLUSTER" &&
      node.clusterKey === input.spiderfyClusterKey &&
      scale >= PUBLIC_MAP_MAX_SCALE - 0.01
    )
      return spiderfyNode({
        ...(input.detailLevel === undefined
          ? {}
          : { detailLevel: input.detailLevel }),
        topology,
        node,
        scale,
        selectedPublicLeadId: input.selectedPublicLeadId,
      });
    const view = baseViewForNode({
      ...(input.detailLevel === undefined
        ? {}
        : { detailLevel: input.detailLevel }),
      topology,
      node,
      scale,
      selectedPublicLeadId: input.selectedPublicLeadId,
      selectedClusterKey: input.selectedClusterKey ?? "",
    });
    return view ? [view] : [];
  });
  const representedLeadIds = views.flatMap((view) => view.memberLeadIds);
  const invariant = inspectPublicMapRepresentation(
    input.markers.map((marker) => marker.publicLeadId),
    representedLeadIds,
  );
  return {
    scale,
    presentationProgress: 1,
    topology,
    views,
    bindings: views.map(fallbackNativeMapBindingForView),
    invariant,
  };
};

export const withFallbackNativeMapMarkerBindings = (
  projection: NativeMapMarkerProjection,
): NativeMapMarkerProjection => ({
  ...projection,
  bindings: projection.views.map(fallbackNativeMapBindingForView),
});

const containsEvery = (
  container: readonly string[],
  content: readonly string[],
): boolean => content.every((id) => container.includes(id));

const topologyKey = (views: readonly NativeMapMarkerView[]): string =>
  views
    .map((view) => publicMapClusterKey(view.memberLeadIds))
    .sort()
    .join(";");

export const planNativeMapTopologyTransition = (
  previous: NativeMapMarkerProjection | undefined,
  next: NativeMapMarkerProjection,
): NativeMapTopologyTransition => {
  if (!previous || topologyKey(previous.views) === topologyKey(next.views))
    return { direction: "NONE", moves: [] };
  const direction =
    next.views.length > previous.views.length
      ? "SPLIT"
      : next.views.length < previous.views.length
        ? "MERGE"
        : "REPLACE";
  if (direction === "REPLACE") return { direction, moves: [] };
  const source = direction === "SPLIT" ? previous.views : next.views;
  const moving = direction === "SPLIT" ? next.views : previous.views;
  const moves = moving.flatMap((view) => {
    const related = source
      .filter((candidate) =>
        containsEvery(candidate.memberLeadIds, view.memberLeadIds),
      )
      .sort(
        (left, right) => left.memberLeadIds.length - right.memberLeadIds.length,
      )[0];
    if (!related) return [];
    return [
      {
        markerId: view.markerId,
        from:
          direction === "SPLIT"
            ? { latitude: related.latitude, longitude: related.longitude }
            : { latitude: view.latitude, longitude: view.longitude },
        to:
          direction === "SPLIT"
            ? { latitude: view.latitude, longitude: view.longitude }
            : { latitude: related.latitude, longitude: related.longitude },
        view,
      },
    ];
  });
  return { direction: moves.length ? direction : "REPLACE", moves };
};

export const planNativeMapStableReconcile = (input: {
  readonly previous: NativeMapMarkerProjection;
  readonly target: NativeMapMarkerProjection;
}): NativeMapDeferredReconcilePlan => {
  const transition = planNativeMapTopologyTransition(
    input.previous,
    input.target,
  );
  return {
    direction: transition.direction,
    fromScale: input.previous.scale,
    targetScale: input.target.scale,
    finalBindingProjection: input.target,
  };
};

export const nativeMarkerClusterKey = (
  view: Pick<NativeMapMarkerView, "memberLeadIds">,
): string => publicMapClusterKey(view.memberLeadIds);

export const nativeMarkerIdForLead = (publicLeadId: string): number =>
  stableNativeMarkerId(publicLeadId);
