import type { CoreError } from "./errors.js";
import { fraction, subtractFractions, type Fraction } from "./fraction.js";
import {
  buyoutCost,
  compareDirectPurchaseReference,
  maxAffordableDraws,
  plannedCost,
} from "./money.js";
import { atLeastOneHitProbability } from "./probability.js";
import { ok, type Result } from "./result.js";
import type { MoneyMinor, ValidatedCalculationInput } from "./types.js";

export type ActionStatus =
  | "executable"
  | "not_executable"
  | "reference_only"
  | "unknown"
  | "always_available";

export interface DrawOptionExplanation {
  readonly kind: "draw";
  readonly status: ActionStatus;
  readonly plannedDraws: number;
  readonly costMinor: MoneyMinor;
  readonly atLeastOneTargetProbability: Fraction;
  readonly failureProbability: Fraction;
  readonly remainingBudgetMinor: MoneyMinor | null;
  readonly limits: readonly string[];
}

export interface BuyoutOptionExplanation {
  readonly kind: "buyout";
  readonly status: ActionStatus;
  readonly costMinor: MoneyMinor;
  readonly remainingTickets: number;
  readonly guaranteedPrizeIds: readonly string[];
  readonly lastPrizeEligibility: "depends_on_pool_rule";
  readonly remainingBudgetMinor: MoneyMinor | null;
  readonly limits: readonly string[];
}

export type DirectPurchaseOptionExplanation =
  | {
      readonly kind: "direct_purchase";
      readonly status: "unknown";
      readonly limits: readonly ["REFERENCE_NOT_PROVIDED"];
    }
  | {
      readonly kind: "direct_purchase";
      readonly status: "reference_only" | "not_executable";
      readonly referenceMinor: MoneyMinor;
      readonly plannedDrawMinusDirectMinor: bigint;
      readonly buyoutMinusDirectMinor: bigint;
      readonly remainingBudgetMinor: MoneyMinor | null;
      readonly limits: readonly string[];
    };

export interface StopOptionExplanation {
  readonly kind: "stop";
  readonly status: "always_available";
  readonly spentMinor: MoneyMinor;
  readonly remainingBudgetMinor: MoneyMinor | null;
  readonly matchedStopConditions: readonly string[];
  readonly preservedSession: true;
  readonly limits: readonly string[];
}

export interface FourOptionComparison {
  readonly draw: DrawOptionExplanation;
  readonly buyout: BuyoutOptionExplanation;
  readonly directPurchase: DirectPurchaseOptionExplanation;
  readonly stop: StopOptionExplanation;
  readonly ranking: null;
  readonly recommendationScore: null;
}

export const buildFourOptionComparison = (
  input: ValidatedCalculationInput,
  matchedStopConditions: readonly string[] = [],
): Result<FourOptionComparison, CoreError> => {
  const targetTickets = input.targets.reduce(
    (sum, target) => sum + target.available,
    0,
  );
  const probability = atLeastOneHitProbability(
    input.remainingTickets,
    targetTickets,
    input.plannedDraws,
  );
  if (!probability.ok) return probability;
  const drawCost = plannedCost(input.unitPriceMinor, input.plannedDraws);
  if (!drawCost.ok) return drawCost;
  const clearCost = buyoutCost(input.remainingTickets, input.unitPriceMinor);
  if (!clearCost.ok) return clearCost;

  const budgetRemaining =
    input.sessionBudgetMinor === null
      ? null
      : input.sessionBudgetMinor - input.spentMinor;
  const affordable =
    budgetRemaining === null
      ? null
      : maxAffordableDraws(
          budgetRemaining,
          input.unitPriceMinor,
          input.remainingTickets,
        );
  if (affordable !== null && !affordable.ok) return affordable;

  const drawWithinBudget =
    budgetRemaining === null || drawCost.value <= budgetRemaining;
  const buyoutWithinBudget =
    budgetRemaining === null || clearCost.value <= budgetRemaining;
  const drawLimits: string[] = [];
  if (budgetRemaining === null) drawLimits.push("BUDGET_NOT_SET");
  if (!drawWithinBudget) drawLimits.push("EXCEEDS_REMAINING_BUDGET");
  if (affordable?.ok && input.plannedDraws > affordable.value) {
    drawLimits.push("PLANNED_DRAWS_EXCEED_AFFORDABLE");
  }
  const buyoutLimits: string[] = [];
  if (budgetRemaining === null) buyoutLimits.push("BUDGET_NOT_SET");
  if (!buyoutWithinBudget) buyoutLimits.push("EXCEEDS_REMAINING_BUDGET");

  const direct = compareDirectPurchaseReference(
    input.directPurchaseReferenceMinor ?? undefined,
    drawCost.value,
    clearCost.value,
  );
  if (!direct.ok) return direct;
  const directPurchase: DirectPurchaseOptionExplanation =
    direct.value.status === "unknown"
      ? {
          kind: "direct_purchase",
          status: "unknown",
          limits: ["REFERENCE_NOT_PROVIDED"],
        }
      : {
          kind: "direct_purchase",
          status:
            budgetRemaining !== null &&
            direct.value.referenceMinor > budgetRemaining
              ? "not_executable"
              : "reference_only",
          referenceMinor: direct.value.referenceMinor,
          plannedDrawMinusDirectMinor: direct.value.plannedDrawMinusDirectMinor,
          buyoutMinusDirectMinor: direct.value.buyoutMinusDirectMinor,
          remainingBudgetMinor: budgetRemaining,
          limits:
            budgetRemaining !== null &&
            direct.value.referenceMinor > budgetRemaining
              ? ["EXCEEDS_REMAINING_BUDGET", "USER_PROVIDED_REFERENCE_ONLY"]
              : ["USER_PROVIDED_REFERENCE_ONLY"],
        };

  return ok({
    draw: {
      kind: "draw",
      status: drawWithinBudget ? "executable" : "not_executable",
      plannedDraws: input.plannedDraws,
      costMinor: drawCost.value,
      atLeastOneTargetProbability: probability.value,
      failureProbability: subtractFractions(fraction(1n), probability.value),
      remainingBudgetMinor: budgetRemaining,
      limits: drawLimits,
    },
    buyout: {
      kind: "buyout",
      status: buyoutWithinBudget ? "executable" : "not_executable",
      costMinor: clearCost.value,
      remainingTickets: input.remainingTickets,
      guaranteedPrizeIds: input.prizes
        .filter((prize) => prize.remaining > 0)
        .map((prize) => prize.id),
      lastPrizeEligibility: "depends_on_pool_rule",
      remainingBudgetMinor: budgetRemaining,
      limits: buyoutLimits,
    },
    directPurchase,
    stop: {
      kind: "stop",
      status: "always_available",
      spentMinor: input.spentMinor,
      remainingBudgetMinor: budgetRemaining,
      matchedStopConditions,
      preservedSession: true,
      limits: [],
    },
    ranking: null,
    recommendationScore: null,
  });
};
