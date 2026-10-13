import { describe, expect, it, vi } from "vitest";

import {
  PublicMapClient,
  PUBLIC_MAP_PREPARED_DETAIL_TTL_MS,
  PUBLIC_MAP_PREPARED_DETAIL_LIMIT,
  mapPublicMapError,
  type PublicMapClientState,
} from "./public-map-client.js";
import { PublicMapMemoryCache } from "./public-map-cache.js";
import {
  containsForbiddenPrivateMapField,
  PUBLIC_MAP_SCHEMA_VERSION,
  type PublicDetailRequest,
  type PublicDetailResult,
  type PublicMapError,
  type PublicMapErrorCode,
  type PublicMapQuery,
  type PublicMapService,
  type PublicMarker,
  type PublicViewportRequest,
  type PublicViewportResult,
} from "./public-map-contract.js";
import {
  createDefaultPublicMapQuery,
  createPublicMapQueryIdentity,
} from "./public-map-query.js";
import {
  SYNTHETIC_PUBLIC_MARKERS,
  SyntheticPublicMapService,
} from "./public-map-synthetic-service.js";

interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
}

const deferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

class ControlledPublicMapService implements PublicMapService {
  readonly viewport: Array<{
    readonly request: PublicViewportRequest;
    readonly deferred: Deferred<PublicViewportResult>;
  }> = [];
  readonly details: Array<{
    readonly request: PublicDetailRequest;
    readonly deferred: Deferred<PublicDetailResult>;
  }> = [];

  query(request: PublicViewportRequest): Promise<PublicViewportResult> {
    const pending = deferred<PublicViewportResult>();
    this.viewport.push({ request, deferred: pending });
    return pending.promise;
  }

  detail(request: PublicDetailRequest): Promise<PublicDetailResult> {
    const pending = deferred<PublicDetailResult>();
    this.details.push({ request, deferred: pending });
    return pending.promise;
  }
}

