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

const EXPERIMENT_SCHEMA_VERSION = "board-provider-evidence-primitive-1.0.0-exp";
const EXPERIMENT_PROTOCOL_VERSION = "evidence-primitive-1.0.0-exp";
const PROMPT_VERSION = "ichi-board-vlm-evidence-primitive-zh-1.0.0-exp";
const MODEL = "qwen3.7-flash";
const MODEL_MAX_PIXELS = 6_291_456;
const promptFile = path.join(
  ROOT,
  "data/recognition-contract/prompt/ichi-board-vlm-evidence-primitive-zh-1.0.0-exp.txt",
);
const prompt = fs.readFileSync(promptFile, "utf8");
const schema = JSON.parse(
  fs.readFileSync(
    path.join(
      ROOT,
      "data/recognition-contract/schema/board-provider-evidence-primitive-1.0.0-exp.schema.json",
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

const chineseDigit = new Map([
  ["零", 0],
  ["〇", 0],
  ["一", 1],
  ["二", 2],
  ["两", 2],
  ["兩", 2],
  ["三", 3],
  ["四", 4],
  ["五", 5],
  ["六", 6],
  ["七", 7],
  ["八", 8],
  ["九", 9],
]);

const parseCjkInteger = (value) => {
  if (!value) return null;
  let total = 0;
  let section = 0;
  let digit = null;
  for (const character of value) {
    if (chineseDigit.has(character)) {
      digit = chineseDigit.get(character);
      continue;
    }
    const unit =
      character === "十"
        ? 10
        : character === "百"
          ? 100
          : character === "千"
            ? 1000
            : null;
    if (!unit) return null;
    section += (digit === null ? 1 : digit) * unit;
    digit = null;
  }
  total += digit === null ? 0 : digit;
  return section + total;
};

const parseRemainingLabel = (value) => {
  const label = normalizeText(value);
  if (!label) return { ok: false, value: null };
  const ascii = /([+-]?\d+)/u.exec(label);
  if (ascii) return { ok: true, value: Number(ascii[1]) };
  const cjk = /[零〇一二两兩三四五六七八九十百千]+/u.exec(label);
  if (!cjk) return { ok: false, value: null };
  const parsed = parseCjkInteger(cjk[0]);
  return { ok: Number.isSafeInteger(parsed), value: parsed };
};

const activeEvidence = (stateEvidence) =>
  [
    ["REMAINING_LABEL", "remainingLabel", stateEvidence.remainingLabel],
    ["FIRST_OPEN", "firstOpenOrdinal", stateEvidence.firstOpenOrdinal],
    ["OPEN_COUNT", "openCount", stateEvidence.openCount],
    ["PASTED_COUNT", "pastedCount", stateEvidence.pastedCount],
  ].filter(([, , value]) => value !== null);

const resolveTierEvidence = (tier, index = 0) => {
  const issues = [];
  const label = normalizeTierLabel(tier.rawLabel);
  const rawTotal = tier.totalTickets;
  const totalValid =
    rawTotal === null || (Number.isSafeInteger(rawTotal) && rawTotal >= 0);
  const totalTickets = totalValid ? rawTotal : null;
  if (!totalValid)
    addIssue(issues, "COUNT_RANGE_INVALID", `tiers/${index}/totalTickets`, {
      value: rawTotal,
    });
  const evidenceRaw = {
    remainingLabel: normalizeText(tier.stateEvidence.remainingLabel),
    firstOpenOrdinal: tier.stateEvidence.firstOpenOrdinal,
    openCount: tier.stateEvidence.openCount,
    pastedCount: tier.stateEvidence.pastedCount,
  };
  const active = activeEvidence(evidenceRaw);
  if (active.length === 0) {
    addIssue(issues, "EVIDENCE_UNKNOWN", `tiers/${index}/stateEvidence`);
    return {
      index,
      label,
      normalizedLabel: label.child,
      rawLabel: label.rawLabel || `未标注特殊赏-${index + 1}`,
      prizeName: normalizeText(tier.prizeName),
      totalTickets,
      pastedTickets: null,
      remainingTickets: null,
      evidencePrimitive: "UNKNOWN",
      evidenceRaw,
      evidenceStrength: "unverified",
      issues,
    };
  }
  if (active.length > 1) {
    addIssue(
      issues,
      "MULTIPLE_STATE_EVIDENCE",
      `tiers/${index}/stateEvidence`,
      { fields: active.map((entry) => entry[1]) },
    );
    return {
      index,
      label,
      normalizedLabel: label.child,
      rawLabel: label.rawLabel || `未标注特殊赏-${index + 1}`,
      prizeName: normalizeText(tier.prizeName),
      totalTickets,
      pastedTickets: null,
      remainingTickets: null,
      evidencePrimitive: "CONFLICT",
      evidenceRaw,
      evidenceStrength: "unverified",
      issues,
    };
  }

  const [primitive, field, rawValue] = active[0];
  let value = rawValue;
  if (primitive === "REMAINING_LABEL") {
    const parsed = parseRemainingLabel(rawValue);
    if (!parsed.ok) {
      addIssue(
        issues,
        "EVIDENCE_LABEL_UNPARSEABLE",
        `tiers/${index}/stateEvidence/remainingLabel`,
        { value: rawValue },
      );
      return {
        index,
        label,
        normalizedLabel: label.child,
        rawLabel: label.rawLabel || `未标注特殊赏-${index + 1}`,
        prizeName: normalizeText(tier.prizeName),
        totalTickets,
        pastedTickets: null,
        remainingTickets: null,
        evidencePrimitive: primitive,
        evidenceRaw,
        evidenceStrength: "strong",
        issues,
      };
    }
    value = parsed.value;
  }
  const minimum = primitive === "FIRST_OPEN" ? 1 : 0;
  if (
    !Number.isSafeInteger(value) ||
    value < minimum ||
    (totalTickets !== null && value > totalTickets)
  ) {
    addIssue(
      issues,
      "COUNT_RANGE_INVALID",
      `tiers/${index}/stateEvidence/${field}`,
      { value, totalTickets },
    );
    return {
      index,
      label,
      normalizedLabel: label.child,
      rawLabel: label.rawLabel || `未标注特殊赏-${index + 1}`,
      prizeName: normalizeText(tier.prizeName),
      totalTickets,
      pastedTickets: null,
      remainingTickets: null,
      evidencePrimitive: primitive,
      evidenceRaw,
      evidenceStrength:
        primitive === "PASTED_COUNT"
          ? "weak"
          : primitive === "OPEN_COUNT"
            ? "medium"
            : "strong",
      issues,
    };
  }

  let pastedTickets;
  let remainingTickets;
  if (primitive === "REMAINING_LABEL" || primitive === "OPEN_COUNT") {
    remainingTickets = value;
    pastedTickets = totalTickets === null ? null : totalTickets - value;
  } else if (primitive === "FIRST_OPEN") {
    pastedTickets = value - 1;
    remainingTickets =
      totalTickets === null ? null : totalTickets - pastedTickets;
  } else {
    pastedTickets = value;
    remainingTickets = totalTickets === null ? null : totalTickets - value;
  }
  return {
    index,
    label,
    normalizedLabel: label.child,
    rawLabel: label.rawLabel || `未标注特殊赏-${index + 1}`,
    prizeName: normalizeText(tier.prizeName),
    totalTickets,
    pastedTickets,
    remainingTickets,
    evidencePrimitive: primitive,
    evidenceRaw,
    evidenceStrength:
      primitive === "PASTED_COUNT"
        ? "weak"
        : primitive === "OPEN_COUNT"
          ? "medium"
          : "strong",
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
          matches.map(
            (tier) =>
              `${tier.totalTickets}:${tier.pastedTickets}:${tier.remainingTickets}`,
          ),
        );
        if (signatures.size > 1) {
          addIssue(issues, "COUNT_CONFLICT", `tiers/${child}`, {
            values: matches.map((tier) => ({
              totalTickets: tier.totalTickets,
              pastedTickets: tier.pastedTickets,
              remainingTickets: tier.remainingTickets,
            })),
          });
          return {
            child,
            matches,
            totalTickets: null,
            pastedTickets: null,
            remainingTickets: null,
            conflict: true,
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
        remainingTickets: matches[0].remainingTickets,
        conflict: false,
      };
    });
    const primitives = new Set(
      children.flatMap((child) =>
        child.matches.map((tier) => tier.evidencePrimitive),
      ),
    );
    const conflict = children.some(
      (child) =>
        child.conflict ||
        child.matches.some((tier) => tier.evidencePrimitive === "CONFLICT"),
    );
    return {
      label: parent,
      normalizedLabel: parent,
      rawLabel: children
        .flatMap((child) => child.matches.map((tier) => tier.rawLabel))
        .join(" / "),
      prizeName:
        children
          .flatMap((child) => child.matches.map((tier) => tier.prizeName))
          .filter(Boolean)
          .join(" / ") || null,
      totalTickets: sumKnown(children.map((child) => child.totalTickets)),
      pastedTickets: sumKnown(children.map((child) => child.pastedTickets)),
      remainingTickets: sumKnown(
        children.map((child) => child.remainingTickets),
      ),
      evidencePrimitive: conflict
        ? "CONFLICT"
        : primitives.size === 1
          ? [...primitives][0]
          : "UNKNOWN",
      evidenceRaw: null,
      issues: children.flatMap((child) =>
        child.matches.flatMap((tier) => tier.issues),
      ),
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
        ...tier,
        label: ordinal <= 32 ? `SP${ordinal}` : "OTHER",
        children: [],
        firstVisualIndex: tier.index,
      };
    });
};

