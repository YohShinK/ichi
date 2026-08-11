import type { MiniProgramStorageDriver } from "./storage.js";
import { getWxStorageDriver } from "./storage.js";

export const LOCAL_DRAW_DRAFTS_KEY = "ichi:v1-e-local-draw-drafts:v1";

export type VerificationStatus = "unverified" | "verified";
export type UploadStatus = "not-uploaded" | "uploaded";

export interface LocalPrizeState {
  readonly id: string;
  readonly tier: string;
  readonly total: number;
  readonly remaining: number;
}

export interface LocalDrawHistoryItem {
  readonly id: string;
  readonly tier: string;
}

export interface LocalDrawDraft {
  readonly schemaVersion: 1;
  readonly boardId: string;
  readonly savedAt: number;
  readonly prizeData: readonly LocalPrizeState[];
  readonly history: readonly LocalDrawHistoryItem[];
  readonly cost: number;
  readonly verificationStatus: VerificationStatus;
  readonly uploadStatus: UploadStatus;
}

export interface LocalDrawDraftSummary {
  readonly boardId: string;
  readonly title: string;
  readonly meta: string;
  readonly remaining: number;
  readonly total: number;
  readonly drawCount: number;
  readonly cost: number;
  readonly savedAtLabel: string;
  readonly canDelete: boolean;
  readonly verificationLabel: "未核对" | "已核对";
  readonly uploadLabel: "未上传" | "已上传";
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isNonNegativeFinite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const isPrize = (value: unknown): value is LocalPrizeState => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.tier === "string" &&
    Number.isInteger(value.total) &&
    isNonNegativeFinite(value.total) &&
    Number.isInteger(value.remaining) &&
    isNonNegativeFinite(value.remaining) &&
    value.remaining <= value.total
  );
};

const isHistoryItem = (value: unknown): value is LocalDrawHistoryItem =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.tier === "string";

export const isLocalDrawDraft = (value: unknown): value is LocalDrawDraft => {
  if (!isRecord(value)) return false;
  return (
    value.schemaVersion === 1 &&
    typeof value.boardId === "string" &&
    value.boardId.length > 0 &&
    isNonNegativeFinite(value.savedAt) &&
    Array.isArray(value.prizeData) &&
    value.prizeData.every(isPrize) &&
    Array.isArray(value.history) &&
    value.history.every(isHistoryItem) &&
    isNonNegativeFinite(value.cost) &&
    (value.verificationStatus === "unverified" ||
      value.verificationStatus === "verified") &&
    (value.uploadStatus === "not-uploaded" || value.uploadStatus === "uploaded")
  );
};

const decodeStoredDrafts = (stored: unknown): LocalDrawDraft[] => {
  try {
    const value = typeof stored === "string" ? JSON.parse(stored) : stored;
    return Array.isArray(value) ? value.filter(isLocalDrawDraft) : [];
  } catch {
    return [];
  }
};

export class LocalDrawDraftRepository {
  constructor(private readonly storage: MiniProgramStorageDriver) {}

  readAll(): LocalDrawDraft[] {
    return decodeStoredDrafts(this.storage.getItem(LOCAL_DRAW_DRAFTS_KEY)).sort(
      (left, right) => right.savedAt - left.savedAt,
    );
  }

  upsert(draft: LocalDrawDraft): LocalDrawDraft[] {
    const next = [
      draft,
      ...this.readAll().filter((item) => item.boardId !== draft.boardId),
    ];
    this.storage.setItem(LOCAL_DRAW_DRAFTS_KEY, JSON.stringify(next));
    return next;
  }

  deleteIfMutable(boardId: string): LocalDrawDraft[] {
    const current = this.readAll();
    const target = current.find((item) => item.boardId === boardId);
    if (
      !target ||
      target.verificationStatus !== "unverified" ||
      target.uploadStatus !== "not-uploaded"
    ) {
      return current;
    }

    const next = current.filter((item) => item.boardId !== boardId);
    this.storage.setItem(LOCAL_DRAW_DRAFTS_KEY, JSON.stringify(next));
    return next;
  }
}

export const createWxLocalDrawDraftRepository = (): LocalDrawDraftRepository =>
  new LocalDrawDraftRepository(getWxStorageDriver());

const padTwo = (value: number): string => String(value).padStart(2, "0");

export const formatDraftSavedAt = (savedAt: number): string => {
  const date = new Date(savedAt);
  if (Number.isNaN(date.valueOf())) return "时间未知";
  return `${date.getMonth() + 1}/${date.getDate()} ${padTwo(
    date.getHours(),
  )}:${padTwo(date.getMinutes())}`;
};

export const summarizeLocalDrawDraft = (
  draft: LocalDrawDraft,
): LocalDrawDraftSummary => {
  const remaining = draft.prizeData.reduce(
    (sum, prize) => sum + prize.remaining,
    0,
  );
  const total = draft.prizeData.reduce((sum, prize) => sum + prize.total, 0);
  const savedAtLabel = formatDraftSavedAt(draft.savedAt);

  return {
    boardId: draft.boardId,
    title: "未分享的抽赏记录",
    meta: `余 ${remaining} / ${total} · 已抽 ${draft.history.length} · 累计 ¥${draft.cost.toLocaleString()} · ${savedAtLabel}`,
    remaining,
    total,
    drawCount: draft.history.length,
    cost: draft.cost,
    savedAtLabel,
    canDelete:
      draft.verificationStatus === "unverified" &&
      draft.uploadStatus === "not-uploaded",
    verificationLabel:
      draft.verificationStatus === "verified" ? "已核对" : "未核对",
    uploadLabel: draft.uploadStatus === "uploaded" ? "已上传" : "未上传",
  };
};
