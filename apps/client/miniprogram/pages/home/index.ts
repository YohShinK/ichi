import {
  captureBoardImage,
  classifyBoardMediaFailure,
  getWxBoardCameraApi,
  type BoardMediaSelection,
} from "../../platform/board-media.js";
import {
  deleteWxTemporaryBoardImage,
  getWxBoardRecognitionApi,
  parseBoardRecognitionTransport,
  recognizeBoardImage,
  type BoardRecognitionResult,
} from "../../platform/board-recognition.js";
import {
  RecognitionProgressAnimator,
  type RecognitionFrameScheduler,
  type RecognitionProgressEvent,
  type RecognitionProgressSnapshot,
} from "../../platform/recognition-progress.js";
import {
  buildBoardOutlook,
  type BoardOutlookView,
} from "../../platform/board-outlook.js";
import {
  contextualReminder,
  drawPrize,
  formatProbability,
  presentationForPrize,
  projectPrizeStates,
  remainingTickets,
  toWorkspaceSection,
  undoLastDraw,
  type PrizePresentation,
} from "../../platform/draw-session.js";
import {
  createRecordCode,
  createWxLocalDrawDraftRepository,
  inspectLocalDraftStorage,
  isResumableLocalDrawDraft,
  LOCAL_DRAW_DRAFTS_KEY,
  summarizeLocalDrawDraft,
  currentRemainingForPrize,
  initialRemainingForPrize,
  type LocalDrawDraft,
  type LocalDrawDraftSummary,
  type LocalPrizeState,
} from "../../platform/local-draw-drafts.js";
import {
  readActiveDraftBoardId,
  readRecognitionStableView,
  writeActiveDraftBoardId,
  writeRecognitionStableView,
  type RecognitionStableView,
} from "../../platform/navigation-state.js";
import {
  createRecognitionFixture,
  decodeRecognitionFlow,
  DEFAULT_RECOGNITION_PRICE,
  RECOGNITION_FLOW_KEY,
  parseRecognitionUnitPrice,
  recognitionStatusView,
  updateRecognitionPrize,
  validateRecognitionDraft,
  type RecognitionDraftValidation,
  type RecognitionFlowMode,
  type RecognitionPrizeDraft,
} from "../../platform/recognition-flow.js";
import {
  getCapacityState,
  getWxStorageDriver,
} from "../../platform/storage.js";
import {
  createPeelSpringFrames,
  projectPeelDistance,
} from "../../platform/ticket-peel-motion.js";
import {
  bindWechatProfile,
  bindWechatProfileFromSelection,
  CloudAccountError,
  getWxCloudFunctionApi,
  loadCloudAccount,
  getWxWechatProfileMediaAdapter,
  quotaUsedPercent,
  type CloudAccountProfile,
  type CloudQuotaSummary,
} from "../../platform/cloud-account.js";
import {
  finalizeCloudObservation,
  getCloudRecognitionJob,
  releaseCloudRecognition,
  reserveCloudRecognition,
  toConfirmedBoardSnapshot,
} from "../../platform/cloud-recognition-task.js";
import {
  buildBoardFromRecognitionSnapshot,
  createRecognitionGenerationSnapshot,
  isCurrentGeneration,
  type RecognitionGenerationState,
} from "../../platform/recognition-generation.js";
import {
  loadMyCloudRecords,
  requestCloudRecordDeletion,
  type CloudRecordSummary,
} from "../../platform/cloud-records.js";
import {
  createPendingDrawTicketVerification,
  getWxDrawTicketEvidenceApi,
  runPendingDrawTicketVerification,
  reviewDrawTicketNote,
  uploadDrawTicketEvidence,
  type PendingDrawTicketEvidence,
} from "../../platform/draw-ticket-recognition.js";
import type { IchiApp } from "../../app.js";

type HomeView =
  | RecognitionStableView
  | "camera-capture"
  | "recognizing"
  | "recognition-result"
  | "grand-prize-selection"
  | "map-preview"
  | "my"
  | "account"
  | "local-records"
  | "contributions"
  | "map-reminder"
  | "method"
  | "cannot-build-pool"
  | "undo-protected"
  | "storage-fallback"
  | "schema-incompatible"
  | "deleted";
type MainTab = "recognize" | "map" | "my";
type CameraStatus = "loading" | "ready" | "denied" | "unavailable";
type ModalView =
  | ""
  | "probability"
  | "history"
  | "share-decision"
  | "share-capture"
  | "submitted"
  | "board-upload-submitted"
  | "storage-warning"
  | "quota-exhausted"
  | "account-unavailable"
  | "capture-permission-required"
  | "delete-uploaded-board"
  | "note-review"
  | "wechat-login";
type AccountState = "loading" | "ready" | "unavailable";

const recognitionReservationErrorMessage = (error: unknown): string => {
  if (!(error instanceof CloudAccountError)) {
    return "无法建立私有识别任务（参考码：RESERVE_UNKNOWN）。";
  }
  const messages: Readonly<Record<string, string>> = {
    QUOTA_EXHAUSTED: "今天的 5 次版面识别额度已经用完。",
    ACCOUNT_REQUIRED: "微信账号尚未建立，请返回“我的”页面重试登录。",
    TRUSTED_IDENTITY_UNAVAILABLE:
      "暂时无法取得微信登录身份（参考码：IDENTITY_UNAVAILABLE）。",
    RECOGNITION_DISABLED:
      "版面识别服务暂时关闭（参考码：RECOGNITION_DISABLED）。",
    RECOGNITION_CIRCUIT_OPEN:
      "版面识别服务正在恢复（参考码：RECOGNITION_CIRCUIT_OPEN）。",
    CLOUD_NETWORK_FAILED:
      "连接云端超时，请检查网络后重试（参考码：CLOUD_NETWORK_FAILED）。",
    CLOUD_FUNCTION_UNAVAILABLE:
      "云端识别入口暂不可用（参考码：CLOUD_FUNCTION_UNAVAILABLE）。",
    CLOUD_PERMISSION_DENIED:
      "当前微信身份无权建立识别任务（参考码：CLOUD_PERMISSION_DENIED）。",
    INVALID_CLOUD_RESPONSE:
      "云端返回格式异常（参考码：INVALID_CLOUD_RESPONSE）。",
    RECOGNITION_JOB_NOT_RESERVABLE:
      "识别任务状态异常（参考码：JOB_NOT_RESERVABLE）。",
    CLOUD_CALL_FAILED: "无法调用云端识别入口（参考码：CLOUD_CALL_FAILED）。",
  };
  return (
    messages[error.code] ??
    `无法建立私有识别任务（参考码：${error.code || "RESERVE_FAILED"}）。`
  );
};

interface DraftViewModel extends LocalDrawDraftSummary {
  readonly swipeX: number;
  readonly isDeleting?: boolean;
}

interface CloudRecordViewModel extends CloudRecordSummary {
  readonly swipeX: number;
  readonly isDeleting?: boolean;
}

interface PrizeSlotViewModel {
  readonly id: string;
  readonly drawn: boolean;
}

interface PrizeViewModel {
  readonly id: string;
  readonly tier: string;
  readonly total: number;
  readonly remaining: number;
  readonly probability: string;
  readonly presentation: PrizePresentation;
  readonly isTarget: boolean;
  readonly slots: readonly PrizeSlotViewModel[];
}

interface HistoryViewModel {
  readonly id: string;
  readonly index: number;
  readonly tier: string;
  readonly remaining: number;
  readonly cost: string;
}

interface ActiveDraftViewModel extends LocalDrawDraftSummary {
  readonly ticketPrice: number;
  readonly buyout: string;
  readonly targets: readonly string[];
  readonly grandPrizes: readonly PrizeViewModel[];
  readonly normalPrizes: readonly PrizeViewModel[];
  readonly historyItems: readonly HistoryViewModel[];
}

interface ToastViewModel {
  readonly visible: boolean;
  readonly tier: string;
  readonly remaining: number;
  readonly message: string;
  readonly cost: string;
  readonly presentation: PrizePresentation;
}

const draftRepository = createWxLocalDrawDraftRepository();
const storage = getWxStorageDriver();
const TICKET_PEEL_DISTANCE_PX = 96;
const TICKET_PEEL_THRESHOLD_PERCENT = 50;
const TICKET_PEEL_EXIT_PERCENT = 145;
const TICKET_PEEL_SPRING_MS = 320;
const TICKET_PEEL_FRAME_MS = 16;
const TICKET_PEEL_EXIT_FADE_MS = 80;
const STOP_HOLD_DURATION_MS = 500;
let touchStartX = 0;
let touchStartY = 0;
let swipeStartX = 0;
let swipingBoardId = "";
const deletingUploadedRecordIds = new Set<string>();
let draftGestureAxis: "pending" | "horizontal" | "vertical" = "pending";
let suppressOpenBoardId = "";
let ticketPeelStartX = 0;
let ticketPeelLastX = 0;
let ticketPeelLastTime = 0;
let ticketPeelVelocity = 0;
let ticketPeelTier = "";
let recognitionTimers: ReturnType<typeof setTimeout>[] = [];
let recognitionProgressAnimator: RecognitionProgressAnimator | undefined;
let recognitionCanvasGeneration = 0;
let recognitionRingCanvas: RecognitionRingCanvas | undefined;
let recognitionRingContext: RecognitionRingContext | undefined;
let recognitionRingSize = 112;
let recognitionPublishedProgress = -1;
let recognitionPublishedStage = -1;
let recognitionPublishedTarget = -1;
let recognitionPublishedResultReady = false;
let recognitionEndToEndStartedAt = 0;
let recognitionCaptureMs = 0;
let generationSequence = 0;
const finalizationInFlight = new Set<string>();
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let stopHoldTimer: ReturnType<typeof setTimeout> | undefined;
let peelPersistenceTimer: ReturnType<typeof setTimeout> | undefined;
let ticketPeelSpringTimer: ReturnType<typeof setTimeout> | undefined;

const createGenerationId = (): string =>
  `generation-${Date.now().toString(36)}-${(++generationSequence).toString(36)}`;
let ticketPeelResetTimer: ReturnType<typeof setTimeout> | undefined;
let cameraGeneration = 0;
let cameraTiming: {
  tapAt: number;
  navigationRequestAt?: number;
  cameraViewAt?: number;
  cameraOnLoadAt?: number;
  cameraInitAt?: number;
  readyAt?: number;
} | null = null;
let cloudAccountRequest:
  | Promise<{
      profile: CloudAccountProfile;
      quota: CloudQuotaSummary;
    }>
  | undefined;

interface RecognitionRingContext {
  lineWidth: number;
  lineCap: "round";
  strokeStyle: string;
  clearRect(x: number, y: number, width: number, height: number): void;
  beginPath(): void;
  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
  ): void;
  stroke(): void;
  scale(x: number, y: number): void;
}

interface RecognitionRingCanvas {
  width: number;
  height: number;
  getContext(type: "2d"): RecognitionRingContext;
  requestAnimationFrame?(callback: (timestamp: number) => void): number;
  cancelAnimationFrame?(handle: number): void;
}

type RecognitionFrameHandle =
  | { readonly kind: "canvas"; readonly value: number }
  | { readonly kind: "timer"; readonly value: ReturnType<typeof setTimeout> };

const recognitionFrameScheduler: RecognitionFrameScheduler = {
  now: () => Date.now(),
  requestFrame(callback) {
    if (recognitionRingCanvas?.requestAnimationFrame) {
      return {
        kind: "canvas",
        value: recognitionRingCanvas.requestAnimationFrame(callback),
      } satisfies RecognitionFrameHandle;
    }
    return {
      kind: "timer",
      value: setTimeout(() => callback(Date.now()), 16),
    } satisfies RecognitionFrameHandle;
  },
  cancelFrame(handle) {
    const frame = handle as RecognitionFrameHandle;
    if (frame.kind === "canvas") {
      recognitionRingCanvas?.cancelAnimationFrame?.(frame.value);
      return;
    }
    clearTimeout(frame.value);
  },
};

const drawRecognitionRing = (displayProgress: number): void => {
  const context = recognitionRingContext;
  if (!context) return;
  const size = recognitionRingSize;
  const center = size / 2;
  const lineWidth = 6;
  const radius = center - lineWidth / 2;
  const startAngle = -Math.PI / 2;
  const progress = Math.min(100, Math.max(0, displayProgress));
  context.clearRect(0, 0, size, size);
  context.lineWidth = lineWidth;
  context.lineCap = "round";
  context.strokeStyle = "#e6e8ec";
  context.beginPath();
  context.arc(center, center, radius, 0, Math.PI * 2);
  context.stroke();
  if (progress <= 0) return;
  context.strokeStyle = "#111111";
  context.beginPath();
  context.arc(
    center,
    center,
    radius,
    startAngle,
    startAngle + Math.PI * 2 * (progress / 100),
  );
  context.stroke();
};

const BOARD_PROMPT_VERSION = "ichi-board-vlm-4.0.3-rc1";
const LOCATION_CONSENT_VERSION = "v1-location-consent-1.0.0";
const PRIVATE_OBSERVATION_CONSENT_VERSION =
  "v1-private-observation-consent-1.0.0";
const NO_IMAGE_DISCLOSURE_VERSION = "v1-no-image-persistence-1.0.0";

const markCameraTiming = (
  phase: keyof NonNullable<typeof cameraTiming>,
): void => {
  if (!cameraTiming) return;
  cameraTiming[phase] = Date.now();
  const timings = { ...cameraTiming };
  const elapsed = Object.fromEntries(
    Object.entries(timings)
      .filter(([key]) => key !== "tapAt")
      .map(([key, value]) => [
        `${key.replace(/At$/u, "")}Ms`,
        typeof value === "number" ? value - cameraTiming!.tapAt : undefined,
      ]),
  );
  console.info("board_camera_client_timing", {
    phase,
    ...timings,
    ...elapsed,
  });
};

const createRecognitionIdempotencyKey = (): string =>
  `board-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

const toDraftViewModels = (
  drafts: readonly LocalDrawDraft[],
  current: readonly DraftViewModel[],
): DraftViewModel[] => {
  const offsets = new Map(
    current.map((draft) => [draft.boardId, draft.swipeX] as const),
  );
  return drafts.map((draft) => ({
    ...summarizeLocalDrawDraft(draft),
    swipeX: offsets.get(draft.boardId) ?? 0,
    ...(draft.cloudRecordId &&
    deletingUploadedRecordIds.has(draft.cloudRecordId)
      ? { isDeleting: true }
      : {}),
  }));
};

const getTopSafePx = (): number => {
  const info = wx.getWindowInfo();
  const menuButton = wx.getMenuButtonBoundingClientRect();
  return Math.max(
    40,
    info.statusBarHeight ?? 0,
    info.safeArea?.top ?? 0,
    menuButton.bottom + 12,
  );
};

const resolveUnitPrice = (draft: LocalDrawDraft): number =>
  draft.unitPrice ??
  (draft.history.length > 0
    ? Math.round(draft.cost / draft.history.length)
    : DEFAULT_RECOGNITION_PRICE);

const toActiveDraftViewModel = (
  draft: LocalDrawDraft,
): ActiveDraftViewModel => {
  const summary = summarizeLocalDrawDraft(draft);
  const ticketPrice = resolveUnitPrice(draft);
  const targets = draft.targetTiers ?? [];
  const prizes = draft.prizeData.map((prize) => {
    const initialRemaining = initialRemainingForPrize(prize);
    const currentRemaining = currentRemainingForPrize(draft, prize);
    const drawnCount = initialRemaining - currentRemaining;
    const presentation = presentationForPrize(prize);
    return {
      id: prize.id,
      tier: prize.tier,
      total: initialRemaining,
      remaining: currentRemaining,
      probability: formatProbability(currentRemaining, summary.remaining),
      presentation,
      isTarget: targets.includes(prize.tier),
      slots: Array.from({ length: initialRemaining }, (_, slotIndex) => ({
        id: `${prize.id}-${slotIndex}`,
        drawn: slotIndex < drawnCount,
      })),
    };
  });
  return {
    ...summary,
    ticketPrice,
    buyout: (summary.remaining * ticketPrice).toLocaleString(),
    targets,
    grandPrizes: prizes.filter((prize) =>
      draft.schemaVersion === "board-record-r2-1.0.0"
        ? prize.presentation === "large"
        : toWorkspaceSection(prize.presentation) === "grand",
    ),
    normalPrizes: prizes.filter((prize) =>
      draft.schemaVersion === "board-record-r2-1.0.0"
        ? prize.presentation !== "large"
        : toWorkspaceSection(prize.presentation) === "normal",
    ),
    historyItems: draft.history
      .map((item, index) => ({
        id: item.id,
        index: index + 1,
        tier: item.tier,
        remaining: summary.remaining + draft.history.length - index - 1,
        cost: ((index + 1) * ticketPrice).toLocaleString(),
      }))
      .reverse(),
  };
};

const createBoardId = (): string =>
  `board-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createRecognitionValidation = (
  mode: RecognitionFlowMode,
  ipName: string,
  locationNote: string,
  prizes: readonly RecognitionPrizeDraft[],
  unitPrice: number | null,
): RecognitionDraftValidation =>
  validateRecognitionDraft({
    mode,
    ipName,
    locationNote,
    prizes,
    unitPrice,
  });

const clearRecognitionPollingTimers = (): void => {
  recognitionTimers.forEach((timer) => clearTimeout(timer));
  recognitionTimers = [];
};

const stopRecognitionProgress = (): void => {
  recognitionCanvasGeneration += 1;
  recognitionProgressAnimator?.stop();
  recognitionProgressAnimator = undefined;
  recognitionRingCanvas = undefined;
  recognitionRingContext = undefined;
  recognitionPublishedProgress = -1;
  recognitionPublishedStage = -1;
  recognitionPublishedTarget = -1;
  recognitionPublishedResultReady = false;
};

