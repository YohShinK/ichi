import fs from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { CandidatePublicMapService } from "./public-map-candidate-service.js";
import { PublicMapClient } from "./public-map-client.js";
import { PublicMapMemoryCache } from "./public-map-cache.js";
import { presentPublicDetail } from "./public-map-presentation.js";
import { presentPublicMarker } from "./public-map-presentation.js";
import { presentClusterPickerRow } from "./public-map-cluster-picker.js";
import {
  containsForbiddenPrivateMapField,
  type PublicDetail,
  type PublicMarker,
  type PublicMapService,
} from "./public-map-contract.js";
import { createDefaultPublicMapQuery } from "./public-map-query.js";
const NOW = Date.parse("2026-10-06T08:00:00Z"),
  until = new Date(NOW + 1000).toISOString();
const marker: PublicMarker = {
  publicLeadId: "b".repeat(32),
  servedVersion: 1,
  projectionVersion: "p",
  policyVersion: "policy",
  asOf: new Date(NOW).toISOString(),
  publicLocation: {
    coordinateSystem: "GCJ02",
    latitude: 31.23,
    longitude: 121.47,
    precisionMode: "APPROXIMATE",
    areaLabel: null,
  },
  boardShortLabel: "网络IP",
  totalRemaining: 9,
  recordType: null,
  opportunity: {
    primaryStatus: "LAST_CHANCE",
    reasonCodes: ["LAST_CHANCE"],
    policyVersion: "opportunity",
    evaluatedAt: new Date(NOW).toISOString(),
  },
  freshness: {
    observedAt: new Date(NOW + 1000 - 30 * 86400_000).toISOString(),
    band: "LOW",
    freshnessAsOf: new Date(NOW).toISOString(),
    policyVersion: "freshness",
  },
  sourceLabel: "网络上传",
  sourceIcon: "OFFICIAL_NETWORK",
  publicUntil: until,
  networkPolicyVersion: "network-visibility-30d-v1",
  overlapHint: null,
};
const detail: PublicDetail = {
  ...marker,
  board: {
    ipName: "网络IP",
    themeName: null,
    tiers: [
      {
        tierCode: "A",
        displayLabel: "A赏",
        remainingTickets: 9,
        isGrandPrize: true,
      },
    ],
    grandPrizeRemaining: 9,
    totalRemaining: 9,
    pricePerDrawMinor: null,
    fullPackCostMinor: null,
  },
  contributor: null,
  contributors: [],
  venueNote: null,
  disclosures: { nonRealtime: true, nonRecommendation: true },
};
const service: PublicMapService = {
  query: async (r) => ({
    ok: true,
    schemaVersion: "public-map-v4",
    requestId: r.requestId,
    generation: r.generation,
    asOf: marker.asOf,
    queryEcho: { boundsDigest: "b", zoomBand: "12", filtersDigest: "f" },
    items: [marker],
    preparedDetails: [detail],
    nextCursor: null,
    truncated: false,
    density: {
      returnedCount: 1,
      serverCap: 500,
      overlapPresent: false,
      aggregationAvailable: false,
      removedSinceSnapshot: 0,
    },
  }),
  detail: async (r) => ({
    ok: true,
    schemaVersion: "public-map-v4",
    requestId: r.requestId,
    generation: r.generation,
    item: detail,
  }),
};

