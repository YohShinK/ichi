import type { PublicMapMarkerPresentation } from "./public-map-presentation.js";
import {
  clamp,
  PUBLIC_MAP_MAX_SCALE,
  PUBLIC_MAP_MIN_SCALE,
} from "./public-map-interaction.js";

export const PUBLIC_MAP_CLUSTER_MIN_SCALE = PUBLIC_MAP_MIN_SCALE;
export const PUBLIC_MAP_CLUSTER_MAX_SCALE = PUBLIC_MAP_MAX_SCALE;
export const PUBLIC_MAP_CLUSTER_HORIZONTAL_PADDING = 6;
export const PUBLIC_MAP_CLUSTER_VERTICAL_PADDING = 4;
export const PUBLIC_MAP_CLUSTER_HYSTERESIS_PX = 8;

export interface PublicMapCoordinate {
  readonly latitude: number;
  readonly longitude: number;
}

export interface PublicMapScreenPoint {
  readonly x: number;
  readonly y: number;
}

export interface PublicMapBounds {
  readonly west: number;
  readonly south: number;
  readonly east: number;
  readonly north: number;
}

export interface PublicMapClusterNode {
  readonly nodeId: string;
  readonly clusterKey: string;
  readonly markerId: number;
  readonly kind: "LEAD" | "CLUSTER";
  readonly memberLeadIds: readonly string[];
  readonly memberCoordinates: readonly PublicMapCoordinate[];
  readonly latitude: number;
  readonly longitude: number;
  readonly bounds: PublicMapBounds;
  readonly exactOverlap: boolean;
}

export interface PublicMapClusterTopology {
  readonly fingerprint: string;
  readonly scale: number;
  readonly nodes: readonly PublicMapClusterNode[];
  readonly markersByLeadId: ReadonlyMap<string, PublicMapMarkerPresentation>;
  readonly clusterByLeadId: ReadonlyMap<string, string>;
}

export interface PublicMapRepresentationInvariant {
  readonly missingLeadIds: readonly string[];
  readonly duplicateLeadIds: readonly string[];
  readonly valid: boolean;
}

export const stableNativeMarkerId = (value: string): number => {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 900_000_000;
};

export const publicMapClusterKey = (leadIds: readonly string[]): string =>
  [...leadIds].sort().join("|");

