import { describe, expect, it } from "vitest";
import {
  createPublicMapClusterTopology,
  findPublicMapClusterExpansionScale,
  inspectPublicMapRepresentation,
  projectPublicMapCoordinate,
} from "./public-map-cluster-engine.js";
import type { PublicMapMarkerPresentation } from "./public-map-presentation.js";

const marker = (
  id: string,
  latitude: number,
  longitude: number,
): PublicMapMarkerPresentation => ({
  publicLeadId: id,
  boardShortLabel: `IP ${id}`,
  totalRemainingLabel: "12",
  totalRemainingCompact: false,
  primaryDiscoveryTag: "LAST机会",
  discoveryTagIds: [],
  markerStatusTone: "last",
  opportunityStatus: "GRAND_PRIZE_REMAINS",
  opportunityLabel: "高机会信息",
  freshnessBand: "RECENT",
  freshnessLabel: "近期观察",
  observedAtLabel: "刚刚",
  recordType: "DRAW_RECORD",
  recordTypeLabel: "抽赏记录",
  overlapCount: 0,
  overlapKey: `${latitude}:${longitude}`,
  sourceLabel: "",
  positionClass: "",
  latitude,
  longitude,
});

const longitudeForPixels = (pixels: number, scale: number): number =>
  (pixels * 360) / (256 * 2 ** scale);

