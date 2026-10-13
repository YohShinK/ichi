import {
  getWxCandidateEnvVersion,
  type CandidateCloudApi,
  type CandidateEnvVersion,
} from "./public-map-candidate-service.js";

export interface CandidateUploadView {
  readonly candidateRecordRef: string;
  readonly observationVersion: string;
  readonly validationState: string;
  readonly shareDecision: "SHARE" | "DO_NOT_SHARE";
  readonly lifecycle: "ACTIVE" | "DELETED";
  readonly boardInstanceId: string | null;
}

export interface MapContributionConsentView {
  readonly termsVersion: string;
  readonly scopeDigest: string;
  readonly accepted: boolean;
  readonly acceptedAt: string | null;
  readonly status: "NOT_ACCEPTED" | "ACCEPTED";
}

const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export class CandidateUploadService {
  constructor(
    private readonly api: CandidateCloudApi | null,
    private readonly version: CandidateEnvVersion,
  ) {}

  private async call(
    name: string,
    data: Record<string, unknown>,
  ): Promise<unknown> {
    if (!this.api || (this.version !== "develop" && this.version !== "trial"))
      return null;
    try {
      return (await this.api.callFunction({ name, data })).result ?? null;
    } catch {
      return null;
    }
  }

  async submitSynthetic(input: {
    readonly fixtureId: string;
    readonly shareDecision: "SHARE" | "DO_NOT_SHARE";
    readonly idempotencyKey: string;
  }): Promise<{
    readonly candidateRecordRef: string;
    readonly observationVersion: string;
  } | null> {
    const result = await this.call("v2-shadow-submit-candidate-upload", input);
    if (
      !object(result) ||
      result.ok !== true ||
      typeof result.candidateRecordRef !== "string" ||
      !/^candidate:[a-f0-9]{40}$/u.test(result.candidateRecordRef) ||
      typeof result.observationVersion !== "string" ||
      !result.observationVersion
    )
      return null;
    return {
      candidateRecordRef: result.candidateRecordRef,
      observationVersion: result.observationVersion,
    };
  }

  async listMyUploads(): Promise<readonly CandidateUploadView[]> {
    const result = await this.call("v2-shadow-manage-contribution", {
      operation: "LIST_MY_UPLOADS",
    });
    if (!object(result) || result.ok !== true || !Array.isArray(result.uploads))
      return [];
    return result.uploads.flatMap((item: unknown) => {
      if (
        !object(item) ||
        typeof item.candidateRecordRef !== "string" ||
        !/^candidate:[a-f0-9]{40}$/u.test(item.candidateRecordRef) ||
        typeof item.observationVersion !== "string" ||
        typeof item.validationState !== "string" ||
        (item.shareDecision !== "SHARE" &&
          item.shareDecision !== "DO_NOT_SHARE") ||
        (item.lifecycle !== "ACTIVE" && item.lifecycle !== "DELETED") ||
        (item.boardInstanceId !== null &&
          typeof item.boardInstanceId !== "string")
      )
        return [];
      if (item.shareDecision !== "SHARE" || item.lifecycle !== "ACTIVE")
        return [];
      return [item as unknown as CandidateUploadView];
    });
  }

  async getMapContributionConsent(): Promise<MapContributionConsentView | null> {
    const result = await this.call("v2-shadow-manage-contribution", {
      operation: "GET_MAP_CONTRIBUTION_CONSENT",
    });
    if (
      !object(result) ||
      result.ok !== true ||
      typeof result.termsVersion !== "string" ||
      !/^candidate-map-contribution-v[0-9]+$/u.test(result.termsVersion) ||
      typeof result.scopeDigest !== "string" ||
      !/^[a-f0-9]{64}$/u.test(result.scopeDigest) ||
      typeof result.accepted !== "boolean" ||
      (result.acceptedAt !== null && typeof result.acceptedAt !== "string") ||
      !["NOT_ACCEPTED", "ACCEPTED"].includes(String(result.status))
    )
      return null;
    return {
      termsVersion: result.termsVersion,
      scopeDigest: result.scopeDigest,
      accepted: result.accepted,
      acceptedAt: result.acceptedAt,
      status: result.status as MapContributionConsentView["status"],
    };
  }

  async acceptMapContributionTerms(
    current: MapContributionConsentView,
    commandId: string,
  ): Promise<boolean> {
    if (!/^[A-Za-z0-9:_-]{8,128}$/u.test(commandId)) return false;
    const result = await this.call("v2-shadow-manage-contribution", {
      operation: "ACCEPT_MAP_CONTRIBUTION_TERMS",
      termsVersion: current.termsVersion,
      scopeDigest: current.scopeDigest,
      commandId,
    });
    return object(result) && result.ok === true && result.accepted === true;
  }

  async deleteMyUpload(
    candidateRecordRef: string,
    commandId: string,
  ): Promise<boolean> {
    if (
      !/^candidate:[a-f0-9]{40}$/u.test(candidateRecordRef) ||
      !/^[A-Za-z0-9:_-]{8,128}$/u.test(commandId)
    )
      return false;
    const result = await this.call("v2-shadow-manage-contribution", {
      operation: "DELETE_MY_UPLOAD",
      candidateRecordRef,
      commandId,
    });
    return (
      object(result) && result.ok === true && result.lifecycle === "DELETED"
    );
  }
}

export const createWxCandidateUploadService = (): CandidateUploadService => {
  const api = (wx as unknown as { cloud?: CandidateCloudApi }).cloud;
  return new CandidateUploadService(
    api?.callFunction ? api : null,
    getWxCandidateEnvVersion(),
  );
};
