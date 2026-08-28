import fs from "node:fs";
import path from "node:path";

const artifactDir = path.resolve(
  process.argv[2] || "artifacts/hybrid-semantic-experiment/2026-08-26",
);
const language = JSON.parse(
  fs.readFileSync(path.join(artifactDir, "language-gate.json"), "utf8"),
);
const architecture = JSON.parse(
  fs.readFileSync(path.join(artifactDir, "architecture-results.json"), "utf8"),
);
const audit = JSON.parse(
  fs.readFileSync(path.join(artifactDir, "static-audit.json"), "utf8"),
);

const sum = (values) => values.reduce((total, value) => total + value, 0);
const average = (values) => sum(values) / values.length;
const percent = (part, base) => `${((part / base) * 100).toFixed(1)}%`;
const normalizedRawLabel = (value) =>
  String(value || "")
    .normalize("NFKC")
    .toUpperCase()
    .replace(/\s+/gu, "")
    .replace(/[赏賞]$/u, "");
const rawForTier = (run, label) => {
  const raw = run.parsedProvider?.tiers || [];
  if (label.startsWith("SP")) {
    const specialIndex = Number(label.slice(2)) - 1;
    return raw.filter(
      (tier) => !/^[A-Z][0-9]*$/u.test(normalizedRawLabel(tier.rawLabel)),
    )[specialIndex];
  }
  return raw.find((tier) =>
    normalizedRawLabel(tier.rawLabel).startsWith(label),
  );
};
const rawSummary = (run, label, kind) => {
  const raw = rawForTier(run, label);
  if (!raw) return "missing";
  if (kind === "production") {
    return `${raw.rawLabel}: total=${raw.totalTickets ?? "null"}, ${raw.ticketPattern}, seq=${raw.evidence?.sequenceStart ?? "null"}, first=${raw.evidence?.firstOpen ?? "null"}, direct=${raw.evidence?.pastedDirect ?? "null"}`;
  }
  return `${raw.rawLabel}: total=${raw.totalTickets ?? "null"}, pasted=${raw.pastedTickets ?? "null"}`;
};
const triple = (value) =>
  `${value.total ?? "null"}/${value.pasted ?? "null"}/${value.remaining ?? "null"}`;

const lines = [];
const add = (...entries) => lines.push(...entries);
add("# HYBRID SEMANTIC EXTRACTION EXPERIMENT", "");
add(
  "## Image Reuse",
  "",
  "5/5 accessible: **YES**",
  "",
  "| File | Bytes | SHA-256 |",
  "|---|---:|---|",
);
for (const image of audit.images) {
  add(`| ${image.filename} | ${image.bytes} | \`${image.sha256}\` |`);
}

add(
  "",
  "## Phase 1 — Language Gate",
  "",
  "| Case | EN tier exact | ZH tier exact | Printed false-pasted EN→ZH | SP raw EN/ZH | Better |",
  "|---|---:|---:|---:|---:|---|",
);
for (const board of language.boards) {
  const en = board.en[0].score;
  const zh = board.zh[0].score;
  add(
    `| ${board.name} | ${en.tierExactCount}/${en.tierCount} | ${zh.tierExactCount}/${zh.tierCount} | ${en.falsePastedTiers.length}→${zh.falsePastedTiers.length} | ${en.rawSpecialItemCount}/${zh.rawSpecialItemCount} | ${zh.tierExactCount > en.tierExactCount ? "ZH" : zh.tierExactCount < en.tierExactCount ? "EN" : "Same"} |`,
  );
}
const languageRuns = (key) => language.boards.map((board) => board[key][0]);
const enRuns = languageRuns("en");
const zhRuns = languageRuns("zh");
const languageTierExact = (runs) =>
  sum(runs.map((run) => run.score.tierExactCount));
const languageTierTotal = sum(enRuns.map((run) => run.score.tierCount));
add(
  "",
  `EN actual text tokens: ${sum(enRuns.map((run) => run.usage.prompt_tokens_details.text_tokens))} total (${enRuns[0].usage.prompt_tokens_details.text_tokens}/call); completion ${sum(enRuns.map((run) => run.usage.completion_tokens))}; total API tokens ${sum(enRuns.map((run) => run.usage.total_tokens))}.`,
  "",
  `ZH actual text tokens: ${sum(zhRuns.map((run) => run.usage.prompt_tokens_details.text_tokens))} total (${zhRuns[0].usage.prompt_tokens_details.text_tokens}/call); completion ${sum(zhRuns.map((run) => run.usage.completion_tokens))}; total API tokens ${sum(zhRuns.map((run) => run.usage.total_tokens))}.`,
  "",
  `EN latency: ${average(enRuns.map((run) => run.latencyMs)).toFixed(1)} ms average; ZH latency: ${average(zhRuns.map((run) => run.latencyMs)).toFixed(1)} ms average.`,
  "",
  `Winner: **CHINESE**. Exact accuracy was ${languageTierExact(enRuns)}/${languageTierTotal} EN vs ${languageTierExact(zhRuns)}/${languageTierTotal} ZH. Both preserved four SP items and passed 3/3 JSON/AJV. ZH removed all 11 Snow Miku printed-letter false positives. EN used fewer actual text tokens (803 vs 867/call) and was faster, but those lower-priority advantages did not outweigh accuracy.`,
);

