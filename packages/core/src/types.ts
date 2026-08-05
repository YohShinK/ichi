import type { Fraction } from "./fraction.js";

export const FORMULA_VERSION = "1.0.0" as const;

export type IntegerLike = number | bigint;
export type MoneyMinor = bigint;

export interface PrizeInput {
  readonly id: string;
  readonly label: string;
  readonly remaining: number;
}

export interface TargetRequirement {
  readonly prizeId: string;
  readonly available: number;
  readonly required: number;
}

export interface PrizePoolInput {
  readonly remainingTickets?: number;
  readonly prizes?: readonly PrizeInput[];
  readonly unitPriceMinor?: IntegerLike;
}

export interface CalculationRequest extends PrizePoolInput {
  readonly targets?: readonly TargetRequirement[];
  readonly plannedDraws?: number;
  readonly sessionBudgetMinor?: IntegerLike;
  readonly spentMinor?: IntegerLike;
  readonly directPurchaseReferenceMinor?: IntegerLike;
}

export interface ProbabilitySummary {
  readonly formulaVersion: typeof FORMULA_VERSION;
  readonly nextDrawHitProbability: Fraction;
  readonly atLeastOneHitProbability: Fraction;
  readonly hitDistribution: readonly HitDistributionEntry[];
  readonly expectedTargetCount: Fraction;
  readonly expectedDrawsToFirstHit: Fraction | null;
  readonly expectedDrawsReason?: "TARGET_UNAVAILABLE";
}

export interface HitDistributionEntry {
  readonly hits: number;
  readonly probability: Fraction;
}

export type InputIssueCode =
  | "MISSING_REMAINING_TICKETS"
  | "MISSING_PRIZES"
  | "MISSING_UNIT_PRICE"
  | "NON_INTEGER_VALUE"
  | "NEGATIVE_VALUE"
  | "DUPLICATE_PRIZE_ID"
  | "PRIZE_SUM_MISMATCH"
  | "TARGET_NOT_FOUND"
  | "DUPLICATE_TARGET_ID"
  | "TARGET_AVAILABILITY_MISMATCH"
  | "TARGETS_EXCEED_REMAINING"
  | "TARGET_REQUIREMENT_EXCEEDS_AVAILABLE"
  | "PLANNED_DRAWS_EXCEED_REMAINING"
  | "SPENT_EXCEEDS_BUDGET";

export interface InputIssue {
  readonly code: InputIssueCode;
  readonly field: string;
  readonly message: string;
}

export type InputValidation =
  | {
      readonly status: "calculable";
      readonly issues: readonly [];
      readonly value: ValidatedCalculationInput;
    }
  | {
      readonly status: "insufficient_information" | "contradictory";
      readonly issues: readonly InputIssue[];
    };

export interface ValidatedCalculationInput {
  readonly remainingTickets: number;
  readonly prizes: readonly PrizeInput[];
  readonly unitPriceMinor: MoneyMinor;
  readonly targets: readonly TargetRequirement[];
  readonly plannedDraws: number;
  readonly sessionBudgetMinor: MoneyMinor | null;
  readonly spentMinor: MoneyMinor;
  readonly directPurchaseReferenceMinor: MoneyMinor | null;
}
