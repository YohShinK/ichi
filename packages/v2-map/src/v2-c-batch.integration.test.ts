import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import {
  InMemoryPublicLeadRepository,
  InMemoryQuerySnapshotStore,
  InMemorySharedRateLimitStore,
  PUBLIC_MAP_SCHEMA_VERSION,
  PublicMapService,
  acceptMapAuthorization,
  adaptAssistedPublication,
  buildPublicCandidate,
  dryRunPublicMapMigration,
  emptyProjectorState,
  evaluateAuthorizationApplicability,
  initialModerationState,
  projectPublicContributor,
  reconcilePublicMapLead,
  recordOpportunityEvaluation,
  resolveBoardInstance,
  submitModerationReport,
  verifyBoard,
  type AuthorizationLedger,
  type BoardFacts,
  type PublicCandidate,
  type V1ApprovedDrawSubmission,
  type V1CurrentPublication,
} from "./index.js";

const board: BoardFacts = {
  schemaVersion: "board-record-r2-1.0.0",
  ipName: "端到端测试 IP",
  themeName: null,
  pricePerDrawMinor: 8000,
  tiers: [
    {
      tierCode: "A",
      rawLabel: "A赏",
      initialRemainingTickets: 2,
      remainingTickets: 1,
      isGrandPrize: true,
    },
  ],
};

const publication: V1CurrentPublication = {
  recordId: "private-record",
  boardId: "private-board",
  ownerAccountId: "owner-a",
  sourcePath: "assisted-draw",
  lifecycleState: "CURRENT",
  observedAt: "2026-09-12T00:00:00.000Z",
  location: {
    coordinateSystem: "GCJ02",
    latitude: 31.23,
    longitude: 121.47,
    accuracyMeters: 16,
    capturedAt: "2026-09-12T00:00:00.000Z",
  },
  finalSnapshot: board,
  recognition: {
    jobId: "recognition-a",
    status: "ACCEPTED",
    correctionVersion: 0,
  },
  publishedSubmissionVersion: 2,
};

const submission: V1ApprovedDrawSubmission = {
  recordId: "private-record",
  boardId: "private-board",
  ownerAccountId: "owner-a",
  submissionVersion: 2,
  status: "APPROVED",
  finalSnapshot: board,
  userNote: null,
  noteSafety: null,
};

