import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const deployDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(deployDir, "..");
const manifest = JSON.parse(
  await readFile(path.join(deployDir, "manifest.json"), "utf8"),
);
const resources = JSON.parse(
  await readFile(path.join(root, "database", "resources.json"), "utf8"),
);
const cloudbaseConfig = JSON.parse(
  await readFile(path.resolve(root, "../../cloudbaserc.json"), "utf8"),
);
const prizeTicketFunctionConfig = cloudbaseConfig.functions?.find(
  ({ name }) => name === "recognize-draw-tickets",
);
if (
  prizeTicketFunctionConfig?.envVariables
    ?.PRIZE_TICKET_LOCATION_RADIUS_METERS !== "200"
)
  throw new Error(
    "recognize-draw-tickets must declare the approved 200m production radius",
  );
if (
  !Array.isArray(manifest.requiredConfiguration) ||
  !manifest.requiredConfiguration.includes(
    "PRIZE_TICKET_LOCATION_RADIUS_METERS",
  )
) {
  throw new Error(
    "Prize-ticket location radius must be declared as required configuration",
  );
}
if (manifest.environmentId !== resources.environmentId)
  throw new Error("CloudBase environment mismatch");
if (
  manifest.dependencyLayer?.name !==
    "ichi-node-deps_cloud1-d7gxqfwv783a1f131" ||
  manifest.dependencyLayer?.version !== 1
)
  throw new Error("CloudBase dependency layer manifest is invalid");
if (
  resources.publicCollections.length !== 0 ||
  resources.storageBusinessPrefixes.length !== 0
)
  throw new Error(
    "V1 must not expose public collections or business image storage",
  );
const temporaryStorage = resources.storageTemporaryPrefixes;
if (
  !Array.isArray(temporaryStorage) ||
  temporaryStorage.length !== 1 ||
  temporaryStorage[0].prefix !== "recognition-temp/" ||
  temporaryStorage[0].publicRead !== false ||
  temporaryStorage[0].persistReference !== false ||
  temporaryStorage[0].deleteOnCompletion !== true ||
  temporaryStorage[0].lifecycleMaxAgeHours !== 24 ||
  temporaryStorage[0].maxObjectBytes !== 20 * 1024 * 1024
) {
  throw new Error("V1 recognition temporary storage policy is invalid");
}
const profileAvatarStorage = resources.storagePrivatePrefixes;
if (
  !Array.isArray(profileAvatarStorage) ||
  profileAvatarStorage.length !== 1 ||
  profileAvatarStorage[0].prefix !== "profile-avatars/" ||
  profileAvatarStorage[0].publicRead !== false ||
  profileAvatarStorage[0].persistReference !== true ||
  profileAvatarStorage[0].deleteOnCompletion !== false ||
  profileAvatarStorage[0].maxObjectBytes !== 2 * 1024 * 1024
) {
  throw new Error("V1 profile avatar storage policy is invalid");
}
const storageSecurityRule = resources.storageSecurityRule;
if (
  storageSecurityRule?.targetCustomRule?.read !==
    "auth != null && /^profile-avatars\\//.test(resource.path) && resource.openid == auth.openid" ||
  storageSecurityRule?.targetCustomRule?.write !==
    "auth != null && auth.loginType != 'ANONYMOUS' && resource.openid == auth.openid && (/^profile-avatars\\//.test(resource.path) || /^recognition-temp\\//.test(resource.path))"
) {
  throw new Error("V1 recognition storage custom-rule target is invalid");
}
if (
  storageSecurityRule?.deployment?.state !== "DEPLOYED_READ_BACK_VERIFIED" ||
  storageSecurityRule?.deployment?.actualAcl !== "CUSTOM" ||
  storageSecurityRule?.deployment?.actualAclDescription !==
    "Custom security rules" ||
  storageSecurityRule?.deployment?.clientScope !== "MINIPROGRAM_OPENID_ONLY" ||
  storageSecurityRule?.deployment?.serverBypassVerified !== true
) {
  throw new Error("V1 recognition storage deployment fact is invalid");
}
if (
  resources.storageLifecycleEnforcement?.applicationCleanup !== "DEPLOYED" ||
  resources.storageLifecycleEnforcement?.platformLifecycleTargetHours !== 24 ||
  resources.storageLifecycleEnforcement?.platformLifecycleReadBack !==
    "VERIFIED" ||
  resources.storageLifecycleEnforcement?.mode !== "PLATFORM_LIFECYCLE" ||
  resources.storageLifecycleEnforcement?.ruleId !==
    "ichi-v1-recognition-temp-expire-24h" ||
  resources.storageLifecycleEnforcement?.prefix !== "recognition-temp/" ||
  resources.storageLifecycleEnforcement?.expirationDays !== 1 ||
  resources.storageLifecycleEnforcement?.profileAvatarsExcluded !== true ||
  resources.storageLifecycleEnforcement?.remainingGap !== null
) {
  throw new Error("V1 recognition storage lifecycle fact is invalid");
}
if (resources.permission !== "ADMINONLY")
  throw new Error("All V1 business collections must be admin-only");
