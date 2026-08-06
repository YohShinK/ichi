import type { Result } from "@ichi/core";

import { calculateSessionSnapshot } from "./calculation.js";
import type { SessionError } from "./errors.js";
import { cloneSessionPool } from "./session.js";
import type { CopySessionInput, DrawSession } from "./types.js";

const cloneJsonRecord = (
  value: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> =>
  JSON.parse(JSON.stringify(value)) as Readonly<Record<string, unknown>>;

export const copySession = (
  source: DrawSession,
  input: CopySessionInput,
): Result<DrawSession, SessionError> => {
  const copiedPool = {
    ...cloneSessionPool(source.currentPool, input.startedAt),
    id: input.newPoolId ?? `${input.newSessionId}:pool`,
  };
  const calculation = calculateSessionSnapshot(
    copiedPool,
    source.targets,
    input.startedAt,
  );
  if (!calculation.ok) return calculation;

  return {
    ok: true,
    value: {
      schemaVersion: 1,
      id: input.newSessionId,
      startedAt: input.startedAt,
      updatedAt: input.startedAt,
      initialPool: cloneSessionPool(copiedPool),
      currentPool: copiedPool,
      poolRevision: 0,
      targets: source.targets.map((target) => ({ ...target })),
      budget: {
        ...source.budget,
        stopConditions: [...source.budget.stopConditions],
      },
      spentMinor: 0n,
      rounds: [],
      activity: { state: "idle" },
      calculation: calculation.value,
      boardSnapshot:
        source.boardSnapshot === null
          ? null
          : {
              ...source.boardSnapshot,
              confirmedDraft: cloneJsonRecord(
                source.boardSnapshot.confirmedDraft,
              ),
            },
    },
  };
};
