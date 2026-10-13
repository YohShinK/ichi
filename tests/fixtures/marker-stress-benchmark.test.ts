import { describe, expect, it } from "vitest";
import {
  MarkerStressRecorder,
  MarkerStressService,
  markerStressFixture,
  markerStressIndividualTopology,
  type MarkerStressCount,
} from "./marker-stress-benchmark.js";
import { projectNativeMapMarkers } from "../../apps/client/miniprogram/platform/public-map-native-presentation.js";
import { presentPublicMarker } from "../../apps/client/miniprogram/platform/public-map-presentation.js";
import { classifyClusterAtMaxScale } from "../../apps/client/miniprogram/platform/public-map-cluster-picker.js";

describe("TASK-V2-18 archived offline stress fixture", () => {
  for (const count of [100, 300, 500] as const) {
    it(`keeps ${count} worst-case leads distinct in the fixture while the map clusters them`, () => {
      const markers = markerStressFixture({
        scenario: "WORST_CASE",
        count,
      }).map(presentPublicMarker);
      const topology = markerStressIndividualTopology(markers, 18);
      const projection = projectNativeMapMarkers({
        markers,
        scale: 18,
        detailLevel: 4,
        selectedPublicLeadId: "",
      });
      expect(projection.invariant.valid).toBe(true);
      expect(topology.nodes).toHaveLength(count);
      expect(new Set(topology.nodes.map((node) => node.markerId)).size).toBe(
        count,
      );
      expect(projection.views.length).toBeLessThan(count);
      expect(projection.views.some((view) => view.kind === "CLUSTER")).toBe(
        true,
      );
      expect(
        topology.nodes.every(
          (node) =>
            Math.abs(node.latitude - 31.2304) < 0.001 &&
            Math.abs(node.longitude - 121.4737) < 0.001,
        ),
      ).toBe(true);
    });

    it(`retains clustering and exact overlap in the ${count}-lead dense fixture`, () => {
      const markers = markerStressFixture({
        scenario: "REALISTIC_DENSE",
        count,
      }).map(presentPublicMarker);
      const projection = projectNativeMapMarkers({
        markers,
        scale: 15,
        detailLevel: 2,
        selectedPublicLeadId: "",
      });
      expect(projection.invariant.valid).toBe(true);
      expect(projection.views.some((view) => view.kind === "CLUSTER")).toBe(
        true,
      );
      expect(
        new Set(
          markers.map((marker) => `${marker.latitude}:${marker.longitude}`),
        ).size,
      ).toBeLessThan(count);
      const high = projectNativeMapMarkers({
        markers,
        scale: 18,
        detailLevel: 4,
        selectedPublicLeadId: "",
      });
      expect(high.invariant.valid).toBe(true);
      expect(high.views.length).toBeGreaterThan(projection.views.length);
      const byId = new Map(
        markers.map((marker) => [marker.publicLeadId, marker]),
      );
      expect(
        high.views.some(
          (view) =>
            view.kind === "CLUSTER" &&
            classifyClusterAtMaxScale(
              view.memberLeadIds.flatMap((id) => {
                const item = byId.get(id);
                return item ? [item] : [];
              }),
            ) === "UNRESOLVED",
        ),
      ).toBe(true);
    });
  }

  it("serves 500 fixture leads through ten real client-compatible pages", async () => {
    const service = new MarkerStressService({
      scenario: "REALISTIC_DENSE",
      count: 500,
    });
    const seen = new Set<string>();
    let cursor: string | null = null;
    let pages = 0;
    do {
      const response = await service.query({
        bbox: { west: 121.47, east: 121.48, south: 31.22, north: 31.24 },
        zoom: 15,
        mode: "MAP",
        opportunityStatuses: ["HIGH"],
        includeLowFreshness: true,
        supportedSchemaVersions: ["public-map-v3"],
        limit: 50,
        cursor,
        asOf: null,
        requestId: `page-${pages}`,
        generation: 1,
      });
      expect(response.ok).toBe(true);
      if (!response.ok) throw new Error(response.code);
      expect(response.items).toHaveLength(50);
      response.items.forEach((item) => seen.add(item.publicLeadId));
      cursor = response.nextCursor;
      pages += 1;
    } while (cursor);
    expect(pages).toBe(10);
    expect(seen.size).toBe(500);
  });

  it("records binding paths, phases and explicit unmeasurable fields", () => {
    const recorder = new MarkerStressRecorder(
      { scenario: "WORST_CASE", count: 100 as MarkerStressCount },
      "COLD_LIKE",
    );
    recorder.nextPhase("PAN");
    recorder.commit(
      [
        {
          id: 1,
          latitude: 1,
          longitude: 1,
          iconPath: "same",
          alpha: 1,
          width: 1,
          height: 1,
          anchor: { x: 0, y: 0 },
        },
      ],
      [
        {
          id: 1,
          latitude: 1,
          longitude: 1,
          iconPath: "same",
          alpha: 1,
          width: 1,
          height: 1,
          anchor: { x: 0, y: 0 },
        },
      ],
      3,
    );
    const result = recorder.result({
      queryCount: 1,
      detailCount: 0,
      insideViewportCount: null,
      manualNotes: "",
      png: {},
      device: {},
    });
    expect(result.binding.iconPathReuseCount).toBe(1);
    expect(result.binding.callbackDurationsMs).toEqual([3]);
    expect(result.memory).toBe("NOT_MEASURABLE_ON_CURRENT_TOOLING");
    expect(result.phases.some((phase) => phase.phase === "PAN")).toBe(true);
  });
});
