import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { localDatabase } from "../packages/v2-map/resources/production/tests/db.test-support.mjs";

const root = process.cwd();
const output = path.join(root, "artifacts/task22/phase3-network-20261006");
const sha = (v) => createHash("sha256").update(v).digest("hex");
const baseline = JSON.parse(
  fs.readFileSync(path.join(output, "preserved-artifacts-before.json")),
);
for (const [file, digest] of Object.entries(baseline))
  assert.equal(
    sha(fs.readFileSync(path.join(root, file))),
    digest,
    `PRESERVED_BASELINE_DRIFT:${file}`,
  );
const manifest = JSON.parse(
  fs.readFileSync(path.join(output, "artifact-manifest.json")),
);
assert.equal(manifest.externalWrites, 0);
assert.equal(manifest.cloudDeployEntry, null);
const zip = path.join(root, manifest.artifact);
assert.equal(sha(fs.readFileSync(zip)), manifest.sha256);
for (const [file, digest] of Object.entries(manifest.sources))
  assert.equal(
    sha(fs.readFileSync(path.join(root, file))),
    digest,
    `CURRENT_SOURCE_DRIFT:${file}`,
  );
const unpack = path.join(output, "validation-runtime");
fs.rmSync(unpack, { recursive: true, force: true });
fs.mkdirSync(unpack, { recursive: true });
const result = spawnSync("unzip", ["-q", zip, "-d", unpack], {
  encoding: "utf8",
});
assert.equal(result.status, 0, result.stderr);
for (const file of manifest.packagedFiles)
  assert.equal(sha(fs.readFileSync(path.join(unpack, file.path))), file.sha256);
const load = (relative) =>
  import(pathToFileURL(path.join(unpack, relative)).href);
const [network, admission, runtime] = await Promise.all([
  load("phase3/network.mjs"),
  load("phase3/admission.mjs"),
  load("shared/runtime.mjs"),
]);
const proposal = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      "packages/v2-map/resources/production/cloudbase-production-resource-proposal.json",
    ),
  ),
);
const store = localDatabase(proposal.collections);
for (const { _id, ...row } of structuredClone(proposal.initialControlRows))
  store.table("mapControlState").set(_id, row);
store.table("mapControlState").get("global:read-stop").stopped = false;
const features = store.table("mapControlState").get("global:features");
for (const k of ["readEnabled", "resolverEnabled", "projectorEnabled"])
  features[k] = true;
const policy = store.table("mapControlState").get("global:policy");
policy.network = {
  policyVersion: network.NETWORK_POLICY_VERSION,
  servingSchemaVersion: "public-map-v4",
  publicMaxAgeMs: network.NETWORK_PUBLIC_MAX_AGE_MS,
  curatorAuthorityIds: ["fixture-curator"],
};
const env = {
  ICHI_V2_FUNCTION_ENABLED: "true",
  ICHI_V2_BACKEND_MODE: "production",
  IDENTITY_HMAC_KEY: "i".repeat(48),
  ICHI_V2_ACCOUNT_AUTHORITY_HMAC_KEY: "a".repeat(48),
  ICHI_V2_CURSOR_HMAC_KEY: "c".repeat(48),
};
store.table("accounts").set("fixture-account", { status: "active" });
store
  .table("wechatIdentities")
  .set(
    createHmac("sha256", env.IDENTITY_HMAC_KEY)
      .update("wx:fixture")
      .digest("hex"),
    { accountId: "fixture-account" },
  );
let nowMs = Date.parse("2026-10-06T00:00:00Z"),
  serial = 0;
const iso = (ms) => new Date(ms).toISOString(),
  newId = () => (++serial).toString(16).padStart(32, "0");
