// Ticket evidence is uploaded to Storage out-of-band and the cloud function
// receives only its fileID. This is a performance target, not a Storage or
// function-event hard limit. The provider hard boundary is enforced by the
// server after the temporary URL is resolved.
const PERFORMANCE_TARGET_BYTES = 8 * 1024 * 1024;
const PROVIDER_HARD_IMAGE_BYTES = 20 * 1024 * 1024;
const PERFORMANCE_TARGET_LONG_EDGE = 2048;

export type DrawTicketReviewStatus =
  | "PENDING"
  | "LOCATION_PENDING"
  | "LOCATION_FAILED"
  | "PHOTO_PENDING"
  | "PHOTO_FAILED"
  | "NOTE_PENDING"
  | "NOTE_FAILED"
  | "APPROVED"
  | "VERIFIED"
  | "MISMATCH"
  | "NEEDS_REVIEW"
  | "INVALID_EVIDENCE"
  | "PROVIDER_FAILED"
  | "SUPERSEDED";

export interface DrawTicketReviewResult {
  readonly recordId: string;
  readonly boardId: string;
  readonly submissionVersion: number;
  readonly status: DrawTicketReviewStatus;
  readonly reasonCode?: string | null;
  readonly photoStatus?: string;
  readonly expected: {
    readonly total: number;
    readonly tierCounts: Readonly<Record<string, number>>;
  };
  readonly observed: {
    readonly total: number;
    readonly tierCounts: Readonly<Record<string, number>>;
    readonly unknownTickets: number;
  };
  readonly mismatches: readonly {
    readonly tier: string;
    readonly expected: number;
    readonly observed: number;
  }[];
  readonly originalEvidenceFileId?: string;
  readonly albumSaveWarning?: boolean;
}

export interface PendingDrawTicketEvidence {
  readonly recordId: string;
  readonly boardId: string;
  readonly submissionVersion: number;
  readonly imageFileId: string;
  readonly captureSource: "camera" | "gallery";
  readonly capturedAt?: number;
  readonly albumSaveWarning: boolean;
  readonly image: {
    readonly width: number;
    readonly height: number;
    readonly byteLength: number;
  };
}

export interface DrawTicketAuthoritativeContext {
  readonly drawEvents: readonly {
    readonly id: string;
    readonly tier: string;
    readonly occurredAt?: number;
  }[];
  readonly userNote?: string;
  readonly ticketLocation?: {
    readonly latitude: number;
    readonly longitude: number;
    readonly accuracy: number;
    readonly source: "camera";
    readonly capturedAt: string;
    readonly consentVersion: string;
  };
}

export interface DrawTicketEvidenceApi {
  getFileSize(filePath: string): Promise<number>;
  getImageInfo(filePath: string): Promise<{ width: number; height: number }>;
  compressImage(
    filePath: string,
    options: {
      readonly quality: number;
      readonly compressedWidth?: number;
      readonly compressedHeight?: number;
    },
  ): Promise<string>;
  uploadFile(cloudPath: string, filePath: string): Promise<string>;
  deleteFile(fileId: string): Promise<void>;
  deleteLocalFile(filePath: string): Promise<void>;
  saveImageToPhotosAlbum(filePath: string): Promise<void>;
  callFunction(
    name: "finalize-draw-update" | "recognize-draw-tickets",
    data: Record<string, unknown>,
  ): Promise<unknown>;
  log?(stage: string, details: Readonly<Record<string, unknown>>): void;
}

const isStatus = (value: unknown): value is DrawTicketReviewStatus =>
  [
    "PENDING",
    "LOCATION_PENDING",
    "LOCATION_FAILED",
    "PHOTO_PENDING",
    "PHOTO_FAILED",
    "NOTE_PENDING",
    "NOTE_FAILED",
    "APPROVED",
    "VERIFIED",
    "MISMATCH",
    "NEEDS_REVIEW",
    "INVALID_EVIDENCE",
    "PROVIDER_FAILED",
    "SUPERSEDED",
  ].includes(String(value));

