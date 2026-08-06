import type { DrawSession } from "@ichi/session";

import type { SessionCollection, StorageError } from "./types.js";
import { STORAGE_SCHEMA_VERSION } from "./types.js";

const BIGINT_TAG = "__ichi_bigint_v1__" as const;

interface EncodedBigInt {
  readonly [BIGINT_TAG]: string;
}

interface StorageEnvelopeV1 {
  readonly schemaVersion: typeof STORAGE_SCHEMA_VERSION;
  readonly savedAt: string;
  readonly payload: SessionCollection;
}

interface StorageEnvelopeV0 {
  readonly schemaVersion: 0;
  readonly savedAt: string;
  readonly payload: {
    readonly records: readonly DrawSession[];
    readonly currentSessionId: string | null;
  };
}

export type DecodedEnvelope =
  | {
      readonly ok: true;
      readonly status: "current" | "migrated";
      readonly savedAt: string;
      readonly value: SessionCollection;
    }
  | { readonly ok: false; readonly error: StorageError };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isEncodedBigInt = (value: unknown): value is EncodedBigInt =>
  isRecord(value) &&
  Object.keys(value).length === 1 &&
  typeof value[BIGINT_TAG] === "string" &&
  /^-?(0|[1-9]\d*)$/.test(value[BIGINT_TAG]);

const encodeBigInts = (_key: string, value: unknown): unknown =>
  typeof value === "bigint" ? { [BIGINT_TAG]: value.toString(10) } : value;

const decodeBigInts = (_key: string, value: unknown): unknown =>
  isEncodedBigInt(value) ? BigInt(value[BIGINT_TAG]) : value;

const invalidPayload = (message: string): DecodedEnvelope => ({
  ok: false,
  error: { code: "INVALID_PAYLOAD", message },
});

const isFraction = (
  value: unknown,
): value is { readonly numerator: bigint; readonly denominator: bigint } =>
  isRecord(value) &&
  typeof value.numerator === "bigint" &&
  typeof value.denominator === "bigint" &&
  value.denominator > 0n;

const isProbabilityFraction = (value: unknown): boolean =>
  isFraction(value) &&
  value.numerator >= 0n &&
  value.numerator <= value.denominator;

const isPrizePool = (value: unknown): boolean => {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.remainingTickets !== "number" ||
    !Number.isSafeInteger(value.remainingTickets) ||
    typeof value.unitPriceMinor !== "bigint" ||
    value.unitPriceMinor < 0n ||
    typeof value.lastPrizeRuleConfirmed !== "boolean" ||
    typeof value.updatedAt !== "string" ||
    !Array.isArray(value.prizes)
  ) {
    return false;
  }
  const ids = new Set();
  let total = 0;
  for (const prize of value.prizes) {
    if (
      !isRecord(prize) ||
      typeof prize.id !== "string" ||
      ids.has(prize.id) ||
      typeof prize.label !== "string" ||
      typeof prize.remaining !== "number" ||
      !Number.isSafeInteger(prize.remaining) ||
      prize.remaining < 0
    ) {
      return false;
    }
    ids.add(prize.id);
    total += prize.remaining;
  }
  return total === value.remainingTickets;
};

const isCalculation = (value: unknown): boolean =>
  isRecord(value) &&
  typeof value.formulaVersion === "string" &&
  typeof value.capturedAt === "string" &&
  Number.isSafeInteger(value.remainingTickets) &&
  Number.isSafeInteger(value.targetTickets) &&
  (value.nextDrawHitProbability === null ||
    isProbabilityFraction(value.nextDrawHitProbability)) &&
  (value.unavailableReason === null ||
    value.unavailableReason === "EMPTY_POOL");

const isRoundSnapshot = (value: unknown): boolean =>
  isRecord(value) &&
  isPrizePool(value.pool) &&
  typeof value.spentMinor === "bigint" &&
  value.spentMinor >= 0n &&
  isCalculation(value.calculation) &&
  typeof value.poolRevision === "number" &&
  Number.isSafeInteger(value.poolRevision) &&
  value.poolRevision >= 0;

const isRound = (value: unknown): boolean =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.prizeId === "string" &&
  value.quantity === 1 &&
  typeof value.costMinor === "bigint" &&
  value.costMinor >= 0n &&
  typeof value.occurredAt === "string" &&
  (value.status === "confirmed" ||
    (value.status === "undone" && typeof value.undoneAt === "string")) &&
  isRoundSnapshot(value.before) &&
  isRoundSnapshot(value.after);

const isActivity = (value: unknown): boolean => {
  if (!isRecord(value) || typeof value.state !== "string") return false;
  if (value.state === "idle") return true;
  if (value.state === "draft") return typeof value.prizeId === "string";
  if (value.state === "confirmed" || value.state === "undone") {
    return typeof value.roundId === "string";
  }
  return false;
};

