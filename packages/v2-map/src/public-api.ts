import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import {
  evaluateFreshness,
  type FreshnessPolicy,
  type PublicMapLeadCore,
} from "./projector.js";

export const PUBLIC_MAP_SCHEMA_VERSION = "public-map-v3" as const;
export const PUBLIC_MAP_NETWORK_SCHEMA_VERSION = "public-map-v4" as const;
export type PublicMapSchemaVersion =
  typeof PUBLIC_MAP_SCHEMA_VERSION | typeof PUBLIC_MAP_NETWORK_SCHEMA_VERSION;
const visibleAt = (lead: PublicMapLeadCore, nowMs: number): boolean =>
  lead.visibility === "VISIBLE" &&
  (lead.publicUntil === undefined ||
    (Number.isFinite(Date.parse(lead.publicUntil)) &&
      Date.parse(lead.publicUntil) > nowMs));
import { OPPORTUNITY_STATUSES } from "./verification.js";
const PUBLIC_OPPORTUNITY_STATUSES = new Set<string>(OPPORTUNITY_STATUSES);
const MIN_CURSOR_SECRET_LENGTH = 32;

const totalRemainingForTiers = (
  tiers: readonly { readonly remainingTickets: number | null }[],
): number | null => {
  const remaining = tiers.map((tier) => tier.remainingTickets);
  return remaining.every((value) => value !== null)
    ? remaining.reduce<number>((total, value) => total + value!, 0)
    : null;
};

export interface TrustedPublicAccount {
  readonly accountId: string;
}

export interface TrustedPublicAccountPort {
  currentAccount(): TrustedPublicAccount | null;
}

export interface RateLimitStore {
  consume(input: {
    readonly key: string;
    readonly limit: number;
    readonly windowMs: number;
    readonly nowMs: number;
  }): "ALLOWED" | "LIMITED" | "UNAVAILABLE";
}

export interface PublicMapReadControl {
  readState(): "ENABLED" | "DISABLED" | "UNAVAILABLE";
}

export interface CursorSecretSource {
  currentSecret(): string | null;
}

export interface PublicMapTrustedPorts {
  readonly account?: TrustedPublicAccountPort;
  readonly rateLimit?: RateLimitStore;
  readonly readControl?: PublicMapReadControl;
  readonly cursorSecret?: CursorSecretSource;
}

export interface BoundingBox {
  readonly west: number;
  readonly south: number;
  readonly east: number;
  readonly north: number;
}

export interface ViewportRequest {
  readonly bbox: BoundingBox;
  readonly zoom: number;
  readonly mode: "MAP" | "LIST";
  readonly opportunityStatuses: readonly string[];
  readonly includeLowFreshness: boolean;
  readonly limit: number;
  readonly cursor: string | null;
  readonly asOf: string | null;
  readonly requestId: string;
  readonly generation: number;
  readonly supportedSchemaVersions: readonly string[];
}

export interface DetailRequest {
  readonly publicLeadId: string;
  readonly requestId: string;
  readonly generation: number;
  readonly supportedSchemaVersions: readonly string[];
}

export type PublicApiErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_VIEWPORT"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "CURSOR_INVALID"
  | "CURSOR_EXPIRED"
  | "LEAD_UNAVAILABLE"
  | "SCHEMA_UNSUPPORTED"
  | "SERVICE_UNAVAILABLE";

export interface PublicApiError {
  readonly ok: false;
  readonly code: PublicApiErrorCode;
  readonly requestId: string;
  readonly generation: number;
  readonly retryable: boolean;
  readonly retryAfterSeconds: number | null;
}

