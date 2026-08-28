import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  LOCAL_DRAW_DRAFTS_KEY,
  type LocalDrawDraft,
} from "../../platform/local-draw-drafts.js";
import {
  ACTIVE_DRAFT_BOARD_KEY,
  RECOGNITION_VIEW_KEY,
} from "../../platform/navigation-state.js";
import type { RecognitionDraftValidation } from "../../platform/recognition-flow.js";

type PageData = Record<string, unknown>;
type PageDefinition = { data: PageData } & Record<string, unknown>;

interface RuntimePage {
  data: PageData;
  setData(update: Record<string, unknown>): void;
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
let profileNickname = "ICHI 玩家";
let profileAvatarUrlAvailable = true;
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
    setData(update) {
      Object.entries(update).forEach(([path, value]) =>
        setAtPath(this.data, path, value),
      );
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
              ...(profileComplete
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
        return {
          result: {
            ok: true,
            data: {
              ichiId: "ICHI-001",
              nickname: profileNickname,
              avatarState: "wechat-authorized",
              avatarFileId: profileAvatarFileId,
              avatarUrl: "https://avatar.example/updated.jpg",
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
              recordId: "record_0123456789abcdef0123456789abcdef",
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
  profileNickname = "ICHI 玩家";
  profileAvatarUrlAvailable = true;
  app.globalData = {};
  vi.useFakeTimers();
});

describe("V1-E page behavior", () => {
  it("opens WeChat login on first use only and allows later profile updates", async () => {
    profileComplete = false;
    const page = createRuntimePage();
    call(page, "onLoad");
    await call(page, "onShow");
    await vi.waitFor(() => expect(page.data.accountState).toBe("ready"));
    expect(page.data.modalView).toBe("wechat-login");
    expect(page.data.profileAuthorizationPurpose).toBe("first-use");
    call(page, "onCloseWechatProfileAuthorization");
    expect(page.data.modalView).toBe("wechat-login");

    call(page, "onProfileNicknameInput", { detail: { value: "微信玩家" } });
    call(page, "onChooseWechatAvatar", {
      detail: { avatarUrl: "/tmp/wechat-avatar.jpg" },
    });
    expect(page.data.profileAuthorizationReady).toBe(true);
    await call(page, "onAuthorizeWechatProfile");
    expect(page.data).toMatchObject({
      modalView: "",
      accountNickname: "微信玩家",
      accountProfileState: "complete",
    });
    expect(String(page.data.accountAvatarUrl)).toMatch(
      /^\/user-data\/ichi-profile-avatar-/u,
    );

    await call(page, "onShow");
    await vi.waitFor(() => expect(page.data.accountState).toBe("ready"));
    expect(page.data.modalView).toBe("");
    call(page, "onOpenWechatProfileAuthorization");
    expect(page.data.modalView).toBe("wechat-login");
    expect(page.data.profileAuthorizationPurpose).toBe("update");
    expect(page.data.profileOriginalNickname).toBe("微信玩家");
    expect(page.data.profileAuthorizationReady).toBe(false);
    call(page, "onProfileNicknameInput", { detail: { value: "微信玩家" } });
    expect(page.data.profileAuthorizationReady).toBe(false);
    call(page, "onProfileNicknameInput", { detail: { value: "临时昵称" } });
    expect(page.data.profileAuthorizationReady).toBe(true);
    call(page, "onProfileNicknameInput", { detail: { value: "微信玩家" } });
    expect(page.data.profileAuthorizationReady).toBe(false);
    call(page, "onChooseWechatAvatar", {
      detail: { avatarUrl: "/tmp/avatar-only-update.jpg" },
    });
    expect(page.data.profileAuthorizationReady).toBe(true);
    call(page, "onCloseWechatProfileAuthorization");
    expect(page.data.modalView).toBe("");
    call(page, "onOpenWechatProfileAuthorization");
    call(page, "onProfileNicknameInput", { detail: { value: "新微信玩家" } });
    expect(page.data.profileAuthorizationReady).toBe(true);
    await call(page, "onAuthorizeWechatProfile");
    expect(page.data).toMatchObject({
      modalView: "",
      accountNickname: "新微信玩家",
      accountProfileState: "complete",
    });
    expect(cloudCallFunctionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "bind-wechat-profile",
        data: expect.objectContaining({
          nickname: "新微信玩家",
          avatarFileId: profileAvatarFileId,
        }),
      }),
    );
    profileAvatarUrlAvailable = false;
    call(page, "onSelectTab", baseEvent({ tab: "map" }));
    call(page, "onSelectTab", baseEvent({ tab: "my" }));
    await vi.waitFor(() =>
      expect(String(page.data.accountAvatarUrl)).toMatch(
        /^\/user-data\/ichi-profile-avatar-/u,
      ),
    );
    expect(page.data.accountNickname).toBe("新微信玩家");

    const reloaded = createRuntimePage();
    call(reloaded, "onLoad");
    expect(reloaded.data.accountNickname).toBe("新微信玩家");
    expect(String(reloaded.data.accountAvatarUrl)).toMatch(
      /^\/user-data\/ichi-profile-avatar-/u,
    );
  });

  it("shares one first-use authorization gate across both board entry paths", async () => {
    profileComplete = false;
    const page = createRuntimePage();
    await call(page, "onImportBoard", baseEvent({ flowMode: "assist" }));
    expect(page.data).toMatchObject({
      modalView: "wechat-login",
      profileAuthorizationPurpose: "first-use",
      resumeCaptureAfterProfileAuthorization: true,
      pendingRecognitionMode: "assist",
    });
    call(page, "onProfileNicknameInput", { detail: { value: "微信玩家" } });
    call(page, "onChooseWechatAvatar", {
      detail: { avatarUrl: "/tmp/wechat-avatar.jpg" },
    });
    await call(page, "onAuthorizeWechatProfile");
    expect(page.data.currentView).toBe("camera-capture");

    call(page, "onBackToStart");
    await call(page, "onImportBoard", baseEvent({ flowMode: "direct-upload" }));
    expect(page.data.currentView).toBe("camera-capture");
    expect(page.data.modalView).toBe("");
    expect(
      cloudCallFunctionMock.mock.calls.filter(
        ([request]) => request.name === "bind-wechat-profile",
      ),
    ).toHaveLength(1);
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
      { recordId: "private-1", recordStateLabel: "待核对" },
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
      { recordType: "board-upload", recordStateLabel: "待核对" },
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
        recordStateLabel: "待核对",
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