const clearRecognitionTimers = (): void => {
  clearRecognitionPollingTimers();
  stopRecognitionProgress();
};

const DEFAULT_ACCOUNT_AVATAR = "/assets/v1-29/ichi-avatar.png";
const ACCOUNT_DISPLAY_CACHE_KEY = "ichi.account-display.v1";

const isProfileAuthorizationReady = (
  purpose: "first-use" | "update",
  nickname: unknown,
  avatarPath: unknown,
  originalNickname: unknown,
): boolean => {
  const normalizedNickname = String(nickname ?? "").trim();
  const normalizedAvatarPath = String(avatarPath ?? "").trim();
  if (!normalizedNickname) return false;
  if (purpose === "first-use") return Boolean(normalizedAvatarPath);
  return (
    normalizedNickname !== String(originalNickname ?? "").trim() ||
    Boolean(normalizedAvatarPath)
  );
};

interface AccountDisplayCache {
  readonly version: 1;
  readonly ichiId: string;
  readonly nickname: string;
  readonly avatarFileId: string;
  readonly avatarPath: string;
}

const readAccountDisplayCache = (): AccountDisplayCache | undefined => {
  try {
    const raw = storage.getItem(ACCOUNT_DISPLAY_CACHE_KEY);
    const value =
      typeof raw === "string"
        ? (JSON.parse(raw) as Partial<AccountDisplayCache>)
        : undefined;
    if (
      value?.version !== 1 ||
      typeof value.ichiId !== "string" ||
      typeof value.nickname !== "string" ||
      typeof value.avatarFileId !== "string" ||
      !value.avatarFileId.startsWith("cloud://") ||
      typeof value.avatarPath !== "string" ||
      !value.avatarPath
    ) {
      return undefined;
    }
    const fileSystem = (
      wx as unknown as {
        getFileSystemManager?: () => { accessSync?: (path: string) => void };
      }
    ).getFileSystemManager?.();
    fileSystem?.accessSync?.(value.avatarPath);
    return value as AccountDisplayCache;
  } catch {
    return undefined;
  }
};

const persistAccountDisplayCache = async (
  profile: CloudAccountProfile,
  selectedAvatarPath?: string,
): Promise<string | undefined> => {
  if (!profile.avatarFileId?.startsWith("cloud://")) return undefined;
  const existing = readAccountDisplayCache();
  if (existing?.avatarFileId === profile.avatarFileId && !selectedAvatarPath) {
    storage.setItem(
      ACCOUNT_DISPLAY_CACHE_KEY,
      JSON.stringify({
        ...existing,
        ichiId: profile.ichiId,
        nickname: profile.nickname,
      }),
    );
    return existing.avatarPath;
  }
  try {
    const api = wx as unknown as {
      readonly env?: { readonly USER_DATA_PATH?: string };
      readonly cloud?: {
        downloadFile?(options: {
          readonly fileID: string;
        }): Promise<{ readonly tempFilePath?: string }>;
      };
      getFileSystemManager(): {
        saveFileSync(tempFilePath: string, filePath?: string): string;
        unlinkSync?(filePath: string): void;
      };
    };
    const userDataPath = api.env?.USER_DATA_PATH;
    if (!userDataPath) return undefined;
    let sourcePath = selectedAvatarPath;
    if (!sourcePath) {
      const download = await api.cloud?.downloadFile?.({
        fileID: profile.avatarFileId,
      });
      sourcePath = download?.tempFilePath;
    }
    if (!sourcePath) return undefined;
    const fileSystem = api.getFileSystemManager();
    const destination = `${userDataPath}/ichi-profile-avatar-${Date.now()}.jpg`;
    const savedPath =
      fileSystem.saveFileSync(sourcePath, destination) || destination;
    const cache: AccountDisplayCache = {
      version: 1,
      ichiId: profile.ichiId,
      nickname: profile.nickname,
      avatarFileId: profile.avatarFileId,
      avatarPath: savedPath,
    };
    storage.setItem(ACCOUNT_DISPLAY_CACHE_KEY, JSON.stringify(cache));
    if (existing?.avatarPath && existing.avatarPath !== savedPath) {
      try {
        fileSystem.unlinkSync?.(existing.avatarPath);
      } catch {
        // A stale display cache must not block the newly authorized profile.
      }
    }
    return savedPath;
  } catch {
    return undefined;
  }
};

const resolveAccountAvatarSource = (
  profile: CloudAccountProfile,
  fallback = DEFAULT_ACCOUNT_AVATAR,
): string => profile.avatarFileId || profile.avatarUrl || fallback;

const isNativeCameraSurfaceActive = (
  data: Readonly<{ currentView: HomeView; modalView: ModalView }>,
): boolean =>
  data.currentView === "camera-capture" || data.modalView === "share-capture";

const requestBoardLocation = (): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
  coordinateSystem: "gcj02";
  obtainedAt: number;
}> =>
  new Promise((resolve, reject) => {
    const api = wx as unknown as {
      getLocation(options: {
        type: "gcj02";
        success(result: {
          latitude: number;
          longitude: number;
          accuracy?: number;
        }): void;
        fail(error: unknown): void;
      }): void;
    };
    if (typeof api.getLocation !== "function") {
      reject(new Error("LOCATION_UNAVAILABLE"));
      return;
    }
    api.getLocation({
      type: "gcj02",
      success(result) {
        resolve({
          latitude: result.latitude,
          longitude: result.longitude,
          accuracy: Math.max(0, result.accuracy ?? 0),
          coordinateSystem: "gcj02",
          obtainedAt: Date.now(),
        });
      },
      fail: reject,
    });
  });

const requestCameraAuthorization = (): Promise<void> =>
  new Promise((resolve, reject) => {
    const api = wx as unknown as {
      getSetting(options: {
        success(result: {
          authSetting: Record<string, boolean | undefined>;
        }): void;
        fail(error: unknown): void;
      }): void;
      authorize(options: {
        scope: "scope.camera";
        success(): void;
        fail(error: unknown): void;
      }): void;
    };
    api.getSetting({
      success(result) {
        const cameraPermission = result.authSetting["scope.camera"];
        if (cameraPermission === true) {
          resolve();
          return;
        }
        if (cameraPermission === false) {
          reject(new Error("CAMERA_PERMISSION_DENIED"));
          return;
        }
        api.authorize({
          scope: "scope.camera",
          success: resolve,
          fail: reject,
        });
      },
      fail: reject,
    });
  });