describe("V2-C batch integration", () => {
  it("keeps the production resource manifest unchanged and the candidate explicitly unapplied", () => {
    const production = JSON.parse(
      readFileSync("services/cloudbase/database/resources.json", "utf8"),
    ) as { publicCollections: unknown[]; permission: string };
    const candidate = JSON.parse(
      readFileSync(
        "packages/v2-map/resources/cloudbase-resource-candidate.json",
        "utf8",
      ),
    ) as {
      status: string;
      clientDatabaseAccess: boolean;
      productionManifestMutation: boolean;
      productionResourceMutation: boolean;
    };
    expect(production).toMatchObject({
      publicCollections: [],
      permission: "ADMINONLY",
    });
    expect(candidate).toEqual(
      expect.objectContaining({
        status: "LOCAL_CANDIDATE_NOT_APPLIED",
        clientDatabaseAccess: false,
        productionManifestMutation: false,
        productionResourceMutation: false,
      }),
    );
  });

  it("runs authoritative input through authorization, resolution, projection, moderation and public API", () => {
    const adapted = adaptAssistedPublication(publication, submission);
    expect(adapted.ok).toBe(true);
    if (!adapted.ok) return;

    const verified = verifyBoard(adapted.value, {
      expectedObservationVersionId: adapted.value.observationVersionId,
      currentObservationVersionId: adapted.value.observationVersionId,
      verifiedBoardId: "verified-board-1",
      verifiedBoardVersion: "verified-v1",
      verificationId: "verification-1",
      policyVersion: "verification-policy-v1",
      verifiedAt: "2026-09-12T00:15:00.000Z",
    });
    expect(verified.ok).toBe(true);
    if (!verified.ok) return;
    const resolution = resolveBoardInstance(
      verified.value,
      verified.value.verifiedBoardVersion,
      [],
    );
    expect(resolution.kind).toBe("NO_MATCH");

    const emptyLedger: AuthorizationLedger = {
      byVersion: {},
      idempotency: {},
    };
    const accepted = acceptMapAuthorization(emptyLedger, {
      trustedAccountId: "owner-a",
      idempotencyKey: "accept-v1",
      authorization: {
        authorizationVersion: "map-auth-v1",
        ownerAccountId: "owner-a",
        acceptedAt: "2026-09-12T00:10:00.000Z",
        scope: {
          history: true,
          future: true,
          recordTypes: ["DRAW_RECORD", "UPLOAD_RECORD"],
          publicLocation: true,
          eligibleVenueNote: true,
          safeContributorProfile: true,
        },
        scopeDigest: "scope-v1",
      },
    });
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    expect(
      evaluateAuthorizationApplicability(accepted.value, {
        ownerAccountId: "owner-a",
        authorizationVersion: "map-auth-v1",
        recordType: "DRAW_RECORD",
        temporalScope: "HISTORY",
        withdrawn: false,
        rightsEligible: true,
      }).ok,
    ).toBe(true);

    const opportunity = recordOpportunityEvaluation(verified.value, {
      evaluationId: "opportunity-1",
      evaluationVersion: "opportunity-evaluation-v1",
      verifiedBoardId: verified.value.verifiedBoardId,
      verifiedBoardVersion: verified.value.verifiedBoardVersion,
      primaryStatus: "GRAND_PRIZE_REMAINS",
      reasonCodes: ["GRAND_PRIZE_REMAINS"],
      policyVersion: "approved-opportunity-input-v1",
      evaluatedAt: "2026-09-12T00:20:00.000Z",
      publicGateDecision: "PASS",
    });
    expect(opportunity.ok).toBe(true);
    if (!opportunity.ok) return;
    const contributor = projectPublicContributor(
      {
        accountId: "owner-a",
        profileVersion: "profile-v1",
        lifecycle: "ACTIVE",
        displayName: null,
        displayNameSafetyPassed: false,
        avatarFileId: null,
      },
      true,
      { issue: () => null },
      { allowedSignedUrlOrigins: [], maxAgeSeconds: 300 },
      Date.parse("2026-09-12T00:20:00.000Z"),
    );
    const candidateResult = buildPublicCandidate({
      candidateId: "candidate-public-safe",
      boardInstanceId: "instance-new",
      currentVerifiedBoardVersion: verified.value.verifiedBoardVersion,
      verifiedBoard: verified.value,
      opportunityEvaluation: opportunity.value,
      boardShortLabel: "端到端测试 IP",
      freshnessPolicyVersion: "freshness-v1",
      publicLocation: {
        coordinateSystem: "GCJ02",
        latitude: 31.23,
        longitude: 121.47,
        precisionMode: "APPROXIMATE",
        areaLabel: "上海",
        locationPolicyVersion: "location-v1",
        projectionRuleId: "rule-a",
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
      },
    });
    expect(candidateResult.ok).toBe(true);
    if (!candidateResult.ok) return;
    const candidate = candidateResult.value;
    expect(dryRunPublicMapMigration([candidate])).toMatchObject({
      mode: "DRY_RUN_ONLY",
      eligibleCount: 1,
      mutationCount: 0,
      containsPrivateRows: false,
    });

    const projected = reconcilePublicMapLead(
      emptyProjectorState(),
      {
        boardInstanceId: "instance-new",
        eventSequence: 1,
        reconciledAt: "2026-09-12T00:30:00.000Z",
        eligibleCandidates: [candidate],
        projectionVersion: "projection-v1",
        policyVersion: "public-policy-v1",
      },
      () => "opaque-public-lead-0001",
    );
    expect(projected.effect).toBe("CREATED");
    const projectedLead = projected.state.leads["opaque-public-lead-0001"]!;
    const repository = new InMemoryPublicLeadRepository([projectedLead]);
    const api = new PublicMapService(
      repository,
      new InMemoryQuerySnapshotStore(),
      {
        policyVersion: "freshness-v1",
        recentMaxAgeMs: 3_600_000,
        agingMaxAgeMs: 86_400_000,
      },
      {
        account: { currentAccount: () => ({ accountId: "reader-a" }) },
        rateLimit: new InMemorySharedRateLimitStore(),
        readControl: { readState: () => "ENABLED" },
        cursorSecret: {
          currentSecret: () => "integration-secret-32-bytes-minimum",
        },
      },
      undefined,
      () => Date.parse("2026-09-12T01:00:00.000Z"),
      () => "snapshot-integration",
    );
    const publicResult = api.query({
      bbox: { west: 121.2, south: 31.2, east: 121.5, north: 31.3 },
      zoom: 13,
      mode: "MAP",
      opportunityStatuses: [],
      includeLowFreshness: true,
      limit: 50,
      cursor: null,
      asOf: null,
      requestId: "integration-query",
      generation: 1,
      supportedSchemaVersions: [PUBLIC_MAP_SCHEMA_VERSION],
    });
    expect(publicResult.ok && publicResult.items).toHaveLength(1);
    expect(JSON.stringify(publicResult)).not.toContain("private-record");
    expect(JSON.stringify(publicResult)).not.toContain("owner-a");

    let moderation = initialModerationState("opaque-public-lead-0001");
    for (let index = 1; index <= 10; index += 1) {
      const reported = submitModerationReport(
        moderation,
        {
          reportId: `report-${index}`,
          publicLeadId: "opaque-public-lead-0001",
          reporterAccountId: `reporter-${index}`,
          submittedAt: `2026-09-12T01:${String(index).padStart(2, "0")}:00.000Z`,
          eligible: true,
          spamOrInvalid: false,
        },
        {
          policyVersion: "moderation-v1",
          autoHideDistinctEligibleReports: 10,
        },
      );
      expect(reported.ok).toBe(true);
      if (reported.ok) moderation = reported.value;
    }
    expect(moderation.visibility).toBe("HIDDEN");
    repository.hide("opaque-public-lead-0001");
    expect(
      api.detail({
        publicLeadId: "opaque-public-lead-0001",
        requestId: "integration-detail",
        generation: 2,
        supportedSchemaVersions: [PUBLIC_MAP_SCHEMA_VERSION],
      }),
    ).toMatchObject({ ok: false, code: "LEAD_UNAVAILABLE" });
  });

  it("dry-run fails closed without leaking rejected private rows", () => {
    const blocked = {
      candidateId: "candidate-blocked",
      boardInstanceId: "instance-blocked",
      observationVersionId: "private-observation",
      sourceType: "PLAYER_DIRECT",
      recordType: "UPLOAD_RECORD",
      boardFacts: {
        ipName: board.ipName,
        themeName: board.themeName,
        pricePerDrawMinor: board.pricePerDrawMinor,
        tiers: board.tiers.map((tier) => ({
          tierCode: tier.tierCode,
          displayLabel: tier.rawLabel,
          remainingTickets: tier.remainingTickets,
          isGrandPrize: tier.isGrandPrize,
        })),
      },
      boardShortLabel: "blocked",
      observedAt: "2026-09-12T00:00:00.000Z",
      opportunity: {
        primaryStatus: null,
        reasonCodes: ["INSUFFICIENT_FACTS"],
        policyVersion: "opportunity-v1",
        evaluatedAt: "2026-09-12T00:00:00.000Z",
      },
      freshnessPolicyVersion: "freshness-v1",
      publicLocation: null,
      venueNote: null,
      contributor: null,
      gates: {
        verified: false,
        opportunityPass: false,
        sourceCurrent: true,
        authorizationApplicable: false,
        rightsEligible: false,
        publicEligible: false,
        moderationVisible: true,
        deleted: false,
      },
    } as unknown as PublicCandidate;
    const report = dryRunPublicMapMigration([blocked]);
    expect(report).toMatchObject({
      eligibleCount: 0,
      rejectedCount: 1,
      containsPrivateRows: false,
      mutationCount: 0,
    });
    expect(JSON.stringify(report)).not.toContain("private-observation");
  });
});
