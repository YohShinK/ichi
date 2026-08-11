import { describe, expect, it } from "vitest";
import { buildBoardOutlook } from "./board-outlook";

describe("buildBoardOutlook", () => {
  it("derives board-specific events from tier classification", () => {
    const result = buildBoardOutlook({
      tiers: [
        { tier: "A", total: 1, covered: 0 },
        { tier: "B", total: 2, covered: 0 },
        { tier: "E", total: 16, covered: 1 },
      ],
      targetTiers: ["A"],
      unitPriceMinor: 700n,
    });

    expect(result).toMatchObject({ status: "available", windowDraws: 3 });
    if (result.status !== "available") return;
    expect(result.cumulativeCost).toBe(2100n);
    expect(result.events.map((event) => event.id)).toEqual([
      "TARGET_HIT_WITHIN_WINDOW",
      "LARGE_PRIZE_WITHIN_WINDOW",
      "NON_SMALL_WITHIN_WINDOW",
      "TWO_OR_MORE_SMALL_WITHIN_WINDOW",
    ]);
    expect(result.events[0]).toMatchObject({ percentage: "16.667" });
  });

  it("keeps a certain all-non-small result visible", () => {
    const result = buildBoardOutlook({
      tiers: [{ tier: "A", total: 1, covered: 0 }],
      targetTiers: [],
      unitPriceMinor: 700n,
    });

    expect(result).toEqual({
      status: "available",
      windowDraws: 1,
      cumulativeCost: 700n,
      events: [
        {
          id: "LARGE_PRIZE_WITHIN_WINDOW",
          label: "1 抽内至少一张大赏",
          percentage: "100.000",
          certain: true,
        },
        {
          id: "NO_SMALL_WITHIN_WINDOW",
          label: "1 抽内全非小赏",
          percentage: "100.000",
          certain: true,
        },
      ],
    });
  });
});
