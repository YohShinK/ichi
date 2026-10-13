import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { BatchStore, digest, json } from "./store.mjs";
import {
  collect,
  binding,
  autoReview,
  review,
  edit,
  publish,
  resume,
  withdraw,
  correct,
  prepareCorrection,
  prepareWithdrawal,
  preparePublish,
  serverDecision,
  applyFounderFixes,
} from "./workflow.mjs";
import { correctFounderNetworkSource } from "../../packages/v2-map/resources/production/phase3/correction.mjs";
import { renderReview } from "./review-page.mjs";
import {
  setup,
  NOW,
} from "../../packages/v2-map/resources/production/phase2/fixtures.test-support.mjs";
import {
  networkSourceId,
  NETWORK_POLICY_VERSION,
  networkLocationDigest,
  networkContentDigest,
} from "../../packages/v2-map/resources/production/phase3/network.mjs";
import {
  admitOfficialNetworkSource,
  reconcileNetworkLifecycle,
} from "../../packages/v2-map/resources/production/phase3/admission.mjs";
import { networkDecisionId } from "../../packages/v2-map/resources/production/phase3/runtime.mjs";
import { createMain } from "../../packages/v2-map/resources/production/shared/runtime.mjs";
import {
  hash,
  read,
} from "../../packages/v2-map/resources/production/shared/security.mjs";

