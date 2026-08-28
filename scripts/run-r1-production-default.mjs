import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const ROOT = process.cwd();
const ENV_ID = "cloud1-d7gxqfwv783a1f131";
const FUNCTION_NAME = "recognize-board";
const CLI = ["--yes", "--package", "@cloudbase/cli@3.8.1", "tcb"];
const TOKEN_FILE = path.join(os.tmpdir(), "ichi-r1-smoke-token");
const require = createRequire(
  path.join(ROOT, "services/cloudbase/functions/recognize-board/package.json"),
);
const Ajv2020 = require("ajv/dist/2020").default;

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}
const selectedCases = String(args.get("--cases") || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const expectedMode = args.get("--expected-mode") || "r1_remaining";
const label = args.get("--label") || "production-default";
const outputPath = path.resolve(
  args.get("--output") ||
    "artifacts/r1-production-migration/2026-08-27/production-experiment.json",
);
if (!selectedCases.length) throw new Error("--cases is required");
if (!fs.existsSync(TOKEN_FILE)) throw new Error("internal smoke token missing");

const parseCliJson = (text) => {
  const starts = [...text]
    .map((character, index) => ({ character, index }))
    .filter(({ character }) => character === "{" || character === "[")
    .map(({ index }) => index);
  for (const start of starts) {
    for (let end = text.length; end > start; end -= 1) {
      if (!["}", "]"].includes(text[end - 1])) continue;
      try {
        return JSON.parse(text.slice(start, end));
      } catch {
        // CloudBase CLI may add progress text around its JSON response.
      }
    }
  }
  throw new Error("cloudbase_cli_json_invalid");
};

const tcb = (...cliArgs) =>
  parseCliJson(
    execFileSync("npx", [...CLI, "-e", ENV_ID, ...cliArgs], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 40 * 1024 * 1024,
    }),
  );

const sha256 = (bytes) =>
  crypto.createHash("sha256").update(bytes).digest("hex");
const loadJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));

const goldenManifest = loadJson(
  "artifacts/remaining-observation-r0-experiment/2026-08-26/goldens.json",
).boards;
const fiveBoardTruth = loadJson(
  "experiments/universal-scene-model/ground-truth.json",
);
const fixtureTruth = loadJson(
  "services/cloudbase/functions/recognize-board/fixtures/golden-four-board-expectations.json",
).find((board) => board.id === "golden-3");
const dimensions = new Map(
  fiveBoardTruth.map((board) => [board.caseId, board]),
);
dimensions.set("case-6-arknights", {
  caseId: "case-6-arknights",
  width: fixtureTruth.width,
  height: fixtureTruth.height,
  price: fixtureTruth.price,
  ipName: fixtureTruth.ipName,
  themeName: fixtureTruth.themeName,
  tiers: fixtureTruth.tiers.map((tier) => ({
    tier: tier.normalizedTier,
    total: tier.total,
    pasted: tier.pasted,
  })),
});

const boardLayoutSchema = loadJson(
  "data/board-layout/schema/board-layout.schema.json",
);
const recognitionContractSchema = loadJson(
  "data/recognition-contract/schema/recognition-contract.schema.json",
);
const contractAjv = new Ajv2020({
  strict: true,
  strictRequired: false,
  allErrors: true,
});
contractAjv.addSchema(boardLayoutSchema);
const validateContract = contractAjv.compile(recognitionContractSchema);

const envDescription = tcb(
  "api",
  "tcb",
  "DescribeEnvs",
  "--api-version",
  "2018-06-08",
  "--body",
  JSON.stringify({ EnvId: ENV_ID }),
  "--json",
);
const envResponse =
  envDescription.Response ||
  envDescription.data?.Response ||
  envDescription.data;
const bucket = envResponse?.EnvList?.[0]?.Storages?.[0]?.Bucket;
if (!bucket) throw new Error("cloudbase_storage_bucket_missing");

