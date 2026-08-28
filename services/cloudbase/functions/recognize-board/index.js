"use strict";

// CommonJS is required by the CloudBase Event Function runtime package.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("node:fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("node:path");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const crypto = require("node:crypto");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Ajv2020 = require("ajv/dist/2020").default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { normalizeHybridExtraction } = require("./hybrid-semantic-normalize");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { resolveR1Extraction } = require("./r1-visible-evidence-resolver");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { normalizeR2Extraction } = require("./r2-direct-remaining-resolver");

const CONTRACT_VERSION = "1.0.0";
const BOARD_SCHEMA_VERSION = "1.0.0";
// Historical v3/v4/v5 normalizers below remain only for stored fixture
// migration. Live Provider traffic is dispatched exclusively to R2, R1, or H0.
const R2_PROVIDER_PROTOCOL_VERSION = "r2-direct-remaining-1.0.0";
const R2_PROVIDER_PROMPT_VERSION = "ichi-board-vlm-r2-direct-remaining-1.0.0";
const R2_PROVIDER_SCHEMA_VERSION = "board-provider-r2-direct-remaining-1.0.0";
const HYBRID_PROVIDER_PROTOCOL_VERSION = "hybrid-semantic-1.0.0";
const HYBRID_PROVIDER_PROMPT_VERSION = "ichi-board-vlm-hybrid-semantic-1.0.0";
const HYBRID_PROVIDER_SCHEMA_VERSION = "board-provider-hybrid-semantic-1.0.0";
const R1_PROVIDER_PROTOCOL_VERSION = "r1-visible-evidence-1.1.0";
const R1_PROVIDER_PROMPT_VERSION = "ichi-board-vlm-r1-visible-evidence-1.1.0";
const R1_PROVIDER_SCHEMA_VERSION = "board-provider-r1-visible-evidence-1.1.0";
const RECOGNITION_MODE_R2 = "r2_direct_remaining";
const RECOGNITION_MODE_R1 = "r1_remaining";
const RECOGNITION_MODE_HYBRID = "hybrid_semantic";
const PROVIDER_TIMEOUT_MS = 45_000;
// Storage is uploaded out-of-band. This is the provider URL hard limit, not
// the CloudBase function event size and not a client-side rejection budget.
const PROVIDER_HARD_IMAGE_BYTES = 20 * 1024 * 1024;
const MODEL_MAX_PIXELS = 6_291_456;
const PRIMARY_MODEL = "qwen3.7-flash";
const HIGH_CONFIDENCE = 0.75;
const CONTRACT_FILES = Object.freeze({
  prompt: "ichi-board-vlm-hybrid-semantic-1.0.0.txt",
  schema: "board-provider-hybrid-semantic-1.0.0.schema.json",
  policy: "board-vlm-policy-1.0.0-rc1.json",
});

const resolveContractDirectory = () => {
  const candidates = [
    path.join(__dirname, "recognition-contract"),
    path.resolve(__dirname, "../../../../data/recognition-contract"),
  ];
  const resolved = candidates.find((directory) =>
    fs.existsSync(path.join(directory, "prompt", CONTRACT_FILES.prompt)),
  );
  if (!resolved) throw new Error("recognition_contract_missing");
  return resolved;
};

const CONTRACT_DIRECTORY = resolveContractDirectory();
const HYBRID_FIXED_PROMPT = fs.readFileSync(
  path.join(
    CONTRACT_DIRECTORY,
    "prompt",
    "ichi-board-vlm-hybrid-semantic-1.0.0.txt",
  ),
  "utf8",
);
const HYBRID_OUTPUT_SCHEMA = JSON.parse(
  fs.readFileSync(
    path.join(
      CONTRACT_DIRECTORY,
      "schema",
      "board-provider-hybrid-semantic-1.0.0.schema.json",
    ),
    "utf8",
  ),
);
const R1_FIXED_PROMPT = fs.readFileSync(
  path.join(
    CONTRACT_DIRECTORY,
    "prompt",
    "ichi-board-vlm-r1-visible-evidence-1.1.0.txt",
  ),
  "utf8",
);
const R1_OUTPUT_SCHEMA_TEXT = fs.readFileSync(
  path.join(
    CONTRACT_DIRECTORY,
    "schema",
    "board-provider-r1-visible-evidence-1.1.0.schema.json",
  ),
  "utf8",
);
const R1_OUTPUT_SCHEMA = JSON.parse(R1_OUTPUT_SCHEMA_TEXT);
const R2_FIXED_PROMPT = fs.readFileSync(
  path.join(
    CONTRACT_DIRECTORY,
    "prompt",
    "ichi-board-vlm-r2-direct-remaining-1.0.0.txt",
  ),
  "utf8",
);
const R2_OUTPUT_SCHEMA_TEXT = fs.readFileSync(
  path.join(
    CONTRACT_DIRECTORY,
    "schema",
    "board-provider-r2-direct-remaining-1.0.0.schema.json",
  ),
  "utf8",
);
const R2_OUTPUT_SCHEMA = JSON.parse(R2_OUTPUT_SCHEMA_TEXT);
const sha256 = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");
const LEGACY_SCHEMA_FILE = "board-provider-extraction-3.0.0-rc1.schema.json";
const LEGACY_SCHEMA_PATH = path.join(
  CONTRACT_DIRECTORY,
  "schema",
  LEGACY_SCHEMA_FILE,
);
const LEGACY_OUTPUT_SCHEMA = fs.existsSync(LEGACY_SCHEMA_PATH)
  ? JSON.parse(fs.readFileSync(LEGACY_SCHEMA_PATH, "utf8"))
  : null;
// Retained only for the exported legacy observation adapter used by migration
// contract tests. Production requests use the provider extraction schema above.
const RECOGNITION_POLICY = JSON.parse(
  fs.readFileSync(
    path.join(CONTRACT_DIRECTORY, "policy", CONTRACT_FILES.policy),
    "utf8",
  ),
);
const validateHybridProviderExtraction = new Ajv2020({
  allErrors: true,
  strict: true,
}).compile(HYBRID_OUTPUT_SCHEMA);
const validateR1ProviderExtraction = new Ajv2020({
  allErrors: true,
  strict: true,
}).compile(R1_OUTPUT_SCHEMA);
const validateR2ProviderExtraction = new Ajv2020({
  allErrors: true,
  strict: true,
}).compile(R2_OUTPUT_SCHEMA);

const RECOGNITION_MODE_CONFIGS = Object.freeze({
  [RECOGNITION_MODE_R2]: Object.freeze({
    mode: RECOGNITION_MODE_R2,
    protocolVersion: R2_PROVIDER_PROTOCOL_VERSION,
    promptVersion: R2_PROVIDER_PROMPT_VERSION,
    schemaVersion: R2_PROVIDER_SCHEMA_VERSION,
    prompt: R2_FIXED_PROMPT.trim(),
    promptHash: sha256(R2_FIXED_PROMPT),
    schemaHash: sha256(R2_OUTPUT_SCHEMA_TEXT),
    validateProvider: validateR2ProviderExtraction,
  }),
  [RECOGNITION_MODE_R1]: Object.freeze({
    mode: RECOGNITION_MODE_R1,
    protocolVersion: R1_PROVIDER_PROTOCOL_VERSION,
    promptVersion: R1_PROVIDER_PROMPT_VERSION,
    schemaVersion: R1_PROVIDER_SCHEMA_VERSION,
    prompt: R1_FIXED_PROMPT.trim(),
    promptHash: sha256(R1_FIXED_PROMPT),
    schemaHash: sha256(R1_OUTPUT_SCHEMA_TEXT),
    validateProvider: validateR1ProviderExtraction,
  }),
  [RECOGNITION_MODE_HYBRID]: Object.freeze({
    mode: RECOGNITION_MODE_HYBRID,
    protocolVersion: HYBRID_PROVIDER_PROTOCOL_VERSION,
    promptVersion: HYBRID_PROVIDER_PROMPT_VERSION,
    schemaVersion: HYBRID_PROVIDER_SCHEMA_VERSION,
    prompt: HYBRID_FIXED_PROMPT.trim(),
    promptHash: sha256(HYBRID_FIXED_PROMPT),
    schemaHash: sha256(
      fs.readFileSync(
        path.join(
          CONTRACT_DIRECTORY,
          "schema",
          "board-provider-hybrid-semantic-1.0.0.schema.json",
        ),
      ),
    ),
    validateProvider: validateHybridProviderExtraction,
  }),
});

const resolveRecognitionMode = (env = process.env) => {
  const value = String(env.BOARD_RECOGNITION_MODE || RECOGNITION_MODE_R2)
    .trim()
    .toLowerCase();
  const config = RECOGNITION_MODE_CONFIGS[value];
  if (!config) throw createRecognitionError("BOARD_RECOGNITION_MODE_INVALID");
  return config;
};

const safeTokenEqual = (provided, expected) => {
  const left = Buffer.from(String(provided || ""));
  const right = Buffer.from(String(expected || ""));
  return (
    right.length >= 32 &&
    left.length === right.length &&
    crypto.timingSafeEqual(left, right)
  );
};

const resolveRecognitionContext = (event, env = process.env) => {
  const requestedMode =
    typeof event?.internalRecognitionMode === "string"
      ? event.internalRecognitionMode.trim().toLowerCase()
      : "";
  const requestedDefaultSmoke = event?.internalSmoke === true;
  if (!requestedMode && !requestedDefaultSmoke) {
    return { modeConfig: resolveRecognitionMode(env), internalSmoke: false };
  }
  if (
    !safeTokenEqual(
      event.internalSmokeToken,
      env.BOARD_RECOGNITION_INTERNAL_SMOKE_TOKEN,
    )
  ) {
    throw createRecognitionError("INTERNAL_SMOKE_AUTH_INVALID");
  }
  const modeConfig = requestedMode
    ? RECOGNITION_MODE_CONFIGS[requestedMode]
    : resolveRecognitionMode(env);
  if (!modeConfig) {
    throw createRecognitionError("INTERNAL_SMOKE_MODE_INVALID");
  }
  return { modeConfig, internalSmoke: true };
};

const createInternalSmokeJobGuard = () => ({
  claim: async (event) => ({ jobId: String(event.recognitionJobId) }),
  succeed: async () => undefined,
  fail: async () => undefined,
});
const LEGACY_V4_SCHEMA_FILE = "board-provider-extraction-4.0.0-rc1.schema.json";
const LEGACY_V4_SCHEMA_PATH = path.join(
  CONTRACT_DIRECTORY,
  "schema",
  LEGACY_V4_SCHEMA_FILE,
);
const validateLegacyV4ProviderExtraction = fs.existsSync(LEGACY_V4_SCHEMA_PATH)
  ? new Ajv2020({ allErrors: true, strict: true }).compile(
      JSON.parse(fs.readFileSync(LEGACY_V4_SCHEMA_PATH, "utf8")),
    )
  : null;
const V5_SCHEMA_PATH = path.join(
  CONTRACT_DIRECTORY,
  "schema",
  "board-provider-extraction-5.0.0-rc1.schema.json",
);
const validateV5ProviderExtraction = fs.existsSync(V5_SCHEMA_PATH)
  ? new Ajv2020({ allErrors: true, strict: true }).compile(
      JSON.parse(fs.readFileSync(V5_SCHEMA_PATH, "utf8")),
    )
  : null;
const validateLegacyProviderExtraction = LEGACY_OUTPUT_SCHEMA
  ? new Ajv2020({ allErrors: true, strict: true }).compile(LEGACY_OUTPUT_SCHEMA)
  : null;
const IMAGE_HANDLING = Object.freeze({
  retention: "ephemeral",
  published: false,
  storedInSessionHistory: false,
});

const createRecognitionError = (code) => {
  const error = new Error(code);
  error.code = code;
  return error;
};

const sanitizeProviderCode = (value) => {
  const code = String(value || "").trim();
  return /^[a-zA-Z0-9_.-]{1,80}$/u.test(code) ? code : null;
};

const createProviderError = (code, diagnostic = {}) => {
  const error = createRecognitionError(code);
  error.providerDiagnostic = {
    stage: sanitizeProviderCode(diagnostic.stage) || "provider_response",
    httpStatus: Number.isInteger(diagnostic.httpStatus)
      ? diagnostic.httpStatus
      : null,
    providerCode: sanitizeProviderCode(diagnostic.providerCode),
    contentType:
      typeof diagnostic.contentType === "string"
        ? diagnostic.contentType.slice(0, 80)
        : null,
    ...(sanitizeProviderCode(diagnostic.messageCategory)
      ? { messageCategory: sanitizeProviderCode(diagnostic.messageCategory) }
      : {}),
  };
  return error;
};

const classifyProviderMessage = (value) => {
  const message = String(value || "").toLowerCase();
  if (!message) return null;
  if (/download|fetch|url|accessible|resource/u.test(message))
    return "image_download_failed";
  if (/decode|format|corrupt|invalid image/u.test(message))
    return "image_decode_failed";
  if (/resolution|dimension|width|height|pixel/u.test(message))
    return "image_dimensions_invalid";
  if (/too large|file size|image size|bytes/u.test(message))
    return "image_size_invalid";
  if (/response.?format|json.?object/u.test(message))
    return "response_format_invalid";
  return null;
};

const providerReasonFromStatus = (status) => {
  if (status === 400) return "RECOGNITION_PROVIDER_REQUEST_INVALID";
  if (status === 401 || status === 403)
    return "RECOGNITION_PROVIDER_AUTH_FAILED";
  if (status === 404) return "RECOGNITION_PROVIDER_MODEL_NOT_FOUND";
  if (status === 408 || status === 504) return "RECOGNITION_PROVIDER_TIMEOUT";
  if (status === 429) return "RECOGNITION_PROVIDER_RATE_LIMITED";
  return "RECOGNITION_PROVIDER_ERROR";
};

const stripDatabaseMetadata = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const document = { ...value };
  delete document._id;
  return document;
};

const getDocument = async (source, collection, id) => {
  try {
    const result = await source.collection(collection).doc(id).get();
    return stripDatabaseMetadata(result?.data) || null;
  } catch (error) {
    if (/not exist|not found|-502005/u.test(String(error?.message || error)))
      return null;
    throw error;
  }
};

const sanitizeStructuredResult = (result) => {
  const sanitized = JSON.parse(JSON.stringify(result));
  delete sanitized.imageHandling;
  if (sanitized.draft) delete sanitized.draft.image;
  return sanitized;
};

