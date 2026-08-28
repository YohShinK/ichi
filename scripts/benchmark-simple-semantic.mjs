import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(
  path.resolve(
    process.cwd(),
    "services/cloudbase/functions/recognize-board/package.json",
  ),
);
const Ajv2020 = require("ajv/dist/2020").default;
const recognitionFunctionDir = path.resolve(
  process.cwd(),
  "services/cloudbase/functions/recognize-board",
);
const production = require(path.join(recognitionFunctionDir, "index.js"));
const experiment = require(
  path.resolve(
    process.cwd(),
    "experiments/simple-semantic/simple-semantic-experiment.js",
  ),
);

const ENV_ID = "cloud1-d7gxqfwv783a1f131";
const PRODUCTION_PROMPT = "ichi-board-vlm-4.0.3-rc1";
const PRODUCTION_SCHEMA = "board-provider-extraction-4.0.0-rc1";
const MODEL = "qwen3.7-flash";
const ROOT = process.cwd();

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}
const downloadsDir = args.get("--images") || "/Users/cunfu/Downloads";
const detailFile = args.get("--function-detail");
const outputFile =
  args.get("--output") ||
  path.resolve(
    ROOT,
    "artifacts/simple-semantic-experiment/2026-08-25/first-pass.json",
  );
if (!detailFile) throw new Error("--function-detail is required");

const parseCliJson = (text) => {
  const firstObject = text.indexOf("{");
  const firstArray = text.indexOf("[");
  const starts = [firstObject, firstArray]
    .filter((value) => value >= 0)
    .sort((left, right) => left - right);
  for (const start of starts) {
    for (let end = text.length; end > start; end -= 1) {
      const tail = text[end - 1];
      if (tail !== "}" && tail !== "]") continue;
      try {
        return JSON.parse(text.slice(start, end));
      } catch {
        // CLI may append progress text. Keep searching for the JSON boundary.
      }
    }
  }
  throw new Error("cloudbase_cli_json_invalid");
};

const detail = parseCliJson(fs.readFileSync(detailFile, "utf8"));
const variables = Object.fromEntries(
  (detail?.data?.Environment?.Variables || []).map((entry) => [
    entry.Key,
    entry.Value,
  ]),
);
// The CLI detail payload contains provider credentials. Remove this exact
// temporary audit file immediately after loading it; no secret is written to
// the benchmark artifact or logs.
if (
  path.resolve(detailFile).startsWith("/private/tmp/") ||
  path.resolve(detailFile).startsWith("/tmp/")
) {
  fs.unlinkSync(detailFile);
}
const apiKey = variables.DASHSCOPE_API_KEY;
const workspaceId = variables.DASHSCOPE_WORKSPACE_ID;
const region = variables.DASHSCOPE_REGION || "cn-beijing";
if (!apiKey || !workspaceId) {
  throw new Error("provider_credentials_missing_from_function_detail");
}

const productionPrompt = fs.readFileSync(
  path.resolve(
    ROOT,
    "data/recognition-contract/prompt/ichi-board-vlm-4.0.3-rc1.txt",
  ),
  "utf8",
);
const productionSchema = JSON.parse(
  fs.readFileSync(
    path.resolve(
      ROOT,
      "data/recognition-contract/schema/board-provider-extraction-4.0.0-rc1.schema.json",
    ),
    "utf8",
  ),
);
const productionAjv = new Ajv2020({ strict: true, allErrors: true });
const validateProduction = productionAjv.compile(productionSchema);

const firstFour = JSON.parse(
  fs.readFileSync(
    path.resolve(
      ROOT,
      "services/cloudbase/functions/recognize-board/fixtures/golden-four-board-expectations.json",
    ),
    "utf8",
  ),
);
const manifest = JSON.parse(
  fs.readFileSync(
    path.resolve(
      ROOT,
      "experiments/simple-semantic/simple-semantic-golden-set.json",
    ),
    "utf8",
  ),
).map((entry) => {
  const inherited = firstFour.find((board) => board.id === entry.id);
  return inherited
    ? {
        ...entry,
        width: inherited.width,
        height: inherited.height,
        ipName: inherited.ipName,
        themeName: inherited.themeName,
        price: inherited.price,
        tiers: inherited.tiers.map((tier) => ({
          tier: tier.normalizedTier,
          total: tier.total,
          pasted: tier.pasted,
        })),
      }
    : entry;
});

