import { describe, expect, it } from "vitest";

import { derivePrizeClassification, derivePrizePresentation } from "./index.js";

describe("derivePrizePresentation", () => {
  it("uses the inclusive five-ticket threshold for A through F", () => {
    expect(derivePrizePresentation({ label: "A", totalSlots: 1 })).toBe(
      "large",
    );
    expect(derivePrizePresentation({ label: "F", totalSlots: 5 })).toBe(
      "large",
    );
    expect(derivePrizePresentation({ label: "F", totalSlots: 6 })).toBe(
      "medium",
    );
  });

  it("keeps G through Z compact regardless of ticket count", () => {
    expect(derivePrizePresentation({ label: "G", totalSlots: 1 })).toBe(
      "small",
    );
    expect(derivePrizePresentation({ label: "G2", totalSlots: 1 })).toBe(
      "small",
    );
  });

  it("normalizes numbered variants for every single-letter regular tier", () => {
    expect(derivePrizePresentation({ label: "A2", totalSlots: 4 })).toBe(
      "large",
    );
    expect(derivePrizePresentation({ label: "B12", totalSlots: 6 })).toBe(
      "medium",
    );
    expect(derivePrizePresentation({ label: "F3", totalSlots: 10 })).toBe(
      "small",
    );
  });

  it("classifies sequential SP1-SP32 and confirmed special labels by verified ticket count", () => {
    expect(derivePrizePresentation({ label: "SP1", totalSlots: 4 })).toBe(
      "large",
    );
    expect(derivePrizePresentation({ label: "SP2", totalSlots: 6 })).toBe(
      "medium",
    );
    expect(derivePrizePresentation({ label: "SP4", totalSlots: 10 })).toBe(
      "small",
    );
    expect(derivePrizePresentation({ label: "SP32", totalSlots: 6 })).toBe(
      "medium",
    );
    expect(derivePrizePresentation({ label: "SECRET", totalSlots: 10 })).toBe(
      "small",
    );
    expect(derivePrizePresentation({ label: "OTHER", totalSlots: 1 })).toBe(
      "large",
    );
  });

  it("splits A through F into medium and small prizes at ten tickets", () => {
    expect(derivePrizeClassification({ label: "D", totalSlots: 9 })).toEqual({
      presentation: "medium",
    });
    expect(derivePrizeClassification({ label: "D", totalSlots: 10 })).toEqual({
      presentation: "small",
    });
  });

  it("refuses a presentation when the total ticket count is not verified", () => {
    expect(derivePrizePresentation({ label: "A", totalSlots: 0 })).toBeNull();
    expect(derivePrizePresentation({ label: "A", totalSlots: 1.5 })).toBeNull();
  });
});
