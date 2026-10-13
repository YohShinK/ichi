import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const SHARING_CONTRACT = "UPLOAD_CONFIRMATION_MAP_SHARING_V2";
export const SHARING_CONTRACT_PATH =
  "docs/decisions/map-upload-sharing-contract.md";
export const V2_ADMISSION_PROMISE =
  "V2已准入数据自动生成Marker，不设二次审核或授权";
export const V1_ACCOUNT_CONSENT_PROMISE =
  "当前条例覆盖本人此前及以后已上传V1记录";
const backendRequirements = new Map([
  [
    "packages/v2-map/resources/production/phase2/runtime.mjs",
    [
      "admitSourceAtomically",
      "admissionStaging: false",
      'work.kind === "CONSENT_EVENT"',
    ],
  ],
  [
    "packages/v2-map/resources/production/phase2/admission.mjs",
    [
      "V2_ADMISSION_AUTO_MAP_V1",
      "preview.originals",
      "preview.writes",
      "db.runTransaction",
    ],
  ],
  [
    "packages/v2-map/resources/production/shared/runtime.mjs",
    ["await registerConsentSourceWake"],
  ],
  [
    "services/cloudbase/shared/upload-sharing-authorization.js",
    ["await enqueueUploadIntent"],
  ],
  [
    "packages/v2-map/resources/production/phase2/source.mjs",
    ["uploadedV1ConsentAccepted", "UPLOADED_V1_AND_EXPLICIT_ACCOUNT_CONSENT"],
  ],
]);
const currentSources = [
  "AGENTS.md",
  "README.md",
  "PRD.md",
  ...[
    "architecture",
    "design-document",
    "tech-stack",
    "implementation-plan",
    "progress",
  ].map((name) => `memory-bank/${name}.md`),
];
const obsolete = [
  "地图分享选择",
  "我确认有权分享，并分享至地图",
  "map-source-choice",
  "onOpenMapSourceChoice",
  "onChooseMapSourceShare",
  "onChooseMapSourcePrivate",
  "getSourceChoice(",
  "setInitialChoice(",
  "manage-map-player-source",
  "SET_INITIAL_CHOICE",
  "同意本条例本身，不代表你历史上的所有上传记录都会自动公开",
];
const runtimeClient = (file) =>
  file.startsWith("apps/client/miniprogram/") &&
  /\.(?:ts|js|wxml|wxss)$/u.test(file) &&
  !/\.(?:test|spec)\.[^.]+$/u.test(file);

export function auditUploadSharingFlow(files) {
  const errors = [];
  for (const file of currentSources) {
    const text = files.get(file) ?? "";
    const preamble = text.split(/^## /mu)[0];
    if (
      !preamble.includes(SHARING_CONTRACT) ||
      !preamble.includes(SHARING_CONTRACT_PATH) ||
      !preamble.includes(V2_ADMISSION_PROMISE) ||
      !preamble.includes(V1_ACCOUNT_CONSENT_PROMISE)
    )
      errors.push(`${file}: current entry must reference ${SHARING_CONTRACT}`);
  }
  if (!(files.get(SHARING_CONTRACT_PATH) ?? "").includes(SHARING_CONTRACT))
    errors.push("Current upload-sharing contract is missing");
  for (const [file, text] of files) {
    if (!runtimeClient(file)) continue;
    for (const token of obsolete)
      if (text.includes(token))
        errors.push(`${file}: obsolete map-sharing UI/API ${token}`);
  }
  for (const [file, tokens] of backendRequirements)
    if (
      files.has(file) &&
      tokens.some((token) => !files.get(file).includes(token))
    )
      errors.push(
        `${file}: missing atomic V2 admission or durable original-intent wake`,
      );
  return errors;
}

export function validateUploadSharingFlow(root = process.cwd()) {
  const files = new Map();
  for (const file of [
    ...currentSources,
    SHARING_CONTRACT_PATH,
    ...backendRequirements.keys(),
  ])
    if (fs.existsSync(path.join(root, file)))
      files.set(file, fs.readFileSync(path.join(root, file), "utf8"));
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else {
        const relative = path
          .relative(root, absolute)
          .replaceAll(path.sep, "/");
        if (runtimeClient(relative))
          files.set(relative, fs.readFileSync(absolute, "utf8"));
      }
    }
  };
  visit(path.join(root, "apps/client/miniprogram"));
  return auditUploadSharingFlow(files);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const errors = validateUploadSharingFlow();
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else
    console.log(
      `Upload-sharing contract validation passed (${SHARING_CONTRACT}).`,
    );
}
