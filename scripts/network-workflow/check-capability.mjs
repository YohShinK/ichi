import "./source-loader.mjs";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
const {
  buildNetworkObservation,
  networkSourceId,
  networkContentDigest,
  networkLocationDigest,
} =
  await import("../../packages/v2-map/resources/production/phase3/network.mjs");
import { digest, check, json, atomic } from "./store.mjs";

const file = path.resolve(process.argv[2]),
  manifest = json(file),
  root = path.dirname(file);
check(manifest.functions.length === 7, "SEVEN_EXACT_CANDIDATES_REQUIRED");
const nowMs = Date.now(),
  input = json(
    "artifacts/task22/phase4/collection50-20261008/batches/final-human-four/real-records.json",
  );
const locationPolicy = manifest.baseline.bridge.locationPolicy,
  basePolicy = manifest.baseline.policy;
const checks = [];
for (const f of manifest.functions) {
  check(
    digest(fs.readFileSync(f.candidateZip)) === f.candidateSha256 &&
      digest(fs.readFileSync(f.rollbackZip)) === f.rollbackSha256,
    "CAPABILITY_PACKAGE_SHA_DRIFT",
  );
  const module = await import(
    pathToFileURL(path.join(root, "candidate", f.name, "phase3/network.mjs"))
      .href
  );
  check(
    digest(
      execFileSync("unzip", ["-p", f.candidateZip, "phase3/network.mjs"]),
    ) === manifest.networkModuleSha256,
    "CAPABILITY_MODULE_SHA_DRIFT",
  );
  check(
    module.networkPolicyValid(basePolicy.network),
    "LEGACY_POLICY_COMPATIBILITY_FAILED",
  );
  for (const item of input.items) {
    const args = {
      record: item.record,
      ...item.decision,
      policy: basePolicy,
      locationPolicy,
      nowMs,
    };
    const local = buildNetworkObservation(args),
      compiled = module.buildNetworkObservation(args);
    check(
      local.ok && compiled.ok && digest(local) === digest(compiled),
      "REAL_EXISTING_SOURCE_COMPILED_PARITY_FAILED",
    );
  }
  // Clearly labelled isolated vector. Never written to the production database.
  const record = structuredClone(input.items[0].record),
    decision = structuredClone(input.items[0].decision);
  record.sourceUrl =
    "https://www.xiaohongshu.com/explore/Phase5IsolatedPackageVector";
  record.sourceId = networkSourceId(record.sourceUrl, record.boardEvidenceKey);
  record.location.venueReference.sourceUrl = record.sourceUrl;
  const contentDigest = networkContentDigest(record);
  for (const key of ["approval", "rights"])
    Object.assign(decision[key], {
      sourceId: record.sourceId,
      sourceVersion: record.sourceVersion,
      contentDigest,
    });
  Object.assign(decision.approval, {
    reviewedBy: "AGENT_USER_DELEGATION",
    authorizationRef: "SYNTHETIC_PACKAGE_TEST_ONLY",
    reviewedAt: new Date(nowMs).toISOString(),
  });
  const policy = structuredClone(basePolicy);
  policy.network.workflowReviewDelegation = {
    version: module.NETWORK_WORKFLOW_DELEGATION_VERSION,
    authorizationRef: decision.approval.authorizationRef,
    authorizedAt: new Date(nowMs - 1000).toISOString(),
    approvedSources: [
      {
        sourceId: record.sourceId,
        sourceVersion: record.sourceVersion,
        contentDigest,
      },
    ],
  };
  policy.network.workflowVenueApproximation = {
    version: module.NETWORK_WORKFLOW_LOCATION_VERSION,
    ruleId: module.NETWORK_WORKFLOW_LOCATION_RULE,
    approvedSources: [
      {
        sourceId: record.sourceId,
        sourceVersion: record.sourceVersion,
        locationDigest: networkLocationDigest(record.location),
      },
    ],
  };
  const args = { record, ...decision, policy, locationPolicy, nowMs };
  check(
    module.buildNetworkObservation(args).ok,
    "COMPILED_AUTOMATIC_WORKFLOW_DENIED",
  );
  const unrelated = structuredClone(decision.approval);
  unrelated.authorizationRef = "old-50-authorization";
  check(
    !module.buildNetworkObservation({ ...args, approval: unrelated }).ok,
    "COMPILED_UNRELATED_AUTHORIZATION_ACCEPTED",
  );
  const nullRecord = structuredClone(record);
  nullRecord.boardFacts.tiers[0].remainingTickets = null;
  check(
    !module.buildNetworkObservation({ ...args, record: nullRecord }).ok,
    "COMPILED_CHANGED_UNREVIEWED_COUNTS_ACCEPTED",
  );
  checks.push({
    function: f.name,
    legacyRealRecords: input.items.length,
    automaticWorkflow: "PASS",
    unrelatedAuthorizationDenied: true,
    changedCountsDenied: true,
  });
}
atomic(path.join(root, "package-validation.json"), {
  status: "SEVEN_COMPILED_CAPABILITY_PACKAGES_PASS",
  at: new Date().toISOString(),
  checks,
  syntheticVectorsNotPublished: true,
  productionWrites: 0,
});
process.stdout.write(
  JSON.stringify({
    status: "SEVEN_COMPILED_CAPABILITY_PACKAGES_PASS",
    functions: checks.length,
    realExistingParityChecks: checks.length * input.items.length,
  }) + "\n",
);
