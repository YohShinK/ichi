import {
  SYNTHETIC_PUBLIC_MARKERS,
  SyntheticPublicMapService,
} from "../../platform/public-map-synthetic-service.js";
import type {
  PublicViewportRequest,
  PublicDetailRequest,
} from "../../platform/public-map-contract.js";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PRODUCTION_MAP_TERMS,
  UPLOAD_SHARING_DISCLOSURE_VERSION,
} from "../../platform/production-map-service.js";

import {
  LOCAL_DRAW_DRAFTS_KEY,
  type LocalDrawDraft,
} from "../../platform/local-draw-drafts.js";
import {
  ACTIVE_DRAFT_BOARD_KEY,
  RECOGNITION_VIEW_KEY,
} from "../../platform/navigation-state.js";
import type { RecognitionDraftValidation } from "../../platform/recognition-flow.js";
import { clusterStressFixture } from "../../../../../tests/fixtures/public-map-cluster-picker.fixture.js";
import { HumanAssistanceClient } from "../../platform/human-assistance-client.js";
import { CURRENT_LOCATION_MARKER_ID } from "../../platform/public-map-location.js";
import { projectNativeMapMarkers } from "../../platform/public-map-native-presentation.js";

const testMapLocationResult = (
  latitude: number,
  longitude: number,
  accuracy: number,
): WechatMiniprogram.GetLocationSuccessCallbackResult => ({
  latitude,
  longitude,
  accuracy,
  altitude: 0,
  speed: 0,
  horizontalAccuracy: accuracy,
  verticalAccuracy: accuracy,
  errMsg: "getLocation:ok",
});

type PageData = Record<string, unknown>;
type PageDefinition = { data: PageData } & Record<string, unknown>;

interface RuntimePage {
  data: PageData;
  setData(update: Record<string, unknown>, callback?: () => void): void;
}

const validationOf = (page: RuntimePage): RecognitionDraftValidation =>
  page.data.recognitionValidation as RecognitionDraftValidation;

interface ModalRequest {
  readonly success?: (result: { readonly confirm: boolean }) => void;
}

const stored = new Map<string, unknown>();
let definition: PageDefinition;
let throwReads = false;
let throwWrites = false;
const modalRequests: ModalRequest[] = [];
const cloudCallFunctionMock = vi.fn();
let cameraCaptureCount = 0;
let recognitionResult: unknown;
let quotaRemaining = 5;
let locationFailure = false;
let locationRequestCount = 0;
let cameraAuthorizationCount = 0;
let cameraPermissionState: boolean | undefined = true;
let cloudRecordsResult: unknown[] = [];
let profileComplete = true;
let profileHasAvatar = true;
let profileNickname = "ICHI 玩家";
let profileAvatarUrlAvailable = true;
let accountBootstrapFailure = false;
const showShareMenuMock = vi.fn();
const hideShareMenuMock = vi.fn();
let copyUrlListener: (() => { readonly query: string }) | undefined;
const onCopyUrlMock = vi.fn(
  (listener: () => { readonly query: string }): void => {
    copyUrlListener = listener;
  },
);
const offCopyUrlMock = vi.fn((): void => {
  copyUrlListener = undefined;
});

describe("TASK-V2-19 Human Assistance page coverage", () => {
  it("opens from upload success and returns there even when answering fails", async () => {
    const page = createRuntimePage();
    const client = new HumanAssistanceClient({
      listMyRequests: async () => [
        {
          requestId: "synthetic-ha-1",
          recordId: "synthetic-upload-1",
          submissionVersion: 2,
          expiresAt: Date.now() + 60_000,
          state: "PENDING" as const,
          currentBoardLabel: "这次上传",
          candidateBoardLabel: "上次版面",
        },
      ],
      answer: async () => ({ ok: false }),
    });
    (page as unknown as Record<string, unknown>).ensureHumanAssistanceClient =
      () => client;
    page.setData({ modalView: "board-upload-submitted" });
    await call(page, "refreshHumanAssistance", "synthetic-upload-1", 2);
    expect(page.data.humanAssistanceCurrent).toMatchObject({
      requestId: "synthetic-ha-1",
    });
    call(
      page,
      "onOpenHumanAssistance",
      baseEvent({ requestId: "synthetic-ha-1" }),
    );
    expect(page.data.modalView).toBe("human-assistance");
    await call(page, "onAnswerHumanAssistance", baseEvent({ answer: "SKIP" }));
    expect(page.data.humanAssistanceError).toContain("上传结果不受影响");
    call(page, "onCloseHumanAssistance");
    expect(page.data.modalView).toBe("board-upload-submitted");
    expect(cloudCallFunctionMock).not.toHaveBeenCalled();
  });

  it("shows the My Uploads entry only for a current owner request", async () => {
    const page = createRuntimePage();
    const client = new HumanAssistanceClient({
      listMyRequests: async () => [
        {
          requestId: "synthetic-ha-2",
          recordId: "synthetic-upload-2",
          submissionVersion: 3,
          expiresAt: Date.now() + 60_000,
          state: "PENDING" as const,
          currentBoardLabel: "当前版面",
          candidateBoardLabel: "候选版面",
        },
      ],
      answer: async () => ({ ok: true }),
    });
    (page as unknown as Record<string, unknown>).ensureHumanAssistanceClient =
      () => client;
    page.setData({
      currentView: "contributions",
      cloudClues: [{ recordId: "synthetic-upload-2", submissionVersion: 3 }],
    });
    await call(page, "refreshHumanAssistance");
    expect(page.data.humanAssistanceRequests).toHaveLength(1);
    call(
      page,
      "onOpenHumanAssistance",
      baseEvent({ requestId: "synthetic-ha-2" }),
    );
    await call(
      page,
      "onAnswerHumanAssistance",
      baseEvent({ answer: "CANNOT_TELL" }),
    );
    expect(page.data.humanAssistanceRequests).toEqual([]);
    expect(page.data.modalView).toBe("");
  });
});

describe("unresolved cluster picker interaction", () => {
  const setup = (members: typeof clusterStressFixture.sameCoordinate) => {
    const page = createRuntimePage();
    const first = members[0]!;
    const cluster = {
      ...first,
      markerId: 91919,
      kind: "CLUSTER",
      clusterKey: "fixture-cluster",
      memberLeadIds: members.map((member) => member.publicLeadId),
      latitude: first.latitude,
      longitude: first.longitude,
      realLatitude: first.latitude,
      realLongitude: first.longitude,
      selected: false,
    };
    page.setData({
      mapMarkers: members,
      mapNativeMarkerViews: [cluster],
      mapNativeScale: 18,
      mapNativeInteractionState: "IDLE",
    });
    const selectLead = vi.fn(async () => undefined);
    const clearSelection = vi.fn();
    (page as unknown as Record<string, unknown>).ensurePublicMapClient = vi.fn(
      () => ({
        state: { detail: { selectedPublicLeadId: null, phase: "IDLE" } },
        selectLead,
        clearSelection,
      }),
    );
    (
      page as unknown as Record<string, unknown>
    ).loadPublicMapAuthorizationStatus = vi.fn();
    (page as unknown as Record<string, unknown>).startNativeMapScaleSampling =
      vi.fn();
    (page as unknown as Record<string, unknown>).animateNativeMapCenterTo =
      vi.fn();
    return { page, cluster, selectLead, clearSelection };
  };

  it("keeps twenty real-position choices while switching directly between details", () => {
    const { page, cluster, selectLead } = setup(
      clusterStressFixture.sameCoordinate,
    );
    call(page, "activateNativeMapMarker", cluster.markerId);
    expect(page.data.mapClusterPickerOpen).toBe(true);
    expect((page.data.mapClusterPickerItems as unknown[]).length).toBe(20);
    expect(page.data.mapNativeMarkerViews).toMatchObject([
      {
        kind: "CLUSTER",
        latitude: cluster.realLatitude,
        longitude: cluster.realLongitude,
      },
    ]);
    call(
      page,
      "onSelectMapClusterPickerItem",
      baseEvent({ leadId: "stress-13" }),
    );
    expect(selectLead).toHaveBeenCalledExactlyOnceWith("stress-13");
    expect(page.data.mapClusterPickerOpen).toBe(true);
    expect((page.data.mapClusterPickerItems as unknown[]).length).toBe(20);
    expect(page.data.mapSheetMode).toBe("PREVIEW");
    call(
      page,
      "onSelectMapClusterPickerItem",
      baseEvent({ leadId: "stress-17" }),
    );
    expect(selectLead).toHaveBeenNthCalledWith(2, "stress-17");
    expect(page.data.mapClusterPickerOpen).toBe(true);
  });

  it.each(["tap", "drag"])(
    "closes both panels only for an outside %s",
    (kind) => {
      const { page, cluster, clearSelection } = setup(
        clusterStressFixture.sameCoordinate,
      );
      call(page, "activateNativeMapMarker", cluster.markerId);
      page.setData({
        mapCardPhase: "OPEN",
        mapDetailPhase: "LOADING",
        mapSheetMode: "PREVIEW",
      });
      call(page, "onMapOverlayTouchStart");
      call(page, "onMapClusterPickerOutsideTouchStart");
      call(
        page,
        kind === "tap"
          ? "onMapClusterPickerOutsideDetailTap"
          : "onMapClusterPickerOutsideTouchMove",
      );
      expect(page.data.mapClusterPickerOpen).toBe(false);
      expect(page.data.mapCardPhase).toBe("CLOSED");
      expect(clearSelection).toHaveBeenCalled();
    },
  );

  it("selects a picker row after an observed touch end while ignoring companion map events", () => {
    const { page, cluster, selectLead, clearSelection } = setup(
      clusterStressFixture.sameCoordinate,
    );
    call(page, "activateNativeMapMarker", cluster.markerId);
    clearSelection.mockClear();
    call(page, "onMapOverlayTouchStart");
    call(page, "onMapOverlayTouchEnd");
    call(
      page,
      "onSelectMapClusterPickerItem",
      baseEvent({ leadId: "stress-13" }),
    );
    call(page, "onMapNativeTap");
    call(page, "onMapNativeRegionChange", {
      detail: { type: "begin", causedBy: "gesture", scale: 18 },
    });
    expect(selectLead).toHaveBeenCalledExactlyOnceWith("stress-13");
    expect(clearSelection).not.toHaveBeenCalled();
    expect(page.data.mapClusterPickerOpen).toBe(true);
    expect(page.data.mapCardPhase).toBe("OPENING");
    expect(page.data.mapSheetMode).toBe("PREVIEW");
  });

  it.each(["picker", "detail", "both"])(
    "keeps %s open through internal taps, drags and late native gesture events",
    (surface) => {
      const { page, cluster } = setup(clusterStressFixture.sameCoordinate);
      if (surface !== "detail")
        call(page, "activateNativeMapMarker", cluster.markerId);
      if (surface !== "picker")
        page.setData({
          mapCardPhase: "OPEN",
          mapDetailPhase: "LOADED",
          mapSheetMode: "EXPANDED",
        });
      call(page, "onMapOverlayTouchStart");
      call(page, "onMapOverlayTouchMove");
      call(page, "onMapNativeRegionChange", {
        detail: { type: "begin", causedBy: "gesture", scale: 18 },
      });
      call(page, "onMapNativeTap");
      call(page, "onMapOverlayTouchEnd");
      call(page, "onMapNativeRegionChange", {
        detail: { type: "end", causedBy: "drag", scale: 18 },
      });
      call(page, "onMapNativeTap");
      expect(page.data.mapClusterPickerOpen).toBe(surface !== "detail");
      if (surface !== "picker") {
        expect(page.data.mapCardPhase).toBe("OPEN");
        // Preserve the existing expanded-card tap-to-collapse interaction.
        call(page, "onMapCardTap");
        expect(page.data.mapSheetMode).toBe("PREVIEW");
        expect(page.data.mapCardPhase).toBe("OPEN");
      }
      expect(page.data.mapNativeInteractionState).toBe(
        surface === "detail" ? "IDLE" : "CLUSTER_SELECTED",
      );
    },
  );

  it("refreshes the visible metadata window, preserves loaded rows on failure, and ends the spinner", async () => {
    const { page } = setup(clusterStressFixture.sameCoordinate);
    const read = vi.fn(async (id: string) => {
      void id;
      return null;
    });
    (page as unknown as Record<string, unknown>).ensurePublicMapClient =
      () => ({ readLeadForPicker: read });
    (page as unknown as Record<string, unknown>).prepareMapClusterPickerImages =
      vi.fn(async () => undefined);
    page.setData({
      currentView: "map-preview",
      mapClusterPickerOpen: true,
      mapClusterPickerItems: clusterStressFixture.sameCoordinate.map(
        (m, i) => ({
          ...m,
          pickerMetadataPhase: "LOADED",
          pickerNotePreview: "已核验备注 " + i,
          pickerUploadedAtLabel: "上传 10/06 03:26",
        }),
      ),
    });
    call(page, "onMapClusterPickerScroll", { detail: { scrollTop: 62 * 10 } });
    call(page, "onMapClusterPickerRefresh");
    call(page, "onMapClusterPickerRefresh");
    expect(page.data.mapClusterPickerRefreshing).toBe(true);
    for (let i = 0; i < 40; i++) await Promise.resolve();
    expect(read.mock.calls.map((args) => args[0])).toEqual(
      clusterStressFixture.sameCoordinate
        .slice(10, 18)
        .map((m) => m.publicLeadId),
    );
    expect(page.data.mapClusterPickerRefreshing).toBe(false);
    expect(page.data.mapClusterPickerOpen).toBe(true);
    expect(
      (page.data.mapClusterPickerItems as { pickerNotePreview: string }[])[10]!
        .pickerNotePreview,
    ).toBe("已核验备注 10");
  });

  it("refreshes short lists even after native overscroll reports a position beyond their rows", async () => {
    const { page } = setup(clusterStressFixture.sameCoordinate);
    const read = vi.fn(async (id: string) => {
      void id;
      return null;
    });
    (page as unknown as Record<string, unknown>).ensurePublicMapClient =
      () => ({ readLeadForPicker: read });
    (page as unknown as Record<string, unknown>).prepareMapClusterPickerImages =
      vi.fn(async () => undefined);
    page.setData({
      currentView: "map-preview",
      mapClusterPickerOpen: true,
      mapClusterPickerItems: clusterStressFixture.sameCoordinate.slice(0, 2),
    });
    call(page, "onMapClusterPickerScroll", { detail: { scrollTop: 10000 } });
    call(page, "onMapClusterPickerRefresh");
    for (let i = 0; i < 30; i++) await Promise.resolve();
    expect(read).toHaveBeenCalledTimes(2);
    expect(page.data.mapClusterPickerRefreshing).toBe(false);
    expect(page.data.mapClusterPickerOpen).toBe(true);
  });

  it("closes without selecting or relocating the cluster", () => {
    const { page, cluster, selectLead } = setup(
      clusterStressFixture.sameCoordinate.slice(0, 2),
    );
    call(page, "activateNativeMapMarker", cluster.markerId);
    expect(page.data.mapClusterPickerOpen).toBe(true);
    call(page, "onCloseMapClusterPicker");
    expect(page.data.mapClusterPickerOpen).toBe(false);
    expect(selectLead).not.toHaveBeenCalled();
    expect(page.data.mapNativeMarkerViews).toMatchObject([
      {
        kind: "CLUSTER",
        latitude: cluster.realLatitude,
        longitude: cluster.realLongitude,
      },
    ]);
  });

  it.each(["viewport-loading", "bounded-page"])(
    "keeps rendered cluster rows when %s has not included their summaries",
    async () => {
      const { page, cluster, clearSelection } = setup(
        clusterStressFixture.sameCoordinate.slice(0, 2),
      );
      const read = vi.fn(async () => null);
      (page as unknown as Record<string, unknown>).ensurePublicMapClient =
        () => ({
          state: {
            items: [],
            detail: { selectedPublicLeadId: null, phase: "IDLE" },
          },
          clearSelection,
          readLeadForPicker: read,
          isPublicLeadUnavailable: () => false,
        });
      (
        page as unknown as Record<string, unknown>
      ).prepareMapClusterPickerImages = vi.fn(async () => undefined);
      page.setData({ currentView: "map-preview", mapNativeScale: 10 });
      call(page, "activateNativeMapMarker", cluster.markerId);
      await vi.waitFor(() => expect(read).toHaveBeenCalledTimes(2));
      expect(page.data.mapClusterPickerItems).toHaveLength(2);
      expect(page.data.mapClusterPickerOpen).toBe(true);
      expect(read).toHaveBeenCalledWith(cluster.memberLeadIds[0], {
        forceRefresh: false,
        allowRenderedLead: true,
      });
    },
  );

  it("removes only a confirmed unavailable member when viewport summaries are absent", async () => {
    const { page, cluster, clearSelection } = setup(
      clusterStressFixture.sameCoordinate.slice(0, 2),
    );
    const removedId = cluster.memberLeadIds[0]!;
    const read = vi.fn(async () => null);
    (page as unknown as Record<string, unknown>).ensurePublicMapClient =
      () => ({
        state: {
          items: [],
          detail: { selectedPublicLeadId: null, phase: "IDLE" },
        },
        clearSelection,
        readLeadForPicker: read,
        isPublicLeadUnavailable: (id: string) => id === removedId,
      });
    (page as unknown as Record<string, unknown>).prepareMapClusterPickerImages =
      vi.fn(async () => undefined);
    page.setData({ currentView: "map-preview" });
    call(page, "activateNativeMapMarker", cluster.markerId);
    await vi.waitFor(() => expect(read).toHaveBeenCalledTimes(2));
    expect(page.data.mapClusterPickerItems).toMatchObject([
      { publicLeadId: cluster.memberLeadIds[1] },
    ]);
    expect(page.data.mapClusterPickerOpen).toBe(true);
  });

  it("closes the empty shell when every rendered member is confirmed unavailable", async () => {
    const { page, cluster, clearSelection } = setup(
      clusterStressFixture.sameCoordinate.slice(0, 2),
    );
    const read = vi.fn(async () => null);
    (page as unknown as Record<string, unknown>).ensurePublicMapClient =
      () => ({
        state: {
          items: [],
          detail: { selectedPublicLeadId: null, phase: "IDLE" },
        },
        clearSelection,
        readLeadForPicker: read,
        isPublicLeadUnavailable: () => true,
      });
    (page as unknown as Record<string, unknown>).prepareMapClusterPickerImages =
      vi.fn(async () => undefined);
    page.setData({ currentView: "map-preview" });
    call(page, "activateNativeMapMarker", cluster.markerId);
    await vi.waitFor(() => expect(page.data.mapClusterPickerOpen).toBe(false));
    expect(page.data.mapClusterPickerItems).toEqual([]);
    expect(page.data.mapSheetMode).toBe("CLOSED");
  });

  it("zooms a cluster whose two members can separate naturally at max scale", () => {
    const { page, cluster, selectLead } = setup(
      clusterStressFixture.separableStreet.slice(0, 2),
    );
    page.setData({ mapNativeScale: 12 });
    call(page, "activateNativeMapMarker", cluster.markerId);
    expect(page.data.mapClusterPickerOpen).toBe(false);
    expect(Number(page.data.mapNativeScale)).toBeGreaterThan(12);
    expect(page.data.mapNativeInteractionState).toBe("CAMERA_ANIMATING");
    expect(selectLead).not.toHaveBeenCalled();
    call(page, "onUnload");
  });
});
const moveToLocationMock = vi.fn();
const profileAvatarFileId =
  "cloud://test-env/profile-avatars/current-avatar.jpg";
const app = {
  globalData: {} as {
    pendingBoardImage?: { tempFilePath: string; size: number };
    pendingBoardAcquisition?: "camera";
    pendingBoardLocation?: {
      latitude: number;
      longitude: number;
      accuracy: number;
      coordinateSystem: "gcj02";
      obtainedAt: number;
    };
    accountProfile?: unknown;
    accountQuota?: unknown;
    pendingRecognitionIdempotencyKey?: string;
    pendingRecognitionJobId?: string;
    pendingRecognitionJobToken?: string;
  },
};

const recognitionTransport = () => ({
  contractVersion: "1.0.0",
  requestId: "behavior-recognition",
  status: "needs_user_input",
  draft: {
    price: { amount: 650 },
    tiers: [
      ["A", 2, 0, 0.98],
      ["B", 3, 0, 0.97],
      ["C", 5, 0, 0.96],
      ["D", 12, 1, 0.95],
      ["E", 18, 1, 0.6],
      ["F", 25, 0, 0.94],
    ].map(([tier, total, covered, confidence]) => ({
      componentId: `tier-${String(tier).toLowerCase()}`,
      label: tier,
      confidence,
      totalTickets: Number(total),
      pastedTickets: Number(covered),
      remainingTickets: Number(total) - Number(covered),
      slotObservation: {
        totalSlots: total,
        openSlots: Number(total) - Number(covered),
        coveredSlots: covered,
        unknownSlots: 0,
      },
    })),
    blocks: [],
  },
  issues: [{ code: "TIER_LABEL_LOW_CONFIDENCE" }],
  imageHandling: {
    retention: "ephemeral",
    published: false,
    storedInSessionHistory: false,
  },
});

const setAtPath = (
  root: PageData,
  sourcePath: string,
  value: unknown,
): void => {
  const path = sourcePath.replace(/\[(\d+)\]/g, ".$1").split(".");
  let cursor: Record<string, unknown> = root;
  path.slice(0, -1).forEach((part) => {
    const next = cursor[part];
    if (!next || typeof next !== "object") cursor[part] = {};
    cursor = cursor[part] as Record<string, unknown>;
  });
  const last = path.at(-1);
  if (last) cursor[last] = value;
};

