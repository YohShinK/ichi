import type { MiniProgramStorageDriver } from "./storage.js";
import { getWxStorageDriver } from "./storage.js";
import type {
  CloudRecognitionSourcePath,
  ConfirmedBoardSnapshot,
} from "./cloud-recognition-task.js";

export const LOCAL_DRAW_DRAFTS_KEY = "ichi:v1-e-local-draw-drafts:v1";

export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "mismatch"
  | "needs-review"
  | "invalid-evidence"
  | "provider-failed"
  | "location-failed"
  | "photo-failed"
  | "note-pending"
  | "note-failed";
export type UploadStatus = "not-uploaded" | "uploaded";
export type LocalRecordType = "draw" | "board-upload";
export type LocalSubmissionState = "local" | "pending-review" | "uploaded";

export const RECORD_CODE_PATTERN = /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{6}$/;

export interface LegacyLocalPrizeState {
  readonly id: string;
  readonly tier: string;
  readonly total: number;
  readonly remaining: number;
}

export interface R2LocalPrizeState {
  readonly id: string;
  readonly tier: string;
  readonly rawLabel: string;
  readonly initialRemainingTickets: number;
  readonly isGrandPrize: boolean;
}

export type LocalPrizeState = LegacyLocalPrizeState | R2LocalPrizeState;

export interface LocalDrawHistoryItem {
  readonly id: string;
  readonly tier: string;
  readonly occurredAt?: number;
}

