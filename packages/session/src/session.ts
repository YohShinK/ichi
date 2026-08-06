import type { Result } from "@ichi/core";

import { calculateSessionSnapshot } from "./calculation.js";
import { sessionError, type SessionError } from "./errors.js";
import type {
  ConfirmedDrawRound,
  CreateSessionInput,
  DrawRound,
  DrawSession,
  SessionAction,
  SessionBudget,
  SessionPrizePool,
  SessionTarget,
} from "./types.js";

const DEFAULT_BUDGET: SessionBudget = {
  sessionBudgetMinor: null,
  maxPlannedDraws: null,
  minimumSuccessProbability: null,
  stopConditions: [],
};

const clonePool = (
  pool: SessionPrizePool,
  updatedAt = pool.updatedAt,
): SessionPrizePool => ({
  id: pool.id,
  ...(pool.seriesAlias === undefined ? {} : { seriesAlias: pool.seriesAlias }),
  remainingTickets: pool.remainingTickets,
  prizes: pool.prizes.map((prize) => ({
    id: prize.id,
    label: prize.label,
    ...(prize.name === undefined ? {} : { name: prize.name }),
    remaining: prize.remaining,
  })),
  unitPriceMinor: pool.unitPriceMinor,
  lastPrizeRuleConfirmed: pool.lastPrizeRuleConfirmed,
  updatedAt,
});

const validatePool = (pool: SessionPrizePool): SessionError | null => {
  if (
    !Number.isSafeInteger(pool.remainingTickets) ||
    pool.remainingTickets < 0 ||
    pool.unitPriceMinor < 0n
  ) {
    return sessionError(
      "INVALID_SESSION",
      "Pool totals and price must be non-negative integers.",
      "pool",
    );
  }
  const ids = new Set<string>();
  let remaining = 0;
  for (const prize of pool.prizes) {
    if (ids.has(prize.id)) {
      return sessionError(
        "DUPLICATE_ID",
        `Duplicate prize id: ${prize.id}.`,
        "pool.prizes",
      );
    }
    ids.add(prize.id);
    if (!Number.isSafeInteger(prize.remaining) || prize.remaining < 0) {
      return sessionError(
        "INVALID_SESSION",
        `Prize ${prize.id} has an invalid remaining count.`,
        "pool.prizes",
      );
    }
    remaining += prize.remaining;
  }
  if (remaining !== pool.remainingTickets) {
    return sessionError(
      "INVALID_SESSION",
      "Prize remaining counts must equal the pool remaining total.",
      "pool.remainingTickets",
    );
  }
  return null;
};

const validateTargets = (
  pool: SessionPrizePool,
  targets: readonly SessionTarget[],
): SessionError | null => {
  const prizeIds = new Set(pool.prizes.map((prize) => prize.id));
  const targetIds = new Set<string>();
  for (const target of targets) {
    if (!prizeIds.has(target.prizeId)) {
      return sessionError(
        "TARGET_NOT_FOUND",
        `Target prize ${target.prizeId} is not in the pool.`,
        "targets",
      );
    }
    if (targetIds.has(target.prizeId)) {
      return sessionError(
        "DUPLICATE_ID",
        `Duplicate target prize id: ${target.prizeId}.`,
        "targets",
      );
    }
    if (!Number.isSafeInteger(target.required) || target.required <= 0) {
      return sessionError(
        "INVALID_SESSION",
        "Target required quantity must be a positive integer.",
        "targets.required",
      );
    }
    targetIds.add(target.prizeId);
  }
  return null;
};

const normalizeBudget = (
  budget: Partial<SessionBudget> | undefined,
): SessionBudget => ({
  sessionBudgetMinor:
    budget?.sessionBudgetMinor ?? DEFAULT_BUDGET.sessionBudgetMinor,
  maxPlannedDraws: budget?.maxPlannedDraws ?? DEFAULT_BUDGET.maxPlannedDraws,
  minimumSuccessProbability:
    budget?.minimumSuccessProbability ??
    DEFAULT_BUDGET.minimumSuccessProbability,
  stopConditions: [...(budget?.stopConditions ?? [])],
});

