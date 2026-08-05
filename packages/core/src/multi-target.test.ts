import { describe, expect, it } from "vitest";

import { fraction, fractionToString } from "./fraction.js";
import { meetAllTargetRequirementsProbability } from "./multi-target.js";
import { unwrap } from "./test-helpers.js";
import type { TargetRequirement } from "./types.js";

const enumerateProbability = (
  pool: readonly string[],
  draws: number,
  requirements: Readonly<Record<string, number>>,
): string => {
  let all = 0n;
  let favorable = 0n;
  const visit = (start: number, chosen: string[]): void => {
    if (chosen.length === draws) {
      all += 1n;
      const counts = new Map<string, number>();
      for (const item of chosen) counts.set(item, (counts.get(item) ?? 0) + 1);
      if (
        Object.entries(requirements).every(
          ([id, required]) => (counts.get(id) ?? 0) >= required,
        )
      ) {
        favorable += 1n;
      }
      return;
    }
    for (let index = start; index < pool.length; index += 1) {
      const value = pool[index];
      if (value !== undefined) visit(index + 1, [...chosen, value]);
    }
  };
  visit(0, []);
  return fractionToString(fraction(favorable, all));
};

describe("multiple target requirements", () => {
  it("matches the V1-A fixed vector without multiplying marginal probabilities", () => {
    const targets: readonly TargetRequirement[] = [
      { prizeId: "A", available: 1, required: 1 },
      { prizeId: "B", available: 2, required: 1 },
    ];
    expect(
      fractionToString(
        unwrap(meetAllTargetRequirementsProbability(6, 2, targets)),
      ),
    ).toBe("2/15");
  });

  it("matches independent enumeration for small pools", () => {
    const cases = [
      {
        pool: ["A", "B", "B", "N", "N", "N"],
        draws: 2,
        targets: [
          { prizeId: "A", available: 1, required: 1 },
          { prizeId: "B", available: 2, required: 1 },
        ],
      },
      {
        pool: ["A", "A", "B", "B", "N"],
        draws: 3,
        targets: [
          { prizeId: "A", available: 2, required: 2 },
          { prizeId: "B", available: 2, required: 1 },
        ],
      },
      {
        pool: ["A", "A", "B", "N"],
        draws: 0,
        targets: [
          { prizeId: "A", available: 2, required: 0 },
          { prizeId: "B", available: 1, required: 0 },
        ],
      },
    ] as const;

    for (const sample of cases) {
      const expected = enumerateProbability(
        sample.pool,
        sample.draws,
        Object.fromEntries(
          sample.targets.map((target) => [target.prizeId, target.required]),
        ),
      );
      const actual = unwrap(
        meetAllTargetRequirementsProbability(
          sample.pool.length,
          sample.draws,
          sample.targets,
        ),
      );
      expect(fractionToString(actual)).toBe(expected);
    }
  });

  it("rejects duplicate or impossible requirements", () => {
    expect(
      meetAllTargetRequirementsProbability(5, 2, [
        { prizeId: "A", available: 1, required: 1 },
        { prizeId: "A", available: 1, required: 1 },
      ]),
    ).toMatchObject({ ok: false, error: { code: "DUPLICATE_TARGET_ID" } });
    expect(
      meetAllTargetRequirementsProbability(5, 2, [
        { prizeId: "A", available: 1, required: 2 },
      ]),
    ).toMatchObject({
      ok: false,
      error: { code: "TARGET_REQUIREMENT_EXCEEDS_AVAILABLE" },
    });
  });
});
