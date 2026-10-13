import {
  clonePublicMarker,
  containsForbiddenPrivateMapField,
  PUBLIC_MAP_SCHEMA_VERSION,
  PUBLIC_MAP_NETWORK_SCHEMA_VERSION,
  type PublicMapSchemaVersion,
  PUBLIC_OPPORTUNITY_STATUSES,
  type PublicDetail,
  type PublicDetailRequest,
  type PublicDetailResult,
  type PublicMapError,
  type PublicMapErrorCode,
  type PublicMapService,
  type PublicMarker,
  type PublicViewportRequest,
  type PublicViewportResult,
} from "./public-map-contract.js";
import {
  adaptPublicMapDetailWire,
  type PublicMapWireDetailResult,
} from "./public-map-wire-adapter.js";

export type CandidateEnvVersion = "develop" | "trial" | "release" | "unknown";

export interface CandidateCloudApi {
  callFunction(input: {
    readonly name: string;
    readonly data: Record<string, unknown>;
  }): Promise<{ readonly result?: unknown }>;
}

const ERROR_CODES = new Set<PublicMapErrorCode>([
  "INVALID_REQUEST",
  "INVALID_VIEWPORT",
  "UNAUTHORIZED",
  "RATE_LIMITED",
  "CURSOR_INVALID",
  "CURSOR_EXPIRED",
  "LEAD_UNAVAILABLE",
  "SCHEMA_UNSUPPORTED",
  "SERVICE_UNAVAILABLE",
]);

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const string = (value: unknown): value is string => typeof value === "string";
const number = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const nonNegativeOrNull = (value: unknown): boolean =>
  value === null || (Number.isSafeInteger(value) && Number(value) >= 0);

const error = (
  request: { readonly requestId: string; readonly generation: number },
  code: PublicMapErrorCode = "SERVICE_UNAVAILABLE",
): PublicMapError => ({
  ok: false,
  code,
  requestId: request.requestId,
  generation: request.generation,
  retryable: code !== "SCHEMA_UNSUPPORTED" && code !== "LEAD_UNAVAILABLE",
  retryAfterSeconds: null,
});

export const getWxCandidateEnvVersion = (): CandidateEnvVersion => {
  try {
    const version = (
      wx as unknown as {
        getAccountInfoSync?: () => {
          readonly miniProgram?: { readonly envVersion?: unknown };
        };
      }
    ).getAccountInfoSync?.().miniProgram?.envVersion;
    return version === "develop" || version === "trial" || version === "release"
      ? version
      : "unknown";
  } catch {
    return "unknown";
  }
};

const publicOpportunity = (value: unknown): boolean => {
  if (!record(value) || "level" in value || !Array.isArray(value.reasonCodes))
    return false;
  const codes = value.reasonCodes;
  return (
    codes.every(
      (code) =>
        typeof code === "string" &&
        (PUBLIC_OPPORTUNITY_STATUSES as readonly string[]).includes(code),
    ) &&
    new Set(codes).size === codes.length &&
    value.primaryStatus ===
      (PUBLIC_OPPORTUNITY_STATUSES.find((code) => codes.includes(code)) ??
        null) &&
    string(value.policyVersion) &&
    value.policyVersion.trim().length > 0 &&
    string(value.evaluatedAt) &&
    Number.isFinite(Date.parse(value.evaluatedAt))
  );
};

const commonLeadValid = (value: unknown): value is Record<string, unknown> => {
  if (!record(value) || !string(value.publicLeadId)) return false;
  const location = value.publicLocation;
  const freshness = value.freshness;
  const opportunity = value.opportunity;
  return (
    /^[a-f0-9]{32}$/u.test(value.publicLeadId) &&
    Number.isSafeInteger(value.servedVersion) &&
    string(value.projectionVersion) &&
    string(value.policyVersion) &&
    string(value.asOf) &&
    record(location) &&
    number(location.latitude) &&
    number(location.longitude) &&
    location.coordinateSystem === "GCJ02" &&
    ["EXACT", "APPROXIMATE", "AREA"].includes(String(location.precisionMode)) &&
    (location.areaLabel === null || string(location.areaLabel)) &&
    (value.recordType === null ||
      value.recordType === "DRAW_RECORD" ||
      value.recordType === "UPLOAD_RECORD") &&
    publicOpportunity(opportunity) &&
    record(freshness) &&
    string(freshness.observedAt) &&
    string(freshness.freshnessAsOf) &&
    string(freshness.policyVersion) &&
    ["RECENT", "AGING", "LOW", "UNKNOWN"].includes(String(freshness.band)) &&
    (value.sourceLabel === null ||
      value.sourceLabel === "网络来源" ||
      (value.sourceLabel === "网络上传" &&
        value.recordType === null &&
        value.sourceIcon === "OFFICIAL_NETWORK" &&
        value.networkPolicyVersion === "network-visibility-30d-v1" &&
        string(value.publicUntil) &&
        Date.parse(value.publicUntil) ===
          Date.parse(String(freshness.observedAt)) + 30 * 86400_000))
  );
};

