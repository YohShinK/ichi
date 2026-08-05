import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contractRoot = path.join(root, "data/recognition-contract");
const contractSchema = readJson(
  path.join(contractRoot, "schema/recognition-contract.schema.json"),
);
const boardSchema = readJson(
  path.join(root, "data/board-layout/schema/board-layout.schema.json"),
);
const registry = readJson(
  path.join(contractRoot, "registry/issue-actions.json"),
);
const fixtureDir = path.join(contractRoot, "fixtures");
const fixtureNames = fs
  .readdirSync(fixtureDir)
  .filter((name) => name.endsWith(".json"))
  .sort();
const fixtures = fixtureNames.map((name) => ({
  name,
  value: readJson(path.join(fixtureDir, name)),
}));
const errors = [];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function addError(fixtureName, message) {
  errors.push(`${fixtureName}: ${message}`);
}

function sameMembers(left, right) {
  return (
    left.length === right.length &&
    [...left].sort().every((value, index) => value === [...right].sort()[index])
  );
}

const expectedFixtures = [
  "complete-board.json",
  "handwritten-price.json",
  "inconsistent-slots.json",
  "partial-board.json",
];
if (JSON.stringify(fixtureNames) !== JSON.stringify(expectedFixtures)) {
  errors.push(`fixtures must be exactly: ${expectedFixtures.join(", ")}`);
}
if (
  contractSchema.$id !==
  "https://ichi.example/schema/recognition-contract/1.0.0"
) {
  errors.push("recognition contract schema id must be version 1.0.0");
}
if (boardSchema.$id !== "https://ichi.example/schema/board-layout/1.0.0") {
  errors.push("board layout schema id must be version 1.0.0");
}
if (
  registry.contractVersion !== contractSchema.properties?.contractVersion?.const
) {
  errors.push("issue registry and recognition contract versions differ");
}
if (
  contractSchema.$defs?.response?.properties?.draft?.$ref !== boardSchema.$id
) {
  errors.push(
    "recognition response must reference the versioned board layout schema id",
  );
}

const registryCodes = registry.issues.map((issue) => issue.code);
const registryActions = registry.actions;
const schemaCodes = contractSchema.$defs?.issue?.properties?.code?.enum ?? [];
const schemaActions =
  contractSchema.$defs?.issue?.properties?.action?.enum ?? [];
if (!sameMembers(registryCodes, schemaCodes)) {
  errors.push("issue code registry and schema enum differ");
}
if (!sameMembers(registryActions, schemaActions)) {
  errors.push("action registry and schema enum differ");
}
if (new Set(registryCodes).size !== registryCodes.length) {
  errors.push("issue codes must be unique");
}
if (new Set(registryActions).size !== registryActions.length) {
  errors.push("actions must be unique");
}

const issueDefinitions = new Map(
  registry.issues.map((issue) => [issue.code, issue]),
);

