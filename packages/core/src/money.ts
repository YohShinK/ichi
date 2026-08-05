import { coreError, type CoreError } from "./errors.js";
import { toBigInt } from "./integer.js";
import { err, ok, type Result } from "./result.js";
import type { IntegerLike, MoneyMinor } from "./types.js";

const money = (
  value: IntegerLike,
  field: string,
): Result<MoneyMinor, CoreError> => {
  const integer = toBigInt(value, field);
  if (!integer.ok) return integer;
  if (integer.value < 0n) {
    return err(
      coreError("NEGATIVE_MONEY", `${field} must not be negative.`, field),
    );
  }
  return ok(integer.value);
};

export const plannedCost = (
  unitPriceMinor: IntegerLike,
  plannedDraws: number,
): Result<MoneyMinor, CoreError> => {
  const unitPrice = money(unitPriceMinor, "unitPriceMinor");
  if (!unitPrice.ok) return unitPrice;
  if (!Number.isSafeInteger(plannedDraws) || plannedDraws < 0) {
    return err(
      coreError(
        plannedDraws < 0 ? "NEGATIVE_PLANNED_DRAWS" : "NON_INTEGER_INPUT",
        "plannedDraws must be a non-negative safe integer.",
        "plannedDraws",
      ),
    );
  }
  return ok(unitPrice.value * BigInt(plannedDraws));
};

export const accumulatedCost = (
  spentMinor: IntegerLike,
  roundCostMinor: IntegerLike,
): Result<MoneyMinor, CoreError> => {
  const spent = money(spentMinor, "spentMinor");
  if (!spent.ok) return spent;
  const round = money(roundCostMinor, "roundCostMinor");
  if (!round.ok) return round;
  return ok(spent.value + round.value);
};

export const remainingBudget = (
  sessionBudgetMinor: IntegerLike,
  spentMinor: IntegerLike,
): Result<MoneyMinor, CoreError> => {
  const budget = money(sessionBudgetMinor, "sessionBudgetMinor");
  if (!budget.ok) return budget;
  const spent = money(spentMinor, "spentMinor");
  if (!spent.ok) return spent;
  if (spent.value > budget.value) {
    return err(
      coreError(
        "SPENT_EXCEEDS_BUDGET",
        "spentMinor must not exceed sessionBudgetMinor.",
        "spentMinor",
      ),
    );
  }
  return ok(budget.value - spent.value);
};

export const buyoutCost = (
  remainingTickets: number,
  unitPriceMinor: IntegerLike,
): Result<MoneyMinor, CoreError> => {
  if (!Number.isSafeInteger(remainingTickets) || remainingTickets < 0) {
    return err(
      coreError(
        remainingTickets < 0
          ? "NEGATIVE_REMAINING_TICKETS"
          : "NON_INTEGER_INPUT",
        "remainingTickets must be a non-negative safe integer.",
        "remainingTickets",
      ),
    );
  }
  return plannedCost(unitPriceMinor, remainingTickets);
};

export const maxAffordableDraws = (
  remainingBudgetMinor: IntegerLike,
  unitPriceMinor: IntegerLike,
  remainingTickets: number,
): Result<number, CoreError> => {
  const budget = money(remainingBudgetMinor, "remainingBudgetMinor");
  if (!budget.ok) return budget;
  const unitPrice = money(unitPriceMinor, "unitPriceMinor");
  if (!unitPrice.ok) return unitPrice;
  if (!Number.isSafeInteger(remainingTickets) || remainingTickets < 0) {
    return err(
      coreError(
        remainingTickets < 0
          ? "NEGATIVE_REMAINING_TICKETS"
          : "NON_INTEGER_INPUT",
        "remainingTickets must be a non-negative safe integer.",
        "remainingTickets",
      ),
    );
  }
  if (unitPrice.value === 0n) return ok(remainingTickets);
  const affordable = budget.value / unitPrice.value;
  return ok(
    affordable >= BigInt(remainingTickets)
      ? remainingTickets
      : Number(affordable),
  );
};

export type DirectPurchaseComparison =
  | { readonly status: "unknown" }
  | {
      readonly status: "reference_available";
      readonly referenceMinor: MoneyMinor;
      readonly plannedDrawMinusDirectMinor: bigint;
      readonly buyoutMinusDirectMinor: bigint;
    };

export const compareDirectPurchaseReference = (
  directPurchaseReferenceMinor: IntegerLike | undefined,
  plannedCostMinor: IntegerLike,
  buyoutCostMinor: IntegerLike,
): Result<DirectPurchaseComparison, CoreError> => {
  if (directPurchaseReferenceMinor === undefined)
    return ok({ status: "unknown" });
  const reference = money(
    directPurchaseReferenceMinor,
    "directPurchaseReferenceMinor",
  );
  if (!reference.ok) return reference;
  const planned = money(plannedCostMinor, "plannedCostMinor");
  if (!planned.ok) return planned;
  const buyout = money(buyoutCostMinor, "buyoutCostMinor");
  if (!buyout.ok) return buyout;
  return ok({
    status: "reference_available",
    referenceMinor: reference.value,
    plannedDrawMinusDirectMinor: planned.value - reference.value,
    buyoutMinusDirectMinor: buyout.value - reference.value,
  });
};