const tcb = (...cliArgs) => {
  const output = execFileSync(
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
  );
  return parseCliJson(output);
};

const tierMap = (normalized) =>
  new Map(
    (normalized?.draft?.tiers || []).map((tier) => [
      tier.label,
      {
        total: tier.totalTickets,
        pasted: tier.pastedTickets,
        remaining: tier.remainingTickets,
      },
    ]),
  );

const scoreAgainst = (entry, normalized) => {
  const actual = tierMap(normalized);
  if (entry.partialGroundTruth) {
    const assertions = entry.assertions.map((assertion) => ({
      tier: assertion.tier,
      field: "pasted",
      expected: assertion.pasted,
      actual: actual.get(assertion.tier)?.pasted ?? null,
      exact: actual.get(assertion.tier)?.pasted === assertion.pasted,
      reason: assertion.reason,
    }));
    return {
      partial: true,
      assertions,
      pastedExact: assertions.every((assertion) => assertion.exact),
      totalExact: null,
      tierCompletenessExact: null,
    };
  }
  const expectedLabels = entry.tiers.map((tier) => tier.tier);
  const actualLabels = [...actual.keys()];
  const tierResults = entry.tiers.map((tier) => ({
    tier: tier.tier,
    expectedTotal: tier.total,
    actualTotal: actual.get(tier.tier)?.total ?? null,
    totalExact: actual.get(tier.tier)?.total === tier.total,
    expectedPasted: tier.pasted,
    actualPasted: actual.get(tier.tier)?.pasted ?? null,
    pastedExact: actual.get(tier.tier)?.pasted === tier.pasted,
  }));
  return {
    partial: false,
    tierCompletenessExact:
      expectedLabels.length === actualLabels.length &&
      expectedLabels.every((label) => actual.has(label)),
    totalExact: tierResults.every((tier) => tier.totalExact),
    pastedExact: tierResults.every((tier) => tier.pastedExact),
    totalExactCount: tierResults.filter((tier) => tier.totalExact).length,
    pastedExactCount: tierResults.filter((tier) => tier.pastedExact).length,
    tierCount: tierResults.length,
    tiers: tierResults,
  };
};

const runProtocol = async ({ entry, imageUrl, kind }) => {
  const promptText =
    kind === "production" ? productionPrompt : experiment.prompt;
  let provider;
  try {
    provider = await experiment.callJsonProvider({
      apiKey,
      workspaceId,
      region,
      imageUrl,
      promptText,
    });
  } catch (error) {
    return {
      kind,
      fatal: error instanceof Error ? error.message : "provider_error",
      jsonValid: false,
      ajvValid: false,
      normalized: null,
      score: null,
    };
  }
  const validator =
    kind === "production" ? validateProduction : experiment.validateProvider;
  const ajvValid = provider.jsonValid && Boolean(validator(provider.parsed));
  let normalized = null;
  let normalizeError = null;
  if (ajvValid) {
    try {
      normalized =
        kind === "production"
          ? production.__test.normalizeExtraction(
              provider.parsed,
              {
                requestId: `${entry.id}-${kind}`,
                width: entry.width,
                height: entry.height,
              },
              {},
            )
          : experiment.normalizeSimpleProvider(provider.parsed, {
              requestId: `${entry.id}-${kind}`,
              width: entry.width,
              height: entry.height,
            });
    } catch (error) {
      normalizeError =
        error instanceof Error ? error.message : "normalize_error";
    }
  }
  return {
    kind,
    fatal: null,
    rawContent: provider.rawContent,
    parsedProvider: provider.parsed,
    jsonValid: provider.jsonValid,
    ajvValid,
    ajvErrors: ajvValid
      ? []
      : (validator.errors || []).slice(0, 12).map((error) => ({
          instancePath: error.instancePath,
          keyword: error.keyword,
        })),
    latencyMs: provider.latencyMs,
    usage: provider.usage,
    normalizeError,
    normalized,
    score: normalized ? scoreAgainst(entry, normalized) : null,
    identity: normalized?.draft
      ? {
          ipName: normalized.draft.ipName,
          themeName: normalized.draft.themeName,
          ipExact: normalized.draft.ipName === entry.ipName,
          themeExact:
            entry.themeName === undefined
              ? null
              : normalized.draft.themeName === entry.themeName,
        }
      : null,
  };
};

