import { describe, it, expect } from "vitest";
import producer from "../../../../../services/cloudbase/shared/source-bridge-producer.js";
import sharing from "../../../../../services/cloudbase/shared/upload-sharing-authorization.js";
import { setup, NOW } from "./fixtures.test-support.mjs";
import { createDrain } from "./runtime.mjs";
import { signedRequest } from "./security.mjs";
import { registerConsentSourceWake } from "../shared/source-wake.mjs";
import { createMain as consentFactory } from "../functions/manage-map-contribution-consent/runtime.mjs";

const proof = () => ({
  authorizationBasis: "EXPLICIT_UPLOAD_CONFIRMATION",
  shareIntent: "SHARE",
  rightsAttested: true,
  followCurrentVersion: true,
  disclosureVersion: "upload-confirmation-map-sharing-20261003-v2",
  confirmedAt: new Date(NOW - 100).toISOString(),
});
const input = {
  rightsAttested: true,
  disclosureVersion: "upload-confirmation-map-sharing-20261003-v2",
};
const sources = (s) =>
  [...s.table("mapSourceOutbox").values()].filter(
    (x) => x.kind === "SOURCE_EVENT",
  );

describe("V2 admission automatically materializes the map", () => {
  it("accepts signed CloudBase transport metadata without using it as authority", async () => {
    const s = setup(),
      id = s.record();
    s.table("observationCandidates").get(id).uploadSharingAuthorization =
      proof();
    const queued = await s.enqueue(id);
    const signed = signedRequest(
      s.env.ICHI_V2_SOURCE_BRIDGE_HMAC_KEY,
      "PROCESS",
      queued.eventId,
      NOW,
    );
    const metadata = { openId: "untrusted-other-user", rightsAttested: true };
    const tcbContext = { TRIGGER_SRC: "timer", ownerAccountId: "other-user" };
    expect(
      (
        await s.worker({
          ...signed,
          signature: "0".repeat(64),
          userInfo: metadata,
          tcbContext,
        })
      ).code,
    ).toBe("UNAUTHORIZED");
    expect(
      await s.worker({ ...signed, userInfo: metadata, tcbContext }),
    ).toMatchObject({
      ok: true,
      admitted: true,
    });
    expect([...s.table("mapContributions").values()][0].ownerAccountId).toBe(
      "account_a",
    );
  });
  it("commits admitted V2 source and PUBLIC lead together in one call without a second decision", async () => {
    const s = setup(),
      id = s.record();
    s.table("observationCandidates").get(id).uploadSharingAuthorization =
      proof();
    const result = await s.process((await s.enqueue(id)).eventId);
    expect(result).toMatchObject({
      ok: true,
      admitted: true,
      status: "APPLIED",
      admissionContract: "V2_ADMISSION_AUTO_MAP_V1",
    });
    expect(s.table("boardObservations").size).toBe(2);
    expect(s.heads().filter((x) => x.lifecycleState === "PUBLIC")).toHaveLength(
      1,
    );
  });
  it("a failed commit leaves no half-admitted V2 business data", async () => {
    const s = setup(),
      id = s.record();
    s.permission(id);
    const e = await s.enqueue(id);
    s.injectCrashAfter(8);
    expect((await s.process(e.eventId)).ok).toBe(false);
    for (const name of [
      "boardObservations",
      "boardInstances",
      "mapContributions",
      "publicMapLeads",
    ])
      expect(s.table(name).size).toBe(0);
    s.clearCrash();
    s.setTime(NOW + 10000);
    await s.run(e.eventId);
    expect(s.heads().filter((x) => x.lifecycleState === "PUBLIC")).toHaveLength(
      1,
    );
  });
  it("keeps an ambiguous new source before V2 admission rather than awaiting approval in V2", async () => {
    const s = setup(),
      first = s.record();
    s.permission(first);
    await s.run((await s.enqueue(first)).eventId);
    const instance = [...s.table("boardInstances").values()][0];
    s.table("boardInstances").set("another-instance", {
      ...instance,
      boardInstanceId: "another-instance",
    });
    const before = s.table("boardObservations").size,
      id = s.record("2", { observedAge: 5000 });
    s.table("observationCandidates").get(id).uploadSharingAuthorization =
      proof();
    const result = await s.process((await s.enqueue(id)).eventId);
    expect(result).toMatchObject({ admitted: false, status: "MANUAL_REVIEW" });
    expect(s.table("boardObservations").size).toBe(before);
    expect(
      s
        .table("mapContributions")
        .has(producer.digest("contribution", producer.lineageId(id))),
    ).toBe(false);
  });
  it("does not admit inaccurate locations as V2 sources with an additional pending public gate", async () => {
    const s = setup(),
      id = s.record();
    s.table("observationCandidates").get(id).location.accuracy = 101;
    s.permission(id);
    const result = await s.process((await s.enqueue(id)).eventId);
    expect(result).toMatchObject({ admitted: false, status: "SKIPPED" });
    expect(s.table("boardObservations").size).toBe(0);
    expect(s.heads()).toHaveLength(0);
  });
});

