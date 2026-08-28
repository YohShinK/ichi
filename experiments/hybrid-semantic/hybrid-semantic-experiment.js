"use strict";

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");

const ROOT = path.resolve(__dirname, "../..");
const cloudRequire = createRequire(
  path.join(ROOT, "services/cloudbase/functions/recognize-board/package.json"),
);
const Ajv2020 = cloudRequire("ajv/dist/2020").default;
const simpleContractBuilder = require(
  path.join(ROOT, "experiments/simple-semantic/simple-semantic-experiment.js"),
);

const EXPERIMENT_SCHEMA_VERSION = "board-provider-hybrid-semantic-1.0.0-exp";
const EXPERIMENT_PROTOCOL_VERSION = "hybrid-semantic-1.0.0-exp";
const PROMPT_VERSIONS = Object.freeze({
  en: "ichi-board-vlm-hybrid-semantic-en-1.0.0-exp",
  zh: "ichi-board-vlm-hybrid-semantic-zh-1.0.0-exp",
});
const MODEL = "qwen3.7-flash";
const MODEL_MAX_PIXELS = 6_291_456;
const promptFiles = Object.freeze({
  en: path.join(
    ROOT,
    "data/recognition-contract/prompt/ichi-board-vlm-hybrid-semantic-en-1.0.0-exp.txt",
  ),
  zh: path.join(
    ROOT,
    "data/recognition-contract/prompt/ichi-board-vlm-hybrid-semantic-zh-1.0.0-exp.txt",
  ),
});
const prompts = Object.freeze(
  Object.fromEntries(
    Object.entries(promptFiles).map(([language, file]) => [
      language,
      fs.readFileSync(file, "utf8"),
    ]),
  ),
);
const schema = JSON.parse(
  fs.readFileSync(
    path.join(
      ROOT,
      "data/recognition-contract/schema/board-provider-hybrid-semantic-1.0.0-exp.schema.json",
    ),
    "utf8",
  ),
);
const validateProvider = new Ajv2020({ strict: true, allErrors: true }).compile(
  schema,
);

const normalizeText = (value) => {
  if (value === null || value === undefined || typeof value !== "string")
    return null;
  const normalized = value.normalize("NFKC").replace(/\s+/gu, " ").trim();
  return normalized || null;
};

const normalizeTierLabel = (value) => {
  const rawLabel = normalizeText(value);
  if (!rawLabel)
    return { kind: "special", rawLabel: null, parent: null, child: null };
  const compact = rawLabel
    .toUpperCase()
    .replace(/\s+/gu, "")
    .replace(/[赏賞]$/u, "");
  const match = /^([A-Z])([0-9]+)?$/u.exec(compact);
  return match
    ? {
        kind: "regular",
        rawLabel,
        parent: match[1],
        child: `${match[1]}${match[2] || ""}`,
      }
    : { kind: "special", rawLabel, parent: null, child: null };
};

const addIssue = (issues, code, pathName, detail = null) => {
  issues.push({ code, path: pathName, detail });
};

const inspectTier = (tier, index) => {
  const label = normalizeTierLabel(tier.rawLabel);
  const totalTickets = tier.totalTickets;
  let pastedTickets = tier.pastedTickets;
  const issues = [];
  if (
    totalTickets !== null &&
    (!Number.isSafeInteger(totalTickets) || totalTickets < 0)
  ) {
    addIssue(issues, "COUNT_TYPE_INVALID", `tiers/${index}/totalTickets`);
  }
  if (
    pastedTickets !== null &&
    (!Number.isSafeInteger(pastedTickets) || pastedTickets < 0)
  ) {
    addIssue(issues, "COUNT_TYPE_INVALID", `tiers/${index}/pastedTickets`);
  }
  if (
    totalTickets !== null &&
    pastedTickets !== null &&
    pastedTickets > totalTickets
  ) {
    addIssue(issues, "COUNT_RANGE_INVALID", `tiers/${index}`, {
      totalTickets,
      pastedTickets,
    });
    pastedTickets = null;
  }
  return {
    index,
    label,
    rawLabel: label.rawLabel || `未标注特殊赏-${index + 1}`,
    prizeName: normalizeText(tier.prizeName),
    totalTickets,
    pastedTickets,
    remainingTickets:
      totalTickets !== null && pastedTickets !== null
        ? totalTickets - pastedTickets
        : null,
    issues,
  };
};

const sumKnown = (values) =>
  values.every((value) => Number.isSafeInteger(value) && value >= 0)
    ? values.reduce((sum, value) => sum + value, 0)
    : null;

const aggregateRegular = (rawTiers, issues) => {
  const parents = new Map();
  for (const tier of rawTiers.filter(
    (candidate) => candidate.label.kind === "regular",
  )) {
    const children = parents.get(tier.label.parent) || new Map();
    const matches = children.get(tier.label.child) || [];
    matches.push(tier);
    children.set(tier.label.child, matches);
    parents.set(tier.label.parent, children);
  }
  return [...parents.entries()].map(([parent, childMap]) => {
    const children = [...childMap.entries()].map(([child, matches]) => {
      if (matches.length > 1) {
        const signatures = new Set(
          matches.map((tier) => `${tier.totalTickets}:${tier.pastedTickets}`),
        );
        if (signatures.size > 1) {
          addIssue(issues, "COUNT_CONFLICT", `tiers/${child}`, {
            values: matches.map((tier) => ({
              totalTickets: tier.totalTickets,
              pastedTickets: tier.pastedTickets,
            })),
          });
          return {
            child,
            matches,
            totalTickets: null,
            pastedTickets: null,
          };
        }
        addIssue(issues, "COUNT_DUPLICATE", `tiers/${child}`, {
          count: matches.length,
        });
      }
      return {
        child,
        matches,
        totalTickets: matches[0].totalTickets,
        pastedTickets: matches[0].pastedTickets,
      };
    });
    const totalTickets = sumKnown(children.map((child) => child.totalTickets));
    const pastedTickets = sumKnown(
      children.map((child) => child.pastedTickets),
    );
    return {
      label: parent,
      rawLabel: children
        .flatMap((child) => child.matches.map((tier) => tier.rawLabel))
        .join(" / "),
      prizeName:
        children
          .flatMap((child) => child.matches.map((tier) => tier.prizeName))
          .filter(Boolean)
          .join(" / ") || null,
      totalTickets,
      pastedTickets,
      remainingTickets:
        totalTickets !== null && pastedTickets !== null
          ? totalTickets - pastedTickets
          : null,
      children,
      firstVisualIndex: Math.min(
        ...children.flatMap((child) => child.matches.map((tier) => tier.index)),
      ),
    };
  });
};

