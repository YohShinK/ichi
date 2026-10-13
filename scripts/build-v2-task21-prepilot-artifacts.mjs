import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const sourceRoot = path.join(
  root,
  "packages/v2-map/resources/shadow-functions",
);
const outputRoot = path.join(sourceRoot, "artifacts/task21-prepilot");
const workRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ichi-v2-candidate-"));
const compiledRoot = path.join(workRoot, "compiled");
const functions = [
  {
    name: "v2-shadow-submit-candidate-upload",
    shared: ["db.mjs", "security.mjs", "verified-fixture.mjs"],
    collections: [
      "v2ShadowCandidateUploads",
      "v2ShadowSourceFixtures",
      "v2ShadowControlState",
    ],
  },
  {
    name: "v2-shadow-resolve-observation",
    shared: [
      "db.mjs",
      "security.mjs",
      "verified-fixture.mjs",
      "contribution-ledger.mjs",
    ],
    collections: [
      "v2ShadowControlState",
      "v2ShadowSourceFixtures",
      "v2ShadowCandidateUploads",
      "v2ShadowContributionLedger",
      "v2ShadowBoardInstances",
      "v2ShadowAssociationDecisions",
      "v2ShadowProjectionOutbox",
      "v2ShadowHumanAssistanceRequests",
    ],
  },
  {
    name: "v2-shadow-answer-assistance",
    shared: [
      "db.mjs",
      "security.mjs",
      "verified-fixture.mjs",
      "contribution-ledger.mjs",
    ],
    collections: [
      "v2ShadowControlState",
      "v2ShadowCandidateUploads",
      "v2ShadowContributionLedger",
      "v2ShadowHumanAssistanceRequests",
      "v2ShadowHumanAssistanceEvidence",
      "v2ShadowSourceFixtures",
      "v2ShadowBoardInstances",
      "v2ShadowProjectionOutbox",
      "v2ShadowAssociationDecisions",
    ],
  },
  {
    name: "v2-shadow-get-my-assistance",
    shared: ["db.mjs", "security.mjs"],
    collections: [
      "v2ShadowControlState",
      "v2ShadowHumanAssistanceRequests",
      "v2ShadowSourceFixtures",
      "v2ShadowCandidateUploads",
    ],
  },
  {
    name: "v2-shadow-reconcile-projection",
    shared: [
      "db.mjs",
      "security.mjs",
      "verified-fixture.mjs",
      "contribution-ledger.mjs",
      "map-contribution-consent.mjs",
      "opportunity-policy.mjs",
    ],
    collections: [
      "v2ShadowControlState",
      "v2ShadowSourceFixtures",
      "v2ShadowBoardInstances",
      "v2ShadowAssociationDecisions",
      "v2ShadowProjectionOutbox",
      "v2ShadowPublicMapLeads",
      "v2ShadowContributionLedger",
      "v2ShadowCandidateUploads",
      "v2ShadowMapContributionConsent",
    ],
  },
  {
    name: "v2-shadow-manage-contribution",
    shared: [
      "db.mjs",
      "security.mjs",
      "verified-fixture.mjs",
      "contribution-ledger.mjs",
      "map-contribution-consent.mjs",
    ],
    collections: [
      "v2ShadowControlState",
      "v2ShadowCandidateUploads",
      "v2ShadowContributionLedger",
      "v2ShadowSourceFixtures",
      "v2ShadowBoardInstances",
      "v2ShadowPublicMapLeads",
      "v2ShadowProjectionOutbox",
      "v2ShadowMapContributionConsent",
    ],
  },
  {
    name: "v2-shadow-get-public-map-lead-detail",
    shared: [
      "db.mjs",
      "security.mjs",
      "public-read.mjs",
      "opportunity-policy.mjs",
    ],
    collections: ["v2ShadowControlState", "v2ShadowPublicMapLeads"],
  },
  {
    name: "v2-shadow-query-public-map-leads",
    shared: [
      "db.mjs",
      "security.mjs",
      "public-read.mjs",
      "opportunity-policy.mjs",
    ],
    collections: [
      "v2ShadowControlState",
      "v2ShadowPublicMapLeads",
      "v2ShadowPublicMapQuerySnapshots",
    ],
  },
];