for (const { name, value: exchange } of fixtures) {
  const request = exchange.request;
  const response = exchange.response;
  if (exchange.contractVersion !== registry.contractVersion) {
    addError(name, "contractVersion differs from registry");
  }
  if (!request || !response) {
    addError(name, "request and response are required");
    continue;
  }
  if (request.requestId !== response.requestId) {
    addError(name, "request and response ids differ");
  }
  if (!request.imageRef?.startsWith("ephemeral:")) {
    addError(name, "imageRef must be an ephemeral reference");
  }
  if (!Array.isArray(request.localeHints) || request.localeHints.length === 0) {
    addError(name, "at least one locale hint is required");
  }
  if (
    response.imageHandling?.retention !== "ephemeral" ||
    response.imageHandling?.published !== false ||
    response.imageHandling?.storedInSessionHistory !== false
  ) {
    addError(
      name,
      "image must remain ephemeral, unpublished and outside session history",
    );
  }

  const issues = response.issues ?? [];
  for (const issue of issues) {
    const definition = issueDefinitions.get(issue.code);
    if (!definition) {
      addError(name, `unknown issue code ${issue.code}`);
      continue;
    }
    if (issue.action !== definition.defaultAction) {
      addError(
        name,
        `${issue.code} must use action ${definition.defaultAction}`,
      );
    }
    if (issue.blocking !== definition.blocking) {
      addError(name, `${issue.code} blocking flag differs from registry`);
    }
    if (!issue.path?.startsWith("/")) {
      addError(name, `${issue.code} must target an absolute data path`);
    }
    if (
      issue.confidence !== undefined &&
      (issue.confidence < 0 || issue.confidence > 1)
    ) {
      addError(name, `${issue.code} confidence is outside 0..1`);
    }
  }

  const blockingIssues = issues.filter((issue) => issue.blocking);
  if (
    response.status === "ready_for_confirmation" &&
    blockingIssues.length > 0
  ) {
    addError(name, "ready_for_confirmation cannot contain blocking issues");
  }
  if (response.status === "needs_user_input" && blockingIssues.length === 0) {
    addError(name, "needs_user_input requires a blocking issue");
  }
  if (
    response.status === "retake_required" &&
    !blockingIssues.some((issue) => issue.action === "retake_image")
  ) {
    addError(name, "retake_required requires a blocking retake_image action");
  }
  if (
    ["ready_for_confirmation", "needs_user_input", "retake_required"].includes(
      response.status,
    ) &&
    !response.draft
  ) {
    addError(name, `${response.status} must preserve a structured draft`);
    continue;
  }
  if (!response.draft) continue;

  const draft = response.draft;
  if (draft.schemaVersion !== boardSchema.properties?.schemaVersion?.const) {
    addError(name, "draft schema version differs from board layout schema");
  }
  if (
    request.image.width !== draft.image?.width ||
    request.image.height !== draft.image?.height
  ) {
    addError(name, "request and draft image dimensions differ");
  }
  if (draft.image?.storedRemotely !== false) {
    addError(name, "draft must not claim persistent remote image storage");
  }
  if (!Array.isArray(draft.tiers) || draft.tiers.length === 0) {
    addError(name, "draft must contain at least one detected tier");
    continue;
  }

  const components = [...draft.tiers, ...(draft.blocks ?? [])];
  const componentIds = components.map((component) => component.componentId);
  if (new Set(componentIds).size !== componentIds.length) {
    addError(name, "component ids must be unique");
  }
  if (!sameMembers(componentIds, draft.readingOrder ?? [])) {
    addError(name, "readingOrder must reference every component exactly once");
  }
  for (const component of components) {
    const index = draft.readingOrder.indexOf(component.componentId);
    if (component.layout?.readingOrder !== index) {
      addError(
        name,
        `${component.componentId} layout reading order does not match root order`,
      );
    }
    const box = component.layout?.boundingBox;
    if (
      !box ||
      [box.x, box.y, box.width, box.height].some(
        (value) => typeof value !== "number" || value < 0 || value > 1,
      ) ||
      box.width === 0 ||
      box.height === 0 ||
      box.x + box.width > 1.000001 ||
      box.y + box.height > 1.000001
    ) {
      addError(
        name,
        `${component.componentId} has an invalid normalized bounding box`,
      );
    }
  }

  for (const block of draft.blocks ?? []) {
    const expectedRole =
      block.componentType === "ticket_total" ? "derived_output" : "excluded";
    if (block.ticketCountRole !== expectedRole) {
      addError(name, `${block.componentId} has invalid ticket count role`);
    }
    if (block.executable !== false) {
      addError(name, `${block.componentId} must be explicitly non-executable`);
    }
  }

  const inconsistentTierIndexes = [];
  let totalSlots = 0;
  let remainingSlots = 0;
  let unknownSlots = 0;
  draft.tiers.forEach((tier, index) => {
    const slots = tier.slotObservation;
    totalSlots += slots.totalSlots;
    remainingSlots += slots.openSlots;
    unknownSlots += slots.unknownSlots;
    if (
      slots.openSlots + slots.coveredSlots + slots.unknownSlots !==
      slots.totalSlots
    ) {
      inconsistentTierIndexes.push(index);
    }
    if (
      slots.confidence < 0.5 &&
      !issues.some(
        (issue) =>
          issue.code === "TIER_SLOT_LOW_CONFIDENCE" &&
          issue.path === `/draft/tiers/${index}/slotObservation`,
      )
    ) {
      addError(
        name,
        `tier ${index} low slot confidence lacks a targeted issue`,
      );
    }
    if (
      tier.label === "OTHER" &&
      !issues.some(
        (issue) =>
          issue.code === "TIER_LABEL_OTHER" &&
          issue.path === `/draft/tiers/${index}`,
      )
    ) {
      addError(
        name,
        `tier ${index} OTHER label lacks a targeted confirmation issue`,
      );
    }
  });

  for (const index of inconsistentTierIndexes) {
    if (
      !issues.some(
        (issue) =>
          issue.code === "TIER_SLOT_COUNT_INCONSISTENT" &&
          issue.path === `/draft/tiers/${index}/slotObservation`,
      )
    ) {
      addError(name, `tier ${index} inconsistent counts lack a targeted issue`);
    }
  }

  const totalGuardsPass =
    draft.completeness.frame === "complete" &&
    draft.completeness.allRegularTiersDetected === true &&
    draft.completeness.oneSlotOneTicketConfirmed === true &&
    inconsistentTierIndexes.length === 0;
  const totalResult = draft.derived?.totalTickets;
  const remainingResult = draft.derived?.remainingTickets;
  if (totalResult?.status === "auto_confirmed") {
    if (!totalGuardsPass)
      addError(name, "totalTickets auto-confirmed while a guard fails");
    if (totalResult.value !== totalSlots) {
      addError(name, `totalTickets must equal tier slot sum ${totalSlots}`);
    }
  } else if (totalGuardsPass && totalResult?.status !== "manual_confirmed") {
    addError(
      name,
      "passing total guards must auto-confirm unless the user already confirmed",
    );
  }

  const remainingGuardsPass =
    ["auto_confirmed", "manual_confirmed"].includes(totalResult?.status) &&
    unknownSlots === 0 &&
    inconsistentTierIndexes.length === 0;
  if (remainingResult?.status === "auto_confirmed") {
    if (!remainingGuardsPass) {
      addError(name, "remainingTickets auto-confirmed while a guard fails");
    }
    if (remainingResult.value !== remainingSlots) {
      addError(
        name,
        `remainingTickets must equal open slot sum ${remainingSlots}`,
      );
    }
  } else if (
    remainingGuardsPass &&
    remainingResult?.status !== "manual_confirmed"
  ) {
    addError(
      name,
      "passing remaining guards must auto-confirm unless user already confirmed",
    );
  }

  if (
    totalResult?.status === "manual_required" &&
    !issues.some((issue) => issue.code === "TOTAL_TICKETS_DERIVATION_BLOCKED")
  ) {
    addError(name, "manual totalTickets requires a derivation-blocked issue");
  }
  if (
    remainingResult?.status === "manual_required" &&
    !issues.some(
      (issue) => issue.code === "REMAINING_TICKETS_DERIVATION_BLOCKED",
    )
  ) {
    addError(
      name,
      "manual remainingTickets requires a derivation-blocked issue",
    );
  }
  if (
    draft.price?.status === "manual_required" &&
    !issues.some((issue) =>
      ["PRICE_MISSING", "PRICE_LOW_CONFIDENCE", "PRICE_HANDWRITTEN"].includes(
        issue.code,
      ),
    )
  ) {
    addError(name, "manual price requires a targeted price issue");
  }
  if (
    response.status === "ready_for_confirmation" &&
    (!totalGuardsPass ||
      totalResult?.status !== "auto_confirmed" ||
      remainingResult?.status !== "auto_confirmed" ||
      draft.price?.status === "manual_required")
  ) {
    addError(name, "ready_for_confirmation draft is not fully derivable");
  }
}

const complete = fixtures.find(
  (fixture) => fixture.name === "complete-board.json",
)?.value;
const partial = fixtures.find(
  (fixture) => fixture.name === "partial-board.json",
)?.value;
const handwritten = fixtures.find(
  (fixture) => fixture.name === "handwritten-price.json",
)?.value;
const inconsistent = fixtures.find(
  (fixture) => fixture.name === "inconsistent-slots.json",
)?.value;
if (complete?.response.status !== "ready_for_confirmation") {
  errors.push("complete-board.json must be ready_for_confirmation");
}
if (partial?.response.status !== "retake_required") {
  errors.push("partial-board.json must require a retake");
}
if (handwritten?.response.status !== "needs_user_input") {
  errors.push("handwritten-price.json must require user input");
}
if (inconsistent?.response.status !== "needs_user_input") {
  errors.push("inconsistent-slots.json must require user input");
}

if (errors.length > 0) {
  console.error(
    `Recognition contract validation failed with ${errors.length} error(s):`,
  );
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Recognition contract validation passed: ${fixtures.length} fixtures, ${registryCodes.length} issue codes, ${registryActions.length} user actions; complete, partial, handwritten-price and inconsistent-slot routes are deterministic.`,
);
