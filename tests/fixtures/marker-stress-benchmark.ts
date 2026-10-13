/** Archived offline stress fixtures; excluded from the mini program package. */
import {
  PUBLIC_MAP_SCHEMA_VERSION,
  type PublicDetail,
  type PublicMapService,
  type PublicMarker,
  type PublicViewportRequest,
  type PublicViewportResult,
  type PublicDetailRequest,
  type PublicDetailResult,
} from "../../apps/client/miniprogram/platform/public-map-contract.js";
import {
  publicMapClusterKey,
  stableNativeMarkerId,
  type PublicMapClusterTopology,
} from "../../apps/client/miniprogram/platform/public-map-cluster-engine.js";
import type { PublicMapMarkerPresentation } from "../../apps/client/miniprogram/platform/public-map-presentation.js";
import type {
  NativeMapMarkerBinding,
  NativeMapMarkerView,
} from "../../apps/client/miniprogram/platform/public-map-native-presentation.js";

export type MarkerStressScenario = "WORST_CASE" | "REALISTIC_DENSE";
export const MARKER_STRESS_BENCHMARK_BUILD = "TASK18-STRESS-2026-09-24-1";
export type MarkerStressCount = 100 | 300 | 500;
export type MarkerStressPhase =
  | "COLD_LOAD"
  | "PAN"
  | "SLOW_ZOOM"
  | "FAST_PINCH"
  | "PAN_ZOOM"
  | "INTERACTION"
  | "IDLE_10S";
export interface MarkerStressCase {
  readonly scenario: MarkerStressScenario;
  readonly count: MarkerStressCount;
}

const center = { latitude: 31.2304, longitude: 121.4737 };
const asOf = "2026-09-24T00:00:00.000Z";
const benchmarkLocation = (
  scenario: MarkerStressScenario,
  index: number,
): { latitude: number; longitude: number } => {
  if (scenario === "WORST_CASE") {
    // All fit in the initial viewport. Force-individual mode measures the
    // native binding ceiling; the approved collision engine is unchanged.
    return {
      latitude: center.latitude + (Math.floor(index / 25) - 9.5) * 0.000075,
      longitude: center.longitude + ((index % 25) - 12) * 0.000075,
    };
  }
  const group = index % 6;
  const local = Math.floor(index / 6);
  const exact = local % 12 === 0;
  const dLat = exact ? 0 : ((local % 7) - 3) * 0.000011;
  const dLon = exact ? 0 : ((Math.floor(local / 7) % 7) - 3) * 0.000011;
  return {
    latitude: center.latitude + (Math.floor(group / 3) - 0.5) * 0.00055 + dLat,
    longitude: center.longitude + ((group % 3) - 1) * 0.00055 + dLon,
  };
};

export const markerStressFixture = (
  input: MarkerStressCase,
): readonly PublicMarker[] =>
  Array.from({ length: input.count }, (_, index) => ({
    publicLeadId: `stress-${input.scenario.toLowerCase()}-${String(index).padStart(3, "0")}`,
    servedVersion: 1,
    projectionVersion: "stress-projection-v1",
    policyVersion: "stress-policy-v1",
    asOf,
    publicLocation: {
      ...benchmarkLocation(input.scenario, index),
      coordinateSystem: "GCJ02" as const,
      precisionMode: "APPROXIMATE" as const,
      areaLabel: "压力测试合成点",
    },
    boardShortLabel: `压力测试 ${index + 1}`,
    totalRemaining: (index % 90) + 1,
    recordType: "DRAW_RECORD" as const,
    opportunity: {
      primaryStatus: "GRAND_PRIZE_REMAINS",
      reasonCodes: ["GRAND_PRIZE_REMAINS"],
      policyVersion: "opportunity-20260930-v1",
      evaluatedAt: "2026-09-30T01:00:00.000Z",
    },
    freshness: {
      observedAt: asOf,
      band: "RECENT" as const,
      freshnessAsOf: asOf,
      policyVersion: "stress-freshness-v1",
    },
    sourceLabel: null,
    overlapHint: null,
  }));

