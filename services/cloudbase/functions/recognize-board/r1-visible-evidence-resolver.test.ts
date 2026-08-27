import { createRequire } from "node:module";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const {
  DIRECTIONS,
  RESOLUTION_KINDS,
  resolveTierEvidence,
  resolveR1Extraction,
} = require("./r1-visible-evidence-resolver.js") as {
  DIRECTIONS: Record<string, string>;
  RESOLUTION_KINDS: Record<string, string>;
  resolveTierEvidence: (tier: unknown) => any;
  resolveR1Extraction: (raw: unknown) => any;
};

const tier = (
  runs: Array<Array<number | null>>,
  totalTicketsObserved: number | null = null,
  pastedTicketsObserved: number | null = null,
) => ({
  visibleNumberRuns: runs.map((run) =>
    run.map((value) => ({
      value,
      rawText: value === null ? "?" : String(value),
    })),
  ),
  totalTicketsObserved,
  pastedTicketsObserved,
});

const counts = (result: any) => ({
  total: result.totalTickets,
  remaining: result.remainingTickets,
  pasted: result.pastedTickets,
});

describe("R1 visible-evidence deterministic resolver", () => {
  it("1 resolves a clean forward sequence", () => {
    const result = resolveTierEvidence(tier([[12, 13, 14, 15]], null, 11));
    expect(counts(result)).toEqual({ total: 15, remaining: 4, pasted: 11 });
    expect(result.trace.direction).toBe(DIRECTIONS.FORWARD_STRONG);
  });

  it("2 resolves a clean reverse sequence without treating max as total", () => {
    const result = resolveTierEvidence(tier([[5, 4, 3, 2, 1]], null, 11));
    expect(counts(result)).toEqual({ total: 16, remaining: 5, pasted: 11 });
    expect(result.trace.direction).toBe(DIRECTIONS.REVERSE_STRONG);
  });

  it("3 treats [1] as neutral U=1 with unknown total", () => {
    const result = resolveTierEvidence(tier([[1]]));
    expect(counts(result)).toEqual({ total: null, remaining: 1, pasted: null });
    expect(result.trace.direction).toBe(DIRECTIONS.NEUTRAL_ONE);
  });

  it("4 treats a single N>1 endpoint as weak without corroboration", () => {
    const result = resolveTierEvidence(tier([[7]]));
    expect(counts(result)).toEqual({ total: null, remaining: 1, pasted: null });
    expect(result.trace.direction).toBe(DIRECTIONS.FORWARD_WEAK);
  });

  it("5 recognizes reverse incomplete", () => {
    const result = resolveTierEvidence(tier([[5, 4, 3, 2]]));
    expect(result.trace.direction).toBe(DIRECTIONS.REVERSE_INCOMPLETE);
    expect(counts(result)).toEqual({ total: null, remaining: 4, pasted: null });
  });

  it("6 does not classify an ascending prefix ending in one as reverse", () => {
    const result = resolveTierEvidence(tier([[11, 12, 13, 1]]));
    expect(result.trace.direction).toBe(DIRECTIONS.FORWARD_WITH_OUTLIER);
  });

  it("7 preserves occurrence count through one OCR value outlier", () => {
    const result = resolveTierEvidence(tier([[11, 2, 13, 14, 15]], null, 10));
    expect(counts(result)).toEqual({ total: 15, remaining: 5, pasted: 10 });
    expect(result.trace.warnings).toContain("VALUE_OUTLIER");
  });

  it("8 repairs a single gap only when closure supports it", () => {
    const result = resolveTierEvidence(tier([[11, 13, 14, 15]], 15, 10));
    expect(counts(result)).toEqual({ total: 15, remaining: 5, pasted: 10 });
    expect(result.resolutionKind).toBe(RESOLUTION_KINDS.SEQUENCE_GAP_REPAIRED);
  });

  it("9 keeps observed occurrences when pasted closure supports no repair", () => {
    const result = resolveTierEvidence(tier([[11, 13, 14, 15]], 15, 11));
    expect(counts(result)).toEqual({ total: 15, remaining: 4, pasted: 11 });
  });

  it("10 repairs a leading missed observation with endpoint and pasted closure", () => {
    const result = resolveTierEvidence(tier([[12, 13, 14, 15]], null, 10));
    expect(counts(result)).toEqual({ total: 15, remaining: 5, pasted: 10 });
    expect(result.resolutionKind).toBe(RESOLUTION_KINDS.LEADING_SLOT_REPAIRED);
  });

  it("11 repairs a trailing missed observation only with explicit T/P", () => {
    const result = resolveTierEvidence(tier([[11, 12, 13, 14]], 15, 10));
    expect(counts(result)).toEqual({ total: 15, remaining: 5, pasted: 10 });
    expect(result.resolutionKind).toBe(RESOLUTION_KINDS.TRAILING_SLOT_REPAIRED);
  });

  it("12 retains duplicate alternatives and resolves by closure", () => {
    expect(
      counts(resolveTierEvidence(tier([[11, 12, 12, 13, 14, 15]], 15, 10))),
    ).toEqual({ total: 15, remaining: 5, pasted: 10 });
    expect(
      counts(resolveTierEvidence(tier([[11, 12, 12, 13, 14, 15]], 16, 10))),
    ).toEqual({ total: 16, remaining: 6, pasted: 10 });
  });

  it("13 rejects one foreign value only through unique closure", () => {
    const result = resolveTierEvidence(
      tier([[11, 12, 58, 13, 14, 15]], 15, 10),
    );
    expect(counts(result)).toEqual({ total: 15, remaining: 5, pasted: 10 });
    expect(result.trace.warnings).toContain("FOREIGN_VALUE_CANDIDATE");
  });

  it("14 closes a random output order without using sort for direction", () => {
    const result = resolveTierEvidence(tier([[15, 11, 14, 12, 13]], null, 10));
    expect(result.trace.direction).toBe(DIRECTIONS.UNKNOWN_ORDER);
    expect(counts(result)).toEqual({ total: 15, remaining: 5, pasted: 10 });
  });

  it("15 recognizes row reset and never uses max as the tier total", () => {
    const result = resolveTierEvidence(
      tier(
        [
          [1, 2, 3, 4],
          [1, 2, 3, 4],
        ],
        null,
        10,
      ),
    );
    expect(result.trace.direction).toBe(DIRECTIONS.ROW_RESET);
    expect(counts(result)).toEqual({ total: 18, remaining: 8, pasted: 10 });
  });

  it("16 recognizes a forward multi-run sequence", () => {
    const result = resolveTierEvidence(
      tier([
        [9, 10, 11, 12],
        [13, 14, 15, 16],
      ]),
    );
    expect(counts(result)).toEqual({ total: 16, remaining: 8, pasted: 8 });
  });

  it("17 disables sequence total for conflicting run directions", () => {
    const result = resolveTierEvidence(
      tier(
        [
          [11, 12, 13],
          [5, 4, 3],
        ],
        18,
      ),
    );
    expect(result.trace.direction).toBe(DIRECTIONS.DIRECTION_CONFLICT);
    expect(counts(result)).toEqual({ total: 18, remaining: 6, pasted: 12 });
  });

  it("18 rejects a wrong total observation when visible and pasted close", () => {
    const result = resolveTierEvidence(
      tier([[12, 13, 14, 15, 16, 17, 18]], 16, 11),
    );
    expect(counts(result)).toEqual({ total: 18, remaining: 7, pasted: 11 });
    expect(result.trace.warnings).toContain("TOTAL_OBSERVATION_REJECTED");
  });

  it("19 rejects a wrong pasted observation", () => {
    const result = resolveTierEvidence(
      tier([[12, 13, 14, 15, 16, 17, 18]], 18, 12),
    );
    expect(counts(result)).toEqual({ total: 18, remaining: 7, pasted: 11 });
    expect(result.trace.warnings).toContain("PASTED_OBSERVATION_REJECTED");
  });

  it("20 uses positive T-P fallback when visible evidence is absent", () => {
    const result = resolveTierEvidence(tier([], 8, 2));
    expect(counts(result)).toEqual({ total: 8, remaining: 6, pasted: 2 });
    expect(result.resolutionKind).toBe(
      RESOLUTION_KINDS.POSITIVE_TOTAL_PASTED_FALLBACK,
    );
  });

  it("21 never converts empty visible evidence and T=P into zero", () => {
    const result = resolveTierEvidence(tier([], 8, 8));
    expect(counts(result)).toEqual({ total: 8, remaining: null, pasted: null });
    expect(result.resolutionKind).toBe(RESOLUTION_KINDS.ZERO_NOT_CONFIRMED);
  });

  it("22 preserves known U when T is unknown", () => {
    expect(counts(resolveTierEvidence(tier([[null], [null]])))).toEqual({
      total: null,
      remaining: 2,
      pasted: null,
    });
  });

  it("23 preserves known T when U is unknown", () => {
    expect(counts(resolveTierEvidence(tier([], 12, null)))).toEqual({
      total: 12,
      remaining: null,
      pasted: null,
    });
  });

  it("24 rejects negative direct observations", () => {
    expect(counts(resolveTierEvidence(tier([], -1, -2)))).toEqual({
      total: null,
      remaining: null,
      pasted: null,
    });
  });

  it("25 rejects candidate solutions where U exceeds T", () => {
    const result = resolveTierEvidence(tier([[1, 2, 3, 4, 5]], 4, null));
    expect(
      result.totalTickets === null ||
        result.remainingTickets === null ||
        result.remainingTickets <= result.totalTickets,
    ).toBe(true);
  });

  it("26 preserves four explicit SP instances", () => {
    const raw = baseRaw(["SP1", "SP2", "SP3", "SP4"]);
    expect(
      resolveR1Extraction(raw).normalized.tiers.map(
        (item: any) => item.rawLabel,
      ),
    ).toEqual(["SP1", "SP2", "SP3", "SP4"]);
  });

  it("27 preserves A1/A2 child labels for downstream parent aggregation", () => {
    const raw = baseRaw(["A1", "A2"]);
    expect(
      resolveR1Extraction(raw).normalized.tiers.map(
        (item: any) => item.rawLabel,
      ),
    ).toEqual(["A1", "A2"]);
  });

  it("28 counts one null-valued visible observation", () => {
    expect(resolveTierEvidence(tier([[null]])).remainingTickets).toBe(1);
  });

  it("29 counts multiple null-valued observations", () => {
    expect(
      resolveTierEvidence(tier([[null, null], [null]])).remainingTickets,
    ).toBe(3);
  });

  it("30 reports ambiguity for different equally supported complete solutions", () => {
    const result = resolveTierEvidence(
      tier([[11, 12, 12, 13, 14, 15]], null, 10),
    );
    expect(result.resolutionKind).toBe(RESOLUTION_KINDS.AMBIGUOUS);
    expect(counts(result)).toEqual({
      total: null,
      remaining: null,
      pasted: null,
    });
  });
});

function baseRaw(labels: string[]) {
  return {
    ipName: null,
    ipRawText: null,
    themeName: null,
    price: null,
    tiers: labels.map((tierCode) => ({
      tierCode,
      rawLabel: tierCode,
      prizeName: null,
      visibleNumberRuns: [[{ value: 1, rawText: "1" }]],
      totalTicketsObserved: 1,
      pastedTicketsObserved: 0,
    })),
  };
}
