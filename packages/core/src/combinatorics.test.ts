import { describe, expect, it } from "vitest";

import { combination } from "./combinatorics.js";
import { unwrap } from "./test-helpers.js";

describe("combination", () => {
  it("returns exact bigint samples", () => {
    expect(unwrap(combination(0, 0))).toBe(1n);
    expect(unwrap(combination(5, 2))).toBe(10n);
    expect(unwrap(combination(100, 50))).toBe(100891344545564193334812497256n);
  });

  it("uses the symmetric result", () => {
    for (let n = 0; n <= 40; n += 1) {
      for (let k = 0; k <= n; k += 1) {
        expect(unwrap(combination(n, k))).toBe(unwrap(combination(n, n - k)));
      }
    }
  });

  it("returns stable errors for invalid parameters", () => {
    expect(combination(-1, 0)).toMatchObject({
      ok: false,
      error: { code: "INVALID_COMBINATION_PARAMETERS" },
    });
    expect(combination(3, 4)).toMatchObject({
      ok: false,
      error: { code: "INVALID_COMBINATION_PARAMETERS" },
    });
    expect(combination(3.5, 2)).toMatchObject({
      ok: false,
      error: { code: "NON_INTEGER_INPUT" },
    });
  });
});
