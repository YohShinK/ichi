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

  it("keeps G through Z and OTHER compact regardless of ticket count", () => {
    expect(derivePrizePresentation({ label: "G", totalSlots: 1 })).toBe(
      "small",
    );
    expect(derivePrizePresentation({ label: "OTHER", totalSlots: 1 })).toBe(
      "small",
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
