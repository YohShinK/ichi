"use strict";

const CONTRACT_VERSION = "1.0.0";
const BOARD_SCHEMA_VERSION = "1.0.0";
const IMAGE_HANDLING = Object.freeze({
  retention: "ephemeral",
  published: false,
  storedInSessionHistory: false,
});

const visibleEvidenceCount = (runs) =>
  runs.reduce((sum, run) => sum + run.length, 0);

const resolveR2Tier = (tier, index = 0) => {
  const providerRemainingTickets = tier.remainingTickets;
  const evidenceCount = visibleEvidenceCount(tier.visibleNumberRuns);
  const hasProviderResult = providerRemainingTickets !== null;
  const resolvedRemainingTickets = hasProviderResult
    ? providerRemainingTickets
    : evidenceCount > 0
      ? evidenceCount
      : null;
  return {
    index,
    tierCode: tier.tierCode,
    rawLabel: tier.rawLabel,
    visibleNumberRuns: tier.visibleNumberRuns,
    providerRemainingTickets,
    visibleEvidenceCount: evidenceCount,
    resolvedRemainingTickets,
    resolutionSource: hasProviderResult
      ? "provider_r"
      : evidenceCount > 0
        ? "visible_fallback"
        : "unknown",
    evidenceMatched:
      hasProviderResult && evidenceCount > 0
        ? providerRemainingTickets === evidenceCount
        : null,
  };
};

const resolveR2Extraction = (raw) => {
  const tiers = raw.tiers.map(resolveR2Tier);
  return {
    normalized: {
      ipName: raw.ipName,
      themeName: raw.themeName,
      tiers: tiers.map((tier) => ({
        tierCode: tier.tierCode,
        rawLabel: tier.rawLabel,
        remainingTickets: tier.resolvedRemainingTickets,
      })),
    },
    trace: {
      tiers,
      evidenceMismatchCount: tiers.filter(
        (tier) => tier.evidenceMatched === false,
      ).length,
      unknownTierCount: tiers.filter(
        (tier) => tier.resolvedRemainingTickets === null,
      ).length,
      zeroTierCount: tiers.filter((tier) => tier.resolvedRemainingTickets === 0)
        .length,
    },
  };
};

const normalizeTierCode = (value) => {
  const compact = String(value || "")
    .normalize("NFKC")
    .trim()
    .toUpperCase()
    .replace(/\s+/gu, "")
    .replace(/[赏賞]$/u, "");
  const regular = /^([A-Z])(?:[0-9]+)?$/u.exec(compact);
  if (regular) return regular[1];
  if (/^SP(?:[1-9]|[12][0-9]|3[0-2])$/u.test(compact)) return compact;
  return "OTHER";
};

const normalizeText = (value) => {
  if (typeof value !== "string") return null;
  const normalized = value.normalize("NFKC").replace(/\s+/gu, " ").trim();
  return normalized || null;
};

