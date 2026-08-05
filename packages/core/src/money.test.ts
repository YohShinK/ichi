import { describe, expect, it } from "vitest";

import {
  accumulatedCost,
  buyoutCost,
  compareDirectPurchaseReference,
  maxAffordableDraws,
  plannedCost,
  remainingBudget,
} from "./money.js";
import { unwrap } from "./test-helpers.js";

describe("money and budget calculations", () => {
  it("uses integer minor units for planned, accumulated and buyout cost", () => {
    expect(unwrap(plannedCost(100, 3))).toBe(300n);
    expect(unwrap(accumulatedCost(300, 100))).toBe(400n);
    expect(unwrap(remainingBudget(500, 300))).toBe(200n);
    expect(unwrap(buyoutCost(10, 100))).toBe(1000n);
  });

  it("floors affordable draws and caps them at the pool", () => {
    expect(unwrap(maxAffordableDraws(99, 100, 10))).toBe(0);
    expect(unwrap(maxAffordableDraws(450, 100, 10))).toBe(4);
    expect(unwrap(maxAffordableDraws(5000, 100, 10))).toBe(10);
    expect(unwrap(maxAffordableDraws(0, 0, 10))).toBe(10);
  });

  it("rejects fractional or negative money", () => {
    expect(plannedCost(1.5, 2)).toMatchObject({
      ok: false,
      error: { code: "NON_INTEGER_INPUT" },
    });
    expect(plannedCost(-1, 2)).toMatchObject({
      ok: false,
      error: { code: "NEGATIVE_MONEY" },
    });
    expect(remainingBudget(100, 101)).toMatchObject({
      ok: false,
      error: { code: "SPENT_EXCEEDS_BUDGET" },
    });
  });

  it("compares cash only and preserves an absent reference as unknown", () => {
    expect(
      unwrap(compareDirectPurchaseReference(undefined, 300, 1000)),
    ).toEqual({
      status: "unknown",
    });
    expect(unwrap(compareDirectPurchaseReference(250, 300, 1000))).toEqual({
      status: "reference_available",
      referenceMinor: 250n,
      plannedDrawMinusDirectMinor: 50n,
      buyoutMinusDirectMinor: 750n,
    });
  });
});
