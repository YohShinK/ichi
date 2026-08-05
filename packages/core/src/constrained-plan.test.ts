import { describe, expect, it } from "vitest";

import {
  buildConservativePlan,
  evaluateLastPrizeGuarantee,
} from "./constrained-plan.js";
import {
  addFractions,
  compareFractions,
  fraction,
  fractionToString,
} from "./fraction.js";
import { atLeastOneHitProbability } from "./probability.js";
import { unwrap } from "./test-helpers.js";
import type { ValidatedCalculationInput } from "./types.js";
import { validateCalculationInput } from "./validation.js";

const makeInput = (
  overrides: Partial<ValidatedCalculationInput> = {},
): ValidatedCalculationInput => ({
  remainingTickets: 10,
  prizes: [
    { id: "A", label: "A赏", remaining: 2 },
    { id: "OTHER", label: "其他", remaining: 8 },
  ],
  unitPriceMinor: 100n,
  targets: [{ prizeId: "A", available: 2, required: 1 }],
  plannedDraws: 0,
  sessionBudgetMinor: 500n,
  spentMinor: 0n,
  directPurchaseReferenceMinor: null,
  ...overrides,
});

describe("conservative constrained plan", () => {
  it("returns the minimum draw count satisfying user-owned constraints", () => {
    const plan = unwrap(
      buildConservativePlan(makeInput(), {
        minimumSuccessProbability: fraction(1n, 2n),
        maximumDraws: 5,
      }),
    );
    expect(plan).toMatchObject({
      status: "available",
      label: "MINIMUM_DRAWS_WITHIN_USER_CONSTRAINTS",
      draws: 3,
      costMinor: 300n,
      ranking: null,
      recommendationScore: null,
      proof: {
        previousDraws: 2,
        previousDrawMeetsThreshold: false,
      },
    });
    if (plan.status !== "available")
      throw new Error("Expected an available plan.");
    expect(fractionToString(plan.successProbability)).toBe("8/15");
    expect(fractionToString(plan.failureProbability)).toBe("7/15");
    expect(fractionToString(plan.proof.previousDrawSuccessProbability!)).toBe(
      "17/45",
    );
    expect(plan.disclosures).toEqual([
      "OUTCOME_NOT_GUARANTEED",
      "FAILURE_PROBABILITY_MUST_BE_SHOWN",
      "USER_CONSTRAINTS_ARE_HARD_LIMITS",
      "STOP_REMAINS_AVAILABLE",
    ]);
  });

  it("returns no feasible plan without relaxing budget, draw or probability limits", () => {
    const plan = unwrap(
      buildConservativePlan(makeInput({ sessionBudgetMinor: 200n }), {
        minimumSuccessProbability: fraction(1n, 2n),
        maximumDraws: 5,
      }),
    );
    expect(plan).toMatchObject({
      status: "no_feasible_plan",
      reason: "NO_DRAW_COUNT_MEETS_USER_CONSTRAINTS",
      constraintRelaxations: [],
      constraints: {
        maximumDraws: 5,
        remainingBudgetMinor: 200n,
        evaluatedMaximumDraws: 2,
      },
      ranking: null,
      recommendationScore: null,
    });
    if (plan.status !== "no_feasible_plan") {
      throw new Error("Expected no feasible plan.");
    }
    expect(fractionToString(plan.highestEvaluatedSuccessProbability)).toBe(
      "17/45",
    );
    expect(fractionToString(plan.correspondingFailureProbability)).toBe(
      "28/45",
    );

    const drawLimited = unwrap(
      buildConservativePlan(makeInput(), {
        minimumSuccessProbability: fraction(1n, 2n),
        maximumDraws: 2,
      }),
    );
    expect(drawLimited).toMatchObject({
      status: "no_feasible_plan",
      constraintRelaxations: [],
      constraints: { maximumDraws: 2, evaluatedMaximumDraws: 2 },
    });

    const probabilityLimited = unwrap(
      buildConservativePlan(makeInput(), {
        minimumSuccessProbability: fraction(9n, 10n),
        maximumDraws: 5,
      }),
    );
    expect(probabilityLimited).toMatchObject({
      status: "no_feasible_plan",
      constraintRelaxations: [],
      constraints: {
        minimumSuccessProbability: fraction(9n, 10n),
        evaluatedMaximumDraws: 5,
      },
    });
  });

  it("does not invent defaults when user constraints are missing", () => {
    const incomplete = unwrap(
      buildConservativePlan(
        makeInput({ sessionBudgetMinor: null, targets: [] }),
        {},
      ),
    );
    expect(incomplete).toEqual({
      status: "constraints_incomplete",
      missing: [
        "MINIMUM_SUCCESS_PROBABILITY_REQUIRED",
        "MAXIMUM_DRAWS_REQUIRED",
        "SESSION_BUDGET_REQUIRED",
        "TARGET_REQUIREMENTS_REQUIRED",
      ],
      disclosures: [
        "OUTCOME_NOT_GUARANTEED",
        "FAILURE_PROBABILITY_MUST_BE_SHOWN",
        "USER_CONSTRAINTS_ARE_HARD_LIMITS",
        "STOP_REMAINS_AVAILABLE",
      ],
      ranking: null,
      recommendationScore: null,
    });
  });

  it("keeps a zero threshold at zero draws instead of creating spend", () => {
    const plan = unwrap(
      buildConservativePlan(makeInput(), {
        minimumSuccessProbability: fraction(0n),
        maximumDraws: 5,
      }),
    );
    expect(plan).toMatchObject({
      status: "available",
      draws: 0,
      costMinor: 0n,
      successProbability: fraction(0n),
      failureProbability: fraction(1n),
      proof: {
        previousDraws: null,
        previousDrawSuccessProbability: null,
      },
    });
  });

  it("uses exact joint probability for multiple required targets", () => {
    const input = makeInput({
      remainingTickets: 6,
      prizes: [
        { id: "A", label: "A赏", remaining: 1 },
        { id: "B", label: "B赏", remaining: 2 },
        { id: "OTHER", label: "其他", remaining: 3 },
      ],
      targets: [
        { prizeId: "A", available: 1, required: 1 },
        { prizeId: "B", available: 2, required: 1 },
      ],
      unitPriceMinor: 100n,
      sessionBudgetMinor: 200n,
    });
    const plan = unwrap(
      buildConservativePlan(input, {
        minimumSuccessProbability: fraction(2n, 15n),
        maximumDraws: 2,
      }),
    );
    expect(plan).toMatchObject({
      status: "available",
      draws: 2,
      costMinor: 200n,
    });
    if (plan.status !== "available")
      throw new Error("Expected an available plan.");
    expect(fractionToString(plan.successProbability)).toBe("2/15");
    expect(fractionToString(plan.failureProbability)).toBe("13/15");
  });

  it("rejects probability thresholds outside zero to one", () => {
    expect(
      buildConservativePlan(makeInput(), {
        minimumSuccessProbability: fraction(2n),
        maximumDraws: 5,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: "INVALID_PROBABILITY_THRESHOLD" },
    });
  });

  it("proves minimum-draw and hard-limit properties across small pools", () => {
    for (let remaining = 1; remaining <= 16; remaining += 1) {
      for (let targets = 1; targets <= remaining; targets += 1) {
        for (
          let thresholdDraws = 1;
          thresholdDraws <= remaining;
          thresholdDraws += 1
        ) {
          const threshold = unwrap(
            atLeastOneHitProbability(remaining, targets, thresholdDraws),
          );
          const input = makeInput({
            remainingTickets: remaining,
            prizes: [
              { id: "A", label: "A赏", remaining: targets },
              {
                id: "OTHER",
                label: "其他",
                remaining: remaining - targets,
              },
            ],
            targets: [{ prizeId: "A", available: targets, required: 1 }],
            unitPriceMinor: 7n,
            sessionBudgetMinor: BigInt(remaining * 7),
          });
          const result = unwrap(
            buildConservativePlan(input, {
              minimumSuccessProbability: threshold,
              maximumDraws: thresholdDraws,
            }),
          );
          expect(result.status).toBe("available");
          if (result.status !== "available") continue;
          expect(result.draws).toBeLessThanOrEqual(thresholdDraws);
          expect(result.costMinor).toBeLessThanOrEqual(
            input.sessionBudgetMinor!,
          );
          expect(
            compareFractions(result.successProbability, threshold),
          ).toBeGreaterThanOrEqual(0);
          expect(
            addFractions(result.successProbability, result.failureProbability),
          ).toEqual(fraction(1n));
          if (result.proof.previousDrawSuccessProbability !== null) {
            expect(
              compareFractions(
                result.proof.previousDrawSuccessProbability,
                threshold,
              ),
            ).toBeLessThan(0);
          }
        }
      }
    }
  });
});

