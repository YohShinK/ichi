import { describe, expect, it } from "vitest";

import {
  acceptMapAuthorization,
  adaptAssistedPublication,
  adaptDirectPublication,
  appendAssociationDecision,
  applyOwnerContributionCommand,
  evaluateAuthorizationApplicability,
  isForwardBoardTransition,
  recordHumanAssistanceEvidence,
  resolveBoardInstance,
  type AuthorizationLedger,
  type BoardFacts,
  type V1ApprovedDrawSubmission,
  type V1CurrentPublication,
} from "./index.js";
import { testVerifiedBoard } from "./test-support.js";

const facts = (remainingA: number | null, remainingB = 3): BoardFacts => ({
  schemaVersion: "board-record-r2-1.0.0",
  ipName: "测试 IP",
  themeName: "测试主题",
  pricePerDrawMinor: 7900,
  tiers: [
    {
      tierCode: "A",
      rawLabel: "A赏",
      initialRemainingTickets: 2,
      remainingTickets: remainingA,
      isGrandPrize: true,
    },
    {
      tierCode: "B",
      rawLabel: "B赏",
      initialRemainingTickets: 4,
      remainingTickets: remainingB,
      isGrandPrize: false,
    },
  ],
});

const publication = (
  sourcePath: V1CurrentPublication["sourcePath"],
): V1CurrentPublication => ({
  recordId: "private-record-1",
  boardId: "private-board-1",
  ownerAccountId: "account-a",
  sourcePath,
  lifecycleState: "CURRENT",
  observedAt: "2026-09-12T01:00:00.000Z",
  location: {
    coordinateSystem: "GCJ02",
    latitude: 31.23,
    longitude: 121.47,
    accuracyMeters: 18,
    capturedAt: "2026-09-12T01:00:00.000Z",
  },
  finalSnapshot: facts(2),
  recognition: {
    jobId: "recognition-1",
    status: "ACCEPTED",
    correctionVersion: 2,
  },
  publishedSubmissionVersion: sourcePath === "assisted-draw" ? 3 : null,
});

const submission = (
  overrides: Partial<V1ApprovedDrawSubmission> = {},
): V1ApprovedDrawSubmission => ({
  recordId: "private-record-1",
  boardId: "private-board-1",
  ownerAccountId: "account-a",
  submissionVersion: 3,
  status: "APPROVED",
  finalSnapshot: facts(0, 2),
  userNote: "商场三楼店内",
  noteSafety: {
    contentHash: "safe-content-hash",
    decision: "NOTE_PASSED",
    decisionVersion: "msg-sec-v1",
  },
  ...overrides,
});

describe("TASK-V2-10 source-specific adapters", () => {
  it("locks DRAW_RECORD to the exact current approved submission", () => {
    const adapted = adaptAssistedPublication(
      publication("assisted-draw"),
      submission(),
    );
    expect(adapted.ok).toBe(true);
    if (!adapted.ok) return;
    expect(adapted.value.provenance.recordType).toBe("DRAW_RECORD");
    expect(adapted.value.provenance.sourceVersion).toBe("submission:3");
    expect(adapted.value.boardFacts.tiers[0]?.remainingTickets).toBe(0);
    expect(adapted.value.note.safetyProvenance?.decision).toBe("NOTE_PASSED");

    expect(
      adaptAssistedPublication(
        publication("assisted-draw"),
        submission({ submissionVersion: 2 }),
      ),
    ).toEqual({ ok: false, code: "SUBMISSION_VERSION_MISMATCH" });
    expect(
      adaptAssistedPublication(
        publication("assisted-draw"),
        submission({ ownerAccountId: "account-b" }),
      ),
    ).toEqual({ ok: false, code: "SUBMISSION_IDENTITY_MISMATCH" });
  });

  it("accepts finalized direct P1 without an assisted submission", () => {
    const adapted = adaptDirectPublication(publication("direct-upload"));
    expect(adapted.ok).toBe(true);
    if (!adapted.ok) return;
    expect(adapted.value.provenance.recordType).toBe("UPLOAD_RECORD");
    expect(adapted.value.note).toEqual({
      text: null,
      safetyProvenance: null,
    });
    expect(adapted.value.verificationInputOnly).toBe(true);
  });

  it("preserves null and confirmed zero", () => {
    const direct = publication("direct-upload");
    const nullAdapted = adaptDirectPublication({
      ...direct,
      finalSnapshot: facts(null),
    });
    const zeroAdapted = adaptDirectPublication({
      ...direct,
      finalSnapshot: facts(0),
    });
    expect(
      nullAdapted.ok && nullAdapted.value.boardFacts.tiers[0]?.remainingTickets,
    ).toBeNull();
    expect(
      zeroAdapted.ok && zeroAdapted.value.boardFacts.tiers[0]?.remainingTickets,
    ).toBe(0);
  });
});