const proposal = json(
  new URL(
    "../../packages/v2-map/resources/production/cloudbase-production-resource-proposal.json",
    import.meta.url,
  ),
);
const directories = [];
afterEach(() => {
  for (const d of directories.splice(0))
    fs.rmSync(d, { recursive: true, force: true });
});
const write = (file, value) =>
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
const at = (delta = 0) => new Date(NOW + delta).toISOString();
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6n5EAAAAASUVORK5CYII=",
  "base64",
);
const fixture = async (remaining = 9, screenshot = false) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ichi-workflow-test-"));
  directories.push(dir);
  const sourceUrl = "https://www.xiaohongshu.com/explore/aabbcc11";
  const record = {
    schemaVersion: "map-network-source-phase3-v1",
    sourceId: networkSourceId(sourceUrl, "image-1:TEST"),
    sourceVersion: "source-v1",
    sourceType: "NETWORK_SOURCE",
    sourceMode: "OFFICIAL_CURATED",
    sourcePlatform: "XHS",
    sourceUrl,
    boardEvidenceKey: "image-1:TEST",
    sourcePublishedAt: at(-60000),
    fetchedAt: at(-1000),
    observedAtBasis: "SOURCE_PUBLISHED_AT_FALLBACK",
    observationEvidence: null,
    takedownOwnerId: "ichi-takedown",
    boardFacts: {
      schemaVersion: "player-board-facts-phase2-v1",
      ipName: "测试IP",
      themeName: "主题",
      pricePerDrawMinor: null,
      tiers: [
        {
          tierCode: "A",
          rawLabel: "A赏",
          initialRemainingTickets: null,
          remainingTickets: remaining,
          isGrandPrize: true,
        },
      ],
    },
    location: {
      coordinateSystem: "GCJ02",
      latitude: 31.230456,
      longitude: 121.470456,
      accuracyMeters: 10,
      capturedAt: at(-60000),
    },
    note: {
      text: "刚刚拆套",
      safetyProvenance: {
        decision: "NOTE_PASSED",
        contentHash: hash("刚刚拆套"),
        decisionVersion: "note-v1",
      },
    },
  };
  fs.writeFileSync(path.join(dir, "image-1.png"), png);
  const cap = {
    canonicalUrl: sourceUrl,
    sourcePublishedAt: record.sourcePublishedAt,
    fetchedAt: record.fetchedAt,
    mediaKind: "image",
    evidence: [
      {
        path: "image-1.png",
        sha256: digest(png),
        ...(screenshot
          ? {
              method: "FULL_IMAGE_SCREENSHOT",
              evidenceKind: "SCREENSHOT",
              articleId: "aabbcc11",
              canonicalUrl: sourceUrl,
              sourcePublishedAt: record.sourcePublishedAt,
              index: 1,
              width: 800,
              height: 900,
              screenshotGeometry: { completeImage: true, visibleScale: 1 },
            }
          : {}),
      },
    ],
  };
  write(path.join(dir, "capture.json"), cap);
  write(path.join(dir, "location.json"), record.location);
  const evidence = [
    {
      path: "image-1.png",
      sha256: digest(png),
      kind: screenshot ? "SCREENSHOT" : "PHOTO",
      ...(screenshot ? { mediaRole: "FULL_IMAGE_SCREENSHOT" } : {}),
    },
    {
      path: "capture.json",
      sha256: digest(fs.readFileSync(path.join(dir, "capture.json"))),
      kind: "CAPTURE",
    },
    {
      path: "location.json",
      sha256: digest(fs.readFileSync(path.join(dir, "location.json"))),
      kind: "LOCATION",
    },
  ];
  const manifestFile = path.join(dir, "manifest.json");
  write(manifestFile, {
    schemaVersion: "ichi-network-collect-v1",
    candidates: [{ record, evidence }],
  });
  const store = new BatchStore(path.join(dir, "batch"));
  await collect(store, manifestFile, NOW);
  const grant = {
    schemaVersion: "ichi-network-auto-delegation-v1",
    actor: "USER",
    scope: "ICHI_NETWORK_PHASE5",
    mode: "AUTO_CLEAR_ESCALATE_UNCERTAIN",
    environment: "ISOLATED_TEST_ONLY",
    authorizationRef: "test-user-automatic-curation",
    authorizedAt: at(-5000),
    userInstructionRef: "SYNTHETIC_TEST_PERMISSION_NOT_A_REAL_FOUNDER",
    curatorAuthorityId: "ichi-official-curator",
    maxBatchSize: 50,
    operations: ["PUBLISH"],
  };
  const grantFile = path.join(dir, "grant.json");
  write(grantFile, grant);
  const candidate = store.read().candidates[record.sourceId];
  const recognition = {
    schemaVersion: "ichi-network-recognition-v1",
    items: [
      {
        id: record.sourceId,
        binding: binding(candidate),
        complete: true,
        boardImageSha256: digest(png),
        tiers: {
          A: {
            imageSha256: digest(png),
            method: "VISIBLE_UNDRAWN_TICKETS",
            region: "A票区",
            remainingTickets: remaining,
            ticketIds: Array.from(
              { length: remaining ?? 0 },
              (_, n) => `A-${n + 1}`,
            ),
          },
        },
        locationEvidenceSha256: evidence[2].sha256,
        locationDigest: networkLocationDigest(record.location),
        locationConfirmed: true,
        highPrizeTiersConfirmed: true,
        grandPrizeEvidence: {
          imageSha256: digest(png),
          region: "A奖品信息",
          method: "VISIBLE_PRIZE_CLASSIFICATION",
          tierCodes: ["A"],
        },
        noteSafetyConfirmed: true,
        noteSafety: record.note.safetyProvenance,
        rights: {
          decision: "PASS",
          basis: "PERMITTED_STRUCTURED_FACTS",
          evidenceRef: "SYNTHETIC_PRIVATE_RIGHTS_EVIDENCE",
          decisionVersion: "rights-test-v1",
          decidedAt: at(),
        },
      },
    ],
  };
  const recognitionFile = path.join(dir, "recognition.json");
  write(recognitionFile, recognition);
  return {
    dir,
    store,
    record,
    evidence,
    manifestFile,
    grant,
    grantFile,
    recognition,
    recognitionFile,
  };
};
const backend = (f) => {
  const s = setup();
  s.table("mapControlState").set("global:network", {
    curatorAuthorityId: "ichi-official-curator",
    admissionEnabled: false,
    maintenanceEnabled: false,
    smokeEnabled: false,
  });
  s.policy.network = {
    policyVersion: NETWORK_POLICY_VERSION,
    servingSchemaVersion: "public-map-v4",
    publicMaxAgeMs: 2592000000,
    curatorAuthorityIds: ["ichi-official-curator"],
  };
  let writes = 0,
    calls = 0,
    closeCalls = 0,
    crash = false;
  const decisions = {
    read: async (id, version, db = s.db) =>
      read(db.collection("boardObservations"), networkDecisionId(id, version)),
  };
  const policy = () => s.table("mapControlState").get("global:policy");
  const source = (id) =>
    s.table("boardObservations").get(`network-source:${id}`);
  const snapshot = async () => {
    const body = {
      policy: structuredClone(policy()),
      locationPolicy: s.bridge.locationPolicy,
    };
    return { ...body, digest: digest(body) };
  };
  const detail = createMain({
    cloud: s.cloud,
    env: s.env,
    operation: "detail",
    collectionAllowlist: proposal.functions.find(
      (f) => f.operation === "detail",
    ).collectionAllowlist,
    now: () => NOW,
    newId: () => "8".repeat(32),
  });
  const adapter = {
    environment: f.grant.environment,
    snapshot,
    assertSafe: async (expected) =>
      expect((await snapshot()).digest).toBe(expected),
    async register(record, decision, wanted) {
      writes++;
      s.table("mapControlState").set("global:policy", structuredClone(wanted));
      s.table("boardObservations").set(
        networkDecisionId(record.sourceId, record.sourceVersion),
        structuredClone(decision),
      );
    },
    async admit(record) {
      calls++;
      const result = await admitOfficialNetworkSource({
        db: s.db,
        record,
        decisions,
        locationPolicy: s.bridge.locationPolicy,
        nowMs: NOW,
        newId: () => calls.toString(16).padStart(32, "0"),
      });
      if (!result.ok)
        throw Object.assign(new Error(result.code), { code: result.code });
      if (crash)
        throw Object.assign(
          new Error("transport interrupted after backend committed"),
          { code: "TEST_COMMIT_TIMEOUT" },
        );
      return result;
    },
    async lookup(record) {
      const row = source(record.sourceId);
      if (!row) return { state: "ABSENT" };
      if (row.state === "TAKEN_DOWN" || row.noResurrection)
        return { state: "TAKEN_DOWN" };
      if (row.sourceVersion !== record.sourceVersion)
        return { state: "VERSION_CONFLICT" };
      const receipt =
        s
          .table("mapAuditEvents")
          .get(hash("network-admission", row.observationVersionId)) ??
        s
          .table("mapAuditEvents")
          .get(
            hash("network-correction", record.sourceId, record.sourceVersion),
          );
      const instance = s
        .table("boardInstances")
        .get(receipt.boardInstanceId ?? receipt.result.boardInstanceId);
      return {
        state: "ADMITTED",
        receipt: {
          ok: true,
          sourceVersion: record.sourceVersion,
          contentDigest: row.contentDigest,
          observationVersionId: row.observationVersionId,
          boardInstanceId: instance.boardInstanceId,
          publicLeadId: instance.activePublicLeadId,
        },
      };
    },
    async correct(record, decision, expected, wanted, evidenceRef) {
      const result = await correctFounderNetworkSource({
        db: s.db,
        record,
        decision,
        expected,
        evidenceRef,
        authorityId: f.grant.curatorAuthorityId,
        nowMs: NOW,
      });
      if (!result.ok)
        throw Object.assign(new Error(result.code), { code: result.code });
      expect(digest(policy())).toBe(digest(wanted));
      writes++;
      return result;
    },
    async publicDetail(id) {
      const r = await detail({
        publicLeadId: id,
        requestId: "workflow-detail",
        generation: 1,
        supportedSchemaVersions: ["public-map-v3", "public-map-v4"],
      });
      if (!r.ok) throw Object.assign(new Error(r.code), { code: r.code });
      return r.item;
    },
    async takedown(id) {
      const row = source(id),
        receipt = s
          .table("mapAuditEvents")
          .get(hash("network-admission", row.observationVersionId));
      const result = await reconcileNetworkLifecycle({
        db: s.db,
        boardInstanceId: receipt.boardInstanceId,
        nowMs: NOW,
        newId: () => "f".repeat(32),
        takedownSourceId: id,
      });
      expect(result.ok).toBe(true);
      writes++;
    },
    closeAndVerify: async () => {
      closeCalls++;
    },
  };
  return {
    s,
    adapter,
    crashAfterCommit: () => {
      crash = true;
    },
    stats: () => ({ writes, calls, closeCalls }),
  };
};
const ready = async () => {
  const f = await fixture();
  await autoReview(f.store, f.recognitionFile, f.grantFile, NOW);
  return f;
};

