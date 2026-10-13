import fs from "node:fs";
import { createHmac } from "node:crypto";
import producer from "../../../../../services/cloudbase/shared/source-bridge-producer.js";
import { localDatabase } from "../tests/db.test-support.mjs";
import { hash } from "../shared/security.mjs";
import { bridgeDatabase, signedRequest } from "./security.mjs";
import { lineageId } from "./source.mjs";
import { createWorker, createOwnerEntry } from "./runtime.mjs";
const proposal = JSON.parse(
  fs.readFileSync(
    new URL("../cloudbase-production-resource-proposal.json", import.meta.url),
  ),
);
export const NOW = Date.parse("2026-10-03T08:00:00Z");
const at = (n = 0) => new Date(NOW + n).toISOString();
export const setup = () => {
  const store = localDatabase(proposal.collections);
  store.table("profiles");
  let time = NOW,
    current = "a",
    serial = 0;
  const env = {
    ICHI_V2_FUNCTION_ENABLED: "true",
    ICHI_V2_BACKEND_MODE: "production",
    ICHI_V2_BRIDGE_PRODUCER_ENABLED: "true",
    IDENTITY_HMAC_KEY: "i".repeat(48),
    ICHI_V2_ACCOUNT_AUTHORITY_HMAC_KEY: "a".repeat(48),
    ICHI_V2_CURSOR_HMAC_KEY: "c".repeat(48),
    ICHI_V2_SOURCE_BRIDGE_HMAC_KEY: "b".repeat(48),
  };
  for (const { _id, ...row } of structuredClone(proposal.initialControlRows))
    store.table("mapControlState").set(_id, row);
  store.table("mapControlState").get("global:read-stop").stopped = false;
  const features = store.table("mapControlState").get("global:features");
  Object.keys(features)
    .filter((k) => k.endsWith("Enabled"))
    .forEach((k) => {
      features[k] = true;
    });
  const policy = store.table("mapControlState").get("global:policy");
  policy.terms = { version: "fixture-terms-v1", scopeDigest: "d".repeat(64) };
  const bridge = {
    contract: "source-bridge-phase2-v1",
    producerEnabled: true,
    processorEnabled: true,
    ownerEntryEnabled: true,
    locationPolicy: {
      version: "fixture-location-v1",
      ruleId: "fixture-grid",
      precisionMode: "APPROXIMATE",
      gridDegrees: 0.001,
      maxAccuracyMeters: 100,
    },
  };
  store.table("mapSourceBridgeControl").set("global:bridge", bridge);
  for (const owner of ["a", "b"]) {
    store.table("accounts").set(`account_${owner}`, { status: "active" });
    const identity = createHmac("sha256", env.IDENTITY_HMAC_KEY)
      .update(`wx:${owner}`)
      .digest("hex");
    store
      .table("wechatIdentities")
      .set(identity, { accountId: `account_${owner}` });
    store
      .table("mapContributionConsents")
      .set(hash("consent", `account_${owner}`, policy.terms.version), {
        ownerAccountId: `account_${owner}`,
        termsVersion: policy.terms.version,
        scopeDigest: policy.terms.scopeDigest,
        accepted: true,
      });
  }
  const cloud = {
    init: () => {},
    database: () => store.db,
    getWXContext: () => ({ APPID: "wx", OPENID: current }),
  };
  const db = bridgeDatabase(store.db);
  const snapshot = (remaining = 9) => ({
    schemaVersion: "board-record-r2-1.0.0",
    recognitionVersion: "R2",
    ipName: "IP",
    themeName: "主题",
    pricePerDraw: 8,
    currency: "CNY",
    tiers: [
      {
        tierCode: "A",
        rawLabel: "A赏",
        remainingTickets: remaining,
        isGrandPrize: true,
      },
    ],
  });
  const record = (
    suffix = "1",
    {
      owner = "a",
      draw = false,
      observedAge = 60000,
      longitude = 121.470456,
    } = {},
  ) => {
    const id = `record_${suffix.repeat(32)}`;
    const row = {
      recordId: id,
      ownerAccountId: `account_${owner}`,
      boardId: `board_${suffix}`,
      sourcePath: draw ? "assisted-draw" : "direct-upload",
      status: draw ? "uploaded" : "clue_submitted",
      observedAt: at(-observedAge),
      serverReceivedAt: at(-observedAge + 1000),
      location: {
        coordinateSystem: "gcj02",
        latitude: 31.230456,
        longitude,
        accuracy: 10,
        capturedAt: at(-observedAge),
        source: "camera",
        consentVersion: "private-location-v1",
      },
      recognitionJobId: `job-${suffix}`,
      correctionSummary: { changed: false },
      finalSnapshot: draw ? null : snapshot(),
      initialSnapshot: snapshot(draw ? 20 : 9),
      ...(draw
        ? {
            publicationState: "current",
            publishedSubmissionVersion: 1,
            verificationStatus: "APPROVED",
          }
        : {}),
    };
    store.table("observationCandidates").set(id, row);
    if (draw) submission(id, 1, 9);
    return id;
  };
  const submission = (id, version, remaining) => {
    const r = store.table("observationCandidates").get(id);
    const verificationId = `prize-ticket:${id}:${r.boardId}:${version}`;
    const d = {
      verificationId,
      recordId: id,
      boardId: r.boardId,
      ownerAccountId: r.ownerAccountId,
      submissionVersion: version,
      status: "APPROVED",
      approvedAt: at(-1000),
      finalSnapshot: snapshot(remaining),
      authoritativeDrawEvents: Array.from(
        { length: 20 - remaining },
        (_, i) => ({ eventId: `event-${i}`, tierCode: "A" }),
      ),
      photoReview: { status: "PHOTO_PASSED" },
      locationReview: { status: "LOCATION_PASSED" },
      userNote: "安全备注",
      userNoteHash: hash("安全备注"),
      noteReview: { status: "NOTE_PASSED", reviewedAt: at(-2000) },
      imageFileId: "cloud://private-ticket",
      providerDiagnostics: { requestId: "private-request" },
    };
    store.table("drawSubmissions").set(verificationId, d);
    return d;
  };
  const permission = (id, extra = {}) => {
    const r = store.table("observationCandidates").get(id);
    store.table("mapPlayerSourcePermissions").set(lineageId(id), {
      recordId: id,
      lineageId: lineageId(id),
      ownerAccountId: r.ownerAccountId,
      shareIntent: "SHARE",
      followCurrentVersion: true,
      rightsAttested: true,
      termsVersion: policy.terms.version,
      scopeDigest: policy.terms.scopeDigest,
      ...extra,
    });
  };
  const enqueue = (id, reason = "PUBLISHED") =>
    store.db.runTransaction((tx) =>
      producer.enqueueSourceChange({
        tx,
        env,
        recordId: id,
        ownerAccountId:
          store.table("observationCandidates").get(id)?.ownerAccountId ??
          "account_a",
        reason,
        nowMs: time,
      }),
    );
  const worker = createWorker({
    cloud,
    env,
    now: () => time,
    newId: () => (++serial).toString(16).padStart(32, "0"),
  });
  const process = (id, op = "PROCESS") =>
    worker(signedRequest(env.ICHI_V2_SOURCE_BRIDGE_HMAC_KEY, op, id, time));
  const run = async (eventId) => {
    for (let i = 0; i < 6; i++) {
      const row = store.table("mapSourceOutbox").get(eventId);
      if (row.status !== "PENDING") return row;
      const r = await process(eventId);
      if (!r.ok) throw new Error(JSON.stringify(r));
    }
    throw new Error("did not converge");
  };
  const heads = () =>
    [...store.table("publicMapLeads").values()].filter(
      (r) => r.kind === "HEAD",
    );
  return {
    ...store,
    db,
    env,
    cloud,
    policy,
    bridge,
    record,
    submission,
    permission,
    enqueue,
    worker,
    process,
    run,
    heads,
    setTime: (n) => {
      time = n;
    },
    setCaller: (id) => {
      current = id;
    },
    owner: createOwnerEntry({ cloud, env, now: () => time }),
  };
};
