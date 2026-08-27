import { describe, expect, it } from "vitest";

import {
  buildBoardFromRecognitionSnapshot,
  createRecognitionGenerationSnapshot,
  isCurrentGeneration,
} from "./recognition-generation.js";

const prizes = [
  {
    id: "tier-a",
    tier: "A",
    rawLabel: "A賞",
    remainingTickets: 2,
    confidence: "high" as const,
  },
  {
    id: "tier-b",
    tier: "B",
    rawLabel: "B賞",
    remainingTickets: 0,
    confidence: "high" as const,
  },
];

describe("R2 recognition generation snapshot", () => {
  it("deeply freezes confirmed R and manual grand-prize choices", () => {
    const snapshot = createRecognitionGenerationSnapshot({
      generationId: "generation-1",
      mode: "assist",
      ipName: " 世界之外 ",
      themeName: " Vol.2 ",
      locationNote: "",
      unitPrice: 65,
      capturedAt: 1,
      prizes,
      grandPrizeTiers: ["B"],
    });
    expect(snapshot).toMatchObject({
      ipName: "世界之外",
      themeName: "Vol.2",
      grandPrizeTiers: ["B"],
      prizes: [{ remainingTickets: 2 }, { remainingTickets: 0 }],
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.prizes[0])).toBe(true);
    expect(Object.isFrozen(snapshot.grandPrizeTiers)).toBe(true);
  });

  it("builds every tier including R=0 and uses only manual isGrandPrize", () => {
    const snapshot = createRecognitionGenerationSnapshot({
      generationId: "generation-2",
      mode: "assist",
      ipName: "世界之外",
      themeName: "",
      locationNote: "",
      unitPrice: 65,
      capturedAt: 1,
      prizes,
      grandPrizeTiers: ["B"],
    });
    expect(buildBoardFromRecognitionSnapshot(snapshot)).toEqual([
      {
        id: "tier-a",
        tier: "A",
        rawLabel: "A賞",
        initialRemainingTickets: 2,
        isGrandPrize: false,
      },
      {
        id: "tier-b",
        tier: "B",
        rawLabel: "B賞",
        initialRemainingTickets: 0,
        isGrandPrize: true,
      },
    ]);
  });

  it("rejects null R and stale callbacks", () => {
    const snapshot = createRecognitionGenerationSnapshot({
      generationId: "generation-3",
      mode: "assist",
      ipName: "测试",
      themeName: "",
      locationNote: "",
      unitPrice: 65,
      capturedAt: 1,
      prizes: [{ ...prizes[0]!, remainingTickets: null }],
      grandPrizeTiers: [],
    });
    expect(() => buildBoardFromRecognitionSnapshot(snapshot)).toThrow(
      "BOARD_CONTRACT_MISMATCH",
    );
    expect(isCurrentGeneration("generation-2", "generation-1")).toBe(false);
    expect(isCurrentGeneration("generation-2", "generation-2")).toBe(true);
  });
});
