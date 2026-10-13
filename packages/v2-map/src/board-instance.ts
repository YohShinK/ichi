import { createHash } from "node:crypto";

import { fail, ok, type BoardFacts, type ContractResult } from "./types.js";
import { isVerifiedBoard, type VerifiedBoard } from "./verification.js";

export interface BoardInstanceCandidate {
  readonly boardInstanceId: string;
  readonly lastVerifiedBoard: VerifiedBoard;
}

export type ResolutionResult =
  | {
      readonly kind: "UNIQUE_MATCH";
      readonly boardInstanceId: string;
      readonly candidateIds: readonly string[];
    }
  | {
      readonly kind: "NO_MATCH";
      readonly candidateIds: readonly string[];
    }
  | {
      readonly kind: "AMBIGUOUS";
      readonly candidateIds: readonly string[];
    }
  | {
      readonly kind: "REJECTED_UNVERIFIED" | "REJECTED_STALE_VERSION";
      readonly candidateIds: readonly [];
    };

const signaturePayload = (facts: BoardFacts): unknown => ({
  schemaVersion: facts.schemaVersion,
  ipName: facts.ipName.trim(),
  themeName: facts.themeName?.trim() ?? null,
  tiers: [...facts.tiers]
    .sort((left, right) => left.tierCode.localeCompare(right.tierCode))
    .map((tier) => ({
      tierCode: tier.tierCode,
      initialRemainingTickets: tier.initialRemainingTickets,
      isGrandPrize: tier.isGrandPrize,
    })),
});

export const boardIdentitySignature = (facts: BoardFacts): string =>
  createHash("sha256")
    .update(JSON.stringify(signaturePayload(facts)))
    .digest("hex");

export const isForwardBoardTransition = (
  earlier: BoardFacts,
  later: BoardFacts,
): boolean => {
  if (boardIdentitySignature(earlier) !== boardIdentitySignature(later)) {
    return false;
  }

  const laterByCode = new Map(
    later.tiers.map((tier) => [tier.tierCode, tier] as const),
  );
  return earlier.tiers.every((oldTier) => {
    const newTier = laterByCode.get(oldTier.tierCode);
    if (!newTier) return false;
    if (
      oldTier.remainingTickets === null ||
      newTier.remainingTickets === null
    ) {
      return true;
    }
    return newTier.remainingTickets <= oldTier.remainingTickets;
  });
};

export const resolveBoardInstance = (
  verifiedBoard: VerifiedBoard,
  currentVerifiedBoardVersion: string,
  locationCandidates: readonly BoardInstanceCandidate[],
): ResolutionResult => {
  if (!isVerifiedBoard(verifiedBoard)) {
    return { kind: "REJECTED_UNVERIFIED", candidateIds: [] };
  }
  if (verifiedBoard.verifiedBoardVersion !== currentVerifiedBoardVersion) {
    return { kind: "REJECTED_STALE_VERSION", candidateIds: [] };
  }
  const compatible = locationCandidates.filter(
    (candidate) =>
      isVerifiedBoard(candidate.lastVerifiedBoard) &&
      Date.parse(verifiedBoard.observedAt) >
        Date.parse(candidate.lastVerifiedBoard.observedAt) &&
      isForwardBoardTransition(
        candidate.lastVerifiedBoard.facts,
        verifiedBoard.facts,
      ),
  );
  const candidateIds = compatible.map(({ boardInstanceId }) => boardInstanceId);

  if (compatible.length === 1) {
    return {
      kind: "UNIQUE_MATCH",
      boardInstanceId: compatible[0]!.boardInstanceId,
      candidateIds,
    };
  }
  if (compatible.length === 0) return { kind: "NO_MATCH", candidateIds };
  return { kind: "AMBIGUOUS", candidateIds };
};

export interface AssociationDecision {
  readonly decisionVersion: number;
  readonly observationVersionId: string;
  readonly boardInstanceId: string | null;
  readonly action: "LINK" | "UNLINK" | "RELINK";
  readonly resolverVersion: string;
  readonly supersedesDecisionVersion: number | null;
}

export type AssociationError =
  "STALE_DECISION_VERSION" | "RESOLUTION_NOT_UNIQUE" | "TARGET_MISMATCH";

export const appendAssociationDecision = (
  history: readonly AssociationDecision[],
  command: {
    readonly expectedLatestDecisionVersion: number;
    readonly observationVersionId: string;
    readonly action: AssociationDecision["action"];
    readonly targetBoardInstanceId: string | null;
    readonly resolution: ResolutionResult;
    readonly resolverVersion: string;
  },
): ContractResult<readonly AssociationDecision[], AssociationError> => {
  const latestVersion = history.at(-1)?.decisionVersion ?? 0;
  if (latestVersion !== command.expectedLatestDecisionVersion) {
    return fail("STALE_DECISION_VERSION");
  }
  if (command.action !== "UNLINK") {
    if (command.resolution.kind !== "UNIQUE_MATCH") {
      return fail("RESOLUTION_NOT_UNIQUE");
    }
    if (command.targetBoardInstanceId !== command.resolution.boardInstanceId) {
      return fail("TARGET_MISMATCH");
    }
  }

  return ok([
    ...history,
    {
      decisionVersion: latestVersion + 1,
      observationVersionId: command.observationVersionId,
      boardInstanceId:
        command.action === "UNLINK" ? null : command.targetBoardInstanceId,
      action: command.action,
      resolverVersion: command.resolverVersion,
      supersedesDecisionVersion: latestVersion === 0 ? null : latestVersion,
    },
  ]);
};

export interface HumanAssistanceEvidence {
  readonly observationVersionId: string;
  readonly comparisonObservationVersionId: string;
  readonly answer: "SAME_BOARD" | "DIFFERENT_BOARD" | "CANNOT_TELL";
  readonly resolverContextVersion: string;
  readonly createdAt: string;
}

export const recordHumanAssistanceEvidence = (
  existing: readonly HumanAssistanceEvidence[],
  evidence: HumanAssistanceEvidence,
): ContractResult<readonly HumanAssistanceEvidence[], "BUDGET_EXHAUSTED"> => {
  if (
    existing.some(
      (item) => item.observationVersionId === evidence.observationVersionId,
    )
  ) {
    return fail("BUDGET_EXHAUSTED");
  }
  return ok([...existing, evidence]);
};
