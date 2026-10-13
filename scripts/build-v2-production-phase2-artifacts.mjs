import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const source = path.join(root, "packages/v2-map/resources/production");
const output = path.join(root, "artifacts/task22/phase2");
const proposal = JSON.parse(
  fs.readFileSync(path.join(source, "phase2/resource-proposal.json")),
);
const sha = (b) => createHash("sha256").update(b).digest("hex");
const frozen = fs.readFileSync(path.join(source, "shared/runtime.mjs"), "utf8");
const frozenSha =
  "8e7680e046e037fa688090aae32f9897a97da7ac2606558d245ed70fba3e60d2";
if (sha(frozen) !== frozenSha) throw new Error("FROZEN_PHASE1_RUNTIME_DRIFT");
const derived =
  `// Generated from frozen Phase1 runtime SHA256 ${frozenSha}. Business algorithms unchanged.\n` +
  frozen
    .replaceAll('"./security.mjs"', '"../shared/security.mjs"')
    .replaceAll('"./domain.mjs"', '"../shared/domain.mjs"') +
  "\nexport { prepareSelection, resolve, project, policyValid, enqueue, link };\n";
fs.writeFileSync(path.join(source, "phase2/pipeline.mjs"), derived);
const compiled = path.join(output, "compiled-core");
fs.mkdirSync(output, { recursive: true });
fs.rmSync(compiled, { recursive: true, force: true });
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
    compiled,
    ...[
      "verification",
      "opportunity",
      "board-instance",
      "projector",
      "public-api",
      "authorization",
      "moderation",
    ].map((n) => path.join(root, `packages/v2-map/src/${n}.ts`)),
  ],
  { encoding: "utf8" },
);
if (compile.status !== 0) throw new Error(compile.stdout + compile.stderr);
const v1Build = spawnSync(
  process.execPath,
  ["services/cloudbase/deploy/build-functions.mjs"],
  { cwd: root, encoding: "utf8" },
);
if (v1Build.status !== 0) throw new Error(v1Build.stdout + v1Build.stderr);
const list = (dir, base = dir) =>
  fs
    .readdirSync(dir)
    .sort()
    .flatMap((n) => {
      const p = path.join(dir, n);
      return fs.statSync(p).isDirectory()
        ? list(p, base)
        : [path.relative(base, p)];
    });
