import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const ROOT = process.cwd();
const require = createRequire(
  path.join(ROOT, "services/cloudbase/functions/recognize-board/package.json"),
);
const production = require(
  path.join(ROOT, "services/cloudbase/functions/recognize-board/index.js"),
);
const sourcePromptPath = path.join(
  ROOT,
  "data/recognition-contract/prompt/ichi-board-vlm-hybrid-semantic-zh-1.0.0-frozen-exp.txt",
);
const productionPromptPath = path.join(
  ROOT,
  "data/recognition-contract/prompt/ichi-board-vlm-hybrid-semantic-1.0.0.txt",
);
const sourceSchemaPath = path.join(
  ROOT,
  "data/recognition-contract/schema/board-provider-hybrid-semantic-1.0.0-exp.schema.json",
);
const productionSchemaPath = path.join(
  ROOT,
  "data/recognition-contract/schema/board-provider-hybrid-semantic-1.0.0.schema.json",
);
const baselinePath = path.join(
  ROOT,
  "artifacts/hybrid-semantic-experiment/2026-08-26/architecture-results.json",
);
const outputPath = path.join(
  ROOT,
  "artifacts/h0-production-migration/2026-08-26/migration-parity.json",
);

const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const sourcePrompt = fs.readFileSync(sourcePromptPath);
const productionPrompt = fs.readFileSync(productionPromptPath);
const expectedHash =
  "0b4e572378fad8e445f63c6b67997415a1099a0c4ae4d968a6182b545b22226b";
const sourceHash = hash(sourcePrompt);
const productionHash = hash(productionPrompt);
if (
  sourceHash !== expectedHash ||
  productionHash !== expectedHash ||
  !sourcePrompt.equals(productionPrompt)
) {
  throw new Error("FROZEN_H0_PROMPT_HASH_MISMATCH");
}

const stripSchemaMetadata = (schema) => {
  const value = structuredClone(schema);
  delete value.$id;
  delete value.title;
  return value;
};
const sourceSchema = JSON.parse(fs.readFileSync(sourceSchemaPath, "utf8"));
const productionSchema = JSON.parse(
  fs.readFileSync(productionSchemaPath, "utf8"),
);
if (
  JSON.stringify(stripSchemaMetadata(sourceSchema)) !==
  JSON.stringify(stripSchemaMetadata(productionSchema))
) {
  throw new Error("FROZEN_H0_SCHEMA_SEMANTICS_MISMATCH");
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
const mode = production.__test.resolveRecognitionMode({
  BOARD_RECOGNITION_MODE: "hybrid_semantic",
});
const normalizeTier = (tier) => ({
  label: tier.label,
  totalTickets: tier.totalTickets,
  pastedTickets: tier.pastedTickets,
  remainingTickets: tier.remainingTickets,
});
const boards = baseline.boards.map((board) => {
  const run = board.hybrid?.[0];
  if (!run?.parsedProvider || !run?.normalized?.trace?.tiers) {
    throw new Error(`FROZEN_H0_BASELINE_MISSING:${board.caseId}`);
  }
  const request = {
    requestId: `parity-${board.caseId}`,
    width: board.groundTruth.width,
    height: board.groundTruth.height,
  };
  const migrated = production.__test.normalizeForRecognitionMode(
    run.parsedProvider,
    request,
    {},
    mode,
  );
  const baselineTiers = run.normalized.trace.tiers.map(normalizeTier);
  const productionTiers = migrated.trace.tiers.map(normalizeTier);
  const tiersEqual =
    JSON.stringify(baselineTiers) === JSON.stringify(productionTiers);
  return {
    caseId: board.caseId,
    filename: board.filename,
    providerShapeKeys: Object.keys(run.parsedProvider).sort(),
    baselineTiers,
    productionTiers,
    tiersEqual,
    rawSpecialItemCount: migrated.trace.rawSpecialItemCount,
    normalizedSpecialItemCount: migrated.trace.normalizedSpecialItemCount,
    contractVersion: migrated.contract.contractVersion,
    contractStatus: migrated.contract.status,
  };
});
const pass = boards.every((board) => board.tiersEqual);
const report = {
  gate: "FROZEN_H0_TO_PRODUCTION_MIGRATION_PARITY",
  pass,
  sourcePrompt: path.basename(sourcePromptPath),
  productionPrompt: path.basename(productionPromptPath),
  sourceHash,
  productionHash,
  promptByteEquivalent: sourcePrompt.equals(productionPrompt),
  schemaSemanticParity: true,
  providerProtocol: "hybrid-semantic-1.0.0",
  recognitionContract: "1.0.0",
  boards,
};
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      pass,
      sourceHash,
      productionHash,
      boards: boards.map((board) => ({
        caseId: board.caseId,
        tiersEqual: board.tiersEqual,
        rawSpecialItemCount: board.rawSpecialItemCount,
        normalizedSpecialItemCount: board.normalizedSpecialItemCount,
      })),
      outputPath,
    },
    null,
    2,
  ),
);
if (!pass) process.exitCode = 1;
