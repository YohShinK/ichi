import {
  calculateBoardOutlook,
  fractionToNumber,
  type BoardOutlookEventId,
} from "@ichi/core";
import { derivePrizeClassification } from "@ichi/board-layout";

type BoardTierInput = {
  readonly tier: string;
  readonly total: number;
  readonly covered: number;
};

type BoardOutlookEventView = {
  readonly id: BoardOutlookEventId;
  readonly label: string;
  readonly percentage: string;
  readonly certain: boolean;
};

export type BoardOutlookView =
  | {
      readonly status: "available";
      readonly windowDraws: number;
      readonly cumulativeCost: bigint;
      readonly events: readonly BoardOutlookEventView[];
    }
  | { readonly status: "unavailable"; readonly reason: string };

function formatPercentage(value: number): string {
  return (value * 100).toFixed(3);
}

function eventLabel(id: BoardOutlookEventId, draws: number): string {
  const windowLabel = `${draws} 抽内`;
  switch (id) {
    case "TARGET_HIT_WITHIN_WINDOW":
      return `${windowLabel}至少一张目标`;
    case "LARGE_PRIZE_WITHIN_WINDOW":
      return `${windowLabel}至少一张大赏`;
    case "NON_SMALL_WITHIN_WINDOW":
      return `${windowLabel}至少一张非小赏`;
    case "NO_SMALL_WITHIN_WINDOW":
      return `${windowLabel}全非小赏`;
    case "TWO_OR_MORE_SMALL_WITHIN_WINDOW":
      return `${windowLabel}两张或以上小赏`;
  }
}

export function buildBoardOutlook({
  tiers,
  targetTiers,
  unitPriceMinor,
}: {
  tiers: readonly BoardTierInput[];
  targetTiers: readonly string[];
  unitPriceMinor: bigint;
}): BoardOutlookView {
  let remainingTickets = 0;
  let largeTickets = 0;
  let smallTickets = 0;
  let targetTickets = 0;

  for (const tier of tiers) {
    const classification = derivePrizeClassification({
      label: tier.tier,
      totalSlots: tier.total,
    });
    const remaining = tier.total - tier.covered;
    if (!classification || !Number.isSafeInteger(remaining) || remaining < 0) {
      return { status: "unavailable", reason: "当前版面暂时无法计算。" };
    }
    remainingTickets += remaining;
    if (classification.presentation === "large") largeTickets += remaining;
    if (classification.presentation === "small") smallTickets += remaining;
    if (targetTiers.includes(tier.tier)) targetTickets += remaining;
  }

  const result = calculateBoardOutlook({
    remainingTickets,
    largeTickets,
    smallTickets,
    targetTickets,
    unitPriceMinor,
  });
  if (result.status === "unavailable") {
    return {
      status: "unavailable",
      reason:
        result.reason === "EMPTY_POOL"
          ? "当前票池已无余票。"
          : "当前版面暂时无法计算。",
    };
  }

  return {
    status: "available",
    windowDraws: result.value.windowDraws,
    cumulativeCost: result.value.cumulativeCostMinor,
    events: result.value.events.map((event) => ({
      id: event.id,
      label: eventLabel(event.id, result.value.windowDraws),
      percentage: formatPercentage(fractionToNumber(event.probability)),
      certain: event.probability.numerator === event.probability.denominator,
    })),
  };
}
