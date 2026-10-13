import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { hashId } from "../shared/verified-fixture.mjs";
import { shadowDb } from "../shared/mock-db.test-support.mjs";
import { createMain } from "./runtime.mjs";

const key = "shadow-candidate-unit-test-principal-key-only";
const appId = "wx-shadow-test";
const digestFor = (openId) =>
  createHmac("sha256", key)
    .update("ichi:v2:shadow:principal:v1\0")
    .update(appId)
    .update("\0")
    .update(openId)
    .digest("hex");
const a = digestFor("caller-a");
const b = digestFor("caller-b");
const refA = `candidate:${"a".repeat(40)}`;
const refB = `candidate:${"b".repeat(40)}`;
const instanceId = "instance:shared";
const leadId = "c".repeat(32);
const env = {
  ICHI_V2_SHADOW_BOUNDARY: "synthetic_only",
  ICHI_V2_SHADOW_CONTRIBUTION_ENABLED: "true",
  ICHI_V2_SHADOW_PRINCIPAL_HMAC_KEY: key,
  ICHI_V2_SHADOW_TEST_CALLER_DIGESTS: `${a},${b}`,
  ICHI_V2_SHADOW_CONSENT_ENABLED: "true",
  ICHI_V2_SHADOW_MAP_CONTRIBUTION_TERMS_VERSION:
    "candidate-map-contribution-v3",
  ICHI_V2_SHADOW_MAP_CONTRIBUTION_SCOPE_DIGEST: "d".repeat(64),
};
const cloud = (db, openId) => ({
  database: () => db,
  getWXContext: () => ({ APPID: appId, OPENID: openId }),
});
const upload = (ref, owner, fixtureId) => ({
  candidateRecordRef: ref,
  ownerSubjectDigest: owner,
  fixtureId,
  observationVersionId: `observation:${fixtureId}`,
  observationVersion: "verified-v1",
  validationState: "VERIFIED",
  shareDecision: "SHARE",
  boardInstanceId: instanceId,
  lifecycle: "ACTIVE",
  dataOrigin: "SYNTHETIC_REHEARSAL",
});
const contribution = (ref, owner, fixtureId) => ({
  kind: "STATE",
  contributionId: hashId("contribution", ref),
  candidateRecordRef: ref,
  ownerSubjectDigest: owner,
  fixtureId,
  boardInstanceId: instanceId,
  observationVersionId: `observation:${fixtureId}`,
  observationVersion: "verified-v1",
  shareDecision: "SHARE",
  eligible: true,
  lifecycle: "ACTIVE",
  dataOrigin: "SYNTHETIC_REHEARSAL",
});

