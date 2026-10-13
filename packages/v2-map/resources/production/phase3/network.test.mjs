import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { setup as playerSetup, NOW } from "../phase2/fixtures.test-support.mjs";
import { createMain } from "../shared/runtime.mjs";
import { correctFounderNetworkSource } from "./correction.mjs";
import { hash } from "../shared/security.mjs";
import { verifiedObservation } from "../shared/domain.mjs";
import {
  admitOfficialNetworkSource,
  reconcileNetworkLifecycle,
  reconcileDueNetworkSources,
} from "./admission.mjs";
import {
  NETWORK_SOURCE_SCHEMA,
  NETWORK_POLICY_VERSION,
  NETWORK_PUBLIC_MAX_AGE_MS,
  networkSourceId,
  networkContentDigest,
  networkTime,
  networkLocationDigest,
  NETWORK_VENUE_LOCATION_VERSION,
  NETWORK_VENUE_LOCATION_RULE,
  NETWORK_COLLECTION50_LOCATION_VERSION,
  NETWORK_COLLECTION50_LOCATION_RULE,
  NETWORK_REVIEW_DELEGATION_VERSION,
  NETWORK_WORKFLOW_DELEGATION_VERSION,
  NETWORK_WORKFLOW_LOCATION_VERSION,
  NETWORK_WORKFLOW_LOCATION_RULE,
  networkPolicyValid,
  networkRecordValid,
  networkVenuePublicLocation,
} from "./network.mjs";
const proposal = JSON.parse(
  fs.readFileSync(
    new URL("../cloudbase-production-resource-proposal.json", import.meta.url),
  ),
);
const iso = (n) => new Date(n).toISOString();
const setup = () => {
  const s = playerSetup();
  s.policy.network = {
    policyVersion: NETWORK_POLICY_VERSION,
    servingSchemaVersion: "public-map-v4",
    publicMaxAgeMs: NETWORK_PUBLIC_MAX_AGE_MS,
    curatorAuthorityIds: ["ichi-official-curator"],
  };
  let time = NOW,
    seq = 100;
  const newId = () => (++seq).toString(16).padStart(32, "0");
  const record = (suffix = "abc1", age = 60_000) => {
    const sourceUrl = `https://www.xiaohongshu.com/explore/${suffix}`;
    return {
      schemaVersion: NETWORK_SOURCE_SCHEMA,
      sourceId: networkSourceId(sourceUrl),
      sourceVersion: "source-v1",
      sourceType: "NETWORK_SOURCE",
      sourceMode: "OFFICIAL_CURATED",
      sourcePlatform: "XHS",
      sourceUrl,
      sourcePublishedAt: iso(NOW - age),
      fetchedAt: iso(NOW - 1000),
      observedAtBasis: "SOURCE_PUBLISHED_AT_FALLBACK",
      observationEvidence: null,
      takedownOwnerId: "ichi-takedown",
      boardFacts: {
        schemaVersion: "player-board-facts-phase2-v1",
        ipName: "IP",
        themeName: "主题",
        pricePerDrawMinor: 800,
        tiers: [
          {
            tierCode: "A",
            rawLabel: "A赏",
            initialRemainingTickets: null,
            remainingTickets: 9,
            isGrandPrize: true,
          },
        ],
      },
      location: {
        coordinateSystem: "GCJ02",
        latitude: 31.230456,
        longitude: 121.470456,
        accuracyMeters: 10,
        capturedAt: iso(NOW - age),
      },
      note: {
        text: "核验备注",
        safetyProvenance: {
          decision: "NOTE_PASSED",
          contentHash: hash("核验备注"),
          decisionVersion: "note-test-v1",
        },
      },
    };
  };
  const decision = (r) => ({
    noteSafety: structuredClone(r.note.safetyProvenance),
    approval: {
      sourceId: r.sourceId,
      sourceVersion: r.sourceVersion,
      reviewedBy: "FOUNDER",
      reviewDecision: "APPROVE",
      reviewVersion: "review-v1",
      reviewedAt: iso(NOW),
      curatorAuthorityId: "ichi-official-curator",
      contentDigest: networkContentDigest(r),
      highPrizeTiersConfirmed: true,
    },
    rights: {
      sourceId: r.sourceId,
      sourceVersion: r.sourceVersion,
      decision: "PASS",
      basis: "OWNER_PERMISSION",
      evidenceRef: "private-rights-evidence",
      decisionVersion: "rights-v1",
      decidedAt: iso(NOW),
      contentDigest: networkContentDigest(r),
      takedownOwnerId: r.takedownOwnerId,
    },
  });
  const ingest = (
    r,
    d = decision(r),
    decisions = { read: async () => structuredClone(d) },
  ) =>
    admitOfficialNetworkSource({
      db: s.db,
      record: r,
      decisions,
      locationPolicy: s.bridge.locationPolicy,
      nowMs: time,
      newId,
    });
  const main = (operation) =>
    createMain({
      cloud: s.cloud,
      env: s.env,
      operation,
      collectionAllowlist: proposal.functions.find(
        (f) => f.operation === operation,
      ).collectionAllowlist,
      now: () => time,
      newId,
    });
  const query = (extra = {}) =>
    main("query")({
      bbox: { west: 121.38, south: 31.14, east: 121.58, north: 31.3 },
      zoom: 12,
      mode: "MAP",
      opportunityStatuses: [],
      includeLowFreshness: true,
      limit: 50,
      cursor: null,
      asOf: null,
      requestId: "network-query",
      generation: 1,
      supportedSchemaVersions: ["public-map-v3", "public-map-v4"],
      ...extra,
    });
  const detail = (id, versions = ["public-map-v3", "public-map-v4"]) =>
    main("detail")({
      publicLeadId: id,
      requestId: "network-detail",
      generation: 1,
      supportedSchemaVersions: versions,
    });
  const lifecycle = (id, takedownSourceId = null) =>
    reconcileNetworkLifecycle({
      db: s.db,
      boardInstanceId: id,
      nowMs: time,
      newId,
      takedownSourceId,
    });
  return {
    ...s,
    record,
    decision,
    ingest,
    query,
    detail,
    lifecycle,
    newId,
    setTime: (v) => {
      time = v;
      s.setTime(v);
    },
  };
};

