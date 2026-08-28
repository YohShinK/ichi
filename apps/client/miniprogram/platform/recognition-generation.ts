import type {
  RecognitionFlowMode,
  RecognitionPrizeDraft,
} from "./recognition-flow.js";
import { toLocalPrizeStates } from "./recognition-flow.js";
import type { LocalPrizeState } from "./local-draw-drafts.js";

export type RecognitionGenerationState =
  "editing" | "generating" | "failed" | "ready";

export interface RecognitionGenerationSnapshot {
  readonly generationId: string;
  readonly mode: RecognitionFlowMode;
  readonly ipName: string;
  readonly themeName: string;
  readonly locationNote: string;
  readonly unitPrice: number;
  readonly capturedAt: number;
  readonly prizes: readonly Readonly<RecognitionPrizeDraft>[];
  readonly grandPrizeTiers: readonly string[];
}

export const createRecognitionGenerationSnapshot = (input: {
  readonly generationId: string;
  readonly mode: RecognitionFlowMode;
  readonly ipName: string;
  readonly themeName: string;
  readonly locationNote: string;
  readonly unitPrice: number;
  readonly capturedAt: number;
  readonly prizes: readonly RecognitionPrizeDraft[];
  readonly grandPrizeTiers: readonly string[];
}): RecognitionGenerationSnapshot =>
  Object.freeze({
    generationId: input.generationId,
    mode: input.mode,
    ipName: input.ipName.trim(),
    themeName: input.themeName.trim(),
    locationNote: input.locationNote.trim(),
    unitPrice: input.unitPrice,
    capturedAt: input.capturedAt,
    prizes: Object.freeze(
      input.prizes.map((prize) => Object.freeze({ ...prize })),
    ),
    grandPrizeTiers: Object.freeze([...new Set(input.grandPrizeTiers)]),
  });

export const isCurrentGeneration = (
  activeGenerationId: string,
  callbackGenerationId: string,
): boolean =>
  Boolean(activeGenerationId) && activeGenerationId === callbackGenerationId;

export const buildBoardFromRecognitionSnapshot = (
  snapshot: RecognitionGenerationSnapshot,
): readonly LocalPrizeState[] => {
  let board: LocalPrizeState[];
  try {
    board = toLocalPrizeStates(snapshot.prizes).map((prize) => ({
      ...prize,
      isGrandPrize: snapshot.grandPrizeTiers.includes(prize.tier),
    }));
  } catch {
    throw new Error("BOARD_CONTRACT_MISMATCH");
  }
  for (const prize of snapshot.prizes) {
    const built = board.find((item) => item.tier === prize.tier);
    const remaining = prize.remainingTickets;
    if (
      !built ||
      remaining === null ||
      !("initialRemainingTickets" in built) ||
      built.initialRemainingTickets !== remaining ||
      built.isGrandPrize !== snapshot.grandPrizeTiers.includes(prize.tier)
    ) {
      throw new Error("BOARD_CONTRACT_MISMATCH");
    }
  }
  return Object.freeze(board.map((prize) => Object.freeze({ ...prize })));
};
