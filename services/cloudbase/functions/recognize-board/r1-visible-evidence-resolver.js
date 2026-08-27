"use strict";

const DIRECTIONS = Object.freeze({
  NEUTRAL_ONE: "NEUTRAL_ONE",
  FORWARD_WEAK: "FORWARD_WEAK",
  FORWARD_STRONG: "FORWARD_STRONG",
  REVERSE_STRONG: "REVERSE_STRONG",
  REVERSE_INCOMPLETE: "REVERSE_INCOMPLETE",
  FORWARD_WITH_GAP: "FORWARD_WITH_GAP",
  REVERSE_WITH_GAP: "REVERSE_WITH_GAP",
  FORWARD_WITH_OUTLIER: "FORWARD_WITH_OUTLIER",
  REVERSE_WITH_OUTLIER: "REVERSE_WITH_OUTLIER",
  UNKNOWN_ORDER: "UNKNOWN_ORDER",
  ROW_RESET: "ROW_RESET",
  DIRECTION_CONFLICT: "DIRECTION_CONFLICT",
  NONE: "NONE",
});

const RESOLUTION_KINDS = Object.freeze({
  MULTI_EVIDENCE_EXACT: "MULTI_EVIDENCE_EXACT",
  FORWARD_SEQUENCE: "FORWARD_SEQUENCE",
  REVERSE_WITH_PASTED: "REVERSE_WITH_PASTED",
  TOTAL_PLUS_UNPASTED: "TOTAL_PLUS_UNPASTED",
  POSITIVE_TOTAL_PASTED_FALLBACK: "POSITIVE_TOTAL_PASTED_FALLBACK",
  SEQUENCE_GAP_REPAIRED: "SEQUENCE_GAP_REPAIRED",
  LEADING_SLOT_REPAIRED: "LEADING_SLOT_REPAIRED",
  TRAILING_SLOT_REPAIRED: "TRAILING_SLOT_REPAIRED",
  ORDER_LOST_BUT_CLOSED: "ORDER_LOST_BUT_CLOSED",
  PARTIAL_TOTAL_ONLY: "PARTIAL_TOTAL_ONLY",
  PARTIAL_UNPASTED_ONLY: "PARTIAL_UNPASTED_ONLY",
  AMBIGUOUS: "AMBIGUOUS",
  CONFLICT: "CONFLICT",
  ZERO_NOT_CONFIRMED: "ZERO_NOT_CONFIRMED",
});

const integerOrNull = (value, minimum) =>
  Number.isSafeInteger(value) && value >= minimum ? value : null;

const normalizeObservation = (entry) => {
  if (entry && typeof entry === "object" && !Array.isArray(entry)) {
    return {
      value: integerOrNull(entry.value, 1),
      rawText:
        typeof entry.rawText === "string" && entry.rawText.trim()
          ? entry.rawText.normalize("NFKC").trim()
          : null,
    };
  }
  return { value: integerOrNull(entry, 1), rawText: null };
};

const normalizeRuns = (runs) =>
  Array.isArray(runs)
    ? runs.map((run) =>
        Array.isArray(run) ? run.map(normalizeObservation) : [],
      )
    : [];

const numericValues = (run) =>
  run.map((entry) => entry.value).filter(Number.isSafeInteger);

const monotonicKind = (values) => {
  if (values.length < 2) return "none";
  const deltas = values.slice(1).map((value, index) => value - values[index]);
  if (deltas.every((delta) => delta > 0))
    return deltas.every((delta) => delta === 1) ? "forward" : "forward_gap";
  if (deltas.every((delta) => delta < 0))
    return deltas.every((delta) => delta === -1) ? "reverse" : "reverse_gap";
  return "mixed";
};

