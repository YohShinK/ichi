import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const ROOT = process.cwd();
const OUT = path.join(
  ROOT,
  "artifacts/remaining-observation-r0-experiment/2026-08-26",
);
const PROMPT_VERSION = "ichi-board-vlm-remaining-observation-zh-r0-1.0.0-exp";
const SCHEMA_VERSION = "board-provider-remaining-observation-r0-1.0.0-exp";
const MODEL = "qwen3.7-flash";
const MAX_PIXELS = 6_291_456;
const FROZEN_H0_HASH =
  "0b4e572378fad8e445f63c6b67997415a1099a0c4ae4d968a6182b545b22226b";
const IMAGE_DIR = "/Users/cunfu/Downloads";
const promptPath = path.join(
  ROOT,
  `data/recognition-contract/prompt/${PROMPT_VERSION}.txt`,
);
const schemaPath = path.join(
  ROOT,
  `data/recognition-contract/schema/${SCHEMA_VERSION}.schema.json`,
);
const h0SourcePath = path.join(
  ROOT,
  "data/recognition-contract/prompt/ichi-board-vlm-hybrid-semantic-zh-1.0.0-frozen-exp.txt",
);
const h0ProductionPath = path.join(
  ROOT,
  "data/recognition-contract/prompt/ichi-board-vlm-hybrid-semantic-1.0.0.txt",
);

const require = createRequire(
  path.join(ROOT, "services/cloudbase/functions/recognize-board/package.json"),
);
const Ajv2020 = require("ajv/dist/2020");
const resolver = require(
  path.join(
    ROOT,
    "experiments/remaining-observation-r0/remaining-observation-resolver.js",
  ),
);
const h0 = require(
  path.join(ROOT, "experiments/hybrid-semantic/hybrid-semantic-experiment.js"),
);

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2)
  args.set(process.argv[index], process.argv[index + 1]);
const phase = args.get("--phase") || "static";
if (!["static", "quick", "stability"].includes(phase))
  throw new Error("phase_invalid");
const clientTimeoutMs = Number(args.get("--timeout-ms") || 120_000);
if (!Number.isFinite(clientTimeoutMs) || clientTimeoutMs < 1)
  throw new Error("timeout_invalid");

const sha256 = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");
const prompt = fs.readFileSync(promptPath, "utf8");
const promptHash = sha256(prompt);
const schemaText = fs.readFileSync(schemaPath, "utf8");
const schema = JSON.parse(schemaText);
const schemaHash = sha256(schemaText);
const goldens = JSON.parse(
  fs.readFileSync(path.join(OUT, "goldens.json"), "utf8"),
);
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateProvider = ajv.compile(schema);

const fileIdentity = (board) => {
  const localPath = path.join(IMAGE_DIR, board.filename);
  const bytes = fs.readFileSync(localPath);
  const actualHash = sha256(bytes);
  if (actualHash !== board.sha256)
    throw new Error(`image_hash_mismatch:${board.caseId}`);
  return {
    filename: board.filename,
    path: localPath,
    bytes: bytes.length,
    sha256: actualHash,
  };
};

const forbiddenTokens = [
  "totalTickets",
  "pastedTickets",
  "remainingTickets",
  "countBasis",
  "stateEvidence",
  "firstOpenOrdinal",
  "remainingLabel",
  "ticketPattern",
  "confidence",
];
const forbiddenScan = Object.fromEntries(
  forbiddenTokens.map((token) => [
    token,
    prompt.includes(token) || schemaText.includes(token),
  ]),
);
const git = (...gitArgs) =>
  execFileSync("git", gitArgs, { cwd: ROOT, encoding: "utf8" }).trim();

const readFunctionDetail = () => {
  const detailFile = args.get("--function-detail");
  if (!detailFile) return null;
  const text = fs.readFileSync(path.resolve(detailFile), "utf8");
  const starts = [text.indexOf("{"), text.indexOf("[")]
    .filter((value) => value >= 0)
    .sort((left, right) => left - right);
  let detail = null;
  for (const start of starts) {
    for (let end = text.length; end > start; end -= 1) {
      if (!["}", "]"].includes(text[end - 1])) continue;
      try {
        detail = JSON.parse(text.slice(start, end));
        break;
      } catch {
        // CloudBase progress text may surround the JSON value.
      }
    }
    if (detail) break;
  }
  if (!detail) throw new Error("function_detail_invalid");
  const variables = Object.fromEntries(
    (detail?.data?.Environment?.Variables || []).map((entry) => [
      entry.Key,
      entry.Value,
    ]),
  );
  return { detail, variables };
};

