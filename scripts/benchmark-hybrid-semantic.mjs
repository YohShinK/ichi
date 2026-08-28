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
const Ajv2020 = require("ajv/dist/2020").default;
const production = require(
  path.join(ROOT, "services/cloudbase/functions/recognize-board/index.js"),
);
const hybrid = require(
  path.join(ROOT, "experiments/hybrid-semantic/hybrid-semantic-experiment.js"),
);

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}
const phase = args.get("--phase") || "static";
if (!["static", "language", "architecture"].includes(phase)) {
  throw new Error("--phase must be static, language, or architecture");
}
const targetRuns = Number(args.get("--target-runs") || 1);
if (![1, 3].includes(targetRuns)) {
  throw new Error("--target-runs must be 1 or 3");
}
const imageDir = args.get("--images") || "/Users/cunfu/Downloads";
const outputDir = path.resolve(
  args.get("--output-dir") || "artifacts/hybrid-semantic-experiment/2026-08-26",
);
const detailFile = args.get("--function-detail");

const productionPromptPath = path.join(
  ROOT,
  "data/recognition-contract/prompt/ichi-board-vlm-4.0.3-rc1.txt",
);
const productionPrompt = fs.readFileSync(productionPromptPath, "utf8");
const productionSchema = JSON.parse(
  fs.readFileSync(
    path.join(
      ROOT,
      "data/recognition-contract/schema/board-provider-extraction-4.0.0-rc1.schema.json",
    ),
    "utf8",
  ),
);
const validateProduction = new Ajv2020({
  strict: true,
  allErrors: true,
}).compile(productionSchema);
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "experiments/universal-scene-model/ground-truth.json"),
    "utf8",
  ),
);

const estimateTokens = (text) => Math.ceil(text.length / 4);
const hashText = (text) =>
  crypto.createHash("sha256").update(text).digest("hex");
const fileIdentity = (filename) => {
  const localPath = path.join(imageDir, filename);
  const bytes = fs.readFileSync(localPath);
  return {
    filename,
    path: localPath,
    bytes: bytes.length,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  };
};

const staticAudit = {
  heading: "HYBRID STATIC AUDIT",
  controls: {
    model: hybrid.MODEL,
    thinking: false,
    temperature: 0,
    responseFormat: "json_object",
    maxPixels: hybrid.MODEL_MAX_PIXELS,
  },
  prompts: Object.fromEntries(
    Object.entries(hybrid.prompts).map(([language, text]) => [
      language,
      {
        filename: path.basename(hybrid.promptFiles[language]),
        sha256: hashText(text),
        characters: text.length,
        estimatedTextTokens: estimateTokens(text),
      },
    ]),
  ),
  productionPrompt: {
    filename: path.basename(productionPromptPath),
    sha256: hashText(productionPrompt),
    characters: productionPrompt.length,
    estimatedTextTokens: estimateTokens(productionPrompt),
  },
  schema: {
    filename: "board-provider-hybrid-semantic-1.0.0-exp.schema.json",
    rootRequired: hybrid.schema.required,
    tierRequired: hybrid.schema.$defs.tier.required,
    removedProductionProviderFields: [
      "protocolVersion",
      "frame",
      "allRegularTiersDetected",
      "oneSlotOneTicketConfirmed",
      "confidence",
      "ticketPattern",
      "evidence",
      "warnings",
    ],
  },
  deterministicCloudResponsibilities: [
    "NFKC label normalization",
    "A1/A2/D1/D2 child-first parent aggregation",
    "stable SP1/SP2/SP3... mapping by visual order",
    "range validation without clamping",
    "duplicate-child conflict detection",
    "remaining and whole-board arithmetic",
    "RecognitionContract 1.0.0 construction",
  ],
  images: manifest.map((board) => fileIdentity(board.filename)),
};

fs.mkdirSync(outputDir, { recursive: true });
if (phase === "static") {
  const staticFile = path.join(outputDir, "static-audit.json");
  fs.writeFileSync(staticFile, `${JSON.stringify(staticAudit, null, 2)}\n`);
  console.log(JSON.stringify(staticAudit, null, 2));
  console.log(`STATIC_AUDIT ${staticFile}`);
  process.exit(0);
}

if (!detailFile) throw new Error("--function-detail is required");

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
        // The CLI may append progress output after the JSON value.
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

