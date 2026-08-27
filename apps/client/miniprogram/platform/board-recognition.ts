import type { BoardMediaFile } from "./board-media.js";
import {
  RECOGNITION_CONTRACT_VERSION,
  type RecognitionPrizeDraft,
  type RecognitionStatus,
} from "./recognition-flow.js";

// This is a performance target for Storage upload and provider fetch time.
// It is not the CloudBase function event limit: the function receives only a
// fileID. The remote image provider hard limit is enforced separately.
const PERFORMANCE_TARGET_BYTES = 8 * 1024 * 1024;
const PROVIDER_HARD_IMAGE_BYTES = 20 * 1024 * 1024;
const CLIENT_TIMEOUT_MS = 55_000;
const COMPRESSION_ATTEMPTS = [
  { longEdge: 2400, quality: 85 },
  { longEdge: 2048, quality: 82 },
] as const;

interface RecognitionTierTransport {
  readonly componentId?: unknown;
  readonly label?: unknown;
  readonly confidence?: unknown;
  readonly totalTickets?: unknown;
  readonly pastedTickets?: unknown;
  readonly remainingTickets?: unknown;
  readonly slotObservation?: {
    readonly totalSlots?: unknown;
    readonly openSlots?: unknown;
    readonly coveredSlots?: unknown;
    readonly unknownSlots?: unknown;
  };
}

interface RecognitionTransport {
  readonly contractVersion?: unknown;
  readonly requestId?: unknown;
  readonly status?: unknown;
  readonly reasonCode?: unknown;
  readonly draft?: {
    readonly price?: { readonly amount?: unknown };
    readonly ipName?: unknown;
    readonly themeName?: unknown;
    readonly tiers?: readonly RecognitionTierTransport[];
    readonly blocks?: readonly {
      readonly componentType?: unknown;
      readonly rawText?: unknown;
    }[];
  };
  readonly issues?: readonly {
    readonly code?: unknown;
    readonly action?: unknown;
  }[];
  readonly imageHandling?: {
    readonly retention?: unknown;
    readonly published?: unknown;
    readonly storedInSessionHistory?: unknown;
  };
}

export interface BoardRecognitionApi {
  getFileSize(filePath: string): Promise<number>;
  getImageInfo(
    filePath: string,
  ): Promise<{ width: number; height: number; type?: string }>;
  compressImage(
    filePath: string,
    options: {
      readonly quality: number;
      readonly compressedWidth?: number;
      readonly compressedHeight?: number;
    },
  ): Promise<string>;
  uploadTemporaryImage(
    cloudPath: string,
    filePath: string,
  ): Promise<{ fileId: string }>;
  deleteTemporaryImage(fileId: string): Promise<void>;
  deleteLocalFile(filePath: string): Promise<void>;
  callRecognizeBoard(data: Record<string, unknown>): Promise<unknown>;
}

export interface BoardRecognitionTimings {
  readonly metadataMs: number;
  readonly compressionMs: number;
  readonly uploadMs: number;
  readonly cloudCallMs: number;
  readonly transportParseMs: number;
  readonly pipelineMs: number;
}

export type BoardRecognitionProgressEvent =
  | "photo-prepared"
  | "request-dispatched"
  | "response-received"
  | "result-ready";

export type BoardRecognitionResult =
  | {
      readonly status: "recognized";
      readonly recognitionStatus: RecognitionStatus;
      readonly prizes: readonly RecognitionPrizeDraft[];
      readonly unitPrice: null;
      readonly ipName: string;
      readonly themeName: string;
      readonly issueCodes: readonly string[];
      readonly timings?: BoardRecognitionTimings;
    }
  | {
      readonly status: "failed";
      readonly code:
        | "provider-unavailable"
        | "image-too-large"
        | "unsupported-image-format"
        | "invalid-response"
        | "timeout"
        | "platform-error";
      readonly retryable: boolean;
      readonly message: string;
      readonly timings?: BoardRecognitionTimings;
    };

