import { describe, expect, it } from "vitest";

import { buildFourOptionComparison } from "./comparison.js";
import { fractionToString } from "./fraction.js";
import { unwrap } from "./test-helpers.js";
import { validateCalculationInput } from "./validation.js";

const valid = () => {
  const result = validateCalculationInput({
    remainingTickets: 10,
    prizes: [
      { id: "A", label: "A赏", remaining: 2 },
      { id: "OTHER", label: "其他", remaining: 8 },
    ],
    unitPriceMinor: 100,
    targets: [{ prizeId: "A", available: 2, required: 1 }],
    plannedDraws: 3,
    sessionBudgetMinor: 500,
    spentMinor: 100,
    directPurchaseReferenceMinor: 250,
  });
  if (result.status !== "calculable")
    throw new Error("Fixture must be calculable.");
  return result.value;
};

describe("four-option explanation", () => {
  it("keeps draw, buyout, direct purchase and stop parallel and explainable", () => {
    const comparison = unwrap(
      buildFourOptionComparison(valid(), ["SESSION_SPEND_LIMIT_REACHED"]),
    );
    expect(comparison.draw).toMatchObject({
      kind: "draw",
      status: "executable",
      plannedDraws: 3,
      costMinor: 300n,
    });
    expect(fractionToString(comparison.draw.atLeastOneTargetProbability)).toBe(
      "8/15",
    );
    expect(fractionToString(comparison.draw.failureProbability)).toBe("7/15");
    expect(comparison.buyout).toMatchObject({
      kind: "buyout",
      status: "not_executable",
      costMinor: 1000n,
    });
    expect(comparison.directPurchase).toMatchObject({
      kind: "direct_purchase",
      status: "reference_only",
      referenceMinor: 250n,
    });
    expect(comparison.stop).toMatchObject({
      kind: "stop",
      status: "always_available",
      preservedSession: true,
      matchedStopConditions: ["SESSION_SPEND_LIMIT_REACHED"],
    });
    expect(comparison.ranking).toBeNull();
    expect(comparison.recommendationScore).toBeNull();
  });

  it("keeps direct purchase unknown when the user gave no reference", () => {
    const input = { ...valid(), directPurchaseReferenceMinor: null };
    const comparison = unwrap(buildFourOptionComparison(input));
    expect(comparison.directPurchase).toEqual({
      kind: "direct_purchase",
      status: "unknown",
      limits: ["REFERENCE_NOT_PROVIDED"],
    });
  });

  it("contains no value, market-price or mysterious recommendation output", () => {
    const serialized = JSON.stringify(
      unwrap(buildFourOptionComparison(valid())),
      (_, value: unknown) =>
        typeof value === "bigint" ? value.toString() : value,
    );
    expect(serialized).not.toMatch(/回本|市场价|个人价值|expectedValue/i);
    expect(serialized).toContain('"recommendationScore":null');
  });
});