const findSingleOutlier = (values) => {
  if (values.length < 4) return null;
  for (let index = 0; index < values.length; index += 1) {
    const repaired = values.filter((_, candidate) => candidate !== index);
    const kind = monotonicKind(repaired);
    if (
      kind === "forward" ||
      kind === "forward_gap" ||
      kind === "reverse" ||
      kind === "reverse_gap"
    ) {
      return { index, value: values[index], repaired, kind };
    }
  }
  return null;
};

const analyzeSequence = (runs) => {
  const valuesByRun = runs.map(numericValues);
  const values = valuesByRun.flat();
  const runKinds = valuesByRun
    .filter((run) => run.length > 1)
    .map(monotonicKind);
  const warnings = [];
  const sortedUnique = [...new Set(values)].sort((left, right) => left - right);
  const duplicate = sortedUnique.length < values.length;
  if (duplicate) warnings.push("DUPLICATE_VALUE");
  const sortedConsecutive =
    sortedUnique.length > 1 &&
    sortedUnique.every(
      (value, index) => index === 0 || value === sortedUnique[index - 1] + 1,
    );

  if (values.length === 0)
    return {
      direction: DIRECTIONS.NONE,
      values,
      sortedUnique,
      warnings,
      endpoint: null,
      outlier: null,
    };
  if (values.length === 1)
    return {
      direction:
        values[0] === 1 ? DIRECTIONS.NEUTRAL_ONE : DIRECTIONS.FORWARD_WEAK,
      values,
      sortedUnique,
      warnings,
      endpoint: values[0],
      outlier: null,
    };
  if (
    runKinds.some((kind) => kind.startsWith("forward")) &&
    runKinds.some((kind) => kind.startsWith("reverse"))
  ) {
    warnings.push("DIRECTION_CONFLICT");
    return {
      direction: DIRECTIONS.DIRECTION_CONFLICT,
      values,
      sortedUnique,
      warnings,
      endpoint: null,
      outlier: null,
    };
  }
  if (
    valuesByRun.length > 1 &&
    runKinds.length === valuesByRun.filter((run) => run.length > 1).length &&
    runKinds.every((kind) => kind.startsWith("forward"))
  ) {
    const resets = valuesByRun
      .slice(1)
      .some((run, index) => run[0] <= valuesByRun[index].at(-1));
    if (resets) {
      warnings.push("ROW_RESET_PATTERN");
      return {
        direction: DIRECTIONS.ROW_RESET,
        values,
        sortedUnique,
        warnings,
        endpoint: null,
        outlier: null,
      };
    }
  }
  const kind = monotonicKind(values);
  if (kind === "forward" || kind === "forward_gap") {
    if (kind === "forward_gap") warnings.push("SEQUENCE_GAP");
    return {
      direction:
        kind === "forward"
          ? DIRECTIONS.FORWARD_STRONG
          : DIRECTIONS.FORWARD_WITH_GAP,
      values,
      sortedUnique,
      warnings,
      endpoint: values.at(-1),
      outlier: null,
    };
  }
  if (kind === "reverse" || kind === "reverse_gap") {
    if (kind === "reverse_gap") warnings.push("SEQUENCE_GAP");
    return {
      direction:
        values.at(-1) === 1
          ? DIRECTIONS.REVERSE_STRONG
          : kind === "reverse"
            ? DIRECTIONS.REVERSE_INCOMPLETE
            : DIRECTIONS.REVERSE_WITH_GAP,
      values,
      sortedUnique,
      warnings,
      endpoint: null,
      outlier: null,
    };
  }
  const outlier = findSingleOutlier(values);
  if (outlier) {
    warnings.push("VALUE_OUTLIER");
    return {
      direction: outlier.kind.startsWith("forward")
        ? DIRECTIONS.FORWARD_WITH_OUTLIER
        : DIRECTIONS.REVERSE_WITH_OUTLIER,
      values,
      sortedUnique,
      warnings,
      endpoint: outlier.kind.startsWith("forward")
        ? outlier.repaired.at(-1)
        : null,
      outlier,
    };
  }
  warnings.push("UNKNOWN_ORDER");
  return {
    direction: DIRECTIONS.UNKNOWN_ORDER,
    values,
    sortedUnique,
    warnings,
    endpoint: sortedConsecutive ? sortedUnique.at(-1) : null,
    outlier: null,
  };
};