const benchmarkDetail = (item: PublicMarker): PublicDetail => ({
  publicLeadId: item.publicLeadId,
  servedVersion: item.servedVersion,
  projectionVersion: item.projectionVersion,
  policyVersion: item.policyVersion,
  asOf: item.asOf,
  publicLocation: item.publicLocation,
  board: {
    ipName: item.boardShortLabel,
    themeName: null,
    tiers: [
      {
        tierCode: "A",
        displayLabel: "A赏",
        remainingTickets: 1,
        isGrandPrize: true,
      },
    ],
    grandPrizeRemaining: 1,
    totalRemaining: item.totalRemaining,
    pricePerDrawMinor: 7900,
    fullPackCostMinor:
      item.totalRemaining === null ? null : item.totalRemaining * 7900,
  },
  recordType: item.recordType,
  contributor: {
    displayName: "压力测试",
    avatarUrl: "/assets/v1-29/ichi-avatar.png",
  },
  opportunity: {
    level: item.opportunity.primaryStatus,
    reasonCodes: ["BENCHMARK_ONLY"],
    policyVersion: "stress-policy-v1",
    evaluatedAt: asOf,
  },
  freshness: item.freshness,
  venueNote: "仅用于真机压力实验，不是真实地图数据。",
  sourceLabel: null,
  disclosures: { nonRealtime: true, nonRecommendation: true },
});

export class MarkerStressService implements PublicMapService {
  readonly items: readonly PublicMarker[];
  queryCount = 0;
  detailCount = 0;
  constructor(readonly fixture: MarkerStressCase) {
    this.items = markerStressFixture(fixture);
  }
  async query(request: PublicViewportRequest): Promise<PublicViewportResult> {
    this.queryCount += 1;
    const offset = request.cursor ? Number(request.cursor.slice(7)) : 0;
    if (!Number.isInteger(offset) || offset < 0 || offset > this.items.length)
      return {
        ok: false,
        code: "CURSOR_INVALID",
        requestId: request.requestId,
        generation: request.generation,
        retryable: true,
        retryAfterSeconds: null,
      };
    const items = this.items.slice(offset, offset + request.limit);
    const next = offset + items.length;
    return {
      ok: true,
      schemaVersion: PUBLIC_MAP_SCHEMA_VERSION,
      requestId: request.requestId,
      generation: request.generation,
      asOf,
      queryEcho: {
        boundsDigest: "stress-fixture-fixed-viewport",
        zoomBand: `z${Math.round(request.zoom)}`,
        filtersDigest: "stress-only",
      },
      items,
      nextCursor: next < this.items.length ? `stress:${next}` : null,
      truncated: false,
      density: {
        returnedCount: items.length,
        serverCap: 500,
        overlapPresent: this.fixture.scenario === "REALISTIC_DENSE",
        aggregationAvailable: false,
        removedSinceSnapshot: 0,
      },
    };
  }
  async detail(request: PublicDetailRequest): Promise<PublicDetailResult> {
    this.detailCount += 1;
    const item = this.items.find(
      (marker) => marker.publicLeadId === request.publicLeadId,
    );
    if (!item)
      return {
        ok: false,
        code: "LEAD_UNAVAILABLE",
        requestId: request.requestId,
        generation: request.generation,
        retryable: false,
        retryAfterSeconds: null,
      };
    return {
      ok: true,
      schemaVersion: PUBLIC_MAP_SCHEMA_VERSION,
      requestId: request.requestId,
      generation: request.generation,
      item: benchmarkDetail(item),
    };
  }
}

/** Explicit benchmark-only topology override for Native Marker ceiling tests. */
export const markerStressIndividualTopology = (
  markers: readonly PublicMapMarkerPresentation[],
  scale: number,
): PublicMapClusterTopology => ({
  fingerprint: `stress-individual:${markers.length}:${scale}`,
  scale,
  nodes: markers.map((marker) => ({
    nodeId: `LEAD:${marker.publicLeadId}`,
    clusterKey: publicMapClusterKey([marker.publicLeadId]),
    markerId: stableNativeMarkerId(marker.publicLeadId),
    kind: "LEAD" as const,
    memberLeadIds: [marker.publicLeadId],
    memberCoordinates: [
      { latitude: marker.latitude, longitude: marker.longitude },
    ],
    latitude: marker.latitude,
    longitude: marker.longitude,
    bounds: {
      west: marker.longitude,
      east: marker.longitude,
      south: marker.latitude,
      north: marker.latitude,
    },
    exactOverlap: false,
  })),
  markersByLeadId: new Map(
    markers.map((marker) => [marker.publicLeadId, marker]),
  ),
  clusterByLeadId: new Map(),
});