const detail = tcb("fn", "detail", FUNCTION_NAME, "--json").data;
const environment = Object.fromEntries(
  (detail?.Environment?.Variables || []).map(({ Key, Value }) => [Key, Value]),
);
if (detail?.Status !== "Active") throw new Error("function_not_active");
if (environment.BOARD_RECOGNITION_MODE !== expectedMode) {
  throw new Error(
    `production_mode_mismatch:${environment.BOARD_RECOGNITION_MODE}`,
  );
}
if (!environment.BOARD_RECOGNITION_INTERNAL_SMOKE_TOKEN) {
  throw new Error("remote_internal_smoke_token_missing");
}
const token = fs.readFileSync(TOKEN_FILE, "utf8").trim();
if (token.length < 32) throw new Error("local_internal_smoke_token_invalid");

const asExchange = (contract, board, fileId) => {
  const contractVersion = contract.contractVersion;
  const response = { ...contract };
  delete response.contractVersion;
  delete response.internalDiagnostics;
  return {
    contractVersion,
    request: {
      requestId: contract.requestId,
      imageRef: fileId,
      image: {
        mediaType: "image/jpeg",
        width: board.width,
        height: board.height,
        acquisition: "camera",
      },
      localeHints: ["zh-CN", "ja-JP"],
    },
    response,
  };
};

const invariantAudit = (contract) => {
  const violations = [];
  for (const tier of contract.draft?.tiers || []) {
    const total = tier.totalTickets;
    const remaining = tier.remainingTickets;
    const pasted = tier.pastedTickets;
    for (const [field, value] of [
      ["totalTickets", total],
      ["remainingTickets", remaining],
      ["pastedTickets", pasted],
    ]) {
      if (value !== null && (!Number.isSafeInteger(value) || value < 0)) {
        violations.push(`${tier.label}:${field}:negative_or_non_integer`);
      }
    }
    if (total !== null && remaining !== null && remaining > total) {
      violations.push(`${tier.label}:remaining_gt_total`);
    }
    if (
      total !== null &&
      remaining !== null &&
      pasted !== null &&
      pasted !== total - remaining
    ) {
      violations.push(`${tier.label}:pasted_not_total_minus_remaining`);
    }
  }
  return { pass: violations.length === 0, violations };
};

const candidateAudit = (trace) => {
  const generated = [];
  for (const total of trace.totalCandidates || []) {
    for (const remaining of trace.remainingCandidates || []) {
      if (total.value <= 0 || remaining.value > total.value) continue;
      generated.push({
        totalTickets: total.value,
        remainingTickets: remaining.value,
        pastedTickets: total.value - remaining.value,
        totalSources: total.sources,
        remainingSources: remaining.sources,
      });
    }
  }
  const canonical = trace.canonical || {};
  const accepted = (candidate) =>
    candidate.totalTickets === canonical.totalTickets &&
    candidate.remainingTickets === canonical.remainingTickets &&
    candidate.pastedTickets === canonical.pastedTickets;
  return {
    generated,
    eliminated: generated
      .filter((candidate) => !accepted(candidate))
      .map((candidate) => ({
        ...candidate,
        reason: "not_canonical_after_constraint_scoring",
      })),
  };
};