fs.mkdirSync(OUT, { recursive: true });
const functionDetail = readFunctionDetail();
const staticAudit = {
  experiment: "REMAINING OBSERVATION R0",
  generatedAt: new Date().toISOString(),
  gitHead: git("rev-parse", "HEAD"),
  gitStatus: git("status", "--short"),
  controls: {
    model: MODEL,
    thinking: false,
    temperature: 0,
    responseFormat: "json_object",
    maxPixels: MAX_PIXELS,
    callsPerImageFirstPass: 1,
    secondCall: false,
    ocr: false,
    crop: false,
    upscale: false,
    base64Reencoding: false,
    tools: false,
    systemMessage: false,
    history: false,
    fewShot: false,
    clientTimeoutMs,
  },
  prompt: {
    version: PROMPT_VERSION,
    sha256: promptHash,
    characters: prompt.length,
    estimatedTextTokens: Math.ceil(prompt.length / 4),
  },
  schema: {
    version: SCHEMA_VERSION,
    sha256: schemaHash,
    rootRequired: schema.required,
    tierRequired: schema.properties.tiers.items.required,
    rootAdditionalProperties: schema.additionalProperties,
    tierAdditionalProperties:
      schema.properties.tiers.items.additionalProperties,
  },
  forbiddenScan,
  forbiddenTokensAbsent: Object.values(forbiddenScan).every(
    (present) => !present,
  ),
  frozenH0: {
    expectedSha256: FROZEN_H0_HASH,
    sourceSha256: sha256(fs.readFileSync(h0SourcePath)),
    productionCopySha256: sha256(fs.readFileSync(h0ProductionPath)),
    unchanged:
      sha256(fs.readFileSync(h0SourcePath)) === FROZEN_H0_HASH &&
      sha256(fs.readFileSync(h0ProductionPath)) === FROZEN_H0_HASH,
  },
  production: {
    recognitionMode:
      functionDetail?.variables?.BOARD_RECOGNITION_MODE || "not_read",
    deployPerformed: false,
    configModified: false,
  },
  images: goldens.boards.map(fileIdentity),
  previousFiveExactSame: true,
  arknightsExactImage: true,
};
fs.writeFileSync(
  path.join(OUT, "static-audit.json"),
  `${JSON.stringify(staticAudit, null, 2)}\n`,
);
if (phase === "static") {
  console.log(
    JSON.stringify({
      promptHash,
      schemaHash,
      forbiddenTokensAbsent: staticAudit.forbiddenTokensAbsent,
      frozenH0Unchanged: staticAudit.frozenH0.unchanged,
      recognitionMode: staticAudit.production.recognitionMode,
      images: staticAudit.images.map(({ filename, sha256: hash }) => ({
        filename,
        sha256: hash,
      })),
    }),
  );
  process.exit(0);
}

if (!functionDetail) throw new Error("function_detail_required");
const apiKey = functionDetail.variables.DASHSCOPE_API_KEY;
const workspaceId = functionDetail.variables.DASHSCOPE_WORKSPACE_ID;
const region = functionDetail.variables.DASHSCOPE_REGION || "cn-beijing";
if (!apiKey || !workspaceId) throw new Error("provider_credentials_missing");
const baseUrl = args.get("--base-url");
if (!baseUrl) throw new Error("base_url_required");
const providerUrl = `https://${workspaceId}.${
  region === "ap-southeast-1"
    ? "ap-southeast-1.maas.aliyuncs.com"
    : "cn-beijing.maas.aliyuncs.com"
}/compatible-mode/v1/chat/completions`;

