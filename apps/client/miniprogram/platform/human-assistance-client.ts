export type HumanAssistanceAnswer =
  "SAME_BOARD" | "DIFFERENT_BOARD" | "CANNOT_TELL" | "SKIP";

export interface HumanAssistanceRequestView {
  readonly requestId: string;
  readonly recordId: string;
  readonly submissionVersion: number | string;
  readonly expiresAt: number;
  readonly state: "PENDING" | "ANSWERED" | "WITHDRAWN" | "EXPIRED";
  readonly currentBoardLabel: string;
  readonly candidateBoardLabel: string;
  readonly lineage?: "SHADOW_CANDIDATE";
}

export interface HumanAssistanceService {
  listMyRequests(): Promise<readonly HumanAssistanceRequestView[]>;
  answer(input: {
    readonly requestId: string;
    readonly submissionVersion: number | string;
    readonly actionId: string;
    readonly answer: HumanAssistanceAnswer;
    readonly candidateRecordRef?: string;
  }): Promise<{ readonly ok: boolean }>;
}

// Production V1 has no approved V2 candidate transport or test caller binding.
// Keep the two UI surfaces wired but empty until a separately approved adapter exists.
export const disabledHumanAssistanceService: HumanAssistanceService = {
  async listMyRequests() {
    return [];
  },
  async answer() {
    return { ok: false };
  },
};

const safeLabel = (value: string): string => value.trim().slice(0, 48);

export class HumanAssistanceClient {
  private requests: HumanAssistanceRequestView[] = [];
  private generation = 0;
  private readonly submitting = new Set<string>();

  constructor(
    private readonly service: HumanAssistanceService,
    private readonly now: () => number = Date.now,
  ) {}

  get visibleRequests(): readonly HumanAssistanceRequestView[] {
    this.prune();
    return this.requests;
  }

  private prune(recordVersions?: ReadonlyMap<string, number | string>): void {
    this.requests = this.requests.filter(
      (request) =>
        request.state === "PENDING" &&
        (request.lineage === "SHADOW_CANDIDATE"
          ? typeof request.submissionVersion === "string" &&
            request.submissionVersion.length > 0
          : typeof request.submissionVersion === "number" &&
            Number.isInteger(request.submissionVersion) &&
            request.submissionVersion > 0) &&
        Number.isFinite(request.expiresAt) &&
        request.expiresAt > this.now() &&
        (!recordVersions ||
          recordVersions.get(request.recordId) === request.submissionVersion),
    );
  }

  async refresh(
    recordVersions: ReadonlyMap<string, number | string>,
  ): Promise<readonly HumanAssistanceRequestView[]> {
    const generation = ++this.generation;
    try {
      const incoming = await this.service.listMyRequests();
      if (generation !== this.generation) return this.visibleRequests;
      const seen = new Set<string>();
      this.requests = incoming
        .filter(
          (request) =>
            !!request.requestId &&
            !!request.recordId &&
            !seen.has(request.requestId) &&
            (seen.add(request.requestId), true),
        )
        .map((request) => ({
          ...request,
          currentBoardLabel: safeLabel(request.currentBoardLabel),
          candidateBoardLabel: safeLabel(request.candidateBoardLabel),
        }));
      this.prune(recordVersions);
    } catch {
      if (generation === this.generation) this.requests = [];
    }
    return this.visibleRequests;
  }

  invalidateRecord(recordId: string): void {
    this.requests = this.requests.filter(
      (request) => request.recordId !== recordId,
    );
  }

  clear(): void {
    this.generation += 1;
    this.requests = [];
  }

  async answer(
    requestId: string,
    answer: HumanAssistanceAnswer,
  ): Promise<"ANSWERED" | "UNAVAILABLE" | "BUSY"> {
    this.prune();
    const request = this.requests.find((item) => item.requestId === requestId);
    if (!request) return "UNAVAILABLE";
    if (this.submitting.has(requestId)) return "BUSY";
    this.submitting.add(requestId);
    try {
      const result = await this.service.answer({
        requestId,
        submissionVersion: request.submissionVersion,
        actionId: `ha:${requestId}:${request.submissionVersion}:${answer}`,
        answer,
        ...(request.lineage === "SHADOW_CANDIDATE"
          ? { candidateRecordRef: request.recordId }
          : {}),
      });
      if (!result.ok) return "UNAVAILABLE";
      this.invalidateRecord(request.recordId);
      return "ANSWERED";
    } catch {
      return "UNAVAILABLE";
    } finally {
      this.submitting.delete(requestId);
    }
  }
}