describe("TASK-V2-10 conservative BoardInstance resolution", () => {
  const priorVerified = testVerifiedBoard("observation-old", {
    observedAt: "2026-09-12T00:00:00.000Z",
    facts: facts(2),
  });
  const prior = {
    boardInstanceId: "instance-a",
    lastVerifiedBoard: priorVerified,
  } as const;
  const next = testVerifiedBoard("observation-new", {
    observedAt: "2026-09-12T02:00:00.000Z",
    facts: facts(1),
  });

  it("returns UNIQUE_MATCH, NO_MATCH and AMBIGUOUS without using location as proof", () => {
    expect(
      resolveBoardInstance(next, next.verifiedBoardVersion, [prior]),
    ).toMatchObject({
      kind: "UNIQUE_MATCH",
      boardInstanceId: "instance-a",
    });
    const increased = testVerifiedBoard("observation-increased", {
      observedAt: next.observedAt,
      facts: facts(3),
    });
    expect(
      resolveBoardInstance(increased, increased.verifiedBoardVersion, [prior]),
    ).toEqual({ kind: "NO_MATCH", candidateIds: [] });
    expect(
      resolveBoardInstance(next, next.verifiedBoardVersion, [
        prior,
        { ...prior, boardInstanceId: "instance-b" },
      ]),
    ).toEqual({
      kind: "AMBIGUOUS",
      candidateIds: ["instance-a", "instance-b"],
    });
  });

  it("rejects raw verification input and stale VerifiedBoard versions", () => {
    const raw = adaptDirectPublication(publication("direct-upload"));
    expect(raw.ok).toBe(true);
    if (!raw.ok) return;
    expect(
      resolveBoardInstance(
        raw.value as unknown as typeof next,
        next.verifiedBoardVersion,
        [prior],
      ),
    ).toEqual({ kind: "REJECTED_UNVERIFIED", candidateIds: [] });
    expect(resolveBoardInstance(next, "verified-v2", [prior])).toEqual({
      kind: "REJECTED_STALE_VERSION",
      candidateIds: [],
    });
  });

  it("treats null as unknown and zero as a physical boundary", () => {
    expect(isForwardBoardTransition(facts(null), facts(0))).toBe(true);
    expect(isForwardBoardTransition(facts(0), facts(1))).toBe(false);
  });

  it("versions link, unlink and relink decisions without rewriting history", () => {
    const unique = resolveBoardInstance(next, next.verifiedBoardVersion, [
      prior,
    ]);
    const linked = appendAssociationDecision([], {
      expectedLatestDecisionVersion: 0,
      observationVersionId: next.observationVersionId,
      action: "LINK",
      targetBoardInstanceId: "instance-a",
      resolution: unique,
      resolverVersion: "resolver-v1",
    });
    expect(linked.ok).toBe(true);
    if (!linked.ok) return;
    const unlinked = appendAssociationDecision(linked.value, {
      expectedLatestDecisionVersion: 1,
      observationVersionId: next.observationVersionId,
      action: "UNLINK",
      targetBoardInstanceId: null,
      resolution: unique,
      resolverVersion: "resolver-v1",
    });
    expect(unlinked.ok).toBe(true);
    if (!unlinked.ok) return;
    expect(unlinked.value).toHaveLength(2);
    expect(unlinked.value[0]?.boardInstanceId).toBe("instance-a");
    expect(unlinked.value[1]?.boardInstanceId).toBeNull();
    expect(
      appendAssociationDecision(unlinked.value, {
        expectedLatestDecisionVersion: 1,
        observationVersionId: next.observationVersionId,
        action: "RELINK",
        targetBoardInstanceId: "instance-a",
        resolution: unique,
        resolverVersion: "resolver-v1",
      }),
    ).toEqual({ ok: false, code: "STALE_DECISION_VERSION" });
  });

  it("records Human Assistance as bounded evidence, never a merge command", () => {
    const evidence = {
      observationVersionId: "observation-new",
      comparisonObservationVersionId: "observation-old",
      answer: "SAME_BOARD" as const,
      resolverContextVersion: "resolver-v1",
      createdAt: "2026-09-12T02:01:00.000Z",
    };
    const once = recordHumanAssistanceEvidence([], evidence);
    expect(once.ok).toBe(true);
    expect(
      recordHumanAssistanceEvidence(once.ok ? once.value : [], evidence),
    ).toEqual({ ok: false, code: "BUDGET_EXHAUSTED" });
  });
});