const buildContract = (raw, tiers, request, metrics) =>
  simpleContractBuilder.normalizeSimpleProvider(
    {
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
    },
    request,
    metrics,
  );

const normalizeEvidenceProvider = (raw, request, metrics = {}) => {
  const startedAt = Date.now();
  if (!validateProvider(raw)) {
    const error = new Error("evidence_provider_schema_invalid");
    error.schemaIssues = (validateProvider.errors || []).map((entry) => ({
      instancePath: entry.instancePath,
      keyword: entry.keyword,
      message: entry.message,
    }));
    throw error;
  }
  const rawTiers = raw.tiers.map(resolveTierEvidence);
  const issues = rawTiers.flatMap((tier) => tier.issues);
  const tiers = [
    ...aggregateRegular(rawTiers, issues),
    ...mapSpecials(rawTiers),
  ].sort((left, right) => left.firstVisualIndex - right.firstVisualIndex);
  const weakResolved = tiers.filter(
    (tier) =>
      tier.evidencePrimitive === "PASTED_COUNT" &&
      tier.totalTickets !== null &&
      tier.pastedTickets === tier.totalTickets,
  );
  const boardRisk =
    weakResolved.length >= 2
      ? [
          {
            code: "WEAK_FULL_BOARD_SIGNAL",
            tierLabels: weakResolved.map((tier) => tier.label),
          },
        ]
      : [];
  const contract = buildContract(raw, tiers, request, metrics);
  metrics.normalizeMs = Date.now() - startedAt;
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
      boardRisk,
      specialItemCount: tiers.filter((tier) => /^SP\d+$/u.test(tier.label))
        .length,
      whole: {
        totalTickets: sumKnown(tiers.map((tier) => tier.totalTickets)),
        pastedTickets: sumKnown(tiers.map((tier) => tier.pastedTickets)),
        remainingTickets: sumKnown(tiers.map((tier) => tier.remainingTickets)),
      },
      normalizeMs: metrics.normalizeMs,
    },
  };
};

const buildProviderUrl = (workspaceId, region) =>
  `https://${workspaceId}.${region === "ap-southeast-1" ? "ap-southeast-1.maas.aliyuncs.com" : "cn-beijing.maas.aliyuncs.com"}/compatible-mode/v1/chat/completions`;
const callJsonProvider = async ({
  fetchImpl = fetch,
  apiKey,
  workspaceId,
  region = "cn-beijing",
  imageUrl,
  promptText = prompt,
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
      throw new Error(`evidence_provider_http_${response.status}`);
    const rawContent = payload?.choices?.[0]?.message?.content;
    if (typeof rawContent !== "string")
      throw new Error("evidence_provider_content_missing");
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

module.exports = {
  EXPERIMENT_SCHEMA_VERSION,
  EXPERIMENT_PROTOCOL_VERSION,
  PROMPT_VERSION,
  MODEL,
  MODEL_MAX_PIXELS,
  promptFile,
  prompt,
  schema,
  validateProvider,
  normalizeTierLabel,
  parseRemainingLabel,
  resolveTierEvidence,
  normalizeEvidenceProvider,
  callJsonProvider,
};
