"use strict";

const normalizeRawLabel = (value) => {
  if (typeof value !== "string") return null;
  const normalized = value
    .normalize("NFKC")
    .trim()
    .toUpperCase()
    .replace(/\s+/gu, "")
    .replace(/[赏賞]$/u, "");
  return normalized || null;
};

const classifyLabel = (rawLabel) => {
  const normalized = normalizeRawLabel(rawLabel);
  if (normalized === null) return { kind: "unresolved", normalized: null };
  const regular = /^([A-Z])([0-9]+)?$/u.exec(normalized);
  if (regular)
    return {
      kind: "regular",
      normalized,
      parent: regular[1],
      child: regular[2] ? normalized : null,
    };
  return { kind: "special", normalized };
};

const validateOrdinals = (ordinals) => {
  if (!Array.isArray(ordinals)) {
    const error = new Error("OPEN_ORDINALS_INVALID");
    error.code = "OPEN_ORDINALS_INVALID";
    throw error;
  }
  for (const ordinal of ordinals)
    if (!Number.isInteger(ordinal) || ordinal < 1) {
      const error = new Error("OPEN_ORDINAL_INVALID");
      error.code = "OPEN_ORDINAL_INVALID";
      error.ordinal = ordinal;
      throw error;
    }
};

const resolveRawTier = (tier, index) => {
  validateOrdinals(tier.openOrdinals);
  const warnings = [];
  const seen = new Set();
  const uniqueOrdinals = [];
  for (const ordinal of tier.openOrdinals) {
    if (seen.has(ordinal)) {
      if (!warnings.includes("DUPLICATE_OPEN_ORDINAL"))
        warnings.push("DUPLICATE_OPEN_ORDINAL");
      continue;
    }
    seen.add(ordinal);
    uniqueOrdinals.push(ordinal);
  }
  const sorted = [...uniqueOrdinals].sort((left, right) => left - right);
  if (
    sorted.length > 1 &&
    sorted.some((ordinal, ordinalIndex) =>
      ordinalIndex === 0 ? false : ordinal !== sorted[ordinalIndex - 1] + 1,
    )
  )
    warnings.push("NON_CONTIGUOUS_OPEN_ORDINALS");

  const label = classifyLabel(tier.rawLabel);
  if (label.kind === "unresolved") warnings.push("RAW_LABEL_UNRESOLVED");
  return {
    index,
    rawLabel: tier.rawLabel,
    normalizedRawLabel: label.normalized,
    label,
    openOrdinals: uniqueOrdinals,
    observedOpenCount: uniqueOrdinals.length,
    observationComplete: tier.observationComplete === true ? true : null,
    remainingTickets:
      tier.observationComplete === true ? uniqueOrdinals.length : null,
    warnings,
  };
};

const aggregateRegular = (rawTiers) => {
  const groups = new Map();
  for (const tier of rawTiers.filter(
    (entry) => entry.label.kind === "regular",
  )) {
    const parent = tier.label.parent;
    const group = groups.get(parent) || [];
    group.push(tier);
    groups.set(parent, group);
  }
  return [...groups.entries()].map(([label, members]) => {
    const children = members.filter((member) => member.label.child !== null);
    const sources = children.length > 0 ? children : members;
    const allResolved = sources.every(
      (source) => source.remainingTickets !== null,
    );
    return {
      label,
      remainingTickets: allResolved
        ? sources.reduce((sum, source) => sum + source.remainingTickets, 0)
        : null,
      observedOpenCount: sources.reduce(
        (sum, source) => sum + source.observedOpenCount,
        0,
      ),
      children: sources,
      warnings: sources.flatMap((source) => source.warnings),
      firstVisualIndex: Math.min(...sources.map((source) => source.index)),
    };
  });
};

const mapSpecials = (rawTiers) => {
  let specialOrdinal = 0;
  return rawTiers
    .filter((tier) => tier.label.kind === "special")
    .map((tier) => {
      specialOrdinal += 1;
      return {
        label: `SP${specialOrdinal}`,
        remainingTickets: tier.remainingTickets,
        observedOpenCount: tier.observedOpenCount,
        children: [tier],
        warnings: tier.warnings,
        firstVisualIndex: tier.index,
      };
    });
};

const resolveObservation = (provider) => {
  if (!provider || !Array.isArray(provider.tiers)) {
    const error = new Error("PROVIDER_TIERS_INVALID");
    error.code = "PROVIDER_TIERS_INVALID";
    throw error;
  }
  const rawTiers = provider.tiers.map(resolveRawTier);
  const tiers = [...aggregateRegular(rawTiers), ...mapSpecials(rawTiers)].sort(
    (left, right) => left.firstVisualIndex - right.firstVisualIndex,
  );
  return {
    rawTiers,
    tiers,
    unresolved: rawTiers.filter((tier) => tier.label.kind === "unresolved"),
    warnings: rawTiers.flatMap((tier) =>
      tier.warnings.map((code) => ({ code, index: tier.index })),
    ),
  };
};

module.exports = {
  normalizeRawLabel,
  classifyLabel,
  validateOrdinals,
  resolveRawTier,
  resolveObservation,
};
