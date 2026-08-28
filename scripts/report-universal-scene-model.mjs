import fs from "node:fs";
import path from "node:path";

const input = path.resolve(
  process.argv[2] ||
    "artifacts/universal-scene-model-experiment/2026-08-26/results.json",
);
const output = path.join(path.dirname(input), "REPORT.md");
const data = JSON.parse(fs.readFileSync(input, "utf8"));

const fmt = (value) => (value === null || value === undefined ? "null" : value);
const avg = (values) =>
  values.length === 0
    ? null
    : values.reduce((sum, value) => sum + value, 0) / values.length;
const pct = (value) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
const delta = (value) => `${value >= 0 ? "+" : ""}${Math.round(value)}`;
const run = (board, kind) => board[kind][0];
const tier = (result, label) =>
  result?.score?.tiers?.find((entry) => entry.tier === label) || null;
const rawTierList = (result) =>
  result?.score?.rawTiers ||
  (Array.isArray(result?.parsedProvider?.tiers)
    ? result.parsedProvider.tiers.map((entry) => ({
        rawLabel: entry.rawLabel,
        prizeName: entry.prizeName,
        totalTickets: entry.totalTickets,
        ticketPattern: entry.ticketPattern,
        sequenceStart: entry.evidence?.sequenceStart ?? null,
        firstOpen: entry.evidence?.firstOpen ?? null,
        pastedDirect: entry.evidence?.pastedDirect ?? null,
      }))
    : []);
const rawTier = (result, label) =>
  rawTierList(result).find(
    (entry) =>
      String(entry.rawLabel || "")
        .normalize("NFKC")
        .toUpperCase()
        .replace(/\s+/gu, "")
        .replace(/[赏賞]$/u, "") === label,
  ) || null;
const raw = (entry) =>
  entry
    ? `${fmt(entry.totalTickets)} / ${entry.ticketPattern} / {sequenceStart:${fmt(entry.sequenceStart)}, firstOpen:${fmt(entry.firstOpen)}, pastedDirect:${fmt(entry.pastedDirect)}}`
    : "N/A";
const final = (entry) =>
  entry
    ? `${fmt(entry.actual.total)} / ${fmt(entry.actual.pasted)} / ${fmt(entry.actual.remaining)}`
    : "N/A";
const truth = (entry) =>
  `${entry.total} / ${entry.pasted} / ${entry.total - entry.pasted}`;

const summary = (kind) => {
  let tiers = 0;
  let totalExact = 0;
  let pastedExact = 0;
  let remainingExact = 0;
  let tierExact = 0;
  let fullBoardExact = 0;
  let jsonValid = 0;
  let ajvPass = 0;
  const latencies = [];
  for (const board of data.boards) {
    const result = run(board, kind);
    tiers += board.groundTruth.tiers.length;
    jsonValid += result.jsonValid ? 1 : 0;
    ajvPass += result.ajvValid ? 1 : 0;
    if (Number.isFinite(result.latencyMs)) latencies.push(result.latencyMs);
    if (!result.score) continue;
    totalExact += result.score.totalExactCount;
    pastedExact += result.score.pastedExactCount;
    remainingExact += result.score.remainingExactCount;
    tierExact += result.score.exactTierCount;
    fullBoardExact += result.score.fullBoardExact ? 1 : 0;
  }
  return {
    tiers,
    totalExact,
    pastedExact,
    remainingExact,
    tierExact,
    fullBoardExact,
    jsonValid,
    ajvPass,
    averageLatency: avg(latencies),
  };
};

const aSummary = summary("production");
const bSummary = summary("scene");
const regressions = [];
for (const board of data.boards) {
  const production = run(board, "production");
  const scene = run(board, "scene");
  for (const expected of board.groundTruth.tiers) {
    const before = tier(production, expected.tier);
    const after = tier(scene, expected.tier);
    if (before?.tierExact && !after?.tierExact) {
      regressions.push({
        image: board.name,
        tier: expected.tier,
        production: final(before),
        scene: final(after),
        groundTruth: truth(expected),
        reason: scene.ajvValid ? "Scene final mismatch" : "Scene AJV failure",
      });
    }
  }
}

