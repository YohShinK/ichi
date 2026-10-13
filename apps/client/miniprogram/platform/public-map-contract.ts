export const PUBLIC_MAP_SCHEMA_VERSION = "public-map-v3" as const;
export const PUBLIC_MAP_NETWORK_SCHEMA_VERSION = "public-map-v4" as const;
export type PublicMapSchemaVersion =
  typeof PUBLIC_MAP_SCHEMA_VERSION | typeof PUBLIC_MAP_NETWORK_SCHEMA_VERSION;
export const publicLeadWithinDeadline = (
  value: { readonly publicUntil?: string | undefined },
  nowMs: number,
): boolean =>
  value.publicUntil === undefined ||
  (Number.isFinite(Date.parse(value.publicUntil)) &&
    Date.parse(value.publicUntil) > nowMs);

export type PublicMapMode = "MAP" | "LIST";
export const PUBLIC_OPPORTUNITY_STATUSES = [
  "LAST_CHANCE",
  "GRAND_PRIZE_RATIO",
  "GRAND_PRIZE_REMAINS",
  "SPLIT_SET",
  "LOW_OPPORTUNITY",
] as const;
export type PublicOpportunityStatus =
  (typeof PUBLIC_OPPORTUNITY_STATUSES)[number];
export interface PublicOpportunity {
  readonly primaryStatus: string | null;
  readonly reasonCodes: readonly string[];
  readonly policyVersion: string;
  readonly evaluatedAt: string;
}

export interface PublicBoundingBox {
  readonly west: number;
  readonly south: number;
  readonly east: number;
  readonly north: number;
}

export interface PublicMapQuery {
  readonly bbox: PublicBoundingBox;
  readonly zoom: number;
  readonly mode: PublicMapMode;
  readonly opportunityStatuses: readonly PublicOpportunityStatus[];
  readonly includeLowFreshness: boolean;
  readonly supportedSchemaVersions: readonly string[];
}

export interface PublicViewportRequest extends PublicMapQuery {
  readonly limit: number;
  readonly cursor: string | null;
  readonly asOf: string | null;
  readonly requestId: string;
  readonly generation: number;
}

export interface PublicDetailRequest {
  readonly publicLeadId: string;
  readonly requestId: string;
  readonly generation: number;
  readonly supportedSchemaVersions: readonly string[];
}

export type PublicMapErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_VIEWPORT"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "CURSOR_INVALID"
  | "CURSOR_EXPIRED"
  | "LEAD_UNAVAILABLE"
  | "SCHEMA_UNSUPPORTED"
  | "SERVICE_UNAVAILABLE";

export interface PublicMapError {
  readonly ok: false;
  readonly code: PublicMapErrorCode;
  readonly requestId: string;
  readonly generation: number;
  readonly retryable: boolean;
  readonly retryAfterSeconds: number | null;
}

export interface PublicLocation {
  readonly latitude: number;
  readonly longitude: number;
  readonly coordinateSystem: "GCJ02";
  readonly precisionMode: "EXACT" | "APPROXIMATE" | "AREA";
  readonly areaLabel: string | null;
}

export interface PublicFreshness {
  readonly observedAt: string;
  readonly band: "RECENT" | "AGING" | "LOW" | "UNKNOWN";
  readonly freshnessAsOf: string;
  readonly policyVersion: string;
}

export interface PublicMarker {
  readonly publicLeadId: string;
  readonly servedVersion: number;
  readonly projectionVersion: string;
  readonly policyVersion: string;
  readonly asOf: string;
  readonly publicLocation: PublicLocation;
  readonly boardShortLabel: string;
  readonly totalRemaining: number | null;
  readonly recordType: "DRAW_RECORD" | "UPLOAD_RECORD" | null;
  readonly opportunity: PublicOpportunity;
  readonly freshness: PublicFreshness;
  readonly sourceLabel: "网络来源" | "网络上传" | null;
  readonly publicUntil?: string | undefined;
  readonly networkPolicyVersion?: string | undefined;
  readonly sourceIcon?: "OFFICIAL_NETWORK" | undefined;
  readonly overlapHint: { readonly displayCount: number } | null;
}