const copy = (from, to, transform = (v) => v) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, transform(fs.readFileSync(from, "utf8")));
};
const functions = [];
for (const f of proposal.functions) {
  const stage = path.join(output, "package-staging", f.name);
  fs.rmSync(stage, { recursive: true, force: true });
  fs.mkdirSync(stage, { recursive: true });
  if (f.action === "CREATE") {
    fs.writeFileSync(
      path.join(stage, "index.js"),
      `"use strict";\nexports.main = async (event = {}, invocation = {}) => {\n  const [{ default: cloud }, { ${f.factory} }] = await Promise.all([import("wx-server-sdk"), import("./phase2/runtime.mjs")]);\n  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });\n  return ${f.factory}({ cloud, env: process.env })(event, invocation);\n};\n`,
    );
    fs.writeFileSync(
      path.join(stage, "package.json"),
      JSON.stringify(
        {
          name: f.name,
          version: "1.0.0",
          private: true,
          main: "index.js",
          engines: { node: ">=20.19.0 <21" },
          dependencies: { "wx-server-sdk": "4.0.2" },
        },
        null,
        2,
      ) + "\n",
    );
    for (const n of [
      "runtime.mjs",
      "security.mjs",
      "source.mjs",
      "pipeline.mjs",
    ])
      copy(path.join(source, "phase2", n), path.join(stage, "phase2", n), (v) =>
        v
          .replaceAll('"../../../src/', '"../core/')
          .replace(
            '"../../../../../services/cloudbase/shared/source-bridge-producer.js"',
            '"./producer.cjs"',
          ),
      );
    copy(
      path.join(root, "services/cloudbase/shared/source-bridge-producer.js"),
      path.join(stage, "phase2/producer.cjs"),
    );
    for (const n of ["domain.mjs", "security.mjs"])
      copy(path.join(source, "shared", n), path.join(stage, "shared", n), (v) =>
        v.replaceAll('"../../../src/', '"../core/'),
      );
    for (const n of list(compiled))
      copy(path.join(compiled, n), path.join(stage, "core", n));
    fs.writeFileSync(
      path.join(stage, "core/package.json"),
      '{"type":"module"}\n',
    );
  } else {
    // The live V1 functions have different historical shared-runtime versions.
    // Patch each exact remote rollback ZIP, never redeploy unrelated local edits.
    const preflight = JSON.parse(
      fs.readFileSync(path.join(output, "cloud-readonly-preflight.json")),
    );
    const prior = preflight.functions.find((row) => row.name === f.name);
    const rollback = path.join(root, prior.remoteRollbackArtifact);
    if (sha(fs.readFileSync(rollback)) !== prior.sha256)
      throw new Error("REMOTE_ROLLBACK_DRIFT");
    const unpack = spawnSync("unzip", ["-q", rollback, "-d", stage], {
      encoding: "utf8",
    });
    if (unpack.status !== 0) throw new Error("REMOTE_ROLLBACK_UNPACK_FAILED");
    const once = (value, needle, replacement) => {
      if (value.split(needle).length !== 2)
        throw new Error(`REMOTE_HOOK_ANCHOR_MISMATCH:${f.name}`);
      return value.replace(needle, replacement);
    };
    if (f.name === "recognize-draw-tickets") {
      const old = fs.readFileSync(path.join(stage, "index.js"));
      const prechange = fs.readFileSync(
        path.join(
          output,
          "prechange-source/services/cloudbase/functions/verify-prize-tickets/index.js",
        ),
      );
      if (sha(old) !== sha(prechange))
        throw new Error("REMOTE_VERIFIER_BASELINE_MISMATCH");
      copy(
        path.join(
          root,
          "services/cloudbase/functions/verify-prize-tickets/index.js",
        ),
        path.join(stage, "index.js"),
      );
    } else {
      const file = path.join(stage, "shared/runtime.js");
      let value = fs.readFileSync(file, "utf8");
      value = once(
        value,
        'const domain = require("./domain");',
        'const domain = require("./domain");\nconst sourceBridge = require("./source-bridge-producer");',
      );
      const hook =
        f.name === "finalize-board-observation"
          ? [
              "        .set({ data: observation });\n",
              '      await sourceBridge.enqueueSourceChange({ tx: transaction, env, recordId, ownerAccountId: accountId, reason: "PUBLISHED", nowMs: now() });\n',
            ]
          : f.name === "delete-my-record"
            ? [
                '        type: "record.deletion_requested",',
                "SOURCE_RECORD_DELETE",
              ]
            : [
                '        type: "account.deletion_requested",',
                "SOURCE_ACCOUNT_DELETE",
              ];
      if (f.name === "finalize-board-observation")
        value = once(value, hook[0], hook[0] + hook[1]);
      else {
        const needle = `      await addAudit(transaction, {\n${hook[0]}`;
        const call =
          f.name === "delete-my-record"
            ? '      await sourceBridge.enqueueSourceChange({ tx: transaction, env, recordId, ownerAccountId: accountId, reason: "DELETE", nowMs: now() });\n'
            : "      await sourceBridge.enqueueAccountDeletion({ tx: transaction, env, ownerAccountId: accountId, nowMs: now() });\n";
        value = once(value, needle, call + needle);
      }
      fs.writeFileSync(file, value);
    }
    copy(
      path.join(root, "services/cloudbase/shared/source-bridge-producer.js"),
      path.join(stage, "shared/source-bridge-producer.js"),
    );
    const beforeFiles = spawnSync("unzip", ["-Z1", rollback], {
      encoding: "utf8",
    })
      .stdout.trim()
      .split("\n")
      .filter((n) => !n.endsWith("/"));
    const allowed =
      f.name === "recognize-draw-tickets" ? "index.js" : "shared/runtime.js";
    for (const n of beforeFiles) {
      const old = spawnSync("unzip", ["-p", rollback, n], {
        maxBuffer: 64 * 1024 * 1024,
      }).stdout;
      if (
        n !== allowed &&
        sha(old) !== sha(fs.readFileSync(path.join(stage, n)))
      )
        throw new Error("UNRELATED_REMOTE_SOURCE_DRIFT");
    }
  }
  const files = list(stage);
  for (const n of files) {
    fs.chmodSync(path.join(stage, n), 0o644);
    fs.utimesSync(
      path.join(stage, n),
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-01-01T00:00:00Z"),
    );
  }
  const zip = path.join(output, "function-artifacts", `${f.name}.zip`);
  fs.mkdirSync(path.dirname(zip), { recursive: true });
  fs.rmSync(zip, { force: true });
  const result = spawnSync("zip", ["-X", "-q", zip, ...files], {
    cwd: stage,
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(result.stderr);
  functions.push({
    name: f.name,
    action: f.action,
    artifact: path.relative(root, zip),
    sha256: sha(fs.readFileSync(zip)),
    sizeBytes: fs.statSync(zip).size,
    runtime: f.runtime,
    entry: "index.main",
    enabled: f.action === "CREATE" ? false : "PRESERVE_EXISTING_V1",
    producerEnabled: false,
    packagedFiles: files.map((n) => ({
      path: n,
      sha256: sha(fs.readFileSync(path.join(stage, n))),
    })),
  });
}
const manifest = {
  task: "TASK-V2-22",
  phase: "PHASE2",
  status: "LOCAL_CANDIDATE_CLOUD_NOT_APPLIED",
  externalWrites: 0,
  frozenPhase1RuntimeSha256: frozenSha,
  resourceProposalSha256: sha(
    fs.readFileSync(path.join(source, "phase2/resource-proposal.json")),
  ),
  functions,
};
fs.writeFileSync(
  path.join(output, "artifact-manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  `Phase2 built ${functions.length} independent disabled artifacts; frozen Phase1 untouched`,
);
