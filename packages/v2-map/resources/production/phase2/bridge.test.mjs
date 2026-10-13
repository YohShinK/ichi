import { setup, NOW } from "./fixtures.test-support.mjs";
const at = (n = 0) => new Date(NOW + n).toISOString();
import { describe, expect, it, vi } from "vitest";
import producer from "../../../../../services/cloudbase/shared/source-bridge-producer.js";
import v1 from "../../../../../services/cloudbase/shared/runtime.js";
import { hash } from "../shared/security.mjs";
import { createMain as publicFactory } from "../shared/runtime.mjs";
import { signedRequest } from "./security.mjs";
import { loadSource, normalizeSource, lineageId, stateId } from "./source.mjs";
import {
  createDrain,
  previewHistorical,
  enqueueHistoricalBatch,
} from "./runtime.mjs";
import verifier from "../../../../../services/cloudbase/functions/verify-prize-tickets/index.js";

const decorateV1 = (db) => ({
  ...db,
  collection: (name) => {
    const c = db.collection(name);
    return {
      ...c,
      doc: (key) => {
        const d = c.doc(key);
        return {
          ...d,
          update: async ({ data }) => {
            const before = await d.get();
            return d.set({ data: { ...before.data, ...data } });
          },
        };
      },
    };
  },
});
const enableV1Harness = (s) => {
  const raw = s.cloud.database();
  s.cloud.database = () => ({
    ...decorateV1(raw),
    runTransaction: (fn) => raw.runTransaction((tx) => fn(decorateV1(tx))),
  });
  return v1.createRuntime({
    cloud: s.cloud,
    env: s.env,
    now: () => NOW,
    textSafetyReviewer: async () => ({ result: { suggest: "pass" } }),
  });
};