const normalizeRegularLabel = (value) => {
  const compact = String(value || "")
    .normalize("NFKC")
    .toUpperCase()
    .replace(/\s+/gu, "")
    .replace(/[赏賞]$/u, "");
  const match = /^([A-Z])([0-9]+)?$/u.exec(compact);
  return match ? match[1] : null;
};

const finalTierMap = (kind, normalized) => {
  const tiers =
    kind === "production"
      ? normalized?.draft?.tiers || []
      : normalized?.trace?.tiers || [];
  return new Map(
    tiers.map((tier) => [
      tier.label,
      {
        total: tier.totalTickets,
        pasted: tier.pastedTickets,
        remaining: tier.remainingTickets,
      },
    ]),
  );
};

const score = (board, kind, normalized, parsed) => {
  const actual = finalTierMap(kind, normalized);
  const tiers = board.tiers.map((expected) => {
    const found = actual.get(expected.tier) || {};
    const expectedRemaining = expected.total - expected.pasted;
    const totalExact = found.total === expected.total;
    const pastedExact = found.pasted === expected.pasted;
    const remainingExact = found.remaining === expectedRemaining;
    return {
      tier: expected.tier,
      expected: {
        total: expected.total,
        pasted: expected.pasted,
        remaining: expectedRemaining,
      },
      actual: {
        total: found.total ?? null,
        pasted: found.pasted ?? null,
        remaining: found.remaining ?? null,
      },
      totalExact,
      pastedExact,
      remainingExact,
      tierExact: totalExact && pastedExact,
    };
  });
  const rawTiers = Array.isArray(parsed?.tiers)
    ? parsed.tiers.map((tier, index) => ({ index, ...tier }))
    : [];
  const rawSpecialItems = rawTiers.filter(
    (tier) => normalizeRegularLabel(tier.rawLabel) === null,
  );
  const falsePastedTiers = (board.printedZeroTiers || []).filter(
    (label) => actual.get(label)?.pasted !== 0,
  );
  const labelsExact =
    actual.size === board.tiers.length &&
    board.tiers.every((tier) => actual.has(tier.tier));
  return {
    totalExactCount: tiers.filter((tier) => tier.totalExact).length,
    pastedExactCount: tiers.filter((tier) => tier.pastedExact).length,
    remainingExactCount: tiers.filter((tier) => tier.remainingExact).length,
    tierExactCount: tiers.filter((tier) => tier.tierExact).length,
    tierCount: tiers.length,
    totalExact: tiers.every((tier) => tier.totalExact),
    pastedExact: tiers.every((tier) => tier.pastedExact),
    remainingExact: tiers.every((tier) => tier.remainingExact),
    tierSetExact: labelsExact,
    fullBoardExact: labelsExact && tiers.every((tier) => tier.tierExact),
    falsePastedTiers,
    rawSpecialItemCount: rawSpecialItems.length,
    rawSpecialItems,
    tiers,
  };
};

const ajvErrors = (validator) =>
  (validator.errors || []).map((error) => ({
    instancePath: error.instancePath,
    keyword: error.keyword,
    message: error.message,
  }));

const run = async ({
  board,
  imageUrl,
  kind,
  promptText,
  promptVersion,
  runNo,
}) => {
  try {
    const provider = await hybrid.callJsonProvider({
      apiKey,
      workspaceId,
      region,
      imageUrl,
      promptText,
    });
    const validator =
      kind === "production" ? validateProduction : hybrid.validateProvider;
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
                  requestId: `${board.caseId}-${kind}-${runNo}`,
                  width: board.width,
                  height: board.height,
                },
                {},
              )
            : hybrid.normalizeHybridProvider(provider.parsed, {
                requestId: `${board.caseId}-${kind}-${runNo}`,
                width: board.width,
                height: board.height,
              });
      } catch (error) {
        normalizeError = error instanceof Error ? error.message : String(error);
      }
    }
    const scored = normalized
      ? score(board, kind, normalized, provider.parsed)
      : null;
    const firstWrongLayer = !provider.jsonValid
      ? "QWEN_JSON"
      : !ajvValid
        ? "PROVIDER_SCHEMA"
        : !normalized
          ? "CLOUD_NORMALIZE"
          : scored.fullBoardExact
            ? "NONE"
            : "QWEN_VISUAL";
    return {
      runNo,
      kind,
      promptVersion,
      requestId: provider.requestId,
      latencyMs: provider.latencyMs,
      usage: provider.usage,
      rawContent: provider.rawContent,
      parsedProvider: provider.parsed,
      jsonValid: provider.jsonValid,
      ajvValid,
      ajvErrors: ajvValid ? [] : ajvErrors(validator),
      normalizeError,
      normalized,
      score: scored,
      firstWrongLayer,
    };
  } catch (error) {
    return {
      runNo,
      kind,
      promptVersion,
      fatal: error instanceof Error ? error.message : String(error),
      jsonValid: false,
      ajvValid: false,
      normalized: null,
      score: null,
      firstWrongLayer: "PROVIDER_CALL",
    };
  }
};