const extractProviderEvidence = (
  raw,
  metrics = {},
  modeConfig = RECOGNITION_MODE_CONFIGS[RECOGNITION_MODE_R2],
  deterministicTrace = null,
) => {
  if (modeConfig.mode === RECOGNITION_MODE_R2) {
    return {
      recognitionMode: modeConfig.mode,
      protocolVersion: modeConfig.protocolVersion,
      promptVersion: modeConfig.promptVersion,
      promptHash: modeConfig.promptHash,
      schemaVersion: modeConfig.schemaVersion,
      schemaHash: modeConfig.schemaHash,
      model: PRIMARY_MODEL,
      maxPixels: MODEL_MAX_PIXELS,
      providerRequestId: metrics.providerRequestId || null,
      performance: {
        claimMs: asInteger(metrics.claimMs),
        imageUrlMs: asInteger(metrics.imageUrlMs),
        providerRequestMs: asInteger(metrics.providerRequestMs),
        providerTotalMs: asInteger(metrics.providerTotalMs),
        normalizeMs: asInteger(metrics.normalizeMs),
        jsonParseMs: asInteger(metrics.jsonParseMs),
        ajvMs: asInteger(metrics.ajvMs || metrics.providerSchemaMs),
        providerSchemaMs: asInteger(metrics.providerSchemaMs),
        totalFunctionMs: asInteger(metrics.totalFunctionMs),
        promptTokens: asInteger(metrics.promptTokens),
        imageTokens: asInteger(metrics.imageTokens),
        completionTokens: asInteger(metrics.completionTokens),
        totalTokens: asInteger(metrics.totalTokens),
        outputChars: asInteger(metrics.outputChars),
      },
      identity: {
        ipName: raw?.ipName ?? null,
        themeName: raw?.themeName ?? null,
      },
      tiers: (Array.isArray(raw?.tiers) ? raw.tiers : []).map((tier) => ({
        tierCode: tier.tierCode,
        rawLabel: tier.rawLabel,
        visibleNumberRuns: tier.visibleNumberRuns,
        remainingTickets: tier.remainingTickets,
      })),
      deterministic: deterministicTrace,
    };
  }
  return modeConfig.mode === RECOGNITION_MODE_HYBRID
    ? {
        recognitionMode: modeConfig.mode,
        protocolVersion: modeConfig.protocolVersion,
        promptVersion: modeConfig.promptVersion,
        promptHash: modeConfig.promptHash,
        schemaVersion: modeConfig.schemaVersion,
        model: PRIMARY_MODEL,
        maxPixels: MODEL_MAX_PIXELS,
        providerRequestId: metrics.providerRequestId || null,
        performance: {
          claimMs: asInteger(metrics.claimMs),
          imageUrlMs: asInteger(metrics.imageUrlMs),
          providerRequestMs: asInteger(metrics.providerRequestMs),
          providerTotalMs: asInteger(metrics.providerTotalMs),
          normalizeMs: asInteger(metrics.normalizeMs),
          jsonParseMs: asInteger(metrics.jsonParseMs),
          ajvMs: asInteger(metrics.ajvMs),
          promptTokens: asInteger(metrics.promptTokens),
          imageTokens: asInteger(metrics.imageTokens),
          completionTokens: asInteger(metrics.completionTokens),
          totalTokens: asInteger(metrics.totalTokens),
          outputChars: asInteger(metrics.outputChars),
        },
        identity: {
          ipName: raw.ipName,
          ipRawText: raw.ipRawText,
          themeName: raw.themeName,
          price: raw.price,
        },
        tiers: raw.tiers.map((tier) => ({
          rawLabel: tier.rawLabel,
          prizeName: tier.prizeName,
          totalTickets: tier.totalTickets,
          pastedTickets: tier.pastedTickets,
        })),
        deterministic: {
          issues: deterministicTrace?.issues || [],
          rawSpecialItemCount: deterministicTrace?.rawSpecialItemCount || 0,
          normalizedSpecialItemCount:
            deterministicTrace?.normalizedSpecialItemCount || 0,
          partialTierCount: deterministicTrace?.partialTierCount || 0,
          countRangeIssueCount: deterministicTrace?.countRangeIssueCount || 0,
          whole: deterministicTrace?.whole || null,
        },
      }
    : {
        recognitionMode: modeConfig.mode,
        protocolVersion: modeConfig.protocolVersion,
        promptVersion: modeConfig.promptVersion,
        promptHash: modeConfig.promptHash,
        schemaVersion: modeConfig.schemaVersion,
        model: PRIMARY_MODEL,
        maxPixels: MODEL_MAX_PIXELS,
        performance: {
          claimMs: asInteger(metrics.claimMs),
          imageUrlMs: asInteger(metrics.imageUrlMs),
          providerRequestMs: asInteger(metrics.providerRequestMs),
          providerTotalMs: asInteger(metrics.providerTotalMs),
          providerMs: asInteger(metrics.providerMs || metrics.providerTotalMs),
          normalizeMs: asInteger(metrics.normalizeMs),
          jsonParseMs: asInteger(metrics.jsonParseMs),
          ajvMs: asInteger(metrics.ajvMs || metrics.providerSchemaMs),
          providerSchemaMs: asInteger(metrics.providerSchemaMs),
          totalFunctionMs: asInteger(metrics.totalFunctionMs),
          promptTokens: asInteger(metrics.promptTokens),
          imageTokens: asInteger(metrics.imageTokens),
          completionTokens: asInteger(metrics.completionTokens),
          totalTokens: asInteger(metrics.totalTokens),
          outputChars: asInteger(metrics.outputChars),
        },
        identity: {
          ipName:
            raw?.ipName === null || raw?.ipName === undefined
              ? null
              : String(raw.ipName),
          ipRawText:
            raw?.ipRawText === null || raw?.ipRawText === undefined
              ? null
              : String(raw.ipRawText),
          themeName:
            raw?.themeName === null || raw?.themeName === undefined
              ? null
              : String(raw.themeName),
        },
        tiers: (Array.isArray(raw?.tiers) ? raw.tiers : []).map((tier) => ({
          tierCode: String(tier?.tierCode || ""),
          rawLabel:
            tier?.rawLabel === null || tier?.rawLabel === undefined
              ? null
              : String(tier.rawLabel),
          prizeName:
            tier?.prizeName === null || tier?.prizeName === undefined
              ? null
              : String(tier.prizeName),
          visibleNumberRuns: tier?.visibleNumberRuns || [],
          totalTicketsObserved: asNullableInteger(tier?.totalTicketsObserved),
          pastedTicketsObserved: asNullableInteger(tier?.pastedTicketsObserved),
        })),
        deterministic: deterministicTrace,
      };
};

const createCloudJobGuard = () => {
  // Loaded lazily so local contract tests do not require a CloudBase runtime.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cloud = require("wx-server-sdk");
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
  const db = cloud.database();
  const hashToken = (value) =>
    crypto
      .createHash("sha256")
      .update(String(value || ""))
      .digest("hex");
  const claim = (event) =>
    db.runTransaction(async (transaction) => {
      const jobId = String(event.recognitionJobId || "");
      const token = String(event.recognitionJobToken || "");
      if (!jobId || token.length < 24)
        throw createRecognitionError("RECOGNITION_JOB_AUTH_INVALID");
      const job = await getDocument(transaction, "recognitionJobs", jobId);
      if (!job || job.accessTokenHash !== hashToken(token))
        throw createRecognitionError("RECOGNITION_JOB_AUTH_INVALID");
      if (job.status !== "reserved")
        throw createRecognitionError("RECOGNITION_JOB_ALREADY_STARTED");
      if (!job.leaseExpiresAt || Date.parse(job.leaseExpiresAt) <= Date.now())
        throw createRecognitionError("RECOGNITION_JOB_EXPIRED");
      const quota = await getDocument(transaction, "dailyQuotas", job.quotaId);
      const reservation = quota?.reservations?.[job.keyHash];
      if (reservation?.status !== "reserved")
        throw createRecognitionError("QUOTA_RESERVATION_INVALID");
      const timestamp = new Date().toISOString();
      const leaseExpiresAt = new Date(Date.now() + 60_000).toISOString();
      await transaction
        .collection("recognitionJobs")
        .doc(jobId)
        .update({
          data: {
            status: "processing",
            updatedAt: timestamp,
            leaseExpiresAt,
          },
        });
      return {
        jobId,
        ownerAccountId: job.ownerAccountId,
        quotaId: job.quotaId,
        keyHash: job.keyHash,
        accessTokenHash: job.accessTokenHash,
      };
    });
  const succeed = (claimed, result, providerEvidence) =>
    db.runTransaction(async (transaction) => {
      const job = await getDocument(
        transaction,
        "recognitionJobs",
        claimed.jobId,
      );
      if (
        !job ||
        job.status !== "processing" ||
        job.accessTokenHash !== claimed.accessTokenHash
      )
        throw createRecognitionError("RECOGNITION_JOB_STATE_INVALID");
      const quota = await getDocument(
        transaction,
        "dailyQuotas",
        claimed.quotaId,
      );
      const reservation = quota?.reservations?.[claimed.keyHash];
      if (reservation?.status !== "reserved")
        throw createRecognitionError("QUOTA_RESERVATION_INVALID");
      const timestamp = new Date().toISOString();
      const leaseExpiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
      await transaction
        .collection("recognitionJobs")
        .doc(claimed.jobId)
        .update({
          data: {
            // Provider success is only an editable recognition. Quota is
            // committed later, atomically with a resumable observation.
            status: "recognized",
            structuredResult: sanitizeStructuredResult(result),
            providerEvidence,
            updatedAt: timestamp,
            recognizedAt: timestamp,
            leaseExpiresAt,
          },
        });
    });
  const fail = (claimed, errorCode) =>
    db.runTransaction(async (transaction) => {
      const job = await getDocument(
        transaction,
        "recognitionJobs",
        claimed.jobId,
      );
      if (!job || !["reserved", "processing"].includes(job.status)) return;
      const quota = await getDocument(
        transaction,
        "dailyQuotas",
        claimed.quotaId,
      );
      const reservation = quota?.reservations?.[claimed.keyHash];
      const timestamp = new Date().toISOString();
      if (reservation?.status === "reserved") {
        reservation.status = "released";
        reservation.releasedAt = timestamp;
        reservation.releaseReason = errorCode;
        quota.updatedAt = timestamp;
        await transaction
          .collection("dailyQuotas")
          .doc(claimed.quotaId)
          .set({ data: quota });
      }
      await transaction
        .collection("recognitionJobs")
        .doc(claimed.jobId)
        .update({
          data: {
            status: "failed",
            errorCode,
            accessTokenHash: null,
            updatedAt: timestamp,
            completedAt: timestamp,
          },
        });
    });
  return { claim, succeed, fail };
};

const createCloudImageStore = () => {
  // Loaded lazily so local contract tests do not require a CloudBase runtime.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cloud = require("wx-server-sdk");
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
  return {
    async getTemporaryUrl(fileId) {
      const result = await cloud.getTempFileURL({
        fileList: [{ fileID: fileId, maxAge: 300 }],
      });
      const item = result?.fileList?.[0];
      const temporaryUrl = String(item?.tempFileURL || "");
      if (
        !temporaryUrl.startsWith("https://") ||
        (item?.code && item.code !== "SUCCESS")
      ) {
        throw createRecognitionError("RECOGNITION_IMAGE_URL_UNAVAILABLE");
      }
      return temporaryUrl;
    },
    async delete(fileId) {
      await cloud.deleteFile({ fileList: [fileId] });
    },
  };
};

const enqueueCloudStorageCleanup = async ({ fileId, ownerAccountId }) => {
  // Loaded only after an actual delete failure so normal recognition does not
  // create a second CloudBase client or an unnecessary database write.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cloud = require("wx-server-sdk");
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
  const timestamp = new Date().toISOString();
  const targetId = `storage:${crypto
    .createHash("sha256")
    .update(fileId)
    .digest("hex")
    .slice(0, 32)}`;
  await cloud
    .database()
    .collection("deletionJobs")
    .doc(targetId)
    .set({
      data: {
        ownerAccountId,
        targetType: "storage-object",
        targetId,
        fileId,
        reason: "board_recognition_delete_failed",
        status: "pending",
        requestedAt: timestamp,
        deadlineAt: timestamp,
        nextAttemptAt: timestamp,
        attempts: 0,
        updatedAt: timestamp,
      },
    });
};

const clampConfidence = (value) => {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : 0;
};

const asInteger = (value, fallback = 0) => {
  return Number.isSafeInteger(value) && value >= 0 ? value : fallback;
};

const asNullableInteger = (value) => {
  if (value === null || value === undefined) return null;
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
};

const mergeNullableCounts = (left, right, mode = "max") => {
  const leftValue = asNullableInteger(left);
  const rightValue = asNullableInteger(right);
  if (leftValue === null || rightValue === null) return null;
  return mode === "sum"
    ? leftValue + rightValue
    : Math.max(leftValue, rightValue);
};

const issue = (code, path, action, confidence) => ({
  code,
  path,
  blocking: code !== "UNKNOWN_BLOCK_DETECTED",
  action,
  ...(confidence === undefined
    ? {}
    : { confidence: clampConfidence(confidence) }),
});

const serviceError = (requestId, code = "SERVICE_ERROR", reasonCode) => ({
  contractVersion: CONTRACT_VERSION,
  requestId,
  status: "service_error",
  issues: [issue(code, "/response", "retry")],
  imageHandling: IMAGE_HANDLING,
  ...(reasonCode ? { reasonCode } : {}),
});

const normalizeLabel = (value) => {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/赏$/u, "");
  if (/^SP(?:[1-4])?$/u.test(normalized)) return normalized;
  const regularTier = /^([A-Z])(?:[0-9]+)?$/u.exec(normalized);
  return regularTier ? regularTier[1] : "OTHER";
};

const canonicalizeTierInputs = (tierInputs) => {
  const usedSpecialLabels = new Set(
    tierInputs
      .map((tier) => normalizeLabel(tier?.label))
      .filter((label) => /^SP[1-4]$/u.test(label)),
  );
  const nextSpecialLabel = () => {
    for (let index = 1; index <= 4; index += 1) {
      const label = `SP${index}`;
      if (!usedSpecialLabels.has(label)) {
        usedSpecialLabels.add(label);
        return label;
      }
    }
    return "OTHER";
  };

  const normalized = tierInputs.map((tier) => {
    const rawLabel = String(tier?.label ?? "")
      .trim()
      .toUpperCase()
      .replace(/赏$/u, "");
    const label = normalizeLabel(tier?.label);
    return {
      ...tier,
      label: label === "SP" ? nextSpecialLabel() : label,
      numberedRegularVariant: /^[A-Z][0-9]+$/u.test(rawLabel),
    };
  });
  const grouped = [];
  const groupedByLabel = new Map();
  for (const tier of normalized) {
    const label = tier.label;
    if (!/^[A-Z]$/u.test(label) || !groupedByLabel.has(label)) {
      const copy = { ...tier };
      grouped.push(copy);
      if (/^[A-Z]$/u.test(label)) groupedByLabel.set(label, copy);
      continue;
    }
    const existing = groupedByLabel.get(label);
    const separateNumberedAreas =
      existing.numberedRegularVariant && tier.numberedRegularVariant;
    const combineCount = separateNumberedAreas
      ? (left, right) => mergeNullableCounts(left, right, "sum")
      : (left, right) => mergeNullableCounts(left, right, "max");
    existing.totalSlots = combineCount(existing.totalSlots, tier.totalSlots);
    existing.pastedSlots = combineCount(existing.pastedSlots, tier.pastedSlots);
    existing.unknownSlots = combineCount(
      existing.unknownSlots,
      tier.unknownSlots,
    );
    const existingRows = Array.isArray(existing.slotRows)
      ? existing.slotRows
      : [];
    const incomingRows = Array.isArray(tier.slotRows) ? tier.slotRows : [];
    existing.slotRows = separateNumberedAreas
      ? [...existingRows, ...incomingRows]
      : incomingRows.length > existingRows.length
        ? incomingRows
        : existingRows;
    const existingOpenPositions = Array.isArray(existing.openPositions)
      ? existing.openPositions
      : [];
    const incomingOpenPositions = Array.isArray(tier.openPositions)
      ? tier.openPositions
      : [];
    existing.openPositions = separateNumberedAreas
      ? [...existingOpenPositions, ...incomingOpenPositions]
      : incomingOpenPositions.length > existingOpenPositions.length
        ? incomingOpenPositions
        : existingOpenPositions;
    existing.totalSlotsEvidence = separateNumberedAreas
      ? existingRows.length > 0 && incomingRows.length > 0
        ? "complete_slot_layout"
        : "unknown"
      : clampConfidence(tier.confidence) > clampConfidence(existing.confidence)
        ? tier.totalSlotsEvidence
        : existing.totalSlotsEvidence;
    existing.confidence = separateNumberedAreas
      ? Math.min(
          clampConfidence(existing.confidence),
          clampConfidence(tier.confidence),
        )
      : Math.max(
          clampConfidence(existing.confidence),
          clampConfidence(tier.confidence),
        );
    existing.numberedRegularVariant =
      existing.numberedRegularVariant && tier.numberedRegularVariant;
    existing.prizeName = [existing.prizeName, tier.prizeName]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .filter((value, index, values) => values.indexOf(value) === index)
      .join(" / ");
  }
  return grouped.map((tier) => {
    const canonicalTier = { ...tier };
    delete canonicalTier.numberedRegularVariant;
    return canonicalTier;
  });
};

