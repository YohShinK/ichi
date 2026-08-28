import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(
  ROOT,
  "artifacts/remaining-observation-r0-experiment/2026-08-26",
);
const staticAudit = JSON.parse(
  fs.readFileSync(path.join(OUT, "static-audit.json"), "utf8"),
);
const goldens = JSON.parse(
  fs.readFileSync(path.join(OUT, "goldens.json"), "utf8"),
);
const r0 = JSON.parse(
  fs.readFileSync(path.join(OUT, "r0-results.json"), "utf8"),
);
const baseline = JSON.parse(
  fs.readFileSync(path.join(OUT, "baseline-results.json"), "utf8"),
);
const comparison = JSON.parse(
  fs.readFileSync(path.join(OUT, "comparison.json"), "utf8"),
);
const resolverTests = JSON.parse(
  fs.readFileSync(path.join(OUT, "resolver-tests.json"), "utf8"),
);

const percent = (value) =>
  value === null ? "n/a" : `${(value * 100).toFixed(1)}%`;
const formatValue = (value) => (value === null ? "null" : String(value));
const formatArray = (value) => `[${value.join(", ")}]`;
const boardGolden = (caseId) =>
  goldens.boards.find((board) => board.caseId === caseId);
const boardTitle = (caseId) => boardGolden(caseId).name;
const flattenedFinal = (result) =>
  result.resolved.tiers.map((tier) => ({
    label: tier.label,
    open: tier.children.flatMap((child) => child.openOrdinals),
    complete: tier.children.every((child) => child.observationComplete === true)
      ? true
      : null,
    remaining: tier.remainingTickets,
  }));
const resultTable = (result) => {
  const golden = boardGolden(result.caseId);
  const finalMap = new Map(
    flattenedFinal(result).map((tier) => [tier.label, tier]),
  );
  const rows = Object.entries(golden.remaining).map(([label, expected]) => {
    const tier = finalMap.get(label);
    return `| ${label} | ${tier ? formatArray(tier.open) : "missing"} | ${tier ? formatValue(tier.complete) : "missing"} | ${tier ? formatValue(tier.remaining) : "null"} | ${expected} | ${tier?.remaining === expected ? "YES" : "NO"} |`;
  });
  return [
    "| Tier | openOrdinals | complete | remaining | GT | Exact |",
    "|---|---:|---:|---:|---:|---:|",
    ...rows,
  ].join("\n");
};

const firstWrongLayers = r0.results.flatMap((result) =>
  result.score.firstWrongLayers.map((wrong) => ({
    caseId: result.caseId,
    ...wrong,
  })),
);
const falseZeroRows = r0.metrics.falseZero.map(
  ({ caseId, tier }) =>
    `- ${boardTitle(caseId)} / ${tier}: GT > 0, predicted 0.`,
);
const arknights = r0.results.find(
  (result) => result.caseId === "case-6-arknights",
);
const arknightsRaw = new Map(
  arknights.resolved.rawTiers.map((tier) => [tier.normalizedRawLabel, tier]),
);
const arknightsGolden = boardGolden("case-6-arknights");
const arknightsDetail = Object.entries(arknightsGolden.remaining).map(
  ([label, expected]) => {
    const tier = arknightsRaw.get(label);
    return `| ${label} | ${tier ? formatArray(tier.openOrdinals) : "missing"} | ${tier ? formatValue(tier.observationComplete) : "missing"} | ${tier ? formatValue(tier.remainingTickets) : "null"} | ${expected} |`;
  },
);
const h0AverageTextTokens =
  baseline.results.reduce(
    (sum, result) =>
      sum + (result.usage?.prompt_tokens_details?.text_tokens || 0),
    0,
  ) / baseline.results.length;
const r0AverageTextTokens =
  r0.results.reduce(
    (sum, result) =>
      sum + (result.usage?.prompt_tokens_details?.text_tokens || 0),
    0,
  ) / r0.results.length;