describe("TASK-V2-10 authorization and owner controls", () => {
  const empty: AuthorizationLedger = { byVersion: {}, idempotency: {} };
  const authorization = {
    authorizationVersion: "map-auth-v1",
    ownerAccountId: "account-a",
    acceptedAt: "2026-09-12T02:00:00.000Z",
    scope: {
      history: true,
      future: true,
      recordTypes: ["DRAW_RECORD", "UPLOAD_RECORD"] as const,
      publicLocation: true,
      eligibleVenueNote: true,
      safeContributorProfile: true,
    },
    scopeDigest: "scope-digest-v1",
  } as const;

  it("applies one version to eligible history and future but fails closed when unaccepted", () => {
    expect(
      evaluateAuthorizationApplicability(empty, {
        ownerAccountId: "account-a",
        authorizationVersion: "map-auth-v1",
        recordType: "UPLOAD_RECORD",
        temporalScope: "HISTORY",
        withdrawn: false,
        rightsEligible: true,
      }),
    ).toEqual({ ok: false, code: "AUTHORIZATION_MISSING" });

    const accepted = acceptMapAuthorization(empty, {
      trustedAccountId: "account-a",
      idempotencyKey: "accept-command-1",
      authorization,
    });
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    for (const temporalScope of ["HISTORY", "FUTURE"] as const) {
      expect(
        evaluateAuthorizationApplicability(accepted.value, {
          ownerAccountId: "account-a",
          authorizationVersion: "map-auth-v1",
          recordType: "DRAW_RECORD",
          temporalScope,
          withdrawn: false,
          rightsEligible: true,
        }).ok,
      ).toBe(true);
    }
  });

  it("does not transfer rights and makes owner commands hide first", () => {
    const accepted = acceptMapAuthorization(empty, {
      trustedAccountId: "account-a",
      idempotencyKey: "accept-command-1",
      authorization,
    });
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    expect(
      evaluateAuthorizationApplicability(accepted.value, {
        ownerAccountId: "account-b",
        authorizationVersion: "map-auth-v1",
        recordType: "DRAW_RECORD",
        temporalScope: "FUTURE",
        withdrawn: false,
        rightsEligible: true,
      }),
    ).toEqual({ ok: false, code: "AUTHORIZATION_MISSING" });

    const contribution = {
      contributionId: "contribution-a",
      ownerAccountId: "account-a",
      authorizationApplicable: true,
      lifecycle: "ACTIVE" as const,
      publicHideIntent: false,
      noResurrection: false,
      processedCommandIds: [] as readonly string[],
    };
    const deleted = applyOwnerContributionCommand(contribution, {
      trustedAccountId: "account-a",
      commandId: "delete-1",
      action: "DELETE",
    });
    expect(deleted.ok && deleted.value).toMatchObject({
      lifecycle: "DELETED",
      authorizationApplicable: false,
      publicHideIntent: true,
      noResurrection: true,
    });
    expect(
      applyOwnerContributionCommand(contribution, {
        trustedAccountId: "account-b",
        commandId: "delete-2",
        action: "DELETE",
      }),
    ).toEqual({ ok: false, code: "UNTRUSTED_ACTOR" });
  });

  it("does not overwrite one accepted authorization version with a different scope", () => {
    const accepted = acceptMapAuthorization(empty, {
      trustedAccountId: "account-a",
      idempotencyKey: "accept-command-1",
      authorization,
    });
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;

    expect(
      acceptMapAuthorization(accepted.value, {
        trustedAccountId: "account-a",
        idempotencyKey: "accept-command-2",
        authorization: {
          ...authorization,
          scope: { ...authorization.scope, history: false },
          scopeDigest: "scope-digest-v2",
        },
      }),
    ).toEqual({ ok: false, code: "AUTHORIZATION_VERSION_CONFLICT" });
  });
});
