import {
  fail,
  ok,
  type BoardFacts,
  type ContractResult,
  type SourceProvenance,
  type VerificationInput,
} from "./types.js";
import { validateBoardFacts } from "./source-adapters.js";

const VERIFIED_BOARD_ARTIFACT = Symbol("VerifiedBoard");
const OPPORTUNITY_EVALUATION_ARTIFACT = Symbol("OpportunityEvaluation");

export interface VerifiedBoard {
  readonly kind: "VERIFIED_BOARD";
  readonly verifiedBoardId: string;
  readonly verifiedBoardVersion: string;
  readonly observationVersionId: string;
  readonly observedAt: string;
  readonly facts: BoardFacts;
  readonly provenance: SourceProvenance;
  readonly verification: {
    readonly verificationId: string;
    readonly policyVersion: string;
    readonly verifiedAt: string;
    readonly result: "VERIFIED";
  };
  readonly [VERIFIED_BOARD_ARTIFACT]: true;
}

export type VerificationError =
  | "VERIFICATION_INPUT_REQUIRED"
  | "OBSERVATION_VERSION_MISMATCH"
  | "STALE_OBSERVATION_VERSION"
  | "BOARD_FACTS_INVALID";

export const verifyBoard = (
  input: VerificationInput | null,
  command: {
    readonly expectedObservationVersionId: string;
    readonly currentObservationVersionId: string;
    readonly verifiedBoardId: string;
    readonly verifiedBoardVersion: string;
    readonly verificationId: string;
    readonly policyVersion: string;
    readonly verifiedAt: string;
  },
): ContractResult<VerifiedBoard, VerificationError> => {
  if (!input || input.verificationInputOnly !== true) {
    return fail("VERIFICATION_INPUT_REQUIRED");
  }
  if (input.observationVersionId !== command.expectedObservationVersionId) {
    return fail("OBSERVATION_VERSION_MISMATCH");
  }
  if (input.observationVersionId !== command.currentObservationVersionId) {
    return fail("STALE_OBSERVATION_VERSION");
  }
  if (!validateBoardFacts(input.boardFacts)) return fail("BOARD_FACTS_INVALID");
  return ok({
    kind: "VERIFIED_BOARD",
    verifiedBoardId: command.verifiedBoardId,
    verifiedBoardVersion: command.verifiedBoardVersion,
    observationVersionId: input.observationVersionId,
    observedAt: input.observedAt,
    facts: structuredClone(input.boardFacts),
    provenance: structuredClone(input.provenance),
    verification: {
      verificationId: command.verificationId,
      policyVersion: command.policyVersion,
      verifiedAt: command.verifiedAt,
      result: "VERIFIED",
    },
    [VERIFIED_BOARD_ARTIFACT]: true,
  });
};

export const isVerifiedBoard = (value: unknown): value is VerifiedBoard =>
  typeof value === "object" &&
  value !== null &&
  (value as Partial<VerifiedBoard>).kind === "VERIFIED_BOARD" &&
  (value as Partial<VerifiedBoard>)[VERIFIED_BOARD_ARTIFACT] === true &&
  (value as Partial<VerifiedBoard>).verification?.result === "VERIFIED";

export const OPPORTUNITY_STATUSES = [
  "LAST_CHANCE",
  "GRAND_PRIZE_RATIO",
  "GRAND_PRIZE_REMAINS",
  "SPLIT_SET",
  "LOW_OPPORTUNITY",
] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export interface OpportunityEvaluation {
  readonly kind: "OPPORTUNITY_EVALUATION";
  readonly evaluationId: string;
  readonly evaluationVersion: string;
  readonly verifiedBoardId: string;
  readonly verifiedBoardVersion: string;
  readonly primaryStatus: OpportunityStatus | null;
  readonly reasonCodes: readonly string[];
  readonly policyVersion: string;
  readonly evaluatedAt: string;
  /** Opportunity never overrides the independent public safety/rights gates. */
  readonly publicGateDecision: "PASS" | "FAIL";
  readonly [OPPORTUNITY_EVALUATION_ARTIFACT]: true;
}

export type OpportunityEvaluationError =
  | "VERIFIED_BOARD_REQUIRED"
  | "VERIFIED_BOARD_VERSION_MISMATCH"
  | "OPPORTUNITY_EVALUATION_INVALID";

export const recordOpportunityEvaluation = (
  verifiedBoard: VerifiedBoard | null,
  result: Omit<
    OpportunityEvaluation,
    "kind" | typeof OPPORTUNITY_EVALUATION_ARTIFACT
  >,
): ContractResult<OpportunityEvaluation, OpportunityEvaluationError> => {
  if (!isVerifiedBoard(verifiedBoard)) return fail("VERIFIED_BOARD_REQUIRED");
  if (
    result.verifiedBoardId !== verifiedBoard.verifiedBoardId ||
    result.verifiedBoardVersion !== verifiedBoard.verifiedBoardVersion
  ) {
    return fail("VERIFIED_BOARD_VERSION_MISMATCH");
  }
  if (
    result.evaluationId.trim().length === 0 ||
    result.evaluationVersion.trim().length === 0 ||
    result.policyVersion.trim().length === 0 ||
    !Number.isFinite(Date.parse(result.evaluatedAt)) ||
    result.reasonCodes.some((reason) => reason.trim().length === 0)
  ) {
    return fail("OPPORTUNITY_EVALUATION_INVALID");
  }
  return ok({
    ...structuredClone(result),
    kind: "OPPORTUNITY_EVALUATION",
    [OPPORTUNITY_EVALUATION_ARTIFACT]: true,
  });
};

export const isOpportunityEvaluation = (
  value: unknown,
): value is OpportunityEvaluation =>
  typeof value === "object" &&
  value !== null &&
  (value as Partial<OpportunityEvaluation>).kind === "OPPORTUNITY_EVALUATION" &&
  (value as Partial<OpportunityEvaluation>)[OPPORTUNITY_EVALUATION_ARTIFACT] ===
    true;