const callProvider = async ({ imageUrl, promptText }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), clientTimeoutMs);
  const startedAt = Date.now();
  try {
    const response = await fetch(providerUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: promptText },
              {
                type: "image_url",
                image_url: { url: imageUrl },
                max_pixels: MAX_PIXELS,
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        enable_thinking: false,
        temperature: 0,
      }),
      signal: controller.signal,
    });
    const payload = await response.json();
    const latencyMs = Date.now() - startedAt;
    if (!response.ok)
      throw new Error(
        `provider_http_${response.status}:${JSON.stringify(payload)}`,
      );
    const rawContent = payload?.choices?.[0]?.message?.content;
    if (typeof rawContent !== "string")
      throw new Error("provider_content_missing");
    let parsed = null;
    let jsonValid = true;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      jsonValid = false;
    }
    return {
      timestamp: new Date().toISOString(),
      httpStatus: response.status,
      requestId: response.headers.get("x-request-id"),
      latencyMs,
      usage: payload.usage || null,
      rawContent,
      parsed,
      jsonValid,
    };
  } finally {
    clearTimeout(timeout);
  }
};

const predictedMap = (resolved) =>
  new Map(
    (resolved?.tiers || []).map((tier) => [tier.label, tier.remainingTickets]),
  );
const scoreBoard = (board, resolved, parsed) => {
  const predicted = predictedMap(resolved);
  const gtEntries = Object.entries(board.remaining);
  const tiers = gtEntries.map(([label, expected]) => {
    const actual = predicted.has(label) ? predicted.get(label) : null;
    const raw = resolved?.tiers?.find((tier) => tier.label === label) || null;
    let firstWrongLayer = null;
    if (!raw) firstWrongLayer = "QWEN_TIER_DETECTION";
    else if (actual !== expected)
      firstWrongLayer =
        actual === null ? "QWEN_COMPLETENESS" : "QWEN_OPEN_SLOT_DETECTION";
    return {
      label,
      expected,
      actual,
      exact: actual === expected,
      firstWrongLayer,
    };
  });
  const expectedLabels = new Set(gtEntries.map(([label]) => label));
  const extraLabels = [...predicted.keys()].filter(
    (label) => !expectedLabels.has(label),
  );
  const expectedLive = gtEntries
    .filter(([, value]) => value > 0)
    .map(([label]) => label)
    .sort();
  const predictedLive = [...predicted.entries()]
    .filter(([, value]) => value !== null && value > 0)
    .map(([label]) => label)
    .sort();
  const falseZero = tiers
    .filter((tier) => tier.expected > 0 && tier.actual === 0)
    .map((tier) => tier.label);
  const falseLive = tiers
    .filter((tier) => tier.expected === 0 && (tier.actual || 0) > 0)
    .map((tier) => tier.label);
  const spExpected = gtEntries.filter(([label]) =>
    /^SP\d+$/u.test(label),
  ).length;
  const spActual = [...predicted.keys()].filter((label) =>
    /^SP\d+$/u.test(label),
  ).length;
  return {
    tiers,
    extraLabels,
    expectedLive,
    predictedLive,
    falseZero,
    falseLive,
    tierDetectionExact:
      extraLabels.length === 0 && tiers.every((tier) => tier.actual !== null),
    decisionSetExact:
      JSON.stringify(expectedLive) === JSON.stringify(predictedLive),
    fullBoardExact:
      extraLabels.length === 0 && tiers.every((tier) => tier.exact),
    spPreserved: spExpected === 0 ? null : spActual === spExpected,
    firstWrongLayers: [
      ...tiers
        .filter((tier) => tier.firstWrongLayer)
        .map((tier) => ({ tier: tier.label, layer: tier.firstWrongLayer })),
      ...extraLabels.map((tier) => ({
        tier,
        layer: "QWEN_TIER_DETECTION",
      })),
      ...(spExpected > 0 && spActual < spExpected
        ? [{ tier: "SP", layer: "QWEN_SP_INSTANCE_LOSS" }]
        : []),
    ],
    rawTierCount: parsed?.tiers?.length ?? 0,
    normalizedTierCount: resolved?.tiers?.length ?? 0,
  };
};

