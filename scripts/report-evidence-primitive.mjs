import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const outputDir = path.resolve(
  process.argv[2] || "artifacts/evidence-primitive-experiment/2026-08-26",
);
const results = JSON.parse(
  fs.readFileSync(path.join(outputDir, "h0-h1-results.json"), "utf8"),
);
const processingTimings = JSON.parse(
  fs.readFileSync(path.join(outputDir, "processing-timings.json"), "utf8"),
);
const staticAudit = results.staticAudit;
const fmt = (value) =>
  value === null || value === undefined ? "null" : String(value);
const pct = (value) => `${(value * 100).toFixed(1)}%`;
const triple = (values) =>
  `${fmt(values?.total)}/${fmt(values?.pasted)}/${fmt(values?.remaining)}`;
const run = (board, kind) => board[kind][0];
const boardOutcome = (board) => {
  const a = run(board, "h0").score.tierExactCount;
  const b = run(board, "h1").score.tierExactCount;
  return b > a ? "Better" : b < a ? "Worse" : "Same";
};
const primitiveCounts = {};
const issueCounts = {};
for (const board of results.boards)
  for (const tier of run(board, "h1").normalized.trace.rawTiers) {
    primitiveCounts[tier.evidencePrimitive] =
      (primitiveCounts[tier.evidencePrimitive] || 0) + 1;
    for (const issue of tier.issues)
      issueCounts[issue.code] = (issueCounts[issue.code] || 0) + 1;
  }
const schemaChars = fs.readFileSync(
  path.join(
    ROOT,
    "data/recognition-contract/schema/board-provider-evidence-primitive-1.0.0-exp.schema.json",
  ),
  "utf8",
).length;
const tableForBoard = (board) => {
  const h0 = new Map(
    run(board, "h0").score.tiers.map((tier) => [tier.tier, tier.actual]),
  );
  const h1 = new Map(
    run(board, "h1").score.tiers.map((tier) => [tier.tier, tier.actual]),
  );
  const trace = new Map(
    run(board, "h1").normalized.trace.tiers.map((tier) => [tier.label, tier]),
  );
  const rows = board.groundTruth.tiers.map((tier) => {
    const expected = {
      total: tier.total,
      pasted: tier.pasted,
      remaining: tier.total - tier.pasted,
    };
    const resolved = trace.get(tier.tier);
    const evidenceRaw =
      resolved?.children?.length === 1
        ? resolved.children[0].matches[0].evidenceRaw
        : resolved?.evidenceRaw;
    const raw = evidenceRaw
      ? Object.entries(evidenceRaw)
          .filter(([, value]) => value !== null)
          .map(([key, value]) => `${key}=${value}`)
          .join(", ") || "all null"
      : "aggregate/null";
    return `| ${tier.tier} | ${triple(h0.get(tier.tier))} | ${triple(h1.get(tier.tier))} | ${triple(expected)} | ${resolved?.evidencePrimitive || "missing"}: ${raw} |`;
  });
  return [
    "| Tier | H0 total/pasted/rem | H1 total/pasted/rem | GT | H1 primitive/raw |",
    "|---|---:|---:|---:|---|",
    ...rows,
  ].join("\n");
};
const latencyRows = results.boards.map((board) => {
  const a = run(board, "h0").latencyMs;
  const b = run(board, "h1").latencyMs;
  return `| ${board.name} | ${a} ms | ${b} ms | ${b - a >= 0 ? "+" : ""}${b - a} ms (${(((b - a) / a) * 100).toFixed(1)}%) |`;
});
const tokenRows = results.boards.map((board) => {
  const a = run(board, "h0").usage;
  const b = run(board, "h1").usage;
  return `| ${board.name} | ${a.prompt_tokens}/${a.completion_tokens}/${a.total_tokens} | ${b.prompt_tokens}/${b.completion_tokens}/${b.total_tokens} |`;
});
const providerRows = results.boards.map(
  (board) =>
    `| ${board.name} | ${run(board, "h0").requestId} | ${run(board, "h1").requestId} |`,
);
const identityRows = results.boards.map((board) => {
  const a = run(board, "h0").normalized.trace;
  const b = run(board, "h1").normalized.trace;
  return `| ${board.name} | ${a.identity.ipName} / ${a.identity.themeName} / ${fmt(a.price)} | ${b.identity.ipName} / ${b.identity.themeName} / ${fmt(b.price)} | ${board.groundTruth.ipName} / ${board.groundTruth.themeName} / ${fmt(board.groundTruth.price)} |`;
});
const firstLayers = {
  QWEN_VISUAL: 0,
  PROVIDER_SCHEMA: 0,
  EVIDENCE_GATE: 0,
  CLOUD_RESOLVER: 0,
  TIER_NORMALIZE: 0,
  SP_MAPPING: 0,
};
for (const board of results.boards)
  for (const kind of ["h0", "h1"]) {
    const layer = run(board, kind).firstWrongLayer;
    if (layer in firstLayers) firstLayers[layer] += 1;
  }