const mapSpecials = (rawTiers) => {
  let ordinal = 0;
  return rawTiers
    .filter((tier) => tier.label.kind === "special")
    .map((tier) => {
      ordinal += 1;
      return {
        label: ordinal <= 32 ? `SP${ordinal}` : "OTHER",
        rawLabel: tier.rawLabel,
        prizeName: tier.prizeName,
        totalTickets: tier.totalTickets,
        pastedTickets: tier.pastedTickets,
        remainingTickets: tier.remainingTickets,
        children: [],
        firstVisualIndex: tier.index,
      };
    });
};

const buildContract = (raw, tiers, request, metrics) => {
  const mapped = {
    ipName: normalizeText(raw.ipName),
    ipRawText: normalizeText(raw.ipRawText),
    themeName: normalizeText(raw.themeName),
    price: raw.price,
    tiers: tiers.map((tier) => ({
      rawTier: tier.label,
      prizeName: tier.prizeName,
      totalTickets: tier.totalTickets,
      pastedTickets: tier.pastedTickets,
    })),
  };
  return simpleContractBuilder.normalizeSimpleProvider(
    mapped,
    request,
    metrics,
  );
};

const normalizeHybridProvider = (raw, request, metrics = {}) => {
  const startedAt = Date.now();
  if (!validateProvider(raw)) {
    const error = new Error("hybrid_provider_schema_invalid");
    error.schemaIssues = (validateProvider.errors || []).map((entry) => ({
      instancePath: entry.instancePath,
      keyword: entry.keyword,
      message: entry.message,
    }));
    throw error;
  }
  const rawTiers = raw.tiers.map(inspectTier);
  const issues = rawTiers.flatMap((tier) => tier.issues);
  const regular = aggregateRegular(rawTiers, issues);
  const specials = mapSpecials(rawTiers);
  const tiers = [...regular, ...specials].sort(
    (left, right) => left.firstVisualIndex - right.firstVisualIndex,
  );
  const contract = buildContract(raw, tiers, request, metrics);
  metrics.normalizeMs = Date.now() - startedAt;
  const allKnown = tiers.every(
    (tier) => tier.totalTickets !== null && tier.pastedTickets !== null,
  );
  return {
    contract,
    trace: {
      identity: {
        ipName: normalizeText(raw.ipName),
        ipRawText: normalizeText(raw.ipRawText),
        themeName: normalizeText(raw.themeName),
      },
      price: raw.price,
      rawTiers,
      tiers,
      issues,
      specialItemCount: specials.length,
      whole: {
        totalTickets: allKnown
          ? tiers.reduce((sum, tier) => sum + tier.totalTickets, 0)
          : null,
        pastedTickets: allKnown
          ? tiers.reduce((sum, tier) => sum + tier.pastedTickets, 0)
          : null,
        remainingTickets: allKnown
          ? tiers.reduce((sum, tier) => sum + tier.remainingTickets, 0)
          : null,
      },
      normalizeMs: metrics.normalizeMs,
    },
  };
};

const buildProviderUrl = (workspaceId, region) => {
  const suffix =
    region === "ap-southeast-1"
      ? "ap-southeast-1.maas.aliyuncs.com"
      : "cn-beijing.maas.aliyuncs.com";
  return `https://${workspaceId}.${suffix}/compatible-mode/v1/chat/completions`;
};

const callJsonProvider = async ({
  fetchImpl = fetch,
  apiKey,
  workspaceId,
  region = "cn-beijing",
  imageUrl,
  promptText,
  timeoutMs = 45_000,
}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const response = await fetchImpl(buildProviderUrl(workspaceId, region), {
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
    if (!response.ok)
      throw new Error(`hybrid_provider_http_${response.status}`);
    const rawContent = payload?.choices?.[0]?.message?.content;
    if (typeof rawContent !== "string")
      throw new Error("hybrid_provider_content_missing");
    let parsed = null;
    let jsonValid = true;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      jsonValid = false;
    }
    return {
      rawContent,
      parsed,
      jsonValid,
      latencyMs: Date.now() - startedAt,
      usage: payload.usage || null,
      requestId: response.headers.get("x-request-id") || null,
    };
  } finally {
    clearTimeout(timeout);
  }
};

const callHybridProvider = (language, options) => {
  if (!prompts[language]) throw new Error("hybrid_language_invalid");
  return callJsonProvider({ ...options, promptText: prompts[language] });
};

module.exports = {
  EXPERIMENT_PROTOCOL_VERSION,
  EXPERIMENT_SCHEMA_VERSION,
  PROMPT_VERSIONS,
  MODEL,
  MODEL_MAX_PIXELS,
  promptFiles,
  prompts,
  schema,
  validateProvider,
  normalizeTierLabel,
  normalizeHybridProvider,
  callJsonProvider,
  callHybridProvider,
};
