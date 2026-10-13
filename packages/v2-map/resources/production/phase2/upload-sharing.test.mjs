import { describe, expect, it, vi } from "vitest";
import { setup, NOW } from "./fixtures.test-support.mjs";
import { hash } from "../shared/security.mjs";
import v1 from "../../../../../services/cloudbase/shared/runtime.js";
import { lineageId } from "./source.mjs";

const direct = (reviewPass = true) => {
  const s = setup();
  const seed = s.record();
  const row = s.table("observationCandidates").get(seed);
  s.table("mapContributionConsents").clear();
  s.env.ICHI_V2_BRIDGE_PRODUCER_ENABLED = "false";
  s.table("recognitionJobs").set("direct-job", {
    ownerAccountId: "account_a",
    sourcePath: "direct-upload",
    status: "recognized",
    quotaId: "direct-quota",
    keyHash: "key",
  });
  s.table("dailyQuotas").set("direct-quota", {
    used: 0,
    reservations: { key: { status: "reserved" } },
  });
  const raw = s.cloud.database();
  const decorate = (db) => ({
    ...db,
    collection: (name) => {
      const c = db.collection(name);
      return {
        ...c,
        doc: (id) => {
          const d = c.doc(id);
          return {
            ...d,
            update: async ({ data }) =>
              d.set({ data: { ...(await d.get()).data, ...data } }),
          };
        },
      };
    },
  });
  s.cloud.database = () => ({
    ...decorate(raw),
    runTransaction: (fn) => raw.runTransaction((tx) => fn(decorate(tx))),
  });
  const reviewer = vi.fn(async () => ({
    result: { suggest: reviewPass ? "pass" : "risky" },
  }));
  const run = v1.createRuntime({
    cloud: s.cloud,
    env: s.env,
    now: () => NOW,
    textSafetyReviewer: reviewer,
  });
  const event = {
    recognitionJobId: "direct-job",
    boardId: "direct-board",
    sourcePath: "direct-upload",
    confirmedSnapshot: row.finalSnapshot,
    location: row.location,
    locationNote: "安全地点备注",
    observedAt: row.observedAt,
    uploadSharing: {
      disclosureVersion: "upload-confirmation-map-sharing-20261003-v2",
      rightsAttested: true,
    },
  };
  return { s, run, event, reviewer };
};

describe("original upload confirmation persists sharing before account consent", () => {
  it("synchronously reviews the direct note and atomically receives the record and intent without a draw/location comparison task", async () => {
    const { s, run, event, reviewer } = direct();
    const result = await run("finalize-board-observation", event);
    expect(result).toMatchObject({
      ok: true,
      data: { status: "clue_submitted", uploadSharingAcknowledged: true },
    });
    const id = result.data.recordId;
    expect(
      s.table("observationCandidates").get(id).uploadSharingAuthorization,
    ).toMatchObject({
      shareIntent: "SHARE",
      rightsAttested: true,
      authorizationBasis: "EXPLICIT_UPLOAD_CONFIRMATION",
    });
    expect(
      s.table("observationCandidates").get(id).directNoteReview.status,
    ).toBe("NOTE_PASSED");
    expect(reviewer).toHaveBeenCalledWith(
      expect.objectContaining({
        scene: 2,
        openid: "a",
        content: event.locationNote,
      }),
    );
    expect(s.table("drawSubmissions").size).toBe(0);
    expect(s.table("publicMapLeads").size).toBe(0);
    expect(s.table("mapContributionConsents").size).toBe(0);
    const writes = s.table("mapSourceOutbox").size;
    expect(
      (await run("finalize-board-observation", event)).data
        .uploadSharingAcknowledged,
    ).toBe(true);
    expect(reviewer).toHaveBeenCalledTimes(1);
    expect(s.table("mapSourceOutbox").size).toBe(writes);
    expect(s.table("mapPlayerSourcePermissions").size).toBe(0);
    expect(s.table("boardObservations").size).toBe(0);
    expect(s.table("mapSourceOutbox").size).toBe(0);
    s.table("mapContributionConsents").set(
      hash("consent", "account_a", s.policy.terms.version),
      {
        ownerAccountId: "account_a",
        termsVersion: s.policy.terms.version,
        scopeDigest: s.policy.terms.scopeDigest,
        accepted: true,
      },
    );
    s.env.ICHI_V2_BRIDGE_PRODUCER_ENABLED = "true";
    await s.run((await s.enqueue(id)).eventId);
    expect(s.table("boardObservations").size).toBeGreaterThan(0);
    expect(
      s.table("mapPlayerSourcePermissions").get(lineageId(id)).shareIntent,
    ).toBe("SHARE");
    expect(s.heads().filter((r) => r.lifecycleState === "PUBLIC")).toHaveLength(
      1,
    );
  });
  it("keeps V1 upload available when the V2 producer control is paused", async () => {
    const { s, run, event } = direct();
    s.env.ICHI_V2_BRIDGE_PRODUCER_ENABLED = "true";
    s.table("mapSourceBridgeControl").get("global:bridge").producerEnabled =
      false;
    expect(await run("finalize-board-observation", event)).toMatchObject({
      ok: true,
      data: { status: "clue_submitted", uploadSharingAcknowledged: true },
    });
    expect(s.table("mapSourceOutbox").size).toBe(0);
    expect(s.table("boardObservations").size).toBe(0);
  });
  it("rejects unsafe direct notes before storing a record, consuming quota or granting sharing", async () => {
    const { s, run, event } = direct(false);
    expect(await run("finalize-board-observation", event)).toEqual({
      ok: false,
      error: { code: "LOCATION_NOTE_REVIEW_FAILED" },
    });
    expect(s.table("observationCandidates").size).toBe(1);
    expect(s.table("mapPlayerSourcePermissions").size).toBe(0);
    expect(s.table("dailyQuotas").get("direct-quota").used).toBe(0);
  });
  it("rolls back record and quota when the upload disclosure is invalid", async () => {
    const { s, run, event } = direct();
    event.uploadSharing.disclosureVersion = "unknown-disclosure";
    expect((await run("finalize-board-observation", event)).error.code).toBe(
      "UPLOAD_SHARING_DISCLOSURE_INVALID",
    );
    expect(s.table("observationCandidates").size).toBe(1);
    expect(s.table("dailyQuotas").get("direct-quota").used).toBe(0);
    expect(s.table("mapPlayerSourcePermissions").size).toBe(0);
  });
  it("stores an explicit pending draw intent in V1 while all V2 controls are absent", async () => {
    const { s, run, event } = direct();
    const id = s.record("2", { draw: true });
    s.table("observationCandidates").get(id).verificationStatus = "PENDING";
    s.table("mapControlState").clear();
    s.table("mapSourceBridgeControl").clear();
    expect(
      await run("finalize-board-observation", {
        action: "confirm-upload-sharing",
        recordId: id,
        uploadSharing: event.uploadSharing,
      }),
    ).toMatchObject({ ok: true, data: { uploadSharingAcknowledged: true } });
    expect(
      s.table("observationCandidates").get(id).uploadSharingAuthorization
        .shareIntent,
    ).toBe("SHARE");
    expect(s.table("mapPlayerSourcePermissions").size).toBe(0);
    expect(s.table("boardObservations").size).toBe(0);
    s.setCaller("b");
    expect(
      (
        await run("finalize-board-observation", {
          action: "confirm-upload-sharing",
          recordId: id,
          uploadSharing: event.uploadSharing,
        })
      ).error.code,
    ).toBe("RECORD_NOT_FOUND");
  });
});