const markerValid = (value: unknown): value is PublicMarker =>
  commonLeadValid(value) &&
  string(value.boardShortLabel) &&
  nonNegativeOrNull(value.totalRemaining) &&
  (value.overlapHint === null ||
    (record(value.overlapHint) &&
      Number.isSafeInteger(value.overlapHint.displayCount)));

const detailValid = (value: unknown): boolean => {
  if (!commonLeadValid(value)) return false;
  if (!record(value.board) || !Array.isArray(value.board.tiers)) return false;
  const board = value.board;
  if (
    !string(board.ipName) ||
    !(board.themeName === null || string(board.themeName)) ||
    !nonNegativeOrNull(board.totalRemaining) ||
    !nonNegativeOrNull(board.grandPrizeRemaining) ||
    !nonNegativeOrNull(board.pricePerDrawMinor) ||
    !nonNegativeOrNull(board.fullPackCostMinor) ||
    !(board.tiers as unknown[]).every(
      (tier: unknown) =>
        record(tier) &&
        string(tier.tierCode) &&
        (tier.displayLabel === null || string(tier.displayLabel)) &&
        nonNegativeOrNull(tier.remainingTickets) &&
        typeof tier.isGrandPrize === "boolean",
    )
  )
    return false;
  const opportunity = value.opportunity;
  const contributor = value.contributor;
  const contributors = value.contributors;
  return (
    (value.sourceLabel !== "网络上传" ||
      (contributor === null &&
        Array.isArray(contributors) &&
        contributors.length === 0)) &&
    record(opportunity) &&
    Array.isArray(opportunity.reasonCodes) &&
    opportunity.reasonCodes.every(string) &&
    string(opportunity.policyVersion) &&
    string(opportunity.evaluatedAt) &&
    (value.venueNote === null || string(value.venueNote)) &&
    (contributor === null ||
      (record(contributor) &&
        string(contributor.displayName) &&
        record(contributor.avatar) &&
        (contributor.avatar.kind === "PUBLIC_URL" ||
          contributor.avatar.kind === "FALLBACK_ASSET"))) &&
    (contributors === undefined ||
      (Array.isArray(contributors) &&
        contributors.length <= 50 &&
        contributors.every(
          (item: unknown) =>
            record(item) &&
            string(item.displayName) &&
            record(item.avatar) &&
            (item.avatar.kind === "PUBLIC_URL" ||
              item.avatar.kind === "FALLBACK_ASSET"),
        ))) &&
    record(value.disclosures) &&
    value.disclosures.nonRealtime === true &&
    value.disclosures.nonRecommendation === true
  );
};

export class CandidatePublicMapService implements PublicMapService {
  constructor(
    private readonly api: CandidateCloudApi | null,
    private readonly envVersion: CandidateEnvVersion,
    private readonly target: "candidate" | "production" = "candidate",
  ) {}

  private async call(
    name: string,
    data: Record<string, unknown>,
  ): Promise<unknown> {
    if (
      (this.target === "candidate"
        ? this.envVersion !== "develop" && this.envVersion !== "trial"
        : !["develop", "trial", "release"].includes(this.envVersion)) ||
      !this.api
    )
      return null;
    try {
      return (await this.api.callFunction({ name, data })).result ?? null;
    } catch {
      return null;
    }
  }