const normalizeBox = (value, index, count) => {
  const fallbackHeight = Math.min(0.16, 0.72 / Math.max(1, count));
  const fallback = {
    x: 0.08,
    y: Math.min(0.82, 0.2 + index * fallbackHeight),
    width: 0.84,
    height: Math.max(0.04, fallbackHeight - 0.01),
  };
  if (!value || typeof value !== "object") return fallback;
  const box = {
    x: value.x,
    y: value.y,
    width: value.width,
    height: value.height,
  };
  if (
    Object.values(box).some((item) => !Number.isFinite(item)) ||
    box.x < 0 ||
    box.y < 0 ||
    box.width <= 0 ||
    box.height <= 0 ||
    box.x + box.width > 1 ||
    box.y + box.height > 1
  ) {
    return fallback;
  }
  return box;
};

const normalizeEvidenceBox = (value) => {
  if (!value || typeof value !== "object") return null;
  const box = {
    x: value.x,
    y: value.y,
    width: value.width,
    height: value.height,
  };
  if (
    Object.values(box).some((item) => !Number.isFinite(item)) ||
    box.x < 0 ||
    box.y < 0 ||
    box.width <= 0 ||
    box.height <= 0 ||
    box.x + box.width > 1 ||
    box.y + box.height > 1
  ) {
    return null;
  }
  return box;
};

const evidenceCenterBelongsToTier = (evidenceBox, tierBox) => {
  const centerX = evidenceBox.x + evidenceBox.width / 2;
  const centerY = evidenceBox.y + evidenceBox.height / 2;
  const tolerance = 0.01;
  return (
    centerX >= tierBox.x - tolerance &&
    centerX <= tierBox.x + tierBox.width + tolerance &&
    centerY >= tierBox.y - tolerance &&
    centerY <= tierBox.y + tierBox.height + tolerance
  );
};

const buildPrompt = (
  modeConfig = RECOGNITION_MODE_CONFIGS[RECOGNITION_MODE_R2],
) => modeConfig.prompt;
const PROVIDER_TARGETS = new Set([
  "target_board",
  "not_target_board",
  "uncertain",
]);
const PROVIDER_WARNINGS = new Set(
  LEGACY_OUTPUT_SCHEMA?.properties?.warnings?.items?.enum || [],
);
const LEGACY_PROVIDER_WARNINGS = new Set(
  LEGACY_OUTPUT_SCHEMA?.properties?.warnings?.items?.enum || [],
);

const hasReviewableFocusedBoardExtraction = (value) => {
  const tiers = Array.isArray(value?.tiers) ? value.tiers : [];
  const reviewableTiers = tiers.filter(
    (tier) =>
      tier &&
      typeof tier === "object" &&
      typeof tier.label === "string" &&
      tier.label.trim() &&
      Number.isSafeInteger(tier.totalSlots) &&
      tier.totalSlots > 0,
  );
  const hasFocusedGeometry =
    normalizeBox(value?.focusBoundingBox, null) !== null ||
    (reviewableTiers.length >= 2 &&
      reviewableTiers.every(
        (tier) => normalizeBox(tier.boundingBox, null) !== null,
      ));
  const hasIdentityEvidence =
    [value?.title, value?.ipName, value?.seriesName].some(
      (item) => typeof item === "string" && item.trim(),
    ) ||
    (typeof value?.price?.amount === "number" && value.price.amount > 0);
  return (
    reviewableTiers.length > 0 && hasFocusedGeometry && hasIdentityEvidence
  );
};

const compactBoxToObject = (value) =>
  Array.isArray(value) && value.length === 4
    ? { x: value[0], y: value[1], width: value[2], height: value[3] }
    : value;

const COMPACT_TARGETS = Object.freeze({
  b: "target_board",
  n: "not_target_board",
  u: "uncertain",
});
const COMPACT_FRAMES = Object.freeze({
  c: "complete",
  p: "partial",
  u: "uncertain",
});
const COMPACT_TOTAL_EVIDENCE = Object.freeze({
  p: "physical_ticket_count",
  i: "printed_ticket_capacity",
  m: "maximum_ticket_ordinal",
  l: "complete_slot_layout",
  u: "unknown",
});

const expandCompactProviderDraft = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  if (!Array.isArray(value.z) || !(value.t in COMPACT_TARGETS)) return value;
  const price = Array.isArray(value.p)
    ? {
        amount: value.p[0] ?? null,
        currency: value.p[1] ?? "UNKNOWN",
        rawText: value.p[2] ?? null,
        confidence: value.p[3] ?? 0,
        handwritten: value.p[4] ?? null,
        boundingBox: null,
      }
    : undefined;
  return {
    target: COMPACT_TARGETS[value.t] || "uncertain",
    frame: COMPACT_FRAMES[value.f] || "uncertain",
    allRegularTiersDetected: Boolean(value.a),
    oneSlotOneTicketConfirmed: Boolean(value.o),
    confidence: value.q ?? 0,
    title: null,
    ipName: value.ip ?? null,
    themeName: value.th ?? null,
    seriesName: null,
    focusBoundingBox: compactBoxToObject(value.b ?? null),
    ...(price ? { price } : {}),
    tiers: value.z.map((tier) => ({
      label: tier?.l,
      rawLabel: tier?.r ?? null,
      prizeName: tier?.n ?? null,
      variants: Array.isArray(tier?.v)
        ? tier.v.map((variant) => ({
            rawLabel: Array.isArray(variant) ? (variant[0] ?? null) : null,
            name: Array.isArray(variant) ? (variant[1] ?? null) : null,
          }))
        : [],
      totalSlots: tier?.t ?? null,
      coveredSlots: tier?.c ?? null,
      unknownSlots: tier?.u ?? null,
      totalSlotsEvidence: COMPACT_TOTAL_EVIDENCE[tier?.e] || "unknown",
      slotRows: Array.isArray(tier?.s)
        ? tier.s.map((row) => ({
            total: Array.isArray(row) ? row[0] : null,
            covered: Array.isArray(row) ? row[1] : null,
            open: Array.isArray(row) ? row[2] : null,
            unknown: Array.isArray(row) ? row[3] : null,
          }))
        : [],
      openPositions: Array.isArray(tier?.o)
        ? tier.o.map((position) => ({
            ordinal: Array.isArray(position) ? (position[0] ?? null) : null,
            boundingBox: Array.isArray(position)
              ? compactBoxToObject(position.slice(1, 5))
              : null,
          }))
        : [],
      confidence: tier?.q ?? 0,
      boundingBox: compactBoxToObject(tier?.b ?? null),
      firstOpenOrdinal: tier?.f ?? null,
    })),
    warnings: [],
  };
};

// JSON Object mode guarantees parseable JSON, not exact field names. This is a
// one-way migration boundary for historical fixtures/old responses only. The
// live 3.0 prompt and Schema use semantic keys directly and never ask Qwen for
// compact keys. The migration never invents pasted counts from total counts.
const hasSemanticProtocol3Marker = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (Object.prototype.hasOwnProperty.call(value, "ipRawText")) {
    return true;
  }
  const tiers = Array.isArray(value.tiers) ? value.tiers : [];
  return tiers.some(
    (tier) =>
      tier &&
      typeof tier === "object" &&
      (Object.prototype.hasOwnProperty.call(tier, "pastedSlots") ||
        Object.prototype.hasOwnProperty.call(tier, "unknownSlots") ||
        Object.prototype.hasOwnProperty.call(tier, "totalSlotsEvidence") ||
        Object.prototype.hasOwnProperty.call(tier, "slotRows")),
  );
};

const hasProtocol3RootMarker = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const requiredCore = [
    "target",
    "frame",
    "allRegularTiersDetected",
    "oneSlotOneTicketConfirmed",
    "confidence",
    "price",
    "tiers",
    "warnings",
  ];
  if (
    !requiredCore.every((key) =>
      Object.prototype.hasOwnProperty.call(value, key),
    )
  ) {
    return false;
  }
  const tiers = Array.isArray(value.tiers) ? value.tiers : [];
  const hasLegacyTierMarker = tiers.some(
    (tier) =>
      tier &&
      typeof tier === "object" &&
      (Object.prototype.hasOwnProperty.call(tier, "coveredSlots") ||
        Object.prototype.hasOwnProperty.call(tier, "boundingBox") ||
        (Array.isArray(tier.variants) &&
          tier.variants.some(
            (variant) =>
              variant &&
              typeof variant === "object" &&
              Object.prototype.hasOwnProperty.call(variant, "label"),
          ))),
  );
  return !hasLegacyTierMarker;
};

const migrateLegacyProviderDraft = (value) => {
  const looksLegacy =
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (Array.isArray(value.z) ||
      Object.prototype.hasOwnProperty.call(value, "title") ||
      Object.prototype.hasOwnProperty.call(value, "seriesName") ||
      Object.prototype.hasOwnProperty.call(value, "focusBoundingBox") ||
      Object.prototype.hasOwnProperty.call(value.price || {}, "boundingBox") ||
      (Array.isArray(value.tiers) &&
        value.tiers.some(
          (tier) =>
            tier &&
            typeof tier === "object" &&
            (Object.prototype.hasOwnProperty.call(tier, "coveredSlots") ||
              Object.prototype.hasOwnProperty.call(tier, "boundingBox") ||
              !Object.prototype.hasOwnProperty.call(tier, "slotRows")),
        )));
  // Semantic 3.0-shaped objects, including malformed ones, must remain
  // untouched so production AJV is the only acceptance/repair boundary.
  if (
    hasSemanticProtocol3Marker(value) ||
    hasProtocol3RootMarker(value) ||
    !looksLegacy
  )
    return value;
  const expanded =
    value && typeof value === "object" && Array.isArray(value.z)
      ? expandCompactProviderDraft(value)
      : value;
  if (!expanded || typeof expanded !== "object" || Array.isArray(expanded))
    return expanded;
  const canPromoteFocusedBoard = hasReviewableFocusedBoardExtraction(expanded);
  const migrated = {
    target:
      expanded.target === "multiple_boards" && canPromoteFocusedBoard
        ? "target_board"
        : PROVIDER_TARGETS.has(expanded.target)
          ? expanded.target
          : "uncertain",
    frame: ["complete", "partial", "uncertain"].includes(expanded.frame)
      ? expanded.frame
      : "uncertain",
    allRegularTiersDetected: Boolean(expanded.allRegularTiersDetected),
    oneSlotOneTicketConfirmed: Boolean(expanded.oneSlotOneTicketConfirmed),
    confidence: clampConfidence(expanded.confidence),
    ipName: expanded.ipName == null ? null : String(expanded.ipName),
    ipRawText: expanded.ipRawText == null ? null : String(expanded.ipRawText),
    themeName: expanded.themeName == null ? null : String(expanded.themeName),
    price: {
      amount:
        expanded.price?.amount === null || expanded.price?.amount === undefined
          ? null
          : expanded.price.amount,
      currency: ["CNY", "JPY", "OTHER", "UNKNOWN"].includes(
        expanded.price?.currency,
      )
        ? expanded.price.currency
        : "UNKNOWN",
      rawText:
        expanded.price?.rawText == null ? null : String(expanded.price.rawText),
      confidence: clampConfidence(expanded.price?.confidence),
      handwritten:
        expanded.price?.handwritten === null ||
        expanded.price?.handwritten === undefined
          ? null
          : Boolean(expanded.price.handwritten),
    },
    tiers: (Array.isArray(expanded.tiers) ? expanded.tiers : []).map((tier) => {
      const totalSlots = asNullableInteger(tier?.totalSlots);
      const pastedSlots = asNullableInteger(
        tier?.pastedSlots ?? tier?.coveredSlots,
      );
      const unknownSlots = asNullableInteger(tier?.unknownSlots);
      const slotRows = Array.isArray(tier?.slotRows)
        ? tier.slotRows.map((row) => ({
            total: row?.total,
            pasted: row?.pasted ?? row?.covered,
            open: row?.open,
            unknown: row?.unknown,
          }))
        : totalSlots !== null && pastedSlots !== null && unknownSlots !== null
          ? [
              {
                total: totalSlots,
                pasted: pastedSlots,
                open: totalSlots - pastedSlots - unknownSlots,
                unknown: unknownSlots,
              },
            ]
          : [];
      return {
        label: String(tier?.label || "OTHER"),
        rawLabel: tier?.rawLabel == null ? null : String(tier.rawLabel),
        prizeName: tier?.prizeName == null ? null : String(tier.prizeName),
        variants: Array.isArray(tier?.variants)
          ? tier.variants.map((variant) => ({
              rawLabel:
                variant?.rawLabel == null ? null : String(variant.rawLabel),
              name: variant?.name == null ? null : String(variant.name),
            }))
          : [],
        totalSlots,
        pastedSlots,
        unknownSlots,
        totalSlotsEvidence: [
          "physical_ticket_count",
          "printed_ticket_capacity",
          "maximum_ticket_ordinal",
          "complete_slot_layout",
          "unknown",
        ].includes(tier?.totalSlotsEvidence)
          ? tier.totalSlotsEvidence
          : "unknown",
        slotRows,
        confidence: clampConfidence(tier?.confidence),
      };
    }),
    warnings: Array.isArray(expanded.warnings)
      ? expanded.warnings.filter(
          (warning) =>
            LEGACY_PROVIDER_WARNINGS.has(warning) ||
            PROVIDER_WARNINGS.has(warning),
        )
      : [],
  };
  const legacyRootKeys = new Set([
    "target",
    "frame",
    "allRegularTiersDetected",
    "oneSlotOneTicketConfirmed",
    "confidence",
    "title",
    "ipName",
    "ipRawText",
    "themeName",
    "seriesName",
    "focusBoundingBox",
    "price",
    "tiers",
    "warnings",
  ]);
  for (const [key, extra] of Object.entries(expanded)) {
    if (!legacyRootKeys.has(key)) migrated[key] = extra;
  }
  return migrated;
};