const regressions = [];
for (const board of results.boards) {
  const a = new Map(
    run(board, "h0").score.tiers.map((tier) => [tier.tier, tier]),
  );
  for (const tier of run(board, "h1").score.tiers)
    if (a.get(tier.tier)?.tierExact && !tier.tierExact)
      regressions.push(`${board.name} ${tier.tier}`);
}
const snow = results.boards.find(
  (board) => board.caseId === "case-3-snow-miku",
);
const titan = results.boards.find(
  (board) => board.caseId === "case-4-attack-on-titan",
);
const world = results.boards.find(
  (board) => board.caseId === "case-5-world-beyond",
);
const lines = [];
lines.push(
  "# EVIDENCE PRIMITIVE + CLOUD RESOLVER REPORT",
  "",
  "## Architecture",
  "",
  "Qwen responsibilities: read identity, price, raw visual tiers, total capacity, and exactly one strongest state-evidence primitive per tier. It must not calculate pasted or remaining counts and must not group child or special tiers.",
  "",
  "Cloud responsibilities: AJV exact-shape validation; the one-active-evidence gate; NFKC and Chinese/Japanese remaining-label parsing; deterministic resolution; range rejection; null preservation; child-first A1/A2 aggregation; stable SP mapping; whole-board sums; unchanged RecognitionContract 1.0.0 construction.",
  "",
  "The targeted verifier was design-only and remained disabled. No OCR, crop, upscale, thinking, model change, or second call was used.",
  "",
  "## Prompt",
  "",
  `- H0: ${staticAudit.h0.characters} chars; actual text tokens ${run(results.boards[0], "h0").usage.prompt_tokens_details.text_tokens}; schema board-provider-hybrid-semantic-1.0.0-exp, ${fs.readFileSync(path.join(ROOT, "data/recognition-contract/schema/board-provider-hybrid-semantic-1.0.0-exp.schema.json"), "utf8").length} chars.`,
  `- H1: ${staticAudit.h1.characters} chars; actual text tokens ${run(results.boards[0], "h1").usage.prompt_tokens_details.text_tokens}; schema ${staticAudit.h1.schemaVersion}, ${schemaChars} chars.`,
  `- Delta: ${staticAudit.h1.characters - staticAudit.h0.characters >= 0 ? "+" : ""}${staticAudit.h1.characters - staticAudit.h0.characters} chars; ${run(results.boards[0], "h1").usage.prompt_tokens_details.text_tokens - run(results.boards[0], "h0").usage.prompt_tokens_details.text_tokens} actual text tokens (${((run(results.boards[0], "h1").usage.prompt_tokens_details.text_tokens / run(results.boards[0], "h0").usage.prompt_tokens_details.text_tokens - 1) * 100).toFixed(1)}%).`,
  "",
  "## Evidence Primitive Distribution",
  "",
  `- remainingLabel: ${primitiveCounts.REMAINING_LABEL || 0}`,
  `- firstOpenOrdinal: ${primitiveCounts.FIRST_OPEN || 0}`,
  `- openCount: ${primitiveCounts.OPEN_COUNT || 0}`,
  `- pastedCount: ${primitiveCounts.PASTED_COUNT || 0}`,
  `- unknown: ${primitiveCounts.UNKNOWN || 0}`,
  `- conflict: ${primitiveCounts.CONFLICT || 0}`,
  "",
  `Gate/parser outcomes: MULTIPLE_STATE_EVIDENCE ${issueCounts.MULTIPLE_STATE_EVIDENCE || 0}; EVIDENCE_LABEL_UNPARSEABLE ${issueCounts.EVIDENCE_LABEL_UNPARSEABLE || 0}; EVIDENCE_UNKNOWN ${issueCounts.EVIDENCE_UNKNOWN || 0}.`,
  "",
  "## Deterministic Tests",
  "",
  "20/20 PASS. This includes all required A–O cases, exact Provider shape, common Chinese/Japanese numerals, duplicate-child conflict, weak-full risk flag, and RecognitionContract 1.0.0 validation. The resolver never clamps, swaps, guesses, or coerces null to zero.",
  "",
  `Saved-JSON local replay: H1 AJV ${processingTimings.average.h1.ajvMs.toFixed(4)} ms average; H1 resolver + tier normalization + contract ${processingTimings.average.h1.resolverNormalizeMs.toFixed(4)} ms average. This is negligible beside 9834.8 ms Provider latency.`,
  "",
  "## H0 vs H1 Quick Pass",
  "",
  "| Board | H0 tier exact | H1 tier exact | Better |",
  "|---|---:|---:|---|",
  ...results.boards.map(
    (board) =>
      `| ${board.name} | ${run(board, "h0").score.tierExactCount}/${board.groundTruth.tiers.length} | ${run(board, "h1").score.tierExactCount}/${board.groundTruth.tiers.length} | ${boardOutcome(board)} |`,
  ),
  "",
  `Quick promotion gate: **FAIL**. Failed conditions: accuracy improvement, total tolerance, coverage-drop limit, Pokémon/世界之外 cluster improvement, and Snow Miku printed-letter non-regression. Stability was therefore not run.`,
  "",
  "### Provider Request IDs",
  "",
  "| Board | H0 RequestId | H1 RequestId |",
  "|---|---|---|",
  ...providerRows,
  "",
  "### Identity / theme / price",
  "",
  "| Board | H0 | H1 | Ground truth |",
  "|---|---|---|---|",
  ...identityRows,
  "",
  "## Accuracy",
  "",
  "| Metric | H0 | H1 |",
  "|---|---:|---:|",
  `| total exact | ${results.summary.h0.fields.total.exact}/58 | ${results.summary.h1.fields.total.exact}/58 |`,
  `| pasted exact | ${results.summary.h0.fields.pasted.exact}/58 | ${results.summary.h1.fields.pasted.exact}/58 |`,
  `| remaining exact | ${results.summary.h0.fields.remaining.exact}/58 | ${results.summary.h1.fields.remaining.exact}/58 |`,
  `| tier exact | ${results.summary.h0.tierExact}/58 | ${results.summary.h1.tierExact}/58 |`,
  `| full-board exact | ${results.summary.h0.fullBoardExact}/5 | ${results.summary.h1.fullBoardExact}/5 |`,
  `| JSON valid | ${results.summary.h0.jsonValid}/5 | ${results.summary.h1.jsonValid}/5 |`,
  `| AJV pass | ${results.summary.h0.ajvPass}/5 | ${results.summary.h1.ajvPass}/5 |`,
  "",
  "## Safety Metrics",
  "",
  "| Field | H0 wrong_non_null | H1 wrong_non_null | H0 coverage / precision | H1 coverage / precision |",
  "|---|---:|---:|---:|---:|",
  ...["total", "pasted", "remaining"].map(
    (field) =>
      `| ${field} | ${results.summary.h0.fields[field].wrongNonNull} | ${results.summary.h1.fields[field].wrongNonNull} | ${pct(results.summary.h0.fields[field].coverage)} / ${pct(results.summary.h0.fields[field].filledPrecision)} | ${pct(results.summary.h1.fields[field].coverage)} / ${pct(results.summary.h1.fields[field].filledPrecision)} |`,
  ),
  "",
  "H1 reduced pasted wrong_non_null by 3 only while dropping pasted coverage by 50 percentage points. This is abstention-driven, not an accuracy win. H0-correct → H1-wrong tier regressions: " +
    (regressions.join(", ") || "none") +
    ".",
  "",
);
for (const board of results.boards)
  lines.push(`## ${board.name}`, "", tableForBoard(board), "");