const venueRecord = (s, scope = "STORE") => {
  const r = s.record();
  r.location.accuracyMeters = null;
  r.location.venueReference = {
    kind: "PUBLIC_VENUE_REFERENCE",
    sourceUrl: r.sourceUrl,
    venueName: "测试商场",
    scope,
    poiId: "B0K297UHRG",
    providerUrl: `https://www.amap.com/?p=B0K297UHRG,${r.location.latitude},${r.location.longitude},测试商场,公开地址`,
    evidenceRef: "private-batch10-public-poi-evidence",
  };
  s.policy.network.venueApproximation = {
    version: NETWORK_VENUE_LOCATION_VERSION,
    ruleId: NETWORK_VENUE_LOCATION_RULE,
    approvedSources: [
      {
        sourceId: r.sourceId,
        sourceVersion: r.sourceVersion,
        locationDigest: networkLocationDigest(r.location),
      },
    ],
  };
  return r;
};

describe("trusted Founder correction of an admitted NETWORK source", () => {
  const run = async (change = () => {}) => {
    const s = setup(),
      r = venueRecord(s),
      admitted = await s.ingest(r);
    s.table("mapControlState").set("global:network", {
      kind: "NETWORK_CONTROL",
      curatorAuthorityId: "ichi-official-curator",
      admissionEnabled: false,
      maintenanceEnabled: false,
    });
    const corrected = structuredClone(r);
    corrected.sourceVersion = "source-fact-correction-v2";
    corrected.boardFacts.tiers[0].remainingTickets = 8;
    const expected = {
      sourceVersion: r.sourceVersion,
      contentDigest: networkContentDigest(r),
      ...admitted,
    };
    const input = {
      db: s.db,
      record: corrected,
      decision: s.decision(corrected),
      authorityId: "ichi-official-curator",
      expected,
      evidenceRef: "user-correction",
      nowMs: NOW,
    };
    change(input, s);
    return {
      s,
      r,
      admitted,
      input,
      result: await correctFounderNetworkSource(input),
    };
  };
  it("advances the same public ID, keeps history and clocks, closes no gates and retries without writes", async () => {
    const { s, r, admitted, input, result } = await run();
    expect(result).toMatchObject({
      ok: true,
      publicLeadId: admitted.publicLeadId,
      boardInstanceId: admitted.boardInstanceId,
      servedVersion: 2,
    });
    expect((await s.detail(admitted.publicLeadId)).item).toMatchObject({
      board: { totalRemaining: 8 },
      freshness: { observedAt: r.sourcePublishedAt },
      publicUntil: networkTime(r).publicUntil,
    });
    expect(
      s
        .table("boardObservations")
        .has(`observation:${admitted.observationVersionId}`),
    ).toBe(true);
    expect(
      s.table("mapControlState").get("global:network").admissionEnabled,
    ).toBe(false);
    expect(await correctFounderNetworkSource(input)).toMatchObject({
      ok: true,
      duplicate: true,
    });
    expect((await s.detail(admitted.publicLeadId)).item.servedVersion).toBe(2);
  });
  it("rolls back a correction write failure including the source head and bounded policy", async () => {
    let state;
    await expect(
      run((_input, s) => {
        state = s;
        s.injectCrashAfter(4);
      }),
    ).rejects.toThrow("injected crash");
    state.clearCrash();
    const head = [...state.table("publicMapLeads").values()].find(
      (r) => r.kind === "HEAD",
    );
    expect(head.servedVersion).toBe(1);
    expect(
      state.policy.network.venueApproximation.approvedSources[0].sourceVersion,
    ).toBe("source-v1");
    expect(
      [...state.table("boardObservations").values()].find(
        (r) => r.kind === "NETWORK_SOURCE_RECORD",
      ).sourceVersion,
    ).toBe("source-v1");
  });
  it("rejects a concurrent control revision at commit without applying the staged correction", async () => {
    const { s, admitted, result } = await run((_input, state) => {
      const transact = state.db.runTransaction;
      state.db.runTransaction = async (work) => {
        state
          .table("mapControlState")
          .get("global:read-epoch").mutationRevision += 1;
        return transact(work);
      };
    });
    expect(result).toMatchObject({
      ok: false,
      code: "CORRECTION_SNAPSHOT_CHANGED",
    });
    expect((await s.detail(admitted.publicLeadId)).item.servedVersion).toBe(1);
  });
  it.each([
    [
      "wrong curator",
      (i) => {
        i.authorityId = "other";
      },
    ],
    [
      "changed clock",
      (i) => {
        i.record.sourcePublishedAt = iso(NOW - 10000);
      },
    ],
    [
      "changed location",
      (i) => {
        i.record.location.latitude += 0.001;
      },
    ],
    [
      "unbound approval",
      (i) => {
        i.decision.approval.contentDigest = "wrong";
      },
    ],
    [
      "missing rights",
      (i) => {
        i.decision.rights = null;
      },
    ],
    [
      "unsafe note",
      (i) => {
        i.record.note.text = "changed";
        i.decision = i.decision && {
          ...i.decision,
          approval: {
            ...i.decision.approval,
            contentDigest: networkContentDigest(i.record),
          },
          rights: {
            ...i.decision.rights,
            contentDigest: networkContentDigest(i.record),
          },
          noteSafety: null,
        };
      },
    ],
    [
      "withdrawn source",
      (i, s) => {
        const k = `network-source:${i.record.sourceId}`;
        s.table("boardObservations").get(k).noResurrection = true;
      },
    ],
  ])(
    "rejects %s without changing the original public row",
    async (_label, change) => {
      const { s, admitted, result } = await run(change);
      expect(result.ok).toBe(false);
      expect((await s.detail(admitted.publicLeadId)).item.servedVersion).toBe(
        1,
      );
      expect(
        (await s.detail(admitted.publicLeadId)).item.board.totalRemaining,
      ).toBe(9);
    },
  );
});