const createRuntimePage = (): RuntimePage => {
  const page: RuntimePage = {
    data: structuredClone(definition.data),
    setData(update, callback) {
      Object.entries(update).forEach(([path, value]) =>
        setAtPath(this.data, path, value),
      );
      callback?.();
    },
  };
  Object.entries(definition).forEach(([key, value]) => {
    if (key !== "data")
      (page as unknown as Record<string, unknown>)[key] = value;
  });
  return page;
};

const call = (page: RuntimePage, method: string, ...args: unknown[]): unknown =>
  (
    (page as unknown as Record<string, unknown>)[method] as (
      ...values: unknown[]
    ) => unknown
  ).call(page, ...args);

const baseEvent = (dataset: Record<string, unknown>): unknown => ({
  currentTarget: { dataset },
});

describe("account-bound map contribution terms", () => {
  const consent = {
    termsVersion: PRODUCTION_MAP_TERMS.version,
    scopeDigest: PRODUCTION_MAP_TERMS.scopeDigest,
    accepted: false,
    acceptedAt: null,
    status: "NOT_ACCEPTED",
  };

  it("rejects early calls even if the displayed seconds are altered, then rereads account consent", async () => {
    vi.useFakeTimers();
    const page = createRuntimePage();
    let accepted = false;
    cloudCallFunctionMock.mockImplementation(async ({ data }) => {
      if (data.command === "ACCEPT") {
        accepted = true;
        return { result: { ok: true, ...consent, accepted: true } };
      }
      return {
        result: {
          ok: true,
          ...consent,
          accepted,
          status: accepted ? "ACCEPTED" : "NOT_ACCEPTED",
          acceptedAt: accepted ? "2026-09-30T03:00:00Z" : null,
        },
      };
    });
    try {
      page.setData({ mapContributionConsent: consent });
      call(page, "onOpenMapContributionConsent");
      expect(page.data.mapContributionConsentSeconds).toBe(3);
      page.setData({ mapContributionConsentSeconds: 0 });
      await call(page, "onChooseMapContributionConsent");
      await vi.advanceTimersByTimeAsync(2_999);
      await call(page, "onChooseMapContributionConsent");
      expect(cloudCallFunctionMock).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(page.data.mapContributionConsentSeconds).toBe(0);
      await call(page, "onChooseMapContributionConsent");
      expect(page.data.modalView).toBe("");
      expect(page.data.mapContributionConsent).toMatchObject({
        accepted: true,
        status: "ACCEPTED",
      });
      const reopened = createRuntimePage();
      await call(reopened, "refreshMapContributionConsent");
      call(reopened, "onOpenMapContributionConsent");
      expect(reopened.data.modalView).toBe("");
      expect(reopened.data.mapContributionConsent).toMatchObject({
        accepted: true,
      });
      expect(
        cloudCallFunctionMock.mock.calls.filter(
          ([input]) => input.data.command === "ACCEPT",
        ),
      ).toHaveLength(1);
    } finally {
      call(page, "clearMapContributionConsentCountdown");
      vi.useRealTimers();
    }
  });

  it("restarts the full delay on reopening and cancels timers on hide", async () => {
    vi.useFakeTimers();
    const page = createRuntimePage();
    try {
      page.setData({ mapContributionConsent: consent });
      call(page, "onOpenMapContributionConsent");
      await vi.advanceTimersByTimeAsync(1_000);
      expect(page.data.mapContributionConsentSeconds).toBe(2);
      call(page, "onCloseModal");
      call(page, "onOpenMapContributionConsent");
      expect(page.data.mapContributionConsentSeconds).toBe(3);
      await vi.advanceTimersByTimeAsync(2_000);
      expect(page.data.mapContributionConsentSeconds).toBe(1);
      call(page, "onHide");
      expect(page.data.modalView).toBe("");
      expect(vi.getTimerCount()).toBe(0);
      await call(page, "onChooseMapContributionConsent");
      expect(cloudCallFunctionMock).not.toHaveBeenCalled();
    } finally {
      call(page, "clearMapContributionConsentCountdown");
      vi.useRealTimers();
    }
  });

  it("keeps failed consent unsaved and allows retry after the delay", async () => {
    vi.useFakeTimers();
    const page = createRuntimePage();
    cloudCallFunctionMock.mockResolvedValue({ result: { ok: false } });
    try {
      page.setData({ mapContributionConsent: consent });
      call(page, "onOpenMapContributionConsent");
      await vi.advanceTimersByTimeAsync(3_000);
      await call(page, "onChooseMapContributionConsent");
      expect(page.data.mapContributionConsent).toMatchObject({
        accepted: false,
      });
      expect(page.data.modalView).toBe("map-contribution-consent");
      expect(page.data.mapContributionConsentBusy).toBe(false);
      expect(page.data.mapContributionConsentError).toBe(
        "选择未保存，请稍后重试。",
      );
      await call(page, "onChooseMapContributionConsent");
      expect(cloudCallFunctionMock).toHaveBeenCalledTimes(2);
    } finally {
      call(page, "onCloseModal");
      vi.useRealTimers();
    }
  });
});

const touchEvent = (
  boardId: string,
  clientX: number,
  phase: "active" | "ended",
  clientY = 0,
): unknown => ({
  currentTarget: { dataset: { boardId } },
  touches: phase === "active" ? [{ clientX, clientY }] : [],
  changedTouches: phase === "ended" ? [{ clientX, clientY }] : [],
});

const ticketPeelEvent = (
  tier: string,
  clientX: number,
  phase: "active" | "ended",
  timeStamp: number,
): unknown => ({
  currentTarget: { dataset: { tier, disabled: false } },
  timeStamp,
  touches: phase === "active" ? [{ clientX }] : [],
  changedTouches: phase === "ended" ? [{ clientX }] : [],
});

const enterDraw = (page: RuntimePage): void => {
  call(page, "onLoad");
  page.setData({ currentView: "recognition-result" });
  call(page, "onRecognitionIpInput", { detail: { value: "秋叶原 0812" } });
  call(page, "onRecognitionPriceInput", { detail: { value: "650" } });
  call(page, "onConfirmRecognition");
  call(page, "onConfirmGrandPrizes");
};

const confirmR2Board = async (page: RuntimePage): Promise<void> => {
  if (page.data.recognitionPrice === null) {
    call(page, "onRecognitionPriceInput", { detail: { value: "650" } });
  }
  call(page, "onConfirmRecognition");
  await call(page, "onConfirmGrandPrizes");
};

const confirmFrozenBoard = async (page: RuntimePage): Promise<void> => {
  const pending = call(page, "onCaptureBoardMedia") as Promise<void>;
  await Promise.resolve();
  await vi.advanceTimersByTimeAsync(500);
  await Promise.resolve();
  await vi.advanceTimersByTimeAsync(500);
  await pending;
};

beforeAll(async () => {
  vi.stubGlobal("wx", {
    env: { USER_DATA_PATH: "/user-data" },
    getStorageSync(key: string) {
      if (throwReads) throw new Error("read failed");
      return stored.get(key) ?? "";
    },
    setStorageSync(key: string, value: string) {
      if (throwWrites) throw new Error("write failed");
      stored.set(key, value);
    },
    removeStorageSync(key: string) {
      if (throwWrites) throw new Error("remove failed");
      stored.delete(key);
    },
    getStorageInfoSync() {
      if (throwReads) throw new Error("info failed");
      return { currentSize: 1, limitSize: 10240 };
    },
    getWindowInfo: () => ({ statusBarHeight: 20, safeArea: { top: 20 } }),
    getMenuButtonBoundingClientRect: () => ({ bottom: 83 }),
    getAccountInfoSync: () => ({
      miniProgram: { envVersion: "develop" },
    }),
    showToast: vi.fn(),
    showShareMenu: showShareMenuMock,
    hideShareMenu: hideShareMenuMock,
    onCopyUrl: onCopyUrlMock,
    offCopyUrl: offCopyUrlMock,
    showModal(options: ModalRequest) {
      modalRequests.push(options);
    },
    openSetting(options: {
      success?: (result: {
        authSetting: Record<string, boolean | undefined>;
      }) => void;
    }) {
      options.success?.({ authSetting: { "scope.camera": true } });
    },
    getSetting(options: {
      success?: (result: {
        authSetting: Record<string, boolean | undefined>;
      }) => void;
    }) {
      options.success?.({
        authSetting: { "scope.camera": cameraPermissionState },
      });
    },
    authorize(options: {
      scope: string;
      success?: () => void;
      fail?: (error: Error) => void;
    }) {
      cameraAuthorizationCount += 1;
      if (options.scope === "scope.camera") {
        cameraPermissionState = true;
        options.success?.();
        return;
      }
      options.fail?.(new Error("permission denied"));
    },
    vibrateShort: vi.fn(),
    chooseMedia(options: {
      success?: (result: { tempFiles: { tempFilePath: string }[] }) => void;
    }) {
      options.success?.({
        tempFiles: [{ tempFilePath: "/tmp/replacement-prize-ticket.jpg" }],
      });
    },
    createMapContext: () => ({
      moveToLocation: moveToLocationMock,
      getScale(options: { success?: (result: { scale: number }) => void }) {
        options.success?.({ scale: 12 });
      },
      getRegion(options: {
        success?: (result: {
          southwest: { latitude: number; longitude: number };
          northeast: { latitude: number; longitude: number };
        }) => void;
      }) {
        options.success?.({
          southwest: { latitude: 31.2, longitude: 121.4 },
          northeast: { latitude: 31.3, longitude: 121.5 },
        });
      },
    }),
    createCameraContext: () => ({
      takePhoto(options: {
        success?: (result: { tempImagePath: string }) => void;
      }) {
        cameraCaptureCount += 1;
        options.success?.({ tempImagePath: "/tmp/captured-board.jpg" });
      },
    }),
    getFileSystemManager: () => ({
      accessSync() {},
      saveFileSync(_tempFilePath: string, filePath?: string) {
        return filePath ?? "/user-data/ichi-profile-avatar.jpg";
      },
      unlinkSync() {},
      readFile(options: { success?: (result: { data: string }) => void }) {
        options.success?.({ data: "AQID" });
      },
      getFileInfo(options: { success?: (result: { size: number }) => void }) {
        options.success?.({ size: 4 });
      },
      unlink(options: { success?: () => void }) {
        options.success?.();
      },
    }),
    getImageInfo(options: {
      success?: (result: { width: number; height: number }) => void;
    }) {
      options.success?.({ width: 1080, height: 1440 });
    },
    getLocation(options: {
      success?: (result: {
        latitude: number;
        longitude: number;
        accuracy: number;
      }) => void;
      fail?: (error: Error) => void;
    }) {
      locationRequestCount += 1;
      if (locationFailure) {
        options.fail?.(new Error("permission denied"));
        return;
      }
      options.success?.({ latitude: 31.23, longitude: 121.47, accuracy: 12 });
    },
    cloud: {
      callFunction: cloudCallFunctionMock,
      downloadFile: vi.fn().mockResolvedValue({
        tempFilePath: "/tmp/downloaded-profile-avatar.jpg",
      }),
      uploadFile: vi.fn().mockResolvedValue({
        fileID: "cloud://test-env/recognition-temp/job-1/recognize-test.jpg",
      }),
      deleteFile: vi.fn().mockResolvedValue({ fileList: [] }),
    },
  });
  vi.stubGlobal("getApp", () => app);
  vi.stubGlobal("Page", (options: PageDefinition) => {
    definition = options;
  });
  await import("./index.js");
});

beforeEach(() => {
  stored.clear();
  throwReads = false;
  throwWrites = false;
  modalRequests.length = 0;
  cloudCallFunctionMock.mockReset();
  cloudCallFunctionMock.mockImplementation(
    async ({
      name,
      data,
    }: {
      name: string;
      data?: Record<string, unknown>;
    }) => {
      if (name === "bootstrap-account") {
        if (accountBootstrapFailure) {
          throw { errMsg: "request:fail timeout" };
        }
        return {
          result: {
            ok: true,
            data: {
              ichiId: "ICHI-001",
              nickname: profileNickname,
              profileState: profileComplete ? "complete" : "incomplete",
              created: false,
            },
          },
        };
      }
      if (name === "get-my-profile") {
        return {
          result: {
            ok: true,
            data: {
              ichiId: "ICHI-001",
              nickname: profileNickname,
              avatarState: profileComplete ? "wechat-authorized" : "default",
              ...(profileHasAvatar
                ? {
                    avatarFileId: profileAvatarFileId,
                    ...(profileAvatarUrlAvailable
                      ? { avatarUrl: "https://avatar.example/current.jpg" }
                      : {}),
                  }
                : {}),
              profileState: profileComplete ? "complete" : "incomplete",
            },
          },
        };
      }
      if (name === "get-quota-status") {
        return {
          result: {
            ok: true,
            data: {
              dateKey: "2026-08-19",
              limit: 5,
              used: 5 - quotaRemaining,
              reserved: 0,
              remaining: quotaRemaining,
              resetAt: "2026-08-19T16:00:00.000Z",
            },
          },
        };
      }
      if (name === "bind-wechat-profile") {
        profileComplete = true;
        profileNickname = String(data?.nickname ?? "微信玩家");
        if (data?.avatarFileId || data?.avatarUrl) profileHasAvatar = true;
        return {
          result: {
            ok: true,
            data: {
              ichiId: "ICHI-001",
              nickname: profileNickname,
              avatarState: profileHasAvatar ? "wechat-authorized" : "default",
              ...(profileHasAvatar
                ? {
                    avatarFileId: profileAvatarFileId,
                    avatarUrl: "https://avatar.example/updated.jpg",
                  }
                : {}),
              profileState: "complete",
            },
          },
        };
      }
      if (name === "get-my-records") {
        return {
          result: {
            ok: true,
            data: { records: cloudRecordsResult, hasMore: false },
          },
        };
      }
      if (name === "reserve-recognition") {
        if (quotaRemaining <= 0) {
          return {
            result: { ok: false, error: { code: "QUOTA_EXHAUSTED" } },
          };
        }
        return {
          result: {
            ok: true,
            data: {
              jobId: "recognition-job-1",
              jobToken: "recognition-job-token-for-tests",
              status: "reserved",
              quota: {
                dateKey: "2026-08-19",
                limit: 5,
                used: 5 - quotaRemaining,
                reserved: 1,
                remaining: Math.max(0, quotaRemaining - 1),
                resetAt: "2026-08-19T16:00:00.000Z",
              },
            },
          },
        };
      }
      if (name === "finalize-board-observation") {
        return {
          result: {
            ok: true,
            data: {
              recordId: String(
                data?.recordId ?? "record_0123456789abcdef0123456789abcdef",
              ),
              uploadSharingAcknowledged: Boolean(data?.uploadSharing),
              recordCode: "A1B2C3",
              boardId: String(data?.boardId ?? "cloud-board-1"),
              status: "private_saved",
              idempotent: false,
            },
          },
        };
      }
      if (name === "finalize-draw-update") {
        return {
          result: {
            ok: true,
            data: {
              recordId: String(data?.recordId ?? "record-test"),
              status: "verification_prepared",
              authoritativeDrawCount: 1,
            },
          },
        };
      }
      if (name === "release-recognition") {
        return {
          result: {
            ok: true,
            data: {
              jobId: String(data?.jobId ?? "recognition-job-1"),
              status: "recognized_released",
              released: true,
              quota: {
                dateKey: "2026-08-19",
                limit: 5,
                used: 5 - quotaRemaining,
                reserved: 0,
                remaining: quotaRemaining,
                resetAt: "2026-08-19T16:00:00.000Z",
              },
            },
          },
        };
      }
      if (name === "delete-my-record") {
        return {
          result: {
            ok: true,
            data: { deletionId: "record:private-1", status: "pending" },
          },
        };
      }
      if (name === "recognize-draw-tickets") {
        if (data?.action === "submit") {
          return {
            result: {
              ok: true,
              data: {
                recordId: "record_0123456789abcdef0123456789abcdef",
                submissionVersion: 1,
                boardId: "board-draw-1",
                status: "PENDING",
              },
            },
          };
        }
        return {
          result: {
            ok: true,
            data: {
              recordId: "record_0123456789abcdef0123456789abcdef",
              submissionVersion: 1,
              boardId: "board-draw-1",
              status: "VERIFIED",
              expected: { total: 1, tierCounts: { A: 1 } },
              observed: { total: 1, tierCounts: { A: 1 }, unknownTickets: 0 },
              mismatches: [],
            },
          },
        };
      }
      return { result: recognitionResult };
    },
  );
  cameraCaptureCount = 0;
  recognitionResult = recognitionTransport();
  quotaRemaining = 5;
  locationFailure = false;
  locationRequestCount = 0;
  cameraAuthorizationCount = 0;
  cameraPermissionState = true;
  cloudRecordsResult = [];
  profileComplete = true;
  profileHasAvatar = true;
  profileNickname = "ICHI 玩家";
  profileAvatarUrlAvailable = true;
  accountBootstrapFailure = false;
  showShareMenuMock.mockReset();
  hideShareMenuMock.mockReset();
  onCopyUrlMock.mockClear();
  offCopyUrlMock.mockClear();
  moveToLocationMock.mockReset();
  copyUrlListener = undefined;
  app.globalData = {};
  vi.useFakeTimers();
});

