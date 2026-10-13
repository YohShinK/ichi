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
      "packages/v2-map/resources/cloudbase-shadow-function-artifacts-b2-r4.json",
    ),
    "utf8",
  ),
);
const expected = manifest.function;
const errors = [];
const fail = (message) => errors.push(message);
if (
  manifest.environmentId !== "cloud1-d7gxqfwv783a1f131" ||
  expected?.name !== "v2-shadow-get-my-assistance" ||
  expected?.runtime !== "nodejs20.19" ||
  expected?.entry !== "index.main"
) {
  fail("unexpected deployment contract");
}
const zipPath = path.join(root, expected.artifact || "");
if (!fs.existsSync(zipPath)) fail("missing artifact");
const zipBytes = fs.existsSync(zipPath)
  ? fs.readFileSync(zipPath)
  : Buffer.alloc(0);
const hash = createHash("sha256").update(zipBytes).digest("hex");
if (hash !== expected.sha256) fail("artifact SHA-256 mismatch");
const extractRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ichi-b2-r4-check-"));
try {
  const unzip = spawnSync("unzip", ["-q", zipPath, "-d", extractRoot], {
    encoding: "utf8",
  });
  if (unzip.status !== 0) throw new Error(unzip.stderr || "unzip failed");
  const files = fs
    .readdirSync(extractRoot, { recursive: true })
    .filter((file) => /\.(m?js|json)$/u.test(file));
  const source = files
    .map((file) => fs.readFileSync(path.join(extractRoot, file), "utf8"))
    .join("\n");
  const runtime = fs.readFileSync(
    path.join(extractRoot, "runtime.mjs"),
    "utf8",
  );
  const index = fs.readFileSync(path.join(extractRoot, "index.js"), "utf8");
  const pkg = JSON.parse(
    fs.readFileSync(path.join(extractRoot, "package.json"), "utf8"),
  );
  if (
    pkg.engines?.node !== ">=20.19.0 <21" ||
    pkg.dependencies?.["wx-server-sdk"] !== "4.0.2" ||
    !index.includes("cloud.DYNAMIC_CURRENT_ENV")
  ) {
    fail("runtime, dependency, or environment mismatch");
  }
  for (const [label, pattern] of Object.entries({
    functionCall: /\.(callFunction|invokeFunction)\s*\(/u,
    storage:
      /\b(uploadFile|downloadFile|deleteFile|getTempFileURL)\s*\(|\bcloud\.storage\b/u,
    logging: /\bconsole\.(log|info|warn|error|debug)\s*\(/u,
    v1: /\b(v1[A-Z][A-Za-z0-9]*|services\/cloudbase)\b/u,
    require: /\brequire\s*\(/u,
  })) {
    if (pattern.test(source)) fail(`forbidden ${label} reference`);
  }
  const collections = new Set();
  for (const [, arg] of source.matchAll(/\.collection\(\s*([^)]*)\)/gu)) {
    const literal = /^"(v2Shadow[A-Za-z0-9]+)"\s*$/u.exec(arg);
    if (!literal) fail(`dynamic or non-shadow collection: ${arg}`);
    else collections.add(literal[1]);
  }
  for (const collection of collections) {
    if (!expected.collections.includes(collection))
      fail(`collection outside allowlist: ${collection}`);
  }
  if (
    !runtime.includes('event?.action === "ENROLL_TEST_CALLER"') ||
    !runtime.includes('env.ICHI_V2_SHADOW_CALLER_ENROLL_ENABLED !== "true"') ||
    !runtime.includes(
      'env.ICHI_V2_SHADOW_HUMAN_ASSISTANCE_ENABLED !== "true"',
    ) ||
    !runtime.includes('env.ICHI_V2_SHADOW_BOUNDARY !== "synthetic_only"') ||
    !source.includes("cloud.getWXContext()") ||
    !source.includes("timingSafeEqual")
  ) {
    fail("trusted context or fail-closed guard missing");
  }
  const imported = await import(
    pathToFileURL(path.join(extractRoot, "runtime.mjs")).href
  );
  if (typeof imported.createMain !== "function")
    fail("bundled runtime factory missing");
  if (files.length !== 14) fail(`unexpected file count: ${files.length}`);
  if (errors.length === 0) {
    process.stdout.write(
      `${JSON.stringify({ status: "PASS", name: expected.name, sha256: hash, files: files.length, collections: [...collections].sort() }, null, 2)}\n`,
    );
  }
} catch (error) {
  fail(String(error?.message || error));
} finally {
  fs.rmSync(extractRoot, { recursive: true, force: true });
}
if (errors.length) {
  process.stderr.write(
    `${errors.map((error) => `ERROR ${error}`).join("\n")}\n`,
  );
  process.exitCode = 1;
}
