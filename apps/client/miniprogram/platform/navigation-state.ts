import type { MiniProgramStorageDriver } from "./storage.js";

export const RECOGNITION_VIEW_KEY = "ichi:v1-e-recognition-view:v1";
export const ACTIVE_DRAFT_BOARD_KEY = "ichi:v1-e-active-draft-board:v1";

export type RecognitionStableView = "start" | "resume";

export const readRecognitionStableView = (
  storage: MiniProgramStorageDriver,
): RecognitionStableView =>
  storage.getItem(RECOGNITION_VIEW_KEY) === "resume" ? "resume" : "start";

export const writeRecognitionStableView = (
  storage: MiniProgramStorageDriver,
  view: RecognitionStableView,
): void => storage.setItem(RECOGNITION_VIEW_KEY, view);

export const readActiveDraftBoardId = (
  storage: MiniProgramStorageDriver,
): string | null => {
  const value = storage.getItem(ACTIVE_DRAFT_BOARD_KEY);
  return typeof value === "string" && value.length > 0 ? value : null;
};

export const writeActiveDraftBoardId = (
  storage: MiniProgramStorageDriver,
  boardId: string | null,
): void => {
  if (boardId) {
    storage.setItem(ACTIVE_DRAFT_BOARD_KEY, boardId);
    return;
  }
  storage.removeItem(ACTIVE_DRAFT_BOARD_KEY);
};
