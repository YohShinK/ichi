import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      "packages/v2-map/resources/cloudbase-task21-prepilot-artifacts.json",
    ),
    "utf8",
  ),
);
const errors = [];
const required = new Set([
  "v2-shadow-submit-candidate-upload",
  "v2-shadow-resolve-observation",
  "v2-shadow-answer-assistance",
  "v2-shadow-get-my-assistance",
  "v2-shadow-reconcile-projection",
  "v2-shadow-manage-contribution",
  "v2-shadow-get-public-map-lead-detail",
  "v2-shadow-query-public-map-leads",
]);
const flags = {
  "v2-shadow-query-public-map-leads": "ICHI_V2_SHADOW_READ_ENABLED",
  "v2-shadow-submit-candidate-upload":
    "ICHI_V2_SHADOW_CANDIDATE_UPLOAD_ENABLED",
  "v2-shadow-resolve-observation": "ICHI_V2_SHADOW_RESOLVE_ENABLED",
  "v2-shadow-answer-assistance": "ICHI_V2_SHADOW_HUMAN_ASSISTANCE_ENABLED",
  "v2-shadow-get-my-assistance": "ICHI_V2_SHADOW_HUMAN_ASSISTANCE_ENABLED",
  "v2-shadow-reconcile-projection": "ICHI_V2_SHADOW_PROJECTOR_ENABLED",
  "v2-shadow-manage-contribution": "ICHI_V2_SHADOW_CONTRIBUTION_ENABLED",
  "v2-shadow-get-public-map-lead-detail": "ICHI_V2_SHADOW_READ_ENABLED",
};

for (const entry of manifest.functions) {
  if (!required.delete(entry.name))
    errors.push(`${entry.name}: unexpected function`);
  const zip = path.join(root, entry.artifact);
  if (!fs.existsSync(zip)) {
    errors.push(`${entry.name}: artifact missing`);
    continue;
  }
  const hash = createHash("sha256").update(fs.readFileSync(zip)).digest("hex");
  if (hash !== entry.sha256) errors.push(`${entry.name}: SHA mismatch`);
  const temp = fs.mkdtempSync(
    path.join(os.tmpdir(), "ichi-v2-candidate-validate-"),
  );
  try {
    const unpack = spawnSync("unzip", ["-q", zip, "-d", temp], {
      encoding: "utf8",
    });
    if (unpack.status !== 0) throw new Error(unpack.stderr);
    const pkg = JSON.parse(
      fs.readFileSync(path.join(temp, "package.json"), "utf8"),
    );
    if (
      pkg.engines?.node !== ">=20.19.0 <21" ||
      pkg.dependencies?.["wx-server-sdk"] !== "4.0.2"
    )
      errors.push(`${entry.name}: runtime/dependency mismatch`);
    const index = fs.readFileSync(path.join(temp, "index.js"), "utf8");
    if (!index.includes("cloud.DYNAMIC_CURRENT_ENV"))
      errors.push(`${entry.name}: dynamic current env guard missing`);
    const imported = await import(
      pathToFileURL(path.join(temp, "runtime.mjs")).href
    );
    if (typeof imported.createMain !== "function")
      errors.push(`${entry.name}: main factory missing`);
    const files = spawnSync("unzip", ["-Z1", zip], { encoding: "utf8" })
      .stdout.trim()
      .split("\n")
      .filter((file) => /\.(?:m?js|json)$/u.test(file));
    const source = files
      .map((file) => fs.readFileSync(path.join(temp, file), "utf8"))
      .join("\n");
    const runtime = fs.readFileSync(path.join(temp, "runtime.mjs"), "utf8");
    const localRuntime = fs
      .readFileSync(
        path.join(
          root,
          "packages/v2-map/resources/shadow-functions",
          entry.name,
          "runtime.mjs",
        ),
        "utf8",
      )
      .replaceAll('"../../../src/', '"./core/')
      .replaceAll('"../shared/', '"./shared/');
    if (runtime !== localRuntime)
      errors.push(`${entry.name}: packaged runtime differs from local source`);
    const flagClosed =
      source.includes(`env.${flags[entry.name]} !== "true"`) ||
      source.includes(`env.${flags[entry.name]} === "true"`);
    const boundaryClosed =
      source.includes('env.ICHI_V2_SHADOW_BOUNDARY !== "synthetic_only"') ||
      source.includes('env.ICHI_V2_SHADOW_BOUNDARY === "synthetic_only"');
    if (!flagClosed || !boundaryClosed)
      errors.push(`${entry.name}: flag/boundary not fail-closed`);
    for (const forbidden of [
      /\.callFunction\s*\(/u,
      /\.invokeFunction\s*\(/u,
      /\b(uploadFile|downloadFile|deleteFile|getTempFileURL)\s*\(/u,
      /\bcloud\.storage\b/u,
      /\bconsole\.(log|info|warn|error|debug)\s*\(/u,
      /\.collection\(\s*([`']|\$)/u,
    ]) {
      if (forbidden.test(source))
        errors.push(`${entry.name}: forbidden source ${forbidden}`);
    }
    const collections = new Set();
    for (const [, argument] of source.matchAll(
      /\.collection\(\s*([^)]*)\)/gu,
    )) {
      const literal = /^"(v2Shadow[A-Za-z0-9]+)"\s*$/u.exec(argument);
      if (!literal)
        errors.push(`${entry.name}: dynamic collection ${argument}`);
      else collections.add(literal[1]);
    }
    for (const name of collections)
      if (!entry.collections.includes(name))
        errors.push(`${entry.name}: ${name} outside allowlist`);
    if (source.includes("../../../src/") || source.includes("../shared/"))
      errors.push(`${entry.name}: unresolved import`);
  } catch (error) {
    errors.push(`${entry.name}: ${String(error)}`);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
for (const name of required) errors.push(`${name}: manifest entry missing`);
if (errors.length) {
  for (const item of errors) console.error(item);
  process.exitCode = 1;
} else {
  console.log(
    `PASS: ${manifest.functions.length} candidate artifacts, hashes, allowlists and fail-closed guards`,
  );
}