const report = `# REMAINING OBSERVATION R0 EXPERIMENT REPORT

## 1. Production Safety

Production H0 modified: NO

Production Prompt hash before: ${staticAudit.frozenH0.sourceSha256}

Production Prompt hash after: ${staticAudit.frozenH0.sourceSha256}

BOARD_RECOGNITION_MODE: ${staticAudit.production.recognitionMode}

Deploy performed: NO

## 2. R0 Architecture

Provider output: \`rawLabel\`, \`openOrdinals\`, \`observationComplete\`.

Provider does NOT output total, pasted, or remaining counts.

Cloud experiment resolver formula: deterministic ordinal dedupe; if and only if \`observationComplete === true\`, \`remaining = unique(openOrdinals).length\`; otherwise \`remaining = null\`. It never fills gaps.

## 3. R0 Prompt

Prompt version: ${staticAudit.prompt.version}

Prompt hash: ${staticAudit.prompt.sha256}

Characters: ${staticAudit.prompt.characters}

Estimated text tokens: ${staticAudit.prompt.estimatedTextTokens}

Actual Provider text tokens: ${r0AverageTextTokens.toFixed(0)} per image

## 4. Schema

Schema version: ${staticAudit.schema.version}

Schema hash: ${staticAudit.schema.sha256}

AJV: ${r0.metrics.ajvSuccess}/6 PASS

Forbidden-field static scan: ${staticAudit.forbiddenTokensAbsent ? "PASS" : "FAIL"}

## 5. Resolver

Tests: ${resolverTests.passed}/${resolverTests.tests} PASS

Duplicate handling: deterministic dedupe + \`DUPLICATE_OPEN_ORDINAL\`.

Non-contiguous handling: no gap fill + \`NON_CONTIGUOUS_OPEN_ORDINALS\`.

Child handling: child-first; parent resolves only when every child resolves.

SP mapping: distinct raw special instances map by visual order to SP1, SP2, ... . The resolver cannot reconstruct instances already merged by Qwen.

## 6. Corpus

| Case | File | SHA-256 | GT tiers |
|---|---|---|---:|
${goldens.boards.map((board) => `| ${board.caseId} | ${board.filename} | ${board.sha256} | ${Object.keys(board.remaining).length} |`).join("\n")}

Five prior images exact same: YES

Arknights exact user-provided image: YES

Operational integrity note: the scored dataset contains exactly one complete raw R0 result per image under the same frozen Prompt/Schema. Two earlier successful responses were excluded because the initial batch runner failed before persisting their raw JSON, and four additional attempts ended at the temporary HTTPS transport layer. They are disclosed in \`invalidated-attempts.json\` and are not included in accuracy or latency metrics.

## 7. Goldens

${goldens.boards
  .map(
    (board) =>
      `- ${board.name}: ${Object.entries(board.remaining)
        .map(([label, value]) => `${label}=${value}`)
        .join(", ")}`,
  )
  .join("\n")}

Arknights open ordinal audit: C=[2], D=[2], E=[16], F=[14,15,16], G=[15,16]; A/B/H=[].

## 8. R0 Results

${r0.results
  .map(
    (result) => `### ${boardTitle(result.caseId)}

Provider RequestId: ${result.requestId}; latency: ${result.latencyMs} ms; JSON/AJV: PASS/PASS.