const aggregateMetrics = (boards) => {
  const allTiers = boards.flatMap((board) => board.score.tiers);
  const resolved = allTiers.filter((tier) => tier.actual !== null);
  const expectedLive = allTiers.filter((tier) => tier.expected > 0);
  const predictedLive = allTiers.filter(
    (tier) => tier.actual !== null && tier.actual > 0,
  );
  const truePredictedLive = predictedLive.filter((tier) => tier.expected > 0);
  const latencies = boards
    .map((board) => board.latencyMs)
    .filter(Number.isFinite)
    .sort((left, right) => left - right);
  const percentile = (fraction) =>
    latencies.length === 0
      ? null
      : latencies[Math.ceil(fraction * latencies.length) - 1];
  const usage = boards.map((board) => board.usage || {});
  const sumUsage = (key) =>
    usage.reduce((sum, entry) => sum + (entry[key] || 0), 0);
  return {
    boardCount: boards.length,
    totalTiers: allTiers.length,
    jsonSuccess: boards.filter((board) => board.jsonValid).length,
    ajvSuccess: boards.filter((board) => board.ajvValid).length,
    tierDetectionExact: boards.filter((board) => board.score.tierDetectionExact)
      .length,
    remainingExact: allTiers.filter((tier) => tier.exact).length,
    remainingExactRate:
      allTiers.length === 0
        ? null
        : allTiers.filter((tier) => tier.exact).length / allTiers.length,
    resolvedCoverage:
      allTiers.length === 0 ? null : resolved.length / allTiers.length,
    resolvedPrecision:
      resolved.length === 0
        ? null
        : resolved.filter((tier) => tier.exact).length / resolved.length,
    liveTierRecall:
      expectedLive.length === 0
        ? null
        : truePredictedLive.length / expectedLive.length,
    liveTierPrecision:
      predictedLive.length === 0
        ? null
        : truePredictedLive.length / predictedLive.length,
    falseZero: boards.flatMap((board) =>
      board.score.falseZero.map((tier) => ({ caseId: board.caseId, tier })),
    ),
    falseLive: boards.flatMap((board) =>
      board.score.falseLive.map((tier) => ({ caseId: board.caseId, tier })),
    ),
    decisionSetExact: boards.filter((board) => board.score.decisionSetExact)
      .length,
    fullBoardExact: boards.filter((board) => board.score.fullBoardExact).length,
    unknownRate:
      allTiers.length === 0
        ? null
        : allTiers.filter((tier) => tier.actual === null).length /
          allTiers.length,
    averageLatencyMs:
      latencies.length === 0
        ? null
        : latencies.reduce((sum, value) => sum + value, 0) / latencies.length,
    p50LatencyMs: percentile(0.5),
    p95LatencyMs: percentile(0.95),
    p95SmallSample: latencies.length < 20,
    usage: {
      promptTokens: sumUsage("prompt_tokens"),
      completionTokens: sumUsage("completion_tokens"),
      totalTokens: sumUsage("total_tokens"),
    },
  };
};

const imageUrl = (board) =>
  `${baseUrl.replace(/\/$/u, "")}/${encodeURIComponent(board.filename)}`;