Page({
  data: {
    currentView: "start" as HomeView,
    activeTab: "recognize" as MainTab,
    topSafePx: 40,
    drafts: [] as DraftViewModel[],
    startDrafts: [] as DraftViewModel[],
    contributions: [] as DraftViewModel[],
    cloudRecords: [] as CloudRecordViewModel[],
    cloudClues: [] as CloudRecordViewModel[],
    cloudRecordsState: "idle" as "idle" | "loading" | "ready" | "unavailable",
    recordsRefreshing: false,
    uploadedCount: 0,
    unuploadedCount: 0,
    activeDraft: null as ActiveDraftViewModel | null,
    drawSessionStartHistoryCount: 0,
    drawSessionStartSavedAt: 0,
    recognitionPrizes: createRecognitionFixture(),
    recognitionPrice: null as number | null,
    grandPrizeTiers: [] as string[],
    grandPrizeOptions: [] as Array<
      RecognitionPrizeDraft & { readonly selected: boolean }
    >,
    recognitionMode: "assist" as RecognitionFlowMode,
    recognitionIp: "",
    recognitionTheme: "",
    recognitionLocationNote: "",
    recognitionCapturedAt: 0,
    recognitionValidation: createRecognitionValidation(
      "assist",
      "",
      "",
      createRecognitionFixture(),
      null,
    ),
    recognitionStage: 0,
    recognitionProgress: 0,
    recognitionTargetProgress: 15,
    recognitionResultReady: false,
    recognitionError: "",
    generationState: "editing" as RecognitionGenerationState,
    generationId: "",
    mediaBusy: false,
    cameraStatus: "loading" as CameraStatus,
    cameraError: "",
    cameraGeneration: 0,
    recognitionGateBusy: false,
    pendingBoardCapture: false,
    boardCapturePath: "",
    pendingEvidenceCapture: false,
    pendingDeleteUploadedRecordId: "",
    pendingDeleteUploadedBoardId: "",
    modalView: "" as ModalView,
    outlook: {
      status: "unavailable",
      reason: "尚未建立票池。",
    } as BoardOutlookView,
    toast: {
      visible: false,
      tier: "",
      remaining: 0,
      message: "",
      cost: "0",
      presentation: "medium",
    } as ToastViewModel,
    continuousUndoCount: 0,
    ticketPeelTier: "",
    ticketPeelProgress: 0,
    ticketPeelSettling: false,
    ticketPeelBusy: false,
    ticketPeelFading: false,
    stopHolding: false,
    shareImagePath: "",
    shareNote: "",
    shareReady: false,
    noteReviewRecordId: "",
    noteReviewBoardId: "",
    noteReviewSubmissionVersion: 0,
    evidenceSubmitting: false,
    storagePercent: 0,
    storageCapacityState: "normal" as ReturnType<typeof getCapacityState>,
    recognitionScrollTop: 0,
    drawScrollTop: 0,
    recordsScrollTop: 0,
    reminderScrollTop: 0,
    methodScrollTop: 0,
    accountState: "loading" as AccountState,
    accountNickname: "ICHI 玩家",
    accountAvatarUrl: DEFAULT_ACCOUNT_AVATAR,
    accountIchiId: "同步中",
    accountProfileState: "incomplete",
    profileNicknameDraft: "",
    profileOriginalNickname: "",
    profileAvatarPath: "",
    profileAuthorizationReady: false,
    profileAuthorizationPurpose: "first-use" as "first-use" | "update",
    resumeCaptureAfterProfileAuthorization: false,
    quotaLimit: 5,
    quotaUsed: 0,
    quotaReserved: 0,
    quotaRemaining: 5,
    quotaUsedPercent: 0,
    quotaResetAt: "",
    accountBusy: false,
    pendingRecognitionMode: "assist" as RecognitionFlowMode,
  },

  onLoad() {
    let stableView: RecognitionStableView;
    let recognitionFlow: ReturnType<typeof decodeRecognitionFlow>;
    let storageStatus: ReturnType<typeof inspectLocalDraftStorage>;
    let activeBoardId: string | null;
    try {
      stableView = readRecognitionStableView(storage);
      recognitionFlow = decodeRecognitionFlow(
        storage.getItem(RECOGNITION_FLOW_KEY),
      );
      storageStatus = inspectLocalDraftStorage(
        storage.getItem(LOCAL_DRAW_DRAFTS_KEY),
      );
      activeBoardId = readActiveDraftBoardId(storage);
    } catch {
      this.setData({
        currentView: "storage-fallback" as const,
        activeTab: "my" as const,
        topSafePx: getTopSafePx(),
        storageCapacityState: "unknown" as const,
      });
      return;
    }
    const cachedAccount = readAccountDisplayCache();
    this.setData({
      currentView:
        storageStatus === "schema-incompatible"
          ? ("schema-incompatible" as const)
          : stableView,
      activeTab: "recognize",
      topSafePx: getTopSafePx(),
      ...(cachedAccount
        ? {
            accountNickname: cachedAccount.nickname,
            accountAvatarUrl: cachedAccount.avatarPath,
            accountIchiId: cachedAccount.ichiId,
            accountProfileState: "complete",
          }
        : {}),
      ...(recognitionFlow
        ? {
            recognitionPrizes: [...recognitionFlow.prizes],
            recognitionPrice: recognitionFlow.unitPrice,
            recognitionMode: recognitionFlow.mode ?? "assist",
            recognitionIp: recognitionFlow.ipName ?? "",
            recognitionTheme: recognitionFlow.themeName ?? "",
            recognitionLocationNote: recognitionFlow.locationNote ?? "",
            grandPrizeTiers: [...recognitionFlow.selectedGrandPrizeTiers],
            grandPrizeOptions: recognitionFlow.prizes.map((prize) => ({
              ...prize,
              selected: recognitionFlow.selectedGrandPrizeTiers.includes(
                prize.tier,
              ),
            })),
            recognitionCapturedAt: recognitionFlow.capturedAt ?? 0,
            recognitionValidation: createRecognitionValidation(
              recognitionFlow.mode ?? "assist",
              recognitionFlow.ipName ?? "",
              recognitionFlow.locationNote ?? "",
              recognitionFlow.prizes,
              recognitionFlow.unitPrice,
            ),
          }
        : {}),
    });
    this.refreshDrafts(activeBoardId ?? undefined);
    const restoredDraft = activeBoardId
      ? draftRepository
          .readAll()
          .find((draft) => draft.boardId === activeBoardId)
      : undefined;
    if (stableView === "draw" && restoredDraft) {
      this.setData({
        drawSessionStartHistoryCount: restoredDraft.history.length,
        drawSessionStartSavedAt: restoredDraft.savedAt,
      });
    }
    this.refreshStorageInfo();
    if (recognitionFlow?.recognitionJobId) {
      const globalData = getApp<IchiApp>().globalData;
      globalData.pendingRecognitionJobId = recognitionFlow.recognitionJobId;
      globalData.pendingBoardAcquisition =
        recognitionFlow.acquisition ?? "camera";
      void this.restoreCloudRecognitionJob(recognitionFlow.recognitionJobId);
    }
  },

  releasePendingBoardMedia() {
    const globalData = getApp<IchiApp>().globalData;
    const recognitionJobId = globalData.pendingRecognitionJobId;
    const recognitionJobToken = globalData.pendingRecognitionJobToken;
    const paths = new Set<string>();
    if (globalData.pendingBoardImage?.tempFilePath) {
      paths.add(globalData.pendingBoardImage.tempFilePath);
    }
    paths.forEach((filePath) => {
      void deleteWxTemporaryBoardImage(filePath);
    });
    if (recognitionJobId && recognitionJobToken) {
      void this.releasePendingRecognitionQuota(
        recognitionJobId,
        recognitionJobToken,
      );
    }
    delete globalData.pendingBoardImage;
    delete globalData.pendingBoardAcquisition;
    delete globalData.pendingBoardLocation;
    delete globalData.pendingRecognitionIdempotencyKey;
    delete globalData.pendingRecognitionJobId;
    delete globalData.pendingRecognitionJobToken;
    delete globalData.pendingRecognitionMode;
  },

  onShow() {
    this.refreshDrafts();
    void this.refreshCloudAccount();
    void this.resumePendingFinalizations();
    void this.resumePendingTicketVerifications();
  },

  onUnload() {
    this.setData({ generationId: "" });
    this.releasePendingBoardMedia();
    clearRecognitionTimers();
    if (toastTimer) clearTimeout(toastTimer);
    if (stopHoldTimer) clearTimeout(stopHoldTimer);
    if (peelPersistenceTimer) clearTimeout(peelPersistenceTimer);
    if (ticketPeelSpringTimer) clearTimeout(ticketPeelSpringTimer);
    if (ticketPeelResetTimer) clearTimeout(ticketPeelResetTimer);
    ticketPeelTier = "";
    cameraGeneration += 1;
    cameraTiming = null;
  },

  refreshStorageInfo() {
    try {
      const info = storage.getInfo();
      const storagePercent =
        info.limitSizeKB > 0
          ? Math.min(
              100,
              Math.round((info.currentSizeKB / info.limitSizeKB) * 100),
            )
          : 0;
      this.setData({
        storagePercent,
        storageCapacityState: getCapacityState(info),
      });
    } catch {
      this.setData({ storagePercent: 0, storageCapacityState: "unknown" });
    }
  },

  refreshDrafts(activeBoardIdOverride?: string | null) {
    let drafts: LocalDrawDraft[];
    let storedActiveBoardId: string | null;
    try {
      drafts = draftRepository.readAll();
      storedActiveBoardId = readActiveDraftBoardId(storage);
    } catch {
      this.setData({
        activeTab: "my" as const,
        currentView: "storage-fallback" as const,
        storageCapacityState: "unknown" as const,
      });
      return;
    }
    const currentDrafts = this.data.drafts as readonly DraftViewModel[];
    const activeBoardId =
      activeBoardIdOverride !== undefined
        ? activeBoardIdOverride
        : ((this.data.activeDraft as ActiveDraftViewModel | null)?.boardId ??
          storedActiveBoardId);
    const activeDraft = activeBoardId
      ? drafts.find((draft) => draft.boardId === activeBoardId)
      : undefined;
    const activeDraftWasRemoved = Boolean(activeBoardId && !activeDraft);
    if (activeDraftWasRemoved) {
      this.saveNavigation("start", null);
    }
    const submissionStateOf = (draft: LocalDrawDraft) => {
      if (draft.submissionState) return draft.submissionState;
      // A draw draft may have a cloud observation identity before any ticket
      // evidence was submitted. That identity is not a contribution upload.
      if ((draft.recordType ?? "draw") === "draw") {
        return draft.evidenceSubmissionVersion &&
          draft.evidenceSubmissionVersion > 0
          ? draft.verificationStatus === "verified"
            ? ("uploaded" as const)
            : ("pending-review" as const)
          : ("local" as const);
      }
      return draft.uploadStatus === "uploaded"
        ? ("pending-review" as const)
        : ("local" as const);
    };
    const localSubmissionState = (draft: LocalDrawDraft) =>
      submissionStateOf(draft);
    this.setData({
      drafts: toDraftViewModels(drafts, currentDrafts),
      startDrafts: toDraftViewModels(
        drafts.filter(
          (draft) =>
            (draft.recordType ?? "draw") === "draw" &&
            isResumableLocalDrawDraft(draft) &&
            localSubmissionState(draft) === "local",
        ),
        this.data.startDrafts as readonly DraftViewModel[],
      ),
      contributions: toDraftViewModels(
        drafts.filter((draft) => {
          const state = localSubmissionState(draft);
          return state === "pending-review" || state === "uploaded";
        }),
        currentDrafts,
      ),
      uploadedCount: drafts.filter(
        (draft) => localSubmissionState(draft) !== "local",
      ).length,
      unuploadedCount: drafts.filter(
        (draft) => localSubmissionState(draft) === "local",
      ).length,
      activeDraft: activeDraft ? toActiveDraftViewModel(activeDraft) : null,
      ...(this.data.currentView === "draw" && !activeDraft
        ? { currentView: "start" as const }
        : {}),
    });
    if (activeDraft) this.updateOutlook(activeDraft);
  },

  persistDraft(
    draft: LocalDrawDraft,
    stableView: RecognitionStableView = "draw",
  ): boolean {
    try {
      draftRepository.upsert(draft);
      if (!this.saveNavigation(stableView, draft.boardId)) return false;
      this.refreshDrafts(draft.boardId);
      this.refreshStorageInfo();
      return true;
    } catch {
      this.setData({ modalView: "storage-warning" as const });
      return false;
    }
  },

  saveNavigation(
    stableView: RecognitionStableView,
    activeBoardId?: string | null,
  ): boolean {
    try {
      writeRecognitionStableView(storage, stableView);
      if (activeBoardId !== undefined) {
        writeActiveDraftBoardId(storage, activeBoardId);
      }
      return true;
    } catch {
      this.setData({ modalView: "storage-warning" as const });
      return false;
    }
  },

  async refreshCloudAccount(showFailure = false) {
    this.setData({ accountBusy: true });
    try {
      cloudAccountRequest ??= loadCloudAccount(getWxCloudFunctionApi());
      const account = await cloudAccountRequest;
      const app = getApp<IchiApp>();
      app.globalData.accountProfile = account.profile;
      app.globalData.accountQuota = account.quota;
      const cachedAccount = readAccountDisplayCache();
      const cachedAvatarPath =
        cachedAccount &&
        cachedAccount.avatarFileId === account.profile.avatarFileId
          ? cachedAccount.avatarPath
          : undefined;
      this.setData({
        accountState: "ready" as const,
        accountNickname: account.profile.nickname,
        accountAvatarUrl:
          cachedAvatarPath ??
          (account.profile.avatarFileId
            ? String(this.data.accountAvatarUrl || DEFAULT_ACCOUNT_AVATAR)
            : resolveAccountAvatarSource(
                account.profile,
                String(this.data.accountAvatarUrl || DEFAULT_ACCOUNT_AVATAR),
              )),
        accountIchiId: account.profile.ichiId,
        accountProfileState: account.profile.profileState,
        quotaLimit: account.quota.limit,
        quotaUsed: account.quota.used,
        quotaReserved: account.quota.reserved,
        quotaRemaining: account.quota.remaining,
        quotaUsedPercent: quotaUsedPercent(account.quota),
        quotaResetAt: account.quota.resetAt,
        ...(account.profile.profileState !== "complete" && !this.data.modalView
          ? {
              modalView: "wechat-login" as const,
              profileAuthorizationPurpose: "first-use" as const,
              profileNicknameDraft: "",
              profileOriginalNickname: "",
              profileAvatarPath: "",
              profileAuthorizationReady: false,
            }
          : {}),
      });
      if (!cachedAvatarPath && account.profile.avatarFileId) {
        void persistAccountDisplayCache(account.profile).then((avatarPath) => {
          if (
            avatarPath &&
            getApp<IchiApp>().globalData.accountProfile?.avatarFileId ===
              account.profile.avatarFileId
          ) {
            this.setData({ accountAvatarUrl: avatarPath });
          }
        });
      }
      void this.refreshCloudRecords();
      return account as {
        profile: CloudAccountProfile;
        quota: CloudQuotaSummary;
      };
    } catch {
      this.setData({
        accountState: "unavailable" as const,
        ...(showFailure ? { modalView: "account-unavailable" as const } : {}),
      });
      return null;
    } finally {
      cloudAccountRequest = undefined;
      this.setData({ accountBusy: false });
    }
  },

  onProfileNicknameInput(event: WechatMiniprogram.Input) {
    const profileNicknameDraft = String(event.detail.value ?? "");
    this.setData({
      profileNicknameDraft,
      profileAuthorizationReady: isProfileAuthorizationReady(
        this.data.profileAuthorizationPurpose,
        profileNicknameDraft,
        this.data.profileAvatarPath,
        this.data.profileOriginalNickname,
      ),
    });
  },

  onChooseWechatAvatar(
    event: WechatMiniprogram.CustomEvent<{ avatarUrl?: string }>,
  ) {
    const avatarPath = String(event.detail?.avatarUrl ?? "").trim();
    if (avatarPath)
      this.setData({
        profileAvatarPath: avatarPath,
        profileAuthorizationReady: isProfileAuthorizationReady(
          this.data.profileAuthorizationPurpose,
          this.data.profileNicknameDraft,
          avatarPath,
          this.data.profileOriginalNickname,
        ),
      });
  },

  onOpenWechatProfileAuthorization() {
    if (this.data.accountState !== "ready") {
      void this.refreshCloudAccount(true);
      return;
    }
    this.setData({
      modalView: "wechat-login" as const,
      profileAuthorizationPurpose:
        this.data.accountProfileState === "complete"
          ? ("update" as const)
          : ("first-use" as const),
      profileNicknameDraft:
        this.data.accountProfileState === "complete"
          ? String(this.data.accountNickname)
          : "",
      profileOriginalNickname:
        this.data.accountProfileState === "complete"
          ? String(this.data.accountNickname)
          : "",
      profileAvatarPath: "",
      profileAuthorizationReady: false,
      resumeCaptureAfterProfileAuthorization: false,
    });
  },

  onCloseWechatProfileAuthorization() {
    if (this.data.profileAuthorizationPurpose !== "update") return;
    const avatarPath = String(this.data.profileAvatarPath).trim();
    if (avatarPath.startsWith("/") || avatarPath.startsWith("wxfile://")) {
      void deleteWxTemporaryBoardImage(avatarPath);
    }
    this.setData({
      modalView: "" as const,
      profileNicknameDraft: "",
      profileOriginalNickname: "",
      profileAvatarPath: "",
      profileAuthorizationReady: false,
    });
  },

  async onAuthorizeWechatProfile() {
    const nickname = String(this.data.profileNicknameDraft).trim();
    const avatarPath = String(this.data.profileAvatarPath).trim();
    const authorizationReady = isProfileAuthorizationReady(
      this.data.profileAuthorizationPurpose,
      nickname,
      avatarPath,
      this.data.profileOriginalNickname,
    );
    if (!authorizationReady) {
      wx.showToast({
        title:
          this.data.profileAuthorizationPurpose === "first-use"
            ? "请先填写昵称并选择头像"
            : "请先更改头像或昵称",
        icon: "none",
      });
      return;
    }
    try {
      const api = getWxCloudFunctionApi();
      const existingProfile = getApp<IchiApp>().globalData.accountProfile;
      const existingAvatarBinding = existingProfile?.avatarFileId
        ? { avatarFileId: existingProfile.avatarFileId }
        : existingProfile?.avatarUrl
          ? { avatarUrl: existingProfile.avatarUrl }
          : undefined;
      if (!avatarPath && !existingAvatarBinding) {
        throw new CloudAccountError("PROFILE_AVATAR_INVALID");
      }
      const profile = avatarPath
        ? await bindWechatProfileFromSelection(
            api,
            { nickname, avatarPath },
            getWxWechatProfileMediaAdapter(),
          )
        : await bindWechatProfile(api, {
            nickname,
            ...existingAvatarBinding,
          });
      cloudAccountRequest = undefined;
      const cachedAvatarPath = await persistAccountDisplayCache(
        profile,
        avatarPath || undefined,
      );
      getApp<IchiApp>().globalData.accountProfile = profile;
      this.setData({
        accountNickname: profile.nickname,
        accountAvatarUrl:
          cachedAvatarPath ??
          resolveAccountAvatarSource(
            profile,
            String(this.data.accountAvatarUrl || DEFAULT_ACCOUNT_AVATAR),
          ),
        accountProfileState: profile.profileState,
        profileNicknameDraft: "",
        profileOriginalNickname: "",
        profileAvatarPath: "",
        profileAuthorizationReady: false,
        modalView: "" as const,
      });
      wx.showToast({
        title:
          this.data.profileAuthorizationPurpose === "first-use"
            ? "微信登录成功"
            : "微信资料已更新",
        icon: "success",
      });
      if (this.data.resumeCaptureAfterProfileAuthorization) {
        this.setData({ resumeCaptureAfterProfileAuthorization: false });
        await this.onImportBoard({
          currentTarget: {
            dataset: { flowMode: this.data.pendingRecognitionMode },
          },
        } as unknown as WechatMiniprogram.BaseEvent);
      }
    } catch {
      wx.showToast({ title: "微信资料授权失败", icon: "none" });
    } finally {
      if (avatarPath.startsWith("/") || avatarPath.startsWith("wxfile://")) {
        void deleteWxTemporaryBoardImage(avatarPath);
      }
    }
  },

  async refreshCloudRecords() {
    if (!isNativeCameraSurfaceActive(this.data)) {
      this.setData({ cloudRecordsState: "loading" as const });
    }
    try {
      const result = await loadMyCloudRecords(getWxCloudFunctionApi());
      const localBoardIds = new Set(
        (this.data.drafts as readonly DraftViewModel[]).map(
          (record) => record.boardId,
        ),
      );
      const currentCloudRecords = this.data
        .cloudRecords as readonly CloudRecordViewModel[];
      const records = result.records
        .filter((record) => !localBoardIds.has(record.boardId))
        .map((record) => ({
          ...record,
          swipeX:
            currentCloudRecords.find(
              (current) => current.recordId === record.recordId,
            )?.swipeX ?? 0,
          ...(deletingUploadedRecordIds.has(record.recordId)
            ? { isDeleting: true }
            : {}),
        }));
      if (!isNativeCameraSurfaceActive(this.data)) {
        this.setData({
          cloudRecords: records,
          cloudClues: records.filter(
            (record) =>
              record.recordStateLabel === "待核对" ||
              record.recordStateLabel === "核验异常" ||
              record.recordStateLabel === "核验失败" ||
              record.recordStateLabel === "照片核验失败" ||
              record.recordStateLabel === "备注未通过" ||
              record.recordStateLabel === "已上传",
          ),
          cloudRecordsState: "ready" as const,
        });
      }
    } catch {
      if (!isNativeCameraSurfaceActive(this.data)) {
        this.setData({ cloudRecordsState: "unavailable" as const });
      }
    }
  },

  onDeleteCloudRecord(event: WechatMiniprogram.BaseEvent) {
    const recordId = event.currentTarget.dataset.recordId as string | undefined;
    const boardId = event.currentTarget.dataset.boardId as string | undefined;
    if (!recordId || deletingUploadedRecordIds.has(recordId)) return;
    this.setDraftSwipe("", 0);
    this.setData({
      pendingDeleteUploadedRecordId: recordId,
      pendingDeleteUploadedBoardId: boardId ?? "",
      modalView: "delete-uploaded-board" as const,
    });
  },

  onCancelDeleteUploadedBoard() {
    this.setData({
      pendingDeleteUploadedRecordId: "",
      pendingDeleteUploadedBoardId: "",
      modalView: "" as const,
    });
  },

  async onConfirmDeleteUploadedBoard() {
    const recordId = String(this.data.pendingDeleteUploadedRecordId || "");
    const boardId = String(this.data.pendingDeleteUploadedBoardId || "");
    if (!recordId || deletingUploadedRecordIds.has(recordId)) return;
    deletingUploadedRecordIds.add(recordId);
    this.setUploadedRecordDeleting(recordId, true);
    this.onCancelDeleteUploadedBoard();
    try {
      await requestCloudRecordDeletion(getWxCloudFunctionApi(), {
        recordId,
        ...(boardId ? { boardId } : {}),
      });
      this.detachDeletedUpload(recordId);
      await this.refreshCloudRecords();
      wx.showToast({ title: "记录已删除", icon: "none" });
    } catch {
      deletingUploadedRecordIds.delete(recordId);
      this.setUploadedRecordDeleting(recordId, false);
      wx.showToast({ title: "删除失败，请重试", icon: "none" });
    }
  },

  setUploadedRecordDeleting(recordId: string, isDeleting: boolean) {
    const updateCloud = (record: CloudRecordViewModel) =>
      record.recordId === recordId
        ? { ...record, isDeleting, swipeX: 0 }
        : record;
    const updateDraft = (draft: DraftViewModel) =>
      draft.cloudRecordId === recordId
        ? { ...draft, isDeleting, swipeX: 0 }
        : draft;
    this.setData({
      cloudRecords: (this.data.cloudRecords as CloudRecordViewModel[]).map(
        updateCloud,
      ),
      cloudClues: (this.data.cloudClues as CloudRecordViewModel[]).map(
        updateCloud,
      ),
      contributions: (this.data.contributions as DraftViewModel[]).map(
        updateDraft,
      ),
    });
  },

  detachDeletedUpload(recordId: string) {
    const drafts = draftRepository.readAll().map((draft) => {
      if (draft.cloudRecordId !== recordId) return draft;
      const preservedHistory = { ...draft };
      delete preservedHistory.cloudRecordId;
      delete preservedHistory.evidenceSubmissionVersion;
      delete preservedHistory.currentVerificationVersion;
      delete preservedHistory.verificationPending;
      delete preservedHistory.originalEvidenceFileId;
      delete preservedHistory.originalEvidenceCapturedAt;
      delete preservedHistory.albumSaveWarning;
      return {
        ...preservedHistory,
        savedAt: Date.now(),
        uploadStatus: "not-uploaded" as const,
        submissionState: "local" as const,
        verificationStatus: "unverified" as const,
      };
    });
    drafts.forEach((draft) => draftRepository.upsert(draft));
    deletingUploadedRecordIds.delete(recordId);
    this.setData({
      cloudRecords: (this.data.cloudRecords as CloudRecordViewModel[]).filter(
        (record) => record.recordId !== recordId,
      ),
      cloudClues: (this.data.cloudClues as CloudRecordViewModel[]).filter(
        (record) => record.recordId !== recordId,
      ),
    });
    this.refreshDrafts();
  },

  beginBoardCapture(recognitionMode: RecognitionFlowMode) {
    if (!this.saveNavigation("start", null)) return;
    cameraGeneration += 1;
    const generation = cameraGeneration;
    markCameraTiming("cameraViewAt");
    const globalData = getApp<IchiApp>().globalData;
    globalData.pendingRecognitionMode = recognitionMode;
    try {
      storage.removeItem(RECOGNITION_FLOW_KEY);
    } catch {
      this.setData({ modalView: "storage-warning" as const });
      return;
    }
    this.setData({
      currentView: "camera-capture" as const,
      activeTab: "recognize" as const,
      recognitionError: "",
      recognitionPrizes: createRecognitionFixture(),
      recognitionPrice: DEFAULT_RECOGNITION_PRICE,
      recognitionMode,
      recognitionIp: "",
      recognitionTheme: "",
      recognitionLocationNote: "",
      recognitionCapturedAt: 0,
      recognitionValidation: createRecognitionValidation(
        recognitionMode,
        "",
        "",
        createRecognitionFixture(),
        DEFAULT_RECOGNITION_PRICE,
      ),
      activeDraft: null,
      modalView: "" as const,
      mediaBusy: false,
      cameraStatus: "loading" as const,
      cameraError: "",
      cameraGeneration: generation,
      pendingBoardCapture: false,
      boardCapturePath: "",
    });
    const nextTick = (
      wx as unknown as { nextTick?: (callback: () => void) => void }
    ).nextTick;
    if (typeof nextTick === "function") {
      nextTick(() => markCameraTiming("cameraOnLoadAt"));
    } else {
      markCameraTiming("cameraOnLoadAt");
    }
  },

  async onImportBoard(event?: WechatMiniprogram.BaseEvent) {
    if (
      this.data.recognitionGateBusy ||
      this.data.currentView === "camera-capture"
    )
      return;
    const requestedMode = event?.currentTarget.dataset.flowMode;
    const recognitionMode: RecognitionFlowMode =
      requestedMode === "direct-upload" ? "direct-upload" : "assist";
    cameraTiming = { tapAt: Date.now() };
    markCameraTiming("tapAt");
    this.setData({
      pendingRecognitionMode: recognitionMode,
      recognitionGateBusy: true,
    });
    this.releasePendingBoardMedia();
    try {
      const account = await this.refreshCloudAccount(true);
      if (!account) return;
      if (account.quota.remaining <= 0) {
        this.setData({
          modalView: "quota-exhausted" as const,
          resumeCaptureAfterProfileAuthorization: false,
        });
        return;
      }
      if (account.profile.profileState !== "complete") {
        this.setData({
          modalView: "wechat-login" as const,
          profileAuthorizationPurpose: "first-use" as const,
          profileNicknameDraft: "",
          profileOriginalNickname: "",
          profileAvatarPath: "",
          profileAuthorizationReady: false,
          resumeCaptureAfterProfileAuthorization: true,
        });
        return;
      }
      const boardLocation = await requestBoardLocation();
      getApp<IchiApp>().globalData.pendingBoardLocation = boardLocation;
      await requestCameraAuthorization();
      markCameraTiming("navigationRequestAt");
      this.beginBoardCapture(recognitionMode);
    } catch {
      this.setData({ modalView: "capture-permission-required" as const });
    } finally {
      this.setData({ recognitionGateBusy: false });
    }
  },

  onOpenCapturePermissionSettings() {
    wx.openSetting({
      success: () => {
        this.setData({ modalView: "" as const });
        void this.onImportBoard({
          currentTarget: {
            dataset: { flowMode: this.data.pendingRecognitionMode },
          },
        } as unknown as WechatMiniprogram.BaseEvent);
      },
      fail: () => {
        wx.showToast({ title: "无法打开设置", icon: "none" });
      },
    });
  },

  async onRetryRecognitionGate() {
    this.setData({ modalView: "" as const });
    await this.onImportBoard({
      currentTarget: {
        dataset: { flowMode: this.data.pendingRecognitionMode },
      },
    } as unknown as WechatMiniprogram.BaseEvent);
  },

  onResetQuotaCapture() {
    this.onUndoBoardCapture();
    this.setData({ modalView: "" as const });
    this.onBackToStart();
  },

  async onCaptureBoardMedia() {
    if (this.data.mediaBusy) return;
    if (this.data.boardCapturePath) {
      await this.confirmBoardCapture();
      return;
    }
    if (this.data.cameraStatus === "loading") {
      this.setData({ pendingBoardCapture: true });
      return;
    }
    if (this.data.cameraStatus !== "ready") return;
    this.setData({ pendingBoardCapture: false });
    await this.captureBoardMediaNow();
  },

  async confirmBoardCapture() {
    if (this.data.recognitionGateBusy || !this.data.boardCapturePath) return;
    this.setData({ recognitionGateBusy: true });
    try {
      // The frozen-photo checkmark is the single acceptance point. The
      // existing reservation/idempotency path performs the authoritative
      // quota decision before upload and provider work.
      await this.startRecognition();
    } finally {
      this.setData({ recognitionGateBusy: false });
    }
  },

  async captureBoardMediaNow() {
    if (this.data.mediaBusy || this.data.cameraStatus !== "ready") return;
    recognitionEndToEndStartedAt = Date.now();
    const captureStartedAt = recognitionEndToEndStartedAt;
    this.setData({ mediaBusy: true });
    const result = await captureBoardImage(
      getWxBoardCameraApi(this, ".camera-preview"),
    );
    recognitionCaptureMs = Date.now() - captureStartedAt;
    this.setData({ mediaBusy: false });
    if (result.status === "selected") {
      const globalData = getApp<IchiApp>().globalData;
      if (globalData.pendingBoardImage?.tempFilePath) {
        void deleteWxTemporaryBoardImage(
          globalData.pendingBoardImage.tempFilePath,
        );
      }
      globalData.pendingBoardImage = result.file;
      globalData.pendingBoardAcquisition = "camera";
      this.setData({
        boardCapturePath: result.file.tempFilePath,
        recognitionCapturedAt: Date.now(),
      });
      return;
    }
    if (result.status === "cancelled") return;
    this.setData({
      cameraStatus: result.status === "denied" ? "denied" : "unavailable",
      cameraError:
        result.status === "denied"
          ? "相机权限尚未开启。"
          : "暂时无法使用相机，请重新尝试。",
    });
  },

  onUndoBoardCapture() {
    cameraGeneration += 1;
    this.releasePendingBoardMedia();
    this.setData({
      boardCapturePath: "",
      recognitionCapturedAt: 0,
      pendingBoardCapture: false,
      cameraStatus: "loading" as const,
      cameraError: "",
      cameraGeneration,
    });
  },

  isCurrentCameraEvent(event?: {
    readonly currentTarget?: {
      readonly dataset?: { readonly cameraGeneration?: unknown };
    };
  }): boolean {
    const generation = Number(event?.currentTarget?.dataset?.cameraGeneration);
    return (
      !Number.isFinite(generation) ||
      generation === Number(this.data.cameraGeneration)
    );
  },

  onCameraReady(event?: {
    readonly currentTarget?: {
      readonly dataset?: { readonly cameraGeneration?: unknown };
    };
  }) {
    if (!this.isCurrentCameraEvent(event)) return;
    if (
      this.data.currentView !== "camera-capture" &&
      this.data.modalView !== "share-capture"
    ) {
      return;
    }
    markCameraTiming("cameraInitAt");
    const captureBoard = Boolean(
      this.data.pendingBoardCapture &&
      this.data.currentView === "camera-capture",
    );
    const captureEvidence = Boolean(
      this.data.pendingEvidenceCapture &&
      this.data.modalView === "share-capture",
    );
    this.setData({
      cameraStatus: "ready" as const,
      cameraError: "",
      pendingBoardCapture: false,
      pendingEvidenceCapture: false,
    });
    markCameraTiming("readyAt");
    if (captureBoard) void this.captureBoardMediaNow();
    if (captureEvidence) void this.captureEvidenceNow();
  },

  onCameraError(event: {
    readonly detail?: { readonly errMsg?: string; readonly errCode?: number };
    readonly currentTarget?: {
      readonly dataset?: { readonly cameraGeneration?: unknown };
    };
  }) {
    if (!this.isCurrentCameraEvent(event)) return;
    if (
      this.data.currentView !== "camera-capture" &&
      this.data.modalView !== "share-capture"
    ) {
      return;
    }
    const detail = event.detail ?? {};
    const failure = classifyBoardMediaFailure(
      detail.errMsg ? { errMsg: detail.errMsg } : {},
    );
    const denied = detail.errCode === 10001 || failure.status === "denied";
    const subject =
      this.data.modalView === "share-capture" ? "拍摄赏票" : "拍摄版面";
    this.setData({
      mediaBusy: false,
      pendingBoardCapture: false,
      pendingEvidenceCapture: false,
      cameraStatus: denied ? ("denied" as const) : ("unavailable" as const),
      cameraError: denied
        ? `需要相机权限才能在取景框内${subject}。`
        : "相机暂时不可用，请检查设备后重试。",
    });
  },

  onRetryCamera() {
    if (
      this.data.cameraStatus !== "denied" &&
      this.data.cameraStatus !== "unavailable"
    ) {
      return;
    }
    cameraGeneration += 1;
    this.setData({
      mediaBusy: false,
      cameraStatus: "loading" as const,
      cameraError: "",
      pendingBoardCapture: false,
      pendingEvidenceCapture: false,
      cameraGeneration,
    });
  },

  onOpenCameraSettings() {
    wx.openSetting({
      success: (result) => {
        if (result.authSetting["scope.camera"]) {
          this.onRetryCamera();
          return;
        }
        this.setData({ cameraError: "相机权限仍未开启。" });
      },
      fail: () => {
        wx.showToast({ title: "无法打开设置", icon: "none" });
      },
    });
  },

  handleBoardMediaResult(result: BoardMediaSelection, acquisition: "camera") {
    if (result.status === "selected") {
      if (!recognitionEndToEndStartedAt) {
        recognitionEndToEndStartedAt = Date.now();
        recognitionCaptureMs = 0;
      }
      const globalData = getApp<IchiApp>().globalData;
      globalData.pendingBoardImage = result.file;
      globalData.pendingBoardAcquisition = acquisition;
      globalData.pendingRecognitionIdempotencyKey =
        createRecognitionIdempotencyKey();
      delete globalData.pendingRecognitionJobId;
      delete globalData.pendingRecognitionJobToken;
      this.setData({ recognitionCapturedAt: Date.now() });
      void this.startRecognition();
      return;
    }
    if (result.status === "cancelled") return;
    const denied = result.status === "denied";
    wx.showModal({
      title: denied ? "无法拍摄版面" : "相机拍摄失败",
      content: denied
        ? "请在微信设置中允许使用相机后重试。"
        : "暂时无法完成拍摄，当前本机草稿不会受到影响。",
      showCancel: false,
      confirmText: "知道了",
    });
  },

  async startRecognition() {
    clearRecognitionTimers();
    this.setData({
      currentView: "recognizing" as const,
      recognitionStage: 0,
      recognitionProgress: 0,
      recognitionTargetProgress: 15,
      recognitionResultReady: false,
      recognitionError: "",
    });
    this.initializeRecognitionProgress();
    const globalData = getApp<IchiApp>().globalData;
    const pendingBoardImage = globalData.pendingBoardImage;
    if (!pendingBoardImage) {
      this.completeRecognition(
        "service_error",
        "没有可识别的版面照片，请重新拍摄。",
      );
      return;
    }
    const idempotencyKey =
      globalData.pendingRecognitionIdempotencyKey ??
      createRecognitionIdempotencyKey();
    globalData.pendingRecognitionIdempotencyKey = idempotencyKey;
    let reservation;
    const reservationStartedAt = Date.now();
    let reservationMs: number;
    try {
      reservation = await reserveCloudRecognition(getWxCloudFunctionApi(), {
        idempotencyKey,
        sourcePath:
          this.data.recognitionMode === "direct-upload"
            ? "direct-upload"
            : "assisted-draw",
      });
      reservationMs = Date.now() - reservationStartedAt;
      if (reservation.status !== "reserved" || !reservation.jobToken) {
        if (
          ["processing", "recognized", "succeeded"].includes(reservation.status)
        ) {
          globalData.pendingRecognitionJobId = reservation.jobId;
          if (reservation.jobToken)
            globalData.pendingRecognitionJobToken = reservation.jobToken;
          void deleteWxTemporaryBoardImage(pendingBoardImage.tempFilePath);
          delete globalData.pendingBoardImage;
          await this.restoreCloudRecognitionJob(reservation.jobId);
          return;
        }
        throw new CloudAccountError("RECOGNITION_JOB_NOT_RESERVABLE");
      }
      globalData.pendingRecognitionJobId = reservation.jobId;
      globalData.pendingRecognitionJobToken = reservation.jobToken;
      this.setData({
        quotaLimit: reservation.quota.limit,
        quotaUsed: reservation.quota.used,
        quotaReserved: reservation.quota.reserved,
        quotaRemaining: reservation.quota.remaining,
        quotaUsedPercent: quotaUsedPercent(reservation.quota),
        quotaResetAt: reservation.quota.resetAt,
      });
      this.saveRecognitionFlow(
        this.data.recognitionPrizes as RecognitionPrizeDraft[],
        parseRecognitionUnitPrice(this.data.recognitionPrice),
        this.data.recognitionMode as RecognitionFlowMode,
        String(this.data.recognitionIp),
        String(this.data.recognitionLocationNote),
      );
    } catch (error) {
      reservationMs = Date.now() - reservationStartedAt;
      void deleteWxTemporaryBoardImage(pendingBoardImage.tempFilePath);
      delete globalData.pendingBoardImage;
      delete globalData.pendingBoardAcquisition;
      delete globalData.pendingBoardLocation;
      delete globalData.pendingRecognitionJobId;
      delete globalData.pendingRecognitionJobToken;
      if (
        error instanceof CloudAccountError &&
        error.code === "QUOTA_EXHAUSTED"
      ) {
        this.setData({ modalView: "quota-exhausted" as const });
      }
      this.completeRecognition(
        "service_error",
        recognitionReservationErrorMessage(error),
      );
      console.info("board_recognition_client_performance", {
        outcome: "reservation_failed",
        captureMs: recognitionCaptureMs,
        reservationMs,
        endToEndMs: recognitionEndToEndStartedAt
          ? Date.now() - recognitionEndToEndStartedAt
          : 0,
      });
      recognitionEndToEndStartedAt = 0;
      recognitionCaptureMs = 0;
      return;
    }
    const result = await recognizeBoardImage(
      getWxBoardRecognitionApi(),
      pendingBoardImage,
      globalData.pendingBoardAcquisition ?? "camera",
      {
        jobId: reservation.jobId,
        jobToken: reservation.jobToken,
        onProgress: (event) => this.onRecognitionProgress(event),
      },
    );
    delete globalData.pendingBoardImage;
    if (this.data.currentView !== "recognizing") return;
    if (result.status === "failed") {
      clearRecognitionTimers();
      await this.releasePendingRecognitionQuota(
        globalData.pendingRecognitionJobId,
        globalData.pendingRecognitionJobToken,
      );
      delete globalData.pendingRecognitionJobId;
      delete globalData.pendingRecognitionJobToken;
      void this.refreshCloudAccount();
      this.completeRecognition("service_error", result.message);
      console.info("board_recognition_client_performance", {
        outcome: result.code,
        captureMs: recognitionCaptureMs,
        reservationMs,
        ...(result.timings ?? {}),
        endToEndMs: recognitionEndToEndStartedAt
          ? Date.now() - recognitionEndToEndStartedAt
          : 0,
      });
      recognitionEndToEndStartedAt = 0;
      recognitionCaptureMs = 0;
      return;
    }
    void this.refreshCloudAccount();
    const progressFinished = await this.finishRecognitionProgress();
    if (
      !progressFinished ||
      this.data.currentView !== "recognizing" ||
      !recognitionProgressAnimator?.consumeCompletion()
    )
      return;
    const organizeStartedAt = Date.now();
    this.applyRecognitionResult(result);
    const organizeSyncMs = Date.now() - organizeStartedAt;
    const performance = {
      outcome: result.recognitionStatus,
      captureMs: recognitionCaptureMs,
      reservationMs,
      ...(result.timings ?? {}),
      organizeSyncMs,
      endToEndMs: recognitionEndToEndStartedAt
        ? Date.now() - recognitionEndToEndStartedAt
        : 0,
    };
    const nextTick = (
      wx as unknown as { nextTick?: (callback: () => void) => void }
    ).nextTick;
    if (typeof nextTick === "function") {
      nextTick(() => {
        console.info("board_recognition_client_performance", {
          ...performance,
          renderCommitMs: Date.now() - organizeStartedAt,
          endToEndMs: recognitionEndToEndStartedAt
            ? Date.now() - recognitionEndToEndStartedAt
            : performance.endToEndMs,
        });
        recognitionEndToEndStartedAt = 0;
        recognitionCaptureMs = 0;
      });
    } else {
      console.info("board_recognition_client_performance", performance);
      recognitionEndToEndStartedAt = 0;
      recognitionCaptureMs = 0;
    }
  },

  initializeRecognitionProgress() {
    stopRecognitionProgress();
    const canvasGeneration = recognitionCanvasGeneration;
    const publish = (snapshot: RecognitionProgressSnapshot) => {
      drawRecognitionRing(snapshot.displayProgress);
      const recognitionProgress = Math.floor(snapshot.displayProgress);
      if (
        recognitionProgress === recognitionPublishedProgress &&
        snapshot.stage === recognitionPublishedStage &&
        snapshot.targetProgress === recognitionPublishedTarget &&
        snapshot.resultReady === recognitionPublishedResultReady
      )
        return;
      recognitionPublishedProgress = recognitionProgress;
      recognitionPublishedStage = snapshot.stage;
      recognitionPublishedTarget = snapshot.targetProgress;
      recognitionPublishedResultReady = snapshot.resultReady;
      this.setData({
        recognitionProgress,
        recognitionTargetProgress: snapshot.targetProgress,
        recognitionStage: snapshot.stage,
        recognitionResultReady: snapshot.resultReady,
      });
    };
    recognitionProgressAnimator = new RecognitionProgressAnimator(
      recognitionFrameScheduler,
      publish,
      {
        displayProgress: Number(this.data.recognitionProgress) || 0,
        targetProgress: Number(this.data.recognitionTargetProgress) || 15,
        stage: (Number(this.data.recognitionStage) || 0) as 0 | 1 | 2 | 3 | 4,
      },
    );
    recognitionProgressAnimator.start();

    const initializeCanvas = () => {
      const page = this as unknown as {
        createSelectorQuery?: () => {
          select(selector: string): {
            fields(
              options: { node: boolean; size: boolean },
              callback: (result: {
                node?: RecognitionRingCanvas;
                width?: number;
                height?: number;
              }) => void,
            ): void;
          };
          exec(): void;
        };
      };
      const query = page.createSelectorQuery?.();
      if (!query) return;
      query
        .select("#recognition-progress-ring")
        .fields({ node: true, size: true }, (result) => {
          if (
            canvasGeneration !== recognitionCanvasGeneration ||
            this.data.currentView !== "recognizing" ||
            !result.node
          )
            return;
          const canvas = result.node;
          const size = Math.max(1, result.width ?? result.height ?? 112);
          const pixelRatio = Math.max(
            1,
            Number(wx.getWindowInfo().pixelRatio) || 1,
          );
          canvas.width = Math.round(size * pixelRatio);
          canvas.height = Math.round(size * pixelRatio);
          const context = canvas.getContext("2d");
          context.scale(pixelRatio, pixelRatio);
          recognitionRingCanvas = canvas;
          recognitionRingContext = context;
          recognitionRingSize = size;
          drawRecognitionRing(
            recognitionProgressAnimator?.snapshot().displayProgress ?? 0,
          );
        });
      query.exec();
    };
    const nextTick = (
      wx as unknown as { nextTick?: (callback: () => void) => void }
    ).nextTick;
    if (typeof nextTick === "function") nextTick(initializeCanvas);
    else initializeCanvas();
  },

  ensureRecognitionProgress() {
    if (!recognitionProgressAnimator) this.initializeRecognitionProgress();
  },

  onRecognitionProgress(event: RecognitionProgressEvent) {
    this.ensureRecognitionProgress();
    recognitionProgressAnimator?.advance(event);
  },

  finishRecognitionProgress(): Promise<boolean> {
    this.ensureRecognitionProgress();
    return (
      recognitionProgressAnimator?.finishProgressAnimation() ??
      Promise.resolve(false)
    );
  },

  applyRecognitionResult(
    result: Extract<BoardRecognitionResult, { status: "recognized" }>,
  ) {
    const recognitionPrizes = [...result.prizes];
    const recognitionIp = result.ipName;
    const recognitionPrice = null;
    const recognitionMode = this.data.recognitionMode as RecognitionFlowMode;
    const recognitionLocationNote = String(this.data.recognitionLocationNote);
    this.setData({
      recognitionPrizes,
      recognitionPrice,
      recognitionIp,
      recognitionTheme: result.themeName,
      grandPrizeTiers: [],
      grandPrizeOptions: recognitionPrizes.map((prize) => ({
        ...prize,
        selected: false,
      })),
      recognitionValidation: createRecognitionValidation(
        recognitionMode,
        recognitionIp,
        recognitionLocationNote,
        recognitionPrizes,
        recognitionPrice,
      ),
      recognitionError: "",
      generationState: "editing" as const,
      generationId: "",
    });
    this.saveRecognitionFlow(
      recognitionPrizes,
      recognitionPrice,
      recognitionMode,
      recognitionIp,
      recognitionLocationNote,
      result.themeName,
    );
    this.completeRecognition(result.recognitionStatus);
  },

  async restoreCloudRecognitionJob(jobId: string, attempt = 0) {
    try {
      const job = await getCloudRecognitionJob(getWxCloudFunctionApi(), jobId);
      if (["recognized", "succeeded"].includes(job.status) && job.result) {
        const result = parseBoardRecognitionTransport(job.result);
        if (result.status === "recognized") {
          this.setData({ currentView: "recognizing" as const });
          this.ensureRecognitionProgress();
          this.onRecognitionProgress("result-ready");
          const progressFinished = await this.finishRecognitionProgress();
          if (
            !progressFinished ||
            this.data.currentView !== "recognizing" ||
            !recognitionProgressAnimator?.consumeCompletion()
          )
            return;
          this.applyRecognitionResult(result);
          return;
        }
        this.completeRecognition("service_error", result.message);
        return;
      }
      if (
        (job.status === "reserved" || job.status === "processing") &&
        attempt < 25
      ) {
        const enteringRecognition = this.data.currentView !== "recognizing";
        this.setData({ currentView: "recognizing" as const });
        if (enteringRecognition) this.initializeRecognitionProgress();
        this.onRecognitionProgress(
          job.status === "reserved" ? "photo-prepared" : "request-dispatched",
        );
        recognitionTimers.push(
          setTimeout(() => {
            void this.restoreCloudRecognitionJob(jobId, attempt + 1);
          }, 1000),
        );
        return;
      }
      if (job.status === "committed") return;
      this.completeRecognition(
        "service_error",
        "上次识别任务没有完成，请重新拍摄照片。",
      );
    } catch {
      if (attempt < 2) {
        recognitionTimers.push(
          setTimeout(() => {
            void this.restoreCloudRecognitionJob(jobId, attempt + 1);
          }, 1000),
        );
      }
    }
  },

  completeRecognition(
    status: Parameters<typeof recognitionStatusView>[0],
    errorMessage = "",
  ) {
    clearRecognitionTimers();
    const currentView = recognitionStatusView(status);
    if (currentView === "cannot-build-pool") {
      this.saveNavigation("start", null);
    } else {
      this.saveNavigation(currentView);
    }
    this.setData({
      currentView,
      recognitionError:
        currentView === "cannot-build-pool"
          ? errorMessage || "识别服务未能生成可核对的票池，请重新拍摄。"
          : "",
    });
  },

  onBackToStart() {
    if (this.data.generationState === "generating") return;
    clearRecognitionTimers();
    cameraGeneration += 1;
    cameraTiming = null;
    const navigationSaved = this.saveNavigation("start", null);
    this.releasePendingBoardMedia();
    try {
      storage.removeItem(RECOGNITION_FLOW_KEY);
    } catch {
      this.setData({ modalView: "storage-warning" as const });
    }
    this.setData({
      activeTab: "recognize" as const,
      currentView: "start" as const,
      activeDraft: null,
      ...(navigationSaved ? { modalView: "" as const } : {}),
      mediaBusy: false,
      cameraStatus: "loading" as const,
      cameraError: "",
      cameraGeneration,
      boardCapturePath: "",
      generationState: "editing" as const,
      generationId: "",
    });
  },

  onRecognitionFieldInput(event: WechatMiniprogram.Input) {
    if (!["editing", "failed"].includes(String(this.data.generationState)))
      return;
    const tier = event.currentTarget.dataset.tier as string | undefined;
    const field = event.currentTarget.dataset.field as
      "remainingTickets" | undefined;
    if (!tier || !field) return;
    const recognitionPrizes = updateRecognitionPrize(
      this.data.recognitionPrizes as RecognitionPrizeDraft[],
      tier,
      field,
      String(event.detail.value),
    );
    const recognitionMode = this.data.recognitionMode as RecognitionFlowMode;
    const recognitionIp = String(this.data.recognitionIp);
    const recognitionLocationNote = String(this.data.recognitionLocationNote);
    const recognitionPrice = parseRecognitionUnitPrice(
      this.data.recognitionPrice,
    );
    const recognitionValidation = createRecognitionValidation(
      recognitionMode,
      recognitionIp,
      recognitionLocationNote,
      recognitionPrizes,
      recognitionPrice,
    );
    this.setData({
      recognitionPrizes,
      recognitionValidation,
      recognitionError: "",
      generationState: "editing" as const,
      generationId: "",
    });
    this.saveRecognitionFlow(
      recognitionPrizes,
      recognitionPrice,
      recognitionMode,
      recognitionIp,
      recognitionLocationNote,
    );
  },

  onRecognitionPriceInput(event: WechatMiniprogram.Input) {
    if (!["editing", "failed"].includes(String(this.data.generationState)))
      return;
    const recognitionPrice = parseRecognitionUnitPrice(event.detail.value);
    const recognitionPrizes = this.data
      .recognitionPrizes as RecognitionPrizeDraft[];
    const recognitionMode = this.data.recognitionMode as RecognitionFlowMode;
    const recognitionIp = String(this.data.recognitionIp);
    const recognitionLocationNote = String(this.data.recognitionLocationNote);
    const recognitionValidation = createRecognitionValidation(
      recognitionMode,
      recognitionIp,
      recognitionLocationNote,
      recognitionPrizes,
      recognitionPrice,
    );
    this.setData({
      recognitionPrice,
      recognitionValidation,
      recognitionError: "",
    });
    this.saveRecognitionFlow(
      recognitionPrizes,
      recognitionPrice,
      recognitionMode,
      recognitionIp,
      recognitionLocationNote,
    );
  },

  onRecognitionIpInput(event: WechatMiniprogram.Input) {
    if (!["editing", "failed"].includes(String(this.data.generationState)))
      return;
    const recognitionIp = String(event.detail.value);
    const recognitionMode = this.data.recognitionMode as RecognitionFlowMode;
    const recognitionLocationNote = String(this.data.recognitionLocationNote);
    const recognitionPrice = parseRecognitionUnitPrice(
      this.data.recognitionPrice,
    );
    const recognitionValidation = createRecognitionValidation(
      recognitionMode,
      recognitionIp,
      recognitionLocationNote,
      this.data.recognitionPrizes as RecognitionPrizeDraft[],
      recognitionPrice,
    );
    this.setData({
      recognitionIp,
      recognitionValidation,
      recognitionError: "",
    });
    this.saveRecognitionFlow(
      this.data.recognitionPrizes as RecognitionPrizeDraft[],
      recognitionPrice,
      recognitionMode,
      recognitionIp,
      recognitionLocationNote,
    );
  },

  onRecognitionThemeInput(event: WechatMiniprogram.Input) {
    if (!["editing", "failed"].includes(String(this.data.generationState)))
      return;
    const recognitionTheme = String(event.detail.value);
    this.setData({ recognitionTheme, recognitionError: "" });
    this.saveRecognitionFlow(
      this.data.recognitionPrizes as RecognitionPrizeDraft[],
      parseRecognitionUnitPrice(this.data.recognitionPrice),
      this.data.recognitionMode as RecognitionFlowMode,
      String(this.data.recognitionIp),
      String(this.data.recognitionLocationNote),
      recognitionTheme,
    );
  },

  onRecognitionLocationInput(event: WechatMiniprogram.Input) {
    if (!["editing", "failed"].includes(String(this.data.generationState)))
      return;
    const recognitionLocationNote = String(event.detail.value);
    const recognitionMode = this.data.recognitionMode as RecognitionFlowMode;
    const recognitionIp = String(this.data.recognitionIp);
    const recognitionPrice = parseRecognitionUnitPrice(
      this.data.recognitionPrice,
    );
    const recognitionValidation = createRecognitionValidation(
      recognitionMode,
      recognitionIp,
      recognitionLocationNote,
      this.data.recognitionPrizes as RecognitionPrizeDraft[],
      recognitionPrice,
    );
    this.setData({
      recognitionLocationNote,
      recognitionValidation,
      recognitionError: "",
    });
    this.saveRecognitionFlow(
      this.data.recognitionPrizes as RecognitionPrizeDraft[],
      recognitionPrice,
      recognitionMode,
      recognitionIp,
      recognitionLocationNote,
    );
  },

  saveRecognitionFlow(
    prizes: readonly RecognitionPrizeDraft[],
    unitPrice: number | null,
    mode: RecognitionFlowMode = "assist",
    ipName = "",
    locationNote = "",
    themeName?: string,
  ) {
    try {
      const resolvedThemeName = themeName ?? String(this.data.recognitionTheme);
      storage.setItem(
        RECOGNITION_FLOW_KEY,
        JSON.stringify({
          schemaVersion: 2,
          prizes,
          unitPrice,
          selectedGrandPrizeTiers: this.data.grandPrizeTiers,
          mode,
          ipName,
          themeName: resolvedThemeName,
          locationNote,
          capturedAt: Number(this.data.recognitionCapturedAt) || undefined,
          recognitionJobId:
            getApp<IchiApp>().globalData.pendingRecognitionJobId,
          acquisition: getApp<IchiApp>().globalData.pendingBoardAcquisition,
        }),
      );
    } catch {
      this.setData({ modalView: "storage-warning" as const });
    }
  },

  onRecognitionWrong() {
    if (this.data.generationState === "generating") return;
    this.saveNavigation("recognition-result");
    this.setData({ currentView: "cannot-build-pool" as const });
  },

  onBackToRecognitionResult() {
    this.saveNavigation("recognition-result");
    this.setData({ currentView: "recognition-result" as const });
  },

  isActiveGeneration(generationId: string): boolean {
    return isCurrentGeneration(String(this.data.generationId), generationId);
  },

  async releasePendingRecognitionQuota(
    jobId: string | undefined,
    jobToken: string | undefined,
  ) {
    if (!jobId || !jobToken) return;
    try {
      const result = await releaseCloudRecognition(getWxCloudFunctionApi(), {
        jobId,
        jobToken,
      });
      this.setData({
        quotaLimit: result.quota.limit,
        quotaUsed: result.quota.used,
        quotaReserved: result.quota.reserved,
        quotaRemaining: result.quota.remaining,
        quotaUsedPercent: quotaUsedPercent(result.quota),
        quotaResetAt: result.quota.resetAt,
      });
      const globalData = getApp<IchiApp>().globalData;
      if (globalData.pendingRecognitionJobId === jobId && result.released) {
        delete globalData.pendingRecognitionJobToken;
      }
    } catch {
      // The server-side lease reconciler remains the final release guard.
      void this.refreshCloudAccount();
    }
  },

  async failGeneration(
    generationId: string,
    message: string,
    jobId?: string,
    jobToken?: string,
  ) {
    if (!this.isActiveGeneration(generationId)) return;
    this.setData({
      generationState: "failed" as const,
      recognitionError: message,
    });
    await this.releasePendingRecognitionQuota(jobId, jobToken);
  },

  async resumePendingFinalizations() {
    let drafts: LocalDrawDraft[];
    try {
      drafts = draftRepository.readAll();
    } catch {
      return;
    }
    for (const draft of drafts) {
      if (draft.pendingFinalization) {
        void this.finalizePersistedDraft(draft);
      }
    }
  },

  async finalizePersistedDraft(draft: LocalDrawDraft) {
    const pending = draft.pendingFinalization;
    if (!pending || finalizationInFlight.has(pending.recognitionJobId)) return;
    finalizationInFlight.add(pending.recognitionJobId);
    const startedAt = Date.now();
    try {
      let location = pending.location;
      if (!location) {
        const captured = await requestBoardLocation();
        location = {
          latitude: captured.latitude,
          longitude: captured.longitude,
          accuracy: captured.accuracy,
          source: "camera" as const,
          capturedAt: new Date(captured.obtainedAt).toISOString(),
          consentVersion: LOCATION_CONSENT_VERSION,
        };
        const latest = draftRepository
          .readAll()
          .find((item) => item.boardId === draft.boardId);
        if (
          !latest?.pendingFinalization ||
          latest.pendingFinalization.recognitionJobId !==
            pending.recognitionJobId
        ) {
          return;
        }
        draft = {
          ...latest,
          pendingFinalization: { ...latest.pendingFinalization, location },
        };
        draftRepository.upsert(draft);
      }
      const observation = await finalizeCloudObservation(
        getWxCloudFunctionApi(),
        {
          recognitionJobId: pending.recognitionJobId,
          boardId: draft.boardId,
          sourcePath: pending.sourcePath,
          confirmedSnapshot: pending.confirmedSnapshot,
          location,
          ...(pending.locationNote
            ? { locationNote: pending.locationNote }
            : {}),
          observedAt: pending.observedAt,
          promptVersion: pending.promptVersion,
          consentVersion: pending.consentVersion,
          disclosureVersion: pending.disclosureVersion,
        },
      );
      const latest = draftRepository
        .readAll()
        .find((item) => item.boardId === draft.boardId);
      if (
        !latest?.pendingFinalization ||
        latest.pendingFinalization.recognitionJobId !== pending.recognitionJobId
      ) {
        return;
      }
      const persisted = { ...latest };
      delete persisted.pendingFinalization;
      const committedDraft: LocalDrawDraft = {
        ...persisted,
        boardId: observation.boardId,
        recordCode: observation.recordCode,
        cloudRecordId: observation.recordId,
        ...(pending.sourcePath === "direct-upload"
          ? {
              uploadStatus: "uploaded" as const,
              submissionState: "pending-review" as const,
            }
          : {}),
      };
      draftRepository.upsert(committedDraft);
      if (committedDraft.boardId !== latest.boardId) {
        draftRepository.delete(latest.boardId);
      }
      const globalData = getApp<IchiApp>().globalData;
      if (globalData.pendingRecognitionJobId === pending.recognitionJobId) {
        delete globalData.pendingRecognitionJobId;
        delete globalData.pendingRecognitionJobToken;
        delete globalData.pendingRecognitionIdempotencyKey;
      }
      this.refreshDrafts(committedDraft.boardId);
      void this.refreshCloudAccount();
      void this.refreshCloudRecords();
      console.info("board_finalization_background", {
        recognitionJobId: pending.recognitionJobId,
        outcome: "committed",
        totalMs: Date.now() - startedAt,
      });
    } catch {
      console.info("board_finalization_background", {
        recognitionJobId: pending.recognitionJobId,
        outcome: "pending_retry",
        totalMs: Date.now() - startedAt,
      });
    } finally {
      finalizationInFlight.delete(pending.recognitionJobId);
    }
  },

  onConfirmRecognition() {
    if (!["editing", "failed"].includes(String(this.data.generationState)))
      return;
    const prizes = this.data.recognitionPrizes as RecognitionPrizeDraft[];
    const unitPrice = parseRecognitionUnitPrice(this.data.recognitionPrice);
    const mode = this.data.recognitionMode as RecognitionFlowMode;
    const validation = createRecognitionValidation(
      mode,
      String(this.data.recognitionIp).trim(),
      String(this.data.recognitionLocationNote).trim(),
      prizes,
      unitPrice,
    );
    if (!validation.canConfirm || unitPrice === null) {
      this.setData({
        recognitionValidation: validation,
        recognitionError: validation.error ?? "请补全所有必填信息。",
      });
      return;
    }
    this.setData({
      currentView: "grand-prize-selection" as const,
      recognitionError: "",
      grandPrizeOptions: prizes.map((prize) => ({
        ...prize,
        selected: (this.data.grandPrizeTiers as string[]).includes(prize.tier),
      })),
    });
  },

  onToggleGrandPrize(event: WechatMiniprogram.TouchEvent) {
    const tier = String(event.currentTarget.dataset.tier || "");
    if (!tier) return;
    const selected = new Set(this.data.grandPrizeTiers as string[]);
    if (selected.has(tier)) selected.delete(tier);
    else selected.add(tier);
    const grandPrizeTiers = [...selected];
    this.setData({
      grandPrizeTiers,
      grandPrizeOptions: (
        this.data.grandPrizeOptions as Array<
          RecognitionPrizeDraft & { readonly selected: boolean }
        >
      ).map((option) => ({
        ...option,
        selected: selected.has(option.tier),
      })),
    });
    this.saveRecognitionFlow(
      this.data.recognitionPrizes as RecognitionPrizeDraft[],
      parseRecognitionUnitPrice(this.data.recognitionPrice),
      this.data.recognitionMode as RecognitionFlowMode,
      String(this.data.recognitionIp),
      String(this.data.recognitionLocationNote),
      String(this.data.recognitionTheme),
    );
  },

  onBackToRecognitionFromGrand() {
    this.setData({ currentView: "recognition-result" as const });
  },

  async onConfirmGrandPrizes() {
    if (!["editing", "failed"].includes(String(this.data.generationState)))
      return;
    const confirmStartedAt = Date.now();
    const prizes = this.data.recognitionPrizes as RecognitionPrizeDraft[];
    const unitPrice = parseRecognitionUnitPrice(this.data.recognitionPrice);
    const mode = this.data.recognitionMode as RecognitionFlowMode;
    const ipName = String(this.data.recognitionIp).trim();
    const themeName = String(this.data.recognitionTheme).trim();
    const locationNote = String(this.data.recognitionLocationNote).trim();
    const recognitionValidation = createRecognitionValidation(
      mode,
      ipName,
      locationNote,
      prizes,
      unitPrice,
    );
    if (!recognitionValidation.canConfirm || unitPrice === null) {
      this.setData({
        recognitionValidation,
        recognitionError: recognitionValidation.error ?? "请补全所有必填信息。",
      });
      return;
    }
    const generationId = createGenerationId();
    const snapshot = createRecognitionGenerationSnapshot({
      generationId,
      mode,
      ipName,
      themeName,
      locationNote,
      unitPrice,
      capturedAt: Number(this.data.recognitionCapturedAt) || Date.now(),
      prizes,
      grandPrizeTiers: this.data.grandPrizeTiers as string[],
    });
    const snapshotReadyAt = Date.now();
    this.setData({
      generationState: "generating" as const,
      generationId,
      recognitionError: "",
    });
    const globalData = getApp<IchiApp>().globalData;
    const recognitionJobId = globalData.pendingRecognitionJobId;
    const existing = (() => {
      try {
        return draftRepository
          .readAll()
          .find(
            (draft) =>
              draft.recognitionJobId === recognitionJobId ||
              draft.boardId ===
                (this.data.activeDraft as ActiveDraftViewModel | null)?.boardId,
          );
      } catch {
        return undefined;
      }
    })();
    const boardId = existing?.boardId ?? createBoardId();
    const recordCode = existing?.recordCode ?? createRecordCode(boardId);
    let boardPrizeData: readonly LocalPrizeState[];
    let confirmedSnapshot: ReturnType<typeof toConfirmedBoardSnapshot>;
    try {
      boardPrizeData = buildBoardFromRecognitionSnapshot(snapshot);
      confirmedSnapshot = toConfirmedBoardSnapshot({
        ip: snapshot.ipName,
        ...(snapshot.themeName ? { theme: snapshot.themeName } : {}),
        unitPrice: snapshot.unitPrice,
        prizes: snapshot.prizes,
        grandPrizeTiers: snapshot.grandPrizeTiers,
      });
    } catch {
      await this.failGeneration(
        generationId,
        "版面生成失败，请重试",
        recognitionJobId,
        globalData.pendingRecognitionJobToken,
      );
      return;
    }
    const boardBuiltAt = Date.now();
    const baseDraft: LocalDrawDraft = {
      schemaVersion: "board-record-r2-1.0.0",
      boardId,
      savedAt: Date.now(),
      recordType: snapshot.mode === "direct-upload" ? "board-upload" : "draw",
      recordCode,
      ...(recognitionJobId ? { recognitionJobId } : {}),
      capturedAt: existing?.capturedAt ?? snapshot.capturedAt,
      ...(snapshot.mode === "direct-upload" ? { submittedAt: Date.now() } : {}),
      prizeData: boardPrizeData,
      history: existing?.history ?? [],
      cost: existing?.cost ?? 0,
      verificationStatus: "unverified",
      uploadStatus: "not-uploaded",
      submissionState: "local",
      unitPrice: snapshot.unitPrice,
      ipName: snapshot.ipName,
      ...(snapshot.themeName ? { themeName: snapshot.themeName } : {}),
      ...(snapshot.locationNote ? { locationNote: snapshot.locationNote } : {}),
      ...(existing?.undoFloor !== undefined
        ? { undoFloor: existing.undoFloor }
        : {}),
      ...(recognitionJobId && snapshot.mode === "assist"
        ? {
            pendingFinalization: {
              recognitionJobId,
              sourcePath: "assisted-draw" as const,
              confirmedSnapshot,
              ...(snapshot.locationNote
                ? { locationNote: snapshot.locationNote }
                : {}),
              observedAt: new Date(snapshot.capturedAt).toISOString(),
              promptVersion: BOARD_PROMPT_VERSION,
              consentVersion: PRIVATE_OBSERVATION_CONSENT_VERSION,
              disclosureVersion: NO_IMAGE_DISCLOSURE_VERSION,
            },
          }
        : {}),
    };
    if (!isResumableLocalDrawDraft({ ...baseDraft, recordType: "draw" })) {
      await this.failGeneration(
        generationId,
        "版面生成失败，请重试",
        recognitionJobId,
        globalData.pendingRecognitionJobToken,
      );
      return;
    }
    this.saveRecognitionFlow(
      snapshot.prizes,
      snapshot.unitPrice,
      snapshot.mode,
      snapshot.ipName,
      snapshot.locationNote,
      snapshot.themeName,
    );
    try {
      if (snapshot.mode === "direct-upload") {
        draftRepository.upsert(baseDraft);
        this.refreshDrafts();
        this.refreshStorageInfo();
      } else if (!this.persistDraft(baseDraft, "draw")) {
        throw new Error("LOCAL_DRAFT_PERSIST_FAILED");
      }
    } catch {
      await this.failGeneration(
        generationId,
        "版面生成失败，请重试",
        recognitionJobId,
        globalData.pendingRecognitionJobToken,
      );
      return;
    }
    if (!this.isActiveGeneration(generationId)) return;
    const localPersistedAt = Date.now();
    if (snapshot.mode === "assist") {
      delete globalData.pendingBoardLocation;
      delete globalData.pendingBoardAcquisition;
      delete globalData.pendingRecognitionIdempotencyKey;
      delete globalData.pendingRecognitionJobId;
      delete globalData.pendingRecognitionJobToken;
      delete globalData.pendingRecognitionMode;
      const navigationRequestedAt = Date.now();
      this.setData(
        {
          generationState: "ready" as const,
          currentView: "draw" as const,
          continuousUndoCount: 0,
          drawSessionStartHistoryCount: baseDraft.history.length,
          drawSessionStartSavedAt: baseDraft.savedAt,
        },
        () => {
          const boardVisibleAt = Date.now();
          console.info("confirm_board_performance", {
            generationId,
            snapshotMs: snapshotReadyAt - confirmStartedAt,
            boardBuilderMs: boardBuiltAt - snapshotReadyAt,
            localPersistenceMs: localPersistedAt - boardBuiltAt,
            navigationRequestMs: navigationRequestedAt - localPersistedAt,
            boardRenderMs: boardVisibleAt - navigationRequestedAt,
            totalMs: boardVisibleAt - confirmStartedAt,
          });
        },
      );
      if (baseDraft.pendingFinalization) {
        void this.finalizePersistedDraft(baseDraft);
      }
      return;
    }
    let boardLocation = globalData.pendingBoardLocation;
    let cloudObservation:
      Awaited<ReturnType<typeof finalizeCloudObservation>> | undefined;
    if (recognitionJobId) {
      if (!boardLocation) {
        try {
          boardLocation = await requestBoardLocation();
          globalData.pendingBoardLocation = boardLocation;
        } catch {
          await this.failGeneration(
            generationId,
            "需要重新取得本次位置才能私有保存，请开启位置权限后重试。",
            recognitionJobId,
            globalData.pendingRecognitionJobToken,
          );
          return;
        }
      }
      if (!globalData.pendingRecognitionJobToken) {
        const idempotencyKey = globalData.pendingRecognitionIdempotencyKey;
        if (idempotencyKey) {
          try {
            const reservation = await reserveCloudRecognition(
              getWxCloudFunctionApi(),
              {
                idempotencyKey,
                sourcePath:
                  snapshot.mode === "direct-upload"
                    ? "direct-upload"
                    : "assisted-draw",
              },
            );
            if (
              !["recognized", "succeeded", "committed"].includes(
                reservation.status,
              )
            ) {
              throw new Error("RECOGNITION_JOB_NOT_RESUMABLE");
            }
            globalData.pendingRecognitionJobId = reservation.jobId;
            if (reservation.jobToken)
              globalData.pendingRecognitionJobToken = reservation.jobToken;
          } catch {
            await this.failGeneration(
              generationId,
              "版面生成失败，请重试",
              recognitionJobId,
              globalData.pendingRecognitionJobToken,
            );
            return;
          }
        }
      }
      try {
        cloudObservation = await finalizeCloudObservation(
          getWxCloudFunctionApi(),
          {
            recognitionJobId,
            boardId,
            sourcePath:
              snapshot.mode === "direct-upload"
                ? "direct-upload"
                : "assisted-draw",
            confirmedSnapshot,
            location: {
              latitude: boardLocation.latitude,
              longitude: boardLocation.longitude,
              accuracy: boardLocation.accuracy,
              source: globalData.pendingBoardAcquisition ?? "camera",
              capturedAt: new Date(boardLocation.obtainedAt).toISOString(),
              consentVersion: LOCATION_CONSENT_VERSION,
            },
            ...(snapshot.locationNote
              ? { locationNote: snapshot.locationNote }
              : {}),
            observedAt: new Date(snapshot.capturedAt).toISOString(),
            promptVersion: BOARD_PROMPT_VERSION,
            consentVersion: PRIVATE_OBSERVATION_CONSENT_VERSION,
            disclosureVersion: NO_IMAGE_DISCLOSURE_VERSION,
          },
        );
      } catch {
        await this.failGeneration(
          generationId,
          "版面生成失败，请重试",
          recognitionJobId,
          globalData.pendingRecognitionJobToken,
        );
        return;
      }
    }
    if (!this.isActiveGeneration(generationId)) return;
    const committedDraft: LocalDrawDraft = {
      ...baseDraft,
      boardId: cloudObservation?.boardId ?? baseDraft.boardId,
      recordCode: cloudObservation?.recordCode ?? recordCode,
      ...(cloudObservation?.recordId
        ? { cloudRecordId: cloudObservation.recordId }
        : {}),
      ...(snapshot.mode === "direct-upload"
        ? {
            uploadStatus: "uploaded" as const,
            submissionState: "pending-review" as const,
          }
        : {}),
    };
    if (snapshot.mode === "direct-upload") {
      try {
        draftRepository.upsert(committedDraft);
        if (committedDraft.boardId !== baseDraft.boardId) {
          draftRepository.delete(baseDraft.boardId);
        }
        this.refreshDrafts();
        this.refreshStorageInfo();
      } catch {
        await this.failGeneration(
          generationId,
          "版面生成失败，请重试",
          recognitionJobId,
          globalData.pendingRecognitionJobToken,
        );
        return;
      }
      delete globalData.pendingBoardLocation;
      delete globalData.pendingBoardAcquisition;
      delete globalData.pendingRecognitionIdempotencyKey;
      delete globalData.pendingRecognitionJobId;
      delete globalData.pendingRecognitionJobToken;
      void this.refreshCloudAccount();
      void this.refreshCloudRecords();
      this.setData({
        generationState: "ready" as const,
        modalView: "board-upload-submitted" as const,
      });
      return;
    }
    if (!this.persistDraft(committedDraft, "draw")) {
      await this.failGeneration(
        generationId,
        "版面生成失败，请重试",
        recognitionJobId,
        globalData.pendingRecognitionJobToken,
      );
      return;
    }
    if (committedDraft.boardId !== baseDraft.boardId) {
      draftRepository.delete(baseDraft.boardId);
      this.refreshDrafts(committedDraft.boardId);
    }
    delete globalData.pendingBoardLocation;
    delete globalData.pendingBoardAcquisition;
    delete globalData.pendingRecognitionIdempotencyKey;
    delete globalData.pendingRecognitionJobId;
    delete globalData.pendingRecognitionJobToken;
    delete globalData.pendingRecognitionMode;
    void this.refreshCloudAccount();
    void this.refreshCloudRecords();
    this.setData({
      generationState: "ready" as const,
      currentView: "draw" as const,
      continuousUndoCount: 0,
      drawSessionStartHistoryCount: committedDraft.history.length,
      drawSessionStartSavedAt: committedDraft.savedAt,
    });
  },

  getActiveDraft(): LocalDrawDraft | undefined {
    const boardId = (this.data.activeDraft as ActiveDraftViewModel | null)
      ?.boardId;
    if (!boardId) return undefined;
    try {
      return draftRepository
        .readAll()
        .find((draft) => draft.boardId === boardId);
    } catch {
      this.setData({
        activeTab: "my" as const,
        currentView: "storage-fallback" as const,
        storageCapacityState: "unknown" as const,
      });
      return undefined;
    }
  },

  updateOutlook(draft: LocalDrawDraft) {
    this.setData({
      outlook: buildBoardOutlook({
        prizes: projectPrizeStates(draft),
        targetTiers: draft.targetTiers ?? [],
        unitPrice: resolveUnitPrice(draft),
      }),
    });
  },

  resetTicketPeel() {
    if (ticketPeelSpringTimer) clearTimeout(ticketPeelSpringTimer);
    ticketPeelTier = "";
    ticketPeelVelocity = 0;
    this.setData({
      ticketPeelTier: "",
      ticketPeelProgress: 0,
      ticketPeelSettling: false,
      ticketPeelBusy: false,
      ticketPeelFading: false,
    });
  },

  animateTicketPeel(target: number, velocity: number, onComplete: () => void) {
    if (ticketPeelSpringTimer) clearTimeout(ticketPeelSpringTimer);
    this.setData({ ticketPeelSettling: true });
    const frames = createPeelSpringFrames({
      from: Number(this.data.ticketPeelProgress),
      to: target,
      velocity,
      durationMs: TICKET_PEEL_SPRING_MS,
      frameMs: TICKET_PEEL_FRAME_MS,
    });
    let frameIndex = 0;
    const step = () => {
      this.setData({
        ticketPeelProgress: frames[frameIndex] ?? target,
        ticketPeelSettling: true,
      });
      frameIndex += 1;
      if (frameIndex < frames.length) {
        ticketPeelSpringTimer = setTimeout(step, TICKET_PEEL_FRAME_MS);
        return;
      }
      ticketPeelSpringTimer = undefined;
      onComplete();
    };
    ticketPeelSpringTimer = setTimeout(step, TICKET_PEEL_FRAME_MS);
  },

  onTicketPeelStart(event: WechatMiniprogram.TouchEvent) {
    const tier = event.currentTarget.dataset.tier as string | undefined;
    const disabled = event.currentTarget.dataset.disabled;
    const touch = event.touches[0];
    if (!tier || disabled === true || disabled === "true" || !touch) return;
    if (this.data.ticketPeelBusy) return;
    if (ticketPeelSpringTimer) clearTimeout(ticketPeelSpringTimer);
    if (ticketPeelResetTimer) clearTimeout(ticketPeelResetTimer);
    ticketPeelStartX = touch.clientX;
    ticketPeelLastX = touch.clientX;
    ticketPeelLastTime = event.timeStamp;
    ticketPeelVelocity = 0;
    ticketPeelTier = tier;
    this.setData({
      ticketPeelTier: tier,
      ticketPeelProgress: 0,
      ticketPeelSettling: false,
      ticketPeelBusy: true,
      ticketPeelFading: false,
    });
  },

  onTicketPeelMove(event: WechatMiniprogram.TouchEvent) {
    const tier = event.currentTarget.dataset.tier as string | undefined;
    const touch = event.touches[0];
    if (!tier || tier !== ticketPeelTier || !touch) return;
    const delta = Math.max(0, touch.clientX - ticketPeelStartX);
    const elapsed = Math.max(1, event.timeStamp - ticketPeelLastTime);
    ticketPeelVelocity = (touch.clientX - ticketPeelLastX) / elapsed;
    ticketPeelLastX = touch.clientX;
    ticketPeelLastTime = event.timeStamp;
    const projected = projectPeelDistance(delta, ticketPeelVelocity);
    const progress = Math.min(100, (projected / TICKET_PEEL_DISTANCE_PX) * 100);
    this.setData({ ticketPeelProgress: progress });
  },

  onTicketPeelEnd(event: WechatMiniprogram.TouchEvent) {
    const tier = event.currentTarget.dataset.tier as string | undefined;
    if (!tier || tier !== ticketPeelTier) return;
    const touch = event.changedTouches[0];
    if (touch) {
      const elapsed = Math.max(1, event.timeStamp - ticketPeelLastTime);
      ticketPeelVelocity = (touch.clientX - ticketPeelLastX) / elapsed;
    }
    const distance = touch
      ? Math.max(0, touch.clientX - ticketPeelStartX)
      : (Number(this.data.ticketPeelProgress) / 100) * TICKET_PEEL_DISTANCE_PX;
    const projected = projectPeelDistance(distance, ticketPeelVelocity);
    const progress = Math.min(100, (projected / TICKET_PEEL_DISTANCE_PX) * 100);
    const committed = progress > TICKET_PEEL_THRESHOLD_PERCENT;
    const velocityPercentPerSecond = Math.max(
      -450,
      Math.min(
        450,
        (ticketPeelVelocity / TICKET_PEEL_DISTANCE_PX) * 100 * 1000,
      ),
    );
    this.animateTicketPeel(
      committed ? TICKET_PEEL_EXIT_PERCENT : 0,
      velocityPercentPerSecond,
      () => {
        if (!committed) {
          this.resetTicketPeel();
          return;
        }
        this.commitDraw(tier);
        this.setData({ ticketPeelFading: true });
        ticketPeelResetTimer = setTimeout(
          () => this.resetTicketPeel(),
          TICKET_PEEL_EXIT_FADE_MS,
        );
      },
    );
  },

  onTicketPeelCancel() {
    if (!ticketPeelTier) return;
    this.animateTicketPeel(0, 0, () => this.resetTicketPeel());
  },

  commitDraw(tier: string, showToast = true) {
    const draft = this.getActiveDraft();
    if (!draft) return;
    const result = drawPrize(draft, tier, resolveUnitPrice(draft));
    if (!result.ok) {
      wx.showToast({ title: "这一赏已经抽完", icon: "none" });
      return;
    }
    const update = {
      activeDraft: toActiveDraftViewModel(result.draft),
      outlook: buildBoardOutlook({
        prizes: projectPrizeStates(result.draft),
        targetTiers: result.draft.targetTiers ?? [],
        unitPrice: resolveUnitPrice(result.draft),
      }),
      continuousUndoCount: 0,
    };
    if (showToast) this.showDrawToast(result.draft, tier, update);
    else this.setData(update);

    if (peelPersistenceTimer) clearTimeout(peelPersistenceTimer);
    peelPersistenceTimer = setTimeout(() => {
      if (this.persistDraft(result.draft)) return;
      this.setData({
        activeDraft: toActiveDraftViewModel(draft),
        toast: { ...this.data.toast, visible: false },
      });
    }, 0);
  },

  showDrawToast(
    draft: LocalDrawDraft,
    tier: string,
    update: Record<string, unknown> = {},
  ) {
    const prize = draft.prizeData.find((item) => item.tier === tier);
    const toast: ToastViewModel = {
      visible: true,
      tier,
      remaining: remainingTickets(draft),
      message: contextualReminder(draft, tier, draft.targetTiers ?? []),
      cost: draft.cost.toLocaleString(),
      presentation: prize ? presentationForPrize(prize) : "small",
    };
    this.setData({ ...update, toast });
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(
      () => this.setData({ "toast.visible": false }),
      2600,
    );
  },

  onDismissToast() {
    clearTimeout(toastTimer);
    this.setData({ "toast.visible": false });
  },

  onOpenProbability() {
    const draft = this.getActiveDraft();
    if (draft) this.updateOutlook(draft);
    this.setData({ modalView: "probability" as const });
  },

  onOpenHistory() {
    this.setData({ modalView: "history" as const });
  },

  onUndoDraw() {
    const draft = this.getActiveDraft();
    if (!draft) return;
    const undoCount = Number(this.data.continuousUndoCount);
    const result = undoLastDraw(draft, resolveUnitPrice(draft), undoCount);
    if (!result.ok) {
      if (result.reason === "UNDO_LIMIT") {
        this.setData({ currentView: "undo-protected" as const });
        return;
      }
      wx.showToast({
        title: "没有可以撤销的抽取",
        icon: "none",
      });
      return;
    }
    if (!this.persistDraft(result.draft)) return;
    this.setData({ continuousUndoCount: undoCount + 1 });
    wx.showToast({ title: `已撤销 ${result.tier ?? ""}赏`, icon: "none" });
  },

  onStopTouchStart() {
    if (stopHoldTimer) clearTimeout(stopHoldTimer);
    this.setData({ stopHolding: true });
    stopHoldTimer = setTimeout(() => {
      this.setData({
        stopHolding: false,
        modalView: "share-decision" as const,
      });
      wx.vibrateShort({ type: "medium" });
    }, STOP_HOLD_DURATION_MS);
  },

  onStopTouchEnd() {
    if (stopHoldTimer) clearTimeout(stopHoldTimer);
    this.setData({ stopHolding: false });
  },

  onContinueDraw() {
    this.setData({ modalView: "" as const });
  },

  onSaveDraftAndExit() {
    const draft = this.getActiveDraft();
    if (draft) {
      const hasNewDraws =
        draft.history.length > Number(this.data.drawSessionStartHistoryCount);
      const savedAt = hasNewDraws
        ? Date.now()
        : Number(this.data.drawSessionStartSavedAt) || draft.savedAt;
      if (!this.persistDraft({ ...draft, savedAt })) return;
    }
    this.onBackToStart();
  },

  onOpenShareCapture() {
    cameraGeneration += 1;
    this.setData({
      modalView: "share-capture" as const,
      mediaBusy: false,
      cameraStatus: "loading" as const,
      cameraError: "",
      pendingEvidenceCapture: false,
      cameraGeneration,
    });
  },

  onBackToShareDecision() {
    cameraGeneration += 1;
    if (this.data.shareImagePath) {
      void deleteWxTemporaryBoardImage(String(this.data.shareImagePath));
    }
    this.setData({
      modalView: "share-decision" as const,
      mediaBusy: false,
      shareImagePath: "",
      shareReady: false,
      cameraGeneration,
    });
  },

  async onCaptureEvidence() {
    if (this.data.mediaBusy || this.data.shareImagePath) return;
    if (this.data.cameraStatus === "loading") {
      this.setData({ pendingEvidenceCapture: true });
      return;
    }
    if (this.data.cameraStatus !== "ready") return;
    this.setData({ pendingEvidenceCapture: false });
    await this.captureEvidenceNow();
  },

  async captureEvidenceNow() {
    if (
      this.data.mediaBusy ||
      this.data.shareImagePath ||
      this.data.cameraStatus !== "ready"
    )
      return;
    this.setData({ mediaBusy: true });
    const result = await captureBoardImage(
      getWxBoardCameraApi(this, ".share-camera-preview"),
    );
    this.setData({ mediaBusy: false });
    if (result.status === "selected") {
      const shareImagePath = result.file.tempFilePath;
      this.setData({
        shareImagePath,
        shareReady: Boolean(
          shareImagePath && String(this.data.shareNote).trim(),
        ),
      });
      return;
    }
    if (result.status === "cancelled") return;
    this.setData({
      cameraStatus: result.status === "denied" ? "denied" : "unavailable",
      cameraError:
        result.status === "denied"
          ? "相机权限尚未开启。"
          : "暂时无法使用相机，请重新尝试。",
    });
  },

  onRetakeEvidence() {
    cameraGeneration += 1;
    if (this.data.shareImagePath) {
      void deleteWxTemporaryBoardImage(String(this.data.shareImagePath));
    }
    this.setData({
      shareImagePath: "",
      shareReady: false,
      mediaBusy: false,
      cameraStatus: "loading" as const,
      cameraError: "",
      pendingEvidenceCapture: false,
      cameraGeneration,
    });
  },

  onShareNoteInput(event: WechatMiniprogram.Input) {
    const shareNote = String(event.detail.value);
    this.setData({
      shareNote,
      shareReady: Boolean(String(this.data.shareImagePath) && shareNote.trim()),
    });
  },

  async onSubmitEvidence() {
    if (!this.data.shareReady || this.data.evidenceSubmitting) return;
    const draft = this.getActiveDraft();
    if (!draft?.cloudRecordId) {
      wx.showToast({ title: "这条旧记录尚未建立云端身份", icon: "none" });
      return;
    }
    const submissionVersion = (draft.evidenceSubmissionVersion ?? 0) + 1;
    const capturedAt = Date.now();
    let ticketLocation: {
      latitude: number;
      longitude: number;
      accuracy: number;
      source: "camera";
      capturedAt: string;
      consentVersion: string;
    };
    try {
      const capturedLocation = await requestBoardLocation();
      ticketLocation = {
        latitude: capturedLocation.latitude,
        longitude: capturedLocation.longitude,
        accuracy: capturedLocation.accuracy,
        source: "camera",
        capturedAt: new Date(capturedLocation.obtainedAt).toISOString(),
        consentVersion: LOCATION_CONSENT_VERSION,
      };
    } catch {
      wx.showToast({ title: "无法获取赏票拍摄位置", icon: "none" });
      return;
    }
    const submissionStartedAt = Date.now();
    console.info("ICHI_PRIZE_TICKET_CLIENT", {
      stage: "confirm_tap",
      recordId: draft.cloudRecordId,
      boardId: draft.boardId,
      submissionVersion,
      elapsedMs: 0,
    });
    this.setData({ evidenceSubmitting: true });
    const api = getWxDrawTicketEvidenceApi();
    let uploaded: PendingDrawTicketEvidence | undefined;
    let pendingEstablished = false;
    let pendingStatus = "";
    try {
      uploaded = await uploadDrawTicketEvidence(api, {
        recordId: draft.cloudRecordId,
        boardId: draft.boardId,
        submissionVersion,
        imagePath: String(this.data.shareImagePath),
        captureSource: "camera",
        capturedAt,
      });
      const pending = await createPendingDrawTicketVerification(api, uploaded, {
        drawEvents: draft.history,
        userNote: String(this.data.shareNote).trim(),
        ticketLocation,
      });
      if (
        ![
          "PENDING",
          "PHOTO_PENDING",
          "LOCATION_PENDING",
          "LOCATION_FAILED",
        ].includes(pending.status)
      )
        throw new Error("PENDING_SUBMISSION_NOT_ESTABLISHED");
      pendingEstablished = true;
      pendingStatus = pending.status;
      console.info("ICHI_PRIZE_TICKET_CLIENT", {
        stage: "pending_persisted",
        recordId: draft.cloudRecordId,
        boardId: draft.boardId,
        submissionVersion,
        elapsedMs: Date.now() - submissionStartedAt,
      });
      const pendingDraft: LocalDrawDraft = {
        ...draft,
        locationNote: String(this.data.shareNote).trim(),
        savedAt: Date.now(),
        submittedAt: Date.now(),
        uploadStatus: "uploaded",
        submissionState: "pending-review",
        verificationStatus:
          pending.status === "LOCATION_FAILED" ? "location-failed" : "pending",
        evidenceSubmissionVersion: submissionVersion,
        currentVerificationVersion: submissionVersion,
        verificationPending: uploaded,
        ...(submissionVersion === 1
          ? {
              originalEvidenceCapturedAt: capturedAt,
              albumSaveWarning: uploaded.albumSaveWarning,
            }
          : {}),
      };
      draftRepository.upsert(pendingDraft);
      const submittedImagePath = String(this.data.shareImagePath);
      void deleteWxTemporaryBoardImage(submittedImagePath).catch(
        () => undefined,
      );
      this.saveNavigation("start", null);
      console.info("ICHI_PRIZE_TICKET_CLIENT", {
        stage: "uploaded_boards_navigation_requested",
        recordId: draft.cloudRecordId,
        boardId: draft.boardId,
        submissionVersion,
        elapsedMs: Date.now() - submissionStartedAt,
      });
      this.setData(
        {
          activeTab: "my" as const,
          currentView: "contributions" as const,
          modalView: "" as const,
          shareImagePath: "",
          shareNote: "",
          shareReady: false,
          activeDraft: null,
        },
        () =>
          console.info("ICHI_PRIZE_TICKET_CLIENT", {
            stage: "uploaded_boards_visible",
            recordId: draft.cloudRecordId,
            boardId: draft.boardId,
            submissionVersion,
            elapsedMs: Date.now() - submissionStartedAt,
          }),
      );
      this.refreshDrafts(null);
      void this.refreshCloudRecords();
      if (pending.status === "PHOTO_PENDING" || pending.status === "PENDING")
        void this.runTicketVerification(uploaded);
      if (uploaded.albumSaveWarning)
        wx.showToast({
          title: "照片未保存到相册，已进入待核对",
          icon: "none",
        });
    } catch (error) {
      if (pendingEstablished && uploaded) {
        const submittedImagePath = String(this.data.shareImagePath);
        void deleteWxTemporaryBoardImage(submittedImagePath).catch(
          () => undefined,
        );
        this.saveNavigation("start", null);
        this.setData({
          activeTab: "my" as const,
          currentView: "contributions" as const,
          modalView: "" as const,
          shareImagePath: "",
          shareNote: "",
          shareReady: false,
          activeDraft: null,
        });
        this.refreshDrafts(null);
        void this.refreshCloudRecords();
        if (pendingStatus === "PHOTO_PENDING" || pendingStatus === "PENDING")
          void this.runTicketVerification(uploaded);
        return;
      }
      if (uploaded?.imageFileId && !pendingEstablished)
        void api.deleteFile(uploaded.imageFileId).catch(() => undefined);
      console.error("ICHI_PRIZE_TICKET_SUBMISSION", {
        stage: "pending_submit_failed",
        recordId: draft.cloudRecordId,
        boardId: draft.boardId,
        submissionVersion,
        code: error instanceof Error ? error.message : "SUBMISSION_FAILED",
      });
      wx.showToast({ title: "上传失败，请重试", icon: "none" });
    } finally {
      this.setData({ evidenceSubmitting: false });
    }
  },

  async runTicketVerification(pending: PendingDrawTicketEvidence) {
    try {
      const preparedDraft = draftRepository
        .readAll()
        .find((draft) => draft.boardId === pending.boardId);
      if (
        !preparedDraft ||
        preparedDraft.currentVerificationVersion !== pending.submissionVersion
      )
        return;
      const result = await runPendingDrawTicketVerification(
        getWxDrawTicketEvidenceApi(),
        pending,
        {
          drawEvents: preparedDraft.history,
          ...(preparedDraft.locationNote
            ? { userNote: preparedDraft.locationNote }
            : {}),
        },
      );
      if (
        result.status === "PENDING" ||
        result.status === "PHOTO_PENDING" ||
        result.status === "LOCATION_PENDING" ||
        result.status === "SUPERSEDED"
      )
        return;
      const current = draftRepository
        .readAll()
        .find((draft) => draft.boardId === pending.boardId);
      if (
        !current ||
        current.currentVerificationVersion !== pending.submissionVersion
      )
        return;
      const verificationStatus = (() => {
        if (result.status === "APPROVED" || result.status === "VERIFIED")
          return "verified" as const;
        if (result.status === "LOCATION_FAILED")
          return "location-failed" as const;
        if (result.status === "PHOTO_FAILED") return "photo-failed" as const;
        if (result.status === "NOTE_PENDING") return "note-pending" as const;
        if (result.status === "NOTE_FAILED") return "note-failed" as const;
        if (result.status === "MISMATCH") return "mismatch" as const;
        if (result.status === "INVALID_EVIDENCE")
          return "invalid-evidence" as const;
        if (result.status === "NEEDS_REVIEW") return "needs-review" as const;
        return "provider-failed" as const;
      })();
      const { verificationPending: _previousPending, ...stableDraft } = current;
      void _previousPending;
      draftRepository.upsert({
        ...stableDraft,
        savedAt: Date.now(),
        verificationStatus,
        submissionState:
          verificationStatus === "verified" ? "uploaded" : "pending-review",
        ...(verificationStatus === "needs-review" ||
        verificationStatus === "provider-failed" ||
        verificationStatus === "note-pending"
          ? { verificationPending: pending }
          : {}),
      });
      this.refreshDrafts(null);
      void this.refreshCloudRecords();
    } catch (error) {
      console.error("ICHI_PRIZE_TICKET_BACKGROUND", {
        stage: "verification_transport_failed",
        recordId: pending.recordId,
        boardId: pending.boardId,
        submissionVersion: pending.submissionVersion,
        code: error instanceof Error ? error.message : "NETWORK_FAILED",
      });
    }
  },

  async resumePendingTicketVerifications() {
    const pending = draftRepository
      .readAll()
      .filter(
        (draft) =>
          draft.verificationStatus === "pending" && draft.verificationPending,
      )
      .map((draft) => draft.verificationPending!);
    await Promise.all(pending.map((item) => this.runTicketVerification(item)));
  },

  onRetryTicketVerification(event: WechatMiniprogram.BaseEvent) {
    const boardId = String(event.currentTarget.dataset.boardId || "");
    const draft = draftRepository
      .readAll()
      .find((item) => item.boardId === boardId);
    if (draft?.verificationPending) {
      draftRepository.upsert({
        ...draft,
        verificationStatus: "pending",
        submissionState: "pending-review",
        savedAt: Date.now(),
      });
      this.refreshDrafts(null);
      void this.runTicketVerification(draft.verificationPending);
      return;
    }
    const cloudRecord = (
      this.data.cloudRecords as readonly CloudRecordViewModel[]
    ).find((item) => item.boardId === boardId);
    if (!cloudRecord?.verificationPending) return;
    const markPending = (record: CloudRecordViewModel) => {
      if (record.boardId !== boardId) return record;
      const { verificationAction: _action, ...stableRecord } = record;
      void _action;
      return { ...stableRecord, recordStateLabel: "待核对" as const };
    };
    this.setData({
      cloudRecords: (
        this.data.cloudRecords as readonly CloudRecordViewModel[]
      ).map(markPending),
      cloudClues: (this.data.cloudClues as readonly CloudRecordViewModel[]).map(
        markPending,
      ),
    });
    void runPendingDrawTicketVerification(
      getWxDrawTicketEvidenceApi(),
      cloudRecord.verificationPending,
    ).finally(() => void this.refreshCloudRecords());
  },

  async onReuploadTicketEvidence(event: WechatMiniprogram.BaseEvent) {
    const boardId = String(event.currentTarget.dataset.boardId || "");
    const draft = draftRepository
      .readAll()
      .find((item) => item.boardId === boardId);
    const cloudRecord = (
      this.data.cloudRecords as readonly CloudRecordViewModel[]
    ).find((item) => item.boardId === boardId);
    const cloudRecordId = draft?.cloudRecordId ?? cloudRecord?.recordId;
    const currentVersion =
      draft?.evidenceSubmissionVersion ??
      cloudRecord?.submissionVersion ??
      cloudRecord?.verificationPending?.submissionVersion;
    if (!cloudRecordId || !currentVersion || this.data.evidenceSubmitting)
      return;
    const selection = await new Promise<string | null>((resolve) => {
      wx.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sourceType: ["album"],
        success: (result) => resolve(result.tempFiles[0]?.tempFilePath ?? null),
        fail: () => resolve(null),
      });
    });
    if (!selection) return;
    const submissionVersion = currentVersion + 1;
    const api = getWxDrawTicketEvidenceApi();
    let uploaded: PendingDrawTicketEvidence | undefined;
    let pendingEstablished = false;
    this.setData({ evidenceSubmitting: true });
    try {
      uploaded = await uploadDrawTicketEvidence(api, {
        recordId: cloudRecordId,
        boardId,
        submissionVersion,
        imagePath: selection,
        captureSource: "gallery",
      });
      const result = await createPendingDrawTicketVerification(
        api,
        uploaded,
        draft
          ? {
              drawEvents: draft.history,
              ...(draft.locationNote ? { userNote: draft.locationNote } : {}),
            }
          : cloudRecord?.userNote
            ? { drawEvents: [], userNote: cloudRecord.userNote }
            : undefined,
      );
      if (result.status !== "PHOTO_PENDING")
        throw new Error("PENDING_SUBMISSION_NOT_ESTABLISHED");
      pendingEstablished = true;
      if (draft) {
        draftRepository.upsert({
          ...draft,
          savedAt: Date.now(),
          verificationStatus: "pending",
          submissionState: "pending-review",
          evidenceSubmissionVersion: submissionVersion,
          currentVerificationVersion: submissionVersion,
          verificationPending: uploaded,
        });
        this.refreshDrafts(null);
      } else {
        void this.refreshCloudRecords();
      }
      await deleteWxTemporaryBoardImage(selection).catch(() => undefined);
      if (draft) void this.runTicketVerification(uploaded);
      else
        void runPendingDrawTicketVerification(api, uploaded).finally(
          () => void this.refreshCloudRecords(),
        );
    } catch {
      if (uploaded?.imageFileId && !pendingEstablished)
        void api.deleteFile(uploaded.imageFileId).catch(() => undefined);
      wx.showToast({ title: "上传失败，请重试", icon: "none" });
    } finally {
      this.setData({ evidenceSubmitting: false });
    }
  },

  onEditTicketNote(event: WechatMiniprogram.BaseEvent) {
    const boardId = String(event.currentTarget.dataset.boardId || "");
    const draft = draftRepository
      .readAll()
      .find((item) => item.boardId === boardId);
    const cloudRecord = (
      this.data.cloudRecords as readonly CloudRecordViewModel[]
    ).find((item) => item.boardId === boardId);
    const recordId = draft?.cloudRecordId ?? cloudRecord?.recordId;
    const submissionVersion =
      draft?.evidenceSubmissionVersion ?? cloudRecord?.submissionVersion;
    if (!recordId || !submissionVersion) return;
    this.setData({
      modalView: "note-review" as const,
      noteReviewRecordId: recordId,
      noteReviewBoardId: boardId,
      noteReviewSubmissionVersion: submissionVersion,
      shareNote: draft?.locationNote ?? cloudRecord?.userNote ?? "",
    });
  },

  onReviewNoteInput(event: WechatMiniprogram.Input) {
    this.setData({ shareNote: String(event.detail.value) });
  },

  async onSubmitNoteReview() {
    const userNote = String(this.data.shareNote).trim();
    if (!userNote || this.data.evidenceSubmitting) return;
    const recordId = String(this.data.noteReviewRecordId);
    const boardId = String(this.data.noteReviewBoardId);
    const submissionVersion = Number(this.data.noteReviewSubmissionVersion);
    this.setData({ evidenceSubmitting: true });
    try {
      const result = await reviewDrawTicketNote(getWxDrawTicketEvidenceApi(), {
        recordId,
        boardId,
        submissionVersion,
        userNote,
      });
      const draft = draftRepository
        .readAll()
        .find((item) => item.boardId === boardId);
      if (draft)
        draftRepository.upsert({
          ...draft,
          locationNote: userNote,
          verificationStatus:
            result.status === "APPROVED"
              ? "verified"
              : result.status === "NOTE_FAILED"
                ? "note-failed"
                : "note-pending",
          submissionState:
            result.status === "APPROVED" ? "uploaded" : "pending-review",
          savedAt: Date.now(),
        });
      this.setData({
        modalView: result.status === "APPROVED" ? "" : "note-review",
      });
      this.refreshDrafts(null);
      await this.refreshCloudRecords();
      wx.showToast({
        title:
          result.status === "APPROVED"
            ? "备注核验通过"
            : result.status === "NOTE_FAILED"
              ? "备注未通过，请修改"
              : "备注核验暂不可用",
        icon: "none",
      });
    } catch {
      wx.showToast({ title: "备注核验暂不可用", icon: "none" });
    } finally {
      this.setData({ evidenceSubmitting: false });
    }
  },

  onStayOnBoard() {
    this.setData({
      modalView: "" as const,
      shareImagePath: "",
      shareNote: "",
      shareReady: false,
      evidenceSubmitting: false,
    });
  },

  onSubmittedExit() {
    this.onBackToStart();
    this.setData({
      shareImagePath: "",
      shareNote: "",
      shareReady: false,
      evidenceSubmitting: false,
    });
  },

  onCloseModal() {
    this.setData({ modalView: "" as const });
  },

  onBlockTap() {},

  onRememberScrollEnd(
    event: WechatMiniprogram.CustomEvent<{ scrollTop: number }>,
  ) {
    const key = event.currentTarget.dataset.scrollKey as string | undefined;
    const allowed = new Set([
      "recognitionScrollTop",
      "drawScrollTop",
      "recordsScrollTop",
      "reminderScrollTop",
      "methodScrollTop",
    ]);
    if (!key || !allowed.has(key)) return;
    this.setData({ [key]: Math.max(0, event.detail.scrollTop) });
  },

  onSelectTab(event: WechatMiniprogram.BaseEvent) {
    if (this.data.generationState === "generating") return;
    const tab = event.currentTarget.dataset.tab as MainTab | undefined;
    if (!tab) return;
    if (this.data.currentView === "recognizing") clearRecognitionTimers();
    if (tab !== "recognize" && this.data.currentView === "camera-capture") {
      // Leaving the recognition tab explicitly abandons the frozen photo.
      this.releasePendingBoardMedia();
      this.setData({ boardCapturePath: "", recognitionCapturedAt: 0 });
    }
    if (tab === "recognize") {
      let view: RecognitionStableView;
      let activeBoardId: string | null;
      try {
        view = readRecognitionStableView(storage);
        activeBoardId = readActiveDraftBoardId(storage);
      } catch {
        this.setData({
          activeTab: "my" as const,
          currentView: "storage-fallback" as const,
          storageCapacityState: "unknown" as const,
        });
        return;
      }
      this.setData({
        activeTab: tab,
        currentView: view,
        modalView: "" as const,
      });
      this.refreshDrafts(activeBoardId);
      return;
    }
    if (tab === "map") {
      this.setData({
        activeTab: tab,
        currentView: "map-preview",
        modalView: "" as const,
      });
      return;
    }
    this.setData({ activeTab: tab, currentView: "my", modalView: "" as const });
    void this.refreshCloudAccount();
  },

  onOpenDraft(event: WechatMiniprogram.BaseEvent) {
    const boardId = event.currentTarget.dataset.boardId as string | undefined;
    if (!boardId || suppressOpenBoardId === boardId) return;
    let draft: LocalDrawDraft | undefined;
    try {
      draft = draftRepository
        .readAll()
        .find((item) => item.boardId === boardId);
    } catch {
      this.setData({
        activeTab: "my" as const,
        currentView: "storage-fallback" as const,
        storageCapacityState: "unknown" as const,
      });
      return;
    }
    if (!draft) {
      this.refreshDrafts();
      return;
    }
    if (!isResumableLocalDrawDraft(draft)) return;
    this.openResumableDraft(draft);
  },

  onOpenCloudRecord(event: WechatMiniprogram.BaseEvent) {
    const recordId = event.currentTarget.dataset.recordId as string | undefined;
    if (!recordId || suppressOpenBoardId === recordId) return;
    const record = (this.data.cloudRecords as CloudRecordViewModel[]).find(
      (item) => item.recordId === recordId,
    );
    if (!record?.recoveryDraft) return;
    try {
      draftRepository.upsert(record.recoveryDraft);
      this.refreshDrafts(record.recoveryDraft.boardId);
      this.refreshStorageInfo();
    } catch {
      this.setData({ modalView: "storage-warning" as const });
      return;
    }
    this.openResumableDraft(record.recoveryDraft);
  },

  openResumableDraft(draft: LocalDrawDraft) {
    const boardId = draft.boardId;
    if (!this.saveNavigation("draw", boardId)) return;
    this.setData({
      activeTab: "recognize",
      currentView: "draw",
      activeDraft: toActiveDraftViewModel(draft),
      drawSessionStartHistoryCount: draft.history.length,
      drawSessionStartSavedAt: draft.savedAt,
      drafts: (this.data.drafts as DraftViewModel[]).map((item) => ({
        ...item,
        swipeX: 0,
      })),
      continuousUndoCount: 0,
    });
    this.updateOutlook(draft);
  },

  onOpenMyPage(event: WechatMiniprogram.BaseEvent) {
    const view = event.currentTarget.dataset.view as HomeView | undefined;
    if (!view) return;
    this.setData({
      activeTab: "my",
      currentView: view,
      modalView: "" as const,
    });
    if (view === "account") void this.refreshCloudAccount();
    if (view === "contributions") {
      this.refreshDrafts();
      void this.refreshCloudRecords();
    }
  },

  onOpenLocalRecords() {
    this.setData({ activeTab: "my", currentView: "local-records" });
    this.refreshDrafts();
    void this.refreshCloudRecords();
  },

  async onRecordsRefresherRefresh() {
    if (
      this.data.recordsRefreshing ||
      (this.data.currentView !== "local-records" &&
        this.data.currentView !== "contributions")
    )
      return;
    this.setDraftSwipe("", 0);
    this.setData({ recordsRefreshing: true });
    try {
      this.refreshDrafts();
      await this.refreshCloudRecords();
    } finally {
      this.setData({ recordsRefreshing: false });
    }
  },

  onBackToMy() {
    this.setData({
      activeTab: "my",
      currentView: "my",
      modalView: "" as const,
    });
  },

  onTouchStart(event: WechatMiniprogram.TouchEvent) {
    const boardId = event.currentTarget.dataset.boardId as string | undefined;
    const touch = event.touches[0];
    const deleting = event.currentTarget.dataset.deleting === true;
    if (!boardId || !touch || deleting) return;
    swipingBoardId = boardId;
    suppressOpenBoardId = "";
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    draftGestureAxis = "pending";
    const local = (this.data.drafts as DraftViewModel[]).find(
      (item) => item.boardId === boardId,
    );
    const cloud =
      (this.data.cloudRecords as CloudRecordViewModel[]).find(
        (item) => item.recordId === boardId,
      ) ??
      (this.data.cloudClues as CloudRecordViewModel[]).find(
        (item) => item.recordId === boardId,
      );
    const contribution = (this.data.contributions as DraftViewModel[]).find(
      (item) => item.boardId === boardId,
    );
    swipeStartX = local?.swipeX ?? cloud?.swipeX ?? contribution?.swipeX ?? 0;
  },

  onTouchMove(event: WechatMiniprogram.TouchEvent) {
    const touch = event.touches[0];
    if (!touch || !swipingBoardId) return;
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    if (
      draftGestureAxis === "pending" &&
      Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= 8
    ) {
      draftGestureAxis =
        Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
    }
    if (draftGestureAxis !== "horizontal") return;
    if (Math.abs(deltaX) >= 8) suppressOpenBoardId = swipingBoardId;
    const swipeX = Math.max(-72, Math.min(0, swipeStartX + deltaX));
    this.setDraftSwipe(swipingBoardId, swipeX);
  },

  onTouchEnd(event: WechatMiniprogram.TouchEvent) {
    const boardId = event.currentTarget.dataset.boardId as string | undefined;
    if (!boardId || boardId !== swipingBoardId) return;
    if (draftGestureAxis !== "horizontal") {
      swipingBoardId = "";
      draftGestureAxis = "pending";
      return;
    }
    const local = (this.data.drafts as DraftViewModel[]).find(
      (item) => item.boardId === boardId,
    );
    const cloud =
      (this.data.cloudRecords as CloudRecordViewModel[]).find(
        (item) => item.recordId === boardId,
      ) ??
      (this.data.cloudClues as CloudRecordViewModel[]).find(
        (item) => item.recordId === boardId,
      );
    const contribution = (this.data.contributions as DraftViewModel[]).find(
      (item) => item.boardId === boardId,
    );
    this.setDraftSwipe(
      boardId,
      (local?.swipeX ?? cloud?.swipeX ?? contribution?.swipeX ?? 0) <= -36
        ? -72
        : 0,
    );
    swipingBoardId = "";
    draftGestureAxis = "pending";
    setTimeout(() => {
      if (suppressOpenBoardId === boardId) suppressOpenBoardId = "";
    }, 0);
  },

  setDraftSwipe(boardId: string, swipeX: number) {
    const updates: Record<string, number> = {};
    if (!boardId) {
      (["drafts", "startDrafts"] as const).forEach((key) => {
        (this.data[key] as DraftViewModel[]).forEach((draft, index) => {
          if (draft.swipeX !== 0) updates[`${key}[${index}].swipeX`] = 0;
        });
      });
      (this.data.cloudRecords as CloudRecordViewModel[]).forEach(
        (record, index) => {
          if (record.swipeX !== 0) updates[`cloudRecords[${index}].swipeX`] = 0;
        },
      );
      (this.data.cloudClues as CloudRecordViewModel[]).forEach(
        (record, index) => {
          if (record.swipeX !== 0) updates[`cloudClues[${index}].swipeX`] = 0;
        },
      );
      (this.data.contributions as DraftViewModel[]).forEach((draft, index) => {
        if (draft.swipeX !== 0) updates[`contributions[${index}].swipeX`] = 0;
      });
      if (Object.keys(updates).length) this.setData(updates);
      return;
    }
    (["drafts", "startDrafts"] as const).forEach((key) => {
      const index = (this.data[key] as DraftViewModel[]).findIndex(
        (draft) => draft.boardId === boardId,
      );
      if (index >= 0) updates[`${key}[${index}].swipeX`] = swipeX;
    });
    const cloudIndex = (
      this.data.cloudRecords as CloudRecordViewModel[]
    ).findIndex((record) => record.recordId === boardId);
    if (cloudIndex >= 0) updates[`cloudRecords[${cloudIndex}].swipeX`] = swipeX;
    const cloudClueIndex = (
      this.data.cloudClues as CloudRecordViewModel[]
    ).findIndex((record) => record.recordId === boardId);
    if (cloudClueIndex >= 0)
      updates[`cloudClues[${cloudClueIndex}].swipeX`] = swipeX;
    const contributionIndex = (
      this.data.contributions as DraftViewModel[]
    ).findIndex((draft) => draft.boardId === boardId);
    if (contributionIndex >= 0)
      updates[`contributions[${contributionIndex}].swipeX`] = swipeX;
    if (Object.keys(updates).length) this.setData(updates);
  },

  onReturnToDraw() {
    const draft = this.getActiveDraft();
    if (!draft) {
      this.onBackToStart();
      return;
    }
    if (!this.saveNavigation("draw")) return;
    this.setData({
      activeTab: "recognize" as const,
      currentView: "draw" as const,
      modalView: "" as const,
    });
  },

  onDismissDraftSwipe() {
    if (suppressOpenBoardId) return;
    const hasOpenDraft =
      (this.data.drafts as DraftViewModel[]).some(
        (draft) => draft.swipeX < 0,
      ) ||
      (this.data.cloudRecords as CloudRecordViewModel[]).some(
        (record) => record.swipeX < 0,
      ) ||
      (this.data.cloudClues as CloudRecordViewModel[]).some(
        (record) => record.swipeX < 0,
      ) ||
      (this.data.contributions as DraftViewModel[]).some(
        (record) => record.swipeX < 0,
      );
    if (!hasOpenDraft) return;
    this.setDraftSwipe("", 0);
  },

  async onDeleteDraft(event: WechatMiniprogram.BaseEvent) {
    const boardId = event.currentTarget.dataset.boardId as string | undefined;
    if (!boardId) return;
    try {
      const draft = draftRepository
        .readAll()
        .find((item) => item.boardId === boardId);
      if (draft?.cloudRecordId) {
        await requestCloudRecordDeletion(getWxCloudFunctionApi(), {
          recordId: draft.cloudRecordId,
          boardId,
        });
      }
      draftRepository.delete(boardId);
      this.refreshDrafts();
      void this.refreshCloudRecords();
      wx.showToast({ title: "记录已删除", icon: "none" });
    } catch {
      wx.showToast({ title: "删除失败，请稍后重试", icon: "none" });
    }
  },

  onClearAllLocalData() {
    wx.showModal({
      title: "删除全部本地数据？",
      content: "票池、抽取记录和本地草稿会永久删除，且无法撤销。",
      confirmText: "全部删除",
      confirmColor: "#e014a0",
      success: ({ confirm }) => {
        if (!confirm) return;
        try {
          storage.removeItem(LOCAL_DRAW_DRAFTS_KEY);
          storage.removeItem(RECOGNITION_FLOW_KEY);
          writeActiveDraftBoardId(storage, null);
          writeRecognitionStableView(storage, "start");
          const globalData = getApp<IchiApp>().globalData;
          if (globalData.pendingBoardImage) {
            void deleteWxTemporaryBoardImage(
              globalData.pendingBoardImage.tempFilePath,
            );
          }
          delete globalData.pendingBoardImage;
        } catch {
          this.setData({ modalView: "storage-warning" as const });
          return;
        }
        this.setData({
          activeTab: "my" as const,
          currentView: "deleted" as const,
          drafts: [],
          startDrafts: [],
          contributions: [],
          uploadedCount: 0,
          unuploadedCount: 0,
          activeDraft: null,
          modalView: "" as const,
        });
      },
    });
  },

  onRecoverSchema() {
    try {
      storage.removeItem(LOCAL_DRAW_DRAFTS_KEY);
      if (!this.saveNavigation("start", null)) return;
    } catch {
      this.setData({ modalView: "storage-warning" as const });
      return;
    }
    this.setData({
      currentView: "start" as const,
      drafts: [],
      startDrafts: [],
      contributions: [],
      uploadedCount: 0,
      unuploadedCount: 0,
      activeDraft: null,
    });
  },
});