const parseResponse = (value: unknown): DrawTicketReviewResult => {
  if (!value || typeof value !== "object")
    throw new Error("DRAW_TICKET_RESPONSE_INVALID");
  const envelope = value as {
    ok?: unknown;
    data?: Record<string, unknown>;
    error?: { code?: unknown };
  };
  if (envelope.ok !== true || !envelope.data) {
    throw new Error(
      String(envelope.error?.code || "DRAW_TICKET_REVIEW_FAILED"),
    );
  }
  const data = envelope.data;
  if (
    typeof data.recordId !== "string" ||
    typeof data.boardId !== "string" ||
    !Number.isSafeInteger(data.submissionVersion) ||
    !isStatus(data.status)
  ) {
    throw new Error("DRAW_TICKET_RESPONSE_INVALID");
  }
  if (
    [
      "PENDING",
      "LOCATION_PENDING",
      "LOCATION_FAILED",
      "PHOTO_PENDING",
    ].includes(data.status)
  ) {
    return {
      recordId: data.recordId,
      boardId: data.boardId,
      submissionVersion: Number(data.submissionVersion),
      status: data.status,
      ...(typeof data.reasonCode === "string"
        ? { reasonCode: data.reasonCode }
        : {}),
      expected: { total: 0, tierCounts: {} },
      observed: { total: 0, tierCounts: {}, unknownTickets: 0 },
      mismatches: [],
      ...(typeof data.originalEvidenceFileId === "string"
        ? { originalEvidenceFileId: data.originalEvidenceFileId }
        : {}),
    };
  }
  const parseCounts = (value: unknown) =>
    value && typeof value === "object"
      ? Object.fromEntries(
          Object.entries(value as Record<string, unknown>).filter(
            (entry): entry is [string, number] =>
              Number.isSafeInteger(entry[1]) && Number(entry[1]) >= 0,
          ),
        )
      : {};
  const expected = data.expected as Record<string, unknown> | undefined;
  const observed = data.observed as Record<string, unknown> | undefined;
  if (
    !expected ||
    !observed ||
    !Number.isSafeInteger(expected.total) ||
    !Number.isSafeInteger(observed.total) ||
    !Number.isSafeInteger(observed.unknownTickets) ||
    !Array.isArray(data.mismatches)
  )
    throw new Error("DRAW_TICKET_RESPONSE_INVALID");
  return {
    recordId: data.recordId,
    boardId: data.boardId,
    submissionVersion: Number(data.submissionVersion),
    status: data.status,
    ...(typeof data.reasonCode === "string"
      ? { reasonCode: data.reasonCode }
      : {}),
    ...(typeof data.photoStatus === "string"
      ? { photoStatus: data.photoStatus }
      : {}),
    expected: {
      total: Number(expected.total),
      tierCounts: parseCounts(expected.tierCounts),
    },
    observed: {
      total: Number(observed.total),
      tierCounts: parseCounts(observed.tierCounts),
      unknownTickets: Number(observed.unknownTickets),
    },
    mismatches: data.mismatches.filter(
      (item): item is { tier: string; expected: number; observed: number } =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as { tier?: unknown }).tier === "string" &&
        Number.isSafeInteger((item as { expected?: unknown }).expected) &&
        Number.isSafeInteger((item as { observed?: unknown }).observed),
    ),
  };
};

export const prepareAuthoritativeDrawRecord = async (
  api: DrawTicketEvidenceApi,
  input: {
    readonly recordId: string;
    readonly boardId: string;
    readonly submissionVersion: number;
    readonly drawEvents: readonly {
      readonly id: string;
      readonly tier: string;
      readonly occurredAt?: number;
    }[];
  },
): Promise<void> => {
  const envelope = (await api.callFunction("finalize-draw-update", {
    recordId: input.recordId,
    boardId: input.boardId,
    submissionVersion: input.submissionVersion,
    preparePrizeTicketVerification: true,
    authoritativeDrawEvents: input.drawEvents.map((event) => ({
      eventId: event.id,
      tierCode: event.tier,
      ...(event.occurredAt === undefined
        ? {}
        : { occurredAt: event.occurredAt }),
    })),
  })) as { ok?: unknown; error?: { code?: unknown } };
  if (envelope?.ok !== true)
    throw new Error(
      String(envelope?.error?.code || "AUTHORITATIVE_DRAW_SYNC_FAILED"),
    );
};