const scoreBoard = (board, contract) => {
  const actual = new Map(
    (contract.draft?.tiers || []).map((tier) => [tier.label, tier]),
  );
  const tiers = board.tiers.map((expected) => {
    const found = actual.get(expected.tier) || {};
    const expectedRemaining = expected.total - expected.pasted;
    const values = {
      totalTickets: found.totalTickets ?? null,
      remainingTickets: found.remainingTickets ?? null,
      pastedTickets: found.pastedTickets ?? null,
    };
    return {
      tier: expected.tier,
      groundTruth: {
        totalTickets: expected.total,
        remainingTickets: expectedRemaining,
        pastedTickets: expected.pasted,
      },
      actual: values,
      totalExact: values.totalTickets === expected.total,
      remainingExact: values.remainingTickets === expectedRemaining,
      pastedExact: values.pastedTickets === expected.pasted,
      falseZero: expectedRemaining > 0 && values.remainingTickets === 0,
      falseLive:
        expectedRemaining === 0 &&
        values.remainingTickets !== null &&
        values.remainingTickets > 0,
      decisionSetExact:
        expectedRemaining > 0 ===
        (values.remainingTickets !== null && values.remainingTickets > 0),
    };
  });
  const count = tiers.length;
  const detected = tiers.filter((tier) => actual.has(tier.tier)).length;
  const extra = [...actual.keys()].filter(
    (labelValue) => !tiers.some((tier) => tier.tier === labelValue),
  );
  return {
    tierDetectionExact: detected === count && extra.length === 0,
    detectedTierCount: detected,
    expectedTierCount: count,
    extraTiers: extra,
    totalExact: tiers.filter((tier) => tier.totalExact).length,
    remainingExact: tiers.filter((tier) => tier.remainingExact).length,
    pastedExact: tiers.filter((tier) => tier.pastedExact).length,
    falseZero: tiers.filter((tier) => tier.falseZero).length,
    falseLive: tiers.filter((tier) => tier.falseLive).length,
    decisionSetExact: tiers.filter((tier) => tier.decisionSetExact).length,
    fullBoardTUExact: tiers.every(
      (tier) => tier.totalExact && tier.remainingExact,
    ),
    fullBoardTUPExact: tiers.every(
      (tier) => tier.totalExact && tier.remainingExact && tier.pastedExact,
    ),
    tiers,
  };
};

