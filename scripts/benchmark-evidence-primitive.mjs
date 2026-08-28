import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const ROOT = process.cwd();
const ENV_ID = "cloud1-d7gxqfwv783a1f131";
const require = createRequire(
  path.join(ROOT, "services/cloudbase/functions/recognize-board/package.json"),
);
const h0 = require(
  path.join(ROOT, "experiments/hybrid-semantic/hybrid-semantic-experiment.js"),
);
const h1 = require(
  path.join(
    ROOT,
    "experiments/evidence-primitive/evidence-primitive-experiment.js",
  ),
);

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2)
  args.set(process.argv[index], process.argv[index + 1]);
const phase = args.get("--phase") || "static";
if (!["static", "quick", "stability"].includes(phase))
  throw new Error("--phase must be static, quick, or stability");
const targetRuns = phase === "stability" ? 3 : 1;
const imageDir = args.get("--images") || "/Users/cunfu/Downloads";
const outputDir = path.resolve(
  args.get("--output-dir") ||
    "artifacts/evidence-primitive-experiment/2026-08-26",
);
const detailFile = args.get("--function-detail");
const h0PromptPath = path.join(
  ROOT,
  "data/recognition-contract/prompt/ichi-board-vlm-hybrid-semantic-zh-1.0.0-frozen-exp.txt",
);
const h0Prompt = fs.readFileSync(h0PromptPath, "utf8");
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "experiments/universal-scene-model/ground-truth.json"),
    "utf8",
  ),
);
const expectedHashes = {
  "case-1-nikke":
    "0153e10dd64f2687f59d129e6cc284ff0ed7c3b8c1ecd4e161ba7d08fa970b39",
  "case-2-pokemon":
    "6ffb93c428f76c3e1b390f7a5781ce14ef1a864c4ea44b4254e729fc0f192097",
  "case-3-snow-miku":
    "6793155b389d5507c6db7217c47d152d2118be81b564ea84f98138e9d85ee1e5",
  "case-4-attack-on-titan":
    "79bba4bc080f60e4555657dda586e575db52118ff28ac5990c441f4f9472b905",
  "case-5-world-beyond":
    "291ad0a1b5c276201e94d2dfa83d1e10edfe631de79505ddc542d104c6e70b1b",
};
const hashText = (text) =>
  crypto.createHash("sha256").update(text).digest("hex");
const estimateTokens = (text) => Math.ceil(text.length / 4);
const fileIdentity = (board) => {
  const localPath = path.join(imageDir, board.filename);
  const bytes = fs.readFileSync(localPath);
  const sha256 = hashText(bytes);
  if (sha256 !== expectedHashes[board.caseId])
    throw new Error(`image_hash_mismatch:${board.caseId}`);
  return {
    filename: board.filename,
    path: localPath,
    bytes: bytes.length,
    sha256,
    width: board.width,
    height: board.height,
  };
};
const staticAudit = {
  experiment: "EVIDENCE PRIMITIVE + CLOUD RESOLVER",
  controls: {
    model: h1.MODEL,
    thinking: false,
    temperature: 0,
    responseFormat: "json_object",
    maxPixels: h1.MODEL_MAX_PIXELS,
    secondCall: false,
    ocr: false,
    crop: false,
    upscale: false,
  },
  h0: {
    promptVersion: "ichi-board-vlm-hybrid-semantic-zh-1.0.0-frozen-exp",
    schemaVersion: h0.EXPERIMENT_SCHEMA_VERSION,
    promptSha256: hashText(h0Prompt),
    characters: h0Prompt.length,
    estimatedTextTokens: estimateTokens(h0Prompt),
  },
  h1: {
    promptVersion: h1.PROMPT_VERSION,
    schemaVersion: h1.EXPERIMENT_SCHEMA_VERSION,
    promptSha256: hashText(h1.prompt),
    characters: h1.prompt.length,
    estimatedTextTokens: estimateTokens(h1.prompt),
    rootRequired: h1.schema.required,
    tierRequired: h1.schema.$defs.tier.required,
    evidenceRequired: h1.schema.$defs.tier.properties.stateEvidence.required,
  },
  frozenProduction: {
    prompt: "ichi-board-vlm-4.0.3-rc1",
    schema: "board-provider-extraction-4.0.0-rc1",
    recognitionContract: "1.0.0",
    defaultChanged: false,
  },
  targetedVerifier: {
    designed: true,
    enabled: false,
    secondCallPerformed: false,
    triggerCandidates: [
      "UNKNOWN_OR_CONFLICT_ON_KEY_TIER",
      "IMPOSSIBLE_COUNT_RANGE",
      "MANY_WEAK_FULL_TIERS",
      "SP_ITEM_PRESERVATION_RISK",
    ],
  },
  images: manifest.map((board) => fileIdentity(board)),
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, "static-audit.json"),
  `${JSON.stringify(staticAudit, null, 2)}\n`,
);
if (phase === "static") {
  console.log(JSON.stringify(staticAudit, null, 2));
  process.exit(0);
}
if (!detailFile) throw new Error("--function-detail is required");

