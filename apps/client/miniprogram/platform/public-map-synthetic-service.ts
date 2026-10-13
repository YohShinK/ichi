import {
  PUBLIC_MAP_SCHEMA_VERSION,
  type PublicDetail,
  type PublicDetailRequest,
  type PublicDetailResult,
  type PublicMapErrorCode,
  type PublicMapService,
  type PublicMarker,
  type PublicViewportRequest,
  type PublicViewportResult,
} from "./public-map-contract.js";

export const SYNTHETIC_PUBLIC_MAP_DATA_CLASSIFICATION =
  "NOT_PRODUCTION_EVIDENCE" as const;

export type SyntheticViewportScenario =
  | { readonly kind: "SUCCESS"; readonly delayMs?: number }
  | { readonly kind: "EMPTY"; readonly delayMs?: number }
  | {
      readonly kind: "ERROR";
      readonly code: Exclude<PublicMapErrorCode, "LEAD_UNAVAILABLE">;
      readonly delayMs?: number;
    };

export type SyntheticDetailScenario =
  | { readonly kind: "SUCCESS"; readonly delayMs?: number }
  | {
      readonly kind: "ERROR";
      readonly code: PublicMapErrorCode;
      readonly delayMs?: number;
    };

const wait = async (delayMs = 0): Promise<void> => {
  if (delayMs <= 0) return;
  await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
};

const errorResult = (
  request: { readonly requestId: string; readonly generation: number },
  code: PublicMapErrorCode,
): PublicViewportResult & PublicDetailResult => ({
  ok: false,
  code,
  requestId: request.requestId,
  generation: request.generation,
  retryable:
    code === "RATE_LIMITED" ||
    code === "SERVICE_UNAVAILABLE" ||
    code === "UNAUTHORIZED",
  retryAfterSeconds: code === "RATE_LIMITED" ? 30 : null,
});

const observedAt = "2026-09-13T02:00:00.000Z";
const asOf = "2026-09-13T03:00:00.000Z";

const syntheticMarker = (input: {
  readonly id: number;
  readonly label: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly recordType: PublicMarker["recordType"];
  readonly opportunity: string | null;
  readonly freshness: PublicMarker["freshness"]["band"];
  readonly observedAt: string;
  readonly overlapCount?: number;
  readonly totalRemaining?: number;
}): PublicMarker => ({
  publicLeadId: `lead-synthetic-${String(input.id).padStart(3, "0")}`,
  servedVersion: 1,
  projectionVersion: "projection-v1",
  policyVersion: "policy-v1",
  asOf,
  publicLocation: {
    latitude: input.latitude,
    longitude: input.longitude,
    coordinateSystem: "GCJ02",
    precisionMode: "APPROXIMATE",
    areaLabel: null,
  },
  boardShortLabel: input.label,
  totalRemaining: input.totalRemaining ?? 12,
  recordType: input.recordType,
  opportunity: {
    primaryStatus: input.opportunity,
    reasonCodes: input.opportunity ? [input.opportunity] : [],
    policyVersion: "opportunity-20260930-v1",
    evaluatedAt: asOf,
  },
  freshness: {
    observedAt: input.observedAt,
    band: input.freshness,
    freshnessAsOf: asOf,
    policyVersion: "freshness-v1",
  },
  sourceLabel: null,
  overlapHint: input.overlapCount ? { displayCount: input.overlapCount } : null,
});

