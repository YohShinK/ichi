import { describe, expect, it } from "vitest";

import { addFractions, fraction, fractionToString } from "./fraction.js";
import {
  atLeastOneHitProbability,
  expectedDrawsToFirstHit,
  expectedTargetCount,
  hitDistribution,
  nextDrawHitProbability,
  probabilitySummary,
} from "./probability.js";
import { unwrap } from "./test-helpers.js";

describe("single-target probability", () => {
  it("matches the ordinary fixed vector", () => {
    expect(fractionToString(unwrap(nextDrawHitProbability(10, 2)))).toBe("1/5");
    expect(fractionToString(unwrap(atLeastOneHitProbability(10, 2, 3)))).toBe(
      "8/15",
    );
    const distribution = unwrap(hitDistribution(10, 2, 3));
    expect(
      Object.fromEntries(
        distribution.map((entry) => [
          entry.hits,
          fractionToString(entry.probability),
        ]),
      ),
    ).toEqual({ 0: "7/15", 1: "7/15", 2: "1/15" });
    expect(fractionToString(unwrap(expectedTargetCount(10, 2, 3)))).toBe("3/5");
    expect(fractionToString(unwrap(expectedDrawsToFirstHit(10, 2)))).toBe(
      "11/3",
    );
  });

  it("handles zero targets, zero draws and drawing the full pool", () => {
    expect(fractionToString(unwrap(atLeastOneHitProbability(10, 0, 3)))).toBe(
      "0/1",
    );
    expect(fractionToString(unwrap(atLeastOneHitProbability(10, 2, 0)))).toBe(
      "0/1",
    );
    expect(fractionToString(unwrap(atLeastOneHitProbability(10, 2, 10)))).toBe(
      "1/1",
    );
    expect(expectedDrawsToFirstHit(10, 0)).toMatchObject({
      ok: false,
      error: { code: "TARGET_UNAVAILABLE" },
    });
    const unavailableSummary = unwrap(probabilitySummary(10, 0, 3));
    expect(unavailableSummary.expectedDrawsToFirstHit).toBeNull();
    expect(unavailableSummary.expectedDrawsReason).toBe("TARGET_UNAVAILABLE");
  });

  it("keeps every distribution exact and normalized", () => {
    for (let remaining = 1; remaining <= 30; remaining += 1) {
      for (let targets = 0; targets <= remaining; targets += 1) {
        for (let draws = 0; draws <= remaining; draws += 1) {
          const distribution = unwrap(
            hitDistribution(remaining, targets, draws),
          );
          const total = distribution.reduce(
            (sum, entry) => addFractions(sum, entry.probability),
            fraction(0n),
          );
          expect(total).toEqual(fraction(1n));
          for (const entry of distribution) {
            expect(entry.probability.numerator).toBeGreaterThanOrEqual(0n);
            expect(entry.probability.numerator).toBeLessThanOrEqual(
              entry.probability.denominator,
            );
          }
        }
      }
    }
  });

  it("keeps deterministic randomized legal inputs finite and within bounds", () => {
    let state = 0x1a2b3c4d;
    const next = (): number => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state;
    };
    for (let sample = 0; sample < 500; sample += 1) {
      const remaining = (next() % 200) + 1;
      const targets = next() % (remaining + 1);
      const draws = next() % (remaining + 1);
      const atLeastOne = unwrap(
        atLeastOneHitProbability(remaining, targets, draws),
      );
      expect(atLeastOne.numerator).toBeGreaterThanOrEqual(0n);
      expect(atLeastOne.numerator).toBeLessThanOrEqual(atLeastOne.denominator);
      expect(atLeastOne.denominator).toBeGreaterThan(0n);

      const expected = unwrap(expectedTargetCount(remaining, targets, draws));
      expect(expected.numerator).toBeGreaterThanOrEqual(0n);
      expect(expected.denominator).toBeGreaterThan(0n);
    }
  });

  it("rejects every fixed invalid range", () => {
    expect(atLeastOneHitProbability(-1, 0, 0)).toMatchObject({
      ok: false,
      error: { code: "NEGATIVE_REMAINING_TICKETS" },
    });
    expect(atLeastOneHitProbability(10, 11, 1)).toMatchObject({
      ok: false,
      error: { code: "TARGET_EXCEEDS_REMAINING" },
    });
    expect(atLeastOneHitProbability(10, 2, -1)).toMatchObject({
      ok: false,
      error: { code: "NEGATIVE_PLANNED_DRAWS" },
    });
    expect(atLeastOneHitProbability(10, 2, 11)).toMatchObject({
      ok: false,
      error: { code: "DRAWS_EXCEED_REMAINING" },
    });
  });
});
