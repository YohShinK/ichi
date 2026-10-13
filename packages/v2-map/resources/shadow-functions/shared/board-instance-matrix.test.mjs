import { describe, expect, it } from "vitest";

import { resolveBoardInstance } from "../../../src/board-instance.js";
import {
  testBoardFacts,
  testVerifiedBoard,
} from "../../../src/test-support.js";

const earlier = "2026-09-12T01:00:00.000Z";
const later = "2026-09-12T02:00:00.000Z";
const candidate = (id, remaining, options = {}) => ({
  boardInstanceId: id,
  lastVerifiedBoard: testVerifiedBoard(`prior-${id}`, {
    observedAt: options.observedAt || earlier,
    facts: testBoardFacts(remaining, options.facts || {}),
  }),
});
const current = (remaining, options = {}) =>
  testVerifiedBoard("current", {
    observedAt: options.observedAt || later,
    facts: testBoardFacts(remaining, options.facts || {}),
  });
const cases = [
  ["no nearby candidate", current(1), [], "NO_MATCH"],
  ["one forward continuation", current(1), [candidate("a", 2)], "UNIQUE_MATCH"],
  [
    "two overlapping compatible instances",
    current(1),
    [candidate("a", 2), candidate("b", 2)],
    "AMBIGUOUS",
  ],
  [
    "different IP at same place",
    current(1),
    [candidate("a", 2, { facts: { ipName: "other" } })],
    "NO_MATCH",
  ],
  ["remaining count increases", current(2), [candidate("a", 1)], "NO_MATCH"],
  [
    "unchanged remaining count",
    current(1),
    [candidate("a", 1)],
    "UNIQUE_MATCH",
  ],
  [
    "unknown prior count to confirmed zero",
    current(0),
    [candidate("a", null)],
    "UNIQUE_MATCH",
  ],
  ["confirmed zero cannot rise", current(1), [candidate("a", 0)], "NO_MATCH"],
  [
    "same timestamp is not later",
    current(1, { observedAt: earlier }),
    [candidate("a", 2)],
    "NO_MATCH",
  ],
  [
    "late observation before candidate",
    current(1, { observedAt: earlier }),
    [candidate("a", 2, { observedAt: later })],
    "NO_MATCH",
  ],
  [
    "schema mismatch",
    current(1, { facts: { schemaVersion: "other-schema" } }),
    [candidate("a", 2)],
    "NO_MATCH",
  ],
  [
    "stale verified version",
    current(1),
    [candidate("a", 2)],
    "REJECTED_STALE_VERSION",
  ],
];

describe("B2-R1 frozen 12 BoardInstance reference scenarios", () => {
  it.each(cases)("%s", (_name, board, candidates, expected) => {
    const version =
      expected === "REJECTED_STALE_VERSION"
        ? "stale-version"
        : board.verifiedBoardVersion;
    expect(resolveBoardInstance(board, version, candidates).kind).toBe(
      expected,
    );
  });
});

describe("TASK-V2-19 canonical frozen scenario complements", () => {
  it("换箱/换套不错误延续", () => {
    const oldBox = candidate("old-box", 0);
    const replacement = current(2);
    expect(
      resolveBoardInstance(replacement, replacement.verifiedBoardVersion, [
        oldBox,
      ]),
    ).toMatchObject({ kind: "NO_MATCH" });
  });

  it("同店不同版面不 merge", () => {
    const differentBoard = candidate("different-board", 2, {
      facts: { ipName: "另一个 IP" },
    });
    const observation = current(1);
    expect(
      resolveBoardInstance(observation, observation.verifiedBoardVersion, [
        differentBoard,
      ]).kind,
    ).toBe("NO_MATCH");
  });

  it("后续证据自动消歧", () => {
    const first = candidate("one", 2);
    const second = candidate("two", 2);
    const ambiguous = current(1);
    expect(
      resolveBoardInstance(ambiguous, ambiguous.verifiedBoardVersion, [
        first,
        second,
      ]).kind,
    ).toBe("AMBIGUOUS");
    const laterEvidence = current(1, {
      observedAt: "2026-09-12T03:00:00.000Z",
    });
    const secondNowExhausted = candidate("two", 0, {
      observedAt: "2026-09-12T02:30:00.000Z",
    });
    expect(
      resolveBoardInstance(laterEvidence, laterEvidence.verifiedBoardVersion, [
        first,
        secondNowExhausted,
      ]),
    ).toMatchObject({
      kind: "UNIQUE_MATCH",
      boardInstanceId: "one",
    });
  });
});
