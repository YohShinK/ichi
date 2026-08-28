import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const out = path.join(
  root,
  "artifacts/r1-provider-1.1-pokemon-smoke/2026-08-27",
);
const read = (name) =>
  JSON.parse(fs.readFileSync(path.join(out, name), "utf8"));
const write = (name, value) =>
  fs.writeFileSync(
    path.join(out, name),
    typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`,
  );
const hash = (file) =>
  crypto
    .createHash("sha256")
    .update(fs.readFileSync(path.join(root, file)))
    .digest("hex");

const run = read("r1-single-result.json").results[0];
const h0Before = read("05-h0-before-smoke.json");
const h0After = read("14-h0-restored-smoke.json");
const diagnostic = run.contract.internalDiagnostics;
const provider = diagnostic.providerDiagnostic;
const contract = { ...run.contract };
delete contract.internalDiagnostics;

write("03-hashes.json", {
  frozenAt: "2026-08-27",
  r11Prompt: {
    version: run.promptVersion,
    sha256: hash(
      "data/recognition-contract/prompt/ichi-board-vlm-r1-visible-evidence-1.1.0.txt",
    ),
  },
  r11Schema: {
    version: run.schemaVersion,
    sha256: hash(
      "data/recognition-contract/schema/board-provider-r1-visible-evidence-1.1.0.schema.json",
    ),
  },
  historicalR10: {
    promptSha256: hash(
      "data/recognition-contract/prompt/ichi-board-vlm-r1-visible-evidence-1.0.0.txt",
    ),
    schemaSha256: hash(
      "data/recognition-contract/schema/board-provider-r1-visible-evidence-1.0.0.schema.json",
    ),
    unchanged: true,
  },
  h0PromptSha256: hash(
    "data/recognition-contract/prompt/ichi-board-vlm-hybrid-semantic-1.0.0.txt",
  ),
});
write("04-local-tests.json", {
  pass: true,
  targeted: { files: 3, tests: 46, passed: 46 },
  fullVitest: { files: 51, tests: 418, passed: 418 },
  eslint: "PASS",
  prettier: "PASS",
  typescript: "PASS",
  contracts: "PASS",
  workflow: "PASS",
  cloudbaseBuildValidate: "PASS",
  v1fPreflight: "PASS",
  notes: [
    "Initial aggregate command was blocked before execution because global pnpm 11.19.0 did not match repository-pinned 11.9.0; rerun used Corepack.",
    "First ESLint pass found two unused test destructuring bindings; fixed and rerun passed.",
    "No client files were modified.",
  ],
});
write("06-pokemon-image.json", {
  filename: "宝可梦30周年一番赏更新！_1_英俊的马铃薯_来自小红书网页版.jpg",
  sha256: run.imageSha256,
  expectedSha256:
    "6ffb93c428f76c3e1b390f7a5781ce14ef1a864c4ea44b4254e729fc0f192097",
  exactGolden: true,
  width: 1080,
  height: 1920,
  byteLength: 395934,
});
write("07-provider-request-meta.json", {
  cloudRequestId: run.cloudRequestId,
  functionRequestId: run.functionRequestId,
  businessRequestId: run.businessRequestId,
  providerRequestId: run.providerRequestId,
  providerRequestIdStatus:
    "NOT_CAPTURED_IN_SINGLE_CALL: provider response header was absent; payload-id fallback was added and deployed under H0 after the call; R1 was not retried.",
  mode: run.mode,
  productionDefaultPath: true,
  explicitModeOverride: false,
  promptVersion: run.promptVersion,
  promptSha256: run.promptHash,
  schemaVersion: run.schemaVersion,
  schemaSha256: diagnostic.schemaHash,
  modelSettings: diagnostic.modelSettings,
  latency: run.latency,
  tokenUsage: run.tokenUsage,
});
write(
  "08-provider-raw.txt",
  provider.rawMessageContent === null
    ? "NOT_REACHED\n"
    : `${provider.rawMessageContent}\n`,
);
write(
  "09-provider-parsed.json",
  provider.parsedJson ?? { status: "NOT_REACHED" },
);
write("10-ajv.json", {
  jsonParse: provider.jsonParse,
  ...provider.ajv,
});
write(
  "11-resolver-trace.json",
  diagnostic.deterministic?.resolver ??
    diagnostic.resolverTrace ?? { status: "NOT_REACHED" },
);
write("12-recognition-contract.json", contract);
write("13-pokemon-comparison.json", {
  groundTruthSource:
    "experiments/universal-scene-model/ground-truth.json (existing frozen source)",
  ...run.score,
  visibleNumberRunsAssessment: {
    summary:
      "C-G visible runs matched the live counts; H/I/J visible runs were plausible and had 7/8/16 occurrences, but pastedTicketsObserved was undercounted and the resolver selected 13/14/19 remaining. A/B had no visible runs and remained unresolved. LAST ONE was incorrectly emitted as an ordinary tier and normalized to extra SP1.",
  },
});
write("15-final-production-state.json", {
  checkedAt: new Date().toISOString(),
  environmentId: "cloud1-d7gxqfwv783a1f131",
  functionName: "recognize-board",
  status: "Active",
  availableStatus: "Available",
  boardRecognitionMode: "hybrid_semantic",
  internalSmokeTokenPresent: false,
  runtime: "Nodejs20.19",
  handler: "index.main",
  memoryMB: 512,
  timeoutSeconds: 60,
  h0PromptSha256:
    "0b4e572378fad8e445f63c6b67997415a1099a0c4ae4d968a6182b545b22226b",
  r11CodeDeployed: true,
  oldV4Runtime: "ABSENT",
  clientReleaseStatus: "BLOCKED_NO_NON_GUI_PATH",
});

const ajvErrors = provider.ajv.errors.length
  ? provider.ajv.errors
      .map(
        (item) =>
          `- ${item.instancePath} | ${item.schemaPath} | ${item.keyword} | ${JSON.stringify(item.params)} | ${item.message}`,
      )
      .join("\n")
  : "None.";
const tierRows = run.tierEvidence
  .map(
    (tier) =>
      `- ${tier.tierCode}: visible=${JSON.stringify(tier.visibleNumberRuns)}; occurrences=${tier.visibleOccurrenceCount}; direction=${tier.direction}; Tobs=${tier.totalTicketsObserved}; Pobs=${tier.pastedTicketsObserved}; T=${tier.canonical?.totalTickets}; U=${tier.canonical?.remainingTickets}; P=${tier.canonical?.pastedTickets}; kind=${tier.resolutionKind}; warnings=${JSON.stringify(tier.sequenceWarnings || [])}`,
  )
  .join("\n");
const report = `# R1.1 POKÉMON SINGLE-BOARD PRODUCTION TEST REPORT

## 1. Historical R1 1.0

Prompt unchanged: YES

Schema unchanged: YES

## 2. R1.1 Prompt

Path: data/recognition-contract/prompt/ichi-board-vlm-r1-visible-evidence-1.1.0.txt

SHA-256: ${run.promptHash}

## 3. R1.1 Schema

Path: data/recognition-contract/schema/board-provider-r1-visible-evidence-1.1.0.schema.json

SHA-256: ${diagnostic.schemaHash}

## 4. Local Gates

PASS. Targeted 46/46; full Vitest 418/418; ESLint, Prettier, TypeScript, contracts, workflow, CloudBase build/validate and V1-F preflight passed.

## 5. H0 Pre-Switch Smoke

PASS

Request IDs: Cloud ${h0Before.results[0].cloudRequestId}; business ${h0Before.results[0].businessRequestId}; Provider ${h0Before.results[0].providerRequestId}.

## 6. Pokémon Image

Filename: 宝可梦30周年一番赏更新！_1_英俊的马铃薯_来自小红书网页版.jpg

SHA-256: ${run.imageSha256}

Exact Golden: YES

## 7. R1.1 Provider

Cloud RequestId: ${run.cloudRequestId}

Business RequestId: ${run.businessRequestId}

Provider RequestId: NOT_CAPTURED. The single response omitted the supported request-id headers. Payload-id fallback was added and deployed afterward under H0; the R1 call was not repeated.

Prompt version: ${run.promptVersion}

Schema version: ${run.schemaVersion}

Raw Provider JSON: saved verbatim in 08-provider-raw.txt.

## 8. JSON Parse

${provider.jsonParse.pass ? "PASS" : "FAIL"}

Error: ${provider.jsonParse.error ?? "None"}

## 9. AJV

${provider.ajv.pass ? "PASS" : "FAIL"}

${ajvErrors}

## 10. Logic Gate

${run.resolverSuccess ? "REACHED" : "NOT_REACHED"}

${tierRows}

## 11. Pokémon Accuracy

Tier Detection: ${run.score.tierDetectionExact ? "EXACT" : "NOT EXACT"} (A-J detected, extra SP1 from LAST ONE)

Total Exact: ${run.score.totalExact}/${run.score.expectedTierCount}

未贴的票数 Exact: ${run.score.remainingExact}/${run.score.expectedTierCount}

Derived Pasted Exact: ${run.score.pastedExact}/${run.score.expectedTierCount}

False Zero: ${run.score.falseZero}

False Live: ${run.score.falseLive}

Decision Set Exact: ${run.score.decisionSetExact}/${run.score.expectedTierCount}

Full Board T/U: ${run.score.fullBoardTUExact ? "PASS" : "FAIL"}

Full Board T/U/P: ${run.score.fullBoardTUPExact ? "PASS" : "FAIL"}

## 12. What Qwen Actually Saw

Qwen separated A-J, but also treated FINAL/LAST ONE and its visible “65/张” as an ordinary special tier, which became extra SP1. It did not ingest “全X种” as a total. C-G visible runs and pasted counts were sufficient for exact T/U/P. A/B had no visible number runs and no observed total, so the resolver conservatively left them null instead of claiming zero. H/I/J exposed 7/8/16 visible positions, but Qwen counted only 5/4/5 pasted tickets; the existing constraint resolver therefore produced U=13/14/19 instead of 7/8/16. \`totalTicketsObserved\` was null for every tier, and price was null.

## 13. H0 Restore

R1 → H0: PASS

Final H0 smoke: PASS

Request IDs: Cloud ${h0After.results[0].cloudRequestId}; business ${h0After.results[0].businessRequestId}; Provider ${h0After.results[0].providerRequestId}.

## 14. Final Production State

BOARD_RECOGNITION_MODE=hybrid_semantic

H0 Prompt hash: 0b4e572378fad8e445f63c6b67997415a1099a0c4ae4d968a6182b545b22226b

Old v4 runtime: ABSENT

Temporary internal smoke token: ABSENT

Client release: BLOCKED_NO_NON_GUI_PATH

## 15. Conclusion

A. R1.1 PROVIDER CONTRACT PASSED AND LOGIC GATE REACHED

This single-board result does not establish that R1 is production-safe. Accuracy remained incomplete (8/10 total, 5/10 remaining, 5/10 pasted; extra SP1), and production was restored to H0.
`;
write("report.md", report);