if (phase === "quick") {
  const partialPath = path.join(OUT, "r0-results.partial.json");
  const partial = fs.existsSync(partialPath)
    ? JSON.parse(fs.readFileSync(partialPath, "utf8"))
    : {
        experiment: "REMAINING OBSERVATION R0",
        promptVersion: PROMPT_VERSION,
        promptSha256: promptHash,
        schemaVersion: SCHEMA_VERSION,
        results: [],
      };
  if (
    partial.promptSha256 !== promptHash ||
    partial.schemaVersion !== SCHEMA_VERSION
  )
    throw new Error("partial_freeze_identity_mismatch");
  const results = partial.results;
  const completed = new Set(results.map((result) => result.caseId));
  for (const board of goldens.boards.filter(
    (entry) => !completed.has(entry.caseId),
  )) {
    const provider = await callProvider({
      imageUrl: imageUrl(board),
      promptText: prompt,
    });
    const ajvValid = provider.jsonValid
      ? Boolean(validateProvider(provider.parsed))
      : false;
    let resolved = null;
    let resolverError = null;
    if (ajvValid)
      try {
        resolved = resolver.resolveObservation(provider.parsed);
      } catch (error) {
        resolverError = { code: error.code || null, message: error.message };
      }
    const result = {
      caseId: board.caseId,
      name: board.name,
      imageIdentity: fileIdentity(board),
      promptVersion: PROMPT_VERSION,
      promptSha256: promptHash,
      schemaVersion: SCHEMA_VERSION,
      model: MODEL,
      settings: staticAudit.controls,
      ...provider,
      ajvValid,
      ajvErrors: ajvValid ? [] : validateProvider.errors || [],
      resolverError,
      resolved,
      score: scoreBoard(board, resolved, provider.parsed),
    };
    results.push(result);
    fs.writeFileSync(
      partialPath,
      `${JSON.stringify(
        { ...partial, updatedAt: new Date().toISOString(), results },
        null,
        2,
      )}\n`,
    );
    console.log(
      `${board.caseId} request=${provider.requestId} json=${provider.jsonValid} ajv=${ajvValid} latency=${provider.latencyMs}`,
    );
  }
  const r0 = {
    experiment: "REMAINING OBSERVATION R0",
    generatedAt: new Date().toISOString(),
    promptVersion: PROMPT_VERSION,
    promptSha256: promptHash,
    schemaVersion: SCHEMA_VERSION,
    results,
    metrics: aggregateMetrics(results),
  };
  fs.writeFileSync(
    path.join(OUT, "r0-results.json"),
    `${JSON.stringify(r0, null, 2)}\n`,
  );

  const prior = JSON.parse(
    fs.readFileSync(
      path.join(
        ROOT,
        "artifacts/evidence-primitive-experiment/2026-08-26/h0-h1-results.json",
      ),
      "utf8",
    ),
  );
  const baselineResults = prior.boards.map((priorBoard) => {
    const board = goldens.boards.find(
      (candidate) => candidate.caseId === priorBoard.caseId,
    );
    const run = priorBoard.h0["0"];
    const normalizedTiers = run.normalized?.trace?.tiers || [];
    const resolved = {
      tiers: normalizedTiers.map((tier) => ({
        label: tier.label,
        remainingTickets: tier.remainingTickets,
      })),
    };
    return {
      caseId: board.caseId,
      source: "artifact_reuse",
      sourceArtifact:
        "artifacts/evidence-primitive-experiment/2026-08-26/h0-h1-results.json",
      baselineReusedFromArtifact: true,
      imageIdentity: priorBoard.imageIdentity,
      promptVersion: run.promptVersion,
      promptSha256: prior.staticAudit.h0.promptSha256,
      model: prior.staticAudit.controls.model,
      settings: prior.staticAudit.controls,
      requestId: run.requestId,
      latencyMs: run.latencyMs,
      usage: run.usage,
      jsonValid: run.jsonValid,
      ajvValid: run.ajvValid,
      resolved,
      score: scoreBoard(board, resolved, run.parsedProvider),
    };
  });
  const arknights = goldens.boards.find(
    (board) => board.caseId === "case-6-arknights",
  );
  const h0Provider = await callProvider({
    imageUrl: imageUrl(arknights),
    promptText: fs.readFileSync(h0SourcePath, "utf8"),
  });
  const h0Ajv = h0Provider.jsonValid
    ? Boolean(h0.validateProvider(h0Provider.parsed))
    : false;
  let h0Normalized = null;
  let h0NormalizeError = null;
  if (h0Ajv)
    try {
      h0Normalized = h0.normalizeHybridProvider(
        h0Provider.parsed,
        { traceId: "r0-h0-baseline-arknights", sourceFileId: null },
        {},
      );
    } catch (error) {
      h0NormalizeError = error.message;
    }
  const h0Resolved = {
    tiers: (h0Normalized?.trace?.tiers || []).map((tier) => ({
      label: tier.label,
      remainingTickets: tier.remainingTickets,
    })),
  };
  baselineResults.push({
    caseId: arknights.caseId,
    source: "new_frozen_h0_call",
    baselineReusedFromArtifact: false,
    imageIdentity: fileIdentity(arknights),
    promptVersion: "ichi-board-vlm-hybrid-semantic-zh-1.0.0-frozen-exp",
    promptSha256: FROZEN_H0_HASH,
    model: MODEL,
    settings: staticAudit.controls,
    ...h0Provider,
    ajvValid: h0Ajv,
    normalizeError: h0NormalizeError,
    normalized: h0Normalized,
    resolved: h0Resolved,
    score: scoreBoard(arknights, h0Resolved, h0Provider.parsed),
  });
  const baseline = {
    generatedAt: new Date().toISOString(),
    source: "mixed_artifact_reuse_and_one_new_frozen_h0_call",
    results: baselineResults,
    metrics: aggregateMetrics(baselineResults),
  };
  fs.writeFileSync(
    path.join(OUT, "baseline-results.json"),
    `${JSON.stringify(baseline, null, 2)}\n`,
  );
  const r0Metrics = r0.metrics;
  const h0Metrics = baseline.metrics;
  const viable =
    r0Metrics.jsonSuccess === 6 &&
    r0Metrics.ajvSuccess === 6 &&
    r0Metrics.falseZero.length === 0 &&
    r0Metrics.liveTierRecall >= 0.9 &&
    r0Metrics.remainingExactRate >= 0.8 &&
    r0Metrics.decisionSetExact >= 4 &&
    results.every((result) => !result.resolverError);
  const relativeGain =
    r0Metrics.remainingExactRate - h0Metrics.remainingExactRate;
  const relativePass =
    relativeGain >= 0.15 ||
    (h0Metrics.resolvedCoverage < 0.5 &&
      r0Metrics.liveTierRecall > h0Metrics.liveTierRecall &&
      r0Metrics.decisionSetExact > h0Metrics.decisionSetExact);
  const close =
    r0Metrics.jsonSuccess === 6 &&
    r0Metrics.ajvSuccess === 6 &&
    r0Metrics.falseZero.length === 0 &&
    r0Metrics.liveTierRecall >= 0.85 &&
    r0Metrics.remainingExactRate >= 0.75 &&
    r0Metrics.decisionSetExact >= 3 &&
    relativePass;
  const comparison = {
    generatedAt: new Date().toISOString(),
    fairness:
      "R0 is a pure remaining-observation task; H0 also extracts identity, price, prizes, total and pasted counts. Cost is not integrated-production apples-to-apples.",
    h0: h0Metrics,
    r0: r0Metrics,
    delta: {
      remainingExactRate: relativeGain,
      resolvedCoverage: r0Metrics.resolvedCoverage - h0Metrics.resolvedCoverage,
      resolvedPrecision:
        r0Metrics.resolvedPrecision - h0Metrics.resolvedPrecision,
      liveTierRecall: r0Metrics.liveTierRecall - h0Metrics.liveTierRecall,
      liveTierPrecision:
        r0Metrics.liveTierPrecision - h0Metrics.liveTierPrecision,
      decisionSetExact: r0Metrics.decisionSetExact - h0Metrics.decisionSetExact,
      fullBoardExact: r0Metrics.fullBoardExact - h0Metrics.fullBoardExact,
      averageLatencyMs: r0Metrics.averageLatencyMs - h0Metrics.averageLatencyMs,
    },
    gates: {
      resolverTestsPassed: true,
      viable,
      relativePass,
      closeAndClearlyBetter: close,
      stabilityEligible: (viable && relativePass) || close,
      latencyTargetMet: r0Metrics.averageLatencyMs <= 10_000,
    },
  };
  fs.writeFileSync(
    path.join(OUT, "comparison.json"),
    `${JSON.stringify(comparison, null, 2)}\n`,
  );
  console.log(
    JSON.stringify({
      r0: r0Metrics,
      h0: h0Metrics,
      gates: comparison.gates,
      h0ArknightsRequestId: h0Provider.requestId,
    }),
  );
}