describe("independent automatic workflow admission", () => {
  const automatic = () => {
    const s = setup(),
      r = venueRecord(s),
      d = s.decision(r);
    s.policy.network.workflowVenueApproximation = {
      ...s.policy.network.venueApproximation,
      version: NETWORK_WORKFLOW_LOCATION_VERSION,
      ruleId: NETWORK_WORKFLOW_LOCATION_RULE,
    };
    delete s.policy.network.venueApproximation;
    s.policy.network.workflowReviewDelegation = {
      version: NETWORK_WORKFLOW_DELEGATION_VERSION,
      authorizationRef: "new-workflow-user-direction",
      authorizedAt: iso(NOW - 5000),
      approvedSources: [
        {
          sourceId: r.sourceId,
          sourceVersion: r.sourceVersion,
          contentDigest: networkContentDigest(r),
        },
      ],
    };
    d.approval.reviewedBy = "AGENT_USER_DELEGATION";
    d.approval.authorizationRef = "new-workflow-user-direction";
    return { s, r, d };
  };
  it("admits an exact automatic source without pretending the reviewer was Founder", async () => {
    const { s, r, d } = automatic();
    const admitted = await s.ingest(r, d);
    expect(admitted.ok).toBe(true);
    expect((await s.detail(admitted.publicLeadId)).ok).toBe(true);
    expect(
      s
        .table("boardObservations")
        .get(`observation:${admitted.observationVersionId}`).source.approval
        .reviewedBy,
    ).toBe("AGENT_USER_DELEGATION");
  });
  it.each(["authorizationRef", "contentDigest", "sourceVersion"])(
    "rejects a workflow whose %s is outside the exact registration",
    async (key) => {
      const { s, r, d } = automatic();
      if (key === "authorizationRef")
        d.approval.authorizationRef = "old-50-grant";
      else
        s.policy.network.workflowReviewDelegation.approvedSources[0][key] =
          key === "contentDigest" ? "f".repeat(64) : "other-version";
      expect((await s.ingest(r, d)).ok).toBe(false);
      expect(s.table("publicMapLeads").size).toBe(0);
    },
  );
  it("rejects overlapping location registries and a registry above its bound", () => {
    const { s } = automatic();
    s.policy.network.venueApproximation = {
      ...s.policy.network.workflowVenueApproximation,
      version: NETWORK_VENUE_LOCATION_VERSION,
      ruleId: NETWORK_VENUE_LOCATION_RULE,
    };
    expect(networkPolicyValid(s.policy.network)).toBe(false);
    delete s.policy.network.venueApproximation;
    const entry = s.policy.network.workflowReviewDelegation.approvedSources[0];
    s.policy.network.workflowReviewDelegation.approvedSources = Array.from(
      { length: 1001 },
      (_, n) => ({ ...entry, sourceId: n.toString(16).padStart(64, "0") }),
    );
    expect(networkPolicyValid(s.policy.network)).toBe(false);
  });
});

