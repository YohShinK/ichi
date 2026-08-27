import type { BoardMediaFile } from "./platform/board-media.js";
import type {
  CloudAccountProfile,
  CloudQuotaSummary,
} from "./platform/cloud-account.js";

export interface PendingBoardLocation {
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracy: number;
  readonly coordinateSystem: "gcj02";
  readonly obtainedAt: number;
}

export interface IchiAppGlobalData {
  pendingBoardImage?: BoardMediaFile;
  pendingBoardAcquisition?: "camera";
  pendingBoardLocation?: PendingBoardLocation;
  accountProfile?: CloudAccountProfile;
  accountQuota?: CloudQuotaSummary;
  pendingRecognitionIdempotencyKey?: string;
  pendingRecognitionJobId?: string;
  pendingRecognitionJobToken?: string;
  pendingRecognitionMode?: "assist" | "direct-upload";
}

export interface IchiApp {
  globalData: IchiAppGlobalData;
}

const CLOUD_ENV_ID = "cloud1-d7gxqfwv783a1f131";

App<IchiApp>({
  globalData: {},
  onLaunch() {
    const cloud = (
      wx as unknown as {
        cloud?: {
          init(options: { env: string; traceUser: boolean }): void;
        };
      }
    ).cloud;
    cloud?.init({ env: CLOUD_ENV_ID, traceUser: true });
  },
});
