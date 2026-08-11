import { describe, expect, it } from "vitest";
import { fractionToString } from "./fraction.js";
import { calculateBoardOutlook } from "./board-outlook.js";

describe("calculateBoardOutlook", () => {
  it("uses the frozen event order and exact probabilities", () => {
    const result = calculateBoardOutlook({
      remainingTickets: 20,
      largeTickets: 2,
      smallTickets: 8,
      targetTickets: 1,
      unitPriceMinor: 700n,
    });

    expect(result).toMatchObject({ status: "available" });
    if (result.status !== "available") return;
    expect(result.value.windowDraws).toBe(3);
    expect(result.value.cumulativeCostMinor).toBe(2100n);
    expect(result.value.events.map((event) => event.id)).toEqual([
      "TARGET_HIT_WITHIN_WINDOW",
      "LARGE_PRIZE_WITHIN_WINDOW",
      "NON_SMALL_WITHIN_WINDOW",
      "TWO_OR_MORE_SMALL_WITHIN_WINDOW",
    ]);
    expect(
      result.value.events.map((event) => fractionToString(event.probability)),
    ).toEqual(["3/20", "27/95", "271/285", "98/285"]);
  });

  it("uses the remaining ticket count as the observation window", () => {
    const result = calculateBoardOutlook({
      remainingTickets: 2,
      largeTickets: 1,
      smallTickets: 0,
      unitPriceMinor: 700n,
    });

    expect(result).toMatchObject({ status: "available" });
    if (result.status !== "available") return;
    expect(result.value.windowDraws).toBe(2);
    expect(result.value.cumulativeCostMinor).toBe(1400n);
    expect(result.value.events).toEqual([
      {
        id: "LARGE_PRIZE_WITHIN_WINDOW",
        probability: { numerator: 1n, denominator: 1n },
      },
      {
        id: "NO_SMALL_WITHIN_WINDOW",
        probability: { numerator: 1n, denominator: 1n },
      },
    ]);
  });

  it("does not create probabilities for empty or inconsistent inputs", () => {
    expect(
      calculateBoardOutlook({
        remainingTickets: 0,
        largeTickets: 0,
        smallTickets: 0,
        unitPriceMinor: 700n,
      }),
    ).toEqual({ status: "unavailable", reason: "EMPTY_POOL" });
    expect(
      calculateBoardOutlook({
        remainingTickets: 5,
        largeTickets: 6,
        smallTickets: 0,
        unitPriceMinor: 700n,
      }),
    ).toEqual({ status: "unavailable", reason: "INVALID_INPUT" });
  });
});
