import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const glossary = readJson("data/calculation-baseline/glossary.json");
const vectorFile = readJson("data/calculation-baseline/vectors.json");
const versions = readJson("data/toolchain-baseline/versions.json");
const errors = [];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function fail(message) {
  errors.push(message);
}

function gcd(left, right) {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b !== 0) [a, b] = [b, a % b];
  return a;
}

function fraction(numerator, denominator) {
  if (denominator === 0) return null;
  if (numerator === 0) return "0/1";
  const divisor = gcd(numerator, denominator);
  return `${numerator / divisor}/${denominator / divisor}`;
}

function choose(n, k) {
  if (!Number.isInteger(n) || !Number.isInteger(k) || n < 0 || k < 0 || k > n)
    return 0;
  let result = 1;
  const m = Math.min(k, n - k);
  for (let index = 1; index <= m; index += 1)
    result = (result * (n - m + index)) / index;
  return result;
}

const requiredTerms = [
  "probability",
  "hit_distribution",
  "expected_draws",
  "cost_budget",
  "buyout",
  "stop",
];
if (glossary.moneyRepresentation !== "integer_minor_units")
  fail("money must use integer minor units");
for (const id of requiredTerms) {
  const term = glossary.terms.find((entry) => entry.id === id);
  if (!term) {
    fail(`missing glossary term ${id}`);
    continue;
  }
  for (const field of ["definition", "example"])
    if (!term[field]) fail(`${id} lacks ${field}`);
  for (const field of ["inputs", "outputs", "limits"])
    if (!Array.isArray(term[field]) || term[field].length === 0)
      fail(`${id} lacks ${field}`);
}

const vectors = new Map(vectorFile.vectors.map((entry) => [entry.id, entry]));
for (const id of [
  "ordinary-pool",
  "target-zero",
  "draws-zero",
  "draw-all",
  "multiple-target-requirements",
  "budget-below-one-draw",
]) {
  if (!vectors.has(id)) fail(`missing vector ${id}`);
}
const ordinary = vectors.get("ordinary-pool");
if (ordinary) {
  const {
    remainingTickets: r,
    targetTickets: t,
    plannedDraws: k,
  } = ordinary.input;
  const denominator = choose(r, k);
  const expectedAtLeast = fraction(denominator - choose(r - t, k), denominator);
  if (ordinary.expected.nextDrawHitProbability !== fraction(t, r))
    fail("ordinary next-hit probability is wrong");
  if (ordinary.expected.atLeastOneHitProbability !== expectedAtLeast)
    fail("ordinary at-least-one probability is wrong");
  let distributionNumerator = 0;
  for (let x = 0; x <= Math.min(t, k); x += 1) {
    const numerator = choose(t, x) * choose(r - t, k - x);
    distributionNumerator += numerator;
    if (
      ordinary.expected.hitDistribution[String(x)] !==
      fraction(numerator, denominator)
    )
      fail(`ordinary distribution x=${x} is wrong`);
  }
  if (distributionNumerator !== denominator)
    fail("ordinary hit distribution does not sum to one");
  if (ordinary.expected.expectedTargetCount !== fraction(k * t, r))
    fail("ordinary expected target count is wrong");
  if (ordinary.expected.expectedDrawsToFirstHit !== fraction(r + 1, t + 1))
    fail("ordinary expected first hit is wrong");
}

const multi = vectors.get("multiple-target-requirements");
if (multi) {
  const denominator = choose(
    multi.input.remainingTickets,
    multi.input.plannedDraws,
  );
  const favorable = multi.input.targets.reduce(
    (product, target) => product * choose(target.available, target.required),
    1,
  );
  if (
    multi.expected.meetAllRequirementsProbability !==
    fraction(favorable, denominator)
  )
    fail("multiple-target vector is wrong");
}

const invalidErrors = new Set(
  vectorFile.vectors
    .filter((entry) => entry.kind === "invalid_input")
    .map((entry) => entry.expected.error),
);
for (const code of [
  "NEGATIVE_REMAINING_TICKETS",
  "NEGATIVE_PLANNED_DRAWS",
  "TARGET_EXCEEDS_REMAINING",
  "DRAWS_EXCEED_REMAINING",
]) {
  if (!invalidErrors.has(code)) fail(`missing invalid boundary ${code}`);
}

for (const key of [
  "node",
  "pnpm",
  "typescript",
  "vitest",
  "wechatBaseLibrary",
  "cloudbaseNodeRuntime",
  "recognitionProvider",
]) {
  if (!versions[key]) fail(`toolchain baseline lacks ${key}`);
}
const provider = versions.recognitionProvider;
if (provider.clientTimeoutMs <= provider.providerTimeoutMs)
  fail("client timeout must exceed provider timeout");
if (provider.model !== "qwen3.7-flash")
  fail("recognition model must match the approved qwen3.7 Flash alias");
if (
  provider.promptVersion !== "ichi-board-vlm-4.0.3-rc1" ||
  provider.schemaVersion !== "board-provider-extraction-4.0.0-rc1" ||
  provider.policyVersion !== "board-vlm-policy-1.0.0-rc1"
)
  fail("recognition machine protocol versions must remain locked together");
if (
  "ocrSupplementModel" in provider ||
  "ocrSupplementTrigger" in provider ||
  "maxOcrSupplementAttempts" in provider
)
  fail("the approved recognition path must not contain a second OCR model");
if (provider.ichiImagePersistence !== "none")
  fail("ICHI recognition images must not persist");
if (provider.maxPrimaryAttempts !== 1 || provider.maxTotalModelCalls !== 1)
  fail("recognition call limits are wrong");
if (
  provider.imageTransport !==
    "cloudbase_private_temp_url_to_provider_image_url" ||
  provider.performanceTargetImageBytes !== 8 * 1024 * 1024 ||
  provider.providerHardImageBytes !== 20 * 1024 * 1024 ||
  provider.modelMaxPixels !== 6291456 ||
  provider.maxOutputTokens !== null
)
  fail("recognition transport and rc2 performance limits do not match");
if (provider.costCeilingCnyPerBoard > 0.03)
  fail("recognition cost ceiling exceeds the approved cap");
if (provider.providerUsesCallDataForTraining !== false)
  fail("provider training-use decision is missing");
if (
  provider.providerCallDataStorage !==
  "required_by_provider_duration_unspecified"
)
  fail("provider storage uncertainty must remain explicit");
if (provider.providerImmediateDeletionApi !== false)
  fail("an unsupported immediate deletion API was claimed");

if (errors.length > 0) {
  console.error(
    `V1-A baseline validation failed with ${errors.length} error(s):`,
  );
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `V1-A baseline validation passed: ${requiredTerms.length} terms, ${vectorFile.vectors.length} fixed vectors, toolchain and recognition privacy decisions are complete.`,
);