const failure = (
  code: Extract<BoardRecognitionResult, { status: "failed" }>["code"],
  retryable: boolean,
  message: string,
): BoardRecognitionResult => ({ status: "failed", code, retryable, message });

const inferMediaType = (
  path: string,
  imageType?: string,
): "image/jpeg" | "image/png" | "image/webp" | null => {
  const normalizedType = imageType?.toLowerCase();
  if (normalizedType === "png") return "image/png";
  if (normalizedType === "webp") return "image/webp";
  if (normalizedType === "jpg" || normalizedType === "jpeg")
    return "image/jpeg";
  const normalized = path.toLowerCase().split("?")[0] ?? "";
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".webp")) return "image/webp";
  if (
    normalized.endsWith(".jpg") ||
    normalized.endsWith(".jpeg") ||
    normalized.endsWith(".jpe")
  )
    return "image/jpeg";
  return null;
};

const inferExtension = (
  mediaType: Exclude<ReturnType<typeof inferMediaType>, null>,
) =>
  mediaType === "image/png"
    ? "png"
    : mediaType === "image/webp"
      ? "webp"
      : "jpg";

const safeJobPathPart = (value: string) =>
  value.replace(/[^a-zA-Z0-9_-]/gu, "-").slice(0, 96);

const bestEffortDeleteLocalFile = async (
  api: BoardRecognitionApi,
  filePath: string,
) => {
  try {
    await api.deleteLocalFile(filePath);
  } catch {
    // 微信仍会回收临时文件；显式清理失败不能覆盖识别结果。
  }
};

export const deleteWxTemporaryBoardImage = async (filePath: string) => {
  await bestEffortDeleteLocalFile(getWxBoardRecognitionApi(), filePath);
};

const isRecognitionStatus = (value: unknown): value is RecognitionStatus =>
  value === "ready_for_confirmation" ||
  value === "needs_user_input" ||
  value === "retake_required" ||
  value === "service_error";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isOptionalText = (value: unknown): value is string | null | undefined =>
  value === null || value === undefined || typeof value === "string";

