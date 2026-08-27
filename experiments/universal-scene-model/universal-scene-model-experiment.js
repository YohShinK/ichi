"use strict";

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");

const repoRoot = path.resolve(__dirname, "../..");
const cloudFunctionRequire = createRequire(
  path.join(
    repoRoot,
    "services/cloudbase/functions/recognize-board/package.json",
  ),
);
const Ajv2020 = cloudFunctionRequire("ajv/dist/2020").default;

const PRODUCTION_PROMPT_VERSION = "ichi-board-vlm-4.0.3-rc1";
const EXPERIMENT_PROMPT_VERSION = "ichi-board-vlm-4.1.0-scene-exp";
const PROVIDER_SCHEMA_VERSION = "board-provider-extraction-4.0.0-rc1";
const MODEL = "qwen3.7-flash";
const MODEL_MAX_PIXELS = 6_291_456;

const read = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
const productionPrompt = read(
  "data/recognition-contract/prompt/ichi-board-vlm-4.0.3-rc1.txt",
);
const experimentalPrompt = read(
  "data/recognition-contract/prompt/ichi-board-vlm-4.1.0-scene-exp.txt",
);
const providerSchema = JSON.parse(
  read(
    "data/recognition-contract/schema/board-provider-extraction-4.0.0-rc1.schema.json",
  ),
);
const ajv = new Ajv2020({ strict: true, allErrors: true });
const validateProvider = ajv.compile(providerSchema);

const providerUrl = (workspaceId, region) => {
  const suffix =
    region === "ap-southeast-1"
      ? "ap-southeast-1.maas.aliyuncs.com"
      : "cn-beijing.maas.aliyuncs.com";
  return `https://${workspaceId}.${suffix}/compatible-mode/v1/chat/completions`;
};

const callProvider = async ({
  fetchImpl = fetch,
  apiKey,
  workspaceId,
  region = "cn-beijing",
  imageUrl,
  prompt,
  timeoutMs = 45_000,
}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const response = await fetchImpl(providerUrl(workspaceId, region), {
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
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: imageUrl },
                max_pixels: MODEL_MAX_PIXELS,
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
    if (!response.ok) throw new Error(`provider_http_${response.status}`);
    const rawContent = payload?.choices?.[0]?.message?.content;
    if (typeof rawContent !== "string") {
      throw new Error("provider_content_missing");
    }
    let parsed = null;
    let jsonValid = true;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      jsonValid = false;
    }
    return {
      requestId: response.headers.get("x-request-id") || null,
      latencyMs: Date.now() - startedAt,
      usage: payload.usage || null,
      rawContent,
      parsed,
      jsonValid,
    };
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = {
  PRODUCTION_PROMPT_VERSION,
  EXPERIMENT_PROMPT_VERSION,
  PROVIDER_SCHEMA_VERSION,
  MODEL,
  MODEL_MAX_PIXELS,
  productionPrompt,
  experimentalPrompt,
  providerSchema,
  validateProvider,
  providerUrl,
  callProvider,
};
