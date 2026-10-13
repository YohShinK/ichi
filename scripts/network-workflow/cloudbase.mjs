import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { digest, check } from "./store.mjs";
import { networkContentDigest } from "../../packages/v2-map/resources/production/phase3/network.mjs";
import { networkDecisionId } from "../../packages/v2-map/resources/production/phase3/runtime.mjs";
import { correctFounderNetworkSource } from "../../packages/v2-map/resources/production/phase3/correction.mjs";
import { networkSignedRequest } from "../../packages/v2-map/resources/production/phase3/security.mjs";
import { hash } from "../../packages/v2-map/resources/production/shared/security.mjs";
import { downloadPackage } from "./package-download.mjs";

const names = [
  "resolve-board-observation",
  "reconcile-map-projection",
  "process-map-source-bridge",
  "maintain-official-network-sources",
  "query-public-map-leads",
  "get-public-map-lead-detail",
  "admit-official-network-source",
];
const configKeys = [
  "Runtime",
  "Handler",
  "Timeout",
  "MemorySize",
  "Role",
  "PublicNetConfig",
  "VpcConfig",
  "Layers",
  "Triggers",
  "Environment",
  "InstallDependency",
  "InitTimeout",
  "DiskSize",
  "DeadLetterConfig",
  "L5Enable",
  "AsyncRunEnable",
  "TracingConfig",
  "EnableAuth",
  "ClsTopicId",
  "ClsLogsetId",
  "Type",
];
const variables = (d) =>
  Object.fromEntries(
    (d.Environment?.Variables ?? []).map((v) => [v.Key, v.Value]),
  );
const configuration = (d) =>
  digest(Object.fromEntries(configKeys.map((k) => [k, d[k] ?? null])));
