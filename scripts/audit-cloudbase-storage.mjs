import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const STORAGE_CLASSIFICATION = Object.freeze({
  ACTIVE_TEMP: "ACTIVE_TEMP",
  REFERENCED_LEGACY: "REFERENCED_LEGACY",
  EXPECTED_PROFILE_ASSET: "EXPECTED_PROFILE_ASSET",
  GOLDEN_DEV_ASSET: "GOLDEN_DEV_ASSET",
  ORPHAN_SAFE_TO_DELETE: "ORPHAN_SAFE_TO_DELETE",
  UNKNOWN_DO_NOT_DELETE: "UNKNOWN_DO_NOT_DELETE",
});

const ORPHAN_TTL_MS = 24 * 60 * 60 * 1000;
const ACTIVE_TEMP_STATUSES = new Set([
  "LOCATION_PENDING",
  "PHOTO_PENDING",
  "PROCESSING",
  "PROVIDER_FAILED",
  "PENDING",
]);

const storageKey = (value) => {
  if (typeof value !== "string") return null;
  for (const prefix of ["recognition-temp/", "profile-avatars/"]) {
    const index = value.indexOf(prefix);
    if (index >= 0) return value.slice(index);
  }
  return null;
};

export const classifyStorageObject = ({
  object,
  references = [],
  cleanupJobs = [],
  goldenSourceExists = false,
  now = Date.now(),
}) => {
  const key = object.key;
  const ageMs = Math.max(0, now - Date.parse(object.lastModified));
  const profileReference = references.some(
    (reference) => reference.collection === "profiles",
  );
  if (key.startsWith("profile-avatars/")) {
    if (profileReference) return STORAGE_CLASSIFICATION.EXPECTED_PROFILE_ASSET;
    return STORAGE_CLASSIFICATION.UNKNOWN_DO_NOT_DELETE;
  }
  if (!key.startsWith("recognition-temp/"))
    return STORAGE_CLASSIFICATION.UNKNOWN_DO_NOT_DELETE;
  if (/^recognition-temp\/golden-diagnostic-/u.test(key))
    return goldenSourceExists
      ? STORAGE_CLASSIFICATION.GOLDEN_DEV_ASSET
      : STORAGE_CLASSIFICATION.UNKNOWN_DO_NOT_DELETE;
  if (cleanupJobs.length) return STORAGE_CLASSIFICATION.ORPHAN_SAFE_TO_DELETE;
  if (references.length)
    return references.some((reference) =>
      ACTIVE_TEMP_STATUSES.has(reference.status),
    )
      ? STORAGE_CLASSIFICATION.ACTIVE_TEMP
      : STORAGE_CLASSIFICATION.REFERENCED_LEGACY;
  return ageMs >= ORPHAN_TTL_MS
    ? STORAGE_CLASSIFICATION.ORPHAN_SAFE_TO_DELETE
    : STORAGE_CLASSIFICATION.ACTIVE_TEMP;
};

const parseCliJson = (text) => {
  const starts = [text.indexOf("{"), text.indexOf("[")]
    .filter((value) => value >= 0)
    .sort((left, right) => left - right);
  for (const start of starts)
    for (let end = text.length; end > start; end -= 1) {
      if (!["}", "]"].includes(text[end - 1])) continue;
      try {
        return JSON.parse(text.slice(start, end));
      } catch {
        // CloudBase CLI may print progress before or after the JSON payload.
      }
    }
  throw new Error("CLOUDBASE_CLI_JSON_INVALID");
};

const parseArgs = (argv) => {
  const options = {
    json: false,
    goldenImages: "/Users/cunfu/Downloads",
    tcb: process.env.TCB_CLI || "tcb",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--json") options.json = true;
    else if (value === "--golden-images")
      options.goldenImages = path.resolve(argv[++index]);
    else if (value === "--tcb") options.tcb = path.resolve(argv[++index]);
    else throw new Error(`UNKNOWN_ARGUMENT:${value}`);
  }
  return options;
};

const queryCommand = (collection, filter, projection) => ({
  TableName: collection,
  CommandType: "QUERY",
  Command: JSON.stringify({
    find: collection,
    filter,
    projection,
    limit: 500,
  }),
});