const languageBoardIds = new Set([
  "case-1-nikke",
  "case-3-snow-miku",
  "case-5-world-beyond",
]);
const resultFile = path.join(
  outputDir,
  phase === "language" ? "language-gate.json" : "architecture-results.json",
);
const frozenPromptPath = args.get("--frozen-prompt");
if (phase === "architecture" && !frozenPromptPath) {
  throw new Error("--frozen-prompt is required for architecture");
}
const frozenPrompt = frozenPromptPath
  ? fs.readFileSync(path.resolve(frozenPromptPath), "utf8")
  : null;
const selectedBoards = manifest.filter(
  (board) => phase === "architecture" || languageBoardIds.has(board.caseId),
);
const emptyResults = {
  experiment: "HYBRID SEMANTIC EXTRACTION EXPERIMENT",
  phase,
  generatedAt: null,
  staticAudit,
  frozenPrompt: frozenPrompt
    ? {
        filename: path.basename(frozenPromptPath),
        sha256: hashText(frozenPrompt),
        characters: frozenPrompt.length,
        estimatedTextTokens: estimateTokens(frozenPrompt),
      }
    : null,
  boards: selectedBoards.map((board) => ({
    caseId: board.caseId,
    name: board.name,
    filename: board.filename,
    imageIdentity: fileIdentity(board.filename),
    groundTruth: board,
    ...(phase === "language"
      ? { en: [], zh: [] }
      : { production: [], hybrid: [] }),
  })),
};
const results = fs.existsSync(resultFile)
  ? JSON.parse(fs.readFileSync(resultFile, "utf8"))
  : emptyResults;
const cloudPaths = [];
try {
  for (const boardResult of results.boards) {
    const groups =
      phase === "language" ? ["en", "zh"] : ["production", "hybrid"];
    if (groups.every((group) => boardResult[group].length >= targetRuns)) {
      continue;
    }
    const board = boardResult.groundTruth;
    const localPath = path.join(imageDir, board.filename);
    const extension = path.extname(localPath).toLowerCase() || ".jpg";
    const cloudPath = `recognition-benchmark/hybrid-semantic-20260826/${phase}-${board.caseId}${extension}`;
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
    while (groups.some((group) => boardResult[group].length < targetRuns)) {
      for (const group of groups) {
        if (boardResult[group].length >= targetRuns) continue;
        const runNo = boardResult[group].length + 1;
        const promptText =
          phase === "language"
            ? hybrid.prompts[group]
            : group === "production"
              ? productionPrompt
              : frozenPrompt;
        const promptVersion =
          phase === "language"
            ? hybrid.PROMPT_VERSIONS[group]
            : group === "production"
              ? "ichi-board-vlm-4.0.3-rc1"
              : path.basename(frozenPromptPath, path.extname(frozenPromptPath));
        const result = await run({
          board,
          imageUrl,
          kind: group === "production" ? "production" : "hybrid",
          promptText,
          promptVersion,
          runNo,
        });
        boardResult[group].push(result);
        results.generatedAt = new Date().toISOString();
        fs.writeFileSync(resultFile, `${JSON.stringify(results, null, 2)}\n`);
        console.log(
          `${board.caseId} ${group} run ${runNo}: ${result.latencyMs ?? "ERR"}ms`,
        );
      }
    }
    tcb("storage", "rm", cloudPath, "--force", "--json");
    cloudPaths.splice(cloudPaths.indexOf(cloudPath), 1);
  }
} finally {
  for (const cloudPath of cloudPaths) {
    try {
      tcb("storage", "rm", cloudPath, "--force", "--json");
    } catch {
      console.error(`CLEANUP_REQUIRED ${cloudPath}`);
    }
  }
}
results.generatedAt = new Date().toISOString();
fs.writeFileSync(resultFile, `${JSON.stringify(results, null, 2)}\n`);
console.log(`RESULTS ${resultFile}`);
