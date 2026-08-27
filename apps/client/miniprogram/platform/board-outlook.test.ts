import { describe, expect, it } from "vitest";

import { buildBoardOutlook } from "./board-outlook.js";

describe("mini-program board outlook v1.1.0", () => {
  it("returns the fixed three-draw event set with three decimals", () => {
    const value = buildBoardOutlook({
      prizes: [
        { id: "a", tier: "A", total: 2, remaining: 2 },
        { id: "d", tier: "D", total: 8, remaining: 7 },
        { id: "g", tier: "G", total: 10, remaining: 9 },
      ],
      targetTiers: ["A"],
      unitPrice: 650,
    });
    expect(value.status).toBe("available");
    if (value.status !== "available") return;
    expect(value.version).toBe("board-outlook-v1.1.0");
    expect(value.windowDraws).toBe(3);
    expect(value.cumulativeCost).toBe(1950);
    expect(value.events.map((event) => event.id)).toEqual([
      "TARGET_HIT_WITHIN_WINDOW",
      "LARGE_PRIZE_WITHIN_WINDOW",
      "NON_SMALL_WITHIN_WINDOW",
      "TWO_OR_MORE_SMALL_WITHIN_WINDOW",
    ]);
    expect(
      value.events.every((event) => /^\d+\.\d{3}$/.test(event.percentage)),
    ).toBe(true);
  });

  it("does not retain a stale result for an empty pool", () => {
    expect(
      buildBoardOutlook({
        prizes: [{ id: "a", tier: "A", total: 1, remaining: 0 }],
        targetTiers: ["A"],
        unitPrice: 650,
      }),
    ).toEqual({ status: "unavailable", reason: "当前票池已无余票。" });
  });
});
