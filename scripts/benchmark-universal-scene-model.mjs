import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const ROOT = process.cwd();
const ENV_ID = "cloud1-d7gxqfwv783a1f131";
const require = createRequire(
  path.resolve(
    ROOT,
    "services/cloudbase/functions/recognize-board/package.json",
  ),
);
const production = require(
  path.resolve(ROOT, "services/cloudbase/functions/recognize-board/index.js"),
);
const experiment = require(
  path.resolve(
    ROOT,
    "experiments/universal-scene-model/universal-scene-model-experiment.js",
  ),
);

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}
const detailFile = args.get("--function-detail");
if (!detailFile) throw new Error("--function-detail is required");
const targetRuns = Number(args.get("--target-runs") || 1);
if (![1, 3].includes(targetRuns))
  throw new Error("--target-runs must be 1 or 3");
const imagesDir = args.get("--images") || "/Users/cunfu/Downloads";
const outputDir = path.resolve(
  args.get("--output-dir") ||
    "artifacts/universal-scene-model-experiment/2026-08-26",
);
const resultsFile = path.join(outputDir, "results.json");

const parseCliJson = (text) => {
  const starts = [text.indexOf("{"), text.indexOf("[")]
    .filter((value) => value >= 0)
    .sort((left, right) => left - right);
  for (const start of starts) {
    for (let end = text.length; end > start; end -= 1) {
      if (!["}", "]"].includes(text[end - 1])) continue;
      try {
        return JSON.parse(text.slice(start, end));
      } catch {
        // CloudBase CLI can append progress output after JSON.
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
if (
  path.resolve(detailFile).startsWith("/private/tmp/") ||
  path.resolve(detailFile).startsWith("/tmp/")
) {
  fs.unlinkSync(detailFile);
}
const apiKey = variables.DASHSCOPE_API_KEY;
const workspaceId = variables.DASHSCOPE_WORKSPACE_ID;
const region = variables.DASHSCOPE_REGION || "cn-beijing";
if (!apiKey || !workspaceId) throw new Error("provider_credentials_missing");

const manifest = JSON.parse(
  fs.readFileSync(
    path.resolve(ROOT, "experiments/universal-scene-model/ground-truth.json"),
    "utf8",
  ),
);

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

const normalizeLabel = (value) => {
  const compact = String(value || "")
    .normalize("NFKC")
    .toUpperCase()
    .replace(/\s+/gu, "")
    .replace(/[赏賞]$/u, "");
  const regular = /^([A-Z])([0-9]+)?$/u.exec(compact);
  return regular ? regular[1] : null;
};

const normalizedTierMap = (normalized) =>
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

const scoreRun = (board, normalized, parsedProvider) => {
  const actual = normalizedTierMap(normalized);
  const tiers = board.tiers.map((expected) => {
    const found = actual.get(expected.tier) || {};
    const remaining = expected.total - expected.pasted;
    return {
      tier: expected.tier,
      expected: { ...expected, remaining },
      actual: {
        total: found.total ?? null,
        pasted: found.pasted ?? null,
        remaining: found.remaining ?? null,
      },
      totalExact: found.total === expected.total,
      pastedExact: found.pasted === expected.pasted,
      remainingExact: found.remaining === remaining,
      tierExact:
        found.total === expected.total &&
        found.pasted === expected.pasted &&
        found.remaining === remaining,
    };
  });
  const actualLabels = [...actual.keys()];
  const tierSetExact =
    actualLabels.length === board.tiers.length &&
    board.tiers.every((tier) => actual.has(tier.tier));
  const printedZeroTiers = board.printedZeroTiers || [];
  const falsePastedTiers = printedZeroTiers.filter(
    (tier) => (actual.get(tier)?.pasted ?? null) !== 0,
  );
  const rawTiers = Array.isArray(parsedProvider?.tiers)
    ? parsedProvider.tiers.map((tier, index) => ({
        index,
        rawLabel: tier.rawLabel,
        prizeName: tier.prizeName,
        totalTickets: tier.totalTickets,
        ticketPattern: tier.ticketPattern,
        sequenceStart: tier.evidence?.sequenceStart ?? null,
        firstOpen: tier.evidence?.firstOpen ?? null,
        pastedDirect: tier.evidence?.pastedDirect ?? null,
      }))
    : [];
  const rawSpecialItems = rawTiers.filter(
    (tier) => normalizeLabel(tier.rawLabel) === null,
  );
  const exact = tierSetExact && tiers.every((tier) => tier.tierExact);
  return {
    tierSetExact,
    totalExact: tiers.every((tier) => tier.totalExact),
    pastedExact: tiers.every((tier) => tier.pastedExact),
    remainingExact: tiers.every((tier) => tier.remainingExact),
    fullBoardExact: exact,
    exactTierCount: tiers.filter((tier) => tier.tierExact).length,
    totalExactCount: tiers.filter((tier) => tier.totalExact).length,
    pastedExactCount: tiers.filter((tier) => tier.pastedExact).length,
    remainingExactCount: tiers.filter((tier) => tier.remainingExact).length,
    tiers,
    rawTiers,
    rawSpecialItems,
    falsePastedTiers,
    q1PrintedVsPhysical:
      printedZeroTiers.length > 0
        ? falsePastedTiers.length === 0
        : tiers.every((tier) => tier.pastedExact),
    q2OpenState: tiers.every((tier) => tier.remainingExact),
    q3Overlap:
      board.overlap === true ? tiers.every((tier) => tier.pastedExact) : null,
  };
};

const priceAmount = (normalized) => {
  const price = normalized?.draft?.price;
  return Number.isFinite(price?.amount) ? price.amount : null;
};

const runProtocol = async ({ board, imageUrl, kind, runNumber }) => {
  const prompt =
    kind === "production"
      ? experiment.productionPrompt
      : experiment.experimentalPrompt;
  try {
    const provider = await experiment.callProvider({
      apiKey,
      workspaceId,
      region,
      imageUrl,
      prompt,
    });
    const ajvValid =
      provider.jsonValid &&
      Boolean(experiment.validateProvider(provider.parsed));
    const ajvErrors = ajvValid
      ? []
      : (experiment.validateProvider.errors || []).map((error) => ({
          instancePath: error.instancePath,
          keyword: error.keyword,
          message: error.message,
        }));
    let normalized = null;
    let normalizeError = null;
    if (ajvValid) {
      try {
        normalized = production.__test.normalizeExtraction(
          provider.parsed,
          {
            requestId: `${board.caseId}-${kind}-${runNumber}`,
            width: board.width,
            height: board.height,
          },
          {},
        );
      } catch (error) {
        normalizeError =
          error instanceof Error ? error.message : "normalize_error";
      }
    }
    const score = normalized
      ? scoreRun(board, normalized, provider.parsed)
      : null;
    let firstWrongLayer = "none";
    if (!provider.jsonValid) firstWrongLayer = "provider-json";
    else if (!ajvValid) firstWrongLayer = "provider-schema";
    else if (!normalized) firstWrongLayer = "normalize";
    else if (!score.fullBoardExact) firstWrongLayer = "provider-raw-visual";
    return {
      kind,
      runNumber,
      promptVersion:
        kind === "production"
          ? experiment.PRODUCTION_PROMPT_VERSION
          : experiment.EXPERIMENT_PROMPT_VERSION,
      requestId: provider.requestId,
      latencyMs: provider.latencyMs,
      usage: provider.usage,
      rawContent: provider.rawContent,
      parsedProvider: provider.parsed,
      jsonValid: provider.jsonValid,
      ajvValid,
      ajvErrors,
      normalizeError,
      normalized,
      identity: normalized?.draft
        ? {
            ipName: normalized.draft.ipName,
            themeName: normalized.draft.themeName,
            price: priceAmount(normalized),
          }
        : null,
      score,
      firstWrongLayer,
    };
  } catch (error) {
    return {
      kind,
      runNumber,
      promptVersion:
        kind === "production"
          ? experiment.PRODUCTION_PROMPT_VERSION
          : experiment.EXPERIMENT_PROMPT_VERSION,
      fatal: error instanceof Error ? error.message : "provider_error",
      jsonValid: false,
      ajvValid: false,
      normalized: null,
      score: null,
      firstWrongLayer: "provider-call",
    };
  }
};

const emptyReport = () => ({
  experiment: "UNIVERSAL SCENE MODEL A/B",
  generatedAt: null,
  controls: {
    model: experiment.MODEL,
    thinking: false,
    temperature: 0,
    responseFormat: "json_object",
    maxPixels: experiment.MODEL_MAX_PIXELS,
    providerSchemaVersion: experiment.PROVIDER_SCHEMA_VERSION,
    recognitionContractVersion: "1.0.0",
    normalize: "production normalizeExtraction / v4",
  },
  promptSize: {
    productionCharacters: experiment.productionPrompt.length,
    experimentalCharacters: experiment.experimentalPrompt.length,
    characterDelta:
      experiment.experimentalPrompt.length - experiment.productionPrompt.length,
    estimatedProductionTextTokens: Math.ceil(
      experiment.productionPrompt.length / 4,
    ),
    estimatedExperimentalTextTokens: Math.ceil(
      experiment.experimentalPrompt.length / 4,
    ),
  },
  boards: manifest.map((board) => ({
    caseId: board.caseId,
    name: board.name,
    filename: board.filename,
    groundTruth: board,
    production: [],
    scene: [],
  })),
});

fs.mkdirSync(outputDir, { recursive: true });
const report = fs.existsSync(resultsFile)
  ? JSON.parse(fs.readFileSync(resultsFile, "utf8"))
  : emptyReport();
const cloudPaths = [];
try {
  for (const board of report.boards) {
    const localPath = path.join(imagesDir, board.filename);
    if (!fs.existsSync(localPath))
      throw new Error(`image_missing:${localPath}`);
    const needed = Math.max(
      0,
      targetRuns - Math.min(board.production.length, board.scene.length),
    );
    if (needed === 0) continue;
    const extension = path.extname(localPath).toLowerCase() || ".jpg";
    const cloudPath = `recognition-benchmark/universal-scene-model-20260826/${board.caseId}${extension}`;
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
    for (let offset = 0; offset < needed; offset += 1) {
      const runNumber = board.production.length + 1;
      const productionRun = await runProtocol({
        board: board.groundTruth,
        imageUrl,
        kind: "production",
        runNumber,
      });
      board.production.push(productionRun);
      const sceneRun = await runProtocol({
        board: board.groundTruth,
        imageUrl,
        kind: "scene",
        runNumber,
      });
      board.scene.push(sceneRun);
      report.generatedAt = new Date().toISOString();
      fs.writeFileSync(resultsFile, `${JSON.stringify(report, null, 2)}\n`);
      console.log(
        `${board.caseId} run ${runNumber}: production=${productionRun.latencyMs ?? "ERR"}ms scene=${sceneRun.latencyMs ?? "ERR"}ms`,
      );
    }
    tcb("storage", "rm", cloudPath, "--force", "--json");
    cloudPaths.splice(cloudPaths.indexOf(cloudPath), 1);
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

report.generatedAt = new Date().toISOString();
fs.writeFileSync(resultsFile, `${JSON.stringify(report, null, 2)}\n`);
console.log(`RESULTS ${resultsFile}`);
