import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const fail = (message) => {
  throw new Error(message);
};

const manifest = readJson("data/recognition-evaluation/manifest.json");
if (manifest.schemaVersion !== "1.0.0") fail("Unexpected evaluation schema.");
if (manifest.purpose !== "qa_only" || manifest.runtimeDependency !== false) {
  fail("Recognition evaluation must remain QA-only and non-runtime.");
}
if (manifest.realWorldAccuracyClaimed !== false) {
  fail("Synthetic fixtures must not claim real-world accuracy.");
}
if (
  manifest.assetPolicy?.containsImageBinaries !== false ||
  manifest.assetPolicy?.officialVisualAssetsIncluded !== false ||
  manifest.assetPolicy?.productionAccuracyRequiresAuthorizedRealImages !== true
) {
  fail("Evaluation asset policy is incomplete.");
}

const requiredDimensions = new Set([
  "A_Z",
  "OTHER",
  "tier_label_low_confidence",
  "slot_derivation",
  "handwritten_price",
  "partial_frame",
  "retake",
  "low_confidence",
  "slot_inconsistency",
  "local_manual_correction",
]);
const seenDimensions = new Set();
for (const testCase of manifest.cases) {
  if (
    !manifest.assetPolicy.allowedAuthorization.includes(testCase.authorization)
  ) {
    fail(`Case ${testCase.id} has no allowed authorization.`);
  }
  if (testCase.assetType !== "structured_fixture") {
    fail(`Case ${testCase.id} must remain a structured fixture.`);
  }
  if (!fs.existsSync(path.join(root, testCase.fixture))) {
    fail(`Missing evaluation fixture: ${testCase.fixture}.`);
  }
  testCase.dimensions.forEach((dimension) => seenDimensions.add(dimension));
}
for (const dimension of requiredDimensions) {
  if (!seenDimensions.has(dimension)) fail(`Missing dimension: ${dimension}.`);
}

const tierCoverage = readJson(
  "data/recognition-evaluation/tier-label-coverage.json",
);
const expectedLabels = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "OTHER"];
const actualLabels = tierCoverage.labels.map((entry) => entry.expectedLabel);
if (JSON.stringify(actualLabels) !== JSON.stringify(expectedLabels)) {
  fail("Tier coverage must contain A-Z and OTHER exactly once in order.");
}
const other = tierCoverage.labels.at(-1);
if (
  other.expectedIssueCode !== "TIER_LABEL_OTHER" ||
  other.expectedAction !== "confirm_tier_label" ||
  tierCoverage.lowConfidenceCase.expectedIssueCode !==
    "TIER_LABEL_LOW_CONFIDENCE"
) {
  fail("OTHER and low-confidence labels must require explicit confirmation.");
}

const complete = readJson(
  "data/recognition-contract/fixtures/complete-board.json",
);
const handwritten = readJson(
  "data/recognition-contract/fixtures/handwritten-price.json",
);
const partial = readJson(
  "data/recognition-contract/fixtures/partial-board.json",
);
const inconsistent = readJson(
  "data/recognition-contract/fixtures/inconsistent-slots.json",
);
if (complete.response.status !== "ready_for_confirmation") {
  fail("Complete board route changed.");
}
if (
  handwritten.response.status !== "needs_user_input" ||
  !handwritten.response.issues.some(
    (issue) =>
      issue.code === "PRICE_HANDWRITTEN" && issue.action === "fill_price",
  )
) {
  fail("Handwritten price must route to local price input.");
}
if (
  partial.response.status !== "retake_required" ||
  !partial.response.issues.some((issue) => issue.action === "retake_image")
) {
  fail("Partial board must require a retake.");
}
if (
  inconsistent.response.status !== "needs_user_input" ||
  !inconsistent.response.issues.some(
    (issue) =>
      issue.code === "TIER_SLOT_LOW_CONFIDENCE" &&
      issue.action === "correct_tier_slots",
  ) ||
  !inconsistent.response.issues.some(
    (issue) => issue.code === "TIER_SLOT_COUNT_INCONSISTENT",
  )
) {
  fail("Low-confidence inconsistent slots must route to local correction.");
}

const imageAssets = fs
  .readdirSync(path.join(root, "data/recognition-evaluation"))
  .filter((file) => /\.(png|jpe?g|webp|gif)$/i.test(file));
if (imageAssets.length !== 0) {
  fail("Synthetic structured baseline must not silently add image binaries.");
}

console.log(
  `V1-C baseline validation passed: ${manifest.cases.length} controlled cases, 27 tier labels and deterministic manual fallbacks; no real-world accuracy claim.`,
);