describe("screen-space public map clustering", () => {
  it("clusters different coordinates only when rendered footprints overlap", () => {
    const scale = 14;
    const close = marker("b", 31.23, 121.47 + longitudeForPixels(70, scale));
    const far = marker("c", 31.23, 121.47 + longitudeForPixels(180, scale));
    const clustered = createPublicMapClusterTopology({
      markers: [marker("a", 31.23, 121.47), close],
      scale,
      renderedMarkerWidth: 110,
      renderedMarkerHeight: 48,
    });
    const separate = createPublicMapClusterTopology({
      markers: [marker("a", 31.23, 121.47), far],
      scale,
      renderedMarkerWidth: 110,
      renderedMarkerHeight: 48,
    });
    expect(clustered.nodes).toHaveLength(1);
    expect(clustered.nodes[0]?.kind).toBe("CLUSTER");
    expect(separate.nodes).toHaveLength(2);
  });

  it("includes the continuous right-block width in the collision footprint", () => {
    const scale = 14;
    const markers = [
      marker("a", 31.23, 121.47),
      marker("b", 31.23, 121.47 + longitudeForPixels(100, scale)),
    ];
    expect(
      createPublicMapClusterTopology({
        markers,
        scale,
        renderedMarkerWidth: 84,
        renderedMarkerHeight: 48,
      }).nodes,
    ).toHaveLength(2);
    expect(
      createPublicMapClusterTopology({
        markers,
        scale,
        renderedMarkerWidth: 132,
        renderedMarkerHeight: 48,
      }).nodes,
    ).toHaveLength(1);
  });

  it("is deterministic regardless of input ordering", () => {
    const markers = [
      marker("c", 31.23, 121.49),
      marker("a", 31.23, 121.47),
      marker("b", 31.23, 121.4701),
    ];
    const create = (items: readonly PublicMapMarkerPresentation[]) =>
      createPublicMapClusterTopology({
        markers: items,
        scale: 14,
        renderedMarkerWidth: 110,
        renderedMarkerHeight: 48,
      }).nodes.map((node) => node.clusterKey);
    expect(create(markers)).toEqual(create([...markers].reverse()));
  });

  it("uses hysteresis to avoid flipping at a one-pixel boundary", () => {
    const scale = 14;
    const initial = createPublicMapClusterTopology({
      markers: [
        marker("a", 31.23, 121.47),
        marker("b", 31.23, 121.47 + longitudeForPixels(88, scale)),
      ],
      scale,
      renderedMarkerWidth: 84,
      renderedMarkerHeight: 48,
    });
    const moved = [
      marker("a", 31.23, 121.47),
      marker("b", 31.23, 121.47 + longitudeForPixels(94, scale)),
    ];
    const withoutHistory = createPublicMapClusterTopology({
      markers: moved,
      scale,
      renderedMarkerWidth: 84,
      renderedMarkerHeight: 48,
    });
    const withHistory = createPublicMapClusterTopology({
      markers: moved,
      scale,
      renderedMarkerWidth: 84,
      renderedMarkerHeight: 48,
      previousTopology: initial,
    });
    expect(initial.nodes).toHaveLength(1);
    expect(withoutHistory.nodes).toHaveLength(2);
    expect(withHistory.nodes).toHaveLength(1);
  });

  it("returns a meaningful camera step and respects the current hysteresis band", () => {
    const scale = 12;
    const markers = [
      marker("a", 31.23, 121.47),
      marker("b", 31.23, 121.47 + longitudeForPixels(100, scale)),
    ];
    const current = createPublicMapClusterTopology({
      markers,
      scale,
      renderedMarkerWidth: 110,
      renderedMarkerHeight: 48,
    });
    const expansionScale = findPublicMapClusterExpansionScale({
      markers,
      currentScale: scale,
      renderedMarkerWidthAtScale: () => 110,
      renderedMarkerHeight: 48,
      previousTopology: current,
    });
    expect(expansionScale).toBeGreaterThanOrEqual(scale + 1);
    expect(
      createPublicMapClusterTopology({
        markers,
        scale: expansionScale,
        renderedMarkerWidth: 110,
        renderedMarkerHeight: 48,
        previousTopology: current,
      }).nodes,
    ).toHaveLength(2);
  });

  it("finds a useful expansion scale for the synthetic seven-lead cluster", () => {
    const markers = [
      marker("1", 31.2304, 121.4737),
      marker("2", 31.2201, 121.492),
      marker("3", 31.245, 121.445),
      marker("4", 31.2201, 121.492),
      marker("6", 31.208, 121.458),
      marker("7", 31.208, 121.458),
      marker("9", 31.235, 121.526),
    ];
    const current = createPublicMapClusterTopology({
      markers,
      scale: 12,
      renderedMarkerWidth: 96.44,
      renderedMarkerHeight: 48,
    });
    const expansionScale = findPublicMapClusterExpansionScale({
      markers,
      currentScale: 12,
      renderedMarkerWidthAtScale: () => 105,
      renderedMarkerHeight: 48,
      previousTopology: current,
    });
    expect(expansionScale).toBe(13);
  });

  it("keeps exact coordinates unresolved without mutating them", () => {
    const markers = [marker("a", 31.23, 121.47), marker("b", 31.23, 121.47)];
    const topology = createPublicMapClusterTopology({
      markers,
      scale: 18,
      renderedMarkerWidth: 132,
      renderedMarkerHeight: 48,
    });
    expect(topology.nodes).toHaveLength(1);
    expect(topology.nodes[0]).toMatchObject({
      kind: "CLUSTER",
      exactOverlap: true,
      latitude: 31.23,
      longitude: 121.47,
    });
  });

  it("projects geographic separation into real scale-specific screen pixels", () => {
    const origin = projectPublicMapCoordinate(
      { latitude: 31.23, longitude: 121.47 },
      14,
    );
    const shifted = projectPublicMapCoordinate(
      { latitude: 31.23, longitude: 121.47 + longitudeForPixels(80, 14) },
      14,
    );
    expect(shifted.x - origin.x).toBeCloseTo(80, 5);
  });

  it("reports missing and duplicate stable representations", () => {
    expect(inspectPublicMapRepresentation(["a", "b"], ["a", "b"]).valid).toBe(
      true,
    );
    expect(inspectPublicMapRepresentation(["a", "b"], ["a", "a"])).toEqual({
      missingLeadIds: ["b"],
      duplicateLeadIds: ["a"],
      valid: false,
    });
  });
});