describe("bounded collection50 delegated review", () => {
  const prepare = (s, r) => {
    const d = s.decision(r);
    s.policy.network.reviewDelegation = {
      version: NETWORK_REVIEW_DELEGATION_VERSION,
      authorizationRef: "user-goal:collection50",
      authorizedAt: iso(NOW - 500),
      approvedSources: [
        {
          sourceId: r.sourceId,
          sourceVersion: r.sourceVersion,
          contentDigest: networkContentDigest(r),
        },
      ],
    };
    d.approval.reviewedBy = "AGENT_USER_DELEGATION";
    d.approval.authorizationRef = "user-goal:collection50";
    return d;
  };
  it("admits exact delegated facts without inventing a Founder review", async () => {
    const s = setup(),
      r = s.record(),
      d = prepare(s, r);
    const a = await s.ingest(r, d);
    expect(a.ok).toBe(true);
    expect((await s.detail(a.publicLeadId)).ok).toBe(true);
    expect(JSON.stringify(await s.detail(a.publicLeadId))).not.toMatch(
      /authorizationRef|AGENT_USER_DELEGATION/u,
    );
  });
  it.each([
    [
      "missing delegation",
      (s) => {
        delete s.policy.network.reviewDelegation;
      },
    ],
    [
      "wrong authorization",
      (_s, _r, d) => {
        d.approval.authorizationRef = "another-goal";
      },
    ],
    [
      "future authorization",
      (s) => {
        s.policy.network.reviewDelegation.authorizedAt = iso(NOW + 1);
      },
    ],
    [
      "review before authorization",
      (_s, _r, d) => {
        d.approval.reviewedAt = iso(NOW - 1000);
      },
    ],
    [
      "another version",
      (s) => {
        s.policy.network.reviewDelegation.approvedSources[0].sourceVersion =
          "other";
      },
    ],
    [
      "modified facts",
      (_s, r, d) => {
        r.boardFacts.tiers[0].remainingTickets = 8;
        d.approval.contentDigest = networkContentDigest(r);
        d.rights.contentDigest = networkContentDigest(r);
      },
    ],
    [
      "missing rights",
      (_s, _r, d) => {
        d.rights.decision = "FAIL";
      },
    ],
    [
      "51 sources",
      (s) => {
        const p = s.policy.network.reviewDelegation;
        p.approvedSources = Array.from({ length: 51 }, (_, i) => ({
          ...p.approvedSources[0],
          sourceId: i.toString(16).padStart(64, "0"),
        }));
      },
    ],
  ])("rejects %s without public writes", async (_label, mutate) => {
    const s = setup(),
      r = s.record(),
      d = prepare(s, r);
    mutate(s, r, d);
    expect((await s.ingest(r, d)).ok).toBe(false);
    expect(s.table("publicMapLeads").size).toBe(0);
  });
  it("keeps the old venue projection while adding a distinct new rule", async () => {
    const s = setup(),
      r = venueRecord(s),
      old = networkVenuePublicLocation(r, s.policy.network);
    const a = await s.ingest(r);
    expect(a.ok).toBe(true);
    const next = structuredClone(r);
    next.boardEvidenceKey = "image-2:POKEMON30_VOL2";
    next.sourceId = networkSourceId(next.sourceUrl, next.boardEvidenceKey);
    next.boardFacts.ipName = "另一个IP";
    s.policy.network.collection50VenueApproximation = {
      version: NETWORK_COLLECTION50_LOCATION_VERSION,
      ruleId: NETWORK_COLLECTION50_LOCATION_RULE,
      approvedSources: [
        {
          sourceId: next.sourceId,
          sourceVersion: next.sourceVersion,
          locationDigest: networkLocationDigest(next.location),
        },
      ],
    };
    expect(networkVenuePublicLocation(r, s.policy.network)).toEqual(old);
    expect((await s.detail(a.publicLeadId)).ok).toBe(true);
    const b = await s.ingest(next, prepare(s, next));
    expect(b.ok).toBe(true);
    expect(b.publicLeadId).not.toBe(a.publicLeadId);
    expect(
      networkVenuePublicLocation(next, s.policy.network).projectionRuleId,
    ).toBe(NETWORK_COLLECTION50_LOCATION_RULE);
    expect((await s.detail(a.publicLeadId)).ok).toBe(true);
  });
  it("enforces a combined maximum of 50 and disjoint source registries", () => {
    const s = setup(),
      r = venueRecord(s),
      entry = s.policy.network.venueApproximation.approvedSources[0];
    const p = (s.policy.network.collection50VenueApproximation = {
      version: NETWORK_COLLECTION50_LOCATION_VERSION,
      ruleId: NETWORK_COLLECTION50_LOCATION_RULE,
      approvedSources: Array.from({ length: 49 }, (_, i) => ({
        ...entry,
        sourceId: i.toString(16).padStart(64, "0"),
      })),
    });
    expect(networkPolicyValid(s.policy.network)).toBe(true);
    p.approvedSources.push({ ...entry, sourceId: "f".repeat(64) });
    expect(networkPolicyValid(s.policy.network)).toBe(false);
    p.approvedSources.pop();
    p.approvedSources[0].sourceId = r.sourceId;
    expect(networkPolicyValid(s.policy.network)).toBe(false);
  });
  it("binds each board key while preserving legacy source identity", () => {
    const s = setup(),
      a = s.record(),
      b = structuredClone(a);
    b.boardEvidenceKey = "image-4:NIKKE_CHAPTER7";
    b.sourceId = networkSourceId(b.sourceUrl, b.boardEvidenceKey);
    expect(networkRecordValid(a)).toBe(true);
    expect(networkRecordValid(b)).toBe(true);
    expect(b.sourceId).not.toBe(a.sourceId);
    b.boardEvidenceKey = "image-3:NIKKE_CHAPTER7";
    expect(networkRecordValid(b)).toBe(false);
    b.boardEvidenceKey = "image-0:NIKKE";
    b.sourceId = networkSourceId(b.sourceUrl, b.boardEvidenceKey);
    expect(networkRecordValid(b)).toBe(false);
  });
});

