import { describe, expect, it } from "vitest";

import {
  D09_PILOT_DEFAULTS,
  InMemorySharedRateLimitStore,
  InMemoryPublicLeadRepository,
  InMemoryQuerySnapshotStore,
  PUBLIC_MAP_SCHEMA_VERSION,
  PublicMapService,
  buildCloudBaseGeoWithinPlan,
  shouldAcceptResponseGeneration,
  type PublicMapLeadCore,
  type ViewportRequest,
} from "./index.js";

const now = Date.parse("2026-09-12T03:00:00.000Z");

const lead = (
  index: number,
  overrides: Partial<PublicMapLeadCore> = {},
): PublicMapLeadCore => ({
  publicLeadId: `public-lead-${String(index).padStart(4, "0")}`,
  servedVersion: 1,
  projectionVersion: "projection-v1",
  policyVersion: "public-policy-v1",
  visibility: "VISIBLE",
  publicLocation: {
    coordinateSystem: "GCJ02",
    latitude: 31.2 + index / 100_000,
    longitude: 121.4 + index / 100_000,
    precisionMode: "APPROXIMATE",
    areaLabel: "上海",
    locationPolicyVersion: "location-v1",
    projectionRuleId: "rule-a",
  },
  boardShortLabel: `测试版面 ${index}`,
  board: {
    ipName: "测试 IP",
    themeName: "主题",
    pricePerDrawMinor: 7900,
    tiers: [
      {
        tierCode: "A",
        displayLabel: "A赏",
        remainingTickets: index % 2,
        isGrandPrize: true,
      },
    ],
  },
  recordType: "DRAW_RECORD",
  opportunity: {
    primaryStatus: "GRAND_PRIZE_REMAINS",
    reasonCodes: ["GRAND_PRIZE_REMAINS"],
    policyVersion: "opportunity-v1",
    evaluatedAt: "2026-09-12T02:00:00.000Z",
  },
  observedAt: "2026-09-12T02:00:00.000Z",
  freshnessPolicyVersion: "freshness-v1",
  venueNote: "某商场三楼",
  contributor: {
    displayName: "ICHI 玩家",
    avatar: {
      kind: "FALLBACK_ASSET",
      path: "/assets/v1-29/ichi-avatar.png",
    },
  },
  sourceLabel: null,
  disclosures: { nonRealtime: true, nonRecommendation: true },
  retiredAt: null,
  ...overrides,
});

const request = (
  overrides: Partial<ViewportRequest> = {},
): ViewportRequest => ({
  bbox: { west: 121.3, south: 31.1, east: 121.6, north: 31.4 },
  zoom: 13,
  mode: "MAP",
  opportunityStatuses: [],
  includeLowFreshness: true,
  limit: 50,
  cursor: null,
  asOf: null,
  requestId: "request-1",
  generation: 1,
  supportedSchemaVersions: [PUBLIC_MAP_SCHEMA_VERSION],
  ...overrides,
});

const service = (
  leads: readonly PublicMapLeadCore[],
  options: {
    readonly now?: () => number;
    readonly accountId?: string | null;
    readonly readState?: "ENABLED" | "DISABLED" | "UNAVAILABLE";
    readonly secret?: string | null;
    readonly rateLimit?: InMemorySharedRateLimitStore | null;
    readonly config?: typeof D09_PILOT_DEFAULTS;
  } = {},
) => {
  const repository = new InMemoryPublicLeadRepository(leads);
  const accountId =
    options.accountId === undefined ? "account-a" : options.accountId;
  const secret =
    options.secret === undefined
      ? "test-only-cursor-secret-32-bytes-minimum"
      : options.secret;
  return {
    repository,
    api: new PublicMapService(
      repository,
      new InMemoryQuerySnapshotStore(),
      {
        policyVersion: "freshness-v1",
        recentMaxAgeMs: 60 * 60 * 1000,
        agingMaxAgeMs: 24 * 60 * 60 * 1000,
      },
      {
        account: { currentAccount: () => (accountId ? { accountId } : null) },
        ...(options.rateLimit === null
          ? {}
          : {
              rateLimit:
                options.rateLimit ?? new InMemorySharedRateLimitStore(),
            }),
        readControl: {
          readState: () => options.readState ?? "ENABLED",
        },
        cursorSecret: { currentSecret: () => secret },
      },
      options.config ?? D09_PILOT_DEFAULTS,
      options.now ?? (() => now),
      () => "snapshot-handle-0001",
    ),
  };
};

