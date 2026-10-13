/** Run explicitly with ICHI_RUN_V2_MAP_BENCHMARK=1; local Node proxies, never device FPS. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  D09_PILOT_DEFAULTS,
  InMemoryPublicLeadRepository,
  InMemoryQuerySnapshotStore,
  InMemorySharedRateLimitStore,
  PublicMapService,
  type ViewportRequest,
} from "../../packages/v2-map/src/public-api.js";
import type { PublicMapLeadCore } from "../../packages/v2-map/src/projector.js";
import {
  MarkerCanvasRenderer,
  type MarkerCanvasRenderInput,
} from "../../apps/client/miniprogram/platform/marker-canvas-renderer.js";
import { MarkerImageCache } from "../../apps/client/miniprogram/platform/marker-image-cache.js";
import { markerDetailLevel } from "../../apps/client/miniprogram/platform/marker-zoom-adaptive.js";
import { resolveCanvasMarkerProjection } from "../../apps/client/miniprogram/platform/marker-binding-adapter.js";
import { PublicMapClient } from "../../apps/client/miniprogram/platform/public-map-client.js";
import {
  projectPublicMapCoordinate,
  inspectPublicMapRepresentation,
} from "../../apps/client/miniprogram/platform/public-map-cluster-engine.js";
import { createDefaultPublicMapQuery } from "../../apps/client/miniprogram/platform/public-map-query.js";
import { projectNativeMapMarkers } from "../../apps/client/miniprogram/platform/public-map-native-presentation.js";
import { presentPublicMarker } from "../../apps/client/miniprogram/platform/public-map-presentation.js";
import type {
  PublicDetailResult,
  PublicMapService as ClientService,
  PublicMarker,
  PublicViewportRequest,
  PublicViewportResult,
} from "../../apps/client/miniprogram/platform/public-map-contract.js";
import { clusterStressFixture } from "../fixtures/public-map-cluster-picker.fixture.js";

const sizes = [10, 30, 50, 100, 200, 300, 500] as const;
const samplesPerSize = 21;
const now = Date.parse("2026-09-24T01:00:00.000Z");
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const stats = (values: readonly number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: Number(sorted[0]!.toFixed(3)),
    median: Number(sorted[Math.floor(sorted.length / 2)]!.toFixed(3)),
    p95: Number(sorted[Math.ceil(sorted.length * 0.95) - 1]!.toFixed(3)),
  };
};
const measure = <T>(fn: () => T): { result: T; ms: number } => {
  const start = performance.now();
  const result = fn();
  return { result, ms: performance.now() - start };
};
const memory = () => {
  const value = process.memoryUsage();
  return {
    heapUsedBytes: value.heapUsed,
    rssBytes: value.rss,
    externalBytes: value.external,
  };
};

const lead = (index: number): PublicMapLeadCore => ({
  publicLeadId: `bench-lead-${String(index).padStart(4, "0")}`,
  servedVersion: 1,
  projectionVersion: "projection-v1",
  policyVersion: "public-policy-v1",
  visibility: "VISIBLE",
  publicLocation: {
    coordinateSystem: "GCJ02",
    latitude: 31.15 + Math.floor(index / 25) * 0.006,
    longitude: 121.39 + (index % 25) * 0.006,
    precisionMode: "APPROXIMATE",
    areaLabel: "上海",
    locationPolicyVersion: "location-v1",
    projectionRuleId: "benchmark-grid",
  },
  boardShortLabel: `测试版面 ${index}`,
  board: {
    ipName: `测试版面 ${index}`,
    themeName: null,
    pricePerDrawMinor: 7900,
    tiers: [
      {
        tierCode: "A",
        displayLabel: "A赏",
        remainingTickets: 1,
        isGrandPrize: true,
      },
    ],
  },
  recordType: "DRAW_RECORD",
  opportunity: {
    level: "HIGH",
    reasonCodes: ["GRAND_PRIZE_REMAINS"],
    policyVersion: "opportunity-v1",
    evaluatedAt: "2026-09-24T00:00:00.000Z",
  },
  observedAt: "2026-09-24T00:00:00.000Z",
  freshnessPolicyVersion: "freshness-v1",
  venueNote: null,
  contributor: {
    displayName: "ICHI 玩家",
    avatar: { kind: "FALLBACK_ASSET", path: "/assets/v1-29/ichi-avatar.png" },
  },
  sourceLabel: null,
  disclosures: { nonRealtime: true, nonRecommendation: true },
  retiredAt: null,
});

const request = (
  overrides: Partial<ViewportRequest> = {},
): ViewportRequest => ({
  bbox: { west: 121.3, south: 31.1, east: 121.7, north: 31.4 },
  zoom: 18,
  mode: "MAP",
  opportunityLevels: [],
  includeLowFreshness: true,
  limit: 50,
  cursor: null,
  asOf: null,
  requestId: "bench-root",
  generation: 1,
  supportedSchemaVersions: ["public-map-v2"],
  ...overrides,
});

const serviceFor = (count: number) => {
  let snapshot = 0;
  return new PublicMapService(
    new InMemoryPublicLeadRepository(
      Array.from({ length: count }, (_, index) => lead(index)),
    ),
    new InMemoryQuerySnapshotStore(),
    {
      policyVersion: "freshness-v1",
      recentMaxAgeMs: 3_600_000,
      agingMaxAgeMs: 86_400_000,
    },
    {
      account: { currentAccount: () => ({ accountId: "benchmark-account" }) },
      rateLimit: new InMemorySharedRateLimitStore(),
      readControl: { readState: () => "ENABLED" },
      cursorSecret: {
        currentSecret: () => "benchmark-only-cursor-secret-32-bytes",
      },
    },
    // Lift only the account request quota for repeated local sampling; page/cap/TTL are unchanged.
    { ...D09_PILOT_DEFAULTS, queryRequestsPerMinute: 10_000 },
    () => now,
    () => `benchmark-snapshot-${++snapshot}`,
  );
};

const fetchAll = (api: PublicMapService, prefix: string) => {
  const items: PublicMarker[] = [];
  const pageBytes: number[] = [];
  const pageMs: number[] = [];
  let cursor: string | null = null;
  let asOf: string | null = null;
  let page = 0;
  do {
    const timed = measure(() =>
      api.query(request({ cursor, asOf, requestId: `${prefix}-${page++}` })),
    );
    const result = timed.result;
    if (!result.ok) throw new Error(result.code);
    pageMs.push(timed.ms);
    pageBytes.push(Buffer.byteLength(JSON.stringify(result)));
    items.push(...(result.items as PublicMarker[]));
    cursor = result.nextCursor;
    asOf = result.asOf;
  } while (cursor);
  return { items, pageBytes, pageMs };
};

const fakeCanvasRuntime = () => {
  const originalWx = (globalThis as Record<string, unknown>).wx;
  let exportCount = 0;
  const context = new Proxy(
    {},
    {
      get: (_target, key) =>
        key === "measureText"
          ? (value: string) => ({ width: [...value].length * 8 })
          : () => undefined,
      set: () => true,
    },
  );
  const canvas = { width: 0, height: 0, getContext: () => context };
  const scope = {
    createSelectorQuery: () => {
      let callback: ((value: { node: typeof canvas }) => void) | undefined;
      return {
        select: () => ({
          fields: (_options: unknown, cb: typeof callback) => {
            callback = cb;
          },
        }),
        exec: () => callback?.({ node: canvas }),
      };
    },
  };
  (globalThis as Record<string, unknown>).wx = {
    getWindowInfo: () => ({ pixelRatio: 2 }),
    canvasToTempFilePath: (options: {
      success(result: { tempFilePath: string }): void;
    }) => {
      exportCount += 1;
      options.success({
        tempFilePath: `/tmp/benchmark-simulated-png-${exportCount}.png`,
      });
    },
  };
  return {
    renderer: new MarkerCanvasRenderer(scope as never),
    exports: () => exportCount,
    restore: () => {
      (globalThis as Record<string, unknown>).wx = originalWx;
    },
  };
};

describe.runIf(process.env.ICHI_RUN_V2_MAP_BENCHMARK === "1")(
  "TASK-V2-18 reproducible Node benchmark",
  () => {
    it("records the fixed matrix, invariants and local-only metrics", async () => {
      const runtime = fakeCanvasRuntime();
      const before = memory();
      const matrix = [];
      const memorySnapshots: Record<string, ReturnType<typeof memory>> = {
        before,
      };
      try {
        for (const count of sizes) {
          const api = serviceFor(count);
          const rootSamples = Array.from(
            { length: samplesPerSize },
            (_, index) =>
              measure(() =>
                api.query(request({ requestId: `root-${count}-${index}` })),
              ).ms,
          );
          const fetched = fetchAll(api, `fetch-${count}`);
          expect(fetched.items).toHaveLength(count);
          const presentationSamples: number[] = [];
          const coordinateSamples: number[] = [];
          const clusterSamples: number[] = [];
          const splitMergeSamples: number[] = [];
          const presentation = fetched.items.map(presentPublicMarker);
          for (let run = 0; run < samplesPerSize; run += 1) {
            presentationSamples.push(
              measure(() => fetched.items.map(presentPublicMarker)).ms,
            );
            coordinateSamples.push(
              measure(() =>
                presentation.map((item) =>
                  projectPublicMapCoordinate(
                    { latitude: item.latitude, longitude: item.longitude },
                    18,
                  ),
                ),
              ).ms,
            );
            const low = measure(() =>
              projectNativeMapMarkers({
                markers: presentation,
                scale: 10,
                detailLevel: 0,
                selectedPublicLeadId: "",
              }),
            );
            const high = measure(() =>
              projectNativeMapMarkers({
                markers: presentation,
                scale: 18,
                detailLevel: 4,
                selectedPublicLeadId: "",
                previousTopology: low.result.topology,
              }),
            );
            const merged = measure(() =>
              projectNativeMapMarkers({
                markers: presentation,
                scale: 10,
                detailLevel: 0,
                selectedPublicLeadId: "",
                previousTopology: high.result.topology,
              }),
            );
            clusterSamples.push(high.ms);
            splitMergeSamples.push(low.ms + high.ms + merged.ms);
            for (const projection of [low.result, high.result, merged.result]) {
              expect(projection.invariant.valid).toBe(true);
              expect(
                inspectPublicMapRepresentation(
                  presentation.map((item) => item.publicLeadId),
                  projection.views.flatMap((view) => view.memberLeadIds),
                ).valid,
              ).toBe(true);
            }
          }
          const highProjection = projectNativeMapMarkers({
            markers: presentation,
            scale: 18,
            detailLevel: 4,
            selectedPublicLeadId: "",
          });
          const cache = new MarkerImageCache();
          const drawTimes: number[] = [];
          let pendingPeak = 0;
          const timedRenderer = {
            render: async (input: MarkerCanvasRenderInput) => {
              const start = performance.now();
              const asset = await runtime.renderer.render(input);
              drawTimes.push(performance.now() - start);
              pendingPeak = Math.max(pendingPeak, cache.diagnostics.pending);
              return asset;
            },
          } as unknown as MarkerCanvasRenderer;
          const coldStart = performance.now();
          const cold = await resolveCanvasMarkerProjection({
            projection: highProjection,
            cache,
            renderer: timedRenderer,
            adaptive: true,
          });
          const coldMs = performance.now() - coldStart;
          const coldDiagnostics = { ...cache.diagnostics };
          const warmStart = performance.now();
          const warm = await resolveCanvasMarkerProjection({
            projection: highProjection,
            previousProjection: cold,
            cache,
            renderer: timedRenderer,
            adaptive: true,
          });
          const warmMs = performance.now() - warmStart;
          const warmDiagnostics = { ...cache.diagnostics };
          const bindingReplacements = cold.bindings.reduce(
            (changed, binding, index) =>
              changed +
              Number(binding.iconPath !== warm.bindings[index]?.iconPath),
            0,
          );
          const row = {
            count,
            rootQueryMs: stats(rootSamples),
            rootResponseBytes: fetched.pageBytes[0],
            pageCount: fetched.pageBytes.length,
            totalResponseBytes: fetched.pageBytes.reduce(
              (sum, value) => sum + value,
              0,
            ),
            presentationMs: stats(presentationSamples),
            coordinateProjectionMs: stats(coordinateSamples),
            clusterHighMs: stats(clusterSamples),
            splitMergeMs: stats(splitMergeSamples),
            coldPngResolveMs: Number(coldMs.toFixed(3)),
            firstDrawCommandMs: stats(drawTimes.slice(0, count)),
            warmPngResolveMs: Number(warmMs.toFixed(3)),
            pngCold: coldDiagnostics,
            pngWarm: warmDiagnostics,
            pendingRenderPeak: pendingPeak,
            coldBindingCount: cold.bindings.length,
            warmBindingReplacementCandidates: bindingReplacements,
            previousBindingReuseCount:
              cold.bindings.length - bindingReplacements,
          };
          const firstStableStart = performance.now();
          const firstStableFetched = fetchAll(
            serviceFor(count),
            `first-stable-${count}`,
          );
          const firstStableMarkers =
            firstStableFetched.items.map(presentPublicMarker);
          const firstStableProjection = projectNativeMapMarkers({
            markers: firstStableMarkers,
            scale: 18,
            detailLevel: 4,
            selectedPublicLeadId: "",
          });
          await resolveCanvasMarkerProjection({
            projection: firstStableProjection,
            cache: new MarkerImageCache(),
            renderer: runtime.renderer,
            adaptive: true,
          });
          Object.assign(row, {
            firstStableNodeProxyMs: Number(
              (performance.now() - firstStableStart).toFixed(3),
            ),
          });
          matrix.push(row);
          if (count === 100 || count === 300 || count === 500)
            memorySnapshots[`after${count}`] = memory();
        }

        const dense = [];
        const denseBase = fetchAll(serviceFor(1), "dense-base").items[0]!;
        for (const count of [100, 300, 500]) {
          const markers = Array.from({ length: count }, (_, index) =>
            presentPublicMarker(
              {
                ...denseBase,
                publicLeadId: `dense-${index}`,
                publicLocation: {
                  ...denseBase.publicLocation,
                  latitude: 31.23,
                  longitude: 121.47 + index * 0.0000001,
                },
              },
              index,
            ),
          );
          const measured = measure(() =>
            projectNativeMapMarkers({
              markers,
              scale: 18,
              detailLevel: 4,
              selectedPublicLeadId: "",
            }),
          );
          dense.push({
            count,
            ms: Number(measured.ms.toFixed(3)),
            clusters: measured.result.views.filter(
              (item) => item.kind === "CLUSTER",
            ).length,
            individualMarkers: measured.result.views.filter(
              (item) => item.kind === "LEAD",
            ).length,
            invariant: measured.result.invariant.valid,
          });
          expect(measured.result.invariant.valid).toBe(true);
        }
        const exact = projectNativeMapMarkers({
          markers: clusterStressFixture.sameCoordinate,
          scale: 18,
          detailLevel: 4,
          selectedPublicLeadId: "",
        });
        const mixed = projectNativeMapMarkers({
          markers: clusterStressFixture.mixedNear,
          scale: 18,
          detailLevel: 4,
          selectedPublicLeadId: "",
        });

        const pagingApi = serviceFor(500);
        const pagingRuns = Array.from({ length: samplesPerSize }, (_, index) =>
          fetchAll(pagingApi, `paging-${index}`),
        );
        const paginationMs = pagingRuns.flatMap((run) => run.pageMs.slice(1));
        const firstPaging = pagingRuns[0]!;
        expect(firstPaging.pageBytes).toHaveLength(10);
        const rapid = await rapidPanClientStress();
        const zoomScenarios = [];
        for (const count of [100, 500]) {
          const markers = fetchAll(
            serviceFor(count),
            `zoom-${count}`,
          ).items.map(presentPublicMarker);
          const panMarkers = [
            ...markers.slice(25),
            ...markers.slice(0, 25).map((item, index) => ({
              ...item,
              publicLeadId: `pan-new-${count}-${index}`,
              boardShortLabel: `${item.boardShortLabel} 新`,
              longitude: item.longitude + 0.2,
            })),
          ];
          for (const [name, scales] of [
            ["slow-in", [10, 12, 14, 16, 18]],
            ["slow-out", [18, 16, 14, 12, 10]],
            ["fast-pinch", [10, 18]],
            ["reverse-pinch", [10, 18, 10, 18, 10]],
            ["zoom-plus-pan-changed-25-leads", [10, 12, 16, 18]],
          ] as const) {
            const cache = new MarkerImageCache();
            let previous:
              | Awaited<ReturnType<typeof resolveCanvasMarkerProjection>>
              | undefined;
            let topologyChanges = 0;
            let bindingCommitCandidates = 0;
            let maxBindings = 0;
            let valid = true;
            const exportsBefore = runtime.exports();
            const started = performance.now();
            for (const [step, scale] of scales.entries()) {
              const projection = projectNativeMapMarkers({
                markers:
                  name === "zoom-plus-pan-changed-25-leads" && step >= 2
                    ? panMarkers
                    : markers,
                scale,
                detailLevel: markerDetailLevel(scale),
                selectedPublicLeadId: "",
                ...(previous ? { previousTopology: previous.topology } : {}),
              });
              const resolved = await resolveCanvasMarkerProjection({
                projection,
                ...(previous ? { previousProjection: previous } : {}),
                cache,
                renderer: runtime.renderer,
                adaptive: true,
              });
              valid &&= resolved.invariant.valid;
              if (
                previous?.topology.fingerprint !== resolved.topology.fingerprint
              )
                topologyChanges += 1;
              if (
                !previous ||
                JSON.stringify(previous.bindings) !==
                  JSON.stringify(resolved.bindings)
              )
                bindingCommitCandidates += 1;
              maxBindings = Math.max(maxBindings, resolved.bindings.length);
              previous = resolved;
            }
            expect(valid).toBe(true);
            zoomScenarios.push({
              count,
              name,
              observations: scales.length,
              elapsedNodeMs: Number((performance.now() - started).toFixed(3)),
              topologyChanges,
              bindingCommitCandidates,
              maxBindings,
              newSimulatedExports: runtime.exports() - exportsBefore,
              cache: cache.diagnostics,
              identityInvariant: valid,
            });
          }
        }
        const memoryBeforeRepeated500 = memory();
        const repeatMarkers = fetchAll(
          serviceFor(500),
          "memory-repeat",
        ).items.map(presentPublicMarker);
        let repeatProjection = projectNativeMapMarkers({
          markers: repeatMarkers,
          scale: 10,
          detailLevel: 0,
          selectedPublicLeadId: "",
        });
        for (let index = 0; index < 100; index += 1) {
          repeatProjection = projectNativeMapMarkers({
            markers: repeatMarkers,
            scale: index % 2 ? 10 : 18,
            detailLevel: index % 2 ? 0 : 4,
            selectedPublicLeadId: "",
            previousTopology: repeatProjection.topology,
          });
        }
        memorySnapshots.afterPanZoom = memory();
        const result = {
          classification:
            "LOCAL_NODE_JS_AND_FAKE_CANVAS_COMMAND_PROXY_NOT_WECHAT_NATIVE_FPS",
          generatedAt: new Date().toISOString(),
          environment: {
            node: process.version,
            platform: process.platform,
            arch: process.arch,
            cpus: os.cpus().length,
            model: os.cpus()[0]?.model,
            sampleCount: samplesPerSize,
            source: "formal V2 map modules + local reference service",
          },
          matrix,
          dense,
          exactOverlap: {
            nodes: exact.views.length,
            invariant: exact.invariant.valid,
          },
          mixedOverlap: {
            nodes: mixed.views.length,
            invariant: mixed.invariant.valid,
          },
          pagination500: {
            perPageBytes: firstPaging.pageBytes,
            totalBytes: firstPaging.pageBytes.reduce(
              (sum, bytes) => sum + bytes,
              0,
            ),
            pageLatencyMs: stats(paginationMs),
            pages: firstPaging.pageBytes.length,
          },
          rapidPanDirectClient: rapid,
          zoomScenarios,
          repeated500: {
            projections: 100,
            before: memoryBeforeRepeated500,
            after: memorySnapshots.afterPanZoom,
            invariant: repeatProjection.invariant.valid,
          },
          memory: memorySnapshots,
          simulatedCanvasExports: runtime.exports(),
          nativeTiming: "NOT_MEASURABLE_WITH_LOCAL_NODE",
          nativeGpuMemory: "NOT_MEASURABLE_WITH_LOCAL_NODE",
          actualTempPngDisk: "NOT_MEASURABLE_WITH_LOCAL_NODE",
        };
        const output = path.join(
          root,
          "artifacts/task18/performance-benchmark.json",
        );
        fs.mkdirSync(path.dirname(output), { recursive: true });
        fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
        console.log(`TASK-V2-18 benchmark: ${output}`);
      } finally {
        runtime.restore();
      }
    }, 120_000);
  },
);

const rapidPanClientStress = async () => {
  const pending: Array<{
    request: PublicViewportRequest;
    resolve: (result: PublicViewportResult) => void;
  }> = [];
  const service: ClientService = {
    query: (query) =>
      new Promise((resolve) => pending.push({ request: query, resolve })),
    detail: (): Promise<PublicDetailResult> =>
      Promise.reject(new Error("not used")),
  };
  const client = new PublicMapClient({
    service,
    initialQuery: createDefaultPublicMapQuery(),
  });
  let terminalCommits = 0;
  client.subscribe((state) => {
    if (state.phase === "LOADED" || state.phase === "EMPTY")
      terminalCommits += 1;
  });
  const started = performance.now();
  const calls = Array.from({ length: 12 }, (_, index) =>
    client.changeQuery({
      ...createDefaultPublicMapQuery(),
      bbox: {
        ...createDefaultPublicMapQuery().bbox,
        west: 121.38 + index * 0.0001,
      },
    }),
  );
  for (let index = pending.length - 1; index >= 0; index -= 1) {
    const item = pending[index]!;
    item.resolve({
      ok: true,
      schemaVersion: "public-map-v2",
      requestId: item.request.requestId,
      generation: item.request.generation,
      asOf: "2026-09-24T01:00:00.000Z",
      queryEcho: {
        boundsDigest: "rapid",
        zoomBand: "12",
        filtersDigest: "all",
      },
      items: [],
      nextCursor: null,
      truncated: false,
      density: {
        returnedCount: 0,
        serverCap: 500,
        overlapPresent: false,
        aggregationAvailable: false,
        removedSinceSnapshot: 0,
      },
    });
  }
  await Promise.all(calls);
  expect(client.state.query.bbox.west).toBeCloseTo(121.3811, 6);
  expect(terminalCommits).toBe(1);
  expect(client.state.phase).toBe("EMPTY");
  return {
    interactions: 12,
    clientRequestsWithoutHostDebounce: pending.length,
    staleResponsesIgnored: 11,
    latestCommitCount: 1,
    cpuAndMicrotaskMs: Number((performance.now() - started).toFixed(3)),
    hostDebounceActualRequests: "NOT_MEASURABLE_WITH_LOCAL_NODE",
  };
};
