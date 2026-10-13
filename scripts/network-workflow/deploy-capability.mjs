import "./source-loader.mjs";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { digest, check, json, atomic } from "./store.mjs";
import { downloadPackage } from "./package-download.mjs";

const config = json(process.argv[2]),
  plan = json(process.argv[3]),
  authorization = json(process.argv[4]);
const root = path.dirname(path.resolve(process.argv[3])),
  outputFile = path.join(root, process.argv[5] ?? "deployment-receipt.json");
check(path.dirname(outputFile) === root, "RECEIPT_MUST_STAY_IN_PLAN_DIRECTORY");
const output = process.stdout.write.bind(process.stdout);
for (const k of ["log", "warn", "info", "error", "debug"])
  console[k] = () => {};
process.stdout.write = () => true;
process.stderr.write = () => true;
const emit = (v) => output(JSON.stringify(v) + "\n");
const report = {
  at: new Date().toISOString(),
  status: "PREFLIGHT",
  operation: plan.operation,
  planDigest: plan.planDigest,
  functions: [],
  businessDataWrites: 0,
};
let receiptOwned = false;
const save = () => {
  atomic(outputFile, report);
  receiptOwned = true;
};
let stage = "AUTHORIZATION";
try {
  check(
    !fs.existsSync(outputFile),
    "DEPLOYMENT_ALREADY_ATTEMPTED_READ_RECEIPT_FIRST",
  );
  const body = { ...plan };
  delete body.planDigest;
  check(
    digest(body) === plan.planDigest &&
      authorization.schemaVersion ===
        "ichi-network-capability-deploy-authorization-v1" &&
      authorization.actor === "USER" &&
      authorization.operation === plan.operation &&
      authorization.planDigest === plan.planDigest &&
      authorization.environment === plan.environment &&
      authorization.userInstructionRef?.trim() &&
      Date.parse(authorization.expiresAt) > Date.now(),
    "EXACT_DEPLOYMENT_AUTHORIZATION_REQUIRED",
  );
  check(
    config.environment === plan.environment &&
      digest(fs.readFileSync(plan.manifestFile)) === plan.manifestSha256 &&
      plan.functions.length === 7,
    "EXACT_DEPLOYMENT_PLAN_DRIFT",
  );
  const manifest = json(plan.manifestFile),
    compiled = json(
      path.join(path.dirname(plan.manifestFile), "package-validation.json"),
    );
  check(
    compiled.status === "SEVEN_COMPILED_CAPABILITY_PACKAGES_PASS",
    "COMPILED_PACKAGE_GATE_REQUIRED",
  );
  const { createCloudBaseAdapter } = await import("./cloudbase.mjs");
  const adapter = await createCloudBaseAdapter(config);
  const before = await adapter.snapshot(),
    inventory = await adapter.readInventory();
  for (const key of ["policy", "control", "bridge", "features", "functions"])
    check(
      digest(before[key]) === digest(manifest.baseline[key]),
      `DEPLOYMENT_BASELINE_${key.toUpperCase()}_DRIFT`,
    );
  check(
    inventory.networkCount === 50 &&
      inventory.gatesClosed &&
      inventory.playerBridgeEnabled,
    "ORIGINAL_50_SAFE_BASELINE_REQUIRED",
  );
  const load = createRequire(path.join(config.sdkRoot, "package.json"));
  const reader = await load(config.managerModule).getCloudBaseManager({
    cloudBaseOptions: { envId: config.environment, region: config.region },
  });
  const auth = reader.currentEnvironment().getAuthConfig(),
    Manager = load("@cloudbase/manager-node");
  const manager = new Manager({
    ...auth,
    envId: config.environment,
    region: config.region,
  });
  await manager.functions.getFunctionList(100, 0);
  const hashes = (file) =>
    JSON.parse(
      execFileSync(
        "python3",
        [fileURLToPath(new URL("./zip-hashes.py", import.meta.url)), file],
        { maxBuffer: 16 * 1024 * 1024 },
      ),
    );
  const download = async (name, label) => {
    const file = path.join(root, `${label}-${name}.zip`);
    await downloadPackage(
      () => reader.functions.getFunctionDownloadUrl(name),
      file,
    );
    fs.chmodSync(file, 0o600);
    return file;
  };
  const sourceReadback = (f, file, after = false) => {
    const expected = Object.fromEntries(
      f.entries.map((e) => [
        e.path,
        after && e.path === plan.changedFile
          ? plan.networkModuleSha256
          : e.sha256,
      ]),
    );
    const actual = hashes(file);
    check(
      digest(actual) === digest(expected),
      after
        ? "DEPLOYMENT_SOURCE_READBACK_DRIFT"
        : "DEPLOYMENT_REMOTE_SOURCE_CHANGED",
    );
    return Object.keys(actual).length;
  };
  stage = "ALL_TARGET_PREFLIGHT";
  for (const item of plan.functions) {
    const f = manifest.functions.find((x) => x.name === item.name);
    check(
      f &&
        digest(fs.readFileSync(item.candidateZip)) === item.candidateSha256 &&
        digest(fs.readFileSync(item.rollbackZip)) === item.rollbackSha256,
      "APPROVED_PACKAGE_SHA_DRIFT",
    );
    sourceReadback(f, await download(item.name, "predeploy"));
  }
  save();
  let active = null;
  const readService = manager.functions.tcbService,
    readRequest = readService.request.bind(readService);
  readService.request = async (action, params, ...rest) => {
    check(
      [
        "GetFunction",
        "GetFunctionAddress",
        "ListFunctions",
        "DescribeEnvs",
      ].includes(action),
      "UNAPPROVED_DEPLOYMENT_ACTION",
    );
    return readRequest(action, params, ...rest);
  };
  const service = manager.functions.scfService,
    request = service.request.bind(service);
  service.request = async (action, params, ...rest) => {
    check(
      action === "UpdateFunctionIncrementalCode" &&
        active &&
        params.FunctionName === active.name &&
        params.Namespace === plan.environment &&
        !params.DeleteFiles &&
        digest(Buffer.from(params.AddFiles, "base64")) ===
          active.transferSha256,
      "UNAPPROVED_DEPLOYMENT_PAYLOAD",
    );
    check(
      digest(fs.readFileSync(active.candidateZip)) === active.candidateSha256,
      "APPROVED_PACKAGE_SHA_DRIFT",
    );
    const row = report.functions.at(-1);
    row.status = "UPDATE_REQUEST_SENT";
    save();
    const accepted = await request(action, params, ...rest);
    row.requestId = accepted.RequestId ?? null;
    row.status = "UPDATE_REQUEST_ACCEPTED";
    save();
    return accepted;
  };
  for (const item of plan.functions) {
    const f = manifest.functions.find((x) => x.name === item.name);
    stage = `UPDATE:${item.name}`;
    const current = await adapter.snapshot();
    check(
      digest(current.functions) === digest(before.functions),
      "DEPLOYMENT_CONFIGURATION_CHANGED",
    );
    sourceReadback(f, await download(item.name, "immediate-predeploy"));
    // Transport exactly the approved one-file diff, extracted from the frozen full candidate.
    // Incremental SCF updates preserve vendor bytes and avoid an unrelated dependency rebuild.
    const bytes = execFileSync("unzip", [
      "-p",
      item.candidateZip,
      plan.changedFile,
    ]);
    check(
      digest(bytes) === plan.networkModuleSha256,
      "APPROVED_MODULE_SHA_DRIFT",
    );
    const directory = path.join(root, "transfers", item.name);
    fs.mkdirSync(path.join(directory, "phase3"), {
      recursive: true,
      mode: 0o700,
    });
    fs.writeFileSync(path.join(directory, plan.changedFile), bytes, {
      mode: 0o600,
    });
    const transferZip = path.join(directory, "network-diff.zip");
    check(
      !fs.existsSync(transferZip),
      "TRANSFER_ALREADY_EXISTS_INSPECT_PRIOR_ATTEMPT",
    );
    execFileSync("zip", ["-q", "-X", transferZip, plan.changedFile], {
      cwd: directory,
    });
    check(
      digest(hashes(transferZip)) ===
        digest({ [plan.changedFile]: plan.networkModuleSha256 }),
      "TRANSFER_NOT_APPROVED_ONE_FILE_DIFF",
    );
    const transfer = fs.readFileSync(transferZip);
    active = { ...item, transferSha256: digest(transfer) };
    const receipt = {
      name: item.name,
      status: "UPDATE_INTENT_SAVED",
      candidateSha256: item.candidateSha256,
      transferSha256: active.transferSha256,
      transport: "SCF_EXACT_ONE_FILE_INCREMENTAL_FROM_APPROVED_CANDIDATE",
      at: new Date().toISOString(),
    };
    report.functions.push(receipt);
    save();
    await manager.functions.waitFunctionActive(item.name);
    await service.request("UpdateFunctionIncrementalCode", {
      FunctionName: item.name,
      Namespace: plan.environment,
      AddFiles: transfer.toString("base64"),
    });
    await manager.functions.waitFunctionActive(item.name);
    receipt.status = "UPDATE_ACCEPTED_AWAITING_READBACK";
    save();
    receipt.readbackFiles = sourceReadback(
      f,
      await download(item.name, "deployed"),
      true,
    );
    receipt.status = "EXACT_SOURCE_READBACK_PASS";
    save();
    active = null;
  }
  stage = "FINAL_PRESERVATION";
  const after = await adapter.snapshot(),
    afterInventory = await adapter.readInventory();
  for (const key of ["policy", "control", "bridge", "features", "functions"])
    check(
      digest(after[key]) === digest(before[key]),
      `DEPLOYMENT_FINAL_${key.toUpperCase()}_DRIFT`,
    );
  const sortedHeads = (value) =>
    [...value].sort((a, b) => a.publicLeadId.localeCompare(b.publicLeadId));
  check(
    digest(sortedHeads(afterInventory.publicHeads)) ===
      digest(sortedHeads(inventory.publicHeads)) &&
      afterInventory.networkCount === inventory.networkCount,
    "ORIGINAL_50_OR_PLAYER_HEADS_CHANGED",
  );
  const capabilityConfig = {
    ...config,
    expectedNetworkModuleSha256: plan.networkModuleSha256,
  };
  atomic(path.join(root, "config-deployed.json"), capabilityConfig);
  const verified = await createCloudBaseAdapter(capabilityConfig);
  const verifiedSnapshot = await verified.snapshot();
  await verified.assertSafe(verifiedSnapshot.digest);
  await verified.closeAndVerify();
  report.status = "SEVEN_EXACT_CAPABILITY_DEPLOYMENTS_READBACK_PASS_SAFE_STOP";
  report.finishedAt = new Date().toISOString();
  report.original50Preserved = true;
  report.playerAndConfigurationPreserved = true;
  report.gatesClosed = true;
  save();
  emit({
    status: report.status,
    functions: report.functions.length,
    businessDataWrites: 0,
  });
} catch (error) {
  report.status = "STOPPED_CHECK_COMMIT_STATE_BEFORE_RETRY";
  report.stage = stage;
  report.errorCode = /^[A-Z0-9_:-]+$/u.test(error.code ?? "")
    ? error.code
    : "DEPLOYMENT_OPERATION_FAILED";
  if (receiptOwned) save();
  emit({ status: report.status, stage, code: report.errorCode });
  process.exitCode = 1;
}