export const parseBoardRecognitionTransport = (
  value: unknown,
): BoardRecognitionResult => {
  if (!value || typeof value !== "object") {
    return failure("invalid-response", true, "识别服务返回了无法读取的数据。");
  }
  const response = value as RecognitionTransport;
  if (
    response.contractVersion !== RECOGNITION_CONTRACT_VERSION ||
    typeof response.requestId !== "string" ||
    !isRecognitionStatus(response.status) ||
    response.imageHandling?.retention !== "ephemeral" ||
    response.imageHandling.published !== false ||
    response.imageHandling.storedInSessionHistory !== false
  ) {
    return failure(
      "invalid-response",
      true,
      "识别服务响应未通过隐私与版本校验。",
    );
  }
  if (response.status === "service_error") {
    const providerUnavailable =
      response.reasonCode === "RECOGNITION_PROVIDER_NOT_CONFIGURED";
    return failure(
      providerUnavailable ? "provider-unavailable" : "platform-error",
      !providerUnavailable,
      providerUnavailable
        ? "识别服务尚未配置，请稍后再试。"
        : "识别服务暂时不可用，请稍后重试。",
    );
  }
  if (
    response.status !== "retake_required" &&
    Array.isArray(response.issues) &&
    response.issues.some((item) => item?.action === "retake_image")
  ) {
    return failure(
      "invalid-response",
      true,
      "识别服务要求重新拍摄，但响应状态不一致。",
    );
  }
  if (response.status === "retake_required") {
    return failure(
      "invalid-response",
      true,
      "识别服务未能生成可核对的票池，请重新导入。",
    );
  }
  if (!Array.isArray(response.draft?.tiers) || !response.draft.tiers.length) {
    return failure("invalid-response", true, "识别结果没有包含可核对的奖级。");
  }
  const blocks = response.draft.blocks;
  if (
    !isOptionalText(response.draft.ipName) ||
    !isOptionalText(response.draft.themeName) ||
    (blocks !== undefined && !Array.isArray(blocks)) ||
    (Array.isArray(blocks) &&
      blocks.some(
        (block) =>
          !block ||
          typeof block !== "object" ||
          Array.isArray(block) ||
          !isOptionalText(block.componentType) ||
          !isOptionalText(block.rawText),
      ))
  ) {
    return failure(
      "invalid-response",
      true,
      "识别服务返回了无法读取的文字字段。",
    );
  }
  const prizes: RecognitionPrizeDraft[] = [];
  for (const [index, tier] of response.draft.tiers.entries()) {
    if (!tier || typeof tier !== "object" || Array.isArray(tier)) {
      return failure("invalid-response", true, "识别出的奖级格式不正确。");
    }
    if (typeof tier.label !== "string" || !tier.label.trim()) {
      return failure("invalid-response", true, "识别出的奖级格式不正确。");
    }
    if (
      tier.componentId !== undefined &&
      (typeof tier.componentId !== "string" || !tier.componentId.trim())
    ) {
      return failure("invalid-response", true, "识别出的奖级格式不正确。");
    }
    if (
      tier.slotObservation !== undefined &&
      (!tier.slotObservation ||
        typeof tier.slotObservation !== "object" ||
        Array.isArray(tier.slotObservation))
    ) {
      return failure("invalid-response", true, "识别出的奖级格式不正确。");
    }
    const label = tier.label.trim();
    const parseNullableInteger = (
      value: unknown,
    ):
      | { readonly valid: true; readonly value: number | null }
      | { readonly valid: false; readonly value: null } => {
      if (value === null) return { valid: true, value: null };
      if (value === undefined) return { valid: false, value: null };
      return typeof value === "number" &&
        Number.isSafeInteger(value) &&
        value >= 0
        ? { valid: true, value }
        : { valid: false, value: null };
    };
    // RecognitionContract 1.0 carries the normalized direct count fields as
    // an explicit wire shape. Stored 3.x drafts are migrated before they
    // reach this transport parser, so omitted critical keys fail closed here
    // instead of falling back or coercing legacy values.
    const hasOwn = (key: string) =>
      Object.prototype.hasOwnProperty.call(tier, key);
    if (
      !hasOwn("totalTickets") ||
      !hasOwn("pastedTickets") ||
      !hasOwn("remainingTickets") ||
      !tier.slotObservation ||
      typeof tier.slotObservation !== "object" ||
      Array.isArray(tier.slotObservation) ||
      !Object.prototype.hasOwnProperty.call(
        tier.slotObservation,
        "totalSlots",
      ) ||
      !Object.prototype.hasOwnProperty.call(
        tier.slotObservation,
        "openSlots",
      ) ||
      !Object.prototype.hasOwnProperty.call(
        tier.slotObservation,
        "coveredSlots",
      ) ||
      !Object.prototype.hasOwnProperty.call(
        tier.slotObservation,
        "unknownSlots",
      )
    ) {
      return failure("invalid-response", true, "识别出的奖级计数格式不完整。");
    }
    const totalResult = parseNullableInteger(tier.totalTickets);
    const coveredResult = parseNullableInteger(tier.pastedTickets);
    const openResult = parseNullableInteger(tier.remainingTickets);
    const slotTotalResult = parseNullableInteger(
      tier.slotObservation.totalSlots,
    );
    const slotOpenResult = parseNullableInteger(tier.slotObservation.openSlots);
    const slotCoveredResult = parseNullableInteger(
      tier.slotObservation.coveredSlots,
    );
    const unknownResult = parseNullableInteger(
      tier.slotObservation.unknownSlots,
    );
    if (
      !totalResult.valid ||
      !coveredResult.valid ||
      !openResult.valid ||
      !slotTotalResult.valid ||
      !slotOpenResult.valid ||
      !slotCoveredResult.valid ||
      !unknownResult.valid
    ) {
      return failure("invalid-response", true, "识别出的奖级计数格式不正确。");
    }
    const total = totalResult.value;
    const covered = coveredResult.value;
    const open = openResult.value;
    const slotTotal = slotTotalResult.value;
    const slotOpen = slotOpenResult.value;
    const slotCovered = slotCoveredResult.value;
    const unknown = unknownResult.value;
    if (
      !isFiniteNumber(tier.confidence) ||
      tier.confidence < 0 ||
      tier.confidence > 1
    ) {
      return failure("invalid-response", true, "识别出的置信度格式不正确。");
    }
    if (
      !label ||
      (total === null && covered === null && open === null && unknown === null)
    ) {
      return failure("invalid-response", true, "识别出的奖级计数格式不正确。");
    }
    const countsConsistent =
      total !== null && covered !== null && open !== null && unknown !== null
        ? open + covered + unknown === total
        : false;
    // R2 phase 1 intentionally knows only direct remaining tickets. Preserve
    // that explicit value (including zero) when both wire representations
    // agree and every T/P/U companion is null; the result page then asks the
    // user to complete total tickets instead of inventing it.
    const directRemainingOnly =
      total === null &&
      covered === null &&
      open !== null &&
      unknown === null &&
      slotTotal === null &&
      slotCovered === null &&
      slotOpen === open;
    prizes.push({
      id: String(tier.componentId || `tier-${index + 1}`),
      tier: label.replace(/賞$/u, ""),
      rawLabel: /賞$/u.test(label) ? label : `${label}賞`,
      remainingTickets:
        directRemainingOnly || (countsConsistent && unknown === 0)
          ? open
          : null,
      confidence:
        countsConsistent && unknown === 0 && tier.confidence >= 0.75
          ? "high"
          : "low",
    });
  }
  const priceRecord = response.draft.price;
  if (
    !priceRecord ||
    typeof priceRecord !== "object" ||
    Array.isArray(priceRecord)
  ) {
    return failure("invalid-response", true, "识别出的价格格式不正确。");
  }
  const rawPrice = priceRecord.amount;
  if (
    rawPrice !== undefined &&
    rawPrice !== null &&
    (!isFiniteNumber(rawPrice) || rawPrice <= 0)
  ) {
    return failure("invalid-response", true, "识别出的价格格式不正确。");
  }
  const ipName = String(
    response.draft.ipName ??
      response.draft.blocks?.find(
        (block) => block.componentType === "series_identity",
      )?.rawText ??
      "",
  ).trim();
  const themeName = String(
    response.draft.themeName ??
      response.draft.blocks?.find(
        (block) => block.componentType === "board_theme",
      )?.rawText ??
      "",
  ).trim();
  return {
    status: "recognized",
    recognitionStatus: response.status,
    prizes,
    unitPrice: null,
    ipName,
    themeName,
    issueCodes: Array.isArray(response.issues)
      ? response.issues
          .map((item) => item.code)
          .filter((code): code is string => typeof code === "string")
      : [],
  };
};

