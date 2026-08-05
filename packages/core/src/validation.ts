import { toBigInt } from "./integer.js";
import type {
  CalculationRequest,
  InputIssue,
  InputValidation,
  MoneyMinor,
  PrizeInput,
  TargetRequirement,
} from "./types.js";

const issue = (
  code: InputIssue["code"],
  field: string,
  message: string,
): InputIssue => ({ code, field, message });

const nonNegativeMoney = (
  value: CalculationRequest["unitPriceMinor"],
  field: string,
  contradictions: InputIssue[],
): MoneyMinor | null => {
  if (value === undefined) return null;
  const converted = toBigInt(value, field);
  if (!converted.ok) {
    contradictions.push(
      issue("NON_INTEGER_VALUE", field, converted.error.message),
    );
    return null;
  }
  if (converted.value < 0n) {
    contradictions.push(
      issue("NEGATIVE_VALUE", field, `${field} must not be negative.`),
    );
    return null;
  }
  return converted.value;
};

const isNonNegativeSafeInteger = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0;

export const validateCalculationInput = (
  input: CalculationRequest,
): InputValidation => {
  const missing: InputIssue[] = [];
  const contradictions: InputIssue[] = [];

  if (input.remainingTickets === undefined) {
    missing.push(
      issue(
        "MISSING_REMAINING_TICKETS",
        "remainingTickets",
        "Remaining ticket count is required.",
      ),
    );
  } else if (!Number.isSafeInteger(input.remainingTickets)) {
    contradictions.push(
      issue(
        "NON_INTEGER_VALUE",
        "remainingTickets",
        "Remaining ticket count must be a safe integer.",
      ),
    );
  } else if (input.remainingTickets < 0) {
    contradictions.push(
      issue(
        "NEGATIVE_VALUE",
        "remainingTickets",
        "Remaining ticket count must not be negative.",
      ),
    );
  }

  if (input.prizes === undefined || input.prizes.length === 0) {
    missing.push(
      issue("MISSING_PRIZES", "prizes", "At least one prize is required."),
    );
  }

  const prizes: readonly PrizeInput[] = input.prizes ?? [];
  const prizeIds = new Set<string>();
  let prizeSum = 0;
  for (const [index, prize] of prizes.entries()) {
    if (prizeIds.has(prize.id)) {
      contradictions.push(
        issue(
          "DUPLICATE_PRIZE_ID",
          `prizes[${index}].id`,
          `Prize ID ${prize.id} is duplicated.`,
        ),
      );
    }
    prizeIds.add(prize.id);
    if (!isNonNegativeSafeInteger(prize.remaining)) {
      contradictions.push(
        issue(
          Number.isInteger(prize.remaining)
            ? "NEGATIVE_VALUE"
            : "NON_INTEGER_VALUE",
          `prizes[${index}].remaining`,
          "Prize remaining count must be a non-negative safe integer.",
        ),
      );
    } else {
      prizeSum += prize.remaining;
    }
  }
  if (
    input.remainingTickets !== undefined &&
    isNonNegativeSafeInteger(input.remainingTickets) &&
    prizes.length > 0 &&
    prizeSum !== input.remainingTickets
  ) {
    contradictions.push(
      issue(
        "PRIZE_SUM_MISMATCH",
        "prizes",
        "The sum of prize remaining counts must equal remainingTickets.",
      ),
    );
  }

  if (input.unitPriceMinor === undefined) {
    missing.push(
      issue("MISSING_UNIT_PRICE", "unitPriceMinor", "Unit price is required."),
    );
  }
  const unitPriceMinor = nonNegativeMoney(
    input.unitPriceMinor,
    "unitPriceMinor",
    contradictions,
  );
  const sessionBudgetMinor = nonNegativeMoney(
    input.sessionBudgetMinor,
    "sessionBudgetMinor",
    contradictions,
  );
  const spentMinor =
    nonNegativeMoney(input.spentMinor ?? 0, "spentMinor", contradictions) ?? 0n;
  const directPurchaseReferenceMinor = nonNegativeMoney(
    input.directPurchaseReferenceMinor,
    "directPurchaseReferenceMinor",
    contradictions,
  );
  if (sessionBudgetMinor !== null && spentMinor > sessionBudgetMinor) {
    contradictions.push(
      issue(
        "SPENT_EXCEEDS_BUDGET",
        "spentMinor",
        "Spent amount must not exceed the session budget.",
      ),
    );
  }

  const plannedDraws = input.plannedDraws ?? 0;
  if (!isNonNegativeSafeInteger(plannedDraws)) {
    contradictions.push(
      issue(
        Number.isInteger(plannedDraws) ? "NEGATIVE_VALUE" : "NON_INTEGER_VALUE",
        "plannedDraws",
        "Planned draws must be a non-negative safe integer.",
      ),
    );
  } else if (
    input.remainingTickets !== undefined &&
    isNonNegativeSafeInteger(input.remainingTickets) &&
    plannedDraws > input.remainingTickets
  ) {
    contradictions.push(
      issue(
        "PLANNED_DRAWS_EXCEED_REMAINING",
        "plannedDraws",
        "Planned draws must not exceed remaining tickets.",
      ),
    );
  }

  const targets: readonly TargetRequirement[] = input.targets ?? [];
  const targetIds = new Set<string>();
  let targetAvailabilitySum = 0;
  for (const [index, target] of targets.entries()) {
    if (targetIds.has(target.prizeId)) {
      contradictions.push(
        issue(
          "DUPLICATE_TARGET_ID",
          `targets[${index}].prizeId`,
          `Target ${target.prizeId} appears more than once.`,
        ),
      );
      continue;
    }
    targetIds.add(target.prizeId);
    const prize = prizes.find((candidate) => candidate.id === target.prizeId);
    if (prize === undefined) {
      contradictions.push(
        issue(
          "TARGET_NOT_FOUND",
          `targets[${index}].prizeId`,
          `Target ${target.prizeId} does not exist in the prize pool.`,
        ),
      );
      continue;
    }
    if (
      !isNonNegativeSafeInteger(target.available) ||
      !isNonNegativeSafeInteger(target.required)
    ) {
      contradictions.push(
        issue(
          "NON_INTEGER_VALUE",
          `targets[${index}]`,
          "Target availability and requirement must be non-negative safe integers.",
        ),
      );
    } else if (target.available !== prize.remaining) {
      contradictions.push(
        issue(
          "TARGET_AVAILABILITY_MISMATCH",
          `targets[${index}].available`,
          "Target availability must match the current prize remaining count.",
        ),
      );
    } else if (
      target.required > prize.remaining ||
      target.required > target.available
    ) {
      contradictions.push(
        issue(
          "TARGET_REQUIREMENT_EXCEEDS_AVAILABLE",
          `targets[${index}].required`,
          "Target requirement exceeds the available prize count.",
        ),
      );
    } else {
      targetAvailabilitySum += target.available;
    }
  }
  if (
    input.remainingTickets !== undefined &&
    isNonNegativeSafeInteger(input.remainingTickets) &&
    targetAvailabilitySum > input.remainingTickets
  ) {
    contradictions.push(
      issue(
        "TARGETS_EXCEED_REMAINING",
        "targets",
        "Target availability must not exceed remaining tickets.",
      ),
    );
  }

  if (contradictions.length > 0) {
    return { status: "contradictory", issues: contradictions };
  }
  if (missing.length > 0) {
    return { status: "insufficient_information", issues: missing };
  }

  return {
    status: "calculable",
    issues: [],
    value: {
      remainingTickets: input.remainingTickets as number,
      prizes,
      unitPriceMinor: unitPriceMinor as bigint,
      targets,
      plannedDraws,
      sessionBudgetMinor,
      spentMinor,
      directPurchaseReferenceMinor,
    },
  };
};
