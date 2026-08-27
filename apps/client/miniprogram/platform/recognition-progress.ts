export type RecognitionProgressStage = 0 | 1 | 2 | 3 | 4;

export type RecognitionProgressEvent =
  | "photo-prepared"
  | "request-dispatched"
  | "response-received"
  | "result-ready";

export interface RecognitionProgressSnapshot {
  readonly targetProgress: number;
  readonly displayProgress: number;
  readonly stage: RecognitionProgressStage;
  readonly resultReady: boolean;
  readonly running: boolean;
}

export interface RecognitionFrameScheduler {
  now(): number;
  requestFrame(callback: (timestamp: number) => void): unknown;
  cancelFrame(handle: unknown): void;
}

const EVENT_TARGETS: Record<
  RecognitionProgressEvent,
  { readonly target: number; readonly stage: RecognitionProgressStage }
> = {
  "photo-prepared": { target: 35, stage: 1 },
  "request-dispatched": { target: 80, stage: 2 },
  "response-received": { target: 99, stage: 3 },
  "result-ready": { target: 100, stage: 3 },
};

const WAITING_TARGET_GAP = 0.2;
export const FINAL_PROGRESS_MAX_DURATION_MS = 420;

const finalDuration = (gap: number): number =>
  Math.min(
    FINAL_PROGRESS_MAX_DURATION_MS,
    Math.max(100, 120 + Math.max(0, gap) * 4),
  );

const easeOutCubic = (value: number): number =>
  1 - Math.pow(1 - Math.min(1, Math.max(0, value)), 3);

export class RecognitionProgressAnimator {
  private targetProgress = 15;
  private displayProgress = 0;
  private stage: RecognitionProgressStage = 0;
  private resultReady = false;
  private running = false;
  private stopped = false;
  private completionClaimed = false;
  private frameHandle: unknown;
  private lastFrameAt = 0;
  private finalStartedAt = 0;
  private finalStartedFrom = 0;
  private finalDurationMs = 0;
  private finishWaiters: Array<(completed: boolean) => void> = [];

  constructor(
    private readonly scheduler: RecognitionFrameScheduler,
    private readonly onDisplay: (snapshot: RecognitionProgressSnapshot) => void,
    initial?: {
      readonly displayProgress?: number;
      readonly targetProgress?: number;
      readonly stage?: RecognitionProgressStage;
    },
  ) {
    this.displayProgress = Math.min(
      100,
      Math.max(0, initial?.displayProgress ?? 0),
    );
    this.targetProgress = Math.min(
      100,
      Math.max(this.displayProgress, initial?.targetProgress ?? 15),
    );
    this.stage = initial?.stage ?? 0;
  }

  start(): void {
    if (this.stopped) return;
    this.emit();
    this.ensureFrame();
  }

  advance(event: RecognitionProgressEvent): void {
    if (this.stopped) return;
    const next = EVENT_TARGETS[event];
    this.targetProgress = Math.max(this.targetProgress, next.target);
    this.stage = Math.max(this.stage, next.stage) as RecognitionProgressStage;
    if (event === "result-ready") {
      this.resultReady = true;
      this.finalStartedAt = 0;
    }
    this.emit();
    this.ensureFrame();
  }

  finishProgressAnimation(): Promise<boolean> {
    if (this.stopped) return Promise.resolve(false);
    if (!this.resultReady) this.advance("result-ready");
    if (this.displayProgress === 100) {
      this.stage = 4;
      this.emit();
      return Promise.resolve(true);
    }
    return new Promise((resolve) => {
      this.finishWaiters.push(resolve);
      this.ensureFrame();
    });
  }

  consumeCompletion(): boolean {
    if (this.displayProgress !== 100 || this.stage !== 4) return false;
    if (this.completionClaimed) return false;
    this.completionClaimed = true;
    return true;
  }

  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    this.running = false;
    if (this.frameHandle !== undefined)
      this.scheduler.cancelFrame(this.frameHandle);
    this.frameHandle = undefined;
    this.resolveWaiters(false);
    this.emit();
  }

  snapshot(): RecognitionProgressSnapshot {
    return {
      targetProgress: this.targetProgress,
      displayProgress: this.displayProgress,
      stage: this.stage,
      resultReady: this.resultReady,
      running: this.running,
    };
  }

  private ensureFrame(): void {
    if (this.stopped || this.running) return;
    const waitingTarget = Math.max(0, this.targetProgress - WAITING_TARGET_GAP);
    if (!this.resultReady && this.displayProgress >= waitingTarget) return;
    this.running = true;
    this.lastFrameAt = 0;
    this.frameHandle = this.scheduler.requestFrame((timestamp) =>
      this.onFrame(timestamp),
    );
  }

  private onFrame(timestamp: number): void {
    if (this.stopped) return;
    const dt = this.lastFrameAt
      ? Math.min(50, Math.max(1, timestamp - this.lastFrameAt))
      : 16;
    this.lastFrameAt = timestamp;
    if (this.resultReady) {
      if (!this.finalStartedAt) {
        this.finalStartedAt = timestamp;
        this.finalStartedFrom = this.displayProgress;
        this.finalDurationMs = finalDuration(100 - this.displayProgress);
      }
      const elapsed = Math.max(0, timestamp - this.finalStartedAt);
      const ratio = easeOutCubic(elapsed / this.finalDurationMs);
      this.displayProgress =
        this.finalStartedFrom + (100 - this.finalStartedFrom) * ratio;
      if (elapsed >= this.finalDurationMs || this.displayProgress >= 99.995) {
        this.displayProgress = 100;
        this.targetProgress = 100;
        this.stage = 4;
        this.running = false;
        this.frameHandle = undefined;
        this.emit();
        this.resolveWaiters(true);
        return;
      }
    } else {
      const effectiveTarget = Math.max(
        0,
        this.targetProgress - WAITING_TARGET_GAP,
      );
      const distance = effectiveTarget - this.displayProgress;
      if (distance <= 0.01) {
        this.displayProgress = effectiveTarget;
        this.running = false;
        this.frameHandle = undefined;
        this.emit();
        return;
      }
      const timeConstant = distance > 20 ? 620 : distance > 8 ? 820 : 1100;
      const factor = 1 - Math.exp(-dt / timeConstant);
      this.displayProgress = Math.min(
        effectiveTarget,
        this.displayProgress + distance * factor,
      );
    }
    this.emit();
    this.frameHandle = this.scheduler.requestFrame((nextTimestamp) =>
      this.onFrame(nextTimestamp),
    );
  }

  private emit(): void {
    this.onDisplay(this.snapshot());
  }

  private resolveWaiters(completed: boolean): void {
    const waiters = this.finishWaiters;
    this.finishWaiters = [];
    waiters.forEach((resolve) => resolve(completed));
  }
}