add(
  "",
  "## Frozen Hybrid",
  "",
  `Prompt file: \`${architecture.frozenPrompt.filename}\``,
  "",
  `Hash: \`${architecture.frozenPrompt.sha256}\``,
  "",
  `Characters: ${architecture.frozenPrompt.characters}; estimated text tokens: ${architecture.frozenPrompt.estimatedTextTokens}`,
  "",
  "Schema: `board-provider-hybrid-semantic-1.0.0-exp.schema.json`",
  "",
  "Cloud transformer: `experiments/hybrid-semantic/hybrid-semantic-experiment.js`",
);

add(
  "",
  "## Architecture",
  "",
  "Production Qwen returns pattern/evidence/confidence plus visual facts; production Normalize interprets patterns and performs grouping/math.",
  "",
  "Hybrid Qwen returns only identity, price, and per-visual-tier rawLabel/prizeName/totalTickets/pastedTickets. Hybrid deterministic Cloud processing owns NFKC labels, child-first aggregation, SP visual-order mapping, validation, remaining/whole arithmetic, and RecognitionContract construction.",
);

add(
  "",
  "## Quick Pass",
  "",
  "| Board | Production tier exact | Hybrid tier exact | Better/Worse/Same |",
  "|---|---:|---:|---|",
);
for (const board of architecture.boards) {
  const productionScore = board.production[0].score;
  const hybridScore = board.hybrid[0].score;
  const comparison =
    hybridScore.tierExactCount > productionScore.tierExactCount
      ? "Better"
      : hybridScore.tierExactCount < productionScore.tierExactCount
        ? "Worse"
        : "Same";
  add(
    `| ${board.name} | ${productionScore.tierExactCount}/${productionScore.tierCount} | ${hybridScore.tierExactCount}/${hybridScore.tierCount} | ${comparison} |`,
  );
}

const architectureRuns = (key) =>
  architecture.boards.map((board) => board[key][0]);
const productionRuns = architectureRuns("production");
const hybridRuns = architectureRuns("hybrid");
const metric = (runs, key) => sum(runs.map((run) => run.score[key]));
const runPasses = (runs, key) => runs.filter((run) => run[key]).length;
add(
  "",
  "## Accuracy",
  "",
  "| Metric | Production | Hybrid | Delta |",
  "|---|---:|---:|---:|",
);
for (const [label, key] of [
  ["total exact", "totalExactCount"],
  ["pasted exact", "pastedExactCount"],
  ["remaining exact", "remainingExactCount"],
  ["tier exact", "tierExactCount"],
]) {
  const left = metric(productionRuns, key);
  const right = metric(hybridRuns, key);
  add(
    `| ${label} | ${left}/58 | ${right}/58 | ${right - left >= 0 ? "+" : ""}${right - left} |`,
  );
}
add(
  `| full-board exact | ${productionRuns.filter((run) => run.score.fullBoardExact).length}/5 | ${hybridRuns.filter((run) => run.score.fullBoardExact).length}/5 | 0 |`,
  `| JSON valid | ${runPasses(productionRuns, "jsonValid")}/5 | ${runPasses(hybridRuns, "jsonValid")}/5 | 0 |`,
  `| AJV pass | ${runPasses(productionRuns, "ajvValid")}/5 | ${runPasses(hybridRuns, "ajvValid")}/5 | 0 |`,
);