if (
  new Set(resources.collections.map(({ name }) => name)).size !==
  resources.collections.length
)
  throw new Error("Duplicate collection names");
for (const fn of manifest.functions) {
  await access(path.join(root, ".deploy", "functions", fn, "index.js"));
  await access(
    path.join(root, ".deploy", "functions", fn, "shared", "runtime.js"),
  );
}
for (const fn of manifest.existingFunctions ?? []) {
  const functionRoot = path.join(root, ".deploy", "functions", fn);
  await access(path.join(functionRoot, "index.js"));
  const promptName =
    fn === "recognize-draw-tickets"
      ? "prize-ticket-verification-v2.txt"
      : "ichi-board-vlm-r1-visible-evidence-1.1.0.txt";
  const schemaName =
    fn === "recognize-draw-tickets"
      ? "prize-ticket-verification-provider-v2.schema.json"
      : "board-provider-r1-visible-evidence-1.1.0.schema.json";
  await access(
    path.join(functionRoot, "recognition-contract", "prompt", promptName),
  );
  await access(
    path.join(functionRoot, "recognition-contract", "schema", schemaName),
  );
  if (fn === "recognize-board") {
    await access(
      path.join(
        functionRoot,
        "recognition-contract",
        "prompt",
        "ichi-board-vlm-r2-direct-remaining-1.0.0.txt",
      ),
    );
    await access(
      path.join(
        functionRoot,
        "recognition-contract",
        "schema",
        "board-provider-r2-direct-remaining-1.0.0.schema.json",
      ),
    );
    await access(
      path.join(
        functionRoot,
        "recognition-contract",
        "prompt",
        "ichi-board-vlm-hybrid-semantic-1.0.0.txt",
      ),
    );
    await access(
      path.join(
        functionRoot,
        "recognition-contract",
        "schema",
        "board-provider-hybrid-semantic-1.0.0.schema.json",
      ),
    );
  }
  const packageJson = JSON.parse(
    await readFile(path.join(functionRoot, "package.json"), "utf8"),
  );
  if (Object.keys(packageJson.dependencies || {}).length !== 0) {
    throw new Error(
      `${fn} must load runtime dependencies from the declared layer`,
    );
  }
  if (
    packageJson.cloudbaseDependencyLayer?.name !==
      manifest.dependencyLayer.name ||
    packageJson.cloudbaseDependencyLayer?.version !==
      manifest.dependencyLayer.version
  ) {
    throw new Error(
      `${fn} is not pinned to the declared CloudBase dependency layer`,
    );
  }
}
for (const [fn, expectedPermissions] of Object.entries(
  manifest.openApiPermissions || {},
)) {
  if (
    ![...manifest.functions, ...(manifest.existingFunctions ?? [])].includes(fn)
  )
    throw new Error(`OpenAPI permission references unknown function ${fn}`);
  const functionConfig = JSON.parse(
    await readFile(
      path.join(root, ".deploy", "functions", fn, "config.json"),
      "utf8",
    ),
  );
  if (
    JSON.stringify(functionConfig.permissions?.openapi || []) !==
    JSON.stringify(expectedPermissions)
  )
    throw new Error(`${fn} OpenAPI permissions do not match the manifest`);
}
console.log(
  `Validated ${resources.collections.length} private collections and ${manifest.functions.length + (manifest.existingFunctions ?? []).length} deployable functions.`,
);
console.log(
  "Storage CUSTOM owner rule and recognition-temp 1-day lifecycle are deployed and read-back verified.",
);