export const uploadDrawTicketEvidence = async (
  api: DrawTicketEvidenceApi,
  input: {
    readonly recordId: string;
    readonly boardId: string;
    readonly submissionVersion: number;
    readonly imagePath: string;
    readonly captureSource: "camera" | "gallery";
    readonly capturedAt?: number;
  },
): Promise<PendingDrawTicketEvidence> => {
  let imagePath = input.imagePath;
  const generatedLocalPaths = new Set<string>();
  const uploadStartedAt = Date.now();
  api.log?.("upload_start", {
    recordId: input.recordId,
    boardId: input.boardId,
    submissionVersion: input.submissionVersion,
  });
  try {
    // Saving the untouched original and preparing the transport derivative
    // still run concurrently, but both must settle before leaving capture.
    const albumSave =
      input.submissionVersion === 1 && input.captureSource === "camera"
        ? api
            .saveImageToPhotosAlbum(input.imagePath)
            .then(() => {
              api.log?.("album_save_end", {
                success: true,
                elapsedMs: Date.now() - uploadStartedAt,
              });
              return false;
            })
            .catch(() => {
              api.log?.("album_save_end", {
                success: false,
                elapsedMs: Date.now() - uploadStartedAt,
              });
              return true;
            })
        : Promise.resolve(false);
    let [size, image] = await Promise.all([
      api.getFileSize(imagePath),
      api.getImageInfo(imagePath),
    ]);
    if (
      size > PERFORMANCE_TARGET_BYTES ||
      Math.max(image.width, image.height) > PERFORMANCE_TARGET_LONG_EDGE
    ) {
      imagePath = await api.compressImage(imagePath, {
        quality: 82,
        ...(image.width >= image.height
          ? {
              compressedWidth: Math.min(
                PERFORMANCE_TARGET_LONG_EDGE,
                image.width,
              ),
            }
          : {
              compressedHeight: Math.min(
                PERFORMANCE_TARGET_LONG_EDGE,
                image.height,
              ),
            }),
      });
      if (imagePath !== input.imagePath) generatedLocalPaths.add(imagePath);
      [size, image] = await Promise.all([
        api.getFileSize(imagePath),
        api.getImageInfo(imagePath),
      ]);
    }
    if (size > PROVIDER_HARD_IMAGE_BYTES)
      throw new Error("DRAW_TICKET_IMAGE_TOO_LARGE");
    api.log?.("preprocess_end", {
      width: image.width,
      height: image.height,
      byteLength: size,
      elapsedMs: Date.now() - uploadStartedAt,
    });
    const cloudPath = `recognition-temp/prize-ticket-${input.recordId}-v${input.submissionVersion}/ticket-${Date.now()}.jpg`;
    const imageFileId = await api.uploadFile(cloudPath, imagePath);
    api.log?.("storage_upload_end", {
      imageFileId,
      elapsedMs: Date.now() - uploadStartedAt,
    });
    const albumSaveWarning = await albumSave;
    api.log?.("upload_end", {
      recordId: input.recordId,
      boardId: input.boardId,
      submissionVersion: input.submissionVersion,
      imageFileId,
      durationMs: Date.now() - uploadStartedAt,
    });
    return {
      recordId: input.recordId,
      boardId: input.boardId,
      submissionVersion: input.submissionVersion,
      imageFileId,
      captureSource: input.captureSource,
      ...(input.capturedAt === undefined
        ? {}
        : { capturedAt: input.capturedAt }),
      albumSaveWarning,
      image: { width: image.width, height: image.height, byteLength: size },
    };
  } finally {
    await Promise.all(
      [...generatedLocalPaths].map((filePath) =>
        api.deleteLocalFile(filePath).catch(() => undefined),
      ),
    );
  }
};

const pendingRequest = (pending: PendingDrawTicketEvidence) => ({
  recordId: pending.recordId,
  boardId: pending.boardId,
  submissionVersion: pending.submissionVersion,
  imageFileId: pending.imageFileId,
  captureSource: pending.captureSource,
  capturedAt: pending.capturedAt,
  albumSaveWarning: pending.albumSaveWarning,
  image: pending.image,
});

export const createPendingDrawTicketVerification = (
  api: DrawTicketEvidenceApi,
  pending: PendingDrawTicketEvidence,
  authoritative?: DrawTicketAuthoritativeContext,
): Promise<DrawTicketReviewResult> => {
  const startedAt = Date.now();
  api.log?.("pending_submit_start", pendingRequest(pending));
  return api
    .callFunction("recognize-draw-tickets", {
      action: "submit",
      ...pendingRequest(pending),
      authoritativeDrawEvents: authoritative?.drawEvents.map((event) => ({
        eventId: event.id,
        tierCode: event.tier,
        ...(event.occurredAt === undefined
          ? {}
          : { occurredAt: event.occurredAt }),
      })),
      ...(authoritative?.userNote ? { userNote: authoritative.userNote } : {}),
      ...(authoritative?.ticketLocation
        ? { ticketLocation: authoritative.ticketLocation }
        : {}),
    })
    .then(parseResponse)
    .then((result) => {
      api.log?.("pending_submit_end", {
        recordId: pending.recordId,
        boardId: pending.boardId,
        submissionVersion: pending.submissionVersion,
        status: result.status,
        durationMs: Date.now() - startedAt,
      });
      return result;
    });
};