describe("current ten NETWORK venue approximation", () => {
  it.each(["STORE", "MALL"])(
    "admits approved %s evidence without fabricating metric accuracy",
    async (scope) => {
      const s = setup(),
        r = venueRecord(s, scope);
      const a = await s.ingest(r);
      expect(a.ok).toBe(true);
      const d = await s.detail(a.publicLeadId);
      expect(d.ok).toBe(true);
      expect(d.item.publicLocation).toMatchObject({
        precisionMode: scope === "MALL" ? "AREA" : "APPROXIMATE",
        areaLabel: "大致位置 · 位置误差未知 · 测试商场",
        latitude: 31.23,
      });
      expect(
        verifiedObservation(
          s
            .table("boardObservations")
            .get(`observation:${a.observationVersionId}`),
        ),
      ).toBeTruthy();
      expect(JSON.stringify(d)).not.toMatch(
        /accuracyMeters|venueReference|providerUrl|evidenceRef|B0K297UHRG|sourceUrl/u,
      );
      const q = await s.query();
      expect(q.items.some((item) => item.publicLeadId === a.publicLeadId)).toBe(
        true,
      );
      s.setTime(Date.parse(r.sourcePublishedAt) + NETWORK_PUBLIC_MAX_AGE_MS);
      expect((await s.query()).items).toHaveLength(0);
      expect((await s.detail(a.publicLeadId)).ok).toBe(false);
    },
  );
  it.each([
    [
      "no approved policy",
      (s) => {
        delete s.policy.network.venueApproximation;
      },
    ],
    [
      "another source",
      (s) => {
        s.policy.network.venueApproximation.approvedSources[0].sourceId =
          "a".repeat(64);
      },
    ],
    [
      "another version",
      (s) => {
        s.policy.network.venueApproximation.approvedSources[0].sourceVersion =
          "other";
      },
    ],
    [
      "modified point",
      (_s, r) => {
        r.location.latitude += 0.1;
      },
    ],
    [
      "modified scope",
      (_s, r) => {
        r.location.venueReference.scope = "MALL";
      },
    ],
    [
      "unbound post",
      (_s, r) => {
        r.location.venueReference.sourceUrl += "2";
      },
    ],
    [
      "no evidence",
      (_s, r) => {
        r.location.venueReference.evidenceRef = "";
      },
    ],
    [
      "foreign provider",
      (_s, r) => {
        r.location.venueReference.providerUrl = "https://example.com/";
      },
    ],
    [
      "more than ten sources",
      (s) => {
        const p = s.policy.network.venueApproximation;
        p.approvedSources = Array.from({ length: 11 }, (_, i) => ({
          ...p.approvedSources[0],
          sourceId: i.toString(16).padStart(64, "0"),
        }));
      },
    ],
  ])("rejects %s before creating V2 records", async (_label, mutate) => {
    const s = setup(),
      r = venueRecord(s);
    mutate(s, r);
    expect((await s.ingest(r)).ok).toBe(false);
    expect(s.table("publicMapLeads").size).toBe(0);
    expect(
      [...s.table("boardObservations").values()].filter(
        (v) => v.kind === "NETWORK_SOURCE_RECORD",
      ),
    ).toHaveLength(0);
  });
  it("rejects PLAYER unknown metric accuracy even with venue evidence", async () => {
    const s = setup(),
      r = venueRecord(s);
    const a = await s.ingest(r);
    const o = structuredClone(
      s.table("boardObservations").get(`observation:${a.observationVersionId}`),
    );
    o.source.family = "PLAYER";
    expect(verifiedObservation(o)).toBeNull();
  });
});

