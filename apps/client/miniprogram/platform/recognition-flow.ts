import type { LocalPrizeState } from "./local-draw-drafts.js";

// Native adapter mirror of packages/recognition-contract. Keeping the literal
// local avoids loading code from outside miniprogramRoot at runtime.
export const RECOGNITION_CONTRACT_VERSION = "1.0.0" as const;
export type RecognitionStatus =
  | "ready_for_confirmation"
  | "needs_user_input"
  | "retake_required"
  | "service_error";

export const recognitionStatusView = (
  status: RecognitionStatus,
): "recognition-result" | "cannot-build-pool" =>
  status === "ready_for_confirmation" || status === "needs_user_input"
    ? "recognition-result"
    : "cannot-build-pool";

export interface RecognitionPrizeDraft {
  readonly id: string;
  readonly tier: string;
  readonly rawLabel: string;
  readonly remainingTickets: number | null;
  readonly confidence: "high" | "low";
}

export const DEFAULT_RECOGNITION_PRICE = 650;
export const RECOGNITION_FLOW_KEY = "ichi:v1-e-recognition-flow:v1";
export type RecognitionFlowMode = "assist" | "direct-upload";

export interface RecognitionFlowSnapshot {
  readonly schemaVersion: 2;
  readonly prizes: readonly RecognitionPrizeDraft[];
  readonly unitPrice: number | null;
  readonly selectedGrandPrizeTiers: readonly string[];
  readonly mode?: RecognitionFlowMode;
  readonly ipName?: string;
  readonly themeName?: string;
  readonly locationNote?: string;
  readonly capturedAt?: number;
  readonly recognitionJobId?: string;
  readonly acquisition?: "camera";
}

export const createRecognitionFixture = (): RecognitionPrizeDraft[] =>
  [
    ["A", 2, "high"],
    ["B", 3, "high"],
    ["C", 5, "high"],
    ["SP1", 4, "high"],
    ["D", 11, "high"],
    ["E", 17, "low"],
    ["F", 25, "high"],
  ].map(([tier, remainingTickets, confidence]) => ({
    id: String(tier).toLowerCase(),
    tier: String(tier),
    rawLabel: `${String(tier)}賞`,
    remainingTickets: Number(remainingTickets),
    confidence: confidence as "high" | "low",
  }));

export const toLocalPrizeStates = (
  prizes: readonly RecognitionPrizeDraft[],
): LocalPrizeState[] =>
  prizes.map(({ id, tier, rawLabel, remainingTickets }) => {
    if (
      !Number.isSafeInteger(remainingTickets) ||
      remainingTickets === null ||
      remainingTickets < 0
    ) {
      throw new Error("Recognition prize draft is incomplete.");
    }
    return {
      id,
      tier,
      rawLabel,
      initialRemainingTickets: remainingTickets,
      isGrandPrize: false,
    };
  });

export const retainRecognizedTargets = (
  prizes: readonly RecognitionPrizeDraft[],
  selectedTargets: readonly string[],
): string[] => {
  const available = new Set(prizes.map((prize) => prize.tier));
  const retained = [...new Set(selectedTargets)].filter((tier) =>
    available.has(tier),
  );
  return retained;
};

export const updateRecognitionPrize = (
  prizes: readonly RecognitionPrizeDraft[],
  tier: string,
  field: "remainingTickets",
  rawValue: string,
): RecognitionPrizeDraft[] =>
  prizes.map((prize) => {
    if (prize.tier !== tier) return prize;
    const normalized = rawValue.trim();
    const parsed = normalized === "" ? null : Number(normalized);
    const nextValue =
      parsed !== null && Number.isFinite(parsed) ? parsed : null;
    return {
      ...prize,
      remainingTickets: nextValue,
      confidence: "high",
    };
  });

export interface RecognitionTierFieldValidation extends RecognitionPrizeDraft {
  readonly remainingTicketsBlocking: boolean;
}

