import { classifyPrize, type PrizePresentation } from "./draw-session.js";
import type { LegacyLocalPrizeState } from "./local-draw-drafts.js";

export const BOARD_OUTLOOK_VERSION = "board-outlook-v1.1.0" as const;

export interface BoardOutlookEventView {
  readonly id:
    | "TARGET_HIT_WITHIN_WINDOW"
    | "LARGE_PRIZE_WITHIN_WINDOW"
    | "NON_SMALL_WITHIN_WINDOW"
    | "NO_SMALL_WITHIN_WINDOW"
    | "TWO_OR_MORE_SMALL_WITHIN_WINDOW";
  readonly label: string;
  readonly percentage: string;
}

export type BoardOutlookView =
  | {
      readonly status: "available";
      readonly version: typeof BOARD_OUTLOOK_VERSION;
      readonly windowDraws: number;
      readonly cumulativeCost: number;
      readonly events: readonly BoardOutlookEventView[];
    }
  | { readonly status: "unavailable"; readonly reason: string };

const combination = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0;
  const width = Math.min(k, n - k);
  let value = 1;
  for (let index = 1; index <= width; index += 1) {
    value = (value * (n - width + index)) / index;
  }
  return value;
};

const atLeastOne = (
  remaining: number,
  matching: number,
  draws: number,
): number =>
  1 - combination(remaining - matching, draws) / combination(remaining, draws);

const twoOrMore = (
  remaining: number,
  matching: number,
  draws: number,
): number => {
  const denominator = combination(remaining, draws);
  let value = 0;
  for (let hits = 2; hits <= Math.min(draws, matching); hits += 1) {
    value +=
      (combination(matching, hits) *
        combination(remaining - matching, draws - hits)) /
      denominator;
  }
  return value;
};

const percent = (value: number): string => (value * 100).toFixed(3);

const countPresentation = (
  prizes: readonly LegacyLocalPrizeState[],
  presentation: PrizePresentation,
): number =>
  prizes.reduce(
    (sum, prize) =>
      sum +
      (classifyPrize(prize.tier, prize.total) === presentation
        ? prize.remaining
        : 0),
    0,
  );

export const buildBoardOutlook = ({
  prizes,
  targetTiers,
  unitPrice,
}: {
  readonly prizes: readonly LegacyLocalPrizeState[];
  readonly targetTiers: readonly string[];
  readonly unitPrice: number;
}): BoardOutlookView => {
  const remaining = prizes.reduce((sum, prize) => sum + prize.remaining, 0);
  if (remaining <= 0) {
    return { status: "unavailable", reason: "当前票池已无余票。" };
  }
  const draws = Math.min(3, remaining);
  const targets = prizes.reduce(
    (sum, prize) =>
      sum + (targetTiers.includes(prize.tier) ? prize.remaining : 0),
    0,
  );
  const large = countPresentation(prizes, "large");
  const small = countPresentation(prizes, "small");
  const nonSmall = remaining - small;
  const events: BoardOutlookEventView[] = [];
  if (targets > 0) {
    events.push({
      id: "TARGET_HIT_WITHIN_WINDOW",
      label: `${draws} 抽内至少一张目标`,
      percentage: percent(atLeastOne(remaining, targets, draws)),
    });
  }
  if (large > 0) {
    events.push({
      id: "LARGE_PRIZE_WITHIN_WINDOW",
      label: `${draws} 抽内至少一张大赏`,
      percentage: percent(atLeastOne(remaining, large, draws)),
    });
  }
  if (small === 0) {
    events.push({
      id: "NO_SMALL_WITHIN_WINDOW",
      label: `${draws} 抽内全非小赏`,
      percentage: "100.000",
    });
  } else if (nonSmall > 0) {
    events.push({
      id: "NON_SMALL_WITHIN_WINDOW",
      label: `${draws} 抽内至少一张非小赏`,
      percentage: percent(atLeastOne(remaining, nonSmall, draws)),
    });
  }
  if (small >= 2 && draws >= 2) {
    events.push({
      id: "TWO_OR_MORE_SMALL_WITHIN_WINDOW",
      label: `${draws} 抽内两张或以上小赏`,
      percentage: percent(twoOrMore(remaining, small, draws)),
    });
  }
  return {
    status: "available",
    version: BOARD_OUTLOOK_VERSION,
    windowDraws: draws,
    cumulativeCost: unitPrice * draws,
    events,
  };
};
