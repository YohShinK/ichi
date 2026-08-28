import { describe, expect, it } from "vitest";

import {
  FINAL_PROGRESS_MAX_DURATION_MS,
  RecognitionProgressAnimator,
  type RecognitionFrameScheduler,
  type RecognitionProgressSnapshot,
} from "./recognition-progress.js";

class ManualFrameScheduler implements RecognitionFrameScheduler {
  private timestamp = 0;
  private sequence = 0;
  private callbacks = new Map<number, (timestamp: number) => void>();

  now(): number {
    return this.timestamp;
  }

  requestFrame(callback: (timestamp: number) => void): number {
    const id = ++this.sequence;
    this.callbacks.set(id, callback);
    return id;
  }

  cancelFrame(handle: unknown): void {
    this.callbacks.delete(Number(handle));
  }

  frame(milliseconds = 16): void {
    this.timestamp += milliseconds;
    const callbacks = [...this.callbacks.values()];
    this.callbacks.clear();
    callbacks.forEach((callback) => callback(this.timestamp));
  }

  runFor(milliseconds: number): void {
    const end = this.timestamp + milliseconds;
    while (this.timestamp < end && this.callbacks.size)
      this.frame(Math.min(16, end - this.timestamp));
  }

  get pendingFrames(): number {
    return this.callbacks.size;
  }
}

const createAnimator = (initialDisplay = 0) => {
  const scheduler = new ManualFrameScheduler();
  const snapshots: RecognitionProgressSnapshot[] = [];
  const animator = new RecognitionProgressAnimator(
    scheduler,
    (snapshot) => snapshots.push(snapshot),
    { displayProgress: initialDisplay, targetProgress: 15, stage: 0 },
  );
  animator.start();
  return { animator, scheduler, snapshots };
};

describe("recognition progress animator", () => {
  it("does not jump display progress when target advances from 15 to 35", () => {
    const { animator, scheduler } = createAnimator();
    scheduler.runFor(160);
    const before = animator.snapshot().displayProgress;
    animator.advance("photo-prepared");
    expect(animator.snapshot()).toMatchObject({ targetProgress: 35, stage: 1 });
    expect(animator.snapshot().displayProgress).toBe(before);
    scheduler.frame();
    expect(animator.snapshot().displayProgress).toBeGreaterThan(before);
    expect(animator.snapshot().displayProgress).toBeLessThan(35);
  });

  it("never crosses the provider-stage cap before a real response", () => {
    const { animator, scheduler } = createAnimator();
    animator.advance("photo-prepared");
    animator.advance("request-dispatched");
    scheduler.runFor(30_000);
    expect(animator.snapshot().targetProgress).toBe(80);
    expect(animator.snapshot().displayProgress).toBeLessThan(80);
    expect(animator.snapshot().stage).toBe(2);
  });

  it("finishes smoothly from 72 before completion becomes consumable", async () => {
    const scheduler = new ManualFrameScheduler();
    const animator = new RecognitionProgressAnimator(scheduler, () => {}, {
      displayProgress: 72,
      targetProgress: 80,
      stage: 2,
    });
    animator.start();
    const finished = animator.finishProgressAnimation();
    expect(animator.consumeCompletion()).toBe(false);
    scheduler.runFor(FINAL_PROGRESS_MAX_DURATION_MS);
    await expect(finished).resolves.toBe(true);
    expect(animator.snapshot()).toMatchObject({
      displayProgress: 100,
      stage: 4,
    });
    expect(animator.consumeCompletion()).toBe(true);
  });

  it("still renders the complete 98 to 100 finish", async () => {
    const scheduler = new ManualFrameScheduler();
    const displays: number[] = [];
    const animator = new RecognitionProgressAnimator(
      scheduler,
      ({ displayProgress }) => displays.push(displayProgress),
      { displayProgress: 98, targetProgress: 99, stage: 3 },
    );
    animator.start();
    const finished = animator.finishProgressAnimation();
    scheduler.runFor(150);
    await expect(finished).resolves.toBe(true);
    expect(displays.some((value) => value > 98 && value < 100)).toBe(true);
    expect(displays.at(-1)).toBe(100);
  });

  it("does not expose completion before display reaches 100", () => {
    const { animator, scheduler } = createAnimator(72);
    void animator.finishProgressAnimation();
    scheduler.runFor(100);
    expect(animator.snapshot().displayProgress).toBeLessThan(100);
    expect(animator.consumeCompletion()).toBe(false);
  });

  it("allows completion to be consumed only once", async () => {
    const { animator, scheduler } = createAnimator(98);
    const finished = animator.finishProgressAnimation();
    scheduler.runFor(150);
    await finished;
    expect(animator.consumeCompletion()).toBe(true);
    expect(animator.consumeCompletion()).toBe(false);
  });

  it("stops a failed recognition without ever targeting or animating to 100", () => {
    const { animator, scheduler } = createAnimator(45);
    animator.advance("request-dispatched");
    scheduler.frame();
    expect(animator.snapshot().targetProgress).toBe(80);
    animator.stop();
    scheduler.runFor(1_000);
    expect(animator.snapshot().targetProgress).toBe(80);
    expect(animator.snapshot().displayProgress).toBeLessThan(100);
  });

  it("cancels the animation frame on page-style teardown", () => {
    const { animator, scheduler } = createAnimator();
    expect(scheduler.pendingFrames).toBe(1);
    animator.stop();
    expect(scheduler.pendingFrames).toBe(0);
    expect(animator.snapshot().running).toBe(false);
  });
});
