import { describe, expect, it } from "vitest";

import {
  classifyPrize,
  contextualReminder,
  drawPrize,
  formatProbability,
  MAX_CONTINUOUS_UNDOS,
  toWorkspaceSection,
  undoLastDraw,
} from "./draw-session.js";
import type { LocalDrawDraft } from "./local-draw-drafts.js";
import { currentRemainingForPrize } from "./local-draw-drafts.js";

const draft = (): LocalDrawDraft => ({
  schemaVersion: 1,
  boardId: "board",
  savedAt: 1,
  prizeData: [
    { id: "a", tier: "A", total: 2, remaining: 2 },
    { id: "g", tier: "G", total: 10, remaining: 10 },
  ],
  history: [],
  cost: 0,
  verificationStatus: "unverified",
  uploadStatus: "not-uploaded",
});

describe("mini-program draw session", () => {
  it("uses the approved local prize classification", () => {
    expect(classifyPrize("A", 5)).toBe("large");
    expect(classifyPrize("D", 9)).toBe("medium");
    expect(classifyPrize("F", 10)).toBe("small");
    expect(classifyPrize("G", 1)).toBe("small");
    expect(classifyPrize("G2", 1)).toBe("small");
    expect(classifyPrize("A2", 4)).toBe("large");
    expect(classifyPrize("B12", 6)).toBe("medium");
    expect(classifyPrize("SP1", 4)).toBe("large");
    expect(classifyPrize("SP2", 6)).toBe("medium");
    expect(classifyPrize("SP4", 10)).toBe("small");
    expect(classifyPrize("SECRET", 10)).toBe("small");
    expect(toWorkspaceSection("large")).toBe("grand");
    expect(toWorkspaceSection("medium")).toBe("normal");
    expect(toWorkspaceSection("small")).toBe("normal");
  });

  it("draws atomically and formats three decimal probabilities", () => {
    const result = drawPrize(draft(), "A", 650, 2);
    expect(result.ok).toBe(true);
    expect(
      currentRemainingForPrize(result.draft, result.draft.prizeData[0]!),
    ).toBe(1);
    expect(result.draft.history).toHaveLength(1);
    expect(result.draft.cost).toBe(650);
    expect(formatProbability(1, 11)).toBe("9.091");
  });

  it("undoes in order and protects the 50-operation boundary", () => {
    const drawn = drawPrize(draft(), "A", 650, 2).draft;
    const undone = undoLastDraw(drawn, 650, 0, 3);
    expect(undone.ok).toBe(true);
    expect(undone.draft).toMatchObject({ history: [], cost: 0 });
    expect(
      currentRemainingForPrize(undone.draft, undone.draft.prizeData[0]!),
    ).toBe(2);
    expect(undoLastDraw(drawn, 650, MAX_CONTINUOUS_UNDOS).reason).toBe(
      "UNDO_LIMIT",
    );

    let many = draft();
    many = {
      ...many,
      prizeData: [{ id: "g", tier: "G", total: 60, remaining: 60 }],
    };
    for (let index = 0; index < 51; index += 1) {
      many = drawPrize(many, "G", 650, 10 + index).draft;
    }
    expect(many.undoFloor).toBe(1);
    for (let index = 0; index < 50; index += 1) {
      many = undoLastDraw(many, 650, index, 100 + index).draft;
    }
    expect(many.history).toHaveLength(1);
    expect(undoLastDraw(many, 650, 0).reason).toBe("UNDO_LIMIT");
  });

  it("projects R2 status balls from initial R plus draw events without going negative", () => {
    let r2: LocalDrawDraft = {
      ...draft(),
      schemaVersion: "board-record-r2-1.0.0",
      prizeData: [
        {
          id: "a",
          tier: "A",
          rawLabel: "A賞",
          initialRemainingTickets: 5,
          isGrandPrize: false,
        },
      ],
    };
    for (let index = 0; index < 5; index += 1) {
      const result = drawPrize(r2, "A", 65, index + 2);
      expect(result.ok).toBe(true);
      r2 = result.draft;
      expect(currentRemainingForPrize(r2, r2.prizeData[0]!)).toBe(4 - index);
    }
    expect(drawPrize(r2, "A", 65).reason).toBe("EMPTY_TIER");
    expect(currentRemainingForPrize(r2, r2.prizeData[0]!)).toBe(0);
    const undone = undoLastDraw(r2, 65, 0, 20);
    expect(
      currentRemainingForPrize(undone.draft, undone.draft.prizeData[0]!),
    ).toBe(1);
  });

  it("matches the approved contextual reminder priority and copy", () => {
    const withPrizeData: LocalDrawDraft = {
      ...draft(),
      prizeData: [
        { id: "a", tier: "A", total: 2, remaining: 2 },
        { id: "d", tier: "D", total: 8, remaining: 8 },
        { id: "g", tier: "G", total: 10, remaining: 10 },
      ],
    };
    const history = (tiers: readonly string[]): LocalDrawDraft => ({
      ...withPrizeData,
      history: tiers.map((historyTier, index) => ({
        id: `round-${index}`,
        tier: historyTier,
        occurredAt: index,
      })),
    });

    expect(contextualReminder(history(["A"]), "A", ["A"])).toBe("一发入魂！");
    expect(contextualReminder(history(["G", "A"]), "A", ["A"])).toBe(
      "中！！！",
    );
    expect(contextualReminder(history(["A"]), "A", [])).toBe("意外之喜！");
    expect(contextualReminder(history(["A", "A"]), "A", [])).toBe("连着出高赏");
    expect(contextualReminder(history(["G"]), "G", [])).toBe("经典又时尚");
    expect(contextualReminder(history(["G", "G"]), "G", [])).toBe(
      "又是经典时尚",
    );
    expect(contextualReminder(history(["G", "G", "G"]), "G", [])).toBe(
      "又又又是经典时尚",
    );
    expect(contextualReminder(history(["G", "G", "G", "G"]), "G", [])).toBe(
      "还是经典时尚",
    );
    expect(contextualReminder(history(["D", "D", "D"]), "D", [])).toBe(
      "又是这个",
    );
  });
});
