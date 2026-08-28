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

const EXPERIMENT_PROMPT_VERSION = "ichi-board-vlm-simple-1.0.0-exp";
const EXPERIMENT_SCHEMA_VERSION = "board-provider-simple-1.0.0-exp";
const EXPERIMENT_PROTOCOL_VERSION = "simple-semantic-1.0.0-exp";
const MODEL = "qwen3.7-flash";
const MODEL_MAX_PIXELS = 6_291_456;
const IMAGE_HANDLING = Object.freeze({
  retention: "ephemeral",
  published: false,
  storedInSessionHistory: false,
});

const promptPath = path.join(
  repoRoot,
  "data/recognition-contract/prompt/ichi-board-vlm-simple-1.0.0-exp.txt",
);
const schemaPath = path.join(
  repoRoot,
  "data/recognition-contract/schema/board-provider-simple-1.0.0-exp.schema.json",
);
const prompt = fs.readFileSync(promptPath, "utf8");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const ajv = new Ajv2020({ strict: true, allErrors: true });
const validateProvider = ajv.compile(schema);

const normalizeText = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const normalized = value.normalize("NFKC").replace(/\s+/gu, " ").trim();
  return normalized || null;
};

const canonicalizeIdentity = (rawIp, rawTheme) => {
  let ipName = normalizeText(rawIp);
  let themeName = normalizeText(rawTheme);
  if (!ipName) return { ipName: null, themeName };
  const aliases = [
    [/^(?:PERSONA|女神异闻录)(?:\s*\/\s*|\s+)?(.*)$/iu, "女神异闻录"],
    [/^(?:ARKNIGHTS|明日方舟)(?:\s*\/\s*|\s+)?(.*)$/iu, "明日方舟"],
    [/^(?:NARUTO|火影忍者)(?:\s*\/\s*|\s+)?(.*)$/iu, "火影忍者"],
    [
      /^(?:HONKAI[:：]?\s*STAR\s*RAIL|崩坏[:：]\s*星穹铁道)(?:\s*\/\s*|\s+)?(.*)$/iu,
      "崩坏：星穹铁道",
    ],
  ];
  for (const [pattern, canonical] of aliases) {
    const match = pattern.exec(ipName);
    if (!match) continue;
    ipName = canonical;
    if (!themeName && normalizeText(match[1]))
      themeName = normalizeText(match[1]);
    break;
  }
  if (themeName) {
    const prefix = new RegExp(
      `^${ipName.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}(?:\\s*[/:：·-]\\s*|\\s+)+`,
      "u",
    );
    themeName = normalizeText(themeName.replace(prefix, ""));
    if (themeName === ipName) themeName = null;
    if (
      /^(?:PERSONA)?\s*30(?:TH)?\s*(?:周年|ANNIVERSARY)$/iu.test(
        themeName || "",
      )
    ) {
      themeName = "30周年";
    }
  }
  return { ipName, themeName };
};

const canonicalizeTier = (rawTier) => {
  const text = normalizeText(rawTier);
  if (!text) return { kind: "special", parent: null, child: null };
  const compact = text.toUpperCase().replace(/\s+/gu, "");
  const regular = /^([A-Z])([0-9]+)?(?:赏|賞)?$/u.exec(compact);
  return regular
    ? {
        kind: "regular",
        parent: regular[1],
        child: `${regular[1]}${regular[2] || ""}`,
      }
    : { kind: "special", parent: null, child: null };
};

const strictCount = (value) =>
  value === null || value === undefined
    ? null
    : Number.isSafeInteger(value) && value >= 0
      ? value
      : null;

const issue = (code, pathName, action) => ({
  code,
  path: pathName,
  blocking: true,
  action,
});

const normalizeRawTier = (tier, index) => {
  const labelInfo = canonicalizeTier(tier.rawTier);
  const total = strictCount(tier.totalTickets);
  let pasted = strictCount(tier.pastedTickets);
  const invalidCount =
    (tier.totalTickets !== null &&
      tier.totalTickets !== undefined &&
      total === null) ||
    (tier.pastedTickets !== null &&
      tier.pastedTickets !== undefined &&
      pasted === null) ||
    (total !== null && pasted !== null && pasted > total);
  if (total !== null && pasted !== null && pasted > total) pasted = null;
  return {
    index,
    labelInfo,
    rawLabel: normalizeText(tier.rawTier) || `特殊赏-${index + 1}`,
    prizeName: normalizeText(tier.prizeName),
    total,
    pasted,
    invalidCount,
  };
};

const sumNullable = (values) =>
  values.every((value) => Number.isSafeInteger(value) && value >= 0)
    ? values.reduce((sum, value) => sum + value, 0)
    : null;