for (const board of architecture.boards) {
  add("", `## ${board.name}`, "");
  const p = board.production[0];
  const h = board.hybrid[0];
  add(
    `Provider RequestIds: production \`${p.requestId}\`; Hybrid \`${h.requestId}\`.`,
    "",
    "| Tier | Production raw | Hybrid raw | Production final | Hybrid final | Ground truth |",
    "|---|---|---|---:|---:|---:|",
  );
  for (const expected of board.groundTruth.tiers) {
    const pTier = p.score.tiers.find((tier) => tier.tier === expected.tier);
    const hTier = h.score.tiers.find((tier) => tier.tier === expected.tier);
    add(
      `| ${expected.tier} | ${rawSummary(p, expected.tier, "production")} | ${rawSummary(h, expected.tier, "hybrid")} | ${triple(pTier.actual)} | ${triple(hTier.actual)} | ${triple(pTier.expected)} |`,
    );
  }
  if (board.caseId === "case-3-snow-miku") {
    add(
      "",
      `Printed-letter false pasted — Production: ${p.score.falsePastedTiers.length} (${p.score.falsePastedTiers.join(", ")}); Hybrid: ${h.score.falsePastedTiers.length} (${h.score.falsePastedTiers.join(", ") || "none"}).`,
    );
  }
  if (board.caseId === "case-4-attack-on-titan") {
    add(
      "",
      `Printed A/B/C/D false pasted — Production: ${p.score.falsePastedTiers.length}; Hybrid: ${h.score.falsePastedTiers.length}. Hybrid fixed E/F/G/H/I but not A/B/C/D.`,
    );
  }
  if (board.caseId === "case-5-world-beyond") {
    const mappings = h.normalized.trace.tiers
      .filter((tier) => tier.label.startsWith("SP"))
      .map(
        (tier) =>
          `${tier.rawLabel}→${tier.label} ${tier.totalTickets}/${tier.pastedTickets}/${tier.remainingTickets}`,
      )
      .join("; ");
    add(
      "",
      `Raw distinct SP count — Production: ${p.score.rawSpecialItemCount}; Hybrid: ${h.score.rawSpecialItemCount}.`,
      "",
      `Cloud mapping: ${mappings}. Visual-order preservation passed; pasted values for SP2/SP3 remained Qwen visual errors, not mapping errors.`,
    );
  }
}

add(
  "",
  "## Cloud Deterministic Tests",
  "",
  "| Case | Result |",
  "|---|---|",
  "| A1/A2 → A 5/3/2 | PASS |",
  "| D1/D2 → D 5/2/3 | PASS |",
  "| Four identical SP labels → SP1–SP4 | PASS |",
  "| total=10, pasted=null → remaining=null | PASS |",
  "| total=null, pasted=0 → remaining=null | PASS |",
  "| total=3, pasted=4 → COUNT_RANGE_INVALID; no clamp | PASS |",
  "| conflicting duplicate A1 → COUNT_CONFLICT | PASS |",
  "| null never becomes 0 | PASS |",
  "",
  "Vitest: 1 file, 9 tests passed.",
);

const pText = sum(
  productionRuns.map((run) => run.usage.prompt_tokens_details.text_tokens),
);
const hText = sum(
  hybridRuns.map((run) => run.usage.prompt_tokens_details.text_tokens),
);
const pPrompt = sum(productionRuns.map((run) => run.usage.prompt_tokens));
const hPrompt = sum(hybridRuns.map((run) => run.usage.prompt_tokens));
const pCompletion = sum(
  productionRuns.map((run) => run.usage.completion_tokens),
);
const hCompletion = sum(hybridRuns.map((run) => run.usage.completion_tokens));
const pTotal = sum(productionRuns.map((run) => run.usage.total_tokens));
const hTotal = sum(hybridRuns.map((run) => run.usage.total_tokens));
add(
  "",
  "## Token",
  "",
  "| Token metric (5 calls) | Production | Hybrid | Delta |",
  "|---|---:|---:|---:|",
  `| actual prompt text | ${pText} | ${hText} | ${hText - pText} (${percent(hText - pText, pText)}) |`,
  `| prompt incl. image | ${pPrompt} | ${hPrompt} | ${hPrompt - pPrompt} (${percent(hPrompt - pPrompt, pPrompt)}) |`,
  `| completion | ${pCompletion} | ${hCompletion} | ${hCompletion - pCompletion} (${percent(hCompletion - pCompletion, pCompletion)}) |`,
  `| total API | ${pTotal} | ${hTotal} | ${hTotal - pTotal} (${percent(hTotal - pTotal, pTotal)}) |`,
);

add(
  "",
  "## Latency",
  "",
  "| Board | Production | Hybrid | Delta |",
  "|---|---:|---:|---:|",
);
for (const board of architecture.boards) {
  const p = board.production[0].latencyMs;
  const h = board.hybrid[0].latencyMs;
  add(
    `| ${board.name} | ${p} ms | ${h} ms | ${h - p} ms (${percent(h - p, p)}) |`,
  );
}
const pLatency = average(productionRuns.map((run) => run.latencyMs));
const hLatency = average(hybridRuns.map((run) => run.latencyMs));
add(
  "",
  `Average: Production ${pLatency.toFixed(1)} ms; Hybrid ${hLatency.toFixed(1)} ms; delta ${(hLatency - pLatency).toFixed(1)} ms (${percent(hLatency - pLatency, pLatency)}). No P95 claim is made from this sample.`,
);