describe("candidate contribution state", () => {
  it("fails closed before database access and refuses old ACCEPT/WITHDRAW commands", async () => {
    const disabled = createMain({
      cloud: {
        database: () => {
          throw new Error("must not read");
        },
      },
      env: { ...env, ICHI_V2_SHADOW_CONTRIBUTION_ENABLED: "false" },
    });
    expect(await disabled({ operation: "LIST_MY_UPLOADS" })).toEqual({
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    });
    const { db } = shadowDb();
    const main = createMain({ cloud: cloud(db, "caller-a"), env });
    expect((await main({ operation: "ACCEPT" })).ok).toBe(false);
    expect(
      (
        await main({
          operation: "OWNER_COMMAND",
          action: "WITHDRAW",
          publicLeadId: leadId,
        })
      ).ok,
    ).toBe(false);
  });

  it("lists only own upload; A delete leaves B, B delete hides, duplicate is idempotent", async () => {
    const { db, table } = shadowDb({
      v2ShadowCandidateUploads: {
        [refA]: upload(refA, a, "a"),
        [refB]: upload(refB, b, "b"),
      },
      v2ShadowSourceFixtures: {
        "fixture:b": {
          ownerSubjectDigest: b,
          observationVersionId: "observation:b",
          currentObservationVersionId: "observation:b",
          lifecycleState: "CURRENT",
          publicLocation: {
            coordinateSystem: "GCJ02",
            latitude: 31.23,
            longitude: 121.47,
          },
          publicGates: {
            sourceCurrent: true,
            rightsEligible: true,
            publicEligible: true,
            moderationVisible: true,
            deleted: false,
          },
          dataOrigin: "SYNTHETIC_REHEARSAL",
        },
      },
      v2ShadowContributionLedger: {
        [hashId("contribution", refA)]: contribution(refA, a, "a"),
        [hashId("contribution", refB)]: contribution(refB, b, "b"),
      },
      v2ShadowMapContributionConsent: {
        [`consent:${a}`]: {
          kind: "STATE",
          ownerSubjectDigest: a,
          accepted: true,
          acceptedTermsVersion: "candidate-map-contribution-v3",
          acceptedScopeDigest: "d".repeat(64),
          acceptedAt: "2026-09-12T03:00:00.000Z",
          dataOrigin: "SYNTHETIC_REHEARSAL",
        },
        [`consent:${b}`]: {
          kind: "STATE",
          ownerSubjectDigest: b,
          accepted: true,
          acceptedTermsVersion: "candidate-map-contribution-v3",
          acceptedScopeDigest: "d".repeat(64),
          acceptedAt: "2026-09-12T03:00:00.000Z",
          dataOrigin: "SYNTHETIC_REHEARSAL",
        },
      },
      v2ShadowBoardInstances: {
        [instanceId]: {
          boardInstanceId: instanceId,
          lifecycleState: "ACTIVE",
          activePublicLeadId: leadId,
          lastEventSequence: 1,
          dataOrigin: "SYNTHETIC_REHEARSAL",
        },
      },
      v2ShadowPublicMapLeads: {
        [`lead:${leadId}:1`]: {
          _id: `lead:${leadId}:1`,
          publicLeadId: leadId,
          lifecycleState: "PUBLIC",
          visibility: "VISIBLE",
          dataOrigin: "SYNTHETIC_REHEARSAL",
        },
      },
    });
    const mainA = createMain({
      cloud: cloud(db, "caller-a"),
      env,
      now: () => 1000,
    });
    const mainB = createMain({
      cloud: cloud(db, "caller-b"),
      env,
      now: () => 1000,
    });
    expect(
      (await mainA({ operation: "LIST_MY_UPLOADS" })).uploads.map(
        (item) => item.candidateRecordRef,
      ),
    ).toEqual([refA]);
    expect(
      await mainA({
        operation: "DELETE_MY_UPLOAD",
        candidateRecordRef: refB,
        commandId: "delete-b-forged",
      }),
    ).toMatchObject({ ok: false, code: "UPLOAD_UNAVAILABLE" });
    expect(
      await mainA({
        operation: "DELETE_MY_UPLOAD",
        candidateRecordRef: refA,
        commandId: "delete-a-001",
        callerDigest: b,
      }),
    ).toMatchObject({ ok: true, lifecycle: "DELETED" });
    expect(
      table("v2ShadowPublicMapLeads").get(`lead:${leadId}:1`).visibility,
    ).toBe("VISIBLE");
    expect(
      table("v2ShadowContributionLedger").get(hashId("contribution", refB))
        .lifecycle,
    ).toBe("ACTIVE");
    expect(
      await mainA({
        operation: "DELETE_MY_UPLOAD",
        candidateRecordRef: refA,
        commandId: "delete-a-001",
      }),
    ).toMatchObject({ ok: true, duplicate: true });
    expect(
      await mainB({
        operation: "DELETE_MY_UPLOAD",
        candidateRecordRef: refB,
        commandId: "delete-b-001",
      }),
    ).toMatchObject({ ok: true, lifecycle: "DELETED" });
    expect(
      table("v2ShadowPublicMapLeads").get(`lead:${leadId}:1`).visibility,
    ).toBe("HIDDEN");
    expect(table("v2ShadowControlState").get("global:read-epoch").epoch).toBe(
      1,
    );
    expect(
      table("v2ShadowContributionLedger").get(hashId("contribution", refA))
        .noResurrection,
    ).toBe(true);
    expect(table("v2ShadowProjectionOutbox").size).toBe(2);
  });

  it("records versioned user consent and rejects stale client terms", async () => {
    const { db, table } = shadowDb();
    const main = createMain({
      cloud: cloud(db, "caller-a"),
      env,
      now: () => 1000,
    });
    expect(
      await main({
        operation: "ACCEPT_MAP_CONTRIBUTION_TERMS",
        termsVersion: env.ICHI_V2_SHADOW_MAP_CONTRIBUTION_TERMS_VERSION,
        scopeDigest: env.ICHI_V2_SHADOW_MAP_CONTRIBUTION_SCOPE_DIGEST,
        commandId: "consent-a-001",
      }),
    ).toMatchObject({ ok: true, accepted: true });
    expect(
      await main({
        operation: "ACCEPT_MAP_CONTRIBUTION_TERMS",
        termsVersion: env.ICHI_V2_SHADOW_MAP_CONTRIBUTION_TERMS_VERSION,
        scopeDigest: env.ICHI_V2_SHADOW_MAP_CONTRIBUTION_SCOPE_DIGEST,
        commandId: "consent-a-001",
      }),
    ).toMatchObject({ ok: true, duplicate: true, accepted: true });
    expect(
      await main({
        operation: "ACCEPT_MAP_CONTRIBUTION_TERMS",
        termsVersion: "candidate-map-contribution-v2",
        scopeDigest: env.ICHI_V2_SHADOW_MAP_CONTRIBUTION_SCOPE_DIGEST,
        commandId: "consent-a-stale",
      }),
    ).toMatchObject({ ok: false, code: "INVALID_OR_STALE_CONSENT" });
    expect(
      await main({
        operation: "SET_MAP_CONTRIBUTION_CONSENT",
        enabled: false,
      }),
    ).toMatchObject({ ok: false, code: "INVALID_REQUEST" });
    expect(
      table("v2ShadowMapContributionConsent").get(`consent:${a}`),
    ).toMatchObject({
      accepted: true,
      acceptedTermsVersion: "candidate-map-contribution-v3",
    });
  });
});
