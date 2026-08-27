import type {
  LegacyLocalPrizeState,
  LocalDrawDraft,
  LocalDrawHistoryItem,
  LocalPrizeState,
} from "./local-draw-drafts.js";
import {
  currentRemainingForPrize,
  initialRemainingForPrize,
  isR2LocalPrizeState,
} from "./local-draw-drafts.js";

export const MAX_CONTINUOUS_UNDOS = 50;

export type PrizePresentation = "large" | "medium" | "small";

export interface DrawMutationResult {
  readonly ok: boolean;
  readonly draft: LocalDrawDraft;
  readonly reason?: "EMPTY_TIER" | "NO_HISTORY" | "UNDO_LIMIT";
  readonly tier?: string;
}

export const classifyPrize = (
  tier: string,
  total: number,
): PrizePresentation => {
  const rawLabel = tier.trim().toUpperCase();
  const normalized = /^([A-Z])[0-9]+$/u.exec(rawLabel)?.[1] ?? rawLabel;
  const usesCountBasedPresentation =
    /^[A-F]$/u.test(normalized) ||
    (normalized.length > 0 &&
      !/^[A-Z]$/u.test(normalized) &&
      normalized !== "UNKNOWN");
  if (!usesCountBasedPresentation) return "small";
  if (total <= 5) return "large";
  if (total <= 9) return "medium";
  return "small";
};

export const toWorkspaceSection = (
  presentation: PrizePresentation,
): "grand" | "normal" => (presentation === "large" ? "grand" : "normal");

export const remainingTickets = (draft: LocalDrawDraft): number =>
  draft.prizeData.reduce(
    (sum, prize) => sum + currentRemainingForPrize(draft, prize),
    0,
  );

export const projectPrizeStates = (
  draft: LocalDrawDraft,
): LegacyLocalPrizeState[] =>
  draft.prizeData.map((prize) => ({
    id: prize.id,
    tier: prize.tier,
    total: initialRemainingForPrize(prize),
    remaining: currentRemainingForPrize(draft, prize),
  }));

export const presentationForPrize = (
  prize: LocalPrizeState,
): PrizePresentation =>
  isR2LocalPrizeState(prize)
    ? prize.isGrandPrize
      ? "large"
      : "small"
    : classifyPrize(prize.tier, prize.total);

export const formatProbability = (
  matching: number,
  remaining: number,
): string =>
  remaining > 0 ? ((matching / remaining) * 100).toFixed(3) : "0.000";

const nextHistoryId = (draft: LocalDrawDraft, now: number): string =>
  `${draft.boardId}:round:${draft.history.length + 1}:${now}`;

export const drawPrize = (
  draft: LocalDrawDraft,
  tier: string,
  unitPrice: number,
  now = Date.now(),
): DrawMutationResult => {
  const target = draft.prizeData.find((prize) => prize.tier === tier);
  if (!target || currentRemainingForPrize(draft, target) <= 0) {
    return { ok: false, draft, reason: "EMPTY_TIER" };
  }

  const historyItem: LocalDrawHistoryItem = {
    id: nextHistoryId(draft, now),
    tier,
    occurredAt: now,
  };
  const history = [...draft.history, historyItem];
  return {
    ok: true,
    tier,
    draft: {
      ...draft,
      savedAt: now,
      prizeData: draft.prizeData.map((prize) =>
        prize.tier === tier && !isR2LocalPrizeState(prize)
          ? { ...prize, remaining: prize.remaining - 1 }
          : prize,
      ),
      history,
      undoFloor: Math.max(
        draft.undoFloor ?? 0,
        history.length - MAX_CONTINUOUS_UNDOS,
      ),
      cost: draft.cost + unitPrice,
    },
  };
};

export const undoLastDraw = (
  draft: LocalDrawDraft,
  unitPrice: number,
  continuousUndoCount: number,
  now = Date.now(),
): DrawMutationResult => {
  if (continuousUndoCount >= MAX_CONTINUOUS_UNDOS) {
    return { ok: false, draft, reason: "UNDO_LIMIT" };
  }
  if (draft.history.length <= (draft.undoFloor ?? 0)) {
    return { ok: false, draft, reason: "UNDO_LIMIT" };
  }
  const last = draft.history[draft.history.length - 1];
  if (!last) return { ok: false, draft, reason: "NO_HISTORY" };

  const target = draft.prizeData.find((prize) => prize.tier === last.tier);
  if (
    !target ||
    currentRemainingForPrize(draft, target) >= initialRemainingForPrize(target)
  ) {
    return { ok: false, draft, reason: "NO_HISTORY" };
  }
  return {
    ok: true,
    tier: last.tier,
    draft: {
      ...draft,
      savedAt: now,
      prizeData: draft.prizeData.map((prize) =>
        prize.tier === last.tier && !isR2LocalPrizeState(prize)
          ? { ...prize, remaining: prize.remaining + 1 }
          : prize,
      ),
      history: draft.history.slice(0, -1),
      cost: Math.max(0, draft.cost - unitPrice),
    },
  };
};

export const contextualReminder = (
  draft: LocalDrawDraft,
  tier: string,
  targets: readonly string[],
): string => {
  const history = draft.history;
  const prizeFor = (historyTier: string) =>
    draft.prizeData.find((item) => item.tier === historyTier);
  const presentationFor = (historyTier: string) => {
    const prize = prizeFor(historyTier);
    return prize ? presentationForPrize(prize) : undefined;
  };
  const presentation = presentationFor(tier);

  if (targets.includes(tier)) {
    return history.length === 1 ? "一发入魂！" : "中！！！";
  }
  if (presentation === "large") {
    const previous = history[history.length - 2];
    return previous && presentationFor(previous.tier) === "large"
      ? "连着出高赏"
      : "意外之喜！";
  }
  if (presentation === "small") {
    let count = 0;
    for (let index = history.length - 1; index >= 0; index -= 1) {
      const record = history[index];
      if (!record || presentationFor(record.tier) !== "small") break;
      count += 1;
    }
    return count === 1
      ? "经典又时尚"
      : count === 2
        ? "又是经典时尚"
        : count === 3
          ? "又又又是经典时尚"
          : "还是经典时尚";
  }
  if (
    presentation === "medium" &&
    history.length >= 3 &&
    history.slice(-3).every((record) => record.tier === tier)
  ) {
    return "又是这个";
  }
  if (
    history.length >= 5 &&
    history.slice(-5).every((record) => !targets.includes(record.tier))
  ) {
    return "要不要收手？";
  }
  const appearedBefore = history
    .slice(0, -1)
    .some((record) => record.tier === tier);
  return appearedBefore ? "余票已更新" : "新等级登场！";
};