export const SYNTHETIC_PUBLIC_MARKERS: readonly PublicMarker[] = [
  syntheticMarker({
    id: 1,
    label: "进击的巨人 最终季",
    latitude: 31.2304,
    longitude: 121.4737,
    recordType: "DRAW_RECORD",
    opportunity: "GRAND_PRIZE_REMAINS",
    freshness: "RECENT",
    observedAt,
  }),
  syntheticMarker({
    id: 2,
    label: "葬送的芙莉莲",
    latitude: 31.2201,
    longitude: 121.492,
    recordType: "UPLOAD_RECORD",
    opportunity: "GRAND_PRIZE_RATIO",
    freshness: "AGING",
    observedAt: "2026-09-12T11:00:00.000Z",
    overlapCount: 2,
  }),
  syntheticMarker({
    id: 3,
    label: "胜利女神 NIKKE",
    latitude: 31.245,
    longitude: 121.445,
    recordType: "DRAW_RECORD",
    opportunity: "LOW_OPPORTUNITY",
    freshness: "LOW",
    observedAt: "2026-09-10T10:00:00.000Z",
  }),
  syntheticMarker({
    id: 4,
    label: "崩坏：星穹铁道",
    latitude: 31.2201,
    longitude: 121.492,
    recordType: "UPLOAD_RECORD",
    opportunity: "GRAND_PRIZE_REMAINS",
    freshness: "RECENT",
    observedAt: "2026-09-13T01:20:00.000Z",
    overlapCount: 2,
  }),
  syntheticMarker({
    id: 5,
    label: "世界之外",
    latitude: 31.252,
    longitude: 121.512,
    recordType: "DRAW_RECORD",
    opportunity: "GRAND_PRIZE_RATIO",
    freshness: "RECENT",
    observedAt: "2026-09-13T00:40:00.000Z",
  }),
  syntheticMarker({
    id: 6,
    label: "明日方舟",
    latitude: 31.208,
    longitude: 121.458,
    recordType: "UPLOAD_RECORD",
    opportunity: "LOW_OPPORTUNITY",
    freshness: "AGING",
    observedAt: "2026-09-12T08:00:00.000Z",
    overlapCount: 2,
  }),
  syntheticMarker({
    id: 7,
    label: "女神异闻录 30周年",
    latitude: 31.208,
    longitude: 121.458,
    recordType: "DRAW_RECORD",
    opportunity: "GRAND_PRIZE_REMAINS",
    freshness: "RECENT",
    observedAt: "2026-09-13T02:20:00.000Z",
    overlapCount: 2,
  }),
  syntheticMarker({
    id: 8,
    label: "咒术回战",
    latitude: 31.263,
    longitude: 121.486,
    recordType: "UPLOAD_RECORD",
    opportunity: "GRAND_PRIZE_RATIO",
    freshness: "LOW",
    observedAt: "2026-09-09T14:00:00.000Z",
  }),
  syntheticMarker({
    id: 9,
    label: "排球少年",
    latitude: 31.235,
    longitude: 121.526,
    recordType: "DRAW_RECORD",
    opportunity: null,
    freshness: "UNKNOWN",
    observedAt: "invalid",
  }),
  syntheticMarker({
    id: 10,
    label: "蓝色监狱",
    latitude: 31.196,
    longitude: 121.505,
    recordType: "UPLOAD_RECORD",
    opportunity: "GRAND_PRIZE_REMAINS",
    freshness: "RECENT",
    observedAt: "2026-09-13T01:50:00.000Z",
  }),
];

const syntheticDetail = (marker: PublicMarker): PublicDetail => ({
  publicLeadId: marker.publicLeadId,
  servedVersion: marker.servedVersion,
  projectionVersion: marker.projectionVersion,
  policyVersion: marker.policyVersion,
  asOf: marker.asOf,
  publicLocation: marker.publicLocation,
  board: {
    ipName: marker.boardShortLabel,
    themeName: null,
    tiers: [
      {
        tierCode: "A",
        displayLabel: "A赏",
        remainingTickets: 1,
        isGrandPrize: true,
      },
      {
        tierCode: "B",
        displayLabel: "B赏",
        remainingTickets: 2,
        isGrandPrize: true,
      },
      {
        tierCode: "C",
        displayLabel: "C赏",
        remainingTickets: 3,
        isGrandPrize: false,
      },
      {
        tierCode: "D",
        displayLabel: "D赏",
        remainingTickets: 0,
        isGrandPrize: false,
      },
      {
        tierCode: "E",
        displayLabel: "E赏",
        remainingTickets: 5,
        isGrandPrize: false,
      },
      {
        tierCode: "F",
        displayLabel: "F赏",
        remainingTickets: null,
        isGrandPrize: false,
      },
    ],
    grandPrizeRemaining: 1,
    totalRemaining: marker.totalRemaining,
    pricePerDrawMinor: 650,
    fullPackCostMinor:
      marker.totalRemaining === null ? null : marker.totalRemaining * 650,
  },
  recordType: marker.recordType,
  contributor: {
    displayName: "ICHI 玩家",
    avatarUrl: "/assets/v1-29/ichi-avatar.png",
  },
  opportunity: {
    primaryStatus: marker.opportunity.primaryStatus,
    reasonCodes: ["SYNTHETIC_FIXTURE"],
    policyVersion: "opportunity-v1",
    evaluatedAt: observedAt,
  },
  freshness: marker.freshness,
  venueNote: "仅用于本地状态验证",
  sourceLabel: marker.sourceLabel,
  disclosures: { nonRealtime: true, nonRecommendation: true },
});

