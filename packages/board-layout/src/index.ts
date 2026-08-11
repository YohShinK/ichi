export const BOARD_LAYOUT_SCHEMA_VERSION = "1.0.0" as const;
export const BOARD_COMPONENT_REGISTRY_ID =
  "v1-saturated-board-components" as const;

export type BoardLayoutSchemaVersion = typeof BOARD_LAYOUT_SCHEMA_VERSION;

export type PrizePresentation = "large" | "medium" | "small";

export type PrizeClassification = {
  presentation: PrizePresentation;
};

export type PrizePresentationInput = {
  label: string;
  totalSlots: number;
};

const LARGE_PRIZE_LABELS = new Set(["A", "B", "C", "D", "E", "F"]);

/**
 * Derives local display and reminder labels for a verified prize tier.
 * Recognition never supplies these conclusions: an invalid ticket count must
 * stay unrenderable.
 */
export function derivePrizeClassification({
  label,
  totalSlots,
}: PrizePresentationInput): PrizeClassification | null {
  if (!Number.isSafeInteger(totalSlots) || totalSlots < 1) {
    return null;
  }

  const normalizedLabel = label.trim().toUpperCase();
  if (!LARGE_PRIZE_LABELS.has(normalizedLabel)) {
    return { presentation: "small" };
  }
  if (totalSlots <= 5) {
    return { presentation: "large" };
  }
  if (totalSlots <= 9) {
    return { presentation: "medium" };
  }
  return { presentation: "small" };
}

export function derivePrizePresentation(
  input: PrizePresentationInput,
): PrizePresentation | null {
  return derivePrizeClassification(input)?.presentation ?? null;
}