const results = [];
const cloudPaths = [];
try {
  for (const entry of manifest) {
    const localPath = path.join(downloadsDir, entry.filename);
    if (!fs.existsSync(localPath)) {
      results.push({ id: entry.id, name: entry.name, missingImage: localPath });
      continue;
    }
    const extension = path.extname(localPath).toLowerCase() || ".jpg";
    const cloudPath = `recognition-benchmark/simple-semantic-20260825/${entry.id}${extension}`;
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
    if (!imageUrl) throw new Error(`temporary_url_missing:${entry.id}`);
    const productionRun = await runProtocol({
      entry,
      imageUrl,
      kind: "production",
    });
    const simpleRun = await runProtocol({ entry, imageUrl, kind: "simple" });
    results.push({
      id: entry.id,
      name: entry.name,
      filename: entry.filename,
      groundTruth: {
        ipName: entry.ipName ?? null,
        themeName: entry.themeName ?? null,
        tiers: entry.tiers ?? null,
        assertions: entry.assertions ?? null,
      },
      production: productionRun,
      simple: simpleRun,
    });
    console.log(
      `${entry.id}: production=${productionRun.latencyMs ?? "ERR"}ms simple=${simpleRun.latencyMs ?? "ERR"}ms`,
    );
  }
} finally {
  if (cloudPaths.length > 0) {
    try {
      tcb("storage", "rm", ...cloudPaths, "--force", "--json");
    } catch {
      console.error(
        "WARNING: benchmark temporary objects require manual cleanup",
      );
    }
  }
}

const validResults = results.filter(
  (entry) => entry.production && entry.simple,
);
const usageNumber = (run, snake, camel) =>
  run?.usage?.[snake] ?? run?.usage?.[camel] ?? null;
const median = (values) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};
const percentile = (values, quantile) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * quantile) - 1];
};
const summaryFor = (kind) => {
  const runs = validResults.map((entry) => entry[kind]);
  const completeScores = runs
    .map((run) => run.score)
    .filter((score) => score && !score.partial);
  const latencies = runs.map((run) => run.latencyMs).filter(Number.isFinite);
  return {
    runs: runs.length,
    jsonValid: runs.filter((run) => run.jsonValid).length,
    ajvValid: runs.filter((run) => run.ajvValid).length,
    boardsTotalExact: completeScores.filter((score) => score.totalExact).length,
    boardsPastedExact: completeScores.filter((score) => score.pastedExact)
      .length,
    tierTotalExact: completeScores.reduce(
      (sum, score) => sum + score.totalExactCount,
      0,
    ),
    tierPastedExact: completeScores.reduce(
      (sum, score) => sum + score.pastedExactCount,
      0,
    ),
    tierGroundTruthCount: completeScores.reduce(
      (sum, score) => sum + score.tierCount,
      0,
    ),
    p50LatencyMs: median(latencies),
    p95LatencyMs: percentile(latencies, 0.95),
    promptTokens: runs.map((run) =>
      usageNumber(run, "prompt_tokens", "promptTokens"),
    ),
    completionTokens: runs.map((run) =>
      usageNumber(run, "completion_tokens", "completionTokens"),
    ),
  };
};

const report = {
  experiment: "SIMPLE SEMANTIC EXTRACTION",
  generatedAt: new Date().toISOString(),
  productionBaseline: {
    promptVersion: PRODUCTION_PROMPT,
    schemaVersion: PRODUCTION_SCHEMA,
    model: MODEL,
    thinking: false,
    temperature: 0,
    responseFormat: "json_object",
    maxPixels: experiment.MODEL_MAX_PIXELS,
  },
  experimental: {
    promptVersion: experiment.EXPERIMENT_PROMPT_VERSION,
    schemaVersion: experiment.EXPERIMENT_SCHEMA_VERSION,
    model: MODEL,
    thinking: false,
    temperature: 0,
    responseFormat: "json_object",
    maxPixels: experiment.MODEL_MAX_PIXELS,
  },
  textSize: {
    productionChars: productionPrompt.length,
    simpleChars: experiment.prompt.length,
    charReduction:
      1 - experiment.prompt.length / Math.max(1, productionPrompt.length),
  },
  summary: {
    production: summaryFor("production"),
    simple: summaryFor("simple"),
  },
  results,
};
fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`REPORT ${outputFile}`);
