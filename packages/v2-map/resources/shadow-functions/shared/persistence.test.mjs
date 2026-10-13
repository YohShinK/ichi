import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { adaptDirectPublication } from "../../../src/source-adapters.js";
import { testBoardFacts } from "../../../src/test-support.js";
import { createMain as resolveMain } from "../v2-shadow-resolve-observation/runtime.mjs";
import { createMain as getMyMain } from "../v2-shadow-get-my-assistance/runtime.mjs";
import { createMain as answerMain } from "../v2-shadow-answer-assistance/runtime.mjs";
import { createMain as submitMain } from "../v2-shadow-submit-candidate-upload/runtime.mjs";
import { shadowDb } from "./mock-db.test-support.mjs";

const now = Date.parse("2026-09-12T03:00:00.000Z");
const rehearsalKey = "r".repeat(48);
const principalKey = "p".repeat(48);
const ownerDigest = createHmac("sha256", principalKey)
  .update("ichi:v2:shadow:principal:v1\0app\0owner-a")
  .digest("hex");
const otherDigest = createHmac("sha256", principalKey)
  .update("ichi:v2:shadow:principal:v1\0app\0owner-b")
  .digest("hex");
const sign = (purpose, audience, nonce, fields) => {
  const payload = Buffer.from(
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
  return `${payload}.${createHmac("sha256", rehearsalKey).update(payload).digest("base64url")}`;
};
const fixture = (id, observedAt, remaining = 1) => {
  const publication = {
    recordId: `synthetic-record-${id}`,
    boardId: `synthetic-board-${id}`,
    ownerAccountId: "synthetic-owner",
    sourcePath: "direct-upload",
    lifecycleState: "CURRENT",
    observedAt,
    location: {
      coordinateSystem: "GCJ02",
      latitude: 31.23,
      longitude: 121.47,
      accuracyMeters: 15,
      capturedAt: observedAt,
    },
    finalSnapshot: testBoardFacts(remaining),
    recognition: {
      jobId: `synthetic-job-${id}`,
      status: "ACCEPTED",
      correctionVersion: 0,
    },
    publishedSubmissionVersion: null,
  };
  const adapted = adaptDirectPublication(publication);
  if (!adapted.ok) throw new Error(adapted.code);
  return {
    fixtureId: id,
    publication,
    observationVersionId: adapted.value.observationVersionId,
    currentObservationVersionId: adapted.value.observationVersionId,
    verifiedBoardVersion: "verified-v1",
    verifiedAt: observedAt,
    ownerSubjectDigest: ownerDigest,
    assistanceExpiresAt: new Date(now + 60_000).toISOString(),
    lifecycleState: "CURRENT",
    dataOrigin: "SYNTHETIC_REHEARSAL",
  };
};
const answerRequest = (main, request, input) =>
  main({
    requestId: request.requestId,
    candidateRecordRef: request.candidateRecordRef,
    submissionVersion: request.observationVersion,
    ...input,
  });
const make = () => {
  const { db, table } = shadowDb();
  let openId = "owner-a";
  const cloud = {
    database: () => db,
    getWXContext: () => ({ APPID: "app", OPENID: openId }),
  };
  const env = {
    ICHI_V2_SHADOW_BOUNDARY: "synthetic_only",
    ICHI_V2_SHADOW_RESOLVE_ENABLED: "true",
    ICHI_V2_SHADOW_CANDIDATE_UPLOAD_ENABLED: "true",
    ICHI_V2_SHADOW_UPLOAD_REF_HMAC_KEY: "u".repeat(48),
    ICHI_V2_SHADOW_HUMAN_ASSISTANCE_ENABLED: "true",
    ICHI_V2_SHADOW_REHEARSAL_HMAC_KEY: rehearsalKey,
    ICHI_V2_SHADOW_PRINCIPAL_HMAC_KEY: principalKey,
    ICHI_V2_SHADOW_TEST_CALLER_DIGESTS: ownerDigest,
    ICHI_V2_SHADOW_HA_COOLDOWN_SECONDS: "10",
    ICHI_V2_SHADOW_HA_BUDGET_WINDOW_SECONDS: "60",
    ICHI_V2_SHADOW_HA_BUDGET_MAX: "2",
    ICHI_V2_SHADOW_HA_POLICY_VERSION: "candidate-test-only",
  };
  table("v2ShadowControlState").set("global:ha-pause", { paused: false });
  let nonce = 0;
  const resolve = resolveMain({ cloud, env, now: () => now });
  const submit = submitMain({ cloud, env, now: () => now });
  const run = async (id) => {
    const uploaded = await submit({
      fixtureId: id,
      idempotencyKey: `upload-${id}-candidate`,
      shareDecision: "SHARE",
    });
    if (!uploaded.ok) return uploaded;
    return resolve({
      fixtureId: id,
      capability: sign(
        "resolve-observation",
        "v2-shadow-resolve-observation",
        `nonce-${String(++nonce).padStart(16, "0")}`,
        { fixtureId: id },
      ),
    });
  };
  return {
    db,
    table,
    cloud,
    env,
    run,
    setCaller: (value) => {
      openId = value;
    },
  };
};

const ambiguous = async (state) => {
  state
    .table("v2ShadowSourceFixtures")
    .set("fixture:one", fixture("one", "2026-09-12T01:00:00Z", 2));
  state
    .table("v2ShadowSourceFixtures")
    .set("fixture:two", fixture("two", "2026-09-12T01:00:00Z", 2));
  state
    .table("v2ShadowSourceFixtures")
    .set("fixture:three", fixture("three", "2026-09-12T02:00:00Z", 1));
  await state.run("one");
  await state.run("two");
  return state.run("three");
};

describe("shadow persistent resolver and Human Assistance", () => {
  it("persists no-match/unique-match, versioned decisions and outbox idempotently", async () => {
    const state = make();
    state
      .table("v2ShadowSourceFixtures")
      .set("fixture:one", fixture("one", "2026-09-12T01:00:00Z", 2));
    state
      .table("v2ShadowSourceFixtures")
      .set("fixture:two", fixture("two", "2026-09-12T02:00:00Z", 1));
    const first = await state.run("one");
    expect(first).toMatchObject({ ok: true, resolution: "NO_MATCH" });
    const second = await state.run("two");
    expect(second).toMatchObject({
      ok: true,
      resolution: "UNIQUE_MATCH",
      boardInstanceId: first.boardInstanceId,
    });
    expect(await state.run("two")).toMatchObject({ ok: true, duplicate: true });
    expect(state.table("v2ShadowAssociationDecisions").size).toBe(2);
    expect(state.table("v2ShadowProjectionOutbox").size).toBe(2);
  });

  it("keeps same-place ambiguity, returns only owner cards, and accepts DIFFERENT once", async () => {
    const state = make();
    expect(await ambiguous(state)).toMatchObject({
      ok: true,
      resolution: "AMBIGUOUS",
      assistanceRequested: true,
    });
    const getMy = getMyMain({
      cloud: state.cloud,
      env: state.env,
      now: () => now,
    });
    const visible = await getMy({
      callerDigest: "forged",
      accountId: "forged",
    });
    expect(visible.data).toHaveLength(1);
    expect(visible.data[0].candidateRecordRef).toMatch(
      /^candidate:[a-f0-9]{40}$/u,
    );
    expect(visible.data[0].observationVersion).toMatch(/^verified-/u);
    expect(JSON.stringify(visible)).not.toMatch(
      /candidateIds|comparisonBoardInstanceId|accuracyMeters|synthetic-record/u,
    );
    const answer = answerMain({
      cloud: state.cloud,
      env: state.env,
      now: () => now,
    });
    const requestId = visible.data[0].requestId;
    const request = state
      .table("v2ShadowHumanAssistanceRequests")
      .get(requestId);
    expect(
      await answerRequest(answer, request, {
        answer: "SAME_BOARD",
        candidateRecordRef: `candidate:${"f".repeat(40)}`,
      }),
    ).toMatchObject({ ok: false, code: "REQUEST_STALE" });
    expect(
      await answerRequest(answer, request, {
        answer: "SAME_BOARD",
        submissionVersion: "forged-version",
      }),
    ).toMatchObject({ ok: false, code: "REQUEST_STALE" });
    expect(
      await answerRequest(answer, request, {
        answer: "DIFFERENT_BOARD",
        callerDigest: "forged",
      }),
    ).toMatchObject({
      ok: true,
      accepted: "DIFFERENT_BOARD",
      duplicate: false,
    });
    expect(
      await answerRequest(answer, request, { answer: "DIFFERENT_BOARD" }),
    ).toMatchObject({ ok: true, duplicate: true });
    expect((await getMy()).data).toHaveLength(0);
    expect(state.table("v2ShadowHumanAssistanceEvidence").size).toBe(1);
    expect(state.table("v2ShadowAssociationDecisions").size).toBe(3);
    expect(await state.run("three")).toMatchObject({
      ok: true,
      resolution: "UNIQUE_MATCH",
    });
    expect(state.table("v2ShadowAssociationDecisions").size).toBe(4);
  });

  it("长期 AMBIGUOUS 保持不确定且 once-per-upload 不重复发问", async () => {
    const state = make();
    expect(await ambiguous(state)).toMatchObject({
      ok: true,
      resolution: "AMBIGUOUS",
      assistanceRequested: true,
    });
    expect(await state.run("three")).toMatchObject({
      ok: true,
      resolution: "AMBIGUOUS",
      assistanceRequested: false,
    });
    expect(state.table("v2ShadowHumanAssistanceRequests").size).toBe(1);
    const version = state
      .table("v2ShadowSourceFixtures")
      .get("fixture:three").observationVersionId;
    expect(
      [...state.table("v2ShadowAssociationDecisions").values()].filter(
        (item) => item.observationVersionId === version,
      ),
    ).toHaveLength(0);
  });

  it.each(["SAME_BOARD", "CANNOT_TELL", "SKIP"])(
    "applies %s without inventing identity truth",
    async (choice) => {
      const state = make();
      await ambiguous(state);
      const request = [
        ...state.table("v2ShadowHumanAssistanceRequests").values(),
      ][0];
      const answer = answerMain({
        cloud: state.cloud,
        env: state.env,
        now: () => now,
      });
      expect(
        await answerRequest(answer, request, { answer: choice }),
      ).toMatchObject({ ok: true, accepted: choice });
      expect(
        await answerRequest(answer, request, { answer: choice }),
      ).toMatchObject({ ok: true, duplicate: true });
      expect(state.table("v2ShadowHumanAssistanceEvidence").size).toBe(
        choice === "SKIP" ? 0 : 1,
      );
      const association = [
        ...state.table("v2ShadowAssociationDecisions").values(),
      ].filter(
        (item) => item.observationVersionId === request.observationVersionId,
      );
      expect(association).toHaveLength(choice === "SAME_BOARD" ? 1 : 0);
      expect(state.table("v2ShadowProjectionOutbox").size).toBe(
        choice === "SAME_BOARD" ? 3 : 2,
      );
    },
  );

  it("denies cross-account request reads/answers and invalidates withdrawn or expired requests", async () => {
    const state = make();
    await ambiguous(state);
    const request = [
      ...state.table("v2ShadowHumanAssistanceRequests").values(),
    ][0];
    const getMy = getMyMain({
      cloud: state.cloud,
      env: state.env,
      now: () => now,
    });
    const answer = answerMain({
      cloud: state.cloud,
      env: state.env,
      now: () => now,
    });
    state.setCaller("owner-b");
    state.env.ICHI_V2_SHADOW_TEST_CALLER_DIGESTS = `${ownerDigest},${otherDigest}`;
    expect((await getMy()).data).toHaveLength(0);
    expect(
      await answerRequest(answer, request, {
        answer: "SKIP",
        callerDigest: ownerDigest,
        accountId: "owner-a",
      }),
    ).toMatchObject({ ok: false, code: "REQUEST_UNAVAILABLE" });
    state.setCaller("owner-a");
    state.table("v2ShadowSourceFixtures").get("fixture:three").lifecycleState =
      "WITHDRAWN";
    expect((await getMy()).data).toHaveLength(0);
    expect(
      await answerRequest(answer, request, { answer: "SKIP" }),
    ).toMatchObject({ ok: false, code: "REQUEST_STALE" });
    state.table("v2ShadowSourceFixtures").get("fixture:three").lifecycleState =
      "CURRENT";
    request.expiresAt = new Date(now - 1).toISOString();
    expect((await getMy()).data).toHaveLength(0);
    expect(
      await answerRequest(answer, request, { answer: "SKIP" }),
    ).toMatchObject({ ok: false, code: "REQUEST_EXPIRED" });
  });

  it("keeps cooldown and budget candidate-only policy fail-closed", async () => {
    const state = make();
    await ambiguous(state);
    const four = fixture("four", "2026-09-12T02:10:00Z", 1);
    state.table("v2ShadowSourceFixtures").set("fixture:four", four);
    expect(await state.run("four")).toMatchObject({
      ok: true,
      resolution: "AMBIGUOUS",
      assistanceRequested: false,
    });
    state.table("v2ShadowControlState").forEach((value) => {
      if (value.kind === "HA_COOLDOWN") value.nextAllowedAtMs = 0;
      if (value.kind === "HA_BUDGET") value.count = 2;
    });
    expect(await state.run("four")).toMatchObject({
      ok: true,
      resolution: "AMBIGUOUS",
      assistanceRequested: false,
    });
    state.env.ICHI_V2_SHADOW_HA_POLICY_VERSION = "";
    expect(await state.run("four")).toMatchObject({
      ok: true,
      resolution: "AMBIGUOUS",
      assistanceRequested: false,
    });
  });

  it("does not let SAME_BOARD override a changed hard identity conflict", async () => {
    const state = make();
    await ambiguous(state);
    const request = [
      ...state.table("v2ShadowHumanAssistanceRequests").values(),
    ][0];
    const comparison = state
      .table("v2ShadowSourceFixtures")
      .get(`fixture:${request.comparisonFixtureId}`);
    comparison.publication.finalSnapshot.ipName = "changed synthetic IP";
    const answer = answerMain({
      cloud: state.cloud,
      env: state.env,
      now: () => now,
    });
    expect(
      await answerRequest(answer, request, { answer: "SAME_BOARD" }),
    ).toMatchObject({ ok: false, code: "HARD_CONFLICT" });
    expect(state.table("v2ShadowHumanAssistanceEvidence").size).toBe(0);
  });
});
