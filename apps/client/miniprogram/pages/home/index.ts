import {
  chooseBoardImage,
  getWxBoardMediaApi,
} from "../../platform/board-media.js";
import {
  createWxLocalDrawDraftRepository,
  summarizeLocalDrawDraft,
  type LocalDrawDraft,
  type LocalDrawDraftSummary,
} from "../../platform/local-draw-drafts.js";
import {
  readActiveDraftBoardId,
  readRecognitionStableView,
  writeActiveDraftBoardId,
  writeRecognitionStableView,
  type RecognitionStableView,
} from "../../platform/navigation-state.js";
import { getWxStorageDriver } from "../../platform/storage.js";
import type { IchiApp } from "../../app.js";

type HomeView = RecognitionStableView | "map-preview" | "my" | "local-records";
type MainTab = "recognize" | "map" | "my";

interface DraftViewModel extends LocalDrawDraftSummary {
  readonly swipeX: number;
}

interface ActiveDraftViewModel extends LocalDrawDraftSummary {
  readonly pendingCount: number;
}

const draftRepository = createWxLocalDrawDraftRepository();
const storage = getWxStorageDriver();
let touchStartX = 0;
let swipeStartX = 0;
let swipingBoardId = "";

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
  }));
};

const getTopSafePx = (): number => {
  const info = wx.getWindowInfo();
  return Math.max(40, info.statusBarHeight ?? 0, info.safeArea?.top ?? 0);
};

Page({
  data: {
    currentView: "start" as HomeView,
    activeTab: "recognize" as MainTab,
    topSafePx: 40,
    drafts: [] as DraftViewModel[],
    activeDraft: null as ActiveDraftViewModel | null,
    mediaBusy: false,
  },

  onLoad() {
    const stableView = readRecognitionStableView(storage);
    this.setData({
      currentView: stableView,
      activeTab: "recognize",
      topSafePx: getTopSafePx(),
    });
    this.refreshDrafts(readActiveDraftBoardId(storage) ?? undefined);
  },

  onShow() {
    this.refreshDrafts();
  },

  refreshDrafts(activeBoardIdOverride?: string) {
    const drafts = draftRepository.readAll();
    const currentDrafts = this.data.drafts as readonly DraftViewModel[];
    const activeBoardId =
      activeBoardIdOverride ??
      (this.data.activeDraft as ActiveDraftViewModel | null)?.boardId;
    const activeDraft = activeBoardId
      ? drafts.find((draft) => draft.boardId === activeBoardId)
      : undefined;
    const activeDraftWasRemoved = Boolean(activeBoardId && !activeDraft);
    if (activeDraftWasRemoved) {
      writeActiveDraftBoardId(storage, null);
      writeRecognitionStableView(storage, "start");
    }

    this.setData({
      drafts: toDraftViewModels(drafts, currentDrafts),
      activeDraft: activeDraft
        ? {
            ...summarizeLocalDrawDraft(activeDraft),
            pendingCount: 0,
          }
        : null,
      ...(this.data.currentView === "resume" && !activeDraft
        ? { currentView: "start" as const }
        : {}),
    });
  },

  async onImportBoard() {
    if (this.data.mediaBusy) return;
    this.setData({ mediaBusy: true });
    const result = await chooseBoardImage(getWxBoardMediaApi());
    this.setData({ mediaBusy: false });

    if (result.status === "selected") {
      getApp<IchiApp>().globalData.pendingBoardImage = result.file;
      wx.showToast({ title: "照片已接收", icon: "success" });
      return;
    }
    if (result.status === "cancelled") return;

    const denied = result.status === "denied";
    wx.showModal({
      title: denied ? "无法读取照片" : "照片导入失败",
      content: denied
        ? "请在微信设置中允许使用相机或相册，或返回后重新选择。"
        : "暂时无法读取这张照片，当前本机草稿不会受到影响。",
      showCancel: false,
      confirmText: "知道了",
    });
  },

  onSelectTab(event: WechatMiniprogram.BaseEvent) {
    const tab = event.currentTarget.dataset.tab as MainTab | undefined;
    if (!tab) return;

    if (tab === "recognize") {
      const view = readRecognitionStableView(storage);
      this.setData({ activeTab: tab, currentView: view });
      return;
    }
    if (tab === "map") {
      this.setData({ activeTab: tab, currentView: "map-preview" });
      return;
    }

    this.setData({ activeTab: tab, currentView: "my" });
  },

  onOpenDraft(event: WechatMiniprogram.BaseEvent) {
    const boardId = event.currentTarget.dataset.boardId as string | undefined;
    if (!boardId) return;
    const draft = draftRepository
      .readAll()
      .find((item) => item.boardId === boardId);
    if (!draft) {
      this.refreshDrafts();
      return;
    }

    writeRecognitionStableView(storage, "resume");
    writeActiveDraftBoardId(storage, boardId);
    this.setData({
      activeTab: "recognize",
      currentView: "resume",
      activeDraft: {
        ...summarizeLocalDrawDraft(draft),
        pendingCount: 0,
      },
      drafts: (this.data.drafts as DraftViewModel[]).map((item) => ({
        ...item,
        swipeX: 0,
      })),
    });
  },

  onBackToStart() {
    writeRecognitionStableView(storage, "start");
    writeActiveDraftBoardId(storage, null);
    this.setData({
      activeTab: "recognize",
      currentView: "start",
      activeDraft: null,
    });
  },

  onContinueDraft() {
    wx.showToast({ title: "草稿已恢复", icon: "success" });
  },

  onOpenLocalRecords() {
    this.setData({ activeTab: "my", currentView: "local-records" });
  },

  onBackToMy() {
    this.setData({ activeTab: "my", currentView: "my" });
  },

  onTouchStart(event: WechatMiniprogram.TouchEvent) {
    const boardId = event.currentTarget.dataset.boardId as string | undefined;
    const touch = event.touches[0];
    if (!boardId || !touch) return;
    swipingBoardId = boardId;
    touchStartX = touch.clientX;
    const draft = (this.data.drafts as DraftViewModel[]).find(
      (item) => item.boardId === boardId,
    );
    swipeStartX = draft?.swipeX ?? 0;
  },

  onTouchMove(event: WechatMiniprogram.TouchEvent) {
    const touch = event.touches[0];
    if (!touch || !swipingBoardId) return;
    const swipeX = Math.max(
      -72,
      Math.min(0, swipeStartX + touch.clientX - touchStartX),
    );
    this.setDraftSwipe(swipingBoardId, swipeX);
  },

  onTouchEnd(event: WechatMiniprogram.TouchEvent) {
    const boardId = event.currentTarget.dataset.boardId as string | undefined;
    if (!boardId || boardId !== swipingBoardId) return;
    const draft = (this.data.drafts as DraftViewModel[]).find(
      (item) => item.boardId === boardId,
    );
    this.setDraftSwipe(boardId, (draft?.swipeX ?? 0) <= -36 ? -72 : 0);
    swipingBoardId = "";
  },

  setDraftSwipe(boardId: string, swipeX: number) {
    this.setData({
      drafts: (this.data.drafts as DraftViewModel[]).map((draft) => ({
        ...draft,
        swipeX: draft.boardId === boardId ? swipeX : 0,
      })),
    });
  },

  onDeleteDraft(event: WechatMiniprogram.BaseEvent) {
    const boardId = event.currentTarget.dataset.boardId as string | undefined;
    if (!boardId) return;
    draftRepository.deleteIfMutable(boardId);
    this.refreshDrafts();
    wx.showToast({ title: "草稿已删除", icon: "none" });
  },
});