export interface PublicMarker {
  readonly publicLeadId: string;
  readonly servedVersion: number;
  readonly projectionVersion: string;
  readonly policyVersion: string;
  readonly asOf: string;
  readonly publicLocation: {
    readonly latitude: number;
    readonly longitude: number;
    readonly coordinateSystem: "GCJ02";
    readonly precisionMode: "EXACT" | "APPROXIMATE" | "AREA";
    readonly areaLabel: string | null;
  };
  readonly boardShortLabel: string;
  readonly totalRemaining: number | null;
  readonly recordType: "DRAW_RECORD" | "UPLOAD_RECORD" | null;
  readonly opportunity: {
    readonly primaryStatus: string | null;
    readonly reasonCodes: readonly string[];
    readonly policyVersion: string;
    readonly evaluatedAt: string;
  };
  readonly freshness: {
    readonly observedAt: string;
    readonly band: "RECENT" | "AGING" | "LOW" | "UNKNOWN";
    readonly freshnessAsOf: string;
    readonly policyVersion: string;
  };
  readonly sourceLabel: "网络来源" | "网络上传" | null;
  readonly publicUntil?: string | undefined;
  readonly networkPolicyVersion?: string | undefined;
  readonly sourceIcon?: "OFFICIAL_NETWORK" | undefined;
  readonly overlapHint: { readonly displayCount: number } | null;
}

export interface PublicDetail {
  readonly publicLeadId: string;
  readonly servedVersion: number;
  readonly projectionVersion: string;
  readonly policyVersion: string;
  readonly asOf: string;
  readonly publicLocation: PublicMarker["publicLocation"];
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
  readonly contributor: PublicMapLeadCore["contributor"];
  readonly contributors?: PublicMapLeadCore["contributors"];
  readonly opportunity: {
    readonly primaryStatus: string | null;
    readonly reasonCodes: readonly string[];
    readonly policyVersion: string;
    readonly evaluatedAt: string;
  };
  readonly freshness: PublicMarker["freshness"];
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

export interface ViewportResponse {
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

export interface DetailResponse {
  readonly ok: true;
  readonly schemaVersion: PublicMapSchemaVersion;
  readonly requestId: string;
  readonly generation: number;
  readonly item: PublicDetail;
}

export interface PublicLeadRepository {
  listVisibleWithin(bbox: BoundingBox): readonly PublicMapLeadCore[];
  getVersion(
    publicLeadId: string,
    servedVersion: number,
  ): PublicMapLeadCore | null;
  getCurrent(publicLeadId: string): PublicMapLeadCore | null;
}

interface SnapshotReference {
  readonly publicLeadId: string;
  readonly servedVersion: number;
}

export interface QuerySnapshot {
  readonly snapshotId: string;
  readonly accountDigest: string;
  readonly queryDigest: string;
  readonly asOf: string;
  readonly expiresAtMs: number;
  readonly truncated: boolean;
  readonly refs: readonly SnapshotReference[];
}

export interface QuerySnapshotStore {
  save(snapshot: QuerySnapshot): void;
  get(snapshotId: string): QuerySnapshot | null;
  invalidate(snapshotId: string): void;
}

export class InMemoryQuerySnapshotStore implements QuerySnapshotStore {
  readonly #snapshots = new Map<string, QuerySnapshot>();

  save(snapshot: QuerySnapshot): void {
    this.#snapshots.set(snapshot.snapshotId, structuredClone(snapshot));
  }

  get(snapshotId: string): QuerySnapshot | null {
    return structuredClone(this.#snapshots.get(snapshotId) ?? null);
  }

  invalidate(snapshotId: string): void {
    this.#snapshots.delete(snapshotId);
  }
}

export class InMemoryPublicLeadRepository implements PublicLeadRepository {
  readonly #versions = new Map<string, PublicMapLeadCore>();
  readonly #current = new Map<string, PublicMapLeadCore>();

  constructor(leads: readonly PublicMapLeadCore[]) {
    for (const lead of leads) this.upsert(lead);
  }

  upsert(lead: PublicMapLeadCore): void {
    const clone = structuredClone(lead);
    this.#versions.set(`${lead.publicLeadId}:${lead.servedVersion}`, clone);
    this.#current.set(lead.publicLeadId, clone);
  }