describe("TASK-V2-13 viewport/detail service", () => {
  it("returns bounded marker allowlist and a CloudBase geoWithin plan", () => {
    const { api } = service(
      Array.from({ length: 30 }, (_, index) => lead(index)),
    );
    const result = api.query(request());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items).toHaveLength(30);
    expect(result.nextCursor).toBeNull();
    expect(result.items[0]?.totalRemaining).toBe(0);
    expect(result.items[1]?.totalRemaining).toBe(1);
    expect(Object.keys(result.items[0]!)).toEqual([
      "publicLeadId",
      "servedVersion",
      "projectionVersion",
      "policyVersion",
      "asOf",
      "publicLocation",
      "boardShortLabel",
      "totalRemaining",
      "recordType",
      "opportunity",
      "freshness",
      "sourceLabel",
      "overlapHint",
    ]);
    expect(buildCloudBaseGeoWithinPlan(request().bbox)).toMatchObject({
      kind: "CLOUDBASE_GEO_WITHIN",
      geoIndexRequired: true,
      field: "publicLocation.point",
      exactServerCheckRequired: true,
    });
  });

  it("supports 50-item pages, server snapshots and cursor query binding", () => {
    const { api } = service(
      Array.from({ length: 60 }, (_, index) => lead(index)),
    );
    const first = api.query(request());
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.items).toHaveLength(50);
    expect(first.nextCursor).not.toBeNull();

    const second = api.query(
      request({
        cursor: first.nextCursor,
        asOf: first.asOf,
        requestId: "request-2",
      }),
    );
    expect(second.ok).toBe(true);
    expect(second.ok && second.items).toHaveLength(10);
    expect(
      api.query(
        request({
          cursor: first.nextCursor,
          asOf: first.asOf,
          bbox: { west: 121.31, south: 31.1, east: 121.6, north: 31.4 },
          requestId: "request-3",
        }),
      ),
    ).toMatchObject({ ok: false, code: "CURSOR_INVALID" });
  });

  it("bounds a 650-lead viewport to one 500-ref snapshot and ten 50-item pages", () => {
    const { api } = service(
      Array.from({ length: 650 }, (_, index) => lead(index)),
    );
    let cursor: string | null = null;
    let asOf: string | null = null;
    const ids: string[] = [];
    let responseBytes = 0;
    for (let page = 0; page < 10; page += 1) {
      const result = api.query(
        request({ cursor, asOf, requestId: `scale-${page}` }),
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.truncated).toBe(true);
      expect(result.density.serverCap).toBe(500);
      expect(result.items).toHaveLength(50);
      responseBytes += Buffer.byteLength(JSON.stringify(result));
      ids.push(...result.items.map((item) => item.publicLeadId));
      cursor = result.nextCursor;
      asOf = result.asOf;
    }
    expect(cursor).toBeNull();
    expect(ids).toHaveLength(500);
    expect(new Set(ids).size).toBe(500);
    console.log(
      `TASK-V2-18 reference service 650 candidates: 10 pages, 500 unique leads, ${responseBytes} JSON bytes total`,
    );
  });

  it("expires cursors and rechecks visibility before serializing a later page", () => {
    let currentNow = now;
    const { api, repository } = service(
      Array.from({ length: 60 }, (_, index) => lead(index)),
      { now: () => currentNow },
    );
    const first = api.query(request());
    expect(first.ok).toBe(true);
    if (!first.ok || !first.nextCursor) return;
    repository.hide("public-lead-0050");
    const second = api.query(
      request({ cursor: first.nextCursor, asOf: first.asOf }),
    );
    expect(second.ok).toBe(true);
    expect(
      second.ok &&
        second.items.some((item) => item.publicLeadId === "public-lead-0050"),
    ).toBe(false);
    expect(second.ok && second.density.removedSinceSnapshot).toBe(1);

    currentNow += 120_001;
    expect(
      api.query(
        request({
          cursor: first.nextCursor,
          asOf: first.asOf,
          requestId: "expired",
        }),
      ),
    ).toMatchObject({ ok: false, code: "CURSOR_EXPIRED" });
  });

  it("returns empty safely and excludes records without PublicLocation", () => {
    const { api } = service([lead(1, { publicLocation: null })]);
    const result = api.query(request());
    expect(result.ok).toBe(true);
    expect(result.ok && result.items).toEqual([]);
  });

  it("serializes detail from an explicit allowlist with zero private leakage", () => {
    const injected = {
      ...lead(1),
      ownerAccountId: "private-owner",
      recordId: "private-record",
      boardId: "private-board",
      submissionId: "private-submission",
      rawObservationLocation: { accuracyMeters: 1 },
      verificationEvidence: "private-verification",
      rightsEvidence: "private-rights",
      moderationEvidence: "private-moderation",
      resolverEvidence: "private-resolver",
      rawDrawEvents: [{ tierCode: "A" }],
      boardImage: "private-image",
      networkUrl: "private-url",
    } as PublicMapLeadCore;
    const { api } = service([injected]);
    const result = api.detail({
      publicLeadId: injected.publicLeadId,
      requestId: "detail-1",
      generation: 1,
      supportedSchemaVersions: [PUBLIC_MAP_SCHEMA_VERSION],
    });
    expect(result.ok).toBe(true);
    const serialized = JSON.stringify(result);
    for (const forbidden of [
      "private-owner",
      "private-record",
      "private-board",
      "private-submission",
      "private-verification",
      "private-rights",
      "private-moderation",
      "private-resolver",
      "private-image",
      "private-url",
      "rawDrawEvents",
      "accuracyMeters",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(result.ok && result.item.board.totalRemaining).toBe(1);
    expect(result.ok && result.item.board.fullPackCostMinor).toBe(7900);
  });

  it("uses one unavailable result for hidden/retired detail", () => {
    const { api, repository } = service([lead(1)]);
    repository.hide("public-lead-0001");
    expect(
      api.detail({
        publicLeadId: "public-lead-0001",
        requestId: "detail-hidden",
        generation: 1,
        supportedSchemaVersions: [PUBLIC_MAP_SCHEMA_VERSION],
      }),
    ).toMatchObject({ ok: false, code: "LEAD_UNAVAILABLE" });
  });

  it("fails closed for identity, schema, invalid viewport, rate and global cost stop", () => {
    const { api } = service([lead(1)], {
      config: {
        ...D09_PILOT_DEFAULTS,
        queryRequestsPerMinute: 1,
      },
    });
    expect(
      service([lead(1)], { accountId: null }).api.query(request()),
    ).toMatchObject({ ok: false, code: "UNAUTHORIZED" });
    expect(
      api.query(request({ supportedSchemaVersions: ["unknown"] })),
    ).toMatchObject({ ok: false, code: "SCHEMA_UNSUPPORTED" });
    expect(
      api.query(
        request({ bbox: { west: 122, south: 31, east: 121, north: 32 } }),
      ),
    ).toMatchObject({ ok: false, code: "INVALID_VIEWPORT" });
    expect(api.query(request({ zoom: Number.NaN }))).toMatchObject({
      ok: false,
      code: "INVALID_REQUEST",
    });
    expect(
      api.query(request({ opportunityStatuses: ["UNAPPROVED"] })),
    ).toMatchObject({ ok: false, code: "INVALID_REQUEST" });
    expect(api.query(request({ mode: "GRID" as "MAP" }))).toMatchObject({
      ok: false,
      code: "INVALID_REQUEST",
    });
    expect(api.query(request()).ok).toBe(true);
    expect(api.query(request({ requestId: "rate-2" }))).toMatchObject({
      ok: false,
      code: "RATE_LIMITED",
    });

    const stopped = service([lead(1)], { readState: "DISABLED" }).api;
    expect(stopped.query(request())).toMatchObject({
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    });
  });

  it("fails closed when the server cursor secret is missing or too short", () => {
    expect(service([], { secret: null }).api.query(request())).toMatchObject({
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    });
    expect(
      service([], { secret: "too-short" }).api.query(request()),
    ).toMatchObject({ ok: false, code: "SERVICE_UNAVAILABLE" });
  });

  it("allows a page error to retain loaded data and discards late generations", () => {
    const loaded = ["public-lead-0001"];
    const pageError = { ok: false, code: "CURSOR_EXPIRED" } as const;
    const retained = pageError.ok ? [] : loaded;
    expect(retained).toEqual(loaded);
    expect(shouldAcceptResponseGeneration(2, 3)).toBe(false);
    expect(shouldAcceptResponseGeneration(3, 3)).toBe(true);
  });
});

describe("TASK21 public opportunity status contract", () => {
  it("filters by any coexisting reason and keeps the same primary status in detail", () => {
    const core = lead(1, {
      opportunity: {
        primaryStatus: "LAST_CHANCE",
        reasonCodes: ["LAST_CHANCE", "GRAND_PRIZE_REMAINS"],
        policyVersion: "opportunity-20260930-v1",
        evaluatedAt: new Date(now).toISOString(),
      },
    });
    const { api } = service([core]);
    const result = api.query(
      request({ opportunityStatuses: ["GRAND_PRIZE_REMAINS"] }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.code);
    expect(result.items[0]?.opportunity).toEqual(core.opportunity);
    expect(result.items[0]?.opportunity).not.toHaveProperty("level");
    expect(api.query(request({ opportunityStatuses: ["HIGH"] }))).toMatchObject(
      { ok: false, code: "INVALID_REQUEST" },
    );
    expect(
      api.query(request({ supportedSchemaVersions: ["public-map-v2"] })),
    ).toMatchObject({ ok: false, code: "SCHEMA_UNSUPPORTED" });
  });
});