describe("V1-E page behavior", () => {
  it.each([true, false])(
    "distinguishes an intentional empty filter from temporary refresh emptiness (filtered=%s)",
    async (filtered) => {
      const page = createRuntimePage();
      const publicBinding = {
        id: 123,
        latitude: 31.23,
        longitude: 121.47,
        iconPath: "lead.png",
        alpha: 1,
        width: 120,
        height: 48,
        anchor: { x: 0.5, y: 1 },
      };
      page.setData({
        mapPhase: "VIEWPORT_REFRESHING",
        mapDiscoveryEmptyReason: filtered ? "当前筛选组合暂无公开线索" : "",
        mapNativeMarkers: [publicBinding],
        mapNativeDisplayMarkers: [publicBinding],
        canvasMarkerReady: true,
        mapCurrentLocation: {
          latitude: 31.23,
          longitude: 121.47,
          accuracy: 12,
          obtainedAt: Date.now(),
        },
      });
      call(
        page,
        "commitNativeMapProjection",
        projectNativeMapMarkers({
          markers: [],
          scale: 14,
          selectedPublicLeadId: "",
        }),
      );
      await vi.advanceTimersByTimeAsync(0);
      if (filtered) {
        expect(page.data.mapNativeMarkers).toEqual([]);
        expect(page.data.mapNativeDisplayMarkers).toMatchObject([
          { id: CURRENT_LOCATION_MARKER_ID },
        ]);
      } else {
        expect(page.data.mapNativeMarkers).toEqual([publicBinding]);
      }
      call(page, "onUnload");
    },
  );

  it("uses the checked current position for the dot and camera, while foreground refresh leaves the camera alone", async () => {
    const settings = vi.spyOn(wx, "getSetting").mockImplementation((o) => {
      o?.success?.({
        authSetting: { "scope.userLocation": true },
        subscriptionsSetting: { mainSwitch: true },
        errMsg: "getSetting:ok",
      });
    });
    const location = vi.spyOn(wx, "getLocation");
    const page = createRuntimePage();
    page.setData({ activeTab: "map", currentView: "map-preview" });
    call(page, "onMapNativeUpdated");
    await call(page, "onMapRecenter");
    expect(location).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "gcj02",
        isHighAccuracy: true,
        highAccuracyExpireTime: 8000,
      }),
    );
    expect(page.data.mapNativeDisplayMarkers).toMatchObject([
      { id: CURRENT_LOCATION_MARKER_ID, latitude: 31.23, longitude: 121.47 },
    ]);
    expect(page.data.mapNativeMarkers).toEqual([]);
    expect(page.data.mapMarkers).toEqual([]);
    expect(moveToLocationMock).toHaveBeenLastCalledWith({
      latitude: 31.23,
      longitude: 121.47,
    });
    location.mockImplementation((o) => {
      o.success?.(testMapLocationResult(31.231, 121.471, 10));
    });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(page.data.mapCurrentLocation).toMatchObject({
      latitude: 31.231,
      longitude: 121.471,
    });
    expect(moveToLocationMock).toHaveBeenCalledTimes(1);
    expect(page.data.mapNativeCenterLatitude).toBe(31.23);
    call(page, "onHide");
    expect(page.data.mapCurrentLocation).toBeNull();
    expect(page.data.mapNativeDisplayMarkers).toEqual([]);
    const calls = location.mock.calls.length;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(location).toHaveBeenCalledTimes(calls);
    call(page, "onUnload");
    settings.mockRestore();
    location.mockRestore();
  });

  it("allows coarse positioning with a matching uncertainty circle without changing public counts", async () => {
    const settings = vi.spyOn(wx, "getSetting").mockImplementation((o) => {
      o?.success?.({
        authSetting: { "scope.userLocation": true },
        subscriptionsSetting: { mainSwitch: true },
        errMsg: "getSetting:ok",
      });
    });
    const location = vi.spyOn(wx, "getLocation").mockImplementation((o) => {
      o.success?.(testMapLocationResult(30.406, 120.301, 1800));
    });
    const page = createRuntimePage();
    page.setData({
      mapNativeCenterLatitude: 30.394,
      mapNativeCenterLongitude: 120.301,
    });
    call(page, "onMapNativeUpdated");
    await call(page, "onMapRecenter");
    expect(page.data.mapLocationState).toBe("APPROXIMATE");
    expect(page.data.mapNativeLocationGranted).toBe(true);
    expect(page.data.mapCurrentLocation).toMatchObject({
      accuracy: 1800,
      approximate: true,
    });
    expect(page.data.mapCurrentLocationCircles).toMatchObject([
      { latitude: 30.406, longitude: 120.301, radius: 1800 },
    ]);
    expect(page.data.mapNativeCenterLatitude).toBe(30.406);
    expect(page.data.mapNativeDisplayMarkers).toHaveLength(1);
    expect(page.data.mapNativeMarkers).toEqual([]);
    expect(moveToLocationMock).toHaveBeenCalledWith({
      latitude: 30.406,
      longitude: 120.301,
    });
    call(page, "onHide");
    expect(page.data.mapCurrentLocationCircles).toEqual([]);
    call(page, "onUnload");
    settings.mockRestore();
    location.mockRestore();
  });

  it("accepts reduced iOS location permission without requiring precise permission", async () => {
    const settings = vi.spyOn(wx, "getSetting").mockImplementation((o) => {
      o?.success?.({
        authSetting: { "scope.userLocation": true },
        subscriptionsSetting: { mainSwitch: true },
        errMsg: "getSetting:ok",
      });
    });
    const nativeApi = wx as unknown as {
      getAppAuthorizeSetting?: () => {
        locationAuthorized: string;
        locationReducedAccuracy: boolean;
      };
    };
    const original = nativeApi.getAppAuthorizeSetting;
    nativeApi.getAppAuthorizeSetting = () => ({
      locationAuthorized: "authorized",
      locationReducedAccuracy: true,
    });
    const location = vi.spyOn(wx, "getLocation");
    const page = createRuntimePage();
    await call(page, "onMapRecenter");
    expect(page.data.mapLocationState).toBe("APPROXIMATE");
    expect(page.data.mapCurrentLocation).toMatchObject({ approximate: true });
    expect(location).toHaveBeenCalledOnce();
    call(page, "onUnload");
    if (original) nativeApi.getAppAuthorizeSetting = original;
    else delete nativeApi.getAppAuthorizeSetting;
    settings.mockRestore();
    location.mockRestore();
  });

  it("discards a location response arriving after the map is hidden", async () => {
    const settings = vi.spyOn(wx, "getSetting").mockImplementation((o) => {
      o?.success?.({
        authSetting: { "scope.userLocation": true },
        subscriptionsSetting: { mainSwitch: true },
        errMsg: "getSetting:ok",
      });
    });
    let deliver: (() => void) | undefined;
    const location = vi.spyOn(wx, "getLocation").mockImplementation((o) => {
      deliver = () => o.success?.(testMapLocationResult(30.4, 120.3, 10));
    });
    const page = createRuntimePage();
    const pending = call(page, "onMapRecenter");
    await Promise.resolve();
    call(page, "onHide");
    deliver?.();
    await pending;
    expect(page.data.mapCurrentLocation).toBeNull();
    expect(page.data.mapNativeLocationGranted).toBe(false);
    expect(page.data.mapNativeDisplayMarkers).toEqual([]);
    call(page, "onUnload");
    settings.mockRestore();
    location.mockRestore();
  });

  it("reconciles the latest PNG zoom without pan and cancels on map exit", async () => {
    vi.useFakeTimers();
    const page = createRuntimePage();
    page.setData({
      currentView: "map-preview",
      mapNativeScale: 12,
      mapMarkers: [],
    });
    const methods = page as unknown as Record<string, unknown>;
    const project = vi.fn((scale: number) => ({
      scale,
      views: [],
      bindings: [],
    }));
    const commit = vi.fn();
    methods.projectNativeMapPresentationAtScale = project;
    methods.commitNativeMapProjection = commit;
    for (const scale of [12.5, 14, 16, 18])
      call(page, "observeNativeMapCameraScale", scale);
    expect(commit).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(180);
    expect(project).toHaveBeenCalledTimes(1);
    expect(project.mock.calls[0]?.[0]).toBe(18);
    expect(commit).toHaveBeenCalledTimes(1);
    call(page, "observeNativeMapCameraScale", 14);
    call(page, "deactivateNativeMapSurface");
    await vi.advanceTimersByTimeAsync(180);
    expect(commit).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it.each([
    ["recognize", "start"],
    ["map", "map-preview"],
    ["my", "my"],
  ] as const)("lands tab=%s on its public main entry", (tab, currentView) => {
    const page = createRuntimePage();
    call(page, "onLoad", { tab });
    expect(page.data).toMatchObject({ activeTab: tab, currentView });
    expect(showShareMenuMock).toHaveBeenCalledWith({
      menus: ["shareAppMessage", "shareTimeline"],
    });
    call(page, "onUnload");
  });

  it.each([undefined, "invalid"])(
    "falls back to recognition for tab=%s",
    (tab) => {
      const page = createRuntimePage();
      call(page, "onLoad", tab ? { tab } : {});
      expect(page.data).toMatchObject({
        activeTab: "recognize",
        currentView: "start",
      });
      call(page, "onUnload");
    },
  );

  it("shares the current tab with a fixed package image without mutating state", () => {
    const page = createRuntimePage();
    call(page, "onLoad", { tab: "map" });
    const before = structuredClone(page.data);

    expect(call(page, "onShareAppMessage")).toEqual({
      title: "ICHI 一奇抽赏助手",
      path: "/pages/home/index?tab=map",
      imageUrl: "/assets/share/ichi-share-message.png",
    });
    expect(call(page, "onShareTimeline")).toEqual({
      title: "ICHI 一奇抽赏助手",
      query: "tab=map",
      imageUrl: "/assets/v1-29/ichi-avatar.png",
    });
    expect(copyUrlListener?.()).toEqual({ query: "tab=map" });
    expect(page.data).toEqual(before);

    call(page, "onUnload");
    expect(offCopyUrlMock).toHaveBeenCalledOnce();
  });

  it("opens a my share with the receiver's silent account and no sender identity", async () => {
    const sender = createRuntimePage();
    call(sender, "onLoad", { tab: "my" });
    sender.setData({ accountNickname: "User A" });
    const payload = call(sender, "onShareAppMessage") as {
      path: string;
      imageUrl: string;
    };
    call(sender, "onUnload");

    profileNickname = "User B";
    const receiver = createRuntimePage();
    call(receiver, "onLoad", { tab: payload.path.split("tab=")[1] });
    await call(receiver, "onShow");
    await vi.waitFor(() =>
      expect(receiver.data.accountNickname).toBe("User B"),
    );
    expect(payload).toEqual({
      title: "ICHI 一奇抽赏助手",
      path: "/pages/home/index?tab=my",
      imageUrl: "/assets/share/ichi-share-message.png",
    });
    expect(payload.path).not.toContain("User A");
    call(receiver, "onUnload");
  });

  it("keeps sharing active across all tabs without duplicate copy listeners", () => {
    const page = createRuntimePage();
    call(page, "onLoad", { tab: "recognize" });
    call(page, "onSelectTab", baseEvent({ tab: "my" }));

    expect(page.data).toMatchObject({ activeTab: "my", currentView: "my" });
    expect(hideShareMenuMock).not.toHaveBeenCalled();
    expect(offCopyUrlMock).not.toHaveBeenCalled();
    expect(onCopyUrlMock).toHaveBeenCalledTimes(1);
    expect(copyUrlListener?.()).toEqual({ query: "tab=my" });
    expect(call(page, "onShareAppMessage")).toEqual({
      title: "ICHI 一奇抽赏助手",
      path: "/pages/home/index?tab=my",
      imageUrl: "/assets/share/ichi-share-message.png",
    });
    expect(call(page, "onShareTimeline")).toEqual({
      title: "ICHI 一奇抽赏助手",
      query: "tab=my",
      imageUrl: "/assets/v1-29/ichi-avatar.png",
    });
    call(page, "onSelectTab", baseEvent({ tab: "map" }));
    expect(onCopyUrlMock).toHaveBeenCalledTimes(1);
    expect(copyUrlListener?.()).toEqual({ query: "tab=map" });
    call(page, "onSelectTab", baseEvent({ tab: "recognize" }));
    expect(onCopyUrlMock).toHaveBeenCalledTimes(1);
    expect(copyUrlListener?.()).toEqual({ query: "tab=recognize" });

    call(page, "onShow");
    expect(onCopyUrlMock).toHaveBeenCalledTimes(1);
    call(page, "onUnload");
    expect(offCopyUrlMock).toHaveBeenCalledOnce();
  });

  it("opens a map share without requesting location and reads only production map data", () => {
    const page = createRuntimePage();
    call(page, "onLoad", { tab: "map" });
    expect(page.data).toMatchObject({
      activeTab: "map",
      currentView: "map-preview",
    });
    expect(locationRequestCount).toBe(0);
    expect(cloudCallFunctionMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: "query-public-map-leads" }),
    );
    call(page, "onUnload");
  });

  it("preloads once after identity is ready without location and cancels late background setup", async () => {
    const page = createRuntimePage();
    const ensure = vi.fn(() => ({ state: { phase: "INITIAL_LOADING" } }));
    let ready!: (value: object) => void;
    (page as unknown as Record<string, unknown>).refreshCloudAccount = () =>
      new Promise((resolve) => {
        ready = resolve;
      });
    (page as unknown as Record<string, unknown>).ensurePublicMapClient = ensure;
    call(page, "onShow");
    call(page, "onHide");
    ready({});
    await Promise.resolve();
    expect(ensure).not.toHaveBeenCalled();
    call(page, "onShow");
    ready({});
    await Promise.resolve();
    expect(ensure).toHaveBeenCalledOnce();
    expect(locationRequestCount).toBe(0);
    expect(page.data.currentView).not.toBe("map-preview");
    call(page, "onUnload");
  });

  it("refreshes expired prefetched results on map entry without repeating a fresh read", () => {
    const page = createRuntimePage();
    const refresh = vi.fn();
    const state = { phase: "LOADED", cacheUpdatedAtMs: Date.now() };
    (page as unknown as Record<string, unknown>).ensurePublicMapClient =
      () => ({ state, refresh });
    call(page, "refreshPublicMapOnEntry");
    expect(refresh).not.toHaveBeenCalled();
    state.cacheUpdatedAtMs -= 120000;
    call(page, "refreshPublicMapOnEntry");
    expect(refresh).toHaveBeenCalledOnce();
    state.phase = "INITIAL_LOADING";
    call(page, "refreshPublicMapOnEntry");
    expect(refresh).toHaveBeenCalledOnce();
  });

  it.each(["hide", "exit", "unload"])(
    "prepares only two foreground details, joins selection, and cancels after %s",
    async (mode) => {
      const page = createRuntimePage();
      const service = new SyntheticPublicMapService();
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const ids = SYNTHETIC_PUBLIC_MARKERS.slice(0, 3).map((_, i) =>
        (i + 1).toString(16).padStart(32, "0"),
      );
      page.setData({
        mapSelectedDiscoveryTagIds: [
          "UPLOAD_ONLY",
          "LAST_CHANCE",
          "GRAND_PRIZE_REMAINS",
          "GRAND_PRIZE_RATIO",
          "SPLIT_SET",
          "LOW_OPPORTUNITY",
        ],
      });
      cloudCallFunctionMock.mockImplementation(async ({ name, data }) => {
        if (name === "query-public-map-leads") {
          const result = await service.query(data as PublicViewportRequest);
          return {
            result: result.ok
              ? {
                  ...result,
                  items: SYNTHETIC_PUBLIC_MARKERS.slice(0, 3).map(
                    (marker, i) => ({ ...marker, publicLeadId: ids[i]! }),
                  ),
                  nextCursor: null,
                }
              : result,
          };
        }
        if (name === "get-public-map-lead-detail") {
          await gate;
          const request = data as PublicDetailRequest,
            index = ids.indexOf(request.publicLeadId);
          const result = await service.detail({
            ...request,
            publicLeadId: SYNTHETIC_PUBLIC_MARKERS[index]!.publicLeadId,
          });
          return {
            result: result.ok
              ? {
                  ...result,
                  item: {
                    ...result.item,
                    publicLeadId: request.publicLeadId,
                    contributor: result.item.contributor
                      ? {
                          displayName: result.item.contributor.displayName,
                          avatar: {
                            kind: "FALLBACK_ASSET",
                            path: "/assets/v1-29/ichi-avatar.png",
                          },
                        }
                      : null,
                  },
                }
              : result,
          };
        }
        return { result: { ok: false, code: "SERVICE_UNAVAILABLE" } };
      });
      const client = call(
        page,
        "ensurePublicMapClient",
      ) as import("../../platform/public-map-client.js").PublicMapClient;
      await vi.waitFor(() => expect(client.state.phase).toBe("LOADED"));
      const detailCalls = () =>
        cloudCallFunctionMock.mock.calls.filter(
          ([request]) => request.name === "get-public-map-lead-detail",
        );
      expect(detailCalls()).toHaveLength(0);
      call(page, "onSelectTab", baseEvent({ tab: "map" }));
      expect(detailCalls()).toHaveLength(2);
      call(page, "openSelectedMapLead", ids[0]);
      expect(detailCalls()).toHaveLength(2);
      if (mode === "exit")
        call(page, "onSelectTab", baseEvent({ tab: "recognize" }));
      else call(page, mode === "hide" ? "onHide" : "onUnload");
      expect(detailCalls()).toHaveLength(2);
      release();
      await vi.advanceTimersByTimeAsync(0);
      expect(detailCalls()).toHaveLength(2);
      expect(page.data).toMatchObject({
        mapDetailPhase: "IDLE",
        mapDetail: null,
        mapCardPhase: "CLOSED",
      });
      if (mode !== "unload") call(page, "onUnload");
    },
  );

  it("opens a public summary before a delayed detail response and discards it after dismissal", async () => {
    const page = createRuntimePage();
    const service = new SyntheticPublicMapService();
    let releaseQuery!: () => void, releaseDetail!: () => void;
    const queryGate = new Promise<void>((resolve) => {
      releaseQuery = resolve;
    });
    const detailGate = new Promise<void>((resolve) => {
      releaseDetail = resolve;
    });
    cloudCallFunctionMock.mockImplementation(async ({ name, data }) => {
      if (name === "query-public-map-leads") {
        await queryGate;
        const result = await service.query(data as PublicViewportRequest);
        return {
          result: result.ok
            ? {
                ...result,
                items: result.items.map((item, index) => ({
                  ...item,
                  publicLeadId: (index + 1).toString(16).padStart(32, "0"),
                })),
              }
            : result,
        };
      }
      if (name === "get-public-map-lead-detail") {
        await detailGate;
        const request = data as PublicDetailRequest;
        const result = await service.detail({
          ...request,
          publicLeadId: `lead-synthetic-${parseInt(request.publicLeadId, 16).toString().padStart(3, "0")}`,
        });
        return {
          result: result.ok
            ? {
                ...result,
                item: { ...result.item, publicLeadId: request.publicLeadId },
              }
            : result,
        };
      }
      return { result: { ok: false, code: "SERVICE_UNAVAILABLE" } };
    });
    call(page, "onSelectTab", baseEvent({ tab: "map" }));
    expect(page.data.currentView).toBe("map-preview");
    expect(page.data.mapPhase).toBe("INITIAL_LOADING");
    expect(page.data.modalView).toBe("");
    releaseQuery();
    await vi.advanceTimersByTimeAsync(1000);
    call(page, "onMapResetDiscoveryFilters");
    const marker = (
      page.data.mapMarkers as Array<{
        publicLeadId: string;
        totalRemainingLabel: string;
      }>
    )[0]!;
    expect(marker).toBeDefined();
    call(page, "openSelectedMapLead", marker.publicLeadId);
    expect(page.data.mapDetailPhase).toBe("LOADING");
    expect(page.data.mapCardPhase).toBe("OPENING");
    expect(page.data.mapDetail).toBeNull();
    expect(page.data.mapDetailPreview).toMatchObject({
      publicLeadId: marker.publicLeadId,
      totalRemainingLabel: marker.totalRemainingLabel,
    });
    expect(page.data.mapDetailPreview).not.toHaveProperty("contributorName");
    expect(page.data.mapDetailPreview).not.toHaveProperty("venueNote");
    call(page, "dismissNativeMapSelection");
    releaseDetail();
    await vi.advanceTimersByTimeAsync(1000);
    expect(page.data.mapDetailPhase).toBe("IDLE");
    expect(page.data.mapDetailPreview).toBeNull();
    expect(page.data.mapDetail).toBeNull();
    expect(page.data.mapCardPhase).toBe("CLOSED");
    call(page, "onUnload");
  });

  it("switches immediately to another lead while the previous marker camera is moving", () => {
    const page = createRuntimePage();
    const first = {
      markerId: 101,
      kind: "LEAD",
      publicLeadId: "lead-synthetic-001",
      latitude: 31.23,
      longitude: 121.47,
      realLatitude: 31.23,
      realLongitude: 121.47,
    };
    const second = {
      markerId: 102,
      kind: "LEAD",
      publicLeadId: "lead-synthetic-002",
      latitude: 31.24,
      longitude: 121.48,
      realLatitude: 31.24,
      realLongitude: 121.48,
    };
    page.setData({
      mapNativeInteractionState: "CAMERA_ANIMATING",
      mapSelectedLeadId: first.publicLeadId,
      mapNativeMarkerViews: [
        { ...first, selected: true },
        { ...second, selected: false },
      ],
    });
    const clearNativeMapTransition = vi.fn(() =>
      page.setData({ mapNativeInteractionState: "IDLE" }),
    );
    const openSelectedMapLead = vi.fn();
    (page as unknown as Record<string, unknown>).clearNativeMapTransition =
      clearNativeMapTransition;
    (page as unknown as Record<string, unknown>).openSelectedMapLead =
      openSelectedMapLead;

    call(page, "activateNativeMapMarker", second.markerId);

    expect(clearNativeMapTransition).toHaveBeenCalledOnce();
    expect(openSelectedMapLead).toHaveBeenCalledWith(
      second.publicLeadId,
      expect.objectContaining({ markerId: second.markerId }),
    );
    expect(page.data.mapNativeMarkerViews).toMatchObject([
      { markerId: first.markerId, selected: false },
      { markerId: second.markerId, selected: true },
    ]);
  });

  it("consumes one companion surface tap, then lets an independent blank tap dismiss", () => {
    const page = createRuntimePage();
    const marker = {
      markerId: 201,
      kind: "LEAD",
      publicLeadId: "lead-synthetic-001",
      latitude: 31.23,
      longitude: 121.47,
      realLatitude: 31.23,
      realLongitude: 121.47,
      selected: false,
    };
    page.setData({
      mapNativeInteractionState: "IDLE",
      mapNativeMarkerViews: [marker],
    });
    (page as unknown as Record<string, unknown>).openSelectedMapLead = vi.fn(
      () =>
        page.setData({
          mapCardPhase: "OPEN",
          mapSheetMode: "PREVIEW",
        }),
    );
    const detailState = {
      phase: "LOADED",
      selectedPublicLeadId: marker.publicLeadId as string | null,
    };
    const clearSelection = vi.fn(() => {
      detailState.phase = "IDLE";
      detailState.selectedPublicLeadId = null;
    });
    (page as unknown as Record<string, unknown>).ensurePublicMapClient = vi.fn(
      () => ({ state: { detail: detailState }, clearSelection }),
    );

    call(page, "onMapNativeMarkerTap", {
      detail: { markerId: marker.markerId },
      currentTarget: { dataset: {} },
    });
    call(page, "onMapNativeTap");
    expect(clearSelection).not.toHaveBeenCalled();
    expect(page.data.mapCardPhase).toBe("OPEN");

    call(page, "onMapNativeTap");
    expect(clearSelection).toHaveBeenCalledOnce();
    expect(page.data).toMatchObject({
      mapCardPhase: "CLOSED",
      mapSheetMode: "CLOSED",
      mapSelectedLeadId: "",
    });
    expect(page.data.mapNativeMarkerViews).toMatchObject([
      { markerId: marker.markerId, selected: false },
    ]);
  });

  it("dismisses the selected marker when a real map drag begins", () => {
    const page = createRuntimePage();
    const marker = {
      markerId: 205,
      kind: "LEAD",
      publicLeadId: "lead-synthetic-001",
      latitude: 31.23,
      longitude: 121.47,
      realLatitude: 31.23,
      realLongitude: 121.47,
      selected: true,
    };
    page.setData({
      mapCardPhase: "OPEN",
      mapSheetMode: "PREVIEW",
      mapSelectedLeadId: marker.publicLeadId,
      mapNativeInteractionState: "IDLE",
      mapNativeMarkerViews: [marker],
    });
    const detailState = {
      phase: "LOADED",
      selectedPublicLeadId: marker.publicLeadId as string | null,
    };
    const clearSelection = vi.fn(() => {
      detailState.phase = "IDLE";
      detailState.selectedPublicLeadId = null;
    });
    (page as unknown as Record<string, unknown>).ensurePublicMapClient = vi.fn(
      () => ({ state: { detail: detailState }, clearSelection }),
    );

    call(page, "onMapNativeRegionChange", {
      detail: { type: "begin", causedBy: "gesture", scale: 12 },
    });

    expect(clearSelection).toHaveBeenCalledOnce();
    expect(page.data).toMatchObject({
      mapCardPhase: "CLOSED",
      mapSheetMode: "CLOSED",
      mapSelectedLeadId: "",
      mapNativeInteractionState: "GESTURE",
    });
    expect(page.data.mapNativeMarkerViews).toMatchObject([
      { markerId: marker.markerId, selected: false },
    ]);
  });

  it("keeps the selection during a programmatic camera region change", () => {
    const page = createRuntimePage();
    const marker = {
      markerId: 206,
      kind: "LEAD",
      publicLeadId: "lead-synthetic-001",
      latitude: 31.23,
      longitude: 121.47,
      realLatitude: 31.23,
      realLongitude: 121.47,
      selected: true,
    };
    page.setData({
      mapCardPhase: "OPEN",
      mapSheetMode: "PREVIEW",
      mapSelectedLeadId: marker.publicLeadId,
      mapNativeInteractionState: "CAMERA_ANIMATING",
      mapNativeMarkerViews: [marker],
    });
    const clearSelection = vi.fn();
    (page as unknown as Record<string, unknown>).ensurePublicMapClient = vi.fn(
      () => ({
        state: {
          detail: {
            phase: "LOADED",
            selectedPublicLeadId: marker.publicLeadId,
          },
        },
        clearSelection,
      }),
    );

    call(page, "onMapNativeRegionChange", {
      detail: { type: "begin", causedBy: "update", scale: 12 },
    });

    expect(clearSelection).not.toHaveBeenCalled();
    expect(page.data).toMatchObject({
      mapCardPhase: "OPEN",
      mapSheetMode: "PREVIEW",
      mapSelectedLeadId: marker.publicLeadId,
      mapNativeInteractionState: "CAMERA_ANIMATING",
    });
    expect(page.data.mapNativeMarkerViews).toMatchObject([
      { markerId: marker.markerId, selected: true },
    ]);
  });

  it("treats a scale-caused region change as a user gesture", () => {
    const page = createRuntimePage();
    const marker = {
      markerId: 207,
      kind: "LEAD",
      publicLeadId: "lead-synthetic-001",
      latitude: 31.23,
      longitude: 121.47,
      realLatitude: 31.23,
      realLongitude: 121.47,
      selected: true,
    };
    page.setData({
      mapCardPhase: "OPEN",
      mapSheetMode: "PREVIEW",
      mapSelectedLeadId: marker.publicLeadId,
      mapNativeMarkerViews: [marker],
    });
    const clearSelection = vi.fn();
    (page as unknown as Record<string, unknown>).ensurePublicMapClient = vi.fn(
      () => ({
        state: {
          detail: {
            phase: "LOADED",
            selectedPublicLeadId: marker.publicLeadId,
          },
        },
        clearSelection,
      }),
    );

    call(page, "onMapNativeRegionChange", {
      detail: { type: "begin", causedBy: "scale", scale: 13 },
    });

    expect(clearSelection).toHaveBeenCalledOnce();
    expect(page.data.mapCardPhase).toBe("CLOSED");
    expect(page.data.mapNativeMarkerViews).toMatchObject([
      { markerId: marker.markerId, selected: false },
    ]);
  });

  it("moves the controlled camera with a cancellable ease-in-out curve", () => {
    const page = createRuntimePage();
    call(page, "onMapNativeUpdated");
    const marker = {
      markerId: 202,
      kind: "LEAD",
      publicLeadId: "lead-synthetic-002",
      latitude: 31.24,
      longitude: 121.48,
      realLatitude: 31.24,
      realLongitude: 121.48,
      selected: false,
    };
    page.setData({
      mapNativeCenterLatitude: 31.21,
      mapNativeCenterLongitude: 121.41,
      mapNativeScale: 12,
      mapNativeInteractionState: "IDLE",
      mapNativeMarkerViews: [marker],
    });
    const detailState = {
      selectedPublicLeadId: null as string | null,
    };
    const selectLead = vi.fn(async (publicLeadId: string) => {
      detailState.selectedPublicLeadId = publicLeadId;
    });
    (page as unknown as Record<string, unknown>).ensurePublicMapClient = vi.fn(
      () => ({ state: { detail: detailState }, selectLead }),
    );
    (
      page as unknown as Record<string, unknown>
    ).loadPublicMapAuthorizationStatus = vi.fn();

    call(page, "activateNativeMapMarker", marker.markerId);

    expect(selectLead).toHaveBeenCalledWith(marker.publicLeadId);
    expect(moveToLocationMock).not.toHaveBeenCalled();
    expect(page.data).toMatchObject({
      mapNativeCenterLatitude: 31.21,
      mapNativeCenterLongitude: 121.41,
      mapNativeInteractionState: "CAMERA_ANIMATING",
    });

    vi.advanceTimersByTime(30);
    const firstLatitude = Number(page.data.mapNativeCenterLatitude);
    expect(firstLatitude).toBeGreaterThan(31.21);
    expect(firstLatitude).toBeLessThan(31.21 + (31.24 - 31.21) / 14);

    vi.advanceTimersByTime(180);
    expect(Number(page.data.mapNativeCenterLatitude)).toBeGreaterThan(31.21);
    expect(Number(page.data.mapNativeCenterLatitude)).toBeLessThan(
      marker.realLatitude,
    );
    expect(Number(page.data.mapNativeCenterLongitude)).toBeGreaterThan(121.41);
    expect(Number(page.data.mapNativeCenterLongitude)).toBeLessThan(
      marker.realLongitude,
    );

    vi.advanceTimersByTime(210);
    const finalLatitude = Number(page.data.mapNativeCenterLatitude);
    const finalLongitude = Number(page.data.mapNativeCenterLongitude);
    expect(finalLatitude).toBeGreaterThan(31.21);
    expect(finalLatitude).toBeLessThanOrEqual(marker.realLatitude + 1e-9);
    expect(finalLongitude).toBeGreaterThan(121.41);
    expect(finalLongitude).toBeLessThanOrEqual(marker.realLongitude + 1e-9);
    call(page, "onUnload");
  });

  it("rebases an in-flight lead camera animation when Marker B preempts Marker A", () => {
    const page = createRuntimePage();
    const first = {
      markerId: 203,
      kind: "LEAD",
      publicLeadId: "lead-synthetic-001",
      latitude: 31.24,
      longitude: 121.48,
      realLatitude: 31.24,
      realLongitude: 121.48,
      selected: false,
    };
    const second = {
      markerId: 204,
      kind: "LEAD",
      publicLeadId: "lead-synthetic-002",
      latitude: 31.26,
      longitude: 121.52,
      realLatitude: 31.26,
      realLongitude: 121.52,
      selected: false,
    };
    page.setData({
      mapNativeCenterLatitude: 31.21,
      mapNativeCenterLongitude: 121.41,
      mapNativeScale: 12,
      mapNativeInteractionState: "IDLE",
      mapNativeMarkerViews: [first, second],
    });
    const detailState = {
      selectedPublicLeadId: null as string | null,
    };
    (page as unknown as Record<string, unknown>).ensurePublicMapClient = vi.fn(
      () => ({
        state: { detail: detailState },
        selectLead(publicLeadId: string) {
          detailState.selectedPublicLeadId = publicLeadId;
          return Promise.resolve();
        },
      }),
    );
    (
      page as unknown as Record<string, unknown>
    ).loadPublicMapAuthorizationStatus = vi.fn();

    call(page, "activateNativeMapMarker", first.markerId);
    vi.advanceTimersByTime(90);
    const interruptedLatitude = Number(page.data.mapNativeCenterLatitude);
    expect(interruptedLatitude).toBeGreaterThan(31.21);
    expect(interruptedLatitude).toBeLessThan(first.realLatitude);

    call(page, "activateNativeMapMarker", second.markerId);
    vi.advanceTimersByTime(420);
    expect(Number(page.data.mapNativeCenterLatitude)).toBeGreaterThan(
      interruptedLatitude,
    );
    expect(Number(page.data.mapNativeCenterLatitude)).toBeLessThan(
      second.realLatitude,
    );
    expect(Number(page.data.mapNativeCenterLongitude)).toBeGreaterThan(121.41);
    expect(Number(page.data.mapNativeCenterLongitude)).toBeLessThan(
      second.realLongitude,
    );
    expect(detailState.selectedPublicLeadId).toBe(second.publicLeadId);
    call(page, "onUnload");
  });

  it("silently bootstraps a fresh account without opening a profile authorization wall", async () => {
    profileComplete = false;
    profileHasAvatar = false;
    const page = createRuntimePage();
    call(page, "onLoad");
    await call(page, "onShow");
    await vi.waitFor(() => expect(page.data.accountState).toBe("ready"));
    expect(page.data).toMatchObject({
      modalView: "",
      accountNickname: "ICHI 玩家",
      accountAvatarUrl: "/assets/v1-29/ichi-avatar.png",
    });
    expect(
      cloudCallFunctionMock.mock.calls.map(([request]) => request.name),
    ).toContain("bootstrap-account");

    call(page, "onOpenWechatProfileAuthorization");
    expect(page.data.modalView).toBe("profile-edit");
    expect(page.data.profileOriginalNickname).toBe("ICHI 玩家");
    expect(page.data.profileAuthorizationReady).toBe(false);
    call(page, "onCloseWechatProfileAuthorization");
    expect(page.data.modalView).toBe("");

    call(page, "onOpenWechatProfileAuthorization");
    call(page, "onProfileNicknameInput", { detail: { value: "新微信玩家" } });
    expect(page.data.profileAuthorizationReady).toBe(true);
    await call(page, "onAuthorizeWechatProfile");
    expect(page.data).toMatchObject({
      modalView: "",
      accountNickname: "新微信玩家",
    });
    expect(cloudCallFunctionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "bind-wechat-profile",
        data: expect.objectContaining({
          nickname: "新微信玩家",
        }),
      }),
    );
    call(page, "onSelectTab", baseEvent({ tab: "map" }));
    call(page, "onSelectTab", baseEvent({ tab: "my" }));
    await vi.waitFor(() => expect(page.data.accountState).toBe("ready"));
    expect(page.data.accountAvatarUrl).toBe("/assets/v1-29/ichi-avatar.png");
    expect(page.data.accountNickname).toBe("新微信玩家");

    const reloaded = createRuntimePage();
    call(reloaded, "onLoad");
    await call(reloaded, "onShow");
    await vi.waitFor(() => expect(reloaded.data.accountState).toBe("ready"));
    expect(reloaded.data.accountNickname).toBe("新微信玩家");
    expect(reloaded.data.accountAvatarUrl).toBe(
      "/assets/v1-29/ichi-avatar.png",
    );
  });

  it.each(["assist", "direct-upload"] as const)(
    "lets an incomplete-profile account enter %s without profile authorization",
    async (flowMode) => {
      profileComplete = false;
      profileHasAvatar = false;
      const page = createRuntimePage();
      await call(page, "onImportBoard", baseEvent({ flowMode }));
      expect(page.data.currentView).toBe("camera-capture");
      expect(page.data.modalView).toBe("");
      expect(page.data.accountState).toBe("ready");
      expect(
        cloudCallFunctionMock.mock.calls.map(([request]) => request.name),
      ).not.toContain("bind-wechat-profile");
    },
  );

  it("shows a technical retry state instead of a profile authorization prompt when silent bootstrap fails", async () => {
    accountBootstrapFailure = true;
    const page = createRuntimePage();
    call(page, "onLoad");
    await call(page, "onShow");
    await vi.waitFor(() => expect(page.data.accountState).toBe("unavailable"));
    expect(page.data.modalView).toBe("");

    await call(page, "onImportBoard", baseEvent({ flowMode: "assist" }));
    expect(page.data.modalView).toBe("account-unavailable");
    expect(page.data.currentView).toBe("start");
  });

  it("requests camera permission once and reuses the persisted authorization", async () => {
    cameraPermissionState = undefined;
    const page = createRuntimePage();
    await call(page, "onImportBoard");
    expect(cameraAuthorizationCount).toBe(1);
    expect(locationRequestCount).toBe(1);
    expect(page.data.currentView).toBe("camera-capture");
    call(page, "onBackToStart");
    await call(page, "onImportBoard");
    expect(cameraAuthorizationCount).toBe(1);
    expect(locationRequestCount).toBe(2);
  });

  it("loads the account and current location before mounting the camera", async () => {
    const page = createRuntimePage();
    call(page, "onLoad");
    await call(page, "onImportBoard");
    await vi.waitFor(() => expect(page.data.accountState).toBe("ready"));
    expect(page.data).toMatchObject({
      accountState: "ready",
      accountNickname: "ICHI 玩家",
      accountIchiId: "ICHI-001",
      quotaRemaining: 5,
    });
    expect(page.data.currentView).toBe("camera-capture");
    expect(page.data.recognitionGateBusy).toBe(false);
    expect(app.globalData.pendingBoardLocation).toMatchObject({
      latitude: 31.23,
      longitude: 121.47,
      coordinateSystem: "gcj02",
    });
    expect(locationRequestCount).toBe(1);
  });

  it("accepts the first import tap and suppresses duplicate camera mounts", async () => {
    const page = createRuntimePage();
    const first = call(page, "onImportBoard");
    const duplicate = call(page, "onImportBoard");

    await Promise.all([first, duplicate]);
    await vi.waitFor(() => expect(page.data.accountState).toBe("ready"));

    expect(
      cloudCallFunctionMock.mock.calls.filter(
        ([request]) => request.name === "bootstrap-account",
      ),
    ).toHaveLength(1);
    expect(page.data.currentView).toBe("camera-capture");
    expect(page.data.recognitionGateBusy).toBe(false);
  });

  it("blocks a new recognition when quota is exhausted without affecting drafts", async () => {
    quotaRemaining = 0;
    const page = createRuntimePage();
    call(page, "onLoad");
    await call(page, "onImportBoard");
    expect(page.data.currentView).toBe("start");
    expect(page.data.modalView).toBe("quota-exhausted");
    expect(app.globalData.pendingBoardLocation).toBeUndefined();
    expect(locationRequestCount).toBe(0);
    expect(cameraAuthorizationCount).toBe(0);
    expect(
      cloudCallFunctionMock.mock.calls.map(([request]) => request.name),
    ).not.toContain("reserve-recognition");
  });

  it.each(["assist", "direct-upload"] as const)(
    "rejects a known exhausted %s entry from the page snapshot without repeating account bootstrap",
    async (flowMode) => {
      quotaRemaining = 0;
      const page = createRuntimePage();
      call(page, "onLoad");
      await call(page, "onShow");
      await vi.waitFor(() => expect(page.data.accountState).toBe("ready"));
      cloudCallFunctionMock.mockClear();

      await call(page, "onImportBoard", baseEvent({ flowMode }));

      expect(page.data.modalView).toBe("quota-exhausted");
      expect(locationRequestCount).toBe(0);
      expect(cameraAuthorizationCount).toBe(0);
      expect(cloudCallFunctionMock).not.toHaveBeenCalled();
    },
  );

  it("keeps repeated exhausted attempts on the same deterministic fast-fail gate", async () => {
    quotaRemaining = 0;
    const page = createRuntimePage();
    call(page, "onLoad");
    await call(page, "onShow");
    await vi.waitFor(() => expect(page.data.accountState).toBe("ready"));
    cloudCallFunctionMock.mockClear();

    await call(page, "onImportBoard", baseEvent({ flowMode: "assist" }));
    page.setData({ modalView: "" });
    await call(page, "onImportBoard", baseEvent({ flowMode: "assist" }));

    expect(page.data.modalView).toBe("quota-exhausted");
    expect(cloudCallFunctionMock).not.toHaveBeenCalled();
  });

  it("uses the quota-only server preflight for a ready account", async () => {
    quotaRemaining = 2;
    const page = createRuntimePage();
    call(page, "onLoad");
    await call(page, "onShow");
    await vi.waitFor(() => expect(page.data.accountState).toBe("ready"));
    cloudCallFunctionMock.mockClear();

    await call(page, "onImportBoard", baseEvent({ flowMode: "assist" }));

    expect(
      cloudCallFunctionMock.mock.calls.map(([request]) => request.name),
    ).toEqual(["get-quota-status"]);
    expect(page.data.currentView).toBe("camera-capture");
  });

  it("invalidates a known-zero snapshot on show after the server quota is reset", async () => {
    quotaRemaining = 0;
    const page = createRuntimePage();
    call(page, "onLoad");
    await call(page, "onShow");
    await vi.waitFor(() => expect(page.data.quotaRemaining).toBe(0));

    quotaRemaining = 5;
    await call(page, "onShow");
    await vi.waitFor(() => expect(page.data.quotaRemaining).toBe(5));
    cloudCallFunctionMock.mockClear();
    await call(page, "onImportBoard", baseEvent({ flowMode: "assist" }));

    expect(page.data.currentView).toBe("camera-capture");
    expect(page.data.modalView).not.toBe("quota-exhausted");
  });

  it("revalidates a stale zero snapshot when the exhausted modal is dismissed", async () => {
    quotaRemaining = 0;
    const page = createRuntimePage();
    call(page, "onLoad");
    await call(page, "onShow");
    await vi.waitFor(() => expect(page.data.quotaRemaining).toBe(0));
    await call(page, "onImportBoard", baseEvent({ flowMode: "assist" }));
    expect(page.data.modalView).toBe("quota-exhausted");

    quotaRemaining = 5;
    call(page, "onResetQuotaCapture");
    await vi.waitFor(() => expect(page.data.quotaRemaining).toBe(5));

    expect(page.data.modalView).toBe("");
    expect(page.data.currentView).toBe("start");
  });

  it("checks both entry modes without reserving or consuming quota", async () => {
    quotaRemaining = 2;
    for (const flowMode of ["assist", "direct-upload"]) {
      const page = createRuntimePage();
      await call(page, "onImportBoard", baseEvent({ flowMode }));
      expect(page.data.currentView).toBe("camera-capture");
      expect(page.data.quotaRemaining).toBe(2);
      expect(
        cloudCallFunctionMock.mock.calls
          .map(([request]) => request.name)
          .filter((name) => name === "reserve-recognition"),
      ).toHaveLength(0);
      call(page, "onBackToStart");
    }
    expect(
      cloudCallFunctionMock.mock.calls
        .map(([request]) => request.name)
        .filter((name) => name === "get-quota-status"),
    ).toHaveLength(2);
  });

  it("keeps the progress in the provider stage until the real response arrives", async () => {
    let resolveRecognition: ((value: { result: unknown }) => void) | undefined;
    const baseCloudCall = cloudCallFunctionMock.getMockImplementation();
    cloudCallFunctionMock.mockImplementation(async (request) => {
      if (request.name === "recognize-board") {
        return await new Promise<{ result: unknown }>((resolve) => {
          resolveRecognition = resolve;
        });
      }
      return baseCloudCall?.(request);
    });
    app.globalData.pendingBoardImage = {
      tempFilePath: "/tmp/captured-board.jpg",
      size: 4,
    };
    app.globalData.pendingBoardAcquisition = "camera";
    const page = createRuntimePage();
    const pending = call(page, "startRecognition") as Promise<void>;

    await vi.waitFor(() => expect(resolveRecognition).toBeTypeOf("function"));
    expect(page.data.recognitionStage).toBe(2);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(page.data.recognitionStage).toBe(2);
    expect(Number(page.data.recognitionProgress)).toBeLessThan(80);

    resolveRecognition?.({ result: recognitionTransport() });
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(500);
    await pending;
    expect(page.data.recognitionStage).toBe(4);
    expect(page.data.recognitionProgress).toBe(100);
  });

  it("blocks camera entry when current location permission is unavailable", async () => {
    locationFailure = true;
    const page = createRuntimePage();
    call(page, "onLoad");
    await call(page, "onImportBoard");
    expect(page.data.currentView).toBe("start");
    expect(page.data.modalView).toBe("capture-permission-required");
    expect(page.data.quotaRemaining).toBe(5);
    expect(locationRequestCount).toBe(1);
    expect(cameraAuthorizationCount).toBe(0);
  });

  it("keeps server-owned records separate from local Storage and avoids duplicate board cards", async () => {
    cloudRecordsResult = [
      {
        recordId: "private-1",
        recordCode: "A1B2C3",
        boardId: "cloud-board-1",
        sourcePath: "direct-upload",
        status: "clue_submitted",
        updatedAt: "2026-08-19T03:32:00.000Z",
        initialSnapshot: {
          ip: "葬送的芙莉莲",
          totalTickets: 65,
          remainingTickets: 63,
        },
      },
    ];
    const page = createRuntimePage();
    call(page, "onLoad");
    await call(page, "refreshCloudRecords");
    expect(page.data.cloudRecords).toMatchObject([
      { recordId: "private-1", recordStateLabel: "已上传" },
    ]);
    expect(page.data.cloudClues).toHaveLength(1);
    expect(stored.has(LOCAL_DRAW_DRAFTS_KEY)).toBe(false);
  });

  it("uses the draft swipe-delete pattern for uploaded boards and waits for explicit confirmation", async () => {
    cloudRecordsResult = [
      {
        recordId: "private-delete-1",
        recordCode: "DELETE",
        boardId: "cloud-board-delete-1",
        sourcePath: "direct-upload",
        status: "clue_submitted",
        updatedAt: "2026-08-25T03:32:00.000Z",
        initialSnapshot: {
          ip: "测试版面",
          totalTickets: 10,
          remainingTickets: 10,
        },
      },
    ];
    const page = createRuntimePage();
    call(page, "onLoad");
    await call(page, "refreshCloudRecords");
    page.setData({ currentView: "contributions" });

    call(page, "onTouchStart", touchEvent("private-delete-1", 160, "active"));
    call(page, "onTouchMove", touchEvent("private-delete-1", 72, "active"));
    call(page, "onTouchEnd", touchEvent("private-delete-1", 72, "ended"));
    expect(page.data.cloudClues).toMatchObject([{ swipeX: -72 }]);

    call(
      page,
      "onDeleteCloudRecord",
      baseEvent({
        recordId: "private-delete-1",
        boardId: "cloud-board-delete-1",
      }),
    );
    expect(page.data).toMatchObject({
      modalView: "delete-uploaded-board",
      pendingDeleteUploadedRecordId: "private-delete-1",
      pendingDeleteUploadedBoardId: "cloud-board-delete-1",
    });
    call(page, "onCancelDeleteUploadedBoard");
    expect(cloudCallFunctionMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: "delete-my-record" }),
    );

    call(
      page,
      "onDeleteCloudRecord",
      baseEvent({
        recordId: "private-delete-1",
        boardId: "cloud-board-delete-1",
      }),
    );
    cloudRecordsResult = [];
    await call(page, "onConfirmDeleteUploadedBoard");
    expect(cloudCallFunctionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "delete-my-record",
        data: { recordId: "private-delete-1", boardId: "cloud-board-delete-1" },
      }),
    );
    expect(page.data.cloudClues).toEqual([]);
    call(page, "onUnload");
  });

  it("cascades an explicitly accepted cloud publication delete to the local board", async () => {
    const page = createRuntimePage();
    enterDraw(page);
    const draft = call(page, "getActiveDraft") as LocalDrawDraft;
    call(page, "persistDraft", {
      ...draft,
      recognitionJobId: "recognition-job-1",
      cloudRecordId: "record_0123456789abcdef0123456789abcdef",
      verificationStatus: "verified",
      uploadStatus: "uploaded",
      submissionState: "uploaded",
      evidenceSubmissionVersion: 1,
      locationNote: "ABC",
    });
    call(
      page,
      "onDeleteCloudRecord",
      baseEvent({
        recordId: "record_0123456789abcdef0123456789abcdef",
        boardId: draft.boardId,
      }),
    );
    cloudRecordsResult = [];
    await call(page, "onConfirmDeleteUploadedBoard");

    expect(JSON.parse(String(stored.get(LOCAL_DRAW_DRAFTS_KEY)))).toEqual([]);

    const reloaded = createRuntimePage();
    call(reloaded, "onLoad");
    call(reloaded, "onOpenLocalRecords");
    expect(reloaded.data.drafts).toEqual([]);
    call(reloaded, "onUnload");
  });

  it("defensively shows only one current publication per board", async () => {
    const currentRecordId = "record_0123456789abcdef0123456789abcdef";
    const olderRecordId = "record_fedcba9876543210fedcba9876543210";
    const oldestRecordId = "record_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const page = createRuntimePage();
    enterDraw(page);
    const draft = call(page, "getActiveDraft") as LocalDrawDraft;
    call(page, "persistDraft", {
      ...draft,
      cloudRecordId: currentRecordId,
      verificationStatus: "verified",
      uploadStatus: "uploaded",
      submissionState: "uploaded",
      evidenceSubmissionVersion: 2,
    });
    cloudRecordsResult = [
      {
        recordId: currentRecordId,
        recordCode: "A12BCD",
        boardId: draft.boardId,
        sourcePath: "assisted-draw",
        status: "APPROVED",
        prizeTicketVerificationStatus: "APPROVED",
        updatedAt: "2026-08-28T04:00:00.000Z",
        initialSnapshot: {
          ip: "测试版面",
          totalTickets: 10,
          remainingTickets: 8,
        },
      },
      {
        recordId: olderRecordId,
        recordCode: "LXZDNB",
        boardId: draft.boardId,
        sourcePath: "assisted-draw",
        status: "APPROVED",
        prizeTicketVerificationStatus: "APPROVED",
        updatedAt: "2026-08-28T03:00:00.000Z",
        initialSnapshot: {
          ip: "测试版面",
          totalTickets: 12,
          remainingTickets: 10,
        },
      },
      {
        recordId: oldestRecordId,
        recordCode: "123456",
        boardId: draft.boardId,
        sourcePath: "assisted-draw",
        status: "APPROVED",
        prizeTicketVerificationStatus: "APPROVED",
        updatedAt: "2026-08-28T02:00:00.000Z",
        initialSnapshot: {
          ip: "测试版面",
          totalTickets: 14,
          remainingTickets: 12,
        },
      },
    ];

    await call(page, "refreshCloudRecords");

    expect(page.data.contributions).toMatchObject([
      { boardId: draft.boardId, cloudRecordId: currentRecordId },
    ]);
    expect(page.data.cloudClues).toMatchObject([
      { recordId: currentRecordId, boardId: draft.boardId },
    ]);
  });

  it("deletes a Local Board from My Records without deleting its Observation", async () => {
    const recordId = "record_0123456789abcdef0123456789abcdef";
    const page = createRuntimePage();
    enterDraw(page);
    const draft = call(page, "getActiveDraft") as LocalDrawDraft;
    call(page, "persistDraft", {
      ...draft,
      cloudRecordId: recordId,
      verificationStatus: "verified",
      uploadStatus: "uploaded",
      submissionState: "uploaded",
      evidenceSubmissionVersion: 1,
    });
    cloudRecordsResult = [
      {
        recordId,
        recordCode: "A12BCD",
        boardId: draft.boardId,
        sourcePath: "assisted-draw",
        status: "APPROVED",
        prizeTicketVerificationStatus: "APPROVED",
        updatedAt: "2026-08-28T04:00:00.000Z",
        initialSnapshot: {
          ip: "测试版面",
          totalTickets: 10,
          remainingTickets: 8,
        },
      },
    ];
    cloudCallFunctionMock.mockClear();

    await call(page, "onDeleteDraft", baseEvent({ boardId: draft.boardId }));

    expect(JSON.parse(String(stored.get(LOCAL_DRAW_DRAFTS_KEY)))).toEqual([]);
    expect(cloudCallFunctionMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: "delete-my-record" }),
    );
    await call(page, "refreshCloudRecords");
    expect(page.data.cloudClues).toMatchObject([{ recordId }]);
    expect(page.data.drafts).toEqual([]);
    expect(page.data.cloudRecords).toMatchObject([{ recordId }]);

    const reloaded = createRuntimePage();
    call(reloaded, "onLoad");
    await call(reloaded, "refreshCloudRecords");
    expect(reloaded.data.drafts).toEqual([]);
    expect(reloaded.data.cloudClues).toMatchObject([{ recordId }]);
  });

  it("keeps swipe-delete available for unbound, bound, and stale Local Boards", async () => {
    const seedPage = createRuntimePage();
    enterDraw(seedPage);
    const seed = call(seedPage, "getActiveDraft") as LocalDrawDraft;
    const drafts: LocalDrawDraft[] = [
      {
        ...seed,
        boardId: "board-active-unbound",
        recordCode: "A12BCD",
        savedAt: 3,
        submissionState: "local",
        verificationStatus: "unverified",
        uploadStatus: "not-uploaded",
      },
      {
        ...seed,
        boardId: "board-active-bound",
        recordCode: "LXZDNB",
        cloudRecordId: "record_0123456789abcdef0123456789abcdef",
        savedAt: 2,
        submissionState: "uploaded",
        verificationStatus: "verified",
        uploadStatus: "uploaded",
        evidenceSubmissionVersion: 1,
      },
      {
        ...seed,
        boardId: "board-active-stale",
        recordCode: "123456",
        cloudRecordId: "record_fedcba9876543210fedcba9876543210",
        savedAt: 1,
        submissionState: "local",
        verificationStatus: "unverified",
        uploadStatus: "not-uploaded",
      },
    ];
    stored.set(LOCAL_DRAW_DRAFTS_KEY, JSON.stringify(drafts));
    const page = createRuntimePage();
    call(page, "onLoad");
    call(page, "onOpenLocalRecords");

    expect(page.data.drafts).toMatchObject([
      { boardId: "board-active-unbound", canDelete: true },
      { boardId: "board-active-bound", canDelete: true },
      { boardId: "board-active-stale", canDelete: true },
    ]);

    call(page, "onTouchStart", touchEvent("board-active-bound", 160, "active"));
    call(page, "onTouchMove", touchEvent("board-active-bound", 72, "active"));
    call(page, "onTouchEnd", touchEvent("board-active-bound", 72, "ended"));
    expect(page.data.drafts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          boardId: "board-active-bound",
          swipeX: -72,
        }),
      ]),
    );

    cloudCallFunctionMock.mockClear();
    await call(
      page,
      "onDeleteDraft",
      baseEvent({ boardId: "board-active-bound" }),
    );
    expect(
      JSON.parse(String(stored.get(LOCAL_DRAW_DRAFTS_KEY))).map(
        (draft: LocalDrawDraft) => draft.boardId,
      ),
    ).toEqual(["board-active-unbound", "board-active-stale"]);
    expect(cloudCallFunctionMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: "delete-my-record" }),
    );
  });

  it.each([["location-failed"], ["photo-failed"], ["note-failed"]] as const)(
    "cascades an explicitly accepted %s cloud publication delete",
    async (verificationStatus) => {
      const recordId = "record_0123456789abcdef0123456789abcdef";
      const page = createRuntimePage();
      enterDraw(page);
      const draft = call(page, "getActiveDraft") as LocalDrawDraft;
      call(page, "persistDraft", {
        ...draft,
        cloudRecordId: recordId,
        verificationStatus,
        uploadStatus: "uploaded",
        submissionState: "pending-review",
        evidenceSubmissionVersion: 1,
      });

      call(
        page,
        "onDeleteCloudRecord",
        baseEvent({ recordId, boardId: draft.boardId }),
      );
      cloudRecordsResult = [];
      await call(page, "onConfirmDeleteUploadedBoard");

      expect(JSON.parse(String(stored.get(LOCAL_DRAW_DRAFTS_KEY)))).toEqual([]);
    },
  );

  it("does not patch record state while a native camera surface is mounted", async () => {
    cloudRecordsResult = [
      {
        recordId: "private-camera-record",
        recordCode: "A1B2C3",
        boardId: "cloud-board-camera",
        sourcePath: "direct-upload",
        status: "clue_submitted",
        updatedAt: "2026-08-19T03:32:00.000Z",
        initialSnapshot: { ip: "葬送的芙莉莲", totalTickets: 65 },
      },
    ];
    const page = createRuntimePage();
    page.setData({
      currentView: "camera-capture",
      cloudRecordsState: "idle",
      cloudRecords: [],
    });

    await call(page, "refreshCloudRecords");

    expect(page.data.cloudRecordsState).toBe("idle");
    expect(page.data.cloudRecords).toEqual([]);
  });

  it("shows the cannot-build-pool state when cloud recognition fails", async () => {
    recognitionResult = {
      contractVersion: "1.0.0",
      requestId: "development-fallback",
      status: "service_error",
      reasonCode: "RECOGNITION_PROVIDER_NOT_CONFIGURED",
      issues: [],
      imageHandling: {
        retention: "ephemeral",
        published: false,
        storedInSessionHistory: false,
      },
    };
    const page = createRuntimePage();
    call(page, "onLoad");
    await call(page, "onImportBoard");
    call(page, "onCameraReady");
    await call(page, "onCaptureBoardMedia");
    const beforeFrozenConfirmation = cloudCallFunctionMock.mock.calls.length;
    await confirmFrozenBoard(page);
    expect(page.data.currentView).toBe("cannot-build-pool");
    expect(
      cloudCallFunctionMock.mock.calls
        .slice(beforeFrozenConfirmation)
        .map(([request]) => request.name),
    ).toContain("reserve-recognition");
    expect(
      cloudCallFunctionMock.mock.calls.filter(
        ([request]) => request.name === "reserve-recognition",
      ),
    ).toHaveLength(1);
    expect(
      cloudCallFunctionMock.mock.calls.filter(
        ([request]) => request.name === "release-recognition",
      ),
    ).toHaveLength(1);
    expect(page.data).toMatchObject({
      quotaUsed: 0,
      quotaReserved: 0,
      quotaRemaining: 5,
    });

    expect(page.data.currentView).toBe("cannot-build-pool");
    expect(page.data.recognitionError).toBe("识别服务尚未配置，请稍后再试。");
  });

  it("converts a successful cloud response into a confirmable draw pool", async () => {
    const page = createRuntimePage();
    await call(page, "onImportBoard");
    call(page, "onCameraReady");
    await call(page, "onCaptureBoardMedia");
    const beforeFrozenConfirmation = cloudCallFunctionMock.mock.calls.length;
    await confirmFrozenBoard(page);
    expect(page.data.currentView).toBe("recognition-result");
    expect(
      cloudCallFunctionMock.mock.calls
        .slice(beforeFrozenConfirmation)
        .map(([request]) => request.name),
    ).toContain("reserve-recognition");

    expect(page.data.currentView).toBe("recognition-result");
    expect(page.data.recognitionPrizes).toMatchObject([
      { tier: "A", remainingTickets: 2 },
      { tier: "B", remainingTickets: 3 },
      { tier: "C", remainingTickets: 5 },
      { tier: "D", remainingTickets: 11 },
      { tier: "E", remainingTickets: 17 },
      { tier: "F", remainingTickets: 25 },
    ]);

    call(page, "onRecognitionIpInput", {
      detail: { value: "端到端识别样本" },
    });
    await confirmR2Board(page);
    expect(page.data.currentView).toBe("draw");
    expect(page.data.activeDraft).toMatchObject({
      ipLabel: "端到端识别样本",
      remaining: 63,
    });
  });

  it("persists an immutable board locally before a slow finalize and never lets that callback navigate", async () => {
    const page = createRuntimePage();
    call(page, "onLoad");
    page.setData({ currentView: "recognition-result" });
    call(page, "onRecognitionIpInput", { detail: { value: "火影忍者" } });
    call(page, "onRecognitionThemeInput", {
      detail: { value: "疾风传 风影夺还篇" },
    });
    app.globalData.pendingRecognitionJobId = "recognition-job-1";
    app.globalData.pendingRecognitionJobToken =
      "recognition-job-token-for-tests";
    app.globalData.pendingRecognitionIdempotencyKey = "recognition-key-1";
    app.globalData.pendingBoardAcquisition = "camera";
    app.globalData.pendingBoardLocation = {
      latitude: 31.23,
      longitude: 121.47,
      accuracy: 12,
      coordinateSystem: "gcj02",
      obtainedAt: Date.now(),
    };
    let resolveFinalize:
      ((value: { result: Record<string, unknown> }) => void) | undefined;
    const baseCloudCall = cloudCallFunctionMock.getMockImplementation();
    cloudCallFunctionMock.mockImplementation(async (request) => {
      if (request.name !== "finalize-board-observation") {
        return baseCloudCall?.(request);
      }
      return new Promise((resolve) => {
        resolveFinalize = resolve;
      });
    });

    await confirmR2Board(page);
    expect(page.data).toMatchObject({
      generationState: "ready",
      currentView: "draw",
      recognitionIp: "火影忍者",
      activeDraft: {
        ipLabel: "火影忍者 / 疾风传 风影夺还篇",
      },
    });
    call(page, "onRecognitionIpInput", { detail: { value: "被拒绝的新 IP" } });
    await confirmR2Board(page);
    expect(
      cloudCallFunctionMock.mock.calls.filter(
        ([request]) => request.name === "finalize-board-observation",
      ),
    ).toHaveLength(1);

    page.setData({ generationId: "newer-generation" });
    await call(
      page,
      "failGeneration",
      "stale-generation",
      "stale failure",
      "recognition-job-1",
      "recognition-job-token-for-tests",
    );
    expect(
      cloudCallFunctionMock.mock.calls.filter(
        ([request]) => request.name === "release-recognition",
      ),
    ).toHaveLength(0);
    resolveFinalize?.({
      result: {
        ok: true,
        data: {
          recordId: "record_0123456789abcdef0123456789abcdef",
          recordCode: "A1B2C3",
          boardId: "stale-board",
          status: "private_saved",
          idempotent: false,
        },
      },
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(page.data.currentView).toBe("draw");
    expect(page.data.activeDraft).toMatchObject({
      ipLabel: "火影忍者 / 疾风传 风影夺还篇",
    });
  });

  it("keeps failed background finalization resumable and retries without Qwen or a second charge", async () => {
    const page = createRuntimePage();
    call(page, "onLoad");
    page.setData({ currentView: "recognition-result" });
    call(page, "onRecognitionIpInput", { detail: { value: "明日方舟" } });
    app.globalData.pendingRecognitionJobId = "recognition-job-1";
    app.globalData.pendingRecognitionJobToken =
      "recognition-job-token-for-tests";
    app.globalData.pendingRecognitionIdempotencyKey = "recognition-key-1";
    app.globalData.pendingBoardAcquisition = "camera";
    app.globalData.pendingBoardLocation = {
      latitude: 31.23,
      longitude: 121.47,
      accuracy: 12,
      coordinateSystem: "gcj02",
      obtainedAt: Date.now(),
    };
    const baseCloudCall = cloudCallFunctionMock.getMockImplementation();
    cloudCallFunctionMock.mockImplementation(async (request) => {
      if (request.name === "finalize-board-observation") {
        throw new Error("write failed");
      }
      return baseCloudCall?.(request);
    });

    await confirmR2Board(page);
    await Promise.resolve();
    await Promise.resolve();
    expect(page.data).toMatchObject({
      currentView: "draw",
      generationState: "ready",
    });
    expect(JSON.parse(String(stored.get(LOCAL_DRAW_DRAFTS_KEY)))).toMatchObject(
      [
        {
          recordType: "draw",
          ipName: "明日方舟",
          pendingFinalization: {
            recognitionJobId: "recognition-job-1",
          },
        },
      ],
    );
    expect(
      cloudCallFunctionMock.mock.calls.some(
        ([request]) => request.name === "release-recognition",
      ),
    ).toBe(false);

    cloudCallFunctionMock.mockImplementation(async (request) => {
      if (request.name === "finalize-board-observation") {
        return {
          result: {
            ok: true,
            data: {
              recordId: "record_0123456789abcdef0123456789abcdef",
              recordCode: "A1B2C3",
              boardId: "cloud-board-1",
              status: "private_saved",
              idempotent: false,
            },
          },
        };
      }
      return baseCloudCall?.(request);
    });
    await call(page, "resumePendingFinalizations");
    await Promise.resolve();
    await Promise.resolve();
    expect(page.data.currentView).toBe("draw");
    expect(
      JSON.parse(String(stored.get(LOCAL_DRAW_DRAFTS_KEY)))[0],
    ).not.toHaveProperty("pendingFinalization");
    expect(
      cloudCallFunctionMock.mock.calls.filter(
        ([request]) => request.name === "recognize-board",
      ),
    ).toHaveLength(0);
    expect(
      cloudCallFunctionMock.mock.calls.filter(
        ([request]) => request.name === "reserve-recognition",
      ),
    ).toHaveLength(0);
    expect(
      cloudCallFunctionMock.mock.calls.filter(
        ([request]) => request.name === "release-recognition",
      ),
    ).toHaveLength(0);
  });

  it("shows a safe diagnostic reference when reservation never reaches CloudBase", async () => {
    cloudCallFunctionMock.mockImplementation(
      async ({ name }: { name: string }) => {
        if (name === "reserve-recognition") {
          throw { errMsg: "request:fail timeout private platform detail" };
        }
        return { result: recognitionResult };
      },
    );
    app.globalData.pendingBoardImage = {
      tempFilePath: "/tmp/captured-board.jpg",
      size: 4,
    };
    app.globalData.pendingBoardAcquisition = "camera";
    const page = createRuntimePage();
    await call(page, "startRecognition");

    expect(page.data.currentView).toBe("cannot-build-pool");
    expect(page.data.recognitionError).toBe(
      "连接云端超时，请检查网络后重试（参考码：CLOUD_NETWORK_FAILED）。",
    );
    expect(page.data.recognitionError).not.toContain("private platform detail");
  });

  it("captures from the embedded camera and recovers camera permission in place", async () => {
    const page = createRuntimePage();
    call(page, "onLoad");
    await call(page, "onImportBoard");
    expect(page.data.currentView).toBe("camera-capture");
    expect(page.data.cameraStatus).toBe("loading");

    call(page, "onCameraReady");
    expect(page.data.cameraStatus).toBe("ready");
    await call(page, "onCaptureBoardMedia");
    expect(cameraCaptureCount).toBe(1);
    expect(page.data.currentView).toBe("camera-capture");
    expect(page.data.boardCapturePath).toBe("/tmp/captured-board.jpg");
    await confirmFrozenBoard(page);
    expect(page.data.currentView).toBe("recognition-result");

    call(page, "onBackToStart");
    await Promise.resolve();
    expect(
      cloudCallFunctionMock.mock.calls.filter(
        ([request]) => request.name === "release-recognition",
      ),
    ).toHaveLength(1);
    await call(page, "onImportBoard");
    call(page, "onCameraError", {
      detail: { errCode: 10001, errMsg: "camera:fail auth deny" },
    });
    expect(page.data.cameraStatus).toBe("denied");
    call(page, "onOpenCameraSettings");
    expect(page.data.cameraStatus).toBe("loading");
    call(page, "onUnload");
  });

  it("keeps the camera controls live, frozen, undoable, and generation-safe", async () => {
    const page = createRuntimePage();
    await call(page, "onImportBoard");
    const liveGeneration = Number(page.data.cameraGeneration);
    call(page, "onCameraReady", {
      currentTarget: { dataset: { cameraGeneration: liveGeneration } },
    });
    await call(page, "onCaptureBoardMedia");
    expect(page.data.boardCapturePath).toBe("/tmp/captured-board.jpg");
    const frozenGeneration = Number(page.data.cameraGeneration);
    expect(frozenGeneration).toBe(liveGeneration);

    call(page, "onUndoBoardCapture");
    expect(page.data.boardCapturePath).toBe("");
    expect(page.data.cameraStatus).toBe("loading");
    expect(Number(page.data.cameraGeneration)).toBeGreaterThan(
      frozenGeneration,
    );
    expect(app.globalData.pendingBoardImage).toBeUndefined();
    call(page, "onCameraReady", {
      currentTarget: {
        dataset: { cameraGeneration: page.data.cameraGeneration },
      },
    });
    expect(page.data.cameraStatus).toBe("ready");
  });

  it("clears only current-generation camera errors and retries only genuine failures", async () => {
    const page = createRuntimePage();
    await call(page, "onImportBoard");
    const generation = Number(page.data.cameraGeneration);
    call(page, "onCameraError", {
      currentTarget: { dataset: { cameraGeneration: generation - 1 } },
      detail: { errCode: 10001, errMsg: "stale camera error" },
    });
    expect(page.data.cameraStatus).toBe("loading");
    call(page, "onCameraError", {
      currentTarget: { dataset: { cameraGeneration: generation } },
      detail: { errCode: 10001, errMsg: "camera:fail auth deny" },
    });
    expect(page.data.cameraStatus).toBe("denied");
    call(page, "onCameraReady", {
      currentTarget: { dataset: { cameraGeneration: generation - 1 } },
    });
    expect(page.data.cameraStatus).toBe("denied");
    call(page, "onCameraReady", {
      currentTarget: { dataset: { cameraGeneration: generation } },
    });
    expect(page.data.cameraStatus).toBe("ready");
    expect(page.data.cameraError).toBe("");
    call(page, "onRetryCamera");
    expect(page.data.cameraStatus).toBe("ready");
    call(page, "onCameraError", {
      currentTarget: { dataset: { cameraGeneration: generation } },
      detail: { errCode: 10002, errMsg: "camera:fail unavailable" },
    });
    const failedGeneration = Number(page.data.cameraGeneration);
    call(page, "onRetryCamera");
    expect(page.data.cameraStatus).toBe("loading");
    expect(Number(page.data.cameraGeneration)).toBeGreaterThan(
      failedGeneration,
    );
    expect(page.data.cameraError).toBe("");
  });

  it("cleans the frozen raw photo when leaving the recognition tab", () => {
    const page = createRuntimePage();
    call(page, "onLoad");
    page.setData({
      currentView: "camera-capture",
      boardCapturePath: "/tmp/raw.jpg",
    });
    app.globalData.pendingBoardImage = {
      tempFilePath: "/tmp/raw.jpg",
      size: 4,
    };
    call(page, "onSelectTab", baseEvent({ tab: "map" }));

    expect(page.data.currentView).toBe("map-preview");
    expect(app.globalData.pendingBoardImage).toBeUndefined();
  });

  it("queues the first shutter tap until the embedded camera is ready", async () => {
    const page = createRuntimePage();
    await call(page, "onImportBoard");

    await call(page, "onCaptureBoardMedia");
    expect(page.data.pendingBoardCapture).toBe(true);
    expect(cameraCaptureCount).toBe(0);

    call(page, "onCameraReady");
    expect(page.data.pendingBoardCapture).toBe(false);
    expect(cameraCaptureCount).toBe(1);
    await vi.runAllTimersAsync();
  });

  it("captures share evidence inside its embedded camera frame", async () => {
    const page = createRuntimePage();
    call(page, "onLoad");
    call(page, "onOpenShareCapture");
    expect(page.data.modalView).toBe("share-capture");
    expect(page.data.cameraStatus).toBe("loading");

    call(page, "onCameraReady");
    expect(page.data.cameraStatus).toBe("ready");
    await call(page, "onCaptureEvidence");
    expect(cameraCaptureCount).toBe(1);
    expect(page.data.shareImagePath).toBe("/tmp/captured-board.jpg");

    call(page, "onRetakeEvidence");
    expect(page.data.shareImagePath).toBe("");
    expect(page.data.cameraStatus).toBe("loading");
    call(page, "onUnload");
  });

  it("queues a share-evidence shutter tap until its camera is ready", async () => {
    const page = createRuntimePage();
    call(page, "onOpenShareCapture");

    await call(page, "onCaptureEvidence");
    expect(page.data.pendingEvidenceCapture).toBe(true);
    expect(cameraCaptureCount).toBe(0);

    call(page, "onCameraReady");
    expect(page.data.pendingEvidenceCapture).toBe(false);
    expect(cameraCaptureCount).toBe(1);
  });

  it("enters draw without a target tier and still reads legacy target tiers", () => {
    const page = createRuntimePage();
    call(page, "onLoad");
    page.setData({ currentView: "recognition-result" });
    call(page, "onRecognitionIpInput", {
      detail: { value: "秋叶原 0812" },
    });

    void confirmR2Board(page);
    expect(page.data.currentView).toBe("draw");

    const firstDrafts = JSON.parse(
      String(stored.get(LOCAL_DRAW_DRAFTS_KEY)),
    ) as Array<{ boardId: string; targetTiers?: string[] }>;
    const boardId = firstDrafts[0]?.boardId;
    expect(firstDrafts).toHaveLength(1);
    expect(firstDrafts[0]?.targetTiers).toBeUndefined();

    stored.set(
      LOCAL_DRAW_DRAFTS_KEY,
      JSON.stringify([{ ...firstDrafts[0], targetTiers: ["B", "F"] }]),
    );

    const reloaded = createRuntimePage();
    call(reloaded, "onLoad");
    call(reloaded, "onOpenDraft", baseEvent({ boardId }));
    expect(reloaded.data.currentView).toBe("draw");
    expect(
      JSON.parse(String(stored.get(LOCAL_DRAW_DRAFTS_KEY)))[0].targetTiers,
    ).toEqual(["B", "F"]);
    call(page, "onUnload");
    call(reloaded, "onUnload");
  });

  it("cancels recognition routing after the user selects another tab", () => {
    const page = createRuntimePage();
    call(page, "onLoad");
    call(page, "startRecognition");
    call(page, "onSelectTab", baseEvent({ tab: "map" }));
    vi.runAllTimers();
    expect(page.data.currentView).toBe("map-preview");
    expect(page.data.activeTab).toBe("map");
    call(page, "onUnload");
  });

  it("synchronizes swipe reveal and outside-tap reset across both lists", () => {
    const page = createRuntimePage();
    call(page, "onLoad");
    page.setData({ currentView: "recognition-result" });
    call(page, "onRecognitionIpInput", {
      detail: { value: "秋叶原 0812" },
    });
    void confirmR2Board(page);
    vi.advanceTimersByTime(900);
    call(page, "onBackToStart");
    const boardId = (
      page.data.drafts as Array<{ boardId: string; swipeX: number }>
    )[0]?.boardId;
    expect(boardId).toBeTruthy();

    call(page, "onTouchStart", touchEvent(String(boardId), 200, "active"));
    call(page, "onTouchMove", touchEvent(String(boardId), 100, "active"));
    call(page, "onTouchEnd", touchEvent(String(boardId), 100, "ended"));
    expect(page.data.drafts).toMatchObject([{ swipeX: -72 }]);
    expect(page.data.startDrafts).toMatchObject([{ swipeX: -72 }]);

    vi.runOnlyPendingTimers();
    call(page, "onDismissDraftSwipe");
    expect(page.data.drafts).toMatchObject([{ swipeX: 0 }]);
    expect(page.data.startDrafts).toMatchObject([{ swipeX: 0 }]);
    call(page, "onUnload");
  });

  it("leaves vertical draft gestures to the native scroll container", () => {
    const page = createRuntimePage();
    call(page, "onLoad");
    page.setData({ currentView: "recognition-result" });
    call(page, "onRecognitionIpInput", { detail: { value: "秋叶原 0812" } });
    void confirmR2Board(page);
    const boardId = (page.data.startDrafts as Array<{ boardId: string }>)[0]
      ?.boardId;
    expect(boardId).toBeTruthy();

    call(page, "onTouchStart", touchEvent(String(boardId), 200, "active", 100));
    call(page, "onTouchMove", touchEvent(String(boardId), 201, "active", 180));
    call(page, "onTouchEnd", touchEvent(String(boardId), 201, "ended", 180));

    expect(page.data.startDrafts).toMatchObject([{ swipeX: 0 }]);
    call(page, "onUnload");
  });

  it("shows and recovers the schema and storage failure states", () => {
    stored.set(LOCAL_DRAW_DRAFTS_KEY, '{"legacy":true}');
    const incompatible = createRuntimePage();
    call(incompatible, "onLoad");
    expect(incompatible.data.currentView).toBe("schema-incompatible");
    call(incompatible, "onRecoverSchema");
    expect(incompatible.data.currentView).toBe("start");
    expect(stored.has(LOCAL_DRAW_DRAFTS_KEY)).toBe(false);

    const failedWrite = createRuntimePage();
    call(failedWrite, "onLoad");
    failedWrite.setData({ currentView: "recognition-result" });
    call(failedWrite, "onRecognitionIpInput", {
      detail: { value: "秋叶原 0812" },
    });
    throwWrites = true;
    void confirmR2Board(failedWrite);
    expect(failedWrite.data.modalView).toBe("storage-warning");
    expect(stored.has(LOCAL_DRAW_DRAFTS_KEY)).toBe(false);

    throwWrites = false;
    throwReads = true;
    const failedRead = createRuntimePage();
    call(failedRead, "onLoad");
    expect(failedRead.data.currentView).toBe("storage-fallback");
    expect(failedRead.data.activeTab).toBe("my");
    call(incompatible, "onUnload");
    call(failedWrite, "onUnload");
    call(failedRead, "onUnload");
  });

  it("shares a confirmed direct upload automatically and reports the server acknowledgement", async () => {
    const baseCloudCall = cloudCallFunctionMock.getMockImplementation()!;
    cloudCallFunctionMock.mockImplementation(async (request) => {
      if (request.name === "manage-map-contribution-consent")
        return {
          result: {
            ok: true,
            termsVersion: PRODUCTION_MAP_TERMS.version,
            scopeDigest: PRODUCTION_MAP_TERMS.scopeDigest,
            accepted: true,
          },
        };
      return baseCloudCall(request);
    });
    const page = createRuntimePage();
    call(page, "onLoad");
    await call(page, "onImportBoard", baseEvent({ flowMode: "direct-upload" }));
    call(page, "onCameraReady");
    await call(page, "onCaptureBoardMedia");
    await confirmFrozenBoard(page);
    call(page, "onRecognitionIpInput", { detail: { value: "确认上传版面" } });
    call(page, "onRecognitionLocationInput", {
      detail: { value: "本次位置备注" },
    });
    call(page, "onRecognitionPriceInput", { detail: { value: "650" } });
    await confirmR2Board(page);
    await vi.advanceTimersByTimeAsync(0);
    expect(page.data.modalView).toBe("board-upload-submitted");
    expect(page.data.mapUploadSharingMessage).toContain("本条记录已上传");
    expect(page.data.mapUploadSharingMessage).not.toContain("已公开");
    expect(
      cloudCallFunctionMock.mock.calls.filter(
        ([r]) =>
          r.name === "finalize-board-observation" &&
          r.data.uploadSharing?.disclosureVersion ===
            UPLOAD_SHARING_DISCLOSURE_VERSION,
      ),
    ).toHaveLength(1);
    call(page, "onSubmittedExit");
    expect(page.data.modalView).toBe("");
    expect(page.data.currentView).toBe("start");
    call(page, "onUnload");
  });

  it("keeps rejected direct notes local and lets my uploads edit and retry after restart", async () => {
    const baseCall = cloudCallFunctionMock.getMockImplementation()!;
    const originalLocation = wx.getLocation;
    const locationSpy = vi.spyOn(wx, "getLocation");
    let rejectNote = true,
      released = false;
    cloudCallFunctionMock.mockImplementation(async (request) => {
      if (request.name === "release-recognition") released = true;
      if (request.name === "reserve-recognition" && released) {
        const r = await baseCall(request);
        return {
          ...r,
          result: {
            ...r.result,
            data: { ...r.result.data, status: "recognized" },
          },
        };
      }
      if (request.name === "finalize-board-observation" && rejectNote)
        return {
          result: { ok: false, error: { code: "LOCATION_NOTE_REVIEW_FAILED" } },
        };
      return baseCall(request);
    });
    const page = createRuntimePage();
    call(page, "onLoad");
    await call(page, "onImportBoard", baseEvent({ flowMode: "direct-upload" }));
    call(page, "onCameraReady");
    await call(page, "onCaptureBoardMedia");
    await confirmFrozenBoard(page);
    call(page, "onRecognitionIpInput", { detail: { value: "安全备注测试" } });
    call(page, "onRecognitionLocationInput", { detail: { value: "拒绝备注" } });
    call(page, "onRecognitionPriceInput", { detail: { value: "650" } });
    delete app.globalData.pendingBoardLocation;
    const reservationsBeforeConfirm = cloudCallFunctionMock.mock.calls.filter(
      ([r]) => r.name === "reserve-recognition",
    ).length;
    locationSpy.mockImplementationOnce((options) => {
      void call(page, "resumePendingFinalizations");
      expect(
        cloudCallFunctionMock.mock.calls.filter(
          ([r]) => r.name === "reserve-recognition",
        ),
      ).toHaveLength(reservationsBeforeConfirm);
      originalLocation(options);
    });
    await confirmR2Board(page);
    expect(page.data.currentView).toBe("contributions");
    const failed = JSON.parse(String(stored.get(LOCAL_DRAW_DRAFTS_KEY)))[0];
    expect(failed).toMatchObject({
      recordType: "board-upload",
      verificationStatus: "note-failed",
      uploadStatus: "not-uploaded",
      submissionState: "local",
      pendingFinalization: {
        sourcePath: "direct-upload",
        locationNote: "拒绝备注",
      },
    });
    expect(failed.pendingFinalization.location).toBeDefined();
    expect(failed.pendingFinalization.recognitionIdempotencyKey).toBeTruthy();
    expect(failed.pendingFinalization).not.toHaveProperty("jobToken");
    expect(page.data.pendingDirectUploads).toMatchObject([
      { recordStateLabel: "备注未通过", verificationAction: "edit-note" },
    ]);
    const recognitionCount = cloudCallFunctionMock.mock.calls.filter(
      ([r]) => r.name === "recognize-board",
    ).length;
    const locationCount = locationSpy.mock.calls.length;
    call(page, "onUnload");
    const restarted = createRuntimePage();
    call(restarted, "onLoad");
    await call(restarted, "resumePendingFinalizations");
    expect(
      cloudCallFunctionMock.mock.calls.filter(
        ([r]) => r.name === "finalize-board-observation",
      ),
    ).toHaveLength(1);
    call(restarted, "onEditTicketNote", baseEvent({ boardId: failed.boardId }));
    expect(restarted.data).toMatchObject({
      modalView: "note-review",
      noteReviewSourcePath: "direct-upload",
    });
    call(restarted, "onReviewNoteInput", {
      detail: { value: "修改后的安全备注" },
    });
    rejectNote = false;
    await call(restarted, "onSubmitNoteReview");
    expect(
      JSON.parse(String(stored.get(LOCAL_DRAW_DRAFTS_KEY)))[0],
    ).toMatchObject({
      uploadStatus: "uploaded",
      submissionState: "uploaded",
      verificationStatus: "verified",
      locationNote: "修改后的安全备注",
    });
    expect(
      JSON.parse(String(stored.get(LOCAL_DRAW_DRAFTS_KEY)))[0],
    ).not.toHaveProperty("pendingFinalization");
    expect(restarted.data.pendingDirectUploads).toEqual([]);
    const requests = cloudCallFunctionMock.mock.calls.filter(
      ([r]) => r.name === "finalize-board-observation",
    );
    expect(requests[1]?.[0].data).toMatchObject({
      locationNote: "修改后的安全备注",
      recognitionJobId: failed.recognitionJobId,
      location: failed.pendingFinalization.location,
      confirmedSnapshot: failed.pendingFinalization.confirmedSnapshot,
      uploadSharing: {
        disclosureVersion: UPLOAD_SHARING_DISCLOSURE_VERSION,
        rightsAttested: true,
      },
    });
    expect(
      cloudCallFunctionMock.mock.calls.filter(
        ([r]) => r.name === "recognize-board",
      ),
    ).toHaveLength(recognitionCount);
    expect(locationSpy.mock.calls).toHaveLength(locationCount);
    expect(
      cloudCallFunctionMock.mock.calls.some(
        ([r]) => r.name === "recognize-draw-tickets",
      ),
    ).toBe(false);
    call(restarted, "onUnload");
    locationSpy.mockRestore();
  });

  it("preserves confirmed direct-upload sharing when the later local record cache fails", async () => {
    const baseCloudCall = cloudCallFunctionMock.getMockImplementation()!;
    let finalized = false;
    const originalWrite = wx.setStorageSync;
    const write = vi
      .spyOn(wx, "setStorageSync")
      .mockImplementation((key, value) => {
        if (finalized && key === LOCAL_DRAW_DRAFTS_KEY)
          throw new Error("local cache failed");
        originalWrite(key, value);
      });
    cloudCallFunctionMock.mockImplementation(async (request) => {
      if (request.name === "manage-map-contribution-consent")
        return {
          result: {
            ok: true,
            termsVersion: PRODUCTION_MAP_TERMS.version,
            scopeDigest: PRODUCTION_MAP_TERMS.scopeDigest,
            accepted: true,
          },
        };
      const response = await baseCloudCall(request);
      if (request.name === "finalize-board-observation") finalized = true;
      return response;
    });
    const page = createRuntimePage();
    try {
      call(page, "onLoad");
      await call(
        page,
        "onImportBoard",
        baseEvent({ flowMode: "direct-upload" }),
      );
      call(page, "onCameraReady");
      await call(page, "onCaptureBoardMedia");
      await confirmFrozenBoard(page);
      call(page, "onRecognitionIpInput", { detail: { value: "上传已确认" } });
      call(page, "onRecognitionLocationInput", {
        detail: { value: "本条位置备注" },
      });
      call(page, "onRecognitionPriceInput", { detail: { value: "650" } });
      await confirmR2Board(page);
      await vi.advanceTimersByTimeAsync(0);
      expect(page.data.generationState).toBe("failed");
      expect(
        cloudCallFunctionMock.mock.calls.filter(
          ([r]) =>
            r.name === "finalize-board-observation" &&
            r.data.uploadSharing?.disclosureVersion ===
              UPLOAD_SHARING_DISCLOSURE_VERSION,
        ),
      ).toHaveLength(1);
    } finally {
      write.mockRestore();
      call(page, "onUnload");
    }
  });

  it("keeps the direct-upload mode through recognition and saves its private cloud terminal state", async () => {
    const page = createRuntimePage();
    call(page, "onLoad");
    await call(page, "onImportBoard", baseEvent({ flowMode: "direct-upload" }));
    expect(page.data).toMatchObject({
      currentView: "camera-capture",
      recognitionMode: "direct-upload",
      recognitionValidation: { canConfirm: false },
    });

    call(page, "onCameraReady");
    await call(page, "onCaptureBoardMedia");
    await confirmFrozenBoard(page);
    expect(page.data.currentView).toBe("recognition-result");

    call(page, "onRecognitionIpInput", {
      detail: { value: "  葬送的芙莉莲  " },
    });
    expect(validationOf(page).canConfirm).toBe(false);
    call(page, "onRecognitionLocationInput", {
      detail: { value: "  秋叶原本店，入口右侧  " },
    });
    call(page, "onRecognitionPriceInput", { detail: { value: "650" } });
    expect(validationOf(page).canConfirm).toBe(true);

    const restored = createRuntimePage();
    call(restored, "onLoad");
    expect(restored.data).toMatchObject({
      currentView: "recognition-result",
      recognitionMode: "direct-upload",
      recognitionIp: "  葬送的芙莉莲  ",
      recognitionLocationNote: "  秋叶原本店，入口右侧  ",
      recognitionValidation: { canConfirm: true },
    });

    await confirmR2Board(restored);
    expect(restored.data.modalView).toBe("board-upload-submitted");
    await vi.advanceTimersByTimeAsync(0);
    expect(restored.data.mapUploadSharingMessage).toContain("本条记录已上传");
    expect(restored.data.mapUploadSharingMessage).not.toContain(
      "已上传并保存分享授权",
    );
    expect(
      [...stored.keys()].some((key) =>
        key.startsWith("ichi.map-shared-uploads."),
      ),
    ).toBe(false);
    const pendingUploads = JSON.parse(
      String(stored.get(LOCAL_DRAW_DRAFTS_KEY)),
    ) as Array<Record<string, unknown>>;
    expect(pendingUploads).toHaveLength(1);
    expect(pendingUploads[0]).toMatchObject({
      recordType: "board-upload",
      ipName: "葬送的芙莉莲",
      locationNote: "秋叶原本店，入口右侧",
      verificationStatus: "unverified",
      uploadStatus: "uploaded",
      cloudRecordId: "record_0123456789abcdef0123456789abcdef",
      history: [],
      cost: 0,
    });
    expect(pendingUploads[0]?.recordCode).toMatch(/^[A-Z0-9]{6}$/);
    expect(restored.data.startDrafts).toEqual([]);
    expect(restored.data.contributions).toMatchObject([
      { recordType: "board-upload", recordStateLabel: "已上传" },
    ]);

    stored.set(
      LOCAL_DRAW_DRAFTS_KEY,
      JSON.stringify([
        {
          ...pendingUploads[0],
          verificationStatus: "verified",
          uploadStatus: "uploaded",
        },
      ]),
    );
    call(restored, "refreshDrafts");
    expect(restored.data.contributions).toMatchObject([
      {
        recordType: "board-upload",
        recordStateLabel: "已上传",
      },
    ]);
    call(restored, "onSubmittedExit");
    expect(restored.data).toMatchObject({
      currentView: "start",
      modalView: "",
    });
    call(page, "onUnload");
    call(restored, "onUnload");
  });

  it("allows empty count edits and requires every count before either submission path", () => {
    const page = createRuntimePage();
    call(page, "onLoad");
    page.setData({ currentView: "recognition-result" });
    call(page, "onRecognitionIpInput", {
      detail: { value: "葬送的芙莉莲" },
    });
    expect(validationOf(page).canConfirm).toBe(false);

    call(page, "onRecognitionPriceInput", { detail: { value: "" } });
    expect(page.data.recognitionPrice).toBeNull();
    expect(validationOf(page)).toMatchObject({
      unitPriceBlocking: true,
      canConfirm: false,
    });
    call(page, "onRecognitionPriceInput", { detail: { value: "58" } });
    expect(page.data.recognitionPrice).toBe(58);
    expect(validationOf(page)).toMatchObject({
      unitPriceBlocking: false,
      canConfirm: true,
    });

    call(page, "onRecognitionThemeInput", { detail: { value: "" } });
    expect(validationOf(page).canConfirm).toBe(true);

    call(page, "onRecognitionFieldInput", {
      currentTarget: { dataset: { tier: "A", field: "remainingTickets" } },
      detail: { value: "" },
    });
    expect(
      (
        page.data.recognitionPrizes as Array<{
          tier: string;
          remainingTickets: number | null;
        }>
      ).find((prize) => prize.tier === "A"),
    ).toMatchObject({ remainingTickets: null });
    expect(validationOf(page).canConfirm).toBe(false);
    expect(
      validationOf(page).tiers.find(
        (tier: { tier: string }) => tier.tier === "A",
      ),
    ).toMatchObject({
      remainingTicketsBlocking: true,
    });

    call(page, "onRecognitionFieldInput", {
      currentTarget: { dataset: { tier: "A", field: "remainingTickets" } },
      detail: { value: "0" },
    });
    expect(validationOf(page).canConfirm).toBe(true);
    expect(
      validationOf(page).tiers.find(
        (tier: { tier: string }) => tier.tier === "A",
      ),
    ).toMatchObject({
      remainingTickets: 0,
      remainingTicketsBlocking: false,
    });
    const savedFlow = JSON.parse(
      String(stored.get("ichi:v1-e-recognition-flow:v1")),
    ) as {
      prizes: Array<{
        tier: string;
        remainingTickets: number | null;
      }>;
    };
    expect(
      savedFlow.prizes.find((prize) => prize.tier === "A")?.remainingTickets,
    ).toBe(0);

    page.setData({
      recognitionMode: "direct-upload",
      recognitionLocationNote: "秋叶原本店",
    });
    call(page, "onRecognitionFieldInput", {
      currentTarget: { dataset: { tier: "B", field: "remainingTickets" } },
      detail: { value: "" },
    });
    expect(validationOf(page).canConfirm).toBe(false);
    call(page, "onUnload");
  });

  it("keeps R=0 in Grand selection and never classifies a low R automatically", () => {
    const page = createRuntimePage();
    call(page, "onLoad");
    page.setData({ currentView: "recognition-result" });
    call(page, "onRecognitionIpInput", { detail: { value: "世界之外" } });
    call(page, "onRecognitionPriceInput", { detail: { value: "65" } });
    call(page, "onRecognitionFieldInput", {
      currentTarget: { dataset: { tier: "B", field: "remainingTickets" } },
      detail: { value: "0" },
    });

    call(page, "onConfirmRecognition");
    expect(page.data.currentView).toBe("grand-prize-selection");
    expect(page.data.grandPrizeOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tier: "A",
          remainingTickets: 2,
          selected: false,
        }),
        expect.objectContaining({
          tier: "B",
          remainingTickets: 0,
          selected: false,
        }),
      ]),
    );

    call(page, "onToggleGrandPrize", baseEvent({ tier: "B" }));
    call(page, "onConfirmGrandPrizes");
    expect(page.data.activeDraft).toMatchObject({
      grandPrizes: [{ tier: "B", remaining: 0, slots: [] }],
      normalPrizes: expect.arrayContaining([
        expect.objectContaining({ tier: "A", remaining: 2 }),
      ]),
    });
    call(page, "onUnload");
  });

  it("reveals a ticket bidirectionally, commits only past halfway and keeps workspace actions usable", () => {
    const page = createRuntimePage();
    enterDraw(page);
    const initial = page.data.activeDraft as {
      grandPrizes: Array<{ tier: string }>;
      normalPrizes: Array<{ tier: string }>;
      remaining: number;
    };
    expect(initial.grandPrizes).toEqual([]);
    expect(initial.normalPrizes.map((prize) => prize.tier)).toEqual([
      "A",
      "B",
      "C",
      "SP1",
      "D",
      "E",
      "F",
    ]);

    call(page, "onTicketPeelStart", ticketPeelEvent("A", 10, "active", 0));
    call(page, "onTicketPeelMove", ticketPeelEvent("A", 50, "active", 500));
    expect(Number(page.data.ticketPeelProgress)).toBeCloseTo(44.444, 2);
    call(page, "onTicketPeelMove", ticketPeelEvent("A", 30, "active", 750));
    expect(Number(page.data.ticketPeelProgress)).toBeCloseTo(20.833, 2);
    call(page, "onTicketPeelEnd", ticketPeelEvent("A", 30, "ended", 1000));
    vi.advanceTimersByTime(320);
    expect(page.data.ticketPeelProgress).toBe(0);
    expect((page.data.activeDraft as { remaining: number }).remaining).toBe(
      initial.remaining,
    );

    call(page, "onTicketPeelStart", ticketPeelEvent("A", 10, "active", 0));
    call(page, "onTicketPeelMove", ticketPeelEvent("A", 58, "active", 1000));
    call(page, "onTicketPeelEnd", ticketPeelEvent("A", 58, "ended", 1500));
    vi.advanceTimersByTime(320);
    expect((page.data.activeDraft as { remaining: number }).remaining).toBe(
      initial.remaining,
    );

    call(page, "onTicketPeelStart", ticketPeelEvent("A", 10, "active", 0));
    call(page, "onTicketPeelMove", ticketPeelEvent("A", 70, "active", 800));
    call(page, "onTicketPeelEnd", ticketPeelEvent("A", 70, "ended", 1000));
    expect(page.data).toMatchObject({
      ticketPeelProgress: 66.40625,
      ticketPeelSettling: true,
      ticketPeelBusy: true,
    });
    vi.advanceTimersByTime(319);
    expect((page.data.activeDraft as { remaining: number }).remaining).toBe(
      initial.remaining,
    );
    vi.advanceTimersByTime(1);
    const drawn = page.data.activeDraft as { remaining: number };
    expect(drawn.remaining).toBe(initial.remaining - 1);
    expect(page.data.toast).toMatchObject({
      visible: true,
      tier: "A",
      cost: "650",
      presentation: "small",
    });
    const beforePersistence = JSON.parse(
      String(stored.get(LOCAL_DRAW_DRAFTS_KEY)),
    ) as Array<{
      prizeData: Array<{ initialRemainingTickets: number }>;
      history: unknown[];
    }>;
    expect(
      (beforePersistence[0]?.prizeData.reduce(
        (sum, prize) => sum + prize.initialRemainingTickets,
        0,
      ) ?? 0) - (beforePersistence[0]?.history.length ?? 0),
    ).toBe(initial.remaining);

    vi.advanceTimersByTime(1);
    const afterPersistence = JSON.parse(
      String(stored.get(LOCAL_DRAW_DRAFTS_KEY)),
    ) as Array<{
      prizeData: Array<{ initialRemainingTickets: number }>;
      history: unknown[];
    }>;
    expect(
      (afterPersistence[0]?.prizeData.reduce(
        (sum, prize) => sum + prize.initialRemainingTickets,
        0,
      ) ?? 0) - (afterPersistence[0]?.history.length ?? 0),
    ).toBe(initial.remaining - 1);

    expect(page.data.ticketPeelProgress).toBe(145);
    expect(page.data.ticketPeelFading).toBe(true);
    vi.advanceTimersByTime(78);
    expect(page.data.ticketPeelProgress).toBe(145);
    vi.advanceTimersByTime(1);
    expect(page.data).toMatchObject({
      ticketPeelTier: "",
      ticketPeelProgress: 0,
      ticketPeelSettling: false,
      ticketPeelBusy: false,
      ticketPeelFading: false,
    });

    call(page, "onTicketPeelStart", ticketPeelEvent("D", 20, "active", 0));
    call(page, "onTicketPeelMove", ticketPeelEvent("D", 100, "active", 800));
    call(page, "onTicketPeelEnd", ticketPeelEvent("D", 100, "ended", 1000));
    vi.advanceTimersByTime(320);
    expect(
      (
        page.data.activeDraft as {
          historyItems: Array<{
            index: number;
            tier: string;
            remaining: number;
            cost: string;
          }>;
        }
      ).historyItems,
    ).toMatchObject([
      {
        index: 2,
        tier: "D",
        remaining: initial.remaining - 2,
        cost: "1,300",
      },
      {
        index: 1,
        tier: "A",
        remaining: initial.remaining - 1,
        cost: "650",
      },
    ]);
    vi.advanceTimersByTime(1);

    call(page, "onOpenProbability");
    expect(page.data.modalView).toBe("probability");
    page.setData({ modalView: "" });
    call(page, "onOpenHistory");
    expect(page.data.modalView).toBe("history");
    expect(
      (page.data.activeDraft as { historyItems: unknown[] }).historyItems,
    ).toHaveLength(2);
    page.setData({ modalView: "" });
    call(page, "onUndoDraw");
    expect(page.data.activeDraft).toMatchObject({
      remaining: initial.remaining - 1,
    });
    expect(
      (page.data.activeDraft as { historyItems: unknown[] }).historyItems,
    ).toHaveLength(1);
    call(page, "onUnload");
  });

  it("restores the active draw board from persisted navigation state", () => {
    const page = createRuntimePage();
    enterDraw(page);
    const boardId = (page.data.activeDraft as { boardId: string }).boardId;

    const reloaded = createRuntimePage();
    call(reloaded, "onLoad");
    expect(reloaded.data.currentView).toBe("draw");
    expect(reloaded.data.activeDraft).toMatchObject({ boardId });
    call(page, "onUnload");
    call(reloaded, "onUnload");
  });

  it("keeps an active draw session and its persisted history when a late cloud refresh completes", async () => {
    const page = createRuntimePage();
    enterDraw(page);
    const boardId = (page.data.activeDraft as { boardId: string }).boardId;

    call(page, "commitDraw", "A", false);
    await vi.advanceTimersByTimeAsync(1);
    call(page, "commitDraw", "D", false);
    await vi.advanceTimersByTimeAsync(1);

    const beforeRefresh = JSON.parse(
      String(stored.get(LOCAL_DRAW_DRAFTS_KEY)),
    ) as LocalDrawDraft[];
    expect(beforeRefresh[0]).toMatchObject({ boardId });
    expect(beforeRefresh[0]?.history.map((event) => event.tier)).toEqual([
      "A",
      "D",
    ]);

    await call(page, "refreshCloudRecords");

    expect(page.data).toMatchObject({
      currentView: "draw",
      activeDraft: { boardId },
    });
    const afterRefresh = JSON.parse(
      String(stored.get(LOCAL_DRAW_DRAFTS_KEY)),
    ) as LocalDrawDraft[];
    expect(afterRefresh[0]?.history).toEqual(beforeRefresh[0]?.history);
    expect(
      (page.data.activeDraft as { historyItems: unknown[] }).historyItems,
    ).toHaveLength(2);
    call(page, "onUnload");
  });

  it("keeps four draws aligned across refresh, re-entry, submission, and verification identity", async () => {
    const page = createRuntimePage();
    enterDraw(page);
    const boardId = (page.data.activeDraft as { boardId: string }).boardId;

    for (const tier of ["A", "D"] as const) {
      call(page, "commitDraw", tier, false);
      await vi.advanceTimersByTimeAsync(1);
    }
    await call(page, "refreshCloudRecords");
    expect(page.data.currentView).toBe("draw");

    const reloaded = createRuntimePage();
    call(reloaded, "onLoad");
    expect(reloaded.data).toMatchObject({
      currentView: "draw",
      activeDraft: { boardId },
    });
    for (const tier of ["B", "C"] as const) {
      call(reloaded, "commitDraw", tier, false);
      await vi.advanceTimersByTimeAsync(1);
    }
    const persisted = JSON.parse(
      String(stored.get(LOCAL_DRAW_DRAFTS_KEY)),
    ) as LocalDrawDraft[];
    expect(persisted[0]?.history.map((event) => event.tier)).toEqual([
      "A",
      "D",
      "B",
      "C",
    ]);

    reloaded.setData({
      shareImagePath: "wxfile://four-draw-evidence.jpg",
      shareNote: "四抽完整赏票",
      shareReady: true,
    });
    await call(reloaded, "onSubmitEvidence");

    const submit = cloudCallFunctionMock.mock.calls.find(
      ([request]) =>
        request.name === "recognize-draw-tickets" &&
        request.data?.action === "submit",
    )?.[0].data;
    expect(submit).toMatchObject({
      boardId,
      submissionVersion: 1,
      authoritativeDrawEvents: [
        { tierCode: "A" },
        { tierCode: "D" },
        { tierCode: "B" },
        { tierCode: "C" },
      ],
    });
    const verify = cloudCallFunctionMock.mock.calls.find(
      ([request]) =>
        request.name === "recognize-draw-tickets" &&
        request.data?.action === "verify",
    )?.[0].data;
    expect(verify).toMatchObject({
      recordId: submit?.recordId,
      boardId,
      submissionVersion: submit?.submissionVersion,
      imageFileId: expect.any(String),
    });
    call(page, "onUnload");
    call(reloaded, "onUnload");
  });

  it("updates a resumed draft time only after the session adds draws", () => {
    vi.setSystemTime(new Date(2026, 7, 13, 10, 0));
    const page = createRuntimePage();
    enterDraw(page);
    const initialRecords = JSON.parse(
      String(stored.get(LOCAL_DRAW_DRAFTS_KEY)),
    ) as Array<{
      boardId: string;
      recordCode: string;
      savedAt: number;
      history: unknown[];
    }>;
    const initial = initialRecords[0];
    expect(initial).toBeTruthy();

    call(page, "onSaveDraftAndExit");
    call(page, "onOpenDraft", baseEvent({ boardId: initial?.boardId }));
    vi.setSystemTime(new Date(2026, 7, 13, 11, 0));
    call(page, "onSaveDraftAndExit");
    const unchanged = JSON.parse(
      String(stored.get(LOCAL_DRAW_DRAFTS_KEY)),
    ) as typeof initialRecords;
    expect(unchanged[0]?.savedAt).toBe(initial?.savedAt);

    call(page, "onOpenDraft", baseEvent({ boardId: initial?.boardId }));
    call(page, "onTicketPeelStart", ticketPeelEvent("A", 10, "active", 0));
    call(page, "onTicketPeelMove", ticketPeelEvent("A", 70, "active", 800));
    call(page, "onTicketPeelEnd", ticketPeelEvent("A", 70, "ended", 1000));
    vi.advanceTimersByTime(321);
    vi.setSystemTime(new Date(2026, 7, 13, 11, 45));
    call(page, "onSaveDraftAndExit");

    const updated = JSON.parse(
      String(stored.get(LOCAL_DRAW_DRAFTS_KEY)),
    ) as typeof initialRecords;
    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({
      boardId: initial?.boardId,
      recordCode: initial?.recordCode,
      savedAt: new Date(2026, 7, 13, 11, 45).valueOf(),
    });
    expect(updated[0]?.history).toHaveLength(1);
    expect(page.data.startDrafts).toMatchObject([
      {
        boardId: initial?.boardId,
        recordCode: initial?.recordCode,
        createdAtLabel: "8/13 11:45",
      },
    ]);
    call(page, "onUnload");
  });

  it("does not grant map sharing when continuing or saving a private draw", () => {
    const page = createRuntimePage();
    enterDraw(page);
    page.setData({ modalView: "share-decision" });
    call(page, "onContinueDraw");
    call(page, "onSaveDraftAndExit");
    expect(
      [...stored.keys()].some((key) =>
        key.startsWith("ichi.map-shared-uploads."),
      ),
    ).toBe(false);
    expect(
      cloudCallFunctionMock.mock.calls.some(
        ([r]) => r.data?.command === "SET_INITIAL_CHOICE",
      ),
    ).toBe(false);
    call(page, "onUnload");
  });

  it("automatically grants only the explicitly submitted draw after trusted verification", async () => {
    const baseCloudCall = cloudCallFunctionMock.getMockImplementation()!;
    let approved = false;
    cloudCallFunctionMock.mockImplementation(async (request) => {
      if (request.name === "manage-map-contribution-consent")
        return {
          result: {
            ok: true,
            termsVersion: PRODUCTION_MAP_TERMS.version,
            scopeDigest: PRODUCTION_MAP_TERMS.scopeDigest,
            accepted: true,
          },
        };
      const r = await baseCloudCall(request);
      if (request.name === "recognize-draw-tickets") {
        if (request.data.action !== "submit") approved = true;
        return {
          result: {
            ...r.result,
            data: { ...r.result.data, boardId: request.data.boardId },
          },
        };
      }
      return r;
    });
    const page = createRuntimePage();
    enterDraw(page);
    page.setData({
      shareImagePath: "wxfile://map-share.jpg",
      shareNote: "确认分享",
      shareReady: true,
    });
    await call(page, "onSubmitEvidence");
    await vi.advanceTimersByTimeAsync(0);
    expect(approved).toBe(true);
    const grants = cloudCallFunctionMock.mock.calls.filter(
      ([r]) =>
        r.name === "finalize-board-observation" &&
        r.data.action === "prepare-new-upload" &&
        Boolean(r.data.uploadSharing),
    );
    expect(grants).toHaveLength(1);
    expect(grants[0]?.[0].data).toMatchObject({
      action: "prepare-new-upload",
      uploadSharing: {
        disclosureVersion: UPLOAD_SHARING_DISCLOSURE_VERSION,
        rightsAttested: true,
      },
    });
    expect(
      [...stored.entries()]
        .filter(([key]) => key.startsWith("ichi.map-shared-uploads."))
        .map(([, value]) => JSON.parse(String(value))),
    ).toEqual([[]]);
    call(page, "onUnload");
  });

  it.each(["verification retry", "replacement photo", "note review"] as const)(
    "retries the existing upload-sharing intent when a cloud-only %s succeeds",
    async (route) => {
      const recordId = "record_0123456789abcdef0123456789abcdef";
      const boardId = "board-draw-1";
      const key = `ichi.map-shared-uploads.${PRODUCTION_MAP_TERMS.version}.${PRODUCTION_MAP_TERMS.scopeDigest}`;
      // A prior explicit submission persisted this intent before the local draft was removed.
      stored.set(key, JSON.stringify([recordId]));
      const baseCloudCall = cloudCallFunctionMock.getMockImplementation()!;
      let approved = false;
      cloudCallFunctionMock.mockImplementation(async (request) => {
        if (request.name === "manage-map-contribution-consent")
          return {
            result: {
              ok: true,
              termsVersion: PRODUCTION_MAP_TERMS.version,
              scopeDigest: PRODUCTION_MAP_TERMS.scopeDigest,
              accepted: true,
            },
          };
        const response = await baseCloudCall(request);
        if (request.name === "recognize-draw-tickets") {
          if (request.data.action !== "submit") approved = true;
          return {
            result: {
              ...response.result,
              data: {
                ...response.result.data,
                recordId,
                boardId,
                submissionVersion: request.data.submissionVersion,
                status:
                  request.data.action === "submit"
                    ? "PHOTO_PENDING"
                    : "APPROVED",
              },
            },
          };
        }
        return response;
      });
      const page = createRuntimePage();
      page.setData({
        cloudRecords: [
          {
            recordId,
            boardId,
            submissionVersion: 1,
            userNote: "待修复备注",
            verificationPending: {
              recordId,
              boardId,
              submissionVersion: 1,
              imageFileId: "cloud://test/ticket.jpg",
              captureSource: "camera",
              capturedAt: Date.now(),
              albumSaveWarning: false,
              image: { width: 1200, height: 1600, byteLength: 1000 },
            },
          },
        ],
      });
      expect(stored.has(LOCAL_DRAW_DRAFTS_KEY)).toBe(false);
      if (route === "verification retry")
        call(page, "onRetryTicketVerification", baseEvent({ boardId }));
      else if (route === "replacement photo")
        await call(page, "onReuploadTicketEvidence", baseEvent({ boardId }));
      else {
        call(page, "onEditTicketNote", baseEvent({ boardId }));
        call(page, "onReviewNoteInput", {
          detail: { value: "通过安全审核的新备注" },
        });
        await call(page, "onSubmitNoteReview");
      }
      await vi.advanceTimersByTimeAsync(0);
      expect(approved).toBe(true);
      expect(
        cloudCallFunctionMock.mock.calls.filter(
          ([r]) =>
            r.name === "finalize-board-observation" &&
            r.data.action === "confirm-upload-sharing",
        ),
      ).toHaveLength(1);
      expect(JSON.parse(String(stored.get(key)))).toEqual([]);
      call(page, "onUnload");
    },
  );

  it("does not manufacture a sharing intent when refreshing or approving an old cloud-only record", async () => {
    const page = createRuntimePage();
    page.setData({
      noteReviewRecordId: "record_0123456789abcdef0123456789abcdef",
      noteReviewBoardId: "board-draw-1",
      noteReviewSubmissionVersion: 1,
      shareNote: "历史备注",
    });
    await call(page, "onSubmitNoteReview");
    await vi.advanceTimersByTimeAsync(0);
    expect(
      [...stored.keys()].some((key) =>
        key.startsWith("ichi.map-shared-uploads."),
      ),
    ).toBe(false);
    expect(
      cloudCallFunctionMock.mock.calls.some(
        ([r]) => r.name === "manage-map-player-source",
      ),
    ).toBe(false);
    call(page, "onUnload");
  });

  it("enforces the hold, share-note and versioned private submission lifecycle", async () => {
    const page = createRuntimePage();
    enterDraw(page);
    const draft = call(page, "getActiveDraft") as Record<string, unknown>;
    call(page, "persistDraft", {
      ...draft,
      cloudRecordId: "record_0123456789abcdef0123456789abcdef",
    });

    call(page, "onStopTouchStart");
    vi.advanceTimersByTime(499);
    call(page, "onStopTouchEnd");
    expect(page.data.modalView).toBe("");

    call(page, "onStopTouchStart");
    vi.advanceTimersByTime(500);
    expect(page.data.modalView).toBe("share-decision");
    call(page, "onOpenShareCapture");
    page.setData({ shareImagePath: "wxfile://evidence.jpg" });
    call(page, "onShareNoteInput", {
      detail: { value: "秋叶原本店，A赏已被抽走" },
    });
    expect(page.data.shareReady).toBe(true);
    await call(page, "onSubmitEvidence");
    expect(page.data).toMatchObject({
      activeTab: "my",
      currentView: "contributions",
      modalView: "",
      shareImagePath: "",
    });

    const saved = JSON.parse(
      String(stored.get(LOCAL_DRAW_DRAFTS_KEY)),
    ) as Array<{
      locationNote?: string;
      uploadStatus: string;
      submissionState?: string;
      evidenceSubmissionVersion?: number;
      verificationStatus?: string;
    }>;
    expect(saved[0]).toMatchObject({
      locationNote: "秋叶原本店，A赏已被抽走",
      uploadStatus: "uploaded",
      submissionState: "pending-review",
      evidenceSubmissionVersion: 1,
    });
    expect(saved[0]).toMatchObject({ verificationStatus: "pending" });
    expect(stored.get(RECOGNITION_VIEW_KEY)).toBe("start");
    expect(stored.has(ACTIVE_DRAFT_BOARD_KEY)).toBe(false);
    call(page, "onSelectTab", {
      currentTarget: { dataset: { tab: "recognize" } },
    });
    expect(page.data).toMatchObject({
      activeTab: "recognize",
      currentView: "start",
      activeDraft: null,
    });
    expect(
      cloudCallFunctionMock.mock.calls.map(([request]) => request.name),
    ).toEqual(expect.arrayContaining(["recognize-draw-tickets"]));
    expect(
      cloudCallFunctionMock.mock.calls.some(
        ([request]) => request.name === "finalize-draw-update",
      ),
    ).toBe(false);
    expect(
      cloudCallFunctionMock.mock.calls.find(
        ([request]) =>
          request.name === "recognize-draw-tickets" &&
          request.data?.action === "submit",
      )?.[0].data,
    ).toMatchObject({
      userNote: "秋叶原本店，A赏已被抽走",
      ticketLocation: expect.objectContaining({ source: "camera" }),
      authoritativeDrawEvents: expect.any(Array),
    });
    call(page, "onUnload");
  });

  it("starts every true NEW upload with an empty note but preserves NOTE_FAILED edit text", () => {
    const page = createRuntimePage();
    enterDraw(page);
    const draft = call(page, "getActiveDraft") as LocalDrawDraft;
    call(page, "persistDraft", {
      ...draft,
      cloudRecordId: "record_0123456789abcdef0123456789abcdef",
      evidenceSubmissionVersion: 1,
      verificationStatus: "note-failed",
      locationNote: "ABC",
    });
    page.setData({ shareNote: "ABC", shareReady: true });

    call(page, "onStopTouchStart");
    vi.advanceTimersByTime(500);
    expect(page.data).toMatchObject({
      modalView: "share-decision",
      shareNote: "",
      shareReady: false,
    });

    call(page, "onEditTicketNote", baseEvent({ boardId: draft.boardId }));
    expect(page.data).toMatchObject({
      modalView: "note-review",
      shareNote: "ABC",
    });
  });

  it("closes note review immediately while verification continues in the background", async () => {
    const page = createRuntimePage();
    enterDraw(page);
    const draft = call(page, "getActiveDraft") as LocalDrawDraft;
    call(page, "persistDraft", {
      ...draft,
      cloudRecordId: "record_0123456789abcdef0123456789abcdef",
      evidenceSubmissionVersion: 1,
      verificationStatus: "note-failed",
      locationNote: "旧备注",
    });
    page.setData({ currentView: "contributions" });
    call(page, "onEditTicketNote", baseEvent({ boardId: draft.boardId }));
    call(page, "onReviewNoteInput", { detail: { value: "新备注" } });

    let resolveReview!: (value: unknown) => void;
    const reviewResponse = new Promise((resolve) => {
      resolveReview = resolve;
    });
    const baseCloudCall = cloudCallFunctionMock.getMockImplementation();
    cloudCallFunctionMock.mockImplementation(async (request) => {
      if (
        request.name === "recognize-draw-tickets" &&
        request.data?.action === "review-note"
      )
        return reviewResponse;
      return baseCloudCall?.(request);
    });

    const pending = call(page, "onSubmitNoteReview") as Promise<void>;
    expect(page.data).toMatchObject({
      activeTab: "my",
      currentView: "contributions",
      modalView: "",
      evidenceSubmitting: true,
    });
    const savedDrafts = JSON.parse(
      String(stored.get(LOCAL_DRAW_DRAFTS_KEY)),
    ) as LocalDrawDraft[];
    expect(
      savedDrafts.find((item) => item.boardId === draft.boardId)
        ?.verificationStatus,
    ).toBe("note-pending");

    resolveReview({
      result: {
        ok: true,
        data: {
          recordId: "record_0123456789abcdef0123456789abcdef",
          boardId: draft.boardId,
          submissionVersion: 1,
          status: "APPROVED",
        },
      },
    });
    await pending;
    expect(page.data).toMatchObject({
      currentView: "contributions",
      modalView: "",
      evidenceSubmitting: false,
    });
  });

  it("adopts a server-resolved publication for a non-tombstoned stale reference before NEW upload", async () => {
    const oldRecordId = "record_0123456789abcdef0123456789abcdef";
    const newRecordId = "record_fedcba9876543210fedcba9876543210";
    const baseCloudCall = cloudCallFunctionMock.getMockImplementation();
    cloudCallFunctionMock.mockImplementation(async (request) => {
      if (
        request.name === "finalize-board-observation" &&
        request.data?.action === "prepare-new-upload"
      ) {
        return {
          result: {
            ok: true,
            data: {
              recordId: newRecordId,
              recordCode: "LXZDNB",
              boardId: request.data.boardId,
              status: "private_saved",
              idempotent: false,
              created: true,
            },
          },
        };
      }
      const result = await baseCloudCall?.(request);
      if (request.name === "recognize-draw-tickets" && result?.result?.data) {
        return {
          result: {
            ...result.result,
            data: { ...result.result.data, recordId: newRecordId },
          },
        };
      }
      return result;
    });
    const page = createRuntimePage();
    enterDraw(page);
    const draft = call(page, "getActiveDraft") as LocalDrawDraft;
    call(page, "persistDraft", {
      ...draft,
      recognitionJobId: "recognition-job-1",
      cloudRecordId: oldRecordId,
      history: [
        { id: "draw-first", tier: "A" },
        { id: "draw-next-1", tier: "B" },
        { id: "draw-next-2", tier: "C" },
      ],
      verificationStatus: "unverified",
      uploadStatus: "not-uploaded",
      submissionState: "local",
      locationNote: "ABC",
    });
    page.setData({ shareImagePath: "wxfile://new-observation.jpg" });
    call(page, "onShareNoteInput", { detail: { value: "NEW" } });

    await call(page, "onSubmitEvidence");

    const prepareCalls = cloudCallFunctionMock.mock.calls.filter(
      ([request]) =>
        request.name === "finalize-board-observation" &&
        request.data?.action === "prepare-new-upload",
    );
    expect(prepareCalls).toHaveLength(1);
    expect(prepareCalls[0]?.[0].data).toMatchObject({
      currentRecordId: oldRecordId,
      boardId: draft.boardId,
      recognitionJobId: "recognition-job-1",
    });
    expect(
      cloudCallFunctionMock.mock.calls.find(
        ([request]) =>
          request.name === "recognize-draw-tickets" &&
          request.data?.action === "submit",
      )?.[0].data,
    ).toMatchObject({
      recordId: newRecordId,
      submissionVersion: 1,
      authoritativeDrawEvents: [
        { eventId: "draw-first", tierCode: "A" },
        { eventId: "draw-next-1", tierCode: "B" },
        { eventId: "draw-next-2", tierCode: "C" },
      ],
    });
    await vi.waitFor(() =>
      expect(
        cloudCallFunctionMock.mock.calls.find(
          ([request]) =>
            request.name === "recognize-draw-tickets" &&
            request.data?.action === "verify",
        )?.[0].data,
      ).toMatchObject({
        recordId: newRecordId,
        boardId: draft.boardId,
        submissionVersion: 1,
      }),
    );
    const saved = JSON.parse(
      String(stored.get(LOCAL_DRAW_DRAFTS_KEY)),
    )[0] as LocalDrawDraft;
    expect(saved).toMatchObject({
      boardId: draft.boardId,
      cloudRecordId: newRecordId,
      recordCode: "LXZDNB",
      evidenceSubmissionVersion: 1,
    });
    expect(saved.history).toEqual([
      { id: "draw-first", tier: "A" },
      { id: "draw-next-1", tier: "B" },
      { id: "draw-next-2", tier: "C" },
    ]);
  });

  it("does not lazily recreate a publication after explicit cloud deletion", async () => {
    const oldRecordId = "record_0123456789abcdef0123456789abcdef";
    const page = createRuntimePage();
    enterDraw(page);
    const draft = call(page, "getActiveDraft") as LocalDrawDraft;
    call(page, "persistDraft", {
      ...draft,
      recognitionJobId: "recognition-job-lifecycle",
      cloudRecordId: oldRecordId,
      history: [{ id: "draw-before-delete", tier: "C" }],
      verificationStatus: "verified",
      uploadStatus: "uploaded",
      submissionState: "uploaded",
      evidenceSubmissionVersion: 1,
      locationNote: "O1 historical note",
    });
    call(
      page,
      "onDeleteCloudRecord",
      baseEvent({ recordId: oldRecordId, boardId: draft.boardId }),
    );
    cloudRecordsResult = [];
    await call(page, "onConfirmDeleteUploadedBoard");

    const reloaded = createRuntimePage();
    call(reloaded, "onLoad");
    call(reloaded, "onOpenDraft", baseEvent({ boardId: draft.boardId }));
    expect(reloaded.data.activeDraft).toBeNull();
    expect(JSON.parse(String(stored.get(LOCAL_DRAW_DRAFTS_KEY)))).toEqual([]);
    expect(cloudCallFunctionMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        name: "finalize-board-observation",
        data: expect.objectContaining({ action: "prepare-new-upload" }),
      }),
    );
  });

  it("leaves capture on durable PENDING while a slow provider is unresolved", async () => {
    let resolveVerification!: (value: unknown) => void;
    const verification = new Promise((resolve) => {
      resolveVerification = resolve;
    });
    const baseCloudCall = cloudCallFunctionMock.getMockImplementation();
    cloudCallFunctionMock.mockImplementation(async (request) => {
      if (
        request.name === "recognize-draw-tickets" &&
        request.data?.action === "verify"
      )
        return verification;
      return baseCloudCall?.(request);
    });
    const page = createRuntimePage();
    enterDraw(page);
    const draft = call(page, "getActiveDraft") as LocalDrawDraft;
    call(page, "persistDraft", {
      ...draft,
      cloudRecordId: "record_0123456789abcdef0123456789abcdef",
    });
    call(page, "onOpenShareCapture");
    page.setData({ shareImagePath: "wxfile://slow-evidence.jpg" });
    call(page, "onShareNoteInput", { detail: { value: "现场备注" } });

    await call(page, "onSubmitEvidence");

    expect(page.data).toMatchObject({
      currentView: "contributions",
      modalView: "",
    });
    expect(page.data.contributions).toMatchObject([
      { recordStateLabel: "待核对" },
    ]);
    resolveVerification({
      result: {
        ok: true,
        data: {
          recordId: "record_0123456789abcdef0123456789abcdef",
          boardId: draft.boardId,
          submissionVersion: 1,
          status: "MISMATCH",
          expected: { total: 1, tierCounts: { G: 1 } },
          observed: { total: 0, tierCounts: {}, unknownTickets: 0 },
          mismatches: [{ tier: "G", expected: 1, observed: 0 }],
        },
      },
    });
    await vi.waitFor(() =>
      expect(page.data.contributions).toMatchObject([
        {
          recordStateLabel: "核验失败",
          verificationAction: "reupload",
        },
      ]),
    );
    call(page, "onSelectTab", {
      currentTarget: { dataset: { tab: "recognize" } },
    });
    expect(page.data).toMatchObject({
      activeTab: "recognize",
      currentView: "start",
      activeDraft: null,
    });
    call(page, "onUnload");
  });

  it("establishes PENDING before provider verification and never reports provider failure as upload failure", async () => {
    const baseCloudCall = cloudCallFunctionMock.getMockImplementation();
    cloudCallFunctionMock.mockImplementation(async (request) => {
      if (
        request.name === "recognize-draw-tickets" &&
        request.data?.action === "verify"
      )
        return {
          result: {
            ok: true,
            data: {
              recordId: "record_0123456789abcdef0123456789abcdef",
              boardId: "board-draw-1",
              submissionVersion: 1,
              status: "PROVIDER_FAILED",
              expected: { total: 0, tierCounts: {} },
              observed: { total: 0, tierCounts: {}, unknownTickets: 0 },
              mismatches: [],
            },
          },
        };
      return baseCloudCall?.(request);
    });
    const page = createRuntimePage();
    enterDraw(page);
    const draft = call(page, "getActiveDraft") as LocalDrawDraft;
    call(page, "persistDraft", {
      ...draft,
      cloudRecordId: "record_0123456789abcdef0123456789abcdef",
    });
    call(page, "onOpenShareCapture");
    page.setData({ shareImagePath: "wxfile://pending-first.jpg" });
    call(page, "onShareNoteInput", { detail: { value: "现场备注" } });

    await call(page, "onSubmitEvidence");

    const relevant = cloudCallFunctionMock.mock.calls
      .map(([request]) => ({
        name: request.name,
        action: request.data?.action,
      }))
      .filter((request) => request.name === "recognize-draw-tickets");
    expect(relevant.slice(0, 2)).toEqual([
      { name: "recognize-draw-tickets", action: "submit" },
      { name: "recognize-draw-tickets", action: "verify" },
    ]);
    expect(page.data).toMatchObject({
      currentView: "contributions",
      modalView: "",
    });
    await vi.waitFor(() =>
      expect(page.data.contributions).toMatchObject([
        {
          recordStateLabel: "核验异常",
          verificationAction: "retry",
        },
      ]),
    );
    expect(
      (wx.showToast as ReturnType<typeof vi.fn>).mock.calls.some(
        ([options]) => options.title === "上传失败，请重试",
      ),
    ).toBe(false);
    call(page, "onUnload");
  });

  it("stays on capture and reports upload failure before imageFileId exists", async () => {
    const page = createRuntimePage();
    enterDraw(page);
    const draft = call(page, "getActiveDraft") as LocalDrawDraft;
    call(page, "persistDraft", {
      ...draft,
      cloudRecordId: "record_0123456789abcdef0123456789abcdef",
    });
    call(page, "onOpenShareCapture");
    page.setData({ shareImagePath: "wxfile://failed-evidence.jpg" });
    call(page, "onShareNoteInput", { detail: { value: "现场备注" } });
    const uploadFile = (
      wx as unknown as { cloud: { uploadFile: ReturnType<typeof vi.fn> } }
    ).cloud.uploadFile;
    uploadFile.mockRejectedValueOnce(new Error("network"));

    await call(page, "onSubmitEvidence");

    expect(page.data).toMatchObject({
      modalView: "share-capture",
      shareImagePath: "wxfile://failed-evidence.jpg",
      shareReady: true,
    });
    expect(page.data.contributions).toEqual([]);
    call(page, "onUnload");
  });

  it("routes every my-area row independently and returns to my", () => {
    const page = createRuntimePage();
    call(page, "onLoad");
    for (const view of ["account", "contributions", "map-reminder", "method"]) {
      call(page, "onOpenMyPage", baseEvent({ view }));
      expect(page.data).toMatchObject({ activeTab: "my", currentView: view });
      call(page, "onBackToMy");
      expect(page.data.currentView).toBe("my");
    }
    call(page, "onOpenLocalRecords");
    expect(page.data).toMatchObject({
      activeTab: "my",
      currentView: "local-records",
    });
    call(page, "onUnload");
  });

  it("refreshes local and cloud records on entry and on pull-down without duplicate state", async () => {
    const page = createRuntimePage();
    call(page, "onLoad");
    cloudCallFunctionMock.mockClear();

    call(page, "onOpenLocalRecords");
    await vi.waitFor(() =>
      expect(
        cloudCallFunctionMock.mock.calls.some(
          ([request]) => request.name === "get-my-records",
        ),
      ).toBe(true),
    );

    cloudCallFunctionMock.mockClear();
    await call(page, "onRecordsRefresherRefresh");
    expect(page.data.recordsRefreshing).toBe(false);
    expect(
      cloudCallFunctionMock.mock.calls.filter(
        ([request]) => request.name === "get-my-records",
      ),
    ).toHaveLength(1);

    cloudCallFunctionMock.mockClear();
    call(page, "onOpenMyPage", baseEvent({ view: "contributions" }));
    await vi.waitFor(() =>
      expect(
        cloudCallFunctionMock.mock.calls.some(
          ([request]) => request.name === "get-my-records",
        ),
      ).toBe(true),
    );
    call(page, "onUnload");
  });

  it("requires confirmation before clearing every local record", () => {
    const page = createRuntimePage();
    enterDraw(page);
    expect(stored.has(LOCAL_DRAW_DRAFTS_KEY)).toBe(true);

    call(page, "onClearAllLocalData");
    modalRequests.at(-1)?.success?.({ confirm: false });
    expect(stored.has(LOCAL_DRAW_DRAFTS_KEY)).toBe(true);
    expect(page.data.currentView).toBe("draw");

    call(page, "onClearAllLocalData");
    modalRequests.at(-1)?.success?.({ confirm: true });
    expect(stored.has(LOCAL_DRAW_DRAFTS_KEY)).toBe(false);
    expect(page.data).toMatchObject({
      activeTab: "my",
      currentView: "deleted",
      drafts: [],
      startDrafts: [],
      contributions: [],
      activeDraft: null,
    });
    call(page, "onUnload");
  });
});