const results = [];
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
for (const caseId of selectedCases) {
  const manifest = goldenManifest.find((item) => item.caseId === caseId);
  const truth = dimensions.get(caseId);
  if (!manifest || !truth) throw new Error(`unknown_case:${caseId}`);
  const localPath = path.join("/Users/cunfu/Downloads", manifest.filename);
  const bytes = fs.readFileSync(localPath);
  const imageHash = sha256(bytes);
  if (imageHash !== manifest.sha256) {
    throw new Error(`GOLDEN_IMAGE_HASH_MISMATCH:${caseId}`);
  }
  const nonce = crypto.randomBytes(6).toString("hex");
  const jobId = `${label}-${caseId}-${nonce}`
    .replace(/[^a-zA-Z0-9_-]/gu, "-")
    .slice(0, 96);
  const extension = path.extname(localPath).toLowerCase() || ".jpg";
  const cloudPath = `recognition-temp/${jobId}/board${extension}`;
  const fileId = `cloud://${ENV_ID}.${bucket}/${cloudPath}`;
  const eventPath = path.join(os.tmpdir(), `${jobId}.json`);
  const event = {
    contractVersion: "1.0.0",
    requestId: jobId,
    recognitionJobId: jobId,
    recognitionJobToken: "server-only-diagnostic",
    imageFileId: fileId,
    image: {
      mediaType: "image/jpeg",
      width: truth.width,
      height: truth.height,
      byteLength: bytes.length,
      acquisition: "camera",
    },
    internalSmoke: true,
    internalSmokeToken: token,
    internalDiagnostics: true,
  };
  let invocation;
  try {
    tcb("storage", "upload", localPath, cloudPath, "--json");
    fs.writeFileSync(eventPath, JSON.stringify(event), { mode: 0o600 });
    invocation = tcb(
      "fn",
      "invoke",
      FUNCTION_NAME,
      "-d",
      `@${eventPath}`,
      "--json",
    ).data;
  } finally {
    fs.rmSync(eventPath, { force: true });
    try {
      tcb("storage", "rm", cloudPath, "--force", "--json");
    } catch {
      // The production function normally deletes the temporary source itself.
    }
  }
  const contract = JSON.parse(invocation.RetMsg);
  const diagnostics = contract.internalDiagnostics || null;
  const exchange = asExchange(contract, truth, fileId);
  const contractValid = Boolean(validateContract(exchange));
  const invariants = invariantAudit(contract);
  const score = scoreBoard(truth, contract);
  const traceByTier = new Map(
    (diagnostics?.deterministic?.resolver?.tiers || []).map((tier) => [
      tier.tierCode || tier.rawLabel,
      tier,
    ]),
  );
  const rawByTier = new Map(
    (diagnostics?.tiers || []).map((tier) => [
      tier.tierCode || tier.rawLabel,
      tier,
    ]),
  );
  const tierEvidence = [...traceByTier].map(([tierCode, trace]) => ({
    tierCode,
    rawProvider: rawByTier.get(tierCode) || null,
    visibleNumberRuns: trace.visibleNumberRuns,
    visibleOccurrenceCount: trace.visibleOccurrenceCount,
    direction: trace.direction,
    sequenceWarnings: trace.warnings,
    totalTicketsObserved: rawByTier.get(tierCode)?.totalTicketsObserved ?? null,
    pastedTicketsObserved:
      rawByTier.get(tierCode)?.pastedTicketsObserved ?? null,
    candidates: candidateAudit(trace),
    canonical: trace.canonical,
    resolutionKind: trace.resolutionKind,
  }));
  const result = {
    caseId,
    name: manifest.name,
    filename: manifest.filename,
    imageSha256: imageHash,
    cloudRequestId: invocation.RequestId,
    functionRequestId: invocation.FunctionRequestId,
    businessRequestId: contract.requestId,
    invokeResult: invocation.InvokeResult,
    functionDurationMs: invocation.Duration,
    status: contract.status,
    reasonCode: contract.reasonCode || null,
    productionDefaultPath: true,
    explicitModeOverride: false,
    mode: diagnostics?.recognitionMode || null,
    providerRequestId: diagnostics?.providerRequestId || null,
    promptVersion: diagnostics?.promptVersion || null,
    promptHash: diagnostics?.promptHash || null,
    schemaVersion: diagnostics?.schemaVersion || null,
    model: diagnostics?.model || null,
    providerProtocolVersion: diagnostics?.protocolVersion || null,
    providerOutput: {
      rawMessageContent:
        diagnostics?.providerDiagnostic?.rawMessageContent ?? null,
      parsedJson: diagnostics?.providerDiagnostic?.parsedJson ?? null,
      identity: diagnostics?.identity || null,
      tiers: diagnostics?.tiers || [],
    },
    jsonParse: diagnostics?.providerDiagnostic?.jsonParse || {
      pass: false,
      error: "NOT_REACHED",
    },
    jsonSuccess: diagnostics?.providerDiagnostic?.jsonParse?.pass === true,
    ajv: diagnostics?.providerDiagnostic?.ajv || {
      reached: false,
      pass: false,
      errors: [],
    },
    ajvSuccess: diagnostics?.providerDiagnostic?.ajv?.pass === true,
    resolverSuccess: Boolean(
      diagnostics?.deterministic?.resolver || diagnostics?.resolverTrace,
    ),
    recognitionContractValid: contractValid,
    recognitionContractErrors: contractValid ? [] : validateContract.errors,
    invariants,
    latency: diagnostics?.performance || null,
    tokenUsage: {
      promptTokens: diagnostics?.performance?.promptTokens ?? null,
      completionTokens: diagnostics?.performance?.completionTokens ?? null,
      totalTokens: diagnostics?.performance?.totalTokens ?? null,
      imageTokens: diagnostics?.performance?.imageTokens ?? null,
    },
    tierEvidence,
    score,
    contract,
  };
  results.push(result);
  fs.writeFileSync(
    outputPath,
    `${JSON.stringify(
      {
        label,
        generatedAt: new Date().toISOString(),
        environmentId: ENV_ID,
        functionName: FUNCTION_NAME,
        expectedMode,
        results,
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    `${caseId} cloud=${result.cloudRequestId} provider=${result.providerRequestId} mode=${result.mode} contract=${contractValid} invariants=${invariants.pass} falseZero=${score.falseZero}`,
  );
}

const pass = results.every(
  (result) =>
    result.invokeResult === 0 &&
    result.mode === expectedMode &&
    result.jsonSuccess &&
    result.ajvSuccess &&
    (expectedMode !== "r1_remaining" || result.resolverSuccess) &&
    result.recognitionContractValid &&
    result.invariants.pass,
);
const payload = loadJson(path.relative(ROOT, outputPath));
payload.pass = pass;
payload.criticalFailure = !pass;
payload.falseZero = results.reduce(
  (sum, result) => sum + result.score.falseZero,
  0,
);
fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
if (!pass) process.exitCode = 2;