const adaptProviderDraftShape = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  if (hasSemanticProtocol3Marker(value) || hasProtocol3RootMarker(value))
    return value;
  const adapted = migrateLegacyProviderDraft(value);
  if (
    (adapted.target === "uncertain" || adapted.target === "multiple_boards") &&
    hasReviewableFocusedBoardExtraction(adapted)
  ) {
    adapted.target = "target_board";
  } else if (!PROVIDER_TARGETS.has(adapted.target)) {
    adapted.target =
      adapted.target === "multiple_boards" &&
      hasReviewableFocusedBoardExtraction(adapted)
        ? "target_board"
        : "uncertain";
  }
  if (Array.isArray(adapted.tiers)) {
    adapted.tiers = adapted.tiers.map((tier) => {
      if (!tier || typeof tier !== "object" || Array.isArray(tier)) return tier;
      const adaptedTier = { ...tier };
      if (Array.isArray(adaptedTier.variants)) {
        adaptedTier.variants = adaptedTier.variants.map((variant) => {
          if (
            !variant ||
            typeof variant !== "object" ||
            Array.isArray(variant)
          ) {
            return variant;
          }
          const adaptedVariant = { ...variant };
          if (
            adaptedVariant.rawLabel === undefined &&
            typeof adaptedVariant.label === "string"
          ) {
            adaptedVariant.rawLabel = adaptedVariant.label;
          }
          delete adaptedVariant.label;
          return adaptedVariant;
        });
      }
      return adaptedTier;
    });
  }
  if (Array.isArray(adapted.warnings)) {
    adapted.warnings = adapted.warnings.filter(
      (warning) =>
        LEGACY_PROVIDER_WARNINGS.has(warning) || PROVIDER_WARNINGS.has(warning),
    );
  }
  return adapted;
};

const buildProviderUrl = (workspaceId, region) => {
  const suffix =
    region === "ap-southeast-1"
      ? "ap-southeast-1.maas.aliyuncs.com"
      : "cn-beijing.maas.aliyuncs.com";
  return `https://${workspaceId}.${suffix}/compatible-mode/v1/chat/completions`;
};

const callProvider = async ({
  fetchImpl,
  apiKey,
  workspaceId,
  region,
  model,
  imageUrl,
  metrics,
  modeConfig = RECOGNITION_MODE_CONFIGS[RECOGNITION_MODE_R2],
  diagnosticCapture = null,
  timeoutMs = PROVIDER_TIMEOUT_MS,
}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const requestStartedAt = Date.now();
  try {
    const response = await fetchImpl(buildProviderUrl(workspaceId, region), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: buildPrompt(modeConfig) },
              {
                type: "image_url",
                image_url: { url: imageUrl },
                max_pixels: MODEL_MAX_PIXELS,
              },
            ],
          },
        ],
        // Qwen3.7 Flash guarantees a JSON object in non-thinking mode. The
        // provider draft is validated and normalized into ICHI's stable client
        // contract below; the provider response is never returned directly.
        response_format: { type: "json_object" },
        enable_thinking: false,
        temperature: 0,
      }),
      signal: controller.signal,
    });
    if (metrics) metrics.providerRequestMs = Date.now() - requestStartedAt;
    if (metrics) {
      metrics.providerRequestId =
        response.headers.get("x-request-id") ||
        response.headers.get("x-dashscope-request-id") ||
        response.headers.get("request-id") ||
        null;
    }
    if (diagnosticCapture) {
      diagnosticCapture.providerRequestId = metrics?.providerRequestId || null;
    }
    if (!response.ok) {
      const contentType = response.headers.get("content-type") || "";
      let providerCode = null;
      let messageCategory = null;
      try {
        const body = await response.json();
        providerCode = body?.error?.code || body?.code || null;
        messageCategory = classifyProviderMessage(
          body?.error?.message || body?.message,
        );
      } catch {
        // Never retain or log an unstructured provider response body.
      }
      throw createProviderError(providerReasonFromStatus(response.status), {
        stage: "provider_http",
        httpStatus: response.status,
        providerCode,
        contentType,
        messageCategory,
      });
    }
    let payload;
    const jsonStartedAt = Date.now();
    try {
      payload = await response.json();
    } catch {
      throw createProviderError("RECOGNITION_PROVIDER_RESPONSE_INVALID", {
        stage: "provider_response_json",
        httpStatus: response.status,
        contentType: response.headers.get("content-type") || "",
      });
    }
    if (
      metrics &&
      !metrics.providerRequestId &&
      typeof payload?.id === "string" &&
      payload.id.trim()
    ) {
      metrics.providerRequestId = payload.id.trim().slice(0, 200);
      if (diagnosticCapture) {
        diagnosticCapture.providerRequestId = metrics.providerRequestId;
      }
    }
    if (metrics) metrics.jsonParseMs = Date.now() - jsonStartedAt;
    if (metrics) {
      metrics.providerTotalMs = Date.now() - requestStartedAt;
      metrics.providerMs = metrics.providerTotalMs;
      metrics.promptTokens = asInteger(payload?.usage?.prompt_tokens);
      metrics.completionTokens = asInteger(payload?.usage?.completion_tokens);
      metrics.totalTokens = asInteger(payload?.usage?.total_tokens);
      metrics.imageTokens = asInteger(
        payload?.usage?.prompt_tokens_details?.image_tokens,
      );
    }
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw createProviderError("RECOGNITION_PROVIDER_RESPONSE_INVALID", {
        stage: "provider_empty_content",
        httpStatus: response.status,
        contentType: response.headers.get("content-type") || "",
      });
    }
    if (metrics) metrics.outputChars = content.length;
    if (diagnosticCapture) diagnosticCapture.rawMessageContent = content;
    let observation;
    const contentJsonStartedAt = Date.now();
    try {
      // Production Qwen output must satisfy the current semantic protocol as
      // emitted. Historical compact/verbose adapters are migration helpers for
      // stored fixtures only; applying them here would silently repair a
      // malformed 3.0 response and weaken the Provider Schema boundary.
      observation = JSON.parse(content);
    } catch (parseError) {
      if (diagnosticCapture) {
        diagnosticCapture.jsonParse = {
          pass: false,
          error: String(parseError?.message || parseError),
        };
      }
      throw createProviderError("RECOGNITION_PROVIDER_RESPONSE_INVALID", {
        stage: "provider_output_json",
        httpStatus: response.status,
        contentType: response.headers.get("content-type") || "",
      });
    } finally {
      if (metrics) {
        metrics.jsonParseMs =
          (metrics.jsonParseMs || 0) + (Date.now() - contentJsonStartedAt);
      }
    }
    if (diagnosticCapture) {
      diagnosticCapture.jsonParse = { pass: true, error: null };
      diagnosticCapture.parsedJson = observation;
    }
    const schemaStartedAt = Date.now();
    const providerValidator = modeConfig.validateProvider;
    const schemaValid = providerValidator(observation);
    if (metrics) metrics.providerSchemaMs = Date.now() - schemaStartedAt;
    if (metrics) metrics.ajvMs = metrics.providerSchemaMs;
    if (metrics) metrics.ajvPass = schemaValid;
    const fullAjvErrors = JSON.parse(
      JSON.stringify(providerValidator.errors || []),
    );
    if (diagnosticCapture) {
      diagnosticCapture.ajv = {
        reached: true,
        pass: schemaValid,
        errors: fullAjvErrors,
      };
    }
    if (!schemaValid) {
      const error = new Error("provider_schema_invalid");
      error.fullAjvErrors = fullAjvErrors;
      error.schemaIssues = (providerValidator.errors || [])
        .slice(0, 12)
        .map((item) => ({
          instancePath: item.instancePath,
          keyword: item.keyword,
          ...(item.keyword === "additionalProperties" &&
          typeof item.params?.additionalProperty === "string"
            ? { additionalProperty: item.params.additionalProperty }
            : {}),
        }));
      throw error;
    }
    return observation;
  } finally {
    if (metrics) {
      const elapsed = Date.now() - requestStartedAt;
      if (metrics.providerRequestMs === undefined)
        metrics.providerRequestMs = elapsed;
      if (metrics.providerTotalMs === undefined)
        metrics.providerTotalMs = elapsed;
      if (metrics.providerMs === undefined)
        metrics.providerMs = metrics.providerTotalMs;
    }
    clearTimeout(timeout);
  }
};

const arrayBoxToObject = (box) => ({
  x: box[0],
  y: box[1],
  width: box[2],
  height: box[3],
});

const boxInside = (box, outer, tolerance = 0.01) =>
  Array.isArray(box) &&
  Array.isArray(outer) &&
  box[0] >= outer[0] - tolerance &&
  box[1] >= outer[1] - tolerance &&
  box[0] + box[2] <= outer[0] + outer[2] + tolerance &&
  box[1] + box[3] <= outer[1] + outer[3] + tolerance;