export interface PublicContributor {
  readonly displayName: string;
  readonly avatarUrl: string;
}

export interface PublicDetail {
  /** Trusted first upload timestamp; absent on older public projections. */
  readonly uploadedAt?: string | undefined;
  readonly publicLeadId: string;
  readonly servedVersion: number;
  readonly projectionVersion: string;
  readonly policyVersion: string;
  readonly asOf: string;
  readonly publicLocation: PublicLocation;
  readonly board: {
    readonly ipName: string;
    readonly themeName: string | null;
    readonly tiers: readonly {
      readonly tierCode: string;
      readonly displayLabel: string | null;
      readonly remainingTickets: number | null;
      readonly isGrandPrize: boolean;
    }[];
    readonly grandPrizeRemaining: number | null;
    readonly totalRemaining: number | null;
    readonly pricePerDrawMinor: number | null;
    readonly fullPackCostMinor: number | null;
  };
  readonly recordType: "DRAW_RECORD" | "UPLOAD_RECORD" | null;
  readonly contributor: PublicContributor | null;
  readonly contributors?: readonly PublicContributor[] | undefined;
  readonly opportunity: {
    readonly primaryStatus: string | null;
    readonly reasonCodes: readonly string[];
    readonly policyVersion: string;
    readonly evaluatedAt: string;
  };
  readonly freshness: PublicFreshness;
  readonly venueNote: string | null;
  readonly sourceLabel: "网络来源" | "网络上传" | null;
  readonly publicUntil?: string | undefined;
  readonly networkPolicyVersion?: string | undefined;
  readonly sourceIcon?: "OFFICIAL_NETWORK" | undefined;
  readonly disclosures: {
    readonly nonRealtime: true;
    readonly nonRecommendation: true;
  };
}

export interface PublicViewportResponse {
  readonly ok: true;
  readonly schemaVersion: PublicMapSchemaVersion;
  readonly requestId: string;
  readonly generation: number;
  readonly asOf: string;
  readonly queryEcho: {
    readonly boundsDigest: string;
    readonly zoomBand: string;
    readonly filtersDigest: string;
  };
  readonly items: readonly PublicMarker[];
  /** Optional first-page public details from the same checked query, at most two. */
  readonly preparedDetails?: readonly PublicDetail[] | undefined;
  readonly nextCursor: string | null;
  readonly truncated: boolean;
  readonly density: {
    readonly returnedCount: number;
    readonly serverCap: number;
    readonly overlapPresent: boolean;
    readonly aggregationAvailable: false;
    readonly removedSinceSnapshot: number;
  };
}

export interface PublicDetailResponse {
  readonly ok: true;
  readonly schemaVersion: PublicMapSchemaVersion;
  readonly requestId: string;
  readonly generation: number;
  readonly item: PublicDetail;
}

export type PublicViewportResult = PublicViewportResponse | PublicMapError;
export type PublicDetailResult = PublicDetailResponse | PublicMapError;

export interface PublicMapService {
  query(request: PublicViewportRequest): Promise<PublicViewportResult>;
  detail(request: PublicDetailRequest): Promise<PublicDetailResult>;
}

const cloneLocation = (location: PublicLocation): PublicLocation => ({
  latitude: location.latitude,
  longitude: location.longitude,
  coordinateSystem: location.coordinateSystem,
  precisionMode: location.precisionMode,
  areaLabel: location.areaLabel,
});

const cloneFreshness = (freshness: PublicFreshness): PublicFreshness => ({
  observedAt: freshness.observedAt,
  band: freshness.band,
  freshnessAsOf: freshness.freshnessAsOf,
  policyVersion: freshness.policyVersion,
});