export const createSession = (
  input: CreateSessionInput,
): Result<DrawSession, SessionError> => {
  const poolError = validatePool(input.pool);
  if (poolError !== null) return { ok: false, error: poolError };
  const targets = [...(input.targets ?? [])];
  const targetError = validateTargets(input.pool, targets);
  if (targetError !== null) return { ok: false, error: targetError };
  const budget = normalizeBudget(input.budget);
  if (
    (budget.sessionBudgetMinor !== null && budget.sessionBudgetMinor < 0n) ||
    (budget.maxPlannedDraws !== null &&
      (!Number.isSafeInteger(budget.maxPlannedDraws) ||
        budget.maxPlannedDraws < 0)) ||
    (budget.minimumSuccessProbability !== null &&
      (budget.minimumSuccessProbability.denominator <= 0n ||
        budget.minimumSuccessProbability.numerator < 0n ||
        budget.minimumSuccessProbability.numerator >
          budget.minimumSuccessProbability.denominator))
  ) {
    return {
      ok: false,
      error: sessionError(
        "INVALID_SESSION",
        "Budget, maximum planned draws and probability threshold must be valid.",
        "budget",
      ),
    };
  }
  const pool = clonePool(input.pool, input.startedAt);
  const calculation = calculateSessionSnapshot(pool, targets, input.startedAt);
  if (!calculation.ok) return calculation;

  return {
    ok: true,
    value: {
      schemaVersion: 1,
      id: input.id,
      startedAt: input.startedAt,
      updatedAt: input.startedAt,
      initialPool: clonePool(pool),
      currentPool: pool,
      poolRevision: 0,
      targets,
      budget,
      spentMinor: 0n,
      rounds: [],
      activity: { state: "idle" },
      calculation: calculation.value,
      boardSnapshot: input.boardSnapshot ?? null,
    },
  };
};

const selectPrize = (
  session: DrawSession,
  prizeId: string,
): Result<DrawSession, SessionError> => {
  const prize = session.currentPool.prizes.find((item) => item.id === prizeId);
  if (prize === undefined) {
    return {
      ok: false,
      error: sessionError(
        "PRIZE_NOT_FOUND",
        `Prize ${prizeId} is not in the current pool.`,
        "prizeId",
      ),
    };
  }
  if (prize.remaining === 0) {
    return {
      ok: false,
      error: sessionError(
        "PRIZE_UNAVAILABLE",
        `Prize ${prizeId} has no remaining tickets.`,
        "prizeId",
      ),
    };
  }
  return {
    ok: true,
    value: { ...session, activity: { state: "draft", prizeId } },
  };
};

const confirmDraft = (
  session: DrawSession,
  roundId: string,
  occurredAt: string,
): Result<DrawSession, SessionError> => {
  if (session.activity.state !== "draft") {
    return {
      ok: false,
      error: sessionError("NO_DRAFT", "There is no draw draft to confirm."),
    };
  }
  const draftPrizeId = session.activity.prizeId;
  if (session.rounds.some((round) => round.id === roundId)) {
    return {
      ok: false,
      error: sessionError(
        "DUPLICATE_ID",
        `Round id ${roundId} already exists.`,
        "roundId",
      ),
    };
  }
  const selectedPrize = session.currentPool.prizes.find(
    (prize) => prize.id === draftPrizeId,
  );
  if (selectedPrize === undefined || selectedPrize.remaining === 0) {
    return {
      ok: false,
      error: sessionError(
        "PRIZE_UNAVAILABLE",
        `Prize ${draftPrizeId} cannot be confirmed.`,
        "activity.prizeId",
      ),
    };
  }
  if (session.currentPool.remainingTickets === 0) {
    return {
      ok: false,
      error: sessionError("EMPTY_POOL", "The current pool is empty."),
    };
  }

  const nextPoolRevision = session.poolRevision + 1;
  const nextPool: SessionPrizePool = {
    ...clonePool(session.currentPool, occurredAt),
    remainingTickets: session.currentPool.remainingTickets - 1,
    prizes: session.currentPool.prizes.map((prize) =>
      prize.id === selectedPrize.id
        ? { ...prize, remaining: prize.remaining - 1 }
        : { ...prize },
    ),
  };
  const nextCalculation = calculateSessionSnapshot(
    nextPool,
    session.targets,
    occurredAt,
  );
  if (!nextCalculation.ok) return nextCalculation;

  const nextSpent = session.spentMinor + session.currentPool.unitPriceMinor;
  const round: ConfirmedDrawRound = {
    id: roundId,
    prizeId: selectedPrize.id,
    quantity: 1,
    costMinor: session.currentPool.unitPriceMinor,
    occurredAt,
    status: "confirmed",
    before: {
      pool: clonePool(session.currentPool),
      spentMinor: session.spentMinor,
      calculation: session.calculation,
      poolRevision: session.poolRevision,
    },
    after: {
      pool: clonePool(nextPool),
      spentMinor: nextSpent,
      calculation: nextCalculation.value,
      poolRevision: nextPoolRevision,
    },
  };

  return {
    ok: true,
    value: {
      ...session,
      currentPool: nextPool,
      poolRevision: nextPoolRevision,
      spentMinor: nextSpent,
      rounds: [...session.rounds, round],
      activity: { state: "confirmed", roundId },
      calculation: nextCalculation.value,
      updatedAt: occurredAt,
    },
  };
};