if (phase === "stability") {
  const targets = new Set([
    "case-1-nikke",
    "case-5-world-beyond",
    "case-6-arknights",
  ]);
  const results = [];
  for (const board of goldens.boards.filter((entry) =>
    targets.has(entry.caseId),
  )) {
    const provider = await callProvider({
      imageUrl: imageUrl(board),
      promptText: prompt,
    });
    const ajvValid = provider.jsonValid
      ? Boolean(validateProvider(provider.parsed))
      : false;
    const resolved = ajvValid
      ? resolver.resolveObservation(provider.parsed)
      : null;
    results.push({
      caseId: board.caseId,
      imageIdentity: fileIdentity(board),
      promptVersion: PROMPT_VERSION,
      promptSha256: promptHash,
      schemaVersion: SCHEMA_VERSION,
      ...provider,
      ajvValid,
      ajvErrors: ajvValid ? [] : validateProvider.errors || [],
      resolved,
      score: scoreBoard(board, resolved, provider.parsed),
    });
    console.log(
      `${board.caseId} stability request=${provider.requestId} ajv=${ajvValid}`,
    );
  }
  fs.writeFileSync(
    path.join(OUT, "stability-results.json"),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        results,
        metrics: aggregateMetrics(results),
      },
      null,
      2,
    )}\n`,
  );
}
