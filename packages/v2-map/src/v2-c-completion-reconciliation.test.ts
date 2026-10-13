import { describe, expect, it } from "vitest";

import {
  D09_PILOT_DEFAULTS,
  InMemoryPublicLeadRepository,
  InMemoryQuerySnapshotStore,
  InMemorySharedRateLimitStore,
  PUBLIC_MAP_SCHEMA_VERSION,
  PublicMapService,
  TrustedModerationService,
  buildPublicCandidate,
  emptyProjectorState,
  initialModerationState,
  projectPublicContributor,
  reconcilePublicMapLead,
  recordOpportunityEvaluation,
  resolveBoardInstance,
  verifyBoard,
  type ClientReportRequest,
  type PublicCandidate,
  type PublicMapLeadCore,
  type PublicMapTrustedPorts,
  type RateLimitStore,
} from "./index.js";
import {
  testPublicCandidate,
  testVerificationInput,
  testVerifiedBoard,
} from "./test-support.js";

describe("V2-C reconciliation VerifiedBoard and Opportunity hard gates", () => {
  it("no VerifiedBoard -> reject", () => {
    expect(
      buildPublicCandidate({
        candidateId: "candidate-none",
        boardInstanceId: "instance-1",
        currentVerifiedBoardVersion: "verified-v1",
        verifiedBoard: null,
        opportunityEvaluation: null,
        boardShortLabel: "测试",
        freshnessPolicyVersion: "freshness-v1",
        publicLocation: null,
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
      }),
    ).toEqual({ ok: false, code: "VERIFIED_BOARD_REQUIRED" });
  });

  it("stale VerifiedBoard version -> reject", () => {
    const verified = testVerifiedBoard("observation-stale", {
      verifiedBoardVersion: "verified-v1",
    });
    const evaluated = recordOpportunityEvaluation(verified, {
      evaluationId: "evaluation-stale",
      evaluationVersion: "evaluation-v1",
      verifiedBoardId: verified.verifiedBoardId,
      verifiedBoardVersion: verified.verifiedBoardVersion,
      primaryStatus: "GRAND_PRIZE_REMAINS",
      reasonCodes: ["GRAND_PRIZE_REMAINS"],
      policyVersion: "opportunity-v1",
      evaluatedAt: "2026-09-12T02:00:00.000Z",
      publicGateDecision: "PASS",
    });
    expect(evaluated.ok).toBe(true);
    if (!evaluated.ok) return;
    expect(
      buildPublicCandidate({
        candidateId: "candidate-stale",
        boardInstanceId: "instance-1",
        currentVerifiedBoardVersion: "verified-v2",
        verifiedBoard: verified,
        opportunityEvaluation: evaluated.value,
        boardShortLabel: "测试",
        freshnessPolicyVersion: "freshness-v1",
        publicLocation: null,
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
      }),
    ).toEqual({ ok: false, code: "VERIFIED_BOARD_VERSION_STALE" });
  });

  it("wrong VerifiedBoard version -> reject", () => {
    const input = testVerificationInput("observation-v2");
    expect(
      verifyBoard(input, {
        expectedObservationVersionId: "observation-v1",
        currentObservationVersionId: "observation-v2",
        verifiedBoardId: "verified-1",
        verifiedBoardVersion: "verified-v1",
        verificationId: "verification-1",
        policyVersion: "verification-v1",
        verifiedAt: "2026-09-12T02:00:00.000Z",
      }),
    ).toEqual({ ok: false, code: "OBSERVATION_VERSION_MISMATCH" });
  });

  it("missing OpportunityEvaluation -> reject", () => {
    const verified = testVerifiedBoard("observation-no-evaluation");
    const base = testPublicCandidate("observation-base");
    expect(
      buildPublicCandidate({
        candidateId: "candidate-no-evaluation",
        boardInstanceId: "instance-1",
        currentVerifiedBoardVersion: verified.verifiedBoardVersion,
        verifiedBoard: verified,
        opportunityEvaluation: null,
        boardShortLabel: "测试",
        freshnessPolicyVersion: "freshness-v1",
        publicLocation: base.publicLocation,
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
      }),
    ).toEqual({ ok: false, code: "OPPORTUNITY_EVALUATION_REQUIRED" });
  });

  it("OpportunityEvaluation bound to wrong VerifiedBoard/version -> reject", () => {
    const expected = testVerifiedBoard("observation-expected");
    const other = testVerifiedBoard("observation-other");
    const otherEvaluation = recordOpportunityEvaluation(other, {
      evaluationId: "evaluation-other",
      evaluationVersion: "evaluation-v1",
      verifiedBoardId: other.verifiedBoardId,
      verifiedBoardVersion: other.verifiedBoardVersion,
      primaryStatus: "GRAND_PRIZE_REMAINS",
      reasonCodes: ["GRAND_PRIZE_REMAINS"],
      policyVersion: "opportunity-v1",
      evaluatedAt: "2026-09-12T02:00:00.000Z",
      publicGateDecision: "PASS",
    });
    expect(otherEvaluation.ok).toBe(true);
    if (!otherEvaluation.ok) return;
    expect(
      buildPublicCandidate({
        candidateId: "candidate-wrong-evaluation",
        boardInstanceId: "instance-1",
        currentVerifiedBoardVersion: expected.verifiedBoardVersion,
        verifiedBoard: expected,
        opportunityEvaluation: otherEvaluation.value,
        boardShortLabel: "测试",
        freshnessPolicyVersion: "freshness-v1",
        publicLocation: testPublicCandidate("location-source").publicLocation,
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
      }),
    ).toEqual({ ok: false, code: "OPPORTUNITY_VERIFIED_BOARD_MISMATCH" });
  });

  it("PublicCandidate direct bypass from VerificationInput -> reject", () => {
    const raw = {
      ...testVerificationInput("raw-observation"),
      candidateId: "forged-candidate",
      boardInstanceId: "instance-1",
      gates: {
        verified: true,
        opportunityPass: true,
        sourceCurrent: true,
        authorizationApplicable: true,
        rightsEligible: true,
        publicEligible: true,
        moderationVisible: true,
        deleted: false,
      },
      publicLocation: testPublicCandidate("location").publicLocation,
    } as unknown as PublicCandidate;
    const projected = reconcilePublicMapLead(
      emptyProjectorState(),
      {
        boardInstanceId: "instance-1",
        eventSequence: 1,
        reconciledAt: "2026-09-12T03:00:00.000Z",
        eligibleCandidates: [raw],
        projectionVersion: "projection-v1",
        policyVersion: "public-v1",
      },
      () => "public-lead-forged",
    );
    expect(projected.effect).toBe("NO_PUBLIC_SUPPORT");
  });

  it("BoardInstance resolver cannot consume unverified raw state", () => {
    expect(
      resolveBoardInstance(
        testVerificationInput("raw-resolution") as unknown as ReturnType<
          typeof testVerifiedBoard
        >,
        "verified-v1",
        [],
      ),
    ).toEqual({ kind: "REJECTED_UNVERIFIED", candidateIds: [] });
  });

  it("valid exact-version VerifiedBoard + valid Opportunity gate -> pass", () => {
    const candidate = testPublicCandidate("observation-valid-low", {
      opportunityStatus: "LOW_OPPORTUNITY",
      publicGateDecision: "PASS",
    });
    expect(candidate.opportunity.primaryStatus).toBe("LOW_OPPORTUNITY");
    expect(candidate.gates.opportunityPass).toBe(true);
    expect(
      reconcilePublicMapLead(
        emptyProjectorState(),
        {
          boardInstanceId: "instance-1",
          eventSequence: 1,
          reconciledAt: "2026-09-12T03:00:00.000Z",
          eligibleCandidates: [candidate],
          projectionVersion: "projection-v1",
          policyVersion: "public-v1",
        },
        () => "public-lead-valid",
      ).effect,
    ).toBe("CREATED");
  });
});

