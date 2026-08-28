import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = path.join(
  root,
  "data/board-layout/schema/board-layout.schema.json",
);
const registryPath = path.join(
  root,
  "data/board-layout/registry/saturated-component-registry.json",
);

const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const errors = [];

const expectedLetters = Array.from({ length: 26 }, (_, index) =>
  String.fromCharCode(65 + index),
);
const expectedTierLabels = [
  ...expectedLetters,
  ...Array.from({ length: 32 }, (_, index) => `SP${index + 1}`),
];
const expectedComponents = [
  "prize_tier",
  "board_title",
  "series_identity",
  "board_theme",
  "price",
  "ticket_total",
  "last_prize",
  "double_chance",
  "prize_media",
  "instruction",
  "shop_id",
  "product_id",
  "brand_mark",
  "qr_code",
  "legal_notice",
  "decorative_media",
  "unknown_block",
];
const expectedRegions = [
  "header",
  "identity",
  "prize_showcase",
  "tier_grid",
  "instruction",
  "footer",
  "floating",
  "unknown",
];

if (schema.$id !== "https://ichi.example/schema/board-layout/1.0.0") {
  errors.push("schema $id must identify board-layout 1.0.0");
}
if (schema.properties?.schemaVersion?.const !== registry.schemaVersion) {
  errors.push("schema and registry versions differ");
}
if (
  JSON.stringify(registry.tierLabels) !== JSON.stringify(expectedTierLabels)
) {
  errors.push(
    "tierLabels must contain A through Z and SP1 through SP32 exactly once in order",
  );
}

const componentTypes = registry.components.map((component) => component.type);
if (new Set(componentTypes).size !== componentTypes.length) {
  errors.push("component type values must be unique");
}
for (const type of expectedComponents) {
  if (!componentTypes.includes(type))
    errors.push(`missing component type: ${type}`);
}
if (
  registry.components.filter((component) => component.type === "prize_tier")
    .length !== 1
) {
  errors.push("A-Z must share exactly one generic prize_tier component");
}
if (
  registry.components.find((component) => component.type === "prize_tier")
    ?.ticketCountRole !== "sum_tier_slots"
) {
  errors.push("prize_tier must derive counts from tier slots");
}

for (const component of registry.components) {
  if (component.dataOnly !== true)
    errors.push(`${component.type} must be data-only`);
  if (
    component.type !== "prize_tier" &&
    component.type !== "ticket_total" &&
    component.ticketCountRole !== "excluded"
  ) {
    errors.push(`${component.type} must be excluded from ticket totals`);
  }
}

const unknownBlock = registry.components.find(
  (component) => component.type === "unknown_block",
);
if (!unknownBlock || unknownBlock.executable !== false) {
  errors.push("unknown_block must exist and be non-executable");
}
for (const region of expectedRegions) {
  if (!registry.layoutRegions.includes(region))
    errors.push(`missing layout region: ${region}`);
}

const totalRule = registry.derivationRules.find(
  (rule) => rule.field === "totalTickets",
);
const requiredGuards = [
  "frame_complete",
  "all_regular_tiers_detected",
  "one_slot_one_ticket_confirmed",
  "all_tier_slot_counts_consistent",
];
for (const guard of requiredGuards) {
  if (!totalRule?.requiredGuards.includes(guard)) {
    errors.push(`totalTickets missing guard: ${guard}`);
  }
}
for (const type of ["last_prize", "double_chance", "unknown_block"]) {
  if (!totalRule?.excludedComponentTypes.includes(type)) {
    errors.push(`totalTickets must exclude ${type}`);
  }
}

for (const field of ["price", "tierSlotCounts", "totalTickets"]) {
  if (!registry.manualFallbacks.some((fallback) => fallback.field === field)) {
    errors.push(`missing manual fallback for ${field}`);
  }
}
if (Object.values(registry.security).some((value) => value !== false)) {
  errors.push(
    "all remote/executable component security flags must remain false",
  );
}

const schemaTierLabels = schema.$defs?.tier?.properties?.label?.enum ?? [];
if (
  JSON.stringify(schemaTierLabels) !==
  JSON.stringify([...expectedTierLabels, "OTHER"])
) {
  errors.push("schema tier label enum must match A-Z, SP1-SP32 and OTHER");
}
const schemaBlockTypes =
  schema.$defs?.block?.properties?.componentType?.enum ?? [];
for (const type of expectedComponents.filter((type) => type !== "prize_tier")) {
  if (!schemaBlockTypes.includes(type))
    errors.push(`schema block enum missing ${type}`);
}
for (const field of [
  "schemaVersion",
  "draftId",
  "image",
  "completeness",
  "price",
  "tiers",
  "blocks",
  "readingOrder",
  "derived",
]) {
  if (!schema.required?.includes(field))
    errors.push(`schema root missing required field: ${field}`);
}

if (errors.length > 0) {
  console.error(
    `Board layout validation failed with ${errors.length} error(s):`,
  );
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Board layout validation passed: ${registry.tierLabels.length} tier labels, ${registry.components.length} component types, ${registry.layoutRegions.length} layout regions, ${registry.derivationRules.length} guarded derivations.`,
);