describe("TASK22 Phase3 official NETWORK admission", () => {
  it("runs Verification/Resolution/Opportunity/Projection without player consent or fake identity", async () => {
    const s = setup(),
      r = s.record();
    s.table("mapContributionConsents").clear();
    const a = await s.ingest(r);
    expect(a).toMatchObject({
      ok: true,
      resolution: "NO_MATCH",
      duplicate: false,
    });
    expect(await s.ingest(r)).toMatchObject({ ok: true, duplicate: true });
    const o = s
        .table("boardObservations")
        .get(`observation:${a.observationVersionId}`),
      v = verifiedObservation(o);
    expect(v.provenance).toMatchObject({
      sourceType: "NETWORK_SOURCE",
      sourceMode: "OFFICIAL_CURATED",
      sourcePlatform: "XHS",
      recordType: null,
    });
    expect(v.provenance).not.toHaveProperty("ownerAccountId");
    expect(o.input).not.toHaveProperty("ownerAccountId");
    const contribution = [...s.table("mapContributions").values()][0];
    expect(contribution).toMatchObject({
      ownerAccountId: null,
      sourceFamily: "NETWORK",
    });
    expect(s.table("accounts").size).toBe(2);
    expect(s.table("profiles").size).toBe(0);
    s.accesses.length = 0;
    const q = await s.query(),
      d = await s.detail(a.publicLeadId);
    expect(q).toMatchObject({ ok: true, schemaVersion: "public-map-v4" });
    expect(d.item).toMatchObject({
      sourceLabel: "网络上传",
      sourceIcon: "OFFICIAL_NETWORK",
      recordType: null,
      contributor: null,
      contributors: [],
      publicUntil: iso(NOW - 60000 + NETWORK_PUBLIC_MAX_AGE_MS),
      freshness: { observedAt: r.sourcePublishedAt },
    });
    expect(d.item.board.totalRemaining).toBe(9);
    expect(d.item.opportunity.primaryStatus).toBe("LAST_CHANCE");
    expect(d.item.publicLocation.latitude).toBe(31.23);
    for (const forbidden of [
      r.sourceUrl,
      "private-rights-evidence",
      "ichi-official-curator",
      "ichi-takedown",
      "contentDigest",
      "reviewVersion",
      "accuracyMeters",
    ])
      expect(JSON.stringify([q, d])).not.toContain(forbidden);
    expect(
      s.accesses.every(
        (a) =>
          ![
            "boardObservations",
            "mapContributionConsents",
            "profiles",
            "observationCandidates",
          ].includes(a.name),
      ),
    ).toBe(true);
    expect(
      await s.query({ supportedSchemaVersions: ["public-map-v3"] }),
    ).toMatchObject({ ok: true, schemaVersion: "public-map-v3", items: [] });
    expect(await s.detail(a.publicLeadId, ["public-map-v3"])).toMatchObject({
      ok: false,
      code: "LEAD_UNAVAILABLE",
    });
  });
  it.each([
    [
      "unapproved",
      (r, d) => {
        d.approval.reviewDecision = "REJECT";
      },
    ],
    [
      "model approval",
      (r, d) => {
        d.approval.reviewedBy = "CODEX";
      },
    ],
    [
      "wrong review version",
      (r, d) => {
        d.approval.sourceVersion = "old";
      },
    ],
    [
      "changed facts",
      (r) => {
        r.boardFacts.tiers[0].remainingTickets = 8;
      },
    ],
    [
      "unconfirmed grand tiers",
      (r, d) => {
        d.approval.highPrizeTiersConfirmed = false;
      },
    ],
    [
      "unknown curator",
      (r, d) => {
        d.approval.curatorAuthorityId = "self";
      },
    ],
    [
      "rights absent",
      (r, d) => {
        d.rights = null;
      },
    ],
    [
      "public visibility is not rights",
      (r, d) => {
        d.rights.basis = "PUBLIC_WEBPAGE";
      },
    ],
    [
      "stale rights",
      (r, d) => {
        d.rights.sourceVersion = "old";
      },
    ],
    [
      "missing evidence",
      (r, d) => {
        d.rights.evidenceRef = "";
      },
    ],
    [
      "wrong takedown owner",
      (r, d) => {
        d.rights.takedownOwnerId = "another";
      },
    ],
    [
      "player identity injection",
      (r) => {
        r.ownerAccountId = "account_a";
      },
    ],
    [
      "future publication",
      (r) => {
        r.sourcePublishedAt = iso(NOW + 1000);
      },
    ],
    [
      "fetch as observedAt",
      (r) => {
        r.observedAtBasis = "FETCHED_AT";
      },
    ],
    [
      "photo later than publication",
      (r) => {
        r.observedAtBasis = "SOURCE_PHOTO_TIMESTAMP";
        r.observationEvidence = { observedAt: iso(NOW), evidenceRef: "proof" };
      },
    ],
    [
      "unknown remaining is not zero",
      (r) => {
        r.boardFacts.tiers[0].remainingTickets = -1;
      },
    ],
    [
      "invalid coordinate",
      (r) => {
        r.location.latitude = 100;
      },
    ],
    [
      "low public accuracy",
      (r) => {
        r.location.accuracyMeters = 101;
      },
    ],
    [
      "self-attested note proof",
      (r, d) => {
        d.noteSafety = null;
      },
    ],
    [
      "unsafe note",
      (r) => {
        r.note.safetyProvenance.contentHash = "false";
      },
    ],
    [
      "noncanonical duplicate URL",
      (r) => {
        r.sourceUrl += "/";
        r.sourceId = networkSourceId(r.sourceUrl);
      },
    ],
    [
      "invalid calendar date",
      (r) => {
        r.sourcePublishedAt = "2026-02-30T00:00:00.000Z";
      },
    ],
    [
      "signed private URL",
      (r) => {
        r.sourceUrl += "?token=secret";
      },
    ],
  ])("rejects %s without any V2 write", async (_label, mutate) => {
    const s = setup(),
      r = s.record(),
      d = s.decision(r);
    mutate(r, d);
    // Rebind the digest so structural negative cases test their own gate.
    if (!["changed facts"].includes(_label)) {
      d.approval.contentDigest = networkContentDigest(r);
      if (d.rights) d.rights.contentDigest = networkContentDigest(r);
    }
    expect((await s.ingest(r, d)).ok).toBe(false);
    for (const name of [
      "boardObservations",
      "boardInstances",
      "mapContributions",
      "publicMapLeads",
      "mapProjectionOutbox",
    ])
      expect(s.table(name).size).toBe(0);
  });
  it("binds a real photo time; fetching/reviewing cannot move the ceiling", async () => {
    const s = setup(),
      r = s.record();
    r.observedAtBasis = "SOURCE_PHOTO_TIMESTAMP";
    r.observationEvidence = {
      observedAt: iso(NOW - 86400_000),
      evidenceRef: "private-photo-time",
    };
    expect(networkTime(r)).toEqual({
      observedAt: iso(NOW - 86400_000),
      publicUntil: iso(NOW + 29 * 86400_000),
    });
    const a = await s.ingest(r);
    expect(a.ok).toBe(true);
    const d = await s.detail(a.publicLeadId);
    expect(d.item.freshness.observedAt).toBe(r.observationEvidence.observedAt);
  });
  it("preserves null counts and zero counts distinctly", async () => {
    for (const value of [null, 0]) {
      const s = setup(),
        r = s.record();
      r.boardFacts.tiers[0].remainingTickets = value;
      const a = await s.ingest(r);
      expect(a.ok).toBe(true);
      const d = await s.detail(a.publicLeadId);
      expect(d.item.board.totalRemaining).toBe(value);
      if (value === null) expect(d.item.opportunity.primaryStatus).toBeNull();
    }
  });
  it("rejects a review change during staging or at final transaction", async () => {
    for (const changedAt of [2, 3]) {
      const s = setup(),
        r = s.record(),
        d = s.decision(r);
      let reads = 0;
      const a = await s.ingest(r, d, {
        read: async () =>
          ++reads >= changedAt
            ? { ...d, approval: { ...d.approval, reviewVersion: "changed" } }
            : d,
      });
      expect(a).toMatchObject({ ok: false, code: "STALE_FOUNDER_REVIEW" });
      expect(s.table("boardObservations").size).toBe(0);
      expect(s.heads()).toEqual([]);
    }
  });
  it("atomically rolls back a crash, retries once, and records only one admission", async () => {
    for (const write of [1, 4, 10]) {
      const s = setup(),
        r = s.record();
      s.injectCrashAfter(write);
      await expect(s.ingest(r)).rejects.toThrow("injected crash");
      for (const name of [
        "boardObservations",
        "boardInstances",
        "boardAssociations",
        "mapContributions",
        "publicMapLeads",
        "mapProjectionOutbox",
        "mapAuditEvents",
      ])
        expect(s.table(name).size).toBe(0);
      s.clearCrash();
      expect((await s.ingest(r)).ok).toBe(true);
      expect((await s.ingest(r)).duplicate).toBe(true);
      expect(
        [...s.table("mapAuditEvents").values()].filter(
          (v) => v.kind === "NETWORK_ADMISSION_RECEIPT",
        ),
      ).toHaveLength(1);
    }
  });
  it("requires current policy at commit and at public read", async () => {
    const s = setup(),
      r = s.record(),
      d = s.decision(r);
    let reads = 0;
    const a = await s.ingest(r, d, {
      read: async () => {
        if (++reads === 3) s.policy.network.policyVersion = "changed";
        return d;
      },
    });
    expect(a).toMatchObject({ ok: false, code: "STALE_NETWORK_ADMISSION" });
    expect(s.table("boardObservations").size).toBe(0);
    const t = setup(),
      b = await t.ingest(t.record());
    t.policy.network.policyVersion = "changed";
    expect((await t.query()).items).toEqual([]);
    expect(await t.detail(b.publicLeadId)).toMatchObject({
      ok: false,
      code: "LEAD_UNAVAILABLE",
    });
  });
  it("rejects relinking an admitted same-time revision without refreshing observation time", async () => {
    const s = setup(),
      r = s.record(),
      a = await s.ingest(r),
      changed = structuredClone(r);
    changed.sourceVersion = "source-v2";
    changed.boardFacts.tiers[0].remainingTickets = 8;
    const b = await s.ingest(changed);
    expect(b).toMatchObject({
      ok: false,
      code: "LINEAGE_RELINK_REQUIRES_CORRECTION",
    });
    expect((await s.detail(a.publicLeadId)).item.freshness.observedAt).toBe(
      r.sourcePublishedAt,
    );
    expect((await s.detail(a.publicLeadId)).item.board.totalRemaining).toBe(9);
    expect(
      s.table("boardObservations").has(`observation:${a.observationVersionId}`),
    ).toBe(true);
  });
  it("cannot change an admitted source version or observation time", async () => {
    const s = setup(),
      r = s.record();
    expect((await s.ingest(r)).ok).toBe(true);
    const changed = structuredClone(r);
    changed.boardFacts.tiers[0].remainingTickets = 8;
    expect(await s.ingest(changed)).toMatchObject({
      ok: false,
      code: "IMMUTABLE_SOURCE_VERSION",
    });
    changed.sourceVersion = "source-v2";
    changed.sourcePublishedAt = iso(NOW - 2000);
    expect(await s.ingest(changed)).toMatchObject({
      ok: false,
      code: "IMMUTABLE_OBSERVATION_TIME",
    });
    expect(
      s.table("boardObservations").get(`network-source:${r.sourceId}`)
        .sourceVersion,
    ).toBe("source-v1");
  });
  it("does not let Founder approval force an ambiguous board association", async () => {
    const s = setup(),
      a = s.record("amb1"),
      b = s.record("amb2", 30000),
      c = s.record("amb3");
    // Two independent physical instances at the same place; neither can be silently chosen.
    expect((await s.ingest(a)).ok).toBe(true);
    const first = [...s.table("boardInstances").values()][0];
    s.table("boardInstances").set("second-instance", {
      ...first,
      boardInstanceId: "second-instance",
    });
    expect(await s.ingest(b)).toMatchObject({ ok: false, code: "AMBIGUOUS" });
    expect(
      s.table("boardObservations").has(`network-source:${b.sourceId}`),
    ).toBe(false);
    c.boardFacts.ipName = "Different IP";
    expect((await s.ingest(c)).resolution).toBe("NO_MATCH");
  });
});

