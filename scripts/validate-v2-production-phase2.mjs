import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const root = process.cwd(),
  output = path.join(root, "artifacts/task22/phase2");
const sha = (v) => createHash("sha256").update(v).digest("hex");
const manifest = JSON.parse(
  fs.readFileSync(path.join(output, "artifact-manifest.json")),
);
const preflight = JSON.parse(
  fs.readFileSync(path.join(output, "cloud-readonly-preflight.json")),
);
const results = [];
const check = (condition, code) => {
  if (!condition) throw new Error(code);
};
for (const f of manifest.functions) {
  const zip = path.join(root, f.artifact);
  check(sha(fs.readFileSync(zip)) === f.sha256, "ARTIFACT_SHA_MISMATCH");
  const list = spawnSync("unzip", ["-Z1", zip], { encoding: "utf8" });
  const files = list.stdout.trim().split("\n");
  check(
    list.status === 0 && files.length === f.packagedFiles.length,
    "ARTIFACT_FILES_MISMATCH",
  );
  for (const file of f.packagedFiles) {
    check(
      !file.path.includes("..") &&
        !file.path.startsWith("/") &&
        !/(^|\/)\.env($|\.)/u.test(file.path),
      "UNSAFE_ARTIFACT_ENTRY",
    );
    const content = spawnSync("unzip", ["-p", zip, file.path], {
      maxBuffer: 64 * 1024 * 1024,
    });
    check(
      content.status === 0 && sha(content.stdout) === file.sha256,
      "PACKAGED_CONTENT_SHA_MISMATCH",
    );
    check(
      !content.stdout.includes(Buffer.from("shadow-candidate")),
      "SHADOW_RUNTIME_IMPORT_FORBIDDEN",
    );
  }
  let unchanged = null;
  if (f.action === "UPDATE_CODE") {
    const old = preflight.functions.find((row) => row.name === f.name);
    const prior = path.join(root, old.remoteRollbackArtifact);
    check(
      sha(fs.readFileSync(prior)) === old.sha256,
      "REMOTE_ROLLBACK_SHA_MISMATCH",
    );
    const names = spawnSync("unzip", ["-Z1", prior], { encoding: "utf8" })
      .stdout.trim()
      .split("\n")
      .filter((n) => !n.endsWith("/"));
    const allowed =
      f.name === "recognize-draw-tickets" ? "index.js" : "shared/runtime.js";
    for (const n of names)
      if (n !== allowed) {
        const before = spawnSync("unzip", ["-p", prior, n], {
          maxBuffer: 64 * 1024 * 1024,
        }).stdout;
        check(
          f.packagedFiles.find((p) => p.path === n)?.sha256 === sha(before),
          "UNRELATED_V1_PACKAGE_CHANGE",
        );
      }
    check(
      files.filter((n) => !names.includes(n)).join() ===
        "shared/source-bridge-producer.js",
      "UNEXPECTED_V1_NEW_FILE",
    );
    unchanged = names.length - 1;
  }
  results.push({
    name: f.name,
    artifactIntegrity: "PASS",
    preservedRemoteFiles: unchanged,
    cloudWrites: 0,
  });
}

// Run the actual packaged modules, not TS import rewriting or a fake public map.
const stage = path.join(output, "package-staging/process-map-source-bridge");
const fixture = fs.readFileSync(
  path.join(
    root,
    "packages/v2-map/resources/production/phase2/fixtures.test-support.mjs",
  ),
  "utf8",
);
const url = (p) => pathToFileURL(p).href;
const replacements = {
  "../../../../../services/cloudbase/shared/source-bridge-producer.js":
    path.join(stage, "phase2/producer.cjs"),
  "../tests/db.test-support.mjs": path.join(
    root,
    "packages/v2-map/resources/production/tests/db.test-support.mjs",
  ),
  "../shared/security.mjs": path.join(stage, "shared/security.mjs"),
  "./security.mjs": path.join(stage, "phase2/security.mjs"),
  "./source.mjs": path.join(stage, "phase2/source.mjs"),
  "./runtime.mjs": path.join(stage, "phase2/runtime.mjs"),
  "../cloudbase-production-resource-proposal.json": path.join(
    root,
    "packages/v2-map/resources/production/cloudbase-production-resource-proposal.json",
  ),
};
let rewritten = fixture;
for (const [from, to] of Object.entries(replacements))
  rewritten = rewritten.replaceAll(
    JSON.stringify(from),
    JSON.stringify(url(to)),
  );
