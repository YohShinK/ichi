import { PUBLIC_MAP_CACHE_TTL_MS } from "../../platform/public-map-cache.js";
import {
  captureBoardImage,
  classifyBoardMediaFailure,
  getWxBoardCameraApi,
  type BoardMediaSelection,
} from "../../platform/board-media.js";
import {
  MAP_CONTRIBUTION_TERMS,
  MAP_CONTRIBUTION_TERMS_INTRO,
} from "../../platform/map-contribution-terms.js";
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
  toInitialCloudSnapshot,
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
  refreshCloudQuota,
  getWxWechatProfileMediaAdapter,
  quotaUsedPercent,
  type CloudAccountProfile,
  type CloudQuotaSummary,
} from "../../platform/cloud-account.js";
import {
  finalizeCloudObservation,
  getCloudRecognitionJob,
  prepareCloudObservationForUpload,
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
  HumanAssistanceClient,
  disabledHumanAssistanceService,
  type HumanAssistanceAnswer,
  type HumanAssistanceRequestView,
} from "../../platform/human-assistance-client.js";

import {
  createPendingDrawTicketVerification,
  getWxDrawTicketEvidenceApi,
  runPendingDrawTicketVerification,
  reviewDrawTicketNote,
  uploadDrawTicketEvidence,
  type PendingDrawTicketEvidence,
} from "../../platform/draw-ticket-recognition.js";
import type { IchiApp } from "../../app.js";
import {
  createCopyUrlPayload,
  createFriendSharePayload,
  createTimelineSharePayload,
  parsePublicShareTab,
  type PublicShareTab,
} from "../../platform/home-sharing.js";
import {
  PublicMapClient,
  type PublicMapClientState,
} from "../../platform/public-map-client.js";
import {
  createWxProductionPublicMapService,
  createWxProductionContributionService,
  UPLOAD_SHARING_DISCLOSURE_VERSION,
} from "../../platform/production-map-service.js";
import {
  type CandidateUploadView,
  type MapContributionConsentView,
} from "../../platform/candidate-upload-service.js";
import {
  createDefaultPublicMapQuery,
  createPublicMapQueryIdentity,
} from "../../platform/public-map-query.js";
import {
  presentPublicDetail,
  presentPublicMarker,
  type PublicMapDetailPresentation,
  type PublicMapMarkerPresentation,
  type PublicMapSheetMode,
} from "../../platform/public-map-presentation.js";
import {
  ALL_PUBLIC_DISCOVERY_TAG_IDS,
  DEFAULT_PUBLIC_DISCOVERY_TAG_IDS,
  createPublicDiscoveryTagOptions,
  filterPublicDiscoveryMarkers,
  POSITIVE_DISCOVERY_TAGS,
  type PublicDiscoveryTagId,
  type MapLocationState,
} from "../../platform/public-map-discovery.js";
import {
  HIGH_ACCURACY_LOCATION_OPTIONS,
  CURRENT_LOCATION_REFRESH_MS,
  requestCurrentMapLocation,
  withCurrentMapLocation,
  currentMapLocationCircles,
  type CurrentMapLocationCircle,
  type CurrentMapLocation,
  type MapLocationApi,
} from "../../platform/public-map-location.js";
import {
  PublicMapReportingClient,
  createWxReportingService,
  type ReportingState,
} from "../../platform/public-map-reporting.js";
import {
  classifyClusterAtMaxScale,
  presentClusterPickerRow,
  ClusterPickerMetadataLoader,
  type PublicMapClusterPickerRow,
} from "../../platform/public-map-cluster-picker.js";
import {
  resolveCanvasMarkerProjection,
  LatestMarkerProjectionResolver,
} from "../../platform/marker-binding-adapter.js";
import {
  PNG_MARKER_ZOOM_ADAPTIVE_ENABLED,
  MarkerZoomThrottle,
  markerDetailLevel,
  markerGeometry,
  markerLevelForRightWidth,
} from "../../platform/marker-zoom-adaptive.js";
import {
  MarkerCanvasRenderer,
  createMarkerRenderKey,
  type MarkerCanvasRenderInput,
} from "../../platform/marker-canvas-renderer.js";
import { MarkerImageCache } from "../../platform/marker-image-cache.js";
import {
  deriveMarkerRightWidth,
  withFallbackNativeMapMarkerBindings,
  NATIVE_MARKER_HEIGHT,
  NATIVE_MARKER_LEFT_WIDTH,
  nativeMarkerClusterKey,
  planNativeMapStableReconcile,
  projectNativeMapMarkers,
  type NativeMapMarkerBinding,
  type NativeMapMarkerProjection,
  type NativeMapMarkerView,
} from "../../platform/public-map-native-presentation.js";
import {
  easePresentationProgress,
  PUBLIC_MAP_MAX_SCALE,
} from "../../platform/public-map-interaction.js";
import {
  findPublicMapClusterExpansionScale,
  offsetPublicMapCoordinate,
  type PublicMapBounds,
} from "../../platform/public-map-cluster-engine.js";
import {
  beginNativeMapPresentationReconcile,
  cancelNativeMapPresentationReconcile,
  completeNativeMapPresentationReconcile,
  createNativeMapCameraScaleState,
  isPublicMapRevalidatingPhase,
  needsNativeMapPresentationReconcile,
  resolveNativeMapObservedScale,
  resolveNativeMapPresentationScale,
  retainStablePublicMapMarkers,
  withNativeMapObservedScale,
  withNativeMapSettledScale,
  withNativeMapTargetScale,
  withNativeMapPresentationScale,
  type NativeMapCameraScaleSource,
  type NativeMapCameraScaleState,
} from "../../platform/public-map-render-scheduler.js";

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
type PublicMapCardPhase = "CLOSED" | "OPENING" | "OPEN" | "CLOSING";
type PublicMapInteractionState =
  | "IDLE"
  | "GESTURE"
  | "CLUSTER_SELECTED"
  | "CAMERA_ANIMATING"
  | "CLUSTER_TRANSITION";
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
  | "profile-edit"
  | "human-assistance"
  | "map-contribution-consent";
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

interface NativeShareApi {
  showShareMenu?: (options: {
    readonly menus: readonly ["shareAppMessage", "shareTimeline"];
  }) => void;
  onCopyUrl?: (listener: () => { readonly query: string }) => void;
  offCopyUrl?: () => void;
}

const nativeShareApi = (): NativeShareApi => wx as unknown as NativeShareApi;
const copyUrlOwners = new WeakSet<object>();

const publicEntryView = (
  tab: PublicShareTab,
  recognitionView: HomeView,
): HomeView => {
  if (tab === "map") return "map-preview";
  if (tab === "my") return "my";
  return recognitionView;
};

interface DraftViewModel extends LocalDrawDraftSummary {
  readonly swipeX: number;
  readonly isDeleting?: boolean;
}

interface CloudRecordViewModel extends CloudRecordSummary {
  readonly swipeX: number;
  readonly isDeleting?: boolean;
}