describe("TASK21 upload-only discovery defaults", () => {
  it("starts with upload-only unselected and lets users add it or explicitly show all", () => {
    const page = createRuntimePage();
    const options = page.data.mapDiscoveryTagOptions as {
      id: string;
      selected: boolean;
      emoji: string;
    }[];
    expect(page.data.mapSelectedDiscoveryTagIds).toHaveLength(5);
    expect(options.find((tag) => tag.id === "UPLOAD_ONLY")).toMatchObject({
      emoji: "📤",
      selected: false,
    });
    expect(page.data.mapAllDiscoveryTagsSelected).toBe(false);
    const update = vi.fn((search: string, ids: string[]) =>
      page.setData({ mapSearchText: search, mapSelectedDiscoveryTagIds: ids }),
    );
    (
      page as unknown as Record<string, unknown>
    ).updateMapDiscoveryPresentation = update;
    call(
      page,
      "onMapToggleDiscoveryFilter",
      baseEvent({ tagId: "UPLOAD_ONLY" }),
    );
    expect(page.data.mapSelectedDiscoveryTagIds).toHaveLength(6);
    call(
      page,
      "onMapToggleDiscoveryFilter",
      baseEvent({ tagId: "LAST_CHANCE" }),
    );
    const otherTags = [
      "UPLOAD_ONLY",
      "GRAND_PRIZE_REMAINS",
      "GRAND_PRIZE_RATIO",
      "SPLIT_SET",
      "LOW_OPPORTUNITY",
    ];
    expect(page.data.mapSelectedDiscoveryTagIds).toEqual(otherTags);
    call(
      page,
      "onMapToggleDiscoveryFilter",
      baseEvent({ tagId: "LAST_CHANCE" }),
    );
    expect(page.data.mapSelectedDiscoveryTagIds).toHaveLength(6);
    for (const tagId of ["LAST_CHANCE", ...otherTags]) {
      const before = page.data.mapSelectedDiscoveryTagIds as string[];
      call(page, "onMapToggleDiscoveryFilter", baseEvent({ tagId }));
      expect(page.data.mapSelectedDiscoveryTagIds).toEqual(
        before.filter((id) => id !== tagId),
      );
    }
    expect(page.data.mapSelectedDiscoveryTagIds).toEqual([]);
    call(
      page,
      "onMapToggleDiscoveryFilter",
      baseEvent({ tagId: "UPLOAD_ONLY" }),
    );
    expect(page.data.mapSelectedDiscoveryTagIds).toEqual(["UPLOAD_ONLY"]);
    page.setData({ mapSearchText: "query" });
    call(page, "onMapResetDiscoveryFilters");
    expect(page.data.mapSelectedDiscoveryTagIds).toHaveLength(6);
    expect(page.data.mapSearchText).toBe("");
  });
});
