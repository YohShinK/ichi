import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const name = "v2-shadow-get-my-assistance";
const sourceRoot = path.join(
  root,
  "packages/v2-map/resources/shadow-functions",
);
const outputRoot = path.join(sourceRoot, "artifacts/b2-r4");
const workRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), "ichi-v2-shadow-b2-r4-"),
);
const compileRoot = path.join(workRoot, "compiled");
const stage = path.join(workRoot, name);
const references = [
  "board-instance.ts",
  "verification.ts",
  "source-adapters.ts",
  "projector.ts",
  "public-api.ts",
].map((file) => path.join(root, "packages/v2-map/src", file));
const copy = (from, to, transform = (value) => value) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, transform(fs.readFileSync(from, "utf8")));
};

try {
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
      compileRoot,
      ...references,
    ],
    { cwd: root, encoding: "utf8" },
  );
  if (tsc.status !== 0)
    throw new Error(`reference compile failed: ${tsc.stdout}${tsc.stderr}`);

  const functionRoot = path.join(sourceRoot, name);
  for (const file of ["index.js", "package.json"])
    copy(path.join(functionRoot, file), path.join(stage, file));
  copy(
    path.join(functionRoot, "runtime.mjs"),
    path.join(stage, "runtime.mjs"),
    (source) =>
      source
        .replaceAll('"../../../src/', '"./core/')
        .replaceAll('"../shared/', '"./shared/'),
  );
  const sharedFiles = ["db.mjs", "security.mjs", "verified-fixture.mjs"];
  for (const file of sharedFiles) {
    copy(
      path.join(sourceRoot, "shared", file),
      path.join(stage, "shared", file),
      (source) => source.replaceAll('"../../../src/', '"../core/'),
    );
  }
  for (const file of fs
    .readdirSync(compileRoot)
    .filter((value) => value.endsWith(".js"))) {
    copy(path.join(compileRoot, file), path.join(stage, "core", file));
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
      .filter((value) => value.endsWith(".js"))
      .map((value) => `core/${value}`),
    ...sharedFiles.map((value) => `shared/${value}`),
  ].sort();
  const epoch = new Date("2026-01-01T00:00:00.000Z");
  for (const file of files) fs.utimesSync(path.join(stage, file), epoch, epoch);
  fs.mkdirSync(outputRoot, { recursive: true });
  const zipPath = path.join(outputRoot, `${name}.zip`);
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  const zipped = spawnSync("zip", ["-X", "-q", zipPath, ...files], {
    cwd: stage,
    encoding: "utf8",
  });
  if (zipped.status !== 0) throw new Error(`zip failed: ${zipped.stderr}`);
  const sha256 = createHash("sha256")
    .update(fs.readFileSync(zipPath))
    .digest("hex");
  const manifest = {
    status: "B2_R4_LOCAL_ARTIFACT_PENDING_DEPLOY",
    environmentId: "cloud1-d7gxqfwv783a1f131",
    function: {
      name,
      artifact: path.relative(root, zipPath),
      sha256,
      runtime: "nodejs20.19",
      entry: "index.main",
      collections: [
        "v2ShadowSourceFixtures",
        "v2ShadowHumanAssistanceRequests",
        "v2ShadowControlState",
      ],
      sourceVersion: "v2-19-b2-r4-enrollment",
      deployed: false,
    },
  };
  fs.writeFileSync(
    path.join(
      root,
      "packages/v2-map/resources/cloudbase-shadow-function-artifacts-b2-r4.json",
    ),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  process.stdout.write(`${name} ${sha256} ${files.length} files\n`);
} finally {
  fs.rmSync(workRoot, { recursive: true, force: true });
}
