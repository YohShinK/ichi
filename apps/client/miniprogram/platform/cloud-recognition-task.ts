import type { RecognitionPrizeDraft } from "./recognition-flow.js";
import {
  callCloudFunction,
  parseCloudQuotaSummary,
  type CloudFunctionApi,
  type CloudQuotaSummary,
} from "./cloud-account.js";

export type CloudRecognitionSourcePath = "assisted-draw" | "direct-upload";

export interface ConfirmedBoardSnapshot {
  readonly schemaVersion: "board-record-r2-1.0.0";
  readonly recognitionVersion: "R2";
  readonly ipName: string;
  readonly themeName?: string;
  readonly pricePerDraw: number;
  readonly currency: "CNY";
  readonly tiers: readonly {
    readonly tierCode: string;
    readonly rawLabel: string;
    readonly remainingTickets: number;
    readonly isGrandPrize: boolean;
  }[];
}

export interface LegacyConfirmedBoardSnapshot {
  readonly schemaVersion: "board-snapshot-1.0.0";
  readonly ip: string;
  readonly theme?: string;
  readonly pricePerDraw: number;
  readonly currency: "CNY";
  readonly totalTickets: number;
  readonly remainingTickets: number;
  readonly attachedTickets: number;
  readonly tiers: readonly {
    readonly tierId: string;
    readonly sourceLabels: readonly string[];
    readonly total: number;
    readonly remaining: number;
    readonly attached: number;
  }[];
  readonly issues: readonly unknown[];
}

export type InitialCloudBoardSnapshot =
  ConfirmedBoardSnapshot | LegacyConfirmedBoardSnapshot;

export const toConfirmedBoardSnapshot = (input: {
  readonly ip: string;
  readonly theme?: string;
  readonly unitPrice: number;
  readonly prizes: readonly RecognitionPrizeDraft[];
  readonly grandPrizeTiers: readonly string[];
}): ConfirmedBoardSnapshot => {
  if (
    !input.ip.trim() ||
    !Number.isSafeInteger(input.unitPrice) ||
    input.unitPrice <= 0
  ) {
    throw new Error("UNCONFIRMED_RECOGNITION_FIELD");
  }
  const tiers = input.prizes.map((prize) => {
    if (
      !/^(?:[A-Z]|SP(?:[1-9]|[12][0-9]|3[0-2]))$/u.test(prize.tier) ||
      prize.remainingTickets === null ||
      !Number.isSafeInteger(prize.remainingTickets) ||
      prize.remainingTickets < 0
    ) {
      throw new Error("UNCONFIRMED_RECOGNITION_FIELD");
    }
    return {
      tierCode: prize.tier,
      rawLabel: prize.rawLabel,
      remainingTickets: prize.remainingTickets,
      isGrandPrize: input.grandPrizeTiers.includes(prize.tier),
    };
  });
  return {
    schemaVersion: "board-record-r2-1.0.0",
    recognitionVersion: "R2",
    ipName: input.ip.trim(),
    ...(input.theme?.trim() ? { themeName: input.theme.trim() } : {}),
    pricePerDraw: input.unitPrice,
    currency: "CNY",
    tiers,
  };
};

export const reserveCloudRecognition = (
  api: CloudFunctionApi,
  input: {
    readonly idempotencyKey: string;
    readonly sourcePath: CloudRecognitionSourcePath;
  },
): Promise<{
  readonly jobId: string;
  readonly jobToken?: string;
  readonly status: string;
  readonly quota: CloudQuotaSummary;
}> =>
  callCloudFunction<{
    readonly jobId: string;
    readonly jobToken?: string;
    readonly status: string;
    readonly quota: unknown;
  }>(api, "reserve-recognition", input).then((result) => ({
    ...result,
    quota: parseCloudQuotaSummary(result.quota),
  }));

export const releaseCloudRecognition = (
  api: CloudFunctionApi,
  input: { readonly jobId: string; readonly jobToken: string },
): Promise<{
  readonly jobId: string;
  readonly status: string;
  readonly released: boolean;
  readonly quota: CloudQuotaSummary;
}> =>
  callCloudFunction<{
    readonly jobId: string;
    readonly status: string;
    readonly released: boolean;
    readonly quota: unknown;
  }>(api, "release-recognition", input).then((result) => ({
    ...result,
    quota: parseCloudQuotaSummary(result.quota),
  }));

export const getCloudRecognitionJob = (
  api: CloudFunctionApi,
  jobId: string,
): Promise<{
  readonly jobId: string;
  readonly status: string;
  readonly result: unknown;
  readonly errorCode: string | null;
}> => callCloudFunction(api, "get-recognition-job", { jobId });

export const finalizeCloudObservation = (
  api: CloudFunctionApi,
  input: {
    readonly recognitionJobId: string;
    readonly boardId?: string;
    readonly sourcePath: CloudRecognitionSourcePath;
    readonly confirmedSnapshot: ConfirmedBoardSnapshot;
    readonly location: {
      readonly latitude: number;
      readonly longitude: number;
      readonly accuracy: number;
      readonly source: "camera";
      readonly capturedAt: string;
      readonly consentVersion: string;
    };
    readonly locationNote?: string;
    readonly observedAt: string;
    readonly promptVersion: string;
    readonly consentVersion: string;
    readonly disclosureVersion: string;
  },
): Promise<{
  readonly recordId: string;
  readonly recordCode: string;
  readonly boardId: string;
  readonly status: string;
  readonly idempotent: boolean;
}> => callCloudFunction(api, "finalize-board-observation", input);

export const prepareCloudObservationForUpload = (
  api: CloudFunctionApi,
  input: {
    readonly currentRecordId?: string;
    readonly recognitionJobId?: string;
    readonly boardId: string;
    readonly confirmedSnapshot: InitialCloudBoardSnapshot;
    readonly location: {
      readonly latitude: number;
      readonly longitude: number;
      readonly accuracy: number;
      readonly source: "camera";
      readonly capturedAt: string;
      readonly consentVersion: string;
    };
    readonly observedAt: string;
    readonly promptVersion: string;
    readonly consentVersion: string;
    readonly disclosureVersion: string;
  },
): Promise<{
  readonly recordId: string;
  readonly recordCode: string;
  readonly boardId: string;
  readonly status: string;
  readonly idempotent: boolean;
  readonly created: boolean;
}> =>
  callCloudFunction(api, "finalize-board-observation", {
    action: "prepare-new-upload",
    sourcePath: "assisted-draw",
    ...input,
  });