const sceneChars = data.promptSize.experimentalCharacters;
const productionChars = data.promptSize.productionCharacters;
const charDelta = sceneChars - productionChars;
const charDeltaPct = (charDelta / productionChars) * 100;
const actualProductionTextTokens =
  run(data.boards[0], "production").usage?.prompt_tokens_details?.text_tokens ??
  null;
const actualSceneTextTokens =
  run(data.boards[0], "scene").usage?.prompt_tokens_details?.text_tokens ??
  null;
const tokenDelta = actualSceneTextTokens - actualProductionTextTokens;
const tokenDeltaPct = (tokenDelta / actualProductionTextTokens) * 100;

const lines = [];
const push = (...items) => lines.push(...items);
push(
  "# UNIVERSAL SCENE MODEL A/B RESULT",
  "",
  "Final conclusion: **C. NO BENEFIT / REGRESSION**",
  "",
  "The Universal Scene Model materially improved printed-tier-letter discrimination, but the candidate failed the normal-baseline and SP regression gates. Stability calls were therefore not run.",
  "",
  "## Prompt",
  "",
  `Production: \`${data.controls.providerSchemaVersion}\` with \`ichi-board-vlm-4.0.3-rc1\` ([prompt](../../../data/recognition-contract/prompt/ichi-board-vlm-4.0.3-rc1.txt)).`,
  "",
  "Experimental: `ichi-board-vlm-4.1.0-scene-exp` with the same production Provider Schema, Normalize, and RecognitionContract ([prompt](../../../data/recognition-contract/prompt/ichi-board-vlm-4.1.0-scene-exp.txt)).",
  "",
  `Production tokens: ${actualProductionTextTokens} actual Provider text tokens (${data.promptSize.estimatedProductionTextTokens} character-based estimate).`,
  "",
  `Experimental tokens: ${actualSceneTextTokens} actual Provider text tokens (${data.promptSize.estimatedExperimentalTextTokens} character-based estimate).`,
  "",
  `Delta: ${delta(tokenDelta)} actual text tokens (${pct(tokenDeltaPct)}); ${delta(charDelta)} characters (${pct(charDeltaPct)}).`,
  "",
  "Frozen controls: `qwen3.7-flash`, thinking=false, temperature=0, response_format=json_object, max_pixels=6291456, same original file and temporary URL per A/B pair, v4 Provider Schema/AJV, production Normalize, RecognitionContract 1.0.0, and CloudBase counting formulas.",
  "",
  "## Overall Quick Pass",
  "",
  "| Image | Production | Scene Model | Ground Truth | Better/Worse/Same |",
  "|---|---:|---:|---|---|",
);
for (const board of data.boards) {
  const production = run(board, "production");
  const scene = run(board, "scene");
  const p = production.score
    ? `${production.score.exactTierCount}/${board.groundTruth.tiers.length} tier exact`
    : `AJV FAIL`;
  const s = scene.score
    ? `${scene.score.exactTierCount}/${board.groundTruth.tiers.length} tier exact`
    : `AJV FAIL`;
  const pv = production.score?.exactTierCount ?? -1;
  const sv = scene.score?.exactTierCount ?? -1;
  const outcome = sv > pv ? "Better" : sv < pv ? "Worse" : "Same";
  push(
    `| ${board.name} | ${p} | ${s} | ${board.groundTruth.tiers.length}/${board.groundTruth.tiers.length} | ${outcome} |`,
  );
}

push(
  "",
  "### Per-image physical classification",
  "",
  "| Image | Prompt | Q1 printed vs attached | Q2 open state | Q3 overlap |",
  "|---|---|---|---|---|",
);
for (const board of data.boards) {
  for (const [label, kind] of [
    ["Production", "production"],
    ["Scene", "scene"],
  ]) {
    const score = run(board, kind).score;
    push(
      `| ${board.name} | ${label} | ${score ? (score.q1PrintedVsPhysical ? "YES" : "NO") : "UNAVAILABLE (AJV)"} | ${score ? (score.q2OpenState ? "YES" : "NO") : "UNAVAILABLE (AJV)"} | ${score?.q3Overlap === null ? "N/A" : score ? (score.q3Overlap ? "YES" : "NO") : "UNAVAILABLE (AJV)"} |`,
    );
  }
}