type StressEvent = {
  readonly atMs: number;
  readonly phase: MarkerStressPhase;
  readonly type: string;
  readonly data?: Record<string, unknown>;
};
export class MarkerStressRecorder {
  readonly startedAt = Date.now();
  phase: MarkerStressPhase = "COLD_LOAD";
  readonly events: StressEvent[] = [];
  readonly phases: {
    phase: MarkerStressPhase;
    startedAt: number;
    endedAt?: number;
  }[] = [];
  firstStableAt: number | null = null;
  projectionCount = 0;
  projectionTotalMs = 0;
  projectionMaxMs = 0;
  projectionOver50Ms = 0;
  splitCount = 0;
  mergeCount = 0;
  regionBeginCount = 0;
  regionEndCount = 0;
  queryCandidateCount = 0;
  bindingCommitCount = 0;
  noChangeCommitCount = 0;
  maxMarkerArrayLength = 0;
  iconPathReuseCount = 0;
  iconPathReplacementCount = 0;
  setDataCallbackDurationsMs: number[] = [];
  markerTapCount = 0;
  staleProjectionCount = 0;
  exportFailureCount = 0;
  maxPngPending = 0;
  readonly renderedPaths = new Set<string>();
  readonly renderKeys = new Set<string>();
  currentIndividual = 0;
  currentCluster = 0;
  committedIndividual = 0;
  committedCluster = 0;
  currentPickerGroups = 0;
  currentZoom = 18;
  currentViewport: unknown = null;
  private previousIndividual = 0;
  private previousCluster = 0;
  constructor(
    readonly fixture: MarkerStressCase,
    readonly runKind: "COLD_LIKE" | "WARM",
  ) {
    this.phases.push({ phase: this.phase, startedAt: this.startedAt });
  }
  event(type: string, data?: Record<string, unknown>): void {
    if (this.events.length >= 1500) return;
    this.events.push({
      atMs: Date.now() - this.startedAt,
      phase: this.phase,
      type,
      ...(data ? { data } : {}),
    });
  }
  nextPhase(phase: MarkerStressPhase): void {
    const now = Date.now();
    const current = this.phases[this.phases.length - 1];
    if (current) current.endedAt = now;
    this.phase = phase;
    this.phases.push({ phase, startedAt: now });
    this.event("PHASE_START");
  }
  projection(
    views: readonly NativeMapMarkerView[],
    scale: number,
    durationMs: number,
  ): void {
    this.projectionCount += 1;
    this.projectionTotalMs += durationMs;
    this.projectionMaxMs = Math.max(this.projectionMaxMs, durationMs);
    if (durationMs > 50) this.projectionOver50Ms += 1;
    this.currentIndividual = views.filter(
      (view) => view.kind === "LEAD",
    ).length;
    this.currentCluster = views.length - this.currentIndividual;
    if (
      this.currentIndividual > this.previousIndividual &&
      this.currentCluster < this.previousCluster
    )
      this.splitCount += 1;
    if (
      this.currentIndividual < this.previousIndividual &&
      this.currentCluster > this.previousCluster
    )
      this.mergeCount += 1;
    this.previousIndividual = this.currentIndividual;
    this.previousCluster = this.currentCluster;
    this.currentZoom = scale;
    this.event("PROJECTION", {
      individual: this.currentIndividual,
      cluster: this.currentCluster,
      scale,
      durationMs,
    });
  }
  commit(
    previous: readonly NativeMapMarkerBinding[],
    next: readonly NativeMapMarkerBinding[],
    callbackMs: number,
  ): void {
    this.bindingCommitCount += 1;
    this.maxMarkerArrayLength = Math.max(
      this.maxMarkerArrayLength,
      next.length,
    );
    this.setDataCallbackDurationsMs.push(callbackMs);
    const previousById = new Map(
      previous.map((item) => [item.id, item.iconPath]),
    );
    for (const item of next) {
      const path = previousById.get(item.id);
      if (path === item.iconPath) this.iconPathReuseCount += 1;
      else if (path) this.iconPathReplacementCount += 1;
      if (!item.iconPath.startsWith("/assets/"))
        this.renderedPaths.add(item.iconPath);
    }
    this.event("BINDING_COMMIT", {
      markerArrayLength: next.length,
      callbackMs,
    });
  }
  stable(): void {
    if (this.firstStableAt !== null) return;
    this.firstStableAt = Date.now();
    this.event("FIRST_STABLE", {
      durationMs: this.firstStableAt - this.startedAt,
    });
  }
  committedViews(views: readonly NativeMapMarkerView[]): void {
    this.committedIndividual = views.filter(
      (view) => view.kind === "LEAD",
    ).length;
    this.committedCluster = views.length - this.committedIndividual;
  }
  result(input: {
    readonly queryCount: number;
    readonly detailCount: number;
    readonly png: Record<string, unknown>;
    readonly device: Record<string, unknown>;
    readonly insideViewportCount: number | null;
    readonly manualNotes: string;
    readonly endedAt?: number;
  }) {
    const endedAt = input.endedAt ?? Date.now();
    const current = this.phases[this.phases.length - 1];
    if (current && !current.endedAt) current.endedAt = endedAt;
    return {
      classification: "TRUE_DEVICE_PREVIEW_BENCHMARK_NOT_PRODUCT_DATA",
      benchmarkBuild: MARKER_STRESS_BENCHMARK_BUILD,
      fixture: this.fixture,
      runKind: this.runKind,
      startedAt: new Date(this.startedAt).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      device: input.device,
      requestedLeadCount: this.fixture.count,
      insideViewportCount: input.insideViewportCount,
      actualIndividualMarkerCount: this.committedIndividual,
      actualClusterCount: this.committedCluster,
      pickerGroupCount: this.currentPickerGroups,
      currentZoom: this.currentZoom,
      currentViewport: this.currentViewport,
      firstStableSetDataCallbackProxyMs:
        this.firstStableAt === null
          ? null
          : this.firstStableAt - this.startedAt,
      projection: {
        count: this.projectionCount,
        totalMs: this.projectionTotalMs,
        maxMs: this.projectionMaxMs,
        splitCount: this.splitCount,
        mergeCount: this.mergeCount,
      },
      jsLongTaskProxy: {
        projectionCallsOver50Ms: this.projectionOver50Ms,
        definition:
          "Synchronous projection call duration only; not browser or native long-task attribution.",
      },
      regionChange: { begin: this.regionBeginCount, end: this.regionEndCount },
      queryCandidateCount: this.queryCandidateCount,
      binding: {
        commitCount: this.bindingCommitCount,
        noChangeCommitCount: 0,
        noChangeCommitSkippedCount: this.noChangeCommitCount,
        maxMarkerArrayLength: this.maxMarkerArrayLength,
        iconPathReuseCount: this.iconPathReuseCount,
        iconPathReplacementCount: this.iconPathReplacementCount,
        callbackDurationsMs: this.setDataCallbackDurationsMs,
      },
      png: {
        ...input.png,
        uniqueRenderKeyCandidates: this.renderKeys.size,
        observedUniqueTempPaths: this.renderedPaths.size,
        note: "Path count is not disk file count or bytes.",
      },
      requests: {
        queryCount: input.queryCount,
        detailCount: input.detailCount,
      },
      markerTapCount: this.markerTapCount,
      staleProjectionCount: this.staleProjectionCount,
      exportFailureCount: this.exportFailureCount,
      memory: "NOT_MEASURABLE_ON_CURRENT_TOOLING",
      nativeGpuMemory: "NOT_MEASURABLE_ON_CURRENT_TOOLING",
      fps: "MANUAL_DEVTOOLS_OR_VISUAL_OBSERVATION_REQUIRED",
      nativePaintDuration: "NOT_MEASURABLE_ON_CURRENT_TOOLING",
      manualNotes: input.manualNotes,
      phases: this.phases.map((phase) => ({
        ...phase,
        durationMs: (phase.endedAt ?? endedAt) - phase.startedAt,
      })),
      events: this.events,
    };
  }
}
