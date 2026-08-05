import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { fractionToString } from "./fraction.js";
import { maxAffordableDraws, plannedCost, buyoutCost } from "./money.js";
import { meetAllTargetRequirementsProbability } from "./multi-target.js";
import {
  atLeastOneHitProbability,
  expectedDrawsToFirstHit,
  expectedTargetCount,
  hitDistribution,
  nextDrawHitProbability,
} from "./probability.js";
import { unwrap } from "./test-helpers.js";
import type { TargetRequirement } from "./types.js";

interface SingleTargetVector {
  readonly id: string;
  readonly kind: "single_target";
  readonly input: {
    readonly remainingTickets: number;
    readonly targetTickets: number;
    readonly plannedDraws: number;
    readonly unitPriceMinor: number;
    readonly remainingBudgetMinor: number;
  };
  readonly expected: {
    readonly nextDrawHitProbability?: string;
    readonly atLeastOneHitProbability?: string;
    readonly hitDistribution?: Readonly<Record<string, string>>;
    readonly expectedTargetCount?: string;
    readonly expectedDrawsToFirstHit?: string | null;
    readonly plannedCostMinor?: number;
    readonly buyoutCostMinor?: number;
    readonly maxAffordableDraws?: number;
  };
}

interface MultiTargetVector {
  readonly id: string;
  readonly kind: "multiple_targets";
  readonly input: {
    readonly remainingTickets: number;
    readonly plannedDraws: number;
    readonly targets: readonly {
      readonly id: string;
      readonly available: number;
      readonly required: number;
    }[];
  };
  readonly expected: { readonly meetAllRequirementsProbability: string };
}

interface BudgetVector {
  readonly id: string;
  readonly kind: "budget_boundary";
  readonly input: {
    readonly remainingTickets: number;
    readonly unitPriceMinor: number;
    readonly remainingBudgetMinor: number;
  };
  readonly expected: { readonly maxAffordableDraws: number };
}

interface InvalidVector {
  readonly id: string;
  readonly kind: "invalid_input";
  readonly input: {
    readonly remainingTickets: number;
    readonly targetTickets: number;
    readonly plannedDraws: number;
  };
  readonly expected: { readonly error: string };
}

type BaselineVector =
  SingleTargetVector | MultiTargetVector | BudgetVector | InvalidVector;

const baseline = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "data/calculation-baseline/vectors.json"),
    "utf8",
  ),
) as { readonly vectors: readonly BaselineVector[] };

describe("V1-A fixed calculation vectors", () => {
  it("replays every approved vector", () => {
    expect(baseline.vectors).toHaveLength(10);
    for (const vector of baseline.vectors) {
      if (vector.kind === "single_target") {
        const { input, expected } = vector;
        if (expected.nextDrawHitProbability !== undefined) {
          expect(
            fractionToString(
              unwrap(
                nextDrawHitProbability(
                  input.remainingTickets,
                  input.targetTickets,
                ),
              ),
            ),
            vector.id,
          ).toBe(expected.nextDrawHitProbability);
        }
        if (expected.atLeastOneHitProbability !== undefined) {
          expect(
            fractionToString(
              unwrap(
                atLeastOneHitProbability(
                  input.remainingTickets,
                  input.targetTickets,
                  input.plannedDraws,
                ),
              ),
            ),
            vector.id,
          ).toBe(expected.atLeastOneHitProbability);
        }
        if (expected.hitDistribution !== undefined) {
          const actual = Object.fromEntries(
            unwrap(
              hitDistribution(
                input.remainingTickets,
                input.targetTickets,
                input.plannedDraws,
              ),
            ).map((entry) => [entry.hits, fractionToString(entry.probability)]),
          );
          expect(actual, vector.id).toEqual(expected.hitDistribution);
        }
        if (expected.expectedTargetCount !== undefined) {
          expect(
            fractionToString(
              unwrap(
                expectedTargetCount(
                  input.remainingTickets,
                  input.targetTickets,
                  input.plannedDraws,
                ),
              ),
            ),
            vector.id,
          ).toBe(expected.expectedTargetCount);
        }
        if (expected.expectedDrawsToFirstHit !== undefined) {
          const actual = expectedDrawsToFirstHit(
            input.remainingTickets,
            input.targetTickets,
          );
          expect(
            actual.ok ? fractionToString(actual.value) : null,
            vector.id,
          ).toBe(expected.expectedDrawsToFirstHit);
        }
        if (expected.plannedCostMinor !== undefined) {
          expect(
            unwrap(plannedCost(input.unitPriceMinor, input.plannedDraws)),
            vector.id,
          ).toBe(BigInt(expected.plannedCostMinor));
        }
        if (expected.buyoutCostMinor !== undefined) {
          expect(
            unwrap(buyoutCost(input.remainingTickets, input.unitPriceMinor)),
            vector.id,
          ).toBe(BigInt(expected.buyoutCostMinor));
        }
        if (expected.maxAffordableDraws !== undefined) {
          expect(
            unwrap(
              maxAffordableDraws(
                input.remainingBudgetMinor,
                input.unitPriceMinor,
                input.remainingTickets,
              ),
            ),
            vector.id,
          ).toBe(expected.maxAffordableDraws);
        }
      } else if (vector.kind === "multiple_targets") {
        const targets: readonly TargetRequirement[] = vector.input.targets.map(
          (target) => ({
            prizeId: target.id,
            available: target.available,
            required: target.required,
          }),
        );
        expect(
          fractionToString(
            unwrap(
              meetAllTargetRequirementsProbability(
                vector.input.remainingTickets,
                vector.input.plannedDraws,
                targets,
              ),
            ),
          ),
          vector.id,
        ).toBe(vector.expected.meetAllRequirementsProbability);
      } else if (vector.kind === "budget_boundary") {
        expect(
          unwrap(
            maxAffordableDraws(
              vector.input.remainingBudgetMinor,
              vector.input.unitPriceMinor,
              vector.input.remainingTickets,
            ),
          ),
          vector.id,
        ).toBe(vector.expected.maxAffordableDraws);
      } else {
        const actual = atLeastOneHitProbability(
          vector.input.remainingTickets,
          vector.input.targetTickets,
          vector.input.plannedDraws,
        );
        expect(actual, vector.id).toMatchObject({
          ok: false,
          error: { code: vector.expected.error },
        });
      }
    }
  });
});
