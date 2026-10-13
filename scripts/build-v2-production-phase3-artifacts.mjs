import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

// Independent local validation bundle. No Phase1/2 build, cloud SDK, entry.main,
// resource apply, V1 hook, timer enable, or bridge replay is invoked here.
const root = process.cwd();
const output = path.join(root, "artifacts/task22/phase3-network-20261006");
const source = path.join(root, "packages/v2-map/resources/production");
const stage = path.join(output, "local-runtime");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const list = (dir, base = dir) =>
  fs
    .readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const file = path.join(dir, name);
      return fs.statSync(file).isDirectory()
        ? list(file, base)
        : [path.relative(base, file)];
    });
fs.mkdirSync(output, { recursive: true });
fs.rmSync(stage, { recursive: true, force: true });
fs.mkdirSync(stage, { recursive: true });
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
    path.join(stage, "core"),
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
fs.writeFileSync(path.join(stage, "core/package.json"), '{"type":"module"}\n');
const sources = {};
for (const relative of [
  ...fs
    .readdirSync(path.join(source, "shared"))
    .filter((n) => n.endsWith(".mjs") && !n.includes("test"))
    .map((n) => `shared/${n}`),
  ...["admission", "security", "source", "metadata"].map(
    (n) => `phase2/${n}.mjs`,
  ),
  "phase3/network.mjs",
  "phase3/admission.mjs",
  "phase3/types.ts",
  "phase3/resource-proposal.json",
  "source-boundary.ts",
]) {
  const file = path.join(source, relative);
  const value = fs.readFileSync(file, "utf8");
  sources[path.relative(root, file)] = sha(value);
  fs.mkdirSync(path.dirname(path.join(stage, relative)), { recursive: true });
  fs.writeFileSync(
    path.join(stage, relative),
    value.replaceAll('"../../../src/', '"../core/'),
  );
}
for (const file of list(path.join(root, "packages/v2-map/src"))) {
  if (!file.endsWith(".ts") || file.includes(".test.")) continue;
  const relative = `packages/v2-map/src/${file}`;
  sources[relative] = sha(fs.readFileSync(path.join(root, relative)));
}
fs.writeFileSync(
  path.join(stage, "README.txt"),
  "TASK22 Phase3 local verification bundle. No cloud deploy entry. No external state changes.\n",
);
const files = list(stage);
for (const file of files) {
  fs.chmodSync(path.join(stage, file), 0o644);
  fs.utimesSync(
    path.join(stage, file),
    new Date("2026-01-01T00:00:00Z"),
    new Date("2026-01-01T00:00:00Z"),
  );
}
const zip = path.join(output, "phase3-local-runtime.zip");
fs.rmSync(zip, { force: true });
const packed = spawnSync("zip", ["-X", "-q", zip, ...files], {
  cwd: stage,
  encoding: "utf8",
});
if (packed.status !== 0) throw new Error(packed.stderr);
const manifest = {
  task: "TASK-V2-22",
  phase: "PHASE3",
  status: "LOCAL_VALIDATION_ONLY_CLOUD_NOT_APPLIED",
  externalWrites: 0,
  cloudDeployEntry: null,
  artifact: path.relative(root, zip),
  sha256: sha(fs.readFileSync(zip)),
  sizeBytes: fs.statSync(zip).size,
  sources,
  packagedFiles: files.map((file) => ({
    path: file,
    sha256: sha(fs.readFileSync(path.join(stage, file))),
  })),
};
fs.writeFileSync(
  path.join(output, "artifact-manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  `Phase3 local runtime built: ${files.length} files. Existing deployment bundles untouched.`,
);
