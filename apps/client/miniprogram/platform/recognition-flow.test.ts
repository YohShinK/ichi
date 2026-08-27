import { describe, expect, it } from "vitest";

import {
  createRecognitionFixture,
  decodeRecognitionFlow,
  parseRecognitionUnitPrice,
  RECOGNITION_CONTRACT_VERSION,
  recognitionStatusView,
  retainRecognizedTargets,
  toLocalPrizeStates,
  updateRecognitionPrize,
  validateRecognitionDraft,
} from "./recognition-flow.js";

describe("R2 recognition result business draft", () => {
  it("keeps the frozen recognition contract boundary and routes statuses", () => {
    expect(RECOGNITION_CONTRACT_VERSION).toBe("1.0.0");
    expect(recognitionStatusView("ready_for_confirmation")).toBe(
      "recognition-result",
    );
    expect(recognitionStatusView("needs_user_input")).toBe(
      "recognition-result",
    );
    expect(recognitionStatusView("retake_required")).toBe("cannot-build-pool");
  });

  it("preserves an explicit R=0 as a real editable tier and board state", () => {
    const prizes = updateRecognitionPrize(
      createRecognitionFixture(),
      "B",
      "remainingTickets",
      "0",
    );
    expect(prizes.find((prize) => prize.tier === "B")?.remainingTickets).toBe(
      0,
    );
    expect(toLocalPrizeStates(prizes)).toContainEqual({
      id: "b",
      tier: "B",
      rawLabel: "B賞",
      initialRemainingTickets: 0,
      isGrandPrize: false,
    });
  });

  it("blocks null R until the user confirms it and accepts zero", () => {
    const missing = updateRecognitionPrize(
      createRecognitionFixture(),
      "A",
      "remainingTickets",
      "",
    );
    const invalid = validateRecognitionDraft({
      mode: "assist",
      ipName: "世界之外",
      locationNote: "",
      prizes: missing,
      unitPrice: 65,
    });
    expect(invalid.canConfirm).toBe(false);
    expect(invalid.blockingFields).toEqual(["tiers.a.remainingTickets"]);
    expect(() => toLocalPrizeStates(missing)).toThrow("incomplete");

    const zero = updateRecognitionPrize(missing, "A", "remainingTickets", "0");
    expect(
      validateRecognitionDraft({
        mode: "assist",
        ipName: "世界之外",
        locationNote: "",
        prizes: zero,
        unitPrice: 65,
      }).canConfirm,
    ).toBe(true);
  });

  it("lets the user correct R without creating T/P fields", () => {
    const corrected = updateRecognitionPrize(
      createRecognitionFixture(),
      "C",
      "remainingTickets",
      "9",
    );
    expect(corrected.find((prize) => prize.tier === "C")).toMatchObject({
      remainingTickets: 9,
      confidence: "high",
    });
    expect(JSON.stringify(corrected)).not.toMatch(
      /totalTickets|pastedTickets/u,
    );
  });

  it("keeps price empty by default and requires a positive manual value", () => {
    expect(parseRecognitionUnitPrice("")).toBeNull();
    expect(parseRecognitionUnitPrice("0")).toBe(0);
    expect(parseRecognitionUnitPrice("65")).toBe(65);
    expect(
      validateRecognitionDraft({
        mode: "assist",
        ipName: "世界之外",
        locationNote: "",
        prizes: createRecognitionFixture(),
        unitPrice: null,
      }),
    ).toMatchObject({ canConfirm: false, unitPriceBlocking: true });
  });

  it("adapts a reliable legacy T/P draft only while reading", () => {
    const restored = decodeRecognitionFlow({
      schemaVersion: 1,
      unitPrice: 65,
      selectedTargets: ["A"],
      prizes: [
        {
          id: "a",
          tier: "A",
          totalTickets: 10,
          pastedTickets: 7,
          confidence: "high",
        },
      ],
    });
    expect(restored).toMatchObject({
      schemaVersion: 2,
      selectedGrandPrizeTiers: ["A"],
      prizes: [
        {
          tier: "A",
          rawLabel: "A賞",
          remainingTickets: 3,
        },
      ],
    });
    expect(JSON.stringify(restored?.prizes)).not.toMatch(
      /totalTickets|pastedTickets/u,
    );
  });

  it("retains only choices that still exist", () => {
    expect(
      retainRecognizedTargets(createRecognitionFixture(), ["A", "X", "A"]),
    ).toEqual(["A"]);
  });
});
