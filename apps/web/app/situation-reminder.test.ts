import { describe, expect, it } from "vitest";
import { analyzeSituation, type SituationRecord } from "./situation-reminder";

function record(
  tier: string,
  totalSlots: number,
  timestamp: number,
): SituationRecord {
  return { tier, totalSlots, timestamp };
}

describe("analyzeSituation", () => {
  it("uses only the approved large, medium, and small classifications", () => {
    const reminder = analyzeSituation({
      records: [record("G", 2, 1)],
      targetTiers: [],
      initialTicketCount: 20,
      remainingTicketCount: 19,
    });

    expect(reminder?.message).toBe("经典又时尚");
  });

  it("prioritizes a first target hit over other candidate prompts", () => {
    const reminder = analyzeSituation({
      records: [record("A", 1, 1)],
      targetTiers: ["A"],
      initialTicketCount: 20,
      remainingTicketCount: 19,
    });

    expect(reminder).toMatchObject({
      key: "first-target",
      message: "一发入魂！",
    });
  });

  it("uses the current copy for a target hit after the first draw", () => {
    const reminder = analyzeSituation({
      records: [record("E", 16, 1), record("A", 1, 2)],
      targetTiers: ["A"],
      initialTicketCount: 20,
      remainingTicketCount: 18,
    });

    expect(reminder).toMatchObject({
      key: "target-hit",
      message: "中！！！",
    });
  });

  it("uses the approved four-step small-prize copy", () => {
    const records = [1, 2, 3, 4, 5].map((timestamp) =>
      record("E", 16, timestamp),
    );
    const expected = [
      "经典又时尚",
      "又是经典时尚",
      "又又又是经典时尚",
      "还是经典时尚",
      "还是经典时尚",
    ];

    for (const [index, message] of expected.entries()) {
      const reminder = analyzeSituation({
        records: records.slice(0, index + 1),
        targetTiers: [],
        initialTicketCount: 40,
        remainingTicketCount: 39 - index,
      });
      expect(reminder?.message).toBe(message);
      expect(reminder?.key).toBe(`small-streak-${index + 1}`);
    }
  });

  it("does not create a cost-triggered reminder", () => {
    const reminder = analyzeSituation({
      records: [record("D", 8, 1), record("F", 8, 2)],
      targetTiers: [],
      initialTicketCount: 30,
      remainingTicketCount: 28,
    });

    expect(reminder?.message).toBe("新等级登场！");
    expect(reminder?.message).not.toContain("¥");
  });
});