describe("TASK22 Phase2 authoritative PLAYER bridge", () => {
  it("V1 direct finalization atomically queues facts and preserves the original response shape", async () => {
    const s = setup();
    const seed = s.record();
    const r = s.table("observationCandidates").get(seed);
    s.table("recognitionJobs").set("job-finalized", {
      ownerAccountId: "account_a",
      sourcePath: "direct-upload",
      status: "recognized",
      quotaId: "quota",
      keyHash: "reserved-job",
    });
    s.table("dailyQuotas").set("quota", {
      used: 0,
      reservations: { "reserved-job": { status: "reserved" } },
    });
    const dispatch = enableV1Harness(s);
    const result = await dispatch("finalize-board-observation", {
      recognitionJobId: "job-finalized",
      boardId: "board-finalized",
      sourcePath: "direct-upload",
      confirmedSnapshot: r.initialSnapshot,
      location: r.location,
      locationNote: "私有地点备注",
      observedAt: r.observedAt,
    });
    expect(result.ok).toBe(true);
    expect(result.data.status).toBe("clue_submitted");
    expect(result.data).not.toHaveProperty("eventId");
    expect(s.table("mapSourceOutbox").size).toBe(1);
    expect(s.table("dailyQuotas").get("quota").used).toBe(1);
    expect(
      s.table("observationCandidates").get(result.data.recordId).finalSnapshot
        .tiers[0].remainingTickets,
    ).toBe(9);
  });
  it("real V1 note review hides the prior source before safety review and queues only the final approval", async () => {
    const s = setup();
    const id = s.record("1", { draw: true });
    s.permission(id);
    await s.run((await s.enqueue(id)).eventId);
    const old = s.heads()[0];
    enableV1Harness(s);
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    try {
      const result = await verifier.main(
        {
          action: "review-note",
          recordId: id,
          boardId: "board_1",
          submissionVersion: 1,
          userNote: "新安全备注",
        },
        {
          cloud: s.cloud,
          env: s.env,
          logger: { info() {}, warn() {}, error() {} },
          noteReviewer: async () => {
            expect(
              s.table("publicMapLeads").get(`head:${old.publicLeadId}`)
                .lifecycleState,
            ).toBe("HIDDEN");
            return { suggest: "pass" };
          },
        },
      );
      expect(result.ok).toBe(true);
      expect(result.data.status).toBe("APPROVED");
      const work = [...s.table("mapSourceOutbox").values()]
        .filter((e) => e.status === "PENDING")
        .sort((a, b) => b.revision - a.revision)[0];
      await s.run(work.eventId);
      expect(
        s.heads().find((r) => r.lifecycleState === "PUBLIC").venueNote,
      ).toBe("新安全备注");
    } finally {
      vi.useRealTimers();
    }
  });
  it("defaults disabled before any database/identity access", async () => {
    const s = setup();
    s.env.ICHI_V2_FUNCTION_ENABLED = "false";
    const before = s.accesses.length;
    expect(await s.worker({})).toEqual({ ok: false, code: "SERVICE_DISABLED" });
    expect(await s.owner({})).toEqual({ ok: false, code: "SERVICE_DISABLED" });
    expect(s.accesses.length).toBe(before);
    expect(
      await producer.enqueueSourceChange({ tx: {}, env: {}, recordId: "x" }),
    ).toEqual({ enabled: false });
  });
  it("rejects forged, expired, tampered and extra client facts before database access", async () => {
    const s = setup();
    const e = signedRequest(
      s.env.ICHI_V2_SOURCE_BRIDGE_HMAC_KEY,
      "PROCESS",
      "1".repeat(64),
      NOW,
    );
    for (const invalid of [
      {},
      { ...e, signature: "f".repeat(64) },
      { ...e, ownerAccountId: "account_a" },
      signedRequest(
        s.env.ICHI_V2_SOURCE_BRIDGE_HMAC_KEY,
        "PROCESS",
        e.eventId,
        NOW - 60000,
      ),
    ]) {
      expect((await s.worker(invalid)).code).toBe("UNAUTHORIZED");
    }
    expect(s.accesses).toHaveLength(0);
  });
  it("enforces read-only V1 capabilities and transaction budgets", async () => {
    const s = setup();
    expect(s.db.collection("accounts").doc("x").set).toBeUndefined();
    expect(s.db.collection("drawSubmissions").where({}).update).toBeUndefined();
    expect(s.db.collection("profiles").doc("x").set).toBeUndefined();
    expect(() => s.db.collection("profileSecrets")).toThrow(
      "COLLECTION_NOT_ALLOWED",
    );
    await expect(
      s.db.runTransaction(async (tx) => {
        for (let n = 0; n < 96; n++)
          await tx.collection("mapSourceOutbox").doc(String(n)).get();
      }),
    ).rejects.toThrow("TRANSACTION_OPERATION_BUDGET_EXCEEDED");
  });
  it("finalized upload becomes only a verified safe projection with fallback contributor", async () => {
    const s = setup();
    const id = s.record();
    s.permission(id);
    expect((await s.run((await s.enqueue(id)).eventId)).status).toBe("APPLIED");
    const lead = s.heads()[0];
    expect(lead.lifecycleState).toBe("PUBLIC");
    expect(lead.recordType).toBe("UPLOAD_RECORD");
    expect(lead.publicLocation.latitude).toBe(31.23);
    expect(lead.venueNote).toBeNull();
    expect(lead.contributors[0].displayName).toBe("ICHI 玩家");
    const wire = JSON.stringify(lead);
    for (const secret of [
      id,
      "account_a",
      "job-1",
      "private-ticket",
      "accuracy",
      "recognitionJobId",
      "scopeDigest",
      "sourceVersion",
    ])
      expect(wire).not.toContain(secret);
  });
  it("uses exact current APPROVED draw version and verifies authoritative subtraction", async () => {
    const s = setup();
    const id = s.record("1", { draw: true });
    s.permission(id);
    s.submission(id, 2, 8).status = "PHOTO_PENDING";
    await s.run((await s.enqueue(id)).eventId);
    expect(s.heads()[0].board.tiers[0].remainingTickets).toBe(9);
    expect(s.heads()[0].recordType).toBe("DRAW_RECORD");
    s.table("observationCandidates").get(id).publishedSubmissionVersion = 2;
    const n = normalizeSource(await loadSource(s.db, id), NOW);
    expect(n.reason).toBe("EXACT_APPROVED_SUBMISSION_REQUIRED");
    s.submission(id, 2, 8).authoritativeDrawEvents.pop();
    expect(normalizeSource(await loadSource(s.db, id), NOW).reason).toBe(
      "BOARD_FACTS_INVALID",
    );
  });
  it("keeps absent R2 manufacturer initial tickets unknown rather than inferring them from first capture", async () => {
    const s = setup();
    const id = s.record("1", { draw: true });
    const source = normalizeSource(await loadSource(s.db, id), NOW);
    expect(source.boardFacts.tiers[0].initialRemainingTickets).toBeNull();
    expect(source.boardFacts.tiers[0].remainingTickets).toBe(9);
    s.submission(id, 1, 9).finalSnapshot.ipName = "伪造不同IP";
    expect(normalizeSource(await loadSource(s.db, id), NOW).reason).toBe(
      "BOARD_FACTS_INVALID",
    );
  });
  it("requires correction for a conflicting lineage instead of silently relocating its established board", async () => {
    const s = setup();
    const id = s.record();
    s.permission(id);
    await s.run((await s.enqueue(id)).eventId);
    s.table("observationCandidates").get(id).finalSnapshot.ipName = "不同IP";
    const e = await s.enqueue(id, "CHANGED");
    const work = await s.run(e.eventId);
    expect(work.status).toBe("MANUAL_REVIEW");
    expect(s.heads().filter((r) => r.lifecycleState === "PUBLIC")).toHaveLength(
      0,
    );
  });
  it("source fingerprint excludes temporary evidence cleanup and provider diagnostics", async () => {
    const s = setup();
    const id = s.record("1", { draw: true });
    const before = normalizeSource(await loadSource(s.db, id), NOW);
    const d = s.submission(id, 1, 9);
    d.imageFileId = null;
    d.providerDiagnostics.requestId = "new-private-diagnostic";
    expect(normalizeSource(await loadSource(s.db, id), NOW).fingerprint).toBe(
      before.fingerprint,
    );
    d.finalSnapshot.currency = "USD";
    expect(normalizeSource(await loadSource(s.db, id), NOW).reason).toBe(
      "BOARD_FACTS_INVALID",
    );
  });
  it.each([
    "DO_NOT_SHARE",
    "missing-permission",
    "missing-consent",
    "old-terms",
    "rights-false",
    "policy-null",
  ])("fails closed for %s", async (kind) => {
    const s = setup();
    const id = s.record();
    s.permission(id);
    if (kind === "DO_NOT_SHARE") s.permission(id, { shareIntent: kind });
    if (kind === "missing-permission")
      s.table("mapPlayerSourcePermissions").clear();
    if (kind === "missing-consent") s.table("mapContributionConsents").clear();
    if (kind === "old-terms") s.permission(id, { termsVersion: "old" });
    if (kind === "rights-false") s.permission(id, { rightsAttested: false });
    if (kind === "policy-null") s.bridge.locationPolicy = null;
    expect((await s.run((await s.enqueue(id)).eventId)).status).toBe("SKIPPED");
    expect(s.heads()).toHaveLength(0);
  });
  it.each(["owner", "board", "version", "photo", "location", "status"])(
    "rejects mismatched draw %s evidence",
    async (kind) => {
      const s = setup();
      const id = s.record("1", { draw: true });
      const d = s.submission(id, 1, 9);
      if (kind === "owner") d.ownerAccountId = "account_b";
      if (kind === "board") d.boardId = "other";
      if (kind === "version") d.submissionVersion = 2;
      if (kind === "photo") d.photoReview.status = "PHOTO_FAILED";
      if (kind === "location") d.locationReview.status = "LOCATION_FAILED";
      if (kind === "status") d.status = "NOTE_PENDING";
      expect(normalizeSource(await loadSource(s.db, id), NOW).reason).toBe(
        "EXACT_APPROVED_SUBMISSION_REQUIRED",
      );
    },
  );
  it("does not invent grand classes, coordinate systems, capture times or ingestion freshness", async () => {
    const s = setup();
    const id = s.record();
    const r = s.table("observationCandidates").get(id);
    delete r.location.coordinateSystem;
    expect(normalizeSource(await loadSource(s.db, id), NOW).ok).toBe(false);
    r.location.coordinateSystem = "gcj02";
    r.observedAt = at(1);
    expect(normalizeSource(await loadSource(s.db, id), NOW).ok).toBe(false);
    r.observedAt = at(-60000);
    delete r.finalSnapshot.tiers[0].isGrandPrize;
    expect(normalizeSource(await loadSource(s.db, id), NOW).reason).toBe(
      "BOARD_FACTS_INVALID",
    );
  });
  it("omits mismatched note approval without promoting private note content", async () => {
    const s = setup();
    const id = s.record("1", { draw: true });
    const d = s.submission(id, 1, 9);
    d.userNoteHash = hash("旧备注");
    s.permission(id);
    await s.run((await s.enqueue(id)).eventId);
    expect(s.heads()[0].venueNote).toBeNull();
  });
  it("records an initial owner choice against current fingerprint, with action replay fencing", async () => {
    const s = setup();
    const id = s.record();
    const initial = await s.owner({ command: "GET", recordId: id });
    s.setCaller("b");
    expect((await s.owner({ command: "GET", recordId: id })).code).toBe(
      "RECORD_UNAVAILABLE",
    );
    s.setCaller("a");
    const event = {
      command: "SET_INITIAL_CHOICE",
      recordId: id,
      actionId: "choice-0001",
      expectedFingerprint: initial.fingerprint,
      shareIntent: "SHARE",
      rightsAttested: true,
    };
    expect(
      (await s.owner({ ...event, expectedFingerprint: "0".repeat(64) })).code,
    ).toBe("STALE_SOURCE");
    const result = await s.owner(event);
    expect(result.ok).toBe(true);
    expect(await s.owner(event)).toEqual(result);
    expect(
      (await s.owner({ ...event, shareIntent: "DO_NOT_SHARE" })).code,
    ).toBe("ACTION_ID_CONFLICT");
    expect((await s.owner({ ...event, actionId: "choice-0002" })).code).toBe(
      "CHOICE_ALREADY_RECORDED",
    );
  });
  it("future draw revisions hide first, preserve observation time and reuse established continuity", async () => {
    const s = setup();
    const id = s.record("1", { draw: true });
    s.permission(id);
    await s.run((await s.enqueue(id)).eventId);
    const old = s.heads()[0];
    const oldInstance = s
      .table("mapContributions")
      .get(hash("contribution", lineageId(id))).boardInstanceId;
    const r = s.table("observationCandidates").get(id);
    r.publishedSubmissionVersion = 2;
    s.submission(id, 2, 8);
    const next = await s.enqueue(id, "CHANGED");
    expect(
      s.table("publicMapLeads").get(`head:${old.publicLeadId}`).lifecycleState,
    ).toBe("HIDDEN");
    await s.run(next.eventId);
    const lead = s.heads().find((x) => x.lifecycleState === "PUBLIC");
    expect(lead.board.tiers[0].remainingTickets).toBe(8);
    expect(lead.observedAt).toBe(r.observedAt);
    expect(
      s.table("mapContributions").get(hash("contribution", lineageId(id)))
        .boardInstanceId,
    ).toBe(oldInstance);
    expect((await s.process(next.eventId)).duplicate).toBe(true);
  });
  it("deletion and a late approved event cannot resurrect a record", async () => {
    const s = setup();
    const id = s.record();
    s.permission(id);
    await s.run((await s.enqueue(id)).eventId);
    const late = await s.enqueue(id, "CHANGED");
    const deletion = await s.enqueue(id, "DELETE");
    expect((await s.run(late.eventId)).status).toBe("SUPERSEDED");
    await s.run(deletion.eventId);
    expect(s.heads().filter((r) => r.lifecycleState === "PUBLIC")).toHaveLength(
      0,
    );
    await s.run((await s.enqueue(id)).eventId);
    expect(s.heads().filter((r) => r.lifecycleState === "PUBLIC")).toHaveLength(
      0,
    );
    expect(s.table("mapSourceBridgeState").get(stateId(id)).deletionLatch).toBe(
      true,
    );
  });
  it("deleting one support preserves another contributor after reconciliation", async () => {
    const s = setup();
    const a = s.record("1", { observedAge: 120000 });
    const b = s.record("2", { owner: "b", observedAge: 60000 });
    s.permission(a);
    s.permission(b);
    await s.run((await s.enqueue(a)).eventId);
    await s.run((await s.enqueue(b)).eventId);
    expect(
      s.heads().find((r) => r.lifecycleState === "PUBLIC").contributors,
    ).toHaveLength(2);
    await s.run((await s.enqueue(b, "DELETE")).eventId);
    expect(
      s.heads().find((r) => r.lifecycleState === "PUBLIC").contributors,
    ).toHaveLength(1);
  });
  it("rechecks consent at atomic admission commit and leaves no partial V2 source", async () => {
    const s = setup(),
      id = s.record();
    s.permission(id);
    const e = await s.enqueue(id);
    const transaction = s.cloud.database().runTransaction;
    let first = true;
    s.cloud.database().runTransaction = (fn) => {
      if (first) {
        first = false;
        s.table("mapContributionConsents").clear();
      }
      return transaction(fn);
    };
    expect((await s.process(e.eventId)).code).toBe("STALE_ADMISSION");
    await s.run(e.eventId);
    expect(s.heads()).toHaveLength(0);
    expect(s.table("boardObservations").size).toBe(0);
  });
  it("recovers a rolled-back crash and exposes bounded dead-letter failures with guarded replay", async () => {
    const s = setup();
    const id = s.record();
    s.permission(id);
    const e = await s.enqueue(id);
    s.injectCrashAfter(1);
    expect((await s.process(e.eventId)).ok).toBe(false);
    expect(s.table("boardObservations").size).toBe(0);
    s.clearCrash();
    s.setTime(NOW + 5000);
    await s.run(e.eventId);
    expect(s.heads().filter((r) => r.lifecycleState === "PUBLIC")).toHaveLength(
      1,
    );
    const next = await s.enqueue(id);
    for (let n = 0; n < 8; n++) {
      s.setTime(NOW + (n + 1) * 7200000);
      s.injectCrashAfter(1);
      await s.process(next.eventId);
      s.clearCrash();
    }
    expect(s.table("mapSourceOutbox").get(next.eventId).status).toBe(
      "DEAD_LETTER",
    );
    const replay = await s.process(next.eventId, "REPLAY");
    expect(replay.ok).toBe(true);
    expect((await s.process(next.eventId, "REPLAY")).eventId).toBe(
      replay.eventId,
    );
  });
  it("account deletion establishes a global barrier and bounded owner sweep without automatic release", async () => {
    const s = setup();
    const id = s.record();
    s.permission(id);
    await s.run((await s.enqueue(id)).eventId);
    const deletion = await s.db.runTransaction((tx) =>
      producer.enqueueAccountDeletion({
        tx,
        env: s.env,
        ownerAccountId: "account_a",
        nowMs: NOW,
      }),
    );
    expect(s.table("mapControlState").get("global:read-stop").stopped).toBe(
      true,
    );
    await s.process(deletion.eventId);
    await s.process(deletion.eventId);
    expect(s.table("mapSourceBridgeState").get(stateId(id)).deletionLatch).toBe(
      true,
    );
    expect(s.table("mapSourceOutbox").get(deletion.eventId).status).toBe(
      "APPLIED",
    );
    expect(s.table("mapControlState").get("global:read-stop").stopped).toBe(
      true,
    );
  });
  it("historical preview is read-only and migration skips private history per record", async () => {
    const s = setup();
    const a = s.record();
    const b = s.record("2");
    s.permission(a);
    s.table("deletionJobs");
    s.table("mapSourceBridgeState");
    const before = structuredClone(s.tables);
    const preview = await previewHistorical(
      s.db,
      [a, b],
      s.policy,
      s.bridge,
      NOW,
    );
    expect(preview.map((r) => r.decision)).toEqual([
      "ELIGIBLE_FOR_PIPELINE",
      "SKIP",
    ]);
    expect(s.tables).toEqual(before);
    expect(JSON.stringify(preview)).not.toContain(a);
    const result = await enqueueHistoricalBatch(s.db, [a, b], s.env, NOW);
    expect(result.map((r) => r.decision)).toEqual(["QUEUED", "SKIP"]);
    expect((await enqueueHistoricalBatch(s.db, [a], s.env, NOW))[0]).toEqual({
      decision: "ALREADY_QUEUED",
      eventId: result[0].eventId,
    });
    await s.run(result[0].eventId);
    expect(
      (await enqueueHistoricalBatch(s.db, [a], s.env, NOW))[0].decision,
    ).toBe("UNCHANGED");
  });
  it("public query continues to use only public projections without private source joins", async () => {
    const s = setup();
    const id = s.record();
    s.permission(id);
    await s.run((await s.enqueue(id)).eventId);
    s.accesses.length = 0;
    const fn = JSON.parse(
      (await import("node:fs")).readFileSync(
        new URL(
          "../cloudbase-production-resource-proposal.json",
          import.meta.url,
        ),
      ),
    ).functions.find((f) => f.operation === "query");
    const read = publicFactory({
      cloud: s.cloud,
      env: s.env,
      operation: "query",
      collectionAllowlist: fn.collectionAllowlist,
      now: () => NOW,
    });
    const result = await read({
      bbox: { west: 121, east: 122, south: 31, north: 32 },
      zoom: 14,
      mode: "MAP",
      opportunityStatuses: [],
      includeLowFreshness: true,
      limit: 50,
      cursor: null,
      asOf: null,
      requestId: "read-1",
      generation: 1,
      supportedSchemaVersions: ["public-map-v3"],
    });
    expect(result.ok).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(
      s.accesses.some((a) =>
        [
          "observationCandidates",
          "drawSubmissions",
          "deletionJobs",
          "profiles",
          "mapPlayerSourcePermissions",
        ].includes(a.name),
      ),
    ).toBe(false);
  });
  it("drain rejects client-forged Timer events and limits a trusted timer to twenty signed calls", async () => {
    const s = setup();
    let calls = 0;
    s.cloud.callFunction = async ({ data }) => {
      calls++;
      return { result: await s.worker(data) };
    };
    const drain = createDrain({ cloud: s.cloud, env: s.env, now: () => NOW });
    expect((await drain({ Type: "Timer", TriggerName: "bridge" })).code).toBe(
      "UNAUTHORIZED",
    );
    s.env.TRIGGER_SRC = "timer";
    expect((await drain({})).code).toBe("UNAUTHORIZED");
    s.setCaller(null);
    for (let i = 0; i < 21; i++)
      s.table("mapSourceOutbox").set(hash(String(i)), {
        eventId: hash(String(i)),
        kind: "SOURCE_EVENT",
        recordId: "missing",
        ownerAccountId: "account_a",
        revision: 1,
        status: "PENDING",
        stage: "SOURCE",
        nextAttemptAt: at(),
        createdAt: at(),
      });
    expect((await drain({})).code).toBe("UNAUTHORIZED");
    expect(
      (await drain({}, { environment: { TRIGGER_SRC: "timer" } })).processed,
    ).toBe(20);
    expect(calls).toBe(20);
  });
  it("drain stops scheduling further calls at its time budget and leaves work durable", async () => {
    const s = setup();
    const id = s.record();
    const e = await s.enqueue(id);
    let time = NOW;
    await s.enqueue(s.record("2"));
    s.cloud.callFunction = async () => {
      time += 45000;
      return { result: { ok: true } };
    };
    const drain = createDrain({ cloud: s.cloud, env: s.env, now: () => time });
    const result = await drain(
      signedRequest(
        s.env.ICHI_V2_SOURCE_BRIDGE_HMAC_KEY,
        "DRAIN",
        hash("drain"),
        NOW,
      ),
    );
    expect(result.processed).toBe(1);
    expect(result.hasMore).toBe(true);
    expect(s.table("mapSourceOutbox").get(e.eventId).status).toBe("PENDING");
  });
  it("V1 deletion hooks commit tombstone, invalidation and dirty event atomically", async () => {
    const s = setup();
    const id = s.record();
    s.permission(id);
    await s.run((await s.enqueue(id)).eventId);
    const decorate = (db) => ({
      ...db,
      collection: (name) => {
        const c = db.collection(name);
        return {
          ...c,
          doc: (key) => {
            const d = c.doc(key);
            return {
              ...d,
              update: async ({ data }) => {
                const before = await d.get();
                return d.set({ data: { ...before.data, ...data } });
              },
            };
          },
        };
      },
    });
    const old = s.cloud.database;
    s.cloud.database = () => ({
      ...decorate(old()),
      runTransaction: (fn) => old().runTransaction((tx) => fn(decorate(tx))),
    });
    const dispatch = v1.createRuntime({
      cloud: s.cloud,
      env: s.env,
      now: () => NOW,
    });
    s.injectCrashAfter(3);
    expect((await dispatch("delete-my-record", { recordId: id })).ok).toBe(
      false,
    );
    s.clearCrash();
    expect(s.table("observationCandidates").get(id).status).toBe(
      "clue_submitted",
    );
    expect(s.table("deletionJobs").size).toBe(0);
    expect(s.heads()[0].lifecycleState).toBe("PUBLIC");
    expect((await dispatch("delete-my-record", { recordId: id })).ok).toBe(
      true,
    );
    expect(s.table("observationCandidates").get(id).status).toBe("deleting");
    expect(s.heads()[0].lifecycleState).toBe("HIDDEN");
    expect(s.table("mapSourceBridgeState").get(stateId(id)).deletionLatch).toBe(
      true,
    );
  });
});
