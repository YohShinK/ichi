import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const proposal = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      "packages/v2-map/resources/cloudbase-shadow-resource-proposal.json",
    ),
    "utf8",
  ),
);
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      "packages/v2-map/resources/cloudbase-shadow-function-artifacts-b2-r1.json",
    ),
    "utf8",
  ),
);
const errors = [];
const results = [];
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const forbidden = [
  /\.callFunction\s*\(/u,
  /\.invokeFunction\s*\(/u,
  /\b(uploadFile|downloadFile|deleteFile|getTempFileURL)\s*\(/u,
  /\bcloud\.storage\b/u,
  /\.collection\(\s*([`']|\$)/u,
  /\bconsole\.(log|info|warn|error|debug)\s*\(/u,
  /\brequire\s*\(/u,
];
const featureFlag = {
  "v2-shadow-query-public-map-leads": "ICHI_V2_SHADOW_READ_ENABLED",
  "v2-shadow-get-public-map-lead-detail": "ICHI_V2_SHADOW_READ_ENABLED",
  "v2-shadow-resolve-observation": "ICHI_V2_SHADOW_RESOLVE_ENABLED",
  "v2-shadow-get-my-assistance": "ICHI_V2_SHADOW_HUMAN_ASSISTANCE_ENABLED",
  "v2-shadow-answer-assistance": "ICHI_V2_SHADOW_HUMAN_ASSISTANCE_ENABLED",
  "v2-shadow-reconcile-projection": "ICHI_V2_SHADOW_PROJECTOR_ENABLED",
};
const unzip = (zip, ...args) => {
  const result = spawnSync("unzip", [...args, zip], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout;
};

for (const expected of proposal.newFunctions) {
  const reported = manifest.functions.find(
    (value) => value.name === expected.name,
  );
  if (!reported) {
    errors.push(`${expected.name}: missing manifest entry`);
    continue;
  }
  const zip = path.join(root, reported.artifact);
  if (!fs.existsSync(zip)) {
    errors.push(`${expected.name}: missing artifact`);
    continue;
  }
  const hash = sha256(fs.readFileSync(zip));
  if (reported.sha256 !== hash)
    errors.push(`${expected.name}: SHA-256 mismatch`);
  const names = unzip(zip, "-Z1").trim().split("\n");
  if (
    !names.includes("index.js") ||
    !names.includes("runtime.mjs") ||
    !names.includes("package.json") ||
    !names.includes("core/package.json")
  ) {
    errors.push(`${expected.name}: incomplete artifact`);
  }
  const files = names.filter((name) => /\.(m?js|json)$/u.test(name));
  const contents = new Map();
  for (const file of files) {
    const result = spawnSync("unzip", ["-p", zip, file], { encoding: "utf8" });
    if (result.status !== 0)
      errors.push(`${expected.name}: cannot read ${file}`);
    else contents.set(file, result.stdout);
  }
  const extractRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "ichi-v2-shadow-check-"),
  );
  try {
    const extracted = spawnSync("unzip", ["-q", zip, "-d", extractRoot], {
      encoding: "utf8",
    });
    if (extracted.status !== 0)
      errors.push(`${expected.name}: cannot extract artifact`);
    else {
      const imported = await import(
        pathToFileURL(path.join(extractRoot, "runtime.mjs")).href
      );
      if (typeof imported.createMain !== "function") {
        errors.push(`${expected.name}: missing executable runtime factory`);
      }
    }
  } catch {
    errors.push(`${expected.name}: bundled reference imports do not load`);
  } finally {
    fs.rmSync(extractRoot, { recursive: true, force: true });
  }
  const pkg = JSON.parse(contents.get("package.json") || "{}");
  if (
    pkg.engines?.node !== ">=20.19.0 <21" ||
    pkg.dependencies?.["wx-server-sdk"] !== "4.0.2"
  ) {
    errors.push(`${expected.name}: unexpected runtime/dependency`);
  }
  if (!contents.get("index.js")?.includes("cloud.DYNAMIC_CURRENT_ENV")) {
    errors.push(`${expected.name}: environment binding missing`);
  }
  const runtime = contents.get("runtime.mjs") || "";
  const flagSource = expected.name.includes("public-map-lead")
    ? `${runtime}\n${contents.get("shared/public-read.mjs") || ""}`
    : runtime;
  const flag = featureFlag[expected.name];
  const flagGuard =
    flagSource.includes(`env.${flag} !== "true"`) ||
    flagSource.includes(`env.${flag} === "true"`);
  const boundaryGuard =
    flagSource.includes('env.ICHI_V2_SHADOW_BOUNDARY !== "synthetic_only"') ||
    flagSource.includes('env.ICHI_V2_SHADOW_BOUNDARY === "synthetic_only"');
  if (!flagGuard || !boundaryGuard) {
    errors.push(`${expected.name}: fail-closed flag/boundary guard missing`);
  }
  const source = [...contents.values()].join("\n");
  for (const pattern of forbidden) {
    if (pattern.test(source))
      errors.push(`${expected.name}: forbidden source ${pattern}`);
  }
  if (
    /\b(v1[A-Z][A-Za-z0-9]*|services\/cloudbase|cloud\.storage)\b/u.test(source)
  ) {
    errors.push(`${expected.name}: V1 production or Storage reference`);
  }
  if (source.includes("../../../src/") || source.includes("../shared/")) {
    errors.push(`${expected.name}: unresolved artifact import`);
  }
  const calls = [...source.matchAll(/\.collection\(\s*([^)]*)\)/gu)];
  const collectionNames = new Set();
  for (const [, argument] of calls) {
    const match = /^"(v2Shadow[A-Za-z0-9]+)"\s*$/u.exec(argument);
    if (!match)
      errors.push(
        `${expected.name}: dynamic/non-shadow collection ${argument}`,
      );
    else collectionNames.add(match[1]);
  }
  for (const name of collectionNames) {
    if (!expected.collections.includes(name)) {
      errors.push(`${expected.name}: collection ${name} outside allowlist`);
    }
  }
  const result = {
    name: expected.name,
    sha256: hash,
    collections: [...collectionNames].sort(),
    forbiddenV1StorageFunctionCallDynamicCollectionSecretLogScan: "PASS",
  };
  results.push(result);
}
if (errors.length > 0) {
  console.error(errors.map((value) => `ERROR ${value}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ status: "PASS", results }, null, 2));
}
