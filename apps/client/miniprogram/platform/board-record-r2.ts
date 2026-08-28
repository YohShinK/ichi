import type { ConfirmedBoardSnapshot } from "./cloud-recognition-task.js";

export const BOARD_RECORD_R2_SCHEMA_VERSION = "board-record-r2-1.0.0" as const;

export interface R2BoardLocation {
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracy: number;
  readonly coordinateSystem?: "gcj02";
}

export interface R2BoardRecordTransport {
  readonly schemaVersion: typeof BOARD_RECORD_R2_SCHEMA_VERSION;
  readonly recognitionVersion: "R2";
  readonly boardId: string;
  readonly recordId: string;
  readonly ownerAccountId: string;
  readonly location: R2BoardLocation;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly verificationStatus: "APPROVED" | string;
  readonly userNote: string;
  readonly initialSnapshot: ConfirmedBoardSnapshot;
  readonly finalSnapshot?: ConfirmedBoardSnapshot | null;
}

export interface R2MapBoardProjection {
  readonly boardId: string;
  readonly recordId: string;
  readonly ownerAccountId: string;
  readonly location: R2BoardLocation;
  readonly ipName: string;
  readonly themeName: string | null;
  readonly pricePerDraw: number;
  readonly tiers: ConfirmedBoardSnapshot["tiers"];
  readonly createdAt: string;
  readonly userNote: string;
}

export const toR2MapBoardProjection = (
  record: R2BoardRecordTransport,
): R2MapBoardProjection => {
  const snapshot = record.finalSnapshot ?? record.initialSnapshot;
  if (
    record.schemaVersion !== BOARD_RECORD_R2_SCHEMA_VERSION ||
    record.recognitionVersion !== "R2" ||
    record.verificationStatus !== "APPROVED" ||
    !record.userNote.trim() ||
    snapshot.schemaVersion !== BOARD_RECORD_R2_SCHEMA_VERSION ||
    !Number.isFinite(record.location.latitude) ||
    !Number.isFinite(record.location.longitude)
  ) {
    throw new Error("BOARD_RECORD_R2_INVALID");
  }
  return {
    boardId: record.boardId,
    recordId: record.recordId,
    ownerAccountId: record.ownerAccountId,
    location: record.location,
    ipName: snapshot.ipName,
    themeName: snapshot.themeName ?? null,
    pricePerDraw: snapshot.pricePerDraw,
    tiers: snapshot.tiers,
    createdAt: record.createdAt,
    userNote: record.userNote,
  };
};

export interface R2PublicAuthorProjection {
  readonly nickname: string;
  readonly avatarUrl: string | null;
}

export const toR2PublicAuthorProjection = (profile: {
  readonly nickname: string;
  readonly avatarUrl?: string | null;
}): R2PublicAuthorProjection => ({
  nickname: profile.nickname.trim(),
  avatarUrl: profile.avatarUrl ?? null,
});
