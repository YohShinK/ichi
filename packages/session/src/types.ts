import type { Fraction } from "@ichi/core";

export const SESSION_SCHEMA_VERSION = 1 as const;
export const BOARD_SNAPSHOT_VERSION = 1 as const;

export interface SessionPrize {
  readonly id: string;
  readonly label: string;
  readonly name?: string;
  readonly remaining: number;
}

export interface SessionPrizePool {
  readonly id: string;
  readonly seriesAlias?: string;
  readonly remainingTickets: number;
  readonly prizes: readonly SessionPrize[];
  readonly unitPriceMinor: bigint;
  readonly lastPrizeRuleConfirmed: boolean;
  readonly updatedAt: string;
}

export interface SessionTarget {
  readonly prizeId: string;
  readonly required: number;
}

export interface SessionBudget {
  readonly sessionBudgetMinor: bigint | null;
  readonly maxPlannedDraws: number | null;
  readonly minimumSuccessProbability: Fraction | null;
  readonly stopConditions: readonly string[];
}

export interface SessionCalculationSnapshot {
  readonly formulaVersion: string;
  readonly capturedAt: string;
  readonly remainingTickets: number;
  readonly targetTickets: number;
  readonly nextDrawHitProbability: Fraction | null;
  readonly unavailableReason: "EMPTY_POOL" | null;
}

export interface BoardLayoutSnapshot {
  readonly snapshotVersion: typeof BOARD_SNAPSHOT_VERSION;
  readonly boardSchemaVersion: string;
  readonly componentRegistryId: string;
  readonly recognitionContractVersion: string;
  readonly confirmedDraft: Readonly<Record<string, unknown>>;
}

export interface SessionRoundSnapshot {
  readonly pool: SessionPrizePool;
  readonly spentMinor: bigint;
  readonly calculation: SessionCalculationSnapshot;
  readonly poolRevision: number;
}

export interface ConfirmedDrawRound {
  readonly id: string;
  readonly prizeId: string;
  readonly quantity: 1;
  readonly costMinor: bigint;
  readonly occurredAt: string;
  readonly status: "confirmed";
  readonly before: SessionRoundSnapshot;
  readonly after: SessionRoundSnapshot;
}

export interface UndoneDrawRound extends Omit<ConfirmedDrawRound, "status"> {
  readonly status: "undone";
  readonly undoneAt: string;
}

export type DrawRound = ConfirmedDrawRound | UndoneDrawRound;

export type SessionActivity =
  | { readonly state: "idle" }
  | { readonly state: "draft"; readonly prizeId: string }
  | { readonly state: "confirmed"; readonly roundId: string }
  | { readonly state: "undone"; readonly roundId: string };

export interface DrawSession {
  readonly schemaVersion: typeof SESSION_SCHEMA_VERSION;
  readonly id: string;
  readonly startedAt: string;
  readonly updatedAt: string;
  readonly initialPool: SessionPrizePool;
  readonly currentPool: SessionPrizePool;
  readonly poolRevision: number;
  readonly targets: readonly SessionTarget[];
  readonly budget: SessionBudget;
  readonly spentMinor: bigint;
  readonly rounds: readonly DrawRound[];
  readonly activity: SessionActivity;
  readonly calculation: SessionCalculationSnapshot;
  readonly boardSnapshot: BoardLayoutSnapshot | null;
}

export interface CreateSessionInput {
  readonly id: string;
  readonly startedAt: string;
  readonly pool: SessionPrizePool;
  readonly targets?: readonly SessionTarget[];
  readonly budget?: Partial<SessionBudget>;
  readonly boardSnapshot?: BoardLayoutSnapshot | null;
}

export type SessionAction =
  | { readonly type: "SELECT_PRIZE"; readonly prizeId: string }
  | { readonly type: "CLEAR_DRAFT" }
  | { readonly type: "START_NEXT_ROUND" }
  | {
      readonly type: "CONFIRM_DRAFT";
      readonly roundId: string;
      readonly occurredAt: string;
    }
  | { readonly type: "UNDO_LAST_ROUND"; readonly undoneAt: string };

export interface CopySessionInput {
  readonly newSessionId: string;
  readonly startedAt: string;
  readonly newPoolId?: string;
}
