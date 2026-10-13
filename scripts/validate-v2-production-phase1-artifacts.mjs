import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const root = process.cwd();
const source = path.join(root, "packages/v2-map/resources/production");
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(source, "cloudbase-production-artifacts.json"),
    "utf8",
  ),
);
const proposal = JSON.parse(
  fs.readFileSync(
    path.join(source, "cloudbase-production-resource-proposal.json"),
    "utf8",
  ),
);
const sha = (v) => createHash("sha256").update(v).digest("hex");
assert.equal(
  manifest.resourceProposalSha256,
  sha(
    fs.readFileSync(
      path.join(source, "cloudbase-production-resource-proposal.json"),
    ),
  ),
);
const banned =
  /v2Shadow|v2-shadow|SYNTHETIC_REHEARSAL|TEST_CALLER|REHEARSAL_HMAC|test-support|verified-fixture|fixtureId|candidateRecordRef|enrollment|fetch\(|https?\.request|cloud\.(?:downloadFile|uploadFile|deleteFile|getTempFileURL)|console\.(?:log|warn|error)|process\.env\.[A-Z_]+\s*=/u;
const forbiddenCollections = [
  "profiles",
  "observationCandidates",
  "drawSubmissions",
  "recognitionJobs",
  "auditEvents",
  "recordCodes",
  "ichiIds",
  "deletionJobs",
  "dailyQuotas",
  "accountRoles",
  "systemSettings",
];
const results = [];
for (const f of manifest.functions) {
  const proposalFn = proposal.functions.find((p) => p.name === f.name);
  assert.deepEqual(f.collectionAllowlist, proposalFn.collectionAllowlist);
  for (const c of forbiddenCollections)
    assert(!f.collectionAllowlist.includes(c));
  assert.equal(sha(fs.readFileSync(path.join(root, f.artifact))), f.sha256);
  assert.equal(f.sourceManifestSha256, sha(JSON.stringify(f.sourceFiles)));
  for (const file of f.sourceFiles)
    assert.equal(sha(fs.readFileSync(path.join(root, file.path))), file.sha256);
  const names = spawnSync("unzip", ["-Z1", path.join(root, f.artifact)], {
    encoding: "utf8",
  });
  assert.equal(names.status, 0);
  assert.deepEqual(
    names.stdout.trim().split("\n").sort(),
    f.packagedFiles.map((p) => p.path).sort(),
  );
  const stage = path.join(
    root,
    "artifacts/task22/phase1/package-staging",
    f.name,
  );
  for (const file of f.packagedFiles) {
    const p = path.join(stage, file.path);
    const data = fs.readFileSync(p);
    assert.equal(sha(data), file.sha256);
    const unpacked = spawnSync(
      "unzip",
      ["-p", path.join(root, f.artifact), file.path],
      { encoding: null },
    );
    assert.equal(unpacked.status, 0);
    assert.equal(sha(unpacked.stdout), file.sha256);
    if (/\.(?:mjs|js)$/u.test(file.path)) {
      const text = data.toString("utf8");
      assert(
        !/\.collection\(\s*[^"'\s]/u.test(text),
        `${f.name}/${file.path}: dynamic SDK collection call`,
      );
      assert(
        !banned.test(text),
        `${f.name}/${file.path}: banned test/network/log dependency`,
      );
      for (const literal of text.matchAll(/\.collection\("([^"]+)"\)/gu)) {
        assert(
          proposal.collections.some((c) => c.name === literal[1]) ||
            ["accounts", "wechatIdentities"].includes(literal[1]),
          literal[1],
        );
      }
      if (!file.path.startsWith("core/"))
        for (const c of forbiddenCollections)
          assert(!new RegExp(`collection\\(["']${c}["']`).test(text));
      assert.equal(
        spawnSync(process.execPath, ["--check", p], { encoding: "utf8" })
          .status,
        0,
      );
    }
  }
  const pkg = JSON.parse(
    fs.readFileSync(path.join(stage, "package.json"), "utf8"),
  );
  assert.equal(pkg.dependencies["wx-server-sdk"], "4.0.2");
  assert.equal(pkg.engines.node, ">=20.19.0 <21");
  assert.equal(f.runtime, "Nodejs20.19");
  const { createMain } = await import(
    pathToFileURL(path.join(stage, "runtime.mjs")).href
  );
  const disabled = await createMain({
    cloud: {
      database: () => {
        throw new Error("disabled touched DB");
      },
    },
    env: {},
  })({});
  assert.equal(disabled.ok, false);
  assert.equal(disabled.code, "SERVICE_UNAVAILABLE");
  results.push({
    name: f.name,
    sha256: f.sha256,
    sourceManifestSha256: f.sourceManifestSha256,
    status: "PASS",
    files: f.packagedFiles.length,
  });
}
fs.writeFileSync(
  path.join(root, "artifacts/task22/phase1/artifact-validation.json"),
  JSON.stringify(
    {
      status: "PASS",
      externalWrites: 0,
      dynamicCollectionAccess:
        "STATIC_LITERAL_SDK_CALLS; PER_ENTRY_CAPABILITY; V1 doc.get only",
      results,
    },
    null,
    2,
  ) + "\n",
);
console.log(`Production artifact validation PASS (${results.length} packages)`);
