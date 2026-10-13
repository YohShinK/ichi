import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const root = process.cwd(),
  out = path.join(root, "artifacts/task22/phase3-live-20261006"),
  src = path.join(root, "packages/v2-map/resources/production");
const baseline = JSON.parse(fs.readFileSync(path.join(out, "baselines.json")));
const sha = (b) => createHash("sha256").update(b).digest("hex");
const list = (dir, base = dir) =>
  fs
    .readdirSync(dir)
    .sort()
    .flatMap((n) =>
      fs.statSync(path.join(dir, n)).isDirectory()
        ? list(path.join(dir, n), base)
        : [path.relative(base, path.join(dir, n))],
    );
const normalize = (v) => v.replaceAll('"../../../src/', '"../core/');
const compiled = path.join(out, "compiled-core");
fs.mkdirSync(compiled, { recursive: true });
const result = spawnSync(
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
if (result.status !== 0) throw Error(result.stdout + result.stderr);
fs.writeFileSync(path.join(compiled, "package.json"), '{"type":"module"}\n');
const canonical = normalize(
  fs.readFileSync(path.join(src, "shared/runtime.mjs"), "utf8"),
);
const replaceSection = (value, name, end) => {
  const a = value.indexOf(name),
    b = value.indexOf(end, a),
    ca = canonical.indexOf(name),
    cb = canonical.indexOf(end, ca);
  if (a < 0 || b < 0 || ca < 0 || cb < 0)
    throw Error("REMOTE_SECTION_ANCHOR_MISMATCH");
  return value.slice(0, a) + canonical.slice(ca, cb) + value.slice(b);
};
const patchRuntime = (value) => {
  // Replace only Phase3 public-read and projector sections. Consent, owner,
  // reporting, HA, resolver, rate limiting and each original entry/config stay.
  value = replaceSection(
    value,
    "const publicRead = async",
    "const enqueue = async",
  );
  value = replaceSection(
    value,
    "const project = async",
    "const consent = async",
  );
  value = value.replace(
    'import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";',
    'import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";\nimport { networkSmokeReadTime, networkVisibleToCaller } from "../phase3/security.mjs";',
  );
  if (!/export \{ prepareSelection, resolve, project/u.test(value))
    value +=
      "\nexport { prepareSelection, resolve, project, enqueue, link };\n";
  return value;
};
const targets = [
  ...baseline.functions.map((f) => ({
    name: f.name,
    action: "UPDATE",
    before: f,
  })),
  ...["admit-official-network-source", "maintain-official-network-sources"].map(
    (name) => ({ name, action: "CREATE" }),
  ),
];
const manifest = {
  task: "TASK-V2-22",
  phase: "PHASE3_PRODUCTION",
  status: "EXACT_DIFF_READY_NOT_APPLIED",
  baselineAt: baseline.at,
  authorization: "CURRENT_USER_PHASE3_PRODUCTION_7_ITEMS",
  externalWrites: 0,
  functions: [],
  indexes: JSON.parse(
    fs.readFileSync(path.join(src, "phase3/resource-proposal.json")),
  ).indexes,
  controls: {
    networkAdmissionEnabled: false,
    networkMaintenanceEnabled: false,
    playerControls: "PRESERVE",
    curatorAuthorityId: "ichi-official-founder",
    smokeSourceLimit: 3,
  },
  timer: {
    functionName: "maintain-official-network-sources",
    name: "network-maintenance-minute",
    cron: "0 */1 * * * * *",
    functionGate: false,
    controlGate: false,
  },
};
for (const target of targets) {
  const stage = path.join(out, "candidate", target.name);
  fs.rmSync(stage, { recursive: true, force: true });
  fs.mkdirSync(stage, { recursive: true });
  if (target.before) {
    for (const f of target.before.sourceFiles) {
      const p = path.join(out, "baseline", target.name, f.path),
        v = fs.readFileSync(p);
      if (sha(v) !== f.sha256) throw Error("FRESH_BASELINE_DRIFT");
      fs.mkdirSync(path.dirname(path.join(stage, f.path)), { recursive: true });
      fs.writeFileSync(path.join(stage, f.path), v);
    }
  } else {
    fs.writeFileSync(
      path.join(stage, "package.json"),
      JSON.stringify(
        {
          name: target.name,
          version: "1.0.0",
          private: true,
          main: "index.js",
          engines: { node: ">=20.19.0 <21" },
          dependencies: { "wx-server-sdk": "4.0.2" },
        },
        null,
        2,
      ) + "\n",
    );
    fs.writeFileSync(
      path.join(stage, "index.js"),
      `"use strict";\nexports.main = async (event = {}, invocation = {}) => {\n const [{ default: cloud }, { createNetworkMain }] = await Promise.all([import("wx-server-sdk"), import("./phase3/runtime.mjs")]);\n cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });\n return createNetworkMain({cloud, env:process.env, operation:${JSON.stringify(target.name.startsWith("admit-") ? "admission" : "maintenance")}})(event, invocation);\n};\n`,
    );
  }
  const write = (relative, value) => {
    fs.mkdirSync(path.dirname(path.join(stage, relative)), { recursive: true });
    fs.writeFileSync(path.join(stage, relative), value);
  };
  for (const file of list(compiled))
    write(`core/${file}`, fs.readFileSync(path.join(compiled, file)));
  for (const n of ["network", "admission", "security", "runtime"])
    write(
      `phase3/${n}.mjs`,
      normalize(fs.readFileSync(path.join(src, `phase3/${n}.mjs`), "utf8")),
    );
  for (const n of ["admission", "security", "source", "metadata"]) {
    const relative = `phase2/${n}.mjs`;
    if (!fs.existsSync(path.join(stage, relative)))
      write(
        relative,
        normalize(fs.readFileSync(path.join(src, relative), "utf8")),
      );
  }
  for (const n of ["domain", "security", "uploaded-v1-consent"]) {
    const relative = `shared/${n}.mjs`;
    if (n === "domain" || !fs.existsSync(path.join(stage, relative)))
      write(
        relative,
        normalize(fs.readFileSync(path.join(src, relative), "utf8")),
      );
  }
  if (target.before) {
    const relative =
      target.name === "process-map-source-bridge"
        ? "phase2/pipeline.mjs"
        : "shared/runtime.mjs";
    write(
      relative,
      patchRuntime(fs.readFileSync(path.join(stage, relative), "utf8")).replace(
        /"supportedSchemaVersions",\n {2}\],/g,
        '"supportedSchemaVersions",\n    "networkSmokeRead",\n  ],',
      ),
    );
    if (!fs.existsSync(path.join(stage, "shared/runtime.mjs"))) {
      write("shared/runtime.mjs", canonical);
      write(
        "shared/source-wake.mjs",
        fs.readFileSync(path.join(src, "shared/source-wake.mjs")),
      );
    }
  } else {
    write("shared/runtime.mjs", canonical);
    write(
      "shared/source-wake.mjs",
      fs.readFileSync(path.join(src, "shared/source-wake.mjs")),
    );
  }
  const files = list(stage),
    changes = [];
  for (const file of files) {
    const p = path.join(stage, file),
      digest = sha(fs.readFileSync(p)),
      before = target.before?.sourceFiles.find((f) => f.path === file)?.sha256;
    if (digest !== before) {
      changes.push({
        path: file,
        action: before ? "UPDATE" : "ADD",
        beforeSha256: before ?? null,
        afterSha256: digest,
      });
      if (before) {
        const delta = spawnSync(
          "diff",
          ["-u", path.join(out, "baseline", target.name, file), p],
          { encoding: "utf8" },
        ).stdout;
        const dest = path.join(out, "exact-diff", target.name, file + ".diff");
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, delta);
      }
    }
    fs.chmodSync(p, 0o644);
    fs.utimesSync(
      p,
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-01-01T00:00:00Z"),
    );
  }
  const zip = path.join(out, `candidate-${target.name}.zip`);
  fs.rmSync(zip, { force: true });
  const packed = spawnSync("zip", ["-X", "-q", zip, ...files], {
    cwd: stage,
    encoding: "utf8",
  });
  if (packed.status !== 0) throw Error(packed.stderr);
  manifest.functions.push({
    name: target.name,
    action: target.action,
    artifact: path.relative(root, zip),
    sha256: sha(fs.readFileSync(zip)),
    runtime: "Nodejs20.19",
    handler: "index.main",
    timeout: target.before?.timeout ?? 30,
    memorySize: target.before?.memorySize ?? 256,
    configurationBeforeSha256: target.before?.configurationSha256 ?? null,
    configDelta:
      target.action === "CREATE"
        ? "NEW_DISABLED_NETWORK_CONFIG"
        : ["query-public-map-leads", "get-public-map-lead-detail"].includes(
              target.name,
            )
          ? "ADD_NETWORK_OPS_HMAC_KEY_ONLY"
          : "PRESERVE",
    changes,
    files: files.map((file) => ({
      path: file,
      sha256: sha(fs.readFileSync(path.join(stage, file))),
    })),
  });
}
fs.writeFileSync(
  path.join(out, "exact-diff-manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    status: manifest.status,
    functions: manifest.functions.map((f) => ({
      name: f.name,
      action: f.action,
      changedFiles: f.changes.length,
      totalFiles: f.files.length,
    })),
    indexAdds: manifest.indexes.length,
    playerControls: "PRESERVE",
    networkDefault: "CLOSED",
  }),
);