  async query(request: PublicViewportRequest): Promise<PublicViewportResult> {
    const response = await this.call(
      this.target === "production"
        ? "query-public-map-leads"
        : "v2-shadow-query-public-map-leads",
      {
        ...request,
      },
    );
    if (!record(response)) return error(request);
    if (response.ok === false) {
      const code = ERROR_CODES.has(response.code as PublicMapErrorCode)
        ? (response.code as PublicMapErrorCode)
        : "SERVICE_UNAVAILABLE";
      return error(request, code);
    }
    if (
      ![PUBLIC_MAP_SCHEMA_VERSION, PUBLIC_MAP_NETWORK_SCHEMA_VERSION].includes(
        response.schemaVersion as PublicMapSchemaVersion,
      ) ||
      !request.supportedSchemaVersions.includes(String(response.schemaVersion))
    )
      return error(request, "SCHEMA_UNSUPPORTED");
    if (
      response.ok !== true ||
      response.requestId !== request.requestId ||
      response.generation !== request.generation ||
      !string(response.asOf) ||
      !Array.isArray(response.items) ||
      !response.items.every(markerValid) ||
      containsForbiddenPrivateMapField(response) ||
      !(response.nextCursor === null || string(response.nextCursor)) ||
      typeof response.truncated !== "boolean" ||
      !record(response.density) ||
      !record(response.queryEcho) ||
      !string(response.queryEcho.boundsDigest) ||
      !string(response.queryEcho.zoomBand) ||
      !string(response.queryEcho.filtersDigest) ||
      !Number.isSafeInteger(response.density.returnedCount) ||
      !Number.isSafeInteger(response.density.serverCap) ||
      !Number.isSafeInteger(response.density.removedSinceSnapshot) ||
      typeof response.density.overlapPresent !== "boolean" ||
      response.density.aggregationAvailable !== false
    )
      return error(request);
    if (
      response.schemaVersion === PUBLIC_MAP_SCHEMA_VERSION &&
      (response.items as PublicMarker[]).some(
        (item) => item.sourceLabel === "网络上传",
      )
    )
      return error(request);
    const preparedDetails: PublicDetail[] = [];
    if (response.preparedDetails !== undefined) {
      if (
        !Array.isArray(response.preparedDetails) ||
        response.preparedDetails.length > 2
      )
        return error(request);
      const ids = new Set<string>();
      for (const item of response.preparedDetails) {
        if (!detailValid(item)) return error(request);
        const raw = item as Record<string, unknown>;
        const marker = (response.items as PublicMarker[]).find(
          (m) => m.publicLeadId === raw.publicLeadId,
        );
        if (
          !marker ||
          ids.has(marker.publicLeadId) ||
          Number(raw.servedVersion) < marker.servedVersion ||
          raw.policyVersion !== marker.policyVersion ||
          raw.projectionVersion !== marker.projectionVersion
        )
          return error(request);
        const adapted = adaptPublicMapDetailWire({
          ok: true,
          schemaVersion: response.schemaVersion as PublicMapSchemaVersion,
          requestId: request.requestId,
          generation: request.generation,
          item,
        } as PublicMapWireDetailResult);
        if (!adapted.ok) return error(request);
        ids.add(marker.publicLeadId);
        preparedDetails.push(adapted.item);
      }
    }
    return {
      ok: true,
      schemaVersion: response.schemaVersion as PublicMapSchemaVersion,
      requestId: request.requestId,
      generation: request.generation,
      asOf: response.asOf,
      preparedDetails,
      queryEcho: {
        boundsDigest: response.queryEcho.boundsDigest,
        zoomBand: response.queryEcho.zoomBand,
        filtersDigest: response.queryEcho.filtersDigest,
      },
      items: (response.items as PublicMarker[]).map(clonePublicMarker),
      nextCursor: response.nextCursor,
      truncated: response.truncated,
      density: {
        returnedCount: response.density.returnedCount as number,
        serverCap: response.density.serverCap as number,
        overlapPresent: response.density.overlapPresent as boolean,
        aggregationAvailable: false,
        removedSinceSnapshot: response.density.removedSinceSnapshot as number,
      },
    };
  }

  async detail(request: PublicDetailRequest): Promise<PublicDetailResult> {
    const response = await this.call(
      this.target === "production"
        ? "get-public-map-lead-detail"
        : "v2-shadow-get-public-map-lead-detail",
      {
        ...request,
      },
    );
    if (!record(response)) return error(request);
    if (response.ok === false) {
      const code = ERROR_CODES.has(response.code as PublicMapErrorCode)
        ? (response.code as PublicMapErrorCode)
        : "SERVICE_UNAVAILABLE";
      return error(request, code);
    }
    if (
      ![PUBLIC_MAP_SCHEMA_VERSION, PUBLIC_MAP_NETWORK_SCHEMA_VERSION].includes(
        response.schemaVersion as PublicMapSchemaVersion,
      ) ||
      !request.supportedSchemaVersions.includes(String(response.schemaVersion))
    )
      return error(request, "SCHEMA_UNSUPPORTED");
    if (
      response.ok !== true ||
      response.requestId !== request.requestId ||
      response.generation !== request.generation ||
      !detailValid(response.item) ||
      containsForbiddenPrivateMapField(response)
    )
      return error(request);
    if (
      response.schemaVersion === PUBLIC_MAP_SCHEMA_VERSION &&
      (response.item as Record<string, unknown>).sourceLabel === "网络上传"
    )
      return error(request);
    return adaptPublicMapDetailWire(
      response as unknown as PublicMapWireDetailResult,
    );
  }
}

export const createWxCandidatePublicMapService =
  (): CandidatePublicMapService => {
    const version = getWxCandidateEnvVersion();
    const api = (wx as unknown as { cloud?: CandidateCloudApi }).cloud;
    return new CandidatePublicMapService(
      api?.callFunction ? api : null,
      version,
    );
  };