describe("V2-C reconciliation private avatar projection", () => {
  const policy = {
    allowedSignedUrlOrigins: ["https://signed.example"],
    maxAgeSeconds: 300,
  } as const;
  const nowMs = Date.parse("2026-09-12T03:00:00.000Z");
  const profile = {
    accountId: "account-a",
    profileVersion: "profile-v1",
    lifecycle: "ACTIVE" as const,
    displayName: "安全玩家",
    displayNameSafetyPassed: true,
    avatarFileId: "cloud://env/profile-avatars/avatar-a.jpg",
  };

  it("valid private avatar reference -> public-safe locator; private fileID never serialized", () => {
    const projected = projectPublicContributor(
      profile,
      true,
      {
        issue: ({ privateAvatarFileId }) => {
          expect(privateAvatarFileId).toBe(profile.avatarFileId);
          return {
            url: "https://signed.example/avatar-a.jpg?token=short-lived",
            expiresAt: "2026-09-12T03:05:00.000Z",
          };
        },
      },
      policy,
      nowMs,
    );
    expect(projected?.avatar).toEqual({
      kind: "PUBLIC_URL",
      url: "https://signed.example/avatar-a.jpg?token=short-lived",
    });
    expect(JSON.stringify(projected)).not.toContain("cloud://");
    expect(JSON.stringify(projected)).not.toContain("avatarFileId");
  });

  it("arbitrary HTTPS input rejected unless produced by trusted projection", () => {
    const projected = projectPublicContributor(
      { ...profile, legacyAvatarUrl: "https://attacker.example/avatar.jpg" },
      true,
      { issue: () => null },
      policy,
      nowMs,
    );
    expect(projected?.avatar.kind).toBe("FALLBACK_ASSET");
  });

  it("invalid avatar reference -> fallback; no custom avatar -> fallback", () => {
    const issuer = { issue: () => null };
    expect(
      projectPublicContributor(
        { ...profile, avatarFileId: "https://attacker.example/avatar.jpg" },
        true,
        issuer,
        policy,
        nowMs,
      )?.avatar.kind,
    ).toBe("FALLBACK_ASSET");
    expect(
      projectPublicContributor(
        { ...profile, avatarFileId: null },
        true,
        issuer,
        policy,
        nowMs,
      )?.avatar.kind,
    ).toBe("FALLBACK_ASSET");
  });

  it("expired projection -> safe fallback", () => {
    const projected = projectPublicContributor(
      profile,
      true,
      {
        issue: () => ({
          url: "https://signed.example/avatar-a.jpg?token=expired",
          expiresAt: "2026-09-12T02:59:59.000Z",
        }),
      },
      policy,
      nowMs,
    );
    expect(projected?.avatar.kind).toBe("FALLBACK_ASSET");
  });

  it("profile/account deletion -> safe fallback/no leak", () => {
    const projected = projectPublicContributor(
      { ...profile, lifecycle: "DELETED" },
      true,
      {
        issue: () => {
          throw new Error("issuer must not be called for deleted profiles");
        },
      },
      policy,
      nowMs,
    );
    expect(projected?.avatar.kind).toBe("FALLBACK_ASSET");
    expect(JSON.stringify(projected)).not.toContain(profile.avatarFileId);
  });
});

