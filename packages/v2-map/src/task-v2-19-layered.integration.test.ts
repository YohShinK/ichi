import { describe, expect, it } from "vitest";

import { PublicMapClient } from "../../../apps/client/miniprogram/platform/public-map-client.js";
import { createDefaultPublicMapQuery } from "../../../apps/client/miniprogram/platform/public-map-query.js";
import { adaptPublicMapDetailWire } from "../../../apps/client/miniprogram/platform/public-map-wire-adapter.js";
import {
  InMemoryPublicLeadRepository,
  InMemoryQuerySnapshotStore,
  InMemorySharedRateLimitStore,
  PublicMapService,
  dryRunPublicMapMigration,
  emptyProjectorState,
  reconcilePublicMapLead,
  resolveBoardInstance,
} from "./index.js";
import { testPublicCandidate, testVerifiedBoard } from "./test-support.js";

const now = Date.parse("2026-09-12T03:00:00.000Z");

const projectedService = () => {
  const candidate = testPublicCandidate("private-observation-19");
  const projected = reconcilePublicMapLead(
    emptyProjectorState(),
    {
      boardInstanceId: candidate.boardInstanceId,
      eventSequence: 1,
      reconciledAt: "2026-09-12T02:00:00.000Z",
      eligibleCandidates: [candidate],
      projectionVersion: "projection-v1",
      policyVersion: "public-policy-v1",
    },
    () => "opaque-public-lead-19",
  );
  const repository = new InMemoryPublicLeadRepository(
    Object.values(projected.state.leads),
  );
  let readsEnabled = true;
  const api = new PublicMapService(
    repository,
    new InMemoryQuerySnapshotStore(),
    {
      policyVersion: "freshness-v1",
      recentMaxAgeMs: 3_600_000,
      agingMaxAgeMs: 86_400_000,
    },
    {
      account: { currentAccount: () => ({ accountId: "trusted-reader-19" }) },
      rateLimit: new InMemorySharedRateLimitStore(),
      readControl: {
        readState: () => (readsEnabled ? "ENABLED" : "DISABLED"),
      },
      cursorSecret: {
        currentSecret: () => "test-secret-at-least-32-bytes-long-19",
      },
    },
    undefined,
    () => now,
    () => "snapshot-19",
  );
  const client = new PublicMapClient({
    service: {
      query: async (request) => api.query(request),
      detail: async (request) => adaptPublicMapDetailWire(api.detail(request)),
    },
    initialQuery: createDefaultPublicMapQuery(),
    now: () => now,
  });
  return {
    api,
    client,
    repository,
    setReadsEnabled: (enabled: boolean) => {
      readsEnabled = enabled;
    },
  };
};

