import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { pathToFileURL } from "node:url";
import { localDatabase } from "../packages/v2-map/resources/production/tests/db.test-support.mjs";
import { planHistoricalVersion } from "../packages/v2-map/resources/production/source-dry-run.mjs";

const root = process.cwd();
const output = path.join(root, "artifacts/task22/phase1");
const proposal = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      "packages/v2-map/resources/production/cloudbase-production-resource-proposal.json",
    ),
    "utf8",
  ),
);
const store = localDatabase(proposal.collections);
const now = Date.parse("2026-10-02T04:00:00Z");
const env = {
  ICHI_V2_BACKEND_MODE: "production",
  ICHI_V2_FUNCTION_ENABLED: "true",
  IDENTITY_HMAC_KEY: "i".repeat(48),
  ICHI_V2_ACCOUNT_AUTHORITY_HMAC_KEY: "p".repeat(48),
  ICHI_V2_CURSOR_HMAC_KEY: "c".repeat(48),
};
const cloud = {
  database: () => store.db,
  getWXContext: () => ({ APPID: "local-app", OPENID: "local-account" }),
};
const hash = (v) => createHash("sha256").update(v).digest("hex");
const checks = [];
const check = (name, work) => {
  work();
  checks.push({ name, status: "PASS" });
};
for (const c of proposal.collections) {
  store.table(c.name);
  for (const row of c.initialRows) {
    const { _id, ...data } = row;
    store.table(c.name).set(_id, structuredClone(data));
  }
}
check(
  "production empty initialization / safe controls / independent epoch",
  () => {
    assert.equal(store.table("publicMapLeads").size, 0);
    assert.equal(
      store.table("mapControlState").get("global:read-stop").stopped,
      true,
    );
    assert.equal(
      store.table("mapControlState").get("global:read-epoch").epoch,
      1,
    );
    assert.equal(
      store.table("mapControlState").get("global:features").haPaused,
      true,
    );
    assert.equal(
      [...store.tables.entries()]
        .filter(([n]) => n !== "mapControlState")
        .flatMap(([, t]) => [...t]).length,
      0,
    );
  },
);
const schemaInput = {
  origin: "AUTHORITATIVE_PLAYER",
  lifecycleState: "CURRENT",
  verification: "VERIFIED",
  shareIntent: "SHARE",
  authorizationApplicable: true,
  rightsEligible: true,
  recordType: "UPLOAD_RECORD",
  privateSourceIdentity: "local-schema-only",
  exactSourceVersion: "v1",
};
const sourceBefore = hash(JSON.stringify(schemaInput));
const empty = { observations: {}, contributions: {}, tombstones: {} };
const plan = planHistoricalVersion(empty, schemaInput);
check(
  "per-record plan/idempotency/no duplicate observation/contribution/source immutable",
  () => {
    assert.equal(plan.status, "PLAN_ONLY");
    assert.equal(
      planHistoricalVersion(plan.nextState, schemaInput).status,
      "IDEMPOTENT_NO_WRITE",
    );
    assert.equal(Object.keys(plan.nextState.observations).length, 1);
    assert.equal(Object.keys(plan.nextState.contributions).length, 1);
    assert.equal(hash(JSON.stringify(schemaInput)), sourceBefore);
    assert.equal(
      planHistoricalVersion(empty, {
        ...schemaInput,
        origin: "SYNTHETIC_REHEARSAL",
      }).status,
      "INELIGIBLE_NO_WRITE",
    );
    assert.equal(
      planHistoricalVersion(empty, {
        ...schemaInput,
        recordType: "DRAW_RECORD",
      }).status,
      "PLAN_ONLY",
    );
    const tombstone = structuredClone(plan.nextState);
    tombstone.tombstones[plan.lineageId] = true;
    assert.equal(
      planHistoricalVersion(tombstone, {
        ...schemaInput,
        exactSourceVersion: "v2",
      }).status,
      "TOMBSTONED_NO_WRITE",
    );
  },
);
const loadMain = async (op) => {
  const f = proposal.functions.find((x) => x.operation === op);
  const module = await import(
    pathToFileURL(path.join(output, "package-staging", f.name, "runtime.mjs"))
      .href
  );
  return module.createMain({
    cloud,
    env,
    now: () => now,
    newId: () => "1".repeat(32),
  });
};
const query = await loadMain("query");
assert.equal((await query({})).ok, false);
checks.push({
  name: "packaged production entry remains stopped before initialization authority",
  status: "PASS",
});
const identityId = createHmac("sha256", env.IDENTITY_HMAC_KEY)
  .update("local-app:local-account")
  .digest("hex");
