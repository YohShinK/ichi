import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const source = path.join(root, "packages/v2-map/resources/production");
const proposal = JSON.parse(
  fs.readFileSync(
    path.join(source, "cloudbase-production-resource-proposal.json"),
    "utf8",
  ),
);
const output = path.join(root, "artifacts/task22/phase1");
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
const sha = (buffer) => createHash("sha256").update(buffer).digest("hex");
const list = (dir, base = dir) =>
  fs
    .readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const p = path.join(dir, name);
      return fs.statSync(p).isDirectory()
        ? list(p, base)
        : [path.relative(base, p)];
    });
const copy = (from, to, transform = (v) => v) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, transform(fs.readFileSync(from, "utf8")));
};
const functions = [];
for (const fn of proposal.functions) {
  const stage = path.join(output, "package-staging", fn.name);
  fs.rmSync(stage, { recursive: true, force: true });
  fs.mkdirSync(stage, { recursive: true });
  const originals = [];
  for (const name of ["index.js", "runtime.mjs", "package.json"]) {
    const file = path.join(source, "functions", fn.name, name);
    originals.push(file);
    copy(file, path.join(stage, name), (v) =>
      v.replaceAll('"../../shared/', '"./shared/'),
    );
  }
  for (const name of ["security.mjs", "domain.mjs", "runtime.mjs"]) {
    const file = path.join(source, "shared", name);
    originals.push(file);
    copy(file, path.join(stage, "shared", name), (v) =>
      v.replaceAll('"../../../src/', '"../core/'),
    );
  }
  for (const name of list(compiled))
    copy(path.join(compiled, name), path.join(stage, "core", name));
  fs.writeFileSync(
    path.join(stage, "core/package.json"),
    '{"type":"module"}\n',
  );
  const files = list(stage);
  for (const name of files) {
    fs.chmodSync(path.join(stage, name), 0o644);
    fs.utimesSync(
      path.join(stage, name),
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-01-01T00:00:00Z"),
    );
  }
  const zip = path.join(output, "function-artifacts", `${fn.name}.zip`);
  fs.mkdirSync(path.dirname(zip), { recursive: true });
  fs.rmSync(zip, { force: true });
  const result = spawnSync("zip", ["-X", "-q", zip, ...files], {
    cwd: stage,
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(result.stderr);
  const sourceFiles = originals.map((p) => ({
    path: path.relative(root, p),
    sha256: sha(fs.readFileSync(p)),
  }));
  sourceFiles.push(
    ...list(compiled).map((n) => {
      const p = `packages/v2-map/src/${n.replace(/\.js$/u, ".ts")}`;
      return { path: p, sha256: sha(fs.readFileSync(path.join(root, p))) };
    }),
  );
  functions.push({
    name: fn.name,
    runtime: fn.runtime,
    entry: fn.entry,
    artifact: path.relative(root, zip),
    sha256: sha(fs.readFileSync(zip)),
    sizeBytes: fs.statSync(zip).size,
    collectionAllowlist: fn.collectionAllowlist,
    operation: fn.operation,
    sourceManifestSha256: sha(JSON.stringify(sourceFiles)),
    sourceFiles,
    packagedFiles: files.map((n) => ({
      path: n,
      sha256: sha(fs.readFileSync(path.join(stage, n))),
    })),
    rollbackArtifact: null,
    rollbackStrategy: fn.rollback.strategy,
  });
}
const manifest = {
  task: "TASK-V2-22",
  phase: "PHASE1",
  status: "ARTIFACT_FROZEN_CLOUD_NOT_APPLIED",
  runtime: "Nodejs20.19",
  sdkVersion: "4.0.2",
  externalWrites: 0,
  resourceProposalSha256: sha(
    fs.readFileSync(
      path.join(source, "cloudbase-production-resource-proposal.json"),
    ),
  ),
  functions,
};
fs.writeFileSync(
  path.join(source, "cloudbase-production-artifacts.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(`Built ${functions.length} independent production artifacts`);
for (const f of functions)
  console.log(`${f.name} ${f.sha256} (${f.sizeBytes} bytes)`);
