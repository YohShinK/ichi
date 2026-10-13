import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { adaptDirectPublication } from "../../../src/source-adapters.js";
import { testBoardFacts } from "../../../src/test-support.js";
import { createMain as resolveMain } from "../v2-shadow-resolve-observation/runtime.mjs";
import { createMain as projectorMain } from "../v2-shadow-reconcile-projection/runtime.mjs";
import { createMain as submitMain } from "../v2-shadow-submit-candidate-upload/runtime.mjs";
import { hashId } from "./verified-fixture.mjs";
import { shadowDb } from "./mock-db.test-support.mjs";

const now = Date.parse("2026-09-12T03:00:00.000Z");
const key = "r".repeat(48);
const sign = (purpose, audience, nonce, fields) => {
  const body = Buffer.from(
    JSON.stringify({
      version: 1,
      environmentId: "cloud1-d7gxqfwv783a1f131",
      purpose,
      audience,
      nonce,
      issuedAtMs: now - 1000,
      expiresAtMs: now + 60_000,
      ...fields,
    }),
  ).toString("base64url");
  return `${body}.${createHmac("sha256", key).update(body).digest("base64url")}`;
};
const make = (shared = true) => {
  const publication = {
    recordId: "synthetic-record",
    boardId: "synthetic-board",
    ownerAccountId: "synthetic-owner",
    sourcePath: "direct-upload",
    lifecycleState: "CURRENT",
    observedAt: "2026-09-12T02:00:00Z",
    location: {
      coordinateSystem: "GCJ02",
      latitude: 31.23,
      longitude: 121.47,
      accuracyMeters: 18,
      capturedAt: "2026-09-12T02:00:00Z",
    },
    finalSnapshot: testBoardFacts(1),
    recognition: {
      jobId: "synthetic-job",
      status: "ACCEPTED",
      correctionVersion: 0,
    },
    publishedSubmissionVersion: null,
  };
  const adapted = adaptDirectPublication(publication);
  if (!adapted.ok) throw new Error(adapted.code);
  const fixture = {
    fixtureId: "one",
    ownerSubjectDigest: "synthetic-owner-digest",
    publication,
    observationVersionId: adapted.value.observationVersionId,
    currentObservationVersionId: adapted.value.observationVersionId,
    verifiedBoardVersion: "verified-v1",
    verifiedAt: "2026-09-12T02:00:00Z",
    lifecycleState: "CURRENT",
    dataOrigin: "SYNTHETIC_REHEARSAL",
    publicBoardShortLabel: "测试 IP",
    freshnessPolicyVersion: "freshness-v1",
    publicLocation: {
      coordinateSystem: "GCJ02",
      latitude: 31.23,
      longitude: 121.47,
      precisionMode: "APPROXIMATE",
      areaLabel: "上海",
      locationPolicyVersion: "location-v1",
      projectionRuleId: "approximate-a",
    },
    opportunity: {
      evaluationVersion: "v1",
      primaryStatus: "GRAND_PRIZE_REMAINS",
      reasonCodes: ["GRAND_PRIZE_REMAINS"],
      policyVersion: "opportunity-v1",
      evaluatedAt: "2026-09-12T02:01:00Z",
      publicGateDecision: "PASS",
    },
    publicGates: {
      sourceCurrent: true,
      authorizationApplicable: true,
      rightsEligible: true,
      publicEligible: true,
      moderationVisible: true,
      deleted: false,
    },
  };
  const { db, table } = shadowDb();
  table("v2ShadowSourceFixtures").set("fixture:one", fixture);
  const principalKey = "p".repeat(48);
  const ownerDigest = createHmac("sha256", principalKey)
    .update("ichi:v2:shadow:principal:v1\0app\0owner-a")
    .digest("hex");
  fixture.ownerSubjectDigest = ownerDigest;
  table("v2ShadowSourceFixtures").set("fixture:one", fixture);
  table("v2ShadowMapContributionConsent").set(`consent:${ownerDigest}`, {
    kind: "STATE",
    ownerSubjectDigest: ownerDigest,
    accepted: true,
    acceptedTermsVersion: "candidate-map-contribution-v3",
    acceptedScopeDigest: "d".repeat(64),
    acceptedAt: "2026-09-12T03:00:00.000Z",
    dataOrigin: "SYNTHETIC_REHEARSAL",
  });
  const cloud = {
    database: () => db,
    getWXContext: () => ({ APPID: "app", OPENID: "owner-a" }),
  };
  const env = {
    ICHI_V2_SHADOW_BOUNDARY: "synthetic_only",
    ICHI_V2_SHADOW_RESOLVE_ENABLED: "true",
    ICHI_V2_SHADOW_PROJECTOR_ENABLED: "true",
    ICHI_V2_SHADOW_CANDIDATE_UPLOAD_ENABLED: "true",
    ICHI_V2_SHADOW_UPLOAD_REF_HMAC_KEY: "u".repeat(48),
    ICHI_V2_SHADOW_PRINCIPAL_HMAC_KEY: principalKey,
    ICHI_V2_SHADOW_TEST_CALLER_DIGESTS: ownerDigest,
    ICHI_V2_SHADOW_REHEARSAL_HMAC_KEY: key,
    ICHI_V2_SHADOW_CONSENT_ENABLED: "true",
    ICHI_V2_SHADOW_MAP_CONTRIBUTION_TERMS_VERSION:
      "candidate-map-contribution-v3",
    ICHI_V2_SHADOW_MAP_CONTRIBUTION_SCOPE_DIGEST: "d".repeat(64),
  };
  const resolver = resolveMain({ cloud, env, now: () => now });
  const submit = submitMain({ cloud, env, now: () => now });
  const projector = projectorMain({
    cloud,
    env,
    now: () => now,
    newLeadId: () => "f".repeat(32),
  });
  const resolve = async () => {
    const uploaded = await submit({
      fixtureId: "one",
      idempotencyKey: "upload-one-candidate",
      shareDecision: shared ? "SHARE" : "DO_NOT_SHARE",
    });
    if (!uploaded.ok) return uploaded;
    return resolver({
      fixtureId: "one",
      capability: sign(
        "resolve-observation",
        "v2-shadow-resolve-observation",
        "nonce-resolve-00001",
        { fixtureId: "one" },
      ),
    });
  };
  let nonce = 0;
  const project = (outboxId) =>
    projector({
      outboxId,
      capability: sign(
        "reconcile-projection",
        "v2-shadow-reconcile-projection",
        `nonce-project-${String(++nonce).padStart(8, "0")}`,
        { outboxId },
      ),
    });
  return { db, table, fixture, resolve, project };
};

