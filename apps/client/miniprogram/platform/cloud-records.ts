import { callCloudFunction, type CloudFunctionApi } from "./cloud-account.js";
import type { PendingDrawTicketEvidence } from "./draw-ticket-recognition.js";
import type { LocalDrawDraft } from "./local-draw-drafts.js";

export type CloudRecordStateLabel =
  | "待上传"
  | "待核对"
  | "核验失败"
  | "照片核验失败"
  | "备注未通过"
  | "核验异常"
  | "已上传"
  | "无法恢复";

export interface CloudRecordSummary {
  readonly recordId: string;
  readonly recordCode: string;
  readonly boardId: string;
  readonly sourcePath: "assisted-draw" | "direct-upload";
  readonly title: string;
  readonly identityMeta: string;
  readonly statsMeta: string;
  readonly recordStateLabel: CloudRecordStateLabel;
  readonly canResume: boolean;
  readonly canDelete: true;
  readonly uploadedAt?: string;
  readonly locationNote?: string;
  readonly location?: unknown;
  readonly verificationAction?: "retry" | "reupload" | "edit-note";
  readonly submissionVersion?: number;
  readonly userNote?: string;
  readonly verificationPending?: PendingDrawTicketEvidence;
  readonly recoveryDraft?: LocalDrawDraft;
}

interface CloudSnapshot {
  readonly schemaVersion?: unknown;
  readonly recognitionVersion?: unknown;
  readonly ip?: unknown;
  readonly ipName?: unknown;
  readonly theme?: unknown;
  readonly themeName?: unknown;
  readonly totalTickets?: unknown;
  readonly remainingTickets?: unknown;
  readonly pricePerDraw?: unknown;
  readonly tiers?: unknown;
}

interface CloudRecordTransport {
  readonly recordId?: unknown;
  readonly recordCode?: unknown;
  readonly boardId?: unknown;
  readonly sourcePath?: unknown;
  readonly status?: unknown;
  readonly observedAt?: unknown;
  readonly updatedAt?: unknown;
  readonly initialSnapshot?: CloudSnapshot;
  readonly finalSnapshot?: CloudSnapshot | null;
  readonly recognitionJobId?: unknown;
  readonly authoritativeDrawEvents?: unknown;
  readonly prizeTicketVerificationStatus?: unknown;
  readonly location?: unknown;
  readonly locationNote?: unknown;
  readonly latestPrizeTicketSubmission?: {
    readonly submissionVersion?: unknown;
    readonly status?: unknown;
    readonly submittedAt?: unknown;
    readonly uploadedAt?: unknown;
    readonly captureSource?: unknown;
    readonly originalEvidenceCapturedAt?: unknown;
    readonly originalEvidenceFileId?: unknown;
    readonly currentEvidenceFileId?: unknown;
    readonly locationNote?: unknown;
    readonly userNote?: unknown;
    readonly finalSnapshot?: CloudSnapshot | null;
    readonly result?: { readonly status?: unknown } | null;
  } | null;
}

interface CloudRecordsEnvelope {
  readonly records?: unknown;
  readonly hasMore?: unknown;
}

