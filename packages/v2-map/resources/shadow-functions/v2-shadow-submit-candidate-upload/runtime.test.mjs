import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { adaptDirectPublication } from "../../../src/source-adapters.js";
import { testBoardFacts } from "../../../src/test-support.js";
import { shadowDb } from "../shared/mock-db.test-support.mjs";
import { createMain } from "./runtime.mjs";

const principalKey = "p".repeat(48);
const callerDigest = createHmac("sha256", principalKey)
  .update("ichi:v2:shadow:principal:v1\0app\0owner-a")
  .digest("hex");
const make = () => {
  const observedAt = "2026-09-28T10:00:00Z";
  const publication = {
    recordId: "synthetic-record",
    boardId: "synthetic-board",
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
    fixtureId: "source-a",
    publication,
    observationVersionId: adapted.value.observationVersionId,
    currentObservationVersionId: adapted.value.observationVersionId,
    verifiedBoardVersion: "verified-v1",
    verifiedAt: observedAt,
    ownerSubjectDigest: callerDigest,
    lifecycleState: "CURRENT",
    dataOrigin: "SYNTHETIC_REHEARSAL",
  };
  const { db, table } = shadowDb({
    v2ShadowSourceFixtures: { "fixture:source-a": fixture },
  });
  let openId = "owner-a";
  const cloud = {
    database: () => db,
    getWXContext: () => ({ APPID: "app", OPENID: openId }),
  };
  const env = {
    ICHI_V2_SHADOW_BOUNDARY: "synthetic_only",
    ICHI_V2_SHADOW_CANDIDATE_UPLOAD_ENABLED: "true",
    ICHI_V2_SHADOW_UPLOAD_REF_HMAC_KEY: "u".repeat(48),
    ICHI_V2_SHADOW_PRINCIPAL_HMAC_KEY: principalKey,
    ICHI_V2_SHADOW_TEST_CALLER_DIGESTS: callerDigest,
  };
  return {
    table,
    env,
    cloud,
    setCaller: (value) => {
      openId = value;
    },
  };
};

describe("server-issued candidate upload lineage", () => {
  it("fails closed before DB access", async () => {
    const main = createMain({
      cloud: {
        database: () => {
          throw new Error("must not read");
        },
      },
      env: {},
    });
    expect(
      await main({
        fixtureId: "source-a",
        shareDecision: "SHARE",
        idempotencyKey: "upload-key-1",
      }),
    ).toEqual({ ok: false, code: "SHADOW_UPLOAD_DISABLED" });
  });

  it("derives opaque ref on server, verifies fixture, deduplicates same version", async () => {
    const state = make();
    const main = createMain({
      cloud: state.cloud,
      env: state.env,
      now: () => Date.parse("2026-09-28T11:00:00Z"),
    });
    const input = {
      fixtureId: "source-a",
      shareDecision: "SHARE",
      idempotencyKey: "upload-key-1",
      ownerSubjectDigest: "forged",
    };
    const first = await main(input);
    expect(first).toMatchObject({
      ok: true,
      duplicate: false,
      validationState: "VERIFIED",
    });
    expect(first.candidateRecordRef).toMatch(/^candidate:[a-f0-9]{40}$/u);
    expect(
      state.table("v2ShadowCandidateUploads").get(first.candidateRecordRef)
        .ownerSubjectDigest,
    ).toBe(callerDigest);
    const second = await main({ ...input, idempotencyKey: "upload-key-2" });
    expect(second).toMatchObject({
      ok: true,
      duplicate: true,
      candidateRecordRef: first.candidateRecordRef,
    });
    expect(state.table("v2ShadowCandidateUploads").size).toBe(1);
    expect(JSON.stringify(first)).not.toMatch(
      /OPENID|ownerAccountId|synthetic-record/u,
    );
  });

  it("rejects cross-account fixture and altered share decision", async () => {
    const state = make();
    const main = createMain({ cloud: state.cloud, env: state.env });
    const input = {
      fixtureId: "source-a",
      shareDecision: "SHARE",
      idempotencyKey: "upload-key-1",
    };
    expect((await main(input)).ok).toBe(true);
    expect(
      await main({ ...input, shareDecision: "DO_NOT_SHARE" }),
    ).toMatchObject({ ok: false, code: "UPLOAD_UNAVAILABLE" });
    state.setCaller("owner-b");
    state.env.ICHI_V2_SHADOW_TEST_CALLER_DIGESTS +=
      "," +
      createHmac("sha256", principalKey)
        .update("ichi:v2:shadow:principal:v1\0app\0owner-b")
        .digest("hex");
    expect(await main(input)).toMatchObject({
      ok: false,
      code: "UPLOAD_UNAVAILABLE",
    });
  });
});