const polygonArea = (corners) => {
  let sum = 0;
  for (let index = 0; index < corners.length; index += 1) {
    const current = corners[index];
    const next = corners[(index + 1) % corners.length];
    sum += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(sum) / 2;
};

const boardCandidateScore = (candidate) => {
  const areaFraction = polygonArea(candidate.corners);
  const centerX = candidate.box[0] + candidate.box[2] / 2;
  const centerY = candidate.box[1] + candidate.box[3] / 2;
  const centerDistance = Math.hypot(centerX - 0.5, centerY - 0.5);
  const centerScore = 1 - Math.min(1, centerDistance / 0.7071);
  const frameScore =
    candidate.frame === "complete"
      ? 1
      : candidate.frame === "partial"
        ? 0.5
        : 0;
  const contentScore =
    candidate.contentCompleteness === "complete"
      ? 1
      : candidate.contentCompleteness === "partial"
        ? 0.5
        : 0;
  const completenessScore = (frameScore + contentScore) / 2;
  const detailScore =
    candidate.detail === "sufficient"
      ? 1
      : candidate.detail === "partially_sufficient"
        ? 0.5
        : 0;
  const weights = RECOGNITION_POLICY.boardSelection.weights;
  return {
    areaFraction,
    score:
      weights.area * areaFraction +
      weights.center * centerScore +
      weights.completeness * completenessScore +
      weights.detail * detailScore,
  };
};

const chooseIpCandidate = (recognition) => {
  const candidates = [...recognition.candidates].sort(
    (left, right) => right.confidence - left.confidence,
  );
  const first = candidates[0];
  if (
    !first ||
    first.confidence < RECOGNITION_POLICY.ipSelection.minimumCandidateConfidence
  ) {
    return null;
  }
  const second = candidates[1];
  if (
    second &&
    first.confidence - second.confidence <
      RECOGNITION_POLICY.ipSelection.minimumLeadOverSecondCandidate
  ) {
    return null;
  }
  const strongEvidence = first.evidence.some((evidence) =>
    RECOGNITION_POLICY.ipSelection.singleStrongEvidence.includes(evidence.type),
  );
  const independentEvidence = new Set(
    first.evidence.map((evidence) => evidence.type),
  );
  const hasRequiredIndependentEvidence =
    independentEvidence.size >=
      RECOGNITION_POLICY.ipSelection.independentEvidenceMinimum &&
    RECOGNITION_POLICY.ipSelection.independentEvidenceMustIncludeOneOf.some(
      (type) => independentEvidence.has(type),
    );
  return strongEvidence || hasRequiredIndependentEvidence ? first : null;
};

const adaptRc1Observation = (observation) => {
  const assessment = observation.imageAssessment;
  const rankedBoards = assessment.boardCandidates
    .map((candidate) => ({ candidate, ...boardCandidateScore(candidate) }))
    .sort((left, right) => right.score - left.score);
  const first = rankedBoards[0];
  const second = rankedBoards[1];
  const boardPolicy = RECOGNITION_POLICY.boardSelection;
  const focusSelectionIsValid =
    assessment.target === "target_board" &&
    assessment.focusSelection === "selected" &&
    first &&
    first.candidate.id === assessment.focusBoardCandidateId &&
    first.areaFraction >= boardPolicy.minimumAreaFraction &&
    first.score >= boardPolicy.minimumWinningScore &&
    (!second ||
      first.score - second.score >= boardPolicy.minimumLeadOverSecondCandidate);
  const selectedFocusBox = focusSelectionIsValid ? first.candidate.box : null;
  const detailedBoxes = [
    ...observation.tiers.flatMap((tier) => [
      tier.box,
      tier.labelBox,
      tier.printedTotalSlots.box,
      ...tier.prizeVariants.map((variant) => variant.box),
    ]),
    ...observation.ticketAreas.flatMap((area) => [
      area.box,
      area.stateLegend.evidenceBox,
      ...area.sequenceEvidence.markers.map((marker) => marker.box),
    ]),
    ...observation.ipRecognition.candidates.flatMap((candidate) =>
      candidate.evidence.map((evidence) => evidence.box),
    ),
    ...observation.ipRecognition.seriesEvidence.map((evidence) => evidence.box),
    ...observation.priceRecognition.candidates.map(
      (candidate) => candidate.box,
    ),
    ...observation.blocks.map((block) => block.box),
  ].filter(Boolean);
  const focusIsValid =
    selectedFocusBox &&
    boxInside(selectedFocusBox, [0, 0, 1, 1], 0) &&
    detailedBoxes.every((box) => boxInside(box, selectedFocusBox));
  const focusBox = focusIsValid ? selectedFocusBox : null;
  const visibleTiers = focusBox
    ? observation.tiers.filter((tier) => boxInside(tier.box, focusBox))
    : [];
  const tierById = new Map(visibleTiers.map((tier) => [tier.id, tier]));
  const areasByTier = new Map();
  for (const area of observation.ticketAreas) {
    if (
      !focusBox ||
      !boxInside(area.box, focusBox) ||
      !tierById.has(area.ownerTierId)
    ) {
      continue;
    }
    const areas = areasByTier.get(area.ownerTierId) || [];
    areas.push(area);
    areasByTier.set(area.ownerTierId, areas);
  }
  const tiers = visibleTiers.map((tier) => {
    let openSlots;
    let coveredSlots = 0;
    let unknownSlots = 0;
    const areas = areasByTier.get(tier.id) || [];
    for (const area of areas) {
      const legendReliable =
        area.stateLegend.confidence >=
        RECOGNITION_POLICY.slotStateMapping.minimumLegendConfidence;
      for (const state of area.rows.flat()) {
        if (!legendReliable || state === "unknown") unknownSlots += 1;
        else if (state === "open") openSlots += 1;
        else coveredSlots += 1;
      }
    }
    const visibleSlots = openSlots + coveredSlots + unknownSlots;
    const printedSlots = tier.printedTotalSlots.value;
    const totalSlots =
      Number.isSafeInteger(printedSlots) && printedSlots >= visibleSlots
        ? printedSlots
        : visibleSlots;
    unknownSlots += Math.max(0, totalSlots - visibleSlots);
    const prizeName = tier.prizeVariants
      .map((variant) => variant.name || variant.rawText)
      .filter(Boolean)
      .join(" / ");
    return {
      label: tier.label === "UNKNOWN" ? "OTHER" : tier.label,
      rawLabel: tier.rawLabel,
      prizeName,
      totalSlots,
      coveredSlots,
      unknownSlots,
      confidence: Math.min(
        tier.confidence,
        ...areas.map((area) => area.ownerConfidence),
      ),
      boundingBox: arrayBoxToObject(tier.box),
    };
  });
  const selectedIp = chooseIpCandidate(observation.ipRecognition);
  const qualifiedPrices = observation.priceRecognition.candidates.filter(
    (candidate) =>
      candidate.role === "single_draw" &&
      candidate.amount !== null &&
      candidate.confidence >=
        RECOGNITION_POLICY.priceSelection.minimumSingleDrawConfidence,
  );
  const selectedPrice =
    qualifiedPrices.length === 1 ? qualifiedPrices[0] : null;
  return {
    frame: focusIsValid ? assessment.frame : "uncertain",
    allRegularTiersDetected:
      focusIsValid && assessment.regularTierCoverage === "complete",
    oneSlotOneTicketConfirmed:
      focusIsValid &&
      assessment.slotSemantics === "one_slot_one_ticket_confirmed",
    confidence: focusIsValid ? assessment.confidence : 0,
    ipName: selectedIp?.name || null,
    price: {
      amount: selectedPrice?.amount || null,
      rawText: selectedPrice?.rawText || "",
      confidence: selectedPrice?.confidence || 0,
      handwritten: selectedPrice?.handwritten !== "no",
      boundingBox: selectedPrice?.box
        ? arrayBoxToObject(selectedPrice.box)
        : null,
    },
    tiers,
  };
};

const IP_CANONICAL_ALIASES = [
  [/^(?:PERSONA|女神異聞録)(?:\s*SERIES)?$/iu, "女神异闻录"],
  [/^(?:一番赏\s*)?女神(?:异闻录|異聞録)(?:\s*\d+\s*周年)?$/iu, "女神异闻录"],
  [/^ARKNIGHTS$/iu, "明日方舟"],
  [/^DEMON\s*SLAYER(?::\s*KIMETSU\s*NO\s*YAIBA)?$/iu, "鬼灭之刃"],
  [/^NARUTO(?:\s*SHIPPUDEN)?$/iu, "火影忍者"],
];

// Only split titles whose franchise root is explicit and supported. Unknown
// works remain untouched so Normalize never invents a Chinese franchise name.
const IP_THEME_ROOTS = [
  {
    canonical: "火影忍者",
    pattern: /^(?:NARUTO(?:\s*SHIPPUDEN)?|火影忍者)(?:[\s/·—_-]+|：|:)?(.*)$/iu,
  },
  {
    canonical: "明日方舟",
    pattern: /^(?:ARKNIGHTS|明日方舟)(?:[\s/·—_-]+|：|:)?(.*)$/iu,
  },
  {
    canonical: "女神异闻录",
    pattern:
      /^(?:PERSONA(?:\s*SERIES)?|女神(?:异闻录|異聞録))(?:[\s/·—_-]+|：|:)?(.*)$/iu,
  },
  {
    canonical: "崩坏：星穹铁道",
    pattern:
      /^(?:崩坏[:：]\s*星穹铁道|崩壞[:：]\s*星穹鐵道|HONKAI[:：]?\s*STAR\s*RAIL)(?:[\s/·—_-]+|：|:)?(.*)$/iu,
  },
];

const canonicalizeIpName = (value) => {
  const normalized = String(value || "")
    .trim()
    .replace(/^[《「『【]|[》」』】]$/gu, "")
    .replace(/^一番赏\s*/u, "")
    .trim();
  const alias = IP_CANONICAL_ALIASES.find(([pattern]) =>
    pattern.test(normalized),
  );
  return alias ? alias[1] : normalized;
};

const canonicalizeThemeName = (value, ipName) => {
  let theme = String(value || "")
    .trim()
    .replace(/^一番赏\s*/u, "")
    .trim();
  const normalizedIp = String(ipName || "").trim();
  if (normalizedIp && theme.startsWith(normalizedIp)) {
    const suffix = theme.slice(normalizedIp.length);
    // Strip only a leading copy of the already-canonical IP. A one-letter
    // tier-like IP needs an explicit separator so names such as "AAnniversary"
    // are not rewritten. Do not normalize unrelated aliases or text later in
    // the theme; the theme is provider evidence, not a free-form rewrite.
    if (normalizedIp.length > 1 || /^[\s/·—_-]/u.test(suffix)) {
      theme = suffix.replace(/^[\s/·—_-]+/u, "").trim();
    }
  }
  if (normalizedIp === "女神异闻录" && /^PERSONA\s*\d+\s*周年$/iu.test(theme)) {
    theme = theme.replace(/^PERSONA\s*/iu, "");
  }
  return theme;
};

const canonicalizeIpTheme = (ipValue, themeValue) => {
  const rawIp = String(ipValue || "")
    .trim()
    .replace(/^[《「『【]|[》」』】]$/gu, "")
    .replace(/^一番赏\s*/u, "")
    .trim();
  const explicitTheme = String(themeValue || "").trim();
  const root = IP_THEME_ROOTS.find(({ pattern }) => pattern.test(rawIp));
  if (!root) {
    const ipName = canonicalizeIpName(rawIp) || null;
    return {
      ipName,
      themeName: canonicalizeThemeName(explicitTheme, ipName) || null,
    };
  }
  const match = rawIp.match(root.pattern);
  const suffix = String(match?.[1] || "").trim();
  const themeCandidate = explicitTheme || suffix;
  return {
    ipName: root.canonical,
    themeName: canonicalizeThemeName(themeCandidate, root.canonical) || null,
  };
};

const normalizeLegacyExtraction = (raw, request) => {
  if (!raw || typeof raw !== "object") {
    throw new Error("provider_invalid_json_shape");
  }
  // Keep Normalize independently safe for tests and any future caller. The
  // live provider path already performs this check immediately after
  // JSON.parse; repeating it here prevents a future call site from bypassing
  // the AJV boundary and coercing malformed numeric fields.
  if (
    validateLegacyProviderExtraction &&
    !validateLegacyProviderExtraction(raw)
  ) {
    throw createRecognitionError("provider_schema_invalid");
  }
  if (raw.target !== "target_board") {
    raw = {
      ...raw,
      frame: raw.target === "not_target_board" ? "partial" : "uncertain",
      allRegularTiersDetected: false,
      oneSlotOneTicketConfirmed: false,
      confidence: 0,
    };
  }
  const rawTiers = Array.isArray(raw.tiers) ? raw.tiers : [];
  // Never fabricate an OTHER tier when the model found no usable prize tier.
  // A partial but real tier remains editable; an empty tier list is a true
  // retake condition and must not become a fake ticket pool.
  const canonicalTierInputs = canonicalizeTierInputs(rawTiers);
  const tiers = canonicalTierInputs.map((value, index) => {
    const tierBox = normalizeBox(
      value.boundingBox,
      index,
      canonicalTierInputs.length,
    );
    const hasTotalSlots = Number.isSafeInteger(value.totalSlots);
    const hasPastedSlots = Number.isSafeInteger(value.pastedSlots);
    const hasUnknownSlots = Number.isSafeInteger(value.unknownSlots);
    const providedRows = Array.isArray(value.slotRows) ? value.slotRows : [];
    const validRows = providedRows.filter((row) => {
      const total = asInteger(row?.total);
      const covered = asInteger(row?.pasted);
      const open = asInteger(row?.open);
      const unknown = asInteger(row?.unknown);
      return total > 0 && covered + open + unknown === total;
    });
    const rowsAreComplete =
      providedRows.length > 0 && validRows.length === providedRows.length;
    const providedOpenPositions = Array.isArray(value.openPositions)
      ? value.openPositions
      : null;
    const validOpenPositions = (providedOpenPositions ?? [])
      .map((position) => ({
        ordinal: Number.isSafeInteger(position?.ordinal)
          ? asInteger(position.ordinal)
          : null,
        boundingBox: normalizeEvidenceBox(position?.boundingBox),
      }))
      .filter(
        (position) =>
          position.boundingBox &&
          evidenceCenterBelongsToTier(position.boundingBox, tierBox),
      )
      .filter((position, positionIndex, positions) => {
        const key = position.ordinal
          ? `ordinal-${position.ordinal}`
          : `${position.boundingBox.x.toFixed(3)}-${position.boundingBox.y.toFixed(3)}`;
        return (
          positions.findIndex((candidate) => {
            const candidateKey = candidate.ordinal
              ? `ordinal-${candidate.ordinal}`
              : `${candidate.boundingBox.x.toFixed(3)}-${candidate.boundingBox.y.toFixed(3)}`;
            return candidateKey === key;
          }) === positionIndex
        );
      });
    const openPositionEvidenceProvided =
      providedOpenPositions !== null && providedOpenPositions.length > 0;
    const spatialEvidenceConflict =
      openPositionEvidenceProvided &&
      validOpenPositions.length !== providedOpenPositions.length;
    const rowCounts = validRows.reduce(
      (counts, row) => ({
        total: counts.total + asInteger(row.total),
        covered: counts.covered + asInteger(row.pasted),
        open: counts.open + asInteger(row.open),
        unknown: counts.unknown + asInteger(row.unknown),
      }),
      { total: 0, covered: 0, open: 0, unknown: 0 },
    );
    const scalarTotal = hasTotalSlots ? asInteger(value.totalSlots) : null;
    const scalarPasted = hasPastedSlots ? asInteger(value.pastedSlots) : null;
    const scalarUnknown = hasUnknownSlots
      ? asInteger(value.unknownSlots)
      : null;
    const baseCounts = rowsAreComplete
      ? rowCounts
      : {
          total: scalarTotal,
          covered: scalarPasted,
          open:
            scalarTotal !== null &&
            scalarPasted !== null &&
            scalarUnknown !== null
              ? scalarTotal - scalarPasted - scalarUnknown
              : null,
          unknown: scalarUnknown,
        };
    const rowScalarConflict =
      rowsAreComplete &&
      ((hasTotalSlots && scalarTotal !== rowCounts.total) ||
        (hasPastedSlots && scalarPasted !== rowCounts.covered) ||
        (hasUnknownSlots && scalarUnknown !== rowCounts.unknown));
    const totalSlots =
      rowScalarConflict && hasTotalSlots ? null : baseCounts.total;
    const openSlots = rowScalarConflict ? null : baseCounts.open;
    const coveredSlots =
      rowScalarConflict && hasPastedSlots ? null : baseCounts.covered;
    const unknownSlots =
      rowScalarConflict && hasUnknownSlots ? null : baseCounts.unknown;
    const consistent =
      Number.isSafeInteger(totalSlots) &&
      Number.isSafeInteger(openSlots) &&
      Number.isSafeInteger(coveredSlots) &&
      Number.isSafeInteger(unknownSlots) &&
      openSlots + coveredSlots + unknownSlots === totalSlots;
    const label = normalizeLabel(value.label);
    const prizeName =
      String(value.prizeName || "").trim() ||
      (Array.isArray(value.variants)
        ? value.variants
            .map((variant) => String(variant?.name || "").trim())
            .filter(Boolean)
            .join(" / ")
        : "");
    return {
      componentId: `tier-${label.toLowerCase()}-${index + 1}`,
      componentType: "prize_tier",
      label,
      rawLabel: String(value.rawLabel || `${label}赏`),
      ...(prizeName ? { prizeName } : {}),
      origin: "recognized",
      confidence: clampConfidence(value.confidence),
      layout: {
        region: "tier_grid",
        boundingBox: tierBox,
        parentId: null,
        zIndex: 1,
        readingOrder: index,
      },
      slotObservation: {
        totalSlots,
        openSlots,
        coveredSlots,
        unknownSlots,
        arrangement: {
          direction: "wrapped_rows",
          rows: Math.max(1, Math.ceil(Math.max(1, totalSlots || 1) / 8)),
          columns: Math.max(1, Math.min(8, totalSlots || 1)),
        },
        confidence:
          consistent &&
          !rowScalarConflict &&
          (providedRows.length === 0 || rowsAreComplete)
            ? spatialEvidenceConflict
              ? Math.min(0.7, clampConfidence(value.confidence))
              : clampConfidence(value.confidence)
            : 0,
      },
      totalTickets: totalSlots,
      pastedTickets: coveredSlots,
      remainingTickets: consistent && unknownSlots === 0 ? openSlots : null,
      countConflict: rowScalarConflict,
    };
  });

  const blocks = [];
  const ipRawText =
    raw.ipRawText == null ? null : String(raw.ipRawText).trim() || null;
  const identity = canonicalizeIpTheme(raw.ipName, raw.themeName);
  const ipName = identity.ipName;
  if (ipName) {
    blocks.push({
      componentId: "series-identity",
      componentType: "series_identity",
      ticketCountRole: "excluded",
      rawText: ipName,
      origin: "recognized",
      confidence: clampConfidence(raw.confidence),
      layout: {
        region: "identity",
        boundingBox: { x: 0.08, y: 0.04, width: 0.62, height: 0.08 },
        parentId: null,
        zIndex: 1,
        readingOrder: tiers.length,
      },
      executable: false,
    });
  }
  const themeName = identity.themeName;
  if (themeName) {
    blocks.push({
      componentId: "board-theme",
      componentType: "board_theme",
      ticketCountRole: "excluded",
      rawText: themeName,
      origin: "recognized",
      confidence: clampConfidence(raw.confidence),
      layout: {
        region: "identity",
        boundingBox: { x: 0.08, y: 0.12, width: 0.62, height: 0.06 },
        parentId: null,
        zIndex: 1,
        readingOrder: tiers.length + blocks.length,
      },
      executable: false,
    });
  }
  const priceAmount =
    typeof raw.price?.amount === "number" ? raw.price.amount : NaN;
  const priceConfidence = clampConfidence(raw.price?.confidence);
  const hasPrice = Number.isFinite(priceAmount) && priceAmount > 0;
  const priceCurrency = ["CNY", "JPY", "OTHER"].includes(raw.price?.currency)
    ? raw.price.currency
    : "OTHER";
  if (String(raw.price?.rawText || "").trim()) {
    blocks.push({
      componentId: "price-block",
      componentType: "price",
      ticketCountRole: "excluded",
      rawText: String(raw.price.rawText).trim(),
      origin: "recognized",
      confidence: priceConfidence,
      layout: {
        region: "header",
        boundingBox: { x: 0.72, y: 0.04, width: 0.2, height: 0.08 },
        parentId: null,
        zIndex: 1,
        readingOrder: tiers.length + blocks.length,
      },
      executable: false,
    });
  }
  const readingOrder = [...tiers, ...blocks].map(
    (component) => component.componentId,
  );
  [...tiers, ...blocks].forEach((component, index) => {
    component.layout.readingOrder = index;
  });

  const issues = [];
  const reviewablePool =
    raw.target === "target_board" &&
    tiers.some((tier) => tier.slotObservation.totalSlots > 0);
  const frame = ["complete", "partial", "uncertain"].includes(raw.frame)
    ? raw.frame
    : "uncertain";
  const completenessConfidence = clampConfidence(raw.confidence);
  if (frame === "partial") {
    issues.push(
      issue(
        "FRAME_PARTIAL",
        "/draft/completeness/frame",
        reviewablePool ? "confirm_total_tickets" : "retake_image",
        completenessConfidence,
      ),
    );
  } else if (frame === "uncertain") {
    issues.push(
      issue(
        "FRAME_UNCERTAIN",
        "/draft/completeness/frame",
        reviewablePool ? "confirm_total_tickets" : "retake_image",
        completenessConfidence,
      ),
    );
  }
  if (!raw.allRegularTiersDetected) {
    issues.push(
      issue(
        "REGULAR_TIERS_INCOMPLETE",
        "/draft/tiers",
        reviewablePool ? "confirm_tier_label" : "retake_image",
        completenessConfidence,
      ),
    );
  }
  if (!raw.oneSlotOneTicketConfirmed) {
    issues.push(
      issue(
        "ONE_SLOT_ONE_TICKET_UNCONFIRMED",
        "/draft/completeness/oneSlotOneTicketConfirmed",
        "confirm_one_slot_one_ticket",
        completenessConfidence,
      ),
    );
  }
  if (tiers.length === 0) {
    issues.push(
      issue("NO_TIERS", "/draft/tiers", "retake_image", completenessConfidence),
    );
  }
  tiers.forEach((tier, index) => {
    if (tier.label === "OTHER") {
      issues.push(
        issue(
          "TIER_LABEL_OTHER",
          `/draft/tiers/${index}/label`,
          "confirm_tier_label",
          tier.confidence,
        ),
      );
    } else if (tier.confidence < HIGH_CONFIDENCE) {
      issues.push(
        issue(
          "TIER_LABEL_LOW_CONFIDENCE",
          `/draft/tiers/${index}/label`,
          "confirm_tier_label",
          tier.confidence,
        ),
      );
    }
    const slots = tier.slotObservation;
    if (slots.confidence < HIGH_CONFIDENCE) {
      issues.push(
        issue(
          "TIER_SLOT_LOW_CONFIDENCE",
          `/draft/tiers/${index}/slotObservation`,
          "correct_tier_slots",
          slots.confidence,
        ),
      );
    }
    const slotCountsAreComplete = [
      slots.totalSlots,
      slots.openSlots,
      slots.coveredSlots,
      slots.unknownSlots,
    ].every((value) => Number.isSafeInteger(value));
    if (
      !slotCountsAreComplete ||
      slots.openSlots + slots.coveredSlots + slots.unknownSlots !==
        slots.totalSlots
    ) {
      issues.push(
        issue(
          "TIER_SLOT_COUNT_INCONSISTENT",
          `/draft/tiers/${index}/slotObservation`,
          "correct_tier_slots",
        ),
      );
    }
    if (tier.countConflict) {
      issues.push(
        issue(
          "TICKET_COUNT_CONFLICT",
          `/draft/tiers/${index}/slotObservation`,
          "correct_tier_slots",
          slots.confidence,
        ),
      );
    }
    if (Number.isSafeInteger(slots.unknownSlots) && slots.unknownSlots > 0) {
      issues.push(
        issue(
          "UNKNOWN_SLOT_STATE",
          `/draft/tiers/${index}/slotObservation/unknownSlots`,
          "correct_tier_slots",
          slots.confidence,
        ),
      );
    }
  });
  if (!hasPrice) {
    issues.push(
      issue("PRICE_MISSING", "/draft/price", "fill_price", priceConfidence),
    );
  } else if (raw.price?.handwritten) {
    issues.push(
      issue("PRICE_HANDWRITTEN", "/draft/price", "fill_price", priceConfidence),
    );
  } else if (priceConfidence < HIGH_CONFIDENCE) {
    issues.push(
      issue(
        "PRICE_LOW_CONFIDENCE",
        "/draft/price",
        "confirm_price",
        priceConfidence,
      ),
    );
  }

  const retake = issues.some((item) => item.action === "retake_image");
  const needsUser = issues.some((item) => item.blocking);
  const sumKnown = (values) =>
    values.every((value) => Number.isSafeInteger(value))
      ? values.reduce((sum, value) => sum + value, 0)
      : null;
  const totalTickets = sumKnown(
    tiers.map((tier) => tier.slotObservation.totalSlots),
  );
  const remainingTickets = sumKnown(
    tiers.map((tier) => tier.slotObservation.openSlots),
  );
  const derivationBlocked = tiers.some((tier) => {
    const slots = tier.slotObservation;
    const complete = [
      slots.totalSlots,
      slots.openSlots,
      slots.coveredSlots,
      slots.unknownSlots,
    ].every((value) => Number.isSafeInteger(value));
    return (
      !complete ||
      slots.openSlots + slots.coveredSlots + slots.unknownSlots !==
        slots.totalSlots ||
      slots.unknownSlots > 0
    );
  });
  if (derivationBlocked) {
    issues.push(
      issue(
        "TOTAL_TICKETS_DERIVATION_BLOCKED",
        "/draft/derived/totalTickets",
        "confirm_total_tickets",
      ),
      issue(
        "REMAINING_TICKETS_DERIVATION_BLOCKED",
        "/draft/derived/remainingTickets",
        "confirm_remaining_tickets",
      ),
    );
  }

  const derivedCount = (value, formula) =>
    derivationBlocked
      ? {
          status: "manual_required",
          formula,
          origin: "derived",
          failedGuards: ["all_tier_slot_counts_consistent"],
        }
      : {
          status: "auto_confirmed",
          value,
          formula,
          origin: "derived",
        };
  const orientation =
    request.width === request.height
      ? "square"
      : request.width > request.height
        ? "landscape"
        : "portrait";
  const draft = {
    schemaVersion: BOARD_SCHEMA_VERSION,
    draftId: `draft-${request.requestId}`,
    image: {
      width: request.width,
      height: request.height,
      orientation,
      storedRemotely: false,
    },
    completeness: {
      frame,
      allRegularTiersDetected: Boolean(raw.allRegularTiersDetected),
      oneSlotOneTicketConfirmed: Boolean(raw.oneSlotOneTicketConfirmed),
      confidence: completenessConfidence,
    },
    ipName,
    ipRawText,
    themeName,
    price: hasPrice
      ? {
          status: "recognized",
          amount: priceAmount,
          currency: priceCurrency,
          rawText: String(raw.price?.rawText || priceAmount),
          origin: "recognized",
          confidence: priceConfidence,
        }
      : {
          status: "manual_required",
          rawText: String(raw.price?.rawText || ""),
          origin: "recognized",
          confidence: priceConfidence,
        },
    tiers,
    blocks,
    readingOrder,
    derived: {
      totalTickets: derivedCount(
        totalTickets,
        "sum(tiers.slotObservation.totalSlots)",
      ),
      remainingTickets: derivedCount(
        remainingTickets,
        "sum(tiers.slotObservation.openSlots)",
      ),
    },
  };
  return {
    contractVersion: CONTRACT_VERSION,
    requestId: request.requestId,
    status: retake
      ? "retake_required"
      : needsUser || derivationBlocked
        ? "needs_user_input"
        : "ready_for_confirmation",
    ...(retake ? {} : { draft }),
    issues,
    imageHandling: IMAGE_HANDLING,
  };
};

// Provider protocol 4 is deliberately small and semantic. The provider only
// describes what is visible in the one corrected board; this boundary owns
// canonical labels, pasted-ticket arithmetic, and the stable Recognition
// Contract shape. Keeping this as a separate normalizer also leaves the
// protocol-3 migration path explicit and one-way.
const normalizeV4Text = (value) => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).normalize("NFKC").trim();
  return normalized || null;
};