export const auditCloudBaseStorage = ({
  cwd = process.cwd(),
  goldenImages,
  tcb,
  now = Date.now(),
}) => {
  const config = JSON.parse(
    fs.readFileSync(path.join(cwd, "cloudbaserc.json"), "utf8"),
  );
  const envId = config.envId;
  const runTcb = (...args) =>
    parseCliJson(
      execFileSync(tcb, ["-e", envId, ...args], {
        cwd,
        encoding: "utf8",
        maxBuffer: 20 * 1024 * 1024,
      }),
    );
  const objects = ["recognition-temp/", "profile-avatars/"].flatMap(
    (prefix) => runTcb("storage", "list", prefix, "--json").data || [],
  );
  const commands = [
    queryCommand(
      "profiles",
      { avatarFileId: { $exists: true } },
      { _id: 1, avatarFileId: 1, profileState: 1, updatedAt: 1 },
    ),
    queryCommand(
      "drawSubmissions",
      {
        $or: [
          { imageFileId: { $exists: true } },
          { originalEvidenceFileId: { $exists: true } },
        ],
      },
      {
        _id: 1,
        imageFileId: 1,
        originalEvidenceFileId: 1,
        status: 1,
        updatedAt: 1,
      },
    ),
    queryCommand(
      "observationCandidates",
      {
        $or: [
          { imageFileId: { $exists: true } },
          { originalEvidenceFileId: { $exists: true } },
          { boardImageFileID: { $exists: true } },
          { boardImageFileId: { $exists: true } },
        ],
      },
      {
        _id: 1,
        imageFileId: 1,
        originalEvidenceFileId: 1,
        boardImageFileID: 1,
        boardImageFileId: 1,
        status: 1,
        updatedAt: 1,
      },
    ),
    queryCommand(
      "recognitionJobs",
      { imageFileId: { $exists: true } },
      { _id: 1, imageFileId: 1, status: 1, updatedAt: 1 },
    ),
    queryCommand(
      "deletionJobs",
      { fileId: { $exists: true } },
      { _id: 1, fileId: 1, status: 1, reason: 1, updatedAt: 1 },
    ),
  ];
  const query = runTcb(
    "db",
    "nosql",
    "execute",
    "--json",
    "--command",
    JSON.stringify(commands),
  );
  const results = query.data?.results || [];
  const references = new Map();
  const cleanupJobs = new Map();
  const referenceFields = [
    "avatarFileId",
    "imageFileId",
    "originalEvidenceFileId",
    "boardImageFileID",
    "boardImageFileId",
  ];
  [
    "profiles",
    "drawSubmissions",
    "observationCandidates",
    "recognitionJobs",
  ].forEach((collection, index) => {
    for (const document of results[index] || [])
      for (const field of referenceFields) {
        const key = storageKey(document[field]);
        if (!key) continue;
        const entries = references.get(key) || [];
        entries.push({
          collection,
          field,
          status: document.status || document.profileState || null,
        });
        references.set(key, entries);
      }
  });
  for (const job of results[4] || []) {
    const key = storageKey(job.fileId);
    if (!key) continue;
    const entries = cleanupJobs.get(key) || [];
    entries.push({
      status: job.status,
      reason: job.reason,
    });
    cleanupJobs.set(key, entries);
  }
  const goldenManifest = JSON.parse(
    fs.readFileSync(
      path.join(
        cwd,
        "experiments/simple-semantic/simple-semantic-golden-set.json",
      ),
      "utf8",
    ),
  );
  const audited = objects.map((object) => {
    const match = object.key.match(/\/golden-(\d+)-detail\.jpg$/u);
    const golden = match
      ? goldenManifest.find((entry) => entry.id === `golden-${match[1]}`)
      : null;
    const goldenSourceExists = Boolean(
      golden?.filename &&
      fs.existsSync(path.join(goldenImages, golden.filename)),
    );
    const objectReferences = references.get(object.key) || [];
    const objectCleanupJobs = cleanupJobs.get(object.key) || [];
    return {
      ...object,
      classification: classifyStorageObject({
        object,
        references: objectReferences,
        cleanupJobs: objectCleanupJobs,
        goldenSourceExists,
        now,
      }),
      references: objectReferences,
      cleanupJobs: objectCleanupJobs,
      ...(golden
        ? {
            goldenSource: {
              id: golden.id,
              filename: golden.filename,
              exists: goldenSourceExists,
            },
          }
        : {}),
    };
  });
  return {
    envId,
    generatedAt: new Date(now).toISOString(),
    objects: audited,
    counts: Object.fromEntries(
      Object.values(STORAGE_CLASSIFICATION).map((classification) => [
        classification,
        audited.filter((object) => object.classification === classification)
          .length,
      ]),
    ),
  };
};

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const options = parseArgs(process.argv.slice(2));
  const result = auditCloudBaseStorage({
    cwd: process.cwd(),
    goldenImages: options.goldenImages,
    tcb: options.tcb,
  });
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.table(
      result.objects.map((object) => ({
        classification: object.classification,
        key: object.key,
        size: object.size,
        lastModified: object.lastModified,
        references: object.references.length,
      })),
    );
    console.log(JSON.stringify(result.counts, null, 2));
  }
}