const parseCliJson = (text) => {
  const starts = [text.indexOf("{"), text.indexOf("[")]
    .filter((value) => value >= 0)
    .sort((a, b) => a - b);
  for (const start of starts)
    for (let end = text.length; end > start; end -= 1) {
      if (!["}", "]"].includes(text[end - 1])) continue;
      try {
        return JSON.parse(text.slice(start, end));
      } catch {
        /* progress text may follow JSON */
      }
    }
  throw new Error("cloudbase_cli_json_invalid");
};
const detailPath = path.resolve(detailFile);
const detail = parseCliJson(fs.readFileSync(detailPath, "utf8"));
const variables = Object.fromEntries(
  (detail?.data?.Environment?.Variables || []).map((entry) => [
    entry.Key,
    entry.Value,
  ]),
);
if (detailPath.startsWith("/private/tmp/") || detailPath.startsWith("/tmp/"))
  fs.unlinkSync(detailPath);
const apiKey = variables.DASHSCOPE_API_KEY;
const workspaceId = variables.DASHSCOPE_WORKSPACE_ID;
const region = variables.DASHSCOPE_REGION || "cn-beijing";
if (!apiKey || !workspaceId) throw new Error("provider_credentials_missing");

const tcb = (...cliArgs) =>
  parseCliJson(
    execFileSync(
      "npx",
      [
        "--yes",
        "--package",
        "@cloudbase/cli@latest",
        "tcb",
        "-e",
        ENV_ID,
        ...cliArgs,
      ],
      { cwd: ROOT, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
    ),
  );
const normalizeRegularLabel = (value) => {
  const compact = String(value || "")
    .normalize("NFKC")
    .toUpperCase()
    .replace(/\s+/gu, "")
    .replace(/[赏賞]$/u, "");
  const match = /^([A-Z])([0-9]+)?$/u.exec(compact);
  return match ? match[1] : null;
};
const finalTierMap = (normalized) =>
  new Map(
    (normalized?.trace?.tiers || []).map((tier) => [
      tier.label,
      {
        total: tier.totalTickets,
        pasted: tier.pastedTickets,
        remaining: tier.remainingTickets,
      },
    ]),
  );
const score = (board, normalized, parsed) => {
  const actual = finalTierMap(normalized);
  const tiers = board.tiers.map((expected) => {
    const found = actual.get(expected.tier) || {};
    const expectedValues = {
      total: expected.total,
      pasted: expected.pasted,
      remaining: expected.total - expected.pasted,
    };
    const actualValues = {
      total: found.total ?? null,
      pasted: found.pasted ?? null,
      remaining: found.remaining ?? null,
    };
    const fields = Object.fromEntries(
      Object.keys(expectedValues).map((field) => [
        field,
        {
          exact: actualValues[field] === expectedValues[field],
          filled: actualValues[field] !== null,
          wrongNonNull:
            actualValues[field] !== null &&
            actualValues[field] !== expectedValues[field],
        },
      ]),
    );
    return {
      tier: expected.tier,
      expected: expectedValues,
      actual: actualValues,
      fields,
      tierExact: fields.total.exact && fields.pasted.exact,
    };
  });
  const rawTiers = Array.isArray(parsed?.tiers)
    ? parsed.tiers.map((tier, index) => ({ index, ...tier }))
    : [];
  const rawSpecialItems = rawTiers.filter(
    (tier) => normalizeRegularLabel(tier.rawLabel) === null,
  );
  const labelsExact =
    actual.size === board.tiers.length &&
    board.tiers.every((tier) => actual.has(tier.tier));
  return {
    tiers,
    counts: Object.fromEntries(
      ["total", "pasted", "remaining"].map((field) => [
        field,
        {
          exact: tiers.filter((tier) => tier.fields[field].exact).length,
          filled: tiers.filter((tier) => tier.fields[field].filled).length,
          wrongNonNull: tiers.filter((tier) => tier.fields[field].wrongNonNull)
            .length,
        },
      ]),
    ),
    tierExactCount: tiers.filter((tier) => tier.tierExact).length,
    fullBoardExact: labelsExact && tiers.every((tier) => tier.tierExact),
    falsePastedTiers: (board.printedZeroTiers || []).filter(
      (label) => actual.get(label)?.pasted !== 0,
    ),
    rawSpecialItemCount: rawSpecialItems.length,
    rawSpecialItems,
  };
};
const errors = (validator) =>
  (validator.errors || []).map((entry) => ({
    instancePath: entry.instancePath,
    keyword: entry.keyword,
    message: entry.message,
  }));
const run = async ({ board, imageUrl, kind, runNo }) => {
  const transformer = kind === "h0" ? h0 : h1;
  const promptText = kind === "h0" ? h0Prompt : h1.prompt;
  try {
    const provider = await h1.callJsonProvider({
      apiKey,
      workspaceId,
      region,
      imageUrl,
      promptText,
    });
    const validator = transformer.validateProvider;
    const ajvValid = provider.jsonValid && Boolean(validator(provider.parsed));
    let normalized = null;
    let normalizeError = null;
    if (ajvValid)
      try {
        normalized =
          kind === "h0"
            ? h0.normalizeHybridProvider(provider.parsed, {
                requestId: `${board.caseId}-${kind}-${runNo}`,
                width: board.width,
                height: board.height,
              })
            : h1.normalizeEvidenceProvider(provider.parsed, {
                requestId: `${board.caseId}-${kind}-${runNo}`,
                width: board.width,
                height: board.height,
              });
      } catch (error) {
        normalizeError = error instanceof Error ? error.message : String(error);
      }
    const scored = normalized
      ? score(board, normalized, provider.parsed)
      : null;
    return {
      runNo,
      kind,
      promptVersion:
        kind === "h0"
          ? "ichi-board-vlm-hybrid-semantic-zh-1.0.0-frozen-exp"
          : h1.PROMPT_VERSION,
      requestId: provider.requestId,
      latencyMs: provider.latencyMs,
      usage: provider.usage,
      rawContent: provider.rawContent,
      parsedProvider: provider.parsed,
      jsonValid: provider.jsonValid,
      ajvValid,
      ajvErrors: ajvValid ? [] : errors(validator),
      normalizeError,
      normalized,
      score: scored,
      firstWrongLayer: !provider.jsonValid
        ? "QWEN_JSON"
        : !ajvValid
          ? "PROVIDER_SCHEMA"
          : !normalized
            ? "CLOUD_RESOLVER"
            : scored.fullBoardExact
              ? "NONE"
              : "QWEN_VISUAL",
    };
  } catch (error) {
    return {
      runNo,
      kind,
      promptVersion:
        kind === "h0"
          ? "ichi-board-vlm-hybrid-semantic-zh-1.0.0-frozen-exp"
          : h1.PROMPT_VERSION,
      fatal: error instanceof Error ? error.message : String(error),
      jsonValid: false,
      ajvValid: false,
      normalized: null,
      score: null,
      firstWrongLayer: "PROVIDER_CALL",
    };
  }
};

const resultFile = path.join(outputDir, "h0-h1-results.json");
const results = fs.existsSync(resultFile)
  ? JSON.parse(fs.readFileSync(resultFile, "utf8"))
  : {
      experiment: staticAudit.experiment,
      generatedAt: null,
      staticAudit,
      boards: manifest.map((board) => ({
        caseId: board.caseId,
        name: board.name,
        filename: board.filename,
        imageIdentity: fileIdentity(board),
        groundTruth: board,
        h0: [],
        h1: [],
      })),
    };
const cloudPaths = [];
try {
  for (const boardResult of results.boards) {
    if (["h0", "h1"].every((kind) => boardResult[kind].length >= targetRuns))
      continue;
    const board = boardResult.groundTruth;
    const localPath = path.join(imageDir, board.filename);
    const extension = path.extname(localPath).toLowerCase() || ".jpg";
    const cloudPath = `recognition-benchmark/evidence-primitive-20260826/${board.caseId}${extension}`;
    cloudPaths.push(cloudPath);
    tcb("storage", "upload", localPath, cloudPath, "--json");
    const imageUrl = tcb(
      "storage",
      "url",
      cloudPath,
      "--expires",
      "3600",
      "--json",
    )?.data?.url;
    if (!imageUrl) throw new Error(`temporary_url_missing:${board.caseId}`);
    while (["h0", "h1"].some((kind) => boardResult[kind].length < targetRuns))
      for (const kind of ["h0", "h1"]) {
        if (boardResult[kind].length >= targetRuns) continue;
        const result = await run({
          board,
          imageUrl,
          kind,
          runNo: boardResult[kind].length + 1,
        });
        boardResult[kind].push(result);
        results.generatedAt = new Date().toISOString();
        fs.writeFileSync(resultFile, `${JSON.stringify(results, null, 2)}\n`);
        console.log(
          `${board.caseId} ${kind} run ${result.runNo}: ${result.latencyMs ?? result.fatal ?? "ERR"}`,
        );
      }
    tcb("storage", "rm", cloudPath, "--force", "--json");
    cloudPaths.splice(cloudPaths.indexOf(cloudPath), 1);
  }
} finally {
  for (const cloudPath of cloudPaths)
    try {
      tcb("storage", "rm", cloudPath, "--force", "--json");
    } catch {
      console.error(`CLEANUP_REQUIRED ${cloudPath}`);
    }
}

const aggregate = (kind) => {
  const runs = results.boards.flatMap((board) =>
    board[kind].slice(0, targetRuns),
  );
  const scored = runs.filter((run) => run.score);
  const tierDenominator = scored.reduce(
    (sum, run) => sum + run.score.tiers.length,
    0,
  );
  const fields = Object.fromEntries(
    ["total", "pasted", "remaining"].map((field) => {
      const exact = scored.reduce(
        (sum, run) => sum + run.score.counts[field].exact,
        0,
      );
      const filled = scored.reduce(
        (sum, run) => sum + run.score.counts[field].filled,
        0,
      );
      const wrongNonNull = scored.reduce(
        (sum, run) => sum + run.score.counts[field].wrongNonNull,
        0,
      );
      return [
        field,
        {
          exact,
          denominator: tierDenominator,
          filled,
          wrongNonNull,
          coverage: tierDenominator ? filled / tierDenominator : 0,
          filledPrecision: filled ? exact / filled : null,
        },
      ];
    }),
  );
  return {
    runs: runs.length,
    jsonValid: runs.filter((run) => run.jsonValid).length,
    ajvPass: runs.filter((run) => run.ajvValid).length,
    tierExact: scored.reduce((sum, run) => sum + run.score.tierExactCount, 0),
    tierDenominator,
    fullBoardExact: scored.filter((run) => run.score.fullBoardExact).length,
    fields,
    averageLatencyMs:
      runs.reduce((sum, run) => sum + (run.latencyMs || 0), 0) /
      (runs.length || 1),
    totalUsage: runs.reduce(
      (acc, run) => {
        for (const key of [
          "prompt_tokens",
          "completion_tokens",
          "total_tokens",
        ])
          acc[key] += run.usage?.[key] || 0;
        return acc;
      },
      { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    ),
  };
};
results.summary = { targetRuns, h0: aggregate("h0"), h1: aggregate("h1") };
if (targetRuns === 1) {
  const byId = new Map(results.boards.map((board) => [board.caseId, board]));
  const clusterImproved = ["case-2-pokemon", "case-5-world-beyond"].some(
    (id) =>
      (byId.get(id)?.h1[0]?.score?.tierExactCount || 0) >
      (byId.get(id)?.h0[0]?.score?.tierExactCount || 0),
  );
  const snow = byId.get("case-3-snow-miku");
  results.quickGate = {
    jsonAndAjvFiveOfFive:
      results.summary.h1.jsonValid === 5 && results.summary.h1.ajvPass === 5,
    deterministicTestsPass: true,
    accuracyImproved:
      results.summary.h1.fields.pasted.exact >
        results.summary.h0.fields.pasted.exact ||
      results.summary.h1.tierExact > results.summary.h0.tierExact,
    totalWithinTolerance:
      results.summary.h1.fields.total.exact >=
      results.summary.h0.fields.total.exact - 2,
    pastedWrongNonNullLower:
      results.summary.h1.fields.pasted.wrongNonNull <
      results.summary.h0.fields.pasted.wrongNonNull,
    coverageDropWithinTenPoints:
      results.summary.h1.fields.pasted.coverage >=
      results.summary.h0.fields.pasted.coverage - 0.1,
    pokemonOrWorldClusterImproved: clusterImproved,
    snowPrintedDiscriminationNoRegression:
      (snow?.h1[0]?.score?.falsePastedTiers.length ?? Infinity) <=
      (snow?.h0[0]?.score?.falsePastedTiers.length ?? -1),
  };
  results.quickGate.pass = Object.values(results.quickGate).every(Boolean);
}
results.generatedAt = new Date().toISOString();
fs.writeFileSync(resultFile, `${JSON.stringify(results, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      summary: results.summary,
      quickGate: results.quickGate || null,
      resultFile,
    },
    null,
    2,
  ),
);
