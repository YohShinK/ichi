export const SYNTHETIC_PUBLIC_MAP_REPORT_CLASSIFICATION =
  "NOT_PRODUCTION_EVIDENCE" as const;

export type PublicMapReportCategory =
  "STALE_OR_SOLD" | "WRONG_LOCATION" | "INAPPROPRIATE_NOTE" | "OTHER";

export interface PublicMapReportRequest {
  readonly publicLeadId: string;
  readonly category: PublicMapReportCategory;
  readonly reason: string;
  readonly actionId: string;
}

export type PublicMapReportResult =
  | { readonly ok: true; readonly duplicate: boolean }
  | {
      readonly ok: false;
      readonly code: "UNAUTHORIZED" | "SERVICE_UNAVAILABLE" | "INVALID_REQUEST";
    };

export interface PublicMapReportService {
  submit(request: PublicMapReportRequest): Promise<PublicMapReportResult>;
}

/** The approved browsing card has an inert report placeholder. */
export const unavailablePublicMapReportService: PublicMapReportService = {
  async submit() {
    return { ok: false, code: "SERVICE_UNAVAILABLE" };
  },
};

export type PublicMapReportPhase =
  "CLOSED" | "OPEN" | "SUBMITTING" | "SUCCEEDED" | "ERROR";

export interface PublicMapReportState {
  readonly phase: PublicMapReportPhase;
  readonly publicLeadId: string | null;
  readonly category: PublicMapReportCategory;
  readonly errorMessage: string;
}

export class SyntheticPublicMapReportService implements PublicMapReportService {
  readonly #processed = new Set<string>();
  #nextError: PublicMapReportResult | null = null;

  failNext(code: "UNAUTHORIZED" | "SERVICE_UNAVAILABLE" | "INVALID_REQUEST") {
    this.#nextError = { ok: false, code };
  }

  async submit(
    request: PublicMapReportRequest,
  ): Promise<PublicMapReportResult> {
    if (this.#nextError) {
      const result = this.#nextError;
      this.#nextError = null;
      return result;
    }
    if (!request.publicLeadId || !request.reason || !request.actionId)
      return { ok: false, code: "INVALID_REQUEST" };
    const duplicate = this.#processed.has(request.actionId);
    this.#processed.add(request.actionId);
    return { ok: true, duplicate };
  }
}

type Listener = (state: PublicMapReportState) => void;

export class PublicMapReportClient {
  readonly #service: PublicMapReportService;
  readonly #listeners = new Set<Listener>();
  #sequence = 0;
  #state: PublicMapReportState = {
    phase: "CLOSED",
    publicLeadId: null,
    category: "STALE_OR_SOLD",
    errorMessage: "",
  };

  constructor(service: PublicMapReportService) {
    this.#service = service;
  }

  get state(): PublicMapReportState {
    return this.#state;
  }

  subscribe(listener: Listener): () => void {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => this.#listeners.delete(listener);
  }

  open(publicLeadId: string): void {
    if (!publicLeadId) return;
    this.#setState({
      phase: "OPEN",
      publicLeadId,
      category: "STALE_OR_SOLD",
      errorMessage: "",
    });
  }

  selectCategory(category: PublicMapReportCategory): void {
    if (this.#state.phase === "OPEN" || this.#state.phase === "ERROR")
      this.#setState({ category, errorMessage: "" });
  }

  close(): void {
    if (this.#state.phase === "SUBMITTING") return;
    this.#setState({ phase: "CLOSED", publicLeadId: null, errorMessage: "" });
  }

  async submit(): Promise<void> {
    if (
      (this.#state.phase !== "OPEN" && this.#state.phase !== "ERROR") ||
      !this.#state.publicLeadId
    )
      return;
    const publicLeadId = this.#state.publicLeadId;
    const category = this.#state.category;
    const actionId = `report:${publicLeadId}:${category}:${++this.#sequence}`;
    this.#setState({ phase: "SUBMITTING", errorMessage: "" });
    const result = await this.#service.submit({
      publicLeadId,
      category,
      reason: category,
      actionId,
    });
    if (!result.ok) {
      this.#setState({
        phase: "ERROR",
        errorMessage:
          result.code === "UNAUTHORIZED"
            ? "账号状态需要恢复后才能提交。"
            : result.code === "SERVICE_UNAVAILABLE"
              ? "反馈服务暂时不可用，请重试。"
              : "请选择有效的反馈原因。",
      });
      return;
    }
    this.#setState({ phase: "SUCCEEDED", errorMessage: "" });
  }

  #setState(update: Partial<PublicMapReportState>): void {
    this.#state = { ...this.#state, ...update };
    for (const listener of this.#listeners) listener(this.#state);
  }
}