const temporary = fs.mkdtempSync(
  path.join(os.tmpdir(), "ichi-phase2-validation-"),
);
fs.writeFileSync(path.join(temporary, "fixture.mjs"), rewritten);
try {
  const { setup, NOW } = await import(url(path.join(temporary, "fixture.mjs")));
  const runtime = await import(url(path.join(stage, "phase2/runtime.mjs")));
  const cases = [];
  {
    const s = setup(),
      id = s.record();
    s.permission(id);
    const e = await s.enqueue(id);
    await s.run(e.eventId);
    check(
      s.heads().filter((r) => r.lifecycleState === "PUBLIC").length === 1,
      "UPLOAD_PIPELINE_FAILED",
    );
    check(
      s.heads()[0].recordType === "UPLOAD_RECORD" &&
        s.heads()[0].publicLocation.latitude === 31.23,
      "UPLOAD_PROJECTION_FAILED",
    );
    cases.push({
      case: "finalized_direct_upload",
      result: "PASS",
      publicCount: 1,
    });
  }
  {
    const s = setup(),
      id = s.record("1", { draw: true });
    s.permission(id);
    await s.run((await s.enqueue(id)).eventId);
    const observedAt = s.heads()[0].observedAt;
    s.table("observationCandidates").get(id).publishedSubmissionVersion = 2;
    s.submission(id, 2, 8);
    const update = await s.enqueue(id, "CHANGED");
    check(
      s.heads().every((r) => r.lifecycleState !== "PUBLIC"),
      "HIDE_FIRST_FAILED",
    );
    await s.run(update.eventId);
    const lead = s.heads().find((r) => r.lifecycleState === "PUBLIC");
    check(
      lead.board.tiers[0].remainingTickets === 8 &&
        lead.observedAt === observedAt,
      "DRAW_UPDATE_OR_TIME_FAILED",
    );
    const late = await s.enqueue(id);
    const deletion = await s.enqueue(id, "DELETE");
    await s.run(late.eventId);
    await s.run(deletion.eventId);
    await s.run((await s.enqueue(id)).eventId);
    check(
      s.heads().every((r) => r.lifecycleState !== "PUBLIC"),
      "RESURRECTION_FAILED",
    );
    cases.push({
      case: "exact_draw_update_hide_first_delete_late_event",
      result: "PASS",
      finalPublicCount: 0,
    });
  }
  {
    const s = setup(),
      a = s.record(),
      b = s.record("2");
    s.permission(a, { shareIntent: "DO_NOT_SHARE" });
    const preview = await runtime.previewHistorical(
      s.db,
      [a, b],
      s.policy,
      s.bridge,
      NOW,
    );
    check(
      preview.every((r) => r.decision === "SKIP"),
      "PRIVATE_HISTORY_NOT_SKIPPED",
    );
    check(
      s.accesses.every((a) => a.operation !== "set"),
      "DRYRUN_MUTATED_DATA",
    );
    cases.push({
      case: "historical_DO_NOT_SHARE_and_missing_authorization",
      result: "PASS",
      writes: 0,
      eligible: 0,
    });
  }
  {
    const s = setup(),
      a = s.record("1", { observedAge: 120000 }),
      b = s.record("2", { owner: "b" });
    s.permission(a);
    s.permission(b);
    await s.run((await s.enqueue(a)).eventId);
    await s.run((await s.enqueue(b)).eventId);
    await s.run((await s.enqueue(b, "DELETE")).eventId);
    check(
      s.heads().find((r) => r.lifecycleState === "PUBLIC").contributors
        .length === 1,
      "MULTI_SUPPORT_FAILED",
    );
    cases.push({
      case: "other_owner_support_survives_deletion",
      result: "PASS",
      contributors: 1,
    });
  }
  {
    const s = setup(),
      id = s.record();
    s.permission(id);
    const e = await s.enqueue(id);
    s.injectCrashAfter(1);
    check(
      !(await s.process(e.eventId)).ok &&
        s.table("boardObservations").size === 0,
      "ATOMIC_ROLLBACK_FAILED",
    );
    s.clearCrash();
    s.setTime(NOW + 5000);
    await s.run(e.eventId);
    check(s.heads().length === 1, "RECOVERY_FAILED");
    cases.push({ case: "crash_rollback_retry", result: "PASS" });
  }
  const sdk = process.argv[2];
  const sdkSmoke = [];
  if (sdk) {
    const sdkRoot = path.dirname(path.resolve(sdk));
    check(
      fs.existsSync(path.join(sdkRoot, "wx-server-sdk/package.json")),
      "SDK_PATH_INVALID",
    );
    fs.mkdirSync(path.join(temporary, "node_modules"));
    fs.symlinkSync(
      path.join(sdkRoot, "wx-server-sdk"),
      path.join(temporary, "node_modules/wx-server-sdk"),
      "dir",
    );
    const v1Require = createRequire(
      path.join(
        root,
        "services/cloudbase/functions/verify-prize-tickets/index.js",
      ),
    );
    fs.symlinkSync(
      path.dirname(v1Require.resolve("ajv/package.json")),
      path.join(temporary, "node_modules/ajv"),
      "dir",
    );
    const beforeEnabled = process.env.ICHI_V2_FUNCTION_ENABLED,
      beforeMode = process.env.ICHI_V2_BACKEND_MODE;
    process.env.ICHI_V2_FUNCTION_ENABLED = "false";
    process.env.ICHI_V2_BACKEND_MODE = "production";
    try {
      for (const f of manifest.functions) {
        const dest = path.join(temporary, f.name);
        fs.cpSync(path.join(output, "package-staging", f.name), dest, {
          recursive: true,
        });
        const req = createRequire(path.join(dest, "index.js"));
        const entry = req("./index.js");
        check(typeof entry.main === "function", "ENTRY_ABI_INVALID");
        if (f.action === "CREATE")
          check(
            (await entry.main({})).code === "SERVICE_DISABLED",
            "DISABLED_SDK_SMOKE_FAILED",
          );
        sdkSmoke.push({
          name: f.name,
          entry: "PASS",
          disabledSmoke:
            f.action === "CREATE" ? "PASS" : "NOT_INVOKED_V1_PRESERVED",
        });
      }
    } finally {
      if (beforeEnabled === undefined)
        delete process.env.ICHI_V2_FUNCTION_ENABLED;
      else process.env.ICHI_V2_FUNCTION_ENABLED = beforeEnabled;
      if (beforeMode === undefined) delete process.env.ICHI_V2_BACKEND_MODE;
      else process.env.ICHI_V2_BACKEND_MODE = beforeMode;
    }
  }
  const report = {
    task: "TASK-V2-22",
    phase: "PHASE2",
    data: "SYNTHETIC_ONLY",
    nodeVersion: process.version,
    sdkVersion: sdk
      ? JSON.parse(
          fs.readFileSync(path.join(path.resolve(sdk), "package.json")),
        ).version
      : null,
    artifactValidation: results,
    packagedRuntimeCases: cases,
    sdkSmoke,
    realSDKTransactions: "NOT_RUN_REQUIRES_CLOUD_REHEARSAL",
    realTimerContext: "NOT_RUN_REQUIRES_CLOUD_REHEARSAL",
    externalWrites: 0,
    realRecordsMigrated: 0,
  };
  fs.writeFileSync(
    path.join(output, "local-rehearsal.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    `Phase2 artifact integrity ${results.length}/7; packaged runtime ${cases.length}/5; SDK entries ${sdkSmoke.length}/7; cloud writes 0`,
  );
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