describe("Last prize guarantee", () => {
  it("states a guarantee only for a confirmed-rule buyout", () => {
    expect(unwrap(evaluateLastPrizeGuarantee(makeInput(), true))).toEqual({
      status: "guaranteed_by_buyout",
      requiredDraws: 10,
      costMinor: 1000n,
      availability: "not_executable",
      partialDrawProbability: null,
      disclosure: "LAST_GUARANTEE_REQUIRES_CONFIRMED_RULE_AND_BUYOUT",
    });
    expect(
      unwrap(
        evaluateLastPrizeGuarantee(
          makeInput({ sessionBudgetMinor: 1200n }),
          true,
        ),
      ),
    ).toMatchObject({
      status: "guaranteed_by_buyout",
      availability: "executable",
      partialDrawProbability: null,
    });
    expect(
      unwrap(
        evaluateLastPrizeGuarantee(
          makeInput({ sessionBudgetMinor: null }),
          true,
        ),
      ),
    ).toMatchObject({
      status: "guaranteed_by_buyout",
      availability: "budget_unknown",
      partialDrawProbability: null,
    });
  });

  it("never invents a partial-draw probability", () => {
    expect(unwrap(evaluateLastPrizeGuarantee(makeInput(), false))).toEqual({
      status: "not_guaranteed",
      reason: "RULE_UNCONFIRMED",
      partialDrawProbability: null,
      disclosure: "LAST_GUARANTEE_REQUIRES_CONFIRMED_RULE_AND_BUYOUT",
    });
    expect(
      unwrap(
        evaluateLastPrizeGuarantee(
          makeInput({ remainingTickets: 0, prizes: [] }),
          true,
        ),
      ),
    ).toEqual({
      status: "not_guaranteed",
      reason: "NO_REMAINING_TICKETS",
      partialDrawProbability: null,
      disclosure: "LAST_GUARANTEE_REQUIRES_CONFIRMED_RULE_AND_BUYOUT",
    });
  });
});

describe("validated input fixture", () => {
  it("remains constructible through the public validator", () => {
    const validated = validateCalculationInput({
      remainingTickets: 10,
      prizes: [
        { id: "A", label: "A赏", remaining: 2 },
        { id: "OTHER", label: "其他", remaining: 8 },
      ],
      unitPriceMinor: 100,
      targets: [{ prizeId: "A", available: 2, required: 1 }],
      sessionBudgetMinor: 500,
    });
    expect(validated.status).toBe("calculable");
  });
});