export const clonePublicMarker = (marker: PublicMarker): PublicMarker => ({
  publicLeadId: marker.publicLeadId,
  servedVersion: marker.servedVersion,
  projectionVersion: marker.projectionVersion,
  policyVersion: marker.policyVersion,
  asOf: marker.asOf,
  publicLocation: cloneLocation(marker.publicLocation),
  boardShortLabel: marker.boardShortLabel,
  totalRemaining: marker.totalRemaining,
  recordType: marker.recordType,
  opportunity: {
    primaryStatus: marker.opportunity.primaryStatus,
    reasonCodes: [...marker.opportunity.reasonCodes],
    policyVersion: marker.opportunity.policyVersion,
    evaluatedAt: marker.opportunity.evaluatedAt,
  },
  freshness: cloneFreshness(marker.freshness),
  sourceLabel: marker.sourceLabel,
  ...(marker.publicUntil !== undefined
    ? {
        publicUntil: marker.publicUntil,
        networkPolicyVersion: marker.networkPolicyVersion,
        sourceIcon: marker.sourceIcon,
      }
    : {}),
  overlapHint: marker.overlapHint
    ? { displayCount: marker.overlapHint.displayCount }
    : null,
});

export const clonePublicDetail = (detail: PublicDetail): PublicDetail => ({
  ...(typeof detail.uploadedAt === "string" &&
  Number.isFinite(Date.parse(detail.uploadedAt))
    ? { uploadedAt: detail.uploadedAt }
    : {}),
  publicLeadId: detail.publicLeadId,
  servedVersion: detail.servedVersion,
  projectionVersion: detail.projectionVersion,
  policyVersion: detail.policyVersion,
  asOf: detail.asOf,
  publicLocation: cloneLocation(detail.publicLocation),
  board: {
    ipName: detail.board.ipName,
    themeName: detail.board.themeName,
    tiers: detail.board.tiers.map((tier) => ({
      tierCode: tier.tierCode,
      displayLabel: tier.displayLabel,
      remainingTickets: tier.remainingTickets,
      isGrandPrize: tier.isGrandPrize,
    })),
    grandPrizeRemaining: detail.board.grandPrizeRemaining,
    totalRemaining: detail.board.totalRemaining,
    pricePerDrawMinor: detail.board.pricePerDrawMinor,
    fullPackCostMinor: detail.board.fullPackCostMinor,
  },
  recordType: detail.recordType,
  contributor: detail.contributor
    ? {
        displayName: detail.contributor.displayName,
        avatarUrl: detail.contributor.avatarUrl,
      }
    : null,
  contributors: detail.contributors?.map((item) => ({ ...item })),
  opportunity: {
    primaryStatus: detail.opportunity.primaryStatus,
    reasonCodes: [...detail.opportunity.reasonCodes],
    policyVersion: detail.opportunity.policyVersion,
    evaluatedAt: detail.opportunity.evaluatedAt,
  },
  freshness: cloneFreshness(detail.freshness),
  venueNote: detail.venueNote,
  sourceLabel: detail.sourceLabel,
  ...(detail.publicUntil !== undefined
    ? {
        publicUntil: detail.publicUntil,
        networkPolicyVersion: detail.networkPolicyVersion,
        sourceIcon: detail.sourceIcon,
      }
    : {}),
  disclosures: {
    nonRealtime: true,
    nonRecommendation: true,
  },
});

const FORBIDDEN_PRIVATE_KEYS = new Set([
  "openid",
  "_openid",
  "openId",
  "OPENID",
  "accountId",
  "ownerAccountId",
  "privateLineageId",
  "boardInstanceId",
  "avatarFileId",
  "verification",
  "verificationInput",
  "rights",
  "moderationEvidence",
  "observationLocation",
  "rawLocation",
  "accuracyMeters",
  "cursorSecret",
  "sourceUrl",
  "rightsEvidence",
  "evidenceRef",
  "curatorAuthorityId",
  "reviewVersion",
  "takedownOwnerId",
  "contentDigest",
  "rightsDecisionVersion",
  "sourcePublishedAt",
  "fetchedAt",
  "observedAtBasis",
  "observationEvidence",
  "reviewedBy",
  "reviewedAt",
  "highPrizeTiersConfirmed",
]);

export const containsForbiddenPrivateMapField = (value: unknown): boolean => {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value))
    return value.some((item) => containsForbiddenPrivateMapField(item));
  return Object.entries(value).some(
    ([key, child]) =>
      FORBIDDEN_PRIVATE_KEYS.has(key) ||
      containsForbiddenPrivateMapField(child),
  );
};
