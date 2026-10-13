import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";

import { MarkerImageCache } from "./marker-image-cache.js";
import { PublicMapClient } from "./public-map-client.js";
import type {
  PublicDetailResult,
  PublicMapService,
  PublicMarker,
  PublicViewportRequest,
  PublicViewportResult,
} from "./public-map-contract.js";
import { createDefaultPublicMapQuery } from "./public-map-query.js";
import { createNativeMapClusterTopology } from "./public-map-native-presentation.js";
import { presentPublicMarker } from "./public-map-presentation.js";
import { SYNTHETIC_PUBLIC_MARKERS } from "./public-map-synthetic-service.js";
import { inspectPublicMapRepresentation } from "./public-map-cluster-engine.js";

const marker = (index: number, overlap = false): PublicMarker => ({
  ...SYNTHETIC_PUBLIC_MARKERS[index % SYNTHETIC_PUBLIC_MARKERS.length]!,
  publicLeadId: `scale-lead-${String(index).padStart(3, "0")}`,
  publicLocation: {
    ...SYNTHETIC_PUBLIC_MARKERS[0]!.publicLocation,
    latitude: overlap ? 31.2304 : 31.15 + Math.floor(index / 25) * 0.004,
    longitude: overlap ? 121.4737 : 121.39 + (index % 25) * 0.006,
  },
});

const data = Array.from({ length: 500 }, (_, index) => marker(index));

const response = (
  request: PublicViewportRequest,
  items: readonly PublicMarker[],
  nextCursor: string | null,
): PublicViewportResult => ({
  ok: true,
  schemaVersion: "public-map-v3",
  requestId: request.requestId,
  generation: request.generation,
  asOf: "2026-09-24T00:00:00.000Z",
  queryEcho: { boundsDigest: "scale", zoomBand: "12", filtersDigest: "all" },
  items,
  nextCursor,
  truncated: false,
  density: {
    returnedCount: items.length,
    serverCap: 500,
    overlapPresent: false,
    aggregationAvailable: false,
    removedSinceSnapshot: 0,
  },
});

class PagedService implements PublicMapService {
  readonly requests: PublicViewportRequest[] = [];
  rejectNext = false;

  query(request: PublicViewportRequest): Promise<PublicViewportResult> {
    this.requests.push(request);
    if (this.rejectNext) {
      this.rejectNext = false;
      return Promise.reject(new Error("network offline: private debug text"));
    }
    const offset = Number(request.cursor ?? 0);
    const items = data.slice(offset, offset + request.limit);
    const next = offset + request.limit;
    return Promise.resolve(
      response(request, items, next < data.length ? String(next) : null),
    );
  }

  detail(): Promise<PublicDetailResult> {
    return Promise.reject(new Error("network offline: private debug text"));
  }
}

describe("TASK-V2-18 scale and weak network", () => {
  it("uses page 50 and stops after the 500-item snapshot without a table pull", async () => {
    const service = new PagedService();
    const client = new PublicMapClient({
      service,
      initialQuery: createDefaultPublicMapQuery(),
    });
    await client.loadInitial();
    while (client.state.nextCursor) await client.loadNextPage();
    expect(service.requests).toHaveLength(10);
    expect(service.requests.every((request) => request.limit === 50)).toBe(
      true,
    );
    expect(client.state.items).toHaveLength(500);
    expect(
      new Set(client.state.items.map((item) => item.publicLeadId)).size,
    ).toBe(500);
  });

  it("retains stable markers on rejected refresh and recovers by explicit retry", async () => {
    const service = new PagedService();
    const client = new PublicMapClient({
      service,
      initialQuery: createDefaultPublicMapQuery(),
    });
    await client.loadInitial();
    service.rejectNext = true;
    await client.refresh();
    expect(client.state.phase).toBe("STALE_CACHE");
    expect(client.state.items).toHaveLength(50);
    expect(client.state.error?.message).not.toContain("private debug text");
    expect(service.requests).toHaveLength(2);
    await client.refresh();
    expect(client.state.phase).toBe("LOADED");
    expect(client.state.items).toHaveLength(50);
    await client.selectLead(data[0]!.publicLeadId);
    expect(client.state.detail.phase).toBe("ERROR");
    expect(client.state.detail.error?.message).not.toContain(
      "private debug text",
    );
  });

  it.each([10, 30, 100, 500])(
    "preserves %i identities through cluster split and merge",
    (count) => {
      const markers = data
        .slice(0, count)
        .map((item, index) => presentPublicMarker(item, index));
      const start = performance.now();
      const low = createNativeMapClusterTopology(markers, 10, undefined, 0);
      const high = createNativeMapClusterTopology(markers, 18, low, 4);
      const merged = createNativeMapClusterTopology(markers, 10, high, 0);
      for (const topology of [low, high, merged]) {
        expect(topology.nodes.length).toBeLessThanOrEqual(count);
        expect(
          inspectPublicMapRepresentation(
            markers.map((item) => item.publicLeadId),
            topology.nodes.flatMap((node) => node.memberLeadIds),
          ).valid,
        ).toBe(true);
      }
      if (count === 500)
        console.log(
          `TASK-V2-18 cluster 500 split/merge CPU proxy: ${(performance.now() - start).toFixed(1)} ms; low/high/merged nodes ${low.nodes.length}/${high.nodes.length}/${merged.nodes.length}`,
        );
    },
  );

  it("bounds PNG key reuse at 192 entries across a 500-lead stress sequence", async () => {
    const cache = new MarkerImageCache();
    for (let index = 0; index < 500; index += 1) {
      const key = `scale-${index}`;
      await cache.getOrCreate(key, async () => ({
        renderKey: key,
        iconPath: `/tmp/${key}.png`,
        width: 140,
        height: 72,
        anchor: { x: 0.2, y: 0.9 },
      }));
    }
    for (let index = 308; index < 500; index += 1) {
      await cache.getOrCreate(`scale-${index}`, async () => {
        throw new Error("cache miss");
      });
    }
    expect(cache.size).toBe(192);
    expect(cache.diagnostics).toMatchObject({
      hits: 192,
      misses: 500,
      pending: 0,
    });
  });
});