describe("durable original-intent and consent wakeups", () => {
  it("does not acknowledge consent if registering its durable wake rolls back", async () => {
    const s = setup();
    s.table("mapContributionConsents").clear();
    const main = consentFactory({ cloud: s.cloud, env: s.env, now: () => NOW });
    s.injectCrashAfter(3);
    const r = await main({
      command: "ACCEPT",
      termsVersion: s.policy.terms.version,
      scopeDigest: s.policy.terms.scopeDigest,
      actionId: "consent-rollback-1",
    });
    expect(r.ok).toBe(false);
    expect(s.table("mapContributionConsents").size).toBe(0);
    expect(s.table("mapSourceOutbox").size).toBe(0);
  });
  it("a fresh explicit acceptance restores a false consent and restarts its completed sweep", async () => {
    const s = setup();
    const row = [...s.table("mapContributionConsents").values()].find(
      (r) => r.ownerAccountId === "account_a",
    );
    row.accepted = false;
    const wake = await s.cloud
      .database()
      .runTransaction((tx) =>
        registerConsentSourceWake(tx, "account_a", s.policy.terms, NOW),
      );
    s.table("mapSourceOutbox").get(wake.eventId).status = "APPLIED";
    const main = consentFactory({ cloud: s.cloud, env: s.env, now: () => NOW });
    const r = await main({
      command: "ACCEPT",
      termsVersion: s.policy.terms.version,
      scopeDigest: s.policy.terms.scopeDigest,
      actionId: "consent-restore-1",
    });
    expect(r.ok).toBe(true);
    expect(
      [...s.table("mapContributionConsents").values()].find(
        (r) => r.ownerAccountId === "account_a",
      ).accepted,
    ).toBe(true);
    expect(s.table("mapSourceOutbox").get(wake.eventId)).toMatchObject({
      status: "PENDING",
      cursor: "",
    });
  });
  it("wakes a skipped source when the original device intent arrives, once", async () => {
    const s = setup(),
      id = s.record();
    await s.run((await s.enqueue(id)).eventId);
    const persist = () =>
      s.cloud.database().runTransaction((tx) =>
        sharing.persistUploadSharing({
          tx,
          env: s.env,
          recordId: id,
          accountId: "account_a",
          intent: input,
          nowMs: NOW,
        }),
      );
    await persist();
    const count = sources(s).length;
    await persist();
    expect(sources(s)).toHaveLength(count);
    const next = sources(s).find((x) => x.reason === "UPLOAD_INTENT");
    await s.run(next.eventId);
    expect(s.heads().filter((x) => x.lifecycleState === "PUBLIC")).toHaveLength(
      1,
    );
  });
  it("ACCEPT atomically registers a durable sweep while map processing is paused", async () => {
    const s = setup();
    s.table("mapContributionConsents").clear();
    s.bridge.processorEnabled = false;
    const main = consentFactory({ cloud: s.cloud, env: s.env, now: () => NOW });
    const result = await main({
      command: "ACCEPT",
      ...{
        termsVersion: s.policy.terms.version,
        scopeDigest: s.policy.terms.scopeDigest,
      },
      actionId: "consent-action-1",
    });
    expect(result.ok).toBe(true);
    expect([...s.table("mapSourceOutbox").values()]).toMatchObject([
      { kind: "CONSENT_EVENT", status: "PENDING" },
    ]);
    expect(s.table("mapPlayerSourcePermissions").size).toBe(0);
    expect(s.table("boardObservations").size).toBe(0);
    await main({
      command: "ACCEPT",
      termsVersion: s.policy.terms.version,
      scopeDigest: s.policy.terms.scopeDigest,
      actionId: "consent-action-2",
    });
    expect(s.table("mapSourceOutbox").size).toBe(1);
  });
  it("fairly advances past private records and only queues sources with an original intent", async () => {
    const s = setup();
    for (const n of ["1", "2", "3", "4", "5"]) s.record(n);
    const id = s.record("6");
    s.table("observationCandidates").get(id).uploadSharingAuthorization =
      proof();
    const wake = await s.cloud
      .database()
      .runTransaction((tx) =>
        registerConsentSourceWake(tx, "account_a", s.policy.terms, NOW),
      );
    for (let i = 0; i < 4; i++) {
      s.setTime(NOW + i * 2000);
      expect((await s.process(wake.eventId)).ok).toBe(true);
    }
    expect(s.table("mapSourceOutbox").get(wake.eventId).status).toBe("APPLIED");
    expect(sources(s)).toHaveLength(1);
    expect(sources(s)[0].recordId).toBe(id);
    expect(s.table("mapPlayerSourcePermissions").size).toBe(0);
  });
  it("a bounded signed drain never touches another pending event and understands a string RPC result", async () => {
    const s = setup(),
      a = s.record(),
      b = s.record("2");
    s.permission(a);
    s.permission(b);
    const first = await s.enqueue(a),
      other = await s.enqueue(b),
      calls = [];
    s.cloud.callFunction = async ({ name, data }) => {
      calls.push(name);
      return { result: JSON.stringify(await s.worker(data)) };
    };
    const drain = createDrain({ cloud: s.cloud, env: s.env, now: () => NOW });
    const r = await drain(
      signedRequest(
        s.env.ICHI_V2_SOURCE_BRIDGE_HMAC_KEY,
        "DRAIN_ONE",
        first.eventId,
        NOW,
      ),
    );
    expect(r).toMatchObject({ ok: true, processed: 1, failed: 0 });
    expect(calls).toEqual(["process-map-source-bridge"]);
    expect(s.table("mapSourceOutbox").get(other.eventId).status).toBe(
      "PENDING",
    );
  });
  it("one transport error does not block later pending uploads", async () => {
    const s = setup();
    for (const suffix of ["1", "2"]) {
      const id = s.record(suffix);
      s.permission(id);
      await s.enqueue(id);
    }
    let count = 0;
    s.cloud.callFunction = async ({ data }) => {
      if (++count === 1)
        throw Object.assign(new Error("private transport diagnostics"), {
          errCode: -501001,
        });
      return { result: await s.worker(data) };
    };
    const drain = createDrain({ cloud: s.cloud, env: s.env, now: () => NOW });
    const r = await drain(
      signedRequest(
        s.env.ICHI_V2_SOURCE_BRIDGE_HMAC_KEY,
        "DRAIN",
        "0".repeat(64),
        NOW,
      ),
    );
    expect(r).toMatchObject({
      ok: true,
      processed: 1,
      failed: 1,
      failureCodes: ["CLOUD_CALL_-501001"],
    });
    expect(JSON.stringify(r)).not.toContain("private transport diagnostics");
    expect(count).toBe(2);
  });
});