const viewportSuccess = (
  request: PublicViewportRequest,
  items: readonly PublicMarker[] = SYNTHETIC_PUBLIC_MARKERS.slice(0, 2),
  nextCursor: string | null = "opaque:cursor:page-2",
): Extract<PublicViewportResult, { readonly ok: true }> => ({
  ok: true,
  schemaVersion: PUBLIC_MAP_SCHEMA_VERSION,
  requestId: request.requestId,
  generation: request.generation,
  asOf: "2026-09-13T03:00:00.000Z",
  queryEcho: {
    boundsDigest: "bounds",
    zoomBand: "z12",
    filtersDigest: "filters",
  },
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

const serviceError = (
  request: { readonly requestId: string; readonly generation: number },
  code: PublicMapErrorCode,
): PublicMapError => ({
  ok: false,
  code,
  requestId: request.requestId,
  generation: request.generation,
  retryable: code !== "SCHEMA_UNSUPPORTED",
  retryAfterSeconds: code === "RATE_LIMITED" ? 30 : null,
});

const detailSuccess = (
  request: PublicDetailRequest,
  marker = SYNTHETIC_PUBLIC_MARKERS[0]!,
): PublicDetailResult => ({
  ok: true,
  schemaVersion: PUBLIC_MAP_SCHEMA_VERSION,
  requestId: request.requestId,
  generation: request.generation,
  item: {
    publicLeadId: marker.publicLeadId,
    servedVersion: marker.servedVersion,
    projectionVersion: marker.projectionVersion,
    policyVersion: marker.policyVersion,
    asOf: marker.asOf,
    publicLocation: marker.publicLocation,
    board: {
      ipName: marker.boardShortLabel,
      themeName: null,
      tiers: [],
      grandPrizeRemaining: null,
      totalRemaining: 12,
      pricePerDrawMinor: 650,
      fullPackCostMinor: 7800,
    },
    recordType: marker.recordType,
    contributor: {
      displayName: "ICHI 玩家",
      avatarUrl: "/assets/v1-29/ichi-avatar.png",
    },
    opportunity: {
      primaryStatus: marker.opportunity.primaryStatus,
      reasonCodes: [],
      policyVersion: "opportunity-v1",
      evaluatedAt: marker.freshness.observedAt,
    },
    freshness: marker.freshness,
    venueNote: null,
    sourceLabel: marker.sourceLabel,
    disclosures: { nonRealtime: true, nonRecommendation: true },
  },
});

const queryWith = (
  west: number,
  levels: PublicMapQuery["opportunityStatuses"] = ["GRAND_PRIZE_REMAINS"],
): PublicMapQuery => ({
  ...createDefaultPublicMapQuery(),
  bbox: { ...createDefaultPublicMapQuery().bbox, west },
  opportunityStatuses: levels,
});

const createControlledClient = (now = () => 1_000) => {
  const service = new ControlledPublicMapService();
  const cache = new PublicMapMemoryCache(120_000);
  const client = new PublicMapClient({
    service,
    cache,
    initialQuery: createDefaultPublicMapQuery(),
    now,
    pageLimit: 2,
  });
  return { client, service, cache };
};

describe("fresh picker metadata reads", () => {
  const ready = async () => {
    const env = createControlledClient();
    const pending = env.client.loadInitial();
    env.service.viewport[0]!.deferred.resolve(
      viewportSuccess(env.service.viewport[0]!.request),
    );
    await pending;
    return env;
  };

  it("reads a public detail without changing the selected card or retaining details in cache", async () => {
    const { client, service, cache } = await ready();
    const before = client.state;
    const pending = client.readLeadForPicker("lead-synthetic-001");
    const request = service.details[0]!;
    request.deferred.resolve(detailSuccess(request.request));
    expect((await pending)?.publicLeadId).toBe("lead-synthetic-001");
    expect(client.state).toBe(before);
    expect(cache.readDetail("lead-synthetic-001")).toBeNull();
  });

  it.each(["viewport-loading", "bounded-page"])(
    "revalidates a rendered lead missing from %s without appending it to the query",
    async (phase) => {
      const { client, service, cache } = await ready();
      const query = client.changeQuery(queryWith(121.3));
      if (phase === "bounded-page") {
        service.viewport[1]!.deferred.resolve(
          viewportSuccess(service.viewport[1]!.request, [
            SYNTHETIC_PUBLIC_MARKERS[1]!,
          ]),
        );
        await query;
      }
      expect(await client.readLeadForPicker("lead-synthetic-001")).toBeNull();
      expect(service.details).toHaveLength(0);
      const read = client.readLeadForPicker("lead-synthetic-001", {
        allowRenderedLead: true,
      });
      expect(service.details).toHaveLength(1);
      const request = service.details[0]!.request;
      service.details[0]!.deferred.resolve(detailSuccess(request));
      expect((await read)?.publicLeadId).toBe("lead-synthetic-001");
      expect(client.isPublicLeadUnavailable("lead-synthetic-001")).toBe(false);
      expect(
        client.state.items.some((m) => m.publicLeadId === "lead-synthetic-001"),
      ).toBe(false);
      expect(client.state.detail.phase).toBe("IDLE");
      expect(cache.readDetail("lead-synthetic-001")).toBeNull();
      if (phase === "viewport-loading") {
        service.viewport[1]!.deferred.resolve(
          viewportSuccess(service.viewport[1]!.request, [
            SYNTHETIC_PUBLIC_MARKERS[1]!,
          ]),
        );
        await query;
      }
    },
  );

  it.each(["LEAD_UNAVAILABLE", "RATE_LIMITED", "UNAUTHORIZED"] as const)(
    "distinguishes %s from an omitted summary for a rendered lead",
    async (code) => {
      const { client, service } = await ready();
      const query = client.changeQuery(queryWith(121.3));
      service.viewport[1]!.deferred.resolve(
        viewportSuccess(service.viewport[1]!.request, []),
      );
      await query;
      const read = client.readLeadForPicker("lead-synthetic-001", {
        allowRenderedLead: true,
      });
      const pending = service.details[0]!;
      pending.deferred.resolve(serviceError(pending.request, code));
      expect(await read).toBeNull();
      expect(client.isPublicLeadUnavailable("lead-synthetic-001")).toBe(
        code === "LEAD_UNAVAILABLE",
      );
      expect(service.details).toHaveLength(1);
    },
  );

  it.each(["query-changed", "deleted"])(
    "rejects a late rendered-lead response after %s",
    async (reason) => {
      const { client, service } = await ready();
      const query = client.changeQuery(queryWith(121.3));
      const read = client.readLeadForPicker("lead-synthetic-001", {
        allowRenderedLead: true,
      });
      const pending = service.details[0]!;
      let next: Promise<void> | undefined;
      if (reason === "deleted")
        client.suppressPublicLead("lead-synthetic-001", {
          noResurrection: true,
        });
      else next = client.changeQuery(queryWith(121.4));
      pending.deferred.resolve(detailSuccess(pending.request));
      expect(await read).toBeNull();
      if (reason === "deleted") {
        expect(client.isDeletedPublicLead("lead-synthetic-001")).toBe(true);
        expect(client.isPublicLeadUnavailable("lead-synthetic-001")).toBe(true);
      }
      for (const pendingQuery of service.viewport.slice(1))
        pendingQuery.deferred.resolve(viewportSuccess(pendingQuery.request));
      await query;
      await next;
      if (reason === "deleted")
        expect(
          client.state.items.some(
            (m) => m.publicLeadId === "lead-synthetic-001",
          ),
        ).toBe(false);
    },
  );

  it("records an expired rendered lead as unavailable without reviving its old version", async () => {
    const { client, service } = await ready();
    const query = client.changeQuery(queryWith(121.3));
    const read = client.readLeadForPicker("lead-synthetic-001", {
      allowRenderedLead: true,
    });
    const pending = service.details[0]!;
    const result = detailSuccess(pending.request);
    if (!result.ok) throw Error("fixture");
    pending.deferred.resolve({
      ...result,
      item: { ...result.item, publicUntil: new Date(1_000).toISOString() },
    });
    expect(await read).toBeNull();
    expect(client.isPublicLeadUnavailable("lead-synthetic-001")).toBe(true);
    service.viewport[1]!.deferred.resolve(
      viewportSuccess(service.viewport[1]!.request),
    );
    await query;
    expect(
      client.state.items.some((m) => m.publicLeadId === "lead-synthetic-001"),
    ).toBe(false);
  });

  it.each(["wrong-id", "old-version", "wrong-generation", "wrong-request"])(
    "rejects %s rather than showing another record's metadata",
    async (mode) => {
      const { client, service } = await ready();
      const pending = client.readLeadForPicker("lead-synthetic-001");
      const q = service.details[0]!;
      const result = detailSuccess(q.request);
      if (!result.ok) throw Error("fixture");
      q.deferred.resolve(
        mode === "service-error"
          ? serviceError(q.request, "SERVICE_UNAVAILABLE")
          : {
              ...result,
              requestId:
                mode === "wrong-request" ? "other-request" : result.requestId,
              generation:
                mode === "wrong-generation"
                  ? result.generation + 1
                  : result.generation,
              item: {
                ...result.item,
                publicLeadId:
                  mode === "wrong-id"
                    ? "another-lead"
                    : result.item.publicLeadId,
                servedVersion:
                  mode === "old-version" ? 0 : result.item.servedVersion,
              },
            },
      );
      expect(await pending).toBeNull();
      expect(client.state.detail.phase).toBe("IDLE");
    },
  );

  it.each(["SERVICE_UNAVAILABLE", "network"])(
    "retries %s only once for picker metadata",
    async (mode) => {
      const { client, service } = await ready();
      const read = service.detail.bind(service);
      const spy = vi.spyOn(service, "detail");
      spy.mockImplementationOnce((request) =>
        mode === "network"
          ? Promise.reject(Error("offline"))
          : Promise.resolve(serviceError(request, "SERVICE_UNAVAILABLE")),
      );
      spy.mockImplementation(read);
      const pending = client.readLeadForPicker("lead-synthetic-001");
      await vi.waitFor(() => expect(service.details).toHaveLength(1));
      service.details[0]!.deferred.resolve(
        detailSuccess(service.details[0]!.request),
      );
      expect((await pending)?.publicLeadId).toBe("lead-synthetic-001");
      expect(spy).toHaveBeenCalledTimes(2);
      expect(client.state.detail.phase).toBe("IDLE");
    },
  );

  it.each([
    "RATE_LIMITED",
    "UNAUTHORIZED",
    "LEAD_UNAVAILABLE",
    "SCHEMA_UNSUPPORTED",
    "SERVICE_UNAVAILABLE",
  ] as const)("bounds retries and respects %s", async (code) => {
    const { client, service } = await ready();
    const spy = vi
      .spyOn(service, "detail")
      .mockImplementation(async (request) => serviceError(request, code));
    expect(await client.readLeadForPicker("lead-synthetic-001")).toBeNull();
    expect(spy).toHaveBeenCalledTimes(code === "SERVICE_UNAVAILABLE" ? 2 : 1);
    if (code === "LEAD_UNAVAILABLE")
      expect(
        client.state.items.some(
          (item) => item.publicLeadId === "lead-synthetic-001",
        ),
      ).toBe(false);
  });

  it.each(["refresh", "hidden"])(
    "discards metadata after %s and never restores a removed lead",
    async (mode) => {
      const { client, service } = await ready();
      const pending = client.readLeadForPicker("lead-synthetic-001");
      const q = service.details[0]!;
      let refresh: Promise<void> | undefined;
      if (mode === "refresh") refresh = client.refresh();
      else
        client.suppressPublicLead("lead-synthetic-001", {
          noResurrection: true,
        });
      q.deferred.resolve(detailSuccess(q.request));
      expect(await pending).toBeNull();
      if (refresh) {
        service.viewport[1]!.deferred.resolve(
          viewportSuccess(service.viewport[1]!.request),
        );
        await refresh;
      } else
        expect(
          client.state.items.some(
            (m) => m.publicLeadId === "lead-synthetic-001",
          ),
        ).toBe(false);
    },
  );
});

describe("TASK-V2-14 public map client state", () => {
  it("loads the first public page successfully", async () => {
    const { client, service } = createControlledClient();
    const pending = client.loadInitial();
    expect(client.state.phase).toBe("INITIAL_LOADING");
    service.viewport[0]!.deferred.resolve(
      viewportSuccess(service.viewport[0]!.request),
    );
    await pending;
    expect(client.state.phase).toBe("LOADED");
    expect(client.state.items).toHaveLength(2);
  });

  it("keeps an empty result distinct from an error", async () => {
    const { client, service } = createControlledClient();
    const pending = client.loadInitial();
    service.viewport[0]!.deferred.resolve(
      viewportSuccess(service.viewport[0]!.request, [], null),
    );
    await pending;
    expect(client.state).toMatchObject({ phase: "EMPTY", error: null });
  });

  it("maps an initial invalid request to INITIAL_ERROR", async () => {
    const { client, service } = createControlledClient();
    const pending = client.loadInitial();
    service.viewport[0]!.deferred.resolve(
      serviceError(service.viewport[0]!.request, "INVALID_REQUEST"),
    );
    await pending;
    expect(client.state.phase).toBe("INITIAL_ERROR");
  });

  it("uses latest-generation-wins for A/B/C out-of-order responses", async () => {
    const { client, service } = createControlledClient();
    const a = client.changeQuery(queryWith(121.1));
    const b = client.changeQuery(queryWith(121.2));
    const c = client.changeQuery(queryWith(121.3));
    service.viewport[2]!.deferred.resolve(
      viewportSuccess(
        service.viewport[2]!.request,
        [SYNTHETIC_PUBLIC_MARKERS[2]!],
        null,
      ),
    );
    service.viewport[0]!.deferred.resolve(
      viewportSuccess(
        service.viewport[0]!.request,
        [SYNTHETIC_PUBLIC_MARKERS[0]!],
        null,
      ),
    );
    service.viewport[1]!.deferred.resolve(
      viewportSuccess(
        service.viewport[1]!.request,
        [SYNTHETIC_PUBLIC_MARKERS[1]!],
        null,
      ),
    );
    await Promise.all([a, b, c]);
    expect(client.state.query.bbox.west).toBe(121.3);
    expect(client.state.items.map((item) => item.publicLeadId)).toEqual([
      "lead-synthetic-003",
    ]);
  });

  it("increments generation and invalidates the prior filter request", async () => {
    const { client, service } = createControlledClient();
    const first = client.changeQuery(queryWith(121.1, ["GRAND_PRIZE_REMAINS"]));
    const second = client.changeQuery(queryWith(121.1, ["LOW_OPPORTUNITY"]));
    expect(service.viewport[1]!.request.generation).toBeGreaterThan(
      service.viewport[0]!.request.generation,
    );
    service.viewport[1]!.deferred.resolve(
      viewportSuccess(
        service.viewport[1]!.request,
        [SYNTHETIC_PUBLIC_MARKERS[2]!],
        null,
      ),
    );
    service.viewport[0]!.deferred.resolve(
      viewportSuccess(
        service.viewport[0]!.request,
        [SYNTHETIC_PUBLIC_MARKERS[0]!],
        null,
      ),
    );
    await Promise.all([first, second]);
    expect(client.state.query.opportunityStatuses).toEqual(["LOW_OPPORTUNITY"]);
  });

  it("canonicalizes query identity independent of filter order and float noise", () => {
    const left: PublicMapQuery = {
      ...queryWith(121.1234564, ["LOW_OPPORTUNITY", "GRAND_PRIZE_REMAINS"]),
      supportedSchemaVersions: ["z", "public-map-v3"],
    };
    const right: PublicMapQuery = {
      ...queryWith(121.12345639, ["GRAND_PRIZE_REMAINS", "LOW_OPPORTUNITY"]),
      supportedSchemaVersions: ["public-map-v3", "z"],
    };
    expect(createPublicMapQueryIdentity(left)).toBe(
      createPublicMapQueryIdentity(right),
    );
  });

  it("never reuses a cursor across query identities", async () => {
    const { client, service } = createControlledClient();
    const first = client.loadInitial();
    service.viewport[0]!.deferred.resolve(
      viewportSuccess(service.viewport[0]!.request),
    );
    await first;
    const second = client.changeQuery(queryWith(121.2));
    expect(service.viewport[1]!.request.cursor).toBeNull();
    expect(service.viewport[1]!.request.asOf).toBeNull();
    service.viewport[1]!.deferred.resolve(
      viewportSuccess(service.viewport[1]!.request, [], null),
    );
    await second;
  });

  it("uses a non-blocking phase while a new viewport query is pending", async () => {
    const { client, service } = createControlledClient();
    const first = client.loadInitial();
    expect(client.state.phase).toBe("INITIAL_LOADING");
    service.viewport[0]!.deferred.resolve(
      viewportSuccess(service.viewport[0]!.request),
    );
    await first;

    const viewportRefresh = client.changeQuery(queryWith(121.2));
    expect(client.state.phase).toBe("VIEWPORT_REFRESHING");
    expect(client.state.phase).not.toBe("INITIAL_LOADING");
    expect(client.state.items).toEqual([]);

    service.viewport[1]!.deferred.resolve(
      viewportSuccess(
        service.viewport[1]!.request,
        [SYNTHETIC_PUBLIC_MARKERS[2]!],
        null,
      ),
    );
    await viewportRefresh;
    expect(client.state.phase).toBe("LOADED");
    expect(client.state.items.map((item) => item.publicLeadId)).toEqual([
      "lead-synthetic-003",
    ]);
  });

  it.each(["CURSOR_INVALID", "CURSOR_EXPIRED"] as const)(
    "recovers %s through a fresh first-page request",
    async (code) => {
      const { client, service } = createControlledClient();
      const phases: PublicMapClientState["phase"][] = [];
      client.subscribe((state) => phases.push(state.phase));
      const first = client.loadInitial();
      service.viewport[0]!.deferred.resolve(
        viewportSuccess(service.viewport[0]!.request),
      );
      await first;
      const page = client.loadNextPage();
      service.viewport[1]!.deferred.resolve(
        serviceError(service.viewport[1]!.request, code),
      );
      await Promise.resolve();
      await Promise.resolve();
      expect(service.viewport[2]!.request.cursor).toBeNull();
      service.viewport[2]!.deferred.resolve(
        viewportSuccess(
          service.viewport[2]!.request,
          [SYNTHETIC_PUBLIC_MARKERS[2]!],
          null,
        ),
      );
      await page;
      expect(phases).toContain("CURSOR_RECOVERY");
      expect(client.state.items[0]!.publicLeadId).toBe("lead-synthetic-003");
    },
  );

  it("appends a successful next page without duplicating publicLeadId", async () => {
    const { client, service } = createControlledClient();
    const first = client.loadInitial();
    service.viewport[0]!.deferred.resolve(
      viewportSuccess(service.viewport[0]!.request),
    );
    await first;
    const page = client.loadNextPage();
    service.viewport[1]!.deferred.resolve(
      viewportSuccess(
        service.viewport[1]!.request,
        [SYNTHETIC_PUBLIC_MARKERS[1]!, SYNTHETIC_PUBLIC_MARKERS[2]!],
        null,
      ),
    );
    await page;
    expect(client.state.items).toHaveLength(3);
  });

  it("keeps the server truncation signal through pagination and public cache", async () => {
    const { client, service, cache } = createControlledClient();
    const first = client.loadInitial();
    const root = viewportSuccess(service.viewport[0]!.request);
    if (!root.ok) throw new Error("expected successful root fixture");
    service.viewport[0]!.deferred.resolve({ ...root, truncated: true });
    await first;
    expect(client.state.truncated).toBe(true);
    expect(client.state.nextCursor).not.toBeNull();

    const page = client.loadNextPage();
    const last = viewportSuccess(
      service.viewport[1]!.request,
      [SYNTHETIC_PUBLIC_MARKERS[2]!],
      null,
    );
    if (!last.ok) throw new Error("expected successful page fixture");
    service.viewport[1]!.deferred.resolve({ ...last, truncated: true });
    await page;
    expect(client.state.nextCursor).toBeNull();
    expect(client.state.truncated).toBe(true);
    expect(
      cache.readSnapshot(client.state.queryIdentity, 1_000)?.truncated,
    ).toBe(true);
  });

  it("retains loaded data when pagination fails", async () => {
    const { client, service } = createControlledClient();
    const first = client.loadInitial();
    service.viewport[0]!.deferred.resolve(
      viewportSuccess(service.viewport[0]!.request),
    );
    await first;
    const page = client.loadNextPage();
    service.viewport[1]!.deferred.resolve(
      serviceError(service.viewport[1]!.request, "SERVICE_UNAVAILABLE"),
    );
    await page;
    expect(client.state.phase).toBe("PAGINATION_ERROR");
    expect(client.state.items).toHaveLength(2);
    expect(client.state.error?.retainsData).toBe(true);
  });

  it("retries pagination with the same opaque cursor and a new request id", async () => {
    const { client, service } = createControlledClient();
    const first = client.loadInitial();
    service.viewport[0]!.deferred.resolve(
      viewportSuccess(service.viewport[0]!.request),
    );
    await first;
    const failed = client.loadNextPage();
    service.viewport[1]!.deferred.resolve(
      serviceError(service.viewport[1]!.request, "SERVICE_UNAVAILABLE"),
    );
    await failed;
    const retried = client.retryPagination();
    expect(service.viewport[2]!.request.cursor).toBe("opaque:cursor:page-2");
    expect(service.viewport[2]!.request.requestId).not.toBe(
      service.viewport[1]!.request.requestId,
    );
    service.viewport[2]!.deferred.resolve(
      viewportSuccess(
        service.viewport[2]!.request,
        [SYNTHETIC_PUBLIC_MARKERS[2]!],
        null,
      ),
    );
    await retried;
    expect(client.state.phase).toBe("LOADED");
  });

  it("refreshes without clearing visible data and replaces it on success", async () => {
    const { client, service } = createControlledClient();
    const first = client.loadInitial();
    service.viewport[0]!.deferred.resolve(
      viewportSuccess(service.viewport[0]!.request),
    );
    await first;
    const refresh = client.refresh();
    expect(client.state).toMatchObject({ phase: "REFRESHING" });
    expect(client.state.items).toHaveLength(2);
    expect(service.viewport[1]!.request.cursor).toBeNull();
    service.viewport[1]!.deferred.resolve(
      viewportSuccess(
        service.viewport[1]!.request,
        [SYNTHETIC_PUBLIC_MARKERS[2]!],
        null,
      ),
    );
    await refresh;
    expect(client.state.items[0]!.publicLeadId).toBe("lead-synthetic-003");
  });

  it("deduplicates repeated explicit refresh while the root request is active", async () => {
    const { client, service } = createControlledClient();
    const first = client.loadInitial();
    service.viewport[0]!.deferred.resolve(
      viewportSuccess(service.viewport[0]!.request),
    );
    await first;
    const refresh = client.refresh();
    await client.refresh();
    expect(service.viewport).toHaveLength(2);
    service.viewport[1]!.deferred.resolve(
      viewportSuccess(service.viewport[1]!.request, [], null),
    );
    await refresh;
  });

  it("retains visible data and marks it stale when refresh fails", async () => {
    const { client, service } = createControlledClient();
    const first = client.loadInitial();
    service.viewport[0]!.deferred.resolve(
      viewportSuccess(service.viewport[0]!.request),
    );
    await first;
    const refresh = client.refresh();
    service.viewport[1]!.deferred.resolve(
      serviceError(service.viewport[1]!.request, "SERVICE_UNAVAILABLE"),
    );
    await refresh;
    expect(client.state).toMatchObject({
      phase: "STALE_CACHE",
      clientCacheStale: true,
    });
    expect(client.state.items).toHaveLength(2);
  });

  it("hydrates a stale same-query cache without exposing its expired cursor", async () => {
    const service = new ControlledPublicMapService();
    const cache = new PublicMapMemoryCache(10);
    const query = createDefaultPublicMapQuery();
    cache.writeSnapshot({
      queryIdentity: createPublicMapQueryIdentity(query),
      schemaVersion: PUBLIC_MAP_SCHEMA_VERSION,
      asOf: "cached-server-as-of",
      items: [SYNTHETIC_PUBLIC_MARKERS[0]!],
      nextCursor: "expired-cursor",
      cachedAtMs: 1,
    });
    const client = new PublicMapClient({
      service,
      cache,
      initialQuery: query,
      now: () => 20,
    });
    const pending = client.loadInitial();
    expect(client.state).toMatchObject({
      phase: "STALE_CACHE",
      clientCacheStale: true,
      nextCursor: null,
    });
    expect(client.state.items).toHaveLength(1);
    service.viewport[0]!.deferred.resolve(
      viewportSuccess(service.viewport[0]!.request, [], null),
    );
    await pending;
    expect(client.state.phase).toBe("EMPTY");
  });

  it.each([
    ["SERVICE_UNAVAILABLE", "SERVICE_UNAVAILABLE"],
    ["RATE_LIMITED", "RATE_LIMITED"],
    ["SCHEMA_UNSUPPORTED", "SCHEMA_UNSUPPORTED"],
  ] as const)("keeps %s distinct from EMPTY", async (code, phase) => {
    const { client, service } = createControlledClient();
    const pending = client.loadInitial();
    service.viewport[0]!.deferred.resolve(
      serviceError(service.viewport[0]!.request, code),
    );
    await pending;
    expect(client.state.phase).toBe(phase);
    expect(client.state.phase).not.toBe("EMPTY");
  });

  it("recovers silent Account identity without anonymous fallback", async () => {
    const { client, service } = createControlledClient();
    const first = client.loadInitial();
    service.viewport[0]!.deferred.resolve(
      serviceError(service.viewport[0]!.request, "UNAUTHORIZED"),
    );
    await first;
    expect(client.state.error?.recovery).toBe("RECOVER_IDENTITY");
    const recovery = client.recoverIdentity();
    expect(service.viewport[1]!.request).not.toHaveProperty("anonymous");
    service.viewport[1]!.deferred.resolve(
      viewportSuccess(service.viewport[1]!.request, [], null),
    );
    await recovery;
    expect(client.state.phase).toBe("EMPTY");
  });

  it("sanitizes runtime extras before writing public cache", () => {
    const cache = new PublicMapMemoryCache();
    const unsafe = {
      ...SYNTHETIC_PUBLIC_MARKERS[0]!,
      ownerAccountId: "private-owner",
      avatarFileId: "cloud://private/avatar.jpg",
    } as unknown as PublicMarker;
    cache.writeSnapshot({
      queryIdentity: "query-a",
      schemaVersion: PUBLIC_MAP_SCHEMA_VERSION,
      asOf: unsafe.asOf,
      items: [unsafe],
      nextCursor: null,
      cachedAtMs: 1,
    });
    const stored = cache.readSnapshot("query-a", 2);
    expect(stored).not.toBeNull();
    expect(JSON.stringify(stored)).not.toContain("private-owner");
    expect(containsForbiddenPrivateMapField(stored)).toBe(false);
  });

  it("namespaces cache entries by canonical query identity", () => {
    const cache = new PublicMapMemoryCache();
    cache.writeSnapshot({
      queryIdentity: "query-a",
      schemaVersion: PUBLIC_MAP_SCHEMA_VERSION,
      asOf: "a",
      items: [SYNTHETIC_PUBLIC_MARKERS[0]!],
      nextCursor: "cursor-a",
      cachedAtMs: 1,
    });
    expect(cache.readSnapshot("query-b", 2)).toBeNull();
    expect(cache.readSnapshot("query-a", 2)?.nextCursor).toBe("cursor-a");
  });

  it("expires the client cursor while preserving server Freshness facts", () => {
    const cache = new PublicMapMemoryCache(10);
    cache.writeSnapshot({
      queryIdentity: "query-a",
      schemaVersion: PUBLIC_MAP_SCHEMA_VERSION,
      asOf: "server-as-of",
      items: [SYNTHETIC_PUBLIC_MARKERS[0]!],
      nextCursor: "opaque",
      cachedAtMs: 1,
    });
    const stale = cache.readSnapshot("query-a", 11)!;
    expect(stale).toMatchObject({ stale: true, nextCursor: null });
    expect(stale.items[0]!.freshness.band).toBe("RECENT");
    expect(stale.items[0]!.freshness.freshnessAsOf).toBe(
      SYNTHETIC_PUBLIC_MARKERS[0]!.freshness.freshnessAsOf,
    );
  });

  it("uses latest-selection-wins for Marker A/B detail responses", async () => {
    const { client, service } = createControlledClient();
    const a = client.selectLead("lead-synthetic-001");
    const b = client.selectLead("lead-synthetic-002");
    service.details[1]!.deferred.resolve(
      detailSuccess(service.details[1]!.request, SYNTHETIC_PUBLIC_MARKERS[1]!),
    );
    service.details[0]!.deferred.resolve(
      detailSuccess(service.details[0]!.request, SYNTHETIC_PUBLIC_MARKERS[0]!),
    );
    await Promise.all([a, b]);
    expect(client.state.detail.item?.publicLeadId).toBe("lead-synthetic-002");
  });

  it("keeps the active detail selection across a viewport query refresh", async () => {
    const { client, service } = createControlledClient();
    const detail = client.selectLead("lead-synthetic-002");
    const selectionGeneration = client.state.detail.selectionGeneration;
    const viewportRefresh = client.changeQuery(queryWith(121.2));

    expect(client.state).toMatchObject({
      phase: "VIEWPORT_REFRESHING",
      detail: {
        phase: "LOADING",
        selectedPublicLeadId: "lead-synthetic-002",
        selectionGeneration,
      },
    });

    service.details[0]!.deferred.resolve(
      detailSuccess(service.details[0]!.request, SYNTHETIC_PUBLIC_MARKERS[1]!),
    );
    await detail;
    expect(client.state.detail).toMatchObject({
      phase: "LOADED",
      selectedPublicLeadId: "lead-synthetic-002",
      selectionGeneration,
    });

    service.viewport[0]!.deferred.resolve(
      viewportSuccess(
        service.viewport[0]!.request,
        [SYNTHETIC_PUBLIC_MARKERS[1]!],
        null,
      ),
    );
    await viewportRefresh;
    expect(client.state.detail).toMatchObject({
      phase: "LOADED",
      selectedPublicLeadId: "lead-synthetic-002",
      selectionGeneration,
    });
    expect(client.state.detail.item?.publicLeadId).toBe("lead-synthetic-002");
  });

  it("invalidates unavailable detail and removes its marker", async () => {
    const { client, service } = createControlledClient();
    const first = client.loadInitial();
    service.viewport[0]!.deferred.resolve(
      viewportSuccess(service.viewport[0]!.request),
    );
    await first;
    const detail = client.selectLead("lead-synthetic-001");
    service.details[0]!.deferred.resolve(
      serviceError(service.details[0]!.request, "LEAD_UNAVAILABLE"),
    );
    await detail;
    expect(client.state.detail.phase).toBe("UNAVAILABLE");
    expect(client.state.detail.selectedPublicLeadId).toBeNull();
    expect(client.state.items.map((item) => item.publicLeadId)).not.toContain(
      "lead-synthetic-001",
    );
  });

  it("does not resurrect an unavailable lead from a late root response", async () => {
    const { client, service } = createControlledClient();
    const first = client.loadInitial();
    service.viewport[0]!.deferred.resolve(
      viewportSuccess(service.viewport[0]!.request),
    );
    await first;

    const refresh = client.refresh();
    const detail = client.selectLead("lead-synthetic-001");
    service.details[0]!.deferred.resolve(
      serviceError(service.details[0]!.request, "LEAD_UNAVAILABLE"),
    );
    await detail;
    service.viewport[1]!.deferred.resolve(
      viewportSuccess(
        service.viewport[1]!.request,
        [SYNTHETIC_PUBLIC_MARKERS[0]!],
        null,
      ),
    );
    await refresh;
    expect(client.state.items).toHaveLength(0);
  });

  it("discards a stale root response after query change", async () => {
    const { client, service } = createControlledClient();
    const stale = client.loadInitial();
    const current = client.changeQuery(queryWith(121.4));
    service.viewport[1]!.deferred.resolve(
      viewportSuccess(
        service.viewport[1]!.request,
        [SYNTHETIC_PUBLIC_MARKERS[2]!],
        null,
      ),
    );
    service.viewport[0]!.deferred.resolve(
      viewportSuccess(
        service.viewport[0]!.request,
        [SYNTHETIC_PUBLIC_MARKERS[0]!],
        null,
      ),
    );
    await Promise.all([stale, current]);
    expect(client.state.items[0]!.publicLeadId).toBe("lead-synthetic-003");
  });

  it("does not mutate, parse, or embed an opaque cursor into query identity", async () => {
    const { client, service } = createControlledClient();
    const first = client.loadInitial();
    service.viewport[0]!.deferred.resolve(
      viewportSuccess(
        service.viewport[0]!.request,
        SYNTHETIC_PUBLIC_MARKERS.slice(0, 2),
        "opaque.A/B+==",
      ),
    );
    await first;
    const identity = client.state.queryIdentity;
    const page = client.loadNextPage();
    expect(service.viewport[1]!.request.cursor).toBe("opaque.A/B+==");
    expect(client.state.queryIdentity).toBe(identity);
    expect(identity).not.toContain("opaque.A/B+==");
    service.viewport[1]!.deferred.resolve(
      viewportSuccess(service.viewport[1]!.request, [], null),
    );
    await page;
  });

  it("prevents duplicate concurrent pagination requests", async () => {
    const { client, service } = createControlledClient();
    const first = client.loadInitial();
    service.viewport[0]!.deferred.resolve(
      viewportSuccess(service.viewport[0]!.request),
    );
    await first;
    const page = client.loadNextPage();
    await client.loadNextPage();
    expect(service.viewport).toHaveLength(2);
    service.viewport[1]!.deferred.resolve(
      viewportSuccess(service.viewport[1]!.request, [], null),
    );
    await page;
  });

  it("maps all stable errors to visible feedback and recovery", () => {
    const codes: readonly PublicMapErrorCode[] = [
      "INVALID_REQUEST",
      "INVALID_VIEWPORT",
      "UNAUTHORIZED",
      "RATE_LIMITED",
      "CURSOR_INVALID",
      "CURSOR_EXPIRED",
      "LEAD_UNAVAILABLE",
      "SCHEMA_UNSUPPORTED",
      "SERVICE_UNAVAILABLE",
    ];
    for (const code of codes) {
      const mapped = mapPublicMapError(
        serviceError({ requestId: "r", generation: 1 }, code),
        code === "LEAD_UNAVAILABLE" ? "DETAIL" : "INITIAL",
        false,
      );
      expect(mapped.message.length).toBeGreaterThan(0);
      expect(mapped.code).toBe(code);
    }
  });

  it("works end-to-end with the deterministic local synthetic adapter", async () => {
    const client = new PublicMapClient({
      service: new SyntheticPublicMapService(),
      initialQuery: createDefaultPublicMapQuery(),
      pageLimit: 2,
    });
    await client.loadInitial();
    expect(client.state.items).toHaveLength(2);
    await client.loadNextPage();
    expect(client.state.items).toHaveLength(4);
    await client.selectLead("lead-synthetic-003");
    expect(client.state.detail.phase).toBe("LOADED");
  });

  it("prevents a deleted lead from resurrecting through a stale root response", async () => {
    const { client, service, cache } = createControlledClient();
    const pending = client.loadInitial();
    client.suppressPublicLead("lead-synthetic-001", {
      noResurrection: true,
    });
    service.viewport[0]!.deferred.resolve(
      viewportSuccess(service.viewport[0]!.request),
    );
    await pending;
    expect(client.isDeletedPublicLead("lead-synthetic-001")).toBe(true);
    expect(client.state.items.map((item) => item.publicLeadId)).not.toContain(
      "lead-synthetic-001",
    );
    expect(
      cache
        .readSnapshot(client.state.queryIdentity, 1_000)!
        .items.map((item) => item.publicLeadId),
    ).not.toContain("lead-synthetic-001");
  });

  it("prevents a deleted lead from resurrecting through stale pagination", async () => {
    const { client, service } = createControlledClient();
    const root = client.loadInitial();
    service.viewport[0]!.deferred.resolve(
      viewportSuccess(service.viewport[0]!.request),
    );
    await root;
    const page = client.loadNextPage();
    client.suppressPublicLead("lead-synthetic-003", {
      noResurrection: true,
    });
    service.viewport[1]!.deferred.resolve(
      viewportSuccess(
        service.viewport[1]!.request,
        [SYNTHETIC_PUBLIC_MARKERS[2]!],
        null,
      ),
    );
    await page;
    expect(client.state.phase).toBe("LOADED");
    expect(client.state.nextCursor).toBeNull();
    expect(client.state.items.map((item) => item.publicLeadId)).not.toContain(
      "lead-synthetic-003",
    );
  });

  it("prevents a late detail response from reopening a deleted lead", async () => {
    const { client, service, cache } = createControlledClient();
    const root = client.loadInitial();
    service.viewport[0]!.deferred.resolve(
      viewportSuccess(service.viewport[0]!.request),
    );
    await root;
    const detail = client.selectLead("lead-synthetic-001");
    client.suppressPublicLead("lead-synthetic-001", {
      noResurrection: true,
    });
    service.details[0]!.deferred.resolve(
      detailSuccess(service.details[0]!.request),
    );
    await detail;
    expect(client.state.detail.phase).toBe("UNAVAILABLE");
    expect(client.state.detail.item).toBeNull();
    expect(cache.readDetail("lead-synthetic-001")).toBeNull();
  });
});

describe("TASK21 detail request reduction", () => {
  it("coalesces repeated selection while loading, but revalidates after dismissal", async () => {
    const { client, service } = createControlledClient();
    const id = SYNTHETIC_PUBLIC_MARKERS[0]!.publicLeadId;
    const first = client.selectLead(id);
    const repeat = client.selectLead(id);
    expect(service.details).toHaveLength(1);
    expect(first).toBe(repeat);
    client.clearSelection();
    const reselected = client.selectLead(id);
    expect(service.details).toHaveLength(2);
    service.details[0]!.deferred.resolve(
      detailSuccess(service.details[0]!.request),
    );
    await first;
    expect(client.state.detail.phase).toBe("LOADING");
    service.details[1]!.deferred.resolve(
      detailSuccess(service.details[1]!.request),
    );
    await reselected;
    expect(client.state.detail.phase).toBe("LOADED");
  });
  it("suppression wins over the coalesced response", async () => {
    const { client, service } = createControlledClient();
    const id = SYNTHETIC_PUBLIC_MARKERS[0]!.publicLeadId;
    const pending = client.selectLead(id);
    client.suppressPublicLead(id, { noResurrection: true });
    service.details[0]!.deferred.resolve(
      detailSuccess(service.details[0]!.request),
    );
    await pending;
    expect(client.state.detail.phase).toBe("UNAVAILABLE");
    expect(client.state.detail.item).toBeNull();
  });
});

describe("TASK22 bounded ready detail reuse", () => {
  const ready = async (now = () => 1_000) => {
    const env = createControlledClient(now);
    const initial = env.client.loadInitial();
    env.service.viewport[0]!.deferred.resolve(
      viewportSuccess(env.service.viewport[0]!.request),
    );
    await initial;
    return env;
  };
  const prepare = async (
    env: Awaited<ReturnType<typeof ready>>,
    id = "lead-synthetic-001",
  ) => {
    const pending = env.client.readLeadForPicker(id);
    const read = env.service.details.at(-1)!;
    const marker = env.client.state.items.find((m) => m.publicLeadId === id)!;
    read.deferred.resolve(detailSuccess(read.request, marker));
    await pending;
  };

  it("immediately shows the already read full detail, while revalidating on selection", async () => {
    const env = await ready();
    await prepare(env);
    const selected = env.client.selectLead("lead-synthetic-001");
    expect(env.client.state.detail).toMatchObject({
      phase: "LOADED",
      item: {
        publicLeadId: "lead-synthetic-001",
        board: { pricePerDrawMinor: 650 },
      },
    });
    expect(env.service.details).toHaveLength(2);
    const fresh = detailSuccess(env.service.details[1]!.request);
    if (!fresh.ok) throw Error("fixture");
    env.service.details[1]!.deferred.resolve({
      ...fresh,
      item: {
        ...fresh.item,
        venueNote: "更新备注",
        board: { ...fresh.item.board, totalRemaining: 7 },
      },
    });
    await selected;
    expect(env.client.state.detail.item).toMatchObject({
      venueNote: "更新备注",
      board: { totalRemaining: 7 },
    });
  });

  it("joins an in-flight picker detail and never sends a second same-ID RPC", async () => {
    const env = await ready();
    const metadata = env.client.readLeadForPicker("lead-synthetic-001");
    const selected = env.client.selectLead("lead-synthetic-001");
    expect(env.service.details).toHaveLength(1);
    const read = env.service.details[0]!;
    read.deferred.resolve(detailSuccess(read.request));
    await Promise.all([metadata, selected]);
    expect(env.service.details).toHaveLength(1);
    expect(env.client.state.detail.item?.publicLeadId).toBe(
      "lead-synthetic-001",
    );
  });

  it("prepares at most two visible IDs and coalesces repeated preparation", async () => {
    const env = await ready();
    const first = env.client.prefetchVisibleDetails([
      "lead-synthetic-001",
      "lead-synthetic-002",
      "lead-synthetic-003",
    ]);
    const repeat = env.client.prefetchVisibleDetails([
      "lead-synthetic-001",
      "lead-synthetic-002",
    ]);
    expect(env.service.details).toHaveLength(2);
    expect(env.client.state.detail.phase).toBe("IDLE");
    for (const read of env.service.details)
      read.deferred.resolve(
        detailSuccess(
          read.request,
          env.client.state.items.find(
            (m) => m.publicLeadId === read.request.publicLeadId,
          )!,
        ),
      );
    await Promise.all([first, repeat]);
    await env.client.prefetchVisibleDetails([
      "lead-synthetic-001",
      "lead-synthetic-002",
    ]);
    expect(env.service.details).toHaveLength(2);
    expect(env.client.state.detail.phase).toBe("IDLE");
  });

  it("makes a manual refresh fetch again instead of returning a prepared value", async () => {
    const env = await ready();
    await prepare(env);
    expect(
      await env.client.readLeadForPicker("lead-synthetic-001"),
    ).not.toBeNull();
    expect(env.service.details).toHaveLength(1);
    const forced = env.client.readLeadForPicker("lead-synthetic-001", {
      forceRefresh: true,
    });
    expect(env.service.details).toHaveLength(2);
    env.service.details[1]!.deferred.resolve(
      detailSuccess(env.service.details[1]!.request),
    );
    await forced;
  });

  it.each(["expired", "clock-backwards"])(
    "rejects a %s preparation",
    async (mode) => {
      let now = 1000;
      const env = await ready(() => now);
      await prepare(env);
      now =
        mode === "expired" ? now + PUBLIC_MAP_PREPARED_DETAIL_TTL_MS : now - 1;
      const selected = env.client.selectLead("lead-synthetic-001");
      expect(env.client.state.detail).toMatchObject({
        phase: "LOADING",
        item: null,
      });
      env.service.details[1]!.deferred.resolve(
        detailSuccess(env.service.details[1]!.request),
      );
      await selected;
    },
  );

  it("invalidates preparation on root refresh without interrupting an active selected read", async () => {
    const env = await ready();
    await prepare(env);
    const refresh = env.client.refresh();
    env.service.viewport[1]!.deferred.resolve(
      viewportSuccess(env.service.viewport[1]!.request),
    );
    await refresh;
    const selected = env.client.selectLead("lead-synthetic-001");
    expect(env.client.state.detail.phase).toBe("LOADING");
    env.service.details[1]!.deferred.resolve(
      detailSuccess(env.service.details[1]!.request),
    );
    await selected;
  });

  it("does not publish or reuse a prepared response after background invalidation", async () => {
    const env = await ready();
    const pending = env.client.readLeadForPicker("lead-synthetic-001");
    const selected = env.client.selectLead("lead-synthetic-001");
    env.client.invalidatePreparedDetails();
    env.client.clearSelection();
    env.service.details[0]!.deferred.resolve(
      detailSuccess(env.service.details[0]!.request),
    );
    expect(await pending).toBeNull();
    await selected;
    expect(env.service.details).toHaveLength(1);
    expect(env.client.state.detail.phase).toBe("IDLE");
    const next = env.client.selectLead("lead-synthetic-001");
    expect(env.client.state.detail.phase).toBe("LOADING");
    env.service.details[1]!.deferred.resolve(
      detailSuccess(env.service.details[1]!.request),
    );
    await next;
  });

  it("removes an immediate prepared card when server revalidation says unavailable", async () => {
    const env = await ready();
    await prepare(env);
    const selected = env.client.selectLead("lead-synthetic-001");
    expect(env.client.state.detail.phase).toBe("LOADED");
    env.service.details[1]!.deferred.resolve(
      serviceError(env.service.details[1]!.request, "LEAD_UNAVAILABLE"),
    );
    await selected;
    expect(env.client.state.detail).toMatchObject({
      phase: "UNAVAILABLE",
      item: null,
    });
    expect(
      env.client.state.items.some(
        (m) => m.publicLeadId === "lead-synthetic-001",
      ),
    ).toBe(false);
  });

  it.each([
    "SERVICE_UNAVAILABLE",
    "UNAUTHORIZED",
    "SCHEMA_UNSUPPORTED",
  ] as const)(
    "clears prepared content after revalidation returns %s",
    async (code) => {
      const env = await ready();
      await prepare(env);
      const selected = env.client.selectLead("lead-synthetic-001");
      env.service.details[1]!.deferred.resolve(
        serviceError(env.service.details[1]!.request, code),
      );
      await selected;
      expect(env.client.state.detail).toMatchObject({
        phase: "ERROR",
        item: null,
      });
      const next = env.client.selectLead("lead-synthetic-001");
      expect(env.client.state.detail.phase).toBe("LOADING");
      env.service.details[2]!.deferred.resolve(
        detailSuccess(env.service.details[2]!.request),
      );
      await next;
    },
  );

  it("does not switch back to an older selected ID when background revalidation resolves late", async () => {
    const env = await ready();
    await prepare(env);
    await prepare(env, "lead-synthetic-002");
    const a = env.client.selectLead("lead-synthetic-001");
    const b = env.client.selectLead("lead-synthetic-002");
    expect(env.client.state.detail.item?.publicLeadId).toBe(
      "lead-synthetic-002",
    );
    env.service.details[2]!.deferred.resolve(
      detailSuccess(env.service.details[2]!.request),
    );
    env.service.details[3]!.deferred.resolve(
      detailSuccess(
        env.service.details[3]!.request,
        SYNTHETIC_PUBLIC_MARKERS[1]!,
      ),
    );
    await Promise.all([a, b]);
    expect(env.client.state.detail.item?.publicLeadId).toBe(
      "lead-synthetic-002",
    );
  });

  it("evicts the oldest preparation once the 16-item bound is reached", async () => {
    const env = createControlledClient();
    const markers = Array.from(
      { length: PUBLIC_MAP_PREPARED_DETAIL_LIMIT + 1 },
      (_, i) => ({
        ...SYNTHETIC_PUBLIC_MARKERS[0]!,
        publicLeadId: `prepared-${i}`,
      }),
    );
    const root = env.client.loadInitial();
    env.service.viewport[0]!.deferred.resolve(
      viewportSuccess(env.service.viewport[0]!.request, markers),
    );
    await root;
    for (const marker of markers) await prepare(env, marker.publicLeadId);
    const selected = env.client.selectLead(markers[0]!.publicLeadId);
    expect(env.client.state.detail).toMatchObject({
      phase: "LOADING",
      item: null,
    });
    const last = env.service.details.at(-1)!;
    last.deferred.resolve(detailSuccess(last.request, markers[0]!));
    await selected;
  });

  it.each([
    "policy",
    "projection",
    "servedVersion",
    "requestId",
    "generation",
    "publicLeadId",
  ])("rejects a mismatched %s response in the selected card", async (mode) => {
    const env = await ready();
    const pending = env.client.selectLead("lead-synthetic-001"),
      q = env.service.details[0]!;
    const result = detailSuccess(q.request);
    if (!result.ok) throw Error("fixture");
    q.deferred.resolve({
      ...result,
      requestId: mode === "requestId" ? "wrong" : result.requestId,
      generation:
        mode === "generation" ? result.generation + 1 : result.generation,
      item: {
        ...result.item,
        policyVersion:
          mode === "policy" ? "old-policy" : result.item.policyVersion,
        projectionVersion:
          mode === "projection"
            ? "old-projection"
            : result.item.projectionVersion,
        servedVersion: mode === "servedVersion" ? 0 : result.item.servedVersion,
        publicLeadId:
          mode === "publicLeadId" ? "other" : result.item.publicLeadId,
      },
    });
    await pending;
    expect(env.client.state.detail).toMatchObject({
      phase: "ERROR",
      item: null,
    });
  });
});

describe("TASK22 query-provided complete details", () => {
  it("stages first-page details before listeners can start a duplicate prefetch", async () => {
    const { client, service } = createControlledClient();
    client.subscribe((state) => {
      if (state.phase === "LOADED")
        void client.prefetchVisibleDetails(
          state.items.map((m) => m.publicLeadId),
        );
    });
    const initial = client.loadInitial(),
      request = service.viewport[0]!.request;
    const details = SYNTHETIC_PUBLIC_MARKERS.slice(0, 2)
      .map((marker) =>
        detailSuccess(
          {
            publicLeadId: marker.publicLeadId,
            requestId: request.requestId,
            generation: request.generation,
            supportedSchemaVersions: request.supportedSchemaVersions,
          },
          marker,
        ),
      )
      .map((result) => {
        if (!result.ok) throw Error("fixture");
        return result.item;
      });
    service.viewport[0]!.deferred.resolve({
      ...viewportSuccess(request),
      preparedDetails: details,
    });
    await initial;
    expect(service.details).toHaveLength(0);
    const selected = client.selectLead(details[0]!.publicLeadId);
    expect(client.state.detail).toMatchObject({
      phase: "LOADED",
      item: { publicLeadId: details[0]!.publicLeadId },
    });
    expect(service.details).toHaveLength(1);
    service.details[0]!.deferred.resolve(
      detailSuccess(service.details[0]!.request),
    );
    await selected;
  });
});