const undoLastRound = (
  session: DrawSession,
  undoneAt: string,
): Result<DrawSession, SessionError> => {
  if (session.activity.state === "draft") {
    return {
      ok: false,
      error: sessionError(
        "DRAFT_MUST_BE_CLEARED",
        "Clear the current draft before undoing the last round.",
      ),
    };
  }
  const latest = session.rounds.at(-1);
  if (latest === undefined) {
    return {
      ok: false,
      error: sessionError(
        "NO_CONFIRMED_ROUND",
        "There is no confirmed round to undo.",
      ),
    };
  }
  if (latest.status === "undone") {
    return {
      ok: false,
      error: sessionError(
        "ROUND_ALREADY_UNDONE",
        "The latest round has already been undone.",
      ),
    };
  }
  if (session.poolRevision !== latest.after.poolRevision) {
    return {
      ok: false,
      error: sessionError(
        "BASELINE_CHANGED",
        "The pool baseline changed after the last round; undo is unsafe.",
      ),
    };
  }
  const undoneRound: DrawRound = {
    ...latest,
    status: "undone",
    undoneAt,
  };
  return {
    ok: true,
    value: {
      ...session,
      currentPool: clonePool(latest.before.pool, undoneAt),
      poolRevision: session.poolRevision + 1,
      spentMinor: latest.before.spentMinor,
      rounds: [...session.rounds.slice(0, -1), undoneRound],
      activity: { state: "undone", roundId: latest.id },
      calculation: {
        ...latest.before.calculation,
        capturedAt: undoneAt,
      },
      updatedAt: undoneAt,
    },
  };
};

export const reduceSession = (
  session: DrawSession,
  action: SessionAction,
): Result<DrawSession, SessionError> => {
  switch (action.type) {
    case "SELECT_PRIZE":
      return selectPrize(session, action.prizeId);
    case "CLEAR_DRAFT":
      return session.activity.state === "draft"
        ? { ok: true, value: { ...session, activity: { state: "idle" } } }
        : {
            ok: false,
            error: sessionError(
              "INVALID_TRANSITION",
              "Only a draft can be cleared.",
            ),
          };
    case "START_NEXT_ROUND":
      return session.activity.state === "confirmed" ||
        session.activity.state === "undone"
        ? { ok: true, value: { ...session, activity: { state: "idle" } } }
        : {
            ok: false,
            error: sessionError(
              "INVALID_TRANSITION",
              "A next round can only start after confirmation or undo.",
            ),
          };
    case "CONFIRM_DRAFT":
      return confirmDraft(session, action.roundId, action.occurredAt);
    case "UNDO_LAST_ROUND":
      return undoLastRound(session, action.undoneAt);
  }
};

export const cloneSessionPool = clonePool;