const aggregateTiers = (rawTiers) => {
  const groups = [];
  const regularGroups = new Map();
  let specialOrdinal = 0;
  for (const entry of rawTiers) {
    let group;
    if (entry.labelInfo.kind === "regular") {
      group = regularGroups.get(entry.labelInfo.parent);
      if (!group) {
        group = { label: entry.labelInfo.parent, entries: [] };
        regularGroups.set(entry.labelInfo.parent, group);
        groups.push(group);
      }
    } else {
      specialOrdinal += 1;
      group = {
        label: specialOrdinal <= 32 ? `SP${specialOrdinal}` : "OTHER",
        entries: [],
      };
      groups.push(group);
    }
    group.entries.push(entry);
  }

  return groups.map((group) => {
    const allSpecial = group.entries.every(
      (entry) => entry.labelInfo.kind === "special",
    );
    const entries = allSpecial
      ? group.entries
      : Array.from(
          group.entries
            .reduce((children, entry) => {
              const key = entry.labelInfo.child;
              const child = children.get(key) || {
                totals: [],
                pasted: [],
                invalid: false,
              };
              if (entry.total !== null) child.totals.push(entry.total);
              if (entry.pasted !== null) child.pasted.push(entry.pasted);
              child.invalid ||= entry.invalidCount;
              children.set(key, child);
              return children;
            }, new Map())
            .values(),
        ).map((child) => ({
          total: child.totals.length === 0 ? null : Math.max(...child.totals),
          pasted: child.pasted.length === 0 ? null : Math.max(...child.pasted),
          invalidCount: child.invalid,
        }));
    const total = sumNullable(entries.map((entry) => entry.total));
    let pasted = sumNullable(entries.map((entry) => entry.pasted));
    let invalidCount = entries.some((entry) => entry.invalidCount);
    if (total !== null && pasted !== null && pasted > total) {
      pasted = null;
      invalidCount = true;
    }
    return {
      label: group.label,
      rawLabel: group.entries.map((entry) => entry.rawLabel).join(" / "),
      prizeName:
        group.entries
          .map((entry) => entry.prizeName)
          .filter(Boolean)
          .join(" / ") || null,
      totalTickets: total,
      pastedTickets: pasted,
      remainingTickets:
        total !== null && pasted !== null ? total - pasted : null,
      invalidCount,
    };
  });
};

const boxForTier = (index, count) => {
  const height = Math.min(0.12, 0.72 / Math.max(1, count));
  return {
    x: 0.08,
    y: Math.min(0.92 - height, 0.2 + index * height),
    width: 0.84,
    height,
  };
};

