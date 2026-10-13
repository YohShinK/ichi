import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
const root = process.cwd(),
  dir = path.resolve(
    root,
    process.argv[2] ?? "artifacts/task22/phase3-live-20261006",
  ),
  source = path.join(root, "packages/v2-map/resources/production/phase3");
const manifest = JSON.parse(
    fs.readFileSync(path.join(dir, "exact-diff-manifest.json")),
  ),
  sha = (b) => createHash("sha256").update(b).digest("hex"),
  generated = [];
try {
  for (const f of manifest.functions) {
    if (sha(fs.readFileSync(path.join(root, f.artifact))) !== f.sha256)
      throw Error("ZIP_DRIFT");
    for (const file of f.files)
      if (
        sha(
          execFileSync("unzip", ["-p", path.join(root, f.artifact), file.path]),
        ) !== file.sha256
      )
        throw Error("SOURCE_DRIFT");
    for (const template of ["network.test.mjs", "security.test.mjs"]) {
      let body = fs.readFileSync(path.join(source, template), "utf8");
      body = body.replace(/from "([^"]+)"/g, (all, p) => {
        if (p === "vitest" || p.startsWith("node:")) return all;
        let target;
        if (
          p.includes("fixtures.test-support") ||
          p.includes("db.test-support")
        )
          target = path.resolve(source, p);
        else target = path.resolve(dir, "candidate", f.name, "phase3", p);
        return `from ${JSON.stringify(target)}`;
      });
      body = body.replace(
        'new URL("../cloudbase-production-resource-proposal.json", import.meta.url)',
        JSON.stringify(
          path.resolve(
            source,
            "../cloudbase-production-resource-proposal.json",
          ),
        ),
      );
      const out = path.join(source, `live-candidate-${f.name}-${template}`);
      fs.writeFileSync(out, body);
      generated.push(out);
    }
  }
  const out = execFileSync(
    "corepack",
    [
      "pnpm",
      "exec",
      "vitest",
      "run",
      ...generated,
      "--reporter=json",
      "--outputFile=" + path.join(dir, "candidate-tests.json"),
    ],
    { cwd: root, maxBuffer: 10 * 1024 * 1024 },
  );
  fs.writeFileSync(path.join(dir, "candidate-tests.log"), out);
  const result = JSON.parse(
    fs.readFileSync(path.join(dir, "candidate-tests.json")),
  );
  if (!result.success || result.numPassedTests < manifest.functions.length * 42)
    throw Error("PACKAGE_TEST_GATE");
  console.log(
    JSON.stringify({
      status: "EXACT_PACKAGES_PASS",
      tests: result.numPassedTests,
      packages: manifest.functions.length,
    }),
  );
} finally {
  for (const p of generated) fs.rmSync(p, { force: true });
}
