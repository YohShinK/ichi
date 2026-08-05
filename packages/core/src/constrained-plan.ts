import { coreError, type CoreError } from "./errors.js";
import {
  compareFractions,
  fraction,
  subtractFractions,
  type Fraction,
} from "./fraction.js";
import { validateCount } from "./integer.js";
import { buyoutCost, maxAffordableDraws, plannedCost } from "./money.js";
import { meetAllTargetRequirementsProbability } from "./multi-target.js";
import { err, ok, type Result } from "./result.js";
import {
  FORMULA_VERSION,
  type MoneyMinor,
  type ValidatedCalculationInput,
} from "./types.js";

export const CONSERVATIVE_PLAN_DISCLOSURES = Object.freeze([
  "OUTCOME_NOT_GUARANTEED",
  "FAILURE_PROBABILITY_MUST_BE_SHOWN",
  "USER_CONSTRAINTS_ARE_HARD_LIMITS",
  "STOP_REMAINS_AVAILABLE",
] as const);

export type ConservativePlanDisclosure =
  (typeof CONSERVATIVE_PLAN_DISCLOSURES)[number];

export interface ConservativePlanConstraints {
  readonly minimumSuccessProbability?: Fraction;
  readonly maximumDraws?: number;
}

export type MissingConservativeConstraint =
  | "MINIMUM_SUCCESS_PROBABILITY_REQUIRED"
  | "MAXIMUM_DRAWS_REQUIRED"
  | "SESSION_BUDGET_REQUIRED"
  | "TARGET_REQUIREMENTS_REQUIRED";

interface EvaluatedConstraints {
  readonly minimumSuccessProbability: Fraction;
  readonly maximumDraws: number;
  readonly remainingBudgetMinor: MoneyMinor;
  readonly evaluatedMaximumDraws: number;
}

export interface AvailableConservativePlan {
  readonly status: "available";
  readonly label: "MINIMUM_DRAWS_WITHIN_USER_CONSTRAINTS";
  readonly draws: number;
  readonly costMinor: MoneyMinor;
  readonly successProbability: Fraction;
  readonly failureProbability: Fraction;
  readonly constraints: EvaluatedConstraints;
  readonly proof: {
    readonly formulaVersion: typeof FORMULA_VERSION;
    readonly previousDraws: number | null;
    readonly previousDrawSuccessProbability: Fraction | null;
    readonly previousDrawMeetsThreshold: false;
  };
  readonly disclosures: readonly ConservativePlanDisclosure[];
  readonly ranking: null;
  readonly recommendationScore: null;
}

export interface NoFeasibleConservativePlan {
  readonly status: "no_feasible_plan";
  readonly reason: "NO_DRAW_COUNT_MEETS_USER_CONSTRAINTS";
  readonly highestEvaluatedSuccessProbability: Fraction;
  readonly correspondingFailureProbability: Fraction;
  readonly constraints: EvaluatedConstraints;
  readonly constraintRelaxations: readonly [];
  readonly disclosures: readonly ConservativePlanDisclosure[];
  readonly ranking: null;
  readonly recommendationScore: null;
}

export interface IncompleteConservativePlan {
  readonly status: "constraints_incomplete";
  readonly missing: readonly MissingConservativeConstraint[];
  readonly disclosures: readonly ConservativePlanDisclosure[];
  readonly ranking: null;
  readonly recommendationScore: null;
}

export type ConservativePlanResult =
  | AvailableConservativePlan
  | NoFeasibleConservativePlan
  | IncompleteConservativePlan;

const normalizeProbabilityThreshold = (
  value: Fraction,
): Result<Fraction, CoreError> => {
  if (
    value.denominator <= 0n ||
    value.numerator < 0n ||
    value.numerator > value.denominator
  ) {
    return err(
      coreError(
        "INVALID_PROBABILITY_THRESHOLD",
        "minimumSuccessProbability must be between 0 and 1 inclusive.",
        "minimumSuccessProbability",
      ),
    );
  }
  return ok(fraction(value.numerator, value.denominator));
};

const targetSuccessProbability = (
  input: ValidatedCalculationInput,
  draws: number,
): Result<Fraction, CoreError> =>
  meetAllTargetRequirementsProbability(
    input.remainingTickets,
    draws,
    input.targets,
  );

