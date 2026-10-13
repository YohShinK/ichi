import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { json, digest, check, atomic } from "./store.mjs";

const config = json(process.argv[2]),
  baselineFile = process.argv[3],
  outputFile = process.argv[4];
const output = process.stdout.write.bind(process.stdout);
for (const key of ["log", "warn", "info", "error", "debug"])
  console[key] = () => {};
process.stdout.write = () => true;
process.stderr.write = () => true;
try {
  check(!fs.existsSync(outputFile), "SOURCE_CHECK_ALREADY_ATTEMPTED");
  const expected = json(baselineFile).sources;
  check(expected.length === 50, "EXACT_50_SOURCE_BASELINE_REQUIRED");
  const load = createRequire(path.join(config.sdkRoot, "package.json"));
  const manager = await load(config.managerModule).getCloudBaseManager({
    cloudBaseOptions: { envId: config.environment, region: config.region },
  });
  const auth = manager.currentEnvironment().getAuthConfig(),
    sdk = load("wx-server-sdk");
  sdk.init({
    env: config.environment,
    region: config.region,
    secretId: auth.secretId,
    secretKey: auth.secretKey,
    sessionToken: auth.token,
  });
  const actual = (
    await sdk
      .database()
      .collection("boardObservations")
      .where({ kind: "NETWORK_SOURCE_RECORD", state: "APPROVED" })
      .limit(100)
      .get()
  ).data;
  check(actual.length === 50, "ORIGINAL_SOURCE_COUNT_DRIFT");
  const rows = expected.map((prior) => ({
    sourceId: prior.sourceId,
    sha256: digest(prior),
    preserved:
      digest(actual.find((row) => row.sourceId === prior.sourceId) ?? null) ===
      digest(prior),
  }));
  check(
    rows.every((row) => row.preserved),
    "ORIGINAL_NETWORK_SOURCE_FIELD_DRIFT",
  );
  atomic(outputFile, {
    status: "ORIGINAL_50_PRIVATE_SOURCE_ROWS_EXACTLY_PRESERVED",
    at: new Date().toISOString(),
    baselineSha256: digest(fs.readFileSync(baselineFile)),
    rows,
    businessDataWrites: 0,
  });
  output(
    JSON.stringify({
      status: "ORIGINAL_50_PRIVATE_SOURCE_ROWS_EXACTLY_PRESERVED",
      sources: 50,
      businessDataWrites: 0,
    }) + "\n",
  );
} catch (error) {
  output(
    JSON.stringify({
      status: "SOURCE_PRESERVATION_STOPPED",
      code: /^[A-Z0-9_:-]+$/u.test(error.code ?? "")
        ? error.code
        : "SOURCE_READBACK_FAILED",
    }) + "\n",
  );
  process.exitCode = 1;
}