const canonicalizeV4Label = (rawLabel) => {
  const normalized = normalizeV4Text(rawLabel);
  if (!normalized) return { kind: "special", parent: null };
  const compact = normalized.toUpperCase().trim();
  const regular =
    /^([A-Z])([0-9]+)?\s*[赏賞]/u.exec(compact) ||
    /^([A-Z])([0-9]+)?$/u.exec(compact);
  if (regular) {
    const child = `${regular[1]}${regular[2] || ""}`;
    return {
      kind: "regular",
      parent: regular[1],
      child,
      numbered: Boolean(regular[2]),
    };
  }
  return { kind: "special", parent: null };
};

const computeV4Pasted = (tier) => {
  const pattern = tier?.ticketPattern;
  const total =
    tier?.totalTickets === null || tier?.totalTickets === undefined
      ? null
      : Number.isSafeInteger(tier.totalTickets) && tier.totalTickets >= 0
        ? tier.totalTickets
        : null;
  const evidence = tier?.evidence;
  const integerEvidence = (value) =>
    Number.isSafeInteger(value) && value >= 0 ? value : null;
  let value = null;
  let valid = true;
  if (pattern === "empty") {
    value = 0;
  } else if (pattern === "prefix") {
    const sequenceStart = integerEvidence(evidence?.sequenceStart);
    const firstOpen = integerEvidence(evidence?.firstOpen);
    valid =
      sequenceStart !== null &&
      firstOpen !== null &&
      sequenceStart >= 1 &&
      firstOpen >= sequenceStart &&
      (total === null ||
        (sequenceStart <= total + 1 && firstOpen <= total + 1));
    if (valid) {
      value = firstOpen - sequenceStart;
      if (total !== null && value > total) valid = false;
    }
  } else if (pattern === "full") {
    valid = total !== null;
    value = valid ? total : null;
  } else if (pattern === "irregular") {
    const direct = integerEvidence(evidence?.pastedDirect);
    valid = direct !== null && (total === null || direct <= total);
    value = valid ? direct : null;
  } else if (pattern === "unknown") {
    value = null;
  } else {
    valid = false;
  }
  return {
    total,
    value: valid ? value : null,
    valid,
    pattern,
  };
};

const sumNullableIntegers = (values) =>
  values.every((value) => Number.isSafeInteger(value) && value >= 0)
    ? values.reduce((sum, value) => sum + value, 0)
    : null;