const normalizeSimpleProvider = (raw, request, metrics = {}) => {
  const startedAt = Date.now();
  if (!validateProvider(raw)) {
    const error = new Error("simple_provider_schema_invalid");
    error.schemaIssues = (validateProvider.errors || []).map((entry) => ({
      instancePath: entry.instancePath,
      keyword: entry.keyword,
    }));
    throw error;
  }
  const rawTiers = raw.tiers.map(normalizeRawTier);
  const businessTiers = aggregateTiers(rawTiers);
  if (businessTiers.length === 0) {
    return {
      contractVersion: "1.0.0",
      requestId: request.requestId,
      status: "retake_required",
      issues: [issue("NO_TIERS", "/draft/tiers", "retake_image")],
      imageHandling: IMAGE_HANDLING,
    };
  }
  const identity = canonicalizeIdentity(raw.ipName, raw.themeName);
  const ipRawText = normalizeText(raw.ipRawText);
  const price =
    typeof raw.price === "number" && Number.isFinite(raw.price) && raw.price > 0
      ? raw.price
      : null;
  const issues = [];
  const tiers = businessTiers.map((tier, index) => {
    const complete =
      tier.totalTickets !== null &&
      tier.pastedTickets !== null &&
      !tier.invalidCount;
    if (!complete) {
      issues.push(
        issue(
          "TIER_SLOT_COUNT_INCONSISTENT",
          `/draft/tiers/${index}/slotObservation`,
          "correct_tier_slots",
        ),
      );
    }
    return {
      componentId: `tier-${tier.label.toLowerCase()}-${index + 1}`,
      componentType: "prize_tier",
      label: tier.label,
      rawLabel: tier.rawLabel,
      ...(tier.prizeName ? { prizeName: tier.prizeName } : {}),
      origin: "recognized",
      confidence: complete ? 1 : 0,
      layout: {
        region: "tier_grid",
        boundingBox: boxForTier(index, businessTiers.length),
        parentId: null,
        zIndex: 1,
        readingOrder: index,
      },
      slotObservation: {
        totalSlots: tier.totalTickets,
        openSlots: tier.remainingTickets,
        coveredSlots: tier.pastedTickets,
        unknownSlots: complete ? 0 : null,
        arrangement: {
          direction: "wrapped_rows",
          rows: Math.max(1, Math.ceil(Math.max(1, tier.totalTickets || 1) / 8)),
          columns: Math.max(1, Math.min(8, tier.totalTickets || 1)),
        },
        confidence: complete ? 1 : 0,
      },
      totalTickets: tier.totalTickets,
      pastedTickets: tier.pastedTickets,
      remainingTickets: tier.remainingTickets,
      countConflict: tier.invalidCount,
    };
  });
  if (price === null) {
    issues.push(issue("PRICE_MISSING", "/draft/price", "fill_price"));
  }
  const blocks = [];
  const pushBlock = (id, type, text, region) => {
    if (!text) return;
    blocks.push({
      componentId: id,
      componentType: type,
      ticketCountRole: "excluded",
      rawText: text,
      origin: "recognized",
      confidence: 1,
      layout: {
        region,
        boundingBox: { x: 0.08, y: 0.04, width: 0.62, height: 0.08 },
        parentId: null,
        zIndex: 1,
        readingOrder: tiers.length + blocks.length,
      },
      executable: false,
    });
  };
  pushBlock("series-identity", "series_identity", identity.ipName, "identity");
  pushBlock("board-theme", "board_theme", identity.themeName, "identity");
  const readingOrder = [...tiers, ...blocks].map((item) => item.componentId);
  [...tiers, ...blocks].forEach((item, index) => {
    item.layout.readingOrder = index;
  });
  const allCountsKnown = tiers.every(
    (tier) =>
      tier.totalTickets !== null &&
      tier.pastedTickets !== null &&
      tier.remainingTickets !== null &&
      !tier.countConflict,
  );
  const total = allCountsKnown
    ? tiers.reduce((sum, tier) => sum + tier.totalTickets, 0)
    : null;
  const remaining = allCountsKnown
    ? tiers.reduce((sum, tier) => sum + tier.remainingTickets, 0)
    : null;
  const derived = (value, formula) =>
    value === null
      ? {
          status: "manual_required",
          formula,
          origin: "derived",
          failedGuards: ["all_simple_tier_counts_known"],
        }
      : { status: "auto_confirmed", value, formula, origin: "derived" };
  const orientation =
    request.width === request.height
      ? "square"
      : request.width > request.height
        ? "landscape"
        : "portrait";
  const draft = {
    schemaVersion: "1.0.0",
    draftId: `draft-${request.requestId}`,
    image: {
      width: request.width,
      height: request.height,
      orientation,
      storedRemotely: false,
    },
    completeness: {
      frame: "complete",
      allRegularTiersDetected: true,
      oneSlotOneTicketConfirmed: true,
      confidence: 1,
    },
    ipName: identity.ipName,
    ipRawText,
    themeName: identity.themeName,
    price:
      price === null
        ? { status: "manual_required", origin: "recognized", confidence: 0 }
        : {
            status: "recognized",
            amount: price,
            currency: "CNY",
            rawText: String(price),
            origin: "recognized",
            confidence: 1,
          },
    tiers,
    blocks,
    readingOrder,
    derived: {
      totalTickets: derived(total, "sum(tiers.totalTickets)"),
      remainingTickets: derived(
        remaining,
        "sum(tiers.totalTickets - tiers.pastedTickets)",
      ),
    },
  };
  metrics.normalizeMs = Date.now() - startedAt;
  return {
    contractVersion: "1.0.0",
    requestId: request.requestId,
    status: issues.length ? "needs_user_input" : "ready_for_confirmation",
    draft,
    issues,
    imageHandling: IMAGE_HANDLING,
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
    if (!response.ok) {
      throw new Error(`simple_provider_http_${response.status}`);
    }
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("simple_provider_content_missing");
    }
    let parsed = null;
    let jsonValid = true;
    try {
      parsed = JSON.parse(content);
    } catch {
      jsonValid = false;
    }
    return {
      rawContent: content,
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

const callSimpleProvider = (options) =>
  callJsonProvider({ ...options, promptText: prompt });

module.exports = {
  EXPERIMENT_PROMPT_VERSION,
  EXPERIMENT_SCHEMA_VERSION,
  EXPERIMENT_PROTOCOL_VERSION,
  MODEL,
  MODEL_MAX_PIXELS,
  prompt,
  schema,
  validateProvider,
  normalizeSimpleProvider,
  callJsonProvider,
  callSimpleProvider,
  canonicalizeTier,
};