interface CandidateUploadViewModel extends CandidateUploadView {
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

const createTicketPeelStyle = (progress: number): string =>
  `--ticket-peel-offset: -${progress}%; --ticket-peel-width: ${progress}%;`;

const createStorageMeterFillStyle = (percent: number): string =>
  `width: ${percent}%;`;

let touchStartX = 0;
let touchStartY = 0;
let swipeStartX = 0;
let swipingBoardId = "";
const deletingUploadedRecordIds = new Set<string>();
const deletingCandidateRecordRefs = new Set<string>();
const humanAssistanceClient = new HumanAssistanceClient(
  disabledHumanAssistanceService,
);
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
const publicMapNetworkHandlers = new WeakMap<
  object,
  (status: { readonly isConnected?: boolean; readonly errMsg?: string }) => void
>();
const publicMapDetailPreparationSuspended = new WeakSet<object>();
const publicMapPrefetchGenerations = new WeakMap<object, number>();
const publicMapClients = new WeakMap<
  object,
  { readonly client: PublicMapClient; readonly unsubscribe: () => void }
>();
const candidateUploadService = createWxProductionContributionService();
const mapContributionConsentCountdowns = new WeakMap<
  object,
  { readonly deadline: number; timer?: ReturnType<typeof setTimeout> }
>();
const publicMapReportClients = new WeakMap<
  object,
  {
    readonly client: PublicMapReportingClient;
    readonly unsubscribe: () => void;
  }
>();
const publicMapViewportDebounceTimers = new WeakMap<
  object,
  ReturnType<typeof setTimeout>
>();
const publicMapCardCloseTimers = new WeakMap<
  object,
  ReturnType<typeof setTimeout>
>();
const publicMapNativeContexts = new WeakMap<
  object,
  WechatMiniprogram.MapContext
>();
const publicMapLocationGenerations = new WeakMap<object, number>();
const publicMapLocationRefreshTimers = new WeakMap<
  object,
  ReturnType<typeof setTimeout>
>();
const publicMapNativeCameraScales = new WeakMap<
  object,
  NativeMapCameraScaleState
>();
const publicMapStableMarkerPresentations = new WeakMap<
  object,
  readonly PublicMapMarkerPresentation[]
>();
const publicMapNativeViewports = new WeakMap<object, PublicMapBounds>();
interface PublicMapCameraSnapshot {
  readonly latitude: number;
  readonly longitude: number;
  readonly scale: number;
  readonly viewport?: PublicMapBounds;
}
const publicMapNativeCameraSnapshots = new WeakMap<
  object,
  PublicMapCameraSnapshot
>();
const publicMapNativeProjections = new WeakMap<
  object,
  NativeMapMarkerProjection
>();
const publicMapNativeCommittedProjections = new WeakMap<
  object,
  NativeMapMarkerProjection
>();
const publicMapMarkerCanvasRenderers = new WeakMap<
  object,
  MarkerCanvasRenderer
>();
const publicMapMarkerProjectionResolvers = new WeakMap<
  object,
  LatestMarkerProjectionResolver
>();
const publicMapMarkerZoomThrottles = new WeakMap<object, MarkerZoomThrottle>();
const publicMapMarkerImageCaches = new WeakMap<object, MarkerImageCache>();
const publicMapClusterPickerRenderTokens = new WeakMap<object, object>();
const publicMapOverlayTouches = new WeakMap<
  object,
  { active: boolean; until: number }
>();
const publicMapClusterPickerScrollTops = new WeakMap<object, number>();
const publicMapClusterPickerMetadataLoaders = new WeakMap<
  object,
  ClusterPickerMetadataLoader
>();
const publicMapMarkerRenderGenerations = new WeakMap<object, number>();
const publicMapNativeTransitionTimers = new WeakMap<
  object,
  ReturnType<typeof setTimeout>
>();
const publicMapNativeTapGuardUntil = new WeakMap<object, number>();
const publicMapNativeLastMarkerTaps = new WeakMap<
  object,
  { readonly markerId: number; readonly at: number }
>();
const publicMapNativeMarkerTapSuppressedUntil = new WeakMap<object, number>();
const NATIVE_MARKER_SURFACE_TAP_GUARD_MS = 160;
// The Canvas marker tip is the native anchor. Keep the full 64px asset above
// the detail sheet instead of letting the sheet cover its card body.
const NATIVE_MARKER_DETAIL_TARGET_OFFSET_Y_PX = 72;
const publicMapNativeCameraFallbackTimers = new WeakMap<
  object,
  ReturnType<typeof setTimeout>
>();
const publicMapNativeLeadCameraAnimations = new WeakMap<
  object,
  {
    readonly publicLeadId: string;
    readonly generation: number;
    timer: ReturnType<typeof setTimeout> | null;
  }
>();
const publicMapNativeLeadCameraAnimationGenerations = new WeakMap<
  object,
  number
>();
const NATIVE_LEAD_CAMERA_ANIMATION_MS = 420;
const NATIVE_LEAD_CAMERA_FRAME_MS = 16;
const publicMapNativePendingClusters = new WeakMap<
  object,
  {
    readonly clusterKey: string;
    readonly nextSplitScale: number;
  }
>();
const publicMapNativeSpiderfyClusters = new WeakMap<object, string>();
const publicMapNativeTransitionGenerations = new WeakMap<object, number>();
const publicMapNativeScalePollTimers = new WeakMap<
  object,
  ReturnType<typeof setTimeout>
>();
const publicMapNativeScalePollGenerations = new WeakMap<object, number>();
const publicMapNativeRegionGenerations = new WeakMap<object, number>();
const publicMapNativeGestureSessions = new WeakMap<
  object,
  {
    kind: "UNCLASSIFIED" | "PAN" | "ZOOM" | "PROGRAMMATIC";
    readonly startScale: number;
    readonly originViewport?: PublicMapBounds;
  }
>();
const publicMapNativeActiveRegions = new WeakSet<object>();
const publicMapNativeReconcileSessions = new WeakMap<
  object,
  {
    readonly generation: number;
    readonly observedScaleAtStart: number;
    readonly reason: "PAN" | "PROGRAMMATIC_CAMERA_SETTLE";
    visualCommitCount: number;
  }
>();
const publicMapNativeCommitInFlight = new WeakSet<object>();
const publicMapNativePendingCommits = new WeakMap<
  object,
  {
    readonly projection: NativeMapMarkerProjection;
    readonly interactionState: PublicMapInteractionState;
    readonly canvasMarkerReady?: boolean;
    readonly onCommitted?: () => void;
  }
>();
const NATIVE_MAP_TOPOLOGY_STABILITY_MS = 120;
const publicMapNativeTopologyBarriers = new WeakMap<
  object,
  {
    generation: number;
    signature: string | null;
    timer: ReturnType<typeof setTimeout> | null;
    pending: {
      readonly projection: NativeMapMarkerProjection;
      readonly interactionState: PublicMapInteractionState;
      readonly canvasMarkerReady?: boolean;
      readonly onCommitted?: () => void;
    } | null;
  }
>();

const rememberNativeMapCameraSnapshot = (
  owner: object,
  input: {
    readonly latitude: number;
    readonly longitude: number;
    readonly scale: number;
    readonly viewport?: PublicMapBounds;
  },
): void => {
  if (
    !Number.isFinite(input.latitude) ||
    !Number.isFinite(input.longitude) ||
    !Number.isFinite(input.scale) ||
    input.scale <= 0
  )
    return;
  publicMapNativeCameraSnapshots.set(owner, {
    latitude: input.latitude,
    longitude: input.longitude,
    scale: input.scale,
    ...(input.viewport ? { viewport: input.viewport } : {}),
  });
};

// TEMP TASK-V2-17 diagnostics. Set to false after the DevTools/true-device
// Zoom Trigger Chain evidence has been captured.
const NATIVE_MAP_ZOOM_DIAGNOSTICS_ENABLED = false;
type NativeMapZoomTraceEvent =
  | "ZOOM_EVENT_RECEIVED"
  | "CAMERA_STATE_UPDATED"
  | "SCALE_CHANGE_CHECK"
  | "PRESENTATION_UPDATE_START"
  | "PROJECTION_REBUILD"
  | "MARKER_VIEW_GENERATED"
  | "NATIVE_BINDING_COMMIT"
  | "SET_DATA_COMMIT"
  | "SET_DATA_SKIPPED"
  | "NATIVE_MAP_RENDER"
  | "RECONCILE_STARTED"
  | "RECONCILE_CANCELLED"
  | "RECONCILE_COMPLETED"
  | "STABLE_MARKER_COMMIT";
interface NativeMapZoomDiagnosticState {
  sequence: number;
  topologyGeneration: number;
  markerViewGeneration: number;
  topologySignature: string;
  projectionTimestamps: number[];
  nativeBindingCommitTimestamps: number[];
  setDataCommitTimestamps: number[];
  nativeRenderTimestamps: number[];
}
const publicMapNativeZoomDiagnostics = new WeakMap<
  object,
  NativeMapZoomDiagnosticState
>();

const nativeMapZoomDiagnosticStateFor = (
  owner: object,
): NativeMapZoomDiagnosticState => {
  const existing = publicMapNativeZoomDiagnostics.get(owner);
  if (existing) return existing;
  const created: NativeMapZoomDiagnosticState = {
    sequence: 0,
    topologyGeneration: 0,
    markerViewGeneration: 0,
    topologySignature: "",
    projectionTimestamps: [],
    nativeBindingCommitTimestamps: [],
    setDataCommitTimestamps: [],
    nativeRenderTimestamps: [],
  };
  publicMapNativeZoomDiagnostics.set(owner, created);
  return created;
};

const nativeMapCameraScaleStateFor = (
  owner: object,
  fallbackScale: number,
): NativeMapCameraScaleState => {
  const existing = publicMapNativeCameraScales.get(owner);
  if (existing) return existing;
  const created = createNativeMapCameraScaleState(fallbackScale);
  publicMapNativeCameraScales.set(owner, created);
  return created;
};

const setNativeMapTargetScale = (
  owner: object,
  fallbackScale: number,
  targetScale: number,
): NativeMapCameraScaleState => {
  const next = withNativeMapTargetScale(
    nativeMapCameraScaleStateFor(owner, fallbackScale),
    targetScale,
  );
  publicMapNativeCameraScales.set(owner, next);
  return next;
};

const setNativeMapObservedScale = (
  owner: object,
  fallbackScale: number,
  input: {
    readonly scale: number;
    readonly source: NativeMapCameraScaleSource;
    readonly at?: number;
  },
): NativeMapCameraScaleState => {
  const next = withNativeMapObservedScale(
    nativeMapCameraScaleStateFor(owner, fallbackScale),
    { ...input, at: input.at ?? Date.now() },
  );
  publicMapNativeCameraScales.set(owner, next);
  return next;
};

const settleNativeMapScale = (
  owner: object,
  fallbackScale: number,
  scale: number,
): NativeMapCameraScaleState => {
  const next = withNativeMapSettledScale(
    nativeMapCameraScaleStateFor(owner, fallbackScale),
    scale,
    Date.now(),
  );
  publicMapNativeCameraScales.set(owner, next);
  return next;
};

const setNativeMapPresentationScale = (
  owner: object,
  fallbackScale: number,
  scale: number,
): NativeMapCameraScaleState => {
  const next = withNativeMapPresentationScale(
    nativeMapCameraScaleStateFor(owner, fallbackScale),
    scale,
  );
  publicMapNativeCameraScales.set(owner, next);
  return next;
};

const beginNativeMapReconcileScale = (
  owner: object,
  fallbackScale: number,
  targetScale: number,
): NativeMapCameraScaleState => {
  const next = beginNativeMapPresentationReconcile(
    nativeMapCameraScaleStateFor(owner, fallbackScale),
    targetScale,
  );
  publicMapNativeCameraScales.set(owner, next);
  return next;
};

const completeNativeMapReconcileScale = (
  owner: object,
  fallbackScale: number,
): NativeMapCameraScaleState => {
  const next = completeNativeMapPresentationReconcile(
    nativeMapCameraScaleStateFor(owner, fallbackScale),
  );
  publicMapNativeCameraScales.set(owner, next);
  return next;
};

const cancelNativeMapReconcileScale = (
  owner: object,
  fallbackScale: number,
  committedScale: number,
): NativeMapCameraScaleState => {
  const next = cancelNativeMapPresentationReconcile(
    nativeMapCameraScaleStateFor(owner, fallbackScale),
    committedScale,
  );
  publicMapNativeCameraScales.set(owner, next);
  return next;
};

const nativeMapViewportMoved = (
  previous: PublicMapBounds | undefined,
  next: PublicMapBounds | undefined,
): boolean => {
  if (!previous || !next) return false;
  const previousCenter = {
    longitude: (previous.west + previous.east) / 2,
    latitude: (previous.south + previous.north) / 2,
  };
  const nextCenter = {
    longitude: (next.west + next.east) / 2,
    latitude: (next.south + next.north) / 2,
  };
  return (
    Math.abs(previousCenter.longitude - nextCenter.longitude) > 0.0000005 ||
    Math.abs(previousCenter.latitude - nextCenter.latitude) > 0.0000005
  );
};

const traceNativeMapZoom = (
  owner: object,
  event: NativeMapZoomTraceEvent,
  detail: Readonly<Record<string, unknown>>,
): void => {
  if (!NATIVE_MAP_ZOOM_DIAGNOSTICS_ENABLED) return;
  const state = nativeMapZoomDiagnosticStateFor(owner);
  state.sequence += 1;
  console.info("[TASK-V2-17_ZOOM_TRACE]", {
    event,
    timestamp: Date.now(),
    sequence: state.sequence,
    runtime: wx.getDeviceInfo?.().platform ?? "unknown",
    sdkVersion: wx.getAppBaseInfo?.().SDKVersion ?? "unknown",
    ...detail,
  });
};

const recordNativeMapDiagnosticRate = (timestamps: number[]): number => {
  const now = Date.now();
  const recent = timestamps.filter((timestamp) => now - timestamp < 1_000);
  timestamps.splice(0, timestamps.length, ...recent, now);
  return timestamps.length;
};

const recordNativeMapCameraState = (
  owner: object,
  input: {
    readonly currentScale: number;
    readonly settled: boolean;
    readonly gestureState: PublicMapInteractionState;
    readonly source: string;
  },
): void => {
  if (!NATIVE_MAP_ZOOM_DIAGNOSTICS_ENABLED) return;
  const camera = nativeMapCameraScaleStateFor(owner, input.currentScale);
  traceNativeMapZoom(owner, "CAMERA_STATE_UPDATED", {
    currentScale: input.currentScale,
    targetScale: camera.targetScale,
    observedScale: camera.observedScale,
    settledScale: camera.settledScale,
    presentationScale: camera.presentationScale,
    targetPresentationScale: camera.targetPresentationScale,
    gestureState: input.gestureState,
    source: input.source,
  });
};

const recordNativeMapMarkerViews = (
  owner: object,
  projection: NativeMapMarkerProjection,
  inputMarkerCount: number,
): void => {
  if (!NATIVE_MAP_ZOOM_DIAGNOSTICS_ENABLED) return;
  const state = nativeMapZoomDiagnosticStateFor(owner);
  const topologySignature = projection.views
    .map((view) => view.memberLeadIds.join(","))
    .sort()
    .join(";");
  if (topologySignature !== state.topologySignature) {
    state.topologySignature = topologySignature;
    state.topologyGeneration += 1;
  }
  state.markerViewGeneration += 1;
  const projectionsInLastSecond = recordNativeMapDiagnosticRate(
    state.projectionTimestamps,
  );
  traceNativeMapZoom(owner, "PROJECTION_REBUILD", {
    scale: projection.scale,
    inputMarkerCount,
    outputMarkerCount: projection.views.length,
    topologyGeneration: state.topologyGeneration,
    projectionGeneration: state.markerViewGeneration,
    projectionsInLastSecond,
  });
  traceNativeMapZoom(owner, "MARKER_VIEW_GENERATED", {
    scale: projection.scale,
    leadIds: projection.views.flatMap((view) => view.memberLeadIds),
    markerIds: projection.views.map((view) => view.markerId),
    viewCount: projection.views.length,
    clusterCount: projection.views.filter((view) => view.kind === "CLUSTER")
      .length,
    topologyGeneration: state.topologyGeneration,
    markerViewGeneration: state.markerViewGeneration,
    projectionGeneration: state.markerViewGeneration,
    transitionGeneration: publicMapNativeTransitionGenerations.get(owner) ?? 0,
  });
};

const recordNativeMapSetDataCommit = (
  owner: object,
  input: {
    readonly changedFields: readonly string[];
    readonly markerCount: number;
    readonly mapNativeMarkerCount: number;
    readonly mapNativeMarkerViewCount: number;
    readonly markerBindingCommit: boolean;
  },
): void => {
  if (!NATIVE_MAP_ZOOM_DIAGNOSTICS_ENABLED) return;
  const state = nativeMapZoomDiagnosticStateFor(owner);
  const commitsInLastSecond = recordNativeMapDiagnosticRate(
    state.setDataCommitTimestamps,
  );
  traceNativeMapZoom(owner, "SET_DATA_COMMIT", {
    ...input,
    commitsInLastSecond,
    topologyGeneration: state.topologyGeneration,
    topologyBarrierGeneration:
      publicMapNativeTopologyBarriers.get(owner)?.generation ?? 0,
    transitionGeneration: publicMapNativeTransitionGenerations.get(owner) ?? 0,
  });
};

const nativeMapBindingItemSignature = (
  binding: NativeMapMarkerBinding,
): string => {
  return [
    binding.id,
    binding.latitude.toFixed(7),
    binding.longitude.toFixed(7),
    binding.iconPath,
    binding.alpha,
    binding.width,
    binding.height,
    binding.anchor.x,
    binding.anchor.y,
    binding.zIndex ?? "",
  ].join(":");
};

const nativeMapBindingSignature = (
  bindings: readonly NativeMapMarkerBinding[],
): string => bindings.map(nativeMapBindingItemSignature).join(";");

const changedNativeMapBindingIds = (
  previous: readonly NativeMapMarkerBinding[],
  next: readonly NativeMapMarkerBinding[],
): readonly number[] => {
  const previousById = new Map(
    previous.map((binding) => [
      binding.id,
      nativeMapBindingItemSignature(binding),
    ]),
  );
  const nextById = new Map(
    next.map((binding) => [binding.id, nativeMapBindingItemSignature(binding)]),
  );
  return [...new Set([...previousById.keys(), ...nextById.keys()])]
    .filter((id) => previousById.get(id) !== nextById.get(id))
    .sort((left, right) => left - right);
};

const clearNativeMapTopologyBarrier = (owner: object): void => {
  const barrier = publicMapNativeTopologyBarriers.get(owner);
  if (!barrier) return;
  barrier.generation += 1;
  if (barrier.timer) clearTimeout(barrier.timer);
  barrier.timer = null;
  barrier.pending = null;
  barrier.signature = null;
};

const nativeMapViewSignature = (
  views: readonly NativeMapMarkerView[],
): string =>
  views
    .map((view) => {
      const quarterPixel = (value: number) => Math.round(value * 4) / 4;
      return [
        view.markerId,
        view.kind,
        Array.isArray(view.memberLeadIds) ? view.memberLeadIds.join(",") : "",
        quarterPixel(view.totalWidth),
        quarterPixel(view.shellWidth),
        quarterPixel(view.visualOffsetX),
        quarterPixel(view.visualOffsetY),
        view.selected ? 1 : 0,
        view.transitionHidden ? 1 : 0,
        view.totalRemainingLabel,
        view.boardShortLabel,
        view.primaryDiscoveryTag,
        view.markerStatusTone,
        view.clusterCount,
      ].join(":");
    })
    .join(";");

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

const toPublicMapPageData = (
  state: PublicMapClientState,
  searchText: string,
  selectedTagIds: readonly PublicDiscoveryTagId[],
): {
  readonly mapPhase: PublicMapClientState["phase"];
  readonly mapMarkers: readonly PublicMapMarkerPresentation[];
  readonly mapErrorMessage: string;
  readonly mapErrorCode: string;
  readonly mapClientCacheStale: boolean;
  readonly mapHasMore: boolean;
  readonly mapTruncated: boolean;
  readonly mapSelectedLeadId: string;
  readonly mapDetailPhase: PublicMapClientState["detail"]["phase"];
  readonly mapDetail: PublicMapDetailPresentation | null;
  readonly mapDetailPreview: PublicMapMarkerPresentation | null;
  readonly mapDetailErrorMessage: string;
  readonly mapDiscoveryEmptyReason: string;
} => {
  const detail = state.detail.item;
  const visibleItems = filterPublicDiscoveryMarkers({
    markers: state.items,
    searchText,
    selectedTagIds,
  });
  const mapDiscoveryEmptyReason =
    state.items.length === 0 || visibleItems.length > 0
      ? ""
      : selectedTagIds.length === 0
        ? "未选择筛选条件"
        : searchText.trim()
          ? "没有匹配此 IP / 关键词的公开线索"
          : "当前筛选组合暂无公开线索";
  return {
    mapPhase: state.phase,
    mapMarkers: visibleItems.map(presentPublicMarker),
    mapErrorMessage: state.error?.message ?? "",
    mapErrorCode: state.error?.code ?? "",
    mapClientCacheStale: state.clientCacheStale,
    mapHasMore: state.nextCursor !== null,
    mapTruncated: state.truncated,
    mapSelectedLeadId: state.detail.selectedPublicLeadId ?? "",
    mapDetailPhase: state.detail.phase,
    mapDetail: detail ? presentPublicDetail(detail) : null,
    mapDetailPreview:
      state.detail.phase === "LOADING"
        ? (visibleItems
            .map(presentPublicMarker)
            .find(
              (item) => item.publicLeadId === state.detail.selectedPublicLeadId,
            ) ?? null)
        : null,
    mapDetailErrorMessage: state.detail.error?.message ?? "",
    mapDiscoveryEmptyReason,
  };
};

const toPublicMapReportPageData = (state: ReportingState) => ({
  mapReportLeadId: state.publicLeadId,
  mapReportActive: state.active,
  mapReportBusy: state.busy,
  mapReportMessage: state.message || (state.active ? "你已举报这条信息" : ""),
});

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
  nickname: unknown,
  avatarPath: unknown,
  originalNickname: unknown,
): boolean => {
  const normalizedNickname = String(nickname ?? "").trim();
  const normalizedAvatarPath = String(avatarPath ?? "").trim();
  if (!normalizedNickname) return false;
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
        isHighAccuracy: true;
        highAccuracyExpireTime: number;
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
      ...HIGH_ACCURACY_LOCATION_OPTIONS,
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
    mapPhase: "INITIAL_IDLE" as PublicMapClientState["phase"],
    mapMarkers: [] as readonly PublicMapMarkerPresentation[],
    mapNativeMarkers: [] as readonly NativeMapMarkerBinding[],
    mapNativeDisplayMarkers: [] as readonly NativeMapMarkerBinding[],
    mapCurrentLocation: null as CurrentMapLocation | null,
    mapCurrentLocationCircles: [] as readonly CurrentMapLocationCircle[],
    mapNativeMarkerViews: [] as readonly NativeMapMarkerView[],
    mapNativeScale: 12,
    mapNativeProgress: 1,
    mapNativeCenterLatitude: 31.2304,
    mapNativeCenterLongitude: 121.4737,
    mapNativeLocationGranted: false,
    mapNativeSelectedClusterKey: "",
    mapClusterPickerOpen: false,
    mapClusterPickerRefreshing: false,
    mapClusterPickerImageWidth: 308,
    mapClusterPickerImageError: false,
    mapClusterPickerItems: [] as readonly PublicMapClusterPickerRow[],
    mapNativeInteractionState: "IDLE" as PublicMapInteractionState,
    mapNativeReady: false,
    canvasMarkerReady: false,
    mapNativeRenderError: "",
    mapErrorMessage: "",
    mapErrorCode: "",
    mapClientCacheStale: false,
    mapHasMore: false,
    mapTruncated: false,
    mapSelectedLeadId: "",
    mapDetailPhase: "IDLE" as PublicMapClientState["detail"]["phase"],
    mapDetail: null as PublicMapDetailPresentation | null,
    mapDetailPreview: null as PublicMapMarkerPresentation | null,
    mapDetailErrorMessage: "",
    mapSearchText: "",
    mapSelectedDiscoveryTagIds: [
      ...DEFAULT_PUBLIC_DISCOVERY_TAG_IDS,
    ] as readonly PublicDiscoveryTagId[],
    mapDiscoveryTagOptions: createPublicDiscoveryTagOptions(
      DEFAULT_PUBLIC_DISCOVERY_TAG_IDS,
    ),
    mapAllDiscoveryTagsSelected: false,
    mapDiscoveryEmptyReason: "",
    mapDiscoveryChipsEnabled: true,
    mapSheetMode: "CLOSED" as PublicMapSheetMode,
    mapCardPhase: "CLOSED" as PublicMapCardPhase,
    mapViewportDirty: false,
    mapNetworkOffline: false,
    mapLocationState: "READY" as MapLocationState,
    mapContributorAvatarFailed: false,
    mapReportLeadId: "",
    mapReportActive: false,
    mapReportBusy: false,
    mapReportMessage: "",
    candidateUploads: [] as readonly CandidateUploadViewModel[],
    mapContributionConsent: null as MapContributionConsentView | null,
    mapContributionConsentPhase: "IDLE" as
      "IDLE" | "LOADING" | "READY" | "UNAVAILABLE",
    submittedMapRecordId: "",
    mapUploadSharingMessage:
      "本条记录已上传，正在同步至地图。核验通过后会自动展示。",
    mapContributionConsentBusy: false,
    mapContributionConsentError: "",
    mapContributionConsentSeconds: 0,
    mapContributionTermsIntro: MAP_CONTRIBUTION_TERMS_INTRO,
    mapContributionTermsSections: MAP_CONTRIBUTION_TERMS,
    mapContributionTermsScrollTop: 0,
    pendingDeleteCandidateRecordRef: "",
    drafts: [] as DraftViewModel[],
    pendingDirectUploads: [] as DraftViewModel[],
    startDrafts: [] as DraftViewModel[],
    contributions: [] as DraftViewModel[],
    cloudRecords: [] as CloudRecordViewModel[],
    cloudClues: [] as CloudRecordViewModel[],
    humanAssistanceRequests: [] as readonly HumanAssistanceRequestView[],
    humanAssistanceCurrent: null as HumanAssistanceRequestView | null,
    humanAssistanceSelected: null as HumanAssistanceRequestView | null,
    humanAssistanceReturnModal: "" as "" | "board-upload-submitted",
    humanAssistanceBusy: false,
    humanAssistanceError: "",
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
    ticketPeelStyle: createTicketPeelStyle(0),
    ticketPeelSettling: false,
    ticketPeelBusy: false,
    ticketPeelFading: false,
    stopHolding: false,
    shareImagePath: "",
    shareNote: "",
    shareReady: false,
    noteReviewRecordId: "",
    noteReviewSourcePath: "assisted-draw" as "assisted-draw" | "direct-upload",
    noteReviewBoardId: "",
    noteReviewSubmissionVersion: 0,
    evidenceSubmitting: false,
    storagePercent: 0,
    storageMeterFillStyle: createStorageMeterFillStyle(0),
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
    profileNicknameDraft: "",
    profileOriginalNickname: "",
    profileAvatarPath: "",
    profileAuthorizationReady: false,
    quotaLimit: 5,
    quotaUsed: 0,
    quotaReserved: 0,
    quotaRemaining: 5,
    quotaUsedPercent: 0,
    quotaResetAt: "",
    accountBusy: false,
    pendingRecognitionMode: "assist" as RecognitionFlowMode,
  },

  onLoad(query: Readonly<Record<string, unknown>> = {}) {
    const requestedTab = parsePublicShareTab(query);
    const shareApi = nativeShareApi();
    shareApi.showShareMenu?.({
      menus: ["shareAppMessage", "shareTimeline"],
    });
    if (!copyUrlOwners.has(this) && shareApi.onCopyUrl) {
      shareApi.onCopyUrl(() =>
        createCopyUrlPayload(parsePublicShareTab({ tab: this.data.activeTab })),
      );
      copyUrlOwners.add(this);
    }
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
    const recognitionEntryView: HomeView =
      storageStatus === "schema-incompatible"
        ? "schema-incompatible"
        : stableView;
    this.setData({
      currentView: recognitionEntryView,
      activeTab: "recognize",
      topSafePx: getTopSafePx(),
      ...(cachedAccount
        ? {
            accountNickname: cachedAccount.nickname,
            accountAvatarUrl: cachedAccount.avatarPath,
            accountIchiId: cachedAccount.ichiId,
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
    this.setData({
      activeTab: requestedTab,
      currentView: publicEntryView(requestedTab, recognitionEntryView),
      modalView: "" as const,
    });
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
    if (requestedTab === "map") void this.ensurePublicMapClient();
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
    publicMapDetailPreparationSuspended.delete(this);
    this.refreshDrafts();
    const generation = (publicMapPrefetchGenerations.get(this) ?? 0) + 1;
    publicMapPrefetchGenerations.set(this, generation);
    void this.refreshCloudAccount().then((account: unknown) => {
      if (!account || publicMapPrefetchGenerations.get(this) !== generation)
        return;
      const client = this.ensurePublicMapClient();
      if (client.state.phase === "UNAUTHORIZED") void client.recoverIdentity();
      else if (this.data.currentView === "map-preview")
        this.refreshPublicMapOnEntry();
    });
    void this.resumePendingFinalizations();
    void this.resumePendingTicketVerifications();
    void candidateUploadService.flushSharedUploads();
    if (
      this.data.modalView === "board-upload-submitted" &&
      this.data.submittedMapRecordId
    )
      void this.syncSubmittedUploadSharing(
        String(this.data.submittedMapRecordId),
      );
  },

  onShareAppMessage() {
    return createFriendSharePayload(
      parsePublicShareTab({ tab: this.data.activeTab }),
    );
  },

  onShareTimeline() {
    return createTimelineSharePayload(
      parsePublicShareTab({ tab: this.data.activeTab }),
    );
  },

  onUnload() {
    publicMapDetailPreparationSuspended.add(this);
    publicMapClients.get(this)?.client.invalidatePreparedDetails();
    publicMapClients.get(this)?.client.clearSelection();
    publicMapPrefetchGenerations.set(
      this,
      (publicMapPrefetchGenerations.get(this) ?? 0) + 1,
    );
    this.stopNativeMapLocation();
    this.clearMapContributionConsentCountdown();
    if (copyUrlOwners.has(this)) {
      nativeShareApi().offCopyUrl?.();
      copyUrlOwners.delete(this);
    }
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
    const networkHandler = publicMapNetworkHandlers.get(this);
    if (networkHandler) wx.offNetworkStatusChange?.(networkHandler);
    publicMapNetworkHandlers.delete(this);
    publicMapClients.get(this)?.unsubscribe();
    publicMapClients.delete(this);
    publicMapReportClients.get(this)?.unsubscribe();
    publicMapReportClients.delete(this);
    const mapViewportDebounceTimer = publicMapViewportDebounceTimers.get(this);
    if (mapViewportDebounceTimer) clearTimeout(mapViewportDebounceTimer);
    publicMapViewportDebounceTimers.delete(this);
    const nativeCameraFallbackTimer =
      publicMapNativeCameraFallbackTimers.get(this);
    if (nativeCameraFallbackTimer) clearTimeout(nativeCameraFallbackTimer);
    publicMapNativeCameraFallbackTimers.delete(this);
    const nativeLeadCameraAnimation =
      publicMapNativeLeadCameraAnimations.get(this);
    if (nativeLeadCameraAnimation?.timer)
      clearTimeout(nativeLeadCameraAnimation.timer);
    publicMapNativeLeadCameraAnimations.delete(this);
    publicMapNativeLeadCameraAnimationGenerations.delete(this);
    const nativeTransitionTimer = publicMapNativeTransitionTimers.get(this);
    if (nativeTransitionTimer) clearTimeout(nativeTransitionTimer);
    publicMapNativeTransitionTimers.delete(this);
    publicMapNativePendingClusters.delete(this);
    publicMapNativeContexts.delete(this);
    publicMapNativeCameraScales.delete(this);
    publicMapStableMarkerPresentations.delete(this);
    publicMapNativeViewports.delete(this);
    publicMapNativeProjections.delete(this);
    publicMapNativeCommittedProjections.delete(this);
    publicMapMarkerCanvasRenderers.delete(this);
    publicMapClusterPickerRenderTokens.delete(this);
    publicMapClusterPickerMetadataLoaders.get(this)?.cancel();
    publicMapClusterPickerMetadataLoaders.delete(this);
    publicMapMarkerProjectionResolvers.get(this)?.cancel();
    publicMapMarkerProjectionResolvers.delete(this);
    publicMapMarkerZoomThrottles.get(this)?.cancel();
    publicMapMarkerZoomThrottles.delete(this);
    publicMapMarkerImageCaches.get(this)?.clear();
    publicMapMarkerImageCaches.delete(this);
    publicMapMarkerRenderGenerations.delete(this);
    publicMapNativeCameraSnapshots.delete(this);
    publicMapNativeSpiderfyClusters.delete(this);
    publicMapNativeTransitionGenerations.delete(this);
    const nativeScalePollTimer = publicMapNativeScalePollTimers.get(this);
    if (nativeScalePollTimer) clearTimeout(nativeScalePollTimer);
    publicMapNativeScalePollTimers.delete(this);
    publicMapNativeScalePollGenerations.delete(this);
    publicMapNativeRegionGenerations.delete(this);
    publicMapNativeGestureSessions.delete(this);
    publicMapNativeActiveRegions.delete(this);
    publicMapNativeReconcileSessions.delete(this);
    publicMapNativeCommitInFlight.delete(this);
    publicMapNativePendingCommits.delete(this);
    const topologyBarrier = publicMapNativeTopologyBarriers.get(this);
    if (topologyBarrier?.timer) clearTimeout(topologyBarrier.timer);
    publicMapNativeTopologyBarriers.delete(this);
    publicMapNativeZoomDiagnostics.delete(this);
    publicMapNativeTapGuardUntil.delete(this);
    publicMapNativeLastMarkerTaps.delete(this);
    publicMapNativeMarkerTapSuppressedUntil.delete(this);
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
        storageMeterFillStyle: createStorageMeterFillStyle(storagePercent),
        storageCapacityState: getCapacityState(info),
      });
    } catch {
      this.setData({
        storagePercent: 0,
        storageMeterFillStyle: createStorageMeterFillStyle(0),
        storageCapacityState: "unknown",
      });
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
      pendingDirectUploads: toDraftViewModels(
        drafts.filter(
          (draft) =>
            draft.recordType === "board-upload" &&
            draft.uploadStatus !== "uploaded" &&
            !(this.data.cloudRecords as readonly CloudRecordViewModel[]).some(
              (record) => record.boardId === draft.boardId,
            ),
        ),
        this.data.pendingDirectUploads as readonly DraftViewModel[],
      ),
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
        quotaLimit: account.quota.limit,
        quotaUsed: account.quota.used,
        quotaReserved: account.quota.reserved,
        quotaRemaining: account.quota.remaining,
        quotaUsedPercent: quotaUsedPercent(account.quota),
        quotaResetAt: account.quota.resetAt,
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

  applyCloudQuota(quota: CloudQuotaSummary) {
    getApp<IchiApp>().globalData.accountQuota = quota;
    this.setData({
      quotaLimit: quota.limit,
      quotaUsed: quota.used,
      quotaReserved: quota.reserved,
      quotaRemaining: quota.remaining,
      quotaUsedPercent: quotaUsedPercent(quota),
      quotaResetAt: quota.resetAt,
    });
  },

  async refreshRecognitionQuota(showFailure = false) {
    try {
      const quota = await refreshCloudQuota(getWxCloudFunctionApi());
      this.applyCloudQuota(quota);
      return quota;
    } catch {
      this.setData({
        accountState: "unavailable" as const,
        ...(showFailure ? { modalView: "account-unavailable" as const } : {}),
      });
      return null;
    }
  },

  onProfileNicknameInput(event: WechatMiniprogram.Input) {
    const profileNicknameDraft = String(event.detail.value ?? "");
    this.setData({
      profileNicknameDraft,
      profileAuthorizationReady: isProfileAuthorizationReady(
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
      modalView: "profile-edit" as const,
      profileNicknameDraft: String(this.data.accountNickname || "ICHI 玩家"),
      profileOriginalNickname: String(this.data.accountNickname || "ICHI 玩家"),
      profileAvatarPath: "",
      profileAuthorizationReady: false,
    });
  },

  onCloseWechatProfileAuthorization() {
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
      nickname,
      avatarPath,
      this.data.profileOriginalNickname,
    );
    if (!authorizationReady) {
      wx.showToast({
        title: "请先更改头像或昵称",
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
        profileNicknameDraft: "",
        profileOriginalNickname: "",
        profileAvatarPath: "",
        profileAuthorizationReady: false,
        modalView: "" as const,
      });
      wx.showToast({
        title: "个人资料已更新",
        icon: "success",
      });
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
      await candidateUploadService.flushSharedUploads();
      const result = await loadMyCloudRecords(getWxCloudFunctionApi());
      const currentCloudRecords = this.data
        .cloudRecords as readonly CloudRecordViewModel[];
      const seenBoards = new Set<string>();
      const currentOnly = result.records.filter((record) => {
        if (seenBoards.has(record.boardId)) return false;
        seenBoards.add(record.boardId);
        return true;
      });
      const records = currentOnly.map((record) => ({
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
          cloudClues: records,
          cloudRecordsState: "ready" as const,
        });
        this.refreshDrafts();
      }
      await this.resumePendingCloudPublicationDeletions(records);
    } catch {
      if (!isNativeCameraSurfaceActive(this.data)) {
        this.setData({ cloudRecordsState: "unavailable" as const });
      }
    } finally {
      // Covers cloud-only verification retries, replacement evidence and note
      // review. Reading history never creates a new upload-sharing intent.
      void candidateUploadService.flushSharedUploads();
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

  async refreshCandidateUploads() {
    const uploads = await candidateUploadService.listMyUploads();
    const current = this.data
      .candidateUploads as readonly CandidateUploadViewModel[];
    this.setData({
      candidateUploads: uploads
        .filter((row) => row.lifecycle === "ACTIVE")
        .map((row) => ({
          ...row,
          swipeX:
            current.find(
              (item) => item.candidateRecordRef === row.candidateRecordRef,
            )?.swipeX ?? 0,
          ...(deletingCandidateRecordRefs.has(row.candidateRecordRef)
            ? { isDeleting: true }
            : {}),
        })),
    });
  },

  async refreshMapContributionConsent() {
    this.setData({ mapContributionConsentPhase: "LOADING" as const });
    const consent = await candidateUploadService.getMapContributionConsent();
    this.setData({
      mapContributionConsent: consent,
      mapContributionConsentPhase: consent
        ? ("READY" as const)
        : ("UNAVAILABLE" as const),
    });
    if (
      consent?.accepted &&
      this.data.modalView === "map-contribution-consent"
    ) {
      this.clearMapContributionConsentCountdown();
      this.setData({ modalView: "" as const });
    }
  },

  clearMapContributionConsentCountdown() {
    const countdown = mapContributionConsentCountdowns.get(this);
    if (countdown?.timer) clearTimeout(countdown.timer);
    mapContributionConsentCountdowns.delete(this);
    this.setData({ mapContributionConsentSeconds: 0 });
  },

  startMapContributionConsentCountdown() {
    this.clearMapContributionConsentCountdown();
    const countdown = { deadline: Date.now() + 3_000 } as {
      readonly deadline: number;
      timer?: ReturnType<typeof setTimeout>;
    };
    mapContributionConsentCountdowns.set(this, countdown);
    const updateConsentCountdown = () => {
      if (mapContributionConsentCountdowns.get(this) !== countdown) return;
      if (this.data.modalView !== "map-contribution-consent") {
        this.clearMapContributionConsentCountdown();
        return;
      }
      const seconds = Math.max(
        0,
        Math.ceil((countdown.deadline - Date.now()) / 1_000),
      );
      this.setData({ mapContributionConsentSeconds: seconds });
      if (seconds > 0)
        countdown.timer = setTimeout(updateConsentCountdown, 1_000);
    };
    updateConsentCountdown();
  },

  onHide() {
    publicMapDetailPreparationSuspended.add(this);
    publicMapClients.get(this)?.client.invalidatePreparedDetails();
    publicMapClients.get(this)?.client.clearSelection();
    publicMapOverlayTouches.delete(this);
    publicMapPrefetchGenerations.set(
      this,
      (publicMapPrefetchGenerations.get(this) ?? 0) + 1,
    );
    this.stopNativeMapLocation();
    if (this.data.mapClusterPickerOpen) this.dismissNativeMapSelection();
    this.clearMapContributionConsentCountdown();
    if (this.data.modalView === "map-contribution-consent") {
      this.setData({
        modalView: "" as const,
      });
    }
  },

  onOpenMapContributionConsent() {
    if (
      !this.data.mapContributionConsent ||
      this.data.mapContributionConsent.accepted ||
      this.data.mapContributionConsentBusy
    )
      return;
    this.setData({
      modalView: "map-contribution-consent" as const,
      mapContributionConsentError: "",
      mapContributionTermsScrollTop: 0,
    });
    this.startMapContributionConsentCountdown();
  },

  async onChooseMapContributionConsent() {
    const countdown = mapContributionConsentCountdowns.get(this);
    if (
      this.data.mapContributionConsentBusy ||
      this.data.modalView !== "map-contribution-consent" ||
      !countdown ||
      Date.now() < countdown.deadline
    )
      return;
    const current = this.data
      .mapContributionConsent as MapContributionConsentView | null;
    if (!current) {
      this.setData({
        mapContributionConsentError: "当前条例暂不可用，请稍后重试。",
      });
      return;
    }
    if (current.accepted) return;
    this.setData({
      mapContributionConsentBusy: true,
      mapContributionConsentError: "",
    });
    try {
      const commandId = `consent-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      const saved = await candidateUploadService.acceptMapContributionTerms(
        current,
        commandId,
      );
      if (!saved) throw new Error("CONSENT_WRITE_FAILED");
      await this.refreshMapContributionConsent();
      this.clearMapContributionConsentCountdown();
      this.setData({ modalView: "" as const });
      void candidateUploadService.flushSharedUploads();
    } catch {
      this.setData({ mapContributionConsentError: "选择未保存，请稍后重试。" });
    } finally {
      this.setData({ mapContributionConsentBusy: false });
    }
  },

  async submitCandidateSyntheticUploadForRehearsal(_input: {
    readonly fixtureId: string;
    readonly shareDecision: "SHARE" | "DO_NOT_SHARE";
    readonly idempotencyKey: string;
  }) {
    void _input;
    // Production never creates shadow fixture records.
    return null;
  },

  async syncSubmittedUploadSharing(recordId: string) {
    await candidateUploadService.flushSharedUploads();
    if (
      this.data.modalView !== "board-upload-submitted" ||
      this.data.submittedMapRecordId !== recordId
    )
      return;
    this.setData({
      mapUploadSharingMessage: candidateUploadService.sharedUploadAcknowledged(
        recordId,
      )
        ? "本条记录已上传。同意地图贡献条例后，符合公开条件的记录会自动转化为地图数据并显示。回首页后可继续上传新的版面。"
        : "本条记录已上传，分享确认正在同步。同意条例后，记录会自动转化至地图，无需再次分享。",
    });
  },

  onDeleteCandidateUpload(event: WechatMiniprogram.BaseEvent) {
    const candidateRecordRef = String(
      event.currentTarget.dataset.candidateRecordRef || "",
    );
    if (
      !/^candidate:[a-f0-9]{40}$/u.test(candidateRecordRef) ||
      deletingCandidateRecordRefs.has(candidateRecordRef)
    )
      return;
    this.setDraftSwipe("", 0);
    this.setData({
      pendingDeleteUploadedRecordId: "",
      pendingDeleteUploadedBoardId: "",
      pendingDeleteCandidateRecordRef: candidateRecordRef,
      modalView: "delete-uploaded-board" as const,
    });
  },

  onCancelDeleteUploadedBoard() {
    this.setData({
      pendingDeleteUploadedRecordId: "",
      pendingDeleteUploadedBoardId: "",
      pendingDeleteCandidateRecordRef: "",
      modalView: "" as const,
    });
  },

  async onConfirmDeleteUploadedBoard() {
    const candidateRecordRef = String(
      this.data.pendingDeleteCandidateRecordRef || "",
    );
    if (candidateRecordRef) {
      if (deletingCandidateRecordRefs.has(candidateRecordRef)) return;
      deletingCandidateRecordRefs.add(candidateRecordRef);
      this.setCandidateRecordDeleting(candidateRecordRef, true);
      this.onCancelDeleteUploadedBoard();
      try {
        const deleted = await candidateUploadService.deleteMyUpload(
          candidateRecordRef,
          `delete:${candidateRecordRef}`,
        );
        if (!deleted) throw new Error("CANDIDATE_DELETE_FAILED");
        deletingCandidateRecordRefs.delete(candidateRecordRef);
        this.ensureHumanAssistanceClient().invalidateRecord(candidateRecordRef);
        this.syncHumanAssistanceUi();
        await this.refreshCandidateUploads();
        wx.showToast({ title: "记录已删除", icon: "none" });
      } catch {
        deletingCandidateRecordRefs.delete(candidateRecordRef);
        this.setCandidateRecordDeleting(candidateRecordRef, false);
        wx.showToast({ title: "删除失败，请重试", icon: "none" });
      }
      return;
    }
    const recordId = String(this.data.pendingDeleteUploadedRecordId || "");
    const boardId = String(this.data.pendingDeleteUploadedBoardId || "");
    if (!recordId || deletingUploadedRecordIds.has(recordId)) return;
    deletingUploadedRecordIds.add(recordId);
    this.setUploadedRecordDeleting(recordId, true);
    this.onCancelDeleteUploadedBoard();
    try {
      const local = draftRepository
        .readAll()
        .find(
          (draft) =>
            draft.boardId === boardId && draft.cloudRecordId === recordId,
        );
      if (local)
        draftRepository.upsert({
          ...local,
          pendingCloudDeletion: { recordId, requestedAt: Date.now() },
        });
      await requestCloudRecordDeletion(getWxCloudFunctionApi(), {
        recordId,
        ...(boardId ? { boardId } : {}),
      });
      if (boardId) draftRepository.delete(boardId);
      deletingUploadedRecordIds.delete(recordId);
      this.ensureHumanAssistanceClient().invalidateRecord(recordId);
      this.syncHumanAssistanceUi();
      this.refreshDrafts(null);
      await this.refreshCloudRecords();
      wx.showToast({ title: "记录已删除", icon: "none" });
    } catch {
      deletingUploadedRecordIds.delete(recordId);
      this.setUploadedRecordDeleting(recordId, false);
      wx.showToast({ title: "删除失败，请重试", icon: "none" });
    }
  },

  async resumePendingCloudPublicationDeletions(
    records: readonly CloudRecordViewModel[],
  ) {
    const visible = new Set(records.map((record) => record.recordId));
    for (const draft of draftRepository.readAll()) {
      const pending = draft.pendingCloudDeletion;
      if (!pending || visible.has(pending.recordId)) continue;
      try {
        await requestCloudRecordDeletion(getWxCloudFunctionApi(), {
          recordId: pending.recordId,
          boardId: draft.boardId,
        });
        draftRepository.delete(draft.boardId);
        deletingUploadedRecordIds.delete(pending.recordId);
      } catch {
        // Only an explicit accepted/idempotent deletion receipt may remove B1.
      }
    }
    this.refreshDrafts();
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

  setCandidateRecordDeleting(candidateRecordRef: string, isDeleting: boolean) {
    this.setData({
      candidateUploads: (
        this.data.candidateUploads as readonly CandidateUploadViewModel[]
      ).map((record) =>
        record.candidateRecordRef === candidateRecordRef
          ? { ...record, isDeleting, swipeX: 0 }
          : record,
      ),
    });
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
    if (
      this.data.accountState === "ready" &&
      Number(this.data.quotaRemaining) <= 0
    ) {
      this.setData({
        pendingRecognitionMode: recognitionMode,
        modalView: "quota-exhausted" as const,
      });
      return;
    }
    cameraTiming = { tapAt: Date.now() };
    markCameraTiming("tapAt");
    this.setData({
      pendingRecognitionMode: recognitionMode,
      recognitionGateBusy: true,
    });
    this.releasePendingBoardMedia();
    try {
      const accountReady = this.data.accountState === "ready";
      const account = accountReady
        ? null
        : await this.refreshCloudAccount(true);
      const quota = accountReady
        ? await this.refreshRecognitionQuota(true)
        : account?.quota;
      if (!quota) return;
      if (quota.remaining <= 0) {
        this.setData({
          modalView: "quota-exhausted" as const,
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
    void this.refreshRecognitionQuota();
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
        // Returning from the location permission sheet must not start a second
        // submission while the original direct upload is still running.
        if (
          draft.pendingFinalization.sourcePath === "direct-upload" &&
          this.data.generationState === "generating" &&
          getApp<IchiApp>().globalData.pendingRecognitionJobId ===
            draft.pendingFinalization.recognitionJobId
        )
          continue;
        void this.finalizePersistedDraft(draft);
      }
    }
  },

  async finalizePersistedDraft(draft: LocalDrawDraft) {
    const pending = draft.pendingFinalization;
    if (
      !pending ||
      finalizationInFlight.has(pending.recognitionJobId) ||
      (pending.sourcePath === "direct-upload" &&
        draft.verificationStatus === "note-failed")
    )
      return;
    finalizationInFlight.add(pending.recognitionJobId);
    const startedAt = Date.now();
    let retryJobToken: string | undefined;
    try {
      if (
        pending.sourcePath === "direct-upload" &&
        pending.recognitionIdempotencyKey
      ) {
        const reservation = await reserveCloudRecognition(
          getWxCloudFunctionApi(),
          {
            idempotencyKey: pending.recognitionIdempotencyKey,
            sourcePath: "direct-upload",
          },
        );
        if (
          reservation.jobId !== pending.recognitionJobId ||
          !["recognized", "succeeded", "committed"].includes(reservation.status)
        )
          throw new Error("RECOGNITION_JOB_NOT_RESUMABLE");
        retryJobToken = reservation.jobToken;
      }
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
          ...(pending.sourcePath === "direct-upload"
            ? {
                uploadSharing: {
                  disclosureVersion: UPLOAD_SHARING_DISCLOSURE_VERSION,
                  rightsAttested: true as const,
                },
              }
            : {}),
        },
      );
      const latest = draftRepository
        .readAll()
        .find((item) => item.boardId === draft.boardId);
      if (
        !latest?.pendingFinalization ||
        latest.pendingFinalization.recognitionJobId !==
          pending.recognitionJobId ||
        latest.pendingFinalization.locationNote !== pending.locationNote
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
              submissionState: "uploaded" as const,
              verificationStatus: "verified" as const,
            }
          : {}),
      };
      draftRepository.upsert(committedDraft);
      if (pending.sourcePath === "direct-upload") {
        if (observation.uploadSharingAcknowledged)
          candidateUploadService.acknowledgeServerUpload(observation.recordId);
        else if (
          candidateUploadService.rememberSharedUpload(observation.recordId)
        )
          void candidateUploadService.flushSharedUploads();
      }
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
    } catch (error) {
      if (pending.sourcePath === "direct-upload") {
        const latest = draftRepository
          .readAll()
          .find((item) => item.boardId === draft.boardId);
        if (
          latest?.pendingFinalization &&
          latest.pendingFinalization.locationNote === pending.locationNote
        ) {
          draftRepository.upsert({
            ...latest,
            uploadStatus: "not-uploaded",
            submissionState: "local",
            verificationStatus:
              error instanceof CloudAccountError &&
              error.code === "LOCATION_NOTE_REVIEW_FAILED"
                ? "note-failed"
                : "provider-failed",
            savedAt: Date.now(),
          });
          this.refreshDrafts();
        }
        if (retryJobToken)
          await this.releasePendingRecognitionQuota(
            pending.recognitionJobId,
            retryJobToken,
          );
      }
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
      ...(recognitionJobId
        ? {
            pendingFinalization: {
              recognitionJobId,
              sourcePath:
                snapshot.mode === "direct-upload"
                  ? ("direct-upload" as const)
                  : ("assisted-draw" as const),
              ...(snapshot.mode === "direct-upload" &&
              globalData.pendingRecognitionIdempotencyKey
                ? {
                    recognitionIdempotencyKey:
                      globalData.pendingRecognitionIdempotencyKey,
                  }
                : {}),
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
    if (!recognitionJobId) {
      await this.failGeneration(
        generationId,
        "上传暂不可用，请重新导入版面后重试",
      );
      return;
    }
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
        const latestDraft = draftRepository
          .readAll()
          .find((item) => item.boardId === boardId);
        if (latestDraft?.pendingFinalization) {
          draftRepository.upsert({
            ...latestDraft,
            pendingFinalization: {
              ...latestDraft.pendingFinalization,
              location: {
                latitude: boardLocation.latitude,
                longitude: boardLocation.longitude,
                accuracy: boardLocation.accuracy,
                source: "camera",
                capturedAt: new Date(boardLocation.obtainedAt).toISOString(),
                consentVersion: LOCATION_CONSENT_VERSION,
              },
            },
          });
        }
        finalizationInFlight.add(recognitionJobId);
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
            uploadSharing: {
              disclosureVersion: UPLOAD_SHARING_DISCLOSURE_VERSION,
              rightsAttested: true,
            },
          },
        );
      } catch (error) {
        const latestDraft = draftRepository
          .readAll()
          .find((item) => item.boardId === boardId);
        if (latestDraft?.pendingFinalization) {
          draftRepository.upsert({
            ...latestDraft,
            verificationStatus:
              error instanceof CloudAccountError &&
              error.code === "LOCATION_NOTE_REVIEW_FAILED"
                ? "note-failed"
                : "provider-failed",
            uploadStatus: "not-uploaded",
            submissionState: "local",
          });
          this.refreshDrafts(null);
        }
        await this.failGeneration(
          generationId,
          error instanceof CloudAccountError &&
            error.code === "LOCATION_NOTE_REVIEW_FAILED"
            ? "备注未通过安全检查，请修改后重新上传"
            : "版面生成失败，请重试",
          recognitionJobId,
          globalData.pendingRecognitionJobToken,
        );
        this.setData({
          activeTab: "my" as const,
          currentView: "contributions" as const,
          modalView: "" as const,
        });
        return;
      } finally {
        finalizationInFlight.delete(recognitionJobId);
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
            submissionState: "uploaded" as const,
          }
        : {}),
    };
    delete (
      committedDraft as {
        pendingFinalization?: LocalDrawDraft["pendingFinalization"];
      }
    ).pendingFinalization;
    if (snapshot.mode === "direct-upload") {
      // The original upload confirmation already happened. Persist its intent
      // before local display/cache writes so their failure cannot lose it.
      if (cloudObservation?.recordId) {
        if (cloudObservation.uploadSharingAcknowledged) {
          candidateUploadService.acknowledgeServerUpload(
            cloudObservation.recordId,
          );
        } else if (
          candidateUploadService.rememberSharedUpload(cloudObservation.recordId)
        )
          void candidateUploadService.flushSharedUploads();
        else
          wx.showToast({ title: "记录已上传，分享授权待保存", icon: "none" });
      }
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
        submittedMapRecordId: cloudObservation?.recordId ?? "",
        mapUploadSharingMessage: "正在确认本次上传和分享授权。",
      });
      if (cloudObservation?.recordId)
        void this.syncSubmittedUploadSharing(cloudObservation.recordId);
      if (cloudObservation?.recordId)
        void this.refreshHumanAssistance(cloudObservation.recordId, 1);
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
      ticketPeelStyle: createTicketPeelStyle(0),
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
      const progress = frames[frameIndex] ?? target;
      this.setData({
        ticketPeelProgress: progress,
        ticketPeelStyle: createTicketPeelStyle(progress),
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
      ticketPeelStyle: createTicketPeelStyle(0),
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
    this.setData({
      ticketPeelProgress: progress,
      ticketPeelStyle: createTicketPeelStyle(progress),
    });
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
        shareImagePath: "",
        shareNote: "",
        shareReady: false,
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
    if (!draft) return;
    const capturedAt = Date.now();
    let ticketLocation: {
      latitude: number;
      longitude: number;
      accuracy: number;
      source: "camera";
      capturedAt: string;
      consentVersion: string;
    };
    this.setData({ evidenceSubmitting: true });
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
      this.setData({ evidenceSubmitting: false });
      wx.showToast({ title: "无法获取赏票拍摄位置", icon: "none" });
      return;
    }
    let uploadDraft = draft;
    try {
      const observation = await prepareCloudObservationForUpload(
        getWxCloudFunctionApi(),
        {
          ...(draft.cloudRecordId
            ? { currentRecordId: draft.cloudRecordId }
            : {}),
          ...(draft.recognitionJobId
            ? { recognitionJobId: draft.recognitionJobId }
            : {}),
          boardId: draft.boardId,
          confirmedSnapshot: toInitialCloudSnapshot(draft),
          location: ticketLocation,
          observedAt: ticketLocation.capturedAt,
          promptVersion: BOARD_PROMPT_VERSION,
          consentVersion: PRIVATE_OBSERVATION_CONSENT_VERSION,
          disclosureVersion: NO_IMAGE_DISCLOSURE_VERSION,
          uploadSharing: {
            disclosureVersion: UPLOAD_SHARING_DISCLOSURE_VERSION,
            rightsAttested: true,
          },
        },
      );
      if (observation.uploadSharingAcknowledged)
        candidateUploadService.acknowledgeServerUpload(observation.recordId);
      const changedObservation = observation.recordId !== draft.cloudRecordId;
      if (changedObservation) {
        const stableDraft = { ...draft };
        delete stableDraft.evidenceSubmissionVersion;
        delete stableDraft.currentVerificationVersion;
        delete stableDraft.verificationPending;
        delete stableDraft.originalEvidenceFileId;
        delete stableDraft.originalEvidenceCapturedAt;
        delete stableDraft.albumSaveWarning;
        uploadDraft = {
          ...stableDraft,
          cloudRecordId: observation.recordId,
          recordCode: observation.recordCode,
          uploadStatus: "not-uploaded",
          submissionState: "local",
          verificationStatus: "unverified",
        };
        draftRepository.upsert(uploadDraft);
        this.refreshDrafts(uploadDraft.boardId);
      }
    } catch {
      this.setData({ evidenceSubmitting: false });
      wx.showToast({ title: "无法建立新的上传记录，请重试", icon: "none" });
      return;
    }
    const recordId = uploadDraft.cloudRecordId;
    if (!recordId) {
      this.setData({ evidenceSubmitting: false });
      wx.showToast({ title: "这条旧记录尚未建立云端身份", icon: "none" });
      return;
    }
    // This existing upload confirmation is the per-record sharing authorization.
    // Persist before sending evidence; the server still requires APPROVED facts.
    if (!candidateUploadService.rememberSharedUpload(recordId)) {
      this.setData({ evidenceSubmitting: false });
      wx.showToast({ title: "无法保存本次分享授权，请重试", icon: "none" });
      return;
    }
    const submissionVersion = (uploadDraft.evidenceSubmissionVersion ?? 0) + 1;
    const submissionStartedAt = Date.now();
    console.info("ICHI_PRIZE_TICKET_CLIENT", {
      stage: "confirm_tap",
      recordId,
      boardId: uploadDraft.boardId,
      submissionVersion,
      elapsedMs: 0,
    });
    const api = getWxDrawTicketEvidenceApi();
    let uploaded: PendingDrawTicketEvidence | undefined;
    let pendingEstablished = false;
    let pendingStatus = "";
    try {
      uploaded = await uploadDrawTicketEvidence(api, {
        recordId,
        boardId: uploadDraft.boardId,
        submissionVersion,
        imagePath: String(this.data.shareImagePath),
        captureSource: "camera",
        capturedAt,
      });
      const pending = await createPendingDrawTicketVerification(api, uploaded, {
        drawEvents: uploadDraft.history,
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
      void candidateUploadService.flushSharedUploads();
      console.info("ICHI_PRIZE_TICKET_CLIENT", {
        stage: "pending_persisted",
        recordId,
        boardId: uploadDraft.boardId,
        submissionVersion,
        elapsedMs: Date.now() - submissionStartedAt,
      });
      const pendingDraft: LocalDrawDraft = {
        ...uploadDraft,
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
        recordId,
        boardId: uploadDraft.boardId,
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
            recordId,
            boardId: uploadDraft.boardId,
            submissionVersion,
            elapsedMs: Date.now() - submissionStartedAt,
          }),
      );
      this.refreshDrafts();
      void this.refreshCloudRecords();
      void this.refreshHumanAssistance(recordId, submissionVersion);
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
        recordId,
        boardId: uploadDraft.boardId,
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
      this.refreshDrafts();
      void this.refreshCloudRecords();
      if (verificationStatus === "verified")
        void candidateUploadService.flushSharedUploads();
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
    if (draft?.pendingFinalization?.sourcePath === "direct-upload") {
      const pendingDraft = {
        ...draft,
        verificationStatus: "note-pending" as const,
      };
      draftRepository.upsert(pendingDraft);
      this.refreshDrafts(null);
      void this.finalizePersistedDraft(pendingDraft);
      return;
    }
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
        this.refreshDrafts();
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
    if (draft?.pendingFinalization?.sourcePath === "direct-upload") {
      this.setData({
        modalView: "note-review" as const,
        noteReviewSourcePath: "direct-upload" as const,
        noteReviewRecordId: "",
        noteReviewBoardId: boardId,
        noteReviewSubmissionVersion: 0,
        shareNote: draft.locationNote ?? "",
      });
      return;
    }
    const cloudRecord = (
      this.data.cloudRecords as readonly CloudRecordViewModel[]
    ).find((item) => item.boardId === boardId);
    const recordId = draft?.cloudRecordId ?? cloudRecord?.recordId;
    const submissionVersion =
      draft?.evidenceSubmissionVersion ?? cloudRecord?.submissionVersion;
    if (!recordId || !submissionVersion) return;
    this.setData({
      modalView: "note-review" as const,
      noteReviewSourcePath: "assisted-draw" as const,
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
    const originalDraft = draftRepository
      .readAll()
      .find((item) => item.boardId === boardId);
    if (this.data.noteReviewSourcePath === "direct-upload") {
      if (
        userNote.length > 300 ||
        originalDraft?.pendingFinalization?.sourcePath !== "direct-upload"
      )
        return;
      const edited = {
        ...originalDraft,
        locationNote: userNote,
        pendingFinalization: {
          ...originalDraft.pendingFinalization,
          locationNote: userNote,
        },
        verificationStatus: "note-pending" as const,
        uploadStatus: "not-uploaded" as const,
        submissionState: "local" as const,
        savedAt: Date.now(),
      };
      draftRepository.upsert(edited);
      this.setData({
        activeTab: "my" as const,
        currentView: "contributions" as const,
        evidenceSubmitting: true,
        modalView: "" as const,
      });
      this.refreshDrafts(null);
      try {
        await this.finalizePersistedDraft(edited);
      } finally {
        this.setData({ evidenceSubmitting: false });
      }
      return;
    }
    if (originalDraft)
      draftRepository.upsert({
        ...originalDraft,
        locationNote: userNote,
        verificationStatus: "note-pending",
        submissionState: "pending-review",
        savedAt: Date.now(),
      });
    this.setData({
      activeTab: "my" as const,
      currentView: "contributions" as const,
      evidenceSubmitting: true,
      modalView: "" as const,
    });
    this.refreshDrafts(null);
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
      this.refreshDrafts();
      await this.refreshCloudRecords();
    } catch {
      const draft = draftRepository
        .readAll()
        .find((item) => item.boardId === boardId);
      if (draft)
        draftRepository.upsert({
          ...draft,
          verificationStatus: "provider-failed",
          submissionState: "pending-review",
          savedAt: Date.now(),
        });
      this.refreshDrafts();
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
    if (
      this.data.mapContributionConsentBusy &&
      this.data.modalView === "map-contribution-consent"
    )
      return;
    this.clearMapContributionConsentCountdown();
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

  refreshPublicMapOnEntry() {
    const client = this.ensurePublicMapClient();
    const cachedAt = client.state.cacheUpdatedAtMs;
    if (
      cachedAt !== null &&
      Date.now() - cachedAt >= PUBLIC_MAP_CACHE_TTL_MS &&
      ["LOADED", "EMPTY", "STALE_CACHE"].includes(client.state.phase)
    )
      void client.refresh();
    this.prepareVisibleMapDetails();
    return client;
  },

  prepareVisibleMapDetails() {
    const client = publicMapClients.get(this)?.client;
    if (
      !client ||
      this.data.currentView !== "map-preview" ||
      publicMapDetailPreparationSuspended.has(this) ||
      client.state.detail.selectedPublicLeadId !== null ||
      client.state.phase !== "LOADED"
    )
      return;
    void client.prefetchVisibleDetails(
      this.data.mapMarkers.slice(0, 2).map((marker) => marker.publicLeadId),
    );
  },

  ensurePublicMapClient(): PublicMapClient {
    const existing = publicMapClients.get(this);
    if (existing) return existing.client;
    const networkHandler = (status: {
      readonly isConnected?: boolean;
      readonly errMsg?: string;
    }) => {
      this.setData({ mapNetworkOffline: status.isConnected === false });
    };
    publicMapNetworkHandlers.set(this, networkHandler);
    wx.onNetworkStatusChange?.(networkHandler);
    wx.getNetworkType?.({
      success: (status) => {
        if (publicMapNetworkHandlers.has(this))
          this.setData({ mapNetworkOffline: status.networkType === "none" });
      },
    });
    const client = new PublicMapClient({
      service: createWxProductionPublicMapService(),
      initialQuery: createDefaultPublicMapQuery(),
      pageLimit: 50,
    });
    const unsubscribe = client.subscribe((state) => {
      const pageData = toPublicMapPageData(
        state,
        String(this.data.mapSearchText ?? ""),
        (this.data.mapSelectedDiscoveryTagIds ??
          DEFAULT_PUBLIC_DISCOVERY_TAG_IDS) as readonly PublicDiscoveryTagId[],
      );
      const stableMarkers = (
        publicMapStableMarkerPresentations.get(this) ??
        (this.data.mapMarkers as readonly PublicMapMarkerPresentation[])
      ).filter(
        (marker) => !client.isPublicLeadUnavailable(marker.publicLeadId),
      );
      const renderedMarkers = retainStablePublicMapMarkers({
        phase: state.phase,
        incoming: pageData.mapMarkers,
        stable: stableMarkers,
      });
      if (renderedMarkers === pageData.mapMarkers)
        publicMapStableMarkerPresentations.set(this, renderedMarkers);
      const renderedPageData = {
        ...pageData,
        mapMarkers: renderedMarkers,
      };
      const selectedPublicLeadId = renderedPageData.mapSelectedLeadId;
      void this.ensurePublicMapReportClient().select(selectedPublicLeadId);
      const hasSelectedDetail = Boolean(
        selectedPublicLeadId && state.detail.item,
      );
      this.setData({
        ...renderedPageData,
        ...(selectedPublicLeadId || state.detail.phase === "UNAVAILABLE"
          ? {}
          : {
              mapSheetMode: "CLOSED" as const,
              mapCardPhase: "CLOSED" as const,
            }),
        ...(hasSelectedDetail && this.data.mapCardPhase === "OPENING"
          ? { mapCardPhase: "OPEN" as const }
          : {}),
      });
      const gesture = publicMapNativeGestureSessions.get(this);
      if (
        this.data.currentView !== "map-preview" ||
        gesture?.kind === "ZOOM" ||
        gesture?.kind === "PROGRAMMATIC" ||
        publicMapNativeReconcileSessions.has(this)
      )
        return;
      this.prepareVisibleMapDetails();
      this.refreshNativeMapPresentation();
    });
    publicMapClients.set(this, { client, unsubscribe });
    void client.loadInitial();
    return client;
  },

  ensurePublicMapReportClient(): PublicMapReportingClient {
    const existing = publicMapReportClients.get(this);
    if (existing) return existing.client;
    const client = new PublicMapReportingClient(
      createWxReportingService(),
      (id) => {
        publicMapClients
          .get(this)
          ?.client.suppressPublicLead(id, { noResurrection: true });
      },
    );
    const unsubscribe = client.subscribe((state) => {
      this.setData(toPublicMapReportPageData(state));
    });
    publicMapReportClients.set(this, { client, unsubscribe });
    return client;
  },

  commitNativeMapProjection(
    projection: NativeMapMarkerProjection,
    interactionState: PublicMapInteractionState = "IDLE",
    onCommitted?: () => void,
  ) {
    const fallbackProjection = withFallbackNativeMapMarkerBindings(projection);
    const currentBindings = this.data
      .mapNativeMarkers as readonly NativeMapMarkerBinding[];
    if (
      currentBindings.length > 0 &&
      fallbackProjection.bindings.length === 0 &&
      !this.data.mapDiscoveryEmptyReason &&
      isPublicMapRevalidatingPhase(this.data.mapPhase)
    ) {
      traceNativeMapZoom(this, "SET_DATA_SKIPPED", {
        reason: "TRANSIENT_EMPTY_PROJECTION_RETAINED",
        markerCount: (
          this.data.mapMarkers as readonly PublicMapMarkerPresentation[]
        ).length,
        mapNativeMarkerCount: currentBindings.length,
        mapNativeMarkerViewCount: (
          this.data.mapNativeMarkerViews as readonly NativeMapMarkerView[]
        ).length,
        topologyGeneration:
          nativeMapZoomDiagnosticStateFor(this).topologyGeneration,
      });
      return;
    }

    publicMapNativeProjections.set(this, fallbackProjection);
    const generation = (publicMapMarkerRenderGenerations.get(this) ?? 0) + 1;
    publicMapMarkerRenderGenerations.set(this, generation);
    if (!this.data.canvasMarkerReady)
      this.commitResolvedNativeMapProjection(
        fallbackProjection,
        interactionState,
        false,
      );

    let cache = publicMapMarkerImageCaches.get(this);
    if (!cache) {
      cache = new MarkerImageCache();
      publicMapMarkerImageCaches.set(this, cache);
    }
    let renderer = publicMapMarkerCanvasRenderers.get(this);
    if (!renderer) {
      renderer = new MarkerCanvasRenderer(this as never);
      publicMapMarkerCanvasRenderers.set(this, renderer);
    }
    let resolver = publicMapMarkerProjectionResolvers.get(this);
    if (!resolver) {
      resolver = new LatestMarkerProjectionResolver();
      publicMapMarkerProjectionResolvers.set(this, resolver);
    }
    const previousProjection = this.data.canvasMarkerReady
      ? publicMapNativeCommittedProjections.get(this)
      : undefined;
    const renderRequest = {
      projection: fallbackProjection,
      ...(previousProjection ? { previousProjection } : {}),
      cache,
      renderer,
      adaptive: PNG_MARKER_ZOOM_ADAPTIVE_ENABLED,
    };
    void (
      PNG_MARKER_ZOOM_ADAPTIVE_ENABLED
        ? resolver.resolve(renderRequest)
        : resolveCanvasMarkerProjection(renderRequest)
    ).then(
      (canvasProjection) => {
        if (
          !canvasProjection ||
          publicMapMarkerRenderGenerations.get(this) !== generation
        ) {
          return;
        }
        this.commitResolvedNativeMapProjection(
          canvasProjection,
          interactionState,
          true,
          onCommitted,
        );
      },
      (error: unknown) => {
        if (publicMapMarkerRenderGenerations.get(this) !== generation) return;
        console.warn("public_map_canvas_marker_fallback", { error });
        // A transient export failure must not blank already-visible native PNGs.
        if (PNG_MARKER_ZOOM_ADAPTIVE_ENABLED && this.data.canvasMarkerReady)
          return;
        this.commitResolvedNativeMapProjection(
          fallbackProjection,
          interactionState,
          false,
          onCommitted,
        );
      },
    );
  },

  commitResolvedNativeMapProjection(
    projection: NativeMapMarkerProjection,
    interactionState: PublicMapInteractionState = "IDLE",
    canvasMarkerReady?: boolean,
    onCommitted?: () => void,
  ) {
    const currentBindings = this.data
      .mapNativeMarkers as readonly NativeMapMarkerBinding[];

    const bindingsChanged =
      nativeMapBindingSignature(currentBindings) !==
      nativeMapBindingSignature(projection.bindings);
    const shouldBarrierTopology =
      bindingsChanged &&
      currentBindings.length > 0 &&
      projection.bindings.length > 0 &&
      interactionState !== "IDLE";
    let barrier = publicMapNativeTopologyBarriers.get(this);
    if (!barrier) {
      barrier = {
        generation: 0,
        signature: null,
        timer: null,
        pending: null,
      };
      publicMapNativeTopologyBarriers.set(this, barrier);
    }

    if (shouldBarrierTopology) {
      const signature = nativeMapBindingSignature(projection.bindings);
      const topologyChanged = barrier.signature !== signature;
      if (topologyChanged) {
        barrier.generation += 1;
        barrier.signature = signature;
        if (barrier.timer) clearTimeout(barrier.timer);
        barrier.timer = null;
      }
      barrier.pending = {
        projection,
        interactionState,
        ...(canvasMarkerReady === undefined ? {} : { canvasMarkerReady }),
        ...(onCommitted ? { onCommitted } : {}),
      };
      const generation = barrier.generation;
      traceNativeMapZoom(this, "SET_DATA_SKIPPED", {
        reason: "TOPOLOGY_COMMIT_BARRIER",
        markerCount: (
          this.data.mapMarkers as readonly PublicMapMarkerPresentation[]
        ).length,
        mapNativeMarkerCount: projection.bindings.length,
        mapNativeMarkerViewCount: projection.views.length,
        topologyGeneration:
          nativeMapZoomDiagnosticStateFor(this).topologyGeneration,
        topologyBarrierGeneration: generation,
      });
      const committed = publicMapNativeCommittedProjections.get(this);
      if (committed)
        this.flushNativeMapProjectionCommit(committed, interactionState);
      if (!barrier.timer)
        barrier.timer = setTimeout(() => {
          const latest = publicMapNativeTopologyBarriers.get(this);
          if (!latest || latest.generation !== generation || !latest.pending)
            return;
          const pending = latest.pending;
          latest.pending = null;
          latest.timer = null;
          this.flushNativeMapProjectionCommit(
            pending.projection,
            pending.interactionState,
            pending.canvasMarkerReady,
            pending.onCommitted,
          );
        }, NATIVE_MAP_TOPOLOGY_STABILITY_MS);
      return;
    }

    if (barrier.pending) {
      barrier.generation += 1;
      if (barrier.timer) clearTimeout(barrier.timer);
      barrier.timer = null;
      barrier.pending = null;
      barrier.signature = null;
    }
    this.flushNativeMapProjectionCommit(
      projection,
      interactionState,
      canvasMarkerReady,
      onCommitted,
    );
  },

  flushNativeMapProjectionCommit(
    projection: NativeMapMarkerProjection,
    interactionState: PublicMapInteractionState = "IDLE",
    canvasMarkerReady?: boolean,
    onCommitted?: () => void,
  ) {
    publicMapNativePendingCommits.set(this, {
      projection,
      interactionState,
      ...(canvasMarkerReady === undefined ? {} : { canvasMarkerReady }),
      ...(onCommitted ? { onCommitted } : {}),
    });
    if (publicMapNativeCommitInFlight.has(this)) {
      traceNativeMapZoom(this, "SET_DATA_SKIPPED", {
        reason: "COALESCED_AS_LATEST_PENDING",
        markerCount: (
          this.data.mapMarkers as readonly PublicMapMarkerPresentation[]
        ).length,
        mapNativeMarkerCount: projection.bindings.length,
        mapNativeMarkerViewCount: projection.views.length,
        topologyGeneration:
          nativeMapZoomDiagnosticStateFor(this).topologyGeneration,
        transitionGeneration:
          publicMapNativeTransitionGenerations.get(this) ?? 0,
      });
      return;
    }

    const flushLatest = () => {
      const pending = publicMapNativePendingCommits.get(this);
      if (!pending) return;
      publicMapNativePendingCommits.delete(this);
      const currentBindings = this.data
        .mapNativeMarkers as readonly NativeMapMarkerBinding[];
      const currentViews = this.data
        .mapNativeMarkerViews as readonly NativeMapMarkerView[];
      const bindingsChanged =
        nativeMapBindingSignature(currentBindings) !==
        nativeMapBindingSignature(pending.projection.bindings);
      const viewsChanged =
        nativeMapViewSignature(currentViews) !==
        nativeMapViewSignature(pending.projection.views);
      const interactionChanged =
        this.data.mapNativeInteractionState !== pending.interactionState;
      const canvasMarkerReadinessChanged =
        pending.canvasMarkerReady !== undefined &&
        this.data.canvasMarkerReady !== pending.canvasMarkerReady;
      const clusterSelected = Boolean(this.data.mapNativeSelectedClusterKey);
      if (
        !bindingsChanged &&
        !viewsChanged &&
        !interactionChanged &&
        !canvasMarkerReadinessChanged &&
        !clusterSelected
      ) {
        publicMapNativeCommittedProjections.set(this, pending.projection);
        traceNativeMapZoom(this, "SET_DATA_SKIPPED", {
          reason: "NO_CHANGED_FIELDS",
          markerCount: (this.data.mapMarkers as readonly unknown[]).length,
          mapNativeMarkerCount: currentBindings.length,
          mapNativeMarkerViewCount: currentViews.length,
          topologyGeneration:
            nativeMapZoomDiagnosticStateFor(this).topologyGeneration,
          transitionGeneration:
            publicMapNativeTransitionGenerations.get(this) ?? 0,
        });
        pending.onCommitted?.();
        flushLatest();
        return;
      }
      const changedFields = [
        ...(bindingsChanged ? ["mapNativeMarkers"] : []),
        ...(viewsChanged ? ["mapNativeMarkerViews"] : []),
        ...(interactionChanged ? ["mapNativeInteractionState"] : []),
        ...(canvasMarkerReadinessChanged ? ["canvasMarkerReady"] : []),
        ...(clusterSelected ? ["mapNativeSelectedClusterKey"] : []),
      ];
      if (bindingsChanged) {
        const diagnosticState = nativeMapZoomDiagnosticStateFor(this);
        traceNativeMapZoom(this, "NATIVE_BINDING_COMMIT", {
          markerCount: pending.projection.bindings.length,
          changedIds: changedNativeMapBindingIds(
            currentBindings,
            pending.projection.bindings,
          ),
          commitReason: pending.interactionState,
          nativeBindingCommitsInLastSecond: recordNativeMapDiagnosticRate(
            diagnosticState.nativeBindingCommitTimestamps,
          ),
          topologyGeneration: diagnosticState.topologyGeneration,
          transitionGeneration:
            publicMapNativeTransitionGenerations.get(this) ?? 0,
        });
      }
      recordNativeMapSetDataCommit(this, {
        changedFields,
        markerCount: (
          this.data.mapMarkers as readonly PublicMapMarkerPresentation[]
        ).length,
        mapNativeMarkerCount: pending.projection.bindings.length,
        mapNativeMarkerViewCount: pending.projection.views.length,
        markerBindingCommit: bindingsChanged,
      });
      publicMapNativeCommitInFlight.add(this);
      this.setData(
        {
          ...(bindingsChanged
            ? {
                mapNativeMarkers: pending.projection.bindings,
                mapNativeDisplayMarkers: withCurrentMapLocation(
                  pending.projection.bindings,
                  this.data.mapCurrentLocation,
                ),
              }
            : {}),
          ...(viewsChanged
            ? {
                mapNativeMarkerViews: pending.projection.views,
              }
            : {}),
          ...(interactionChanged
            ? { mapNativeInteractionState: pending.interactionState }
            : {}),
          ...(canvasMarkerReadinessChanged
            ? { canvasMarkerReady: pending.canvasMarkerReady }
            : {}),
          ...(clusterSelected ? { mapNativeSelectedClusterKey: "" } : {}),
        },
        () => {
          publicMapNativeCommittedProjections.set(this, pending.projection);
          publicMapNativeCommitInFlight.delete(this);
          pending.onCommitted?.();
          flushLatest();
        },
      );
    };
    flushLatest();
  },

  applyNativeMapProjection(
    projection: NativeMapMarkerProjection,
    _animateTopology = false,
  ): boolean {
    void _animateTopology;
    publicMapNativeTransitionGenerations.set(
      this,
      (publicMapNativeTransitionGenerations.get(this) ?? 0) + 1,
    );
    this.commitNativeMapProjection(projection);
    return false;
  },

  projectNativeMapPresentationAtScale(
    scale: number,
    previous?: NativeMapMarkerProjection,
  ): NativeMapMarkerProjection {
    const camera = nativeMapCameraScaleStateFor(
      this,
      Number(this.data.mapNativeScale) || 12,
    );
    traceNativeMapZoom(this, "PRESENTATION_UPDATE_START", {
      scale,
      targetScale: camera.targetScale,
      observedScale: camera.observedScale,
      settledScale: camera.settledScale,
      clusterCount:
        previous?.views.filter((view) => view.kind === "CLUSTER").length ?? 0,
      markerViewCount: previous?.views.length ?? 0,
      markerCount: (
        this.data.mapMarkers as readonly PublicMapMarkerPresentation[]
      ).length,
      mapPhase: this.data.mapPhase,
      interactionState: this.data.mapNativeInteractionState,
      topologyGeneration:
        nativeMapZoomDiagnosticStateFor(this).topologyGeneration,
      transitionGeneration: publicMapNativeTransitionGenerations.get(this) ?? 0,
    });
    const inputMarkers = this.data
      .mapMarkers as readonly PublicMapMarkerPresentation[];
    const selectedClusterKey = String(
      this.data.mapNativeSelectedClusterKey ?? "",
    );
    const isClusterExpansion =
      Boolean(selectedClusterKey) &&
      (scale > (previous?.scale ?? Number.NEGATIVE_INFINITY) ||
        scale >= PUBLIC_MAP_MAX_SCALE - 0.01);
    const projection = projectNativeMapMarkers({
      ...(PNG_MARKER_ZOOM_ADAPTIVE_ENABLED
        ? {
            detailLevel: markerDetailLevel(
              scale,
              previous?.views[0]
                ? markerLevelForRightWidth(previous.views[0].rightWidth)
                : undefined,
            ),
          }
        : {}),
      markers: inputMarkers,
      ...(previous && !isClusterExpansion
        ? { previousTopology: previous.topology }
        : {}),
      scale,
      selectedPublicLeadId: String(this.data.mapSelectedLeadId ?? ""),
      selectedClusterKey,
      spiderfyClusterKey: publicMapNativeSpiderfyClusters.get(this) ?? "",
    });
    recordNativeMapMarkerViews(this, projection, inputMarkers.length);
    return projection;
  },

  cancelNativeMapDeferredReconcile(reason: string): boolean {
    const session = publicMapNativeReconcileSessions.get(this);
    if (!session) return false;
    const timer = publicMapNativeTransitionTimers.get(this);
    if (timer) clearTimeout(timer);
    publicMapNativeTransitionTimers.delete(this);
    publicMapNativePendingCommits.delete(this);
    publicMapNativeReconcileSessions.delete(this);
    publicMapNativeTransitionGenerations.set(
      this,
      (publicMapNativeTransitionGenerations.get(this) ?? 0) + 1,
    );
    const fallbackScale = Number(this.data.mapNativeScale) || 12;
    const committedScale =
      publicMapNativeCommittedProjections.get(this)?.scale ??
      nativeMapCameraScaleStateFor(this, fallbackScale).presentationScale;
    const committedProjection = publicMapNativeCommittedProjections.get(this);
    if (committedProjection)
      publicMapNativeProjections.set(this, committedProjection);
    const camera = cancelNativeMapReconcileScale(
      this,
      fallbackScale,
      committedScale,
    );
    traceNativeMapZoom(this, "RECONCILE_CANCELLED", {
      reason,
      observedScale: camera.observedScale,
      presentationScale: camera.presentationScale,
      targetPresentationScale: camera.targetPresentationScale,
      visualCommitCount: session.visualCommitCount,
      reconcileCancelled: true,
    });
    return true;
  },

  observeNativeMapCameraScale(
    scale: number,
    settle = false,
    source: NativeMapCameraScaleSource = "GET_SCALE_SAMPLE",
  ): boolean {
    if (!Number.isFinite(scale) || scale <= 0) return false;
    const fallbackScale = Number(this.data.mapNativeScale) || 12;
    const previousCamera = nativeMapCameraScaleStateFor(this, fallbackScale);
    const previousObservedScale = resolveNativeMapObservedScale(previousCamera);
    const camera = settle
      ? settleNativeMapScale(this, fallbackScale, scale)
      : setNativeMapObservedScale(this, fallbackScale, { scale, source });
    const threshold = 0.005;
    const observedScale = resolveNativeMapObservedScale(camera);
    const scaleChangedByThreshold =
      Math.abs(observedScale - previousObservedScale) >= threshold;
    if (source !== "GET_SCALE_SAMPLE")
      traceNativeMapZoom(this, "SCALE_CHANGE_CHECK", {
        source,
        previousScale: previousObservedScale,
        currentScale: observedScale,
        threshold,
        scaleChangedByThreshold,
        shouldInvalidate: false,
      });
    recordNativeMapCameraState(this, {
      currentScale: observedScale,
      settled: settle,
      gestureState: this.data.mapNativeInteractionState,
      source,
    });
    const active = publicMapNativeReconcileSessions.get(this);
    if (
      active &&
      Math.abs(observedScale - active.observedScaleAtStart) >= threshold
    )
      this.cancelNativeMapDeferredReconcile("NEW_ZOOM_OBSERVED");
    if (PNG_MARKER_ZOOM_ADAPTIVE_ENABLED && (scaleChangedByThreshold || settle))
      this.schedulePngMarkerZoomProjection();
    return true;
  },

  schedulePngMarkerZoomProjection() {
    if (!PNG_MARKER_ZOOM_ADAPTIVE_ENABLED) return;
    let throttle = publicMapMarkerZoomThrottles.get(this);
    if (!throttle) {
      throttle = new MarkerZoomThrottle();
      publicMapMarkerZoomThrottles.set(this, throttle);
    }
    throttle.request(() => {
      if (this.data.currentView !== "map-preview") return;
      const fallbackScale = Number(this.data.mapNativeScale) || 12;
      const scale = resolveNativeMapObservedScale(
        nativeMapCameraScaleStateFor(this, fallbackScale),
      );
      const previous = publicMapNativeProjections.get(this);
      const projection = this.projectNativeMapPresentationAtScale(
        scale,
        previous,
      );
      // PNGs are prepared offscreen, then committed atomically. No intermediate blank or motion frames.
      clearNativeMapTopologyBarrier(this);
      this.commitNativeMapProjection(projection, "IDLE", () => {
        setNativeMapPresentationScale(this, fallbackScale, scale);
      });
    });
  },

  startNativeMapDeferredReconcile(
    reason: "PAN" | "PROGRAMMATIC_CAMERA_SETTLE",
  ): boolean {
    if (PNG_MARKER_ZOOM_ADAPTIVE_ENABLED) {
      this.schedulePngMarkerZoomProjection();
      return true;
    }
    const fallbackScale = Number(this.data.mapNativeScale) || 12;
    const camera = nativeMapCameraScaleStateFor(this, fallbackScale);
    if (!needsNativeMapPresentationReconcile(camera)) return false;
    this.cancelNativeMapDeferredReconcile("REPLACED_BY_NEW_RECONCILE");
    const previous =
      publicMapNativeCommittedProjections.get(this) ??
      publicMapNativeProjections.get(this);
    if (!previous) return false;
    const targetScale = resolveNativeMapObservedScale(camera);
    beginNativeMapReconcileScale(this, fallbackScale, targetScale);
    const target = this.projectNativeMapPresentationAtScale(
      targetScale,
      previous,
    );
    const plan = planNativeMapStableReconcile({ previous, target });
    publicMapNativeProjections.set(this, target);
    clearNativeMapTopologyBarrier(this);
    const generation =
      (publicMapNativeTransitionGenerations.get(this) ?? 0) + 1;
    publicMapNativeTransitionGenerations.set(this, generation);
    const session: {
      readonly generation: number;
      readonly observedScaleAtStart: number;
      readonly reason: "PAN" | "PROGRAMMATIC_CAMERA_SETTLE";
      visualCommitCount: number;
    } = {
      generation,
      observedScaleAtStart: targetScale,
      reason,
      visualCommitCount: 0,
    };
    publicMapNativeReconcileSessions.set(this, session);
    traceNativeMapZoom(this, "RECONCILE_STARTED", {
      reason,
      fromScale: plan.fromScale,
      targetPresentationScale: plan.targetScale,
      observedScale: camera.observedScale,
      presentationScale: camera.presentationScale,
      topologyChanged: plan.direction !== "NONE",
      direction: plan.direction,
      reconcileStarted: true,
      visualFrameCount: 0,
    });

    const interactionState: PublicMapInteractionState =
      reason === "PROGRAMMATIC_CAMERA_SETTLE"
        ? "CLUSTER_TRANSITION"
        : "GESTURE";
    const recordCommittedFrame = (projection: NativeMapMarkerProjection) => {
      publicMapNativeProjections.set(this, projection);
      setNativeMapPresentationScale(this, fallbackScale, projection.scale);
      const active = publicMapNativeReconcileSessions.get(this);
      if (!active || active.generation !== generation) return;
      active.visualCommitCount += 1;
      traceNativeMapZoom(this, "STABLE_MARKER_COMMIT", {
        reason,
        visualCommitCount: active.visualCommitCount,
        scale: projection.scale,
        topologyChanged: plan.direction !== "NONE",
        nativeBindingCommitCount: plan.direction === "NONE" ? 0 : 1,
      });
    };
    const complete = () => {
      const active = publicMapNativeReconcileSessions.get(this);
      if (!active || active.generation !== generation) return;
      completeNativeMapReconcileScale(this, fallbackScale);
      publicMapNativeReconcileSessions.delete(this);
      publicMapNativeTransitionTimers.delete(this);
      traceNativeMapZoom(this, "RECONCILE_COMPLETED", {
        reason,
        observedScale: resolveNativeMapObservedScale(
          nativeMapCameraScaleStateFor(this, fallbackScale),
        ),
        presentationScale: resolveNativeMapPresentationScale(
          nativeMapCameraScaleStateFor(this, fallbackScale),
        ),
        targetPresentationScale: null,
        visualCommitCount: active.visualCommitCount,
        topologyChanged: plan.direction !== "NONE",
        nativeBindingCommitCount: plan.direction === "NONE" ? 0 : 1,
        reconcileCompleted: true,
      });
      if (!publicMapNativeActiveRegions.has(this))
        this.setData({ mapNativeInteractionState: "IDLE" as const });
    };
    this.commitNativeMapProjection(
      plan.finalBindingProjection,
      interactionState,
      () => {
        recordCommittedFrame(plan.finalBindingProjection);
        complete();
      },
    );
    return true;
  },

  stopNativeMapScaleSampling() {
    const timer = publicMapNativeScalePollTimers.get(this);
    if (timer) clearTimeout(timer);
    publicMapNativeScalePollTimers.delete(this);
    publicMapNativeScalePollGenerations.set(
      this,
      (publicMapNativeScalePollGenerations.get(this) ?? 0) + 1,
    );
  },

  startNativeMapScaleSampling() {
    this.stopNativeMapScaleSampling();
    const context = publicMapNativeContexts.get(this);
    if (!context) return;
    const generation = publicMapNativeScalePollGenerations.get(this) ?? 0;
    const sample = () => {
      if (publicMapNativeScalePollGenerations.get(this) !== generation) return;
      let completed = false;
      const scheduleNext = () => {
        if (completed) return;
        completed = true;
        if (publicMapNativeScalePollGenerations.get(this) !== generation)
          return;
        const timer = setTimeout(sample, 40);
        publicMapNativeScalePollTimers.set(this, timer);
      };
      const watchdog = setTimeout(scheduleNext, 120);
      context.getScale({
        success: (result) => {
          clearTimeout(watchdog);
          if (publicMapNativeScalePollGenerations.get(this) !== generation)
            return;
          const scale = Number(result.scale);
          const fallbackScale = Number(this.data.mapNativeScale) || 12;
          const camera = nativeMapCameraScaleStateFor(this, fallbackScale);
          const previousScale = resolveNativeMapObservedScale(camera);
          const threshold = 0.005;
          const scaleChangedByThreshold =
            Number.isFinite(scale) &&
            scale > 0 &&
            Math.abs(scale - previousScale) >= threshold;
          traceNativeMapZoom(this, "SCALE_CHANGE_CHECK", {
            source: "GET_SCALE_SAMPLE",
            previousScale,
            currentScale: Number.isFinite(scale) ? scale : null,
            threshold,
            scaleChangedByThreshold,
            shouldInvalidate: false,
          });
          if (Number.isFinite(scale) && scale > 0) {
            traceNativeMapZoom(this, "ZOOM_EVENT_RECEIVED", {
              scale,
              source: "GET_SCALE_SAMPLE",
              previousScale,
            });
            this.observeNativeMapCameraScale(scale, false, "GET_SCALE_SAMPLE");
          }
          const gesture = publicMapNativeGestureSessions.get(this);
          if (!gesture || gesture.kind === "PROGRAMMATIC") {
            scheduleNext();
            return;
          }
          if (
            Number.isFinite(scale) &&
            Math.abs(scale - gesture.startScale) >= threshold
          ) {
            gesture.kind = "ZOOM";
            this.cancelNativeMapDeferredReconcile("PINCH_DURING_RECONCILE");
            scheduleNext();
            return;
          }
          if (gesture.kind !== "UNCLASSIFIED" || !gesture.originViewport) {
            scheduleNext();
            return;
          }
          let regionCompleted = false;
          const finishRegionRead = () => {
            if (regionCompleted) return;
            regionCompleted = true;
            scheduleNext();
          };
          const regionWatchdog = setTimeout(finishRegionRead, 120);
          context.getRegion({
            success: (region) => {
              clearTimeout(regionWatchdog);
              if (publicMapNativeScalePollGenerations.get(this) !== generation)
                return;
              const viewport = {
                west: region.southwest.longitude,
                south: region.southwest.latitude,
                east: region.northeast.longitude,
                north: region.northeast.latitude,
              };
              if (nativeMapViewportMoved(gesture.originViewport, viewport)) {
                gesture.kind = "PAN";
                this.startNativeMapDeferredReconcile("PAN");
              }
              finishRegionRead();
            },
            fail: () => {
              clearTimeout(regionWatchdog);
              finishRegionRead();
            },
          });
        },
        fail: () => {
          clearTimeout(watchdog);
          scheduleNext();
        },
      });
    };
    sample();
  },

  scheduleNativeMapScaleSettle(
    regionGeneration: number,
    programmaticCamera = false,
    remainingSamples = 8,
  ) {
    const context = publicMapNativeContexts.get(this);
    const finish = () => {
      if (PNG_MARKER_ZOOM_ADAPTIVE_ENABLED)
        this.schedulePngMarkerZoomProjection();
      publicMapNativeScalePollTimers.delete(this);
      const hadPendingCluster = publicMapNativePendingClusters.has(this);
      publicMapNativePendingClusters.delete(this);
      const fallback = publicMapNativeCameraFallbackTimers.get(this);
      if (fallback) clearTimeout(fallback);
      publicMapNativeCameraFallbackTimers.delete(this);
      if (programmaticCamera || hadPendingCluster) {
        this.startNativeMapDeferredReconcile("PROGRAMMATIC_CAMERA_SETTLE");
      } else if (!publicMapNativeReconcileSessions.has(this))
        this.setData({ mapNativeInteractionState: "IDLE" as const });
      publicMapNativeGestureSessions.delete(this);
    };
    if (!context || remainingSamples <= 0) {
      finish();
      return;
    }
    const timer = setTimeout(() => {
      if (publicMapNativeRegionGenerations.get(this) !== regionGeneration)
        return;
      const isFinalSample = remainingSamples === 1;
      context.getScale({
        success: (result) => {
          if (publicMapNativeRegionGenerations.get(this) !== regionGeneration)
            return;
          const scale = Number(result.scale);
          if (Number.isFinite(scale) && scale > 0) {
            traceNativeMapZoom(this, "ZOOM_EVENT_RECEIVED", {
              scale,
              source: "POST_END_SETTLE_SAMPLE",
              isFinalSample,
              remainingSamples,
            });
            this.observeNativeMapCameraScale(
              scale,
              isFinalSample,
              "POST_END_SETTLE_SAMPLE",
            );
          }
          if (isFinalSample) {
            finish();
            return;
          }
          this.scheduleNativeMapScaleSettle(
            regionGeneration,
            programmaticCamera,
            remainingSamples - 1,
          );
        },
        fail: () => {
          if (isFinalSample) {
            finish();
            return;
          }
          this.scheduleNativeMapScaleSettle(
            regionGeneration,
            programmaticCamera,
            remainingSamples - 1,
          );
        },
      });
    }, 80);
    publicMapNativeScalePollTimers.set(this, timer);
  },

  refreshNativeMapPresentation(
    scale?: number,
    animateTopology = true,
  ): boolean {
    const requestedScale = Number(scale);
    const camera = nativeMapCameraScaleStateFor(
      this,
      Number(this.data.mapNativeScale) || 12,
    );
    const effectiveScale =
      (Number.isFinite(requestedScale) && requestedScale > 0
        ? requestedScale
        : resolveNativeMapPresentationScale(
            camera,
            this.data.mapNativeInteractionState,
          )) ||
      Number(this.data.mapNativeScale) ||
      12;
    this.cancelNativeMapDeferredReconcile("PRESENTATION_REFRESH");
    const previous = publicMapNativeProjections.get(this);
    const projection = this.projectNativeMapPresentationAtScale(
      effectiveScale,
      previous,
    );
    return this.applyNativeMapProjection(projection, animateTopology);
  },

  onMapNativeUpdated() {
    const diagnosticState = nativeMapZoomDiagnosticStateFor(this);
    traceNativeMapZoom(this, "NATIVE_MAP_RENDER", {
      signal: "MAP_UPDATED_EVENT",
      mapNativeReady: this.data.mapNativeReady,
      mapNativeMarkerCount: (
        this.data.mapNativeMarkers as readonly NativeMapMarkerBinding[]
      ).length,
      mapNativeMarkerViewCount: (
        this.data.mapNativeMarkerViews as readonly NativeMapMarkerView[]
      ).length,
      nativeRendersInLastSecond: recordNativeMapDiagnosticRate(
        diagnosticState.nativeRenderTimestamps,
      ),
      topologyGeneration: diagnosticState.topologyGeneration,
      transitionGeneration: publicMapNativeTransitionGenerations.get(this) ?? 0,
    });
    if (!publicMapNativeContexts.has(this)) {
      publicMapNativeContexts.set(
        this,
        wx.createMapContext("public-map", this),
      );
    }
    if (this.data.mapNativeReady) return;
    this.setData({ mapNativeReady: true, mapNativeRenderError: "" });
    this.refreshNativeMapPresentation(undefined, false);
  },

  onMapNativeRenderError(
    event: WechatMiniprogram.CustomEvent<{ readonly errMsg?: string }>,
  ) {
    const errMsg = String(event.detail?.errMsg ?? "地图同层渲染失败");
    console.warn("public_map_native_render_error", {
      errMsg,
      system: wx.getDeviceInfo?.().system,
      platform: wx.getDeviceInfo?.().platform,
      sdkVersion: wx.getAppBaseInfo?.().SDKVersion,
    });
    this.setData({ mapNativeRenderError: errMsg });
  },

  activateNativeMapSurface() {
    const snapshot = publicMapNativeCameraSnapshots.get(this);
    this.setData({
      mapNativeReady: false,
      mapNativeRenderError: "",
      ...(snapshot
        ? {
            mapNativeCenterLatitude: snapshot.latitude,
            mapNativeCenterLongitude: snapshot.longitude,
            mapNativeScale: snapshot.scale,
          }
        : {}),
    });
    if (snapshot?.viewport)
      publicMapNativeViewports.set(this, snapshot.viewport);
  },

  deactivateNativeMapSurface() {
    this.stopNativeMapLocation();
    publicMapMarkerZoomThrottles.get(this)?.cancel();
    publicMapMarkerProjectionResolvers.get(this)?.cancel();
    publicMapMarkerRenderGenerations.set(
      this,
      (publicMapMarkerRenderGenerations.get(this) ?? 0) + 1,
    );
    // The Page and public-map client remain alive, but the native map surface
    // must leave the tree outside the map module to avoid iOS mixed rendering.
    this.stopNativeMapScaleSampling();
    const fallback = publicMapNativeCameraFallbackTimers.get(this);
    if (fallback) clearTimeout(fallback);
    publicMapNativeCameraFallbackTimers.delete(this);
    this.stopNativeMapLeadCameraAnimation();
    const transition = publicMapNativeTransitionTimers.get(this);
    if (transition) clearTimeout(transition);
    publicMapNativeTransitionTimers.delete(this);
    publicMapNativeContexts.delete(this);
    publicMapNativeActiveRegions.delete(this);
    publicMapNativeGestureSessions.delete(this);
    publicMapNativeRegionGenerations.set(
      this,
      (publicMapNativeRegionGenerations.get(this) ?? 0) + 1,
    );
    publicMapNativeCommitInFlight.delete(this);
    publicMapNativePendingCommits.delete(this);
    publicMapNativeReconcileSessions.delete(this);
    this.setData({ mapNativeReady: false });
  },

  onMapNativeTap() {
    if (this.isMapOverlayTouch()) return;
    if (this.data.mapClusterPickerOpen) return;
    const now = Date.now();
    const guardUntil = publicMapNativeTapGuardUntil.get(this) ?? 0;
    if (guardUntil > now) {
      // Consume only the one companion surface tap emitted by the same native
      // marker gesture. A subsequent independent map tap must dismiss.
      publicMapNativeTapGuardUntil.delete(this);
      return;
    }
    if (guardUntil > 0) publicMapNativeTapGuardUntil.delete(this);
    if (publicMapNativeSpiderfyClusters.has(this)) {
      publicMapNativeSpiderfyClusters.delete(this);
      this.refreshNativeMapPresentation(undefined, true);
    }
    this.dismissNativeMapSelection("IDLE");
  },

  dismissNativeMapSelection(
    interactionState: PublicMapInteractionState = "IDLE",
  ) {
    publicMapClusterPickerRenderTokens.delete(this);
    publicMapClusterPickerMetadataLoaders.get(this)?.cancel();
    publicMapClusterPickerMetadataLoaders.delete(this);
    publicMapOverlayTouches.delete(this);
    publicMapClusterPickerScrollTops.delete(this);
    const closeTimer = publicMapCardCloseTimers.get(this);
    if (closeTimer) clearTimeout(closeTimer);
    publicMapCardCloseTimers.delete(this);
    publicMapNativeTapGuardUntil.delete(this);
    this.stopNativeMapLeadCameraAnimation();
    if (interactionState === "IDLE") {
      this.stopNativeMapScaleSampling();
      publicMapNativeGestureSessions.delete(this);
      publicMapNativeRegionGenerations.set(
        this,
        (publicMapNativeRegionGenerations.get(this) ?? 0) + 1,
      );
    }

    const currentViews = this.data
      .mapNativeMarkerViews as readonly NativeMapMarkerView[];
    const deselectedViews = currentViews.map((view) =>
      view.selected ? { ...view, selected: false } : view,
    );
    this.setData({
      mapClusterPickerOpen: false,
      mapClusterPickerRefreshing: false,
      mapClusterPickerItems: [],
      mapSheetMode: "CLOSED" as const,
      mapCardPhase: "CLOSED" as const,
      mapSelectedLeadId: "",
      mapNativeSelectedClusterKey: "",
      mapNativeMarkerViews: deselectedViews,
      mapNativeInteractionState: interactionState,
    });

    const client = this.ensurePublicMapClient();
    if (
      client.state.detail.selectedPublicLeadId ||
      client.state.detail.phase !== "IDLE"
    )
      client.clearSelection();

    const projection = publicMapNativeProjections.get(this);
    if (projection && currentViews.some((view) => view.selected))
      this.commitNativeMapProjection(
        { ...projection, views: deselectedViews },
        interactionState,
      );
  },

  clearNativeMapTransition() {
    this.stopNativeMapLeadCameraAnimation();
    this.stopNativeMapScaleSampling();
    clearNativeMapTopologyBarrier(this);
    publicMapNativeRegionGenerations.set(
      this,
      (publicMapNativeRegionGenerations.get(this) ?? 0) + 1,
    );
    this.cancelNativeMapDeferredReconcile("CLEAR_TRANSITION");
    publicMapNativeGestureSessions.delete(this);
    const timer = publicMapNativeTransitionTimers.get(this);
    if (timer) clearTimeout(timer);
    publicMapNativeTransitionTimers.delete(this);
    publicMapNativeTransitionGenerations.set(
      this,
      (publicMapNativeTransitionGenerations.get(this) ?? 0) + 1,
    );
    publicMapNativeSpiderfyClusters.delete(this);
    this.setData({
      mapNativeInteractionState: "IDLE" as const,
      mapNativeSelectedClusterKey: "",
    });
  },

  stopNativeMapLeadCameraAnimation() {
    const active = publicMapNativeLeadCameraAnimations.get(this);
    if (active?.timer) clearTimeout(active.timer);
    publicMapNativeLeadCameraAnimations.delete(this);
    publicMapNativeLeadCameraAnimationGenerations.set(
      this,
      (publicMapNativeLeadCameraAnimationGenerations.get(this) ?? 0) + 1,
    );
  },

  animateNativeMapCenterTo(
    publicLeadId: string,
    target: { readonly latitude: number; readonly longitude: number },
    scale: number,
  ) {
    this.stopNativeMapLeadCameraAnimation();
    const generation =
      publicMapNativeLeadCameraAnimationGenerations.get(this) ?? 0;
    const startLatitude = Number(this.data.mapNativeCenterLatitude);
    const startLongitude = Number(this.data.mapNativeCenterLongitude);
    if (
      !Number.isFinite(startLatitude) ||
      !Number.isFinite(startLongitude) ||
      !Number.isFinite(target.latitude) ||
      !Number.isFinite(target.longitude)
    ) {
      this.setData({
        mapNativeCenterLatitude: target.latitude,
        mapNativeCenterLongitude: target.longitude,
      });
      return;
    }
    const startedAt = Date.now();
    const session = {
      publicLeadId,
      generation,
      timer: null as ReturnType<typeof setTimeout> | null,
    };
    publicMapNativeLeadCameraAnimations.set(this, session);
    const publishFrame = () => {
      if (publicMapNativeLeadCameraAnimations.get(this) !== session) return;
      if (
        publicMapNativeLeadCameraAnimationGenerations.get(this) !== generation
      )
        return;
      const elapsed = Math.max(0, Date.now() - startedAt);
      const progress = easePresentationProgress(
        Math.min(1, elapsed / NATIVE_LEAD_CAMERA_ANIMATION_MS),
      );
      const latitude =
        startLatitude + (target.latitude - startLatitude) * progress;
      const longitude =
        startLongitude + (target.longitude - startLongitude) * progress;
      this.setData({
        mapNativeCenterLatitude: latitude,
        mapNativeCenterLongitude: longitude,
        mapNativeInteractionState: "CAMERA_ANIMATING" as const,
      });
      if (progress < 1) {
        session.timer = setTimeout(
          publishFrame,
          Math.min(
            NATIVE_LEAD_CAMERA_FRAME_MS,
            NATIVE_LEAD_CAMERA_ANIMATION_MS - elapsed,
          ),
        );
        return;
      }
      if (publicMapNativeLeadCameraAnimations.get(this) === session) {
        publicMapNativeLeadCameraAnimations.delete(this);
        rememberNativeMapCameraSnapshot(this, {
          latitude: target.latitude,
          longitude: target.longitude,
          scale,
          ...(publicMapNativeViewports.get(this)
            ? { viewport: publicMapNativeViewports.get(this)! }
            : {}),
        });
      }
    };
    session.timer = setTimeout(publishFrame, NATIVE_LEAD_CAMERA_FRAME_MS);
  },

  onMapNativeMarkerTap(
    event: WechatMiniprogram.CustomEvent<{ markerId?: number }>,
  ) {
    if (this.data.mapClusterPickerOpen) return;
    if ((publicMapNativeMarkerTapSuppressedUntil.get(this) ?? 0) > Date.now())
      return;
    const markerId = Number(
      event.detail?.markerId ?? event.currentTarget?.dataset.markerId,
    );
    publicMapNativeTapGuardUntil.set(
      this,
      Date.now() + NATIVE_MARKER_SURFACE_TAP_GUARD_MS,
    );
    this.activateNativeMapMarker(markerId);
  },

  activateNativeMapMarker(markerId: number) {
    if (this.data.mapClusterPickerOpen) return;
    if (!Number.isFinite(markerId)) return;
    const selected = (
      this.data.mapNativeMarkerViews as readonly NativeMapMarkerView[]
    ).find((item) => item.markerId === markerId);
    if (!selected) return;
    const cameraBusy =
      this.data.mapNativeInteractionState === "CAMERA_ANIMATING" ||
      this.data.mapNativeInteractionState === "CLUSTER_TRANSITION";
    const switchingLeadDuringCamera =
      cameraBusy &&
      selected.kind === "LEAD" &&
      selected.publicLeadId !== this.data.mapSelectedLeadId;
    const switchingClusterDuringCamera =
      cameraBusy && selected.kind === "CLUSTER";
    if (
      cameraBusy &&
      !switchingLeadDuringCamera &&
      !switchingClusterDuringCamera
    )
      return;
    if (switchingLeadDuringCamera || switchingClusterDuringCamera) {
      const fallback = publicMapNativeCameraFallbackTimers.get(this);
      if (fallback) clearTimeout(fallback);
      publicMapNativeCameraFallbackTimers.delete(this);
      publicMapNativePendingClusters.delete(this);
      publicMapNativeActiveRegions.delete(this);
      this.clearNativeMapTransition();
    }
    const now = Date.now();
    const previous = publicMapNativeLastMarkerTaps.get(this);
    if (previous?.markerId === markerId && now - previous.at < 120) return;
    publicMapNativeLastMarkerTaps.set(this, { markerId, at: now });
    const immediateMarkerViews = (
      this.data.mapNativeMarkerViews as readonly NativeMapMarkerView[]
    ).map((item) => ({
      ...item,
      selected: item.markerId === markerId,
    }));
    const currentProjection = publicMapNativeProjections.get(this);
    if (
      currentProjection?.views.some((item) => item.markerId === markerId) &&
      currentProjection.views.length === immediateMarkerViews.length
    )
      this.commitNativeMapProjection({
        ...currentProjection,
        views: immediateMarkerViews,
      });
    else this.setData({ mapNativeMarkerViews: immediateMarkerViews });
    if (selected.kind === "LEAD") {
      this.openSelectedMapLead(selected.publicLeadId, selected);
      return;
    }

    // A cluster tap is a navigation intent, not a detail selection. Clear an
    // open detail synchronously so its page-layer shell cannot intercept the
    // next native-map gesture while the camera expands the cluster.
    this.ensurePublicMapClient().clearSelection();
    this.setData({
      mapSheetMode: "CLOSED" as const,
      mapCardPhase: "CLOSED" as const,
    });

    const clusterKey = nativeMarkerClusterKey(selected);
    const fallbackScale = Number(this.data.mapNativeScale) || 12;
    const observedScale = resolveNativeMapObservedScale(
      nativeMapCameraScaleStateFor(this, fallbackScale),
    );
    this.setData({
      mapNativeSelectedClusterKey: clusterKey,
      mapNativeInteractionState: "CLUSTER_SELECTED",
    });

    const projection = publicMapNativeProjections.get(this);
    const currentMarkers = this.data
      .mapMarkers as readonly PublicMapMarkerPresentation[];
    const markersByLeadId = new Map(
      currentMarkers.map((marker) => [marker.publicLeadId, marker]),
    );
    const childMarkers = selected.memberLeadIds
      .map(
        (id) =>
          markersByLeadId.get(id) ??
          projection?.topology.markersByLeadId.get(id),
      )
      .filter((marker): marker is PublicMapMarkerPresentation =>
        Boolean(marker),
      );
    if (
      childMarkers.length === selected.memberLeadIds.length &&
      classifyClusterAtMaxScale(childMarkers) === "UNRESOLVED"
    ) {
      publicMapNativeSpiderfyClusters.delete(this);
      this.setData({
        mapClusterPickerOpen: true,
        mapClusterPickerImageError: false,
        mapClusterPickerItems: childMarkers.map((marker) =>
          presentClusterPickerRow(marker),
        ),
      });
      void this.prepareMapClusterPickerImages();
      this.startMapClusterPickerMetadata();
      return;
    }
    if (observedScale >= PUBLIC_MAP_MAX_SCALE - 0.01) {
      // Old topology hysteresis can lag the true max-scale projection; rebuild
      // at real coordinates rather than creating display-only spiderfy points.
      this.refreshNativeMapPresentation(PUBLIC_MAP_MAX_SCALE, true);
      return;
    }
    const nextSplitScale = findPublicMapClusterExpansionScale({
      markers: childMarkers,
      currentScale: observedScale,
      renderedMarkerWidthAtScale: (scale) =>
        PNG_MARKER_ZOOM_ADAPTIVE_ENABLED
          ? markerGeometry(markerDetailLevel(scale)).footprintWidth
          : NATIVE_MARKER_LEFT_WIDTH + deriveMarkerRightWidth(scale),
      renderedMarkerHeight: PNG_MARKER_ZOOM_ADAPTIVE_ENABLED
        ? markerGeometry().footprintHeight
        : NATIVE_MARKER_HEIGHT,
    });

    publicMapNativePendingClusters.set(this, {
      clusterKey,
      nextSplitScale,
    });
    setNativeMapTargetScale(this, fallbackScale, nextSplitScale);
    traceNativeMapZoom(this, "ZOOM_EVENT_RECEIVED", {
      scale: nextSplitScale,
      source: "CLUSTER_CAMERA_COMMAND",
      previousScale: observedScale,
    });
    recordNativeMapCameraState(this, {
      currentScale: nextSplitScale,
      settled: false,
      gestureState: "CAMERA_ANIMATING",
      source: "CLUSTER_CAMERA_COMMAND",
    });
    this.setData({
      mapNativeCenterLatitude: selected.latitude,
      mapNativeCenterLongitude: selected.longitude,
      mapNativeScale: nextSplitScale,
      mapNativeInteractionState: "CAMERA_ANIMATING",
    });
    rememberNativeMapCameraSnapshot(this, {
      latitude: selected.latitude,
      longitude: selected.longitude,
      scale: nextSplitScale,
      ...(publicMapNativeViewports.get(this)
        ? { viewport: publicMapNativeViewports.get(this)! }
        : {}),
    });
    publicMapNativeGestureSessions.set(this, {
      kind: "PROGRAMMATIC",
      startScale: observedScale,
      ...(publicMapNativeViewports.get(this)
        ? { originViewport: publicMapNativeViewports.get(this)! }
        : {}),
    });
    this.startNativeMapScaleSampling();
    const existing = publicMapNativeCameraFallbackTimers.get(this);
    if (existing) clearTimeout(existing);
    const fallback = setTimeout(() => {
      const pending = publicMapNativePendingClusters.get(this);
      if (!pending) return;
      publicMapNativePendingClusters.delete(this);
      this.stopNativeMapScaleSampling();
      const context = publicMapNativeContexts.get(this);
      const finish = (scale: number) => {
        traceNativeMapZoom(this, "ZOOM_EVENT_RECEIVED", {
          scale,
          source: "CAMERA_FALLBACK",
        });
        const camera = nativeMapCameraScaleStateFor(this, fallbackScale);
        const resolvedScale =
          camera.targetScale !== null &&
          Math.abs(scale - camera.settledScale) < 0.01
            ? camera.targetScale
            : scale;
        this.observeNativeMapCameraScale(
          resolvedScale,
          true,
          "CAMERA_FALLBACK",
        );
        this.startNativeMapDeferredReconcile("PROGRAMMATIC_CAMERA_SETTLE");
      };
      if (!context) {
        finish(
          nativeMapCameraScaleStateFor(this, fallbackScale).observedScale ??
            pending.nextSplitScale,
        );
        return;
      }
      context.getScale({
        success: (result) =>
          finish(
            Number(result.scale) ||
              nativeMapCameraScaleStateFor(this, fallbackScale).observedScale ||
              pending.nextSplitScale,
          ),
        fail: () =>
          finish(
            nativeMapCameraScaleStateFor(this, fallbackScale).observedScale ??
              pending.nextSplitScale,
          ),
      });
    }, 900);
    publicMapNativeCameraFallbackTimers.set(this, fallback);
  },

  async prepareMapClusterPickerImages() {
    if (!this.data.mapClusterPickerOpen) return;
    const token = {};
    publicMapClusterPickerRenderTokens.set(this, token);
    const isCurrent = () =>
      publicMapClusterPickerRenderTokens.get(this) === token &&
      this.data.mapClusterPickerOpen;
    // Match V1 modal max-width 340, 24px inner gutters, plus the PNG's 8px
    // transparent padding on each side. Images retain their logical size.
    const windowWidth = Number(wx.getWindowInfo().windowWidth) || 390;
    const width = Math.min(340, windowWidth - 32) - 48 + 16;
    this.setData({
      mapClusterPickerImageWidth: width,
      mapClusterPickerImageError: false,
    });
    let cache = publicMapMarkerImageCaches.get(this);
    if (!cache) {
      cache = new MarkerImageCache();
      publicMapMarkerImageCaches.set(this, cache);
    }
    let renderer = publicMapMarkerCanvasRenderers.get(this);
    if (!renderer) {
      renderer = new MarkerCanvasRenderer(this as never);
      publicMapMarkerCanvasRenderers.set(this, renderer);
    }
    try {
      for (const row of this.data.mapClusterPickerItems) {
        if (!isCurrent()) return;
        const item = this.data.mapClusterPickerItems.find(
          (item) => item.publicLeadId === row.publicLeadId,
        );
        if (!item) continue;
        const input: MarkerCanvasRenderInput = {
          surface: "PICKER",
          pickerWidth: width,
          kind: "LEAD",
          countLabel: item.totalRemainingLabel,
          title: item.displayIpTheme,
          statusLabel: item.primaryDiscoveryTag,
          statusTone: item.markerStatusTone,
          statusTags: item.statusTags,
          pickerNotePreview: item.pickerNotePreview,
          pickerUploadedAtLabel: item.pickerUploadedAtLabel,
          selected: false,
          clusterCount: 1,
        };
        const asset = await cache.getOrCreate(
          createMarkerRenderKey(input),
          () => renderer!.render(input),
        );
        if (!isCurrent()) return;
        this.setData({
          mapClusterPickerItems: this.data.mapClusterPickerItems.map(
            (current) =>
              current.publicLeadId === item.publicLeadId
                ? { ...current, markerIconPath: asset.iconPath }
                : current,
          ),
        });
      }
    } catch {
      if (isCurrent()) this.setData({ mapClusterPickerImageError: true });
    }
  },

  startMapClusterPickerMetadata(forceRefresh = false) {
    publicMapClusterPickerMetadataLoaders.get(this)?.cancel();
    const client = this.ensurePublicMapClient();
    const loader: ClusterPickerMetadataLoader = new ClusterPickerMetadataLoader(
      {
        read: (id) =>
          client.readLeadForPicker(id, {
            forceRefresh,
            allowRenderedLead: true,
          }),
        isCurrent: () =>
          publicMapClusterPickerMetadataLoaders.get(this) === loader &&
          this.data.mapClusterPickerOpen &&
          this.data.currentView === "map-preview",
        onRow: (id, detail) => {
          if (!detail && client.isPublicLeadUnavailable?.(id)) {
            const remaining = this.data.mapClusterPickerItems.filter(
              (row) => row.publicLeadId !== id,
            );
            if (remaining.length === 0) {
              this.dismissNativeMapSelection();
              return;
            }
            this.setData({
              mapClusterPickerItems: remaining,
            });
            void this.prepareMapClusterPickerImages();
            return;
          }
          this.setData({
            mapClusterPickerItems: this.data.mapClusterPickerItems.map((row) =>
              row.publicLeadId === id &&
              (detail || row.pickerMetadataPhase !== "LOADED")
                ? {
                    ...presentClusterPickerRow(row, detail),
                    markerIconPath: "",
                  }
                : row,
            ),
          });
          void this.prepareMapClusterPickerImages();
        },
        onIdle: () => this.setData({ mapClusterPickerRefreshing: false }),
      },
    );
    publicMapClusterPickerMetadataLoaders.set(this, loader);
    const start = Math.min(
      Math.max(0, this.data.mapClusterPickerItems.length - 8),
      Math.max(
        0,
        Math.floor((publicMapClusterPickerScrollTops.get(this) ?? 0) / 62),
      ),
    );
    loader.load(
      this.data.mapClusterPickerItems
        .slice(start, start + 8)
        .map((row) => row.publicLeadId),
    );
  },

  onMapClusterPickerRefresh() {
    if (!this.data.mapClusterPickerOpen || this.data.mapClusterPickerRefreshing)
      return;
    this.setData({ mapClusterPickerRefreshing: true });
    this.startMapClusterPickerMetadata(true);
  },

  onMapClusterPickerScroll(
    event: WechatMiniprogram.CustomEvent<{ scrollTop?: number }>,
  ) {
    publicMapClusterPickerScrollTops.set(
      this,
      Math.max(0, Number(event.detail?.scrollTop ?? 0)),
    );
    const start = Math.min(
      Math.max(0, this.data.mapClusterPickerItems.length - 8),
      Math.max(0, Math.floor(Number(event.detail?.scrollTop ?? 0) / 62)),
    );
    publicMapClusterPickerMetadataLoaders
      .get(this)
      ?.load(
        this.data.mapClusterPickerItems
          .slice(start, start + 8)
          .map((row) => row.publicLeadId),
      );
  },

  onCloseMapClusterPicker() {
    this.dismissNativeMapSelection("IDLE");
    publicMapNativeTapGuardUntil.set(
      this,
      Date.now() + NATIVE_MARKER_SURFACE_TAP_GUARD_MS,
    );
  },

  onMapClusterPickerOutsideDetailTap() {
    if (!this.data.mapClusterPickerOpen) return;
    this.onCloseMapClusterPicker();
  },

  onMapOverlayTouchStart() {
    publicMapOverlayTouches.set(this, { active: true, until: 0 });
  },

  onMapOverlayTouchMove() {
    // The scroll-view keeps its own scrolling; this catch handler stops the
    // gesture reaching the native map underneath either panel.
  },

  onMapOverlayTouchEnd() {
    publicMapOverlayTouches.set(this, {
      active: false,
      until: Date.now() + 350,
    });
  },

  isMapOverlayTouch() {
    const touch = publicMapOverlayTouches.get(this);
    return (
      !!touch &&
      (touch.active || touch.until > Date.now()) &&
      (this.data.mapClusterPickerOpen ||
        (this.data.mapCardPhase !== "CLOSED" &&
          this.data.mapSheetMode !== "CLOSED" &&
          this.data.mapDetailPhase !== "IDLE"))
    );
  },

  onMapOutsideTouchStart() {
    publicMapOverlayTouches.delete(this);
  },

  onMapClusterPickerOutsideTouchStart() {
    this.onMapOutsideTouchStart();
  },

  onMapClusterPickerOutsideTouchMove() {
    this.onMapOutsideTouchStart();
    this.onMapClusterPickerOutsideDetailTap();
  },

  onSelectMapClusterPickerItem(event: WechatMiniprogram.BaseEvent) {
    if (!this.data.mapClusterPickerOpen) return;
    const publicLeadId = String(event.currentTarget.dataset.leadId ?? "");
    const member = (
      this.data.mapClusterPickerItems as readonly PublicMapMarkerPresentation[]
    ).find((item) => item.publicLeadId === publicLeadId);
    if (!member) return;
    publicMapNativeTapGuardUntil.set(
      this,
      Date.now() + NATIVE_MARKER_SURFACE_TAP_GUARD_MS,
    );
    this.openSelectedMapLead(publicLeadId, {
      latitude: member.latitude,
      longitude: member.longitude,
      realLatitude: member.latitude,
      realLongitude: member.longitude,
    });
  },

  onMapNativeRegionChange(
    event: WechatMiniprogram.CustomEvent<{
      readonly scale?: number;
      readonly causedBy?: string;
      readonly type?: string;
      readonly detail?: {
        readonly scale?: number;
        readonly causedBy?: string;
        readonly type?: string;
      };
    }>,
  ) {
    const detail = event.detail ?? {};
    const eventType = detail.type ?? detail.detail?.type;
    const causedBy = detail.causedBy ?? detail.detail?.causedBy;
    if (causedBy !== "update" && this.isMapOverlayTouch()) return;
    const eventScale = Number(detail.scale ?? detail.detail?.scale);
    const fallbackScale = Number(this.data.mapNativeScale) || 12;
    const observedScale = resolveNativeMapObservedScale(
      nativeMapCameraScaleStateFor(this, fallbackScale),
    );
    if (eventType === "begin" || eventType === "end") {
      traceNativeMapZoom(this, "ZOOM_EVENT_RECEIVED", {
        scale:
          Number.isFinite(eventScale) && eventScale > 0
            ? eventScale
            : observedScale,
        source: `REGION_CHANGE_${eventType.toUpperCase()}`,
        causedBy: causedBy ?? "unknown",
      });
    }
    if (eventType === "begin") {
      const previousGesture = publicMapNativeGestureSessions.get(this);
      const hasPendingClusterCommand = publicMapNativePendingClusters.has(this);
      const explicitUserGesture =
        causedBy === "gesture" ||
        causedBy === "scale" ||
        causedBy === "drag" ||
        causedBy === "pan";
      const isCameraCommand =
        !explicitUserGesture &&
        (causedBy === "update" ||
          publicMapNativeLeadCameraAnimations.has(this) ||
          hasPendingClusterCommand ||
          previousGesture?.kind === "PROGRAMMATIC");
      // PNG markers do not mount the legacy callout touch handlers. Suppress
      // any native markertap emitted while a map gesture is being recognized.
      if (!isCameraCommand)
        publicMapNativeMarkerTapSuppressedUntil.set(this, Date.now() + 10_000);
      if (!isCameraCommand) this.dismissNativeMapSelection("GESTURE");
      publicMapNativeActiveRegions.add(this);
      clearNativeMapTopologyBarrier(this);
      publicMapNativeRegionGenerations.set(
        this,
        (publicMapNativeRegionGenerations.get(this) ?? 0) + 1,
      );
      publicMapNativeSpiderfyClusters.delete(this);
      publicMapNativeGestureSessions.set(this, {
        kind: isCameraCommand ? "PROGRAMMATIC" : "UNCLASSIFIED",
        startScale: observedScale,
        ...(publicMapNativeViewports.get(this)
          ? { originViewport: publicMapNativeViewports.get(this)! }
          : {}),
      });
      this.setData({
        mapNativeInteractionState: isCameraCommand
          ? ("CAMERA_ANIMATING" as const)
          : ("GESTURE" as const),
      });
      recordNativeMapCameraState(this, {
        currentScale:
          Number.isFinite(eventScale) && eventScale > 0
            ? eventScale
            : observedScale,
        settled: false,
        gestureState: isCameraCommand ? "CAMERA_ANIMATING" : "GESTURE",
        source: "REGION_CHANGE_BEGIN",
      });
      if (!isCameraCommand) {
        const cameraFallback = publicMapNativeCameraFallbackTimers.get(this);
        if (cameraFallback) clearTimeout(cameraFallback);
        publicMapNativeCameraFallbackTimers.delete(this);
        publicMapNativePendingClusters.delete(this);
      }
      if (Number.isFinite(eventScale) && eventScale > 0)
        this.observeNativeMapCameraScale(
          eventScale,
          false,
          "REGION_CHANGE_BEGIN",
        );
      this.startNativeMapScaleSampling();
      return;
    }
    if (eventType !== "end") return;
    publicMapNativeActiveRegions.delete(this);
    this.stopNativeMapScaleSampling();
    const endingProgrammaticCamera =
      publicMapNativeGestureSessions.get(this)?.kind === "PROGRAMMATIC" ||
      publicMapNativePendingClusters.has(this) ||
      publicMapNativeLeadCameraAnimations.has(this) ||
      causedBy === "update";
    if (!endingProgrammaticCamera)
      publicMapNativeMarkerTapSuppressedUntil.set(this, Date.now() + 350);
    const context = publicMapNativeContexts.get(this);
    if (!context) return;
    const gesture = publicMapNativeGestureSessions.get(this);
    const regionGeneration =
      (publicMapNativeRegionGenerations.get(this) ?? 0) + 1;
    publicMapNativeRegionGenerations.set(this, regionGeneration);
    Promise.all([
      new Promise<number>((resolve) =>
        context.getScale({
          success: (result) => resolve(Number(result.scale) || observedScale),
          fail: () =>
            resolve(
              Number.isFinite(eventScale) && eventScale > 0
                ? eventScale
                : observedScale,
            ),
        }),
      ),
      new Promise<PublicMapBounds | undefined>((resolve) =>
        context.getRegion({
          success: (region) =>
            resolve({
              west: region.southwest.longitude,
              south: region.southwest.latitude,
              east: region.northeast.longitude,
              north: region.northeast.latitude,
            }),
          fail: () => resolve(undefined),
        }),
      ),
    ]).then(([effectiveScale, viewport]) => {
      if (publicMapNativeRegionGenerations.get(this) !== regionGeneration)
        return;
      const cameraFallback = publicMapNativeCameraFallbackTimers.get(this);
      if (cameraFallback) clearTimeout(cameraFallback);
      publicMapNativeCameraFallbackTimers.delete(this);
      traceNativeMapZoom(this, "ZOOM_EVENT_RECEIVED", {
        scale: effectiveScale,
        source: "REGION_CHANGE_END_RESOLVED",
        regionGeneration,
      });
      this.observeNativeMapCameraScale(
        effectiveScale,
        false,
        "REGION_CHANGE_END",
      );
      const programmaticCamera =
        gesture?.kind === "PROGRAMMATIC" ||
        publicMapNativePendingClusters.has(this);
      const zoomGesture =
        !programmaticCamera &&
        (causedBy === "scale" ||
          Math.abs(effectiveScale - (gesture?.startScale ?? observedScale)) >=
            0.005);
      if (gesture) {
        if (zoomGesture) gesture.kind = "ZOOM";
        else if (
          !programmaticCamera &&
          nativeMapViewportMoved(gesture.originViewport, viewport)
        )
          gesture.kind = "PAN";
      }
      if (!programmaticCamera)
        publicMapNativeMarkerTapSuppressedUntil.set(this, Date.now() + 350);
      if (zoomGesture)
        this.cancelNativeMapDeferredReconcile("PINCH_REGION_END");
      else if (!programmaticCamera && gesture?.kind === "PAN")
        this.startNativeMapDeferredReconcile("PAN");
      if (viewport) {
        publicMapNativeViewports.set(this, viewport);
        rememberNativeMapCameraSnapshot(this, {
          latitude: (viewport.south + viewport.north) / 2,
          longitude: (viewport.west + viewport.east) / 2,
          scale: effectiveScale,
          viewport,
        });
      }
      this.setData({
        mapNativeSelectedClusterKey: "",
        mapNativeInteractionState: programmaticCamera
          ? ("CAMERA_ANIMATING" as const)
          : ("GESTURE" as const),
      });
      this.scheduleNativeMapScaleSettle(regionGeneration, programmaticCamera);
      if (!viewport) return;
      const existing = publicMapViewportDebounceTimers.get(this);
      if (existing) clearTimeout(existing);
      const leadCameraAnimationAtSchedule =
        publicMapNativeLeadCameraAnimations.get(this);
      const timer = setTimeout(() => {
        publicMapViewportDebounceTimers.delete(this);
        // A controlled lead-camera tween can emit several region-end events.
        // Only the final settled event, scheduled after the animation session
        // has ended, may refresh the viewport query.
        if (leadCameraAnimationAtSchedule) return;
        const client = this.ensurePublicMapClient();
        const current = client.state.query;
        const isContainedByLoadedViewport =
          viewport.west >= current.bbox.west &&
          viewport.south >= current.bbox.south &&
          viewport.east <= current.bbox.east &&
          viewport.north <= current.bbox.north;
        if (
          isContainedByLoadedViewport &&
          !client.state.truncated &&
          !client.state.nextCursor
        )
          return;
        const next = {
          ...current,
          bbox: viewport,
          zoom: resolveNativeMapObservedScale(
            nativeMapCameraScaleStateFor(this, fallbackScale),
          ),
        };
        this.setData({ mapViewportDirty: false });
        if (createPublicMapQueryIdentity(next) !== client.state.queryIdentity) {
          void client.changeQuery(next);
        }
      }, 180);
      publicMapViewportDebounceTimers.set(this, timer);
    });
  },

  stopNativeMapLocation() {
    publicMapLocationGenerations.set(
      this,
      (publicMapLocationGenerations.get(this) ?? 0) + 1,
    );
    const timer = publicMapLocationRefreshTimers.get(this);
    if (timer) clearTimeout(timer);
    publicMapLocationRefreshTimers.delete(this);
    this.setData({
      mapCurrentLocation: null,
      mapCurrentLocationCircles: [],
      mapNativeLocationGranted: false,
      mapNativeDisplayMarkers: this.data.mapNativeMarkers,
      ...(this.data.mapLocationState === "LOADING"
        ? { mapLocationState: "READY" as const }
        : {}),
    });
  },

  async requestNativeMapLocation(recenter = true) {
    const previousTimer = publicMapLocationRefreshTimers.get(this);
    if (previousTimer) clearTimeout(previousTimer);
    publicMapLocationRefreshTimers.delete(this);
    const generation = (publicMapLocationGenerations.get(this) ?? 0) + 1;
    publicMapLocationGenerations.set(this, generation);
    const isCurrent = () =>
      publicMapLocationGenerations.get(this) === generation;
    const api = wx as unknown as MapLocationApi & {
      getAppAuthorizeSetting?(): {
        locationAuthorized?: string;
        locationReducedAccuracy?: boolean;
      };
      getSetting(options: {
        success(result: {
          authSetting: Record<string, boolean | undefined>;
        }): void;
        fail(error: unknown): void;
      }): void;
      authorize(options: {
        scope: "scope.userLocation";
        success(): void;
        fail(error: unknown): void;
      }): void;
    };
    if (recenter) this.setData({ mapLocationState: "LOADING" as const });
    let mayRefresh = false;
    try {
      const setting = await new Promise<Record<string, boolean | undefined>>(
        (resolve, reject) =>
          api.getSetting({
            success: (result) => resolve(result.authSetting),
            fail: reject,
          }),
      );
      if (!isCurrent()) return;
      if (setting["scope.userLocation"] === false) {
        throw new Error("LOCATION_PERMISSION_DENIED");
      }
      if (setting["scope.userLocation"] !== true) {
        await new Promise<void>((resolve, reject) =>
          api.authorize({
            scope: "scope.userLocation",
            success: resolve,
            fail: reject,
          }),
        );
      }
      if (!isCurrent()) return;
      const systemPermission = api.getAppAuthorizeSetting?.();
      if (systemPermission?.locationAuthorized === "denied")
        throw new Error("LOCATION_PERMISSION_DENIED");
      mayRefresh = true;
      const location = await requestCurrentMapLocation(api, {
        reducedAccuracy: systemPermission?.locationReducedAccuracy === true,
      });
      if (!isCurrent()) return;
      this.setData({
        mapLocationState: location.approximate
          ? ("APPROXIMATE" as const)
          : ("READY" as const),
        mapNativeLocationGranted: true,
        mapCurrentLocation: location,
        mapCurrentLocationCircles: currentMapLocationCircles(location),
        mapNativeDisplayMarkers: withCurrentMapLocation(
          this.data.mapNativeMarkers,
          location,
        ),
        ...(recenter
          ? {
              mapNativeCenterLatitude: location.latitude,
              mapNativeCenterLongitude: location.longitude,
              mapNativeScale: 14,
              mapNativeInteractionState: "CAMERA_ANIMATING" as const,
            }
          : {}),
      });
      if (recenter) {
        rememberNativeMapCameraSnapshot(this, {
          latitude: location.latitude,
          longitude: location.longitude,
          scale: 14,
        });
        publicMapNativeTapGuardUntil.set(this, Date.now() + 350);
        publicMapNativeContexts.get(this)?.moveToLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });
      }
    } catch (error) {
      if (!isCurrent()) return;
      const message =
        error instanceof Error
          ? error.message
          : String((error as { errMsg?: unknown })?.errMsg ?? error);
      const permissionDenied = /DENIED|auth|deny/i.test(message);
      if (permissionDenied) mayRefresh = false;
      this.setData({
        mapLocationState: permissionDenied
          ? ("PERMISSION_NEEDED" as const)
          : ("UNAVAILABLE" as const),
        mapNativeLocationGranted: false,
        mapCurrentLocation: null,
        mapCurrentLocationCircles: [],
        mapNativeDisplayMarkers: this.data.mapNativeMarkers,
      });
      if (recenter)
        wx.showToast({
          title: "定位不可用，仍可手动浏览地图",
          icon: "none",
        });
    } finally {
      if (
        isCurrent() &&
        mayRefresh &&
        this.data.activeTab === "map" &&
        this.data.currentView === "map-preview"
      ) {
        const timer = setTimeout(() => {
          publicMapLocationRefreshTimers.delete(this);
          void this.requestNativeMapLocation(false);
        }, CURRENT_LOCATION_REFRESH_MS);
        publicMapLocationRefreshTimers.set(this, timer);
      }
    }
  },

  onMapRefresh() {
    publicMapNativeTapGuardUntil.set(this, Date.now() + 350);
    this.clearNativeMapTransition();
    this.setData({ mapViewportDirty: false, mapNativeRenderError: "" });
    void this.ensurePublicMapClient().refresh();
  },

  onMapRetry() {
    const client = this.ensurePublicMapClient();
    if (client.state.phase === "PAGINATION_ERROR") {
      void client.retryPagination();
      return;
    }
    if (client.state.phase === "UNAUTHORIZED") {
      void client.recoverIdentity();
      return;
    }
    void client.refresh();
  },

  onMapLoadMore() {
    void this.ensurePublicMapClient().loadNextPage();
  },

  updateMapDiscoveryPresentation(
    searchText: string,
    selectedTagIds: readonly PublicDiscoveryTagId[],
  ) {
    this.clearNativeMapTransition();
    const client = this.ensurePublicMapClient();
    const pageData = toPublicMapPageData(
      client.state,
      searchText,
      selectedTagIds,
    );
    publicMapStableMarkerPresentations.set(this, pageData.mapMarkers);
    this.setData({
      ...pageData,
      mapSearchText: searchText,
      mapSelectedDiscoveryTagIds: [...selectedTagIds],
      mapDiscoveryTagOptions: createPublicDiscoveryTagOptions(selectedTagIds),
      mapAllDiscoveryTagsSelected:
        selectedTagIds.length === POSITIVE_DISCOVERY_TAGS.length,
      mapSheetMode: "CLOSED" as const,
      mapCardPhase: "CLOSED" as const,
    });
    if (this.data.currentView === "map-preview")
      this.refreshNativeMapPresentation(undefined, false);
  },

  onMapSearchInput(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.updateMapDiscoveryPresentation(
      String(event.detail.value ?? "").slice(0, 40),
      this.data.mapSelectedDiscoveryTagIds as readonly PublicDiscoveryTagId[],
    );
  },

  onMapClearSearch() {
    this.updateMapDiscoveryPresentation(
      "",
      this.data.mapSelectedDiscoveryTagIds as readonly PublicDiscoveryTagId[],
    );
  },

  onMapToggleDiscoveryFilter(event: WechatMiniprogram.BaseEvent) {
    const requested = String(event.currentTarget.dataset.tagId ?? "");
    if (
      !ALL_PUBLIC_DISCOVERY_TAG_IDS.includes(requested as PublicDiscoveryTagId)
    )
      return;
    const current = new Set(
      this.data.mapSelectedDiscoveryTagIds as readonly PublicDiscoveryTagId[],
    );
    if (current.has(requested as PublicDiscoveryTagId))
      current.delete(requested as PublicDiscoveryTagId);
    else current.add(requested as PublicDiscoveryTagId);
    const selected = ALL_PUBLIC_DISCOVERY_TAG_IDS.filter((tag) =>
      current.has(tag),
    );
    this.updateMapDiscoveryPresentation(this.data.mapSearchText, selected);
  },

  onMapResetDiscoveryFilters() {
    this.updateMapDiscoveryPresentation("", ALL_PUBLIC_DISCOVERY_TAG_IDS);
  },

  async onMapRecenter() {
    publicMapNativeTapGuardUntil.set(this, Date.now() + 350);
    if (this.data.mapLocationState === "LOADING") return;
    this.clearNativeMapTransition();
    await this.requestNativeMapLocation();
  },

  openSelectedMapLead(
    publicLeadId: string,
    selectedMarker?: Pick<
      NativeMapMarkerView,
      "latitude" | "longitude" | "realLatitude" | "realLongitude"
    >,
  ) {
    const closingTimer = publicMapCardCloseTimers.get(this);
    if (closingTimer) {
      clearTimeout(closingTimer);
      publicMapCardCloseTimers.delete(this);
    }
    const fallbackScale = Number(this.data.mapNativeScale) || 12;
    const observedScale = resolveNativeMapObservedScale(
      nativeMapCameraScaleStateFor(this, fallbackScale),
    );
    const cameraCenter = selectedMarker
      ? offsetPublicMapCoordinate(
          {
            latitude: selectedMarker.realLatitude,
            longitude: selectedMarker.realLongitude,
          },
          { x: 0, y: NATIVE_MARKER_DETAIL_TARGET_OFFSET_Y_PX },
          observedScale,
        )
      : null;
    this.setData({
      mapSheetMode: "PREVIEW" as const,
      mapCardPhase: "OPENING" as const,
      mapContributorAvatarFailed: false,
      ...(cameraCenter
        ? {
            mapNativeInteractionState: "CAMERA_ANIMATING" as const,
          }
        : {}),
    });
    const client = this.ensurePublicMapClient();
    void client.selectLead(publicLeadId);
    if (cameraCenter) {
      publicMapNativeGestureSessions.set(this, {
        kind: "PROGRAMMATIC",
        startScale: observedScale,
        ...(publicMapNativeViewports.get(this)
          ? { originViewport: publicMapNativeViewports.get(this)! }
          : {}),
      });
      this.startNativeMapScaleSampling();
      this.animateNativeMapCenterTo(publicLeadId, cameraCenter, observedScale);
    }
  },

  onMapRetryDetail() {
    const client = this.ensurePublicMapClient();
    const publicLeadId = client.state.detail.selectedPublicLeadId;
    if (publicLeadId) void client.selectLead(publicLeadId);
  },

  onMapCloseDetail() {
    this.closeMapCard();
  },

  onMapOutsideTap() {
    this.closeMapCard();
  },

  onMapCardTap() {
    if (
      this.data.mapCardPhase === "CLOSING" ||
      this.data.mapSheetMode !== "EXPANDED"
    )
      return;
    this.setData({ mapSheetMode: "PREVIEW" as const });
  },

  closeMapCard() {
    if (
      this.data.mapCardPhase === "CLOSED" ||
      this.data.mapCardPhase === "CLOSING"
    )
      return;
    const existing = publicMapCardCloseTimers.get(this);
    if (existing) clearTimeout(existing);
    this.setData({
      mapCardPhase: "CLOSING" as const,
      mapSheetMode: "PREVIEW" as const,
    });
    const timer = setTimeout(() => {
      publicMapCardCloseTimers.delete(this);
      this.ensurePublicMapClient().clearSelection();
      this.setData({
        mapCardPhase: "CLOSED" as const,
        mapSheetMode: "CLOSED" as const,
      });
    }, 280);
    publicMapCardCloseTimers.set(this, timer);
  },

  onMapExpandDetail() {
    if (
      this.data.mapCardPhase !== "CLOSING" &&
      this.data.mapDetailPhase === "LOADED" &&
      this.data.mapDetail
    )
      this.setData({ mapSheetMode: "EXPANDED" as const });
  },

  onMapToggleDetailInfo() {
    if (
      this.data.mapCardPhase === "CLOSING" ||
      this.data.mapDetailPhase !== "LOADED" ||
      !this.data.mapDetail
    )
      return;
    this.setData({
      mapSheetMode:
        this.data.mapSheetMode === "EXPANDED"
          ? ("PREVIEW" as const)
          : ("EXPANDED" as const),
    });
  },

  onMapIgnoreDetailControl() {
    // Prevent detail controls from dismissing the selected card.
  },

  onMapContributorAvatarError() {
    this.setData({ mapContributorAvatarFailed: true });
  },

  async onToggleMapReport() {
    if (!this.data.mapSelectedLeadId || this.data.mapDetailPhase !== "LOADED")
      return;
    await this.ensurePublicMapReportClient().toggle();
  },

  async onCancelMapReport() {
    await this.ensurePublicMapReportClient().cancel();
  },

  onSelectTab(event: WechatMiniprogram.BaseEvent) {
    if (this.data.generationState === "generating") return;
    const tab = event.currentTarget.dataset.tab as MainTab | undefined;
    if (!tab) return;
    if (tab !== "map" && this.data.currentView === "map-preview") {
      publicMapDetailPreparationSuspended.add(this);
      publicMapClients.get(this)?.client.invalidatePreparedDetails();
      publicMapClients.get(this)?.client.clearSelection();
      publicMapOverlayTouches.delete(this);
      publicMapClusterPickerScrollTops.delete(this);
      publicMapClusterPickerRenderTokens.delete(this);
      publicMapClusterPickerMetadataLoaders.get(this)?.cancel();
      publicMapClusterPickerMetadataLoaders.delete(this);
      this.setData({
        mapClusterPickerOpen: false,
        mapClusterPickerRefreshing: false,
        mapClusterPickerItems: [],
      });
      this.clearNativeMapTransition();
      publicMapNativePendingClusters.delete(this);
      this.deactivateNativeMapSurface();
    }
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
      publicMapDetailPreparationSuspended.delete(this);
      this.activateNativeMapSurface();
      this.setData({
        activeTab: tab,
        currentView: "map-preview",
        modalView: "" as const,
      });
      this.refreshPublicMapOnEntry();
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
      void Promise.all([
        this.refreshCloudRecords(),
        this.refreshCandidateUploads(),
        this.refreshMapContributionConsent(),
      ]).finally(() => void this.refreshHumanAssistance());
    }
  },

  ensureHumanAssistanceClient(): HumanAssistanceClient {
    return humanAssistanceClient;
  },

  syncHumanAssistanceUi(recordId = "") {
    const requests = this.ensureHumanAssistanceClient().visibleRequests;
    const selected = this.data
      .humanAssistanceSelected as HumanAssistanceRequestView | null;
    const stillSelected =
      requests.find(
        (item: HumanAssistanceRequestView) =>
          item.requestId === selected?.requestId,
      ) ?? null;
    this.setData({
      humanAssistanceRequests: requests,
      humanAssistanceCurrent:
        requests.find(
          (item: HumanAssistanceRequestView) => item.recordId === recordId,
        ) ?? null,
      humanAssistanceSelected: stillSelected,
      ...(selected &&
      !stillSelected &&
      this.data.modalView === "human-assistance"
        ? {
            modalView: this.data.humanAssistanceReturnModal as ModalView,
            humanAssistanceReturnModal: "" as const,
          }
        : {}),
    });
  },

  async refreshHumanAssistance(
    recordId = "",
    submissionVersion: number | string = 0,
  ) {
    const versions = new Map<string, number | string>();
    for (const record of this.data.cloudClues as CloudRecordViewModel[]) {
      if (
        record.recordId &&
        Number.isInteger(record.submissionVersion) &&
        Number(record.submissionVersion) > 0
      )
        versions.set(record.recordId, Number(record.submissionVersion));
    }
    try {
      for (const draft of draftRepository.readAll()) {
        const version =
          draft.currentVerificationVersion ??
          draft.evidenceSubmissionVersion ??
          (draft.uploadStatus === "uploaded" ? 1 : 0);
        if (draft.cloudRecordId && version > 0)
          versions.set(draft.cloudRecordId, version);
      }
    } catch {
      // Assistance is optional; private upload success remains authoritative.
    }
    if (
      recordId &&
      ((typeof submissionVersion === "number" && submissionVersion > 0) ||
        (typeof submissionVersion === "string" && submissionVersion.length > 0))
    )
      versions.set(recordId, submissionVersion);
    for (const upload of this.data
      .candidateUploads as readonly CandidateUploadView[])
      if (upload.lifecycle === "ACTIVE")
        versions.set(upload.candidateRecordRef, upload.observationVersion);
    await this.ensureHumanAssistanceClient().refresh(versions);
    this.syncHumanAssistanceUi(recordId);
  },

  onOpenHumanAssistance(event: WechatMiniprogram.BaseEvent) {
    const requestId = String(event.currentTarget.dataset.requestId || "");
    const selected = this.ensureHumanAssistanceClient().visibleRequests.find(
      (item: HumanAssistanceRequestView) => item.requestId === requestId,
    );
    if (!selected) {
      this.syncHumanAssistanceUi();
      return;
    }
    this.setData({
      humanAssistanceSelected: selected,
      humanAssistanceReturnModal:
        this.data.modalView === "board-upload-submitted"
          ? ("board-upload-submitted" as const)
          : ("" as const),
      humanAssistanceError: "",
      modalView: "human-assistance" as const,
    });
  },

  onCloseHumanAssistance() {
    this.setData({
      modalView: this.data.humanAssistanceReturnModal as ModalView,
      humanAssistanceReturnModal: "" as const,
      humanAssistanceSelected: null,
      humanAssistanceError: "",
    });
  },

  async onAnswerHumanAssistance(event: WechatMiniprogram.BaseEvent) {
    const answer = String(event.currentTarget.dataset.answer || "");
    if (
      !["SAME_BOARD", "DIFFERENT_BOARD", "CANNOT_TELL", "SKIP"].includes(
        answer,
      ) ||
      this.data.humanAssistanceBusy
    )
      return;
    const selected = this.data
      .humanAssistanceSelected as HumanAssistanceRequestView | null;
    if (!selected) return;
    this.setData({ humanAssistanceBusy: true, humanAssistanceError: "" });
    try {
      const result = await this.ensureHumanAssistanceClient().answer(
        selected.requestId,
        answer as HumanAssistanceAnswer,
      );
      if (result === "ANSWERED") {
        this.onCloseHumanAssistance();
        this.syncHumanAssistanceUi();
      } else {
        this.setData({
          humanAssistanceError: "暂时无法保存回答，上传结果不受影响。",
        });
      }
    } finally {
      this.setData({ humanAssistanceBusy: false });
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
      await Promise.all([
        this.refreshCloudRecords(),
        ...(this.data.currentView === "contributions"
          ? [
              this.refreshCandidateUploads(),
              this.refreshMapContributionConsent(),
            ]
          : []),
      ]);
      if (this.data.currentView === "contributions")
        await this.refreshHumanAssistance();
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
    const candidate = (
      this.data.candidateUploads as readonly CandidateUploadViewModel[]
    ).find((item) => item.candidateRecordRef === boardId);
    const contribution = (this.data.contributions as DraftViewModel[]).find(
      (item) => item.boardId === boardId,
    );
    swipeStartX =
      local?.swipeX ??
      cloud?.swipeX ??
      candidate?.swipeX ??
      contribution?.swipeX ??
      0;
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
    const candidate = (
      this.data.candidateUploads as readonly CandidateUploadViewModel[]
    ).find((item) => item.candidateRecordRef === boardId);
    const contribution = (this.data.contributions as DraftViewModel[]).find(
      (item) => item.boardId === boardId,
    );
    this.setDraftSwipe(
      boardId,
      (local?.swipeX ??
        cloud?.swipeX ??
        candidate?.swipeX ??
        contribution?.swipeX ??
        0) <= -36
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
      (
        this.data.candidateUploads as readonly CandidateUploadViewModel[]
      ).forEach((record, index) => {
        if (record.swipeX !== 0)
          updates[`candidateUploads[${index}].swipeX`] = 0;
      });
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
    const candidateIndex = (
      this.data.candidateUploads as readonly CandidateUploadViewModel[]
    ).findIndex((record) => record.candidateRecordRef === boardId);
    if (candidateIndex >= 0)
      updates[`candidateUploads[${candidateIndex}].swipeX`] = swipeX;
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
      (this.data.candidateUploads as readonly CandidateUploadViewModel[]).some(
        (record) => record.swipeX < 0,
      ) ||
      (this.data.contributions as DraftViewModel[]).some(
        (record) => record.swipeX < 0,
      );
    if (!hasOpenDraft) return;
    this.setDraftSwipe("", 0);
  },

  onDeleteDraft(event: WechatMiniprogram.BaseEvent) {
    const boardId = event.currentTarget.dataset.boardId as string | undefined;
    if (!boardId) return;
    try {
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
          pendingDirectUploads: [],
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
