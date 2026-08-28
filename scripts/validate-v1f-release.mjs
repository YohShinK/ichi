import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const requiredFiles = [
  "docs/delivery/v1-f-automated-evidence.md",
  "docs/delivery/v1-f-human-gates.md",
  "docs/delivery/v1-f-release-candidate-checklist.md",
  "services/cloudbase/functions/recognize-board/.env.example",
  "data/recognition-contract/prompt/ichi-board-vlm-r2-direct-remaining-1.0.0.txt",
  "data/recognition-contract/schema/board-provider-r2-direct-remaining-1.0.0.schema.json",
  "data/recognition-contract/prompt/ichi-board-vlm-r1-visible-evidence-1.1.0.txt",
  "data/recognition-contract/schema/board-provider-r1-visible-evidence-1.1.0.schema.json",
  "data/recognition-contract/prompt/ichi-board-vlm-hybrid-semantic-1.0.0.txt",
  "data/recognition-contract/schema/board-provider-hybrid-semantic-1.0.0.schema.json",
  "data/recognition-contract/policy/board-vlm-policy-1.0.0-rc1.json",
];
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`missing ${file}`);
}

const sitemap = JSON.parse(read("apps/client/miniprogram/sitemap.json"));
if (!Array.isArray(sitemap.rules) || sitemap.rules.length === 0) {
  errors.push("mini-program sitemap must include non-empty rules");
}

const miniProgramRoot = path.join(root, "apps/client/miniprogram");
let sourceBytes = 0;
const visit = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(absolute);
    else if (!/\.(?:test\.ts|map)$/u.test(entry.name)) {
      sourceBytes += fs.statSync(absolute).size;
    }
  }
};
visit(miniProgramRoot);
if (sourceBytes >= 2 * 1024 * 1024) {
  errors.push(
    `mini-program release source is ${sourceBytes} bytes (limit 2 MiB)`,
  );
}

const proxy = read("services/cloudbase/functions/recognize-board/index.js");
const cloudRuntime = read("services/cloudbase/shared/runtime.js");
for (const forbidden of [
  "uploadFile",
  "console.log",
  "console.info",
  "console.debug",
  "qwen3.5-flash",
  "qwen3.5-ocr",
  "callOcrProvider",
  "DASHSCOPE_OCR_MODEL",
]) {
  if (proxy.includes(forbidden))
    errors.push(`recognition proxy contains ${forbidden}`);
}
for (const required of [
  "storedInSessionHistory: false",
  'event.imageFileId = ""',
  "getTempFileURL",
  "deleteFile",
  "PROVIDER_HARD_IMAGE_BYTES",
  "MODEL_MAX_PIXELS",
  'PRIMARY_MODEL = "qwen3.7-flash"',
  'response_format: { type: "json_object" }',
  "enable_thinking: false",
  "validateR2ProviderExtraction",
  "validateR1ProviderExtraction",
  "validateHybridProviderExtraction",
  "resolveR1Extraction",
  "normalizeR2Extraction",
  "recognitionJobToken",
  'status: "processing"',
  'status: "recognized"',
  "sanitizeStructuredResult",
]) {
  if (!proxy.includes(required))
    errors.push(`recognition proxy missing ${required}`);
}
for (const required of [
  "const finalizeObservation",
  'reservation.status = "committed"',
  "quota.used = (quota.used || 0) + 1",
  'status: "committed"',
]) {
  if (!cloudRuntime.includes(required))
    errors.push(`CloudBase runtime missing ${required}`);
}

const environment = read(
  "services/cloudbase/functions/recognize-board/.env.example",
);
for (const key of [
  "DASHSCOPE_API_KEY",
  "DASHSCOPE_WORKSPACE_ID",
  "DASHSCOPE_REGION",
  "DASHSCOPE_MODEL",
]) {
  if (!environment.includes(`${key}=`))
    errors.push(`env example missing ${key}`);
}

const recognitionPolicy = JSON.parse(
  read("data/recognition-contract/policy/board-vlm-policy-1.0.0-rc1.json"),
);
if (recognitionPolicy.modelCandidate !== "qwen3.7-flash") {
  errors.push("recognition policy must lock qwen3.7-flash");
}
if (recognitionPolicy.request?.maxModelCalls !== 1) {
  errors.push("recognition policy must allow exactly one model call");
}

if (errors.length) {
  console.error(
    "V1-F release validation failed:\n" +
      errors.map((item) => `- ${item}`).join("\n"),
  );
  process.exitCode = 1;
} else {
  console.log(
    `V1-F automated preflight passed (${sourceBytes} mini-program source bytes; production model integration remains a human-gated release item).`,
  );
}
