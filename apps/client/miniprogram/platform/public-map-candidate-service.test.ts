import { describe, expect, it, vi } from "vitest";

import { PUBLIC_MAP_SCHEMA_VERSION } from "./public-map-contract.js";
import {
  CandidatePublicMapService,
  type CandidateCloudApi,
} from "./public-map-candidate-service.js";
import {
  createDefaultPublicMapQuery,
  createPublicViewportRequest,
} from "./public-map-query.js";

const request = createPublicViewportRequest({
  query: createDefaultPublicMapQuery(),
  limit: 50,
  cursor: null,
  asOf: null,
  requestId: "candidate-query-1",
  generation: 1,
});

const marker = {
  publicLeadId: "a".repeat(32),
  servedVersion: 1,
  projectionVersion: "p1",
  policyVersion: "policy1",
  asOf: "2026-09-28T00:00:00.000Z",
  publicLocation: {
    latitude: 31.2,
    longitude: 121.5,
    coordinateSystem: "GCJ02",
    precisionMode: "APPROXIMATE",
    areaLabel: null,
  },
  boardShortLabel: "公开版面",
  totalRemaining: 0,
  recordType: "UPLOAD_RECORD",
  opportunity: {
    primaryStatus: "LOW_OPPORTUNITY",
    reasonCodes: ["LOW_OPPORTUNITY"],
    policyVersion: "opportunity-20260930-v1",
    evaluatedAt: "2026-09-30T01:00:00.000Z",
  },
  freshness: {
    observedAt: "2026-09-28T00:00:00.000Z",
    band: "RECENT",
    freshnessAsOf: "2026-09-28T01:00:00.000Z",
    policyVersion: "fresh1",
  },
  sourceLabel: null,
  overlapHint: null,
};

const queryResponse = {
  ok: true,
  schemaVersion: PUBLIC_MAP_SCHEMA_VERSION,
  requestId: request.requestId,
  generation: request.generation,
  asOf: "2026-09-28T01:00:00.000Z",
  queryEcho: { boundsDigest: "b", zoomBand: "m", filtersDigest: "f" },
  items: [marker],
  nextCursor: null,
  truncated: false,
  density: {
    returnedCount: 1,
    serverCap: 500,
    overlapPresent: false,
    aggregationAvailable: false,
    removedSinceSnapshot: 0,
  },
};

describe("production detail RPC contention", () => {
  it("dispatches picker and card reads together without a failed read blocking the card", async () => {
    const pending: {
      reject(error: Error): void;
      resolve(value: { result: unknown }): void;
    }[] = [];
    const callFunction = vi.fn(
      () =>
        new Promise<{ result: unknown }>((resolve, reject) =>
          pending.push({ resolve, reject }),
        ),
    );
    const service = new CandidatePublicMapService(
      { callFunction },
      "develop",
      "production",
    );
    const input = {
      publicLeadId: marker.publicLeadId,
      requestId: "picker-read",
      generation: 1,
      supportedSchemaVersions: [PUBLIC_MAP_SCHEMA_VERSION],
    };
    const first = service.detail(input);
    const second = service.detail({ ...input, requestId: "selected-card" });
    await vi.waitFor(() => expect(callFunction).toHaveBeenCalledTimes(2));
    pending[1]!.resolve({ result: { ok: false, code: "LEAD_UNAVAILABLE" } });
    expect(await second).toMatchObject({
      ok: false,
      code: "LEAD_UNAVAILABLE",
      requestId: "selected-card",
    });
    pending[0]!.reject(Error("offline"));
    expect(await first).toMatchObject({
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    });
    expect(callFunction.mock.calls).toHaveLength(2);
  });
});