export class SyntheticPublicMapService implements PublicMapService {
  readonly #viewportScenarios: SyntheticViewportScenario[] = [];
  readonly #detailScenarios: SyntheticDetailScenario[] = [];

  enqueueViewport(...scenarios: readonly SyntheticViewportScenario[]): void {
    this.#viewportScenarios.push(...scenarios);
  }

  enqueueDetail(...scenarios: readonly SyntheticDetailScenario[]): void {
    this.#detailScenarios.push(...scenarios);
  }

  async query(request: PublicViewportRequest): Promise<PublicViewportResult> {
    const scenario = this.#viewportScenarios.shift() ?? { kind: "SUCCESS" };
    await wait(scenario.delayMs);
    if (scenario.kind === "ERROR") return errorResult(request, scenario.code);
    if (request.cursor === "synthetic:invalid")
      return errorResult(request, "CURSOR_INVALID");
    if (request.cursor === "synthetic:expired")
      return errorResult(request, "CURSOR_EXPIRED");
    const selectedLevels = new Set<string>(request.opportunityStatuses);
    const visible = SYNTHETIC_PUBLIC_MARKERS.filter(
      (marker) =>
        (selectedLevels.size === 0 ||
          marker.opportunity.reasonCodes.some((status) =>
            selectedLevels.has(status),
          )) &&
        (request.includeLowFreshness || marker.freshness.band !== "LOW"),
    );
    const pageOffset = request.cursor === "synthetic:page:2" ? 2 : 0;
    const items =
      scenario.kind === "EMPTY"
        ? []
        : visible.slice(pageOffset, pageOffset + request.limit);
    const nextCursor =
      scenario.kind !== "EMPTY" &&
      pageOffset === 0 &&
      visible.length > request.limit
        ? "synthetic:page:2"
        : null;
    return {
      ok: true,
      schemaVersion: PUBLIC_MAP_SCHEMA_VERSION,
      requestId: request.requestId,
      generation: request.generation,
      asOf,
      queryEcho: {
        boundsDigest: "synthetic-bounds",
        zoomBand: `z${Math.round(request.zoom)}`,
        filtersDigest: request.opportunityStatuses.join(","),
      },
      items,
      nextCursor,
      truncated: false,
      density: {
        returnedCount: items.length,
        serverCap: 500,
        overlapPresent: items.some((item) => item.overlapHint !== null),
        aggregationAvailable: false,
        removedSinceSnapshot: 0,
      },
    };
  }

  async detail(request: PublicDetailRequest): Promise<PublicDetailResult> {
    const scenario = this.#detailScenarios.shift() ?? { kind: "SUCCESS" };
    await wait(scenario.delayMs);
    if (scenario.kind === "ERROR") return errorResult(request, scenario.code);
    const marker = SYNTHETIC_PUBLIC_MARKERS.find(
      (item) => item.publicLeadId === request.publicLeadId,
    );
    if (!marker) return errorResult(request, "LEAD_UNAVAILABLE");
    return {
      ok: true,
      schemaVersion: PUBLIC_MAP_SCHEMA_VERSION,
      requestId: request.requestId,
      generation: request.generation,
      item: syntheticDetail(marker),
    };
  }
}