describe("official NETWORK public v4 client", () => {
  it("uses the same expanded public content and original observation time in the NETWORK picker", () => {
    const row = {
      ...detail,
      publicLocation: {
        ...detail.publicLocation,
        areaLabel: "大致位置 · 位置误差未知 · 测试商场",
      },
      venueNote: "E 升 LAST",
      uploadedAt: "2099-01-01T00:00:00Z",
    };
    const view = presentPublicDetail(row);
    const picker = presentClusterPickerRow(presentPublicMarker(marker, 0), row);
    expect(view.networkExpandedNoteLines).toEqual([
      "测试商场",
      "E 升 LAST",
      ...view.opportunityReasons,
    ]);
    expect(picker.pickerNotePreview).toBe(
      view.networkExpandedNoteLines.join(" · "),
    );
    expect(picker.pickerUploadedAtLabel).toBe(view.recordTimeClockLabel);
    expect(picker.pickerUploadedAtLabel).toContain("09/06");
    expect(picker.pickerUploadedAtLabel).toMatch(/^上传 /);
    expect(view.recordTimeLabel).toMatch(/^上传于/);
  });
  it("preserves location precision in transport while showing only the NETWORK venue name", async () => {
    const areaLabel = "大致位置 · 位置误差未知 · 测试商场";
    const location = {
      ...detail.publicLocation,
      precisionMode: "AREA" as const,
      areaLabel,
    };
    const row = { ...detail, publicLocation: location };
    const candidate = new CandidatePublicMapService(
      {
        callFunction: vi.fn(async () => ({
          result: {
            ok: true,
            schemaVersion: "public-map-v4",
            requestId: "r",
            generation: 1,
            item: row,
          },
        })),
      },
      "develop",
      "production",
    );
    const got = await candidate.detail({
      publicLeadId: row.publicLeadId,
      requestId: "r",
      generation: 1,
      supportedSchemaVersions: ["public-map-v3", "public-map-v4"],
    });
    expect(got.ok).toBe(true);
    if (got.ok) {
      expect(got.item.publicLocation).toEqual(location);
      expect(presentPublicDetail(got.item).locationLabel).toBe("测试商场");
      expect(got.item.publicLocation).toEqual(location);
      expect(
        presentPublicDetail({ ...got.item, sourceIcon: undefined })
          .locationLabel,
      ).toBe(areaLabel);
    }
    const wxml = fs.readFileSync(
      "apps/client/miniprogram/pages/home/index.wxml",
      "utf8",
    );
    expect(wxml).toContain(
      "mapDetail.sourceIcon === 'OFFICIAL_NETWORK' ? mapDetail.locationLabel : mapDetail.venueNotePreview",
    );
    expect(wxml).toContain('wx:for="{{mapDetail.networkExpandedNoteLines}}"');
  });
  it("negotiates v4 and uses an official network icon without player attribution", async () => {
    const cloud = {
      callFunction: vi.fn(
        async ({ data }: { data: Record<string, unknown> }) => ({
          result: await service.detail(data as never),
        }),
      ),
    };
    const candidate = new CandidatePublicMapService(
      cloud,
      "develop",
      "production",
    );
    const r = await candidate.detail({
      publicLeadId: marker.publicLeadId,
      requestId: "d",
      generation: 1,
      supportedSchemaVersions: ["public-map-v3", "public-map-v4"],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.item).toMatchObject({
      publicUntil: until,
      sourceIcon: "OFFICIAL_NETWORK",
      contributor: null,
      contributors: [],
    });
    const p = presentPublicDetail(r.item);
    expect(p.contributorName).toBe("网络上传");
    expect(p.sourceIcon).toBe("OFFICIAL_NETWORK");
    expect(p.contributorAvatarUrl).toBe("/assets/icons/official-network.svg");
    expect(p.contributorAvatars).toEqual([]);
  });
  it.each([
    "v3",
    "wrong deadline",
    "fake contributor",
    "private source URL",
    "wrong policy",
    "wrong icon",
  ])("rejects %s in an official network response", async (bad) => {
    const item = structuredClone(detail) as unknown as Record<string, unknown>;
    if (bad === "wrong deadline")
      item.publicUntil = new Date(NOW + 2000).toISOString();
    if (bad === "fake contributor")
      item.contributors = [
        {
          displayName: "network-user",
          avatar: {
            kind: "FALLBACK_ASSET",
            path: "/assets/v1-29/ichi-avatar.png",
          },
        },
      ];
    if (bad === "private source URL")
      item.sourceUrl = "https://private.example";
    if (bad === "wrong policy") item.networkPolicyVersion = "old";
    if (bad === "wrong icon") item.sourceIcon = "PLAYER";
    const cloud = {
      callFunction: async () => ({
        result: {
          ok: true,
          schemaVersion: bad === "v3" ? "public-map-v3" : "public-map-v4",
          requestId: "d",
          generation: 1,
          item,
        },
      }),
    };
    const candidate = new CandidatePublicMapService(
      cloud,
      "develop",
      "production",
    );
    expect(
      (
        await candidate.detail({
          publicLeadId: marker.publicLeadId,
          requestId: "d",
          generation: 1,
          supportedSchemaVersions: ["public-map-v3", "public-map-v4"],
        })
      ).ok,
    ).toBe(false);
  });
  it("keeps v3 PLAYER backend compatibility", async () => {
    const raw = {
      ...detail,
      sourceLabel: null,
      publicUntil: undefined,
      sourceIcon: undefined,
      networkPolicyVersion: undefined,
    };
    const candidate = new CandidatePublicMapService(
      {
        callFunction: async () => ({
          result: {
            ok: true,
            schemaVersion: "public-map-v3",
            requestId: "d",
            generation: 1,
            item: raw,
          },
        }),
      },
      "develop",
      "production",
    );
    expect(
      (
        await candidate.detail({
          publicLeadId: marker.publicLeadId,
          requestId: "d",
          generation: 1,
          supportedSchemaVersions:
            createDefaultPublicMapQuery().supportedSchemaVersions,
        })
      ).ok,
    ).toBe(true);
  });
  it("removes expired network information from stale/offline cache and prepared details", async () => {
    let now = NOW;
    const cache = new PublicMapMemoryCache();
    const query = createDefaultPublicMapQuery();
    cache.writeSnapshot({
      queryIdentity: "q",
      schemaVersion: "public-map-v4",
      asOf: marker.asOf,
      items: [marker],
      nextCursor: "old",
      cachedAtMs: NOW,
    });
    cache.writeDetail(detail);
    expect(cache.readSnapshot("q", NOW + 999)?.items).toHaveLength(1);
    expect(cache.readSnapshot("q", NOW + 1000)?.items).toEqual([]);
    expect(cache.readDetail(marker.publicLeadId, NOW + 1000)).toBeNull();
    const c = new PublicMapClient({
      service,
      initialQuery: query,
      cache,
      now: () => now,
    });
    await c.loadInitial();
    await c.selectLead(marker.publicLeadId);
    expect(c.state.detail.item?.publicUntil).toBe(until);
    now += 1000;
    expect(c.state.items).toEqual([]);
    expect(c.state.detail.item).toBeNull();
    expect(await c.readLeadForPicker(marker.publicLeadId)).toBeNull();
    await c.refresh();
    expect(c.state.items).toEqual([]);
  });
  it("expires an already rendered card and markers at the deadline without another request", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    try {
      const c = new PublicMapClient({
        service,
        initialQuery: createDefaultPublicMapQuery(),
      });
      const listener = vi.fn();
      c.subscribe(listener);
      await c.loadInitial();
      await c.selectLead(marker.publicLeadId);
      const calls = listener.mock.calls.length;
      await vi.advanceTimersByTimeAsync(1000);
      expect(listener.mock.calls.length).toBeGreaterThan(calls);
      expect(c.state.detail.item).toBeNull();
      expect(c.state.items).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });
  it("allows a newer PLAYER projection on the continuous ID after NETWORK expiry", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    try {
      let version = 1;
      const player = {
        ...marker,
        servedVersion: 2,
        sourceLabel: null,
        publicUntil: undefined,
        sourceIcon: undefined,
        networkPolicyVersion: undefined,
      };
      const c = new PublicMapClient({
        service: {
          ...service,
          query: async (r) => {
            const response = await service.query(r);
            if (!response.ok) return response;
            return { ...response, items: [version === 1 ? marker : player] };
          },
        },
        initialQuery: createDefaultPublicMapQuery(),
      });
      await c.loadInitial();
      await vi.advanceTimersByTimeAsync(1000);
      expect(c.state.items).toEqual([]);
      version = 2;
      await c.refresh();
      expect(c.state.items).toHaveLength(1);
      expect(c.state.items[0]?.servedVersion).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
  it("rejects private provenance recursively before a public cache/wire write", () => {
    for (const key of [
      "sourceUrl",
      "reviewVersion",
      "curatorAuthorityId",
      "evidenceRef",
      "takedownOwnerId",
      "contentDigest",
    ])
      expect(
        containsForbiddenPrivateMapField({ nested: [{ [key]: "secret" }] }),
      ).toBe(true);
  });
});

it("renders an independent official source image when NETWORK has no PLAYER avatars", () => {
  const wxml = fs.readFileSync(
    "apps/client/miniprogram/pages/home/index.wxml",
    "utf8",
  );
  expect(wxml).toMatch(
    /wx:if="{{mapDetail.sourceIcon === 'OFFICIAL_NETWORK'}}"[\s\S]*?src="\/assets\/icons\/official-network.svg"[\s\S]*?aria-label="官方网络来源"/,
  );
  expect(wxml).toContain('<view wx:else class="map-info-avatar-stack">');
});