describe("TASK22 Phase3 30-day visibility and independent supports", () => {
  it("enforces before/at/after expiry for query/detail and leaves history intact", async () => {
    const s = setup(),
      r = s.record("expiry", NETWORK_PUBLIC_MAX_AGE_MS - 1000),
      a = await s.ingest(r);
    expect(a.ok).toBe(true);
    s.setTime(NOW + 999);
    expect((await s.query()).items).toHaveLength(1);
    expect((await s.detail(a.publicLeadId)).ok).toBe(true);
    s.setTime(NOW + 1000);
    expect((await s.query()).items).toHaveLength(0);
    expect(await s.detail(a.publicLeadId)).toMatchObject({
      ok: false,
      code: "LEAD_UNAVAILABLE",
    });
    s.setTime(NOW + 1001);
    expect((await s.query()).items).toHaveLength(0);
    expect(
      s.table("boardObservations").get(`observation:${a.observationVersionId}`)
        .input.observedAt,
    ).toBe(r.sourcePublishedAt);
    expect(
      await reconcileDueNetworkSources({
        db: s.db,
        nowMs: NOW + 1001,
        newId: s.newId,
      }),
    ).toMatchObject({ ok: true, processed: 1 });
    expect(
      await reconcileDueNetworkSources({
        db: s.db,
        nowMs: NOW + 1001,
        newId: s.newId,
      }),
    ).toMatchObject({ ok: true, processed: 0 });
    expect(
      s.table("publicMapLeads").get(`head:${a.publicLeadId}`).lifecycleState,
    ).toBe("RETIRED");
  });
  it("cannot be bypassed by an old cursor/asOf or includeLowFreshness", async () => {
    const s = setup(),
      old = s.record("old", NETWORK_PUBLIC_MAX_AGE_MS - 30000),
      young = s.record("young");
    old.boardFacts.ipName = "OLD";
    young.boardFacts.ipName = "YOUNG";
    expect((await s.ingest(old)).ok).toBe(true);
    expect((await s.ingest(young)).ok).toBe(true);
    const q = await s.query({ limit: 1 });
    expect(q.nextCursor).not.toBeNull();
    s.setTime(NOW + 30000);
    const next = await s.query({
      limit: 1,
      cursor: q.nextCursor,
      asOf: q.asOf,
    });
    expect(next).toMatchObject({
      ok: true,
      items: [],
      density: { removedSinceSnapshot: 1 },
    });
    for (const includeLowFreshness of [true, false])
      expect(
        (await s.query({ includeLowFreshness })).items.every(
          (item) => item.boardShortLabel !== "OLD",
        ),
      ).toBe(true);
  });
  it("retains eligible PLAYER support after the latest NETWORK support expires", async () => {
    const s = setup();
    const p = playerSetup();
    p.policy.network = s.policy.network;
    const rid = p.record("1", { observedAge: 32 * 86400_000 });
    p.permission(rid);
    await p.run((await p.enqueue(rid)).eventId);
    const r = s.record("mixed", NETWORK_PUBLIC_MAX_AGE_MS - 1000);
    const a = await admitOfficialNetworkSource({
      db: p.db,
      record: r,
      decisions: { read: async () => s.decision(r) },
      locationPolicy: p.bridge.locationPolicy,
      nowMs: NOW,
      newId: s.newId,
    });
    expect(a).toMatchObject({ ok: true, resolution: "UNIQUE_MATCH" });
    const prior = p.heads().find((h) => h.lifecycleState === "PUBLIC");
    expect(prior.sourceLabel).toBe("网络上传");
    expect(
      await reconcileDueNetworkSources({
        db: p.db,
        nowMs: NOW + 1000,
        newId: s.newId,
      }),
    ).toMatchObject({ ok: true, processed: 1 });
    const after = p.heads().find((h) => h.lifecycleState === "PUBLIC");
    expect(after.publicLeadId).toBe(prior.publicLeadId);
    expect(after.sourceLabel).toBeNull();
    expect(after.contributors).toHaveLength(1);
    expect(after.publicUntil).toBeNull();
  });
  it("new independently reviewed observation after all supports expire starts a new public ID", async () => {
    const s = setup(),
      r = s.record("ended", NETWORK_PUBLIC_MAX_AGE_MS - 1000),
      a = await s.ingest(r);
    s.setTime(NOW + 1000);
    const fresh = s.record("newarticle");
    fresh.fetchedAt = iso(NOW);
    const d = s.decision(fresh);
    d.approval.reviewedAt = iso(NOW + 1000);
    const b = await s.ingest(fresh, d);
    expect(b.ok).toBe(true);
    expect(b.publicLeadId).not.toBe(a.publicLeadId);
    expect(
      s.table("publicMapLeads").get(`head:${a.publicLeadId}`).lifecycleState,
    ).toBe("RETIRED");
    expect(await s.detail(a.publicLeadId)).toMatchObject({
      ok: false,
      code: "LEAD_UNAVAILABLE",
    });
  });
  it("takedown is audited, retains provenance, and cannot be replayed to revive a source", async () => {
    const s = setup(),
      r = s.record(),
      a = await s.ingest(r);
    expect((await s.lifecycle(a.boardInstanceId, r.sourceId)).ok).toBe(true);
    expect(await s.detail(a.publicLeadId)).toMatchObject({
      ok: false,
      code: "LEAD_UNAVAILABLE",
    });
    expect(await s.ingest(r)).toMatchObject({
      ok: false,
      code: "NETWORK_TAKEN_DOWN",
    });
    expect(
      s.table("boardObservations").has(`observation:${a.observationVersionId}`),
    ).toBe(true);
    expect(
      s.table("boardObservations").get(`network-source:${r.sourceId}`)
        .noResurrection,
    ).toBe(true);
    expect(
      [...s.table("mapAuditEvents").values()].filter(
        (v) => v.kind === "NETWORK_TAKEDOWN_RECEIPT",
      ),
    ).toHaveLength(1);
    expect(await s.lifecycle(a.boardInstanceId, r.sourceId)).toMatchObject({
      ok: true,
      duplicate: true,
    });
  });
});