const isDrawSession = (value: unknown): value is DrawSession => {
  if (!isRecord(value)) return false;
  return (
    value.schemaVersion === 1 &&
    typeof value.id === "string" &&
    typeof value.startedAt === "string" &&
    typeof value.updatedAt === "string" &&
    typeof value.spentMinor === "bigint" &&
    value.spentMinor >= 0n &&
    typeof value.poolRevision === "number" &&
    Number.isSafeInteger(value.poolRevision) &&
    value.poolRevision >= 0 &&
    isPrizePool(value.initialPool) &&
    isPrizePool(value.currentPool) &&
    Array.isArray(value.targets) &&
    value.targets.every(
      (target) =>
        isRecord(target) &&
        typeof target.prizeId === "string" &&
        typeof target.required === "number" &&
        Number.isSafeInteger(target.required) &&
        target.required > 0,
    ) &&
    isRecord(value.budget) &&
    (value.budget.sessionBudgetMinor === null ||
      (typeof value.budget.sessionBudgetMinor === "bigint" &&
        value.budget.sessionBudgetMinor >= 0n)) &&
    (value.budget.maxPlannedDraws === null ||
      (typeof value.budget.maxPlannedDraws === "number" &&
        Number.isSafeInteger(value.budget.maxPlannedDraws) &&
        value.budget.maxPlannedDraws >= 0)) &&
    (value.budget.minimumSuccessProbability === null ||
      isProbabilityFraction(value.budget.minimumSuccessProbability)) &&
    Array.isArray(value.budget.stopConditions) &&
    value.budget.stopConditions.every((item) => typeof item === "string") &&
    Array.isArray(value.rounds) &&
    value.rounds.every(isRound) &&
    isActivity(value.activity) &&
    isCalculation(value.calculation) &&
    (value.boardSnapshot === null || isRecord(value.boardSnapshot))
  );
};

const isCollection = (value: unknown): value is SessionCollection => {
  if (!isRecord(value) || !Array.isArray(value.sessions)) return false;
  if (
    value.activeSessionId !== null &&
    typeof value.activeSessionId !== "string"
  ) {
    return false;
  }
  if (!value.sessions.every(isDrawSession)) return false;
  const ids = new Set(value.sessions.map((session) => session.id));
  return (
    ids.size === value.sessions.length &&
    (value.activeSessionId === null || ids.has(value.activeSessionId))
  );
};

export const serializeSessionCollection = (
  value: SessionCollection,
  savedAt: string,
): string => {
  const envelope: StorageEnvelopeV1 = {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    savedAt,
    payload: value,
  };
  return JSON.stringify(envelope, encodeBigInts);
};

export const deserializeSessionCollection = (raw: unknown): DecodedEnvelope => {
  if (typeof raw !== "string" || raw.length === 0) {
    return invalidPayload(
      "Stored session data must be a non-empty JSON string.",
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw, decodeBigInts) as unknown;
  } catch {
    return invalidPayload("Stored session data is not valid JSON.");
  }
  if (!isRecord(parsed) || typeof parsed.schemaVersion !== "number") {
    return invalidPayload("Stored session data has no schema version.");
  }
  if (typeof parsed.savedAt !== "string") {
    return invalidPayload("Stored session data has no save timestamp.");
  }

  if (parsed.schemaVersion === STORAGE_SCHEMA_VERSION) {
    if (!isCollection(parsed.payload)) {
      return invalidPayload("Stored V1 session payload is invalid.");
    }
    return {
      ok: true,
      status: "current",
      savedAt: parsed.savedAt,
      value: parsed.payload,
    };
  }

  if (parsed.schemaVersion === 0) {
    const legacy = parsed as unknown as StorageEnvelopeV0;
    if (
      !isRecord(legacy.payload) ||
      !Array.isArray(legacy.payload.records) ||
      !legacy.payload.records.every(isDrawSession) ||
      (legacy.payload.currentSessionId !== null &&
        typeof legacy.payload.currentSessionId !== "string")
    ) {
      return {
        ok: false,
        error: {
          code: "MIGRATION_FAILED",
          message: "Legacy V0 session payload cannot be migrated safely.",
        },
      };
    }
    const migrated: SessionCollection = {
      sessions: legacy.payload.records,
      activeSessionId: legacy.payload.currentSessionId,
    };
    if (!isCollection(migrated)) {
      return {
        ok: false,
        error: {
          code: "MIGRATION_FAILED",
          message: "Migrated V0 session payload violates V1 invariants.",
        },
      };
    }
    return {
      ok: true,
      status: "migrated",
      savedAt: parsed.savedAt,
      value: migrated,
    };
  }

  return {
    ok: false,
    error: {
      code: "UNSUPPORTED_STORAGE_VERSION",
      message: `Storage schema version ${String(parsed.schemaVersion)} is not supported.`,
    },
  };
};

export const serializeLegacyV0ForMigrationTest = (
  sessions: readonly DrawSession[],
  activeSessionId: string | null,
  savedAt: string,
): string =>
  JSON.stringify(
    {
      schemaVersion: 0,
      savedAt,
      payload: { records: sessions, currentSessionId: activeSessionId },
    } satisfies StorageEnvelopeV0,
    encodeBigInts,
  );
