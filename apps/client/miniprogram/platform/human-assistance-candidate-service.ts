import {
  getWxCandidateEnvVersion,
  type CandidateCloudApi,
} from "./public-map-candidate-service.js";
import type {
  HumanAssistanceAnswer,
  HumanAssistanceRequestView,
  HumanAssistanceService,
} from "./human-assistance-client.js";

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const label = (value: unknown): string =>
  typeof value === "string" ? value.trim().slice(0, 48) : "";

export class CandidateHumanAssistanceService implements HumanAssistanceService {
  constructor(
    private readonly api: CandidateCloudApi | null,
    private readonly version: "develop" | "trial" | "release" | "unknown",
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

  async listMyRequests(): Promise<readonly HumanAssistanceRequestView[]> {
    const response = await this.call("v2-shadow-get-my-assistance", {});
    if (
      !record(response) ||
      response.ok !== true ||
      !Array.isArray(response.data)
    )
      return [];
    return response.data.flatMap((item: unknown) => {
      if (
        !record(item) ||
        typeof item.requestId !== "string" ||
        typeof item.candidateRecordRef !== "string" ||
        !/^candidate:[a-f0-9]{40}$/u.test(item.candidateRecordRef) ||
        typeof item.observationVersion !== "string" ||
        item.observationVersion.length === 0 ||
        item.observationVersion.length > 128 ||
        typeof item.expiresAt !== "string" ||
        !record(item.currentCard) ||
        !record(item.comparisonCard)
      )
        return [];
      const current = label(item.currentCard.ipName);
      const comparison = label(item.comparisonCard.ipName);
      const expiresAt = Date.parse(item.expiresAt);
      if (!current || !comparison || !Number.isFinite(expiresAt)) return [];
      return [
        {
          requestId: item.requestId,
          recordId: item.candidateRecordRef,
          submissionVersion: item.observationVersion,
          expiresAt,
          state: "PENDING" as const,
          currentBoardLabel: current,
          candidateBoardLabel: comparison,
          lineage: "SHADOW_CANDIDATE" as const,
        },
      ];
    });
  }

  async answer(input: {
    readonly requestId: string;
    readonly submissionVersion: number | string;
    readonly actionId: string;
    readonly answer: HumanAssistanceAnswer;
  }): Promise<{ readonly ok: boolean }> {
    const response = await this.call("v2-shadow-answer-assistance", input);
    return { ok: record(response) && response.ok === true };
  }
}

export const createWxCandidateHumanAssistanceService =
  (): CandidateHumanAssistanceService => {
    const api = (wx as unknown as { cloud?: CandidateCloudApi }).cloud;
    return new CandidateHumanAssistanceService(
      api?.callFunction ? api : null,
      getWxCandidateEnvVersion(),
    );
  };