describe("candidate public-map CloudBase transport", () => {
  it("uses only the approved shadow query function and preserves null/zero", async () => {
    const callFunction = vi.fn(async () => ({ result: queryResponse }));
    const result = await new CandidatePublicMapService(
      { callFunction },
      "develop",
    ).query(request);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.items[0]?.totalRemaining).toBe(0);
    expect(callFunction).toHaveBeenCalledWith({
      name: "v2-shadow-query-public-map-leads",
      data: request,
    });
  });

  it.each(["release", "unknown"] as const)(
    "%s fails closed without invoking CloudBase",
    async (version) => {
      const callFunction = vi.fn();
      const result = await new CandidatePublicMapService(
        { callFunction } as CandidateCloudApi,
        version,
      ).query(request);
      expect(result).toMatchObject({ ok: false, code: "SERVICE_UNAVAILABLE" });
      expect(callFunction).not.toHaveBeenCalled();
    },
  );

  it("rejects a mismatched response identity and private fields", async () => {
    const mismatched = new CandidatePublicMapService(
      {
        callFunction: async () => ({
          result: { ...queryResponse, generation: 0 },
        }),
      },
      "trial",
    );
    expect(await mismatched.query(request)).toMatchObject({
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    });
    const privateResponse = new CandidatePublicMapService(
      {
        callFunction: async () => ({
          result: {
            ...queryResponse,
            items: [{ ...marker, ownerAccountId: "private" }],
          },
        }),
      },
      "trial",
    );
    expect(await privateResponse.query(request)).toMatchObject({
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    });
  });

  it("maps an absent or disabled cloud function to a safe error", async () => {
    const absent = new CandidatePublicMapService(null, "develop");
    expect(await absent.query(request)).toMatchObject({
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    });
    const disabled = new CandidatePublicMapService(
      {
        callFunction: async () => ({
          result: { ok: false, code: "SHADOW_READ_DISABLED" },
        }),
      },
      "develop",
    );
    expect(await disabled.query(request)).toMatchObject({
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    });
  });

  it("reads one public detail through the shadow function and adapts the safe avatar", async () => {
    const detailRequest = {
      publicLeadId: marker.publicLeadId,
      requestId: "candidate-detail-1",
      generation: 2,
      supportedSchemaVersions: [PUBLIC_MAP_SCHEMA_VERSION],
    };
    const callFunction = vi.fn(async () => ({
      result: {
        ok: true,
        schemaVersion: PUBLIC_MAP_SCHEMA_VERSION,
        requestId: detailRequest.requestId,
        generation: detailRequest.generation,
        item: {
          ...marker,
          board: {
            ipName: "公开 IP",
            themeName: null,
            tiers: [
              {
                tierCode: "A",
                displayLabel: null,
                remainingTickets: 0,
                isGrandPrize: true,
              },
            ],
            grandPrizeRemaining: 0,
            totalRemaining: 0,
            pricePerDrawMinor: null,
            fullPackCostMinor: null,
          },
          contributor: {
            displayName: "ICHI 玩家",
            avatar: {
              kind: "FALLBACK_ASSET",
              path: "/assets/v1-29/ichi-avatar.png",
            },
          },
          contributors: [
            {
              displayName: "A",
              avatar: {
                kind: "FALLBACK_ASSET",
                path: "/assets/v1-29/ichi-avatar.png",
              },
            },
            {
              displayName: "B",
              avatar: {
                kind: "FALLBACK_ASSET",
                path: "/assets/v1-29/ichi-avatar.png",
              },
            },
          ],
          opportunity: {
            primaryStatus: "LOW_OPPORTUNITY",
            reasonCodes: ["LOW_OPPORTUNITY"],
            policyVersion: "p1",
            evaluatedAt: "2026-09-28T00:00:00.000Z",
          },
          venueNote: null,
          disclosures: { nonRealtime: true, nonRecommendation: true },
        },
      },
    }));
    const result = await new CandidatePublicMapService(
      { callFunction },
      "trial",
    ).detail(detailRequest);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.item.board.tiers[0]?.remainingTickets).toBe(0);
      expect(result.item.contributor?.avatarUrl).toBe(
        "/assets/v1-29/ichi-avatar.png",
      );
      expect(result.item.contributors?.map((item) => item.displayName)).toEqual(
        ["A", "B"],
      );
    }
    expect(callFunction).toHaveBeenCalledWith({
      name: "v2-shadow-get-public-map-lead-detail",
      data: detailRequest,
    });
  });
});

describe("TASK22 optional query preparation wire guard", () => {
  const prepared = () => ({
    ...marker,
    board: {
      ipName: "公开版面",
      themeName: null,
      tiers: [
        {
          tierCode: "A",
          displayLabel: null,
          remainingTickets: 0,
          isGrandPrize: true,
        },
      ],
      grandPrizeRemaining: 0,
      totalRemaining: 0,
      pricePerDrawMinor: null,
      fullPackCostMinor: null,
    },
    contributor: {
      displayName: "玩家",
      avatar: { kind: "FALLBACK_ASSET", path: "/assets/v1-29/ichi-avatar.png" },
    },
    venueNote: "已审核公开备注",
    uploadedAt: "2026-09-27T00:00:00.000Z",
    disclosures: { nonRealtime: true, nonRecommendation: true },
  });
  it("adapts optional prepared details with the existing public avatar and field boundary", async () => {
    const result = await new CandidatePublicMapService(
      {
        callFunction: async () => ({
          result: { ...queryResponse, preparedDetails: [prepared()] },
        }),
      },
      "develop",
      "production",
    ).query(request);
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.preparedDetails?.[0]).toMatchObject({
        publicLeadId: marker.publicLeadId,
        venueNote: "已审核公开备注",
        contributor: { avatarUrl: "/assets/v1-29/ichi-avatar.png" },
      });
  });
  it.each([
    "over-limit",
    "duplicate",
    "foreign-id",
    "private",
    "old-version",
    "old-policy",
    "old-projection",
    "invalid-avatar",
  ])("rejects %s preparation", async (mode) => {
    const item = prepared();
    if (mode === "foreign-id") item.publicLeadId = "b".repeat(32);
    if (mode === "old-version") item.servedVersion = 0;
    if (mode === "old-policy") item.policyVersion = "old";
    if (mode === "old-projection") item.projectionVersion = "old";
    if (mode === "invalid-avatar")
      item.contributor.avatar.path = "/private-avatar.png";
    const items =
      mode === "over-limit"
        ? [item, item, item]
        : mode === "duplicate"
          ? [item, item]
          : mode === "private"
            ? [{ ...item, openid: "private" }]
            : [item];
    const result = await new CandidatePublicMapService(
      {
        callFunction: async () => ({
          result: { ...queryResponse, preparedDetails: items },
        }),
      },
      "develop",
      "production",
    ).query(request);
    expect(result).toMatchObject({ ok: false, code: "SERVICE_UNAVAILABLE" });
  });
});
