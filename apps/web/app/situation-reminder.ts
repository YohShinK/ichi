import { derivePrizeClassification } from "@ichi/board-layout";

export type SituationRecord = {
  tier: string;
  totalSlots: number;
  timestamp: number;
  tierRemaining?: number;
};

export type SituationInput = {
  records: readonly SituationRecord[];
  targetTiers: readonly string[];
  initialTicketCount: number;
  remainingTicketCount: number;
  lastConditionReady?: boolean;
};

export type SituationReminder = {
  key: string;
  message: string;
  priority: number;
};

function countTrailing(
  records: readonly SituationRecord[],
  predicate: (record: SituationRecord) => boolean,
): number {
  let count = 0;
  for (let index = records.length - 1; index >= 0; index -= 1) {
    const record = records[index];
    if (!record || !predicate(record)) break;
    count += 1;
  }
  return count;
}

function isTarget(record: SituationRecord, targetTiers: ReadonlySet<string>) {
  return targetTiers.has(record.tier);
}

export function analyzeSituation({
  records,
  targetTiers,
  initialTicketCount,
  remainingTicketCount,
  lastConditionReady = false,
}: SituationInput): SituationReminder | null {
  if (!records.length) return null;

  const classifications = records.map((record) =>
    derivePrizeClassification({
      label: record.tier,
      totalSlots: record.totalSlots,
    }),
  );
  if (classifications.some((classification) => !classification)) {
    return {
      key: "data-insufficient",
      message: "先记下这一抽。",
      priority: 95,
    };
  }

  const lastRecord = records.at(-1);
  const lastClassification = classifications.at(-1);
  if (!lastRecord || !lastClassification) return null;

  const targets = new Set(targetTiers);
  const targetHits = new Set(
    records
      .filter((record) => isTarget(record, targets))
      .map((record) => record.tier),
  );
  const remainingTargets = [...targets].filter((tier) => !targetHits.has(tier));
  const smallStreak = countTrailing(
    records,
    (record) =>
      derivePrizeClassification({
        label: record.tier,
        totalSlots: record.totalSlots,
      })?.presentation === "small",
  );
  const sameMediumStreak = countTrailing(records, (record) => {
    const classification = derivePrizeClassification({
      label: record.tier,
      totalSlots: record.totalSlots,
    });
    return (
      record.tier === lastRecord.tier &&
      !isTarget(record, targets) &&
      classification?.presentation === "medium"
    );
  });
  const largeStreak = countTrailing(
    records,
    (record) =>
      derivePrizeClassification({
        label: record.tier,
        totalSlots: record.totalSlots,
      })?.presentation === "large",
  );
  const recentFive = records.slice(-5);
  const hasRecentTarget = recentFive.some((record) =>
    isTarget(record, targets),
  );
  const smallCount = classifications.filter(
    (classification) => classification?.presentation === "small",
  ).length;
  const isFastStreak =
    records.length >= 4 &&
    lastRecord.timestamp -
      (records.at(-4)?.timestamp ?? lastRecord.timestamp) <=
      60_000;
  const candidates: SituationReminder[] = [];

  if (isTarget(lastRecord, targets) && records.length === 1) {
    candidates.push({
      key: "first-target",
      message: "一发入魂！",
      priority: 10,
    });
  }
  if (isTarget(lastRecord, targets) && records.length > 1) {
    candidates.push({ key: "target-hit", message: "中！！！", priority: 20 });
  }
  if (
    !isTarget(lastRecord, targets) &&
    lastClassification.presentation === "large"
  ) {
    candidates.push({
      key: "unexpected-large",
      message: "意外之喜！",
      priority: 30,
    });
  }
  if (largeStreak >= 2) {
    candidates.push({
      key: "large-streak",
      message: "连着出高赏",
      priority: 35,
    });
  }
  if (
    targets.size > 0 &&
    isTarget(lastRecord, targets) &&
    remainingTargets.length === 0
  ) {
    candidates.push({
      key: "all-targets-hit",
      message: "目标到手！",
      priority: 40,
    });
  }
  if (targets.size > 1 && remainingTargets.length === 1) {
    candidates.push({
      key: "one-target-left",
      message: "还差一项",
      priority: 45,
    });
  }
  if (smallStreak > 0) {
    const smallMessage =
      smallStreak === 1
        ? "经典又时尚"
        : smallStreak === 2
          ? "又是经典时尚"
          : smallStreak === 3
            ? "又又又是经典时尚"
            : "还是经典时尚";
    candidates.push({
      key: `small-streak-${smallStreak}`,
      message: smallMessage,
      priority: 50,
    });
  }
  if (sameMediumStreak >= 3) {
    candidates.push({
      key: `same-medium-${lastRecord.tier}`,
      message: "又是这个",
      priority: 55,
    });
  }
  if (recentFive.length === 5 && !hasRecentTarget) {
    candidates.push({
      key: "five-without-target",
      message: "要不要收手？",
      priority: 60,
    });
  }
  if (records.length % 10 === 0) {
    candidates.push({
      key: `draw-count-${records.length}`,
      message: `已抽 ${records.length} 抽。`,
      priority: 65,
    });
  }
  if (
    initialTicketCount > 0 &&
    remainingTicketCount / initialTicketCount < 0.1
  ) {
    candidates.push({
      key: "near-empty",
      message: "票池快见底。",
      priority: 70,
    });
  }
  if (
    records.length >= 5 &&
    smallCount / records.length >= 0.8 &&
    targetHits.size === 0
  ) {
    candidates.push({
      key: "small-heavy",
      message: "好多小挂件...",
      priority: 72,
    });
  }
  if (targets.has(lastRecord.tier) && lastRecord.tierRemaining === 0) {
    candidates.push({
      key: "target-exhausted",
      message: "这档没票了。",
      priority: 75,
    });
  }
  if (lastConditionReady) {
    candidates.push({
      key: "last-ready",
      message: "Last 条件已齐！",
      priority: 78,
    });
  }
  if (
    records.filter((record) => record.tier === lastRecord.tier).length === 1
  ) {
    candidates.push({
      key: `new-tier-${lastRecord.tier}`,
      message: "新等级登场！",
      priority: 80,
    });
  }
  if (isFastStreak) {
    candidates.push({
      key: "fast-streak",
      message: "先歇一下吧。",
      priority: 82,
    });
  }

  return (
    candidates.sort((left, right) => left.priority - right.priority)[0] ?? null
  );
}
