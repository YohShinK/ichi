import { combinationOrZero } from "./combinatorics.js";
import { coreError, type CoreError } from "./errors.js";
import { fraction, subtractFractions, type Fraction } from "./fraction.js";
import { validateCount } from "./integer.js";
import { err, ok, type Result } from "./result.js";
import type { HitDistributionEntry, ProbabilitySummary } from "./types.js";
import { FORMULA_VERSION } from "./types.js";

interface ValidatedProbabilityInput {
  readonly remainingTickets: number;
  readonly targetTickets: number;
  readonly plannedDraws: number;
}

const validateProbabilityInput = (
  remainingTickets: number,
  targetTickets: number,
  plannedDraws: number,
): Result<ValidatedProbabilityInput, CoreError> => {
  const remaining = validateCount(
    remainingTickets,
    "remainingTickets",
    "NEGATIVE_REMAINING_TICKETS",
  );
  if (!remaining.ok) return remaining;
  const target = validateCount(
    targetTickets,
    "targetTickets",
    "NEGATIVE_TARGET_TICKETS",
  );
  if (!target.ok) return target;
  const draws = validateCount(
    plannedDraws,
    "plannedDraws",
    "NEGATIVE_PLANNED_DRAWS",
  );
  if (!draws.ok) return draws;
  if (targetTickets > remainingTickets) {
    return err(
      coreError(
        "TARGET_EXCEEDS_REMAINING",
        "targetTickets must not exceed remainingTickets.",
        "targetTickets",
      ),
    );
  }
  if (plannedDraws > remainingTickets) {
    return err(
      coreError(
        "DRAWS_EXCEED_REMAINING",
        "plannedDraws must not exceed remainingTickets.",
        "plannedDraws",
      ),
    );
  }
  return ok({ remainingTickets, targetTickets, plannedDraws });
};

export const nextDrawHitProbability = (
  remainingTickets: number,
  targetTickets: number,
): Result<Fraction, CoreError> => {
  const input = validateProbabilityInput(remainingTickets, targetTickets, 0);
  if (!input.ok) return input;
  if (remainingTickets === 0) {
    return err(
      coreError("EMPTY_POOL", "A next draw does not exist in an empty pool."),
    );
  }
  return ok(fraction(BigInt(targetTickets), BigInt(remainingTickets)));
};

export const atLeastOneHitProbability = (
  remainingTickets: number,
  targetTickets: number,
  plannedDraws: number,
): Result<Fraction, CoreError> => {
  const input = validateProbabilityInput(
    remainingTickets,
    targetTickets,
    plannedDraws,
  );
  if (!input.ok) return input;
  if (plannedDraws === 0 || targetTickets === 0) return ok(fraction(0n));

  const denominator = combinationOrZero(remainingTickets, plannedDraws);
  const missWays = combinationOrZero(
    remainingTickets - targetTickets,
    plannedDraws,
  );
  return ok(subtractFractions(fraction(1n), fraction(missWays, denominator)));
};

export const hitDistribution = (
  remainingTickets: number,
  targetTickets: number,
  plannedDraws: number,
): Result<readonly HitDistributionEntry[], CoreError> => {
  const input = validateProbabilityInput(
    remainingTickets,
    targetTickets,
    plannedDraws,
  );
  if (!input.ok) return input;

  const denominator = combinationOrZero(remainingTickets, plannedDraws);
  const minimumHits = Math.max(
    0,
    plannedDraws - (remainingTickets - targetTickets),
  );
  const maximumHits = Math.min(plannedDraws, targetTickets);
  const entries: HitDistributionEntry[] = [];
  for (let hits = minimumHits; hits <= maximumHits; hits += 1) {
    const ways =
      combinationOrZero(targetTickets, hits) *
      combinationOrZero(remainingTickets - targetTickets, plannedDraws - hits);
    entries.push({ hits, probability: fraction(ways, denominator) });
  }
  return ok(entries);
};

export const expectedTargetCount = (
  remainingTickets: number,
  targetTickets: number,
  plannedDraws: number,
): Result<Fraction, CoreError> => {
  const input = validateProbabilityInput(
    remainingTickets,
    targetTickets,
    plannedDraws,
  );
  if (!input.ok) return input;
  if (remainingTickets === 0) {
    return plannedDraws === 0
      ? ok(fraction(0n))
      : err(
          coreError("EMPTY_POOL", "Expected count requires a non-empty pool."),
        );
  }
  return ok(
    fraction(
      BigInt(plannedDraws) * BigInt(targetTickets),
      BigInt(remainingTickets),
    ),
  );
};

export const expectedDrawsToFirstHit = (
  remainingTickets: number,
  targetTickets: number,
): Result<Fraction, CoreError> => {
  const input = validateProbabilityInput(remainingTickets, targetTickets, 0);
  if (!input.ok) return input;
  if (targetTickets === 0) {
    return err(
      coreError(
        "TARGET_UNAVAILABLE",
        "No finite first-hit expectation exists when no target remains.",
        "targetTickets",
      ),
    );
  }
  return ok(fraction(BigInt(remainingTickets + 1), BigInt(targetTickets + 1)));
};

export const probabilitySummary = (
  remainingTickets: number,
  targetTickets: number,
  plannedDraws: number,
): Result<ProbabilitySummary, CoreError> => {
  const next = nextDrawHitProbability(remainingTickets, targetTickets);
  if (!next.ok) return next;
  const atLeastOne = atLeastOneHitProbability(
    remainingTickets,
    targetTickets,
    plannedDraws,
  );
  if (!atLeastOne.ok) return atLeastOne;
  const distribution = hitDistribution(
    remainingTickets,
    targetTickets,
    plannedDraws,
  );
  if (!distribution.ok) return distribution;
  const expectedCount = expectedTargetCount(
    remainingTickets,
    targetTickets,
    plannedDraws,
  );
  if (!expectedCount.ok) return expectedCount;
  const expectedFirst = expectedDrawsToFirstHit(
    remainingTickets,
    targetTickets,
  );

  return ok({
    formulaVersion: FORMULA_VERSION,
    nextDrawHitProbability: next.value,
    atLeastOneHitProbability: atLeastOne.value,
    hitDistribution: distribution.value,
    expectedTargetCount: expectedCount.value,
    expectedDrawsToFirstHit: expectedFirst.ok ? expectedFirst.value : null,
    ...(expectedFirst.ok
      ? {}
      : { expectedDrawsReason: "TARGET_UNAVAILABLE" as const }),
  });
};