const compile = spawnSync(
  path.join(root, "node_modules/.bin/tsc"),
  [
    "--ignoreConfig",
    "--module",
    "NodeNext",
    "--moduleResolution",
    "NodeNext",
    "--target",
    "ES2022",
    "--types",
    "node",
    "--strict",
    "--skipLibCheck",
    "--rootDir",
    path.join(root, "packages/v2-map/src"),
    "--outDir",
    compiledRoot,
    ...[
      "board-instance.ts",
      "verification.ts",
      "opportunity.ts",
      "source-adapters.ts",
      "projector.ts",
      "public-api.ts",
      "contribution-projection.ts",
    ].map((file) => path.join(root, "packages/v2-map/src", file)),
  ],
  { cwd: root, encoding: "utf8" },
);
if (compile.status !== 0)
  throw new Error(
    `reference compile failed: ${compile.stdout}${compile.stderr}`,
  );

const copy = (from, to, transform = (source) => source) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, transform(fs.readFileSync(from, "utf8")));
};
const entries = [];
try {
  fs.mkdirSync(outputRoot, { recursive: true });
  for (const fn of functions) {
    const source = path.join(sourceRoot, fn.name);
    const stage = path.join(workRoot, fn.name);
    fs.mkdirSync(stage, { recursive: true });
    for (const file of ["index.js", "package.json"])
      copy(path.join(source, file), path.join(stage, file));
    copy(
      path.join(source, "runtime.mjs"),
      path.join(stage, "runtime.mjs"),
      (value) =>
        value
          .replaceAll('"../../../src/', '"./core/')
          .replaceAll('"../shared/', '"./shared/'),
    );
    for (const file of fn.shared)
      copy(
        path.join(sourceRoot, "shared", file),
        path.join(stage, "shared", file),
        (value) => value.replaceAll('"../../../src/', '"../core/'),
      );
    const compiled = fs
      .readdirSync(compiledRoot)
      .filter((file) => file.endsWith(".js"));
    for (const file of compiled)
      copy(path.join(compiledRoot, file), path.join(stage, "core", file));
    fs.writeFileSync(
      path.join(stage, "core/package.json"),
      '{"type":"module"}\n',
    );
    const files = [
      "index.js",
      "package.json",
      "runtime.mjs",
      "core/package.json",
      ...compiled.map((file) => `core/${file}`),
      ...fn.shared.map((file) => `shared/${file}`),
    ].sort();
    const epoch = new Date("2026-01-01T00:00:00.000Z");
    for (const file of files)
      fs.utimesSync(path.join(stage, file), epoch, epoch);
    const zipPath = path.join(outputRoot, `${fn.name}.zip`);
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    const zipped = spawnSync("zip", ["-X", "-q", zipPath, ...files], {
      cwd: stage,
      encoding: "utf8",
    });
    if (zipped.status !== 0) throw new Error(`zip failed: ${zipped.stderr}`);
    entries.push({
      name: fn.name,
      artifact: path.relative(root, zipPath),
      sha256: createHash("sha256")
        .update(fs.readFileSync(zipPath))
        .digest("hex"),
      runtime: "Nodejs20.19",
      entry: "index.main",
      collections: fn.collections,
      deployed: false,
      cloudWrite: false,
    });
  }
  const manifest = {
    status: "LOCAL_READY_CANDIDATE_ARTIFACTS_NOT_DEPLOYED",
    environmentId: "cloud1-d7gxqfwv783a1f131",
    deployed: false,
    cloudWrite: false,
    functions: entries,
  };
  fs.writeFileSync(
    path.join(
      root,
      "packages/v2-map/resources/cloudbase-task21-prepilot-artifacts.json",
    ),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  for (const entry of entries) console.log(`${entry.name} ${entry.sha256}`);
} finally {
  fs.rmSync(workRoot, { recursive: true, force: true });
}