export const createCloudBaseAdapter = async (config) => {
  check(
    typeof config.environment === "string" &&
      config.environment &&
      config.region === "ap-shanghai" &&
      path.isAbsolute(config.managerModule) &&
      path.isAbsolute(config.sdkRoot),
    "EXPLICIT_CLOUDBASE_CONFIG_REQUIRED",
  );
  const load = createRequire(path.join(config.sdkRoot, "package.json"));
  const getManager = load(config.managerModule).getCloudBaseManager;
  const readerManager = await getManager({
    cloudBaseOptions: { envId: config.environment, region: config.region },
  });
  const auth = readerManager.currentEnvironment().getAuthConfig();
  const Manager = load("@cloudbase/manager-node");
  const manager = new Manager({
    ...auth,
    envId: config.environment,
    region: config.region,
  });
  await manager.functions.getFunctionList(100, 0);
  const sdk = load("wx-server-sdk");
  sdk.init({
    env: config.environment,
    region: config.region,
    secretId: auth.secretId,
    secretKey: auth.secretKey,
    sessionToken: auth.token,
  });
  const db = sdk.database();
  const get = async (col, id, source = db) => {
    try {
      const raw = (await source.collection(col).doc(id).get()).data;
      const row = Array.isArray(raw) ? raw[0] : raw;
      if (!row) return null;
      const value = { ...row };
      delete value._id;
      delete value._openid;
      return value;
    } catch (e) {
      if (
        /NOT_EXIST|NOT_FOUND|not exist|not found|-502005/u.test(
          String(e.errCode ?? "") + String(e.message ?? ""),
        )
      )
        return null;
      throw e;
    }
  };
  const listAll = async (name, filter) => {
    const rows = [];
    for (let offset = 0; offset < 2000; offset += 100) {
      const page = (
        await db.collection(name).where(filter).skip(offset).limit(100).get()
      ).data;
      check(Array.isArray(page), "INVENTORY_PAGE_UNAVAILABLE");
      rows.push(...page);
      if (page.length < 100) return rows;
    }
    check(false, "INVENTORY_CAP_REQUIRES_OPERATOR_REVIEW");
  };
  let baseline = null,
    originalPolicy = null,
    desiredPolicy = null,
    windows = new Map(),
    publicReader = null;
  const snapshot = async () => {
    const [policy, control, bridge, features, details] = await Promise.all([
      get("mapControlState", "global:policy"),
      get("mapControlState", "global:network"),
      get("mapSourceBridgeControl", "global:bridge"),
      get("mapControlState", "global:features"),
      Promise.all(
        names.map((n) => readerManager.functions.getFunctionDetail(n)),
      ),
    ]);
    const body = {
      policy,
      control,
      bridge,
      features,
      functions: details.map((d, i) => ({
        name: names[i],
        configurationSha256: configuration(d),
      })),
    };
    return {
      ...body,
      locationPolicy: bridge?.locationPolicy,
      digest: digest(body),
    };
  };
  const capabilityCheck = async () => {
    check(
      /^[a-f0-9]{64}$/u.test(config.expectedNetworkModuleSha256 ?? ""),
      "VERIFIED_PHASE5_DEPLOYMENT_REQUIRED",
    );
    const dir = fs.mkdtempSync(
      path.join(os.tmpdir(), "ichi-network-capability-"),
    );
    try {
      for (const name of names) {
        const file = path.join(dir, name + ".zip");
        await downloadPackage(
          () => readerManager.functions.getFunctionDownloadUrl(name),
          file,
        );
        fs.chmodSync(file, 0o600);
        const source = execFileSync(
          "unzip",
          ["-p", file, "phase3/network.mjs"],
          { maxBuffer: 8 * 1024 * 1024 },
        );
        check(
          digest(source) === config.expectedNetworkModuleSha256,
          "PHASE5_BACKEND_NOT_DEPLOYED_OR_SOURCE_CHANGED",
        );
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };
  const safe = (s) => {
    check(
      s.control?.admissionEnabled === false &&
        s.control.maintenanceEnabled === false &&
        s.control.smokeEnabled === false &&
        s.bridge?.processorEnabled === true,
      "SAFE_CLOSED_BASELINE_REQUIRED",
    );
  };
  const open = async (operation) => {
    const name =
      operation === "ADMIT"
        ? "admit-official-network-source"
        : "maintain-official-network-sources";
    if (windows.has(name)) return;
    const detail = await readerManager.functions.getFunctionDetail(name),
      vars = variables(detail);
    check(
      vars.ICHI_V2_NETWORK_ADMISSION_ENABLED === "false" &&
        vars.ICHI_V2_NETWORK_MAINTENANCE_ENABLED === "false",
      "NETWORK_ENV_GATES_NOT_CLOSED",
    );
    check(
      typeof vars.ICHI_V2_NETWORK_OPS_HMAC_KEY === "string" &&
        vars.ICHI_V2_NETWORK_OPS_HMAC_KEY.length >= 32,
      "TRUSTED_OPS_KEY_REQUIRED",
    );
    if (name === "maintain-official-network-sources")
      check(
        detail.Triggers?.find(
          (t) => t.TriggerName === "network-maintenance-minute",
        )?.Enable === 0,
        "MAINTENANCE_TIMER_MUST_STAY_CLOSED",
      );
    const key =
      operation === "ADMIT"
        ? "ICHI_V2_NETWORK_ADMISSION_ENABLED"
        : "ICHI_V2_NETWORK_MAINTENANCE_ENABLED";
    const controlKey =
      operation === "ADMIT" ? "admissionEnabled" : "maintenanceEnabled";
    windows.set(name, { vars, key, controlKey });
    await manager.functions.updateFunctionConfig({
      name,
      envVariables: { ...vars, [key]: "true" },
      clsTopicId: detail.ClsTopicId,
      clsLogsetId: detail.ClsLogsetId,
    });
    check(
      variables(await readerManager.functions.getFunctionDetail(name))[key] ===
        "true",
      "OPEN_ENV_READBACK_FAILED",
    );
    await db
      .collection("mapControlState")
      .doc("global:network")
      .update({ data: { [controlKey]: true } });
    check(
      (await get("mapControlState", "global:network"))[controlKey] === true,
      "OPEN_CONTROL_READBACK_FAILED",
    );
  };
  const invoke = async (name, payload, vars) => {
    const response = await manager.functions.invokeFunction(
      name,
      networkSignedRequest(
        vars.ICHI_V2_NETWORK_OPS_HMAC_KEY,
        payload,
        Date.now(),
      ),
    );
    const result = JSON.parse(response.RetMsg);
    check(result.ok, result.code ?? "NETWORK_INVOCATION_DENIED");
    return result;
  };
  const adapter = {
    environment: config.environment,
    snapshot,
    async assertSafe(expected) {
      baseline = await snapshot();
      check(baseline.digest === expected, "FRESH_REMOTE_BASELINE_CHANGED");
      safe(baseline);
      for (const name of [
        "admit-official-network-source",
        "maintain-official-network-sources",
      ]) {
        const detail = await readerManager.functions.getFunctionDetail(name),
          vars = variables(detail);
        check(
          vars.ICHI_V2_NETWORK_ADMISSION_ENABLED === "false" &&
            vars.ICHI_V2_NETWORK_MAINTENANCE_ENABLED === "false",
          "NETWORK_ENV_GATES_NOT_CLOSED",
        );
        if (name === "maintain-official-network-sources")
          check(
            detail.Triggers?.find(
              (t) => t.TriggerName === "network-maintenance-minute",
            )?.Enable === 0,
            "TIMER_OPEN",
          );
      }
      await capabilityCheck();
      originalPolicy = baseline.policy;
    },
    async register(record, decision, targetPolicy) {
      check(baseline, "REGISTRATION_BASELINE_REQUIRED");
      desiredPolicy = targetPolicy;
      await db.runTransaction(async (tx) => {
        const policy = await get("mapControlState", "global:policy", tx),
          control = await get("mapControlState", "global:network", tx);
        check(
          [digest(originalPolicy), digest(targetPolicy)].includes(
            digest(policy),
          ),
          "REGISTRATION_POLICY_CHANGED",
        );
        const expectedControl = { ...baseline.control };
        for (const w of windows.values()) expectedControl[w.controlKey] = true;
        check(
          digest(control) === digest(expectedControl),
          "REGISTRATION_CONTROL_CHANGED",
        );
        const id = networkDecisionId(record.sourceId, record.sourceVersion),
          old = await get("boardObservations", id, tx);
        const row = {
          kind: "NETWORK_AUTHORIZED_DECISION",
          lineageId: hash("network-lineage", record.sourceId),
          sourceVersion: record.sourceVersion,
          ...decision,
        };
        check(
          !old || digest(old) === digest(row),
          "IMMUTABLE_TRUSTED_DECISION_CHANGED",
        );
        if (!old)
          await tx.collection("boardObservations").doc(id).set({ data: row });
        if (digest(policy) !== digest(targetPolicy))
          await tx
            .collection("mapControlState")
            .doc("global:policy")
            .set({ data: targetPolicy });
      });
      check(
        digest(await get("mapControlState", "global:policy")) ===
          digest(targetPolicy),
        "REGISTRATION_READBACK_FAILED",
      );
    },
    async admit(record) {
      await open("ADMIT");
      const vars = windows.get("admit-official-network-source").vars;
      // A transport timeout is indeterminate and must use lookup/resume. Only a
      // definitive disabled response permits this bounded cold-config retry.
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          return await invoke(
            "admit-official-network-source",
            { command: "ADMIT", record },
            vars,
          );
        } catch (e) {
          if (e.code !== "NETWORK_SERVICE_DISABLED" || attempt === 3) throw e;
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    },
    async lookup(record) {
      const source = await get(
        "boardObservations",
        `network-source:${record.sourceId}`,
      );
      if (!source) return { state: "ABSENT" };
      if (source.state === "TAKEN_DOWN" || source.noResurrection)
        return { state: "TAKEN_DOWN" };
      if (
        source.sourceVersion !== record.sourceVersion ||
        source.contentDigest !== networkContentDigest(record)
      )
        return { state: "VERSION_CONFLICT" };
      const receipt =
        (await get(
          "mapAuditEvents",
          hash("network-admission", source.observationVersionId),
        )) ??
        (await get(
          "mapAuditEvents",
          hash("network-correction", record.sourceId, record.sourceVersion),
        ));
      if (!receipt) return { state: "UNKNOWN" };
      const instance = await get(
        "boardInstances",
        receipt.boardInstanceId ?? receipt.result?.boardInstanceId,
      );
      if (!instance?.activePublicLeadId) return { state: "UNKNOWN" };
      return {
        state: "ADMITTED",
        receipt: {
          ok: true,
          sourceVersion: record.sourceVersion,
          contentDigest: source.contentDigest,
          observationVersionId: source.observationVersionId,
          boardInstanceId: instance.boardInstanceId,
          publicLeadId: instance.activePublicLeadId,
        },
      };
    },
    async correct(record, decision, expected, targetPolicy, evidenceRef) {
      check(
        baseline &&
          digest(await get("mapControlState", "global:policy")) ===
            digest(originalPolicy),
        "CORRECTION_BASELINE_CHANGED",
      );
      const result = await correctFounderNetworkSource({
        db,
        record,
        decision,
        expected,
        authorityId: baseline.control.curatorAuthorityId,
        evidenceRef,
        nowMs: Date.now(),
      });
      check(result.ok, result.code ?? "CORRECTION_DENIED");
      desiredPolicy = targetPolicy;
      check(
        digest(await get("mapControlState", "global:policy")) ===
          digest(targetPolicy),
        "CORRECTION_POLICY_READBACK_FAILED",
      );
      return result;
    },
    async publicDetail(id) {
      if (!publicReader) {
        check(
          path.isAbsolute(config.publicReaderModule ?? ""),
          "TRUSTED_WECHAT_PUBLIC_READER_REQUIRED",
        );
        const module = await import(config.publicReaderModule);
        publicReader = await module.createReader(config);
      }
      return publicReader.detail(id);
    },
    async takedown(id, expected) {
      const source = await get("boardObservations", `network-source:${id}`);
      check(
        source?.sourceVersion === expected.sourceVersion &&
          source.contentDigest === expected.contentDigest,
        "WITHDRAWAL_EXACT_SOURCE_CHANGED",
      );
      await open("TAKEDOWN");
      return invoke(
        "maintain-official-network-sources",
        { command: "TAKEDOWN", sourceId: id },
        windows.get("maintain-official-network-sources").vars,
      );
    },
    async closeAndVerify() {
      const failures = [];
      for (const [name, window] of windows) {
        try {
          await db
            .collection("mapControlState")
            .doc("global:network")
            .update({ data: { [window.controlKey]: false } });
          const detail = await readerManager.functions.getFunctionDetail(name),
            current = variables(detail);
          await manager.functions.updateFunctionConfig({
            name,
            envVariables: { ...current, [window.key]: "false" },
            clsTopicId: detail.ClsTopicId,
            clsLogsetId: detail.ClsLogsetId,
          });
          check(
            digest(
              variables(await readerManager.functions.getFunctionDetail(name)),
            ) === digest(window.vars),
            "GATE_ENV_RESTORE_READBACK_FAILED",
          );
        } catch {
          failures.push(name);
        }
      }
      if (baseline) {
        const after = await snapshot();
        try {
          safe(after);
          check(
            digest(after.control) === digest(baseline.control) &&
              digest(after.bridge) === digest(baseline.bridge) &&
              digest(after.features) === digest(baseline.features) &&
              digest(after.functions) === digest(baseline.functions),
            "PRIOR_CONFIGURATION_OR_PLAYER_BRIDGE_CHANGED",
          );
          check(
            digest(after.policy) === digest(desiredPolicy ?? originalPolicy),
            "FINAL_POLICY_DRIFT",
          );
        } catch {
          failures.push("FINAL_STATE");
        }
      }
      windows = new Map();
      check(!failures.length, "GATE_RESTORE_OR_PRESERVATION_FAILED");
    },
    async closeReader() {
      if (publicReader) await publicReader.close();
    },
    async readInventory() {
      const [snap, sources, heads] = await Promise.all([
        snapshot(),
        listAll("boardObservations", {
          kind: "NETWORK_SOURCE_RECORD",
          state: "APPROVED",
        }),
        listAll("publicMapLeads", { lifecycleState: "PUBLIC" }),
      ]);
      safe(snap);
      return {
        at: new Date().toISOString(),
        environment: config.environment,
        snapshotDigest: snap.digest,
        networkCount: sources.length,
        publicHeads: heads
          .filter((h) => String(h._id).startsWith("head:"))
          .map((h) => ({
            publicLeadId: h.publicLeadId,
            servedVersion: h.servedVersion,
            sourceIcon: h.sourceIcon ?? h.core?.sourceIcon ?? null,
          })),
        functions: snap.functions,
        playerBridgeEnabled: snap.bridge.processorEnabled,
        gatesClosed: true,
        cloudWrites: 0,
      };
    },
  };
  return adapter;
};
