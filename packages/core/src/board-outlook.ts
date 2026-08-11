import { addFractions, fraction, type Fraction } from "./fraction.js";
import { hitDistribution, atLeastOneHitProbability } from "./probability.js";

export const BOARD_OUTLOOK_VERSION = "board-outlook-v1.1.0" as const;

export type BoardOutlookEventId =
  | "TARGET_HIT_WITHIN_WINDOW"
  | "LARGE_PRIZE_WITHIN_WINDOW"
  | "NON_SMALL_WITHIN_WINDOW"
  | "NO_SMALL_WITHIN_WINDOW"
  | "TWO_OR_MORE_SMALL_WITHIN_WINDOW";

export type BoardOutlookEvent = {
  readonly id: BoardOutlookEventId;
  readonly probability: Fraction;
};

export type BoardOutlookInput = {
  readonly remainingTickets: number;
  readonly largeTickets: number;
  readonly smallTickets: number;
  readonly targetTickets?: number;
  readonly unitPriceMinor: bigint;
};

export type BoardOutlook = {
  readonly algorithmVersion: typeof BOARD_OUTLOOK_VERSION;
  readonly windowDraws: number;
  readonly cumulativeCostMinor: bigint;
  readonly events: readonly BoardOutlookEvent[];
};

export type BoardOutlookResult =
  | { readonly status: "available"; readonly value: BoardOutlook }
  | {
      readonly status: "unavailable";
      readonly reason: "EMPTY_POOL" | "INVALID_INPUT";
    };

const isNonNegativeSafeInteger = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0;

function isValidInput({
  remainingTickets,
  largeTickets,
  smallTickets,
  targetTickets,
  unitPriceMinor,
}: BoardOutlookInput): boolean {
  return (
    isNonNegativeSafeInteger(remainingTickets) &&
    isNonNegativeSafeInteger(largeTickets) &&
    isNonNegativeSafeInteger(smallTickets) &&
    (targetTickets === undefined || isNonNegativeSafeInteger(targetTickets)) &&
    largeTickets <= remainingTickets &&
    smallTickets <= remainingTickets &&
    (targetTickets === undefined || targetTickets <= remainingTickets) &&
    unitPriceMinor >= 0n
  );
}

function atLeastOne(
  remainingTickets: number,
  matchingTickets: number,
  windowDraws: number,
): Fraction {
  const result = atLeastOneHitProbability(
    remainingTickets,
    matchingTickets,
    windowDraws,
  );
  if (!result.ok) {
    throw new Error("Validated board outlook input must be calculable.");
  }
  return result.value;
}

function twoOrMore(
  remainingTickets: number,
  matchingTickets: number,
  windowDraws: number,
): Fraction {
  const distribution = hitDistribution(
    remainingTickets,
    matchingTickets,
    windowDraws,
  );
  if (!distribution.ok) {
    throw new Error("Validated board outlook input must be calculable.");
  }
  return distribution.value
    .filter((entry) => entry.hits >= 2)
    .reduce(
      (total, entry) => addFractions(total, entry.probability),
      fraction(0n),
    );
}

export function calculateBoardOutlook(
  input: BoardOutlookInput,
): BoardOutlookResult {
  if (!isValidInput(input)) {
    return { status: "unavailable", reason: "INVALID_INPUT" };
  }
  if (input.remainingTickets === 0) {
    return { status: "unavailable", reason: "EMPTY_POOL" };
  }

  const windowDraws = Math.min(3, input.remainingTickets);
  const events: BoardOutlookEvent[] = [];
  const targetTickets = input.targetTickets ?? 0;
  const nonSmallTickets = input.remainingTickets - input.smallTickets;

  if (targetTickets > 0) {
    events.push({
      id: "TARGET_HIT_WITHIN_WINDOW",
      probability: atLeastOne(
        input.remainingTickets,
        targetTickets,
        windowDraws,
      ),
    });
  }
  if (input.largeTickets > 0) {
    events.push({
      id: "LARGE_PRIZE_WITHIN_WINDOW",
      probability: atLeastOne(
        input.remainingTickets,
        input.largeTickets,
        windowDraws,
      ),
    });
  }
  if (input.smallTickets === 0) {
    events.push({ id: "NO_SMALL_WITHIN_WINDOW", probability: fraction(1n) });
  } else if (nonSmallTickets > 0) {
    events.push({
      id: "NON_SMALL_WITHIN_WINDOW",
      probability: atLeastOne(
        input.remainingTickets,
        nonSmallTickets,
        windowDraws,
      ),
    });
  }
  if (input.smallTickets >= 2 && windowDraws >= 2) {
    events.push({
      id: "TWO_OR_MORE_SMALL_WITHIN_WINDOW",
      probability: twoOrMore(
        input.remainingTickets,
        input.smallTickets,
        windowDraws,
      ),
    });
  }

  return {
    status: "available",
    value: {
      algorithmVersion: BOARD_OUTLOOK_VERSION,
      windowDraws,
      cumulativeCostMinor: input.unitPriceMinor * BigInt(windowDraws),
      events,
    },
  };
}
