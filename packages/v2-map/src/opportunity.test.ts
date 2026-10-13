import { describe, expect, it } from "vitest";
import {
  evaluateOpportunity,
  INITIAL_OPPORTUNITY_POLICY,
} from "./opportunity.js";
import {
  testBoardFacts,
  testVerifiedBoard,
  testPublicCandidate,
} from "./test-support.js";
import { buildPublicCandidate } from "./projector.js";

const board = (g: number | null, ordinary: number | null) =>
  testVerifiedBoard("current-observation", {
    facts: testBoardFacts(0, {
      tiers: [
        {
          tierCode: "X",
          rawLabel: null,
          initialRemainingTickets: null,
          remainingTickets: g,
          isGrandPrize: true,
        },
        {
          tierCode: "A",
          rawLabel: null,
          initialRemainingTickets: null,
          remainingTickets: ordinary,
          isGrandPrize: false,
        },
      ],
    }),
  });
const command = {
  currentVerifiedBoardVersion: "verified-v1",
  evaluationId: "evaluation-current",
  evaluationVersion: "eval-v1",
  evaluatedAt: "2026-09-30T02:00:00.000Z",
};
const states = (g: number | null, ordinary: number | null) => {
  const result = evaluateOpportunity(board(g, ordinary), command);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.code);
  expect(result.value.primaryStatus).toBe(result.value.reasonCodes[0] ?? null);
  return result.value.reasonCodes;
};

describe("Founder Opportunity policy", () => {
  it.each([
    [0, 12, ["LAST_CHANCE"]],
    [0, 13, ["LOW_OPPORTUNITY"]],
    [2, 23, ["GRAND_PRIZE_RATIO"]], // exactly 8%, below stock threshold
    [2, 24, ["LOW_OPPORTUNITY"]], // complete, no positive state fallback
    [3, 47, ["GRAND_PRIZE_REMAINS"]],
    [3, 97, ["GRAND_PRIZE_REMAINS", "SPLIT_SET", "LOW_OPPORTUNITY"]], // exactly 3%
    [3, 34, ["GRAND_PRIZE_RATIO", "GRAND_PRIZE_REMAINS"]],
    [1, 58, ["LOW_OPPORTUNITY"]],
    [1, 59, ["SPLIT_SET", "LOW_OPPORTUNITY"]], // exactly 60
    [5, 55, ["GRAND_PRIZE_RATIO", "GRAND_PRIZE_REMAINS", "SPLIT_SET"]],
    [4, 8, ["LAST_CHANCE", "GRAND_PRIZE_RATIO", "GRAND_PRIZE_REMAINS"]],
    [0, 0, ["LAST_CHANCE"]], // zero denominator never implies ratio
    [null, 0, []],
    [3, null, ["GRAND_PRIZE_REMAINS"]], // independent known evidence
    [0, null, []], // no known non-LAST
  ] as const)("evaluates G=%s ordinary=%s", (g, ordinary, expected) => {
    expect(states(g, ordinary)).toEqual(expected);
  });
  it("uses only user-selected prize tiers, not fixed A/B/C or initial stock", () => {
    expect(states(0, 100)).toEqual(["SPLIT_SET", "LOW_OPPORTUNITY"]);
    const value = board(2, 23);
    const result = evaluateOpportunity(value, command);
    expect(result.ok && result.value.reasonCodes).toEqual([
      "GRAND_PRIZE_RATIO",
    ]);
  });
  it("does not invent zero for an empty user-selected set", () => {
    const value = testVerifiedBoard("empty", {
      facts: testBoardFacts(30, {
        tiers: board(0, 30).facts.tiers.map((tier) => ({
          ...tier,
          isGrandPrize: false,
        })),
      }),
    });
    const result = evaluateOpportunity(value, command);
    expect(result.ok && result.value.reasonCodes).toEqual([]);
  });
  it("binds the current verified version and rejects unverified input", () => {
    expect(evaluateOpportunity(null, command)).toEqual({
      ok: false,
      code: "VERIFIED_BOARD_REQUIRED",
    });
    expect(
      evaluateOpportunity(board(3, 10), {
        ...command,
        currentVerifiedBoardVersion: "newer",
      }),
    ).toEqual({ ok: false, code: "VERIFIED_BOARD_VERSION_MISMATCH" });
  });
  it("recomputes under a new policy without changing observation or BoardInstance identity", () => {
    const value = board(3, 47);
    const old = evaluateOpportunity(value, command);
    const updated = evaluateOpportunity(value, command, {
      ...INITIAL_OPPORTUNITY_POLICY,
      policyVersion: "opportunity-test-v2",
      grandMinRemaining: 4,
    });
    expect(old.ok && old.value.reasonCodes).toEqual(["GRAND_PRIZE_REMAINS"]);
    expect(updated.ok && updated.value.reasonCodes).toEqual([
      "LOW_OPPORTUNITY",
    ]);
    expect(value.observationVersionId).toBe("current-observation");
    expect(
      evaluateOpportunity(value, command, {
        ...INITIAL_OPPORTUNITY_POLICY,
        grandMinRemaining: 2,
      }).ok,
    ).toBe(false);
    expect(
      evaluateOpportunity(value, command, {
        ...INITIAL_OPPORTUNITY_POLICY,
        highGrandRatio: Number.NaN,
      }).ok,
    ).toBe(false);
  });
  it("keeps low opportunity eligible subject to all independent gates", () => {
    const value = board(0, 30);
    const evaluation = evaluateOpportunity(value, command);
    if (!evaluation.ok) throw new Error(evaluation.code);
    const fixture = testPublicCandidate("seed");
    const result = buildPublicCandidate({
      candidateId: "low-candidate",
      boardInstanceId: "same-instance",
      currentVerifiedBoardVersion: "verified-v1",
      verifiedBoard: value,
      opportunityEvaluation: evaluation.value,
      boardShortLabel: "公开测试",
      freshnessPolicyVersion: "fresh-v1",
      publicLocation: fixture.publicLocation,
      venueNote: null,
      contributor: null,
      gates: {
        sourceCurrent: true,
        authorizationApplicable: true,
        rightsEligible: true,
        publicEligible: true,
        moderationVisible: true,
        deleted: false,
      },
    });
    expect(result.ok && result.value.opportunity.primaryStatus).toBe(
      "LOW_OPPORTUNITY",
    );
    expect(result.ok && result.value.boardInstanceId).toBe("same-instance");
  });
});