const normalizeV4Extraction = (raw, request, metrics = {}) => {
  const startedAt = Date.now();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("provider_invalid_json_shape");
  }
  if (
    !validateLegacyV4ProviderExtraction ||
    !validateLegacyV4ProviderExtraction(raw)
  ) {
    const error = createRecognitionError("provider_schema_invalid");
    error.schemaIssues = (validateLegacyV4ProviderExtraction?.errors || [])
      .slice(0, 12)
      .map((item) => ({
        instancePath: item.instancePath,
        keyword: item.keyword,
        ...(item.keyword === "additionalProperties" &&
        typeof item.params?.additionalProperty === "string"
          ? { additionalProperty: item.params.additionalProperty }
          : {}),
      }));
    throw error;
  }

  const rawTiers = raw.tiers.map((tier, index) => {
    const labelInfo = canonicalizeV4Label(tier.rawLabel);
    const pasted = computeV4Pasted(tier);
    const rawLabel = normalizeV4Text(tier.rawLabel);
    const prizeName = normalizeV4Text(tier.prizeName);
    return {
      index,
      labelInfo,
      rawLabel,
      prizeName,
      total: pasted.total,
      pasted: pasted.value,
      patternValid: pasted.valid,
      confidence: clampConfidence(tier.confidence),
    };
  });

  // Aggregate regular letter variants only after each raw tier's pasted
  // arithmetic has been checked. Special/non-matching tiers always retain
  // their visual order and receive deterministic SP labels.
  const groups = [];
  const regularGroups = new Map();
  let specialOrdinal = 0;
  for (const entry of rawTiers) {
    let group;
    if (entry.labelInfo.kind === "regular") {
      group = regularGroups.get(entry.labelInfo.parent);
      if (!group) {
        group = {
          label: entry.labelInfo.parent,
          entries: [],
          rawLabels: [],
          prizeNames: [],
          confidence: 1,
          countConflict: false,
        };
        regularGroups.set(entry.labelInfo.parent, group);
        groups.push(group);
      }
    } else {
      specialOrdinal += 1;
      group = {
        label: specialOrdinal <= 32 ? `SP${specialOrdinal}` : "OTHER",
        entries: [],
        rawLabels: [],
        prizeNames: [],
        confidence: 1,
        countConflict: false,
      };
      groups.push(group);
    }
    group.entries.push(entry);
    if (entry.rawLabel) group.rawLabels.push(entry.rawLabel);
    if (entry.prizeName) group.prizeNames.push(entry.prizeName);
    group.confidence = Math.min(group.confidence, entry.confidence);
    group.countConflict ||= !entry.patternValid;
  }

  const tiers = groups.map((group, index) => {
    const countEntries = group.entries.every(
      (entry) => entry.labelInfo.kind === "special",
    )
      ? group.entries
      : Array.from(
          group.entries
            .reduce((children, entry) => {
              const childKey = entry.labelInfo.child;
              const child = children.get(childKey) || {
                totals: [],
                pasted: [],
                valid: false,
              };
              if (Number.isSafeInteger(entry.total))
                child.totals.push(entry.total);
              if (entry.patternValid && Number.isSafeInteger(entry.pasted))
                child.pasted.push(entry.pasted);
              child.valid ||= entry.patternValid;
              children.set(childKey, child);
              return children;
            }, new Map())
            .values(),
        ).map((child) => {
          const distinctTotals = Array.from(new Set(child.totals));
          if (distinctTotals.length > 1) group.countConflict = true;
          return {
            total:
              distinctTotals.length === 0 ? null : Math.max(...distinctTotals),
            pasted:
              child.pasted.length === 0 ? null : Math.max(...child.pasted),
            patternValid: child.valid,
          };
        });
    const totalTickets = sumNullableIntegers(
      countEntries.map((entry) => entry.total),
    );
    const pastedTickets = sumNullableIntegers(
      countEntries.map((entry) => entry.pasted),
    );
    if (
      totalTickets !== null &&
      pastedTickets !== null &&
      pastedTickets > totalTickets
    ) {
      group.countConflict = true;
    }
    const safeCounts =
      totalTickets !== null &&
      pastedTickets !== null &&
      pastedTickets <= totalTickets;
    const pastedEvidenceValid =
      pastedTickets !== null &&
      !group.countConflict &&
      (totalTickets === null || pastedTickets <= totalTickets);
    const openSlots = safeCounts ? totalTickets - pastedTickets : null;
    const unknownSlots = safeCounts ? 0 : null;
    const tierBox = normalizeBox(null, index, groups.length);
    const rawLabel =
      group.rawLabels
        .filter(
          (value, valueIndex, values) => values.indexOf(value) === valueIndex,
        )
        .join(" / ") || `${group.label}赏`;
    const prizeName = group.prizeNames
      .filter(
        (value, valueIndex, values) => values.indexOf(value) === valueIndex,
      )
      .join(" / ");
    const slotConfidence = group.countConflict
      ? 0
      : pastedEvidenceValid
        ? group.confidence
        : 0;
    const tier = {
      componentId: `tier-${group.label.toLowerCase()}-${index + 1}`,
      componentType: "prize_tier",
      label: group.label,
      rawLabel,
      ...(prizeName ? { prizeName } : {}),
      origin: "recognized",
      confidence: group.confidence,
      layout: {
        region: "tier_grid",
        boundingBox: tierBox,
        parentId: null,
        zIndex: 1,
        readingOrder: index,
      },
      slotObservation: {
        totalSlots: totalTickets,
        openSlots,
        coveredSlots: pastedEvidenceValid ? pastedTickets : null,
        unknownSlots,
        arrangement: {
          direction: "wrapped_rows",
          rows: Math.max(1, Math.ceil(Math.max(1, totalTickets || 1) / 8)),
          columns: Math.max(1, Math.min(8, totalTickets || 1)),
        },
        confidence: slotConfidence,
      },
      totalTickets,
      pastedTickets: pastedEvidenceValid ? pastedTickets : null,
      remainingTickets: safeCounts ? openSlots : null,
      countConflict: group.countConflict,
    };
    return tier;
  });

  const ipRawText = normalizeV4Text(raw.ipRawText);
  const identity = canonicalizeIpTheme(
    normalizeV4Text(raw.ipName),
    normalizeV4Text(raw.themeName),
  );
  const ipName = identity.ipName;
  const themeName = identity.themeName;
  const blocks = [];
  if (ipName) {
    blocks.push({
      componentId: "series-identity",
      componentType: "series_identity",
      ticketCountRole: "excluded",
      rawText: ipName,
      origin: "recognized",
      confidence: clampConfidence(raw.confidence),
      layout: {
        region: "identity",
        boundingBox: { x: 0.08, y: 0.04, width: 0.62, height: 0.08 },
        parentId: null,
        zIndex: 1,
        readingOrder: tiers.length,
      },
      executable: false,
    });
  }
  if (themeName) {
    blocks.push({
      componentId: "board-theme",
      componentType: "board_theme",
      ticketCountRole: "excluded",
      rawText: themeName,
      origin: "recognized",
      confidence: clampConfidence(raw.confidence),
      layout: {
        region: "identity",
        boundingBox: { x: 0.08, y: 0.12, width: 0.62, height: 0.06 },
        parentId: null,
        zIndex: 1,
        readingOrder: tiers.length + blocks.length,
      },
      executable: false,
    });
  }
  const priceAmount = raw.price.amount;
  const hasPrice = Number.isSafeInteger(priceAmount) && priceAmount > 0;
  const priceConfidence = clampConfidence(raw.price.confidence);
  const priceCurrency = ["CNY", "JPY", "OTHER"].includes(raw.price.currency)
    ? raw.price.currency
    : "OTHER";
  const rawPriceText = normalizeV4Text(raw.price.rawText);
  if (rawPriceText) {
    blocks.push({
      componentId: "price-block",
      componentType: "price",
      ticketCountRole: "excluded",
      rawText: rawPriceText,
      origin: "recognized",
      confidence: priceConfidence,
      layout: {
        region: "header",
        boundingBox: { x: 0.72, y: 0.04, width: 0.2, height: 0.08 },
        parentId: null,
        zIndex: 1,
        readingOrder: tiers.length + blocks.length,
      },
      executable: false,
    });
  }
  const readingOrder = [...tiers, ...blocks].map(
    (component) => component.componentId,
  );
  [...tiers, ...blocks].forEach((component, index) => {
    component.layout.readingOrder = index;
  });

  const issues = [];
  const reviewablePool = tiers.length > 0;
  const frame = ["complete", "partial", "uncertain"].includes(raw.frame)
    ? raw.frame
    : "uncertain";
  const completenessConfidence = clampConfidence(raw.confidence);
  if (frame === "partial" || frame === "uncertain") {
    issues.push(
      issue(
        frame === "partial" ? "FRAME_PARTIAL" : "FRAME_UNCERTAIN",
        "/draft/completeness/frame",
        reviewablePool ? "confirm_total_tickets" : "retake_image",
        completenessConfidence,
      ),
    );
  }
  if (!raw.allRegularTiersDetected) {
    issues.push(
      issue(
        "REGULAR_TIERS_INCOMPLETE",
        "/draft/tiers",
        reviewablePool ? "confirm_tier_label" : "retake_image",
        completenessConfidence,
      ),
    );
  }
  if (!raw.oneSlotOneTicketConfirmed) {
    issues.push(
      issue(
        "ONE_SLOT_ONE_TICKET_UNCONFIRMED",
        "/draft/completeness/oneSlotOneTicketConfirmed",
        "confirm_one_slot_one_ticket",
        completenessConfidence,
      ),
    );
  }
  if (tiers.length === 0) {
    issues.push(
      issue("NO_TIERS", "/draft/tiers", "retake_image", completenessConfidence),
    );
  }
  tiers.forEach((tier, index) => {
    if (tier.label === "OTHER") {
      issues.push(
        issue(
          "TIER_LABEL_OTHER",
          `/draft/tiers/${index}/label`,
          "confirm_tier_label",
          tier.confidence,
        ),
      );
    } else if (tier.confidence < HIGH_CONFIDENCE) {
      issues.push(
        issue(
          "TIER_LABEL_LOW_CONFIDENCE",
          `/draft/tiers/${index}/label`,
          "confirm_tier_label",
          tier.confidence,
        ),
      );
    }
    const slots = tier.slotObservation;
    const countsComplete =
      Number.isSafeInteger(slots.totalSlots) &&
      Number.isSafeInteger(slots.openSlots) &&
      Number.isSafeInteger(slots.coveredSlots) &&
      Number.isSafeInteger(slots.unknownSlots) &&
      slots.openSlots + slots.coveredSlots + slots.unknownSlots ===
        slots.totalSlots;
    if (slots.confidence < HIGH_CONFIDENCE) {
      issues.push(
        issue(
          "TIER_SLOT_LOW_CONFIDENCE",
          `/draft/tiers/${index}/slotObservation`,
          "correct_tier_slots",
          slots.confidence,
        ),
      );
    }
    if (!countsComplete || tier.countConflict) {
      issues.push(
        issue(
          "TIER_SLOT_COUNT_INCONSISTENT",
          `/draft/tiers/${index}/slotObservation`,
          "correct_tier_slots",
          slots.confidence,
        ),
      );
    }
    if (Number.isSafeInteger(slots.unknownSlots) && slots.unknownSlots > 0) {
      issues.push(
        issue(
          "UNKNOWN_SLOT_STATE",
          `/draft/tiers/${index}/slotObservation/unknownSlots`,
          "correct_tier_slots",
          slots.confidence,
        ),
      );
    }
  });
  if (!hasPrice) {
    issues.push(
      issue("PRICE_MISSING", "/draft/price", "fill_price", priceConfidence),
    );
  } else if (raw.price.handwritten === true) {
    issues.push(
      issue("PRICE_HANDWRITTEN", "/draft/price", "fill_price", priceConfidence),
    );
  } else if (priceConfidence < HIGH_CONFIDENCE) {
    issues.push(
      issue(
        "PRICE_LOW_CONFIDENCE",
        "/draft/price",
        "confirm_price",
        priceConfidence,
      ),
    );
  }

  const totalTickets = sumNullableIntegers(
    tiers.map((tier) => tier.slotObservation.totalSlots),
  );
  const remainingTickets = sumNullableIntegers(
    tiers.map((tier) => tier.slotObservation.openSlots),
  );
  const derivationBlocked = tiers.some((tier) => {
    const slots = tier.slotObservation;
    return (
      !Number.isSafeInteger(slots.totalSlots) ||
      !Number.isSafeInteger(slots.openSlots) ||
      !Number.isSafeInteger(slots.coveredSlots) ||
      !Number.isSafeInteger(slots.unknownSlots) ||
      slots.openSlots + slots.coveredSlots + slots.unknownSlots !==
        slots.totalSlots ||
      tier.countConflict
    );
  });
  if (derivationBlocked) {
    issues.push(
      issue(
        "TOTAL_TICKETS_DERIVATION_BLOCKED",
        "/draft/derived/totalTickets",
        "confirm_total_tickets",
      ),
      issue(
        "REMAINING_TICKETS_DERIVATION_BLOCKED",
        "/draft/derived/remainingTickets",
        "confirm_remaining_tickets",
      ),
    );
  }
  const derivedCount = (value, formula) =>
    derivationBlocked
      ? {
          status: "manual_required",
          formula,
          origin: "derived",
          failedGuards: ["all_tier_slot_counts_consistent"],
        }
      : { status: "auto_confirmed", value, formula, origin: "derived" };
  const orientation =
    request.width === request.height
      ? "square"
      : request.width > request.height
        ? "landscape"
        : "portrait";
  const draft = {
    schemaVersion: BOARD_SCHEMA_VERSION,
    draftId: `draft-${request.requestId}`,
    image: {
      width: request.width,
      height: request.height,
      orientation,
      storedRemotely: false,
    },
    completeness: {
      frame,
      allRegularTiersDetected: Boolean(raw.allRegularTiersDetected),
      oneSlotOneTicketConfirmed: Boolean(raw.oneSlotOneTicketConfirmed),
      confidence: completenessConfidence,
    },
    ipName,
    ipRawText,
    themeName,
    price: hasPrice
      ? {
          status: "recognized",
          amount: priceAmount,
          currency: priceCurrency,
          rawText: rawPriceText || String(priceAmount),
          origin: "recognized",
          confidence: priceConfidence,
        }
      : {
          status: "manual_required",
          rawText: rawPriceText || "",
          origin: "recognized",
          confidence: priceConfidence,
        },
    tiers,
    blocks,
    readingOrder,
    derived: {
      totalTickets: derivedCount(
        totalTickets,
        "sum(tiers.slotObservation.totalSlots)",
      ),
      remainingTickets: derivedCount(
        remainingTickets,
        "sum(tiers.slotObservation.openSlots)",
      ),
    },
  };
  metrics.totalFunctionMs = Date.now() - startedAt;
  const retake = tiers.length === 0;
  const needsUser = issues.some((item) => item.blocking);
  return {
    contractVersion: CONTRACT_VERSION,
    requestId: request.requestId,
    status: retake
      ? "retake_required"
      : needsUser || derivationBlocked
        ? "needs_user_input"
        : "ready_for_confirmation",
    ...(retake ? {} : { draft }),
    issues,
    imageHandling: IMAGE_HANDLING,
  };
};

const computeV5Counts = (tier) => {
  const mode = tier?.countMode;
  const evidence = tier?.evidence || {};
  const integer = (value) =>
    Number.isSafeInteger(value) && value >= 0 ? value : null;
  const totalCount = integer(evidence.totalCount);
  const sequenceStart = integer(evidence.sequenceStartOrdinal);
  const firstOpen = integer(evidence.firstOpenOrdinal);
  const pastedCount = integer(evidence.pastedCount);
  const remainingCount = integer(evidence.remainingCount);
  let total = null;
  let pasted = null;
  let remaining = null;
  let valid = true;

  if (mode === "numbered_prefix") {
    valid =
      totalCount !== null &&
      totalCount >= 1 &&
      sequenceStart !== null &&
      sequenceStart >= 1 &&
      firstOpen !== null &&
      firstOpen >= sequenceStart &&
      firstOpen <= totalCount + 1;
    if (valid) {
      total = totalCount;
      pasted = firstOpen - sequenceStart;
      remaining = total - pasted;
    }
  } else if (mode === "pasted_plus_remaining") {
    valid = pastedCount !== null && remainingCount !== null;
    if (valid) {
      pasted = pastedCount;
      remaining = remainingCount;
      total = pasted + remaining;
    }
  } else if (mode === "pasted_full") {
    valid = pastedCount !== null && pastedCount >= 1;
    if (valid) {
      total = pastedCount;
      pasted = pastedCount;
      remaining = 0;
    }
  } else if (mode === "pasted_direct") {
    valid =
      totalCount !== null &&
      totalCount >= 1 &&
      pastedCount !== null &&
      pastedCount <= totalCount;
    if (valid) {
      total = totalCount;
      pasted = pastedCount;
      remaining = total - pasted;
    }
  } else if (mode === "empty") {
    valid = totalCount === null || totalCount >= 1;
    total = valid ? totalCount : null;
    pasted = valid ? 0 : null;
    remaining = valid && total !== null ? total : null;
  } else if (mode === "unknown") {
    total = totalCount;
    pasted = null;
    remaining = null;
  } else {
    valid = false;
  }

  if (
    total !== null &&
    (!Number.isSafeInteger(total) || total < 0 || total > 200)
  ) {
    valid = false;
  }
  return {
    total: valid ? total : null,
    pasted: valid ? pasted : null,
    remaining: valid ? remaining : null,
    valid,
    mode,
  };
};

const normalizeV5Extraction = (raw, request, metrics = {}) => {
  if (!validateV5ProviderExtraction?.(raw)) {
    const error = createRecognitionError("provider_schema_invalid");
    error.schemaIssues = (validateV5ProviderExtraction?.errors || [])
      .slice(0, 12)
      .map((item) => ({
        instancePath: item.instancePath,
        keyword: item.keyword,
        ...(item.keyword === "additionalProperties" &&
        typeof item.params?.additionalProperty === "string"
          ? { additionalProperty: item.params.additionalProperty }
          : {}),
      }));
    throw error;
  }
  const legacyShaped = {
    protocolVersion: "4.0.0-rc1",
    frame: raw.frame,
    allRegularTiersDetected: raw.allRegularTiersDetected,
    oneSlotOneTicketConfirmed: raw.oneSlotOneTicketConfirmed,
    confidence: raw.confidence,
    ipName: raw.ipName,
    ipRawText: raw.ipRawText,
    themeName: raw.themeName,
    price: raw.price,
    tiers: raw.tiers.map((tier) => {
      const counts = computeV5Counts(tier);
      if (!counts.valid) {
        return {
          rawLabel: tier.rawLabel,
          prizeName: tier.prizeName,
          totalTickets:
            Number.isSafeInteger(tier.evidence.totalCount) &&
            tier.evidence.totalCount >= 1
              ? tier.evidence.totalCount
              : null,
          ticketPattern: "unknown",
          evidence: {
            sequenceStart: null,
            firstOpen: null,
            pastedDirect: null,
          },
          confidence: 0,
        };
      }
      return {
        rawLabel: tier.rawLabel,
        prizeName: tier.prizeName,
        totalTickets: counts.total,
        ticketPattern:
          tier.countMode === "numbered_prefix"
            ? "prefix"
            : tier.countMode === "pasted_full"
              ? "full"
              : tier.countMode === "empty"
                ? "empty"
                : tier.countMode === "unknown"
                  ? "unknown"
                  : "irregular",
        evidence: {
          sequenceStart:
            tier.countMode === "numbered_prefix"
              ? tier.evidence.sequenceStartOrdinal
              : null,
          firstOpen:
            tier.countMode === "numbered_prefix"
              ? tier.evidence.firstOpenOrdinal
              : null,
          pastedDirect:
            tier.countMode === "pasted_plus_remaining" ||
            tier.countMode === "pasted_direct"
              ? counts.pasted
              : null,
        },
        confidence: tier.confidence,
      };
    }),
    warnings: raw.warnings,
  };
  return normalizeV4Extraction(legacyShaped, request, metrics);
};

const isV5ProviderDraft = (value) =>
  value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  value.protocolVersion === "5.0.0-rc1";

const isV4ProviderDraft = (value) =>
  value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  value.protocolVersion === "4.0.0-rc1";

const normalizeExtraction = (raw, request, metrics = {}) =>
  isV5ProviderDraft(raw)
    ? normalizeV5Extraction(raw, request, metrics)
    : isV4ProviderDraft(raw)
      ? normalizeV4Extraction(raw, request, metrics)
      : normalizeLegacyExtraction(raw, request);

const normalizeForRecognitionMode = (raw, request, metrics, modeConfig) => {
  if (modeConfig.mode === RECOGNITION_MODE_R2)
    return normalizeR2Extraction(raw, request, metrics, {
      canonicalizeIpTheme,
    });
  if (modeConfig.mode === RECOGNITION_MODE_HYBRID)
    return normalizeHybridExtraction(raw, request, metrics, {
      canonicalizeIpTheme,
    });
  const resolved = resolveR1Extraction(raw);
  const normalized = normalizeHybridExtraction(
    resolved.normalized,
    request,
    metrics,
    { canonicalizeIpTheme, countAuthority: "remaining" },
  );
  return {
    contract: normalized.contract,
    trace: { ...normalized.trace, resolver: resolved.trace },
  };
};