describe("V2-C reconciliation trusted moderation authority", () => {
  const moderationPolicy = {
    policyVersion: "moderation-v1",
    autoHideDistinctEligibleReports: 10,
  } as const;
  const clientReport = (action: string): ClientReportRequest => ({
    publicLeadId: "public-lead-1",
    category: "STALE_OR_INCORRECT",
    reason: null,
    clientActionId: action,
    submittedAt: "2026-09-12T03:00:00.000Z",
  });
  const service = new TrustedModerationService(
    {
      resolveReporter: () => ({
        reporterAccountId: "trusted-account-a",
        eligible: true,
        spamOrInvalid: false,
      }),
    },
    {
      resolveModerator: () => ({
        moderatorAccountId: "ordinary-account",
        isAuthorizedModerator: false,
        credibleNotice: false,
      }),
    },
    {
      currentAccountId: () => "trusted-account-a",
      ownerAccountIdFor: () => "owner-account",
    },
  );

  it("spoofed eligibleReporter from request -> ignored", () => {
    const request = {
      ...clientReport("report-1"),
      eligibleReporter: false,
      isSpam: true,
      reporterAccountId: "spoofed-account",
    } as ClientReportRequest;
    const result = service.submitReport(
      initialModerationState("public-lead-1"),
      request,
      moderationPolicy,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.reportsByReporter["trusted-account-a"]).toMatchObject({
      eligible: true,
      spamOrInvalid: false,
    });
    expect(result.value.reportsByReporter["spoofed-account"]).toBeUndefined();
  });

  it("same trusted account multiple reports/devices -> distinct count only 1", () => {
    const first = service.submitReport(
      initialModerationState("public-lead-1"),
      { ...clientReport("device-a"), deviceId: "a" } as ClientReportRequest,
      moderationPolicy,
    );
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = service.submitReport(
      first.value,
      { ...clientReport("device-b"), deviceId: "b" } as ClientReportRequest,
      moderationPolicy,
    );
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(Object.keys(second.value.reportsByReporter)).toEqual([
      "trusted-account-a",
    ]);
  });

  it("spoofed moderator flag rejected; credible notice cannot be self-declared", () => {
    const request = {
      publicLeadId: "public-lead-1",
      noticeId: "notice-1",
      category: "RIGHTS",
      createdAt: "2026-09-12T03:00:00.000Z",
      isAuthorizedModerator: true,
      credibleNotice: true,
    } as const;
    expect(
      service.applyCredibleNotice(
        initialModerationState("public-lead-1"),
        request,
        "moderation-v1",
      ),
    ).toEqual({ ok: false, code: "UNAUTHORIZED_ACTOR" });
  });

  it("spoofed owner identity is ignored in favor of trusted owner authority", () => {
    expect(
      service.withdrawOwner(
        initialModerationState("public-lead-1"),
        {
          publicLeadId: "public-lead-1",
          commandId: "withdraw-1",
          createdAt: "2026-09-12T03:00:00.000Z",
          trustedOwnerAccountId: "owner-account",
        } as {
          publicLeadId: string;
          commandId: string;
          createdAt: string;
        },
        "moderation-v1",
      ),
    ).toEqual({ ok: false, code: "UNAUTHORIZED_ACTOR" });
  });
});

