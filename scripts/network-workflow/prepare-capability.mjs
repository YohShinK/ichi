import "./source-loader.mjs";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { digest, check, json, atomic } from "./store.mjs";

// Read-only fresh package capture and exact one-file candidate preparation.
const config = json(process.argv[2]),
  root = path.resolve(process.argv[3]);
const output = process.stdout.write.bind(process.stdout);
for (const k of ["log", "warn", "info", "error", "debug"])
  console[k] = () => {};
process.stdout.write = () => true;
process.stderr.write = () => true;
const emit = (v) => output(JSON.stringify(v) + "\n");
try {
  check(!fs.existsSync(root), "FRESH_CAPABILITY_DIRECTORY_REQUIRED");
  fs.mkdirSync(root, { recursive: true, mode: 0o700 });
  const load = createRequire(path.join(config.sdkRoot, "package.json"));
  const manager = await load(config.managerModule).getCloudBaseManager({
    cloudBaseOptions: { envId: config.environment, region: config.region },
  });
  const { createCloudBaseAdapter } = await import("./cloudbase.mjs");
  const adapter = await createCloudBaseAdapter(config),
    before = await adapter.snapshot(),
    inventory = await adapter.readInventory();
  check(
    inventory.networkCount === 50 &&
      inventory.gatesClosed &&
      inventory.playerBridgeEnabled,
    "ORIGINAL_50_SAFE_BASELINE_REQUIRED",
  );
  const source = fs
    .readFileSync(
      new URL(
        "../../packages/v2-map/resources/production/phase3/network.mjs",
        import.meta.url,
      ),
      "utf8",
    )
    .replaceAll("../../../src/", "../core/");
  const report = {
    schemaVersion: "ichi-phase5-capability-candidate-v1",
    at: new Date().toISOString(),
    environment: config.environment,
    cloudWrites: 0,
    status: "PREPARING_NOT_DEPLOYED",
    baseline: before,
    inventory,
    networkModuleSha256: digest(source),
    functions: [],
  };
  atomic(path.join(root, "manifest.json"), report);
  for (const f of before.functions) {
    const detail = await manager.functions.getFunctionDetail(f.name),
      vars = Object.fromEntries(
        (detail.Environment?.Variables ?? []).map((v) => [v.Key, v.Value]),
      );
    const address = await manager.functions.getFunctionDownloadUrl(f.name),
      response = await fetch(address.Url, {
        signal: AbortSignal.timeout(30000),
      });
    check(response.ok, "BASELINE_DOWNLOAD_FAILED");
    const oldZip = path.join(root, `${f.name}-rollback.zip`),
      newZip = path.join(root, `${f.name}-candidate.zip`);
    fs.writeFileSync(oldZip, Buffer.from(await response.arrayBuffer()), {
      mode: 0o600,
    });
    fs.copyFileSync(oldZip, newZip);
    const entries = execFileSync("unzip", ["-Z1", oldZip], {
      maxBuffer: 8 * 1024 * 1024,
    })
      .toString()
      .trim()
      .split("\n")
      .filter((p) => !p.endsWith("/"));
    check(
      new Set(entries).size === entries.length &&
        entries.includes("phase3/network.mjs"),
      "UNSAFE_OR_DUPLICATE_ZIP_ENTRIES",
    );
    const hashes = [],
      directory = path.join(root, "candidate", f.name);
    for (const file of entries) {
      check(
        !file.startsWith("/") && !file.split("/").includes(".."),
        "UNSAFE_ZIP_PATH",
      );
      const bytes = execFileSync("unzip", ["-p", oldZip, file], {
        maxBuffer: 64 * 1024 * 1024,
      });
      for (const [key, value] of Object.entries(vars))
        if (
          /SECRET|TOKEN|KEY/u.test(key) &&
          typeof value === "string" &&
          value.length >= 16
        )
          check(
            !bytes.includes(Buffer.from(value)),
            "SECRET_IN_REMOTE_PACKAGE",
          );
      hashes.push({ path: file, sha256: digest(bytes) });
      if (!file.includes("node_modules/")) {
        const dest = path.join(directory, file);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, bytes);
      }
    }
    fs.writeFileSync(path.join(directory, "phase3/network.mjs"), source);
    execFileSync("zip", ["-q", newZip, "phase3/network.mjs"], {
      cwd: directory,
    });
    const changed = [];
    for (const file of hashes)
      if (
        digest(
          execFileSync("unzip", ["-p", newZip, file.path], {
            maxBuffer: 64 * 1024 * 1024,
          }),
        ) !== file.sha256
      )
        changed.push(file.path);
    check(
      changed.length === 1 && changed[0] === "phase3/network.mjs",
      "CANDIDATE_NOT_ONE_FILE_CHANGE",
    );
    check(
      digest(execFileSync("unzip", ["-p", newZip, "phase3/network.mjs"])) ===
        report.networkModuleSha256,
      "CANDIDATE_MODULE_DRIFT",
    );
    report.functions.push({
      ...f,
      rollbackZip: oldZip,
      rollbackSha256: digest(fs.readFileSync(oldZip)),
      candidateZip: newZip,
      candidateSha256: digest(fs.readFileSync(newZip)),
      changed,
      entries: hashes,
    });
    atomic(path.join(root, "manifest.json"), report);
  }
  const after = await adapter.snapshot();
  check(after.digest === before.digest, "BASELINE_CHANGED_DURING_PREPARATION");
  report.status = "FRESH_EXACT_CANDIDATE_READY_NOT_DEPLOYED";
  atomic(path.join(root, "manifest.json"), report);
  emit({
    status: report.status,
    functions: report.functions.length,
    changedFilesPerFunction: 1,
    cloudWrites: 0,
    networkModuleSha256: report.networkModuleSha256,
  });
} catch (e) {
  emit({
    status: "STOPPED_NOT_DEPLOYED",
    code: /^[A-Z0-9_:-]+$/u.test(e.code ?? "")
      ? e.code
      : "CAPABILITY_PREPARATION_FAILED",
  });
  process.exitCode = 1;
}
