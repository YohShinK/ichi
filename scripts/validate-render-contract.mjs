import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const renderRoot = path.join(root, "data/render-contract");
const recognitionRoot = path.join(root, "data/recognition-contract");
const policy = readJson(path.join(renderRoot, "registry/render-policy.json"));
const renderSchema = readJson(
  path.join(renderRoot, "schema/render-plan.schema.json"),
);
const componentRegistry = readJson(
  path.join(
    root,
    "data/board-layout/registry/saturated-component-registry.json",
  ),
);
const issueRegistry = readJson(
  path.join(recognitionRoot, "registry/issue-actions.json"),
);
const cases = [
  {
    name: "complete",
    exchange: readJson(
      path.join(recognitionRoot, "fixtures/complete-board.json"),
    ),
    plan: readJson(path.join(renderRoot, "fixtures/complete-render-plan.json")),
  },
  {
    name: "partial",
    exchange: readJson(
      path.join(recognitionRoot, "fixtures/partial-board.json"),
    ),
    plan: readJson(path.join(renderRoot, "fixtures/partial-retake-plan.json")),
  },
];
const errors = [];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function addError(scope, message) {
  errors.push(`${scope}: ${message}`);
}

function sameMembers(left, right) {
  const a = [...left].sort();
  const b = [...right].sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function resolvePointer(value, pointer) {
  if (pointer === "") return value;
  if (!pointer.startsWith("/")) return undefined;
  return pointer
    .slice(1)
    .split("/")
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce((current, part) => current?.[part], value);
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function verticalOverlapRatio(left, right) {
  const top = Math.max(left.y, right.y);
  const bottom = Math.min(left.y + left.height, right.y + right.height);
  const overlap = Math.max(0, bottom - top);
  return overlap / Math.min(left.height, right.height);
}

function resolveLocalRenderer(componentType) {
  const renderer = policy.componentMapping[componentType];
  if (!renderer)
    throw new Error(`unregistered component type: ${componentType}`);
  return renderer;
}

function isDataOnlyRecognitionComponent(component) {
  const shared = [
    "componentId",
    "componentType",
    "origin",
    "confidence",
    "layout",
  ];
  const allowed =
    component.componentType === "prize_tier"
      ? [...shared, "label", "rawLabel", "prizeName", "slotObservation"]
      : [...shared, "ticketCountRole", "rawText", "executable"];
  return Object.keys(component).every((key) => allowed.includes(key));
}

if (renderSchema.$id !== "https://ichi.example/schema/render-plan/1.0.0") {
  errors.push("render schema id must be version 1.0.0");
}
if (
  renderSchema.properties?.renderPlanVersion?.const !== policy.renderPlanVersion
) {
  errors.push("render schema and policy versions differ");
}
if (policy.localComponentRegistryId !== componentRegistry.registryId) {
  errors.push("render policy points at the wrong local component registry");
}

const expectedMapping = Object.fromEntries(
  componentRegistry.components.map((component) => [
    component.type,
    component.renderer,
  ]),
);
if (!sameJson(policy.componentMapping, expectedMapping)) {
  errors.push(
    "render policy mapping must exactly match the local component registry",
  );
}
const schemaComponentTypes = renderSchema.$defs?.componentType?.enum ?? [];
if (!sameMembers(schemaComponentTypes, Object.keys(policy.componentMapping))) {
  errors.push("render schema component types differ from the local mapping");
}
const schemaRenderers = renderSchema.$defs?.renderer?.enum ?? [];
if (
  !sameMembers(schemaRenderers, new Set(Object.values(policy.componentMapping)))
) {
  errors.push("render schema renderers differ from the local mapping");
}

const expectedStatuses = [
  "ready_for_confirmation",
  "needs_user_input",
  "retake_required",
  "service_error",
];
if (!sameMembers(Object.keys(policy.responseModes), expectedStatuses)) {
  errors.push("every recognition response status must have one render mode");
}
const expectedRenderStates = [
  "board_confirmation",
  "needs_user_input",
  "retake",
  "service_error",
];
if (
  !sameMembers(
    Object.values(policy.responseModes).map((mode) => mode.renderState),
    expectedRenderStates,
  )
) {
  errors.push("response modes must map to four stable render states");
}

const breakpoints = policy.breakpoints;
for (let index = 0; index < breakpoints.length; index += 1) {
  const breakpoint = breakpoints[index];
  if (breakpoint.maxColumns < 1 || breakpoint.maxColumns > 2) {
    errors.push(`${breakpoint.id} must allow one or two columns only`);
  }
  if (
    index > 0 &&
    breakpoint.minWidth !== breakpoints[index - 1].maxWidth + 1
  ) {
    errors.push(
      `${breakpoint.id} must start immediately after the previous breakpoint`,
    );
  }
}
if (breakpoints[0]?.id !== "compact" || breakpoints[0]?.maxColumns !== 1) {
  errors.push("compact breakpoint must be single-column");
}

if (
  policy.unknownHandling?.knownFallbackType !== "unknown_block" ||
  policy.unknownHandling?.knownFallbackRenderer !== "UnknownBlock" ||
  policy.unknownHandling?.knownFallbackExecutable !== false ||
  policy.unknownHandling?.unregisteredTypeAction !== "reject_entire_plan" ||
  policy.unknownHandling?.preservePreviousUsableState !== true
) {
  errors.push(
    "unknown handling must use a non-executable local fallback and reject new types",
  );
}
if (
  policy.security?.rendererLookup !== "local_registry_only" ||
  Object.entries(policy.security)
    .filter(([key]) => key !== "rendererLookup")
    .some(([, value]) => value !== false)
) {
  errors.push("render policy must reject all remote or executable input");
}
for (const renderer of Object.values(policy.componentMapping)) {
  if (!/^[A-Z][A-Za-z]+$/.test(renderer)) {
    errors.push(`renderer must be a local symbolic name: ${renderer}`);
  }
}

for (const { name, exchange, plan } of cases) {
  const response = exchange.response;
  const draft = response.draft;
  const mode = policy.responseModes[response.status];
  const scope = `${name} plan`;
  if (plan.renderPlanVersion !== policy.renderPlanVersion) {
    addError(scope, "render plan version differs from policy");
  }
  if (plan.localComponentRegistryId !== componentRegistry.registryId) {
    addError(scope, "local component registry id differs");
  }
  if (plan.sourceDraftId !== draft.draftId) {
    addError(scope, "source draft id differs");
  }
  if (plan.renderState !== mode.renderState) {
    addError(scope, `expected render state ${mode.renderState}`);
  }
  if (plan.sourceMap.enabled !== mode.sourceMap) {
    addError(scope, "sourceMap enabled state differs from response mode");
  }
  if (plan.mobileFlow.enabled !== mode.mobileFlow) {
    addError(scope, "mobileFlow enabled state differs from response mode");
  }
  if (plan.sourceMap.readOnly !== true) {
    addError(scope, "sourceMap must always be read-only");
  }
  const expectedAspectRatio = draft.image.width / draft.image.height;
  if (Math.abs(plan.sourceMap.aspectRatio - expectedAspectRatio) > 0.000001) {
    addError(scope, `sourceMap aspect ratio must equal ${expectedAspectRatio}`);
  }

  const sourceComponents = [...draft.tiers, ...draft.blocks];
  const sourceById = new Map(
    sourceComponents.map((component) => [component.componentId, component]),
  );
  const instanceIds = plan.instances.map((instance) => instance.instanceId);
  if (!sameMembers(instanceIds, draft.readingOrder)) {
    addError(
      scope,
      "instances must cover every recognized component exactly once",
    );
  }
  if (!sameJson(plan.sourceMap.itemIds, draft.readingOrder)) {
    addError(scope, "sourceMap order must follow draft.readingOrder");
  }
  if (!sameJson(plan.mobileFlow.accessibilityOrder, draft.readingOrder)) {
    addError(scope, "accessibility order must follow draft.readingOrder");
  }

  for (const instance of plan.instances) {
    const source = sourceById.get(instance.instanceId);
    if (!source) {
      addError(
        scope,
        `${instance.instanceId} has no recognized source component`,
      );
      continue;
    }
    if (instance.componentType !== source.componentType) {
      addError(
        scope,
        `${instance.instanceId} component type changed during planning`,
      );
    }
    if (instance.renderer !== resolveLocalRenderer(source.componentType)) {
      addError(
        scope,
        `${instance.instanceId} did not use the registered local renderer`,
      );
    }
    if (!sameJson(instance.sourceLayout, source.layout)) {
      addError(
        scope,
        `${instance.instanceId} did not preserve its source layout`,
      );
    }
    if (!sameJson(resolvePointer(draft, instance.layoutPath), source.layout)) {
      addError(
        scope,
        `${instance.instanceId} layoutPath does not resolve to source layout`,
      );
    }
    if (resolvePointer(draft, instance.dataPath) === undefined) {
      addError(scope, `${instance.instanceId} dataPath does not resolve`);
    }
    const expectedRole =
      source.componentType === "prize_tier"
        ? "sum_tier_slots"
        : source.componentType === "ticket_total"
          ? "derived_output"
          : "excluded";
    if (instance.ticketCountRole !== expectedRole) {
      addError(
        scope,
        `${instance.instanceId} ticket count role changed during planning`,
      );
    }
    if (!mode.interactiveFields && instance.interactive !== false) {
      addError(
        scope,
        `${instance.instanceId} must be read-only in ${response.status}`,
      );
    }
  }

  if (plan.mobileFlow.enabled) {
    const flattened = plan.mobileFlow.groups.flatMap((group) => group.itemIds);
    if (!sameJson(flattened, draft.readingOrder)) {
      addError(
        scope,
        "mobile groups must preserve accessibility order exactly",
      );
    }
    for (const group of plan.mobileFlow.groups) {
      if (group.columns.compact !== 1) {
        addError(scope, `${group.groupId} must collapse to one compact column`);
      }
      if (group.columns.phone > 2 || group.columns.wide_phone > 2) {
        addError(scope, `${group.groupId} exceeds the two-column phone limit`);
      }
      if (group.itemIds.length > 1) {
        const boxes = group.itemIds.map(
          (id) => sourceById.get(id).layout.boundingBox,
        );
        for (let index = 1; index < boxes.length; index += 1) {
          if (verticalOverlapRatio(boxes[0], boxes[index]) < 0.5) {
            addError(
              scope,
              `${group.groupId} combines items from different source rows`,
            );
          }
        }
      }
      if (
        group.itemIds.some((id) =>
          policy.ordering.fullWidthComponentTypes.includes(
            sourceById.get(id).componentType,
          ),
        ) &&
        (group.columns.phone !== 1 || group.columns.wide_phone !== 1)
      ) {
        addError(
          scope,
          `${group.groupId} contains a full-width component in multiple columns`,
        );
      }
    }
  } else if (plan.mobileFlow.groups.length > 0) {
    addError(scope, "disabled mobileFlow cannot contain groups");
  }

  const sourceIssues = response.issues.map(
    ({ code, path, blocking, action }) => ({
      code,
      path,
      blocking,
      action,
    }),
  );
  const planIssues = plan.issues.map(({ code, path, blocking, action }) => ({
    code,
    path,
    blocking,
    action,
  }));
  if (!sameJson(planIssues, sourceIssues)) {
    addError(
      scope,
      "render plan issues must preserve recognition issue semantics",
    );
  }
  for (const issue of plan.issues) {
    if (!issueRegistry.issues.some((entry) => entry.code === issue.code)) {
      addError(scope, `unknown issue code ${issue.code}`);
    }
    if (
      issue.targetInstanceId !== undefined &&
      issue.targetInstanceId !== null &&
      !instanceIds.includes(issue.targetInstanceId)
    ) {
      addError(scope, `${issue.code} targets a missing instance`);
    }
  }
  if (
    plan.security.rendererLookup !== "local_registry_only" ||
    plan.security.remoteCodeAccepted !== false ||
    plan.security.unknownExecutableAccepted !== false
  ) {
    addError(scope, "render plan weakens the policy security boundary");
  }
}

for (const label of componentRegistry.tierLabels) {
  if (resolveLocalRenderer("prize_tier") !== "PrizeTier") {
    errors.push(
      `${label} does not resolve through the generic PrizeTier renderer`,
    );
  }
}
if (resolveLocalRenderer("unknown_block") !== "UnknownBlock") {
  errors.push("known unknown_block must resolve to the local placeholder");
}
let rejectedUnknownType = false;
try {
  resolveLocalRenderer("remote_widget");
} catch {
  rejectedUnknownType = true;
}
if (!rejectedUnknownType) {
  errors.push("unregistered component type was not rejected");
}

const injectedTier = {
  ...cases[0].exchange.response.draft.tiers[0],
  renderer: "https://example.invalid/RemoteWidget",
  script: "remote-code",
};
if (isDataOnlyRecognitionComponent(injectedTier)) {
  errors.push(
    "recognition component accepted injected renderer or script fields",
  );
}

if (errors.length > 0) {
  console.error(
    `Render contract validation failed with ${errors.length} error(s):`,
  );
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Render contract validation passed: ${componentRegistry.tierLabels.length} tier labels, ${Object.keys(policy.componentMapping).length} local component mappings, ${policy.breakpoints.length} phone breakpoints, 2 fixed render plans; source layout, mobile order and remote-code rejection are deterministic.`,
);