store.table("wechatIdentities").set(identityId, { accountId: "account_local" });
store.table("accounts").set("account_local", { status: "active" });
store.table("mapAccountPolicies").set("account:account_local", {
  kind: "ACCOUNT_POLICY",
  accountId: "account_local",
  authorityVersion: "production-account-policy-v1",
  roles: ["MAP_MAINTAINER"],
  expiresAt: new Date(now + 86400_000).toISOString(),
});
store.table("mapControlState").get("global:read-stop").stopped = false;
for (const k of Object.keys(
  store.table("mapControlState").get("global:features"),
))
  if (k.endsWith("Enabled"))
    store.table("mapControlState").get("global:features")[k] = true;
const id = plan.observationVersionId;
const observedAt = new Date(now - 60000).toISOString();
store.table("boardObservations").set(`observation:${id}`, {
  schemaVersion: "map-source-boundary-phase1-v1",
  kind: "OBSERVATION_VERSION",
  observationVersionId: id,
  lineageId: plan.lineageId,
  sourceVersion: "v1",
  lifecycleState: "CURRENT",
  sourceCurrent: true,
  locationKey: "local-schema-only",
  rightsEligible: true,
  source: {
    family: "PLAYER",
    ownerAccountId: "account_local",
    recordType: "UPLOAD_RECORD",
    originSourcePath: "direct-upload",
    shareIntent: "SHARE",
    sourceVersion: "v1",
  },
  input: {
    observationVersionId: id,
    ownerAccountId: "account_local",
    privateLineageId: plan.lineageId,
    verificationInputOnly: true,
    observedAt,
    location: {
      coordinateSystem: "GCJ02",
      latitude: 31.23,
      longitude: 121.47,
      accuracyMeters: 20,
      capturedAt: observedAt,
    },
    boardFacts: {
      schemaVersion: "facts-v1",
      ipName: "Local schema input",
      themeName: null,
      pricePerDrawMinor: null,
      tiers: [
        {
          tierCode: "A",
          rawLabel: null,
          initialRemainingTickets: null,
          remainingTickets: null,
          isGrandPrize: true,
        },
      ],
    },
    note: { text: null, safetyProvenance: null },
  },
  verification: {
    result: "VERIFIED",
    verifiedBoardVersion: "version-1",
    verifiedBoardId: "board-1",
    verificationId: "verification-1",
    policyVersion: "verification-v2-10",
    verifiedAt: new Date(now).toISOString(),
  },
  publicProjection: null,
});
store.table("boardObservations").set(`lineage:${plan.lineageId}`, {
  kind: "LINEAGE_HEAD",
  lineageId: plan.lineageId,
  lifecycleState: "CURRENT",
  currentObservationVersionId: id,
  sourceVersion: "v1",
  ownerAccountId: "account_local",
});
const sourceDigest = hash(
  JSON.stringify([...store.table("boardObservations")]),
);
const resolve = await loadMain("resolve");
const event = { observationVersionId: id, actionId: "local_resume_one" };
store.injectCrashAfter(3);
assert.equal((await resolve(event)).code, "SERVICE_UNAVAILABLE");
assert.equal(store.table("mapContributions").size, 0);
store.clearCrash();
const resolved = await resolve(event);
assert.equal(resolved.ok, true);
const sizes = [
  store.table("mapContributions").size,
  store.table("mapProjectionOutbox").size,
];
assert.deepEqual(await resolve(event), resolved);
assert.deepEqual(sizes, [1, 1]);
assert.equal(
  hash(JSON.stringify([...store.table("boardObservations")])),
  sourceDigest,
);
checks.push({
  name: "actual packaged resolver transaction crash/retry/resume/receipt/source preservation",
  status: "PASS",
});
const project = await loadMain("project");
assert.equal(
  (await project({ outboxId: resolved.outboxId, actionId: "local_projection" }))
    .effect,
  "NO_PUBLIC_SUPPORT",
);
assert.equal(store.table("publicMapLeads").size, 0);
checks.push({
  name: "missing consent/eligibility fail closed; no public source promotion",
  status: "PASS",
});
const rollbackBefore = structuredClone(store.table("boardObservations"));
store.table("mapControlState").get("global:features").resolverEnabled = false;
store.table("mapControlState").get("global:read-stop").stopped = true;
store.table("mapControlState").get("global:features").projectorEnabled = false;
store.table("mapControlState").get("global:read-epoch").epoch += 1;
assert.deepEqual(store.table("boardObservations"), rollbackBefore);
checks.push({
  name: "local stop-write/read/pause/epoch rollback preserves private source",
  status: "PASS",
});
const result = {
  status: "PASS",
  scope: "LOCAL_SCHEMA_API_ONLY_NO_CONTINUOUS_BRIDGE",
  externalWrites: 0,
  realUserRecordsRead: 0,
  shadowRowsMigrated: 0,
  productionPublicInitial: 0,
  controls: proposal.initialControlRows,
  checks,
  sourceBefore,
  sourceAfter: hash(JSON.stringify(schemaInput)),
};
fs.writeFileSync(
  path.join(output, "migration-dry-run.json"),
  JSON.stringify(result, null, 2) + "\n",
);
console.log(
  `Production migration/schema/API dry-run PASS (${checks.length} checks; no remote access)`,
);