export const projectPublicMapCoordinate = (
  coordinate: PublicMapCoordinate,
  scale: number,
): PublicMapScreenPoint => {
  const worldSize = 256 * 2 ** scale;
  const latitude = clamp(coordinate.latitude, -85.05112878, 85.05112878);
  const sine = Math.sin((latitude * Math.PI) / 180);
  return {
    x: ((coordinate.longitude + 180) / 360) * worldSize,
    y: (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * worldSize,
  };
};

export const unprojectPublicMapPoint = (
  point: PublicMapScreenPoint,
  scale: number,
): PublicMapCoordinate => {
  const worldSize = 256 * 2 ** scale;
  const longitude = (point.x / worldSize) * 360 - 180;
  const mercatorY = 0.5 - point.y / worldSize;
  const latitude =
    (Math.atan(Math.sinh(mercatorY * 2 * Math.PI)) * 180) / Math.PI;
  return { latitude, longitude };
};

export const offsetPublicMapCoordinate = (
  coordinate: PublicMapCoordinate,
  offset: PublicMapScreenPoint,
  scale: number,
): PublicMapCoordinate => {
  const origin = projectPublicMapCoordinate(coordinate, scale);
  return unprojectPublicMapPoint(
    { x: origin.x + offset.x, y: origin.y + offset.y },
    scale,
  );
};

const markerBounds = (
  markers: readonly PublicMapMarkerPresentation[],
): PublicMapBounds => ({
  west: Math.min(...markers.map((marker) => marker.longitude)),
  south: Math.min(...markers.map((marker) => marker.latitude)),
  east: Math.max(...markers.map((marker) => marker.longitude)),
  north: Math.max(...markers.map((marker) => marker.latitude)),
});

const nodeCenter = (
  markers: readonly PublicMapMarkerPresentation[],
): PublicMapCoordinate => ({
  latitude:
    markers.reduce((sum, marker) => sum + marker.latitude, 0) / markers.length,
  longitude:
    markers.reduce((sum, marker) => sum + marker.longitude, 0) / markers.length,
});

const exactCoordinateKey = (marker: PublicMapMarkerPresentation): string =>
  `${marker.latitude.toFixed(7)}:${marker.longitude.toFixed(7)}`;

const markersCollide = (input: {
  readonly leftPoint: PublicMapScreenPoint;
  readonly rightPoint: PublicMapScreenPoint;
  readonly markerWidth: number;
  readonly markerHeight: number;
  readonly previouslyClustered: boolean;
}): boolean => {
  const hysteresis = input.previouslyClustered
    ? PUBLIC_MAP_CLUSTER_HYSTERESIS_PX
    : 0;
  return (
    Math.abs(input.leftPoint.x - input.rightPoint.x) <
      input.markerWidth + PUBLIC_MAP_CLUSTER_HORIZONTAL_PADDING + hysteresis &&
    Math.abs(input.leftPoint.y - input.rightPoint.y) <
      input.markerHeight + PUBLIC_MAP_CLUSTER_VERTICAL_PADDING + hysteresis
  );
};

const groupMarkers = (input: {
  readonly markers: readonly PublicMapMarkerPresentation[];
  readonly scale: number;
  readonly markerWidth: number;
  readonly markerHeight: number;
  readonly previousClusterByLeadId?: ReadonlyMap<string, string>;
}): readonly (readonly PublicMapMarkerPresentation[])[] => {
  const markers = [...input.markers].sort((left, right) =>
    left.publicLeadId.localeCompare(right.publicLeadId),
  );
  const projected = markers.map((marker) => ({
    marker,
    point: projectPublicMapCoordinate(marker, input.scale),
  }));
  const parents = projected.map((_, index) => index);
  const root = (index: number): number => {
    let current = index;
    while (parents[current] !== current) {
      const parent = parents[current];
      if (parent === undefined) break;
      parents[current] = parents[parent] ?? parent;
      current = parent;
    }
    return current;
  };
  const join = (left: number, right: number): void => {
    const leftRoot = root(left);
    const rightRoot = root(right);
    if (leftRoot === rightRoot) return;
    parents[Math.max(leftRoot, rightRoot)] = Math.min(leftRoot, rightRoot);
  };
  for (let left = 0; left < projected.length; left += 1) {
    for (let right = left + 1; right < projected.length; right += 1) {
      const a = projected[left];
      const b = projected[right];
      if (!a || !b) continue;
      if (
        markersCollide({
          leftPoint: a.point,
          rightPoint: b.point,
          markerWidth: input.markerWidth,
          markerHeight: input.markerHeight,
          previouslyClustered:
            input.previousClusterByLeadId?.has(a.marker.publicLeadId) ===
              true &&
            input.previousClusterByLeadId.get(a.marker.publicLeadId) ===
              input.previousClusterByLeadId.get(b.marker.publicLeadId),
        })
      )
        join(left, right);
    }
  }
  const groups = new Map<number, PublicMapMarkerPresentation[]>();
  projected.forEach(({ marker }, index) => {
    const key = root(index);
    groups.set(key, [...(groups.get(key) ?? []), marker]);
  });
  return [...groups.values()];
};

const nodeForMarkers = (
  markers: readonly PublicMapMarkerPresentation[],
): PublicMapClusterNode => {
  const memberLeadIds = markers.map((marker) => marker.publicLeadId).sort();
  const clusterKey = publicMapClusterKey(memberLeadIds);
  const kind = markers.length === 1 ? "LEAD" : "CLUSTER";
  const center = nodeCenter(markers);
  return {
    nodeId: `${kind}:${clusterKey}`,
    clusterKey,
    markerId:
      kind === "LEAD"
        ? stableNativeMarkerId(memberLeadIds[0] ?? clusterKey)
        : 1_000_000_000 +
          (stableNativeMarkerId(`cluster:${clusterKey}`) % 1_000_000_000),
    kind,
    memberLeadIds,
    memberCoordinates: markers.map((marker) => ({
      latitude: marker.latitude,
      longitude: marker.longitude,
    })),
    ...center,
    bounds: markerBounds(markers),
    exactOverlap:
      markers.length > 1 && new Set(markers.map(exactCoordinateKey)).size === 1,
  };
};

export const createPublicMapClusterTopology = (input: {
  readonly markers: readonly PublicMapMarkerPresentation[];
  readonly scale: number;
  readonly renderedMarkerWidth: number;
  readonly renderedMarkerHeight: number;
  readonly previousTopology?: PublicMapClusterTopology;
}): PublicMapClusterTopology => {
  const scale = clamp(
    Number(input.scale),
    PUBLIC_MAP_CLUSTER_MIN_SCALE,
    PUBLIC_MAP_CLUSTER_MAX_SCALE,
  );
  const sortedMarkers = [...input.markers].sort((left, right) =>
    left.publicLeadId.localeCompare(right.publicLeadId),
  );
  const nodes = groupMarkers({
    markers: sortedMarkers,
    scale,
    markerWidth: input.renderedMarkerWidth,
    markerHeight: input.renderedMarkerHeight,
    ...(input.previousTopology
      ? { previousClusterByLeadId: input.previousTopology.clusterByLeadId }
      : {}),
  }).map(nodeForMarkers);
  const clusterByLeadId = new Map<string, string>();
  for (const node of nodes) {
    if (node.memberLeadIds.length > 1)
      for (const id of node.memberLeadIds) clusterByLeadId.set(id, node.nodeId);
  }
  return {
    fingerprint: `${scale.toFixed(3)}:${input.renderedMarkerWidth.toFixed(2)}:${nodes
      .map((node) => node.nodeId)
      .join(";")}`,
    scale,
    nodes,
    markersByLeadId: new Map(
      sortedMarkers.map((marker) => [marker.publicLeadId, marker] as const),
    ),
    clusterByLeadId,
  };
};

export const findPublicMapClusterExpansionScale = (input: {
  readonly markers: readonly PublicMapMarkerPresentation[];
  readonly currentScale: number;
  readonly renderedMarkerWidthAtScale: (scale: number) => number;
  readonly renderedMarkerHeight: number;
  readonly previousTopology?: PublicMapClusterTopology;
}): number => {
  const memberIds = input.markers.map((marker) => marker.publicLeadId).sort();
  const minimumNavigationScale = Math.min(
    PUBLIC_MAP_MAX_SCALE,
    input.currentScale + 1,
  );
  for (
    let scale = Math.max(input.currentScale + 0.25, PUBLIC_MAP_MIN_SCALE);
    scale <= PUBLIC_MAP_MAX_SCALE;
    scale += 0.25
  ) {
    const topology = createPublicMapClusterTopology({
      markers: input.markers,
      scale,
      renderedMarkerWidth: input.renderedMarkerWidthAtScale(scale),
      renderedMarkerHeight: input.renderedMarkerHeight,
      ...(input.previousTopology
        ? { previousTopology: input.previousTopology }
        : {}),
    });
    const stillTogether = topology.nodes.some(
      (node) =>
        node.memberLeadIds.length === memberIds.length &&
        memberIds.every((id) => node.memberLeadIds.includes(id)),
    );
    if (!stillTogether)
      return Number(Math.max(scale, minimumNavigationScale).toFixed(2));
  }
  return PUBLIC_MAP_MAX_SCALE;
};

export const inspectPublicMapRepresentation = (
  eligibleLeadIds: readonly string[],
  representedLeadIds: readonly string[],
): PublicMapRepresentationInvariant => {
  const counts = new Map<string, number>();
  for (const id of representedLeadIds)
    counts.set(id, (counts.get(id) ?? 0) + 1);
  const missingLeadIds = [...eligibleLeadIds]
    .sort()
    .filter((id) => !counts.has(id));
  const duplicateLeadIds = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id)
    .sort();
  return {
    missingLeadIds,
    duplicateLeadIds,
    valid: missingLeadIds.length === 0 && duplicateLeadIds.length === 0,
  };
};

export const clusterBoundsPoints = (
  node: Pick<PublicMapClusterNode, "bounds">,
): readonly PublicMapCoordinate[] => [
  { latitude: node.bounds.south, longitude: node.bounds.west },
  { latitude: node.bounds.north, longitude: node.bounds.east },
];