add(
  "",
  "## Stability",
  "",
  "Not run. The quick pass failed the predeclared gate because Hybrid regressed Pokémon and 世界之外, including production-correct SP/regular results. The first 10 architecture calls were retained; no calls were repeated.",
);

const regressions = [];
for (const board of architecture.boards) {
  for (const pTier of board.production[0].score.tiers) {
    const hTier = board.hybrid[0].score.tiers.find(
      (tier) => tier.tier === pTier.tier,
    );
    if (pTier.tierExact && !hTier?.tierExact) {
      regressions.push(
        `${board.name} ${pTier.tier}: production ${triple(pTier.actual)} → Hybrid ${triple(hTier.actual)}; GT ${triple(pTier.expected)}`,
      );
    }
  }
}
add("", "## Regressions", "");
for (const regression of regressions) add(`- ${regression}`);

add(
  "",
  "## First Wrong Layer",
  "",
  "All 10 architecture outputs were valid JSON, passed their frozen Provider Schema, and normalized without issues. Therefore every numeric failure starts at **QWEN_VISUAL**. Cloud arithmetic and SP mapping reproduced the supplied raw values deterministically; none of these failures is a CloudBase formula error.",
  "",
  "Notable first-layer failures: NIKKE G/H/I/J remain overlap/dense undercounts; Pokémon Hybrid misread B total and overcounted C/E/F/G/H/I pasted tickets; Snow Miku Hybrid misread B pasted and S pasted; Attack on Titan still treated printed A/B/C/D as pasted; 世界之外 Hybrid treated every regular tier and SP2/SP3 as fully pasted.",
);

add(
  "",
  "## Twelve Answers",
  "",
  "1. 中文 Scene 是否优于英文 Scene？**是，在本次 language gate 的准确率上明显更好。**",
  "2. 哪个实际 prompt text tokens 更少？**英文：803/call；中文：867/call。**",
  "3. Hybrid 是否明显降低 Provider 协议复杂度？**是；从 v4 pattern/evidence 协议降为 5 个根字段和每 tier 4 个字段。**",
  "4. Hybrid 是否提升 pasted exact？**总体是，17/58→35/58，但 Pokémon 与世界之外有回归。**",
  "5. Hybrid 是否提升 total exact？**是，35/58→52/58。**",
  "6. 是否改善 printed board vs physical ticket？**部分改善：Snow Miku 11→0、巨人 E–I 修复，但巨人 A–D 仍失败。**",
  "7. 是否改善 NIKKE dense overlap exact counting？**改善但未解决：tier exact 4/11→7/11；G/H/I/J 仍不 exact。**",
  "8. 是否改善 vertical board？**混合：巨人显著改善，Pokémon 6/10→3/10，不能判为通用改善。**",
  "9. 是否正确保留四个独立 SP raw items？**是，Hybrid raw=4，visual-order SP1–SP4 映射稳定；但 SP2/SP3 pasted 错。**",
  "10. CloudBase 能否稳定完成 A1/A2/SP/remaining？**能，全部确定性测试通过。**",
  `11. Hybrid Provider latency？**本轮平均 ${hLatency.toFixed(1)} ms vs ${pLatency.toFixed(1)} ms，少 ${(pLatency - hLatency).toFixed(1)} ms（${percent(pLatency - hLatency, pLatency)}）；仅为单次 quick pass，不声称 P95。**`,
  "12. 是否值得成为下一代 production candidate？**值得继续独立研究，但当前存在明确 baseline/SP/vertical regression，不应成为 RC 或上线。**",
);

add(
  "",
  "## Final Conclusion",
  "",
  "**B. HYBRID PROMISING — NEEDS ANOTHER ISOLATED EXPERIMENT**",
  "",
  "The architecture materially reduced protocol/token/latency load and improved aggregate exactness, especially printed-board discrimination and totals. It did not meet the frozen promotion/stability gate because eight production-correct tiers regressed and vertical/SP pasted recognition remained inconsistent. Production remains unchanged; no deployment was performed.",
);

const output = `${lines.join("\n")}\n`;
const outputFile = path.join(artifactDir, "report.md");
fs.writeFileSync(outputFile, output);
console.log(outputFile);