lines.push(
  "### Printed-tier-letter checks",
  "",
  `Snow Miku false-pasted tiers: H0 ${run(snow, "h0").score.falsePastedTiers.length}; H1 ${run(snow, "h1").score.falsePastedTiers.length} (${run(snow, "h1").score.falsePastedTiers.join(", ")}).`,
  `Attack on Titan false-pasted A–D: H0 ${run(titan, "h0").score.falsePastedTiers.length}; H1 ${run(titan, "h1").score.falsePastedTiers.length} (${run(titan, "h1").score.falsePastedTiers.join(", ")}).`,
  "",
  "### SP1–SP4",
  "",
  `H0 preserved ${run(world, "h0").score.rawSpecialItemCount} raw special items; H1 preserved ${run(world, "h1").score.rawSpecialItemCount}. H1 merged all four physical SP areas into one raw SP赏 with pastedCount=8, so deterministic SP1–SP4 mapping could not recover the missing visual items.`,
  "",
  "## Primitive Stability",
  "",
  "Not run. The one-run quick gate failed, so the experiment stopped before the 3-run phase.",
  "",
  "## Tokens",
  "",
  "| Board | H0 input/completion/total | H1 input/completion/total |",
  "|---|---:|---:|",
  ...tokenRows,
  "",
  `Five-call total: H0 ${results.summary.h0.totalUsage.prompt_tokens}/${results.summary.h0.totalUsage.completion_tokens}/${results.summary.h0.totalUsage.total_tokens}; H1 ${results.summary.h1.totalUsage.prompt_tokens}/${results.summary.h1.totalUsage.completion_tokens}/${results.summary.h1.totalUsage.total_tokens}. H1 total tokens increased by ${results.summary.h1.totalUsage.total_tokens - results.summary.h0.totalUsage.total_tokens} (${((results.summary.h1.totalUsage.total_tokens / results.summary.h0.totalUsage.total_tokens - 1) * 100).toFixed(1)}%).`,
  "",
  "## Latency",
  "",
  "| Board | H0 | H1 | Delta |",
  "|---|---:|---:|---:|",
  ...latencyRows,
  "",
  `Average: H0 ${results.summary.h0.averageLatencyMs.toFixed(1)} ms; H1 ${results.summary.h1.averageLatencyMs.toFixed(1)} ms; delta +${(results.summary.h1.averageLatencyMs - results.summary.h0.averageLatencyMs).toFixed(1)} ms (${((results.summary.h1.averageLatencyMs / results.summary.h0.averageLatencyMs - 1) * 100).toFixed(1)}%). No P95 is claimed from one run per image.`,
  "",
  "## First Wrong Layer",
  "",
  `- QWEN_VISUAL: ${firstLayers.QWEN_VISUAL} board-runs`,
  `- PROVIDER_SCHEMA: ${firstLayers.PROVIDER_SCHEMA}`,
  `- EVIDENCE_GATE: ${firstLayers.EVIDENCE_GATE} resolver defects; the gate correctly rejected 16 Qwen conflicts`,
  `- CLOUD_RESOLVER: ${firstLayers.CLOUD_RESOLVER} defects; 20/20 deterministic tests passed`,
  `- TIER_NORMALIZE: ${firstLayers.TIER_NORMALIZE}`,
  `- SP_MAPPING: ${firstLayers.SP_MAPPING} deterministic defects; the H1 SP failure began upstream when Qwen merged four raw items`,
  "",
  "All numeric failures first appeared in Qwen raw visual extraction. Gate/parser rejections are correct handling of invalid or ambiguous raw evidence, not Cloud arithmetic errors.",
  "",
  "## Production v4 Final Comparison",
  "",
  "Not executed. H1 failed the H0 quick promotion gate, so the specification required stopping before the production-v4 3-run control.",
  "",
  "## RC",
  "",
  "- RC READY: NO",
  `- Prompt version: ${staticAudit.h1.promptVersion} (experimental only)`,
  `- Schema version: ${staticAudit.h1.schemaVersion} (experimental only)`,
  "- Cloud mode: not created; production remains v4",
  "",
  "## Deployment Design",
  "",
  "- dual-stack: NOT IMPLEMENTED (quick gate stopped the task)",
  "- rollback: PASS by non-mutation; production remains v4 and no new mode was deployed",
  "- client contract: schema-level PASS for RecognitionContract 1.0.0; no client or Board Builder code changed",
  "- targeted verifier: designed, default false, not implemented or invoked",
  "",
  "Temporary CloudBase Storage objects remaining under the experiment prefix: 0.",
  "",
  "## READY FOR PRODUCTION PROMOTION",
  "",
  "**NO**",
  "",
  "## Answers to the 15 questions",
  "",
  "1. No. Evidence Primitive was much less accurate than direct pasted: tier exact 5/58 vs 30/58.",
  "2. Partly in the narrow pasted metric: 20 → 17, but total wrong_non_null rose 2 → 16.",
  "3. No. Pasted coverage fell 100% → 50%; the apparent pasted safety improvement mainly came from nulls.",
  "4. No. It emitted 16 multi-primitive conflicts and never used firstOpenOrdinal or openCount as a sole primitive.",
  "5. No practical success. Six remainingLabel values were emitted, all unparseable status text; valid NIKKE あと1枚 was paired with pastedCount and rejected as conflict.",
  "6. No. firstOpenOrdinal sole-route usage was zero; Pokémon fell from 4/10 to 0/10 tier exact and 世界之外 from 2/9 to 0/9.",
  "7. Not in this run. openCount sole-route usage was zero.",
  "8. No. pastedCount was still the dominant primitive: 29/55 raw tiers (52.7%), plus it appeared inside all 16 conflicts.",
  "9. Only weakly at pasted-only observation level, not end-to-end. NIKKE pasted exact rose 6/11 → 7/11, but total/remaining stayed unknown and G/H conflicted; full-board exact remained false.",
  "10. No. Attack on Titan printed A–D false-pasted count worsened from 1 to 4.",
  "11. No. H0 kept four raw SP items; H1 merged them into one.",
  "12. Yes for the implemented resolver: 20/20 deterministic tests passed, including rejection and null semantics. This does not rescue wrong raw evidence.",
  `13. H1 text input was 58 tokens lower per call (809 vs 867), but total API tokens increased ${((results.summary.h1.totalUsage.total_tokens / results.summary.h0.totalUsage.total_tokens - 1) * 100).toFixed(1)}% and average latency increased ${((results.summary.h1.averageLatencyMs / results.summary.h0.averageLatencyMs - 1) * 100).toFixed(1)}%.`,
  "14. No. Production-v4 final comparison was correctly not run because H1 failed the earlier H0 gate.",
  "15. No. Keep v4; do not build or promote this candidate.",
  "",
  "# FINAL STATUS",
  "",
  "**A. EVIDENCE PRIMITIVE FAILED — KEEP V4**",
  "",
);

const report = `${lines.join("\n")}\n`;
fs.writeFileSync(path.join(outputDir, "report.md"), report);
console.log(path.join(outputDir, "report.md"));