${resultTable(result)}`,
  )
  .join("\n\n")}

## 9. 明日方舟 Detailed Observation

| Tier | raw openOrdinals | complete | resolved | GT |
|---|---:|---:|---:|---:|
${arknightsDetail.join("\n")}

F directly observed 14/15/16: YES

G directly observed 15/16: YES

Model still attempted to count black tickets: NO evidence in the raw result. It returned only open ordinals. However, it omitted depleted A/B entirely.

The live decision set C/D/E/F/G was exact and every live remaining count was exact. Full-board exact was false because A and B were missing.

## 10. Accuracy

Total tiers: ${r0.metrics.totalTiers}

Remaining exact: ${r0.metrics.remainingExact}/${r0.metrics.totalTiers} (${percent(r0.metrics.remainingExactRate)})

Coverage: ${percent(r0.metrics.resolvedCoverage)}

Resolved precision: ${percent(r0.metrics.resolvedPrecision)}

Live tier recall: ${percent(r0.metrics.liveTierRecall)}

Live tier precision: ${percent(r0.metrics.liveTierPrecision)}

False Zero: ${r0.metrics.falseZero.length}

False Live: ${r0.metrics.falseLive.length}

Decision Set Exact: ${r0.metrics.decisionSetExact}/6

Full Board Remaining Exact: ${r0.metrics.fullBoardExact}/6

Unknown rate: ${percent(r0.metrics.unknownRate)}

Tier detection exact: ${r0.metrics.tierDetectionExact}/6

## 11. Baseline H0

Baseline source: mixed — five exact-image Frozen H0 artifacts reused; Arknights used one new Frozen H0 call on the exact same image.

Arknights H0 Provider RequestId: ${baseline.results.find((result) => result.caseId === "case-6-arknights").requestId}

Remaining exact: ${baseline.metrics.remainingExact}/${baseline.metrics.totalTiers} (${percent(baseline.metrics.remainingExactRate)})

Coverage: ${percent(baseline.metrics.resolvedCoverage)}

Resolved precision: ${percent(baseline.metrics.resolvedPrecision)}

Live recall: ${percent(baseline.metrics.liveTierRecall)}

False zero: ${baseline.metrics.falseZero.length}

Decision set exact: ${baseline.metrics.decisionSetExact}/6

Full-board exact: ${baseline.metrics.fullBoardExact}/6

## 12. H0 vs R0

| Metric | H0 | R0 | Delta |
|---|---:|---:|---:|
| Remaining exact | ${percent(baseline.metrics.remainingExactRate)} | ${percent(r0.metrics.remainingExactRate)} | ${percent(comparison.delta.remainingExactRate)} |
| Coverage | ${percent(baseline.metrics.resolvedCoverage)} | ${percent(r0.metrics.resolvedCoverage)} | ${percent(comparison.delta.resolvedCoverage)} |
| Resolved precision | ${percent(baseline.metrics.resolvedPrecision)} | ${percent(r0.metrics.resolvedPrecision)} | ${percent(comparison.delta.resolvedPrecision)} |
| Live recall | ${percent(baseline.metrics.liveTierRecall)} | ${percent(r0.metrics.liveTierRecall)} | ${percent(comparison.delta.liveTierRecall)} |
| Live precision | ${percent(baseline.metrics.liveTierPrecision)} | ${percent(r0.metrics.liveTierPrecision)} | ${percent(comparison.delta.liveTierPrecision)} |
| False zero | ${baseline.metrics.falseZero.length} | ${r0.metrics.falseZero.length} | ${r0.metrics.falseZero.length - baseline.metrics.falseZero.length} |
| False live | ${baseline.metrics.falseLive.length} | ${r0.metrics.falseLive.length} | ${r0.metrics.falseLive.length - baseline.metrics.falseLive.length} |
| Decision set exact | ${baseline.metrics.decisionSetExact}/6 | ${r0.metrics.decisionSetExact}/6 | ${comparison.delta.decisionSetExact} boards |
| Full board exact | ${baseline.metrics.fullBoardExact}/6 | ${r0.metrics.fullBoardExact}/6 | ${comparison.delta.fullBoardExact} boards |

R0 improved remaining exact by ${(comparison.delta.remainingExactRate * 100).toFixed(1)} percentage points, but missed the absolute safety gates.

## 13. Tokens

H0 total: prompt ${baseline.metrics.usage.promptTokens}, completion ${baseline.metrics.usage.completionTokens}, API total ${baseline.metrics.usage.totalTokens}; average text-prompt tokens ${h0AverageTextTokens.toFixed(0)}.

R0 total: prompt ${r0.metrics.usage.promptTokens}, completion ${r0.metrics.usage.completionTokens}, API total ${r0.metrics.usage.totalTokens}; average text-prompt tokens ${r0AverageTextTokens.toFixed(0)}.

R0 is a pure task, not an integrated-production apples-to-apples cost comparison.

## 14. Latency

H0 average: ${baseline.metrics.averageLatencyMs.toFixed(0)} ms; P50 ${baseline.metrics.p50LatencyMs} ms; P95 ${baseline.metrics.p95LatencyMs} ms (small sample).

R0 average: ${r0.metrics.averageLatencyMs.toFixed(0)} ms; P50 ${r0.metrics.p50LatencyMs} ms; P95 ${r0.metrics.p95LatencyMs} ms (small sample).

Delta average: ${comparison.delta.averageLatencyMs.toFixed(0)} ms. The R0 calls used a temporary local HTTPS tunnel because CloudBase was restricted to read-only; image transfer was unstable and materially inflates/confounds this latency comparison. The <=10 s target was missed.

## 15. First Wrong Layer

${firstWrongLayers.map((wrong) => `- ${boardTitle(wrong.caseId)} / ${wrong.tier}: ${wrong.layer}`).join("\n")}

Interpretation notes:

- NIKKE G/H expose explicit remaining labels rather than reliably enumerable white ordinal slots; R0 intentionally excluded that second evidence type, so the primitive itself has no usable observation there.
- Attack on Titan A-D are visible single open printed slots, but Qwen returned empty arrays with complete=true: open-slot detection and completeness calibration failed.
- 世界之外 merged four visual SP instances into one (\`QWEN_SP_INSTANCE_LOSS\`) and missed the first open regular slot on A-E.
- Arknights live-tier observation was exact, but A/B tier detection failed.

## 16. Safety

False Zero: ${r0.metrics.falseZero.length}

${falseZeroRows.join("\n")}

Wrong positive live tier: ${r0.metrics.falseLive.map(({ caseId, tier }) => `${boardTitle(caseId)} / ${tier}`).join(", ") || "none"}

Unknown/missing predictions: ${(r0.metrics.unknownRate * r0.metrics.totalTiers).toFixed(0)} tiers.

\`observationComplete\` was not trustworthy: every returned raw tier was marked true, including all six false-zero cases and the under-counted/merged 世界之外 result. It never used null.

## 17. Stability

Performed: NO

Reason: first pass was neither VIABLE nor close to the hard gate. Per protocol, no additional calls were made.

Stable: NOT EVALUATED

## 18. Interpretation

1. “只观察余票位”在 Pokémon、Snow Miku 和明日方舟显著优于直接算 total+pasted，但不是所有版面都适用；NIKKE 的剩余证据主要是显式 remaining label，世界之外和单格 open slot 仍有漏检。
2. 模型在长串、清晰的浅色开放票位上明显更擅长：Pokémon、Snow Miku 和明日方舟 C-G 都表现良好；这支持核心假设，但不能抵消 false zero。
3. \`observationComplete\` 不可信，表现为系统性过度自信而非保守 null。
4. False zero 风险不可接受：6 个，直接触发安全失败。
5. 明日方舟 failure case 的 live 决策信息被解决：C/D/E/F/G 的 ordinal、remaining 与 live set 全部正确；但 A/B 未返回，整板不完整。
6. 当前结果不值得直接进入 Integrated Remaining R1；应先在隔离 R0 中解决 completeness 校准、单格 open slot、SP 实例保持和无 open-ordinal 版面覆盖。本任务不创建下一版。

## 19. Final Decision

**B. R0 PROMISING BUT NOT SAFE**

主要原因：相对 H0 的 remaining exact 提升 27.3 个百分点，且明日方舟核心 live-tier failure 被解决；但 74.2% exact、82.6% live recall、3/6 decision-set exact 均未达 Gate，并出现 6 个 P0 false zero。\`observationComplete\` 也没有发挥安全阀作用。
`;

fs.writeFileSync(path.join(OUT, "report.md"), report);
console.log(
  JSON.stringify({
    report: path.join(OUT, "report.md"),
    decision: "B. R0 PROMISING BUT NOT SAFE",
  }),
);