const addCandidate = (map, value, source) => {
  if (!Number.isSafeInteger(value) || value < 0) return;
  const current = map.get(value) || new Set();
  current.add(source);
  map.set(value, current);
};

const resolveTierEvidence = (tier) => {
  const runs = normalizeRuns(tier.visibleNumberRuns);
  const occurrenceCount = runs.reduce((sum, run) => sum + run.length, 0);
  const totalObserved = integerOrNull(tier.totalTicketsObserved, 1);
  const pastedObserved = integerOrNull(tier.pastedTicketsObserved, 0);
  const analysis = analyzeSequence(runs);
  const warnings = [...analysis.warnings];
  const uCandidates = new Map();
  const tCandidates = new Map();

  if (occurrenceCount > 0)
    addCandidate(uCandidates, occurrenceCount, "U_OCCURRENCE");
  else warnings.push("NO_VISIBLE_NUMBER_EVIDENCE");

  if (analysis.values.length > 1 && !analysis.outlier) {
    const min = Math.min(...analysis.values);
    const max = Math.max(...analysis.values);
    const span = max - min + 1;
    if (span > occurrenceCount && span - occurrenceCount === 1)
      addCandidate(uCandidates, span, "U_GAP_REPAIR");
  }
  if (analysis.values.length > analysis.sortedUnique.length)
    addCandidate(
      uCandidates,
      analysis.sortedUnique.length,
      "U_DUPLICATE_ADJUSTED",
    );
  if (
    analysis.outlier &&
    analysis.outlier.value > Math.max(...analysis.outlier.repaired) + 1
  ) {
    warnings.push("FOREIGN_VALUE_CANDIDATE");
    addCandidate(uCandidates, occurrenceCount - 1, "U_FOREIGN_REJECTED");
  }
  if (totalObserved !== null)
    addCandidate(tCandidates, totalObserved, "T_EXPLICIT");
  const forwardLike = [
    DIRECTIONS.FORWARD_STRONG,
    DIRECTIONS.FORWARD_WITH_GAP,
    DIRECTIONS.FORWARD_WITH_OUTLIER,
  ].includes(analysis.direction);
  if (forwardLike && analysis.endpoint !== null)
    addCandidate(tCandidates, analysis.endpoint, "T_FORWARD_ENDPOINT");
  if (
    analysis.direction === DIRECTIONS.UNKNOWN_ORDER &&
    analysis.endpoint !== null
  )
    addCandidate(tCandidates, analysis.endpoint, "T_ORDER_LOST_ENDPOINT");
  if (
    analysis.direction === DIRECTIONS.FORWARD_WEAK &&
    (totalObserved === analysis.endpoint ||
      (pastedObserved !== null && pastedObserved + 1 === analysis.endpoint))
  )
    addCandidate(tCandidates, analysis.endpoint, "T_WEAK_CORROBORATED");

  if (
    analysis.endpoint !== null &&
    pastedObserved !== null &&
    analysis.endpoint - pastedObserved > occurrenceCount
  ) {
    addCandidate(
      uCandidates,
      analysis.endpoint - pastedObserved,
      "U_LEADING_REPAIR",
    );
  }

  if (
    totalObserved !== null &&
    pastedObserved !== null &&
    totalObserved > pastedObserved
  ) {
    const repaired = totalObserved - pastedObserved;
    let source =
      occurrenceCount === 0
        ? "U_TOTAL_MINUS_PASTED_FALLBACK"
        : "U_CONSTRAINT_REPAIR";
    if (repaired === occurrenceCount + 1 && analysis.values.length > 1) {
      if (analysis.warnings.includes("SEQUENCE_GAP")) source = "U_GAP_REPAIR";
      else if (analysis.endpoint === totalObserved - 1)
        source = "U_TRAILING_REPAIR";
      else source = "U_LEADING_REPAIR";
    }
    addCandidate(uCandidates, repaired, source);
  }
  for (const [u] of uCandidates) {
    if (pastedObserved !== null)
      addCandidate(tCandidates, pastedObserved + u, "T_PASTED_PLUS_U");
  }

  if (
    occurrenceCount === 0 &&
    totalObserved !== null &&
    pastedObserved !== null &&
    totalObserved === pastedObserved
  ) {
    warnings.push("ZERO_NOT_CONFIRMED");
    return finish(
      totalObserved,
      null,
      null,
      RESOLUTION_KINDS.ZERO_NOT_CONFIRMED,
    );
  }

  const solutions = [];
  for (const [total, totalSources] of tCandidates) {
    for (const [remaining, remainingSources] of uCandidates) {
      if (total <= 0 || remaining > total) continue;
      const pasted = total - remaining;
      let support = 0;
      if (pastedObserved === pasted) support += 3;
      if (totalObserved === total) support += 3;
      if (
        analysis.endpoint === total &&
        (forwardLike || analysis.direction === DIRECTIONS.UNKNOWN_ORDER)
      )
        support += 4;
      if (remaining === occurrenceCount && occurrenceCount > 0) support += 4;
      if (
        remainingSources.has("U_GAP_REPAIR") &&
        analysis.warnings.includes("SEQUENCE_GAP")
      )
        support += 2;
      if (
        remainingSources.has("U_DUPLICATE_ADJUSTED") &&
        analysis.warnings.includes("DUPLICATE_VALUE")
      )
        support += 2;
      if (
        remainingSources.has("U_LEADING_REPAIR") ||
        remainingSources.has("U_TRAILING_REPAIR")
      )
        support += 2;
      if (remainingSources.has("U_FOREIGN_REJECTED") && analysis.outlier)
        support += 2;
      if (
        totalObserved !== null &&
        analysis.endpoint !== null &&
        totalObserved > analysis.endpoint &&
        total === analysis.endpoint
      )
        support -= 5;
      solutions.push({
        total,
        remaining,
        pasted,
        support,
        totalSources: [...totalSources],
        remainingSources: [...remainingSources],
      });
    }
  }

  const exactByPair = new Map();
  for (const solution of solutions) {
    const key = `${solution.total}:${solution.remaining}`;
    const current = exactByPair.get(key);
    if (!current || solution.support > current.support)
      exactByPair.set(key, solution);
  }
  let distinct = [...exactByPair.values()];
  const maxSupport = distinct.length
    ? Math.max(...distinct.map((item) => item.support))
    : 0;
  distinct = distinct.filter((item) => item.support === maxSupport);

  if (
    analysis.warnings.includes("DUPLICATE_VALUE") &&
    totalObserved === null &&
    pastedObserved !== null
  ) {
    const occurrenceSolution = solutions.find(
      (item) =>
        item.remaining === occurrenceCount &&
        item.total === pastedObserved + occurrenceCount,
    );
    const adjustedSolution = solutions.find(
      (item) =>
        item.remaining === analysis.sortedUnique.length &&
        item.total === analysis.sortedUnique.at(-1),
    );
    if (
      occurrenceSolution &&
      adjustedSolution &&
      occurrenceSolution.total !== adjustedSolution.total
    )
      distinct = [occurrenceSolution, adjustedSolution];
  }

  if (distinct.length > 1)
    return finish(null, null, null, RESOLUTION_KINDS.AMBIGUOUS, distinct);
  if (distinct.length === 1) {
    const chosen = distinct[0];
    if (totalObserved !== null && totalObserved !== chosen.total)
      warnings.push("TOTAL_OBSERVATION_REJECTED");
    if (pastedObserved !== null && pastedObserved !== chosen.pasted)
      warnings.push("PASTED_OBSERVATION_REJECTED");
    const sources = [...chosen.totalSources, ...chosen.remainingSources];
    let kind = RESOLUTION_KINDS.MULTI_EVIDENCE_EXACT;
    if (sources.includes("U_TOTAL_MINUS_PASTED_FALLBACK"))
      kind = RESOLUTION_KINDS.POSITIVE_TOTAL_PASTED_FALLBACK;
    else if (sources.includes("U_GAP_REPAIR"))
      kind = RESOLUTION_KINDS.SEQUENCE_GAP_REPAIRED;
    else if (sources.includes("U_LEADING_REPAIR"))
      kind = RESOLUTION_KINDS.LEADING_SLOT_REPAIRED;
    else if (sources.includes("U_TRAILING_REPAIR"))
      kind = RESOLUTION_KINDS.TRAILING_SLOT_REPAIRED;
    else if (analysis.direction === DIRECTIONS.UNKNOWN_ORDER)
      kind = RESOLUTION_KINDS.ORDER_LOST_BUT_CLOSED;
    else if (forwardLike) kind = RESOLUTION_KINDS.FORWARD_SEQUENCE;
    else if (
      analysis.direction === DIRECTIONS.REVERSE_STRONG ||
      analysis.direction === DIRECTIONS.REVERSE_INCOMPLETE
    )
      kind = RESOLUTION_KINDS.REVERSE_WITH_PASTED;
    return finish(
      chosen.total,
      chosen.remaining,
      chosen.pasted,
      kind,
      distinct,
    );
  }

  if (occurrenceCount > 0)
    return finish(
      null,
      occurrenceCount,
      null,
      RESOLUTION_KINDS.PARTIAL_UNPASTED_ONLY,
    );
  if (totalObserved !== null)
    return finish(
      totalObserved,
      null,
      null,
      RESOLUTION_KINDS.PARTIAL_TOTAL_ONLY,
    );
  return finish(null, null, null, RESOLUTION_KINDS.CONFLICT);

  function finish(
    totalTickets,
    remainingTickets,
    pastedTickets,
    resolutionKind,
    candidateSolutions = [],
  ) {
    return {
      totalTickets,
      remainingTickets,
      pastedTickets,
      resolutionKind,
      trace: {
        visibleNumberRuns: runs,
        visibleOccurrenceCount: occurrenceCount,
        direction: analysis.direction,
        sortedValues: analysis.sortedUnique,
        warnings: [...new Set(warnings)],
        totalCandidates: [...tCandidates].map(([value, sources]) => ({
          value,
          sources: [...sources],
        })),
        remainingCandidates: [...uCandidates].map(([value, sources]) => ({
          value,
          sources: [...sources],
        })),
        pastedObserved,
        candidateSolutions,
        canonical: { totalTickets, remainingTickets, pastedTickets },
        resolutionKind,
      },
    };
  }
};

const resolveR1Extraction = (raw) => {
  const tiers = raw.tiers.map((tier) => ({
    tierCode: tier.tierCode,
    rawLabel: tier.rawLabel,
    prizeName: tier.prizeName,
    ...resolveTierEvidence(tier),
  }));
  return {
    normalized: {
      ipName: raw.ipName,
      ipRawText: raw.ipRawText,
      themeName: raw.themeName,
      price: raw.price,
      tiers: tiers.map((tier) => ({
        rawLabel: tier.tierCode || tier.rawLabel,
        prizeName: tier.prizeName,
        totalTickets: tier.totalTickets,
        remainingTickets: tier.remainingTickets,
        pastedTickets: tier.pastedTickets,
      })),
    },
    trace: {
      tiers: tiers.map((tier) => ({
        tierCode: tier.tierCode,
        rawLabel: tier.rawLabel,
        ...tier.trace,
      })),
    },
  };
};

module.exports = {
  DIRECTIONS,
  RESOLUTION_KINDS,
  normalizeRuns,
  analyzeSequence,
  resolveTierEvidence,
  resolveR1Extraction,
};