const formatTime = (value: unknown): string => {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.valueOf())) return "时间未知";
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${date.getMonth() + 1}/${date.getDate()} ${String(
    date.getHours(),
  ).padStart(2, "0")}:${minute}`;
};

const parseRecord = (value: unknown): CloudRecordSummary | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as CloudRecordTransport;
  if (
    typeof record.recordId !== "string" ||
    typeof record.recordCode !== "string" ||
    !/^[A-Z0-9]{6}$/u.test(record.recordCode) ||
    typeof record.boardId !== "string" ||
    (record.sourcePath !== "assisted-draw" &&
      record.sourcePath !== "direct-upload") ||
    record.status === "deleting"
  ) {
    return null;
  }
  const latestSubmission = record.latestPrizeTicketSubmission;
  const snapshot =
    latestSubmission?.finalSnapshot ??
    record.finalSnapshot ??
    record.initialSnapshot;
  const initialSnapshot = record.initialSnapshot ?? snapshot;
  const isR2 = snapshot?.schemaVersion === "board-record-r2-1.0.0";
  const ipName = isR2 ? snapshot?.ipName : snapshot?.ip;
  const themeName = isR2 ? snapshot?.themeName : snapshot?.theme;
  if (isR2) {
    if (
      snapshot?.recognitionVersion !== "R2" ||
      typeof ipName !== "string" ||
      !Array.isArray(snapshot?.tiers)
    ) {
      return null;
    }
  }
  const total = Number(snapshot?.totalTickets);
  const r2Remaining = Array.isArray(snapshot?.tiers)
    ? snapshot.tiers.reduce((sum, value) => {
        if (!value || typeof value !== "object") return Number.NaN;
        const count = Number(
          (value as { remainingTickets?: unknown }).remainingTickets,
        );
        return Number.isSafeInteger(count) && count >= 0
          ? sum + count
          : Number.NaN;
      }, 0)
    : Number.NaN;
  const remaining = isR2 ? r2Remaining : Number(snapshot?.remainingTickets);
  if (
    typeof ipName !== "string" ||
    (!isR2 && !Number.isSafeInteger(total)) ||
    (!isR2 && total < 1) ||
    !Number.isSafeInteger(remaining) ||
    remaining < 0 ||
    (!isR2 && remaining > total)
  ) {
    return null;
  }
  const directUpload = record.sourcePath === "direct-upload";
  const recoveryTiers = Array.isArray(initialSnapshot?.tiers)
    ? initialSnapshot.tiers.map((value, index) => {
        if (!value || typeof value !== "object") return null;
        const tier = value as {
          tierId?: unknown;
          tierCode?: unknown;
          rawLabel?: unknown;
          total?: unknown;
          remaining?: unknown;
          remainingTickets?: unknown;
          isGrandPrize?: unknown;
        };
        if (isR2) {
          if (
            typeof tier.tierCode !== "string" ||
            typeof tier.rawLabel !== "string" ||
            !Number.isSafeInteger(tier.remainingTickets) ||
            Number(tier.remainingTickets) < 0 ||
            typeof tier.isGrandPrize !== "boolean"
          ) {
            return null;
          }
          return {
            id: `${record.boardId}-${tier.tierCode}-${index}`,
            tier: tier.tierCode,
            rawLabel: tier.rawLabel,
            initialRemainingTickets: Number(tier.remainingTickets),
            isGrandPrize: tier.isGrandPrize,
          };
        }
        if (
          typeof tier.tierId !== "string" ||
          !Number.isSafeInteger(tier.total) ||
          Number(tier.total) <= 0 ||
          !Number.isSafeInteger(tier.remaining) ||
          Number(tier.remaining) < 0 ||
          Number(tier.remaining) > Number(tier.total)
        ) {
          return null;
        }
        return {
          id: `${record.boardId}-${tier.tierId}-${index}`,
          tier: tier.tierId,
          total: Number(tier.total),
          remaining: Number(tier.remaining),
        };
      })
    : [];
  const canResume =
    !directUpload &&
    recoveryTiers.length > 0 &&
    recoveryTiers.every((tier) => tier !== null) &&
    Number.isSafeInteger(snapshot?.pricePerDraw) &&
    Number(snapshot?.pricePerDraw) > 0;
  const savedAt = new Date(
    String(record.updatedAt ?? record.observedAt),
  ).valueOf();
  const cloudHistory = Array.isArray(record.authoritativeDrawEvents)
    ? record.authoritativeDrawEvents
        .map((value, index) => {
          if (!value || typeof value !== "object") return null;
          const event = value as {
            eventId?: unknown;
            tierCode?: unknown;
            occurredAt?: unknown;
          };
          return typeof event.eventId === "string" &&
            typeof event.tierCode === "string"
            ? {
                id: event.eventId || `${record.boardId}:cloud:${index}`,
                tier: event.tierCode,
                ...(Number.isFinite(event.occurredAt)
                  ? { occurredAt: Number(event.occurredAt) }
                  : {}),
              }
            : null;
        })
        .filter((value): value is NonNullable<typeof value> => value !== null)
    : [];
  const recoveryDraft: LocalDrawDraft | undefined = canResume
    ? {
        schemaVersion: isR2 ? "board-record-r2-1.0.0" : 1,
        boardId: record.boardId,
        savedAt: Number.isFinite(savedAt) ? savedAt : Date.now(),
        recordType: "draw",
        recordCode: record.recordCode,
        cloudRecordId: record.recordId,
        ...(typeof record.recognitionJobId === "string"
          ? { recognitionJobId: record.recognitionJobId }
          : {}),
        prizeData: recoveryTiers as NonNullable<LocalDrawDraft["prizeData"]>,
        history: cloudHistory,
        cost: 0,
        verificationStatus: "unverified",
        uploadStatus: "not-uploaded",
        submissionState: "local",
        unitPrice: Number(snapshot?.pricePerDraw),
        ipName: ipName.trim(),
        ...(typeof themeName === "string" && themeName.trim()
          ? { themeName: themeName.trim() }
          : {}),
      }
    : undefined;
  const verificationStatus = String(
    latestSubmission?.result?.status ||
      latestSubmission?.status ||
      record.prizeTicketVerificationStatus ||
      "",
  );
  const state: CloudRecordStateLabel =
    verificationStatus === "APPROVED" || verificationStatus === "VERIFIED"
      ? "已上传"
      : verificationStatus === "PHOTO_FAILED"
        ? "照片核验失败"
        : verificationStatus === "NOTE_FAILED"
          ? "备注未通过"
          : verificationStatus === "LOCATION_FAILED" ||
              verificationStatus === "MISMATCH" ||
              verificationStatus === "INVALID_EVIDENCE"
            ? "核验失败"
            : verificationStatus === "NEEDS_REVIEW" ||
                verificationStatus === "PROVIDER_FAILED"
              ? "核验异常"
              : verificationStatus === "PENDING" ||
                  verificationStatus === "LOCATION_PENDING" ||
                  verificationStatus === "PHOTO_PENDING" ||
                  verificationStatus === "NOTE_PENDING" ||
                  verificationStatus === "PROCESSING"
                ? "待核对"
                : record.status === "uploaded"
                  ? "已上传"
                  : record.status === "review_pending" ||
                      record.status === "clue_submitted" ||
                      record.status === "needs_user_confirmation"
                    ? "待核对"
                    : directUpload || canResume
                      ? "待上传"
                      : "无法恢复";
  const ipLabel = [ipName, themeName]
    .filter(
      (part): part is string =>
        typeof part === "string" && Boolean(part.trim()),
    )
    .join(" / ");
  const uploadedAt =
    typeof latestSubmission?.uploadedAt === "string"
      ? latestSubmission.uploadedAt
      : typeof latestSubmission?.submittedAt === "string"
        ? latestSubmission.submittedAt
        : undefined;
  const locationNote =
    typeof latestSubmission?.locationNote === "string"
      ? latestSubmission.locationNote
      : typeof record.locationNote === "string"
        ? record.locationNote
        : undefined;
  const userNote =
    typeof latestSubmission?.userNote === "string"
      ? latestSubmission.userNote
      : locationNote;
  const submissionVersion = Number(latestSubmission?.submissionVersion);
  const currentEvidenceFileId = latestSubmission?.currentEvidenceFileId;
  const captureSource = latestSubmission?.captureSource;
  const capturedAt = Number(latestSubmission?.originalEvidenceCapturedAt);
  const canRetryOrReplace =
    Number.isSafeInteger(submissionVersion) &&
    submissionVersion > 0 &&
    typeof currentEvidenceFileId === "string" &&
    (captureSource === "camera" || captureSource === "gallery");
  const verificationPending: PendingDrawTicketEvidence | undefined =
    canRetryOrReplace
      ? {
          recordId: record.recordId,
          boardId: record.boardId,
          submissionVersion,
          imageFileId: currentEvidenceFileId,
          captureSource,
          ...(Number.isFinite(capturedAt) ? { capturedAt } : {}),
          albumSaveWarning: false,
          image: { width: 1, height: 1, byteLength: 1 },
        }
      : undefined;
  const verificationAction =
    state === "核验异常" && verificationPending
      ? ("retry" as const)
      : verificationStatus === "PHOTO_FAILED"
        ? ("reupload" as const)
        : verificationStatus === "NOTE_FAILED"
          ? ("edit-note" as const)
          : undefined;
  return {
    recordId: record.recordId,
    recordCode: record.recordCode,
    boardId: record.boardId,
    sourcePath: record.sourcePath,
    title: `${directUpload ? "仅上传版面" : "抽赏记录"} · ${record.recordCode}`,
    identityMeta: `IP: ${ipLabel} · ${formatTime(uploadedAt ?? record.updatedAt ?? record.observedAt)}`,
    statsMeta: isR2 ? `剩余 ${remaining} 抽` : `余 ${remaining} / ${total}`,
    recordStateLabel: state,
    canResume,
    canDelete: true,
    ...(uploadedAt ? { uploadedAt } : {}),
    ...(locationNote ? { locationNote } : {}),
    ...(userNote ? { userNote } : {}),
    ...(Number.isSafeInteger(submissionVersion) && submissionVersion > 0
      ? { submissionVersion }
      : {}),
    ...(record.location !== undefined ? { location: record.location } : {}),
    ...(verificationAction ? { verificationAction } : {}),
    ...(verificationPending ? { verificationPending } : {}),
    ...(recoveryDraft ? { recoveryDraft } : {}),
  };
};

export const loadMyCloudRecords = async (
  api: CloudFunctionApi,
): Promise<{
  readonly records: readonly CloudRecordSummary[];
  readonly hasMore: boolean;
}> => {
  const data = await callCloudFunction<CloudRecordsEnvelope>(
    api,
    "get-my-records",
    { limit: 50 },
  );
  const records = Array.isArray(data.records)
    ? data.records
        .map(parseRecord)
        .filter((record): record is CloudRecordSummary => record !== null)
    : [];
  return { records, hasMore: data.hasMore === true };
};

export const requestCloudRecordDeletion = async (
  api: CloudFunctionApi,
  input: { readonly recordId: string; readonly boardId?: string },
): Promise<{
  readonly deletionId: string;
  readonly status: "pending" | "completed";
  readonly idempotent?: boolean;
}> => callCloudFunction(api, "delete-my-record", input);