push(
  "",
  "## Accuracy Summary",
  "",
  "| Metric | Production | Scene Model |",
  "|---|---:|---:|",
  `| total exact | ${aSummary.totalExact}/${aSummary.tiers} | ${bSummary.totalExact}/${bSummary.tiers} |`,
  `| pasted exact | ${aSummary.pastedExact}/${aSummary.tiers} | ${bSummary.pastedExact}/${bSummary.tiers} |`,
  `| remaining exact | ${aSummary.remainingExact}/${aSummary.tiers} | ${bSummary.remainingExact}/${bSummary.tiers} |`,
  `| tier exact (total+pasted+remaining) | ${aSummary.tierExact}/${aSummary.tiers} | ${bSummary.tierExact}/${bSummary.tiers} |`,
  `| full-board exact | ${aSummary.fullBoardExact}/5 | ${bSummary.fullBoardExact}/5 |`,
  `| JSON valid | ${aSummary.jsonValid}/5 | ${bSummary.jsonValid}/5 |`,
  `| AJV pass | ${aSummary.ajvPass}/5 | ${bSummary.ajvPass}/5 |`,
  "",
  "AJV failures count as non-exact for all Ground Truth tiers on that image. This prevents an otherwise usable but contract-invalid raw object from being credited as a production result.",
  "",
  "## Printed-Tier-Letter Cases",
  "",
);
for (const board of data.boards.filter(
  (entry) => entry.groundTruth.printedZeroTiers,
)) {
  const production = run(board, "production");
  const scene = run(board, "scene");
  push(`### ${board.name}`, "");
  for (const label of board.groundTruth.printedZeroTiers) {
    const expected = board.groundTruth.tiers.find(
      (entry) => entry.tier === label,
    );
    push(
      `- ${label}: Production raw \`${raw(rawTier(production, label))}\`; Scene raw \`${raw(rawTier(scene, label))}\`; Production final \`${final(tier(production, label))}\`; Scene final \`${final(tier(scene, label))}\`; Ground Truth \`${truth(expected)}\`.`,
    );
  }
  push(
    "",
    `False-pasted tiers: Production ${production.score?.falsePastedTiers.length ?? "N/A"}; Scene ${scene.score?.falsePastedTiers.length ?? "N/A"}.`,
    "",
  );
}
push(
  "Physical-layer discrimination improved: **YES, materially but incompletely**. Snow Miku fell from 11 false-pasted printed-letter tiers to 1; Attack on Titan fell from 4 to 3. A/B/C in Attack on Titan and C in Snow Miku remained false positives.",
  "",
  "## NIKKE",
  "",
  "| Tier | Production raw total/pattern/evidence | Production final | Scene raw total/pattern/evidence | Scene final | Ground Truth |",
  "|---|---|---|---|---|---|",
);
const nikke = data.boards[0];
for (const expected of nikke.groundTruth.tiers) {
  const production = run(nikke, "production");
  const scene = run(nikke, "scene");
  push(
    `| ${expected.tier} | ${raw(rawTier(production, expected.tier))} | ${final(tier(production, expected.tier))} | ${raw(rawTier(scene, expected.tier))} | ${final(tier(scene, expected.tier))} | ${truth(expected)} |`,
  );
}
push(
  "",
  "Production raw was JSON-valid but AJV-invalid because it emitted warning `noPriceVisible`, outside the frozen enum; production final is therefore unavailable. Scene passed AJV but read B=1, C/D/E=4, and collapsed dense G–K capacities to 7 each.",
  "",
  "Black-ticket understanding improved: **NO (not solved)**. Scene treated dark strips as pasted, but did not recover their physical capacities/counts.",
  "",
  "Overlap understanding improved: **NO for dense exact structure**.",
  "",
  "Terminal full ticket improved: **PARTIAL ONLY**. F became exact 5/5, while G–K still undercounted.",
  "",
  "Multi-run improved: **NO**. G–K continuation structure remained severely undercounted.",
  "",
  "Dense counting improved: **NO**. NIKKE hard gate remained a fail; expected whole board 80/78/2, while Scene final was 58/52/6.",
  "",
  "The `あと1枚` state was reflected as one remaining for G–K, but attached to incorrect total/prefix structures; correct remaining-label semantics did not produce exact counting.",
  "",
  "## Vertical",
  "",
  "### Pokémon",
  "",
  "Production and Scene were identical at the normalized count layer: A/B/G/H/I/J exact, C/E/F wrongly full, and D wrongly prefix with pasted=1. Scene did not improve this vertical board.",
  "",
  "### Attack on Titan",
  "",
  "Scene changed D–I from prefix to empty and made E/F/G/H/I exact. However A/B/C still appeared full, D total remained 8 instead of 1, and B total regressed to 2.",
  "",
  "Vertical generalization: **FAIL / MIXED**. One vertical layout improved substantially, while the Pokémon vertical failure was unchanged and the board was not full-board exact.",
  "",
  "## SP",
  "",
  "世界之外 raw special items:",
  "",
  `- Production: ${run(data.boards[4], "production").score?.rawSpecialItems.length ?? 0} item — all four visual SP strips were merged into one raw \`SP赏 total=8 full\`.`,
  `- Scene: raw content also merged them into one \`SP赏 total=8 full\`, then failed AJV because warning \`lastOneNotATier\` is outside the frozen enum.`,
  "",
  "CloudBase mapping:",
  "",
  "- Production mapped only the single raw item to SP1=8/8/0; SP2–SP4 were absent.",
  "- Scene mapping did not run because AJV failed.",
  "",
  "| Tier | Production | Scene | Ground Truth |",
  "|---|---|---|---|",
  "| SP1 | 8/8/0 | N/A (AJV) | 2/2/0 |",
  "| SP2 | null/null/null | N/A (AJV) | 2/1/1 |",
  "| SP3 | null/null/null | N/A (AJV) | 2/1/1 |",
  "| SP4 | null/null/null | N/A (AJV) | 2/2/0 |",
  "",
  "SP regression: **YES**. Production was already incorrect at raw tier preservation, but still yielded exact B/C/D/E regular tiers; Scene's AJV failure removed the entire deterministic integration result.",
  "",
  "## Normal Baseline",
  "",
  `Regression: **${regressions.length > 0 ? "YES" : "NO"}**`,
  "",
  "Production correct → Scene wrong tiers:",
  "",
  "| Image | Tier | Production | Scene | Ground Truth | Cause |",
  "|---|---|---|---|---|---|",
);
for (const entry of regressions) {
  push(
    `| ${entry.image} | ${entry.tier} | ${entry.production} | ${entry.scene} | ${entry.groundTruth} | ${entry.reason} |`,
  );
}
push(
  "",
  "## JSON",
  "",
  `Production valid: ${aSummary.jsonValid}/5 JSON; ${aSummary.ajvPass}/5 AJV.`,
  "",
  `Scene valid: ${bSummary.jsonValid}/5 JSON; ${bSummary.ajvPass}/5 AJV.`,
  "",
  "AJV: Production NIKKE failed only on warning `noPriceVisible`; Scene 世界之外 failed only on warning `lastOneNotATier`. Both raw objects otherwise used the frozen JSON shape, but frozen AJV correctly rejected them. JSON/AJV stability did not numerically worsen, yet the failure moved onto the SP regression sample.",
  "",
  "## Latency",
  "",
  "| Image | Production | Scene | Delta | Relative delta |",
  "|---|---:|---:|---:|---:|",
);
for (const board of data.boards) {
  const production = run(board, "production").latencyMs;
  const scene = run(board, "scene").latencyMs;
  const difference = scene - production;
  push(
    `| ${board.name} | ${production} ms | ${scene} ms | ${delta(difference)} ms | ${pct((difference / production) * 100)} |`,
  );
}
const latencyDelta = bSummary.averageLatency - aSummary.averageLatency;
push(
  "",
  `Average Production: ${aSummary.averageLatency.toFixed(1)} ms.`,
  "",
  `Average Scene: ${bSummary.averageLatency.toFixed(1)} ms.`,
  "",
  `Average delta: ${delta(latencyDelta)} ms (${pct((latencyDelta / aSummary.averageLatency) * 100)}). No P95 is claimed from five single runs.`,
  "",
  "## Prompt Size",
  "",
  "| Prompt | Characters | Estimated text tokens | Actual Provider text tokens |",
  "|---|---:|---:|---:|",
  `| Production | ${productionChars} | ${data.promptSize.estimatedProductionTextTokens} | ${actualProductionTextTokens} |`,
  `| Experimental | ${sceneChars} | ${data.promptSize.estimatedExperimentalTextTokens} | ${actualSceneTextTokens} |`,
  `| Delta | ${delta(charDelta)} (${pct(charDeltaPct)}) | ${delta(data.promptSize.estimatedExperimentalTextTokens - data.promptSize.estimatedProductionTextTokens)} | ${delta(tokenDelta)} (${pct(tokenDeltaPct)}) |`,
  "",
  "## Stability",
  "",
  "Not entered. The Quick Pass triggered the stop rule because of normal-baseline and SP regressions. Total Provider calls: 10, not 30.",
  "",
  "## Remaining Model Errors",
  "",
  "- NIKKE Production: first wrong layer was Provider Schema (invalid warning enum); its raw visual extraction also left every total null and marked all tiers full.",
  "- NIKKE Scene: first wrong layer was Qwen raw visual extraction. CloudBase applied the frozen formulas exactly to incorrect totals/pattern evidence.",
  "- Pokémon A/B: first wrong layer was Qwen raw visual classification for C/D/E/F; Normalize was deterministic and unchanged.",
  "- Snow Miku A/B: first wrong layer was Qwen raw capacity extraction. Scene improved physical pasted/open classification but read many printed one-ticket tiers as capacities 2/4/6/12.",
  "- Attack on Titan A/B: first wrong layer was Qwen raw physical/capacity extraction. Scene fixed E–I empty-state classification, but printed A/B/C remained full and D capacity was read as 8.",
  "- 世界之外 Production: first wrong layer was Qwen raw tier preservation; four SP strips were merged into one. Scene additionally failed Provider AJV on an invalid warning, so Normalize and CloudBase SP mapping correctly did not run.",
  "",
  "No observed mismatch is attributed to CloudBase counting. For every AJV-passing result, the final values are the deterministic consequence of the raw `ticketPattern` and evidence.",
  "",
  "## Final Questions",
  "",
  "1. Scene Model 是否解决黑色实体票被误解？**没有。** 它强化了黑票语义，但 Pokémon C/E/F 和 NIKKE dense runs 仍未正确计数。",
  "2. 是否解决底板印刷 A/B/C/D 被当成实体票？**明显改善但未解决。** Snow Miku 11→1，巨人 4→3。",
  "3. 是否改善 overlap ticket？**局部改善，不足以通过。** Snow Miku empty/full 物理分类改善；NIKKE dense overlap 仍失败。",
  "4. 是否改善 terminal full ticket？**仅 F 有局部证据，整体没有。** G–K 仍严重漏数。",
  "5. 是否改善 multi-row / multi-run？**没有。** NIKKE G–K 未恢复完整容量。",
  "6. 是否改善 vertical generalization？**混合。** 巨人 E–I 改善，Pokémon 无改善，因此 Gate FAIL。",
  "7. 是否影响 SP1–SP4 deterministic integration？**是，负面影响。** 两组都先在 raw 层合并 SP；Scene 又 AJV 失败，使 mapping 完全不运行。",
  "8. 模型是否仍依赖 typical Ichiban Kuji prior knowledge 猜数字？**没有看到典型价格/总数先验纠正的直接证据，但不能证明已消除。** NIKKE price 保持 null；主要错误更像视觉结构与容量混淆。",
  `9. Prompt token 增加多少？**实际 +${tokenDelta} text tokens（${pct(tokenDeltaPct)}）；字符 +${charDelta}（${pct(charDeltaPct)}）。**`,
  `10. Latency 增加/减少多少？**平均减少 ${Math.abs(latencyDelta).toFixed(1)} ms（${Math.abs((latencyDelta / aSummary.averageLatency) * 100).toFixed(1)}%）。** 单轮样本不报告 P95。`,
  "11. 是否值得进入下一阶段 Prompt 重构？**当前 candidate 不值得进入 stability 或 production。** Scene Model 概念对 printed-letter discrimination 有价值，但必须在未来单独获批的新实验中解决容量、SP preservation 与 warning discipline；本轮到此停止。",
  "",
  "## FINAL CONCLUSION",
  "",
  "**C. NO BENEFIT / REGRESSION**",
  "",
  "The gain in physical-layer discrimination is real, but it is not broad enough to offset the regular-tier regressions, the SP integration failure, zero full-board exact results, and unchanged NIKKE/vertical hard failures. Production remains `ichi-board-vlm-4.0.3-rc1`; nothing was deployed.",
);

fs.writeFileSync(output, `${lines.join("\n")}\n`, "utf8");
console.log(output);
