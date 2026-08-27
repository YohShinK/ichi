"use strict";

const CONTRACT_VERSION = "1.0.0";
const BOARD_SCHEMA_VERSION = "1.0.0";
const IMAGE_HANDLING = Object.freeze({
  retention: "ephemeral",
  published: false,
  storedInSessionHistory: false,
});

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

const internalIssue = (code, path, detail = null) => ({ code, path, detail });
const contractIssue = (code, path, action) => ({
  code,
  path,
  blocking: true,
  action,
});

const inspectRawTier = (tier, index, countAuthority = "pasted") => {
  const label = normalizeTierLabel(tier.rawLabel);
  const totalTickets = tier.totalTickets;
  let pastedTickets = tier.pastedTickets;
  let remainingTickets =
    countAuthority === "remaining" ? tier.remainingTickets : null;
  const issues = [];
  if (
    countAuthority === "remaining" &&
    totalTickets !== null &&
    remainingTickets !== null
  ) {
    if (remainingTickets > totalTickets) {
      issues.push(
        internalIssue("COUNT_RANGE_INVALID", `/tiers/${index}`, {
          totalTickets,
          remainingTickets,
        }),
      );
      remainingTickets = null;
      pastedTickets = null;
    } else {
      pastedTickets = totalTickets - remainingTickets;
    }
  }
  if (
    totalTickets !== null &&
    pastedTickets !== null &&
    pastedTickets > totalTickets
  ) {
    issues.push(
      internalIssue("COUNT_RANGE_INVALID", `/tiers/${index}`, {
        totalTickets,
        pastedTickets,
      }),
    );
    pastedTickets = null;
  }
  return {
    index,
    label,
    rawLabel: label.rawLabel,
    prizeName: normalizeText(tier.prizeName),
    totalTickets,
    pastedTickets,
    remainingTickets:
      countAuthority === "remaining"
        ? remainingTickets
        : totalTickets !== null && pastedTickets !== null
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
          issues.push(
            internalIssue("COUNT_CONFLICT", `/tiers/${child}`, {
              values: matches.map((tier) => ({
                totalTickets: tier.totalTickets,
                pastedTickets: tier.pastedTickets,
              })),
            }),
          );
          return {
            child,
            matches,
            totalTickets: null,
            pastedTickets: null,
          };
        }
        issues.push(
          internalIssue("COUNT_DUPLICATE", `/tiers/${child}`, {
            count: matches.length,
          }),
        );
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
        .filter(Boolean)
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
      countConflict: children.some((child) =>
        issues.some((entry) => {
          if (
            entry.code === "COUNT_CONFLICT" &&
            entry.path === `/tiers/${child.child}`
          ) {
            return true;
          }
          return (
            entry.code === "COUNT_RANGE_INVALID" &&
            child.matches.some(
              (match) => entry.path === `/tiers/${match.index}`,
            )
          );
        }),
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
        countConflict: tier.issues.some(
          (entry) => entry.code === "COUNT_RANGE_INVALID",
        ),
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

const normalizeHybridExtraction = (
  raw,
  request,
  metrics = {},
  {
    canonicalizeIpTheme = (ipName, themeName) => ({ ipName, themeName }),
    countAuthority = "pasted",
  } = {},
) => {
  const startedAt = Date.now();
  const rawTiers = raw.tiers.map((tier, index) =>
    inspectRawTier(tier, index, countAuthority),
  );
  const internalIssues = rawTiers.flatMap((tier) => tier.issues);
  const regular = aggregateRegular(rawTiers, internalIssues);
  const specials = mapSpecials(rawTiers);
  const businessTiers = [...regular, ...specials].sort(
    (left, right) => left.firstVisualIndex - right.firstVisualIndex,
  );
  const usableRawTierCount = rawTiers.filter(
    (tier) =>
      tier.rawLabel !== null ||
      tier.prizeName !== null ||
      tier.totalTickets !== null ||
      tier.pastedTickets !== null,
  ).length;
  if (usableRawTierCount === 0) {
    metrics.normalizeMs = Date.now() - startedAt;
    return {
      contract: {
        contractVersion: CONTRACT_VERSION,
        requestId: request.requestId,
        status: "retake_required",
        issues: [contractIssue("NO_TIERS", "/draft/tiers", "retake_image")],
        imageHandling: IMAGE_HANDLING,
      },
      trace: {
        rawTiers,
        tiers: [],
        issues: internalIssues,
        rawSpecialItemCount: specials.length,
        normalizedSpecialItemCount: 0,
        partialTierCount: 0,
        countRangeIssueCount: 0,
        whole: {
          totalTickets: null,
          pastedTickets: null,
          remainingTickets: null,
        },
      },
    };
  }

  const identity = canonicalizeIpTheme(
    normalizeText(raw.ipName),
    normalizeText(raw.themeName),
  );
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
      tier.remainingTickets !== null &&
      !tier.countConflict;
    const hasRangeIssue = internalIssues.some(
      (entry) =>
        entry.code === "COUNT_RANGE_INVALID" &&
        businessTiers[index].firstVisualIndex ===
          Number(entry.path.split("/").at(-1)),
    );
    if (!complete) {
      issues.push(
        contractIssue(
          tier.countConflict || hasRangeIssue
            ? "TICKET_COUNT_CONFLICT"
            : "TIER_SLOT_COUNT_INCONSISTENT",
          `/draft/tiers/${index}/slotObservation`,
          "correct_tier_slots",
        ),
      );
    }
    return {
      componentId: `tier-${tier.label.toLowerCase()}-${index + 1}`,
      componentType: "prize_tier",
      label: tier.label,
      rawLabel: tier.rawLabel || `未标注特殊赏-${tier.firstVisualIndex + 1}`,
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
      countConflict: Boolean(tier.countConflict || hasRangeIssue),
    };
  });
  if (price === null) {
    issues.push(contractIssue("PRICE_MISSING", "/draft/price", "fill_price"));
  }
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
  const whole = {
    totalTickets: allCountsKnown
      ? tiers.reduce((sum, tier) => sum + tier.totalTickets, 0)
      : null,
    pastedTickets: allCountsKnown
      ? tiers.reduce((sum, tier) => sum + tier.pastedTickets, 0)
      : null,
    remainingTickets: allCountsKnown
      ? tiers.reduce((sum, tier) => sum + tier.remainingTickets, 0)
      : null,
  };
  const derived = (value, formula) =>
    value === null
      ? {
          status: "manual_required",
          formula,
          origin: "derived",
          failedGuards: ["all_hybrid_tier_counts_known"],
        }
      : { status: "auto_confirmed", value, formula, origin: "derived" };
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
      totalTickets: derived(whole.totalTickets, "sum(tiers.totalTickets)"),
      remainingTickets: derived(
        whole.remainingTickets,
        "sum(tiers.totalTickets - tiers.pastedTickets)",
      ),
    },
  };
  metrics.normalizeMs = Date.now() - startedAt;
  const trace = {
    identity: {
      ipName: identity.ipName,
      ipRawText,
      themeName: identity.themeName,
    },
    price,
    rawTiers,
    tiers: businessTiers,
    issues: internalIssues,
    rawSpecialItemCount: specials.length,
    normalizedSpecialItemCount: tiers.filter((tier) =>
      /^SP\d+$/u.test(tier.label),
    ).length,
    partialTierCount: tiers.filter(
      (tier) => tier.totalTickets === null || tier.pastedTickets === null,
    ).length,
    countRangeIssueCount: internalIssues.filter(
      (entry) => entry.code === "COUNT_RANGE_INVALID",
    ).length,
    whole,
  };
  return {
    contract: {
      contractVersion: CONTRACT_VERSION,
      requestId: request.requestId,
      status: issues.length ? "needs_user_input" : "ready_for_confirmation",
      draft,
      issues,
      imageHandling: IMAGE_HANDLING,
    },
    trace,
  };
};

module.exports = {
  normalizeText,
  normalizeTierLabel,
  inspectRawTier,
  normalizeHybridExtraction,
};
