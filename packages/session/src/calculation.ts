import {
  FORMULA_VERSION,
  nextDrawHitProbability,
  type Result,
} from "@ichi/core";

import { sessionError, type SessionError } from "./errors.js";
import type {
  SessionCalculationSnapshot,
  SessionPrizePool,
  SessionTarget,
} from "./types.js";

export const calculateSessionSnapshot = (
  pool: SessionPrizePool,
  targets: readonly SessionTarget[],
  capturedAt: string,
): Result<SessionCalculationSnapshot, SessionError> => {
  if (pool.remainingTickets === 0) {
    return {
      ok: true,
      value: {
        formulaVersion: FORMULA_VERSION,
        capturedAt,
        remainingTickets: 0,
        targetTickets: 0,
        nextDrawHitProbability: null,
        unavailableReason: "EMPTY_POOL",
      },
    };
  }

  const targetIds = new Set(targets.map((target) => target.prizeId));
  const targetTickets = pool.prizes
    .filter((prize) => targetIds.has(prize.id))
    .reduce((sum, prize) => sum + prize.remaining, 0);
  const probability = nextDrawHitProbability(
    pool.remainingTickets,
    targetTickets,
  );
  if (!probability.ok) {
    return {
      ok: false,
      error: sessionError(
        "INVALID_SESSION",
        probability.error.message,
        probability.error.field,
      ),
    };
  }

  return {
    ok: true,
    value: {
      formulaVersion: FORMULA_VERSION,
      capturedAt,
      remainingTickets: pool.remainingTickets,
      targetTickets,
      nextDrawHitProbability: probability.value,
      unavailableReason: null,
    },
  };
};
