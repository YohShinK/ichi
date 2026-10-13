import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  guardedDatabase,
  read,
  put,
} from "../packages/v2-map/resources/production/shared/security.mjs";

// Offline ABI probe. Only the transport is replaced; no CloudBase request leaves this process.
const runtimeRoot = process.argv[2];
assert(
  runtimeRoot,
  "Provide an isolated wx-server-sdk@4.0.2 installation directory",
);
const require = createRequire(
  path.join(path.resolve(runtimeRoot), "package.json"),
);
const cloud = require("wx-server-sdk");
const { Db } = require("@cloudbase/database");
const { EJSON } = require("bson");
assert.equal(require("wx-server-sdk/package.json").version, "4.0.2");
assert.equal(require("@cloudbase/database/package.json").version, "1.4.3");
cloud.init({ env: "offline-contract-probe" });
const native = cloud.database();
const wire = [];
const documents = new Map();
Db.reqClass = class OfflineTransport {
  async send(action, params = {}) {
    wire.push({
      action,
      collection: params.collectionName,
      transactional: Boolean(params.transactionId),
    });
    if (action === "database.startTransaction")
      return { transactionId: "offline-tx" };
    if (
      ["database.commitTransaction", "database.abortTransaction"].includes(
        action,
      )
    )
      return {};
    const query = params.query ? EJSON.parse(params.query) : {};
    assert(query._id, "Only single document calls permitted in this probe");
    const key = `${params.collectionName}\0${query._id}`;
    if (action === "database.getDocument")
      return {
        data: {
          list: documents.has(key) ? [EJSON.stringify(documents.get(key))] : [],
        },
      };
    if (action === "database.modifyDocument") {
      documents.set(key, EJSON.parse(params.data));
      return { data: { updated: 1, upsert_id: query._id } };
    }
    throw new Error(`UNEXPECTED_TRANSPORT_OPERATION:${action}`);
  }
};
const db = guardedDatabase(native, [
  "mapControlState",
  "accounts",
  "wechatIdentities",
]);
await put(db.collection("mapControlState"), "probe", {
  kind: "CONTROL",
  epoch: 1,
});
assert.equal((await read(db.collection("mapControlState"), "probe")).epoch, 1);
assert.equal(await read(db.collection("mapControlState"), "missing"), null);
const result = await db.runTransaction(async (tx) => {
  assert.equal(tx.collection("mapControlState").where, undefined);
  assert.equal(tx.collection("accounts").doc("a").set, undefined);
  const before = await read(tx.collection("mapControlState"), "probe");
  await put(tx.collection("mapControlState"), "probe", { ...before, epoch: 2 });
  assert.equal(
    (await read(tx.collection("mapControlState"), "probe")).epoch,
    2,
  );
  return "RETURN_VALUE_PRESERVED";
});
assert.equal(result, "RETURN_VALUE_PRESERVED");
assert.equal((await read(db.collection("mapControlState"), "probe")).epoch, 2);
assert(
  wire.some((r) => r.action === "database.getDocument" && r.transactional),
);
assert(
  wire.some((r) => r.action === "database.modifyDocument" && r.transactional),
);
const report = {
  classification: "OFFLINE_SDK_ABI_PROBE_NOT_LIVE_DATABASE_ACCEPTANCE",
  node: process.version,
  sdk: "wx-server-sdk@4.0.2",
  database: "@cloudbase/database@1.4.3",
  externalRequests: 0,
  transportIntercepted: true,
  setDataUnwrapping: "PASS",
  docGetShapes: "PASS",
  missingDocument: "PASS",
  docOnlyTransaction: "PASS",
  V1ReadOnly: "PASS",
  transactionOwnWriteCache: "PASS",
  returnValue: "PASS",
  wire,
};
fs.writeFileSync(
  "artifacts/task22/phase1/sdk-abi-validation.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log("Offline SDK ABI probe PASS; external requests=0");