export interface RecognitionDraftValidation {
  readonly canConfirm: boolean;
  readonly blockingFields: readonly string[];
  readonly error: string | null;
  readonly ipNameBlocking: boolean;
  readonly locationNoteBlocking: boolean;
  readonly unitPriceBlocking: boolean;
  readonly tiers: readonly RecognitionTierFieldValidation[];
}

export interface RecognitionDraftValidationInput {
  readonly mode: RecognitionFlowMode;
  readonly ipName: string;
  readonly locationNote: string;
  readonly prizes: readonly RecognitionPrizeDraft[];
  readonly unitPrice: number | null;
}

export const parseRecognitionUnitPrice = (rawValue: unknown): number | null => {
  if (typeof rawValue === "number") {
    return Number.isFinite(rawValue) ? rawValue : null;
  }
  if (typeof rawValue !== "string" || rawValue.trim() === "") return null;
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : null;
};

const validateRecognitionCounts = (
  prizes: readonly RecognitionPrizeDraft[],
  unitPrice: number | null,
): {
  readonly error: string | null;
  readonly unitPriceBlocking: boolean;
  readonly tiers: readonly RecognitionTierFieldValidation[];
  readonly structuralBlockingFields: readonly string[];
} => {
  const unitPriceBlocking =
    unitPrice === null || !Number.isSafeInteger(unitPrice) || unitPrice <= 0;
  const structuralBlockingFields: string[] = [];
  if (!prizes.length) structuralBlockingFields.push("tiers");
  const tiers = prizes.map((prize) => {
    const remainingTicketsBlocking =
      prize.remainingTickets === null ||
      !Number.isSafeInteger(prize.remainingTickets) ||
      prize.remainingTickets < 0;
    if (!prize.tier.trim()) structuralBlockingFields.push(`tier:${prize.id}`);
    return {
      ...prize,
      remainingTicketsBlocking,
    };
  });
  const countBlocking = tiers.some((tier) => tier.remainingTicketsBlocking);
  return {
    unitPriceBlocking,
    tiers,
    structuralBlockingFields,
    error: unitPriceBlocking
      ? "请补填有效的单抽价格。"
      : structuralBlockingFields.includes("tiers")
        ? "没有识别到可用奖级。"
        : countBlocking || structuralBlockingFields.length > 0
          ? "请确认每个赏级的未贴票数，可填写 0。"
          : null,
  };
};

export const validateRecognitionDraft = (
  input: RecognitionDraftValidationInput,
): RecognitionDraftValidation => {
  const counts = validateRecognitionCounts(input.prizes, input.unitPrice);
  const ipNameBlocking = !input.ipName.trim();
  const locationNoteBlocking =
    input.mode === "direct-upload" && !input.locationNote.trim();
  const blockingFields = [
    ...(ipNameBlocking ? ["ipName"] : []),
    ...(locationNoteBlocking ? ["locationNote"] : []),
    ...(counts.unitPriceBlocking ? ["unitPrice"] : []),
    ...counts.structuralBlockingFields,
    ...counts.tiers.flatMap((tier) => [
      ...(tier.remainingTicketsBlocking
        ? [`tiers.${tier.id}.remainingTickets`]
        : []),
    ]),
  ];
  return {
    canConfirm: blockingFields.length === 0,
    blockingFields,
    error: ipNameBlocking
      ? input.mode === "direct-upload" && locationNoteBlocking
        ? "请填写 IP 和地点与备注。"
        : "请填写这个版面的 IP。"
      : locationNoteBlocking
        ? "请填写地点与备注。"
        : counts.error,
    ipNameBlocking,
    locationNoteBlocking,
    unitPriceBlocking: counts.unitPriceBlocking,
    tiers: counts.tiers,
  };
};

export const validateRecognition = (
  prizes: readonly RecognitionPrizeDraft[],
  unitPrice: number | null,
): string | null => validateRecognitionCounts(prizes, unitPrice).error;