export const recognizeBoardImage = async (
  api: BoardRecognitionApi,
  file: BoardMediaFile,
  acquisition: "camera",
  recognitionJob?: {
    readonly jobId: string;
    readonly jobToken: string;
    readonly onProgress?: (event: BoardRecognitionProgressEvent) => void;
  },
): Promise<BoardRecognitionResult> => {
  const pipelineStartedAt = Date.now();
  const timing = {
    metadataMs: 0,
    compressionMs: 0,
    uploadMs: 0,
    cloudCallMs: 0,
    transportParseMs: 0,
  };
  const withTimings = (
    result: BoardRecognitionResult,
  ): BoardRecognitionResult => ({
    ...result,
    timings: {
      ...timing,
      pipelineMs: Date.now() - pipelineStartedAt,
    },
  });
  const localPaths = new Set([file.tempFilePath]);
  let temporaryFileId = "";
  let cloudCall: Promise<unknown> | undefined;
  let cloudCallSettled = false;
  const notifyProgress = (event: BoardRecognitionProgressEvent): void => {
    try {
      recognitionJob?.onProgress?.(event);
    } catch {
      // UI progress reporting must never alter the recognition result.
    }
  };
  try {
    if (!recognitionJob?.jobId || !recognitionJob.jobToken) {
      return withTimings(
        failure(
          "provider-unavailable",
          true,
          "无法建立受保护的识别任务，请重新尝试。",
        ),
      );
    }
    let imagePath = file.tempFilePath;
    let stageStartedAt = Date.now();
    let [fileSize, image] = await Promise.all([
      file.size > 0
        ? Promise.resolve(file.size)
        : api.getFileSize(file.tempFilePath),
      api.getImageInfo(file.tempFilePath),
    ]);
    timing.metadataMs = Date.now() - stageStartedAt;
    const originalLongEdge = Math.max(image.width, image.height);
    stageStartedAt = Date.now();
    for (const [attemptIndex, attempt] of COMPRESSION_ATTEMPTS.entries()) {
      const primaryResizeNeeded =
        attemptIndex === 0 && originalLongEdge > attempt.longEdge;
      const sizeFallbackNeeded = fileSize > PERFORMANCE_TARGET_BYTES;
      if (!primaryResizeNeeded && !sizeFallbackNeeded) break;
      try {
        imagePath = await api.compressImage(file.tempFilePath, {
          quality: attempt.quality,
          ...(image.width >= image.height
            ? { compressedWidth: Math.min(image.width, attempt.longEdge) }
            : { compressedHeight: Math.min(image.height, attempt.longEdge) }),
        });
        localPaths.add(imagePath);
        [fileSize, image] = await Promise.all([
          api.getFileSize(imagePath),
          api.getImageInfo(imagePath),
        ]);
      } catch {
        imagePath = file.tempFilePath;
      }
    }
    timing.compressionMs = Date.now() - stageStartedAt;
    if (fileSize > PROVIDER_HARD_IMAGE_BYTES) {
      return withTimings(
        failure(
          "image-too-large",
          false,
          "照片超过识别服务支持的大小，请重新拍摄更完整的版面。",
        ),
      );
    }
    const requestId = `recognize-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
    const mediaType = inferMediaType(imagePath, image.type);
    if (!mediaType) {
      return withTimings(
        failure(
          "unsupported-image-format",
          false,
          "当前相机照片格式暂不支持，请重新拍摄。",
        ),
      );
    }
    notifyProgress("photo-prepared");
    const cloudPath = `recognition-temp/${safeJobPathPart(recognitionJob.jobId)}/${requestId}.${inferExtension(mediaType)}`;
    stageStartedAt = Date.now();
    const upload = await api.uploadTemporaryImage(cloudPath, imagePath);
    timing.uploadMs = Date.now() - stageStartedAt;
    temporaryFileId = upload.fileId;
    cloudCall = api
      .callRecognizeBoard({
        contractVersion: RECOGNITION_CONTRACT_VERSION,
        requestId,
        imageFileId: temporaryFileId,
        image: {
          mediaType,
          width: image.width,
          height: image.height,
          byteLength: fileSize,
          acquisition,
        },
        localeHints: ["zh-CN", "ja-JP"],
        ...(recognitionJob
          ? {
              recognitionJobId: recognitionJob.jobId,
              recognitionJobToken: recognitionJob.jobToken,
            }
          : {}),
      })
      .finally(() => {
        cloudCallSettled = true;
      });
    notifyProgress("request-dispatched");
    let timeout: ReturnType<typeof setTimeout> | undefined;
    stageStartedAt = Date.now();
    const response = await Promise.race([
      cloudCall,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("recognition-client-timeout")),
          CLIENT_TIMEOUT_MS,
        );
      }),
    ]).finally(() => {
      if (timeout) clearTimeout(timeout);
    });
    timing.cloudCallMs = Date.now() - stageStartedAt;
    notifyProgress("response-received");
    stageStartedAt = Date.now();
    const result = parseBoardRecognitionTransport(response);
    timing.transportParseMs = Date.now() - stageStartedAt;
    if (result.status === "recognized") notifyProgress("result-ready");
    return withTimings(result);
  } catch (error) {
    return withTimings(
      failure(
        error instanceof Error && error.message === "recognition-client-timeout"
          ? "timeout"
          : "platform-error",
        true,
        error instanceof Error && error.message === "recognition-client-timeout"
          ? "识别等待超时，请检查网络后重试。"
          : "暂时无法读取或识别这张照片。",
      ),
    );
  } finally {
    if (temporaryFileId) {
      const fileId = temporaryFileId;
      const deleteRemote = () =>
        api.deleteTemporaryImage(fileId).catch(() => {
          // 云函数也在 finally 清理；生命周期规则负责异常退出后的兜底。
        });
      if (cloudCall && !cloudCallSettled) {
        void cloudCall.then(deleteRemote, deleteRemote);
      } else {
        void deleteRemote();
      }
    }
    void Promise.all(
      [...localPaths].map((filePath) =>
        bestEffortDeleteLocalFile(api, filePath),
      ),
    ).catch(() => undefined);
  }
};

export const getWxBoardRecognitionApi = (): BoardRecognitionApi => {
  const cloud = (
    wx as unknown as {
      cloud?: {
        callFunction(options: {
          name: string;
          data: Record<string, unknown>;
        }): Promise<{ result?: unknown }>;
        uploadFile(options: {
          cloudPath: string;
          filePath: string;
        }): Promise<{ fileID?: string }>;
        deleteFile(options: { fileList: string[] }): Promise<unknown>;
      };
    }
  ).cloud;
  return {
    getFileSize(filePath) {
      return new Promise((resolve, reject) => {
        wx.getFileSystemManager().getFileInfo({
          filePath,
          success(result) {
            resolve(result.size);
          },
          fail: reject,
        });
      });
    },
    getImageInfo(filePath) {
      return new Promise((resolve, reject) => {
        wx.getImageInfo({
          src: filePath,
          success(result) {
            resolve({
              width: result.width,
              height: result.height,
              type: result.type,
            });
          },
          fail: reject,
        });
      });
    },
    compressImage(filePath, options) {
      return new Promise((resolve, reject) => {
        wx.compressImage({
          src: filePath,
          quality: options.quality,
          ...(options.compressedWidth === undefined
            ? {}
            : { compressedWidth: options.compressedWidth }),
          ...(options.compressedHeight === undefined
            ? {}
            : { compressedHeight: options.compressedHeight }),
          success(result) {
            resolve(result.tempFilePath);
          },
          fail: reject,
        });
      });
    },
    async uploadTemporaryImage(cloudPath, filePath) {
      if (!cloud) throw new Error("cloud-unavailable");
      const result = await cloud.uploadFile({ cloudPath, filePath });
      if (!result.fileID) throw new Error("cloud-upload-missing-file-id");
      return { fileId: result.fileID };
    },
    async deleteTemporaryImage(fileId) {
      if (!cloud) return;
      await cloud.deleteFile({ fileList: [fileId] });
    },
    deleteLocalFile(filePath) {
      return new Promise((resolve, reject) => {
        wx.getFileSystemManager().unlink({
          filePath,
          success: () => resolve(),
          fail: reject,
        });
      });
    },
    async callRecognizeBoard(data) {
      if (!cloud) {
        return {
          contractVersion: RECOGNITION_CONTRACT_VERSION,
          requestId: String(data.requestId ?? "unknown"),
          status: "service_error",
          reasonCode: "RECOGNITION_PROVIDER_NOT_CONFIGURED",
          issues: [],
          imageHandling: {
            retention: "ephemeral",
            published: false,
            storedInSessionHistory: false,
          },
        };
      }
      const result = await cloud.callFunction({
        name: "recognize-board",
        data,
      });
      return result.result;
    },
  };
};
