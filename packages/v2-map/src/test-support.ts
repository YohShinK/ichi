import { buildPublicCandidate, type PublicCandidate } from "./projector.js";
import { projectPublicContributor } from "./avatar-projection.js";
import type { BoardFacts, VerificationInput } from "./types.js";
import {
  recordOpportunityEvaluation,
  verifyBoard,
  type OpportunityStatus,
  type VerifiedBoard,
} from "./verification.js";

export const testBoardFacts = (
  remaining = 1,
  overrides: Partial<BoardFacts> = {},
): BoardFacts => ({
  schemaVersion: "board-record-r2-1.0.0",
  ipName: "测试 IP",
  themeName: "测试主题",
  pricePerDrawMinor: 7900,
  tiers: [
    {
      tierCode: "A",
      rawLabel: "A赏",
      initialRemainingTickets: 2,
      remainingTickets: remaining,
      isGrandPrize: true,
    },
  ],
  ...overrides,
});

export const testVerificationInput = (
  observationVersionId: string,
  observedAt = "2026-09-12T01:00:00.000Z",
  facts = testBoardFacts(),
): VerificationInput => ({
  observationVersionId,
  privateLineageId: `lineage-${observationVersionId}`,
  ownerAccountId: "account-a",
  observedAt,
  location: {
    coordinateSystem: "GCJ02",
    latitude: 31.23,
    longitude: 121.47,
    accuracyMeters: 18,
    capturedAt: observedAt,
  },
  boardFacts: facts,
  provenance: {
    sourceType: "PLAYER_ASSISTED",
    originSourcePath: "assisted-draw",
    sourceVersion: `source-${observationVersionId}`,
    ownerAccountId: "account-a",
    recordType: "DRAW_RECORD",
  },
  note: { text: null, safetyProvenance: null },
  verificationInputOnly: true,
});

export const testVerifiedBoard = (
  observationVersionId: string,
  options: {
    readonly observedAt?: string;
    readonly facts?: BoardFacts;
    readonly verifiedBoardVersion?: string;
  } = {},
): VerifiedBoard => {
  const input = testVerificationInput(
    observationVersionId,
    options.observedAt,
    options.facts,
  );
  const result = verifyBoard(input, {
    expectedObservationVersionId: observationVersionId,
    currentObservationVersionId: observationVersionId,
    verifiedBoardId: `verified-${observationVersionId}`,
    verifiedBoardVersion: options.verifiedBoardVersion ?? "verified-v1",
    verificationId: `verification-${observationVersionId}`,
    policyVersion: "verification-policy-v1",
    verifiedAt: "2026-09-12T01:01:00.000Z",
  });
  if (!result.ok) throw new Error(result.code);
  return result.value;
};

export const testPublicCandidate = (
  observationVersionId: string,
  options: {
    readonly observedAt?: string;
    readonly gates?: Partial<{
      readonly sourceCurrent: boolean;
      readonly authorizationApplicable: boolean;
      readonly rightsEligible: boolean;
      readonly publicEligible: boolean;
      readonly moderationVisible: boolean;
      readonly deleted: boolean;
    }>;
    readonly opportunityStatus?: OpportunityStatus;
    readonly publicGateDecision?: "PASS" | "FAIL";
    readonly publicLocation?: null;
  } = {},
): PublicCandidate => {
  const verified = testVerifiedBoard(observationVersionId, {
    ...(options.observedAt ? { observedAt: options.observedAt } : {}),
  });
  const evaluated = recordOpportunityEvaluation(verified, {
    evaluationId: `evaluation-${observationVersionId}`,
    evaluationVersion: "evaluation-v1",
    verifiedBoardId: verified.verifiedBoardId,
    verifiedBoardVersion: verified.verifiedBoardVersion,
    primaryStatus: options.opportunityStatus ?? "GRAND_PRIZE_REMAINS",
    reasonCodes: ["GRAND_PRIZE_REMAINS"],
    policyVersion: "opportunity-20260930-v1",
    evaluatedAt: "2026-09-12T01:02:00.000Z",
    publicGateDecision: options.publicGateDecision ?? "PASS",
  });
  if (!evaluated.ok) throw new Error(evaluated.code);
  const contributor = projectPublicContributor(
    {
      accountId: "account-a",
      profileVersion: "profile-v1",
      lifecycle: "ACTIVE",
      displayName: null,
      displayNameSafetyPassed: false,
      avatarFileId: null,
    },
    true,
    { issue: () => null },
    { allowedSignedUrlOrigins: [], maxAgeSeconds: 300 },
    Date.parse("2026-09-12T01:00:00.000Z"),
  );
  const built = buildPublicCandidate({
    candidateId: `candidate-${observationVersionId}`,
    boardInstanceId: "instance-1",
    currentVerifiedBoardVersion: verified.verifiedBoardVersion,
    verifiedBoard: verified,
    opportunityEvaluation: evaluated.value,
    boardShortLabel: "测试 IP · 测试主题",
    freshnessPolicyVersion: "freshness-v1",
    publicLocation:
      options.publicLocation === null
        ? null
        : {
            coordinateSystem: "GCJ02",
            latitude: 31.23,
            longitude: 121.47,
            precisionMode: "APPROXIMATE",
            areaLabel: "上海",
            locationPolicyVersion: "location-v1",
            projectionRuleId: "approximate-a",
          },
    venueNote: null,
    contributor,
    gates: {
      sourceCurrent: true,
      authorizationApplicable: true,
      rightsEligible: true,
      publicEligible: true,
      moderationVisible: true,
      deleted: false,
      ...options.gates,
    },
  });
  if (!built.ok) throw new Error(built.code);
  return built.value;
};
