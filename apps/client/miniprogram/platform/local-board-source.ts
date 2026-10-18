// Installation-local identity: deliberately independent of app/package versions.
export const SYSTEM_DEMO_TUTORIAL_ID = "ichi-system-tutorial";
export const SYSTEM_DEMO_BOARD_ID = "local:ichi-system-tutorial";
export const SYSTEM_DEMO_ISSUANCE_KEY = "ichi:system-tutorial-issuance:v1";

export interface LocalBoardSource {
  readonly boardId: string;
  readonly source?: "RECOGNIZED" | "SYSTEM_DEMO";
  readonly tutorialId?: string;
}

export const isSystemDemoDraft = (draft: LocalBoardSource): boolean =>
  draft.source === "SYSTEM_DEMO" ||
  draft.tutorialId === SYSTEM_DEMO_TUTORIAL_ID ||
  draft.boardId === SYSTEM_DEMO_BOARD_ID;

export const assertUploadableBoardId = (boardId: string): void => {
  if (boardId === SYSTEM_DEMO_BOARD_ID)
    throw new Error("SYSTEM_DEMO_LOCAL_ONLY");
};

export const assertUploadableLocalDraft = (draft: LocalBoardSource): void => {
  if (isSystemDemoDraft(draft)) throw new Error("SYSTEM_DEMO_LOCAL_ONLY");
};
