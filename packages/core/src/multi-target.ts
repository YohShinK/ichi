import { combinationOrZero } from "./combinatorics.js";
import { coreError, type CoreError } from "./errors.js";
import { fraction, type Fraction } from "./fraction.js";
import { validateCount } from "./integer.js";
import { err, ok, type Result } from "./result.js";
import type { TargetRequirement } from "./types.js";

export const meetAllTargetRequirementsProbability = (
  remainingTickets: number,
  plannedDraws: number,
  targets: readonly TargetRequirement[],
): Result<Fraction, CoreError> => {
  const remaining = validateCount(
    remainingTickets,
    "remainingTickets",
    "NEGATIVE_REMAINING_TICKETS",
  );
  if (!remaining.ok) return remaining;
  const draws = validateCount(
    plannedDraws,
    "plannedDraws",
    "NEGATIVE_PLANNED_DRAWS",
  );
  if (!draws.ok) return draws;
  if (plannedDraws > remainingTickets) {
    return err(
      coreError(
        "DRAWS_EXCEED_REMAINING",
        "plannedDraws must not exceed remainingTickets.",
        "plannedDraws",
      ),
    );
  }

  const ids = new Set<string>();
  let targetTicketTotal = 0;
  for (const [index, target] of targets.entries()) {
    if (ids.has(target.prizeId)) {
      return err(
        coreError(
          "DUPLICATE_TARGET_ID",
          `Target ${target.prizeId} appears more than once.`,
          `targets[${index}].prizeId`,
        ),
      );
    }
    ids.add(target.prizeId);
    const available = validateCount(
      target.available,
      `targets[${index}].available`,
      "NEGATIVE_TARGET_TICKETS",
    );
    if (!available.ok) return available;
    const required = validateCount(
      target.required,
      `targets[${index}].required`,
      "NEGATIVE_TARGET_TICKETS",
    );
    if (!required.ok) return required;
    if (target.required > target.available) {
      return err(
        coreError(
          "TARGET_REQUIREMENT_EXCEEDS_AVAILABLE",
          "A target requirement must not exceed its available count.",
          `targets[${index}].required`,
        ),
      );
    }
    targetTicketTotal += target.available;
  }
  if (targetTicketTotal > remainingTickets) {
    return err(
      coreError(
        "TARGETS_EXCEED_REMAINING",
        "The sum of target availability exceeds the remaining pool.",
        "targets",
      ),
    );
  }

  let waysByTargetDraws = new Map<number, bigint>([[0, 1n]]);
  for (const target of targets) {
    const nextWays = new Map<number, bigint>();
    for (const [drawnSoFar, existingWays] of waysByTargetDraws) {
      const maximumForTarget = Math.min(
        target.available,
        plannedDraws - drawnSoFar,
      );
      for (
        let targetHits = target.required;
        targetHits <= maximumForTarget;
        targetHits += 1
      ) {
        const totalDrawn = drawnSoFar + targetHits;
        const ways =
          existingWays * combinationOrZero(target.available, targetHits);
        nextWays.set(totalDrawn, (nextWays.get(totalDrawn) ?? 0n) + ways);
      }
    }
    waysByTargetDraws = nextWays;
  }

  const nonTargetTickets = remainingTickets - targetTicketTotal;
  let favorableWays = 0n;
  for (const [targetDraws, targetWays] of waysByTargetDraws) {
    favorableWays +=
      targetWays *
      combinationOrZero(nonTargetTickets, plannedDraws - targetDraws);
  }
  const allWays = combinationOrZero(remainingTickets, plannedDraws);
  return ok(fraction(favorableWays, allWays));
};