  hide(publicLeadId: string): void {
    const current = this.#current.get(publicLeadId);
    if (current) {
      this.#current.set(publicLeadId, {
        ...current,
        visibility: "RETIRED",
      });
    }
  }

  listVisibleWithin(bbox: BoundingBox): readonly PublicMapLeadCore[] {
    return [...this.#current.values()].filter((lead) => {
      const location = lead.publicLocation;
      return (
        lead.visibility === "VISIBLE" &&
        location !== null &&
        location.longitude >= bbox.west &&
        location.longitude <= bbox.east &&
        location.latitude >= bbox.south &&
        location.latitude <= bbox.north
      );
    });
  }

  getVersion(
    publicLeadId: string,
    servedVersion: number,
  ): PublicMapLeadCore | null {
    return structuredClone(
      this.#versions.get(`${publicLeadId}:${servedVersion}`) ?? null,
    );
  }

  getCurrent(publicLeadId: string): PublicMapLeadCore | null {
    return structuredClone(this.#current.get(publicLeadId) ?? null);
  }
}

export interface PublicMapServiceConfig {
  readonly pageLimit: number;
  readonly snapshotCap: number;
  readonly snapshotTtlMs: number;
  readonly queryRequestsPerMinute: number;
  readonly detailRequestsPerMinute: number;
}

export const D09_PILOT_DEFAULTS: PublicMapServiceConfig = Object.freeze({
  pageLimit: 50,
  snapshotCap: 500,
  snapshotTtlMs: 120_000,
  queryRequestsPerMinute: 30,
  detailRequestsPerMinute: 60,
});

/** Local reference adapter. Production must bind a durable shared store. */
export class InMemorySharedRateLimitStore implements RateLimitStore {
  readonly #requests = new Map<string, number[]>();

  consume(input: {
    readonly key: string;
    readonly limit: number;
    readonly windowMs: number;
    readonly nowMs: number;
  }): "ALLOWED" | "LIMITED" {
    const cutoff = input.nowMs - input.windowMs;
    const active = (this.#requests.get(input.key) ?? []).filter(
      (timestamp) => timestamp > cutoff,
    );
    if (active.length >= input.limit) {
      this.#requests.set(input.key, active);
      return "LIMITED";
    }
    active.push(input.nowMs);
    this.#requests.set(input.key, active);
    return "ALLOWED";
  }
}

const digest = (value: unknown): string =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

const finite = (value: number): boolean => Number.isFinite(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const safeRequestMeta = (
  request: unknown,
): { readonly requestId: string; readonly generation: number } => {
  if (!isRecord(request)) return { requestId: "", generation: 0 };
  return {
    requestId:
      typeof request.requestId === "string" && request.requestId.length <= 128
        ? request.requestId
        : "",
    generation:
      typeof request.generation === "number" &&
      Number.isInteger(request.generation) &&
      request.generation >= 0
        ? request.generation
        : 0,
  };
};

const validBounds = (bbox: BoundingBox): boolean =>
  finite(bbox.west) &&
  finite(bbox.east) &&
  finite(bbox.south) &&
  finite(bbox.north) &&
  bbox.west >= -180 &&
  bbox.east <= 180 &&
  bbox.south >= -90 &&
  bbox.north <= 90 &&
  bbox.west < bbox.east &&
  bbox.south < bbox.north;

const error = (
  requestId: string,
  generation: number,
  code: PublicApiErrorCode,
  retryable = false,
  retryAfterSeconds: number | null = null,
): PublicApiError => ({
  ok: false,
  code,
  requestId,
  generation,
  retryable,
  retryAfterSeconds,
});

export const buildCloudBaseGeoWithinPlan = (bbox: BoundingBox) => ({
  kind: "CLOUDBASE_GEO_WITHIN" as const,
  geoIndexRequired: true as const,
  field: "publicLocation.point" as const,
  geometry: {
    type: "Polygon" as const,
    coordinates: [
      [
        [bbox.west, bbox.south],
        [bbox.east, bbox.south],
        [bbox.east, bbox.north],
        [bbox.west, bbox.north],
        [bbox.west, bbox.south],
      ],
    ],
  },
  exactServerCheckRequired: true as const,
});

export class PublicMapService {
  constructor(
    readonly repository: PublicLeadRepository,
    readonly snapshots: QuerySnapshotStore,
    readonly freshnessPolicy: FreshnessPolicy,
    readonly trustedPorts: PublicMapTrustedPorts,
    readonly config: PublicMapServiceConfig = D09_PILOT_DEFAULTS,
    readonly now: () => number = Date.now,
    readonly newSnapshotId: () => string = () =>
      randomBytes(16).toString("hex"),
  ) {}

  #accountDigest(accountId: string, secret: string): string {
    return createHmac("sha256", secret).update(accountId).digest("hex");
  }

  #cursor(snapshotId: string, offset: number, secret: string): string {
    const payload = `${snapshotId}.${offset}`;
    const tag = createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");
    return `${payload}.${tag}`;
  }