export interface PendingTicketVerification {
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

export interface LocalDrawDraft {
  readonly schemaVersion: 1 | "board-record-r2-1.0.0";
  readonly boardId: string;
  readonly savedAt: number;
  readonly prizeData: readonly LocalPrizeState[];
  readonly history: readonly LocalDrawHistoryItem[];
  readonly cost: number;
  readonly verificationStatus: VerificationStatus;
  readonly uploadStatus: UploadStatus;
  readonly recordType?: LocalRecordType;
  readonly recordCode?: string;
  readonly cloudRecordId?: string;
  readonly capturedAt?: number;
  readonly submittedAt?: number;
  readonly targetTiers?: readonly string[];
  readonly unitPrice?: number;
  readonly ipName?: string;
  readonly themeName?: string;
  readonly submissionState?: LocalSubmissionState;
  readonly evidenceSubmissionVersion?: number;
  readonly currentVerificationVersion?: number;
  readonly originalEvidenceFileId?: string;
  readonly originalEvidenceCapturedAt?: number;
  readonly verificationPending?: PendingTicketVerification;
  readonly albumSaveWarning?: boolean;
  readonly locationNote?: string;
  readonly undoFloor?: number;
  readonly recognitionJobId?: string;
  readonly pendingFinalization?: {
    readonly recognitionJobId: string;
    readonly sourcePath: CloudRecognitionSourcePath;
    readonly confirmedSnapshot: ConfirmedBoardSnapshot;
    readonly locationNote?: string;
    readonly observedAt: string;
    readonly promptVersion: string;
    readonly consentVersion: string;
    readonly disclosureVersion: string;
    readonly location?: {
      readonly latitude: number;
      readonly longitude: number;
      readonly accuracy: number;
      readonly source: "camera";
      readonly capturedAt: string;
      readonly consentVersion: string;
    };
  };
}

export interface LocalDrawDraftSummary {
  readonly boardId: string;
  readonly cloudRecordId?: string;
  readonly title: string;
  readonly remaining: number;
  readonly total: number;
  readonly drawCount: number;
  readonly cost: number;
  readonly recordType: LocalRecordType;
  readonly recordCode: string;
  readonly ipLabel: string;
  readonly createdAtLabel: string;
  readonly identityMeta: string;
  readonly statsMeta: string;
  readonly canResume: boolean;
  readonly canDelete: boolean;
  readonly recordStateLabel:
    | "待上传"
    | "待核对"
    | "核验失败"
    | "照片核验失败"
    | "备注未通过"
    | "核验异常"
    | "已上传"
    | "无法恢复";
  readonly verificationAction?: "reupload" | "retry" | "edit-note";
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isNonNegativeFinite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const isPrize = (value: unknown): value is LocalPrizeState => {
  if (!isRecord(value)) return false;
  const base = typeof value.id === "string" && typeof value.tier === "string";
  if (!base) return false;
  if (
    Number.isInteger(value.total) &&
    isNonNegativeFinite(value.total) &&
    Number.isInteger(value.remaining) &&
    isNonNegativeFinite(value.remaining)
  ) {
    return value.total > 0 && value.remaining <= value.total;
  }
  return (
    typeof value.rawLabel === "string" &&
    Number.isSafeInteger(value.initialRemainingTickets) &&
    isNonNegativeFinite(value.initialRemainingTickets) &&
    typeof value.isGrandPrize === "boolean"
  );
};

export const isR2LocalPrizeState = (
  prize: LocalPrizeState,
): prize is R2LocalPrizeState => "initialRemainingTickets" in prize;

export const initialRemainingForPrize = (prize: LocalPrizeState): number =>
  isR2LocalPrizeState(prize) ? prize.initialRemainingTickets : prize.total;

export const currentRemainingForPrize = (
  draft: Pick<LocalDrawDraft, "history">,
  prize: LocalPrizeState,
): number => {
  if (!isR2LocalPrizeState(prize)) return prize.remaining;
  const drawn = draft.history.reduce(
    (count, event) => count + (event.tier === prize.tier ? 1 : 0),
    0,
  );
  return Math.max(0, prize.initialRemainingTickets - drawn);
};

const isHistoryItem = (value: unknown): value is LocalDrawHistoryItem =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.tier === "string" &&
  (value.occurredAt === undefined || isNonNegativeFinite(value.occurredAt));

const isPendingTicketVerification = (
  value: unknown,
): value is PendingTicketVerification =>
  isRecord(value) &&
  typeof value.recordId === "string" &&
  typeof value.boardId === "string" &&
  Number.isSafeInteger(value.submissionVersion) &&
  Number(value.submissionVersion) > 0 &&
  typeof value.imageFileId === "string" &&
  (value.captureSource === "camera" || value.captureSource === "gallery") &&
  (value.capturedAt === undefined || isNonNegativeFinite(value.capturedAt)) &&
  typeof value.albumSaveWarning === "boolean" &&
  isRecord(value.image) &&
  Number.isSafeInteger(value.image.width) &&
  Number(value.image.width) > 0 &&
  Number.isSafeInteger(value.image.height) &&
  Number(value.image.height) > 0 &&
  Number.isSafeInteger(value.image.byteLength) &&
  Number(value.image.byteLength) > 0;

export const isLocalDrawDraft = (value: unknown): value is LocalDrawDraft => {
  if (!isRecord(value)) return false;
  return (
    (value.schemaVersion === 1 ||
      value.schemaVersion === "board-record-r2-1.0.0") &&
    typeof value.boardId === "string" &&
    value.boardId.length > 0 &&
    isNonNegativeFinite(value.savedAt) &&
    Array.isArray(value.prizeData) &&
    value.prizeData.every(isPrize) &&
    Array.isArray(value.history) &&
    value.history.every(isHistoryItem) &&
    isNonNegativeFinite(value.cost) &&
    [
      "unverified",
      "pending",
      "verified",
      "mismatch",
      "needs-review",
      "invalid-evidence",
      "provider-failed",
      "location-failed",
      "photo-failed",
      "note-pending",
      "note-failed",
    ].includes(value.verificationStatus as string) &&
    (value.uploadStatus === "not-uploaded" ||
      value.uploadStatus === "uploaded") &&
    (value.recordType === undefined ||
      value.recordType === "draw" ||
      value.recordType === "board-upload") &&
    (value.recordCode === undefined ||
      (typeof value.recordCode === "string" &&
        RECORD_CODE_PATTERN.test(value.recordCode))) &&
    (value.cloudRecordId === undefined ||
      (typeof value.cloudRecordId === "string" &&
        /^record_[a-f0-9]{32}$/u.test(value.cloudRecordId))) &&
    (value.capturedAt === undefined || isNonNegativeFinite(value.capturedAt)) &&
    (value.submittedAt === undefined ||
      isNonNegativeFinite(value.submittedAt)) &&
    (value.targetTiers === undefined ||
      (Array.isArray(value.targetTiers) &&
        value.targetTiers.every((tier) => typeof tier === "string"))) &&
    (value.unitPrice === undefined || isNonNegativeFinite(value.unitPrice)) &&
    (value.ipName === undefined || typeof value.ipName === "string") &&
    (value.themeName === undefined || typeof value.themeName === "string") &&
    (value.submissionState === undefined ||
      value.submissionState === "local" ||
      value.submissionState === "pending-review" ||
      value.submissionState === "uploaded") &&
    (value.evidenceSubmissionVersion === undefined ||
      (Number.isSafeInteger(value.evidenceSubmissionVersion) &&
        isNonNegativeFinite(value.evidenceSubmissionVersion))) &&
    (value.currentVerificationVersion === undefined ||
      (Number.isSafeInteger(value.currentVerificationVersion) &&
        isNonNegativeFinite(value.currentVerificationVersion))) &&
    (value.originalEvidenceFileId === undefined ||
      typeof value.originalEvidenceFileId === "string") &&
    (value.originalEvidenceCapturedAt === undefined ||
      isNonNegativeFinite(value.originalEvidenceCapturedAt)) &&
    (value.verificationPending === undefined ||
      isPendingTicketVerification(value.verificationPending)) &&
    (value.albumSaveWarning === undefined ||
      typeof value.albumSaveWarning === "boolean") &&
    (value.locationNote === undefined ||
      typeof value.locationNote === "string") &&
    (value.undoFloor === undefined ||
      (Number.isInteger(value.undoFloor) &&
        isNonNegativeFinite(value.undoFloor))) &&
    (value.recognitionJobId === undefined ||
      (typeof value.recognitionJobId === "string" &&
        value.recognitionJobId.length > 0)) &&
    (value.pendingFinalization === undefined ||
      (isRecord(value.pendingFinalization) &&
        typeof value.pendingFinalization.recognitionJobId === "string" &&
        (value.pendingFinalization.sourcePath === "assisted-draw" ||
          value.pendingFinalization.sourcePath === "direct-upload") &&
        isRecord(value.pendingFinalization.confirmedSnapshot) &&
        typeof value.pendingFinalization.observedAt === "string" &&
        typeof value.pendingFinalization.promptVersion === "string" &&
        typeof value.pendingFinalization.consentVersion === "string" &&
        typeof value.pendingFinalization.disclosureVersion === "string" &&
        (value.pendingFinalization.location === undefined ||
          isRecord(value.pendingFinalization.location))))
  );
};

export const isResumableLocalDrawDraft = (draft: LocalDrawDraft): boolean =>
  (draft.recordType ?? "draw") === "draw" &&
  draft.prizeData.length > 0 &&
  draft.prizeData.every((prize) => {
    if (isR2LocalPrizeState(prize)) {
      const current = currentRemainingForPrize(draft, prize);
      return (
        Number.isSafeInteger(prize.initialRemainingTickets) &&
        prize.initialRemainingTickets >= 0 &&
        current >= 0 &&
        current <= prize.initialRemainingTickets
      );
    }
    return (
      Number.isSafeInteger(prize.total) &&
      prize.total > 0 &&
      Number.isSafeInteger(prize.remaining) &&
      prize.remaining >= 0 &&
      prize.remaining <= prize.total
    );
  });

const migrateLegacyDraft = (value: unknown): LocalDrawDraft | null => {
  if (isLocalDrawDraft(value)) return value;
  if (!isRecord(value)) return null;
  // Early V1-E builds wrote the same draft shape before schemaVersion was
  // introduced. Upgrade only that structurally valid shape; malformed or
  // genuinely unknown schemas remain visible to the incompatible-data guard.
  if (value.schemaVersion !== undefined && value.schemaVersion !== 0)
    return null;
  const candidate = { ...value, schemaVersion: 1 };
  return isLocalDrawDraft(candidate) ? candidate : null;
};

const parseStoredDraftArray = (stored: unknown): unknown[] | null => {
  try {
    const value = typeof stored === "string" ? JSON.parse(stored) : stored;
    return Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
};

const decodeStoredDrafts = (stored: unknown): LocalDrawDraft[] =>
  (parseStoredDraftArray(stored) ?? [])
    .map(migrateLegacyDraft)
    .filter((draft): draft is LocalDrawDraft => draft !== null);

const resolveSubmissionState = (
  draft: LocalDrawDraft,
): LocalSubmissionState => {
  if (draft.submissionState) return draft.submissionState;
  if ((draft.recordType ?? "draw") === "draw") {
    if (draft.evidenceSubmissionVersion && draft.evidenceSubmissionVersion > 0)
      return draft.verificationStatus === "verified"
        ? "uploaded"
        : "pending-review";
    return "local";
  }
  return draft.uploadStatus === "uploaded" ? "pending-review" : "local";
};

export type LocalDraftStorageStatus = "empty" | "ok" | "schema-incompatible";

export const inspectLocalDraftStorage = (
  stored: unknown,
): LocalDraftStorageStatus => {
  if (stored === null || stored === undefined || stored === "") return "empty";
  try {
    const value = parseStoredDraftArray(stored);
    if (!value) return "schema-incompatible";
    return value.every((draft) => migrateLegacyDraft(draft) !== null)
      ? "ok"
      : "schema-incompatible";
  } catch {
    return "schema-incompatible";
  }
};

export class LocalDrawDraftRepository {
  constructor(private readonly storage: MiniProgramStorageDriver) {}

  readAll(): LocalDrawDraft[] {
    const stored = this.storage.getItem(LOCAL_DRAW_DRAFTS_KEY);
    const decoded = decodeStoredDrafts(stored);
    const migrated = resolveRecordCodeCollisions(decoded);
    const source = parseStoredDraftArray(stored);
    if (
      inspectLocalDraftStorage(stored) === "ok" &&
      JSON.stringify(migrated) !== JSON.stringify(source)
    ) {
      try {
        this.storage.setItem(LOCAL_DRAW_DRAFTS_KEY, JSON.stringify(migrated));
      } catch {
        // Reading existing records must remain available when a best-effort
        // migration write is blocked by capacity or platform errors.
      }
    }
    return migrated.sort((left, right) => right.savedAt - left.savedAt);
  }

  upsert(draft: LocalDrawDraft): LocalDrawDraft[] {
    const existing = this.readAll().filter(
      (item) => item.boardId !== draft.boardId,
    );
    const [resolvedDraft] = resolveRecordCodeCollisions([
      ...existing,
      draft,
    ]).slice(-1);
    const next = [resolvedDraft ?? draft, ...existing];
    this.storage.setItem(LOCAL_DRAW_DRAFTS_KEY, JSON.stringify(next));
    return next;
  }

  deleteIfMutable(boardId: string): LocalDrawDraft[] {
    const current = this.readAll();
    const target = current.find((item) => item.boardId === boardId);
    if (!target || resolveSubmissionState(target) !== "local") {
      return current;
    }

    const next = current.filter((item) => item.boardId !== boardId);
    this.storage.setItem(LOCAL_DRAW_DRAFTS_KEY, JSON.stringify(next));
    return next;
  }

  delete(boardId: string): LocalDrawDraft[] {
    const current = this.readAll();
    const next = current.filter((item) => item.boardId !== boardId);
    if (next.length !== current.length) {
      this.storage.setItem(LOCAL_DRAW_DRAFTS_KEY, JSON.stringify(next));
    }
    return next;
  }
}

export const createWxLocalDrawDraftRepository = (): LocalDrawDraftRepository =>
  new LocalDrawDraftRepository(getWxStorageDriver());

const padTwo = (value: number): string => String(value).padStart(2, "0");

export const deriveRecordCode = (seed: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  const base36 = hash.toString(36).toUpperCase().padStart(6, "0").slice(-6);
  const requiredLetter = String.fromCharCode(65 + (hash % 26));
  const requiredDigit = String(Math.floor(hash / 26) % 10);
  return `${requiredLetter}${requiredDigit}${base36.slice(2)}`;
};

export const createRecordCode = (seed = `${Date.now()}-${Math.random()}`) =>
  deriveRecordCode(seed);

export const resolveRecordCodeCollisions = (
  drafts: readonly LocalDrawDraft[],
): LocalDrawDraft[] => {
  const used = new Set<string>();
  return drafts.map((draft) => {
    let recordCode = draft.recordCode ?? deriveRecordCode(draft.boardId);
    let attempt = 0;
    while (used.has(recordCode)) {
      attempt += 1;
      recordCode = deriveRecordCode(`${draft.boardId}:collision:${attempt}`);
    }
    used.add(recordCode);
    return recordCode === draft.recordCode ? draft : { ...draft, recordCode };
  });
};

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
    (sum, prize) => sum + currentRemainingForPrize(draft, prize),
    0,
  );
  const total = draft.prizeData.reduce(
    (sum, prize) => sum + initialRemainingForPrize(prize),
    0,
  );
  const recordType = draft.recordType ?? "draw";
  const recordCode = draft.recordCode ?? deriveRecordCode(draft.boardId);
  const ipLabel =
    [draft.ipName?.trim(), draft.themeName?.trim()]
      .filter(Boolean)
      .join(" / ") || "未填写";
  const recordTime =
    recordType === "board-upload"
      ? (draft.submittedAt ?? draft.savedAt)
      : draft.savedAt;
  const createdAtLabel = formatDraftSavedAt(recordTime);
  const statsMeta =
    draft.schemaVersion === "board-record-r2-1.0.0"
      ? recordType === "board-upload"
        ? `剩余 ${remaining} 抽`
        : `剩余 ${remaining} 抽 · 已抽 ${draft.history.length}`
      : recordType === "board-upload"
        ? `余 ${remaining} / ${total}`
        : `余 ${remaining} / ${total} · 已抽 ${draft.history.length}`;
  const submissionState = resolveSubmissionState(draft);
  const canResume = isResumableLocalDrawDraft(draft);
  const recordStateLabel = (() => {
    if (recordType === "draw" && !canResume) return "无法恢复" as const;
    if (recordType === "draw" && draft.verificationStatus === "verified")
      return "已上传" as const;
    if (recordType === "draw" && draft.verificationStatus === "photo-failed")
      return "照片核验失败" as const;
    if (recordType === "draw" && draft.verificationStatus === "note-failed")
      return "备注未通过" as const;
    if (
      recordType === "draw" &&
      (draft.verificationStatus === "mismatch" ||
        draft.verificationStatus === "invalid-evidence" ||
        draft.verificationStatus === "location-failed")
    )
      return "核验失败" as const;
    if (
      recordType === "draw" &&
      (draft.verificationStatus === "needs-review" ||
        draft.verificationStatus === "provider-failed" ||
        draft.verificationStatus === "note-pending")
    )
      return "核验异常" as const;
    if (submissionState === "uploaded") return "已上传" as const;
    if (submissionState === "pending-review") return "待核对" as const;
    return "待上传" as const;
  })();

  return {
    boardId: draft.boardId,
    ...(draft.cloudRecordId ? { cloudRecordId: draft.cloudRecordId } : {}),
    title: `${recordType === "board-upload" ? "仅上传版面" : "抽赏记录"} · ${recordCode}`,
    remaining,
    total,
    drawCount: draft.history.length,
    cost: draft.cost,
    recordType,
    recordCode,
    ipLabel,
    createdAtLabel,
    identityMeta: `IP: ${ipLabel} · ${createdAtLabel}`,
    statsMeta,
    canResume,
    canDelete: submissionState === "local",
    recordStateLabel,
    ...(recordType === "draw" &&
    (draft.verificationStatus === "photo-failed" ||
      draft.verificationStatus === "mismatch" ||
      draft.verificationStatus === "invalid-evidence")
      ? { verificationAction: "reupload" as const }
      : recordType === "draw" && draft.verificationStatus === "note-failed"
        ? { verificationAction: "edit-note" as const }
        : recordType === "draw" &&
            (draft.verificationStatus === "needs-review" ||
              draft.verificationStatus === "provider-failed")
          ? { verificationAction: "retry" as const }
          : {}),
  };
};
