import { describe, expect, it } from "vitest";
import type { PublicMapMarkerPresentation } from "./public-map-presentation.js";
import {
  NATIVE_MARKER_LEFT_WIDTH,
  NATIVE_MARKER_MAX_RIGHT_WIDTH,
  NATIVE_MARKER_MIN_RIGHT_WIDTH,
  planNativeMapStableReconcile,
  planNativeMapTopologyTransition,
  projectNativeMapMarkers,
} from "./public-map-native-presentation.js";

const marker = (
  id: string,
  latitude: number,
  longitude: number,
): PublicMapMarkerPresentation => ({
  publicLeadId: id,
  boardShortLabel: id,
  totalRemainingLabel: "41",
  totalRemainingCompact: false,
  primaryDiscoveryTag: "LAST机会大",
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

describe("native map stability mode", () => {
  it("keeps marker dimensions fixed at every zoom", () => {
    const markers = [marker("a", 31.23, 121.47)];
    const low = projectNativeMapMarkers({
      markers,
      scale: 12,
      selectedPublicLeadId: "",
    });
    const high = projectNativeMapMarkers({
      markers,
      scale: 18,
      selectedPublicLeadId: "",
    });
    expect(NATIVE_MARKER_MIN_RIGHT_WIDTH).toBe(82);
    expect(NATIVE_MARKER_MAX_RIGHT_WIDTH).toBe(82);
    expect(low.views[0]?.totalWidth).toBe(NATIVE_MARKER_LEFT_WIDTH + 82);
    expect(high.views[0]?.totalWidth).toBe(low.views[0]?.totalWidth);
    expect(high.views[0]?.presentationProgress).toBe(1);
    expect(high.views[0]?.visualOffsetX).toBe(0);
    expect(high.views[0]?.visualOffsetY).toBe(0);
    expect(high.bindings[0]?.alpha).toBe(0);
    expect(high.bindings[0]?.width).toBe(1);
    expect(high.bindings[0]).not.toHaveProperty("customCallout");
  });

  it("keeps zoom topology frozen until an explicit final projection is requested", () => {
    const markers = [marker("a", 31.23, 121.47), marker("b", 31.23, 121.4708)];
    const previous = projectNativeMapMarkers({
      markers,
      scale: 12,
      selectedPublicLeadId: "",
    });
    const observed = projectNativeMapMarkers({
      markers,
      previousTopology: previous.topology,
      scale: 18,
      selectedPublicLeadId: "",
    });
    expect(previous.views).toHaveLength(1);
    expect(observed.views).toHaveLength(2);
    expect(planNativeMapTopologyTransition(previous, observed).direction).toBe(
      "SPLIT",
    );
  });

  it("plans split as one final binding replacement", () => {
    const markers = [marker("a", 31.23, 121.47), marker("b", 31.23, 121.4708)];
    const previous = projectNativeMapMarkers({
      markers,
      scale: 12,
      selectedPublicLeadId: "",
    });
    const target = projectNativeMapMarkers({
      markers,
      previousTopology: previous.topology,
      scale: 18,
      selectedPublicLeadId: "",
    });
    const plan = planNativeMapStableReconcile({ previous, target });
    expect(plan.direction).toBe("SPLIT");
    expect(plan.finalBindingProjection).toBe(target);
    expect(plan.finalBindingProjection.bindings).toEqual(target.bindings);
  });

  it("plans merge as one final binding replacement", () => {
    const markers = [marker("a", 31.23, 121.47), marker("b", 31.23, 121.4708)];
    const previous = projectNativeMapMarkers({
      markers,
      scale: 18,
      selectedPublicLeadId: "",
    });
    const target = projectNativeMapMarkers({
      markers,
      previousTopology: previous.topology,
      scale: 12,
      selectedPublicLeadId: "",
    });
    const plan = planNativeMapStableReconcile({ previous, target });
    expect(plan.direction).toBe("MERGE");
    expect(plan.finalBindingProjection).toBe(target);
    expect(plan.finalBindingProjection.views).toHaveLength(1);
  });

  it("preserves exact-overlap spiderfy identity and real coordinates", () => {
    const markers = [marker("a", 31.23, 121.47), marker("b", 31.23, 121.47)];
    const collapsed = projectNativeMapMarkers({
      markers,
      scale: 18,
      selectedPublicLeadId: "",
    });
    const expanded = projectNativeMapMarkers({
      markers,
      previousTopology: collapsed.topology,
      scale: 18,
      selectedPublicLeadId: "",
      spiderfyClusterKey: collapsed.views[0]?.clusterKey ?? "",
    });
    expect(expanded.views.map((view) => view.publicLeadId).sort()).toEqual([
      "a",
      "b",
    ]);
    expect(
      expanded.views.every(
        (view) => view.realLatitude === 31.23 && view.realLongitude === 121.47,
      ),
    ).toBe(true);
    expect(expanded.invariant.valid).toBe(true);
  });
});