export const runPendingDrawTicketVerification = (
  api: DrawTicketEvidenceApi,
  pending: PendingDrawTicketEvidence,
  authoritative?: DrawTicketAuthoritativeContext,
): Promise<DrawTicketReviewResult> => {
  const startedAt = Date.now();
  api.log?.("verification_start", pendingRequest(pending));
  return api
    .callFunction("recognize-draw-tickets", {
      action: "verify",
      ...pendingRequest(pending),
      authoritativeDrawEvents: authoritative?.drawEvents.map((event) => ({
        eventId: event.id,
        tierCode: event.tier,
        ...(event.occurredAt === undefined
          ? {}
          : { occurredAt: event.occurredAt }),
      })),
      ...(authoritative?.userNote ? { userNote: authoritative.userNote } : {}),
      ...(authoritative?.ticketLocation
        ? { ticketLocation: authoritative.ticketLocation }
        : {}),
    })
    .then(parseResponse)
    .then((result) => {
      api.log?.("verification_end", {
        recordId: pending.recordId,
        boardId: pending.boardId,
        submissionVersion: pending.submissionVersion,
        status: result.status,
        durationMs: Date.now() - startedAt,
      });
      return result;
    });
};

export const reviewDrawTicketNote = (
  api: DrawTicketEvidenceApi,
  input: {
    readonly recordId: string;
    readonly boardId: string;
    readonly submissionVersion: number;
    readonly userNote: string;
  },
): Promise<DrawTicketReviewResult> =>
  api
    .callFunction("recognize-draw-tickets", {
      action: "review-note",
      recordId: input.recordId,
      boardId: input.boardId,
      submissionVersion: input.submissionVersion,
      userNote: input.userNote,
    })
    .then(parseResponse);

export const submitDrawTicketEvidence = async (
  api: DrawTicketEvidenceApi,
  input: {
    readonly recordId: string;
    readonly boardId: string;
    readonly submissionVersion: number;
    readonly imagePath: string;
    readonly captureSource: "camera" | "gallery";
    readonly capturedAt?: number;
    readonly reuseOriginalEvidenceFileId?: string;
  },
): Promise<DrawTicketReviewResult> => {
  let pending: PendingDrawTicketEvidence | undefined;
  try {
    pending = input.reuseOriginalEvidenceFileId
      ? {
          recordId: input.recordId,
          boardId: input.boardId,
          submissionVersion: input.submissionVersion,
          imageFileId: input.reuseOriginalEvidenceFileId,
          captureSource: input.captureSource,
          ...(input.capturedAt === undefined
            ? {}
            : { capturedAt: input.capturedAt }),
          albumSaveWarning: false,
          image: { width: 1, height: 1, byteLength: 1 },
        }
      : await uploadDrawTicketEvidence(api, input);
    const evidence = pending;
    await createPendingDrawTicketVerification(api, evidence);
    return await runPendingDrawTicketVerification(api, evidence);
  } finally {
    if (
      pending?.imageFileId &&
      input.submissionVersion > 1 &&
      !input.reuseOriginalEvidenceFileId
    )
      void api.deleteFile(pending.imageFileId).catch(() => undefined);
  }
};

export const getWxDrawTicketEvidenceApi = (): DrawTicketEvidenceApi => {
  const cloud = (
    wx as unknown as {
      cloud?: {
        uploadFile(options: {
          cloudPath: string;
          filePath: string;
        }): Promise<{ fileID?: string }>;
        deleteFile(options: { fileList: string[] }): Promise<unknown>;
        callFunction(options: {
          name: string;
          data: Record<string, unknown>;
        }): Promise<{ result?: unknown }>;
      };
    }
  ).cloud;
  return {
    getFileSize(filePath) {
      return new Promise((resolve, reject) => {
        wx.getFileSystemManager().getFileInfo({
          filePath,
          success: (result) => resolve(result.size),
          fail: reject,
        });
      });
    },
    getImageInfo(filePath) {
      return new Promise((resolve, reject) => {
        wx.getImageInfo({
          src: filePath,
          success: (result) =>
            resolve({ width: result.width, height: result.height }),
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
          success: (result) => resolve(result.tempFilePath),
          fail: reject,
        });
      });
    },
    async uploadFile(cloudPath, filePath) {
      if (!cloud) throw new Error("CLOUD_UNAVAILABLE");
      const result = await cloud.uploadFile({ cloudPath, filePath });
      if (!result.fileID) throw new Error("CLOUD_UPLOAD_FAILED");
      return result.fileID;
    },
    async deleteFile(fileId) {
      if (cloud) await cloud.deleteFile({ fileList: [fileId] });
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
    saveImageToPhotosAlbum(filePath) {
      return new Promise((resolve, reject) => {
        wx.saveImageToPhotosAlbum({
          filePath,
          success: () => resolve(),
          fail: reject,
        });
      });
    },
    async callFunction(name, data) {
      if (!cloud) throw new Error("CLOUD_UNAVAILABLE");
      return (await cloud.callFunction({ name, data })).result;
    },
    log(stage, details) {
      console.info("ICHI_PRIZE_TICKET_CLIENT", { stage, ...details });
    },
  };
};
