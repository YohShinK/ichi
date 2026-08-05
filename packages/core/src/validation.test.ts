import { describe, expect, it } from "vitest";

import { validateCalculationInput } from "./validation.js";

const completeInput = {
  remainingTickets: 10,
  prizes: [
    { id: "A", label: "A赏", remaining: 2 },
    { id: "OTHER", label: "其他", remaining: 8 },
  ],
  unitPriceMinor: 100,
  targets: [{ prizeId: "A", available: 2, required: 1 }],
  plannedDraws: 3,
  sessionBudgetMinor: 500,
  spentMinor: 0,
} as const;

describe("calculation input validation", () => {
  it("separates calculable, insufficient and contradictory states", () => {
    expect(validateCalculationInput(completeInput)).toMatchObject({
      status: "calculable",
      issues: [],
    });
    expect(validateCalculationInput({})).toMatchObject({
      status: "insufficient_information",
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "MISSING_REMAINING_TICKETS" }),
        expect.objectContaining({ code: "MISSING_PRIZES" }),
        expect.objectContaining({ code: "MISSING_UNIT_PRICE" }),
      ]),
    });
    expect(
      validateCalculationInput({ ...completeInput, remainingTickets: 11 }),
    ).toMatchObject({
      status: "contradictory",
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "PRIZE_SUM_MISMATCH" }),
      ]),
    });
  });

  it("rejects duplicate prizes, unknown targets and invalid ranges", () => {
    expect(
      validateCalculationInput({
        ...completeInput,
        prizes: [
          { id: "A", label: "A赏", remaining: 2 },
          { id: "A", label: "重复", remaining: 8 },
        ],
        targets: [{ prizeId: "Z", available: 1, required: 1 }],
        plannedDraws: 11,
      }),
    ).toMatchObject({
      status: "contradictory",
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "DUPLICATE_PRIZE_ID" }),
        expect.objectContaining({ code: "TARGET_NOT_FOUND" }),
        expect.objectContaining({ code: "PLANNED_DRAWS_EXCEED_REMAINING" }),
      ]),
    });
  });

  it("never emits merchant-fault conclusions", () => {
    const result = validateCalculationInput({
      ...completeInput,
      remainingTickets: 9,
    });
    expect(JSON.stringify(result)).not.toMatch(/作弊|藏票|商家风险|fraud/i);
  });
});