const validateEvent = (event) => {
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    return { requestId: "unknown", error: "EVENT_INVALID" };
  }
  const requestId =
    typeof event.requestId === "string" && event.requestId.trim()
      ? event.requestId.trim()
      : "unknown";
  if (event.contractVersion !== CONTRACT_VERSION) {
    return { requestId, error: "CONTRACT_VERSION_UNSUPPORTED" };
  }
  const jobId = event.recognitionJobId;
  const imageFileId = event.imageFileId;
  const jobToken = event.recognitionJobToken;
  if (
    typeof jobId !== "string" ||
    !jobId ||
    typeof jobToken !== "string" ||
    !jobToken ||
    typeof imageFileId !== "string"
  ) {
    return { requestId, error: "IMAGE_INPUT_INVALID" };
  }
  const safeJobId = jobId.replace(/[^a-zA-Z0-9_-]/gu, "-").slice(0, 96);
  if (
    !/^cloud:\/\//u.test(imageFileId) ||
    !imageFileId.includes(`/recognition-temp/${safeJobId}/`)
  ) {
    return { requestId, error: "IMAGE_INPUT_INVALID" };
  }
  const byteLength =
    typeof event.image?.byteLength === "number" &&
    Number.isSafeInteger(event.image.byteLength)
      ? event.image.byteLength
      : -1;
  if (byteLength < 1 || byteLength > PROVIDER_HARD_IMAGE_BYTES) {
    return { requestId, error: "IMAGE_TOO_LARGE" };
  }
  const width =
    typeof event.image?.width === "number" &&
    Number.isSafeInteger(event.image.width)
      ? event.image.width
      : -1;
  const height =
    typeof event.image?.height === "number" &&
    Number.isSafeInteger(event.image.height)
      ? event.image.height
      : -1;
  const longEdge = Math.max(width, height);
  const shortEdge = Math.min(width, height);
  if (
    shortEdge <= 10 ||
    longEdge > 7680 ||
    shortEdge > 4320 ||
    longEdge / shortEdge > 200
  ) {
    return { requestId, error: "IMAGE_DIMENSIONS_INVALID" };
  }
  const mediaType = String(event.image?.mediaType || "");
  if (!/^image\/(?:jpeg|png|webp)$/u.test(mediaType)) {
    return { requestId, error: "IMAGE_MEDIA_TYPE_INVALID" };
  }
  if (event.image?.acquisition !== "camera") {
    return { requestId, error: "IMAGE_ACQUISITION_INVALID" };
  }
  return {
    requestId,
    request: {
      requestId,
      width,
      height,
      byteLength,
      mediaType,
      acquisition: event.image.acquisition,
      imageFileId,
      recognitionJobToken: jobToken,
    },
  };
};

const main = async function main(event = {}, runtime = {}) {
  const validated = validateEvent(event);
  if (validated.error) {
    return serviceError(validated.requestId, "SERVICE_ERROR", validated.error);
  }
  const env = runtime.env || process.env;
  let recognitionContext;
  try {
    recognitionContext = resolveRecognitionContext(event, env);
  } catch (error) {
    return serviceError(
      validated.requestId,
      "SERVICE_ERROR",
      error?.code || "BOARD_RECOGNITION_MODE_INVALID",
    );
  }
  const { modeConfig, internalSmoke } = recognitionContext;
  const apiKey = env.DASHSCOPE_API_KEY;
  const workspaceId = env.DASHSCOPE_WORKSPACE_ID;
  const jobGuard =
    runtime.jobGuard ||
    (internalSmoke ? createInternalSmokeJobGuard() : createCloudJobGuard());
  const imageStore = runtime.imageStore || createCloudImageStore();
  const enqueueStorageCleanup =
    runtime.enqueueStorageCleanup || enqueueCloudStorageCleanup;
  const logger = runtime.logger || console;
  const metrics = {
    totalStartedAt: Date.now(),
    inputBytes: validated.request.byteLength,
    inputPixels: validated.request.width * validated.request.height,
  };
  let claimedJob;
  let temporaryImageClaimed = false;
  let outcome = "service_error";
  let hybridTrace = null;
  const diagnosticCapture =
    internalSmoke && event.internalDiagnostics === true
      ? {
          providerRequestId: null,
          rawMessageContent: null,
          jsonParse: { pass: false, error: "NOT_REACHED" },
          parsedJson: null,
          ajv: { reached: false, pass: false, errors: [] },
        }
      : null;
  try {
    let stageStartedAt = Date.now();
    claimedJob = await jobGuard.claim(event);
    metrics.claimMs = Date.now() - stageStartedAt;
    temporaryImageClaimed = true;
    if (!apiKey || !workspaceId)
      throw createRecognitionError("RECOGNITION_PROVIDER_NOT_CONFIGURED");
    stageStartedAt = Date.now();
    let imageUrl;
    try {
      imageUrl = await imageStore.getTemporaryUrl(
        validated.request.imageFileId,
      );
    } catch {
      throw createRecognitionError("TEMP_URL_FAILED");
    }
    metrics.imageUrlMs = Date.now() - stageStartedAt;
    const observation = await callProvider({
      fetchImpl: runtime.fetchImpl || fetch,
      apiKey,
      workspaceId,
      region: env.DASHSCOPE_REGION || "cn-beijing",
      model: PRIMARY_MODEL,
      imageUrl,
      metrics,
      modeConfig,
      diagnosticCapture,
    });
    stageStartedAt = Date.now();
    let normalized;
    try {
      normalized = normalizeForRecognitionMode(
        observation,
        validated.request,
        metrics,
        modeConfig,
      );
      metrics.normalizePass = true;
    } catch (error) {
      metrics.normalizePass = false;
      if (!error.code) error.code = "NORMALIZE_FAILED";
      throw error;
    }
    const result = normalized.contract;
    hybridTrace = normalized.trace;
    metrics.tierCount = result.draft?.tiers?.length || 0;
    metrics.partialTierCount =
      result.draft?.tiers?.filter(
        (tier) => tier.totalTickets === null || tier.pastedTickets === null,
      ).length || 0;
    metrics.normalizeMs = Date.now() - stageStartedAt;
    if (result.status === "retake_required") {
      // A retake is a terminal recognition failure for this image. Release
      // the reservation and never persist the editable draft as succeeded.
      await jobGuard.fail(claimedJob, "RECOGNITION_RETAKE_REQUIRED");
      metrics.persistMs = 0;
      outcome = result.status;
      claimedJob = undefined;
      return internalSmoke && event.internalDiagnostics === true
        ? {
            ...result,
            internalDiagnostics: {
              ...extractProviderEvidence(
                observation,
                metrics,
                modeConfig,
                hybridTrace,
              ),
              schemaHash: modeConfig.schemaHash,
              modelSettings: {
                model: PRIMARY_MODEL,
                enableThinking: false,
                temperature: 0,
                responseFormat: "json_object",
                maxPixels: MODEL_MAX_PIXELS,
              },
              providerDiagnostic: diagnosticCapture,
              recognitionContract: result,
            },
          }
        : result;
    }
    stageStartedAt = Date.now();
    await jobGuard.succeed(
      claimedJob,
      result,
      extractProviderEvidence(observation, metrics, modeConfig, hybridTrace),
    );
    metrics.persistMs = Date.now() - stageStartedAt;
    outcome = result.status;
    return internalSmoke && event.internalDiagnostics === true
      ? {
          ...result,
          internalDiagnostics: {
            ...extractProviderEvidence(
              observation,
              metrics,
              modeConfig,
              hybridTrace,
            ),
            schemaHash: modeConfig.schemaHash,
            modelSettings: {
              model: PRIMARY_MODEL,
              enableThinking: false,
              temperature: 0,
              responseFormat: "json_object",
              maxPixels: MODEL_MAX_PIXELS,
            },
            providerDiagnostic: diagnosticCapture,
            recognitionContract: result,
          },
        }
      : result;
  } catch (error) {
    const timedOut = error?.name === "AbortError";
    const schemaInvalid = error?.message === "provider_schema_invalid";
    const guardedReason =
      typeof error?.code === "string" &&
      /^(?:RECOGNITION_JOB_|QUOTA_)/u.test(error.code)
        ? error.code
        : null;
    const providerReason =
      typeof error?.code === "string" &&
      /^RECOGNITION_PROVIDER_(?:AUTH_FAILED|ERROR|MODEL_NOT_FOUND|RATE_LIMITED|REQUEST_INVALID|RESPONSE_INVALID|TIMEOUT)$/u.test(
        error.code,
      )
        ? error.code
        : null;
    const technicalErrorType = timedOut
      ? "PROVIDER_TIMEOUT"
      : error?.code === "TEMP_URL_FAILED"
        ? "TEMP_URL_FAILED"
        : schemaInvalid
          ? "PROVIDER_SCHEMA_INVALID"
          : error?.code === "NORMALIZE_FAILED"
            ? "NORMALIZE_FAILED"
            : providerReason === "RECOGNITION_PROVIDER_RESPONSE_INVALID"
              ? "PROVIDER_JSON_INVALID"
              : providerReason
                ? "PROVIDER_HTTP_ERROR"
                : null;
    const reasonCode = timedOut
      ? "RECOGNITION_PROVIDER_TIMEOUT"
      : schemaInvalid
        ? "RECOGNITION_SCHEMA_INVALID"
        : guardedReason ||
          providerReason ||
          (error?.code === "RECOGNITION_PROVIDER_NOT_CONFIGURED"
            ? error.code
            : error?.code === "TEMP_URL_FAILED" ||
                error?.code === "NORMALIZE_FAILED"
              ? error.code
              : "RECOGNITION_PROVIDER_ERROR");
    if (providerReason) {
      logger.error("recognize_board_provider_failure", {
        requestId: validated.requestId,
        reasonCode,
        ...(error.providerDiagnostic || {
          stage: "provider_unknown",
          httpStatus: null,
          providerCode: null,
          contentType: null,
        }),
      });
    }
    if (schemaInvalid) {
      logger.error("recognize_board_schema_invalid", {
        requestId: validated.requestId,
        issues: Array.isArray(error.schemaIssues) ? error.schemaIssues : [],
      });
    }
    if (technicalErrorType) {
      logger.error("recognize_board_technical_failure", {
        requestId: validated.requestId,
        recognitionMode: modeConfig.mode,
        technicalErrorType,
      });
    }
    if (claimedJob) {
      try {
        await jobGuard.fail(claimedJob, reasonCode);
      } catch {
        // A processing lease remains for the scheduled reconciler. Do not
        // replace the allowlisted public error with database internals.
      }
    }
    const failure = serviceError(
      validated.requestId,
      timedOut ? "SERVICE_TIMEOUT" : "SERVICE_ERROR",
      reasonCode,
    );
    return diagnosticCapture
      ? {
          ...failure,
          internalDiagnostics: {
            recognitionMode: modeConfig.mode,
            protocolVersion: modeConfig.protocolVersion,
            promptVersion: modeConfig.promptVersion,
            promptHash: modeConfig.promptHash,
            schemaVersion: modeConfig.schemaVersion,
            schemaHash: modeConfig.schemaHash,
            providerRequestId:
              diagnosticCapture.providerRequestId ||
              metrics.providerRequestId ||
              null,
            modelSettings: {
              model: PRIMARY_MODEL,
              enableThinking: false,
              temperature: 0,
              responseFormat: "json_object",
              maxPixels: MODEL_MAX_PIXELS,
            },
            performance: {
              providerRequestMs: asInteger(metrics.providerRequestMs),
              providerTotalMs: asInteger(metrics.providerTotalMs),
              jsonParseMs: asInteger(metrics.jsonParseMs),
              ajvMs: asInteger(metrics.ajvMs),
              promptTokens: asInteger(metrics.promptTokens),
              imageTokens: asInteger(metrics.imageTokens),
              completionTokens: asInteger(metrics.completionTokens),
              totalTokens: asInteger(metrics.totalTokens),
              outputChars: asInteger(metrics.outputChars),
            },
            providerDiagnostic: diagnosticCapture,
            resolverTrace: hybridTrace,
            recognitionContract: null,
          },
        }
      : failure;
  } finally {
    logger.info?.("recognize_board_performance", {
      requestId: validated.requestId,
      outcome,
      recognitionMode: modeConfig.mode,
      internalSmoke,
      model: PRIMARY_MODEL,
      promptVersion: modeConfig.promptVersion,
      promptHash: modeConfig.promptHash,
      providerProtocolVersion: modeConfig.protocolVersion,
      schemaVersion: modeConfig.schemaVersion,
      providerRequestId: metrics.providerRequestId || null,
      maxPixels: MODEL_MAX_PIXELS,
      mediaType: validated.request.mediaType,
      totalMs: Date.now() - metrics.totalStartedAt,
      inputBytes: metrics.inputBytes,
      inputPixels: metrics.inputPixels,
      claimMs: metrics.claimMs || 0,
      imageUrlMs: metrics.imageUrlMs || 0,
      providerMs: metrics.providerMs || 0,
      providerRequestMs: metrics.providerRequestMs || 0,
      providerTotalMs: metrics.providerTotalMs || 0,
      normalizeMs: metrics.normalizeMs || 0,
      normalizePass: metrics.normalizePass === true,
      jsonParseMs: metrics.jsonParseMs || 0,
      ajvMs: metrics.ajvMs || 0,
      ajvPass: metrics.ajvPass === true,
      providerSchemaMs: metrics.providerSchemaMs || 0,
      totalFunctionMs: metrics.totalFunctionMs || 0,
      persistMs: metrics.persistMs || 0,
      promptTokens: metrics.promptTokens || 0,
      imageTokens: metrics.imageTokens || 0,
      completionTokens: metrics.completionTokens || 0,
      totalTokens: metrics.totalTokens || 0,
      outputChars: metrics.outputChars || 0,
      tierCount: metrics.tierCount || 0,
      rawSpecialItemCount: hybridTrace?.rawSpecialItemCount || 0,
      normalizedSpecialItemCount: hybridTrace?.normalizedSpecialItemCount || 0,
      partialTierCount:
        hybridTrace?.partialTierCount || metrics.partialTierCount || 0,
      countRangeIssueCount: hybridTrace?.countRangeIssueCount || 0,
    });
    if (temporaryImageClaimed) {
      try {
        await imageStore.delete(validated.request.imageFileId);
      } catch {
        try {
          await enqueueStorageCleanup({
            fileId: validated.request.imageFileId,
            ownerAccountId: claimedJob?.ownerAccountId,
          });
        } catch {
          // The client also deletes after the call. Platform lifecycle remains
          // the final guard if both application cleanup paths are unavailable.
        }
      }
    }
    if (typeof event.imageFileId === "string") event.imageFileId = "";
  }
};

exports.main = main;
exports.__test = {
  adaptProviderDraftShape,
  adaptRc1Observation,
  buildProviderUrl,
  callProvider,
  canonicalizeIpName,
  canonicalizeIpTheme,
  canonicalizeThemeName,
  createProviderError,
  providerReasonFromStatus,
  sanitizeProviderCode,
  sanitizeStructuredResult,
  computeV4Pasted,
  computeV5Counts,
  normalizeV5Extraction,
  normalizeV4Extraction,
  normalizeForRecognitionMode,
  normalizeExtraction,
  resolveRecognitionMode,
  resolveRecognitionContext,
  RECOGNITION_MODE_CONFIGS,
  validateR2ProviderExtraction,
  stripDatabaseMetadata,
  validateEvent,
};