type LegacyRecognitionPrize = Partial<RecognitionPrizeDraft> & {
  readonly total?: number | null;
  readonly covered?: number | null;
  readonly remaining?: number | null;
  readonly totalTickets?: number | null;
  readonly pastedTickets?: number | null;
};

export const decodeRecognitionFlow = (
  stored: unknown,
): RecognitionFlowSnapshot | null => {
  try {
    const value = typeof stored === "string" ? JSON.parse(stored) : stored;
    if (!value || typeof value !== "object") return null;
    const snapshot = value as Partial<
      Omit<RecognitionFlowSnapshot, "schemaVersion">
    > & {
      readonly schemaVersion?: number;
      readonly selectedTargets?: unknown;
      readonly selectedGrandPrizeTiers?: unknown;
    };
    const selections =
      snapshot.selectedGrandPrizeTiers ?? snapshot.selectedTargets ?? [];
    if (
      (snapshot.schemaVersion !== 1 && snapshot.schemaVersion !== 2) ||
      !Array.isArray(snapshot.prizes) ||
      (snapshot.unitPrice !== null && !Number.isFinite(snapshot.unitPrice)) ||
      !Array.isArray(selections) ||
      selections.some((tier) => typeof tier !== "string") ||
      (snapshot.mode !== undefined &&
        snapshot.mode !== "assist" &&
        snapshot.mode !== "direct-upload") ||
      (snapshot.ipName !== undefined && typeof snapshot.ipName !== "string") ||
      (snapshot.themeName !== undefined &&
        typeof snapshot.themeName !== "string") ||
      (snapshot.locationNote !== undefined &&
        typeof snapshot.locationNote !== "string") ||
      (snapshot.capturedAt !== undefined &&
        (!Number.isFinite(snapshot.capturedAt) || snapshot.capturedAt < 0)) ||
      (snapshot.recognitionJobId !== undefined &&
        (typeof snapshot.recognitionJobId !== "string" ||
          snapshot.recognitionJobId.length < 8)) ||
      (snapshot.acquisition !== undefined && snapshot.acquisition !== "camera")
    ) {
      return null;
    }
    const prizes = snapshot.prizes.map((rawPrize) => {
      const prize = rawPrize as LegacyRecognitionPrize;
      const explicitRemaining =
        prize.remainingTickets !== undefined
          ? prize.remainingTickets
          : prize.remaining !== undefined
            ? prize.remaining
            : undefined;
      const remainingTickets =
        explicitRemaining !== undefined
          ? explicitRemaining
          : prize.totalTickets !== null &&
              prize.totalTickets !== undefined &&
              prize.pastedTickets !== null &&
              prize.pastedTickets !== undefined &&
              Number.isSafeInteger(prize.totalTickets) &&
              Number.isSafeInteger(prize.pastedTickets) &&
              prize.pastedTickets <= prize.totalTickets
            ? prize.totalTickets - prize.pastedTickets
            : null;
      return {
        id: String(prize.id ?? ""),
        tier: String(prize.tier ?? ""),
        rawLabel: String(prize.rawLabel ?? `${String(prize.tier ?? "")}賞`),
        remainingTickets,
        confidence: prize.confidence,
      } as RecognitionPrizeDraft;
    });
    if (
      prizes.some(
        (prize) =>
          typeof prize.id !== "string" ||
          typeof prize.tier !== "string" ||
          (prize.remainingTickets !== null &&
            !Number.isFinite(prize.remainingTickets)) ||
          typeof prize.rawLabel !== "string" ||
          (prize.confidence !== "high" && prize.confidence !== "low"),
      )
    ) {
      return null;
    }
    return {
      ...snapshot,
      schemaVersion: 2,
      prizes,
      selectedGrandPrizeTiers: selections as string[],
    } as RecognitionFlowSnapshot;
  } catch {
    return null;
  }
};