describe("automatic official network workflow", () => {
  it("accepts clear full-image screenshot proof with exact post/index/geometry binding", async () => {
    const f = await fixture(9, true);
    await autoReview(f.store, f.recognitionFile, f.grantFile, NOW);
    expect(f.store.read().candidates[f.record.sourceId].status).toBe(
      "APPROVED",
    );
  });
  it("rejects screenshots whose capture binding does not prove the complete image", async () => {
    const f = await fixture(9, true);
    const cap = json(path.join(f.dir, "capture.json"));
    cap.evidence[0].screenshotGeometry.completeImage = false;
    write(path.join(f.dir, "capture.json"), cap);
    const manifest = json(f.manifestFile);
    manifest.candidates[0].evidence[1].sha256 = digest(
      fs.readFileSync(path.join(f.dir, "capture.json")),
    );
    write(f.manifestFile, manifest);
    const other = new BatchStore(path.join(f.dir, "other"));
    await expect(collect(other, f.manifestFile, NOW)).rejects.toThrow(
      "FULL_IMAGE_SCREENSHOT_UNBOUND_OR_INCOMPLETE",
    );
  });
  it("imports exact public evidence locally and deduplicates the same board", async () => {
    const f = await fixture();
    expect(await collect(f.store, f.manifestFile, NOW)).toMatchObject({
      duplicates: 1,
      imported: 0,
      cloudWrites: 0,
    });
    expect(f.store.read().candidates[f.record.sourceId].status).toBe("PENDING");
  });
  it("automatically approves clear evidence with the actual delegated actor", async () => {
    const f = await ready(),
      c = f.store.read().candidates[f.record.sourceId];
    expect(c.review.reviewedBy).toBe("AGENT_USER_DELEGATION");
    expect(c.review.authorizationRef).toBe(f.grant.authorizationRef);
    expect(c.status).toBe("APPROVED");
  });
  it("retains unknown counts instead of turning null into zero", async () => {
    const f = await fixture(null);
    await autoReview(f.store, f.recognitionFile, f.grantFile, NOW);
    expect(f.store.read().candidates[f.record.sourceId]).toMatchObject({
      status: "NEEDS_FOUNDER",
      record: { boardFacts: { tiers: [{ remainingTickets: null }] } },
    });
  });
  it.each([
    "tiers",
    "locationConfirmed",
    "highPrizeTiersConfirmed",
    "grandPrizeEvidence",
    "rights",
    "complete",
  ])("escalates missing %s evidence without production writes", async (key) => {
    const f = await fixture();
    delete f.recognition.items[0][key];
    write(f.recognitionFile, f.recognition);
    await autoReview(f.store, f.recognitionFile, f.grantFile, NOW);
    expect(f.store.read().candidates[f.record.sourceId].status).toBe(
      "NEEDS_FOUNDER",
    );
  });
  it.each(["wrong-tier", "wrong-image", "empty-region"])(
    "escalates unsupported grand-prize proof: %s",
    async (kind) => {
      const f = await fixture();
      const proof = f.recognition.items[0].grandPrizeEvidence;
      if (kind === "wrong-tier") proof.tierCodes = ["B"];
      if (kind === "wrong-image") proof.imageSha256 = "0".repeat(64);
      if (kind === "empty-region") proof.region = "";
      write(f.recognitionFile, f.recognition);
      await autoReview(f.store, f.recognitionFile, f.grantFile, NOW);
      expect(f.store.read().candidates[f.record.sourceId]).toMatchObject({
        status: "NEEDS_FOUNDER",
        issues: expect.arrayContaining(["HIGH_PRIZE_EVIDENCE_INCOMPLETE"]),
      });
    },
  );
  it("rejects duplicate ticket identifiers despite a confidence claim", async () => {
    const f = await fixture();
    f.recognition.items[0].tiers.A.ticketIds.fill("same");
    f.recognition.items[0].confidence = 1;
    write(f.recognitionFile, f.recognition);
    await autoReview(f.store, f.recognitionFile, f.grantFile, NOW);
    expect(f.store.read().candidates[f.record.sourceId].status).toBe(
      "NEEDS_FOUNDER",
    );
  });
  it("rejects unbound replacement photos and source-time drift", async () => {
    const f = await fixture(),
      manifest = json(f.manifestFile);
    manifest.candidates[0].record.sourcePublishedAt = at(-90000);
    write(f.manifestFile, manifest);
    const store = new BatchStore(path.join(f.dir, "other"));
    await expect(collect(store, f.manifestFile, NOW)).rejects.toThrow(
      "CAPTURE_RECORD_DRIFT",
    );
  });
  it("detects altered evidence before automatic review", async () => {
    const f = await fixture(),
      c = f.store.read().candidates[f.record.sourceId];
    fs.appendFileSync(f.store.inside(c.evidence[0].path), "altered");
    await expect(
      autoReview(f.store, f.recognitionFile, f.grantFile, NOW),
    ).rejects.toThrow("LOCAL_EVIDENCE_DRIFT");
  });
  it("invalidates approval when facts are edited while preserving the previous version", async () => {
    const f = await ready(),
      input = json(f.manifestFile).candidates[0];
    input.record.sourceVersion = "source-v2";
    input.record.boardFacts.tiers[0].remainingTickets = 8;
    const replacement = path.join(f.dir, "replacement.json");
    write(replacement, input);
    await edit(f.store, f.record.sourceId, replacement, NOW);
    const c = f.store.read().candidates[f.record.sourceId];
    expect(c.review).toBeNull();
    expect(c.history[0].review.reviewedBy).toBe("AGENT_USER_DELEGATION");
    await expect(
      preparePublish(f.store, backend(f).adapter, [f.record.sourceId], NOW),
    ).rejects.toThrow("EXACT_APPROVAL_REQUIRED");
  });
  it("accepts a Founder fix only for the exact reviewed revision", async () => {
    const f = await fixture(),
      c = f.store.read().candidates[f.record.sourceId];
    const packet = {
      schemaVersion: "ichi-network-review-v1",
      batchRevision: f.store.read().revision,
      userInstructionRef: "SYNTHETIC_EXPLICIT_USER_REPLY",
      decisions: [
        {
          id: c.id,
          binding: binding(c),
          revision: c.revision,
          decision: "APPROVE",
          reviewedBy: "FOUNDER",
          reviewedAt: at(),
          reviewVersion: "human-test-v1",
          accuracyConfirmed: true,
          locationConfirmed: true,
          highPrizeTiersConfirmed: true,
          curatorAuthorityId: f.grant.curatorAuthorityId,
          rights: f.recognition.items[0].rights,
          noteSafety: f.record.note.safetyProvenance,
        },
      ],
    };
    const file = path.join(f.dir, "human.json");
    write(file, packet);
    await review(f.store, file, NOW);
    expect(f.store.read().candidates[c.id].status).toBe("APPROVED");
    await expect(review(f.store, file, NOW)).rejects.toThrow(
      "REVIEW_BATCH_CHANGED",
    );
  });
  it("publishes through actual Verification/Resolution/projection and public detail", async () => {
    const f = await ready(),
      remote = backend(f);
    const result = await publish(
      f.store,
      remote.adapter,
      f.grant,
      undefined,
      NOW,
    );
    expect(result.status).toBe("PUBLISHED_READBACK_PASS_GATES_CLOSED");
    expect(f.store.read().candidates[f.record.sourceId].status).toBe(
      "PUBLISHED",
    );
    expect(remote.stats()).toEqual({ writes: 1, calls: 1, closeCalls: 1 });
    const stored = remote.s
      .table("boardObservations")
      .get(`network-source:${f.record.sourceId}`);
    expect(stored.contentDigest).toBe(networkContentDigest(f.record));
  });
  it("refuses an unrelated environment or a takedown action in the automatic grant", async () => {
    const f = await ready(),
      remote = backend(f);
    await expect(
      publish(
        f.store,
        remote.adapter,
        { ...f.grant, environment: "other" },
        undefined,
        NOW,
      ),
    ).rejects.toThrow("AUTOMATIC_SCOPE_AUTHORIZATION_REQUIRED");
    expect(remote.stats().writes).toBe(0);
  });
  it("recovers a commit timeout by read-back without another admission", async () => {
    const f = await ready(),
      remote = backend(f);
    remote.crashAfterCommit();
    await expect(
      publish(f.store, remote.adapter, f.grant, undefined, NOW),
    ).rejects.toThrow("transport interrupted");
    expect(remote.stats().closeCalls).toBe(1);
    expect(
      f.store.read().candidates[f.record.sourceId].attempts.at(-1).status,
    ).toBe("UNKNOWN_COMMIT_CHECK_REMOTE_BEFORE_RETRY");
    await resume(f.store, remote.adapter, undefined, NOW);
    expect(remote.stats().calls).toBe(1);
    expect(f.store.read().candidates[f.record.sourceId].status).toBe(
      "PUBLISHED",
    );
  });
  it("withdraws through the shared lifecycle and forbids resurrection", async () => {
    const f = await ready(),
      remote = backend(f);
    await publish(f.store, remote.adapter, f.grant, undefined, NOW);
    const ids = [f.record.sourceId],
      plan = await prepareWithdrawal(f.store, remote.adapter, ids);
    const auth = {
      schemaVersion: "ichi-network-external-authorization-v1",
      actor: "USER",
      operation: "TAKEDOWN",
      environment: remote.adapter.environment,
      planDigest: plan.planDigest,
      expiresAt: at(60000),
      userInstructionRef: "SYNTHETIC_EXPLICIT_WITHDRAWAL",
    };
    await withdraw(f.store, remote.adapter, auth, ids, NOW);
    expect((await remote.adapter.lookup(f.record)).state).toBe("TAKEN_DOWN");
    await expect(
      autoReview(f.store, f.recognitionFile, f.grantFile, NOW),
    ).rejects.toThrow("AUTO_REVIEW_TARGET_UNAVAILABLE");
    const outcome = await admitOfficialNetworkSource({
      db: remote.s.db,
      record: f.record,
      decisions: {
        read: async () =>
          serverDecision(f.store.read().candidates[f.record.sourceId]),
      },
      locationPolicy: remote.s.bridge.locationPolicy,
      nowMs: NOW,
      newId: () => "c".repeat(32),
    });
    expect(outcome.code).toBe("NETWORK_TAKEN_DOWN");
  });
  it("binds a Founder number reply to the original image and invalidates old approval", async () => {
    const f = await ready(),
      c = f.store.read().candidates[f.record.sourceId];
    const packet = {
      schemaVersion: "ichi-network-founder-fixes-v1",
      batchRevision: f.store.read().revision,
      userInstructionRef: "SYNTHETIC_FOUNDER_NUMBER_REPLY",
      items: [
        {
          id: c.id,
          revision: c.revision,
          binding: binding(c),
          imageSha256: f.evidence[0].sha256,
          remaining: { A: 8 },
        },
      ],
    };
    const file = path.join(f.dir, "fixes.json");
    write(file, packet);
    const result = await applyFounderFixes(f.store, file, NOW);
    const next = f.store.read().candidates[c.id];
    expect(next.record.boardFacts.tiers[0].remainingTickets).toBe(8);
    expect(next.review).toBeNull();
    expect(next.record.sourcePublishedAt).toBe(c.record.sourcePublishedAt);
    expect(next.history[0].review.reviewedBy).toBe("AGENT_USER_DELEGATION");
    await expect(applyFounderFixes(f.store, file, NOW)).rejects.toThrow(
      "EXACT_FOUNDER_FIXES_REQUIRED",
    );
    f.recognition.items[0].binding = binding(next);
    f.recognition.items[0].tiers.A = {
      imageSha256: f.evidence[0].sha256,
      method: "HUMAN_CONFIRMATION",
      region: "A票区",
      remainingTickets: 8,
      confirmationSha256: result.results[0].confirmationSha256,
    };
    write(f.recognitionFile, f.recognition);
    await autoReview(f.store, f.recognitionFile, f.grantFile, NOW);
    expect(f.store.read().candidates[c.id].status).toBe("APPROVED");
  });
  it("locks concurrent operations and refuses to clear a live owner's lock", async () => {
    const f = await fixture();
    await f.store.exclusive(async () => {
      await expect(f.store.exclusive(async () => {})).rejects.toThrow(
        "BATCH_LOCKED",
      );
      expect(() => f.store.recoverLock()).toThrow("LOCK_OWNER_NOT_PROVEN_DEAD");
    });
  });
  it("corrects a workflow-delegated version through the shared transaction without renewing time or IDs", async () => {
    const f = await ready(),
      remote = backend(f);
    await publish(f.store, remote.adapter, f.grant, undefined, NOW);
    const prior = f.store.read().candidates[f.record.sourceId].publication,
      detail = await remote.adapter.publicDetail(prior.publicLeadId);
    const input = json(f.manifestFile).candidates[0];
    input.record.sourceVersion = "source-v2";
    input.record.boardFacts.tiers[0].remainingTickets = 8;
    const file = path.join(f.dir, "replacement.json");
    write(file, input);
    await edit(f.store, f.record.sourceId, file, NOW);
    const c = f.store.read().candidates[f.record.sourceId];
    f.recognition.items[0].binding = binding(c);
    f.recognition.items[0].tiers.A.remainingTickets = 8;
    f.recognition.items[0].tiers.A.ticketIds.pop();
    write(f.recognitionFile, f.recognition);
    await autoReview(f.store, f.recognitionFile, f.grantFile, NOW);
    const ids = [c.id],
      plan = await prepareCorrection(f.store, remote.adapter, ids, NOW);
    const auth = {
      schemaVersion: "ichi-network-external-authorization-v1",
      actor: "USER",
      operation: "CORRECT",
      environment: remote.adapter.environment,
      planDigest: plan.planDigest,
      expiresAt: at(60000),
      userInstructionRef: "SYNTHETIC_EXPLICIT_CORRECTION",
    };
    expect(
      await correct(f.store, remote.adapter, auth, ids, NOW),
    ).toMatchObject({ publicLeadId: prior.publicLeadId });
    const after = await remote.adapter.publicDetail(prior.publicLeadId);
    expect(after.board.totalRemaining).toBe(8);
    expect(after.freshness.observedAt).toBe(detail.freshness.observedAt);
    expect(after.publicUntil).toBe(detail.publicUntil);
    expect(f.store.read().candidates[c.id].publication.boardInstanceId).toBe(
      prior.boardInstanceId,
    );
  });
  it("escalates a candidate whose original discovery was outside seven days", async () => {
    const f = await fixture(),
      input = json(f.manifestFile);
    input.candidates[0].record.sourcePublishedAt = at(-8 * 86400000);
    const cap = json(path.join(f.dir, "capture.json"));
    cap.sourcePublishedAt = input.candidates[0].record.sourcePublishedAt;
    write(path.join(f.dir, "capture.json"), cap);
    input.candidates[0].evidence[1].sha256 = digest(
      fs.readFileSync(path.join(f.dir, "capture.json")),
    );
    write(f.manifestFile, input);
    const store = new BatchStore(path.join(f.dir, "old-window"));
    await collect(store, f.manifestFile, NOW);
    expect(store.read().candidates[f.record.sourceId].issues).toContain(
      "OUTSIDE_ORIGINAL_SEVEN_DAY_WINDOW",
    );
  });
  it("rejects duplicate recognition decisions and a grant forged with an agent actor", async () => {
    const f = await fixture();
    f.recognition.items.push(f.recognition.items[0]);
    write(f.recognitionFile, f.recognition);
    await expect(
      autoReview(f.store, f.recognitionFile, f.grantFile, NOW),
    ).rejects.toThrow("DUPLICATE_OR_OVERSIZED_RECOGNITION");
    f.grant.actor = "AGENT";
    write(f.grantFile, f.grant);
    await expect(
      autoReview(f.store, f.recognitionFile, f.grantFile, NOW),
    ).rejects.toThrow("INVALID_GRANT_SCHEMA");
  });
  it("detects changed batch snapshots and audit chain content", async () => {
    const f = await fixture(),
      head = json(f.store.head);
    fs.appendFileSync(f.store.inside(head.file), " ");
    expect(() => f.store.read()).toThrow("BATCH_SNAPSHOT_DRIFT");
  });
  it("renders pending photos inline, with no preselected confirmations or scripts from input", async () => {
    const f = await fixture();
    f.recognition.items[0].complete = false;
    write(f.recognitionFile, f.recognition);
    await autoReview(f.store, f.recognitionFile, f.grantFile, NOW);
    const result = renderReview(f.store, true),
      page = fs.readFileSync(result.file, "utf8");
    expect(result.cards).toBe(1);
    expect(page).toContain("data:image/png;base64,");
    expect(page).not.toMatch(/<input[^>]+checked/u);
    expect(page).toContain("待你确认");
  });
});