const publicLead = (): PublicMapLeadCore => ({
  publicLeadId: "public-lead-0001",
  servedVersion: 1,
  projectionVersion: "projection-v1",
  policyVersion: "public-v1",
  visibility: "VISIBLE",
  publicLocation: {
    coordinateSystem: "GCJ02",
    latitude: 31.23,
    longitude: 121.47,
    precisionMode: "APPROXIMATE",
    areaLabel: "上海",
    locationPolicyVersion: "location-v1",
    projectionRuleId: "rule-1",
  },
  boardShortLabel: "测试版面",
  board: {
    ipName: "测试 IP",
    themeName: null,
    pricePerDrawMinor: 7900,
    tiers: [
      {
        tierCode: "A",
        displayLabel: "A赏",
        remainingTickets: 1,
        isGrandPrize: true,
      },
    ],
  },
  recordType: "DRAW_RECORD",
  opportunity: {
    primaryStatus: "LOW_OPPORTUNITY",
    reasonCodes: ["LOW_FRESHNESS"],
    policyVersion: "opportunity-v1",
    evaluatedAt: "2026-09-12T02:00:00.000Z",
  },
  observedAt: "2026-09-12T02:00:00.000Z",
  freshnessPolicyVersion: "freshness-v1",
  venueNote: null,
  contributor: null,
  sourceLabel: null,
  disclosures: { nonRealtime: true, nonRecommendation: true },
  retiredAt: null,
});

const queryRequest = () => ({
  bbox: { west: 121.2, south: 31.2, east: 121.5, north: 31.3 },
  zoom: 13,
  mode: "MAP" as const,
  opportunityStatuses: [] as readonly string[],
  includeLowFreshness: true,
  limit: 50,
  cursor: null,
  asOf: null,
  requestId: "request-1",
  generation: 1,
  supportedSchemaVersions: [PUBLIC_MAP_SCHEMA_VERSION],
});

