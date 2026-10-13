import { describe, expect, it } from "vitest";

import {
  createDiscoveryFilterQuery,
  createSyntheticViewportQuery,
  DEFAULT_PUBLIC_CONTRIBUTOR,
  findOverlapGroup,
  formatNullableCount,
  formatNullableMoney,
  formatMarkerRemainingCount,
  formatCardAmount,
  formatTierProbability,
  splitPublicVenueNote,
  formatObservedAtClock,
  formatObservedAtRelative,
  presentPublicDetail,
  presentPublicMarker,
  publicFreshnessLabel,
  publicOpportunityLabel,
  publicRecordTypeLabel,
} from "./public-map-presentation.js";
import type { PublicDetail } from "./public-map-contract.js";
import { createDefaultPublicMapQuery } from "./public-map-query.js";
import {
  SYNTHETIC_PUBLIC_MARKERS,
  SyntheticPublicMapService,
} from "./public-map-synthetic-service.js";

const detailFixture = (update: Partial<PublicDetail> = {}): PublicDetail => ({
  publicLeadId: "lead-detail",
  servedVersion: 1,
  projectionVersion: "projection-v1",
  policyVersion: "policy-v1",
  asOf: "2026-09-13T03:00:00.000Z",
  publicLocation: {
    latitude: 31.22,
    longitude: 121.49,
    coordinateSystem: "GCJ02",
    precisionMode: "AREA",
    areaLabel: "黄浦区",
  },
  board: {
    ipName: "零值版面",
    themeName: "主题",
    tiers: [
      {
        tierCode: "A",
        displayLabel: "A赏",
        remainingTickets: 0,
        isGrandPrize: true,
      },
    ],
    grandPrizeRemaining: 0,
    totalRemaining: 0,
    pricePerDrawMinor: 0,
    fullPackCostMinor: null,
  },
  recordType: "UPLOAD_RECORD",
  contributor: null,
  opportunity: {
    primaryStatus: "LOW_OPPORTUNITY",
    reasonCodes: ["LOW_FRESHNESS", "UNKNOWN_REASON"],
    policyVersion: "opportunity-v1",
    evaluatedAt: "2026-09-10T10:00:00.000Z",
  },
  freshness: {
    observedAt: "2026-09-10T10:00:00.000Z",
    band: "LOW",
    freshnessAsOf: "2026-09-13T03:00:00.000Z",
    policyVersion: "freshness-v1",
  },
  venueNote: null,
  sourceLabel: null,
  disclosures: { nonRealtime: true, nonRecommendation: true },
  ...update,
});

