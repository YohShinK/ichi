import {
  getWxCandidateEnvVersion,
  type CandidateCloudApi,
  type CandidateEnvVersion,
} from "./public-map-candidate-service.js";

export type ReportCommand = "GET_STATE" | "REPORT" | "CANCEL_REPORT";
export type ReportResult =
  | {
      readonly ok: true;
      readonly active: boolean;
      readonly hidden: boolean;
      readonly policyVersion: string;
    }
  | { readonly ok: false };
export interface ReportingService {
  command(
    publicLeadId: string,
    command: ReportCommand,
    actionId?: string,
  ): Promise<ReportResult>;
}

/** Candidate transport only; no synthetic success or client reporter assertions. */
export class CandidateReportingService implements ReportingService {
  constructor(
    readonly cloud: CandidateCloudApi | null,
    readonly version: CandidateEnvVersion,
    readonly target: "candidate" | "production" = "candidate",
  ) {}
  async command(
    publicLeadId: string,
    command: ReportCommand,
    actionId?: string,
  ): Promise<ReportResult> {
    if (
      !this.cloud ||
      !(
        this.target === "production"
          ? ["develop", "trial", "release"]
          : ["develop", "trial"]
      ).includes(this.version) ||
      !/^[a-f0-9]{32}$/u.test(publicLeadId)
    )
      return { ok: false };
    try {
      const { result } = await this.cloud.callFunction({
        name:
          this.target === "production"
            ? "report-public-map-lead"
            : "v2-shadow-report-public-map-lead",
        data: { publicLeadId, command, ...(actionId ? { actionId } : {}) },
      });
      if (!result || typeof result !== "object") return { ok: false };
      const value = result as Record<string, unknown>;
      if (
        value.ok !== true ||
        typeof value.active !== "boolean" ||
        typeof value.hidden !== "boolean" ||
        value.policyVersion !== "v2-21-report-policy-1"
      )
        return { ok: false };
      return {
        ok: true,
        active: value.active,
        hidden: value.hidden,
        policyVersion: value.policyVersion,
      };
    } catch {
      return { ok: false };
    }
  }
}

export const createWxReportingService = (): ReportingService =>
  new CandidateReportingService(
    typeof wx !== "undefined" && typeof wx.cloud?.callFunction === "function"
      ? (wx.cloud as unknown as CandidateCloudApi)
      : null,
    getWxCandidateEnvVersion(),
    "production",
  );

export interface ReportingState {
  readonly publicLeadId: string;
  readonly active: boolean;
  readonly known: boolean;
  readonly busy: boolean;
  readonly message: string;
}

export class PublicMapReportingClient {
  #state: ReportingState = {
    publicLeadId: "",
    active: false,
    known: false,
    busy: false,
    message: "",
  };
  #generation = 0;
  readonly #listeners = new Set<(state: ReportingState) => void>();
  readonly #inflight = new Set<string>();
  readonly #pending = new Map<
    string,
    { command: ReportCommand; actionId: string }
  >();
  constructor(
    readonly service: ReportingService,
    readonly onHidden: (id: string) => void = () => {},
  ) {}
  get state(): ReportingState {
    return this.#state;
  }
  subscribe(listener: (state: ReportingState) => void): () => void {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => this.#listeners.delete(listener);
  }
  async select(publicLeadId: string, refresh = false): Promise<void> {
    if (publicLeadId === this.#state.publicLeadId && !refresh) return;
    const generation = ++this.#generation;
    this.#set({
      publicLeadId,
      active: false,
      known: false,
      busy: Boolean(publicLeadId),
      message: "",
    });
    if (!publicLeadId) {
      this.#set({ busy: false });
      return;
    }
    let result: ReportResult;
    try {
      result = await this.service.command(publicLeadId, "GET_STATE");
    } catch {
      result = { ok: false };
    }
    if (generation !== this.#generation) return;
    this.#set({
      busy: false,
      known: result.ok,
      active: result.ok && result.active,
    });
  }
  async toggle(): Promise<void> {
    await this.#mutate(this.#state.active ? "CANCEL_REPORT" : "REPORT");
  }
  async cancel(): Promise<void> {
    await this.#mutate("CANCEL_REPORT");
  }
  async #mutate(command: "REPORT" | "CANCEL_REPORT"): Promise<void> {
    const { publicLeadId, busy } = this.#state;
    if (!publicLeadId || busy || this.#inflight.has(publicLeadId)) return;
    // Resolve an ambiguous retry before allowing a conflicting command.
    let pending = this.#pending.get(publicLeadId);
    if (!pending) {
      pending = {
        command,
        actionId: `report-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`,
      };
      this.#pending.set(publicLeadId, pending);
    }
    const generation = this.#generation;
    this.#inflight.add(publicLeadId);
    this.#set({ busy: true, message: "" });
    let result: ReportResult;
    try {
      result = await this.service.command(
        publicLeadId,
        pending.command,
        pending.actionId,
      );
    } catch {
      result = { ok: false };
    }
    this.#inflight.delete(publicLeadId);
    if (result.ok) this.#pending.delete(publicLeadId);
    if (generation === this.#generation)
      this.#set({
        busy: false,
        ...(result.ok
          ? {
              active: result.active,
              known: true,
              message: result.active ? "你已举报这条信息" : "",
            }
          : {
              message:
                pending.command === "CANCEL_REPORT"
                  ? "取消失败，请重试"
                  : "举报失败，请重试",
            }),
      });
    else if (this.#state.publicLeadId === publicLeadId) {
      // A -> B -> A during a write must read the committed state again.
      await this.select(publicLeadId, true);
      if (!result.ok && this.#state.publicLeadId === publicLeadId)
        this.#set({
          message:
            pending.command === "CANCEL_REPORT"
              ? "取消失败，请重试"
              : "举报失败，请重试",
        });
    }
    if (result.ok && result.hidden) this.onHidden(publicLeadId);
  }
  #set(update: Partial<ReportingState>): void {
    this.#state = { ...this.#state, ...update };
    for (const listener of this.#listeners) listener(this.#state);
  }
}
