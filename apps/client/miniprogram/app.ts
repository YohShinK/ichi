import type { BoardMediaFile } from "./platform/board-media.js";

export interface IchiAppGlobalData {
  pendingBoardImage?: BoardMediaFile;
}

export interface IchiApp {
  globalData: IchiAppGlobalData;
}

App<IchiApp>({
  globalData: {},
});