describe("TASK-V2-16A public map presentation", () => {
  it("never exposes synthetic task metadata as an IP/theme", async () => {
    const service = new SyntheticPublicMapService();
    const result = await service.detail({
      publicLeadId: SYNTHETIC_PUBLIC_MARKERS[0]!.publicLeadId,
      requestId: "theme-check",
      generation: 1,
      supportedSchemaVersions: ["1.0.0"],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const presented = presentPublicDetail(result.item);
    expect(presented.displayIpTheme).toBe(result.item.board.ipName);
    expect(presented.displayIpTheme).not.toMatch(/TASK|synthetic|sourceLabel/u);
    expect(presented.themeLabel).toBe("");
  });
  it.each([
    ["GRAND_PRIZE_REMAINS", "大赏存量足"],
    ["GRAND_PRIZE_RATIO", "大赏占比高"],
    ["LOW_OPPORTUNITY", "低机会信息"],
    [null, "机会信息未知"],
    ["UNRECOGNIZED", "机会信息未知"],
  ])("maps opportunity %s to neutral copy", (level, label) => {
    expect(publicOpportunityLabel(level)).toBe(label);
  });

  it.each([
    ["RECENT", "近期观察"],
    ["AGING", "逐渐变旧"],
    ["LOW", "较早观察"],
    ["UNKNOWN", "观察时间未知"],
  ])("maps freshness %s independently", (band, label) => {
    expect(publicFreshnessLabel(band)).toBe(label);
  });

  it("keeps null distinct from zero for counts", () => {
    expect(formatNullableCount(null, "余票 ")).toBe("余票 待确认");
    expect(formatNullableCount(0, "余票 ")).toBe("余票 0");
  });

  it("keeps null distinct from zero for money", () => {
    expect(formatNullableMoney(null, "未提供")).toBe("未提供");
    expect(formatNullableMoney(0, "未提供")).toBe("¥0.00");
  });

  it("derives tier probability from canonical remaining counts", () => {
    expect(formatTierProbability(1, 12)).toBe("8.33%");
    expect(formatTierProbability(2, 12)).toBe("16.67%");
    expect(formatTierProbability(0, 12)).toBe("0.00%");
    expect(formatTierProbability(2, 0)).toBe("0.00%");
    expect(formatTierProbability(null, 12)).toBe("—");
    expect(formatTierProbability(2, null)).toBe("—");
  });

  it.each([
    ["DRAW_RECORD", "抽赏记录"],
    ["UPLOAD_RECORD", "上传记录"],
    [null, "公开记录"],
  ] as const)("labels the legal record type %s", (recordType, label) => {
    expect(publicRecordTypeLabel(recordType)).toBe(label);
  });

  it("contains the legal DRAW_RECORD plus LOW combination", () => {
    const marker = SYNTHETIC_PUBLIC_MARKERS.find(
      (item) =>
        item.recordType === "DRAW_RECORD" &&
        item.opportunity.primaryStatus === "LOW_OPPORTUNITY",
    );
    expect(marker?.publicLeadId).toBe("lead-synthetic-003");
  });

  it("contains the legal UPLOAD_RECORD plus HIGH combination", () => {
    const marker = SYNTHETIC_PUBLIC_MARKERS.find(
      (item) =>
        item.recordType === "UPLOAD_RECORD" &&
        item.opportunity.primaryStatus === "GRAND_PRIZE_REMAINS",
    );
    expect(marker?.publicLeadId).toBe("lead-synthetic-004");
  });

  it("preserves two same-location leads as distinct publicLeadIds", () => {
    const markers = SYNTHETIC_PUBLIC_MARKERS.map(presentPublicMarker);
    const overlap = findOverlapGroup(markers, "lead-synthetic-002");
    expect(overlap.map((item) => item.publicLeadId)).toEqual([
      "lead-synthetic-002",
      "lead-synthetic-004",
    ]);
  });

  it("presents the public marker remaining count and a truthful compact tag", () => {
    const marker = presentPublicMarker(SYNTHETIC_PUBLIC_MARKERS[0]!, 0);
    expect(marker.totalRemainingLabel).toBe("12");
    expect(marker.totalRemainingCompact).toBe(false);
    expect(marker.boardShortLabel).toBe("进击的巨人 最终季");
    expect(marker.primaryDiscoveryTag).not.toBe("");
  });

  it.each([
    [0, "00"],
    [8, "08"],
    [9, "09"],
    [10, "10"],
    [128, "128"],
    [null, "—"],
  ])("formats map remaining %s as %s", (count, label) => {
    expect(formatMarkerRemainingCount(count)).toBe(label);
    const source = SYNTHETIC_PUBLIC_MARKERS[0]!;
    expect(
      presentPublicMarker({ ...source, totalRemaining: count }, 0)
        .totalRemainingLabel,
    ).toBe(label);
  });

  it("does not invent an overlap group for a single marker", () => {
    const markers = SYNTHETIC_PUBLIC_MARKERS.map(presentPublicMarker);
    expect(findOverlapGroup(markers, "lead-synthetic-003")).toEqual([]);
  });

  it("presents zero values and contributor fallback without falsy collapse", () => {
    const view = presentPublicDetail(detailFixture());
    expect(view.totalRemainingLabel).toBe("剩余 0 抽");
    expect(view.totalRemainingValueLabel).toBe("0");
    expect(view.totalRemainingCompact).toBe(false);
    expect(view.grandPrizeRemainingLabel).toBe("大奖余量 0");
    expect(view.priceLabel).toBe("¥0.00");
    expect(view.hasPrice).toBe(true);
    expect(view.fullPackCostLabel).toBe("");
    expect(view.tiers[0]?.probabilityLabel).toBe("0.00%");
    expect(view.contributorName).toBe(DEFAULT_PUBLIC_CONTRIBUTOR.displayName);
    expect(view.contributorAvatarUrl).toBe(
      DEFAULT_PUBLIC_CONTRIBUTOR.avatarUrl,
    );
  });

  it("renders configurable contributor stack and an overflow count", () => {
    const detail = detailFixture({
      contributors: [
        { displayName: "A", avatarUrl: "/assets/v1-29/ichi-avatar.png" },
        { displayName: "B", avatarUrl: "/assets/v1-29/ichi-avatar.png" },
        { displayName: "C", avatarUrl: "/assets/v1-29/ichi-avatar.png" },
      ],
      venueNote: "B 的最新安全备注",
    });
    const view = presentPublicDetail(detail, { visibleContributorLimit: 2 });
    expect(view.contributorAvatars.map((item) => item.displayName)).toEqual([
      "A",
      "B",
    ]);
    expect(view.contributorOverflowLabel).toBe("+1");
    expect(view.venueNote).toBe("B 的最新安全备注");
  });

  it("matches the draw header compact-number threshold", () => {
    const base = detailFixture();
    const view = presentPublicDetail({
      ...base,
      board: { ...base.board, totalRemaining: 12 },
    });

    expect(view.totalRemainingValueLabel).toBe("12");
    expect(view.totalRemainingCompact).toBe(true);
  });

  it("presents only public detail fields and neutral reason copy", () => {
    const view = presentPublicDetail(detailFixture());
    expect(view.locationLabel).toBe("黄浦区");
    expect(view.venueNote).toBe("");
    expect(view.venueNotePreview).toBe("现场线索暂无补充备注");
    expect(view.hasVenueNote).toBe(false);
    expect(view.opportunityReasons).toEqual([
      "观察时间较早，仅供参考",
      "公开规则给出的中性说明",
    ]);
    expect(JSON.stringify(view)).not.toMatch(
      /accountId|openid|fileID|trustState/u,
    );
  });

  it("derives the collapsed note preview only from the truthful venue note", () => {
    const view = presentPublicDetail(
      detailFixture({
        venueNote:
          "  周末刚补了新柜子，A赏好摸！\n位置在商场 B1 层，电梯左转就到。  ",
      }),
    );
    expect(view.venueNote).toBe(
      "周末刚补了新柜子，A赏好摸！\n位置在商场 B1 层，电梯左转就到。",
    );
    expect(view.venueNotePreview).toBe("周末刚补了新柜子，A赏好摸！");
    expect(view.venueNoteBody).toBe("位置在商场 B1 层，电梯左转就到。");
    expect(view.hasVenueNote).toBe(true);
  });

  it("preserves note content without a duplicate or fabricated headline", () => {
    for (const note of [
      "",
      "只有一行备注",
      "第一行\n第二行",
      "首句。后文",
      "很长的没有标点的现场记录".repeat(8),
    ]) {
      const parts = splitPublicVenueNote(note);
      expect((parts.headline + parts.body).replace(/\s/gu, "")).toBe(
        note.replace(/\s/gu, ""),
      );
    }
  });

  it("formats canonical money and observed time without fabricated defaults", () => {
    expect(formatCardAmount(null)).toBe("");
    expect(formatCardAmount(0)).toBe("0");
    expect(formatCardAmount(237800)).toBe("2,378");
    expect(formatCardAmount(650)).toBe("6.50");
    const local = new Date(2026, 8, 18, 14, 30);
    expect(formatObservedAtClock(local.toISOString())).toBe("09/18 14:30");
    expect(formatObservedAtClock("invalid")).toBe("时间未知");
  });

  it.each([1, 5, 6, 8, 11])(
    "preserves %i tiers in source order with enough columns for two rows",
    (count) => {
      const base = detailFixture();
      const tiers = Array.from({ length: count }, (_, i) => ({
        tierCode: String.fromCharCode(65 + i),
        displayLabel: null,
        remainingTickets: i === 2 ? null : i,
        isGrandPrize: false,
      }));
      const view = presentPublicDetail({
        ...base,
        board: { ...base.board, tiers },
      });
      expect(view.tierColumnCount).toBe(Math.ceil(count / 2));
      expect(view.tiers.map((t) => t.tierCode)).toEqual(
        tiers.map((t) => t.tierCode),
      );
      expect(view.tiers[0]?.isSoldOut).toBe(true);
      if (count > 2) expect(view.tiers[2]?.isSoldOut).toBe(false);
    },
  );

  it("marks confirmed-zero tiers sold out while preserving unknown tiers", () => {
    const base = detailFixture();
    const view = presentPublicDetail({
      ...base,
      board: {
        ...base.board,
        tiers: [
          {
            tierCode: "A",
            displayLabel: "A赏",
            remainingTickets: 0,
            isGrandPrize: true,
          },
          {
            tierCode: "B",
            displayLabel: "B赏",
            remainingTickets: null,
            isGrandPrize: true,
          },
          {
            tierCode: "C",
            displayLabel: "C赏",
            remainingTickets: 2,
            isGrandPrize: false,
          },
        ],
      },
    });
    expect(view.tiers.map((tier) => tier.tierCode)).toEqual(["A", "B", "C"]);
    expect(view.tiers[0]?.isSoldOut).toBe(true);
    expect(view.tiers[0]?.isUnknown).toBe(false);
    expect(view.tiers[1]?.remainingTickets).toBeNull();
    expect(view.tiers[1]?.remainingLabel).toBe("未知");
    expect(view.tiers[1]?.isSoldOut).toBe(false);
    expect(view.tiers[1]?.isUnknown).toBe(true);
    expect(view.tiers[1]?.probabilityLabel).toBe("—");
    expect(view.tiers[2]?.remainingLabel).toBe("2");
    expect(view.tiers[2]?.isSoldOut).toBe(false);
    expect(view.tiers[2]?.isUnknown).toBe(false);
  });

  it("shows canonical LAST cost only when the public detail provides it", () => {
    const base = detailFixture();
    expect(
      presentPublicDetail({
        ...base,
        board: { ...base.board, fullPackCostMinor: 345_000 },
      }).fullPackCostValueLabel,
    ).toBe("¥3450.00");
    expect(
      presentPublicDetail({
        ...base,
        board: { ...base.board, fullPackCostMinor: 345_000 },
      }).fullPackCostLabel,
    ).toBe("LAST 还需 ¥3450.00");
    expect(presentPublicDetail(base).fullPackCostLabel).toBe("");
    expect(presentPublicDetail(base).fullPackCostValueLabel).toBe("");
  });

  it("renders direct relative time without a Freshness heading", () => {
    const now = Date.parse("2026-09-14T02:00:00.000Z");
    expect(formatObservedAtRelative("2026-09-14T01:57:00.000Z", now)).toBe(
      "3 分钟前",
    );
    expect(formatObservedAtRelative("2026-09-14T00:00:00.000Z", now)).toBe(
      "2 小时前",
    );
    expect(formatObservedAtRelative("2026-09-11T02:00:00.000Z", now)).toBe(
      "3 天前",
    );
  });

  it("uses deterministic fixture primary tag without changing Opportunity", () => {
    const base = detailFixture();
    const view = presentPublicDetail({
      ...base,
      publicLeadId: "lead-synthetic-001",
    });
    expect(view.primaryDiscoveryTag).toBe("仅上传、低机会信息");
    expect(view.opportunityStatus).toBe("LOW_OPPORTUNITY");
  });

  it("changes opportunity and supported freshness in one query", () => {
    const query = createDiscoveryFilterQuery(
      createDefaultPublicMapQuery(),
      "GRAND_PRIZE_RATIO",
      "EXCLUDE_LOW",
    );
    expect(query.opportunityStatuses).toEqual(["GRAND_PRIZE_RATIO"]);
    expect(query.includeLowFreshness).toBe(false);
  });

  it("clears discovery filters back to the supported public defaults", () => {
    const query = createDiscoveryFilterQuery(
      createDefaultPublicMapQuery(),
      "ALL",
      "INCLUDE_LOW",
    );
    expect(query.opportunityStatuses).toEqual([]);
    expect(query.includeLowFreshness).toBe(true);
  });

  it("creates a new synthetic viewport without mutating the prior query", () => {
    const prior = createDefaultPublicMapQuery();
    const next = createSyntheticViewportQuery(prior);
    expect(next.bbox.west).toBeCloseTo(prior.bbox.west + 0.01);
    expect(prior.bbox.west).toBe(121.38);
  });

  it("honors the supported low-freshness filter in the synthetic service", async () => {
    const service = new SyntheticPublicMapService();
    const result = await service.query({
      ...createDefaultPublicMapQuery(),
      includeLowFreshness: false,
      limit: 10,
      cursor: null,
      asOf: null,
      requestId: "filter-low",
      generation: 1,
    });
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.items.map((item) => item.publicLeadId)).not.toContain(
        "lead-synthetic-003",
      );
  });
});

describe("actual upload time in the public card", () => {
  it("uses the server upload time explicitly, while preserving observation freshness", () => {
    const detail = detailFixture({ uploadedAt: "2026-10-03T09:55:25.907Z" });
    const view = presentPublicDetail(detail);
    expect(view.recordTimeClockLabel).toBe(
      `上传 ${formatObservedAtClock(detail.uploadedAt!)}`,
    );
    expect(view.recordTimeLabel).toContain("上传于");
    expect(view.observedAtClockLabel).toBe(
      formatObservedAtClock(detail.freshness.observedAt),
    );
    expect(presentPublicDetail(detailFixture()).recordTimeClockLabel).toContain(
      "观察 ",
    );
  });
});