const publicService = (
  ports: PublicMapTrustedPorts,
  rateLimit = D09_PILOT_DEFAULTS.queryRequestsPerMinute,
) =>
  new PublicMapService(
    new InMemoryPublicLeadRepository([publicLead()]),
    new InMemoryQuerySnapshotStore(),
    {
      policyVersion: "freshness-v1",
      recentMaxAgeMs: 3_600_000,
      agingMaxAgeMs: 86_400_000,
    },
    ports,
    { ...D09_PILOT_DEFAULTS, queryRequestsPerMinute: rateLimit },
    () => Date.parse("2026-09-12T03:00:00.000Z"),
    () => "snapshot-reconciliation",
  );

const trustedPorts = (
  rateLimit: RateLimitStore = new InMemorySharedRateLimitStore(),
): PublicMapTrustedPorts => ({
  account: { currentAccount: () => ({ accountId: "trusted-reader" }) },
  rateLimit,
  readControl: { readState: () => "ENABLED" },
  cursorSecret: {
    currentSecret: () => "server-only-secret-at-least-32-characters",
  },
});

describe("V2-C reconciliation trusted public-read controls", () => {
  it("rate store unavailable -> stable unavailable response", () => {
    const unavailable: RateLimitStore = { consume: () => "UNAVAILABLE" };
    expect(
      publicService(trustedPorts(unavailable)).query(queryRequest()),
    ).toMatchObject({ ok: false, code: "SERVICE_UNAVAILABLE" });
  });

  it("account-bound shared rate budget ignores client counter and device identity", () => {
    const shared = new InMemorySharedRateLimitStore();
    const first = publicService(trustedPorts(shared), 1);
    const second = publicService(trustedPorts(shared), 1);
    const forgedFirst = {
      ...queryRequest(),
      account: { accountId: "device-a", trusted: true },
      rateCount: 0,
    };
    const forgedSecond = {
      ...queryRequest(),
      requestId: "request-2",
      account: { accountId: "device-b", trusted: true },
      rateCount: 0,
    };
    expect(first.query(forgedFirst).ok).toBe(true);
    expect(second.query(forgedSecond)).toMatchObject({
      ok: false,
      code: "RATE_LIMITED",
    });
  });

  it("global read stop client override ignored; server disabled is unavailable", () => {
    const ports = {
      ...trustedPorts(),
      readControl: { readState: () => "DISABLED" as const },
    };
    expect(
      publicService(ports).query({
        ...queryRequest(),
        globalReadEnabled: true,
      } as ReturnType<typeof queryRequest>),
    ).toMatchObject({ ok: false, code: "SERVICE_UNAVAILABLE" });
  });

  it("missing server read control -> fail closed/stable unavailable", () => {
    const ports: PublicMapTrustedPorts = {
      account: { currentAccount: () => ({ accountId: "trusted-reader" }) },
      rateLimit: new InMemorySharedRateLimitStore(),
      cursorSecret: {
        currentSecret: () => "server-only-secret-at-least-32-characters",
      },
    };
    expect(publicService(ports).query(queryRequest())).toMatchObject({
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    });
  });

  it("client HMAC secret injection has no effect; missing/short server secret fail closed", () => {
    const missing: PublicMapTrustedPorts = {
      account: { currentAccount: () => ({ accountId: "trusted-reader" }) },
      rateLimit: new InMemorySharedRateLimitStore(),
      readControl: { readState: () => "ENABLED" },
    };
    expect(
      publicService(missing).query({
        ...queryRequest(),
        cursorSecret: "client-secret-that-is-long-enough-but-untrusted",
      } as ReturnType<typeof queryRequest>),
    ).toMatchObject({ ok: false, code: "SERVICE_UNAVAILABLE" });
    expect(
      publicService({
        ...trustedPorts(),
        cursorSecret: { currentSecret: () => "too-short" },
      }).query(queryRequest()),
    ).toMatchObject({ ok: false, code: "SERVICE_UNAVAILABLE" });
  });
});
