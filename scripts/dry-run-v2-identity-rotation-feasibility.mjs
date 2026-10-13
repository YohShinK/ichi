import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";

// Offline counterexamples only. Fixed fixture strings are never production keys.
const require = createRequire(import.meta.url);
const { hashIdentity } = require("../services/cloudbase/shared/domain.js");
const context = {
  appId: "wx-phase1b-fixture",
  openId: "fixture-offline-owner",
};
const oldDigest = hashIdentity({
  ...context,
  secret: "fixture-old-key-not-production",
});
const newDigest = hashIdentity({
  ...context,
  secret: "fixture-new-key-not-production",
});
const originalAccount = "fixture-existing-account";
assert.notEqual(oldDigest, newDigest);
const legacy = new Map([
  [oldDigest, { accountId: originalAccount, appId: context.appId }],
]);
const results = [];
const record = (scenario, assertion) => {
  assert.equal(assertion, true, scenario);
  results.push({
    scenario,
    result: "COUNTEREXAMPLE_OR_CONDITIONAL_GUARD_CONFIRMED",
  });
};
record("new key misses existing legacy document", !legacy.has(newDigest));
record(
  "one-way legacy record stores no input OPENID",
  !("openId" in legacy.get(oldDigest)),
);
const existingBootstrapChoice =
  legacy.get(newDigest)?.accountId ?? "fixture-second-account";
record(
  "blind new-key bootstrap would split Account",
  existingBootstrapChoice !== originalAccount,
);
record(
  "dual primary rows violate accountId unique",
  [...legacy.values()].some((r) => r.accountId === originalAccount),
);
const renamed = new Map([[newDigest, legacy.get(oldDigest)]]);
record(
  "single-document rekey breaks original-code lookup",
  !renamed.has(oldDigest),
);
record(
  "old primary retained keeps legacy rollback lookup",
  legacy.get(oldDigest).accountId === originalAccount,
);
const alias = new Map([[newDigest, { canonicalIdentityId: oldDigest }]]);
record(
  "separate alias can preserve revisited Account",
  legacy.get(alias.get(newDigest).canonicalIdentityId).accountId ===
    originalAccount,
);
const notVisited = new Map();
record(
  "offline owner has no lazy alias after old key removal",
  !notVisited.has(newDigest),
);
record(
  "unvisited and fresh users both miss alias lookup",
  !notVisited.has(newDigest) && !notVisited.has("fixture-fresh-digest"),
);
record(
  "alias completion guard must block old-key exit",
  legacy.size - notVisited.size > 0,
);
record(
  "all aliases populated can conditionally permit exit",
  legacy.size - alias.size === 0,
);
const afterDelete = new Map();
record(
  "alias lookup must reject dangling deleted primary",
  !afterDelete.has(alias.get(newDigest).canonicalIdentityId),
);
const out = {
  status: "FEASIBILITY_COUNTEREXAMPLES_CONFIRMED_NOT_IMPLEMENTATION_PASS",
  fixtureOnly: true,
  productionKeyGenerated: false,
  cloudWrites: 0,
  identityRecordsWritten: 0,
  cases: results,
  limitations: [
    "This is a deterministic model using the actual existing hashIdentity helper, not a CloudBase migration implementation.",
    "Equal counts are not an inventory proof: real exit requires per-identity verified alias coverage and a write barrier.",
    "Concurrent transactions, staged deployment, lazy migration, deletion cleanup and rollback are not implemented or accepted by this script.",
  ],
};
const dir = "artifacts/task22/phase1b";
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(
  `${dir}/identity-feasibility-dry-run.json`,
  `${JSON.stringify(out, null, 2)}\n`,
);
console.log(
  `Offline feasibility: ${results.length} counterexamples/conditional guards confirmed; production implementation NOT_STARTED.`,
);