describe("TASK-V2-19 local layered integration", () => {
  it("serves a projected public lead to the real client without private lineage or location", async () => {
    const { client } = projectedService();
    await client.loadInitial();
    expect(client.state.items.map((item) => item.publicLeadId)).toEqual([
      "opaque-public-lead-19",
    ]);
    const marker = client.state.items[0]!;
    expect(marker.publicLocation.precisionMode).toBe("APPROXIMATE");
    expect(marker.totalRemaining).toBe(1);
    expect(JSON.stringify(client.state.items)).not.toMatch(
      /private-observation-19|account-a|accuracyMeters|projectionRuleId/,
    );
    await client.selectLead(marker.publicLeadId);
    expect(client.state.detail.phase).toBe("LOADED");
    expect(JSON.stringify(client.state.detail.item)).not.toMatch(
      /private-observation-19|account-a|accuracyMeters|projectionRuleId/,
    );
  });

  it("hides a lead before detail serialization and keeps it absent after a root refresh", async () => {
    const { client, repository } = projectedService();
    await client.loadInitial();
    repository.hide("opaque-public-lead-19");
    await client.selectLead("opaque-public-lead-19");
    expect(client.state.detail.phase).toBe("UNAVAILABLE");
    expect(client.state.items).toHaveLength(0);
    await client.refresh();
    expect(client.state.items).toHaveLength(0);
  });

  it("propagates global public-read stop without private fallback", async () => {
    const { client, setReadsEnabled } = projectedService();
    setReadsEnabled(false);
    await client.loadInitial();
    expect(client.state.items).toHaveLength(0);
    expect(client.state.phase).toBe("SERVICE_UNAVAILABLE");
    expect(client.state.error?.code).toBe("SERVICE_UNAVAILABLE");
  });

  it("rejects a private avatar reference at the wire boundary and strips runtime extras", () => {
    const { api } = projectedService();
    const result = api.detail({
      publicLeadId: "opaque-public-lead-19",
      requestId: "detail-wire-19",
      generation: 1,
      supportedSchemaVersions: ["public-map-v3"],
    });
    if (!result.ok) throw new Error("expected public detail fixture");
    const invalid = adaptPublicMapDetailWire({
      ...result,
      item: {
        ...result.item,
        contributor: {
          displayName: "ICHI 玩家",
          avatar: {
            kind: "PUBLIC_URL",
            url: "cloud://private/profile-avatars/avatar.jpg",
          },
        },
      },
    });
    expect(invalid).toMatchObject({
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    });
    const pollutedItem = {
      ...result.item,
      ownerAccountId: "private-account-19",
    };
    const safe = adaptPublicMapDetailWire({
      ...result,
      item: pollutedItem,
    });
    expect(safe.ok).toBe(true);
    expect(JSON.stringify(safe)).not.toContain("private-account-19");
  });

  it("does not turn a same-place ambiguity into an identity merge", () => {
    const later = testVerifiedBoard("later", {
      observedAt: "2026-09-12T02:00:00.000Z",
    });
    const first = testVerifiedBoard("first", {
      observedAt: "2026-09-12T01:00:00.000Z",
    });
    const second = testVerifiedBoard("second", {
      observedAt: "2026-09-12T01:00:00.000Z",
    });
    expect(
      resolveBoardInstance(later, later.verifiedBoardVersion, [
        { boardInstanceId: "instance-a", lastVerifiedBoard: first },
        { boardInstanceId: "instance-b", lastVerifiedBoard: second },
      ]),
    ).toEqual({
      kind: "AMBIGUOUS",
      candidateIds: ["instance-a", "instance-b"],
    });
  });

  it("simulates migration with per-record authorization, location and moderation gates without rows or writes", () => {
    const candidates = [
      testPublicCandidate("eligible-migration"),
      testPublicCandidate("unaccepted-migration", {
        gates: { authorizationApplicable: false },
      }),
      testPublicCandidate("unlocated-migration", { publicLocation: null }),
      testPublicCandidate("hidden-migration", {
        gates: { moderationVisible: false },
      }),
    ];
    const first = dryRunPublicMapMigration(candidates);
    const retry = dryRunPublicMapMigration(candidates);
    expect(first).toEqual(retry);
    expect(first).toMatchObject({
      mode: "DRY_RUN_ONLY",
      inputCount: 4,
      eligibleCount: 1,
      rejectedCount: 3,
      mutationCount: 0,
      containsPrivateRows: false,
      rejectionCounts: {
        AUTHORIZATION_NOT_APPLICABLE: 1,
        NO_PUBLIC_LOCATION: 1,
        MODERATION_HIDDEN: 1,
      },
    });
    expect(JSON.stringify(first)).not.toMatch(
      /unaccepted-migration|ownerAccountId/,
    );
  });

  it("returns stable errors for malformed runtime requests without throwing", () => {
    const { api } = projectedService();
    expect(
      api.query(undefined as unknown as Parameters<typeof api.query>[0]),
    ).toMatchObject({ ok: false, code: "INVALID_REQUEST" });
    expect(
      api.detail(undefined as unknown as Parameters<typeof api.detail>[0]),
    ).toMatchObject({ ok: false, code: "INVALID_REQUEST" });
    expect(
      api.query({
        ...createDefaultPublicMapQuery(),
        limit: 50,
        cursor: {} as string,
        asOf: null,
        requestId: "malformed-cursor",
        generation: 1,
      }),
    ).toMatchObject({ ok: false, code: "INVALID_REQUEST" });
  });
});
