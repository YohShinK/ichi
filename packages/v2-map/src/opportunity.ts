import { fail, type BoardFacts, type ContractResult } from "./types.js";
import {
  isVerifiedBoard,
  recordOpportunityEvaluation,
  OPPORTUNITY_STATUSES,
  type OpportunityEvaluation,
  type OpportunityEvaluationError,
  type OpportunityStatus,
  type VerifiedBoard,
} from "./verification.js";

export interface OpportunityPolicy {
  readonly policyVersion: string;
  readonly lastMaxRemaining: number;
  readonly grandMinRemaining: number;
  readonly highGrandRatio: number;
  readonly lowGrandRatio: number;
  readonly splitMinRemaining: number;
}

export const INITIAL_OPPORTUNITY_POLICY: OpportunityPolicy = Object.freeze({
  policyVersion: "opportunity-20260930-v1",
  lastMaxRemaining: 12,
  grandMinRemaining: 3,
  highGrandRatio: 0.08,
  lowGrandRatio: 0.03,
  splitMinRemaining: 60,
});

export const validOpportunityPolicy = (policy: OpportunityPolicy): boolean =>
  typeof policy?.policyVersion === "string" &&
  policy.policyVersion.trim().length > 0 &&
  [
    policy.lastMaxRemaining,
    policy.grandMinRemaining,
    policy.splitMinRemaining,
  ].every((value) => Number.isSafeInteger(value) && value >= 0) &&
  Number.isFinite(policy.highGrandRatio) &&
  policy.highGrandRatio > 0 &&
  policy.highGrandRatio <= 1 &&
  Number.isFinite(policy.lowGrandRatio) &&
  policy.lowGrandRatio >= 0 &&
  policy.lowGrandRatio < policy.highGrandRatio &&
  policy.splitMinRemaining > policy.lastMaxRemaining &&
  (policy.policyVersion !== INITIAL_OPPORTUNITY_POLICY.policyVersion ||
    (
      [
        "lastMaxRemaining",
        "grandMinRemaining",
        "highGrandRatio",
        "lowGrandRatio",
        "splitMinRemaining",
      ] as const
    ).every((key) => policy[key] === INITIAL_OPPORTUNITY_POLICY[key]));

export const knownRemainingSum = (
  tiers: BoardFacts["tiers"],
): number | null => {
  if (!tiers.length || tiers.some((tier) => tier.remainingTickets === null))
    return null;
  const sum = tiers.reduce(
    (total, tier) => total + (tier.remainingTickets ?? 0),
    0,
  );
  return Number.isSafeInteger(sum) ? sum : null;
};

/** Server-only evaluation of the exact verified version. No ID, upload age or score input. */
export const evaluateOpportunity = (
  board: VerifiedBoard | null,
  command: {
    readonly currentVerifiedBoardVersion: string;
    readonly evaluationId: string;
    readonly evaluationVersion: string;
    readonly evaluatedAt: string;
  },
  policy: OpportunityPolicy = INITIAL_OPPORTUNITY_POLICY,
): ContractResult<OpportunityEvaluation, OpportunityEvaluationError> => {
  if (!isVerifiedBoard(board)) return fail("VERIFIED_BOARD_REQUIRED");
  if (board.verifiedBoardVersion !== command.currentVerifiedBoardVersion)
    return fail("VERIFIED_BOARD_VERSION_MISMATCH");
  if (!validOpportunityPolicy(policy))
    return fail("OPPORTUNITY_EVALUATION_INVALID");
  const r = knownRemainingSum(board.facts.tiers);
  const g = knownRemainingSum(
    board.facts.tiers.filter((tier) => tier.isGrandPrize),
  );
  const ratio = r !== null && r > 0 && g !== null ? g / r : null;
  const states = new Set<OpportunityStatus>();
  if (r !== null && r <= policy.lastMaxRemaining) states.add("LAST_CHANCE");
  if (g !== null && g >= policy.grandMinRemaining)
    states.add("GRAND_PRIZE_REMAINS");
  if (ratio !== null && ratio >= policy.highGrandRatio)
    states.add("GRAND_PRIZE_RATIO");
  if (r !== null && r >= policy.splitMinRemaining) states.add("SPLIT_SET");
  if (
    r !== null &&
    r > policy.lastMaxRemaining &&
    (g === 0 || (ratio !== null && ratio <= policy.lowGrandRatio))
  )
    states.add("LOW_OPPORTUNITY");
  // Founder fallback is only meaningful when the necessary facts are known.
  if (r !== null && g !== null && states.size === 0)
    states.add("LOW_OPPORTUNITY");
  const reasonCodes = OPPORTUNITY_STATUSES.filter((state) => states.has(state));
  return recordOpportunityEvaluation(board, {
    evaluationId: command.evaluationId,
    evaluationVersion: command.evaluationVersion,
    verifiedBoardId: board.verifiedBoardId,
    verifiedBoardVersion: board.verifiedBoardVersion,
    primaryStatus: reasonCodes[0] ?? null,
    reasonCodes,
    policyVersion: policy.policyVersion,
    evaluatedAt: command.evaluatedAt,
    publicGateDecision: "PASS",
  });
};