const aggregateForRecognitionContract = (resolvedTiers) => {
  const groups = new Map();
  for (const tier of resolvedTiers) {
    const label = normalizeTierCode(tier.tierCode);
    const existing = groups.get(label) || {
      label,
      sourceTiers: [],
      firstVisualIndex: tier.index,
    };
    existing.sourceTiers.push(tier);
    groups.set(label, existing);
  }
  return [...groups.values()]
    .sort((left, right) => left.firstVisualIndex - right.firstVisualIndex)
    .map((group) => {
      const values = group.sourceTiers.map(
        (tier) => tier.resolvedRemainingTickets,
      );
      const remainingTickets = values.every(
        (value) => Number.isSafeInteger(value) && value >= 0,
      )
        ? values.reduce((sum, value) => sum + value, 0)
        : null;
      return {
        ...group,
        rawLabel:
          group.sourceTiers
            .map((tier) => normalizeText(tier.rawLabel))
            .filter(Boolean)
            .join(" / ") || `未标注赏级-${group.firstVisualIndex + 1}`,
        remainingTickets,
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

const manualCount = (formula, failedGuard) => ({
  status: "manual_required",
  formula,
  origin: "derived",
  failedGuards: [failedGuard],
});

const normalizeR2Extraction = (
  raw,
  request,
  metrics = {},
  { canonicalizeIpTheme = (ipName, themeName) => ({ ipName, themeName }) } = {},
) => {
  const startedAt = Date.now();
  const resolved = resolveR2Extraction(raw);
  if (resolved.trace.tiers.length === 0) {
    metrics.normalizeMs = Date.now() - startedAt;
    return {
      contract: {
        contractVersion: CONTRACT_VERSION,
        requestId: request.requestId,
        status: "retake_required",
        issues: [
          {
            code: "NO_TIERS",
            path: "/draft/tiers",
            blocking: true,
            action: "retake_image",
          },
        ],
        imageHandling: IMAGE_HANDLING,
      },
      trace: resolved.trace,
    };
  }
  const businessTiers = aggregateForRecognitionContract(resolved.trace.tiers);
  const identity = canonicalizeIpTheme(
    normalizeText(raw.ipName),
    normalizeText(raw.themeName),
  );
  const issues = [
    {
      code: "PRICE_MISSING",
      path: "/draft/price",
      blocking: true,
      action: "fill_price",
    },
  ];
  const tiers = businessTiers.map((tier, index) => {
    issues.push({
      code: "TIER_SLOT_COUNT_INCONSISTENT",
      path: `/draft/tiers/${index}/slotObservation`,
      blocking: true,
      action: "correct_tier_slots",
    });
    return {
      componentId: `tier-${tier.label.toLowerCase()}-${index + 1}`,
      componentType: "prize_tier",
      label: tier.label,
      rawLabel: tier.rawLabel,
      origin: "recognized",
      confidence: tier.remainingTickets === null ? 0 : 1,
      layout: {
        region: "tier_grid",
        boundingBox: boxForTier(index, businessTiers.length),
        parentId: null,
        zIndex: 1,
        readingOrder: index,
      },
      slotObservation: {
        totalSlots: null,
        openSlots: tier.remainingTickets,
        coveredSlots: null,
        unknownSlots: null,
        arrangement: { direction: "free", rows: 1, columns: 1 },
        confidence: tier.remainingTickets === null ? 0 : 1,
      },
      totalTickets: null,
      pastedTickets: null,
      remainingTickets: tier.remainingTickets,
      countConflict: false,
    };
  });
  const blocks = [];
  const pushBlock = (componentId, componentType, rawText) => {
    if (!rawText) return;
    blocks.push({
      componentId,
      componentType,
      ticketCountRole: "excluded",
      rawText,
      origin: "recognized",
      confidence: 1,
      layout: {
        region: "identity",
        boundingBox: { x: 0.08, y: 0.04, width: 0.62, height: 0.08 },
        parentId: null,
        zIndex: 1,
        readingOrder: tiers.length + blocks.length,
      },
      executable: false,
    });
  };
  pushBlock("series-identity", "series_identity", identity.ipName);
  pushBlock("board-theme", "board_theme", identity.themeName);
  const readingOrder = [...tiers, ...blocks].map((item, index) => {
    item.layout.readingOrder = index;
    return item.componentId;
  });
  const allRemainingKnown = tiers.every(
    (tier) => tier.remainingTickets !== null,
  );
  const remainingTotal = allRemainingKnown
    ? tiers.reduce((sum, tier) => sum + tier.remainingTickets, 0)
    : null;
  const orientation =
    request.width === request.height
      ? "square"
      : request.width > request.height
        ? "landscape"
        : "portrait";
  const draft = {
    schemaVersion: BOARD_SCHEMA_VERSION,
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
      oneSlotOneTicketConfirmed: false,
      confidence: 1,
    },
    ipName: identity.ipName,
    ipRawText: null,
    themeName: identity.themeName,
    price: {
      status: "manual_required",
      origin: "recognized",
      confidence: 0,
    },
    tiers,
    blocks,
    readingOrder,
    derived: {
      totalTickets: manualCount(
        "sum(tiers.totalTickets)",
        "r2_total_tickets_not_observed",
      ),
      remainingTickets:
        remainingTotal === null
          ? manualCount(
              "sum(tiers.remainingTickets)",
              "some_r2_remaining_tickets_unknown",
            )
          : {
              status: "auto_confirmed",
              value: remainingTotal,
              formula: "sum(tiers.remainingTickets)",
              origin: "derived",
            },
    },
  };
  metrics.normalizeMs = Date.now() - startedAt;
  return {
    contract: {
      contractVersion: CONTRACT_VERSION,
      requestId: request.requestId,
      status: "needs_user_input",
      draft,
      issues,
      imageHandling: IMAGE_HANDLING,
    },
    trace: {
      ...resolved.trace,
      businessTiers: businessTiers.map((tier) => ({
        label: tier.label,
        sourceTierCodes: tier.sourceTiers.map((source) => source.tierCode),
        remainingTickets: tier.remainingTickets,
      })),
      whole: {
        totalTickets: null,
        pastedTickets: null,
        remainingTickets: remainingTotal,
      },
    },
  };
};

module.exports = {
  visibleEvidenceCount,
  resolveR2Tier,
  resolveR2Extraction,
  normalizeTierCode,
  aggregateForRecognitionContract,
  normalizeR2Extraction,
};
