import { createHash } from "node:crypto";

import {
  fail,
  ok,
  type BoardFacts,
  type ContractResult,
  type VerificationInput,
  type V1ApprovedDrawSubmission,
  type V1CurrentPublication,
} from "./types.js";

export type SourceAdapterError =
  | "SOURCE_PATH_MISMATCH"
  | "SOURCE_NOT_CURRENT"
  | "RECOGNITION_NOT_ACCEPTED"
  | "PUBLISHED_VERSION_MISSING"
  | "SUBMISSION_IDENTITY_MISMATCH"
  | "SUBMISSION_VERSION_MISMATCH"
  | "SUBMISSION_NOT_APPROVED"
  | "BOARD_FACTS_INVALID";

const isNonNegativeIntegerOrNull = (value: number | null): boolean =>
  value === null || (Number.isInteger(value) && value >= 0);

export const validateBoardFacts = (facts: BoardFacts): boolean => {
  if (
    facts.ipName.trim().length === 0 ||
    facts.schemaVersion.trim().length === 0 ||
    facts.tiers.length === 0 ||
    !isNonNegativeIntegerOrNull(facts.pricePerDrawMinor)
  ) {
    return false;
  }

  const codes = new Set<string>();
  return facts.tiers.every((tier) => {
    if (
      tier.tierCode.trim().length === 0 ||
      codes.has(tier.tierCode) ||
      !isNonNegativeIntegerOrNull(tier.initialRemainingTickets) ||
      !isNonNegativeIntegerOrNull(tier.remainingTickets)
    ) {
      return false;
    }
    codes.add(tier.tierCode);
    return true;
  });
};

const privateId = (...parts: readonly string[]): string =>
  createHash("sha256").update(parts.join("\u001f")).digest("hex");

const buildObservation = (
  publication: V1CurrentPublication,
  sourceVersion: string,
  boardFacts: BoardFacts,
  note: VerificationInput["note"],
): VerificationInput => ({
  observationVersionId: privateId(
    "observation-version",
    publication.recordId,
    sourceVersion,
  ),
  privateLineageId: privateId(
    "observation-lineage",
    publication.recordId,
    publication.boardId,
  ),
  ownerAccountId: publication.ownerAccountId,
  observedAt: publication.observedAt,
  location: structuredClone(publication.location),
  boardFacts: structuredClone(boardFacts),
  provenance: {
    sourceType: "V1_HISTORY",
    originSourcePath: publication.sourcePath,
    sourceVersion,
    ownerAccountId: publication.ownerAccountId,
    recordType:
      publication.sourcePath === "assisted-draw"
        ? "DRAW_RECORD"
        : "UPLOAD_RECORD",
  },
  note,
  verificationInputOnly: true,
});

export const adaptDirectPublication = (
  publication: V1CurrentPublication,
): ContractResult<VerificationInput, SourceAdapterError> => {
  if (publication.sourcePath !== "direct-upload") {
    return fail("SOURCE_PATH_MISMATCH");
  }
  if (publication.lifecycleState !== "CURRENT") {
    return fail("SOURCE_NOT_CURRENT");
  }
  if (publication.recognition.status !== "ACCEPTED") {
    return fail("RECOGNITION_NOT_ACCEPTED");
  }
  if (!validateBoardFacts(publication.finalSnapshot)) {
    return fail("BOARD_FACTS_INVALID");
  }

  const sourceVersion = `direct:${publication.recognition.jobId}:${publication.recognition.correctionVersion}`;
  return ok(
    buildObservation(publication, sourceVersion, publication.finalSnapshot, {
      text: null,
      safetyProvenance: null,
    }),
  );
};

export const adaptAssistedPublication = (
  publication: V1CurrentPublication,
  submission: V1ApprovedDrawSubmission,
): ContractResult<VerificationInput, SourceAdapterError> => {
  if (publication.sourcePath !== "assisted-draw") {
    return fail("SOURCE_PATH_MISMATCH");
  }
  if (publication.lifecycleState !== "CURRENT") {
    return fail("SOURCE_NOT_CURRENT");
  }
  if (publication.publishedSubmissionVersion === null) {
    return fail("PUBLISHED_VERSION_MISSING");
  }
  if (
    submission.recordId !== publication.recordId ||
    submission.boardId !== publication.boardId ||
    submission.ownerAccountId !== publication.ownerAccountId
  ) {
    return fail("SUBMISSION_IDENTITY_MISMATCH");
  }
  if (submission.submissionVersion !== publication.publishedSubmissionVersion) {
    return fail("SUBMISSION_VERSION_MISMATCH");
  }
  if (submission.status !== "APPROVED") {
    return fail("SUBMISSION_NOT_APPROVED");
  }
  if (!validateBoardFacts(submission.finalSnapshot)) {
    return fail("BOARD_FACTS_INVALID");
  }

  const passedNote =
    submission.userNote !== null &&
    submission.noteSafety?.decision === "NOTE_PASSED"
      ? {
          text: submission.userNote,
          safetyProvenance: {
            contentHash: submission.noteSafety.contentHash,
            decision: "NOTE_PASSED" as const,
            decisionVersion: submission.noteSafety.decisionVersion,
          },
        }
      : { text: null, safetyProvenance: null };

  return ok(
    buildObservation(
      publication,
      `submission:${submission.submissionVersion}`,
      submission.finalSnapshot,
      passedNote,
    ),
  );
};