describe("shadow persistent projector", () => {
  it("evaluates verified facts instead of forged fixture opportunity presets", async () => {
    const state = make();
    state.fixture.opportunity = {
      level: "LOW",
      reasonCodes: ["FORGED_PRIVATE_REASON"],
      publicGateDecision: "FAIL",
    };
    const resolved = await state.resolve();
    expect(resolved.ok).toBe(true);
    const outboxId = [...state.table("v2ShadowProjectionOutbox").keys()][0];
    const projected = await state.project(outboxId);
    expect(projected).toMatchObject({ ok: true, effect: "CREATED" });
    const rows = [...state.table("v2ShadowPublicMapLeads").values()].filter(
      (row) => row.lifecycleState === "PUBLIC",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].opportunity).toEqual({
      primaryStatus: "LAST_CHANCE",
      reasonCodes: ["LAST_CHANCE", "GRAND_PRIZE_RATIO"],
      policyVersion: "opportunity-20260930-v1",
      evaluatedAt: new Date(now).toISOString(),
    });
    expect(JSON.stringify(rows[0].opportunity)).not.toMatch(/FORGED|level/);
  });

  it("aggregates A+B into one lead and falls back to A note when B is deleted", async () => {
    const state = make();
    state.fixture.publicSafeNoteApproved = true;
    state.fixture.publicSafeNote = "A safe note";
    const resolved = await state.resolve();
    expect(resolved.ok).toBe(true);
    const firstOutbox = [...state.table("v2ShadowProjectionOutbox").keys()][0];
    expect(await state.project(firstOutbox)).toMatchObject({
      ok: true,
      effect: "CREATED",
    });
    const bFixture = structuredClone(state.fixture);
    bFixture.fixtureId = "two";
    bFixture.publication.recordId = "synthetic-record-two";
    bFixture.publication.boardId = "synthetic-board-two";
    bFixture.publication.observedAt = "2026-09-12T02:30:00Z";
    bFixture.publication.location.capturedAt = "2026-09-12T02:30:00Z";
    bFixture.verifiedAt = "2026-09-12T02:30:00Z";
    bFixture.publicSafeNote = "B newest note";
    bFixture.ownerSubjectDigest = "b".repeat(64);
    state
      .table("v2ShadowMapContributionConsent")
      .set(`consent:${bFixture.ownerSubjectDigest}`, {
        kind: "STATE",
        ownerSubjectDigest: bFixture.ownerSubjectDigest,
        accepted: true,
        acceptedTermsVersion: "candidate-map-contribution-v3",
        acceptedScopeDigest: "d".repeat(64),
        acceptedAt: "2026-09-12T03:00:00.000Z",
        dataOrigin: "SYNTHETIC_REHEARSAL",
      });
    const adapted = adaptDirectPublication(bFixture.publication);
    if (!adapted.ok) throw new Error(adapted.code);
    bFixture.observationVersionId = adapted.value.observationVersionId;
    bFixture.currentObservationVersionId = adapted.value.observationVersionId;
    state.table("v2ShadowSourceFixtures").set("fixture:two", bFixture);
    const ref = `candidate:${"b".repeat(40)}`;
    state.table("v2ShadowCandidateUploads").set(ref, {
      candidateRecordRef: ref,
      ownerSubjectDigest: bFixture.ownerSubjectDigest,
      fixtureId: "two",
      observationVersionId: bFixture.observationVersionId,
      observationVersion: bFixture.verifiedBoardVersion,
      shareDecision: "SHARE",
      validationState: "VERIFIED",
      lifecycle: "ACTIVE",
      dataOrigin: "SYNTHETIC_REHEARSAL",
    });
    const contributionId = hashId("contribution", ref);
    state.table("v2ShadowContributionLedger").set(contributionId, {
      kind: "STATE",
      contributionId,
      candidateRecordRef: ref,
      fixtureId: "two",
      ownerSubjectDigest: bFixture.ownerSubjectDigest,
      boardInstanceId: resolved.boardInstanceId,
      observationVersionId: bFixture.observationVersionId,
      observationVersion: bFixture.verifiedBoardVersion,
      shareDecision: "SHARE",
      eligible: true,
      lifecycle: "ACTIVE",
      observedAt: bFixture.publication.observedAt,
      publicSafeNote: "B newest note",
      contributor: {
        displayName: "B",
        avatar: {
          kind: "FALLBACK_ASSET",
          path: "/assets/v1-29/ichi-avatar.png",
        },
      },
      dataOrigin: "SYNTHETIC_REHEARSAL",
    });
    const decisionId = "decision:b";
    state
      .table("v2ShadowAssociationDecisions")
      .set(decisionId, { boardInstanceId: resolved.boardInstanceId });
    state
      .table("v2ShadowControlState")
      .set(hashId("association-head", bFixture.observationVersionId), {
        decisionId,
      });
    const instance = state
      .table("v2ShadowBoardInstances")
      .get(resolved.boardInstanceId);
    instance.lastEventSequence = 2;
    const secondOutbox = hashId("outbox", `${resolved.boardInstanceId}:2`);
    state.table("v2ShadowProjectionOutbox").set(secondOutbox, {
      boardInstanceId: resolved.boardInstanceId,
      eventSequence: 2,
      observationVersionId: bFixture.observationVersionId,
      fixtureId: "two",
      status: "PENDING",
      nextAttemptAt: new Date(now).toISOString(),
      attempts: 0,
      dataOrigin: "SYNTHETIC_REHEARSAL",
    });
    expect(await state.project(secondOutbox)).toMatchObject({
      ok: true,
      effect: "ADVANCED",
    });
    const leadId = "f".repeat(32);
    expect(
      state.table("v2ShadowPublicMapLeads").get(`lead:${leadId}:2`),
    ).toMatchObject({
      venueNote: "B newest note",
      contributors: [{ displayName: "B" }, { displayName: "ICHI 玩家" }],
      lifecycleState: "PUBLIC",
    });
    state.table("v2ShadowCandidateUploads").get(ref).lifecycle = "DELETED";
    state.table("v2ShadowContributionLedger").get(contributionId).lifecycle =
      "DELETED";
    instance.lastEventSequence = 3;
    const thirdOutbox = hashId("outbox", `${resolved.boardInstanceId}:3`);
    state.table("v2ShadowProjectionOutbox").set(thirdOutbox, {
      ...state.table("v2ShadowProjectionOutbox").get(secondOutbox),
      eventSequence: 3,
      status: "PENDING",
    });
    expect(await state.project(thirdOutbox)).toMatchObject({
      ok: true,
      effect: "ADVANCED",
    });
    expect(
      state.table("v2ShadowPublicMapLeads").get(`lead:${leadId}:3`),
    ).toMatchObject({
      venueNote: "A safe note",
      contributors: [{ displayName: "ICHI 玩家" }],
    });
  });

  it("creates public-safe projection, discards late event, retires and bumps read epoch", async () => {
    const state = make();
    const resolved = await state.resolve();
    expect(resolved).toMatchObject({ ok: true, resolution: "NO_MATCH" });
    const firstOutboxId = [
      ...state.table("v2ShadowProjectionOutbox").keys(),
    ][0];
    expect(await state.project(firstOutboxId)).toMatchObject({
      ok: true,
      effect: "CREATED",
    });
    const leadId = "f".repeat(32);
    const lead = state.table("v2ShadowPublicMapLeads").get(`lead:${leadId}:1`);
    expect(lead).toMatchObject({
      lifecycleState: "PUBLIC",
      visibility: "VISIBLE",
    });
    expect(JSON.stringify(lead)).not.toMatch(
      /synthetic-record|ownerAccountId|accuracyMeters|privateLineageId/u,
    );
    expect(await state.project(firstOutboxId)).toMatchObject({
      ok: true,
      duplicate: true,
    });
    state.fixture.lifecycleState = "WITHDRAWN";
    const instance = state
      .table("v2ShadowBoardInstances")
      .get(resolved.boardInstanceId);
    instance.lastEventSequence = 2;
    const secondOutboxId = "outbox:" + "a".repeat(40);
    state.table("v2ShadowProjectionOutbox").set(secondOutboxId, {
      boardInstanceId: resolved.boardInstanceId,
      eventSequence: 2,
      observationVersionId: state.fixture.observationVersionId,
      fixtureId: "one",
      status: "PENDING",
      nextAttemptAt: new Date(now).toISOString(),
      attempts: 0,
      dataOrigin: "SYNTHETIC_REHEARSAL",
    });
    expect(await state.project(secondOutboxId)).toMatchObject({
      ok: true,
      effect: "RETIRED",
    });
    expect(
      state.table("v2ShadowPublicMapLeads").get(`lead:${leadId}:1`)
        .lifecycleState,
    ).toBe("HIDDEN");
    expect(
      state.table("v2ShadowPublicMapLeads").get(`lead:${leadId}:2`).visibility,
    ).toBe("RETIRED");
    expect(
      state.table("v2ShadowControlState").get("global:read-epoch").epoch,
    ).toBe(1);
    state.fixture.lifecycleState = "CURRENT";
    instance.lastEventSequence = 3;
    const thirdOutboxId = `outbox:${"b".repeat(40)}`;
    state.table("v2ShadowProjectionOutbox").set(thirdOutboxId, {
      boardInstanceId: resolved.boardInstanceId,
      eventSequence: 3,
      observationVersionId: state.fixture.observationVersionId,
      fixtureId: "one",
      status: "PENDING",
      nextAttemptAt: new Date(now).toISOString(),
      attempts: 0,
      dataOrigin: "SYNTHETIC_REHEARSAL",
    });
    expect(await state.project(thirdOutboxId)).toMatchObject({
      ok: false,
      code: "PUBLIC_LEAD_ID_COLLISION",
    });
    expect(state.table("v2ShadowPublicMapLeads").size).toBe(2);
  });

  it("rejects sequence gaps and schedules a bounded retry on transient transaction failure", async () => {
    const state = make();
    const resolved = await state.resolve();
    const outboxId = [...state.table("v2ShadowProjectionOutbox").keys()][0];
    const outbox = state.table("v2ShadowProjectionOutbox").get(outboxId);
    outbox.eventSequence = 3;
    expect(await state.project(outboxId)).toMatchObject({
      ok: false,
      code: "EVENT_GAP",
    });
    expect(state.table("v2ShadowPublicMapLeads").size).toBe(0);
    outbox.eventSequence = 1;
    const original = state.db.runTransaction;
    let calls = 0;
    state.db.runTransaction = async (callback) => {
      calls += 1;
      if (calls === 2) throw new Error("synthetic transient failure");
      return original(callback);
    };
    expect(await state.project(outboxId)).toMatchObject({
      ok: false,
      code: "PROJECTOR_RETRY_SCHEDULED",
    });
    expect(state.table("v2ShadowProjectionOutbox").get(outboxId)).toMatchObject(
      { status: "RETRY", attempts: 1 },
    );
    expect(
      state.table("v2ShadowBoardInstances").get(resolved.boardInstanceId)
        .lastAppliedEventSequence,
    ).toBe(0);
  });

  it("does not publish a fixture without upload-time share decision", async () => {
    const state = make(false);
    await state.resolve();
    const outboxId = [...state.table("v2ShadowProjectionOutbox").keys()][0];
    expect(await state.project(outboxId)).toMatchObject({
      ok: true,
      effect: "NO_PUBLIC_SUPPORT",
    });
    expect(state.table("v2ShadowPublicMapLeads").size).toBe(0);
  });

  it("requires current user-level map contribution consent for public eligibility", async () => {
    const state = make();
    state
      .table("v2ShadowMapContributionConsent")
      .delete(`consent:${state.fixture.ownerSubjectDigest}`);
    const resolved = await state.resolve();
    const outboxId = [...state.table("v2ShadowProjectionOutbox").keys()][0];
    expect(resolved).toMatchObject({ ok: true });
    expect(await state.project(outboxId)).toMatchObject({
      ok: true,
      effect: "NO_PUBLIC_SUPPORT",
    });
    expect(state.table("v2ShadowPublicMapLeads").size).toBe(0);
  });
});
