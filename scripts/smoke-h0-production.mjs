import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
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
const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}
const detailFile = args.get("--function-detail");
if (!detailFile) throw new Error("--function-detail is required");
const imageDir = args.get("--images") || "/Users/cunfu/Downloads";
const outputPath = path.resolve(
  args.get("--output") ||
    "artifacts/h0-production-migration/2026-08-26/predeploy-smoke.json",
);

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
        // CloudBase CLI may append progress text after its JSON payload.
      }
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
if (detailPath.startsWith("/private/tmp/") || detailPath.startsWith("/tmp/")) {
  fs.unlinkSync(detailPath);
}
if (!variables.DASHSCOPE_API_KEY || !variables.DASHSCOPE_WORKSPACE_ID) {
  throw new Error("provider_credentials_missing");
}

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

const manifest = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "experiments/universal-scene-model/ground-truth.json"),
    "utf8",
  ),
);
const imageAudit = JSON.parse(
  fs.readFileSync(
    path.join(
      ROOT,
      "artifacts/hybrid-semantic-experiment/2026-08-26/static-audit.json",
    ),
    "utf8",
  ),
).images;
const expectedHashes = new Map(
  imageAudit.map((image) => [image.filename, image.sha256]),
);
const boardLayoutSchema = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "data/board-layout/schema/board-layout.schema.json"),
    "utf8",
  ),
);
const recognitionContractSchema = JSON.parse(
  fs.readFileSync(
    path.join(
      ROOT,
      "data/recognition-contract/schema/recognition-contract.schema.json",
    ),
    "utf8",
  ),
);
const contractAjv = new Ajv2020({
  strict: true,
  strictRequired: false,
  allErrors: true,
});
contractAjv.addSchema(boardLayoutSchema);
const validateContract = contractAjv.compile(recognitionContractSchema);
const asExchange = (contract, board, fileId) => {
  const { contractVersion, ...response } = contract;
  return {
    contractVersion,
    request: {
      requestId: `predeploy-${board.caseId}`,
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
const score = (board, contract) => {
  const actual = new Map(
    (contract.draft?.tiers || []).map((item) => [item.label, item]),
  );
  const tiers = board.tiers.map((expected) => {
    const found = actual.get(expected.tier) || {};
    return {
      tier: expected.tier,
      expected: {
        totalTickets: expected.total,
        pastedTickets: expected.pasted,
        remainingTickets: expected.total - expected.pasted,
      },
      actual: {
        totalTickets: found.totalTickets ?? null,
        pastedTickets: found.pastedTickets ?? null,
        remainingTickets: found.remainingTickets ?? null,
      },
      exact:
        found.totalTickets === expected.total &&
        found.pastedTickets === expected.pasted,
    };
  });
  return {
    tierExact: tiers.filter((item) => item.exact).length,
    tierCount: tiers.length,
    fullBoardExact:
      actual.size === board.tiers.length && tiers.every((item) => item.exact),
    tiers,
  };
};

const results = [];
const cleanupPaths = [];
try {
  for (const board of manifest) {
    const localPath = path.join(imageDir, board.filename);
    const bytes = fs.readFileSync(localPath);
    const imageHash = crypto.createHash("sha256").update(bytes).digest("hex");
    if (imageHash !== expectedHashes.get(board.filename)) {
      throw new Error(`GOLDEN_IMAGE_HASH_MISMATCH:${board.caseId}`);
    }
    const jobId = `h0-predeploy-${board.caseId}`.replace(
      /[^a-zA-Z0-9_-]/gu,
      "-",
    );
    const extension = path.extname(localPath).toLowerCase() || ".jpg";
    const cloudPath = `recognition-temp/${jobId}/board${extension}`;
    cleanupPaths.push(cloudPath);
    tcb("storage", "upload", localPath, cloudPath, "--json");
    const imageUrl = tcb(
      "storage",
      "url",
      cloudPath,
      "--expires",
      "3600",
      "--json",
    )?.data?.url;
    if (!imageUrl) throw new Error(`TEMP_URL_FAILED:${board.caseId}`);
    const fileId = `cloud://${ENV_ID}/${cloudPath}`;
    let persisted = null;
    const logs = [];
    const event = {
      contractVersion: "1.0.0",
      requestId: `predeploy-${board.caseId}`,
      recognitionJobId: jobId,
      recognitionJobToken: "predeploy-server-only-token",
      imageFileId: fileId,
      image: {
        mediaType: "image/jpeg",
        width: board.width,
        height: board.height,
        byteLength: bytes.length,
        acquisition: "camera",
      },
    };
    const contract = await production.main(event, {
      env: {
        DASHSCOPE_API_KEY: variables.DASHSCOPE_API_KEY,
        DASHSCOPE_WORKSPACE_ID: variables.DASHSCOPE_WORKSPACE_ID,
        DASHSCOPE_REGION: variables.DASHSCOPE_REGION || "cn-beijing",
        BOARD_RECOGNITION_MODE: "hybrid_semantic",
      },
      fetchImpl: fetch,
      jobGuard: {
        claim: async () => ({ jobId }),
        succeed: async (_job, result, providerEvidence) => {
          persisted = { result, providerEvidence };
        },
        fail: async () => undefined,
      },
      imageStore: {
        getTemporaryUrl: async () => imageUrl,
        delete: async () => undefined,
      },
      logger: {
        info: (eventName, value) => logs.push({ eventName, value }),
        error: (eventName, value) => logs.push({ eventName, value }),
      },
    });
    const exchange = asExchange(contract, board, fileId);
    const contractValid = Boolean(validateContract(exchange));
    const performance = logs.find(
      (entry) => entry.eventName === "recognize_board_performance",
    )?.value;
    const providerEvidence = persisted?.providerEvidence || null;
    const providerRaw = providerEvidence
      ? {
          ipName: providerEvidence.identity.ipName,
          ipRawText: providerEvidence.identity.ipRawText,
          themeName: providerEvidence.identity.themeName,
          price: providerEvidence.identity.price,
          tiers: providerEvidence.tiers,
        }
      : null;
    const result = {
      caseId: board.caseId,
      filename: board.filename,
      imageSha256: imageHash,
      recognitionMode: providerEvidence?.recognitionMode || null,
      promptVersion: providerEvidence?.promptVersion || null,
      providerSchemaVersion: providerEvidence?.schemaVersion || null,
      providerProtocolVersion: providerEvidence?.protocolVersion || null,
      providerRequestId: providerEvidence?.providerRequestId || null,
      providerRaw,
      ajvPass: performance?.ajvPass === true,
      normalizePass: performance?.normalizePass === true,
      contractValid,
      contractErrors: contractValid ? [] : validateContract.errors,
      contract,
      deterministic: providerEvidence?.deterministic || null,
      latency: {
        providerMs: performance?.providerMs ?? null,
        normalizeMs: performance?.normalizeMs ?? null,
        totalMs: performance?.totalMs ?? null,
      },
      score: score(board, contract),
    };
    results.push(result);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(
      outputPath,
      `${JSON.stringify(
        {
          environmentId: ENV_ID,
          generatedAt: new Date().toISOString(),
          results,
        },
        null,
        2,
      )}\n`,
    );
    console.log(
      `${board.caseId} provider=${result.latency.providerMs}ms normalize=${result.latency.normalizeMs}ms AJV=${result.ajvPass} contract=${result.contractValid}`,
    );
    tcb("storage", "rm", cloudPath, "--force", "--json");
    cleanupPaths.splice(cleanupPaths.indexOf(cloudPath), 1);
  }
} finally {
  for (const cloudPath of cleanupPaths) {
    try {
      tcb("storage", "rm", cloudPath, "--force", "--json");
    } catch {
      console.error(`CLEANUP_REQUIRED ${cloudPath}`);
    }
  }
}
const pass = results.every(
  (result) =>
    result.recognitionMode === "hybrid_semantic" &&
    result.ajvPass &&
    result.normalizePass &&
    result.contractValid,
);
const summary = {
  gate: "H0_PRODUCTION_QUALITY_PREDEPLOY_SMOKE",
  pass,
  environmentId: ENV_ID,
  boards: results.map((result) => ({
    caseId: result.caseId,
    providerRequestId: result.providerRequestId,
    ajvPass: result.ajvPass,
    normalizePass: result.normalizePass,
    contractValid: result.contractValid,
    providerMs: result.latency.providerMs,
    normalizeMs: result.latency.normalizeMs,
    tierExact: `${result.score.tierExact}/${result.score.tierCount}`,
    rawSpecialItemCount: result.deterministic?.rawSpecialItemCount || 0,
    normalizedSpecialItemCount:
      result.deterministic?.normalizedSpecialItemCount || 0,
  })),
  outputPath,
};
console.log(JSON.stringify(summary, null, 2));
if (!pass) process.exitCode = 1;