export const buildConservativePlan = (
  input: ValidatedCalculationInput,
  constraints: ConservativePlanConstraints,
): Result<ConservativePlanResult, CoreError> => {
  const missing: MissingConservativeConstraint[] = [];
  if (constraints.minimumSuccessProbability === undefined) {
    missing.push("MINIMUM_SUCCESS_PROBABILITY_REQUIRED");
  }
  if (constraints.maximumDraws === undefined) {
    missing.push("MAXIMUM_DRAWS_REQUIRED");
  }
  if (input.sessionBudgetMinor === null) {
    missing.push("SESSION_BUDGET_REQUIRED");
  }
  if (input.targets.length === 0) {
    missing.push("TARGET_REQUIREMENTS_REQUIRED");
  }
  if (missing.length > 0) {
    return ok({
      status: "constraints_incomplete",
      missing,
      disclosures: CONSERVATIVE_PLAN_DISCLOSURES,
      ranking: null,
      recommendationScore: null,
    });
  }

  const threshold = normalizeProbabilityThreshold(
    constraints.minimumSuccessProbability as Fraction,
  );
  if (!threshold.ok) return threshold;
  const maximumDraws = validateCount(
    constraints.maximumDraws as number,
    "maximumDraws",
    "NEGATIVE_PLANNED_DRAWS",
  );
  if (!maximumDraws.ok) return maximumDraws;

  const remainingBudgetMinor =
    (input.sessionBudgetMinor as bigint) - input.spentMinor;
  if (remainingBudgetMinor < 0n) {
    return err(
      coreError(
        "SPENT_EXCEEDS_BUDGET",
        "spentMinor must not exceed sessionBudgetMinor.",
        "spentMinor",
      ),
    );
  }
  const affordableDraws = maxAffordableDraws(
    remainingBudgetMinor,
    input.unitPriceMinor,
    input.remainingTickets,
  );
  if (!affordableDraws.ok) return affordableDraws;
  const evaluatedMaximumDraws = Math.min(
    input.remainingTickets,
    maximumDraws.value,
    affordableDraws.value,
  );
  const evaluatedConstraints: EvaluatedConstraints = {
    minimumSuccessProbability: threshold.value,
    maximumDraws: maximumDraws.value,
    remainingBudgetMinor,
    evaluatedMaximumDraws,
  };

  let previousProbability: Fraction | null = null;
  for (let draws = 0; draws <= evaluatedMaximumDraws; draws += 1) {
    const successProbability = targetSuccessProbability(input, draws);
    if (!successProbability.ok) return successProbability;
    if (compareFractions(successProbability.value, threshold.value) >= 0) {
      const cost = plannedCost(input.unitPriceMinor, draws);
      if (!cost.ok) return cost;
      return ok({
        status: "available",
        label: "MINIMUM_DRAWS_WITHIN_USER_CONSTRAINTS",
        draws,
        costMinor: cost.value,
        successProbability: successProbability.value,
        failureProbability: subtractFractions(
          fraction(1n),
          successProbability.value,
        ),
        constraints: evaluatedConstraints,
        proof: {
          formulaVersion: FORMULA_VERSION,
          previousDraws: draws === 0 ? null : draws - 1,
          previousDrawSuccessProbability: previousProbability,
          previousDrawMeetsThreshold: false,
        },
        disclosures: CONSERVATIVE_PLAN_DISCLOSURES,
        ranking: null,
        recommendationScore: null,
      });
    }
    previousProbability = successProbability.value;
  }

  const highestEvaluatedSuccessProbability =
    previousProbability ?? fraction(0n);
  return ok({
    status: "no_feasible_plan",
    reason: "NO_DRAW_COUNT_MEETS_USER_CONSTRAINTS",
    highestEvaluatedSuccessProbability,
    correspondingFailureProbability: subtractFractions(
      fraction(1n),
      highestEvaluatedSuccessProbability,
    ),
    constraints: evaluatedConstraints,
    constraintRelaxations: [],
    disclosures: CONSERVATIVE_PLAN_DISCLOSURES,
    ranking: null,
    recommendationScore: null,
  });
};

export type LastPrizeGuarantee =
  | {
      readonly status: "guaranteed_by_buyout";
      readonly requiredDraws: number;
      readonly costMinor: MoneyMinor;
      readonly availability: "executable" | "not_executable" | "budget_unknown";
      readonly partialDrawProbability: null;
      readonly disclosure: "LAST_GUARANTEE_REQUIRES_CONFIRMED_RULE_AND_BUYOUT";
    }
  | {
      readonly status: "not_guaranteed";
      readonly reason: "RULE_UNCONFIRMED" | "NO_REMAINING_TICKETS";
      readonly partialDrawProbability: null;
      readonly disclosure: "LAST_GUARANTEE_REQUIRES_CONFIRMED_RULE_AND_BUYOUT";
    };

export const evaluateLastPrizeGuarantee = (
  input: ValidatedCalculationInput,
  lastPrizeRuleConfirmed: boolean,
): Result<LastPrizeGuarantee, CoreError> => {
  if (input.remainingTickets === 0) {
    return ok({
      status: "not_guaranteed",
      reason: "NO_REMAINING_TICKETS",
      partialDrawProbability: null,
      disclosure: "LAST_GUARANTEE_REQUIRES_CONFIRMED_RULE_AND_BUYOUT",
    });
  }
  if (!lastPrizeRuleConfirmed) {
    return ok({
      status: "not_guaranteed",
      reason: "RULE_UNCONFIRMED",
      partialDrawProbability: null,
      disclosure: "LAST_GUARANTEE_REQUIRES_CONFIRMED_RULE_AND_BUYOUT",
    });
  }

  const cost = buyoutCost(input.remainingTickets, input.unitPriceMinor);
  if (!cost.ok) return cost;
  if (
    input.sessionBudgetMinor !== null &&
    input.spentMinor > input.sessionBudgetMinor
  ) {
    return err(
      coreError(
        "SPENT_EXCEEDS_BUDGET",
        "spentMinor must not exceed sessionBudgetMinor.",
        "spentMinor",
      ),
    );
  }
  const remainingBudgetMinor =
    input.sessionBudgetMinor === null
      ? null
      : input.sessionBudgetMinor - input.spentMinor;
  return ok({
    status: "guaranteed_by_buyout",
    requiredDraws: input.remainingTickets,
    costMinor: cost.value,
    availability:
      remainingBudgetMinor === null
        ? "budget_unknown"
        : cost.value <= remainingBudgetMinor
          ? "executable"
          : "not_executable",
    partialDrawProbability: null,
    disclosure: "LAST_GUARANTEE_REQUIRES_CONFIRMED_RULE_AND_BUYOUT",
  });
};