  #parseCursor(
    cursor: string,
    secret: string,
  ): { snapshotId: string; offset: number } | null {
    const [snapshotId, offsetText, tag, ...extra] = cursor.split(".");
    if (!snapshotId || !offsetText || !tag || extra.length > 0) return null;
    const offset = Number(offsetText);
    if (!Number.isSafeInteger(offset) || offset < 0) return null;
    const expected = createHmac("sha256", secret)
      .update(`${snapshotId}.${offset}`)
      .digest();
    let received: Buffer;
    try {
      received = Buffer.from(tag, "base64url");
    } catch {
      return null;
    }
    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      return null;
    }
    return { snapshotId, offset };
  }

  #schemaSupported(versions: readonly string[]): boolean {
    return (
      Array.isArray(versions) &&
      versions.every((version) => typeof version === "string") &&
      (versions.includes(PUBLIC_MAP_SCHEMA_VERSION) ||
        versions.includes(PUBLIC_MAP_NETWORK_SCHEMA_VERSION))
    );
  }

  #securityContext(
    requestId: string,
    generation: number,
  ):
    | { readonly accountId: string; readonly cursorSecret: string }
    | PublicApiError {
    try {
      if (this.trustedPorts.readControl?.readState() !== "ENABLED") {
        return error(requestId, generation, "SERVICE_UNAVAILABLE", true, 30);
      }
      const account = this.trustedPorts.account?.currentAccount();
      if (!account || account.accountId.trim().length === 0) {
        return error(requestId, generation, "UNAUTHORIZED");
      }
      const cursorSecret = this.trustedPorts.cursorSecret?.currentSecret();
      if (!cursorSecret || cursorSecret.length < MIN_CURSOR_SECRET_LENGTH) {
        return error(requestId, generation, "SERVICE_UNAVAILABLE", true, 30);
      }
      return { accountId: account.accountId, cursorSecret };
    } catch {
      return error(requestId, generation, "SERVICE_UNAVAILABLE", true, 30);
    }
  }

  #consumeRate(
    accountId: string,
    kind: "query" | "detail",
    limit: number,
    nowMs: number,
  ): "ALLOWED" | "LIMITED" | "UNAVAILABLE" {
    try {
      return (
        this.trustedPorts.rateLimit?.consume({
          key: `${kind}:${accountId}`,
          limit,
          windowMs: 60_000,
          nowMs,
        }) ?? "UNAVAILABLE"
      );
    } catch {
      return "UNAVAILABLE";
    }
  }

  query(request: ViewportRequest): ViewportResponse | PublicApiError {
    const nowMs = this.now();
    if (!isRecord(request)) return error("", 0, "INVALID_REQUEST");
    const meta = safeRequestMeta(request);
    const security = this.#securityContext(meta.requestId, meta.generation);
    if ("ok" in security) return security;
    if (!this.#schemaSupported(request.supportedSchemaVersions)) {
      return error(request.requestId, request.generation, "SCHEMA_UNSUPPORTED");
    }
    if (
      !Number.isInteger(request.limit) ||
      request.limit < 1 ||
      request.limit > this.config.pageLimit ||
      !finite(request.zoom) ||
      request.zoom < 0 ||
      request.zoom > 22 ||
      (request.mode !== "MAP" && request.mode !== "LIST") ||
      typeof request.includeLowFreshness !== "boolean" ||
      !Array.isArray(request.opportunityStatuses) ||
      request.opportunityStatuses.some(
        (level) =>
          typeof level !== "string" || !PUBLIC_OPPORTUNITY_STATUSES.has(level),
      ) ||
      !Number.isInteger(request.generation) ||
      request.generation < 0 ||
      (request.cursor !== null && typeof request.cursor !== "string") ||
      (request.asOf !== null && typeof request.asOf !== "string") ||
      typeof request.requestId !== "string" ||
      request.requestId.length < 1 ||
      request.requestId.length > 128
    ) {
      return error(request.requestId, request.generation, "INVALID_REQUEST");
    }
    if (!isRecord(request.bbox) || !validBounds(request.bbox)) {
      return error(request.requestId, request.generation, "INVALID_VIEWPORT");
    }
    const rate = this.#consumeRate(
      security.accountId,
      "query",
      this.config.queryRequestsPerMinute,
      nowMs,
    );
    if (rate === "UNAVAILABLE") {
      return error(
        request.requestId,
        request.generation,
        "SERVICE_UNAVAILABLE",
        true,
        30,
      );
    }
    if (rate === "LIMITED") {
      return error(
        request.requestId,
        request.generation,
        "RATE_LIMITED",
        true,
        60,
      );
    }

    const boundsDigest = digest(request.bbox);
    const filtersDigest = digest({
      opportunityStatuses: [...request.opportunityStatuses].sort(),
      includeLowFreshness: request.includeLowFreshness,
      mode: request.mode,
    });
    const schemaVersion = request.supportedSchemaVersions.includes(
      PUBLIC_MAP_NETWORK_SCHEMA_VERSION,
    )
      ? PUBLIC_MAP_NETWORK_SCHEMA_VERSION
      : PUBLIC_MAP_SCHEMA_VERSION;
    const queryDigest = digest({
      bbox: request.bbox,
      zoom: request.zoom,
      filtersDigest,
      limit: request.limit,
      schemaVersion,
    });

    let snapshot: QuerySnapshot;
    let offset = 0;
    if (request.cursor === null) {
      if (request.asOf !== null) {
        return error(request.requestId, request.generation, "INVALID_REQUEST");
      }
      const asOf = new Date(nowMs).toISOString();
      const candidates = [...this.repository.listVisibleWithin(request.bbox)]
        .filter((lead) => {
          if (
            !lead.opportunity ||
            !lead.observedAt ||
            !visibleAt(lead, nowMs) ||
            (lead.servingSchemaVersion === "public-map-v4" &&
              schemaVersion !== "public-map-v4")
          )
            return false;
          if (
            request.opportunityStatuses.length > 0 &&
            !lead.opportunity.reasonCodes.some((status) =>
              request.opportunityStatuses.includes(status),
            )
          ) {
            return false;
          }
          if (!request.includeLowFreshness) {
            return (
              evaluateFreshness(lead.observedAt, asOf, this.freshnessPolicy)
                .freshnessBand !== "LOW"
            );
          }
          return true;
        })
        .sort(
          (left, right) =>
            Date.parse(right.observedAt ?? "") -
              Date.parse(left.observedAt ?? "") ||
            left.publicLeadId.localeCompare(right.publicLeadId),
        );
      snapshot = {
        snapshotId: this.newSnapshotId(),
        accountDigest: this.#accountDigest(
          security.accountId,
          security.cursorSecret,
        ),
        queryDigest,
        asOf,
        expiresAtMs: nowMs + this.config.snapshotTtlMs,
        truncated: candidates.length > this.config.snapshotCap,
        refs: candidates.slice(0, this.config.snapshotCap).map((lead) => ({
          publicLeadId: lead.publicLeadId,
          servedVersion: lead.servedVersion,
        })),
      };
      this.snapshots.save(snapshot);
    } else {
      const parsed = this.#parseCursor(request.cursor, security.cursorSecret);
      if (!parsed) {
        return error(request.requestId, request.generation, "CURSOR_INVALID");
      }
      const stored = this.snapshots.get(parsed.snapshotId);
      if (!stored) {
        return error(request.requestId, request.generation, "CURSOR_EXPIRED");
      }
      if (stored.expiresAtMs <= nowMs) {
        this.snapshots.invalidate(stored.snapshotId);
        return error(request.requestId, request.generation, "CURSOR_EXPIRED");
      }
      if (
        stored.accountDigest !==
          this.#accountDigest(security.accountId, security.cursorSecret) ||
        stored.queryDigest !== queryDigest ||
        request.asOf !== stored.asOf
      ) {
        return error(request.requestId, request.generation, "CURSOR_INVALID");
      }
      snapshot = stored;
      offset = parsed.offset;
    }

    const refs = snapshot.refs.slice(offset, offset + request.limit);
    const visible: PublicMapLeadCore[] = [];
    let removedSinceSnapshot = 0;
    for (const ref of refs) {
      const version = this.repository.getVersion(
        ref.publicLeadId,
        ref.servedVersion,
      );
      const current = this.repository.getCurrent(ref.publicLeadId);
      if (
        !version ||
        !current ||
        !visibleAt(current, nowMs) ||
        !visibleAt(version, nowMs) ||
        (version.servingSchemaVersion === "public-map-v4" &&
          schemaVersion !== "public-map-v4")
      ) {
        removedSinceSnapshot += 1;
        continue;
      }
      visible.push(version);
    }
    const coordinateCounts = new Map<string, number>();
    for (const lead of visible) {
      const location = lead.publicLocation;
      if (!location) continue;
      const key = `${location.latitude}:${location.longitude}`;
      coordinateCounts.set(key, (coordinateCounts.get(key) ?? 0) + 1);
    }
    const items = visible
      .map((lead) => this.#marker(lead, snapshot.asOf, coordinateCounts))
      .filter((item): item is PublicMarker => item !== null);
    const nextOffset = offset + request.limit;
    return {
      ok: true,
      schemaVersion,
      requestId: request.requestId,
      generation: request.generation,
      asOf: snapshot.asOf,
      queryEcho: {
        boundsDigest,
        zoomBand: String(Math.floor(request.zoom)),
        filtersDigest,
      },
      items,
      nextCursor:
        nextOffset < snapshot.refs.length
          ? this.#cursor(snapshot.snapshotId, nextOffset, security.cursorSecret)
          : null,
      truncated: snapshot.truncated,
      density: {
        returnedCount: items.length,
        serverCap: this.config.snapshotCap,
        overlapPresent: [...coordinateCounts.values()].some(
          (count) => count > 1,
        ),
        aggregationAvailable: false,
        removedSinceSnapshot,
      },
    };
  }

  detail(request: DetailRequest): DetailResponse | PublicApiError {
    const nowMs = this.now();
    if (!isRecord(request)) return error("", 0, "INVALID_REQUEST");
    const meta = safeRequestMeta(request);
    const security = this.#securityContext(meta.requestId, meta.generation);
    if ("ok" in security) return security;
    if (!this.#schemaSupported(request.supportedSchemaVersions)) {
      return error(request.requestId, request.generation, "SCHEMA_UNSUPPORTED");
    }
    if (
      typeof request.publicLeadId !== "string" ||
      request.publicLeadId.length < 8 ||
      request.publicLeadId.length > 128 ||
      !Number.isInteger(request.generation) ||
      request.generation < 0 ||
      typeof request.requestId !== "string" ||
      request.requestId.length < 1 ||
      request.requestId.length > 128
    ) {
      return error(request.requestId, request.generation, "INVALID_REQUEST");
    }
    const rate = this.#consumeRate(
      security.accountId,
      "detail",
      this.config.detailRequestsPerMinute,
      nowMs,
    );
    if (rate === "UNAVAILABLE") {
      return error(
        request.requestId,
        request.generation,
        "SERVICE_UNAVAILABLE",
        true,
        30,
      );
    }
    if (rate === "LIMITED") {
      return error(
        request.requestId,
        request.generation,
        "RATE_LIMITED",
        true,
        60,
      );
    }
    const lead = this.repository.getCurrent(request.publicLeadId);
    if (
      !lead ||
      !visibleAt(lead, nowMs) ||
      (lead.servingSchemaVersion === "public-map-v4" &&
        !request.supportedSchemaVersions.includes(
          PUBLIC_MAP_NETWORK_SCHEMA_VERSION,
        ))
    ) {
      return error(request.requestId, request.generation, "LEAD_UNAVAILABLE");
    }
    const item = this.#detail(lead, new Date(nowMs).toISOString());
    if (!item) {
      return error(request.requestId, request.generation, "LEAD_UNAVAILABLE");
    }
    return {
      ok: true,
      schemaVersion: request.supportedSchemaVersions.includes(
        PUBLIC_MAP_NETWORK_SCHEMA_VERSION,
      )
        ? PUBLIC_MAP_NETWORK_SCHEMA_VERSION
        : PUBLIC_MAP_SCHEMA_VERSION,
      requestId: request.requestId,
      generation: request.generation,
      item,
    };
  }

  #marker(
    lead: PublicMapLeadCore,
    asOf: string,
    coordinateCounts: ReadonlyMap<string, number>,
  ): PublicMarker | null {
    if (
      lead.visibility !== "VISIBLE" ||
      !lead.publicLocation ||
      !lead.boardShortLabel ||
      !lead.opportunity ||
      !lead.observedAt ||
      !lead.freshnessPolicyVersion
    ) {
      return null;
    }
    const freshness = evaluateFreshness(
      lead.observedAt,
      asOf,
      this.freshnessPolicy,
    );
    const locationKey = `${lead.publicLocation.latitude}:${lead.publicLocation.longitude}`;
    const overlapCount = coordinateCounts.get(locationKey) ?? 1;
    return {
      publicLeadId: lead.publicLeadId,
      servedVersion: lead.servedVersion,
      projectionVersion: lead.projectionVersion,
      policyVersion: lead.policyVersion,
      asOf,
      publicLocation: {
        latitude: lead.publicLocation.latitude,
        longitude: lead.publicLocation.longitude,
        coordinateSystem: "GCJ02",
        precisionMode: lead.publicLocation.precisionMode,
        areaLabel: lead.publicLocation.areaLabel,
      },
      boardShortLabel: lead.boardShortLabel,
      totalRemaining: lead.board
        ? totalRemainingForTiers(lead.board.tiers)
        : null,
      recordType: lead.recordType,
      opportunity: {
        primaryStatus: lead.opportunity.primaryStatus,
        reasonCodes: [...lead.opportunity.reasonCodes],
        policyVersion: lead.opportunity.policyVersion,
        evaluatedAt: lead.opportunity.evaluatedAt,
      },
      freshness: {
        observedAt: freshness.observedAt,
        band: freshness.freshnessBand,
        freshnessAsOf: freshness.freshnessAsOf,
        policyVersion: freshness.freshnessPolicyVersion,
      },
      sourceLabel: lead.sourceLabel,
      ...(lead.servingSchemaVersion === "public-map-v4"
        ? {
            publicUntil: lead.publicUntil,
            networkPolicyVersion: lead.networkPolicyVersion,
            sourceIcon: lead.sourceIcon,
          }
        : {}),
      overlapHint: overlapCount > 1 ? { displayCount: overlapCount } : null,
    };
  }

  #detail(lead: PublicMapLeadCore, asOf: string): PublicDetail | null {
    if (
      lead.visibility !== "VISIBLE" ||
      !lead.publicLocation ||
      !lead.board ||
      !lead.opportunity ||
      !lead.observedAt ||
      !lead.freshnessPolicyVersion ||
      !lead.disclosures
    ) {
      return null;
    }
    const totalRemaining = totalRemainingForTiers(lead.board.tiers);
    const grandRemainingValues = lead.board.tiers
      .filter((tier) => tier.isGrandPrize)
      .map((tier) => tier.remainingTickets);
    const grandPrizeRemaining =
      grandRemainingValues.length > 0 &&
      grandRemainingValues.every((remaining) => remaining !== null)
        ? grandRemainingValues.reduce<number>(
            (total, remaining) => total + remaining!,
            0,
          )
        : null;
    const fullPackCostMinor =
      totalRemaining !== null && lead.board.pricePerDrawMinor !== null
        ? totalRemaining * lead.board.pricePerDrawMinor
        : null;
    const freshness = evaluateFreshness(
      lead.observedAt,
      asOf,
      this.freshnessPolicy,
    );
    return {
      publicLeadId: lead.publicLeadId,
      servedVersion: lead.servedVersion,
      projectionVersion: lead.projectionVersion,
      policyVersion: lead.policyVersion,
      asOf,
      publicLocation: {
        latitude: lead.publicLocation.latitude,
        longitude: lead.publicLocation.longitude,
        coordinateSystem: "GCJ02",
        precisionMode: lead.publicLocation.precisionMode,
        areaLabel: lead.publicLocation.areaLabel,
      },
      board: {
        ipName: lead.board.ipName,
        themeName: lead.board.themeName,
        tiers: lead.board.tiers.map((tier) => ({
          tierCode: tier.tierCode,
          displayLabel: tier.displayLabel,
          remainingTickets: tier.remainingTickets,
          isGrandPrize: tier.isGrandPrize,
        })),
        grandPrizeRemaining,
        totalRemaining,
        pricePerDrawMinor: lead.board.pricePerDrawMinor,
        fullPackCostMinor,
      },
      recordType: lead.recordType,
      contributor: lead.contributor,
      contributors:
        lead.contributors ?? (lead.contributor ? [lead.contributor] : []),
      opportunity: {
        primaryStatus: lead.opportunity.primaryStatus,
        reasonCodes: [...lead.opportunity.reasonCodes],
        policyVersion: lead.opportunity.policyVersion,
        evaluatedAt: lead.opportunity.evaluatedAt,
      },
      freshness: {
        observedAt: freshness.observedAt,
        band: freshness.freshnessBand,
        freshnessAsOf: freshness.freshnessAsOf,
        policyVersion: freshness.freshnessPolicyVersion,
      },
      venueNote: lead.venueNote,
      sourceLabel: lead.sourceLabel,
      ...(lead.servingSchemaVersion === "public-map-v4"
        ? {
            publicUntil: lead.publicUntil,
            networkPolicyVersion: lead.networkPolicyVersion,
            sourceIcon: lead.sourceIcon,
          }
        : {}),
      disclosures: {
        nonRealtime: true,
        nonRecommendation: true,
      },
    };
  }
}

export const shouldAcceptResponseGeneration = (
  responseGeneration: number,
  currentGeneration: number,
): boolean => responseGeneration === currentGeneration;
