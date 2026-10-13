import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const miniRoot = path.join(root, "apps/client/miniprogram");
const files = [];
const visit = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(absolute);
    else files.push(absolute);
  }
};
visit(miniRoot);
const relative = (absolute) =>
  path.relative(root, absolute).replaceAll(path.sep, "/");
const productionFiles = files.filter(
  (file) => !/\.(?:test\.ts|map)$/u.test(file),
);
const sourceBytes = productionFiles.reduce(
  (sum, file) => sum + fs.statSync(file).size,
  0,
);
const sourceText = productionFiles
  .filter((file) => /\.(?:ts|js|json|wxml|wxss)$/u.test(file))
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");
const assetFiles = productionFiles.filter((file) =>
  file.startsWith(path.join(miniRoot, "assets") + path.sep),
);
const manifest = assetFiles.map((file) => ({
  path: relative(file),
  bytes: fs.statSync(file).size,
  sha256: createHash("sha256").update(fs.readFileSync(file)).digest("hex"),
  referencedByBasename: sourceText.includes(path.basename(file)),
}));
const hashes = new Map();
for (const item of manifest)
  hashes.set(item.sha256, [...(hashes.get(item.sha256) ?? []), item.path]);
const audit = {
  classification:
    "LOCAL_SOURCE_AND_STATIC_REFERENCE_AUDIT_NOT_FINAL_WECHAT_UPLOAD_BYTES",
  sourceBytes,
  limitBytes: 2 * 1024 * 1024,
  headroomBytes: 2 * 1024 * 1024 - sourceBytes,
  assetBytes: manifest.reduce((sum, item) => sum + item.bytes, 0),
  files: manifest,
  exactDuplicates: [...hashes.values()].filter((paths) => paths.length > 1),
  basenameUnreferencedCandidates: manifest
    .filter((item) => !item.referencedByBasename)
    .map((item) => item.path),
  devOrFixtureInProductionRoot: productionFiles
    .filter((file) =>
      /(?:fixture|__tests__|\.spec\.|\.test\.|\.map$)/u.test(file),
    )
    .map(relative),
};
const outputArg = process.argv.indexOf("--output");
if (outputArg >= 0 && !process.argv[outputArg + 1])
  throw new Error("--output requires a file path");
const output = path.resolve(
  root,
  outputArg >= 0
    ? process.argv[outputArg + 1]
    : "artifacts/task18/package-asset-audit.json",
);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(audit, null, 2)}\n`);
console.log(
  JSON.stringify({
    sourceBytes: audit.sourceBytes,
    headroomBytes: audit.headroomBytes,
    assetBytes: audit.assetBytes,
    assetCount: manifest.length,
    exactDuplicates: audit.exactDuplicates.length,
    unreferencedCandidates: audit.basenameUnreferencedCandidates.length,
    devOrFixtureCount: audit.devOrFixtureInProductionRoot.length,
    output: relative(output),
  }),
);
if (audit.headroomBytes <= 0 || audit.devOrFixtureInProductionRoot.length > 0)
  process.exitCode = 1;