const sourceUrl = "https://www.xiaohongshu.com/explore/fixture123";
const record = {
  schemaVersion: network.NETWORK_SOURCE_SCHEMA,
  sourceId: network.networkSourceId(sourceUrl),
  sourceVersion: "source-v1",
  sourceType: "NETWORK_SOURCE",
  sourceMode: "OFFICIAL_CURATED",
  sourcePlatform: "XHS",
  sourceUrl,
  sourcePublishedAt: iso(nowMs - network.NETWORK_PUBLIC_MAX_AGE_MS + 1000),
  fetchedAt: iso(nowMs - 1000),
  observedAtBasis: "SOURCE_PUBLISHED_AT_FALLBACK",
  observationEvidence: null,
  takedownOwnerId: "fixture-owner",
  boardFacts: {
    schemaVersion: network.SHARED_BOARD_FACTS_SCHEMA,
    ipName: "Fixture IP",
    themeName: null,
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
    capturedAt: iso(nowMs - 1000),
  },
  note: { text: null, safetyProvenance: null },
};
const digest = network.networkContentDigest(record);
const decisions = {
  read: async () => ({
    approval: {
      sourceId: record.sourceId,
      sourceVersion: record.sourceVersion,
      contentDigest: digest,
      reviewedBy: "FOUNDER",
      reviewDecision: "APPROVE",
      reviewVersion: "review-v1",
      reviewedAt: iso(nowMs),
      curatorAuthorityId: "fixture-curator",
      highPrizeTiersConfirmed: true,
    },
    rights: {
      sourceId: record.sourceId,
      sourceVersion: record.sourceVersion,
      contentDigest: digest,
      decision: "PASS",
      basis: "OWNER_PERMISSION",
      evidenceRef: "private-fixture-evidence",
      decisionVersion: "rights-v1",
      decidedAt: iso(nowMs),
      takedownOwnerId: record.takedownOwnerId,
    },
  }),
};
const admitted = await admission.admitOfficialNetworkSource({
  db: store.db,
  record,
  decisions,
  locationPolicy: {
    version: "fixture-grid-v1",
    ruleId: "grid-001",
    precisionMode: "APPROXIMATE",
    gridDegrees: 0.001,
    maxAccuracyMeters: 100,
  },
  nowMs,
  newId,
});
assert.equal(admitted.ok, true, JSON.stringify(admitted));
const cloud = {
  database: () => store.db,
  getWXContext: () => ({ APPID: "wx", OPENID: "fixture" }),
};
const main = (operation) =>
  runtime.createMain({
    cloud,
    env,
    operation,
    now: () => nowMs,
    newId,
    collectionAllowlist: proposal.functions.find(
      (f) => f.operation === operation,
    ).collectionAllowlist,
  });
const detail = () =>
  main("detail")({
    publicLeadId: admitted.publicLeadId,
    requestId: "fixture-detail",
    generation: 1,
    supportedSchemaVersions: ["public-map-v3", "public-map-v4"],
  });
const query = () =>
  main("query")({
    bbox: { west: 121.38, south: 31.14, east: 121.58, north: 31.3 },
    zoom: 12,
    mode: "MAP",
    opportunityStatuses: [],
    includeLowFreshness: true,
    limit: 50,
    cursor: null,
    asOf: null,
    requestId: "fixture-query",
    generation: 1,
    supportedSchemaVersions: ["public-map-v3", "public-map-v4"],
  });
const before = await detail();
assert.equal(before.ok, true, JSON.stringify(before));
assert.equal(before.item.sourceLabel, "网络上传");
assert.equal(before.item.contributor, null);
assert.deepEqual(before.item.contributors, []);
assert.equal((await query()).items.length, 1);
for (const secret of [
  record.sourceUrl,
  "private-fixture-evidence",
  "fixture-curator",
  "fixture-owner",
  "contentDigest",
  "accuracyMeters",
])
  assert.equal(JSON.stringify(before).includes(secret), false);
nowMs += 1000;
assert.equal((await query()).items.length, 0);
assert.equal((await detail()).code, "LEAD_UNAVAILABLE");
assert.equal(
  (await admission.reconcileDueNetworkSources({ db: store.db, nowMs, newId }))
    .processed,
  1,
);
assert.equal(
  store.table("publicMapLeads").get(`head:${admitted.publicLeadId}`)
    .lifecycleState,
  "RETIRED",
);
assert.equal(
  store
    .table("boardObservations")
    .has(`observation:${admitted.observationVersionId}`),
  true,
);
const receipt = {
  task: "TASK-V2-22",
  phase: "PHASE3",
  result: "PASS",
  runtime: "COMPILED_ZIP_NODE_ESM",
  artifactSha256: manifest.sha256,
  preservedExistingArtifacts: Object.keys(baseline).length,
  preservedExistingArtifactsResult: "PASS",
  externalWrites: 0,
  checks: [
    "ZIP_SOURCE_SHA",
    "EXACT_APPROVAL_RIGHTS",
    "SHARED_DOMAIN_ADMISSION",
    "V4_PUBLIC_ALLOWLIST",
    "NULL_CONTRIBUTOR",
    "30D_QUERY_DETAIL_BOUNDARY",
    "EXPIRY_RECONCILE",
    "HISTORY_RETAINED",
  ],
};
fs.writeFileSync(
  path.join(output, "packaged-validation.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(
  `Phase3 compiled package PASS; ${receipt.preservedExistingArtifacts} existing artifacts preserved; external writes 0.`,
);
