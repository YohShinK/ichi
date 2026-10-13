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
const outputRoot = path.join(sourceRoot, "artifacts");
const proposal = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      "packages/v2-map/resources/cloudbase-shadow-resource-proposal.json",
    ),
    "utf8",
  ),
);
const workRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), "ichi-v2-shadow-artifact-"),
);
const compiledRoot = path.join(workRoot, "compiled");
const references = [
  "board-instance.ts",
  "verification.ts",
  "source-adapters.ts",
  "projector.ts",
  "public-api.ts",
].map((file) => path.join(root, "packages/v2-map/src", file));
const tsc = spawnSync(
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
    ...references,
  ],
  { cwd: root, encoding: "utf8" },
);
if (tsc.status !== 0)
  throw new Error(`reference compile failed: ${tsc.stdout}${tsc.stderr}`);

const copy = (from, to, transform = (source) => source) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  const value = transform(fs.readFileSync(from, "utf8"));
  fs.writeFileSync(to, value);
};
const entries = [];
try {
  fs.mkdirSync(outputRoot, { recursive: true });
  for (const fn of proposal.newFunctions) {
    const stage = path.join(workRoot, fn.name);
    fs.mkdirSync(stage, { recursive: true });
    const from = path.join(sourceRoot, fn.name);
    for (const file of ["index.js", "package.json"]) {
      copy(path.join(from, file), path.join(stage, file));
    }
    copy(
      path.join(from, "runtime.mjs"),
      path.join(stage, "runtime.mjs"),
      (source) =>
        source
          .replaceAll('"../../../src/', '"./core/')
          .replaceAll('"../shared/', '"./shared/'),
    );
    const sharedRoot = path.join(sourceRoot, "shared");
    const sharedFiles = fn.name.includes("public-map-lead")
      ? ["db.mjs", "security.mjs", "public-read.mjs"]
      : ["db.mjs", "security.mjs", "verified-fixture.mjs"];
    for (const file of sharedFiles) {
      copy(
        path.join(sharedRoot, file),
        path.join(stage, "shared", file),
        (source) => source.replaceAll('"../../../src/', '"../core/'),
      );
    }
    for (const file of fs
      .readdirSync(compiledRoot)
      .filter((name) => name.endsWith(".js"))) {
      copy(path.join(compiledRoot, file), path.join(stage, "core", file));
    }
    fs.writeFileSync(
      path.join(stage, "core/package.json"),
      '{"type":"module"}\n',
    );
    const files = [
      "index.js",
      "package.json",
      "runtime.mjs",
      "core/package.json",
      ...fs
        .readdirSync(path.join(stage, "core"))
        .filter((name) => name.endsWith(".js"))
        .map((name) => `core/${name}`),
      ...sharedFiles.map((name) => `shared/${name}`),
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
      runtime: "nodejs20.19",
      entry: "index.main",
      collections: fn.collections,
      sourceVersion: "v2-19-b2-r1-local",
      deployed: false,
      cloudWrite: false,
    });
  }
  const manifest = {
    status: "LOCAL_ARTIFACTS_ONLY_PENDING_REVIEW",
    environmentId: proposal.environmentId,
    proposalVersion: proposal.proposalVersion,
    deployed: false,
    cloudWrite: false,
    functions: entries,
  };
  fs.writeFileSync(
    path.join(
      root,
      "packages/v2-map/resources/cloudbase-shadow-function-artifacts-b2-r1.json",
    ),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  for (const entry of entries) console.log(`${entry.name} ${entry.sha256}`);
} finally {
  fs.rmSync(workRoot, { recursive: true, force: true });
}
